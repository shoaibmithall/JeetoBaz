# JeetoBaz Conversion Funnel Tracking — Design

Date: 2026-09-12
Status: Approved design, pre-implementation
Scope: Tracking-only first release. No pricing, payment behavior, wallet balance, draw logic, admin approval logic, winner logic, or user-visible flow changes.

## 1. Goal

Create reliable, privacy-safe conversion tracking for JeetoBaz so growth decisions can be based on the full funnel instead of traffic alone.

The first release must answer questions such as:
- Which product/campaign pages attract users who actually try to enter?
- Where do users drop between product view, Enter click, payment page, payment submission, and confirmed entry?
- Which traffic sources and devices produce meaningful funnel activity?
- How do manual-payment submissions differ from real confirmed entries?

The design prioritizes production safety over maximum analytics sophistication.

## 2. Safety Constraints

The first release MUST NOT modify:
- payment amounts or pricing
- wallet balances or wallet ledger behavior
- `enter_draw_from_wallet_atomic`
- `approve_payment_and_create_entry`
- admin approval behavior
- draw/winner selection logic
- existing payment receipt semantics
- authentication/session logic
- existing production database schema

No analytics failure may block or alter signup, payment, wallet entry, receipt upload, or navigation.

All code changes must be isolated on a non-main branch, built and reviewed before a PR is considered for merge.

## 3. Existing Architecture Relevant to Tracking

JeetoBaz already loads Google Tag Manager in `src/app/+html.tsx` using container `GTM-TZR6W32B`.

The current product-entry path is broadly:

1. User views a campaign/product page.
2. User presses an Enter CTA.
3. App navigates to `/payment` with product information.
4. User either:
   - pays from wallet, where `enter_draw_from_wallet_atomic` creates an entry immediately, or
   - submits a manual payment receipt, creating a pending transaction.
5. Manual payments become real entries only after admin approval.

The existing database remains the source of truth for confirmed business outcomes:
- `transactions` represents submitted/manual payment records.
- `entries` represents actual entries.

## 4. Tracking Strategy

Use a hybrid model:

### 4.1 GA4/GTM for marketing funnel visibility

Client-side events are pushed to `window.dataLayer` through one typed helper module.

Purpose:
- source/channel/device analysis
- landing-page analysis
- funnel drop-off analysis
- product/campaign interest analysis

### 4.2 Existing JeetoBaz database as business truth

The initial release does not add analytics tables or triggers.

Business metrics remain derived from existing production data:
- successful manual submission: a pending transaction exists
- confirmed entry: an `entries` row exists
- wallet success: wallet RPC returns success and creates an entry

This intentionally separates marketing analytics from authoritative business state.

## 5. Event Model

Primary funnel:

`campaign_view`
→ `enter_clicked`
→ `payment_viewed`
→ `payment_method_selected`
→ `payment_submitted`
→ `entry_confirmed`

Supporting events:
- `signup_started`
- `signup_completed`
- `payment_failed`
- `wallet_topup_clicked`

For this design, `source_page` means the in-app path/surface where the tracked action originated, for example `/product/<slug>`, `/`, `/favorites`, or `/recently-viewed`. It must never contain query-string or hash values that could carry sensitive data.

### 5.1 `campaign_view`

Meaning: a user has viewed an eligible product/campaign detail page.

Expected parameters:
- `product_id`
- `product_slug`
- `product_name`
- `entry_fee`
- `source_page`

Rules:
- one event per mounted page visit for the same product
- must not fire during static export/server render

### 5.2 `enter_clicked`

Meaning: user intentionally pressed an Enter CTA that leads toward payment.

Expected parameters:
- `product_id`
- `product_slug` where available
- `product_name`
- `entry_fee`
- `source_page`

Rules:
- fire only on a real user action
- analytics must never delay navigation

### 5.3 `payment_viewed`

Meaning: payment screen is successfully loaded with a valid product context.

Expected parameters:
- `product_id`
- `product_name`
- `entry_fee`
- `source_page`

Rules:
- one event per payment-screen visit/product combination
- do not fire when product context is missing

### 5.4 `payment_method_selected`

Meaning: user explicitly chose a manual payment method or explicitly started the wallet path.

Expected parameters:
- `product_id`
- `entry_fee`
- `payment_type`: `manual` or `wallet`
- `payment_method`: a non-sensitive label such as `JazzCash`, `Easypaisa`, or `wallet`

