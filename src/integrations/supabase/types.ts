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
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      admin_actions: {
        Row: {
          action_type: string
          admin_id: string
          created_at: string
          description: string | null
          id: string
          target_worker_id: string | null
        }
        Insert: {
          action_type: string
          admin_id: string
          created_at?: string
          description?: string | null
          id?: string
          target_worker_id?: string | null
        }
        Update: {
          action_type?: string
          admin_id?: string
          created_at?: string
          description?: string | null
          id?: string
          target_worker_id?: string | null
        }
        Relationships: []
      }
      bookings: {
        Row: {
          booking_date: string
          booking_time: string
          created_at: string
          customer_id: string
          id: string
          job_description: string
          status: string
          worker_id: string
        }
        Insert: {
          booking_date: string
          booking_time: string
          created_at?: string
          customer_id: string
          id?: string
          job_description: string
          status?: string
          worker_id: string
        }
        Update: {
          booking_date?: string
          booking_time?: string
          created_at?: string
          customer_id?: string
          id?: string
          job_description?: string
          status?: string
          worker_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bookings_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_worker_id_fkey"
            columns: ["worker_id"]
            isOneToOne: false
            referencedRelation: "workers"
            referencedColumns: ["id"]
          },
        ]
      }
      customers: {
        Row: {
          city: string
          created_at: string
          district: string
          id: string
          name: string
          phone: string
          pincode: string
          user_id: string
        }
        Insert: {
          city: string
          created_at?: string
          district?: string
          id?: string
          name: string
          phone: string
          pincode: string
          user_id: string
        }
        Update: {
          city?: string
          created_at?: string
          district?: string
          id?: string
          name?: string
          phone?: string
          pincode?: string
          user_id?: string
        }
        Relationships: []
      }
      messages: {
        Row: {
          booking_id: string | null
          created_at: string
          id: string
          image_url: string | null
          message_text: string | null
          receiver_id: string
          sender_id: string
        }
        Insert: {
          booking_id?: string | null
          created_at?: string
          id?: string
          image_url?: string | null
          message_text?: string | null
          receiver_id: string
          sender_id: string
        }
        Update: {
          booking_id?: string | null
          created_at?: string
          id?: string
          image_url?: string | null
          message_text?: string | null
          receiver_id?: string
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      reports: {
        Row: {
          created_at: string
          customer_id: string | null
          description: string | null
          id: string
          reason: string
          status: string
          worker_id: string
        }
        Insert: {
          created_at?: string
          customer_id?: string | null
          description?: string | null
          id?: string
          reason: string
          status?: string
          worker_id: string
        }
        Update: {
          created_at?: string
          customer_id?: string | null
          description?: string | null
          id?: string
          reason?: string
          status?: string
          worker_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reports_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reports_worker_id_fkey"
            columns: ["worker_id"]
            isOneToOne: false
            referencedRelation: "workers"
            referencedColumns: ["id"]
          },
        ]
      }
      reviews: {
        Row: {
          booking_id: string | null
          created_at: string
          customer_id: string | null
          id: string
          rating: number
          review_text: string | null
          reviewer_name: string | null
          worker_id: string
        }
        Insert: {
          booking_id?: string | null
          created_at?: string
          customer_id?: string | null
          id?: string
          rating: number
          review_text?: string | null
          reviewer_name?: string | null
          worker_id: string
        }
        Update: {
          booking_id?: string | null
          created_at?: string
          customer_id?: string | null
          id?: string
          rating?: number
          review_text?: string | null
          reviewer_name?: string | null
          worker_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reviews_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_worker_id_fkey"
            columns: ["worker_id"]
            isOneToOne: false
            referencedRelation: "workers"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      worker_portfolio: {
        Row: {
          created_at: string
          id: string
          image_url: string
          worker_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          image_url: string
          worker_id: string
        }
        Update: {
          created_at?: string
          id?: string
          image_url?: string
          worker_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "worker_portfolio_worker_id_fkey"
            columns: ["worker_id"]
            isOneToOne: false
            referencedRelation: "workers"
            referencedColumns: ["id"]
          },
        ]
      }
      workers: {
        Row: {
          category: Database["public"]["Enums"]["worker_category"]
          city: string
          created_at: string
          description: string | null
          experience: number
          id: string
          image_url: string | null
          name: string
          phone: string
          phone2: string | null
          pincode: string
          rating: number
          state: string
          status: string
          total_reviews: number
          updated_at: string
          user_id: string
          verified: boolean
        }
        Insert: {
          category: Database["public"]["Enums"]["worker_category"]
          city: string
          created_at?: string
          description?: string | null
          experience?: number
          id?: string
          image_url?: string | null
          name: string
          phone: string
          phone2?: string | null
          pincode: string
          rating?: number
          state: string
          status?: string
          total_reviews?: number
          updated_at?: string
          user_id: string
          verified?: boolean
        }
        Update: {
          category?: Database["public"]["Enums"]["worker_category"]
          city?: string
          created_at?: string
          description?: string | null
          experience?: number
          id?: string
          image_url?: string | null
          name?: string
          phone?: string
          phone2?: string | null
          pincode?: string
          rating?: number
          state?: string
          status?: string
          total_reviews?: number
          updated_at?: string
          user_id?: string
          verified?: boolean
        }
        Relationships: []
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
      worker_category:
        | "electrician"
        | "plumber"
        | "carpenter"
        | "ac_technician"
        | "refrigerator_repair"
        | "washing_machine_repair"
        | "tv_repair"
        | "car_mechanic"
        | "bike_mechanic"
        | "auto_electrician"
        | "mason"
        | "painter"
        | "tile_worker"
        | "welder"
        | "house_cleaner"
        | "office_cleaner"
        | "security_guard"
        | "driver"
        | "delivery_worker"
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
      worker_category: [
        "electrician",
        "plumber",
        "carpenter",
        "ac_technician",
        "refrigerator_repair",
        "washing_machine_repair",
        "tv_repair",
        "car_mechanic",
        "bike_mechanic",
        "auto_electrician",
        "mason",
        "painter",
        "tile_worker",
        "welder",
        "house_cleaner",
        "office_cleaner",
        "security_guard",
        "driver",
        "delivery_worker",
      ],
    },
  },
} as const
