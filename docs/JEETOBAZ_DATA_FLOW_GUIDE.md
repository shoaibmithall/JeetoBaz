# JeetoBaz Data Flow Guide

> Complete data flow documentation. Last updated: 2026-07-15.

---

## 1. User Registration Flow

```
User opens app
  → login.tsx checks AsyncStorage for 'userPhone'
  → If exists: auto-login, load profile from users table
  → If not exists: show login form
  → User enters name + phone (+92XXXXXXXXXX)
  → Validation: phone regex, name length (2-80)
  → users.insert({ name, phone, jazzcash_number })
  → RLS INSERT policy validates format
  → users.select('id') to get user UUID
  → AsyncStorage: set userPhone, userName
  → Navigate to home screen
```

**Database operations:**
- `users` SELECT (check existing)
- `users` INSERT (new user)
- `users` SELECT (get avatar_url)

** AsyncStorage keys:** `userPhone`, `userName`, `userAvatarUrl`

---

## 2. Payment Flow (Manual Receipt)

```
User selects draw → payment.tsx loads
  → products.select (verify active, get fee)
  → entries.select (check duplicate)
  → transactions.select (check pending)
  → User fills form: transaction ID, sender name, phone
  → User uploads receipt image
  → payment-receipts.upload (anon, data URL → ArrayBuffer)
  → transactions.insert({
      product_id, phone, amount, jazzcash_txn_id,
      payment_method, sender_name, sender_phone,
      receipt_path, status: 'pending'
    })
  → AsyncStorage: set paymentSubmitAt:{productId}:{phone} (60s cooldown)
  → Navigate to entries screen

Admin approves:
  → admin.tsx → transactions.update({ status: 'approved', receipt_path: null })
  → entries.select (duplicate check)
  → products.select (capacity check)
  → entries.insert({ product_id, phone, name, transaction_id })
  → products.update({ current_entries: (current_entries || 0) + 1 })
  → payment-receipts.remove([receipt_path])
  → notifications.insert (notify user)
```

**Database operations:**
- `products` SELECT ×2
- `entries` SELECT ×2
- `transactions` SELECT + INSERT + UPDATE
- `entries` INSERT
- `products` UPDATE
- `notifications` INSERT

**Storage operations:**
- payment-receipts: upload → createSignedUrl → remove

---

## 3. Payment Flow (JazzCash Online)

```
User selects JazzCash online → jazzcash-redirect.tsx
  → fetch Edge Function GET with productId, phone, name
  → Edge Function:
      → users.select (verify user exists)
      → products.select (verify active, capacity)
      → entries.select (check duplicate)
      → transactions.select (check pending)
      → If no pending: transactions.insert({ status: 'initiated' })
      → Generate JazzCash form fields + HMAC-SHA256 hash
      → Return JSON with form fields + sandbox URL
  → Browser auto-POST to JazzCash sandbox
  → User completes payment on JazzCash
  → JazzCash sends IPN to Edge Function POST
  → Edge Function POST:
      → Verify HMAC-SHA256 (constant-time comparison)
      → Verify amount matches
      → If status='initiated': update to 'pending' or 'failed'
      → Redirect to payment-response.tsx with result
  → payment-response.tsx displays result
```

**Database operations (Edge Function):**
- `users` SELECT
- `products` SELECT
- `entries` SELECT
- `transactions` SELECT + INSERT + UPDATE

**Security:** HMAC-SHA256 verification, constant-time comparison, amount verification

---

## 4. Draw Flow

```
Admin navigates to draw.tsx
  → getSession() → verify admin UUID
  → products.select (get draw details)
  → entries.select (list all entries)
  → Display: entries count vs max_entries, time check
  → Admin clicks "Run Draw"
  → RPC run_jeetobaz_draw(product_id)
      → Verify auth.uid() = admin UUID
      → SELECT product FOR UPDATE (lock row)
      → Verify status = 'active'
      → Verify no existing draw_result
      → Verify entries count = max_entries
      → Verify time = 10PM PKT (hour 22)
      → SELECT random entry (ORDER BY gen_random_uuid() LIMIT 1)
      → INSERT into draw_results
      → UPDATE products SET status='completed', winner_phone=...
      → RETURN result
  → Display winner information
```

**Database operations:**
- `products` SELECT (×2, one FOR UPDATE)
- `entries` SELECT (×2, one in RPC)
- `draw_results` INSERT (via RPC)
- `products` UPDATE (via RPC)

