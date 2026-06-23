-- Downloadable document attachment (PDF / Word / PowerPoint) on public resources.

ALTER TABLE public.public_resources
  ADD COLUMN IF NOT EXISTS file_url TEXT,
  ADD COLUMN IF NOT EXISTS file_name TEXT;

-- Public bucket for resource document downloads.
-- Anonymous users read via public URLs; only admins may upload or delete.
INSERT INTO storage.buckets (id, name, public)
VALUES ('resource-files', 'resource-files', true)
ON CONFLICT (id) DO UPDATE SET public = EXCLUDED.public;

DROP POLICY IF EXISTS "resource_files_public_read" ON storage.objects;
CREATE POLICY "resource_files_public_read"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'resource-files');

DROP POLICY IF EXISTS "resource_files_admin_insert" ON storage.objects;
CREATE POLICY "resource_files_admin_insert"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'resource-files'
  AND EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
);

DROP POLICY IF EXISTS "resource_files_admin_update" ON storage.objects;
CREATE POLICY "resource_files_admin_update"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'resource-files'
  AND EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
)
WITH CHECK (
  bucket_id = 'resource-files'
  AND EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
);

DROP POLICY IF EXISTS "resource_files_admin_delete" ON storage.objects;
CREATE POLICY "resource_files_admin_delete"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'resource-files'
  AND EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
);
