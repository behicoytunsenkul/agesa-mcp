import { query } from "./db";
import type { DashboardStats, Firma, FirmaFilters, FirmaInput } from "./types";

const COLUMNS = `
  id, sira, firma_adi, firma_aciklamasi, urun_gami, iletildigi_kanal,
  ana_kategori, alt_kategori, degerlendirme, referans, rakipler, ekip,
  not_metni, link, yol_haritasi_giris_tarihi, gorusme_tarihi, katilimcilar,
  updated_at
`;

function buildWhere(filters: FirmaFilters) {
  const clauses: string[] = [];
  const params: unknown[] = [];
  let i = 1;

  if (filters.q?.trim()) {
    clauses.push(
      `(firma_adi ILIKE $${i} OR firma_aciklamasi ILIKE $${i} OR not_metni ILIKE $${i} OR ekip ILIKE $${i} OR referans ILIKE $${i})`
    );
    params.push(`%${filters.q.trim()}%`);
    i += 1;
  }
  if (filters.ana_kategori?.trim()) {
    clauses.push(`ana_kategori ILIKE $${i}`);
    params.push(`%${filters.ana_kategori.trim()}%`);
    i += 1;
  }
  if (filters.iletildigi_kanal?.trim()) {
    clauses.push(`iletildigi_kanal ILIKE $${i}`);
    params.push(`%${filters.iletildigi_kanal.trim()}%`);
    i += 1;
  }
  if (filters.degerlendirme?.trim()) {
    clauses.push(`degerlendirme ILIKE $${i}`);
    params.push(`%${filters.degerlendirme.trim()}%`);
    i += 1;
  }

  const kapanma = (filters.kapanma_durumu || "").trim().toLowerCase();
  if (kapanma === "kapandi") {
    clauses.push(`degerlendirme ILIKE $${i}`);
    params.push("%Kapandı%");
    i += 1;
  } else if (kapanma === "aktif") {
    clauses.push(
      `(degerlendirme IS NOT NULL AND TRIM(degerlendirme) <> '' AND degerlendirme NOT ILIKE $${i})`
    );
    params.push("%Kapandı%");
    i += 1;
  } else if (kapanma === "eksik") {
    clauses.push(`(degerlendirme IS NULL OR TRIM(degerlendirme) = '')`);
  }

  const tarihAlani = (filters.tarih_alani || "").trim();
  if (tarihAlani === "updated_at") {
    const { bas, bit } = resolveDateBounds(filters);
    if (bas) {
      clauses.push(`updated_at::date >= $${i}::date`);
      params.push(bas);
      i += 1;
    }
    if (bit) {
      clauses.push(`updated_at::date <= $${i}::date`);
      params.push(bit);
      i += 1;
    }
  }

  return {
    where: clauses.length ? `WHERE ${clauses.join(" AND ")}` : "",
    params,
    nextIndex: i,
  };
}

function resolveDateBounds(filters: FirmaFilters) {
  const mod = (filters.tarih_mod || "tek").trim().toLowerCase();
  if (mod === "aralik") {
    return {
      bas: filters.tarih_baslangic?.trim() || null,
      bit: filters.tarih_bitis?.trim() || null,
    };
  }
  const tek = filters.tarih?.trim() || null;
  return { bas: tek, bit: tek };
}

/** Parse DD.MM.YYYY, YYYY-MM-DD, or Excel serial from messy text fields. */
function extractDatesFromText(raw: string | null | undefined): Date[] {
  if (!raw || !String(raw).trim()) return [];
  const text = String(raw);
  const out: Date[] = [];

  const dmy = text.matchAll(/(\d{1,2})[./](\d{1,2})[./](\d{4})/g);
  for (const m of dmy) {
    const d = Number(m[1]);
    const mo = Number(m[2]);
    const y = Number(m[3]);
    const dt = new Date(Date.UTC(y, mo - 1, d));
    if (!Number.isNaN(dt.getTime())) out.push(dt);
  }

  const ymd = text.matchAll(/(\d{4})-(\d{2})-(\d{2})/g);
  for (const m of ymd) {
    const dt = new Date(`${m[1]}-${m[2]}-${m[3]}T00:00:00Z`);
    if (!Number.isNaN(dt.getTime())) out.push(dt);
  }

  // Excel serial (standalone number tokens ~ 40000-60000)
  const serials = text.matchAll(/(?:^|[\s\n,;])(\d{5})(?:$|[\s\n,;])/g);
  for (const m of serials) {
    const serial = Number(m[1]);
    if (serial >= 30000 && serial <= 60000) {
      // Excel epoch 1899-12-30
      const dt = new Date(Date.UTC(1899, 11, 30) + serial * 86400000);
      if (!Number.isNaN(dt.getTime())) out.push(dt);
    }
  }

  return out;
}

