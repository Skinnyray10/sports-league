"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { updateTournament } from "@/app/(app)/[orgSlug]/tournaments/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { TournamentStatus } from "@/types/database";

type SportOption = { id: string; name: string };

type TournamentEditFormProps = {
  orgSlug: string;
  tournamentId: string;
  sports: SportOption[];
  initial: {
    name: string;
    season: string;
    sportId: string;
    format: string;
    legs: number;
    status: TournamentStatus;
    startDate: string | null;
  };
};

function toDateInputValue(iso: string | null): string {
  if (!iso) return "";
  return iso.slice(0, 10);
}

export function TournamentEditForm({
  orgSlug,
  tournamentId,
  sports,
  initial,
}: TournamentEditFormProps) {
  const router = useRouter();
  const [error, setError] = React.useState<string | null>(null);
  const [pending, startTransition] = React.useTransition();
  const [sportId, setSportId] = React.useState(initial.sportId);
  const [format, setFormat] = React.useState(initial.format);
  const [legs, setLegs] = React.useState(String(initial.legs));
  const [status, setStatus] = React.useState(initial.status);

  function onSubmit(formData: FormData) {
    setError(null);
    formData.set("sport_id", sportId);
    formData.set("format", format);
    formData.set("legs", legs);
    formData.set("status", status);

    startTransition(async () => {
      const result = await updateTournament(orgSlug, tournamentId, formData);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      router.refresh();
    });
  }

  return (
    <form action={onSubmit} className="grid max-w-lg gap-4">
      <div className="grid gap-2">
        <Label htmlFor="edit-tournament-name">Name</Label>
        <Input
          id="edit-tournament-name"
          name="name"
          required
          maxLength={100}
          defaultValue={initial.name}
          className="rounded-[4px]"
          disabled={pending}
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="edit-tournament-season">Season</Label>
        <Input
          id="edit-tournament-season"
          name="season"
          required
          maxLength={40}
          defaultValue={initial.season}
          className="rounded-[4px]"
          disabled={pending}
        />
      </div>
      <div className="grid gap-2">
        <Label>Sport</Label>
        <Select
          value={sportId}
          onValueChange={(value) => setSportId(value ?? sportId)}
          disabled={pending}
        >
          <SelectTrigger className="w-full rounded-[4px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {sports.map((sport) => (
              <SelectItem key={sport.id} value={sport.id}>
                {sport.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="grid gap-2">
          <Label>Format</Label>
          <Select
            value={format}
            onValueChange={(value) => setFormat(value ?? format)}
            disabled={pending}
          >
            <SelectTrigger className="w-full rounded-[4px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="round_robin">Round robin</SelectItem>
              <SelectItem value="knockout">Knockout</SelectItem>
              <SelectItem value="groups">Groups</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="grid gap-2">
          <Label>Legs</Label>
          <Select
            value={legs}
            onValueChange={(value) => setLegs(value ?? legs)}
            disabled={pending}
          >
            <SelectTrigger className="w-full rounded-[4px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">Single</SelectItem>
              <SelectItem value="2">Home & away</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="grid gap-2">
        <Label>Status</Label>
        <Select
          value={status}
          onValueChange={(value) =>
            setStatus((value as TournamentStatus) ?? status)
          }
          disabled={pending}
        >
          <SelectTrigger className="w-full rounded-[4px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="registration">Registration</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="finished">Finished</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="grid gap-2">
        <Label htmlFor="edit-tournament-start">Start date (optional)</Label>
        <Input
          id="edit-tournament-start"
          name="start_date"
          type="date"
          defaultValue={toDateInputValue(initial.startDate)}
          className="rounded-[4px]"
          disabled={pending}
        />
      </div>
      {error ? (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}
      <div>
        <Button
          type="submit"
          className="rounded-[2px] bg-[#00B7FF] text-[#0A0A0A] hover:bg-[#0A0A0A] hover:text-white"
          disabled={pending}
        >
          {pending ? "Saving…" : "Save changes"}
        </Button>
      </div>
    </form>
  );
}
