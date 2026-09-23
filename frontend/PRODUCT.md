# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

**Usuario principal:** el administrador de la organización (una sola persona al inicio). Es quien arma el calendario y es el único que puede crear, editar o eliminar partidos y eventos.

**División de trabajo por rol (modelo confirmado):**

| Rol | Responsabilidad |
|---|---|
| **Administrador** (`admin`) | Único que crea, edita y elimina partidos/eventos; calendarización y generación de la jornada. |
| **Delegado de equipo** (`team_manager`) | Da de alta y mantiene a los jugadores de *su* equipo (`memberships.team_id`). |
| **Árbitro** (`referee`) | Reporte del partido: resultado, estado del encuentro, amonestaciones y demás incidencias. |

**Dos escenas de uso, ambas de primera clase:**

- **Planeación, en laptop (administrador):** crear torneos, programar o regenerar la jornada, aplazar o cancelar partidos. Sesión larga, con calma.
- **Captura, en celular en la cancha (árbitro):** registrar resultado e incidencias al terminar el partido. Sesión corta, de pie.

**Rol aún en el esquema pero sin dueño de producto claro:** `league_manager` (Coordinador de liga). Hoy el código le da casi los mismos poderes que al admin sobre torneos/equipos/partidos; eso **contradice** el modelo confirmado. Pendiente decidir si se elimina, se reduce a lectura/inscripciones, o se fusiona con admin.

## Product Purpose

Operar una liga multideporte de punta a punta: registrar equipos y jugadores, crear torneos, programar partidos, capturar resultados —incluidos deportes por sets— y obtener la tabla de posiciones sin calcularla a mano.

Éxito es que la jornada quede capturada el mismo día y que la tabla sea la fuente de verdad que nadie discuta ni mantenga en una hoja de cálculo paralela.

## Positioning

**El deporte es configuración, no código.** La tabla `sports` guarda `points_win`, `points_draw`, `points_loss`, `allows_draws` y `score_type` (`goals` / `points` / `sets`), así que fútbol, basquetbol, voleibol y tenis conviven en la misma app con sus propios reglamentos, sin una build por deporte ni ramas por caso en la UI.

**La tabla se deriva, no se guarda.** `standings` es una vista calculada desde los partidos finalizados y las reglas del deporte; no hay contadores acumulados que puedan desincronizarse de los resultados.

El posicionamiento comercial todavía no está decidido (ver *Capabilities and Constraints*); lo anterior describe el mecanismo que la implementación ya sostiene, no una promesa de mercado confirmada.

## Operating Context

Flujo real de trabajo: crear la organización → invitar al staff con un link de token → dar de alta equipos → el **delegado** carga jugadores → el **admin** crea el torneo, inscribe equipos y genera/programa la jornada → el **árbitro** captura el reporte del partido → la tabla se actualiza sola.

**Calendario y excepciones.** No toda la jornada se juega como se programó. Un partido puede **aplazarse** (se reprograma a otra fecha/cancha) o **cancelarse** (no se juega). Eso afecta la generación de partidos y la calendarización: un aplazado no debe quedar como “jugado” ni vaciar el cupo sin dejar rastro; un cancelado no debe alimentar la tabla. Cómo se modela en estados y qué hace la generación automática todavía no está cerrado (ver *Decisiones abiertas*).

Todo vive detrás de autenticación y está aislado por organización. Hoy no existe ninguna superficie sin login.

## Capabilities and Constraints

- **Multi-tenant por organización.** Cada fila de dominio lleva `organization_id` y el aislamiento lo garantiza RLS en Postgres, no la aplicación.
- **El permiso vive en la base.** Las políticas por rol son la autoridad; la UI refleja lo que la base ya permite.
- **Catálogo de deportes global y de solo lectura** para los usuarios de la app (escribe únicamente `service_role`): `futbol`, `basquetbol`, `voleibol`, `tenis`.
- **Torneos:** `format` (default `round_robin`), `legs` 1 o 2, `status` `registration` / `active` / `finished`, `start_date`.
- **Partidos (hoy en código):** `scheduled_at` opcional, `round`, `stage`, `status` `programado` / `en_vivo` / `finalizado` / `suspendido`, marcador local/visitante y `match_sets` para deportes por sets. **Desalineado con el modelo de producto:** el código permite a `admin` *y* `league_manager` crear/editar/borrar partidos; el modelo confirmado reserva eso solo al administrador.
- **Partidos (modelo confirmado, aún no cerrado en esquema):** además de programado / en vivo / finalizado, hay que contemplar **aplazado** y **cancelado**. `suspendido` existe hoy pero no cubre bien esos dos casos (aplazar implica reprogramar; cancelar implica no jugar).
- **Reporte del árbitro:** resultado y estado sí; **amonestaciones y demás incidencias** todavía no tienen tablas ni UI (stats por deporte están diferidas a una migración futura).
- **Jugadores** con alcance de organización; pueden existir sin cuenta de usuario (`profile_id` es nullable). El dueño operativo de darlos de alta es el **delegado de equipo**.
- **Invitaciones** por token, aceptadas con el RPC `accept_org_invite`.

**Idioma.** El producto se publica en **español de México**, de tú. Existe la posibilidad real de usarlo en ligas de Estados Unidos más adelante, así que la traducción no debe volverse imposible de agregar, pero i18n completo no es un requisito de hoy. Las cadenas viven inline en los componentes; cuando llegue el inglés habrá que extraerlas.

**Glosario.** `src/lib/labels.ts` es la única fuente de los nombres de dominio que ve la persona (roles, estados de partido y de torneo, formatos, deportes, unidad de marcador). Un concepto nuevo se nombra ahí, no en el componente.

**Vocabulario fijo:** organización, equipo, torneo, partido, jornada, fase, cancha o sede, local y visitante, temporada, posiciones. Roles: Administrador, Coordinador de liga, Delegado de equipo, Árbitro.

**Terminología mezclada en la base:** los valores de enum y las columnas de perfil están en español (`programado`, `en_vivo`, `nombre`, `apellido`) mientras que otros campos están en inglés. Es un hecho del esquema, no un error a corregir sin migración.

**Decisiones abiertas, no inventar una respuesta:**

- Destino del rol `league_manager` bajo el modelo admin-only para partidos.
- Estados exactos: ¿`aplazado` y `cancelado` reemplazan a `suspendido`, o conviven los tres?
- Al aplazar: ¿el admin edita `scheduled_at`/cancha del mismo partido, o se genera un partido nuevo ligado al anterior?
- Al cancelar: ¿queda en el calendario como cancelado (histórico) o se puede borrar? ¿Afecta puntos (0-0, W.O., nada)?
- Alcance del reporte del árbitro en v1: ¿solo marcador + estado, o ya amonestaciones/expulsiones?
- Quién puede marcar aplazado/cancelado: ¿solo admin, o también el árbitro desde la cancha?
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
3. **La base manda sobre los permisos.** RLS por organización y rol es la autoridad; la interfaz no inventa accesos que la base negaría. Partidos y eventos: solo el administrador escribe el calendario; el árbitro escribe el reporte; el delegado escribe la plantilla de su equipo.
4. **Dos escenas, un producto.** Planear en escritorio y capturar en la cancha desde el celular son caminos iguales de importantes; ninguno es la versión degradada del otro.
5. **La jornada no es rígida.** Aplazamientos y cancelaciones son parte del modelo, no excepciones improvisadas: la calendarización y la tabla deben tratarlos de forma explícita.
6. **Construir para una liga sin cerrarle la puerta a muchas.** El aislamiento multi-tenant se mantiene aunque hoy solo lo use una persona.
