import type { Metadata } from "next";
import localFont from "next/font/local";
import { AppShell } from "@/components/layout/AppShell";
import "./globals.css";

const display = localFont({
  src: [
    {
      path: "./fonts/libre-baskerville-400.woff2",
      weight: "400",
      style: "normal",
    },
    {
      path: "./fonts/libre-baskerville-700.woff2",
      weight: "700",
      style: "normal",
    },
  ],
  variable: "--font-display",
  display: "swap",
});

const body = localFont({
  src: [
    {
      path: "./fonts/source-sans-3-400.woff2",
      weight: "400",
      style: "normal",
    },
    {
      path: "./fonts/source-sans-3-500.woff2",
      weight: "500",
      style: "normal",
    },
    {
      path: "./fonts/source-sans-3-600.woff2",
      weight: "600",
      style: "normal",
    },
    {
      path: "./fonts/source-sans-3-700.woff2",
      weight: "700",
      style: "normal",
    },
  ],
  variable: "--font-body",
  display: "swap",
});

export const metadata: Metadata = {
  title: "AgeSA MCP Online",
  description: "Firma veritabanı dashboard, veri yönetimi ve OmniAgent",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr">
      <body className={`${display.variable} ${body.variable} antialiased`}>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
