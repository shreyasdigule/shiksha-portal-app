import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const publishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined;

export const isSupabaseConfigured = Boolean(url && publishableKey);

// Only the public publishable key belongs in a browser application. Row Level
// Security in the SQL migration protects data; never put a service role key here.
export const supabase = isSupabaseConfigured
  ? createClient(url!, publishableKey!, {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
    })
  : null;

export type AppRole = "student" | "faculty" | "admin";

export interface Profile {
  id: string;
  email: string;
  full_name: string;
  student_id: string | null;
  department: string | null;
  semester: number | null;
  role: AppRole;
  status: "active" | "pending" | "suspended";
}

export async function getProfile(userId: string): Promise<Profile> {
  if (!supabase) throw new Error("Supabase is not configured. Add the project URL and publishable key.");
  const { data, error } = await supabase.from("profiles").select("*").eq("id", userId).single();
  if (error) throw error;
  const profile = data as Profile;
  if (profile.role === "faculty") {
    const { data: facultyRecord, error: facultyError } = await supabase
      .from("faculty_accounts")
      .select("id, email, status")
      .eq("id", userId)
      .maybeSingle();
    if (facultyError) {
      if (facultyError.code === "PGRST205" || facultyError.code === "42P01") {
        throw new Error("Faculty account records are not configured yet. Run the latest Supabase migration.");
      }
      throw facultyError;
    }
    if (!facultyRecord || facultyRecord.email.toLowerCase() !== profile.email.toLowerCase()) {
      throw new Error("This faculty account has not been provisioned. Contact an administrator.");
    }
    if (facultyRecord.status !== "active") {
      throw new Error("Your faculty account is pending approval or suspended. Contact an administrator.");
    }
  }
  return profile;
}
