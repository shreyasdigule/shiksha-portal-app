import { useState } from "react";
import { getMyAttempts, gradeColor, isPassed, formatDuration } from "../store";
import type { TestAttempt } from "../store";

interface Props {
  studentId: string;
  freshAttemptId?: string;
  onDetail: (id: string) => void;
}

type Tab = "history" | "performance";

export default function ResultsPage({ studentId, freshAttemptId, onDetail }: Props) {
  const [tab, setTab] = useState<Tab>("history");
  const [search, setSearch] = useState("");

  const attempts = getMyAttempts(studentId);

  const filtered = attempts.filter((a) => {
    const q = search.toLowerCase();
    return q === "" || a.testTitle.toLowerCase().includes(q) || a.testCode.toLowerCase().includes(q) || a.courseCode.toLowerCase().includes(q);
  });

  if (attempts.length === 0) {
    return (
      <div className="p-6 max-w-[800px]">
        <div className="mb-6">
          <h1 className="text-xl font-semibold mb-1" style={{ color: "var(--color-text-primary)" }}>Results</h1>
          <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>Your examination history and performance analytics.</p>
        </div>
        <div className="rounded-lg p-16 text-center" style={{ background: "var(--color-bg-card)", border: "1px solid var(--color-border)" }}>
          <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: "var(--color-bg-elevated)" }}>
            <ClipboardIcon />
          </div>
          <div className="text-sm font-medium mb-1" style={{ color: "var(--color-text-secondary)" }}>No examination results yet</div>
          <div className="text-xs leading-relaxed max-w-[280px] mx-auto" style={{ color: "var(--color-text-muted)" }}>
            Results will appear here after you complete and submit an examination. Your scores and answer review will be available immediately.
          </div>
        </div>
      </div>
    );
  }

  const scorePcts = attempts.map((a) => Math.round((a.score / a.maxScore) * 100));
  const avg = Math.round(scorePcts.reduce((s, v) => s + v, 0) / scorePcts.length);
  const best = Math.max(...scorePcts);
  const passCount = attempts.filter((a) => isPassed(a.grade)).length;

  return (
    <div className="p-6 max-w-[1080px]">
      <div className="mb-6">
        <h1 className="text-xl font-semibold mb-1" style={{ color: "var(--color-text-primary)" }}>Results</h1>
        <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>Your examination history and performance analytics.</p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6 p-4 rounded" style={{ background: "var(--color-bg-card)", border: "1px solid var(--color-border)" }}>
        {[
          { label: "Tests completed", value: String(attempts.length) },
          { label: "Average score", value: `${avg}%` },
          { label: "Best score", value: `${best}%` },
          { label: "Tests passed", value: `${passCount} / ${attempts.length}` },
        ].map((s) => (
          <div key={s.label} className="text-center">
            <div className="text-xl font-bold" style={{ color: "var(--color-text-primary)", fontFamily: "var(--font-mono)" }}>{s.value}</div>
            <div className="text-xs mt-0.5" style={{ color: "var(--color-text-muted)" }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 p-1 rounded w-fit" style={{ background: "var(--color-bg-card)", border: "1px solid var(--color-border)" }}>
        {(["history", "performance"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className="px-4 py-1.5 text-sm font-medium rounded capitalize transition-all"
            style={{ background: tab === t ? "var(--color-accent)" : "transparent", color: tab === t ? "white" : "var(--color-text-secondary)" }}
          >
            {t === "history" ? "Result History" : "Performance Overview"}
          </button>
        ))}
      </div>

      {tab === "history" ? (
        <HistoryTab
          filtered={filtered}
          search={search}
          setSearch={setSearch}
          onDetail={onDetail}
          highlightId={freshAttemptId}
        />
      ) : (
        <PerformanceTab attempts={attempts} onDetail={onDetail} />
      )}
    </div>
  );
}

// ── History tab ───────────────────────────────────────────────────────────────

function HistoryTab({
  filtered, search, setSearch, onDetail, highlightId,
}: {
  filtered: TestAttempt[];
  search: string; setSearch: (v: string) => void;
  onDetail: (id: string) => void;
  highlightId?: string;
}) {
  return (
    <div>
      <div className="flex flex-wrap gap-2 mb-5">
        <div className="relative flex-1 min-w-[200px]">
          <span className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--color-text-muted)" }}><SearchIcon /></span>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by test title or course code..."
            className="w-full rounded pl-8 pr-3 py-2 text-sm outline-none"
            style={{ background: "var(--color-bg-card)", border: "1px solid var(--color-border)", color: "var(--color-text-primary)", fontFamily: "var(--font-sans)" }}
            onFocus={(e) => (e.target.style.borderColor = "var(--color-accent)")}
            onBlur={(e) => (e.target.style.borderColor = "var(--color-border)")}
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded p-12 text-center" style={{ background: "var(--color-bg-card)", border: "1px solid var(--color-border-subtle)" }}>
          <div className="text-sm font-medium mb-1" style={{ color: "var(--color-text-secondary)" }}>No results match your search</div>
          <div className="text-xs" style={{ color: "var(--color-text-muted)" }}>Try adjusting your search query.</div>
        </div>
      ) : (
        <div className="rounded overflow-hidden" style={{ background: "var(--color-bg-card)", border: "1px solid var(--color-border)" }}>
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: "1px solid var(--color-border)" }}>
                {["Test", "Date", "Score", "%", "Grade", "Status", "Duration", ""].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider whitespace-nowrap" style={{ color: "var(--color-text-muted)" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[...filtered].reverse().map((a, i) => {
                const pct = Math.round((a.score / a.maxScore) * 100);
                const passed = isPassed(a.grade);
                const isHighlight = a.id === highlightId;
                const date = new Date(a.submittedAt).toLocaleDateString([], { day: "2-digit", month: "short", year: "numeric" });
                return (
                  <tr
                    key={a.id}
                    style={{
                      borderBottom: i < filtered.length - 1 ? "1px solid var(--color-border-subtle)" : "none",
                      background: isHighlight ? "var(--color-accent-muted)" : "transparent",
                    }}
                  >
                    <td className="px-4 py-3.5">
                      <div className="text-[11px] mb-0.5" style={{ fontFamily: "var(--font-mono)", color: "var(--color-text-muted)" }}>{a.testCode}</div>
                      <div className="text-sm font-medium" style={{ color: "var(--color-text-primary)" }}>{a.testTitle}</div>
                    </td>
                    <td className="px-4 py-3.5 text-xs whitespace-nowrap" style={{ color: "var(--color-text-muted)", fontFamily: "var(--font-mono)" }}>{date}</td>
                    <td className="px-4 py-3.5 text-xs whitespace-nowrap" style={{ color: "var(--color-text-secondary)", fontFamily: "var(--font-mono)" }}>{a.score}/{a.maxScore}</td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-2" style={{ minWidth: 80 }}>
                        <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: "var(--color-bg-elevated)" }}>
                          <div className="h-full rounded-full" style={{ width: `${pct}%`, background: pct >= 85 ? "var(--color-success)" : pct >= 60 ? "var(--color-accent)" : "var(--color-warning)" }} />
                        </div>
                        <span className="text-xs shrink-0" style={{ fontFamily: "var(--font-mono)", color: "var(--color-text-muted)" }}>{pct}%</span>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      <span className="text-xs font-semibold px-2 py-0.5 rounded" style={{ background: "var(--color-bg-elevated)", color: gradeColor(a.grade), fontFamily: "var(--font-mono)" }}>
                        {a.grade}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded uppercase tracking-wide"
                        style={{ background: passed ? "var(--color-success-bg)" : "var(--color-danger-bg)", color: passed ? "var(--color-success)" : "var(--color-danger)" }}>
                        {passed ? "Pass" : "Fail"}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-xs whitespace-nowrap" style={{ color: "var(--color-text-muted)", fontFamily: "var(--font-mono)" }}>
                      {formatDuration(a.durationSeconds)}
                    </td>
                    <td className="px-4 py-3.5">
                      <button
                        onClick={() => onDetail(a.id)}
                        className="text-xs font-medium rounded px-3 py-1.5 whitespace-nowrap transition-all"
                        style={{ border: "1px solid var(--color-border)", color: "var(--color-text-secondary)", background: "transparent" }}
                      >
                        View Result
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ── Performance tab ───────────────────────────────────────────────────────────

function PerformanceTab({ attempts, onDetail }: { attempts: TestAttempt[]; onDetail: (id: string) => void }) {
  const chronological = [...attempts].sort((a, b) => a.submittedAt.localeCompare(b.submittedAt));

  // Score trend chart
  const CHART_W = 560;
  const CHART_H = 180;
  const PAD = { top: 16, right: 16, bottom: 40, left: 40 };
  const plotW = CHART_W - PAD.left - PAD.right;
  const plotH = CHART_H - PAD.top - PAD.bottom;
  const barW = Math.max(12, Math.floor(plotW / chronological.length) - 8);
  const yLines = [0, 25, 50, 75, 100];

  const totalCorrect = attempts.reduce((s, a) => s + a.answers.filter((x) => x.selectedOption !== null && x.selectedOption === x.correctOption).length, 0);
  const totalAnswered = attempts.reduce((s, a) => s + a.answers.filter((x) => x.selectedOption !== null).length, 0);
  const totalQ = attempts.reduce((s, a) => s + a.answers.length, 0);
  const passCount = attempts.filter((a) => isPassed(a.grade)).length;

  return (
    <div className="space-y-5">
      {/* Score trend */}
      <div className="rounded p-5" style={{ background: "var(--color-bg-card)", border: "1px solid var(--color-border)" }}>
        <div className="flex items-center justify-between mb-5">
          <SectionLabel>Score Trend</SectionLabel>
          <span className="text-[10px]" style={{ color: "var(--color-text-muted)" }}>Chronological order, oldest to newest</span>
        </div>
        <div style={{ overflowX: "auto" }}>
          <svg width={CHART_W} height={CHART_H} style={{ display: "block", fontFamily: "var(--font-mono)" }}>
            {yLines.map((v) => {
              const y = PAD.top + plotH - (v / 100) * plotH;
              return (
                <g key={v}>
                  <line x1={PAD.left} y1={y} x2={CHART_W - PAD.right} y2={y} stroke="var(--color-border-subtle)" strokeWidth="1" />
                  <text x={PAD.left - 6} y={y + 4} textAnchor="end" fontSize="9" fill="var(--color-text-muted)">{v}%</text>
                </g>
              );
            })}
            {/* Pass line */}
            {(() => {
              const y = PAD.top + plotH - (40 / 100) * plotH;
              return <g><line x1={PAD.left} y1={y} x2={CHART_W - PAD.right} y2={y} stroke="var(--color-warning)" strokeWidth="1" strokeDasharray="4 3" /><text x={CHART_W - PAD.right + 4} y={y + 4} fontSize="8" fill="var(--color-warning)">Pass</text></g>;
            })()}
            {chronological.length > 1 && (
              <polyline
                points={chronological.map((a, i) => {
                  const pct = Math.round((a.score / a.maxScore) * 100);
                  const x = PAD.left + i * (plotW / chronological.length) + barW / 2 + 4;
                  const y = PAD.top + plotH - (pct / 100) * plotH;
                  return `${x},${y}`;
                }).join(" ")}
                fill="none" stroke="var(--color-accent)" strokeWidth="1.5" strokeDasharray="3 2" opacity="0.5"
              />
            )}
            {chronological.map((a, i) => {
              const pct = Math.round((a.score / a.maxScore) * 100);
              const x = PAD.left + i * (plotW / chronological.length) + 4;
              const barH = (pct / 100) * plotH;
              const y = PAD.top + plotH - barH;
              const color = pct >= 85 ? "var(--color-success)" : pct >= 60 ? "var(--color-accent)" : "var(--color-warning)";
              const midX = x + barW / 2;
              const label = a.testCode.length > 8 ? a.testCode.slice(0, 8) : a.testCode;
              const date = new Date(a.submittedAt).toLocaleDateString([], { month: "short", day: "numeric" });
              return (
                <g key={a.id} style={{ cursor: "pointer" }} onClick={() => onDetail(a.id)}>
                  <rect x={x} y={y} width={barW} height={barH} rx="2" fill={color} opacity="0.8" />
                  <text x={midX} y={y - 4} textAnchor="middle" fontSize="9" fill="var(--color-text-muted)">{pct}</text>
                  <text x={midX} y={CHART_H - PAD.bottom + 14} textAnchor="middle" fontSize="8" fill="var(--color-text-muted)">{label}</text>
                  <text x={midX} y={CHART_H - PAD.bottom + 24} textAnchor="middle" fontSize="7.5" fill="var(--color-text-muted)">{date}</text>
                </g>
              );
            })}
          </svg>
        </div>
      </div>

      {/* Aggregate stats */}
      <div className="rounded p-5" style={{ background: "var(--color-bg-card)", border: "1px solid var(--color-border)" }}>
        <SectionLabel>Aggregate Statistics</SectionLabel>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: "Total questions attempted", value: String(totalQ) },
            { label: "Total correct answers", value: String(totalCorrect) },
            { label: "Questions answered", value: String(totalAnswered) },
            { label: "Accuracy rate", value: totalAnswered > 0 ? `${Math.round((totalCorrect / totalAnswered) * 100)}%` : "N/A" },
            { label: "Total marks earned", value: String(attempts.reduce((s, a) => s + a.score, 0)) },
            { label: "Total marks available", value: String(attempts.reduce((s, a) => s + a.maxScore, 0)) },
            { label: "Pass rate", value: `${Math.round((passCount / attempts.length) * 100)}%` },
            { label: "Tests passed", value: `${passCount} / ${attempts.length}` },
          ].map((item) => (
            <div key={item.label} className="rounded px-3 py-3" style={{ background: "var(--color-bg-elevated)" }}>
              <div className="text-base font-bold mb-0.5" style={{ color: "var(--color-text-primary)", fontFamily: "var(--font-mono)" }}>{item.value}</div>
              <div className="text-[10px] leading-snug" style={{ color: "var(--color-text-muted)" }}>{item.label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <div className="text-[10px] font-semibold uppercase tracking-widest mb-3" style={{ color: "var(--color-text-muted)", letterSpacing: "0.1em" }}>{children}</div>;
}
function SearchIcon() {
  return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>;
}
function ClipboardIcon() {
  return <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--color-text-muted)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M16 4h2a2 2 0 012 2v14a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2h2"/><rect x="8" y="2" width="8" height="4" rx="1"/></svg>;
}
