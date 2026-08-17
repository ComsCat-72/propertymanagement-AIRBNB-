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
      listing_views: {
        Row: {
          agent_id: string
          id: string
          property_id: string
          viewed_at: string
          viewer_hash: string
        }
        Insert: {
          agent_id: string
          id?: string
          property_id: string
          viewed_at?: string
          viewer_hash?: string
        }
        Update: {
          agent_id?: string
          id?: string
          property_id?: string
          viewed_at?: string
          viewer_hash?: string
        }
        Relationships: [
          {
            foreignKeyName: "listing_views_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "listing_views_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      monetization_events: {
        Row: {
          agent_id: string
          amount_rwf: number
          created_at: string
          event_type: string
          id: string
          metadata: Json
          plan: Database["public"]["Enums"]["subscription_plan"] | null
        }
        Insert: {
          agent_id: string
          amount_rwf?: number
          created_at?: string
          event_type: string
          id?: string
          metadata?: Json
          plan?: Database["public"]["Enums"]["subscription_plan"] | null
        }
        Update: {
          agent_id?: string
          amount_rwf?: number
          created_at?: string
          event_type?: string
          id?: string
          metadata?: Json
          plan?: Database["public"]["Enums"]["subscription_plan"] | null
        }
        Relationships: [
          {
            foreignKeyName: "monetization_events_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      plan_limits: {
        Row: {
          label: string
          max_listings: number | null
          perks: string[]
          plan: Database["public"]["Enums"]["subscription_plan"]
          price_rwf: number
          sort_order: number
        }
        Insert: {
          label: string
          max_listings?: number | null
          perks?: string[]
          plan: Database["public"]["Enums"]["subscription_plan"]
          price_rwf?: number
          sort_order?: number
        }
        Update: {
          label?: string
          max_listings?: number | null
          perks?: string[]
          plan?: Database["public"]["Enums"]["subscription_plan"]
          price_rwf?: number
          sort_order?: number
        }
        Relationships: []
      }
      profiles: {
        Row: {
          achievements: string
          address: string | null
          agency_name: string | null
          bio: string | null
          cancel_at_period_end: boolean
          created_at: string
          email: string
          full_name: string
          id: string
          is_public_agent: boolean
          is_verified: boolean
          phone: string | null
          photo_public_id: string
          plan: Database["public"]["Enums"]["subscription_plan"]
          plan_expires_at: string | null
          profile_photo_url: string | null
          status: Database["public"]["Enums"]["account_status"]
          updated_at: string
          verified_expires_at: string | null
        }
        Insert: {
          achievements?: string
          address?: string | null
          agency_name?: string | null
          bio?: string | null
          cancel_at_period_end?: boolean
          created_at?: string
          email?: string
          full_name?: string
          id: string
          is_public_agent?: boolean
          is_verified?: boolean
          phone?: string | null
          photo_public_id?: string
          plan?: Database["public"]["Enums"]["subscription_plan"]
          plan_expires_at?: string | null
          profile_photo_url?: string | null
          status?: Database["public"]["Enums"]["account_status"]
          updated_at?: string
          verified_expires_at?: string | null
        }
        Update: {
          achievements?: string
          address?: string | null
          agency_name?: string | null
          bio?: string | null
          cancel_at_period_end?: boolean
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          is_public_agent?: boolean
          is_verified?: boolean
          phone?: string | null
          photo_public_id?: string
          plan?: Database["public"]["Enums"]["subscription_plan"]
          plan_expires_at?: string | null
          profile_photo_url?: string | null
          status?: Database["public"]["Enums"]["account_status"]
          updated_at?: string
          verified_expires_at?: string | null
        }
        Relationships: []
      }
      properties: {
        Row: {
          agent_id: string
          amenities: string[]
          area_sqm: number
          bathrooms: number
          bedrooms: number
          category: Database["public"]["Enums"]["property_category"]
          city: string
          created_at: string
          description: string
          features: Json
          id: string
          image_public_ids: string[]
          images: string[]
          is_featured: boolean
          location: string
          price: number
          property_type: Database["public"]["Enums"]["property_type"]
          status: Database["public"]["Enums"]["property_status"]
          title: string
          updated_at: string
        }
        Insert: {
          agent_id: string
          amenities?: string[]
          area_sqm?: number
          bathrooms?: number
          bedrooms?: number
          category?: Database["public"]["Enums"]["property_category"]
          city?: string
          created_at?: string
          description?: string
          features?: Json
          id?: string
          image_public_ids?: string[]
          images?: string[]
          is_featured?: boolean
          location?: string
          price?: number
          property_type?: Database["public"]["Enums"]["property_type"]
          status?: Database["public"]["Enums"]["property_status"]
          title: string
          updated_at?: string
        }
        Update: {
          agent_id?: string
          amenities?: string[]
          area_sqm?: number
          bathrooms?: number
          bedrooms?: number
          category?: Database["public"]["Enums"]["property_category"]
          city?: string
          created_at?: string
          description?: string
          features?: Json
          id?: string
          image_public_ids?: string[]
          images?: string[]
          is_featured?: boolean
          location?: string
          price?: number
          property_type?: Database["public"]["Enums"]["property_type"]
          status?: Database["public"]["Enums"]["property_status"]
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "properties_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      upgrade_requests: {
        Row: {
          admin_note: string
          agent_id: string
          amount_rwf: number
          created_at: string
          id: string
          payment_reference: string
          requested_plan: Database["public"]["Enums"]["subscription_plan"]
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          updated_at: string
          wants_badge: boolean
        }
        Insert: {
          admin_note?: string
          agent_id: string
          amount_rwf?: number
          created_at?: string
          id?: string
          payment_reference?: string
          requested_plan?: Database["public"]["Enums"]["subscription_plan"]
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          updated_at?: string
          wants_badge?: boolean
        }
        Update: {
          admin_note?: string
          agent_id?: string
          amount_rwf?: number
          created_at?: string
          id?: string
          payment_reference?: string
          requested_plan?: Database["public"]["Enums"]["subscription_plan"]
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          updated_at?: string
          wants_badge?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "upgrade_requests_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      admin_delete_agent: { Args: { _agent_id: string }; Returns: undefined }
      admin_set_plan: {
        Args: {
          _agent_id: string
          _days?: number
          _plan: Database["public"]["Enums"]["subscription_plan"]
        }
        Returns: undefined
      }
      admin_set_verified: {
        Args: { _agent_id: string; _days?: number; _verified: boolean }
        Returns: undefined
      }
      approve_upgrade_request: {
        Args: { _request_id: string }
        Returns: undefined
      }
      assert_profiles_column_grants: { Args: never; Returns: undefined }
      current_plan: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["subscription_plan"]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      listing_quota_reached: { Args: { _user_id: string }; Returns: boolean }
      non_admin_profile_ids: {
        Args: never
        Returns: {
          id: string
        }[]
      }
      profile_contacts: {
        Args: never
        Returns: {
          address: string
          email: string
          id: string
        }[]
      }
      reject_upgrade_request: {
        Args: { _note: string; _request_id: string }
        Returns: undefined
      }
    }
    Enums: {
      account_status: "active" | "suspended"
      app_role: "admin" | "agent" | "client"
      property_category:
        | "house"
        | "apartment"
        | "land"
        | "commercial"
        | "villa"
        | "car"
        | "motorcycle"
      property_status:
        | "active"
        | "sold"
        | "rented"
        | "draft"
        | "under_negotiation"
      property_type: "sale" | "rent"
      subscription_plan: "free" | "tier1" | "tier2"
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
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
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
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
      account_status: ["active", "suspended"],
      app_role: ["admin", "agent", "client"],
      property_category: [
        "house",
        "apartment",
        "land",
        "commercial",
        "villa",
        "car",
        "motorcycle",
      ],
      property_status: [
        "active",
        "sold",
        "rented",
        "draft",
        "under_negotiation",
      ],
      property_type: ["sale", "rent"],
      subscription_plan: ["free", "tier1", "tier2"],
    },
  },
} as const
