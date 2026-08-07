import { NextResponse } from "next/server";
import { getFilterOptions } from "@/lib/firmalar";

export const runtime = "nodejs";

export async function GET() {
  try {
    const options = await getFilterOptions();
    return NextResponse.json(options);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Options hatası";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
