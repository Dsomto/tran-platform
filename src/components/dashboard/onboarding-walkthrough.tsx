"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { X, CheckCircle2, ArrowRight, MessageSquare, FileText, Shield } from "lucide-react";

const STORAGE_KEY = "ubi-onboarding-dismissed";

interface Step {
  icon: React.ElementType;
  title: string;
  body: string;
  cta: { label: string; href: string };
  color: string;
}

const STEPS: Step[] = [
  {
    icon: MessageSquare,
    title: "Join the cohort Slack",
    body:
      "Everything outside the platform — announcements, mentor office-hours, help from other participants — happens on Slack. Get on it before anything else.",
    cta: { label: "Go to Slack card", href: "#slack-card" },
    color: "bg-[#4A154B]",
  },
  {
    icon: FileText,
    title: "Find your current stage",
    body:
      "The top-left stat card shows which stage you're on. Click Assignments to see the tasks for that stage. When you finish them, submit a report under Reports.",
    cta: { label: "Open assignments", href: "/dashboard/assignments" },
    color: "bg-blue",
  },
  {
    icon: Shield,
    title: "Turn on two-factor auth (optional)",
    body:
      "Your account holds months of work. Turn on 2FA so a stolen password doesn't cost you that. Takes two minutes with Google Authenticator.",
    cta: { label: "Set up 2FA", href: "/dashboard/settings/security" },
    color: "bg-emerald-600",
  },
];

export function OnboardingWalkthrough() {
  const [show, setShow] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    try {
      const dismissed = localStorage.getItem(STORAGE_KEY);
      if (!dismissed) setShow(true);
    } catch {
      // localStorage unavailable; skip.
    }
  }, []);

  function dismiss() {
    try {
      localStorage.setItem(STORAGE_KEY, "1");
    } catch {
      // ignore
    }
    setShow(false);
  }

  function next() {
    if (step < STEPS.length - 1) {
      setStep(step + 1);
    } else {
      dismiss();
    }
  }

  if (!show) return null;

  const current = STEPS[step];
  const Icon = current.icon;
  const isLast = step === STEPS.length - 1;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-[fadeIn_0.2s_ease]">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        {/* Colored header */}
        <div className={`${current.color} text-white p-5 flex items-start justify-between`}>
          <div className="flex items-center gap-3">
            <Icon className="h-5 w-5 shrink-0" />
            <div>
              <p className="text-[11px] font-medium opacity-80 uppercase tracking-wider">
                Welcome · Step {step + 1} of {STEPS.length}
              </p>
              <h2 className="text-lg font-semibold mt-0.5">{current.title}</h2>
            </div>
          </div>
          <button
            onClick={dismiss}
            aria-label="Skip onboarding"
            className="rounded-full p-1 hover:bg-white/10"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-6">
          <p className="text-sm text-foreground/80 leading-relaxed mb-6">
            {current.body}
          </p>

          {/* Progress dots */}
          <div className="flex items-center justify-center gap-1.5 mb-6">
            {STEPS.map((_, i) => (
              <div
                key={i}
                className={`h-1.5 rounded-full transition-all ${
                  i === step ? "w-6 bg-foreground" : "w-1.5 bg-muted"
                }`}
              />
            ))}
          </div>

          <div className="flex gap-3">
            <Link
              href={current.cta.href}
              onClick={() => !current.cta.href.startsWith("#") && dismiss()}
              className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium rounded-lg border border-border hover:bg-muted/50"
            >
              {current.cta.label}
            </Link>
            <button
              onClick={next}
              className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-lg bg-foreground text-background hover:opacity-90"
            >
              {isLast ? (
                <>
                  <CheckCircle2 className="h-4 w-4" />
                  Got it
                </>
              ) : (
                <>
                  Next
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </div>

          <button
            onClick={dismiss}
            className="block mx-auto mt-4 text-xs text-muted-foreground hover:text-foreground"
          >
            Don't show this again
          </button>
        </div>
      </div>
    </div>
  );
}
