import { useState, useEffect, useCallback, useRef } from "react";
import { ALL_TESTS } from "./TestsPage";
import type { User } from "../App";
import { saveAttempt, calcGrade } from "../store";
import type { AttemptAnswer, TestAttempt } from "../store";

// ── Question bank ─────────────────────────────────────────────────────────────

interface Question {
  id: number;
  text: string;
  options: string[];
  marks: number;
  correct: number;
}

const QUESTION_BANK: Record<number, Question[]> = {
  1: [
    { id: 1,  marks: 2, correct: 1, text: "Which data structure uses LIFO (Last In, First Out) ordering?", options: ["Queue", "Stack", "Deque", "Priority Queue"] },
    { id: 2,  marks: 2, correct: 2, text: "What is the time complexity of binary search on a sorted array of n elements?", options: ["O(n)", "O(n^2)", "O(log n)", "O(n log n)"] },
    { id: 3,  marks: 2, correct: 2, text: "Which traversal of a binary tree visits the root node last?", options: ["Pre-order", "In-order", "Post-order", "Level-order"] },
    { id: 4,  marks: 2, correct: 1, text: "In a max-heap, the root node contains:", options: ["The minimum element", "The maximum element", "The median element", "An arbitrary element"] },
    { id: 5,  marks: 2, correct: 2, text: "What is the worst-case time complexity of QuickSort?", options: ["O(n log n)", "O(n)", "O(n^2)", "O(log n)"] },
    { id: 6,  marks: 2, correct: 1, text: "Which data structure is best suited for implementing a browser's back/forward navigation?", options: ["Queue", "Stack", "Linked List", "Tree"] },
    { id: 7,  marks: 2, correct: 1, text: "The number of edges in a complete graph with n vertices is:", options: ["n(n-1)", "n(n-1)/2", "n^2", "2n"] },
    { id: 8,  marks: 2, correct: 2, text: "Which sorting algorithm has the best average-case time complexity?", options: ["Bubble Sort", "Selection Sort", "Merge Sort", "Insertion Sort"] },
    { id: 9,  marks: 2, correct: 2, text: "A balanced BST with n nodes has height approximately:", options: ["n", "n/2", "log2(n)", "sqrt(n)"] },
    { id: 10, marks: 2, correct: 1, text: "Which data structure is used in Breadth-First Search (BFS)?", options: ["Stack", "Queue", "Heap", "Graph"] },
    { id: 11, marks: 2, correct: 2, text: "The space complexity of Merge Sort is:", options: ["O(1)", "O(log n)", "O(n)", "O(n log n)"] },
    { id: 12, marks: 2, correct: 2, text: "In a circular linked list, the last node's pointer points to:", options: ["NULL", "The previous node", "The head node", "Itself"] },
    { id: 13, marks: 2, correct: 2, text: "Which operation on a stack views the top element without removing it?", options: ["Pop", "Push", "Peek", "Dequeue"] },
    { id: 14, marks: 2, correct: 1, text: "Dijkstra's algorithm is used to find:", options: ["Minimum spanning tree", "Shortest path in a weighted graph", "Topological ordering", "Strongly connected components"] },
    { id: 15, marks: 2, correct: 2, text: "What is the output of an in-order traversal of a Binary Search Tree?", options: ["Random order", "Reverse sorted order", "Sorted ascending order", "Level-order"] },
  ],
};

function generateQuestions(test: { questions: number; title: string }): Question[] {
  return Array.from({ length: Math.min(test.questions, 15) }, (_, i) => ({
    id: i + 1, marks: 2, correct: 0,
    text: `Question ${i + 1}: Sample question about ${test.title}. Select the most appropriate answer.`,
    options: ["Option A - First answer", "Option B - Second answer", "Option C - Third answer", "Option D - Fourth answer"],
  }));
}

// ── Timer hook ────────────────────────────────────────────────────────────────

function useTimer(initialSeconds: number, onExpire: () => void) {
  const [seconds, setSeconds] = useState(initialSeconds);
  const expiredRef = useRef(false);

  useEffect(() => {
    if (seconds <= 0) {
      if (!expiredRef.current) { expiredRef.current = true; onExpire(); }
      return;
    }
    const id = setInterval(() => setSeconds((s) => s - 1), 1000);
    return () => clearInterval(id);
  }, [seconds, onExpire]);

  const mins = String(Math.floor(seconds / 60)).padStart(2, "0");
  const secs = String(seconds % 60).padStart(2, "0");
  const isWarning = seconds <= 300 && seconds > 0;
  const isCritical = seconds <= 60 && seconds > 0;
  return { seconds, mins, secs, isWarning, isCritical };
}

// ── Types ─────────────────────────────────────────────────────────────────────

type QState = "unanswered" | "answered" | "flagged" | "current";
type SubmitPhase = "idle" | "review" | "submitting" | "done";

type WarnType = "tab_switch" | "focus_lost" | "fullscreen_exit" | "inactivity";

interface SecurityWarning {
  type: WarnType;
  label: string;
  detail: string;
  time: string;
}

interface Props {
  testId: number;
  user: User;
  onComplete: (attemptId: string) => void;
  onExit: () => void;
}

// ── Main component ────────────────────────────────────────────────────────────

