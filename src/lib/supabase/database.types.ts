
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  
  "graphql_public": {
          Tables: {
            [_ in never]: never
          }
          Views: {
            [_ in never]: never
          }
          Functions: {
            "graphql":
{ Args: { "extensions"?: Json,"operationName"?: string,"query"?: string,"variables"?: Json }; Returns: Json
                           }
          }
          Enums: {
            [_ in never]: never
          }
          CompositeTypes: {
            [_ in never]: never
          }
        },"public": {
          Tables: {
            "categories": {
                  Row: {
                    "created_at": string,"id": string,"name": string,"position": number,"restaurant_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"id"?: string,"name": string,"position"?: number,"restaurant_id"?: string
                  }
                  Update: {
                    "created_at"?: string,"id"?: string,"name"?: string,"position"?: number,"restaurant_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "categories_restaurant_id_fkey"
      columns: ["restaurant_id"]
isOneToOne: false
      referencedRelation: "restaurants"
      referencedColumns: ["id"]
    }
                  ]
                },"complaints": {
                  Row: {
                    "created_at": string,"customer_id": string,"decided_by": string | null,"id": string,"message": string,"order_id": string | null,"responded_by": string | null,"staff_response": string | null,"status": Database["public"]['Enums']["complaint_status"],"subject": string,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"customer_id": string,"decided_by"?: string | null,"id"?: string,"message": string,"order_id"?: string | null,"responded_by"?: string | null,"staff_response"?: string | null,"status"?: Database["public"]['Enums']["complaint_status"],"subject": string,"updated_at"?: string
                  }
                  Update: {
                    "created_at"?: string,"customer_id"?: string,"decided_by"?: string | null,"id"?: string,"message"?: string,"order_id"?: string | null,"responded_by"?: string | null,"staff_response"?: string | null,"status"?: Database["public"]['Enums']["complaint_status"],"subject"?: string,"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "complaints_customer_id_fkey"
      columns: ["customer_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "complaints_decided_by_fkey"
      columns: ["decided_by"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "complaints_order_id_fkey"
      columns: ["order_id"]
isOneToOne: false
      referencedRelation: "orders"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "complaints_responded_by_fkey"
      columns: ["responded_by"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"loyalty_transactions": {
                  Row: {
                    "created_at": string,"expires_at": string | null,"id": string,"kind": Database["public"]['Enums']["loyalty_kind"],"note": string | null,"order_id": string | null,"points": number,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"expires_at"?: string | null,"id"?: string,"kind": Database["public"]['Enums']["loyalty_kind"],"note"?: string | null,"order_id"?: string | null,"points": number,"user_id": string
                  }
                  Update: {
                    "created_at"?: string,"expires_at"?: string | null,"id"?: string,"kind"?: Database["public"]['Enums']["loyalty_kind"],"note"?: string | null,"order_id"?: string | null,"points"?: number,"user_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "loyalty_transactions_order_id_fkey"
      columns: ["order_id"]
isOneToOne: false
      referencedRelation: "orders"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "loyalty_transactions_user_id_fkey"
      columns: ["user_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"menu_items": {
                  Row: {
                    "category_id": string,"created_at": string,"description": string | null,"id": string,"image_url": string | null,"is_available": boolean,"is_dish_of_day": boolean,"name": string,"price_fcfa": number,"restaurant_id": string,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "category_id": string,"created_at"?: string,"description"?: string | null,"id"?: string,"image_url"?: string | null,"is_available"?: boolean,"is_dish_of_day"?: boolean,"name": string,"price_fcfa": number,"restaurant_id"?: string,"updated_at"?: string
                  }
                  Update: {
                    "category_id"?: string,"created_at"?: string,"description"?: string | null,"id"?: string,"image_url"?: string | null,"is_available"?: boolean,"is_dish_of_day"?: boolean,"name"?: string,"price_fcfa"?: number,"restaurant_id"?: string,"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "menu_items_category_id_fkey"
      columns: ["category_id"]
isOneToOne: false
      referencedRelation: "categories"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "menu_items_restaurant_id_fkey"
      columns: ["restaurant_id"]
isOneToOne: false
      referencedRelation: "restaurants"
      referencedColumns: ["id"]
    }
                  ]
                },"order_items": {
                  Row: {
                    "id": string,"item_name": string,"menu_item_id": string,"order_id": string,"quantity": number,"unit_price_fcfa": number
                  }
                  ComputedFields: never
                  Insert: {
                    "id"?: string,"item_name": string,"menu_item_id": string,"order_id": string,"quantity": number,"unit_price_fcfa": number
                  }
                  Update: {
                    "id"?: string,"item_name"?: string,"menu_item_id"?: string,"order_id"?: string,"quantity"?: number,"unit_price_fcfa"?: number
                  }
                  Relationships: [
                    {
      foreignKeyName: "order_items_menu_item_id_fkey"
      columns: ["menu_item_id"]
isOneToOne: false
      referencedRelation: "menu_items"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "order_items_order_id_fkey"
      columns: ["order_id"]
isOneToOne: false
      referencedRelation: "orders"
      referencedColumns: ["id"]
    }
                  ]
                },"orders": {
                  Row: {
                    "arrival_time": string | null,"created_at": string,"customer_comment": string | null,"customer_id": string,"delivery_address": string | null,"discount_fcfa": number,"id": string,"order_type": Database["public"]['Enums']["order_type"],"points_earned": number,"points_used": number,"restaurant_id": string,"status": Database["public"]['Enums']["order_status"],"subtotal_fcfa": number,"total_fcfa": number,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "arrival_time"?: string | null,"created_at"?: string,"customer_comment"?: string | null,"customer_id": string,"delivery_address"?: string | null,"discount_fcfa"?: number,"id"?: string,"order_type": Database["public"]['Enums']["order_type"],"points_earned"?: number,"points_used"?: number,"restaurant_id"?: string,"status"?: Database["public"]['Enums']["order_status"],"subtotal_fcfa": number,"total_fcfa": number,"updated_at"?: string
                  }
                  Update: {
                    "arrival_time"?: string | null,"created_at"?: string,"customer_comment"?: string | null,"customer_id"?: string,"delivery_address"?: string | null,"discount_fcfa"?: number,"id"?: string,"order_type"?: Database["public"]['Enums']["order_type"],"points_earned"?: number,"points_used"?: number,"restaurant_id"?: string,"status"?: Database["public"]['Enums']["order_status"],"subtotal_fcfa"?: number,"total_fcfa"?: number,"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "orders_customer_id_fkey"
      columns: ["customer_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "orders_restaurant_id_fkey"
      columns: ["restaurant_id"]
isOneToOne: false
      referencedRelation: "restaurants"
      referencedColumns: ["id"]
    }
                  ]
                },"profiles": {
                  Row: {
                    "created_at": string,"delivery_address": string | null,"email": string,"full_name": string,"id": string,"is_active": boolean,"phone": string | null,"points_balance": number,"referral_code": string,"referred_by": string | null,"restaurant_id": string | null,"role": Database["public"]['Enums']["app_role"],"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"delivery_address"?: string | null,"email": string,"full_name": string,"id": string,"is_active"?: boolean,"phone"?: string | null,"points_balance"?: number,"referral_code": string,"referred_by"?: string | null,"restaurant_id"?: string | null,"role"?: Database["public"]['Enums']["app_role"],"updated_at"?: string
                  }
                  Update: {
                    "created_at"?: string,"delivery_address"?: string | null,"email"?: string,"full_name"?: string,"id"?: string,"is_active"?: boolean,"phone"?: string | null,"points_balance"?: number,"referral_code"?: string,"referred_by"?: string | null,"restaurant_id"?: string | null,"role"?: Database["public"]['Enums']["app_role"],"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "profiles_referred_by_fkey"
      columns: ["referred_by"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "profiles_restaurant_id_fkey"
      columns: ["restaurant_id"]
isOneToOne: false
      referencedRelation: "restaurants"
      referencedColumns: ["id"]
    }
                  ]
                },"promotions": {
                  Row: {
                    "created_at": string,"description": string | null,"ends_at": string | null,"id": string,"is_active": boolean,"kind": Database["public"]['Enums']["promotion_kind"],"poster_url": string | null,"restaurant_id": string,"starts_at": string,"title": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"description"?: string | null,"ends_at"?: string | null,"id"?: string,"is_active"?: boolean,"kind"?: Database["public"]['Enums']["promotion_kind"],"poster_url"?: string | null,"restaurant_id"?: string,"starts_at"?: string,"title": string
                  }
                  Update: {
                    "created_at"?: string,"description"?: string | null,"ends_at"?: string | null,"id"?: string,"is_active"?: boolean,"kind"?: Database["public"]['Enums']["promotion_kind"],"poster_url"?: string | null,"restaurant_id"?: string,"starts_at"?: string,"title"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "promotions_restaurant_id_fkey"
      columns: ["restaurant_id"]
isOneToOne: false
      referencedRelation: "restaurants"
      referencedColumns: ["id"]
    }
                  ]
                },"referrals": {
                  Row: {
                    "created_at": string,"id": string,"referee_id": string,"referrer_id": string,"reward_points": number | null,"rewarded_at": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"id"?: string,"referee_id": string,"referrer_id": string,"reward_points"?: number | null,"rewarded_at"?: string | null
                  }
                  Update: {
                    "created_at"?: string,"id"?: string,"referee_id"?: string,"referrer_id"?: string,"reward_points"?: number | null,"rewarded_at"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "referrals_referee_id_fkey"
      columns: ["referee_id"]
isOneToOne: true
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "referrals_referrer_id_fkey"
      columns: ["referrer_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"restaurants": {
                  Row: {
                    "created_at": string,"fcfa_per_point": number,"id": string,"name": string,"opening_hours": NonNullable<Json>,"points_validity_months": number,"redeem_points_block": number,"redeem_value_fcfa": number,"referral_bonus_points": number,"slug": string,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"fcfa_per_point"?: number,"id"?: string,"name": string,"opening_hours"?: NonNullable<Json>,"points_validity_months"?: number,"redeem_points_block"?: number,"redeem_value_fcfa"?: number,"referral_bonus_points"?: number,"slug": string,"updated_at"?: string
                  }
                  Update: {
                    "created_at"?: string,"fcfa_per_point"?: number,"id"?: string,"name"?: string,"opening_hours"?: NonNullable<Json>,"points_validity_months"?: number,"redeem_points_block"?: number,"redeem_value_fcfa"?: number,"referral_bonus_points"?: number,"slug"?: string,"updated_at"?: string
                  }
                  Relationships: [
                    
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
            "app_role": "etudiant"|"employe"|"gerant"|"admin","complaint_status": "ouverte"|"en_cours"|"reponse_proposee"|"resolue"|"rejetee","loyalty_kind": "gain"|"utilisation"|"parrainage"|"expiration"|"ajustement","order_status": "en_attente"|"en_preparation"|"prete"|"en_livraison"|"livree"|"annulee","order_type": "sur_place"|"livraison","promotion_kind": "promotion"|"evenement"
          }
          CompositeTypes: {
            [_ in never]: never
          }
        }
}

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>

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
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
  ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
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
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
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
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
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
    : never = never
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
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
    : never = never
> = PublicCompositeTypeNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
  ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
  : never

export const Constants = {
  "graphql_public": {
          Enums: {
            
          }
        },"public": {
          Enums: {
            "app_role": ["etudiant", "employe", "gerant", "admin"],"complaint_status": ["ouverte", "en_cours", "reponse_proposee", "resolue", "rejetee"],"loyalty_kind": ["gain", "utilisation", "parrainage", "expiration", "ajustement"],"order_status": ["en_attente", "en_preparation", "prete", "en_livraison", "livree", "annulee"],"order_type": ["sur_place", "livraison"],"promotion_kind": ["promotion", "evenement"]
          }
        }
} as const
