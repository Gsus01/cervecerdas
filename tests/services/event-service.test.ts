import { describe, expect, it } from "vitest";

import {
  buildEventDashboard,
  type EventLogRow,
} from "@/lib/services/event-service";

const event = {
  id: "1f4fab65-487c-43f2-9a26-41834ca950d9",
  creatorId: "4ddde027-2e19-49f6-a213-a93360e8b1fb",
  name: "Driebes 18/07",
  inviteCode: "ABC123DEFG",
  startsAt: new Date("2026-07-18T16:00:00.000Z"),
  endsAt: new Date("2026-07-19T02:00:00.000Z"),
};
const members = [
  {
    userId: "4ddde027-2e19-49f6-a213-a93360e8b1fb",
    username: "Carlos",
  },
  {
    userId: "56c42ff8-da51-4ea4-a8f9-e6b9db85015b",
    username: "Lucía",
  },
];
const lagerId = "bf0dc4e4-1797-4ef8-9149-fe74d2ac1642";
const stoutId = "8085851e-eb67-4568-ad35-5fe479079840";
const beerTypeCreatedAt = new Date("2026-01-01T00:00:00.000Z");

function eventLog(
  id: string,
  userId: string,
  quantity: number,
  createdAt: string,
  beerTypeId = lagerId,
  beerTypeName = "Lager",
): EventLogRow {
  return {
    id,
    userId,
    actionType: "BEER_ADDED",
    quantity,
    beerTypeId,
    beerTypeName,
    beerTypePhotoDataUrl: `data:image/png;base64,${beerTypeName}`,
    beerTypeCreatedAt,
    createdAt: new Date(createdAt),
  };
}

const logs = [
  eventLog(
    "00000000-0000-4000-8000-000000000001",
    members[0]!.userId,
    2,
    "2026-07-18T19:15:00.000Z",
  ),
  eventLog(
    "00000000-0000-4000-8000-000000000002",
    members[0]!.userId,
    1,
    "2026-07-18T20:45:00.000Z",
    stoutId,
    "Stout",
  ),
  eventLog(
    "00000000-0000-4000-8000-000000000003",
    members[1]!.userId,
    1,
    "2026-07-18T21:00:00.000Z",
  ),
];

describe("buildEventDashboard", () => {
  it("construye ranking, acumulados, desglose y matriz alineados", () => {
    const dashboard = buildEventDashboard(
      event,
      members,
      logs,
      event.creatorId,
      "UTC",
      [],
      0,
      2,
      new Date("2026-07-18T22:00:00.000Z"),
    );

    expect(dashboard.event).toMatchObject({
      name: "Driebes 18/07",
      status: "ACTIVE",
      isCreator: true,
      inviteCode: "ABC123DEFG",
      memberCount: 2,
      totalBeers: 4,
    });
    expect(dashboard.ranking).toEqual([
      {
        position: 1,
        userId: members[0]!.userId,
        username: "Carlos",
        beerCount: 3,
      },
      {
        position: 2,
        userId: members[1]!.userId,
        username: "Lucía",
        beerCount: 1,
      },
    ]);
    expect(dashboard.beverageTotals).toMatchObject([
      { beerTypeId: lagerId, name: "Lager", total: 3, percentage: 75 },
      { beerTypeId: stoutId, name: "Stout", total: 1, percentage: 25 },
    ]);
    expect(dashboard.participantBreakdown).toEqual([
      {
        userId: members[0]!.userId,
        username: "Carlos",
        total: 3,
        values: [2, 1],
      },
      {
        userId: members[1]!.userId,
        username: "Lucía",
        total: 1,
        values: [1, 0],
      },
    ]);

    const carlos = dashboard.timeline.series[0]!;
    expect(dashboard.timeline.bucketMinutes).toBe(15);
    expect(dashboard.timeline.points).toHaveLength(40);
    expect(carlos.values[12]).toBe(0);
    expect(carlos.values[13]).toBe(2);
    expect(carlos.values[19]).toBe(3);
    expect(carlos.total).toBe(3);
    expect(dashboard.hourlyConsumption[19]).toMatchObject({ count: 2 });
    expect(dashboard.filteredTotal).toBe(4);
    expect(dashboard.recentLogs).toMatchObject({
      page: 0,
      size: 2,
      totalElements: 3,
      totalPages: 2,
    });
    expect(dashboard.recentLogs.content.map((log) => log.id)).toEqual([
      "00000000-0000-4000-8000-000000000003",
      "00000000-0000-4000-8000-000000000002",
    ]);
  });

  it("combina filtros, conserva el total real y pagina la actividad filtrada", () => {
    const dashboard = buildEventDashboard(
      event,
      members,
      logs,
      members[1]!.userId,
      "UTC",
      [stoutId, stoutId],
      0,
      1,
      new Date("2026-07-20T10:00:00.000Z"),
    );

    expect(dashboard.event).toMatchObject({
      status: "FINISHED",
      inviteCode: null,
      totalBeers: 4,
    });
    expect(dashboard.selectedBeerTypeId).toBe(stoutId);
    expect(dashboard.selectedBeerTypeIds).toEqual([stoutId]);
    expect(dashboard.filteredTotal).toBe(1);
    expect(dashboard.ranking.map((entry) => entry.beerCount)).toEqual([1, 0]);
    expect(dashboard.beverageTotals).toMatchObject([
      { beerTypeId: stoutId, total: 1, percentage: 100 },
    ]);
    expect(dashboard.participantBreakdown.map((row) => row.values)).toEqual([
      [1],
      [0],
    ]);
    expect(dashboard.recentLogs).toMatchObject({
      page: 0,
      size: 1,
      totalElements: 1,
      totalPages: 1,
    });
    expect(dashboard.recentLogs.content[0]).toMatchObject({
      id: "00000000-0000-4000-8000-000000000002",
      username: "Carlos",
      beerType: { id: stoutId, name: "Stout" },
    });
  });

  it("aplica la zona horaria a horas y etiquetas sin alterar los instantes", () => {
    const dashboard = buildEventDashboard(
      event,
      members,
      [logs[0]!],
      event.creatorId,
      "Europe/Madrid",
      [],
      0,
      12,
      new Date("2026-07-18T22:00:00.000Z"),
    );

    expect(dashboard.hourlyConsumption[21]).toMatchObject({
      label: "21:00",
      count: 2,
    });
    expect(dashboard.timeline.points[0]).toMatchObject({
      startsAt: "2026-07-18T16:00:00.000Z",
    });
    expect(dashboard.timeline.points[0]!.label).toContain("18:00");
  });

  it("limita la serie temporal a un máximo de 48 puntos en eventos largos", () => {
    const longEvent = {
      ...event,
      startsAt: new Date("2026-01-01T00:00:00.000Z"),
      endsAt: new Date("2026-04-01T00:00:00.000Z"),
    };
    const dashboard = buildEventDashboard(
      longEvent,
      members,
      [],
      event.creatorId,
      "UTC",
      [],
      0,
      12,
      new Date("2026-02-01T00:00:00.000Z"),
    );

    expect(dashboard.timeline.points.length).toBeLessThanOrEqual(48);
    expect(dashboard.timeline.series).toHaveLength(2);
    expect(dashboard.timeline.series[0]!.values).toHaveLength(
      dashboard.timeline.points.length,
    );
  });
});
