"use client";

import {
  Activity,
  Beer,
  Crown,
  Medal,
  RefreshCw,
  Scale,
  TrendingDown,
  TrendingUp,
  Trophy,
  UsersRound,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

import { Alert } from "@/components/ui/alert";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ApiClientError, getGroupCompetition } from "@/lib/http/api-client";
import type {
  CompetitionUserDto,
  GroupCompetitionDto,
} from "@/lib/types/api";
import { cn } from "@/lib/utils";

interface CompetitionDashboardProps {
  currentUserId: string;
  username: string;
}

interface GroupMetricProps {
  detail: string;
  icon: LucideIcon;
  label: string;
  value: string | number;
}

function GroupMetric({ detail, icon: Icon, label, value }: GroupMetricProps) {
  return (
    <Card className="min-w-0 p-4 sm:p-5">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-xs font-bold leading-5 text-muted-foreground sm:text-sm">{label}</p>
          <p className="mt-1.5 break-words font-display text-2xl font-black tracking-tight tabular-nums sm:text-3xl">
            {value}
          </p>
        </div>
        <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-accent/30 text-primary">
          <Icon aria-hidden="true" className="size-5" />
        </span>
      </div>
      <p className="mt-2 text-xs font-medium leading-5 text-muted-foreground">{detail}</p>
    </Card>
  );
}

function CompetitionSkeleton() {
  return (
    <div aria-label="Cargando competición" aria-live="polite" role="status">
      <span className="sr-only">Cargando competición…</span>
      <Skeleton className="h-48 rounded-xl" />
      <div className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-5">
        {Array.from({ length: 4 }, (_, index) => (
          <Skeleton className="h-32" key={index} />
        ))}
      </div>
      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        <Skeleton className="h-80" />
        <Skeleton className="h-80" />
      </div>
    </div>
  );
}

function messageFromError(error: unknown): string {
  return error instanceof ApiClientError
    ? error.message
    : "No se ha podido cargar la competición del grupo";
}

function initials(username: string): string {
  return username.slice(0, 2).toUpperCase();
}

function trendLabel(user: CompetitionUserDto): string {
  if (user.trendPercentage === null) {
    return user.last7Days > 0 ? "Primera semana con actividad" : "Sin actividad reciente";
  }
  if (user.trendPercentage === 0) {
    return "Igual que la semana anterior";
  }
  return `${user.trendPercentage > 0 ? "+" : ""}${user.trendPercentage}% vs. semana anterior`;
}

function heatClass(count: number, maximum: number): string {
  if (count === 0) {
    return "bg-muted/45 text-muted-foreground";
  }
  const intensity = count / maximum;
  if (intensity <= 0.34) {
    return "bg-accent/30 text-foreground";
  }
  if (intensity <= 0.67) {
    return "bg-accent/70 text-accent-foreground";
  }
  return "bg-primary text-primary-foreground";
}

