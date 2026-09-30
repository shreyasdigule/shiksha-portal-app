import { useState, useEffect } from "react";
import LoginPage from "./pages/LoginPage";
import DashboardLayout from "./layouts/DashboardLayout";
import AdminLayout from "./layouts/AdminLayout";
import DashboardPage from "./pages/DashboardPage";
import TestsPage from "./pages/TestsPage";
import TestDetailPage from "./pages/TestDetailPage";
import ExamInterface from "./pages/ExamInterface";
import ResultsPage from "./pages/ResultsPage";
import ResultDetailPage from "./pages/ResultDetailPage";
import AnswerReviewPage from "./pages/AnswerReviewPage";
import CoursesPage from "./pages/CoursesPage";
import ProfilePage from "./pages/ProfilePage";
import AttendancePage from "./pages/AttendancePage";
import AdminDashboardPage from "./pages/admin/AdminDashboardPage";
import AdminStudentsPage from "./pages/admin/AdminStudentsPage";
import AdminCoursesPage from "./pages/admin/AdminCoursesPage";
import AdminTestsPage from "./pages/admin/AdminTestsPage";
import AdminResultsPage from "./pages/admin/AdminResultsPage";
import AdminAttendancePage from "./pages/admin/AdminAttendancePage";
import AdminSettingsPage from "./pages/admin/AdminSettingsPage";
import type { AdminPage } from "./data/adminPortalData";
import { getProfile, isSupabaseConfigured, supabase } from "./lib/supabase";
import type { Profile } from "./lib/supabase";
import type { AuthMode, FacultyRegistration, StudentRegistration } from "./pages/LoginPage";

export type Page = "dashboard" | "courses" | "tests" | "results" | "attendance" | "profile";

export interface User {
  name: string;
  email: string;
  studentId: string;
  department: string;
  semester: number;
  avatar: string;
}

