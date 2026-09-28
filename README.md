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

El seed local `0007_demo_seed.sql` crea `admin@demo.liga` / `DemoAdmin123!` y las ligas demo. `20260928232256_demo_delegado.sql` crea `delegado@demo.liga` / `DelegadoDemo123!`, delegado de FCCF 2. `20260928233200_demo_referee.sql` crea `arbitro@demo.liga` / `ArbitroDemo123!` y lo asigna al partido programado FCCF 2 vs ODONTOLOGIA. Se conservan para `db reset`.

## Corte a producción

Antes de apuntar Hostinger (u otro host) a un proyecto Supabase que haya corrido el seed demo:

1. Preferible: usa un **proyecto Supabase distinto** del de pruebas.
2. Si reutilizas el mismo proyecto, ejecuta a mano
   [`supabase/scripts/remove-demo-admin.sql`](supabase/scripts/remove-demo-admin.sql)
   en el SQL Editor. Borra `admin@demo.liga` y las orgs `interfacultades-demo` /
   `liga-norte-demo`. **No es una migración**; no corre en cada reset.

Ese script es obligatorio el día del corte si el demo estuvo en ese proyecto.
