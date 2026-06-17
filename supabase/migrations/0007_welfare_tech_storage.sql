-- Public bucket for welfare technology card images.
-- Anonymous users read via public URLs; only admins may upload or delete.

INSERT INTO storage.buckets (id, name, public)
VALUES ('welfare-tech-images', 'welfare-tech-images', true)
ON CONFLICT (id) DO UPDATE SET public = EXCLUDED.public;

DROP POLICY IF EXISTS "welfare_tech_images_public_read" ON storage.objects;
CREATE POLICY "welfare_tech_images_public_read"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'welfare-tech-images');

DROP POLICY IF EXISTS "welfare_tech_images_admin_insert" ON storage.objects;
CREATE POLICY "welfare_tech_images_admin_insert"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'welfare-tech-images'
  AND EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
);

DROP POLICY IF EXISTS "welfare_tech_images_admin_update" ON storage.objects;
CREATE POLICY "welfare_tech_images_admin_update"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'welfare-tech-images'
  AND EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
)
WITH CHECK (
  bucket_id = 'welfare-tech-images'
  AND EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
);

DROP POLICY IF EXISTS "welfare_tech_images_admin_delete" ON storage.objects;
CREATE POLICY "welfare_tech_images_admin_delete"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'welfare-tech-images'
  AND EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
);
