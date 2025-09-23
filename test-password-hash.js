const bcrypt = require('bcryptjs');

async function generateCorrectHash() {
  const password = 'MasterAdmin2024!';
  
  try {
    // Generate a proper hash
    const hash = await bcrypt.hash(password, 10);
    console.log('Generated hash:', hash);
    
    // Test the generated hash
    const isValid = await bcrypt.compare(password, hash);
    console.log('Generated hash validates:', isValid);
    
    // Test the current database hash
    const currentHash = '$2b$10$DkOh5p1cJQhRzYL3f/7h4uXg8Kf6PqW9C2vN5jL8hO1eI3xR7sB4t';
    const currentValid = await bcrypt.compare(password, currentHash);
    console.log('Current database hash validates:', currentValid);
    
    // Test some known working hashes
    const testHashes = [
      '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', // "password"
      '$2a$10$N9qo8uLOickgx2ZMRZoMye7Ib1nQZcHVOmVdqTgdL3M7XiO.k7EeO'  // common test
    ];
    
    console.log('\nTesting known hashes:');
    for (let i = 0; i < testHashes.length; i++) {
      const testValid = await bcrypt.compare('password', testHashes[i]);
      console.log(`Test hash ${i + 1} for "password":`, testValid);
    }
    
  } catch (error) {
    console.error('Error:', error);
  }
}

generateCorrectHash();
