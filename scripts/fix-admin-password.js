#!/usr/bin/env node
const bcrypt = require('bcryptjs');

async function fixAdminPassword() {
  const password = 'MasterAdmin2024!';
  
  console.log('🔐 Fixing Admin Password Hash...');
  console.log('Password to hash:', password);
  
  try {
    // Generate a new, working hash
    const newHash = await bcrypt.hash(password, 10);
    console.log('✅ Generated new hash:', newHash);
    
    // Verify the new hash works
    const isValid = await bcrypt.compare(password, newHash);
    console.log('✅ New hash validation:', isValid);
    
    if (isValid) {
      console.log('\n🎯 WORKING HASH TO USE:');
      console.log(newHash);
      console.log('\n📋 UPDATE INSTRUCTIONS:');
      console.log('1. Update Neon database: UPDATE users SET password_hash = \'' + newHash + '\' WHERE email = \'admin@apprenticeapex.com\';');
      console.log('2. Update server/utils/neonHelper.ts with the same hash');
      console.log('3. Restart server and test admin login');
    } else {
      console.error('❌ Generated hash failed validation');
    }
    
  } catch (error) {
    console.error('❌ Error generating hash:', error);
  }
}

fixAdminPassword();
