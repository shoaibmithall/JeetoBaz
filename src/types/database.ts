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
  seo_title?: string | null;
  meta_description?: string | null;
  meta_keywords?: string | null;
  slug?: string | null;
  indexable?: boolean;
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

export type PrizeStatus = 'pending' | 'processing' | 'shipped' | 'delivered';

// Verification of the winner is a separate concern from prize delivery logistics.
// disqualified/re_draw_required are rare, manual/admin-only states — never
// system-automated, since draw_results.product_id is UNIQUE (one immutable result forever).
export type WinnerStatus = 'selected' | 'under_verification' | 'verified' | 'disqualified' | 're_draw_required';

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
  prize_status: PrizeStatus;
  prize_status_updated_at: string;
  prize_tracking_note: string | null;
  winner_status: WinnerStatus;
  winner_status_updated_at: string;
};

// Tracks the draw's lifecycle BEFORE and DURING the run — separate from
// WinnerStatus, which tracks verification AFTER the winner is selected.
// This state machine never decides the winner; run_jeetobaz_draw owns
// selection entirely and is observed, not driven, by this machine.
export type DrawSessionState =
  | 'created'
  | 'waiting'
  | 'locked'
  | 'verifying'
  | 'ready'
  | 'running'
  | 'winner_selected'
  | 'result_published'
  | 'completed';

export type DrawSession = {
  id: string;
  product_id: string;
  state: DrawSessionState;
  state_updated_at: string;
  created_at: string;
};

export type DrawSessionStateHistoryEntry = {
  id: string;
  draw_session_id: string;
  state: DrawSessionState;
  changed_by: string | null;
  created_at: string;
};

export type DrawStatusHistoryEntry = {
  status_type: 'winner_status' | 'prize_status';
  status_value: string;
  note: string | null;
  created_at: string;
};

export type PublicWinnerListEntry = {
  product_id: string;
  product_name: string;
  product_slug: string | null;
  product_image_url: string | null;
  prize_value: number;
  winner_name: string;
  masked_phone: string;
  winner_ticket_number: string;
  total_entries: number;
  drawn_at: string;
  winner_status: WinnerStatus;
  winner_avatar_url: string | null;
  winner_city: string | null;
  winner_province: string | null;
};

export type User = {
  id: string;
  // Live schema (verified 2026-07-27): NOT NULL, no default — was incorrectly `string | null` here.
  name: string;
  phone: string;
  created_at: string;
  auth_user_id?: string | null;
  jazzcash_number?: string | null;
  avatar_url?: string | null;
  referral_code?: string | null;
  referral_device_token?: string | null;
  referred_by?: string | null;
  // Added 2026-07-27 (Phase 3.5 schema audit): real columns, previously missing from this type.
  cnic?: string | null;
  email?: string | null;
  auth_provider?: string;
};

export type UserProfileDetails = {
  auth_user_id: string;
  city: string | null;
  province: string | null;
  country: string | null;
  date_of_birth: string | null;
  created_at: string;
  updated_at: string;
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
  // Added 2026-07-27 (Phase 3.5 schema audit): real column, previously missing from this type.
  user_id?: string | null;
};

export type AdminAuditLogEntry = {
  id: string;
  action_type: string;
  target_id: string | null;
  details: Record<string, unknown> | null;
  created_by: string;
  created_at: string;
};

export type WinnerCertificate = {
  id: string;
  draw_result_id: string;
  winner_user_id: string;
  storage_path: string;
  file_name: string | null;
  uploaded_by: string;
  created_at: string;
};

export type AppNotification = {
  id: string;
  title: string;
  message: string;
  target_phone: string | null;
  link: string | null;
  kind: string | null;
  created_at: string;
  // Added 2026-07-27 (Phase 3.5 schema audit): real column, previously missing from this type.
  is_read?: boolean | null;
};

export type AppSetting = {
  key: string;
  value: unknown;
  updated_at: string;
};

// Added 2026-07-27 (Phase 3.5 schema audit): real table, not previously represented here.
// Not currently queried from application code (see supabase/*.sql for its origin).
export type AdminSetting = {
  key: string;
  value: string;
  updated_at: string;
};

