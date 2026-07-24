"use client";

import {
  CalendarDays,
  ChevronDown,
  Clock3,
  Settings2,
  UsersRound,
} from "lucide-react";
import Link from "next/link";
import { useId } from "react";

import { Label } from "@/components/ui/label";
import type { EventStatus, EventSummaryDto } from "@/lib/types/api";

interface EventSelectorProps {
  events: EventSummaryDto[];
  selectedEventId: string;
  onChange: (eventId: string) => void;
}

const statusPresentation: Record<
  EventStatus,
  { label: string; className: string }
> = {
  ACTIVE: {
    label: "En curso",
    className: "border-primary/25 bg-primary/10 text-primary",
  },
  UPCOMING: {
    label: "Próximo",
    className: "border-accent bg-accent/40 text-accent-foreground",
  },
  FINISHED: {
    label: "Finalizado",
    className: "border-border bg-muted text-muted-foreground",
  },
};

const dateTimeFormatter = new Intl.DateTimeFormat("es-ES", {
  dateStyle: "medium",
  timeStyle: "short",
});

function formatDateTime(value: string): string {
  return dateTimeFormatter.format(new Date(value));
}

export function EventSelector({
  events,
  selectedEventId,
  onChange,
}: EventSelectorProps) {
  const selectId = useId();
  const selectedEvent = events.find((event) => event.id === selectedEventId);
  const hasEvents = events.length > 0;

  return (
    <section
      aria-label="Evento seleccionado"
      className="min-w-0 rounded-xl border border-border bg-card p-4 text-card-foreground shadow-card sm:p-5"
    >
      <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-end">
        <div className="min-w-0 flex-1 space-y-2">
          <Label htmlFor={selectId}>Evento</Label>
          <div className="relative min-w-0">
            <CalendarDays
              aria-hidden="true"
              className="pointer-events-none absolute left-3 top-1/2 size-5 -translate-y-1/2 text-primary"
            />
            <select
              className="min-h-11 w-full min-w-0 cursor-pointer appearance-none rounded-lg border border-border bg-background py-2.5 pl-10 pr-10 text-base font-bold text-foreground shadow-sm transition-[border-color,box-shadow] duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
              disabled={!hasEvents}
              id={selectId}
              onChange={(event) => onChange(event.target.value)}
              value={selectedEvent?.id ?? ""}
            >
              <option disabled value="">
                {hasEvents ? "Elige un evento" : "No tienes eventos"}
              </option>
              {events.map((event) => (
                <option key={event.id} value={event.id}>
                  {event.name}
                </option>
              ))}
            </select>
            <ChevronDown
              aria-hidden="true"
              className="pointer-events-none absolute right-3 top-1/2 size-5 -translate-y-1/2 text-muted-foreground"
            />
          </div>
        </div>

        <Link
          className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-lg border border-border bg-background px-4 text-sm font-bold text-foreground transition-[color,background-color,border-color,box-shadow,transform] duration-200 hover:border-primary/40 hover:bg-accent/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 active:translate-y-px"
          href="/events"
        >
          <Settings2 aria-hidden="true" className="size-4" />
          Gestionar eventos
        </Link>
      </div>

      {selectedEvent ? (
        <div
          aria-live="polite"
          className="mt-4 min-w-0 border-t border-border pt-4"
        >
          <div className="flex min-w-0 flex-wrap items-center gap-2">
            <p className="min-w-0 break-words font-display text-lg font-black">
              {selectedEvent.name}
            </p>
            <span
              className={`inline-flex min-h-7 shrink-0 items-center rounded-full border px-2.5 text-xs font-extrabold ${statusPresentation[selectedEvent.status].className}`}
            >
              {statusPresentation[selectedEvent.status].label}
            </span>
          </div>
          <p className="mt-2 flex min-w-0 items-start gap-2 text-sm leading-6 text-muted-foreground">
            <Clock3
              aria-hidden="true"
              className="mt-0.5 size-4 shrink-0"
            />
            <span className="min-w-0 break-words">
              <time dateTime={selectedEvent.startsAt}>
                {formatDateTime(selectedEvent.startsAt)}
              </time>
              {" — "}
              <time dateTime={selectedEvent.endsAt}>
                {formatDateTime(selectedEvent.endsAt)}
              </time>
            </span>
          </p>
          <p className="mt-1 flex items-center gap-2 text-sm leading-6 text-muted-foreground">
            <UsersRound aria-hidden="true" className="size-4 shrink-0" />
            <span>
              {selectedEvent.memberCount}{" "}
              {selectedEvent.memberCount === 1
                ? "participante"
                : "participantes"}
              {" · "}
              {selectedEvent.totalBeers}{" "}
              {selectedEvent.totalBeers === 1
                ? "consumición"
                : "consumiciones"}
            </span>
          </p>
        </div>
      ) : (
        <div
          className="mt-4 flex min-w-0 items-start gap-3 border-t border-border pt-4"
          role="status"
        >
          <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-muted text-primary">
            <CalendarDays aria-hidden="true" className="size-5" />
          </span>
          <div className="min-w-0">
            <p className="font-bold">
              {hasEvents
                ? "Elige el evento de esta consumición"
                : "Todavía no tienes eventos"}
            </p>
            <p className="mt-1 text-sm leading-6 text-muted-foreground">
              {hasEvents
                ? "El contador y las estadísticas usarán el evento que selecciones."
                : "Crea uno o únete con una invitación desde Gestionar eventos."}
            </p>
          </div>
        </div>
      )}
    </section>
  );
}
