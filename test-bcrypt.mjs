import bcrypt from 'bcryptjs';

const password = 'MasterAdmin2024!';
const testHashes = [
  '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', // password
  '$2a$10$N9qo8uLOickgx2ZMRZoMye7Ib1nQZcHVOmVdqTgdL3M7XiO.k7EeO',
  '$2a$10$K8Qr3bnV8YLZxzn4D5C7Q.LHQZ3bOhXfNF6X1Y2Z3A4B5C6D7E8F9G0',
  '$2b$10$KIXvdZL.Gm2gBkO4hF.Uv.aJkF9DjL6P8cS2Y4oN7qR3eK5xW1vQ2'
];

// Generate a new hash
bcrypt.hash(password, 10).then(hash => {
  console.log('New hash for', password + ':', hash);
  
  // Test the new hash
  bcrypt.compare(password, hash).then(valid => {
    console.log('New hash validates:', valid);
  });
});

// Test existing hashes
testHashes.forEach((hash, i) => {
  bcrypt.compare(password, hash).then(valid => {
    console.log(`Hash ${i + 1} for "${password}":`, valid);
  });
});
