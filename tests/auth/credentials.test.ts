import { hash } from "bcryptjs";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { User } from "@/db/schema";

vi.mock("@/lib/services/user-service", () => ({
  findUserByEmailForAuth: vi.fn(),
}));

import { authorizeCredentials } from "@/lib/auth/options";
import { findUserByEmailForAuth } from "@/lib/services/user-service";

const findUserMock = vi.mocked(findUserByEmailForAuth);

describe("authorizeCredentials", () => {
  let user: User;

  beforeEach(async () => {
    user = {
      id: "4ddde027-2e19-49f6-a213-a93360e8b1fb",
      username: "Carlos",
      email: "carlos@example.com",
      passwordHash: await hash("cerveza123", 12),
      role: "USER",
      beerCount: 3,
      createdAt: new Date("2026-07-17T18:00:00Z"),
      updatedAt: new Date("2026-07-17T18:00:00Z"),
    };
  });

  it("devuelve la identidad con credenciales correctas", async () => {
    findUserMock.mockResolvedValue(user);

    await expect(
      authorizeCredentials({
        email: "CARLOS@example.com",
        password: "cerveza123",
      }),
    ).resolves.toEqual({
      id: user.id,
      name: "Carlos",
      email: "carlos@example.com",
      role: "USER",
    });
  });

  it("no autentica una contraseña incorrecta", async () => {
    findUserMock.mockResolvedValue(user);

    await expect(
      authorizeCredentials({
        email: "carlos@example.com",
        password: "incorrecta",
      }),
    ).resolves.toBeNull();
  });

  it("no autentica un usuario inexistente", async () => {
    findUserMock.mockResolvedValue(undefined);

    await expect(
      authorizeCredentials({
        email: "nadie@example.com",
        password: "cerveza123",
      }),
    ).resolves.toBeNull();
  });
});
