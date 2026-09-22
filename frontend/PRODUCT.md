# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

**Usuario principal:** una sola persona encargada de operar una liga. Hoy no hay un equipo detrás: la misma persona da de alta equipos, arma el calendario y persigue los resultados.

**Dos escenas de uso confirmadas, ambas de primera clase:**

- **Planeación, en laptop:** crear torneos, inscribir equipos, programar la jornada. Sesión larga, con calma.
- **Captura, en celular en la cancha:** el árbitro o el coordinador registra el resultado y el estado del partido en el momento. Sesión corta, de pie, entre partidos.

**Roles que el sistema ya modela** (`memberships`): `admin` (todo dentro de su organización), `league_manager` (torneos, equipos, inscripciones y partidos), `team_manager` (solo su equipo, atado vía `memberships.team_id`) y `referee` (solo resultado y estado de partidos).

## Product Purpose

Operar una liga multideporte de punta a punta: registrar equipos y jugadores, crear torneos, programar partidos, capturar resultados —incluidos deportes por sets— y obtener la tabla de posiciones sin calcularla a mano.

Éxito es que la jornada quede capturada el mismo día y que la tabla sea la fuente de verdad que nadie discuta ni mantenga en una hoja de cálculo paralela.

## Positioning

**El deporte es configuración, no código.** La tabla `sports` guarda `points_win`, `points_draw`, `points_loss`, `allows_draws` y `score_type` (`goals` / `points` / `sets`), así que fútbol, basquetbol, voleibol y tenis conviven en la misma app con sus propios reglamentos, sin una build por deporte ni ramas por caso en la UI.

**La tabla se deriva, no se guarda.** `standings` es una vista calculada desde los partidos finalizados y las reglas del deporte; no hay contadores acumulados que puedan desincronizarse de los resultados.

El posicionamiento comercial todavía no está decidido (ver *Capabilities and Constraints*); lo anterior describe el mecanismo que la implementación ya sostiene, no una promesa de mercado confirmada.

## Operating Context

Flujo real de trabajo: crear la organización → invitar al staff con un link de token → dar de alta equipos (y jugadores) → crear un torneo para un deporte → inscribir equipos → programar partidos → capturar resultado y sets → la tabla se actualiza sola.

Todo vive detrás de autenticación y está aislado por organización. Hoy no existe ninguna superficie sin login.

## Capabilities and Constraints

- **Multi-tenant por organización.** Cada fila de dominio lleva `organization_id` y el aislamiento lo garantiza RLS en Postgres, no la aplicación.
- **El permiso vive en la base.** Las políticas por rol son la autoridad; la UI refleja lo que la base ya permite.
- **Catálogo de deportes global y de solo lectura** para los usuarios de la app (escribe únicamente `service_role`): `futbol`, `basquetbol`, `voleibol`, `tenis`.
- **Torneos:** `format` (default `round_robin`), `legs` 1 o 2, `status` `registration` / `active` / `finished`, `start_date`.
- **Partidos:** `scheduled_at` opcional, `round`, `stage`, `status` `programado` / `en_vivo` / `finalizado` / `suspendido`, marcador local/visitante y `match_sets` para deportes por sets.
- **Jugadores** con alcance de organización; pueden existir sin cuenta de usuario (`profile_id` es nullable).
- **Invitaciones** por token, aceptadas con el RPC `accept_org_invite`.

**Idioma.** El producto se publica en **español de México**, de tú. Existe la posibilidad real de usarlo en ligas de Estados Unidos más adelante, así que la traducción no debe volverse imposible de agregar, pero i18n completo no es un requisito de hoy. Las cadenas viven inline en los componentes; cuando llegue el inglés habrá que extraerlas.

**Glosario.** `src/lib/labels.ts` es la única fuente de los nombres de dominio que ve la persona (roles, estados de partido y de torneo, formatos, deportes, unidad de marcador). Un concepto nuevo se nombra ahí, no en el componente.

**Vocabulario fijo:** organización, equipo, torneo, partido, jornada, fase, cancha o sede, local y visitante, temporada, posiciones. Roles: Administrador, Coordinador de liga, Delegado de equipo, Árbitro.

**Terminología mezclada en la base:** los valores de enum y las columnas de perfil están en español (`programado`, `en_vivo`, `nombre`, `apellido`) mientras que otros campos están en inglés. Es un hecho del esquema, no un error a corregir sin migración.

**Decisiones abiertas, no inventar una respuesta:**

- Si habrá una vista pública sin login para jugadores o espectadores (calendario, tabla). No está decidido.
- Si el producto se vende a ligas externas como SaaS multi-liga. Es una expansión plausible —por eso el aislamiento multi-tenant ya existe— pero hoy hay un solo operador y una sola liga.
- Si habrá cobro, planes o límites por organización.

## Evidence on Hand

- Proyecto de Supabase real conectado, con las migraciones `0001_init.sql` y `0002_org_invites.sql` como esquema de referencia.
- **No hay** datos reales de equipos, logotipos, fotografía, resultados históricos, patrocinadores ni identidad de marca. `teams.logo_url` existe como campo pero no hay assets.
- **No hay** nombre de marca confirmado: "Sports League" es el nombre de trabajo que quedó en el código, no una decisión.
- Trabajo futuro no debe fabricar nombres de ligas, equipos, patrocinadores ni resultados de ejemplo como si fueran reales.

## Product Principles

1. **El deporte es dato, no código.** Una regla de puntaje o un tipo de marcador nuevo entra como fila en `sports`, nunca como una rama más en la UI.
2. **Los números se derivan.** Lo que se puede calcular desde los partidos no se almacena como contador.
3. **La base manda sobre los permisos.** RLS por organización y rol es la autoridad; la interfaz no inventa accesos que la base negaría.
4. **Dos escenas, un producto.** Planear en escritorio y capturar en la cancha desde el celular son caminos iguales de importantes; ninguno es la versión degradada del otro.
5. **Construir para una liga sin cerrarle la puerta a muchas.** El aislamiento multi-tenant se mantiene aunque hoy solo lo use una persona.
