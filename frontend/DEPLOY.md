# Deploy en Hostinger Business (SSR)

Esta app es **Next.js en modo servidor**. No uses sitio estático ni `output: 'export'`.

## Requisitos

- Node.js **22** (o al menos 20.9+)
- Proyecto Supabase distinto del de pruebas, o el mismo solo después de limpiar el admin demo

## Campos en hPanel

| Campo | Valor |
| --- | --- |
| Carpeta de la aplicación | `frontend` |
| Framework | Next.js |
| Versión de Node | 22 |
| Comando de build | `npm run build` |
| Directorio de salida | `.next` |
| Entry file | *(dejar vacío)* |
| Comando de arranque | `npm run start` (si el panel lo pide) |

## Variables de entorno

Copia desde `.env.example` y pega en el panel:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_SITE_URL` — URL pública del sitio, sin barra final (ej. `https://tudominio.com`)

No hace falta (ni se usa) la service role key en este frontend.

## Después del build

Hostinger debe servir con `next start` contra la carpeta `.next` generada. Si el arranque se queda corto de memoria, se puede valorar `output: 'standalone'` más adelante; no está activado en este repo todavía.
