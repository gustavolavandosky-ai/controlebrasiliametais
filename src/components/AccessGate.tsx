import type { ReactNode } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAccess } from "@/hooks/use-access";

function Aviso({ titulo, texto }: { titulo: string; texto: string }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const sair = async () => {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm rounded-xl border bg-card p-6 text-center shadow-sm">
        <h1 className="text-lg font-semibold tracking-tight">{titulo}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{texto}</p>
        <Button variant="outline" className="mt-6 w-full" onClick={() => void sair()}>
          Sair
        </Button>
      </div>
    </div>
  );
}

export function AccessGate({ children }: { children: ReactNode }) {
  const { perfil, carregando, erro } = useAccess();

  if (carregando) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p className="text-sm text-muted-foreground">Carregando...</p>
      </div>
    );
  }

  if (erro || !perfil) {
    return (
      <Aviso
        titulo="Não foi possível verificar seu acesso"
        texto="Tente entrar novamente em alguns instantes."
      />
    );
  }

  if (perfil.status === "pendente") {
    return (
      <Aviso
        titulo="Aguardando aprovação"
        texto="Sua conta foi criada e está aguardando a aprovação do administrador."
      />
    );
  }

  if (perfil.status !== "aprovado") {
    return (
      <Aviso
        titulo="Acesso recusado"
        texto="O administrador não liberou o acesso desta conta ao ERP."
      />
    );
  }

  return <>{children}</>;
}