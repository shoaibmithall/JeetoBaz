# Checkpoint 3: Database Dependency Graph

> JeetoBaz2 — Complete caller-to-database dependency mapping.
> Maps every TypeScript file to every database object it touches.

---

## 1. Table → Caller Mapping

### `products`
| Operation | TS File | Line | Context |
|-----------|---------|------|---------|
| SELECT | admin.tsx | 123 | loadProducts() |
| SELECT | payment.tsx | 176 | loadProduct() |
| SELECT | index.tsx | 423 | loadDraws() |
| SELECT | explore.tsx | 24 | loadCompletedDraws() |
| SELECT | favorites.tsx | 38 | loadFavorites() |
| SELECT | winner.tsx | 39 | loadProduct() |
| SELECT | draw.tsx | 43 | loadDrawDetails() |
| SELECT | admin.tsx | 504 | handleApprovePayment() — checks current_entries/max_entries |
| INSERT | admin.tsx | 295 | handleSaveProduct() |
| UPDATE | admin.tsx | 291 | handleSaveProduct() |
| UPDATE | admin.tsx | 320 | handleToggleProductStatus() |
| UPDATE | admin.tsx | 532 | handleApprovePayment() — non-atomic current_entries increment |
| DELETE | admin.tsx | 314 | handleDeleteProduct() |

### `users`
| Operation | TS File | Line | Context |
|-----------|---------|------|---------|
| SELECT | admin.tsx | 128 | loadUsers() |
| SELECT | login.tsx | 82 | loadProfile() — avatar_url only |
| SELECT | login.tsx | 101 | handleLogin() — full user lookup |
| INSERT | login.tsx | 144 | handleLogin() — new user signup |

### `entries`
| Operation | TS File | Line | Context |
|-----------|---------|------|---------|
| SELECT | admin.tsx | 133 | loadEntries() |
| SELECT | admin.tsx | 153 | checkExistingEntry() |
| SELECT | admin.tsx | 472 | handleApprovePayment() — duplicate check |
| SELECT | index.tsx | 468 | checkUserHasEntry() |
| SELECT | explore.tsx | 44 | loadEntries() |
| SELECT | entries.tsx | 62 | loadEntries() — user's own entries |
| SELECT | winner.tsx | 55 | loadEntries() |
| SELECT | draw.tsx | 59 | loadDrawDetails() |
| INSERT | admin.tsx | 520 | handleApprovePayment() — create entry |

### `transactions`
| Operation | TS File | Line | Context |
|-----------|---------|------|---------|
| SELECT | admin.tsx | 138 | loadTransactions() |
| SELECT | payment.tsx | 224 | checkPendingTransaction() |
| SELECT | entries.tsx | 68 | loadPendingPayments() |
| INSERT | payment.tsx | 249 | handleSubmitPayment() — manual receipt |
| INSERT | (Edge Function) | 247 | jazzcash-payment/index.ts — JazzCash online |
| UPDATE | admin.tsx | 455 | handleApprovePayment() — set status=approved |
| UPDATE | admin.tsx | 576 | handleRejectPayment() — set status=rejected |
| UPDATE | (Edge Function) | 153 | jazzcash-payment/index.ts — set status=failed/pending |

### `notifications`
| Operation | TS File | Line | Context |
|-----------|---------|------|---------|
| SELECT | index.tsx | 397 | loadNotifications() |
| SELECT | notifications.tsx | 38 | loadNotifications() |
| INSERT | notifications.ts | 13 | createNotification() |

### `app_settings`
| Operation | TS File | Line | Context |
|-----------|---------|------|---------|
| SELECT | app-settings.ts | 14 | getHomeAdImages() |
| UPSERT | app-settings.ts | 30 | saveHomeAdImages() |

### `draw_results`
| Operation | TS File | Line | Context |
|-----------|---------|------|---------|
| SELECT (via RPC) | winner.tsx | 45 | get_public_draw_result |
| INSERT (via RPC) | draw.tsx | 78 | run_jeetobaz_draw |

