const http = require('http');

console.log('========================================');
console.log('System Verification Script');
console.log('========================================\n');

// Test MySQL Connection
async function testDatabase() {
    try {
        const db = require('./config/database');
        const [rows] = await db.query('SELECT COUNT(*) as count FROM users');
        console.log('✅ Database Connection: OK');
        console.log(`   Users in database: ${rows[0].count}`);
        
        const [movies] = await db.query('SELECT COUNT(*) as count FROM movies');
        console.log(`   Movies in database: ${movies[0].count}`);
        
        await db.end();
        return true;
    } catch (error) {
        console.log('❌ Database Connection: FAILED');
        console.log(`   Error: ${error.message}`);
        return false;
    }
}

// Test API Server
function testServer() {
    return new Promise((resolve) => {
        const options = {
            hostname: 'localhost',
            port: 3000,
            path: '/api/movies',
            method: 'GET'
        };

        const req = http.request(options, (res) => {
            if (res.statusCode === 200) {
                console.log('✅ API Server: OK');
                console.log(`   Server responding on port 3000`);
                resolve(true);
            } else {
                console.log('⚠️  API Server: Running but returned status', res.statusCode);
                resolve(false);
            }
        });

        req.on('error', () => {
            console.log('❌ API Server: NOT RUNNING');
            console.log('   Please start the server with: npm start');
            resolve(false);
        });

        req.end();
    });
}

// Test Environment Variables
function testEnvVars() {
    require('dotenv').config();
    
    const requiredVars = ['DB_HOST', 'DB_USER', 'DB_PASSWORD', 'DB_NAME', 'JWT_SECRET'];
    let allPresent = true;
    
    console.log('\nEnvironment Variables:');
    requiredVars.forEach(varName => {
        if (process.env[varName]) {
            console.log(`✅ ${varName}: Set`);
        } else {
            console.log(`❌ ${varName}: Missing`);
            allPresent = false;
        }
    });
    
    return allPresent;
}

// Check Dependencies
function checkDependencies() {
    console.log('\nDependencies:');
    const fs = require('fs');
    const packageJson = JSON.parse(fs.readFileSync('./package.json', 'utf8'));
    
    const deps = packageJson.dependencies;
    console.log(`✅ Found ${Object.keys(deps).length} dependencies`);
    
    return true;
}

// Main verification
async function verify() {
    console.log('Starting verification...\n');
    
    const envCheck = testEnvVars();
    const depsCheck = checkDependencies();
    const dbCheck = await testDatabase();
    
    console.log('\n========================================');
    console.log('Verification Summary');
    console.log('========================================');
    console.log(`Environment Variables: ${envCheck ? '✅' : '❌'}`);
    console.log(`Dependencies: ${depsCheck ? '✅' : '❌'}`);
    console.log(`Database: ${dbCheck ? '✅' : '❌'}`);
    
    if (envCheck && depsCheck && dbCheck) {
        console.log('\n✅ All checks passed! Your system is ready.');
        console.log('\nNext steps:');
        console.log('1. Start the server: npm start');
        console.log('2. Open frontend: http://localhost:8080');
        console.log('3. Login with: john.doe@email.com / password123');
    } else {
        console.log('\n❌ Some checks failed. Please fix the issues above.');
    }
    
    console.log('\n========================================\n');
}

verify();
