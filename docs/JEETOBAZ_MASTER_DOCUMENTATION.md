# JeetoBaz Master Documentation

> Complete project reference. Last updated: 2026-07-15.

---

## 1. Project Overview

**JeetoBaz** is a Pakistan-based lucky draw platform where users browse active draws, pay a small entry fee (Rs.1 to Rs.1000), and get a chance to win products. An admin manually verifies payments, and draws are conducted at 10:00 PM PKT with a random winner selection.

**Domain:** jeetobaz.pk
**Repository:** github.com/shoaibmithall/JeetoBaz
**Owner:** Shoaib Ahmed (shoaibmithall@gmail.com)

---

## 2. Business Model

| Revenue Stream | Description |
|----------------|-------------|
| Entry Fees | Users pay Rs.1–Rs.1000 per entry via JazzCash manual transfer or JazzCash online |
| Admin Approval | Admin manually verifies payment receipts before granting entries |
| Draw Execution | Admin runs draw at 10PM PKT when all slots are filled |
| Winner Announcement | Public winner display with masked phone number |

**Key Business Rules:**
- Draws only run between 10:00 PM – 10:59 PM Pakistan time
- Entry count must equal `max_entries` before draw can run
- Each user can have ONE entry per draw
- Referral rewards are limited to 10% of a draw's max entries
- Referral rewards only work on Rs.1 campaigns
- Referral rewards expire after 30 days

---

## 3. Architecture

```
┌─────────────────────────────────────────────────┐
│                  Frontend (Expo)                 │
│  React Native 0.85.3 + Expo 56 + TypeScript     │
│  expo-router (file-based routing)                │
│  Deployed: Netlify (primary) + GitHub Pages      │
├─────────────────────────────────────────────────┤
│              Supabase Backend                    │
│  PostgreSQL database + RLS policies              │
│  8 SECURITY DEFINER RPC functions                │
│  4 storage buckets (profile-avatars,             │
│    payment-receipts, winner-media, home-ads)     │
│  Edge Function: jazzcash-payment                 │
├─────────────────────────────────────────────────┤
│              External Services                   │
│  JazzCash (manual + online payments)             │
│  Firebase (initialized, NOT used — dead code)    │
│  PKNIC (domain registration)                     │
└─────────────────────────────────────────────────┘
```

**Deployment Architecture:**
- **Primary:** Netlify (auto-deploy from GitHub main branch)
- **Fallback:** GitHub Pages at `shoaibmithall.github.io/JeetoBaz/`
- **Supabase Project:** `jqjrfnhqqfymwfsdkwmv`
- **Edge Function:** `jazzcash-payment` (verify_jwt must be false for IPN callbacks)

---

## 4. Tech Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Framework | Expo | ~56.0.12 |
| UI Library | React Native | 0.85.3 |
| React | React | 19.2.3 |
| Language | TypeScript | ~6.0.3 (strict) |
| Routing | expo-router | ~56.2.11 |
| Backend | Supabase | @supabase/supabase-js ^2.108.2 |
| Database | PostgreSQL (via Supabase) | — |
| Storage | AsyncStorage | 2.2.0 |
| Icons | lucide-react-native | ^1.22.0 |
| Images | expo-image | ~56.0.11 |
| Animations | react-native-reanimated | 4.3.1 |
| Payments | JazzCash (manual + online) | — |
| Analytics | Firebase | ^12.15.0 (DEAD CODE) |

---

## 5. Folder Structure

```
JeetoBaz2/
├── app.json                    # Expo configuration
├── package.json                # Dependencies
├── tsconfig.json               # TypeScript config
├── assets/                     # Static assets (icons, images)
├── docs/                       # Audit reports and documentation
│   ├── CHECKPOINT-*.md         # Audit checkpoint reports
│   └── JEETOBAZ_*.md           # This documentation set
├── supabase/
│   ├── config.toml             # Supabase project config
│   ├── functions/
│   │   └── jazzcash-payment/   # Edge Function for JazzCash
│   │       └── index.ts
│   └── *.sql                   # Database migrations (13 files)
└── src/
    ├── app/                    # Expo Router pages (21 screens)
    │   ├── _layout.tsx         # Root layout + tab navigation
    │   ├── index.tsx           # Home screen
    │   ├── login.tsx           # Profile/login
    │   ├── admin.tsx           # Admin panel
    │   ├── payment.tsx         # Payment form
    │   ├── entries.tsx         # User entry history
    │   ├── draw.tsx            # Admin draw execution
    │   ├── winner.tsx          # Public winner display
    │   ├── referral.tsx        # Referral dashboard
    │   ├── explore.tsx         # Browse completed draws
    │   ├── favorites.tsx       # Favorited products
    │   ├── notifications.tsx   # In-app notifications
    │   ├── payment-response.tsx # JazzCash redirect display
    │   ├── jazzcash-redirect.tsx # Browser auto-POST to JazzCash
    │   ├── about.tsx           # About page
    │   ├── faq.tsx             # FAQ page
    │   ├── help.tsx            # Help page
    │   ├── language.tsx        # Language selection
    │   ├── privacy.tsx         # Privacy policy
    │   ├── share.tsx           # Share page
    │   └── terms.tsx           # Terms of service
    ├── components/             # Reusable UI components (15 files)
    │   ├── app-tabs.tsx        # Bottom tab navigation
    │   ├── category-browser.tsx # Product category browser
    │   ├── home-header.tsx     # Home screen header
    │   ├── social-icons.tsx    # Social media icons (7 platforms)
    │   └── ui/                 # Base UI components
    ├── constants/
    │   └── theme.ts            # AppThemes (dark/light)
    ├── hooks/
    │   └── use-theme.ts        # Theme persistence hook
    ├── lib/                    # Core libraries (11 files)
    │   ├── supabase.ts         # Supabase client singleton
    │   ├── storage.ts          # AsyncStorage wrapper
    │   ├── i18n.ts             # 3 languages (en/ur/roman)
    │   ├── referrals.ts        # Referral system helpers
    │   ├── notifications.ts    # Notification creation
    │   ├── app-settings.ts     # Home ad images
    │   ├── rate-limit.ts       # Payment cooldown (60s)
    │   ├── validation.ts       # Pakistani mobile validation
    │   ├── offline-cache.ts    # Stale-while-revalidate cache
    │   ├── product-categories.ts # 30+ product categories
    │   └── home-scroll.ts      # Home scroll position
    ├── types/
    │   └── database.ts         # All TypeScript types
    └── firebase.ts             # Firebase init (DEAD CODE)
```

