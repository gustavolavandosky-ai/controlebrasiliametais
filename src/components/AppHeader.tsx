import logo from "@/assets/logo.png";
import { Link, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { useAccess } from "@/hooks/use-access";
import { LogOut, Users, Boxes, CalendarDays, Undo2, HardHat, ShoppingBag, Fuel, Wallet, Menu, Route } from "lucide-react";
import { Sheet, SheetClose, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

const SETORES = [
  { to: "/estoque", label: "Estoque", Icon: Boxes },
  { to: "/diarias", label: "Diárias", Icon: CalendarDays },
  { to: "/devolucoes", label: "Devoluções", Icon: Undo2 },
  { to: "/epi", label: "EPI", Icon: HardHat },
  { to: "/bags", label: "Bags", Icon: ShoppingBag },
  { to: "/abastecimento", label: "Abastecimento", Icon: Fuel },
  { to: "/financeiro", label: "Financeiro", Icon: Wallet },
  { to: "/viagens", label: "Viagens", Icon: Route },
] as const;


export function AppHeader({ title }: { title: string }) {
  const { user } = useAuth();
  const { isAdmin, somenteLeitura } = useAccess();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const sair = async () => {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  };

  const meta = (user?.user_metadata ?? {}) as Record<string, unknown>;
  const nome =
    (typeof meta['full_name'] === "string" && (meta['full_name'] as string)) ||
    (typeof meta['name'] === "string" && (meta['name'] as string)) ||
    (user?.email ? user.email.split("@")[0] : "") ||
    "";

  return (
    <header className="border-b bg-card">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3">
        <Link to="/estoque" className="flex flex-col">
          <span className="text-lg font-semibold tracking-tight">{title}</span>
          <span className="text-xs text-muted-foreground">
            ERP · Controle de Estoque
          </span>
        </Link>
        <div className="flex items-center gap-3">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" aria-label="Abrir menu de setores">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72">
              <SheetHeader>
                <SheetTitle>Setores</SheetTitle>
              </SheetHeader>
              <nav className="mt-4 grid gap-1">
                {SETORES.map(({ to, label, Icon }) => (
                  <SheetClose asChild key={to}>
                    <Link
                      to={to}
                      className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium hover:bg-accent"
                      activeProps={{ className: "bg-accent" }}
                    >
                      <Icon className="h-4 w-4" />
                      {label}
                    </Link>
                  </SheetClose>
                ))}
              </nav>
            </SheetContent>
          </Sheet>
          {somenteLeitura && (
            <span className="hidden rounded-full border px-2 py-0.5 text-xs text-muted-foreground sm:inline">
              Somente leitura
            </span>
          )}
          {isAdmin && (
            <Button asChild variant="ghost" size="sm">
              <Link to="/acessos">
                <Users className="mr-2 h-4 w-4" />
                Acessos
              </Link>
            </Button>
          )}
          <span className="hidden text-sm font-medium text-foreground sm:inline">
            {nome}
          </span>
          <Button variant="ghost" size="sm" onClick={() => void sair()}>
            <LogOut className="mr-2 h-4 w-4" />
            Sair
          </Button>
          <img
            src={logo}
            alt="Logo"
            width={40}
            height={40}
            loading="lazy"
            className="h-10 w-10 rounded-md object-contain"
          />
        </div>
      </div>
    </header>
  );
}