export default function ExamInterface({ testId, user, onComplete, onExit }: Props) {
  const test = ALL_TESTS.find((t) => t.id === testId);
  const questions: Question[] = test ? (QUESTION_BANK[testId] ?? generateQuestions(test)) : [];

  // ── Exam state ──────────────────────────────────────────────────────────────
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [flagged, setFlagged] = useState<Set<number>>(new Set());
  const [submitPhase, setSubmitPhase] = useState<SubmitPhase>("idle");
  const [navOpen, setNavOpen] = useState(true);
  const [savedAttemptId, setSavedAttemptId] = useState<string | null>(null);
  const examStartRef = useRef(Date.now());

  // ── Security state ──────────────────────────────────────────────────────────
  const [securityLog, setSecurityLog] = useState<SecurityWarning[]>([]);
  const [activeWarn, setActiveWarn] = useState<SecurityWarning | null>(null);
  const [showExitModal, setShowExitModal] = useState(false);
  const [showIntegrityPanel, setShowIntegrityPanel] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [connStatus, setConnStatus] = useState<"connected" | "checking">("connected");
  const [sessionActive, setSessionActive] = useState(true);

  // Refs for stable access in callbacks
  const submitPhaseRef = useRef<SubmitPhase>("idle");
  submitPhaseRef.current = submitPhase;
  const warnCountRef = useRef(0);
  const lastActivityRef = useRef(Date.now());
  const listenersReady = useRef(false);

  const durationSecs = test ? parseInt(test.duration) * 60 : 90 * 60;
  const handleExpire = useCallback(() => setSubmitPhase("submitting"), []);
  const { mins, secs, isWarning, isCritical } = useTimer(durationSecs, handleExpire);

  const totalQ = questions.length;
  const answeredCount = Object.keys(answers).length;
  const unansweredCount = totalQ - answeredCount;
  const flaggedCount = flagged.size;

  // ── Security: record activity ───────────────────────────────────────────────
  const recordActivity = useCallback(() => {
    lastActivityRef.current = Date.now();
  }, []);

  // ── Security: add warning ───────────────────────────────────────────────────
  const addWarning = useCallback((type: WarnType, label: string, detail: string) => {
    if (submitPhaseRef.current !== "idle") return;
    warnCountRef.current += 1;
    const time = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
    const warn: SecurityWarning = { type, label, detail, time };
    setSecurityLog((prev) => [...prev, warn]);
    setActiveWarn(warn);
  }, []);

  // ── Security: attach event listeners (with delay to avoid mount noise) ──────
  useEffect(() => {
    let cleanup: (() => void) | null = null;

    const tid = setTimeout(() => {
      listenersReady.current = true;

      const onVisibility = () => {
        if (document.hidden) {
          addWarning("tab_switch", "Tab Switch Detected",
            "Navigating away from the examination window has been recorded by the system. This event will be included in your session log.");
        }
      };

      const onBlur = () => {
        if (!listenersReady.current) return;
        addWarning("focus_lost", "Window Focus Lost",
          "The examination window lost focus. Ensure you remain in this window for the duration of the test. Repeated events are logged.");
      };

      const onFullscreenChange = () => {
        const inFS = !!document.fullscreenElement;
        setIsFullscreen(inFS);
        if (!inFS && listenersReady.current) {
          addWarning("fullscreen_exit", "Full-Screen Mode Exited",
            "Exiting full-screen mode during an active examination has been recorded. Return to full-screen to minimize logged events.");
        }
      };

      const onKeyDown = (e: KeyboardEvent) => {
        recordActivity();
        // Block common shortcuts that could interfere with the exam
        if ((e.ctrlKey || e.metaKey) && ["c", "v", "a", "p", "s", "f"].includes(e.key.toLowerCase())) {
          e.preventDefault();
        }
      };

      document.addEventListener("visibilitychange", onVisibility);
      window.addEventListener("blur", onBlur);
      document.addEventListener("fullscreenchange", onFullscreenChange);
      document.addEventListener("keydown", onKeyDown);
      document.addEventListener("mousemove", recordActivity);
      document.addEventListener("click", recordActivity);

      cleanup = () => {
        document.removeEventListener("visibilitychange", onVisibility);
        window.removeEventListener("blur", onBlur);
        document.removeEventListener("fullscreenchange", onFullscreenChange);
        document.removeEventListener("keydown", onKeyDown);
        document.removeEventListener("mousemove", recordActivity);
        document.removeEventListener("click", recordActivity);
      };
    }, 2500); // grace period on mount

    return () => {
      clearTimeout(tid);
      cleanup?.();
      listenersReady.current = false;
    };
  }, [addWarning, recordActivity]);

  // ── Security: inactivity detection ─────────────────────────────────────────
  useEffect(() => {
    if (submitPhase !== "idle") return;
    const LIMIT = 90 * 1000;
    const id = setInterval(() => {
      if (Date.now() - lastActivityRef.current > LIMIT) {
        addWarning("inactivity", "Inactivity Detected",
          "No interaction has been detected for an extended period. Prolonged inactivity during an examination may be flagged for review.");
        lastActivityRef.current = Date.now();
      }
    }, 30 * 1000);
    return () => clearInterval(id);
  }, [submitPhase, addWarning]);

  // ── Security: request fullscreen on mount ───────────────────────────────────
  useEffect(() => {
    const tryFS = async () => {
      try {
        await document.documentElement.requestFullscreen();
        setIsFullscreen(true);
      } catch { /* fullscreen not available in this environment */ }
    };
    tryFS();
    return () => {
      if (document.fullscreenElement && document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      }
    };
  }, []);

  // ── Security: simulated periodic connection check ───────────────────────────
  useEffect(() => {
    const id = setInterval(() => {
      setConnStatus("checking");
      setTimeout(() => setConnStatus("connected"), 800);
    }, 40 * 1000);
    return () => clearInterval(id);
  }, []);

  // ── Exam controls ───────────────────────────────────────────────────────────
  const selectAnswer = (optionIdx: number) => {
    recordActivity();
    setAnswers((v) => ({ ...v, [current]: optionIdx }));
  };

  const toggleFlag = () => {
    setFlagged((prev) => {
      const next = new Set(prev);
      if (next.has(current)) next.delete(current); else next.add(current);
      return next;
    });
  };

  const handleSubmitRequest = () => setSubmitPhase("review");

  const handleConfirmSubmit = () => {
    setSubmitPhase("submitting");
    setSessionActive(false);

    // Build attempt from actual answers
    const durationTaken = Math.round((Date.now() - examStartRef.current) / 1000);
    const attemptAnswers: AttemptAnswer[] = questions.map((q, idx) => ({
      questionId: q.id,
      questionText: q.text,
      options: q.options,
      selectedOption: answers[idx] !== undefined ? answers[idx] : null,
      correctOption: q.correct,
      marksPerQuestion: q.marks,
    }));

    // Calculate score: +marks for correct, -0.5 for wrong, 0 for skipped
    let score = 0;
    for (const a of attemptAnswers) {
      if (a.selectedOption === null) continue;
      if (a.selectedOption === a.correctOption) {
        score += a.marksPerQuestion;
      } else {
        score -= 0.5;
      }
    }
    score = Math.max(0, Math.round(score * 10) / 10);
    const maxScore = questions.reduce((s, q) => s + q.marks, 0);
    const pct = maxScore > 0 ? Math.round((score / maxScore) * 100) : 0;
    const grade = calcGrade(pct);

    const attemptId = "ATT-" + Date.now().toString(36).toUpperCase() + "-" + Math.random().toString(36).slice(2, 5).toUpperCase();
    const attempt: TestAttempt = {
      id: attemptId,
      studentId: user.studentId,
      studentName: user.name,
      testId,
      testCode: test?.code ?? "",
      testTitle: test?.title ?? test?.section ?? "",
      courseCode: test?.code?.replace(/-\w+$/, "") ?? "",
      submittedAt: new Date().toISOString(),
      durationSeconds: durationTaken,
      answers: attemptAnswers,
      score,
      maxScore,
      grade,
      securityEventCount: securityLog.length,
    };
    saveAttempt(attempt);
    setSavedAttemptId(attemptId);

    setTimeout(() => setSubmitPhase("done"), 1600);
  };

  const handleExitRequest = () => setShowExitModal(true);
  const handleConfirmExit = () => { setShowExitModal(false); onExit(); };

  // ── Done screen ─────────────────────────────────────────────────────────────
  if (submitPhase === "done") {
    const maxScore = questions.reduce((s, q) => s + q.marks, 0);
    const submissionId = "SUB-" + Date.now().toString(36).toUpperCase();
    const submitTime = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    const submitDate = new Date().toLocaleDateString([], { day: "2-digit", month: "short", year: "numeric" });

    return (
      <div className="min-h-screen flex items-center justify-center p-6" style={{ background: "var(--color-bg-base)" }}>
        <div className="w-full max-w-[520px] space-y-4">
          {/* Submission receipt */}
          <div className="rounded-lg p-6 space-y-5" style={{ background: "var(--color-bg-card)", border: "1px solid var(--color-border)" }}>
            {/* Header */}
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-full flex items-center justify-center shrink-0" style={{ background: "var(--color-success-bg)", border: "1px solid var(--color-success)44" }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--color-success)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
              </div>
              <div>
                <div className="text-base font-semibold mb-0.5" style={{ color: "var(--color-text-primary)" }}>Examination Submitted</div>
                <div className="text-xs" style={{ color: "var(--color-text-muted)" }}>Your responses have been recorded and the session is now closed.</div>
              </div>
            </div>

            {/* Submission details */}
            <div className="rounded p-4 space-y-2.5" style={{ background: "var(--color-bg-elevated)" }}>
              <DoneRow label="Submission ID" value={submissionId} mono />
              <DoneRow label="Test" value={`${test?.code ?? ""} - ${test?.section ?? ""}`} />
              <DoneRow label="Student ID" value={user.studentId} mono />
              <DoneRow label="Submitted at" value={`${submitDate}, ${submitTime}`} mono />
              <div className="pt-2 mt-1" style={{ borderTop: "1px solid var(--color-border-subtle)" }}>
                <DoneRow label="Questions answered" value={`${answeredCount} / ${totalQ}`} mono color="var(--color-success)" />
                <div className="mt-2">
                  <DoneRow label="Questions skipped" value={String(unansweredCount)} mono color={unansweredCount > 0 ? "var(--color-warning)" : undefined} />
                </div>
                <div className="mt-2">
                  <DoneRow label="Maximum marks" value={String(maxScore)} mono />
                </div>
              </div>
            </div>

            {/* Security summary */}
            {securityLog.length > 0 && (
              <div className="rounded p-3.5" style={{ background: "var(--color-warning-bg)", border: "1px solid var(--color-warning)44" }}>
                <div className="flex items-center gap-2 mb-1.5">
                  <ShieldAlertIcon color="var(--color-warning)" size={13} />
                  <span className="text-xs font-semibold" style={{ color: "var(--color-warning)" }}>
                    {securityLog.length} session event{securityLog.length !== 1 ? "s" : ""} recorded
                  </span>
                </div>
                <p className="text-xs leading-relaxed" style={{ color: "var(--color-warning)", opacity: 0.85 }}>
                  Security events detected during this session have been included in your submission report and may be reviewed by your instructor.
                </p>
              </div>
            )}

            {/* Info box */}
            <div className="rounded p-3 text-xs" style={{ background: "var(--color-accent-muted)", border: "1px solid var(--color-accent)33", color: "var(--color-text-secondary)" }}>
              Results will be published after evaluation. You will be notified via your institutional email address.
            </div>

            <button onClick={() => onComplete(savedAttemptId ?? "")} className="w-full text-sm font-semibold rounded py-2.5" style={{ background: "var(--color-accent)", color: "white" }}>
              View Results &rarr;
            </button>
          </div>
        </div>
      </div>
    );
  }

  const q = questions[current];
  if (!q || !test) return null;

  const qState = (idx: number): QState => {
    if (idx === current) return "current";
    if (flagged.has(idx)) return "flagged";
    if (answers[idx] !== undefined) return "answered";
    return "unanswered";
  };

  const timerColor = isCritical ? "var(--color-danger)" : isWarning ? "var(--color-warning)" : "var(--color-text-primary)";
  const timerBg = isCritical ? "var(--color-danger-bg)" : isWarning ? "var(--color-warning-bg)" : "var(--color-bg-elevated)";
  const timerBorder = isCritical ? "var(--color-danger)" : isWarning ? "var(--color-warning)" : "var(--color-border)";

  return (
    <div
      className="flex flex-col select-none"
      style={{ height: "100vh", background: "var(--color-bg-base)" }}
      onMouseMove={recordActivity}
      onClick={recordActivity}
    >
      {/* ── Security warning modal ── */}
      {activeWarn && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.75)" }}>
          <div className="w-full max-w-[420px] rounded-lg overflow-hidden shadow-2xl" style={{ background: "var(--color-bg-card)", border: "1px solid var(--color-border)" }}>
            {/* Modal header */}
            <div className="flex items-center gap-3 px-5 py-4" style={{ background: "var(--color-warning-bg)", borderBottom: "1px solid var(--color-warning)44" }}>
              <ShieldAlertIcon color="var(--color-warning)" size={18} />
              <div>
                <div className="text-sm font-bold" style={{ color: "var(--color-warning)" }}>{activeWarn.label}</div>
                <div className="text-[10px] font-medium uppercase tracking-widest" style={{ color: "var(--color-warning)", opacity: 0.8 }}>
                  Security Event #{warnCountRef.current} &mdash; {activeWarn.time}
                </div>
              </div>
            </div>

            <div className="px-5 py-4 space-y-4">
              <p className="text-sm leading-relaxed" style={{ color: "var(--color-text-secondary)" }}>
                {activeWarn.detail}
              </p>

              {/* Warning count */}
              <div className="rounded p-3 flex items-center gap-3" style={{ background: "var(--color-bg-elevated)" }}>
                <div className="text-2xl font-bold" style={{ color: "var(--color-warning)", fontFamily: "var(--font-mono)" }}>{warnCountRef.current}</div>
                <div className="text-xs leading-snug" style={{ color: "var(--color-text-muted)" }}>
                  event{warnCountRef.current !== 1 ? "s" : ""} logged this session.<br />
                  Events are transmitted to the examination server.
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setActiveWarn(null);
                    // Try to re-enter fullscreen if it was exited
                    if (activeWarn.type === "fullscreen_exit" && document.documentElement.requestFullscreen) {
                      document.documentElement.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
                    }
                  }}
                  className="flex-1 text-sm font-semibold rounded py-2.5"
                  style={{ background: "var(--color-accent)", color: "white" }}
                >
                  I Understand &mdash; Return to Exam
                </button>
              </div>

              <p className="text-[10px] text-center" style={{ color: "var(--color-text-muted)" }}>
                Do not leave the examination window. Additional violations increase your security risk score.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ── Exit confirmation modal ── */}
      {showExitModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.75)" }}>
          <div className="w-full max-w-[400px] rounded-lg overflow-hidden shadow-2xl" style={{ background: "var(--color-bg-card)", border: "1px solid var(--color-border)" }}>
            <div className="flex items-center gap-3 px-5 py-4" style={{ background: "var(--color-danger-bg)", borderBottom: "1px solid var(--color-danger)44" }}>
              <DangerIcon />
              <div className="text-sm font-bold" style={{ color: "var(--color-danger)" }}>Exit Examination?</div>
            </div>
            <div className="px-5 py-4 space-y-4">
              <p className="text-sm leading-relaxed" style={{ color: "var(--color-text-secondary)" }}>
                Exiting will <strong style={{ color: "var(--color-text-primary)" }}>abandon your current examination session</strong>. Your progress and answers will not be saved. This action cannot be undone.
              </p>
              <div className="rounded p-3 text-xs" style={{ background: "var(--color-warning-bg)", border: "1px solid var(--color-warning)44", color: "var(--color-warning)" }}>
                An early exit event will be recorded in your session log and reported to the examination system.
              </div>
              <div className="flex gap-2">
                <button onClick={() => setShowExitModal(false)} className="flex-1 text-sm font-medium rounded py-2.5" style={{ border: "1px solid var(--color-border)", color: "var(--color-text-secondary)", background: "transparent" }}>
                  Stay in Exam
                </button>
                <button onClick={handleConfirmExit} className="flex-1 text-sm font-semibold rounded py-2.5" style={{ background: "var(--color-danger)", color: "white" }}>
                  Exit Exam
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Submit review modal ── */}
      {submitPhase === "review" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.75)" }}>
          <div className="w-full max-w-[440px] rounded-lg overflow-hidden shadow-2xl" style={{ background: "var(--color-bg-card)", border: "1px solid var(--color-border)" }}>
            <div className="px-5 py-4" style={{ borderBottom: "1px solid var(--color-border-subtle)" }}>
              <div className="text-sm font-semibold mb-0.5" style={{ color: "var(--color-text-primary)" }}>Submit Examination</div>
              <div className="text-xs" style={{ color: "var(--color-text-muted)" }}>Review your attempt before final submission. This cannot be undone.</div>
            </div>

            <div className="px-5 py-4 space-y-4">
              {/* Progress breakdown */}
              <div className="space-y-2">
                <SubmitStatRow color="var(--color-success)" label="Answered" value={answeredCount} total={totalQ} />
                <SubmitStatRow color={unansweredCount > 0 ? "var(--color-warning)" : "var(--color-text-muted)"} label="Unanswered" value={unansweredCount} total={totalQ} />
                <SubmitStatRow color="var(--color-warning)" label="Flagged for review" value={flaggedCount} total={totalQ} />
              </div>

              {/* Unanswered warning */}
              {unansweredCount > 0 && (
                <div className="rounded p-3 text-xs flex items-start gap-2" style={{ background: "var(--color-warning-bg)", border: "1px solid var(--color-warning)44", color: "var(--color-warning)" }}>
                  <WarnIcon />
                  <span>
                    <strong>{unansweredCount} question{unansweredCount !== 1 ? "s" : ""} unanswered.</strong>{" "}
                    Unanswered questions receive zero marks and do not incur a penalty.
                  </span>
                </div>
              )}

              {/* Security summary */}
              {securityLog.length > 0 ? (
                <div className="rounded p-3 text-xs" style={{ background: "var(--color-warning-bg)", border: "1px solid var(--color-warning)44" }}>
                  <div className="flex items-center gap-2 mb-1" style={{ color: "var(--color-warning)" }}>
                    <ShieldAlertIcon color="var(--color-warning)" size={12} />
                    <strong>{securityLog.length} security event{securityLog.length !== 1 ? "s" : ""} recorded this session</strong>
                  </div>
                  <p style={{ color: "var(--color-warning)", opacity: 0.85 }}>
                    These events will be included in your submission report.
                  </p>
                </div>
              ) : (
                <div className="rounded p-3 text-xs flex items-center gap-2" style={{ background: "var(--color-success-bg)", border: "1px solid var(--color-success)44" }}>
                  <ShieldOkIcon />
                  <span style={{ color: "var(--color-success)" }}>No security events recorded this session.</span>
                </div>
              )}

              <div className="flex gap-2">
                <button onClick={() => setSubmitPhase("idle")} className="flex-1 text-sm rounded py-2.5" style={{ border: "1px solid var(--color-border)", color: "var(--color-text-secondary)", background: "transparent" }}>
                  Continue Test
                </button>
                <button onClick={handleConfirmSubmit} className="flex-1 text-sm font-semibold rounded py-2.5" style={{ background: "var(--color-success)", color: "white" }}>
                  Submit Examination
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Submitting overlay ── */}
      {submitPhase === "submitting" && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-4" style={{ background: "rgba(0,0,0,0.85)" }}>
          <div className="animate-spin w-10 h-10 rounded-full" style={{ border: "3px solid var(--color-border)", borderTop: "3px solid var(--color-accent)" }} />
          <div className="text-sm font-semibold" style={{ color: "var(--color-text-primary)" }}>Submitting examination...</div>
          <div className="text-xs" style={{ color: "var(--color-text-muted)" }}>Encrypting and transmitting your responses securely. Do not close this window.</div>
        </div>
      )}

      {/* ── Integrity panel dropdown ── */}
      {showIntegrityPanel && (
        <div
          className="fixed z-40 rounded-lg shadow-2xl p-4 w-72"
          style={{ top: 60, right: 16, background: "var(--color-bg-card)", border: "1px solid var(--color-border)" }}
        >
          <div className="text-[10px] font-semibold uppercase tracking-widest mb-3" style={{ color: "var(--color-text-muted)", letterSpacing: "0.1em" }}>
            Exam Integrity Status
          </div>
          <div className="space-y-2.5">
            <IntegrityRow label="Security mode" value="Active" valueColor="var(--color-success)" dot="green" />
            <IntegrityRow label="Fullscreen" value={isFullscreen ? "Enabled" : "Disabled"} valueColor={isFullscreen ? "var(--color-success)" : "var(--color-warning)"} dot={isFullscreen ? "green" : "yellow"} />
            <IntegrityRow label="Connection" value={connStatus === "connected" ? "Connected" : "Checking..."} valueColor={connStatus === "connected" ? "var(--color-success)" : "var(--color-warning)"} dot={connStatus === "connected" ? "green" : "yellow"} />
            <IntegrityRow label="Session" value={sessionActive ? "Active" : "Closed"} valueColor={sessionActive ? "var(--color-success)" : "var(--color-danger)"} dot={sessionActive ? "green" : "red"} />
            <div className="pt-2 mt-1" style={{ borderTop: "1px solid var(--color-border-subtle)" }}>
              <IntegrityRow
                label="Events logged"
                value={String(securityLog.length)}
                valueColor={securityLog.length > 0 ? "var(--color-warning)" : "var(--color-success)"}
                dot={securityLog.length > 0 ? "yellow" : "green"}
              />
            </div>
          </div>

          {securityLog.length > 0 && (
            <div className="mt-3 pt-3" style={{ borderTop: "1px solid var(--color-border-subtle)" }}>
              <div className="text-[10px] font-semibold uppercase tracking-widest mb-2" style={{ color: "var(--color-text-muted)" }}>Recent Events</div>
              <div className="space-y-1.5">
                {securityLog.slice(-3).map((w, i) => (
                  <div key={i} className="flex items-start justify-between gap-2 text-[10px]">
                    <span style={{ color: "var(--color-warning)" }}>{w.label}</span>
                    <span style={{ color: "var(--color-text-muted)", fontFamily: "var(--font-mono)" }}>{w.time}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <button onClick={() => setShowIntegrityPanel(false)} className="mt-3 w-full text-xs py-1.5 rounded" style={{ border: "1px solid var(--color-border)", color: "var(--color-text-muted)", background: "transparent" }}>
            Close
          </button>
        </div>
      )}

      {/* ── Top bar ── */}
      <header
        className="flex items-center justify-between px-5 shrink-0 gap-4"
        style={{ height: 56, background: "var(--color-bg-surface)", borderBottom: "1px solid var(--color-border)", zIndex: 10 }}
      >
        {/* Left: brand + secure badge + test info */}
        <div className="flex items-center gap-3 min-w-0 shrink-0">
          <div className="flex items-center gap-2 shrink-0">
            <div className="w-6 h-6 rounded flex items-center justify-center" style={{ background: "var(--color-accent)" }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg>
            </div>
            {/* Secure exam badge */}
            <div className="flex items-center gap-1.5 px-2 py-1 rounded" style={{ background: "var(--color-success-bg)", border: "1px solid var(--color-success)44" }}>
              <div className="w-1.5 h-1.5 rounded-full" style={{ background: "var(--color-success)" }} />
              <span className="text-[9px] font-bold uppercase tracking-widest" style={{ color: "var(--color-success)", letterSpacing: "0.1em" }}>Secure Exam</span>
            </div>
          </div>

          <div className="h-4 w-px shrink-0" style={{ background: "var(--color-border)" }} />

          <div className="min-w-0 hidden sm:block">
            <div className="text-xs font-medium truncate" style={{ fontFamily: "var(--font-mono)", color: "var(--color-text-muted)" }}>
              {test.code}
            </div>
            <div className="text-xs font-semibold truncate" style={{ color: "var(--color-text-primary)" }}>
              {test.section}
            </div>
          </div>
        </div>

        {/* Center: progress */}
        <div className="flex items-center gap-3 flex-1 justify-center min-w-0 max-w-[280px]">
          <span className="text-xs shrink-0" style={{ color: "var(--color-text-muted)", fontFamily: "var(--font-mono)" }}>
            {current + 1}/{totalQ}
          </span>
          <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: "var(--color-bg-elevated)" }}>
            <div className="h-full rounded-full transition-all" style={{ width: `${(answeredCount / totalQ) * 100}%`, background: "var(--color-success)" }} />
          </div>
          <span className="text-xs shrink-0" style={{ color: "var(--color-text-muted)", fontFamily: "var(--font-mono)" }}>
            {answeredCount}/{totalQ}
          </span>
        </div>

        {/* Right: timer + integrity + exit */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Timer */}
          <div
            className="flex items-center gap-1.5 px-3 py-1.5 rounded"
            style={{ background: timerBg, border: `1px solid ${timerBorder}` }}
          >
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke={timerColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
            </svg>
            <span className="text-sm font-bold" style={{ fontFamily: "var(--font-mono)", color: timerColor, letterSpacing: "0.06em" }}>
              {mins}:{secs}
            </span>
          </div>

          {/* Integrity panel toggle */}
          <button
            onClick={() => setShowIntegrityPanel((v) => !v)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded transition-all"
            style={{
              background: securityLog.length > 0 ? "var(--color-warning-bg)" : "transparent",
              border: `1px solid ${securityLog.length > 0 ? "var(--color-warning)55" : "var(--color-border)"}`,
              color: securityLog.length > 0 ? "var(--color-warning)" : "var(--color-text-muted)",
            }}
            title="Exam integrity status"
          >
            <ShieldAlertIcon color={securityLog.length > 0 ? "var(--color-warning)" : "var(--color-text-muted)"} size={13} />
            {securityLog.length > 0 && (
              <span className="text-[10px] font-bold" style={{ fontFamily: "var(--font-mono)" }}>{securityLog.length}</span>
            )}
          </button>

          {/* Exit */}
          <button
            onClick={handleExitRequest}
            className="text-xs rounded px-3 py-1.5 transition-all"
            style={{ border: "1px solid var(--color-danger)44", color: "var(--color-danger)", background: "transparent" }}
          >
            Exit
          </button>
        </div>
      </header>

      {/* ── Security status bar ── */}
      <div
        className="flex items-center justify-between px-5 shrink-0 text-[10px]"
        style={{ height: 26, background: "var(--color-bg-elevated)", borderBottom: "1px solid var(--color-border-subtle)" }}
      >
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5 font-semibold uppercase tracking-widest" style={{ color: "var(--color-success)", letterSpacing: "0.1em" }}>
            <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: "var(--color-success)" }} />
            Examination in Progress
          </span>
          <span style={{ color: "var(--color-border)" }}>|</span>
          <span style={{ color: "var(--color-text-muted)" }}>
            {connStatus === "connected" ? "Connected" : "Checking connection..."}
          </span>
        </div>
        <div style={{ color: "var(--color-text-muted)", fontFamily: "var(--font-mono)" }}>
          {user.studentId} &mdash; {user.name}
        </div>
      </div>

      {/* ── Body ── */}
      <div className="flex flex-1 overflow-hidden">

        {/* Question panel */}
        <main className="flex-1 overflow-y-auto flex flex-col">
          <div className="flex-1 px-6 py-6 max-w-[760px] w-full mx-auto">

            {/* Question header */}
            <div className="flex items-start justify-between mb-5 gap-4">
              <div className="flex items-center gap-3">
                <span className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold shrink-0" style={{ background: "var(--color-accent)", color: "white" }}>
                  {current + 1}
                </span>
                <div>
                  <div className="text-[10px] uppercase tracking-widest font-semibold" style={{ color: "var(--color-text-muted)", letterSpacing: "0.1em" }}>
                    Question {current + 1} of {totalQ}
                  </div>
                  <div className="text-[10px] mt-0.5" style={{ color: "var(--color-text-muted)" }}>
                    {q.marks} mark{q.marks !== 1 ? "s" : ""} &middot; Negative: -0.5 per wrong answer
                  </div>
                </div>
              </div>

              <button
                onClick={toggleFlag}
                className="flex items-center gap-1.5 text-xs rounded px-3 py-1.5 transition-all shrink-0"
                style={{
                  background: flagged.has(current) ? "var(--color-warning-bg)" : "transparent",
                  border: `1px solid ${flagged.has(current) ? "var(--color-warning)" : "var(--color-border)"}`,
                  color: flagged.has(current) ? "var(--color-warning)" : "var(--color-text-muted)",
                }}
              >
                <FlagSVG filled={flagged.has(current)} />
                {flagged.has(current) ? "Flagged" : "Flag for review"}
              </button>
            </div>

            {/* Question text */}
            <p className="text-base leading-relaxed mb-6" style={{ color: "var(--color-text-primary)", fontWeight: 450 }}>
              {q.text}
            </p>

            {/* Options */}
            <div className="space-y-2.5">
              {q.options.map((opt, oi) => {
                const isSelected = answers[current] === oi;
                return (
                  <button
                    key={oi}
                    onClick={() => selectAnswer(oi)}
                    className="w-full text-left flex items-start gap-3.5 rounded px-4 py-3.5 transition-all"
                    style={{
                      background: isSelected ? "var(--color-accent-muted)" : "var(--color-bg-card)",
                      border: `1.5px solid ${isSelected ? "var(--color-accent)" : "var(--color-border)"}`,
                    }}
                  >
                    <div
                      className="w-5 h-5 rounded-full shrink-0 flex items-center justify-center mt-0.5"
                      style={{ border: `2px solid ${isSelected ? "var(--color-accent)" : "var(--color-border)"}` }}
                    >
                      {isSelected && <div className="w-2.5 h-2.5 rounded-full" style={{ background: "var(--color-accent)" }} />}
                    </div>
                    <div className="flex items-start gap-3 flex-1">
                      <span className="text-xs font-bold shrink-0 mt-0.5" style={{ color: isSelected ? "var(--color-accent)" : "var(--color-text-muted)", fontFamily: "var(--font-mono)" }}>
                        {String.fromCharCode(65 + oi)}
                      </span>
                      <span className="text-sm leading-relaxed" style={{ color: isSelected ? "var(--color-text-primary)" : "var(--color-text-secondary)" }}>
                        {opt}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>

            {answers[current] !== undefined && (
              <button
                onClick={() => setAnswers((v) => { const n = { ...v }; delete n[current]; return n; })}
                className="mt-3 text-xs transition-all"
                style={{ color: "var(--color-text-muted)" }}
              >
                Clear selection
              </button>
            )}
          </div>

          {/* Bottom navigation */}
          <div className="px-6 py-3 shrink-0 flex items-center justify-between" style={{ borderTop: "1px solid var(--color-border-subtle)", background: "var(--color-bg-surface)" }}>
            <button
              onClick={() => setCurrent((v) => Math.max(0, v - 1))}
              disabled={current === 0}
              className="flex items-center gap-1.5 text-sm rounded px-4 py-2 transition-all"
              style={{
                border: "1px solid var(--color-border)",
                color: current === 0 ? "var(--color-text-muted)" : "var(--color-text-secondary)",
                background: "transparent",
                opacity: current === 0 ? 0.4 : 1,
                cursor: current === 0 ? "not-allowed" : "pointer",
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
              Previous
            </button>

            <button
              onClick={() => setNavOpen((v) => !v)}
              className="flex items-center gap-1.5 text-xs rounded px-3 py-2 lg:hidden"
              style={{ border: "1px solid var(--color-border)", color: "var(--color-text-muted)", background: "transparent" }}
            >
              <GridSVG />
              {navOpen ? "Hide" : "Navigator"}
            </button>

            <div className="flex items-center gap-2">
              {current < totalQ - 1 ? (
                <button
                  onClick={() => setCurrent((v) => Math.min(totalQ - 1, v + 1))}
                  className="flex items-center gap-1.5 text-sm font-medium rounded px-4 py-2"
                  style={{ background: "var(--color-accent)", color: "white" }}
                >
                  Next
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
                </button>
              ) : (
                <button onClick={handleSubmitRequest} className="flex items-center gap-1.5 text-sm font-semibold rounded px-5 py-2" style={{ background: "var(--color-success)", color: "white" }}>
                  Submit Test
                </button>
              )}
            </div>
          </div>
        </main>

        {/* ── Question navigator ── */}
        <aside
          className={`shrink-0 overflow-y-auto flex flex-col transition-all ${navOpen ? "w-[220px]" : "w-0 overflow-hidden"}`}
          style={{ borderLeft: navOpen ? "1px solid var(--color-border)" : "none", background: "var(--color-bg-surface)" }}
        >
          <div className="p-4 flex-1 flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <div className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: "var(--color-text-muted)", letterSpacing: "0.1em" }}>
                Navigator
              </div>
              <button onClick={() => setNavOpen(false)} className="lg:hidden" style={{ color: "var(--color-text-muted)" }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-1.5 mb-4">
              <MiniStat label="Answered" value={answeredCount} color="var(--color-success)" />
              <MiniStat label="Skipped" value={unansweredCount} color="var(--color-text-muted)" />
              <MiniStat label="Flagged" value={flaggedCount} color="var(--color-warning)" />
              <MiniStat label="Remaining" value={totalQ - answeredCount} color="var(--color-text-muted)" />
            </div>

            {/* Progress */}
            <div className="mb-4">
              <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "var(--color-bg-elevated)" }}>
                <div className="h-full rounded-full transition-all" style={{ width: `${(answeredCount / totalQ) * 100}%`, background: "var(--color-success)" }} />
              </div>
              <div className="text-[10px] mt-1 text-right" style={{ color: "var(--color-text-muted)", fontFamily: "var(--font-mono)" }}>
                {Math.round((answeredCount / totalQ) * 100)}% complete
              </div>
            </div>

            {/* Question grid */}
            <div className="grid grid-cols-5 gap-1 mb-4">
              {questions.map((_, idx) => {
                const s = qState(idx);
                return (
                  <button
                    key={idx}
                    onClick={() => setCurrent(idx)}
                    title={`Q${idx + 1}${flagged.has(idx) ? " (flagged)" : ""}`}
                    className="flex items-center justify-center rounded text-xs font-semibold transition-all"
                    style={{
                      height: 30,
                      background: s === "current" ? "var(--color-accent)" : s === "answered" ? "var(--color-accent-muted)" : s === "flagged" ? "var(--color-warning-bg)" : "var(--color-bg-elevated)",
                      border: s === "current" ? "1.5px solid var(--color-accent)" : s === "answered" ? "1.5px solid var(--color-accent)88" : s === "flagged" ? "1.5px solid var(--color-warning)" : "1px solid var(--color-border)",
                      color: s === "current" ? "white" : s === "answered" ? "var(--color-accent)" : s === "flagged" ? "var(--color-warning)" : "var(--color-text-muted)",
                      fontFamily: "var(--font-mono)",
                    }}
                  >
                    {idx + 1}
                  </button>
                );
              })}
            </div>

            {/* Legend */}
            <div className="space-y-1.5 pb-4" style={{ borderBottom: "1px solid var(--color-border-subtle)" }}>
              <LegendItem color="var(--color-accent)" bg="var(--color-accent)" label="Current" />
              <LegendItem color="var(--color-accent)" bg="var(--color-accent-muted)" label="Answered" />
              <LegendItem color="var(--color-warning)" bg="var(--color-warning-bg)" label="Flagged" />
              <LegendItem color="var(--color-text-muted)" bg="var(--color-bg-elevated)" label="Unanswered" />
            </div>

            {/* Security mini-summary */}
            <div className="mt-3 mb-4">
              <div className="text-[10px] font-semibold uppercase tracking-widest mb-2" style={{ color: "var(--color-text-muted)", letterSpacing: "0.1em" }}>
                Session Security
              </div>
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-[10px]">
                  <span style={{ color: "var(--color-text-muted)" }}>Events logged</span>
                  <span style={{ fontFamily: "var(--font-mono)", color: securityLog.length > 0 ? "var(--color-warning)" : "var(--color-success)" }}>
                    {securityLog.length}
                  </span>
                </div>
                <div className="flex items-center justify-between text-[10px]">
                  <span style={{ color: "var(--color-text-muted)" }}>Connection</span>
                  <span style={{ color: "var(--color-success)" }}>{connStatus === "connected" ? "OK" : "..."}</span>
                </div>
              </div>
            </div>

            <button
              onClick={handleSubmitRequest}
              className="w-full text-sm font-semibold rounded py-2.5 transition-all mt-auto"
              style={{ background: "var(--color-success)", color: "white" }}
            >
              Submit Test
            </button>
          </div>
        </aside>

        {!navOpen && (
          <button
            onClick={() => setNavOpen(true)}
            className="hidden lg:flex flex-col items-center justify-center w-8 shrink-0 gap-1"
            style={{ background: "var(--color-bg-surface)", borderLeft: "1px solid var(--color-border)", color: "var(--color-text-muted)" }}
            title="Show navigator"
          >
            <GridSVG />
          </button>
        )}
      </div>
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function DoneRow({ label, value, mono, color }: { label: string; value: string; mono?: boolean; color?: string }) {
  return (
    <div className="flex justify-between text-xs">
      <span style={{ color: "var(--color-text-muted)" }}>{label}</span>
      <span style={{ fontFamily: mono ? "var(--font-mono)" : undefined, color: color ?? "var(--color-text-secondary)" }}>{value}</span>
    </div>
  );
}

function SubmitStatRow({ color, label, value, total }: { color: string; label: string; value: number; total: number }) {
  return (
    <div className="flex items-center gap-3">
      <div className="w-3 h-3 rounded shrink-0" style={{ background: color, opacity: 0.7 }} />
      <span className="flex-1 text-xs" style={{ color: "var(--color-text-secondary)" }}>{label}</span>
      <span className="text-xs font-semibold" style={{ fontFamily: "var(--font-mono)", color }}>{value} / {total}</span>
    </div>
  );
}

function IntegrityRow({ label, value, valueColor, dot }: { label: string; value: string; valueColor: string; dot: "green" | "yellow" | "red" }) {
  const dotColor = dot === "green" ? "var(--color-success)" : dot === "yellow" ? "var(--color-warning)" : "var(--color-danger)";
  return (
    <div className="flex items-center justify-between text-xs">
      <span style={{ color: "var(--color-text-muted)" }}>{label}</span>
      <div className="flex items-center gap-1.5">
        <div className="w-1.5 h-1.5 rounded-full" style={{ background: dotColor }} />
        <span style={{ color: valueColor, fontFamily: "var(--font-mono)" }}>{value}</span>
      </div>
    </div>
  );
}

function MiniStat({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="rounded px-2 py-2 text-center" style={{ background: "var(--color-bg-elevated)" }}>
      <div className="text-base font-bold" style={{ color, fontFamily: "var(--font-mono)" }}>{value}</div>
      <div className="text-[9px]" style={{ color: "var(--color-text-muted)" }}>{label}</div>
    </div>
  );
}

function LegendItem({ color, bg, label }: { color: string; bg: string; label: string }) {
  return (
    <div className="flex items-center gap-2">
      <div className="w-4 h-4 rounded shrink-0" style={{ background: bg, border: `1px solid ${color}88` }} />
      <span className="text-[10px]" style={{ color: "var(--color-text-muted)" }}>{label}</span>
    </div>
  );
}

function ShieldAlertIcon({ color, size }: { color: string; size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
      <line x1="12" y1="8" x2="12" y2="12"/>
      <line x1="12" y1="16" x2="12.01" y2="16"/>
    </svg>
  );
}

function ShieldOkIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--color-success)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
      <polyline points="9 12 11 14 15 10"/>
    </svg>
  );
}

function DangerIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--color-danger)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
      <line x1="12" y1="9" x2="12" y2="13"/>
      <line x1="12" y1="17" x2="12.01" y2="17"/>
    </svg>
  );
}

function WarnIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 mt-0.5">
      <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
      <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
    </svg>
  );
}

function FlagSVG({ filled }: { filled: boolean }) {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/>
      <line x1="4" y1="22" x2="4" y2="15"/>
    </svg>
  );
}

function GridSVG() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
      <rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/>
    </svg>
  );
}
