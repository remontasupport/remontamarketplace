/**
 * One source of truth for "which database is this?".
 *
 * Both application and legacy databases are branches of the single Neon project
 * `Remonta`, and both expose a database named `workerprofiles`. Neither the
 * branch name nor the database name distinguishes them — only the endpoint does.
 *
 * Worse, the branch NAMES are inverted relative to any reasonable assumption:
 * the branch called `production` holds the legacy contractor directory, while
 * the live application data sits in the branch called `authentication`.
 * (A rename to `legacy-contractors` / `production` is on the backlog. This file
 * keys on endpoint ids, so a rename will not break it — only these comments.)
 */

const PRODUCTION_ENDPOINTS = {
  'ep-delicate-recipe-a7mbt4ef': "Neon branch 'authentication' — THE APPLICATION DATABASE",
  'ep-polished-thunder-a7ovazge': "Neon branch 'production' — the LEGACY contractor directory",
}

/**
 * Pulls host and database out of a connection string without a URL parser,
 * because the password may contain characters that trip one up.
 * Never returns credentials.
 */
function describe(url) {
  if (typeof url !== 'string') return null
  const at = url.lastIndexOf('@')
  if (at === -1) return null
  const after = url.slice(at + 1)
  const slash = after.indexOf('/')
  const host = slash === -1 ? after : after.slice(0, slash)
  let database = slash === -1 ? '(none)' : after.slice(slash + 1)
  const q = database.indexOf('?')
  if (q !== -1) database = database.slice(0, q)

  const endpoint = host.split('.')[0].replace(/-pooler$/, '')
  return {
    host,
    database,
    endpoint,
    pooled: /-pooler\./.test(host),
    production: Object.prototype.hasOwnProperty.call(PRODUCTION_ENDPOINTS, endpoint),
    label: PRODUCTION_ENDPOINTS[endpoint] || 'branch or copy',
  }
}

/**
 * Precedence: a variable already set in the environment wins, then `.env.local`,
 * then `.env`.
 *
 * The "already set wins" rule matters. Overwriting process.env from a dotfile
 * means an operator who sets a variable explicitly for one command silently gets
 * the file's value instead — so a deliberate one-off override aimed at a branch
 * would quietly run somewhere else entirely.
 */
function loadEnv(root) {
  const fs = require('fs')
  const path = require('path')
  const preset = new Set(Object.keys(process.env))
  const fromFile = new Set()

  for (const file of ['.env', '.env.local']) {
    const p = path.join(root, file)
    if (!fs.existsSync(p)) continue
    for (const raw of fs.readFileSync(p, 'utf8').split(/\r?\n/)) {
      const line = raw.trim()
      if (!line || line.startsWith('#')) continue
      const eq = line.indexOf('=')
      if (eq === -1) continue
      const key = line.slice(0, eq).trim()
      let val = line.slice(eq + 1).trim()
      if ((val.startsWith('"') && val.endsWith('"')) ||
          (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1)
      }
      // Never clobber a variable the caller set deliberately; do let
      // .env.local override .env, which is the intended file precedence.
      if (preset.has(key) && !fromFile.has(key)) continue
      process.env[key] = val
      fromFile.add(key)
    }
  }
}

module.exports = { PRODUCTION_ENDPOINTS, describe, loadEnv }
