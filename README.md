# ShikshaPortal

ShikshaPortal is a student registration and assessment portal for students and faculty. Students can register and sign in, view a dashboard, courses, tests, results, attendance, and their profile. Faculty/admin pages provide a student directory and attendance management. Authentication and selected student/faculty records are backed by Supabase; several course, test, and exam workflows are still demo-only (see [Current scope](#current-scope)).

The frontend is built with React 19, TypeScript, Vite, and Tailwind CSS 4. Supabase provides authentication and cloud data. The old Express/MongoDB backend is no longer part of this project.

## Run locally

### Prerequisites

- Node.js 22 or newer
- [pnpm](https://pnpm.io/installation) 10 or newer (the project includes `pnpm-lock.yaml`)
- A [Supabase](https://supabase.com/) project for sign-in, registration, and cloud-backed features

### 1. Get the source and install dependencies

```sh
git clone https://github.com/shreyasdigule/shiksha-portal-app.git
cd shiksha-portal-app
corepack enable
pnpm install
```

In Windows PowerShell, the same commands work. If `corepack enable` is blocked by permissions, install pnpm 10 using the instructions on the pnpm website.

### 2. Configure Supabase

Create a Supabase project. Copy the project URL and **publishable** key from its API settings, then create your local environment file:

```sh
cp .env.example .env.local
```

On Windows PowerShell, use `Copy-Item .env.example .env.local` instead. Edit `.env.local` and set:

```dotenv
VITE_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_YOUR_PUBLIC_KEY
```

### 3. Create the database schema

In the Supabase dashboard, open **SQL Editor** and run the files in `supabase/migrations` in this order:

1. `202609300001_initial_portal.sql`
2. `202609300002_faculty_accounts.sql`
3. `202609300003_faculty_self_registration.sql`
4. `202609300004_faculty_immediate_activation.sql`
5. `202609300005_fix_faculty_signup.sql`
6. `202609300006_computer_engineering_subjects.sql`

Migration 0005 repairs the Auth trigger and faculty table if earlier faculty migrations were only partly applied. Migration 0006 seeds the AY 2025-26 VIT Pune Computer Engineering subjects used by attendance and test scheduling.

For this classroom demo, turn **Confirm email** off under **Authentication → Sign In / Providers → Email** so registration can sign in immediately. Configure the site URL and local/deployed redirect URLs in Supabase Auth settings. Password-reset emails require an email provider.

### 4. Start the development server

```sh
pnpm dev
```

Open the local URL printed by Vite (usually `http://localhost:5173`). To create a production build or serve that build locally:

```sh
pnpm build
pnpm preview
```

## What the app includes

- Student registration and sign-in, session restoration, and password reset through Supabase Auth. Roles come from the database profile; choosing a role in the login form does not grant access.
- Faculty self-registration and sign-in, plus a faculty student directory populated from registered profiles.
- Faculty attendance entry backed by Supabase and the seeded Computer Engineering subjects.
- Student dashboard, course and test pages, exam interface, result review, attendance, and profile pages.
- Admin dashboard pages for students, courses, tests, results, attendance, and settings.

## Current scope

Supabase currently backs authentication, student/faculty profiles, the faculty directory, and faculty attendance. The schema also defines subjects, enrollments, tests, questions, attempts, and answers, but student course/test lists, faculty course/test management, exam attempts and scoring, student results, and the student attendance view still use local demo data. Faculty-created tests do not persist after reload. Profile/contact display preferences and theme settings are stored in the browser.

The demo exam bank includes answer keys in client-side code. Do not use demo scores, enrollment counts, or security warnings as official records. Before using exams with real students, move test availability, attempt limits, and scoring into trusted server-side/database functions and keep answer keys off the client.

## Security notes

The browser app must use only the Supabase publishable key. Never put a Supabase secret or service-role key in a `VITE_` variable or browser code. Database access is protected with Row Level Security policies defined by the migrations.

Disabling email confirmation is only suitable for this demonstration: the app cannot verify that someone owns the VIT email address they enter. Admin accounts are provisioned by the project owner and cannot be created through public signup.
