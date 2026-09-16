export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type ScoutLevel =
  | 'Daisies'
  | 'Brownies'
  | 'Juniors'
  | 'Cadettes'
  | 'Seniors'
  | 'Ambassadors'

export type MeetingType = 'regular' | 'field-trip'
export type BadgeType = 'official' | 'funpatch'

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          display_name: string
          avatar_initials: string | null
          town: string | null
          is_admin: boolean
          created_at: string
        }
        Insert: {
          id: string
          display_name: string
          avatar_initials?: string | null
          town?: string | null
          is_admin?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          display_name?: string
          avatar_initials?: string | null
          town?: string | null
          is_admin?: boolean
          created_at?: string
        }
      }
      meetings: {
        Row: {
          id: string
          author_id: string
          title: string
          description: string | null
          meeting_type: MeetingType
          field_trip_town: string | null
          levels: ScoutLevel[]
          cost: number
          supply_cost: number
          guest_cost: number
          num_girls: number
          supplies: string | null
          local_business: string | null
          local_contact: string | null
          local_email: string | null
          local_phone: string | null
          local_address: string | null
          local_notes: string | null
          badge_type: BadgeType
          badge_purchase_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          author_id: string
          title: string
          description?: string | null
          meeting_type?: MeetingType
          field_trip_town?: string | null
          levels: ScoutLevel[]
          cost?: number
          supply_cost?: number
          guest_cost?: number
          num_girls?: number
          supplies?: string | null
          local_business?: string | null
          local_contact?: string | null
          local_email?: string | null
          local_phone?: string | null
          local_address?: string | null
          local_notes?: string | null
          badge_type?: BadgeType
          badge_purchase_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Database['public']['Tables']['meetings']['Insert']>
      }
      meeting_links: {
        Row: {
          id: string
          meeting_id: string
          label: string | null
          url: string
          sort_order: number
        }
        Insert: {
          id?: string
          meeting_id: string
          label?: string | null
          url: string
          sort_order?: number
        }
        Update: Partial<Database['public']['Tables']['meeting_links']['Insert']>
      }
      meeting_media: {
        Row: {
          id: string
          meeting_id: string
          file_path: string
          file_name: string
          file_type: string | null
          is_cover: boolean
          cover_position: string
          created_at: string
        }
        Insert: {
          id?: string
          meeting_id: string
          file_path: string
          file_name: string
          file_type?: string | null
          is_cover?: boolean
          cover_position?: string
          created_at?: string
        }
        Update: Partial<Database['public']['Tables']['meeting_media']['Insert']>
      }
      upvotes: {
        Row: {
          user_id: string
          meeting_id: string
          created_at: string
        }
        Insert: {
          user_id: string
          meeting_id: string
          created_at?: string
        }
        Update: Partial<Database['public']['Tables']['upvotes']['Insert']>
      }
      favorites: {
        Row: {
          user_id: string
          meeting_id: string
          created_at: string
        }
        Insert: {
          user_id: string
          meeting_id: string
          created_at?: string
        }
        Update: Partial<Database['public']['Tables']['favorites']['Insert']>
      }
      completed: {
        Row: {
          user_id: string
          meeting_id: string
          created_at: string
        }
        Insert: {
          user_id: string
          meeting_id: string
          created_at?: string
        }
        Update: Partial<Database['public']['Tables']['completed']['Insert']>
      }
      comments: {
        Row: {
          id: string
          meeting_id: string
          author_id: string
          text: string
          created_at: string
        }
        Insert: {
          id?: string
          meeting_id: string
          author_id: string
          text: string
          created_at?: string
        }
        Update: Partial<Database['public']['Tables']['comments']['Insert']>
      }
    }
    Views: {
      meeting_upvote_counts: {
        Row: {
          meeting_id: string
          count: number
        }
      }
    }
    Functions: Record<string, never>
    Enums: Record<string, never>
  }
}

// ─── Convenience types used across the app ───────────────────────────────────

export type Profile = Database['public']['Tables']['profiles']['Row']
export type Meeting = Database['public']['Tables']['meetings']['Row']
export type MeetingLink = Database['public']['Tables']['meeting_links']['Row']
export type MeetingMedia = Database['public']['Tables']['meeting_media']['Row']
export type Comment = Database['public']['Tables']['comments']['Row']

/** Full meeting with joins used in card/detail views */
export interface MeetingWithDetails extends Meeting {
  author: Profile
  media: MeetingMedia[]
  links: MeetingLink[]
  upvote_count: number
  user_has_upvoted?: boolean
  user_has_favorited?: boolean
  user_has_completed?: boolean
  comments?: CommentWithAuthor[]
}

export interface CommentWithAuthor extends Comment {
  author: Profile
}

export const SCOUT_LEVELS: ScoutLevel[] = [
  'Daisies',
  'Brownies',
  'Juniors',
  'Cadettes',
  'Seniors',
  'Ambassadors',
]

export const LEVEL_COLORS: Record<ScoutLevel, string> = {
  Daisies: 'bg-blue-100 text-blue-800',
  Brownies: 'bg-amber-100 text-amber-800',
  Juniors: 'bg-green-100 text-green-800',
  Cadettes: 'bg-teal-100 text-teal-800',
  Seniors: 'bg-purple-100 text-purple-800',
  Ambassadors: 'bg-rose-100 text-rose-800',
}
