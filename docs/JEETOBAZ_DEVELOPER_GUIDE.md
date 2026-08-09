# JeetoBaz Developer Guide

> How to work with the JeetoBaz codebase. Last updated: 2026-07-15.

---

## 1. How the Project Works

JeetoBaz is an Expo 56 project using file-based routing (expo-router). Every file in `src/app/` becomes a route.

**Navigation structure:**
- Bottom tabs: Home, Favorites, Entries, Profile (via `_layout.tsx`)
- Stack screens: All other screens (push navigation)

**Data flow:**
1. Screen loads → reads `userPhone` from AsyncStorage
2. If phone exists → auto-login (no password)
3. Fetches data from Supabase via `supabase.from('table').select()`
4. Renders UI with Lucide icons + dark/light theme
5. User interactions trigger Supabase queries or RPCs

---

## 2. How to Run

### Prerequisites
- Node.js 18+
- npm or yarn
- Expo CLI (`npm install -g expo-cli`)
- Supabase project access

### Local Development
```bash
# Install dependencies
npm install

# Start Expo development server
npm start

# Run on specific platform
npm run android
npm run ios
npm run web
```

### Environment Setup
- Supabase URL and anon key are hardcoded in `src/lib/supabase.ts`
- No `.env` file needed (values are public anon key)
- Edge Function secrets are set in Supabase dashboard

---

## 3. How to Deploy

### Netlify (Primary)
- Auto-deploys from GitHub `main` branch
- Build command: `npx expo export --platform web`
- Output directory: `dist/`
- No manual deployment needed

### GitHub Pages (Fallback)
- Repository: `shoaibmithall/JeetoBaz`
- URL: `shoaibmithall.github.io/JeetoBaz/`
- Deployed via GitHub Actions or manual push

### Supabase
- Database migrations: Run SQL files in Supabase SQL Editor
- Edge Functions: Deploy via `supabase functions deploy jazzcash-payment`
- Storage buckets: Created via SQL migrations (not manual)

---

## 4. How to Add a Feature

### Step 1: Create Screen
Create `src/app/my-feature.tsx`:
```typescript
import { View, Text } from 'react-native';
import { useLanguage } from '@/lib/i18n';
import { useAppTheme } from '@/hooks/use-theme';

export default function MyFeature() {
  const { t } = useLanguage();
  const { theme } = useAppTheme();
  return <View><Text style={{ color: theme.text }}>{t('myFeature')}</Text></View>;
}
```

### Step 2: Add Translation Keys
Edit `src/lib/i18n.ts` — add to all 3 language objects.

### Step 3: Add Navigation (if needed)
Edit `src/app/_layout.tsx` to add tab or stack screen.

