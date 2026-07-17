import { Trophy, Users } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { RankingEntryDto } from "@/lib/types/api";
import { cn } from "@/lib/utils";

interface RankingProps {
  entries: RankingEntryDto[];
  currentUserId: string;
}

export function Ranking({ entries, currentUserId }: RankingProps) {
  return (
    <Card aria-labelledby="ranking-title" className="h-full">
      <CardHeader className="flex-row items-start justify-between gap-4 space-y-0">
        <div>
          <CardTitle id="ranking-title">Clasificación general</CardTitle>
          <CardDescription>Quién lleva más cervezas registradas.</CardDescription>
        </div>
        <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-accent/35 text-primary">
          <Trophy aria-hidden="true" className="size-5" />
        </span>
      </CardHeader>
      <CardContent>
        {entries.length === 0 ? (
          <div className="grid min-h-48 place-items-center rounded-lg border border-dashed border-border text-center">
            <div className="space-y-2 px-5">
              <Users aria-hidden="true" className="mx-auto size-6 text-muted-foreground" />
              <p className="font-bold">Aún no hay participantes</p>
              <p className="text-sm text-muted-foreground">El ranking aparecerá aquí.</p>
            </div>
          </div>
        ) : (
          <div className="overflow-hidden rounded-lg border border-border">
            <table className="w-full table-fixed border-collapse text-sm">
              <caption className="sr-only">
                Clasificación de usuarios por cervezas registradas
              </caption>
              <thead className="bg-muted/70 text-xs uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="w-16 px-3 py-3 text-center font-bold" scope="col">
                    Pos.
                  </th>
                  <th className="px-2 py-3 text-left font-bold" scope="col">
                    Usuario
                  </th>
                  <th className="w-20 px-3 py-3 text-right font-bold" scope="col">
                    Total
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {entries.map((entry) => {
                  const isCurrentUser = entry.userId === currentUserId;
                  return (
                    <tr
                      className={cn(
                        "transition-colors",
                        isCurrentUser ? "bg-accent/20" : "hover:bg-muted/45",
                      )}
                      key={entry.userId}
                    >
                      <td className="px-3 py-3 text-center">
                        <span
                          className={cn(
                            "inline-grid size-8 place-items-center rounded-full text-xs font-extrabold",
                            entry.position === 1
                              ? "bg-accent text-accent-foreground"
                              : "bg-muted text-muted-foreground",
                          )}
                        >
                          {entry.position}
                        </span>
                      </td>
                      <th
                        className="truncate px-2 py-3 text-left font-bold"
                        scope="row"
                        title={entry.username}
                      >
                        {entry.username}
                        {isCurrentUser ? (
                          <span className="ml-2 text-xs font-semibold text-primary">Tú</span>
                        ) : null}
                      </th>
                      <td className="px-3 py-3 text-right font-display text-base font-extrabold tabular-nums">
                        {entry.beerCount}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
