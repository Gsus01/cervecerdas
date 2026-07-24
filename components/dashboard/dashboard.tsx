"use client";

import {
  AlertTriangle,
  CalendarPlus,
  CheckCircle2,
  LoaderCircle,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { AdminPanelDialog } from "@/components/admin/admin-panel-dialog";
import { ActivityFeed } from "@/components/dashboard/activity-feed";
import { BeerCounter } from "@/components/dashboard/beer-counter";
import { BeerTypesDialog } from "@/components/dashboard/beer-types-dialog";
import { Ranking } from "@/components/dashboard/ranking";
import { EventSelector } from "@/components/events/event-selector";
import { AppHeader } from "@/components/layout/app-header";
import { buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  addEventBeer,
  ApiClientError,
  getBeerTypes,
  getCurrentUser,
  getEventDashboard,
} from "@/lib/http/api-client";
import type {
  BeerTypeDto,
  EventDashboardDto,
  EventStatus,
  EventSummaryDto,
  UserDto,
} from "@/lib/types/api";
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

function browserTimeZone(fallback: string): string {
  return Intl.DateTimeFormat().resolvedOptions().timeZone || fallback;
}

function statusAt(event: EventSummaryDto, timestamp: number): EventStatus {
  if (timestamp < new Date(event.startsAt).getTime()) {
    return "UPCOMING";
  }
  if (timestamp >= new Date(event.endsAt).getTime()) {
    return "FINISHED";
  }
  return "ACTIVE";
}

interface DashboardProps {
  initialUser: UserDto;
  initialEvents: EventSummaryDto[];
  initialDashboard: EventDashboardDto | null;
  initialBeerTypes: BeerTypeDto[];
}

export function Dashboard({
  initialUser,
  initialEvents,
  initialDashboard,
  initialBeerTypes,
}: DashboardProps) {
  const router = useRouter();
  const [user, setUser] = useState(initialUser);
  const [dashboard, setDashboard] = useState(initialDashboard);
  const [events, setEvents] = useState(initialEvents);
  const [selectedEventId, setSelectedEventId] = useState(
    initialDashboard?.event.id ?? "",
  );
  const [beerTypes, setBeerTypes] = useState(initialBeerTypes);
  const [selectedBeerTypeId, setSelectedBeerTypeId] = useState("");
  const [isBeerTypesOpen, setIsBeerTypesOpen] = useState(false);
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [isLoadingEvent, setIsLoadingEvent] = useState(false);
  const [isLoadingLogs, setIsLoadingLogs] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [toast, setToast] = useState<ToastState | null>(null);
  const [statusClock, setStatusClock] = useState<number | null>(null);
  const addInFlight = useRef(false);

  useEffect(() => {
    if (!toast) {
      return;
    }
    const timeout = window.setTimeout(() => setToast(null), 4_000);
    return () => window.clearTimeout(timeout);
  }, [toast]);

  useEffect(() => {
    const refreshStatus = () => setStatusClock(Date.now());
    const initialRefresh = window.setTimeout(refreshStatus, 0);
    const interval = window.setInterval(refreshStatus, 15_000);
    return () => {
      window.clearTimeout(initialRefresh);
      window.clearInterval(interval);
    };
  }, []);

  function applyDashboard(nextDashboard: EventDashboardDto) {
    setDashboard(nextDashboard);
    setEvents((current) =>
      current.map((event) =>
        event.id === nextDashboard.event.id ? nextDashboard.event : event,
      ),
    );
  }

  async function loadEvent(eventId: string, page = 0) {
    const timeZone = browserTimeZone(dashboard?.timeZone ?? "Europe/Madrid");
    return getEventDashboard(eventId, timeZone, [], page);
  }

  async function handleEventChange(eventId: string) {
    setSelectedEventId(eventId);
    setSelectedBeerTypeId("");
    setToast(null);
    router.replace(`/home?eventId=${encodeURIComponent(eventId)}`, {
      scroll: false,
    });
    setIsLoadingEvent(true);
    try {
      applyDashboard(await loadEvent(eventId));
    } catch (error) {
      setDashboard(null);
      setToast({ kind: "error", message: messageFromError(error) });
    } finally {
      setIsLoadingEvent(false);
    }
  }

  async function handleAddBeer() {
    if (
      addInFlight.current ||
      !selectedEventId ||
      !dashboard ||
      statusAt(dashboard.event, Date.now()) !== "ACTIVE"
    ) {
      return;
    }

    addInFlight.current = true;
    setIsAdding(true);
    setToast(null);

    try {
      await addEventBeer(selectedEventId, selectedBeerTypeId);
      applyDashboard(await loadEvent(selectedEventId));
      setToast({
        kind: "success",
        message: "Bebida registrada en este evento. ¡Salud!",
      });
    } catch (error) {
      setToast({ kind: "error", message: messageFromError(error) });
    } finally {
      addInFlight.current = false;
      setIsAdding(false);
    }
  }

  async function handlePageChange(page: number) {
    if (!selectedEventId) {
      return;
    }
    setIsLoadingLogs(true);
    try {
      applyDashboard(await loadEvent(selectedEventId, page));
    } catch (error) {
      setToast({ kind: "error", message: messageFromError(error) });
    } finally {
      setIsLoadingLogs(false);
    }
  }

  function handleBeerTypeCreated(beerType: BeerTypeDto) {
    setBeerTypes((current) =>
      [...current, beerType].sort((first, second) =>
        first.name.localeCompare(second.name, "es", { sensitivity: "base" }),
      ),
    );
    setSelectedBeerTypeId(beerType.id);
    setToast({
      kind: "success",
      message: `${beerType.name} se ha añadido al catálogo compartido`,
    });
  }

  function handleBeerTypeDeleted(beerTypeId: string) {
    setBeerTypes((current) =>
      current.filter((beerType) => beerType.id !== beerTypeId),
    );
    setSelectedBeerTypeId((current) =>
      current === beerTypeId ? "" : current,
    );
    setToast({ kind: "success", message: "Tipo de bebida eliminado" });
    void refreshDashboard();
  }

  async function refreshDashboard() {
    const [nextUser, nextBeerTypes, nextDashboard] = await Promise.all([
      getCurrentUser(),
      getBeerTypes(),
      selectedEventId ? loadEvent(selectedEventId) : Promise.resolve(null),
    ]);
    setUser(nextUser);
    setBeerTypes(nextBeerTypes);
    setDashboard(nextDashboard);
    if (nextDashboard) {
      setEvents((current) =>
        current.map((event) =>
          event.id === nextDashboard.event.id ? nextDashboard.event : event,
        ),
      );
    }
  }

  const currentEntry = dashboard?.ranking.find(
    (entry) => entry.userId === user.id,
  );
  const eventUser = {
    ...user,
    beerCount: currentEntry?.beerCount ?? 0,
  };
  const visibleEvents =
    statusClock === null
      ? events
      : events.map((event) => ({
          ...event,
          status: statusAt(event, statusClock),
        }));
  const selectedEventStatus = dashboard
    ? statusClock === null
      ? dashboard.event.status
      : statusAt(dashboard.event, statusClock)
    : null;

  return (
    <div className="min-h-dvh dashboard-background">
      <AppHeader
        activePage="counter"
        eventId={selectedEventId || undefined}
        onManageBeerTypes={() => setIsBeerTypesOpen(true)}
        onOpenAdmin={
          user.role === "ADMIN" ? () => setIsAdminOpen(true) : undefined
        }
        username={user.username}
      />

      <main className="mx-auto max-w-7xl space-y-5 px-5 py-6 sm:px-8 sm:py-8">
        <EventSelector
          events={visibleEvents}
          onChange={(eventId) => void handleEventChange(eventId)}
          selectedEventId={selectedEventId}
        />

        {isLoadingEvent ? (
          <Card
            aria-live="polite"
            className="grid min-h-80 place-items-center p-6"
            role="status"
          >
            <span className="flex items-center gap-3 font-bold text-muted-foreground">
              <LoaderCircle
                aria-hidden="true"
                className="size-5 animate-spin"
              />
              Cargando el evento…
            </span>
          </Card>
        ) : dashboard ? (
          <>
            <BeerCounter
              beerTypes={beerTypes}
              eventName={dashboard.event.name}
              eventStatus={selectedEventStatus ?? dashboard.event.status}
              isAdding={isAdding}
              onAddBeer={() => void handleAddBeer()}
              onBeerTypeChange={setSelectedBeerTypeId}
              onManageBeerTypes={() => setIsBeerTypesOpen(true)}
              position={currentEntry?.position}
              selectedBeerTypeId={selectedBeerTypeId}
              user={eventUser}
            />

            <div className="grid items-start gap-5 lg:grid-cols-2">
              <Ranking
                currentUserId={user.id}
                description="Solo incluye las consumiciones de esta quedada."
                entries={dashboard.ranking}
                title="Ranking del evento"
              />
              <ActivityFeed
                isLoading={isLoadingLogs}
                logs={dashboard.recentLogs}
                onPageChange={(page) => void handlePageChange(page)}
              />
            </div>
          </>
        ) : (
          <Card className="grid min-h-80 place-items-center border-dashed p-6 text-center">
            <div className="max-w-md">
              <CalendarPlus
                aria-hidden="true"
                className="mx-auto size-10 text-primary"
              />
              <h1 className="mt-4 font-display text-2xl font-black">
                Necesitas un evento para empezar
              </h1>
              <p className="mt-2 leading-6 text-muted-foreground">
                Crea una quedada o únete con un código. Todas las nuevas
                consumiciones quedarán ligadas al evento que elijas.
              </p>
              <Link
                className={cn(buttonVariants(), "mt-5")}
                href="/events"
              >
                Gestionar eventos
              </Link>
            </div>
          </Card>
        )}
      </main>

      <footer className="mx-auto max-w-7xl px-5 pb-8 pt-3 text-center text-xs text-muted-foreground sm:px-8">
        Cada evento tiene su propio ritmo. Disfruta con responsabilidad.
      </footer>

      <BeerTypesDialog
        beerTypes={beerTypes}
        canDelete={user.role === "ADMIN"}
        isOpen={isBeerTypesOpen}
        onClose={() => setIsBeerTypesOpen(false)}
        onCreated={handleBeerTypeCreated}
        onDeleted={handleBeerTypeDeleted}
      />

      <AdminPanelDialog
        beerTypes={beerTypes}
        isOpen={isAdminOpen}
        onChanged={refreshDashboard}
        onClose={() => setIsAdminOpen(false)}
      />

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
            <CheckCircle2
              aria-hidden="true"
              className="size-5 shrink-0"
            />
          ) : (
            <AlertTriangle
              aria-hidden="true"
              className="size-5 shrink-0"
            />
          )}
          {toast.message}
        </div>
      ) : null}
    </div>
  );
}
