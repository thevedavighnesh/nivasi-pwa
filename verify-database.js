/**
 * Database Verification Script
 * Checks if all required tables are created in Neon database
 */

import { neon } from '@neondatabase/serverless';

// Get DATABASE_URL from environment or prompt for it
const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.log('❌ DATABASE_URL not found in environment variables\n');
  console.log('Please run this script with your Neon connection string:');
  console.log('DATABASE_URL="postgresql://..." node verify-database.js\n');
  process.exit(1);
}

const sql = neon(DATABASE_URL);

console.log('🔍 Verifying Neon Database Setup\n');
console.log('='.repeat(60));

async function verifyDatabase() {
  try {
    console.log('\n📡 Testing database connection...');
    await sql`SELECT 1 as test`;
    console.log('✅ Database connection successful!\n');

    // Check for all required tables
    const requiredTables = [
      'auth_users',
      'auth_accounts',
      'auth_sessions',
      'auth_verification_token',
      'users',
      'properties',
      'tenants',
      'property_codes',
      'payments',
      'documents',
      'maintenance_requests',
      'reminders',
      'notifications'
    ];

    console.log('📋 Checking required tables...\n');

    const result = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      ORDER BY table_name
    `;

    const existingTables = result.map(row => row.table_name);
    
    let allTablesExist = true;
    
    for (const table of requiredTables) {
      if (existingTables.includes(table)) {
        console.log(`✅ ${table}`);
      } else {
        console.log(`❌ ${table} - MISSING`);
        allTablesExist = false;
      }
    }

    // Check for indexes
    console.log('\n🔍 Checking indexes...');
    const indexResult = await sql`
      SELECT indexname 
      FROM pg_indexes 
      WHERE schemaname = 'public'
    `;
    
    console.log(`✅ Found ${indexResult.length} indexes`);

    // Check for functions
    console.log('\n⚙️  Checking functions...');
    const functionResult = await sql`
      SELECT routine_name 
      FROM information_schema.routines 
      WHERE routine_schema = 'public'
    `;
    
    console.log(`✅ Found ${functionResult.length} functions`);

    // Get row counts for main tables
    console.log('\n📊 Table Statistics:\n');
    
    for (const table of ['users', 'properties', 'tenants', 'payments']) {
      try {
        const countResult = await sql(`SELECT COUNT(*) as count FROM ${table}`);
        console.log(`   ${table}: ${countResult[0].count} rows`);
      } catch (error) {
        console.log(`   ${table}: Unable to count (table may not exist)`);
      }
    }

    console.log('\n' + '='.repeat(60));

    if (allTablesExist) {
      console.log('\n✅ DATABASE FULLY CONFIGURED!');
      console.log('\n🎉 Your Neon database is ready for deployment!\n');
      console.log('Next steps:');
      console.log('1. Deploy to Vercel');
      console.log('2. Add DATABASE_URL to Vercel environment variables');
      console.log('3. Deploy and test!\n');
    } else {
      console.log('\n⚠️  SOME TABLES ARE MISSING');
      console.log('\nPlease run the schema.sql script in Neon:');
      console.log('1. Go to Neon Dashboard → SQL Editor');
      console.log('2. Copy content from database/schema.sql');
      console.log('3. Paste and click "Run"\n');
    }

  } catch (error) {
    console.log('\n❌ DATABASE VERIFICATION FAILED\n');
    console.log('Error:', error.message);
    console.log('\nPossible issues:');
    console.log('- Invalid connection string');
    console.log('- Database not accessible');
    console.log('- Missing ?sslmode=require in connection string');
    console.log('\nConnection string format:');
    console.log('postgresql://user:pass@ep-xxx.neon.tech/neondb?sslmode=require\n');
    process.exit(1);
  }
}

verifyDatabase();
