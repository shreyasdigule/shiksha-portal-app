import { useEffect, useState } from "react";
import { getStudents, getAttendance, mergeAttendanceRecords } from "../../store";
import type { AttendanceRecord, StoredStudent } from "../../store";
import { ADMIN_COURSES } from "../../data/adminPortalData";
import { isSupabaseConfigured, supabase } from "../../lib/supabase";

type ViewMode = "mark" | "history";
type CourseChoice = { id: string; code: string; title: string };

export default function AdminAttendancePage() {
  const [viewMode, setViewMode] = useState<ViewMode>("mark");
  const [selectedCourse, setSelectedCourse] = useState<string>("");
  const [date, setDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [markings, setMarkings] = useState<Record<string, "present" | "absent">>({});
  const [students, setStudents] = useState<StoredStudent[]>(() => getStudents());
  const [activeCourses, setActiveCourses] = useState<CourseChoice[]>(() => ADMIN_COURSES.filter((c) => c.status === "active").map((c) => ({ id: String(c.id), code: c.code, title: c.title })));
  const [remoteRecords, setRemoteRecords] = useState<AttendanceRecord[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  // For history view
  const [histCourse, setHistCourse] = useState("All");
  const [histDate, setHistDate] = useState("");

  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) return;
    let active = true;
    void (async () => {
      const [profilesResult, subjectsResult] = await Promise.all([
        supabase.from("profiles").select("id,student_id,email,full_name,department,semester,created_at").eq("role", "student").order("full_name"),
        supabase.from("subjects").select("id,code,name").eq("is_active", true).eq("department", "Computer Engineering").order("semester").order("code"),
      ]);
      if (!active) return;
      if (profilesResult.error) setLoadError(profilesResult.error.message);
      else setStudents((profilesResult.data ?? []).map((row) => ({
        authUserId: row.id,
        studentId: row.student_id ?? "Not provided",
        name: row.full_name,
        displayName: row.full_name,
        email: row.email,
        department: row.department ?? "Not set",
        semester: row.semester ?? 0,
        registeredAt: row.created_at,
      })));
      if (subjectsResult.error) setLoadError((current) => current ?? subjectsResult.error.message);
      else setActiveCourses((subjectsResult.data ?? []).map((row) => ({ id: row.id, code: row.code, title: row.name })));
    })();
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (!isSupabaseConfigured || !supabase || activeCourses.length === 0) return;
    let active = true;
    void supabase.from("attendance").select("id,subject_id,student_id,class_date,status")
      .then(({ data, error }) => {
        if (!active) return;
        if (error) { setLoadError((current) => current ?? error.message); return; }
        const records = (data ?? []).map((row) => {
          const course = activeCourses.find((item) => item.id === row.subject_id);
          const student = students.find((item) => item.authUserId === row.student_id);
          return {
            id: row.id,
            date: row.class_date,
            courseCode: course?.code ?? row.subject_id,
            courseTitle: course?.title ?? row.subject_id,
            studentId: student?.studentId ?? row.student_id,
            status: row.status as "present" | "absent",
            markedAt: "",
          };
        });
        setRemoteRecords(records);
      });
    return () => { active = false; };
  }, [students, activeCourses]);

  const courseChoice = activeCourses.find((course) => course.code === selectedCourse);
  const studentKey = (student: StoredStudent) => student.authUserId ?? student.studentId;

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const handleMarkAll = (status: "present" | "absent") => {
    setSaved(false);
    const newMarkings: Record<string, "present" | "absent"> = {};
    for (const s of students) { newMarkings[studentKey(s)] = status; }
    setMarkings(newMarkings);
  };

  const handleSave = async () => {
    if (!selectedCourse || !date) { showToast("Please select a course and date."); return; }
    const course = activeCourses.find((c) => c.code === selectedCourse);
    if (!course) return;

    if (isSupabaseConfigured && supabase) {
      const { data: authData, error: authError } = await supabase.auth.getUser();
      if (authError || !authData.user) { showToast("Your session expired. Sign in again to save attendance."); return; }
      const rows = students.filter((student) => student.authUserId).map((student) => ({
        subject_id: course.id,
        student_id: student.authUserId!,
        class_date: date,
        status: markings[studentKey(student)] ?? "absent",
        marked_by: authData.user.id,
      }));
      if (rows.length !== students.length) { showToast("Some student profiles are missing Supabase IDs. Refresh and try again."); return; }
      const { error } = await supabase.from("attendance").upsert(rows, { onConflict: "subject_id,student_id,class_date" });
      if (error) { showToast(`Attendance could not be saved: ${error.message}`); return; }
      const savedRecords: AttendanceRecord[] = students.map((student) => ({
        id: `${date}-${selectedCourse}-${student.studentId}`, date, courseCode: selectedCourse,
        courseTitle: course.title, studentId: student.studentId,
        status: markings[studentKey(student)] ?? "absent", markedAt: new Date().toISOString(),
      }));
      setRemoteRecords((previous) => [...previous.filter((record) => !(record.date === date && record.courseCode === selectedCourse)), ...savedRecords]);
      setSaved(true);
      showToast(`Attendance saved to Supabase for ${course.title} on ${formatDateLabel(date)}.`);
      return;
    }

    const records: AttendanceRecord[] = students.map((s) => ({
      id: `${date}-${selectedCourse}-${s.studentId}`,
      date,
      courseCode: selectedCourse,
      courseTitle: course.title,
      studentId: s.studentId,
      status: markings[studentKey(s)] ?? "absent",
      markedAt: new Date().toISOString(),
    }));

    mergeAttendanceRecords(records);
    setSaved(true);
    showToast(`Attendance saved for ${course.title} on ${formatDateLabel(date)}.`);
  };

  // Load existing records for the selected course + date into markings
  const handleLoadExisting = async () => {
    if (!selectedCourse || !date) return;
    if (isSupabaseConfigured && supabase && courseChoice) {
      const { data, error } = await supabase.from("attendance").select("student_id,status")
        .eq("subject_id", courseChoice.id).eq("class_date", date);
      if (error) { showToast(`Could not load saved attendance: ${error.message}`); return; }
      const savedMarkings: Record<string, "present" | "absent"> = {};
      for (const row of data ?? []) savedMarkings[row.student_id] = row.status as "present" | "absent";
      setMarkings(savedMarkings);
      setSaved(false);
      showToast(data?.length ? "Saved attendance loaded." : "No attendance is saved for this course and date.");
      return;
    }
    const existing = getAttendance().filter((r) => r.courseCode === selectedCourse && r.date === date);
    if (existing.length === 0) return;
    const m: Record<string, "present" | "absent"> = {};
    for (const r of existing) { m[r.studentId] = r.status; }
    setMarkings(m);
    setSaved(false);
  };

  // History data
  const allRecords = isSupabaseConfigured ? remoteRecords : getAttendance();
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
      {loadError && <div role="alert" className="mb-4 rounded px-4 py-3 text-sm" style={{ background: "var(--color-danger-bg)", color: "var(--color-danger)" }}>Could not load attendance data from Supabase: {loadError}</div>}

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
                      {["Student", "PRN", "Department", "Class / Semester", "Attendance"].map((h) => (
                        <th key={h} className="text-left px-4 py-3 text-[10px] font-semibold uppercase tracking-wider" style={{ color: "var(--color-text-muted)" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {students.map((s, i) => {
                      const key = studentKey(s);
                      const status = markings[key];
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
                          <td className="px-4 py-3 text-xs" style={{ color: "var(--color-text-muted)" }}>{s.semester ? `Semester ${s.semester}` : "—"}</td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => { setMarkings((prev) => ({ ...prev, [key]: "present" })); setSaved(false); }}
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
                                onClick={() => { setMarkings((prev) => ({ ...prev, [key]: "absent" })); setSaved(false); }}
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
                const courseInfo = activeCourses.find((c) => c.code === groupCourse);
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
                        const stu = students.find((s) => s.studentId === r.studentId);
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
