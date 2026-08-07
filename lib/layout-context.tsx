"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

type LayoutContextValue = {
  chatOpen: boolean;
  setChatOpen: (open: boolean) => void;
  toggleChat: () => void;
  chatExpanded: boolean;
  setChatExpanded: (expanded: boolean) => void;
  toggleChatExpanded: () => void;
  navOpen: boolean;
  setNavOpen: (open: boolean) => void;
  toggleNav: () => void;
  closeOverlays: () => void;
};

const LayoutContext = createContext<LayoutContextValue | null>(null);

const CHAT_KEY = "agesa-chat-panel-open";

export function LayoutProvider({ children }: { children: React.ReactNode }) {
  const [chatOpen, setChatOpenState] = useState(true);
  const [chatExpanded, setChatExpandedState] = useState(false);
  const [navOpen, setNavOpen] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(CHAT_KEY);
    if (stored === "0") setChatOpenState(false);
    else if (stored === "1") setChatOpenState(true);
    else {
      const wide = window.matchMedia("(min-width: 1024px)").matches;
      setChatOpenState(wide);
    }
  }, []);

  const setChatExpanded = useCallback((expanded: boolean) => {
    setChatExpandedState(expanded);
    if (expanded) {
      setChatOpenState(true);
      localStorage.setItem(CHAT_KEY, "1");
      setNavOpen(false);
    }
  }, []);

  const toggleChatExpanded = useCallback(() => {
    setChatExpandedState((prev) => {
      const next = !prev;
      if (next) {
        setChatOpenState(true);
        localStorage.setItem(CHAT_KEY, "1");
        setNavOpen(false);
      }
      return next;
    });
  }, []);

  const setChatOpen = useCallback((open: boolean) => {
    setChatOpenState(open);
    localStorage.setItem(CHAT_KEY, open ? "1" : "0");
    if (!open) setChatExpandedState(false);
  }, []);

  const toggleChat = useCallback(() => {
    setChatOpenState((prev) => {
      const next = !prev;
      localStorage.setItem(CHAT_KEY, next ? "1" : "0");
      if (next) setNavOpen(false);
      else setChatExpandedState(false);
      return next;
    });
  }, []);

  const toggleNav = useCallback(() => {
    setNavOpen((prev) => {
      const next = !prev;
      if (next) {
        setChatOpenState(false);
        setChatExpandedState(false);
      }
      return next;
    });
  }, []);

  const closeOverlays = useCallback(() => {
    setNavOpen(false);
  }, []);

  const value = useMemo(
    () => ({
      chatOpen,
      setChatOpen,
      toggleChat,
      chatExpanded,
      setChatExpanded,
      toggleChatExpanded,
      navOpen,
      setNavOpen,
      toggleNav,
      closeOverlays,
    }),
    [
      chatOpen,
      setChatOpen,
      toggleChat,
      chatExpanded,
      setChatExpanded,
      toggleChatExpanded,
      navOpen,
      toggleNav,
      closeOverlays,
    ]
  );

  return (
    <LayoutContext.Provider value={value}>{children}</LayoutContext.Provider>
  );
}

export function useLayout() {
  const ctx = useContext(LayoutContext);
  if (!ctx) throw new Error("useLayout must be used within LayoutProvider");
  return ctx;
}

/** Local UI commands for chat size — not sent to n8n */
export function matchChatUiCommand(
  text: string
): "expand" | "collapse" | null {
  const t = text
    .trim()
    .toLocaleLowerCase("tr-TR")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[!.?]+$/g, "")
    .replace(/\s+/g, " ");

  if (!t) return null;

  const expand = [
    "sohbeti buyut",
    "sohbeti genislet",
    "sohbeti buyutur musun",
    "sohbeti buyut lutfen",
    "tam ekran",
    "tam ekran yap",
    "fullscreen",
    "maximize",
    "buyut",
    "genislet",
  ];
  const collapse = [
    "sohbeti kucult",
    "sohbeti daralt",
    "sohbeti kucult lutfen",
    "kucult",
    "daralt",
    "normal boyut",
    "ekrani kucult",
    "minimize",
  ];

  if (expand.includes(t) || /^sohbeti\s+buyut/.test(t) || /^tam\s+ekran/.test(t)) {
    return "expand";
  }
  if (
    collapse.includes(t) ||
    /^sohbeti\s+(kucult|daralt)/.test(t) ||
    /^ekrani\s+kucult/.test(t)
  ) {
    return "collapse";
  }
  return null;
}
