-- Run this in Supabase SQL Editor to create all tables, RLS policies, and storage buckets.

CREATE TABLE IF NOT EXISTS resumes (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title       TEXT NOT NULL DEFAULT 'Untitled Resume',
  markdown    TEXT NOT NULL DEFAULT '',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable Row-Level Security
ALTER TABLE resumes ENABLE ROW LEVEL SECURITY;

-- Policy: users can only access their own resumes
CREATE POLICY "Users own their resumes"
  ON resumes
  FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Auto-update updated_at on every update
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER resumes_updated_at
  BEFORE UPDATE ON resumes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ─── user_icons table ────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS user_icons (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  url         TEXT NOT NULL,
  format      TEXT NOT NULL,
  file_size   INTEGER NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT user_icons_user_id_name_unique UNIQUE (user_id, name)
);

ALTER TABLE user_icons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users own their icons"
  ON user_icons
  FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- ─── user-icons Storage bucket ───────────────────────────────────────────────
-- Creates the bucket as public (files are served via public URL).

INSERT INTO storage.buckets (id, name, public)
VALUES ('user-icons', 'user-icons', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload/update their own icons (folder = their user id).
CREATE POLICY "Users upload their own icons"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'user-icons'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users can update their own icons"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'user-icons'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users can delete their own icons"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'user-icons'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Allow anyone to read icons (they are served as public URLs).
CREATE POLICY "Icons are publicly readable"
  ON storage.objects
  FOR SELECT
  USING (bucket_id = 'user-icons');
