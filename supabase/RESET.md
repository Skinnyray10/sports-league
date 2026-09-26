# Reset de base de datos (schema reescrito)

La DB se puede vaciar y reaplicar: no hay datos importantes.

## Con Supabase CLI (local)

```bash
cd /home/ryangg10/Projects/sports-league
npx supabase db reset
# o, si tienes el CLI instalado:
# supabase db reset
```

Esto aplica todas las migraciones de `supabase/migrations/` desde cero.

## Proyecto remoto (hosted)

1. En el Dashboard → **SQL Editor**, o con CLI linkeado:
   ```bash
   npx supabase db reset --linked
   ```
   (destruye datos del proyecto remoto linkeado)

2. Alternativa manual: borrar el schema `public` / recrear el proyecto, luego:
   ```bash
   npx supabase db push
   ```

## Storage buckets

Ya no hay que crearlos a mano: los define `0005_storage_buckets.sql`.

| Bucket | Público | Uso |
|--------|---------|-----|
| `player-photos` | no | Fotos de credencial; path `{org_id}/{team_id}/{player_id}.jpg`; lectura admin/delegado del equipo |
| `protest-evidence` | no | Evidencia de protestas; path `{org_id}/{protest_id}/...` |

En ambos, **el primer segmento del path debe ser el `organization_id`**: las
políticas de `storage.objects` lo usan para resolver la membresía.

## Avisos del linter que son intencionales

- `security_definer_view` en `public_matches`, `public_standings`,
  `public_scorers` y `public_notices`. Es a propósito: con `security_invoker`
  el visitante anónimo no tiene RLS de lectura sobre las tablas base y las
  vistas salían vacías. El filtro `is_public = true` dentro de cada vista es
  la frontera, y solo tienen `select` concedido.
- `SECURITY DEFINER` ejecutable en `is_org_member`, `has_org_role`,
  `manages_team`, `shares_org_with` e `is_assigned_referee`. Las policies de
  RLS las evalúan con el rol que consulta, así que necesitan `execute`; solo
  exponen la membresía de quien llama.
- `validate_credential(folio)` y `accept_org_invite(token)` son públicas por
  diseño (QR de credencial e invitaciones por liga).

## Pendiente en el Dashboard

Authentication → Providers → Password: activar **Leaked password protection**
(no se puede configurar por migración).
