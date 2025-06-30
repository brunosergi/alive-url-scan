-- 1. ENABLE EXTENSIONS
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 2. CREATE N8N CUSTOM SCHEMA (Keep N8N data organized)
CREATE SCHEMA IF NOT EXISTS n8n_data;

-- 3. CREATE THE URL_SCAN TABLE IN PUBLIC SCHEMA (N8N compatibility)
CREATE TABLE public.url_scan (
  id uuid NOT NULL DEFAULT gen_random_uuid (),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  url text NULL,
  domain text NULL,
  tld text NULL,
  source_filename text NULL,
  scan_status boolean NOT NULL DEFAULT FALSE,
  last_scan_time timestamp with time zone NULL,
  status_code text NULL,
  agent_summary text NULL,
  screenshot_url text NULL,
  page_assessment text[] NULL,
  CONSTRAINT url_scan_pkey PRIMARY KEY (id),
  CONSTRAINT url_scan_screenshot_url_key UNIQUE (screenshot_url),
  CONSTRAINT url_scan_url_key UNIQUE (url)
);

-- Enable RLS on the table
ALTER TABLE public.url_scan ENABLE ROW LEVEL SECURITY;

-- Create policy for public access
CREATE POLICY "Allow public access" ON public.url_scan
    FOR ALL
    USING (true)
    WITH CHECK (true);

-- 4. CREATE BASIC STORAGE BUCKET (Will be configured by init container)
INSERT INTO storage.buckets (id, name, owner)
VALUES ('screenshots', 'screenshots', null)
ON CONFLICT (id) DO NOTHING;

-- 5. STORAGE RLS POLICIES (Backup security enforcement)
-- These policies ensure file restrictions even if bucket-level settings fail

-- Allow anyone to read from screenshots bucket
CREATE POLICY "screenshots_select" ON storage.objects
  FOR SELECT USING (bucket_id = 'screenshots');

-- Allow anyone to upload with size and MIME type restrictions
CREATE POLICY "screenshots_insert" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'screenshots' AND
    (metadata->>'size')::bigint < 512000 AND
    (metadata->>'mimetype') IN ('image/jpeg', 'image/png', 'image/jpg')
  );

-- Allow updates for existing objects
CREATE POLICY "screenshots_update" ON storage.objects
  FOR UPDATE USING (bucket_id = 'screenshots');

-- Allow deletes for cleanup
CREATE POLICY "screenshots_delete" ON storage.objects
  FOR DELETE USING (bucket_id = 'screenshots');

-- 6. CREATE SECURE FUNCTION FOR N8N (fixes the security warning)
CREATE OR REPLACE FUNCTION public.check_existing_urls(urls_to_check TEXT[])
RETURNS TABLE(existing_url TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT s.url
  FROM public.url_scan AS s
  WHERE s.url = ANY(urls_to_check);
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.check_existing_urls(TEXT[]) TO anon, authenticated;

-- 7. CREATE BULK DELETE FUNCTION FOR URL CLEANUP
CREATE OR REPLACE FUNCTION public.bulk_delete_urls(ids_to_delete UUID[])
RETURNS TABLE(deleted_count INTEGER, deleted_ids UUID[])
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  record_count INTEGER;
  deleted_records UUID[];
BEGIN
  -- Delete records and collect the deleted IDs
  WITH deleted AS (
    DELETE FROM public.url_scan 
    WHERE id = ANY(ids_to_delete)
    RETURNING id
  )
  SELECT array_agg(id), count(*)::INTEGER 
  INTO deleted_records, record_count
  FROM deleted;
  
  RETURN QUERY SELECT record_count, deleted_records;
END;
$$;

-- Grant execute permission for bulk delete function
GRANT EXECUTE ON FUNCTION public.bulk_delete_urls(UUID[]) TO anon, authenticated;