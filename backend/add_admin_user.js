const db = require('./config/database');

async function addAdminUser() {
    try {
        // Check if user already exists
        const [existing] = await db.query(
            'SELECT user_id FROM users WHERE email = ?',
            ['newadmin@email.com']
        );
        
        if (existing.length > 0) {
            console.log('❌ User with email newadmin@email.com already exists!');
            await db.end();
            return;
        }
        
        // Insert new admin user
        const [result] = await db.query(
            `INSERT INTO users (first_name, last_name, email, password_hash, date_joined, role, admin_access_code, bio) 
             VALUES (?, ?, ?, ?, NOW(), ?, ?, ?)`,
            ['New', 'Admin', 'newadmin@email.com', '$2b$10$rN8JK/FKvqLZyOzKYzxLqe4p9YXxP3H5YJKbXxF5YJKbXxF5YJKbXe', 'admin', 'NEWADMIN2025', 'Additional admin user']
        );
        
        console.log('✅ New admin user created successfully!');
        console.log(`   User ID: ${result.insertId}`);
        console.log('   Email: newadmin@email.com');
        console.log('   Password: password123');
        console.log('   Access Code: NEWADMIN2025');
        
        // Verify
        const [admins] = await db.query(
            'SELECT user_id, first_name, last_name, email, role, admin_access_code FROM users WHERE role = "admin"'
        );
        
        console.log('\n=== All Admin Users ===');
        admins.forEach(admin => {
            console.log(`${admin.user_id}. ${admin.first_name} ${admin.last_name} - ${admin.email} (Code: ${admin.admin_access_code})`);
        });
        
        await db.end();
    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}

addAdminUser();
