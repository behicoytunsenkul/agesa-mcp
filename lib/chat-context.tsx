"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { v4 as uuidv4 } from "uuid";
import type { ChatMessage } from "./types";

type UiMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
};

type ChatContextValue = {
  sessionId: string;
  messages: UiMessage[];
  sending: boolean;
  sendMessage: (text: string) => Promise<void>;
  appendLocalExchange: (userText: string, assistantText: string) => void;
  newSession: () => void;
  loadSession: (id: string) => Promise<void>;
};

const ChatContext = createContext<ChatContextValue | null>(null);

const STORAGE_KEY = "agesa-chat-session-id";

export function ChatProvider({ children }: { children: React.ReactNode }) {
  const [sessionId, setSessionId] = useState("");
  const [messages, setMessages] = useState<UiMessage[]>([
    {
      id: "welcome",
      role: "assistant",
      content: "Merhaba, ben Agesa MCPAgent. Nasıl yardımcı olabilirim?",
    },
  ]);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    const existing =
      typeof window !== "undefined"
        ? localStorage.getItem(STORAGE_KEY)
        : null;
    const id = existing || uuidv4();
    if (!existing) localStorage.setItem(STORAGE_KEY, id);
    setSessionId(id);
  }, []);

  const newSession = useCallback(() => {
    const id = uuidv4();
    localStorage.setItem(STORAGE_KEY, id);
    setSessionId(id);
    setMessages([
      {
        id: "welcome",
        role: "assistant",
        content: "Merhaba, ben Agesa MCPAgent. Nasıl yardımcı olabilirim?",
      },
    ]);
  }, []);

  const loadSession = useCallback(async (id: string) => {
    const res = await fetch(`/api/chat/sessions/${id}`);
    if (!res.ok) throw new Error("Session yüklenemedi");
    const data = (await res.json()) as {
      messages: ChatMessage[];
    };
    localStorage.setItem(STORAGE_KEY, id);
    setSessionId(id);
    setMessages(
      data.messages.map((m) => ({
        id: String(m.id),
        role: m.role,
        content: m.content,
      }))
    );
  }, []);

  const appendLocalExchange = useCallback(
    (userText: string, assistantText: string) => {
      const t = Date.now();
      setMessages((prev) => [
        ...prev,
        { id: `lu-${t}`, role: "user", content: userText },
        { id: `la-${t}`, role: "assistant", content: assistantText },
      ]);
    },
    []
  );

  const sendMessage = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || !sessionId || sending) return;

      const userMsg: UiMessage = {
        id: `u-${Date.now()}`,
        role: "user",
        content: trimmed,
      };
      setMessages((prev) => [...prev, userMsg]);
      setSending(true);

      try {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sessionId, message: trimmed }),
        });
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || "Chat isteği başarısız");
        }
        setMessages((prev) => [
          ...prev,
          {
            id: `a-${Date.now()}`,
            role: "assistant",
            content: data.reply as string,
          },
        ]);
      } catch (err) {
        const msg =
          err instanceof Error ? err.message : "Beklenmeyen bir hata oluştu.";
        setMessages((prev) => [
          ...prev,
          {
            id: `e-${Date.now()}`,
            role: "assistant",
            content: `Hata: ${msg}`,
          },
        ]);
      } finally {
        setSending(false);
      }
    },
    [sessionId, sending]
  );

  const value = useMemo(
    () => ({
      sessionId,
      messages,
      sending,
      sendMessage,
      appendLocalExchange,
      newSession,
      loadSession,
    }),
    [
      sessionId,
      messages,
      sending,
      sendMessage,
      appendLocalExchange,
      newSession,
      loadSession,
    ]
  );

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
}

export function useChat() {
  const ctx = useContext(ChatContext);
  if (!ctx) throw new Error("useChat must be used within ChatProvider");
  return ctx;
}
