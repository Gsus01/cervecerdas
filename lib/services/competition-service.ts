import "server-only";

import { gte } from "drizzle-orm";

import { db } from "@/db";
import { beerLogs, users } from "@/db/schema";
import type {
  CompetitionBattleDto,
  CompetitionUserDto,
  GroupCompetitionDto,
  StatisticCountDto,
} from "@/lib/types/api";

export interface CompetitionUser {
  id: string;
  username: string;
  beerCount: number;
}

export interface CompetitionLog {
  userId: string;
  quantity: number;
  createdAt: Date;
}

function valueFromParts(
  parts: Intl.DateTimeFormatPart[],
  type: Intl.DateTimeFormatPartTypes,
): number {
  return Number(parts.find((part) => part.type === type)?.value);
}

function dateKey(year: number, month: number, day: number): string {
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function findClosestBattle(usersByScore: CompetitionUserDto[]): CompetitionBattleDto | null {
  const activeUsers = usersByScore.filter((user) => user.last7Days > 0);
  if (activeUsers.length < 2) {
    return null;
  }

  let closest: CompetitionBattleDto | null = null;
  for (let index = 0; index < activeUsers.length - 1; index += 1) {
    const first = activeUsers[index];
    const second = activeUsers[index + 1];
    if (!first || !second) {
      continue;
    }
    const difference = first.last7Days - second.last7Days;
    if (!closest || difference < closest.difference) {
      closest = {
        firstUserId: first.userId,
        firstUsername: first.username,
        firstCount: first.last7Days,
        secondUserId: second.userId,
        secondUsername: second.username,
        secondCount: second.last7Days,
        difference,
      };
    }
  }

  return closest;
}

export function buildGroupCompetition(
  groupUsers: CompetitionUser[],
  logs: CompetitionLog[],
  timeZone: string,
  now = new Date(),
): GroupCompetitionDto {
  const localDate = new Intl.DateTimeFormat("en-GB", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const dayLabel = new Intl.DateTimeFormat("es-ES", {
    timeZone: "UTC",
    weekday: "short",
    day: "numeric",
  });
  const nowParts = localDate.formatToParts(now);
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
      label: dayLabel.format(date).replace(".", ""),
      count: 0,
    };
  });
  const dayIndexByKey = new Map(last14Days.map((day, index) => [day.key, index]));
  const countsByUser = new Map(
    groupUsers.map((user) => [user.id, Array.from({ length: 14 }, () => 0)]),
  );

  for (const log of logs) {
    const counts = countsByUser.get(log.userId);
    if (!counts) {
      continue;
    }
    const parts = localDate.formatToParts(log.createdAt);
    const key = dateKey(
      valueFromParts(parts, "year"),
      valueFromParts(parts, "month"),
      valueFromParts(parts, "day"),
    );
    const dayIndex = dayIndexByKey.get(key);
    if (dayIndex !== undefined) {
      counts[dayIndex]! += log.quantity;
    }
  }

  const competitionUsers = groupUsers
    .map((user) => {
      const counts = countsByUser.get(user.id) ?? [];
      const previous7Days = counts
        .slice(0, 7)
        .reduce((total, count) => total + count, 0);
      const last7Counts = counts.slice(7);
      const last7Days = last7Counts.reduce((total, count) => total + count, 0);

      return {
        position: 0,
        userId: user.id,
        username: user.username,
        totalBeers: user.beerCount,
        last7Days,
        previous7Days,
        trendPercentage:
          previous7Days === 0
            ? null
            : Math.round(((last7Days - previous7Days) / previous7Days) * 100),
        dailyLast7: last14Days.slice(7).map((day, index) => ({
          ...day,
          count: last7Counts[index] ?? 0,
        })),
      } satisfies CompetitionUserDto;
    })
    .sort(
      (first, second) =>
        second.last7Days - first.last7Days ||
        second.totalBeers - first.totalBeers ||
        first.username.localeCompare(second.username, "es"),
    )
    .map((user, index) => ({ ...user, position: index + 1 }));
  const dailyTotals = last14Days.slice(7).map((day, index) => ({
    ...day,
    count: competitionUsers.reduce(
      (total, user) => total + (user.dailyLast7[index]?.count ?? 0),
      0,
    ),
  }));
  const last7Days = competitionUsers.reduce(
    (total, user) => total + user.last7Days,
    0,
  );

  return {
    totalBeers: groupUsers.reduce((total, user) => total + user.beerCount, 0),
    last7Days,
    activeUsers: competitionUsers.filter((user) => user.last7Days > 0).length,
    users: competitionUsers,
    leader: last7Days > 0 ? competitionUsers[0] ?? null : null,
    closestBattle: findClosestBattle(competitionUsers),
    dailyTotals,
    timeZone,
    generatedAt: now.toISOString(),
  };
}

export async function getGroupCompetition(
  timeZone: string,
): Promise<GroupCompetitionDto> {
  const now = new Date();
  const recentCutoff = new Date(now.getTime() - 16 * 24 * 60 * 60 * 1_000);
  const [groupUsers, logs] = await Promise.all([
    db
      .select({ id: users.id, username: users.username, beerCount: users.beerCount })
      .from(users),
    db
      .select({
        userId: beerLogs.userId,
        quantity: beerLogs.quantity,
        createdAt: beerLogs.createdAt,
      })
      .from(beerLogs)
      .where(gte(beerLogs.createdAt, recentCutoff)),
  ]);

  return buildGroupCompetition(groupUsers, logs, timeZone, now);
}
