import "server-only";

import { randomUUID } from "node:crypto";

import { and, eq, inArray } from "drizzle-orm";

import { db } from "@/db";
import {
  beerLogs,
  beerTypes,
  eventMembers,
  events,
  users,
} from "@/db/schema";
import { NotFoundError } from "@/lib/http/errors";
import type {
  BeerLogDto,
  EventBeverageTotalDto,
  EventDashboardDto,
  EventParticipantBreakdownDto,
  EventStatus,
  EventSummaryDto,
  EventTimelineDto,
  PageDto,
  RankingEntryDto,
  StatisticCountDto,
} from "@/lib/types/api";
import type { CreateEventInput } from "@/lib/validation/event";

interface EventRow {
  id: string;
  creatorId: string;
  name: string;
  inviteCode: string;
  startsAt: Date;
  endsAt: Date;
}

export interface EventMemberRow {
  userId: string;
  username: string;
}

export interface EventLogRow {
  id: string;
  userId: string;
  actionType: "BEER_ADDED";
  quantity: number;
  beerTypeId: string | null;
  beerTypeName: string | null;
  beerTypePhotoDataUrl: string | null;
  beerTypeCreatedAt: Date | null;
  createdAt: Date;
}

const MINUTE_IN_MS = 60_000;
const TIMELINE_BUCKET_MINUTES = [
  15, 30, 60, 120, 180, 240, 360, 720, 1_440, 2_880, 10_080, 20_160,
  43_200,
] as const;

function getEventStatus(
  startsAt: Date,
  endsAt: Date,
  now: Date,
): EventStatus {
  if (now < startsAt) {
    return "UPCOMING";
  }
  if (now >= endsAt) {
    return "FINISHED";
  }
  return "ACTIVE";
}

function hourInTimeZone(date: Date, timeZone: string): number {
  const hour = new Intl.DateTimeFormat("en-GB", {
    timeZone,
    hour: "2-digit",
    hourCycle: "h23",
  })
    .formatToParts(date)
    .find((part) => part.type === "hour")?.value;

  return Number(hour);
}

function percentage(count: number, total: number): number {
  return total === 0 ? 0 : Math.round((count / total) * 100);
}

function normalizeBeerTypeIds(
  beerTypeIds: readonly string[] | string | null,
): string[] {
  if (!beerTypeIds) {
    return [];
  }
  return [...new Set(typeof beerTypeIds === "string" ? [beerTypeIds] : beerTypeIds)];
}

function timelineBucketMinutes(durationMs: number): number {
  const requiredMinutes = Math.max(
    TIMELINE_BUCKET_MINUTES[0],
    Math.ceil(durationMs / MINUTE_IN_MS / 48),
  );

  return (
    TIMELINE_BUCKET_MINUTES.find(
      (candidate) => candidate >= requiredMinutes,
    ) ?? Math.ceil(requiredMinutes / 1_440) * 1_440
  );
}

function buildTimeline(
  event: EventRow,
  members: EventMemberRow[],
  logs: EventLogRow[],
  timeZone: string,
): EventTimelineDto {
  const durationMs = Math.max(1, event.endsAt.getTime() - event.startsAt.getTime());
  const bucketMinutes = timelineBucketMinutes(durationMs);
  const bucketMs = bucketMinutes * MINUTE_IN_MS;
  const bucketCount = Math.max(1, Math.ceil(durationMs / bucketMs));
  const labelFormatter = new Intl.DateTimeFormat("es-ES", {
    timeZone,
    ...(durationMs > 24 * 60 * MINUTE_IN_MS
      ? { day: "numeric", month: "short" }
      : {}),
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  });
  const points = Array.from({ length: bucketCount }, (_, index) => {
    const startsAt = new Date(event.startsAt.getTime() + index * bucketMs);
    const endsAt = new Date(
      Math.min(startsAt.getTime() + bucketMs, event.endsAt.getTime()),
    );

    return {
      key: startsAt.toISOString(),
      label: labelFormatter.format(startsAt),
      startsAt: startsAt.toISOString(),
      endsAt: endsAt.toISOString(),
    };
  });
  const bucketCountsByUser = new Map(
    members.map((member) => [
      member.userId,
      Array.from({ length: bucketCount }, () => 0),
    ]),
  );

  for (const log of logs) {
    const bucketIndex = Math.floor(
      (log.createdAt.getTime() - event.startsAt.getTime()) / bucketMs,
    );
    const counts = bucketCountsByUser.get(log.userId);
    if (counts && bucketIndex >= 0 && bucketIndex < bucketCount) {
      counts[bucketIndex]! += log.quantity;
    }
  }

  return {
    bucketMinutes,
    points,
    series: members.map((member) => {
      let accumulated = 0;
      const values = (bucketCountsByUser.get(member.userId) ?? []).map(
        (count) => {
          accumulated += count;
          return accumulated;
        },
      );

      return {
        key: member.userId,
        label: member.username,
        userId: member.userId,
        values,
        total: accumulated,
      };
    }),
  };
}

