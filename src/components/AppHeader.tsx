import logo from "@/assets/logo.png";
import { Link, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { useAccess } from "@/hooks/use-access";
import { LogOut, Users, Boxes, CalendarDays, Undo2, HardHat, ShoppingBag, Fuel } from "lucide-react";

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
          <nav className="hidden items-center gap-1 md:flex">
            <Button asChild variant="ghost" size="sm">
              <Link to="/estoque">
                <Boxes className="mr-2 h-4 w-4" />
                Estoque
              </Link>
            </Button>
            <Button asChild variant="ghost" size="sm">
              <Link to="/diarias">
                <CalendarDays className="mr-2 h-4 w-4" />
                Diárias
              </Link>
            </Button>
            <Button asChild variant="ghost" size="sm">
              <Link to="/devolucoes">
                <Undo2 className="mr-2 h-4 w-4" />
                Devoluções
              </Link>
            </Button>
            <Button asChild variant="ghost" size="sm">
              <Link to="/epi">
                <HardHat className="mr-2 h-4 w-4" />
                EPI
              </Link>
            </Button>
            <Button asChild variant="ghost" size="sm">
              <Link to="/bags">
                <ShoppingBag className="mr-2 h-4 w-4" />
                Bags
              </Link>
            </Button>
            <Button asChild variant="ghost" size="sm">
              <Link to="/abastecimento">
                <Fuel className="mr-2 h-4 w-4" />
                Abastecimento
              </Link>
            </Button>
          </nav>
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
