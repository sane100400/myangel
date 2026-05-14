// Hand-rolled Supabase Database types for the tables we touch.
// 추후 `supabase gen types typescript --linked > database.ts`로 자동화 가능.

export interface Database {
  public: {
    Tables: {
      error_logs: {
        Row: {
          id: string;
          user_id: string | null;
          kind: string;
          level: string;
          message: string;
          stack: string | null;
          url: string | null;
          user_agent: string | null;
          meta: Record<string, unknown> | null;
          ip_hash: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          kind: string;
          level?: string;
          message: string;
          stack?: string | null;
          url?: string | null;
          user_agent?: string | null;
          meta?: Record<string, unknown> | null;
          ip_hash?: string | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["error_logs"]["Insert"]>;
        Relationships: [];
      };
      discover_images: {
        Row: {
          id: string;
          user_id: string | null;
          storage_path: string;
          thumb_path: string | null;
          title: string;
          tags: string[];
          prompt: string;
          user_name: string | null;
          user_avatar: string | null;
          ip_hash: string | null;
          file_size: number;
          width: number | null;
          height: number | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          storage_path: string;
          thumb_path?: string | null;
          title?: string;
          tags?: string[];
          prompt?: string;
          user_name?: string | null;
          user_avatar?: string | null;
          ip_hash?: string | null;
          file_size?: number;
          width?: number | null;
          height?: number | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["discover_images"]["Insert"]>;
        Relationships: [];
      };
      user_generations: {
        Row: {
          id: string;
          user_id: string;
          image: string | null;
          storage_path: string | null;
          prompt: string | null;
          source: string;
          meta: Record<string, unknown> | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          image?: string | null;
          storage_path?: string | null;
          prompt?: string | null;
          source?: string;
          meta?: Record<string, unknown> | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["user_generations"]["Insert"]>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      deduct_credits: {
        Args: {
          p_user_id: string;
          p_cost: number;
          p_reason: string;
          p_meta?: Record<string, unknown>;
          p_idempotency_key?: string | null;
        };
        Returns: string | null;
      };
      refund_credits: {
        Args: {
          p_ledger_id: string;
        };
        Returns: boolean;
      };
    };
    Enums: Record<string, never>;
  };
}
