import { useState } from "react";
import type { FormEvent } from "react";
import { ADMIN_COURSES, ADMIN_TESTS } from "../../data/adminPortalData";
import type { AdminTest } from "../../data/adminPortalData";

type StatusFilter = "All" | "active" | "upcoming" | "completed" | "draft";
type TypeFilter = "All" | "Mid-Semester" | "Unit Test" | "Quiz";

const STATUS_OPTIONS: StatusFilter[] = ["All", "active", "upcoming", "completed", "draft"];
const TYPE_OPTIONS: TypeFilter[] = ["All", "Mid-Semester", "Unit Test", "Quiz"];

export default function AdminTestsPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("All");
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("All");
  const [editTest, setEditTest] = useState<AdminTest | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [confirmAction, setConfirmAction] = useState<{ test: AdminTest; action: string } | null>(null);
  const [tests, setTests] = useState<AdminTest[]>(ADMIN_TESTS);
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 3000); };

  const handleCreateTest = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const values = new FormData(event.currentTarget);
    const code = String(values.get("code")).trim().toUpperCase();
    const title = String(values.get("title")).trim();
    const courseCode = String(values.get("courseCode"));
    const date = String(values.get("date"));
    const time = String(values.get("time"));
    const durationMinutes = Number(values.get("duration"));
    const questions = Number(values.get("questions"));
    const type = String(values.get("type"));
    if (!ADMIN_COURSES.some((course) => course.code === courseCode)) return;
    if (!/^[A-Z0-9][A-Z0-9_-]{2,23}$/.test(code)) return;
    if (tests.some((test) => test.code.toUpperCase() === code)) { showToast("A test with this code already exists."); return; }
    if (title.length < 3 || !date || !time || durationMinutes < 1 || durationMinutes > 300 || questions < 1 || questions > 200) {
      showToast("Check the title, date, time, duration, and question count.");
      return;
    }
    const course = ADMIN_COURSES.find((item) => item.code === courseCode)!;
    const newTest: AdminTest = {
      id: Date.now(), code, title, courseCode, type,
      date: new Date(`${date}T00:00:00`).toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" }),
      time: new Date(`1970-01-01T${time}`).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      duration: `${durationMinutes} min`, questions, totalMarks: questions * 2,
      registered: 0, attempted: 0, status: "draft",
    };
    setTests((prev) => [newTest, ...prev]);
    setShowCreate(false);
    showToast(`"${title}" was saved as a draft for ${course.code}.`);
  };

  const filtered = tests.filter((t) => {
    const q = search.toLowerCase();
    const matchSearch = q === "" || t.title.toLowerCase().includes(q) || t.code.toLowerCase().includes(q) || t.courseCode.toLowerCase().includes(q);
    const matchStatus = statusFilter === "All" || t.status === statusFilter;
    const matchType = typeFilter === "All" || t.type === typeFilter;
    return matchSearch && matchStatus && matchType;
  });

  const handleActivate = (test: AdminTest) => {
    setTests((prev) => prev.map((t) => t.id === test.id ? { ...t, status: t.status === "active" ? "upcoming" : "active" } : t));
    showToast(`"${test.title}" ${test.status === "active" ? "deactivated" : "activated"}.`);
    setConfirmAction(null);
  };

  const handleDelete = (test: AdminTest) => {
    setTests((prev) => prev.filter((t) => t.id !== test.id));
    showToast(`Test deleted.`);
    setConfirmAction(null);
  };

  return (
    <div className="p-6 max-w-[1080px]">
      {toast && (
        <div className="fixed top-4 right-4 z-50 rounded px-4 py-2.5 text-sm font-medium shadow-lg" style={{ background: "var(--color-success)", color: "white" }}>
          {toast}
        </div>
      )}

      <div className="flex items-start justify-between mb-6 flex-wrap gap-4">
        <div>
          <h1 className="text-xl font-semibold mb-1" style={{ color: "var(--color-text-primary)" }}>Test Management</h1>
          <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>{filtered.length} of {tests.length} tests shown</p>
        </div>
        <button onClick={() => setShowCreate(true)} className="flex items-center gap-2 text-sm font-medium rounded px-4 py-2" style={{ background: "#7c3aed", color: "white" }}>
          <PlusIcon /> Create Test
        </button>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
        {[
          { label: "Active", count: tests.filter((t) => t.status === "active").length, color: "var(--color-success)" },
          { label: "Upcoming", count: tests.filter((t) => t.status === "upcoming").length, color: "var(--color-accent)" },
          { label: "Completed", count: tests.filter((t) => t.status === "completed").length, color: "var(--color-text-muted)" },
          { label: "Draft", count: tests.filter((t) => t.status === "draft").length, color: "var(--color-warning)" },
        ].map((s) => (
          <div key={s.label} className="rounded px-4 py-3" style={{ background: "var(--color-bg-card)", border: "1px solid var(--color-border)" }}>
            <div className="text-lg font-bold" style={{ color: s.color, fontFamily: "var(--font-mono)" }}>{s.count}</div>
            <div className="text-[10px]" style={{ color: "var(--color-text-muted)" }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-5">
        <div className="relative flex-1 min-w-[200px]">
          <span className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--color-text-muted)" }}><SearchIcon /></span>
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by title, code, or course..." className="w-full rounded pl-8 pr-3 py-2 text-sm outline-none"
            style={{ background: "var(--color-bg-card)", border: "1px solid var(--color-border)", color: "var(--color-text-primary)", fontFamily: "var(--font-sans)" }}
            onFocus={(e) => (e.target.style.borderColor = "#7c3aed")} onBlur={(e) => (e.target.style.borderColor = "var(--color-border)")} />
        </div>
        <FilterChips options={STATUS_OPTIONS} value={statusFilter} onChange={(v) => setStatusFilter(v as StatusFilter)} />
        <FilterChips options={TYPE_OPTIONS} value={typeFilter} onChange={(v) => setTypeFilter(v as TypeFilter)} />
      </div>

      {/* Table */}
      <div className="rounded overflow-hidden" style={{ background: "var(--color-bg-card)", border: "1px solid var(--color-border)" }}>
        {filtered.length === 0 ? (
          <div className="py-16 text-center text-sm" style={{ color: "var(--color-text-muted)" }}>No tests match your criteria.</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: "1px solid var(--color-border)" }}>
                {["Test", "Course", "Type", "Date & Time", "Questions", "Participation", "Status", ""].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-[10px] font-semibold uppercase tracking-wider" style={{ color: "var(--color-text-muted)" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((t, i) => {
                const participation = t.attempted > 0 ? Math.round((t.attempted / t.registered) * 100) : null;
                return (
                  <tr key={t.id} style={{ borderBottom: i < filtered.length - 1 ? "1px solid var(--color-border-subtle)" : "none" }}>
                    <td className="px-4 py-3.5">
                      <div className="text-[10px] mb-0.5" style={{ fontFamily: "var(--font-mono)", color: "var(--color-text-muted)" }}>{t.code}</div>
                      <div className="text-sm font-medium" style={{ color: "var(--color-text-primary)" }}>{t.title}</div>
                      <div className="text-[10px]" style={{ color: "var(--color-text-muted)" }}>{t.duration} &middot; {t.totalMarks} marks</div>
                    </td>
                    <td className="px-4 py-3.5 text-xs" style={{ fontFamily: "var(--font-mono)", color: "var(--color-text-muted)" }}>{t.courseCode}</td>
                    <td className="px-4 py-3.5">
                      <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ background: "var(--color-bg-elevated)", color: "var(--color-text-muted)" }}>{t.type}</span>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="text-xs" style={{ fontFamily: "var(--font-mono)", color: "var(--color-text-secondary)" }}>{t.date}</div>
                      <div className="text-[10px]" style={{ color: "var(--color-text-muted)" }}>{t.time}</div>
                    </td>
                    <td className="px-4 py-3.5 text-xs" style={{ fontFamily: "var(--font-mono)", color: "var(--color-text-secondary)" }}>{t.questions}</td>
                    <td className="px-4 py-3.5">
                      {participation !== null ? (
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <div className="w-16 h-1.5 rounded-full overflow-hidden" style={{ background: "var(--color-bg-elevated)" }}>
                              <div className="h-full rounded-full" style={{ width: `${participation}%`, background: "var(--color-success)" }} />
                            </div>
                            <span className="text-[10px]" style={{ fontFamily: "var(--font-mono)", color: "var(--color-text-muted)" }}>{participation}%</span>
                          </div>
                          <div className="text-[10px]" style={{ color: "var(--color-text-muted)" }}>{t.attempted}/{t.registered}</div>
                        </div>
                      ) : (
                        <span className="text-[10px]" style={{ color: "var(--color-text-muted)" }}>{t.registered} registered</span>
                      )}
                    </td>
                    <td className="px-4 py-3.5"><TestStatusBadge status={t.status} /></td>
                    <td className="px-4 py-3.5">
                      <div className="flex gap-1">
                        <button onClick={() => setEditTest(t)} className="text-[10px] px-2 py-1 rounded" style={{ border: "1px solid var(--color-border)", color: "var(--color-text-muted)", background: "transparent" }}>
                          Edit
                        </button>
                        {t.status !== "completed" && (
                          <button
                            onClick={() => setConfirmAction({ test: t, action: t.status === "active" ? "deactivate" : "activate" })}
                            className="text-[10px] px-2 py-1 rounded"
                            style={{
                              border: `1px solid ${t.status === "active" ? "var(--color-warning)55" : "var(--color-success)55"}`,
                              color: t.status === "active" ? "var(--color-warning)" : "var(--color-success)",
                              background: "transparent",
                            }}
                          >
                            {t.status === "active" ? "Deactivate" : "Activate"}
                          </button>
                        )}
                        {(t.status === "draft") && (
                          <button
                            onClick={() => setConfirmAction({ test: t, action: "delete" })}
                            className="text-[10px] px-2 py-1 rounded"
                            style={{ border: "1px solid var(--color-danger)55", color: "var(--color-danger)", background: "transparent" }}
                          >
                            Delete
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Edit modal */}
      {editTest && (
        <Modal onClose={() => setEditTest(null)}>
          <div className="p-6 max-w-[480px] w-[480px]">
            <div className="text-sm font-semibold mb-4" style={{ color: "var(--color-text-primary)" }}>Edit Test &mdash; {editTest.code}</div>
            <div className="space-y-4">
              {[
                { label: "Test Title", value: editTest.title },
                { label: "Date", value: editTest.date },
                { label: "Time", value: editTest.time },
              ].map((f) => (
                <div key={f.label}>
                  <label className="block text-[10px] font-semibold uppercase tracking-wider mb-1.5" style={{ color: "var(--color-text-muted)" }}>{f.label}</label>
                  <input defaultValue={f.value} className="w-full rounded px-3 py-2 text-sm outline-none"
                    style={{ background: "var(--color-bg-elevated)", border: "1px solid var(--color-border)", color: "var(--color-text-primary)", fontFamily: "var(--font-sans)" }}
                    onFocus={(e) => (e.target.style.borderColor = "#7c3aed")} onBlur={(e) => (e.target.style.borderColor = "var(--color-border)")} />
                </div>
              ))}
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: "Duration", value: editTest.duration },
                  { label: "Questions", value: String(editTest.questions) },
                  { label: "Total Marks", value: String(editTest.totalMarks) },
                ].map((f) => (
                  <div key={f.label}>
                    <label className="block text-[10px] font-semibold uppercase tracking-wider mb-1.5" style={{ color: "var(--color-text-muted)" }}>{f.label}</label>
                    <input defaultValue={f.value} className="w-full rounded px-3 py-2 text-sm outline-none"
                      style={{ background: "var(--color-bg-elevated)", border: "1px solid var(--color-border)", color: "var(--color-text-primary)", fontFamily: "var(--font-sans)" }}
                      onFocus={(e) => (e.target.style.borderColor = "#7c3aed")} onBlur={(e) => (e.target.style.borderColor = "var(--color-border)")} />
                  </div>
                ))}
              </div>
            </div>
            <div className="flex gap-2 mt-5">
              <button onClick={() => setEditTest(null)} className="flex-1 text-sm rounded py-2" style={{ border: "1px solid var(--color-border)", color: "var(--color-text-secondary)", background: "transparent" }}>Cancel</button>
              <button onClick={() => { setEditTest(null); showToast("Test updated successfully."); }} className="flex-1 text-sm font-medium rounded py-2" style={{ background: "#7c3aed", color: "white" }}>Save Changes</button>
            </div>
          </div>
        </Modal>
      )}

      {/* Create test modal */}
      {showCreate && (
        <Modal onClose={() => setShowCreate(false)}>
          <form onSubmit={handleCreateTest} className="p-6 max-w-[480px] w-[min(480px,calc(100vw-2rem))]">
            <div className="text-sm font-semibold mb-4" style={{ color: "var(--color-text-primary)" }}>Create New Test</div>
            <div className="space-y-4">
              <div>
                <label htmlFor="test-code" className="block text-[10px] font-semibold uppercase tracking-wider mb-1.5" style={{ color: "var(--color-text-muted)" }}>Test Code</label>
                <input id="test-code" name="code" required minLength={3} maxLength={24} pattern="[A-Za-z0-9][A-Za-z0-9_-]{2,23}" title="Use 3–24 letters, numbers, hyphens, or underscores." placeholder="e.g. CS2305-MID2" className="w-full rounded px-3 py-2 text-sm outline-none" style={{ background: "var(--color-bg-elevated)", border: "1px solid var(--color-border)", color: "var(--color-text-primary)" }} />
              </div>
              <div>
                <label htmlFor="test-title" className="block text-[10px] font-semibold uppercase tracking-wider mb-1.5" style={{ color: "var(--color-text-muted)" }}>Test Title</label>
                <input id="test-title" name="title" required minLength={3} maxLength={120} placeholder="e.g. Data Structures Mid-Semester" className="w-full rounded px-3 py-2 text-sm outline-none" style={{ background: "var(--color-bg-elevated)", border: "1px solid var(--color-border)", color: "var(--color-text-primary)" }} />
              </div>
              <div>
                <label htmlFor="test-course" className="block text-[10px] font-semibold uppercase tracking-wider mb-1.5" style={{ color: "var(--color-text-muted)" }}>Course</label>
                <select id="test-course" name="courseCode" required defaultValue="" className="w-full rounded px-3 py-2 text-sm outline-none" style={{ background: "var(--color-bg-elevated)", border: "1px solid var(--color-border)", color: "var(--color-text-primary)" }}>
                  <option value="" disabled>Select a VIT Computer Engineering course</option>
                  {ADMIN_COURSES.filter((course) => course.status === "active").map((course) => <option key={course.code} value={course.code}>{course.code} · {course.title}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label htmlFor="test-date" className="block text-[10px] font-semibold uppercase tracking-wider mb-1.5" style={{ color: "var(--color-text-muted)" }}>Date</label><input id="test-date" name="date" type="date" required min={new Date(Date.now() - new Date().getTimezoneOffset() * 60_000).toISOString().slice(0, 10)} className="w-full rounded px-3 py-2 text-sm outline-none" style={{ colorScheme: "light", background: "var(--color-bg-elevated)", border: "1px solid var(--color-border)", color: "var(--color-text-primary)" }} /></div>
                <div><label htmlFor="test-time" className="block text-[10px] font-semibold uppercase tracking-wider mb-1.5" style={{ color: "var(--color-text-muted)" }}>Start Time</label><input id="test-time" name="time" type="time" required className="w-full rounded px-3 py-2 text-sm outline-none" style={{ colorScheme: "light", background: "var(--color-bg-elevated)", border: "1px solid var(--color-border)", color: "var(--color-text-primary)" }} /></div>
                <div><label htmlFor="test-duration" className="block text-[10px] font-semibold uppercase tracking-wider mb-1.5" style={{ color: "var(--color-text-muted)" }}>Duration (minutes)</label><input id="test-duration" name="duration" type="number" required min={1} max={300} step={1} placeholder="90" className="w-full rounded px-3 py-2 text-sm outline-none" style={{ background: "var(--color-bg-elevated)", border: "1px solid var(--color-border)", color: "var(--color-text-primary)" }} /></div>
                <div><label htmlFor="test-questions" className="block text-[10px] font-semibold uppercase tracking-wider mb-1.5" style={{ color: "var(--color-text-muted)" }}>Questions</label><input id="test-questions" name="questions" type="number" required min={1} max={200} step={1} placeholder="30" className="w-full rounded px-3 py-2 text-sm outline-none" style={{ background: "var(--color-bg-elevated)", border: "1px solid var(--color-border)", color: "var(--color-text-primary)" }} /></div>
              </div>
              <div>
                <label className="block text-[10px] font-semibold uppercase tracking-wider mb-1.5" style={{ color: "var(--color-text-muted)" }}>Exam Type</label>
                <select name="type" className="w-full rounded px-3 py-2 text-sm outline-none" style={{ background: "var(--color-bg-elevated)", border: "1px solid var(--color-border)", color: "var(--color-text-primary)", fontFamily: "var(--font-sans)" }}>
                  <option>Mid-Semester</option>
                  <option>Unit Test</option>
                  <option>Quiz</option>
                  <option>End-Semester</option>
                </select>
              </div>
            </div>
            <div className="mt-3 p-3 rounded text-xs" style={{ background: "var(--color-accent-muted)", border: "1px solid var(--color-accent)33", color: "var(--color-accent)" }}>
              Test will be saved as Draft. Activate it when ready for students.
            </div>
            <div className="flex gap-2 mt-4">
              <button type="button" onClick={() => setShowCreate(false)} className="flex-1 text-sm rounded py-2" style={{ border: "1px solid var(--color-border)", color: "var(--color-text-secondary)", background: "transparent" }}>Cancel</button>
              <button type="submit" className="flex-1 text-sm font-medium rounded py-2" style={{ background: "#7c3aed", color: "white" }}>Create Draft</button>
            </div>
          </form>
        </Modal>
      )}

      {/* Confirm action */}
      {confirmAction && (
        <Modal onClose={() => setConfirmAction(null)}>
          <div className="p-6 max-w-[360px]">
            <div className="text-sm font-semibold mb-2" style={{ color: "var(--color-text-primary)" }}>
              {confirmAction.action === "delete" ? "Delete Test" : confirmAction.action === "activate" ? "Activate Test" : "Deactivate Test"}
            </div>
            <p className="text-xs leading-relaxed mb-5" style={{ color: "var(--color-text-secondary)" }}>
              {confirmAction.action === "delete"
                ? `Permanently delete "${confirmAction.test.title}"? This cannot be undone.`
                : confirmAction.action === "activate"
                ? `Make "${confirmAction.test.title}" available to students now?`
                : `Deactivate "${confirmAction.test.title}"? Students will not be able to start the test.`}
            </p>
            <div className="flex gap-2">
              <button onClick={() => setConfirmAction(null)} className="flex-1 text-sm rounded py-2" style={{ border: "1px solid var(--color-border)", color: "var(--color-text-secondary)", background: "transparent" }}>Cancel</button>
              <button
                onClick={() => confirmAction.action === "delete" ? handleDelete(confirmAction.test) : handleActivate(confirmAction.test)}
                className="flex-1 text-sm font-medium rounded py-2"
                style={{ background: confirmAction.action === "delete" ? "var(--color-danger)" : "var(--color-success)", color: "white" }}
              >
                {confirmAction.action === "delete" ? "Delete" : confirmAction.action === "activate" ? "Activate" : "Deactivate"}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

function TestStatusBadge({ status }: { status: string }) {
  const m: Record<string, { bg: string; color: string }> = {
    active:    { bg: "var(--color-success-bg)", color: "var(--color-success)" },
    upcoming:  { bg: "var(--color-accent-muted)", color: "var(--color-accent)" },
    completed: { bg: "var(--color-bg-elevated)", color: "var(--color-text-muted)" },
    draft:     { bg: "var(--color-warning-bg)", color: "var(--color-warning)" },
  };
  const s = m[status] || m.draft;
  return <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded uppercase tracking-wide" style={{ background: s.bg, color: s.color }}>{status}</span>;
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

function Modal({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center" style={{ background: "rgba(0,0,0,0.6)" }} onClick={onClose}>
      <div className="rounded-lg shadow-2xl" style={{ background: "var(--color-bg-card)", border: "1px solid var(--color-border)" }} onClick={(e) => e.stopPropagation()}>
        {children}
      </div>
    </div>
  );
}

function SearchIcon() { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>; }
function PlusIcon() { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>; }