Rules:
- manual event fires on a real method-card tap, not merely because the first method is selected by default
- wallet event fires when the user presses the wallet-pay action

Never include account numbers or sender details.

### 5.5 `payment_submitted`

Meaning: user completed a meaningful payment-submission action.

Manual payment rule:
- fire only after the pending `transactions` insert succeeds.

Wallet rule:
- wallet success skips `payment_submitted` as a manual-submission concept and proceeds to `entry_confirmed`.

Expected parameters for manual submission:
- `product_id`
- `product_name`
- `entry_fee`
- `payment_type`: `manual`
- `payment_method`

No transaction receipt path, payer phone, or personal identifiers are sent.

### 5.6 `entry_confirmed`

Meaning: an actual entry has been created.

Wallet path:
- fire after `enter_draw_from_wallet_atomic` returns `{ ok: true }`.

Manual path:
- do not fire a client GA4 conversion from the admin approval session in the initial release, because that would attribute the event to the admin rather than the original customer.
- confirmed manual entries are measured from the existing `entries` table for business reporting until a later server-side attribution design is intentionally approved.

Expected wallet parameters:
- `product_id`
- `product_name`
- `entry_fee`
- `payment_type`: `wallet`
- optionally `entry_id` only if it is treated as a non-sensitive technical identifier and GTM configuration does not expose it unnecessarily. Default implementation should omit it unless needed.

### 5.7 `signup_started`

Meaning: the user has shown real signup intent, not merely loaded the page.

Initial definition:
- fire once per signup-screen mount on the first meaningful form interaction, such as editing name, phone, email, or password, or pressing the signup button
- do not fire just because `/signup` rendered

No entered form values are sent.

### 5.8 `signup_completed`

Meaning: `signUpWithEmail` completed successfully and the app is about to navigate to the email-verification step.

Rules:
- fire only on the successful signup branch
- do not fire for validation errors, existing-email responses, existing-phone responses, or failed signup attempts
- no email, phone, name, password, or auth identifiers are sent

## 6. Analytics Helper

Create:

`src/lib/growth-analytics.ts`

Responsibilities:
- provide typed event names and typed safe parameters
- push only on web/browser environments
- push to `window.dataLayer` without waiting
- silently no-op when unavailable
- respect explicit cookie rejection
- strip `undefined` values
- reject/omit sensitive fields by design
- never throw into business flows

The helper API should be small, for example conceptually:

`trackGrowthEvent(eventName, safeParams)`

The exact implementation is intentionally simple; no new analytics dependency is required.

## 7. Privacy Rules

The analytics layer MUST NOT send:
- phone number
- email address
- full name
- CNIC
- password
- authentication token/session token
- payment receipt URL/path/content
- bank/wallet account numbers
- wallet balance
- sender phone/name
- raw transaction reference that could identify a person
- URL query strings or hash fragments

Allowed examples:
- product ID
- product slug
- product name
- entry fee
- source page/path without query/hash
- payment type
- payment-method label

If a future tracking request needs a new field, it must be reviewed against this deny-list before implementation.

## 8. Cookie Consent Behavior

The current GTM loader does not load after the user explicitly stores `cookieConsent = rejected`.

The tracking helper must mirror that behavior:
- explicit rejection → no `dataLayer` event push
- accepted or no stored decision → current site behavior remains unchanged

The conversion-tracking project does not redesign the cookie-consent policy.

## 9. Deduplication

Rendering and React hydration can cause repeated component execution, so view events need local deduplication.

Rules:
- `campaign_view`: one event per product page mount/product ID
- `payment_viewed`: one event per payment mount/product ID
- `signup_started`: one event per signup-screen mount
- click events: no global dedupe; each real user click can be tracked
- success events: fire only after the corresponding success response/state transition
- retries that fail must not emit success events

Implementation should use component refs or similarly local, non-persistent guards instead of modifying the business database.

## 10. Failure Handling

Analytics is strictly non-critical.

If any of the following occurs, business behavior must continue normally:
- `window` unavailable
- `dataLayer` unavailable
- GTM blocked by an extension
- user rejects cookies
- malformed optional analytics parameter
- analytics helper encounters an exception

The helper should fail closed/no-op for analytics, not fail the user flow.

`payment_failed` may be emitted for useful high-level categories, but raw Supabase/database error text must not be sent to GA4 because error strings can unintentionally contain sensitive implementation details.

