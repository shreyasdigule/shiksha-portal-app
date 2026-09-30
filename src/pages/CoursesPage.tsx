import { useState } from "react";

// ─── Data ────────────────────────────────────────────────────────────────────

const ENROLLED_COURSES = [
  { code: "CS-301", name: "Data Structures & Algorithms", credits: 4, faculty: "Dr. Priya Nair", schedule: "Mon/Wed 10:00–11:30", room: "CSE-Lab 3", grade: "A", progress: 78, examDate: "Sep 14" },
  { code: "CS-311", name: "Database Management Systems", credits: 3, faculty: "Prof. Rahul Sharma", schedule: "Tue/Thu 2:00–3:30", room: "LH-204", grade: "B+", progress: 65, examDate: "Sep 19" },
  { code: "CS-321", name: "Operating Systems Fundamentals", credits: 4, faculty: "Dr. Anita Rao", schedule: "Mon/Wed/Fri 11:00–12:00", room: "CSE-Lab 1", grade: "A-", progress: 82, examDate: "Sep 23" },
  { code: "CS-331", name: "Computer Networks", credits: 3, faculty: "Prof. Vikram Singh", schedule: "Tue/Thu 9:30–11:00", room: "LH-101", grade: "B", progress: 55, examDate: "Oct 2" },
  { code: "MA-201", name: "Discrete Mathematics", credits: 3, faculty: "Dr. Kavita Menon", schedule: "Mon/Wed 3:00–4:30", room: "Math-205", grade: "A", progress: 90, examDate: "Oct 7" },
];

const AVAILABLE_COURSES = [
  {
    code: "CS-341", name: "Artificial Intelligence", credits: 4, faculty: "Dr. Sanjay Gupta",
    schedule: "Tue/Thu 10:00–11:30", room: "CSE-Lab 2", seats: 12, total: 60,
    dept: "Computer Science", prereq: "CS-301", description: "Introduction to AI concepts, search algorithms, knowledge representation, machine learning fundamentals, and neural networks.",
  },
  {
    code: "CS-351", name: "Software Engineering", credits: 3, faculty: "Prof. Meera Pillai",
    schedule: "Mon/Wed 1:00–2:30", room: "LH-302", seats: 5, total: 45,
    dept: "Computer Science", prereq: "CS-311", description: "Software development lifecycle, requirements engineering, design patterns, testing methodologies, and agile practices.",
  },
  {
    code: "CS-361", name: "Computer Graphics", credits: 3, faculty: "Dr. Arjun Kumar",
    schedule: "Fri 9:00–12:00", room: "Media-Lab", seats: 24, total: 30,
    dept: "Computer Science", prereq: "MA-201", description: "2D and 3D rendering pipelines, rasterisation, shading models, GPU programming, and real-time graphics.",
  },
  {
    code: "CS-371", name: "Compiler Design", credits: 4, faculty: "Prof. Deepa Iyer",
    schedule: "Mon/Wed/Fri 9:00–10:00", room: "LH-105", seats: 0, total: 40,
    dept: "Computer Science", prereq: "CS-321", description: "Lexical analysis, parsing, semantic analysis, intermediate code generation, and optimisation techniques.",
  },
  {
    code: "EC-401", name: "VLSI Design", credits: 3, faculty: "Dr. Suresh Rao",
    schedule: "Tue/Thu 3:00–4:30", room: "EC-Lab 2", seats: 18, total: 35,
    dept: "Electronics", prereq: "None", description: "Digital circuit design using HDLs, FPGA implementation, timing analysis, and low-power design techniques.",
  },
  {
    code: "MA-301", name: "Probability & Statistics", credits: 3, faculty: "Dr. Rekha Nambiar",
    schedule: "Mon/Wed 11:00–12:30", room: "Math-101", seats: 30, total: 50,
    dept: "Mathematics", prereq: "MA-201", description: "Probability theory, random variables, distributions, hypothesis testing, regression, and applications in engineering.",
  },
];

const CREDIT_LIMIT = 24;

// ─── Types ───────────────────────────────────────────────────────────────────

type MainTab = "enrolled" | "browse" | "register";
type RegisterStep = "review" | "confirm" | "success";
type DeptFilter = "All" | "Computer Science" | "Electronics" | "Mathematics";

// ─── Shared sub-components ───────────────────────────────────────────────────

