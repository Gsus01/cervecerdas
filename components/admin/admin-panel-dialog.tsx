"use client";

import {
  ChevronLeft,
  ChevronRight,
  LoaderCircle,
  Save,
  ShieldCheck,
  Trash2,
  X,
} from "lucide-react";
import { FormEvent, useCallback, useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  ApiClientError,
  deleteAdminBeerLog,
  getAdminOverview,
  updateAdminBeerLog,
} from "@/lib/http/api-client";
import type {
  AdminOverviewDto,
  BeerLogDto,
  BeerTypeDto,
  UserDto,
} from "@/lib/types/api";

interface AdminPanelDialogProps {
  beerTypes: BeerTypeDto[];
  isOpen: boolean;
  onClose: () => void;
  onChanged: () => Promise<void>;
}

function messageFromError(error: unknown): string {
  return error instanceof ApiClientError
    ? error.message
    : "No se ha podido completar la operación";
}

function toLocalDateTime(isoDate: string): string {
  const date = new Date(isoDate);
  const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return localDate.toISOString().slice(0, 16);
}

interface LogEditorProps {
  beerTypes: BeerTypeDto[];
  log: BeerLogDto;
  users: UserDto[];
  onChanged: () => Promise<void>;
  onDeleted: () => Promise<void>;
}