Use bounded categories such as:
- `missing_product`
- `not_logged_in`
- `draw_inactive`
- `draw_full`
- `duplicate_entry`
- `pending_payment_exists`
- `insufficient_wallet`
- `submit_failed`

## 11. Files Expected to Change in Initial Implementation

Expected primary files:
- new `src/lib/growth-analytics.ts`
- `src/app/product/[slug].tsx`
- `src/app/payment.tsx`
- `src/app/signup.tsx`

Potential additional files only if necessary for Enter CTAs that bypass the product detail page:
- `src/app/index.tsx`
- `src/app/favorites.tsx`
- `src/app/recently-viewed.tsx`

Do not modify payment/database migrations, wallet RPCs, admin approval logic, or draw logic for this initial release.

If implementation reveals that a database/RPC change is actually required, stop and re-design rather than expanding scope silently.

## 12. GTM / GA4 Configuration

Application code will emit stable `dataLayer` event names.

GTM configuration should map those custom events to GA4 events.

Recommended GA4 key-event treatment after validation:
- `signup_completed`: candidate key event
- `payment_submitted`: key event representing strong intent/manual submission
- `entry_confirmed`: key event representing an actual wallet-confirmed entry

Do not mark every intermediate funnel event as a key event.

Manual-entry business totals must continue to be reconciled with the JeetoBaz database because client GA4 cannot reliably attribute an admin-approved manual entry to the original user in this first release.

## 13. Testing Strategy

### 13.1 Static/code checks

Before PR review:
- `npm ci`
- `npm run build`
- verify no production database migration was added
- verify no changes to sensitive RPC definitions
- inspect changed-file list
- inspect diff for PII fields entering analytics

The repository currently has broad pre-existing lint debt, so repo-wide lint failure is not a release blocker for this isolated project. However, new files/edited sections must not introduce obvious new TypeScript or build errors.

### 13.2 Functional paths to verify

Product flow:
- product page loads normally
- Enter navigation still works
- no visual/UI behavior changes

Signup flow:
- validation still works
- failed signup behaves unchanged
- successful signup still routes to email verification

Manual payment flow:
- receipt selection unchanged
- existing cooldown/duplicate/pending checks unchanged
- transaction insert still creates pending payment
- analytics failure cannot prevent submission

Wallet flow:
- insufficient-balance path unchanged
- successful wallet RPC still creates entry and updates wallet as before
- tracking executes only after RPC success

Consent:
- explicit rejected consent prevents growth event pushes
- normal site operation continues regardless

### 13.3 GA4/GTM validation

Before declaring tracking usable:
- use GTM Preview/Tag Assistant or GA4 DebugView where available
- verify each intended event appears once per expected action
- verify event parameters contain no PII
- verify source/device/session context is preserved by GA4

## 14. Rollout

Phase 1: tracking only
- no UI optimization
- no conversion-copy changes
- no payment-flow simplification

Observe data for approximately 7–14 days, or until enough events exist for directional analysis.

Phase 2: analyze
- product/campaign view-to-enter rate
- enter-to-payment rate
- payment-view-to-submission rate
- wallet confirmed-entry rate
- manual submitted-payment counts reconciled with database-confirmed entries
- channel/device/landing-page differences

Phase 3: optimize one bottleneck at a time

Each meaningful production optimization should be isolated in its own small PR rather than bundled into the tracking project.

## 15. Success Criteria

The first release is successful when:
- JeetoBaz business behavior is unchanged
- product views and Enter clicks are measurable
- payment-page visits are measurable
- successful manual submissions are measurable separately from real entries
- wallet-confirmed entries are measurable
- sensitive user/payment data is absent from GA4 payloads
- explicit cookie rejection is respected
- analytics failures do not affect user actions
- the production build passes before merge
- no database/RPC/admin/draw/winner behavior changes are included

## 16. Explicit Non-Goals

Not part of this initial project:
- server-side GA4 Measurement Protocol
- storing GA client/session identifiers in JeetoBaz transactions
- attributing later admin-approved manual entries back to the original GA4 session
- new analytics database tables/triggers
- Google Ads campaign setup
- UI redesign
- payment gateway redesign
- wallet redesign
- new pricing or campaign economics
- automated winner or draw changes

These can be considered later only after the safe tracking baseline is live and producing useful data.
