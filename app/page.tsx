"use client";

import { useState, type FormEvent } from "react";
import type { AuditResult } from "@/lib/audit";

function scoreColor(score: number) {
  if (score >= 80) return "text-green-500";
  if (score >= 50) return "text-yellow-500";
  return "text-red-500";
}

function scoreLabel(score: number) {
  if (score >= 80) return "Ready to share with the open-source world";
  if (score >= 50) return "Almost there, a few fixes needed";
  return "Needs work before it is open-source ready";
}

export default function Home() {
  const [repo, setRepo] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AuditResult | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch("/api/audit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ repo }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Something went wrong.");
      } else {
        setResult(data as AuditResult);
      }
    } catch {
      setError("Network error. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto max-w-2xl px-4 py-12">
      <h1 className="text-4xl font-bold">OpenReady</h1>
      <p className="mt-2 opacity-80">
        Paste a public GitHub repository and find out how ready it is for open source.
      </p>

      <form onSubmit={handleSubmit} className="mt-8 flex gap-2">
        <input
          value={repo}
          onChange={(e) => setRepo(e.target.value)}
          placeholder="https://github.com/owner/repo"
          aria-label="GitHub repository URL"
          className="flex-1 rounded-lg border border-gray-500/40 bg-transparent px-4 py-2"
        />
        <button
          type="submit"
          disabled={loading || !repo.trim()}
          className="rounded-lg bg-blue-600 px-5 py-2 font-medium text-white disabled:opacity-50"
        >
          {loading ? "Checking..." : "Check"}
        </button>
      </form>

      {error && (
        <p className="mt-6 rounded-lg border border-red-500/50 p-4 text-red-500" role="alert">
          {error}
        </p>
      )}

      {result && (
        <section className="mt-10">
          <div className="text-center">
            <a href={result.url} target="_blank" rel="noreferrer" className="underline">
              {result.repo}
            </a>
            <p className={`mt-2 text-7xl font-bold ${scoreColor(result.score)}`}>
              {result.score}
              <span className="text-2xl opacity-60">/100</span>
            </p>
            <p className="mt-1 opacity-80">{scoreLabel(result.score)}</p>
          </div>

          <ul className="mt-8 space-y-3">
            {result.checks.map((c) => (
              <li key={c.id} className="rounded-lg border border-gray-500/30 p-4">
                <div className="flex items-center justify-between gap-4">
                  <span className="font-medium">
                    {c.passed ? "✅" : c.points > 0 ? "⚠️" : "❌"} {c.label}
                  </span>
                  <span className="text-sm opacity-70">
                    {c.points}/{c.maxPoints}
                  </span>
                </div>
                {!c.passed && c.detail && <p className="mt-2 text-sm text-red-400">{c.detail}</p>}
                <p className="mt-1 text-sm opacity-70">{c.why}</p>
              </li>
            ))}
          </ul>
        </section>
      )}
    </main>
  );
}
