import { describe, expect, it } from "vitest";

import {
  buildGroupCompetition,
  type CompetitionLog,
  type CompetitionUser,
} from "@/lib/services/competition-service";

const groupUsers: CompetitionUser[] = [
  {
    id: "4ddde027-2e19-49f6-a213-a93360e8b1fb",
    username: "Carlos",
    beerCount: 10,
  },
  {
    id: "56c42ff8-da51-4ea4-a8f9-e6b9db85015b",
    username: "Lucía",
    beerCount: 8,
  },
  {
    id: "291b61ee-9f14-44b2-a79a-68fc4d74fd26",
    username: "Pablo",
    beerCount: 2,
  },
];

describe("buildGroupCompetition", () => {
  it("ordena una pandilla pequeña por la semana actual y desempata por total", () => {
    const logs: CompetitionLog[] = [
      { userId: groupUsers[0]!.id, quantity: 1, createdAt: new Date("2026-07-18T20:00:00.000Z") },
      { userId: groupUsers[0]!.id, quantity: 1, createdAt: new Date("2026-07-17T18:00:00.000Z") },
      { userId: groupUsers[0]!.id, quantity: 1, createdAt: new Date("2026-07-12T22:30:00.000Z") },
      { userId: groupUsers[0]!.id, quantity: 1, createdAt: new Date("2026-07-10T18:00:00.000Z") },
      { userId: groupUsers[1]!.id, quantity: 1, createdAt: new Date("2026-07-18T19:00:00.000Z") },
      { userId: groupUsers[1]!.id, quantity: 1, createdAt: new Date("2026-07-16T19:00:00.000Z") },
      { userId: groupUsers[1]!.id, quantity: 2, createdAt: new Date("2026-07-11T12:00:00.000Z") },
      { userId: groupUsers[2]!.id, quantity: 2, createdAt: new Date("2026-07-14T18:00:00.000Z") },
    ];

    const result = buildGroupCompetition(
      groupUsers,
      logs,
      "Europe/Madrid",
      new Date("2026-07-18T12:00:00.000Z"),
    );

    expect(result).toMatchObject({
      totalBeers: 20,
      last7Days: 7,
      activeUsers: 3,
      leader: { username: "Carlos", last7Days: 3 },
      closestBattle: {
        firstUsername: "Lucía",
        secondUsername: "Pablo",
        difference: 0,
      },
      timeZone: "Europe/Madrid",
    });
    expect(result.users.map((user) => [user.position, user.username, user.last7Days])).toEqual([
      [1, "Carlos", 3],
      [2, "Lucía", 2],
      [3, "Pablo", 2],
    ]);
    expect(result.users[0]?.trendPercentage).toBe(200);
    expect(result.users[1]?.trendPercentage).toBe(0);
    expect(result.dailyTotals).toHaveLength(7);
    expect(result.dailyTotals.reduce((total, day) => total + day.count, 0)).toBe(7);
  });

  it("usa la zona horaria para decidir a qué semana pertenece un registro", () => {
    const log: CompetitionLog = {
      userId: groupUsers[0]!.id,
      quantity: 1,
      createdAt: new Date("2026-07-11T22:30:00.000Z"),
    };

    const madrid = buildGroupCompetition(
      groupUsers,
      [log],
      "Europe/Madrid",
      new Date("2026-07-18T12:00:00.000Z"),
    );
    const utc = buildGroupCompetition(
      groupUsers,
      [log],
      "UTC",
      new Date("2026-07-18T12:00:00.000Z"),
    );

    expect(madrid.users.find((user) => user.username === "Carlos")?.last7Days).toBe(1);
    expect(utc.users.find((user) => user.username === "Carlos")?.last7Days).toBe(0);
  });

  it("mantiene a todos los amigos visibles cuando la semana está vacía", () => {
    const result = buildGroupCompetition(
      groupUsers,
      [],
      "UTC",
      new Date("2026-07-18T12:00:00.000Z"),
    );

    expect(result.users).toHaveLength(3);
    expect(result.last7Days).toBe(0);
    expect(result.activeUsers).toBe(0);
    expect(result.leader).toBeNull();
    expect(result.closestBattle).toBeNull();
  });
});