---

## 6. Features

### 6.1 User Features
| Feature | Screen | Description |
|---------|--------|-------------|
| Home | `index.tsx` | Browse active draws, search, filter by category/fee, sort, favorites, ad carousel |
| Login | `login.tsx` | Phone-based signup (no password), profile management, avatar upload |
| Payment | `payment.tsx` | Manual receipt upload or JazzCash online redirect |
| Entries | `entries.tsx` | View entry history + pending payments + offline cache |
| Referral | `referral.tsx` | Referral code, claim codes, redeem Rs.1 entry rewards |
| Explore | `explore.tsx` | Browse completed draws with winner info |
| Favorites | `favorites.tsx` | Saved/favorited products |
| Winner | `winner.tsx` | Public winner display with masked phone |
| Notifications | `notifications.tsx` | In-app notification list |
| Language | `language.tsx` | Switch between English, Urdu, Roman Urdu |
| About/FAQ/Help/Terms/Privacy | `*.tsx` | Static content pages |

### 6.2 Admin Features
| Feature | Screen | Description |
|---------|--------|-------------|
| Admin Login | `admin.tsx` | Email+password via Supabase Auth |
| Product Management | `admin.tsx` | Create, edit, delete, toggle status of draws |
| Payment Approval | `admin.tsx` | View receipt, approve/reject, auto-create entry |
| Draw Execution | `draw.tsx` | Run draw at 10PM PKT via `run_jeetobaz_draw` RPC |
| Winner Management | `admin.tsx` | Upload winner photo |
| Ad Management | `admin.tsx` | Upload/manage home ad carousel images |
| User List | `admin.tsx` | View all registered users |
| Entry List | `admin.tsx` | View all entries across draws |
| Transaction List | `admin.tsx` | View all payment transactions |

### 6.3 Technical Features
| Feature | Module | Description |
|---------|--------|-------------|
| Offline Cache | `offline-cache.ts` | Stale-while-revalidate for home screen data |
| Theme | `use-theme.ts` | Dark/light mode persistence |
| Localization | `i18n.ts` | 3 languages, 133 translation keys |
| Rate Limiting | `rate-limit.ts` | 60-second payment cooldown (client-side) |
| Product Categories | `product-categories.ts` | 30+ categories with icons |
| Social Media | `social-icons.tsx` | 7 platform icons (Facebook, Instagram, TikTok, YouTube, Snapchat, X, Telegram) |

---

## 7. Future Roadmap

| Phase | Description | Priority |
|-------|-------------|----------|
| Phase 3A | Auth migration: AsyncStorage → Supabase Auth + expo-secure-store | P0 |
| Phase 3B | Referral RPC migration: phone → auth.uid() | P1 |
| Phase 4 | JazzCash Live (remove sandbox) | P1 |
| Phase 5 | Firebase integration (push notifications) | P2 |
| Phase 6 | Apple Sign-In ($99/yr) | P3 |
| Phase 7 | Performance optimization, pagination | P2 |

---

## 8. Known Issues

| Issue | Severity | Status |
|-------|----------|--------|
| User identity in plaintext AsyncStorage | HIGH | Known — Phase 3A fix |
| No server-side duplicate payment protection | HIGH | Known — needs unique index |
| Non-atomic current_entries increment | HIGH | Known — needs atomic SQL |
| Admin auth divergence (UUID vs email) | HIGH | Known — needs standardization |
| Notifications table RLS unverified | HIGH | Known — needs verification |
| Dead Firebase code | INFO | Known — can be removed |
| Language resets on restart | INFO | Known — needs AsyncStorage persistence |

---

*Master documentation complete.*
