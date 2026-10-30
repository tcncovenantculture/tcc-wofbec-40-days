export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: { extensions?: Json; operationName?: string; query?: string; variables?: Json }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      days: {
        Row: {
          action_dimension: Database['public']['Enums']['dimension']
          body_md: string
          day_number: number
          est_minutes: number
          introduction: string
          kind: Database['public']['Enums']['day_kind']
          media: NonNullable<Json>
          module_number: number
          pod_prompt: string
          practical_action: string
          publish_at: string
          reflection_prompts: string[]
          scripture_ref: string
          scripture_text: string | null
          scripture_url: string | null
          status: string
          title: string
          updated_at: string
        }
        ComputedFields: never
        Insert: {
          action_dimension: Database['public']['Enums']['dimension']
          body_md: string
          day_number: number
          est_minutes: number
          introduction: string
          kind: Database['public']['Enums']['day_kind']
          media?: NonNullable<Json>
          module_number: number
          pod_prompt: string
          practical_action: string
          publish_at: string
          reflection_prompts: string[]
          scripture_ref: string
          scripture_text?: string | null
          scripture_url?: string | null
          status: string
          title: string
          updated_at?: string
        }
        Update: {
          action_dimension?: Database['public']['Enums']['dimension']
          body_md?: string
          day_number?: number
          est_minutes?: number
          introduction?: string
          kind?: Database['public']['Enums']['day_kind']
          media?: NonNullable<Json>
          module_number?: number
          pod_prompt?: string
          practical_action?: string
          publish_at?: string
          reflection_prompts?: string[]
          scripture_ref?: string
          scripture_text?: string | null
          scripture_url?: string | null
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      messages: {
        Row: {
          author_id: string | null
          body: string
          created_at: string
          day_number: number | null
          hidden_at: string | null
          hidden_by: string | null
          id: string
          kind: Database['public']['Enums']['message_kind']
          pod_id: string | null
        }
        ComputedFields: never
        Insert: {
          author_id?: string | null
          body: string
          created_at?: string
          day_number?: number | null
          hidden_at?: string | null
          hidden_by?: string | null
          id?: string
          kind?: Database['public']['Enums']['message_kind']
          pod_id?: string | null
        }
        Update: {
          author_id?: string | null
          body?: string
          created_at?: string
          day_number?: number | null
          hidden_at?: string | null
          hidden_by?: string | null
          id?: string
          kind?: Database['public']['Enums']['message_kind']
          pod_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'messages_author_id_fkey'
            columns: ['author_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'messages_day_number_fkey'
            columns: ['day_number']
            isOneToOne: false
            referencedRelation: 'days'
            referencedColumns: ['day_number']
          },
          {
            foreignKeyName: 'messages_hidden_by_fkey'
            columns: ['hidden_by']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'messages_pod_id_fkey'
            columns: ['pod_id']
            isOneToOne: false
            referencedRelation: 'pods'
            referencedColumns: ['id']
          },
        ]
      }
      pod_members: {
        Row: {
          is_facilitator: boolean
          joined_at: string
          pod_id: string
          user_id: string
        }
        ComputedFields: never
        Insert: {
          is_facilitator?: boolean
          joined_at?: string
          pod_id: string
          user_id: string
        }
        Update: {
          is_facilitator?: boolean
          joined_at?: string
          pod_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'pod_members_pod_id_fkey'
            columns: ['pod_id']
            isOneToOne: false
            referencedRelation: 'pods'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'pod_members_user_id_fkey'
            columns: ['user_id']
            isOneToOne: true
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
        ]
      }
      pods: {
        Row: {
          avatar_seed: string
          created_at: string
          id: string
          name: string
          segment: Database['public']['Enums']['segment']
          whatsapp_invite_link: string | null
        }
        ComputedFields: never
        Insert: {
          avatar_seed?: string
          created_at?: string
          id?: string
          name: string
          segment: Database['public']['Enums']['segment']
          whatsapp_invite_link?: string | null
        }
        Update: {
          avatar_seed?: string
          created_at?: string
          id?: string
          name?: string
          segment?: Database['public']['Enums']['segment']
          whatsapp_invite_link?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar: Json | null
          created_at: string
          display_name: string
          email: string
          id: string
          reminder_email: boolean
          role: Database['public']['Enums']['user_role']
          segment: Database['public']['Enums']['segment']
          unsubscribe_token: string
          whatsapp_number: string | null
        }
        ComputedFields: never
        Insert: {
          avatar?: Json | null
          created_at?: string
          display_name: string
          email: string
          id: string
          reminder_email?: boolean
          role?: Database['public']['Enums']['user_role']
          segment: Database['public']['Enums']['segment']
          unsubscribe_token?: string
          whatsapp_number?: string | null
        }
        Update: {
          avatar?: Json | null
          created_at?: string
          display_name?: string
          email?: string
          id?: string
          reminder_email?: boolean
          role?: Database['public']['Enums']['user_role']
          segment?: Database['public']['Enums']['segment']
          unsubscribe_token?: string
          whatsapp_number?: string | null
        }
        Relationships: []
      }
      progress: {
        Row: {
          completed_at: string
          day_number: number
          user_id: string
        }
        ComputedFields: never
        Insert: {
          completed_at?: string
          day_number: number
          user_id?: string
        }
        Update: {
          completed_at?: string
          day_number?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'progress_day_number_fkey'
            columns: ['day_number']
            isOneToOne: false
            referencedRelation: 'days'
            referencedColumns: ['day_number']
          },
          {
            foreignKeyName: 'progress_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
        ]
      }
      reflections: {
        Row: {
          body: string
          day_number: number
          id: string
          prompt_index: number
          updated_at: string
          user_id: string
        }
        ComputedFields: never
        Insert: {
          body: string
          day_number: number
          id?: string
          prompt_index: number
          updated_at?: string
          user_id?: string
        }
        Update: {
          body?: string
          day_number?: number
          id?: string
          prompt_index?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'reflections_day_number_fkey'
            columns: ['day_number']
            isOneToOne: false
            referencedRelation: 'days'
            referencedColumns: ['day_number']
          },
          {
            foreignKeyName: 'reflections_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
        ]
      }
    }
    Views: {
      pod_messages: {
        Row: {
          author_id: string | null
          body: string | null
          created_at: string
          day_number: number | null
          hidden: boolean | null
          id: string
          kind: Database['public']['Enums']['message_kind']
          pod_id: string | null
        }
        ComputedFields: never
        Insert: {
          author_id?: string | null
          body?: never
          created_at?: string | null
          day_number?: number | null
          hidden?: never
          id?: string | null
          kind?: Database['public']['Enums']['message_kind'] | null
          pod_id?: string | null
        }
        Update: {
          author_id?: string | null
          body?: never
          created_at?: string | null
          day_number?: number | null
          hidden?: never
          id?: string | null
          kind?: Database['public']['Enums']['message_kind'] | null
          pod_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'messages_author_id_fkey'
            columns: ['author_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'messages_day_number_fkey'
            columns: ['day_number']
            isOneToOne: false
            referencedRelation: 'days'
            referencedColumns: ['day_number']
          },
          {
            foreignKeyName: 'messages_pod_id_fkey'
            columns: ['pod_id']
            isOneToOne: false
            referencedRelation: 'pods'
            referencedColumns: ['id']
          },
        ]
      }
    }
    Functions: {
      hide_message: { Args: { message_id: string }; Returns: undefined }
      is_facilitator_of: { Args: { pod: string }; Returns: boolean }
      is_pod_member: { Args: { pod: string }; Returns: boolean }
      is_role: { Args: { r: Database['public']['Enums']['user_role'] }; Returns: boolean }
      message_body: { Args: { message_id: string }; Returns: string }
      moderator_display_names: {
        Args: { user_ids: string[] }
        Returns: {
          display_name: string
          id: string
        }[]
      }
      my_pod_id: { Args: Record<PropertyKey, never>; Returns: string }
      pod_roster: {
        Args: Record<PropertyKey, never>
        Returns: {
          avatar: Json
          display_name: string
          is_facilitator: boolean
          user_id: string
        }[]
      }
      pod_thread_counts: {
        Args: Record<PropertyKey, never>
        Returns: {
          day_number: number
          messages: number
        }[]
      }
      pod_today_totals: {
        Args: { for_day: number }
        Returns: {
          completed: number
          members: number
        }[]
      }
      set_whatsapp_link: { Args: { link: string }; Returns: undefined }
    }
    Enums: {
      day_kind: 'intro' | 'developmental' | 'synthesis'
      dimension: 'career' | 'character' | 'community'
      message_kind: 'message' | 'shared_reflection' | 'pinned' | 'announcement'
      segment: 'undergrad' | 'early_career' | 'experienced_professional' | 'entrepreneur'
      user_role: 'participant' | 'moderator' | 'reviewer'
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, 'public'>]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    keyof (DefaultSchema['Tables'] & DefaultSchema['Views']) | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    ? (DefaultSchema['Tables'] & DefaultSchema['Views'])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema['Tables'] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema['Tables'] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    keyof DefaultSchema['Enums'] | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums']
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums'][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema['Enums']
    ? DefaultSchema['Enums'][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    keyof DefaultSchema['CompositeTypes'] | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes']
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes'][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema['CompositeTypes']
    ? DefaultSchema['CompositeTypes'][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      day_kind: ['intro', 'developmental', 'synthesis'],
      dimension: ['career', 'character', 'community'],
      message_kind: ['message', 'shared_reflection', 'pinned', 'announcement'],
      segment: ['undergrad', 'early_career', 'experienced_professional', 'entrepreneur'],
      user_role: ['participant', 'moderator', 'reviewer'],
    },
  },
} as const
