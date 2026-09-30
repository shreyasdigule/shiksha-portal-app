import { ADMIN_COURSES, ADMIN_TESTS } from "../../data/admin";
import type { AdminPage } from "../../data/admin";
import { getStudents, getAttempts } from "../../store";

interface Props {
  onNavigate: (page: AdminPage) => void;
}

export default function AdminDashboardPage({ onNavigate }: Props) {
  const students = getStudents();
  const attempts = getAttempts();

  const activeCourses = ADMIN_COURSES.filter((c) => c.status === "active").length;
  const activeTests = ADMIN_TESTS.filter((t) => t.status === "active" || t.status === "upcoming").length;

  const avgScore = attempts.length
    ? Math.round(attempts.reduce((sum, a) => sum + Math.round((a.score / a.maxScore) * 100), 0) / attempts.length)
    : 0;

  const upcomingTests = ADMIN_TESTS.filter((t) => t.status === "active" || t.status === "upcoming").slice(0, 4);
  const recentAttempts = [...attempts].sort((a, b) => b.submittedAt.localeCompare(a.submittedAt)).slice(0, 6);

  return (
    <div className="p-6 max-w-[1080px]">
      {/* Header */}
      <div className="flex items-start justify-between mb-6 flex-wrap gap-4">
        <div>
          <h1 className="text-xl font-semibold mb-1" style={{ color: "var(--color-text-primary)" }}>Admin Overview</h1>
          <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>ShikshaPortal &mdash; Academic Management</p>
        </div>
        <div className="flex gap-2">
          <ActionButton label="View Students" onClick={() => onNavigate("students")} variant="outline" />
          <ActionButton label="Manage Tests" onClick={() => onNavigate("tests")} variant="primary" />
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label: "Registered Students", value: students.length, sub: students.length === 0 ? "No registrations yet" : `${students.length} total`, color: "var(--color-accent)", page: "students" as AdminPage, icon: <UsersIcon /> },
          { label: "Active Courses", value: activeCourses, sub: `${ADMIN_COURSES.length} total this semester`, color: "var(--color-success)", page: "courses" as AdminPage, icon: <BookIcon /> },
          { label: "Scheduled Tests", value: activeTests, sub: `${ADMIN_TESTS.filter((t) => t.status === "completed").length} completed`, color: "#a78bfa", page: "tests" as AdminPage, icon: <ClipboardIcon /> },
          { label: "Avg. Score", value: attempts.length ? `${avgScore}%` : "N/A", sub: attempts.length ? `Across ${attempts.length} submissions` : "No submissions yet", color: "var(--color-warning)", page: "results" as AdminPage, icon: <ChartIcon /> },
        ].map((s) => (
          <button
            key={s.label}
            onClick={() => onNavigate(s.page)}
            className="rounded p-5 text-left transition-all"
            style={{ background: "var(--color-bg-card)", border: "1px solid var(--color-border)" }}
          >
            <div className="flex items-start justify-between mb-3">
              <span style={{ color: s.color, opacity: 0.8 }}>{s.icon}</span>
              <ArrowRightIcon />
            </div>
            <div className="text-2xl font-bold mb-0.5" style={{ color: "var(--color-text-primary)", fontFamily: "var(--font-mono)" }}>{s.value}</div>
            <div className="text-xs font-medium mb-0.5" style={{ color: "var(--color-text-secondary)" }}>{s.label}</div>
            <div className="text-[10px]" style={{ color: "var(--color-text-muted)" }}>{s.sub}</div>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Upcoming tests */}
        <div className="lg:col-span-2 rounded p-5" style={{ background: "var(--color-bg-card)", border: "1px solid var(--color-border)" }}>
          <div className="flex items-center justify-between mb-4">
            <SectionLabel>Active &amp; Upcoming Tests</SectionLabel>
            <button onClick={() => onNavigate("tests")} className="text-xs" style={{ color: "#a78bfa" }}>View all</button>
          </div>
          <div className="space-y-2">
            {upcomingTests.length === 0 ? (
              <EmptyState label="No upcoming tests scheduled." />
            ) : upcomingTests.map((t) => (
              <div
                key={t.id}
                className="flex items-center justify-between rounded px-3 py-2.5 gap-3"
                style={{ background: "var(--color-bg-elevated)" }}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                    <span className="text-[10px] font-medium" style={{ fontFamily: "var(--font-mono)", color: "var(--color-text-muted)" }}>{t.courseCode}</span>
                    <TestStatusBadge status={t.status} />
                  </div>
                  <div className="text-sm font-medium truncate" style={{ color: "var(--color-text-primary)" }}>{t.title} &mdash; {t.type}</div>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-xs" style={{ fontFamily: "var(--font-mono)", color: "var(--color-text-muted)" }}>{t.date}</div>
                  <div className="text-[10px]" style={{ color: "var(--color-text-muted)" }}>{t.registered} registered</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Course enrollment */}
        <div className="rounded p-5" style={{ background: "var(--color-bg-card)", border: "1px solid var(--color-border)" }}>
          <div className="flex items-center justify-between mb-4">
            <SectionLabel>Enrollment Status</SectionLabel>
            <button onClick={() => onNavigate("courses")} className="text-xs" style={{ color: "#a78bfa" }}>Manage</button>
          </div>
          <div className="space-y-3">
            {ADMIN_COURSES.filter((c) => c.status === "active").map((c) => {
              const pct = Math.round((c.enrolled / c.capacity) * 100);
              const color = pct >= 90 ? "var(--color-warning)" : pct >= 70 ? "var(--color-success)" : "#a78bfa";
              return (
                <div key={c.id}>
                  <div className="flex justify-between text-xs mb-1">
                    <span style={{ fontFamily: "var(--font-mono)", color: "var(--color-text-muted)" }}>{c.code}</span>
                    <span style={{ color: "var(--color-text-secondary)" }}>{c.enrolled}/{c.capacity}</span>
                  </div>
                  <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "var(--color-bg-elevated)" }}>
                    <div className="h-full rounded-full" style={{ width: `${pct}%`, background: color }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Recent submissions — real data only */}
      <div className="mt-5 rounded" style={{ background: "var(--color-bg-card)", border: "1px solid var(--color-border)" }}>
        <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: "1px solid var(--color-border-subtle)" }}>
          <SectionLabel>Recent Submissions</SectionLabel>
          <button onClick={() => onNavigate("results")} className="text-xs" style={{ color: "#a78bfa" }}>View all results</button>
        </div>

        {recentAttempts.length === 0 ? (
          <div className="px-5 py-12 text-center">
            <div className="text-xs mb-1" style={{ color: "var(--color-text-secondary)" }}>No test submissions yet</div>
            <div className="text-[10px]" style={{ color: "var(--color-text-muted)" }}>Results will appear here after students complete examinations.</div>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr>
                {["Student", "Test", "Score", "Grade", "Submitted"].map((h) => (
                  <th key={h} className="text-left px-5 py-2.5 text-[10px] font-semibold uppercase tracking-wider" style={{ color: "var(--color-text-muted)" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {recentAttempts.map((a) => {
                const pct = Math.round((a.score / a.maxScore) * 100);
                const date = new Date(a.submittedAt).toLocaleDateString([], { day: "2-digit", month: "short", year: "numeric" });
                return (
                  <tr key={a.id} style={{ borderTop: "1px solid var(--color-border-subtle)" }}>
                    <td className="px-5 py-3">
                      <div className="text-sm font-medium" style={{ color: "var(--color-text-primary)" }}>{a.studentName}</div>
                      <div className="text-[10px]" style={{ fontFamily: "var(--font-mono)", color: "var(--color-text-muted)" }}>{a.studentId}</div>
                    </td>
                    <td className="px-5 py-3">
                      <div className="text-xs font-medium" style={{ color: "var(--color-text-secondary)" }}>{a.testTitle}</div>
                      <div className="text-[10px]" style={{ fontFamily: "var(--font-mono)", color: "var(--color-text-muted)" }}>{a.testCode}</div>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-14 h-1.5 rounded-full overflow-hidden" style={{ background: "var(--color-bg-elevated)" }}>
                          <div className="h-full rounded-full" style={{ width: `${pct}%`, background: pct >= 80 ? "var(--color-success)" : pct >= 60 ? "#a78bfa" : "var(--color-warning)" }} />
                        </div>
                        <span className="text-xs" style={{ fontFamily: "var(--font-mono)", color: "var(--color-text-secondary)" }}>{a.score}/{a.maxScore}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <span className="text-xs font-semibold" style={{ color: pct >= 80 ? "var(--color-success)" : pct >= 60 ? "#a78bfa" : "var(--color-warning)", fontFamily: "var(--font-mono)" }}>{a.grade}</span>
                    </td>
                    <td className="px-5 py-3 text-xs" style={{ color: "var(--color-text-muted)", fontFamily: "var(--font-mono)" }}>{date}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <div className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: "var(--color-text-muted)", letterSpacing: "0.1em" }}>{children}</div>;
}
function EmptyState({ label }: { label: string }) {
  return <div className="py-8 text-center text-xs" style={{ color: "var(--color-text-muted)" }}>{label}</div>;
}
function ActionButton({ label, onClick, variant }: { label: string; onClick: () => void; variant: "primary" | "outline" }) {
  return (
    <button
      onClick={onClick}
      className="text-sm font-medium rounded px-4 py-2 transition-all"
      style={{ background: variant === "primary" ? "#7c3aed" : "transparent", color: variant === "primary" ? "white" : "var(--color-text-secondary)", border: variant === "outline" ? "1px solid var(--color-border)" : "none" }}
    >
      {label}
    </button>
  );
}
function TestStatusBadge({ status }: { status: string }) {
  const m: Record<string, { bg: string; color: string; label: string }> = {
    active:    { bg: "var(--color-success-bg)", color: "var(--color-success)", label: "Active" },
    upcoming:  { bg: "#1e1040", color: "#a78bfa", label: "Upcoming" },
    completed: { bg: "var(--color-bg-card)", color: "var(--color-text-muted)", label: "Completed" },
    draft:     { bg: "var(--color-warning-bg)", color: "var(--color-warning)", label: "Draft" },
  };
  const s = m[status] || m.draft;
  return <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded uppercase tracking-wide" style={{ background: s.bg, color: s.color }}>{s.label}</span>;
}
function ArrowRightIcon() { return <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--color-text-muted)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>; }
function UsersIcon() { return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>; }
function BookIcon() { return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2z"/><path d="M22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7z"/></svg>; }
function ClipboardIcon() { return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 4h2a2 2 0 012 2v14a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2h2"/><rect x="8" y="2" width="8" height="4" rx="1"/></svg>; }
function ChartIcon() { return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/><line x1="2" y1="20" x2="22" y2="20"/></svg>; }
