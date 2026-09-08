CREATE TABLE public.devolucoes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  data date NOT NULL DEFAULT CURRENT_DATE,
  empresa text NOT NULL DEFAULT '',
  material text NOT NULL DEFAULT '',
  unidade text NOT NULL DEFAULT 'kg',
  quantidade_enviada numeric NOT NULL DEFAULT 0,
  quantidade_retornada numeric NOT NULL DEFAULT 0,
  observacao text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.devolucoes TO authenticated;
GRANT ALL ON public.devolucoes TO service_role;

ALTER TABLE public.devolucoes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Ler devolucoes permitidas" ON public.devolucoes FOR SELECT TO authenticated USING (public.pode_ver(user_id));
CREATE POLICY "Dono cria devolucoes" ON public.devolucoes FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Dono edita devolucoes" ON public.devolucoes FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Dono exclui devolucoes" ON public.devolucoes FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE TRIGGER update_devolucoes_updated_at BEFORE UPDATE ON public.devolucoes FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();