"use client";

import { useState, useEffect, useCallback } from "react";
import { Navbar } from "@/components/landing/navbar";
import { Footer } from "@/components/landing/footer";
import {
  Search,
  Shield,
  Users,
  Trophy,
  ChevronRight,
  Star,
  Globe,
} from "lucide-react";
import AOS from "aos";
import "aos/dist/aos.css";

interface BoardApplicant {
  fullName: string;
  country: string;
  trackInterest: string;
  stage: number;
  stageStatus: string;
}

const STAGE_LABELS: Record<number, string> = {
  0: "Stage 0 — Onboarding",
  1: "Stage 1 — Foundations",
  2: "Stage 2 — Core Skills",
  3: "Stage 3 — Intermediate",
  4: "Stage 4 — Advanced Basics",
  5: "Stage 5 — Alumni Eligible",
  6: "Stage 6 — Specialization",
  7: "Stage 7 — Deep Dive",
  8: "Stage 8 — Expert Level",
  9: "Stage 9 — Final Stage",
  10: "Finalist",
};

const STAGE_COLORS: Record<number, string> = {
  0: "border-blue/20 bg-blue/5",
  1: "border-blue/20 bg-blue/5",
  2: "border-cyan/20 bg-cyan/5",
  3: "border-cyan/20 bg-cyan/5",
  4: "border-emerald/20 bg-emerald/5",
  5: "border-emerald/20 bg-emerald/5",
  6: "border-amber/20 bg-amber/5",
  7: "border-amber/20 bg-amber/5",
  8: "border-violet/20 bg-violet/5",
  9: "border-violet/20 bg-violet/5",
  10: "border-amber/30 bg-amber/10",
};

const BADGE_COLORS: Record<number, string> = {
  0: "bg-blue/10 text-blue",
  1: "bg-blue/10 text-blue",
  2: "bg-cyan/10 text-cyan",
  3: "bg-cyan/10 text-cyan",
  4: "bg-emerald/10 text-emerald",
  5: "bg-emerald/10 text-emerald",
  6: "bg-amber/10 text-amber",
  7: "bg-amber/10 text-amber",
  8: "bg-violet/10 text-violet",
  9: "bg-violet/10 text-violet",
  10: "bg-amber/10 text-amber",
};

