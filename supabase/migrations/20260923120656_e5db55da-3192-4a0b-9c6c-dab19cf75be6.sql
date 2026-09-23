CREATE TABLE public.equipamentos (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  nome text NOT NULL,
  unidade text NOT NULL DEFAULT 'un',
  estoque_inicial numeric NOT NULL DEFAULT 0,
  localizacao text NOT NULL DEFAULT '',
  observacoes text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.equipamentos TO authenticated;
GRANT ALL ON public.equipamentos TO service_role;
ALTER TABLE public.equipamentos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Ler equipamentos permitidos" ON public.equipamentos FOR SELECT TO authenticated USING (pode_ver(user_id));
CREATE POLICY "Dono cria equipamentos" ON public.equipamentos FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Dono edita equipamentos" ON public.equipamentos FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Dono exclui equipamentos" ON public.equipamentos FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE TRIGGER update_equipamentos_updated_at BEFORE UPDATE ON public.equipamentos FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.epi_lancamentos (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  equipamento_id uuid NOT NULL REFERENCES public.equipamentos(id) ON DELETE CASCADE,
  tipo text NOT NULL,
  quantidade numeric NOT NULL DEFAULT 0,
  unidade text NOT NULL DEFAULT 'un',
  data date NOT NULL DEFAULT CURRENT_DATE,
  hora text NOT NULL DEFAULT '00:00',
  retirado_por text NOT NULL DEFAULT '',
  motivo text NOT NULL DEFAULT '',
  observacao text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.epi_lancamentos TO authenticated;
GRANT ALL ON public.epi_lancamentos TO service_role;
ALTER TABLE public.epi_lancamentos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Ler epi_lancamentos permitidos" ON public.epi_lancamentos FOR SELECT TO authenticated USING (pode_ver(user_id));
CREATE POLICY "Dono cria epi_lancamentos" ON public.epi_lancamentos FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Dono edita epi_lancamentos" ON public.epi_lancamentos FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Dono exclui epi_lancamentos" ON public.epi_lancamentos FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE TRIGGER update_epi_lancamentos_updated_at BEFORE UPDATE ON public.epi_lancamentos FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE INDEX idx_epi_lancamentos_equipamento ON public.epi_lancamentos(equipamento_id);