import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { AppHeader } from "@/components/AppHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ArrowLeft, Trash2 } from "lucide-react";
import { formatarMoeda, useDiarias } from "@/lib/diarias-store";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/diarias/cadastros")({
  head: () => ({
    meta: [
      { title: "Cadastros de Diárias · ERP Brasilia Metais" },
      {
        name: "description",
        content:
          "Cadastre colaboradores, tipos de diária com valor sugerido e destinos/clientes.",
      },
      { property: "og:title", content: "Cadastros de Diárias · ERP Brasilia Metais" },
      {
        property: "og:description",
        content: "Listas de colaboradores, tipos de diária e destinos usadas nos lançamentos.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: CadastrosPage,
});

function CadastrosPage() {
  const {
    colaboradores,
    tipos,
    destinos,
    salvarColaborador,
    salvarTipo,
    salvarDestino,
    excluirCadastro,
  } = useDiarias();

  const [nomeColab, setNomeColab] = useState("");
  const [equipeColab, setEquipeColab] = useState("");
  const [nomeTipo, setNomeTipo] = useState("");
  const [valorTipo, setValorTipo] = useState("");
  const [nomeDestino, setNomeDestino] = useState("");

  const run = async (fn: () => Promise<void>, ok: string) => {
    try {
      await fn();
      toast.success(ok);
    } catch (err) {
      toast.error("Erro: " + (err as Error).message);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <AppHeader title="Diárias" />
      <main className="mx-auto max-w-5xl px-6 py-6">
        <Button asChild variant="ghost" className="mb-4">
          <Link to="/diarias">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar para diárias
          </Link>
        </Button>

        <section className="mb-8 rounded-lg border bg-card">
          <h2 className="border-b px-4 py-3 text-sm font-semibold">Colaboradores</h2>
          <div className="flex flex-wrap gap-3 border-b p-4">
            <Input
              className="w-56"
              placeholder="Nome"
              value={nomeColab}
              onChange={(e) => setNomeColab(e.target.value)}
              aria-label="Nome do colaborador"
            />
            <Input
              className="w-48"
              placeholder="Equipe (opcional)"
              value={equipeColab}
              onChange={(e) => setEquipeColab(e.target.value)}
              aria-label="Equipe do colaborador"
            />
            <Button
              onClick={() =>
                void run(async () => {
                  if (!nomeColab.trim()) throw new Error("Informe o nome");
                  await salvarColaborador({
                    nome: nomeColab.trim().toUpperCase(),
                    equipe: equipeColab.trim().toUpperCase() || null,
                  });
                  setNomeColab("");
                  setEquipeColab("");
                }, "Colaborador salvo")
              }
            >
              Adicionar
            </Button>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Equipe</TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {colaboradores.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="font-medium">{c.nome}</TableCell>
                  <TableCell className="text-muted-foreground">{c.equipe || "—"}</TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      aria-label={`Excluir ${c.nome}`}
                      onClick={() =>
                        void run(
                          () => excluirCadastro("colaboradores", c.id),
                          "Colaborador excluído",
                        )
                      }
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </section>

        <section className="mb-8 rounded-lg border bg-card">
          <h2 className="border-b px-4 py-3 text-sm font-semibold">Tipos de diária</h2>
          <div className="flex flex-wrap gap-3 border-b p-4">
            <Input
              className="w-64"
              placeholder="Descrição"
              value={nomeTipo}
              onChange={(e) => setNomeTipo(e.target.value)}
              aria-label="Descrição do tipo de diária"
            />
            <Input
              className="w-40"
              placeholder="Valor sugerido"
              inputMode="decimal"
              value={valorTipo}
              onChange={(e) => setValorTipo(e.target.value)}
              aria-label="Valor sugerido"
            />
            <Button
              onClick={() =>
                void run(async () => {
                  if (!nomeTipo.trim()) throw new Error("Informe a descrição");
                  const v = parseFloat(valorTipo.replace(",", ".")) || 0;
                  await salvarTipo({ nome: nomeTipo.trim().toUpperCase(), valor_padrao: v });
                  setNomeTipo("");
                  setValorTipo("");
                }, "Tipo salvo")
              }
            >
              Adicionar
            </Button>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tipo</TableHead>
                <TableHead className="text-right">Valor sugerido</TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tipos.map((t) => (
                <TableRow key={t.id}>
                  <TableCell className="font-medium">{t.nome}</TableCell>
                  <TableCell className="text-right font-mono">
                    {formatarMoeda(t.valorPadrao)}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      aria-label={`Excluir ${t.nome}`}
                      onClick={() =>
                        void run(() => excluirCadastro("tipos_diaria", t.id), "Tipo excluído")
                      }
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </section>

        <section className="rounded-lg border bg-card">
          <h2 className="border-b px-4 py-3 text-sm font-semibold">Destinos / clientes</h2>
          <div className="flex flex-wrap gap-3 border-b p-4">
            <Input
              className="w-64"
              placeholder="Nome do destino"
              value={nomeDestino}
              onChange={(e) => setNomeDestino(e.target.value)}
              aria-label="Nome do destino"
            />
            <Button
              onClick={() =>
                void run(async () => {
                  if (!nomeDestino.trim()) throw new Error("Informe o destino");
                  await salvarDestino({ nome: nomeDestino.trim().toUpperCase() });
                  setNomeDestino("");
                }, "Destino salvo")
              }
            >
              Adicionar
            </Button>
          </div>
          <Table>
            <TableBody>
              {destinos.map((d) => (
                <TableRow key={d.id}>
                  <TableCell className="font-medium">{d.nome}</TableCell>
                  <TableCell className="w-12">
                    <Button
                      variant="ghost"
                      size="sm"
                      aria-label={`Excluir ${d.nome}`}
                      onClick={() =>
                        void run(() => excluirCadastro("destinos", d.id), "Destino excluído")
                      }
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
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