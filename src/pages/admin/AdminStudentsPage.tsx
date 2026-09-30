import { useState } from "react";
import { getStudents } from "../../store";
import type { StoredStudent } from "../../store";

const DEPT_OPTIONS = ["All", "CSE", "ECE", "IT", "ME"];

export default function AdminStudentsPage() {
  const [search, setSearch] = useState("");
  const [deptFilter, setDeptFilter] = useState("All");
  const [selected, setSelected] = useState<StoredStudent | null>(null);
  const [suspendedIds, setSuspendedIds] = useState<Set<string>>(new Set());
  const [confirmSuspend, setConfirmSuspend] = useState<StoredStudent | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const allStudents = getStudents();

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const filtered = allStudents.filter((s) => {
    const q = search.toLowerCase();
    const matchSearch = q === "" || s.displayName.toLowerCase().includes(q) || s.studentId.toLowerCase().includes(q) || s.email.toLowerCase().includes(q);
    const matchDept = deptFilter === "All" || s.department === deptFilter;
    return matchSearch && matchDept;
  });

  const handleToggleSuspend = (student: StoredStudent) => {
    setSuspendedIds((prev) => {
      const next = new Set(prev);
      if (next.has(student.studentId)) {
        next.delete(student.studentId);
        showToast(`${student.displayName}'s account reactivated.`);
      } else {
        next.add(student.studentId);
        showToast(`${student.displayName}'s account suspended.`);
      }
      return next;
    });
    setConfirmSuspend(null);
    if (selected?.studentId === student.studentId) setSelected(null);
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
          <h1 className="text-xl font-semibold mb-1" style={{ color: "var(--color-text-primary)" }}>Registered Students</h1>
          <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
            Students who have self-registered on the portal. {allStudents.length === 0 ? "" : `${filtered.length} of ${allStudents.length} shown.`}
          </p>
        </div>
      </div>

      {allStudents.length === 0 ? (
        <div className="rounded-lg p-16 text-center" style={{ background: "var(--color-bg-card)", border: "1px solid var(--color-border)" }}>
          <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: "var(--color-bg-elevated)" }}>
            <UsersIcon />
          </div>
          <div className="text-sm font-medium mb-1" style={{ color: "var(--color-text-secondary)" }}>No students have registered yet</div>
          <div className="text-xs leading-relaxed max-w-[280px] mx-auto" style={{ color: "var(--color-text-muted)" }}>
            Students will appear here after they sign in to the portal using their VIT institutional email address.
          </div>
        </div>
      ) : (
        <>
          <div className="flex flex-wrap gap-2 mb-5">
            <div className="relative flex-1 min-w-[200px]">
              <span className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--color-text-muted)" }}><SearchIcon /></span>
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name, ID, or email..."
                className="w-full rounded pl-8 pr-3 py-2 text-sm outline-none"
                style={{ background: "var(--color-bg-card)", border: "1px solid var(--color-border)", color: "var(--color-text-primary)", fontFamily: "var(--font-sans)" }}
                onFocus={(e) => (e.target.style.borderColor = "#7c3aed")}
                onBlur={(e) => (e.target.style.borderColor = "var(--color-border)")}
              />
            </div>
            <FilterChips options={DEPT_OPTIONS} value={deptFilter} onChange={setDeptFilter} />
          </div>

          <div className="flex gap-5">
            {/* Table */}
            <div className="flex-1 min-w-0 rounded overflow-hidden" style={{ background: "var(--color-bg-card)", border: "1px solid var(--color-border)" }}>
              {filtered.length === 0 ? (
                <div className="py-16 text-center text-sm" style={{ color: "var(--color-text-muted)" }}>No students match your search criteria.</div>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr style={{ borderBottom: "1px solid var(--color-border)" }}>
                      {["Student", "Department", "Semester", "Registered", "Status", ""].map((h) => (
                        <th key={h} className="text-left px-4 py-3 text-[10px] font-semibold uppercase tracking-wider" style={{ color: "var(--color-text-muted)" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((s, i) => {
                      const isSuspended = suspendedIds.has(s.studentId);
                      const isSelected = selected?.studentId === s.studentId;
                      const registeredDate = new Date(s.registeredAt).toLocaleDateString([], { day: "2-digit", month: "short", year: "numeric" });
                      return (
                        <tr
                          key={s.studentId}
                          style={{ borderBottom: i < filtered.length - 1 ? "1px solid var(--color-border-subtle)" : "none", background: isSelected ? "var(--color-accent-muted)" : "transparent", cursor: "pointer" }}
                          onClick={() => setSelected(isSelected ? null : s)}
                        >
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2.5">
                              <div className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0" style={{ background: "var(--color-accent-muted)", color: "var(--color-accent)" }}>
                                {s.displayName.slice(0, 2).toUpperCase()}
                              </div>
                              <div>
                                <div className="text-sm font-medium" style={{ color: "var(--color-text-primary)" }}>{s.displayName}</div>
                                <div className="text-[10px]" style={{ fontFamily: "var(--font-mono)", color: "var(--color-text-muted)" }}>{s.studentId}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-xs" style={{ color: "var(--color-text-muted)" }}>{s.department}</td>
                          <td className="px-4 py-3 text-xs" style={{ fontFamily: "var(--font-mono)", color: "var(--color-text-secondary)" }}>Sem {s.semester}</td>
                          <td className="px-4 py-3 text-xs" style={{ fontFamily: "var(--font-mono)", color: "var(--color-text-muted)" }}>{registeredDate}</td>
                          <td className="px-4 py-3">
                            <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded uppercase tracking-wide"
                              style={{ background: isSuspended ? "var(--color-danger-bg)" : "var(--color-success-bg)", color: isSuspended ? "var(--color-danger)" : "var(--color-success)" }}>
                              {isSuspended ? "suspended" : "active"}
                            </span>
                          </td>
                          <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                            <button
                              onClick={() => setConfirmSuspend(s)}
                              className="text-[10px] px-2 py-1 rounded transition-all"
                              style={{ border: `1px solid ${isSuspended ? "var(--color-success)55" : "var(--color-danger)55"}`, color: isSuspended ? "var(--color-success)" : "var(--color-danger)", background: "transparent" }}
                            >
                              {isSuspended ? "Activate" : "Suspend"}
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>

            {/* Detail panel */}
            {selected && (
              <div className="w-[280px] shrink-0 rounded p-5 space-y-4" style={{ background: "var(--color-bg-card)", border: "1px solid var(--color-border)" }}>
                <div className="flex items-start justify-between">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold" style={{ background: "var(--color-accent-muted)", color: "var(--color-accent)" }}>
                    {selected.displayName.slice(0, 2).toUpperCase()}
                  </div>
                  <button onClick={() => setSelected(null)} style={{ color: "var(--color-text-muted)" }}><CloseIcon /></button>
                </div>
                <div>
                  <div className="text-base font-semibold mb-0.5" style={{ color: "var(--color-text-primary)" }}>{selected.displayName}</div>
                  <div className="text-xs mb-2" style={{ color: "var(--color-text-muted)" }}>{selected.email}</div>
                </div>
                <div className="space-y-2 pt-2" style={{ borderTop: "1px solid var(--color-border-subtle)" }}>
                  {[
                    { label: "Student ID", value: selected.studentId },
                    { label: "Email", value: selected.email },
                    { label: "Department", value: selected.department },
                    { label: "Semester", value: `Semester ${selected.semester}` },
                    { label: "Registered", value: new Date(selected.registeredAt).toLocaleDateString([], { day: "2-digit", month: "short", year: "numeric" }) },
                  ].map((row) => (
                    <div key={row.label} className="flex justify-between text-xs gap-2">
                      <span style={{ color: "var(--color-text-muted)" }}>{row.label}</span>
                      <span className="text-right" style={{ fontFamily: "var(--font-mono)", color: "var(--color-text-secondary)", wordBreak: "break-all" }}>{row.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {/* Confirm suspend modal */}
      {confirmSuspend && (
        <Modal onClose={() => setConfirmSuspend(null)}>
          <div className="p-6 max-w-[380px]">
            <div className="w-10 h-10 rounded flex items-center justify-center mb-4" style={{ background: "var(--color-danger-bg)", border: "1px solid var(--color-danger)44" }}>
              <WarnIcon />
            </div>
            <div className="text-sm font-semibold mb-1" style={{ color: "var(--color-text-primary)" }}>
              {suspendedIds.has(confirmSuspend.studentId) ? "Reactivate" : "Suspend"} Student Account
            </div>
            <p className="text-xs leading-relaxed mb-5" style={{ color: "var(--color-text-secondary)" }}>
              {suspendedIds.has(confirmSuspend.studentId)
                ? `Reactivate ${confirmSuspend.displayName}'s account? They will regain portal access.`
                : `Suspend ${confirmSuspend.displayName}'s account? They will lose access to all portal features until reactivated.`}
            </p>
            <div className="flex gap-2">
              <button onClick={() => setConfirmSuspend(null)} className="flex-1 text-sm rounded py-2" style={{ border: "1px solid var(--color-border)", color: "var(--color-text-secondary)", background: "transparent" }}>
                Cancel
              </button>
              <button
                onClick={() => handleToggleSuspend(confirmSuspend)}
                className="flex-1 text-sm font-medium rounded py-2"
                style={{ background: suspendedIds.has(confirmSuspend.studentId) ? "var(--color-success)" : "var(--color-danger)", color: "white" }}
              >
                {suspendedIds.has(confirmSuspend.studentId) ? "Reactivate" : "Suspend"}
              </button>
            </div>
          </div>
        </Modal>
      )}
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
function CloseIcon() { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>; }
function WarnIcon() { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--color-danger)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>; }
function UsersIcon() { return <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--color-text-muted)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>; }
