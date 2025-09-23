const bcrypt = require('bcryptjs');

async function testHash() {
  const password = 'MasterAdmin2024!';
  
  // Generate proper hash
  const hash = await bcrypt.hash(password, 10);
  console.log('Generated hash:', hash);
  
  // Test generated hash
  const valid = await bcrypt.compare(password, hash);
  console.log('Generated hash validates:', valid);
  
  // Test the hash currently in the helper
  const currentHash = '$2b$10$DkOh5p1cJQhRzYL3f/7h4uXg8Kf6PqW9C2vN5jL8hO1eI3xR7sB4t';
  const currentValid = await bcrypt.compare(password, currentHash);
  console.log('Current hash validates:', currentValid);
  
  // Try a known good hash for testing
  const testHash = await bcrypt.hash('test123', 10);
  console.log('Test hash for "test123":', testHash);
}

testHash().catch(console.error);
