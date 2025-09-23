import bcrypt from 'bcryptjs';

const password = 'MasterAdmin2024!';

// Generate hash
const hash = await bcrypt.hash(password, 10);
console.log('Password:', password);
console.log('Generated hash:', hash);

// Verify it works
const isValid = await bcrypt.compare(password, hash);
console.log('Hash verification:', isValid);

// Provide update instructions
if (isValid) {
  console.log('\n✅ WORKING HASH GENERATED!');
  console.log('\n📋 UPDATE COMMANDS:');
  console.log('Neon SQL: UPDATE users SET password_hash = \'' + hash + '\' WHERE email = \'admin@apprenticeapex.com\';');
  console.log('\nHelper update: password_hash: \'' + hash + '\'');
} else {
  console.log('❌ Hash generation failed');
}
