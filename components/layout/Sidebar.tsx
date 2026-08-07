"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { useLayout } from "@/lib/layout-context";

const NAV = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/datas", label: "Datas" },
  { href: "/logs", label: "Logs" },
];

export function Sidebar() {
  const pathname = usePathname();
  const { email, logout } = useAuth();
  const { navOpen, setNavOpen, closeOverlays } = useLayout();

  return (
    <>
      {/* Mobile overlay */}
      <div
        className={`fixed inset-0 z-40 bg-[var(--navy)]/40 transition-opacity duration-300 lg:hidden ${
          navOpen ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        onClick={closeOverlays}
        aria-hidden={!navOpen}
      />

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-[min(280px,86vw)] flex-col border-r border-[var(--border)] bg-[var(--navy)] text-[var(--navy-fg)] shadow-xl transition-transform duration-300 ease-out lg:static lg:z-auto lg:w-[220px] lg:shrink-0 lg:translate-x-0 lg:shadow-none ${
          navOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        <div className="flex items-start justify-between border-b border-white/10 px-5 py-5 lg:py-6">
          <div>
            <p className="font-[family-name:var(--font-display)] text-2xl tracking-tight text-white">
              Agesa
            </p>
            <p className="mt-1 text-[0.6rem] uppercase tracking-[0.18em] text-[var(--amber)]">
              Teknoloji Hattı
            </p>
          </div>
          <button
            type="button"
            onClick={() => setNavOpen(false)}
            className="rounded-md p-1.5 text-white/70 hover:bg-white/10 hover:text-white lg:hidden"
            aria-label="Menüyü kapat"
          >
            <CloseIcon />
          </button>
        </div>

        <nav className="flex flex-1 flex-col gap-1 p-3">
          {NAV.map((item) => {
            const active =
              pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setNavOpen(false)}
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
    </>
  );
}

function CloseIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M6 6l12 12M18 6L6 18"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}
