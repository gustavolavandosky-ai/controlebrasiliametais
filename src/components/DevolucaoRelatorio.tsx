import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Printer } from "lucide-react";
import {
  calcularDiferenca,
  formatarData,
  formatarNumero,
  percentualDiferenca,
  type Devolucao,
} from "@/lib/devolucoes-store";

function cor(v: number) {
  if (v === 0) return "var(--muted-foreground)";
  return v > 0 ? "var(--negativo)" : "var(--positivo)";
}

function Campo({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="font-medium">{children}</p>
    </div>
  );
}

export function DevolucaoRelatorio({
  itens,
  open,
  onOpenChange,
}: {
  itens: Devolucao[];
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const ordenados = [...itens].sort((a, b) => (a.data < b.data ? 1 : a.data > b.data ? -1 : b.createdAt - a.createdAt));
  const porUnidade = new Map<string, { env: number; ret: number }>();
  for (const d of ordenados) {
    const t = porUnidade.get(d.unidade) ?? { env: 0, ret: 0 };
    t.env += d.enviada;
    t.ret += d.retornada;
    porUnidade.set(d.unidade, t);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto print:max-h-none print:overflow-visible">
        <DialogHeader>
          <DialogTitle>Relatório de devoluções</DialogTitle>
          <DialogDescription>
            {ordenados.length} {ordenados.length === 1 ? "lançamento" : "lançamentos"} · gerado em{" "}
            {new Date().toLocaleString("pt-BR")}
          </DialogDescription>
        </DialogHeader>

        {ordenados.length > 1 && (
          <div className="rounded-lg border bg-muted/40 p-4">
            <p className="mb-2 text-sm font-semibold">Resumo geral</p>
            <div className="grid gap-2">
              {[...porUnidade.entries()].map(([u, t]) => {
                const dif = t.ret - t.env;
                return (
                  <div key={u} className="grid grid-cols-3 gap-3 text-sm">
                    <Campo label={`Enviado (${u})`}>{formatarNumero(t.env)} {u}</Campo>
                    <Campo label={`Retornado (${u})`}>{formatarNumero(t.ret)} {u}</Campo>
                    <Campo label="Diferença">
                      <span style={{ color: cor(dif) }}>
                        {dif > 0 ? "+" : ""}
                        {formatarNumero(dif)} {u}
                      </span>
                    </Campo>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className="grid gap-4">
          {ordenados.map((d, i) => {
            const dif = calcularDiferenca(d);
            const pct = percentualDiferenca(d);
            return (
              <section key={d.id} className="break-inside-avoid rounded-lg border p-4">
                <div className="mb-3 flex items-center justify-between border-b pb-2">
                  <p className="font-semibold">
                    {i + 1}. {d.empresa || "Sem empresa"} · {d.material || "Sem material"}
                  </p>
                  <span className="text-sm text-muted-foreground">{formatarData(d.data)}</span>
                </div>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  <Campo label="Enviado">{formatarNumero(d.enviada)} {d.unidade}</Campo>
                  <Campo label="Retornado">{formatarNumero(d.retornada)} {d.unidade}</Campo>
                  <Campo label="Diferença">
                    <span style={{ color: cor(dif) }}>
                      {dif > 0 ? "+" : ""}
                      {formatarNumero(dif)} {d.unidade}
                    </span>
                  </Campo>
                  <Campo label="Percentual">
                    <span style={{ color: cor(dif) }}>
                      {pct > 0 ? "+" : ""}
                      {pct.toLocaleString("pt-BR", { maximumFractionDigits: 1 })}%
                    </span>
                  </Campo>
                </div>
                <p className="mt-3 text-sm text-muted-foreground">
                  {dif < 0
                    ? `Voltaram ${formatarNumero(-dif)} ${d.unidade} a menos do que foi enviado.`
                    : dif > 0
                      ? `Voltaram ${formatarNumero(dif)} ${d.unidade} a mais do que foi enviado.`
                      : "Voltou exatamente o que foi enviado."}
                </p>
                {d.observacao && (
                  <p className="mt-2 text-sm">
                    <span className="text-muted-foreground">Observação: </span>
                    {d.observacao}
                  </p>
                )}
              </section>
            );
          })}
        </div>

        <div className="flex justify-end print:hidden">
          <Button onClick={() => window.print()}>
            <Printer className="mr-2 h-4 w-4" />
            Imprimir / PDF
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
