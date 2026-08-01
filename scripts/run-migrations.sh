#!/usr/bin/env bash
# Applies every migration in order, then verifies the schema landed.
# Usage:  DATABASE_URL='postgresql://...' ./scripts/run-migrations.sh
set -euo pipefail

: "${DATABASE_URL:?Set DATABASE_URL to the Supabase Session pooler connection string}"

for f in supabase/migrations/*.sql; do
  echo "→ applying $(basename "$f")"
  psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -q -f "$f"
done

echo
echo "→ verifying"
psql "$DATABASE_URL" -q -c "
select table_name,
       (select count(*) from pg_policies p
         where p.schemaname='public' and p.tablename=t.table_name) as rls_policies
  from information_schema.tables t
 where table_schema='public'
   and table_name in ('profiles','addresses','orders','order_items','wishlist')
 order by table_name;"
