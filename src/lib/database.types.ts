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
  /** Free text, typed by the admin at approval. Descriptive, grants nothing. */
  position: string | null;
  approval_status: ApprovalStatus;
  approved_at: string | null;
  approved_by: string | null;
  decline_reason: string | null;
  created_at: string;
  updated_at: string;
};

export type TrainingMaterialKind = "link" | "file";

export type TrainingMaterialRow = {
  id: string;
  title: string;
  summary: string | null;
  /** Which week of the course this belongs to. Null for reference material. */
  lesson_number: number | null;
  /** What the trainer expects the trainee to take away from it. */
  expectations: string | null;
  kind: TrainingMaterialKind;
  url: string | null;
  file_path: string | null;
  file_name: string | null;
  file_size: number | null;
  mime_type: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

export type TrainingEligibilityRow = {
  material_id: string;
  profile_id: string;
  granted_by: string | null;
  granted_at: string;
};

/**
 * 'obsolete' is not 'faulty'. Faulty is broken and belongs on the needs-fixing
 * list; obsolete still works but is due for replacement.
 */
export type InventoryStatus = "ok" | "faulty" | "obsolete" | "retired";

export type InventoryCategoryRow = {
  id: string;
  name: string;
  sort_order: number;
  created_at: string;
};

export type InventoryItemRow = {
  id: string;
  name: string;
  /**
   * Short handle that tells two otherwise identical items apart: Blue, Floor Tom,
   * Stage Left. Not the serial number, which nobody reads off a cable mid-service.
   */
  label: string | null;
  category_id: string | null;
  quantity: number;
  serial_number: string | null;
  location: string | null;
  notes: string | null;
  status: InventoryStatus;
  fault_note: string | null;
  flagged_by: string | null;
  flagged_at: string | null;
  resolved_by: string | null;
  resolved_at: string | null;
  added_by: string | null;
  created_at: string;
  updated_at: string;
};

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: ProfileRow;
        Insert: Partial<ProfileRow> & { id: string; email: string };
        Update: Partial<ProfileRow>;
        // supabase-js needs this key on every table, and needs the real foreign
        // keys in it, otherwise .update() resolves to never.
        Relationships: [
          {
            foreignKeyName: "profiles_approved_by_fkey";
            columns: ["approved_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      training_materials: {
        Row: TrainingMaterialRow;
        Insert: Partial<TrainingMaterialRow> & {
          title: string;
          kind: TrainingMaterialKind;
        };
        Update: Partial<TrainingMaterialRow>;
        Relationships: [
          {
            foreignKeyName: "training_materials_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      training_eligibility: {
        Row: TrainingEligibilityRow;
        Insert: Partial<TrainingEligibilityRow> & {
          material_id: string;
          profile_id: string;
        };
        Update: Partial<TrainingEligibilityRow>;
        Relationships: [
          {
            foreignKeyName: "training_eligibility_material_id_fkey";
            columns: ["material_id"];
            isOneToOne: false;
            referencedRelation: "training_materials";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "training_eligibility_profile_id_fkey";
            columns: ["profile_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      inventory_categories: {
        Row: InventoryCategoryRow;
        Insert: Partial<InventoryCategoryRow> & { name: string };
        Update: Partial<InventoryCategoryRow>;
        Relationships: [];
      };
      inventory_items: {
        Row: InventoryItemRow;
        Insert: Partial<InventoryItemRow> & { name: string };
        Update: Partial<InventoryItemRow>;
        Relationships: [
          {
            foreignKeyName: "inventory_items_category_id_fkey";
            columns: ["category_id"];
            isOneToOne: false;
            referencedRelation: "inventory_categories";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "inventory_items_added_by_fkey";
            columns: ["added_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: Record<string, never>;
    Functions: {
      current_user_role: { Args: Record<string, never>; Returns: AppRole };
      is_admin: { Args: Record<string, never>; Returns: boolean };
      is_approved: { Args: Record<string, never>; Returns: boolean };
      can_oversee: { Args: Record<string, never>; Returns: boolean };
      can_edit_inventory: { Args: Record<string, never>; Returns: boolean };
    };
    Enums: {
      app_role: AppRole;
      member_approval_status: ApprovalStatus;
      training_material_kind: TrainingMaterialKind;
      inventory_status: InventoryStatus;
    };
    CompositeTypes: Record<string, never>;
  };
};
