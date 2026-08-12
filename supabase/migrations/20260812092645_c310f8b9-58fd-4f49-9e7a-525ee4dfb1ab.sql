ALTER TABLE public.diarias ADD COLUMN IF NOT EXISTS grupo_id uuid;
CREATE INDEX IF NOT EXISTS diarias_grupo_id_idx ON public.diarias (grupo_id);