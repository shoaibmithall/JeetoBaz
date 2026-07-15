# JeetoBaz Implementation Rules

> Permanent engineering rules. Every future developer and AI assistant must follow these.
> Created: July 15, 2026 | Status: PERMANENT
> These rules are non-negotiable. They exist to protect the codebase.

---

## Rule 1: Never Touch Payments Without Audit

Payment logic is the most critical part of JeetoBaz. Before modifying any payment-related code:

- Read `docs/JEETOBAZ_SECURITY_GUIDE.md` first
- Read `docs/JEETOBAZ_DATA_FLOW_GUIDE.md` — payment section
- Understand the full flow: checkout → IPN → admin approval → entry creation
- Never modify the Edge Function without understanding JazzCash HMAC verification
- Never modify `approve_payment_and_create_entry` RPC without understanding the atomic operation
- Always test with both JazzCash online and manual receipt flows

---

## Rule 2: Never Modify RLS Without Migration

Row Level Security is the primary access control mechanism. Before modifying any RLS policy:

- Write a rollback script first
- Test the policy with different user roles (anon, user, admin)
- Never remove a policy without replacing it
- Never make a policy more permissive without explicit approval
- Document the change in `docs/ARCHITECTURE_DECISIONS.md`

---

## Rule 3: Never Change Referral Logic Without Documentation

The referral system involves device tracking, reward processing, and atomic RPCs. Before modifying:

- Read `docs/JEETOBAZ_FEATURE_GUIDE.md` — referral section
- Understand `process_referral_reward` RPC (atomic, SECURITY DEFINER)
- Understand `referral_devices` table and device identifier tracking
- Never modify the reward amount without updating documentation
- Always test the full referral flow: device detect → code entry → first draw entry → reward

---

## Rule 4: Always Update AI_CONTEXT

After every feature, update `docs/JEETOBAZ_AI_CONTEXT.md`. This is the most important document for future AI assistants. It must reflect:

- Any new files created
- Any existing files modified
- Any new environment variables
- Any new RPCs or database changes
- Any new business rules

If AI_CONTEXT is out of date, future AI assistants will make incorrect assumptions.

---

## Rule 5: Always Update Architecture Decisions

When making significant design choices, add an ADR to `docs/ARCHITECTURE_DECISIONS.md`. Include:

- Date
- Decision
- Reason (WHY, not just WHAT)
- Alternatives considered
- Tradeoffs
- Status (Active/Superseded/Deprecated)

If you change how something works, document WHY the old way was wrong and WHY the new way is better.

---

## Rule 6: Never Push Without Testing

Every commit must be tested before pushing:

- Run `npx expo lint` — must pass
- Run `npx tsc --noEmit` — must pass
- Test on web (`npm run web`) — must load and function
- If changing payment logic — test both JazzCash flows
- If changing RLS — test with different user roles
- If changing admin panel — test all 5 tabs

Never push code that breaks existing functionality.

---

## Rule 7: Never Deploy on Friday

No production deployments on Fridays or before holidays. Deployments should happen:

- Monday to Thursday, during business hours (10AM-5PM PKT)
- Never before a holiday weekend
- Always with a rollback plan ready

If a deployment fails, rollback immediately. Do not try to fix forward on Friday.

---

## Rule 8: Always Create Rollback

Every database change must have a rollback script. Every deployment must be reversible.

For database changes:
- Write the migration SQL
- Write the rollback SQL
- Test both directions
- Store both in `supabase/` directory

For code changes:
- Commit must be revertable
- Never force-push to main
- Never rewrite published history

---

## Rule 9: Always Update Changelog

Every user-facing change must be documented in `CHANGELOG.md`. Format:

```
## [version] - YYYY-MM-DD

### Added
- Feature description

### Changed
- Change description

### Fixed
- Bug fix description

### Removed
- Removed feature description
```

Keep it human-readable. No code in changelog.

---

## Rule 10: Always Create Git Tag Before Release

Every release must have a git tag:

```
git tag -a v1.0.0 -m "Release description"
git push origin v1.0.0
```

Tag format: `v{major}.{minor}.{patch}`

This creates a permanent reference point. If something breaks, we can always find the last known good version.

---

## Rule 11: Always Test on Android + Web

Every feature must work on both platforms:

- Web: `npm run web` — test in Chrome
- Android: `npm run android` or EAS build — test on device/emulator
- iOS: If applicable, test on simulator/device

Never ship a feature that only works on one platform.

---

## Rule 12: Never Remove Features Without Approval

Never remove an existing feature without explicit approval from the project owner. Even if a feature seems unused:

- It may be used by specific users
- It may be needed for future functionality
- Removing it may break documented workflows

If you think a feature should be removed, document your reasoning and ask for approval first.

---

## Rule 13: Never Hardcode New Secrets

Never add hardcoded secrets to source code. Environment-specific values must use:

- `process.env.EXPO_PUBLIC_*` for client-side values
- Supabase Edge Function secrets for server-side values
- Never commit `.env` files with real values

The current hardcoded Supabase values in `supabase.ts` are technical debt — do not add more.

---

## Rule 14: Always Follow the Implementation Workflow

Every feature follows this workflow:

```
Request
  ↓
Architecture Check (read AI_CONTEXT, ARCHITECTURE_DECISIONS)
  ↓
Implementation Plan (check DATABASE_GUIDE, FEATURE_GUIDE)
  ↓
Conflict Check (if conflict → STOP, resolve first)
  ↓
Code (follow existing patterns, use shared utilities)
  ↓
Testing (lint, typecheck, manual test)
  ↓
Documentation Update (AI_CONTEXT, relevant guides)
  ↓
Git Commit (descriptive message, test before push)
```

Never skip steps. Never rush to code without understanding the architecture.

---

## Rule 15: Documentation Is Part of the Feature

A feature is not complete until documentation is updated. This includes:

- `docs/JEETOBAZ_AI_CONTEXT.md` — always
- `docs/JEETOBAZ_DATABASE_GUIDE.md` — if database changed
- `docs/JEETOBAZ_FEATURE_GUIDE.md` — if new feature added
- `docs/JEETOBAZ_SECURITY_GUIDE.md` — if security-relevant
- `docs/JEETOBAZ_DATA_FLOW_GUIDE.md` — if data flow changed
- `docs/ARCHITECTURE_DECISIONS.md` — if significant design choice
- `CHANGELOG.md` — if user-facing change

Documentation is not optional. It is a mandatory part of every feature.

---

*These rules are permanent. They protect JeetoBaz's engineering quality.*
*Audit is permanently closed. Future work is implementation only.*
