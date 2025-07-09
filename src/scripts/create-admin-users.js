// scripts/create-admin-users.js
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables:');
  console.error('   - NEXT_PUBLIC_SUPABASE_URL');
  console.error('   - SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

/**
 * Create an admin user in Supabase
 * @param {string} email - User email
 * @param {string} password - User password
 * @param {string} name - User display name
 * @param {string} role - User role (owner/admin/editor)
 * @returns {Promise<boolean>} Success status
 */
async function createAdminUser(email, password, name, role = 'admin') {
  try {
    console.log(`\n🔄 Creating admin user: ${email}`);
    
    // Create the user with Supabase Auth
    const { data, error } = await supabase.auth.admin.createUser({
      email: email,
      password: password,
      email_confirm: true, // Auto-confirm email
      user_metadata: {
        name: name,
        role: role
      }
    });

    if (error) {
      console.error(`❌ Error creating user ${email}:`, error.message);
      return false;
    }

    if (!data?.user) {
      console.error(`❌ No user data returned for ${email}`);
      return false;
    }

    console.log(`✅ Successfully created admin user: ${email}`);
    console.log(`   - Name: ${name}`);
    console.log(`   - Role: ${role}`);
    console.log(`   - User ID: ${data.user.id}`);
    
    return true;
  } catch (err) {
    console.error(`❌ Unexpected error creating user ${email}:`, err.message);
    return false;
  }
}

/**
 * Main function to create all admin users
 * @returns {Promise<void>}
 */
async function main() {
  console.log('🚀 Creating admin users for Supabase...');
  console.log('📧 Using Supabase URL:', supabaseUrl);
  
  // Get admin emails from environment
  const adminEmailsString = process.env.ADMIN_EMAILS || '';
  const adminEmails = adminEmailsString
    .split(',')
    .map(email => email.trim())
    .filter(Boolean);
  
  if (adminEmails.length === 0) {
    console.error('❌ No admin emails found in ADMIN_EMAILS environment variable');
    console.error('   Please set ADMIN_EMAILS in your .env.local file');
    console.error('   Example: ADMIN_EMAILS=christina@yourteamconsultants.com,admin2@example.com');
    process.exit(1);
  }

  console.log('📋 Admin emails found:', adminEmails);
  
  // Create admin users
  const results = [];
  
  for (let i = 0; i < adminEmails.length; i++) {
    const email = adminEmails[i];
    const name = email.split('@')[0]; // Use part before @ as default name
    const role = i === 0 ? 'owner' : 'admin'; // First email is owner
    const password = 'TempPassword123!'; // Default password - should be changed immediately
    
    const success = await createAdminUser(email, password, name, role);
    results.push({ email, success });
  }
  
  // Summary
  console.log('\n📊 Summary:');
  const successful = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;
  
  console.log(`✅ Successfully created: ${successful} users`);
  console.log(`❌ Failed: ${failed} users`);
  
  if (successful > 0) {
    console.log('\n⚠️  IMPORTANT SECURITY NOTES:');
    console.log('   1. All users were created with the temporary password: TempPassword123!');
    console.log('   2. Users should log in and change their passwords immediately');
    console.log('   3. Users will need to confirm their email addresses');
    console.log('   4. Consider enabling 2FA in Supabase for additional security');
  }
  
  console.log('\n🔗 Next steps:');
  console.log('   1. Have users visit your admin login page');
  console.log('   2. They should sign in with their email and the temporary password');
  console.log('   3. Prompt them to change their password immediately');
  
  process.exit(successful === results.length ? 0 : 1);
}

// Handle errors gracefully
process.on('unhandledRejection', (err) => {
  console.error('❌ Unhandled error:', err.message);
  process.exit(1);
});

// Run the script
main().catch((err) => {
  console.error('❌ Script failed:', err.message);
  process.exit(1);
});