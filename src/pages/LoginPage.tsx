import { useState } from "react";

export interface LoginInfo {
  name: string;
  displayName: string;
  studentId: string;
  email: string;
}

interface Props {
  onLogin: (role: "student" | "admin", info?: LoginInfo) => void;
  theme: "dark" | "light";
  onToggleTheme: () => void;
}

// VIT student email: name.prn@vit.edu
const VIT_STUDENT_REGEX = /^[a-zA-Z]+\.[0-9]{8,11}@vit\.edu$/;
// Faculty: any @vit.edu address
const VIT_FACULTY_REGEX = /^[a-zA-Z0-9._%+-]+@vit\.edu$/;

function extractLoginInfo(email: string): LoginInfo {
  const localPart = email.split("@")[0];
  const dotIdx = localPart.indexOf(".");
  const name = dotIdx >= 0 ? localPart.slice(0, dotIdx) : localPart;
  const prn = dotIdx >= 0 ? localPart.slice(dotIdx + 1) : "0000000000";
  const displayName = name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();
  return {
    name,
    displayName,
    studentId: "VIT-" + prn,
    email,
  };
}

function validatePassword(pw: string): string {
  if (!pw) return "Password is required.";
  if (pw.length < 8) return "Password must be at least 8 characters.";
  if (!/[a-zA-Z]/.test(pw)) return "Password must contain at least one letter.";
  if (!/[0-9]/.test(pw)) return "Password must contain at least one number.";
  return "";
}

