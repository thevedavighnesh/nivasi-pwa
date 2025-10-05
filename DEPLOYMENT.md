# Nivasi Deployment Guide

Complete guide for deploying Nivasi to production.

## 📋 Pre-Deployment Checklist

- [ ] Database schema created and tested
- [ ] Environment variables configured
- [ ] Authentication working locally
- [ ] All API endpoints tested
- [ ] Mobile app tested on physical devices
- [ ] Web app tested in production mode

## 🗄️ Database Deployment

### Option 1: Neon (Recommended for Serverless)

1. **Create Neon Account**
   - Go to https://neon.tech
   - Sign up for free account
   - Create new project

2. **Create Database**
   ```bash
   # Copy connection string from Neon dashboard
   # Format: postgresql://user:password@ep-xxx.region.aws.neon.tech/database?sslmode=require
   ```

3. **Run Schema**
   - Open Neon SQL Editor
   - Copy contents of `apps/web/database/schema.sql`
   - Execute in SQL Editor
   - (Optional) Run `seed.sql` for test data

4. **Update Environment**
   ```env
   DATABASE_URL=postgresql://user:password@ep-xxx.region.aws.neon.tech/nivasi?sslmode=require
   ```

### Option 2: Railway

1. Create Railway account at https://railway.app
2. Create new PostgreSQL database
3. Copy connection string
4. Connect via psql and run schema:
   ```bash
   psql $DATABASE_URL -f apps/web/database/schema.sql
   ```

### Option 3: Supabase

1. Create project at https://supabase.com
2. Go to SQL Editor
3. Run schema.sql contents
4. Copy connection string from Settings > Database

## 🌐 Web App Deployment

### Option 1: Vercel (Recommended)

1. **Install Vercel CLI**
   ```bash
   npm install -g vercel
   ```

2. **Deploy**
   ```bash
   cd apps/web
   vercel
   ```

3. **Configure Environment Variables**
   - Go to Vercel Dashboard > Project > Settings > Environment Variables
   - Add all variables from `.env.example`:
     - `DATABASE_URL`
     - `AUTH_SECRET`
     - `AUTH_URL` (set to your Vercel URL)

4. **Redeploy**
   ```bash
   vercel --prod
   ```

### Option 2: Netlify

1. **Install Netlify CLI**
   ```bash
   npm install -g netlify-cli
   ```

2. **Build**
   ```bash
   cd apps/web
   npm run build
   ```

3. **Deploy**
   ```bash
   netlify deploy --prod
   ```

4. **Configure Environment**
   - Go to Netlify Dashboard > Site Settings > Environment Variables
   - Add all required variables

### Option 3: Railway

1. Create new project on Railway
2. Connect GitHub repository
3. Select `apps/web` as root directory
4. Add environment variables
5. Deploy automatically on push

## 📱 Mobile App Deployment

### Prerequisites

```bash
# Install EAS CLI
npm install -g eas-cli

# Login to Expo
eas login
```

### 1. Configure Project

```bash
cd apps/mobile

# Initialize EAS
eas build:configure
```

This creates `eas.json`:

```json
{
  "build": {
    "production": {
      "env": {
        "EXPO_PUBLIC_BASE_URL": "https://your-domain.com",
        "EXPO_PUBLIC_PROXY_BASE_URL": "https://your-domain.com",
        "EXPO_PUBLIC_HOST": "your-domain.com",
        "EXPO_PUBLIC_PROJECT_GROUP_ID": "nivasi-app"
      }
    },
    "preview": {
      "distribution": "internal"
    }
  },
  "submit": {
    "production": {}
  }
}
```

### 2. Build for iOS

```bash
# Build for iOS
eas build --platform ios --profile production

# For TestFlight
eas build --platform ios --profile preview
```

**Requirements:**
- Apple Developer Account ($99/year)
- Bundle identifier (e.g., com.yourcompany.nivasi)
- App Store Connect access

### 3. Build for Android

