"use client";

import { FormEvent, useState } from "react";
import type { Firma } from "@/lib/types";

const FIELDS: Array<{ key: keyof Firma; label: string; multiline?: boolean }> = [
  { key: "sira", label: "Sıra" },
  { key: "firma_adi", label: "Firma Adı" },
  { key: "firma_aciklamasi", label: "Firma Açıklaması", multiline: true },
  { key: "urun_gami", label: "Ürün Gamı", multiline: true },
  { key: "iletildigi_kanal", label: "İletildiği Kanal" },
  { key: "ana_kategori", label: "Ana Kategori" },
  { key: "alt_kategori", label: "Alt Kategori" },
  { key: "degerlendirme", label: "Değerlendirme" },
  { key: "referans", label: "Referans", multiline: true },
  { key: "rakipler", label: "Rakipler", multiline: true },
  { key: "ekip", label: "Ekip", multiline: true },
  { key: "not_metni", label: "Not", multiline: true },
  { key: "link", label: "Link" },
  { key: "yol_haritasi_giris_tarihi", label: "Yol Haritası Giriş Tarihi" },
  { key: "gorusme_tarihi", label: "Görüşme Tarihi" },
  { key: "katilimcilar", label: "Katılımcılar", multiline: true },
];

export function FirmaEditModal({
  initial,
  onClose,
  onSave,
}: {
  initial: Partial<Firma>;
  onClose: () => void;
  onSave: (payload: Partial<Firma>) => Promise<void>;
}) {
  const [form, setForm] = useState<Partial<Firma>>(initial);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!form.firma_adi?.toString().trim()) {
      setError("Firma adı zorunlu.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const payload = { ...form };
      if (payload.sira !== undefined && payload.sira !== null) {
        const n = Number(payload.sira);
        payload.sira = Number.isFinite(n) ? n : null;
      }
      await onSave(payload);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Kaydedilemedi");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--navy)]/50 p-4">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-lg bg-white shadow-xl">
        <header className="sticky top-0 flex items-center justify-between border-b border-[var(--border)] bg-white px-5 py-3">
          <h2 className="font-[family-name:var(--font-display)] text-xl text-[var(--navy)]">
            {form.id ? "Firmayı düzenle" : "Yeni firma"}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-sm text-[var(--muted)] hover:text-[var(--navy)]"
          >
            Kapat
          </button>
        </header>

        <form onSubmit={submit} className="space-y-3 px-5 py-4">
          {FIELDS.map((f) => (
            <label key={f.key} className="block text-sm">
              <span className="mb-1 block font-medium text-[var(--navy)]">
                {f.label}
              </span>
              {f.multiline ? (
                <textarea
                  rows={3}
                  value={(form[f.key] as string) ?? ""}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, [f.key]: e.target.value || null }))
                  }
                  className="w-full rounded-md border border-[var(--border)] px-3 py-2 outline-none focus:border-[var(--amber)]"
                />
              ) : (
                <input
                  type={f.key === "sira" ? "number" : "text"}
                  value={
                    form[f.key] === null || form[f.key] === undefined
                      ? ""
                      : String(form[f.key])
                  }
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      [f.key]:
                        e.target.value === ""
                          ? null
                          : f.key === "sira"
                            ? Number(e.target.value)
                            : e.target.value,
                    }))
                  }
                  className="w-full rounded-md border border-[var(--border)] px-3 py-2 outline-none focus:border-[var(--amber)]"
                  required={f.key === "firma_adi"}
                />
              )}
            </label>
          ))}

          {error && (
            <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </p>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md border border-[var(--border)] px-4 py-2 text-sm"
            >
              İptal
            </button>
            <button
              type="submit"
              disabled={saving}
              className="rounded-md bg-[var(--amber)] px-4 py-2 text-sm font-semibold text-[var(--navy)] disabled:opacity-50"
            >
              {saving ? "Kaydediliyor…" : "Kaydet"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
