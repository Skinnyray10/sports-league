# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

**Usuario principal:** el administrador de la organización. Es quien configura la liga y el único que crea, edita o elimina partidos, clubes, divisiones y equipos.

| Rol | Responsabilidad |
|---|---|
| **Administrador** (`admin`) | Configuración, clubes, torneos/divisiones/grupos, equipos, calendario (crear/aplazar/cancelar/reprogramar), asignación de árbitros, aprobación y elegibilidad de credenciales. |
| **Delegado de equipo** (`team_manager`) | Alta y edición de jugadores de *su* equipo (`memberships.team_id`) mientras estén pendientes; ve credenciales e imprime; lee cédulas de sus partidos. |
| **Árbitro** (`referee`) | Cédula de partidos asignados (`matches.referee_id`): participantes, eventos, cierre con marcador calculado. |

**Escenas:**

- **Planeación (laptop, admin):** torneos, divisiones, jornada, aplazamientos.
- **Captura (celular, árbitro):** cédula en la cancha.
- **Plantilla (delegado):** registro de jugadores y credencial.

El rol `league_manager` **ya no existe**.

## Product Purpose

Operar una liga multideporte: clubes → equipos por deporte+rama+categoría (+grupo), credenciales con foto/aprobación/elegibilidad, calendario con jornada y sede, cédula de árbitro con eventos por jugador, y tabla de posiciones derivada.

## Positioning

**El deporte es configuración.** Catálogo global (`sports.key`) + overrides por org (`org_sports`: puntos, JEG/JEP, `draw_requires_shootout`). Ramas (incl. Mixto) y categorías por organización.

**La tabla se deriva.** Vista `standings` con columnas neutras; UI usa `STANDINGS_COLUMNS[sportKey]`.

**Credencial válida** solo si status=`aprobado` y eligibility=`elegible`. Folio + QR público (`validate_credential`).

**Cédula:** score se calcula al cerrar (eventos o sets); empate en soccer/7x7 exige `shootout_winner_team_id` (J.E.G.); cédula queda bloqueada.

## Operating Context

Flujo: crear org → configurar deportes/ramas/categorías → clubes → torneo → divisiones/grupos → equipos → invitaciones a delegados/árbitros → delegado registra jugadores → admin aprueba/elegibilidad → admin programa partidos y asigna árbitro → árbitro cierra cédula → posiciones.

Vista pública primero: `/` abre la consulta sin sesión (`/p/[orgSlug]` si hay org pública). Registro (`/signup`) solo Delegado/Árbitro → solicitud pendiente hasta que admin apruebe en Solicitudes. Login → admin panel, delegado jugadores, árbitro cédula. Jugadores no se auto-registran.

## Capabilities and Constraints

- Multi-tenant por `organization_id` + RLS.
- Roles: solo `admin`, `team_manager`, `referee`.
- Deportes seed: soccer, futbol_7x7, basquetbol, softbol, tochito, voleibol.
- Estados de partido: programado, en_vivo, finalizado, aplazado, cancelado.
- Storage: `player-photos`, `protest-evidence` (ver `supabase/RESET.md`).
- Idioma: español MX de tú. Glosario en `src/lib/labels.ts`.

## Evidence on Hand

- Migraciones reescritas `0001_init.sql` + `0002_org_invites.sql`.
- Sin datos reales de marca; no fabricar nombres de ligas/equipos.

## Product Principles

1. El deporte es dato, no código.
2. Los números se derivan.
3. La base manda sobre permisos (admin calendariza; árbitro cédula; delegado plantilla).
4. Dos escenas (escritorio / cancha) de primera clase.
5. Aplazamientos y cancelaciones son parte del modelo (con historial).
6. Multi-tenant listo aunque hoy opere una sola liga.