function TabBar({ tabs, active, onChange }: { tabs: { id: string; label: string }[]; active: string; onChange: (id: string) => void }) {
  return (
    <div className="flex gap-1 p-1 rounded w-fit" style={{ background: "var(--color-bg-card)", border: "1px solid var(--color-border)" }}>
      {tabs.map((t) => (
        <button
          key={t.id}
          onClick={() => onChange(t.id)}
          className="px-4 py-1.5 text-sm font-medium rounded transition-all"
          style={{
            background: active === t.id ? "var(--color-accent)" : "transparent",
            color: active === t.id ? "white" : "var(--color-text-secondary)",
          }}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-[10px] font-semibold uppercase tracking-widest mb-3" style={{ color: "var(--color-text-muted)", letterSpacing: "0.1em" }}>
      {children}
    </div>
  );
}

function Badge({ children, variant = "default" }: { children: React.ReactNode; variant?: "default" | "success" | "warning" | "danger" | "accent" }) {
  const styles: Record<string, { bg: string; color: string }> = {
    default: { bg: "var(--color-bg-elevated)", color: "var(--color-text-muted)" },
    success: { bg: "var(--color-success-bg)", color: "var(--color-success)" },
    warning: { bg: "var(--color-warning-bg)", color: "var(--color-warning)" },
    danger:  { bg: "var(--color-danger-bg)",  color: "var(--color-danger)" },
    accent:  { bg: "var(--color-accent-muted)", color: "var(--color-accent)" },
  };
  const s = styles[variant];
  return (
    <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded uppercase tracking-wide" style={{ background: s.bg, color: s.color }}>
      {children}
    </span>
  );
}

function ProgressBar({ value, max }: { value: number; max: number }) {
  const pct = Math.round((value / max) * 100);
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: "var(--color-bg-elevated)" }}>
        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: "var(--color-accent)" }} />
      </div>
      <span className="text-xs shrink-0" style={{ color: "var(--color-text-muted)", fontFamily: "var(--font-mono)" }}>{pct}%</span>
    </div>
  );
}

