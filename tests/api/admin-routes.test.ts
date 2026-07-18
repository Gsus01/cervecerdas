// @vitest-environment node

import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/auth/session", () => ({ requireAdmin: vi.fn() }));
vi.mock("@/lib/services/admin-service", () => ({
  deleteBeerLog: vi.fn(),
  getAdminOverview: vi.fn(),
  updateBeerLog: vi.fn(),
}));
vi.mock("@/lib/services/beer-type-service", () => ({ deleteBeerType: vi.fn() }));

import {
  DELETE as deleteLogRoute,
  PATCH as updateLogRoute,
} from "@/app/api/admin/logs/[id]/route";
import { GET as overviewRoute } from "@/app/api/admin/overview/route";
import { DELETE as deleteBeerTypeRoute } from "@/app/api/beer-types/[id]/route";
import { requireAdmin } from "@/lib/auth/session";
import { ForbiddenError } from "@/lib/http/errors";
import {
  deleteBeerLog,
  getAdminOverview,
  updateBeerLog,
} from "@/lib/services/admin-service";
import { deleteBeerType } from "@/lib/services/beer-type-service";

const requireAdminMock = vi.mocked(requireAdmin);
const updateBeerLogMock = vi.mocked(updateBeerLog);
const deleteBeerLogMock = vi.mocked(deleteBeerLog);
const getAdminOverviewMock = vi.mocked(getAdminOverview);
const deleteBeerTypeMock = vi.mocked(deleteBeerType);
const adminId = "4ddde027-2e19-49f6-a213-a93360e8b1fb";
const logId = "df32cc9b-bb38-4f40-aee4-953f92795f8c";
const beerTypeId = "bf0dc4e4-1797-4ef8-9149-fe74d2ac1642";

describe("rutas administrativas", () => {
  beforeEach(() => {
    requireAdminMock.mockReset();
    updateBeerLogMock.mockReset();
    deleteBeerLogMock.mockReset();
    getAdminOverviewMock.mockReset();
    deleteBeerTypeMock.mockReset();
  });

  it("rechaza un usuario sin rol de administrador", async () => {
    requireAdminMock.mockRejectedValue(new ForbiddenError());

    const response = await overviewRoute(
      new Request("http://localhost/api/admin/overview"),
    );

    expect(response.status).toBe(403);
    expect(getAdminOverviewMock).not.toHaveBeenCalled();
  });

  it("permite al administrador corregir todos los campos del registro", async () => {
    const input = {
      userId: adminId,
      beerTypeId,
      quantity: 3,
      createdAt: "2026-07-18T17:00:00.000Z",
    };
    requireAdminMock.mockResolvedValue(adminId);
    updateBeerLogMock.mockResolvedValue();

    const response = await updateLogRoute(
      new Request(`http://localhost/api/admin/logs/${logId}`, {
        method: "PATCH",
        body: JSON.stringify(input),
      }),
    );

    expect(response.status).toBe(200);
    expect(updateBeerLogMock).toHaveBeenCalledWith(logId, input);
  });

  it("permite eliminar registros y tipos de bebida", async () => {
    requireAdminMock.mockResolvedValue(adminId);
    deleteBeerLogMock.mockResolvedValue();
    deleteBeerTypeMock.mockResolvedValue();

    const [logResponse, typeResponse] = await Promise.all([
      deleteLogRoute(new Request(`http://localhost/api/admin/logs/${logId}`, { method: "DELETE" })),
      deleteBeerTypeRoute(new Request(`http://localhost/api/beer-types/${beerTypeId}`, { method: "DELETE" })),
    ]);

    expect(logResponse.status).toBe(200);
    expect(typeResponse.status).toBe(200);
    expect(deleteBeerLogMock).toHaveBeenCalledWith(logId);
    expect(deleteBeerTypeMock).toHaveBeenCalledWith(beerTypeId);
  });
});
