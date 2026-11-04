import { useEffect, useRef, useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
import { calcularFardos, controlePorLocal, useApontamentos } from "@/lib/unidades";

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
  const { addLancamento, updateLancamento, lancamentos } = useInventory();
  const { apontamentos } = useApontamentos(produto?.id ?? "");
  const [fardos, setFardos] = useState("");
  const [tipo, setTipo] = useState<TipoLancamento>("entrada");
  const [quantidade, setQuantidade] = useState("");
  const [unidade, setUnidade] = useState<Unidade>("un");
  const [data, setData] = useState(nowDate());
  const [hora, setHora] = useState(nowTime());
  const [observacao, setObservacao] = useState("");
  const [salvando, setSalvando] = useState(false);
  const salvandoRef = useRef(false);

  useEffect(() => {
    if (!open) return;
    if (lancamento) {
      setTipo(lancamento.tipo);
      setQuantidade(String(lancamento.quantidade));
      setUnidade(lancamento.unidade);
      setData(lancamento.data);
      setHora(lancamento.hora);
      setObservacao(lancamento.observacao ?? "");
      setFardos(lancamento.fardos != null ? String(lancamento.fardos) : "");
    } else if (produto) {
      setTipo("entrada");
      setQuantidade("");
      setUnidade(produto.unidade);
      setData(nowDate());
      setHora(nowTime());
      setObservacao("");
      setFardos("");
    }
    salvandoRef.current = false;
    setSalvando(false);
  }, [open, produto, lancamento]);

  if (!produto) return null;

  const salvar = async () => {
    if (salvandoRef.current) return;
    const q = parseFloat(quantidade.replace(",", "."));
    if (!isFinite(q) || q < 0) {
      toast.error("Quantidade inválida");
      return;
    }
    const enfardado = controlePorLocal(produto.localizacao) === "fardo";
    let fardosValor: number | null | undefined = undefined;
    if (enfardado) {
      if (tipo === "saida") {
        if (fardos.trim() === "") fardosValor = null;
        else {
          const f = Number(fardos);
          if (!Number.isInteger(f) || f < 0) {
            toast.error("Fardos deve ser número inteiro");
            return;
          }
          fardosValor = f;
          const outros = lancamentos.filter(
            (l) => l.produtoId === produto.id && l.id !== lancamento?.id,
          );
          const saldo = calcularFardos(outros, apontamentos).saldo;
          if (saldo - f < 0 && !window.confirm(`Saldo de fardos ficará negativo (${saldo - f}). Confirmar mesmo assim?`)) return;
        }
      } else if (tipo === "entrada") {
        // Cada novo lançamento de entrada = 1 fardo; edição preserva o valor original.
        fardosValor = lancamento ? (lancamento.tipo === "entrada" ? undefined : 1) : 1;
      } else {
        fardosValor = lancamento ? undefined : null;
      }
    }
    salvandoRef.current = true;
    setSalvando(true);
    try {
      if (lancamento) {
        await updateLancamento(lancamento.id, {
          tipo,
          quantidade: q,
          unidade,
          data,
          hora,
          observacao,
          ...(fardosValor !== undefined ? { fardos: fardosValor } : {}),
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
          observacao,
          fardos: fardosValor ?? null,
        });
        toast.success("Lançamento salvo");
      }
      onOpenChange(false);
    } catch (err) {
      toast.error("Erro ao salvar: " + (err as Error).message);
    } finally {
      salvandoRef.current = false;
      setSalvando(false);
    }
  };

  return (
    <Sheet
      open={open}
      onOpenChange={(nextOpen) => {
        if (!salvandoRef.current) onOpenChange(nextOpen);
      }}
    >
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

          {controlePorLocal(produto.localizacao) === "fardo" && tipo === "saida" && (
            <div className="grid gap-2">
              <Label htmlFor="lancamento-fardos">Fardos retirados (opcional)</Label>
              <Input
                id="lancamento-fardos"
                inputMode="numeric"
                value={fardos}
                onChange={(e) => setFardos(e.target.value)}
                placeholder="Deixe vazio se só souber o peso"
              />
              <p className="text-xs text-muted-foreground">Sem quantidade, o saldo de fardos é mantido e fica pendente de conferência.</p>
            </div>
          )}
          {controlePorLocal(produto.localizacao) === "fardo" && tipo === "entrada" && (
            <p className="text-xs text-muted-foreground">Material enfardado: cada nova entrada conta como 1 fardo.</p>
          )}

          <div className="grid gap-2">
            <Label htmlFor="lancamento-observacao">Observação</Label>
            <Textarea
              id="lancamento-observacao"
              value={observacao}
              onChange={(e) => setObservacao(e.target.value)}
              placeholder="Ex: nota fiscal, motivo do ajuste, responsável..."
              rows={3}
            />
          </div>

          <Button
            onClick={() => void salvar()}
            disabled={salvando}
            className="mt-2 w-full"
          >
            {salvando ? "Salvando..." : "Salvar"}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
