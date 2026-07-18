// @vitest-environment node

import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/services/user-service", () => ({
  registerUser: vi.fn(),
}));

import { POST } from "@/app/api/auth/register/route";
import { ConflictError } from "@/lib/http/errors";
import { registerUser } from "@/lib/services/user-service";
import type { UserDto } from "@/lib/types/api";

const registerUserMock = vi.mocked(registerUser);
const requestBody = {
  username: "Carlos",
  email: "carlos@example.com",
  password: "cerveza123",
  confirmPassword: "cerveza123",
};
const createdUser: UserDto = {
  id: "4ddde027-2e19-49f6-a213-a93360e8b1fb",
  username: "Carlos",
  email: "carlos@example.com",
  role: "USER",
  beerCount: 0,
  createdAt: "2026-07-17T18:00:00.000Z",
  updatedAt: "2026-07-17T18:00:00.000Z",
};

function registerRequest(body: string): Request {
  return new Request("http://localhost/api/auth/register", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body,
  });
}

describe("POST /api/auth/register", () => {
  beforeEach(() => {
    registerUserMock.mockReset();
  });

  it("crea un usuario y no devuelve la contraseña", async () => {
    registerUserMock.mockResolvedValue(createdUser);

    const response = await POST(registerRequest(JSON.stringify(requestBody)));
    const body: unknown = await response.json();

    expect(response.status).toBe(201);
    expect(registerUserMock).toHaveBeenCalledWith(requestBody);
    expect(body).toEqual(createdUser);
    expect(JSON.stringify(body)).not.toContain("password");
  });

  it("devuelve 409 si el correo ya existe", async () => {
    registerUserMock.mockRejectedValue(
      new ConflictError("Ya existe una cuenta con ese correo electrónico"),
    );

    const response = await POST(registerRequest(JSON.stringify(requestBody)));
    const body = (await response.json()) as { message: string; status: number };

    expect(response.status).toBe(409);
    expect(body.status).toBe(409);
    expect(body.message).toBe("Ya existe una cuenta con ese correo electrónico");
  });

  it("devuelve 400 para un cuerpo que no es JSON", async () => {
    const response = await POST(registerRequest("no-es-json"));

    expect(response.status).toBe(400);
    expect(registerUserMock).not.toHaveBeenCalled();
  });
});
