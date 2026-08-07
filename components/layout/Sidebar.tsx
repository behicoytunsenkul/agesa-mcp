"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth-context";

const NAV = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/datas", label: "Datas" },
  { href: "/logs", label: "Logs" },
];

export function Sidebar() {
  const pathname = usePathname();
  const { email, logout } = useAuth();

  return (
    <aside className="flex w-[220px] shrink-0 flex-col border-r border-[var(--border)] bg-[var(--navy)] text-[var(--navy-fg)]">
      <div className="border-b border-white/10 px-5 py-6">
        <p className="font-[family-name:var(--font-display)] text-2xl tracking-tight text-white">
          Agesa
        </p>
        <p className="mt-1 text-[0.6rem] uppercase tracking-[0.18em] text-[var(--amber)]">
          OmniPanel
        </p>
      </div>

      <nav className="flex flex-1 flex-col gap-1 p-3">
        {NAV.map((item) => {
          const active =
            pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`rounded-md px-3 py-2.5 text-sm font-medium transition-colors ${
                active
                  ? "bg-white/12 text-white"
                  : "text-white/70 hover:bg-white/6 hover:text-white"
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="space-y-2 border-t border-white/10 px-4 py-4">
        {email && (
          <p className="truncate text-[11px] text-white/55" title={email}>
            {email}
          </p>
        )}
        <button
          type="button"
          onClick={logout}
          className="w-full rounded-md border border-white/15 px-2.5 py-1.5 text-xs font-medium text-white/80 transition hover:bg-white/10 hover:text-white"
        >
          Çıkış Yap
        </button>
      </div>
    </aside>
  );
}
