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
    PostgrestVersion: "14.17"
  }
  public: {
    Tables: {
      agent_inquiries: {
        Row: {
          agent_id: string
          channel: string
          client_id: string
          created_at: string
          id: string
          property_id: string | null
        }
        Insert: {
          agent_id: string
          channel?: string
          client_id: string
          created_at?: string
          id?: string
          property_id?: string | null
        }
        Update: {
          agent_id?: string
          channel?: string
          client_id?: string
          created_at?: string
          id?: string
          property_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "agent_inquiries_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agent_inquiries_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agent_inquiries_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      agent_pages: {
        Row: {
          agent_id: string
          ai_chat_enabled: boolean
          banner_public_id: string
          banner_url: string
          created_at: string
          slot_minutes: number
          slug: string
          tagline: string
          updated_at: string
          viewing_fee_rwf: number
          viewings_enabled: boolean
        }
        Insert: {
          agent_id: string
          ai_chat_enabled?: boolean
          banner_public_id?: string
          banner_url?: string
          created_at?: string
          slot_minutes?: number
          slug: string
          tagline?: string
          updated_at?: string
          viewing_fee_rwf?: number
          viewings_enabled?: boolean
        }
        Update: {
          agent_id?: string
          ai_chat_enabled?: boolean
          banner_public_id?: string
          banner_url?: string
          created_at?: string
          slot_minutes?: number
          slug?: string
          tagline?: string
          updated_at?: string
          viewing_fee_rwf?: number
          viewings_enabled?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "agent_pages_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      agent_reviews: {
        Row: {
          accuracy: number
          agent_id: string
          client_id: string
          comment: string
          communication: number
          created_at: string
          id: string
          professionalism: number
          property_id: string | null
          recommends: boolean
          status: string
          updated_at: string
        }
        Insert: {
          accuracy: number
          agent_id: string
          client_id: string
          comment?: string
          communication: number
          created_at?: string
          id?: string
          professionalism: number
          property_id?: string | null
          recommends?: boolean
          status?: string
          updated_at?: string
        }
        Update: {
          accuracy?: number
          agent_id?: string
          client_id?: string
          comment?: string
          communication?: number
          created_at?: string
          id?: string
          professionalism?: number
          property_id?: string | null
          recommends?: boolean
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "agent_reviews_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agent_reviews_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agent_reviews_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      agent_subscriptions: {
        Row: {
          agent_id: string
          category: string
          city: string
          created_at: string
          id: string
          max_price: number | null
          subscriber_id: string
        }
        Insert: {
          agent_id: string
          category?: string
          city?: string
          created_at?: string
          id?: string
          max_price?: number | null
          subscriber_id: string
        }
        Update: {
          agent_id?: string
          category?: string
          city?: string
          created_at?: string
          id?: string
          max_price?: number | null
          subscriber_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "agent_subscriptions_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agent_subscriptions_subscriber_id_fkey"
            columns: ["subscriber_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      buyer_leads: {
        Row: {
          budget_max: number | null
          budget_min: number | null
          category: string
          city: string
          client_id: string | null
          contact_email: string
          contact_name: string
          contact_phone: string
          created_at: string
          id: string
          last_active_at: string
          listing_type: string
          max_sales: number
          price_rwf: number
          score: number
          sold_count: number
          status: string
          summary: string
        }
        Insert: {
          budget_max?: number | null
          budget_min?: number | null
          category?: string
          city?: string
          client_id?: string | null
          contact_email?: string
          contact_name?: string
          contact_phone?: string
          created_at?: string
          id?: string
          last_active_at?: string
          listing_type?: string
          max_sales?: number
          price_rwf?: number
          score?: number
          sold_count?: number
          status?: string
          summary?: string
        }
        Update: {
          budget_max?: number | null
          budget_min?: number | null
          category?: string
          city?: string
          client_id?: string | null
          contact_email?: string
          contact_name?: string
          contact_phone?: string
          created_at?: string
          id?: string
          last_active_at?: string
          listing_type?: string
          max_sales?: number
          price_rwf?: number
          score?: number
          sold_count?: number
          status?: string
          summary?: string
        }
        Relationships: [
          {
            foreignKeyName: "buyer_leads_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      deals: {
        Row: {
          agent_id: string
          client_contact: string
          client_name: string
          closed_on: string
          commission_pct: number
          created_at: string
          deal_type: string
          deal_value: number
          id: string
          notes: string
          property_id: string | null
          property_location: string
          property_title: string
          reference: string
          updated_at: string
        }
        Insert: {
          agent_id: string
          client_contact?: string
          client_name?: string
          closed_on?: string
          commission_pct?: number
          created_at?: string
          deal_type?: string
          deal_value?: number
          id?: string
          notes?: string
          property_id?: string | null
          property_location?: string
          property_title?: string
          reference?: string
          updated_at?: string
        }
        Update: {
          agent_id?: string
          client_contact?: string
          client_name?: string
          closed_on?: string
          commission_pct?: number
          created_at?: string
          deal_type?: string
          deal_value?: number
          id?: string
          notes?: string
          property_id?: string | null
          property_location?: string
          property_title?: string
          reference?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "deals_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deals_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      lead_purchases: {
        Row: {
          admin_note: string
          agent_id: string
          amount_rwf: number
          created_at: string
          id: string
          lead_id: string
          payment_reference: string
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          updated_at: string
        }
        Insert: {
          admin_note?: string
          agent_id: string
          amount_rwf?: number
          created_at?: string
          id?: string
          lead_id: string
          payment_reference?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          admin_note?: string
          agent_id?: string
          amount_rwf?: number
          created_at?: string
          id?: string
          lead_id?: string
          payment_reference?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "lead_purchases_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_purchases_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "buyer_leads"
            referencedColumns: ["id"]
          },
        ]
      }
      listing_boosts: {
        Row: {
          admin_note: string
          agent_id: string
          amount_rwf: number
          created_at: string
          days: number
          ends_at: string | null
          id: string
          payment_reference: string
          property_id: string
          reviewed_at: string | null
          reviewed_by: string | null
          starts_at: string | null
          status: string
          updated_at: string
        }
        Insert: {
          admin_note?: string
          agent_id: string
          amount_rwf?: number
          created_at?: string
          days?: number
          ends_at?: string | null
          id?: string
          payment_reference?: string
          property_id: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          starts_at?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          admin_note?: string
          agent_id?: string
          amount_rwf?: number
          created_at?: string
          days?: number
          ends_at?: string | null
          id?: string
          payment_reference?: string
          property_id?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          starts_at?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "listing_boosts_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "listing_boosts_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
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
      notifications: {
        Row: {
          body: string
          created_at: string
          id: string
          read_at: string | null
          title: string
          type: string
          url: string
          user_id: string
        }
        Insert: {
          body?: string
          created_at?: string
          id?: string
          read_at?: string | null
          title?: string
          type?: string
          url?: string
          user_id: string
        }
        Update: {
          body?: string
          created_at?: string
          id?: string
          read_at?: string | null
          title?: string
          type?: string
          url?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
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
          deals_closed: number
          email: string
          full_name: string
          id: string
          is_independent: boolean
          is_public_agent: boolean
          is_verified: boolean
          leads_opt_out: boolean
          phone: string | null
          photo_public_id: string
          plan: Database["public"]["Enums"]["subscription_plan"]
          plan_expires_at: string | null
          profile_photo_url: string | null
          show_deal_count: boolean
          social_facebook: string
          social_instagram: string
          social_linkedin: string
          social_tiktok: string
          specializations: string[]
          status: Database["public"]["Enums"]["account_status"]
          updated_at: string
          verified_expires_at: string | null
          whatsapp_business: string
        }
        Insert: {
          achievements?: string
          address?: string | null
          agency_name?: string | null
          bio?: string | null
          cancel_at_period_end?: boolean
          created_at?: string
          deals_closed?: number
          email?: string
          full_name?: string
          id: string
          is_independent?: boolean
          is_public_agent?: boolean
          is_verified?: boolean
          leads_opt_out?: boolean
          phone?: string | null
          photo_public_id?: string
          plan?: Database["public"]["Enums"]["subscription_plan"]
          plan_expires_at?: string | null
          profile_photo_url?: string | null
          show_deal_count?: boolean
          social_facebook?: string
          social_instagram?: string
          social_linkedin?: string
          social_tiktok?: string
          specializations?: string[]
          status?: Database["public"]["Enums"]["account_status"]
          updated_at?: string
          verified_expires_at?: string | null
          whatsapp_business?: string
        }
        Update: {
          achievements?: string
          address?: string | null
          agency_name?: string | null
          bio?: string | null
          cancel_at_period_end?: boolean
          created_at?: string
          deals_closed?: number
          email?: string
          full_name?: string
          id?: string
          is_independent?: boolean
          is_public_agent?: boolean
          is_verified?: boolean
          leads_opt_out?: boolean
          phone?: string | null
          photo_public_id?: string
          plan?: Database["public"]["Enums"]["subscription_plan"]
          plan_expires_at?: string | null
          profile_photo_url?: string | null
          show_deal_count?: boolean
          social_facebook?: string
          social_instagram?: string
          social_linkedin?: string
          social_tiktok?: string
          specializations?: string[]
          status?: Database["public"]["Enums"]["account_status"]
          updated_at?: string
          verified_expires_at?: string | null
          whatsapp_business?: string
        }
        Relationships: []
      }
      properties: {
        Row: {
          agent_id: string
          amenities: string[]
          area_sqm: number
          attributes: Json
          bathrooms: number
          bedrooms: number
          category: Database["public"]["Enums"]["property_category"]
          city: string
          created_at: string
          description: string
          district: string
          features: Json
          id: string
          image_public_ids: string[]
          images: string[]
          is_featured: boolean
          location: string
          negotiable: boolean
          price: number
          property_type: Database["public"]["Enums"]["property_type"]
          province: string
          sector: string
          status: Database["public"]["Enums"]["property_status"]
          title: string
          updated_at: string
        }
        Insert: {
          agent_id: string
          amenities?: string[]
          area_sqm?: number
          attributes?: Json
          bathrooms?: number
          bedrooms?: number
          category?: Database["public"]["Enums"]["property_category"]
          city?: string
          created_at?: string
          description?: string
          district?: string
          features?: Json
          id?: string
          image_public_ids?: string[]
          images?: string[]
          is_featured?: boolean
          location?: string
          negotiable?: boolean
          price?: number
          property_type?: Database["public"]["Enums"]["property_type"]
          province?: string
          sector?: string
          status?: Database["public"]["Enums"]["property_status"]
          title: string
          updated_at?: string
        }
        Update: {
          agent_id?: string
          amenities?: string[]
          area_sqm?: number
          attributes?: Json
          bathrooms?: number
          bedrooms?: number
          category?: Database["public"]["Enums"]["property_category"]
          city?: string
          created_at?: string
          description?: string
          district?: string
          features?: Json
          id?: string
          image_public_ids?: string[]
          images?: string[]
          is_featured?: boolean
          location?: string
          negotiable?: boolean
          price?: number
          property_type?: Database["public"]["Enums"]["property_type"]
          province?: string
          sector?: string
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
      saved_properties: {
        Row: {
          created_at: string
          id: string
          property_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          property_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          property_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "saved_properties_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "saved_properties_user_id_fkey"
            columns: ["user_id"]
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
      viewing_bookings: {
        Row: {
          agent_id: string
          client_id: string
          client_name: string
          client_phone: string
          created_at: string
          id: string
          note: string
          property_id: string | null
          starts_at: string
          status: string
          updated_at: string
        }
        Insert: {
          agent_id: string
          client_id: string
          client_name?: string
          client_phone?: string
          created_at?: string
          id?: string
          note?: string
          property_id?: string | null
          starts_at: string
          status?: string
          updated_at?: string
        }
        Update: {
          agent_id?: string
          client_id?: string
          client_name?: string
          client_phone?: string
          created_at?: string
          id?: string
          note?: string
          property_id?: string | null
          starts_at?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "viewing_bookings_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "viewing_bookings_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "viewing_bookings_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      viewing_slots: {
        Row: {
          agent_id: string
          created_at: string
          end_minute: number
          id: string
          start_minute: number
          weekday: number
        }
        Insert: {
          agent_id: string
          created_at?: string
          end_minute?: number
          id?: string
          start_minute?: number
          weekday: number
        }
        Update: {
          agent_id?: string
          created_at?: string
          end_minute?: number
          id?: string
          start_minute?: number
          weekday?: number
        }
        Relationships: [
          {
            foreignKeyName: "viewing_slots_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
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
      approve_lead_purchase: {
        Args: { _purchase_id: string }
        Returns: undefined
      }
      approve_listing_boost: { Args: { _boost_id: string }; Returns: undefined }
      approve_upgrade_request: {
        Args: { _request_id: string }
        Returns: undefined
      }
      assert_profiles_column_grants: { Args: never; Returns: undefined }
      current_plan: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["subscription_plan"]
      }
      expire_listing_boosts: { Args: never; Returns: undefined }
      generate_buyer_leads: { Args: never; Returns: number }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      lead_contact: {
        Args: { _lead_id: string }
        Returns: {
          email: string
          name: string
          phone: string
        }[]
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
      reject_lead_purchase: {
        Args: { _note: string; _purchase_id: string }
        Returns: undefined
      }
      reject_listing_boost: {
        Args: { _boost_id: string; _note: string }
        Returns: undefined
      }
      reject_upgrade_request: {
        Args: { _note: string; _request_id: string }
        Returns: undefined
      }
      retire_buyer_lead: { Args: { _lead_id: string }; Returns: undefined }
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
