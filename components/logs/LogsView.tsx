"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { HtmlContent } from "@/components/chat/HtmlContent";
import { useChat } from "@/lib/chat-context";
import type { ChatMessage, ChatSession } from "@/lib/types";

function formatRelative(iso: string) {
  const d = new Date(iso);
  const diff = Date.now() - d.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Az önce";
  if (mins < 60) return `${mins} dk önce`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} sa önce`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} gün önce`;
  return d.toLocaleDateString("tr-TR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatFull(iso: string) {
  return new Date(iso).toLocaleString("tr-TR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function shortId(id: string) {
  return `${id.slice(0, 8)}…${id.slice(-4)}`;
}

export function LogsView() {
  const { loadSession, sessionId, newSession } = useChat();
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [title, setTitle] = useState("");
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingTranscript, setLoadingTranscript] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [copied, setCopied] = useState(false);

  const refreshSessions = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/chat/sessions");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Loglar yüklenemedi");
      setSessions(data.sessions);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Hata");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refreshSessions();
  }, [refreshSessions, sessionId]);

  const filtered = useMemo(() => {
    const q = query.trim().toLocaleLowerCase("tr");
    if (!q) return sessions;
    return sessions.filter(
      (s) =>
        s.title.toLocaleLowerCase("tr").includes(q) ||
        s.id.toLocaleLowerCase("tr").includes(q)
    );
  }, [sessions, query]);

  const totalMessages = useMemo(
    () => sessions.reduce((sum, s) => sum + (s.message_count ?? 0), 0),
    [sessions]
  );

  async function openSession(id: string) {
    setSelectedId(id);
    setLoadingTranscript(true);
    setError(null);
    try {
      const res = await fetch(`/api/chat/sessions/${id}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Transcript yüklenemedi");
      setTitle(data.session.title);
      setUpdatedAt(data.session.updated_at);
      setMessages(data.messages);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Transcript hatası");
    } finally {
      setLoadingTranscript(false);
    }
  }

  async function continueInChat(id: string) {
    await loadSession(id);
    setSelectedId(id);
  }

  async function deleteCurrentChat() {
    if (!selectedId) return;
    if (
      !confirm(
        "Bu sohbeti ve tüm mesajlarını silmek istediğinize emin misiniz?"
      )
    ) {
      return;
    }
    setDeleting(true);
    setError(null);
    try {
      const res = await fetch(`/api/chat/sessions/${selectedId}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Sohbet silinemedi");

      if (selectedId === sessionId) {
        newSession();
      }
      setSelectedId(null);
      setMessages([]);
      setTitle("");
      setUpdatedAt(null);
      await refreshSessions();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Silme hatası");
    } finally {
      setDeleting(false);
    }
  }

  async function copySessionId() {
    if (!selectedId) return;
    try {
      await navigator.clipboard.writeText(selectedId);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      /* ignore */
    }
  }

  return (
    <div className="flex h-full min-h-0 flex-col px-6 py-6 lg:px-8">
      <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--amber)]">
            OmniAgent · Geçmiş
          </p>
          <h1 className="mt-1 font-[family-name:var(--font-display)] text-3xl text-[var(--navy)]">
            Sohbet Logları
          </h1>
          <p className="mt-1 max-w-xl text-sm text-[var(--muted)]">
            Tüm OmniAgent oturumlarını inceleyin, devam ettirin veya arşivden
            kaldırın.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => void refreshSessions()}
            className="rounded-md border border-[var(--border)] bg-white px-3.5 py-2 text-sm font-medium text-[var(--navy)] transition hover:border-[var(--navy)]/30"
          >
            Yenile
          </button>
          <button
            type="button"
            onClick={newSession}
            className="rounded-md bg-[var(--navy)] px-3.5 py-2 text-sm font-medium text-white transition hover:brightness-110"
          >
            Yeni sohbet
          </button>
        </div>
      </header>

      <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
        <Stat label="Toplam oturum" value={sessions.length} />
        <Stat label="Toplam mesaj" value={totalMessages} />
        <Stat
          label="Aktif oturum"
          value={sessions.some((s) => s.id === sessionId) ? 1 : 0}
          hint={sessionId ? shortId(sessionId) : "—"}
        />
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </div>
      )}

      <div className="grid min-h-0 flex-1 gap-4 lg:grid-cols-[340px_1fr]">
        {/* Session list */}
        <section className="flex min-h-[420px] flex-col overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-[var(--border)]">
          <div className="border-b border-[var(--border)] bg-[var(--navy)] px-4 py-3.5 text-white">
            <div className="flex items-center justify-between gap-2">
              <div>
                <p className="text-sm font-semibold">Oturumlar</p>
                <p className="text-[11px] text-white/60">
                  {filtered.length} / {sessions.length} listeleniyor
                </p>
              </div>
            </div>
            <div className="mt-3">
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Başlık veya session id ara…"
                className="w-full rounded-md border border-white/10 bg-white/10 px-3 py-2 text-sm text-white outline-none placeholder:text-white/40 focus:border-[var(--amber)]/60"
              />
            </div>
          </div>

          <ul className="flex-1 overflow-y-auto">
            {loading &&
              Array.from({ length: 5 }).map((_, i) => (
                <li
                  key={i}
                  className="animate-pulse border-b border-[var(--border)] px-4 py-4"
                >
                  <div className="h-3.5 w-3/4 rounded bg-[var(--border)]" />
                  <div className="mt-2 h-2.5 w-1/2 rounded bg-[var(--border)]/70" />
                </li>
              ))}

            {!loading &&
              filtered.map((s) => {
                const active = selectedId === s.id;
                const live = s.id === sessionId;
                return (
                  <li key={s.id}>
                    <button
                      type="button"
                      onClick={() => void openSession(s.id)}
                      className={`group relative w-full border-b border-[var(--border)] px-4 py-3.5 text-left transition ${
                        active
                          ? "bg-[var(--surface)]"
                          : "hover:bg-[var(--surface)]/70"
                      }`}
                    >
                      {active && (
                        <span className="absolute inset-y-0 left-0 w-[3px] bg-[var(--amber)]" />
                      )}
                      <div className="flex items-start justify-between gap-3">
                        <p
                          className={`line-clamp-2 text-sm font-semibold leading-snug ${
                            active ? "text-[var(--navy)]" : "text-[var(--ink)]"
                          }`}
                        >
                          {s.title}
                        </p>
                        <span className="shrink-0 rounded-full bg-[var(--canvas)] px-2 py-0.5 text-[10px] font-semibold tabular-nums text-[var(--navy)] ring-1 ring-[var(--border)]">
                          {s.message_count ?? 0}
                        </span>
                      </div>
                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        <time className="text-[11px] text-[var(--muted)]">
                          {formatRelative(s.updated_at)}
                        </time>
                        {live && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-[var(--amber)]/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[#8a6a0a]">
                            <span className="size-1.5 rounded-full bg-[var(--amber)]" />
                            Aktif
                          </span>
                        )}
                      </div>
                      <p className="mt-1 font-mono text-[10px] text-[var(--muted)]/80">
                        {shortId(s.id)}
                      </p>
                    </button>
                  </li>
                );
              })}

            {!loading && !filtered.length && (
              <li className="px-6 py-16 text-center">
                <p className="text-sm font-medium text-[var(--navy)]">
                  {sessions.length ? "Sonuç bulunamadı" : "Henüz oturum yok"}
                </p>
                <p className="mt-1 text-xs text-[var(--muted)]">
                  {sessions.length
                    ? "Arama terimini değiştirmeyi deneyin."
                    : "OmniAgent’e soru sorarak ilk logu oluşturun."}
                </p>
              </li>
            )}
          </ul>
        </section>

        {/* Transcript */}
        <section className="flex min-h-[420px] flex-col overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-[var(--border)]">
          {!selectedId ? (
            <div className="flex flex-1 flex-col items-center justify-center px-8 text-center">
              <div className="mb-4 flex size-14 items-center justify-center rounded-full bg-[var(--navy)]/5 ring-1 ring-[var(--border)]">
                <span className="font-[family-name:var(--font-display)] text-xl text-[var(--navy)]">
                  OA
                </span>
              </div>
              <p className="font-[family-name:var(--font-display)] text-xl text-[var(--navy)]">
                Transcript seçilmedi
              </p>
              <p className="mt-2 max-w-sm text-sm text-[var(--muted)]">
                Sol listeden bir oturum seçerek mesaj geçmişini, zaman
                damgalarını ve aksiyonları görüntüleyin.
              </p>
            </div>
          ) : (
            <>
              <header className="border-b border-[var(--border)] bg-gradient-to-r from-[var(--navy)] to-[#16355c] px-5 py-4 text-white">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--amber)]">
                      Transcript
                    </p>
                    <h2 className="mt-1 line-clamp-2 font-[family-name:var(--font-display)] text-xl leading-snug">
                      {title}
                    </h2>
                    <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-white/65">
                      <span>{messages.length} mesaj</span>
                      {updatedAt && (
                        <>
                          <span className="text-white/30">·</span>
                          <span>Son güncelleme {formatFull(updatedAt)}</span>
                        </>
                      )}
                      <span className="text-white/30">·</span>
                      <button
                        type="button"
                        onClick={() => void copySessionId()}
                        className="font-mono text-white/80 underline-offset-2 hover:text-white hover:underline"
                        title={selectedId}
                      >
                        {copied ? "Kopyalandı" : shortId(selectedId)}
                      </button>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => void continueInChat(selectedId)}
                      className="rounded-md bg-[var(--amber)] px-3.5 py-2 text-xs font-semibold text-[var(--navy)] transition hover:brightness-105"
                    >
                      Sohbete devam et
                    </button>
                    <button
                      type="button"
                      onClick={() => void deleteCurrentChat()}
                      disabled={deleting}
                      className="rounded-md border border-white/25 bg-white/5 px-3.5 py-2 text-xs font-semibold text-white transition hover:bg-white/10 disabled:opacity-50"
                    >
                      {deleting ? "Siliniyor…" : "Sohbeti Sil"}
                    </button>
                  </div>
                </div>
              </header>

              <div className="relative flex-1 overflow-y-auto bg-[var(--canvas)]/40 px-5 py-5">
                {loadingTranscript ? (
                  <div className="space-y-4">
                    {Array.from({ length: 4 }).map((_, i) => (
                      <div
                        key={i}
                        className={`h-16 animate-pulse rounded-xl bg-white/80 ring-1 ring-[var(--border)] ${
                          i % 2 === 0 ? "ml-10" : "mr-10"
                        }`}
                      />
                    ))}
                  </div>
                ) : !messages.length ? (
                  <div className="flex h-full min-h-[240px] items-center justify-center text-sm text-[var(--muted)]">
                    Bu oturumda henüz mesaj yok.
                  </div>
                ) : (
                  <div className="mx-auto max-w-3xl space-y-4">
                    {messages.map((m, idx) => {
                      const isUser = m.role === "user";
                      return (
                        <div
                          key={m.id}
                          className={`flex gap-3 ${isUser ? "flex-row-reverse" : ""}`}
                        >
                          <div
                            className={`flex size-8 shrink-0 items-center justify-center rounded-full text-[10px] font-bold tracking-wide ${
                              isUser
                                ? "bg-[var(--navy)] text-white"
                                : "bg-white text-[var(--navy)] ring-1 ring-[var(--border)]"
                            }`}
                          >
                            {isUser ? "SZ" : "OA"}
                          </div>
                          <div
                            className={`min-w-0 max-w-[85%] ${isUser ? "items-end" : "items-start"} flex flex-col`}
                          >
                            <div className="mb-1 flex items-center gap-2 px-0.5">
                              <span className="text-[11px] font-semibold text-[var(--navy)]">
                                {isUser ? "Siz" : "OmniAgent"}
                              </span>
                              <span className="text-[10px] text-[var(--muted)]">
                                {formatFull(m.created_at)}
                              </span>
                              <span className="text-[10px] tabular-nums text-[var(--muted)]/70">
                                #{idx + 1}
                              </span>
                            </div>
                            <div
                              className={`rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm ${
                                isUser
                                  ? "rounded-tr-md bg-[var(--navy)] text-white whitespace-pre-wrap"
                                  : "rounded-tl-md bg-white text-[var(--ink)] ring-1 ring-[var(--border)]"
                              }`}
                            >
                              {m.role === "assistant" ? (
                                <HtmlContent content={m.content} />
                              ) : (
                                m.content
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </>
          )}
        </section>
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  hint,
}: {
  label: string;
  value: number;
  hint?: string;
}) {
  return (
    <div className="rounded-xl bg-white px-4 py-3.5 shadow-sm ring-1 ring-[var(--border)]">
      <p className="text-[11px] font-semibold uppercase tracking-wider text-[var(--muted)]">
        {label}
      </p>
      <p className="mt-1 font-[family-name:var(--font-display)] text-2xl text-[var(--navy)]">
        {value.toLocaleString("tr-TR")}
      </p>
      {hint && (
        <p className="mt-0.5 truncate font-mono text-[10px] text-[var(--muted)]">
          {hint}
        </p>
      )}
    </div>
  );
}
