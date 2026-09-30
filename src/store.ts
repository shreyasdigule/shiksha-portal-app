// Application data store backed by localStorage.
// This acts as the data layer in lieu of a backend API.

export interface StoredStudent {
  studentId: string;
  name: string;
  displayName: string;
  email: string;
  registeredAt: string;
  department: string;
  semester: number;
}

export interface AttemptAnswer {
  questionId: number;
  questionText: string;
  options: string[];
  selectedOption: number | null;
  correctOption: number;
  marksPerQuestion: number;
}

export interface TestAttempt {
  id: string;
  studentId: string;
  studentName: string;
  testId: number;
  testCode: string;
  testTitle: string;
  courseCode: string;
  submittedAt: string;
  durationSeconds: number;
  answers: AttemptAnswer[];
  score: number;
  maxScore: number;
  grade: string;
  securityEventCount: number;
}

export interface AttendanceRecord {
  id: string;
  date: string;
  courseCode: string;
  courseTitle: string;
  studentId: string;
  status: "present" | "absent";
  markedAt: string;
}

const K_STUDENTS = "vitexam-students";
const K_ATTEMPTS = "vitexam-attempts";
const K_ATTENDANCE = "vitexam-attendance";

function load<T>(key: string, fallback: T): T {
  try { const r = localStorage.getItem(key); return r ? JSON.parse(r) : fallback; } catch { return fallback; }
}
function persist(key: string, value: unknown): void {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* ignore */ }
}

// ── Students ──────────────────────────────────────────────────────────────────

export function getStudents(): StoredStudent[] {
  return load<StoredStudent[]>(K_STUDENTS, []);
}

export function upsertStudent(student: StoredStudent): void {
  const list = getStudents();
  const idx = list.findIndex((s) => s.studentId === student.studentId);
  if (idx >= 0) { list[idx] = student; } else { list.push(student); }
  persist(K_STUDENTS, list);
}

// ── Exam attempts ─────────────────────────────────────────────────────────────

export function getAttempts(): TestAttempt[] {
  return load<TestAttempt[]>(K_ATTEMPTS, []);
}

export function getAttemptById(id: string): TestAttempt | undefined {
  return getAttempts().find((a) => a.id === id);
}

export function getMyAttempts(studentId: string): TestAttempt[] {
  return getAttempts().filter((a) => a.studentId === studentId);
}

export function saveAttempt(attempt: TestAttempt): void {
  const list = getAttempts();
  list.push(attempt);
  persist(K_ATTEMPTS, list);
}

// ── Attendance ────────────────────────────────────────────────────────────────

export function getAttendance(): AttendanceRecord[] {
  return load<AttendanceRecord[]>(K_ATTENDANCE, []);
}

export function getMyAttendance(studentId: string): AttendanceRecord[] {
  return getAttendance().filter((r) => r.studentId === studentId);
}

export function mergeAttendanceRecords(incoming: AttendanceRecord[]): void {
  const existing = getAttendance();
  for (const r of incoming) {
    const idx = existing.findIndex(
      (e) => e.date === r.date && e.courseCode === r.courseCode && e.studentId === r.studentId
    );
    if (idx >= 0) { existing[idx] = r; } else { existing.push(r); }
  }
  persist(K_ATTENDANCE, existing);
}

// ── Helpers ───────────────────────────────────────────────────────────────────

export function calcGrade(pct: number): string {
  if (pct >= 90) return "O";
  if (pct >= 80) return "A+";
  if (pct >= 70) return "A";
  if (pct >= 60) return "A-";
  if (pct >= 50) return "B+";
  if (pct >= 40) return "B";
  return "F";
}

export function gradeColor(grade: string): string {
  if (grade === "O" || grade === "A+" || grade === "A") return "var(--color-success)";
  if (grade === "A-" || grade === "B+" || grade === "B") return "var(--color-accent)";
  return "var(--color-warning)";
}

export function isPassed(grade: string): boolean {
  return grade !== "F";
}

export function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m} min${s > 0 ? " " + s + " sec" : ""}`;
}
