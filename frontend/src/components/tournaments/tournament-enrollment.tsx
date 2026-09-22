"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { PlusIcon, XIcon } from "lucide-react";
import {
  enrollTeam,
  unenrollTeam,
} from "@/app/(app)/[orgSlug]/tournaments/actions";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type TeamOption = { id: string; name: string };

type TournamentEnrollmentProps = {
  orgSlug: string;
  tournamentId: string;
  enrolled: TeamOption[];
  available: TeamOption[];
  canManageStaff: boolean;
};

export function TournamentEnrollment({
  orgSlug,
  tournamentId,
  enrolled,
  available,
  canManageStaff,
}: TournamentEnrollmentProps) {
  const router = useRouter();
  const [selectedId, setSelectedId] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [pending, startTransition] = React.useTransition();

  // Al inscribir un equipo desaparece de `available`: la selección vuelve al
  // primero disponible sin sincronizar estado en un efecto.
  const teamId = available.some((t) => t.id === selectedId)
    ? selectedId
    : (available[0]?.id ?? "");

  function onEnroll() {
    if (!teamId) return;
    setError(null);
    startTransition(async () => {
      const result = await enrollTeam(orgSlug, tournamentId, teamId);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      router.refresh();
    });
  }

  function onUnenroll(id: string) {
    setError(null);
    startTransition(async () => {
      const result = await unenrollTeam(orgSlug, tournamentId, id);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      router.refresh();
    });
  }

  return (
    <div className="space-y-4">
      {canManageStaff ? (
        <div className="flex flex-col gap-3 border border-[#D0D5DB] bg-white p-4 sm:flex-row sm:items-end">
          <div className="grid min-w-0 flex-1 gap-2">
            <label className="text-sm font-medium text-[#0A0A0A]">
              Inscribir un equipo
            </label>
            <Select
              value={teamId}
              onValueChange={(value) => setSelectedId(value ?? "")}
              disabled={pending || available.length === 0}
            >
              <SelectTrigger className="w-full rounded-[4px]">
                <SelectValue
                  placeholder={
                    available.length === 0
                      ? "Ya inscribiste a todos los equipos"
                      : "Elige un equipo"
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {available.map((team) => (
                  <SelectItem key={team.id} value={team.id}>
                    {team.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button
            type="button"
            className="rounded-[2px] bg-[#00B7FF] text-[#0A0A0A] hover:bg-[#0A0A0A] hover:text-white"
            disabled={pending || !teamId || available.length === 0}
            onClick={onEnroll}
          >
            <PlusIcon data-icon="inline-start" />
            {pending ? "Inscribiendo…" : "Inscribir"}
          </Button>
        </div>
      ) : null}

      {error ? (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}

      {enrolled.length === 0 ? (
        <div className="border border-dashed border-[#D0D5DB] bg-white px-6 py-10 text-center">
          <p className="font-medium text-[#0A0A0A]">
            Todavía no hay equipos inscritos
          </p>
          <p className="mt-1 text-sm text-[#5C6570]">
            {canManageStaff
              ? "Elige un equipo arriba para inscribirlo en este torneo."
              : "El coordinador de liga los inscribirá cuando abran las inscripciones."}
          </p>
        </div>
      ) : (
        <div className="overflow-hidden border border-[#D0D5DB] bg-white">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="bg-[#E6E9EC] text-[#0A0A0A]">
                  Equipo inscrito
                </TableHead>
                {canManageStaff ? (
                  <TableHead className="bg-[#E6E9EC] text-right text-[#0A0A0A]">
                    Acciones
                  </TableHead>
                ) : null}
              </TableRow>
            </TableHeader>
            <TableBody>
              {enrolled.map((team) => (
                <TableRow key={team.id}>
                  <TableCell className="font-medium text-[#0A0A0A]">
                    {team.name}
                  </TableCell>
                  {canManageStaff ? (
                    <TableCell className="text-right">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="rounded-[2px] text-destructive hover:bg-destructive/10 hover:text-destructive"
                        disabled={pending}
                        onClick={() => onUnenroll(team.id)}
                      >
                        <XIcon data-icon="inline-start" />
                        Quitar
                      </Button>
                    </TableCell>
                  ) : null}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
