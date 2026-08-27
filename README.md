# Firm Automations -- Desktop (offline build)

This is the **offline desktop version** of Firm Automations: a fully self-contained
macOS/Windows app with no cloud dependency at all. It's a separate copy of the main
`firm-app` codebase (kept in its own `firm-app-desktop` folder/repo so the live
Vercel deployment is never touched), adapted as follows:

- **Database**: Postgres -> local SQLite. Each install gets its own private database
  file inside the OS's per-user app-data folder (`~/Library/Application Support/Firm
  Automations` on macOS, `%APPDATA%/Firm Automations` on Windows). Nothing is shared
  between machines or uploaded anywhere.
- **File attachments**: Vercel Blob -> local disk, stored alongside the database in
  the same app-data folder. Served back through a local `/api/attachments/[id]/file`
  route instead of a public CDN URL.
- **Packaging**: [Electron](electron/main.js) wraps the same Next.js app (built with
  `output: 'standalone'`) as a native desktop window. On first launch it creates the
  local database and applies the bundled Prisma migration automatically -- no setup
  step for the person installing it.
- **Login**: unchanged -- the same email + bcrypt-password NextAuth flow as the web
  app, just checked against the local database instead of the hosted one.

## Building installers

You need this repo checked out with `npm ci` run once. Cross-building a real macOS
`.dmg` or signed Windows installer from a non-matching host mostly doesn't work
(electron-builder needs an actual Mac for `.dmg`), so the supported path is:

**Recommended -- GitHub Actions (no local setup needed):**
Push a tag like `desktop-v1.0.0`, or run the "Build Desktop App" workflow manually
from the Actions tab. It builds on real `macos-latest` and `windows-latest` runners
and uploads the `.dmg`/`.zip` (mac) and `.exe` (Windows) as downloadable workflow
artifacts. See `.github/workflows/build-desktop.yml`.

**Locally, on a matching OS:**
```
npm ci
npm run dist:mac   # only works when actually run on macOS
npm run dist:win   # only works when actually run on Windows (or with Wine on Linux)
```
Installers land in `release/`.

Nothing is code-signed, so macOS will show an "unidentified developer" warning
(right-click the app -> Open) and Windows SmartScreen may warn too ("More info" ->
"Run anyway"). That's expected for an unsigned internal tool.

## Local dev

```
npm install
DATABASE_URL="file:./dev.db" npx prisma migrate dev
npm run dev
```

Unlike the web `firm-app` (Postgres), this repo's `prisma/schema.prisma` is
SQLite-only end to end, in dev and in the packaged app alike -- set `DATABASE_URL`
in `.env.local` to a local `file:./dev.db` path.

---

An internal dashboard for the firm's automations. Google Workspace login, an audit log
of every run, and six working automations ported from the firm's finance methodology:
MIS Rollforward, Journal Entry Prep, Account Reconciliation, Variance Analysis, SOX
Testing, and Financial Statements. Each produces a draft for a preparer to review --
none of them post directly to the books or file anything on their own. Each new
automation you add follows the same pattern (see "Adding your next automation" below),
so this is meant to keep growing.

## Stack

Next.js 14 (App Router) for the frontend and API routes, NextAuth for Google
Workspace login restricted to your firm's domain, Prisma + Postgres for users and the
automation run audit log, and the Claude API for the actual automation logic.

## 1. Get a Postgres database

Easiest path: create a free project at supabase.com, then grab the connection string
from Project Settings → Database → Connection String (use the "URI" one, pooled
connection). Paste it into `DATABASE_URL` in your `.env` file.

## 2. Set up Google OAuth

Go to console.cloud.google.com → APIs & Services → Credentials → Create Credentials →
OAuth client ID → Web application.

Authorized redirect URI (local dev): `http://localhost:3000/api/auth/callback/google`
Authorized redirect URI (production): `https://yourapp.com/api/auth/callback/google`

Copy the client ID and secret into `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET`.
Set `ALLOWED_EMAIL_DOMAIN` to your firm's Workspace domain (e.g. `yourfirm.com`) so
only firm accounts can sign in.

## 3. Get a Claude API key

console.anthropic.com → API Keys → Create Key. Put it in `ANTHROPIC_API_KEY`.

## 4. Local setup

```bash
cp .env.example .env   # then fill in the values from steps 1-3
npm install
npx prisma migrate dev --name init
npm run dev
```

Visit http://localhost:3000 — you'll be redirected to sign in with Google, then land
on the dashboard with all six automations. Try any card with pasted sample data (e.g.
MIS Rollforward with trial balance text, or Variance Analysis with a budget vs. actual
figure) to see the drafted output end to end.

## 5. Deploy

