import { useState, useEffect } from "react";
import LoginPage from "./pages/LoginPage";
import type { LoginInfo } from "./pages/LoginPage";
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
import type { AdminPage } from "./data/admin";
import { upsertStudent } from "./store";
import { api, clearToken } from "./api";

export type Page = "dashboard" | "courses" | "tests" | "results" | "attendance" | "profile";

export interface User {
  name: string;
  email: string;
  studentId: string;
  department: string;
  semester: number;
  avatar: string;
}

const DEFAULT_USER: User = {
  name: "Student",
  email: "student@vit.edu",
  studentId: "VIT-0000000000",
  department: "Computer Science & Engineering",
  semester: 6,
  avatar: "ST",
};

export default function App() {
  const [authRole, setAuthRole] = useState<"student" | "admin" | null>(null);
  const [user, setUser] = useState<User>(DEFAULT_USER);
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
  const handleLogin = async (role: "student" | "admin", info?: LoginInfo) => {
    if (role === "student" && info) {
      const u: User = {
        name: info.displayName,
        email: info.email,
        studentId: info.studentId,
        department: "Computer Science & Engineering",
        semester: 6,
        avatar: info.displayName.slice(0, 2).toUpperCase(),
      };
      setUser(u);
      // Try real backend registration/login; fall back to localStorage store
      try {
        await api.auth.register({
          name: info.name,
          email: info.email,
          password: info.studentId, // use studentId as default password
          role: "student",
          studentId: info.studentId,
          department: u.department,
          semester: u.semester,
        });
      } catch {
        // Already registered or backend unavailable — try login
        try {
          await api.auth.login(info.email, info.studentId);
        } catch {
          // Backend unavailable — continue with localStorage only
        }
      }
      upsertStudent({
        studentId: info.studentId,
        name: info.name,
        displayName: info.displayName,
        email: info.email,
        registeredAt: new Date().toISOString(),
        department: u.department,
        semester: u.semester,
      });
    }
    setAuthRole(role);
  };

  const handleLogout = () => {
    clearToken();
    setAuthRole(null);
    setUser(DEFAULT_USER);
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
  if (!authRole) {
    return <LoginPage onLogin={handleLogin} theme={theme} onToggleTheme={toggleTheme} />;
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
