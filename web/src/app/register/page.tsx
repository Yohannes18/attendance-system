"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useSearchParams, useRouter } from "next/navigation";

type Status = "idle" | "submitting" | "success" | "error";

export default function RegisterPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [uid, setUid] = useState("");
  const [fullName, setFullName] = useState("");
  const [sex, setSex] = useState("");
  const [phone, setPhone] = useState("");
  const [studentClass, setStudentClass] = useState("");
  const [department, setDepartment] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [errorMsg, setErrorMsg] = useState("");

  // Pre-fill UID from URL parameter if provided
  useEffect(() => {
    const uidParam = searchParams.get("uid");
    if (uidParam) {
      setUid(uidParam.toUpperCase());
    }
  }, [searchParams]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("submitting");
    setErrorMsg("");

    const normalizedUid = uid.trim().toUpperCase();

    const { error } = await supabase.from("students").insert({
      uid: normalizedUid,
      full_name: fullName.trim(),
      sex: sex.trim() || null,
      phone: phone.trim() || null,
      class: studentClass.trim() || null,
      department: department.trim() || null,
    });

    if (error) {
      setStatus("error");
      setErrorMsg(
        error.code === "23505"
          ? "This card UID is already registered to another student."
          : error.message
      );
      return;
    }

    setStatus("success");
    setUid("");
    setFullName("");
    setSex("");
    setPhone("");
    setStudentClass("");
    setDepartment("");

    // Redirect back to students list after success
    setTimeout(() => {
      router.push("/students");
    }, 2000);
  }

  return (
    <div className="max-w-md mx-auto px-6 py-10">
      <h1 className="text-2xl font-semibold tracking-tight mb-1">Register Student</h1>
      <p className="text-sm text-[var(--text-muted)] mb-8">
        {uid ? "Card UID detected. Enter the student details below." : "Tap the card on the reader to scan its UID."}
      </p>

      <form onSubmit={handleSubmit} className="space-y-5">
        <Field
          label="Card UID"
          hint="Auto-filled from scanned card"
        >
          <input
            value={uid}
            onChange={(e) => setUid(e.target.value)}
            required
            placeholder="7A810E06"
            className="w-full bg-[var(--surface)] border border-[var(--border)] rounded-lg px-3.5 py-2.5 font-mono text-sm tracking-wider uppercase focus:outline-none focus:border-[var(--accent)] transition-colors placeholder:text-[var(--text-muted)]"
          />
        </Field>

        <Field label="Full name">
          <input
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
            placeholder="Abebe Kebede"
            className="w-full bg-[var(--surface)] border border-[var(--border)] rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:border-[var(--accent)] transition-colors placeholder:text-[var(--text-muted)]"
          />
        </Field>

        <Field label="Sex" hint="Optional">
          <select
            value={sex}
            onChange={(e) => setSex(e.target.value)}
            className="w-full bg-[var(--surface)] border border-[var(--border)] rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:border-[var(--accent)] transition-colors"
          >
            <option value="">Select sex</option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
            <option value="Other">Other</option>
          </select>
        </Field>

        <Field label="Phone" hint="Optional">
          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="0911 234 567"
            className="w-full bg-[var(--surface)] border border-[var(--border)] rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:border-[var(--accent)] transition-colors placeholder:text-[var(--text-muted)]"
          />
        </Field>

        <Field label="Class" hint="Optional">
          <input
            value={studentClass}
            onChange={(e) => setStudentClass(e.target.value)}
            placeholder="CS-3B"
            className="w-full bg-[var(--surface)] border border-[var(--border)] rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:border-[var(--accent)] transition-colors placeholder:text-[var(--text-muted)]"
          />
        </Field>

        <Field label="Department" hint="Optional">
          <input
            value={department}
            onChange={(e) => setDepartment(e.target.value)}
            placeholder="Computer Science"
            className="w-full bg-[var(--surface)] border border-[var(--border)] rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:border-[var(--accent)] transition-colors placeholder:text-[var(--text-muted)]"
          />
        </Field>

        <button
          type="submit"
          disabled={status === "submitting" || !uid || !fullName}
          className="w-full bg-[var(--accent)] text-[var(--bg)] font-medium rounded-lg py-2.5 text-sm hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {status === "submitting" ? "Registering…" : "Register Student"}
        </button>

        {status === "success" && (
          <p className="text-sm text-green-600 text-center">
            Student registered successfully! Redirecting…
          </p>
        )}
        {status === "error" && (
          <p className="text-sm text-red-600 text-center">{errorMsg}</p>
        )}
      </form>
    </div>
  );
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="block text-sm font-medium mb-1.5">{label}</span>
      {children}
      {hint && <span className="block text-xs text-[var(--text-muted)] mt-1.5">{hint}</span>}
    </label>
  );
}
