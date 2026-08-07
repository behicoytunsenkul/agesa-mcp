import { NextResponse } from "next/server";
import { getDashboardStats } from "@/lib/firmalar";

export const runtime = "nodejs";

export async function GET() {
  try {
    const stats = await getDashboardStats();
    return NextResponse.json(stats);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Dashboard hatası";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
