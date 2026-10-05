"use client";

import * as React from "react";
import { toast } from "sonner";
import type { ActionResult } from "@/lib/action-result";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

type ConfirmDialogProps = {
  /** Elemento que abre el diálogo (normalmente un `<Button />`). Omítelo si controlas `open`. */
  trigger?: React.ReactElement;
  triggerContent?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  title: React.ReactNode;
  description: React.ReactNode;
  /** Contenido extra entre la descripción y los botones (resumen, marcador…). */
  children?: React.ReactNode;
  confirmLabel: string;
  pendingLabel?: string;
  cancelLabel?: string;
  variant?: "destructive" | "default";
  successMessage?: string;
  /** Si devuelve `{ ok: false }`, el error se muestra dentro del diálogo. */
  onConfirm: () => Promise<ActionResult | void>;
  onSuccess?: () => void;
  disabled?: boolean;
};

export function ConfirmDialog({
  trigger,
  triggerContent,
  open: openProp,
  onOpenChange,
  title,
  description,
  children,
  confirmLabel,
  pendingLabel = "Procesando…",
  cancelLabel = "Cancelar",
  variant = "destructive",
  successMessage,
  onConfirm,
  onSuccess,
  disabled,
}: ConfirmDialogProps) {
  const [openState, setOpenState] = React.useState(false);
  const open = openProp ?? openState;
  const [error, setError] = React.useState<string | null>(null);
  const [pending, startTransition] = React.useTransition();

  function setOpen(next: boolean) {
    if (openProp === undefined) setOpenState(next);
    onOpenChange?.(next);
  }

  function handleOpenChange(next: boolean) {
    if (pending) return;
    setOpen(next);
    if (!next) setError(null);
  }

  function confirm() {
    setError(null);
    startTransition(async () => {
      const result = await onConfirm();
      if (result && !result.ok) {
        setError(result.error);
        return;
      }
      setOpen(false);
      if (successMessage) toast.success(successMessage);
      onSuccess?.();
    });
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      {trigger ? (
        <DialogTrigger render={trigger} disabled={disabled}>
          {triggerContent}
        </DialogTrigger>
      ) : null}
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        {children}
        {error ? (
          <p className="text-sm text-destructive" role="alert">
            {error}
          </p>
        ) : null}
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            disabled={pending}
            onClick={() => handleOpenChange(false)}
          >
            {cancelLabel}
          </Button>
          <Button
            type="button"
            variant={variant}
            disabled={pending}
            onClick={confirm}
          >
            {pending ? pendingLabel : confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
