-- Allow any signed-in user to upload resource documents, not just admins.
--
-- Migration 0010 locked the resource-files bucket's INSERT/UPDATE/DELETE to
-- profiles with role = 'admin'. But the resources admin tab is open to every
-- authenticated user, and the underlying public_resources table grants full
-- CRUD to `authenticated` (see 0001 auth_all policies). Non-admins could fill
-- in the form but hit "new row violates row-level security policy" the moment
-- they attached a file. Align the bucket policies with the rest of the
-- resource flow: any authenticated user may upload/manage resource files.
-- Public read is unchanged.

DROP POLICY IF EXISTS "resource_files_admin_insert" ON storage.objects;
CREATE POLICY "resource_files_auth_insert"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'resource-files');

DROP POLICY IF EXISTS "resource_files_admin_update" ON storage.objects;
CREATE POLICY "resource_files_auth_update"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'resource-files')
WITH CHECK (bucket_id = 'resource-files');

DROP POLICY IF EXISTS "resource_files_admin_delete" ON storage.objects;
CREATE POLICY "resource_files_auth_delete"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'resource-files');
