// Service Worker v6 — bulletproof install (ไม่ crash ถ้า asset หาไม่เจอ)
const CACHE = 'paanya-v6';

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(async cache => {
      // cache ทีละไฟล์ — ถ้าไฟล์ใดหาไม่เจอ ไม่ทำให้ทั้งหมดพัง
      const files = [
        './index.html',
        './manifest.json',
        './icons/icon-192.png',
        './icons/icon-512.png',
        './icons/icon-192-maskable.png',
        './icons/icon-512-maskable.png',
        './icons/icon-180.png'
      ];
      for (const f of files) {
        try { await cache.add(f); } catch(e) { console.warn('SW skip:', f); }
      }
    }).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  // ต้องมี fetch handler เสมอ — Chrome ใช้ตรวจว่าเป็น PWA
  if (e.request.method !== 'GET') return;
  const url = e.request.url;
  // ไม่ cache API calls
  if (url.includes('supabase.co') ||
      url.includes('googleapis.com') ||
      url.includes('jsonbin.io') ||
      url.includes('anthropic.com') ||
      url.includes('fonts.g')) return;

  e.respondWith(
    caches.match(e.request).then(cached => {
      if (cached) return cached;
      return fetch(e.request).then(res => {
        if (res && res.ok && res.type === 'basic') {
          caches.open(CACHE).then(c => c.put(e.request, res.clone()));
        }
        return res;
      }).catch(() => {
        if (e.request.destination === 'document') return caches.match('./index.html');
      });
    })
  );
});
