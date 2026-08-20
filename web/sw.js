/* EngiCalc Service Worker — offline support */
/* Updated: 2026-08-20 — своя страница у каждого калькулятора */
const CACHE_NAME = 'engicalc-v27';
/* Список обязан содержать ВСЕ модули из графа импортов app.js: любой
   пропущенный файл офлайн отдаётся как 503 и роняет загрузку приложения целиком. */
const STATIC_ASSETS = [
  /* PAGES:BEGIN — список собирает tools/build-pages.mjs */
  '/',
  '/power/',
  '/cable/',
  '/voltage/',
  '/shortcircuit/',
  '/grounding/',
  '/protection/',
  '/groundcircuit/',
  '/kzcable/',
  '/motor/',
  '/motorstart/',
  '/transformer/',
  '/compensation/',
  '/ups/',
  '/loadpanel/',
  '/lighting/',
  '/emergency/',
  '/ledstrip/',
  '/derating/',
  '/diam2sec/',
  '/cableloss/',
  '/busbar/',
  '/cabletray/',
  '/conduitfill/',
  '/sleeve/',
  '/converter/',
  '/wirecab/',
  '/demandfactor/',
  '/fuse/',
  '/dcvdrop/',
  '/threephase/',
  '/energyaudit/',
  '/solar/',
  '/neutral/',
  '/arcflash/',
  '/thd/',
  '/kipia/',
  '/cablelength/',
  '/rtdtable/',
  '/tcouple/',
  '/pneumatics/',
  '/pneumline/',
  '/hydraulics/',
  '/rccalc/',
  '/capval/',
  '/motorcap/',
  '/led/',
  '/zener/',
  '/rlc/',
  '/bridge/',
  '/ne555/',
  '/opamp/',
  '/7seg/',
  '/editor/',
  '/help/',
  '/developer/',
  '/donate/',
  /* PAGES:END */
  '/manifest.json',
  '/404.html',
  '/favicon.ico',
  '/favicon.svg',
  '/assets/icon-192.png',
  '/assets/icon-512.png',
  '/assets/epos_12316-1-3.png',
  '/css/tokens.css',
  '/css/base.css',
  '/css/layout.css',
  '/css/components.css',
  '/css/help.css',
  '/css/pages.css',
  '/js/app.js',
  '/js/core.js',
  '/js/data/cable-data.js',
  '/js/data/led-strip-data.js',
  '/js/data/sleeve-data.js',
  '/js/data/rtd.js',
  '/js/chart.js',
  '/js/led-strip.js',
  '/js/sleeve.js',
  '/js/cable-select.js',
  '/js/electrical.js',
  '/js/electrical2.js',
  '/js/electrical3.js',
  '/js/equipment.js',
  '/js/cable-networks.js',
  '/js/electronics.js',
  '/js/microchips.js',
  '/js/kipia.js',
  '/js/industry.js',
  '/js/wirecab.js',
  '/js/circuits.js',
  '/js/help.js',
  '/js/gost-schematic.js',
  '/js/schematic-model.js',
  '/js/circuit-sim.js',
  '/js/schematic-editor.js',
  '/js/schematic-presets.js'
];

// Install — cache static assets.
// Кэшируем поштучно: при addAll один недоступный файл отменяет установку целиком
// и приложение остаётся вообще без офлайн-кэша.
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => Promise.allSettled(STATIC_ASSETS.map(url => cache.add(url))))
      .then(() => self.skipWaiting())
  );
});

// Activate — clean old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
      )
    ).then(() => self.clients.claim())
  );
});

// Message — handle skip waiting
self.addEventListener('message', event => {
  if (event.data?.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// Fetch — cache-first for all same-origin GET requests
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') return;

  // Skip cross-origin requests (Google Fonts, etc.)
  if (url.origin !== location.origin) {
    // But cache Google Fonts CSS
    if (url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com') {
      event.respondWith(
        caches.match(request).then(cached => {
          if (cached) return cached;
          return fetch(request).then(response => {
            if (response.ok) {
              const clone = response.clone();
              caches.open(CACHE_NAME).then(cache => cache.put(request, clone));
            }
            return response;
          }).catch(() => new Response('', { status: 503 }));
        })
      );
    }
    return;
  }

  // Ключ кэша — URL без строки запроса. Страница просит js/app.js?v=5, а в
  // прекэше лежит /js/app.js: без нормализации эти записи не совпадают и
  // офлайн при первом заходе не работает.
  const key = url.origin + url.pathname;

  // Stale-while-revalidate: отдаём из кэша сразу (быстро и работает офлайн),
  // но параллельно тянем свежую копию в кэш. Чистый cache-first оставлял
  // пользователя на старом JS до самой смены имени кэша.
  event.respondWith(
    caches.match(key).then(cached => {
      const network = fetch(request).then(response => {
        if (response.ok) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(key, clone));
        }
        return response;
      }).catch(() => {
        if (cached) return cached;
        // Офлайн: сначала ищем саму страницу раздела (адреса вида /cable/),
        // и только если её нет в кэше — отдаём витрину. Раньше здесь всегда
        // возвращался index.html, но теперь это каталог, а не приложение.
        if (request.mode === 'navigate') {
          const page = url.pathname.endsWith('/') ? url.pathname : url.pathname + '/';
          return caches.match(page).then(hit => hit || caches.match('/'));
        }
        return new Response('Offline', { status: 503, headers: { 'Content-Type': 'text/plain' } });
      });
      return cached || network;
    })
  );
});
