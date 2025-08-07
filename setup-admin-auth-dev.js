// Development script to set up admin authentication without email confirmation
// This is for development only - use the regular script for production

const { createClient } = require('@supabase/supabase-js');

// Supabase configuration
const supabaseUrl = 'https://tutzpfqwiqhlpletexjg.supabase.co';
const supabaseKey =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR1dHpwZnF3aXFobHBsZXRleGpnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQzNDUxNjAsImV4cCI6MjA2OTkyMTE2MH0.ln1wS7sg9s_oLbaXz06IFK5xI0VA0f1hsTecnbPwKPc';

const supabase = createClient(supabaseUrl, supabaseKey);

async function setupAdminAuthDev() {
  try {
    console.log('Setting up admin authentication for development...\n');

    // Step 1: Check if admin user already exists
    console.log('1. Checking existing admin user...');

    const adminEmail = 'mathieugrac@gmail.com'; // Using your email

    // Try to sign in to see if user exists
    const { data: signInData, error: signInError } =
      await supabase.auth.signInWithPassword({
        email: adminEmail,
        password: 'admin123456',
      });

    if (signInData.user) {
      console.log('✅ Admin user already exists and is confirmed');
      console.log(`   Email: ${adminEmail}`);
      console.log('   Password: admin123456');
      console.log('\n🎉 You can now log in at /admin');
      return;
    }

    // Step 2: Create new admin user
    console.log('\n2. Creating new admin user...');

    const adminPassword = 'admin123456';

    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: adminEmail,
      password: adminPassword,
    });

    if (authError) {
      console.error('❌ Error creating admin user:', authError.message);

      // If user exists but not confirmed, try to resend confirmation
      if (authError.message.includes('already registered')) {
        console.log(
          '\n📧 User exists but email not confirmed. Check your email for confirmation link.'
        );
        console.log('   Or follow these steps to confirm manually:');
        console.log('   1. Go to Supabase Dashboard > Authentication > Users');
        console.log('   2. Find mathieugrac@gmail.com');
        console.log('   3. Click "Confirm" button');
        console.log('   4. Try logging in again');
      }
      return;
    }

    console.log('✅ Admin user created successfully');
    console.log(`   Email: ${adminEmail}`);
    console.log(`   Password: ${adminPassword}`);
    console.log('   ⚠️  IMPORTANT: Change this password in production!');

    // Step 3: Add admin user to admin_users table
    console.log('\n3. Adding admin to admin_users table...');

    const { error: insertError } = await supabase.from('admin_users').insert({
      email: adminEmail,
      name: 'Admin User',
      role: 'admin',
    });

    if (insertError) {
      console.error(
        '❌ Error adding admin to admin_users table:',
        insertError.message
      );
    } else {
      console.log('✅ Admin added to admin_users table');
    }

    console.log('\n📧 IMPORTANT: Email confirmation required!');
    console.log(
      '   Check your email (mathieugrac@gmail.com) for a confirmation link from Supabase.'
    );
    console.log('   Click the link to confirm your account before logging in.');
    console.log('\n   OR manually confirm in Supabase Dashboard:');
    console.log('   1. Go to Supabase Dashboard > Authentication > Users');
    console.log('   2. Find mathieugrac@gmail.com');
    console.log('   3. Click "Confirm" button');
    console.log('   4. Try logging in at /admin');
  } catch (error) {
    console.error('Error setting up admin authentication:', error);
  }
}

setupAdminAuthDev();
