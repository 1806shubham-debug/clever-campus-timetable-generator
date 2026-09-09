export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      batches: {
        Row: {
          code: string
          created_at: string
          department: string
          id: string
          name: string
          semester: number
          strength: number
        }
        Insert: {
          code: string
          created_at?: string
          department?: string
          id?: string
          name: string
          semester?: number
          strength?: number
        }
        Update: {
          code?: string
          created_at?: string
          department?: string
          id?: string
          name?: string
          semester?: number
          strength?: number
        }
        Relationships: []
      }
      constraints: {
        Row: {
          code: string
          constraint_type: string
          created_at: string
          description: string | null
          enabled: boolean
          id: string
          name: string
          weight: number
        }
        Insert: {
          code: string
          constraint_type?: string
          created_at?: string
          description?: string | null
          enabled?: boolean
          id?: string
          name: string
          weight?: number
        }
        Update: {
          code?: string
          constraint_type?: string
          created_at?: string
          description?: string | null
          enabled?: boolean
          id?: string
          name?: string
          weight?: number
        }
        Relationships: []
      }
      faculty: {
        Row: {
          code: string
          created_at: string
          department: string
          designation: string
          email: string | null
          id: string
          max_hours_per_week: number
          name: string
          unavailable_slots: Json
        }
        Insert: {
          code: string
          created_at?: string
          department?: string
          designation?: string
          email?: string | null
          id?: string
          max_hours_per_week?: number
          name: string
          unavailable_slots?: Json
        }
        Update: {
          code?: string
          created_at?: string
          department?: string
          designation?: string
          email?: string | null
          id?: string
          max_hours_per_week?: number
          name?: string
          unavailable_slots?: Json
        }
        Relationships: []
      }
      rooms: {
        Row: {
          building: string
          capacity: number
          code: string
          created_at: string
          id: string
          name: string
          room_type: string
        }
        Insert: {
          building?: string
          capacity?: number
          code: string
          created_at?: string
          id?: string
          name: string
          room_type?: string
        }
        Update: {
          building?: string
          capacity?: number
          code?: string
          created_at?: string
          id?: string
          name?: string
          room_type?: string
        }
        Relationships: []
      }
      subjects: {
        Row: {
          batch_id: string | null
          code: string
          created_at: string
          credits: number
          faculty_id: string | null
          hours_per_week: number
          id: string
          name: string
          requires_lab: boolean
          subject_type: string
        }
        Insert: {
          batch_id?: string | null
          code: string
          created_at?: string
          credits?: number
          faculty_id?: string | null
          hours_per_week?: number
          id?: string
          name: string
          requires_lab?: boolean
          subject_type?: string
        }
        Update: {
          batch_id?: string | null
          code?: string
          created_at?: string
          credits?: number
          faculty_id?: string | null
          hours_per_week?: number
          id?: string
          name?: string
          requires_lab?: boolean
          subject_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "subjects_batch_id_fkey"
            columns: ["batch_id"]
            isOneToOne: false
            referencedRelation: "batches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subjects_faculty_id_fkey"
            columns: ["faculty_id"]
            isOneToOne: false
            referencedRelation: "faculty"
            referencedColumns: ["id"]
          },
        ]
      }
      timetables: {
        Row: {
          algorithm: string
          created_at: string
          entries: Json
          execution_ms: number
          fitness: number
          hard_conflicts: number
          id: string
          iterations: number
          metrics: Json
          name: string
          required_count: number
          scheduled_count: number
          soft_penalties: number
          utilization: number
        }
        Insert: {
          algorithm: string
          created_at?: string
          entries?: Json
          execution_ms?: number
          fitness?: number
          hard_conflicts?: number
          id?: string
          iterations?: number
          metrics?: Json
          name: string
          required_count?: number
          scheduled_count?: number
          soft_penalties?: number
          utilization?: number
        }
        Update: {
          algorithm?: string
          created_at?: string
          entries?: Json
          execution_ms?: number
          fitness?: number
          hard_conflicts?: number
          id?: string
          iterations?: number
          metrics?: Json
          name?: string
          required_count?: number
          scheduled_count?: number
          soft_penalties?: number
          utilization?: number
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
