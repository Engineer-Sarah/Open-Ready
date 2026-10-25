import { NextResponse } from "next/server";
import { AuditError, parseRepo, runAudit } from "@/lib/audit";

export async function POST(req: Request) {
  let body: { repo?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const parsed = parseRepo(body.repo ?? "");
  if (!parsed) {
    return NextResponse.json(
      { error: "Please enter a valid GitHub URL or owner/name." },
      { status: 400 }
    );
  }

  try {
    const result = await runAudit(parsed.owner, parsed.name);
    return NextResponse.json(result);
  } catch (e) {
    if (e instanceof AuditError) {
      return NextResponse.json({ error: e.message }, { status: e.status });
    }
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}