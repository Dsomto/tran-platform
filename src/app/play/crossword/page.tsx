"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import { Navbar } from "@/components/landing/navbar";
import { Footer } from "@/components/landing/footer";
import { ArrowLeft } from "lucide-react";

// ── Types ────────────────────────────────────────────────────

interface WordEntry { word: string; clue: string }

interface PlacedWord {
  word: string;
  clue: string;
  row: number;
  col: number;
  direction: "across" | "down";
  number?: number;
}

interface CellData {
  letter: string;
  number?: number;
  acrossIdx?: number;
  downIdx?: number;
}

interface Puzzle {
  grid: (CellData | null)[][];
  words: PlacedWord[];
  width: number;
  height: number;
}

// ── Word pool (40+ terms for variety) ────────────────────────

const WORD_POOL: WordEntry[] = [
  { word: "FIREWALL", clue: "Filters incoming and outgoing network traffic" },
  { word: "PHISHING", clue: "Fraudulent emails designed to steal credentials" },
  { word: "MALWARE", clue: "Software intentionally designed to cause damage" },
  { word: "EXPLOIT", clue: "Code that leverages a software vulnerability" },
  { word: "TROJAN", clue: "Malware disguised as legitimate software" },
  { word: "CIPHER", clue: "Algorithm used to encrypt or decrypt data" },
  { word: "BOTNET", clue: "Network of hijacked computers controlled remotely" },
  { word: "ROOTKIT", clue: "Software that conceals malicious processes" },
  { word: "PAYLOAD", clue: "The harmful component delivered by an exploit" },
  { word: "VIRUS", clue: "Self-replicating malicious program" },
  { word: "HASH", clue: "One-way function producing a fixed-length digest" },
  { word: "TOKEN", clue: "Digital object used for authentication" },
  { word: "PROXY", clue: "Intermediary server that forwards requests" },
  { word: "PATCH", clue: "Software update that fixes a vulnerability" },
  { word: "SPOOF", clue: "Disguise communication as coming from a trusted source" },
  { word: "AUDIT", clue: "Formal review of security controls and practices" },
  { word: "WORM", clue: "Malware that spreads across networks without user action" },
  { word: "ALERT", clue: "Notification triggered by a security event" },
  { word: "SCAN", clue: "Systematic probe of a network for weaknesses" },
  { word: "PORT", clue: "Numbered endpoint for network communication" },
  { word: "RISK", clue: "Probability and impact of a security threat" },
  { word: "CRACK", clue: "Break a password or encryption by brute force" },
  { word: "SNORT", clue: "Open-source intrusion detection system" },
  { word: "BREACH", clue: "Unauthorized access to protected data" },
  { word: "THREAT", clue: "Potential cause of an unwanted security incident" },
  { word: "BRUTE", clue: "___ force: trying every possible combination" },
  { word: "NMAP", clue: "Popular open-source network scanning tool" },
  { word: "SOCKET", clue: "Endpoint for sending or receiving network data" },
  { word: "ROUTER", clue: "Device that directs traffic between networks" },
  { word: "CRYPT", clue: "Prefix meaning hidden or secret" },
  { word: "OSINT", clue: "Intelligence gathered from publicly available sources" },
  { word: "SPEAR", clue: "___ phishing: targeted attack on specific individuals" },
  { word: "SNIFFER", clue: "Tool that captures packets on a network" },
  { word: "SANDBOX", clue: "Isolated environment for safely testing code" },
  { word: "KERNEL", clue: "Core component of an operating system" },
  { word: "DAEMON", clue: "Background process running on a server" },
  { word: "PACKET", clue: "Unit of data transmitted over a network" },
  { word: "SUBNET", clue: "Subdivision of a larger IP network" },
  { word: "BEACON", clue: "Signal sent by malware to its command server" },
  { word: "LATERAL", clue: "___ movement: spreading within a compromised network" },
  { word: "KEYLOG", clue: "Secretly records every keystroke on a device" },
  { word: "ENCRYPT", clue: "Convert data into an unreadable coded form" },
  { word: "STEALTH", clue: "Techniques used to avoid detection" },
  { word: "DENIAL", clue: "___ of service: attack that overwhelms a server" },
  { word: "VECTOR", clue: "Path or method used to deliver an attack" },
  { word: "PIVOT", clue: "Use a compromised host to attack other systems" },
  { word: "EXFIL", clue: "Short for exfiltration: stealing data out" },
  { word: "SHELL", clue: "Command-line interface or remote access tool" },
  { word: "WHOIS", clue: "Protocol for querying domain registration info" },
];

