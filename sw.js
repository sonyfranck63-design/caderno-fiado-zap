/**
 * Service Worker Oficial: CadernoFiado & Cobrança Zap
 * Garante funcionamento 100% offline, cache inteligente e suporte a PWA instalável.
 */

const CACHE_NAME = 'cadernofiado-v1.0.1';

const PRECACHE_ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './css/styles.css',
  './js/bundle.js',
  './icons/icon.svg',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './vendor/tailwindcss.js',
  './vendor/react.production.min.js',
  './vendor/react-dom.production.min.js',
  './vendor/babel.min.js',
  './vendor/qrcode.min.js',
  './vendor/jspdf.umd.min.js',
  './vendor/confetti.browser.min.js'
];

// Instalação do Service Worker e pré-cache dos recursos vitais
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      // Faz o cache dos arquivos locais com tolerância a falhas em CDNs externas
      return Promise.allSettled(
        PRECACHE_ASSETS.map((url) =>
          fetch(url, { mode: 'cors' })
            .then((response) => {
              if (response.ok) {
                return cache.put(url, response);
              }
            })
            .catch((err) => {
              console.warn('[SW] Falha ao pré-carregar recurso:', url, err);
            })
        )
      );
    }).then(() => self.skipWaiting())
  );
});

// Ativação e limpeza de caches antigos
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            console.log('[SW] Removendo cache obsoleto:', key);
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Interceptação de requisições: Cache-First com fallback de rede
self.addEventListener('fetch', (event) => {
  // Ignora esquemas não HTTP/HTTPS (ex: chrome-extension, blob, etc.)
  if (!event.request.url.startsWith('http')) return;

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        // Retorna do cache e atualiza silenciosamente em segundo plano (Stale-While-Revalidate)
        fetch(event.request)
          .then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              caches.open(CACHE_NAME).then((cache) => {
                cache.put(event.request, networkResponse);
              });
            }
          })
          .catch(() => {
            // Em modo offline silencioso
          });
        return cachedResponse;
      }

      // Se não está no cache, busca na rede
      return fetch(event.request)
        .then((networkResponse) => {
          // Salva no cache recursos válidos
          if (
            networkResponse &&
            networkResponse.status === 200 &&
            (event.request.method === 'GET')
          ) {
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseToCache);
            });
          }
          return networkResponse;
        })
        .catch(() => {
          // Fallback para index.html se for navegação HTML e estiver offline
          if (event.request.mode === 'navigate') {
            return caches.match('./index.html');
          }
        });
    })
  );
});
