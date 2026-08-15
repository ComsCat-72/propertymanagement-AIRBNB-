ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS features jsonb NOT NULL DEFAULT '[]'::jsonb;

UPDATE public.plan_limits SET label = 'Standard', price_rwf = 7000 WHERE plan = 'tier1';
UPDATE public.plan_limits SET label = 'Premium', price_rwf = 10000 WHERE plan = 'tier2';