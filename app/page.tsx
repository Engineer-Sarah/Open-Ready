"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import type { AuditResult } from "@/lib/audit";
import { FIXES } from "@/lib/templates";

const REPO_URL = "https://github.com/Engineer-Sarah/Open-Ready";
const EXAMPLES = ["Engineer-Sarah/Open-Ready", "vercel/next.js", "facebook/react"];

const STATS = [
  { big: "8", small: "checks" },
  { big: "100", small: "point score" },
  { big: "0", small: "sign-ups" },
];

const STEPS = [
  { n: "1", title: "Paste a repo", text: "Any public GitHub URL or owner/name. No sign-up, no token needed." },
  { n: "2", title: "We audit it", text: "OpenReady reads the repository through the GitHub API and runs 8 checks." },
  { n: "3", title: "Fix and share", text: "Get a score, copy-paste fixes, an AI explanation and a badge for your README." },
];

const CHECKS = [
  { name: "LICENSE file", pts: 25, text: "Legal permission for others to use your code." },
  { name: "README file", pts: 10, text: "The first thing every visitor sees." },
  { name: "README sections", pts: 15, text: "Setup, usage and license headings." },
  { name: "CONTRIBUTING guide", pts: 10, text: "Tells newcomers how to help." },
  { name: ".gitignore", pts: 10, text: "Keeps junk and secrets out of the repo." },
  { name: "Secret-looking files", pts: 15, text: "Flags files like .env or private keys (by file name only)." },
  { name: "Description and topics", pts: 5, text: "Helps people discover the project." },
  { name: "Recent activity", pts: 10, text: "Shows the project is maintained." },
];

type Ai = { loading: boolean; text: string | null; error: string | null };
const AI_IDLE: Ai = { loading: false, text: null, error: null };

function tone(score: number) {
  if (score >= 80)
    return { text: "text-emerald-400", stroke: "stroke-emerald-400", label: "Open-source ready" };
  if (score >= 50)
    return { text: "text-amber-400", stroke: "stroke-amber-400", label: "Almost there" };
  return { text: "text-rose-400", stroke: "stroke-rose-400", label: "Needs work" };
}

function Gauge({ score }: { score: number }) {
  const [shown, setShown] = useState(0);
  useEffect(() => {
    const timer = setTimeout(() => setShown(score), 80);
    return () => clearTimeout(timer);
  }, [score]);

  const r = 70;
  const c = 2 * Math.PI * r;
  const t = tone(score);

  return (
    <div className="relative h-52 w-52 shrink-0">
      <svg viewBox="0 0 180 180" className="h-full w-full -rotate-90" role="img" aria-label={`Score ${score} out of 100`}>
        <circle cx="90" cy="90" r={r} fill="none" strokeWidth="14" className="stroke-slate-800" />
        <circle
          cx="90"
          cy="90"
          r={r}
          fill="none"
          strokeWidth="14"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c - (shown / 100) * c}
          className={`${t.stroke} transition-all duration-1000 ease-out`}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={`text-6xl font-bold ${t.text}`}>{score}</span>
        <span className="text-sm text-slate-400">out of 100</span>
      </div>
    </div>
  );
}

