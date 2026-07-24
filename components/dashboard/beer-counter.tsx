import { Beer, LoaderCircle, Plus, TrendingUp } from "lucide-react";
import Image from "next/image";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { BeerTypeDto, EventStatus, UserDto } from "@/lib/types/api";

interface BeerCounterProps {
  user: UserDto;
  position?: number;
  isAdding: boolean;
  onAddBeer: () => void;
  beerTypes: BeerTypeDto[];
  selectedBeerTypeId: string;
  onBeerTypeChange: (beerTypeId: string) => void;
  onManageBeerTypes: () => void;
  eventName: string;
  eventStatus: EventStatus;
}

export function BeerCounter({
  user,
  position,
  isAdding,
  onAddBeer,
  beerTypes,
  selectedBeerTypeId,
  onBeerTypeChange,
  onManageBeerTypes,
  eventName,
  eventStatus,
}: BeerCounterProps) {
  const selectedBeerType = beerTypes.find(
    (beerType) => beerType.id === selectedBeerTypeId,
  );

  return (
    <Card className="relative isolate min-h-[310px] overflow-hidden border-secondary bg-secondary text-secondary-foreground">
      <div className="absolute -right-16 -top-20 -z-10 size-64 rounded-full bg-accent/10" />
      <div className="absolute -bottom-28 right-20 -z-10 size-52 rounded-full border border-white/10" />

      <div className="flex h-full flex-col p-6 sm:p-8">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-bold text-white/65">Tu contador en</p>
            <h1 className="mt-1 font-display text-2xl font-extrabold tracking-tight sm:text-3xl">
              {eventName}
            </h1>
            <p className="mt-1 text-sm font-semibold text-white/55">
              {user.username}, esta cuenta solo pertenece a esta quedada.
            </p>
          </div>
          <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-white/10 text-accent">
            <Beer aria-hidden="true" className="size-6" strokeWidth={2.2} />
          </span>
        </div>

        <div className="mt-7 flex items-end gap-3">
          <output
            aria-label={`${user.beerCount} ${user.beerCount === 1 ? "consumición registrada" : "consumiciones registradas"} en ${eventName}`}
            className="font-display text-7xl font-black leading-none tracking-[-0.06em] text-white tabular-nums sm:text-8xl"
          >
            {user.beerCount}
          </output>
          <span className="pb-2 text-sm font-bold text-white/60">
            {user.beerCount === 1 ? "consumición" : "consumiciones"}
          </span>
        </div>

        <div className="mt-auto pt-8">
          <div className="flex min-h-11 items-center gap-2 text-sm text-white/70">
            <TrendingUp aria-hidden="true" className="size-4 text-accent" />
            {position
              ? `Puesto ${position} en el ranking del evento`
              : "Sin consumiciones en este evento"}
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
            <div className="space-y-1.5">
              <label className="text-sm font-bold text-white" htmlFor="beer-type-select">
                Tipo de bebida
              </label>
              <div className="flex gap-2">
                {selectedBeerType ? (
                  <span className="relative size-14 shrink-0 overflow-hidden rounded-xl border border-white/20 bg-white/10">
                    <Image
                      alt=""
                      className="object-cover"
                      fill
                      sizes="56px"
                      src={selectedBeerType.photoDataUrl}
                      unoptimized
                    />
                  </span>
                ) : null}
                <select
                  className="h-14 min-w-0 flex-1 rounded-xl border border-white/25 bg-white/10 px-3 text-base font-bold text-white shadow-sm outline-none transition-[border-color,box-shadow] focus-visible:border-accent focus-visible:ring-2 focus-visible:ring-accent/40 disabled:cursor-not-allowed disabled:opacity-60"
                  disabled={
                    beerTypes.length === 0 ||
                    isAdding ||
                    eventStatus !== "ACTIVE"
                  }
                  id="beer-type-select"
                  onChange={(event) => onBeerTypeChange(event.target.value)}
                  value={selectedBeerTypeId}
                >
                  <option className="text-foreground" value="">
                    {beerTypes.length === 0 ? "No hay tipos disponibles" : "Selecciona un tipo"}
                  </option>
                  {beerTypes.map((beerType) => (
                    <option className="text-foreground" key={beerType.id} value={beerType.id}>
                      {beerType.name}
                    </option>
                  ))}
                </select>
              </div>
              {beerTypes.length === 0 ? (
                <button
                  className="min-h-11 text-left text-sm font-bold text-accent underline decoration-accent/50 underline-offset-4 hover:decoration-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                  onClick={onManageBeerTypes}
                  type="button"
                >
                  Añade un tipo al catálogo compartido
                </button>
              ) : eventStatus !== "ACTIVE" ? (
                <p className="min-h-11 pt-2 text-sm font-bold text-white/70">
                  {eventStatus === "UPCOMING"
                    ? "Podrás registrar cuando empiece el evento."
                    : "Este evento ha finalizado y ya no admite registros."}
                </p>
              ) : null}
            </div>
            <Button
              aria-busy={isAdding}
              className="bg-accent text-accent-foreground shadow-lg shadow-black/15 hover:bg-accent/90 sm:min-w-52"
              disabled={
                isAdding ||
                !selectedBeerTypeId ||
                eventStatus !== "ACTIVE"
              }
              onClick={onAddBeer}
              size="lg"
            >
              {isAdding ? (
                <LoaderCircle aria-hidden="true" className="size-5 animate-spin" />
              ) : (
                <Plus aria-hidden="true" className="size-5" strokeWidth={3} />
              )}
              {isAdding ? "Registrando…" : "Registrar bebida"}
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
}
