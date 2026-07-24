import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  createBeerType: vi.fn(),
  deleteBeerType: vi.fn(),
}));

vi.mock("@/lib/http/api-client", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/http/api-client")>()),
  createBeerType: mocks.createBeerType,
  deleteBeerType: mocks.deleteBeerType,
}));

import { BeerTypesDialog } from "@/components/dashboard/beer-types-dialog";
import type { BeerTypeDto } from "@/lib/types/api";

const beerType: BeerTypeDto = {
  id: "bf0dc4e4-1797-4ef8-9149-fe74d2ac1642",
  name: "IPA",
  photoDataUrl: "data:image/png;base64,aW1hZ2Vu",
  createdAt: "2026-07-17T18:30:00.000Z",
};

function renderDialog(canDelete: boolean, onDeleted = vi.fn()) {
  render(
    <BeerTypesDialog
      beerTypes={[beerType]}
      canDelete={canDelete}
      isOpen
      onClose={vi.fn()}
      onCreated={vi.fn()}
      onDeleted={onDeleted}
    />,
  );
}

describe("BeerTypesDialog", () => {
  beforeEach(() => {
    mocks.createBeerType.mockReset();
    mocks.deleteBeerType.mockReset();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("permite añadir bebidas sin mostrar controles de borrado a un usuario normal", () => {
    renderDialog(false);

    expect(screen.getByRole("heading", { name: "Tipos de bebida" })).toBeVisible();
    expect(screen.getByRole("button", { name: "Añadir bebida" })).toBeVisible();
    expect(
      screen.queryByRole("button", { name: `Eliminar tipo de bebida ${beerType.name}` }),
    ).not.toBeInTheDocument();
  });

  it("muestra y ejecuta el borrado para un administrador", async () => {
    const browserUser = userEvent.setup();
    const onDeleted = vi.fn();
    vi.spyOn(window, "confirm").mockReturnValue(true);
    mocks.deleteBeerType.mockResolvedValue(undefined);
    renderDialog(true, onDeleted);

    await browserUser.click(
      screen.getByRole("button", {
        name: `Eliminar tipo de bebida ${beerType.name}`,
      }),
    );

    await waitFor(() => {
      expect(mocks.deleteBeerType).toHaveBeenCalledWith(beerType.id);
      expect(onDeleted).toHaveBeenCalledWith(beerType.id);
    });
  });
});
