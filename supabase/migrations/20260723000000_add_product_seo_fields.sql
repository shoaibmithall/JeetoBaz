ALTER TABLE products ADD COLUMN IF NOT EXISTS seo_title text;
ALTER TABLE products ADD COLUMN IF NOT EXISTS meta_description text;
ALTER TABLE products ADD COLUMN IF NOT EXISTS meta_keywords text;
ALTER TABLE products ADD COLUMN IF NOT EXISTS slug text;
ALTER TABLE products ADD COLUMN IF NOT EXISTS indexable boolean DEFAULT true;
