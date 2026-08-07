import * as XLSX from "xlsx";
import type { Firma, FirmaInput } from "./types";

function normalizeValue(deger: unknown): string | number | null {
  if (deger === undefined || deger === null || deger === "") return null;
  if (deger instanceof Date) {
    return deger.toISOString().slice(0, 10);
  }
  if (typeof deger === "number" && Number.isFinite(deger)) {
    return deger;
  }
  return String(deger);
}

function cell(row: Record<string, unknown>, ...keys: string[]) {
  for (const key of keys) {
    if (key in row && row[key] !== undefined) return row[key];
  }
  return undefined;
}

export function parseFirmalarWorkbook(buffer: Buffer | ArrayBuffer): FirmaInput[] {
  const workbook = XLSX.read(buffer, { type: "buffer", cellDates: true });
  const sheetName =
    workbook.SheetNames.find((n) => n.toLocaleLowerCase("tr") === "firmalar") ||
    workbook.SheetNames[0];

  if (!sheetName) {
    throw new Error("Excel dosyasında sayfa bulunamadı.");
  }

  const sheet = workbook.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
    defval: null,
    raw: false,
  });

  const cikti: FirmaInput[] = [];
  let atlanan = 0;

  for (const ham of rows) {
    const firmaAdi = normalizeValue(
      cell(ham, "Firma Adı", "firma_adi", "Firma Adi")
    );
    if (!firmaAdi || typeof firmaAdi !== "string") {
      atlanan += 1;
      continue;
    }

    const siraRaw = normalizeValue(cell(ham, "Sıra", "sira", "Sira"));
    let sira: number | null = null;
    if (typeof siraRaw === "number") sira = siraRaw;
    else if (typeof siraRaw === "string" && siraRaw.trim()) {
      const n = Number(siraRaw);
      sira = Number.isFinite(n) ? n : null;
    }

    cikti.push({
      sira,
      firma_adi: firmaAdi,
      firma_aciklamasi: toStr(
        normalizeValue(cell(ham, "Firma Açıklaması", "firma_aciklamasi"))
      ),
      urun_gami: toStr(normalizeValue(cell(ham, "Ürün Gamı", "urun_gami"))),
      iletildigi_kanal: toStr(
        normalizeValue(cell(ham, "İletildiği Kanal", "iletildigi_kanal"))
      ),
      ana_kategori: toStr(
        normalizeValue(cell(ham, "Ana Kategori", "ana_kategori"))
      ),
      alt_kategori: toStr(
        normalizeValue(cell(ham, "Alt Kategori", "alt_kategori"))
      ),
      degerlendirme: toStr(
        normalizeValue(cell(ham, "Değerlendirme", "degerlendirme"))
      ),
      referans: toStr(normalizeValue(cell(ham, "Referans", "referans"))),
      rakipler: toStr(normalizeValue(cell(ham, "Rakipler", "rakipler"))),
      ekip: toStr(normalizeValue(cell(ham, "Ekip", "ekip"))),
      not_metni: toStr(normalizeValue(cell(ham, "Not", "not_metni"))),
      link: toStr(normalizeValue(cell(ham, "Link", "link"))),
      yol_haritasi_giris_tarihi: toStr(
        normalizeValue(
          cell(ham, "Yol Haritası Giriş Tarihi", "yol_haritasi_giris_tarihi")
        )
      ),
      gorusme_tarihi: toStr(
        normalizeValue(cell(ham, "Görüşme Tarihi", "gorusme_tarihi"))
      ),
      katilimcilar: toStr(
        normalizeValue(cell(ham, "Katılımcılar", "katilimcilar"))
      ),
    });
  }

  if (!cikti.length) {
    throw new Error(
      `Geçerli satır bulunamadı (sheet: ${sheetName}). Atlanan boş ad: ${atlanan}`
    );
  }

  return cikti;
}

function toStr(v: string | number | null): string | null {
  if (v == null) return null;
  return String(v);
}

export function firmalarToWorkbookBuffer(items: Firma[]): Buffer {
  const rows = items.map((f) => ({
    Sıra: f.sira,
    "Firma Adı": f.firma_adi,
    "Firma Açıklaması": f.firma_aciklamasi,
    "Ürün Gamı": f.urun_gami,
    "İletildiği Kanal": f.iletildigi_kanal,
    "Ana Kategori": f.ana_kategori,
    "Alt Kategori": f.alt_kategori,
    Değerlendirme: f.degerlendirme,
    Referans: f.referans,
    Rakipler: f.rakipler,
    Ekip: f.ekip,
    Not: f.not_metni,
    Link: f.link,
    "Yol Haritası Giriş Tarihi": f.yol_haritasi_giris_tarihi,
    "Görüşme Tarihi": f.gorusme_tarihi,
    Katılımcılar: f.katilimcilar,
  }));

  const worksheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Firmalar");
  const out = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });
  return Buffer.from(out);
}
