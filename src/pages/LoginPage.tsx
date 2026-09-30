import { useState } from "react";
import { supabase } from "../lib/supabase";

export interface LoginInfo {
  name: string;
  displayName: string;
  studentId: string;
  email: string;
}

export interface StudentRegistration {
  fullName: string;
  studentId: string;
  department: string;
  semester: number;
}

export interface FacultyRegistration {
  fullName: string;
  department: string;
}

export type AuthMode = "sign_in" | "sign_up";

interface Props {
  onLogin: (role: "student" | "admin", email: string, password: string, mode: AuthMode, registration?: StudentRegistration | FacultyRegistration) => Promise<void>;
  theme: "dark" | "light";
  onToggleTheme: () => void;
}

// Accept a broad institutional email while checking the PRN separately.
const VIT_STUDENT_REGEX = /^[a-z][a-z0-9_-]{0,59}\.[0-9]{8,11}@vit\.edu$/i;
// Faculty: any @vit.edu address
const VIT_FACULTY_REGEX = /^[^\s@]+@vit\.edu$/i;
const VIT_DEPARTMENTS = [
  "Artificial Intelligence & Data Science",
  "Chemical Engineering",
  "Civil Engineering",
  "Computer Engineering",
  "Computer Engineering (Software Engineering)",
  "Computer Sciences & Engineering (AI)",
  "Computer Science & Engineering (AI & ML)",
  "Computer Science & Engineering (Data Science)",
  "Computer Science & Engineering (IoT & Cyber Security Including Blockchain Technology)",
  "Electronics and Telecommunication Engineering",
  "Engineering Sciences & Humanities",
  "Information Technology",
  "Instrumentation and Control Engineering",
  "Mechanical Engineering",
  "Multidisciplinary Engineering",
];

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
  const [mode, setMode] = useState<AuthMode>("sign_in");
  const [role, setRole] = useState<"student" | "admin">("student");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [department, setDepartment] = useState("");
  const [semester, setSemester] = useState("");
  const [loading, setLoading] = useState(false);
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [authError, setAuthError] = useState("");
  const [notice, setNotice] = useState("");

  const validateEmail = (val: string): string => {
    const normalized = val.trim().toLowerCase();
    if (!normalized) return role === "admin" ? "Faculty email is required." : "Email is required.";
    const ok = role === "student" ? VIT_STUDENT_REGEX.test(normalized) : VIT_FACULTY_REGEX.test(normalized);
    if (!ok) {
      return role === "student"
        ? "Enter your VIT email in the format: name.PRN@vit.edu (e.g. shreyas.1251050076@vit.edu)"
        : "Enter a valid @vit.edu faculty email address.";
    }
    return "";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError("");
    setNotice("");
    const eErr = validateEmail(email);
    const pErr = mode === "sign_up" ? validatePassword(password) : !password ? "Password is required." : password.length < 8 ? "Password must be at least 8 characters." : "";
    const info = extractLoginInfo(email.trim().toLowerCase());
    const nameErr = mode === "sign_up" && fullName.trim().length < 2 ? "Enter your full name." : "";
    const idErr = mode === "sign_up" && role === "student" && !/^VIT-[0-9]{8,11}$/i.test(info.studentId) ? "Use a VIT email containing your 8–11 digit PRN." : "";
    const deptErr = mode === "sign_up" && !VIT_DEPARTMENTS.includes(department) ? "Select a department from the list." : "";
    const sem = Number(semester);
    const semErr = mode === "sign_up" && role === "student" && (!Number.isInteger(sem) || sem < 1 || sem > 12) ? "Semester must be between 1 and 12." : "";
    setEmailError(eErr);
    setPasswordError(pErr);
    if (eErr || pErr || nameErr || idErr || deptErr || semErr) {
      setAuthError(nameErr || idErr || deptErr || semErr);
      return;
    }
    if (!supabase) { setAuthError("Cloud login is not configured. Add the Supabase URL and publishable key, then reload."); return; }

    setLoading(true);
    try {
      const registration = mode !== "sign_up" ? undefined : role === "student"
        ? { fullName: fullName.trim(), studentId: info.studentId.toUpperCase(), department: department.trim(), semester: sem }
        : { fullName: fullName.trim(), department: department.trim() };
      await onLogin(role, email.trim().toLowerCase(), password, mode, registration);
      if (mode === "sign_up" && role === "admin") {
        setNotice("Faculty account created. Confirm your email if prompted, then sign in.");
        setMode("sign_in");
      } else if (mode === "sign_up") setNotice("Registration complete. Opening your student portal…");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to authenticate. Please try again.";
      setAuthError(message.includes("Database error saving new user")
        ? "Supabase still has the old signup trigger. Run migration 202609300005_fix_faculty_signup.sql in the SQL Editor, then retry."
        : message);
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordReset = async () => {
    const normalizedEmail = email.trim().toLowerCase();
    const emailErr = validateEmail(normalizedEmail);
    setEmailError(emailErr);
    setAuthError("");
    setNotice("");
    if (emailErr) return;
    if (!supabase) { setAuthError("Cloud login is not configured. Add the Supabase URL and publishable key, then reload."); return; }
    const { error } = await supabase.auth.resetPasswordForEmail(normalizedEmail);
    if (error) setAuthError(error.message);
    else setNotice("If an account exists for that email, a password reset link has been sent.");
  };

  const isLight = theme === "light";
  const adminAccent = "#7c3aed";
  const primaryAccent = role === "admin" ? adminAccent : "var(--color-accent)";

  return (
    <div style={{ background: "var(--color-bg-base)", minHeight: "100vh" }} className="relative flex flex-col">
      {/* Theme toggle — top right */}
      <button
        onClick={onToggleTheme}
        className="absolute top-5 right-5 z-10 w-10 h-10 rounded-lg flex items-center justify-center transition-all"
        style={{ background: "var(--color-bg-card)", border: "1px solid var(--color-border)", color: "var(--color-text-muted)" }}
        title={isLight ? "Switch to dark mode" : "Switch to light mode"}
      >
        {isLight ? <MoonIcon /> : <SunIcon />}
      </button>

      <header className="relative z-[1] w-full px-6 py-4 sm:px-10 sm:py-5" style={{ background: "#073660", borderBottom: "1px solid #1f5c8c" }}>
        <div className="mx-auto flex w-full max-w-6xl min-h-[64px] items-center justify-between gap-4 pr-12 sm:pr-16">
          <img
            src="https://www.vit.edu/wp-content/uploads/2025/06/vit_white_logo-scaled.png"
            alt="Vishwakarma Institute of Technology, Pune"
            className="h-auto w-[min(74vw,350px)] object-contain object-left"
          />
          <div className="hidden border-l border-white/25 pl-5 text-right sm:block">
            <div className="text-lg font-semibold tracking-tight text-white">ShikshaPortal</div>
            <div className="mt-0.5 text-xs text-blue-100/80">Academic services</div>
          </div>
        </div>
      </header>

      <main className="relative z-[1] mx-auto flex w-full max-w-6xl flex-1 flex-col items-center px-6 pb-10 pt-6 sm:px-8 sm:pt-9">
        <section className="mb-6 w-full max-w-[470px] sm:mb-7">
          <h1 className="mb-2 text-2xl font-semibold leading-tight tracking-tight sm:text-[28px]" style={{ color: "var(--color-text-primary)" }}>
            Welcome to ShikshaPortal
          </h1>
          <p className="text-sm leading-relaxed" style={{ color: "var(--color-text-secondary)" }}>
            Your VIT Pune academic workspace. Sign in to register for courses, take assessments, and keep track of your results.
          </p>
        </section>

        <section aria-label="Portal sign in" className="w-full max-w-[470px] rounded-lg p-5 sm:p-8" style={{ background: "var(--color-bg-surface)", border: "1px solid var(--color-border)", boxShadow: "0 8px 24px rgba(15,23,42,0.08)" }}>
          <div className="mx-auto w-full max-w-[400px]">

          {/* Role selector */}
          <div className="mb-6 flex p-1 rounded gap-1" style={{ background: "var(--color-bg-card)", border: "1px solid var(--color-border)" }}>
            {([["student", "Student"], ["admin", "Faculty / Admin"]] as [typeof role, string][]).map(([r, label]) => (
              <button
                key={r}
                type="button"
                onClick={() => { setRole(r); setMode("sign_in"); setEmailError(""); setPasswordError(""); setAuthError(""); }}
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
              {mode === "sign_up" ? `Create ${role === "admin" ? "faculty" : "student"} account` : role === "admin" ? "Faculty sign in" : "Student sign in"}
            </h2>
            <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
              {role === "admin"
                ? mode === "sign_up" ? "Register your VIT email and department to create a faculty account." : "Access the faculty administration panel."
                : mode === "sign_up" ? "Register with your VIT email and PRN." : "Use your VIT institutional email to sign in."}
            </p>
          </div>

          <div className="mb-5 flex items-center gap-1.5 text-sm" style={{ color: "var(--color-text-muted)" }}>
            {mode === "sign_in" ? `New ${role === "admin" ? "faculty member" : "student"}?` : "Already registered?"}
            <button type="button" onClick={() => { setMode(mode === "sign_in" ? "sign_up" : "sign_in"); setAuthError(""); setNotice(""); }} className="font-semibold" style={{ color: "var(--color-accent)" }}>
              {mode === "sign_in" ? "Create account" : "Sign in"}
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === "sign_up" && (
              <>
                <div>
                  <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wider" style={{ color: "var(--color-text-secondary)" }}>Full name</label>
                  <input required minLength={2} maxLength={100} value={fullName} onChange={(e) => setFullName(e.target.value)} autoComplete="name" placeholder="Your full name" className="w-full rounded px-3.5 py-2.5 text-sm outline-none" style={{ background: "var(--color-bg-card)", border: "1px solid var(--color-border)", color: "var(--color-text-primary)" }} />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wider" style={{ color: "var(--color-text-secondary)" }}>Department</label>
                  <select required value={department} onChange={(e) => setDepartment(e.target.value)} className="w-full rounded px-3.5 py-2.5 text-sm outline-none" style={{ background: "var(--color-bg-card)", border: "1px solid var(--color-border)", color: department ? "var(--color-text-primary)" : "var(--color-text-muted)", fontFamily: "var(--font-sans)" }}>
                    <option value="">Select your department</option>
                    {VIT_DEPARTMENTS.map((item) => <option key={item} value={item}>{item}</option>)}
                  </select>
                </div>
                {role === "student" && <div>
                  <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wider" style={{ color: "var(--color-text-secondary)" }}>Semester</label>
                  <input required type="number" min={1} max={12} step={1} value={semester} onChange={(e) => setSemester(e.target.value)} placeholder="1–12" className="w-full rounded px-3.5 py-2.5 text-sm outline-none" style={{ background: "var(--color-bg-card)", border: "1px solid var(--color-border)", color: "var(--color-text-primary)" }} />
                </div>}
              </>
            )}
            {/* Email field */}
            <div>
              <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wider" style={{ color: "var(--color-text-secondary)", letterSpacing: "0.06em" }}>
                {role === "admin" ? "Faculty Email" : "University Email"}
              </label>
              <input
                  type="email"
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
                <button type="button" onClick={handlePasswordReset} className="text-xs" style={{ color: "var(--color-accent)" }}>
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); if (passwordError) setPasswordError(""); }}
                  onBlur={() => setPasswordError(mode === "sign_up" ? validatePassword(password) : !password ? "Password is required." : password.length < 8 ? "Password must be at least 8 characters." : "")}
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
                  {mode === "sign_up" ? "Creating account..." : "Signing in..."}
                </span>
              ) : (
                mode === "sign_up" ? `Create ${role === "admin" ? "faculty" : "student"} account` : "Sign in"
              )}
            </button>
            {authError && <p role="alert" className="text-xs" style={{ color: "var(--color-danger)" }}>{authError}</p>}
            {notice && <p role="status" className="text-xs" style={{ color: "var(--color-success)" }}>{notice}</p>}
          </form>

        </div>
        </section>
      </main>

      <footer className="relative z-[1] mt-auto" style={{ borderTop: "1px solid var(--color-border-subtle)", background: "color-mix(in srgb, var(--color-bg-surface) 75%, transparent)" }}>
        <div className="mx-auto grid w-full max-w-6xl gap-6 px-6 py-6 text-xs sm:grid-cols-3 sm:px-8">
          <div>
            <div className="mb-2 font-semibold" style={{ color: "var(--color-text-primary)" }}>Institute</div>
            <a href="https://www.vit.edu/" target="_blank" rel="noreferrer" className="block underline underline-offset-2" style={{ color: "var(--color-text-secondary)" }}>Vishwakarma Institute of Technology, Pune</a>
            <a href="https://www.vit.edu/contact/" target="_blank" rel="noreferrer" className="mt-1 block underline underline-offset-2" style={{ color: "var(--color-text-secondary)" }}>Official contact page</a>
          </div>
          <div>
            <div className="mb-2 font-semibold" style={{ color: "var(--color-text-primary)" }}>Contact</div>
            <a href="tel:+912029912562" className="block underline underline-offset-2" style={{ color: "var(--color-text-secondary)" }}>General office: +91 20 2991 2562</a>
            <a href="mailto:admissions@vit.edu" className="mt-1 block underline underline-offset-2" style={{ color: "var(--color-text-secondary)" }}>Admissions: admissions@vit.edu</a>
            <a href="mailto:exam@vit.edu" className="mt-1 block underline underline-offset-2" style={{ color: "var(--color-text-secondary)" }}>Examination office: exam@vit.edu</a>
          </div>
          <div>
            <div className="mb-2 font-semibold" style={{ color: "var(--color-text-primary)" }}>Campus locations</div>
            <a href="https://www.google.com/maps/search/?api=1&query=Vishwakarma+Institute+of+Technology%2C+666+Upper+Indiranagar%2C+Bibwewadi%2C+Pune+411037" target="_blank" rel="noreferrer" className="block underline underline-offset-2" style={{ color: "var(--color-text-secondary)" }}>Bibwewadi · 666 Upper Indiranagar, Pune 411037</a>
            <a href="https://www.google.com/maps/search/?api=1&query=Vishwakarma+Institute+of+Technology%2C+Survey+No+3%2F4%2C+Kapil+Nagar%2C+Kondhwa+Budruk%2C+Pune+411048" target="_blank" rel="noreferrer" className="mt-1 block underline underline-offset-2" style={{ color: "var(--color-text-secondary)" }}>Kondhwa · Survey No. 3/4, Kapil Nagar</a>
            <div className="mt-2" style={{ color: "var(--color-text-muted)" }}>© {new Date().getFullYear()} ShikshaPortal</div>
          </div>
        </div>
      </footer>
    </div>
  );
}

function AcademicCapIcon() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg>;
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
