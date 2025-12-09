const db = require('./config/database');

async function checkAdmins() {
    try {
        const [admins] = await db.query(
            'SELECT user_id, first_name, last_name, email, role, admin_access_code FROM users WHERE role = "admin"'
        );
        
        console.log('\n=== Admin Users in Database ===');
        console.log(JSON.stringify(admins, null, 2));
        console.log(`\nTotal admin users: ${admins.length}`);
        
        await db.end();
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

checkAdmins();
