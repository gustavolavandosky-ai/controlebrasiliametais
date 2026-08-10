import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface Perfil {
  id: string;
  user_id: string;
  email: string;
  nome: string;
  status: "pendente" | "aprovado" | "recusado";
  papel: "admin" | "visualizador";
  dono_id: string | null;
}

async function carregarPerfil(): Promise<Perfil | null> {
  const { data, error } = await supabase.rpc("registrar_perfil");
  if (error) throw error;
  return (data as unknown as Perfil) ?? null;
}

export function useAccess() {
  const query = useQuery({
    queryKey: ["perfil"],
    queryFn: carregarPerfil,
    staleTime: 60_000,
  });

  const perfil = query.data ?? null;
  const isAdmin = perfil?.papel === "admin" && perfil.status === "aprovado";

  return {
    perfil,
    carregando: query.isLoading,
    erro: query.error as Error | null,
    isAdmin,
    aprovado: perfil?.status === "aprovado",
    somenteLeitura: !isAdmin,
    donoId: perfil?.papel === "admin" ? perfil.user_id : (perfil?.dono_id ?? null),
  };
}