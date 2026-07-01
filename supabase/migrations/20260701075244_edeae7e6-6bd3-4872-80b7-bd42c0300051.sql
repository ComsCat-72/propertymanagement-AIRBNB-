ALTER TYPE public.property_category ADD VALUE IF NOT EXISTS 'car';
ALTER TYPE public.property_category ADD VALUE IF NOT EXISTS 'motorcycle';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS achievements TEXT NOT NULL DEFAULT '';