export default function BoardPage() {
  const [applicants, setApplicants] = useState<BoardApplicant[]>([]);
  const [stageCounts, setStageCounts] = useState<Record<number, number>>({});
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [activeStage, setActiveStage] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [highlightName, setHighlightName] = useState("");

  useEffect(() => {
    AOS.init({ duration: 800, easing: "ease-out-cubic", once: true, offset: 60 });
  }, []);

  const fetchBoard = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (activeStage !== null) params.set("stage", String(activeStage));
      if (search) params.set("search", search);

      const res = await fetch(`/api/board?${params}`);
      const data = await res.json();
      setApplicants(data.applicants || []);
      setStageCounts(data.stageCounts || {});
      setTotal(data.total || 0);

      // Highlight searched name
      if (search && data.applicants?.length > 0) {
        setHighlightName(search.toLowerCase());
      } else {
        setHighlightName("");
      }
    } finally {
      setIsLoading(false);
    }
  }, [activeStage, search]);

  useEffect(() => {
    fetchBoard();
  }, [fetchBoard]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchInput]);

  // Fetch total counts (no filters) on mount
  const [totalCounts, setTotalCounts] = useState<Record<number, number>>({});
  useEffect(() => {
    fetch("/api/board")
      .then((r) => r.json())
      .then((d) => {
        setTotalCounts(d.stageCounts || {});
      });
  }, []);

  // Group applicants by stage for display
  const groupedByStage: Record<number, BoardApplicant[]> = {};
  for (const app of applicants) {
    if (!groupedByStage[app.stage]) groupedByStage[app.stage] = [];
    groupedByStage[app.stage].push(app);
  }
  const sortedStages = Object.keys(groupedByStage)
    .map(Number)
    .sort((a, b) => b - a);

  // Available stages for filter
  const availableStages = Object.keys(totalCounts)
    .map(Number)
    .sort((a, b) => a - b);

  return (
    <>
      <Navbar />
      <main id="main-content">
        {/* Hero */}
        <section className="relative min-h-[50svh] flex items-center bg-background bg-scan overflow-hidden">
          <div className="crosshair top-[20%] left-[12%] hidden lg:block" aria-hidden="true" />
          <div className="crosshair bottom-[25%] right-[10%] hidden lg:block" aria-hidden="true" />
          <div className="orb orb-blue w-[300px] h-[300px] top-[5%] right-[10%] hidden lg:block" aria-hidden="true" />
          <div className="orb orb-amber w-[200px] h-[200px] bottom-[10%] left-[5%] hidden lg:block" style={{ animationDelay: "-5s" }} aria-hidden="true" />
          <div className="hex-grid" aria-hidden="true" />

          <div className="relative z-[1] max-w-3xl mx-auto px-5 sm:px-8 pt-28 pb-12 w-full text-center">
            <div data-aos="fade-up">
              <span className="inline-flex items-center gap-2 text-xs font-medium text-blue tracking-[0.15em] uppercase mb-6">
                <span className="w-1.5 h-1.5 rounded-full bg-blue animate-pulse" aria-hidden="true" />
                Community Board
              </span>
            </div>
            <h1 data-aos="fade-up" data-aos-delay="100" className="text-4xl sm:text-5xl lg:text-[3.5rem] font-bold tracking-tight leading-[1.08] text-foreground">
              Check your <span className="text-blue">status</span>
            </h1>
            <p data-aos="fade-up" data-aos-delay="200" className="mt-5 text-base sm:text-lg text-muted leading-relaxed max-w-xl mx-auto">
              Search your name to see if you&apos;ve been accepted and which stage you&apos;re in. Updated as decisions are made.
            </p>

            {/* Search bar */}
            <div data-aos="fade-up" data-aos-delay="300" className="mt-8 max-w-lg mx-auto">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted" />
                <input
                  type="text"
                  placeholder="Search your name..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  className="w-full h-14 rounded-2xl border-2 border-border bg-white pl-12 pr-6 text-base text-foreground placeholder:text-muted/50 transition-all focus:outline-none focus:border-blue focus:ring-4 focus:ring-blue/10 shadow-lg"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Stats + Board */}
        <section className="relative py-12 sm:py-20 bg-background bg-scan overflow-hidden">
          <div className="hex-grid" aria-hidden="true" />

          <div className="relative z-[1] max-w-6xl mx-auto px-5 sm:px-8">
            {/* Stage filter pills */}
            {availableStages.length > 0 && (
              <div data-aos="fade-up" className="flex flex-wrap gap-2 mb-8 justify-center">
                <button
                  onClick={() => setActiveStage(null)}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition-all cursor-pointer ${
                    activeStage === null
                      ? "bg-blue text-white shadow-lg shadow-blue/20"
                      : "bg-white border border-border text-muted hover:text-foreground hover:border-blue/20"
                  }`}
                >
                  All Stages ({Object.values(totalCounts).reduce((a, b) => a + b, 0)})
                </button>
                {availableStages.map((s) => (
                  <button
                    key={s}
                    onClick={() => setActiveStage(s)}
                    className={`px-4 py-2 rounded-xl text-sm font-medium transition-all cursor-pointer ${
                      activeStage === s
                        ? "bg-blue text-white shadow-lg shadow-blue/20"
                        : "bg-white border border-border text-muted hover:text-foreground hover:border-blue/20"
                    }`}
                  >
                    {s === 10 ? "Finalists" : `Stage ${s}`} ({totalCounts[s] || 0})
                  </button>
                ))}
              </div>
            )}

            {/* Results count */}
            <div className="flex items-center justify-between mb-6">
              <p className="text-sm text-muted">
                {search ? (
                  <>
                    {total} result{total !== 1 ? "s" : ""} for &quot;<span className="text-foreground font-medium">{search}</span>&quot;
                  </>
                ) : (
                  <>{total} accepted applicant{total !== 1 ? "s" : ""}</>
                )}
              </p>
            </div>

            {/* Loading */}
            {isLoading ? (
              <div className="text-center py-20">
                <div className="w-8 h-8 border-2 border-blue/20 border-t-blue rounded-full animate-spin mx-auto mb-3" />
                <p className="text-sm text-muted">Loading board...</p>
              </div>
            ) : applicants.length === 0 ? (
              <div className="text-center py-20">
                <Shield className="w-12 h-12 text-muted/20 mx-auto mb-4" />
                {search ? (
                  <>
                    <p className="text-lg font-semibold text-foreground mb-2">Name not found</p>
                    <p className="text-sm text-muted max-w-md mx-auto">
                      &quot;{search}&quot; is not on the board yet. Applications are reviewed on a rolling basis — check back later, or make sure you&apos;ve spelled your name correctly.
                    </p>
                  </>
                ) : (
                  <>
                    <p className="text-lg font-semibold text-foreground mb-2">No accepted applicants yet</p>
                    <p className="text-sm text-muted">The board will be updated as applications are reviewed.</p>
                  </>
                )}
              </div>
            ) : (
              <div className="space-y-8">
                {sortedStages.map((stageNum) => (
                  <div key={stageNum} data-aos="fade-up">
                    {/* Stage header */}
                    <div className="flex items-center gap-3 mb-4">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${BADGE_COLORS[stageNum] || "bg-blue/10 text-blue"}`}>
                        {stageNum === 10 ? (
                          <Trophy className="w-4 h-4" />
                        ) : stageNum >= 5 ? (
                          <Star className="w-4 h-4" />
                        ) : (
                          <Shield className="w-4 h-4" />
                        )}
                      </div>
                      <div>
                        <h2 className="text-base font-bold text-foreground">
                          {STAGE_LABELS[stageNum] || `Stage ${stageNum}`}
                        </h2>
                        <p className="text-xs text-muted">
                          {groupedByStage[stageNum].length} participant{groupedByStage[stageNum].length !== 1 ? "s" : ""}
                        </p>
                      </div>
                    </div>

                    {/* Applicant cards */}
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {groupedByStage[stageNum].map((app, i) => {
                        const isHighlighted = highlightName && app.fullName.toLowerCase().includes(highlightName);
                        return (
                          <div
                            key={`${app.fullName}-${i}`}
                            className={`flex items-center gap-3 p-4 rounded-xl border transition-all ${
                              isHighlighted
                                ? "border-blue bg-blue/5 shadow-lg shadow-blue/10 ring-2 ring-blue/20"
                                : `${STAGE_COLORS[stageNum] || "border-border bg-white"}`
                            }`}
                          >
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${
                              isHighlighted ? "bg-blue text-white" : "bg-border-light text-muted"
                            }`}>
                              {app.fullName.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className={`text-sm font-semibold truncate ${isHighlighted ? "text-blue" : "text-foreground"}`}>
                                {app.fullName}
                              </p>
                              <div className="flex items-center gap-2 mt-0.5">
                                <Globe className="w-3 h-3 text-muted shrink-0" />
                                <span className="text-xs text-muted truncate">{app.country}</span>
                                <span className="text-xs text-muted">·</span>
                                <span className="text-xs text-muted truncate">{app.trackInterest}</span>
                              </div>
                            </div>
                            {stageNum === 10 && (
                              <Trophy className="w-4 h-4 text-amber shrink-0" />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Info box */}
            <div data-aos="fade-up" className="mt-16 glass-card glass-shine rounded-2xl p-8 text-center max-w-2xl mx-auto">
              <h3 className="text-lg font-bold text-foreground mb-3">How does this work?</h3>
              <div className="grid sm:grid-cols-3 gap-6 text-left">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-blue/10 flex items-center justify-center shrink-0 mt-0.5">
                    <Users className="w-4 h-4 text-blue" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">Apply</p>
                    <p className="text-xs text-muted mt-1">Submit your application and wait for review.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald/10 flex items-center justify-center shrink-0 mt-0.5">
                    <ChevronRight className="w-4 h-4 text-emerald" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">Progress</p>
                    <p className="text-xs text-muted mt-1">Advance through 10 stages based on performance.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-amber/10 flex items-center justify-center shrink-0 mt-0.5">
                    <Trophy className="w-4 h-4 text-amber" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">Achieve</p>
                    <p className="text-xs text-muted mt-1">Reach Stage 5 for alumni access. Finalists get mentorship, hardware, and priority hiring.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
