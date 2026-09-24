"use client";

import { useActionState, useMemo, useState } from "react";
import Link from "next/link";
import { signUpRequest, type AuthActionState } from "@/app/(auth)/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const initialState: AuthActionState = { error: null, notice: null };

export type SignupOrgOption = {
  id: string;
  name: string;
  slug: string;
};

export type SignupClubOption = {
  organizationId: string;
  clubId: string;
  clubName: string;
};

type SignupFormProps = {
  organizations: SignupOrgOption[];
  clubs: SignupClubOption[];
  defaultOrgSlug?: string;
};

export function SignupForm({
  organizations,
  clubs,
  defaultOrgSlug,
}: SignupFormProps) {
  const [state, formAction, pending] = useActionState(
    signUpRequest,
    initialState
  );
  const defaultOrgId =
    organizations.find((o) => o.slug === defaultOrgSlug)?.id ??
    organizations[0]?.id ??
    "";
  const [orgId, setOrgId] = useState(defaultOrgId);

  const clubsForOrg = useMemo(
    () => clubs.filter((c) => c.organizationId === orgId),
    [clubs, orgId]
  );

  if (organizations.length === 0) {
    return (
      <div className="space-y-3 text-sm text-muted-foreground">
        <p>
          Todavía no hay ligas públicas para solicitar acceso. Cuando el
          administrador active una organización, podrás registrarte aquí.
        </p>
        <Link href="/" className="font-medium text-foreground underline">
          Volver a la vista pública
        </Link>
      </div>
    );
  }

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <p className="text-sm text-muted-foreground">
        La cuenta queda pendiente hasta que el administrador la apruebe. Solo
        Delegado de equipo y Árbitro. Los jugadores no se registran aquí.
      </p>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="full_name">Nombre completo</Label>
        <Input
          id="full_name"
          name="full_name"
          required
          maxLength={120}
          placeholder="Tu nombre"
          className="rounded-sm bg-white"
          disabled={pending}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="username">Usuario</Label>
          <Input
            id="username"
            name="username"
            required
            maxLength={40}
            autoComplete="username"
            placeholder="usuario"
            className="rounded-sm bg-white"
            disabled={pending}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="email">Correo</Label>
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            placeholder="tu@liga.mx"
            className="rounded-sm bg-white"
            disabled={pending}
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="phone">Teléfono</Label>
          <Input
            id="phone"
            name="phone"
            type="tel"
            autoComplete="tel"
            maxLength={30}
            placeholder="opcional"
            className="rounded-sm bg-white"
            disabled={pending}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="organization_id">Liga</Label>
          <select
            id="organization_id"
            name="organization_id"
            required
            value={orgId}
            onChange={(e) => setOrgId(e.target.value)}
            className="h-8 w-full rounded-sm border border-input bg-white px-2.5 text-sm"
            disabled={pending}
          >
            {organizations.map((org) => (
              <option key={org.id} value={org.id}>
                {org.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="club_id">Empresa / club</Label>
          <select
            id="club_id"
            name="club_id"
            className="h-8 w-full rounded-sm border border-input bg-white px-2.5 text-sm"
            disabled={pending || clubsForOrg.length === 0}
            defaultValue=""
          >
            <option value="">
              {clubsForOrg.length === 0
                ? "Sin clubs aún"
                : "Selecciona (opcional para árbitro)"}
            </option>
            {clubsForOrg.map((club) => (
              <option key={club.clubId} value={club.clubId}>
                {club.clubName}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="requested_role">Rol solicitado</Label>
          <select
            id="requested_role"
            name="requested_role"
            required
            defaultValue="team_manager"
            className="h-8 w-full rounded-sm border border-input bg-white px-2.5 text-sm"
            disabled={pending}
          >
            <option value="team_manager">Delegado de equipo</option>
            <option value="referee">Árbitro o Árbitra</option>
          </select>
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="password">Contraseña</Label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
          className="rounded-sm bg-white"
          disabled={pending}
        />
        <p className="text-xs text-muted-foreground">Mínimo 8 caracteres.</p>
      </div>

      {state.error ? (
        <p
          role="alert"
          className="rounded-sm border border-destructive/40 bg-white px-3 py-2 text-sm text-destructive"
        >
          {state.error}
        </p>
      ) : null}

      {state.notice ? (
        <p
          role="status"
          className="rounded-sm border border-border bg-secondary px-3 py-2 text-sm text-foreground"
        >
          {state.notice}
        </p>
      ) : null}

      <div className="flex justify-end">
        <Button
          type="submit"
          disabled={pending}
          className="rounded-sm bg-[#00B7FF] text-[#0A0A0A] hover:bg-[#0A0A0A] hover:text-white"
        >
          {pending ? "Enviando…" : "Enviar solicitud"}
        </Button>
      </div>

      <p className="text-sm text-muted-foreground">
        ¿Ya tienes cuenta?{" "}
        <Link
          href="/login"
          className="font-medium text-foreground underline-offset-4 hover:underline"
        >
          Inicia sesión
        </Link>
      </p>
    </form>
  );
}