**Already done.** This app is live at **https://firm-app-orpin.vercel.app**, deployed
under the Vercel account neevjain-eve (project `firm-app`, scope `neevjain-eves-projects`).
All env vars (DB, Google OAuth, Anthropic key, `NEXTAUTH_URL`) are set in Vercel's
project settings, the Google OAuth client's authorised origin/redirect URI point at
this URL, and the production database schema is already pushed (via `prisma db push`,
not a formal migration history yet -- see note below).

To ship a future change: push new code and run `vercel --prod` from this folder (or
connect the project to a GitHub repo in the Vercel dashboard for git-based deploys).

Note on migrations: the production tables were created with `prisma db push` rather
than `prisma migrate dev`, so there's no `prisma/migrations` folder yet. Fine for now;
before your next schema change, run `npx prisma migrate dev --name init` locally once
(against a copy of the schema) to establish real migration history, then
`prisma migrate deploy` for subsequent changes.

## 6. Build the Android app (APK)

**Already done.** The app is a PWA wrapped into a real Android APK using Google's
Bubblewrap tool (a "Trusted Web Activity" -- same codebase, no separate app to
maintain). The signed APK is in `android-build/FirmAutomations.apk` in this folder
(and `FirmAutomations.aab` if you ever want to publish to the Play Store instead of
side-loading). Digital Asset Links are wired up (`public/.well-known/assetlinks.json`
has the real package name and signing fingerprint), so the installed app opens with
no Chrome address bar -- it looks like a native app.

**Package ID:** `com.firmautomations.app`
**Signing key:** `android-signing/firmapp-release.keystore` in this folder --
**back this up somewhere durable right now** (password manager, encrypted drive).
It cannot be regenerated, and every future update to the app must be signed with
this exact file or Android will refuse to install the update over the existing app.
Credentials for it are in `android-signing/keystore-credentials.txt`.

**Install on a phone (side-loading, no Play Store):** send
`android-build/FirmAutomations.apk` to a staff member's phone (email, Drive link,
internal site) and open it. Android will warn about installing from an unknown
source the first time -- tap through Settings to allow it for that source. This is
normal for internal, non-Play-Store apps.

**How it was built:** there's a GitHub Actions workflow
(`.github/workflows/build-apk.yml`) in the companion repo at
**github.com/neevjain-eve/firm-app** that runs the full Bubblewrap + Gradle build on
GitHub's servers (this needs a real JDK + Android SDK + Gradle toolchain that doesn't
fit in a lightweight sandbox). To rebuild after a future change:

```bash
git add -A && git commit -m "your change" && git push
gh workflow run "Build Android APK" --repo neevjain-eve/firm-app
gh run watch --repo neevjain-eve/firm-app   # or check the Actions tab in GitHub
gh run download --repo neevjain-eve/firm-app  # grabs the new APK once it's done
```

The workflow reads three repo secrets (`ANDROID_KEYSTORE_BASE64`,
`KEYSTORE_PASSWORD`, `KEY_PASSWORD`) already configured on that repo -- no need to
touch those again unless the keystore ever changes. If you bump `appVersionName`/
`appVersionCode` in `twa-manifest.json`, do that before pushing so the Play Store
(if you ever use it) sees it as a real update.

## Adding your next automation

The six automations all follow the same shape, built on two shared pieces so there's
almost no boilerplate per automation:

- `lib/runAutomation.ts` — handles auth, audit logging, and the Claude call for every
  route. Each route just supplies an `automationId`, a system prompt, and a one-line
  function that turns the request body into a prompt.
- `components/AutomationRunner.tsx` — the shared page shell (structured fields +
  textarea + run button + result). Each page just supplies its copy and field config.

To add one:

1. Add an entry to `lib/automations.ts` (id, name, description, status: 'live').
2. Create `app/api/automations/<id>/route.ts` — copy `variance-analysis/route.ts` as
   the template. Write the system prompt for that automation's logic (port it from the
   matching Cowork finance skill if you have one).
3. Create `app/automations/<id>/page.tsx` — copy any existing page and adjust the
   `fields` array and textarea copy.
4. Every run is automatically logged to `AutomationRun` for audit purposes — no extra
   wiring needed.

## Roles

Every user gets `role: "staff"` by default (see `lib/auth.ts`). To gate an automation
to partners/admins only, check `session.user.role` in that automation's page and API
route, and update roles directly in the database for now (a proper admin UI for role
management is a good Phase 2 addition).

## What's deliberately NOT in Phase 1

Background job queue (long-running automations still run synchronously in the API
route — fine for now, add Inngest or Trigger.dev once something takes >30s), direct
Zoho Books / Gmail / Drive integration (the automations here draft text output; wiring
them to actually write into those systems is Phase 2 per automation), and a proper
admin UI for managing roles and viewing the audit log (query the DB directly for now).
