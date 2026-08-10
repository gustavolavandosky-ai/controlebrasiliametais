import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { AppHeader } from "@/components/AppHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ArrowLeft, Check, Mail, Trash2, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAccess } from "@/hooks/use-access";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/acessos")({
  head: () => ({
    meta: [
      { title: "Acessos · ERP Estoque" },
      { name: "description", content: "Aprove contas e convide pessoas para visualizar seu controle de estoque." },
      { property: "og:title", content: "Acessos · ERP Estoque" },
      { property: "og:description", content: "Aprove contas e convide pessoas para visualizar seu controle de estoque." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AcessosPage,
});

const STATUS_LABEL: Record<string, string> = {
  pendente: "Pendente",
  aprovado: "Aprovado",
  recusado: "Recusado",
};

function AcessosPage() {
  const { isAdmin, perfil } = useAccess();
  const qc = useQueryClient();
  const [email, setEmail] = useState("");

  const perfisQuery = useQuery({
    queryKey: ["perfis"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("perfis")
        .select("*")
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
    enabled: isAdmin,
  });

  const convitesQuery = useQuery({
    queryKey: ["convites"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("convites")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
    enabled: isAdmin,
  });

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-background">
        <AppHeader title="Acessos" />
        <main className="mx-auto max-w-3xl px-6 py-10 text-center text-muted-foreground">
          Somente o administrador pode gerenciar acessos.
        </main>
      </div>
    );
  }

  const decidir = async (userId: string, status: "aprovado" | "recusado") => {
    const { error } = await supabase
      .from("perfis")
      .update({ status, dono_id: status === "aprovado" ? (perfil?.user_id ?? null) : null })
      .eq("user_id", userId);
    if (error) {
      toast.error(error.message);
      return;
    }
    await qc.invalidateQueries({ queryKey: ["perfis"] });
    toast.success(status === "aprovado" ? "Acesso liberado" : "Acesso recusado");
  };

  const convidar = async () => {
    const valor = email.trim().toLowerCase();
    if (!valor) return;
    const { error } = await supabase
      .from("convites")
      .insert({ email: valor, criado_por: perfil!.user_id });
    if (error) {
      toast.error(error.message);
      return;
    }
    setEmail("");
    await qc.invalidateQueries({ queryKey: ["convites"] });
    toast.success("Convite criado. Peça para a pessoa criar a conta com esse e-mail.");
  };

  const removerConvite = async (id: string) => {
    const { error } = await supabase.from("convites").delete().eq("id", id);
    if (error) {
      toast.error(error.message);
      return;
    }
    await qc.invalidateQueries({ queryKey: ["convites"] });
  };

  const perfis = perfisQuery.data ?? [];
  const convites = convitesQuery.data ?? [];

  return (
    <div className="min-h-screen bg-background">
      <AppHeader title="Acessos" />

      <main className="mx-auto max-w-5xl px-6 py-6">
        <div className="mb-6">
          <Button asChild variant="ghost">
            <Link to="/estoque">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar
            </Link>
          </Button>
        </div>

        <section className="rounded-lg border bg-card p-4">
          <h2 className="text-sm font-semibold">Convidar por e-mail</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Convidados aprovados automaticamente veem todo o seu estoque, sem poder editar.
          </p>
          <div className="mt-3 flex flex-wrap items-end gap-3">
            <div className="grid min-w-64 flex-1 gap-2">
              <Label htmlFor="convite-email">E-mail</Label>
              <Input
                id="convite-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="pessoa@email.com"
              />
            </div>
            <Button onClick={() => void convidar()}>
              <Mail className="mr-2 h-4 w-4" />
              Convidar
            </Button>
          </div>

          {convites.length > 0 && (
            <ul className="mt-4 divide-y rounded-md border">
              {convites.map((c) => (
                <li key={c.id} className="flex items-center justify-between px-3 py-2 text-sm">
                  <span>
                    {c.email}
                    <span className="ml-2 text-xs text-muted-foreground">
                      {c.usado_em ? "conta criada" : "aguardando cadastro"}
                    </span>
                  </span>
                  <Button size="icon" variant="ghost" onClick={() => void removerConvite(c.id)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="mt-6 rounded-lg border bg-card">
          <div className="border-b px-4 py-3">
            <h2 className="text-sm font-semibold">Contas</h2>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>E-mail</TableHead>
                <TableHead>Papel</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-40 text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {perfis.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="py-10 text-center text-muted-foreground">
                    Nenhuma conta ainda.
                  </TableCell>
                </TableRow>
              )}
              {perfis.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="font-medium">{p.nome || "—"}</TableCell>
                  <TableCell className="text-muted-foreground">{p.email}</TableCell>
                  <TableCell>{p.papel === "admin" ? "Administrador" : "Visualizador"}</TableCell>
                  <TableCell>{STATUS_LABEL[p.status] ?? p.status}</TableCell>
                  <TableCell className="text-right">
                    {p.papel === "admin" ? (
                      <span className="text-xs text-muted-foreground">—</span>
                    ) : (
                      <>
                        {p.status !== "aprovado" && (
                          <Button
                            size="icon"
                            variant="ghost"
                            title="Aprovar"
                            onClick={() => void decidir(p.user_id, "aprovado")}
                          >
                            <Check className="h-4 w-4" />
                          </Button>
                        )}
                        {p.status !== "recusado" && (
                          <Button
                            size="icon"
                            variant="ghost"
                            title="Recusar"
                            onClick={() => void decidir(p.user_id, "recusado")}
                          >
                            <X className="h-4 w-4 text-destructive" />
                          </Button>
                        )}
                      </>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </section>
      </main>
    </div>
  );
}