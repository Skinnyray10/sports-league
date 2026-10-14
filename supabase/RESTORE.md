# Respaldos y restauración

El workflow `.github/workflows/supabase-backup.yml` corre cada domingo a las
03:00 (hora de México) y ejecuta `supabase/scripts/backup.sh`:

1. Permite temporalmente la IP del runner en Network Restrictions; al terminar
   (incluso si falla) deja la lista vacía.
2. `supabase db dump`: `roles.sql`, `schema.sql` y `data.sql`.
3. Descarga los buckets `player-photos` y `protest-evidence` a `storage/`.
4. Empaqueta todo en `tar.gz` y lo cifra con `age` usando la llave pública de
   `supabase/backup-recipient.txt`.
5. Lo sube a Hostinger: `~/backups/sports-league/sports-league_YYYY-MM-DD.tar.gz.age`.
6. Borra los respaldos remotos de más de 12 semanas.

El repo es público: los respaldos nunca se suben como artifacts ni se commitean.

## Configuración inicial (una sola vez)

### Llaves age

```bash
age-keygen -o sports-league-backup.key
# imprime: Public key: sb_publishable_HfXQOS6U1EbHT9nVOWEdpg_Q-C-z2Tt
```

- Pega la línea `age1...` (sola) en `supabase/backup-recipient.txt` y haz commit.
  Es pública; no es un secreto.
- Guarda `sports-league-backup.key` en tu gestor de contraseñas (y una copia
  fuera de línea). Después borra el archivo local. **Sin esta llave los
  respaldos no se pueden descifrar.**

### Llave SSH para Hostinger

```bash
ssh-keygen -t ed25519 -N "" -C "github-backups" -f hostinger_backup
ssh-keyscan -p 65002 <HOST> > hostinger_known_hosts
```

- hPanel → Avanzado → Acceso SSH: activa SSH y agrega `hostinger_backup.pub`.
- Compara la huella de `hostinger_known_hosts` (`ssh-keygen -lf hostinger_known_hosts`)
  con la de una conexión manual (`ssh -p 65002 <USER>@<HOST>`) antes de usarla.

### Secretos del environment `backups` en GitHub

Settings → Environments → New environment `backups` → Add secret:

| Secret | Valor |
|--------|-------|
| `SUPABASE_ACCESS_TOKEN` | Token de Account → Access Tokens |
| `SUPABASE_DB_URL` | Connection string del **session pooler** (puerto 5432), con contraseña |
| `SUPABASE_SERVICE_ROLE_KEY` | Project Settings → API Keys → service_role |
| `HOSTINGER_SSH_HOST` | IP o host SSH de hPanel |
| `HOSTINGER_SSH_PORT` | `65002` |
| `HOSTINGER_SSH_USER` | Usuario SSH de hPanel (`u123456789`) |
| `HOSTINGER_SSH_KEY` | Contenido completo de `hostinger_backup` (privada) |
| `HOSTINGER_SSH_KNOWN_HOSTS` | Contenido de `hostinger_known_hosts` |

Después borra `hostinger_backup` y `hostinger_known_hosts` del disco local.

## Correr el respaldo a mano

GitHub → Actions → **Respaldo de Supabase** → Run workflow.

## Restaurar

### 1. Descargar y descifrar

```bash
scp -P 65002 <USER>@<HOST>:backups/sports-league/sports-league_2026-10-11.tar.gz.age .
age -d -i sports-league-backup.key sports-league_2026-10-11.tar.gz.age | tar -xzf -
cd sports-league_2026-10-11
```

### 2. Base de datos

En el proyecto destino, agrega temporalmente tu IP en Database → Settings →
Network Restrictions (y quítala al terminar). Luego, con el connection string
del session pooler del proyecto destino:

```bash
psql \
  --single-transaction \
  --variable ON_ERROR_STOP=1 \
  --file roles.sql \
  --file schema.sql \
  --command 'SET session_replication_role = replica' \
  --file data.sql \
  --dbname "$SUPABASE_DB_URL"
```

Todo va en una transacción: si algo falla, no queda nada a medias.

### 3. Storage

Con el CLI ligado al proyecto destino (`supabase link --project-ref <REF>`):

```bash
supabase storage cp -r storage/player-photos ss:///player-photos --experimental
supabase storage cp -r storage/protest-evidence ss:///protest-evidence --experimental
```

Los buckets ya existen si se aplicó el schema (migración `0005_storage_buckets.sql`).
Verifica con `supabase storage ls -r ss:///player-photos --experimental` que las
rutas empiecen con el `organization_id` (las políticas de RLS dependen de eso)
y no con el nombre del bucket repetido.

Al terminar, borra la carpeta descifrada.
