/**
 * Hand written for now. Once the Supabase project exists this can be replaced
 * with the generated file:
 *   npx supabase gen types typescript --project-id <ref> > src/lib/database.types.ts
 */

export type AppRole = "admin" | "senior_pastor" | "treasurer" | "member";

export type ApprovalStatus = "pending" | "approved" | "declined";

export type ProfileRow = {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string | null;
  date_of_birth: string | null;
  role: AppRole;
  position_id: string | null;
  approval_status: ApprovalStatus;
  approved_at: string | null;
  approved_by: string | null;
  decline_reason: string | null;
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
        // supabase-js needs this key on every table, and needs the real foreign
        // keys in it, otherwise .update() resolves to never and embedded selects
        // like position:department_positions(...) fail to type.
        Relationships: [
          {
            foreignKeyName: "profiles_position_id_fkey";
            columns: ["position_id"];
            isOneToOne: false;
            referencedRelation: "department_positions";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "profiles_approved_by_fkey";
            columns: ["approved_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      department_positions: {
        Row: DepartmentPositionRow;
        Insert: Partial<DepartmentPositionRow> & { name: string };
        Update: Partial<DepartmentPositionRow>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      current_user_role: { Args: Record<string, never>; Returns: AppRole };
      is_admin: { Args: Record<string, never>; Returns: boolean };
      is_approved: { Args: Record<string, never>; Returns: boolean };
    };
    Enums: {
      app_role: AppRole;
      member_approval_status: ApprovalStatus;
    };
    CompositeTypes: Record<string, never>;
  };
};