export default function App() {
  const [authRole, setAuthRole] = useState<"student" | "admin" | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [authIssue, setAuthIssue] = useState("");
  const [currentPage, setCurrentPage] = useState<Page>("dashboard");
  const [adminPage, setAdminPage] = useState<AdminPage>("overview");
  const [testDetailId, setTestDetailId] = useState<number | null>(null);
  const [activeExamId, setActiveExamId] = useState<number | null>(null);
  const [resultAttemptId, setResultAttemptId] = useState<string | null>(null);
  const [reviewAttemptId, setReviewAttemptId] = useState<string | null>(null);
  const [freshAttemptId, setFreshAttemptId] = useState<string | null>(null);

  // ── Theme ─────────────────────────────────────────────────────────────────
  const [theme, setTheme] = useState<"dark" | "light">(() => {
    try { return (localStorage.getItem("exam-theme") as "dark" | "light") || "dark"; } catch { return "dark"; }
  });

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    try { localStorage.setItem("exam-theme", theme); } catch { /* ignore */ }
  }, [theme]);

  const toggleTheme = () => setTheme((t) => (t === "dark" ? "light" : "dark"));

  // ── Auth ──────────────────────────────────────────────────────────────────
  const authClient = supabase;
  const applyProfile = (profile: Profile) => {
    if (profile.status !== "active") throw new Error("Your account is pending approval or suspended. Contact the registrar.");
    const displayName = profile.full_name.trim() || profile.email.split("@")[0];
    const u: User = {
      name: displayName,
      email: profile.email,
      studentId: profile.student_id || profile.id,
      department: profile.department || "Not set",
      semester: profile.semester || 1,
      avatar: displayName.slice(0, 2).toUpperCase(),
    };
    setUser(u);
    setAuthRole(profile.role === "student" ? "student" : "admin");
    setAuthIssue("");
  };

  useEffect(() => {
    if (!authClient) { setAuthLoading(false); return; }
    let mounted = true;
    const restoreSession = async () => {
      const { data, error } = await authClient.auth.getSession();
      if (error) throw error;
      if (data.session) applyProfile(await getProfile(data.session.user.id));
    };
    restoreSession().catch((error) => {
      if (mounted) { setAuthIssue(error instanceof Error ? error.message : "Could not restore your session."); setUser(null); setAuthRole(null); void authClient.auth.signOut(); }
    }).finally(() => { if (mounted) setAuthLoading(false); });
    const { data: listener } = authClient.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return;
      if (!session) { setUser(null); setAuthRole(null); return; }
      // Supabase callback runs outside React; defer profile fetch to avoid blocking auth.
      window.setTimeout(() => {
        getProfile(session.user.id).then((profile) => { if (mounted) applyProfile(profile); })
          .catch((error) => { if (mounted) { setAuthIssue(error instanceof Error ? error.message : "Profile could not be loaded."); setUser(null); setAuthRole(null); void authClient.auth.signOut(); } });
      }, 0);
    });
    return () => { mounted = false; listener.subscription.unsubscribe(); };
  }, []);

  const handleLogin = async (requestedRole: "student" | "admin", email: string, password: string, mode: AuthMode, registration?: StudentRegistration | FacultyRegistration) => {
    if (!supabase || !isSupabaseConfigured) throw new Error("Supabase is not configured.");
    if (mode === "sign_up") {
      if (!registration) throw new Error("Registration details are required.");
      let userMetadata: { full_name: string; department: string; student_id?: string; semester?: number; requested_role?: string };
      if (requestedRole === "student") {
        if (!("studentId" in registration)) throw new Error("Student registration details are incomplete.");
        userMetadata = { full_name: registration.fullName, student_id: registration.studentId, department: registration.department, semester: registration.semester };
      } else {
        if ("studentId" in registration) throw new Error("Faculty registration details are invalid.");
        userMetadata = { full_name: registration.fullName, department: registration.department, requested_role: "faculty" };
      }
      const { data, error } = await supabase.auth.signUp({
        email, password,
        options: { data: userMetadata },
      });
      if (error) throw error;
      if (!data.user) throw new Error("Supabase did not create the account. Please try again.");
      if (requestedRole === "admin") {
        // Faculty self-registration creates an active faculty profile and its
        // separately labelled faculty_accounts row through database triggers.
        if (data.session) applyProfile(await getProfile(data.user.id));
        return;
      }
      if (!data.session) {
        throw new Error("Supabase created the account but is still requiring email confirmation. Turn off Confirm email under Authentication → Sign In / Providers → Email, then remove this unconfirmed test account and register again.");
      }
      applyProfile(await getProfile(data.user.id));
      return;
    }
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    if (!data.user) throw new Error("Supabase did not return an authenticated account.");
    const profile = await getProfile(data.user.id);
    if (profile.role === "student" && requestedRole !== "student") {
      await supabase.auth.signOut();
      throw new Error("This account is registered as a student. Choose Student sign in.");
    }
    if (profile.role !== "student" && requestedRole !== "admin") {
      await supabase.auth.signOut();
      throw new Error("This account is registered for faculty/admin. Choose Faculty / Admin sign in.");
    }
    applyProfile(profile);
  };

  const handleLogout = () => {
    void supabase?.auth.signOut();
    setAuthRole(null);
    setUser(null);
    setCurrentPage("dashboard");
    setAdminPage("overview");
    setTestDetailId(null);
    setActiveExamId(null);
    setResultAttemptId(null);
    setReviewAttemptId(null);
    setFreshAttemptId(null);
  };

  // ── Student navigation ────────────────────────────────────────────────────
  const handleNavigate = (page: Page) => {
    setTestDetailId(null);
    setResultAttemptId(null);
    setReviewAttemptId(null);
    setCurrentPage(page);
  };

  const handleOpenTest = (id: number) => setTestDetailId(id);

  const handleBeginExam = (id: number) => {
    setTestDetailId(null);
    setActiveExamId(id);
  };

  const handleExamComplete = (attemptId: string) => {
    setActiveExamId(null);
    setFreshAttemptId(attemptId);
    setResultAttemptId(attemptId);
    setCurrentPage("results");
  };

  const handleExamExit = () => {
    setActiveExamId(null);
    setCurrentPage("tests");
  };

  const handleOpenResultDetail = (id: string) => {
    setResultAttemptId(id);
    setReviewAttemptId(null);
  };

  const handleOpenReview = (id: string) => {
    setReviewAttemptId(id);
    setResultAttemptId(null);
  };

  const handleBackToResultDetail = (id: string) => {
    setResultAttemptId(id);
    setReviewAttemptId(null);
  };

  const handleBackToHistory = () => {
    setResultAttemptId(null);
    setReviewAttemptId(null);
    setFreshAttemptId(null);
  };

  // ── Auth gate ─────────────────────────────────────────────────────────────
  if (authLoading) {
    return <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--color-bg-base)", color: "var(--color-text-secondary)" }}>Restoring secure session…</div>;
  }
  if (!authRole || !user) {
    return <>
      <LoginPage onLogin={handleLogin} theme={theme} onToggleTheme={toggleTheme} />
      {authIssue && <div role="alert" className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 rounded px-4 py-3 text-sm shadow-lg" style={{ background: "var(--color-danger)", color: "white" }}>{authIssue}</div>}
    </>;
  }

  // ── Admin flow ────────────────────────────────────────────────────────────
  if (authRole === "admin") {
    const renderAdminPage = () => {
      switch (adminPage) {
        case "overview":    return <AdminDashboardPage onNavigate={setAdminPage} />;
        case "students":    return <AdminStudentsPage />;
        case "courses":     return <AdminCoursesPage />;
        case "tests":       return <AdminTestsPage />;
        case "results":     return <AdminResultsPage />;
        case "attendance":  return <AdminAttendancePage />;
        case "settings":   return <AdminSettingsPage />;
      }
    };
    return (
      <AdminLayout currentPage={adminPage} onNavigate={setAdminPage} onLogout={handleLogout} theme={theme} onToggleTheme={toggleTheme}>
        {renderAdminPage()}
      </AdminLayout>
    );
  }

  // ── Full-screen exam — no layout chrome ───────────────────────────────────
  if (activeExamId !== null) {
    return (
      <ExamInterface
        testId={activeExamId}
        user={user}
        onComplete={handleExamComplete}
        onExit={handleExamExit}
      />
    );
  }

  // ── Student flow ──────────────────────────────────────────────────────────
  const renderPage = () => {
    if (currentPage === "results") {
      if (reviewAttemptId !== null) {
        return <AnswerReviewPage attemptId={reviewAttemptId} onBack={() => handleBackToResultDetail(reviewAttemptId)} />;
      }
      if (resultAttemptId !== null) {
        return (
          <ResultDetailPage
            attemptId={resultAttemptId}
            isFresh={resultAttemptId === freshAttemptId}
            onBack={
              freshAttemptId === resultAttemptId
                ? () => { setResultAttemptId(null); setFreshAttemptId(null); handleNavigate("tests"); }
                : handleBackToHistory
            }
            onReview={handleOpenReview}
            onHistory={handleBackToHistory}
          />
        );
      }
      return <ResultsPage studentId={user.studentId} freshAttemptId={freshAttemptId ?? undefined} onDetail={handleOpenResultDetail} />;
    }

    if (currentPage === "attendance") {
      return <AttendancePage studentId={user.studentId} />;
    }

    if (testDetailId !== null) {
      return <TestDetailPage testId={testDetailId} onBack={() => setTestDetailId(null)} onNavigate={handleNavigate} onBeginExam={handleBeginExam} />;
    }

    switch (currentPage) {
      case "dashboard": return <DashboardPage user={user} onNavigate={handleNavigate} />;
      case "courses":   return <CoursesPage />;
      case "tests":     return <TestsPage onNavigate={handleNavigate} onOpenTest={handleOpenTest} />;
      case "profile":   return <ProfilePage user={user} />;
    }
  };

  return (
    <DashboardLayout
      user={user}
      currentPage={testDetailId !== null ? "tests" : currentPage as Page}
      onNavigate={handleNavigate}
      onLogout={handleLogout}
      theme={theme}
      onToggleTheme={toggleTheme}
    >
      {renderPage()}
    </DashboardLayout>
  );
}
