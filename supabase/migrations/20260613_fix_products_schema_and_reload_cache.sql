-- Migration: Fix products table schema and reload PostgREST cache
-- Date: 2026-06-13
-- Purpose: Ensure all required columns exist on products table and regenerate PostgREST schema cache

-- Ensure all required columns exist on products table (idempotent)
ALTER TABLE IF EXISTS public.products
  ADD COLUMN IF NOT EXISTS id uuid DEFAULT gen_random_uuid(),
  ADD COLUMN IF NOT EXISTS category_id uuid,
  ADD COLUMN IF NOT EXISTS title text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS slug text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS description text,
  ADD COLUMN IF NOT EXISTS price numeric(14,2) NOT NULL DEFAULT 0 CHECK (price >= 0),
  ADD COLUMN IF NOT EXISTS currency text NOT NULL DEFAULT 'NGN',
  ADD COLUMN IF NOT EXISTS stock int NOT NULL DEFAULT 0 CHECK (stock >= 0),
  ADD COLUMN IF NOT EXISTS image_url text,
  ADD COLUMN IF NOT EXISTS published boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS metadata jsonb DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

-- Add UNIQUE constraint on slug if it doesn't exist
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.constraint_column_usage
    WHERE table_name = 'products' AND column_name = 'slug' AND constraint_name LIKE '%slug%unique%'
  ) THEN
    ALTER TABLE public.products ADD CONSTRAINT products_slug_unique UNIQUE (slug);
  END IF;
END $$;

-- Add FK constraint on category_id if it doesn't exist
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_name = 'products' AND constraint_name = 'products_category_id_fk'
  ) THEN
    ALTER TABLE public.products
      ADD CONSTRAINT products_category_id_fk
      FOREIGN KEY (category_id) REFERENCES public.product_categories(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Create or replace function to auto-generate slug from title
CREATE OR REPLACE FUNCTION public.generate_product_slug() RETURNS TRIGGER AS $$
BEGIN
  IF NEW.slug IS NULL OR NEW.slug = '' THEN
    NEW.slug := LOWER(TRIM(BOTH FROM
      REGEXP_REPLACE(
        REGEXP_REPLACE(NEW.title, '[^a-zA-Z0-9\s-]', ''),
        '\s+', '-', 'g'
      )
    ));
    -- Ensure slug doesn't start or end with hyphen
    NEW.slug := REGEXP_REPLACE(NEW.slug, '^-+|-+$', '', 'g');
    -- If slug becomes empty, use a UUID-based slug
    IF NEW.slug = '' THEN
      NEW.slug := 'product-' || SUBSTR(gen_random_uuid()::text, 1, 8);
    END IF;
  END IF;
  RETURN NEW;
END $$
LANGUAGE plpgsql;

-- Drop existing trigger if it exists (for idempotency)
DROP TRIGGER IF EXISTS trg_generate_product_slug ON public.products;

-- Create trigger to auto-generate slug on insert/update
CREATE TRIGGER trg_generate_product_slug
BEFORE INSERT OR UPDATE ON public.products
FOR EACH ROW
EXECUTE FUNCTION public.generate_product_slug();

-- Create indexes if they don't exist
CREATE INDEX IF NOT EXISTS idx_products_published ON public.products(published, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_products_slug ON public.products(slug);
CREATE INDEX IF NOT EXISTS idx_products_category ON public.products(category_id);

-- Ensure RLS is enabled
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- Ensure proper grants
GRANT SELECT ON public.products TO anon, authenticated;
GRANT ALL ON public.products TO service_role;

-- Refresh PostgREST schema cache to fix PGRST204 errors
NOTIFY pgrst, 'reload schema';
