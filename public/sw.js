const CACHE_PREFIX = 'pingpong-offline-'
const CURRENT_CACHE = 'pingpong-offline-v1.0.0'
const APP_SHELL = ['/', '/index.html', '/manifest.webmanifest', '/pingpong.svg', '/pingpong-180.png', '/pingpong-192.png', '/pingpong-512.png']

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CURRENT_CACHE).then((cache) => cache.addAll(APP_SHELL)))
})

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys()
    await Promise.all(keys.filter((key) => key.startsWith(CACHE_PREFIX) && key !== CURRENT_CACHE).map((key) => caches.delete(key)))
    await self.clients.claim()
  })())
})

async function sendToClient(event, data) {
  if (event.source && 'postMessage' in event.source) event.source.postMessage(data)
}

async function cacheList(urls, event) {
  const cache = await caches.open(CURRENT_CACHE)
  const unique = [...new Set([self.location.origin + '/', ...urls.filter((url) => {
    try { return new URL(url).origin === self.location.origin } catch { return false }
  })])]
  let cached = 0
  const failures = []
  for (const url of unique) {
    const request = new Request(url, { mode: 'same-origin' })
    try {
      let response = await cache.match(request, { ignoreVary: true })
      if (!response || response.type === 'opaque') {
        response = await fetch(request, { cache: 'reload' })
        if (!response.ok || response.type === 'opaque') throw new Error(`${new URL(url).pathname} を保存できませんでした。`)
        await cache.put(request, response.clone())
      }
      cached += 1
      await sendToClient(event, { type: 'PRECACHE_PROGRESS', cached, total: unique.length })
    } catch (error) {
      failures.push(error instanceof Error ? error.message : String(error))
    }
  }
  if (failures.length) {
    await sendToClient(event, { type: 'PRECACHE_ERROR', cached, total: unique.length, message: failures[0] })
    return
  }
  await cache.put(`${self.location.origin}/__pingpong_prepared__`, new Response(String(Date.now()), { headers: { 'content-type': 'text/plain' } }))
  await sendToClient(event, { type: 'PRECACHE_COMPLETE', cached, total: unique.length })
}

async function inspectCache(urls, event) {
  const cache = await caches.open(CURRENT_CACHE)
  const requests = [...new Set(urls.filter((url) => {
    try { return new URL(url).origin === self.location.origin } catch { return false }
  }))]
  const cached = await Promise.all(requests.map((url) => cache.match(url, { ignoreVary: true }).then(Boolean)))
  const rootReady = Boolean(await cache.match(self.location.origin + '/'))
  const ready = rootReady && requests.length > 0 && cached.every(Boolean)
  await sendToClient(event, { type: 'CACHE_STATUS', ready, cached: cached.filter(Boolean).length, total: requests.length })
}

self.addEventListener('message', (event) => {
  const data = event.data || {}
  if (data.type === 'PRECACHE' && Array.isArray(data.urls)) event.waitUntil(cacheList(data.urls, event))
  if (data.type === 'CACHE_STATUS' && Array.isArray(data.urls)) event.waitUntil(inspectCache(data.urls, event))
  if (data.type === 'APPLY_UPDATE') self.skipWaiting()
})

self.addEventListener('fetch', (event) => {
  const request = event.request
  const url = new URL(request.url)
  if (request.method !== 'GET' || url.origin !== self.location.origin) return

  if (request.mode === 'navigate') {
    event.respondWith((async () => {
      try {
        const response = await fetch(request)
        if (response.ok) {
          const cache = await caches.open(CURRENT_CACHE)
          await cache.put(self.location.origin + '/', response.clone())
        }
        return response
      } catch {
        const cache = await caches.open(CURRENT_CACHE)
        return await cache.match(self.location.origin + '/') ?? new Response('オフラインで開ける画面は、オンラインのときに一度読み込んでください。', { status: 503, headers: { 'Content-Type': 'text/plain; charset=utf-8' } })
      }
    })())
    return
  }

  event.respondWith((async () => {
    const cache = await caches.open(CURRENT_CACHE)
    const cached = await cache.match(request, { ignoreVary: true })
    if (cached) return cached
    try {
      const response = await fetch(request)
      if (response.ok && response.type === 'basic') cache.put(request, response.clone())
      return response
    } catch {
      return new Response('この画面を表示できません。オンラインに戻ってから、もう一度お試しください。', { status: 503, headers: { 'Content-Type': 'text/plain; charset=utf-8' } })
    }
  })())
})
