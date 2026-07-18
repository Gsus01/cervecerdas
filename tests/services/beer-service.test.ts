import { beforeEach, describe, expect, it, vi } from "vitest";

const databaseMock = vi.hoisted(() => ({ transaction: vi.fn() }));

vi.mock("@/db", () => ({ db: databaseMock }));

import { addBeerForUser } from "@/lib/services/beer-service";

describe("addBeerForUser", () => {
  beforeEach(() => {
    databaseMock.transaction.mockReset();
  });

  it("incrementa el contador y crea el historial en la misma transacción", async () => {
    const userId = "4ddde027-2e19-49f6-a213-a93360e8b1fb";
    const beerTypeId = "bf0dc4e4-1797-4ef8-9149-fe74d2ac1642";
    const logId = "df32cc9b-bb38-4f40-aee4-953f92795f8c";
    const beerType = {
      id: beerTypeId,
      name: "IPA",
      photoDataUrl: "data:image/png;base64,aW1hZ2Vu",
      createdAt: new Date("2026-07-17T18:30:00.000Z"),
    };
    const limit = vi.fn().mockResolvedValue([beerType]);
    const typeWhere = vi.fn(() => ({ limit }));
    const from = vi.fn(() => ({ where: typeWhere }));
    const set = vi.fn();
    const where = vi.fn();
    const returningUser = vi.fn().mockResolvedValue([
      { id: userId, username: "Carlos", beerCount: 4 },
    ]);
    const values = vi.fn();
    const returningLog = vi.fn().mockResolvedValue([
      {
        id: logId,
        userId,
        actionType: "BEER_ADDED" as const,
        quantity: 1,
        createdAt: new Date("2026-07-17T19:35:00.000Z"),
      },
    ]);
    const transaction = {
      select: vi.fn(() => ({ from })),
      update: vi.fn(() => ({
        set: set.mockImplementation(() => ({
          where: where.mockImplementation(() => ({ returning: returningUser })),
        })),
      })),
      insert: vi.fn(() => ({
        values: values.mockImplementation(() => ({ returning: returningLog })),
      })),
    };
    databaseMock.transaction.mockImplementation(async (callback) => callback(transaction));

    const result = await addBeerForUser(userId, beerTypeId);

    const updateValues = set.mock.calls[0]?.[0] as
      | { beerCount: unknown; updatedAt: Date }
      | undefined;
    const logValues = values.mock.calls[0]?.[0] as
      | {
          userId: string;
          beerTypeId: string;
          actionType: string;
          quantity: number;
          createdAt: Date;
        }
      | undefined;

    expect(databaseMock.transaction).toHaveBeenCalledTimes(1);
    expect(updateValues?.beerCount).toBeDefined();
    expect(logValues).toMatchObject({
      userId,
      beerTypeId,
      actionType: "BEER_ADDED",
      quantity: 1,
    });
    expect(logValues?.createdAt).toBe(updateValues?.updatedAt);
    expect(result).toEqual({
      beerCount: 4,
      log: {
        id: logId,
        userId,
        username: "Carlos",
        actionType: "BEER_ADDED",
        quantity: 1,
        beerType: {
          ...beerType,
          createdAt: "2026-07-17T18:30:00.000Z",
        },
        createdAt: "2026-07-17T19:35:00.000Z",
      },
    });
  });
});
