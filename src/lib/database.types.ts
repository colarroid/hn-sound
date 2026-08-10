/**
 * Hand written for now. Once the Supabase project exists this can be replaced
 * with the generated file:
 *   npx supabase gen types typescript --project-id <ref> > src/lib/database.types.ts
 */

export type AppRole = "admin" | "senior_pastor" | "treasurer" | "member";

export type ProfileRow = {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string | null;
  date_of_birth: string | null;
  role: AppRole;
  position_id: string | null;
  created_at: string;
  updated_at: string;
};

export type DepartmentPositionRow = {
  id: string;
  name: string;
  sort_order: number;
  created_at: string;
};

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: ProfileRow;
        Insert: Partial<ProfileRow> & { id: string; email: string };
        Update: Partial<ProfileRow>;
      };
      department_positions: {
        Row: DepartmentPositionRow;
        Insert: Partial<DepartmentPositionRow> & { name: string };
        Update: Partial<DepartmentPositionRow>;
      };
    };
    Views: Record<string, never>;
    Functions: {
      current_user_role: { Args: Record<string, never>; Returns: AppRole };
      is_admin: { Args: Record<string, never>; Returns: boolean };
    };
    Enums: {
      app_role: AppRole;
    };
    CompositeTypes: Record<string, never>;
  };
};
