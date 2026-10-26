import { NextResponse } from "next/server";

const MODELS_TO_TRY = [
  "gemini-2.5-flash",
  "gemini-2.0-flash",
  "gemini-1.5-flash-latest",
];

export async function POST(req: Request) {
  const key = process.env.GEMINI_API_KEY?.trim();
  if (!key) {
    return NextResponse.json({ error: "Missing GEMINI_API_KEY in .env.local." }, { status: 503 });
  }

  let body: { repo: string; description?: string; topics?: string[] };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request payload." }, { status: 400 });
  }

  const prompt = `You are a world-class open-source maintainer. Write an aesthetic, production-grade, complete README.md for the following GitHub repository:
- Repository Name: ${body.repo}
- Description: ${body.description || "Open source software project"}
- Topics/Keywords: ${(body.topics || []).join(", ") || "open-source, developer-tools"}

Include:
1. Centered header with a clean title and badges
2. Problem Statement & Solution
3. Key Features (bulleted with clean emojis)
4. Quick Setup Instructions (Node.js/npm)
5. Usage Guide
6. Contributing Guidelines section
7. MIT License section

Make it sleek, professional, and ready to push to GitHub. Output raw markdown only, with no introductory text.`;

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
        if (text) return NextResponse.json({ readme: text });
      }
    } catch {
      // try next fallback
    }
  }

  return NextResponse.json({ error: "Could not generate README at this time." }, { status: 502 });
}