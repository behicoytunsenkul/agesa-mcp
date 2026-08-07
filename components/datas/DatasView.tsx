"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import type { Firma } from "@/lib/types";
import { FirmaEditModal } from "./FirmaEditModal";

type Options = {
  kategoriler: string[];
  kanallar: string[];
  degerlendirmeler: string[];
};

const EMPTY: Partial<Firma> = {
  firma_adi: "",
  sira: null,
  firma_aciklamasi: null,
  urun_gami: null,
  iletildigi_kanal: null,
  ana_kategori: null,
  alt_kategori: null,
  degerlendirme: null,
  referans: null,
  rakipler: null,
  ekip: null,
  not_metni: null,
  link: null,
  yol_haritasi_giris_tarihi: null,
  gorusme_tarihi: null,
  katilimcilar: null,
};

const KAPANMA_OPTIONS = [
  { value: "", label: "Tümü" },
  { value: "kapandi", label: "Kapandı" },
  { value: "aktif", label: "Aktif" },
  { value: "eksik", label: "Eksik" },
] as const;

const inputClass =
  "w-full rounded-lg border border-[var(--border)] bg-white px-3 py-2.5 text-sm text-[var(--ink)] outline-none transition focus:border-[var(--amber)] focus:ring-2 focus:ring-[var(--amber)]/20";

const labelClass =
  "mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-[var(--muted)]";