export default function Home() {
  const [repo, setRepo] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AuditResult | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [ai, setAi] = useState<Ai>(AI_IDLE);
  const resultRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (result) resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [result]);

  // Shareable links: /?repo=owner/name runs the check automatically.
  useEffect(() => {
    const shared = new URLSearchParams(window.location.search).get("repo");
    if (shared) runCheck(shared);
  }, []);

  async function runCheck(target: string) {
    setRepo(target);
    setLoading(true);
    setError(null);
    setResult(null);
    setAi(AI_IDLE);
    try {
      const res = await fetch("/api/audit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ repo: target }),
      });
      const data = await res.json();
      if (!res.ok) setError(data.error ?? "Something went wrong.");
      else setResult(data as AuditResult);
    } catch {
      setError("Network error. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (repo.trim()) runCheck(repo);
  }

  async function copy(text: string, key: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(key);
      setTimeout(() => setCopied(null), 1500);
    } catch {
      setError("Could not copy. Please select the text and copy it manually.");
    }
  }

  async function explain() {
    if (!result) return;
    setAi({ loading: true, text: null, error: null });
    const failedChecks = result.checks
      .filter((c) => !c.passed)
      .map((c) => ({ label: c.label, detail: c.detail ?? "", why: c.why }));
    try {
      const res = await fetch("/api/explain", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ repo: result.repo, score: result.score, failed: failedChecks }),
      });
      const data = await res.json();
      if (!res.ok) setAi({ loading: false, text: null, error: data.error ?? "Something went wrong." });
      else setAi({ loading: false, text: data.text, error: null });
    } catch {
      setAi({ loading: false, text: null, error: "Network error. Please try again." });
    }
  }

  const t = result ? tone(result.score) : null;
  const failed = result
    ? result.checks
        .filter((c) => !c.passed)
        .sort((a, b) => b.maxPoints - b.points - (a.maxPoints - a.points))
    : [];
  const gain = failed.reduce((sum, c) => sum + (c.maxPoints - c.points), 0);
  const card = "rounded-2xl border border-slate-800 bg-slate-900/60";

  return (
    <div
      className="min-h-screen bg-slate-950 text-slate-100"
      style={{
        backgroundImage:
          "radial-gradient(60rem 30rem at 50% -10%, rgba(16,185,129,0.20), transparent), radial-gradient(40rem 25rem at 90% 10%, rgba(56,189,248,0.14), transparent)",
      }}
    >
      {/* Navbar */}
      <header className="sticky top-0 z-10 border-b border-slate-800 bg-slate-950/80 backdrop-blur">
        <nav className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <a href="#top" className="flex items-center gap-2 text-lg font-bold">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-emerald-500 text-slate-950">✓</span>
            OpenReady
          </a>
          <div className="flex items-center gap-5 text-sm text-slate-300">
            <a href="#how" className="hidden hover:text-white sm:block">How it works</a>
            <a href="#checks" className="hidden hover:text-white sm:block">What we check</a>
            <a
              href={REPO_URL}
              target="_blank"
              rel="noreferrer"
              className="rounded-lg border border-slate-700 px-3 py-1.5 hover:bg-slate-800"
            >
              GitHub
            </a>
          </div>
        </nav>
      </header>

      {/* Hero */}
      <section id="top" className="mx-auto max-w-3xl px-4 pb-10 pt-16 text-center sm:pt-24">
        <span className="inline-block rounded-full border border-emerald-500/40 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-300">
          Free · Open source · MIT licensed
        </span>
        <h1 className="mt-6 text-4xl font-bold leading-tight sm:text-7xl">
          Is your repo ready for{" "}
          <span className="bg-gradient-to-r from-emerald-300 to-sky-400 bg-clip-text text-transparent">
            open source?
          </span>
        </h1>
        <p className="mx-auto mt-5 max-w-xl text-lg text-slate-400">
          Paste any public GitHub repository. Get an instant readiness score, copy-paste fixes and a plain-English
          explanation of what to do next.
        </p>

        <form onSubmit={onSubmit} className="mx-auto mt-8 flex max-w-xl flex-col gap-2 sm:flex-row">
          <input
            value={repo}
            onChange={(e) => setRepo(e.target.value)}
            placeholder="https://github.com/owner/repo"
            aria-label="GitHub repository URL"
            className="flex-1 rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-slate-100 placeholder:text-slate-500 focus:border-emerald-400 focus:outline-none"
          />
          <button
            type="submit"
            disabled={loading || !repo.trim()}
            className="rounded-xl bg-emerald-500 px-6 py-3 font-semibold text-slate-950 transition hover:bg-emerald-400 disabled:opacity-50"
          >
            {loading ? "Checking..." : "Check my repo"}
          </button>
        </form>

        <div className="mt-4 flex flex-wrap items-center justify-center gap-2 text-sm text-slate-400">
          <span>Try:</span>
          {EXAMPLES.map((ex) => (
            <button
              key={ex}
              type="button"
              onClick={() => runCheck(ex)}
              disabled={loading}
              className="rounded-full border border-slate-700 px-3 py-1 hover:border-emerald-400 hover:text-white disabled:opacity-50"
            >
              {ex}
            </button>
          ))}
        </div>

        <div className="mx-auto mt-10 flex max-w-md justify-between">
          {STATS.map((s) => (
            <div key={s.small}>
              <p className="text-3xl font-bold text-emerald-300">{s.big}</p>
              <p className="text-sm text-slate-500">{s.small}</p>
            </div>
          ))}
        </div>

        {error && (
          <p className="mx-auto mt-8 max-w-xl rounded-xl border border-rose-500/40 bg-rose-500/10 p-4 text-rose-300" role="alert">
            {error}
          </p>
        )}
      </section>

      {/* Loading skeleton */}
      {loading && (
        <section className="mx-auto max-w-3xl px-4 pb-16" aria-busy="true">
          <div className={`${card} h-72 animate-pulse`} />
        </section>
      )}

      {/* Result */}
      {result && t && (
        <section ref={resultRef} className="mx-auto max-w-3xl scroll-mt-20 px-4 pb-16">
          <div className={`${card} p-6 sm:p-8`}>
            <div className="flex flex-col items-center gap-6 sm:flex-row sm:gap-10">
              <Gauge score={result.score} />
              <div className="text-center sm:text-left">
                <a href={result.url} target="_blank" rel="noreferrer" className="text-slate-400 underline hover:text-white">
                  {result.repo}
                </a>
                <h2 className={`mt-1 text-3xl font-bold ${t.text}`}>{t.label}</h2>
                <p className="mt-2 text-slate-400">
                  {result.checks.filter((c) => c.passed).length} of {result.checks.length} checks fully passed.
                </p>
                {result.description && <p className="mt-2 text-sm text-slate-500">{result.description}</p>}
              </div>
            </div>

            {/* Priorities */}
            <div className="mt-8 rounded-xl border border-slate-800 bg-slate-950/60 p-5">
              {failed.length === 0 ? (
                <p className="font-medium text-emerald-300">Perfect score. This repository is ready to be shared with the world.</p>
              ) : (
                <>
                  <h3 className="font-semibold">Fix these first</h3>
                  <p className="mt-1 text-sm text-slate-400">Fixing everything would add up to +{gain} points.</p>
                  <ul className="mt-3 space-y-2">
                    {failed.slice(0, 3).map((c) => (
                      <li key={c.id} className="flex items-center justify-between gap-3 text-sm">
                        <span>{c.label}</span>
                        <span className="rounded-full bg-emerald-500/15 px-2.5 py-0.5 font-medium text-emerald-300">
                          +{c.maxPoints - c.points} pts
                        </span>
                      </li>
                    ))}
                  </ul>
                  <button
                    type="button"
                    onClick={explain}
                    disabled={ai.loading}
                    className="mt-4 rounded-lg bg-sky-500 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-sky-400 disabled:opacity-50"
                  >
                    {ai.loading ? "Thinking..." : "✨ Explain in simple words (AI)"}
                  </button>
                  {ai.error && <p className="mt-3 text-sm text-rose-300">{ai.error}</p>}
                  {ai.text && (
                    <p className="mt-3 whitespace-pre-line rounded-lg border border-sky-500/30 bg-sky-500/10 p-4 text-sm text-slate-200">
                      {ai.text}
                    </p>
                  )}
                </>
              )}
            </div>

            {/* All checks */}
            <ul className="mt-6 space-y-3">
              {result.checks.map((c) => {
                const pct = (c.points / c.maxPoints) * 100;
                const bar = c.passed ? "bg-emerald-400" : c.points > 0 ? "bg-amber-400" : "bg-rose-400";
                const fix = FIXES[c.id];
                return (
                  <li key={c.id} className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
                    <div className="flex items-center justify-between gap-4">
                      <span className="font-medium">
                        {c.passed ? "✅" : c.points > 0 ? "⚠️" : "❌"} {c.label}
                      </span>
                      <span className="text-sm text-slate-400">
                        {c.points}/{c.maxPoints}
                      </span>
                    </div>
                    <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-800">
                      <div className={`h-full rounded-full ${bar}`} style={{ width: `${pct}%` }} />
                    </div>
                    {!c.passed && c.detail && <p className="mt-3 text-sm text-rose-300">{c.detail}</p>}
                    <p className="mt-2 text-sm text-slate-400">{c.why}</p>
                    {!c.passed && fix && (
                      <details className="mt-3 rounded-lg border border-slate-800 bg-slate-900 p-3">
                        <summary className="cursor-pointer text-sm font-medium text-emerald-300">How to fix this</summary>
                        <p className="mt-2 text-sm text-slate-300">{fix.steps}</p>
                        {fix.body && (
                          <>
                            <pre className="mt-3 max-h-56 overflow-auto rounded-lg bg-slate-950 p-3 text-xs text-slate-300">
                              {fix.body}
                            </pre>
                            <button
                              type="button"
                              onClick={() => copy(fix.body ?? "", c.id)}
                              className="mt-2 rounded-lg bg-emerald-500 px-3 py-1.5 text-sm font-semibold text-slate-950 hover:bg-emerald-400"
                            >
                              {copied === c.id ? "Copied!" : `Copy ${fix.file ?? "template"}`}
                            </button>
                          </>
                        )}
                      </details>
                    )}
                  </li>
                );
              })}
            </ul>

            {/* Badge and share */}
            <div className="mt-6 rounded-xl border border-slate-800 bg-slate-950/60 p-5">
              <h3 className="font-semibold">Show your score</h3>
              <p className="mt-1 text-sm text-slate-400">Add this badge to your README, or share the result.</p>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={`/api/badge?repo=${result.repo}`} alt="OpenReady score badge" className="mt-3 h-5" />
              <pre className="mt-3 overflow-auto rounded-lg bg-slate-900 p-3 text-xs text-slate-300">
                {`![OpenReady](${window.location.origin}/api/badge?repo=${result.repo})`}
              </pre>
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => copy(`![OpenReady](${window.location.origin}/api/badge?repo=${result.repo})`, "badge")}
                  className="rounded-lg border border-slate-700 px-3 py-1.5 text-sm hover:bg-slate-800"
                >
                  {copied === "badge" ? "Copied!" : "Copy badge markdown"}
                </button>
                <button
                  type="button"
                  onClick={() => copy(`${window.location.origin}/?repo=${result.repo}`, "share")}
                  className="rounded-lg border border-slate-700 px-3 py-1.5 text-sm hover:bg-slate-800"
                >
                  {copied === "share" ? "Copied!" : "Copy shareable link"}
                </button>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* How it works */}
      <section id="how" className="mx-auto max-w-5xl scroll-mt-20 px-4 py-16">
        <h2 className="text-center text-3xl font-bold">How it works</h2>
        <div className="mt-10 grid gap-4 sm:grid-cols-3">
          {STEPS.map((s) => (
            <div key={s.n} className={`${card} p-6`}>
              <span className="grid h-9 w-9 place-items-center rounded-full bg-emerald-500/15 font-bold text-emerald-300">
                {s.n}
              </span>
              <h3 className="mt-4 text-lg font-semibold">{s.title}</h3>
              <p className="mt-2 text-sm text-slate-400">{s.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* What we check */}
      <section id="checks" className="mx-auto max-w-5xl scroll-mt-20 px-4 pb-16">
        <h2 className="text-center text-3xl font-bold">What we check</h2>
        <p className="mx-auto mt-3 max-w-xl text-center text-slate-400">
          Every check maps to something real contributors look for before they trust a project.
        </p>
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {CHECKS.map((c) => (
            <div key={c.name} className={`${card} p-5`}>
              <div className="flex items-center justify-between gap-2">
                <h3 className="font-semibold">{c.name}</h3>
                <span className="shrink-0 text-xs text-emerald-300">{c.pts} pts</span>
              </div>
              <p className="mt-2 text-sm text-slate-400">{c.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-800 px-4 py-8 text-center text-sm text-slate-500">
        <p>
          OpenReady is open source under the{" "}
          <a href={`${REPO_URL}/blob/main/LICENSE`} target="_blank" rel="noreferrer" className="underline hover:text-slate-300">
            MIT License
          </a>
          . Built by Sarah Abrar for Hacktoberfest Hackathon NUSTxNSTP.
        </p>
        <p className="mt-2">
          <a href={REPO_URL} target="_blank" rel="noreferrer" className="underline hover:text-slate-300">
            View the source on GitHub
          </a>
        </p>
      </footer>
    </div>
  );
}