// ── Helpers ──────────────────────────────────────────────────

function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ── Crossword generator ─────────────────────────────────────

function canPlace(
  grid: Map<string, string>,
  word: string,
  row: number,
  col: number,
  direction: "across" | "down",
  isFirst: boolean,
): boolean {
  const dr = direction === "down" ? 1 : 0;
  const dc = direction === "across" ? 1 : 0;

  // Cell before word must be empty
  if (grid.has(`${row - dr},${col - dc}`)) return false;
  // Cell after word must be empty
  if (grid.has(`${row + dr * word.length},${col + dc * word.length}`)) return false;

  let hasIntersection = false;
  for (let i = 0; i < word.length; i++) {
    const r = row + dr * i;
    const c = col + dc * i;
    const key = `${r},${c}`;

    if (grid.has(key)) {
      if (grid.get(key) !== word[i]) return false;
      hasIntersection = true;
    } else {
      // Empty cell — check perpendicular neighbours to avoid accidental parallel words
      if (direction === "across") {
        if (grid.has(`${r - 1},${c}`) || grid.has(`${r + 1},${c}`)) return false;
      } else {
        if (grid.has(`${r},${c - 1}`) || grid.has(`${r},${c + 1}`)) return false;
      }
    }
  }

  return isFirst || hasIntersection;
}

function tryGenerate(pool: WordEntry[]): Puzzle {
  const shuffled = shuffleArray(pool).sort((a, b) => b.word.length - a.word.length);
  const placed: PlacedWord[] = [];
  const letterGrid = new Map<string, string>();

  // Place first word horizontally
  const first = shuffled[0];
  placed.push({ word: first.word, clue: first.clue, row: 0, col: 0, direction: "across" });
  for (let i = 0; i < first.word.length; i++) {
    letterGrid.set(`0,${i}`, first.word[i]);
  }

  // Try placing remaining words
  for (let wi = 1; wi < shuffled.length && placed.length < 14; wi++) {
    const entry = shuffled[wi];
    const word = entry.word;
    let best: { row: number; col: number; direction: "across" | "down"; score: number } | null = null;

    for (const pw of placed) {
      for (let pi = 0; pi < pw.word.length; pi++) {
        for (let wi2 = 0; wi2 < word.length; wi2++) {
          if (pw.word[pi] !== word[wi2]) continue;

          const dir: "across" | "down" = pw.direction === "across" ? "down" : "across";
          const row = dir === "down" ? pw.row - wi2 : pw.row + pi;
          const col = dir === "down" ? pw.col + pi : pw.col - wi2;

          if (canPlace(letterGrid, word, row, col, dir, false)) {
            let score = 0;
            const dr2 = dir === "down" ? 1 : 0;
            const dc2 = dir === "across" ? 1 : 0;
            for (let k = 0; k < word.length; k++) {
              if (letterGrid.has(`${row + dr2 * k},${col + dc2 * k}`)) score++;
            }
            if (!best || score > best.score) {
              best = { row, col, direction: dir, score };
            }
          }
        }
      }
    }

    if (best) {
      placed.push({ word, clue: entry.clue, row: best.row, col: best.col, direction: best.direction });
      const dr = best.direction === "down" ? 1 : 0;
      const dc = best.direction === "across" ? 1 : 0;
      for (let i = 0; i < word.length; i++) {
        letterGrid.set(`${best.row + dr * i},${best.col + dc * i}`, word[i]);
      }
    }
  }

  // Normalise coordinates
  let minR = Infinity, minC = Infinity, maxR = -Infinity, maxC = -Infinity;
  for (const key of letterGrid.keys()) {
    const [r, c] = key.split(",").map(Number);
    minR = Math.min(minR, r); minC = Math.min(minC, c);
    maxR = Math.max(maxR, r); maxC = Math.max(maxC, c);
  }
  for (const pw of placed) { pw.row -= minR; pw.col -= minC; }

  const height = maxR - minR + 1;
  const width = maxC - minC + 1;

  // Assign clue numbers
  const numberMap = new Map<string, number>();
  let num = 1;
  const starts = placed.map((pw, idx) => ({ row: pw.row, col: pw.col, idx }));
  starts.sort((a, b) => (a.row !== b.row ? a.row - b.row : a.col - b.col));
  for (const s of starts) {
    const key = `${s.row},${s.col}`;
    if (!numberMap.has(key)) numberMap.set(key, num++);
    placed[s.idx].number = numberMap.get(key);
  }

  // Build grid
  const grid: (CellData | null)[][] = Array.from({ length: height }, () => Array(width).fill(null));
  for (const [key, letter] of letterGrid.entries()) {
    const [r, c] = key.split(",").map(Number);
    const nr = r - minR;
    const nc = c - minC;
    grid[nr][nc] = { letter, number: numberMap.get(`${nr},${nc}`) };
  }

  // Tag cells with word indices
  placed.forEach((pw, idx) => {
    const dr = pw.direction === "down" ? 1 : 0;
    const dc = pw.direction === "across" ? 1 : 0;
    for (let i = 0; i < pw.word.length; i++) {
      const cell = grid[pw.row + dr * i][pw.col + dc * i];
      if (cell) {
        if (pw.direction === "across") cell.acrossIdx = idx;
        else cell.downIdx = idx;
      }
    }
  });

  return { grid, words: placed, width, height };
}

