import { getAttemptById, gradeColor, isPassed, formatDuration } from "../store";

interface Props {
  attemptId: string;
  onBack: () => void;
  onReview: (id: string) => void;
  onHistory: () => void;
  isFresh?: boolean;
}

export default function ResultDetailPage({ attemptId, onBack, onReview, onHistory, isFresh }: Props) {
  const a = getAttemptById(attemptId);
  if (!a) {
    return (
      <div className="p-6">
        <button onClick={onBack} className="flex items-center gap-1.5 text-xs mb-6" style={{ color: "var(--color-text-muted)" }}>
          <ChevronLeft /> Back
        </button>
        <div className="rounded p-12 text-center" style={{ background: "var(--color-bg-card)", border: "1px solid var(--color-border)" }}>
          <div className="text-sm" style={{ color: "var(--color-text-muted)" }}>Result not found.</div>
        </div>
      </div>
    );
  }

  const pct = Math.round((a.score / a.maxScore) * 100);
  const passed = isPassed(a.grade);
  const color = gradeColor(a.grade);

  const correctCount = a.answers.filter((x) => x.selectedOption !== null && x.selectedOption === x.correctOption).length;
  const wrongCount = a.answers.filter((x) => x.selectedOption !== null && x.selectedOption !== x.correctOption).length;
  const skippedCount = a.answers.filter((x) => x.selectedOption === null).length;
  const total = a.answers.length;

  const RADIUS = 54;
  const CIRC = 2 * Math.PI * RADIUS;
  const dash = (pct / 100) * CIRC;

  const date = new Date(a.submittedAt).toLocaleDateString([], { day: "2-digit", month: "short", year: "numeric" });
  const time = new Date(a.submittedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  const passingScore = Math.round(a.maxScore * 0.4);

  return (
    <div className="p-6 max-w-[900px]">
      <button onClick={onBack} className="flex items-center gap-1.5 text-xs mb-6 transition-colors" style={{ color: "var(--color-text-muted)" }}>
        <ChevronLeft /> {isFresh ? "Back to Tests" : "Back to History"}
      </button>

      {isFresh && (
        <div className="flex items-center gap-3 rounded p-3.5 mb-6 text-sm" style={{ background: "var(--color-success-bg)", border: "1px solid var(--color-success)44" }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--color-success)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
          <span style={{ color: "var(--color-success)" }}>Your examination has been submitted and scored. Results are shown below.</span>
        </div>
      )}

      {/* Header */}
      <div className="rounded p-5 mb-6 flex items-start justify-between gap-4 flex-wrap" style={{ background: "var(--color-bg-card)", border: "1px solid var(--color-border)" }}>
        <div>
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <span className="text-[11px] font-medium" style={{ fontFamily: "var(--font-mono)", color: "var(--color-text-muted)" }}>{a.testCode}</span>
            <span
              className="text-[10px] font-semibold px-1.5 py-0.5 rounded uppercase tracking-wide"
              style={{ background: passed ? "var(--color-success-bg)" : "var(--color-danger-bg)", color: passed ? "var(--color-success)" : "var(--color-danger)" }}
            >
              {passed ? "Passed" : "Failed"}
            </span>
          </div>
          <h1 className="text-lg font-semibold mb-1" style={{ color: "var(--color-text-primary)" }}>{a.testTitle}</h1>
          <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
            Submitted {date} at {time} &middot; Duration: {formatDuration(a.durationSeconds)}
          </p>
        </div>
        <div className="flex gap-2 shrink-0 flex-wrap">
          <button onClick={() => onReview(a.id)} className="text-sm rounded px-4 py-2 transition-all" style={{ border: "1px solid var(--color-border)", color: "var(--color-text-secondary)", background: "transparent" }}>
            Review Answers
          </button>
          <button onClick={onHistory} className="text-sm font-medium rounded px-4 py-2" style={{ background: "var(--color-accent)", color: "white" }}>
            Result History
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-5">
          {/* Score card */}
          <div className="rounded p-6 flex items-center gap-8" style={{ background: "var(--color-bg-card)", border: "1px solid var(--color-border)" }}>
            <div className="relative shrink-0" style={{ width: 136, height: 136 }}>
              <svg width="136" height="136" viewBox="0 0 136 136">
                <circle cx="68" cy="68" r={RADIUS} fill="none" stroke="var(--color-bg-elevated)" strokeWidth="8" />
                <circle cx="68" cy="68" r={RADIUS} fill="none" stroke={color} strokeWidth="8"
                  strokeDasharray={`${dash} ${CIRC - dash}`} strokeLinecap="round" transform="rotate(-90 68 68)" />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <div className="text-3xl font-bold" style={{ color: "var(--color-text-primary)", fontFamily: "var(--font-mono)" }}>{pct}%</div>
                <div className="text-sm font-semibold mt-0.5" style={{ color }}>{a.grade}</div>
              </div>
            </div>
            <div className="flex-1 space-y-4">
              <div>
                <div className="text-2xl font-bold mb-0.5" style={{ color: "var(--color-text-primary)", fontFamily: "var(--font-mono)" }}>
                  {a.score} <span className="text-base font-normal" style={{ color: "var(--color-text-muted)" }}>/ {a.maxScore}</span>
                </div>
                <div className="text-xs" style={{ color: "var(--color-text-muted)" }}>Marks obtained &middot; Passing mark: {passingScore}</div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <MetricTile label="Duration" value={formatDuration(a.durationSeconds)} color="var(--color-text-primary)" />
                <MetricTile label="Security events" value={String(a.securityEventCount)} color={a.securityEventCount > 0 ? "var(--color-warning)" : "var(--color-success)"} />
              </div>
              <div>
                <div className="h-2 rounded-full overflow-hidden" style={{ background: "var(--color-bg-elevated)" }}>
                  <div className="h-full rounded-full" style={{ width: `${pct}%`, background: color }} />
                </div>
                <div className="flex justify-between mt-1 text-[10px]" style={{ color: "var(--color-text-muted)" }}>
                  <span>0%</span>
                  <span style={{ color: "var(--color-warning)" }}>Passing: 40%</span>
                  <span>100%</span>
                </div>
              </div>
            </div>
          </div>

          {/* Question breakdown */}
          <div className="rounded p-5" style={{ background: "var(--color-bg-card)", border: "1px solid var(--color-border)" }}>
            <SectionLabel>Question Breakdown</SectionLabel>
            <div className="grid grid-cols-4 gap-3 mb-5">
              {[
                { label: "Total", value: total, color: "var(--color-text-primary)", bg: "var(--color-bg-elevated)", border: "var(--color-border)" },
                { label: "Correct", value: correctCount, color: "var(--color-success)", bg: "var(--color-success-bg)", border: "var(--color-success)33" },
                { label: "Incorrect", value: wrongCount, color: "var(--color-danger)", bg: "var(--color-danger-bg)", border: "var(--color-danger)33" },
                { label: "Skipped", value: skippedCount, color: "var(--color-warning)", bg: "var(--color-warning-bg)", border: "var(--color-warning)33" },
              ].map((item) => (
                <div key={item.label} className="rounded p-4 text-center" style={{ background: item.bg, border: `1px solid ${item.border}` }}>
                  <div className="text-2xl font-bold mb-0.5" style={{ color: item.color, fontFamily: "var(--font-mono)" }}>{item.value}</div>
                  <div className="text-[10px] font-medium uppercase tracking-wide" style={{ color: item.color, opacity: 0.75 }}>{item.label}</div>
                </div>
              ))}
            </div>
            {total > 0 && (
              <>
                <div className="flex h-2 rounded-full overflow-hidden gap-0.5">
                  <div style={{ flex: correctCount || 0.001, background: "var(--color-success)" }} />
                  <div style={{ flex: wrongCount || 0.001, background: "var(--color-danger)" }} />
                  <div style={{ flex: skippedCount || 0.001, background: "var(--color-warning)" }} />
                </div>
                <div className="flex gap-4 mt-2">
                  {[
                    { label: "Correct", color: "var(--color-success)", pct: Math.round((correctCount / total) * 100) },
                    { label: "Incorrect", color: "var(--color-danger)", pct: Math.round((wrongCount / total) * 100) },
                    { label: "Skipped", color: "var(--color-warning)", pct: Math.round((skippedCount / total) * 100) },
                  ].map((s) => (
                    <div key={s.label} className="flex items-center gap-1.5 text-[10px]" style={{ color: "var(--color-text-muted)" }}>
                      <div className="w-2 h-2 rounded-full" style={{ background: s.color }} />
                      {s.label} ({s.pct}%)
                    </div>
                  ))}
                </div>
              </>
            )}
            <div className="mt-4">
              <button onClick={() => onReview(a.id)} className="text-sm font-medium rounded px-4 py-2 transition-all" style={{ border: "1px solid var(--color-border)", color: "var(--color-text-secondary)", background: "transparent" }}>
                Review all answers &rarr;
              </button>
            </div>
          </div>
        </div>

        {/* Right sidebar */}
        <div className="space-y-4">
          {/* Scoring detail */}
          <div className="rounded p-5" style={{ background: "var(--color-bg-card)", border: "1px solid var(--color-border)" }}>
            <SectionLabel>Scoring Detail</SectionLabel>
            <div className="space-y-2.5">
              {[
                { label: "Correct answers", value: `${correctCount} x +2`, result: `+${correctCount * 2}` },
                { label: "Wrong answers", value: `${wrongCount} x -0.5`, result: wrongCount > 0 ? `-${(wrongCount * 0.5).toFixed(1)}` : "0" },
                { label: "Skipped", value: `${skippedCount} x 0`, result: "0" },
              ].map((row) => (
                <div key={row.label} className="flex justify-between text-xs gap-2">
                  <span style={{ color: "var(--color-text-muted)" }}>{row.label}</span>
                  <span style={{ color: "var(--color-text-muted)", fontFamily: "var(--font-mono)" }}>{row.value}</span>
                  <span style={{ color: "var(--color-text-secondary)", fontFamily: "var(--font-mono)" }}>{row.result}</span>
                </div>
              ))}
              <div className="flex justify-between text-sm font-semibold pt-2.5" style={{ borderTop: "1px solid var(--color-border-subtle)" }}>
                <span style={{ color: "var(--color-text-primary)" }}>Final score</span>
                <span style={{ color, fontFamily: "var(--font-mono)" }}>{a.score} pts</span>
              </div>
            </div>
          </div>

          {/* Exam info */}
          <div className="rounded p-5" style={{ background: "var(--color-bg-card)", border: "1px solid var(--color-border)" }}>
            <SectionLabel>Submission Info</SectionLabel>
            <div className="space-y-2.5">
              {[
                { label: "Test code", value: a.testCode },
                { label: "Submitted", value: `${date} ${time}` },
                { label: "Duration", value: formatDuration(a.durationSeconds) },
                { label: "Total questions", value: String(total) },
                { label: "Max marks", value: String(a.maxScore) },
                { label: "Passing marks", value: String(passingScore) },
                { label: "Security events", value: String(a.securityEventCount) },
              ].map((row) => (
                <div key={row.label} className="flex justify-between text-xs">
                  <span style={{ color: "var(--color-text-muted)" }}>{row.label}</span>
                  <span style={{ color: "var(--color-text-secondary)", fontFamily: "var(--font-mono)" }}>{row.value}</span>
                </div>
              ))}
            </div>
          </div>

          <button onClick={onHistory} className="w-full text-sm rounded py-2.5 transition-all" style={{ border: "1px solid var(--color-border)", color: "var(--color-text-muted)", background: "transparent" }}>
            &larr; View all results
          </button>
        </div>
      </div>
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <div className="text-[10px] font-semibold uppercase tracking-widest mb-3" style={{ color: "var(--color-text-muted)", letterSpacing: "0.1em" }}>{children}</div>;
}
function MetricTile({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="rounded px-3 py-2.5" style={{ background: "var(--color-bg-elevated)" }}>
      <div className="text-[10px] mb-0.5" style={{ color: "var(--color-text-muted)" }}>{label}</div>
      <div className="text-sm font-semibold" style={{ color, fontFamily: "var(--font-mono)" }}>{value}</div>
    </div>
  );
}
function ChevronLeft() {
  return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>;
}
