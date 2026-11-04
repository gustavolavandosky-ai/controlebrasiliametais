ALTER TABLE public.lancamentos ADD COLUMN IF NOT EXISTS fardos integer;
COMMENT ON COLUMN public.lancamentos.fardos IS 'Fardos movimentados (MATERIAL ENFARDADO). NULL = não informado/legado.';
CREATE TABLE public.unidades_apontamentos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  produto_id uuid NOT NULL REFERENCES public.produtos(id) ON DELETE RESTRICT,
  tipo text NOT NULL CHECK (tipo IN ('bag','palete','contagem_fardo')),
  quantidade integer NOT NULL CHECK (quantidade >= 0),
  peso_kg numeric,
  saldo_calculado integer,
  responsavel text NOT NULL DEFAULT '',
  justificativa text NOT NULL DEFAULT '',
  data date NOT NULL DEFAULT CURRENT_DATE,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ON public.unidades_apontamentos (produto_id, created_at);
GRANT SELECT, INSERT ON public.unidades_apontamentos TO authenticated;
GRANT ALL ON public.unidades_apontamentos TO service_role;
ALTER TABLE public.unidades_apontamentos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Ler apontamentos permitidos" ON public.unidades_apontamentos FOR SELECT TO authenticated USING (public.pode_ver(user_id));
CREATE POLICY "Dono cria apontamentos" ON public.unidades_apontamentos FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);