export type VerificationDocument = {
  id: string;
  title: string;
  description: string;
  image_url: string;
  image_path: string;
  is_visible: boolean;
  sort_order: number;
  created_at: string;
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
  seo_title: string | null;
  meta_description: string | null;
  meta_keywords: string | null;
  slug: string | null;
  indexable: boolean;
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
      user_profile_details: Table<
        UserProfileDetails,
        Pick<UserProfileDetails, 'auth_user_id'> &
          Partial<Pick<UserProfileDetails, 'city' | 'province' | 'country' | 'date_of_birth' | 'created_at' | 'updated_at'>>,
        Partial<Pick<UserProfileDetails, 'city' | 'province' | 'country' | 'date_of_birth' | 'updated_at'>>
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
      admin_settings: Table<
        AdminSetting,
        Pick<AdminSetting, 'key' | 'value'>,
        Partial<Pick<AdminSetting, 'value'>>
      >;
      verification_documents: Table<
        VerificationDocument,
        Pick<VerificationDocument, 'title' | 'description' | 'image_url' | 'image_path'> &
          Partial<Pick<VerificationDocument, 'is_visible' | 'sort_order'>>,
        Partial<Pick<VerificationDocument, 'title' | 'description' | 'image_url' | 'image_path' | 'is_visible' | 'sort_order'>>
      >;
      auth_migration_config: Table<AuthMigrationConfig>;
      admin_audit_log: Table<
        AdminAuditLogEntry,
        Pick<AdminAuditLogEntry, 'action_type'> &
          Partial<Pick<AdminAuditLogEntry, 'target_id' | 'details'>>,
        never
      >;
      winner_certificates: Table<
        WinnerCertificate,
        Pick<WinnerCertificate, 'draw_result_id' | 'winner_user_id' | 'storage_path'> &
          Partial<Pick<WinnerCertificate, 'file_name'>>,
        never
      >;
      draw_sessions: Table<DrawSession, never, never>;
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
          prize_status: PrizeStatus;
          prize_tracking_note: string | null;
          winner_status: WinnerStatus;
        }>;
      };
      update_winner_status: {
        Args: { p_draw_result_id: string; p_status: WinnerStatus; p_note?: string | null };
        Returns: void;
      };
      get_draw_status_history: {
        Args: { requested_product_id: string };
        Returns: DrawStatusHistoryEntry[];
      };
      get_public_winners_list: {
        Args: Record<string, never>;
        Returns: PublicWinnerListEntry[];
      };
      get_my_wins: {
        Args: Record<string, never>;
        Returns: PublicWinnerListEntry[];
      };
      get_draw_ticket_numbers: {
        Args: { p_product_id: string };
        Returns: Array<{ ticket_number: string }>;
      };
      advance_draw_state: {
        Args: { p_product_id: string; p_new_state: DrawSessionState };
        Returns: void;
      };
      get_my_certificates: {
        Args: Record<string, never>;
        Returns: Array<{
          certificate_id: string;
          product_name: string;
          storage_path: string;
          file_name: string | null;
          created_at: string;
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
        Args: { requested_device_token: string };
        Returns: Array<{
          referral_code: string;
          successful_referrals: number;
          available_rewards: number;
          redeemed_rewards: number;
        }>;
      };
      claim_referral_code: {
        Args: { requested_code: string; requested_device_token: string };
        Returns: string;
      };
      get_referral_eligible_products: {
        Args: Record<string, never>;
        Returns: Product[];
      };
      get_available_referral_rewards: {
        Args: { requested_device_token: string };
        Returns: Array<{ reward_id: string; expires_at: string }>;
      };
      redeem_referral_reward: {
        Args: {
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
      check_entry_exists: {
        Args: { p_product_id: string; p_phone: string };
        Returns: boolean;
      };
      check_pending_transaction_exists: {
        Args: { p_product_id: string; p_phone: string };
        Returns: boolean;
      };
      count_my_entries: {
        Args: { p_phone: string };
        Returns: number;
      };
      get_my_entries: {
        Args: { p_phone: string };
        Returns: Array<Entry & { products: Product | null }>;
      };
      get_my_pending_transactions: {
        Args: { p_phone: string };
        Returns: Array<Transaction & { products: Product | null }>;
      };
      update_prize_status: {
        Args: { p_product_id: string; p_status: PrizeStatus; p_tracking_note?: string | null };
        Returns: void;
      };
      get_my_ticket_for_draw: {
        Args: { p_product_id: string; p_phone: string };
        Returns: string | null;
      };
      verify_ticket: {
        Args: { p_ticket_number: string };
        Returns: Array<{
          product_name: string;
          product_slug: string | null;
          product_status: string;
          entry_created_at: string;
          is_winner: boolean;
          drawn_at: string | null;
        }>;
      };
    };
    Enums: {};
    CompositeTypes: {};
  };
};
