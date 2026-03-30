
-- Add image_url column to scan_history
ALTER TABLE public.scan_history ADD COLUMN image_url text;

-- Create storage bucket for scan images
INSERT INTO storage.buckets (id, name, public) VALUES ('scan-images', 'scan-images', true);

-- Allow authenticated users to upload to scan-images bucket
CREATE POLICY "Users can upload scan images" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'scan-images');

-- Allow public read access to scan images
CREATE POLICY "Public read access for scan images" ON storage.objects FOR SELECT USING (bucket_id = 'scan-images');
