---
version: alpha
colors:
  primary: "#D4AF37"
  on-primary: "#111111"
  brand-emerald: "#0A3D2E"
  brand-emerald-deep: "#042A20"
  brand-gold-bright: "#F1D77A"
  brand-ivory: "#FAF8F0"
  surface: "#FFFFFF"
  background: "#F4F7F5"
typography:
  display:
    fontFamily: "system-ui, sans-serif"
    fontSize: "29px"
    lineHeight: "35px"
  body:
    fontFamily: "system-ui, sans-serif"
    fontSize: "16px"
    lineHeight: "24px"
rounded:
  control: "12px"
  card: "20px"
  shell: "24px"
spacing:
  compact: "8px"
  control: "14px"
  section: "24px"
  shell: "52px"
components:
  auth-page:
    backgroundColor: "{colors.background}"
    textColor: "{colors.brand-emerald-deep}"
  auth-shell:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.brand-emerald-deep}"
    rounded: "{rounded.shell}"
    padding: "{spacing.shell}"
  auth-brand-rail:
    backgroundColor: "{colors.brand-emerald}"
    textColor: "{colors.brand-ivory}"
    rounded: "{rounded.card}"
  auth-brand-accent:
    backgroundColor: "{colors.brand-gold-bright}"
    textColor: "{colors.brand-emerald-deep}"
  auth-primary-action:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-primary}"
    rounded: "{rounded.control}"
    padding: "{spacing.control}"
---

## Overview

JeetoBaz should feel like a trustworthy Pakistani prize platform, not a generic fintech template. The product register is clear and task-focused; luxury green and restrained gold provide the brand expression. The memorable signature is a deep-emerald authentication rail combining the official JeetoBaz mark, verifiable trust promises, and quiet Pakistan landmark line art.

The interface must never resemble a casino, use flashing neon colors, or turn gold into bright yellow. Brand decoration stays on the rail; forms remain calm, readable, and familiar.

## Colors

The established runtime theme in `constants/theme.ts` remains canonical for global light/dark surfaces, text, borders, status colors, and non-auth screens. Auth-specific durable brand values are owned by `src/constants/auth-theme.ts` and consumed by the shared `AuthScreenShell`.

- Emerald is the authentication brand field and never an error/success substitute.
- Refined gold is the safe primary action and selected brand accent.
- Ivory is an atmospheric background only; fields and cards retain accessible surface contrast.
- Error, success, muted text, and borders come from the active application theme.

## Typography

System sans-serif remains canonical across Expo web and native. Authentication headings use a compact, heavy display treatment; form copy uses the standard body stack. Hierarchy comes from weight and spacing rather than decorative typefaces, which keeps Urdu support and future localization practical.

## Layout

At widths of 860px and above, authentication uses a 42/58 split shell capped at 1120px. The brand rail is theme-independent; the form panel follows the active theme. Below 860px the rail collapses into a compact logo header and the form becomes a single card capped at 440px. Auth pages own document scrolling and do not show the bottom tab bar.

## Elevation & Depth

Use one soft shell shadow on desktop and a lighter card shadow on mobile. Depth must support separation from the page, never imitate glossy casino chrome. Field, helper, loading, and error states reserve stable space where practical.

## Shapes

The official square logo uses continuous rounded corners. The outer shell uses 24px, mobile cards use 20px, and controls use 12px. Pills are reserved for small security/status labels.

## Components

- `AuthScreenShell` owns responsive structure, brand rail, trust proof, heading hierarchy, and auth footer treatment.
- Login and signup retain their existing Supabase, Turnstile, validation, and routing handlers.
- Password fields remain masked by default with accessible show/hide controls.
- Primary actions use refined gold with dark text; secondary auth navigation is outlined or text-based, never red.
- The Pakistan skyline is decorative and excluded from the accessibility tree.

## Do's and Don'ts

- Do keep one primary action per form and keep it stable while busy.
- Do preserve password-manager, paste, keyboard, and mobile touch behavior.
- Do keep validation text next to the responsible field.
- Do keep the official logo undistorted and on a quiet surface.
- Don't show the bottom navigation or chatbot over authentication controls.
- Don't add social login unless a real provider flow exists.
- Don't add decorative motion that competes with entering credentials.
