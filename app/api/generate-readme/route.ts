import { NextResponse } from "next/server";

const MODELS_TO_TRY = [
  "gemini-2.5-flash",
  "gemini-2.0-flash",
  "gemini-1.5-flash-latest",
  "gemini-1.5-flash",
];

export async function POST(req: Request) {
  const key = process.env.GEMINI_API_KEY?.trim();
  if (!key) {
    return NextResponse.json({ error: "Missing GEMINI_API_KEY in .env.local" }, { status: 503 });
  }

  let body: { repo: string; description?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request payload" }, { status: 400 });
  }

  const prompt = `You are a world-class open-source maintainer. Write an aesthetic, modern README.md for the GitHub repository "${body.repo}".
Context / Description: ${body.description || "Open source software project"}.

Include:
1. Centered Title and Shields badges
2. Problem Statement and Solution Overview
3. Core Features (bulleted with clean emojis)
4. Quick Setup Instructions (Node.js/npm)
5. Usage Guide
6. MIT License section

Keep it concise, production-ready, and beautifully structured. Output raw markdown only.`;

  let lastError = "Could not generate README.";

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
          return NextResponse.json({ readme: text });
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