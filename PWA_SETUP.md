# PWA Setup Guide for Nivasi

## ✅ What's Been Added

Your Nivasi app is now a **Progressive Web App (PWA)**! This means:

### 1. **Installable** 📱
- Users can install the app on their device (mobile/desktop)
- Appears on home screen like a native app
- No app store required

### 2. **Offline Support** 🔌
- Works without internet connection
- Caches important resources
- Shows custom offline page when disconnected

### 3. **App-Like Experience** 🎯
- Full-screen mode
- Splash screen
- App icon
- Works like a native application

---

## 📁 Files Added

```
public/
├── manifest.json          # PWA configuration
├── service-worker.js      # Offline caching & background sync
├── offline.html           # Custom offline page
└── icons/                 # App icons (72px to 512px)
    ├── icon-72x72.png
    ├── icon-96x96.png
    ├── icon-128x128.png
    ├── icon-144x144.png
    ├── icon-152x152.png
    ├── icon-192x192.png
    ├── icon-384x384.png
    └── icon-512x512.png

src/app/
└── root.tsx              # Updated with PWA meta tags & service worker registration

generate-pwa-icons.js     # Icon generator script
create-placeholder-pngs.js # Placeholder icon creator
```

---

## 🎨 Customizing Your PWA

### 1. Update App Icons

**Option A: Using the Generator (Recommended)**

1. Create a **512x512 PNG** icon and save it as `source-icon.png` in the project root
2. Install sharp: `npm install sharp --save-dev`
3. Run: `node generate-pwa-icons.js`

**Option B: Online Tools**
- [RealFaviconGenerator](https://realfavicongenerator.net/)
- [PWA Builder Image Generator](https://www.pwabuilder.com/imageGenerator)

### 2. Update App Name & Colors

Edit `public/manifest.json`:

```json
{
  "name": "Your App Name",
  "short_name": "Short Name",
  "theme_color": "#your-color",
  "background_color": "#your-color"
}
```

### 3. Update Meta Tags

Edit `src/app/root.tsx` - find the PWA Meta Tags section:

```tsx
<meta name="theme-color" content="#1a202c" />
<meta name="description" content="Your app description" />
```

---

## 🚀 Testing Your PWA

### Local Testing

1. **Start the dev server:**
   ```bash
   npm run dev
   ```

2. **Open in browser:**
   - Chrome: `chrome://inspect/#service-workers`
   - Edge: `edge://inspect/#service-workers`
   - Firefox: `about:debugging#/runtime/this-firefox`

3. **Test installation:**
   - Look for install button in address bar
   - Or open browser menu → "Install app"

### PWA Audit

Run Lighthouse audit in Chrome DevTools:
1. Open Chrome DevTools (F12)
2. Go to "Lighthouse" tab
3. Check "Progressive Web App"
4. Click "Generate report"

---

## 📱 How Users Install Your App

### Desktop (Chrome/Edge)
1. Visit your website
2. Click install icon in address bar
3. Click "Install"

### Mobile (Android/iOS)
**Android:**
1. Visit website in Chrome
2. Tap menu (⋮)
3. Tap "Add to Home screen"

**iOS:**
1. Visit website in Safari
2. Tap share button
3. Tap "Add to Home Screen"

---

## ⚙️ Service Worker Features

### Current Features
- ✅ **Offline caching** - Key resources cached automatically
- ✅ **Network-first strategy** - Always try network, fallback to cache
- ✅ **Background sync** - Ready for offline data sync
- ✅ **Push notifications** - Infrastructure ready

### Customizing Cache Strategy

Edit `public/service-worker.js`:

```javascript
const CACHE_NAME = 'nivasi-v1'; // Change version to force update

const urlsToCache = [
  '/',
  '/manifest.json',
  // Add more URLs to cache
];
```

### Cache Strategies

**Network First (Current):**
- Best for dynamic content
- Always tries network first
- Falls back to cache if offline

**Cache First:**
- Best for static assets
- Faster load times
- Use for images, CSS, JS

---

## 🔧 Deployment

### Build for Production

```bash
npm run build
```

### Important Deployment Notes

1. **HTTPS Required** - PWAs require HTTPS (except localhost)
2. **Service Worker Scope** - Ensure `service-worker.js` is at root
3. **Update Strategy** - Change `CACHE_NAME` to force updates

### Platform-Specific

**Vercel/Netlify:**
- Service worker works automatically
- No additional configuration needed

**Custom Server:**
- Ensure service worker is served with correct MIME type
- Add to nginx config:
  ```nginx
  location /service-worker.js {
    add_header Cache-Control "no-cache";
    add_header Content-Type "application/javascript";
  }
  ```

---

## 🐛 Troubleshooting

### Service Worker Not Registering

**Check:**
1. HTTPS is enabled (or using localhost)
2. No browser extensions blocking
3. Console for error messages

**Fix:**
```javascript
// Clear old service workers
navigator.serviceWorker.getRegistrations().then(function(registrations) {
  for(let registration of registrations) {
    registration.unregister();
  }
});
```

### App Not Installing

**Check:**
1. Manifest is valid (use [PWA Builder](https://www.pwabuilder.com/))
2. All icons are present
3. HTTPS is enabled
4. Service worker is registered

### Updates Not Showing

**Fix:** Bump the version in `service-worker.js`:
```javascript
const CACHE_NAME = 'nivasi-v2'; // Increment version
```

---

## 📊 PWA Checklist

- [x] Manifest.json created
- [x] Service worker implemented
- [x] Icons in all sizes
- [x] Meta tags added
- [x] Offline page created
- [x] HTTPS ready
- [ ] Custom icons (replace placeholders)
- [ ] Test on multiple devices
- [ ] Lighthouse PWA score 90+

---

## 🔄 Updating Your PWA

### When to Update Service Worker

- Adding new offline features
- Changing cache strategy
- Fixing bugs
- Adding new cached resources

### How to Update

1. Update `service-worker.js`
2. Change `CACHE_NAME` version:
   ```javascript
   const CACHE_NAME = 'nivasi-v2'; // Increment
   ```
3. Deploy changes
4. Users will get update automatically on next visit

---

## 🌟 Advanced Features (Optional)

### 1. Add Shortcuts

Edit `public/manifest.json`:
```json
"shortcuts": [
  {
    "name": "Add Property",
    "url": "/properties/add",
    "icons": [{ "src": "/icons/icon-96x96.png", "sizes": "96x96" }]
  }
]
```

### 2. Add Screenshots

```json
"screenshots": [
  {
    "src": "/screenshots/desktop.png",
    "sizes": "1280x720",
    "type": "image/png"
  }
]
```

### 3. Share Target API

```json
"share_target": {
  "action": "/share",
  "method": "POST",
  "enctype": "multipart/form-data"
}
```

---

## 📚 Resources

- [PWA Builder](https://www.pwabuilder.com/)
- [Workbox (Advanced Service Worker)](https://developers.google.com/web/tools/workbox)
- [MDN PWA Guide](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps)
- [Web.dev PWA](https://web.dev/progressive-web-apps/)

---

## ✅ What's Working

✨ Your Nivasi app now:
- Installs on any device
- Works offline
- Feels like a native app
- Loads faster with caching
- Shows up on user's home screen

**Test it now:** Start your dev server and look for the install button in your browser! 🎉
