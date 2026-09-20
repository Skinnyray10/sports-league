"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Trash2Icon } from "lucide-react";
import { deleteTournament } from "@/app/(app)/[orgSlug]/tournaments/actions";
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

type DeleteTournamentButtonProps = {
  orgSlug: string;
  tournamentId: string;
  tournamentName: string;
};

export function DeleteTournamentButton({
  orgSlug,
  tournamentId,
  tournamentName,
}: DeleteTournamentButtonProps) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [pending, startTransition] = React.useTransition();

  function onConfirm() {
    setError(null);
    startTransition(async () => {
      const result = await deleteTournament(orgSlug, tournamentId);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setOpen(false);
      router.push(`/${orgSlug}/tournaments`);
      router.refresh();
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={<Button variant="destructive" className="rounded-[2px]" />}
      >
        <Trash2Icon data-icon="inline-start" />
        Delete
      </DialogTrigger>
      <DialogContent className="rounded-[4px] sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Delete {tournamentName}?</DialogTitle>
          <DialogDescription>
            This removes the tournament and its team enrollments. Matches that
            still reference it may block deletion.
          </DialogDescription>
        </DialogHeader>
        {error ? (
          <p className="text-sm text-destructive" role="alert">
            {error}
          </p>
        ) : null}
        <DialogFooter className="rounded-b-[4px]">
          <Button
            type="button"
            variant="outline"
            className="rounded-[2px]"
            disabled={pending}
            onClick={() => setOpen(false)}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            className="rounded-[2px]"
            disabled={pending}
            onClick={onConfirm}
          >
            {pending ? "Deleting…" : "Delete tournament"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
