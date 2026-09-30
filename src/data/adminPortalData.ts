// Faculty portal types, VIT Computer Engineering catalog, and demo assessments.

export interface AdminCourse {
  id: number;
  code: string;
  title: string;
  dept: string;
  credits: number;
  instructor: string;
  enrolled: number;
  capacity: number;
  status: "active" | "archived" | "draft";
  semester: string;
}

export interface AdminTest {
  id: number;
  code: string;
  title: string;
  courseCode: string;
  type: string;
  date: string;
  time: string;
  duration: string;
  questions: number;
  totalMarks: number;
  registered: number;
  attempted: number;
  status: "active" | "upcoming" | "completed" | "draft";
}

export const ADMIN_COURSES: AdminCourse[] = [
  { id: 1, code: "CS2305", title: "Data Structures-I", dept: "Computer Engineering", credits: 3, instructor: "Computer Engineering Faculty", enrolled: 0, capacity: 60, status: "active", semester: "Semester III · AY 2025-26" },
  { id: 2, code: "CS2302", title: "Logic Design and Microprocessor", dept: "Computer Engineering", credits: 3, instructor: "Computer Engineering Faculty", enrolled: 0, capacity: 60, status: "active", semester: "Semester III · AY 2025-26" },
  { id: 3, code: "CS2303", title: "Object Oriented Programming", dept: "Computer Engineering", credits: 3, instructor: "Computer Engineering Faculty", enrolled: 0, capacity: 60, status: "active", semester: "Semester III · AY 2025-26" },
  { id: 4, code: "CS2304", title: "Database Management System", dept: "Computer Engineering", credits: 3, instructor: "Computer Engineering Faculty", enrolled: 0, capacity: 60, status: "active", semester: "Semester III · AY 2025-26" },
  { id: 5, code: "CS2308", title: "Data Structures-II", dept: "Computer Engineering", credits: 3, instructor: "Computer Engineering Faculty", enrolled: 0, capacity: 60, status: "active", semester: "Semester IV · AY 2025-26" },
  { id: 6, code: "CS2309", title: "Theory of Computation", dept: "Computer Engineering", credits: 2, instructor: "Computer Engineering Faculty", enrolled: 0, capacity: 60, status: "active", semester: "Semester IV · AY 2025-26" },
  { id: 7, code: "CS2310", title: "Operating System", dept: "Computer Engineering", credits: 3, instructor: "Computer Engineering Faculty", enrolled: 0, capacity: 60, status: "active", semester: "Semester IV · AY 2025-26" },
  { id: 8, code: "CS2311", title: "Software Engineering", dept: "Computer Engineering", credits: 3, instructor: "Computer Engineering Faculty", enrolled: 0, capacity: 60, status: "active", semester: "Semester IV · AY 2025-26" },
];

export const ADMIN_TESTS: AdminTest[] = [
  { id: 1, code: "CS2305-MID", title: "Data Structures-I", courseCode: "CS2305", type: "Mid-Semester", date: "Oct 15, 2025", time: "10:00 AM", duration: "90 min", questions: 30, totalMarks: 60, registered: 0, attempted: 0, status: "active" },
  { id: 2, code: "CS2304-UT1", title: "Database Management System", courseCode: "CS2304", type: "Unit Test", date: "Oct 20, 2025", time: "2:00 PM", duration: "60 min", questions: 20, totalMarks: 40, registered: 0, attempted: 0, status: "upcoming" },
  { id: 3, code: "CS2310-Q1", title: "Operating System", courseCode: "CS2310", type: "Quiz", date: "Oct 25, 2025", time: "11:30 AM", duration: "30 min", questions: 10, totalMarks: 20, registered: 0, attempted: 0, status: "upcoming" },
  { id: 4, code: "CS2303-MID", title: "Object Oriented Programming", courseCode: "CS2303", type: "Mid-Semester", date: "Oct 3, 2025", time: "9:00 AM", duration: "90 min", questions: 30, totalMarks: 60, registered: 0, attempted: 0, status: "completed" },
  { id: 5, code: "CS2308-UT1", title: "Data Structures-II", courseCode: "CS2308", type: "Unit Test", date: "Oct 28, 2025", time: "3:00 PM", duration: "60 min", questions: 20, totalMarks: 40, registered: 0, attempted: 0, status: "completed" },
  { id: 6, code: "CS2305-Q1", title: "Data Structures-I", courseCode: "CS2305", type: "Quiz", date: "Sep 20, 2025", time: "10:00 AM", duration: "30 min", questions: 10, totalMarks: 20, registered: 0, attempted: 0, status: "completed" },
  { id: 7, code: "CS2311-MID", title: "Software Engineering", courseCode: "CS2311", type: "Mid-Semester", date: "Nov 10, 2025", time: "10:00 AM", duration: "90 min", questions: 30, totalMarks: 60, registered: 0, attempted: 0, status: "draft" },
];

export type AdminPage = "overview" | "students" | "courses" | "tests" | "results" | "attendance" | "settings";

export function adminGradeColor(grade: string): string {
  if (grade.startsWith("A")) return "var(--color-success)";
  if (grade.startsWith("B")) return "var(--color-accent)";
  return "var(--color-warning)";
}

export function adminScorePct(score: number, max: number): number {
  return Math.round((score / max) * 100);
}
