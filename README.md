# sports-league

Plataforma de ligas multideporte (Next.js + Supabase).

## Estructura

```
frontend/   # App Next.js (UI, auth, Server Actions)
supabase/   # Migraciones SQL y schema
```

## Frontend

```bash
cd frontend
npm install
npm run dev
```

Copia `frontend/.env.local` con `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY`.

## Base de datos

Aplica las migraciones en `supabase/migrations/` desde el SQL Editor de Supabase (o CLI):

1. `0001_init.sql`
2. `0002_org_invites.sql`
3. y el resto en orden numérico

### Datos demo (solo desarrollo / testing)

Los datos demo viven en [`supabase/seed.sql`](supabase/seed.sql), **no** en las migraciones, así que `supabase db push` nunca los aplica. Crean las ligas demo y tres cuentas (`admin@demo.liga`, `delegado@demo.liga` de FCCF 2 y `arbitro@demo.liga` asignado a FCCF 2 vs ODONTOLOGIA). Las contraseñas están en los comentarios de `seed.sql`; no las publiques.

- Local: `npx supabase db reset` aplica migraciones + seed.
- Proyecto remoto de pruebas (p. ej. el deploy de Render): `psql "$SUPABASE_DB_URL" -f supabase/seed.sql`, o pégalo en el SQL Editor.

Si tu proyecto remoto ya tenía aplicadas las antiguas migraciones demo (`0007_demo_seed`, `20260928232256_demo_delegado`, `20260928233200_demo_referee`), márcalas como revertidas para que el historial coincida (los datos se conservan):

```bash
npx supabase migration repair --status reverted 0007 20260928232256 20260928233200
```

## Corte a producción

Antes de apuntar Hostinger (u otro host) a un proyecto Supabase que haya corrido el seed demo:

1. Preferible: usa un **proyecto Supabase distinto** del de pruebas.
2. Si reutilizas el mismo proyecto, ejecuta a mano
   [`supabase/scripts/remove-demo-admin.sql`](supabase/scripts/remove-demo-admin.sql)
   en el SQL Editor. Borra `admin@demo.liga` y las orgs `interfacultades-demo` /
   `liga-norte-demo`. **No es una migración**; no corre en cada reset.

Ese script es obligatorio el día del corte si el demo estuvo en ese proyecto.
