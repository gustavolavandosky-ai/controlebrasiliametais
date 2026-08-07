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
import { ProductDialog } from "@/components/ProductDialog";
import { useInventory, type Produto } from "@/lib/inventory-store";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/produtos")({
  head: () => ({ meta: [{ title: "Gerenciar produtos · ERP Estoque" }, { name: "description", content: "Cadastre, edite e organize os produtos do seu estoque." }, { property: "og:title", content: "Gerenciar produtos · ERP Estoque" }, { property: "og:description", content: "Cadastre, edite e organize os produtos do seu estoque." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" }] }),
  component: ProdutosPage,
});

function ProdutosPage() {
  const { produtos, deleteProduto } = useInventory();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [edit, setEdit] = useState<Produto | null>(null);
  const [confirm, setConfirm] = useState<Produto | null>(null);

  const novo = () => {
    setEdit(null);
    setDialogOpen(true);
  };
  const editar = (p: Produto) => {
    setEdit(p);
    setDialogOpen(true);
  };

  return (
    <div className="min-h-screen bg-background">
      <AppHeader title="Gerenciar produtos" />

      <main className="mx-auto max-w-7xl px-6 py-6">
        <div className="mb-6 flex items-center justify-between">
          <Button asChild variant="ghost">
            <Link to="/estoque">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar
            </Link>
          </Button>
          <Button onClick={novo}>
            <Plus className="mr-2 h-4 w-4" />
            Cadastrar produto
          </Button>
        </div>

        <div className="rounded-lg border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Produto</TableHead>
                <TableHead>Localização</TableHead>
                <TableHead>Unidade</TableHead>
                <TableHead className="text-right">Estoque inicial</TableHead>
                <TableHead className="w-32 text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {produtos.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="py-10 text-center text-muted-foreground">
                    Nenhum produto cadastrado.
                  </TableCell>
                </TableRow>
              )}
              {produtos.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="font-medium">{p.nome}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {p.localizacao || "—"}
                  </TableCell>
                  <TableCell>{p.unidade}</TableCell>
                  <TableCell className="text-right font-mono">
                    {p.estoqueInicial}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button size="icon" variant="ghost" onClick={() => editar(p)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => setConfirm(p)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </main>

      <ProductDialog produto={edit} open={dialogOpen} onOpenChange={setDialogOpen} />

      <AlertDialog open={!!confirm} onOpenChange={(v) => !v && setConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir produto?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação também remove todos os lançamentos de{" "}
              <b>{confirm?.nome}</b> e não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (confirm) {
                  deleteProduto(confirm.id);
                  toast.success("Produto excluído");
                }
                setConfirm(null);
              }}
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
