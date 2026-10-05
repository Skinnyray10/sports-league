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

## Seguridad (Supabase Auth y cabeceras)

`next.config.ts` envía CSP, HSTS (solo en producción), `X-Frame-Options: DENY` y oculta `X-Powered-By`. La CSP solo permite imágenes del propio sitio y del host de Supabase: por eso los logos y fotos deben estar en Supabase Storage (las acciones rechazan otras URLs).

En el panel de Supabase (Authentication), aplica lo mismo que declara `supabase/config.toml`:

1. **Contraseñas**: mínimo 8 caracteres con letras y números; activa *Leaked password protection* (plan Pro).
2. **URL Configuration**: `Site URL` = `NEXT_PUBLIC_SITE_URL` y agrega `https://tudominio.com/auth/confirm` a *Redirect URLs* (recuperación de contraseña).
3. **CAPTCHA (recomendado en producción)**: crea un widget en Cloudflare Turnstile, pega la *secret key* en *Attack Protection → Captcha* y la *site key* en `NEXT_PUBLIC_TURNSTILE_SITE_KEY`. Con CAPTCHA activo, el acceso rápido de la barra pública redirige a `/login`.
4. **Rate limits**: revisa *Rate Limits* (correos e intentos de inicio de sesión). La app añade un límite en memoria por instancia como freno extra, no como sustituto.

Migraciones nuevas a aplicar: `0009_team_scope_and_referee_writes.sql` y `0010_security_hardening.sql`. Los datos demo ya no son migraciones: ver `README.md` (sección *Datos demo*).
