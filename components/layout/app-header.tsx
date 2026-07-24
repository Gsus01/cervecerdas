"use client";

import {
  BarChart3,
  Gauge,
  LoaderCircle,
  LogOut,
  ShieldCheck,
  Tags,
  Trophy,
} from "lucide-react";
import { signOut } from "next-auth/react";
import Link from "next/link";
import { useState } from "react";

import { Brand } from "@/components/layout/brand";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface AppHeaderProps {
  activePage?: "counter" | "event" | "statistics";
  eventId?: string;
  username: string;
  onManageBeerTypes?: () => void;
  onOpenAdmin?: () => void;
}

const navigationItems = [
  {
    key: "counter",
    href: "/home",
    label: "Contador",
    shortLabel: "Contador",
    icon: Gauge,
  },
  {
    key: "event",
    href: "/competition",
    label: "Evento",
    shortLabel: "Evento",
    icon: Trophy,
  },
  {
    key: "statistics",
    href: "/statistics",
    label: "Mis estadísticas",
    shortLabel: "Mis datos",
    icon: BarChart3,
  },
] as const;

export function AppHeader({
  activePage,
  eventId,
  username,
  onManageBeerTypes,
  onOpenAdmin,
}: AppHeaderProps) {
  const [isSigningOut, setIsSigningOut] = useState(false);

  async function handleSignOut() {
    setIsSigningOut(true);
    await signOut({ callbackUrl: "/login" });
  }

  return (
    <header className="safe-top sticky top-0 z-30 border-b border-border/75 bg-background/95 backdrop-blur-lg">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-5 py-2.5 sm:px-8">
        <Brand className="min-w-0 max-w-[48vw]" />
        <div className="ml-auto flex items-center gap-2 sm:gap-3">
          <p className="hidden text-sm text-muted-foreground lg:block">
            Sesión de <span className="font-bold text-foreground">{username}</span>
          </p>
          {onManageBeerTypes ? (
            <Button
              aria-label="Catálogo de bebidas"
              onClick={onManageBeerTypes}
              variant="outline"
            >
              <Tags aria-hidden="true" className="size-4" />
              <span className="hidden min-[520px]:inline">
                Catálogo de bebidas
              </span>
            </Button>
          ) : null}
          {onOpenAdmin ? (
            <Button
              aria-label="Abrir administración"
              onClick={onOpenAdmin}
              variant="outline"
            >
              <ShieldCheck aria-hidden="true" className="size-4" />
              <span className="hidden xl:inline">Administrar</span>
            </Button>
          ) : null}
          <Button
            aria-busy={isSigningOut}
            aria-label="Cerrar sesión"
            disabled={isSigningOut}
            onClick={() => void handleSignOut()}
            variant="outline"
          >
            {isSigningOut ? (
              <LoaderCircle aria-hidden="true" className="size-4 animate-spin" />
            ) : (
              <LogOut aria-hidden="true" className="size-4" />
            )}
            <span className="hidden sm:inline">Cerrar sesión</span>
          </Button>
        </div>
      </div>

      <nav aria-label="Navegación principal" className="border-t border-border/60">
        <div className="mx-auto flex max-w-7xl gap-0.5 px-5 sm:gap-1 sm:px-8">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const isActive = item.key === activePage;
            const href =
              eventId && (item.key === "counter" || item.key === "event")
                ? `${item.href}?eventId=${encodeURIComponent(eventId)}`
                : item.href;
            return (
              <Link
                aria-current={isActive ? "page" : undefined}
                aria-label={item.label}
                className={cn(
                  "relative inline-flex min-h-11 min-w-0 flex-1 items-center justify-center gap-1.5 rounded-t-lg px-2 text-sm font-bold transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring sm:max-w-48 sm:gap-2 sm:px-4",
                  isActive
                    ? "bg-accent/35 text-foreground after:absolute after:inset-x-3 after:bottom-0 after:h-0.5 after:rounded-full after:bg-primary"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
                href={href}
                key={item.key}
              >
                <Icon aria-hidden="true" className="size-4" />
                <span className="sm:hidden">{item.shortLabel}</span>
                <span className="hidden sm:inline">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </header>
  );
}
