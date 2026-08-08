-- JeetoBaz Blog: admin-authored articles explaining real platform mechanics (draws, verification,
-- payments, policies) for SEO/AI-visibility purposes. Content is a lightweight markdown subset
-- (## headings, blank-line paragraphs, "- " bullets) rendered by src/components/blog-content.tsx,
-- kept simple so admin can author from a single text field without a rich block editor.
-- `cover_image` holds either a bundled local asset filename (resolved via the BLOG_COVERS map in
-- src/lib/blog.ts, used for the initial launch set) or a full https:// Storage URL (for images an
-- admin uploads later through the admin panel, once authenticated with a real session).

begin;

create table public.blog_posts (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  title text not null check (char_length(trim(title)) between 4 and 160),
  excerpt text not null check (char_length(trim(excerpt)) between 10 and 300),
  category text not null check (category in ('getting-started', 'how-it-works', 'trust-safety', 'payments', 'winners-rewards')),
  content text not null check (char_length(trim(content)) between 50 and 20000),
  cover_image text not null check (char_length(trim(cover_image)) between 3 and 500),
  read_minutes smallint not null default 5 check (read_minutes between 1 and 60),
  published_at timestamptz not null default now(),
  is_visible boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index blog_posts_published_idx on public.blog_posts (published_at desc);
create index blog_posts_category_idx on public.blog_posts (category);

create function public.set_blog_post_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger set_blog_post_updated_at
before update on public.blog_posts
for each row execute function public.set_blog_post_updated_at();

alter table public.blog_posts enable row level security;

create policy "Public reads visible blog posts"
  on public.blog_posts
  for select
  to anon, authenticated
  using (is_visible = true or lower(coalesce((select auth.jwt() ->> 'email'), '')) = 'shoaibmithall@gmail.com');

create policy "JeetoBaz admin manages blog posts"
  on public.blog_posts
  for all
  to authenticated
  using (lower(coalesce((select auth.jwt() ->> 'email'), '')) = 'shoaibmithall@gmail.com')
  with check (lower(coalesce((select auth.jwt() ->> 'email'), '')) = 'shoaibmithall@gmail.com');

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'blog-covers',
  'blog-covers',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp']
)
;

create policy "JeetoBaz admin uploads blog covers"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'blog-covers' and lower(coalesce((select auth.jwt() ->> 'email'), '')) = 'shoaibmithall@gmail.com');

create policy "JeetoBaz admin updates blog covers"
  on storage.objects for update to authenticated
  using (bucket_id = 'blog-covers' and lower(coalesce((select auth.jwt() ->> 'email'), '')) = 'shoaibmithall@gmail.com')
  with check (bucket_id = 'blog-covers' and lower(coalesce((select auth.jwt() ->> 'email'), '')) = 'shoaibmithall@gmail.com');

create policy "JeetoBaz admin deletes blog covers"
  on storage.objects for delete to authenticated
  using (bucket_id = 'blog-covers' and lower(coalesce((select auth.jwt() ->> 'email'), '')) = 'shoaibmithall@gmail.com');

commit;
