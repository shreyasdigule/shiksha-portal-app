import { useState } from "react";
import { getAttempts, gradeColor, isPassed, formatDuration } from "../../store";
import type { TestAttempt } from "../../store";

export default function AdminResultsPage() {
  const [search, setSearch] = useState("");
  const [gradeFilter, setGradeFilter] = useState("All");

  const allAttempts = getAttempts();

  const filtered = allAttempts.filter((a) => {
    const q = search.toLowerCase();
    const matchSearch = q === "" || a.studentName.toLowerCase().includes(q) || a.studentId.toLowerCase().includes(q) || a.testCode.toLowerCase().includes(q) || a.testTitle.toLowerCase().includes(q);
    const matchGrade = gradeFilter === "All" || (gradeFilter === "Pass" ? isPassed(a.grade) : !isPassed(a.grade));
    return matchSearch && matchGrade;
  });

  if (allAttempts.length === 0) {
    return (
      <div className="p-6 max-w-[1080px]">
        <div className="mb-6">
          <h1 className="text-xl font-semibold mb-1" style={{ color: "var(--color-text-primary)" }}>Results Overview</h1>
          <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>Aggregate examination results across all students.</p>
        </div>
        <div className="rounded-lg p-16 text-center" style={{ background: "var(--color-bg-card)", border: "1px solid var(--color-border)" }}>
          <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: "var(--color-bg-elevated)" }}>
            <ChartIcon />
          </div>
          <div className="text-sm font-medium mb-1" style={{ color: "var(--color-text-secondary)" }}>No examination results yet</div>
          <div className="text-xs max-w-[280px] mx-auto leading-relaxed" style={{ color: "var(--color-text-muted)" }}>
            Results will appear here after students complete and submit their examinations.
          </div>
        </div>
      </div>
    );
  }

  const scorePcts = allAttempts.map((a) => Math.round((a.score / a.maxScore) * 100));
  const avgScore = Math.round(scorePcts.reduce((s, v) => s + v, 0) / scorePcts.length);
  const passCount = allAttempts.filter((a) => isPassed(a.grade)).length;
  const passRate = Math.round((passCount / allAttempts.length) * 100);
  const uniqueStudents = new Set(allAttempts.map((a) => a.studentId)).size;

  const byGrade: Record<string, number> = {};
  for (const a of allAttempts) {
    byGrade[a.grade] = (byGrade[a.grade] || 0) + 1;
  }

  const GRADE_ORDER = ["O", "A+", "A", "A-", "B+", "B", "F"];

  return (
    <div className="p-6 max-w-[1080px]">
      <div className="flex items-start justify-between mb-6 flex-wrap gap-4">
        <div>
          <h1 className="text-xl font-semibold mb-1" style={{ color: "var(--color-text-primary)" }}>Results Overview</h1>
          <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>Aggregate examination results across all students.</p>
        </div>
        <button className="flex items-center gap-2 text-sm rounded px-4 py-2" style={{ border: "1px solid var(--color-border)", color: "var(--color-text-secondary)", background: "transparent" }}>
          <ExportIcon /> Export CSV
        </button>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
        {[
          { label: "Total submissions", value: String(allAttempts.length), color: "var(--color-accent)" },
          { label: "Average score", value: `${avgScore}%`, color: "var(--color-text-primary)" },
          { label: "Pass rate", value: `${passRate}%`, color: passRate >= 80 ? "var(--color-success)" : "var(--color-warning)" },
          { label: "Unique students", value: String(uniqueStudents), color: "var(--color-text-primary)" },
        ].map((s) => (
          <div key={s.label} className="rounded px-4 py-4 text-center" style={{ background: "var(--color-bg-card)", border: "1px solid var(--color-border)" }}>
            <div className="text-xl font-bold mb-0.5" style={{ color: s.color, fontFamily: "var(--font-mono)" }}>{s.value}</div>
            <div className="text-[10px]" style={{ color: "var(--color-text-muted)" }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Grade distribution */}
      {Object.keys(byGrade).length > 0 && (
        <div className="rounded p-5 mb-5" style={{ background: "var(--color-bg-card)", border: "1px solid var(--color-border)" }}>
          <div className="text-[10px] font-semibold uppercase tracking-widest mb-4" style={{ color: "var(--color-text-muted)", letterSpacing: "0.1em" }}>Grade Distribution</div>
          <div className="flex items-end gap-4 flex-wrap">
            {GRADE_ORDER.filter((g) => byGrade[g]).map((grade) => {
              const count = byGrade[grade] || 0;
              const pct = Math.round((count / allAttempts.length) * 100);
              const color = gradeColor(grade);
              return (
                <div key={grade} className="flex flex-col items-center gap-1.5">
                  <div className="text-xs" style={{ color: "var(--color-text-muted)", fontFamily: "var(--font-mono)" }}>{pct}%</div>
                  <div className="w-10 rounded" style={{ height: `${Math.max(12, pct * 1.6)}px`, background: color, opacity: 0.8 }} />
                  <div className="text-xs font-bold" style={{ color, fontFamily: "var(--font-mono)" }}>{grade}</div>
                  <div className="text-[10px]" style={{ color: "var(--color-text-muted)" }}>{count}</div>
                </div>
              );
            })}
            <div className="flex-1 min-w-[200px]">
              <div className="space-y-2">
                {GRADE_ORDER.filter((g) => byGrade[g]).map((grade) => {
                  const count = byGrade[grade] || 0;
                  const pct = Math.round((count / allAttempts.length) * 100);
                  const color = gradeColor(grade);
                  return (
                    <div key={grade} className="flex items-center gap-3 text-xs">
                      <span className="w-6 text-right font-bold" style={{ color, fontFamily: "var(--font-mono)" }}>{grade}</span>
                      <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: "var(--color-bg-elevated)" }}>
                        <div className="h-full rounded-full" style={{ width: `${pct}%`, background: color, opacity: 0.8 }} />
                      </div>
                      <span className="w-8 text-right" style={{ color: "var(--color-text-muted)", fontFamily: "var(--font-mono)" }}>{count}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-4">
        <div className="relative flex-1 min-w-[200px]">
          <span className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--color-text-muted)" }}><SearchIcon /></span>
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by student, ID, or test..."
            className="w-full rounded pl-8 pr-3 py-2 text-sm outline-none"
            style={{ background: "var(--color-bg-card)", border: "1px solid var(--color-border)", color: "var(--color-text-primary)", fontFamily: "var(--font-sans)" }}
            onFocus={(e) => (e.target.style.borderColor = "#7c3aed")} onBlur={(e) => (e.target.style.borderColor = "var(--color-border)")} />
        </div>
        <FilterChips options={["All", "Pass", "Fail"]} value={gradeFilter} onChange={setGradeFilter} />
      </div>

      {/* Results table */}
      <div className="rounded overflow-hidden" style={{ background: "var(--color-bg-card)", border: "1px solid var(--color-border)" }}>
        {filtered.length === 0 ? (
          <div className="py-16 text-center text-sm" style={{ color: "var(--color-text-muted)" }}>No results match your search criteria.</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: "1px solid var(--color-border)" }}>
                {["Student", "Test", "Score", "Grade", "Duration", "Submitted"].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-[10px] font-semibold uppercase tracking-wider" style={{ color: "var(--color-text-muted)" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[...filtered].sort((a, b) => b.submittedAt.localeCompare(a.submittedAt)).map((a, i) => {
                const pct = Math.round((a.score / a.maxScore) * 100);
                const passed = isPassed(a.grade);
                const date = new Date(a.submittedAt).toLocaleDateString([], { day: "2-digit", month: "short", year: "numeric" });
                return (
                  <tr key={a.id} style={{ borderBottom: i < filtered.length - 1 ? "1px solid var(--color-border-subtle)" : "none" }}>
                    <td className="px-4 py-3.5">
                      <div className="text-sm font-medium" style={{ color: "var(--color-text-primary)" }}>{a.studentName}</div>
                      <div className="text-[10px]" style={{ fontFamily: "var(--font-mono)", color: "var(--color-text-muted)" }}>{a.studentId}</div>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="text-xs font-medium" style={{ color: "var(--color-text-secondary)" }}>{a.testTitle}</div>
                      <div className="text-[10px]" style={{ fontFamily: "var(--font-mono)", color: "var(--color-text-muted)" }}>{a.testCode}</div>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-2">
                        <div className="w-14 h-1.5 rounded-full overflow-hidden" style={{ background: "var(--color-bg-elevated)" }}>
                          <div className="h-full rounded-full" style={{ width: `${pct}%`, background: pct >= 80 ? "var(--color-success)" : pct >= 60 ? "var(--color-accent)" : "var(--color-warning)" }} />
                        </div>
                        <span className="text-xs whitespace-nowrap" style={{ fontFamily: "var(--font-mono)", color: "var(--color-text-secondary)" }}>{a.score}/{a.maxScore}</span>
                      </div>
                      <span className="text-[9px] font-semibold px-1 py-0.5 rounded uppercase" style={{ background: passed ? "var(--color-success-bg)" : "var(--color-danger-bg)", color: passed ? "var(--color-success)" : "var(--color-danger)" }}>
                        {passed ? "Pass" : "Fail"}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="text-xs font-bold" style={{ color: gradeColor(a.grade), fontFamily: "var(--font-mono)" }}>{a.grade}</span>
                    </td>
                    <td className="px-4 py-3.5 text-xs" style={{ fontFamily: "var(--font-mono)", color: "var(--color-text-muted)" }}>{formatDuration(a.durationSeconds)}</td>
                    <td className="px-4 py-3.5 text-xs" style={{ fontFamily: "var(--font-mono)", color: "var(--color-text-muted)" }}>{date}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      <div className="mt-3 text-xs" style={{ color: "var(--color-text-muted)" }}>
        Showing {filtered.length} of {allAttempts.length} submissions &middot; Pass threshold: 40%
      </div>
    </div>
  );
}

function FilterChips({ options, value, onChange }: { options: string[]; value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex gap-1 p-1 rounded" style={{ background: "var(--color-bg-card)", border: "1px solid var(--color-border)" }}>
      {options.map((o) => (
        <button key={o} onClick={() => onChange(o)} className="px-2.5 py-1 text-xs font-medium rounded capitalize transition-all"
          style={{ background: value === o ? "#7c3aed" : "transparent", color: value === o ? "white" : "var(--color-text-secondary)" }}>
          {o}
        </button>
      ))}
    </div>
  );
}

function SearchIcon() { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>; }
function ExportIcon() { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>; }
function ChartIcon() { return <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--color-text-muted)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/><line x1="2" y1="20" x2="22" y2="20"/></svg>; }
