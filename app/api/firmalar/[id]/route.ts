import { NextRequest, NextResponse } from "next/server";
import { deleteFirma, getFirma, updateFirma } from "@/lib/firmalar";

export const runtime = "nodejs";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const item = await getFirma(Number(id));
    if (!item) {
      return NextResponse.json({ error: "Bulunamadı" }, { status: 404 });
    }
    return NextResponse.json(item);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Hata";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const body = await req.json();
    const item = await updateFirma(Number(id), body);
    if (!item) {
      return NextResponse.json({ error: "Bulunamadı" }, { status: 404 });
    }
    return NextResponse.json(item);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Güncelleme hatası";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const ok = await deleteFirma(Number(id));
    if (!ok) {
      return NextResponse.json({ error: "Bulunamadı" }, { status: 404 });
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Silme hatası";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
