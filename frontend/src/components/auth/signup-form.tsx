"use client";

import { useActionState, useMemo, useState } from "react";
import Link from "next/link";
import {
  signUpRequest,
  type AuthActionState,
  type AuthField,
} from "@/app/(auth)/actions";
import { FormAlert } from "@/components/auth/form-alert";
import { PasswordInput } from "@/components/auth/password-input";
import { Turnstile } from "@/components/auth/turnstile";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";

const initialState: AuthActionState = { error: null, notice: null };

const fieldClass = "h-11 rounded-full bg-card";
const selectClass = "h-11 rounded-full bg-card px-3";

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
  const [role, setRole] = useState("team_manager");

  const clubsForOrg = useMemo(
    () => clubs.filter((c) => c.organizationId === orgId),
    [clubs, orgId]
  );
  const clubRequired = role === "team_manager";
  const v = state.values ?? {};

  const a11y = (field: AuthField, hintId?: string) => {
    const hasError = Boolean(state.error) && state.field === field;
    const describedBy = [hintId, hasError ? "signup-error" : null]
      .filter(Boolean)
      .join(" ");
    return {
      "aria-invalid": hasError || undefined,
      "aria-describedby": describedBy || undefined,
    };
  };

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
          autoComplete="name"
          placeholder="Tu nombre"
          defaultValue={v.full_name ?? ""}
          className={fieldClass}
          disabled={pending}
          {...a11y("full_name")}
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
            defaultValue={v.username ?? ""}
            className={fieldClass}
            disabled={pending}
            {...a11y("username")}
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
            maxLength={254}
            placeholder="tu@liga.mx"
            defaultValue={v.email ?? ""}
            className={fieldClass}
            disabled={pending}
            {...a11y("email")}
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="phone">
            Teléfono <span className="font-normal text-muted-foreground">(opcional)</span>
          </Label>
          <Input
            id="phone"
            name="phone"
            type="tel"
            autoComplete="tel"
            maxLength={30}
            defaultValue={v.phone ?? ""}
            className={fieldClass}
            disabled={pending}
            {...a11y("phone")}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="organization_id">Liga</Label>
          <NativeSelect
            id="organization_id"
            name="organization_id"
            required
            value={orgId}
            onChange={(e) => setOrgId(e.target.value)}
            className={selectClass}
            disabled={pending}
            {...a11y("organization_id")}
          >
            {organizations.map((org) => (
              <option key={org.id} value={org.id}>
                {org.name}
              </option>
            ))}
          </NativeSelect>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="requested_role">Rol solicitado</Label>
          <NativeSelect
            id="requested_role"
            name="requested_role"
            required
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className={selectClass}
            disabled={pending}
            {...a11y("requested_role")}
          >
            <option value="team_manager">Delegado de equipo</option>
            <option value="referee">Árbitro o Árbitra</option>
          </NativeSelect>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="club_id">
            Empresa / club{" "}
            <span className="font-normal text-muted-foreground">
              {clubRequired ? "(obligatorio)" : "(opcional)"}
            </span>
          </Label>
          <NativeSelect
            key={orgId}
            id="club_id"
            name="club_id"
            required={clubRequired}
            className={selectClass}
            disabled={pending || clubsForOrg.length === 0}
            defaultValue={v.organization_id === orgId ? (v.club_id ?? "") : ""}
            {...a11y("club_id")}
          >
            <option value="">
              {clubsForOrg.length === 0 ? "Sin clubs aún" : "Selecciona tu club"}
            </option>
            {clubsForOrg.map((club) => (
              <option key={club.clubId} value={club.clubId}>
                {club.clubName}
              </option>
            ))}
          </NativeSelect>
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="password">Contraseña</Label>
        <PasswordInput
          id="password"
          name="password"
          autoComplete="new-password"
          required
          minLength={8}
          maxLength={72}
          className={fieldClass}
          disabled={pending}
          {...a11y("password", "password-hint")}
        />
        <p id="password-hint" className="text-xs text-muted-foreground">
          Mínimo 8 caracteres, con letras y números.
        </p>
      </div>

      <Turnstile resetKey={state} />

      <FormAlert id="signup-error" error={state.error} notice={state.notice} />

      <div className="flex justify-end">
        <Button type="submit" disabled={pending} className="h-11 rounded-full">
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
