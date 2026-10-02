export type OfflineStatus = 'checking' | 'ready' | 'preparing' | 'offline' | 'error'

export interface PwaState {
  offline: OfflineStatus
  cached: number
  total: number
  message?: string
  installed: boolean
  updateReady: boolean
}

let deferredInstall: BeforeInstallPromptEvent | null = null
let stateListener: ((state: PwaState) => void) | null = null
let pwaState: PwaState = { offline: 'checking', cached: 0, total: 0, installed: false, updateReady: false }
let workerRegistration: ServiceWorkerRegistration | null = null
let started = false
let updatePending = false

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>
}

function emit(partial: Partial<PwaState>) {
  pwaState = { ...pwaState, ...partial }
  stateListener?.(pwaState)
}

function appResources(): string[] {
  const urls = [
    new URL('/', location.origin).href,
    new URL('/manifest.webmanifest', location.origin).href,
    new URL('/pingpong.svg', location.origin).href,
    new URL('/pingpong-180.png', location.origin).href,
    new URL('/pingpong-192.png', location.origin).href,
    new URL('/pingpong-512.png', location.origin).href,
  ]
  for (const entry of performance.getEntriesByType('resource')) {
    try {
      const url = new URL(entry.name)
      if (url.origin !== location.origin || url.pathname.endsWith('/sw.js')) continue
      if (/\.(?:js|mjs|css|svg|webmanifest)(?:$|\?)/i.test(url.href) || url.pathname.startsWith('/src/')) urls.push(url.href)
    } catch {
      // Third party fonts and other external resources are optional and are not cached.
    }
  }
  return [...new Set(urls)]
}

function askWorker(message: Record<string, unknown>) {
  const controller = navigator.serviceWorker?.controller
  if (controller) controller.postMessage(message)
}

async function prepareOffline() {
  if (!workerRegistration || !navigator.onLine) {
    emit({ offline: navigator.onLine ? 'checking' : 'offline' })
    return
  }
  const worker = navigator.serviceWorker.controller ?? workerRegistration.active
  if (!worker) return
  emit({ offline: 'preparing', message: undefined })
  const urls = appResources()
  worker.postMessage({ type: 'PRECACHE', urls })
}

export function startPwa(listener: (state: PwaState) => void): () => void {
  stateListener = listener
  emit({ installed: window.matchMedia('(display-mode: standalone)').matches || Boolean('standalone' in navigator && (navigator as Navigator & { standalone?: boolean }).standalone) })
  if (started || !('serviceWorker' in navigator)) {
    if (!('serviceWorker' in navigator)) emit({ offline: 'error', message: 'このブラウザではオフライン機能に対応していません。' })
    return () => { if (stateListener === listener) stateListener = null }
  }
  started = true

  const onMessage = (event: MessageEvent) => {
    if (!event.data || typeof event.data !== 'object') return
    const data = event.data as Record<string, unknown>
    if (data.type === 'PRECACHE_PROGRESS') emit({ offline: 'preparing', cached: Number(data.cached), total: Number(data.total) })
    if (data.type === 'PRECACHE_COMPLETE') emit({ offline: 'ready', cached: Number(data.cached), total: Number(data.total), message: undefined })
    if (data.type === 'PRECACHE_ERROR') emit({ offline: 'error', message: String(data.message ?? '保存に失敗しました。オンラインで再試行してください。') })
    if (data.type === 'CACHE_STATUS') emit({ offline: data.ready ? 'ready' : navigator.onLine ? 'preparing' : 'offline', cached: Number(data.cached ?? 0), total: Number(data.total ?? 0) })
    if (data.type === 'UPDATE_READY') emit({ updateReady: true, message: '更新を準備できました。練習記録を保存してから更新できます。' })
  }
  const onControllerChange = () => {
    if (updatePending) {
      updatePending = false
      window.location.reload()
      return
    }
    if (navigator.onLine) void prepareOffline()
    else askWorker({ type: 'CACHE_STATUS', urls: appResources() })
  }
  const onOnline = () => void prepareOffline()
  const onOffline = () => {
    if (pwaState.offline !== 'ready') emit({ offline: 'offline', message: 'オフラインの保存が完了していません。通信できる場所で一度開いてください。' })
  }
  const onBeforeInstall = (event: Event) => {
    event.preventDefault()
    deferredInstall = event as BeforeInstallPromptEvent
    emit({ installed: false })
  }
  const onInstalled = () => {
    deferredInstall = null
    emit({ installed: true })
  }

  navigator.serviceWorker.addEventListener('message', onMessage)
  navigator.serviceWorker.addEventListener('controllerchange', onControllerChange)
  window.addEventListener('online', onOnline)
  window.addEventListener('offline', onOffline)
  window.addEventListener('beforeinstallprompt', onBeforeInstall)
  window.addEventListener('appinstalled', onInstalled)

  navigator.serviceWorker.register('/sw.js', { scope: '/', updateViaCache: 'none' }).then(async (registration) => {
    workerRegistration = registration
    registration.addEventListener('updatefound', () => {
      const installing = registration.installing
      if (!installing) return
      installing.addEventListener('statechange', () => {
        if (installing.state === 'installed' && navigator.serviceWorker.controller) emit({ updateReady: true, message: '新しい版を準備しています。練習が終わると更新できます。' })
      })
    })
    const ready = await navigator.serviceWorker.ready
    if (navigator.serviceWorker.controller) await prepareOffline()
    else if (ready.active) {
      emit({ offline: 'preparing', message: '初回の読み込みが完了しました。オフライン用に画面を保存しています。' })
      ready.active.postMessage({ type: 'PRECACHE', urls: appResources() })
    }
    ready.update().catch(() => undefined)
  }).catch((error: unknown) => {
    emit({ offline: 'error', message: error instanceof Error ? 'オフライン機能を開始できませんでした。オンラインで再読み込みしてください。' : 'オフライン機能を開始できませんでした。' })
  })

  return () => {
    navigator.serviceWorker.removeEventListener('message', onMessage)
    navigator.serviceWorker.removeEventListener('controllerchange', onControllerChange)
    window.removeEventListener('online', onOnline)
    window.removeEventListener('offline', onOffline)
    window.removeEventListener('beforeinstallprompt', onBeforeInstall)
    window.removeEventListener('appinstalled', onInstalled)
    if (stateListener === listener) stateListener = null
  }
}

export async function checkOfflineStatus() {
  if (!navigator.serviceWorker?.controller) {
    emit({ offline: navigator.onLine ? 'preparing' : 'offline' })
    return
  }
  askWorker({ type: 'CACHE_STATUS', urls: appResources() })
}

export async function prepareOfflineNow() {
  await prepareOffline()
  if (navigator.serviceWorker.controller) askWorker({ type: 'PRECACHE', urls: appResources() })
}

export async function applyUpdate() {
  const waiting = workerRegistration?.waiting
  if (!waiting) {
    await workerRegistration?.update()
    emit({ message: '更新を確認しました。インストール中の練習はそのまま続けられます。' })
    return
  }
  updatePending = true
  waiting.postMessage({ type: 'APPLY_UPDATE' })
}

export async function installPwa(): Promise<'accepted' | 'dismissed' | 'manual'> {
  if (!deferredInstall) return 'manual'
  await deferredInstall.prompt()
  const choice = await deferredInstall.userChoice
  deferredInstall = null
  return choice.outcome
}

export function installPromptAvailable() {
  return Boolean(deferredInstall)
}
