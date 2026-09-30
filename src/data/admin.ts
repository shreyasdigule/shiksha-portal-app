// Admin mock data — ASCII only in all string literals

export interface AdminStudent {
  id: string;
  name: string;
  email: string;
  dept: string;
  semester: number;
  credits: number;
  gpa: string;
  status: "active" | "suspended" | "graduated";
  enrolled: number;
  joined: string;
}

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

export interface AdminResult {
  id: number;
  studentId: string;
  studentName: string;
  courseCode: string;
  testTitle: string;
  type: string;
  score: number;
  maxScore: number;
  grade: string;
  date: string;
  timeTaken: string;
}

export const ADMIN_STUDENTS: AdminStudent[] = [
  { id: "STU-2024-00847", name: "Arjun Mehta", email: "arjun.mehta@university.edu", dept: "CSE", semester: 6, credits: 20, gpa: "3.7", status: "active", enrolled: 5, joined: "Aug 2022" },
  { id: "STU-2024-01203", name: "Priya Sharma", email: "priya.sharma@university.edu", dept: "CSE", semester: 6, credits: 22, gpa: "3.9", status: "active", enrolled: 6, joined: "Aug 2022" },
  { id: "STU-2024-00512", name: "Rahul Verma", email: "rahul.verma@university.edu", dept: "ECE", semester: 4, credits: 18, gpa: "3.2", status: "active", enrolled: 4, joined: "Aug 2023" },
  { id: "STU-2024-00934", name: "Sneha Nair", email: "sneha.nair@university.edu", dept: "CSE", semester: 8, credits: 24, gpa: "3.8", status: "active", enrolled: 6, joined: "Aug 2021" },
  { id: "STU-2024-01567", name: "Aditya Rao", email: "aditya.rao@university.edu", dept: "ME", semester: 2, credits: 16, gpa: "2.9", status: "active", enrolled: 4, joined: "Aug 2024" },
  { id: "STU-2024-00289", name: "Kavya Reddy", email: "kavya.reddy@university.edu", dept: "CSE", semester: 6, credits: 20, gpa: "3.5", status: "suspended", enrolled: 0, joined: "Aug 2022" },
  { id: "STU-2024-01891", name: "Vikram Singh", email: "vikram.singh@university.edu", dept: "IT", semester: 4, credits: 20, gpa: "3.6", status: "active", enrolled: 5, joined: "Aug 2023" },
  { id: "STU-2024-00104", name: "Ananya Das", email: "ananya.das@university.edu", dept: "CSE", semester: 8, credits: 24, gpa: "4.0", status: "graduated", enrolled: 0, joined: "Aug 2021" },
  { id: "STU-2024-02145", name: "Rohan Joshi", email: "rohan.joshi@university.edu", dept: "ECE", semester: 2, credits: 14, gpa: "3.1", status: "active", enrolled: 3, joined: "Aug 2024" },
  { id: "STU-2024-00763", name: "Meera Krishnan", email: "meera.krishnan@university.edu", dept: "CSE", semester: 6, credits: 22, gpa: "3.8", status: "active", enrolled: 5, joined: "Aug 2022" },
];

export const ADMIN_COURSES: AdminCourse[] = [
  { id: 1, code: "CS-301", title: "Data Structures & Algorithms", dept: "CSE", credits: 4, instructor: "Dr. Anand Kumar", enrolled: 89, capacity: 100, status: "active", semester: "Fall 2024" },
  { id: 2, code: "CS-311", title: "Database Management Systems", dept: "CSE", credits: 4, instructor: "Prof. Rekha Srinivas", enrolled: 74, capacity: 80, status: "active", semester: "Fall 2024" },
  { id: 3, code: "CS-321", title: "Operating Systems", dept: "CSE", credits: 4, instructor: "Dr. Suresh Pillai", enrolled: 82, capacity: 90, status: "active", semester: "Fall 2024" },
  { id: 4, code: "CS-331", title: "Computer Networks", dept: "CSE", credits: 4, instructor: "Prof. Lakshmi Rajan", enrolled: 68, capacity: 80, status: "active", semester: "Fall 2024" },
  { id: 5, code: "MA-201", title: "Discrete Mathematics", dept: "Math", credits: 3, instructor: "Dr. Pradeep Nambiar", enrolled: 120, capacity: 150, status: "active", semester: "Fall 2024" },
  { id: 6, code: "CS-401", title: "Machine Learning Fundamentals", dept: "CSE", credits: 4, instructor: "Dr. Deepa Mehrotra", enrolled: 0, capacity: 60, status: "draft", semester: "Spring 2025" },
  { id: 7, code: "CS-212", title: "Object-Oriented Programming", dept: "CSE", credits: 3, instructor: "Prof. Ganesh Iyer", enrolled: 110, capacity: 120, status: "archived", semester: "Spring 2024" },
];

