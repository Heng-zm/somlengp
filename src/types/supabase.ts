export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      comments: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          content: string
          author_name: string
          author_email: string
          page_path: string
          parent_id: string | null
          status: 'pending' | 'approved' | 'rejected'
          likes: number
          dislikes: number
          metadata: Json | null
        }
        Insert: {
          id?: string
          created_at?: string
          updated_at?: string
          content: string
          author_name: string
          author_email: string
          page_path: string
          parent_id?: string | null
          status?: 'pending' | 'approved' | 'rejected'
          likes?: number
          dislikes?: number
          metadata?: Json | null
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
          content?: string
          author_name?: string
          author_email?: string
          page_path?: string
          parent_id?: string | null
          status?: 'pending' | 'approved' | 'rejected'
          likes?: number
          dislikes?: number
          metadata?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "comments_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "comments"
            referencedColumns: ["id"]
          }
        ]
      }
      feedback: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          type: 'bug' | 'feature' | 'general'
          subject: string
          message: string
          email: string
          name: string | null
          status: 'new' | 'in_progress' | 'resolved' | 'closed'
          priority: 'low' | 'medium' | 'high' | 'critical'
          metadata: Json | null
        }
        Insert: {
          id?: string
          created_at?: string
          updated_at?: string
          type: 'bug' | 'feature' | 'general'
          subject: string
          message: string
          email: string
          name?: string | null
          status?: 'new' | 'in_progress' | 'resolved' | 'closed'
          priority?: 'low' | 'medium' | 'high' | 'critical'
          metadata?: Json | null
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
          type?: 'bug' | 'feature' | 'general'
          subject?: string
          message?: string
          email?: string
          name?: string | null
          status?: 'new' | 'in_progress' | 'resolved' | 'closed'
          priority?: 'low' | 'medium' | 'high' | 'critical'
          metadata?: Json | null
        }
        Relationships: []
      }
      visits: {
        Row: {
          id: string
          created_at: string
          page_path: string
          user_agent: string | null
          ip_address: string | null
          country: string | null
          city: string | null
          referrer: string | null
          session_id: string | null
          user_id: string | null
          duration: number | null
          metadata: Json | null
        }
        Insert: {
          id?: string
          created_at?: string
          page_path: string
          user_agent?: string | null
          ip_address?: string | null
          country?: string | null
          city?: string | null
          referrer?: string | null
          session_id?: string | null
          user_id?: string | null
          duration?: number | null
          metadata?: Json | null
        }
        Update: {
          id?: string
          created_at?: string
          page_path?: string
          user_agent?: string | null
          ip_address?: string | null
          country?: string | null
          city?: string | null
          referrer?: string | null
          session_id?: string | null
          user_id?: string | null
          duration?: number | null
          metadata?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "visits_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      user_role: 'user' | 'admin'
      comment_status: 'pending' | 'approved' | 'rejected'
      feedback_type: 'bug' | 'feature' | 'general'
      feedback_status: 'new' | 'in_progress' | 'resolved' | 'closed'
      feedback_priority: 'low' | 'medium' | 'high' | 'critical'
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

// Type helpers
export type Tables<
  PublicTableNameOrOptions extends
    | keyof (Database["public"]["Tables"] & Database["public"]["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (Database["public"]["Tables"] &
      Database["public"]["Views"])
  ? (Database["public"]["Tables"] &
      Database["public"]["Views"])[PublicTableNameOrOptions] extends {
      Row: infer R
    }
    ? R
    : never
  : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof Database["public"]["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof Database["public"]["Tables"]
  ? Database["public"]["Tables"][PublicTableNameOrOptions] extends {
      Insert: infer I
    }
    ? I
    : never
  : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof Database["public"]["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof Database["public"]["Tables"]
  ? Database["public"]["Tables"][PublicTableNameOrOptions] extends {
      Update: infer U
    }
    ? U
    : never
  : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof Database["public"]["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof Database["public"]["Enums"]
  ? Database["public"]["Enums"][PublicEnumNameOrOptions]
  : never