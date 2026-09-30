import { useState } from "react";
import { getAttemptById } from "../store";
import type { AttemptAnswer } from "../store";

interface Props {
  attemptId: string;
  onBack: () => void;
}

export default function AnswerReviewPage({ attemptId, onBack }: Props) {
  const attempt = getAttemptById(attemptId);
  const [current, setCurrent] = useState(0);

  if (!attempt) {
    return (
      <div className="p-6" style={{ color: "var(--color-text-muted)" }}>
        No review data available for this result.
      </div>
    );
  }

  const questions = attempt.answers;
  if (questions.length === 0) {
    return (
      <div className="p-6">
        <button onClick={onBack} className="flex items-center gap-1.5 text-xs mb-6" style={{ color: "var(--color-text-muted)" }}>
          <ChevronLeft /> Back to Result
        </button>
        <div className="rounded p-12 text-center" style={{ background: "var(--color-bg-card)", border: "1px solid var(--color-border)" }}>
          <div className="text-sm" style={{ color: "var(--color-text-muted)" }}>No questions recorded for this attempt.</div>
        </div>
      </div>
    );
  }

  const q: AttemptAnswer = questions[current];
  const isCorrect = q.selectedOption !== null && q.selectedOption === q.correctOption;
  const isSkipped = q.selectedOption === null;

  const correctCount = questions.filter((x) => x.selectedOption !== null && x.selectedOption === x.correctOption).length;
  const wrongCount = questions.filter((x) => x.selectedOption !== null && x.selectedOption !== x.correctOption).length;
  const skipCount = questions.filter((x) => x.selectedOption === null).length;

  const statusOf = (idx: number) => {
    const x = questions[idx];
    if (idx === current) return "current";
    if (x.selectedOption === null) return "skipped";
    if (x.selectedOption === x.correctOption) return "correct";
    return "wrong";
  };

  return (
    <div className="flex flex-col" style={{ minHeight: "calc(100vh - 57px)" }}>
      {/* Sub-header */}
      <div className="flex items-center justify-between px-6 py-3 shrink-0" style={{ background: "var(--color-bg-surface)", borderBottom: "1px solid var(--color-border)" }}>
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="flex items-center gap-1.5 text-xs transition-colors" style={{ color: "var(--color-text-muted)" }}>
            <ChevronLeft /> Back to Result
          </button>
          <div className="w-px h-4" style={{ background: "var(--color-border)" }} />
          <div>
            <span className="text-xs font-medium" style={{ fontFamily: "var(--font-mono)", color: "var(--color-text-muted)" }}>{attempt.testCode}</span>
            <span className="mx-1.5 text-xs" style={{ color: "var(--color-border)" }}>/</span>
            <span className="text-xs font-semibold" style={{ color: "var(--color-text-primary)" }}>Answer Review</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Pill label="Correct" value={correctCount} color="var(--color-success)" bg="var(--color-success-bg)" />
          <Pill label="Wrong" value={wrongCount} color="var(--color-danger)" bg="var(--color-danger-bg)" />
          <Pill label="Skipped" value={skipCount} color="var(--color-warning)" bg="var(--color-warning-bg)" />
          <span className="text-xs ml-1" style={{ color: "var(--color-text-muted)", fontFamily: "var(--font-mono)" }}>
            {current + 1} / {questions.length}
          </span>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Question panel */}
        <main className="flex-1 overflow-y-auto px-6 py-6">
          <div className="max-w-[700px] mx-auto">
            <div className="flex items-center gap-3 mb-5">
              <div
                className="w-8 h-8 rounded flex items-center justify-center text-sm font-bold shrink-0"
                style={{ background: isCorrect ? "var(--color-success)" : isSkipped ? "var(--color-bg-elevated)" : "var(--color-danger)", color: isSkipped ? "var(--color-text-muted)" : "white" }}
              >
                {current + 1}
              </div>
              <div>
                <div className="text-[10px] uppercase tracking-widest font-semibold" style={{ color: "var(--color-text-muted)", letterSpacing: "0.1em" }}>
                  Question {current + 1} of {questions.length}
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                  <StatusTag correct={isCorrect} skipped={isSkipped} />
                </div>
              </div>
            </div>

            <p className="text-base leading-relaxed mb-6" style={{ color: "var(--color-text-primary)", fontWeight: 450 }}>
              {q.questionText}
            </p>

            <div className="space-y-2.5 mb-8">
              {q.options.map((opt, oi) => {
                const isStudentChoice = q.selectedOption === oi;
                const isCorrectOption = q.correctOption === oi;
                const bg = isCorrectOption ? "var(--color-success-bg)" : isStudentChoice && !isCorrectOption ? "var(--color-danger-bg)" : "var(--color-bg-card)";
                const border = isCorrectOption ? "var(--color-success)66" : isStudentChoice && !isCorrectOption ? "var(--color-danger)66" : "var(--color-border)";
                const textColor = isCorrectOption ? "var(--color-success)" : isStudentChoice && !isCorrectOption ? "var(--color-danger)" : "var(--color-text-secondary)";

                return (
                  <div key={oi} className="flex items-start gap-3.5 rounded px-4 py-3.5" style={{ background: bg, border: `1.5px solid ${border}` }}>
                    <div
                      className="w-5 h-5 rounded-full shrink-0 flex items-center justify-center mt-0.5"
                      style={{ border: `2px solid ${isCorrectOption ? "var(--color-success)" : isStudentChoice ? "var(--color-danger)" : "var(--color-border)"}`, background: isCorrectOption || isStudentChoice ? (isCorrectOption ? "var(--color-success)" : "var(--color-danger)") : "transparent" }}
                    >
                      {isCorrectOption && <svg width="9" height="7" viewBox="0 0 10 7" fill="none"><path d="M1 3.5L3.8 6L9 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                      {isStudentChoice && !isCorrectOption && <svg width="8" height="8" viewBox="0 0 10 10" fill="none"><line x1="2" y1="2" x2="8" y2="8" stroke="white" strokeWidth="1.5" strokeLinecap="round"/><line x1="8" y1="2" x2="2" y2="8" stroke="white" strokeWidth="1.5" strokeLinecap="round"/></svg>}
                    </div>
                    <div className="flex-1 flex items-start gap-3">
                      <span className="text-xs font-bold shrink-0 mt-0.5" style={{ color: isCorrectOption ? "var(--color-success)" : isStudentChoice ? "var(--color-danger)" : "var(--color-text-muted)", fontFamily: "var(--font-mono)" }}>
                        {String.fromCharCode(65 + oi)}
                      </span>
                      <span className="text-sm leading-relaxed" style={{ color: textColor }}>{opt}</span>
                    </div>
                    <div className="shrink-0 flex flex-col items-end gap-1 mt-0.5">
                      {isCorrectOption && <span className="text-[9px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded" style={{ background: "var(--color-success)", color: "white" }}>Correct</span>}
                      {isStudentChoice && !isCorrectOption && <span className="text-[9px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded" style={{ background: "var(--color-danger)", color: "white" }}>Your answer</span>}
                      {isStudentChoice && isCorrectOption && <span className="text-[9px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded" style={{ background: "var(--color-success)", color: "white" }}>Your answer</span>}
                    </div>
                  </div>
                );
              })}
            </div>

            {isSkipped && (
              <div className="rounded p-3.5 text-xs mb-6" style={{ background: "var(--color-warning-bg)", border: "1px solid var(--color-warning)33", color: "var(--color-warning)" }}>
                This question was not answered. No marks deducted.
              </div>
            )}

            <div className="flex items-center justify-between pt-4" style={{ borderTop: "1px solid var(--color-border-subtle)" }}>
              <button
                onClick={() => setCurrent((v) => Math.max(0, v - 1))}
                disabled={current === 0}
                className="flex items-center gap-1.5 text-sm rounded px-4 py-2 transition-all"
                style={{ border: "1px solid var(--color-border)", color: current === 0 ? "var(--color-text-muted)" : "var(--color-text-secondary)", background: "transparent", opacity: current === 0 ? 0.4 : 1, cursor: current === 0 ? "not-allowed" : "pointer" }}
              >
                <ChevronLeft /> Previous
              </button>
              {current < questions.length - 1 ? (
                <button onClick={() => setCurrent((v) => Math.min(questions.length - 1, v + 1))} className="flex items-center gap-1.5 text-sm font-medium rounded px-4 py-2" style={{ background: "var(--color-accent)", color: "white" }}>
                  Next <ChevronRight />
                </button>
              ) : (
                <button onClick={onBack} className="text-sm font-medium rounded px-4 py-2" style={{ background: "var(--color-accent)", color: "white" }}>
                  Back to Result
                </button>
              )}
            </div>
          </div>
        </main>

        {/* Navigator */}
        <aside className="w-[200px] shrink-0 overflow-y-auto p-4" style={{ background: "var(--color-bg-surface)", borderLeft: "1px solid var(--color-border)" }}>
          <div className="text-[10px] font-semibold uppercase tracking-widest mb-3" style={{ color: "var(--color-text-muted)", letterSpacing: "0.1em" }}>Navigator</div>
          <div className="grid grid-cols-3 gap-1 mb-4">
            <MiniStat value={correctCount} color="var(--color-success)" label="OK" />
            <MiniStat value={wrongCount} color="var(--color-danger)" label="X" />
            <MiniStat value={skipCount} color="var(--color-warning)" label="--" />
          </div>
          <div className="grid grid-cols-5 gap-1 mb-4">
            {questions.map((_, idx) => {
              const s = statusOf(idx);
              const styles: Record<string, { bg: string; border: string; color: string }> = {
                current:  { bg: "var(--color-accent)", border: "var(--color-accent)", color: "white" },
                correct:  { bg: "var(--color-success-bg)", border: "var(--color-success)66", color: "var(--color-success)" },
                wrong:    { bg: "var(--color-danger-bg)", border: "var(--color-danger)66", color: "var(--color-danger)" },
                skipped:  { bg: "var(--color-warning-bg)", border: "var(--color-warning)55", color: "var(--color-warning)" },
              };
              const st = styles[s];
              return (
                <button key={idx} onClick={() => setCurrent(idx)} className="flex items-center justify-center rounded text-xs font-semibold transition-all"
                  style={{ height: 30, background: st.bg, border: `1.5px solid ${st.border}`, color: st.color, fontFamily: "var(--font-mono)" }}>
                  {idx + 1}
                </button>
              );
            })}
          </div>
          <div className="space-y-1.5 pt-3" style={{ borderTop: "1px solid var(--color-border-subtle)" }}>
            <LegendRow color="var(--color-accent)" label="Current" />
            <LegendRow color="var(--color-success)" label="Correct" />
            <LegendRow color="var(--color-danger)" label="Incorrect" />
            <LegendRow color="var(--color-warning)" label="Skipped" />
          </div>
        </aside>
      </div>
    </div>
  );
}

