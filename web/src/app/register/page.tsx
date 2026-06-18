import { Suspense } from "react";
import RegisterForm from "./RegisterForm";

export default function RegisterPage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-md mx-auto px-6 py-10">
          <p className="text-sm text-[var(--text-muted)]">Loading registration form…</p>
        </div>
      }
    >
      <RegisterForm />
    </Suspense>
  );
}
