import "server-only";

import { hash } from "bcryptjs";
import { asc, desc, eq, or } from "drizzle-orm";

import { db } from "@/db";
import { users, type User } from "@/db/schema";
import { ConflictError, NotFoundError } from "@/lib/http/errors";
import type { RankingEntryDto, UserDto } from "@/lib/types/api";
import {
  registrationSchema,
} from "@/lib/validation/auth";

function toUserDto(user: User): UserDto {
  return {
    id: user.id,
    username: user.username,
    email: user.email,
    role: user.role,
    beerCount: user.beerCount,
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString(),
  };
}

export async function getAllUsers(): Promise<UserDto[]> {
  const rows = await db.select().from(users).orderBy(asc(users.username));
  return rows.map(toUserDto);
}

function isUniqueViolation(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "23505"
  );
}

export async function registerUser(input: unknown): Promise<UserDto> {
  const data = registrationSchema.parse(input);
  const [existingUser] = await db
    .select({ username: users.username, email: users.email })
    .from(users)
    .where(or(eq(users.username, data.username), eq(users.email, data.email)))
    .limit(1);

  if (existingUser?.email.toLowerCase() === data.email) {
    throw new ConflictError("Ya existe una cuenta con ese correo electrónico");
  }

  if (existingUser) {
    throw new ConflictError("El nombre de usuario ya está en uso");
  }

  const passwordHash = await hash(data.password, 12);

  try {
    const [createdUser] = await db
      .insert(users)
      .values({
        username: data.username,
        email: data.email,
        passwordHash,
      })
      .returning();

    if (!createdUser) {
      throw new Error("La base de datos no devolvió el usuario creado");
    }

    return toUserDto(createdUser);
  } catch (error) {
    if (isUniqueViolation(error)) {
      throw new ConflictError("El correo o el nombre de usuario ya están registrados");
    }
    throw error;
  }
}

export async function findUserByEmailForAuth(
  email: string,
): Promise<User | undefined> {
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  return user;
}

export async function getUserById(userId: string): Promise<UserDto> {
  const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);

  if (!user) {
    throw new NotFoundError("No se ha encontrado el usuario autenticado");
  }

  return toUserDto(user);
}

export async function getRanking(): Promise<RankingEntryDto[]> {
  const rows = await db
    .select({
      userId: users.id,
      username: users.username,
      beerCount: users.beerCount,
    })
    .from(users)
    .orderBy(desc(users.beerCount), asc(users.username));

  return rows.map((row, index) => ({
    position: index + 1,
    ...row,
  }));
}
