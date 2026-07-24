"use client";

import {
  Activity,
  Beer,
  CalendarPlus,
  Crown,
  Filter,
  Gauge,
  LoaderCircle,
  Scale,
  Sparkles,
  UsersRound,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { CumulativeRaceChart } from "@/components/competition/cumulative-race-chart";
import { EventBreakdowns } from "@/components/competition/event-breakdowns";
import { Ranking } from "@/components/dashboard/ranking";
import { EventSelector } from "@/components/events/event-selector";
import { AppHeader } from "@/components/layout/app-header";
import { Alert } from "@/components/ui/alert";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ApiClientError, getEventDashboard } from "@/lib/http/api-client";
import type {
  BeerTypeDto,
  EventDashboardDto,
  EventSummaryDto,
} from "@/lib/types/api";
import { cn } from "@/lib/utils";

interface CompetitionDashboardProps {
  beerTypes: BeerTypeDto[];
  currentUserId: string;
  events: EventSummaryDto[];
  initialDashboard: EventDashboardDto | null;
  username: string;
}

interface MetricProps {
  detail: string;
  icon: LucideIcon;
  label: string;
  value: string | number;
}

function Metric({ detail, icon: Icon, label, value }: MetricProps) {
  return (
    <Card className="min-w-0 p-4 sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-bold leading-5 text-muted-foreground sm:text-sm">
            {label}
          </p>
          <p className="mt-1.5 break-words font-display text-2xl font-black tracking-tight tabular-nums sm:text-3xl">
            {value}
          </p>
        </div>
        <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-accent/35 text-primary">
          <Icon aria-hidden="true" className="size-5" />
        </span>
      </div>
      <p className="mt-2 text-xs font-medium leading-5 text-muted-foreground">
        {detail}
      </p>
    </Card>
  );
}

function initials(username: string): string {
  return username.slice(0, 2).toUpperCase();
}

function messageFromError(error: unknown): string {
  return error instanceof ApiClientError
    ? error.message
    : "No se ha podido cargar el análisis del evento";
}

function browserTimeZone(fallback: string): string {
  return Intl.DateTimeFormat().resolvedOptions().timeZone || fallback;
}

