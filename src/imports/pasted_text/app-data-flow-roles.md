Continue modifying the EXISTING application. Do not redesign it from scratch and do not replace the current visual system. Keep the existing professional dark high-contrast theme, navigation, components, secure examination interface and overall layout.

This update is primarily about DATA FLOW and ROLE-BASED ACCESS. The frontend must stop behaving like a prototype with randomly generated placeholder users, scores and attendance.

IMPORTANT PRINCIPLE:
Only display data that actually exists from a real user action or backend record. Do NOT generate random students, random scores, fake attendance percentages, fake test results, or demo records in the application's functional views.

### 1. REAL STUDENT REGISTRATION

When a student creates/registers their account using the registration form:

* Actually create/store the student through the existing backend integration
* Record the submitted student details
* The registration should appear in the application's relevant logs/history
* The newly registered student must become visible to Faculty
* Faculty should only see students who have actually registered themselves
* Remove all randomly generated/demo students from the student list

If there are zero registered students, show a proper empty state such as "No students have registered yet" rather than inventing records.

### 2. FACULTY STUDENT VIEW

Faculty must NOT have an "Add Student" button or ability to manually create students.

Faculty can only:

* View students who actually registered themselves
* Search/filter registered students
* Open/view their actual submitted details
* See registration-related information that genuinely exists

Remove any faculty functionality that creates students.

### 3. REAL TEST → REAL SCORE FLOW

Fix the current test/results behavior.

When a student actually completes an MCQ test:

* Record the student's selected answers
* Submit the answers to the existing backend
* Calculate/use the actual score returned by the backend
* Store/link the completed attempt to the authenticated student and specific test
* The result must appear in the student's Results/Scores section
* Opening that result must show the actual score from that attempt
* Do NOT generate random placeholder scores or fake performance analysis

The Results page must initially show an appropriate empty state if the student has never completed a test.

The flow must be:

Student → Start Test → Answer Questions → Submit → Actual Evaluation → Actual Result → Results/Score History

Do not create fake result data simply to populate the UI.

### 4. REAL ANSWER REVIEW

After submission, the answer-review page must use the student's actual submitted answers and the actual correct answers/evaluation data returned by the backend.

Show:

* Actual selected answer
* Actual correct answer where available
* Actual correct/incorrect state
* Actual score
* Actual question statistics

If the backend does not provide a particular piece of information, do not invent it. Show an appropriate unavailable state.

### 5. ATTENDANCE — STUDENT

Add an Attendance section to the Student side.

Attendance must be based ONLY on attendance actually marked by Faculty.

Display attendance day-by-day, for example:

* Date
* Course/subject
* Attendance status
* Present/Absent where recorded

Do NOT display a generated percentage or fake attendance history.

If no faculty attendance has been marked yet, show:
"No attendance records available yet."

Any summary percentage must be calculated from actual attendance records only.

### 6. ATTENDANCE — FACULTY

Add an Attendance section to the Faculty side.

Faculty should be able to:

* Select an appropriate course/class
* View the relevant registered students
* Mark attendance for the actual date
* Save the attendance record

Only attendance explicitly marked and saved by Faculty should become visible to students.

Faculty should also be able to view previously recorded attendance by date.

Do NOT pre-populate attendance.

### 7. ROLE SEPARATION

Maintain strict separation between Student and Faculty experiences.

STUDENT:

* Register themselves
* View their own profile
* View their own tests
* Take tests
* View their own actual results
* View their own actual attendance

FACULTY:

* View actually registered students
* View relevant student information
* Manage/mark attendance
* View attendance records
* Access relevant academic/test information

Faculty must NOT create student accounts.

### 8. REMOVE MOCK DATA

Audit the entire application and remove any hardcoded/random:

* Student accounts
* Student lists
* Test scores
* Result records
* Attendance records
* Performance statistics

Replace these with backend-driven data states.

Use realistic loading, empty, error and success states instead of fake data.

IMPORTANT: This is a functional frontend connected to an existing backend, not a static UI demonstration. Preserve the current design while fixing the data relationships and role permissions. Do not invent backend behavior that is not available; use the existing backend/API integration wherever it already exists.