function parseIsoDay(iso: string) {
  const d = new Date(`${iso}T00:00:00Z`);
  return Number.isNaN(d.getTime()) ? null : d;
}

function rowMatchesDateFilter(firma: Firma, filters: FirmaFilters) {
  const alan = (filters.tarih_alani || "").trim();
  if (!alan || alan === "updated_at") return true;

  const { bas, bit } = resolveDateBounds(filters);
  if (!bas && !bit) return true;

  const basD = bas ? parseIsoDay(bas) : null;
  const bitD = bit ? parseIsoDay(bit) : null;
  if (!basD && !bitD) return true;

  const raw =
    alan === "yol_haritasi_giris_tarihi"
      ? firma.yol_haritasi_giris_tarihi
      : firma.gorusme_tarihi;

  const dates = extractDatesFromText(raw);
  if (!dates.length) return false;

  return dates.some((d) => {
    const t = d.getTime();
    if (basD && t < basD.getTime()) return false;
    if (bitD && t > bitD.getTime() + 86400000 - 1) return false;
    return true;
  });
}

export async function listFirmalar(filters: FirmaFilters = {}) {
  const { where, params, nextIndex } = buildWhere(filters);
  const limit = Math.min(Math.max(filters.limit ?? 500, 1), 5000);
  const offset = Math.max(filters.offset ?? 0, 0);

  const needsTextDateFilter =
    !!filters.tarih_alani &&
    filters.tarih_alani !== "updated_at" &&
    !!(
      filters.tarih?.trim() ||
      filters.tarih_baslangic?.trim() ||
      filters.tarih_bitis?.trim()
    );

  if (!needsTextDateFilter) {
    const countRes = await query<{ count: string }>(
      `SELECT COUNT(*)::text AS count FROM public.firmalar ${where}`,
      params
    );

    const dataRes = await query<Firma>(
      `SELECT ${COLUMNS}
       FROM public.firmalar
       ${where}
       ORDER BY sira NULLS LAST, firma_adi
       LIMIT $${nextIndex} OFFSET $${nextIndex + 1}`,
      [...params, limit, offset]
    );

    return {
      total: parseInt(countRes.rows[0]?.count ?? "0", 10),
      items: dataRes.rows,
    };
  }

  // Text date fields require post-filtering
  const dataRes = await query<Firma>(
    `SELECT ${COLUMNS}
     FROM public.firmalar
     ${where}
     ORDER BY sira NULLS LAST, firma_adi
     LIMIT 5000`,
    params
  );

  const matched = dataRes.rows.filter((row) =>
    rowMatchesDateFilter(row, filters)
  );

  return {
    total: matched.length,
    items: matched.slice(offset, offset + limit),
  };
}

export async function getFirma(id: number) {
  const res = await query<Firma>(
    `SELECT ${COLUMNS} FROM public.firmalar WHERE id = $1`,
    [id]
  );
  return res.rows[0] ?? null;
}

export async function createFirma(input: FirmaInput) {
  const res = await query<Firma>(
    `INSERT INTO public.firmalar (
      sira, firma_adi, firma_aciklamasi, urun_gami, iletildigi_kanal,
      ana_kategori, alt_kategori, degerlendirme, referans, rakipler, ekip,
      not_metni, link, yol_haritasi_giris_tarihi, gorusme_tarihi, katilimcilar
    ) VALUES (
      $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16
    )
    RETURNING ${COLUMNS}`,
    [
      input.sira ?? null,
      input.firma_adi,
      input.firma_aciklamasi ?? null,
      input.urun_gami ?? null,
      input.iletildigi_kanal ?? null,
      input.ana_kategori ?? null,
      input.alt_kategori ?? null,
      input.degerlendirme ?? null,
      input.referans ?? null,
      input.rakipler ?? null,
      input.ekip ?? null,
      input.not_metni ?? null,
      input.link ?? null,
      input.yol_haritasi_giris_tarihi ?? null,
      input.gorusme_tarihi ?? null,
      input.katilimcilar ?? null,
    ]
  );
  return res.rows[0];
}

