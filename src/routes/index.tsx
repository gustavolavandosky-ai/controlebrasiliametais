import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { Boxes } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "ERP Brasilia Metais · Controle de Estoque" },
      {
        name: "description",
        content:
          "Controle de estoque na nuvem: cadastre produtos, registre entradas e saídas e acesse do celular ou do computador.",
      },
      { property: "og:title", content: "ERP Brasilia Metais · Controle de Estoque" },
      {
        property: "og:description",
        content: "Controle de estoque na nuvem, sincronizado entre celular e computador.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Landing,
});

function Landing() {
  const { session, carregando } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (session) navigate({ to: "/estoque", replace: true });
  }, [session, navigate]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-6">
      <div className="max-w-lg text-center">
        <Boxes className="mx-auto h-12 w-12 text-primary" />
        <h1 className="mt-4 text-3xl font-semibold tracking-tight">
          ERP - BRASILIA METAIS
        </h1>
        <p className="mt-3 text-muted-foreground">
          Seus produtos e lançamentos ficam salvos na nuvem — acesse os mesmos dados
          do celular e do computador.
        </p>
        <Button
          className="mt-6"
          size="lg"
          disabled={carregando}
          onClick={() => navigate({ to: "/auth" })}
        >
          Entrar no sistema
        </Button>
      </div>
    </main>
  );
}