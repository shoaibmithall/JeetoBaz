-- Testimonials: real reviews collected from actual verified winners (via Google, Trustpilot,
-- WhatsApp, or the website), curated and entered by an admin who copy-pastes the winner's actual
-- words -- never generated or invented. Optionally linked to the real draw_results row the review
-- is about, for traceability. This is distinct from brand_showcase_images (which deliberately
-- carries no names/claims at all): a testimonial DOES carry a name and a claim, so it must always
-- be grounded in something a real person actually said, matching the same non-fabrication
-- standard already applied to verification_documents and brand_showcase_images.

begin;

create table public.testimonials (
  id uuid primary key default gen_random_uuid(),
  draw_result_id uuid references public.draw_results(id) on delete set null,
  reviewer_name text not null check (char_length(trim(reviewer_name)) between 2 and 100),
  review_text text not null check (char_length(trim(review_text)) between 10 and 1000),
  rating smallint not null check (rating between 1 and 5),
  source text not null default 'google' check (source in ('google', 'trustpilot', 'website', 'whatsapp')),
  source_url text check (source_url is null or source_url ~ '^https://'),
  is_visible boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

alter table public.testimonials enable row level security;

create policy "Public reads visible testimonials"
  on public.testimonials
  for select
  to anon, authenticated
  using (is_visible = true or lower(coalesce((select auth.jwt() ->> 'email'), '')) = 'shoaibmithall@gmail.com');

create policy "JeetoBaz admin manages testimonials"
  on public.testimonials
  for all
  to authenticated
  using (lower(coalesce((select auth.jwt() ->> 'email'), '')) = 'shoaibmithall@gmail.com')
  with check (lower(coalesce((select auth.jwt() ->> 'email'), '')) = 'shoaibmithall@gmail.com');

commit;
