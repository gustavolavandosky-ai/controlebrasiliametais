REVOKE ALL ON FUNCTION public.is_admin(uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.pode_ver(uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.registrar_perfil() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.registrar_perfil() TO authenticated;