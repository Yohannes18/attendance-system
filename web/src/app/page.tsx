"use client";

import { useEffect, useState, useMemo, useRef } from "react";
import { supabase, type AttendanceLogRow } from "@/lib/supabase";

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const sec = Math.floor(diff / 1000);
  if (sec < 5) return "just now";
  if (sec < 60) return `${sec}s ago`;
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  return new Date(iso).toLocaleDateString();
}

export default function DashboardPage() {
  const [rows, setRows] = useState<AttendanceLogRow[]>([]);
  const [studentCount, setStudentCount] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [newestId, setNewestId] = useState<string | null>(null);
  const [classFilter, setClassFilter] = useState<string>("all");
  const previousNewestRef = useRef<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function load() {
      const { data: log } = await supabase
        .from("attendance_log")
        .select("*")
        .limit(100);

      const { count } = await supabase
        .from("students")
        .select("*", { count: "exact", head: true });

      if (!mounted) return;

      const fresh = log ?? [];
      setRows(fresh);
      setStudentCount(count ?? 0);
      setLoading(false);

      if (fresh.length > 0 && fresh[0].id !== previousNewestRef.current) {
        previousNewestRef.current = fresh[0].id;
        setNewestId(fresh[0].id);
        setTimeout(() => setNewestId(null), 1400);
      }
    }

    load();

    const channel = supabase
      .channel("attendance-feed")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "attendance" },
        () => {
          // Re-fetch the joined view so we get full_name/class alongside it
          load();
        }
      )
      .subscribe();

    return () => {
      mounted = false;
      supabase.removeChannel(channel);
    };
  }, []);

  const todayCount = useMemo(() => {
    const today = new Date().toDateString();
    return rows.filter((r) => new Date(r.scanned_at).toDateString() === today).length;
  }, [rows]);

  const classes = useMemo(() => {
    const set = new Set<string>();
    rows.forEach((r) => r.class && set.add(r.class));
    return Array.from(set).sort();
  }, [rows]);

  const filteredRows = useMemo(() => {
    if (classFilter === "all") return rows;
    return rows.filter((r) => r.class === classFilter);
  }, [rows, classFilter]);

  return (
    <div className="max-w-5xl mx-auto px-6 py-10">
      <div className="flex items-baseline justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Attendance log</h1>
          <p className="text-sm text-[var(--text-muted)] mt-1">
            Live feed from the NFC scanner — updates as cards are scanned.
          </p>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-3 gap-4 mb-10">
        <StatCard label="Scans today" value={loading ? "—" : String(todayCount)} />
        <StatCard label="Total scans logged" value={loading ? "—" : String(rows.length)} />
        <StatCard label="Registered students" value={loading ? "—" : String(studentCount)} />
      </div>

      {/* Filter */}
      {classes.length > 0 && (
        <div className="flex items-center gap-2 mb-4 text-sm font-mono">
          <span className="text-[var(--text-muted)]">filter:</span>
          <button
            onClick={() => setClassFilter("all")}
            className={`px-2.5 py-1 rounded-md border transition-colors ${
              classFilter === "all"
                ? "border-[var(--accent)] text-[var(--accent)]"
                : "border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text)]"
            }`}
          >
            all
          </button>
          {classes.map((c) => (
            <button
              key={c}
              onClick={() => setClassFilter(c)}
              className={`px-2.5 py-1 rounded-md border transition-colors ${
                classFilter === c
                  ? "border-[var(--accent)] text-[var(--accent)]"
                  : "border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text)]"
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      )}

      {/* Feed */}
      <div className="rounded-xl border border-[var(--border)] overflow-hidden">
        <div className="grid grid-cols-[1fr_auto_auto] gap-4 px-5 py-3 text-xs font-mono text-[var(--text-muted)] border-b border-[var(--border)] bg-[var(--surface)]">
          <span>student</span>
          <span>card uid</span>
          <span className="text-right">scanned</span>
        </div>

        {loading && (
          <div className="px-5 py-10 text-center text-sm text-[var(--text-muted)]">
            Loading scan history…
          </div>
        )}

        {!loading && filteredRows.length === 0 && (
          <div className="px-5 py-10 text-center text-sm text-[var(--text-muted)]">
            No scans yet. Scan a registered card to see it appear here.
          </div>
        )}

        {filteredRows.map((row) => (
          <div
            key={row.id}
            className={`grid grid-cols-[1fr_auto_auto] gap-4 px-5 py-3.5 border-b border-[var(--border)] last:border-b-0 bg-[var(--surface)] ${
              row.id === newestId ? "scan-row-enter" : ""
            }`}
          >
            <div className="flex items-center gap-2.5 min-w-0">
              {row.full_name ? (
                <>
                  <span className="truncate">{row.full_name}</span>
                  {row.class && (
                    <span className="text-xs text-[var(--text-muted)] font-mono border border-[var(--border)] rounded px-1.5 py-0.5 shrink-0">
                      {row.class}
                    </span>
                  )}
                </>
              ) : (
                <span className="text-[var(--danger)] text-sm">Unregistered card</span>
              )}
            </div>
            <span className="font-mono text-xs text-[var(--text-muted)] self-center">
              {row.uid}
            </span>
            <span className="text-xs text-[var(--text-muted)] self-center text-right">
              {timeAgo(row.scanned_at)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] px-5 py-4">
      <div className="text-xs text-[var(--text-muted)] font-mono mb-1.5">{label}</div>
      <div className="text-3xl font-semibold tracking-tight tabular-nums">{value}</div>
    </div>
  );
}
