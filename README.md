# ShikshaPortal

ShikshaPortal is a student registration and academic portal for students and faculty at Vishwakarma Institute of Technology, Pune.

## Open the live portal

**[Launch ShikshaPortal](https://shiksha-portal-app.onrender.com/)**

The site is hosted on Render's free plan. After a period of inactivity, the first visit may take around a minute while the service wakes up.

### Getting started

- **Students:** Choose **Student** to sign in, or **Create account** to register with your VIT email and PRN, full name, department, semester, and a password.
- **Faculty:** Choose **Faculty / Admin** to sign in or register a faculty account with a VIT email, full name, department, and a password.
- **Password reset:** Choose the appropriate role, enter the account's VIT email, then select **Forgot password?**. A reset email is sent only if the account exists and Supabase email delivery is configured.
- **Theme:** Use the control in the upper-right corner to switch between light and dark modes.

Use your own account. Do not enter another person's credentials or sensitive information.

## What works with Supabase

The live site uses Supabase Auth and the connected ShikshaPortal database for:

- Student and faculty registration and sign-in.
- Student/faculty profiles and faculty account status checks.
- The faculty student directory.
- Faculty attendance records.
- The eight active Computer Engineering subjects used by faculty attendance.

The app also includes demo workflows for courses, tests, exams, results, and student attendance. These workflows are not fully persisted to Supabase. Do not treat demo scores, enrollment counts, or attendance views as official records.

## For maintainers

The frontend uses React 19, TypeScript, Vite, and Tailwind CSS 4. Render builds the Docker image from the repository's root [Dockerfile](./Dockerfile); [nginx.conf](./nginx.conf) serves the production build and routes client-side URLs to the app. The [Render Blueprint](./render.yaml) describes the web service.

### Supabase configuration

The current deployment uses the shared [ShikshaPortal Supabase project](https://supabase.com/dashboard/project/wuziytmlyzjkcsqbrodg). Its project URL and **publishable** key are build-time environment variables in Render:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`

These values are included in the browser bundle and are not secrets. Never use a Supabase secret or service-role key in a `VITE_` variable or client-side code. Keep local `.env.local` files out of Git.

For a new Supabase project, apply the migrations in `supabase/migrations/` in filename order, configure the two variables above, and add the deployed URL to Supabase's allowed redirect URLs. To support immediate demo registration, email confirmation must be disabled; use that setting only for a classroom demo. Password reset requires configured email delivery.

### Deploying updates

The Render service is available at [shiksha-portal-app.onrender.com](https://shiksha-portal-app.onrender.com/). If Render is connected to the GitHub repository, pushes to `main` deploy automatically. Otherwise, sync the Blueprint or trigger a deploy from the Render service dashboard.

### Production limitations

The demo exam bank contains answer keys in client-side code. Before using exams with real students, move exam availability, attempt limits, and scoring into trusted server-side/database functions and keep answer keys off the client. Review the Supabase Row Level Security policies in the SQL migrations before changing database access.
