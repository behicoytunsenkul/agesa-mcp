"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { HtmlContent } from "@/components/chat/HtmlContent";
import { useChat } from "@/lib/chat-context";
import { matchChatUiCommand, useLayout } from "@/lib/layout-context";

export function ChatPanel() {
  const {
    messages,
    sending,
    sendMessage,
    appendLocalExchange,
    newSession,
    sessionId,
  } = useChat();
  const {
    chatOpen,
    setChatOpen,
    toggleChat,
    chatExpanded,
    setChatExpanded,
    toggleChatExpanded,
  } = useLayout();
  const [input, setInput] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!chatOpen) return;
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, sending, chatOpen]);

  useEffect(() => {
    if (!chatExpanded) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setChatExpanded(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [chatExpanded, setChatExpanded]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    const text = input.trim();
    if (!text) return;
    setInput("");

    const cmd = matchChatUiCommand(text);
    if (cmd === "expand") {
      setChatExpanded(true);
      appendLocalExchange(
        text,
        "Sohbet tam ekrana alındı. Küçültmek için «sohbeti küçült» yazabilir veya üstteki Küçült düğmesini kullanabilirsiniz. Esc ile de çıkabilirsiniz."
      );
      return;
    }
    if (cmd === "collapse") {
      setChatExpanded(false);
      appendLocalExchange(text, "Sohbet paneli normal boyuta döndü.");
      return;
    }

    await sendMessage(text);
  }

  return (
    <>
      <div
        className={`fixed inset-0 z-40 bg-[var(--navy)]/35 transition-opacity duration-300 lg:hidden ${
          chatOpen && !chatExpanded
            ? "opacity-100"
            : "pointer-events-none opacity-0"
        }`}
        onClick={() => setChatOpen(false)}
        aria-hidden={!chatOpen || chatExpanded}
      />

      <button
        type="button"
        onClick={toggleChat}
        className={`fixed top-1/2 right-0 z-30 hidden -translate-y-1/2 items-center gap-1 rounded-l-lg bg-[var(--navy)] px-2 py-3 text-white shadow-lg transition-all duration-300 hover:brightness-110 lg:flex ${
          chatOpen
            ? "pointer-events-none translate-x-full opacity-0"
            : "translate-x-0 opacity-100"
        }`}
        aria-label="OmniAgent'i aç"
      >
        <span className="writing-mode-vertical text-[10px] font-semibold tracking-wide uppercase">
          OmniAgent
        </span>
        <ChevronLeftIcon />
      </button>

      <div
        aria-hidden
        className={`hidden shrink-0 transition-[width] duration-300 ease-out lg:block ${
          chatOpen && !chatExpanded
            ? "w-[min(380px,36vw)] xl:w-[380px]"
            : "w-0"
        }`}
      />

      <aside
        className={`fixed z-50 flex flex-col border-[var(--border)] bg-[var(--surface)] transition-all duration-300 ease-out ${
          chatExpanded
            ? "inset-0 border-0 shadow-none"
            : "inset-y-0 right-0 w-[min(100vw,400px)] border-l shadow-2xl sm:w-[min(92vw,380px)] lg:w-[min(380px,36vw)] lg:shadow-none xl:w-[380px]"
        } ${chatOpen ? "translate-x-0" : "translate-x-full"}`}
        aria-hidden={!chatOpen}
      >
        <header className="flex items-center justify-between gap-2 border-b border-[var(--border)] px-3 py-3 sm:px-4">
          <div className="min-w-0">
            <h2 className="font-[family-name:var(--font-display)] text-base text-[var(--navy)] sm:text-lg">
              OmniAgent
              {chatExpanded && (
                <span className="ml-2 font-sans text-xs font-medium text-[var(--muted)]">
                  Tam ekran
                </span>
              )}
            </h2>
          </div>
          <div className="flex shrink-0 items-center gap-1.5">
            <button
              type="button"
              onClick={newSession}
              className="rounded-md border border-[var(--border)] bg-white px-2 py-1.5 text-[11px] font-medium text-[var(--navy)] transition hover:border-[var(--amber)] sm:px-2.5 sm:text-xs"
            >
              Yeni
            </button>
            <button
              type="button"
              onClick={toggleChatExpanded}
              className="rounded-md border border-[var(--border)] bg-white px-2 py-1.5 text-[11px] font-medium text-[var(--navy)] transition hover:border-[var(--amber)] sm:px-2.5 sm:text-xs"
              aria-label={chatExpanded ? "Küçült" : "Büyüt"}
              title={chatExpanded ? "Küçült" : "Tam ekran"}
            >
              {chatExpanded ? "Küçült" : "Büyüt"}
            </button>
            <button
              type="button"
              onClick={() => setChatOpen(false)}
              className="rounded-md border border-[var(--border)] bg-white p-1.5 text-[var(--navy)] transition hover:border-[var(--amber)]"
              aria-label="OmniAgent'i kapat"
            >
              <ChevronRightIcon />
            </button>
          </div>
        </header>

        <div
          className={`mx-auto flex w-full flex-1 flex-col overflow-hidden ${
            chatExpanded ? "max-w-3xl px-4 sm:px-6" : ""
          }`}
        >
          <div className="flex-1 space-y-3 overflow-y-auto px-3 py-4 sm:px-4">
            {messages.map((m) => (
              <div
                key={m.id}
                className={`rounded-lg px-3 py-2 text-sm leading-relaxed ${
                  chatExpanded ? "max-w-[85%] sm:max-w-[75%]" : "max-w-[92%]"
                } ${
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
              rows={chatExpanded ? 4 : 3}
              placeholder="Firma sor… veya «sohbeti büyüt» yaz"
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
        </div>
      </aside>
    </>
  );
}

function ChevronLeftIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M15 6l-6 6 6 6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ChevronRightIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M9 6l6 6-6 6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