If the screen has a "Back" button, use `useSafeBack()` instead of plain
`router.back()` — see [Back Navigation Pattern](#back-navigation-pattern)
in section 8. This is not optional style preference; plain `router.back()`
is broken for any screen reachable from a non-Home tab (Explore, Favorites,
Profile).

### Step 4: Add Database Objects (if needed)
Create SQL migration in `supabase/` folder. Follow existing patterns.

### Step 5: Test
- Test on web: `npm run web`
- Test on Android: `npm run android`
- Test on iOS: `npm run ios`

---

## 5. Coding Conventions

### TypeScript
- Strict mode enabled
- All types in `src/types/database.ts`
- No `any` types — use proper typing
- Functional components only (no class components)

### React
- Hooks for state management (useState, useEffect, useCallback)
- Memoize expensive computations with useMemo
- Use useFocusEffect for screen-focus data loading
- No global state management (Redux, Zustand) — useState per component

### Styling
- StyleSheet.create for all styles
- Theme colors from `useAppTheme()` hook
- Dark mode is default, light mode is secondary
- No inline styles except dynamic values

### Naming
- Files: `kebab-case.tsx` (e.g., `payment-response.tsx`)
- Components: `PascalCase` (e.g., `HomeHeader`)
- Functions: `camelCase` (e.g., `loadProducts`)
- SQL files: `kebab-case.sql` (e.g., `products-rls-setup.sql`)
- Constants: `UPPER_SNAKE_CASE` (e.g., `HOME_PRODUCTS_LIMIT`)

---

## 6. Folder Standards

| Folder | Purpose | Contents |
|--------|---------|----------|
| `src/app/` | Screens/routes | One file per route |
| `src/components/` | Reusable UI | Shared components |
| `src/lib/` | Core logic | Database, storage, i18n, utilities |
| `src/hooks/` | Custom hooks | useTheme, etc. |
| `src/constants/` | Static data | Theme definitions |
| `src/types/` | TypeScript types | Database types, interfaces |
| `supabase/` | Database | SQL migrations, Edge Functions |
| `docs/` | Documentation | Audit reports, guides |
| `assets/` | Static assets | Images, icons, fonts |

---

## 7. Key Files Reference

| File | Purpose | Lines |
|------|---------|-------|
| `src/app/index.tsx` | Home screen (most complex) | ~1040 |
| `src/app/admin.tsx` | Admin panel (second most complex) | ~993 |
| `src/app/login.tsx` | Profile/auth | ~515 |
| `src/app/payment.tsx` | Payment form | ~444 |
| `src/app/referral.tsx` | Referral dashboard | ~399 |
| `src/lib/supabase.ts` | Supabase client singleton | ~20 |
| `src/lib/storage.ts` | AsyncStorage wrapper | ~25 |
| `src/lib/i18n.ts` | 3 languages, 133 keys | ~459 |
| `supabase/functions/jazzcash-payment/index.ts` | JazzCash Edge Function | ~299 |

---

## 8. Common Patterns

### Supabase Query Pattern
```typescript
const { data, error } = await supabase
  .from('table_name')
  .select('column1, column2')
  .eq('column', value)
  .maybeSingle();
```

### AsyncStorage Pattern
```typescript
import { getStoredValue, setStoredValue } from '@/lib/storage';
const value = await getStoredValue('key');
await setStoredValue('key', value);
```

### Theme Pattern
```typescript
const { theme } = useAppTheme();
// Use theme.background, theme.text, theme.primary, etc.
```

### i18n Pattern
```typescript
const { t } = useLanguage();
// Use t('translationKey')
```

### Back Navigation Pattern
**Never call `router.back()` directly in a screen.** Use `useSafeBack()`
from `@/lib/safe-back` instead.

Why: `src/app/_layout.tsx` registers every screen — including hidden ones
(`href: null`) — as a sibling of the visible tabs in one flat `<Tabs>`
tree, instead of nesting sub-pages inside a per-tab `Stack`. Because of
that, `router.back()` from a screen reached off a non-Home tab (Explore,
Favorites, Profile/`login.tsx`) does not reliably return to that tab — it
can land on Home instead, which is confusing and was the subject of a
multi-phase bug fix (PRs #236–#241, Aug 2026). Navigating from Home itself
is unaffected, which is why this bug is easy to miss in ad-hoc testing:
it only shows up when you actually start from a different tab.

Basic usage — falls back to plain `router.back()` if the caller didn't
specify anything, so it's always at least as safe as what a screen would
otherwise do:
```typescript
import { useSafeBack } from '@/lib/safe-back';

const goBack = useSafeBack();
// ...
<TouchableOpacity onPress={goBack}>
```

If a screen is reachable from exactly one known place (e.g. only ever
opened from `/login`), give `useSafeBack` a hardcoded fallback so Back
always lands somewhere sensible even without an explicit `from`:
```typescript
const goBack = useSafeBack('/login');
```

If a screen has several possible callers (footer link, tab menu, another
screen), have each caller pass a `from` query param naming its own path,
and let `useSafeBack()` read it with no fallback:
```typescript
// caller:
router.push({ pathname: '/some-screen', params: { from: '/favorites' } });

// some-screen.tsx:
const goBack = useSafeBack();
```

`from` always wins over a hardcoded fallback, and a hardcoded fallback
always wins over plain `router.back()`. See the comment in
`src/lib/safe-back.ts` for the full mechanism.

---

*Developer guide complete.*