export function CompetitionDashboard({
  beerTypes,
  currentUserId,
  events,
  initialDashboard,
  username,
}: CompetitionDashboardProps) {
  const router = useRouter();
  const [dashboard, setDashboard] = useState(initialDashboard);
  const [selectedEventId, setSelectedEventId] = useState(
    initialDashboard?.event.id ?? "",
  );
  const [selectedBeerTypeIds, setSelectedBeerTypeIds] = useState<string[]>(
    initialDashboard?.selectedBeerTypeIds ?? [],
  );
  const [visibleUserIds, setVisibleUserIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  async function loadDashboard(eventId: string, beerTypeIds: string[]) {
    const timeZone = browserTimeZone(dashboard?.timeZone ?? "Europe/Madrid");
    return getEventDashboard(eventId, timeZone, beerTypeIds);
  }

  async function handleEventChange(eventId: string) {
    setSelectedEventId(eventId);
    setSelectedBeerTypeIds([]);
    setVisibleUserIds([]);
    setErrorMessage("");
    router.replace(`/competition?eventId=${encodeURIComponent(eventId)}`, {
      scroll: false,
    });
    setIsLoading(true);
    try {
      setDashboard(await loadDashboard(eventId, []));
    } catch (error) {
      setDashboard(null);
      setErrorMessage(messageFromError(error));
    } finally {
      setIsLoading(false);
    }
  }

  async function applyBeerTypeFilter(nextIds: string[]) {
    if (
      !selectedEventId ||
      (nextIds.length === selectedBeerTypeIds.length &&
        nextIds.every((id) => selectedBeerTypeIds.includes(id)))
    ) {
      return;
    }
    const previousIds = selectedBeerTypeIds;
    setSelectedBeerTypeIds(nextIds);
    setErrorMessage("");
    setIsLoading(true);
    try {
      const nextDashboard = await loadDashboard(selectedEventId, nextIds);
      setDashboard(nextDashboard);
      setSelectedBeerTypeIds(nextDashboard.selectedBeerTypeIds);
    } catch (error) {
      setSelectedBeerTypeIds(previousIds);
      setErrorMessage(messageFromError(error));
    } finally {
      setIsLoading(false);
    }
  }

  function toggleBeerType(beerTypeId: string) {
    const nextIds = selectedBeerTypeIds.includes(beerTypeId)
      ? selectedBeerTypeIds.filter((id) => id !== beerTypeId)
      : [...selectedBeerTypeIds, beerTypeId];
    void applyBeerTypeFilter(nextIds);
  }

  function toggleUser(userId: string) {
    setVisibleUserIds((current) => {
      if (current.length === 0) {
        return [userId];
      }
      const next = current.includes(userId)
        ? current.filter((id) => id !== userId)
        : [...current, userId];
      return next;
    });
  }

  const leader =
    dashboard?.ranking[0] && dashboard.ranking[0].beerCount > 0
      ? dashboard.ranking[0]
      : null;
  const runnerUp = dashboard?.ranking[1];
  const difference =
    leader && runnerUp ? leader.beerCount - runnerUp.beerCount : null;
  const topBeverage = dashboard?.beverageTotals[0] ?? null;
  const activeParticipants =
    dashboard?.ranking.filter((entry) => entry.beerCount > 0).length ?? 0;
  const filteredLabel =
    selectedBeerTypeIds.length === 0
      ? "Todas las bebidas"
      : selectedBeerTypeIds
          .map(
            (id) =>
              beerTypes.find((beerType) => beerType.id === id)?.name,
          )
          .filter(Boolean)
          .join(", ");

  return (
    <div className="min-h-dvh dashboard-background">
      <AppHeader
        activePage="event"
        eventId={selectedEventId || undefined}
        username={username}
      />

      <main className="mx-auto max-w-7xl space-y-5 px-5 py-6 sm:px-8 sm:py-8">
        <EventSelector
          events={events}
          onChange={(eventId) => void handleEventChange(eventId)}
          selectedEventId={selectedEventId}
        />

        {errorMessage ? <Alert>{errorMessage}</Alert> : null}

        {isLoading ? (
          <Card
            aria-label="Cargando análisis del evento"
            className="grid min-h-96 place-items-center p-6"
            role="status"
          >
            <span className="flex items-center gap-3 font-bold text-muted-foreground">
              <LoaderCircle
                aria-hidden="true"
                className="size-5 animate-spin"
              />
              Recalculando comparativas…
            </span>
          </Card>
        ) : dashboard ? (
          <>
            <section className="relative isolate overflow-hidden rounded-xl border border-secondary bg-secondary p-6 text-secondary-foreground shadow-card sm:p-8">
              <div className="absolute -right-20 -top-24 -z-10 size-72 rounded-full bg-accent/10" />
              <div className="absolute -bottom-32 right-1/3 -z-10 size-60 rounded-full border border-white/10" />
              <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
                <div className="max-w-3xl">
                  <span className="inline-flex min-h-8 items-center gap-2 rounded-full bg-white/10 px-3 text-sm font-bold text-accent">
                    <Sparkles aria-hidden="true" className="size-4" />
                    Análisis exclusivo del evento
                  </span>
                  <h1 className="mt-4 break-words font-display text-3xl font-black tracking-tight sm:text-4xl">
                    La carrera de {dashboard.event.name}
                  </h1>
                  <p className="mt-3 max-w-2xl leading-7 text-white/70">
                    Compara ritmos, participantes y bebidas sin mezclar esta
                    quedada con ninguna otra.
                  </p>
                </div>
                <Link
                  className={cn(
                    buttonVariants(),
                    "shrink-0 bg-accent text-accent-foreground hover:bg-accent/90",
                  )}
                  href={`/home?eventId=${dashboard.event.id}`}
                >
                  <Gauge aria-hidden="true" className="size-4" />
                  Ir al contador
                </Link>
              </div>
            </section>

            <Card>
              <CardHeader className="flex-row items-start justify-between gap-4 space-y-0">
                <div>
                  <CardTitle>Filtros de comparación</CardTitle>
                  <CardDescription>
                    Las bebidas recalculan todos los datos; los participantes
                    controlan las líneas visibles.
                  </CardDescription>
                </div>
                <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-muted text-primary">
                  <Filter aria-hidden="true" className="size-5" />
                </span>
              </CardHeader>
              <CardContent className="space-y-5">
                <fieldset>
                  <legend className="text-sm font-bold">Bebidas</legend>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <Button
                      aria-pressed={selectedBeerTypeIds.length === 0}
                      className={cn(
                        selectedBeerTypeIds.length === 0 &&
                          "border-primary bg-primary/10 text-primary",
                      )}
                      disabled={isLoading}
                      onClick={() => void applyBeerTypeFilter([])}
                      size="sm"
                      variant="outline"
                    >
                      Todas
                    </Button>
                    {beerTypes.map((beerType) => {
                      const isSelected = selectedBeerTypeIds.includes(
                        beerType.id,
                      );
                      return (
                        <Button
                          aria-pressed={isSelected}
                          className={cn(
                            isSelected &&
                              "border-primary bg-primary/10 text-primary",
                          )}
                          disabled={isLoading}
                          key={beerType.id}
                          onClick={() => toggleBeerType(beerType.id)}
                          size="sm"
                          variant="outline"
                        >
                          {beerType.name}
                        </Button>
                      );
                    })}
                  </div>
                </fieldset>

                <fieldset>
                  <legend className="text-sm font-bold">Participantes</legend>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <Button
                      aria-pressed={visibleUserIds.length === 0}
                      className={cn(
                        visibleUserIds.length === 0 &&
                          "border-secondary bg-secondary text-secondary-foreground",
                      )}
                      onClick={() => setVisibleUserIds([])}
                      size="sm"
                      variant="outline"
                    >
                      Todos
                    </Button>
                    {dashboard.timeline.series.map((series) => {
                      const isSelected =
                        visibleUserIds.length === 0 ||
                        visibleUserIds.includes(series.userId);
                      return (
                        <Button
                          aria-pressed={isSelected}
                          className={cn(
                            visibleUserIds.length > 0 &&
                              isSelected &&
                              "border-secondary bg-secondary text-secondary-foreground",
                          )}
                          key={series.userId}
                          onClick={() => toggleUser(series.userId)}
                          size="sm"
                          variant="outline"
                        >
                          <span
                            aria-hidden="true"
                            className="grid size-6 place-items-center rounded-full bg-accent/45 text-[10px] font-black text-foreground"
                          >
                            {initials(series.label)}
                          </span>
                          {series.label}
                        </Button>
                      );
                    })}
                  </div>
                </fieldset>
              </CardContent>
            </Card>

            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-5">
              <Metric
                detail={filteredLabel}
                icon={Beer}
                label="Consumiciones"
                value={dashboard.filteredTotal}
              />
              <Metric
                detail={
                  leader
                    ? `${leader.beerCount} en este filtro`
                    : "Aún sin líder"
                }
                icon={Crown}
                label="En cabeza"
                value={leader?.username ?? "—"}
              />
              <Metric
                detail={`${activeParticipants} de ${dashboard.event.memberCount} con actividad`}
                icon={UsersRound}
                label="Participación"
                value={activeParticipants}
              />
              <Metric
                detail={
                  difference === null
                    ? "Hace falta más actividad"
                    : `${difference} de diferencia entre los dos primeros`
                }
                icon={difference === 0 ? Scale : Activity}
                label="Tensión"
                value={
                  difference === null
                    ? "—"
                    : difference === 0
                      ? "Empate"
                      : `${difference}`
                }
              />
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Carrera acumulada</CardTitle>
                <CardDescription>
                  Cada línea suma las consumiciones a medida que avanza el
                  evento. {topBeverage
                    ? `La bebida más presente es ${topBeverage.name}.`
                    : "Todavía no hay una bebida dominante."}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <CumulativeRaceChart
                  timeline={dashboard.timeline}
                  visibleUserIds={visibleUserIds}
                />
              </CardContent>
            </Card>

            <EventBreakdowns
              beverageTotals={dashboard.beverageTotals}
              hourlyConsumption={dashboard.hourlyConsumption}
              participantBreakdown={dashboard.participantBreakdown}
            />

            <Ranking
              currentUserId={currentUserId}
              description={`Ranking recalculado para: ${filteredLabel}.`}
              entries={dashboard.ranking}
              title="Clasificación del evento"
            />
          </>
        ) : (
          <Card className="grid min-h-96 place-items-center border-dashed p-6 text-center">
            <div className="max-w-md">
              <CalendarPlus
                aria-hidden="true"
                className="mx-auto size-10 text-primary"
              />
              <h1 className="mt-4 font-display text-2xl font-black">
                Elige un evento para analizarlo
              </h1>
              <p className="mt-2 leading-6 text-muted-foreground">
                La comparativa solo cruza a los participantes y bebidas de la
                quedada seleccionada.
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
        Comparad el evento, no la resistencia. Disfrutad con responsabilidad.
      </footer>
    </div>
  );
}
