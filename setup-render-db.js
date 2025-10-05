/**
 * Render Database Setup Script
 * Initializes the database schema on Render PostgreSQL
 * Works with Neon serverless client
 */

import { neon } from '@neondatabase/serverless';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import * as dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load .env file
dotenv.config({ path: join(__dirname, '.env') });

async function setupDatabase() {
  console.log('🗄️  Render Database Setup\n');
  
  // Get database URL from environment
  const DATABASE_URL = process.env.DATABASE_URL;
  
  if (!DATABASE_URL) {
    console.error('❌ ERROR: DATABASE_URL not found\n');
    console.log('📋 To set it:');
    console.log('   1. Go to Render Dashboard → nivasi-db');
    console.log('   2. Click "Connect" → Copy "External Database URL"');
    console.log('   3. Add to your .env file:');
    console.log('      DATABASE_URL=<paste-url-here>');
    console.log('   4. Run this script again: node setup-render-db.js\n');
    process.exit(1);
  }

  // Initialize Neon client
  const sql = neon(DATABASE_URL);

  try {
    console.log('📡 Connecting to Render PostgreSQL...');
    await sql`SELECT 1 as test`;
    console.log('✅ Connected!\n');

    // Read schema file
    console.log('📄 Reading schema.sql...');
    const schemaPath = join(__dirname, 'database', 'schema.sql');
    const schemaContent = readFileSync(schemaPath, 'utf8');
    console.log('✅ Schema loaded\n');

    // Split schema into individual statements
    console.log('🔨 Creating database tables...');
    const statements = schemaContent
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0);

    for (const statement of statements) {
      if (statement.trim()) {
        await sql([statement]);
      }
    }
    console.log('✅ Tables created!\n');

    // Verify tables
    console.log('🔍 Verifying tables...');
    const result = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `;

    console.log('\n📊 Database Tables Created:');
    console.log('─────────────────────────────');
    result.forEach(row => {
      console.log(`  ✓ ${row.table_name}`);
    });
    console.log('─────────────────────────────');
    console.log(`  Total: ${result.length} tables\n`);

    // Check for required tables
    const requiredTables = [
      'auth_users', 'auth_accounts', 'auth_sessions', 'auth_verification_token',
      'users', 'properties', 'tenants', 'property_codes',
      'payments', 'documents', 'maintenance_requests', 'reminders', 'notifications'
    ];

    const existingTables = result.map(row => row.table_name);
    const missingTables = requiredTables.filter(t => !existingTables.includes(t));

    if (missingTables.length === 0) {
      console.log('✅ All required tables created!\n');
    } else {
      console.log('⚠️  Some tables may be missing:');
      missingTables.forEach(t => console.log(`  - ${t}`));
      console.log('');
    }

    // Optional: Seed data
    if (process.argv.includes('--seed')) {
      console.log('🌱 Seeding initial data...');
      const seedPath = join(__dirname, 'database', 'seed.sql');
      const seedContent = readFileSync(seedPath, 'utf8');
      const seedStatements = seedContent
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0);

      for (const statement of seedStatements) {
        if (statement.trim()) {
          await sql([statement]);
        }
      }
      console.log('✅ Data seeded!\n');
    }

    console.log('🎉 Database setup complete!\n');
    console.log('Next steps:');
    console.log('  1. Go to Render Dashboard: https://dashboard.render.com');
    console.log('  2. Check if nivasi-web service is deployed');
    console.log('  3. Open your app URL');
    console.log('  4. Test sign up / login\n');

  } catch (error) {
    console.error('\n❌ Error setting up database:\n');
    console.error(error.message);
    
    if (error.message.includes('authentication') || error.message.includes('password')) {
      console.log('\n💡 Tips:');
      console.log('  - Check DATABASE_URL is correct in .env');
      console.log('  - Ensure database is running in Render');
      console.log('  - Verify you copied the complete connection string');
    } else if (error.message.includes('connect') || error.message.includes('timeout')) {
      console.log('\n💡 Tips:');
      console.log('  - Check internet connection');
      console.log('  - Verify database is accessible (not suspended)');
      console.log('  - Check Render dashboard for database status');
    } else if (error.message.includes('already exists')) {
      console.log('\n💡 Tables may already exist. This is okay!');
      console.log('  - Run: node check-db.js to verify');
    } else {
      console.log('\n💡 Check the error above and try again');
    }
    
    process.exit(1);
  }
}

// Run the setup
setupDatabase();
