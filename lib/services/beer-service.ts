import "server-only";

import { count, desc, eq, sql } from "drizzle-orm";

import { db } from "@/db";
import { beerLogs, users } from "@/db/schema";
import { NotFoundError } from "@/lib/http/errors";
import type { BeerAddedDto, BeerLogDto, PageDto } from "@/lib/types/api";

export async function addBeerForUser(userId: string): Promise<BeerAddedDto> {
  return db.transaction(async (transaction) => {
    const now = new Date();
    const [updatedUser] = await transaction
      .update(users)
      .set({
        beerCount: sql`${users.beerCount} + 1`,
        updatedAt: now,
      })
      .where(eq(users.id, userId))
      .returning({
        id: users.id,
        username: users.username,
        beerCount: users.beerCount,
      });

    if (!updatedUser) {
      throw new NotFoundError("No se ha encontrado el usuario autenticado");
    }

    const [createdLog] = await transaction
      .insert(beerLogs)
      .values({
        userId,
        actionType: "BEER_ADDED",
        quantity: 1,
        createdAt: now,
      })
      .returning();

    if (!createdLog) {
      throw new Error("La base de datos no devolvió el evento creado");
    }

    return {
      beerCount: updatedUser.beerCount,
      log: {
        id: createdLog.id,
        userId: updatedUser.id,
        username: updatedUser.username,
        actionType: createdLog.actionType,
        quantity: createdLog.quantity,
        createdAt: createdLog.createdAt.toISOString(),
      },
    };
  });
}

export async function getBeerLogs(
  page: number,
  size: number,
): Promise<PageDto<BeerLogDto>> {
  const offset = page * size;
  const [[totalRow], rows] = await Promise.all([
    db.select({ value: count() }).from(beerLogs),
    db
      .select({
        id: beerLogs.id,
        userId: users.id,
        username: users.username,
        actionType: beerLogs.actionType,
        quantity: beerLogs.quantity,
        createdAt: beerLogs.createdAt,
      })
      .from(beerLogs)
      .innerJoin(users, eq(beerLogs.userId, users.id))
      .orderBy(desc(beerLogs.createdAt), desc(beerLogs.id))
      .limit(size)
      .offset(offset),
  ]);

  const totalElements = totalRow?.value ?? 0;

  return {
    content: rows.map((row) => ({
      ...row,
      createdAt: row.createdAt.toISOString(),
    })),
    page,
    size,
    totalElements,
    totalPages: Math.ceil(totalElements / size),
  };
}
