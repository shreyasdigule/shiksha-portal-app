import { useState } from "react";
import { ADMIN_COURSES } from "../../data/admin";
import type { AdminCourse } from "../../data/admin";

type StatusFilter = "All" | "active" | "archived" | "draft";
const DEPT_OPTIONS = ["All", "CSE", "Math", "ECE"];
const STATUS_OPTIONS: StatusFilter[] = ["All", "active", "draft", "archived"];

export default function AdminCoursesPage() {
  const [search, setSearch] = useState("");
  const [deptFilter, setDeptFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("All");
  const [editCourse, setEditCourse] = useState<AdminCourse | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [courses, setCourses] = useState<AdminCourse[]>(ADMIN_COURSES);
  const [confirmArchive, setConfirmArchive] = useState<AdminCourse | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 3000); };

  const filtered = courses.filter((c) => {
    const q = search.toLowerCase();
    const matchSearch = q === "" || c.title.toLowerCase().includes(q) || c.code.toLowerCase().includes(q) || c.instructor.toLowerCase().includes(q);
    const matchDept = deptFilter === "All" || c.dept === deptFilter;
    const matchStatus = statusFilter === "All" || c.status === statusFilter;
    return matchSearch && matchDept && matchStatus;
  });

  const handleArchive = (course: AdminCourse) => {
    setCourses((prev) => prev.map((c) => c.id === course.id ? { ...c, status: c.status === "archived" ? "active" : "archived" } : c));
    showToast(`"${course.title}" ${course.status === "archived" ? "restored" : "archived"}.`);
    setConfirmArchive(null);
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
          <h1 className="text-xl font-semibold mb-1" style={{ color: "var(--color-text-primary)" }}>Course Management</h1>
          <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>{filtered.length} of {courses.length} courses shown</p>
        </div>
        <button onClick={() => setShowAdd(true)} className="flex items-center gap-2 text-sm font-medium rounded px-4 py-2" style={{ background: "#7c3aed", color: "white" }}>
          <PlusIcon /> Add Course
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-5">
        <div className="relative flex-1 min-w-[200px]">
          <span className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--color-text-muted)" }}><SearchIcon /></span>
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search courses, instructors..." className="w-full rounded pl-8 pr-3 py-2 text-sm outline-none"
            style={{ background: "var(--color-bg-card)", border: "1px solid var(--color-border)", color: "var(--color-text-primary)", fontFamily: "var(--font-sans)" }}
            onFocus={(e) => (e.target.style.borderColor = "#7c3aed")} onBlur={(e) => (e.target.style.borderColor = "var(--color-border)")} />
        </div>
        <FilterChips options={DEPT_OPTIONS} value={deptFilter} onChange={setDeptFilter} />
        <FilterChips options={STATUS_OPTIONS} value={statusFilter} onChange={(v) => setStatusFilter(v as StatusFilter)} />
      </div>

      {/* Summary tiles */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
        {[
          { label: "Active courses", value: courses.filter((c) => c.status === "active").length, color: "var(--color-success)" },
          { label: "Draft", value: courses.filter((c) => c.status === "draft").length, color: "var(--color-warning)" },
          { label: "Archived", value: courses.filter((c) => c.status === "archived").length, color: "var(--color-text-muted)" },
          { label: "Total enrolled", value: courses.reduce((s, c) => s + c.enrolled, 0), color: "var(--color-accent)" },
        ].map((s) => (
          <div key={s.label} className="rounded px-4 py-3" style={{ background: "var(--color-bg-card)", border: "1px solid var(--color-border)" }}>
            <div className="text-lg font-bold" style={{ color: s.color, fontFamily: "var(--font-mono)" }}>{s.value}</div>
            <div className="text-[10px]" style={{ color: "var(--color-text-muted)" }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="rounded overflow-hidden" style={{ background: "var(--color-bg-card)", border: "1px solid var(--color-border)" }}>
        {filtered.length === 0 ? (
          <div className="py-16 text-center text-sm" style={{ color: "var(--color-text-muted)" }}>No courses match your criteria.</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: "1px solid var(--color-border)" }}>
                {["Course", "Dept", "Credits", "Instructor", "Enrollment", "Status", ""].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-[10px] font-semibold uppercase tracking-wider" style={{ color: "var(--color-text-muted)" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((c, i) => {
                const pct = Math.round((c.enrolled / c.capacity) * 100);
                return (
                  <tr key={c.id} style={{ borderBottom: i < filtered.length - 1 ? "1px solid var(--color-border-subtle)" : "none" }}>
                    <td className="px-4 py-3.5">
                      <div className="text-[11px] mb-0.5" style={{ fontFamily: "var(--font-mono)", color: "var(--color-text-muted)" }}>{c.code}</div>
                      <div className="text-sm font-medium" style={{ color: "var(--color-text-primary)" }}>{c.title}</div>
                      <div className="text-[10px]" style={{ color: "var(--color-text-muted)" }}>{c.semester}</div>
                    </td>
                    <td className="px-4 py-3.5 text-xs" style={{ color: "var(--color-text-muted)" }}>{c.dept}</td>
                    <td className="px-4 py-3.5 text-xs" style={{ fontFamily: "var(--font-mono)", color: "var(--color-text-secondary)" }}>{c.credits} cr</td>
                    <td className="px-4 py-3.5 text-xs" style={{ color: "var(--color-text-secondary)" }}>{c.instructor}</td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-2">
                        <div className="w-20 h-1.5 rounded-full overflow-hidden" style={{ background: "var(--color-bg-elevated)" }}>
                          <div className="h-full rounded-full" style={{ width: `${pct}%`, background: pct >= 90 ? "var(--color-warning)" : "var(--color-success)" }} />
                        </div>
                        <span className="text-[10px]" style={{ fontFamily: "var(--font-mono)", color: "var(--color-text-muted)" }}>{c.enrolled}/{c.capacity}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3.5"><CourseStatusBadge status={c.status} /></td>
                    <td className="px-4 py-3.5">
                      <div className="flex gap-1">
                        <button
                          onClick={() => setEditCourse(c)}
                          className="text-[10px] px-2 py-1 rounded"
                          style={{ border: "1px solid var(--color-border)", color: "var(--color-text-muted)", background: "transparent" }}
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => setConfirmArchive(c)}
                          className="text-[10px] px-2 py-1 rounded"
                          style={{
                            border: `1px solid ${c.status === "archived" ? "var(--color-success)55" : "var(--color-border)"}`,
                            color: c.status === "archived" ? "var(--color-success)" : "var(--color-text-muted)",
                            background: "transparent",
                          }}
                        >
                          {c.status === "archived" ? "Restore" : "Archive"}
                        </button>
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
      {editCourse && (
        <Modal onClose={() => setEditCourse(null)}>
          <div className="p-6 max-w-[440px] w-[440px]">
            <div className="text-sm font-semibold mb-4" style={{ color: "var(--color-text-primary)" }}>Edit Course &mdash; {editCourse.code}</div>
            <div className="space-y-4">
              {[
                { label: "Course Title", value: editCourse.title },
                { label: "Instructor", value: editCourse.instructor },
              ].map((f) => (
                <div key={f.label}>
                  <label className="block text-[10px] font-semibold uppercase tracking-wider mb-1.5" style={{ color: "var(--color-text-muted)" }}>{f.label}</label>
                  <input defaultValue={f.value} className="w-full rounded px-3 py-2 text-sm outline-none"
                    style={{ background: "var(--color-bg-elevated)", border: "1px solid var(--color-border)", color: "var(--color-text-primary)", fontFamily: "var(--font-sans)" }}
                    onFocus={(e) => (e.target.style.borderColor = "#7c3aed")} onBlur={(e) => (e.target.style.borderColor = "var(--color-border)")} />
                </div>
              ))}
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: "Credits", value: String(editCourse.credits) },
                  { label: "Capacity", value: String(editCourse.capacity) },
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
              <button onClick={() => setEditCourse(null)} className="flex-1 text-sm rounded py-2" style={{ border: "1px solid var(--color-border)", color: "var(--color-text-secondary)", background: "transparent" }}>
                Cancel
              </button>
              <button onClick={() => { setEditCourse(null); showToast("Course updated successfully."); }} className="flex-1 text-sm font-medium rounded py-2" style={{ background: "#7c3aed", color: "white" }}>
                Save Changes
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Add modal */}
      {showAdd && (
        <Modal onClose={() => setShowAdd(false)}>
          <div className="p-6 max-w-[440px] w-[440px]">
            <div className="text-sm font-semibold mb-4" style={{ color: "var(--color-text-primary)" }}>Add New Course</div>
            <div className="space-y-4">
              {[{ label: "Course Code", placeholder: "e.g. CS-401" }, { label: "Course Title", placeholder: "e.g. Machine Learning" }, { label: "Instructor", placeholder: "Dr. Name" }].map((f) => (
                <div key={f.label}>
                  <label className="block text-[10px] font-semibold uppercase tracking-wider mb-1.5" style={{ color: "var(--color-text-muted)" }}>{f.label}</label>
                  <input placeholder={f.placeholder} className="w-full rounded px-3 py-2 text-sm outline-none"
                    style={{ background: "var(--color-bg-elevated)", border: "1px solid var(--color-border)", color: "var(--color-text-primary)", fontFamily: "var(--font-sans)" }}
                    onFocus={(e) => (e.target.style.borderColor = "#7c3aed")} onBlur={(e) => (e.target.style.borderColor = "var(--color-border)")} />
                </div>
              ))}
              <div className="grid grid-cols-3 gap-3">
                {[{ label: "Credits", placeholder: "4" }, { label: "Capacity", placeholder: "80" }, { label: "Dept", placeholder: "CSE" }].map((f) => (
                  <div key={f.label}>
                    <label className="block text-[10px] font-semibold uppercase tracking-wider mb-1.5" style={{ color: "var(--color-text-muted)" }}>{f.label}</label>
                    <input placeholder={f.placeholder} className="w-full rounded px-3 py-2 text-sm outline-none"
                      style={{ background: "var(--color-bg-elevated)", border: "1px solid var(--color-border)", color: "var(--color-text-primary)", fontFamily: "var(--font-sans)" }}
                      onFocus={(e) => (e.target.style.borderColor = "#7c3aed")} onBlur={(e) => (e.target.style.borderColor = "var(--color-border)")} />
                  </div>
                ))}
              </div>
            </div>
            <div className="flex gap-2 mt-5">
              <button onClick={() => setShowAdd(false)} className="flex-1 text-sm rounded py-2" style={{ border: "1px solid var(--color-border)", color: "var(--color-text-secondary)", background: "transparent" }}>
                Cancel
              </button>
              <button onClick={() => { setShowAdd(false); showToast("Course created successfully."); }} className="flex-1 text-sm font-medium rounded py-2" style={{ background: "#7c3aed", color: "white" }}>
                Create Course
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Archive confirm */}
      {confirmArchive && (
        <Modal onClose={() => setConfirmArchive(null)}>
          <div className="p-6 max-w-[360px]">
            <div className="text-sm font-semibold mb-2" style={{ color: "var(--color-text-primary)" }}>
              {confirmArchive.status === "archived" ? "Restore" : "Archive"} Course
            </div>
            <p className="text-xs leading-relaxed mb-5" style={{ color: "var(--color-text-secondary)" }}>
              {confirmArchive.status === "archived"
                ? `Restore "${confirmArchive.title}" and make it available for registration?`
                : `Archive "${confirmArchive.title}"? Students will no longer be able to register for it.`}
            </p>
            <div className="flex gap-2">
              <button onClick={() => setConfirmArchive(null)} className="flex-1 text-sm rounded py-2" style={{ border: "1px solid var(--color-border)", color: "var(--color-text-secondary)", background: "transparent" }}>Cancel</button>
              <button onClick={() => handleArchive(confirmArchive)} className="flex-1 text-sm font-medium rounded py-2" style={{ background: "var(--color-accent)", color: "white" }}>
                {confirmArchive.status === "archived" ? "Restore" : "Archive"}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

function CourseStatusBadge({ status }: { status: string }) {
  const m: Record<string, { bg: string; color: string }> = {
    active:   { bg: "var(--color-success-bg)", color: "var(--color-success)" },
    draft:    { bg: "var(--color-warning-bg)", color: "var(--color-warning)" },
    archived: { bg: "var(--color-bg-elevated)", color: "var(--color-text-muted)" },
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
