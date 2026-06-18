"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

type Status = "waiting" | "checking" | "exists" | "not_found" | "error";

export default function AddCardPage() {
    const router = useRouter();
    const [uid, setUid] = useState("");
    const [status, setStatus] = useState<Status>("waiting");
    const [errorMsg, setErrorMsg] = useState("");
    const [existingStudent, setExistingStudent] = useState<{ full_name: string } | null>(null);

    async function checkCard(cardUid: string) {
        if (!cardUid.trim()) return;

        setStatus("checking");
        setErrorMsg("");
        setExistingStudent(null);

        const normalizedUid = cardUid.trim().toUpperCase();

        const { data, error } = await supabase
            .from("students")
            .select("id, full_name")
            .eq("uid", normalizedUid)
            .single();

        if (error && error.code !== "PGRST116") {
            // PGRST116 = no rows returned (which is what we want for new cards)
            setStatus("error");
            setErrorMsg(error.message);
            return;
        }

        if (data) {
            // Card already exists
            setStatus("exists");
            setExistingStudent(data);
        } else {
            // Card not found, redirect to register with UID pre-filled
            setStatus("not_found");
            setTimeout(() => {
                router.push(`/register?uid=${normalizedUid}`);
            }, 500);
        }
    }

    function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
        if (e.key === "Enter") {
            checkCard(uid);
        }
    }

    return (
        <div className="max-w-md mx-auto px-6 py-10">
            <h1 className="text-2xl font-semibold tracking-tight mb-1">Add New Card</h1>
            <p className="text-sm text-[var(--text-muted)] mb-8">
                Tap the NFC card on the reader or enter its UID below. If it's not registered, you'll be taken to the student registration form.
            </p>

            <div className="space-y-5">
                <div>
                    <label className="block text-sm font-medium text-[var(--text)] mb-2">
                        Card UID
                    </label>
                    <input
                        value={uid}
                        onChange={(e) => setUid(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Tap card or enter UID (e.g. 7A810E06)"
                        autoFocus
                        className="w-full bg-[var(--surface)] border border-[var(--border)] rounded-lg px-3.5 py-2.5 font-mono text-sm tracking-wider uppercase focus:outline-none focus:border-[var(--accent)] transition-colors placeholder:text-[var(--text-muted)]"
                    />
                </div>

                <button
                    onClick={() => checkCard(uid)}
                    disabled={!uid.trim() || status === "checking"}
                    className="w-full bg-[var(--accent)] text-[var(--bg)] font-medium rounded-lg py-2.5 text-sm hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {status === "checking" ? "Checking…" : "Check Card"}
                </button>

                {status === "exists" && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                        <p className="text-sm text-yellow-800 font-medium">
                            This card is already registered to:
                        </p>
                        <p className="text-sm text-yellow-700 mt-1">{existingStudent?.full_name}</p>
                    </div>
                )}

                {status === "not_found" && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                        <p className="text-sm text-green-800 font-medium">
                            Card not found. Redirecting to registration…
                        </p>
                    </div>
                )}

                {status === "error" && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                        <p className="text-sm text-red-800 font-medium">Error checking card:</p>
                        <p className="text-sm text-red-700 mt-1">{errorMsg}</p>
                    </div>
                )}
            </div>
        </div>
    );
}
