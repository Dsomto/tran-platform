"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, CheckCircle2, ShieldCheck, ShieldOff, Copy } from "lucide-react";

interface Props {
  email: string;
  initiallyEnabled: boolean;
  lastUsedAt: string | null;
}

interface SetupData {
  secret: string;
  otpauthUri: string;
  accountName: string;
  issuer: string;
}

export function TwoFactorPanel({ email, initiallyEnabled, lastUsedAt }: Props) {
  const router = useRouter();
  const [enabled, setEnabled] = useState(initiallyEnabled);
  const [setupData, setSetupData] = useState<SetupData | null>(null);
  const [step, setStep] = useState<"idle" | "setup" | "disable">("idle");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  async function startSetup() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/account/2fa/setup", { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed");
      } else {
        setSetupData(data);
        setStep("setup");
      }
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  }

  async function verifySetup() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/account/2fa/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: code.replace(/\s/g, "") }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed");
      } else {
        setEnabled(true);
        setStep("idle");
        setSetupData(null);
        setCode("");
        router.refresh();
      }
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  }

  async function disable2fa() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/account/2fa/disable", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password, code: code.replace(/\s/g, "") }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed");
      } else {
        setEnabled(false);
        setStep("idle");
        setPassword("");
        setCode("");
        router.refresh();
      }
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  }

  function copySecret() {
    if (!setupData) return;
    navigator.clipboard.writeText(setupData.secret);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  // Render a QR code on the client using a tiny SVG service or an inline
  // generator. We use quickchart.io only if the user is willing to send their
  // secret to a third party — we are NOT, so we render via a data:image
  // constructed from the otpauth URI using the browser's Web Crypto + a small
  // public QR service proxied through us. Since we want zero external trust,
  // we instead show the secret key clearly so users can enter it manually in
  // their authenticator app.
  //
  // Reality: most authenticator apps support "Enter key manually" (Google
  // Authenticator labels it "Enter a setup key"). That path is scan-free and
  // requires no third-party QR render.

  if (step === "setup" && setupData) {
    return (
      <div className="bg-white border border-border rounded-xl p-6">
        <h2 className="font-semibold text-foreground mb-3">Set up two-factor authentication</h2>
        <ol className="text-sm text-foreground/80 leading-relaxed space-y-3 mb-5 list-decimal list-inside">
          <li>Install an authenticator app if you don't have one — <strong>Google Authenticator</strong>, <strong>Authy</strong>, or <strong>1Password</strong> all work.</li>
          <li>In the app, choose <strong>Add account → Enter a setup key</strong> (every app has this option under a different name).</li>
          <li>Paste the account name and secret below.</li>
          <li>Enter the 6-digit code your app shows.</li>
        </ol>

        <div className="space-y-3 mb-5">
          <div>
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Account name
            </label>
            <div className="mt-1 p-3 bg-muted/40 border border-border rounded-lg font-mono text-sm">
              {setupData.issuer}: {setupData.accountName}
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Secret key
            </label>
            <div className="mt-1 flex items-center gap-2">
              <div className="flex-1 p-3 bg-muted/40 border border-border rounded-lg font-mono text-sm break-all">
                {setupData.secret}
              </div>
              <button
                onClick={copySecret}
                className="p-2.5 border border-border rounded-lg hover:bg-muted/50"
                aria-label="Copy secret"
              >
                {copied ? <CheckCircle2 className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
              </button>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Keep this secret safe. If someone has this key, they can generate codes.
            </p>
          </div>
        </div>

        <div className="border-t border-border pt-4">
          <label className="block text-sm font-medium text-foreground mb-1">
            Enter the 6-digit code from your app
          </label>
          <input
            value={code}
            onChange={(e) => setCode(e.target.value)}
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            placeholder="123456"
            className="w-40 p-3 border border-border rounded-lg font-mono text-lg tracking-widest text-center"
          />

          {error && (
            <div className="mt-3 p-2 bg-rose-50 border border-rose-200 rounded text-xs text-rose-800">
              {error}
            </div>
          )}

          <div className="mt-4 flex gap-3">
            <button
              onClick={verifySetup}
              disabled={loading || code.replace(/\s/g, "").length !== 6}
              className="inline-flex items-center gap-2 px-4 py-2 font-medium rounded-lg bg-blue text-white hover:opacity-90 disabled:opacity-50"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
              Verify & enable
            </button>
            <button
              onClick={() => {
                setStep("idle");
                setSetupData(null);
                setCode("");
                setError(null);
              }}
              className="px-4 py-2 text-sm font-medium rounded-lg border border-border hover:bg-muted/50"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (step === "disable") {
    return (
      <div className="bg-white border border-border rounded-xl p-6">
        <h2 className="font-semibold text-foreground mb-3">Turn off two-factor authentication</h2>
        <p className="text-sm text-muted-foreground mb-5">
          To disable 2FA we require both your password and a current code —
          this way an attacker with just one of them can't remove it.
        </p>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Your password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              className="w-full p-3 border border-border rounded-lg text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">6-digit code</label>
            <input
              value={code}
              onChange={(e) => setCode(e.target.value)}
              inputMode="numeric"
              maxLength={6}
              className="w-40 p-3 border border-border rounded-lg font-mono text-lg tracking-widest text-center"
            />
          </div>

          {error && (
            <div className="p-2 bg-rose-50 border border-rose-200 rounded text-xs text-rose-800">
              {error}
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button
              onClick={disable2fa}
              disabled={loading || !password || code.length !== 6}
              className="inline-flex items-center gap-2 px-4 py-2 font-medium rounded-lg bg-rose-600 text-white hover:opacity-90 disabled:opacity-50"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldOff className="h-4 w-4" />}
              Turn off 2FA
            </button>
            <button
              onClick={() => {
                setStep("idle");
                setPassword("");
                setCode("");
                setError(null);
              }}
              className="px-4 py-2 text-sm font-medium rounded-lg border border-border hover:bg-muted/50"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Idle state — show current status
  return (
    <div className="bg-white border border-border rounded-xl p-6">
      <div className="flex items-start justify-between gap-4 flex-wrap mb-4">
        <div>
          <h2 className="font-semibold text-foreground flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-blue" />
            Two-factor authentication
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Requires a 6-digit code from your authenticator app every time you log in.
          </p>
        </div>
        <span
          className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${
            enabled
              ? "bg-emerald-50 text-emerald-800 border-emerald-200"
              : "bg-muted text-muted-foreground border-border"
          }`}
        >
          {enabled ? "Enabled" : "Disabled"}
        </span>
      </div>

      {enabled && lastUsedAt && (
        <p className="text-xs text-muted-foreground mb-4">
          Last used: {new Date(lastUsedAt).toLocaleString()}
        </p>
      )}

      {error && (
        <div className="mb-3 p-2 bg-rose-50 border border-rose-200 rounded text-xs text-rose-800">
          {error}
        </div>
      )}

      <div className="flex gap-3">
        {enabled ? (
          <button
            onClick={() => setStep("disable")}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg border border-border hover:bg-muted/50"
          >
            <ShieldOff className="h-4 w-4" />
            Turn off
          </button>
        ) : (
          <button
            onClick={startSetup}
            disabled={loading}
            className="inline-flex items-center gap-2 px-4 py-2 font-medium rounded-lg bg-blue text-white hover:opacity-90 disabled:opacity-50"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
            Set up 2FA
          </button>
        )}
      </div>
    </div>
  );
}
