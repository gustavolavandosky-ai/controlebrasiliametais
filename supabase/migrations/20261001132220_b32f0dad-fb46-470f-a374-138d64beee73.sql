CREATE TABLE public.bag_movimentos (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  tipo text NOT NULL,
  data date NOT NULL DEFAULT CURRENT_DATE,
  quantidade numeric NOT NULL DEFAULT 0,
  quantidade_retornada numeric NOT NULL DEFAULT 0,
  fornecedor text NOT NULL DEFAULT '',
  cliente text NOT NULL DEFAULT '',
  observacao text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.bag_movimentos TO authenticated;
GRANT ALL ON public.bag_movimentos TO service_role;
ALTER TABLE public.bag_movimentos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Ler bag_movimentos permitidos" ON public.bag_movimentos FOR SELECT TO authenticated USING (public.pode_ver(user_id));
CREATE POLICY "Dono cria bag_movimentos" ON public.bag_movimentos FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Dono edita bag_movimentos" ON public.bag_movimentos FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Dono exclui bag_movimentos" ON public.bag_movimentos FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE TRIGGER update_bag_movimentos_updated_at BEFORE UPDATE ON public.bag_movimentos FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();