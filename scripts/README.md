# Development Scripts

This directory contains utility scripts for local development.

## Admin User Management

### `create-admin-user.js`

Automatically creates the admin user in Supabase Auth for local development.

**Usage:**

```bash
# Create admin user only
npm run admin:create

# Or run directly
node scripts/create-admin-user.js
```

**Admin Credentials:**

- Email: `admin@fome.local`
- Password: `admin123`

## Database Management

### Full Database Reset with Admin User

```bash
# Reset database AND create admin user (recommended)
npm run db:reset-full

# Just reset database (you'll need to create admin user manually)
npm run db:reset
```

## Why This is Needed

When you run `supabase db reset`, it resets the database schema and data, but **Supabase Auth users are stored separately** and get wiped out. This script automatically recreates the admin auth user so you don't have to do it manually every time.

## Troubleshooting

If the script fails:

1. Make sure Supabase is running: `npx supabase status`
2. Check that the service role key is correct in the script
3. Verify the admin user doesn't already exist in Supabase Studio

The script will skip creation if the user already exists.

## Product Image Management

### `seed-images.js`

Automatically uploads product images to Supabase Storage and creates database records.

**Usage:**

```bash
# Seed images only
npm run seed:images

# Or run directly
node scripts/seed-images.js
```

**Setup:**

1. Add your product images to `public/sample-images/`
2. Update the `PRODUCT_IMAGES` mapping in the script if needed
3. Run the seeding script

### `create-placeholder-images.js`

Creates simple SVG placeholder images for testing.

**Usage:**

```bash
# Create placeholder images
npm run setup:placeholders

# Or run directly
node scripts/create-placeholder-images.js
```

## Complete Database Reset

### Full Reset with Everything

```bash
# Reset DB + create admin user + seed images (recommended)
npm run db:reset-full
```

This single command:

1. Resets the database schema and data
2. Creates the admin auth user
3. Uploads and links product images

**Perfect for daily development!** 🚀
