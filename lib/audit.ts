// Core audit logic for OpenReady.
// Takes a public GitHub repo, runs open-source readiness checks, returns a 0-100 score.

export type Check = {
  id: string;
  label: string;
  points: number; // points earned
  maxPoints: number; // points available
  passed: boolean;
  why: string; // why this check matters (shown to the user)
  detail?: string; // extra info when something is missing
};

export type AuditResult = {
  repo: string;
  url: string;
  description: string | null;
  score: number;
  checks: Check[];
};

export class AuditError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

type TreeItem = { path: string; type: string };

// Accepts "https://github.com/owner/name", "github.com/owner/name" or "owner/name".
export function parseRepo(input: string): { owner: string; name: string } | null {
  const cleaned = input
    .trim()
    .replace(/^https?:\/\/(www\.)?github\.com\//i, "")
    .replace(/^github\.com\//i, "")
    .replace(/\/+$/, "")
    .replace(/\.git$/, "");
  const parts = cleaned.split("/");
  if (parts.length < 2) return null;
  const [owner, name] = parts;
  if (!/^[\w.-]+$/.test(owner) || !/^[\w.-]+$/.test(name)) return null;
  return { owner, name };
}

// Small helper to call the GitHub REST API.
// A token is optional, but raises the rate limit from 60 to 5000 requests/hour.
function gh(path: string) {
  const headers: Record<string, string> = {
    Accept: "application/vnd.github+json",
  };
  if (process.env.GITHUB_TOKEN) {
    headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  }
  return fetch(`https://api.github.com${path}`, { headers, cache: "no-store" });
}

async function getReadme(owner: string, name: string): Promise<string | null> {
  const res = await gh(`/repos/${owner}/${name}/readme`);
  if (!res.ok) return null;
  const data: { content?: string } = await res.json();
  if (!data.content) return null;
  return Buffer.from(data.content, "base64").toString("utf-8");
}

// Files that should never be committed (checked by file name only, not content).
const RISKY_FILE =
  /(^|\/)(\.env(\..+)?|id_rsa|id_dsa|[^/]*\.pem|[^/]*\.p12|[^/]*\.pfx|credentials\.json|serviceaccount[^/]*\.json)$/i;
const SAFE_ENV = /\.(example|sample|template|dist)$/i;

export async function runAudit(owner: string, name: string): Promise<AuditResult> {
  // 1. Basic repo info
  const repoRes = await gh(`/repos/${owner}/${name}`);
  if (repoRes.status === 404) {
    throw new AuditError(404, "Repository not found. Check the URL, and note that private repos are not supported.");
  }
  if (repoRes.status === 403 || repoRes.status === 429) {
    throw new AuditError(429, "GitHub rate limit reached. Try again later or add a GITHUB_TOKEN.");
  }
  if (!repoRes.ok) {
    throw new AuditError(502, "Could not reach GitHub. Please try again.");
  }
  const repo: {
    html_url: string;
    full_name: string;
    description: string | null;
    topics?: string[];
    default_branch: string;
    pushed_at: string;
  } = await repoRes.json();

  // 2. Full file list of the default branch
  const treeRes = await gh(`/repos/${owner}/${name}/git/trees/${repo.default_branch}?recursive=1`);
  const tree: { tree?: TreeItem[] } = treeRes.ok ? await treeRes.json() : {};
  const paths = (tree.tree ?? []).filter((t) => t.type === "blob").map((t) => t.path);
  const rootFiles = paths.filter((p) => !p.includes("/")).map((p) => p.toLowerCase());

  // 3. README text (for section checks)
  const readme = await getReadme(owner, name);
  const headings = readme
    ? readme
        .split("\n")
        .filter((line) => /^#{1,6}\s/.test(line))
        .join("\n")
        .toLowerCase()
    : "";

  const checks: Check[] = [];
  const add = (c: Omit<Check, "passed">) =>
    checks.push({ ...c, passed: c.points === c.maxPoints });

  // LICENSE (25)
  const hasLicense = rootFiles.some((f) => /^(license|licence|copying)(\.|$)/.test(f));
  add({
    id: "license",
    label: "LICENSE file",
    points: hasLicense ? 25 : 0,
    maxPoints: 25,
    why: "Without a license, nobody is legally allowed to use or contribute to your code, even if the repo is public.",
    detail: hasLicense ? undefined : "No LICENSE file found in the repository root.",
  });

  // README present (10)
  add({
    id: "readme",
    label: "README file",
    points: readme ? 10 : 0,
    maxPoints: 10,
    why: "The README is the first thing visitors see. It tells them what the project is.",
    detail: readme ? undefined : "No README found.",
  });

  // README sections (15 = 5 + 5 + 5)
  const hasSetup = /(install|setup|set up|getting started|quick ?start|run)/.test(headings);
  const hasUsage = /(usage|how to use|features|demo|example)/.test(headings);
  const hasLicenseSection = /licen[cs]e/.test(headings);
  const missingSections: string[] = [];
  if (!hasSetup) missingSections.push("setup/install");
  if (!hasUsage) missingSections.push("usage/features");
  if (!hasLicenseSection) missingSections.push("license");
  add({
    id: "readme-sections",
    label: "README sections (setup, usage, license)",
    points: (hasSetup ? 5 : 0) + (hasUsage ? 5 : 0) + (hasLicenseSection ? 5 : 0),
    maxPoints: 15,
    why: "People need to know how to install and use your project, and under which license.",
    detail: missingSections.length ? `Missing headings: ${missingSections.join(", ")}.` : undefined,
  });

  // CONTRIBUTING (10)
  const hasContributing = paths.some((p) => /^(\.github\/|docs\/)?contributing(\.[a-z]+)?$/i.test(p));
  add({
    id: "contributing",
    label: "CONTRIBUTING guide",
    points: hasContributing ? 10 : 0,
    maxPoints: 10,
    why: "A contributing guide tells newcomers how to help, which is what makes a project truly open source.",
    detail: hasContributing ? undefined : "No CONTRIBUTING.md found.",
  });

  // .gitignore (10)
  const hasGitignore = rootFiles.includes(".gitignore");
  add({
    id: "gitignore",
    label: ".gitignore file",
    points: hasGitignore ? 10 : 0,
    maxPoints: 10,
    why: "It keeps junk files and secrets (like .env) out of your repository.",
    detail: hasGitignore ? undefined : "No .gitignore found in the repository root.",
  });

  // Secret risk (15)
  const risky = paths.filter(
    (p) => RISKY_FILE.test(p) && !SAFE_ENV.test(p) && !p.includes("node_modules/")
  );
  add({
    id: "secrets",
    label: "No secret-looking files committed",
    points: risky.length === 0 ? 15 : 0,
    maxPoints: 15,
    why: "Committed API keys and credentials can be stolen within minutes. This check looks at file names only, not file contents.",
    detail: risky.length ? `Suspicious files: ${risky.slice(0, 5).join(", ")}` : undefined,
  });

  // Description and topics (5 = 3 + 2)
  const hasDescription = Boolean(repo.description && repo.description.trim());
  const hasTopics = (repo.topics ?? []).length > 0;
  const missingMeta: string[] = [];
  if (!hasDescription) missingMeta.push("description");
  if (!hasTopics) missingMeta.push("topics");
  add({
    id: "metadata",
    label: "Repo description and topics",
    points: (hasDescription ? 3 : 0) + (hasTopics ? 2 : 0),
    maxPoints: 5,
    why: "A description and topics help other people find your project on GitHub.",
    detail: missingMeta.length ? `Missing: ${missingMeta.join(", ")}.` : undefined,
  });

  // Recent activity (10)
  const daysSincePush = (Date.now() - new Date(repo.pushed_at).getTime()) / (1000 * 60 * 60 * 24);
  const activityPoints = daysSincePush <= 90 ? 10 : daysSincePush <= 365 ? 5 : 0;
  add({
    id: "activity",
    label: "Recent activity",
    points: activityPoints,
    maxPoints: 10,
    why: "Contributors prefer projects that are maintained.",
    detail:
      activityPoints === 10 ? undefined : `Last push was about ${Math.round(daysSincePush)} days ago.`,
  });

  const score = checks.reduce((sum, c) => sum + c.points, 0);

  return {
    repo: repo.full_name,
    url: repo.html_url,
    description: repo.description,
    score,
    checks,
  };
}
