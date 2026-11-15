# Meka Studio — Videography & Photography

Full-stack site + CMS. **Next.js 16 (App Router)** · **Supabase** (Auth, Postgres, Storage) · **Drizzle ORM** ·
**Mailgun** (transactional e-mail) · **GSAP + ScrollTrigger + SplitText** · **Lenis** · Tailwind v4 · Lucide icons.

## What's inside
| Area | Details |
|---|---|
| Design | OLED black + signal-green, **bento grids**, **liquid-glass** surfaces (SVG refraction on Chromium, blur fallback), viewfinder HUD, film grain |
| Motion | One engine (`components/ui/SmoothScroll.tsx`): Lenis ⇄ GSAP ticker, declarative `data-reveal / data-stagger / data-parallax / data-count`, `SplitHeading`, MutationObserver for late content, refresh on fonts/images/route changes, html-level failsafe so content can never stay hidden |
| Public pages | Home (hero, about bento, work, services & pricing, process, testimonials, FAQ, booking), `/work`, `/work/[slug]` (player + bento gallery), `/privacy`, `/terms`, `/unsubscribe` |
| SEO / web basics | `robots.txt`, `sitemap.xml`, `manifest.webmanifest`, dynamic OG image, apple icon, `/.well-known/security.txt`, `humans.txt`, JSON-LD (business, website, FAQ, video), canonical URLs, 404 / error / global-error |
| Auth | **Supabase Auth** (e-mail + password). Allow-list table `profiles` (owner / editor), password reset, team management, rate-limited login |
| CMS (`/admin`) | Dashboard + setup checklist · Bookings (status, notes, **reply by e-mail**, auto status e-mails) · Portfolio (poster, preview loop, full film, **gallery**) · **Media library** (drag-drop, multi-upload, progress, video + images) · Services · Packages · Testimonials · FAQ · Subscribers (CSV) · E-mail log · Team · Settings |
| Uploads | Browser → Supabase Storage **directly** via server-signed URLs (no body-size limits, live progress). Bucket auto-created. Library picker in every media field |
| E-mail | Mailgun HTTP API: studio notification, client confirmation, status updates, custom replies, newsletter welcome, test e-mail. Everything logged in `email_logs`; optional signed webhook for delivery status |
| Security | CSP + HSTS + frame/MIME/referrer/permissions headers, same-origin (CSRF) checks, Zod validation, honeypots, Postgres rate limits, `getUser()` verified sessions, RLS script, header-injection-safe mail |

## Setup
1. **Supabase** → create a project. Copy URL, anon key, service-role key and the Postgres connection string.
2. Copy `.env.example` → `.env` and fill it in (see comments). Never expose `SUPABASE_SERVICE_ROLE_KEY` with a `NEXT_PUBLIC_` prefix.
3. `npm install && npx drizzle-kit push` (creates tables — uses `DATABASE_URL_MIGRATIONS` session pooler if set), then run `supabase/setup.sql` in the Supabase SQL editor (enables RLS, creates the bucket) or `node scripts/apply-setup-sql.mjs` locally.
4. **Auth e-mail templates** (Supabase → Authentication → Email Templates → *Reset password*): set the link to  
   `{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=recovery&next=/admin/reset-password`  
   and add your site URL + `/auth/callback` to *URL Configuration → Redirect URLs*.
5. `npm run dev` → open `/admin/login` → create the owner (needs `SETUP_TOKEN`, or sign in with an e-mail listed in `ADMIN_EMAILS`) → *Dashboard → Import starter content*.
6. **Mailgun**: add `MAILGUN_API_KEY`, `MAILGUN_DOMAIN` (`MAILGUN_REGION=eu` for the EU region), `MAIL_FROM`. Use *Admin → E-mail log → Send test*.  
   Optional delivery tracking: Mailgun → Webhooks → point *delivered / failed / opened / clicked / complained* to `https://your-site/api/webhooks/mailgun` and set `MAILGUN_WEBHOOK_SIGNING_KEY`.
7. Set booking alert recipient in *Admin → Settings → E-mail & SEO*.

### Deploying to Cloudflare Workers
The app runs on Cloudflare Workers through [`@opennextjs/cloudflare`](https://opennext.js.org/cloudflare).

- `wrangler.jsonc` + `open-next.config.ts` are pre-configured (worker name `meka-studio`, `nodejs_compat`).
- Postgres driver: **postgres.js v3** — a plain `import "postgres"` auto-resolves to its Cloudflare socket build (the `workerd` export condition is set by OpenNext), so the same code runs on Node (build/prerender) and Workers (runtime).
- `src/db/index.ts` creates one client per request with `prepare: false` — required by the Supavisor **transaction pooler**, which cannot guarantee named prepared statements across pooled connections.
- Runtime: `DATABASE_URL` should be the Supabase **transaction pooler** URI (port 6543, IPv4-safe).
- **CI/CD**: every push to `main` runs `.github/workflows/deploy.yml` (install → OpenNext build → `wrangler deploy`). Required repo secrets: `CLOUDFLARE_API_TOKEN`, plus build-time `DATABASE_URL`, `NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
- Manual deploy: `npm run deploy` (needs `CLOUDFLARE_API_TOKEN` env var, or `wrangler login`).
- Server-only secrets go to the Worker, not the bundle: `npx wrangler secret put DATABASE_URL` (same for `SUPABASE_SERVICE_ROLE_KEY`, `SETUP_TOKEN`, `MAILGUN_*`).

### Moving off Netlify Database / Netlify env
Migrate the e-mail env vars you configured in Netlify (`MAILGUN_*`) into this app's environment; no Netlify-specific packages remain. The app runs on any Node host (Vercel, Netlify, Fly, Docker…).

## Scripts
`npm run dev` · `npm run build` · `npx vitest run` · `npx drizzle-kit push`

## Notes
- Public pages are ISR (60 s) and revalidated instantly on every CMS save. If the database is unreachable they fall back to bundled starter content.
- Keep hero / preview loops short (3–8 s, < 6 MB). Upload long films to YouTube/Vimeo and paste the link in *Full film*.
- Supabase's global upload limit is 50 MB on the free plan; raise `MAX_UPLOAD_MB` after upgrading.
