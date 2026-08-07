import { NextRequest, NextResponse } from "next/server";
import { deleteSession, getSessionMessages } from "@/lib/chat";

export const runtime = "nodejs";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const data = await getSessionMessages(id);
    if (!data) {
      return NextResponse.json({ error: "Session bulunamadı" }, { status: 404 });
    }
    return NextResponse.json(data);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Transcript hatası";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const ok = await deleteSession(id);
    if (!ok) {
      return NextResponse.json({ error: "Session bulunamadı" }, { status: 404 });
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Silme hatası";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
