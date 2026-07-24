import "server-only";

import { and, count, desc, eq, sql } from "drizzle-orm";

import { db } from "@/db";
import { beerLogs, beerTypes, eventMembers, events, users } from "@/db/schema";
import { BadRequestError, ForbiddenError, NotFoundError } from "@/lib/http/errors";
import type { BeerAddedDto, BeerLogDto, PageDto } from "@/lib/types/api";

export async function addBeerForUser(
  userId: string,
  beerTypeId: string,
  eventId: string,
): Promise<BeerAddedDto> {
  return db.transaction(async (transaction) => {
    const now = new Date();
    const [beerType] = await transaction
      .select()
      .from(beerTypes)
      .where(eq(beerTypes.id, beerTypeId))
      .limit(1);

    if (!beerType) {
      throw new NotFoundError("El tipo de cerveza seleccionado ya no existe");
    }

    const [event] = await transaction
      .select({
        startsAt: events.startsAt,
        endsAt: events.endsAt,
      })
      .from(eventMembers)
      .innerJoin(events, eq(eventMembers.eventId, events.id))
      .where(
        and(
          eq(eventMembers.eventId, eventId),
          eq(eventMembers.userId, userId),
        ),
      )
      .limit(1);

    if (!event) {
      throw new ForbiddenError("No formas parte de este evento");
    }
    if (now < event.startsAt || now >= event.endsAt) {
      throw new BadRequestError(
        now < event.startsAt
          ? "El evento todavía no ha comenzado"
          : "El evento ya ha finalizado",
      );
    }

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
        beerTypeId,
        eventId,
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
        beerType: {
          id: beerType.id,
          name: beerType.name,
          photoDataUrl: beerType.photoDataUrl,
          createdAt: beerType.createdAt.toISOString(),
        },
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
        beerTypeId: beerTypes.id,
        beerTypeName: beerTypes.name,
        beerTypePhotoDataUrl: beerTypes.photoDataUrl,
        beerTypeCreatedAt: beerTypes.createdAt,
        createdAt: beerLogs.createdAt,
      })
      .from(beerLogs)
      .innerJoin(users, eq(beerLogs.userId, users.id))
      .leftJoin(beerTypes, eq(beerLogs.beerTypeId, beerTypes.id))
      .orderBy(desc(beerLogs.createdAt), desc(beerLogs.id))
      .limit(size)
      .offset(offset),
  ]);

  const totalElements = totalRow?.value ?? 0;

  return {
    content: rows.map((row) => ({
      id: row.id,
      userId: row.userId,
      username: row.username,
      actionType: row.actionType,
      quantity: row.quantity,
      beerType:
        row.beerTypeId &&
        row.beerTypeName &&
        row.beerTypePhotoDataUrl &&
        row.beerTypeCreatedAt
          ? {
              id: row.beerTypeId,
              name: row.beerTypeName,
              photoDataUrl: row.beerTypePhotoDataUrl,
              createdAt: row.beerTypeCreatedAt.toISOString(),
            }
          : null,
      createdAt: row.createdAt.toISOString(),
    })),
    page,
    size,
    totalElements,
    totalPages: Math.ceil(totalElements / size),
  };
}
