"use client";

import { AlertTriangle, CheckCircle2, LoaderCircle, LogOut } from "lucide-react";
import { signOut } from "next-auth/react";
import { useEffect, useRef, useState } from "react";

import { ActivityFeed } from "@/components/dashboard/activity-feed";
import { BeerCounter } from "@/components/dashboard/beer-counter";
import { Ranking } from "@/components/dashboard/ranking";
import { Brand } from "@/components/layout/brand";
import { Button } from "@/components/ui/button";
import {
  addBeer,
  ApiClientError,
  getBeerLogs,
  getRanking,
} from "@/lib/http/api-client";
import type { BeerLogDto, PageDto, RankingEntryDto, UserDto } from "@/lib/types/api";
import { cn } from "@/lib/utils";

interface ToastState {
  kind: "success" | "error";
  message: string;
}

function messageFromError(error: unknown): string {
  return error instanceof ApiClientError
    ? error.message
    : "La operación no se ha podido completar";
}

interface DashboardProps {
  initialUser: UserDto;
  initialRanking: RankingEntryDto[];
  initialLogs: PageDto<BeerLogDto>;
}

export function Dashboard({
  initialUser,
  initialRanking,
  initialLogs,
}: DashboardProps) {
  const [user, setUser] = useState(initialUser);
  const [ranking, setRanking] = useState(initialRanking);
  const [logs, setLogs] = useState(initialLogs);
  const [isLoadingLogs, setIsLoadingLogs] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [toast, setToast] = useState<ToastState | null>(null);
  const addInFlight = useRef(false);

  useEffect(() => {
    if (!toast) {
      return;
    }
    const timeout = window.setTimeout(() => setToast(null), 4_000);
    return () => window.clearTimeout(timeout);
  }, [toast]);

  async function handleAddBeer() {
    if (addInFlight.current) {
      return;
    }

    addInFlight.current = true;
    setIsAdding(true);
    setToast(null);

    try {
      const result = await addBeer();
      setUser((current) =>
        current ? { ...current, beerCount: result.beerCount } : current,
      );
      setLogs((current) => ({
        ...current,
        page: 0,
        content: [result.log, ...current.content].slice(0, current.size),
        totalElements: current.totalElements + 1,
        totalPages: Math.ceil((current.totalElements + 1) / current.size),
      }));
      setToast({ kind: "success", message: "Cerveza registrada. ¡Salud!" });

      const [nextRanking, firstLogPage] = await Promise.allSettled([
        getRanking(),
        getBeerLogs(0),
      ]);
      if (nextRanking.status === "fulfilled") {
        setRanking(nextRanking.value);
      }
      if (firstLogPage.status === "fulfilled") {
        setLogs(firstLogPage.value);
      }
    } catch (error) {
      setToast({ kind: "error", message: messageFromError(error) });
    } finally {
      addInFlight.current = false;
      setIsAdding(false);
    }
  }

  async function handlePageChange(page: number) {
    setIsLoadingLogs(true);
    try {
      setLogs(await getBeerLogs(page));
    } catch (error) {
      setToast({ kind: "error", message: messageFromError(error) });
    } finally {
      setIsLoadingLogs(false);
    }
  }

  async function handleSignOut() {
    setIsSigningOut(true);
    await signOut({ callbackUrl: "/login" });
  }

  const currentPosition = ranking.find((entry) => entry.userId === user.id)?.position;

  return (
    <div className="min-h-dvh dashboard-background">
      <header className="safe-top sticky top-0 z-30 border-b border-border/75 bg-background/90 backdrop-blur-lg">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-3 sm:px-8">
          <Brand />
          <div className="flex items-center gap-2 sm:gap-4">
            <p className="hidden text-sm text-muted-foreground sm:block">
              Sesión de <span className="font-bold text-foreground">{user.username}</span>
            </p>
            <Button
              aria-busy={isSigningOut}
              disabled={isSigningOut}
              onClick={() => void handleSignOut()}
              variant="outline"
            >
              {isSigningOut ? (
                <LoaderCircle aria-hidden="true" className="size-4 animate-spin" />
              ) : (
                <LogOut aria-hidden="true" className="size-4" />
              )}
              <span className="hidden min-[390px]:inline">Cerrar sesión</span>
              <span className="min-[390px]:hidden">Salir</span>
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl space-y-5 px-5 py-6 sm:px-8 sm:py-8">
        <BeerCounter
          isAdding={isAdding}
          onAddBeer={() => void handleAddBeer()}
          position={currentPosition}
          user={user}
        />

        <div className="grid items-start gap-5 lg:grid-cols-2">
          <Ranking currentUserId={user.id} entries={ranking} />
          <ActivityFeed
            isLoading={isLoadingLogs}
            logs={logs}
            onPageChange={(page) => void handlePageChange(page)}
          />
        </div>
      </main>

      <footer className="mx-auto max-w-7xl px-5 pb-8 pt-3 text-center text-xs text-muted-foreground sm:px-8">
        Cervecerdas lleva la cuenta; tú marcas el ritmo. Disfruta con responsabilidad.
      </footer>

      {toast ? (
        <div
          aria-atomic="true"
          className={cn(
            "safe-toast fixed left-1/2 z-50 flex min-h-12 w-[calc(100%-2.5rem)] max-w-sm -translate-x-1/2 items-center gap-3 rounded-xl border px-4 py-3 text-sm font-bold shadow-lift",
            toast.kind === "success"
              ? "border-emerald-800/20 bg-emerald-900 text-white"
              : "border-destructive/30 bg-destructive text-destructive-foreground",
          )}
          role={toast.kind === "error" ? "alert" : "status"}
        >
          {toast.kind === "success" ? (
            <CheckCircle2 aria-hidden="true" className="size-5 shrink-0" />
          ) : (
            <AlertTriangle aria-hidden="true" className="size-5 shrink-0" />
          )}
          {toast.message}
        </div>
      ) : null}
    </div>
  );
}
