"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { HtmlContent } from "@/components/chat/HtmlContent";
import { useChat } from "@/lib/chat-context";

export function ChatPanel() {
  const { messages, sending, sendMessage, newSession, sessionId } = useChat();
  const [input, setInput] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, sending]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    const text = input;
    setInput("");
    await sendMessage(text);
  }

  return (
    <aside className="flex w-[380px] shrink-0 flex-col border-l border-[var(--border)] bg-[var(--surface)]">
      <header className="flex items-center justify-between border-b border-[var(--border)] px-4 py-3">
        <div>
          <h2 className="font-[family-name:var(--font-display)] text-lg text-[var(--navy)]">
            OmniAgent
          </h2>
          <p className="truncate text-[11px] text-[var(--muted)]">
            {sessionId ? `${sessionId.slice(0, 8)}…` : "oturum hazırlanıyor"}
          </p>
        </div>
        <button
          type="button"
          onClick={newSession}
          className="rounded-md border border-[var(--border)] bg-white px-2.5 py-1.5 text-xs font-medium text-[var(--navy)] transition hover:border-[var(--amber)]"
        >
          Yeni sohbet
        </button>
      </header>

      <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
        {messages.map((m) => (
          <div
            key={m.id}
            className={`max-w-[92%] rounded-lg px-3 py-2 text-sm leading-relaxed ${
              m.role === "user"
                ? "ml-auto bg-[var(--navy)] text-white whitespace-pre-wrap"
                : "mr-auto bg-white text-[var(--ink)] ring-1 ring-[var(--border)]"
            }`}
          >
            {m.role === "assistant" ? (
              <HtmlContent content={m.content} />
            ) : (
              m.content
            )}
          </div>
        ))}
        {sending && (
          <div className="mr-auto rounded-lg bg-white px-3 py-2 text-sm text-[var(--muted)] ring-1 ring-[var(--border)]">
            Düşünüyor…
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <form
        onSubmit={onSubmit}
        className="border-t border-[var(--border)] bg-white p-3"
      >
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              void onSubmit(e);
            }
          }}
          rows={3}
          placeholder="Firma, kategori veya kişi sor…"
          className="w-full resize-none rounded-md border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm outline-none focus:border-[var(--amber)]"
          disabled={!sessionId || sending}
        />
        <button
          type="submit"
          disabled={!sessionId || sending || !input.trim()}
          className="mt-2 w-full rounded-md bg-[var(--amber)] px-3 py-2 text-sm font-semibold text-[var(--navy)] transition hover:brightness-105 disabled:opacity-50"
        >
          Gönder
        </button>
      </form>
    </aside>
  );
}
