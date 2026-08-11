CREATE TABLE public.colaboradores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  nome text NOT NULL,
  equipe text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, nome)
);
CREATE TABLE public.tipos_diaria (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  nome text NOT NULL,
  valor_padrao numeric NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, nome)
);
CREATE TABLE public.destinos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  nome text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, nome)
);
CREATE TABLE public.diarias (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  data date NOT NULL DEFAULT CURRENT_DATE,
  colaborador text NOT NULL,
  equipe text,
  tipo text NOT NULL DEFAULT '',
  valor numeric NOT NULL DEFAULT 0,
  destino text NOT NULL DEFAULT '',
  situacao text NOT NULL DEFAULT 'pendente',
  troco numeric,
  observacao text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.colaboradores TO authenticated;
GRANT ALL ON public.colaboradores TO service_role;
ALTER TABLE public.colaboradores ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Ler colaboradores permitidos" ON public.colaboradores FOR SELECT TO authenticated USING (pode_ver(user_id));
CREATE POLICY "Dono cria colaboradores" ON public.colaboradores FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Dono edita colaboradores" ON public.colaboradores FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Dono exclui colaboradores" ON public.colaboradores FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE TRIGGER update_colaboradores_updated_at BEFORE UPDATE ON public.colaboradores FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

GRANT SELECT, INSERT, UPDATE, DELETE ON public.tipos_diaria TO authenticated;
GRANT ALL ON public.tipos_diaria TO service_role;
ALTER TABLE public.tipos_diaria ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Ler tipos_diaria permitidos" ON public.tipos_diaria FOR SELECT TO authenticated USING (pode_ver(user_id));
CREATE POLICY "Dono cria tipos_diaria" ON public.tipos_diaria FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Dono edita tipos_diaria" ON public.tipos_diaria FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Dono exclui tipos_diaria" ON public.tipos_diaria FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE TRIGGER update_tipos_diaria_updated_at BEFORE UPDATE ON public.tipos_diaria FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

GRANT SELECT, INSERT, UPDATE, DELETE ON public.destinos TO authenticated;
GRANT ALL ON public.destinos TO service_role;
ALTER TABLE public.destinos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Ler destinos permitidos" ON public.destinos FOR SELECT TO authenticated USING (pode_ver(user_id));
CREATE POLICY "Dono cria destinos" ON public.destinos FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Dono edita destinos" ON public.destinos FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Dono exclui destinos" ON public.destinos FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE TRIGGER update_destinos_updated_at BEFORE UPDATE ON public.destinos FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

GRANT SELECT, INSERT, UPDATE, DELETE ON public.diarias TO authenticated;
GRANT ALL ON public.diarias TO service_role;
ALTER TABLE public.diarias ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Ler diarias permitidos" ON public.diarias FOR SELECT TO authenticated USING (pode_ver(user_id));
CREATE POLICY "Dono cria diarias" ON public.diarias FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Dono edita diarias" ON public.diarias FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Dono exclui diarias" ON public.diarias FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE TRIGGER update_diarias_updated_at BEFORE UPDATE ON public.diarias FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.colaboradores (user_id, nome, equipe) VALUES
('c8bb45a5-209a-4b61-8731-2e96988ec749','ADELSON','ADELSON'),
('c8bb45a5-209a-4b61-8731-2e96988ec749','ALMI','ALMI'),
('c8bb45a5-209a-4b61-8731-2e96988ec749','AMERICO',NULL),
('c8bb45a5-209a-4b61-8731-2e96988ec749','BROCA',NULL),
('c8bb45a5-209a-4b61-8731-2e96988ec749','CLAUDEMIR',NULL),
('c8bb45a5-209a-4b61-8731-2e96988ec749','ESCOLTA',NULL),
('c8bb45a5-209a-4b61-8731-2e96988ec749','FLORIANO',NULL),
('c8bb45a5-209a-4b61-8731-2e96988ec749','GIL','GIL'),
('c8bb45a5-209a-4b61-8731-2e96988ec749','GILDEMAR',NULL),
('c8bb45a5-209a-4b61-8731-2e96988ec749','GUSTAVO',NULL),
('c8bb45a5-209a-4b61-8731-2e96988ec749','LEO','LEO'),
('c8bb45a5-209a-4b61-8731-2e96988ec749','MATHEUS',NULL),
('c8bb45a5-209a-4b61-8731-2e96988ec749','PEDRO',NULL),
('c8bb45a5-209a-4b61-8731-2e96988ec749','PETECA',NULL),
('c8bb45a5-209a-4b61-8731-2e96988ec749','SANDRAK',NULL);

INSERT INTO public.tipos_diaria (user_id, nome, valor_padrao) VALUES
('c8bb45a5-209a-4b61-8731-2e96988ec749','ALMOÇO',40),
('c8bb45a5-209a-4b61-8731-2e96988ec749','ALMOÇO + CAFÉ',55),
('c8bb45a5-209a-4b61-8731-2e96988ec749','ALMOÇO + CAFÉ + JANTA',95),
('c8bb45a5-209a-4b61-8731-2e96988ec749','ALMOÇO + PEDAGIO',90),
('c8bb45a5-209a-4b61-8731-2e96988ec749','CAFÉ',15),
('c8bb45a5-209a-4b61-8731-2e96988ec749','DIARIA DOMINGO',150),
('c8bb45a5-209a-4b61-8731-2e96988ec749','DIARIA ESCOLTA',100),
('c8bb45a5-209a-4b61-8731-2e96988ec749','DIARIA ESCOLTA DOMINGO + PEDAGIO',165),
('c8bb45a5-209a-4b61-8731-2e96988ec749','DIARIA PERNOITE DOMINGO',250),
('c8bb45a5-209a-4b61-8731-2e96988ec749','DIARIAS + PEDAGIO + GASOLINA',300),
('c8bb45a5-209a-4b61-8731-2e96988ec749','ESCOLTA',50),
('c8bb45a5-209a-4b61-8731-2e96988ec749','ESCOLTA + PEDAGIO',165),
('c8bb45a5-209a-4b61-8731-2e96988ec749','JANTA',40),
('c8bb45a5-209a-4b61-8731-2e96988ec749','JANTA + PERNOITE',290),
('c8bb45a5-209a-4b61-8731-2e96988ec749','PERNOITE',250);

INSERT INTO public.destinos (user_id, nome) VALUES
('c8bb45a5-209a-4b61-8731-2e96988ec749','ALUER'),
('c8bb45a5-209a-4b61-8731-2e96988ec749','CASCUDO'),
('c8bb45a5-209a-4b61-8731-2e96988ec749','CBL'),
('c8bb45a5-209a-4b61-8731-2e96988ec749','DANIEL RIO CLARO'),
('c8bb45a5-209a-4b61-8731-2e96988ec749','DATDORIA'),
('c8bb45a5-209a-4b61-8731-2e96988ec749','FABIANO SÃO CARLOS'),
('c8bb45a5-209a-4b61-8731-2e96988ec749','GRIMALDI'),
('c8bb45a5-209a-4b61-8731-2e96988ec749','MENUDO'),
('c8bb45a5-209a-4b61-8731-2e96988ec749','MURILO / FABIANO S.C.'),
('c8bb45a5-209a-4b61-8731-2e96988ec749','NARDINE/ROBINHO'),
('c8bb45a5-209a-4b61-8731-2e96988ec749','ROTA MOGI'),
('c8bb45a5-209a-4b61-8731-2e96988ec749','TAMIRES'),
('c8bb45a5-209a-4b61-8731-2e96988ec749','VALTER ACERRA');