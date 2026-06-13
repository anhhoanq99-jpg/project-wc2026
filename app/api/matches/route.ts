import { NextResponse } from "next/server";
import { buildMergedMatches } from "@/lib/data/provider";

// Luôn chạy động (không prerender), tự thêm cache ngắn ở header.
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const matches = await buildMergedMatches();
    return NextResponse.json(matches, {
      headers: { "Cache-Control": "public, s-maxage=20, stale-while-revalidate=40" },
    });
  } catch {
    return NextResponse.json([], { status: 200 });
  }
}
