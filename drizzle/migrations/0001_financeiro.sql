CREATE TABLE public.centros_custo (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  nome text NOT NULL,
  descricao text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.centros_custo TO authenticated;
GRANT ALL ON public.centros_custo TO service_role;
ALTER TABLE public.centros_custo ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Ler centros_custo permitidos" ON public.centros_custo FOR SELECT TO authenticated USING (public.pode_ver(user_id));
CREATE POLICY "Dono cria centros_custo" ON public.centros_custo FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Dono edita centros_custo" ON public.centros_custo FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Dono exclui centros_custo" ON public.centros_custo FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE TRIGGER trg_centros_custo_updated BEFORE UPDATE ON public.centros_custo FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.gastos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  centro_id uuid NOT NULL REFERENCES public.centros_custo(id) ON DELETE CASCADE,
  data date NOT NULL DEFAULT CURRENT_DATE,
  descricao text NOT NULL DEFAULT '',
  categoria text NOT NULL DEFAULT '',
  fornecedor text NOT NULL DEFAULT '',
  forma_pagamento text NOT NULL DEFAULT '',
  nota_fiscal text NOT NULL DEFAULT '',
  valor numeric NOT NULL DEFAULT 0,
  observacao text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.gastos TO authenticated;
GRANT ALL ON public.gastos TO service_role;
ALTER TABLE public.gastos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Ler gastos permitidos" ON public.gastos FOR SELECT TO authenticated USING (public.pode_ver(user_id));
CREATE POLICY "Dono cria gastos" ON public.gastos FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Dono edita gastos" ON public.gastos FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Dono exclui gastos" ON public.gastos FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE TRIGGER trg_gastos_updated BEFORE UPDATE ON public.gastos FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE INDEX idx_gastos_centro ON public.gastos(centro_id);