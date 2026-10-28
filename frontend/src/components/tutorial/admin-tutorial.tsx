"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CheckIcon, TrophyIcon } from "lucide-react";
import { toast } from "sonner";
import { setAdminTutorial } from "@/app/(app)/tutorial-actions";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { AdminTutorialState } from "@/lib/tutorial";
import { cn } from "@/lib/utils";

export type Mission = {
  key: string;
  title: string;
  description: string;
  href: string;
  done: boolean;
};

type AdminTutorialProps = {
  state: AdminTutorialState;
  missions: Mission[];
};

/** Bienvenida (solo la primera vez) + tarjeta de misiones de inicio. */
export function AdminTutorial({ state, missions }: AdminTutorialProps) {
  const router = useRouter();
  const [welcomeOpen, setWelcomeOpen] = React.useState(state === null);
  const [pending, startTransition] = React.useTransition();

  function save(next: AdminTutorialState, message?: string) {
    startTransition(async () => {
      const result = await setAdminTutorial(next);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      if (message) toast.success(message);
      router.refresh();
    });
  }

  const doneCount = missions.filter((m) => m.done).length;
  const allDone = doneCount === missions.length;
  const nextKey = missions.find((m) => !m.done)?.key;

  return (
    <>
      <Dialog
        open={welcomeOpen}
        onOpenChange={(open) => {
          // Cerrar la bienvenida cuenta como «Empezar»: las misiones quedan visibles.
          if (!open) {
            setWelcomeOpen(false);
            save("started");
          }
        }}
      >
        <DialogContent className="sm:max-w-md" showCloseButton={false}>
          <DialogHeader>
            <span
              aria-hidden
              className="mb-2 flex size-12 items-center justify-center rounded-full bg-primary text-primary-foreground"
            >
              <TrophyIcon className="size-6" />
            </span>
            <DialogTitle className="font-heading text-xl font-extrabold">
              ¡Bienvenido a tu liga!
            </DialogTitle>
            <DialogDescription className="text-[0.9375rem]">
              Te guiamos en {missions.length} misiones cortas para dejar todo
              listo: clubes, torneo, equipos, rol de juegos, jornada y
              castigados. Puedes saltarlo cuando quieras.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:flex-row-reverse sm:justify-start">
            <Button
              size="lg"
              disabled={pending}
              onClick={() => {
                setWelcomeOpen(false);
                save("started");
              }}
            >
              Empezar
            </Button>
            <Button
              size="lg"
              variant="ghost"
              disabled={pending}
              onClick={() => {
                setWelcomeOpen(false);
                save("done", "Listo. Puedes ver el tutorial desde tu menú de cuenta.");
              }}
            >
              Saltar tutorial
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <section
        aria-labelledby="misiones-titulo"
        className="rounded-xl border border-border bg-card p-4 md:p-5"
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2
              id="misiones-titulo"
              className="font-heading text-lg font-extrabold tracking-tight"
            >
              {allDone ? "¡Tu liga está lista!" : "Misiones de inicio"}
            </h2>
            <p className="text-sm text-muted-foreground">
              {doneCount} de {missions.length} completadas
            </p>
          </div>
          {!allDone ? (
            <Button
              variant="ghost"
              size="sm"
              disabled={pending}
              onClick={() =>
                save("done", "Listo. Puedes ver el tutorial desde tu menú de cuenta.")
              }
            >
              Saltar tutorial
            </Button>
          ) : null}
        </div>

        <div
          className="mt-3 h-2 overflow-hidden rounded-full bg-muted"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={missions.length}
          aria-valuenow={doneCount}
          aria-label="Avance del tutorial"
        >
          <div
            className="h-full rounded-full bg-primary transition-all duration-500"
            style={{ width: `${(doneCount / missions.length) * 100}%` }}
          />
        </div>

        <ol className="mt-4 flex flex-col gap-2">
          {missions.map((mission, index) => {
            const isNext = mission.key === nextKey;
            return (
              <li
                key={mission.key}
                className={cn(
                  "flex items-center gap-3 rounded-lg border px-3 py-3",
                  isNext ? "border-primary bg-secondary/60" : "border-transparent"
                )}
              >
                <span
                  aria-hidden
                  className={cn(
                    "flex size-8 shrink-0 items-center justify-center rounded-full text-sm font-bold",
                    mission.done
                      ? "bg-primary text-primary-foreground"
                      : "border border-border text-muted-foreground"
                  )}
                >
                  {mission.done ? <CheckIcon className="size-4" /> : index + 1}
                </span>
                <span className="flex min-w-0 flex-1 flex-col">
                  <span
                    className={cn(
                      "text-sm font-semibold",
                      mission.done && "text-muted-foreground line-through"
                    )}
                  >
                    {mission.title}
                    <span className="sr-only">
                      {mission.done ? " (completada)" : ""}
                    </span>
                  </span>
                  {isNext ? (
                    <span className="text-sm text-muted-foreground">
                      {mission.description}
                    </span>
                  ) : null}
                </span>
                {isNext ? (
                  <Button size="sm" render={<Link href={mission.href} />}>
                    Ir ahora
                  </Button>
                ) : null}
              </li>
            );
          })}
        </ol>

        {allDone ? (
          <Button
            size="lg"
            className="mt-4 w-full sm:w-auto"
            disabled={pending}
            onClick={() => save("done", "¡Felicidades! Terminaste el tutorial.")}
          >
            <TrophyIcon data-icon="inline-start" />
            Terminar tutorial
          </Button>
        ) : null}
      </section>
    </>
  );
}