### `referral_claims`
| Operation | TS File | Line | Context |
|-----------|---------|------|---------|
| INSERT (via RPC) | referral.tsx | 153 | claim_referral_code |
| SELECT (via RPC) | referral.tsx | 90 | get_referral_dashboard (internal) |

### `referral_rewards`
| Operation | TS File | Line | Context |
|-----------|---------|------|---------|
| SELECT (via RPC) | referral.tsx | 94 | get_available_referral_rewards |
| SELECT (via RPC) | referral.tsx | 98 | get_referral_eligible_products |
| UPDATE (via RPC) | referral.tsx | 173 | redeem_referral_reward |

---

## 2. RPC → Caller Mapping

| RPC Function | TS Caller | File:Line |
|--------------|-----------|-----------|
| `run_jeetobaz_draw` | draw.tsx | draw.tsx:78 |
| `get_public_draw_result` | winner.tsx | winner.tsx:45 |
| `update_profile_avatar` | login.tsx | login.tsx:222 |
| `get_referral_dashboard` | referral.tsx | referral.tsx:90 |
| `claim_referral_code` | referral.tsx, referrals.ts | referral.tsx:153, referrals.ts:35 |
| `get_referral_eligible_products` | referral.tsx | referral.tsx:98 |
| `redeem_referral_reward` | referral.tsx | referral.tsx:173 |
| `get_available_referral_rewards` | referral.tsx | referral.tsx:94 |

---

## 3. Storage Bucket → Caller Mapping

| Bucket | TS File | Line | Operation |
|--------|---------|------|-----------|
| `payment-receipts` | payment.tsx | 129 | upload (data URL → ArrayBuffer) |
| `payment-receipts` | admin.tsx | 181 | createSignedUrl (view receipt) |
| `payment-receipts` | admin.tsx | 451 | remove (after approval) |
| `profile-avatars` | login.tsx | 207 | upload (upsert: true) |
| `profile-avatars` | login.tsx | 216 | getPublicUrl |
| `winner-media` | admin.tsx | 247 | upload (winner photo) |
| `winner-media` | admin.tsx | 256 | getPublicUrl |
| `home-ads` | admin.tsx | 398 | upload (ad image) |
| `home-ads` | admin.tsx | 407 | getPublicUrl |

---

## 4. Auth Operation → Caller Mapping

| Operation | TS File | Line | Context |
|-----------|---------|------|---------|
| `getSession()` | admin.tsx | 58 | checkAdminSession |
| `onAuthStateChange()` | admin.tsx | 64 | useEffect listener |
| `signInWithPassword()` | admin.tsx | 94 | handleAdminLogin |
| `signOut()` | admin.tsx | 106 | useEffect cleanup |
| `signOut()` | admin.tsx | 118 | handleAdminLogout |
| `getSession()` | draw.tsx | 28 | verifyAdmin |

---

## 5. AsyncStorage Key → Caller Mapping

| Key Pattern | TS File | Operation |
|-------------|---------|-----------|
| `userPhone` | login.tsx:55,117,150,166 | get/set/remove |
| `userName` | login.tsx:56,118,151,166 | get/set/remove |
| `userAvatarUrl` | login.tsx:57,89,120,166,230 | get/set/remove |
| `announcement` | admin.tsx:82,335 | get/set |
| `favorites` | index.tsx:386,489; favorites.tsx:28,57,58 | get/set |
| `readNotificationIds` | index.tsx:387; notifications.tsx:28,63,70 | get/set |
| `referralDeviceToken` | referrals.ts:17,21 | get/set |
| `pendingReferralCode` | referrals.ts:27,31,41 | get/set/remove |
| `appThemeMode` | use-theme.ts:26,35 | get/set |
| `paymentSubmitAt:{id}:{phone}` | rate-limit.ts:11,21 | get/set |
| `offlineCache:activeDraws` | index.tsx:417,431 | get/set |
| `offlineCache:homeAds` | index.tsx:446,458 | get/set |
| `offlineCache:entries:{phone}` | entries.tsx:80,83 | get/set |

---

## 6. File Dependency Graph (Import Tree)

