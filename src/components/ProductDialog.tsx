import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  useInventory,
  UNIDADES,
  type Produto,
  type Unidade,
} from "@/lib/inventory-store";
import { toast } from "sonner";

interface Props {
  produto?: Produto | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}

export function ProductDialog({ produto, open, onOpenChange }: Props) {
  const { addProduto, updateProduto } = useInventory();
  const [nome, setNome] = useState("");
  const [unidade, setUnidade] = useState<Unidade>("un");
  const [estoqueInicial, setEstoqueInicial] = useState("0");
  const [observacoes, setObservacoes] = useState("");
  const [localizacao, setLocalizacao] = useState("");

  useEffect(() => {
    if (!open) return;
    if (produto) {
      setNome(produto.nome);
      setUnidade(produto.unidade);
      setEstoqueInicial(String(produto.estoqueInicial));
      setObservacoes(produto.observacoes);
      setLocalizacao(produto.localizacao);
    } else {
      setNome("");
      setUnidade("un");
      setEstoqueInicial("0");
      setObservacoes("");
      setLocalizacao("");
    }
  }, [open, produto]);

  const salvar = () => {
    if (!nome.trim()) {
      toast.error("Informe o nome do produto");
      return;
    }
    const est = parseFloat(estoqueInicial.replace(",", ".")) || 0;
    const payload = {
      nome: nome.trim(),
      unidade,
      estoqueInicial: est,
      observacoes: observacoes.trim(),
      localizacao: localizacao.trim(),
    };
    if (produto) {
      updateProduto(produto.id, payload);
      toast.success("Produto atualizado");
    } else {
      addProduto(payload);
      toast.success("Produto cadastrado");
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{produto ? "Editar produto" : "Cadastrar produto"}</DialogTitle>
        </DialogHeader>

        <div className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="produto-nome">Nome</Label>
            <Input id="produto-nome" value={nome} onChange={(e) => setNome(e.target.value)} autoFocus />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-2">
              <Label htmlFor="produto-unidade">Tipo de unidade</Label>
              <Select value={unidade} onValueChange={(v) => setUnidade(v as Unidade)}>
                <SelectTrigger id="produto-unidade">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {UNIDADES.map((u) => (
                    <SelectItem key={u} value={u}>
                      {u}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="produto-estoque">Estoque inicial</Label>
              <Input
                id="produto-estoque"
                inputMode="decimal"
                value={estoqueInicial}
                onChange={(e) => setEstoqueInicial(e.target.value)}
              />
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="produto-localizacao">Localização do produto</Label>
            <Input
              id="produto-localizacao"
              value={localizacao}
              onChange={(e) => setLocalizacao(e.target.value)}
              placeholder="Ex.: Prateleira A-3"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="produto-observacoes">Observações</Label>
            <Textarea
              id="produto-observacoes"
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={salvar}>Salvar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
