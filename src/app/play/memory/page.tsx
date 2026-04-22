"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { Navbar } from "@/components/landing/navbar";
import { Footer } from "@/components/landing/footer";
import { ArrowLeft } from "lucide-react";

// ── Card pairs: term ↔ meaning ────────────────────────────────

interface CardPair {
  term: string;
  meaning: string;
}

const ALL_PAIRS: CardPair[] = [
  { term: "Phishing", meaning: "Fake emails to steal credentials" },
  { term: "Firewall", meaning: "Filters network traffic" },
  { term: "Ransomware", meaning: "Encrypts files for payment" },
  { term: "VPN", meaning: "Encrypted tunnel for privacy" },
  { term: "Zero-day", meaning: "Unknown vulnerability" },
  { term: "Rootkit", meaning: "Hides malicious processes" },
  { term: "DDoS", meaning: "Floods server with traffic" },
  { term: "Trojan", meaning: "Malware disguised as software" },
  { term: "Honeypot", meaning: "Trap system to lure attackers" },
  { term: "Keylogger", meaning: "Records keystrokes secretly" },
  { term: "Botnet", meaning: "Network of hijacked devices" },
  { term: "SQL Injection", meaning: "Exploits database queries" },
  { term: "MFA", meaning: "Multiple login verifications" },
  { term: "SIEM", meaning: "Aggregates security logs" },
  { term: "Brute Force", meaning: "Tries all possible passwords" },
  { term: "XSS", meaning: "Injects scripts into web pages" },
];

interface Card {
  id: number;
  content: string;
  pairId: number;
  type: "term" | "meaning";
}

function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

type GridSize = 8 | 12 | 16;

const GRID_CONFIG: Record<GridSize, { pairs: number; cols: string; label: string }> = {
  8:  { pairs: 4,  cols: "grid-cols-4", label: "4 pairs" },
  12: { pairs: 6,  cols: "grid-cols-4", label: "6 pairs" },
  16: { pairs: 8,  cols: "grid-cols-4", label: "8 pairs" },
};

