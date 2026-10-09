CREATE TABLE public.veiculos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  placa text NOT NULL DEFAULT '',
  modelo text NOT NULL DEFAULT '',
  ano text NOT NULL DEFAULT '',
  observacoes text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.veiculos TO authenticated;
GRANT ALL ON public.veiculos TO service_role;
ALTER TABLE public.veiculos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Ler veiculos permitidos" ON public.veiculos FOR SELECT TO authenticated USING (public.pode_ver(user_id));
CREATE POLICY "Dono cria veiculos" ON public.veiculos FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Dono edita veiculos" ON public.veiculos FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Dono exclui veiculos" ON public.veiculos FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE TRIGGER update_veiculos_updated_at BEFORE UPDATE ON public.veiculos FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.abastecimentos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  veiculo_id uuid NOT NULL REFERENCES public.veiculos(id) ON DELETE CASCADE,
  data date NOT NULL DEFAULT CURRENT_DATE,
  combustivel text NOT NULL DEFAULT 'DIESEL',
  valor numeric NOT NULL DEFAULT 0,
  litros numeric NOT NULL DEFAULT 0,
  km_atual numeric,
  motorista text NOT NULL DEFAULT '',
  observacao text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.abastecimentos TO authenticated;
GRANT ALL ON public.abastecimentos TO service_role;
ALTER TABLE public.abastecimentos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Ler abastecimentos permitidos" ON public.abastecimentos FOR SELECT TO authenticated USING (public.pode_ver(user_id));
CREATE POLICY "Dono cria abastecimentos" ON public.abastecimentos FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Dono edita abastecimentos" ON public.abastecimentos FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Dono exclui abastecimentos" ON public.abastecimentos FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE TRIGGER update_abastecimentos_updated_at BEFORE UPDATE ON public.abastecimentos FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE INDEX idx_abastecimentos_veiculo ON public.abastecimentos(veiculo_id);