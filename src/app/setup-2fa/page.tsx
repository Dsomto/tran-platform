"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import QRCode from "qrcode";

interface SetupData {
  secret: string;
  otpauthUri: string;
  accountName: string;
  enabled: boolean;
}

function Setup2FAInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const reasonRequired = searchParams.get("reason") === "required";

  const [data, setData] = useState<SetupData | null>(null);
  const [code, setCode] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [qrSvg, setQrSvg] = useState<string | null>(null);

  // Kick off setup on mount: server returns the existing pending secret or
  // generates a new one. The secret + otpauth URI come back; we render a QR
  // for the URI so the user can scan it with their authenticator app.
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/account/2fa/setup", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({}),
        });
        if (!res.ok) {
          const j = await res.json().catch(() => ({}));
          setError(j.error || "Could not start 2FA setup.");
          return;
        }
        const j: SetupData = await res.json();
        setData(j);
        // Render the QR locally with the qrcode package — no third-party
        // dependency. The earlier implementation called api.qrserver.com
        // which was broken for graders behind ad-blockers / corporate
        // networks. toDataURL returns a base64 PNG fit for an img src.
        try {
          const dataUrl = await QRCode.toDataURL(j.otpauthUri, {
            width: 240,
            margin: 1,
            errorCorrectionLevel: "M",
          });
          setQrSvg(dataUrl);
        } catch {
          // Fall through: we still show the manual-entry secret below.
        }
      } catch {
        setError("Network error starting 2FA setup.");
      }
    })();
  }, []);

  async function verify(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setVerifying(true);
    try {
      const res = await fetch("/api/account/2fa/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: code.trim() }),
      });
      const j = await res.json();
      if (!res.ok) {
        setError(j.error || "Verification failed.");
      } else {
        // Route to the role's home. /dashboard is the universal entry: its
        // layout redirects admins to /admin, graders to /admin/reports, and
        // analysts to /admin/analytics, so every privileged role lands in the
        // right place (analysts are gated out of /admin itself).
        router.push("/dashboard");
        router.refresh();
      }
    } catch {
      setError("Network error during verification.");
    } finally {
      setVerifying(false);
    }
  }

  return (
    <main className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="bg-white border border-border rounded-2xl p-8 shadow-sm">
          <h1 className="text-2xl font-bold text-foreground mb-2">Set up two-factor authentication</h1>
          <p className="text-sm text-muted-foreground mb-6">
            {reasonRequired
              ? "Two-factor authentication is required for admin and grader accounts. Set it up now to continue."
              : "Add an extra layer of security to your account."}
          </p>

          {!data ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : (
            <>
              <ol className="text-sm text-foreground space-y-3 mb-6">
                <li className="flex gap-2">
                  <span className="font-bold text-blue">1.</span>
                  <span>Install an authenticator app on your phone (Google Authenticator, 1Password, Authy, Microsoft Authenticator).</span>
                </li>
                <li className="flex gap-2">
                  <span className="font-bold text-blue">2.</span>
                  <span>Scan the QR code below with your app.</span>
                </li>
                <li className="flex gap-2">
                  <span className="font-bold text-blue">3.</span>
                  <span>Enter the 6-digit code from the app to confirm.</span>
                </li>
              </ol>

              {qrSvg && (
                <div className="bg-white border border-border rounded-lg p-4 mb-3 flex justify-center">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={qrSvg}
                    alt="Scan with your authenticator app"
                    width={240}
                    height={240}
                    className="block"
                  />
                </div>
              )}

              <details className="mb-6 text-xs text-muted-foreground">
                <summary className="cursor-pointer hover:text-foreground">Can't scan? Enter the code manually</summary>
                <p className="mt-2 font-mono break-all bg-muted/30 p-2 rounded">{data.secret}</p>
                <p className="mt-2">Account: {data.accountName}</p>
              </details>

              <form onSubmit={verify} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">
                    6-digit code from your app
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]{6}"
                    maxLength={6}
                    required
                    value={code}
                    onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                    className="w-full p-3 border border-border rounded-lg text-sm font-mono tracking-widest text-center text-lg"
                    placeholder="123456"
                  />
                </div>

                {error && (
                  <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-sm text-rose-800">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={verifying || code.length !== 6}
                  className="w-full px-4 py-3 bg-blue text-white font-medium rounded-lg hover:opacity-90 disabled:opacity-50"
                >
                  {verifying ? "Verifying…" : "Verify and enable"}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </main>
  );
}

export default function Setup2FAPage() {
  return (
    <Suspense fallback={<main className="min-h-screen flex items-center justify-center"><p className="text-muted-foreground">Loading…</p></main>}>
      <Setup2FAInner />
    </Suspense>
  );
}
