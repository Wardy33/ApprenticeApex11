const bcrypt = require('bcryptjs');

async function createHash() {
    const password = 'MasterAdmin2024!';
    const hash = await bcrypt.hash(password, 10);
    console.log('Password to hash:', password);
    console.log('Generated hash:', hash);
    
    // Test the hash
    const isValid = await bcrypt.compare(password, hash);
    console.log('Hash verification:', isValid);
}

createHash().catch(console.error);
