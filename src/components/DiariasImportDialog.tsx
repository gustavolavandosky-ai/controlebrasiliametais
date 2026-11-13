import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import * as XLSX from "xlsx";
import { toast } from "sonner";
import {
  formatarData,
  formatarMoeda,
  useDiarias,
  type DiariaInput,
} from "@/lib/diarias-store";

function normalizarData(v: unknown): string {
  if (v instanceof Date) return v.toISOString().slice(0, 10);
  if (typeof v === "number") {
    const d = XLSX.SSF.parse_date_code(v);
    if (d)
      return `${d.y}-${String(d.m).padStart(2, "0")}-${String(d.d).padStart(2, "0")}`;
  }
  const s = String(v ?? "").trim();
  const br = s.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (br) return `${br[3]}-${br[2]}-${br[1]}`;
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  return new Date().toISOString().slice(0, 10);
}

function num(v: unknown): number {
  if (typeof v === "number") return v;
  const n = parseFloat(String(v ?? "").replace(/[^\d,.-]/g, "").replace(",", "."));
  return isFinite(n) ? n : 0;
}

export function DiariasImportDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const { importarDiarias } = useDiarias();
  const [linhas, setLinhas] = useState<DiariaInput[]>([]);
  const [salvando, setSalvando] = useState(false);

  const ler = async (file: File) => {
    try {
      const buf = await file.arrayBuffer();
      const wb = XLSX.read(buf);
      const ws = wb.Sheets[wb.SheetNames[0]!]!;
      const raw = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws, { defval: "" });
      const parsed: DiariaInput[] = raw
        .map((r) => {
          const get = (...keys: string[]) => {
            for (const k of Object.keys(r)) {
              const norm = k.trim().toLowerCase();
              if (keys.some((x) => norm.includes(x))) return r[k];
            }
            return "";
          };
          const colaborador = String(get("colaborador", "nome", "motorista") ?? "")
            .trim()
            .toUpperCase();
          const sit = String(get("situa", "pagamento") ?? "").trim().toUpperCase();
          const trocoRaw = get("troco");
          return {
            data: normalizarData(get("data")),
            colaborador,
            equipe: String(get("equipe") ?? "").trim().toUpperCase(),
            tipo: String(get("tipo", "diária", "diaria") ?? "").trim().toUpperCase(),
            valor: num(get("valor")),
            destino: String(get("destino", "cliente") ?? "").trim().toUpperCase(),
            veiculoId: null,
            situacao: (sit === "PAGO" ? "pago" : "pendente") as DiariaInput["situacao"],
            troco: String(trocoRaw ?? "").trim() === "" ? null : num(trocoRaw),
            observacao: String(get("observa") ?? "").trim(),
          };
        })
        .filter((r) => r.colaborador);
      if (parsed.length === 0) {
        toast.error("Nenhuma linha válida encontrada na planilha");
        return;
      }
      setLinhas(parsed);
    } catch (err) {
      toast.error("Erro ao ler planilha: " + (err as Error).message);
    }
  };

  const confirmar = async () => {
    setSalvando(true);
    try {
      const n = await importarDiarias(linhas);
      toast.success(`${n} diárias importadas`);
      setLinhas([]);
      onOpenChange(false);
    } catch (err) {
      toast.error("Erro ao importar: " + (err as Error).message);
    } finally {
      setSalvando(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) setLinhas([]);
        onOpenChange(v);
      }}
    >
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>Importar diárias</DialogTitle>
          <DialogDescription>
            Planilha com as colunas Data, Colaborador, Tipo, Valor, Destino, Situação e
            Troco.
          </DialogDescription>
        </DialogHeader>

        <Input
          type="file"
          accept=".xlsx,.xls"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) void ler(f);
          }}
        />

        {linhas.length > 0 && (
          <>
            <div className="max-h-72 overflow-auto rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Colaborador</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead className="text-right">Valor</TableHead>
                    <TableHead>Destino</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {linhas.map((l, i) => (
                    <TableRow key={i}>
                      <TableCell>{formatarData(l.data)}</TableCell>
                      <TableCell>{l.colaborador}</TableCell>
                      <TableCell>{l.tipo || "—"}</TableCell>
                      <TableCell className="text-right font-mono">
                        {formatarMoeda(l.valor)}
                      </TableCell>
                      <TableCell>{l.destino || "—"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <Button disabled={salvando} onClick={() => void confirmar()}>
              Importar {linhas.length} lançamentos
            </Button>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}