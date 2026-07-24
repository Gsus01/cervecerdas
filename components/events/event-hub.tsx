"use client";

import {
  CalendarDays,
  CheckCircle2,
  Clock3,
  Copy,
  LoaderCircle,
  Plus,
  TicketCheck,
  UsersRound,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  ApiClientError,
  createEvent,
  joinEvent,
} from "@/lib/http/api-client";
import type { EventStatus, EventSummaryDto } from "@/lib/types/api";

interface EventHubProps {
  initialCode: string;
  initialEvents: EventSummaryDto[];
}

const statusLabels: Record<EventStatus, string> = {
  UPCOMING: "Próximo",
  ACTIVE: "En curso",
  FINISHED: "Finalizado",
};

function formatEventDate(value: string): string {
  return new Intl.DateTimeFormat("es-ES", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function defaultLocalDate(hoursFromNow: number): string {
  const date = new Date(Date.now() + hoursFromNow * 60 * 60 * 1_000);
  date.setMinutes(0, 0, 0);
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 16);
}

function fieldError(error: unknown, field: string): string | undefined {
  return error instanceof ApiClientError
    ? error.details.fieldErrors?.[field]?.[0]
    : undefined;
}

function errorMessage(error: unknown): string {
  return error instanceof ApiClientError
    ? error.message
    : "No se ha podido completar la operación";
}

export function EventHub({ initialCode, initialEvents }: EventHubProps) {
  const router = useRouter();
  const [events] = useState(initialEvents);
  const [code, setCode] = useState(initialCode.toUpperCase());
  const [name, setName] = useState("");
  const [startsAt, setStartsAt] = useState(() => defaultLocalDate(1));
  const [endsAt, setEndsAt] = useState(() => defaultLocalDate(5));
  const [createError, setCreateError] = useState<unknown>(null);
  const [joinError, setJoinError] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [copiedEventId, setCopiedEventId] = useState<string | null>(null);

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setCreateError(null);
    setIsCreating(true);
    try {
      const created = await createEvent({
        name,
        startsAt: new Date(startsAt).toISOString(),
        endsAt: new Date(endsAt).toISOString(),
      });
      router.push(`/events/${created.id}`);
    } catch (error) {
      setCreateError(error);
    } finally {
      setIsCreating(false);
    }
  }

  async function handleJoin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setJoinError("");
    setIsJoining(true);
    try {
      const joined = await joinEvent(code);
      router.push(`/events/${joined.id}`);
    } catch (error) {
      setJoinError(errorMessage(error));
    } finally {
      setIsJoining(false);
    }
  }

  async function copyInvitation(event: EventSummaryDto) {
    if (!event.inviteCode) {
      return;
    }
    const url = `${window.location.origin}/events?code=${event.inviteCode}`;
    await navigator.clipboard.writeText(url);
    setCopiedEventId(event.id);
    window.setTimeout(() => setCopiedEventId(null), 2_000);
  }

  return (
    <div className="space-y-5">
      <section className="rounded-xl border border-secondary bg-secondary p-6 text-secondary-foreground shadow-card sm:p-8">
        <div className="max-w-2xl">
          <span className="inline-flex min-h-8 items-center gap-2 rounded-full bg-white/10 px-3 text-sm font-bold text-accent">
            <CalendarDays aria-hidden="true" className="size-4" />
            Quedadas privadas
          </span>
          <h1 className="mt-4 font-display text-3xl font-black tracking-tight sm:text-4xl">
            Un ranking nuevo para cada evento
          </h1>
          <p className="mt-3 max-w-xl text-base leading-7 text-white/70">
            Crea una quedada, comparte su invitación y comparad solo las
            consumiciones registradas durante ese encuentro.
          </p>
        </div>
      </section>

      <div className="grid items-start gap-5 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Crear evento</CardTitle>
            <CardDescription>
              Tú serás el creador y recibirás un enlace privado para invitar.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={(event) => void handleCreate(event)}>
              <div className="space-y-2">
                <Label htmlFor="event-name">Nombre</Label>
                <Input
                  aria-describedby={fieldError(createError, "name") ? "event-name-error" : undefined}
                  aria-invalid={Boolean(fieldError(createError, "name"))}
                  autoComplete="off"
                  id="event-name"
                  maxLength={80}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="Por ejemplo, Driebes 18/07"
                  required
                  value={name}
                />
                {fieldError(createError, "name") ? (
                  <p className="text-sm font-semibold text-destructive" id="event-name-error" role="alert">
                    {fieldError(createError, "name")}
                  </p>
                ) : null}
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="event-start">Empieza</Label>
                  <Input
                    id="event-start"
                    onChange={(event) => setStartsAt(event.target.value)}
                    required
                    type="datetime-local"
                    value={startsAt}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="event-end">Termina</Label>
                  <Input
                    aria-describedby={fieldError(createError, "endsAt") ? "event-end-error" : undefined}
                    aria-invalid={Boolean(fieldError(createError, "endsAt"))}
                    id="event-end"
                    onChange={(event) => setEndsAt(event.target.value)}
                    required
                    type="datetime-local"
                    value={endsAt}
                  />
                  {fieldError(createError, "endsAt") ? (
                    <p className="text-sm font-semibold text-destructive" id="event-end-error" role="alert">
                      {fieldError(createError, "endsAt")}
                    </p>
                  ) : null}
                </div>
              </div>
              {createError && !fieldError(createError, "name") && !fieldError(createError, "endsAt") ? (
                <Alert variant="error">{errorMessage(createError)}</Alert>
              ) : null}
              <Button aria-busy={isCreating} className="w-full sm:w-auto" disabled={isCreating} type="submit">
                {isCreating ? (
                  <LoaderCircle aria-hidden="true" className="size-4 animate-spin" />
                ) : (
                  <Plus aria-hidden="true" className="size-4" />
                )}
                {isCreating ? "Creando…" : "Crear evento"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Unirme a un evento</CardTitle>
            <CardDescription>
              Introduce el código de 10 caracteres que te ha compartido el creador.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={(event) => void handleJoin(event)}>
              <div className="space-y-2">
                <Label htmlFor="invite-code">Código de invitación</Label>
                <Input
                  aria-describedby={joinError ? "invite-code-error" : "invite-code-help"}
                  aria-invalid={Boolean(joinError)}
                  autoCapitalize="characters"
                  autoComplete="off"
                  className="font-mono uppercase tracking-[0.18em]"
                  id="invite-code"
                  maxLength={10}
                  onChange={(event) => setCode(event.target.value.toUpperCase())}
                  placeholder="ABC123DEFG"
                  required
                  value={code}
                />
                <p className="text-sm text-muted-foreground" id="invite-code-help">
                  También puedes abrir directamente el enlace de invitación.
                </p>
                {joinError ? (
                  <p className="text-sm font-semibold text-destructive" id="invite-code-error" role="alert">
                    {joinError}
                  </p>
                ) : null}
              </div>
              <Button aria-busy={isJoining} className="w-full sm:w-auto" disabled={isJoining || code.length !== 10} type="submit" variant="outline">
                {isJoining ? (
                  <LoaderCircle aria-hidden="true" className="size-4 animate-spin" />
                ) : (
                  <TicketCheck aria-hidden="true" className="size-4" />
                )}
                {isJoining ? "Uniéndome…" : "Unirme"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

      <section aria-labelledby="my-events-title">
        <div className="mb-4">
          <h2 className="font-display text-2xl font-black tracking-tight" id="my-events-title">
            Mis eventos
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Solo aparecen las quedadas que has creado o a las que te has unido.
          </p>
        </div>
        {events.length === 0 ? (
          <Card className="grid min-h-52 place-items-center border-dashed p-6 text-center">
            <div>
              <CalendarDays aria-hidden="true" className="mx-auto size-8 text-muted-foreground" />
              <p className="mt-3 font-bold">Todavía no tienes eventos</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Crea el primero o usa un código de invitación.
              </p>
            </div>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {events.map((event) => (
              <Card className="flex min-w-0 flex-col p-5" key={event.id}>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <span className="inline-flex min-h-7 items-center rounded-full bg-accent/35 px-2.5 text-xs font-extrabold text-foreground">
                      {statusLabels[event.status]}
                    </span>
                    <h3 className="mt-3 truncate font-display text-xl font-black" title={event.name}>
                      {event.name}
                    </h3>
                  </div>
                  <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-muted text-primary">
                    <CalendarDays aria-hidden="true" className="size-5" />
                  </span>
                </div>
                <div className="mt-4 space-y-2 text-sm text-muted-foreground">
                  <p className="flex items-start gap-2">
                    <Clock3 aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
                    <span>{formatEventDate(event.startsAt)} — {formatEventDate(event.endsAt)}</span>
                  </p>
                  <p className="flex items-center gap-2">
                    <UsersRound aria-hidden="true" className="size-4" />
                    {event.memberCount} {event.memberCount === 1 ? "participante" : "participantes"}
                  </p>
                </div>
                <p className="mt-4 font-display text-3xl font-black tabular-nums">
                  {event.totalBeers}
                  <span className="ml-2 font-sans text-sm font-semibold text-muted-foreground">
                    consumiciones
                  </span>
                </p>
                <div className="mt-5 flex flex-wrap gap-2">
                  <Link className="inline-flex min-h-11 flex-1 items-center justify-center rounded-lg bg-primary px-4 text-sm font-bold text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2" href={`/home?eventId=${event.id}`}>
                    Abrir contador
                  </Link>
                  <Link
                    className="inline-flex min-h-11 items-center justify-center rounded-lg border border-border bg-card px-3 text-sm font-bold text-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    href={`/competition?eventId=${event.id}`}
                  >
                    Ver análisis
                  </Link>
                  {event.inviteCode ? (
                    <Button aria-label={`Copiar invitación de ${event.name}`} onClick={() => void copyInvitation(event)} variant="outline">
                      {copiedEventId === event.id ? (
                        <CheckCircle2 aria-hidden="true" className="size-4" />
                      ) : (
                        <Copy aria-hidden="true" className="size-4" />
                      )}
                      <span className="sr-only sm:not-sr-only">
                        {copiedEventId === event.id ? "Copiado" : "Invitar"}
                      </span>
                    </Button>
                  ) : null}
                </div>
              </Card>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
