import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  addBeer: vi.fn(),
  getRanking: vi.fn(),
  getBeerLogs: vi.fn(),
  signOut: vi.fn(),
}));

vi.mock("next-auth/react", () => ({ signOut: mocks.signOut }));
vi.mock("@/lib/http/api-client", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/http/api-client")>()),
  addBeer: mocks.addBeer,
  getRanking: mocks.getRanking,
  getBeerLogs: mocks.getBeerLogs,
}));

import { Dashboard } from "@/components/dashboard/dashboard";
import { ApiClientError } from "@/lib/http/api-client";
import type { BeerLogDto, PageDto, RankingEntryDto, UserDto } from "@/lib/types/api";

const user: UserDto = {
  id: "4ddde027-2e19-49f6-a213-a93360e8b1fb",
  username: "Carlos",
  email: "carlos@example.com",
  beerCount: 3,
  createdAt: "2026-07-17T18:00:00.000Z",
  updatedAt: "2026-07-17T18:00:00.000Z",
};
const ranking: RankingEntryDto[] = [
  { position: 1, userId: user.id, username: "Carlos", beerCount: 3 },
];
const logs: PageDto<BeerLogDto> = {
  content: [],
  page: 0,
  size: 20,
  totalElements: 0,
  totalPages: 0,
};

describe("Dashboard", () => {
  beforeEach(() => {
    mocks.addBeer.mockReset();
    mocks.getRanking.mockReset();
    mocks.getBeerLogs.mockReset();
    mocks.signOut.mockReset();
  });

  it("renderiza el contador actual", () => {
    render(<Dashboard initialLogs={logs} initialRanking={ranking} initialUser={user} />);

    expect(screen.getByLabelText("3 cervezas registradas")).toBeVisible();
    expect(screen.getByText("Hola, Carlos")).toBeVisible();
  });

  it("registra una cerveza y actualiza el contador sin recargar", async () => {
    const browserUser = userEvent.setup();
    const newLog: BeerLogDto = {
      id: "df32cc9b-bb38-4f40-aee4-953f92795f8c",
      userId: user.id,
      username: "Carlos",
      actionType: "BEER_ADDED",
      quantity: 1,
      createdAt: "2026-07-17T19:35:00.000Z",
    };
    mocks.addBeer.mockResolvedValue({ beerCount: 4, log: newLog });
    mocks.getRanking.mockResolvedValue([
      { position: 1, userId: user.id, username: "Carlos", beerCount: 4 },
    ]);
    mocks.getBeerLogs.mockResolvedValue({
      ...logs,
      content: [newLog],
      totalElements: 1,
      totalPages: 1,
    });
    render(<Dashboard initialLogs={logs} initialRanking={ranking} initialUser={user} />);

    await browserUser.click(screen.getByRole("button", { name: "Registrar cerveza" }));

    expect(await screen.findByLabelText("4 cervezas registradas")).toBeVisible();
    expect(screen.getByText("Cerveza registrada. ¡Salud!")).toBeVisible();
    expect(mocks.addBeer).toHaveBeenCalledTimes(1);
  });

  it("mantiene el contador y muestra el error de la API", async () => {
    const browserUser = userEvent.setup();
    mocks.addBeer.mockRejectedValue(
      new ApiClientError(500, {
        timestamp: "2026-07-17T19:35:00.000Z",
        status: 500,
        error: "Internal server error",
        message: "No se ha podido registrar la cerveza",
        path: "/api/beers",
      }),
    );
    render(<Dashboard initialLogs={logs} initialRanking={ranking} initialUser={user} />);

    await browserUser.click(screen.getByRole("button", { name: "Registrar cerveza" }));

    expect(await screen.findByText("No se ha podido registrar la cerveza")).toBeVisible();
    expect(screen.getByLabelText("3 cervezas registradas")).toBeVisible();
  });
});
