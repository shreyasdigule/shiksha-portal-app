import { useState } from "react";
import type { Page, User } from "../App";

interface Props {
  user: User;
  currentPage: Page;
  onNavigate: (page: Page) => void;
  onLogout: () => void;
  theme: "dark" | "light";
  onToggleTheme: () => void;
  children: React.ReactNode;
}

const NAV_ITEMS: { id: Page; label: string; icon: React.ReactNode }[] = [
  { id: "dashboard",  label: "Dashboard",     icon: <GridIcon /> },
  { id: "courses",    label: "Registration",  icon: <BookOpenIcon /> },
  { id: "tests",      label: "Examinations",  icon: <ClipboardIcon /> },
  { id: "results",    label: "Results",       icon: <ChartBarIcon /> },
  { id: "attendance", label: "Attendance",    icon: <CalendarIcon /> },
  { id: "profile",    label: "My Profile",    icon: <UserIcon /> },
];

export default function DashboardLayout({ user, currentPage, onNavigate, onLogout, theme, onToggleTheme, children }: Props) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="flex h-full" style={{ background: "var(--color-bg-base)" }}>
      {/* Sidebar */}
      <aside
        className="flex flex-col shrink-0 transition-all duration-200"
        style={{ width: collapsed ? "60px" : "220px", background: "var(--color-bg-surface)", borderRight: "1px solid var(--color-border)" }}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-4 py-4 shrink-0" style={{ borderBottom: "1px solid var(--color-border-subtle)", height: "57px" }}>
          <div className="w-7 h-7 rounded shrink-0 flex items-center justify-center" style={{ background: "var(--color-accent)" }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/>
            </svg>
          </div>
          {!collapsed && (
            <div className="overflow-hidden">
              <div className="text-xs font-bold tracking-widest uppercase whitespace-nowrap" style={{ color: "var(--color-text-primary)", letterSpacing: "0.1em" }}>
                ShikshaPortal
              </div>
              <div className="text-[10px]" style={{ color: "var(--color-text-muted)" }}>VIT Pune</div>
            </div>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-3 px-2">
          <div className="space-y-0.5">
            {NAV_ITEMS.map((item) => {
              const active = currentPage === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onNavigate(item.id)}
                  className="w-full flex items-center gap-3 rounded px-2.5 py-2.5 text-sm transition-all text-left"
                  title={collapsed ? item.label : undefined}
                  style={{
                    background: active ? "var(--color-accent-muted)" : "transparent",
                    color: active ? "var(--color-accent)" : "var(--color-text-secondary)",
                    borderLeft: active ? "2px solid var(--color-accent)" : "2px solid transparent",
                  }}
                >
                  <span className="shrink-0">{item.icon}</span>
                  {!collapsed && <span className="font-medium">{item.label}</span>}
                </button>
              );
            })}
          </div>

          {!collapsed && (
            <div className="mt-6 px-2">
              <div className="text-[10px] font-semibold uppercase tracking-widest mb-2" style={{ color: "var(--color-text-muted)", letterSpacing: "0.1em" }}>
                Quick Links
              </div>
              <div className="space-y-0.5">
                <button
                  onClick={() => window.open("https://www.vit.edu/contact/", "_blank", "noopener,noreferrer")}
                  className="w-full flex items-center gap-3 rounded px-2.5 py-2.5 text-sm text-left"
                  style={{ color: "var(--color-text-muted)", borderLeft: "2px solid transparent" }}
                >
                  <span className="shrink-0"><QuestionIcon /></span>
                  <span>Help &amp; Support</span>
                </button>
              </div>
            </div>
          )}
        </nav>

        {/* Bottom */}
        <div style={{ borderTop: "1px solid var(--color-border-subtle)" }}>
          <div className="px-3 py-3 flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-full shrink-0 flex items-center justify-center text-xs font-bold" style={{ background: "var(--color-accent-muted)", color: "var(--color-accent)" }}>
              {user.avatar}
            </div>
            {!collapsed && (
              <div className="flex-1 min-w-0">
                <div className="text-xs font-semibold truncate" style={{ color: "var(--color-text-primary)" }}>{user.name}</div>
                <div className="text-[10px] truncate" style={{ color: "var(--color-text-muted)", fontFamily: "var(--font-mono)" }}>{user.studentId}</div>
              </div>
            )}
          </div>

          <div className="px-2 pb-3 flex gap-1">
            <button
              onClick={() => setCollapsed((v) => !v)}
              className="flex-1 flex items-center justify-center rounded py-1.5 text-xs gap-1.5 transition-all"
              style={{ color: "var(--color-text-muted)" }}
              title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              <CollapseIcon flipped={collapsed} />
              {!collapsed && <span>Collapse</span>}
            </button>

            {/* Theme toggle */}
            <button
              onClick={onToggleTheme}
              className="flex items-center justify-center rounded py-1.5 px-2 text-xs transition-all"
              style={{ color: "var(--color-text-muted)" }}
              title={theme === "light" ? "Switch to dark mode" : "Switch to light mode"}
            >
              {theme === "light" ? <MoonIcon /> : <SunIcon />}
            </button>

            {!collapsed && (
              <button onClick={onLogout} className="flex items-center justify-center rounded py-1.5 px-2 text-xs" style={{ color: "var(--color-danger)" }} title="Sign out">
                <LogOutIcon />
              </button>
            )}
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto">{children}</main>
    </div>
  );
}

function GridIcon() { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>; }
function BookOpenIcon() { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2z"/><path d="M22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7z"/></svg>; }
function ClipboardIcon() { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 4h2a2 2 0 012 2v14a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2h2"/><rect x="8" y="2" width="8" height="4" rx="1"/></svg>; }
function ChartBarIcon() { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/><line x1="2" y1="20" x2="22" y2="20"/></svg>; }
function UserIcon() { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>; }
function CalendarIcon() { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>; }
function QuestionIcon() { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>; }
function LogOutIcon() { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>; }
function CollapseIcon({ flipped }: { flipped: boolean }) { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ transform: flipped ? "scaleX(-1)" : undefined }}><polyline points="15 18 9 12 15 6"/></svg>; }
function SunIcon() { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>; }
function MoonIcon() { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/></svg>; }
