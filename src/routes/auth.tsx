import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Entrar · ERP Brasilia Metais" },
      { name: "description", content: "Acesse o controle de estoque do seu ERP de qualquer dispositivo." },
      { property: "og:title", content: "Entrar · ERP Brasilia Metais" },
      { property: "og:description", content: "Acesse o controle de estoque do seu ERP de qualquer dispositivo." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [loading, setLoading] = useState(false);
  const [modo, setModo] = useState<"entrar" | "criar">("entrar");

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/estoque", replace: true });
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => {
      if (s) navigate({ to: "/estoque", replace: true });
    });
    return () => sub.subscription.unsubscribe();
  }, [navigate]);

  const entrar = async () => {
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password: senha });
    setLoading(false);
    if (error) toast.error(error.message);
  };

  const cadastrar = async () => {
    setLoading(true);
    const { data, error } = await supabase.auth.signUp({
      email,
      password: senha,
      options: { emailRedirectTo: window.location.origin },
    });
    setLoading(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    if (!data.session) {
      toast.success("Conta criada. Confirme o e-mail que enviamos para entrar.");
    }
  };

  const google = async () => {
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (result.error) {
      toast.error("Não foi possível entrar com o Google");
      return;
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm rounded-xl border bg-card p-6 shadow-sm">
        <h1 className="text-xl font-semibold tracking-tight">ERP · Controle de Estoque</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Entre para acessar seu estoque do celular e do computador.
        </p>

        <div className="mt-6">
          <div className="grid grid-cols-2 gap-2 rounded-md bg-muted p-1">
            <Button
              type="button"
              variant={modo === "entrar" ? "default" : "ghost"}
              size="sm"
              onClick={() => setModo("entrar")}
            >
              Entrar
            </Button>
            <Button
              type="button"
              variant={modo === "criar" ? "default" : "ghost"}
              size="sm"
              onClick={() => setModo("criar")}
            >
              Criar conta
            </Button>
          </div>

          <div className="mt-4 grid gap-3">
            <div className="grid gap-2">
              <Label htmlFor="auth-email">E-mail</Label>
              <Input
                id="auth-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="auth-senha">Senha</Label>
              <Input
                id="auth-senha"
                type="password"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                autoComplete="current-password"
              />
            </div>
          </div>

          <Button
            className="mt-4 w-full"
            disabled={loading}
            onClick={() => void (modo === "entrar" ? entrar() : cadastrar())}
          >
            {modo === "entrar" ? "Entrar" : "Criar conta"}
          </Button>
        </div>

        <div className="my-4 flex items-center gap-3 text-xs text-muted-foreground">
          <span className="h-px flex-1 bg-border" /> ou <span className="h-px flex-1 bg-border" />
        </div>

        <Button variant="outline" className="w-full" onClick={() => void google()}>
          Continuar com Google
        </Button>
      </div>
    </div>
  );
}