export function DatasView() {
  const [items, setItems] = useState<Firma[]>([]);
  const [total, setTotal] = useState(0);
  const [options, setOptions] = useState<Options>({
    kategoriler: [],
    kanallar: [],
    degerlendirmeler: [],
  });
  const [q, setQ] = useState("");
  const [ana_kategori, setAnaKategori] = useState("");
  const [iletildigi_kanal, setKanal] = useState("");
  const [degerlendirme, setDegerlendirme] = useState("");
  const [kapanma_durumu, setKapanma] = useState("");
  const [tarih_alani, setTarihAlani] = useState("gorusme_tarihi");
  const [tarih_mod, setTarihMod] = useState<"tek" | "aralik">("tek");
  const [tarih, setTarih] = useState("");
  const [tarih_baslangic, setTarihBas] = useState("");
  const [tarih_bitis, setTarihBit] = useState("");
  const [filtersOpen, setFiltersOpen] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<Partial<Firma> | null>(null);
  const [importing, setImporting] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (q) params.set("q", q);
      if (ana_kategori) params.set("ana_kategori", ana_kategori);
      if (iletildigi_kanal) params.set("iletildigi_kanal", iletildigi_kanal);
      if (degerlendirme) params.set("degerlendirme", degerlendirme);
      if (kapanma_durumu) params.set("kapanma_durumu", kapanma_durumu);
      if (tarih || tarih_baslangic || tarih_bitis) {
        params.set("tarih_alani", tarih_alani);
        params.set("tarih_mod", tarih_mod);
        if (tarih_mod === "tek" && tarih) params.set("tarih", tarih);
        if (tarih_mod === "aralik") {
          if (tarih_baslangic) params.set("tarih_baslangic", tarih_baslangic);
          if (tarih_bitis) params.set("tarih_bitis", tarih_bitis);
        }
      }
      params.set("limit", "1000");

      const [listRes, optRes] = await Promise.all([
        fetch(`/api/firmalar?${params}`),
        fetch("/api/firmalar/options"),
      ]);
      const listData = await listRes.json();
      const optData = await optRes.json();
      if (!listRes.ok) throw new Error(listData.error || "Liste hatası");
      setItems(listData.items);
      setTotal(listData.total);
      if (optRes.ok) setOptions(optData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Hata");
    } finally {
      setLoading(false);
    }
  }, [
    q,
    ana_kategori,
    iletildigi_kanal,
    degerlendirme,
    kapanma_durumu,
    tarih_alani,
    tarih_mod,
    tarih,
    tarih_baslangic,
    tarih_bitis,
  ]);

  useEffect(() => {
    void load();
  }, [load]);

  const activeChips = useMemo(() => {
    const chips: { key: string; label: string; clear: () => void }[] = [];
    if (q.trim())
      chips.push({ key: "q", label: `Ara: ${q.trim()}`, clear: () => setQ("") });
    if (ana_kategori)
      chips.push({
        key: "kat",
        label: `Kategori: ${ana_kategori}`,
        clear: () => setAnaKategori(""),
      });
    if (iletildigi_kanal)
      chips.push({
        key: "kanal",
        label: `Kanal: ${iletildigi_kanal}`,
        clear: () => setKanal(""),
      });
    if (degerlendirme)
      chips.push({
        key: "deg",
        label: `Değerlendirme: ${degerlendirme.slice(0, 40)}`,
        clear: () => setDegerlendirme(""),
      });
    if (kapanma_durumu) {
      const lab =
        KAPANMA_OPTIONS.find((o) => o.value === kapanma_durumu)?.label ||
        kapanma_durumu;
      chips.push({
        key: "kap",
        label: `Durum: ${lab}`,
        clear: () => setKapanma(""),
      });
    }
    if (tarih_mod === "tek" && tarih) {
      chips.push({
        key: "tarih",
        label: `Tarih: ${tarih}`,
        clear: () => setTarih(""),
      });
    }
    if (tarih_mod === "aralik" && (tarih_baslangic || tarih_bitis)) {
      chips.push({
        key: "aralik",
        label: `Aralık: ${tarih_baslangic || "…"} → ${tarih_bitis || "…"}`,
        clear: () => {
          setTarihBas("");
          setTarihBit("");
        },
      });
    }
    return chips;
  }, [
    q,
    ana_kategori,
    iletildigi_kanal,
    degerlendirme,
    kapanma_durumu,
    tarih_mod,
    tarih,
    tarih_baslangic,
    tarih_bitis,
  ]);

  function clearAllFilters() {
    setQ("");
    setAnaKategori("");
    setKanal("");
    setDegerlendirme("");
    setKapanma("");
    setTarih("");
    setTarihBas("");
    setTarihBit("");
    setTarihMod("tek");
    setTarihAlani("gorusme_tarihi");
  }

  async function onImport(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const fileInput = form.elements.namedItem("file") as HTMLInputElement;
    const file = fileInput.files?.[0];
    if (!file) return;

    setImporting(true);
    setToast(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/firmalar/import", {
        method: "POST",
        body: fd,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Import başarısız");
      setToast(`${data.upserted} kayıt yazıldı (upsert).`);
      form.reset();
      await load();
    } catch (err) {
      setToast(err instanceof Error ? err.message : "Import hatası");
    } finally {
      setImporting(false);
    }
  }

  async function saveFirma(payload: Partial<Firma>) {
    const isNew = !payload.id;
    const res = await fetch(
      isNew ? "/api/firmalar" : `/api/firmalar/${payload.id}`,
      {
        method: isNew ? "POST" : "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }
    );
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Kaydetme hatası");
    setEditing(null);
    await load();
  }

  async function removeFirma(id: number) {
    if (!confirm("Bu firmayı silmek istediğinize emin misiniz?")) return;
    const res = await fetch(`/api/firmalar/${id}`, { method: "DELETE" });
    const data = await res.json();
    if (!res.ok) {
      alert(data.error || "Silinemedi");
      return;
    }
    await load();
  }

  return (
    <div className="px-6 py-6 lg:px-8">
      <header className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-[family-name:var(--font-display)] text-3xl text-[var(--navy)]">
            Datas
          </h1>
          <p className="mt-1 text-sm text-[var(--muted)]">
            PostgreSQL firmalar tablosu ·{" "}
            <span className="font-semibold text-[var(--navy)]">
              {total.toLocaleString("tr-TR")}
            </span>{" "}
            kayıt
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => {
              window.location.assign("/api/firmalar/export");
            }}
            className="rounded-lg border border-[var(--border)] bg-white px-3 py-2 text-sm font-medium text-[var(--navy)] hover:border-[var(--amber)]"
          >
            Excel export
          </button>
          <button
            type="button"
            onClick={() => setEditing({ ...EMPTY })}
            className="rounded-lg bg-[var(--navy)] px-3 py-2 text-sm font-medium text-white"
          >
            Yeni firma
          </button>
        </div>
      </header>

      <form
        onSubmit={onImport}
        className="mb-4 flex flex-col gap-3 rounded-xl bg-white px-4 py-3 shadow-sm ring-1 ring-[var(--border)] sm:flex-row sm:flex-wrap sm:items-center"
      >
        <label className="text-sm font-medium text-[var(--navy)]">
          Excel import
        </label>
        <input
          type="file"
          name="file"
          accept=".xlsx,.xls"
          className="text-sm"
          required
        />
        <button
          type="submit"
          disabled={importing}
          className="rounded-lg bg-[var(--amber)] px-3 py-1.5 text-sm font-semibold text-[var(--navy)] disabled:opacity-50"
        >
          {importing ? "Yükleniyor…" : "Yükle (upsert)"}
        </button>
        <span className="text-xs text-[var(--muted)]">
          Sheet adı tercihen &quot;Firmalar&quot;
        </span>
      </form>

      {toast && (
        <p className="mb-3 rounded-lg bg-white px-3 py-2 text-sm shadow-sm ring-1 ring-[var(--border)]">
          {toast}
        </p>
      )}

      {/* Filters */}
      <section className="mb-5 overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-[var(--border)]">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--border)] bg-[var(--navy)] px-4 py-3 text-white sm:px-5">
          <div>
            <p className="text-sm font-semibold">Filtreler</p>
            <p className="text-[11px] text-white/60">
              Kapanma durumu, tarih ve portföy alanları
            </p>
          </div>
          <div className="flex items-center gap-2">
            {activeChips.length > 0 && (
              <button
                type="button"
                onClick={clearAllFilters}
                className="rounded-md border border-white/20 bg-white/5 px-2.5 py-1.5 text-xs font-medium text-white/90 hover:bg-white/10"
              >
                Temizle
              </button>
            )}
            <button
              type="button"
              onClick={() => setFiltersOpen((v) => !v)}
              className="rounded-md bg-[var(--amber)] px-2.5 py-1.5 text-xs font-semibold text-[var(--navy)]"
            >
              {filtersOpen ? "Gizle" : "Göster"}
            </button>
          </div>
        </div>

        {filtersOpen && (
          <div className="space-y-5 p-4 sm:p-5">
            {/* Search */}
            <div>
              <label className={labelClass}>Arama</label>
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Firma adı, açıklama, not, ekip, referans…"
                className={inputClass}
              />
            </div>

            {/* Kapanma durumu */}
            <div>
              <p className={labelClass}>Kapanma durumu</p>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {KAPANMA_OPTIONS.map((opt) => {
                  const active = kapanma_durumu === opt.value;
                  return (
                    <button
                      key={opt.value || "all"}
                      type="button"
                      onClick={() => setKapanma(opt.value)}
                      className={`rounded-lg px-3 py-2.5 text-sm font-semibold transition ${
                        active
                          ? "bg-[var(--navy)] text-white shadow-sm"
                          : "bg-[var(--surface)] text-[var(--navy)] ring-1 ring-[var(--border)] hover:border-[var(--amber)] hover:ring-[var(--amber)]/40"
                      }`}
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Category / channel / evaluation */}
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              <div>
                <label className={labelClass}>Ana kategori</label>
                <select
                  value={ana_kategori}
                  onChange={(e) => setAnaKategori(e.target.value)}
                  className={inputClass}
                >
                  <option value="">Tüm kategoriler</option>
                  {options.kategoriler.map((v) => (
                    <option key={v} value={v}>
                      {v}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelClass}>İletildiği kanal</label>
                <select
                  value={iletildigi_kanal}
                  onChange={(e) => setKanal(e.target.value)}
                  className={inputClass}
                >
                  <option value="">Tüm kanallar</option>
                  {options.kanallar.map((v) => (
                    <option key={v} value={v}>
                      {v}
                    </option>
                  ))}
                </select>
              </div>
              <div className="sm:col-span-2 xl:col-span-1">
                <label className={labelClass}>Değerlendirme (ham)</label>
                <select
                  value={degerlendirme}
                  onChange={(e) => setDegerlendirme(e.target.value)}
                  className={inputClass}
                >
                  <option value="">Tümü</option>
                  {options.degerlendirmeler.map((v) => (
                    <option key={v} value={v}>
                      {v.replace(/\s+/g, " ").slice(0, 80)}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Date filters */}
            <div className="rounded-xl bg-[var(--surface)] p-3 ring-1 ring-[var(--border)] sm:p-4">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <p className={labelClass + " !mb-0"}>Tarih filtresi</p>
                <div className="inline-flex rounded-lg bg-white p-0.5 ring-1 ring-[var(--border)]">
                  <button
                    type="button"
                    onClick={() => setTarihMod("tek")}
                    className={`rounded-md px-3 py-1.5 text-xs font-semibold transition ${
                      tarih_mod === "tek"
                        ? "bg-[var(--navy)] text-white"
                        : "text-[var(--muted)] hover:text-[var(--navy)]"
                    }`}
                  >
                    Tek tarih
                  </button>
                  <button
                    type="button"
                    onClick={() => setTarihMod("aralik")}
                    className={`rounded-md px-3 py-1.5 text-xs font-semibold transition ${
                      tarih_mod === "aralik"
                        ? "bg-[var(--navy)] text-white"
                        : "text-[var(--muted)] hover:text-[var(--navy)]"
                    }`}
                  >
                    Tarih aralığı
                  </button>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                <div>
                  <label className={labelClass}>Tarih alanı</label>
                  <select
                    value={tarih_alani}
                    onChange={(e) => setTarihAlani(e.target.value)}
                    className={inputClass}
                  >
                    <option value="gorusme_tarihi">Görüşme Tarihi</option>
                    <option value="yol_haritasi_giris_tarihi">
                      Yol Haritası Giriş Tarihi
                    </option>
                    <option value="updated_at">Son Güncelleme</option>
                  </select>
                </div>

                {tarih_mod === "tek" ? (
                  <div className="sm:col-span-1 lg:col-span-2">
                    <label className={labelClass}>Tarih</label>
                    <input
                      type="date"
                      value={tarih}
                      onChange={(e) => setTarih(e.target.value)}
                      className={inputClass}
                    />
                  </div>
                ) : (
                  <>
                    <div>
                      <label className={labelClass}>Başlangıç</label>
                      <input
                        type="date"
                        value={tarih_baslangic}
                        onChange={(e) => setTarihBas(e.target.value)}
                        className={inputClass}
                      />
                    </div>
                    <div>
                      <label className={labelClass}>Bitiş</label>
                      <input
                        type="date"
                        value={tarih_bitis}
                        onChange={(e) => setTarihBit(e.target.value)}
                        className={inputClass}
                      />
                    </div>
                  </>
                )}
              </div>
              <p className="mt-2 text-[11px] text-[var(--muted)]">
                Görüşme / yol haritası alanları Excel serisi veya GG.AA.YYYY
                formatlarını da destekler.
              </p>
            </div>

            {activeChips.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {activeChips.map((chip) => (
                  <button
                    key={chip.key}
                    type="button"
                    onClick={chip.clear}
                    className="inline-flex max-w-full items-center gap-1.5 rounded-full bg-[var(--navy)]/5 px-3 py-1 text-xs font-medium text-[var(--navy)] ring-1 ring-[var(--navy)]/15 transition hover:bg-[var(--amber)]/15"
                    title="Kaldır"
                  >
                    <span className="truncate">{chip.label}</span>
                    <span className="text-[var(--muted)]">×</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </section>

      {error && (
        <div className="mb-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </div>
      )}

      <div className="overflow-auto rounded-xl bg-white shadow-sm ring-1 ring-[var(--border)]">
        <table className="min-w-full text-left text-sm">
          <thead className="sticky top-0 bg-[var(--navy)] text-white">
            <tr>
              <th className="px-3 py-2.5 font-medium">Sıra</th>
              <th className="px-3 py-2.5 font-medium">Firma</th>
              <th className="px-3 py-2.5 font-medium">Kategori</th>
              <th className="px-3 py-2.5 font-medium">Kanal</th>
              <th className="px-3 py-2.5 font-medium">Değerlendirme</th>
              <th className="hidden px-3 py-2.5 font-medium md:table-cell">
                Görüşme
              </th>
              <th className="px-3 py-2.5 font-medium">İşlem</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td
                  colSpan={7}
                  className="px-3 py-8 text-center text-[var(--muted)]"
                >
                  Yükleniyor…
                </td>
              </tr>
            )}
            {!loading &&
              items.map((f) => (
                <tr
                  key={f.id}
                  className="border-t border-[var(--border)] hover:bg-[var(--surface)]"
                >
                  <td className="px-3 py-2 text-[var(--muted)]">
                    {f.sira ?? "—"}
                  </td>
                  <td className="px-3 py-2">
                    <p className="font-medium text-[var(--navy)]">
                      {f.firma_adi}
                    </p>
                    {f.firma_aciklamasi && (
                      <p className="line-clamp-1 text-xs text-[var(--muted)]">
                        {f.firma_aciklamasi}
                      </p>
                    )}
                  </td>
                  <td className="px-3 py-2">
                    <span className="text-[var(--ink)]">
                      {f.ana_kategori || "—"}
                    </span>
                    {f.alt_kategori && (
                      <span className="block text-xs text-[var(--muted)]">
                        {f.alt_kategori}
                      </span>
                    )}
                  </td>
                  <td className="max-w-[160px] truncate px-3 py-2 text-[var(--muted)]">
                    {f.iletildigi_kanal || "—"}
                  </td>
                  <td className="px-3 py-2">
                    <span className="line-clamp-2 text-xs">
                      {f.degerlendirme || "—"}
                    </span>
                  </td>
                  <td className="hidden max-w-[140px] truncate px-3 py-2 text-xs text-[var(--muted)] md:table-cell">
                    {f.gorusme_tarihi || "—"}
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setEditing(f)}
                        className="text-xs font-semibold text-[var(--navy)] underline-offset-2 hover:underline"
                      >
                        Düzenle
                      </button>
                      <button
                        type="button"
                        onClick={() => void removeFirma(f.id)}
                        className="text-xs font-semibold text-red-700 underline-offset-2 hover:underline"
                      >
                        Sil
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            {!loading && !items.length && (
              <tr>
                <td
                  colSpan={7}
                  className="px-3 py-10 text-center text-[var(--muted)]"
                >
                  Kayıt bulunamadı. Filtreleri gevşetin veya Excel import edin.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {editing && (
        <FirmaEditModal
          initial={editing}
          onClose={() => setEditing(null)}
          onSave={saveFirma}
        />
      )}
    </div>
  );
}
