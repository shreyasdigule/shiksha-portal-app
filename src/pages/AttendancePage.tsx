import { getMyAttendance } from "../store";
import type { AttendanceRecord } from "../store";

interface Props {
  studentId: string;
}

export default function AttendancePage({ studentId }: Props) {
  const records = getMyAttendance(studentId);

  if (records.length === 0) {
    return (
      <div className="p-6 max-w-[800px]">
        <div className="mb-6">
          <h1 className="text-xl font-semibold mb-1" style={{ color: "var(--color-text-primary)" }}>Attendance</h1>
          <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>Your day-by-day attendance as recorded by faculty.</p>
        </div>
        <div className="rounded-lg p-16 text-center" style={{ background: "var(--color-bg-card)", border: "1px solid var(--color-border)" }}>
          <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: "var(--color-bg-elevated)" }}>
            <CalendarIcon />
          </div>
          <div className="text-sm font-medium mb-1" style={{ color: "var(--color-text-secondary)" }}>No attendance records available yet</div>
          <div className="text-xs leading-relaxed max-w-[280px] mx-auto" style={{ color: "var(--color-text-muted)" }}>
            Attendance records will appear here after your faculty marks attendance for your enrolled courses.
          </div>
        </div>
      </div>
    );
  }

  // Group by course
  const byCourse: Record<string, { title: string; records: AttendanceRecord[] }> = {};
  for (const r of records) {
    if (!byCourse[r.courseCode]) byCourse[r.courseCode] = { title: r.courseTitle, records: [] };
    byCourse[r.courseCode].records.push(r);
  }

  // Sort each course's records by date descending
  for (const course of Object.values(byCourse)) {
    course.records.sort((a, b) => b.date.localeCompare(a.date));
  }

  const totalPresent = records.filter((r) => r.status === "present").length;
  const overallPct = Math.round((totalPresent / records.length) * 100);

  return (
    <div className="p-6 max-w-[900px]">
      <div className="mb-6">
        <h1 className="text-xl font-semibold mb-1" style={{ color: "var(--color-text-primary)" }}>Attendance</h1>
        <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>Your day-by-day attendance as recorded by faculty.</p>
      </div>

      {/* Overall summary */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: "Total classes", value: String(records.length) },
          { label: "Classes attended", value: String(totalPresent) },
          { label: "Overall attendance", value: `${overallPct}%`, color: overallPct >= 75 ? "var(--color-success)" : overallPct >= 60 ? "var(--color-warning)" : "var(--color-danger)" },
        ].map((s) => (
          <div key={s.label} className="rounded p-4 text-center" style={{ background: "var(--color-bg-card)", border: "1px solid var(--color-border)" }}>
            <div className="text-xl font-bold mb-0.5" style={{ color: s.color ?? "var(--color-text-primary)", fontFamily: "var(--font-mono)" }}>{s.value}</div>
            <div className="text-xs" style={{ color: "var(--color-text-muted)" }}>{s.label}</div>
          </div>
        ))}
      </div>

      {overallPct < 75 && (
        <div className="rounded p-3.5 mb-5 flex items-start gap-3" style={{ background: "var(--color-warning-bg)", border: "1px solid var(--color-warning)44" }}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--color-warning)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 mt-0.5"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
          <div>
            <div className="text-xs font-semibold mb-0.5" style={{ color: "var(--color-warning)" }}>Low Attendance Warning</div>
            <div className="text-xs" style={{ color: "var(--color-warning)", opacity: 0.85 }}>Your overall attendance is below the required 75%. Please contact your academic advisor.</div>
          </div>
        </div>
      )}

      {/* Per-course breakdown */}
      <div className="space-y-5">
        {Object.entries(byCourse).map(([code, { title, records: courseRecords }]) => {
          const present = courseRecords.filter((r) => r.status === "present").length;
          const pct = Math.round((present / courseRecords.length) * 100);
          const pctColor = pct >= 75 ? "var(--color-success)" : pct >= 60 ? "var(--color-warning)" : "var(--color-danger)";

          return (
            <div key={code} className="rounded overflow-hidden" style={{ background: "var(--color-bg-card)", border: "1px solid var(--color-border)" }}>
              {/* Course header */}
              <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: "1px solid var(--color-border-subtle)" }}>
                <div>
                  <div className="text-xs font-medium mb-0.5" style={{ fontFamily: "var(--font-mono)", color: "var(--color-text-muted)" }}>{code}</div>
                  <div className="text-sm font-semibold" style={{ color: "var(--color-text-primary)" }}>{title}</div>
                </div>
                <div className="flex items-center gap-4 shrink-0">
                  <div className="text-right">
                    <div className="text-lg font-bold" style={{ color: pctColor, fontFamily: "var(--font-mono)" }}>{pct}%</div>
                    <div className="text-[10px]" style={{ color: "var(--color-text-muted)" }}>{present}/{courseRecords.length} present</div>
                  </div>
                  <div className="w-24">
                    <div className="h-2 rounded-full overflow-hidden" style={{ background: "var(--color-bg-elevated)" }}>
                      <div className="h-full rounded-full" style={{ width: `${pct}%`, background: pctColor }} />
                    </div>
                  </div>
                </div>
              </div>

              {/* Records table */}
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ borderBottom: "1px solid var(--color-border-subtle)" }}>
                    {["Date", "Status"].map((h) => (
                      <th key={h} className="text-left px-5 py-2.5 text-[10px] font-semibold uppercase tracking-wider" style={{ color: "var(--color-text-muted)" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {courseRecords.map((r, i) => {
                    const date = new Date(r.date + "T00:00:00").toLocaleDateString([], { weekday: "short", day: "2-digit", month: "short", year: "numeric" });
                    const isPresent = r.status === "present";
                    return (
                      <tr key={r.id} style={{ borderBottom: i < courseRecords.length - 1 ? "1px solid var(--color-border-subtle)" : "none" }}>
                        <td className="px-5 py-3 text-sm" style={{ color: "var(--color-text-secondary)", fontFamily: "var(--font-mono)" }}>{date}</td>
                        <td className="px-5 py-3">
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded uppercase tracking-wide"
                            style={{ background: isPresent ? "var(--color-success-bg)" : "var(--color-danger-bg)", color: isPresent ? "var(--color-success)" : "var(--color-danger)" }}>
                            {isPresent ? "Present" : "Absent"}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function CalendarIcon() {
  return <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--color-text-muted)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>;
}
