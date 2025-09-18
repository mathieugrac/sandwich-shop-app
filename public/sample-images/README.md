# Sample Product Images

This directory contains sample images used for local development seeding.

## Images

- `nutty-beet.jpg` - Sample image for Nutty Beet sandwich
- `umami-mush.jpg` - Sample image for Umami Mush sandwich
- `burgundy-beef.jpg` - Sample image for Burgundy Beef sandwich

## Usage

These images are automatically uploaded to Supabase Storage and linked to products when running:

```bash
npm run db:reset-full
```

Or manually:

```bash
npm run seed:images
```

## Adding New Images

1. Add your image files to this directory
2. Update the `scripts/seed-images.js` script to include the new images
3. Run the seeding script

## Image Requirements

- Format: JPG, PNG, or WebP
- Recommended size: 800x600px or similar aspect ratio
- Max file size: 5MB (as configured in Supabase Storage)
