/**
 * Pre-Deployment Checklist Script
 * Verifies that all PWA files and configurations are ready for deployment
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🔍 Nivasi PWA Deployment Checklist\n');
console.log('='.repeat(50));

let allGood = true;
const warnings = [];

// Check required files
const requiredFiles = [
  'package.json',
  'public/manifest.json',
  'public/service-worker.js',
  'public/offline.html',
  'src/app/root.tsx',
  'database/schema.sql',
  'vercel.json',
  'Dockerfile',
  'render.yaml'
];

console.log('\n📁 Checking Required Files...\n');
requiredFiles.forEach(file => {
  const filePath = path.join(__dirname, file);
  if (fs.existsSync(filePath)) {
    console.log(`✅ ${file}`);
  } else {
    console.log(`❌ ${file} - MISSING!`);
    allGood = false;
  }
});

// Check icons
console.log('\n🎨 Checking PWA Icons...\n');
const iconSizes = [72, 96, 128, 144, 152, 192, 384, 512];
const iconsDir = path.join(__dirname, 'public', 'icons');

if (!fs.existsSync(iconsDir)) {
  console.log('❌ Icons directory missing!');
  allGood = false;
} else {
  iconSizes.forEach(size => {
    const iconPath = path.join(iconsDir, `icon-${size}x${size}.png`);
    if (fs.existsSync(iconPath)) {
      const stats = fs.statSync(iconPath);
      if (stats.size < 100) {
        console.log(`⚠️  icon-${size}x${size}.png exists but is placeholder (${stats.size} bytes)`);
        warnings.push(`Replace placeholder icon-${size}x${size}.png with actual icon`);
      } else {
        console.log(`✅ icon-${size}x${size}.png (${stats.size} bytes)`);
      }
    } else {
      console.log(`❌ icon-${size}x${size}.png - MISSING!`);
      allGood = false;
    }
  });
}

// Check manifest.json
console.log('\n📋 Checking Manifest...\n');
const manifestPath = path.join(__dirname, 'public', 'manifest.json');
if (fs.existsSync(manifestPath)) {
  try {
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    
    if (manifest.name) {
      console.log(`✅ App name: "${manifest.name}"`);
    } else {
      console.log('❌ Manifest missing "name" field');
      allGood = false;
    }
    
    if (manifest.short_name) {
      console.log(`✅ Short name: "${manifest.short_name}"`);
    } else {
      warnings.push('Consider adding "short_name" to manifest');
    }
    
    if (manifest.icons && manifest.icons.length > 0) {
      console.log(`✅ Icons defined: ${manifest.icons.length} sizes`);
    } else {
      console.log('❌ Manifest missing icons array');
      allGood = false;
    }
    
    if (manifest.start_url) {
      console.log(`✅ Start URL: ${manifest.start_url}`);
    } else {
      console.log('❌ Manifest missing "start_url"');
      allGood = false;
    }
    
    if (manifest.display) {
      console.log(`✅ Display mode: ${manifest.display}`);
    } else {
      warnings.push('Consider setting "display" in manifest');
    }
    
  } catch (error) {
    console.log(`❌ Invalid manifest.json: ${error.message}`);
    allGood = false;
  }
}

// Check service worker
console.log('\n⚙️  Checking Service Worker...\n');
const swPath = path.join(__dirname, 'public', 'service-worker.js');
if (fs.existsSync(swPath)) {
  const swContent = fs.readFileSync(swPath, 'utf8');
  
  if (swContent.includes('CACHE_NAME')) {
    console.log('✅ Cache name defined');
  } else {
    console.log('⚠️  No cache name found');
    warnings.push('Service worker should define CACHE_NAME');
  }
  
  if (swContent.includes('install')) {
    console.log('✅ Install event handler present');
  }
  
  if (swContent.includes('activate')) {
    console.log('✅ Activate event handler present');
  }
  
  if (swContent.includes('fetch')) {
    console.log('✅ Fetch event handler present');
  }
  
  console.log(`📊 Service worker size: ${(swContent.length / 1024).toFixed(2)} KB`);
}

// Check package.json scripts
console.log('\n📦 Checking Build Scripts...\n');
const packagePath = path.join(__dirname, 'package.json');
if (fs.existsSync(packagePath)) {
  const pkg = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
  
  if (pkg.scripts) {
    const requiredScripts = ['dev', 'build', 'start'];
    requiredScripts.forEach(script => {
      if (pkg.scripts[script]) {
        console.log(`✅ npm run ${script}: ${pkg.scripts[script]}`);
      } else {
        console.log(`❌ Missing script: ${script}`);
        allGood = false;
      }
    });
  }
}

// Check for .env.example
console.log('\n🔐 Checking Environment Template...\n');
const envExamplePath = path.join(__dirname, '.env.example');
if (fs.existsSync(envExamplePath)) {
  console.log('✅ .env.example exists (for deployment reference)');
} else {
  warnings.push('Consider creating .env.example for deployment reference');
}

// Check root.tsx for PWA integration
console.log('\n🔗 Checking PWA Integration...\n');
const rootPath = path.join(__dirname, 'src', 'app', 'root.tsx');
if (fs.existsSync(rootPath)) {
  const rootContent = fs.readFileSync(rootPath, 'utf8');
  
  if (rootContent.includes('manifest')) {
    console.log('✅ Manifest link in root.tsx');
  } else {
    console.log('❌ Manifest link missing in root.tsx');
    allGood = false;
  }
  
  if (rootContent.includes('serviceWorker')) {
    console.log('✅ Service worker registration in root.tsx');
  } else {
    console.log('❌ Service worker registration missing in root.tsx');
    allGood = false;
  }
  
  if (rootContent.includes('apple-mobile-web-app')) {
    console.log('✅ Apple PWA meta tags present');
  } else {
    warnings.push('Consider adding Apple PWA meta tags for iOS support');
  }
}

// Final report
console.log('\n' + '='.repeat(50));
console.log('\n📊 DEPLOYMENT READINESS REPORT\n');

if (allGood && warnings.length === 0) {
  console.log('🎉 ALL CHECKS PASSED!');
  console.log('✅ Your PWA is ready for deployment!\n');
  console.log('Next steps:');
  console.log('1. Push to GitHub: git push');
  console.log('2. Deploy to Vercel/Render/Railway');
  console.log('3. See DEPLOY_PWA.md for detailed instructions\n');
} else if (allGood && warnings.length > 0) {
  console.log('✅ READY FOR DEPLOYMENT (with warnings)\n');
  console.log('⚠️  Warnings:');
  warnings.forEach((w, i) => {
    console.log(`   ${i + 1}. ${w}`);
  });
  console.log('\nYou can deploy now, but consider addressing warnings for production.\n');
} else {
  console.log('❌ NOT READY FOR DEPLOYMENT\n');
  console.log('Please fix the issues marked with ❌ above before deploying.\n');
  process.exit(1);
}

// Deployment recommendations
console.log('💡 Recommendations:');
console.log('   - Use Vercel for best PWA support and performance');
console.log('   - Use Neon for free PostgreSQL database');
console.log('   - Generate real icons before production (run: node generate-pwa-icons.js)');
console.log('   - Test PWA installation on mobile devices');
console.log('   - Run Lighthouse audit after deployment\n');

console.log('📚 Documentation:');
console.log('   - PWA Setup: PWA_SETUP.md');
console.log('   - Deployment: DEPLOY_PWA.md');
console.log('   - General Deploy: DEPLOY_NOW.md\n');