export const ADMIN_TESTS: AdminTest[] = [
  { id: 1, code: "CS301-MID", title: "Data Structures & Algorithms", courseCode: "CS-301", type: "Mid-Semester", date: "Sep 15, 2024", time: "10:00 AM", duration: "90 min", questions: 50, totalMarks: 100, registered: 89, attempted: 0, status: "active" },
  { id: 2, code: "CS311-UT1", title: "Database Management Systems", courseCode: "CS-311", type: "Unit Test", date: "Sep 20, 2024", time: "2:00 PM", duration: "60 min", questions: 40, totalMarks: 80, registered: 74, attempted: 0, status: "upcoming" },
  { id: 3, code: "CS321-Q2", title: "Operating Systems", courseCode: "CS-321", type: "Quiz", date: "Sep 25, 2024", time: "11:30 AM", duration: "30 min", questions: 20, totalMarks: 40, registered: 82, attempted: 0, status: "upcoming" },
  { id: 4, code: "CS331-MID", title: "Computer Networks", courseCode: "CS-331", type: "Mid-Semester", date: "Sep 3, 2024", time: "9:00 AM", duration: "90 min", questions: 50, totalMarks: 100, registered: 68, attempted: 64, status: "completed" },
  { id: 5, code: "MA201-UT2", title: "Discrete Mathematics", courseCode: "MA-201", type: "Unit Test", date: "Aug 28, 2024", time: "3:00 PM", duration: "60 min", questions: 40, totalMarks: 80, registered: 120, attempted: 118, status: "completed" },
  { id: 6, code: "CS301-Q1", title: "Data Structures & Algorithms", courseCode: "CS-301", type: "Quiz", date: "Aug 20, 2024", time: "10:00 AM", duration: "30 min", questions: 25, totalMarks: 50, registered: 88, attempted: 87, status: "completed" },
  { id: 7, code: "CS401-MID", title: "Machine Learning Fundamentals", courseCode: "CS-401", type: "Mid-Semester", date: "Oct 10, 2024", time: "10:00 AM", duration: "90 min", questions: 50, totalMarks: 100, registered: 0, attempted: 0, status: "draft" },
];

export const ADMIN_RESULTS: AdminResult[] = [
  { id: 1, studentId: "STU-2024-00847", studentName: "Arjun Mehta", courseCode: "CS-301", testTitle: "Data Structures Mid-Semester", type: "Mid-Semester", score: 76, maxScore: 100, grade: "A-", date: "Sep 11, 2024", timeTaken: "82 min" },
  { id: 2, studentId: "STU-2024-01203", studentName: "Priya Sharma", courseCode: "CS-301", testTitle: "Data Structures Mid-Semester", type: "Mid-Semester", score: 91, maxScore: 100, grade: "A+", date: "Sep 11, 2024", timeTaken: "79 min" },
  { id: 3, studentId: "STU-2024-00847", studentName: "Arjun Mehta", courseCode: "CS-331", testTitle: "Computer Networks Mid-Semester", type: "Mid-Semester", score: 72, maxScore: 100, grade: "B+", date: "Sep 3, 2024", timeTaken: "58 min" },
  { id: 4, studentId: "STU-2024-01203", studentName: "Priya Sharma", courseCode: "CS-331", testTitle: "Computer Networks Mid-Semester", type: "Mid-Semester", score: 85, maxScore: 100, grade: "A", date: "Sep 3, 2024", timeTaken: "70 min" },
  { id: 5, studentId: "STU-2024-00512", studentName: "Rahul Verma", courseCode: "MA-201", testTitle: "Discrete Math Unit Test 2", type: "Unit Test", score: 65, maxScore: 80, grade: "B", date: "Aug 28, 2024", timeTaken: "55 min" },
  { id: 6, studentId: "STU-2024-00934", studentName: "Sneha Nair", courseCode: "MA-201", testTitle: "Discrete Math Unit Test 2", type: "Unit Test", score: 78, maxScore: 80, grade: "A+", date: "Aug 28, 2024", timeTaken: "44 min" },
  { id: 7, studentId: "STU-2024-00847", studentName: "Arjun Mehta", courseCode: "MA-201", testTitle: "Discrete Math Unit Test 2", type: "Unit Test", score: 82, maxScore: 100, grade: "A", date: "Aug 28, 2024", timeTaken: "44 min" },
  { id: 8, studentId: "STU-2024-00763", studentName: "Meera Krishnan", courseCode: "CS-301", testTitle: "DSA Quiz 1", type: "Quiz", score: 44, maxScore: 50, grade: "A-", date: "Aug 20, 2024", timeTaken: "25 min" },
  { id: 9, studentId: "STU-2024-01891", studentName: "Vikram Singh", courseCode: "CS-331", testTitle: "Computer Networks Mid-Semester", type: "Mid-Semester", score: 58, maxScore: 100, grade: "C+", date: "Sep 3, 2024", timeTaken: "88 min" },
  { id: 10, studentId: "STU-2024-02145", studentName: "Rohan Joshi", courseCode: "MA-201", testTitle: "Discrete Math Unit Test 2", type: "Unit Test", score: 52, maxScore: 80, grade: "B-", date: "Aug 28, 2024", timeTaken: "60 min" },
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
