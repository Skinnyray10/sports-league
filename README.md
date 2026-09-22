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
