-- perfis
CREATE TABLE public.perfis (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  email text NOT NULL DEFAULT '',
  nome text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'pendente',
  papel text NOT NULL DEFAULT 'visualizador',
  dono_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, UPDATE ON public.perfis TO authenticated;
GRANT ALL ON public.perfis TO service_role;
ALTER TABLE public.perfis ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER update_perfis_updated_at
BEFORE UPDATE ON public.perfis
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- convites
CREATE TABLE public.convites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL UNIQUE,
  criado_por uuid NOT NULL,
  usado_em timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.convites TO authenticated;
GRANT ALL ON public.convites TO service_role;
ALTER TABLE public.convites ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER update_convites_updated_at
BEFORE UPDATE ON public.convites
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- funcoes de autorizacao
CREATE OR REPLACE FUNCTION public.is_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.perfis
    WHERE user_id = _user_id AND papel = 'admin' AND status = 'aprovado'
  )
$$;

CREATE OR REPLACE FUNCTION public.pode_ver(_dono uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT auth.uid() = _dono OR EXISTS (
    SELECT 1 FROM public.perfis
    WHERE user_id = auth.uid() AND status = 'aprovado' AND dono_id = _dono
  )
$$;

CREATE OR REPLACE FUNCTION public.registrar_perfil()
RETURNS public.perfis
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid uuid := auth.uid();
  em text := lower(coalesce(auth.jwt() ->> 'email', ''));
  admin_email constant text := 'gustavo.lavandosky@icloud.com';
  admin_id uuid;
  nm text := coalesce(
    auth.jwt() -> 'user_metadata' ->> 'full_name',
    auth.jwt() -> 'user_metadata' ->> 'name',
    ''
  );
  p public.perfis;
BEGIN
  IF uid IS NULL THEN
    RAISE EXCEPTION 'Nao autenticado';
  END IF;

  SELECT user_id INTO admin_id FROM public.perfis WHERE papel = 'admin' LIMIT 1;

  SELECT * INTO p FROM public.perfis WHERE user_id = uid;
  IF FOUND THEN
    IF p.papel <> 'admin' AND p.dono_id IS NULL AND admin_id IS NOT NULL THEN
      UPDATE public.perfis SET dono_id = admin_id WHERE user_id = uid RETURNING * INTO p;
    END IF;
    RETURN p;
  END IF;

  IF em = admin_email THEN
    INSERT INTO public.perfis (user_id, email, nome, status, papel, dono_id)
    VALUES (uid, em, nm, 'aprovado', 'admin', uid)
    RETURNING * INTO p;
    UPDATE public.perfis SET dono_id = uid WHERE papel <> 'admin' AND dono_id IS NULL;
  ELSIF EXISTS (SELECT 1 FROM public.convites WHERE email = em) THEN
    INSERT INTO public.perfis (user_id, email, nome, status, papel, dono_id)
    VALUES (uid, em, nm, 'aprovado', 'visualizador', admin_id)
    RETURNING * INTO p;
    UPDATE public.convites SET usado_em = now() WHERE email = em;
  ELSE
    INSERT INTO public.perfis (user_id, email, nome, status, papel, dono_id)
    VALUES (uid, em, nm, 'pendente', 'visualizador', admin_id)
    RETURNING * INTO p;
  END IF;

  RETURN p;
END;
$$;

GRANT EXECUTE ON FUNCTION public.registrar_perfil() TO authenticated;

-- politicas perfis
CREATE POLICY "Ver proprio perfil ou admin ve todos"
ON public.perfis FOR SELECT TO authenticated
USING (user_id = auth.uid() OR public.is_admin(auth.uid()));

CREATE POLICY "Admin atualiza perfis"
ON public.perfis FOR UPDATE TO authenticated
USING (public.is_admin(auth.uid()))
WITH CHECK (public.is_admin(auth.uid()));

-- politicas convites
CREATE POLICY "Admin gerencia convites"
ON public.convites FOR ALL TO authenticated
USING (public.is_admin(auth.uid()))
WITH CHECK (public.is_admin(auth.uid()));

-- produtos / lancamentos: leitura compartilhada, escrita apenas do dono
DROP POLICY IF EXISTS "Usuarios gerenciam seus produtos" ON public.produtos;
DROP POLICY IF EXISTS "Usuarios gerenciam seus lancamentos" ON public.lancamentos;

CREATE POLICY "Ler produtos permitidos"
ON public.produtos FOR SELECT TO authenticated
USING (public.pode_ver(user_id));

CREATE POLICY "Dono cria produtos"
ON public.produtos FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Dono edita produtos"
ON public.produtos FOR UPDATE TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Dono exclui produtos"
ON public.produtos FOR DELETE TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Ler lancamentos permitidos"
ON public.lancamentos FOR SELECT TO authenticated
USING (public.pode_ver(user_id));

CREATE POLICY "Dono cria lancamentos"
ON public.lancamentos FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Dono edita lancamentos"
ON public.lancamentos FOR UPDATE TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Dono exclui lancamentos"
ON public.lancamentos FOR DELETE TO authenticated
USING (auth.uid() = user_id);