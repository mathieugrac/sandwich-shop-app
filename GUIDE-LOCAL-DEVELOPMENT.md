# 🚀 Local Development Guide - Supabase & Next.js

This guide will walk you through everything you need to know for daily development with your local Supabase environment. Keep this document handy until you're comfortable with the workflow!

## 📋 Table of Contents

1. [Quick Start Checklist](#quick-start-checklist)
2. [Daily Development Workflow](#daily-development-workflow)
3. [Understanding Your Local Environment](#understanding-your-local-environment)
4. [Common Tasks & Commands](#common-tasks--commands)
5. [Troubleshooting](#troubleshooting)
6. [Database Management](#database-management)
7. [Testing & Debugging](#testing--debugging)
8. [Best Practices](#best-practices)

---

## 🎯 Quick Start Checklist

Before you start coding each day, make sure:

- [ ] **Docker Desktop is running** (check the whale icon in your menu bar)
- [ ] **Supabase services are started** (`npx supabase start`)
- [ ] **Your Next.js app is running** (`npm run dev`)
- [ ] **Stripe webhooks are forwarded** (`npm run stripe:listen`) - for payment testing
- [ ] **You can access Supabase Studio** (http://127.0.0.1:54323)

---

## 🔄 Daily Development Workflow

### 🌅 Starting Your Development Session

```bash
# 1. Navigate to your project directory
cd /Users/mathieugrac/Projects/sandwich-shop-app

# 2. Start Supabase services (if not already running)
npx supabase start

# 3. Start your Next.js application
npm run dev

# 4. Start Stripe webhook forwarding (for payment testing)
npm run stripe:listen
```

**What happens when you run these commands:**

- `npx supabase start`: Starts all Supabase services in Docker containers
- `npm run dev`: Starts your Next.js app on http://localhost:3000
- `npm run stripe:listen`: Forwards Stripe webhooks to your local app for payment testing

### 🎯 During Development

Your typical development session will involve:

1. **Code Changes**: Edit your React components, API routes, etc.
2. **Database Changes**: Use Supabase Studio or migrations
3. **Testing**: Test features in your browser
4. **Debugging**: Use browser dev tools and Supabase Studio

### 🌙 Ending Your Development Session

```bash
# Stop your Next.js app (Ctrl+C in the terminal where it's running)

# Stop Supabase services (optional - they can keep running)
npx supabase stop
```

**Note**: You can leave Supabase running between sessions. It won't consume much resources when idle.

---

## 🏗️ Understanding Your Local Environment

### 🔗 Important URLs

| Service             | URL                    | Purpose                               |
| ------------------- | ---------------------- | ------------------------------------- |
| **Your App**        | http://localhost:3000  | Your sandwich shop website            |
| **Supabase Studio** | http://127.0.0.1:54323 | Database management interface         |
| **Supabase API**    | http://127.0.0.1:54321 | API endpoint (your app connects here) |
| **Email Testing**   | http://127.0.0.1:54324 | View emails sent during development   |

### 📁 Key Files & Folders

```
your-project/
├── .env.local                    # Local environment variables
├── supabase/
│   ├── config.toml              # Supabase configuration
│   ├── migrations/              # Database schema changes
│   └── seed.sql                 # Sample data
├── src/
│   ├── app/                     # Your Next.js pages
│   ├── components/              # React components
│   └── lib/supabase/           # Supabase client configuration
└── package.json                 # Project dependencies
```

### 🔑 Environment Variables

Your `.env.local` file contains:

```bash
# These point to your LOCAL Supabase instance
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Your app configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_SHOP_NAME="Fomé Sandwich Shop"

# Add your Stripe test keys here
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key_here
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_from_stripe_cli
```

---

## ⚡ Common Tasks & Commands

### 🔄 Supabase Management

```bash
# Check if Supabase is running
npx supabase status

# Start Supabase services
npx supabase start

# Stop Supabase services
npx supabase stop

# Restart Supabase services
npx supabase restart

# View Supabase logs
npx supabase logs
```

### 🗄️ Database Operations

```bash
# Reset database to initial state (⚠️ This deletes all data!)
npx supabase db reset

# Create a new migration
npx supabase migration new your_migration_name

# Apply pending migrations
npx supabase db push

# Generate TypeScript types from your database
npx supabase gen types typescript --local > src/types/database.ts
```

### 📦 Next.js Development

```bash
# Start development server
npm run dev

# Build for production (testing)
npm run build

# Run linting
npm run lint

# Format code
npm run format
```

### 💳 Stripe Development

```bash
# Start Stripe webhook forwarding (for payment testing)
npm run stripe:listen

# Test Stripe CLI installation
stripe --version

# Login to Stripe (one-time setup)
stripe login
```

## 🔔 Stripe Webhook Setup (Required for Payment Testing)

For payment testing to work properly, you MUST run the Stripe CLI webhook forwarder:

```bash
# Start webhook forwarding (keep this running during development)
npm run stripe:listen
```

**What this does:**

- Forwards Stripe webhooks from their servers to your local app
- Enables proper order creation flow (same as production)
- Required for payment testing - orders won't be created without it

**If you forget to run this:**

- Payments will succeed but orders won't be created
- Users will see "Order creation timeout" error
- Check console for helpful error messages

**Successful webhook setup looks like this:**

```
> Ready! Your webhook signing secret is whsec_1234567890abcdef...
> Listening for events on your account...
> Forwarding events to http://localhost:3000/api/webhooks/stripe
```

**Testing webhook connectivity:**

```bash
# Check if webhook endpoint is accessible
curl http://localhost:3000/api/webhooks/health

# Should return: {"status":"healthy","timestamp":"...","message":"Webhook endpoint is accessible"}
```

---

## 🔍 Testing & Debugging

### 🌐 Testing Your Application

1. **Visit your app**: http://localhost:3000
2. **Test order flow**: Add items to cart, go through checkout
3. **Test payments**: Use Stripe test cards (4242 4242 4242 4242) to test payment flow
4. **Check database**: Use Supabase Studio to see if data is saved correctly
5. **Test emails**: Check http://127.0.0.1:54324 for email previews
6. **Monitor webhooks**: Watch terminal output from `npm run stripe:listen` for webhook events

### 🛠️ Using Supabase Studio

**Access**: http://127.0.0.1:54323

**What you can do:**

- **Table Editor**: View and edit your data directly
- **SQL Editor**: Run custom SQL queries
- **Authentication**: Manage users and auth settings
- **Storage**: Manage file uploads
- **API Docs**: Auto-generated API documentation

### 📊 Useful SQL Queries for Testing

```sql
-- View all products
SELECT * FROM products ORDER BY sort_order;

-- View all orders with customer details
SELECT
  o.id,
  o.customer_name,
  o.customer_email,
  o.total_amount,
  o.status,
  o.created_at
FROM orders o
ORDER BY o.created_at DESC;

-- Check inventory for a specific drop
SELECT
  p.name,
  dp.quantity,
  dp.reserved_quantity,
  (dp.quantity - dp.reserved_quantity) as available
FROM drop_products dp
JOIN products p ON dp.product_id = p.id
WHERE dp.drop_id = 'your-drop-id';

-- View upcoming drops
SELECT
  d.*,
  l.name as location_name
FROM drops d
JOIN locations l ON d.location_id = l.id
WHERE d.status = 'upcoming'
ORDER BY d.date;
```

---

## 🗄️ Database Management

### 📝 Making Schema Changes

**Option 1: Using Migrations (Recommended)**

```bash
# 1. Create a new migration
npx supabase migration new add_new_column

# 2. Edit the migration file in supabase/migrations/
# Add your SQL changes

# 3. Apply the migration
npx supabase db push
```

**Option 2: Using Supabase Studio**

1. Go to http://127.0.0.1:54323
2. Navigate to "Table Editor"
3. Make changes directly in the interface
4. Generate a migration: `npx supabase db diff -f your_migration_name`

### 🌱 Adding Sample Data

Edit `supabase/seed.sql` to add more sample data:

```sql
-- Add a new product
INSERT INTO products (name, description, category, sell_price, production_cost, sort_order)
VALUES ('New Sandwich', 'Description here', 'sandwich', 8.00, 4.00, 8);

-- Create a sample drop
INSERT INTO drops (date, location_id, status)
SELECT CURRENT_DATE + INTERVAL '1 day', id, 'upcoming'
FROM locations
WHERE name = 'Impact Hub Lisbon'
LIMIT 1;
```

Then reset the database to load the new data:

```bash
# Reset database AND create admin user (recommended)
npm run db:reset-full

# Or just reset database (you'll need to create admin user manually)
npm run db:reset
```

### 👤 Admin User Management

**The Problem:** When you run `supabase db reset`, your admin user gets removed from Supabase Auth and you have to recreate it manually every time.

**The Solution:** Use our automated script!

```bash
# Create admin user only (if you forgot after a reset)
npm run admin:create

# Full reset with admin user creation (recommended)
npm run db:reset-full
```

**Admin Credentials:**

- Email: `admin@fome.local`
- Password: `admin123`

The script automatically creates the admin user in Supabase Auth so you can immediately access the admin panel after a database reset.

### 🖼️ Product Image Management

**The Problem:** When you run `supabase db reset`, your product images stored in Supabase Storage get removed and you lose all the image links.

**The Solution:** Automated image seeding!

```bash
# Seed images only (if you forgot after a reset)
npm run seed:images

# Full reset with admin user AND images (recommended)
npm run db:reset-full
```

**Setting Up Your Images:**

1. **Add your product images** to `public/sample-images/`:
   - `nutty-beet.jpg` (or .png, .svg)
   - `umami-mush.jpg`
   - `burgundy-beef.jpg`

2. **Update the mapping** in `scripts/seed-images.js` if needed

3. **Run the seeding**: Images are automatically uploaded to Supabase Storage and linked in the database

**For Testing:** We've created placeholder SVG images that you can replace with real photos anytime.

---

## 🚨 Troubleshooting

### ❌ Common Issues & Solutions

**Problem**: "Docker not found" error

```bash
# Solution: Install Docker Desktop and make sure it's running
# Check: Look for Docker whale icon in your menu bar
```

**Problem**: "Port already in use" error

```bash
# Solution: Stop existing Supabase instance
npx supabase stop
npx supabase start
```

**Problem**: "Cannot connect to database"

```bash
# Check if Supabase is running
npx supabase status

# If not running, start it
npx supabase start
```

**Problem**: Changes not showing in your app

```bash
# 1. Check your .env.local file has correct local URLs
# 2. Restart your Next.js dev server (Ctrl+C, then npm run dev)
# 3. Clear browser cache or use incognito mode
```

**Problem**: Database seems empty

```bash
# Reset database to load sample data
npx supabase db reset
```

**Problem**: Stripe webhooks not working

```bash
# Check if Stripe CLI is running
# Look for "Ready! Your webhook signing secret is whsec_..." message

# If not running, start webhook forwarding
npm run stripe:listen

# Make sure to copy the webhook secret to your .env.local file
```

**Problem**: Payment succeeds but order not created

```bash
# Check webhook terminal output for errors
# Verify STRIPE_WEBHOOK_SECRET is set in .env.local
# Check Supabase logs: npx supabase logs
```

### 🔍 Debugging Steps

1. **Check Supabase Status**:

   ```bash
   npx supabase status
   ```

2. **Check Logs**:

   ```bash
   npx supabase logs
   ```

3. **Test API Connection**:

   ```bash
   curl "http://127.0.0.1:54321/rest/v1/products?select=*" \
   -H "apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0"
   ```

4. **Check Environment Variables**:
   ```bash
   cat .env.local
   ```

---

## ✅ Best Practices

### 🔒 Security

- **Never commit `.env.local`** to git (it's already in .gitignore)
- **Use test Stripe keys** in development
- **Keep local and production environments separate**

### 💾 Data Management

- **Use migrations** for schema changes (not direct Studio edits)
- **Backup important test data** before running `db reset`
- **Test with realistic data** similar to production

### 🧪 Development Workflow

- **Start with Supabase Studio** to understand your data
- **Use the SQL Editor** to test queries before implementing them
- **Check email previews** at http://127.0.0.1:54324
- **Test the complete user flow** regularly

### 📝 Code Organization

- **Keep database logic** in `src/lib/api/` files
- **Use TypeScript types** generated from your database
- **Test API routes** using Supabase Studio or curl

---

## 🎯 Quick Reference Commands

```bash
# Daily startup (3 terminals)
npx supabase start && npm run dev
npm run stripe:listen  # In separate terminal

# Check everything is running
npx supabase status
stripe --version

# Reset database (fresh start)
npx supabase db reset

# Create new migration
npx supabase migration new migration_name

# Generate TypeScript types
npx supabase gen types typescript --local > src/types/database.ts

# Stop everything
npx supabase stop
# Ctrl+C in stripe:listen terminal
```

---

## 🆘 Getting Help

### 📚 Documentation Links

- **Supabase Local Development**: https://supabase.com/docs/guides/local-development
- **Supabase CLI Reference**: https://supabase.com/docs/reference/cli
- **Next.js Documentation**: https://nextjs.org/docs

### 🔍 When You're Stuck

1. **Check this guide first** - most common issues are covered here
2. **Look at Supabase Studio** - it shows your actual data and schema
3. **Check the browser console** - for frontend errors
4. **Check terminal output** - for backend/API errors
5. **Use `npx supabase logs`** - for Supabase service errors

---

## 🎉 You're Ready!

This guide covers everything you need for daily development. As you get more comfortable:

- You'll memorize the common commands
- You'll understand the data flow better
- You'll be able to debug issues faster
- You'll feel confident making database changes

**Remember**: Local development is safe! You can always reset your database with `npx supabase db reset` if something goes wrong.

Happy coding! 🚀