function buildRecentLogs(
  logs: EventLogRow[],
  members: EventMemberRow[],
  page: number,
  size: number,
): PageDto<BeerLogDto> {
  const usernamesById = new Map(
    members.map((member) => [member.userId, member.username]),
  );
  const sortedLogs = [...logs].sort(
    (first, second) =>
      second.createdAt.getTime() - first.createdAt.getTime() ||
      second.id.localeCompare(first.id),
  );
  const totalElements = sortedLogs.length;

  return {
    content: sortedLogs.slice(page * size, (page + 1) * size).map((log) => ({
      id: log.id,
      userId: log.userId,
      username: usernamesById.get(log.userId) ?? "Usuario",
      actionType: log.actionType,
      quantity: log.quantity,
      beerType:
        log.beerTypeId &&
        log.beerTypeName &&
        log.beerTypePhotoDataUrl &&
        log.beerTypeCreatedAt
          ? {
              id: log.beerTypeId,
              name: log.beerTypeName,
              photoDataUrl: log.beerTypePhotoDataUrl,
              createdAt: log.beerTypeCreatedAt.toISOString(),
            }
          : null,
      createdAt: log.createdAt.toISOString(),
    })),
    page,
    size,
    totalElements,
    totalPages: Math.ceil(totalElements / size),
  };
}

function buildEventSummary(
  event: EventRow,
  currentUserId: string,
  memberCount: number,
  totalBeers: number,
  now: Date,
): EventSummaryDto {
  const isCreator = event.creatorId === currentUserId;

  return {
    id: event.id,
    name: event.name,
    startsAt: event.startsAt.toISOString(),
    endsAt: event.endsAt.toISOString(),
    status: getEventStatus(event.startsAt, event.endsAt, now),
    isCreator,
    inviteCode: isCreator ? event.inviteCode : null,
    memberCount,
    totalBeers,
  };
}

