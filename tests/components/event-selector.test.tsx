import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { EventSelector } from "@/components/events/event-selector";
import type { EventSummaryDto } from "@/lib/types/api";

const activeEvent: EventSummaryDto = {
  id: "1f4fab65-487c-43f2-9a26-41834ca950d9",
  name: "Driebes 18/07",
  startsAt: "2026-07-18T16:00:00.000Z",
  endsAt: "2026-07-19T02:00:00.000Z",
  status: "ACTIVE",
  isCreator: true,
  inviteCode: "ABC123DEFG",
  memberCount: 3,
  totalBeers: 8,
};
const upcomingEvent: EventSummaryDto = {
  id: "b2670d32-435c-4a69-b8af-f34026fbc6e8",
  name: "Asado Pani 20/08",
  startsAt: "2026-08-20T12:00:00.000Z",
  endsAt: "2026-08-20T22:00:00.000Z",
  status: "UPCOMING",
  isCreator: false,
  inviteCode: null,
  memberCount: 5,
  totalBeers: 0,
};
const events = [activeEvent, upcomingEvent];

describe("EventSelector", () => {
  it("muestra el selector, el evento actual y su resumen", () => {
    render(
      <EventSelector
        events={events}
        onChange={vi.fn()}
        selectedEventId={activeEvent.id}
      />,
    );

    expect(screen.getByLabelText("Evento")).toHaveValue(activeEvent.id);
    expect(
      screen.getByRole("option", { name: "Asado Pani 20/08" }),
    ).toBeInTheDocument();
    expect(screen.getByText("En curso")).toBeVisible();
    expect(screen.getByText(/18 jul 2026/)).toBeVisible();
    expect(screen.getByText(/3 participantes · 8 consumiciones/)).toBeVisible();
    expect(screen.getAllByText("Driebes 18/07")).toHaveLength(2);
    expect(
      screen.getByRole("link", { name: "Gestionar eventos" }),
    ).toHaveAttribute("href", "/events");
  });

  it("comunica el identificador al cambiar de evento", async () => {
    const browserUser = userEvent.setup();
    const onChange = vi.fn();
    render(
      <EventSelector
        events={events}
        onChange={onChange}
        selectedEventId={activeEvent.id}
      />,
    );

    await browserUser.selectOptions(
      screen.getByLabelText("Evento"),
      upcomingEvent.id,
    );

    expect(onChange).toHaveBeenCalledOnce();
    expect(onChange).toHaveBeenCalledWith(upcomingEvent.id);
  });

  it.each([
    ["UPCOMING", "Próximo"],
    ["FINISHED", "Finalizado"],
  ] as const)("presenta el estado %s también con texto", (status, label) => {
    render(
      <EventSelector
        events={[{ ...upcomingEvent, status }]}
        onChange={vi.fn()}
        selectedEventId={upcomingEvent.id}
      />,
    );

    expect(screen.getByText(label)).toBeVisible();
  });

  it("ofrece un estado vacío accionable", () => {
    render(
      <EventSelector events={[]} onChange={vi.fn()} selectedEventId="" />,
    );

    expect(screen.getByLabelText("Evento")).toBeDisabled();
    expect(screen.getByText("Todavía no tienes eventos")).toBeVisible();
    expect(
      screen.getByText(
        "Crea uno o únete con una invitación desde Gestionar eventos.",
      ),
    ).toBeVisible();
    expect(
      screen.getByRole("link", { name: "Gestionar eventos" }),
    ).toHaveAttribute("href", "/events");
  });
});
