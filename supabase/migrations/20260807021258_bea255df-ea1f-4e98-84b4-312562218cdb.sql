CREATE TABLE public.produtos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  nome text NOT NULL,
  unidade text NOT NULL DEFAULT 'un',
  estoque_inicial numeric NOT NULL DEFAULT 0,
  observacoes text NOT NULL DEFAULT '',
  localizacao text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.produtos TO authenticated;
GRANT ALL ON public.produtos TO service_role;
ALTER TABLE public.produtos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Usuarios gerenciam seus produtos" ON public.produtos
  FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE public.lancamentos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  produto_id uuid NOT NULL REFERENCES public.produtos(id) ON DELETE CASCADE,
  tipo text NOT NULL CHECK (tipo IN ('entrada','saida','balanco')),
  quantidade numeric NOT NULL DEFAULT 0,
  unidade text NOT NULL DEFAULT 'un',
  data date NOT NULL DEFAULT current_date,
  hora text NOT NULL DEFAULT '00:00',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.lancamentos TO authenticated;
GRANT ALL ON public.lancamentos TO service_role;
ALTER TABLE public.lancamentos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Usuarios gerenciam seus lancamentos" ON public.lancamentos
  FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_produtos_user ON public.produtos(user_id);
CREATE INDEX idx_lancamentos_produto ON public.lancamentos(produto_id);

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_produtos_updated_at BEFORE UPDATE ON public.produtos
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_lancamentos_updated_at BEFORE UPDATE ON public.lancamentos
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();