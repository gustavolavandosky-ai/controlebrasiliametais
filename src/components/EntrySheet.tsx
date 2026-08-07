import { useEffect, useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  type TipoLancamento,
  type Unidade,
  type Lancamento,
} from "@/lib/inventory-store";
import { toast } from "sonner";

interface Props {
  produto: Produto | null;
  lancamento?: Lancamento | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}

function nowDate() {
  return new Date().toISOString().slice(0, 10);
}
function nowTime() {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

export function EntrySheet({ produto, lancamento, open, onOpenChange }: Props) {
  const { addLancamento, updateLancamento } = useInventory();
  const [tipo, setTipo] = useState<TipoLancamento>("entrada");
  const [quantidade, setQuantidade] = useState("");
  const [unidade, setUnidade] = useState<Unidade>("un");
  const [data, setData] = useState(nowDate());
  const [hora, setHora] = useState(nowTime());

  useEffect(() => {
    if (!open) return;
    if (lancamento) {
      setTipo(lancamento.tipo);
      setQuantidade(String(lancamento.quantidade));
      setUnidade(lancamento.unidade);
      setData(lancamento.data);
      setHora(lancamento.hora);
    } else if (produto) {
      setTipo("entrada");
      setQuantidade("");
      setUnidade(produto.unidade);
      setData(nowDate());
      setHora(nowTime());
    }
  }, [open, produto, lancamento]);

  if (!produto) return null;

  const salvar = async () => {
    const q = parseFloat(quantidade.replace(",", "."));
    if (!isFinite(q) || q < 0) {
      toast.error("Quantidade inválida");
      return;
    }
    try {
      if (lancamento) {
        await updateLancamento(lancamento.id, {
          tipo,
          quantidade: q,
          unidade,
          data,
          hora,
        });
        toast.success("Lançamento atualizado");
      } else {
        await addLancamento({
          produtoId: produto.id,
          tipo,
          quantidade: q,
          unidade,
          data,
          hora,
        });
        toast.success("Lançamento salvo");
      }
      onOpenChange(false);
    } catch (err) {
      toast.error("Erro ao salvar: " + (err as Error).message);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle>
            {lancamento ? "Editar lançamento" : "Incluir lançamento"}
          </SheetTitle>
          <SheetDescription>{produto.nome}</SheetDescription>
        </SheetHeader>

        <div className="mt-6 grid gap-4 px-4">
          <div className="grid gap-2">
            <Label htmlFor="lancamento-tipo">Tipo de lançamento</Label>
            <Select value={tipo} onValueChange={(v) => setTipo(v as TipoLancamento)}>
              <SelectTrigger id="lancamento-tipo">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="entrada">Entrada</SelectItem>
                <SelectItem value="saida">Saída</SelectItem>
                <SelectItem value="balanco">Balanço</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-[1fr_120px] gap-3">
            <div className="grid gap-2">
              <Label htmlFor="lancamento-quantidade">Quantidade</Label>
              <Input
                id="lancamento-quantidade"
                inputMode="decimal"
                value={quantidade}
                onChange={(e) => setQuantidade(e.target.value)}
                placeholder="0"
                autoFocus
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="lancamento-unidade">Unidade</Label>
              <Select value={unidade} onValueChange={(v) => setUnidade(v as Unidade)}>
                <SelectTrigger id="lancamento-unidade">
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
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-2">
              <Label htmlFor="lancamento-data">Data</Label>
              <Input id="lancamento-data" type="date" value={data} onChange={(e) => setData(e.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="lancamento-hora">Horário</Label>
              <Input id="lancamento-hora" type="time" value={hora} onChange={(e) => setHora(e.target.value)} />
            </div>
          </div>

          <Button onClick={() => void salvar()} className="mt-2 w-full">
            Salvar
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
