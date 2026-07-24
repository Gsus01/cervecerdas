"use client";

import { LineChart } from "lucide-react";

import type { EventDashboardDto } from "@/lib/types/api";

interface CumulativeRaceChartProps {
  timeline: EventDashboardDto["timeline"];
  visibleUserIds: string[];
}

const chartColors = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
  "hsl(var(--chart-6))",
];
const dashPatterns = ["", "8 4", "3 4", "10 3 2 3", "2 3", "12 5"];

export function CumulativeRaceChart({
  timeline,
  visibleUserIds,
}: CumulativeRaceChartProps) {
  const selectedIds = new Set(visibleUserIds);
  const matchingSeries = timeline.series.filter(
    (series) => selectedIds.size === 0 || selectedIds.has(series.userId),
  );
  const visibleSeries = matchingSeries.slice(0, 6);
  const hiddenSeriesCount = matchingSeries.length - visibleSeries.length;
  const hasData = visibleSeries.some((series) => series.total > 0);

  if (!hasData || timeline.points.length === 0) {
    return (
      <div className="grid min-h-72 place-items-center rounded-xl border border-dashed border-border p-6 text-center">
        <div>
          <LineChart
            aria-hidden="true"
            className="mx-auto size-9 text-muted-foreground"
          />
          <p className="mt-3 font-bold">La carrera aún no ha empezado</p>
          <p className="mt-1 text-sm leading-6 text-muted-foreground">
            Las líneas crecerán con cada consumición registrada.
          </p>
        </div>
      </div>
    );
  }

  const width = 920;
  const height = 340;
  const margin = { top: 24, right: 24, bottom: 58, left: 48 };
  const plotWidth = width - margin.left - margin.right;
  const plotHeight = height - margin.top - margin.bottom;
  const maximum = Math.max(
    1,
    ...visibleSeries.flatMap((series) => series.values),
  );
  const xFor = (index: number) =>
    margin.left +
    (index / Math.max(1, timeline.points.length - 1)) * plotWidth;
  const yFor = (value: number) =>
    margin.top + plotHeight - (value / maximum) * plotHeight;
  const xLabelIndexes = [...new Set([
    0,
    Math.floor((timeline.points.length - 1) / 3),
    Math.floor(((timeline.points.length - 1) * 2) / 3),
    timeline.points.length - 1,
  ])];

  return (
    <div>
      <div
        aria-label="Leyenda de participantes"
        className="mb-4 flex flex-wrap gap-x-4 gap-y-2"
      >
        {visibleSeries.map((series, index) => (
          <span
            className="inline-flex items-center gap-2 text-sm font-bold"
            key={series.userId}
          >
            <svg aria-hidden="true" height="10" viewBox="0 0 28 10" width="28">
              <line
                stroke={chartColors[index % chartColors.length]}
                strokeDasharray={dashPatterns[index % dashPatterns.length]}
                strokeLinecap="round"
                strokeWidth="3"
                x1="1"
                x2="27"
                y1="5"
                y2="5"
              />
            </svg>
            {series.label}
            <span className="font-medium text-muted-foreground">
              {series.total}
            </span>
          </span>
        ))}
      </div>
      {hiddenSeriesCount > 0 ? (
        <p className="mb-3 text-sm font-medium text-muted-foreground">
          Se muestran las 6 primeras líneas para mantener la gráfica legible.
          Usa el filtro de participantes para comparar otras.
        </p>
      ) : null}

      <div className="rounded-xl border border-border bg-muted/20 p-2 sm:p-4">
        <svg
          aria-labelledby="race-chart-title race-chart-description"
          className="h-auto min-h-64 w-full"
          role="img"
          viewBox={`0 0 ${width} ${height}`}
        >
          <title id="race-chart-title">
            Carrera acumulada de consumiciones por participante
          </title>
          <desc id="race-chart-description">
            Evolución acumulada de {visibleSeries.length} participantes en
            intervalos de {timeline.bucketMinutes} minutos.
          </desc>

          {Array.from({ length: 5 }, (_, index) => {
            const value = Math.round((maximum * index) / 4);
            const y = yFor(value);
            return (
              <g key={index}>
                <line
                  className="stroke-border"
                  strokeDasharray="4 6"
                  x1={margin.left}
                  x2={width - margin.right}
                  y1={y}
                  y2={y}
                />
                <text
                  className="fill-muted-foreground text-[11px] font-semibold"
                  textAnchor="end"
                  x={margin.left - 9}
                  y={y + 4}
                >
                  {value}
                </text>
              </g>
            );
          })}

          {xLabelIndexes.map((index) => {
            const point = timeline.points[index];
            if (!point) {
              return null;
            }
            return (
              <text
                className="fill-muted-foreground text-[11px] font-semibold"
                key={point.key}
                textAnchor={
                  index === 0
                    ? "start"
                    : index === timeline.points.length - 1
                      ? "end"
                      : "middle"
                }
                x={xFor(index)}
                y={height - 24}
              >
                {point.label}
              </text>
            );
          })}

          {visibleSeries.map((series, seriesIndex) => {
            const color = chartColors[seriesIndex % chartColors.length];
            const points = series.values
              .map((value, index) => `${xFor(index)},${yFor(value)}`)
              .join(" ");
            return (
              <g key={series.userId}>
                <polyline
                  fill="none"
                  points={points}
                  stroke={color}
                  strokeDasharray={
                    dashPatterns[seriesIndex % dashPatterns.length]
                  }
                  strokeLinejoin="round"
                  strokeLinecap="round"
                  strokeWidth="3.5"
                  vectorEffect="non-scaling-stroke"
                />
                {series.values.map((value, index) => {
                  const point = timeline.points[index];
                  return (
                    <circle
                      fill={color}
                      key={point?.key ?? index}
                      r={index === series.values.length - 1 ? 5 : 2.5}
                      stroke="hsl(var(--card))"
                      strokeWidth="2"
                      cx={xFor(index)}
                      cy={yFor(value)}
                    >
                      <title>
                        {series.label}, {point?.label}: {value}
                      </title>
                    </circle>
                  );
                })}
              </g>
            );
          })}
        </svg>
      </div>

      <details className="mt-3 rounded-lg border border-border bg-card">
        <summary className="min-h-11 cursor-pointer px-4 py-3 text-sm font-bold">
          Ver evolución en tabla
        </summary>
        <div className="max-h-72 overflow-auto border-t border-border">
          <table className="w-full min-w-[36rem] text-sm">
            <caption className="sr-only">
              Consumo acumulado de cada participante por intervalo
            </caption>
            <thead className="sticky top-0 bg-muted">
              <tr>
                <th className="px-3 py-2 text-left" scope="col">
                  Momento
                </th>
                {visibleSeries.map((series) => (
                  <th
                    className="px-3 py-2 text-right"
                    key={series.userId}
                    scope="col"
                  >
                    {series.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {timeline.points.map((point, pointIndex) => (
                <tr key={point.key}>
                  <th
                    className="whitespace-nowrap px-3 py-2 text-left font-medium"
                    scope="row"
                  >
                    {point.label}
                  </th>
                  {visibleSeries.map((series) => (
                    <td
                      className="px-3 py-2 text-right tabular-nums"
                      key={series.userId}
                    >
                      {series.values[pointIndex] ?? 0}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </div>
  );
}
