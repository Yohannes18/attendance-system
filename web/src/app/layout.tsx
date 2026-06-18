import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Attend — NFC Attendance Console",
  description: "Live NFC-based attendance tracking",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-[var(--bg)] text-[var(--text)]">
        <header className="border-b border-[var(--border)] sticky top-0 z-10 backdrop-blur bg-[var(--bg)]/80">
          <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2 font-mono text-sm tracking-tight">
              <span className="w-2 h-2 rounded-full bg-[var(--accent)] pulse-dot" />
              <span className="font-semibold">attend</span>
              <span className="text-[var(--text-muted)]">/ console</span>
            </Link>
            <nav className="flex items-center gap-6 text-sm">
              <Link href="/" className="text-[var(--text-muted)] hover:text-[var(--text)] transition-colors">
                Dashboard
              </Link>
              <Link href="/students" className="text-[var(--text-muted)] hover:text-[var(--text)] transition-colors">
                Students
              </Link>
              <Link href="/register" className="text-[var(--text-muted)] hover:text-[var(--text)] transition-colors">
                Register card
              </Link>
            </nav>
          </div>
        </header>
        <main className="flex-1">{children}</main>
        <footer className="border-t border-[var(--border)] py-6">
          <div className="max-w-5xl mx-auto px-6 text-xs text-[var(--text-muted)] font-mono">
            NFC attendance system — ESP8266 + PN532 + Supabase
          </div>
        </footer>
      </body>
    </html>
  );
}
