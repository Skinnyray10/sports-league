"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { PlusIcon } from "lucide-react";
import { createTeam } from "@/app/(app)/[orgSlug]/teams/actions";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type CreateTeamDialogProps = {
  orgSlug: string;
};

export function CreateTeamDialog({ orgSlug }: CreateTeamDialogProps) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [pending, startTransition] = React.useTransition();

  function onSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const result = await createTeam(orgSlug, formData);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setOpen(false);
      router.refresh();
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button className="rounded-[2px] bg-[#00B7FF] text-[#0A0A0A] hover:bg-[#0A0A0A] hover:text-white" />
        }
      >
        <PlusIcon data-icon="inline-start" />
        Add team
      </DialogTrigger>
      <DialogContent className="rounded-[4px] sm:max-w-md" showCloseButton>
        <DialogHeader>
          <DialogTitle>Add team</DialogTitle>
          <DialogDescription>
            Create a team in this organization. You can enroll it in tournaments
            next.
          </DialogDescription>
        </DialogHeader>
        <form action={onSubmit} className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="team-name">Name</Label>
            <Input
              id="team-name"
              name="name"
              required
              maxLength={80}
              placeholder="e.g. Norte FC"
              className="rounded-[4px]"
              disabled={pending}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="team-logo">Logo URL (optional)</Label>
            <Input
              id="team-logo"
              name="logo_url"
              type="url"
              placeholder="https://"
              className="rounded-[4px]"
              disabled={pending}
            />
          </div>
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
              type="submit"
              className="rounded-[2px] bg-[#00B7FF] text-[#0A0A0A] hover:bg-[#0A0A0A] hover:text-white"
              disabled={pending}
            >
              {pending ? "Saving…" : "Create team"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
