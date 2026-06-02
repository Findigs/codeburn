import { readFile, mkdir, rename, stat, unlink, open, lstat } from 'fs/promises'
import { join } from 'path'
import { homedir } from 'os'
import { randomBytes } from 'crypto'

import type { ParsedProviderCall } from './providers/types.js'

// Bumped to 3 for the workspace-aware breakdown change: the cursor parser
// now derives `sessionId` from the bubble row key (the real composer id)
// rather than the empty `conversationId` JSON field, and the workspace
// router relies on those composer ids to bucket calls per project.
// Version 2 caches contain `sessionId: 'unknown'` for every call and would
// route everything to the orphan project, so we invalidate them.
const CURSOR_CACHE_VERSION = 3

type ResultCache = {
  version?: number
  dbMtimeMs: number
  dbSizeBytes: number
  calls: ParsedProviderCall[]
}

const CACHE_FILE = 'cursor-results.json'

function getCacheDir(): string {
  return join(homedir(), '.cache', 'codeburn')
}

function getCachePath(): string {
  return join(getCacheDir(), CACHE_FILE)
}

async function getDbFingerprint(dbPath: string): Promise<{ mtimeMs: number; size: number } | null> {
  try {
    const s = await stat(dbPath)
    return { mtimeMs: s.mtimeMs, size: s.size }
  } catch {
    return null
  }
}

export async function readCachedResults(dbPath: string): Promise<ParsedProviderCall[] | null> {
  try {
    const fp = await getDbFingerprint(dbPath)
    if (!fp) return null

    const raw = await readFile(getCachePath(), 'utf-8')
    const cache = JSON.parse(raw) as ResultCache

    if (cache.version === CURSOR_CACHE_VERSION && cache.dbMtimeMs === fp.mtimeMs && cache.dbSizeBytes === fp.size) {
      return cache.calls
    }
    return null
  } catch {
    return null
  }
}

export async function writeCachedResults(dbPath: string, calls: ParsedProviderCall[]): Promise<void> {
  const fp = await getDbFingerprint(dbPath)
  if (!fp) return

  const dir = getCacheDir()
  await mkdir(dir, { recursive: true }).catch(() => {})
  const cache: ResultCache = {
    version: CURSOR_CACHE_VERSION,
    dbMtimeMs: fp.mtimeMs,
    dbSizeBytes: fp.size,
    calls,
  }

  const target = getCachePath()
  try {
    const s = await lstat(target)
    if (s.isSymbolicLink()) return
  } catch {}

  const tempPath = `${target}.${randomBytes(8).toString('hex')}.tmp`
  const handle = await open(tempPath, 'w', 0o600)
  try {
    await handle.writeFile(JSON.stringify(cache), { encoding: 'utf-8' })
    await handle.sync()
  } finally {
    await handle.close()
  }
  try {
    await rename(tempPath, target)
  } catch (err) {
    try { await unlink(tempPath) } catch {}
    throw err
  }
}
