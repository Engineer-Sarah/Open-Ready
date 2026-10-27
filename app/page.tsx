"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import type { AuditResult } from "@/lib/audit";
import { FIXES } from "@/lib/templates";
import JSZip from "jszip";

const EXAMPLES = ["Engineer-Sarah/Open-Ready", "vercel/next.js", "facebook/react"];

const MATCHUPS = [
  { label: "⚔️ OpenReady vs Next.js", r1: "Engineer-Sarah/Open-Ready", r2: "vercel/next.js" },
  { label: "⚔️ OpenReady vs React", r1: "Engineer-Sarah/Open-Ready", r2: "facebook/react" },
  { label: "⚔️ Next.js vs React", r1: "vercel/next.js", r2: "facebook/react" },
];

const STATS = [
  { val: "8 Pillars", label: "Security & Open Governance" },
  { val: "100 Pts", label: "Multi-Heuristic Score Matrix" },
  { val: "0 Sign-Ups", label: "Frictionless & 100% Client-Side" },
  { val: "< 2 Secs", label: "Deep GitHub AST & Tree Scan" },
];

const CHECKS_LIST = [
  { id: "license", name: "LICENSE File", pts: 25, desc: "Legal permission protecting contributors, forks, and maintainers." },
  { id: "readme", name: "README Overview", pts: 10, desc: "Primary landing page explaining the problem, solution, and tech." },
  { id: "sections", name: "Architecture Headings", pts: 15, desc: "Mandatory Setup, Usage, and License documentation structure." },
  { id: "contributing", name: "CONTRIBUTING Guide", pts: 10, desc: "Clear guidelines on how newcomers can open PRs and issues." },
  { id: "gitignore", name: ".gitignore Hygiene", pts: 10, desc: "Omits temporary build caches, node_modules, and OS junk." },
  { id: "secrets", name: "Zero Secret Risk", pts: 15, desc: "Scans for exposed .env, credentials, and private key files." },
  { id: "metadata", name: "Tags & Discoverability", pts: 5, desc: "Essential GitHub topics and repository search description." },
  { id: "activity", name: "Maintenance Momentum", pts: 10, desc: "Verifies active commits within the healthy 90-day window." },
];

const FAQS = [
  {
    q: "How does OpenReady differ from conventional code linters?",
    a: "Standard linters inspect code syntax. OpenReady audits open-source repository governance, licensing validity, secret exposure, and contributor onboarding readiness to ensure your project is legally and practically ready for external contributors.",
  },
  {
    q: "Does OpenReady read private code or store repository data?",
    a: "Never! OpenReady operates completely statelessly through public GitHub REST endpoints. We never store source code, and zero authentication permissions are required.",
  },
  {
    q: "How do I raise the 60 requests/hour GitHub rate limit?",
    a: "By default, unauthenticated GitHub API calls are capped at 60/hr. You can add an optional GITHUB_TOKEN in Settings (or .env.local) to raise your limit to 5,000 requests per hour.",
  },
  {
    q: "How was Kiro integrated into OpenReady?",
    a: "Kiro was our development companion during the Hacktoberfest Hackathon NUST x NSTP to formulate the 8-pillar audit model, scaffold TypeScript schemas, optimize Gemini prompt engineering, and engineer model fallback pipelines.",
  },
  {
    q: "Can I embed the score badge into my project's README?",
    a: "Yes! OpenReady dynamically serves live SVG badges via /api/badge?repo=owner/name. Any time you push fixes to your repository, the badge reflects your updated score automatically.",
  },
];

function tone(score: number) {
  if (score >= 80)
    return {
      text: "text-emerald-400",
      stroke: "stroke-emerald-400",
      badge: "border-emerald-500/30 bg-emerald-500/10 text-emerald-300",
      label: "Open-Source Ready",
    };
  if (score >= 50)
    return {
      text: "text-amber-400",
      stroke: "stroke-amber-400",
      badge: "border-amber-500/30 bg-amber-500/10 text-amber-300",
      label: "Almost Ready",
    };
  return {
    text: "text-rose-400",
    stroke: "stroke-rose-400",
    badge: "border-rose-500/30 bg-rose-500/10 text-rose-300",
    label: "Needs Critical Work",
  };
}

