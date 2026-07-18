// @vitest-environment node

import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/auth/session", () => ({ getCurrentUserId: vi.fn() }));
vi.mock("@/lib/services/competition-service", () => ({
  getGroupCompetition: vi.fn(),
}));

import { GET } from "@/app/api/beers/competition/route";
import { getCurrentUserId } from "@/lib/auth/session";
import { UnauthorizedError } from "@/lib/http/errors";
import { getGroupCompetition } from "@/lib/services/competition-service";
import type { GroupCompetitionDto } from "@/lib/types/api";

const getCurrentUserIdMock = vi.mocked(getCurrentUserId);
const getGroupCompetitionMock = vi.mocked(getGroupCompetition);

const competition: GroupCompetitionDto = {
  totalBeers: 0,
  last7Days: 0,
  activeUsers: 0,
  users: [],
  leader: null,
  closestBattle: null,
  dailyTotals: [],
  timeZone: "Europe/Madrid",
  generatedAt: "2026-07-18T12:00:00.000Z",
};

describe("GET /api/beers/competition", () => {
  beforeEach(() => {
    getCurrentUserIdMock.mockReset();
    getGroupCompetitionMock.mockReset();
  });

  it("protege la comparación y usa la zona horaria solicitada", async () => {
    getCurrentUserIdMock.mockResolvedValue("4ddde027-2e19-49f6-a213-a93360e8b1fb");
    getGroupCompetitionMock.mockResolvedValue(competition);

    const response = await GET(
      new Request("http://localhost/api/beers/competition?timeZone=Europe%2FMadrid"),
    );

    expect(response.status).toBe(200);
    expect(getGroupCompetitionMock).toHaveBeenCalledWith("Europe/Madrid");
    expect(await response.json()).toEqual(competition);
  });

  it("rechaza la comparación sin sesión", async () => {
    getCurrentUserIdMock.mockRejectedValue(new UnauthorizedError());

    const response = await GET(
      new Request("http://localhost/api/beers/competition?timeZone=UTC"),
    );

    expect(response.status).toBe(401);
    expect(getGroupCompetitionMock).not.toHaveBeenCalled();
  });

  it("rechaza una zona horaria no válida", async () => {
    getCurrentUserIdMock.mockResolvedValue("4ddde027-2e19-49f6-a213-a93360e8b1fb");

    const response = await GET(
      new Request("http://localhost/api/beers/competition?timeZone=Marte%2FOlympus"),
    );

    expect(response.status).toBe(400);
    expect(getGroupCompetitionMock).not.toHaveBeenCalled();
  });
});
