# ShikshaPortal

Student registration and assessment portal built with React, Vite, TypeScript, and Supabase. Supabase is the current authentication and cloud-data backend; the previous Express/MongoDB implementation has been removed.

## Supabase setup

1. Create a Supabase project and copy its project URL and **publishable** key.
2. Copy `.env.example` to `.env.local` and fill in `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY`.
3. In Supabase SQL Editor, run the migrations in order: `202609300001_initial_portal.sql`, `202609300002_faculty_accounts.sql`, `202609300003_faculty_self_registration.sql`, `202609300004_faculty_immediate_activation.sql`, `202609300005_fix_faculty_signup.sql`, then `202609300006_computer_engineering_subjects.sql`. Migration 0005 repairs the Auth trigger and faculty table if earlier faculty migrations were only partly applied. Migration 0006 seeds the AY 2025-26 VIT Pune Computer Engineering subjects used by attendance and test scheduling.
4. In Supabase Auth settings, turn **Confirm email off** under **Authentication → Sign In / Providers → Email** for this classroom demo. This allows immediate registration and sign-in without sending verification email. Set the site's URL plus local/deployed redirect URLs as well.
5. Register a student from the Student tab. Supabase Auth creates the login, the database trigger saves the student profile, and the app signs the student in immediately. No SMTP setup is needed for signup/sign-in in this mode. Password-reset emails still need an email provider.
6. Faculty can create an account from the Faculty / Admin tab. Their account is saved immediately with role `faculty` and mirrored into `public.faculty_accounts`; they can sign in without a separate SQL approval. Admin accounts remain provisioned by the project owner and cannot be created through public signup.
7. Start the app with `pnpm dev` after the Supabase settings and SQL migration are in place.

The browser app uses only the publishable key. Never put a Supabase secret/service-role key in a `VITE_` variable or browser code. Data access is restricted with Row Level Security policies in the migration.

## What currently uses Supabase

- Supabase Auth now handles student/faculty/admin sign-in, student registration, session restoration, and password-reset email. Roles are read from `profiles`; the role selector does not grant access.
- Student accounts use the VIT PRN email format. Faculty sign-up collects a name, VIT email, department, and student-style password, then signs the user in immediately when email confirmation is disabled. Faculty sign-in checks that the matching faculty record exists and is active. Faculty password requirements match students: at least 8 characters, with a letter and a number. This immediate-access flow is for demonstration; without email confirmation, the app cannot prove the person owns the entered VIT address.
- Faculty's student directory and dashboard count read registered student profiles from `profiles`. The directory shows PRN, department, and semester.
- Faculty attendance reads registered students and seeded Computer Engineering subjects, then saves marks to `attendance`. Run migration `202609300006_computer_engineering_subjects.sql` before using attendance.
- `profiles`, `subjects`, `enrollments`, `tests`, `test_questions`, `attempts`, `attempt_answers`, and `attendance` have a cloud schema with validation and RLS. Subject code/name, semester, credits, test windows, and question structure have database constraints.

## Remaining demo/local areas

- Student course and test lists, faculty test/course management, student results, exam attempts, and the student's attendance view still use local demo data/state. Newly created faculty tests are currently drafts in page state and do not persist after reload.
- The client-side demo exam bank contains answer keys. Replace it with server-side/RPC scoring before using exams with real students. Do not treat demo scores, enrollment counts, or security warnings as official records.
- Profile/contact display preferences and theme settings remain browser-local.

Next, connect course enrollment, tests, scoring, result history, and the student attendance view to Supabase. Use trusted database functions for test availability, one-attempt rules, scoring, and answer-key secrecy; show student-specific records under RLS.