export default function LoginPage({ onLogin, theme, onToggleTheme }: Props) {
  const [role, setRole] = useState<"student" | "admin">("student");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const [loading, setLoading] = useState(false);
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const validateEmail = (val: string): string => {
    if (!val.trim()) return role === "admin" ? "Faculty email is required." : "Email is required.";
    const ok = role === "student" ? VIT_STUDENT_REGEX.test(val) : VIT_FACULTY_REGEX.test(val);
    if (!ok) {
      return role === "student"
        ? "Enter your VIT email in the format: name.PRN@vit.edu (e.g. shreyas.1251050076@vit.edu)"
        : "Enter a valid @vit.edu faculty email address.";
    }
    return "";
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const eErr = validateEmail(email);
    const pErr = validatePassword(password);
    setEmailError(eErr);
    setPasswordError(pErr);
    if (eErr || pErr) return;

    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      if (role === "student") {
        onLogin("student", extractLoginInfo(email));
      } else {
        onLogin("admin");
      }
    }, 1100);
  };

  const isLight = theme === "light";
  const adminAccent = "#7c3aed";
  const primaryAccent = role === "admin" ? adminAccent : "var(--color-accent)";

  return (
    <div style={{ background: "var(--color-bg-base)", minHeight: "100vh" }} className="flex items-stretch">
      {/* Theme toggle — top right */}
      <button
        onClick={onToggleTheme}
        className="fixed top-4 right-4 z-10 w-9 h-9 rounded-full flex items-center justify-center transition-all"
        style={{ background: "var(--color-bg-card)", border: "1px solid var(--color-border)", color: "var(--color-text-muted)" }}
        title={isLight ? "Switch to dark mode" : "Switch to light mode"}
      >
        {isLight ? <MoonIcon /> : <SunIcon />}
      </button>

      {/* Left panel */}
      <div
        className="hidden lg:flex flex-col justify-between w-[420px] shrink-0 p-10"
        style={{ background: "var(--color-bg-surface)", borderRight: "1px solid var(--color-border)" }}
      >
        <div>
          <div className="flex items-center gap-3 mb-12">
            <div className="w-9 h-9 rounded flex items-center justify-center" style={{ background: "var(--color-accent)" }}>
              <AcademicCapIcon />
            </div>
            <div>
              <div className="text-sm font-bold tracking-widest uppercase" style={{ color: "var(--color-text-primary)", letterSpacing: "0.1em" }}>
                ShikshaPortal
              </div>
              <div className="text-[10px]" style={{ color: "var(--color-text-muted)" }}>
                Vishwakarma Institute of Technology, Pune
              </div>
            </div>
          </div>

          <div className="mt-12">
            <h1 className="text-3xl font-semibold leading-snug mb-4" style={{ color: "var(--color-text-primary)" }}>
              Academic Examination<br />Management System
            </h1>
            <p className="text-sm leading-relaxed" style={{ color: "var(--color-text-secondary)" }}>
              Centralized platform for course registration, secure MCQ assessments, and academic performance tracking.
            </p>
          </div>

          <div className="mt-10 space-y-4">
            {[
              "Secure proctored MCQ examinations",
              "Real-time scoring and instant results",
              "Comprehensive performance analytics",
              "Course registration and management",
            ].map((text) => (
              <div key={text} className="flex items-center gap-3">
                <span style={{ color: "var(--color-accent)" }}><CheckIcon /></span>
                <span className="text-sm" style={{ color: "var(--color-text-secondary)" }}>{text}</span>
              </div>
            ))}
          </div>

          {/* VIT format hint */}
          <div className="mt-10 rounded p-4" style={{ background: "var(--color-bg-elevated)", border: "1px solid var(--color-border-subtle)" }}>
            <div className="text-[10px] font-semibold uppercase tracking-widest mb-2" style={{ color: "var(--color-text-muted)" }}>
              Student Login Format
            </div>
            <div className="text-sm font-medium mb-0.5" style={{ color: "var(--color-text-primary)", fontFamily: "var(--font-mono)" }}>
              name.PRN@vit.edu
            </div>
            <div className="text-xs" style={{ color: "var(--color-text-muted)" }}>
              Example: shreyas.1251050076@vit.edu
            </div>
          </div>
        </div>

        <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>
          &copy; 2024 Vishwakarma Institute of Technology, Pune. All rights reserved.
        </p>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-[400px]">
          {/* Mobile logo */}
          <div className="flex items-center gap-3 mb-8 lg:hidden">
            <div className="w-8 h-8 rounded flex items-center justify-center" style={{ background: "var(--color-accent)" }}>
              <AcademicCapIcon />
            </div>
            <span className="text-sm font-bold tracking-widest uppercase" style={{ color: "var(--color-text-secondary)", letterSpacing: "0.1em" }}>
              ShikshaPortal &mdash; VIT Pune
            </span>
          </div>

          {/* Role selector */}
          <div className="mb-6 flex p-1 rounded gap-1" style={{ background: "var(--color-bg-card)", border: "1px solid var(--color-border)" }}>
            {([["student", "Student"], ["admin", "Faculty / Admin"]] as [typeof role, string][]).map(([r, label]) => (
              <button
                key={r}
                type="button"
                onClick={() => { setRole(r); setEmailError(""); setPasswordError(""); }}
                className="flex-1 py-2 text-sm font-medium rounded transition-all"
                style={{
                  background: role === r ? (r === "admin" ? adminAccent : "var(--color-accent)") : "transparent",
                  color: role === r ? "white" : "var(--color-text-secondary)",
                }}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="mb-6">
            <h2 className="text-2xl font-semibold mb-1" style={{ color: "var(--color-text-primary)" }}>
              {role === "admin" ? "Faculty sign in" : "Student sign in"}
            </h2>
            <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
              {role === "admin"
                ? "Access the faculty administration panel."
                : "Use your VIT institutional email to sign in."}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email field */}
            <div>
              <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wider" style={{ color: "var(--color-text-secondary)", letterSpacing: "0.06em" }}>
                {role === "admin" ? "Faculty Email" : "University Email"}
              </label>
              <input
                type="text"
                value={email}
                onChange={(e) => { setEmail(e.target.value); if (emailError) setEmailError(""); }}
                onBlur={() => setEmailError(validateEmail(email))}
                placeholder={role === "student" ? "name.PRN@vit.edu" : "faculty@vit.edu"}
                autoComplete="username"
                className="w-full rounded px-3.5 py-2.5 text-sm outline-none transition-all"
                style={{
                  background: "var(--color-bg-card)",
                  border: `1px solid ${emailError ? "var(--color-danger)" : "var(--color-border)"}`,
                  color: "var(--color-text-primary)",
                  fontFamily: "var(--font-sans)",
                }}
                onFocus={(e) => (e.target.style.borderColor = primaryAccent)}
              />
              {emailError && (
                <p className="mt-1.5 text-xs flex items-start gap-1.5" style={{ color: "var(--color-danger)" }}>
                  <AlertIcon />{emailError}
                </p>
              )}
              {!emailError && role === "student" && email && VIT_STUDENT_REGEX.test(email) && (
                <p className="mt-1.5 text-xs flex items-center gap-1.5" style={{ color: "var(--color-success)" }}>
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                  Welcome, {extractLoginInfo(email).displayName} &mdash; PRN {extractLoginInfo(email).studentId.replace("VIT-", "")}
                </p>
              )}
            </div>

            {/* Password field */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--color-text-secondary)", letterSpacing: "0.06em" }}>
                  Password
                </label>
                <button type="button" className="text-xs" style={{ color: "var(--color-accent)" }}>
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); if (passwordError) setPasswordError(""); }}
                  onBlur={() => setPasswordError(validatePassword(password))}
                  placeholder="Min. 8 characters with a letter and number"
                  autoComplete="current-password"
                  className="w-full rounded px-3.5 py-2.5 text-sm outline-none transition-all pr-10"
                  style={{
                    background: "var(--color-bg-card)",
                    border: `1px solid ${passwordError ? "var(--color-danger)" : "var(--color-border)"}`,
                    color: "var(--color-text-primary)",
                    fontFamily: "var(--font-sans)",
                  }}
                  onFocus={(e) => (e.target.style.borderColor = primaryAccent)}
                />
                <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: "var(--color-text-muted)" }} onClick={() => setShowPassword((v) => !v)}>
                  {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                </button>
              </div>
              {passwordError && (
                <p className="mt-1.5 text-xs flex items-start gap-1.5" style={{ color: "var(--color-danger)" }}>
                  <AlertIcon />{passwordError}
                </p>
              )}
              {/* Strength indicator */}
              {password && !passwordError && (
                <div className="mt-1.5 flex gap-1">
                  {[8, 10, 12].map((len, i) => (
                    <div
                      key={i}
                      className="h-1 flex-1 rounded-full transition-all"
                      style={{
                        background: password.length >= len
                          ? (i === 0 ? "var(--color-warning)" : i === 1 ? "var(--color-accent)" : "var(--color-success)")
                          : "var(--color-bg-elevated)",
                      }}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Remember me */}
            <div className="flex items-center gap-2.5">
              <button
                type="button"
                role="checkbox"
                aria-checked={remember}
                onClick={() => setRemember((v) => !v)}
                className="w-4 h-4 rounded shrink-0 flex items-center justify-center transition-all"
                style={{
                  background: remember ? primaryAccent : "transparent",
                  border: `1px solid ${remember ? primaryAccent : "var(--color-border)"}`,
                }}
              >
                {remember && <svg width="10" height="7" viewBox="0 0 10 7" fill="none"><path d="M1 3.5L3.8 6L9 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>}
              </button>
              <span className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
                Keep me signed in for 30 days
              </span>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded py-2.5 text-sm font-semibold transition-all mt-1"
              style={{
                background: loading ? "var(--color-bg-elevated)" : primaryAccent,
                color: loading ? "var(--color-text-muted)" : "white",
                cursor: loading ? "not-allowed" : "pointer",
              }}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <SpinnerIcon />
                  Signing in...
                </span>
              ) : (
                role === "admin" ? "Sign in to Admin Portal" : "Sign in to ShikshaPortal"
              )}
            </button>
          </form>

          <div className="mt-8 pt-6 text-xs" style={{ borderTop: "1px solid var(--color-border-subtle)", color: "var(--color-text-muted)" }}>
            <p>
              Need access?{" "}
              <button className="transition-colors" style={{ color: "var(--color-accent)" }}>
                Contact the Registrar's Office
              </button>
            </p>
            <p className="mt-2">
              Technical support:{" "}
              <span style={{ fontFamily: "var(--font-mono)", fontSize: "11px" }}>helpdesk@vit.edu</span>
            </p>
            <p className="mt-2">
              Vishwakarma Institute of Technology, Pune &mdash; 411037
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function AcademicCapIcon() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg>;
}
function CheckIcon() {
  return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5"/></svg>;
}
function AlertIcon() {
  return <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 mt-0.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>;
}
function EyeIcon() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>;
}
function EyeOffIcon() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>;
}
function SpinnerIcon() {
  return <svg className="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/></svg>;
}
function SunIcon() {
  return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>;
}
function MoonIcon() {
  return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/></svg>;
}
