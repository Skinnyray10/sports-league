"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { PlusIcon, Trash2Icon } from "lucide-react";
import {
  createCategory,
  deleteCategory,
  updateCategory,
} from "@/app/(app)/[orgSlug]/settings/actions";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export type CategoryRow = {
  id: string;
  name: string;
  sort_order: number;
};

type CategoriesSettingsProps = {
  orgSlug: string;
  categories: CategoryRow[];
};

function CategoryRowForm({
  orgSlug,
  category,
}: {
  orgSlug: string;
  category: CategoryRow;
}) {
  const router = useRouter();
  const [error, setError] = React.useState<string | null>(null);
  const [pending, startTransition] = React.useTransition();

  function onSave(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const result = await updateCategory(orgSlug, category.id, formData);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      toast.success("Categoría guardada.");
      router.refresh();
    });
  }

  return (
    <form
      action={onSave}
      className="grid gap-3 border-b border-border px-4 py-3 last:border-b-0 sm:grid-cols-[1fr_6rem_auto] sm:items-end"
    >
      <div className="grid gap-1.5">
        <Label htmlFor={`cat-name-${category.id}`} className="text-xs">
          Nombre
        </Label>
        <Input
          id={`cat-name-${category.id}`}
          name="name"
          required
          maxLength={60}
          defaultValue={category.name}
          disabled={pending}
        />
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor={`cat-sort-${category.id}`} className="text-xs">
          Orden
        </Label>
        <Input
          id={`cat-sort-${category.id}`}
          name="sort_order"
          type="number"
          step={1}
          defaultValue={category.sort_order}
          disabled={pending}
        />
      </div>
      <div className="flex gap-2">
        <Button
          type="submit"
          variant="outline"
          size="sm"
          disabled={pending}
        >
          {pending ? "…" : "Guardar"}
        </Button>
        <ConfirmDialog
          trigger={
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="text-destructive hover:bg-destructive/10 hover:text-destructive"
              disabled={pending}
            />
          }
          triggerContent={
            <>
              <Trash2Icon data-icon="inline-start" />
              Eliminar
            </>
          }
          title={`¿Eliminar la categoría ${category.name}?`}
          description="No se puede deshacer. Si alguna división la usa, primero tendrás que cambiarla."
          confirmLabel="Eliminar categoría"
          pendingLabel="Eliminando…"
          successMessage="Categoría eliminada."
          onConfirm={() => deleteCategory(orgSlug, category.id)}
          onSuccess={() => router.refresh()}
        />
      </div>
      {error ? (
        <p className="sm:col-span-3 text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}
    </form>
  );
}

export function CategoriesSettings({
  orgSlug,
  categories,
}: CategoriesSettingsProps) {
  const router = useRouter();
  const [error, setError] = React.useState<string | null>(null);
  const [pending, startTransition] = React.useTransition();

  function onCreate(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const result = await createCategory(orgSlug, formData);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      toast.success("Categoría creada.");
      router.refresh();
    });
  }

  return (
    <div className="space-y-4">
      <form
        action={onCreate}
        className="grid gap-3 border border-border bg-card p-4 sm:grid-cols-[1fr_6rem_auto] sm:items-end"
      >
        <div className="grid gap-1.5">
          <Label htmlFor="new-cat-name">Nueva categoría</Label>
          <Input
            id="new-cat-name"
            name="name"
            required
            maxLength={60}
            placeholder="Ej. Libre"
            disabled={pending}
          />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="new-cat-sort">Orden</Label>
          <Input
            id="new-cat-sort"
            name="sort_order"
            type="number"
            step={1}
            defaultValue={categories.length}
            disabled={pending}
          />
        </div>
        <Button
          type="submit"
          disabled={pending}
        >
          <PlusIcon data-icon="inline-start" />
          {pending ? "Creando…" : "Agregar"}
        </Button>
      </form>

      {error ? (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}

      {categories.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Todavía no hay categorías. Agrega la primera arriba.
        </p>
      ) : (
        <div className="overflow-hidden border border-border bg-card">
          {categories.map((category) => (
            <CategoryRowForm
              key={category.id}
              orgSlug={orgSlug}
              category={category}
            />
          ))}
        </div>
      )}
    </div>
  );
}
