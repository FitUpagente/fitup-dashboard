import { NextResponse } from "next/server";

export const runtime = "edge";

export async function GET(request: Request) {
  // Verify the request comes from Vercel Cron
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const token = process.env.GITHUB_TOKEN;
  if (!token) {
    return NextResponse.json({ error: "GITHUB_TOKEN not configured" }, { status: 500 });
  }

  try {
    const res = await fetch(
      "https://api.github.com/repos/FitUpagente/AgenteFitup/actions/workflows/dar-pipeline.yml/dispatches",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/vnd.github+json",
          "X-GitHub-Api-Version": "2022-11-28",
        },
        body: JSON.stringify({ ref: "main" }),
      }
    );

    if (res.status === 204) {
      return NextResponse.json({ ok: true, message: "Pipeline triggered" });
    }

    const body = await res.text();
    return NextResponse.json({ error: "GitHub API error", status: res.status, body }, { status: 500 });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