export default function MemoryPage() {
  const [gridSize, setGridSize] = useState<GridSize>(12);
  const [cards, setCards] = useState<Card[]>([]);
  const [flipped, setFlipped] = useState<Set<number>>(new Set());
  const [matched, setMatched] = useState<Set<number>>(new Set());
  const [selecting, setSelecting] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);
  const [timer, setTimer] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [won, setWon] = useState(false);
  const [mounted, setMounted] = useState(false);
  const lockRef = useRef(false);

  const startGame = useCallback((size: GridSize) => {
    const config = GRID_CONFIG[size];
    const chosen = shuffleArray(ALL_PAIRS).slice(0, config.pairs);
    const cardList: Card[] = [];
    chosen.forEach((pair, idx) => {
      cardList.push({ id: idx * 2, content: pair.term, pairId: idx, type: "term" });
      cardList.push({ id: idx * 2 + 1, content: pair.meaning, pairId: idx, type: "meaning" });
    });
    setCards(shuffleArray(cardList));
    setFlipped(new Set());
    setMatched(new Set());
    setSelecting([]);
    setMoves(0);
    setTimer(0);
    setIsRunning(true);
    setWon(false);
    setGridSize(size);
    lockRef.current = false;
  }, []);

  useEffect(() => {
    startGame(12);
    setMounted(true);
  }, [startGame]);

  // Timer
  useEffect(() => {
    if (!isRunning) return;
    const id = setInterval(() => setTimer((t) => t + 1), 1000);
    return () => clearInterval(id);
  }, [isRunning]);

  // Check win
  useEffect(() => {
    if (cards.length > 0 && matched.size === cards.length) {
      setWon(true);
      setIsRunning(false);
    }
  }, [matched, cards]);

  function handleCardClick(cardId: number) {
    if (lockRef.current || won) return;
    if (flipped.has(cardId) || matched.has(cardId)) return;

    const newFlipped = new Set(flipped);
    newFlipped.add(cardId);
    setFlipped(newFlipped);

    const newSelecting = [...selecting, cardId];
    setSelecting(newSelecting);

    if (newSelecting.length === 2) {
      setMoves((m) => m + 1);
      lockRef.current = true;

      const [first, second] = newSelecting;
      const cardA = cards.find((c) => c.id === first);
      const cardB = cards.find((c) => c.id === second);
      if (!cardA || !cardB) {
        setSelecting([]);
        lockRef.current = false;
        return;
      }

      if (cardA.pairId === cardB.pairId && cardA.type !== cardB.type) {
        // Match!
        setTimeout(() => {
          setMatched((prev) => {
            const n = new Set(prev);
            n.add(first);
            n.add(second);
            return n;
          });
          setSelecting([]);
          lockRef.current = false;
        }, 600);
      } else {
        // No match — flip back
        setTimeout(() => {
          setFlipped((prev) => {
            const n = new Set(prev);
            n.delete(first);
            n.delete(second);
            return n;
          });
          setSelecting([]);
          lockRef.current = false;
        }, 1000);
      }
    }
  }

  const formatTime = (s: number) =>
    `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

  if (!mounted) {
    return (
      <>
        <Navbar />
        <main className="min-h-screen bg-background bg-scan flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-blue border-t-transparent rounded-full animate-spin" />
        </main>
        <Footer />
      </>
    );
  }

  const config = GRID_CONFIG[gridSize];

  return (
    <>
      <Navbar />
      <main className="relative min-h-screen bg-background bg-scan overflow-hidden">
        <div className="orb orb-cyan w-[280px] h-[280px] top-[5%] right-[10%] hidden lg:block" aria-hidden="true" />
        <div className="orb orb-blue w-[180px] h-[180px] bottom-[10%] left-[5%] hidden lg:block" style={{ animationDelay: "-5s" }} aria-hidden="true" />
        <div className="hex-grid" aria-hidden="true" />

        <div className="relative z-[1] max-w-lg mx-auto px-4 pt-24 pb-8 flex flex-col min-h-screen">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <Link href="/play" className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-foreground transition-colors">
              <ArrowLeft className="w-4 h-4" /> Games
            </Link>
            <h1 className="text-xl font-bold text-foreground">🧠 Threat Match</h1>
            <span className="text-sm font-mono text-muted">{formatTime(timer)}</span>
          </div>

          {/* Size selector */}
          <div className="flex justify-center gap-2 mb-4">
            {([8, 12, 16] as GridSize[]).map((s) => (
              <button
                key={s}
                onClick={() => startGame(s)}
                className={`text-xs font-semibold px-4 py-2 rounded-full transition-colors cursor-pointer ${
                  gridSize === s
                    ? "bg-cyan-500 text-white"
                    : "bg-gray-100 text-muted hover:bg-gray-200"
                }`}
              >
                {GRID_CONFIG[s].label}
              </button>
            ))}
          </div>

          {/* Stats bar */}
          <div className="flex justify-center gap-6 mb-5 text-center">
            <div>
              <p className="text-lg font-bold text-foreground">{moves}</p>
              <p className="text-[10px] text-muted uppercase tracking-wider">Moves</p>
            </div>
            <div>
              <p className="text-lg font-bold text-foreground">{matched.size / 2}/{config.pairs}</p>
              <p className="text-[10px] text-muted uppercase tracking-wider">Matched</p>
            </div>
          </div>

          {/* Win */}
          {won && (
            <div className="text-center mb-5 glass-card rounded-xl p-5">
              <p className="text-lg font-bold text-foreground mb-1">🎉 All matched!</p>
              <p className="text-sm text-muted">
                {moves} moves in {formatTime(timer)}
              </p>
              <button
                onClick={() => startGame(gridSize)}
                className="mt-3 text-xs font-semibold text-white bg-cyan-500 px-5 py-2 rounded-full hover:bg-cyan-600 transition-colors cursor-pointer"
              >
                Play again
              </button>
            </div>
          )}

          {/* Card grid */}
          <div className={`grid ${config.cols} gap-2.5 sm:gap-3 mb-6`}>
            {cards.map((card) => {
              const isFlipped = flipped.has(card.id) || matched.has(card.id);
              const isMatched = matched.has(card.id);

              return (
                <button
                  key={card.id}
                  onClick={() => handleCardClick(card.id)}
                  className={`relative rounded-xl transition-all duration-300 cursor-pointer select-none ${
                    isMatched
                      ? "bg-green-50 border-2 border-green-300 opacity-70"
                      : isFlipped
                        ? "bg-white border-2 border-cyan-300 shadow-md"
                        : "bg-gradient-to-br from-cyan-500 to-blue-600 border-2 border-cyan-400 hover:scale-[1.03] active:scale-95"
                  }`}
                  style={{ aspectRatio: "1" }}
                  disabled={won}
                >
                  {isFlipped ? (
                    <div className="absolute inset-0 flex flex-col items-center justify-center p-2">
                      <span className={`text-center leading-tight font-medium ${
                        card.type === "term"
                          ? "text-[11px] sm:text-[13px] text-foreground"
                          : "text-[9px] sm:text-[11px] text-muted"
                      }`}>
                        {card.content}
                      </span>
                      <span className={`text-[8px] mt-1 font-medium uppercase tracking-wider ${
                        card.type === "term" ? "text-cyan-500" : "text-amber-500"
                      }`}>
                        {card.type === "term" ? "TERM" : "DEF"}
                      </span>
                    </div>
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-white text-xl font-bold">🔒</span>
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {/* Hint */}
          <p className="text-center text-[11px] text-muted mb-6">
            Match each cybersecurity <strong className="text-cyan-500">term</strong> with its <strong className="text-amber-500">definition</strong>
          </p>

          <div className="mt-auto text-center py-3 border-t border-border/30">
            <Link href="/play" className="text-[11px] text-muted hover:text-foreground transition-colors">
              ← Back to all games
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
