const CACHE_NAME = 'crm-pro-v2'; // Ganti versi ini (v3, v4) setiap kali Anda merubah index.html

// Hanya hardcode file lokal Anda sendiri di sini
const LOCAL_ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png'
];

// 1. TAHAP INSTALL: Simpan file utama
self.addEventListener('install', event => {
  self.skipWaiting(); // Paksa service worker baru langsung aktif
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(LOCAL_ASSETS);
    })
  );
});

// 2. TAHAP ACTIVATE: Bersihkan cache versi lama agar HP user tidak penuh
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cache => {
          if (cache !== CACHE_NAME) {
            console.log('Menghapus cache lama:', cache);
            return caches.delete(cache);
          }
        })
      );
    })
  );
});

// 3. TAHAP FETCH: Network First, Fallback to Cache (dengan Dynamic Caching)
self.addEventListener('fetch', event => {
  // Abaikan request POST (seperti mengirim form ke GAS)
  if (event.request.method !== 'GET') return;

  event.respondWith(
    fetch(event.request)
      .then(response => {
        // Jika request berhasil, lakukan Dynamic Caching secara diam-diam
        // Ini akan otomatis menyimpan CDN Tailwind, ChartJS, dan Font (woff2) ke lokal user
        if (response && response.status === 200 && response.type !== 'opaque') {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, responseClone);
          });
        }
        return response; // Tampilkan yang terbaru dari server
      })
      .catch(() => {
        // Jika GAGAL (karena OFFLINE atau blank spot), fallback ambil dari CACHE lokal
        return caches.match(event.request).then(cachedResponse => {
          if (cachedResponse) {
            return cachedResponse;
          }
          console.warn('Aset tidak ditemukan di jaringan maupun cache:', event.request.url);
        });
      })
  );
});
