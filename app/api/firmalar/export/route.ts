import { NextResponse } from "next/server";
import { firmalarToWorkbookBuffer } from "@/lib/excel";
import { listFirmalar } from "@/lib/firmalar";

export const runtime = "nodejs";

export async function GET() {
  try {
    const { items } = await listFirmalar({ limit: 5000, offset: 0 });
    const buffer = firmalarToWorkbookBuffer(items);
    const filename = `firmalar_${new Date().toISOString().slice(0, 10)}.xlsx`;

    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Export hatası";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
