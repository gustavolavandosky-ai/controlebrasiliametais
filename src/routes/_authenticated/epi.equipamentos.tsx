import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { AppHeader } from "@/components/AppHeader";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ArrowLeft, Pencil, Plus, Trash2 } from "lucide-react";
import { EpiDialog } from "@/components/EpiDialog";
import { useEpi, type Equipamento } from "@/lib/epi-store";
import { useAccess } from "@/hooks/use-access";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/epi/equipamentos")({
  head: () => ({
    meta: [
      { title: "Gerenciar equipamentos de EPI · ERP Brasília Metais" },
      {
        name: "description",
        content: "Cadastre, edite e organize os equipamentos de proteção individual.",
      },
      { property: "og:title", content: "Gerenciar equipamentos de EPI" },
      {
        property: "og:description",
        content: "Cadastre, edite e organize os equipamentos de proteção individual.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: EquipamentosPage,
});

function EquipamentosPage() {
  const { equipamentos, deleteEquipamento } = useEpi();
  const { somenteLeitura } = useAccess();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [edit, setEdit] = useState<Equipamento | null>(null);
  const [confirm, setConfirm] = useState<Equipamento | null>(null);
  const [excluindo, setExcluindo] = useState(false);

  const excluir = async () => {
    if (!confirm || excluindo) return;
    setExcluindo(true);
    try {
      await deleteEquipamento(confirm.id);
      toast.success("Equipamento excluído");
      setConfirm(null);
    } catch (err) {
      toast.error("Erro ao excluir: " + (err as Error).message);
    } finally {
      setExcluindo(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <AppHeader title="Equipamentos de EPI" />

      <main className="mx-auto max-w-7xl px-6 py-6">
        <div className="mb-6 flex items-center justify-between">
          <Button asChild variant="ghost">
            <Link to="/epi">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar
            </Link>
          </Button>
          {!somenteLeitura && (
            <Button
              onClick={() => {
                setEdit(null);
                setDialogOpen(true);
              }}
            >
              <Plus className="mr-2 h-4 w-4" />
              Cadastrar equipamento
            </Button>
          )}
        </div>

        <div className="rounded-lg border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Equipamento</TableHead>
                <TableHead>Onde está</TableHead>
                <TableHead>Unidade</TableHead>
                <TableHead className="text-right">Estoque inicial</TableHead>
                <TableHead className="w-32 text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {equipamentos.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="py-10 text-center text-muted-foreground">
                    Nenhum equipamento cadastrado.
                  </TableCell>
                </TableRow>
              )}
              {equipamentos.map((e) => (
                <TableRow key={e.id}>
                  <TableCell className="font-medium">{e.nome}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {e.localizacao || "—"}
                  </TableCell>
                  <TableCell>{e.unidade}</TableCell>
                  <TableCell className="text-right font-mono">{e.estoqueInicial}</TableCell>
                  <TableCell className="text-right">
                    {!somenteLeitura && (
                      <>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => {
                            setEdit(e);
                            setDialogOpen(true);
                          }}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button size="icon" variant="ghost" onClick={() => setConfirm(e)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </main>

      <EpiDialog equipamento={edit} open={dialogOpen} onOpenChange={setDialogOpen} />

      <AlertDialog
        open={!!confirm}
        onOpenChange={(v) => {
          if (!v && !excluindo) setConfirm(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir equipamento?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação também remove todos os lançamentos de <b>{confirm?.nome}</b> e não
              pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={excluindo}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              disabled={excluindo}
              onClick={(ev) => {
                ev.preventDefault();
                void excluir();
              }}
            >
              {excluindo ? "Excluindo..." : "Excluir"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
