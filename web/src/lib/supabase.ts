import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Student = {
  id: string;
  uid: string;
  full_name: string;
  phone: string | null;
  class: string | null;
  sex: string | null;
  department: string | null;
  created_at: string;
};

export type AttendanceLogRow = {
  id: string;
  uid: string;
  scanned_at: string;
  full_name: string | null;
  phone: string | null;
  class: string | null;
};

export type Semester = {
  id: string;
  name: string;
  start_date: string;
  end_date: string;
  max_absent: number;
  alert_at: number;
  created_at: string;
};

export type AbsenceSummary = {
  student_id: string;
  full_name: string;
  class: string | null;
  semester_id: string;
  semester_name: string;
  absent_count: number;
  max_absent: number;
  alert_at: number;
  status: "ok" | "warning" | "critical";
};
