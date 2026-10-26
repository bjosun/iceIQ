#!/usr/bin/env node
/**
 * Direct Firebase Hosting REST deploy — no firebase-tools preflight.
 *
 * The `firebase deploy` CLI always calls serviceusage.services.get first,
 * which requires roles/serviceusage.serviceUsageViewer. The Hosting API
 * itself only needs roles/firebasehosting.admin — so this script deploys
 * versions/releases directly and works when the CLI's preflight 403s.
 *
 * Usage: node scripts/hosting_deploy.js [--target prod] [--site <site_id>]
 * Env:   FIREBASE_SERVICE_ACCOUNT_JSON — full service-account JSON.
 *        FIREBASE_PROJECT_ID           — default: from .firebaserc.
 * --site overrides target resolution (template repos use firebase.json "site").
 */

const crypto = require("crypto")
const zlib = require("zlib")
const fs = require("fs")
const path = require("path")

const API = "https://firebasehosting.googleapis.com/v1beta1"
const ROOT = path.resolve(__dirname, "..")

function arg(name, fallback) {
  const i = process.argv.indexOf(`--${name}`)
  return i > -1 ? process.argv[i + 1] : fallback
}

function fail(msg) { console.error(`deploy: ${msg}`); process.exit(1) }

// --- auth: JWT-bearer → access token -------------------------------------
async function accessToken(sa) {
  const b64 = (o) => Buffer.from(JSON.stringify(o)).toString("base64url")
  const now = Math.floor(Date.now() / 1000)
  const jwt = `${b64({ alg: "RS256", typ: "JWT" })}.${b64({
    iss: sa.client_email,
    scope: "https://www.googleapis.com/auth/cloud-platform",
    aud: "https://oauth2.googleapis.com/token",
    iat: now, exp: now + 3600
  })}`
  const assertion = `${jwt}.${crypto.sign("RSA-SHA256", Buffer.from(jwt), sa.private_key).toString("base64url")}`
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: `grant_type=${encodeURIComponent("urn:ietf:params:oauth:grant-type:jwt-bearer")}&assertion=${assertion}`
  })
  const json = await res.json()
  if (!json.access_token) fail(`token exchange: ${JSON.stringify(json).slice(0, 300)}`)
  return json.access_token
}

async function api(token, method, urlPath, body) {
  const res = await fetch(`${API}/${urlPath}`, {
    method,
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body)
  })
  const text = await res.text()
  if (!res.ok) fail(`${method} ${urlPath} → HTTP ${res.status}: ${text.slice(0, 400)}`)
  return text ? JSON.parse(text) : {}
}

// --- config ----------------------------------------------------------------
function loadConfig(target) {
  const firebaseJson = JSON.parse(fs.readFileSync(path.join(ROOT, "firebase.json"), "utf8"))
  let rc = {}
  try { rc = JSON.parse(fs.readFileSync(path.join(ROOT, ".firebaserc"), "utf8")) } catch {}
  const project = process.env.FIREBASE_PROJECT_ID || rc.projects?.default
  const hosting = (Array.isArray(firebaseJson.hosting) ? firebaseJson.hosting : [firebaseJson.hosting])
    .find((h) => h.site || (h.target || project) === target)
  if (!hosting) fail(`no hosting block for target "${target}"`)
  const explicit = arg("site")
  const site = explicit
    || (hosting.site && !hosting.site.includes("{{") ? hosting.site : null)
    || rc.targets?.[project]?.hosting?.[target]?.[0]
    || project
  return { project, site, hosting }
}

// firebase.json "source" glob → REST field (same glob semantics).
const toGlob = (list, map) => (list || []).map((r) => {
  const out = { ...map(r) }
  if (r.source) out.glob = r.source
  return out
})

function servingConfig(hosting) {
  const cfg = {}
  if (hosting.redirects) cfg.redirects = toGlob(hosting.redirects, (r) => ({ location: r.destination, statusCode: r.type }))
  if (hosting.rewrites) cfg.rewrites = toGlob(hosting.rewrites, (r) =>
    r.function ? { function: r.function } : { path: r.destination })
  if (hosting.headers) cfg.headers = hosting.headers.map((h) => ({
    ...(h.source ? { glob: h.source } : {}),
    headers: Object.fromEntries((h.headers || []).map((x) => [x.key, x.value]))
  }))
  if (hosting.cleanUrls) cfg.cleanUrls = true
  if (hosting.trailingSlash) cfg.trailingSlashBehavior = hosting.trailingSlash
  return cfg
}

// --- files -------------------------------------------------------------------
function walk(dir, base, out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const rel = `${base}/${e.name}`
    if (e.isDirectory()) walk(path.join(dir, e.name), rel, out)
    else out.push(rel)
  }
  return out
}
const ignored = (rel, patterns) => patterns.some((p) => {
  if (p === "firebase.json") return rel === "/firebase.json"
  if (p === "**/.*" ) return rel.split("/").some((s) => s.startsWith("."))
  if (p === "**/node_modules/**") return rel.includes("/node_modules/")
  return false
})

async function main() {
  const target = arg("target", "prod")
  const sa = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON || "{}")
  if (!sa.private_key) fail("FIREBASE_SERVICE_ACCOUNT_JSON missing/invalid")
  const { site, hosting } = loadConfig(target)
  const publicDir = path.join(ROOT, hosting.public || "dist")
  if (!fs.existsSync(publicDir)) fail(`${hosting.public}/ missing — run the build first`)

  const files = walk(publicDir, "").filter((f) => !ignored(f, hosting.ignore || []))
  console.log(`deploy: ${files.length} files → site ${site} (target ${target})`)

  const token = await accessToken(sa)
  const version = await api(token, "POST", `sites/${site}/versions`, { config: servingConfig(hosting) })
  console.log(`version: ${version.name}`)

  const hashes = {}
  for (const f of files) {
    const gz = zlib.gzipSync(fs.readFileSync(path.join(publicDir, f.slice(1))), { level: 9 })
    hashes[f] = crypto.createHash("sha256").update(gz).digest("hex")
  }
  const populated = await api(token, "POST", `${version.name}:populateFiles`, { files: hashes })
  console.log(`uploading ${populated.uploadRequiredHashes?.length || 0} required hashes`)

  const byHash = {}
  for (const f of files) byHash[hashes[f]] = f
  for (const h of populated.uploadRequiredHashes || []) {
    const gz = zlib.gzipSync(fs.readFileSync(path.join(publicDir, byHash[h].slice(1))), { level: 9 })
    const res = await fetch(`${populated.uploadUrl}/${h}`, {
      method: "POST", headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/octet-stream" }, body: gz
    })
    if (!res.ok) fail(`upload ${byHash[h]} → HTTP ${res.status}`)
  }

  await api(token, "PATCH", `${version.name}?updateMask=status`, { status: "FINALIZED" })
  const release = await api(token, "POST", `sites/${site}/releases?versionName=${encodeURIComponent(version.name)}`, {})
  console.log(`released: ${release.name} → https://${site}.web.app + custom domains`)
}

main().catch((e) => fail(e.message))
