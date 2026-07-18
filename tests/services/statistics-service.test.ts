import { describe, expect, it } from "vitest";

import {
  buildBeerStatistics,
  type StatisticsLog,
} from "@/lib/services/statistics-service";

const ipa = {
  beerTypeId: "bf0dc4e4-1797-4ef8-9149-fe74d2ac1642",
  beerTypeName: "IPA",
  beerTypePhotoDataUrl: "data:image/png;base64,aXBh",
};
const lager = {
  beerTypeId: "e3f1b0d4-e521-4481-bd67-ae2b76411d86",
  beerTypeName: "Lager",
  beerTypePhotoDataUrl: "data:image/png;base64,bGFnZXI=",
};

describe("buildBeerStatistics", () => {
  it("resume cantidad, tipos y horas en la zona horaria del usuario", () => {
    const logs: StatisticsLog[] = [
      { ...lager, quantity: 1, createdAt: new Date("2026-07-18T20:00:00.000Z") },
      { ...ipa, quantity: 1, createdAt: new Date("2026-07-17T18:00:00.000Z") },
      { ...ipa, quantity: 1, createdAt: new Date("2026-07-17T18:30:00.000Z") },
      { ...ipa, quantity: 1, createdAt: new Date("2026-07-12T22:30:00.000Z") },
      { ...lager, quantity: 1, createdAt: new Date("2026-07-10T19:00:00.000Z") },
    ];

    const result = buildBeerStatistics(
      logs,
      "Europe/Madrid",
      new Date("2026-07-18T12:00:00.000Z"),
    );

    expect(result).toMatchObject({
      totalBeers: 5,
      activeDays: 4,
      averagePerActiveDay: 1.3,
      varietyCount: 2,
      last7Days: 4,
      previous7Days: 1,
      recentTrendPercentage: 300,
      favoriteType: { label: "IPA", count: 3, percentage: 60 },
      favoriteHour: { label: "20:00", count: 2 },
      timeZone: "Europe/Madrid",
    });
    expect(result.byWeekday.find((day) => day.label === "Viernes")?.count).toBe(3);
    expect(result.byTimeRange.find((range) => range.label === "Noche")?.count).toBe(4);
    expect(result.last14Days).toHaveLength(14);
  });

  it("aplica la zona horaria al día de la semana", () => {
    const log: StatisticsLog = {
      ...ipa,
      quantity: 1,
      createdAt: new Date("2026-07-12T22:30:00.000Z"),
    };

    const madrid = buildBeerStatistics(
      [log],
      "Europe/Madrid",
      new Date("2026-07-18T12:00:00.000Z"),
    );
    const utc = buildBeerStatistics(
      [log],
      "UTC",
      new Date("2026-07-18T12:00:00.000Z"),
    );

    expect(madrid.byWeekday.find((day) => day.label === "Lunes")?.count).toBe(1);
    expect(utc.byWeekday.find((day) => day.label === "Domingos")?.count).toBe(1);
  });

  it("devuelve un estado vacío sin divisiones inválidas", () => {
    const result = buildBeerStatistics(
      [],
      "UTC",
      new Date("2026-07-18T12:00:00.000Z"),
    );

    expect(result.totalBeers).toBe(0);
    expect(result.averagePerActiveDay).toBe(0);
    expect(result.favoriteType).toBeNull();
    expect(result.favoriteHour).toBeNull();
    expect(result.recentTrendPercentage).toBeNull();
  });
});
