-- Run once in the Supabase SQL editor AFTER `npx drizzle-kit push`.
-- The app talks to Postgres server-side as the DB owner (bypasses RLS). Enabling RLS with no
-- public policies keeps the auto-generated Supabase REST/anon API closed for every table.

alter table if exists public.profiles       enable row level security;
alter table if exists public.rate_limits    enable row level security;
alter table if exists public.site_settings  enable row level security;
alter table if exists public.projects       enable row level security;
alter table if exists public.services       enable row level security;
alter table if exists public.package_groups enable row level security;
alter table if exists public.packages       enable row level security;
alter table if exists public.testimonials   enable row level security;
alter table if exists public.faqs           enable row level security;
alter table if exists public.media_assets   enable row level security;
alter table if exists public.bookings       enable row level security;
alter table if exists public.subscribers    enable row level security;
alter table if exists public.email_logs     enable row level security;

-- Storage bucket for CMS uploads (the app also auto-creates it on first upload).
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('media', 'media', true, 52428800,
        array['image/jpeg','image/png','image/webp','image/avif','image/gif','video/mp4','video/webm','video/quicktime'])
on conflict (id) do nothing;

-- Public read of media is served via the bucket's public URL; writes only happen through
-- server-signed upload URLs created with the service-role key.
