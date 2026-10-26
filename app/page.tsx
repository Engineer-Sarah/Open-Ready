"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import type { AuditResult } from "@/lib/audit";
import { FIXES } from "@/lib/templates";
import JSZip from "jszip";

const EXAMPLES = ["Engineer-Sarah/Open-Ready", "vercel/next.js", "facebook/react"];

function tone(score: number) {
  if (score >= 80) return { text: "text-emerald-400", stroke: "stroke-emerald-400", label: "Open-source ready" };
  if (score >= 50) return { text: "text-amber-400", stroke: "stroke-amber-400", label: "Almost there" };
  return { text: "text-rose-400", stroke: "stroke-rose-400", label: "Needs work" };
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
    <div className="relative h-48 w-48 shrink-0">
      <svg viewBox="0 0 180 180" className="h-full w-full -rotate-90">
        <circle cx="90" cy="90" r={r} fill="none" strokeWidth="12" className="stroke-slate-800" />
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
        <span className={`text-5xl font-extrabold ${t.text}`}>{score}</span>
        <span className="text-xs font-medium uppercase tracking-wider text-slate-400">Score / 100</span>
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
  const resultRef = useRef<HTMLElement>(null);

  async function auditApi(target: string) {
    const res = await fetch("/api/audit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ repo: target }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Audit failed");
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
      } else {
        if (!repo2.trim()) throw new Error("Please enter both repositories for Battle mode.");
        const [r1, r2] = await Promise.all([auditApi(repo), auditApi(repo2)]);
        setResult(r1);
        setResult2(r2);
      }
    } catch (err: any) {
      setError(err.message || "Network error. Please try again.");
    } finally {
      setLoading(false);
    }
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
      else setAiText("AI explanation could not be generated.");
    } catch {
      setAiText("Failed to reach AI service.");
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
    const report = `# OpenReady Audit Report for ${result.repo}
Date: ${new Date().toLocaleDateString()}
Score: ${result.score}/100

## Checks Summary:
${result.checks.map((c) => `- [${c.passed ? "X" : " "}] ${c.label} (${c.points}/${c.maxPoints} pts)`).join("\n")}

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

  const failedChecks = result ? result.checks.filter((c) => !c.passed) : [];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 selection:bg-emerald-500 selection:text-slate-950">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-950/70 backdrop-blur sticky top-0 z-20">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-emerald-500 font-bold text-slate-950">✓</span>
            <span className="text-xl font-bold tracking-tight">OpenReady</span>
          </div>

          <div className="flex rounded-lg bg-slate-900 p-1 border border-slate-800">
            <button
              onClick={() => { setMode("single"); setResult2(null); }}
              className={`rounded-md px-3 py-1 text-xs font-semibold transition ${mode === "single" ? "bg-emerald-500 text-slate-950" : "text-slate-400 hover:text-white"}`}
            >
              📊 Single Audit
            </button>
            <button
              onClick={() => setMode("battle")}
              className={`rounded-md px-3 py-1 text-xs font-semibold transition ${mode === "battle" ? "bg-purple-500 text-white" : "text-slate-400 hover:text-white"}`}
            >
              ⚔️ Repo Battle
            </button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <main className="mx-auto max-w-5xl px-4 py-12">
        <div className="text-center">
          <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-400">
            Hacktoberfest & Developer Tooling Platform
          </span>
          <h1 className="mt-4 text-4xl font-extrabold sm:text-6xl">
            {mode === "single" ? "Is your repo ready for " : "Compare Repo Readiness: "}
            <span className="bg-gradient-to-r from-emerald-400 via-sky-400 to-indigo-400 bg-clip-text text-transparent">
              Open Source?
            </span>
          </h1>
          <p className="mx-auto mt-3 max-w-xl text-slate-400">
            {mode === "single"
              ? "Audit any public repository, generate custom AI READMEs, and download 1-click fix bundles."
              : "Compare two repositories side-by-side to benchmark health, documentation, and licensing standards."}
          </p>

          {/* Form */}
          <form onSubmit={handleAudit} className="mx-auto mt-8 max-w-2xl">
            {mode === "single" ? (
              <div className="flex flex-col gap-2 sm:flex-row">
                <input
                  value={repo}
                  onChange={(e) => setRepo(e.target.value)}
                  placeholder="e.g. Engineer-Sarah/Open-Ready or full GitHub URL"
                  className="flex-1 rounded-xl border border-slate-800 bg-slate-900 px-4 py-3 text-sm focus:border-emerald-400 focus:outline-none"
                />
                <button
                  type="submit"
                  disabled={loading || !repo.trim()}
                  className="rounded-xl bg-emerald-500 px-6 py-3 font-semibold text-slate-950 hover:bg-emerald-400 disabled:opacity-50"
                >
                  {loading ? "Auditing..." : "Audit Repo"}
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  <input
                    value={repo}
                    onChange={(e) => setRepo(e.target.value)}
                    placeholder="First repo (e.g. Engineer-Sarah/Open-Ready)"
                    className="rounded-xl border border-slate-800 bg-slate-900 px-4 py-3 text-sm focus:border-purple-400 focus:outline-none"
                  />
                  <input
                    value={repo2}
                    onChange={(e) => setRepo2(e.target.value)}
                    placeholder="Second repo (e.g. vercel/next.js)"
                    className="rounded-xl border border-slate-800 bg-slate-900 px-4 py-3 text-sm focus:border-purple-400 focus:outline-none"
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading || !repo.trim() || !repo2.trim()}
                  className="rounded-xl bg-purple-600 px-6 py-3 font-semibold text-white hover:bg-purple-500 disabled:opacity-50"
                >
                  {loading ? "Battling..." : "⚔️ Start Repo Battle"}
                </button>
              </div>
            )}
          </form>

          {/* Examples */}
          <div className="mt-4 flex flex-wrap items-center justify-center gap-2 text-xs text-slate-400">
            <span>Try:</span>
            {EXAMPLES.map((ex) => (
              <button
                key={ex}
                onClick={() => { setRepo(ex); }}
                className="rounded-full border border-slate-800 bg-slate-900 px-2.5 py-1 hover:border-slate-700 hover:text-white"
              >
                {ex}
              </button>
            ))}
          </div>

          {error && <p className="mt-6 rounded-xl border border-rose-500/40 bg-rose-500/10 p-3 text-sm text-rose-300">{error}</p>}
        </div>

        {/* Results Section */}
        {result && (
          <div ref={resultRef} className="mt-12 space-y-8">
            {/* Battle View */}
            {mode === "battle" && result2 ? (
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                {[result, result2].map((r, idx) => (
                  <div key={r.repo} className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
                    <span className="text-xs font-bold uppercase tracking-wider text-purple-400">Contender #{idx + 1}</span>
                    <h3 className="mt-1 text-xl font-bold truncate">{r.repo}</h3>
                    <div className="mt-4 flex items-center justify-center">
                      <Gauge score={r.score} />
                    </div>
                    <ul className="mt-6 space-y-2">
                      {r.checks.map((c) => (
                        <li key={c.id} className="flex items-center justify-between text-xs py-1 border-b border-slate-800/60">
                          <span className="text-slate-300">{c.label}</span>
                          <span className={c.passed ? "text-emerald-400 font-bold" : "text-rose-400 font-bold"}>
                            {c.points}/{c.maxPoints} pts
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            ) : (
              /* Single Audit View */
              <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 sm:p-8">
                {/* Top Banner */}
                <div className="flex flex-col items-center gap-6 sm:flex-row sm:justify-between">
                  <div className="flex flex-col sm:flex-row items-center gap-6">
                    <Gauge score={result.score} />
                    <div className="text-center sm:text-left">
                      <a href={result.url} target="_blank" rel="noreferrer" className="text-xs text-slate-400 hover:underline">
                        {result.repo} ↗
                      </a>
                      <h2 className={`text-3xl font-extrabold ${tone(result.score).text}`}>{tone(result.score).label}</h2>
                      <p className="mt-1 text-sm text-slate-400">
                        {result.checks.filter((c) => c.passed).length} of {result.checks.length} checks fully passed.
                      </p>
                    </div>
                  </div>

                  {/* Actions Toolbar */}
                  <div className="flex flex-wrap gap-2 justify-center">
                    <button
                      onClick={downloadFixZip}
                      className="rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-4 py-2 text-xs font-semibold text-emerald-300 hover:bg-emerald-500/20"
                    >
                      📦 Download Fixes (.zip)
                    </button>
                    <button
                      onClick={downloadAuditReport}
                      className="rounded-xl border border-slate-700 bg-slate-800 px-4 py-2 text-xs font-semibold text-slate-200 hover:bg-slate-700"
                    >
                      📄 Export Report (.md)
                    </button>
                    <button
                      onClick={generateFullReadme}
                      disabled={readmeLoading}
                      className="rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-500 disabled:opacity-50"
                    >
                      {readmeLoading ? "AI Writing..." : "✨ AI Generate README"}
                    </button>
                  </div>
                </div>

                {/* AI Explanation Box */}
                <div className="mt-8 rounded-xl border border-sky-500/30 bg-sky-950/20 p-5">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-sky-300">🤖 AI Mentor Breakdown</h3>
                    <button
                      onClick={askAi}
                      disabled={aiLoading}
                      className="rounded-lg bg-sky-500 px-3 py-1 text-xs font-bold text-slate-950 hover:bg-sky-400 disabled:opacity-50"
                    >
                      {aiLoading ? "Thinking..." : "Explain with AI"}
                    </button>
                  </div>
                  {aiText && <p className="mt-3 whitespace-pre-line text-sm text-slate-300">{aiText}</p>}
                </div>

                {/* AI Generated README Drawer */}
                {generatedReadme && (
                  <div className="mt-6 rounded-xl border border-indigo-500/40 bg-indigo-950/20 p-5">
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-indigo-300">Generated Production README</h4>
                      <button
                        onClick={() => copyText(generatedReadme, "gen_readme")}
                        className="rounded-lg bg-indigo-500 px-3 py-1 text-xs font-semibold text-slate-950 hover:bg-indigo-400"
                      >
                        {copiedKey === "gen_readme" ? "Copied!" : "Copy Full README"}
                      </button>
                    </div>
                    <pre className="mt-3 max-h-64 overflow-auto rounded-lg bg-slate-950 p-4 text-xs text-slate-300 font-mono">
                      {generatedReadme}
                    </pre>
                  </div>
                )}

                {/* Checklist */}
                <div className="mt-8">
                  <h3 className="font-bold">Detailed Pillars Audit</h3>
                  <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                    {result.checks.map((c) => {
                      const fix = FIXES[c.id];
                      return (
                        <div key={c.id} className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-semibold">
                              {c.passed ? "✅" : "⚠️"} {c.label}
                            </span>
                            <span className="text-xs text-slate-400">
                              {c.points}/{c.maxPoints} pts
                            </span>
                          </div>
                          <p className="mt-2 text-xs text-slate-400">{c.why}</p>
                          {!c.passed && fix && fix.body && (
                            <button
                              onClick={() => copyText(fix.body!, c.id)}
                              className="mt-3 text-xs font-medium text-emerald-400 underline hover:text-emerald-300"
                            >
                              {copiedKey === c.id ? "Template Copied!" : "Copy Fix Template"}
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}