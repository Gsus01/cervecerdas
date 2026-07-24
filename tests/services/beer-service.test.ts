import { beforeEach, describe, expect, it, vi } from "vitest";

const databaseMock = vi.hoisted(() => ({ transaction: vi.fn() }));

vi.mock("@/db", () => ({ db: databaseMock }));

import { addBeerForUser } from "@/lib/services/beer-service";
import { BadRequestError, ForbiddenError } from "@/lib/http/errors";

describe("addBeerForUser", () => {
  beforeEach(() => {
    databaseMock.transaction.mockReset();
    vi.useRealTimers();
  });

  it("incrementa el contador y crea el historial en la misma transacción", async () => {
    const userId = "4ddde027-2e19-49f6-a213-a93360e8b1fb";
    const beerTypeId = "bf0dc4e4-1797-4ef8-9149-fe74d2ac1642";
    const eventId = "1f4fab65-487c-43f2-9a26-41834ca950d9";
    const logId = "df32cc9b-bb38-4f40-aee4-953f92795f8c";
    const beerType = {
      id: beerTypeId,
      name: "IPA",
      photoDataUrl: "data:image/png;base64,aW1hZ2Vu",
      createdAt: new Date("2026-07-17T18:30:00.000Z"),
    };
    const limit = vi.fn().mockResolvedValue([beerType]);
    const eventLimit = vi.fn().mockResolvedValue([
      {
        startsAt: new Date("2000-01-01T00:00:00.000Z"),
        endsAt: new Date("2100-01-01T00:00:00.000Z"),
      },
    ]);
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
      select: vi
        .fn()
        .mockReturnValueOnce({ from })
        .mockReturnValueOnce({
          from: () => ({
            innerJoin: () => ({ where: () => ({ limit: eventLimit }) }),
          }),
        }),
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

    const result = await addBeerForUser(userId, beerTypeId, eventId);

    const updateValues = set.mock.calls[0]?.[0] as
      | { beerCount: unknown; updatedAt: Date }
      | undefined;
    const logValues = values.mock.calls[0]?.[0] as
      | {
          userId: string;
          beerTypeId: string;
          eventId: string;
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
      eventId,
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

  it("rechaza asociar una consumición si el usuario no pertenece al evento", async () => {
    const userId = "4ddde027-2e19-49f6-a213-a93360e8b1fb";
    const beerTypeId = "bf0dc4e4-1797-4ef8-9149-fe74d2ac1642";
    const eventId = "1f4fab65-487c-43f2-9a26-41834ca950d9";
    const beerType = {
      id: beerTypeId,
      name: "IPA",
      photoDataUrl: "data:image/png;base64,aW1hZ2Vu",
      createdAt: new Date("2026-07-17T18:30:00.000Z"),
    };
    const typeLimit = vi.fn().mockResolvedValue([beerType]);
    const eventLimit = vi.fn().mockResolvedValue([]);
    const transaction = {
      select: vi
        .fn()
        .mockReturnValueOnce({
          from: () => ({ where: () => ({ limit: typeLimit }) }),
        })
        .mockReturnValueOnce({
          from: () => ({
            innerJoin: () => ({ where: () => ({ limit: eventLimit }) }),
          }),
        }),
      update: vi.fn(),
    };
    databaseMock.transaction.mockImplementation(async (callback) => callback(transaction));

    await expect(
      addBeerForUser(userId, beerTypeId, eventId),
    ).rejects.toBeInstanceOf(ForbiddenError);
    expect(transaction.update).not.toHaveBeenCalled();
  });

  it.each([
    {
      case: "antes del inicio",
      now: "2026-07-18T12:00:00.000Z",
      message: "El evento todavía no ha comenzado",
    },
    {
      case: "en el instante final",
      now: "2026-07-19T02:00:00.000Z",
      message: "El evento ya ha finalizado",
    },
  ])("rechaza registrar $case", async ({ now, message }) => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(now));
    const userId = "4ddde027-2e19-49f6-a213-a93360e8b1fb";
    const beerTypeId = "bf0dc4e4-1797-4ef8-9149-fe74d2ac1642";
    const eventId = "1f4fab65-487c-43f2-9a26-41834ca950d9";
    const transaction = {
      select: vi
        .fn()
        .mockReturnValueOnce({
          from: () => ({
            where: () => ({
              limit: () =>
                Promise.resolve([
                  {
                    id: beerTypeId,
                    name: "IPA",
                    photoDataUrl: "data:image/png;base64,aW1hZ2Vu",
                    createdAt: new Date(),
                  },
                ]),
            }),
          }),
        })
        .mockReturnValueOnce({
          from: () => ({
            innerJoin: () => ({
              where: () => ({
                limit: () =>
                  Promise.resolve([
                    {
                      startsAt: new Date("2026-07-18T16:00:00.000Z"),
                      endsAt: new Date("2026-07-19T02:00:00.000Z"),
                    },
                  ]),
              }),
            }),
          }),
        }),
      update: vi.fn(),
    };
    databaseMock.transaction.mockImplementation(async (callback) => callback(transaction));

    await expect(
      addBeerForUser(userId, beerTypeId, eventId),
    ).rejects.toEqual(new BadRequestError(message));
    expect(transaction.update).not.toHaveBeenCalled();
  });
});
