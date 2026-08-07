import { NextResponse } from "next/server";
import { listSessions } from "@/lib/chat";

export const runtime = "nodejs";

export async function GET() {
  try {
    const sessions = await listSessions();
    return NextResponse.json({ sessions });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Sessions hatası";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
