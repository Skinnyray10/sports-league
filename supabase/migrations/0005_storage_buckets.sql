-- =============================================================================
-- SPORTS LEAGUE · 0005_storage_buckets.sql
-- =============================================================================
-- Buckets de Storage. En ambos el primer segmento del path es el organization_id:
--   player-photos/{org_id}/{team_id}/{player_id}.jpg
--   protest-evidence/{org_id}/{protest_id}/{archivo}
-- =============================================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('player-photos', 'player-photos', true, 5242880,
   array['image/jpeg','image/png','image/webp']),
  ('protest-evidence', 'protest-evidence', false, 10485760,
   array['image/jpeg','image/png','image/webp','application/pdf'])
on conflict (id) do nothing;

-- player-photos: lectura pública, porque la credencial y su QR lo son.
create policy "player_photos_read_public"
  on storage.objects for select
  using (bucket_id = 'player-photos');

create policy "player_photos_insert_org_member"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'player-photos'
    and public.is_org_member(((storage.foldername(name))[1])::uuid)
  );

create policy "player_photos_update_org_member"
  on storage.objects for update to authenticated
  using (
    bucket_id = 'player-photos'
    and public.is_org_member(((storage.foldername(name))[1])::uuid)
  )
  with check (
    bucket_id = 'player-photos'
    and public.is_org_member(((storage.foldername(name))[1])::uuid)
  );

create policy "player_photos_delete_admin"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'player-photos'
    and public.has_org_role(
      ((storage.foldername(name))[1])::uuid,
      array['admin']::public.membership_role[]
    )
  );

-- protest-evidence: privado.
create policy "protest_evidence_read_org_member"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'protest-evidence'
    and public.is_org_member(((storage.foldername(name))[1])::uuid)
  );

create policy "protest_evidence_insert_org_member"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'protest-evidence'
    and public.is_org_member(((storage.foldername(name))[1])::uuid)
  );

create policy "protest_evidence_delete_admin"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'protest-evidence'
    and public.has_org_role(
      ((storage.foldername(name))[1])::uuid,
      array['admin']::public.membership_role[]
    )
  );
