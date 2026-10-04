#!/usr/bin/env bash
# =============================================================================
# SPORTS LEAGUE · keep-alive.sh
# =============================================================================
# Hace una lectura pública a la base para que Supabase no pause el proyecto
# gratuito por inactividad (se pausa tras 7 días sin consultas).
# Lo corre .github/workflows/supabase-keep-alive.yml; también sirve a mano:
#   SUPABASE_URL=... SUPABASE_ANON_KEY=... ./supabase/scripts/keep-alive.sh
# =============================================================================

set -euo pipefail

: "${SUPABASE_URL:?Falta SUPABASE_URL}"
: "${SUPABASE_ANON_KEY:?Falta SUPABASE_ANON_KEY}"

status=$(curl -sS -o /dev/null -w '%{http_code}' \
  "${SUPABASE_URL%/}/rest/v1/public_organizations?select=id&limit=1" \
  -H "apikey: ${SUPABASE_ANON_KEY}" \
  -H "Authorization: Bearer ${SUPABASE_ANON_KEY}")

echo "Supabase respondió ${status}"
[ "${status}" = "200" ]
