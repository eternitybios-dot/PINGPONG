import type { AppState } from './types'

const DATABASE = 'pingpong-local'
const VERSION = 1
const STORE = 'app'
const KEY = 'state'
const LEASE = 'pingpong-active-session-lease'
const LEASE_MS = 12_000

let database: Promise<IDBDatabase> | null = null

function openDatabase(): Promise<IDBDatabase> {
  if (!('indexedDB' in window)) return Promise.reject(new Error('このブラウザでは端末内保存を利用できません。'))
  if (database) return database

  database = new Promise((resolve, reject) => {
    const request = indexedDB.open(DATABASE, VERSION)
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(STORE)) request.result.createObjectStore(STORE)
    }
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error ?? new Error('端末内データを開けませんでした。'))
    request.onblocked = () => reject(new Error('別のタブでデータベースを更新中です。少し待ってから再度お試しください。'))
  })
  return database
}

export async function readState(fallback: AppState): Promise<AppState> {
  const db = await openDatabase()
  return new Promise((resolve, reject) => {
    const request = db.transaction(STORE, 'readonly').objectStore(STORE).get(KEY)
    request.onsuccess = () => resolve((request.result as AppState | undefined) ?? fallback)
    request.onerror = () => reject(request.error ?? new Error('保存した練習記録を読み込めませんでした。'))
  })
}

export async function saveState(state: AppState): Promise<void> {
  const db = await openDatabase()
  const lock = readLock()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE, 'readwrite')
    const objectStore = transaction.objectStore(STORE)
    const request = objectStore.get(KEY)
    request.onsuccess = () => {
      const persisted = request.result as AppState | undefined
      const anotherTabIsRunning = Boolean(lock && lock.owner !== TAB_ID)
      const nextState = anotherTabIsRunning && persisted?.activeSession
        ? { ...state, activeSession: persisted.activeSession }
        : state
      objectStore.put(nextState, KEY)
    }
    request.onerror = () => transaction.abort()
    transaction.oncomplete = () => resolve()
    transaction.onerror = () => reject(transaction.error ?? new Error('練習記録を保存できませんでした。'))
    transaction.onabort = () => reject(transaction.error ?? new Error('練習記録を保存できませんでした。'))
  })
}

interface Lock {
  owner: string
  sessionId: string
  until: number
}

function readLock(): Lock | null {
  try {
    const lock = JSON.parse(localStorage.getItem(LEASE) ?? 'null') as Lock | null
    return lock && lock.until > Date.now() ? lock : null
  } catch {
    return null
  }
}

export const TAB_ID = (() => {
  try {
    const key = 'pingpong-tab-id'
    const current = sessionStorage.getItem(key)
    if (current) return current
    const created = crypto.randomUUID()
    sessionStorage.setItem(key, created)
    return created
  } catch {
    return `tab-${Date.now()}-${Math.random().toString(36).slice(2)}`
  }
})()

export function getLiveSessionLock(): Lock | null {
  return readLock()
}

export function claimSessionLock(sessionId: string): boolean {
  try {
    const current = readLock()
    if (current && current.owner !== TAB_ID) return false
    localStorage.setItem(LEASE, JSON.stringify({ owner: TAB_ID, sessionId, until: Date.now() + LEASE_MS } satisfies Lock))
    return true
  } catch {
    return false
  }
}

export function refreshSessionLock(sessionId: string): void {
  if (!claimSessionLock(sessionId)) return
}

export function releaseSessionLock(): void {
  try {
    if (readLock()?.owner === TAB_ID) localStorage.removeItem(LEASE)
  } catch {
    // IndexedDB remains the source of truth when storage leases are unavailable.
  }
}
