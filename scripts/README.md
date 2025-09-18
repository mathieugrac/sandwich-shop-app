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