function StatusTag({ correct, skipped }: { correct: boolean; skipped: boolean }) {
  if (skipped) return <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded uppercase tracking-wide" style={{ background: "var(--color-warning-bg)", color: "var(--color-warning)" }}>Not answered</span>;
  if (correct) return <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded uppercase tracking-wide" style={{ background: "var(--color-success-bg)", color: "var(--color-success)" }}>Correct</span>;
  return <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded uppercase tracking-wide" style={{ background: "var(--color-danger-bg)", color: "var(--color-danger)" }}>Incorrect</span>;
}
function Pill({ label, value, color, bg }: { label: string; value: number; color: string; bg: string }) {
  return <div className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded" style={{ background: bg }}><span style={{ color, fontFamily: "var(--font-mono)", fontWeight: 600 }}>{value}</span><span style={{ color }}>{label}</span></div>;
}
function MiniStat({ value, color, label }: { value: number; color: string; label: string }) {
  return <div className="rounded p-1.5 text-center" style={{ background: "var(--color-bg-elevated)" }}><div className="text-sm font-bold" style={{ color, fontFamily: "var(--font-mono)" }}>{value}</div><div className="text-[9px]" style={{ color: "var(--color-text-muted)" }}>{label}</div></div>;
}
function LegendRow({ color, label }: { color: string; label: string }) {
  return <div className="flex items-center gap-2"><div className="w-3 h-3 rounded shrink-0" style={{ background: color, opacity: 0.6 }} /><span className="text-[10px]" style={{ color: "var(--color-text-muted)" }}>{label}</span></div>;
}
function ChevronLeft() {
  return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>;
}
function ChevronRight() {
  return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>;
}
