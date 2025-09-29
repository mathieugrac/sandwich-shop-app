#!/usr/bin/env node

/**
 * Script to create admin user in Supabase Auth after db reset
 * Run this after `supabase db reset` to automatically create the admin auth user
 */

const { createClient } = require('@supabase/supabase-js');

// Local Supabase configuration
const supabaseUrl = 'http://127.0.0.1:54321';
const supabaseServiceKey =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';

// Admin user credentials (matching seed.sql)
const ADMIN_EMAIL = 'admin@fome.local';
const ADMIN_PASSWORD = 'MvJ*F8_t';
const ADMIN_NAME = 'Local Admin';

async function createAdminUser() {
  console.log('🔧 Creating admin user in Supabase Auth...\n');

  // Use service role key for admin operations
  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  try {
    // Create auth user
    console.log(`📧 Creating auth user: ${ADMIN_EMAIL}`);
    const { data: authUser, error: authError } =
      await supabase.auth.admin.createUser({
        email: ADMIN_EMAIL,
        password: ADMIN_PASSWORD,
        email_confirm: true, // Skip email confirmation for local dev
        user_metadata: {
          name: ADMIN_NAME,
          role: 'admin',
        },
      });

    if (authError) {
      if (authError.message.includes('already registered')) {
        console.log('✅ Admin user already exists in Auth');
        return;
      }
      throw authError;
    }

    console.log('✅ Admin auth user created successfully!');
    console.log(`   User ID: ${authUser.user.id}`);
    console.log(`   Email: ${authUser.user.email}`);

    console.log('\n🎉 Admin user setup complete!');
    console.log(`   You can now login with:`);
    console.log(`   Email: ${ADMIN_EMAIL}`);
    console.log(`   Password: ${ADMIN_PASSWORD}`);
  } catch (error) {
    console.error('❌ Error creating admin user:', error.message);
    process.exit(1);
  }
}

// Run the script
createAdminUser();
