# JeetoBaz Feature Guide

> Detailed description of every feature. Last updated: 2026-07-15.

---

## 1. Home Screen (`index.tsx`)

**Purpose:** Main landing page. Browse active draws.

**Features:**
- **Ad carousel** — Rotating banner images from `app_settings.home_ad_images`
- **Search bar** — Filter draws by name
- **Category browser** — 30+ product categories with icons (Electronics, Vehicles, Fashion, etc.)
- **Entry fee filter** — Filter by fee range (Rs.1 to Rs.1000)
- **Sort options** — Popular, Newest, Price Low/High, Entry Low
- **Product cards** — Image, name, entry fee, entries count, favorite button
- **Offline cache** — Stale-while-revalidate for slow connections
- **Favorites** — Heart icon to save products locally
- **Notifications badge** — Shows unread count

**Data sources:** `products` (active), `entries` (for user's entries), `notifications`, `app_settings`

---

## 2. Login/Profile (`login.tsx`)

**Purpose:** User registration and profile management.

**Features:**
- **Phone input** — Pakistani format (+92XXXXXXXXXX) with validation
- **Auto-login** — If `userPhone` exists in AsyncStorage, skip login
- **New user signup** — Creates record in `users` table
- **Profile display** — Name, phone, avatar
- **Avatar upload** — Via `profile-avatars` bucket + `update_profile_avatar` RPC
- **Referral code display** — User's unique referral code
- **Logout** — Clears AsyncStorage session

**Data sources:** `users` (select/insert), `entries` (preload history)

---

## 3. Payment (`payment.tsx`)

**Purpose:** Submit payment for a draw entry.

**Features:**
- **Product display** — Name, entry fee, current entries, max entries
- **Payment method selection** — Manual receipt or JazzCash online
- **Manual receipt flow:**
  - Enter JazzCash transaction ID
  - Enter sender name and phone
  - Upload payment receipt image (max 5MB)
  - Submit → creates transaction with status 'pending'
- **JazzCash online flow:**
  - Redirects to JazzCash sandbox
  - Auto-POST form with encrypted fields
  - Returns to `payment-response.tsx` with result
- **Duplicate prevention** — Client-side 60-second cooldown
- **Pending check** — Prevents duplicate pending transactions

**Data sources:** `products` (verify), `entries` (duplicate check), `transactions` (pending check + insert)

---

## 4. Entries (`entries.tsx`)

**Purpose:** View user's entry history and pending payments.

**Features:**
- **Entry list** — All entries with product details (join)
- **Pending payments** — Transactions awaiting admin approval
- **Offline cache** — Entries cached for offline viewing
- **Ticket numbers** — Displayed per entry

**Data sources:** `entries` (join with products), `transactions` (pending only)

---

## 5. Referral System (`referral.tsx`)

**Purpose:** Referral program dashboard.

**Features:**
- **Referral code display** — Unique JB-XXXXXXXX code
- **Claim code input** — Apply someone else's referral code
- **Dashboard stats** — Successful referrals, available rewards, redeemed rewards
- **Available rewards list** — Rewards with expiry dates
- **Eligible products** — Rs.1 draws with referral slots available
- **Redeem reward** — Use a reward for a free Rs.1 entry

**Business rules:**
- Only Rs.1 campaigns eligible for referral rewards
- 10% cap on referral entries per draw
- 30-day reward expiry
- Device-based anti-fraud (one device per account)
- 7-day limit for new account referral claims
- No self-referral
- No device reuse across accounts

**Data sources:** All via RPCs (`get_referral_dashboard`, `claim_referral_code`, `redeem_referral_reward`, etc.)

---

## 6. Winner Display (`winner.tsx`)

**Purpose:** Public display of draw winner.

**Features:**
- **Winner info** — Name, masked phone (first 7 + **** + last 4), ticket number
- **Draw stats** — Total entries, draw timestamp
- **Product details** — Image, name, description
- **Winner photo** — If uploaded by admin

**Data sources:** `products`, `draw_results` (via `get_public_draw_result` RPC), `entries`

---

## 7. Admin Panel (`admin.tsx`)

**Purpose:** Complete admin management interface.

**Features:**
- **Authentication** — Email+password via Supabase Auth
- **Dashboard tabs:**
  - Products — Create, edit, delete, toggle active/completed
  - Users — View all registered users
  - Entries — View all entries across draws
  - Transactions — View all payments, approve/reject
  - Ads — Upload/manage home ad carousel images
  - Notifications — Create targeted or broadcast notifications

- **Payment approval workflow:**
  1. View receipt image (signed URL)
  2. Verify transaction details
  3. Approve → creates entry, increments current_entries, removes receipt
  4. Reject → updates transaction status

- **Product management:**
  - Create new draw with name, fee, max entries, image
  - Edit existing draw details
  - Toggle status (active/completed/cancelled)
  - Delete draw (with confirmation)

- **Winner photo upload** — Via `winner-media` bucket

**Data sources:** `products`, `users`, `entries`, `transactions`, `notifications`, `app_settings`

---

## 8. Draw Execution (`draw.tsx`)

**Purpose:** Admin-only draw execution screen.

**Features:**
- **Admin verification** — Checks `auth.uid()` matches admin UUID
- **Draw conditions display** — Shows entries count vs max_entries
- **Draw execution** — Calls `run_jeetobaz_draw` RPC
- **Result display** — Winner name, ticket, phone, total entries
- **Time restriction** — Only executable between 10:00 PM – 10:59 PM PKT

**Data sources:** `products`, `entries`, `draw_results` (via RPC)

---

## 9. Localization (`i18n.ts`)

**Purpose:** Multi-language support.

**Languages:**
- English (en)
- Urdu (ur) — RTL script
- Roman Urdu (roman)

**Features:**
- 133 translation keys
- Language selection saved to AsyncStorage
- Module-level state with listener pattern
- Falls back to English if key missing

**Known issue:** Language resets on app restart (not persisted properly).

---

## 10. Theme (`use-theme.ts`)

**Purpose:** Dark/light mode support.

**Features:**
- Dark mode default
- Light mode alternative
- Theme preference persisted to AsyncStorage (`appThemeMode`)
- Two theme palettes in `src/constants/theme.ts`
- Applied via `useAppTheme()` hook

---

## 11. Explore (`explore.tsx`)

**Purpose:** Browse completed draws.

**Features:**
- Lists all products with status='completed'
- Shows winner information
- Join with entries for entry counts

---

## 12. Favorites (`favorites.tsx`)

**Purpose:** Saved/favorited products.

**Features:**
- Local storage via AsyncStorage (`favorites` key)
- Fetches favorited products from Supabase
- Add/remove favorites from home screen

---

## 13. Notifications (`notifications.tsx`)

**Purpose:** In-app notification list.

**Features:**
- Lists all notifications (newest first)
- Read/unread tracking via AsyncStorage (`readNotificationIds`)
- Targeted notifications (by phone) or broadcast (NULL target)
- Links to relevant screens

---

## 14. JazzCash Integration

### 14.1 Manual Receipt (`payment.tsx`)
- User uploads payment screenshot
- Admin manually verifies and approves
- No server-side verification

### 14.2 JazzCash Online (`jazzcash-redirect.tsx` → Edge Function)
- Browser auto-POST to JazzCash sandbox
- Server-side HMAC-SHA256 verification
- IPN callback updates transaction status
- Redirect to `payment-response.tsx` with result

---

## 15. Social Media Integration (`social-icons.tsx`)

**Platforms:** Facebook, Instagram, TikTok, YouTube, Snapchat, X (Twitter), Telegram

**Features:**
- SVG icons for each platform
- Links to JeetoBaz social media profiles
- Displayed in footer/header areas

---

## 16. Offline Support (`offline-cache.ts`)

**Purpose:** Graceful degradation for slow/no connections.

**Features:**
- Stale-while-revalidate pattern
- Cached data served immediately, refreshed in background
- Applied to: active draws, home ads, user entries
- Cache keys: `offlineCache:activeDraws`, `offlineCache:homeAds`, `offlineCache:entries:{phone}`

---

*Feature guide complete.*
