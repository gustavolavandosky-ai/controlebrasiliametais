import logo from "@/assets/logo.png";
import { Link } from "@tanstack/react-router";

export function AppHeader({ title }: { title: string }) {
  return (
    <header className="border-b bg-card">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3">
        <Link to="/" className="flex flex-col">
          <span className="text-lg font-semibold tracking-tight">{title}</span>
          <span className="text-xs text-muted-foreground">
            ERP · Controle de Estoque
          </span>
        </Link>
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-foreground">Admin</span>
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
