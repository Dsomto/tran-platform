"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ScrollText, ShieldCheck, Loader2, CheckCircle2, ArrowRight } from "lucide-react";

interface Props {
  fullName: string;
  nextHref: string;
}

export function OnboardingForm({ fullName, nextHref }: Props) {
  const router = useRouter();
  const [typedName, setTypedName] = useState("");
  const [signing, setSigning] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function sign() {
    setSigning(true);
    setErr(null);
    try {
      const res = await fetch("/api/intern/sign-nda", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ typedName }),
      });
      const j = await res.json();
      if (!res.ok) {
        setErr(j.error || "Could not sign");
        return;
      }
      setDone(true);
      window.setTimeout(() => router.push(nextHref), 900);
    } catch {
      setErr("Network error");
    } finally {
      setSigning(false);
    }
  }

  return (
    <>
      {/* ── NDA ── */}
      <section className="bg-white border border-border rounded-2xl p-6 sm:p-8 mb-5">
        <div className="flex items-center gap-2 mb-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-blue">
          <ScrollText className="w-3.5 h-3.5" />
          Document 1 of 2
        </div>
        <h2 className="text-xl sm:text-2xl font-bold text-foreground mb-1">
          Confidentiality &amp; Programme Agreement
        </h2>
        <p className="text-xs text-muted mb-5">
          Between you and Sankofa Digital Limited.
        </p>

        <div className="text-[14px] text-foreground/85 leading-relaxed space-y-3">
          <p>
            <strong>Parties.</strong> This agreement is between Sankofa
            Digital Limited (&ldquo;Sankofa&rdquo;) and the undersigned
            participant in the Ubuntu Bridge Initiative (the
            &ldquo;Programme&rdquo;).
          </p>
          <p>
            <strong>1. Materials.</strong> All scenarios, logs, source-code
            snippets, character names, and artefacts you receive in this
            Programme are simulations created for training purposes. They are
            not pulled from real Sankofa production systems.
          </p>
          <p>
            <strong>2. Confidentiality.</strong> You will not redistribute
            the Programme materials, your reports, or your fellow
            participants&rsquo; work outside the Programme.
            &ldquo;Outside the Programme&rdquo; includes posting to social
            media, public chat groups, or AI training datasets.
          </p>
          <p>
            <strong>3. Permission.</strong> You will not use any technique
            you learn here against any system you do not own or have written
            permission to test. The ISC2 Code of Ethics applies in full to
            your conduct as a participant.
          </p>
          <p>
            <strong>4. IP.</strong> You retain ownership of the original
            work you submit. By submitting, you grant Sankofa and its
            programme partners a non-exclusive licence to review, score, and
            discuss your work for the purposes of the Programme.
          </p>
          <p>
            <strong>5. Privacy.</strong> Sankofa will hold your account data
            and submission history for the duration of the Programme and up
            to 24 months afterwards for portfolio verification, then delete
            on request.
          </p>
          <p>
            <strong>6. Termination.</strong> Sankofa may end your
            participation for breach of this agreement, plagiarism, or
            conduct that jeopardises another participant&rsquo;s safety.
          </p>
          <p>
            <strong>7. No employment.</strong> This Programme does not
            create an employment relationship between you and Sankofa.
            Compensation, if any, is announced separately at each stage.
          </p>
          <p>
            <strong>8. Governing law.</strong> This agreement is governed by
            the laws of the Federal Republic of Nigeria.
          </p>
          <p className="text-muted text-xs italic">
            Sankofa Digital Limited is a fictional organisation used for the
            purposes of this Programme. The legal undertakings above bind
            your conduct as a participant in real terms.
          </p>
        </div>
      </section>

      {/* ── Programme Terms ── */}
      <section className="bg-white border border-border rounded-2xl p-6 sm:p-8 mb-5">
        <div className="flex items-center gap-2 mb-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-blue">
          <ShieldCheck className="w-3.5 h-3.5" />
          Document 2 of 2
        </div>
        <h2 className="text-xl sm:text-2xl font-bold text-foreground mb-1">
          Programme house rules
        </h2>
        <p className="text-xs text-muted mb-5">
          The conduct expected of every UBI participant for the duration of
          the cohort.
        </p>

        <ol className="space-y-3">
          <li className="flex gap-3">
            <span className="shrink-0 font-mono text-[11px] text-blue">01</span>
            <span className="text-[14px] leading-relaxed text-foreground/85">
              All access to the platform is logged. By proceeding, you
              accept that your activity is recorded for audit.
            </span>
          </li>
          <li className="flex gap-3">
            <span className="shrink-0 font-mono text-[11px] text-blue">02</span>
            <span className="text-[14px] leading-relaxed text-foreground/85">
              Findings, evidence, and synthesised reports stay confidential
              to the Programme until released. &ldquo;Confidential to the
              Programme&rdquo; includes the cohort group.
            </span>
          </li>
          <li className="flex gap-3">
            <span className="shrink-0 font-mono text-[11px] text-blue">03</span>
            <span className="text-[14px] leading-relaxed text-foreground/85">
              Plagiarism and unauthorised collaboration are grounds for
              removal from the Programme. Use what you learn — do not pass
              another participant&rsquo;s work as your own.
            </span>
          </li>
          <li className="flex gap-3">
            <span className="shrink-0 font-mono text-[11px] text-blue">04</span>
            <span className="text-[14px] leading-relaxed text-foreground/85">
              Treat fellow participants with respect. Harassment or hostility
              ends a participation immediately.
            </span>
          </li>
          <li className="flex gap-3">
            <span className="shrink-0 font-mono text-[11px] text-blue">05</span>
            <span className="text-[14px] leading-relaxed text-foreground/85">
              If something looks wrong with the platform, report it to the
              Programme team. Do not exploit it for advantage.
            </span>
          </li>
          <li className="flex gap-3">
            <span className="shrink-0 font-mono text-[11px] text-blue">06</span>
            <span className="text-[14px] leading-relaxed text-foreground/85">
              Quality over speed. Speed without judgement is a liability —
              you will be told this many times. Believe it once.
            </span>
          </li>
        </ol>
      </section>

      {/* ── Signature ── */}
      <section className="bg-white border-2 border-blue/30 rounded-2xl p-6 sm:p-8">
        <h2 className="text-base font-semibold text-foreground mb-1">
          Sign once, for both documents
        </h2>
        <p className="text-xs text-muted mb-5">
          Type your full name to sign. Must match your account:{" "}
          <strong>{fullName}</strong>.
        </p>

        <input
          type="text"
          value={typedName}
          onChange={(e) => setTypedName(e.target.value)}
          placeholder={fullName}
          disabled={signing || done}
          className="w-full bg-transparent border-b-2 border-foreground/20 px-2 py-3 text-2xl text-foreground outline-none focus:border-blue transition-colors disabled:opacity-60"
          style={{ fontFamily: "Georgia, serif", fontStyle: "italic" }}
        />

        {err && (
          <div className="mt-3 text-sm text-rose-700 bg-rose-50 border border-rose-200 rounded-lg p-3">
            {err}
          </div>
        )}

        {done ? (
          <div className="mt-5 inline-flex items-center gap-2 text-emerald-700 font-semibold">
            <CheckCircle2 className="w-5 h-5" />
            Signed. Taking you to your stage…
          </div>
        ) : (
          <button
            onClick={sign}
            disabled={signing || !typedName.trim()}
            className="mt-5 inline-flex items-center gap-2 px-7 py-3 rounded-full text-sm font-bold uppercase tracking-[0.15em] text-white bg-blue hover:bg-blue-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {signing ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
            Sign and continue
          </button>
        )}
      </section>
    </>
  );
}
