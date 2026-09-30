import { useState } from "react";
import { getStudents, getAttendance, mergeAttendanceRecords } from "../../store";
import type { AttendanceRecord } from "../../store";
import { ADMIN_COURSES } from "../../data/admin";

type ViewMode = "mark" | "history";

export default function AdminAttendancePage() {
  const [viewMode, setViewMode] = useState<ViewMode>("mark");
  const [selectedCourse, setSelectedCourse] = useState<string>("");
  const [date, setDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [markings, setMarkings] = useState<Record<string, "present" | "absent">>({});
  const [saved, setSaved] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  // For history view
  const [histCourse, setHistCourse] = useState("All");
  const [histDate, setHistDate] = useState("");

  const students = getStudents();
  const activeCourses = ADMIN_COURSES.filter((c) => c.status === "active");

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const handleToggle = (studentId: string) => {
    setSaved(false);
    setMarkings((prev) => ({
      ...prev,
      [studentId]: prev[studentId] === "present" ? "absent" : "present",
    }));
  };

  const handleMarkAll = (status: "present" | "absent") => {
    setSaved(false);
    const newMarkings: Record<string, "present" | "absent"> = {};
    for (const s of students) { newMarkings[s.studentId] = status; }
    setMarkings(newMarkings);
  };

  const handleSave = () => {
    if (!selectedCourse || !date) { showToast("Please select a course and date."); return; }
    const course = ADMIN_COURSES.find((c) => c.code === selectedCourse);
    if (!course) return;

    const records: AttendanceRecord[] = students.map((s) => ({
      id: `${date}-${selectedCourse}-${s.studentId}`,
      date,
      courseCode: selectedCourse,
      courseTitle: course.title,
      studentId: s.studentId,
      status: markings[s.studentId] ?? "absent",
      markedAt: new Date().toISOString(),
    }));

    mergeAttendanceRecords(records);
    setSaved(true);
    showToast(`Attendance saved for ${course.title} on ${formatDateLabel(date)}.`);
  };

  // Load existing records for the selected course + date into markings
  const handleLoadExisting = () => {
    if (!selectedCourse || !date) return;
    const existing = getAttendance().filter((r) => r.courseCode === selectedCourse && r.date === date);
    if (existing.length === 0) return;
    const m: Record<string, "present" | "absent"> = {};
    for (const r of existing) { m[r.studentId] = r.status; }
    setMarkings(m);
    setSaved(false);
  };

  // History data
  const allRecords = getAttendance();
  const histFiltered = allRecords.filter((r) => {
    const matchCourse = histCourse === "All" || r.courseCode === histCourse;
    const matchDate = histDate === "" || r.date === histDate;
    return matchCourse && matchDate;
  });

  // Group history by date + course
  const histGroups: Record<string, AttendanceRecord[]> = {};
  for (const r of histFiltered) {
    const key = `${r.date}__${r.courseCode}`;
    if (!histGroups[key]) histGroups[key] = [];
    histGroups[key].push(r);
  }
  const sortedGroupKeys = Object.keys(histGroups).sort().reverse();

  return (
    <div className="p-6 max-w-[1080px]">
      {toast && (
        <div className="fixed top-4 right-4 z-50 rounded px-4 py-2.5 text-sm font-medium shadow-lg" style={{ background: "var(--color-success)", color: "white" }}>
          {toast}
        </div>
      )}

      <div className="mb-6">
        <h1 className="text-xl font-semibold mb-1" style={{ color: "var(--color-text-primary)" }}>Attendance</h1>
        <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>Mark attendance for your courses and view historical records.</p>
      </div>

      {/* Mode tabs */}
      <div className="flex gap-1 mb-6 p-1 rounded w-fit" style={{ background: "var(--color-bg-card)", border: "1px solid var(--color-border)" }}>
        {([["mark", "Mark Attendance"], ["history", "View History"]] as [ViewMode, string][]).map(([m, label]) => (
          <button
            key={m}
            onClick={() => setViewMode(m)}
            className="px-4 py-1.5 text-sm font-medium rounded transition-all"
            style={{ background: viewMode === m ? "#7c3aed" : "transparent", color: viewMode === m ? "white" : "var(--color-text-secondary)" }}
          >
            {label}
          </button>
        ))}
      </div>

      {viewMode === "mark" ? (
        <div>
          {/* Course + date selectors */}
          <div className="flex flex-wrap gap-3 mb-5">
            <div className="flex-1 min-w-[180px]">
              <label className="block text-[10px] font-semibold uppercase tracking-wider mb-1.5" style={{ color: "var(--color-text-muted)" }}>Course</label>
              <select
                value={selectedCourse}
                onChange={(e) => { setSelectedCourse(e.target.value); setMarkings({}); setSaved(false); }}
                className="w-full rounded px-3 py-2 text-sm outline-none"
                style={{ background: "var(--color-bg-card)", border: "1px solid var(--color-border)", color: "var(--color-text-primary)", fontFamily: "var(--font-sans)" }}
              >
                <option value="">Select a course...</option>
                {activeCourses.map((c) => (
                  <option key={c.code} value={c.code}>{c.code} - {c.title}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-semibold uppercase tracking-wider mb-1.5" style={{ color: "var(--color-text-muted)" }}>Date</label>
              <input
                type="date"
                value={date}
                onChange={(e) => { setDate(e.target.value); setMarkings({}); setSaved(false); }}
                className="rounded px-3 py-2 text-sm outline-none"
                style={{ background: "var(--color-bg-card)", border: "1px solid var(--color-border)", color: "var(--color-text-primary)", fontFamily: "var(--font-mono)" }}
              />
            </div>

            {selectedCourse && date && (
              <div className="self-end">
                <button
                  onClick={handleLoadExisting}
                  className="px-4 py-2 text-sm rounded transition-all"
                  style={{ border: "1px solid var(--color-border)", color: "var(--color-text-secondary)", background: "transparent" }}
                >
                  Load saved records
                </button>
              </div>
            )}
          </div>

          {!selectedCourse ? (
            <div className="rounded-lg p-12 text-center" style={{ background: "var(--color-bg-card)", border: "1px solid var(--color-border)" }}>
              <div className="text-sm" style={{ color: "var(--color-text-muted)" }}>Select a course to start marking attendance.</div>
            </div>
          ) : students.length === 0 ? (
            <div className="rounded-lg p-12 text-center" style={{ background: "var(--color-bg-card)", border: "1px solid var(--color-border)" }}>
              <div className="text-sm font-medium mb-1" style={{ color: "var(--color-text-secondary)" }}>No registered students</div>
              <div className="text-xs" style={{ color: "var(--color-text-muted)" }}>Students will appear here after they register on the portal.</div>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between mb-4">
                <div className="text-sm font-medium" style={{ color: "var(--color-text-primary)" }}>
                  {students.length} student{students.length !== 1 ? "s" : ""} &mdash; {formatDateLabel(date)}
                </div>
                <div className="flex gap-2">
                  <button onClick={() => handleMarkAll("present")} className="text-xs font-medium px-3 py-1.5 rounded transition-all" style={{ background: "var(--color-success-bg)", color: "var(--color-success)", border: "1px solid var(--color-success)44" }}>
                    Mark All Present
                  </button>
                  <button onClick={() => handleMarkAll("absent")} className="text-xs font-medium px-3 py-1.5 rounded transition-all" style={{ background: "var(--color-danger-bg)", color: "var(--color-danger)", border: "1px solid var(--color-danger)44" }}>
                    Mark All Absent
                  </button>
                </div>
              </div>

              <div className="rounded overflow-hidden mb-4" style={{ background: "var(--color-bg-card)", border: "1px solid var(--color-border)" }}>
                <table className="w-full text-sm">
                  <thead>
                    <tr style={{ borderBottom: "1px solid var(--color-border)" }}>
                      {["Student", "Student ID", "Department", "Attendance"].map((h) => (
                        <th key={h} className="text-left px-4 py-3 text-[10px] font-semibold uppercase tracking-wider" style={{ color: "var(--color-text-muted)" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {students.map((s, i) => {
                      const status = markings[s.studentId];
                      const isPresent = status === "present";
                      const isAbsent = status === "absent";
                      return (
                        <tr key={s.studentId} style={{ borderBottom: i < students.length - 1 ? "1px solid var(--color-border-subtle)" : "none" }}>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2.5">
                              <div className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0" style={{ background: "var(--color-accent-muted)", color: "var(--color-accent)" }}>
                                {s.displayName.slice(0, 2).toUpperCase()}
                              </div>
                              <div className="text-sm font-medium" style={{ color: "var(--color-text-primary)" }}>{s.displayName}</div>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-xs" style={{ fontFamily: "var(--font-mono)", color: "var(--color-text-muted)" }}>{s.studentId}</td>
                          <td className="px-4 py-3 text-xs" style={{ color: "var(--color-text-muted)" }}>{s.department}</td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => { setMarkings((prev) => ({ ...prev, [s.studentId]: "present" })); setSaved(false); }}
                                className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded transition-all"
                                style={{
                                  background: isPresent ? "var(--color-success-bg)" : "transparent",
                                  border: `1.5px solid ${isPresent ? "var(--color-success)" : "var(--color-border)"}`,
                                  color: isPresent ? "var(--color-success)" : "var(--color-text-muted)",
                                }}
                              >
                                {isPresent && <svg width="10" height="8" viewBox="0 0 10 8" fill="none"><path d="M1 4L3.5 6.5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                                Present
                              </button>
                              <button
                                onClick={() => { setMarkings((prev) => ({ ...prev, [s.studentId]: "absent" })); setSaved(false); }}
                                className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded transition-all"
                                style={{
                                  background: isAbsent ? "var(--color-danger-bg)" : "transparent",
                                  border: `1.5px solid ${isAbsent ? "var(--color-danger)" : "var(--color-border)"}`,
                                  color: isAbsent ? "var(--color-danger)" : "var(--color-text-muted)",
                                }}
                              >
                                {isAbsent && <svg width="8" height="8" viewBox="0 0 8 8" fill="none"><line x1="1" y1="1" x2="7" y2="7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/><line x1="7" y1="1" x2="1" y2="7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>}
                                Absent
                              </button>
                              {!status && <span className="text-[10px]" style={{ color: "var(--color-text-muted)" }}>Not marked</span>}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={handleSave}
                  className="text-sm font-semibold px-5 py-2.5 rounded transition-all"
                  style={{ background: "#7c3aed", color: "white" }}
                >
                  Save Attendance
                </button>
                {saved && (
                  <div className="flex items-center gap-1.5 text-xs" style={{ color: "var(--color-success)" }}>
                    <svg width="12" height="10" viewBox="0 0 12 10" fill="none"><path d="M1 5L4.5 8.5L11 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    Saved successfully
                  </div>
                )}
                <div className="text-xs" style={{ color: "var(--color-text-muted)" }}>
                  {Object.keys(markings).length} of {students.length} students marked
                </div>
              </div>
            </>
          )}
        </div>
      ) : (
        /* History view */
        <div>
          <div className="flex flex-wrap gap-3 mb-5">
            <div>
              <label className="block text-[10px] font-semibold uppercase tracking-wider mb-1.5" style={{ color: "var(--color-text-muted)" }}>Course</label>
              <select
                value={histCourse}
                onChange={(e) => setHistCourse(e.target.value)}
                className="rounded px-3 py-2 text-sm outline-none"
                style={{ background: "var(--color-bg-card)", border: "1px solid var(--color-border)", color: "var(--color-text-primary)", fontFamily: "var(--font-sans)" }}
              >
                <option value="All">All Courses</option>
                {activeCourses.map((c) => <option key={c.code} value={c.code}>{c.code} - {c.title}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-semibold uppercase tracking-wider mb-1.5" style={{ color: "var(--color-text-muted)" }}>Date</label>
              <input
                type="date"
                value={histDate}
                onChange={(e) => setHistDate(e.target.value)}
                className="rounded px-3 py-2 text-sm outline-none"
                style={{ background: "var(--color-bg-card)", border: "1px solid var(--color-border)", color: "var(--color-text-primary)", fontFamily: "var(--font-mono)" }}
              />
            </div>
            {histDate && (
              <div className="self-end">
                <button onClick={() => setHistDate("")} className="text-xs rounded px-3 py-2" style={{ border: "1px solid var(--color-border)", color: "var(--color-text-muted)", background: "transparent" }}>
                  Clear date
                </button>
              </div>
            )}
          </div>

          {sortedGroupKeys.length === 0 ? (
            <div className="rounded-lg p-12 text-center" style={{ background: "var(--color-bg-card)", border: "1px solid var(--color-border)" }}>
              <div className="text-sm" style={{ color: "var(--color-text-muted)" }}>
                {allRecords.length === 0 ? "No attendance has been marked yet." : "No records match your filters."}
              </div>
            </div>
          ) : (
            <div className="space-y-5">
              {sortedGroupKeys.map((key) => {
                const groupRecords = histGroups[key];
                const [groupDate, groupCourse] = key.split("__");
                const courseInfo = ADMIN_COURSES.find((c) => c.code === groupCourse);
                const presentCount = groupRecords.filter((r) => r.status === "present").length;
                const pct = Math.round((presentCount / groupRecords.length) * 100);
                const pctColor = pct >= 75 ? "var(--color-success)" : pct >= 60 ? "var(--color-warning)" : "var(--color-danger)";

                return (
                  <div key={key} className="rounded overflow-hidden" style={{ background: "var(--color-bg-card)", border: "1px solid var(--color-border)" }}>
                    <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: "1px solid var(--color-border-subtle)" }}>
                      <div>
                        <div className="text-xs font-medium mb-0.5" style={{ fontFamily: "var(--font-mono)", color: "var(--color-text-muted)" }}>{groupCourse}</div>
                        <div className="text-sm font-semibold" style={{ color: "var(--color-text-primary)" }}>{courseInfo?.title ?? groupCourse}</div>
                        <div className="text-xs mt-0.5" style={{ color: "var(--color-text-muted)", fontFamily: "var(--font-mono)" }}>{formatDateLabel(groupDate)}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold" style={{ color: pctColor, fontFamily: "var(--font-mono)" }}>{pct}%</div>
                        <div className="text-[10px]" style={{ color: "var(--color-text-muted)" }}>{presentCount}/{groupRecords.length} present</div>
                      </div>
                    </div>

                    <div className="px-5 py-3 flex flex-wrap gap-2">
                      {groupRecords.sort((a, b) => a.studentId.localeCompare(b.studentId)).map((r) => {
                        const stu = getStudents().find((s) => s.studentId === r.studentId);
                        const name = stu ? stu.displayName : r.studentId;
                        const isPresent = r.status === "present";
                        return (
                          <div
                            key={r.studentId}
                            className="flex items-center gap-1.5 text-xs rounded px-2.5 py-1.5"
                            style={{ background: isPresent ? "var(--color-success-bg)" : "var(--color-danger-bg)", border: `1px solid ${isPresent ? "var(--color-success)33" : "var(--color-danger)33"}` }}
                          >
                            <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: isPresent ? "var(--color-success)" : "var(--color-danger)" }} />
                            <span style={{ color: isPresent ? "var(--color-success)" : "var(--color-danger)" }}>{name}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function formatDateLabel(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString([], { weekday: "long", day: "2-digit", month: "long", year: "numeric" });
}
