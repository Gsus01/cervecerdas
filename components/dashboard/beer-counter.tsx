import { Beer, LoaderCircle, Plus, TrendingUp } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { UserDto } from "@/lib/types/api";

interface BeerCounterProps {
  user: UserDto;
  position?: number;
  isAdding: boolean;
  onAddBeer: () => void;
}

export function BeerCounter({
  user,
  position,
  isAdding,
  onAddBeer,
}: BeerCounterProps) {
  return (
    <Card className="relative isolate min-h-[310px] overflow-hidden border-secondary bg-secondary text-secondary-foreground">
      <div className="absolute -right-16 -top-20 -z-10 size-64 rounded-full bg-accent/10" />
      <div className="absolute -bottom-28 right-20 -z-10 size-52 rounded-full border border-white/10" />

      <div className="flex h-full flex-col p-6 sm:p-8">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-bold text-white/65">Tu contador</p>
            <h1 className="mt-1 font-display text-2xl font-extrabold tracking-tight sm:text-3xl">
              Hola, {user.username}
            </h1>
          </div>
          <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-white/10 text-accent">
            <Beer aria-hidden="true" className="size-6" strokeWidth={2.2} />
          </span>
        </div>

        <div className="mt-7 flex items-end gap-3">
          <output
            aria-label={`${user.beerCount} ${user.beerCount === 1 ? "cerveza registrada" : "cervezas registradas"}`}
            className="font-display text-7xl font-black leading-none tracking-[-0.06em] text-white tabular-nums sm:text-8xl"
          >
            {user.beerCount}
          </output>
          <span className="pb-2 text-sm font-bold text-white/60">
            {user.beerCount === 1 ? "cerveza" : "cervezas"}
          </span>
        </div>

        <div className="mt-auto flex flex-col gap-4 pt-8 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-h-11 items-center gap-2 text-sm text-white/70">
            <TrendingUp aria-hidden="true" className="size-4 text-accent" />
            {position ? `Puesto ${position} en la clasificación` : "Calculando tu puesto"}
          </div>
          <Button
            aria-busy={isAdding}
            className="bg-accent text-accent-foreground shadow-lg shadow-black/15 hover:bg-accent/90 sm:min-w-52"
            disabled={isAdding}
            onClick={onAddBeer}
            size="lg"
          >
            {isAdding ? (
              <LoaderCircle aria-hidden="true" className="size-5 animate-spin" />
            ) : (
              <Plus aria-hidden="true" className="size-5" strokeWidth={3} />
            )}
            {isAdding ? "Registrando…" : "Registrar cerveza"}
          </Button>
        </div>
      </div>
    </Card>
  );
}
