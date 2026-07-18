import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ getGroupCompetition: vi.fn() }));

vi.mock("@/lib/http/api-client", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/http/api-client")>()),
  getGroupCompetition: mocks.getGroupCompetition,
}));

import { CompetitionDashboard } from "@/components/competition/competition-dashboard";
import type { CompetitionUserDto, GroupCompetitionDto } from "@/lib/types/api";

const days = Array.from({ length: 7 }, (_, index) => ({
  key: `2026-07-${String(index + 12).padStart(2, "0")}`,
  label: `día ${index + 12}`,
  count: index % 2,
}));
const users: CompetitionUserDto[] = [
  {
    position: 1,
    userId: "4ddde027-2e19-49f6-a213-a93360e8b1fb",
    username: "Carlos",
    totalBeers: 12,
    last7Days: 4,
    previous7Days: 2,
    trendPercentage: 100,
    dailyLast7: days,
  },
  {
    position: 2,
    userId: "56c42ff8-da51-4ea4-a8f9-e6b9db85015b",
    username: "Lucía",
    totalBeers: 9,
    last7Days: 3,
    previous7Days: 3,
    trendPercentage: 0,
    dailyLast7: days.map((day, index) => ({ ...day, count: index % 3 === 0 ? 1 : 0 })),
  },
];
const competition: GroupCompetitionDto = {
  totalBeers: 21,
  last7Days: 7,
  activeUsers: 2,
  users,
  leader: users[0]!,
  closestBattle: {
    firstUserId: users[0]!.userId,
    firstUsername: "Carlos",
    firstCount: 4,
    secondUserId: users[1]!.userId,
    secondUsername: "Lucía",
    secondCount: 3,
    difference: 1,
  },
  dailyTotals: days.map((day, index) => ({ ...day, count: index % 2 ? 2 : 1 })),
  timeZone: "Europe/Madrid",
  generatedAt: "2026-07-18T12:00:00.000Z",
};

describe("CompetitionDashboard", () => {
  beforeEach(() => {
    mocks.getGroupCompetition.mockReset();
  });

  it("compara a toda la pandilla y destaca al usuario actual", async () => {
    mocks.getGroupCompetition.mockResolvedValue(competition);
    render(
      <CompetitionDashboard
        currentUserId="4ddde027-2e19-49f6-a213-a93360e8b1fb"
        username="Carlos"
      />,
    );

    expect(screen.getByLabelText("Cargando competición")).toBeVisible();
    expect(
      await screen.findByRole("heading", { name: "La liga de Carlos y compañía" }),
    ).toBeVisible();
    expect(screen.getByRole("heading", { name: "Podio semanal" })).toBeVisible();
    expect(screen.getByRole("heading", { name: "Clasificación completa" })).toBeVisible();
    expect(screen.getByRole("heading", { name: "Mapa de rondas" })).toBeVisible();
    expect(screen.getAllByText("Carlos · Tú").length).toBeGreaterThan(0);
    expect(screen.getByText("Foto finish")).toBeVisible();
  });

  it("muestra un estado semanal vacío sin ocultar el contexto del grupo", async () => {
    mocks.getGroupCompetition.mockResolvedValue({
      ...competition,
      last7Days: 0,
      activeUsers: 0,
      leader: null,
      closestBattle: null,
      users: users.map((user) => ({ ...user, last7Days: 0 })),
    });
    render(
      <CompetitionDashboard
        currentUserId="4ddde027-2e19-49f6-a213-a93360e8b1fb"
        username="Carlos"
      />,
    );

    expect(await screen.findByText("Esta semana está en blanco")).toBeVisible();
    expect(screen.getByText("21 en todo el historial")).toBeVisible();
    expect(screen.getByRole("link", { name: "Ir al contador" })).toHaveAttribute(
      "href",
      "/home",
    );
  });
});