function EmptyState({ icon, title, desc, action }: { icon?: React.ReactNode; title: string; desc: string; action?: React.ReactNode }) {
  return (
    <div className="rounded p-12 text-center flex flex-col items-center gap-3" style={{ background: "var(--color-bg-card)", border: "1px solid var(--color-border-subtle)" }}>
      {icon && <div style={{ color: "var(--color-text-muted)", opacity: 0.5 }}>{icon}</div>}
      <div className="text-sm font-semibold" style={{ color: "var(--color-text-secondary)" }}>{title}</div>
      <div className="text-xs max-w-xs" style={{ color: "var(--color-text-muted)" }}>{desc}</div>
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}

// ─── Enrolled tab ────────────────────────────────────────────────────────────

function EnrolledView({ onDrop }: { onDrop: (code: string) => void }) {
  const [confirmDrop, setConfirmDrop] = useState<string | null>(null);
  const [dropped, setDropped] = useState<string[]>([]);
  const visible = ENROLLED_COURSES.filter((c) => !dropped.includes(c.code));

  const handleConfirm = () => {
    if (confirmDrop) {
      setDropped((v) => [...v, confirmDrop]);
      onDrop(confirmDrop);
      setConfirmDrop(null);
    }
  };

  if (visible.length === 0) {
    return (
      <EmptyState
        icon={<BookIcon size={36} />}
        title="No courses enrolled"
        desc="You have not enrolled in any courses this semester. Use the Browse tab to find and register for courses."
      />
    );
  }

  return (
    <>
      {/* Drop modal */}
      {confirmDrop && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: "rgba(0,0,0,0.65)" }}>
          <div className="rounded p-6 w-[380px] space-y-4" style={{ background: "var(--color-bg-card)", border: "1px solid var(--color-border)" }}>
            <div>
              <div className="text-sm font-semibold mb-1" style={{ color: "var(--color-text-primary)" }}>Drop Course?</div>
              <p className="text-xs leading-relaxed" style={{ color: "var(--color-text-secondary)" }}>
                You are about to drop{" "}
                <span style={{ fontFamily: "var(--font-mono)", color: "var(--color-danger)" }}>{confirmDrop}</span>.
                Dropping a course during the examination period may affect your academic record. This action cannot be reversed without faculty approval.
              </p>
            </div>
            <div
              className="rounded p-3 text-xs flex items-start gap-2"
              style={{ background: "var(--color-warning-bg)", border: "1px solid #92400e44", color: "var(--color-warning)" }}
            >
              <WarningIcon />
              <span>Dropping below 15 credits may affect your full-time student status.</span>
            </div>
            <div className="flex gap-2 justify-end pt-1">
              <button onClick={() => setConfirmDrop(null)} className="text-sm rounded px-4 py-1.5" style={{ border: "1px solid var(--color-border)", color: "var(--color-text-secondary)", background: "transparent" }}>
                Cancel
              </button>
              <button onClick={handleConfirm} className="text-sm font-medium rounded px-4 py-1.5" style={{ background: "var(--color-danger)", color: "white" }}>
                Drop Course
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="rounded overflow-hidden" style={{ background: "var(--color-bg-card)", border: "1px solid var(--color-border)" }}>
        <table className="w-full text-sm">
          <thead>
            <tr style={{ borderBottom: "1px solid var(--color-border)" }}>
              {["Course", "Faculty & Room", "Schedule", "Cr.", "Grade", "Progress", "Exam", ""].map((h) => (
                <th key={h} className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider whitespace-nowrap" style={{ color: "var(--color-text-muted)" }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {visible.map((c, i) => (
              <tr key={c.code} style={{ borderBottom: i < visible.length - 1 ? "1px solid var(--color-border-subtle)" : "none" }}>
                <td className="px-4 py-3.5" style={{ minWidth: 200 }}>
                  <div className="text-[11px] font-medium mb-0.5" style={{ fontFamily: "var(--font-mono)", color: "var(--color-text-muted)" }}>{c.code}</div>
                  <div className="text-sm font-medium leading-snug" style={{ color: "var(--color-text-primary)" }}>{c.name}</div>
                </td>
                <td className="px-4 py-3.5" style={{ minWidth: 160 }}>
                  <div className="text-xs" style={{ color: "var(--color-text-secondary)" }}>{c.faculty}</div>
                  <div className="text-xs" style={{ color: "var(--color-text-muted)" }}>{c.room}</div>
                </td>
                <td className="px-4 py-3.5 text-xs whitespace-nowrap" style={{ color: "var(--color-text-secondary)" }}>{c.schedule}</td>
                <td className="px-4 py-3.5 text-center text-xs font-medium" style={{ color: "var(--color-text-secondary)" }}>{c.credits}</td>
                <td className="px-4 py-3.5 text-center">
                  <Badge variant="accent">{c.grade}</Badge>
                </td>
                <td className="px-4 py-3.5" style={{ minWidth: 100 }}>
                  <ProgressBar value={c.progress} max={100} />
                </td>
                <td className="px-4 py-3.5 text-xs whitespace-nowrap" style={{ color: "var(--color-text-muted)", fontFamily: "var(--font-mono)" }}>{c.examDate}</td>
                <td className="px-4 py-3.5">
                  <button
                    onClick={() => setConfirmDrop(c.code)}
                    className="text-xs rounded px-2.5 py-1 transition-all whitespace-nowrap"
                    style={{ color: "var(--color-danger)", border: "1px solid #7f1d1d44", background: "transparent" }}
                  >
                    Drop
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

// ─── Browse tab ───────────────────────────────────────────────────────────────

function BrowseView({
  selected,
  onToggle,
  onProceed,
  currentCredits,
}: {
  selected: string[];
  onToggle: (code: string) => void;
  onProceed: () => void;
  currentCredits: number;
}) {
  const [search, setSearch] = useState("");
  const [deptFilter, setDeptFilter] = useState<DeptFilter>("All");
  const [expanded, setExpanded] = useState<string | null>(null);

  const depts: DeptFilter[] = ["All", "Computer Science", "Electronics", "Mathematics"];

  const filtered = AVAILABLE_COURSES.filter((c) => {
    const matchSearch = search.trim() === "" || c.name.toLowerCase().includes(search.toLowerCase()) || c.code.toLowerCase().includes(search.toLowerCase()) || c.faculty.toLowerCase().includes(search.toLowerCase());
    const matchDept = deptFilter === "All" || c.dept === deptFilter;
    return matchSearch && matchDept;
  });

  const selectedCredits = AVAILABLE_COURSES.filter((c) => selected.includes(c.code)).reduce((s, c) => s + c.credits, 0);
  const wouldExceed = (code: string) => {
    const c = AVAILABLE_COURSES.find((x) => x.code === code)!;
    return !selected.includes(code) && (currentCredits + selectedCredits + c.credits) > CREDIT_LIMIT;
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Course list */}
      <div className="lg:col-span-2 space-y-4">
        {/* Search + filter */}
        <div className="flex gap-2 flex-wrap">
          <div className="relative flex-1 min-w-[200px]">
            <span className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--color-text-muted)" }}>
              <SearchIcon />
            </span>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, code, or faculty…"
              className="w-full rounded pl-8 pr-3 py-2 text-sm outline-none"
              style={{ background: "var(--color-bg-card)", border: "1px solid var(--color-border)", color: "var(--color-text-primary)", fontFamily: "var(--font-sans)" }}
              onFocus={(e) => (e.target.style.borderColor = "var(--color-accent)")}
              onBlur={(e) => (e.target.style.borderColor = "var(--color-border)")}
            />
          </div>
          <div className="flex gap-1 p-1 rounded" style={{ background: "var(--color-bg-card)", border: "1px solid var(--color-border)" }}>
            {depts.map((d) => (
              <button
                key={d}
                onClick={() => setDeptFilter(d)}
                className="px-3 py-1 text-xs font-medium rounded transition-all"
                style={{
                  background: deptFilter === d ? "var(--color-accent)" : "transparent",
                  color: deptFilter === d ? "white" : "var(--color-text-secondary)",
                }}
              >
                {d === "Computer Science" ? "CS" : d === "Electronics" ? "EC" : d === "Mathematics" ? "Math" : d}
              </button>
            ))}
          </div>
        </div>

        {filtered.length === 0 ? (
          <EmptyState
            icon={<SearchIcon size={28} />}
            title="No courses found"
            desc="Try adjusting your search or department filter to find available courses."
          />
        ) : (
          <div className="space-y-2">
            {filtered.map((c) => {
              const isSel = selected.includes(c.code);
              const full = c.seats === 0;
              const exceed = wouldExceed(c.code);
              const isExp = expanded === c.code;
              const seatPct = Math.round(((c.total - c.seats) / c.total) * 100);

              return (
                <div
                  key={c.code}
                  className="rounded transition-all"
                  style={{
                    background: isSel ? "var(--color-accent-muted)" : "var(--color-bg-card)",
                    border: `1px solid ${isSel ? "var(--color-accent)" : "var(--color-border)"}`,
                    opacity: full ? 0.6 : 1,
                  }}
                >
                  <div className="flex items-start gap-3 p-4">
                    {/* Checkbox */}
                    <button
                      onClick={() => !full && !exceed && onToggle(c.code)}
                      disabled={full || (exceed && !isSel)}
                      className="mt-0.5 w-4 h-4 rounded shrink-0 flex items-center justify-center transition-all"
                      style={{
                        background: isSel ? "var(--color-accent)" : "transparent",
                        border: `1.5px solid ${isSel ? "var(--color-accent)" : "var(--color-border)"}`,
                        cursor: full || (exceed && !isSel) ? "not-allowed" : "pointer",
                      }}
                    >
                      {isSel && (
                        <svg width="9" height="7" viewBox="0 0 10 7" fill="none">
                          <path d="M1 3.5L3.8 6L9 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      )}
                    </button>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="text-[11px] font-medium" style={{ fontFamily: "var(--font-mono)", color: "var(--color-text-muted)" }}>{c.code}</span>
                        <Badge variant={full ? "danger" : c.seats <= 8 ? "warning" : "success"}>
                          {full ? "Full" : `${c.seats} seats`}
                        </Badge>
                        <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ background: "var(--color-bg-elevated)", color: "var(--color-text-muted)" }}>
                          {c.dept}
                        </span>
                        {exceed && !isSel && (
                          <Badge variant="warning">Credit limit</Badge>
                        )}
                      </div>
                      <div className="text-sm font-semibold mb-1" style={{ color: "var(--color-text-primary)" }}>{c.name}</div>
                      <div className="text-xs mb-2" style={{ color: "var(--color-text-muted)" }}>
                        {c.faculty} · {c.schedule} · {c.room} · {c.credits} credits · Prereq: <span style={{ fontFamily: "var(--font-mono)" }}>{c.prereq}</span>
                      </div>

                      {/* Seat bar */}
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-1 rounded-full overflow-hidden" style={{ background: "var(--color-bg-elevated)", maxWidth: 120 }}>
                          <div className="h-full rounded-full" style={{ width: `${seatPct}%`, background: c.seats === 0 ? "var(--color-danger)" : c.seats <= 8 ? "var(--color-warning)" : "var(--color-success)" }} />
                        </div>
                        <span className="text-[10px]" style={{ color: "var(--color-text-muted)" }}>{c.total - c.seats}/{c.total} filled</span>
                      </div>

                      {/* Expanded description */}
                      {isExp && (
                        <div className="mt-3 pt-3" style={{ borderTop: "1px solid var(--color-border-subtle)" }}>
                          <p className="text-xs leading-relaxed" style={{ color: "var(--color-text-secondary)" }}>{c.description}</p>
                        </div>
                      )}
                    </div>

                    <button
                      onClick={() => setExpanded(isExp ? null : c.code)}
                      className="shrink-0 text-xs transition-all mt-0.5"
                      style={{ color: "var(--color-text-muted)" }}
                    >
                      <ChevronIcon down={!isExp} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Selection summary panel */}
      <div>
        <div className="sticky top-6">
          <div className="rounded p-4" style={{ background: "var(--color-bg-card)", border: "1px solid var(--color-border)" }}>
            <SectionLabel>Selected for Registration</SectionLabel>

            {selected.length === 0 ? (
              <div className="py-6 text-center">
                <div className="text-xs" style={{ color: "var(--color-text-muted)" }}>No courses selected. Check courses in the list to add them here.</div>
              </div>
            ) : (
              <div className="space-y-2 mb-4">
                {AVAILABLE_COURSES.filter((c) => selected.includes(c.code)).map((c) => (
                  <div key={c.code} className="flex items-start gap-2">
                    <div className="flex-1">
                      <div className="text-[11px]" style={{ fontFamily: "var(--font-mono)", color: "var(--color-text-muted)" }}>{c.code}</div>
                      <div className="text-xs font-medium leading-snug" style={{ color: "var(--color-text-primary)" }}>{c.name}</div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0 mt-0.5">
                      <span className="text-xs" style={{ color: "var(--color-text-muted)" }}>{c.credits}cr</span>
                      <button onClick={() => onToggle(c.code)} style={{ color: "var(--color-text-muted)" }}>
                        <XIcon />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="pt-3" style={{ borderTop: "1px solid var(--color-border-subtle)" }}>
              <div className="flex justify-between text-xs mb-1">
                <span style={{ color: "var(--color-text-muted)" }}>Current credits</span>
                <span style={{ fontFamily: "var(--font-mono)", color: "var(--color-text-secondary)" }}>{currentCredits}</span>
              </div>
              <div className="flex justify-between text-xs mb-1">
                <span style={{ color: "var(--color-text-muted)" }}>Adding</span>
                <span style={{ fontFamily: "var(--font-mono)", color: "var(--color-accent)" }}>+{selectedCredits}</span>
              </div>
              <div className="flex justify-between text-xs mb-3 font-semibold">
                <span style={{ color: "var(--color-text-secondary)" }}>Total</span>
                <span style={{ fontFamily: "var(--font-mono)", color: (currentCredits + selectedCredits) > CREDIT_LIMIT ? "var(--color-danger)" : "var(--color-text-primary)" }}>
                  {currentCredits + selectedCredits} / {CREDIT_LIMIT}
                </span>
              </div>

              {/* Credit bar */}
              <div className="h-1.5 rounded-full overflow-hidden mb-4" style={{ background: "var(--color-bg-elevated)" }}>
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${Math.min(((currentCredits + selectedCredits) / CREDIT_LIMIT) * 100, 100)}%`,
                    background: (currentCredits + selectedCredits) > CREDIT_LIMIT ? "var(--color-danger)" : "var(--color-accent)",
                  }}
                />
              </div>

              <button
                onClick={onProceed}
                disabled={selected.length === 0 || (currentCredits + selectedCredits) > CREDIT_LIMIT}
                className="w-full text-sm font-semibold rounded py-2 transition-all"
                style={{
                  background: selected.length === 0 ? "var(--color-bg-elevated)" : "var(--color-accent)",
                  color: selected.length === 0 ? "var(--color-text-muted)" : "white",
                  cursor: selected.length === 0 ? "not-allowed" : "pointer",
                }}
              >
                {selected.length === 0 ? "Select courses to continue" : `Review Registration (${selected.length})`}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Registration flow ─────────────────────────────────────────────────────────

function RegisterView({
  selected,
  currentCredits,
  onBack,
  onClear,
}: {
  selected: string[];
  currentCredits: number;
  onBack: () => void;
  onClear: () => void;
}) {
  const [step, setStep] = useState<RegisterStep>("review");
  const [submitting, setSubmitting] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  const courses = AVAILABLE_COURSES.filter((c) => selected.includes(c.code));
  const totalCredits = courses.reduce((s, c) => s + c.credits, 0);
  const enrollmentId = "ENR-2024-" + Math.floor(Math.random() * 90000 + 10000);

  const handleSubmit = () => {
    setSubmitting(true);
    setTimeout(() => {
      setSubmitting(false);
      setStep("success");
    }, 1400);
  };

  if (step === "success") {
    return (
      <div className="max-w-[560px] mx-auto mt-8">
        <div className="rounded p-8 text-center space-y-4" style={{ background: "var(--color-bg-card)", border: "1px solid var(--color-border)" }}>
          <div
            className="w-14 h-14 rounded-full flex items-center justify-center mx-auto"
            style={{ background: "var(--color-success-bg)", border: "1px solid var(--color-success)" }}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--color-success)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <div>
            <div className="text-base font-semibold mb-1" style={{ color: "var(--color-text-primary)" }}>Registration Successful</div>
            <div className="text-xs" style={{ color: "var(--color-text-muted)" }}>
              Your course registration has been submitted and confirmed.
            </div>
          </div>

          <div className="rounded p-4 text-left space-y-2" style={{ background: "var(--color-bg-elevated)" }}>
            <div className="flex justify-between text-xs">
              <span style={{ color: "var(--color-text-muted)" }}>Enrollment ID</span>
              <span style={{ fontFamily: "var(--font-mono)", color: "var(--color-accent)" }}>{enrollmentId}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span style={{ color: "var(--color-text-muted)" }}>Courses added</span>
              <span style={{ fontFamily: "var(--font-mono)", color: "var(--color-text-primary)" }}>{courses.length}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span style={{ color: "var(--color-text-muted)" }}>Credits added</span>
              <span style={{ fontFamily: "var(--font-mono)", color: "var(--color-text-primary)" }}>+{totalCredits}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span style={{ color: "var(--color-text-muted)" }}>New total</span>
              <span style={{ fontFamily: "var(--font-mono)", color: "var(--color-text-primary)" }}>{currentCredits + totalCredits} credits</span>
            </div>
          </div>

          <div className="space-y-1.5 pt-1">
            {courses.map((c) => (
              <div key={c.code} className="flex items-center gap-2 text-xs" style={{ color: "var(--color-text-secondary)" }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--color-success)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                <span style={{ fontFamily: "var(--font-mono)", color: "var(--color-text-muted)" }}>{c.code}</span>
                <span>{c.name}</span>
              </div>
            ))}
          </div>

          <div className="text-xs" style={{ color: "var(--color-text-muted)" }}>
            A confirmation has been sent to your university email. You can manage your courses from the Enrolled tab.
          </div>

          <button
            onClick={onClear}
            className="text-sm font-medium rounded px-5 py-2 transition-all"
            style={{ background: "var(--color-accent)", color: "white" }}
          >
            Go to Enrolled Courses
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-5">
        {/* Step indicator */}
        <div className="flex items-center gap-3">
          {(["review", "confirm"] as RegisterStep[]).map((s, i) => {
            const done = (step === "confirm" && s === "review");
            const current = step === s;
            return (
              <div key={s} className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <div
                    className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold"
                    style={{
                      background: done ? "var(--color-success)" : current ? "var(--color-accent)" : "var(--color-bg-elevated)",
                      color: done || current ? "white" : "var(--color-text-muted)",
                    }}
                  >
                    {done ? <svg width="10" height="8" viewBox="0 0 10 8" fill="none"><path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg> : i + 1}
                  </div>
                  <span className="text-xs font-medium capitalize" style={{ color: current ? "var(--color-text-primary)" : "var(--color-text-muted)" }}>
                    {s === "review" ? "Review Selection" : "Confirm & Submit"}
                  </span>
                </div>
                {i < 1 && <div className="w-8 h-px" style={{ background: "var(--color-border)" }} />}
              </div>
            );
          })}
        </div>

        {step === "review" && (
          <>
            <SectionLabel>Courses Selected for Registration</SectionLabel>
            <div className="rounded overflow-hidden" style={{ background: "var(--color-bg-card)", border: "1px solid var(--color-border)" }}>
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ borderBottom: "1px solid var(--color-border)" }}>
                    {["Course", "Faculty", "Schedule / Room", "Credits", "Prereq"].map((h) => (
                      <th key={h} className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--color-text-muted)" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {courses.map((c, i) => (
                    <tr key={c.code} style={{ borderBottom: i < courses.length - 1 ? "1px solid var(--color-border-subtle)" : "none" }}>
                      <td className="px-4 py-3.5">
                        <div className="text-[11px]" style={{ fontFamily: "var(--font-mono)", color: "var(--color-text-muted)" }}>{c.code}</div>
                        <div className="text-sm font-medium" style={{ color: "var(--color-text-primary)" }}>{c.name}</div>
                      </td>
                      <td className="px-4 py-3.5 text-xs" style={{ color: "var(--color-text-secondary)" }}>{c.faculty}</td>
                      <td className="px-4 py-3.5">
                        <div className="text-xs" style={{ color: "var(--color-text-secondary)" }}>{c.schedule}</div>
                        <div className="text-xs" style={{ color: "var(--color-text-muted)" }}>{c.room}</div>
                      </td>
                      <td className="px-4 py-3.5 text-center text-xs font-semibold" style={{ color: "var(--color-accent)", fontFamily: "var(--font-mono)" }}>{c.credits}</td>
                      <td className="px-4 py-3.5 text-xs" style={{ fontFamily: "var(--font-mono)", color: "var(--color-text-muted)" }}>{c.prereq}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div
              className="rounded p-3 text-xs flex items-start gap-2"
              style={{ background: "var(--color-accent-muted)", border: "1px solid var(--color-accent)44", color: "var(--color-text-secondary)" }}
            >
              <InfoIcon />
              <span>Please verify that you have completed the prerequisites for each course. Registration will be subject to faculty approval if prerequisites are not met.</span>
            </div>

            <div className="flex gap-2">
              <button onClick={onBack} className="text-sm rounded px-4 py-2" style={{ border: "1px solid var(--color-border)", color: "var(--color-text-secondary)", background: "transparent" }}>
                ← Back to Browse
              </button>
              <button onClick={() => setStep("confirm")} className="text-sm font-semibold rounded px-5 py-2" style={{ background: "var(--color-accent)", color: "white" }}>
                Proceed to Confirm
              </button>
            </div>
          </>
        )}

        {step === "confirm" && (
          <>
            <SectionLabel>Confirmation & Declaration</SectionLabel>
            <div className="rounded p-5 space-y-4" style={{ background: "var(--color-bg-card)", border: "1px solid var(--color-border)" }}>
              <div className="text-sm font-semibold" style={{ color: "var(--color-text-primary)" }}>Student Declaration</div>
              <p className="text-xs leading-relaxed" style={{ color: "var(--color-text-secondary)" }}>
                By submitting this registration, I confirm that I have read and understood the course requirements and prerequisites. I acknowledge that I meet the eligibility criteria for the courses selected, and I accept the academic policies of Northeastern University regarding course attendance, examinations, and grading.
              </p>

              {/* Terms checkbox */}
              <div className="flex items-start gap-3 pt-1">
                <button
                  role="checkbox"
                  aria-checked={acceptedTerms}
                  onClick={() => setAcceptedTerms((v) => !v)}
                  className="mt-0.5 w-4 h-4 rounded shrink-0 flex items-center justify-center transition-all"
                  style={{
                    background: acceptedTerms ? "var(--color-accent)" : "transparent",
                    border: `1.5px solid ${acceptedTerms ? "var(--color-accent)" : "var(--color-border)"}`,
                  }}
                >
                  {acceptedTerms && (
                    <svg width="9" height="7" viewBox="0 0 10 7" fill="none">
                      <path d="M1 3.5L3.8 6L9 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </button>
                <span className="text-xs leading-relaxed" style={{ color: "var(--color-text-secondary)" }}>
                  I have read and agree to the registration terms and academic policies. I confirm all information is accurate.
                </span>
              </div>
            </div>

            {!acceptedTerms && (
              <div
                className="rounded p-3 text-xs flex items-start gap-2"
                style={{ background: "var(--color-warning-bg)", border: "1px solid #92400e44", color: "var(--color-warning)" }}
              >
                <WarningIcon />
                <span>You must accept the declaration to submit your registration.</span>
              </div>
            )}

            <div className="flex gap-2">
              <button onClick={() => setStep("review")} className="text-sm rounded px-4 py-2" style={{ border: "1px solid var(--color-border)", color: "var(--color-text-secondary)", background: "transparent" }}>
                ← Back
              </button>
              <button
                onClick={handleSubmit}
                disabled={!acceptedTerms || submitting}
                className="text-sm font-semibold rounded px-5 py-2 transition-all flex items-center gap-2"
                style={{
                  background: !acceptedTerms ? "var(--color-bg-elevated)" : "var(--color-accent)",
                  color: !acceptedTerms ? "var(--color-text-muted)" : "white",
                  cursor: !acceptedTerms ? "not-allowed" : "pointer",
                  opacity: submitting ? 0.7 : 1,
                }}
              >
                {submitting && <SpinIcon />}
                {submitting ? "Submitting…" : "Submit Registration"}
              </button>
            </div>
          </>
        )}
      </div>

      {/* Summary sidebar */}
      <div>
        <div className="sticky top-6 rounded p-4 space-y-4" style={{ background: "var(--color-bg-card)", border: "1px solid var(--color-border)" }}>
          <SectionLabel>Registration Summary</SectionLabel>
          <div className="space-y-2">
            {courses.map((c) => (
              <div key={c.code} className="flex justify-between gap-2 text-xs">
                <span style={{ color: "var(--color-text-secondary)" }}>{c.name}</span>
                <span className="shrink-0" style={{ fontFamily: "var(--font-mono)", color: "var(--color-text-muted)" }}>{c.credits}cr</span>
              </div>
            ))}
          </div>
          <div className="pt-3 space-y-1.5" style={{ borderTop: "1px solid var(--color-border-subtle)" }}>
            <div className="flex justify-between text-xs">
              <span style={{ color: "var(--color-text-muted)" }}>Current credits</span>
              <span style={{ fontFamily: "var(--font-mono)", color: "var(--color-text-secondary)" }}>{currentCredits}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span style={{ color: "var(--color-text-muted)" }}>Adding</span>
              <span style={{ fontFamily: "var(--font-mono)", color: "var(--color-accent)" }}>+{totalCredits}</span>
            </div>
            <div className="flex justify-between text-xs font-semibold pt-1" style={{ borderTop: "1px solid var(--color-border-subtle)" }}>
              <span style={{ color: "var(--color-text-primary)" }}>New total</span>
              <span style={{ fontFamily: "var(--font-mono)", color: "var(--color-text-primary)" }}>{currentCredits + totalCredits} / {CREDIT_LIMIT}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function CoursesPage() {
  const [tab, setTab] = useState<MainTab>("enrolled");
  const [selected, setSelected] = useState<string[]>([]);

  const enrolledCount = ENROLLED_COURSES.length;
  const currentCredits = ENROLLED_COURSES.reduce((s, c) => s + c.credits, 0);

  const toggleCourse = (code: string) => {
    setSelected((v) => v.includes(code) ? v.filter((x) => x !== code) : [...v, code]);
  };

  const tabs = [
    { id: "enrolled", label: `Enrolled (${enrolledCount})` },
    { id: "browse", label: "Browse Available" },
    { id: "register", label: selected.length > 0 ? `Review (${selected.length})` : "Register" },
  ];

  return (
    <div className="p-6">
      {/* Page header */}
      <div className="flex items-start justify-between mb-6 max-w-[1100px]">
        <div>
          <h1 className="text-xl font-semibold mb-1" style={{ color: "var(--color-text-primary)" }}>
            Course Registration
          </h1>
          <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
            Fall 2024 · Semester 6 — Registration period closes Sep 20, 2024
          </p>
        </div>
        <div
          className="flex items-center gap-5 px-4 py-2.5 rounded shrink-0"
          style={{ background: "var(--color-bg-card)", border: "1px solid var(--color-border)" }}
        >
          <div className="text-center">
            <div className="text-xs mb-0.5" style={{ color: "var(--color-text-muted)" }}>Enrolled</div>
            <div className="text-sm font-bold" style={{ color: "var(--color-text-primary)" }}>{enrolledCount} courses</div>
          </div>
          <div className="w-px h-8" style={{ background: "var(--color-border)" }} />
          <div className="text-center">
            <div className="text-xs mb-0.5" style={{ color: "var(--color-text-muted)" }}>Credits</div>
            <div className="text-sm font-bold" style={{ color: "var(--color-accent)" }}>{currentCredits} / {CREDIT_LIMIT}</div>
          </div>
        </div>
      </div>

      <div className="mb-6">
        <TabBar tabs={tabs} active={tab} onChange={(id) => setTab(id as MainTab)} />
      </div>

      <div className="max-w-[1100px]">
        {tab === "enrolled" && (
          <EnrolledView onDrop={() => {}} />
        )}
        {tab === "browse" && (
          <BrowseView
            selected={selected}
            onToggle={toggleCourse}
            onProceed={() => setTab("register")}
            currentCredits={currentCredits}
          />
        )}
        {tab === "register" && (
          <RegisterView
            selected={selected}
            currentCredits={currentCredits}
            onBack={() => setTab("browse")}
            onClear={() => { setSelected([]); setTab("enrolled"); }}
          />
        )}
      </div>
    </div>
  );
}

// ─── Icons ────────────────────────────────────────────────────────────────────

function BookIcon({ size = 20 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2z"/><path d="M22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7z"/></svg>;
}
function SearchIcon({ size = 14 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>;
}
function ChevronIcon({ down }: { down: boolean }) {
  return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ transform: down ? undefined : "rotate(180deg)", transition: "transform 0.15s" }}><polyline points="6 9 12 15 18 9"/></svg>;
}
function XIcon() {
  return <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>;
}
function WarningIcon() {
  return <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 mt-0.5"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>;
}
function InfoIcon() {
  return <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 mt-0.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>;
}
function SpinIcon() {
  return <svg className="animate-spin" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/></svg>;
}
