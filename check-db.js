/**
 * Simple Database Check - Works on Windows
 * Add your DATABASE_URL to .env file first
 */

import { neon } from '@neondatabase/serverless';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load .env file
dotenv.config({ path: join(__dirname, '.env') });

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.log('❌ DATABASE_URL not found in .env file\n');
  console.log('Please add to your .env file:');
  console.log('DATABASE_URL=postgresql://your-connection-string\n');
  process.exit(1);
}

console.log('🔍 Checking Neon Database...\n');

const sql = neon(DATABASE_URL);

async function checkDatabase() {
  try {
    console.log('📡 Testing connection...');
    await sql`SELECT 1 as test`;
    console.log('✅ Connection successful!\n');

    console.log('📋 Checking tables...\n');
    
    const result = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `;

    const requiredTables = [
      'auth_users', 'auth_accounts', 'auth_sessions', 'auth_verification_token',
      'users', 'properties', 'tenants', 'property_codes',
      'payments', 'documents', 'maintenance_requests', 'reminders', 'notifications'
    ];

    const existingTables = result.map(row => row.table_name);
    let allGood = true;

    for (const table of requiredTables) {
      if (existingTables.includes(table)) {
        console.log(`✅ ${table}`);
      } else {
        console.log(`❌ ${table} - MISSING`);
        allGood = false;
      }
    }

    console.log('\n' + '='.repeat(50));

    if (allGood) {
      console.log('\n✅ DATABASE READY FOR DEPLOYMENT!\n');
      console.log('Your connection string for Vercel:');
      console.log(DATABASE_URL);
      console.log('\nNext: Deploy to Vercel 🚀\n');
    } else {
      console.log('\n⚠️  Some tables missing. Run schema.sql in Neon.\n');
    }

  } catch (error) {
    console.log('\n❌ Error:', error.message);
    console.log('\nCheck your connection string in .env file\n');
  }
}

checkDatabase();