export function buildEventDashboard(
  event: EventRow,
  members: EventMemberRow[],
  logs: EventLogRow[],
  currentUserId: string,
  timeZone: string,
  beerTypeIds: readonly string[] | string | null,
  recentPage = 0,
  recentSize = 12,
  now = new Date(),
): EventDashboardDto {
  const selectedBeerTypeIds = normalizeBeerTypeIds(beerTypeIds);
  const selectedBeerTypeId = selectedBeerTypeIds[0] ?? null;
  const selectedBeerTypes = new Set(selectedBeerTypeIds);
  const filteredLogs =
    selectedBeerTypes.size === 0
      ? logs
      : logs.filter(
          (log) =>
            log.beerTypeId !== null && selectedBeerTypes.has(log.beerTypeId),
        );
  const countsByUser = new Map(members.map((member) => [member.userId, 0]));
  const countsByUserAndBeverage = new Map<string, Map<string, number>>();
  const beverageCounts = new Map<
    string,
    Omit<EventBeverageTotalDto, "percentage">
  >();
  const hourlyConsumption: StatisticCountDto[] = Array.from(
    { length: 24 },
    (_, hour) => ({
      key: String(hour),
      label: `${String(hour).padStart(2, "0")}:00`,
      count: 0,
    }),
  );
  let filteredTotal = 0;

  for (const log of filteredLogs) {
    filteredTotal += log.quantity;
    countsByUser.set(
      log.userId,
      (countsByUser.get(log.userId) ?? 0) + log.quantity,
    );
    const hour = hourInTimeZone(log.createdAt, timeZone);
    if (Number.isInteger(hour) && hourlyConsumption[hour]) {
      hourlyConsumption[hour].count += log.quantity;
    }

    const beverageKey = log.beerTypeId ?? "deleted";
    const beverage = beverageCounts.get(beverageKey) ?? {
      key: beverageKey,
      beerTypeId: log.beerTypeId,
      name: log.beerTypeName ?? "Bebida eliminada",
      photoDataUrl: log.beerTypePhotoDataUrl,
      total: 0,
    };
    beverage.total += log.quantity;
    beverageCounts.set(beverageKey, beverage);

    const userBeverages =
      countsByUserAndBeverage.get(log.userId) ?? new Map<string, number>();
    userBeverages.set(
      beverageKey,
      (userBeverages.get(beverageKey) ?? 0) + log.quantity,
    );
    countsByUserAndBeverage.set(log.userId, userBeverages);
  }

  const ranking: RankingEntryDto[] = members
    .map((member) => ({
      position: 0,
      userId: member.userId,
      username: member.username,
      beerCount: countsByUser.get(member.userId) ?? 0,
    }))
    .sort(
      (first, second) =>
        second.beerCount - first.beerCount ||
        first.username.localeCompare(second.username, "es"),
    )
    .map((member, index) => ({ ...member, position: index + 1 }));
  const beverageTotals: EventBeverageTotalDto[] = [...beverageCounts.values()]
    .map((beverage) => ({
      ...beverage,
      percentage: percentage(beverage.total, filteredTotal),
    }))
    .sort(
      (first, second) =>
        second.total - first.total ||
        first.name.localeCompare(second.name, "es"),
    );
  const participantBreakdown: EventParticipantBreakdownDto[] = ranking.map(
    (participant) => ({
      userId: participant.userId,
      username: participant.username,
      total: participant.beerCount,
      values: beverageTotals.map(
        (beverage) =>
          countsByUserAndBeverage
            .get(participant.userId)
            ?.get(beverage.key) ?? 0,
      ),
    }),
  );
  const timelineMembers = ranking.map(({ userId, username }) => ({
    userId,
    username,
  }));
  const eventTotal = logs.reduce((total, log) => total + log.quantity, 0);

  return {
    event: buildEventSummary(
      event,
      currentUserId,
      members.length,
      eventTotal,
      now,
    ),
    ranking,
    hourlyConsumption,
    timeline: buildTimeline(event, timelineMembers, filteredLogs, timeZone),
    beverageTotals,
    participantBreakdown,
    recentLogs: buildRecentLogs(
      filteredLogs,
      members,
      recentPage,
      recentSize,
    ),
    filteredTotal,
    selectedBeerTypeId,
    selectedBeerTypeIds,
    timeZone,
    generatedAt: now.toISOString(),
  };
}

export async function createEvent(
  creatorId: string,
  input: CreateEventInput,
): Promise<EventSummaryDto> {
  const now = new Date();
  const inviteCode = randomUUID().replaceAll("-", "").slice(0, 10).toUpperCase();

  const created = await db.transaction(async (transaction) => {
    const [event] = await transaction
      .insert(events)
      .values({
        creatorId,
        name: input.name,
        inviteCode,
        startsAt: new Date(input.startsAt),
        endsAt: new Date(input.endsAt),
      })
      .returning();

    if (!event) {
      throw new Error("La base de datos no devolvió el evento creado");
    }

    await transaction.insert(eventMembers).values({
      eventId: event.id,
      userId: creatorId,
      role: "CREATOR",
    });

    return event;
  });

  return buildEventSummary(created, creatorId, 1, 0, now);
}

export async function joinEvent(
  userId: string,
  inviteCode: string,
): Promise<EventSummaryDto> {
  const [event] = await db
    .select()
    .from(events)
    .where(eq(events.inviteCode, inviteCode))
    .limit(1);

  if (!event) {
    throw new NotFoundError("No existe ningún evento con ese código");
  }

  await db
    .insert(eventMembers)
    .values({ eventId: event.id, userId, role: "MEMBER" })
    .onConflictDoNothing();

  const dashboard = await getEventDashboard(event.id, userId, "Europe/Madrid");
  return dashboard.event;
}

