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
  category?: string | null;
  is_deleted?: boolean;
  deleted_at?: string | null;
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

export type NotificationPreferences = {
  prize_updates: boolean;
  winner_announcements: boolean;
  payment_notifications: boolean;
  promotional: boolean;
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
  // Sequential, human-friendly Member ID (formatted client-side as JB-100001) — replaces the old UUID-slice-based one.
  member_number: number;
  // Added 2026-08-04 (Settings Phase 4): per-category opt-in/out, defaults to all-true in the DB.
  notification_preferences: NotificationPreferences;
  // Added 2026-08-11 (Phase 3): admin ban/suspend. Defaults to false/null for every existing row.
  is_banned: boolean;
  ban_reason?: string | null;
  banned_at?: string | null;
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

export type SupportTicketKind = 'feedback' | 'problem';
export type SupportTicketStatus = 'open' | 'resolved';

export type SupportTicket = {
  id: string;
  phone: string | null;
  name: string | null;
  subject: string;
  message: string;
  kind: SupportTicketKind;
  status: SupportTicketStatus;
  admin_note: string | null;
  created_at: string;
  resolved_at: string | null;
};

export type RefundRequestStatus = 'pending' | 'approved' | 'rejected';

export type RefundRequest = {
  id: string;
  transaction_id: string;
  phone: string;
  amount: number;
  reason: string | null;
  status: RefundRequestStatus;
  admin_note: string | null;
  created_at: string;
  resolved_at: string | null;
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

export type BrandShowcaseImage = {
  id: string;
  image_url: string;
  image_path: string;
  is_visible: boolean;
  sort_order: number;
  created_at: string;
};

export type TestimonialSource = 'google' | 'trustpilot' | 'website' | 'whatsapp';

export type Testimonial = {
  id: string;
  draw_result_id: string | null;
  reviewer_name: string;
  review_text: string;
  rating: number;
  source: TestimonialSource;
  source_url: string | null;
  is_visible: boolean;
  sort_order: number;
  created_at: string;
};

export type BlogCategory = 'getting-started' | 'how-it-works' | 'trust-safety' | 'payments' | 'winners-rewards';

export type BlogPost = {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  category: BlogCategory;
  content: string;
  cover_image: string;
  read_minutes: number;
  published_at: string;
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
  category: string | null;
};

export type AuthMigrationConfig = {
  key: string;
  value: string;
};

// Added 2026-08-05: Stage 1 of Web Push notifications (supabase/migrations/20260805120000_add_push_subscriptions.sql).
export type PushSubscriptionRow = {
  id: string;
  phone: string;
  endpoint: string;
  p256dh: string;
  auth: string;
  user_agent: string | null;
  created_at: string;
};

// Added 2026-08-05: Wallet Phase 1 (supabase/migrations/20260805150000_add_wallet_foundation.sql).
// Both tables are read-only from the client -- writes only ever happen via the
// topup_wallet_atomic / enter_draw_from_wallet_atomic SECURITY DEFINER functions.
export type WalletRow = {
  phone: string;
  balance: number;
  updated_at: string;
};

export type WalletTransactionType = 'topup' | 'entry' | 'refund' | 'bonus' | 'adjustment';

export type WalletTransactionRow = {
  id: string;
  phone: string;
  type: WalletTransactionType;
  amount: number;
  balance_after: number;
  reference: string | null;
  created_at: string;
};

// Added 2026-08-05: Wallet Phase 2 (supabase/migrations/20260805160000_add_wallet_topup_requests.sql).
export type WalletTopupStatus = 'pending' | 'approved' | 'rejected';

export type WalletTopupRequest = {
  id: string;
  user_id?: string | null;
  phone: string;
  user_name?: string | null;
  amount: number;
  payment_method?: string | null;
  sender_name?: string | null;
  sender_phone?: string | null;
  reference?: string | null;
  receipt_path?: string | null;
  status: WalletTopupStatus;
  created_at: string;
  reviewed_at?: string | null;
  reviewed_by?: string | null;
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
        Partial<ProductFormData> & Partial<Pick<Product, 'current_entries' | 'status' | 'winner_phone' | 'is_deleted' | 'deleted_at'>>
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
      // Insert-only from the client -- status only ever changes via the approve_wallet_topup_request /
      // reject_wallet_topup_request SECURITY DEFINER functions, never a direct update.
      wallet_topup_requests: Table<
        WalletTopupRequest,
        Pick<WalletTopupRequest, 'phone' | 'amount'> &
          Partial<Pick<WalletTopupRequest, 'user_id' | 'user_name' | 'payment_method' | 'sender_name' | 'sender_phone' | 'reference' | 'receipt_path' | 'status'>>,
        never
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
      refund_requests: Table<
        RefundRequest,
        Pick<RefundRequest, 'transaction_id' | 'phone' | 'amount'> & Partial<Pick<RefundRequest, 'reason'>>,
        Partial<Pick<RefundRequest, 'status' | 'admin_note' | 'resolved_at'>>
      >;
      support_tickets: Table<
        SupportTicket,
        Pick<SupportTicket, 'subject' | 'message'> & Partial<Pick<SupportTicket, 'phone' | 'name' | 'kind'>>,
        Partial<Pick<SupportTicket, 'status' | 'admin_note' | 'resolved_at'>>
      >;
      verification_documents: Table<
        VerificationDocument,
        Pick<VerificationDocument, 'title' | 'description' | 'image_url' | 'image_path'> &
          Partial<Pick<VerificationDocument, 'is_visible' | 'sort_order'>>,
        Partial<Pick<VerificationDocument, 'title' | 'description' | 'image_url' | 'image_path' | 'is_visible' | 'sort_order'>>
      >;
      brand_showcase_images: Table<
        BrandShowcaseImage,
        Pick<BrandShowcaseImage, 'image_url' | 'image_path'> & Partial<Pick<BrandShowcaseImage, 'is_visible' | 'sort_order'>>,
        Partial<Pick<BrandShowcaseImage, 'is_visible' | 'sort_order'>>
      >;
      testimonials: Table<
        Testimonial,
        Pick<Testimonial, 'reviewer_name' | 'review_text' | 'rating'> &
          Partial<Pick<Testimonial, 'draw_result_id' | 'source' | 'source_url' | 'is_visible' | 'sort_order'>>,
        Partial<Pick<Testimonial, 'is_visible' | 'sort_order'>>
      >;
      blog_posts: Table<
        BlogPost,
        Pick<BlogPost, 'slug' | 'title' | 'excerpt' | 'category' | 'content' | 'cover_image'> &
          Partial<Pick<BlogPost, 'read_minutes' | 'published_at' | 'is_visible' | 'sort_order'>>,
        Partial<Pick<BlogPost, 'slug' | 'title' | 'excerpt' | 'category' | 'content' | 'cover_image' | 'read_minutes' | 'published_at' | 'is_visible' | 'sort_order'>>
      >;
      push_subscriptions: Table<
        PushSubscriptionRow,
        Pick<PushSubscriptionRow, 'phone' | 'endpoint' | 'p256dh' | 'auth'> & Partial<Pick<PushSubscriptionRow, 'user_agent'>>
      >;
      // Read-only from the client -- all writes go through topup_wallet_atomic /
      // enter_draw_from_wallet_atomic, never a direct insert/update.
      wallets: Table<WalletRow, never, never>;
      wallet_transactions: Table<WalletTransactionRow, never, never>;
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
      update_notification_preferences: {
        Args: { p_preferences: NotificationPreferences };
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
      topup_wallet_atomic: {
        Args: { p_phone: string; p_amount: number; p_reference?: string };
        Returns: Array<{ ok: boolean; error?: string; new_balance?: number }>;
      };
      enter_draw_from_wallet_atomic: {
        Args: { p_product_id: string; p_phone: string; p_name?: string };
        Returns: Array<{ ok: boolean; error?: string; entry_id?: string; new_balance?: number }>;
      };
      adjust_wallet_balance_atomic: {
        Args: { p_phone: string; p_amount: number; p_type: string; p_reference?: string };
        Returns: Array<{ ok: boolean; error?: string; new_balance?: number }>;
      };
      get_my_pending_wallet_topup_requests: {
        Args: { p_phone: string };
        Returns: Array<{
          id: string;
          amount: number;
          payment_method: string | null;
          status: string;
          created_at: string;
        }>;
      };
      check_pending_wallet_topup_exists: {
        Args: { p_phone: string };
        Returns: boolean;
      };
      approve_wallet_topup_request: {
        Args: { p_request_id: string };
        Returns: Array<{ ok: boolean; error?: string; new_balance?: number }>;
      };
      reject_wallet_topup_request: {
        Args: { p_request_id: string; p_reason?: string };
        Returns: Array<{ ok: boolean; error?: string; reason?: string }>;
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
