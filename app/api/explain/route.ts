import { NextResponse } from "next/server";

type Item = { label?: string; detail?: string; why?: string };
const clip = (v: unknown) => String(v ?? "").slice(0, 200);

// Models to try in order of Google AI Studio availability
const MODELS_TO_TRY = [
  "gemini-2.5-flash",
  "gemini-2.0-flash",
  "gemini-1.5-flash-latest",
];

export async function POST(req: Request) {
  const key = process.env.GEMINI_API_KEY?.trim();
  if (!key) {
    return NextResponse.json(
      { error: "Missing GEMINI_API_KEY in .env.local." },
      { status: 503 }
    );
  }

  let body: { repo?: string; score?: number; failed?: Item[] };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const failed = (body.failed ?? []).slice(0, 8);
  if (failed.length === 0) {
    return NextResponse.json({
      text: "Great job! This repository passes all open-source readiness checks.",
    });
  }

  const list = failed
    .map((f, i) => `${i + 1}. ${clip(f.label)} | ${clip(f.detail)} | ${clip(f.why)}`)
    .join("\n");

  const prompt = `You are a friendly open-source mentor helping a beginner.
The GitHub repository "${clip(body.repo)}" scored ${Number(body.score) || 0}/100 on an open-source readiness check.
These checks failed:
${list}

Write a short, encouraging explanation in plain English. Start with one sentence about the biggest priority. Then give up to 4 numbered steps, simplest first. No markdown symbols and no code blocks. Under 140 words.`;

  let lastError = "Could not generate AI explanation.";

  for (const model of MODELS_TO_TRY) {
    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
        }
      );

      if (res.ok) {
        const data = await res.json();
        const text = data.candidates?.[0]?.content?.parts?.map((p: any) => p.text ?? "").join("").trim();
        if (text) {
          return NextResponse.json({ text });
        }
      } else {
        const errJson = await res.json().catch(() => ({}));
        lastError = errJson.error?.message || lastError;
      }
    } catch {
      // try next model
    }
  }

  return NextResponse.json({ error: lastError }, { status: 502 });
}