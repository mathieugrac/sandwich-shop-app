# 🔄 Supabase Migration Workflow Guide

## Overview

This guide explains how to properly manage database schema changes using Supabase CLI migrations. After cleaning up our migration history, we now have a clean, reliable workflow.

## 🏗️ Current Setup Status

✅ **Clean Migration History**: All old migrations consolidated into one clean initial schema  
✅ **Local & Remote Sync**: Both databases are in sync with the same migration state  
✅ **Proper CLI Link**: Connected to `fome-sandwich-shop` production project  
✅ **Working Seed Data**: Sample data loads correctly after migrations

## 📋 The Proper Migration Workflow

### 1. Making Schema Changes

**For Simple Changes (recommended):**

```bash
# Create a new migration
supabase migration new add_column_name

# Edit the generated .sql file with your changes
# Keep it simple and focused on ONE logical change
```

**For Complex Changes:**

- Develop and test in Supabase Studio first
- Once working, capture the changes in a migration
- Break complex changes into multiple small migrations

### 2. Testing Locally

```bash
# For complete local development setup (RECOMMENDED)
npm run db:reset-full

# This runs: supabase db reset + creates admin user + uploads images
# Gives you a fully working environment in one command

# Alternative: Just reset database (migrations + seed data only)
supabase db reset

# Verify everything works
# Test your application locally
# Check that seed data still loads correctly
```

**💡 Pro Tip**: Always use `npm run db:reset-full` for local development instead of just `supabase db reset`. This ensures you have a complete working environment with:

- ✅ Clean database with all migrations applied
- ✅ Sample data loaded
- ✅ Admin user created in Supabase Auth
- ✅ Product images uploaded to Supabase Storage

### 3. Deploying to Production

```bash
# Deploy migrations to remote database
supabase db push

# Verify deployment
supabase migration list
```

## ✅ Migration Best Practices

### DO:

- **Keep migrations small and focused** - One logical change per migration
- **Test locally first** - Always run `supabase db reset` before deploying
- **Use descriptive names** - `add_product_tags` not `update_schema`
- **Include comments** - Explain what and why you're changing
- **Add indexes when needed** - For new columns that will be queried

### DON'T:

- **Mix schema and data changes** - Keep them separate
- **Create huge migrations** - Break them into smaller pieces
- **Skip local testing** - Always test before deploying
- **Modify existing migrations** - Create new ones instead
- **Ignore migration errors** - Fix them properly, don't work around them

## 📝 Migration File Structure

```sql
-- Clear description of what this migration does
-- Explain the business reason if not obvious

-- The actual schema change
ALTER TABLE products
ADD COLUMN new_field TEXT;

-- Add helpful comments
COMMENT ON COLUMN products.new_field IS 'Description of what this field stores';

-- Add indexes if the field will be queried
CREATE INDEX idx_products_new_field ON products(new_field);

-- Update existing data if needed (be careful with large tables)
UPDATE products SET new_field = 'default_value' WHERE new_field IS NULL;
```

## 🔧 Common Migration Patterns

### Adding a Column

```sql
-- Add a new column with default value
ALTER TABLE products ADD COLUMN tags TEXT[] DEFAULT '{}';

-- Add comment for documentation
COMMENT ON COLUMN products.tags IS 'Array of product tags';

-- Add index for searching
CREATE INDEX idx_products_tags ON products USING GIN(tags);
```

### Creating a New Table

```sql
-- Create the table
CREATE TABLE product_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes
CREATE INDEX idx_product_reviews_product_id ON product_reviews(product_id);
CREATE INDEX idx_product_reviews_rating ON product_reviews(rating);

-- Enable RLS
ALTER TABLE product_reviews ENABLE ROW LEVEL SECURITY;

-- Add RLS policies
CREATE POLICY "Public can view reviews" ON product_reviews
  FOR SELECT USING (true);
```

### Adding a Function

```sql
-- Create a simple, focused function
CREATE OR REPLACE FUNCTION get_product_average_rating(product_uuid UUID)
RETURNS DECIMAL AS $$
BEGIN
  RETURN (
    SELECT COALESCE(AVG(rating), 0)
    FROM product_reviews
    WHERE product_id = product_uuid
  );
END;
$$ LANGUAGE plpgsql;
```

## 🚨 Troubleshooting

### Migration Fails Locally

1. Check the error message carefully
2. Fix the SQL syntax in the migration file
3. Run `supabase db reset` again
4. Don't proceed to production until it works locally

### Migration Fails on Production

1. Check the error in the CLI output
2. Fix the issue in a new migration (don't modify the failed one)
3. Deploy the fix with `supabase db push`

### Need to Undo a Migration

1. Create a new migration that reverses the changes
2. Don't delete or modify existing migration files
3. Example: If you added a column, create a migration that drops it

## 📊 Checking Migration Status

```bash
# See what's applied locally vs remotely
supabase migration list

# See only local migrations
supabase migration list --local

# Check if databases are in sync
supabase db diff
```

## 🎯 Example: Complete Migration Workflow

Let's say you want to add a "featured" flag to products:

```bash
# 1. Create migration
supabase migration new add_product_featured_flag

# 2. Edit the file:
```

```sql
-- Add featured flag to highlight special products
ALTER TABLE products
ADD COLUMN featured BOOLEAN DEFAULT false;

-- Add comment
COMMENT ON COLUMN products.featured IS 'Whether this product should be highlighted as featured';

-- Add index for filtering featured products
CREATE INDEX idx_products_featured ON products(featured) WHERE featured = true;

-- Mark one product as featured for testing
UPDATE products
SET featured = true
WHERE name = 'Nutty Beet';
```

```bash
# 3. Test locally
supabase db reset

# 4. Verify it works (check your app, run queries, etc.)

# 5. Deploy to production
supabase db push

# 6. Verify deployment
supabase migration list
```

## 🎉 Benefits of This Clean Approach

- **Reliable deployments** - Migrations work consistently
- **Easy rollbacks** - Clear history of what changed when
- **Team collaboration** - Everyone follows the same process
- **Production safety** - Always test locally first
- **Clear audit trail** - Know exactly what changed and when

## 🔗 Related Commands

```bash
# Start local development
supabase start

# Reset local database (applies all migrations)
supabase db reset

# Create new migration
supabase migration new <name>

# Deploy to production
supabase db push

# Check status
supabase status
supabase migration list

# Stop local development
supabase stop
```

---

**Remember**: The key to successful migrations is keeping them simple, testing locally, and deploying incrementally. When in doubt, break a complex change into multiple smaller migrations!
