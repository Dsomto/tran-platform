"use client";

import { Suspense, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";

function ResetPasswordInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (password.length < 12) {
      setError("Password must be at least 12 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords don't match.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, newPassword: password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Something went wrong.");
      } else {
        setSuccess(true);
        setTimeout(() => router.push("/login"), 2500);
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (!token) {
    return (
      <div className="bg-white border border-border rounded-2xl p-8 shadow-sm">
        <h1 className="text-2xl font-bold text-foreground mb-2">Invalid reset link</h1>
        <p className="text-sm text-muted-foreground mb-6">
          This page needs a reset token. If you got here from an email, the link may have been truncated. Open the original email and click the button there.
        </p>
        <Link href="/forgot-password" className="inline-block px-4 py-2.5 bg-blue text-white font-medium rounded-lg hover:opacity-90">
          Request a new reset link
        </Link>
      </div>
    );
  }

  if (success) {
    return (
      <div className="bg-white border border-border rounded-2xl p-8 shadow-sm">
        <h1 className="text-2xl font-bold text-foreground mb-2">Password updated</h1>
        <p className="text-sm text-muted-foreground mb-6">
          You&apos;ll be redirected to sign in shortly.
        </p>
        <Link href="/login" className="inline-block px-4 py-2.5 bg-blue text-white font-medium rounded-lg hover:opacity-90">
          Sign in now
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-white border border-border rounded-2xl p-8 shadow-sm">
      <h1 className="text-2xl font-bold text-foreground mb-2">Set a new password</h1>
      <p className="text-sm text-muted-foreground mb-6">
        Pick something at least 12 characters. Use a password manager if you can.
      </p>

      <form onSubmit={submit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-foreground mb-1">New password</label>
          <input
            type="password"
            required
            minLength={12}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full p-3 border border-border rounded-lg text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-foreground mb-1">Confirm new password</label>
          <input
            type="password"
            required
            minLength={12}
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            className="w-full p-3 border border-border rounded-lg text-sm"
          />
        </div>

        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-sm text-rose-800">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="w-full px-4 py-3 bg-blue text-white font-medium rounded-lg hover:opacity-90 disabled:opacity-50"
        >
          {submitting ? "Updating…" : "Update password"}
        </button>
      </form>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <main className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <Suspense fallback={<div className="text-center text-muted-foreground">Loading…</div>}>
          <ResetPasswordInner />
        </Suspense>
      </div>
    </main>
  );
}
