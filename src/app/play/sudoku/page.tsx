"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Navbar } from "@/components/landing/navbar";
import { Footer } from "@/components/landing/footer";
import { ArrowLeft } from "lucide-react";

// ── Sudoku generator ──────────────────────────────────────────

type Board = number[][];
type Difficulty = "easy" | "medium" | "hard";

const CLUE_COUNTS: Record<Difficulty, number> = { easy: 42, medium: 32, hard: 24 };

function isValid(board: Board, row: number, col: number, num: number): boolean {
  for (let i = 0; i < 9; i++) {
    if (board[row][i] === num || board[i][col] === num) return false;
  }
  const br = Math.floor(row / 3) * 3;
  const bc = Math.floor(col / 3) * 3;
  for (let r = br; r < br + 3; r++) {
    for (let c = bc; c < bc + 3; c++) {
      if (board[r][c] === num) return false;
    }
  }
  return true;
}

function solve(board: Board): boolean {
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      if (board[r][c] === 0) {
        const nums = [1, 2, 3, 4, 5, 6, 7, 8, 9].sort(() => Math.random() - 0.5);
        for (const n of nums) {
          if (isValid(board, r, c, n)) {
            board[r][c] = n;
            if (solve(board)) return true;
            board[r][c] = 0;
          }
        }
        return false;
      }
    }
  }
  return true;
}

function generatePuzzle(difficulty: Difficulty): { puzzle: Board; solution: Board } {
  const board: Board = Array.from({ length: 9 }, () => Array(9).fill(0));
  solve(board);
  const solution = board.map((r) => [...r]);
  const puzzle = board.map((r) => [...r]);

  const cells = Array.from({ length: 81 }, (_, i) => i).sort(() => Math.random() - 0.5);
  let toRemove = 81 - CLUE_COUNTS[difficulty];
  for (const idx of cells) {
    if (toRemove <= 0) break;
    const r = Math.floor(idx / 9);
    const c = idx % 9;
    puzzle[r][c] = 0;
    toRemove--;
  }
  return { puzzle, solution };
}

// ── Component ─────────────────────────────────────────────────

