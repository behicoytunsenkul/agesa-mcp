"use client";

import { AuthProvider, useAuth } from "@/lib/auth-context";
import { ChatProvider } from "@/lib/chat-context";
import { LayoutProvider, useLayout } from "@/lib/layout-context";
import { LoginScreen } from "@/components/auth/LoginScreen";
import { ChatPanel } from "./ChatPanel";
import { Sidebar } from "./Sidebar";

function TopBar() {
  const { toggleNav, toggleChat, chatOpen } = useLayout();

  return (
    <header className="flex shrink-0 items-center justify-between gap-3 border-b border-[var(--border)] bg-white px-3 py-2.5 lg:hidden">
      <button
        type="button"
        onClick={toggleNav}
        className="inline-flex items-center gap-2 rounded-md border border-[var(--border)] px-2.5 py-1.5 text-sm font-medium text-[var(--navy)]"
        aria-label="Menüyü aç"
      >
        <MenuIcon />
        <span>Menü</span>
      </button>
      <p className="font-[family-name:var(--font-display)] text-sm text-[var(--navy)]">
        Agesa
      </p>
      <button
        type="button"
        onClick={toggleChat}
        className={`rounded-md px-2.5 py-1.5 text-sm font-semibold ${
          chatOpen
            ? "bg-[var(--navy)] text-white"
            : "bg-[var(--amber)] text-[var(--navy)]"
        }`}
        aria-label="OmniAgent"
      >
        OmniAgent
      </button>
    </header>
  );
}

function AuthenticatedShell({ children }: { children: React.ReactNode }) {
  const { ready, authenticated } = useAuth();

  if (!ready) {
    return (
      <div className="flex h-screen items-center justify-center bg-[var(--canvas)] text-sm text-[var(--muted)]">
        Yükleniyor…
      </div>
    );
  }

  if (!authenticated) {
    return <LoginScreen />;
  }

  return (
    <ChatProvider>
      <LayoutProvider>
        <div className="flex h-[100dvh] flex-col overflow-hidden bg-[var(--canvas)]">
          <TopBar />
          <div className="relative flex min-h-0 flex-1 overflow-hidden">
            <Sidebar />
            <main className="min-w-0 flex-1 overflow-y-auto overscroll-contain">
              {children}
            </main>
            <ChatPanel />
          </div>
        </div>
      </LayoutProvider>
    </ChatProvider>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <AuthenticatedShell>{children}</AuthenticatedShell>
    </AuthProvider>
  );
}

function MenuIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M4 7h16M4 12h16M4 17h16"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}