function Gauge({ score }: { score: number }) {
  const [shown, setShown] = useState(0);
  useEffect(() => {
    const timer = setTimeout(() => setShown(score), 80);
    return () => clearTimeout(timer);
  }, [score]);

  const r = 68;
  const c = 2 * Math.PI * r;
  const t = tone(score);

  return (
    <div className="relative h-44 w-44 shrink-0">
      <svg viewBox="0 0 180 180" className="h-full w-full -rotate-90">
        <circle cx="90" cy="90" r={r} fill="none" strokeWidth="12" className="stroke-white/[0.06]" />
        <circle
          cx="90"
          cy="90"
          r={r}
          fill="none"
          strokeWidth="12"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c - (shown / 100) * c}
          className={`${t.stroke} transition-all duration-1000 ease-out`}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={`text-5xl font-black tracking-tight ${t.text}`}>{score}</span>
        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Score / 100</span>
      </div>
    </div>
  );
}

export default function Home() {
  const [mode, setMode] = useState<"single" | "battle">("single");
  const [repo, setRepo] = useState("");
  const [repo2, setRepo2] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [result, setResult] = useState<AuditResult | null>(null);
  const [result2, setResult2] = useState<AuditResult | null>(null);

  const [aiText, setAiText] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);

  const [generatedReadme, setGeneratedReadme] = useState<string | null>(null);
  const [readmeLoading, setReadmeLoading] = useState(false);

  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [showSettings, setShowSettings] = useState(false);

  const [aiTone, setAiTone] = useState("friendly");
  const [ghToken, setGhToken] = useState("");

 const resultRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const savedToken = localStorage.getItem("openready_gh_token");
    if (savedToken) setGhToken(savedToken);
  }, []);

  function saveSettings() {
    localStorage.setItem("openready_gh_token", ghToken);
    setShowSettings(false);
  }

  async function auditApi(target: string) {
    const res = await fetch("/api/audit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ repo: target.trim() }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || `Audit failed for ${target}`);
    return data as AuditResult;
  }

  async function handleAudit(e: FormEvent) {
    e.preventDefault();
    if (!repo.trim()) return;
    setLoading(true);
    setError(null);
    setResult(null);
    setResult2(null);
    setAiText(null);
    setGeneratedReadme(null);

    try {
      if (mode === "single") {
        const res = await auditApi(repo);
        setResult(res);
        setTimeout(() => resultRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
      } else {
        if (!repo2.trim()) throw new Error("Please enter both repositories for Battle mode.");
        const [r1, r2] = await Promise.all([auditApi(repo), auditApi(repo2)]);
        setResult(r1);
        setResult2(r2);
        setTimeout(() => resultRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
      }
    } catch (err: any) {
      setError(err.message || "Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  function handleExampleClick(target: string) {
    if (mode === "single") {
      setRepo(target);
    } else {
      // Smart Battle fill: if repo1 is empty, fill repo1. If filled, fill repo2!
      if (!repo.trim()) {
        setRepo(target);
      } else if (!repo2.trim()) {
        setRepo2(target);
      } else {
        setRepo2(target);
      }
    }
  }

  function swapRepos() {
    const temp = repo;
    setRepo(repo2);
    setRepo2(temp);
  }

  async function askAi() {
    if (!result) return;
    setAiLoading(true);
    try {
      const res = await fetch("/api/explain", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          repo: result.repo,
          score: result.score,
          failed: result.checks.filter((c) => !c.passed).map((c) => ({ label: c.label, detail: c.detail, why: c.why })),
        }),
      });
      const data = await res.json();
      if (res.ok) setAiText(data.text);
      else setAiText("AI explanation could not be generated at this time.");
    } catch {
      setAiText("Failed to reach Google Gemini AI service.");
    } finally {
      setAiLoading(false);
    }
  }

  async function generateFullReadme() {
    if (!result) return;
    setReadmeLoading(true);
    try {
      const res = await fetch("/api/generate-readme", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ repo: result.repo, description: result.description }),
      });
      const data = await res.json();
      if (res.ok) setGeneratedReadme(data.readme);
      else setError("Failed to generate AI README.");
    } catch {
      setError("AI generation failed.");
    } finally {
      setReadmeLoading(false);
    }
  }

  async function downloadFixZip() {
    if (!result) return;
    const zip = new JSZip();
    const failedIds = result.checks.filter((c) => !c.passed).map((c) => c.id);

    failedIds.forEach((id) => {
      const fix = FIXES[id];
      if (fix && fix.file && fix.body) {
        zip.file(fix.file, fix.body);
      }
    });

    const content = await zip.generateAsync({ type: "blob" });
    const url = URL.createObjectURL(content);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${result.repo.replace("/", "-")}-openready-fixes.zip`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function downloadAuditReport() {
    if (!result) return;
    const report = `# OpenReady Audit Report
- Repository: ${result.repo}
- Score: ${result.score}/100 (${tone(result.score).label})
- Generated: ${new Date().toLocaleDateString()}

## Breakdown:
${result.checks.map((c) => `- [${c.passed ? "X" : " "}] ${c.label}: ${c.points}/${c.maxPoints} pts (${c.why})`).join("\n")}

Generated by OpenReady (https://github.com/Engineer-Sarah/Open-Ready)
`;
    const blob = new Blob([report], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${result.repo.replace("/", "-")}-audit-report.md`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function copyText(txt: string, key: string) {
    navigator.clipboard.writeText(txt);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 1500);
  }

  return (
    <div
      className="min-h-screen text-slate-100 selection:bg-fuchsia-500 selection:text-white"
      style={{
        background:
          "radial-gradient(ellipse 90% 50% at 50% -20%, rgba(168, 85, 247, 0.22), transparent), radial-gradient(ellipse 60% 40% at 85% 15%, rgba(236, 72, 153, 0.16), transparent), radial-gradient(ellipse 50% 30% at 15% 25%, rgba(56, 189, 248, 0.12), transparent), #05060b",
      }}
    >
      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
          <div className="w-full max-w-md rounded-3xl border border-violet-500/20 bg-slate-900/90 p-6 shadow-[0_0_50px_rgba(168,85,247,0.15)] backdrop-blur-xl">
            <h3 className="text-xl font-black tracking-tight text-white">Platform Settings & Token</h3>
            <p className="mt-1 text-xs text-slate-400">Configure your personal preferences and GitHub rate limits.</p>

            <div className="mt-5 space-y-4">
              <div>
                <label className="text-xs font-semibold text-violet-300">GitHub Personal Access Token (Optional)</label>
                <input
                  type="password"
                  value={ghToken}
                  onChange={(e) => setGhToken(e.target.value)}
                  placeholder="ghp_xxxxxxxxxxxx"
                  className="mt-1.5 w-full rounded-xl border border-white/10 bg-black/60 px-3.5 py-2.5 text-xs text-slate-100 placeholder:text-slate-600 focus:border-fuchsia-500 focus:outline-none"
                />
                <span className="mt-1 block text-[11px] text-slate-500">Raises API rate limit from 60 to 5,000 requests/hour.</span>
              </div>

              <div>
                <label className="text-xs font-semibold text-violet-300">AI Mentor Persona</label>
                <select
                  value={aiTone}
                  onChange={(e) => setAiTone(e.target.value)}
                  className="mt-1.5 w-full rounded-xl border border-white/10 bg-black/60 px-3.5 py-2.5 text-xs text-slate-100 focus:border-fuchsia-500 focus:outline-none"
                >
                  <option value="friendly">Friendly Open-Source Mentor (Default)</option>
                  <option value="strict">Strict DevOps Compliance Auditor</option>
                  <option value="concise">Ultra-Concise Action Points</option>
                </select>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <button
                onClick={() => setShowSettings(false)}
                className="rounded-xl border border-white/10 px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-white/5"
              >
                Cancel
              </button>
              <button
                onClick={saveSettings}
                className="rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 px-4 py-2 text-xs font-bold text-white shadow-lg shadow-violet-500/25 hover:from-violet-500 hover:to-fuchsia-500"
              >
                Save Preferences
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Navbar */}
      <header className="sticky top-0 z-40 border-b border-white/[0.08] bg-[#05060b]/75 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3.5">
          <div className="flex items-center gap-3">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-tr from-violet-600 via-fuchsia-500 to-amber-400 font-black text-white shadow-lg shadow-fuchsia-500/20">
              ✓
            </span>
            <div>
              <span className="text-lg font-black tracking-tight text-white">OpenReady</span>
              <span className="ml-2 hidden rounded-full border border-fuchsia-500/30 bg-fuchsia-500/10 px-2.5 py-0.5 text-[10px] font-bold text-fuchsia-300 sm:inline">
                2.0 Aurora
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Mode Switcher */}
            <div className="flex rounded-xl border border-white/[0.08] bg-black/40 p-1 backdrop-blur-md">
              <button
                onClick={() => { setMode("single"); setResult2(null); }}
                className={`rounded-lg px-3 py-1.5 text-xs font-bold transition ${mode === "single" ? "bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white shadow-md shadow-violet-500/25" : "text-slate-400 hover:text-white"}`}
              >
                📊 Single Audit
              </button>
              <button
                onClick={() => setMode("battle")}
                className={`rounded-lg px-3 py-1.5 text-xs font-bold transition ${mode === "battle" ? "bg-gradient-to-r from-amber-500 to-rose-500 text-white shadow-md shadow-rose-500/25" : "text-slate-400 hover:text-white"}`}
              >
                ⚔️ Repo Battle
              </button>
            </div>

            <button
              onClick={() => setShowSettings(true)}
              className="rounded-xl border border-white/[0.08] bg-white/[0.03] p-2 text-slate-300 hover:border-violet-500/40 hover:bg-white/[0.06] hover:text-white transition"
              title="Settings"
            >
              ⚙️
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative mx-auto max-w-5xl px-4 pt-16 pb-12 text-center">
        <div className="inline-flex items-center gap-2 rounded-full border border-fuchsia-500/30 bg-gradient-to-r from-violet-500/10 via-fuchsia-500/10 to-pink-500/10 px-4 py-1.5 text-xs font-bold text-fuchsia-300 shadow-[0_0_20px_rgba(236,72,153,0.15)]">
          <span>✨ Hacktoberfest 2026 Developer Tooling Track</span>
        </div>

        <h1 className="mt-7 text-4xl font-black tracking-tight sm:text-7xl">
          {mode === "single" ? "Is your repo ready for " : "Benchmark Repos in "}
          <span className="bg-gradient-to-r from-violet-400 via-fuchsia-400 to-amber-300 bg-clip-text text-transparent">
            {mode === "single" ? "Open Source?" : "Live Repo Battle"}
          </span>
        </h1>

        <p className="mx-auto mt-4 max-w-2xl text-base text-slate-300 sm:text-lg">
          {mode === "single"
            ? "Paste any public repository. Compute readiness scores, prevent secret leaks, generate production AI READMEs, and download 1-click fix bundles."
            : "Compare two repositories side-by-side to benchmark documentation hygiene, licensing integrity, and governance standards."}
        </p>

        {/* Search / Battle Form */}
        <form onSubmit={handleAudit} className="mx-auto mt-9 max-w-2xl">
          {mode === "single" ? (
            <div className="flex flex-col gap-2.5 sm:flex-row">
              <input
                value={repo}
                onChange={(e) => setRepo(e.target.value)}
                placeholder="e.g. Engineer-Sarah/Open-Ready or full GitHub URL"
                className="flex-1 rounded-2xl border border-white/[0.1] bg-white/[0.03] px-5 py-4 text-sm text-white placeholder:text-slate-500 backdrop-blur-xl focus:border-fuchsia-400 focus:bg-white/[0.05] focus:outline-none focus:ring-2 focus:ring-fuchsia-500/20"
              />
              <button
                type="submit"
                disabled={loading || !repo.trim()}
                className="rounded-2xl bg-gradient-to-r from-violet-600 via-fuchsia-600 to-pink-500 px-8 py-4 font-black text-white shadow-lg shadow-fuchsia-500/25 transition hover:scale-[1.02] hover:shadow-fuchsia-500/40 disabled:opacity-50"
              >
                {loading ? "Auditing Repository..." : "Audit Repo"}
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              <div className="flex flex-col items-center gap-2 sm:flex-row">
                {/* Contender 1 */}
                <input
                  value={repo}
                  onChange={(e) => setRepo(e.target.value)}
                  placeholder="Contender #1 (e.g. Engineer-Sarah/Open-Ready)"
                  className="w-full flex-1 rounded-2xl border border-white/[0.1] bg-white/[0.03] px-4 py-3.5 text-sm text-white placeholder:text-slate-500 focus:border-amber-400 focus:outline-none"
                />

                {/* Swap Button */}
                <button
                  type="button"
                  onClick={swapRepos}
                  className="rounded-xl border border-white/[0.1] bg-white/[0.05] p-2.5 text-sm text-slate-300 hover:border-amber-400 hover:text-white transition"
                  title="Swap Repositories"
                >
                  🔁
                </button>

                {/* Contender 2 */}
                <input
                  value={repo2}
                  onChange={(e) => setRepo2(e.target.value)}
                  placeholder="Contender #2 (e.g. vercel/next.js)"
                  className="w-full flex-1 rounded-2xl border border-white/[0.1] bg-white/[0.03] px-4 py-3.5 text-sm text-white placeholder:text-slate-500 focus:border-rose-400 focus:outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={loading || !repo.trim() || !repo2.trim()}
                className="w-full rounded-2xl bg-gradient-to-r from-amber-500 via-rose-500 to-purple-600 px-8 py-4 font-black text-white shadow-lg shadow-rose-500/25 transition hover:scale-[1.02] disabled:opacity-50"
              >
                {loading ? "Comparing Repositories..." : "⚔️ Start Battle Audit"}
              </button>

              {/* 1-Click Battle Presets */}
              <div className="mt-2 flex flex-wrap items-center justify-center gap-2 text-xs">
                <span className="text-slate-400 font-medium">1-Click Matchups:</span>
                {MATCHUPS.map((m) => (
                  <button
                    key={m.label}
                    type="button"
                    onClick={() => { setRepo(m.r1); setRepo2(m.r2); }}
                    className="rounded-full border border-fuchsia-500/30 bg-fuchsia-500/10 px-3 py-1 text-fuchsia-300 hover:bg-fuchsia-500/20 transition font-semibold"
                  >
                    {m.label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </form>

        {/* Examples Chips (Smart Fill for either input) */}
        <div className="mt-5 flex flex-wrap items-center justify-center gap-2 text-xs text-slate-400">
          <span>Quick Repo Chips:</span>
          {EXAMPLES.map((ex) => (
            <button
              key={ex}
              type="button"
              onClick={() => handleExampleClick(ex)}
              className="rounded-full border border-white/[0.08] bg-white/[0.02] px-3 py-1 hover:border-violet-500/40 hover:text-white transition"
            >
              + {ex}
            </button>
          ))}
        </div>

        {error && (
          <p className="mx-auto mt-6 max-w-xl rounded-2xl border border-rose-500/40 bg-rose-500/10 p-4 text-sm text-rose-300">
            {error}
          </p>
        )}

        {/* Stats Strip */}
        <div className="mx-auto mt-14 grid max-w-3xl grid-cols-2 gap-4 border-t border-white/[0.08] pt-10 sm:grid-cols-4">
          {STATS.map((s) => (
            <div key={s.label} className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4 backdrop-blur-xl">
              <p className="text-2xl font-black bg-gradient-to-r from-violet-400 to-fuchsia-400 bg-clip-text text-transparent">
                {s.val}
              </p>
              <p className="mt-1 text-[11px] font-medium text-slate-400">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Results Container */}
      {result && (
        <section ref={resultRef} className="mx-auto max-w-5xl px-4 pb-20">
          {mode === "battle" && result2 ? (
            /* Battle View */
            <div className="space-y-6">
              <div className="rounded-3xl border border-amber-500/30 bg-gradient-to-r from-amber-500/10 via-purple-500/10 to-rose-500/10 p-6 text-center backdrop-blur-xl shadow-xl">
                <span className="text-xs font-bold uppercase tracking-widest text-amber-400">Battle Winner</span>
                <h3 className="mt-1 text-3xl font-black text-white">
                  {result.score >= result2.score ? result.repo : result2.repo} 🏆
                </h3>
                <p className="text-xs text-slate-400 mt-1">Leading by {Math.abs(result.score - result2.score)} readiness points</p>
              </div>

              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                {[result, result2].map((r, idx) => (
                  <div key={r.repo} className="rounded-3xl border border-white/[0.08] bg-white/[0.02] p-6 backdrop-blur-xl shadow-2xl">
                    <span className="text-xs font-bold uppercase tracking-wider text-fuchsia-400">Contender #{idx + 1}</span>
                    <h3 className="mt-1 text-xl font-bold truncate text-white">{r.repo}</h3>
                    <div className="mt-5 flex items-center justify-center">
                      <Gauge score={r.score} />
                    </div>
                    <ul className="mt-6 space-y-2.5">
                      {r.checks.map((c) => (
                        <li key={c.id} className="flex items-center justify-between border-b border-white/[0.05] py-1.5 text-xs">
                          <span className="text-slate-300">{c.label}</span>
                          <span className={c.passed ? "font-bold text-emerald-400" : "font-bold text-rose-400"}>
                            {c.points}/{c.maxPoints} pts
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            /* Single Audit View */
            <div className="rounded-3xl border border-white/[0.08] bg-white/[0.02] p-6 shadow-2xl backdrop-blur-2xl sm:p-9">
              <div className="flex flex-col items-center gap-6 sm:flex-row sm:justify-between">
                <div className="flex flex-col items-center gap-6 sm:flex-row">
                  <Gauge score={result.score} />
                  <div className="text-center sm:text-left">
                    <a href={result.url} target="_blank" rel="noreferrer" className="text-xs text-slate-400 hover:text-white hover:underline">
                      {result.repo} ↗
                    </a>
                    <h2 className={`text-3xl font-black ${tone(result.score).text}`}>{tone(result.score).label}</h2>
                    <p className="mt-1 text-sm text-slate-400">
                      {result.checks.filter((c) => c.passed).length} of {result.checks.length} compliance pillars fully passed.
                    </p>
                  </div>
                </div>

                {/* 1-Click Action Hub */}
                <div className="flex flex-wrap justify-center gap-2">
                  <button
                    onClick={downloadFixZip}
                    className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-2.5 text-xs font-bold text-emerald-300 transition hover:bg-emerald-500/20 shadow-lg shadow-emerald-500/10"
                  >
                    📦 Download Fixes (.zip)
                  </button>
                  <button
                    onClick={downloadAuditReport}
                    className="rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-xs font-semibold text-slate-200 transition hover:bg-white/10"
                  >
                    📄 Export Report (.md)
                  </button>
                  <button
                    onClick={generateFullReadme}
                    disabled={readmeLoading}
                    className="rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 px-4 py-2.5 text-xs font-bold text-white transition hover:from-violet-500 hover:to-fuchsia-500 shadow-lg shadow-violet-500/20 disabled:opacity-50"
                  >
                    {readmeLoading ? "AI Writing..." : "✨ AI Generate README"}
                  </button>
                </div>
              </div>

              {/* AI Mentor Drawer */}
              <div className="mt-8 rounded-2xl border border-violet-500/30 bg-gradient-to-r from-violet-500/5 via-fuchsia-500/5 to-transparent p-5 backdrop-blur-xl">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">🤖</span>
                    <h3 className="font-bold text-violet-300">Google Gemini AI Mentor</h3>
                  </div>
                  <button
                    onClick={askAi}
                    disabled={aiLoading}
                    className="rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 px-4 py-1.5 text-xs font-bold text-white shadow-md shadow-violet-500/20 hover:from-violet-500 hover:to-fuchsia-500 disabled:opacity-50"
                  >
                    {aiLoading ? "Thinking..." : "Explain Failures"}
                  </button>
                </div>
                {aiText && <p className="mt-3.5 whitespace-pre-line text-sm leading-relaxed text-slate-300">{aiText}</p>}
              </div>

              {/* Generated README Modal/Drawer */}
              {generatedReadme && (
                <div className="mt-6 rounded-2xl border border-fuchsia-500/30 bg-black/60 p-5 backdrop-blur-xl">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-fuchsia-300">AI Generated Production-Ready README</h4>
                    <button
                      onClick={() => copyText(generatedReadme, "gen_readme")}
                      className="rounded-xl bg-gradient-to-r from-fuchsia-600 to-pink-600 px-3.5 py-1 text-xs font-bold text-white hover:from-fuchsia-500 hover:to-pink-500"
                    >
                      {copiedKey === "gen_readme" ? "Copied!" : "Copy Full README"}
                    </button>
                  </div>
                  <pre className="mt-3 max-h-64 overflow-auto rounded-xl border border-white/[0.06] bg-black/80 p-4 font-mono text-xs text-slate-300">
                    {generatedReadme}
                  </pre>
                </div>
              )}

              {/* 8 Compliance Checks Grid */}
              <div className="mt-10">
                <h3 className="text-lg font-black text-white">Audited Compliance Pillars</h3>
                <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {result.checks.map((c) => {
                    const fix = FIXES[c.id];
                    return (
                      <div key={c.id} className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4 backdrop-blur-xl hover:border-violet-500/30 transition">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-semibold text-slate-200">
                            {c.passed ? "✅" : "⚠️"} {c.label}
                          </span>
                          <span className={`text-xs font-bold ${c.passed ? "text-emerald-400" : "text-amber-400"}`}>
                            {c.points}/{c.maxPoints} pts
                          </span>
                        </div>
                        <p className="mt-2 text-xs leading-relaxed text-slate-400">{c.why}</p>
                        {!c.passed && fix && fix.body && (
                          <button
                            onClick={() => copyText(fix.body!, c.id)}
                            className="mt-3 inline-block text-xs font-semibold text-fuchsia-400 hover:text-fuchsia-300"
                          >
                            {copiedKey === c.id ? "Template Copied!" : "📋 Copy Fix Template →"}
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </section>
      )}

      {/* Platform Capabilities (Bento Grid) */}
      <section id="features" className="border-t border-white/[0.06] bg-black/20 py-20">
        <div className="mx-auto max-w-6xl px-4">
          <div className="text-center">
            <h2 className="text-3xl font-black tracking-tight sm:text-5xl text-white">Platform Capabilities</h2>
            <p className="mt-3 text-sm text-slate-400">Everything needed to transition repositories from personal hacks to open-source assets.</p>
          </div>

          <div className="mt-12 grid grid-cols-1 gap-5 sm:grid-cols-3">
            <div className="rounded-3xl border border-white/[0.08] bg-white/[0.02] p-7 backdrop-blur-xl hover:border-violet-500/40 transition">
              <span className="text-3xl">🛡️</span>
              <h3 className="mt-4 font-bold text-lg text-white">Secret Leak Prevention</h3>
              <p className="mt-2 text-xs leading-relaxed text-slate-400">
                Scans public file trees for exposed .env credentials, RSA keys, and configuration secrets before malicious scrapers compromise them.
              </p>
            </div>

            <div className="rounded-3xl border border-white/[0.08] bg-white/[0.02] p-7 backdrop-blur-xl hover:border-fuchsia-500/40 transition">
              <span className="text-3xl">🤖</span>
              <h3 className="mt-4 font-bold text-lg text-white">Gemini 2.5 AI Mentorship</h3>
              <p className="mt-2 text-xs leading-relaxed text-slate-400">
                Translates dry compliance failures into beginner-friendly next steps, acting as a virtual open-source mentor for your repository.
              </p>
            </div>

            <div className="rounded-3xl border border-white/[0.08] bg-white/[0.02] p-7 backdrop-blur-xl hover:border-pink-500/40 transition">
              <span className="text-3xl">📦</span>
              <h3 className="mt-4 font-bold text-lg text-white">1-Click Fix Bundles</h3>
              <p className="mt-2 text-xs leading-relaxed text-slate-400">
                No manual boilerplate typing. OpenReady packages all missing LICENSE, CONTRIBUTING, and .gitignore files into a ready-to-unzip archive.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* The 8 Pillars Section */}
      <section id="checks" className="py-20">
        <div className="mx-auto max-w-6xl px-4">
          <div className="text-center">
            <h2 className="text-3xl font-black tracking-tight sm:text-5xl text-white">The 8 Pillars of Readiness</h2>
            <p className="mt-3 text-sm text-slate-400">Every single check maps directly to what real contributors and hackathon judges look for.</p>
          </div>

          <div className="mt-12 grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
            {CHECKS_LIST.map((c) => (
              <div key={c.id} className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5 backdrop-blur-xl hover:border-violet-500/40 transition">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-sm text-white">{c.name}</h4>
                  <span className="rounded-full border border-fuchsia-500/30 bg-fuchsia-500/10 px-2.5 py-0.5 text-xs font-bold text-fuchsia-400">
                    +{c.pts} pts
                  </span>
                </div>
                <p className="mt-2.5 text-xs text-slate-400 leading-relaxed">{c.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Interactive FAQ Accordion */}
      <section id="faqs" className="border-t border-white/[0.06] bg-black/20 py-20">
        <div className="mx-auto max-w-4xl px-4">
          <div className="text-center">
            <h2 className="text-3xl font-black tracking-tight sm:text-5xl text-white">Frequently Asked Questions</h2>
            <p className="mt-3 text-sm text-slate-400">Clear answers on security, scoring models, and tool integration.</p>
          </div>

          <div className="mt-12 space-y-3.5">
            {FAQS.map((faq, i) => (
              <div key={faq.q} className="rounded-2xl border border-white/[0.08] bg-white/[0.02] backdrop-blur-xl overflow-hidden transition hover:border-violet-500/30">
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="flex w-full items-center justify-between p-5 text-left font-bold text-sm text-slate-200 hover:text-fuchsia-400 transition"
                >
                  <span>{faq.q}</span>
                  <span className="text-slate-500 text-xs">{openFaq === i ? "▲" : "▼"}</span>
                </button>
                {openFaq === i && (
                  <p className="border-t border-white/[0.06] p-5 text-xs leading-relaxed text-slate-300 bg-black/40">
                    {faq.a}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/[0.06] py-12 text-center text-xs text-slate-500">
        <p>Built for the <b>Hacktoberfest Hackathon NUST x NSTP</b> by <b>Sarah Abrar</b> (@Engineer-Sarah).</p>
        <p className="mt-2">Licensed under MIT • Powered by Next.js, Google Gemini, and GitHub REST API.</p>
      </footer>
    </div>
  );
}