// Shared result records and review question data

export interface ResultRecord {
  id: number;
  code: string;
  course: string;
  section: string;
  type: string;
  date: string;
  timeTaken: string;
  score: number;
  maxScore: number;
  correct: number;
  wrong: number;
  skipped: number;
  total: number;
  grade: string;
  percentile: number;
  passingScore: number;
}

export interface ReviewQuestion {
  id: number;
  text: string;
  options: string[];
  correctIndex: number;
  studentIndex: number | null;
}

export const RESULT_RECORDS: ResultRecord[] = [
  {
    id: 1, code: "CS-301", course: "Data Structures & Algorithms", section: "Mid-Semester",
    type: "Mid-Semester", date: "Sep 11, 2024", timeTaken: "82 min",
    score: 76, maxScore: 100, correct: 38, wrong: 8, skipped: 4, total: 50,
    grade: "A-", percentile: 87, passingScore: 40,
  },
  {
    id: 2, code: "CS-331", course: "Computer Networks", section: "Mid-Semester",
    type: "Mid-Semester", date: "Sep 3, 2024", timeTaken: "58 min",
    score: 72, maxScore: 100, correct: 38, wrong: 8, skipped: 4, total: 50,
    grade: "B+", percentile: 79, passingScore: 40,
  },
  {
    id: 3, code: "MA-201", course: "Discrete Mathematics", section: "Unit Test 2",
    type: "Unit Test", date: "Aug 28, 2024", timeTaken: "44 min",
    score: 82, maxScore: 100, correct: 41, wrong: 6, skipped: 3, total: 50,
    grade: "A", percentile: 92, passingScore: 40,
  },
  {
    id: 4, code: "CS-301", course: "Data Structures & Algorithms", section: "Quiz 1",
    type: "Quiz", date: "Aug 20, 2024", timeTaken: "28 min",
    score: 70, maxScore: 80, correct: 28, wrong: 9, skipped: 3, total: 40,
    grade: "B+", percentile: 74, passingScore: 32,
  },
  {
    id: 5, code: "CS-311", course: "Database Management Systems", section: "Unit Test 1",
    type: "Unit Test", date: "Jul 30, 2024", timeTaken: "38 min",
    score: 66, maxScore: 80, correct: 33, wrong: 5, skipped: 2, total: 40,
    grade: "A-", percentile: 81, passingScore: 32,
  },
  {
    id: 6, code: "CS-321", course: "Operating Systems", section: "Quiz 1",
    type: "Quiz", date: "Jul 22, 2024", timeTaken: "27 min",
    score: 44, maxScore: 60, correct: 22, wrong: 5, skipped: 3, total: 30,
    grade: "A", percentile: 88, passingScore: 24,
  },
];

