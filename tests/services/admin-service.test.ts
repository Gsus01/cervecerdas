import { beforeEach, describe, expect, it, vi } from "vitest";

const databaseMock = vi.hoisted(() => ({ transaction: vi.fn() }));

vi.mock("@/db", () => ({ db: databaseMock }));
vi.mock("@/lib/services/beer-service", () => ({ getBeerLogs: vi.fn() }));
vi.mock("@/lib/services/user-service", () => ({ getAllUsers: vi.fn() }));

import { BadRequestError } from "@/lib/http/errors";
import { updateBeerLog } from "@/lib/services/admin-service";

const logId = "df32cc9b-bb38-4f40-aee4-953f92795f8c";
const oldUserId = "4ddde027-2e19-49f6-a213-a93360e8b1fb";
const targetUserId = "56c42ff8-da51-4ea4-a8f9-e6b9db85015b";
const beerTypeId = "bf0dc4e4-1797-4ef8-9149-fe74d2ac1642";
const eventId = "1f4fab65-487c-43f2-9a26-41834ca950d9";
const input = {
  userId: targetUserId,
  beerTypeId,
  quantity: 2,
  createdAt: "2026-07-18T18:00:00.000Z",
};

function selection(rows: unknown[]) {
  return {
    from: () => ({
      where: () => ({ limit: () => Promise.resolve(rows) }),
    }),
  };
}

function eventSelection(rows: unknown[]) {
  return {
    from: () => ({
      innerJoin: () => ({
        where: () => ({ limit: () => Promise.resolve(rows) }),
      }),
    }),
  };
}

function transactionWithEvent(eventRows: unknown[]) {
  const firstSet = vi.fn(() => ({ where: vi.fn().mockResolvedValue(undefined) }));
  const recalculateSet = vi.fn(() => ({
    where: vi.fn().mockResolvedValue(undefined),
  }));
  const transaction = {
    select: vi
      .fn()
      .mockReturnValueOnce(
        selection([{ userId: oldUserId, eventId }]),
      )
      .mockReturnValueOnce(selection([{ id: targetUserId }]))
      .mockReturnValueOnce(selection([{ id: beerTypeId }]))
      .mockReturnValueOnce(eventSelection(eventRows)),
    update: vi
      .fn()
      .mockReturnValueOnce({ set: firstSet })
      .mockReturnValueOnce({ set: recalculateSet }),
  };

  return { firstSet, transaction };
}

describe("updateBeerLog con eventos", () => {
  beforeEach(() => {
    databaseMock.transaction.mockReset();
  });

  it("rechaza mover el registro a una persona ajena al evento", async () => {
    const { transaction } = transactionWithEvent([]);
    databaseMock.transaction.mockImplementation(async (callback) =>
      callback(transaction),
    );

    await expect(updateBeerLog(logId, input)).rejects.toEqual(
      new BadRequestError(
        "El usuario seleccionado no forma parte del evento",
      ),
    );
    expect(transaction.update).not.toHaveBeenCalled();
  });

  it("rechaza la fecha final porque el intervalo del evento es semiabierto", async () => {
    const endsAt = new Date("2026-07-19T02:00:00.000Z");
    const { transaction } = transactionWithEvent([
      {
        startsAt: new Date("2026-07-18T16:00:00.000Z"),
        endsAt,
      },
    ]);
    databaseMock.transaction.mockImplementation(async (callback) =>
      callback(transaction),
    );

    await expect(
      updateBeerLog(logId, {
        ...input,
        createdAt: endsAt.toISOString(),
      }),
    ).rejects.toEqual(
      new BadRequestError(
        "La fecha debe estar dentro de la duración del evento",
      ),
    );
    expect(transaction.update).not.toHaveBeenCalled();
  });

  it("permite corregir un registro manteniendo miembro y fecha válidos", async () => {
    const { firstSet, transaction } = transactionWithEvent([
      {
        startsAt: new Date("2026-07-18T16:00:00.000Z"),
        endsAt: new Date("2026-07-19T02:00:00.000Z"),
      },
    ]);
    databaseMock.transaction.mockImplementation(async (callback) =>
      callback(transaction),
    );

    await updateBeerLog(logId, input);

    expect(firstSet).toHaveBeenCalledWith({
      userId: targetUserId,
      beerTypeId,
      quantity: 2,
      createdAt: new Date(input.createdAt),
    });
    expect(transaction.update).toHaveBeenCalledTimes(2);
  });
});
