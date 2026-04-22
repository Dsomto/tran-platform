"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { Navbar } from "@/components/landing/navbar";
import { Footer } from "@/components/landing/footer";
import { ArrowLeft } from "lucide-react";

// ── Question bank ─────────────────────────────────────────────

interface Question {
  q: string;
  options: string[];
  answer: number; // index of correct option
}

const QUESTIONS: Question[] = [
  { q: "What does SIEM stand for?", options: ["Security Information and Event Management", "System Integration and Endpoint Monitoring", "Secure Internet and Email Management", "Server Incident and Error Mapping"], answer: 0 },
  { q: "Which port does HTTPS use by default?", options: ["80", "8080", "443", "8443"], answer: 2 },
  { q: "What type of attack involves flooding a server with traffic?", options: ["Phishing", "DDoS", "SQL Injection", "Man-in-the-Middle"], answer: 1 },
  { q: "What does the 'C' in CIA triad stand for?", options: ["Compliance", "Control", "Confidentiality", "Cybersecurity"], answer: 2 },
  { q: "Which tool is commonly used for network packet analysis?", options: ["Wireshark", "Photoshop", "VS Code", "Slack"], answer: 0 },
  { q: "What is the purpose of a firewall?", options: ["Speed up internet", "Filter network traffic", "Store passwords", "Compress files"], answer: 1 },
  { q: "What does 'phishing' target?", options: ["Network hardware", "Human behaviour", "Database servers", "Operating systems"], answer: 1 },
  { q: "Which framework is used for classifying cyber threats?", options: ["React", "MITRE ATT&CK", "Bootstrap", "Django"], answer: 1 },
  { q: "What does a VPN primarily provide?", options: ["Faster internet", "Encrypted connection", "Free Wi-Fi", "Virus removal"], answer: 1 },
  { q: "What is social engineering?", options: ["Building social media apps", "Manipulating people to reveal information", "Engineering social networks", "Designing user interfaces"], answer: 1 },
  { q: "Which protocol is used for secure file transfer?", options: ["FTP", "HTTP", "SFTP", "SMTP"], answer: 2 },
  { q: "What is a zero-day vulnerability?", options: ["A bug found on day zero of a project", "A flaw unknown to the vendor", "A virus that activates at midnight", "A password that expires daily"], answer: 1 },
  { q: "What does 'SQL injection' exploit?", options: ["Web browsers", "Database queries", "Email servers", "DNS records"], answer: 1 },
  { q: "What is the purpose of penetration testing?", options: ["Install software updates", "Find security vulnerabilities", "Monitor employee productivity", "Design user interfaces"], answer: 1 },
  { q: "Which of these is a hashing algorithm?", options: ["AES", "RSA", "SHA-256", "TCP"], answer: 2 },
  { q: "What does 'MFA' stand for?", options: ["Multiple Firewall Access", "Multi-Factor Authentication", "Managed File Application", "Maximum Frequency Allocation"], answer: 1 },
  { q: "What is ransomware?", options: ["Software that speeds up your PC", "Malware that encrypts files for ransom", "A VPN service", "An antivirus program"], answer: 1 },
  { q: "What port does SSH use by default?", options: ["21", "22", "23", "25"], answer: 1 },
  { q: "What is the main purpose of an IDS?", options: ["Encrypt data", "Detect intrusions", "Block websites", "Manage users"], answer: 1 },
  { q: "Which organisation maintains the CVE database?", options: ["Google", "MITRE", "Microsoft", "Amazon"], answer: 1 },
  { q: "What does XSS stand for?", options: ["Extra Secure System", "Cross-Site Scripting", "XML Security Standard", "Extended Signal Service"], answer: 1 },
  { q: "What is a honeypot in cybersecurity?", options: ["A trap system to lure attackers", "A sweet virus", "A password manager", "A type of encryption"], answer: 0 },
  { q: "What does OSINT stand for?", options: ["Operating System Intelligence", "Open Source Intelligence", "Online Security Integration", "Offline System Interface"], answer: 1 },
  { q: "Which layer of the OSI model does a firewall primarily operate on?", options: ["Layer 1", "Layer 3 / Layer 4", "Layer 6", "Layer 7 only"], answer: 1 },
  { q: "What is the purpose of a SIEM tool like Splunk?", options: ["Write code", "Aggregate and analyse security logs", "Design websites", "Manage payroll"], answer: 1 },
  { q: "What does 'APT' stand for in cybersecurity?", options: ["Application Performance Test", "Advanced Persistent Threat", "Automated Patch Tool", "Anti-Phishing Technology"], answer: 1 },
  { q: "Which of these is NOT a type of malware?", options: ["Trojan", "Worm", "Firewall", "Ransomware"], answer: 2 },
  { q: "What protocol does DNS use?", options: ["TCP only", "UDP (primarily)", "HTTPS", "FTP"], answer: 1 },
  { q: "What is the default port for FTP?", options: ["20/21", "22", "80", "443"], answer: 0 },
  { q: "What does 'brute force' refer to?", options: ["Physical break-in", "Trying all possible passwords", "Social engineering", "DDoS attack"], answer: 1 },
];