// Representative question sets for answer review (6 per result)
export const REVIEW_DATA: Record<number, ReviewQuestion[]> = {
  1: [
    { id: 1, text: "Which data structure uses LIFO (Last In, First Out) ordering?", options: ["Queue", "Stack", "Deque", "Priority Queue"], correctIndex: 1, studentIndex: 1 },
    { id: 2, text: "What is the time complexity of binary search on a sorted array of n elements?", options: ["O(n)", "O(n^2)", "O(log n)", "O(n log n)"], correctIndex: 2, studentIndex: 2 },
    { id: 3, text: "Which traversal of a binary tree visits the root node last?", options: ["Pre-order", "In-order", "Post-order", "Level-order"], correctIndex: 2, studentIndex: 0 },
    { id: 4, text: "In a max-heap, the root node contains:", options: ["The minimum element", "The maximum element", "The median element", "An arbitrary element"], correctIndex: 1, studentIndex: 1 },
    { id: 5, text: "What is the worst-case time complexity of QuickSort?", options: ["O(n log n)", "O(n)", "O(n^2)", "O(log n)"], correctIndex: 2, studentIndex: null },
    { id: 6, text: "Which data structure is used in Breadth-First Search (BFS)?", options: ["Stack", "Queue", "Heap", "Graph"], correctIndex: 1, studentIndex: 1 },
    { id: 7, text: "The space complexity of Merge Sort is:", options: ["O(1)", "O(log n)", "O(n)", "O(n log n)"], correctIndex: 2, studentIndex: 3 },
    { id: 8, text: "Which operation on a stack views the top element without removing it?", options: ["Pop", "Push", "Peek", "Dequeue"], correctIndex: 2, studentIndex: 2 },
    { id: 9, text: "Dijkstra's algorithm is used to find:", options: ["Minimum spanning tree", "Shortest path in weighted graph", "Topological ordering", "Strongly connected components"], correctIndex: 1, studentIndex: 1 },
    { id: 10, text: "In-order traversal of a Binary Search Tree produces:", options: ["Random order", "Reverse sorted order", "Sorted ascending order", "Level-order"], correctIndex: 2, studentIndex: null },
  ],
  2: [
    { id: 1, text: "Which layer of the OSI model is responsible for end-to-end delivery?", options: ["Network", "Transport", "Session", "Application"], correctIndex: 1, studentIndex: 1 },
    { id: 2, text: "What does TCP stand for?", options: ["Transfer Control Protocol", "Transmission Control Protocol", "Transport Communication Protocol", "Terminal Control Protocol"], correctIndex: 1, studentIndex: 1 },
    { id: 3, text: "Which protocol operates at the application layer?", options: ["IP", "TCP", "HTTP", "ARP"], correctIndex: 2, studentIndex: 0 },
    { id: 4, text: "A subnet mask of 255.255.255.0 corresponds to which CIDR notation?", options: ["/16", "/20", "/24", "/32"], correctIndex: 2, studentIndex: 2 },
    { id: 5, text: "Which routing algorithm uses Bellman-Ford equations?", options: ["OSPF", "RIP", "BGP", "EIGRP"], correctIndex: 1, studentIndex: null },
    { id: 6, text: "What is the maximum segment size in TCP called?", options: ["MTU", "MSS", "MFS", "MPS"], correctIndex: 1, studentIndex: 1 },
  ],
  3: [
    { id: 1, text: "Which logical connective is represented by the symbol 'AND'?", options: ["Disjunction", "Conjunction", "Negation", "Implication"], correctIndex: 1, studentIndex: 1 },
    { id: 2, text: "How many edges does a complete graph K5 have?", options: ["5", "10", "15", "20"], correctIndex: 1, studentIndex: 1 },
    { id: 3, text: "The number of subsets of a set with n elements is:", options: ["n", "n^2", "2^n", "n!"], correctIndex: 2, studentIndex: 2 },
    { id: 4, text: "Which of the following is NOT a valid propositional logic tautology?", options: ["p OR NOT p", "p AND NOT p", "p IMPLIES p", "(p IMPLIES q) OR (q IMPLIES p)"], correctIndex: 1, studentIndex: 1 },
    { id: 5, text: "A graph with no cycles is called a:", options: ["Complete graph", "Bipartite graph", "Tree", "Planar graph"], correctIndex: 2, studentIndex: 2 },
    { id: 6, text: "The principle of mathematical induction requires proving:", options: ["Base case only", "Inductive step only", "Base case and inductive step", "Contrapositive"], correctIndex: 2, studentIndex: 0 },
  ],
  4: [
    { id: 1, text: "What is the time complexity of inserting into a sorted linked list?", options: ["O(1)", "O(log n)", "O(n)", "O(n log n)"], correctIndex: 2, studentIndex: 2 },
    { id: 2, text: "Which traversal visits left subtree, root, then right subtree?", options: ["Pre-order", "In-order", "Post-order", "Level-order"], correctIndex: 1, studentIndex: 1 },
    { id: 3, text: "What is the average-case complexity of QuickSort?", options: ["O(n)", "O(n log n)", "O(n^2)", "O(log n)"], correctIndex: 1, studentIndex: 1 },
    { id: 4, text: "A queue implemented with two stacks has what amortized complexity for enqueue?", options: ["O(1)", "O(log n)", "O(n)", "O(n^2)"], correctIndex: 0, studentIndex: 2 },
    { id: 5, text: "Which data structure supports O(1) average-case lookups?", options: ["Linked List", "AVL Tree", "Hash Table", "B-Tree"], correctIndex: 2, studentIndex: 2 },
    { id: 6, text: "The height of a complete binary tree with n nodes is:", options: ["n", "n/2", "floor(log2(n))", "ceil(sqrt(n))"], correctIndex: 2, studentIndex: null },
  ],
  5: [
    { id: 1, text: "What does ACID stand for in database systems?", options: ["Access, Consistency, Isolation, Durability", "Atomicity, Consistency, Isolation, Durability", "Atomicity, Concurrency, Integrity, Durability", "Access, Concurrency, Isolation, Data"], correctIndex: 1, studentIndex: 1 },
    { id: 2, text: "Which normal form eliminates partial dependencies?", options: ["1NF", "2NF", "3NF", "BCNF"], correctIndex: 1, studentIndex: 1 },
    { id: 3, text: "In SQL, which clause is used to filter groups?", options: ["WHERE", "GROUP BY", "HAVING", "ORDER BY"], correctIndex: 2, studentIndex: 2 },
    { id: 4, text: "A foreign key constraint ensures:", options: ["Uniqueness", "Referential integrity", "Domain constraints", "Entity integrity"], correctIndex: 1, studentIndex: 1 },
    { id: 5, text: "Which join returns all rows from both tables regardless of match?", options: ["INNER JOIN", "LEFT JOIN", "RIGHT JOIN", "FULL OUTER JOIN"], correctIndex: 3, studentIndex: 3 },
    { id: 6, text: "What is a deadlock in database transactions?", options: ["A slow query", "Two transactions waiting on each other", "A corrupted index", "An uncommitted transaction"], correctIndex: 1, studentIndex: 1 },
  ],
  6: [
    { id: 1, text: "Which scheduling algorithm can cause starvation?", options: ["Round Robin", "FCFS", "Priority Scheduling", "SRTF"], correctIndex: 2, studentIndex: 2 },
    { id: 2, text: "What is the purpose of a page table?", options: ["Track disk sectors", "Map virtual to physical addresses", "Manage CPU registers", "Handle I/O requests"], correctIndex: 1, studentIndex: 1 },
    { id: 3, text: "Which memory allocation strategy minimizes external fragmentation?", options: ["First Fit", "Best Fit", "Worst Fit", "Compaction"], correctIndex: 3, studentIndex: 1 },
    { id: 4, text: "A semaphore with value 0 means:", options: ["Resource is available", "Resource is not available", "Deadlock has occurred", "Process is blocked"], correctIndex: 1, studentIndex: 1 },
    { id: 5, text: "In virtual memory, a page fault occurs when:", options: ["A page is corrupted", "A page is not in main memory", "Too many pages are loaded", "The TLB overflows"], correctIndex: 1, studentIndex: 1 },
    { id: 6, text: "Which disk scheduling algorithm services requests in order of arrival?", options: ["SSTF", "SCAN", "C-SCAN", "FCFS"], correctIndex: 3, studentIndex: null },
  ],
};

export function gradeColor(grade: string): string {
  if (grade.startsWith("A")) return "var(--color-success)";
  if (grade.startsWith("B")) return "var(--color-accent)";
  return "var(--color-warning)";
}

export function scorePct(r: ResultRecord): number {
  return Math.round((r.score / r.maxScore) * 100);
}

export function isPassed(r: ResultRecord): boolean {
  return r.score >= r.passingScore;
}