**Business rules enforced in RPC:**
- Only admin can call (auth.uid() check)
- Only at 10PM PKT
- Entries must equal max_entries
- No existing result for this product

---

## 5. Referral Flow

### 5.1 Get Dashboard
```
referral.tsx loads
  → RPC get_referral_dashboard(phone, device_token)
      → Verify user exists by phone
      → Verify device token matches
      → Return: code, referral count, available rewards, redeemed count
  → RPC get_available_referral_rewards(phone, device_token)
      → Return: list of available reward IDs + expiry dates
  → RPC get_referral_eligible_products()
      → Return: active Rs.1 draws with referral slots
```

### 5.2 Claim Referral Code
```
User enters referral code
  → RPC claim_referral_code(phone, code, device_token)
      → Verify referred user exists
      → Verify referrer exists by code
      → Check: no self-referral
      → Check: no previous referral for this account
      → Check: account created within 7 days
      → Check: no device reuse
      → Update users.referred_by
      → INSERT referral_claims
      → INSERT 2 referral_rewards (one for referrer, one for referred)
      → Return success message
```

### 5.3 Redeem Reward
```
User selects reward + product
  → RPC redeem_referral_reward(phone, device_token, reward_id, product_id)
      → Verify user + device token
      → Verify reward exists, is available, not expired
      → Verify product is active, Rs.1, not full
      → Check referral entry limit (10% cap)
      → Check no existing entry for this product
      → INSERT entry with entry_source='referral_referrer' or 'referral_welcome'
      → UPDATE products.current_entries (atomic: coalesce + 1)
      → UPDATE referral_rewards SET status='redeemed'
      → Return ticket number
```

---

## 6. Storage Flow

### 6.1 Profile Avatar Upload
```
login.tsx → profile-avatars.upload(filePath, fileData, { upsert: true })
          → profile-avatars.getPublicUrl(filePath)
          → RPC update_profile_avatar(phone, avatarUrl)
          → AsyncStorage: set userAvatarUrl
```

### 6.2 Payment Receipt Upload
```
payment.tsx → payment-receipts.upload(filePath, dataUrlToArrayBuffer(dataUrl), { contentType })
admin.tsx   → payment-receipts.createSignedUrl(path, 3600)  (view)
admin.tsx   → payment-receipts.remove([path])  (after approval)
```

### 6.3 Winner Photo Upload
```
admin.tsx → winner-media.upload(filePath, fileData, { contentType, upsert: false })
          → winner-media.getPublicUrl(filePath)
          → products.update({ winner_photo: publicUrl })
```

### 6.4 Home Ad Upload
```
admin.tsx → home-ads.upload(filePath, fileData, { contentType, upsert: false })
          → home-ads.getPublicUrl(filePath)
          → app-settings upsert with new image URL
```

---

## 7. Authentication Flow

### 7.1 User (Phone-based)
```
App starts → _layout.tsx → login.tsx
  → AsyncStorage.getItem('userPhone')
  → If exists: skip login, load profile
  → If not: show phone input
  → On submit: INSERT into users table
  → Store phone in AsyncStorage
  → No session, no JWT, no OTP
```

### 7.2 Admin (Supabase Auth)
```
admin.tsx loads
  → supabase.auth.getSession()
  → If session exists: load admin data
  → If not: show email+password form
  → On login: supabase.auth.signInWithPassword({ email, password })
  → On auth state change: supabase.auth.onAuthStateChange()
  → On logout: supabase.auth.signOut()
  → RLS policies verify auth.uid() = admin UUID
```

---

## 8. Offline Cache Flow

```
Home screen loads
  → AsyncStorage.getItem('offlineCache:activeDraws')
  → If cache exists: render immediately (stale data)
  → Supabase query runs in background
  → On success: AsyncStorage.setItem('offlineCache:activeDraws', newData)
  → UI updates with fresh data
  → If network fails: stale data remains visible
```

**Cache keys:**
- `offlineCache:activeDraws` — Active products
- `offlineCache:homeAds` — Home ad image URLs
- `offlineCache:entries:{phone}` — User's entries

---

## 9. Notification Flow

```
Admin creates notification
  → admin.tsx → notifications.insert({ title, body, target_phone, link, kind })
  → If target_phone is NULL: broadcast to all users
  → If target_phone is set: targeted to specific user

User views notifications
  → notifications.tsx → notifications.select('*').order('created_at', {ascending:false})
  → Filter by target_phone = user's phone OR target_phone IS NULL
  → Mark as read → AsyncStorage: append to 'readNotificationIds'
```

---

*Data flow guide complete.*
