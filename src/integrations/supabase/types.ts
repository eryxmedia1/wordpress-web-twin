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
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
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
        Relationships: []
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
          full_name: string | null
          id: string
          is_admin: boolean | null
          subscription_tier: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id: string
          is_admin?: boolean | null
          subscription_tier?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          is_admin?: boolean | null
          subscription_tier?: string | null
        }
        Relationships: []
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
      [_ in never]: never
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
      app_role: ["admin", "moderator", "user"],
    },
  },
} as const
