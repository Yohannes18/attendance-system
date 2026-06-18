"use client";

import { useEffect, useState } from "react";
import { supabase, type Student, type AbsenceSummary } from "@/lib/supabase";
import Link from "next/link";

export default function StudentsPage() {
    const [students, setStudents] = useState<Student[]>([]);
    const [absences, setAbsences] = useState<Map<string, AbsenceSummary>>(new Map());
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let mounted = true;

        async function loadData() {
            try {
                const { data: studentData, error: studentErr } = await supabase
                    .from("students")
                    .select("*")
                    .order("full_name", { ascending: true });

                if (studentErr) throw studentErr;

                const { data: absenceData, error: absenceErr } = await supabase
                    .from("absence_summary")
                    .select("*");

                if (absenceErr) throw absenceErr;

                if (mounted) {
                    setStudents(studentData || []);

                    // Map absences by student_id for quick lookup
                    const absenceMap = new Map<string, AbsenceSummary>();
                    (absenceData || []).forEach((record) => {
                        absenceMap.set(record.student_id, record as AbsenceSummary);
                    });
                    setAbsences(absenceMap);

                    setLoading(false);
                }
            } catch (err) {
                if (mounted) {
                    setError(err instanceof Error ? err.message : "Failed to load students");
                    setLoading(false);
                }
            }
        }

        loadData();

        return () => {
            mounted = false;
        };
    }, []);

    if (loading) return <div className="p-8 text-[var(--text)]">Loading students...</div>;

    return (
        <div className="min-h-screen bg-[var(--bg)] p-8">
            <div className="max-w-6xl mx-auto">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-3xl font-bold text-[var(--text)]">Students Management</h1>
                    <Link
                        href="/add-card"
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                        Add Student
                    </Link>
                </div>

                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
                        {error}
                    </div>
                )}

                {/* Absence Alerts */}
                {Array.from(absences.values()).filter(a => a.status !== "ok").length > 0 && (
                    <div className="mb-6 space-y-2">
                        {Array.from(absences.values())
                            .filter(a => a.status !== "ok")
                            .map((absence) => (
                                <div
                                    key={`${absence.student_id}-${absence.semester_id}`}
                                    className={`px-4 py-3 rounded border ${absence.status === "critical"
                                            ? "bg-red-50 border-red-200 text-red-700"
                                            : "bg-yellow-50 border-yellow-200 text-yellow-700"
                                        }`}
                                >
                                    <strong>{absence.full_name}</strong> — {absence.absent_count}/{absence.max_absent} absences ({absence.semester_name})
                                    {absence.status === "critical" && " ⚠️ CRITICAL"}
                                </div>
                            ))}
                    </div>
                )}

                <div className="bg-[var(--bg)] border border-[var(--border)] rounded-lg shadow overflow-hidden">
                    <table className="w-full">
                        <thead className="bg-[var(--bg)] border-b border-[var(--border)]">
                            <tr>
                                <th className="px-6 py-3 text-left text-sm font-semibold text-[var(--text)]">NFC ID</th>
                                <th className="px-6 py-3 text-left text-sm font-semibold text-[var(--text)]">Full Name</th>
                                <th className="px-6 py-3 text-left text-sm font-semibold text-[var(--text)]">Sex</th>
                                <th className="px-6 py-3 text-left text-sm font-semibold text-[var(--text)]">Phone</th>
                                <th className="px-6 py-3 text-left text-sm font-semibold text-[var(--text)]">Class</th>
                                <th className="px-6 py-3 text-left text-sm font-semibold text-[var(--text)]">Department</th>
                                <th className="px-6 py-3 text-left text-sm font-semibold text-[var(--text)]">Absences</th>
                                <th className="px-6 py-3 text-left text-sm font-semibold text-[var(--text)]">Registered</th>
                                <th className="px-6 py-3 text-left text-sm font-semibold text-[var(--text)]">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {students.length === 0 ? (
                                <tr>
                                    <td colSpan={9} className="px-6 py-8 text-center text-[var(--text-muted)]">
                                        No students registered yet
                                    </td>
                                </tr>
                            ) : (
                                students.map((student) => {
                                    const absence = absences.get(student.id);
                                    const absenceStatus = absence?.status || "ok";
                                    return (
                                        <tr
                                            key={student.id}
                                            className={`border-b border-[var(--border)] hover:bg-[var(--bg)]/50 ${absenceStatus === "critical" ? "bg-red-500/10" : absenceStatus === "warning" ? "bg-yellow-500/10" : ""
                                                }`}
                                        >
                                            <td className="px-6 py-4 text-sm font-mono text-[var(--text)]">{student.uid}</td>
                                            <td className="px-6 py-4 text-sm text-[var(--text)]">{student.full_name}</td>
                                            <td className="px-6 py-4 text-sm text-[var(--text-muted)]">{student.sex || "—"}</td>
                                            <td className="px-6 py-4 text-sm text-[var(--text-muted)]">{student.phone || "—"}</td>
                                            <td className="px-6 py-4 text-sm text-[var(--text-muted)]">{student.class || "—"}</td>
                                            <td className="px-6 py-4 text-sm text-[var(--text-muted)]">{student.department || "—"}</td>
                                            <td className="px-6 py-4 text-sm">
                                                {absence ? (
                                                    <span
                                                        className={`px-2 py-1 rounded text-xs font-semibold ${absence.status === "critical"
                                                                ? "bg-red-200 text-red-800"
                                                                : absence.status === "warning"
                                                                    ? "bg-yellow-200 text-yellow-800"
                                                                    : "bg-green-200 text-green-800"
                                                            }`}
                                                    >
                                                        {absence.absent_count}/{absence.max_absent}
                                                    </span>
                                                ) : (
                                                    "—"
                                                )}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-[var(--text-muted)]">
                                                {new Date(student.created_at).toLocaleDateString()}
                                            </td>
                                            <td className="px-6 py-4 text-sm">
                                                <button className="text-blue-600 hover:text-blue-800 mr-3">Edit</button>
                                                <button className="text-red-600 hover:text-red-800">Delete</button>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>

                <div className="mt-4 text-[var(--text-muted)] text-sm">
                    Total: {students.length} student{students.length !== 1 ? "s" : ""}
                </div>
            </div>
        </div>
    );
}
