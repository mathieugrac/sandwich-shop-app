export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

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
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
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
      admin_users: {
        Row: {
          created_at: string | null
          email: string
          id: string
          name: string
          role: string | null
        }
        Insert: {
          created_at?: string | null
          email: string
          id?: string
          name: string
          role?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string
          id?: string
          name?: string
          role?: string | null
        }
        Relationships: []
      }
      clients: {
        Row: {
          created_at: string | null
          email: string
          id: string
          phone: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          email: string
          id?: string
          phone?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string
          id?: string
          phone?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      drop_products: {
        Row: {
          available_quantity: number | null
          created_at: string | null
          drop_id: string | null
          id: string
          product_id: string | null
          reserved_quantity: number | null
          selling_price: number
          stock_quantity: number
          updated_at: string | null
        }
        Insert: {
          available_quantity?: number | null
          created_at?: string | null
          drop_id?: string | null
          id?: string
          product_id?: string | null
          reserved_quantity?: number | null
          selling_price?: number
          stock_quantity: number
          updated_at?: string | null
        }
        Update: {
          available_quantity?: number | null
          created_at?: string | null
          drop_id?: string | null
          id?: string
          product_id?: string | null
          reserved_quantity?: number | null
          selling_price?: number
          stock_quantity?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "drop_products_drop_id_fkey"
            columns: ["drop_id"]
            isOneToOne: false
            referencedRelation: "drops"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "drop_products_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      drops: {
        Row: {
          created_at: string | null
          date: string
          id: string
          last_modified_by: string | null
          location_id: string | null
          notes: string | null
          status: string | null
          status_changed_at: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          date: string
          id?: string
          last_modified_by?: string | null
          location_id?: string | null
          notes?: string | null
          status?: string | null
          status_changed_at?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          date?: string
          id?: string
          last_modified_by?: string | null
          location_id?: string | null
          notes?: string | null
          status?: string | null
          status_changed_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "drops_last_modified_by_fkey"
            columns: ["last_modified_by"]
            isOneToOne: false
            referencedRelation: "admin_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "drops_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
        ]
      }
      locations: {
        Row: {
          active: boolean | null
          address: string
          created_at: string | null
          district: string
          id: string
          location_url: string | null
          name: string
          pickup_hour_end: string
          pickup_hour_start: string
          updated_at: string | null
        }
        Insert: {
          active?: boolean | null
          address: string
          created_at?: string | null
          district: string
          id?: string
          location_url?: string | null
          name: string
          pickup_hour_end: string
          pickup_hour_start: string
          updated_at?: string | null
        }
        Update: {
          active?: boolean | null
          address?: string
          created_at?: string | null
          district?: string
          id?: string
          location_url?: string | null
          name?: string
          pickup_hour_end?: string
          pickup_hour_start?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      order_items: {
        Row: {
          created_at: string | null
          id: string
          order_id: string | null
          product_id: string | null
          quantity: number
          unit_price: number
        }
        Insert: {
          created_at?: string | null
          id?: string
          order_id?: string | null
          product_id?: string | null
          quantity: number
          unit_price: number
        }
        Update: {
          created_at?: string | null
          id?: string
          order_id?: string | null
          product_id?: string | null
          quantity?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      order_products: {
        Row: {
          created_at: string | null
          drop_product_id: string | null
          id: string
          order_id: string | null
          order_quantity: number
        }
        Insert: {
          created_at?: string | null
          drop_product_id?: string | null
          id?: string
          order_id?: string | null
          order_quantity: number
        }
        Update: {
          created_at?: string | null
          drop_product_id?: string | null
          id?: string
          order_id?: string | null
          order_quantity?: number
        }
        Relationships: [
          {
            foreignKeyName: "order_products_drop_product_id_fkey"
            columns: ["drop_product_id"]
            isOneToOne: false
            referencedRelation: "drop_products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_products_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          client_id: string | null
          created_at: string | null
          customer_email: string
          customer_name: string
          customer_phone: string
          drop_id: string | null
          id: string
          order_date: string
          order_number: string
          payment_intent_id: string | null
          payment_method: string | null
          pickup_time: string
          special_instructions: string | null
          special_requests: string | null
          status: string | null
          stripe_payment_intent_id: string | null
          total_amount: number
          updated_at: string | null
        }
        Insert: {
          client_id?: string | null
          created_at?: string | null
          customer_email: string
          customer_name: string
          customer_phone: string
          drop_id?: string | null
          id?: string
          order_date?: string
          order_number: string
          payment_intent_id?: string | null
          payment_method?: string | null
          pickup_time: string
          special_instructions?: string | null
          special_requests?: string | null
          status?: string | null
          stripe_payment_intent_id?: string | null
          total_amount: number
          updated_at?: string | null
        }
        Update: {
          client_id?: string | null
          created_at?: string | null
          customer_email?: string
          customer_name?: string
          customer_phone?: string
          drop_id?: string | null
          id?: string
          order_date?: string
          order_number?: string
          payment_intent_id?: string | null
          payment_method?: string | null
          pickup_time?: string
          special_instructions?: string | null
          special_requests?: string | null
          status?: string | null
          stripe_payment_intent_id?: string | null
          total_amount?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "orders_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_drop_id_fkey"
            columns: ["drop_id"]
            isOneToOne: false
            referencedRelation: "drops"
            referencedColumns: ["id"]
          },
        ]
      }
      product_images: {
        Row: {
          alt_text: string | null
          created_at: string | null
          id: string
          image_url: string
          product_id: string | null
          sort_order: number | null
        }
        Insert: {
          alt_text?: string | null
          created_at?: string | null
          id?: string
          image_url: string
          product_id?: string | null
          sort_order?: number | null
        }
        Update: {
          alt_text?: string | null
          created_at?: string | null
          id?: string
          image_url?: string
          product_id?: string | null
          sort_order?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "product_images_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          active: boolean | null
          allergens: string | null
          category: string
          created_at: string | null
          description: string | null
          id: string
          name: string
          production_cost: number
          sell_price: number
          sort_order: number | null
          updated_at: string | null
        }
        Insert: {
          active?: boolean | null
          allergens?: string | null
          category: string
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
          production_cost: number
          sell_price: number
          sort_order?: number | null
          updated_at?: string | null
        }
        Update: {
          active?: boolean | null
          allergens?: string | null
          category?: string
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
          production_cost?: number
          sell_price?: number
          sort_order?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      check_inventory_availability: {
        Args: {
          p_drop_id: string
          p_product_id: string
          p_requested_quantity: number
        }
        Returns: boolean
      }
      check_multiple_drop_products_availability: {
        Args: { p_order_items: Json }
        Returns: boolean
      }
      generate_order_number: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_admin_past_drops: {
        Args: Record<PropertyKey, never>
        Returns: {
          date: string
          id: string
          location_id: string
          location_name: string
          status: string
          total_available: number
        }[]
      }
      get_admin_upcoming_drops: {
        Args: Record<PropertyKey, never>
        Returns: {
          date: string
          id: string
          location_id: string
          location_name: string
          status: string
          total_available: number
        }[]
      }
      get_or_create_client: {
        Args: { p_email: string; p_phone: string }
        Returns: string
      }
      release_inventory: {
        Args: { p_drop_id: string; p_product_id: string; p_quantity: number }
        Returns: boolean
      }
      release_multiple_drop_products: {
        Args: { p_order_items: Json }
        Returns: boolean
      }
      reserve_inventory: {
        Args: { p_drop_id: string; p_product_id: string; p_quantity: number }
        Returns: boolean
      }
      reserve_multiple_drop_products: {
        Args: { p_order_items: Json }
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
} as const