export function CompetitionDashboard({
  currentUserId,
  username,
}: CompetitionDashboardProps) {
  const [competition, setCompetition] = useState<GroupCompetitionDto | null>(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  async function loadCompetition() {
    setIsLoading(true);
    setError("");
    try {
      const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
      setCompetition(await getGroupCompetition(timeZone));
    } catch (loadError) {
      setError(messageFromError(loadError));
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    let isActive = true;
    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";

    getGroupCompetition(timeZone)
      .then((result) => {
        if (isActive) {
          setCompetition(result);
        }
      })
      .catch((loadError: unknown) => {
        if (isActive) {
          setError(messageFromError(loadError));
        }
      })
      .finally(() => {
        if (isActive) {
          setIsLoading(false);
        }
      });

    return () => {
      isActive = false;
    };
  }, []);

  if (isLoading) {
    return <CompetitionSkeleton />;
  }

  if (error || !competition) {
    return (
      <Card className="mx-auto max-w-xl">
        <CardHeader>
          <CardTitle>La pandilla no aparece ahora mismo</CardTitle>
          <CardDescription>Comprueba tu conexión y vuelve a intentarlo.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>{error || "La respuesta de competición está vacía"}</Alert>
          <Button onClick={() => void loadCompetition()}>
            <RefreshCw aria-hidden="true" className="size-4" />
            Reintentar
          </Button>
        </CardContent>
      </Card>
    );
  }

  const maxWeekly = Math.max(...competition.users.map((user) => user.last7Days), 1);
  const maxDaily = Math.max(
    ...competition.users.flatMap((user) => user.dailyLast7.map((day) => day.count)),
    1,
  );
  const maxGroupDay = Math.max(...competition.dailyTotals.map((day) => day.count), 1);
  const podium = competition.users.slice(0, 3);
  const mostActiveDays = [...competition.users].sort(
    (first, second) =>
      second.dailyLast7.filter((day) => day.count > 0).length -
      first.dailyLast7.filter((day) => day.count > 0).length,
  )[0];

  return (
    <div className="space-y-5">
      <section className="relative isolate overflow-hidden rounded-xl border border-secondary bg-secondary p-6 text-secondary-foreground shadow-card sm:p-8">
        <div className="absolute -right-16 -top-20 -z-10 size-64 rounded-full bg-accent/10" />
        <div className="absolute -bottom-28 left-1/3 -z-10 size-56 rounded-full border border-white/10" />
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div className="max-w-2xl">
            <p className="text-sm font-bold text-accent">La semana de la pandilla</p>
            <h1 className="mt-2 break-words font-display text-3xl font-black tracking-tight sm:text-4xl">
              La liga de {username} y compañía
            </h1>
            <p className="mt-3 text-sm leading-6 text-white/70 sm:text-base">
              Comparad vuestro historial de los últimos 7 días, sin objetivos de consumo ni premios por beber más.
            </p>
          </div>
          <span className="inline-flex min-h-11 w-fit items-center gap-2 rounded-xl border border-white/15 bg-white/10 px-4 text-sm font-bold text-white/80">
            <UsersRound aria-hidden="true" className="size-4 text-accent" />
            {competition.users.length} {competition.users.length === 1 ? "persona" : "personas"}
          </span>
        </div>
      </section>

      <section aria-label="Resumen del grupo" className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-5">
        <GroupMetric
          detail={`${competition.totalBeers} en todo el historial`}
          icon={Beer}
          label="Esta semana"
          value={competition.last7Days}
        />
        <GroupMetric
          detail={competition.leader ? `${competition.leader.last7Days} esta semana` : "Semana sin registros"}
          icon={Crown}
          label="En cabeza"
          value={competition.leader?.username ?? "—"}
        />
        <GroupMetric
          detail={`de ${competition.users.length} personas registradas`}
          icon={Activity}
          label="Con actividad"
          value={competition.activeUsers}
        />
        <GroupMetric
          detail={
            competition.closestBattle
              ? `${competition.closestBattle.firstUsername} y ${competition.closestBattle.secondUsername}`
              : "Hacen falta dos personas activas"
          }
          icon={Scale}
          label="Duelo más ajustado"
          value={
            competition.closestBattle
              ? competition.closestBattle.difference === 0
                ? "Empate"
                : `${competition.closestBattle.difference} ${competition.closestBattle.difference === 1 ? "cerveza" : "cervezas"}`
              : "—"
          }
        />
      </section>

      {competition.last7Days === 0 ? (
        <Card className="overflow-hidden">
          <div className="grid min-h-72 place-items-center px-6 py-10 text-center">
            <div className="max-w-md">
              <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-accent/30 text-primary">
                <UsersRound aria-hidden="true" className="size-7" />
              </span>
              <h2 className="mt-5 font-display text-2xl font-black">Esta semana está en blanco</h2>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">
                Cuando alguien registre una cerveza, aparecerán el podio y las comparaciones del grupo.
              </p>
              <Link className={cn(buttonVariants(), "mt-6")} href="/home">
                Ir al contador
              </Link>
            </div>
          </div>
        </Card>
      ) : (
        <>
          <Card aria-labelledby="podium-title">
            <CardHeader>
              <CardTitle id="podium-title">Podio semanal</CardTitle>
              <CardDescription>Los tres primeros según los registros de los últimos 7 días.</CardDescription>
            </CardHeader>
            <CardContent>
              <ol className={cn("grid gap-3", podium.length > 1 && "sm:grid-cols-3")}>
                {podium.map((user) => (
                  <li
                    className={cn(
                      "relative overflow-hidden rounded-xl border p-4",
                      user.position === 1
                        ? "border-accent bg-accent/20"
                        : "border-border bg-muted/35",
                      user.userId === currentUserId && "ring-2 ring-primary/25",
                    )}
                    key={user.userId}
                  >
                    <div className="flex items-center gap-3">
                      <span className={cn(
                        "grid size-11 shrink-0 place-items-center rounded-full font-display text-sm font-black",
                        user.position === 1
                          ? "bg-primary text-primary-foreground"
                          : "bg-secondary text-secondary-foreground",
                      )}>
                        {initials(user.username)}
                      </span>
                      <div className="min-w-0">
                        <p className="truncate font-bold">
                          {user.username}{user.userId === currentUserId ? " · Tú" : ""}
                        </p>
                        <p className="text-xs text-muted-foreground">Puesto {user.position}</p>
                      </div>
                    </div>
                    <div className="mt-4 flex items-end justify-between gap-3 border-t border-border/70 pt-3">
                      <p className="font-display text-3xl font-black tabular-nums">{user.last7Days}</p>
                      {user.position === 1 ? (
                        <Trophy aria-hidden="true" className="size-6 text-primary" />
                      ) : (
                        <Medal aria-hidden="true" className="size-6 text-muted-foreground" />
                      )}
                    </div>
                  </li>
                ))}
              </ol>
            </CardContent>
          </Card>

          <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1.25fr)_minmax(0,0.75fr)]">
            <Card aria-labelledby="weekly-ranking-title">
              <CardHeader>
                <CardTitle id="weekly-ranking-title">Clasificación completa</CardTitle>
                <CardDescription>Todo el grupo, ordenado por esta semana y con el total como desempate.</CardDescription>
              </CardHeader>
              <CardContent>
                <ol className="space-y-3">
                  {competition.users.map((user) => {
                    const isPositive = (user.trendPercentage ?? 0) > 0;
                    return (
                      <li
                        className={cn(
                          "rounded-xl border p-3 sm:p-4",
                          user.userId === currentUserId
                            ? "border-primary/35 bg-primary/5"
                            : "border-border",
                        )}
                        key={user.userId}
                      >
                        <div className="flex items-center gap-3">
                          <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-secondary font-display text-sm font-black text-secondary-foreground">
                            {user.position}
                          </span>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-baseline justify-between gap-3">
                              <p className="truncate text-sm font-bold">
                                {user.username}{user.userId === currentUserId ? " · Tú" : ""}
                              </p>
                              <p className="shrink-0 text-sm font-black tabular-nums">
                                {user.last7Days}{" "}
                                <span className="text-xs text-muted-foreground">
                                  sem · {user.totalBeers} total
                                </span>
                              </p>
                            </div>
                            <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted">
                              <div
                                aria-hidden="true"
                                className="h-full rounded-full bg-primary"
                                style={{
                                  width: `${user.last7Days === 0 ? 2 : Math.max((user.last7Days / maxWeekly) * 100, 6)}%`,
                                }}
                              />
                            </div>
                            <p className="mt-2 flex items-center gap-1 text-xs font-medium text-muted-foreground">
                              {isPositive ? (
                                <TrendingUp aria-hidden="true" className="size-3.5 text-primary" />
                              ) : user.trendPercentage !== null && user.trendPercentage < 0 ? (
                                <TrendingDown aria-hidden="true" className="size-3.5" />
                              ) : null}
                              {trendLabel(user)}
                            </p>
                          </div>
                        </div>
                      </li>
                    );
                  })}
                </ol>
              </CardContent>
            </Card>

            <Card className="overflow-hidden border-primary/20 bg-primary text-primary-foreground" aria-labelledby="group-insight-title">
              <CardHeader>
                <span className="grid size-11 place-items-center rounded-xl bg-white/15">
                  <UsersRound aria-hidden="true" className="size-5" />
                </span>
                <CardTitle className="pt-3 text-white" id="group-insight-title">El pulso del grupo</CardTitle>
                <CardDescription className="text-white/75">Una lectura rápida de esta semana.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                <p className="break-words text-lg font-bold leading-7">
                  {competition.leader?.username} va en cabeza y {mostActiveDays?.username} ha registrado en más días distintos.
                </p>
                {competition.closestBattle ? (
                  <div className="rounded-xl border border-white/15 bg-white/10 p-4">
                    <p className="text-xs font-bold text-white/65">Foto finish</p>
                    <div className="mt-2 flex items-center justify-between gap-3">
                      <span className="min-w-0 truncate font-bold">{competition.closestBattle.firstUsername}</span>
                      <span className="shrink-0 font-black tabular-nums">{competition.closestBattle.firstCount}</span>
                    </div>
                    <div className="mt-2 flex items-center justify-between gap-3">
                      <span className="min-w-0 truncate font-bold">{competition.closestBattle.secondUsername}</span>
                      <span className="shrink-0 font-black tabular-nums">{competition.closestBattle.secondCount}</span>
                    </div>
                    <p className="mt-3 border-t border-white/15 pt-3 text-xs font-bold text-white/70">
                      {competition.closestBattle.difference === 0
                        ? "Están empatados"
                        : `Solo ${competition.closestBattle.difference} ${competition.closestBattle.difference === 1 ? "cerveza" : "cervezas"} de diferencia`}
                    </p>
                  </div>
                ) : null}
              </CardContent>
            </Card>
          </div>

          <Card aria-labelledby="heatmap-title">
            <CardHeader>
              <CardTitle id="heatmap-title">Mapa de rondas</CardTitle>
              <CardDescription>Cada número indica cuántas cervezas registró esa persona en el día.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="w-full">
                <table className="w-full table-fixed border-separate border-spacing-1" aria-describedby="heatmap-legend">
                  <thead>
                    <tr>
                      <th className="w-20 pb-1 text-left text-[10px] font-bold text-muted-foreground sm:w-32 sm:text-xs" scope="col">
                        Persona
                      </th>
                      {competition.dailyTotals.map((day) => (
                        <th className="pb-1 text-center text-[9px] font-bold leading-3 text-muted-foreground sm:text-xs" key={day.key} scope="col">
                          <span className="block">{day.label.slice(0, 2)}</span>
                          <span className="block tabular-nums">{day.key.slice(-2)}</span>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {competition.users.map((user) => (
                      <tr key={user.userId}>
                        <th className="truncate py-0.5 pr-1 text-left text-[10px] font-bold sm:text-xs" scope="row" title={user.username}>
                          {user.username}{user.userId === currentUserId ? " · Tú" : ""}
                        </th>
                        {user.dailyLast7.map((day) => (
                          <td className="p-0.5 text-center" key={day.key}>
                            <span
                              aria-label={`${user.username}, ${day.label}: ${day.count}`}
                              className={cn(
                                "grid aspect-square min-h-7 w-full place-items-center rounded-md text-[10px] font-black tabular-nums sm:min-h-9 sm:text-xs",
                                heatClass(day.count, maxDaily),
                              )}
                            >
                              {day.count}
                            </span>
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="mt-4 flex flex-wrap items-center gap-3 text-xs font-medium text-muted-foreground" id="heatmap-legend">
                <span>Intensidad:</span>
                <span className="inline-flex items-center gap-1.5"><span aria-hidden="true" className="inline-block size-3 rounded bg-muted" />0</span>
                <span className="inline-flex items-center gap-1.5"><span aria-hidden="true" className="inline-block size-3 rounded bg-accent/30" />Baja</span>
                <span className="inline-flex items-center gap-1.5"><span aria-hidden="true" className="inline-block size-3 rounded bg-accent/70" />Media</span>
                <span className="inline-flex items-center gap-1.5"><span aria-hidden="true" className="inline-block size-3 rounded bg-primary" />Alta</span>
              </div>
            </CardContent>
          </Card>

          <Card aria-labelledby="group-rhythm-title">
            <CardHeader>
              <CardTitle id="group-rhythm-title">Ritmo diario del grupo</CardTitle>
              <CardDescription>El total combinado de la pandilla durante esta semana.</CardDescription>
            </CardHeader>
            <CardContent>
              <figure aria-label="Total diario del grupo durante los últimos 7 días">
                <div className="flex h-52 items-end gap-2 border-b border-border pt-6 sm:gap-5">
                  {competition.dailyTotals.map((day) => (
                    <div className="flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-1.5" key={day.key}>
                      <span className="text-xs font-black tabular-nums">{day.count}</span>
                      <span
                        aria-hidden="true"
                        className="w-full max-w-14 rounded-t-lg bg-accent"
                        style={{
                          height: `${day.count === 0 ? 3 : Math.max((day.count / maxGroupDay) * 100, 10)}%`,
                        }}
                      />
                      <span className="text-[10px] font-bold text-muted-foreground sm:text-xs">{day.label}</span>
                    </div>
                  ))}
                </div>
                <table className="sr-only">
                  <caption>Total diario del grupo durante los últimos 7 días</caption>
                  <tbody>
                    {competition.dailyTotals.map((day) => (
                      <tr key={day.key}><th scope="row">{day.label}</th><td>{day.count}</td></tr>
                    ))}
                  </tbody>
                </table>
              </figure>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
