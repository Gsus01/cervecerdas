import { BarChart3, Beer, Clock3, Grid3X3 } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { EventDashboardDto } from "@/lib/types/api";

type BeverageTotals = EventDashboardDto["beverageTotals"];
type ParticipantBreakdown = EventDashboardDto["participantBreakdown"];

function BeverageBars({ beverages }: { beverages: BeverageTotals }) {
  const maximum = Math.max(1, ...beverages.map((beverage) => beverage.total));

  if (beverages.length === 0) {
    return (
      <div className="grid min-h-56 place-items-center rounded-xl border border-dashed border-border p-5 text-center">
        <div>
          <Beer
            aria-hidden="true"
            className="mx-auto size-8 text-muted-foreground"
          />
          <p className="mt-3 font-bold">Todavía no hay bebidas registradas</p>
        </div>
      </div>
    );
  }

  return (
    <ol className="space-y-4">
      {beverages.map((beverage, index) => (
        <li key={beverage.key}>
          <div className="mb-1.5 flex items-end justify-between gap-3 text-sm">
            <span className="min-w-0 truncate font-bold">
              {index + 1}. {beverage.name}
            </span>
            <span className="shrink-0 font-display font-black tabular-nums">
              {beverage.total}
              <span className="ml-1 font-sans text-xs font-semibold text-muted-foreground">
                · {beverage.percentage}%
              </span>
            </span>
          </div>
          <div className="h-3 overflow-hidden rounded-full bg-muted">
            <div
              aria-hidden="true"
              className="h-full rounded-full bg-primary transition-[width] duration-300"
              style={{ width: `${(beverage.total / maximum) * 100}%` }}
            />
          </div>
        </li>
      ))}
    </ol>
  );
}

