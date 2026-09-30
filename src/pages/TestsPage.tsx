import { useState } from "react";
import type { Page } from "../App";

// ─── Data ─────────────────────────────────────────────────────────────────────

export interface TestRecord {
  id: number;
  code: string;
  title: string;
  section: string;
  type: "Mid-Semester" | "Unit Test" | "Quiz" | "End-Semester";
  date: string;
  time: string;
  duration: string;
  questions: number;
  totalMarks: number;
  passingMarks: number;
  status: "available" | "upcoming" | "completed" | "missed";
  daysLeft: number;
  registered: boolean;
  syllabus: string[];
  instructions: string[];
}

export const ALL_TESTS: TestRecord[] = [
  {
    id: 1, code: "CS-301", title: "Data Structures & Algorithms", section: "Mid-Semester",
    type: "Mid-Semester", date: "Sep 11, 2024", time: "10:00 AM",
    duration: "90 min", questions: 50, totalMarks: 100, passingMarks: 40,
    status: "available", daysLeft: 0, registered: true,
    syllabus: ["Arrays and Linked Lists", "Stacks and Queues", "Trees and Graphs", "Sorting Algorithms", "Dynamic Programming"],
    instructions: [
      "The test consists of 50 multiple-choice questions.",
      "Each question carries 2 marks. There is a negative marking of 0.5 marks for incorrect answers.",
      "Do not refresh the page once the test has started.",
      "Ensure stable internet connection before starting.",
      "Unanswered questions will not incur a penalty.",
    ],
  },
  {
    id: 2, code: "CS-311", title: "Database Management Systems", section: "Unit Test 2",
    type: "Unit Test", date: "Sep 19, 2024", time: "2:00 PM",
    duration: "60 min", questions: 40, totalMarks: 80, passingMarks: 32,
    status: "upcoming", daysLeft: 8, registered: true,
    syllabus: ["Relational Algebra", "SQL Queries", "Normalisation (1NF–BCNF)", "Transactions and ACID", "Indexing and Hashing"],
    instructions: [
      "40 questions, 2 marks each.",
      "Negative marking: 0.5 marks per wrong answer.",
      "Timer starts immediately upon beginning the test.",
      "You may review and change answers before final submission.",
    ],
  },
  {
    id: 3, code: "CS-321", title: "Operating Systems Fundamentals", section: "Mid-Semester",
    type: "Mid-Semester", date: "Sep 23, 2024", time: "11:00 AM",
    duration: "75 min", questions: 45, totalMarks: 90, passingMarks: 36,
    status: "upcoming", daysLeft: 12, registered: false,
    syllabus: ["Process Management", "CPU Scheduling", "Memory Management", "Virtual Memory", "File Systems"],
    instructions: [
      "45 questions, 2 marks each.",
      "Negative marking of 0.5 marks per wrong answer.",
      "The test will auto-submit when time expires.",
    ],
  },
  {
    id: 4, code: "CS-331", title: "Computer Networks", section: "Mid-Semester",
    type: "Mid-Semester", date: "Sep 3, 2024", time: "9:30 AM",
    duration: "60 min", questions: 50, totalMarks: 100, passingMarks: 40,
    status: "completed", daysLeft: 0, registered: true,
    syllabus: ["OSI and TCP/IP Model", "Data Link Layer", "Network Layer", "Transport Layer", "Application Layer Protocols"],
    instructions: [],
  },
  {
    id: 5, code: "MA-201", title: "Discrete Mathematics", section: "Unit Test 2",
    type: "Unit Test", date: "Aug 28, 2024", time: "3:00 PM",
    duration: "45 min", questions: 50, totalMarks: 100, passingMarks: 40,
    status: "completed", daysLeft: 0, registered: true,
    syllabus: ["Propositional Logic", "Predicate Logic", "Set Theory", "Graph Theory", "Combinatorics"],
    instructions: [],
  },
  {
    id: 6, code: "CS-301", title: "Data Structures & Algorithms", section: "Quiz 1",
    type: "Quiz", date: "Aug 20, 2024", time: "11:00 AM",
    duration: "30 min", questions: 40, totalMarks: 80, passingMarks: 32,
    status: "completed", daysLeft: 0, registered: true,
    syllabus: ["Arrays", "Linked Lists", "Complexity Analysis"],
    instructions: [],
  },
  {
    id: 7, code: "CS-321", title: "Operating Systems Fundamentals", section: "Quiz 1",
    type: "Quiz", date: "Aug 10, 2024", time: "10:00 AM",
    duration: "30 min", questions: 30, totalMarks: 60, passingMarks: 24,
    status: "missed", daysLeft: 0, registered: true,
    syllabus: ["Introduction to OS"],
    instructions: [],
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

type StatusFilter = "all" | "available" | "upcoming" | "completed";

const STATUS_META: Record<string, { label: string; bg: string; color: string }> = {
  available: { label: "Available", bg: "var(--color-success-bg)", color: "var(--color-success)" },
  upcoming:  { label: "Upcoming",  bg: "var(--color-accent-muted)", color: "var(--color-accent)" },
  completed: { label: "Completed", bg: "var(--color-bg-elevated)", color: "var(--color-text-muted)" },
  missed:    { label: "Missed",    bg: "var(--color-danger-bg)",  color: "var(--color-danger)" },
};

function StatusBadge({ status }: { status: string }) {
  const s = STATUS_META[status] || STATUS_META.upcoming;
  return (
    <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded uppercase tracking-wide" style={{ background: s.bg, color: s.color }}>
      {s.label}
    </span>
  );
}

function TypeBadge({ type }: { type: string }) {
  return (
    <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ background: "var(--color-bg-elevated)", color: "var(--color-text-muted)" }}>
      {type}
    </span>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

interface Props {
  onNavigate: (page: Page) => void;
  onOpenTest: (id: number) => void;
}

export default function TestsPage({ onNavigate, onOpenTest }: Props) {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [typeFilter, setTypeFilter] = useState<string>("All");
  const [search, setSearch] = useState("");
  const [registering, setRegistering] = useState<number | null>(null);
  const [registeredIds, setRegisteredIds] = useState<number[]>(
    ALL_TESTS.filter((t) => t.registered).map((t) => t.id)
  );

  const types = ["All", "Mid-Semester", "Unit Test", "Quiz", "End-Semester"];

  const handleRegister = (id: number) => {
    setRegistering(id);
    setTimeout(() => {
      setRegisteredIds((v) => [...v, id]);
      setRegistering(null);
    }, 900);
  };

  const counts: Record<StatusFilter, number> = {
    all: ALL_TESTS.length,
    available: ALL_TESTS.filter((t) => t.status === "available").length,
    upcoming: ALL_TESTS.filter((t) => t.status === "upcoming").length,
    completed: ALL_TESTS.filter((t) => t.status === "completed").length,
  };

  const filtered = ALL_TESTS.filter((t) => {
    const matchStatus = statusFilter === "all" || t.status === statusFilter;
    const matchType = typeFilter === "All" || t.type === typeFilter;
    const q = search.toLowerCase();
    const matchSearch = q === "" || t.title.toLowerCase().includes(q) || t.code.toLowerCase().includes(q) || t.section.toLowerCase().includes(q);
    return matchStatus && matchType && matchSearch;
  });

  // Group available tests to show them first / prominently
  const availableTests = filtered.filter((t) => t.status === "available");
  const otherTests = filtered.filter((t) => t.status !== "available");

  return (
    <div className="p-6 max-w-[1000px]">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-xl font-semibold mb-1" style={{ color: "var(--color-text-primary)" }}>Examinations</h1>
        <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
          View scheduled tests, register for upcoming examinations, and start available tests.
        </p>
      </div>

      {/* Available test alert */}
      {availableTests.length > 0 && statusFilter === "all" && (
        <div
          className="rounded p-4 flex items-center gap-3 mb-6"
          style={{ background: "var(--color-success-bg)", border: "1px solid var(--color-success)44" }}
        >
          <div className="w-8 h-8 rounded shrink-0 flex items-center justify-center" style={{ background: "var(--color-success)", opacity: 0.9 }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
          </div>
          <div className="flex-1">
            <div className="text-sm font-semibold" style={{ color: "var(--color-success)" }}>
              {availableTests.length === 1 ? "1 test is available to start now" : `${availableTests.length} tests are available to start now`}
            </div>
            <div className="text-xs" style={{ color: "var(--color-success)", opacity: 0.8 }}>
              {availableTests.map((t) => `${t.code} – ${t.section}`).join(", ")}
            </div>
          </div>
          <button
            onClick={() => setStatusFilter("available")}
            className="text-xs font-medium rounded px-3 py-1.5 shrink-0"
            style={{ background: "var(--color-success)", color: "white" }}
          >
            View Available
          </button>
        </div>
      )}

      {/* Filters row */}
      <div className="flex flex-wrap gap-3 mb-6">
        {/* Status tabs */}
        <div className="flex gap-1 p-1 rounded" style={{ background: "var(--color-bg-card)", border: "1px solid var(--color-border)" }}>
          {(["all", "available", "upcoming", "completed"] as StatusFilter[]).map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded capitalize transition-all"
              style={{
                background: statusFilter === s ? "var(--color-accent)" : "transparent",
                color: statusFilter === s ? "white" : "var(--color-text-secondary)",
              }}
            >
              {s === "all" ? "All" : s.charAt(0).toUpperCase() + s.slice(1)}
              <span
                className="px-1.5 py-0.5 rounded-full text-[10px]"
                style={{
                  background: statusFilter === s ? "rgba(255,255,255,0.2)" : "var(--color-bg-elevated)",
                  color: statusFilter === s ? "white" : "var(--color-text-muted)",
                }}
              >
                {counts[s]}
              </span>
            </button>
          ))}
        </div>

        {/* Type filter */}
        <div className="flex gap-1 p-1 rounded" style={{ background: "var(--color-bg-card)", border: "1px solid var(--color-border)" }}>
          {types.map((t) => (
            <button
              key={t}
              onClick={() => setTypeFilter(t)}
              className="px-3 py-1.5 text-xs font-medium rounded transition-all"
              style={{
                background: typeFilter === t ? "var(--color-bg-elevated)" : "transparent",
                color: typeFilter === t ? "var(--color-text-primary)" : "var(--color-text-muted)",
              }}
            >
              {t}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative flex-1 min-w-[180px]">
          <span className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--color-text-muted)" }}>
            <SearchIcon />
          </span>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search tests…"
            className="w-full rounded pl-8 pr-3 py-2 text-sm outline-none"
            style={{ background: "var(--color-bg-card)", border: "1px solid var(--color-border)", color: "var(--color-text-primary)", fontFamily: "var(--font-sans)" }}
            onFocus={(e) => (e.target.style.borderColor = "var(--color-accent)")}
            onBlur={(e) => (e.target.style.borderColor = "var(--color-border)")}
          />
        </div>
      </div>

      {/* Results */}
      {filtered.length === 0 ? (
        <div className="rounded p-12 text-center" style={{ background: "var(--color-bg-card)", border: "1px solid var(--color-border-subtle)" }}>
          <div className="text-sm font-medium mb-1" style={{ color: "var(--color-text-secondary)" }}>No tests found</div>
          <div className="text-xs" style={{ color: "var(--color-text-muted)" }}>Try adjusting your filters or search query.</div>
        </div>
      ) : (
        <div className="space-y-2">
          {/* Show available tests first with a subtle section label */}
          {statusFilter === "all" && availableTests.length > 0 && (
            <>
              <div className="text-[10px] font-semibold uppercase tracking-widest px-1 mb-2" style={{ color: "var(--color-success)", letterSpacing: "0.1em" }}>
                Ready to start
              </div>
              {availableTests.map((test) => (
                <TestRow
                  key={test.id}
                  test={test}
                  isRegistered={registeredIds.includes(test.id)}
                  isRegistering={registering === test.id}
                  onRegister={() => handleRegister(test.id)}
                  onStart={() => onOpenTest(test.id)}
                  onResult={() => onNavigate("results")}
                  highlight
                />
              ))}
              {otherTests.length > 0 && (
                <div className="text-[10px] font-semibold uppercase tracking-widest px-1 pt-3 mb-2" style={{ color: "var(--color-text-muted)", letterSpacing: "0.1em" }}>
                  Scheduled & completed
                </div>
              )}
              {otherTests.map((test) => (
                <TestRow
                  key={test.id}
                  test={test}
                  isRegistered={registeredIds.includes(test.id)}
                  isRegistering={registering === test.id}
                  onRegister={() => handleRegister(test.id)}
                  onStart={() => onOpenTest(test.id)}
                  onResult={() => onNavigate("results")}
                  highlight={false}
                />
              ))}
            </>
          )}

          {statusFilter !== "all" && filtered.map((test) => (
            <TestRow
              key={test.id}
              test={test}
              isRegistered={registeredIds.includes(test.id)}
              isRegistering={registering === test.id}
              onRegister={() => handleRegister(test.id)}
              onStart={() => onOpenTest(test.id)}
              onResult={() => onNavigate("results")}
              highlight={test.status === "available"}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Test row ─────────────────────────────────────────────────────────────────

function TestRow({
  test,
  isRegistered,
  isRegistering,
  onRegister,
  onStart,
  onResult,
  highlight,
}: {
  test: TestRecord;
  isRegistered: boolean;
  isRegistering: boolean;
  onRegister: () => void;
  onStart: () => void;
  onResult: () => void;
  highlight: boolean;
}) {
  const isAvailable = test.status === "available";
  const isCompleted = test.status === "completed";
  const isMissed = test.status === "missed";
  const isUpcoming = test.status === "upcoming";

  return (
    <div
      className="rounded p-4 flex items-center gap-4 transition-all"
      style={{
        background: isAvailable ? "var(--color-bg-card)" : "var(--color-bg-card)",
        border: `1px solid ${isAvailable ? "var(--color-success)55" : "var(--color-border)"}`,
        opacity: isMissed ? 0.65 : 1,
      }}
    >
      {/* Status icon */}
      <div
        className="w-10 h-10 rounded shrink-0 flex items-center justify-center"
        style={{ background: isAvailable ? "var(--color-success-bg)" : isCompleted ? "var(--color-bg-elevated)" : isMissed ? "var(--color-danger-bg)" : "var(--color-bg-elevated)" }}
      >
        {isAvailable && <PlayIcon />}
        {isCompleted && <CheckIcon />}
        {isMissed && <XIcon />}
        {isUpcoming && <ClockIcon />}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1 flex-wrap">
          <span className="text-[11px] font-medium" style={{ fontFamily: "var(--font-mono)", color: "var(--color-text-muted)" }}>{test.code}</span>
          <StatusBadge status={test.status} />
          <TypeBadge type={test.type} />
        </div>
        <div className="text-sm font-semibold mb-1 leading-snug" style={{ color: "var(--color-text-primary)" }}>
          {test.title}
          <span className="ml-1.5 text-xs font-normal" style={{ color: "var(--color-text-muted)" }}>— {test.section}</span>
        </div>
        <div className="flex flex-wrap gap-x-4 gap-y-0.5 text-xs" style={{ color: "var(--color-text-muted)" }}>
          <span>{test.date} · {test.time}</span>
          <span>{test.duration}</span>
          <span>{test.questions} questions</span>
          <span style={{ fontFamily: "var(--font-mono)" }}>{test.totalMarks} marks</span>
          {isUpcoming && test.daysLeft > 0 && (
            <span style={{ color: test.daysLeft <= 3 ? "var(--color-warning)" : "var(--color-text-muted)" }}>
              {test.daysLeft}d remaining
            </span>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="shrink-0 flex items-center gap-2">
        {isAvailable && (
          <button
            onClick={onStart}
            className="flex items-center gap-1.5 text-xs font-semibold rounded px-4 py-2 transition-all"
            style={{ background: "var(--color-success)", color: "white" }}
          >
            <svg width="11" height="11" viewBox="0 0 24 24" fill="white" stroke="white" strokeWidth="1"><polygon points="5 3 19 12 5 21 5 3"/></svg>
            Start Test
          </button>
        )}
        {isCompleted && (
          <button
            onClick={onResult}
            className="text-xs font-medium rounded px-3 py-1.5 transition-all"
            style={{ border: "1px solid var(--color-border)", color: "var(--color-text-secondary)", background: "transparent" }}
          >
            View Result
          </button>
        )}
        {isMissed && (
          <span className="text-xs rounded px-3 py-1.5" style={{ background: "var(--color-danger-bg)", color: "var(--color-danger)" }}>
            Not attended
          </span>
        )}
        {isUpcoming && (
          <>
            <button
              onClick={onStart}
              className="text-xs font-medium rounded px-3 py-1.5 transition-all"
              style={{ border: "1px solid var(--color-border)", color: "var(--color-text-secondary)", background: "transparent" }}
            >
              Details
            </button>
            {isRegistered ? (
              <div className="flex items-center gap-1 text-xs" style={{ color: "var(--color-success)" }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                Registered
              </div>
            ) : (
              <button
                onClick={onRegister}
                disabled={isRegistering}
                className="text-xs font-medium rounded px-3 py-1.5 transition-all"
                style={{ background: isRegistering ? "var(--color-accent-muted)" : "var(--color-accent)", color: "white", opacity: isRegistering ? 0.7 : 1 }}
              >
                {isRegistering ? "…" : "Register"}
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// ─── Icons ────────────────────────────────────────────────────────────────────

function SearchIcon() {
  return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>;
}
function PlayIcon() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="var(--color-success)" stroke="none"><polygon points="5 3 19 12 5 21 5 3"/></svg>;
}
function CheckIcon() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--color-text-muted)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>;
}
function XIcon() {
  return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--color-danger)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>;
}
function ClockIcon() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--color-text-muted)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>;
}
