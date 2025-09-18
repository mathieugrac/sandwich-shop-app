#!/usr/bin/env node

/**
 * Script to seed product images to Supabase Storage and database
 * This uploads sample images and creates product_images records
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Local Supabase configuration
const supabaseUrl = 'http://127.0.0.1:54321';
const supabaseServiceKey =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';

// Image mappings (product name -> image filename)
const PRODUCT_IMAGES = {
  'Nutty Beet': 'nutty-beet.jpg',
  'Umami Mush': 'umami-mush.jpg',
  'Burgundy Beef': 'burgundy-beef.jpg',
};

async function seedImages() {
  console.log('🖼️  Seeding product images...\n');

  // Use service role key for admin operations
  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  try {
    // Get all products that need images
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('id, name')
      .in('name', Object.keys(PRODUCT_IMAGES));

    if (productsError) {
      throw new Error(`Failed to fetch products: ${productsError.message}`);
    }

    if (!products || products.length === 0) {
      console.log('⚠️  No products found that match the image mappings');
      return;
    }

    console.log(`📦 Found ${products.length} products to process`);

    // Process each product
    for (const product of products) {
      const imageFilename = PRODUCT_IMAGES[product.name];
      const imagePath = path.join(
        __dirname,
        '..',
        'public',
        'sample-images',
        imageFilename
      );

      console.log(`\n🔄 Processing ${product.name}...`);

      // Check if image file exists
      if (!fs.existsSync(imagePath)) {
        console.log(`⚠️  Image file not found: ${imagePath}`);
        console.log(`   Please add ${imageFilename} to public/sample-images/`);
        continue;
      }

      // Read the image file
      const imageBuffer = fs.readFileSync(imagePath);
      const fileExt = path.extname(imageFilename);
      const fileName = `${product.id}${fileExt}`;

      // Upload to Supabase Storage
      console.log(`   📤 Uploading to storage...`);
      const contentType =
        fileExt === '.svg' ? 'image/svg+xml' : `image/${fileExt.slice(1)}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('product-images')
        .upload(fileName, imageBuffer, {
          contentType,
          upsert: true, // Overwrite if exists
        });

      if (uploadError) {
        console.error(`   ❌ Upload failed: ${uploadError.message}`);
        continue;
      }

      // Get the public URL
      const {
        data: { publicUrl },
      } = supabase.storage.from('product-images').getPublicUrl(fileName);

      // Save image record to database (delete existing first, then insert)
      console.log(`   💾 Saving to database...`);

      // Delete existing images for this product
      await supabase
        .from('product_images')
        .delete()
        .eq('product_id', product.id);

      // Insert new image record
      const { error: dbError } = await supabase.from('product_images').insert({
        product_id: product.id,
        image_url: publicUrl,
        alt_text: product.name,
        sort_order: 0,
      });

      if (dbError) {
        console.error(`   ❌ Database save failed: ${dbError.message}`);
        continue;
      }

      console.log(`   ✅ Successfully processed ${product.name}`);
    }

    console.log('\n🎉 Image seeding complete!');
    console.log('\n📋 Summary:');
    console.log(`   Products processed: ${products.length}`);
    console.log(`   Images uploaded to: product-images bucket`);
    console.log(`   Database records: product_images table`);
  } catch (error) {
    console.error('❌ Error seeding images:', error.message);
    process.exit(1);
  }
}

// Run the script
seedImages();
