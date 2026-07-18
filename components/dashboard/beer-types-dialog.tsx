"use client";

import { ImagePlus, LoaderCircle, Plus, X } from "lucide-react";
import Image from "next/image";
import { FormEvent, KeyboardEvent, useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ApiClientError, createBeerType } from "@/lib/http/api-client";
import type { BeerTypeDto } from "@/lib/types/api";
import { MAX_BEER_TYPE_PHOTO_BYTES } from "@/lib/validation/beer";

interface BeerTypesDialogProps {
  beerTypes: BeerTypeDto[];
  isOpen: boolean;
  onClose: () => void;
  onCreated: (beerType: BeerTypeDto) => void;
}

const acceptedPhotoTypes = new Set(["image/jpeg", "image/png", "image/webp"]);

function messageFromError(error: unknown): string {
  return error instanceof ApiClientError
    ? error.message
    : "No se ha podido guardar el tipo de cerveza";
}

export function BeerTypesDialog({
  beerTypes,
  isOpen,
  onClose,
  onCreated,
}: BeerTypesDialogProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const nameRef = useRef<HTMLInputElement>(null);
  const [name, setName] = useState("");
  const [photoDataUrl, setPhotoDataUrl] = useState("");
  const [nameError, setNameError] = useState("");
  const [photoError, setPhotoError] = useState("");
  const [submitError, setSubmitError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const previousFocus = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    nameRef.current?.focus();

    return () => {
      document.body.style.overflow = previousOverflow;
      previousFocus?.focus();
    };
  }, [isOpen]);

  function closeDialog() {
    if (!isSaving) {
      onClose();
    }
  }

  function handleDialogKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === "Escape") {
      event.preventDefault();
      closeDialog();
      return;
    }

    if (event.key !== "Tab") {
      return;
    }

    const focusable = dialogRef.current?.querySelectorAll<HTMLElement>(
      'button:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])',
    );
    if (!focusable?.length) {
      return;
    }

    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (!first || !last) {
      return;
    }
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  function validateName(value: string): boolean {
    const trimmedName = value.trim();
    const error =
      trimmedName.length === 0
        ? "El nombre es obligatorio"
        : trimmedName.length > 50
          ? "El nombre no puede superar 50 caracteres"
          : "";
    setNameError(error);
    return !error;
  }

  function handlePhotoChange(file: File | undefined) {
    setPhotoDataUrl("");
    setPhotoError("");

    if (!file) {
      return;
    }
    if (!acceptedPhotoTypes.has(file.type)) {
      setPhotoError("Selecciona una imagen JPG, PNG o WebP");
      return;
    }
    if (file.size > MAX_BEER_TYPE_PHOTO_BYTES) {
      setPhotoError("La foto no puede superar 1 MB");
      return;
    }

    const reader = new FileReader();
    reader.addEventListener("load", () => {
      if (typeof reader.result === "string") {
        setPhotoDataUrl(reader.result);
      }
    });
    reader.addEventListener("error", () => {
      setPhotoError("No se ha podido leer la foto seleccionada");
    });
    reader.readAsDataURL(file);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const isNameValid = validateName(name);
    const nextPhotoError = photoDataUrl ? "" : "Selecciona una foto";
    setPhotoError(nextPhotoError);
    setSubmitError("");

    if (!isNameValid || nextPhotoError) {
      (isNameValid ? document.getElementById("beer-type-photo") : nameRef.current)?.focus();
      return;
    }

    setIsSaving(true);
    try {
      const createdBeerType = await createBeerType(name.trim(), photoDataUrl);
      onCreated(createdBeerType);
      setName("");
      setPhotoDataUrl("");
      setNameError("");
      setPhotoError("");
      onClose();
    } catch (error) {
      setSubmitError(messageFromError(error));
    } finally {
      setIsSaving(false);
    }
  }

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-secondary/60 p-4 backdrop-blur-sm sm:p-6">
      <div
        aria-describedby="beer-types-description"
        aria-labelledby="beer-types-title"
        aria-modal="true"
        className="my-auto w-full max-w-2xl rounded-2xl border border-border bg-card shadow-lift"
        onKeyDown={handleDialogKeyDown}
        ref={dialogRef}
        role="dialog"
      >
        <div className="flex items-start justify-between gap-4 border-b border-border p-5 sm:p-6">
          <div>
            <h2 className="font-display text-xl font-bold" id="beer-types-title">
              Tipos de cerveza
            </h2>
            <p
              className="mt-1 text-sm leading-6 text-muted-foreground"
              id="beer-types-description"
            >
              Añade los tipos disponibles para poder seleccionarlos al registrar.
            </p>
          </div>
          <Button
            aria-label="Cerrar tipos de cerveza"
            disabled={isSaving}
            onClick={closeDialog}
            size="sm"
            variant="ghost"
          >
            <X aria-hidden="true" className="size-5" />
          </Button>
        </div>

        <div className="grid gap-6 p-5 sm:grid-cols-[minmax(0,1fr)_minmax(0,0.9fr)] sm:p-6">
          <form className="space-y-4" noValidate onSubmit={handleSubmit}>
            <div className="space-y-2">
              <Label htmlFor="beer-type-name">Nombre</Label>
              <Input
                aria-describedby={nameError ? "beer-type-name-error" : undefined}
                aria-invalid={Boolean(nameError)}
                autoComplete="off"
                id="beer-type-name"
                maxLength={50}
                onBlur={(event) => validateName(event.target.value)}
                onChange={(event) => {
                  setName(event.target.value);
                  if (nameError) {
                    validateName(event.target.value);
                  }
                }}
                placeholder="Ej. IPA"
                ref={nameRef}
                value={name}
              />
              {nameError ? (
                <p className="text-sm font-medium text-destructive" id="beer-type-name-error" role="alert">
                  {nameError}
                </p>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label htmlFor="beer-type-photo">Foto</Label>
              <Input
                accept="image/jpeg,image/png,image/webp"
                aria-describedby="beer-type-photo-help beer-type-photo-error"
                aria-invalid={Boolean(photoError)}
                className="cursor-pointer py-2 file:mr-3 file:rounded-md file:border-0 file:bg-muted file:px-3 file:py-1 file:text-sm file:font-bold file:text-foreground"
                id="beer-type-photo"
                onChange={(event) => handlePhotoChange(event.target.files?.[0])}
                type="file"
              />
              <p className="text-xs leading-5 text-muted-foreground" id="beer-type-photo-help">
                JPG, PNG o WebP. Máximo 1 MB.
              </p>
              {photoError ? (
                <p className="text-sm font-medium text-destructive" id="beer-type-photo-error" role="alert">
                  {photoError}
                </p>
              ) : null}
            </div>

            {photoDataUrl ? (
              <div className="relative aspect-[16/9] overflow-hidden rounded-xl border border-border bg-muted">
                <Image
                  alt="Vista previa del tipo de cerveza"
                  className="object-cover"
                  fill
                  sizes="(max-width: 640px) 100vw, 320px"
                  src={photoDataUrl}
                  unoptimized
                />
              </div>
            ) : (
              <div className="grid aspect-[16/9] place-items-center rounded-xl border border-dashed border-input bg-muted/50 text-muted-foreground">
                <div className="text-center">
                  <ImagePlus aria-hidden="true" className="mx-auto size-6" />
                  <p className="mt-2 text-xs font-bold">Vista previa</p>
                </div>
              </div>
            )}

            {submitError ? (
              <p className="text-sm font-medium text-destructive" role="alert">
                {submitError}
              </p>
            ) : null}

            <Button aria-busy={isSaving} className="w-full" disabled={isSaving} type="submit">
              {isSaving ? (
                <LoaderCircle aria-hidden="true" className="size-4 animate-spin" />
              ) : (
                <Plus aria-hidden="true" className="size-4" />
              )}
              {isSaving ? "Guardando…" : "Añadir tipo"}
            </Button>
          </form>

          <section aria-labelledby="available-types-title">
            <h3 className="text-sm font-bold" id="available-types-title">
              Tipos disponibles ({beerTypes.length})
            </h3>
            {beerTypes.length === 0 ? (
              <div className="mt-3 grid min-h-36 place-items-center rounded-xl border border-dashed border-border px-5 text-center">
                <p className="text-sm leading-6 text-muted-foreground">
                  Aún no hay tipos. Añade el primero con el formulario.
                </p>
              </div>
            ) : (
              <ul className="mt-3 max-h-72 space-y-2 overflow-y-auto pr-1">
                {beerTypes.map((beerType) => (
                  <li className="flex items-center gap-3 rounded-xl border border-border p-2" key={beerType.id}>
                    <span className="relative size-12 shrink-0 overflow-hidden rounded-lg bg-muted">
                      <Image
                        alt=""
                        className="object-cover"
                        fill
                        sizes="48px"
                        src={beerType.photoDataUrl}
                        unoptimized
                      />
                    </span>
                    <span className="min-w-0 break-words text-sm font-bold">{beerType.name}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
