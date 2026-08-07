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
  navOpen: boolean;
  setNavOpen: (open: boolean) => void;
  toggleNav: () => void;
  closeOverlays: () => void;
};

const LayoutContext = createContext<LayoutContextValue | null>(null);

const CHAT_KEY = "agesa-chat-panel-open";

export function LayoutProvider({ children }: { children: React.ReactNode }) {
  const [chatOpen, setChatOpenState] = useState(true);
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

  const setChatOpen = useCallback((open: boolean) => {
    setChatOpenState(open);
    localStorage.setItem(CHAT_KEY, open ? "1" : "0");
  }, []);

  const toggleChat = useCallback(() => {
    setChatOpenState((prev) => {
      const next = !prev;
      localStorage.setItem(CHAT_KEY, next ? "1" : "0");
      if (next) setNavOpen(false);
      return next;
    });
  }, []);

  const toggleNav = useCallback(() => {
    setNavOpen((prev) => {
      const next = !prev;
      if (next) setChatOpenState(false);
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
      navOpen,
      setNavOpen,
      toggleNav,
      closeOverlays,
    }),
    [chatOpen, setChatOpen, toggleChat, navOpen, toggleNav, closeOverlays]
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
