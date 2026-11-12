CREATE TABLE public.troco_descontos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  colaborador text NOT NULL,
  data date NOT NULL DEFAULT CURRENT_DATE,
  valor numeric NOT NULL CHECK (valor > 0),
  forma text NOT NULL DEFAULT 'desconto_diaria',
  observacao text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.troco_descontos TO authenticated;
GRANT ALL ON public.troco_descontos TO service_role;
ALTER TABLE public.troco_descontos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Ler troco_descontos permitidos" ON public.troco_descontos FOR SELECT TO authenticated USING (public.pode_ver(user_id));
CREATE POLICY "Dono cria troco_descontos" ON public.troco_descontos FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Dono edita troco_descontos" ON public.troco_descontos FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Dono exclui troco_descontos" ON public.troco_descontos FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE INDEX troco_descontos_colab_idx ON public.troco_descontos (colaborador);
CREATE TRIGGER update_troco_descontos_updated_at BEFORE UPDATE ON public.troco_descontos FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();