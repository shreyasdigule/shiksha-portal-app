import type { Page, User } from "../App";
import { getMyAttempts, calcGrade } from "../store";
import { ADMIN_TESTS, ADMIN_COURSES } from "../data/admin";

interface Props {
  user: User;
  onNavigate: (page: Page) => void;
}

export default function DashboardPage({ user, onNavigate }: Props) {
  const today = new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" });
  const attempts = getMyAttempts(user.studentId);

  const upcomingTests = ADMIN_TESTS.filter((t) => t.status === "active" || t.status === "upcoming").slice(0, 3);
  const recentAttempts = [...attempts].sort((a, b) => b.submittedAt.localeCompare(a.submittedAt)).slice(0, 3);

  // Real performance stats from actual attempts
  const scores = attempts.map((a) => Math.round((a.score / a.maxScore) * 100));
  const avgScore = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : null;
  const highestScore = scores.length ? Math.max(...scores) : null;
  const lowestScore = scores.length ? Math.min(...scores) : null;
  const passedCount = attempts.filter((a) => a.score / a.maxScore >= 0.4).length;
  const overallGrade = avgScore !== null ? calcGrade(avgScore) : null;

  return (
    <div className="p-6 space-y-6 max-w-[1200px]">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-semibold mb-0.5" style={{ color: "var(--color-text-primary)" }}>
            Welcome back, {user.name.split(" ")[0]}
          </h1>
          <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>{today}</p>
        </div>
        <div className="text-right px-4 py-2 rounded" style={{ background: "var(--color-bg-card)", border: "1px solid var(--color-border)" }}>
          <div className="text-xs mb-0.5" style={{ color: "var(--color-text-muted)" }}>Academic Term</div>
          <div className="text-sm font-semibold" style={{ color: "var(--color-text-primary)" }}>Semester {user.semester}</div>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Courses Enrolled", value: String(ADMIN_COURSES.filter((c) => c.status === "active").length), sub: "Active this semester", icon: <BookSIcon />, accent: false },
          { label: "Tests Available", value: String(upcomingTests.length), sub: upcomingTests.length ? "Click Examinations to view" : "No tests scheduled", icon: <CalSIcon />, accent: upcomingTests.length > 0 },
          { label: "Tests Completed", value: String(attempts.length), sub: attempts.length ? `${passedCount} passed` : "None attempted yet", icon: <CheckSIcon />, accent: false },
          { label: "Average Score", value: avgScore !== null ? `${avgScore}%` : "N/A", sub: avgScore !== null ? `Grade: ${overallGrade}` : "Complete a test to see stats", icon: <TrophySIcon />, accent: false },
        ].map((stat) => (
          <div
            key={stat.label}
            className="rounded p-4"
            style={{
              background: stat.accent ? "var(--color-accent-muted)" : "var(--color-bg-card)",
              border: `1px solid ${stat.accent ? "var(--color-accent)" : "var(--color-border)"}`,
            }}
          >
            <div className="flex items-start justify-between mb-3">
              <span style={{ color: stat.accent ? "var(--color-accent)" : "var(--color-text-muted)" }}>{stat.icon}</span>
            </div>
            <div className="text-2xl font-bold mb-0.5" style={{ color: stat.accent ? "var(--color-accent)" : "var(--color-text-primary)" }}>
              {stat.value}
            </div>
            <div className="text-xs font-medium mb-0.5" style={{ color: stat.accent ? "var(--color-accent)" : "var(--color-text-secondary)" }}>
              {stat.label}
            </div>
            <div className="text-xs" style={{ color: "var(--color-text-muted)" }}>{stat.sub}</div>
          </div>
        ))}
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Upcoming Tests */}
        <div className="lg:col-span-2">
          <SectionHeader title="Upcoming Examinations" action="View all" onAction={() => onNavigate("tests")} />
          <div className="rounded" style={{ background: "var(--color-bg-card)", border: "1px solid var(--color-border)" }}>
            {upcomingTests.length === 0 ? (
              <div className="py-12 text-center">
                <div className="text-xs mb-1" style={{ color: "var(--color-text-secondary)" }}>No upcoming examinations</div>
                <div className="text-[10px]" style={{ color: "var(--color-text-muted)" }}>Check back later or visit the Examinations section.</div>
              </div>
            ) : upcomingTests.map((test, i) => (
              <div
                key={test.id}
                className="flex items-center gap-4 px-4 py-3.5"
                style={{ borderBottom: i < upcomingTests.length - 1 ? "1px solid var(--color-border-subtle)" : "none" }}
              >
                <div className="w-10 h-10 rounded shrink-0 flex flex-col items-center justify-center" style={{ background: "var(--color-bg-elevated)" }}>
                  <div className="text-sm font-bold leading-none" style={{ color: "var(--color-accent)" }}>
                    {test.questions}
                  </div>
                  <div className="text-[9px] uppercase tracking-wide mt-0.5" style={{ color: "var(--color-text-muted)" }}>Qs</div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-xs font-medium" style={{ fontFamily: "var(--font-mono)", color: "var(--color-text-muted)" }}>{test.courseCode}</span>
                    <StatusBadge status={test.status} />
                  </div>
                  <div className="text-sm font-medium truncate" style={{ color: "var(--color-text-primary)" }}>{test.title}</div>
                  <div className="text-xs mt-0.5" style={{ color: "var(--color-text-muted)" }}>
                    {test.date} &middot; {test.time} &middot; {test.duration}
                  </div>
                </div>
                <button
                  onClick={() => onNavigate("tests")}
                  className="shrink-0 text-xs font-medium rounded px-3 py-1.5 transition-all"
                  style={{ background: "var(--color-accent)", color: "white" }}
                >
                  Details
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Performance Summary */}
        <div>
          <SectionHeader title="Performance Summary" />
          <div className="rounded p-4 space-y-4" style={{ background: "var(--color-bg-card)", border: "1px solid var(--color-border)" }}>
            {avgScore !== null ? (
              <>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-2xl font-bold" style={{ color: "var(--color-text-primary)" }}>{avgScore}%</div>
                    <div className="text-xs" style={{ color: "var(--color-text-muted)" }}>Average score</div>
                  </div>
                  <div className="text-center px-3 py-2 rounded" style={{ background: "var(--color-bg-elevated)" }}>
                    <div className="text-lg font-bold" style={{ color: "var(--color-success)" }}>{overallGrade}</div>
                    <div className="text-[10px]" style={{ color: "var(--color-text-muted)" }}>Grade</div>
                  </div>
                </div>
                <div className="h-px" style={{ background: "var(--color-border-subtle)" }} />
                <div className="space-y-3">
                  {[
                    { label: "Highest Score", value: `${highestScore}%` },
                    { label: "Lowest Score", value: `${lowestScore}%` },
                    { label: "Tests Passed", value: `${passedCount}/${attempts.length}` },
                  ].map((item) => (
                    <div key={item.label} className="flex items-center justify-between">
                      <div className="text-xs" style={{ color: "var(--color-text-muted)" }}>{item.label}</div>
                      <div className="text-sm font-semibold" style={{ color: "var(--color-text-primary)" }}>{item.value}</div>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="py-8 text-center">
                <div className="text-xs mb-1" style={{ color: "var(--color-text-secondary)" }}>No results yet</div>
                <div className="text-[10px]" style={{ color: "var(--color-text-muted)" }}>Complete an examination to see your performance summary.</div>
              </div>
            )}
            <button
              onClick={() => onNavigate("results")}
              className="w-full text-xs font-medium rounded py-2 transition-all mt-2"
              style={{ border: "1px solid var(--color-border)", color: "var(--color-text-secondary)", background: "transparent" }}
            >
              View full results
            </button>
          </div>
        </div>
      </div>

      {/* Bottom: Courses + Recent Attempts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Registered Courses */}
        <div>
          <SectionHeader title="Registered Courses" action="Manage" onAction={() => onNavigate("courses")} />
          <div className="rounded overflow-hidden" style={{ background: "var(--color-bg-card)", border: "1px solid var(--color-border)" }}>
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: "1px solid var(--color-border)" }}>
                  {["Course", "Cr.", "Status"].map((h) => (
                    <th key={h} className={`text-left px-4 py-2.5 text-xs font-semibold uppercase tracking-wider ${h === "Cr." ? "text-center" : ""}`} style={{ color: "var(--color-text-muted)" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {ADMIN_COURSES.filter((c) => c.status === "active").map((c, i, arr) => (
                  <tr key={c.code} style={{ borderBottom: i < arr.length - 1 ? "1px solid var(--color-border-subtle)" : "none" }}>
                    <td className="px-4 py-3">
                      <div className="text-xs font-medium mb-0.5" style={{ fontFamily: "var(--font-mono)", color: "var(--color-text-muted)" }}>{c.code}</div>
                      <div className="text-xs font-medium" style={{ color: "var(--color-text-primary)" }}>{c.title}</div>
                    </td>
                    <td className="px-3 py-3 text-center text-xs" style={{ color: "var(--color-text-muted)" }}>{c.credits}</td>
                    <td className="px-4 py-3">
                      <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded uppercase" style={{ background: "var(--color-success-bg)", color: "var(--color-success)" }}>Active</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Attempts — real data only */}
        <div>
          <SectionHeader title="Recent Attempts" action="View all" onAction={() => onNavigate("results")} />
          <div className="rounded" style={{ background: "var(--color-bg-card)", border: "1px solid var(--color-border)" }}>
            {recentAttempts.length === 0 ? (
              <div className="py-12 text-center">
                <div className="text-xs mb-1" style={{ color: "var(--color-text-secondary)" }}>No test attempts yet</div>
                <div className="text-[10px]" style={{ color: "var(--color-text-muted)" }}>Your completed exams will appear here.</div>
              </div>
            ) : recentAttempts.map((a, i) => {
              const pct = Math.round((a.score / a.maxScore) * 100);
              const date = new Date(a.submittedAt).toLocaleDateString([], { day: "2-digit", month: "short", year: "numeric" });
              return (
                <div
                  key={a.id}
                  className="px-4 py-3.5"
                  style={{ borderBottom: i < recentAttempts.length - 1 ? "1px solid var(--color-border-subtle)" : "none" }}
                >
                  <div className="flex items-start justify-between mb-1.5">
                    <div className="text-sm font-medium" style={{ color: "var(--color-text-primary)" }}>{a.testTitle}</div>
                    <span className="text-xs font-semibold ml-2 shrink-0 px-2 py-0.5 rounded" style={{ background: "var(--color-success-bg)", color: "var(--color-success)", fontFamily: "var(--font-mono)" }}>
                      {a.grade}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-xs" style={{ color: "var(--color-text-muted)" }}>
                    <span>{date}</span>
                    <span style={{ fontFamily: "var(--font-mono)" }}>{a.score}/{a.maxScore}</span>
                    <span>{pct}%</span>
                  </div>
                  <div className="mt-2 h-1 rounded-full overflow-hidden" style={{ background: "var(--color-bg-elevated)" }}>
                    <div className="h-full rounded-full" style={{ width: `${pct}%`, background: pct >= 75 ? "var(--color-success)" : pct >= 40 ? "var(--color-accent)" : "var(--color-danger)" }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

function SectionHeader({ title, action, onAction }: { title: string; action?: string; onAction?: () => void }) {
  return (
    <div className="flex items-center justify-between mb-3">
      <h2 className="text-sm font-semibold" style={{ color: "var(--color-text-secondary)", letterSpacing: "0.02em" }}>{title}</h2>
      {action && <button onClick={onAction} className="text-xs transition-colors" style={{ color: "var(--color-accent)" }}>{action} &rarr;</button>}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { bg: string; color: string; label: string }> = {
    active:    { bg: "var(--color-accent-muted)", color: "var(--color-accent)", label: "Active" },
    upcoming:  { bg: "var(--color-success-bg)", color: "var(--color-success)", label: "Upcoming" },
    completed: { bg: "var(--color-bg-elevated)", color: "var(--color-text-muted)", label: "Completed" },
  };
  const s = map[status] || map.upcoming;
  return <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded uppercase tracking-wider" style={{ background: s.bg, color: s.color }}>{s.label}</span>;
}

function BookSIcon() { return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2z"/><path d="M22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7z"/></svg>; }
function CalSIcon() { return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>; }
function CheckSIcon() { return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>; }
function TrophySIcon() { return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="8 21 12 21 16 21"/><line x1="12" y1="17" x2="12" y2="21"/><path d="M7 4H17L15 13H9L7 4Z"/><path d="M7 4C5 4 4 5 4 7s1 3 3 3"/><path d="M17 4c2 0 3 1 3 3s-1 3-3 3"/></svg>; }
