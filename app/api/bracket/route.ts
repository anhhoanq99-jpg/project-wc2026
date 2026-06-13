import { NextResponse } from "next/server";
import { buildBracket } from "@/lib/data/provider";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const data = await buildBracket();
    return NextResponse.json(data, {
      headers: { "Cache-Control": "public, s-maxage=30, stale-while-revalidate=60" },
    });
  } catch {
    return NextResponse.json(
      { rounds: { r32: [], r16: [], qf: [], sf: [], third: [], final: [] }, champion: null },
      { status: 200 },
    );
  }
}
