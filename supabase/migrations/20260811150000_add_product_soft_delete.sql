-- Deleting a product was an immediate, permanent DELETE with only a single confirm popup as a
-- safety net. One accidental tap on a product with real entries/revenue tied to it was
-- unrecoverable without a full database backup restore. This adds a soft-delete flag instead:
-- the admin "Delete" action now just marks a row is_deleted, and the public read policy is
-- updated to hide those rows from every existing and future client query automatically (rather
-- than needing to hunt down and update every place products are queried). The admin's own
-- existing "manages products" policy is unconditional for their own uid, so they can still see
-- and restore soft-deleted rows from a new Recycle Bin view.

alter table public.products
  add column is_deleted boolean not null default false,
  add column deleted_at timestamptz;

create index products_is_deleted_idx on public.products (is_deleted);

drop policy "Anyone can read products" on public.products;

create policy "Anyone can read products"
on public.products for select
using (is_deleted = false);