export async function updateFirma(id: number, input: Partial<FirmaInput>) {
  const fields: Array<keyof FirmaInput> = [
    "sira",
    "firma_adi",
    "firma_aciklamasi",
    "urun_gami",
    "iletildigi_kanal",
    "ana_kategori",
    "alt_kategori",
    "degerlendirme",
    "referans",
    "rakipler",
    "ekip",
    "not_metni",
    "link",
    "yol_haritasi_giris_tarihi",
    "gorusme_tarihi",
    "katilimcilar",
  ];

  const sets: string[] = [];
  const params: unknown[] = [];
  let i = 1;

  for (const field of fields) {
    if (field in input) {
      sets.push(`${field} = $${i}`);
      params.push(input[field] ?? null);
      i += 1;
    }
  }

  if (!sets.length) {
    return getFirma(id);
  }

  sets.push(`updated_at = NOW()`);
  params.push(id);

  const res = await query<Firma>(
    `UPDATE public.firmalar SET ${sets.join(", ")} WHERE id = $${i} RETURNING ${COLUMNS}`,
    params
  );
  return res.rows[0] ?? null;
}

export async function deleteFirma(id: number) {
  const res = await query(`DELETE FROM public.firmalar WHERE id = $1`, [id]);
  return (res.rowCount ?? 0) > 0;
}

export async function upsertFirmaByAdi(input: FirmaInput) {
  const res = await query<Firma>(
    `INSERT INTO public.firmalar (
      sira, firma_adi, firma_aciklamasi, urun_gami, iletildigi_kanal,
      ana_kategori, alt_kategori, degerlendirme, referans, rakipler, ekip,
      not_metni, link, yol_haritasi_giris_tarihi, gorusme_tarihi, katilimcilar
    ) VALUES (
      $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16
    )
    ON CONFLICT (firma_adi) DO UPDATE SET
      sira = EXCLUDED.sira,
      firma_aciklamasi = EXCLUDED.firma_aciklamasi,
      urun_gami = EXCLUDED.urun_gami,
      iletildigi_kanal = EXCLUDED.iletildigi_kanal,
      ana_kategori = EXCLUDED.ana_kategori,
      alt_kategori = EXCLUDED.alt_kategori,
      degerlendirme = EXCLUDED.degerlendirme,
      referans = EXCLUDED.referans,
      rakipler = EXCLUDED.rakipler,
      ekip = EXCLUDED.ekip,
      not_metni = EXCLUDED.not_metni,
      link = EXCLUDED.link,
      yol_haritasi_giris_tarihi = EXCLUDED.yol_haritasi_giris_tarihi,
      gorusme_tarihi = EXCLUDED.gorusme_tarihi,
      katilimcilar = EXCLUDED.katilimcilar,
      updated_at = NOW()
    RETURNING ${COLUMNS}`,
    [
      input.sira ?? null,
      input.firma_adi,
      input.firma_aciklamasi ?? null,
      input.urun_gami ?? null,
      input.iletildigi_kanal ?? null,
      input.ana_kategori ?? null,
      input.alt_kategori ?? null,
      input.degerlendirme ?? null,
      input.referans ?? null,
      input.rakipler ?? null,
      input.ekip ?? null,
      input.not_metni ?? null,
      input.link ?? null,
      input.yol_haritasi_giris_tarihi ?? null,
      input.gorusme_tarihi ?? null,
      input.katilimcilar ?? null,
    ]
  );
  return res.rows[0];
}

async function distribution(column: string) {
  const res = await query<{ deger: string; adet: string }>(
    `SELECT COALESCE(NULLIF(TRIM(${column}), ''), 'Belirtilmemiş') AS deger,
            COUNT(*)::text AS adet
     FROM public.firmalar
     GROUP BY 1
     ORDER BY COUNT(*) DESC
     LIMIT 30`
  );
  const totalRes = await query<{ count: string }>(
    `SELECT COUNT(*)::text AS count FROM public.firmalar`
  );
  const total = parseInt(totalRes.rows[0]?.count ?? "0", 10) || 1;
  return res.rows.map((r) => {
    const adet = parseInt(r.adet, 10);
    return {
      deger: r.deger,
      adet,
      yuzde: Math.round((adet / total) * 1000) / 10,
    };
  });
}

const PIPELINE_TAGS = [
  "Kapandı",
  "İzleme",
  "Canlıda",
  "Yatırım",
  "POC",
  "NDA",
  "Deep Dive",
  "Firma Görüşmesi",
] as const;

function hasTag(degerlendirme: string | null, tag: string) {
  if (!degerlendirme) return false;
  const n = degerlendirme.toLocaleLowerCase("tr");
  return n.includes(tag.toLocaleLowerCase("tr"));
}

