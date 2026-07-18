import "server-only";

import { eq, inArray, sql } from "drizzle-orm";

import { db } from "@/db";
import { beerLogs, beerTypes, users } from "@/db/schema";
import { NotFoundError } from "@/lib/http/errors";
import { getBeerLogs } from "@/lib/services/beer-service";
import { getAllUsers } from "@/lib/services/user-service";
import type { AdminOverviewDto } from "@/lib/types/api";
import { updateBeerLogSchema } from "@/lib/validation/beer";

export async function getAdminOverview(
  page: number,
  size: number,
): Promise<AdminOverviewDto> {
  const [allUsers, logs] = await Promise.all([
    getAllUsers(),
    getBeerLogs(page, size),
  ]);

  return { users: allUsers, logs };
}

function recalculateBeerCounts(
  transaction: Parameters<Parameters<typeof db.transaction>[0]>[0],
  userIds: string[],
) {
  const uniqueUserIds = [...new Set(userIds)];

  return transaction
    .update(users)
    .set({
      beerCount: sql<number>`coalesce((select sum(${beerLogs.quantity}) from ${beerLogs} where ${beerLogs.userId} = ${users.id}), 0)`,
      updatedAt: new Date(),
    })
    .where(inArray(users.id, uniqueUserIds));
}

export async function updateBeerLog(logId: string, input: unknown): Promise<void> {
  const data = updateBeerLogSchema.parse(input);

  await db.transaction(async (transaction) => {
    const [existingLog] = await transaction
      .select({ userId: beerLogs.userId })
      .from(beerLogs)
      .where(eq(beerLogs.id, logId))
      .limit(1);

    if (!existingLog) {
      throw new NotFoundError("El registro ya no existe");
    }

    const [[targetUser], [targetBeerType]] = await Promise.all([
      transaction
        .select({ id: users.id })
        .from(users)
        .where(eq(users.id, data.userId))
        .limit(1),
      transaction
        .select({ id: beerTypes.id })
        .from(beerTypes)
        .where(eq(beerTypes.id, data.beerTypeId))
        .limit(1),
    ]);

    if (!targetUser) {
      throw new NotFoundError("El usuario seleccionado ya no existe");
    }
    if (!targetBeerType) {
      throw new NotFoundError("El tipo de bebida seleccionado ya no existe");
    }

    await transaction
      .update(beerLogs)
      .set({
        userId: data.userId,
        beerTypeId: data.beerTypeId,
        quantity: data.quantity,
        createdAt: new Date(data.createdAt),
      })
      .where(eq(beerLogs.id, logId));

    await recalculateBeerCounts(transaction, [existingLog.userId, data.userId]);
  });
}

export async function deleteBeerLog(logId: string): Promise<void> {
  await db.transaction(async (transaction) => {
    const [deletedLog] = await transaction
      .delete(beerLogs)
      .where(eq(beerLogs.id, logId))
      .returning({ userId: beerLogs.userId });

    if (!deletedLog) {
      throw new NotFoundError("El registro ya no existe");
    }

    await recalculateBeerCounts(transaction, [deletedLog.userId]);
  });
}
