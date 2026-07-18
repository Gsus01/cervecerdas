"use client";

import {
  BarChart3,
  Beer,
  Clock3,
  Layers3,
  RefreshCw,
  Sparkles,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import Image from "next/image";
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
import { ApiClientError, getBeerStatistics } from "@/lib/http/api-client";
import type {
  BeerStatisticsDto,
  StatisticCountDto,
} from "@/lib/types/api";
import { cn } from "@/lib/utils";

interface StatisticsDashboardProps {
  username: string;
}

interface MetricCardProps {
  icon: LucideIcon;
  label: string;
  value: string | number;
  detail: string;
}

function MetricCard({ icon: Icon, label, value, detail }: MetricCardProps) {
  return (
    <Card className="min-w-0 p-4 sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-bold text-muted-foreground">{label}</p>
          <p className="mt-2 break-words font-display text-3xl font-black tracking-tight tabular-nums sm:text-4xl">
            {value}
          </p>
        </div>
        <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-accent/30 text-primary">
          <Icon aria-hidden="true" className="size-5" />
        </span>
      </div>
      <p className="mt-3 text-xs font-medium leading-5 text-muted-foreground">{detail}</p>
    </Card>
  );
}

function HiddenDataTable({
  caption,
  rows,
}: {
  caption: string;
  rows: StatisticCountDto[];
}) {
  return (
    <table className="sr-only">
      <caption>{caption}</caption>
      <thead>
        <tr>
          <th scope="col">Periodo</th>
          <th scope="col">Cervezas</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr key={row.key}>
            <th scope="row">{row.label}</th>
            <td>{row.count}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function StatisticsSkeleton() {
  return (
    <div aria-label="Cargando estadísticas" aria-live="polite" role="status">
      <span className="sr-only">Cargando estadísticas…</span>
      <Skeleton className="h-48 rounded-xl" />
      <div className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-5">
        {Array.from({ length: 4 }, (_, index) => (
          <Skeleton className="h-36" key={index} />
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
    : "No se han podido cargar tus estadísticas";
}

export function StatisticsDashboard({ username }: StatisticsDashboardProps) {
  const [statistics, setStatistics] = useState<BeerStatisticsDto | null>(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  async function loadStatistics() {
    setIsLoading(true);
    setError("");
    try {
      const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
      setStatistics(await getBeerStatistics(timeZone));
    } catch (loadError) {
      setError(messageFromError(loadError));
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    let isActive = true;
    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";

    getBeerStatistics(timeZone)
      .then((result) => {
        if (isActive) {
          setStatistics(result);
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
    return <StatisticsSkeleton />;
  }

  if (error || !statistics) {
    return (
      <Card className="mx-auto max-w-xl">
        <CardHeader>
          <CardTitle>No hemos podido dibujar tus estadísticas</CardTitle>
          <CardDescription>Comprueba tu conexión y vuelve a intentarlo.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>{error || "La respuesta de estadísticas está vacía"}</Alert>
          <Button onClick={() => void loadStatistics()}>
            <RefreshCw aria-hidden="true" className="size-4" />
            Reintentar
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (statistics.totalBeers === 0) {
    return (
      <Card className="overflow-hidden border-secondary bg-secondary text-secondary-foreground">
        <div className="grid min-h-80 place-items-center px-6 py-12 text-center">
          <div className="max-w-md">
            <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-white/10 text-accent">
              <BarChart3 aria-hidden="true" className="size-7" />
            </span>
            <h1 className="mt-5 font-display text-3xl font-black">Tu historia empieza con una</h1>
            <p className="mt-3 text-sm leading-6 text-white/70">
              Cuando registres cervezas, aquí verás tus tipos, días y horas más habituales.
            </p>
            <Link
              className={cn(
                buttonVariants({ size: "lg" }),
                "mt-6 bg-accent text-accent-foreground hover:bg-accent/90",
              )}
              href="/home"
            >
              <Beer aria-hidden="true" className="size-5" />
              Ir al contador
            </Link>
          </div>
        </div>
      </Card>
    );
  }

  const maxRecentDay = Math.max(...statistics.last14Days.map((day) => day.count), 1);
  const maxWeekday = Math.max(...statistics.byWeekday.map((day) => day.count), 1);
  const maxTimeRange = Math.max(...statistics.byTimeRange.map((range) => range.count), 1);
  const topWeekday = [...statistics.byWeekday].sort(
    (first, second) => second.count - first.count,
  )[0];
  const topTimeRange = [...statistics.byTimeRange].sort(
    (first, second) => second.count - first.count,
  )[0];
  const trendIsPositive = (statistics.recentTrendPercentage ?? 0) >= 0;

  return (
    <div className="space-y-5">
      <section className="relative isolate overflow-hidden rounded-xl border border-secondary bg-secondary p-6 text-secondary-foreground shadow-card sm:p-8">
        <div className="absolute -right-20 -top-24 -z-10 size-72 rounded-full bg-accent/10" />
        <div className="absolute -bottom-24 left-1/3 -z-10 size-52 rounded-full border border-white/10" />
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div className="max-w-2xl">
            <p className="text-sm font-bold text-accent">Tu historia en datos</p>
            <h1 className="mt-2 break-words font-display text-3xl font-black tracking-tight sm:text-4xl">
              Así brinda {username}
            </h1>
            <p className="mt-3 text-sm leading-6 text-white/70 sm:text-base">
              Un vistazo a tus hábitos, desde el tipo que más eliges hasta tu momento favorito.
            </p>
          </div>
          <span className="inline-flex min-h-11 w-fit items-center gap-2 rounded-xl border border-white/15 bg-white/10 px-4 text-sm font-bold text-white/80">
            <Clock3 aria-hidden="true" className="size-4 text-accent" />
            {statistics.timeZone.replaceAll("_", " ")}
          </span>
        </div>
      </section>

      <section aria-label="Resumen de estadísticas" className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-5">
        <MetricCard
          detail={`${statistics.activeDays} días con actividad`}
          icon={Beer}
          label="Total registrado"
          value={statistics.totalBeers}
        />
        <MetricCard
          detail={
            statistics.recentTrendPercentage === null
              ? "Sin periodo anterior comparable"
              : `${trendIsPositive ? "+" : ""}${statistics.recentTrendPercentage}% frente a los 7 anteriores`
          }
          icon={trendIsPositive ? TrendingUp : TrendingDown}
          label="Últimos 7 días"
          value={statistics.last7Days}
        />
        <MetricCard
          detail={`${statistics.favoriteType?.percentage ?? 0}% de tus registros`}
          icon={Layers3}
          label="Tipo favorito"
          value={statistics.favoriteType?.label ?? "—"}
        />
        <MetricCard
          detail={`${statistics.favoriteHour?.count ?? 0} registradas en esa hora`}
          icon={Clock3}
          label="Hora favorita"
          value={statistics.favoriteHour?.label ?? "—"}
        />
      </section>

      <div className="grid items-start gap-5 xl:grid-cols-3">
        <Card className="xl:col-span-2" aria-labelledby="recent-activity-title">
          <CardHeader>
            <CardTitle id="recent-activity-title">Tu ritmo reciente</CardTitle>
            <CardDescription>Cervezas registradas cada día durante las últimas dos semanas.</CardDescription>
          </CardHeader>
          <CardContent>
            <figure aria-label="Actividad diaria de los últimos 14 días">
              <div className="flex h-52 items-end gap-1.5 border-b border-border pt-6 sm:gap-2.5">
                {statistics.last14Days.map((day) => (
                  <div
                    aria-label={`${day.label}: ${day.count} ${day.count === 1 ? "cerveza" : "cervezas"}`}
                    className="flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-1"
                    key={day.key}
                  >
                    <span className="text-[10px] font-bold tabular-nums text-muted-foreground sm:text-xs">
                      {day.count || ""}
                    </span>
                    <span
                      aria-hidden="true"
                      className="w-full max-w-8 rounded-t-md bg-primary/85 transition-[opacity] duration-200 hover:bg-primary"
                      style={{
                        height: `${day.count === 0 ? 3 : Math.max((day.count / maxRecentDay) * 100, 10)}%`,
                      }}
                    />
                    <span className="w-full truncate text-center text-[9px] font-bold text-muted-foreground sm:text-[11px]">
                      <span className="sm:hidden">{day.key.slice(-2)}</span>
                      <span className="hidden sm:inline">{day.label}</span>
                    </span>
                  </div>
                ))}
              </div>
              <HiddenDataTable
                caption="Actividad diaria de los últimos 14 días"
                rows={statistics.last14Days}
              />
            </figure>
          </CardContent>
        </Card>

        <Card className="overflow-hidden border-primary/20 bg-primary text-primary-foreground" aria-labelledby="insight-title">
          <CardHeader>
            <span className="grid size-11 place-items-center rounded-xl bg-white/15">
              <Sparkles aria-hidden="true" className="size-5" />
            </span>
            <CardTitle className="pt-3 text-white" id="insight-title">Tu patrón cervecero</CardTitle>
            <CardDescription className="text-white/75">
              Lo más característico de tu historial hasta ahora.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-lg font-bold leading-7">
              Tu momento más habitual es la {topTimeRange?.label.toLowerCase()}, especialmente los {topWeekday?.label.toLowerCase()}.
            </p>
            <dl className="grid grid-cols-2 gap-3 border-t border-white/15 pt-4">
              <div>
                <dt className="text-xs font-bold text-white/65">Variedad</dt>
                <dd className="mt-1 text-2xl font-black tabular-nums">{statistics.varietyCount}</dd>
              </div>
              <div>
                <dt className="text-xs font-bold text-white/65">Media por día activo</dt>
                <dd className="mt-1 text-2xl font-black tabular-nums">{statistics.averagePerActiveDay}</dd>
              </div>
            </dl>
          </CardContent>
        </Card>
      </div>

      <div className="grid items-start gap-5 lg:grid-cols-2">
        <Card aria-labelledby="type-distribution-title">
          <CardHeader>
            <CardTitle id="type-distribution-title">Tipos que eliges</CardTitle>
            <CardDescription>Distribución de todo tu historial por tipo de cerveza.</CardDescription>
          </CardHeader>
          <CardContent>
            <ol className="space-y-4">
              {statistics.byType.map((type) => (
                <li className="space-y-2" key={type.key}>
                  <div className="flex items-center gap-3">
                    {type.photoDataUrl ? (
                      <span className="relative size-10 shrink-0 overflow-hidden rounded-lg bg-muted">
                        <Image alt="" className="object-cover" fill sizes="40px" src={type.photoDataUrl} unoptimized />
                      </span>
                    ) : (
                      <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-muted text-muted-foreground">
                        <Beer aria-hidden="true" className="size-4" />
                      </span>
                    )}
                    <div className="flex min-w-0 flex-1 items-baseline justify-between gap-3">
                      <span className="break-words text-sm font-bold">{type.label}</span>
                      <span className="shrink-0 text-sm font-black tabular-nums">
                        {type.count} <span className="text-xs text-muted-foreground">({type.percentage}%)</span>
                      </span>
                    </div>
                  </div>
                  <div className="ml-[3.25rem] h-2 overflow-hidden rounded-full bg-muted">
                    <div
                      aria-hidden="true"
                      className="h-full rounded-full bg-primary"
                      style={{ width: `${Math.max(type.percentage, 3)}%` }}
                    />
                  </div>
                </li>
              ))}
            </ol>
          </CardContent>
        </Card>

        <Card aria-labelledby="weekly-pattern-title">
          <CardHeader>
            <CardTitle id="weekly-pattern-title">Tu semana de un vistazo</CardTitle>
            <CardDescription>Qué días concentran más registros en tu historial.</CardDescription>
          </CardHeader>
          <CardContent>
            <figure aria-label="Cervezas registradas por día de la semana">
              <div className="flex h-48 items-end gap-2 border-b border-border pt-5 sm:gap-4">
                {statistics.byWeekday.map((day) => (
                  <div
                    aria-label={`${day.label}: ${day.count} ${day.count === 1 ? "cerveza" : "cervezas"}`}
                    className="flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-1.5"
                    key={day.key}
                  >
                    <span className="text-xs font-black tabular-nums">{day.count}</span>
                    <span
                      aria-hidden="true"
                      className="w-full max-w-10 rounded-t-lg bg-accent"
                      style={{
                        height: `${day.count === 0 ? 3 : Math.max((day.count / maxWeekday) * 100, 10)}%`,
                      }}
                    />
                    <span className="text-[10px] font-bold text-muted-foreground sm:text-xs">
                      {day.label.slice(0, 3)}
                    </span>
                  </div>
                ))}
              </div>
              <HiddenDataTable
                caption="Cervezas registradas por día de la semana"
                rows={statistics.byWeekday}
              />
            </figure>
          </CardContent>
        </Card>
      </div>

      <Card aria-labelledby="time-pattern-title">
        <CardHeader>
          <CardTitle id="time-pattern-title">Cuándo brindas</CardTitle>
          <CardDescription>Distribución por franja horaria según tu zona local.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {statistics.byTimeRange.map((range) => (
              <div className="rounded-xl border border-border bg-muted/35 p-4" key={range.key}>
                <div className="flex items-baseline justify-between gap-3">
                  <p className="text-sm font-bold">{range.label}</p>
                  <p className="text-lg font-black tabular-nums">{range.count}</p>
                </div>
                <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted">
                  <div
                    aria-hidden="true"
                    className="h-full rounded-full bg-primary"
                    style={{
                      width: `${range.count === 0 ? 3 : Math.max((range.count / maxTimeRange) * 100, 8)}%`,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
          <HiddenDataTable
            caption="Cervezas registradas por franja horaria"
            rows={statistics.byTimeRange}
          />
        </CardContent>
      </Card>
    </div>
  );
}
