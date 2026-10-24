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
      admin_notifications: {
        Row: {
          key: string
          kind: string
          sent_at: string
        }
        Insert: {
          key: string
          kind: string
          sent_at?: string
        }
        Update: {
          key?: string
          kind?: string
          sent_at?: string
        }
        Relationships: []
      }
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
          event_key: string | null
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
          verification: string
          withdrawn_reason: string | null
        }
        Insert: {
          auto_published?: boolean
          category: Database["public"]["Enums"]["alert_category"]
          created_at?: string
          event_key?: string | null
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
          verification?: string
          withdrawn_reason?: string | null
        }
        Update: {
          auto_published?: boolean
          category?: Database["public"]["Enums"]["alert_category"]
          created_at?: string
          event_key?: string | null
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
          verification?: string
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
      headline_gate_rules: {
        Row: {
          id: number
          kind: string
          pattern: string
        }
        Insert: {
          id?: never
          kind: string
          pattern: string
        }
        Update: {
          id?: never
          kind?: string
          pattern?: string
        }
        Relationships: []
      }
      headlines: {
        Row: {
          created_at: string
          id: string
          incident_checked_at: string | null
          kept: boolean
          language: string | null
          published_at: string | null
          publisher: string | null
          region: string | null
          region_slug: string | null
          source: string | null
          source_type: string | null
          tier: number | null
          title: string
          title_original: string | null
          topic: string | null
          translated_at: string | null
          url: string
        }
        Insert: {
          created_at?: string
          id?: string
          incident_checked_at?: string | null
          kept?: boolean
          language?: string | null
          published_at?: string | null
          publisher?: string | null
          region?: string | null
          region_slug?: string | null
          source?: string | null
          source_type?: string | null
          tier?: number | null
          title: string
          title_original?: string | null
          topic?: string | null
          translated_at?: string | null
          url: string
        }
        Update: {
          created_at?: string
          id?: string
          incident_checked_at?: string | null
          kept?: boolean
          language?: string | null
          published_at?: string | null
          publisher?: string | null
          region?: string | null
          region_slug?: string | null
          source?: string | null
          source_type?: string | null
          tier?: number | null
          title?: string
          title_original?: string | null
          topic?: string | null
          translated_at?: string | null
          url?: string
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
      news_editions: {
        Row: {
          ceid: string
          gl: string
          hl: string
          iso: string
          lang: string
        }
        Insert: {
          ceid: string
          gl: string
          hl: string
          iso: string
          lang: string
        }
        Update: {
          ceid?: string
          gl?: string
          hl?: string
          iso?: string
          lang?: string
        }
        Relationships: []
      }
      news_group_terms: {
        Row: {
          terms: string
          zone_group: string
        }
        Insert: {
          terms: string
          zone_group: string
        }
        Update: {
          terms?: string
          zone_group?: string
        }
        Relationships: []
      }
      news_lang_terms: {
        Row: {
          lang: string
          terms: string
        }
        Insert: {
          lang: string
          terms: string
        }
        Update: {
          lang?: string
          terms?: string
        }
        Relationships: []
      }
      publisher_allowlist: {
        Row: {
          note: string | null
          pattern: string
        }
        Insert: {
          note?: string | null
          pattern: string
        }
        Update: {
          note?: string | null
          pattern?: string
        }
        Relationships: []
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
          search_terms: string | null
          slug: string
          zone_group: string
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
          search_terms?: string | null
          slug: string
          zone_group?: string
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
          search_terms?: string | null
          slug?: string
          zone_group?: string
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
      social_queries: {
        Row: {
          active: boolean
          id: number
          platform: string
          query: string
        }
        Insert: {
          active?: boolean
          id?: never
          platform?: string
          query: string
        }
        Update: {
          active?: boolean
          id?: never
          platform?: string
          query?: string
        }
        Relationships: []
      }
      social_signals: {
        Row: {
          alert_id: string | null
          author_did: string | null
          category: string | null
          classified_at: string | null
          created_at: string
          event_key: string | null
          id: string
          kind: string | null
          lang: string | null
          needs_human: boolean
          platform: string
          post_url: string | null
          posted_at: string | null
          region_slug: string | null
          relevant: boolean | null
          severity: string | null
          status: string
          summary: string | null
          text: string | null
          uri: string
        }
        Insert: {
          alert_id?: string | null
          author_did?: string | null
          category?: string | null
          classified_at?: string | null
          created_at?: string
          event_key?: string | null
          id?: string
          kind?: string | null
          lang?: string | null
          needs_human?: boolean
          platform?: string
          post_url?: string | null
          posted_at?: string | null
          region_slug?: string | null
          relevant?: boolean | null
          severity?: string | null
          status?: string
          summary?: string | null
          text?: string | null
          uri: string
        }
        Update: {
          alert_id?: string | null
          author_did?: string | null
          category?: string | null
          classified_at?: string | null
          created_at?: string
          event_key?: string | null
          id?: string
          kind?: string | null
          lang?: string | null
          needs_human?: boolean
          platform?: string
          post_url?: string | null
          posted_at?: string | null
          region_slug?: string | null
          relevant?: boolean | null
          severity?: string | null
          status?: string
          summary?: string | null
          text?: string | null
          uri?: string
        }
        Relationships: [
          {
            foreignKeyName: "social_signals_alert_id_fkey"
            columns: ["alert_id"]
            isOneToOne: false
            referencedRelation: "alerts"
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
          independence_group: string | null
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
          independence_group?: string | null
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
          independence_group?: string | null
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
      alert_social_counts: {
        Row: {
          accounts: number | null
          alert_id: string | null
          last_post_at: string | null
          posts: number | null
        }
        Relationships: [
          {
            foreignKeyName: "social_signals_alert_id_fkey"
            columns: ["alert_id"]
            isOneToOne: false
            referencedRelation: "alerts"
            referencedColumns: ["id"]
          },
        ]
      }
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
          developing_alerts: number | null
          id: string | null
          iso_code: string | null
          lat: number | null
          lng: number | null
          name: string | null
          parent_id: string | null
          slug: string | null
          top_severity: Database["public"]["Enums"]["alert_severity"] | null
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
      social_review_queue: {
        Row: {
          accounts: number | null
          event_key: string | null
          first_seen: string | null
          last_seen: string | null
          needs_human: boolean | null
          posts: number | null
          region_slug: string | null
          sample_links: string[] | null
          summary: string | null
          top_severity: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      add_zone: {
        Args: {
          p_group?: string
          p_iso: string
          p_lat: number
          p_lng: number
          p_name: string
          p_parent_slug?: string
          p_search_terms?: string
          p_slug: string
        }
        Returns: string
      }
      apply_translations: { Args: { p_rows: Json }; Returns: Json }
      critical_watch: { Args: never; Returns: Json }
      ensure_publisher_source: { Args: { p_name: string }; Returns: string }
      gdelt_region_groups: { Args: { p_size?: number }; Returns: Json }
      headline_passes_gate: { Args: { p_title: string }; Returns: boolean }
      headlines_unseen: { Args: { p_articles: Json }; Returns: Json }
      incident_work: { Args: { p_limit?: number }; Returns: Json }
      ingest_headline: {
        Args: { p_ai: Json; p_headline_id: string }
        Returns: Json
      }
      ingest_news_candidate: {
        Args: {
          p_ai: Json
          p_feed_url: string
          p_published_at: string
          p_snippet: string
          p_title: string
          p_url: string
        }
        Returns: Json
      }
      ingest_official_alert: {
        Args: {
          p_authority: string
          p_category: Database["public"]["Enums"]["alert_category"]
          p_expires_at: string
          p_level?: number
          p_published_at?: string
          p_region_slug: string
          p_severity: Database["public"]["Enums"]["alert_severity"]
          p_summary: string
          p_title: string
          p_url: string
        }
        Returns: string
      }
      is_staff: { Args: never; Returns: boolean }
      mark_feed_status: {
        Args: { p_error: string; p_feed_url: string; p_ok: boolean }
        Returns: undefined
      }
      mark_ingest_failed: {
        Args: { p_error: string; p_feed_url: string }
        Returns: undefined
      }
      mark_ingest_ok: { Args: { p_feed_url: string }; Returns: undefined }
      merge_duplicate_alerts: {
        Args: {
          p_dry_run?: boolean
          p_threshold?: number
          p_window_hours?: number
        }
        Returns: Json
      }
      news_item_seen: {
        Args: { p_payload: Json; p_url: string }
        Returns: Json
      }
      news_query_plan: { Args: never; Returns: Json }
      open_event_list: { Args: never; Returns: Json }
      region_ancestors: { Args: { p_region: string }; Returns: string[] }
      require_service_role: { Args: never; Returns: undefined }
      social_apply: { Args: { p_rows: Json }; Returns: Json }
      social_plan: { Args: never; Returns: Json }
      social_store: { Args: { p_rows: Json }; Returns: Json }
      social_work: { Args: { p_limit?: number }; Returns: Json }
      store_headlines: { Args: { p_rows: Json }; Returns: Json }
      title_tokens: { Args: { p: string }; Returns: string[] }
      token_overlap: { Args: { a: string; b: string }; Returns: number }
      token_similarity: { Args: { a: string; b: string }; Returns: number }
      translation_work: { Args: { p_limit?: number }; Returns: Json }
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
