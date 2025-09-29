-- Create storage bucket for product images
-- This allows uploading and serving product photos for the sandwich shop

-- Create the product-images bucket (public access for customer viewing)
INSERT INTO storage.buckets (id, name, public)
VALUES ('product-images', 'product-images', true)
ON CONFLICT (id) DO NOTHING;

-- ========================================
-- STORAGE POLICIES (RLS for Storage)
-- ========================================

-- Public read access - anyone can view product images
CREATE POLICY "Public can view product images" ON storage.objects
  FOR SELECT 
  USING (bucket_id = 'product-images');

-- Authenticated users can upload product images (admin only)
CREATE POLICY "Authenticated users can upload product images" ON storage.objects
  FOR INSERT 
  WITH CHECK (
    bucket_id = 'product-images' 
    AND auth.role() = 'authenticated'
  );

-- Authenticated users can update product images (admin only)
CREATE POLICY "Authenticated users can update product images" ON storage.objects
  FOR UPDATE 
  USING (
    bucket_id = 'product-images' 
    AND auth.role() = 'authenticated'
  );

-- Authenticated users can delete product images (admin only)
CREATE POLICY "Authenticated users can delete product images" ON storage.objects
  FOR DELETE 
  USING (
    bucket_id = 'product-images' 
    AND auth.role() = 'authenticated'
  );
