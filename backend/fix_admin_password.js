const bcrypt = require('bcrypt');
const db = require('./config/database');

async function fixAdminPassword() {
    try {
        // Hash the password properly
        const password = 'password123';
        const passwordHash = await bcrypt.hash(password, 10);
        
        console.log('Generated password hash:', passwordHash);
        
        // Update all admin users with the correct hash
        await db.query(
            'UPDATE users SET password_hash = ? WHERE email = ?',
            [passwordHash, 'newadmin@email.com']
        );
        
        console.log('✅ Password updated for newadmin@email.com');
        
        // Also update the other admins if needed
        await db.query(
            'UPDATE users SET password_hash = ? WHERE email = ?',
            [passwordHash, 'dmin@amoviecom.com']
        );
        
        await db.query(
            'UPDATE users SET password_hash = ? WHERE email = ?',
            [passwordHash, 'mod@moviecom.com']
        );
        
        console.log('✅ Password updated for all admin accounts');
        console.log('\nYou can now login with:');
        console.log('Email: newadmin@email.com');
        console.log('Password: password123');
        console.log('Access Code: NEWADMIN2025');
        
        await db.end();
    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}

fixAdminPassword();
