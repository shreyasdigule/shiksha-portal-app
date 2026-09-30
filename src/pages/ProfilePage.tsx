import { useState } from "react";
import type { User } from "../App";

const STORAGE_KEY = "sk-student-profile";

function loadProfile() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}"); } catch { return {}; }
}
function saveProfile(data: object) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); } catch { /* ignore */ }
}

interface Props {
  user: User;
}

export default function ProfilePage({ user }: Props) {
  const stored = loadProfile();
  const [tab, setTab] = useState<"profile" | "security" | "notifications">("profile");

  const [personalEmail, setPersonalEmail] = useState<string>(stored.personalEmail || "");
  const [phone, setPhone] = useState<string>(stored.phone || "");

  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [pwError, setPwError] = useState("");
  const [pwSaved, setPwSaved] = useState(false);

  const handleSave = () => {
    setSaving(true);
    setTimeout(() => {
      saveProfile({ ...loadProfile(), personalEmail, phone });
      setSaving(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    }, 700);
  };

  const handleSavePassword = () => {
    setPwError("");
    setPwSaved(false);
    if (!currentPw) { setPwError("Enter your current password"); return; }
    if (newPw.length < 8) { setPwError("New password must be at least 8 characters"); return; }
    if (newPw !== confirmPw) { setPwError("Passwords do not match"); return; }
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      setPwSaved(true);
      setCurrentPw(""); setNewPw(""); setConfirmPw("");
      setTimeout(() => setPwSaved(false), 3000);
    }, 700);
  };

  return (
    <div className="p-6 max-w-[800px]">
      <div className="mb-6">
        <h1 className="text-xl font-semibold mb-1" style={{ color: "var(--color-text-primary)" }}>My Profile</h1>
        <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
          Manage your account details, security settings, and notification preferences.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 p-1 rounded w-fit" style={{ background: "var(--color-bg-card)", border: "1px solid var(--color-border)" }}>
        {(["profile", "security", "notifications"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className="px-4 py-1.5 text-sm font-medium rounded capitalize transition-all"
            style={{ background: tab === t ? "var(--color-accent)" : "transparent", color: tab === t ? "white" : "var(--color-text-secondary)" }}
          >
            {t === "notifications" ? "Alerts" : t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {tab === "profile" && (
        <div className="space-y-6">
          {/* Avatar + basic info */}
          <div className="rounded p-5 flex items-center gap-5" style={{ background: "var(--color-bg-card)", border: "1px solid var(--color-border)" }}>
            <div className="w-16 h-16 rounded-full flex items-center justify-center text-xl font-bold shrink-0" style={{ background: "var(--color-accent-muted)", color: "var(--color-accent)" }}>
              {user.avatar}
            </div>
            <div>
              <div className="text-base font-semibold mb-0.5" style={{ color: "var(--color-text-primary)" }}>{user.name}</div>
              <div className="text-sm mb-1" style={{ color: "var(--color-text-secondary)" }}>{user.department}</div>
              <div className="inline-flex items-center gap-1.5 text-xs px-2 py-0.5 rounded" style={{ background: "var(--color-bg-elevated)", color: "var(--color-text-muted)", fontFamily: "var(--font-mono)" }}>
                {user.studentId}
              </div>
            </div>
          </div>

          {/* Academic info — read-only from login session */}
          <div className="rounded p-5" style={{ background: "var(--color-bg-card)", border: "1px solid var(--color-border)" }}>
            <div className="text-xs font-semibold uppercase tracking-wider mb-4" style={{ color: "var(--color-text-muted)", letterSpacing: "0.08em" }}>Academic Information</div>
            <div className="grid grid-cols-2 gap-4">
              {[
                { label: "Student ID", value: user.studentId, mono: true },
                { label: "Department", value: user.department },
                { label: "Semester", value: `Semester ${user.semester}` },
                { label: "University Email", value: user.email, mono: true },
                { label: "Programme", value: "B.Tech" },
                { label: "Academic Status", value: "Regular" },
              ].map((item) => (
                <div key={item.label}>
                  <div className="text-xs mb-1" style={{ color: "var(--color-text-muted)" }}>{item.label}</div>
                  <div className="text-sm font-medium" style={{ color: "var(--color-text-primary)", fontFamily: item.mono ? "var(--font-mono)" : undefined }}>
                    {item.value}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Editable contact details — persisted to localStorage */}
          <div className="rounded p-5" style={{ background: "var(--color-bg-card)", border: "1px solid var(--color-border)" }}>
            <div className="text-xs font-semibold uppercase tracking-wider mb-4" style={{ color: "var(--color-text-muted)", letterSpacing: "0.08em" }}>Contact Details</div>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium mb-1.5 uppercase tracking-wide" style={{ color: "var(--color-text-secondary)", letterSpacing: "0.06em" }}>
                  Full Name
                  <span className="ml-2 text-[10px] normal-case tracking-normal px-1.5 py-0.5 rounded" style={{ background: "var(--color-bg-elevated)", color: "var(--color-text-muted)" }}>Read-only</span>
                </label>
                <input type="text" value={user.name} readOnly className="w-full rounded px-3.5 py-2.5 text-sm outline-none" style={{ background: "var(--color-bg-elevated)", border: "1px solid var(--color-border)", color: "var(--color-text-muted)", fontFamily: "var(--font-sans)", cursor: "not-allowed" }} />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1.5 uppercase tracking-wide" style={{ color: "var(--color-text-secondary)", letterSpacing: "0.06em" }}>
                  University Email
                  <span className="ml-2 text-[10px] normal-case tracking-normal px-1.5 py-0.5 rounded" style={{ background: "var(--color-bg-elevated)", color: "var(--color-text-muted)" }}>Read-only</span>
                </label>
                <input type="email" value={user.email} readOnly className="w-full rounded px-3.5 py-2.5 text-sm outline-none" style={{ background: "var(--color-bg-elevated)", border: "1px solid var(--color-border)", color: "var(--color-text-muted)", fontFamily: "var(--font-sans)", cursor: "not-allowed" }} />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1.5 uppercase tracking-wide" style={{ color: "var(--color-text-secondary)", letterSpacing: "0.06em" }}>Personal Email</label>
                <input
                  type="email"
                  value={personalEmail}
                  placeholder="Your personal email address"
                  onChange={(e) => setPersonalEmail(e.target.value)}
                  className="w-full rounded px-3.5 py-2.5 text-sm outline-none"
                  style={{ background: "var(--color-bg-card)", border: "1px solid var(--color-border)", color: "var(--color-text-primary)", fontFamily: "var(--font-sans)" }}
                  onFocus={(e) => (e.target.style.borderColor = "var(--color-accent)")}
                  onBlur={(e) => (e.target.style.borderColor = "var(--color-border)")}
                />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1.5 uppercase tracking-wide" style={{ color: "var(--color-text-secondary)", letterSpacing: "0.06em" }}>Phone Number</label>
                <input
                  type="tel"
                  value={phone}
                  placeholder="Your mobile number"
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full rounded px-3.5 py-2.5 text-sm outline-none"
                  style={{ background: "var(--color-bg-card)", border: "1px solid var(--color-border)", color: "var(--color-text-primary)", fontFamily: "var(--font-sans)" }}
                  onFocus={(e) => (e.target.style.borderColor = "var(--color-accent)")}
                  onBlur={(e) => (e.target.style.borderColor = "var(--color-border)")}
                />
              </div>
            </div>

            <div className="flex items-center gap-3 mt-5">
              <button onClick={handleSave} disabled={saving} className="text-sm font-medium rounded px-4 py-2 transition-all" style={{ background: "var(--color-accent)", color: "white", opacity: saving ? 0.7 : 1 }}>
                {saving ? "Saving..." : "Save Changes"}
              </button>
              {saved && (
                <span className="text-xs flex items-center gap-1.5" style={{ color: "var(--color-success)" }}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                  Changes saved
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      {tab === "security" && (
        <div className="rounded p-5 space-y-5" style={{ background: "var(--color-bg-card)", border: "1px solid var(--color-border)" }}>
          <div className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--color-text-muted)", letterSpacing: "0.08em" }}>Change Password</div>
          {[
            { label: "Current Password", value: currentPw, set: setCurrentPw },
            { label: "New Password", value: newPw, set: setNewPw },
            { label: "Confirm New Password", value: confirmPw, set: setConfirmPw },
          ].map((f) => (
            <div key={f.label}>
              <label className="block text-xs font-medium mb-1.5 uppercase tracking-wide" style={{ color: "var(--color-text-secondary)", letterSpacing: "0.06em" }}>{f.label}</label>
              <input
                type="password"
                value={f.value}
                placeholder="Enter password"
                onChange={(e) => f.set(e.target.value)}
                className="w-full rounded px-3.5 py-2.5 text-sm outline-none"
                style={{ background: "var(--color-bg-elevated)", border: "1px solid var(--color-border)", color: "var(--color-text-primary)", fontFamily: "var(--font-sans)" }}
                onFocus={(e) => (e.target.style.borderColor = "var(--color-accent)")}
                onBlur={(e) => (e.target.style.borderColor = "var(--color-border)")}
              />
            </div>
          ))}
          {pwError && (
            <div className="rounded p-3 text-xs flex items-center gap-2" style={{ background: "var(--color-danger-bg)", color: "var(--color-danger)" }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
              {pwError}
            </div>
          )}
          <div className="rounded p-3 text-xs flex items-start gap-2" style={{ background: "var(--color-warning-bg)", border: "1px solid #92400e44", color: "var(--color-warning)" }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 mt-0.5"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
            Password must be at least 8 characters.
          </div>
          <div className="flex items-center gap-3">
            <button onClick={handleSavePassword} disabled={saving} className="text-sm font-medium rounded px-4 py-2" style={{ background: "var(--color-accent)", color: "white", opacity: saving ? 0.7 : 1 }}>
              {saving ? "Updating..." : "Update Password"}
            </button>
            {pwSaved && (
              <span className="text-xs flex items-center gap-1.5" style={{ color: "var(--color-success)" }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                Password updated
              </span>
            )}
          </div>
        </div>
      )}

      {tab === "notifications" && (
        <div className="rounded p-5 space-y-1" style={{ background: "var(--color-bg-card)", border: "1px solid var(--color-border)" }}>
          <div className="text-xs font-semibold uppercase tracking-wider mb-4" style={{ color: "var(--color-text-muted)", letterSpacing: "0.08em" }}>Notification Preferences</div>
          {[
            { label: "Examination reminders", desc: "24h and 1h before each test", on: true },
            { label: "Result published", desc: "When scores are released", on: true },
            { label: "Registration deadlines", desc: "Course enrollment closing alerts", on: true },
            { label: "Grade updates", desc: "When interim grades are posted", on: true },
          ].map((pref) => (
            <NotifRow key={pref.label} {...pref} />
          ))}
        </div>
      )}
    </div>
  );
}

function NotifRow({ label, desc, on: defaultOn }: { label: string; desc: string; on: boolean }) {
  const [enabled, setEnabled] = useState(defaultOn);
  return (
    <div className="flex items-center justify-between py-3.5" style={{ borderBottom: "1px solid var(--color-border-subtle)" }}>
      <div>
        <div className="text-sm font-medium" style={{ color: "var(--color-text-primary)" }}>{label}</div>
        <div className="text-xs" style={{ color: "var(--color-text-muted)" }}>{desc}</div>
      </div>
      <button
        onClick={() => setEnabled((v) => !v)}
        className="relative shrink-0 w-10 h-5 rounded-full transition-all"
        style={{ background: enabled ? "var(--color-accent)" : "var(--color-bg-elevated)", border: "1px solid var(--color-border)" }}
      >
        <div className="absolute top-0.5 w-4 h-4 rounded-full transition-all" style={{ background: "white", left: enabled ? "calc(100% - 18px)" : "2px" }} />
      </button>
    </div>
  );
}
