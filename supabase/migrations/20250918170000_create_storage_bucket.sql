-- Create storage bucket for product images

-- Create the product-images bucket (simplified for compatibility)
INSERT INTO storage.buckets (id, name)
VALUES (
  'product-images',
  'product-images'
) ON CONFLICT (id) DO NOTHING;

-- Create storage policy to allow public access for reading
CREATE POLICY "Public can view product images" ON storage.objects
  FOR SELECT USING (bucket_id = 'product-images');

-- Create storage policy to allow authenticated users to upload
CREATE POLICY "Authenticated users can upload product images" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'product-images' 
    AND auth.role() = 'authenticated'
  );

-- Create storage policy to allow authenticated users to update
CREATE POLICY "Authenticated users can update product images" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'product-images' 
    AND auth.role() = 'authenticated'
  );

-- Create storage policy to allow authenticated users to delete
CREATE POLICY "Authenticated users can delete product images" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'product-images' 
    AND auth.role() = 'authenticated'
  );
