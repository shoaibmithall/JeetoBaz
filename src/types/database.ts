export type Product = {
  id: string;
  name: string;
  price: number;
  status: 'active' | 'completed' | string;
  created_at: string;
  current_entries: number | null;
  max_entries: number;
  entry_fee: number | null;
  winner_phone: string | null;
  image_url?: string | null;
  description?: string | null;
  draw_date?: string | null;
  live_link?: string | null;
  winner_photo?: string | null;
};

export type Entry = {
  id: string;
  product_id: string;
  phone: string;
  created_at: string;
  name?: string | null;
  user_id?: string | null;
  ticket_number?: string | null;
  transaction_id?: string | null;
  entry_source?: string;
  referral_reward_id?: string | null;
};

export type DrawResult = {
  id: string;
  product_id: string;
  winner_entry_id: string;
  winner_user_id: string | null;
  winner_name: string;
  winner_phone: string;
  winner_ticket_number: string;
  total_entries: number;
  drawn_at: string;
  drawn_by: string;
};

export type User = {
  id: string;
  name: string | null;
  phone: string;
  created_at: string;
  auth_user_id?: string | null;
  jazzcash_number?: string | null;
  avatar_url?: string | null;
  referral_code?: string | null;
  referral_device_token?: string | null;
  referred_by?: string | null;
};

export type ReferralClaim = {
  id: string;
  referrer_user_id: string;
  referred_user_id: string;
  status: 'pending' | 'qualified' | 'rejected' | 'reversed';
  created_at: string;
  qualified_at: string | null;
};

export type ReferralReward = {
  id: string;
  user_id: string;
  referral_claim_id: string;
  reward_kind: 'rs1_entry';
  status: 'available' | 'redeemed' | 'expired' | 'revoked';
  expires_at: string;
  redeemed_product_id: string | null;
  redeemed_entry_id: string | null;
  created_at: string;
  redeemed_at: string | null;
};

export type Transaction = {
  id: string;
  product_id: string;
  phone: string;
  amount: number;
  jazzcash_txn_id: string;
  status: string;
  created_at: string;
  payment_method?: string | null;
  sender_name?: string | null;
  sender_phone?: string | null;
  user_name?: string | null;
  receipt_path?: string | null;
};

export type AppNotification = {
  id: string;
  title: string;
  message: string;
  target_phone: string | null;
  link: string | null;
  kind: string | null;
  created_at: string;
};

export type AppSetting = {
  key: string;
  value: unknown;
  updated_at: string;
};

export type ProductFormData = {
  name: string;
  price: number;
  entry_fee: number;
  max_entries: number;
  image_url: string | null;
  description: string | null;
  draw_date: string | null;
  live_link: string | null;
  winner_photo: string | null;
};

export type AuthMigrationConfig = {
  key: string;
  value: string;
};

type Table<Row, Insert = Partial<Row>, Update = Partial<Row>> = {
  Row: Row;
  Insert: Insert;
  Update: Update;
  Relationships: [];
};

export type Database = {
  public: {
    Tables: {
      products: Table<
        Product,
        ProductFormData & {
          current_entries?: number | null;
          status?: string;
        },
        Partial<ProductFormData> & Partial<Pick<Product, 'current_entries' | 'status' | 'winner_phone'>>
      >;
      entries: Table<
        Entry,
        Pick<Entry, 'product_id' | 'phone'> &
          Partial<Pick<Entry, 'name' | 'user_id' | 'ticket_number' | 'transaction_id'>>
      >;
      draw_results: Table<
        DrawResult,
        Omit<DrawResult, 'id' | 'drawn_at'>,
        never
      >;
      users: Table<
        User,
        Pick<User, 'name' | 'phone'> &
          Partial<Pick<User, 'jazzcash_number' | 'avatar_url' | 'referral_code' | 'referral_device_token' | 'referred_by'>>
      >;
      referral_claims: Table<ReferralClaim>;
      referral_rewards: Table<ReferralReward>;
      transactions: Table<
        Transaction,
        Pick<Transaction, 'product_id' | 'phone' | 'amount' | 'jazzcash_txn_id'> &
          Partial<Pick<Transaction, 'status' | 'payment_method' | 'sender_name' | 'sender_phone' | 'user_name' | 'receipt_path'>>
      >;
      notifications: Table<
        AppNotification,
        Pick<AppNotification, 'title' | 'message'> &
          Partial<Pick<AppNotification, 'target_phone' | 'link' | 'kind'>>
      >;
      app_settings: Table<
        AppSetting,
        Pick<AppSetting, 'key' | 'value'>,
        Partial<Pick<AppSetting, 'value'>>
      >;
      auth_migration_config: Table<AuthMigrationConfig>;
    };
    Views: {};
    Functions: {
      get_public_draw_result: {
        Args: { requested_product_id: string };
        Returns: Array<{
          winner_name: string;
          masked_phone: string;
          winner_ticket_number: string;
          total_entries: number;
          drawn_at: string;
        }>;
      };
      increment: {
        Args: { x: number };
        Returns: number;
      };
      run_jeetobaz_draw: {
        Args: { requested_product_id: string };
        Returns: Array<{
          result_id: string;
          winner_entry_id: string;
          winner_name: string;
          winner_phone: string;
          winner_ticket_number: string;
          total_entries: number;
          drawn_at: string;
        }>;
      };
      get_referral_dashboard: {
        Args: { requested_phone: string; requested_device_token: string };
        Returns: Array<{
          referral_code: string;
          successful_referrals: number;
          available_rewards: number;
          redeemed_rewards: number;
        }>;
      };
      claim_referral_code: {
        Args: { requested_phone: string; requested_code: string; requested_device_token: string };
        Returns: string;
      };
      update_profile_avatar: {
        Args: { requested_phone: string; requested_avatar_url: string };
        Returns: boolean;
      };
      get_referral_eligible_products: {
        Args: Record<string, never>;
        Returns: Product[];
      };
      get_available_referral_rewards: {
        Args: { requested_phone: string; requested_device_token: string };
        Returns: Array<{ reward_id: string; expires_at: string }>;
      };
      redeem_referral_reward: {
        Args: {
          requested_phone: string;
          requested_device_token: string;
          requested_reward_id: string;
          requested_product_id: string;
        };
        Returns: string;
      };
      create_user_profile: {
        Args: { p_name: string; p_phone: string };
        Returns: void;
      };
      update_my_profile: {
        Args: { p_name?: string; p_avatar_url?: string; p_phone?: string };
        Returns: void;
      };
      approve_entry_atomic: {
        Args: {
          p_product_id: string;
          p_phone: string;
          p_name?: string;
          p_transaction_id?: string;
        };
        Returns: Array<{
          ok: boolean;
          error?: string;
          entry_id?: string;
          new_entries?: number;
        }>;
      };
    };
    Enums: {};
    CompositeTypes: {};
  };
};