function HourlyRhythm({
  hours,
}: {
  hours: EventDashboardDto["hourlyConsumption"];
}) {
  const maximum = Math.max(1, ...hours.map((hour) => hour.count));
  const hasData = hours.some((hour) => hour.count > 0);

  if (!hasData) {
    return (
      <div className="grid min-h-56 place-items-center rounded-xl border border-dashed border-border p-5 text-center">
        <div>
          <Clock3
            aria-hidden="true"
            className="mx-auto size-8 text-muted-foreground"
          />
          <p className="mt-3 font-bold">Sin ritmo horario todavía</p>
        </div>
      </div>
    );
  }

  const width = 720;
  const height = 240;
  const bottom = 196;
  const chartHeight = 150;
  const peak = hours.reduce((current, hour) =>
    hour.count > current.count ? hour : current,
  );

  return (
    <div>
      <p className="mb-3 text-sm text-muted-foreground">
        Pico de actividad:{" "}
        <strong className="text-foreground">
          {peak.label} · {peak.count}
        </strong>
      </p>
      <div className="rounded-xl border border-border bg-muted/20 p-2">
        <svg
          aria-labelledby="hourly-title hourly-description"
          className="h-auto min-h-52 w-full"
          role="img"
          viewBox={`0 0 ${width} ${height}`}
        >
          <title id="hourly-title">Ritmo de consumiciones por hora</title>
          <desc id="hourly-description">
            La franja con más actividad es {peak.label}, con {peak.count}
            consumiciones.
          </desc>
          {[0, 0.5, 1].map((ratio) => (
            <line
              className="stroke-border"
              key={ratio}
              strokeDasharray="4 6"
              x1="30"
              x2="704"
              y1={bottom - chartHeight * ratio}
              y2={bottom - chartHeight * ratio}
            />
          ))}
          {hours.map((hour, index) => {
            const barHeight = (hour.count / maximum) * chartHeight;
            const x = 38 + index * 27.5;
            return (
              <g key={hour.key}>
                <rect
                  className="fill-primary"
                  height={Math.max(hour.count > 0 ? 3 : 0, barHeight)}
                  rx="4"
                  width="18"
                  x={x}
                  y={bottom - barHeight}
                >
                  <title>
                    {hour.label}: {hour.count}
                  </title>
                </rect>
                {index % 3 === 0 ? (
                  <text
                    className="fill-muted-foreground text-[10px] font-semibold"
                    textAnchor="middle"
                    x={x + 9}
                    y="220"
                  >
                    {hour.label.slice(0, 2)}h
                  </text>
                ) : null}
              </g>
            );
          })}
        </svg>
      </div>
      <table className="sr-only">
        <caption>Consumiciones registradas por hora</caption>
        <thead>
          <tr>
            <th scope="col">Hora</th>
            <th scope="col">Consumiciones</th>
          </tr>
        </thead>
        <tbody>
          {hours.map((hour) => (
            <tr key={hour.key}>
              <th scope="row">{hour.label}</th>
              <td>{hour.count}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ParticipantMatrix({
  beverages,
  participants,
}: {
  beverages: BeverageTotals;
  participants: ParticipantBreakdown;
}) {
  const maximum = Math.max(
    1,
    ...participants.flatMap((participant) => participant.values),
  );

  if (participants.length === 0 || beverages.length === 0) {
    return (
      <div className="grid min-h-56 place-items-center rounded-xl border border-dashed border-border p-5 text-center">
        <div>
          <Grid3X3
            aria-hidden="true"
            className="mx-auto size-8 text-muted-foreground"
          />
          <p className="mt-3 font-bold">La comparativa aparecerá aquí</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Necesita participantes y bebidas registradas.
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4 md:hidden">
        {participants.map((participant) => (
          <section
            className="rounded-xl border border-border p-4"
            key={participant.userId}
          >
            <div className="flex items-center justify-between gap-3">
              <h3 className="font-bold">{participant.username}</h3>
              <span className="font-display text-lg font-black tabular-nums">
                {participant.total}
              </span>
            </div>
            <div className="mt-3 space-y-2">
              {beverages.map((beverage, index) => {
                const count = participant.values[index] ?? 0;
                return (
                  <div
                    className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 text-sm"
                    key={beverage.key}
                  >
                    <div className="min-w-0">
                      <p className="truncate font-semibold">{beverage.name}</p>
                      <div className="mt-1 h-2 overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full rounded-full bg-primary"
                          style={{ width: `${(count / maximum) * 100}%` }}
                        />
                      </div>
                    </div>
                    <span className="font-bold tabular-nums">{count}</span>
                  </div>
                );
              })}
            </div>
          </section>
        ))}
      </div>

      <div className="hidden overflow-auto rounded-xl border border-border md:block">
        <table className="w-full min-w-[42rem] border-collapse text-sm">
          <caption className="sr-only">
            Cantidad de cada bebida registrada por participante
          </caption>
          <thead className="bg-muted/70">
            <tr>
              <th className="sticky left-0 bg-muted px-3 py-3 text-left" scope="col">
                Participante
              </th>
              {beverages.map((beverage) => (
                <th
                  className="px-3 py-3 text-center"
                  key={beverage.key}
                  scope="col"
                >
                  {beverage.name}
                </th>
              ))}
              <th className="px-3 py-3 text-right" scope="col">
                Total
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {participants.map((participant) => (
              <tr key={participant.userId}>
                <th
                  className="sticky left-0 bg-card px-3 py-3 text-left font-bold"
                  scope="row"
                >
                  {participant.username}
                </th>
                {participant.values.map((count, index) => (
                  <td className="p-1.5 text-center" key={beverages[index]?.key ?? index}>
                    <span
                      className="grid min-h-10 min-w-10 place-items-center rounded-lg font-bold tabular-nums"
                      style={{
                        backgroundColor: `hsl(var(--primary) / ${0.06 + (count / maximum) * 0.38})`,
                      }}
                    >
                      {count}
                    </span>
                  </td>
                ))}
                <td className="px-3 py-3 text-right font-display font-black tabular-nums">
                  {participant.total}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

interface EventBreakdownsProps {
  beverageTotals: BeverageTotals;
  hourlyConsumption: EventDashboardDto["hourlyConsumption"];
  participantBreakdown: ParticipantBreakdown;
}

export function EventBreakdowns({
  beverageTotals,
  hourlyConsumption,
  participantBreakdown,
}: EventBreakdownsProps) {
  return (
    <>
      <div className="grid gap-5 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex-row items-start justify-between gap-4 space-y-0">
            <div>
              <CardTitle>Qué se está bebiendo</CardTitle>
              <CardDescription>
                Popularidad y peso de cada bebida en el evento.
              </CardDescription>
            </div>
            <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-accent/35 text-primary">
              <BarChart3 aria-hidden="true" className="size-5" />
            </span>
          </CardHeader>
          <CardContent>
            <BeverageBars beverages={beverageTotals} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex-row items-start justify-between gap-4 space-y-0">
            <div>
              <CardTitle>Ritmo por hora</CardTitle>
              <CardDescription>
                Cuándo se concentra la actividad de la quedada.
              </CardDescription>
            </div>
            <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-muted text-primary">
              <Clock3 aria-hidden="true" className="size-5" />
            </span>
          </CardHeader>
          <CardContent>
            <HourlyRhythm hours={hourlyConsumption} />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Quién bebe qué</CardTitle>
          <CardDescription>
            Mapa de intensidad participante × bebida. El número siempre
            acompaña al color para que la comparación sea accesible.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ParticipantMatrix
            beverages={beverageTotals}
            participants={participantBreakdown}
          />
        </CardContent>
      </Card>
    </>
  );
}