export async function getDashboardStats(): Promise<DashboardStats> {
  const totalRes = await query<{ count: string }>(
    `SELECT COUNT(*)::text AS count FROM public.firmalar`
  );
  const total = parseInt(totalRes.rows[0]?.count ?? "0", 10);
  const pct = (n: number) =>
    total ? Math.round((n / total) * 1000) / 10 : 0;

  const distinctRes = await query<{
    kategori: string;
    degerlendirme: string;
    kanal: string;
  }>(
    `SELECT
       COUNT(DISTINCT NULLIF(TRIM(ana_kategori), ''))::text AS kategori,
       COUNT(DISTINCT NULLIF(TRIM(degerlendirme), ''))::text AS degerlendirme,
       COUNT(DISTINCT NULLIF(TRIM(iletildigi_kanal), ''))::text AS kanal
     FROM public.firmalar`
  );

  const fillRes = await query<{
    with_link: string;
    with_ekip: string;
    with_gorusme: string;
    with_not: string;
    with_ref: string;
    with_rakip: string;
    with_aciklama: string;
    with_alt: string;
    no_deg: string;
  }>(
    `SELECT
       COUNT(*) FILTER (WHERE link IS NOT NULL AND TRIM(link) <> '')::text AS with_link,
       COUNT(*) FILTER (WHERE ekip IS NOT NULL AND TRIM(ekip) <> '')::text AS with_ekip,
       COUNT(*) FILTER (WHERE gorusme_tarihi IS NOT NULL AND TRIM(gorusme_tarihi) <> '')::text AS with_gorusme,
       COUNT(*) FILTER (WHERE not_metni IS NOT NULL AND TRIM(not_metni) <> '')::text AS with_not,
       COUNT(*) FILTER (WHERE referans IS NOT NULL AND TRIM(referans) <> '')::text AS with_ref,
       COUNT(*) FILTER (WHERE rakipler IS NOT NULL AND TRIM(rakipler) <> '')::text AS with_rakip,
       COUNT(*) FILTER (WHERE firma_aciklamasi IS NOT NULL AND TRIM(firma_aciklamasi) <> '')::text AS with_aciklama,
       COUNT(*) FILTER (WHERE alt_kategori IS NOT NULL AND TRIM(alt_kategori) <> '')::text AS with_alt,
       COUNT(*) FILTER (WHERE degerlendirme IS NULL OR TRIM(degerlendirme) = '')::text AS no_deg
     FROM public.firmalar`
  );

  const recent = await query<
    Pick<Firma, "id" | "firma_adi" | "ana_kategori" | "degerlendirme" | "updated_at">
  >(
    `SELECT id, firma_adi, ana_kategori, degerlendirme, updated_at
     FROM public.firmalar
     ORDER BY updated_at DESC NULLS LAST
     LIMIT 8`
  );

  const tagRows = await query<{
    ana_kategori: string | null;
    degerlendirme: string | null;
  }>(`SELECT ana_kategori, degerlendirme FROM public.firmalar`);

  const tagCounts = new Map<string, number>();
  for (const tag of PIPELINE_TAGS) tagCounts.set(tag, 0);

  let kapandi = 0;
  let aktif_pipeline = 0;
  const cross = new Map<string, number>();

  for (const row of tagRows.rows) {
    const isKapandi = hasTag(row.degerlendirme, "Kapandı");
    if (isKapandi) kapandi += 1;
    else aktif_pipeline += 1;

    for (const tag of PIPELINE_TAGS) {
      if (!hasTag(row.degerlendirme, tag)) continue;
      tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
      const kat =
        (row.ana_kategori && row.ana_kategori.trim()) || "Belirtilmemiş";
      if (["Kapandı", "İzleme", "Canlıda", "Yatırım", "POC"].includes(tag)) {
        const key = `${kat}||${tag}`;
        cross.set(key, (cross.get(key) || 0) + 1);
      }
    }
  }

  const pipeline_etiketleri = PIPELINE_TAGS.map((etiket) => {
    const adet = tagCounts.get(etiket) || 0;
    return { etiket, adet, yuzde: pct(adet) };
  }).sort((a, b) => b.adet - a.adet);

  const fill = fillRes.rows[0];
  const veri_doluluk = [
    { alan: "Açıklama", adet: parseInt(fill?.with_aciklama ?? "0", 10) },
    { alan: "Alt kategori", adet: parseInt(fill?.with_alt ?? "0", 10) },
    { alan: "Link", adet: parseInt(fill?.with_link ?? "0", 10) },
    { alan: "Not", adet: parseInt(fill?.with_not ?? "0", 10) },
    { alan: "Ekip", adet: parseInt(fill?.with_ekip ?? "0", 10) },
    { alan: "Görüşme tarihi", adet: parseInt(fill?.with_gorusme ?? "0", 10) },
    { alan: "Referans", adet: parseInt(fill?.with_ref ?? "0", 10) },
    { alan: "Rakipler", adet: parseInt(fill?.with_rakip ?? "0", 10) },
  ];

  const refRes = await query<{ referans: string | null }>(
    `SELECT referans FROM public.firmalar
     WHERE referans IS NOT NULL AND TRIM(referans) <> ''`
  );
  const refMap = new Map<string, number>();
  for (const row of refRes.rows) {
    const parts = String(row.referans)
      .split(/[\n,;/|]+/)
      .map((s) => s.trim())
      .filter((s) => s && s.toLowerCase() !== "n/a" && s.length > 1);
    for (const p of parts) {
      refMap.set(p, (refMap.get(p) || 0) + 1);
    }
  }
  const top_referanslar = [...refMap.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 12)
    .map(([deger, adet]) => ({ deger, adet, yuzde: pct(adet) }));

  let chat_ozet = {
    session_sayisi: 0,
    mesaj_sayisi: 0,
    son_7_gun_session: 0,
  };
  try {
    const chatRes = await query<{
      sessions: string;
      messages: string;
      recent: string;
    }>(
      `SELECT
         (SELECT COUNT(*)::text FROM public.chat_sessions) AS sessions,
         (SELECT COUNT(*)::text FROM public.chat_messages) AS messages,
         (SELECT COUNT(*)::text FROM public.chat_sessions
          WHERE updated_at >= NOW() - INTERVAL '7 days') AS recent`
    );
    chat_ozet = {
      session_sayisi: parseInt(chatRes.rows[0]?.sessions ?? "0", 10),
      mesaj_sayisi: parseInt(chatRes.rows[0]?.messages ?? "0", 10),
      son_7_gun_session: parseInt(chatRes.rows[0]?.recent ?? "0", 10),
    };
  } catch {
    // chat tables may be missing on older DBs
  }

  const [
    ana_kategori_dagilimi,
    alt_kategori_dagilimi,
    degerlendirme_dagilimi,
    kanal_dagilimi,
  ] = await Promise.all([
    distribution("ana_kategori"),
    distribution("alt_kategori"),
    distribution("degerlendirme"),
    distribution("iletildigi_kanal"),
  ]);

  const veri_doluluk_final = veri_doluluk.map((v) => ({
    ...v,
    yuzde: pct(v.adet),
  }));

  const topKatNames = new Set(
    ana_kategori_dagilimi.slice(0, 6).map((x) => x.deger)
  );
  const kategori_x_pipeline = [...cross.entries()]
    .map(([key, adet]) => {
      const [kategori, etiket] = key.split("||");
      return { kategori, etiket, adet };
    })
    .filter((c) => topKatNames.has(c.kategori))
    .sort((a, b) => b.adet - a.adet);

  const d = distinctRes.rows[0];
  return {
    toplam_firma: total,
    kategori_sayisi: parseInt(d?.kategori ?? "0", 10),
    degerlendirme_sayisi: parseInt(d?.degerlendirme ?? "0", 10),
    kanal_sayisi: parseInt(d?.kanal ?? "0", 10),
    aktif_pipeline,
    kapandi,
    degerlendirme_eksik: parseInt(fill?.no_deg ?? "0", 10),
    ana_kategori_dagilimi,
    alt_kategori_dagilimi,
    degerlendirme_dagilimi,
    kanal_dagilimi,
    pipeline_etiketleri,
    veri_doluluk: veri_doluluk_final,
    kategori_x_pipeline,
    top_referanslar,
    chat_ozet,
    son_guncellenenler: recent.rows,
  };
}

export async function getFilterOptions() {
  const [kategoriler, kanallar, degerlendirmeler] = await Promise.all([
    query<{ v: string }>(
      `SELECT DISTINCT ana_kategori AS v FROM public.firmalar
       WHERE ana_kategori IS NOT NULL AND TRIM(ana_kategori) <> ''
       ORDER BY 1`
    ),
    query<{ v: string }>(
      `SELECT DISTINCT iletildigi_kanal AS v FROM public.firmalar
       WHERE iletildigi_kanal IS NOT NULL AND TRIM(iletildigi_kanal) <> ''
       ORDER BY 1`
    ),
    query<{ v: string }>(
      `SELECT DISTINCT degerlendirme AS v FROM public.firmalar
       WHERE degerlendirme IS NOT NULL AND TRIM(degerlendirme) <> ''
       ORDER BY 1`
    ),
  ]);

  return {
    kategoriler: kategoriler.rows.map((r) => r.v),
    kanallar: kanallar.rows.map((r) => r.v),
    degerlendirmeler: degerlendirmeler.rows.map((r) => r.v),
  };
}
