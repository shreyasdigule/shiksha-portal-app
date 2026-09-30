import { useState } from "react";
import { ALL_TESTS } from "./TestsPage";
import type { Page } from "../App";

interface Props {
  testId: number;
  onBack: () => void;
  onNavigate: (page: Page) => void;
  onBeginExam: (id: number) => void;
}

type Step = "briefing" | "confirm";

export default function TestDetailPage({ testId, onBack, onNavigate, onBeginExam }: Props) {
  const test = ALL_TESTS.find((t) => t.id === testId);
  const [step, setStep] = useState<Step>("briefing");
  const [accepted, setAccepted] = useState(false);

  if (!test) return (
    <div className="p-6" style={{ color: "var(--color-text-muted)" }}>Test not found.</div>
  );

  const isAvailable = test.status === "available";

  // ── Confirm screen ──────────────────────────────────────────────────────────
  if (step === "confirm") {
    return (
      <div className="p-6 max-w-[520px]">
        <button onClick={() => setStep("briefing")} className="flex items-center gap-1.5 text-xs mb-6" style={{ color: "var(--color-text-muted)" }}>
          <ChevronLeftIcon /> Back to test information
        </button>

        <div className="rounded p-6 space-y-5" style={{ background: "var(--color-bg-card)", border: "1px solid var(--color-border)" }}>
          <div className="w-10 h-10 rounded flex items-center justify-center" style={{ background: "var(--color-warning-bg)", border: "1px solid #92400e55" }}>
            <WarnIcon />
          </div>

          <div>
            <div className="text-sm font-semibold mb-1.5" style={{ color: "var(--color-text-primary)" }}>
              You are about to begin the examination
            </div>
            <div className="text-xs leading-relaxed" style={{ color: "var(--color-text-secondary)" }}>
              <span className="font-medium" style={{ color: "var(--color-text-primary)" }}>{test.title} - {test.section}</span>
              <br />Once started, the timer cannot be paused and the test must be completed in a single session.
              The examination will auto-submit when the duration expires.
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            {[
              { label: "Duration", value: test.duration },
              { label: "Questions", value: `${test.questions} MCQ` },
              { label: "Total marks", value: String(test.totalMarks) },
              { label: "Negative marking", value: "-0.5 per wrong" },
            ].map((r) => (
              <div key={r.label} className="rounded px-3 py-2.5" style={{ background: "var(--color-bg-elevated)" }}>
                <div className="text-[10px] mb-0.5" style={{ color: "var(--color-text-muted)" }}>{r.label}</div>
                <div className="text-sm font-semibold" style={{ color: "var(--color-text-primary)", fontFamily: "var(--font-mono)" }}>{r.value}</div>
              </div>
            ))}
          </div>

          <div className="flex items-start gap-3">
            <button
              role="checkbox"
              aria-checked={accepted}
              onClick={() => setAccepted((v) => !v)}
              className="mt-0.5 w-4 h-4 rounded shrink-0 flex items-center justify-center transition-all"
              style={{
                background: accepted ? "var(--color-accent)" : "transparent",
                border: `1.5px solid ${accepted ? "var(--color-accent)" : "var(--color-border)"}`,
              }}
            >
              {accepted && <svg width="9" height="7" viewBox="0 0 10 7" fill="none"><path d="M1 3.5L3.8 6L9 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>}
            </button>
            <span className="text-xs leading-relaxed" style={{ color: "var(--color-text-secondary)" }}>
              I confirm that I am ready to begin. I understand that once started, I cannot pause or restart this examination.
            </span>
          </div>

          <div className="flex gap-2 pt-1">
            <button onClick={() => setStep("briefing")} className="flex-1 text-sm rounded px-4 py-2" style={{ border: "1px solid var(--color-border)", color: "var(--color-text-secondary)", background: "transparent" }}>
              Cancel
            </button>
            <button
              onClick={() => accepted && onBeginExam(test.id)}
              disabled={!accepted}
              className="flex-1 text-sm font-semibold rounded px-4 py-2 transition-all"
              style={{
                background: accepted ? "var(--color-success)" : "var(--color-bg-elevated)",
                color: accepted ? "white" : "var(--color-text-muted)",
                cursor: accepted ? "pointer" : "not-allowed",
              }}
            >
              Begin Examination
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Briefing screen ─────────────────────────────────────────────────────────
  return (
    <div className="p-6 max-w-[820px]">
      <button onClick={onBack} className="flex items-center gap-1.5 text-xs mb-6" style={{ color: "var(--color-text-muted)" }}>
        <ChevronLeftIcon /> Back to Examinations
      </button>

      {/* Header card */}
      <div className="rounded p-5 mb-6 flex items-start justify-between gap-4" style={{ background: "var(--color-bg-card)", border: "1px solid var(--color-border)" }}>
        <div>
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <span className="text-[11px] font-medium" style={{ fontFamily: "var(--font-mono)", color: "var(--color-text-muted)" }}>{test.code}</span>
            <StatusBadge status={test.status} />
            <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ background: "var(--color-bg-elevated)", color: "var(--color-text-muted)" }}>{test.type}</span>
          </div>
          <h1 className="text-lg font-semibold mb-1" style={{ color: "var(--color-text-primary)" }}>{test.title}</h1>
          <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>{test.section} &middot; {test.date} &middot; {test.time}</p>
        </div>
        {isAvailable && (
          <button
            onClick={() => setStep("confirm")}
            className="shrink-0 flex items-center gap-2 text-sm font-semibold rounded px-5 py-2.5"
            style={{ background: "var(--color-success)", color: "white" }}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="white"><polygon points="5 3 19 12 5 21 5 3"/></svg>
            Start Test
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-5">
          {/* Instructions */}
          <Section title="Examination Instructions">
            {test.instructions.length === 0 ? (
              <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>No specific instructions published.</p>
            ) : (
              <ol className="space-y-2.5">
                {test.instructions.map((s, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm">
                    <span className="w-5 h-5 rounded text-xs font-bold flex items-center justify-center shrink-0 mt-0.5" style={{ background: "var(--color-accent-muted)", color: "var(--color-accent)" }}>{i + 1}</span>
                    <span style={{ color: "var(--color-text-secondary)" }}>{s}</span>
                  </li>
                ))}
              </ol>
            )}
          </Section>

          {/* Syllabus */}
          <Section title="Topics Covered">
            <div className="space-y-1.5">
              {test.syllabus.map((t, i) => (
                <div key={i} className="flex items-center gap-2.5 text-sm" style={{ color: "var(--color-text-secondary)" }}>
                  <div className="w-1 h-1 rounded-full shrink-0" style={{ background: "var(--color-accent)" }} />
                  {t}
                </div>
              ))}
            </div>
          </Section>

          {isAvailable && (
            <div className="rounded p-4 text-xs" style={{ background: "var(--color-warning-bg)", border: "1px solid #92400e55", color: "var(--color-warning)" }}>
              <div className="flex items-center gap-2 font-semibold mb-2"><WarnIcon /> Before you start</div>
              <ul className="space-y-1 pl-4 list-disc" style={{ opacity: 0.9 }}>
                <li>Ensure a stable internet connection before starting.</li>
                <li>Do not navigate away or close the browser tab during the test.</li>
                <li>Use of external resources or communication is strictly prohibited.</li>
                <li>The test will auto-submit when the timer reaches zero.</li>
              </ul>
            </div>
          )}
        </div>

        {/* Details sidebar */}
        <div className="space-y-4">
          <Section title="Test Details">
            <div className="space-y-2.5">
              {[
                { label: "Date", value: test.date },
                { label: "Time", value: test.time },
                { label: "Duration", value: test.duration },
                { label: "Questions", value: String(test.questions) },
                { label: "Total marks", value: String(test.totalMarks) },
                { label: "Passing marks", value: String(test.passingMarks) },
                { label: "Negative marking", value: "0.5 / wrong" },
              ].map((r) => (
                <div key={r.label} className="flex justify-between text-xs">
                  <span style={{ color: "var(--color-text-muted)" }}>{r.label}</span>
                  <span style={{ fontFamily: "var(--font-mono)", color: "var(--color-text-secondary)" }}>{r.value}</span>
                </div>
              ))}
            </div>
          </Section>

          {isAvailable ? (
            <button onClick={() => setStep("confirm")} className="w-full flex items-center justify-center gap-2 text-sm font-semibold rounded py-3" style={{ background: "var(--color-success)", color: "white" }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="white"><polygon points="5 3 19 12 5 21 5 3"/></svg>
              Start Examination
            </button>
          ) : test.status === "upcoming" ? (
            <div className="rounded p-3 text-center text-xs" style={{ background: "var(--color-bg-elevated)", border: "1px solid var(--color-border)", color: "var(--color-text-muted)" }}>
              Not yet available
              <div className="mt-1 font-semibold" style={{ color: "var(--color-accent)" }}>Opens in {test.daysLeft} day{test.daysLeft !== 1 ? "s" : ""}</div>
            </div>
          ) : (
            <button onClick={() => onNavigate("results")} className="w-full text-sm font-medium rounded py-2.5" style={{ border: "1px solid var(--color-border)", color: "var(--color-text-secondary)", background: "transparent" }}>
              View Result &rarr;
            </button>
          )}

          <button onClick={onBack} className="w-full text-xs rounded py-2" style={{ border: "1px solid var(--color-border-subtle)", color: "var(--color-text-muted)", background: "transparent" }}>
            &larr; Back to all tests
          </button>
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded p-5" style={{ background: "var(--color-bg-card)", border: "1px solid var(--color-border)" }}>
      <div className="text-[10px] font-semibold uppercase tracking-widest mb-3" style={{ color: "var(--color-text-muted)", letterSpacing: "0.1em" }}>{title}</div>
      {children}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const m: Record<string, { bg: string; color: string; label: string }> = {
    available: { bg: "var(--color-success-bg)", color: "var(--color-success)", label: "Available" },
    upcoming:  { bg: "var(--color-accent-muted)", color: "var(--color-accent)", label: "Upcoming" },
    completed: { bg: "var(--color-bg-elevated)", color: "var(--color-text-muted)", label: "Completed" },
    missed:    { bg: "var(--color-danger-bg)",  color: "var(--color-danger)",  label: "Missed" },
  };
  const s = m[status] || m.upcoming;
  return <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded uppercase tracking-wide" style={{ background: s.bg, color: s.color }}>{s.label}</span>;
}

function ChevronLeftIcon() {
  return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>;
}
function WarnIcon() {
  return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>;
}
