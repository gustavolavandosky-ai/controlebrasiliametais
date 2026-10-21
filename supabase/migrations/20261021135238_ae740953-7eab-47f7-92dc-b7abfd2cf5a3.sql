CREATE TABLE public.viagens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid(),
  data date NOT NULL DEFAULT CURRENT_DATE,
  origem text NOT NULL,
  destino text NOT NULL,
  veiculo_id uuid REFERENCES public.veiculos(id) ON DELETE SET NULL,
  motorista text NOT NULL DEFAULT '',
  distancia_km numeric,
  tempo_estimado_min numeric,
  pedagio_estimado numeric,
  tempo_real_min numeric,
  pedagio_real numeric,
  observacao text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.viagens ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.viagens TO authenticated;
GRANT ALL ON public.viagens TO service_role;
CREATE POLICY "viagens_select" ON public.viagens FOR SELECT TO authenticated USING (public.pode_ver(user_id));
CREATE POLICY "viagens_insert" ON public.viagens FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "viagens_update" ON public.viagens FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "viagens_delete" ON public.viagens FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE TRIGGER viagens_updated BEFORE UPDATE ON public.viagens FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE INDEX viagens_user_data ON public.viagens(user_id, data DESC);