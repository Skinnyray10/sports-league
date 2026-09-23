# Ejemplos.md — Lógica de Rol de Juego y Estadísticas por Deporte

> Este archivo documenta la **lógica de negocio** (no el formato de Excel) detrás del calendario de
> partidos y las estadísticas de cada deporte, para que la plataforma la reproduzca de forma
> genérica y configurable por organización. El nombre de la empresa/asociación que organiza el
> torneo es un dato mutable de cada organización — no forma parte de la lógica.

---

## 1. Conceptos base

- Un **torneo** se juega en **jornadas** (rondas). La jornada es solo una agrupación temporal de
  partidos — no cambia la estructura de los datos, cada jornada contiene partidos con la misma
  forma que cualquier otra.
- Cada **deporte** se organiza en:
  - **Rama**: Varonil o Femenil.
  - **Categoría**: nivel de competencia dentro de una rama (ej. 1RA, 2DA, 3RA, ÚNICA). Una rama
    puede tener una o varias categorías.
- **Todos los deportes deben soportar ambas ramas (Varonil y Femenil)** como parte del modelo de
  datos. Que una rama exista o no para un deporte en particular es una **decisión de
  configuración de cada organización**, no una regla fija del deporte:
  - En la plataforma, cada organización debe poder **activar/desactivar una rama por deporte**
    (ej. "Soccer – Femenil: inactiva" para una liga que solo corre varonil).
  - Si una rama está inactiva, no debe aparecer en el calendario, tablas de posiciones, ni
    formularios de captura de esa organización — pero el dato queda disponible por si la activan
    después.
- Cada partido, tabla de posiciones, goleo, etc. pertenece siempre a la combinación
  **deporte + rama + categoría** de una organización y un torneo.

---

## 2. Estructura del Rol de Juego (calendario de partidos)

Un partido siempre tiene estos campos, sin importar el deporte:

| Campo       | Descripción |
|-------------|-------------|
| Fecha       | Día del partido |
| Hora        | Hora del partido |
| Equipo local     | Equipo que juega en casa |
| Equipo visitante | Equipo contrario |
| Rama        | Varonil / Femenil |
| Categoría   | Nivel dentro de la rama (1RA, 2DA, ÚNICA, etc.) |
| Sede / cancha | Lugar donde se juega (nombre libre: cancha, gimnasio, campo, poliderportivo, etc.) |
| Jornada     | Número de ronda del torneo al que pertenece |

Esto es igual para los 6 deportes (Basquetbol, 7x7, Soccer, Softbol, Tochito, Voleibol); la única
variación real es si, para una organización dada, la rama Femenil está activa o no para ese
deporte — el campo existe siempre, se filtra por configuración.

---

## 3. Estructura de Estadísticas (tabla de posiciones)

La tabla de posiciones de cualquier deporte tiene esta forma general:

```
#  | Equipo | [columnas de estadísticas propias del deporte] | Puntos
```

Al final siempre hay una fila de **Totales** (suma de todas las columnas) — nunca representa un
equipo y no debe insertarse como tal.

### Columnas de estadísticas por deporte

| Deporte    | Columnas (abreviación → significado) |
|------------|----------------------------------------|
| Soccer     | J.J. Jugados · J.G. Ganados · J.P. Perdidos · J.E. Empatados · J.E.G. Empatados-ganados (penales) · J.E.P. Empatados-perdidos (penales) · G.F. Goles a favor · G.C. Goles en contra · D.G. Diferencia de goles · PTS. Puntos |
| Softbol    | J.J. Jugados · J.G. Ganados · J.P. Perdidos · C.F. Carreras a favor · C.C. Carreras en contra · D.C. Diferencia de carreras · PTS. Puntos |
| Tochito (flag football) | J.J. Jugados · J.G. Ganados · J.P. Perdidos · J.E. Empatados · P.F. Puntos a favor · P.C. Puntos en contra · DIF. Diferencia de puntos · PTS. Puntos (tabla) |
| Voleibol   | J.J. Jugados · J.G. Ganados · J.P. Perdidos · S.F. Sets a favor · S.C. Sets en contra · D.S. Diferencia de sets · PTS. Puntos |
| Basquetbol | Sin ejemplo propio confirmado — usar el mismo patrón que Soccer (a favor/en contra por puntos de básquet en vez de goles) hasta confirmar columnas reales |
| 7x7 (fútbol veteranos) | Mismo patrón que Soccer (es la misma disciplina, categoría de veteranos) |

Todos estos deportes comparten la misma forma de fondo: **Jugados, Ganados, Perdidos, Empatados
(cuando aplica), Favor, Contra, Diferencia, Puntos**. Solo cambia la unidad que se cuenta (goles,
carreras, puntos de juego, sets) y el nombre de la abreviación que se muestra en la UI.

### Estadísticas complementarias (aplican según el deporte)

- **Goleo / líderes individuales** (Soccer y deportes de gol): ranking de jugadores por
  `Nombre · Equipo · Goles` (o la métrica equivalente del deporte: carreras, puntos, etc.).
- **Jugadores sancionados**: relación de `Nombre · Motivo de la falta · Jornada · Sanción · Equipo`.
- **Resultados cruzados (equipo vs. equipo)**: matriz con el resultado de cada enfrentamiento entre
  todos los equipos de una misma rama/categoría, en el mismo orden que la tabla de posiciones.
- **Bracket de eliminación directa (Finales)**: cruces de eliminación (Cuartos → Semis → Final)
  que se arman según la posición final de cada equipo en la tabla de posiciones de fase regular,
  no por nombre de equipo fijo.

---

## 4. Reglas de diseño para la plataforma

1. **Modelo de estadísticas genérico**: una sola tabla `stats` con columnas neutrales
   (`jugados, ganados, perdidos, empatados, a_favor, en_contra, diferencia, puntos`) cubre los 6
   deportes; el nombre mostrado en la UI (ej. "Goles a favor" vs. "Carreras a favor") depende solo
   del `deporte` al que pertenece el registro.
2. **Rama y categoría son atributos de configuración, no del deporte en sí**: cada organización
   define qué ramas/categorías tiene activas por deporte, y la plataforma debe permitir
   activar/desactivar una rama por deporte sin perder los datos históricos.
3. **La jornada es metadata del partido**, no una entidad estructural distinta — no se necesita un
   modelo especial por jornada, basta un campo `jornada` (o `fecha` + `número de ronda`) en el
   partido.
4. **El nombre de la organización/empresa organizadora es un dato de configuración de cuenta**, no
   una regla del sistema — cualquier negocio debe poder usar la plataforma con su propio nombre.
5. **Fila de Totales** en cualquier tabla de posiciones: excluir siempre al listar/insertar equipos.
6. **Bracket de Finales**: modelar como referencia a la posición en la tabla de fase regular, no al
   nombre de equipo directamente, ya que el cruce depende del lugar obtenido.
