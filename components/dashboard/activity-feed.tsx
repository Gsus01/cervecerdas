import { Beer, ChevronLeft, ChevronRight, History } from "lucide-react";
import Image from "next/image";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { BeerLogDto, PageDto } from "@/lib/types/api";

interface ActivityFeedProps {
  logs: PageDto<BeerLogDto>;
  isLoading: boolean;
  onPageChange: (page: number) => void;
}

const dateFormatter = new Intl.DateTimeFormat("es-ES", {
  dateStyle: "short",
  timeStyle: "short",
});

export function ActivityFeed({
  logs,
  isLoading,
  onPageChange,
}: ActivityFeedProps) {
  return (
    <Card aria-labelledby="activity-title" className="h-full">
      <CardHeader className="flex-row items-start justify-between gap-4 space-y-0">
        <div>
          <CardTitle id="activity-title">Actividad reciente</CardTitle>
          <CardDescription>Las últimas rondas, en tu hora local.</CardDescription>
        </div>
        <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-muted text-primary">
          <History aria-hidden="true" className="size-5" />
        </span>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div aria-label="Cargando actividad" className="space-y-3" role="status">
            <Skeleton className="h-16" />
            <Skeleton className="h-16" />
            <Skeleton className="h-16" />
          </div>
        ) : logs.content.length === 0 ? (
          <div className="grid min-h-48 place-items-center rounded-lg border border-dashed border-border text-center">
            <div className="space-y-2 px-5">
              <Beer aria-hidden="true" className="mx-auto size-6 text-muted-foreground" />
              <p className="font-bold">Todavía no hay actividad</p>
              <p className="text-sm text-muted-foreground">
                La primera cerveza registrada aparecerá aquí.
              </p>
            </div>
          </div>
        ) : (
          <ol className="divide-y divide-border">
            {logs.content.map((log) => (
              <li className="flex gap-3 py-3.5 first:pt-0" key={log.id}>
                <span className="relative grid size-10 shrink-0 place-items-center overflow-hidden rounded-full bg-accent/30 text-primary">
                  {log.beerType ? (
                    <Image
                      alt=""
                      className="object-cover"
                      fill
                      sizes="40px"
                      src={log.beerType.photoDataUrl}
                      unoptimized
                    />
                  ) : (
                    <Beer aria-hidden="true" className="size-4" />
                  )}
                </span>
                <div className="min-w-0 pt-0.5">
                  <p className="text-sm leading-5">
                    <span className="font-bold">{log.username}</span> registró {log.quantity} {log.quantity === 1 ? "bebida" : "bebidas"}
                    {log.beerType ? (
                      <span className="font-bold"> · {log.beerType.name}</span>
                    ) : null}
                  </p>
                  <time
                    className="mt-1 block text-xs font-medium text-muted-foreground"
                    dateTime={log.createdAt}
                  >
                    {dateFormatter.format(new Date(log.createdAt))}
                  </time>
                </div>
              </li>
            ))}
          </ol>
        )}

        {logs.totalPages > 1 ? (
          <nav
            aria-label="Paginación del historial"
            className="mt-5 flex items-center justify-between border-t border-border pt-4"
          >
            <Button
              aria-label="Página anterior del historial"
              disabled={logs.page === 0 || isLoading}
              onClick={() => onPageChange(logs.page - 1)}
              size="sm"
              variant="outline"
            >
              <ChevronLeft aria-hidden="true" className="size-4" />
              <span className="hidden sm:inline">Anterior</span>
            </Button>
            <span className="text-xs font-bold text-muted-foreground">
              {logs.page + 1} de {logs.totalPages}
            </span>
            <Button
              aria-label="Página siguiente del historial"
              disabled={logs.page + 1 >= logs.totalPages || isLoading}
              onClick={() => onPageChange(logs.page + 1)}
              size="sm"
              variant="outline"
            >
              <span className="hidden sm:inline">Siguiente</span>
              <ChevronRight aria-hidden="true" className="size-4" />
            </Button>
          </nav>
        ) : null}
      </CardContent>
    </Card>
  );
}
