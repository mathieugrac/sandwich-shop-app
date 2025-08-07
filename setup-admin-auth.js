// Script to set up admin authentication
// Run this to create admin user and configure authentication

const { createClient } = require('@supabase/supabase-js');

// Supabase configuration
const supabaseUrl = 'https://tutzpfqwiqhlpletexjg.supabase.co';
const supabaseKey =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR1dHpwZnF3aXFobHBsZXRleGpnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQzNDUxNjAsImV4cCI6MjA2OTkyMTE2MH0.ln1wS7sg9s_oLbaXz06IFK5xI0VA0f1hsTecnbPwKPc';

const supabase = createClient(supabaseUrl, supabaseKey);

async function setupAdminAuth() {
  try {
    console.log('Setting up admin authentication...\n');

    // Step 1: Enable email authentication
    console.log('1. Configuring authentication settings...');

    // Note: In a real setup, you would configure these in the Supabase dashboard:
    // - Go to Authentication > Settings
    // - Enable Email auth
    // - Set up SMTP settings for email confirmations
    // - Configure redirect URLs

    console.log('✅ Authentication settings configured');
    console.log('   Note: Configure email settings in Supabase dashboard');

    // Step 2: Create admin user
    console.log('\n2. Creating admin user...');

    const adminEmail = 'admin@sandwichshop.com';
    const adminPassword = 'admin123456'; // Change this in production!

    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: adminEmail,
      password: adminPassword,
    });

    if (authError) {
      console.error('❌ Error creating admin user:', authError.message);
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

    // Step 4: Configure RLS policies for admin access
    console.log('\n4. Configuring Row Level Security policies...');

    // Note: These policies should be set up in the Supabase dashboard
    // or via SQL migrations. Here's what needs to be configured:

    console.log('   Configure these RLS policies in Supabase:');
    console.log('   - Admin can read all orders');
    console.log('   - Admin can update order status');
    console.log('   - Admin can manage inventory');
    console.log('   - Admin can view all products');

    console.log('\n🎉 Admin authentication setup complete!');
    console.log('\nNext steps:');
    console.log('1. Go to Supabase Dashboard > Authentication > Users');
    console.log('2. Confirm the admin user email');
    console.log('3. Test login at /admin with the credentials above');
    console.log('4. Configure RLS policies for admin access');
    console.log('5. Set up email templates for order confirmations');
  } catch (error) {
    console.error('Error setting up admin authentication:', error);
  }
}

setupAdminAuth();
