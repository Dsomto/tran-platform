"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { Navbar } from "@/components/landing/navbar";
import { Footer } from "@/components/landing/footer";
import { getDailyWord, WORDS } from "@/lib/words";
import { ArrowRight } from "lucide-react";

// ── Constants ─────────────────────────────────────────────────

const MAX_GUESSES = 6;

const KEYBOARD_ROWS = [
  ["Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P"],
  ["A", "S", "D", "F", "G", "H", "J", "K", "L"],
  ["ENTER", "Z", "X", "C", "V", "B", "N", "M", "⌫"],
];

// ── Types ─────────────────────────────────────────────────────

type LetterStatus = "correct" | "present" | "absent";
type GameStatus = "playing" | "won" | "lost";

interface Stats {
  played: number;
  won: number;
  streak: number;
  maxStreak: number;
  distribution: number[];
}

// ── Helpers ───────────────────────────────────────────────────

function getToday(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function evaluateGuess(guess: string, solution: string): LetterStatus[] {
  const result: LetterStatus[] = Array(guess.length).fill("absent");
  const remaining: (string | null)[] = solution.split("");

  // Pass 1 — exact matches
  for (let i = 0; i < guess.length; i++) {
    if (guess[i] === remaining[i]) {
      result[i] = "correct";
      remaining[i] = null;
    }
  }
  // Pass 2 — misplaced
  for (let i = 0; i < guess.length; i++) {
    if (result[i] === "correct") continue;
    const j = remaining.indexOf(guess[i]);
    if (j !== -1) {
      result[i] = "present";
      remaining[j] = null;
    }
  }
  return result;
}

function getTimeUntilMidnight(): string {
  const now = new Date();
  const midnight = new Date(now);
  midnight.setHours(24, 0, 0, 0);
  const diff = midnight.getTime() - now.getTime();
  const h = String(Math.floor(diff / 3_600_000)).padStart(2, "0");
  const m = String(Math.floor((diff % 3_600_000) / 60_000)).padStart(2, "0");
  const s = String(Math.floor((diff % 60_000) / 1_000)).padStart(2, "0");
  return `${h}:${m}:${s}`;
}

const WIN_MESSAGES = ["Genius!", "Magnificent!", "Impressive!", "Splendid!", "Great!", "Phew!"];

// ── Component ─────────────────────────────────────────────────

export default function PlayPage() {
  const [solution, setSolution] = useState("");
  const [dayNum, setDayNum] = useState(0);
  const [guesses, setGuesses] = useState<string[]>([]);
  const [currentGuess, setCurrentGuess] = useState("");
  const [gameStatus, setGameStatus] = useState<GameStatus>("playing");

  // Reveal animation: which row is revealing, how many tiles revealed
  const [revealingRow, setRevealingRow] = useState(-1);
  const [revealProgress, setRevealProgress] = useState(0);

  const [shake, setShake] = useState(false);
  const [bounceRow, setBounceRow] = useState(-1);
  const [toast, setToast] = useState("");
  const [countdown, setCountdown] = useState("");
  const [showStats, setShowStats] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [stats, setStats] = useState<Stats>({
    played: 0,
    won: 0,
    streak: 0,
    maxStreak: 0,
    distribution: [0, 0, 0, 0, 0, 0],
  });
  const [mounted, setMounted] = useState(false);
  const [validWords, setValidWords] = useState<Set<string> | null>(null);

  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  // ── Init ──────────────────────────────────────────────────

  useEffect(() => {
    const { word, index } = getDailyWord();
    setSolution(word);
    setDayNum(index);

    const today = getToday();
    try {
      const saved = localStorage.getItem(`cyberwordle-${today}`);
      if (saved) {
        const s = JSON.parse(saved);
        setGuesses(s.guesses || []);
        setGameStatus(s.gameStatus || "playing");
      }
      const savedStats = localStorage.getItem("cyberwordle-stats");
      if (savedStats) setStats(JSON.parse(savedStats));
    } catch { /* ignore corrupt storage */ }

    // Load dictionary for guess validation
    fetch("/dictionary.txt")
      .then((r) => r.text())
      .then((text) => {
        const dict = new Set(text.split("\n").map((w) => w.trim().toUpperCase()).filter(Boolean));
        // Always include all cybersecurity solution words
        WORDS.forEach((w) => dict.add(w.toUpperCase()));
        setValidWords(dict);
      })
      .catch(() => {
        // If dictionary fails to load, still include cyber terms
        setValidWords(new Set(WORDS.map((w) => w.toUpperCase())));
      });

    setMounted(true);

    return () => timersRef.current.forEach(clearTimeout);
  }, []);

  // ── Persist state ─────────────────────────────────────────

  useEffect(() => {
    if (!mounted || !solution) return;
    const today = getToday();
    localStorage.setItem(
      `cyberwordle-${today}`,
      JSON.stringify({ guesses, gameStatus })
    );
  }, [guesses, gameStatus, mounted, solution]);

  // ── Countdown ─────────────────────────────────────────────

  useEffect(() => {
    if (gameStatus === "playing") return;
    const tick = () => setCountdown(getTimeUntilMidnight());
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [gameStatus]);

  // ── Toast ─────────────────────────────────────────────────

  const showToast = useCallback((msg: string, ms = 1500) => {
    setToast(msg);
    const id = setTimeout(() => setToast(""), ms);
    timersRef.current.push(id);
  }, []);

  // ── Stats update ──────────────────────────────────────────

  const updateStats = useCallback(
    (won: boolean, numGuesses: number) => {
      setStats((prev) => {
        const next: Stats = {
          played: prev.played + 1,
          won: prev.won + (won ? 1 : 0),
          streak: won ? prev.streak + 1 : 0,
          maxStreak: won
            ? Math.max(prev.maxStreak, prev.streak + 1)
            : prev.maxStreak,
          distribution: [...prev.distribution],
        };
        if (won) next.distribution[numGuesses - 1]++;
        localStorage.setItem("cyberwordle-stats", JSON.stringify(next));
        return next;
      });
    },
    []
  );

  // ── Submit guess ──────────────────────────────────────────

  const submitGuess = useCallback(() => {
    if (!solution || revealingRow >= 0) return;

    if (currentGuess.length !== solution.length) {
      setShake(true);
      showToast(`Must be ${solution.length} letters`);
      const sid = setTimeout(() => setShake(false), 600);
      timersRef.current.push(sid);
      return;
    }

    const guess = currentGuess.toUpperCase();

    // Validate against dictionary
    if (validWords && !validWords.has(guess)) {
      setShake(true);
      showToast("Not in word list");
      const sid = setTimeout(() => setShake(false), 600);
      timersRef.current.push(sid);
      return;
    }
    const newGuesses = [...guesses, guess];
    const rowIdx = guesses.length;

    // Commit guess & start reveal
    setGuesses(newGuesses);
    setCurrentGuess("");
    setRevealingRow(rowIdx);
    setRevealProgress(0);

    const len = solution.length;

    // Stagger tile reveals
    for (let i = 1; i <= len; i++) {
      const id = setTimeout(() => setRevealProgress(i), i * 250);
      timersRef.current.push(id);
    }

    // After full reveal
    const doneId = setTimeout(() => {
      setRevealingRow(-1);
      setRevealProgress(0);

      if (guess === solution) {
        setBounceRow(rowIdx);
        setGameStatus("won");
        showToast(WIN_MESSAGES[Math.min(newGuesses.length - 1, 5)], 3000);
        updateStats(true, newGuesses.length);
        const winId = setTimeout(() => {
          setBounceRow(-1);
          setShowStats(true);
        }, 2000);
        timersRef.current.push(winId);
      } else if (newGuesses.length >= MAX_GUESSES) {
        setGameStatus("lost");
        showToast(solution, 5000);
        updateStats(false, newGuesses.length);
        const loseId = setTimeout(() => setShowStats(true), 2500);
        timersRef.current.push(loseId);
      }
    }, len * 250 + 350);
    timersRef.current.push(doneId);
  }, [solution, currentGuess, guesses, revealingRow, showToast, updateStats, validWords]);

  // ── Key handler ───────────────────────────────────────────

  const handleKey = useCallback(
    (key: string) => {
      if (gameStatus !== "playing" || revealingRow >= 0) return;

      if (key === "ENTER") {
        submitGuess();
        return;
      }
      if (key === "BACKSPACE" || key === "⌫") {
        setCurrentGuess((p) => p.slice(0, -1));
        return;
      }
      if (/^[A-Z]$/.test(key) && currentGuess.length < (solution?.length || 9)) {
        setCurrentGuess((p) => p + key);
      }
    },
    [gameStatus, revealingRow, currentGuess, solution, submitGuess]
  );

  // Physical keyboard
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      if (e.key === "Enter") handleKey("ENTER");
      else if (e.key === "Backspace") handleKey("BACKSPACE");
      else if (/^[a-zA-Z]$/.test(e.key)) handleKey(e.key.toUpperCase());
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [handleKey]);

  // ── Share ─────────────────────────────────────────────────

  function shareResults() {
    const today = getToday();
    const rows = guesses.map((g) =>
      evaluateGuess(g, solution)
        .map((s) => (s === "correct" ? "🟩" : s === "present" ? "🟨" : "⬛"))
        .join("")
    );
    const text = `🔐 CyberWordle #${dayNum} ${gameStatus === "won" ? guesses.length : "X"}/${MAX_GUESSES}\n\n${rows.join("\n")}\n\nPlay at ubinitiative.org/play`;
    navigator.clipboard.writeText(text);
    showToast("Copied to clipboard!");
  }

  // ── Key statuses for keyboard coloring ────────────────────

  const keyStatuses = new Map<string, LetterStatus>();
  // Only color keys for fully-revealed rows
  const revealedGuesses = revealingRow >= 0 ? guesses.slice(0, revealingRow) : guesses;
  revealedGuesses.forEach((guess) => {
    const statuses = evaluateGuess(guess, solution);
    guess.split("").forEach((letter, i) => {
      const cur = keyStatuses.get(letter);
      const next = statuses[i];
      if (!cur || next === "correct" || (next === "present" && cur !== "correct")) {
        keyStatuses.set(letter, next);
      }
    });
  });

  // ── Loading state ─────────────────────────────────────────

  if (!mounted || !solution) {
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

  const wordLength = solution.length;

  // ── Tile sizing based on word length ──────────────────────

  const tileSize =
    wordLength <= 5
      ? "w-[56px] h-[56px] sm:w-[62px] sm:h-[62px] text-xl"
      : wordLength <= 6
        ? "w-[48px] h-[48px] sm:w-[56px] sm:h-[56px] text-xl"
        : wordLength <= 7
          ? "w-[42px] h-[42px] sm:w-[50px] sm:h-[50px] text-lg"
          : wordLength <= 8
            ? "w-[38px] h-[38px] sm:w-[44px] sm:h-[44px] text-base"
            : "w-[34px] h-[34px] sm:w-[40px] sm:h-[40px] text-sm";

  // ── Render ────────────────────────────────────────────────

  return (
    <>
      <Navbar />
      <main className="relative min-h-screen bg-background bg-scan overflow-hidden">
        {/* Decorative */}
        <div className="orb orb-blue w-[300px] h-[300px] top-[5%] right-[10%] hidden lg:block" aria-hidden="true" />
        <div className="orb orb-cyan w-[180px] h-[180px] bottom-[10%] left-[5%] hidden lg:block" style={{ animationDelay: "-5s" }} aria-hidden="true" />
        <div className="crosshair top-[15%] left-[10%] hidden lg:block" aria-hidden="true" />
        <div className="crosshair bottom-[20%] right-[12%] hidden lg:block" aria-hidden="true" />
        <div className="hex-grid" aria-hidden="true" />

        <div className="relative z-[1] max-w-lg mx-auto px-4 pt-24 pb-4 flex flex-col min-h-screen">
          {/* ── Header ── */}
          <div className="text-center mb-4">
            <div className="flex items-center justify-center gap-3 mb-1">
              <button
                onClick={() => setShowHelp(true)}
                className="w-8 h-8 rounded-full border border-border flex items-center justify-center text-muted hover:text-foreground hover:border-foreground/30 transition-colors cursor-pointer text-sm font-bold"
                aria-label="How to play"
              >
                ?
              </button>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
                🔐 CyberWordle
              </h1>
              <button
                onClick={() => setShowStats(true)}
                className="w-8 h-8 rounded-full border border-border flex items-center justify-center text-muted hover:text-foreground hover:border-foreground/30 transition-colors cursor-pointer"
                aria-label="Statistics"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </button>
            </div>
            <p className="text-[13px] text-muted">
              Guess the cybersecurity term — <strong className="text-foreground">{wordLength} letters</strong> today
            </p>
          </div>

          {/* ── Toast ── */}
          <div className="relative h-0">
            {toast && (
              <div className="absolute left-1/2 -translate-x-1/2 -top-1 z-50 bg-foreground text-background text-sm font-semibold px-5 py-2.5 rounded-xl shadow-lg whitespace-nowrap cyberwordle-toast">
                {toast}
              </div>
            )}
          </div>

          {/* ── Grid ── */}
          <div className="flex-1 flex flex-col items-center justify-center py-4">
            <div className="flex flex-col gap-[6px]">
              {Array.from({ length: MAX_GUESSES }).map((_, rowIdx) => {
                const isInputRow = rowIdx === guesses.length && gameStatus === "playing";
                const isRevRow = rowIdx === revealingRow;
                const isGuessed = rowIdx < guesses.length;
                const isBouncing = rowIdx === bounceRow;

                // Determine what letters to show
                let rowLetters = "";
                if (isInputRow) rowLetters = currentGuess;
                else if (isGuessed) rowLetters = guesses[rowIdx];

                const statuses = isGuessed ? evaluateGuess(guesses[rowIdx], solution) : [];

                return (
                  <div
                    key={rowIdx}
                    className={`flex gap-[6px] ${isInputRow && shake ? "cyberwordle-shake" : ""} ${isBouncing ? "cyberwordle-bounce" : ""}`}
                  >
                    {Array.from({ length: wordLength }).map((_, colIdx) => {
                      const letter = rowLetters[colIdx] || "";
                      const hasLetter = !!letter;

                      // Determine tile background
                      let bg = "bg-white border-2 border-gray-200";
                      let textColor = "text-foreground";

                      if (isGuessed && !isRevRow) {
                        // Fully revealed row
                        const st = statuses[colIdx];
                        if (st === "correct") {
                          bg = "bg-green-500 border-2 border-green-500";
                          textColor = "text-white";
                        } else if (st === "present") {
                          bg = "bg-amber-500 border-2 border-amber-500";
                          textColor = "text-white";
                        } else {
                          bg = "bg-gray-400 border-2 border-gray-400";
                          textColor = "text-white";
                        }
                      } else if (isRevRow) {
                        // Currently revealing
                        if (colIdx < revealProgress) {
                          const st = statuses[colIdx];
                          if (st === "correct") {
                            bg = "bg-green-500 border-2 border-green-500";
                            textColor = "text-white";
                          } else if (st === "present") {
                            bg = "bg-amber-500 border-2 border-amber-500";
                            textColor = "text-white";
                          } else {
                            bg = "bg-gray-400 border-2 border-gray-400";
                            textColor = "text-white";
                          }
                        } else {
                          bg = hasLetter
                            ? "bg-white border-2 border-gray-400"
                            : "bg-white border-2 border-gray-200";
                        }
                      } else if (hasLetter) {
                        bg = "bg-white border-2 border-gray-400";
                      }

                      // Pop animation when tile gets revealed or typed
                      const justRevealed = isRevRow && colIdx === revealProgress - 1;
                      const justTyped = isInputRow && colIdx === currentGuess.length - 1;

                      return (
                        <div
                          key={colIdx}
                          className={`${tileSize} ${bg} ${textColor} rounded-lg flex items-center justify-center font-bold select-none transition-all duration-300 ${justRevealed ? "cyberwordle-pop" : ""} ${justTyped ? "cyberwordle-type" : ""}`}
                        >
                          {letter}
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </div>

          {/* ── Game over bar ── */}
          {gameStatus !== "playing" && (
            <div className="text-center mb-3">
              <div className="glass-card rounded-xl p-4 inline-flex flex-col items-center gap-2">
                {gameStatus === "won" ? (
                  <p className="text-sm font-medium text-foreground">
                    Solved in {guesses.length} {guesses.length === 1 ? "guess" : "guesses"} 🎉
                  </p>
                ) : (
                  <p className="text-sm font-medium text-foreground">
                    The word was <strong className="text-blue">{solution}</strong>
                  </p>
                )}
                <p className="text-xs text-muted">Next word in {countdown}</p>
                <div className="flex gap-2 mt-1">
                  <button
                    onClick={shareResults}
                    className="text-xs font-semibold text-white bg-green-500 px-4 py-2 rounded-full hover:bg-green-600 transition-colors cursor-pointer"
                  >
                    Share 📋
                  </button>
                  <button
                    onClick={() => setShowStats(true)}
                    className="text-xs font-medium text-foreground border border-border px-4 py-2 rounded-full hover:bg-surface-hover transition-colors cursor-pointer"
                  >
                    Stats
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ── Keyboard ── */}
          <div className="mt-auto pb-3 space-y-[6px]">
            {KEYBOARD_ROWS.map((row, ri) => (
              <div key={ri} className="flex justify-center gap-[5px]">
                {row.map((key) => {
                  const st = keyStatuses.get(key);
                  const isWide = key === "ENTER" || key === "⌫";

                  let keyBg = "bg-gray-200 text-foreground hover:bg-gray-300 active:bg-gray-400";
                  if (st === "correct") keyBg = "bg-green-500 text-white hover:bg-green-600";
                  else if (st === "present") keyBg = "bg-amber-500 text-white hover:bg-amber-600";
                  else if (st === "absent") keyBg = "bg-gray-400 text-white hover:bg-gray-500";

                  return (
                    <button
                      key={key}
                      onClick={() => handleKey(key === "⌫" ? "BACKSPACE" : key)}
                      className={`${
                        isWide ? "px-3 sm:px-4 text-[11px] sm:text-xs" : "w-[30px] sm:w-[36px] text-sm sm:text-base"
                      } h-[50px] sm:h-[56px] rounded-lg font-semibold ${keyBg} transition-colors select-none cursor-pointer active:scale-95`}
                    >
                      {key}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>

          {/* ── UBI branding ── */}
          <div className="text-center py-3 border-t border-border/30">
            <Link href="/" className="text-[11px] text-muted hover:text-foreground transition-colors">
              Built by <strong>UBI</strong> — Ubuntu Bridge Initiative
            </Link>
          </div>
        </div>

        {/* ── Stats Modal ── */}
        {showStats && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4" onClick={() => setShowStats(false)}>
            <div className="glass-card-elevated rounded-2xl p-8 max-w-sm w-full" onClick={(e) => e.stopPropagation()}>
              <h2 className="text-lg font-bold text-foreground text-center mb-6">Statistics</h2>

              <div className="grid grid-cols-4 gap-4 text-center mb-8">
                {([
                  [stats.played, "Played"],
                  [stats.played ? Math.round((stats.won / stats.played) * 100) : 0, "Win %"],
                  [stats.streak, "Streak"],
                  [stats.maxStreak, "Best"],
                ] as const).map(([val, label]) => (
                  <div key={label}>
                    <p className="text-3xl font-bold text-foreground">{val}</p>
                    <p className="text-[11px] text-muted mt-0.5">{label}</p>
                  </div>
                ))}
              </div>

              <h3 className="text-sm font-semibold text-foreground mb-3">Guess Distribution</h3>
              <div className="space-y-1.5 mb-6">
                {stats.distribution.map((count, i) => {
                  const max = Math.max(...stats.distribution, 1);
                  const pct = (count / max) * 100;
                  const isLastGuess = gameStatus === "won" && guesses.length === i + 1;
                  return (
                    <div key={i} className="flex items-center gap-2">
                      <span className="text-xs font-medium text-muted w-3 text-right">{i + 1}</span>
                      <div
                        className={`h-6 rounded flex items-center justify-end px-2 text-[11px] font-bold text-white transition-all ${
                          isLastGuess ? "bg-green-500" : count > 0 ? "bg-gray-400" : "bg-gray-200"
                        }`}
                        style={{ width: `${Math.max(pct, 10)}%` }}
                      >
                        {count}
                      </div>
                    </div>
                  );
                })}
              </div>

              {gameStatus !== "playing" && (
                <button
                  onClick={() => { shareResults(); setShowStats(false); }}
                  className="w-full text-sm font-semibold text-white bg-green-500 py-3 rounded-full hover:bg-green-600 transition-colors cursor-pointer mb-3"
                >
                  Share results 📋
                </button>
              )}

              <button
                onClick={() => setShowStats(false)}
                className="w-full text-sm font-medium text-foreground border border-border py-2.5 rounded-full hover:bg-surface-hover transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        )}

        {/* ── Help Modal ── */}
        {showHelp && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4" onClick={() => setShowHelp(false)}>
            <div className="glass-card-elevated rounded-2xl p-8 max-w-sm w-full" onClick={(e) => e.stopPropagation()}>
              <h2 className="text-lg font-bold text-foreground text-center mb-4">How to Play</h2>

              <div className="space-y-4 text-sm text-muted leading-relaxed">
                <p>Guess the <strong className="text-foreground">cybersecurity term</strong> in {MAX_GUESSES} tries.</p>
                <p>Each guess must be <strong className="text-foreground">{wordLength} letters</strong>. Hit Enter to submit.</p>
                <p>After each guess, the tiles change colour to show how close you are:</p>

                <div className="space-y-3 my-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-green-500 flex items-center justify-center text-white font-bold text-sm">P</div>
                    <span>Correct letter, correct spot</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-amber-500 flex items-center justify-center text-white font-bold text-sm">H</div>
                    <span>Correct letter, wrong spot</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-gray-400 flex items-center justify-center text-white font-bold text-sm">X</div>
                    <span>Not in the word</span>
                  </div>
                </div>

                <p>A new word appears every day at midnight. The word length varies between <strong className="text-foreground">5 and 9 letters</strong>.</p>
              </div>

              <button
                onClick={() => setShowHelp(false)}
                className="mt-6 w-full text-sm font-semibold text-white bg-blue py-3 rounded-full hover:bg-blue-dark transition-colors cursor-pointer"
              >
                Got it!
              </button>
            </div>
          </div>
        )}
      </main>

      {/* ── Game-specific animations ── */}
      <style jsx global>{`
        .cyberwordle-shake {
          animation: cw-shake 0.5s ease;
        }
        @keyframes cw-shake {
          10%, 90% { transform: translateX(-1px); }
          20%, 80% { transform: translateX(2px); }
          30%, 50%, 70% { transform: translateX(-4px); }
          40%, 60% { transform: translateX(4px); }
        }

        .cyberwordle-pop {
          animation: cw-pop 0.3s ease;
        }
        @keyframes cw-pop {
          0% { transform: scale(0.8); opacity: 0.5; }
          50% { transform: scale(1.12); }
          100% { transform: scale(1); opacity: 1; }
        }

        .cyberwordle-type {
          animation: cw-type 0.1s ease;
        }
        @keyframes cw-type {
          0% { transform: scale(1); }
          50% { transform: scale(1.08); }
          100% { transform: scale(1); }
        }

        .cyberwordle-bounce {
          animation: cw-bounce 0.6s ease;
        }
        @keyframes cw-bounce {
          0%, 100% { transform: translateY(0); }
          30% { transform: translateY(-12px); }
          60% { transform: translateY(-4px); }
        }

        .cyberwordle-toast {
          animation: cw-toast-in 0.2s ease;
        }
        @keyframes cw-toast-in {
          from { opacity: 0; transform: translate(-50%, -8px); }
          to { opacity: 1; transform: translate(-50%, 0); }
        }
      `}</style>

      <Footer />
    </>
  );
}
