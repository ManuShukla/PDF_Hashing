import pg from 'pg';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '.env') });

const { Pool } = pg;

async function testConnection() {
    console.log('Testing NeonDB connection...\n');
    
    const dbConfig = {
        host: process.env.DB_HOST,
        port: parseInt(process.env.DB_PORT) || 5432,
        user: process.env.DB_USERNAME,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_DATABASE,
        ssl: process.env.DB_SSL === 'true' ? {
            rejectUnauthorized: false
        } : false
    };
    
    console.log('Configuration loaded:');
    console.log(`  Host: ${dbConfig.host}`);
    console.log(`  Port: ${dbConfig.port}`);
    console.log(`  Database: ${dbConfig.database}`);
    console.log(`  Username: ${dbConfig.user}`);
    console.log(`  SSL: ${dbConfig.ssl ? 'Enabled' : 'Disabled'}`);
    console.log('\nAttempting connection...\n');
    
    const pool = new Pool({
        ...dbConfig,
        connectionTimeoutMillis: 20000
    });
    
    try {
        const start = Date.now();
        const result = await pool.query('SELECT NOW(), version()');
        const elapsed = Date.now() - start;
        
        console.log('✓ Connection successful!');
        console.log(`  Time: ${elapsed}ms`);
        console.log(`  Current time: ${result.rows[0].now}`);
        console.log(`  PostgreSQL: ${result.rows[0].version.split(',')[0]}`);
        
        // Test a simple query
        const testResult = await pool.query('SELECT COUNT(*) as count FROM pdf_hashes');
        console.log(`  Records in pdf_hashes: ${testResult.rows[0].count}`);
        
    } catch (error) {
        console.error('✗ Connection failed!');
        console.error(`  Error: ${error.message}`);
        console.error(`  Code: ${error.code}`);
        if (error.code === 'ETIMEDOUT') {
            console.error('\n  Troubleshooting:');
            console.error('  - Check if NeonDB compute is active');
            console.error('  - Verify host and port are correct');
            console.error('  - Check firewall/network settings');
        }
    } finally {
        await pool.end();
    }
}

testConnection();
