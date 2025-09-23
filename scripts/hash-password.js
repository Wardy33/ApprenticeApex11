const bcrypt = require('bcryptjs');

async function hashPassword() {
    const password = 'MasterAdmin2024!';
    const saltRounds = 10;
    
    try {
        const hash = await bcrypt.hash(password, saltRounds);
        console.log('Password:', password);
        console.log('Hash:', hash);
        
        // Verify the hash works
        const isValid = await bcrypt.compare(password, hash);
        console.log('Verification:', isValid);
    } catch (error) {
        console.error('Error:', error);
    }
}

hashPassword();
