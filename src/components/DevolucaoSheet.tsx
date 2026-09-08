import { useEffect, useRef, useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  UNIDADES_DEVOLUCAO,
  calcularDiferenca,
  formatarNumero,
  useDevolucoes,
  type Devolucao,
} from "@/lib/devolucoes-store";
import { toast } from "sonner";

interface Props {
  devolucao: Devolucao | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}

export function DevolucaoSheet({ devolucao, open, onOpenChange }: Props) {
  const { addDevolucao, updateDevolucao } = useDevolucoes();

  const [data, setData] = useState(new Date().toISOString().slice(0, 10));
  const [empresa, setEmpresa] = useState("");
  const [material, setMaterial] = useState("");
  const [unidade, setUnidade] = useState<string>("kg");
  const [enviada, setEnviada] = useState("");
  const [retornada, setRetornada] = useState("");
  const [observacao, setObservacao] = useState("");
  const [salvando, setSalvando] = useState(false);
  const salvandoRef = useRef(false);

  useEffect(() => {
    if (!open) return;
    if (devolucao) {
      setData(devolucao.data);
      setEmpresa(devolucao.empresa);
      setMaterial(devolucao.material);
      setUnidade(devolucao.unidade);
      setEnviada(String(devolucao.enviada));
      setRetornada(String(devolucao.retornada));
      setObservacao(devolucao.observacao);
    } else {
      setData(new Date().toISOString().slice(0, 10));
      setEmpresa("");
      setMaterial("");
      setUnidade("kg");
      setEnviada("");
      setRetornada("");
      setObservacao("");
    }
  }, [open, devolucao]);

  const nEnviada = Number(enviada.replace(",", ".")) || 0;
  const nRetornada = Number(retornada.replace(",", ".")) || 0;
  const diferenca = calcularDiferenca({ enviada: nEnviada, retornada: nRetornada });

  const salvar = async () => {
    if (salvandoRef.current) return;
    if (!empresa.trim()) {
      toast.error("Informe a empresa.");
      return;
    }
    if (!material.trim()) {
      toast.error("Informe o material.");
      return;
    }
    salvandoRef.current = true;
    setSalvando(true);
    try {
      const payload = {
        data,
        empresa: empresa.trim(),
        material: material.trim(),
        unidade,
        enviada: nEnviada,
        retornada: nRetornada,
        observacao: observacao.trim(),
      };
      if (devolucao) {
        await updateDevolucao(devolucao.id, payload);
        toast.success("Devolução atualizada");
      } else {
        await addDevolucao(payload);
        toast.success("Devolução registrada");
      }
      onOpenChange(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Não foi possível salvar.");
    } finally {
      salvandoRef.current = false;
      setSalvando(false);
    }
  };

  return (
    <Sheet
      open={open}
      onOpenChange={(v) => {
        if (salvandoRef.current) return;
        onOpenChange(v);
      }}
    >
      <SheetContent className="w-full overflow-y-auto sm:max-w-lg">
        <SheetHeader>
          <SheetTitle>{devolucao ? "Editar devolução" : "Nova devolução"}</SheetTitle>
          <SheetDescription>
            Registre o material enviado e o quanto retornou. A diferença é calculada
            automaticamente.
          </SheetDescription>
        </SheetHeader>

        <div className="grid gap-4 px-4 pb-6">
          <div className="grid gap-2">
            <Label htmlFor="dev-data">Data</Label>
            <Input
              id="dev-data"
              type="date"
              value={data}
              onChange={(e) => setData(e.target.value)}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="dev-empresa">Empresa</Label>
            <Input
              id="dev-empresa"
              value={empresa}
              onChange={(e) => setEmpresa(e.target.value)}
              placeholder="Empresa para onde o material foi enviado"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="dev-material">Material</Label>
            <Input
              id="dev-material"
              value={material}
              onChange={(e) => setMaterial(e.target.value)}
              placeholder="Ex.: lata prensada"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="dev-unidade">Unidade</Label>
            <Select value={unidade} onValueChange={setUnidade}>
              <SelectTrigger id="dev-unidade">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {UNIDADES_DEVOLUCAO.map((u) => (
                  <SelectItem key={u} value={u}>
                    {u}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-2">
              <Label htmlFor="dev-enviada">Quantidade enviada</Label>
              <Input
                id="dev-enviada"
                inputMode="decimal"
                value={enviada}
                onChange={(e) => setEnviada(e.target.value)}
                placeholder="0"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="dev-retornada">Quantidade retornada</Label>
              <Input
                id="dev-retornada"
                inputMode="decimal"
                value={retornada}
                onChange={(e) => setRetornada(e.target.value)}
                placeholder="0"
              />
            </div>
          </div>

          <div className="rounded-md border bg-card p-3">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">
              Diferença
            </p>
            <p
              className="text-xl font-semibold"
              style={{
                color:
                  diferenca === 0
                    ? "var(--muted-foreground)"
                    : diferenca > 0
                      ? "var(--positivo)"
                      : "var(--negativo)",
              }}
            >
              {diferenca > 0 ? "+" : ""}
              {formatarNumero(diferenca)} {unidade}
            </p>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="dev-obs">Observação</Label>
            <Textarea
              id="dev-obs"
              value={observacao}
              onChange={(e) => setObservacao(e.target.value)}
              placeholder="Impureza, motivo da diferença, nota fiscal..."
            />
          </div>

          <Button onClick={() => void salvar()} disabled={salvando}>
            {salvando ? "Salvando..." : "Salvar"}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
