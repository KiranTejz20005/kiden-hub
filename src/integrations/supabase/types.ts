export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      books: {
        Row: {
          author: string | null
          completed_at: string | null
          cover_url: string | null
          created_at: string
          current_page: number
          id: string
          notes: string | null
          started_at: string | null
          status: string
          title: string
          total_pages: number
          updated_at: string
          user_id: string
        }
        Insert: {
          author?: string | null
          completed_at?: string | null
          cover_url?: string | null
          created_at?: string
          current_page?: number
          id?: string
          notes?: string | null
          started_at?: string | null
          status?: string
          title: string
          total_pages?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          author?: string | null
          completed_at?: string | null
          cover_url?: string | null
          created_at?: string
          current_page?: number
          id?: string
          notes?: string | null
          started_at?: string | null
          status?: string
          title?: string
          total_pages?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      chat_messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string
          id: string
          role: string
          user_id: string
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string
          id?: string
          role: string
          user_id: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string
          id?: string
          role?: string
          user_id?: string
        }
        Relationships: []
      }
      collections: {
        Row: {
          color: string | null
          created_at: string
          icon: string | null
          id: string
          item_count: number | null
          name: string
          updated_at: string
          user_id: string
          workspace_id: string | null
        }
        Insert: {
          color?: string | null
          created_at?: string
          icon?: string | null
          id?: string
          item_count?: number | null
          name: string
          updated_at?: string
          user_id: string
          workspace_id?: string | null
        }
        Update: {
          color?: string | null
          created_at?: string
          icon?: string | null
          id?: string
          item_count?: number | null
          name?: string
          updated_at?: string
          user_id?: string
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "collections_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      focus_sessions: {
        Row: {
          completed: boolean | null
          duration_minutes: number
          ended_at: string | null
          id: string
          note_id: string | null
          session_type: string
          started_at: string
          user_id: string
        }
        Insert: {
          completed?: boolean | null
          duration_minutes: number
          ended_at?: string | null
          id?: string
          note_id?: string | null
          session_type?: string
          started_at?: string
          user_id: string
        }
        Update: {
          completed?: boolean | null
          duration_minutes?: number
          ended_at?: string | null
          id?: string
          note_id?: string | null
          session_type?: string
          started_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "focus_sessions_note_id_fkey"
            columns: ["note_id"]
            isOneToOne: false
            referencedRelation: "notes"
            referencedColumns: ["id"]
          },
        ]
      }
      habit_logs: {
        Row: {
          id: string
          habit_id: string
          user_id: string
          value: number | null
          completed_at: string
          date: string
          notes: string | null
        }
        Insert: {
          id?: string
          habit_id: string
          user_id: string
          value?: number | null
          completed_at?: string
          date?: string
          notes?: string | null
        }
        Update: {
          id?: string
          habit_id?: string
          user_id?: string
          value?: number | null
          completed_at?: string
          date?: string
          notes?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "habit_logs_habit_id_fkey"
            columns: ["habit_id"]
            isOneToOne: false
            referencedRelation: "habits"
            referencedColumns: ["id"]
          },
        ]
      }
      habits: {
        Row: {
          id: string
          user_id: string
          name: string
          description: string | null
          icon: string | null
          color: string | null
          goal: number | null
          unit: string | null
          target_time: string | null
          is_active: boolean | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          description?: string | null
          icon?: string | null
          color?: string | null
          goal?: number | null
          unit?: string | null
          target_time?: string | null
          is_active?: boolean | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          description?: string | null
          icon?: string | null
          color?: string | null
          goal?: number | null
          unit?: string | null
          target_time?: string | null
          is_active?: boolean | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      ideas: {
        Row: {
          category: string
          content: string
          created_at: string
          id: string
          is_processed: boolean | null
          note_id: string | null
          user_id: string
        }
        Insert: {
          category?: string
          content: string
          created_at?: string
          id?: string
          is_processed?: boolean | null
          note_id?: string | null
          user_id: string
        }
        Update: {
          category?: string
          content?: string
          created_at?: string
          id?: string
          is_processed?: boolean | null
          note_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ideas_note_id_fkey"
            columns: ["note_id"]
            isOneToOne: false
            referencedRelation: "notes"
            referencedColumns: ["id"]
          },
        ]
      }
      journal_entries: {
        Row: {
          content: string | null
          created_at: string
          entry_date: string
          id: string
          mood: string | null
          title: string | null
          transcript: string | null
          updated_at: string
          user_id: string
          video_url: string | null
        }
        Insert: {
          content?: string | null
          created_at?: string
          entry_date?: string
          id?: string
          mood?: string | null
          title?: string | null
          transcript?: string | null
          updated_at?: string
          user_id: string
          video_url?: string | null
        }
        Update: {
          content?: string | null
          created_at?: string
          entry_date?: string
          id?: string
          mood?: string | null
          title?: string | null
          transcript?: string | null
          updated_at?: string
          user_id?: string
          video_url?: string | null
        }
        Relationships: []
      }
      leetcode_problems: {
        Row: {
          category: string
          created_at: string
          difficulty: string
          id: string
          notes: string | null
          problem_number: number | null
          solved_at: string | null
          status: string
          time_taken_minutes: number | null
          title: string
          updated_at: string
          url: string | null
          user_id: string
        }
        Insert: {
          category?: string
          created_at?: string
          difficulty?: string
          id?: string
          notes?: string | null
          problem_number?: number | null
          solved_at?: string | null
          status?: string
          time_taken_minutes?: number | null
          title: string
          updated_at?: string
          url?: string | null
          user_id: string
        }
        Update: {
          category?: string
          created_at?: string
          difficulty?: string
          id?: string
          notes?: string | null
          problem_number?: number | null
          solved_at?: string | null
          status?: string
          time_taken_minutes?: number | null
          title?: string
          updated_at?: string
          url?: string | null
          user_id?: string
        }
        Relationships: []
      }
      media_extractions: {
        Row: {
          content: string | null
          created_at: string
          id: string
          metadata: Json | null
          note_id: string | null
          source_type: string
          source_url: string | null
          summary: string | null
          title: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          content?: string | null
          created_at?: string
          id?: string
          metadata?: Json | null
          note_id?: string | null
          source_type: string
          source_url?: string | null
          summary?: string | null
          title?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string | null
          created_at?: string
          id?: string
          metadata?: Json | null
          note_id?: string | null
          source_type?: string
          source_url?: string | null
          summary?: string | null
          title?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "media_extractions_note_id_fkey"
            columns: ["note_id"]
            isOneToOne: false
            referencedRelation: "notes"
            referencedColumns: ["id"]
          },
        ]
      }
      note_folders: {
        Row: {
          created_at: string
          icon: string | null
          id: string
          is_collapsed: boolean
          name: string
          parent_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          icon?: string | null
          id?: string
          is_collapsed?: boolean
          name: string
          parent_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          icon?: string | null
          id?: string
          is_collapsed?: boolean
          name?: string
          parent_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      note_links: {
        Row: {
          created_at: string
          id: string
          source_note_id: string
          target_note_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          source_note_id: string
          target_note_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          source_note_id?: string
          target_note_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "note_links_source_note_id_fkey"
            columns: ["source_note_id"]
            isOneToOne: false
            referencedRelation: "notes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "note_links_target_note_id_fkey"
            columns: ["target_note_id"]
            isOneToOne: false
            referencedRelation: "notes"
            referencedColumns: ["id"]
          },
        ]
      }
      note_tags: {
        Row: {
          created_at: string
          id: string
          note_id: string
          tag_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          note_id: string
          tag_id: string
        }
        Update: {
          created_at?: string
          id?: string
          note_id?: string
          tag_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "note_tags_note_id_fkey"
            columns: ["note_id"]
            isOneToOne: false
            referencedRelation: "notes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "note_tags_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "tags"
            referencedColumns: ["id"]
          },
        ]
      }
      notes: {
        Row: {
          collection_id: string | null
          content: Json | null
          cover_image: string | null
          created_at: string
          icon: string | null
          id: string
          is_archived: boolean | null
          is_favorite: boolean | null
          is_template: boolean | null
          template_category: string | null
          title: string
          updated_at: string
          user_id: string
          workspace_id: string | null
        }
        Insert: {
          collection_id?: string | null
          content?: Json | null
          cover_image?: string | null
          created_at?: string
          icon?: string | null
          id?: string
          is_archived?: boolean | null
          is_favorite?: boolean | null
          is_template?: boolean | null
          template_category?: string | null
          title?: string
          updated_at?: string
          user_id: string
          workspace_id?: string | null
        }
        Update: {
          collection_id?: string | null
          content?: Json | null
          cover_image?: string | null
          created_at?: string
          icon?: string | null
          id?: string
          is_archived?: boolean | null
          is_favorite?: boolean | null
          is_template?: boolean | null
          template_category?: string | null
          title?: string
          updated_at?: string
          user_id?: string
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notes_collection_id_fkey"
            columns: ["collection_id"]
            isOneToOne: false
            referencedRelation: "collections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notes_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      activity_logs: {
        Row: {
          action_type: string
          created_at: string
          id: string
          metadata: Json | null
          target_id: string
          target_name: string
          target_type: string
          user_id: string
        }
        Insert: {
          action_type: string
          created_at?: string
          id?: string
          metadata?: Json | null
          target_id: string
          target_name: string
          target_type: string
          user_id: string
        }
        Update: {
          action_type?: string
          created_at?: string
          id?: string
          metadata?: Json | null
          target_id?: string
          target_name?: string
          target_type?: string
          user_id?: string
        }
        Relationships: []
      }
      content_pieces: {
        Row: {
          id: string
          user_id: string
          content_type: string
          source_platform: string
          external_id: string
          title: string
          description: string | null
          thumbnail_url: string | null
          high_res_thumbnail: string | null
          video_url: string | null
          channel_name: string | null
          channel_id: string | null
          channel_avatar: string | null
          duration_seconds: number | null
          view_count: number | null
          like_count: number | null
          comment_count: number | null
          subscriber_count: number | null
          published_at: string | null
          category: string | null
          tags: string[] | null
          virality_score: number | null
          quality_score: number | null
          engagement_rate: number | null
          metadata: Json | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          content_type: string
          source_platform: string
          external_id: string
          title: string
          description?: string | null
          thumbnail_url?: string | null
          high_res_thumbnail?: string | null
          video_url?: string | null
          channel_name?: string | null
          channel_id?: string | null
          channel_avatar?: string | null
          duration_seconds?: number | null
          view_count?: number | null
          like_count?: number | null
          comment_count?: number | null
          subscriber_count?: number | null
          published_at?: string | null
          category?: string | null
          tags?: string[] | null
          virality_score?: number | null
          quality_score?: number | null
          engagement_rate?: number | null
          metadata?: Json | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          content_type?: string
          source_platform?: string
          external_id?: string
          title?: string
          description?: string | null
          thumbnail_url?: string | null
          high_res_thumbnail?: string | null
          video_url?: string | null
          channel_name?: string | null
          channel_id?: string | null
          channel_avatar?: string | null
          duration_seconds?: number | null
          view_count?: number | null
          like_count?: number | null
          comment_count?: number | null
          subscriber_count?: number | null
          published_at?: string | null
          category?: string | null
          tags?: string[] | null
          virality_score?: number | null
          quality_score?: number | null
          engagement_rate?: number | null
          metadata?: Json | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      conversations: {
        Row: {
          created_at: string
          id: string
          title: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          title?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          title?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      creators: {
        Row: {
          avatar_url: string | null
          channel_id: string
          created_at: string
          description: string | null
          id: string
          name: string
          subscriber_count: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          channel_id: string
          created_at?: string
          description?: string | null
          id?: string
          name: string
          subscriber_count?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          channel_id?: string
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          subscriber_count?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      files: {
        Row: {
          created_at: string
          id: string
          name: string
          size: number | null
          type: string | null
          updated_at: string
          url: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          size?: number | null
          type?: string | null
          updated_at?: string
          url?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          size?: number | null
          type?: string | null
          updated_at?: string
          url?: string | null
          user_id?: string
        }
        Relationships: []
      }
      playlist_items: {
        Row: {
          created_at: string
          id: string
          playlist_id: string
          position: number
          updated_at: string
          video_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          playlist_id: string
          position: number
          updated_at?: string
          video_id: string
        }
        Update: {
          created_at?: string
          id?: string
          playlist_id?: string
          position?: number
          updated_at?: string
          video_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "playlist_items_playlist_id_fkey"
            columns: ["playlist_id"]
            isOneToOne: false
            referencedRelation: "user_playlists"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string
          display_density: string | null
          display_name: string | null
          focus_settings: Json | null
          id: string
          language: string | null
          notification_settings: Json | null
          onboarding_completed: boolean | null
          status: string | null
          theme: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          display_density?: string | null
          display_name?: string | null
          focus_settings?: Json | null
          id?: string
          language?: string | null
          notification_settings?: Json | null
          onboarding_completed?: boolean | null
          status?: string | null
          theme?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          display_density?: string | null
          display_name?: string | null
          focus_settings?: Json | null
          id?: string
          language?: string | null
          notification_settings?: Json | null
          onboarding_completed?: boolean | null
          status?: string | null
          theme?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      research_boards: {
        Row: {
          created_at: string
          emoji: string | null
          id: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          emoji?: string | null
          id?: string
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          emoji?: string | null
          id?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      research_board_items: {
        Row: {
          board_id: string
          content: string
          created_at: string
          id: string
          section: string | null
          title: string
          type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          board_id: string
          content?: string
          created_at?: string
          id?: string
          section?: string | null
          title?: string
          type?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          board_id?: string
          content?: string
          created_at?: string
          id?: string
          section?: string | null
          title?: string
          type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "research_board_items_board_id_fkey"
            columns: ["board_id"]
            isOneToOne: false
            referencedRelation: "research_boards"
            referencedColumns: ["id"]
          },
        ]
      }
      user_follows: {
        Row: {
          channel_avatar: string | null
          channel_id: string
          channel_name: string | null
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          channel_avatar?: string | null
          channel_id: string
          channel_name?: string | null
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          channel_avatar?: string | null
          channel_id?: string
          channel_name?: string | null
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      tags: {
        Row: {
          color: string | null
          created_at: string
          id: string
          name: string
          user_id: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          id?: string
          name: string
          user_id: string
        }
        Update: {
          color?: string | null
          created_at?: string
          id?: string
          name?: string
          user_id?: string
        }
        Relationships: []
      }
      templates: {
        Row: {
          category: string
          content: Json
          created_at: string
          description: string | null
          icon: string | null
          id: string
          is_system: boolean | null
          name: string
          user_id: string | null
        }
        Insert: {
          category?: string
          content?: Json
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          is_system?: boolean | null
          name: string
          user_id?: string | null
        }
        Update: {
          category?: string
          content?: Json
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          is_system?: boolean | null
          name?: string
          user_id?: string | null
        }
        Relationships: []
      }
      workspace_members: {
        Row: {
          accepted_at: string | null
          created_at: string
          email: string
          id: string
          invited_at: string
          invited_by: string | null
          role: string
          user_id: string
          workspace_id: string
        }
        Insert: {
          accepted_at?: string | null
          created_at?: string
          email: string
          id?: string
          invited_at?: string
          invited_by?: string | null
          role?: string
          user_id: string
          workspace_id: string
        }
        Update: {
          accepted_at?: string | null
          created_at?: string
          email?: string
          id?: string
          invited_at?: string
          invited_by?: string | null
          role?: string
          user_id?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workspace_members_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      user_content_interactions: {
        Row: {
          content_id: string
          created_at: string
          id: string
          interaction_type: string
          user_id: string
        }
        Insert: {
          content_id: string
          created_at?: string
          id?: string
          interaction_type: string
          user_id: string
        }
        Update: {
          content_id?: string
          created_at?: string
          id?: string
          interaction_type?: string
          user_id?: string
        }
        Relationships: []
      }
      user_playlists: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_public: boolean | null
          name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_public?: boolean | null
          name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_public?: boolean | null
          name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_study_videos: {
        Row: {
          channel_avatar: string | null
          channel_name: string | null
          completed: boolean | null
          created_at: string
          duration: number | null
          id: string
          is_favorite: boolean | null
          last_watched_at: string | null
          notes: string | null
          personal_notes: string | null
          playlist_id: string | null
          position: number | null
          published_at: string | null
          subject_tag: string | null
          thumbnail_url: string | null
          title: string | null
          updated_at: string
          user_id: string
          video_id: string
          video_url: string | null
          view_count: number | null
        }
        Insert: {
          channel_avatar?: string | null
          channel_name?: string | null
          completed?: boolean | null
          created_at?: string
          duration?: number | null
          id?: string
          is_favorite?: boolean | null
          last_watched_at?: string | null
          notes?: string | null
          personal_notes?: string | null
          playlist_id?: string | null
          position?: number | null
          published_at?: string | null
          subject_tag?: string | null
          thumbnail_url?: string | null
          title?: string | null
          updated_at?: string
          user_id: string
          video_id: string
          video_url?: string | null
          view_count?: number | null
        }
        Update: {
          channel_avatar?: string | null
          channel_name?: string | null
          completed?: boolean | null
          created_at?: string
          duration?: number | null
          id?: string
          is_favorite?: boolean | null
          last_watched_at?: string | null
          notes?: string | null
          personal_notes?: string | null
          playlist_id?: string | null
          position?: number | null
          published_at?: string | null
          subject_tag?: string | null
          thumbnail_url?: string | null
          title?: string | null
          updated_at?: string
          user_id?: string
          video_id?: string
          video_url?: string | null
          view_count?: number | null
        }
        Relationships: []
      }
      workspaces: {
        Row: {
          created_at: string
          icon: string | null
          id: string
          name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          icon?: string | null
          id?: string
          name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          icon?: string | null
          id?: string
          name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      batch_update_video_positions: {
        Args: { video_ids: string[]; new_positions: number[] }
        Returns: undefined
      }
      hybrid_search: {
        Args: { query_text: string; query_embedding: string; match_threshold?: number; match_count?: number; category_filter?: string }
        Returns: {
          id: string
          title: string
          content: string
          similarity: number
        }[]
      }
      user_has_workspace_access: {
        Args: { workspace_uuid: string }
        Returns: boolean
      }
      user_owns_workspace: {
        Args: { workspace_uuid: string }
        Returns: boolean
      }
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
    Enums: {},
  },
} as const