export async function getEventsForUser(
  userId: string,
  now = new Date(),
): Promise<EventSummaryDto[]> {
  const eventRows = await db
    .select({
      id: events.id,
      creatorId: events.creatorId,
      name: events.name,
      inviteCode: events.inviteCode,
      startsAt: events.startsAt,
      endsAt: events.endsAt,
    })
    .from(eventMembers)
    .innerJoin(events, eq(eventMembers.eventId, events.id))
    .where(eq(eventMembers.userId, userId));

  if (eventRows.length === 0) {
    return [];
  }

  const eventIds = eventRows.map((event) => event.id);
  const [memberRows, logRows] = await Promise.all([
    db
      .select({ eventId: eventMembers.eventId })
      .from(eventMembers)
      .where(inArray(eventMembers.eventId, eventIds)),
    db
      .select({ eventId: beerLogs.eventId, quantity: beerLogs.quantity })
      .from(beerLogs)
      .where(inArray(beerLogs.eventId, eventIds)),
  ]);
  const memberCounts = new Map<string, number>();
  const beerCounts = new Map<string, number>();

  for (const member of memberRows) {
    memberCounts.set(member.eventId, (memberCounts.get(member.eventId) ?? 0) + 1);
  }
  for (const log of logRows) {
    if (log.eventId) {
      beerCounts.set(
        log.eventId,
        (beerCounts.get(log.eventId) ?? 0) + log.quantity,
      );
    }
  }

  return eventRows
    .map((event) =>
      buildEventSummary(
        event,
        userId,
        memberCounts.get(event.id) ?? 0,
        beerCounts.get(event.id) ?? 0,
        now,
      ),
    )
    .sort(
      (first, second) =>
        new Date(second.startsAt).getTime() - new Date(first.startsAt).getTime(),
    );
}

export async function getEventDashboard(
  eventId: string,
  userId: string,
  timeZone: string,
  beerTypeIds: readonly string[] | string = [],
  recentPage = 0,
  recentSize = 12,
  now = new Date(),
): Promise<EventDashboardDto> {
  const [event] = await db
    .select({
      id: events.id,
      creatorId: events.creatorId,
      name: events.name,
      inviteCode: events.inviteCode,
      startsAt: events.startsAt,
      endsAt: events.endsAt,
    })
    .from(eventMembers)
    .innerJoin(events, eq(eventMembers.eventId, events.id))
    .where(
      and(eq(eventMembers.eventId, eventId), eq(eventMembers.userId, userId)),
    )
    .limit(1);

  if (!event) {
    throw new NotFoundError("No se ha encontrado el evento o no formas parte de él");
  }

  const [members, logRows, beerTypeRows] = await Promise.all([
    db
      .select({ userId: users.id, username: users.username })
      .from(eventMembers)
      .innerJoin(users, eq(eventMembers.userId, users.id))
      .where(eq(eventMembers.eventId, eventId)),
    db
      .select({
        id: beerLogs.id,
        userId: beerLogs.userId,
        actionType: beerLogs.actionType,
        quantity: beerLogs.quantity,
        beerTypeId: beerLogs.beerTypeId,
        createdAt: beerLogs.createdAt,
      })
      .from(beerLogs)
      .where(eq(beerLogs.eventId, eventId)),
    db
      .selectDistinct({
        id: beerTypes.id,
        name: beerTypes.name,
        photoDataUrl: beerTypes.photoDataUrl,
        createdAt: beerTypes.createdAt,
      })
      .from(beerTypes)
      .innerJoin(beerLogs, eq(beerTypes.id, beerLogs.beerTypeId))
      .where(eq(beerLogs.eventId, eventId)),
  ]);
  const beerTypesById = new Map(
    beerTypeRows.map((beerType) => [beerType.id, beerType]),
  );
  const logs: EventLogRow[] = logRows.map((log) => {
    const beerType = log.beerTypeId
      ? beerTypesById.get(log.beerTypeId)
      : undefined;

    return {
      ...log,
      beerTypeName: beerType?.name ?? null,
      beerTypePhotoDataUrl: beerType?.photoDataUrl ?? null,
      beerTypeCreatedAt: beerType?.createdAt ?? null,
    };
  });

  return buildEventDashboard(
    event,
    members,
    logs,
    userId,
    timeZone,
    beerTypeIds,
    recentPage,
    recentSize,
    now,
  );
}
