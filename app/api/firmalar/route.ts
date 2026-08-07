import { NextRequest, NextResponse } from "next/server";
import { createFirma, listFirmalar } from "@/lib/firmalar";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  try {
    const sp = req.nextUrl.searchParams;
    const result = await listFirmalar({
      q: sp.get("q") || undefined,
      ana_kategori: sp.get("ana_kategori") || undefined,
      iletildigi_kanal: sp.get("iletildigi_kanal") || undefined,
      degerlendirme: sp.get("degerlendirme") || undefined,
      kapanma_durumu: sp.get("kapanma_durumu") || undefined,
      tarih_alani: sp.get("tarih_alani") || undefined,
      tarih_mod: sp.get("tarih_mod") || undefined,
      tarih: sp.get("tarih") || undefined,
      tarih_baslangic: sp.get("tarih_baslangic") || undefined,
      tarih_bitis: sp.get("tarih_bitis") || undefined,
      limit: sp.get("limit") ? Number(sp.get("limit")) : 1000,
      offset: sp.get("offset") ? Number(sp.get("offset")) : 0,
    });
    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Liste hatası";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    if (!body?.firma_adi?.toString().trim()) {
      return NextResponse.json(
        { error: "firma_adi zorunludur." },
        { status: 400 }
      );
    }
    const item = await createFirma(body);
    return NextResponse.json(item, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Oluşturma hatası";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
