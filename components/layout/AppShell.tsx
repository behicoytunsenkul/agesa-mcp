"use client";

import { AuthProvider, useAuth } from "@/lib/auth-context";
import { ChatProvider } from "@/lib/chat-context";
import { LoginScreen } from "@/components/auth/LoginScreen";
import { ChatPanel } from "./ChatPanel";
import { Sidebar } from "./Sidebar";

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
      <div className="flex h-screen overflow-hidden bg-[var(--canvas)]">
        <Sidebar />
        <main className="min-w-0 flex-1 overflow-y-auto">{children}</main>
        <ChatPanel />
      </div>
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
