import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  createEvent: vi.fn(),
  joinEvent: vi.fn(),
  push: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mocks.push }),
}));
vi.mock("@/lib/http/api-client", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/http/api-client")>()),
  createEvent: mocks.createEvent,
  joinEvent: mocks.joinEvent,
}));

import { EventHub } from "@/components/events/event-hub";
import type { EventSummaryDto } from "@/lib/types/api";

const eventId = "1f4fab65-487c-43f2-9a26-41834ca950d9";
const joinedEventId = "49fa8e35-f5df-44d7-a582-feb63c4dbaf5";
const event: EventSummaryDto = {
  id: eventId,
  name: "Driebes 18/07",
  startsAt: "2026-07-18T18:00:00.000Z",
  endsAt: "2026-07-19T02:00:00.000Z",
  status: "ACTIVE",
  isCreator: true,
  inviteCode: "ABC123DEFG",
  memberCount: 3,
  totalBeers: 12,
};

describe("EventHub", () => {
  beforeEach(() => {
    mocks.createEvent.mockReset();
    mocks.joinEvent.mockReset();
    mocks.push.mockReset();
  });

  it("presenta los eventos como quedadas privadas y lista sus accesos", () => {
    render(<EventHub initialCode="" initialEvents={[event]} />);

    expect(screen.getByText("Quedadas privadas")).toBeVisible();
    expect(
      screen.getByRole("heading", {
        name: "Un ranking nuevo para cada evento",
      }),
    ).toBeVisible();
    expect(screen.getByRole("heading", { name: "Mis eventos" })).toBeVisible();
    expect(
      screen.getByText(
        "Solo aparecen las quedadas que has creado o a las que te has unido.",
      ),
    ).toBeVisible();
    expect(screen.getByRole("heading", { name: event.name })).toBeVisible();
    expect(screen.getByText("En curso")).toBeVisible();
    expect(screen.getByText("3 participantes")).toBeVisible();
    expect(screen.getByText("12")).toBeVisible();
    expect(screen.getByRole("link", { name: "Abrir contador" })).toHaveAttribute(
      "href",
      `/home?eventId=${eventId}`,
    );
    expect(screen.getByRole("link", { name: "Ver análisis" })).toHaveAttribute(
      "href",
      `/competition?eventId=${eventId}`,
    );
    expect(
      screen.getByRole("button", {
        name: `Copiar invitación de ${event.name}`,
      }),
    ).toBeVisible();
  });

  it("crea un evento con su duración y navega a su detalle", async () => {
    const browserUser = userEvent.setup();
    const startsAt = "2026-08-20T18:00";
    const endsAt = "2026-08-21T01:30";
    const createdEvent: EventSummaryDto = {
      ...event,
      id: joinedEventId,
      name: "Asado pani",
      startsAt: new Date(startsAt).toISOString(),
      endsAt: new Date(endsAt).toISOString(),
      status: "UPCOMING",
      totalBeers: 0,
    };
    mocks.createEvent.mockResolvedValue(createdEvent);
    render(<EventHub initialCode="" initialEvents={[]} />);

    await browserUser.type(screen.getByLabelText("Nombre"), createdEvent.name);
    fireEvent.change(screen.getByLabelText("Empieza"), {
      target: { value: startsAt },
    });
    fireEvent.change(screen.getByLabelText("Termina"), {
      target: { value: endsAt },
    });
    await browserUser.click(screen.getByRole("button", { name: "Crear evento" }));

    await waitFor(() => {
      expect(mocks.createEvent).toHaveBeenCalledWith({
        name: createdEvent.name,
        startsAt: new Date(startsAt).toISOString(),
        endsAt: new Date(endsAt).toISOString(),
      });
      expect(mocks.push).toHaveBeenCalledWith(`/events/${joinedEventId}`);
    });
  });

  it("normaliza un código inicial, se une y navega al evento", async () => {
    const browserUser = userEvent.setup();
    const joinedEvent: EventSummaryDto = {
      ...event,
      id: joinedEventId,
      isCreator: false,
      inviteCode: null,
    };
    mocks.joinEvent.mockResolvedValue(joinedEvent);
    render(<EventHub initialCode="abc123defg" initialEvents={[]} />);

    expect(screen.getByLabelText("Código de invitación")).toHaveValue(
      "ABC123DEFG",
    );
    await browserUser.click(screen.getByRole("button", { name: "Unirme" }));

    await waitFor(() => {
      expect(mocks.joinEvent).toHaveBeenCalledWith("ABC123DEFG");
      expect(mocks.push).toHaveBeenCalledWith(`/events/${joinedEventId}`);
    });
  });
});