```
src/app/admin.tsx
├── src/lib/supabase.ts
├── src/lib/storage.ts (via AsyncStorage)
├── src/lib/notifications.ts
├── src/lib/i18n.ts
└── src/constants/theme.ts

src/app/login.tsx
├── src/lib/supabase.ts
├── src/lib/storage.ts
├── src/lib/validation.ts
└── src/lib/i18n.ts

src/app/payment.tsx
├── src/lib/supabase.ts
├── src/lib/storage.ts
├── src/lib/rate-limit.ts → src/lib/storage.ts
└── src/lib/i18n.ts

src/app/index.tsx
├── src/lib/supabase.ts
├── src/lib/storage.ts
├── src/lib/offline-cache.ts → src/lib/storage.ts
├── src/lib/i18n.ts
└── src/constants/theme.ts

src/app/referral.tsx
├── src/lib/supabase.ts
├── src/lib/referrals.ts → src/lib/storage.ts
├── src/lib/i18n.ts
└── src/constants/theme.ts

src/app/draw.tsx
├── src/lib/supabase.ts
└── src/lib/i18n.ts

src/app/entries.tsx
├── src/lib/supabase.ts
├── src/lib/storage.ts
├── src/lib/offline-cache.ts → src/lib/storage.ts
└── src/lib/i18n.ts

src/app/winner.tsx
├── src/lib/supabase.ts
└── src/lib/i18n.ts

src/app/notifications.tsx
├── src/lib/supabase.ts
├── src/lib/storage.ts
└── src/lib/i18n.ts

src/app/explore.tsx
├── src/lib/supabase.ts
└── src/lib/i18n.ts

src/app/favorites.tsx
├── src/lib/supabase.ts
├── src/lib/storage.ts
└── src/lib/i18n.ts

src/app/payment-response.tsx
└── (no imports beyond React/RN/Expo)

src/app/jazzcash-redirect.tsx
└── src/lib/i18n.ts

src/lib/supabase.ts → @supabase/supabase-js
src/lib/storage.ts → @react-native-async-storage/async-storage
src/lib/notifications.ts → src/lib/supabase.ts
src/lib/referrals.ts → src/lib/supabase.ts, src/lib/storage.ts
src/lib/app-settings.ts → src/lib/supabase.ts
src/lib/rate-limit.ts → src/lib/storage.ts
src/lib/validation.ts → (no deps)
src/lib/offline-cache.ts → src/lib/storage.ts
src/lib/i18n.ts → (no deps, module-level state)
src/hooks/use-theme.ts → src/lib/storage.ts, src/constants/theme.ts
```

---

## 7. Cross-Table Relationships (Active Code Paths)

### Login Flow
```
login.tsx → users.select (lookup)
          → users.insert (signup)
          → entries.select (preload history)
          → profile-avatars.upload
          → RPC update_profile_avatar
          → AsyncStorage (session store)
```

### Payment Flow (Manual)
```
payment.tsx → products.select (verify active, fee)
            → entries.select (duplicate check)
            → transactions.select (pending check)
            → payment-receipts.upload
            → transactions.insert (with receipt_path)
            → AsyncStorage (cooldown timer)
```

### Payment Flow (JazzCash Online)
```
jazzcash-redirect.tsx → fetch Edge Function GET
Edge Function GET → users.select, products.select, entries.select, transactions.insert
Edge Function POST → transactions.select, transactions.update
                   → redirect to payment-response.tsx
```

### Draw Flow
```
draw.tsx → getSession()
         → products.select
         → entries.select
         → RPC run_jeetobaz_draw
         → (DB: entries.select + draw_results.insert + products.update)
```

### Referral Flow
```
referral.tsx → RPC get_referral_dashboard
             → RPC get_available_referral_rewards
             → RPC get_referral_eligible_products
             → RPC claim_referral_code
             → RPC redeem_referral_reward
```

### Admin Approval Flow
```
admin.tsx → transactions.update (status=approved)
          → entries.select (duplicate check)
          → products.select (capacity check)
          → entries.insert (create entry)
          → products.update (current_entries + 1) ← NON-ATOMIC
          → payment-receipts.remove
          → notifications.insert
```

---

*Checkpoint 3 Section 2 complete.*
