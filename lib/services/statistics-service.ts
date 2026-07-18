import "server-only";

import { eq } from "drizzle-orm";

import { db } from "@/db";
import { beerLogs, beerTypes } from "@/db/schema";
import type {
  BeerStatisticsDto,
  BeerTypeStatisticDto,
  StatisticCountDto,
} from "@/lib/types/api";

export interface StatisticsLog {
  quantity: number;
  createdAt: Date;
  beerTypeId: string | null;
  beerTypeName: string | null;
  beerTypePhotoDataUrl: string | null;
}

const weekdayLabels = [
  "Lunes",
  "Martes",
  "Miércoles",
  "Jueves",
  "Viernes",
  "Sábados",
  "Domingos",
];
const timeRanges = [
  { key: "early", label: "Madrugada", start: 0, end: 6 },
  { key: "morning", label: "Mañana", start: 6, end: 12 },
  { key: "afternoon", label: "Tarde", start: 12, end: 18 },
  { key: "night", label: "Noche", start: 18, end: 24 },
] as const;

function valueFromParts(
  parts: Intl.DateTimeFormatPart[],
  type: Intl.DateTimeFormatPartTypes,
): number {
  return Number(parts.find((part) => part.type === type)?.value);
}

function dateKey(year: number, month: number, day: number): string {
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function percentage(count: number, total: number): number {
  return total === 0 ? 0 : Math.round((count / total) * 100);
}

export function buildBeerStatistics(
  logs: StatisticsLog[],
  timeZone: string,
  now = new Date(),
): BeerStatisticsDto {
  const localDateTime = new Intl.DateTimeFormat("en-GB", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    hourCycle: "h23",
  });
  const recentDayLabel = new Intl.DateTimeFormat("es-ES", {
    timeZone: "UTC",
    weekday: "short",
    day: "numeric",
  });
  const nowParts = localDateTime.formatToParts(now);
  const localToday = new Date(
    Date.UTC(
      valueFromParts(nowParts, "year"),
      valueFromParts(nowParts, "month") - 1,
      valueFromParts(nowParts, "day"),
    ),
  );

  const last14Days: StatisticCountDto[] = Array.from({ length: 14 }, (_, index) => {
    const date = new Date(localToday);
    date.setUTCDate(localToday.getUTCDate() - (13 - index));
    return {
      key: date.toISOString().slice(0, 10),
      label: recentDayLabel.format(date).replace(".", ""),
      count: 0,
    };
  });
  const recentDaysByKey = new Map(last14Days.map((day) => [day.key, day]));
  const byWeekday: StatisticCountDto[] = weekdayLabels.map((label, index) => ({
    key: String(index),
    label,
    count: 0,
  }));
  const byTimeRange: StatisticCountDto[] = timeRanges.map((range) => ({
    key: range.key,
    label: range.label,
    count: 0,
  }));
  const byHour: StatisticCountDto[] = Array.from({ length: 24 }, (_, hour) => ({
    key: String(hour),
    label: `${String(hour).padStart(2, "0")}:00`,
    count: 0,
  }));
  const typeCounts = new Map<string, BeerTypeStatisticDto>();
  const activeDayKeys = new Set<string>();
  let totalBeers = 0;

  for (const log of logs) {
    const parts = localDateTime.formatToParts(log.createdAt);
    const year = valueFromParts(parts, "year");
    const month = valueFromParts(parts, "month");
    const day = valueFromParts(parts, "day");
    const hour = valueFromParts(parts, "hour");
    const localDateKey = dateKey(year, month, day);
    const calendarDate = new Date(Date.UTC(year, month - 1, day));
    const weekdayIndex = (calendarDate.getUTCDay() + 6) % 7;
    const rangeIndex = timeRanges.findIndex(
      (range) => hour >= range.start && hour < range.end,
    );
    const quantity = log.quantity;

    totalBeers += quantity;
    activeDayKeys.add(localDateKey);
    byWeekday[weekdayIndex]!.count += quantity;
    byHour[hour]!.count += quantity;
    if (rangeIndex >= 0) {
      byTimeRange[rangeIndex]!.count += quantity;
    }
    const recentDay = recentDaysByKey.get(localDateKey);
    if (recentDay) {
      recentDay.count += quantity;
    }

    const typeKey = log.beerTypeId ?? "legacy";
    const currentType = typeCounts.get(typeKey) ?? {
      key: typeKey,
      beerTypeId: log.beerTypeId,
      label: log.beerTypeName ?? "Sin tipo",
      photoDataUrl: log.beerTypePhotoDataUrl,
      count: 0,
      percentage: 0,
    };
    currentType.count += quantity;
    typeCounts.set(typeKey, currentType);
  }

  const byType = [...typeCounts.values()]
    .map((type) => ({
      ...type,
      percentage: percentage(type.count, totalBeers),
    }))
    .sort(
      (first, second) =>
        second.count - first.count || first.label.localeCompare(second.label, "es"),
    );
  const favoriteHour = [...byHour]
    .filter((hour) => hour.count > 0)
    .sort((first, second) => second.count - first.count || Number(first.key) - Number(second.key))[0] ?? null;
  const previous7Days = last14Days
    .slice(0, 7)
    .reduce((total, day) => total + day.count, 0);
  const last7Days = last14Days
    .slice(7)
    .reduce((total, day) => total + day.count, 0);

  return {
    totalBeers,
    activeDays: activeDayKeys.size,
    averagePerActiveDay:
      activeDayKeys.size === 0
        ? 0
        : Math.round((totalBeers / activeDayKeys.size) * 10) / 10,
    varietyCount: [...typeCounts.values()].filter((type) => type.beerTypeId).length,
    last7Days,
    previous7Days,
    recentTrendPercentage:
      previous7Days === 0
        ? null
        : Math.round(((last7Days - previous7Days) / previous7Days) * 100),
    favoriteType: byType[0] ?? null,
    favoriteHour,
    byType,
    byWeekday,
    byTimeRange,
    last14Days,
    timeZone,
    generatedAt: now.toISOString(),
  };
}

export async function getBeerStatistics(
  userId: string,
  timeZone: string,
): Promise<BeerStatisticsDto> {
  const [logRows, typeRows] = await Promise.all([
    db
      .select({
        quantity: beerLogs.quantity,
        createdAt: beerLogs.createdAt,
        beerTypeId: beerLogs.beerTypeId,
      })
      .from(beerLogs)
      .where(eq(beerLogs.userId, userId)),
    db
      .select({
        id: beerTypes.id,
        name: beerTypes.name,
        photoDataUrl: beerTypes.photoDataUrl,
      })
      .from(beerTypes),
  ]);
  const typesById = new Map(typeRows.map((type) => [type.id, type]));
  const rows: StatisticsLog[] = logRows.map((log) => {
    const beerType = log.beerTypeId ? typesById.get(log.beerTypeId) : undefined;
    return {
      ...log,
      beerTypeName: beerType?.name ?? null,
      beerTypePhotoDataUrl: beerType?.photoDataUrl ?? null,
    };
  });

  return buildBeerStatistics(rows, timeZone);
}
