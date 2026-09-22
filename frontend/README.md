# Sports League · Frontend

App Next.js (App Router) para operar ligas multideporte: organizaciones, equipos, torneos, partidos y tabla de posiciones.

## Requisitos

- Node.js 20+
- Un proyecto de Supabase con las migraciones de `../supabase/migrations/` aplicadas

## Configuración

Crea `frontend/.env.local`:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-anon-key
```

## Desarrollo

```bash
npm install
npm run dev
```

Desde la raíz del repo también funciona `npm run dev`.

## Estructura

```
src/app/(app)/[orgSlug]/   Módulos por organización (teams, tournaments, …)
src/components/            UI por dominio + primitivas shadcn en ui/
src/lib/supabase/          Clientes SSR y browser tipados
src/lib/auth.ts            Sesión (getUser / requireUser)
src/lib/org.ts             Membresías, roles e invitaciones
src/proxy.ts               Refresco de sesión y guardas de ruta
```

Nota: en Next.js 16 el antiguo `middleware.ts` se llama `proxy.ts`.
