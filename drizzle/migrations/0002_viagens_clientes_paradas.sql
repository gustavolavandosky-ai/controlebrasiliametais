CREATE TABLE public.clientes_viagem (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid(),
  nome text NOT NULL,
  endereco text NOT NULL DEFAULT '',
  observacao text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.clientes_viagem TO authenticated;
GRANT ALL ON public.clientes_viagem TO service_role;
ALTER TABLE public.clientes_viagem ENABLE ROW LEVEL SECURITY;
CREATE POLICY "cv_select" ON public.clientes_viagem FOR SELECT TO authenticated USING (public.pode_ver(user_id));
CREATE POLICY "cv_insert" ON public.clientes_viagem FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "cv_update" ON public.clientes_viagem FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "cv_delete" ON public.clientes_viagem FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE TRIGGER clientes_viagem_updated BEFORE UPDATE ON public.clientes_viagem FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.empresa_config (
  user_id uuid PRIMARY KEY DEFAULT auth.uid(),
  endereco text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.empresa_config TO authenticated;
GRANT ALL ON public.empresa_config TO service_role;
ALTER TABLE public.empresa_config ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ec_select" ON public.empresa_config FOR SELECT TO authenticated USING (public.pode_ver(user_id));
CREATE POLICY "ec_insert" ON public.empresa_config FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "ec_update" ON public.empresa_config FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE TRIGGER empresa_config_updated BEFORE UPDATE ON public.empresa_config FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.viagens
  ADD COLUMN cliente_id uuid REFERENCES public.clientes_viagem(id) ON DELETE SET NULL,
  ADD COLUMN saiu_empresa boolean NOT NULL DEFAULT false,
  ADD COLUMN saida_em timestamptz,
  ADD COLUMN chegada_em timestamptz,
  ADD COLUMN houve_parada boolean NOT NULL DEFAULT false,
  ADD COLUMN paradas_qtd integer NOT NULL DEFAULT 0,
  ADD COLUMN paradas_min numeric NOT NULL DEFAULT 0,
  ADD COLUMN paradas_justificativa text NOT NULL DEFAULT '';
COMMENT ON COLUMN public.viagens.pedagio_estimado IS 'DEPRECATED: pedágio removido';
COMMENT ON COLUMN public.viagens.pedagio_real IS 'DEPRECATED: pedágio removido';