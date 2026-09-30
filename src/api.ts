// ShikshaPortal API client
// Connects to the Express/MongoDB backend when available.
// All calls fail gracefully — callers catch errors and fall back to localStorage store.

const BASE = (import.meta.env.VITE_API_URL as string | undefined) || "/api";

// ── Token storage ─────────────────────────────────────────────────────────────

export function getToken(): string | null {
  try { return localStorage.getItem("sk-jwt"); } catch { return null; }
}
function saveToken(t: string) {
  try { localStorage.setItem("sk-jwt", t); } catch { /* ignore */ }
}
export function clearToken() {
  try { localStorage.removeItem("sk-jwt"); } catch { /* ignore */ }
}

// ── Core fetch wrapper ────────────────────────────────────────────────────────

async function req<T>(path: string, init?: RequestInit): Promise<T> {
  const token = getToken();
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init?.headers ?? {}),
    },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error((body as { message?: string }).message || `HTTP ${res.status}`);
  }
  return res.json() as Promise<T>;
}

// ── Types ─────────────────────────────────────────────────────────────────────

export interface ApiUser {
  _id: string;
  name: string;
  email: string;
  role: "student" | "teacher";
  studentId?: string;
  department?: string;
  semester?: number;
  employeeId?: string;
  subjects?: string[];
}

export interface AuthResponse {
  token: string;
  user: ApiUser;
}

export interface ApiQuestion {
  _id: string;
  questionText: string;
  options: string[];
  subject: string;
  topic?: string;
  difficulty: "easy" | "medium" | "hard";
}

export interface ApiTest {
  _id: string;
  title: string;
  subject: string;
  questions: ApiQuestion[];
  durationMinutes: number;
  startTime: string;
  endTime: string;
  negativeMarking: boolean;
  negativeMarkValue: number;
  isPublished: boolean;
  totalMarks: number;
}

export interface SubmitAnswerPayload {
  questionId: string;
  selectedOptionIndex: number | null;
}

export interface ApiResult {
  _id: string;
  student: { _id: string; name: string; email: string; studentId?: string };
  test: { _id: string; title: string; subject: string; durationMinutes: number };
  score: number;
  totalMarks: number;
  correctCount: number;
  incorrectCount: number;
  skippedCount: number;
  answers: Array<{ question: string; selectedOptionIndex: number | null; isCorrect: boolean }>;
  flagEvents: Array<{ type: string; timestamp: string }>;
  status: "completed" | "auto_submitted";
  submittedAt: string;
}

// ── API surface ───────────────────────────────────────────────────────────────

export const api = {
  auth: {
    register: async (data: {
      name: string;
      email: string;
      password: string;
      role: "student" | "teacher";
      studentId?: string;
      department?: string;
      semester?: number;
    }): Promise<AuthResponse> => {
      const r = await req<AuthResponse>("/auth/register", {
        method: "POST",
        body: JSON.stringify(data),
      });
      saveToken(r.token);
      return r;
    },

    login: async (email: string, password: string): Promise<AuthResponse> => {
      const r = await req<AuthResponse>("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
      saveToken(r.token);
      return r;
    },

    me: (): Promise<ApiUser> => req<ApiUser>("/auth/me"),

    logout: () => { clearToken(); },
  },

  tests: {
    available: (): Promise<ApiTest[]> => req<ApiTest[]>("/tests/available"),
    forAttempt: (id: string): Promise<ApiTest> => req<ApiTest>(`/tests/${id}/attempt`),
  },

  results: {
    submit: (data: {
      testId: string;
      answers: SubmitAnswerPayload[];
      flagEvents?: Array<{ type: string; timestamp: string }>;
    }): Promise<ApiResult> =>
      req<ApiResult>("/results/submit", { method: "POST", body: JSON.stringify(data) }),

    mine: (): Promise<ApiResult[]> => req<ApiResult[]>("/results/mine"),

    detail: (id: string): Promise<ApiResult> => req<ApiResult>(`/results/${id}`),
  },
};

// ── Health check ──────────────────────────────────────────────────────────────

export async function checkBackendHealth(): Promise<boolean> {
  try {
    const r = await fetch(`${BASE}/health`, { signal: AbortSignal.timeout(3000) });
    return r.ok;
  } catch {
    return false;
  }
}