```bash
# Build APK for testing
eas build --platform android --profile preview

# Build AAB for Play Store
eas build --platform android --profile production
```

**Requirements:**
- Google Play Developer Account ($25 one-time)
- Keystore (EAS will generate if needed)

### 4. Submit to App Stores

**iOS (App Store):**
```bash
eas submit --platform ios
```

**Android (Play Store):**
```bash
eas submit --platform android
```

### 5. Over-The-Air (OTA) Updates

For quick updates without app store review:

```bash
# Publish update
eas update --branch production --message "Bug fixes"

# Users will receive update on next app launch
```

## 🔐 Security Checklist

### Web App
- [ ] AUTH_SECRET is strong (32+ characters)
- [ ] DATABASE_URL uses SSL (`?sslmode=require`)
- [ ] CORS configured for mobile app domain
- [ ] Rate limiting enabled on API routes
- [ ] Input validation on all endpoints
- [ ] SQL injection prevention (using parameterized queries)
- [ ] XSS protection enabled

### Mobile App
- [ ] API URLs use HTTPS in production
- [ ] Sensitive data stored in SecureStore
- [ ] Certificate pinning for API calls (optional)
- [ ] Code obfuscation enabled

### Database
- [ ] Strong database password
- [ ] IP whitelist configured (if applicable)
- [ ] Regular backups enabled
- [ ] Read replicas for scaling (optional)

## 🚀 Post-Deployment

### 1. Verify Deployment

**Web App:**
```bash
# Test API endpoints
curl https://your-domain.com/api/dashboard?owner_id=1

# Test authentication
curl https://your-domain.com/api/auth/me
```

**Mobile App:**
- Install from TestFlight/Play Store
- Test login flow
- Test all major features
- Check API connectivity

### 2. Monitoring Setup

**Sentry (Error Tracking):**
```bash
# Install Sentry
npm install @sentry/react @sentry/react-native

# Configure in app
```

**Analytics:**
- Google Analytics
- Mixpanel
- Amplitude

### 3. Performance Optimization

**Web:**
- Enable CDN (Vercel/Netlify automatic)
- Configure caching headers
- Optimize images
- Enable compression

**Mobile:**
- Enable Hermes engine (React Native)
- Optimize bundle size
- Lazy load screens
- Cache API responses

## 📊 Scaling Considerations

### Database
- **< 1000 users**: Single Neon instance sufficient
- **1000-10000 users**: Enable connection pooling
- **10000+ users**: Consider read replicas, Redis cache

### API
- **< 10 req/sec**: Single server sufficient
- **10-100 req/sec**: Enable auto-scaling
- **100+ req/sec**: Load balancer + multiple instances

### Storage
- Use cloud storage for documents/images:
  - AWS S3
  - Cloudinary
  - Uploadcare

## 🔄 CI/CD Pipeline

### GitHub Actions Example

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  deploy-web:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: cd apps/web && npm install
      - run: cd apps/web && npm run build
      - uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}

  deploy-mobile:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: cd apps/mobile && npm install
      - run: cd apps/mobile && eas update --branch production
        env:
          EXPO_TOKEN: ${{ secrets.EXPO_TOKEN }}
```

## 🆘 Troubleshooting

### Database Connection Issues
```bash
# Test connection
psql $DATABASE_URL -c "SELECT 1"

# Check SSL requirement
psql "$DATABASE_URL?sslmode=require" -c "SELECT 1"
```

### Mobile App Not Connecting
- Verify EXPO_PUBLIC_BASE_URL is HTTPS
- Check CORS settings on web server
- Test API directly with curl
- Check device network connectivity

### Authentication Errors
- Verify AUTH_SECRET matches between deployments
- Check AUTH_URL is correct
- Clear cookies/cache
- Verify JWT token expiration

## 📞 Support

For deployment issues:
- Email: support@nivasi.com
- Documentation: https://docs.nivasi.com
- GitHub Issues: https://github.com/yourorg/nivasi/issues

---

**Last Updated:** 2025-09-30
