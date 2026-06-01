const CACHE = 'fintrack-v1';
const FILES = ['/', '/index.html', '/dashboard.html', '/gastos.html', '/adicionar.html', '/categorias.html', '/_shared.css'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)));
});

self.addEventListener('fetch', e => {
  if (e.request.url.includes('railway.app')) return;
  e.respondWith(caches.match(e.request).then(r => r || fetch(e.request)));
});