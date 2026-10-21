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
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      alert_sources: {
        Row: {
          alert_id: string
          created_at: string
          id: string
          publisher: string | null
          source_id: string | null
          url: string
        }
        Insert: {
          alert_id: string
          created_at?: string
          id?: string
          publisher?: string | null
          source_id?: string | null
          url: string
        }
        Update: {
          alert_id?: string
          created_at?: string
          id?: string
          publisher?: string | null
          source_id?: string | null
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "alert_sources_alert_id_fkey"
            columns: ["alert_id"]
            isOneToOne: false
            referencedRelation: "alerts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "alert_sources_source_id_fkey"
            columns: ["source_id"]
            isOneToOne: false
            referencedRelation: "public_sources"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "alert_sources_source_id_fkey"
            columns: ["source_id"]
            isOneToOne: false
            referencedRelation: "sources"
            referencedColumns: ["id"]
          },
        ]
      }
      alerts: {
        Row: {
          auto_published: boolean
          category: Database["public"]["Enums"]["alert_category"]
          created_at: string
          expires_at: string
          id: string
          issuing_authority: string | null
          last_reviewed_at: string | null
          primary_source_url: string
          published_at: string | null
          region_id: string
          severity: Database["public"]["Enums"]["alert_severity"]
          status: Database["public"]["Enums"]["alert_status"]
          summary: string
          tier: Database["public"]["Enums"]["source_tier"]
          title: string
          updated_at: string
          withdrawn_reason: string | null
        }
        Insert: {
          auto_published?: boolean
          category: Database["public"]["Enums"]["alert_category"]
          created_at?: string
          expires_at: string
          id?: string
          issuing_authority?: string | null
          last_reviewed_at?: string | null
          primary_source_url: string
          published_at?: string | null
          region_id: string
          severity?: Database["public"]["Enums"]["alert_severity"]
          status?: Database["public"]["Enums"]["alert_status"]
          summary: string
          tier: Database["public"]["Enums"]["source_tier"]
          title: string
          updated_at?: string
          withdrawn_reason?: string | null
        }
        Update: {
          auto_published?: boolean
          category?: Database["public"]["Enums"]["alert_category"]
          created_at?: string
          expires_at?: string
          id?: string
          issuing_authority?: string | null
          last_reviewed_at?: string | null
          primary_source_url?: string
          published_at?: string | null
          region_id?: string
          severity?: Database["public"]["Enums"]["alert_severity"]
          status?: Database["public"]["Enums"]["alert_status"]
          summary?: string
          tier?: Database["public"]["Enums"]["source_tier"]
          title?: string
          updated_at?: string
          withdrawn_reason?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "alerts_region_id_fkey"
            columns: ["region_id"]
            isOneToOne: false
            referencedRelation: "region_status"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "alerts_region_id_fkey"
            columns: ["region_id"]
            isOneToOne: false
            referencedRelation: "regions"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          action: string
          actor_id: string | null
          created_at: string
          details: Json
          entity_id: string | null
          entity_type: string
          id: string
        }
        Insert: {
          action: string
          actor_id?: string | null
          created_at?: string
          details?: Json
          entity_id?: string | null
          entity_type: string
          id?: string
        }
        Update: {
          action?: string
          actor_id?: string | null
          created_at?: string
          details?: Json
          entity_id?: string | null
          entity_type?: string
          id?: string
        }
        Relationships: []
      }
      ingestion_queue: {
        Row: {
          ai_result: Json | null
          canonical_url: string
          content_hash: string | null
          external_id: string | null
          fetched_at: string
          id: string
          last_error: string | null
          published_at: string | null
          snippet: string | null
          source_id: string
          status: Database["public"]["Enums"]["queue_status"]
          title: string
        }
        Insert: {
          ai_result?: Json | null
          canonical_url: string
          content_hash?: string | null
          external_id?: string | null
          fetched_at?: string
          id?: string
          last_error?: string | null
          published_at?: string | null
          snippet?: string | null
          source_id: string
          status?: Database["public"]["Enums"]["queue_status"]
          title: string
        }
        Update: {
          ai_result?: Json | null
          canonical_url?: string
          content_hash?: string | null
          external_id?: string | null
          fetched_at?: string
          id?: string
          last_error?: string | null
          published_at?: string | null
          snippet?: string | null
          source_id?: string
          status?: Database["public"]["Enums"]["queue_status"]
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "ingestion_queue_source_id_fkey"
            columns: ["source_id"]
            isOneToOne: false
            referencedRelation: "public_sources"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ingestion_queue_source_id_fkey"
            columns: ["source_id"]
            isOneToOne: false
            referencedRelation: "sources"
            referencedColumns: ["id"]
          },
        ]
      }
      regions: {
        Row: {
          covered: boolean
          created_at: string
          id: string
          iso_code: string | null
          lat: number | null
          lng: number | null
          name: string
          parent_id: string | null
          slug: string
        }
        Insert: {
          covered?: boolean
          created_at?: string
          id?: string
          iso_code?: string | null
          lat?: number | null
          lng?: number | null
          name: string
          parent_id?: string | null
          slug: string
        }
        Update: {
          covered?: boolean
          created_at?: string
          id?: string
          iso_code?: string | null
          lat?: number | null
          lng?: number | null
          name?: string
          parent_id?: string | null
          slug?: string
        }
        Relationships: [
          {
            foreignKeyName: "regions_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "region_status"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "regions_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "regions"
            referencedColumns: ["id"]
          },
        ]
      }
      sources: {
        Row: {
          active: boolean
          created_at: string
          feed_url: string | null
          id: string
          last_error: string | null
          last_fetched_at: string | null
          last_success_at: string | null
          name: string
          region_id: string | null
          reliability_notes: string | null
          tier: Database["public"]["Enums"]["source_tier"]
          url: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          feed_url?: string | null
          id?: string
          last_error?: string | null
          last_fetched_at?: string | null
          last_success_at?: string | null
          name: string
          region_id?: string | null
          reliability_notes?: string | null
          tier: Database["public"]["Enums"]["source_tier"]
          url: string
        }
        Update: {
          active?: boolean
          created_at?: string
          feed_url?: string | null
          id?: string
          last_error?: string | null
          last_fetched_at?: string | null
          last_success_at?: string | null
          name?: string
          region_id?: string | null
          reliability_notes?: string | null
          tier?: Database["public"]["Enums"]["source_tier"]
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "sources_region_id_fkey"
            columns: ["region_id"]
            isOneToOne: false
            referencedRelation: "region_status"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sources_region_id_fkey"
            columns: ["region_id"]
            isOneToOne: false
            referencedRelation: "regions"
            referencedColumns: ["id"]
          },
        ]
      }
      staff: {
        Row: {
          created_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          user_id?: string
        }
        Relationships: []
      }
      system_settings: {
        Row: {
          autopublish_enabled: boolean
          id: number
          last_ingest_ok_at: string | null
          updated_at: string
        }
        Insert: {
          autopublish_enabled?: boolean
          id?: number
          last_ingest_ok_at?: string | null
          updated_at?: string
        }
        Update: {
          autopublish_enabled?: boolean
          id?: number
          last_ingest_ok_at?: string | null
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      public_sources: {
        Row: {
          id: string | null
          name: string | null
          region_id: string | null
          tier: Database["public"]["Enums"]["source_tier"] | null
          url: string | null
        }
        Insert: {
          id?: string | null
          name?: string | null
          region_id?: string | null
          tier?: Database["public"]["Enums"]["source_tier"] | null
          url?: string | null
        }
        Update: {
          id?: string | null
          name?: string | null
          region_id?: string | null
          tier?: Database["public"]["Enums"]["source_tier"] | null
          url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sources_region_id_fkey"
            columns: ["region_id"]
            isOneToOne: false
            referencedRelation: "region_status"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sources_region_id_fkey"
            columns: ["region_id"]
            isOneToOne: false
            referencedRelation: "regions"
            referencedColumns: ["id"]
          },
        ]
      }
      region_status: {
        Row: {
          active_alerts: number | null
          covered: boolean | null
          id: string | null
          iso_code: string | null
          lat: number | null
          lng: number | null
          name: string | null
          slug: string | null
          top_severity: Database["public"]["Enums"]["alert_severity"] | null
        }
        Relationships: []
      }
    }
    Functions: {
      is_staff: { Args: never; Returns: boolean }
    }
    Enums: {
      alert_category:
        | "antisemitic_incident"
        | "demonstration"
        | "security_threat"
        | "travel_advisory"
        | "official_warning"
        | "other"
      alert_severity: "info" | "low" | "moderate" | "high" | "critical"
      alert_status: "draft" | "published" | "withdrawn"
      queue_status: "pending" | "processed" | "rejected" | "failed"
      source_tier: "official" | "verified_news" | "community_security"
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
    Enums: {
      alert_category: [
        "antisemitic_incident",
        "demonstration",
        "security_threat",
        "travel_advisory",
        "official_warning",
        "other",
      ],
      alert_severity: ["info", "low", "moderate", "high", "critical"],
      alert_status: ["draft", "published", "withdrawn"],
      queue_status: ["pending", "processed", "rejected", "failed"],
      source_tier: ["official", "verified_news", "community_security"],
    },
  },
} as const