function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const ROUND_TIME = 15; // seconds per question
const TOTAL_QUESTIONS = 10;

// ── Component ─────────────────────────────────────────────────

export default function TriviaPage() {
  const [gameState, setGameState] = useState<"idle" | "playing" | "done">("idle");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [qIndex, setQIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(ROUND_TIME);
  const [selected, setSelected] = useState<number | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [mounted, setMounted] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    setMounted(true);
    try {
      const saved = localStorage.getItem("cybertrivia-best");
      if (saved) setBestStreak(parseInt(saved));
    } catch { /* ignore */ }
  }, []);

  const startGame = useCallback(() => {
    const shuffled = shuffleArray(QUESTIONS).slice(0, TOTAL_QUESTIONS);
    setQuestions(shuffled);
    setQIndex(0);
    setScore(0);
    setStreak(0);
    setTimeLeft(ROUND_TIME);
    setSelected(null);
    setRevealed(false);
    setGameState("playing");
  }, []);

  // Timer
  useEffect(() => {
    if (gameState !== "playing" || revealed) return;
    timerRef.current = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          // Time's up — reveal answer
          setRevealed(true);
          setStreak(0);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [gameState, revealed, qIndex]);

  function handleAnswer(idx: number) {
    if (revealed || gameState !== "playing") return;
    setSelected(idx);
    setRevealed(true);
    if (timerRef.current) clearInterval(timerRef.current);

    const correct = idx === questions[qIndex].answer;
    if (correct) {
      const bonus = timeLeft >= 10 ? 3 : timeLeft >= 5 ? 2 : 1;
      setScore((s) => s + bonus);
      setStreak((s) => {
        const next = s + 1;
        setBestStreak((b) => {
          const best = Math.max(b, next);
          try { localStorage.setItem("cybertrivia-best", String(best)); } catch { /* ignore */ }
          return best;
        });
        return next;
      });
    } else {
      setStreak(0);
    }
  }

  function nextQuestion() {
    if (qIndex + 1 >= questions.length) {
      setGameState("done");
      return;
    }
    setQIndex((i) => i + 1);
    setSelected(null);
    setRevealed(false);
    setTimeLeft(ROUND_TIME);
  }

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

  const currentQ = questions[qIndex];

  return (
    <>
      <Navbar />
      <main className="relative min-h-screen bg-background bg-scan overflow-hidden">
        <div className="orb orb-amber w-[280px] h-[280px] top-[5%] right-[10%] hidden lg:block" aria-hidden="true" />
        <div className="orb orb-blue w-[180px] h-[180px] bottom-[10%] left-[5%] hidden lg:block" style={{ animationDelay: "-5s" }} aria-hidden="true" />
        <div className="hex-grid" aria-hidden="true" />

        <div className="relative z-[1] max-w-lg mx-auto px-4 pt-24 pb-8 flex flex-col min-h-screen">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <Link href="/play" className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-foreground transition-colors">
              <ArrowLeft className="w-4 h-4" /> Games
            </Link>
            <h1 className="text-xl font-bold text-foreground">⚡ CyberTrivia</h1>
            <div className="w-16" />
          </div>

          {/* ── Idle state ── */}
          {gameState === "idle" && (
            <div className="flex-1 flex flex-col items-center justify-center text-center">
              <span className="text-6xl block mb-6">⚡</span>
              <h2 className="text-2xl font-bold text-foreground mb-2">CyberTrivia</h2>
              <p className="text-sm text-muted leading-relaxed mb-2 max-w-sm">
                {TOTAL_QUESTIONS} rapid-fire cybersecurity questions. {ROUND_TIME} seconds each. Answer fast for bonus points.
              </p>
              {bestStreak > 0 && (
                <p className="text-xs text-muted mb-6">Best streak: <strong className="text-foreground">{bestStreak}</strong> 🔥</p>
              )}
              <button
                onClick={startGame}
                className="text-sm font-semibold text-white bg-amber-500 px-8 py-3.5 rounded-full hover:bg-amber-600 transition-colors cursor-pointer"
              >
                Start quiz
              </button>
            </div>
          )}

          {/* ── Playing state ── */}
          {gameState === "playing" && currentQ && (
            <div className="flex-1 flex flex-col">
              {/* Progress bar */}
              <div className="flex items-center gap-3 mb-6">
                <span className="text-xs font-medium text-muted">{qIndex + 1}/{TOTAL_QUESTIONS}</span>
                <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-amber-500 rounded-full transition-all duration-300"
                    style={{ width: `${((qIndex + 1) / TOTAL_QUESTIONS) * 100}%` }}
                  />
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-medium text-foreground">{score} pts</span>
                  {streak >= 2 && <span className="text-xs">🔥{streak}</span>}
                </div>
              </div>

              {/* Timer */}
              <div className="flex justify-center mb-5">
                <div className={`w-14 h-14 rounded-full border-4 flex items-center justify-center text-lg font-bold transition-colors ${
                  timeLeft <= 5 ? "border-red-400 text-red-500" : "border-amber-400 text-foreground"
                }`}>
                  {timeLeft}
                </div>
              </div>

              {/* Question */}
              <div className="glass-card rounded-2xl p-6 mb-5">
                <p className="text-base font-semibold text-foreground leading-relaxed">{currentQ.q}</p>
              </div>

              {/* Options */}
              <div className="space-y-3 mb-6">
                {currentQ.options.map((opt, i) => {
                  let bg = "bg-white border-border hover:border-amber-300";
                  if (revealed) {
                    if (i === currentQ.answer) bg = "bg-green-50 border-green-400";
                    else if (i === selected) bg = "bg-red-50 border-red-400";
                    else bg = "bg-white border-border opacity-50";
                  } else if (selected === i) {
                    bg = "bg-amber-50 border-amber-400";
                  }

                  return (
                    <button
                      key={i}
                      onClick={() => handleAnswer(i)}
                      disabled={revealed}
                      className={`w-full text-left px-5 py-4 rounded-xl border-2 ${bg} transition-all cursor-pointer disabled:cursor-default`}
                    >
                      <span className="text-sm text-foreground">
                        <strong className="text-muted mr-2">{String.fromCharCode(65 + i)}.</strong>
                        {opt}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Next button */}
              {revealed && (
                <div className="text-center">
                  <button
                    onClick={nextQuestion}
                    className="text-sm font-semibold text-white bg-amber-500 px-6 py-3 rounded-full hover:bg-amber-600 transition-colors cursor-pointer"
                  >
                    {qIndex + 1 >= TOTAL_QUESTIONS ? "See results" : "Next question →"}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* ── Done state ── */}
          {gameState === "done" && (
            <div className="flex-1 flex flex-col items-center justify-center text-center">
              <span className="text-6xl block mb-4">{score >= TOTAL_QUESTIONS * 2 ? "🏆" : score >= TOTAL_QUESTIONS ? "👏" : "💪"}</span>
              <h2 className="text-2xl font-bold text-foreground mb-2">Quiz complete!</h2>
              <p className="text-4xl font-bold text-amber-500 mb-1">{score}</p>
              <p className="text-sm text-muted mb-6">points out of {TOTAL_QUESTIONS * 3} possible</p>

              <div className="glass-card rounded-xl p-5 mb-6 w-full max-w-xs">
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div>
                    <p className="text-2xl font-bold text-foreground">{Math.round((score / (TOTAL_QUESTIONS * 3)) * 100)}%</p>
                    <p className="text-[11px] text-muted">Accuracy</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-foreground">{bestStreak} 🔥</p>
                    <p className="text-[11px] text-muted">Best streak</p>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={startGame}
                  className="text-sm font-semibold text-white bg-amber-500 px-6 py-3 rounded-full hover:bg-amber-600 transition-colors cursor-pointer"
                >
                  Play again
                </button>
                <Link
                  href="/play"
                  className="text-sm font-medium text-foreground border border-border px-6 py-3 rounded-full hover:bg-surface-hover transition-colors"
                >
                  All games
                </Link>
              </div>
            </div>
          )}

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
