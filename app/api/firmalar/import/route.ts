import { NextRequest, NextResponse } from "next/server";
import { parseFirmalarWorkbook } from "@/lib/excel";
import { upsertFirmaByAdi } from "@/lib/firmalar";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const form = await req.formData();
    const file = form.get("file");
    if (!file || !(file instanceof File)) {
      return NextResponse.json(
        { error: "Excel dosyası (file) gerekli." },
        { status: 400 }
      );
    }

    const name = file.name.toLowerCase();
    if (!name.endsWith(".xlsx") && !name.endsWith(".xls")) {
      return NextResponse.json(
        { error: "Sadece .xlsx / .xls kabul edilir." },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const rows = parseFirmalarWorkbook(buffer);

    let upserted = 0;
    for (const row of rows) {
      await upsertFirmaByAdi(row);
      upserted += 1;
    }

    return NextResponse.json({
      ok: true,
      upserted,
      sheet_hint: "Firmalar",
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Import hatası";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
