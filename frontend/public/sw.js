// Service Worker — Controle Financeiro
// Responsabilidades:
//  1. Cache mínimo do app shell (network-first com fallback offline)
//  2. Receber arquivos via Web Share Target e repassar pra rota /share-target da SPA
//
// Atenção: a SPA é toda client-side rendered, então o SW só serve arquivos estáticos.
// Toda chamada de API passa direto pela rede (sem cache) pra evitar inconsistência.

const CACHE = 'fc-shell-v1';
const SHELL = ['/', '/index.html', '/manifest.webmanifest'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(SHELL)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// Buffer in-memory pra arquivos compartilhados via Share Target.
// O SW recebe o POST do sistema, guarda os arquivos aqui, e redireciona o cliente
// pra /share-target. A SPA então pede os arquivos via postMessage.
const sharedFiles = new Map(); // id -> { files: File[], text: string, title: string, url: string, ts: number }

function genShareId() {
  return 'share_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8);
}

function cleanupOldShares() {
  const cutoff = Date.now() - 5 * 60_000; // 5 min
  for (const [id, payload] of sharedFiles) {
    if (payload.ts < cutoff) sharedFiles.delete(id);
  }
}

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Web Share Target — POST /share-target com multipart/form-data
  if (event.request.method === 'POST' && url.pathname === '/share-target') {
    event.respondWith((async () => {
      cleanupOldShares();
      try {
        const formData = await event.request.formData();
        const files = formData.getAll('files').filter((f) => f instanceof File);
        const text = String(formData.get('text') || '');
        const title = String(formData.get('title') || '');
        const sharedUrl = String(formData.get('url') || '');
        const id = genShareId();
        sharedFiles.set(id, { files, text, title, url: sharedUrl, ts: Date.now() });
        return Response.redirect(`/share-target?id=${id}`, 303);
      } catch (err) {
        return Response.redirect('/share-target?error=1', 303);
      }
    })());
    return;
  }

  // SPA assets — network-first com fallback de cache pro shell
  if (event.request.method === 'GET' && url.origin === self.location.origin) {
    // Não interceptar chamadas pra API do backend
    if (url.pathname.startsWith('/api/') || url.pathname.startsWith('/auth/')) return;

    event.respondWith(
      fetch(event.request)
        .then((res) => {
          // Cacheia só o shell mínimo
          if (SHELL.includes(url.pathname) || url.pathname === '/') {
            const copy = res.clone();
            caches.open(CACHE).then((cache) => cache.put(event.request, copy));
          }
          return res;
        })
        .catch(() => caches.match(event.request).then((cached) => cached || caches.match('/index.html')))
    );
  }
});

// Cliente pede os arquivos compartilhados
self.addEventListener('message', (event) => {
  const data = event.data || {};
  if (data.type === 'GET_SHARED_PAYLOAD' && data.id) {
    const payload = sharedFiles.get(data.id);
    if (payload) {
      event.ports[0]?.postMessage({ ok: true, payload });
      sharedFiles.delete(data.id);
    } else {
      event.ports[0]?.postMessage({ ok: false });
    }
  }
});
