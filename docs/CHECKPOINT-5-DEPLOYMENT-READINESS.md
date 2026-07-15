# Checkpoint 5: Deployment, Dependencies & Production Readiness Audit

> JeetoBaz2 — Complete deployment pipeline, build, secrets, dependencies, and production readiness analysis.
> Status: COMPLETE | Date: July 15, 2026

---

## 1. Deployment Architecture

### Current Deployment Targets

| Platform | Status | URL | Method |
|----------|--------|-----|--------|
| Web (Netlify) | ✅ LIVE | jeetobaz.pk | Netlify auto-deploy |
| Web (GitHub Pages) | ✅ LIVE | shoaibmithall.github.io/JeetoBaz/ | GitHub Actions |
| Android (Play Store) | ❌ NOT DEPLOYED | — | EAS Build configured but not used |
| iOS (App Store) | ❌ NOT DEPLOYED | — | EAS Build configured but not used |
| Supabase Edge Functions | ✅ LIVE | jazzcash-payment | Manual deploy via CLI |

### Web Deployment — Netlify

**Config:** `netlify.toml` (8 lines)
```toml
[build]
  command = "npx expo export -p web"
  publish = "dist"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

**Assessment:** Minimal but functional. Missing:
- Security headers (CSP, X-Frame-Options, etc.)
- Cache headers for static assets
- Redirect rules for SPA routing edge cases
- No `[[headers]]` section

### Web Deployment — GitHub Pages

**Config:** `.github/workflows/github-pages.yml` (57 lines)
- Triggers on push to `main` and `workflow_dispatch`
- Uses Node 22, `npm ci`, `npx expo export -p web`
- Creates `404.html` fallback, `.nojekyll`, CNAME file
- Deploys via `actions/deploy-pages@v4`

**Assessment:** Well-configured. CNAME set to `jeetobaz.pk`. No issues.

---

## 2. Build Configuration

### Expo / EAS

| Config | Value | Status |
|--------|-------|--------|
| Expo SDK | 56.0.12 | ✅ Current |
| React | 19.2.3 | ✅ Current |
| React Native | 0.85.3 | ✅ Current |
| TypeScript | 6.0.3 (strict) | ✅ Good |
| EAS CLI | >= 20.3.0 | ✅ Configured |
| EAS Project ID | `f42f9844-f567-4e25-aa4c-b2d3b842dfc3` | ✅ Set |
| `appVersionSource` | `remote` | ✅ Good |
| `autoIncrement` | `true` (production) | ✅ Good |

### EAS Build Profiles (`eas.json`)

| Profile | Purpose | Distribution | Status |
|---------|---------|-------------|--------|
| `development` | Dev client | Internal | ✅ Configured |
| `preview` | Testing | Internal (APK) | ✅ Configured |
| `production` | Release | Store | ✅ Configured |

**Assessment:** EAS is properly configured but never used. No builds have been submitted to any app store.

### App Configuration (`app.json` + `app.config.js`)

| Setting | Value | Status |
|---------|-------|--------|
| Name | JeetoBaz | ✅ |
| Slug | jeetobaz | ✅ |
| Version | 1.0.0 | ✅ |
| Scheme | jeetobaz (deep linking) | ✅ |
| iOS Bundle ID | com.jeetobaz.app | ✅ |
| Android Package | com.jeetobaz.app | ✅ |
| Icon | ./assets/images/icon.png | ✅ |
| Splash | Green (#1DB954) background | ✅ |
| Plugins | expo-router, expo-splash-screen, expo-image-picker | ✅ |
| Photo Permission | "JeetoBaz needs photo access..." | ✅ |
| Camera Permission | false (disabled) | ✅ |

---

## 3. Environment Variables & Secrets

### .env File — COMMITTED TO GIT ⚠️

**File:** `.env` (tracked by git)
```
EXPO_PUBLIC_SUPABASE_URL=https://jqjrfnhqqfymwfsdkwmv.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbG...
```

**Issue:** `.env` is committed to the repository. The `.gitignore` only ignores `.env*.local`, not `.env` itself.

**Severity:** MEDIUM
- The Supabase anon key is public by design (not a secret)
- But committing `.env` establishes a dangerous pattern — future secrets could be accidentally added
- Should be removed from git history or at minimum added to `.gitignore`

### Hardcoded Values vs Environment Variables

| Value | Location | Should Be | Status |
|-------|----------|-----------|--------|
| Supabase URL | `supabase.ts:4` | `process.env.EXPO_PUBLIC_SUPABASE_URL` | ❌ HARDCODED |
| Supabase Anon Key | `supabase.ts:5-6` | `process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY` | ❌ HARDCODED |
| Firebase Config | `firebase.ts:4-11` | Should be removed (dead code) | ❌ HARDCODED + DEAD |
| Admin Email | `draw.tsx:10` | Centralize in constants | ❌ HARDCODED |
| JazzCash Sandbox URL | Edge Function `index.ts:4-5` | Edge Function env vars | ✅ Correct |
| JazzCash Secrets | Edge Function | Supabase Edge Function secrets | ✅ Correct |

**Critical finding:** The `.env` file exists with correct values, but `supabase.ts` doesn't use `process.env` — it hardcodes the values directly. The `.env` file is effectively unused.

### Edge Function Secrets (Supabase Dashboard)

| Secret | Status | Notes |
|--------|--------|-------|
| `JAZZCASH_MERCHANT_ID` | ✅ Must be set | Required by Edge Function |
| `JAZZCASH_PASSWORD` | ✅ Must be set | Required by Edge Function |
| `JAZZCASH_INTEGRITY_SALT` | ✅ Must be set | Required by Edge Function |
| `SUPABASE_URL` | ✅ Auto-set | Supabase provides this |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ Must be set | For DB writes from Edge Function |

**Assessment:** Edge Function secrets are properly managed via Supabase dashboard (not in code). This is correct.

---

## 4. Dependencies

### Package Audit

| Category | Package | Version | Status |
|----------|---------|---------|--------|
| Core | expo | 56.0.12 | ✅ Current (SDK 56) |
| Core | react | 19.2.3 | ✅ Current |
| Core | react-native | 0.85.3 | ✅ Current |
| Core | typescript | 6.0.3 | ✅ Current |
| Database | @supabase/supabase-js | 2.108.2 | ✅ Minor update available (2.110.5) |
| Storage | @react-native-async-storage | 2.2.0 | ✅ Current |
| UI | lucide-react-native | 1.22.0 | ✅ Current |
| UI | react-native-reanimated | 4.3.1 | ✅ Current |
| UI | react-native-svg | 15.15.4 | ✅ Current |
| Image | expo-image | 56.0.11 | ✅ Current |
| Image | expo-image-picker | 56.0.18 | ✅ Current |
| Router | expo-router | 56.2.11 | ✅ Minor update available (56.2.15) |
| Dead | **firebase** | **12.15.0** | ❌ **UNUSED — REMOVE** |

### Dead Dependency: Firebase

- `firebase` ^12.15.0 is in `package.json`
- `src/firebase.ts` initializes Firebase but is never imported by any other file
- `getAuth` is imported but never used
- **Impact:** Adds ~2MB to bundle size, increases install time, potential security surface
- **Fix:** Remove `firebase` from `package.json` and delete `src/firebase.ts`

### npm Audit

| Severity | Count | Details |
|----------|-------|---------|
| Moderate | 1 | `uuid` < 11.1.1 (buffer bounds check) |
| Low | 0 | — |
| Critical | 0 | — |

The `uuid` vulnerability is a transitive dependency via `xcode` → `@expo/config-plugins`. Not directly exploitable in this app.

### Outdated Packages (Within SDK 56)

Several packages have minor updates available within the SDK 56 range:
- `expo`: 56.0.12 → 56.0.16
- `@supabase/supabase-js`: 2.108.2 → 2.110.5
- `expo-router`: 56.2.11 → 56.2.15
- `expo-constants`: 56.0.18 → 56.0.21
- `expo-image-picker`: 56.0.18 → 56.0.21
- `expo-splash-screen`: 56.0.10 → 56.0.13

**Recommendation:** Run `npm update` to get latest patches within SDK 56.

---

## 5. CI/CD Pipeline

### Current State

| Pipeline | Status | Details |
|----------|--------|---------|
| GitHub Pages deploy | ✅ Active | Auto-deploys on push to main |
| Netlify deploy | ✅ Active | Auto-deploys on push (webhook) |
| Linting | ❌ Missing | No CI step runs `expo lint` |
| Type checking | ❌ Missing | No CI step runs `tsc --noEmit` |
| Testing | ❌ Missing | No test framework configured |
| EAS Build | ❌ Not configured | No CI integration |
| Edge Function deploy | ❌ Manual | No automation |

### What's Missing

1. **No lint step in CI** — `package.json` has `"lint": "expo lint"` but no pipeline runs it
2. **No type check in CI** — `tsconfig.json` has `strict: true` but no CI validates types
3. **No test framework** — No Jest, Vitest, or any testing library configured
4. **No EAS Build integration** — EAS is configured but no CI triggers builds
5. **No Supabase CLI integration** — Edge Functions deployed manually

---

## 6. Play Store / App Store Readiness

### Android (Play Store)

| Requirement | Status | Notes |
|-------------|--------|-------|
| Package name | ✅ `com.jeetobaz.app` | Set in app.json |
| Adaptive icon | ✅ Configured | Foreground + green background |
| Version code | ✅ Auto-increment | Via EAS `appVersionSource: remote` |
| Signing | ❌ Not configured | No keystore setup |
| Privacy policy | ❌ Missing | Required by Play Store |
| Store listing | ❌ Not created | No Play Store console setup |
| AAB build | ❌ Never built | No EAS build triggered |
| `.aab` file in repo | ⚠️ 70MB file | `application-*.aab` in root (not tracked) |

### iOS (App Store)

| Requirement | Status | Notes |
|-------------|--------|-------|
| Bundle ID | ✅ `com.jeetobaz.app` | Set in app.json |
| Icons | ✅ Configured | Same as Android |
| Provisioning | ❌ Not configured | No Apple Developer setup |
| Store listing | ❌ Not created | No App Store Connect setup |
|ipa build | ❌ Never built | No EAS build triggered |

**Assessment:** App store infrastructure is configured at the Expo level but zero actual builds or submissions have been made.

---

## 7. Monitoring, Crash Reporting & Analytics

| Tool | Status | Notes |
|------|--------|-------|
| Crash reporting (Sentry) | ❌ Not configured | No crash tracking |
| Crash reporting (Firebase Crashlytics) | ❌ Not configured | Firebase is dead code |
| Analytics (Firebase Analytics) | ❌ Not configured | Firebase is dead code |
| Analytics (Expo Analytics) | ❌ Not configured | No usage tracking |
| Error monitoring | ❌ Not configured | Only console.error/console.warn |
| Uptime monitoring | ❌ Not configured | No service health checks |
| Performance monitoring | ❌ Not configured | No APM tools |
| Logging | ❌ Minimal | Only console.log in development |

**Assessment:** Zero observability. If the app crashes in production, there is no way to know.

---

## 8. Backup & Recovery

| Component | Backup Status | Notes |
|-----------|--------------|-------|
| Source code | ✅ GitHub | Git repository with 164 commits |
| Database (Supabase) | ❓ Unknown | Supabase may have automatic backups — not verified |
| Storage buckets | ❌ No backup | No automated backup of profile photos, receipts, etc. |
| Edge Functions | ⚠️ In repo | Source in `supabase/functions/` — backed up via git |
| SQL migrations | ⚠️ In repo | SQL files in `supabase/` — backed up via git |
| Environment variables | ❌ Not documented | Supabase dashboard secrets not in any backup |
| `.env` values | ⚠️ In git | Committed to repo (but should be in secrets manager) |

---

## 9. Release Process

| Step | Status | Notes |
|------|--------|-------|
| Version bumping | ✅ EAS auto-increment | For native builds |
| Changelog | ❌ Not maintained | No CHANGELOG.md |
| Git tags | ❌ Not created | No release tags in git |
| Release notes | ❌ Not maintained | No documentation |
| Rollback plan | ❌ Not documented | No rollback procedure |
| Feature flags | ❌ Not implemented | All features always on |
| staged rollout | ❌ Not configured | No Play Store staged rollout |

---

## 10. Risk Assessment

### Production Risks

| ID | Risk | Severity | Impact | Fix Effort |
|----|------|----------|--------|------------|
| DR-001 | `.env` committed to git — dangerous pattern for future secrets | **HIGH** | Future secret leakage risk | 15 min |
| DR-002 | No monitoring/crash reporting — blind to production issues | **HIGH** | Cannot detect or diagnose production failures | 1-2 hours |
| DR-003 | No CI lint/typecheck — broken code can be deployed | **HIGH** | Broken code reaches production | 30 min |
| DR-004 | Dead Firebase dependency — unused bundle size + attack surface | **MEDIUM** | Larger bundle, potential vulnerabilities | 5 min |
| DR-005 | `dist.zip` committed to git — 1.3MB of waste | **LOW** | Repo bloat | 5 min |
| DR-006 | 70MB `.aab` file in root directory | **LOW** | Disk waste (not tracked) | 5 min |
| DR-007 | No test framework — no automated quality gates | **HIGH** | Regressions undetected | 2-4 hours |
| DR-008 | No Play Store / App Store deployment | **MEDIUM** | Cannot distribute native app | 1-2 days |
| DR-009 | No backup strategy for storage buckets | **MEDIUM** | Data loss risk | 1 hour |
| DR-010 | No documentation for Edge Function deployment | **MEDIUM** | Deployment knowledge in one person's head | 30 min |
| DR-011 | Netlify config missing security headers | **MEDIUM** | Security best practice | 15 min |
| DR-012 | Supabase `.env` values hardcoded instead of using `process.env` | **MEDIUM** | Cannot configure per environment | 30 min |
| DR-013 | No CHANGELOG or release tags | **LOW** | No release history | 15 min |

---

## 11. Dependency Graph

```
JeetoBaz2
├── Web Deploy (Netlify) ← netlify.toml ← `npx expo export -p web`
├── Web Deploy (GitHub Pages) ← .github/workflows/github-pages.yml
├── Native Build (EAS) ← eas.json ← Not used
├── Edge Functions (Supabase) ← supabase/functions/ ← Manual deploy
├── Database (Supabase) ← SQL files in supabase/ ← Manual run
└── Storage (Supabase) ← RLS policies ← SQL files
```

---

*Deployment readiness audit complete.*
