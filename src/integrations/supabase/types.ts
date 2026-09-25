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
      ad_campaigns: {
        Row: {
          allowed_membership_tiers: string[] | null
          allowed_positions: string[] | null
          created_at: string | null
          current_impressions: number | null
          current_impressions_today: number | null
          end_at: string | null
          id: string
          last_impression_date: string | null
          max_impressions: number | null
          max_impressions_per_day: number | null
          max_impressions_per_user_per_day: number | null
          name: string
          notes: string | null
          priority: number
          start_at: string | null
          status: string
          target_cities: string[] | null
          target_countries: string[] | null
          target_devices: string[] | null
          target_postal_codes: string[] | null
          target_regions: string[] | null
          target_timezones: string[] | null
          updated_at: string | null
        }
        Insert: {
          allowed_membership_tiers?: string[] | null
          allowed_positions?: string[] | null
          created_at?: string | null
          current_impressions?: number | null
          current_impressions_today?: number | null
          end_at?: string | null
          id?: string
          last_impression_date?: string | null
          max_impressions?: number | null
          max_impressions_per_day?: number | null
          max_impressions_per_user_per_day?: number | null
          name: string
          notes?: string | null
          priority?: number
          start_at?: string | null
          status?: string
          target_cities?: string[] | null
          target_countries?: string[] | null
          target_devices?: string[] | null
          target_postal_codes?: string[] | null
          target_regions?: string[] | null
          target_timezones?: string[] | null
          updated_at?: string | null
        }
        Update: {
          allowed_membership_tiers?: string[] | null
          allowed_positions?: string[] | null
          created_at?: string | null
          current_impressions?: number | null
          current_impressions_today?: number | null
          end_at?: string | null
          id?: string
          last_impression_date?: string | null
          max_impressions?: number | null
          max_impressions_per_day?: number | null
          max_impressions_per_user_per_day?: number | null
          name?: string
          notes?: string | null
          priority?: number
          start_at?: string | null
          status?: string
          target_cities?: string[] | null
          target_countries?: string[] | null
          target_devices?: string[] | null
          target_postal_codes?: string[] | null
          target_regions?: string[] | null
          target_timezones?: string[] | null
          updated_at?: string | null
        }
        Relationships: []
      }
      ad_global_config: {
        Row: {
          created_at: string | null
          id: string
          midroll_interval_minutes: number | null
          midroll_pod_size: number | null
          postroll_pod_size: number | null
          preroll_pod_size: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          midroll_interval_minutes?: number | null
          midroll_pod_size?: number | null
          postroll_pod_size?: number | null
          preroll_pod_size?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          midroll_interval_minutes?: number | null
          midroll_pod_size?: number | null
          postroll_pod_size?: number | null
          preroll_pod_size?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      ad_impressions: {
        Row: {
          ad_id: string
          campaign_id: string | null
          channel_id: string | null
          completed: boolean | null
          content_id: string | null
          creative_id: string | null
          device_type: string | null
          duration_ms: number | null
          geo_city: string | null
          geo_country: string | null
          geo_postal: string | null
          geo_region: string | null
          id: string
          membership_tier: string | null
          played_at: string | null
          position: string
          profile_id: string | null
          time_zone: string | null
          user_id: string | null
        }
        Insert: {
          ad_id: string
          campaign_id?: string | null
          channel_id?: string | null
          completed?: boolean | null
          content_id?: string | null
          creative_id?: string | null
          device_type?: string | null
          duration_ms?: number | null
          geo_city?: string | null
          geo_country?: string | null
          geo_postal?: string | null
          geo_region?: string | null
          id?: string
          membership_tier?: string | null
          played_at?: string | null
          position: string
          profile_id?: string | null
          time_zone?: string | null
          user_id?: string | null
        }
        Update: {
          ad_id?: string
          campaign_id?: string | null
          channel_id?: string | null
          completed?: boolean | null
          content_id?: string | null
          creative_id?: string | null
          device_type?: string | null
          duration_ms?: number | null
          geo_city?: string | null
          geo_country?: string | null
          geo_postal?: string | null
          geo_region?: string | null
          id?: string
          membership_tier?: string | null
          played_at?: string | null
          position?: string
          profile_id?: string | null
          time_zone?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ad_impressions_ad_id_fkey"
            columns: ["ad_id"]
            isOneToOne: false
            referencedRelation: "ads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ad_impressions_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "ad_campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ad_impressions_channel_id_fkey"
            columns: ["channel_id"]
            isOneToOne: false
            referencedRelation: "live_channels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ad_impressions_channel_id_fkey"
            columns: ["channel_id"]
            isOneToOne: false
            referencedRelation: "live_channels_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ad_impressions_content_id_fkey"
            columns: ["content_id"]
            isOneToOne: false
            referencedRelation: "contents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ad_impressions_creative_id_fkey"
            columns: ["creative_id"]
            isOneToOne: false
            referencedRelation: "ads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ad_impressions_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      ad_midroll_pod_config: {
        Row: {
          break_1_pod_size: number | null
          break_2_pod_size: number | null
          break_3_pod_size: number | null
          break_4_pod_size: number | null
          channel_id: string | null
          content_id: string | null
          created_at: string | null
          id: string
          is_global: boolean | null
          updated_at: string | null
        }
        Insert: {
          break_1_pod_size?: number | null
          break_2_pod_size?: number | null
          break_3_pod_size?: number | null
          break_4_pod_size?: number | null
          channel_id?: string | null
          content_id?: string | null
          created_at?: string | null
          id?: string
          is_global?: boolean | null
          updated_at?: string | null
        }
        Update: {
          break_1_pod_size?: number | null
          break_2_pod_size?: number | null
          break_3_pod_size?: number | null
          break_4_pod_size?: number | null
          channel_id?: string | null
          content_id?: string | null
          created_at?: string | null
          id?: string
          is_global?: boolean | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ad_midroll_pod_config_channel_id_fkey"
            columns: ["channel_id"]
            isOneToOne: true
            referencedRelation: "live_channels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ad_midroll_pod_config_channel_id_fkey"
            columns: ["channel_id"]
            isOneToOne: true
            referencedRelation: "live_channels_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ad_midroll_pod_config_content_id_fkey"
            columns: ["content_id"]
            isOneToOne: true
            referencedRelation: "contents"
            referencedColumns: ["id"]
          },
        ]
      }
      ad_placements: {
        Row: {
          ad_id: string
          all_channels: boolean | null
          channel_id: string | null
          content_id: string | null
          created_at: string | null
          id: string
          indie_channel_id: string | null
          mid_enabled: boolean | null
          placement_type: string
          post_enabled: boolean | null
          pre_enabled: boolean | null
        }
        Insert: {
          ad_id: string
          all_channels?: boolean | null
          channel_id?: string | null
          content_id?: string | null
          created_at?: string | null
          id?: string
          indie_channel_id?: string | null
          mid_enabled?: boolean | null
          placement_type?: string
          post_enabled?: boolean | null
          pre_enabled?: boolean | null
        }
        Update: {
          ad_id?: string
          all_channels?: boolean | null
          channel_id?: string | null
          content_id?: string | null
          created_at?: string | null
          id?: string
          indie_channel_id?: string | null
          mid_enabled?: boolean | null
          placement_type?: string
          post_enabled?: boolean | null
          pre_enabled?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "ad_placements_ad_id_fkey"
            columns: ["ad_id"]
            isOneToOne: false
            referencedRelation: "ads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ad_placements_channel_id_fkey"
            columns: ["channel_id"]
            isOneToOne: false
            referencedRelation: "live_channels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ad_placements_channel_id_fkey"
            columns: ["channel_id"]
            isOneToOne: false
            referencedRelation: "live_channels_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ad_placements_content_id_fkey"
            columns: ["content_id"]
            isOneToOne: false
            referencedRelation: "contents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ad_placements_indie_channel_id_fkey"
            columns: ["indie_channel_id"]
            isOneToOne: false
            referencedRelation: "indie_channels"
            referencedColumns: ["id"]
          },
        ]
      }
      ad_pod_config: {
        Row: {
          channel_id: string | null
          content_id: string | null
          created_at: string | null
          enabled: boolean | null
          id: string
          max_midroll_count: number | null
          midroll_interval_minutes: number | null
          midroll_pod_size: number | null
          postroll_pod_size: number | null
          preroll_pod_size: number | null
          updated_at: string | null
        }
        Insert: {
          channel_id?: string | null
          content_id?: string | null
          created_at?: string | null
          enabled?: boolean | null
          id?: string
          max_midroll_count?: number | null
          midroll_interval_minutes?: number | null
          midroll_pod_size?: number | null
          postroll_pod_size?: number | null
          preroll_pod_size?: number | null
          updated_at?: string | null
        }
        Update: {
          channel_id?: string | null
          content_id?: string | null
          created_at?: string | null
          enabled?: boolean | null
          id?: string
          max_midroll_count?: number | null
          midroll_interval_minutes?: number | null
          midroll_pod_size?: number | null
          postroll_pod_size?: number | null
          preroll_pod_size?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ad_pod_config_channel_id_fkey"
            columns: ["channel_id"]
            isOneToOne: true
            referencedRelation: "live_channels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ad_pod_config_channel_id_fkey"
            columns: ["channel_id"]
            isOneToOne: true
            referencedRelation: "live_channels_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ad_pod_config_content_id_fkey"
            columns: ["content_id"]
            isOneToOne: true
            referencedRelation: "contents"
            referencedColumns: ["id"]
          },
        ]
      }
      ad_targeting: {
        Row: {
          ad_id: string
          cities: string[] | null
          countries: string[] | null
          created_at: string | null
          device_types: string[] | null
          id: string
          membership_tiers: string[] | null
          postal_codes: string[] | null
          regions: string[] | null
          time_zones: string[] | null
          updated_at: string | null
        }
        Insert: {
          ad_id: string
          cities?: string[] | null
          countries?: string[] | null
          created_at?: string | null
          device_types?: string[] | null
          id?: string
          membership_tiers?: string[] | null
          postal_codes?: string[] | null
          regions?: string[] | null
          time_zones?: string[] | null
          updated_at?: string | null
        }
        Update: {
          ad_id?: string
          cities?: string[] | null
          countries?: string[] | null
          created_at?: string | null
          device_types?: string[] | null
          id?: string
          membership_tiers?: string[] | null
          postal_codes?: string[] | null
          regions?: string[] | null
          time_zones?: string[] | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ad_targeting_ad_id_fkey"
            columns: ["ad_id"]
            isOneToOne: true
            referencedRelation: "ads"
            referencedColumns: ["id"]
          },
        ]
      }
      ads: {
        Row: {
          ad_type: string
          click_through_url: string | null
          created_at: string | null
          current_impressions: number | null
          duration_seconds: number
          end_at: string | null
          frequency_cap_per_user_per_day: number | null
          id: string
          is_active: boolean | null
          max_impressions: number | null
          name: string
          pod_position: number | null
          position_mid: boolean | null
          position_post: boolean | null
          position_pre: boolean | null
          start_at: string | null
          status: string
          vast_tag_url: string | null
          video_url: string
          weight: number | null
        }
        Insert: {
          ad_type: string
          click_through_url?: string | null
          created_at?: string | null
          current_impressions?: number | null
          duration_seconds: number
          end_at?: string | null
          frequency_cap_per_user_per_day?: number | null
          id?: string
          is_active?: boolean | null
          max_impressions?: number | null
          name: string
          pod_position?: number | null
          position_mid?: boolean | null
          position_post?: boolean | null
          position_pre?: boolean | null
          start_at?: string | null
          status?: string
          vast_tag_url?: string | null
          video_url: string
          weight?: number | null
        }
        Update: {
          ad_type?: string
          click_through_url?: string | null
          created_at?: string | null
          current_impressions?: number | null
          duration_seconds?: number
          end_at?: string | null
          frequency_cap_per_user_per_day?: number | null
          id?: string
          is_active?: boolean | null
          max_impressions?: number | null
          name?: string
          pod_position?: number | null
          position_mid?: boolean | null
          position_post?: boolean | null
          position_pre?: boolean | null
          start_at?: string | null
          status?: string
          vast_tag_url?: string | null
          video_url?: string
          weight?: number | null
        }
        Relationships: []
      }
      auth_backgrounds: {
        Row: {
          created_at: string
          id: string
          image_url: string
          is_active: boolean
          sort_order: number
        }
        Insert: {
          created_at?: string
          id?: string
          image_url: string
          is_active?: boolean
          sort_order?: number
        }
        Update: {
          created_at?: string
          id?: string
          image_url?: string
          is_active?: boolean
          sort_order?: number
        }
        Relationships: []
      }
      campaign_channels: {
        Row: {
          campaign_id: string
          channel_id: string
          channel_type: string
          created_at: string | null
          id: string
        }
        Insert: {
          campaign_id: string
          channel_id: string
          channel_type?: string
          created_at?: string | null
          id?: string
        }
        Update: {
          campaign_id?: string
          channel_id?: string
          channel_type?: string
          created_at?: string | null
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "campaign_channels_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "ad_campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      campaign_content_items: {
        Row: {
          campaign_id: string
          content_id: string
          created_at: string | null
          id: string
        }
        Insert: {
          campaign_id: string
          content_id: string
          created_at?: string | null
          id?: string
        }
        Update: {
          campaign_id?: string
          content_id?: string
          created_at?: string | null
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "campaign_content_items_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "ad_campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "campaign_content_items_content_id_fkey"
            columns: ["content_id"]
            isOneToOne: false
            referencedRelation: "contents"
            referencedColumns: ["id"]
          },
        ]
      }
      campaign_creatives: {
        Row: {
          campaign_id: string
          created_at: string | null
          creative_id: string
          id: string
          weight: number
        }
        Insert: {
          campaign_id: string
          created_at?: string | null
          creative_id: string
          id?: string
          weight?: number
        }
        Update: {
          campaign_id?: string
          created_at?: string | null
          creative_id?: string
          id?: string
          weight?: number
        }
        Relationships: [
          {
            foreignKeyName: "campaign_creatives_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "ad_campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "campaign_creatives_creative_id_fkey"
            columns: ["creative_id"]
            isOneToOne: false
            referencedRelation: "ads"
            referencedColumns: ["id"]
          },
        ]
      }
      casting_applications: {
        Row: {
          admin_notes: string | null
          admin_rating: number | null
          answers: Json | null
          applied_at: string | null
          casting_call_id: string
          cover_letter: string | null
          id: string
          pay_acceptance_timestamp: string | null
          profile_snapshot: Json | null
          role_ids: string[] | null
          show_id: string | null
          status: string | null
          talent_id: string
          terms_acceptance_timestamp: string | null
        }
        Insert: {
          admin_notes?: string | null
          admin_rating?: number | null
          answers?: Json | null
          applied_at?: string | null
          casting_call_id: string
          cover_letter?: string | null
          id?: string
          pay_acceptance_timestamp?: string | null
          profile_snapshot?: Json | null
          role_ids?: string[] | null
          show_id?: string | null
          status?: string | null
          talent_id: string
          terms_acceptance_timestamp?: string | null
        }
        Update: {
          admin_notes?: string | null
          admin_rating?: number | null
          answers?: Json | null
          applied_at?: string | null
          casting_call_id?: string
          cover_letter?: string | null
          id?: string
          pay_acceptance_timestamp?: string | null
          profile_snapshot?: Json | null
          role_ids?: string[] | null
          show_id?: string | null
          status?: string | null
          talent_id?: string
          terms_acceptance_timestamp?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "casting_applications_casting_call_id_fkey"
            columns: ["casting_call_id"]
            isOneToOne: false
            referencedRelation: "casting_calls"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "casting_applications_show_id_fkey"
            columns: ["show_id"]
            isOneToOne: false
            referencedRelation: "casting_shows"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "casting_applications_talent_id_fkey"
            columns: ["talent_id"]
            isOneToOne: false
            referencedRelation: "talents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "casting_applications_talent_id_fkey"
            columns: ["talent_id"]
            isOneToOne: false
            referencedRelation: "talents_public"
            referencedColumns: ["id"]
          },
        ]
      }
      casting_calls: {
        Row: {
          age_range: string | null
          category: Database["public"]["Enums"]["talent_category"]
          compensation: string | null
          created_at: string | null
          created_by: string | null
          deadline: string | null
          description: string | null
          gender: string | null
          id: string
          is_active: boolean | null
          is_featured: boolean | null
          location: string | null
          poster_url: string | null
          project_name: string | null
          requirements: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          age_range?: string | null
          category?: Database["public"]["Enums"]["talent_category"]
          compensation?: string | null
          created_at?: string | null
          created_by?: string | null
          deadline?: string | null
          description?: string | null
          gender?: string | null
          id?: string
          is_active?: boolean | null
          is_featured?: boolean | null
          location?: string | null
          poster_url?: string | null
          project_name?: string | null
          requirements?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          age_range?: string | null
          category?: Database["public"]["Enums"]["talent_category"]
          compensation?: string | null
          created_at?: string | null
          created_by?: string | null
          deadline?: string | null
          description?: string | null
          gender?: string | null
          id?: string
          is_active?: boolean | null
          is_featured?: boolean | null
          location?: string | null
          poster_url?: string | null
          project_name?: string | null
          requirements?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      casting_email_config: {
        Row: {
          created_at: string | null
          email_type: string
          emails: string[]
          id: string
          is_active: boolean | null
          role_id: string | null
          show_id: string | null
        }
        Insert: {
          created_at?: string | null
          email_type: string
          emails?: string[]
          id?: string
          is_active?: boolean | null
          role_id?: string | null
          show_id?: string | null
        }
        Update: {
          created_at?: string | null
          email_type?: string
          emails?: string[]
          id?: string
          is_active?: boolean | null
          role_id?: string | null
          show_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "casting_email_config_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "casting_roles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "casting_email_config_show_id_fkey"
            columns: ["show_id"]
            isOneToOne: false
            referencedRelation: "casting_shows"
            referencedColumns: ["id"]
          },
        ]
      }
      casting_hero_banners: {
        Row: {
          button_text: string | null
          button_url: string | null
          created_at: string | null
          id: string
          image_url: string
          is_active: boolean | null
          sort_order: number | null
          subtitle: string | null
          title: string
        }
        Insert: {
          button_text?: string | null
          button_url?: string | null
          created_at?: string | null
          id?: string
          image_url: string
          is_active?: boolean | null
          sort_order?: number | null
          subtitle?: string | null
          title: string
        }
        Update: {
          button_text?: string | null
          button_url?: string | null
          created_at?: string | null
          id?: string
          image_url?: string
          is_active?: boolean | null
          sort_order?: number | null
          subtitle?: string | null
          title?: string
        }
        Relationships: []
      }
      casting_roles: {
        Row: {
          casting_email: string | null
          created_at: string | null
          custom_questions: Json | null
          deadline: string | null
          description: string | null
          id: string
          is_remote: boolean | null
          location_notes: string | null
          pay_amount: string | null
          pay_type: string | null
          payment_terms: string | null
          requirements: string | null
          role_type: string
          shoot_dates: string | null
          show_id: string
          sort_order: number | null
          spots_available: number
          status: string
          terms_conditions: string | null
          time_commitment: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          casting_email?: string | null
          created_at?: string | null
          custom_questions?: Json | null
          deadline?: string | null
          description?: string | null
          id?: string
          is_remote?: boolean | null
          location_notes?: string | null
          pay_amount?: string | null
          pay_type?: string | null
          payment_terms?: string | null
          requirements?: string | null
          role_type?: string
          shoot_dates?: string | null
          show_id: string
          sort_order?: number | null
          spots_available?: number
          status?: string
          terms_conditions?: string | null
          time_commitment?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          casting_email?: string | null
          created_at?: string | null
          custom_questions?: Json | null
          deadline?: string | null
          description?: string | null
          id?: string
          is_remote?: boolean | null
          location_notes?: string | null
          pay_amount?: string | null
          pay_type?: string | null
          payment_terms?: string | null
          requirements?: string | null
          role_type?: string
          shoot_dates?: string | null
          show_id?: string
          sort_order?: number | null
          spots_available?: number
          status?: string
          terms_conditions?: string | null
          time_commitment?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "casting_roles_show_id_fkey"
            columns: ["show_id"]
            isOneToOne: false
            referencedRelation: "casting_shows"
            referencedColumns: ["id"]
          },
        ]
      }
      casting_shows: {
        Row: {
          casting_email: string | null
          created_at: string | null
          deadline: string | null
          description: string | null
          filming_dates: string | null
          filming_location: string | null
          id: string
          is_featured: boolean | null
          logline: string | null
          pay_range_max: number | null
          pay_range_min: number | null
          poster_url: string | null
          production_notes: string | null
          slug: string
          status: string
          title: string
          trailer_url: string | null
          updated_at: string | null
        }
        Insert: {
          casting_email?: string | null
          created_at?: string | null
          deadline?: string | null
          description?: string | null
          filming_dates?: string | null
          filming_location?: string | null
          id?: string
          is_featured?: boolean | null
          logline?: string | null
          pay_range_max?: number | null
          pay_range_min?: number | null
          poster_url?: string | null
          production_notes?: string | null
          slug: string
          status?: string
          title: string
          trailer_url?: string | null
          updated_at?: string | null
        }
        Update: {
          casting_email?: string | null
          created_at?: string | null
          deadline?: string | null
          description?: string | null
          filming_dates?: string | null
          filming_location?: string | null
          id?: string
          is_featured?: boolean | null
          logline?: string | null
          pay_range_max?: number | null
          pay_range_min?: number | null
          poster_url?: string | null
          production_notes?: string | null
          slug?: string
          status?: string
          title?: string
          trailer_url?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      categories: {
        Row: {
          content_type: string
          created_at: string
          description: string | null
          id: string
          name: string
          slug: string
        }
        Insert: {
          content_type: string
          created_at?: string
          description?: string | null
          id?: string
          name: string
          slug: string
        }
        Update: {
          content_type?: string
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          slug?: string
        }
        Relationships: []
      }
      channel_notifications: {
        Row: {
          content_id: string | null
          created_at: string | null
          id: string
          indie_channel_id: string
          is_read: boolean | null
          message: string
          profile_id: string
        }
        Insert: {
          content_id?: string | null
          created_at?: string | null
          id?: string
          indie_channel_id: string
          is_read?: boolean | null
          message: string
          profile_id: string
        }
        Update: {
          content_id?: string | null
          created_at?: string | null
          id?: string
          indie_channel_id?: string
          is_read?: boolean | null
          message?: string
          profile_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "channel_notifications_content_id_fkey"
            columns: ["content_id"]
            isOneToOne: false
            referencedRelation: "contents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "channel_notifications_indie_channel_id_fkey"
            columns: ["indie_channel_id"]
            isOneToOne: false
            referencedRelation: "indie_channels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "channel_notifications_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      channel_views: {
        Row: {
          content_id: string | null
          device_type: string | null
          duration_seconds: number | null
          geo_city: string | null
          geo_country: string | null
          geo_postal: string | null
          geo_region: string | null
          id: string
          indie_channel_id: string | null
          live_channel_id: string | null
          profile_id: string | null
          progress_percent: number | null
          time_zone: string | null
          user_id: string | null
          watched_at: string
        }
        Insert: {
          content_id?: string | null
          device_type?: string | null
          duration_seconds?: number | null
          geo_city?: string | null
          geo_country?: string | null
          geo_postal?: string | null
          geo_region?: string | null
          id?: string
          indie_channel_id?: string | null
          live_channel_id?: string | null
          profile_id?: string | null
          progress_percent?: number | null
          time_zone?: string | null
          user_id?: string | null
          watched_at?: string
        }
        Update: {
          content_id?: string | null
          device_type?: string | null
          duration_seconds?: number | null
          geo_city?: string | null
          geo_country?: string | null
          geo_postal?: string | null
          geo_region?: string | null
          id?: string
          indie_channel_id?: string | null
          live_channel_id?: string | null
          profile_id?: string | null
          progress_percent?: number | null
          time_zone?: string | null
          user_id?: string | null
          watched_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "channel_views_content_id_fkey"
            columns: ["content_id"]
            isOneToOne: false
            referencedRelation: "contents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "channel_views_indie_channel_id_fkey"
            columns: ["indie_channel_id"]
            isOneToOne: false
            referencedRelation: "indie_channels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "channel_views_live_channel_id_fkey"
            columns: ["live_channel_id"]
            isOneToOne: false
            referencedRelation: "live_channels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "channel_views_live_channel_id_fkey"
            columns: ["live_channel_id"]
            isOneToOne: false
            referencedRelation: "live_channels_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "channel_views_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      content_membership_plans: {
        Row: {
          content_id: string
          created_at: string
          id: string
          plan_id: string
        }
        Insert: {
          content_id: string
          created_at?: string
          id?: string
          plan_id: string
        }
        Update: {
          content_id?: string
          created_at?: string
          id?: string
          plan_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "content_membership_plans_content_id_fkey"
            columns: ["content_id"]
            isOneToOne: false
            referencedRelation: "contents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "content_membership_plans_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "membership_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      content_tags: {
        Row: {
          content_id: string
          created_at: string
          id: string
          tag_id: string
        }
        Insert: {
          content_id: string
          created_at?: string
          id?: string
          tag_id: string
        }
        Update: {
          content_id?: string
          created_at?: string
          id?: string
          tag_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "content_tags_content_id_fkey"
            columns: ["content_id"]
            isOneToOne: false
            referencedRelation: "contents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "content_tags_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "tags"
            referencedColumns: ["id"]
          },
        ]
      }
      contents: {
        Row: {
          audio_languages: string[] | null
          backdrop_url: string | null
          cast_members: string[] | null
          channels: string[] | null
          created_at: string
          creator: string | null
          crew_members: Json | null
          description: string | null
          download_enabled: boolean | null
          download_url: string | null
          duration: string | null
          featured: boolean | null
          genre: string | null
          id: string
          indie_channel_id: string | null
          is_affiliate_url: boolean | null
          is_coming_soon: boolean | null
          is_zoe_original: boolean | null
          logo_url: string | null
          maturity_rating: string | null
          midroll_config: Json | null
          poster_url: string | null
          rating: string | null
          release_year: number | null
          subtitle_languages: string[] | null
          subtitles: Json | null
          title: string
          top_rank: number | null
          trailer_url: string | null
          type: string
          vast_ad_midroll: string | null
          vast_ad_postroll: string | null
          vast_ad_preroll: string | null
          video_sources: Json | null
          video_url: string | null
        }
        Insert: {
          audio_languages?: string[] | null
          backdrop_url?: string | null
          cast_members?: string[] | null
          channels?: string[] | null
          created_at?: string
          creator?: string | null
          crew_members?: Json | null
          description?: string | null
          download_enabled?: boolean | null
          download_url?: string | null
          duration?: string | null
          featured?: boolean | null
          genre?: string | null
          id?: string
          indie_channel_id?: string | null
          is_affiliate_url?: boolean | null
          is_coming_soon?: boolean | null
          is_zoe_original?: boolean | null
          logo_url?: string | null
          maturity_rating?: string | null
          midroll_config?: Json | null
          poster_url?: string | null
          rating?: string | null
          release_year?: number | null
          subtitle_languages?: string[] | null
          subtitles?: Json | null
          title: string
          top_rank?: number | null
          trailer_url?: string | null
          type: string
          vast_ad_midroll?: string | null
          vast_ad_postroll?: string | null
          vast_ad_preroll?: string | null
          video_sources?: Json | null
          video_url?: string | null
        }
        Update: {
          audio_languages?: string[] | null
          backdrop_url?: string | null
          cast_members?: string[] | null
          channels?: string[] | null
          created_at?: string
          creator?: string | null
          crew_members?: Json | null
          description?: string | null
          download_enabled?: boolean | null
          download_url?: string | null
          duration?: string | null
          featured?: boolean | null
          genre?: string | null
          id?: string
          indie_channel_id?: string | null
          is_affiliate_url?: boolean | null
          is_coming_soon?: boolean | null
          is_zoe_original?: boolean | null
          logo_url?: string | null
          maturity_rating?: string | null
          midroll_config?: Json | null
          poster_url?: string | null
          rating?: string | null
          release_year?: number | null
          subtitle_languages?: string[] | null
          subtitles?: Json | null
          title?: string
          top_rank?: number | null
          trailer_url?: string | null
          type?: string
          vast_ad_midroll?: string | null
          vast_ad_postroll?: string | null
          vast_ad_preroll?: string | null
          video_sources?: Json | null
          video_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contents_indie_channel_id_fkey"
            columns: ["indie_channel_id"]
            isOneToOne: false
            referencedRelation: "indie_channels"
            referencedColumns: ["id"]
          },
        ]
      }
      conversations: {
        Row: {
          created_at: string | null
          department_id: string
          id: string
          last_message_at: string | null
          show_id: string | null
          subject: string | null
          talent_id: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          department_id: string
          id?: string
          last_message_at?: string | null
          show_id?: string | null
          subject?: string | null
          talent_id?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          department_id?: string
          id?: string
          last_message_at?: string | null
          show_id?: string | null
          subject?: string | null
          talent_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversations_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversations_show_id_fkey"
            columns: ["show_id"]
            isOneToOne: false
            referencedRelation: "casting_shows"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversations_talent_id_fkey"
            columns: ["talent_id"]
            isOneToOne: false
            referencedRelation: "talents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversations_talent_id_fkey"
            columns: ["talent_id"]
            isOneToOne: false
            referencedRelation: "talents_public"
            referencedColumns: ["id"]
          },
        ]
      }
      creator_plans: {
        Row: {
          allow_ads: boolean | null
          analytics_level: string | null
          can_go_live: boolean | null
          can_upload_shows: boolean | null
          created_at: string | null
          custom_branding: boolean | null
          features: string[] | null
          id: string
          max_rows: number | null
          max_total_videos: number | null
          max_videos_per_row: number | null
          name: string
          price: number | null
          revenue_share_eligible: boolean | null
          slug: string
          sort_order: number | null
        }
        Insert: {
          allow_ads?: boolean | null
          analytics_level?: string | null
          can_go_live?: boolean | null
          can_upload_shows?: boolean | null
          created_at?: string | null
          custom_branding?: boolean | null
          features?: string[] | null
          id?: string
          max_rows?: number | null
          max_total_videos?: number | null
          max_videos_per_row?: number | null
          name: string
          price?: number | null
          revenue_share_eligible?: boolean | null
          slug: string
          sort_order?: number | null
        }
        Update: {
          allow_ads?: boolean | null
          analytics_level?: string | null
          can_go_live?: boolean | null
          can_upload_shows?: boolean | null
          created_at?: string | null
          custom_branding?: boolean | null
          features?: string[] | null
          id?: string
          max_rows?: number | null
          max_total_videos?: number | null
          max_videos_per_row?: number | null
          name?: string
          price?: number | null
          revenue_share_eligible?: boolean | null
          slug?: string
          sort_order?: number | null
        }
        Relationships: []
      }
      crew_applications: {
        Row: {
          admin_notes: string | null
          admin_rating: number | null
          answers: Json | null
          applied_at: string | null
          cover_letter: string | null
          id: string
          pay_acceptance_timestamp: string | null
          position_id: string
          profile_snapshot: Json | null
          show_id: string | null
          status: string | null
          talent_id: string
          terms_acceptance_timestamp: string | null
        }
        Insert: {
          admin_notes?: string | null
          admin_rating?: number | null
          answers?: Json | null
          applied_at?: string | null
          cover_letter?: string | null
          id?: string
          pay_acceptance_timestamp?: string | null
          position_id: string
          profile_snapshot?: Json | null
          show_id?: string | null
          status?: string | null
          talent_id: string
          terms_acceptance_timestamp?: string | null
        }
        Update: {
          admin_notes?: string | null
          admin_rating?: number | null
          answers?: Json | null
          applied_at?: string | null
          cover_letter?: string | null
          id?: string
          pay_acceptance_timestamp?: string | null
          position_id?: string
          profile_snapshot?: Json | null
          show_id?: string | null
          status?: string | null
          talent_id?: string
          terms_acceptance_timestamp?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "crew_applications_position_id_fkey"
            columns: ["position_id"]
            isOneToOne: false
            referencedRelation: "crew_positions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crew_applications_show_id_fkey"
            columns: ["show_id"]
            isOneToOne: false
            referencedRelation: "casting_shows"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crew_applications_talent_id_fkey"
            columns: ["talent_id"]
            isOneToOne: false
            referencedRelation: "talents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crew_applications_talent_id_fkey"
            columns: ["talent_id"]
            isOneToOne: false
            referencedRelation: "talents_public"
            referencedColumns: ["id"]
          },
        ]
      }
      crew_positions: {
        Row: {
          created_at: string | null
          deadline: string | null
          department_id: string
          description: string | null
          gear_required: string | null
          id: string
          is_remote: boolean | null
          is_template: boolean | null
          location: string | null
          pay_amount: string | null
          rate_type: string | null
          required_experience: string | null
          responsibilities: string | null
          schedule_expectations: string | null
          show_id: string | null
          sort_order: number | null
          status: string | null
          template_position_id: string | null
          terms_conditions: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          deadline?: string | null
          department_id: string
          description?: string | null
          gear_required?: string | null
          id?: string
          is_remote?: boolean | null
          is_template?: boolean | null
          location?: string | null
          pay_amount?: string | null
          rate_type?: string | null
          required_experience?: string | null
          responsibilities?: string | null
          schedule_expectations?: string | null
          show_id?: string | null
          sort_order?: number | null
          status?: string | null
          template_position_id?: string | null
          terms_conditions?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          deadline?: string | null
          department_id?: string
          description?: string | null
          gear_required?: string | null
          id?: string
          is_remote?: boolean | null
          is_template?: boolean | null
          location?: string | null
          pay_amount?: string | null
          rate_type?: string | null
          required_experience?: string | null
          responsibilities?: string | null
          schedule_expectations?: string | null
          show_id?: string | null
          sort_order?: number | null
          status?: string | null
          template_position_id?: string | null
          terms_conditions?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "crew_positions_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crew_positions_show_id_fkey"
            columns: ["show_id"]
            isOneToOne: false
            referencedRelation: "casting_shows"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crew_positions_template_position_id_fkey"
            columns: ["template_position_id"]
            isOneToOne: false
            referencedRelation: "crew_positions"
            referencedColumns: ["id"]
          },
        ]
      }
      department_messages: {
        Row: {
          attachments: Json | null
          content: string
          conversation_id: string
          created_at: string | null
          department_id: string
          id: string
          is_read: boolean | null
          sender_id: string
          sender_type: string
          show_id: string | null
        }
        Insert: {
          attachments?: Json | null
          content: string
          conversation_id: string
          created_at?: string | null
          department_id: string
          id?: string
          is_read?: boolean | null
          sender_id: string
          sender_type: string
          show_id?: string | null
        }
        Update: {
          attachments?: Json | null
          content?: string
          conversation_id?: string
          created_at?: string | null
          department_id?: string
          id?: string
          is_read?: boolean | null
          sender_id?: string
          sender_type?: string
          show_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "department_messages_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "department_messages_show_id_fkey"
            columns: ["show_id"]
            isOneToOne: false
            referencedRelation: "casting_shows"
            referencedColumns: ["id"]
          },
        ]
      }
      department_staff: {
        Row: {
          created_at: string | null
          department_id: string
          email: string | null
          id: string
          is_active: boolean | null
          name: string
          permissions: Json | null
          phone: string | null
          title: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          department_id: string
          email?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          permissions?: Json | null
          phone?: string | null
          title?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          department_id?: string
          email?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          permissions?: Json | null
          phone?: string | null
          title?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "department_staff_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
        ]
      }
      departments: {
        Row: {
          contact_email: string | null
          created_at: string | null
          default_description: string | null
          description: string | null
          id: string
          is_hiring: boolean | null
          name: string
          slug: string
          sort_order: number | null
          updated_at: string | null
        }
        Insert: {
          contact_email?: string | null
          created_at?: string | null
          default_description?: string | null
          description?: string | null
          id?: string
          is_hiring?: boolean | null
          name: string
          slug: string
          sort_order?: number | null
          updated_at?: string | null
        }
        Update: {
          contact_email?: string | null
          created_at?: string | null
          default_description?: string | null
          description?: string | null
          id?: string
          is_hiring?: boolean | null
          name?: string
          slug?: string
          sort_order?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      email_notification_triggers: {
        Row: {
          created_at: string | null
          id: string
          is_enabled: boolean | null
          trigger_type: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_enabled?: boolean | null
          trigger_type: string
        }
        Update: {
          created_at?: string | null
          id?: string
          is_enabled?: boolean | null
          trigger_type?: string
        }
        Relationships: []
      }
      email_routing_settings: {
        Row: {
          created_at: string | null
          department_id: string | null
          emails: string[]
          id: string
          is_active: boolean | null
          setting_type: string
          show_id: string | null
        }
        Insert: {
          created_at?: string | null
          department_id?: string | null
          emails?: string[]
          id?: string
          is_active?: boolean | null
          setting_type: string
          show_id?: string | null
        }
        Update: {
          created_at?: string | null
          department_id?: string | null
          emails?: string[]
          id?: string
          is_active?: boolean | null
          setting_type?: string
          show_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "email_routing_settings_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_routing_settings_show_id_fkey"
            columns: ["show_id"]
            isOneToOne: false
            referencedRelation: "casting_shows"
            referencedColumns: ["id"]
          },
        ]
      }
      episodes: {
        Row: {
          created_at: string
          description: string | null
          duration: string | null
          episode_number: number
          id: string
          season_id: string
          thumbnail_url: string | null
          title: string
          vast_ad_url: string | null
          video_url: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          duration?: string | null
          episode_number: number
          id?: string
          season_id: string
          thumbnail_url?: string | null
          title: string
          vast_ad_url?: string | null
          video_url?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          duration?: string | null
          episode_number?: number
          id?: string
          season_id?: string
          thumbnail_url?: string | null
          title?: string
          vast_ad_url?: string | null
          video_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "episodes_season_id_fkey"
            columns: ["season_id"]
            isOneToOne: false
            referencedRelation: "seasons"
            referencedColumns: ["id"]
          },
        ]
      }
      favorites: {
        Row: {
          content_id: string
          created_at: string | null
          id: string
          profile_id: string
        }
        Insert: {
          content_id: string
          created_at?: string | null
          id?: string
          profile_id: string
        }
        Update: {
          content_id?: string
          created_at?: string | null
          id?: string
          profile_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "favorites_content_id_fkey"
            columns: ["content_id"]
            isOneToOne: false
            referencedRelation: "contents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "favorites_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      indie_channel_categories: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          indie_channel_id: string
          name: string
          slug: string
          sort_order: number | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          indie_channel_id: string
          name: string
          slug: string
          sort_order?: number | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          indie_channel_id?: string
          name?: string
          slug?: string
          sort_order?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "indie_channel_categories_indie_channel_id_fkey"
            columns: ["indie_channel_id"]
            isOneToOne: false
            referencedRelation: "indie_channels"
            referencedColumns: ["id"]
          },
        ]
      }
      indie_channel_category_items: {
        Row: {
          category_id: string
          content_id: string
          created_at: string | null
          id: string
          sort_order: number | null
        }
        Insert: {
          category_id: string
          content_id: string
          created_at?: string | null
          id?: string
          sort_order?: number | null
        }
        Update: {
          category_id?: string
          content_id?: string
          created_at?: string | null
          id?: string
          sort_order?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "indie_channel_category_items_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "indie_channel_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "indie_channel_category_items_content_id_fkey"
            columns: ["content_id"]
            isOneToOne: false
            referencedRelation: "contents"
            referencedColumns: ["id"]
          },
        ]
      }
      indie_channel_favorites: {
        Row: {
          created_at: string | null
          id: string
          indie_channel_id: string
          profile_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          indie_channel_id: string
          profile_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          indie_channel_id?: string
          profile_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "indie_channel_favorites_indie_channel_id_fkey"
            columns: ["indie_channel_id"]
            isOneToOne: false
            referencedRelation: "indie_channels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "indie_channel_favorites_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      indie_channels: {
        Row: {
          allow_ads: boolean | null
          allowed_countries: string[] | null
          allowed_regions: string[] | null
          analytics_access: boolean | null
          backdrop_url: string | null
          can_go_live: boolean | null
          created_at: string | null
          custom_branding_enabled: boolean | null
          description: string | null
          id: string
          is_active: boolean | null
          logo_url: string | null
          max_rows: number | null
          max_total_videos: number | null
          max_videos_per_row: number | null
          name: string
          owner_id: string | null
          revenue_share_percent: number | null
          slug: string
          trailer_url: string | null
          updated_at: string | null
        }
        Insert: {
          allow_ads?: boolean | null
          allowed_countries?: string[] | null
          allowed_regions?: string[] | null
          analytics_access?: boolean | null
          backdrop_url?: string | null
          can_go_live?: boolean | null
          created_at?: string | null
          custom_branding_enabled?: boolean | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          logo_url?: string | null
          max_rows?: number | null
          max_total_videos?: number | null
          max_videos_per_row?: number | null
          name: string
          owner_id?: string | null
          revenue_share_percent?: number | null
          slug: string
          trailer_url?: string | null
          updated_at?: string | null
        }
        Update: {
          allow_ads?: boolean | null
          allowed_countries?: string[] | null
          allowed_regions?: string[] | null
          analytics_access?: boolean | null
          backdrop_url?: string | null
          can_go_live?: boolean | null
          created_at?: string | null
          custom_branding_enabled?: boolean | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          logo_url?: string | null
          max_rows?: number | null
          max_total_videos?: number | null
          max_videos_per_row?: number | null
          name?: string
          owner_id?: string | null
          revenue_share_percent?: number | null
          slug?: string
          trailer_url?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      likes: {
        Row: {
          content_id: string
          created_at: string | null
          id: string
          profile_id: string
          rating: number | null
        }
        Insert: {
          content_id: string
          created_at?: string | null
          id?: string
          profile_id: string
          rating?: number | null
        }
        Update: {
          content_id?: string
          created_at?: string | null
          id?: string
          profile_id?: string
          rating?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "likes_content_id_fkey"
            columns: ["content_id"]
            isOneToOne: false
            referencedRelation: "contents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "likes_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      live_ad_breaks: {
        Row: {
          ad_pod_length_seconds: number
          channel_playlist_id: string
          created_at: string | null
          id: string
          interval_minutes: number
          is_active: boolean | null
        }
        Insert: {
          ad_pod_length_seconds?: number
          channel_playlist_id: string
          created_at?: string | null
          id?: string
          interval_minutes?: number
          is_active?: boolean | null
        }
        Update: {
          ad_pod_length_seconds?: number
          channel_playlist_id?: string
          created_at?: string | null
          id?: string
          interval_minutes?: number
          is_active?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "live_ad_breaks_channel_playlist_id_fkey"
            columns: ["channel_playlist_id"]
            isOneToOne: false
            referencedRelation: "live_channel_playlists"
            referencedColumns: ["id"]
          },
        ]
      }
      live_channel_active_viewers: {
        Row: {
          device_type: string | null
          geo_city: string | null
          geo_country: string | null
          geo_region: string | null
          id: string
          last_heartbeat: string | null
          live_channel_id: string
          profile_id: string | null
          session_id: string
          started_at: string | null
          user_id: string | null
        }
        Insert: {
          device_type?: string | null
          geo_city?: string | null
          geo_country?: string | null
          geo_region?: string | null
          id?: string
          last_heartbeat?: string | null
          live_channel_id: string
          profile_id?: string | null
          session_id: string
          started_at?: string | null
          user_id?: string | null
        }
        Update: {
          device_type?: string | null
          geo_city?: string | null
          geo_country?: string | null
          geo_region?: string | null
          id?: string
          last_heartbeat?: string | null
          live_channel_id?: string
          profile_id?: string | null
          session_id?: string
          started_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "live_channel_active_viewers_live_channel_id_fkey"
            columns: ["live_channel_id"]
            isOneToOne: false
            referencedRelation: "live_channels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "live_channel_active_viewers_live_channel_id_fkey"
            columns: ["live_channel_id"]
            isOneToOne: false
            referencedRelation: "live_channels_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "live_channel_active_viewers_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      live_channel_favorites: {
        Row: {
          created_at: string | null
          id: string
          live_channel_id: string
          profile_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          live_channel_id: string
          profile_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          live_channel_id?: string
          profile_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "live_channel_favorites_live_channel_id_fkey"
            columns: ["live_channel_id"]
            isOneToOne: false
            referencedRelation: "live_channels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "live_channel_favorites_live_channel_id_fkey"
            columns: ["live_channel_id"]
            isOneToOne: false
            referencedRelation: "live_channels_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "live_channel_favorites_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      live_channel_playlists: {
        Row: {
          ad_break_duration_seconds: number | null
          ad_breaks_per_hour: number | null
          allowed_tiers: string[] | null
          channel_id: string
          created_at: string | null
          id: string
          is_active: boolean | null
          loop_mode: string
          playlist_name: string
          start_date: string
          start_time: string
          updated_at: string | null
        }
        Insert: {
          ad_break_duration_seconds?: number | null
          ad_breaks_per_hour?: number | null
          allowed_tiers?: string[] | null
          channel_id: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          loop_mode?: string
          playlist_name: string
          start_date: string
          start_time?: string
          updated_at?: string | null
        }
        Update: {
          ad_break_duration_seconds?: number | null
          ad_breaks_per_hour?: number | null
          allowed_tiers?: string[] | null
          channel_id?: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          loop_mode?: string
          playlist_name?: string
          start_date?: string
          start_time?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "live_channel_playlists_channel_id_fkey"
            columns: ["channel_id"]
            isOneToOne: false
            referencedRelation: "live_channels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "live_channel_playlists_channel_id_fkey"
            columns: ["channel_id"]
            isOneToOne: false
            referencedRelation: "live_channels_public"
            referencedColumns: ["id"]
          },
        ]
      }
      live_channels: {
        Row: {
          allowed_tiers: string[] | null
          created_at: string | null
          default_ad_interval_minutes: number | null
          description: string | null
          id: string
          is_active: boolean | null
          is_live_streaming: boolean | null
          logo_url: string | null
          mux_stream_id: string | null
          name: string
          playback_url: string | null
          rtmp_url: string | null
          slug: string
          stream_key: string | null
          timezone: string | null
          updated_at: string | null
        }
        Insert: {
          allowed_tiers?: string[] | null
          created_at?: string | null
          default_ad_interval_minutes?: number | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          is_live_streaming?: boolean | null
          logo_url?: string | null
          mux_stream_id?: string | null
          name: string
          playback_url?: string | null
          rtmp_url?: string | null
          slug: string
          stream_key?: string | null
          timezone?: string | null
          updated_at?: string | null
        }
        Update: {
          allowed_tiers?: string[] | null
          created_at?: string | null
          default_ad_interval_minutes?: number | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          is_live_streaming?: boolean | null
          logo_url?: string | null
          mux_stream_id?: string | null
          name?: string
          playback_url?: string | null
          rtmp_url?: string | null
          slug?: string
          stream_key?: string | null
          timezone?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      live_playlist_items: {
        Row: {
          channel_playlist_id: string
          created_at: string | null
          duration_seconds: number | null
          episode_id: string | null
          id: string
          midroll_breaks_json: Json | null
          order_index: number
          postroll_ad_id: string | null
          preroll_ad_id: string | null
          video_id: string
        }
        Insert: {
          channel_playlist_id: string
          created_at?: string | null
          duration_seconds?: number | null
          episode_id?: string | null
          id?: string
          midroll_breaks_json?: Json | null
          order_index: number
          postroll_ad_id?: string | null
          preroll_ad_id?: string | null
          video_id: string
        }
        Update: {
          channel_playlist_id?: string
          created_at?: string | null
          duration_seconds?: number | null
          episode_id?: string | null
          id?: string
          midroll_breaks_json?: Json | null
          order_index?: number
          postroll_ad_id?: string | null
          preroll_ad_id?: string | null
          video_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "live_playlist_items_channel_playlist_id_fkey"
            columns: ["channel_playlist_id"]
            isOneToOne: false
            referencedRelation: "live_channel_playlists"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "live_playlist_items_episode_id_fkey"
            columns: ["episode_id"]
            isOneToOne: false
            referencedRelation: "episodes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "live_playlist_items_postroll_ad_id_fkey"
            columns: ["postroll_ad_id"]
            isOneToOne: false
            referencedRelation: "ads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "live_playlist_items_preroll_ad_id_fkey"
            columns: ["preroll_ad_id"]
            isOneToOne: false
            referencedRelation: "ads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "live_playlist_items_video_id_fkey"
            columns: ["video_id"]
            isOneToOne: false
            referencedRelation: "contents"
            referencedColumns: ["id"]
          },
        ]
      }
      membership_plans: {
        Row: {
          created_at: string
          description: string | null
          features: string[] | null
          id: string
          included_channels: string[] | null
          name: string
          price: number | null
          slug: string
          sort_order: number | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          features?: string[] | null
          id?: string
          included_channels?: string[] | null
          name: string
          price?: number | null
          slug: string
          sort_order?: number | null
        }
        Update: {
          created_at?: string
          description?: string | null
          features?: string[] | null
          id?: string
          included_channels?: string[] | null
          name?: string
          price?: number | null
          slug?: string
          sort_order?: number | null
        }
        Relationships: []
      }
      playlist_items: {
        Row: {
          content_id: string
          created_at: string
          id: string
          playlist_id: string
          sort_order: number
        }
        Insert: {
          content_id: string
          created_at?: string
          id?: string
          playlist_id: string
          sort_order?: number
        }
        Update: {
          content_id?: string
          created_at?: string
          id?: string
          playlist_id?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "playlist_items_content_id_fkey"
            columns: ["content_id"]
            isOneToOne: false
            referencedRelation: "contents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "playlist_items_playlist_id_fkey"
            columns: ["playlist_id"]
            isOneToOne: false
            referencedRelation: "playlists"
            referencedColumns: ["id"]
          },
        ]
      }
      playlists: {
        Row: {
          content_type: string
          created_at: string
          description: string | null
          id: string
          name: string
          slug: string
        }
        Insert: {
          content_type: string
          created_at?: string
          description?: string | null
          id?: string
          name: string
          slug: string
        }
        Update: {
          content_type?: string
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          slug?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          creator_tier: string | null
          email: string | null
          full_name: string | null
          id: string
          is_admin: boolean | null
          subscription_tier: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          creator_tier?: string | null
          email?: string | null
          full_name?: string | null
          id: string
          is_admin?: boolean | null
          subscription_tier?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          creator_tier?: string | null
          email?: string | null
          full_name?: string | null
          id?: string
          is_admin?: boolean | null
          subscription_tier?: string | null
        }
        Relationships: []
      }
      push_subscriptions: {
        Row: {
          auth_key: string
          created_at: string | null
          endpoint: string
          id: string
          p256dh_key: string
          profile_id: string
        }
        Insert: {
          auth_key: string
          created_at?: string | null
          endpoint: string
          id?: string
          p256dh_key: string
          profile_id: string
        }
        Update: {
          auth_key?: string
          created_at?: string | null
          endpoint?: string
          id?: string
          p256dh_key?: string
          profile_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "push_subscriptions_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      seasons: {
        Row: {
          content_id: string
          created_at: string
          description: string | null
          id: string
          poster_url: string | null
          season_number: number
          title: string | null
        }
        Insert: {
          content_id: string
          created_at?: string
          description?: string | null
          id?: string
          poster_url?: string | null
          season_number: number
          title?: string | null
        }
        Update: {
          content_id?: string
          created_at?: string
          description?: string | null
          id?: string
          poster_url?: string | null
          season_number?: number
          title?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "seasons_content_id_fkey"
            columns: ["content_id"]
            isOneToOne: false
            referencedRelation: "contents"
            referencedColumns: ["id"]
          },
        ]
      }
      tags: {
        Row: {
          content_type: string | null
          created_at: string
          id: string
          name: string
          slug: string
        }
        Insert: {
          content_type?: string | null
          created_at?: string
          id?: string
          name: string
          slug: string
        }
        Update: {
          content_type?: string | null
          created_at?: string
          id?: string
          name?: string
          slug?: string
        }
        Relationships: []
      }
      talent_photos: {
        Row: {
          caption: string | null
          created_at: string | null
          id: string
          is_primary: boolean | null
          photo_url: string
          sort_order: number | null
          talent_id: string
        }
        Insert: {
          caption?: string | null
          created_at?: string | null
          id?: string
          is_primary?: boolean | null
          photo_url: string
          sort_order?: number | null
          talent_id: string
        }
        Update: {
          caption?: string | null
          created_at?: string | null
          id?: string
          is_primary?: boolean | null
          photo_url?: string
          sort_order?: number | null
          talent_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "talent_photos_talent_id_fkey"
            columns: ["talent_id"]
            isOneToOne: false
            referencedRelation: "talents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "talent_photos_talent_id_fkey"
            columns: ["talent_id"]
            isOneToOne: false
            referencedRelation: "talents_public"
            referencedColumns: ["id"]
          },
        ]
      }
      talent_work_history: {
        Row: {
          created_at: string | null
          description: string | null
          director: string | null
          id: string
          project_title: string
          project_type: string | null
          role: string | null
          talent_id: string
          year: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          director?: string | null
          id?: string
          project_title: string
          project_type?: string | null
          role?: string | null
          talent_id: string
          year?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          director?: string | null
          id?: string
          project_title?: string
          project_type?: string | null
          role?: string | null
          talent_id?: string
          year?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "talent_work_history_talent_id_fkey"
            columns: ["talent_id"]
            isOneToOne: false
            referencedRelation: "talents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "talent_work_history_talent_id_fkey"
            columns: ["talent_id"]
            isOneToOne: false
            referencedRelation: "talents_public"
            referencedColumns: ["id"]
          },
        ]
      }
      talents: {
        Row: {
          age_range: string | null
          applicant_type: string | null
          availability_dates: string | null
          availability_notes: string | null
          best_platform: string | null
          bio: string | null
          bust: string | null
          category: Database["public"]["Enums"]["talent_category"]
          city: string | null
          clothing_size_bottom: string | null
          clothing_size_top: string | null
          comfort_improv: boolean | null
          comfort_romance_level: string | null
          comfort_speaking: boolean | null
          comfort_stunts: boolean | null
          comfort_swimwear: boolean | null
          country: string | null
          created_at: string | null
          crew_certifications: string | null
          crew_gear_owned: string | null
          crew_primary_role: string | null
          crew_secondary_roles: string[] | null
          crew_software: string[] | null
          crew_work_preferences: string[] | null
          crew_years_experience: number | null
          distinguishing_features: string | null
          email: string | null
          ethnicity: string | null
          eye_color: string | null
          facebook_url: string | null
          follower_count: string | null
          gender: string | null
          hair_color: string | null
          has_drivers_license: boolean | null
          has_passport: boolean | null
          has_piercings: boolean | null
          has_tattoos: boolean | null
          height: string | null
          hips: string | null
          id: string
          imdb_url: string | null
          instagram_url: string | null
          is_active: boolean | null
          is_approved: boolean | null
          is_featured: boolean | null
          languages: string[] | null
          name: string
          phone: string | null
          piercing_notes: string | null
          portfolio_url: string | null
          primary_photo_url: string | null
          profile_completeness: number | null
          pronouns: string | null
          resume_url: string | null
          shoe_size: string | null
          skills_tags: string[] | null
          skin_tone: string | null
          state: string | null
          tattoo_notes: string | null
          tiktok_url: string | null
          union_status: string | null
          updated_at: string | null
          user_id: string
          video_reel_url: string | null
          waist: string | null
          website_url: string | null
          weight: string | null
          willing_to_travel: boolean | null
          x_twitter_url: string | null
          youtube_url: string | null
        }
        Insert: {
          age_range?: string | null
          applicant_type?: string | null
          availability_dates?: string | null
          availability_notes?: string | null
          best_platform?: string | null
          bio?: string | null
          bust?: string | null
          category?: Database["public"]["Enums"]["talent_category"]
          city?: string | null
          clothing_size_bottom?: string | null
          clothing_size_top?: string | null
          comfort_improv?: boolean | null
          comfort_romance_level?: string | null
          comfort_speaking?: boolean | null
          comfort_stunts?: boolean | null
          comfort_swimwear?: boolean | null
          country?: string | null
          created_at?: string | null
          crew_certifications?: string | null
          crew_gear_owned?: string | null
          crew_primary_role?: string | null
          crew_secondary_roles?: string[] | null
          crew_software?: string[] | null
          crew_work_preferences?: string[] | null
          crew_years_experience?: number | null
          distinguishing_features?: string | null
          email?: string | null
          ethnicity?: string | null
          eye_color?: string | null
          facebook_url?: string | null
          follower_count?: string | null
          gender?: string | null
          hair_color?: string | null
          has_drivers_license?: boolean | null
          has_passport?: boolean | null
          has_piercings?: boolean | null
          has_tattoos?: boolean | null
          height?: string | null
          hips?: string | null
          id?: string
          imdb_url?: string | null
          instagram_url?: string | null
          is_active?: boolean | null
          is_approved?: boolean | null
          is_featured?: boolean | null
          languages?: string[] | null
          name: string
          phone?: string | null
          piercing_notes?: string | null
          portfolio_url?: string | null
          primary_photo_url?: string | null
          profile_completeness?: number | null
          pronouns?: string | null
          resume_url?: string | null
          shoe_size?: string | null
          skills_tags?: string[] | null
          skin_tone?: string | null
          state?: string | null
          tattoo_notes?: string | null
          tiktok_url?: string | null
          union_status?: string | null
          updated_at?: string | null
          user_id: string
          video_reel_url?: string | null
          waist?: string | null
          website_url?: string | null
          weight?: string | null
          willing_to_travel?: boolean | null
          x_twitter_url?: string | null
          youtube_url?: string | null
        }
        Update: {
          age_range?: string | null
          applicant_type?: string | null
          availability_dates?: string | null
          availability_notes?: string | null
          best_platform?: string | null
          bio?: string | null
          bust?: string | null
          category?: Database["public"]["Enums"]["talent_category"]
          city?: string | null
          clothing_size_bottom?: string | null
          clothing_size_top?: string | null
          comfort_improv?: boolean | null
          comfort_romance_level?: string | null
          comfort_speaking?: boolean | null
          comfort_stunts?: boolean | null
          comfort_swimwear?: boolean | null
          country?: string | null
          created_at?: string | null
          crew_certifications?: string | null
          crew_gear_owned?: string | null
          crew_primary_role?: string | null
          crew_secondary_roles?: string[] | null
          crew_software?: string[] | null
          crew_work_preferences?: string[] | null
          crew_years_experience?: number | null
          distinguishing_features?: string | null
          email?: string | null
          ethnicity?: string | null
          eye_color?: string | null
          facebook_url?: string | null
          follower_count?: string | null
          gender?: string | null
          hair_color?: string | null
          has_drivers_license?: boolean | null
          has_passport?: boolean | null
          has_piercings?: boolean | null
          has_tattoos?: boolean | null
          height?: string | null
          hips?: string | null
          id?: string
          imdb_url?: string | null
          instagram_url?: string | null
          is_active?: boolean | null
          is_approved?: boolean | null
          is_featured?: boolean | null
          languages?: string[] | null
          name?: string
          phone?: string | null
          piercing_notes?: string | null
          portfolio_url?: string | null
          primary_photo_url?: string | null
          profile_completeness?: number | null
          pronouns?: string | null
          resume_url?: string | null
          shoe_size?: string | null
          skills_tags?: string[] | null
          skin_tone?: string | null
          state?: string | null
          tattoo_notes?: string | null
          tiktok_url?: string | null
          union_status?: string | null
          updated_at?: string | null
          user_id?: string
          video_reel_url?: string | null
          waist?: string | null
          website_url?: string | null
          weight?: string | null
          willing_to_travel?: boolean | null
          x_twitter_url?: string | null
          youtube_url?: string | null
        }
        Relationships: []
      }
      user_bookings: {
        Row: {
          booking_type: string
          created_at: string | null
          hired_at: string | null
          id: string
          notes: string | null
          position_id: string | null
          role_id: string | null
          show_id: string
          status: string | null
          talent_id: string | null
          user_id: string
        }
        Insert: {
          booking_type: string
          created_at?: string | null
          hired_at?: string | null
          id?: string
          notes?: string | null
          position_id?: string | null
          role_id?: string | null
          show_id: string
          status?: string | null
          talent_id?: string | null
          user_id: string
        }
        Update: {
          booking_type?: string
          created_at?: string | null
          hired_at?: string | null
          id?: string
          notes?: string | null
          position_id?: string | null
          role_id?: string | null
          show_id?: string
          status?: string | null
          talent_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_bookings_position_id_fkey"
            columns: ["position_id"]
            isOneToOne: false
            referencedRelation: "crew_positions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_bookings_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "casting_roles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_bookings_show_id_fkey"
            columns: ["show_id"]
            isOneToOne: false
            referencedRelation: "casting_shows"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_bookings_talent_id_fkey"
            columns: ["talent_id"]
            isOneToOne: false
            referencedRelation: "talents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_bookings_talent_id_fkey"
            columns: ["talent_id"]
            isOneToOne: false
            referencedRelation: "talents_public"
            referencedColumns: ["id"]
          },
        ]
      }
      user_calendar_events: {
        Row: {
          created_at: string | null
          department_id: string | null
          description: string | null
          end_time: string | null
          event_type: string | null
          id: string
          is_all_day: boolean | null
          location: string | null
          show_id: string | null
          start_time: string
          talent_id: string | null
          title: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          department_id?: string | null
          description?: string | null
          end_time?: string | null
          event_type?: string | null
          id?: string
          is_all_day?: boolean | null
          location?: string | null
          show_id?: string | null
          start_time: string
          talent_id?: string | null
          title: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          department_id?: string | null
          description?: string | null
          end_time?: string | null
          event_type?: string | null
          id?: string
          is_all_day?: boolean | null
          location?: string | null
          show_id?: string | null
          start_time?: string
          talent_id?: string | null
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_calendar_events_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_calendar_events_show_id_fkey"
            columns: ["show_id"]
            isOneToOne: false
            referencedRelation: "casting_shows"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_calendar_events_talent_id_fkey"
            columns: ["talent_id"]
            isOneToOne: false
            referencedRelation: "talents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_calendar_events_talent_id_fkey"
            columns: ["talent_id"]
            isOneToOne: false
            referencedRelation: "talents_public"
            referencedColumns: ["id"]
          },
        ]
      }
      user_documents: {
        Row: {
          created_at: string | null
          document_type: string | null
          file_url: string
          id: string
          show_id: string | null
          talent_id: string | null
          title: string
          uploaded_by: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          document_type?: string | null
          file_url: string
          id?: string
          show_id?: string | null
          talent_id?: string | null
          title: string
          uploaded_by?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          document_type?: string | null
          file_url?: string
          id?: string
          show_id?: string | null
          talent_id?: string | null
          title?: string
          uploaded_by?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_documents_show_id_fkey"
            columns: ["show_id"]
            isOneToOne: false
            referencedRelation: "casting_shows"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_documents_talent_id_fkey"
            columns: ["talent_id"]
            isOneToOne: false
            referencedRelation: "talents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_documents_talent_id_fkey"
            columns: ["talent_id"]
            isOneToOne: false
            referencedRelation: "talents_public"
            referencedColumns: ["id"]
          },
        ]
      }
      user_notifications: {
        Row: {
          created_at: string | null
          id: string
          is_read: boolean | null
          link: string | null
          message: string | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          link?: string | null
          message?: string | null
          title: string
          type: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          link?: string | null
          message?: string | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      user_playlist_items: {
        Row: {
          added_at: string | null
          content_id: string
          id: string
          playlist_id: string
          sort_order: number | null
        }
        Insert: {
          added_at?: string | null
          content_id: string
          id?: string
          playlist_id: string
          sort_order?: number | null
        }
        Update: {
          added_at?: string | null
          content_id?: string
          id?: string
          playlist_id?: string
          sort_order?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "user_playlist_items_content_id_fkey"
            columns: ["content_id"]
            isOneToOne: false
            referencedRelation: "contents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_playlist_items_playlist_id_fkey"
            columns: ["playlist_id"]
            isOneToOne: false
            referencedRelation: "user_playlists"
            referencedColumns: ["id"]
          },
        ]
      }
      user_playlists: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          is_public: boolean | null
          name: string
          profile_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_public?: boolean | null
          name: string
          profile_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_public?: boolean | null
          name?: string
          profile_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_playlists_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_profiles: {
        Row: {
          account_id: string
          avatar_color: string | null
          avatar_icon: string | null
          created_at: string | null
          id: string
          is_kids: boolean | null
          name: string
          preferred_genres: string[] | null
          push_notifications_enabled: boolean | null
          updated_at: string | null
        }
        Insert: {
          account_id: string
          avatar_color?: string | null
          avatar_icon?: string | null
          created_at?: string | null
          id?: string
          is_kids?: boolean | null
          name: string
          preferred_genres?: string[] | null
          push_notifications_enabled?: boolean | null
          updated_at?: string | null
        }
        Update: {
          account_id?: string
          avatar_color?: string | null
          avatar_icon?: string | null
          created_at?: string | null
          id?: string
          is_kids?: boolean | null
          name?: string
          preferred_genres?: string[] | null
          push_notifications_enabled?: boolean | null
          updated_at?: string | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      user_tasks: {
        Row: {
          assigned_by: string | null
          completed_at: string | null
          completion_file_url: string | null
          completion_note: string | null
          created_at: string | null
          department_id: string | null
          description: string | null
          due_date: string | null
          id: string
          priority: string | null
          show_id: string | null
          status: string | null
          talent_id: string | null
          title: string
          user_id: string
        }
        Insert: {
          assigned_by?: string | null
          completed_at?: string | null
          completion_file_url?: string | null
          completion_note?: string | null
          created_at?: string | null
          department_id?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          priority?: string | null
          show_id?: string | null
          status?: string | null
          talent_id?: string | null
          title: string
          user_id: string
        }
        Update: {
          assigned_by?: string | null
          completed_at?: string | null
          completion_file_url?: string | null
          completion_note?: string | null
          created_at?: string | null
          department_id?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          priority?: string | null
          show_id?: string | null
          status?: string | null
          talent_id?: string | null
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_tasks_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_tasks_show_id_fkey"
            columns: ["show_id"]
            isOneToOne: false
            referencedRelation: "casting_shows"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_tasks_talent_id_fkey"
            columns: ["talent_id"]
            isOneToOne: false
            referencedRelation: "talents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_tasks_talent_id_fkey"
            columns: ["talent_id"]
            isOneToOne: false
            referencedRelation: "talents_public"
            referencedColumns: ["id"]
          },
        ]
      }
      watch_history: {
        Row: {
          content_id: string
          episode_id: string | null
          id: string
          last_watched_at: string | null
          profile_id: string
          progress_percent: number | null
        }
        Insert: {
          content_id: string
          episode_id?: string | null
          id?: string
          last_watched_at?: string | null
          profile_id: string
          progress_percent?: number | null
        }
        Update: {
          content_id?: string
          episode_id?: string | null
          id?: string
          last_watched_at?: string | null
          profile_id?: string
          progress_percent?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "watch_history_content_id_fkey"
            columns: ["content_id"]
            isOneToOne: false
            referencedRelation: "contents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "watch_history_episode_id_fkey"
            columns: ["episode_id"]
            isOneToOne: false
            referencedRelation: "episodes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "watch_history_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      department_staff_public: {
        Row: {
          created_at: string | null
          department_id: string | null
          id: string | null
          is_active: boolean | null
          name: string | null
          title: string | null
        }
        Insert: {
          created_at?: string | null
          department_id?: string | null
          id?: string | null
          is_active?: boolean | null
          name?: string | null
          title?: string | null
        }
        Update: {
          created_at?: string | null
          department_id?: string | null
          id?: string | null
          is_active?: boolean | null
          name?: string | null
          title?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "department_staff_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
        ]
      }
      live_channels_public: {
        Row: {
          allowed_tiers: string[] | null
          created_at: string | null
          default_ad_interval_minutes: number | null
          description: string | null
          id: string | null
          is_active: boolean | null
          is_live_streaming: boolean | null
          logo_url: string | null
          name: string | null
          playback_url: string | null
          slug: string | null
          timezone: string | null
          updated_at: string | null
        }
        Insert: {
          allowed_tiers?: string[] | null
          created_at?: string | null
          default_ad_interval_minutes?: number | null
          description?: string | null
          id?: string | null
          is_active?: boolean | null
          is_live_streaming?: boolean | null
          logo_url?: string | null
          name?: string | null
          playback_url?: string | null
          slug?: string | null
          timezone?: string | null
          updated_at?: string | null
        }
        Update: {
          allowed_tiers?: string[] | null
          created_at?: string | null
          default_ad_interval_minutes?: number | null
          description?: string | null
          id?: string | null
          is_active?: boolean | null
          is_live_streaming?: boolean | null
          logo_url?: string | null
          name?: string | null
          playback_url?: string | null
          slug?: string | null
          timezone?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      profiles_public: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          creator_tier: string | null
          full_name: string | null
          id: string | null
          subscription_tier: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          creator_tier?: string | null
          full_name?: string | null
          id?: string | null
          subscription_tier?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          creator_tier?: string | null
          full_name?: string | null
          id?: string | null
          subscription_tier?: string | null
        }
        Relationships: []
      }
      talents_public: {
        Row: {
          age_range: string | null
          applicant_type: string | null
          availability_notes: string | null
          bio: string | null
          category: Database["public"]["Enums"]["talent_category"] | null
          city: string | null
          comfort_improv: boolean | null
          comfort_speaking: boolean | null
          comfort_stunts: boolean | null
          comfort_swimwear: boolean | null
          country: string | null
          created_at: string | null
          crew_primary_role: string | null
          crew_secondary_roles: string[] | null
          crew_years_experience: number | null
          ethnicity: string | null
          eye_color: string | null
          facebook_url: string | null
          hair_color: string | null
          has_drivers_license: boolean | null
          has_passport: boolean | null
          height: string | null
          id: string | null
          imdb_url: string | null
          instagram_url: string | null
          is_active: boolean | null
          is_approved: boolean | null
          is_featured: boolean | null
          languages: string[] | null
          name: string | null
          portfolio_url: string | null
          primary_photo_url: string | null
          skills_tags: string[] | null
          state: string | null
          tiktok_url: string | null
          union_status: string | null
          updated_at: string | null
          user_id: string | null
          video_reel_url: string | null
          website_url: string | null
          willing_to_travel: boolean | null
          x_twitter_url: string | null
          youtube_url: string | null
        }
        Insert: {
          age_range?: string | null
          applicant_type?: string | null
          availability_notes?: string | null
          bio?: string | null
          category?: Database["public"]["Enums"]["talent_category"] | null
          city?: string | null
          comfort_improv?: boolean | null
          comfort_speaking?: boolean | null
          comfort_stunts?: boolean | null
          comfort_swimwear?: boolean | null
          country?: string | null
          created_at?: string | null
          crew_primary_role?: string | null
          crew_secondary_roles?: string[] | null
          crew_years_experience?: number | null
          ethnicity?: string | null
          eye_color?: string | null
          facebook_url?: string | null
          hair_color?: string | null
          has_drivers_license?: boolean | null
          has_passport?: boolean | null
          height?: string | null
          id?: string | null
          imdb_url?: string | null
          instagram_url?: string | null
          is_active?: boolean | null
          is_approved?: boolean | null
          is_featured?: boolean | null
          languages?: string[] | null
          name?: string | null
          portfolio_url?: string | null
          primary_photo_url?: string | null
          skills_tags?: string[] | null
          state?: string | null
          tiktok_url?: string | null
          union_status?: string | null
          updated_at?: string | null
          user_id?: string | null
          video_reel_url?: string | null
          website_url?: string | null
          willing_to_travel?: boolean | null
          x_twitter_url?: string | null
          youtube_url?: string | null
        }
        Update: {
          age_range?: string | null
          applicant_type?: string | null
          availability_notes?: string | null
          bio?: string | null
          category?: Database["public"]["Enums"]["talent_category"] | null
          city?: string | null
          comfort_improv?: boolean | null
          comfort_speaking?: boolean | null
          comfort_stunts?: boolean | null
          comfort_swimwear?: boolean | null
          country?: string | null
          created_at?: string | null
          crew_primary_role?: string | null
          crew_secondary_roles?: string[] | null
          crew_years_experience?: number | null
          ethnicity?: string | null
          eye_color?: string | null
          facebook_url?: string | null
          hair_color?: string | null
          has_drivers_license?: boolean | null
          has_passport?: boolean | null
          height?: string | null
          id?: string | null
          imdb_url?: string | null
          instagram_url?: string | null
          is_active?: boolean | null
          is_approved?: boolean | null
          is_featured?: boolean | null
          languages?: string[] | null
          name?: string | null
          portfolio_url?: string | null
          primary_photo_url?: string | null
          skills_tags?: string[] | null
          state?: string | null
          tiktok_url?: string | null
          union_status?: string | null
          updated_at?: string | null
          user_id?: string | null
          video_reel_url?: string | null
          website_url?: string | null
          willing_to_travel?: boolean | null
          x_twitter_url?: string | null
          youtube_url?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
      talent_category:
        | "actor"
        | "model"
        | "singer"
        | "dancer"
        | "extra"
        | "voice_artist"
        | "host"
        | "influencer"
        | "other"
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
      app_role: ["admin", "moderator", "user"],
      talent_category: [
        "actor",
        "model",
        "singer",
        "dancer",
        "extra",
        "voice_artist",
        "host",
        "influencer",
        "other",
      ],
    },
  },
} as const
