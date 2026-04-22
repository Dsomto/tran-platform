"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AtSign, Lock, ShieldCheck } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [challenge, setChallenge] = useState<string | null>(null);
  const [code, setCode] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    const formData = new FormData(e.currentTarget);
    const identifier = formData.get("identifier") as string;
    const password = formData.get("password") as string;

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Invalid credentials");
        return;
      }

      if (data.needs2FA && data.challenge) {
        setChallenge(data.challenge);
        return;
      }

      if (data.user.role === "ADMIN" || data.user.role === "SUPER_ADMIN") {
        router.push("/admin");
      } else {
        router.push("/dashboard");
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  async function submit2FA(e: React.FormEvent) {
    e.preventDefault();
    if (!challenge) return;
    setIsLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/2fa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ challenge, code: code.replace(/\s/g, "") }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Incorrect code");
        return;
      }
      if (data.user.role === "ADMIN" || data.user.role === "SUPER_ADMIN") {
        router.push("/admin");
      } else {
        router.push("/dashboard");
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  if (challenge) {
    return (
      <div>
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-blue/10 mb-3">
            <ShieldCheck className="w-5 h-5 text-blue" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">Two-factor required</h1>
          <p className="text-sm text-muted mt-2">
            Open your authenticator app and enter the 6-digit code.
          </p>
        </div>

        <form onSubmit={submit2FA} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Authentication code
            </label>
            <input
              value={code}
              onChange={(e) => setCode(e.target.value)}
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              autoFocus
              placeholder="123456"
              className="w-full p-3 border border-border rounded-xl font-mono text-lg tracking-widest text-center bg-background"
            />
          </div>

          {error && (
            <div className="bg-danger/10 border border-danger/20 rounded-xl px-4 py-3">
              <p className="text-sm text-danger">{error}</p>
            </div>
          )}

          <Button
            type="submit"
            className="w-full"
            size="lg"
            isLoading={isLoading}
            disabled={code.replace(/\s/g, "").length !== 6}
          >
            Verify
          </Button>

          <button
            type="button"
            onClick={() => {
              setChallenge(null);
              setCode("");
              setError("");
            }}
            className="w-full text-center text-xs text-muted hover:text-foreground"
          >
            Back to login
          </button>
        </form>
      </div>
    );
  }

  return (
    <div>
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold text-foreground">Welcome Back</h1>
        <p className="text-sm text-muted mt-2">
          Log in to access your dashboard
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <Input
          id="identifier"
          name="identifier"
          type="text"
          label="Email or Intern ID"
          placeholder="you@example.com or UBI-2026-0001"
          icon={<AtSign className="w-4 h-4" />}
          autoComplete="username"
          required
        />

        <Input
          id="password"
          name="password"
          type="password"
          label="Password"
          placeholder="Enter your password"
          icon={<Lock className="w-4 h-4" />}
          required
        />

        {error && (
          <div className="bg-danger/10 border border-danger/20 rounded-xl px-4 py-3">
            <p className="text-sm text-danger">{error}</p>
          </div>
        )}

        <Button type="submit" className="w-full" size="lg" isLoading={isLoading}>
          Log In
        </Button>
      </form>

      <div className="mt-6 text-center">
        <p className="text-sm text-muted">
          Not in the programme yet?{" "}
          <Link href="/apply" className="font-semibold text-blue hover:text-blue-dark transition-colors">
            Apply
          </Link>
        </p>
      </div>
    </div>
  );
}
