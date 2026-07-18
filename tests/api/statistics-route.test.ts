// @vitest-environment node

import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/auth/session", () => ({ getCurrentUserId: vi.fn() }));
vi.mock("@/lib/services/statistics-service", () => ({
  getBeerStatistics: vi.fn(),
}));

import { GET } from "@/app/api/beers/statistics/route";
import { getCurrentUserId } from "@/lib/auth/session";
import { UnauthorizedError } from "@/lib/http/errors";
import { getBeerStatistics } from "@/lib/services/statistics-service";
import type { BeerStatisticsDto } from "@/lib/types/api";

const getCurrentUserIdMock = vi.mocked(getCurrentUserId);
const getBeerStatisticsMock = vi.mocked(getBeerStatistics);
const userId = "4ddde027-2e19-49f6-a213-a93360e8b1fb";

const statistics: BeerStatisticsDto = {
  totalBeers: 0,
  activeDays: 0,
  averagePerActiveDay: 0,
  varietyCount: 0,
  last7Days: 0,
  previous7Days: 0,
  recentTrendPercentage: null,
  favoriteType: null,
  favoriteHour: null,
  byType: [],
  byWeekday: [],
  byTimeRange: [],
  last14Days: [],
  timeZone: "Europe/Madrid",
  generatedAt: "2026-07-18T12:00:00.000Z",
};

describe("GET /api/beers/statistics", () => {
  beforeEach(() => {
    getCurrentUserIdMock.mockReset();
    getBeerStatisticsMock.mockReset();
  });

  it("calcula solo para el usuario de la sesión y su zona horaria", async () => {
    getCurrentUserIdMock.mockResolvedValue(userId);
    getBeerStatisticsMock.mockResolvedValue(statistics);

    const response = await GET(
      new Request(
        "http://localhost/api/beers/statistics?timeZone=Europe%2FMadrid&userId=otro",
      ),
    );

    expect(response.status).toBe(200);
    expect(getBeerStatisticsMock).toHaveBeenCalledWith(userId, "Europe/Madrid");
    expect(await response.json()).toEqual(statistics);
  });

  it("rechaza una zona horaria no válida", async () => {
    getCurrentUserIdMock.mockResolvedValue(userId);

    const response = await GET(
      new Request("http://localhost/api/beers/statistics?timeZone=Marte%2FOlympus"),
    );

    expect(response.status).toBe(400);
    expect(getBeerStatisticsMock).not.toHaveBeenCalled();
  });

  it("rechaza la consulta sin sesión", async () => {
    getCurrentUserIdMock.mockRejectedValue(new UnauthorizedError());

    const response = await GET(
      new Request("http://localhost/api/beers/statistics?timeZone=UTC"),
    );

    expect(response.status).toBe(401);
    expect(getBeerStatisticsMock).not.toHaveBeenCalled();
  });
});
