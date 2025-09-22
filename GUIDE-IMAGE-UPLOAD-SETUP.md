# Image Upload Setup for Sandwich Shop App

This document explains how to set up and use the new image upload functionality for products.

## Features Added

1. **Admin Product Image Upload**: Admins can now upload images when creating or editing products
2. **Product Image Display**: Product images are displayed in the customer menu
3. **Automatic Image Management**: Images are automatically deleted when products are deleted

## Setup Instructions

### 1. Create Supabase Storage Bucket

You need to manually create the storage bucket in your Supabase Dashboard:

1. Go to your Supabase project dashboard
2. Navigate to **Storage** in the left sidebar
3. Click **Create a new bucket**
4. Set bucket name to: `product-images`
5. Make it **Public** (check the "Public bucket" option)
6. Click **Create bucket**

### 2. Set Storage Policies

After creating the bucket, set up the access policies:

1. In the **Storage** section, click on the `product-images` bucket
2. Go to **Policies** tab
3. Click **New Policy**
4. Choose **Create a policy from template**
5. Select **Allow public access to any file**
6. Click **Review** and then **Save policy**

### 3. Database Schema

The `product_images` table should already exist with this structure:

```sql
CREATE TABLE product_images (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  alt_text TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 4. Environment Variables

Ensure your `.env.local` file contains:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

## Usage

### Admin Panel

1. Go to `/admin/products`
2. Click "Add Product" or edit an existing product
3. Use the image upload area to select a product image
4. The image will be automatically uploaded to Supabase Storage
5. Save the product

### Customer Menu

1. Product images automatically appear in the customer menu
2. If no image is available, a placeholder is shown
3. Images are optimized and responsive

## Technical Details

### File Storage

- Images are stored in Supabase Storage under `product-images/` bucket
- File naming: `{productId}-{timestamp}.{extension}`
- Supported formats: JPEG, PNG, WebP
- Maximum file size: 5MB

### Database Relations

- `products` table has a one-to-many relationship with `product_images`
- Images are automatically deleted when products are deleted (CASCADE)
- First image (by sort_order) is displayed in the menu

### API Changes

- Drops API now fetches product images along with product data
- Product images are included in the `DropWithProducts` response

## Troubleshooting

### Common Issues

1. **Storage bucket not found**: Create the bucket manually in Supabase Dashboard
2. **Upload fails**: Check file size and format
3. **Images not displaying**: Verify storage bucket is public
4. **Permission errors**: Check Supabase service role key

### Testing the Setup

1. Go to `/admin/products`
2. Try to create a new product with an image
3. Check if the image appears in the customer menu
4. Verify the image is stored in Supabase Storage

## Future Enhancements

- Multiple image support per product
- Image cropping and resizing
- CDN integration for better performance
- Image optimization and compression
