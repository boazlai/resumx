ALTER TABLE resumes ADD COLUMN IF NOT EXISTS thumbnail_url TEXT;

-- Create the public thumbnails bucket for resume card previews
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('thumbnails', 'thumbnails', true, 2097152, '{image/jpeg}')
ON CONFLICT (id) DO NOTHING;

-- RLS: users can read/write only their own folder (userId/resumeId.jpg)
DROP POLICY IF EXISTS "Users own their thumbnails" ON storage.objects;
CREATE POLICY "Users own their thumbnails"
ON storage.objects FOR ALL
USING (
  bucket_id = 'thumbnails'
  AND (storage.foldername(name))[1] = auth.uid()::text
)
WITH CHECK (
  bucket_id = 'thumbnails'
  AND (storage.foldername(name))[1] = auth.uid()::text
);
