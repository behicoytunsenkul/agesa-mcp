"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { DashboardStats } from "@/lib/types";

const COLORS = [
  "#0b1f3a",
  "#d4a017",
  "#3d5a80",
  "#98c1d9",
  "#ee6c4d",
  "#293241",
  "#778da9",
  "#6a994e",
];

const PIPELINE_COLORS: Record<string, string> = {
  Kapandı: "#778da9",
  İzleme: "#3d5a80",
  Canlıda: "#6a994e",
  Yatırım: "#d4a017",
  POC: "#ee6c4d",
  NDA: "#98c1d9",
  "Deep Dive": "#0b1f3a",
  "Firma Görüşmesi": "#293241",
};

export function DashboardView() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/dashboard");
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Dashboard yüklenemedi");
        if (!cancelled) setStats(data);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Hata");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const stackedKategori = useMemo(() => {
    if (!stats) return [];
    const labels = ["Kapandı", "İzleme", "Canlıda", "Yatırım", "POC"];
    const byKat = new Map<string, Record<string, number | string>>();
    for (const cell of stats.kategori_x_pipeline) {
      if (!labels.includes(cell.etiket)) continue;
      if (!byKat.has(cell.kategori)) {
        byKat.set(cell.kategori, { kategori: cell.kategori });
      }
      const row = byKat.get(cell.kategori)!;
      row[cell.etiket] = ((row[cell.etiket] as number) || 0) + cell.adet;
    }
    return [...byKat.values()].slice(0, 6);
  }, [stats]);

  if (loading) {
    return <PageFrame title="Dashboard">Yükleniyor…</PageFrame>;
  }

  if (error || !stats) {
    return (
      <PageFrame title="Dashboard">
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          <p className="font-semibold">Veri yüklenemedi</p>
          <p className="mt-1 break-words">{error || "Bilinmeyen hata"}</p>
          <p className="mt-3 text-[var(--muted)]">
            Sunucuda sırayla deneyin:{" "}
            <code className="text-xs">git pull && npm run db:setup && npm run build && npm run start</code>
          </p>
        </div>
      </PageFrame>
    );
  }

  const kategoriTop = stats.ana_kategori_dagilimi.slice(0, 8);
  const altTop = stats.alt_kategori_dagilimi
    .filter((x) => x.deger !== "Belirtilmemiş")
    .slice(0, 10);
  const kanalTop = stats.kanal_dagilimi.slice(0, 10);
  const pipelineBars = stats.pipeline_etiketleri.filter((p) => p.adet > 0);
  const aktifOran = stats.toplam_firma
    ? Math.round((stats.aktif_pipeline / stats.toplam_firma) * 1000) / 10
    : 0;

  return (
    <PageFrame title="Dashboard" subtitle="NeonDB firma portföy özeti">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Kpi label="Toplam firma" value={stats.toplam_firma} />
        <Kpi
          label="Aktif pipeline"
          value={stats.aktif_pipeline}
          hint={`%${aktifOran} · Kapandı ${stats.kapandi}`}
        />
        <Kpi
          label="Değerlendirme eksik"
          value={stats.degerlendirme_eksik}
          tone={stats.degerlendirme_eksik > 0 ? "warn" : undefined}
        />
        <Kpi
          label="Chat (7 gün)"
          value={stats.chat_ozet.son_7_gun_session}
          hint={`${stats.chat_ozet.session_sayisi} session · ${stats.chat_ozet.mesaj_sayisi} mesaj`}
        />
      </div>

      <div className="mt-3 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Kpi label="Ana kategori" value={stats.kategori_sayisi} />
        <Kpi label="Kanal çeşitliliği" value={stats.kanal_sayisi} />
        <Kpi
          label="Link dolu"
          value={stats.veri_doluluk.find((v) => v.alan === "Link")?.adet ?? 0}
          hint={`%${stats.veri_doluluk.find((v) => v.alan === "Link")?.yuzde ?? 0}`}
        />
        <Kpi
          label="Görüşme tarihi dolu"
          value={
            stats.veri_doluluk.find((v) => v.alan === "Görüşme tarihi")?.adet ?? 0
          }
          hint={`%${stats.veri_doluluk.find((v) => v.alan === "Görüşme tarihi")?.yuzde ?? 0}`}
        />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <ChartCard title="Pipeline etiketleri (çoklu etiket sayılır)">
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={pipelineBars} margin={{ left: 8, right: 8, bottom: 40 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e9ef" />
              <XAxis
                dataKey="etiket"
                tick={{ fontSize: 11 }}
                interval={0}
                angle={-25}
                textAnchor="end"
                height={70}
              />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip
                formatter={(value, _name, item) => {
                  const yuzde = (item?.payload as { yuzde?: number })?.yuzde;
                  return [`${value} (%${yuzde ?? 0})`, "Firma"];
                }}
              />
              <Bar dataKey="adet" radius={[4, 4, 0, 0]}>
                {pipelineBars.map((p) => (
                  <Cell
                    key={p.etiket}
                    fill={PIPELINE_COLORS[p.etiket] || COLORS[0]}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Veri doluluk oranı">
          <ResponsiveContainer width="100%" height={280}>
            <BarChart
              data={stats.veri_doluluk}
              layout="vertical"
              margin={{ left: 8, right: 24 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e9ef" />
              <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11 }} unit="%" />
              <YAxis
                type="category"
                dataKey="alan"
                width={110}
                tick={{ fontSize: 11 }}
              />
              <Tooltip
                formatter={(value, _name, item) => {
                  const adet = (item?.payload as { adet?: number })?.adet;
                  return [`%${value} (${adet ?? 0} kayıt)`, "Doluluk"];
                }}
              />
              <Bar dataKey="yuzde" fill="#d4a017" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <ChartCard title="Ana kategori dağılımı">
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie
                data={kategoriTop}
                dataKey="adet"
                nameKey="deger"
                cx="50%"
                cy="50%"
                outerRadius={90}
                label={(props) => {
                  const {
                    cx,
                    cy,
                    midAngle,
                    outerRadius,
                    name,
                    payload,
                  } = props as {
                    cx?: number;
                    cy?: number;
                    midAngle?: number;
                    outerRadius?: number;
                    name?: string;
                    payload?: { yuzde?: number };
                  };
                  if (
                    cx == null ||
                    cy == null ||
                    midAngle == null ||
                    outerRadius == null
                  ) {
                    return null;
                  }
                  const RADIAN = Math.PI / 180;
                  const radius = outerRadius + 18;
                  const x = cx + radius * Math.cos(-midAngle * RADIAN);
                  const y = cy + radius * Math.sin(-midAngle * RADIAN);
                  const label = `${String(name ?? "").slice(0, 14)} (${payload?.yuzde ?? 0}%)`;
                  return (
                    <text
                      x={x}
                      y={y}
                      fill="#1a2332"
                      textAnchor={x > cx ? "start" : "end"}
                      dominantBaseline="central"
                      fontSize={9.8}
                    >
                      {label}
                    </text>
                  );
                }}
              >
                {kategoriTop.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Alt kategori (top 10)">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={altTop} layout="vertical" margin={{ left: 8, right: 16 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e9ef" />
              <XAxis type="number" tick={{ fontSize: 11 }} />
              <YAxis
                type="category"
                dataKey="deger"
                width={130}
                tick={{ fontSize: 10 }}
              />
              <Tooltip />
              <Bar dataKey="adet" fill="#3d5a80" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      <div className="mt-4">
        <ChartCard title="Top kategoriler × pipeline durumu">
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={stackedKategori} margin={{ left: 8, right: 8, top: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e9ef" />
              <XAxis
                dataKey="kategori"
                tick={{ fontSize: 11 }}
                interval={0}
                angle={-15}
                textAnchor="end"
                height={60}
              />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Legend />
              {["Kapandı", "İzleme", "Canlıda", "Yatırım", "POC"].map((etiket) => (
                <Bar
                  key={etiket}
                  dataKey={etiket}
                  stackId="a"
                  fill={PIPELINE_COLORS[etiket]}
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <ChartCard title="İletildiği kanal (top 10)">
          <ResponsiveContainer width="100%" height={280}>
            <BarChart
              data={kanalTop}
              layout="vertical"
              margin={{ left: 16, right: 16 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e9ef" />
              <XAxis type="number" tick={{ fontSize: 11 }} />
              <YAxis
                type="category"
                dataKey="deger"
                width={120}
                tick={{ fontSize: 10 }}
              />
              <Tooltip />
              <Bar dataKey="adet" fill="#d4a017" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="En sık geçen referanslar">
          {stats.top_referanslar.length ? (
            <ul className="max-h-[280px] space-y-2 overflow-y-auto">
              {stats.top_referanslar.map((r, i) => (
                <li
                  key={r.deger}
                  className="flex items-center justify-between gap-3 border-b border-[var(--border)] pb-2 last:border-0"
                >
                  <div className="flex min-w-0 items-center gap-2">
                    <span className="w-5 shrink-0 text-xs text-[var(--muted)]">
                      {i + 1}
                    </span>
                    <span className="truncate text-sm text-[var(--navy)]">
                      {r.deger}
                    </span>
                  </div>
                  <span className="shrink-0 rounded bg-[var(--surface)] px-2 py-0.5 text-xs font-semibold text-[var(--navy)] ring-1 ring-[var(--border)]">
                    {r.adet}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="py-10 text-center text-sm text-[var(--muted)]">
              Referans verisi yok
            </p>
          )}
        </ChartCard>
      </div>

      <div className="mt-4">
        <ChartCard title="Son güncellenenler">
          <ul className="divide-y divide-[var(--border)]">
            {stats.son_guncellenenler.map((f) => (
              <li
                key={f.id}
                className="flex items-start justify-between gap-3 py-2.5"
              >
                <div>
                  <p className="text-sm font-semibold text-[var(--navy)]">
                    {f.firma_adi}
                  </p>
                  <p className="text-xs text-[var(--muted)]">
                    {[f.ana_kategori, firstLine(f.degerlendirme)]
                      .filter(Boolean)
                      .join(" · ") || "—"}
                  </p>
                </div>
                <time className="shrink-0 text-[11px] text-[var(--muted)]">
                  {f.updated_at
                    ? new Date(f.updated_at).toLocaleString("tr-TR")
                    : "—"}
                </time>
              </li>
            ))}
            {!stats.son_guncellenenler.length && (
              <li className="py-6 text-center text-sm text-[var(--muted)]">
                Henüz kayıt yok. Datas sayfasından Excel import edin.
              </li>
            )}
          </ul>
        </ChartCard>
      </div>
    </PageFrame>
  );
}

function firstLine(v: string | null | undefined) {
  if (!v) return "";
  return v.split("\n").map((s) => s.trim()).filter(Boolean)[0] || "";
}

function PageFrame({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="px-6 py-6 lg:px-8">
      <header className="mb-6">
        <h1 className="font-[family-name:var(--font-display)] text-3xl text-[var(--navy)]">
          {title}
        </h1>
        {subtitle && (
          <p className="mt-1 text-sm text-[var(--muted)]">{subtitle}</p>
        )}
      </header>
      {children}
    </div>
  );
}

function Kpi({
  label,
  value,
  hint,
  tone,
}: {
  label: string;
  value: number;
  hint?: string;
  tone?: "warn";
}) {
  return (
    <div className="rounded-lg bg-white px-4 py-4 ring-1 ring-[var(--border)]">
      <p className="text-xs uppercase tracking-wider text-[var(--muted)]">
        {label}
      </p>
      <p
        className={`mt-1 font-[family-name:var(--font-display)] text-3xl ${
          tone === "warn" ? "text-[#b45309]" : "text-[var(--navy)]"
        }`}
      >
        {value.toLocaleString("tr-TR")}
      </p>
      {hint && (
        <p className="mt-1 text-[11px] text-[var(--muted)]">{hint}</p>
      )}
    </div>
  );
}

function ChartCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-lg bg-white p-4 ring-1 ring-[var(--border)]">
      <h3 className="mb-3 text-sm font-semibold text-[var(--navy)]">{title}</h3>
      {children}
    </section>
  );
}
