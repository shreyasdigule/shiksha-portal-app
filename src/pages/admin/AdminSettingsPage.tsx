import { useState } from "react";

const STORAGE_KEY = "sk-admin-settings";

function loadSettings() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}"); } catch { return {}; }
}
function saveSettings(data: object) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); } catch { /* ignore */ }
}

export default function AdminSettingsPage() {
  const stored = loadSettings();

  const [displayName, setDisplayName] = useState<string>(stored.displayName || "");
  const [email, setEmail] = useState<string>(stored.email || "");
  const [employeeId, setEmployeeId] = useState<string>(stored.employeeId || "");
  const [department, setDepartment] = useState<string>(stored.department || "");
  const [phone, setPhone] = useState<string>(stored.phone || "");

  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");

  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [pwError, setPwError] = useState("");
  const [pwSaved, setPwSaved] = useState(false);

  const [tab, setTab] = useState<"profile" | "security" | "preferences">("profile");

  const [darkMode, setDarkMode] = useState(() => {
    try { return localStorage.getItem("exam-theme") !== "light"; } catch { return true; }
  });
  const [emailNotifs, setEmailNotifs] = useState<boolean>(stored.emailNotifs ?? true);
  const [submissionAlerts, setSubmissionAlerts] = useState<boolean>(stored.submissionAlerts ?? true);

  const handleSaveProfile = () => {
    setSaving(true);
    setTimeout(() => {
      saveSettings({ ...loadSettings(), displayName, email, employeeId, department, phone, emailNotifs, submissionAlerts });
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

  const handleSavePreferences = () => {
    saveSettings({ ...loadSettings(), emailNotifs, submissionAlerts });
    const newTheme = darkMode ? "dark" : "light";
    try { localStorage.setItem("exam-theme", newTheme); } catch { /* ignore */ }
    document.documentElement.setAttribute("data-theme", newTheme);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <div className="p-6 max-w-[820px]">
      <div className="mb-6">
        <h1 className="text-xl font-semibold mb-1" style={{ color: "var(--color-text-primary)" }}>Settings</h1>
        <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>Manage your account, security, and portal preferences.</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 p-1 rounded w-fit" style={{ background: "var(--color-bg-card)", border: "1px solid var(--color-border)" }}>
        {(["profile", "security", "preferences"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className="px-4 py-1.5 text-sm font-medium rounded capitalize transition-all"
            style={{ background: tab === t ? "#7c3aed" : "transparent", color: tab === t ? "white" : "var(--color-text-secondary)" }}
          >
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {tab === "profile" && (
        <div className="space-y-5">
          {/* Avatar row */}
          <div className="rounded p-5 flex items-center gap-5" style={{ background: "var(--color-bg-card)", border: "1px solid var(--color-border)" }}>
            <div className="w-14 h-14 rounded-full flex items-center justify-center text-lg font-bold shrink-0" style={{ background: "#1e1040", color: "#a78bfa" }}>
              {(displayName || "FA").split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase()}
            </div>
            <div>
              <div className="text-base font-semibold mb-0.5" style={{ color: "var(--color-text-primary)" }}>{displayName || "Faculty Admin"}</div>
              <div className="text-sm" style={{ color: "#a78bfa" }}>Faculty / Admin</div>
              <div className="text-xs mt-0.5" style={{ color: "var(--color-text-muted)", fontFamily: "var(--font-mono)" }}>{employeeId || "EMP-XXXX"}</div>
            </div>
          </div>

          {/* Fields */}
          <div className="rounded p-5 space-y-4" style={{ background: "var(--color-bg-card)", border: "1px solid var(--color-border)" }}>
            <div className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "var(--color-text-muted)", letterSpacing: "0.08em" }}>Personal Information</div>
            {[
              { label: "Display Name", value: displayName, set: setDisplayName, type: "text", placeholder: "e.g. Dr. Anand Kumar" },
              { label: "Email Address", value: email, set: setEmail, type: "email", placeholder: "e.g. anand.kumar@vit.edu" },
              { label: "Employee ID", value: employeeId, set: setEmployeeId, type: "text", placeholder: "e.g. VIT-EMP-0042" },
              { label: "Department", value: department, set: setDepartment, type: "text", placeholder: "e.g. Computer Science & Engineering" },
              { label: "Phone Number", value: phone, set: setPhone, type: "tel", placeholder: "e.g. +91 98765 43210" },
            ].map((f) => (
              <div key={f.label}>
                <label className="block text-xs font-medium mb-1.5 uppercase tracking-wide" style={{ color: "var(--color-text-secondary)", letterSpacing: "0.06em" }}>{f.label}</label>
                <input
                  type={f.type}
                  value={f.value}
                  placeholder={f.placeholder}
                  onChange={(e) => f.set(e.target.value)}
                  className="w-full rounded px-3.5 py-2.5 text-sm outline-none"
                  style={{ background: "var(--color-bg-elevated)", border: "1px solid var(--color-border)", color: "var(--color-text-primary)", fontFamily: "var(--font-sans)" }}
                  onFocus={(e) => (e.target.style.borderColor = "#7c3aed")}
                  onBlur={(e) => (e.target.style.borderColor = "var(--color-border)")}
                />
              </div>
            ))}

            <div className="flex items-center gap-3 pt-1">
              <button
                onClick={handleSaveProfile}
                disabled={saving}
                className="text-sm font-medium rounded px-5 py-2 transition-all"
                style={{ background: "#7c3aed", color: "white", opacity: saving ? 0.7 : 1 }}
              >
                {saving ? "Saving..." : "Save Changes"}
              </button>
              {saved && (
                <span className="text-xs flex items-center gap-1.5" style={{ color: "var(--color-success)" }}>
                  <CheckIcon /> Saved successfully
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      {tab === "security" && (
        <div className="rounded p-5 space-y-4" style={{ background: "var(--color-bg-card)", border: "1px solid var(--color-border)" }}>
          <div className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "var(--color-text-muted)", letterSpacing: "0.08em" }}>Change Password</div>

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
                onFocus={(e) => (e.target.style.borderColor = "#7c3aed")}
                onBlur={(e) => (e.target.style.borderColor = "var(--color-border)")}
              />
            </div>
          ))}

          {pwError && (
            <div className="rounded p-3 text-xs flex items-center gap-2" style={{ background: "var(--color-danger-bg)", color: "var(--color-danger)" }}>
              <AlertIcon /> {pwError}
            </div>
          )}

          <div className="rounded p-3 text-xs flex items-start gap-2" style={{ background: "var(--color-warning-bg)", color: "var(--color-warning)" }}>
            <AlertIcon /> Password must be at least 8 characters.
          </div>

          <div className="flex items-center gap-3 pt-1">
            <button
              onClick={handleSavePassword}
              disabled={saving}
              className="text-sm font-medium rounded px-5 py-2 transition-all"
              style={{ background: "#7c3aed", color: "white", opacity: saving ? 0.7 : 1 }}
            >
              {saving ? "Updating..." : "Update Password"}
            </button>
            {pwSaved && (
              <span className="text-xs flex items-center gap-1.5" style={{ color: "var(--color-success)" }}>
                <CheckIcon /> Password updated
              </span>
            )}
          </div>
        </div>
      )}

      {tab === "preferences" && (
        <div className="space-y-4">
          <div className="rounded p-5 space-y-4" style={{ background: "var(--color-bg-card)", border: "1px solid var(--color-border)" }}>
            <div className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "var(--color-text-muted)", letterSpacing: "0.08em" }}>Interface</div>
            <PrefRow
              label="Dark Mode"
              desc="Use the dark theme across the portal"
              enabled={darkMode}
              onToggle={() => setDarkMode((v) => !v)}
            />
          </div>
          <div className="rounded p-5 space-y-1" style={{ background: "var(--color-bg-card)", border: "1px solid var(--color-border)" }}>
            <div className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: "var(--color-text-muted)", letterSpacing: "0.08em" }}>Notifications</div>
            <PrefRow label="Email Notifications" desc="Receive updates about new student registrations" enabled={emailNotifs} onToggle={() => setEmailNotifs((v) => !v)} />
            <PrefRow label="Submission Alerts" desc="Get notified when students submit tests" enabled={submissionAlerts} onToggle={() => setSubmissionAlerts((v) => !v)} />
          </div>
          <button
            onClick={handleSavePreferences}
            className="text-sm font-medium rounded px-5 py-2 transition-all"
            style={{ background: "#7c3aed", color: "white" }}
          >
            Save Preferences
          </button>
          {saved && <span className="text-xs ml-3 inline-flex items-center gap-1.5" style={{ color: "var(--color-success)" }}><CheckIcon /> Saved</span>}
        </div>
      )}
    </div>
  );
}

function PrefRow({ label, desc, enabled, onToggle }: { label: string; desc: string; enabled: boolean; onToggle: () => void }) {
  return (
    <div className="flex items-center justify-between py-3" style={{ borderBottom: "1px solid var(--color-border-subtle)" }}>
      <div>
        <div className="text-sm font-medium" style={{ color: "var(--color-text-primary)" }}>{label}</div>
        <div className="text-xs" style={{ color: "var(--color-text-muted)" }}>{desc}</div>
      </div>
      <button
        onClick={onToggle}
        className="relative shrink-0 w-10 h-5 rounded-full transition-all"
        style={{ background: enabled ? "#7c3aed" : "var(--color-bg-elevated)", border: "1px solid var(--color-border)" }}
      >
        <div className="absolute top-0.5 w-4 h-4 rounded-full transition-all" style={{ background: "white", left: enabled ? "calc(100% - 18px)" : "2px" }} />
      </button>
    </div>
  );
}

function CheckIcon() { return <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>; }
function AlertIcon() { return <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 mt-0.5"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>; }