function LogEditor({
  beerTypes,
  log,
  users,
  onChanged,
  onDeleted,
}: LogEditorProps) {
  const [userId, setUserId] = useState(log.userId);
  const [beerTypeId, setBeerTypeId] = useState(log.beerType?.id ?? "");
  const [quantity, setQuantity] = useState(String(log.quantity));
  const [createdAt, setCreatedAt] = useState(toLocalDateTime(log.createdAt));
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsSaving(true);

    try {
      await updateAdminBeerLog(log.id, {
        userId,
        beerTypeId,
        quantity: Number(quantity),
        createdAt: new Date(createdAt).toISOString(),
      });
      await onChanged();
    } catch (operationError) {
      setError(messageFromError(operationError));
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete() {
    if (!window.confirm("¿Eliminar definitivamente este registro de consumo?")) {
      return;
    }

    setError("");
    setIsDeleting(true);
    try {
      await deleteAdminBeerLog(log.id);
      await onDeleted();
    } catch (operationError) {
      setError(messageFromError(operationError));
      setIsDeleting(false);
    }
  }

  return (
    <form
      className="grid gap-3 rounded-xl border border-border bg-background/60 p-4 lg:grid-cols-[1fr_1fr_6rem_12rem_auto] lg:items-end"
      onSubmit={handleSubmit}
    >
      <div className="space-y-1.5">
        <Label htmlFor={`admin-user-${log.id}`}>Persona</Label>
        <select
          className="h-11 w-full rounded-lg border border-input bg-card px-3 text-sm"
          disabled={isSaving || isDeleting}
          id={`admin-user-${log.id}`}
          onChange={(event) => setUserId(event.target.value)}
          value={userId}
        >
          {users.map((user) => (
            <option key={user.id} value={user.id}>{user.username}</option>
          ))}
        </select>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor={`admin-type-${log.id}`}>Bebida</Label>
        <select
          className="h-11 w-full rounded-lg border border-input bg-card px-3 text-sm"
          disabled={isSaving || isDeleting}
          id={`admin-type-${log.id}`}
          onChange={(event) => setBeerTypeId(event.target.value)}
          required
          value={beerTypeId}
        >
          <option value="">Selecciona</option>
          {beerTypes.map((beerType) => (
            <option key={beerType.id} value={beerType.id}>{beerType.name}</option>
          ))}
        </select>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor={`admin-quantity-${log.id}`}>Cantidad</Label>
        <Input
          disabled={isSaving || isDeleting}
          id={`admin-quantity-${log.id}`}
          max={1000}
          min={1}
          onChange={(event) => setQuantity(event.target.value)}
          required
          type="number"
          value={quantity}
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor={`admin-date-${log.id}`}>Fecha y hora</Label>
        <Input
          disabled={isSaving || isDeleting}
          id={`admin-date-${log.id}`}
          onChange={(event) => setCreatedAt(event.target.value)}
          required
          type="datetime-local"
          value={createdAt}
        />
      </div>
      <div className="flex gap-2">
        <Button
          aria-label={`Guardar registro de ${log.username}`}
          disabled={isSaving || isDeleting || !beerTypeId}
          size="sm"
          type="submit"
        >
          {isSaving ? <LoaderCircle className="size-4 animate-spin" /> : <Save className="size-4" />}
        </Button>
        <Button
          aria-label={`Eliminar registro de ${log.username}`}
          disabled={isSaving || isDeleting}
          onClick={() => void handleDelete()}
          size="sm"
          variant="destructive"
        >
          {isDeleting ? <LoaderCircle className="size-4 animate-spin" /> : <Trash2 className="size-4" />}
        </Button>
      </div>
      {error ? <p className="text-sm font-medium text-destructive lg:col-span-5" role="alert">{error}</p> : null}
    </form>
  );
}

export function AdminPanelDialog({
  beerTypes,
  isOpen,
  onClose,
  onChanged,
}: AdminPanelDialogProps) {
  const [overview, setOverview] = useState<AdminOverviewDto | null>(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const loadOverview = useCallback(async (page = 0) => {
    setIsLoading(true);
    setError("");
    try {
      setOverview(await getAdminOverview(page));
    } catch (operationError) {
      setError(messageFromError(operationError));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    let isCancelled = false;
    getAdminOverview(0)
      .then((nextOverview) => {
        if (!isCancelled) {
          setOverview(nextOverview);
          setError("");
        }
      })
      .catch((operationError: unknown) => {
        if (!isCancelled) {
          setError(messageFromError(operationError));
        }
      });

    return () => {
      isCancelled = true;
    };
  }, [isOpen]);

  async function refreshAfterChange() {
    await Promise.all([loadOverview(overview?.logs.page ?? 0), onChanged()]);
  }

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-secondary/65 p-3 backdrop-blur-sm sm:p-6">
      <div
        aria-labelledby="admin-panel-title"
        aria-modal="true"
        className="mx-auto my-auto w-full max-w-7xl rounded-2xl border border-border bg-card shadow-lift"
        role="dialog"
      >
        <header className="sticky top-0 z-10 flex items-start justify-between gap-4 rounded-t-2xl border-b border-border bg-card p-5 sm:p-6">
          <div className="flex gap-3">
            <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-accent/40 text-primary">
              <ShieldCheck className="size-6" />
            </span>
            <div>
              <h2 className="font-display text-xl font-bold" id="admin-panel-title">Administración</h2>
              <p className="mt-1 text-sm text-muted-foreground">Edita personas, bebida, cantidad y fecha; o elimina registros.</p>
            </div>
          </div>
          <Button aria-label="Cerrar administración" onClick={onClose} size="sm" variant="ghost">
            <X className="size-5" />
          </Button>
        </header>

        <div className="space-y-7 p-5 sm:p-6">
          {error ? <p className="rounded-lg bg-destructive/10 p-3 text-sm font-medium text-destructive" role="alert">{error}</p> : null}

          <section aria-labelledby="admin-users-title">
            <div className="flex items-end justify-between gap-3">
              <div>
                <h3 className="font-display text-lg font-bold" id="admin-users-title">Usuarios</h3>
                <p className="text-sm text-muted-foreground">Totales recalculados desde sus registros.</p>
              </div>
              <span className="text-sm font-bold text-muted-foreground">{overview?.users.length ?? 0} cuentas</span>
            </div>
            <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {overview?.users.map((user) => (
                <article className="rounded-xl border border-border bg-background/60 p-4" key={user.id}>
                  <div className="flex items-center justify-between gap-3">
                    <p className="truncate font-bold" title={user.username}>{user.username}</p>
                    {user.role === "ADMIN" ? <span className="rounded-full bg-accent/45 px-2 py-1 text-[10px] font-extrabold uppercase">Admin</span> : null}
                  </div>
                  <p className="mt-1 truncate text-xs text-muted-foreground" title={user.email}>{user.email}</p>
                  <p className="mt-3 font-display text-2xl font-black tabular-nums">{user.beerCount} <span className="text-xs font-bold text-muted-foreground">bebidas</span></p>
                </article>
              ))}
            </div>
          </section>

          <section aria-labelledby="admin-logs-title">
            <div>
              <h3 className="font-display text-lg font-bold" id="admin-logs-title">Registros de consumo</h3>
              <p className="text-sm text-muted-foreground">Cada cambio actualiza automáticamente el ranking y los contadores.</p>
            </div>

            {isLoading && !overview ? (
              <div className="grid min-h-40 place-items-center" role="status"><LoaderCircle className="size-7 animate-spin text-primary" /></div>
            ) : overview?.logs.content.length ? (
              <div className="mt-4 space-y-3">
                {overview.logs.content.map((log) => (
                  <LogEditor
                    beerTypes={beerTypes}
                    key={`${log.id}-${log.userId}-${log.quantity}-${log.createdAt}-${log.beerType?.id ?? "none"}`}
                    log={log}
                    onChanged={refreshAfterChange}
                    onDeleted={refreshAfterChange}
                    users={overview.users}
                  />
                ))}
              </div>
            ) : (
              <p className="mt-4 rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">No hay registros de consumo.</p>
            )}

            {overview && overview.logs.totalPages > 1 ? (
              <nav aria-label="Paginación de registros administrativos" className="mt-5 flex items-center justify-center gap-4">
                <Button disabled={overview.logs.page === 0 || isLoading} onClick={() => void loadOverview(overview.logs.page - 1)} size="sm" variant="outline"><ChevronLeft className="size-4" />Anterior</Button>
                <span className="text-xs font-bold text-muted-foreground">{overview.logs.page + 1} de {overview.logs.totalPages}</span>
                <Button disabled={overview.logs.page + 1 >= overview.logs.totalPages || isLoading} onClick={() => void loadOverview(overview.logs.page + 1)} size="sm" variant="outline">Siguiente<ChevronRight className="size-4" /></Button>
              </nav>
            ) : null}
          </section>
        </div>
      </div>
    </div>
  );
}