export default function SudokuPage() {
  const [difficulty, setDifficulty] = useState<Difficulty>("easy");
  const [puzzle, setPuzzle] = useState<Board | null>(null);
  const [solution, setSolution] = useState<Board | null>(null);
  const [board, setBoard] = useState<Board | null>(null);
  const [fixed, setFixed] = useState<boolean[][] | null>(null);
  const [selected, setSelected] = useState<[number, number] | null>(null);
  const [errors, setErrors] = useState<Set<string>>(new Set());
  const [won, setWon] = useState(false);
  const [timer, setTimer] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [mounted, setMounted] = useState(false);

  const newGame = useCallback((diff: Difficulty) => {
    const { puzzle: p, solution: s } = generatePuzzle(diff);
    setPuzzle(p);
    setSolution(s);
    setBoard(p.map((r) => [...r]));
    setFixed(p.map((r) => r.map((v) => v !== 0)));
    setSelected(null);
    setErrors(new Set());
    setWon(false);
    setTimer(0);
    setIsRunning(true);
    setDifficulty(diff);
  }, []);

  useEffect(() => {
    newGame("easy");
    setMounted(true);
  }, [newGame]);

  // Timer
  useEffect(() => {
    if (!isRunning) return;
    const id = setInterval(() => setTimer((t) => t + 1), 1000);
    return () => clearInterval(id);
  }, [isRunning]);

  // Check win
  useEffect(() => {
    if (!board || !solution) return;
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        if (board[r][c] !== solution[r][c]) return;
      }
    }
    setWon(true);
    setIsRunning(false);
  }, [board, solution]);

  // Keyboard input
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (!selected || !board || !fixed || won) return;
      const [r, c] = selected;
      if (fixed[r][c]) return;

      if (/^[1-9]$/.test(e.key)) {
        const num = parseInt(e.key);
        const next = board.map((row) => [...row]);
        next[r][c] = num;
        setBoard(next);

        // Check errors
        if (solution && num !== solution[r][c]) {
          setErrors((prev) => new Set([...prev, `${r}-${c}`]));
        } else {
          setErrors((prev) => {
            const n = new Set(prev);
            n.delete(`${r}-${c}`);
            return n;
          });
        }
      } else if (e.key === "Backspace" || e.key === "Delete") {
        const next = board.map((row) => [...row]);
        next[r][c] = 0;
        setBoard(next);
        setErrors((prev) => {
          const n = new Set(prev);
          n.delete(`${r}-${c}`);
          return n;
        });
      } else if (e.key === "ArrowUp" && r > 0) setSelected([r - 1, c]);
      else if (e.key === "ArrowDown" && r < 8) setSelected([r + 1, c]);
      else if (e.key === "ArrowLeft" && c > 0) setSelected([r, c - 1]);
      else if (e.key === "ArrowRight" && c < 8) setSelected([r, c + 1]);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [selected, board, fixed, solution, won]);

  function handleNumPad(num: number) {
    if (!selected || !board || !fixed || won) return;
    const [r, c] = selected;
    if (fixed[r][c]) return;
    const next = board.map((row) => [...row]);
    next[r][c] = num;
    setBoard(next);
    if (solution && num !== solution[r][c]) {
      setErrors((prev) => new Set([...prev, `${r}-${c}`]));
    } else {
      setErrors((prev) => { const n = new Set(prev); n.delete(`${r}-${c}`); return n; });
    }
  }

  function handleErase() {
    if (!selected || !board || !fixed || won) return;
    const [r, c] = selected;
    if (fixed[r][c]) return;
    const next = board.map((row) => [...row]);
    next[r][c] = 0;
    setBoard(next);
    setErrors((prev) => { const n = new Set(prev); n.delete(`${r}-${c}`); return n; });
  }

  const formatTime = (s: number) =>
    `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

  if (!mounted || !board || !fixed) {
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

  return (
    <>
      <Navbar />
      <main className="relative min-h-screen bg-background bg-scan overflow-hidden">
        <div className="orb orb-emerald w-[280px] h-[280px] top-[5%] right-[10%] hidden lg:block" aria-hidden="true" />
        <div className="orb orb-blue w-[180px] h-[180px] bottom-[10%] left-[5%] hidden lg:block" style={{ animationDelay: "-5s" }} aria-hidden="true" />
        <div className="crosshair top-[15%] left-[10%] hidden lg:block" aria-hidden="true" />
        <div className="hex-grid" aria-hidden="true" />

        <div className="relative z-[1] max-w-lg mx-auto px-4 pt-24 pb-8 flex flex-col min-h-screen">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <Link href="/play" className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-foreground transition-colors">
              <ArrowLeft className="w-4 h-4" /> Games
            </Link>
            <h1 className="text-xl font-bold text-foreground">🧩 Sudoku</h1>
            <span className="text-sm font-mono text-muted">{formatTime(timer)}</span>
          </div>

          {/* Difficulty */}
          <div className="flex justify-center gap-2 mb-5">
            {(["easy", "medium", "hard"] as Difficulty[]).map((d) => (
              <button
                key={d}
                onClick={() => newGame(d)}
                className={`text-xs font-semibold px-4 py-2 rounded-full transition-colors cursor-pointer ${
                  difficulty === d
                    ? "bg-emerald-500 text-white"
                    : "bg-gray-100 text-muted hover:bg-gray-200"
                }`}
              >
                {d.charAt(0).toUpperCase() + d.slice(1)}
              </button>
            ))}
          </div>

          {/* Win message */}
          {won && (
            <div className="text-center mb-4 glass-card rounded-xl p-4">
              <p className="text-lg font-bold text-foreground">🎉 Puzzle complete!</p>
              <p className="text-sm text-muted">Finished in {formatTime(timer)}</p>
              <button
                onClick={() => newGame(difficulty)}
                className="mt-3 text-xs font-semibold text-white bg-emerald-500 px-5 py-2 rounded-full hover:bg-emerald-600 transition-colors cursor-pointer"
              >
                New game
              </button>
            </div>
          )}

          {/* Grid */}
          <div className="flex justify-center mb-5">
            <div
              className="grid grid-cols-9 border-2 border-foreground/80 rounded-lg overflow-hidden"
              style={{ width: "min(100%, 396px)", aspectRatio: "1" }}
            >
              {board.map((row, r) =>
                row.map((val, c) => {
                  const isFixed = fixed[r][c];
                  const isSelected = selected?.[0] === r && selected?.[1] === c;
                  const isSameRow = selected?.[0] === r;
                  const isSameCol = selected?.[1] === c;
                  const isSameBox =
                    selected &&
                    Math.floor(selected[0] / 3) === Math.floor(r / 3) &&
                    Math.floor(selected[1] / 3) === Math.floor(c / 3);
                  const isSameNum = selected && val !== 0 && board[selected[0]][selected[1]] === val;
                  const isError = errors.has(`${r}-${c}`);

                  const borderR = (c + 1) % 3 === 0 && c < 8 ? "border-r-2 border-r-foreground/40" : "border-r border-r-gray-200";
                  const borderB = (r + 1) % 3 === 0 && r < 8 ? "border-b-2 border-b-foreground/40" : "border-b border-b-gray-200";

                  let bg = "bg-white";
                  if (isSelected) bg = "bg-blue-100";
                  else if (isSameNum) bg = "bg-blue-50";
                  else if (isSameRow || isSameCol || isSameBox) bg = "bg-gray-50";

                  return (
                    <button
                      key={`${r}-${c}`}
                      onClick={() => setSelected([r, c])}
                      className={`flex items-center justify-center ${borderR} ${borderB} ${bg} transition-colors cursor-pointer text-sm sm:text-base font-semibold select-none ${
                        isFixed
                          ? "text-foreground"
                          : isError
                            ? "text-red-500"
                            : "text-blue-600"
                      }`}
                      style={{ aspectRatio: "1" }}
                    >
                      {val !== 0 ? val : ""}
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* Number pad */}
          <div className="flex justify-center gap-2 mb-3">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
              <button
                key={n}
                onClick={() => handleNumPad(n)}
                className="w-9 h-11 sm:w-10 sm:h-12 rounded-lg bg-gray-100 text-foreground font-bold text-base hover:bg-gray-200 active:bg-gray-300 transition-colors cursor-pointer select-none"
              >
                {n}
              </button>
            ))}
          </div>
          <div className="flex justify-center gap-2 mb-6">
            <button
              onClick={handleErase}
              className="px-5 h-10 rounded-lg bg-gray-100 text-sm font-medium text-muted hover:bg-gray-200 transition-colors cursor-pointer"
            >
              Erase
            </button>
            <button
              onClick={() => newGame(difficulty)}
              className="px-5 h-10 rounded-lg bg-gray-100 text-sm font-medium text-muted hover:bg-gray-200 transition-colors cursor-pointer"
            >
              New puzzle
            </button>
          </div>

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
