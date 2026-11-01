ALTER TABLE public.gastos ALTER COLUMN centro_id DROP NOT NULL;
ALTER TABLE public.gastos ADD COLUMN IF NOT EXISTS veiculo_id uuid REFERENCES public.veiculos(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_gastos_veiculo ON public.gastos(veiculo_id);

ALTER TABLE public.veiculos ADD COLUMN IF NOT EXISTS km_atual numeric;

CREATE TABLE public.manutencoes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  veiculo_id uuid NOT NULL REFERENCES public.veiculos(id) ON DELETE RESTRICT,
  data date NOT NULL DEFAULT current_date,
  km numeric,
  tipo text NOT NULL DEFAULT '',
  descricao text NOT NULL DEFAULT '',
  fornecedor text NOT NULL DEFAULT '',
  valor numeric NOT NULL DEFAULT 0,
  proxima_km numeric,
  proxima_data date,
  observacao text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.manutencoes TO authenticated;
GRANT ALL ON public.manutencoes TO service_role;
ALTER TABLE public.manutencoes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "manut_select" ON public.manutencoes FOR SELECT TO authenticated USING (public.pode_ver(user_id));
CREATE POLICY "manut_insert" ON public.manutencoes FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "manut_update" ON public.manutencoes FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "manut_delete" ON public.manutencoes FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE INDEX idx_manut_veiculo ON public.manutencoes(veiculo_id, data DESC);
CREATE TRIGGER update_manutencoes_updated_at BEFORE UPDATE ON public.manutencoes FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.km_auditoria (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  veiculo_id uuid NOT NULL REFERENCES public.veiculos(id) ON DELETE RESTRICT,
  km_anterior numeric,
  km_novo numeric NOT NULL,
  motivo text NOT NULL,
  alterado_por uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.km_auditoria TO authenticated;
GRANT ALL ON public.km_auditoria TO service_role;
ALTER TABLE public.km_auditoria ENABLE ROW LEVEL SECURITY;
CREATE POLICY "kmaud_select" ON public.km_auditoria FOR SELECT TO authenticated USING (public.pode_ver(user_id));
CREATE INDEX idx_kmaud_veiculo ON public.km_auditoria(veiculo_id, created_at DESC);

CREATE OR REPLACE FUNCTION public.proteger_km_veiculo() RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF OLD.km_atual IS NOT NULL AND (NEW.km_atual IS NULL OR NEW.km_atual < OLD.km_atual)
     AND coalesce(current_setting('app.km_correcao', true), '') <> 'on' THEN
    NEW.km_atual := OLD.km_atual;
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER veiculos_proteger_km BEFORE UPDATE ON public.veiculos FOR EACH ROW EXECUTE FUNCTION public.proteger_km_veiculo();

CREATE OR REPLACE FUNCTION public.avancar_km_veiculo() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE k numeric;
BEGIN
  k := CASE WHEN TG_TABLE_NAME = 'abastecimentos' THEN NEW.km_atual ELSE NEW.km END;
  IF k IS NOT NULL THEN
    UPDATE public.veiculos SET km_atual = k WHERE id = NEW.veiculo_id AND (km_atual IS NULL OR km_atual < k);
  END IF;
  RETURN NEW;
END $$;
REVOKE EXECUTE ON FUNCTION public.avancar_km_veiculo() FROM PUBLIC, anon;
CREATE TRIGGER abastecimentos_avancar_km AFTER INSERT OR UPDATE ON public.abastecimentos FOR EACH ROW EXECUTE FUNCTION public.avancar_km_veiculo();
CREATE TRIGGER manutencoes_avancar_km AFTER INSERT OR UPDATE ON public.manutencoes FOR EACH ROW EXECUTE FUNCTION public.avancar_km_veiculo();

CREATE OR REPLACE FUNCTION public.corrigir_km_veiculo(_veiculo uuid, _km numeric, _motivo text) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v public.veiculos;
BEGIN
  IF NOT public.is_admin(auth.uid()) THEN RAISE EXCEPTION 'Somente administradores podem corrigir o KM.'; END IF;
  IF _motivo IS NULL OR length(trim(_motivo)) < 3 THEN RAISE EXCEPTION 'Informe o motivo da correção.'; END IF;
  IF _km IS NULL OR _km < 0 THEN RAISE EXCEPTION 'KM inválido.'; END IF;
  SELECT * INTO v FROM public.veiculos WHERE id = _veiculo AND public.pode_ver(user_id);
  IF NOT FOUND THEN RAISE EXCEPTION 'Veículo não encontrado.'; END IF;
  INSERT INTO public.km_auditoria (user_id, veiculo_id, km_anterior, km_novo, motivo, alterado_por)
  VALUES (v.user_id, v.id, v.km_atual, _km, trim(_motivo), auth.uid());
  PERFORM set_config('app.km_correcao', 'on', true);
  UPDATE public.veiculos SET km_atual = _km WHERE id = v.id;
  PERFORM set_config('app.km_correcao', 'off', true);
END $$;
REVOKE EXECUTE ON FUNCTION public.corrigir_km_veiculo(uuid, numeric, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.corrigir_km_veiculo(uuid, numeric, text) TO authenticated;