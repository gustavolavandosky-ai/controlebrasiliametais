ALTER TABLE public.manutencoes ADD COLUMN IF NOT EXISTS medida text NOT NULL DEFAULT 'km';
ALTER TABLE public.manutencoes ADD COLUMN IF NOT EXISTS horimetro numeric;
ALTER TABLE public.manutencoes ADD COLUMN IF NOT EXISTS proxima_horas numeric;