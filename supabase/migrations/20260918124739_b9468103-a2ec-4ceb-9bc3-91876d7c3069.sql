CREATE TABLE public.equipes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  nome text NOT NULL,
  cor text NOT NULL DEFAULT '#22c55e',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, nome)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.equipes TO authenticated;
GRANT ALL ON public.equipes TO service_role;

ALTER TABLE public.equipes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Ler equipes permitidas" ON public.equipes FOR SELECT TO authenticated USING (pode_ver(user_id));
CREATE POLICY "Dono cria equipes" ON public.equipes FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Dono edita equipes" ON public.equipes FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Dono exclui equipes" ON public.equipes FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE TRIGGER update_equipes_updated_at BEFORE UPDATE ON public.equipes
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.equipes (user_id, nome, cor)
SELECT d.user_id, x.nome, x.cor
FROM (SELECT DISTINCT user_id FROM public.diarias) d
CROSS JOIN (VALUES ('LEO','#3fbf7f'), ('ADELSON','#4a8ff0'), ('ALMI','#f0913f'), ('GIL','#e8c33a')) AS x(nome, cor)
ON CONFLICT (user_id, nome) DO NOTHING;

INSERT INTO public.equipes (user_id, nome, cor)
SELECT DISTINCT user_id, equipe, '#9ca3af'
FROM public.diarias
WHERE equipe IS NOT NULL AND equipe <> ''
ON CONFLICT (user_id, nome) DO NOTHING;