function generateCrossword(pool: WordEntry[]): Puzzle {
  let best: Puzzle | null = null;
  for (let attempt = 0; attempt < 40; attempt++) {
    const result = tryGenerate(pool);
    if (!best || result.words.length > best.words.length) best = result;
    if (result.words.length >= 10) break;
  }
  return best!;
}

// ── Keyboard layout ──────────────────────────────────────────

const KB_ROWS = [
  ["Q","W","E","R","T","Y","U","I","O","P"],
  ["A","S","D","F","G","H","J","K","L"],
  ["Z","X","C","V","B","N","M"],
];

// ── Component ────────────────────────────────────────────────

export default function CrosswordPage() {
  const [puzzle, setPuzzle] = useState<Puzzle | null>(null);
  const [userInput, setUserInput] = useState<Map<string, string>>(new Map());
  const [selectedCell, setSelectedCell] = useState<[number, number] | null>(null);
  const [selectedDir, setSelectedDir] = useState<"across" | "down">("across");
  const [checked, setChecked] = useState(false);
  const [won, setWon] = useState(false);
  const [timer, setTimer] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [mounted, setMounted] = useState(false);

  const newPuzzle = useCallback(() => {
    const result = generateCrossword(WORD_POOL);
    setPuzzle(result);
    setUserInput(new Map());
    setSelectedCell(null);
    setSelectedDir("across");
    setChecked(false);
    setWon(false);
    setTimer(0);
    setIsRunning(true);
  }, []);

  useEffect(() => {
    newPuzzle();
    setMounted(true);
  }, [newPuzzle]);

  // Timer
  useEffect(() => {
    if (!isRunning) return;
    const id = setInterval(() => setTimer((t) => t + 1), 1000);
    return () => clearInterval(id);
  }, [isRunning]);

  // ── Derived state ────────────────────────────────────────

  const selectedWordIdx = useMemo((): number | null => {
    if (!selectedCell || !puzzle) return null;
    const [r, c] = selectedCell;
    const cell = puzzle.grid[r]?.[c];
    if (!cell) return null;
    if (selectedDir === "across" && cell.acrossIdx !== undefined) return cell.acrossIdx;
    if (selectedDir === "down" && cell.downIdx !== undefined) return cell.downIdx;
    return cell.acrossIdx ?? cell.downIdx ?? null;
  }, [selectedCell, selectedDir, puzzle]);

  const selectedWordCells = useMemo(() => {
    if (selectedWordIdx === null || !puzzle) return new Set<string>();
    const w = puzzle.words[selectedWordIdx];
    const s = new Set<string>();
    const dr = w.direction === "down" ? 1 : 0;
    const dc = w.direction === "across" ? 1 : 0;
    for (let i = 0; i < w.word.length; i++) s.add(`${w.row + dr * i},${w.col + dc * i}`);
    return s;
  }, [selectedWordIdx, puzzle]);

  const acrossWords = useMemo(
    () => (puzzle ? puzzle.words.filter((w) => w.direction === "across").sort((a, b) => a.number! - b.number!) : []),
    [puzzle],
  );
  const downWords = useMemo(
    () => (puzzle ? puzzle.words.filter((w) => w.direction === "down").sort((a, b) => a.number! - b.number!) : []),
    [puzzle],
  );

  // ── Handlers ─────────────────────────────────────────────

  function handleCellClick(r: number, c: number) {
    if (!puzzle || won) return;
    const cell = puzzle.grid[r]?.[c];
    if (!cell) return;

    if (selectedCell && selectedCell[0] === r && selectedCell[1] === c) {
      // Same cell — toggle direction at intersections
      if (cell.acrossIdx !== undefined && cell.downIdx !== undefined) {
        setSelectedDir((d) => (d === "across" ? "down" : "across"));
      }
    } else {
      setSelectedCell([r, c]);
      if (cell.acrossIdx !== undefined && cell.downIdx === undefined) setSelectedDir("across");
      else if (cell.downIdx !== undefined && cell.acrossIdx === undefined) setSelectedDir("down");
    }
  }

  function inputLetter(letter: string) {
    if (!selectedCell || !puzzle || won) return;
    const [r, c] = selectedCell;

    setUserInput((prev) => {
      const m = new Map(prev);
      m.set(`${r},${c}`, letter.toUpperCase());
      return m;
    });
    setChecked(false);

    // Advance cursor within the CURRENT word only — don't leak into a
    // neighboring word that happens to be adjacent in the grid.
    const cell = puzzle.grid[r]?.[c];
    if (!cell) return;
    const wIdx = selectedDir === "across" ? cell.acrossIdx : cell.downIdx;
    if (wIdx === undefined) return;
    const w = puzzle.words[wIdx];
    const dr = w.direction === "down" ? 1 : 0;
    const dc = w.direction === "across" ? 1 : 0;
    const nr = r + dr;
    const nc = c + dc;
    const next = puzzle.grid[nr]?.[nc];
    if (!next) return;
    const nextWIdx = selectedDir === "across" ? next.acrossIdx : next.downIdx;
    if (nextWIdx === wIdx) setSelectedCell([nr, nc]);
  }

  function deleteLetter() {
    if (!selectedCell || !puzzle || won) return;
    const [r, c] = selectedCell;
    const key = `${r},${c}`;

    if (userInput.has(key)) {
      setUserInput((prev) => { const m = new Map(prev); m.delete(key); return m; });
      setChecked(false);
    } else {
      const cell = puzzle.grid[r]?.[c];
      if (!cell) return;
      const wIdx = selectedDir === "across" ? cell.acrossIdx : cell.downIdx;
      if (wIdx === undefined) return;
      const w = puzzle.words[wIdx];
      const dr = w.direction === "down" ? 1 : 0;
      const dc = w.direction === "across" ? 1 : 0;
      const pr = r - dr;
      const pc = c - dc;
      if (pr < 0 || pc < 0) return;
      const prev = puzzle.grid[pr]?.[pc];
      if (!prev) return;
      const prevWIdx = selectedDir === "across" ? prev.acrossIdx : prev.downIdx;
      if (prevWIdx !== wIdx) return;
      setSelectedCell([pr, pc]);
      setUserInput((p) => { const m = new Map(p); m.delete(`${pr},${pc}`); return m; });
      setChecked(false);
    }
  }

  function selectClue(wordIdx: number) {
    if (!puzzle) return;
    const w = puzzle.words[wordIdx];
    setSelectedDir(w.direction);
    const dr = w.direction === "down" ? 1 : 0;
    const dc = w.direction === "across" ? 1 : 0;
    for (let i = 0; i < w.word.length; i++) {
      const r = w.row + dr * i;
      const c = w.col + dc * i;
      if (!userInput.has(`${r},${c}`)) { setSelectedCell([r, c]); return; }
    }
    setSelectedCell([w.row, w.col]);
  }

  function checkAnswers() {
    if (!puzzle) return;
    setChecked(true);
    let allCorrect = true;
    for (let r = 0; r < puzzle.height; r++) {
      for (let c = 0; c < puzzle.width; c++) {
        const cell = puzzle.grid[r][c];
        if (cell && userInput.get(`${r},${c}`) !== cell.letter) allCorrect = false;
      }
    }
    if (allCorrect) { setWon(true); setIsRunning(false); }
  }

  function revealAll() {
    if (!puzzle) return;
    const m = new Map<string, string>();
    for (let r = 0; r < puzzle.height; r++) {
      for (let c = 0; c < puzzle.width; c++) {
        const cell = puzzle.grid[r][c];
        if (cell) m.set(`${r},${c}`, cell.letter);
      }
    }
    setUserInput(m);
    setChecked(true);
    setWon(true);
    setIsRunning(false);
  }

  // ── Keyboard effect ──────────────────────────────────────

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (!selectedCell || !puzzle || won) return;
      const [r, c] = selectedCell;
      const cell = puzzle.grid[r]?.[c];
      if (!cell) return;

      if (/^[a-zA-Z]$/.test(e.key)) {
        e.preventDefault();
        inputLetter(e.key);
      } else if (e.key === "Backspace") {
        e.preventDefault();
        deleteLetter();
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        if (c + 1 < puzzle.width && puzzle.grid[r][c + 1]) { setSelectedCell([r, c + 1]); setSelectedDir("across"); }
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        if (c - 1 >= 0 && puzzle.grid[r][c - 1]) { setSelectedCell([r, c - 1]); setSelectedDir("across"); }
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        if (r + 1 < puzzle.height && puzzle.grid[r + 1]?.[c]) { setSelectedCell([r + 1, c]); setSelectedDir("down"); }
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        if (r - 1 >= 0 && puzzle.grid[r - 1]?.[c]) { setSelectedCell([r - 1, c]); setSelectedDir("down"); }
      } else if (e.key === "Tab") {
        e.preventDefault();
        const wIdx = selectedDir === "across" ? cell.acrossIdx : cell.downIdx;
        if (wIdx === undefined) return;
        const sorted = puzzle.words.map((_, i) => i).sort((a, b) => {
          const wa = puzzle.words[a], wb = puzzle.words[b];
          if (wa.direction !== wb.direction) return wa.direction === "across" ? -1 : 1;
          return wa.number! - wb.number!;
        });
        const pos = sorted.indexOf(wIdx);
        const next = sorted[(pos + (e.shiftKey ? -1 : 1) + sorted.length) % sorted.length];
        selectClue(next);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCell, selectedDir, userInput, puzzle, won]);

  const formatTime = (s: number) =>
    `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

  // ── Loading state ────────────────────────────────────────

  if (!mounted || !puzzle) {
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

  // ── Render ───────────────────────────────────────────────

  return (
    <>
      <Navbar />
      <main className="relative min-h-screen bg-background bg-scan overflow-hidden">
        <div className="orb orb-blue w-[280px] h-[280px] top-[5%] right-[10%] hidden lg:block" aria-hidden="true" />
        <div className="orb orb-cyan w-[180px] h-[180px] bottom-[10%] left-[5%] hidden lg:block" style={{ animationDelay: "-5s" }} aria-hidden="true" />
        <div className="hex-grid" aria-hidden="true" />

        <div className="relative z-[1] max-w-5xl mx-auto px-4 pt-24 pb-8 flex flex-col min-h-screen">
          {/* Header */}
          <div className="flex items-center justify-between mb-5">
            <Link href="/play" className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-foreground transition-colors">
              <ArrowLeft className="w-4 h-4" /> Games
            </Link>
            <h1 className="text-xl font-bold text-foreground">CyberCrossword</h1>
            <span className="text-sm font-mono text-muted">{formatTime(timer)}</span>
          </div>

          {/* Win banner */}
          {won && (
            <div className="text-center mb-5 glass-card rounded-xl p-5">
              <p className="text-lg font-bold text-foreground mb-1">Puzzle complete!</p>
              <p className="text-sm text-muted">Finished in {formatTime(timer)} with {puzzle.words.length} words</p>
              <button
                onClick={newPuzzle}
                className="mt-3 text-xs font-semibold text-white bg-violet-500 px-5 py-2 rounded-full hover:bg-violet-600 transition-colors cursor-pointer"
              >
                New puzzle
              </button>
            </div>
          )}

          {/* Grid + Clues — side by side on desktop */}
          <div className="flex flex-col lg:flex-row gap-6 mb-5">
            {/* Grid */}
            <div className="flex justify-center lg:justify-start shrink-0">
              <div
                className="grid gap-[1px] bg-foreground/20 rounded-lg overflow-hidden border border-foreground/10"
                style={{
                  gridTemplateColumns: `repeat(${puzzle.width}, 32px)`,
                  gridTemplateRows: `repeat(${puzzle.height}, 32px)`,
                }}
              >
                {puzzle.grid.flat().map((cell, idx) => {
                  const r = Math.floor(idx / puzzle.width);
                  const c = idx % puzzle.width;

                  if (!cell) {
                    return <div key={idx} className="w-8 h-8 bg-gray-200/50" />;
                  }

                  const cellKey = `${r},${c}`;
                  const isSelected = selectedCell?.[0] === r && selectedCell?.[1] === c;
                  const isInWord = selectedWordCells.has(cellKey);
                  const userLetter = userInput.get(cellKey);
                  const isCorrect = checked && userLetter === cell.letter;
                  const isWrong = checked && !!userLetter && userLetter !== cell.letter;
                  const isEmpty = checked && !userLetter;

                  let bg = "bg-white";
                  if (won) bg = "bg-green-50";
                  else if (isSelected) bg = "bg-violet-200";
                  else if (isInWord) bg = "bg-violet-50";

                  return (
                    <button
                      key={idx}
                      onClick={() => handleCellClick(r, c)}
                      className={`relative w-8 h-8 flex items-center justify-center font-bold select-none transition-colors cursor-pointer ${bg} ${
                        isWrong ? "text-red-500" : isCorrect ? "text-green-600" : isEmpty && checked ? "text-amber-500" : "text-foreground"
                      }`}
                    >
                      {cell.number && (
                        <span className="absolute top-[1px] left-[3px] text-[8px] leading-none font-semibold text-gray-400">
                          {cell.number}
                        </span>
                      )}
                      <span className="text-sm">{userLetter || ""}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Clues */}
            <div className="flex-1 grid grid-cols-2 gap-5">
              <div>
                <h3 className="text-sm font-bold text-foreground mb-2 uppercase tracking-wider">Across</h3>
                <div className="space-y-1.5">
                  {acrossWords.map((w) => {
                    const wIdx = puzzle.words.indexOf(w);
                    const isActive = selectedWordIdx === wIdx;
                    return (
                      <button
                        key={w.number}
                        onClick={() => selectClue(wIdx)}
                        className={`block w-full text-left text-xs leading-relaxed px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer ${
                          isActive ? "bg-violet-100 text-foreground" : "text-muted hover:bg-gray-50"
                        }`}
                      >
                        <strong className="text-foreground mr-1">{w.number}.</strong>
                        {w.clue}
                      </button>
                    );
                  })}
                </div>
              </div>
              <div>
                <h3 className="text-sm font-bold text-foreground mb-2 uppercase tracking-wider">Down</h3>
                <div className="space-y-1.5">
                  {downWords.map((w) => {
                    const wIdx = puzzle.words.indexOf(w);
                    const isActive = selectedWordIdx === wIdx;
                    return (
                      <button
                        key={w.number}
                        onClick={() => selectClue(wIdx)}
                        className={`block w-full text-left text-xs leading-relaxed px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer ${
                          isActive ? "bg-violet-100 text-foreground" : "text-muted hover:bg-gray-50"
                        }`}
                      >
                        <strong className="text-foreground mr-1">{w.number}.</strong>
                        {w.clue}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Active clue banner */}
          {selectedWordIdx !== null && (
            <div className="glass-card rounded-xl px-4 py-3 mb-4 text-center">
              <p className="text-sm text-foreground">
                <strong className="text-violet-500 mr-1.5">
                  {puzzle.words[selectedWordIdx].number}{puzzle.words[selectedWordIdx].direction === "across" ? "A" : "D"}
                </strong>
                {puzzle.words[selectedWordIdx].clue}
              </p>
            </div>
          )}

          {/* Virtual keyboard */}
          <div className="mb-4">
            {KB_ROWS.map((row, ri) => (
              <div key={ri} className="flex justify-center gap-[3px] sm:gap-1 mb-[3px] sm:mb-1">
                {ri === 2 && <div className="w-3 sm:w-5" />}
                {row.map((letter) => (
                  <button
                    key={letter}
                    onClick={() => inputLetter(letter)}
                    disabled={won}
                    className="w-[30px] h-[38px] sm:w-9 sm:h-11 rounded-md bg-gray-100 text-foreground text-xs sm:text-sm font-semibold hover:bg-gray-200 active:bg-gray-300 transition-colors cursor-pointer select-none disabled:opacity-40"
                  >
                    {letter}
                  </button>
                ))}
                {ri === 2 && (
                  <button
                    onClick={deleteLetter}
                    disabled={won}
                    className="w-[46px] h-[38px] sm:w-14 sm:h-11 rounded-md bg-gray-200 text-xs font-medium text-muted hover:bg-gray-300 transition-colors cursor-pointer select-none disabled:opacity-40"
                  >
                    DEL
                  </button>
                )}
              </div>
            ))}
          </div>

          {/* Action buttons */}
          <div className="flex justify-center gap-3 mb-6">
            {!won && (
              <>
                <button
                  onClick={checkAnswers}
                  className="text-xs font-semibold text-white bg-violet-500 px-5 py-2.5 rounded-full hover:bg-violet-600 transition-colors cursor-pointer"
                >
                  Check
                </button>
                <button
                  onClick={revealAll}
                  className="text-xs font-medium text-muted border border-border px-5 py-2.5 rounded-full hover:bg-surface-hover transition-colors cursor-pointer"
                >
                  Reveal
                </button>
              </>
            )}
            <button
              onClick={newPuzzle}
              className="text-xs font-medium text-muted border border-border px-5 py-2.5 rounded-full hover:bg-surface-hover transition-colors cursor-pointer"
            >
              New puzzle
            </button>
          </div>

          {/* Hint */}
          <p className="text-center text-[11px] text-muted mb-6">
            Click a cell, then type. Click the same cell again to switch <strong className="text-violet-500">across</strong>/<strong className="text-violet-500">down</strong>. Use <strong>Tab</strong> for next word.
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
