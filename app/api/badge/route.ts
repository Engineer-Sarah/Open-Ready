import { parseRepo, runAudit } from "@/lib/audit";

// GET /api/badge?repo=owner/name  ->  SVG badge like "open-source ready | 92"
function badge(label: string, value: string, color: string) {
  const lw = Math.round(label.length * 6.2 + 16);
  const vw = Math.round(value.length * 6.2 + 16);
  const w = lw + vw;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="20" role="img" aria-label="${label}: ${value}">
<clipPath id="r"><rect width="${w}" height="20" rx="3"/></clipPath>
<g clip-path="url(#r)"><rect width="${lw}" height="20" fill="#555"/><rect x="${lw}" width="${vw}" height="20" fill="${color}"/></g>
<g fill="#fff" font-family="Verdana,sans-serif" font-size="11" text-anchor="middle">
<text x="${lw / 2}" y="14">${label}</text><text x="${lw + vw / 2}" y="14">${value}</text></g></svg>`;
}

export async function GET(req: Request) {
  const repo = new URL(req.url).searchParams.get("repo") ?? "";
  const parsed = parseRepo(repo);
  let svg = badge("open-source ready", "unknown", "#9f9f9f");

  if (parsed) {
    try {
      const { score } = await runAudit(parsed.owner, parsed.name);
      const color = score >= 80 ? "#2ea44f" : score >= 50 ? "#dfb317" : "#d73a49";
      svg = badge("open-source ready", String(score), color);
    } catch {
      // keep the "unknown" badge
    }
  }

  return new Response(svg, {
    headers: {
      "Content-Type": "image/svg+xml",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
