// dsh-postman-desktop — host half.
//
// A Postman-style HTTP workbench for the DSH Web GUI. This half owns the send
// engine (one code path used by both the panel and the `http_request_desktop`
// agent tool), the JSON store under $DSH_HOME/postman-desktop, the
// /api/dsh-postman-desktop route family, and the agent tool.
//
// Deliberately dependency-free: only node: builtins. The package is installed
// as a workspace link, so any import of a @deepseek-ai/* package would have to
// resolve through the profile's node_modules and would break on a symlinked
// install. Tools are plain objects (the shape the registry accepts) for the
// same reason.

import { mkdirSync, readFileSync, renameSync, writeFileSync, existsSync } from 'node:fs'
import { homedir } from 'node:os'
import { join, isAbsolute, resolve as resolvePath } from 'node:path'
import { request as httpRequest } from 'node:http'
import { request as httpsRequest } from 'node:https'
import { randomBytes } from 'node:crypto'
import { gunzipSync, inflateSync, brotliDecompressSync } from 'node:zlib'

export const name = 'dsh-postman-desktop'
export const inject = ['tools']

// ── paths ──────────────────────────────────────────────────────────────────

function dshHome() {
  const raw = process.env.DSH_HOME
  if (typeof raw === 'string' && raw.trim() !== '') {
    const v = raw.trim()
    if (v === '~') return homedir()
    if (v.startsWith('~/')) return join(homedir(), v.slice(2))
    return isAbsolute(v) ? v : resolvePath(process.cwd(), v)
  }
  return join(homedir(), '.dsh')
}

const storeDir = () => join(dshHome(), 'postman-desktop')
const storePath = () => join(storeDir(), 'store.json')

const MAX_RESPONSE_BYTES = 4 * 1024 * 1024
const MAX_REQUEST_BYTES = 16 * 1024 * 1024
const MAX_HISTORY = 120
const DEFAULT_TIMEOUT_MS = 30_000

// ── small helpers ──────────────────────────────────────────────────────────

const newId = () => randomBytes(8).toString('hex')
const isObject = (v) => typeof v === 'object' && v !== null && !Array.isArray(v)

function emptyStore() {
  return {
    version: 1,
    collections: [],
    environments: [],
    activeEnvironmentId: null,
    history: [],
  }
}

function normalizeRows(rows) {
  if (!Array.isArray(rows)) return []
  const out = []
  for (const row of rows) {
    if (!isObject(row)) continue
    const key = typeof row.key === 'string' ? row.key : ''
    const value = row.value === undefined || row.value === null ? '' : String(row.value)
    if (key === '' && value === '') continue
    out.push({ key, value, enabled: row.enabled !== false, description: typeof row.description === 'string' ? row.description : '' })
  }
  return out
}

function normalizeRequest(input) {
  const req = isObject(input) ? input : {}
  const body = isObject(req.body) ? req.body : {}
  const auth = isObject(req.auth) ? req.auth : {}
  const options = isObject(req.options) ? req.options : {}
  return {
    method: typeof req.method === 'string' && req.method.trim() !== '' ? req.method.trim().toUpperCase() : 'GET',
    url: typeof req.url === 'string' ? req.url : '',
    params: normalizeRows(req.params),
    headers: normalizeRows(req.headers),
    body: {
      mode: ['none', 'raw', 'urlencoded', 'formdata', 'binary'].includes(body.mode) ? body.mode : 'none',
      raw: typeof body.raw === 'string' ? body.raw : '',
      rawLanguage: typeof body.rawLanguage === 'string' ? body.rawLanguage : 'json',
      urlencoded: normalizeRows(body.urlencoded),
      formdata: normalizeRows(body.formdata),
      binaryBase64: typeof body.binaryBase64 === 'string' ? body.binaryBase64 : '',
      binaryPath: typeof body.binaryPath === 'string' ? body.binaryPath : '',
      binaryType: typeof body.binaryType === 'string' ? body.binaryType : 'application/octet-stream',
    },
    auth: {
      type: ['none', 'bearer', 'basic', 'apikey', 'header'].includes(auth.type) ? auth.type : 'none',
      token: typeof auth.token === 'string' ? auth.token : '',
      username: typeof auth.username === 'string' ? auth.username : '',
      password: typeof auth.password === 'string' ? auth.password : '',
      key: typeof auth.key === 'string' ? auth.key : '',
      value: typeof auth.value === 'string' ? auth.value : '',
      in: auth.in === 'query' ? 'query' : 'header',
    },
    options: {
      followRedirects: options.followRedirects !== false,
      verifyTls: options.verifyTls !== false,
      timeoutMs: Number.isFinite(options.timeoutMs) && options.timeoutMs > 0 ? Math.min(Math.round(options.timeoutMs), 300_000) : DEFAULT_TIMEOUT_MS,
      maxRedirects: Number.isFinite(options.maxRedirects) && options.maxRedirects >= 0 ? Math.min(Math.round(options.maxRedirects), 20) : 10,
    },
  }
}

function normalizeStore(input) {
  const base = emptyStore()
  if (!isObject(input)) return base
  if (Array.isArray(input.collections)) {
    base.collections = input.collections.filter(isObject).map(normalizeCollection)
  }
  if (Array.isArray(input.environments)) {
    base.environments = input.environments.filter(isObject).map((env) => ({
      id: typeof env.id === 'string' && env.id !== '' ? env.id : newId(),
      name: typeof env.name === 'string' && env.name !== '' ? env.name : '环境',
      variables: normalizeRows(env.variables),
    }))
  }
  base.activeEnvironmentId = typeof input.activeEnvironmentId === 'string' ? input.activeEnvironmentId : null
  if (Array.isArray(input.history)) {
    base.history = input.history.filter(isObject).slice(0, MAX_HISTORY).map((row) => ({
      id: typeof row.id === 'string' && row.id !== '' ? row.id : newId(),
      at: typeof row.at === 'number' ? row.at : Date.now(),
      method: typeof row.method === 'string' ? row.method : 'GET',
      url: typeof row.url === 'string' ? row.url : '',
      status: typeof row.status === 'number' ? row.status : 0,
      ms: typeof row.ms === 'number' ? row.ms : 0,
      size: typeof row.size === 'number' ? row.size : 0,
      ok: row.ok === true,
      name: typeof row.name === 'string' ? row.name : '',
      request: isObject(row.request) ? normalizeRequest(row.request) : undefined,
    }))
  }
  return base
}

function normalizeCollection(node) {
  return {
    id: typeof node.id === 'string' && node.id !== '' ? node.id : newId(),
    name: typeof node.name === 'string' && node.name !== '' ? node.name : '集合',
    items: Array.isArray(node.items) ? node.items.filter(isObject).map(normalizeNode) : [],
  }
}

function normalizeNode(node) {
  const out = {
    id: typeof node.id === 'string' && node.id !== '' ? node.id : newId(),
    type: node.type === 'folder' ? 'folder' : 'request',
    name: typeof node.name === 'string' && node.name !== '' ? node.name : '未命名',
  }
  if (out.type === 'folder') {
    out.items = Array.isArray(node.items) ? node.items.filter(isObject).map(normalizeNode) : []
  } else {
    out.request = normalizeRequest(node.request)
  }
  return out
}

// ── store persistence ──────────────────────────────────────────────────────

let cache = null
let queue = Promise.resolve()

function serial(task) {
  const run = queue.then(task, task)
  queue = run.then(
    () => undefined,
    () => undefined,
  )
  return run
}

function loadStore() {
  if (cache !== null) return cache
  try {
    const text = readFileSync(storePath(), 'utf8')
    cache = normalizeStore(JSON.parse(text))
  } catch {
    cache = emptyStore()
  }
  return cache
}

function saveStore(next) {
  const normalized = normalizeStore(next)
  cache = normalized
  mkdirSync(storeDir(), { recursive: true })
  const tmp = storePath() + '.tmp'
  writeFileSync(tmp, JSON.stringify(normalized, null, 2), { mode: 0o600 })
  renameSync(tmp, storePath())
  return normalized
}

// ── variable resolution ────────────────────────────────────────────────────

function envVariables(store, environmentId) {
  const map = new Map()
  for (const env of store.environments) {
    if (environmentId !== undefined && environmentId !== null && env.id !== environmentId) continue
    for (const row of env.variables) {
      if (row.enabled && row.key) map.set(row.key, row.value)
    }
  }
  return map
}

const VAR_PATTERN = /\{\{\s*([^{}]+?)\s*\}\}/g

function resolveVars(input, vars, depth = 0) {
  if (typeof input !== 'string' || input.indexOf('{{') === -1) return input
  if (depth > 5) return input
  const replaced = input.replace(VAR_PATTERN, (match, key) => {
    const hit = vars.get(key)
    return hit === undefined ? match : hit
  })
  return replaced === input ? input : resolveVars(replaced, vars, depth + 1)
}

// ── request assembly ───────────────────────────────────────────────────────

function buildQuery(url, params, vars) {
  const active = params.filter((row) => row.enabled && row.key !== '')
  if (active.length === 0) return url
  const [head, hash] = url.split('#')
  const joiner = head.includes('?') ? (head.endsWith('?') || head.endsWith('&') ? '' : '&') : '?'
  const qs = active
    .map((row) => encodeURIComponent(resolveVars(row.key, vars)) + '=' + encodeURIComponent(resolveVars(row.value, vars)))
    .join('&')
  return head + joiner + qs + (hash === undefined ? '' : '#' + hash)
}

function buildAuthHeaders(auth, headers, vars, urlRef) {
  const type = auth.type
  if (type === 'none') return
  if (type === 'bearer') {
    const token = resolveVars(auth.token, vars).trim()
    if (token !== '') headers.push(['Authorization', 'Bearer ' + token])
    return
  }
  if (type === 'basic') {
    const user = resolveVars(auth.username, vars)
    const pass = resolveVars(auth.password, vars)
    headers.push(['Authorization', 'Basic ' + Buffer.from(user + ':' + pass, 'utf8').toString('base64')])
    return
  }
  if (type === 'apikey') {
    const key = resolveVars(auth.key, vars).trim()
    if (key === '') return
    const value = resolveVars(auth.value, vars)
    if (auth.in === 'query') {
      const sep = urlRef.value.includes('?') ? '&' : '?'
      urlRef.value += sep + encodeURIComponent(key) + '=' + encodeURIComponent(value)
    } else {
      headers.push([key, value])
    }
    return
  }
  if (type === 'header') {
    const key = resolveVars(auth.key, vars).trim()
    if (key !== '') headers.push([key, resolveVars(auth.value, vars)])
  }
}

const RAW_CONTENT_TYPES = {
  json: 'application/json',
  text: 'text/plain',
  xml: 'application/xml',
  html: 'text/html',
  javascript: 'application/javascript',
}

function buildBody(body, headers, vars) {
  const mode = body.mode
  if (mode === 'none') return undefined
  if (mode === 'raw') {
    const raw = resolveVars(body.raw, vars)
    const ct = RAW_CONTENT_TYPES[body.rawLanguage] ?? 'text/plain'
    if (!hasHeader(headers, 'content-type')) headers.push(['Content-Type', ct])
    return Buffer.from(raw, 'utf8')
  }
  if (mode === 'urlencoded') {
    const rows = body.urlencoded.filter((row) => row.enabled && row.key !== '')
    if (!hasHeader(headers, 'content-type')) headers.push(['Content-Type', 'application/x-www-form-urlencoded'])
    return Buffer.from(
      rows
        .map((row) => encodeURIComponent(resolveVars(row.key, vars)) + '=' + encodeURIComponent(resolveVars(row.value, vars)))
        .join('&'),
      'utf8',
    )
  }
  if (mode === 'formdata') {
    const boundary = '----dshPostmanForm' + randomBytes(8).toString('hex')
    const parts = []
    for (const row of body.formdata) {
      if (!row.enabled || row.key === '') continue
      const key = resolveVars(row.key, vars)
      const value = resolveVars(row.value, vars)
      if (row.value.startsWith('@') && row.value.length > 1) {
        const filePath = resolveVars(row.value.slice(1), vars)
        let bytes = Buffer.alloc(0)
        try {
          bytes = readFileSync(filePath)
        } catch {
          bytes = Buffer.from('', 'utf8')
        }
        const filename = filePath.split(/[\\/]/).pop() || 'file'
        parts.push(
          Buffer.from(
            '--' + boundary + '\r\nContent-Disposition: form-data; name="' + key + '"; filename="' + filename + '"\r\n' +
              'Content-Type: application/octet-stream\r\n\r\n',
            'utf8',
          ),
        )
        parts.push(bytes)
        parts.push(Buffer.from('\r\n', 'utf8'))
      } else {
        parts.push(
          Buffer.from('--' + boundary + '\r\nContent-Disposition: form-data; name="' + key + '"\r\n\r\n' + value + '\r\n', 'utf8'),
        )
      }
    }
    parts.push(Buffer.from('--' + boundary + '--\r\n', 'utf8'))
    if (!hasHeader(headers, 'content-type')) headers.push(['Content-Type', 'multipart/form-data; boundary=' + boundary])
    return Buffer.concat(parts)
  }
  // binary
  if (body.binaryBase64 !== '') {
    const bytes = Buffer.from(body.binaryBase64, 'base64')
    if (!hasHeader(headers, 'content-type')) headers.push(['Content-Type', body.binaryType])
    return bytes
  }
  if (body.binaryPath !== '') {
    try {
      const bytes = readFileSync(resolveVars(body.binaryPath, vars))
      if (!hasHeader(headers, 'content-type')) headers.push(['Content-Type', body.binaryType])
      return bytes
    } catch {
      return undefined
    }
  }
  return undefined
}

function hasHeader(headers, name) {
  const lower = name.toLowerCase()
  return headers.some(([key]) => key.toLowerCase() === lower)
}

// ── transport ──────────────────────────────────────────────────────────────

function decodeBody(buffer, encoding) {
  const enc = (encoding || '').toLowerCase().trim()
  if (enc === '' || enc === 'identity') return buffer
  try {
    if (enc === 'gzip' || enc === 'x-gzip') return gunzipSync(buffer)
    if (enc === 'deflate') {
      try {
        return inflateSync(buffer)
      } catch {
        return gunzipSync(buffer)
      }
    }
    if (enc === 'br') return brotliDecompressSync(buffer)
  } catch {
    return buffer
  }
  return buffer
}

function looksTextual(contentType) {
  if (!contentType) return true
  const ct = contentType.toLowerCase()
  if (ct.startsWith('text/')) return true
  return (
    ct.includes('json') ||
    ct.includes('xml') ||
    ct.includes('javascript') ||
    ct.includes('x-www-form-urlencoded') ||
    ct.includes('graphql') ||
    ct.includes('csv') ||
    ct.includes('yaml')
  )
}

function oneShot(target, spec) {
  return new Promise((resolve, reject) => {
    let parsed
    try {
      parsed = new URL(target)
    } catch {
      reject(Object.assign(new Error('URL 无效: ' + target), { code: 'EINVALIDURL' }))
      return
    }
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      reject(Object.assign(new Error('只支持 http/https'), { code: 'EPROTOCOL' }))
      return
    }
    const mod = parsed.protocol === 'https:' ? httpsRequest : httpRequest
    const options = {
      method: spec.method,
      headers: spec.headers,
      rejectUnauthorized: spec.verifyTls !== false,
    }
    // Pinning the TCP destination while keeping the URL's hostname for the Host
    // header and the TLS SNI is the only way to ask an origin directly what it
    // serves. Overriding `lookup` does exactly that: the connection goes to the
    // given address, everything the server sees is unchanged.
    if (spec.resolve !== undefined && spec.resolve !== null && typeof spec.resolve.address === 'string' && spec.resolve.address !== '') {
      const address = spec.resolve.address.replace(/^\[|\]$/g, '')
      const family = address.includes(':') ? 6 : 4
      options.lookup = (hostname, opts, callback) => {
        if (opts && opts.all) callback(null, [{ address, family }])
        else callback(null, address, family)
      }
    }
    let settled = false
    let timer = null
    const finish = (fn, value) => {
      if (settled) return
      settled = true
      if (timer !== null) {
        clearTimeout(timer)
        timer = null
      }
      fn(value)
    }
    const req = mod(parsed, options, (res) => {
      const chunks = []
      let received = 0
      let truncated = false
      res.on('data', (chunk) => {
        received += chunk.length
        if (received <= MAX_RESPONSE_BYTES) chunks.push(chunk)
        else truncated = true
      })
      res.on('end', () => {
        finish(resolve, {
          status: res.statusCode ?? 0,
          statusText: res.statusMessage ?? '',
          httpVersion: res.httpVersion ?? '1.1',
          rawHeaders: res.rawHeaders ?? [],
          headers: res.headers,
          buffer: Buffer.concat(chunks),
          received,
          truncated,
        })
      })
      res.on('error', (error) => finish(reject, error))
    })
    timer = setTimeout(() => {
      finish(reject, Object.assign(new Error('请求超时（' + spec.timeoutMs + 'ms）'), { code: 'ETIMEDOUT' }))
      // The socket must not keep the process (or the request) alive after the
      // caller already received its timeout result.
      try {
        req.destroy()
      } catch {
        /* ignore */
      }
    }, spec.timeoutMs)
    if (typeof timer.unref === 'function') timer.unref()
    req.on('error', (error) => finish(reject, error))
    if (spec.body !== undefined) req.write(spec.body)
    req.end()
  })
}

async function sendRequest(requestInput, environmentId) {
  const store = loadStore()
  const vars = envVariables(store, environmentId)
  const request = normalizeRequest(requestInput)
  const started = Date.now()

  const headers = []
  for (const row of request.headers) {
    if (!row.enabled || row.key === '') continue
    headers.push([resolveVars(row.key, vars), resolveVars(row.value, vars)])
  }
  const urlRef = { value: resolveVars(request.url, vars).trim() }
  if (urlRef.value === '') {
    return { ok: false, error: 'URL 不能为空', ms: 0, url: '' }
  }
  if (!/^[a-zA-Z][a-zA-Z0-9+.-]*:\/\//.test(urlRef.value)) urlRef.value = 'http://' + urlRef.value
  urlRef.value = buildQuery(urlRef.value, request.params, vars)
  buildAuthHeaders(request.auth, headers, vars, urlRef)
  if (!hasHeader(headers, 'accept-encoding')) headers.push(['Accept-Encoding', 'gzip, deflate, br'])
  if (!hasHeader(headers, 'user-agent')) headers.push(['User-Agent', 'dsh-postman-desktop/1.0'])
  const body = buildBody(request.body, headers, vars)

  const headerObject = {}
  for (const [key, value] of headers) {
    const existing = Object.keys(headerObject).find((k) => k.toLowerCase() === key.toLowerCase())
    if (existing !== undefined) {
      headerObject[existing] = headerObject[existing] + ', ' + value
    } else {
      headerObject[key] = value
    }
  }

  const spec = {
    method: request.method,
    headers: headerObject,
    body,
    timeoutMs: request.options.timeoutMs,
    verifyTls: request.options.verifyTls,
  }

  let currentUrl = urlRef.value
  let currentMethod = request.method
  let currentBody = body
  let redirects = 0
  let response

  try {
    for (;;) {
      response = await oneShot(currentUrl, { ...spec, method: currentMethod, body: currentBody })
      if (!request.options.followRedirects) break
      const location = response.headers.location
      if (response.status < 300 || response.status >= 400 || typeof location !== 'string') break
      if (redirects >= request.options.maxRedirects) break
      redirects += 1
      let next
      try {
        next = new URL(location, currentUrl).toString()
      } catch {
        break
      }
      if (response.status === 303 || ((response.status === 301 || response.status === 302) && currentMethod !== 'GET' && currentMethod !== 'HEAD')) {
        currentMethod = 'GET'
        currentBody = undefined
        if (spec.headers['Content-Type'] !== undefined || spec.headers['content-type'] !== undefined) {
          delete spec.headers['Content-Type']
          delete spec.headers['content-type']
        }
      }
      currentUrl = next
    }
  } catch (error) {
    const ms = Date.now() - started
    const code = error && error.code ? String(error.code) : ''
    const message = error instanceof Error ? error.message : String(error)
    return { ok: false, error: code ? message + ' [' + code + ']' : message, ms, url: urlRef.value }
  }

  const ms = Date.now() - started
  const decoded = decodeBody(response.buffer, response.headers['content-encoding'])
  const contentType = String(response.headers['content-type'] ?? '')
  const textual = looksTextual(contentType)
  const headersFlat = []
  for (let i = 0; i + 1 < response.rawHeaders.length; i += 2) {
    headersFlat.push([response.rawHeaders[i], response.rawHeaders[i + 1]])
  }

  // Whether the site allows being shown in a frame. Sent by the server, so the
  // client knows before it even renders the iframe — no need to guess from a
  // missing `load` event, which a slow mobile connection can produce on a page
  // that never refused anything.
  const xfo = String(response.headers['x-frame-options'] ?? '').toLowerCase()
  const csp = String(response.headers['content-security-policy'] ?? '').toLowerCase()
  const frameAncestors = /frame-ancestors\s+([^;]+)/.exec(csp)
  const framable = !(
    xfo.includes('deny') ||
    xfo.includes('sameorigin') ||
    (frameAncestors !== null && !/(^|\s)\*(\s|$)/.test(frameAncestors[1]))
  )

  const result = {
    ok: response.status >= 200 && response.status < 400,
    status: response.status,
    statusText: response.statusText,
    httpVersion: response.httpVersion,
    ms,
    size: decoded.length,
    receivedBytes: response.received,
    truncated: response.truncated,
    redirected: redirects > 0,
    redirects,
    finalUrl: currentUrl,
    requestUrl: urlRef.value,
    requestMethod: request.method,
    contentType,
    headers: headersFlat,
    framable,
    bodyEncoding: textual ? 'utf8' : 'base64',
    body: textual ? decoded.toString('utf8') : decoded.toString('base64'),
  }

  // history: most recent first, capped. The full request is kept so a row can
  // be restored into the builder with one click.
  const entry = {
    id: newId(),
    at: Date.now(),
    method: request.method,
    url: urlRef.value,
    status: response.status,
    ms,
    size: result.size,
    ok: result.ok,
    name: typeof requestInput?.name === 'string' ? requestInput.name : '',
    request: { ...request, url: requestInput?.url ?? request.url },
  }
  const nextHistory = [entry, ...store.history.filter((row) => !(row.url === entry.url && row.method === entry.method && Date.now() - row.at < 2000))]
  saveStore({ ...store, history: nextHistory.slice(0, MAX_HISTORY) })

  return result
}

// ── cURL import ────────────────────────────────────────────────────────────

function tokenizeCurl(command) {
  const text = String(command).replace(/\\\r?\n/g, ' ')
  const tokens = []
  let current = ''
  let quote = null
  let started = false
  for (let i = 0; i < text.length; i += 1) {
    const ch = text[i]
    if (quote !== null) {
      if (ch === '\\' && quote === '"' && i + 1 < text.length) {
        const nextCh = text[i + 1]
        if (nextCh === '"' || nextCh === '\\' || nextCh === '$' || nextCh === '`') {
          current += nextCh
          i += 1
          continue
        }
        current += ch
        continue
      }
      if (ch === quote) {
        quote = null
        continue
      }
      current += ch
      continue
    }
    if (ch === '"' || ch === "'") {
      quote = ch
      started = true
      continue
    }
    if (/\s/.test(ch)) {
      if (started || current !== '') {
        tokens.push(current)
        current = ''
        started = false
      }
      continue
    }
    current += ch
    started = true
  }
  if (started || current !== '') tokens.push(current)
  return tokens
}

/**
 * Whether a token plausibly addresses an HTTP resource. A bare word such as
 * `garbage` must not become a request URL just because it was the only
 * non-flag token, so this requires a scheme, a dotted host, a bracketed IPv6
 * literal, or a host:port pair.
 * @param value - candidate URL text.
 * @returns true when the text looks like an address.
 */
function looksLikeUrl(value) {
  const text = String(value).trim()
  if (text === '') return false
  if (/^[a-zA-Z][a-zA-Z0-9+.-]*:\/\//.test(text)) return true
  if (text.startsWith('//')) return true
  if (text.startsWith('[')) return true
  const hostPart = text.split('/')[0].split('?')[0]
  if (/^[^@\s]+@[^:\s]+(:\d+)?$/.test(hostPart)) return true
  if (/^[^:\s/]+:\d{1,5}$/.test(hostPart)) return true
  return /^[^.\s]+\.[^.\s]+/.test(hostPart)
}

function parseCurl(command) {
  const tokens = tokenizeCurl(command)
  if (tokens.length === 0) return null
  let index = 0
  if (tokens[0] === 'curl') index = 1
  const request = normalizeRequest({})
  const headers = []
  const dataParts = []
  let url = ''
  let method = ''
  let user = ''
  let cookies = []
  let headOnly = false

  const takeValue = (inline) => {
    if (inline !== undefined) return inline
    index += 1
    return tokens[index] ?? ''
  }

  for (; index < tokens.length; index += 1) {
    const token = tokens[index]
    const eq = token.startsWith('--') ? token.indexOf('=') : -1
    const flag = eq > 2 ? token.slice(0, eq) : token
    const inline = eq > 2 ? token.slice(eq + 1) : undefined
    switch (flag) {
      case '-X':
      case '--request':
        method = takeValue(inline)
        break
      case '-H':
      case '--header': {
        const raw = takeValue(inline)
        const sep = raw.indexOf(':')
        if (sep > 0) headers.push([raw.slice(0, sep).trim(), raw.slice(sep + 1).trim()])
        break
      }
      case '-d':
      case '--data':
      case '--data-raw':
      case '--data-binary':
      case '--data-ascii':
        dataParts.push(takeValue(inline))
        break
      case '--data-urlencode':
        dataParts.push(encodeURIComponent(takeValue(inline)))
        break
      case '-F':
      case '--form': {
        const raw = takeValue(inline)
        const sep = raw.indexOf('=')
        if (sep > 0) {
          const value = raw.slice(sep + 1)
          request.body.formdata.push({
            key: raw.slice(0, sep),
            value: value.startsWith('@') ? value : value,
            enabled: true,
            description: '',
          })
        }
        request.body.mode = 'formdata'
        break
      }
      case '-u':
      case '--user': {
        const raw = takeValue(inline)
        const sep = raw.indexOf(':')
        request.auth.type = 'basic'
        request.auth.username = sep >= 0 ? raw.slice(0, sep) : raw
        request.auth.password = sep >= 0 ? raw.slice(sep + 1) : ''
        break
      }
      case '-b':
      case '--cookie':
        cookies.push(takeValue(inline))
        break
      case '-A':
      case '--user-agent':
        headers.push(['User-Agent', takeValue(inline)])
        break
      case '-e':
      case '--referer':
        headers.push(['Referer', takeValue(inline)])
        break
      case '-I':
      case '--head':
        headOnly = true
        break
      case '-k':
      case '--insecure':
        request.options.verifyTls = false
        break
      case '-L':
      case '--location':
        request.options.followRedirects = true
        break
      case '--compressed':
        break
      case '-o':
      case '--output':
      case '--max-time':
      case '--connect-timeout':
      case '--retry':
      case '-w':
      case '--write-out':
        takeValue(inline)
        break
      case '--url':
        url = takeValue(inline)
        break
      default:
        if (!token.startsWith('-') && looksLikeUrl(token)) url = token
        break
    }
  }

  if (url === '' && dataParts.length === 0 && headers.length === 0) return null
  if (url === '' && (dataParts.length > 0 || headers.length > 0)) return null
  request.url = url
  request.headers = headers.map(([key, value]) => ({ key, value, enabled: true, description: '' }))
  if (cookies.length > 0) request.headers.push({ key: 'Cookie', value: cookies.join('; '), enabled: true, description: '' })
  if (dataParts.length > 0) {
    request.body.mode = 'raw'
    request.body.raw = dataParts.join('&')
    const hasCt = headers.some(([key]) => key.toLowerCase() === 'content-type')
    if (!hasCt) {
      const trimmed = request.body.raw.trim()
      const isJson = (trimmed.startsWith('{') && trimmed.endsWith('}')) || (trimmed.startsWith('[') && trimmed.endsWith(']'))
      request.body.rawLanguage = isJson ? 'json' : 'text'
    }
  }
  request.method = method !== '' ? method.toUpperCase() : headOnly ? 'HEAD' : dataParts.length > 0 ? 'POST' : 'GET'
  return request
}

// ── CDN origin probe ───────────────────────────────────────────────────────

// Answering "is this origin file gone?" through a CDN needs two independent
// reads: what the CDN serves now, and what the origin says when asked to
// bypass its cache. Only the second can call a file deleted — an edge can serve
// a perfectly healthy cached copy of something that no longer exists, and an
// edge can equally return 403 for reasons that have nothing to do with the file
// (expired signature, hotlink protection, UA filtering).
//
// The probe is deliberately GET-with-Range rather than HEAD: enough servers
// answer HEAD with 405/501, and several CDNs keep a separate HEAD cache whose
// state has no relation to the GET cache.

const PROBE_TIMEOUT_MS = 20_000
const PROBE_SAMPLE_BYTES = 1024
const BROWSER_UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0 Safari/537.36'

/** Append a cache-busting parameter without corrupting an existing query. */
function withCacheBuster(url, tag) {
  const hashIndex = url.indexOf('#')
  const base = hashIndex === -1 ? url : url.slice(0, hashIndex)
  // `?` when the URL has no query, `&` when it already carries one. Naive
  // concatenation turns `...?sig=x&exp=1` into `...?sig=x&exp=1?cb=2`, which
  // makes the signature invalid and looks exactly like a deleted file.
  const separator = base.includes('?') ? '&' : '?'
  return base + separator + 'dshcb=' + encodeURIComponent(tag)
}

/** Headers that name the cache verdict, in the order CDNs usually send them. */
const CACHE_HEADERS = [
  'x-cache',
  'cf-cache-status',
  'x-cache-status',
  'x-cache-lookup',
  'x-cdn-cache-status',
  'ali-cdn-cache-status',
  'x-proxy-cache',
  'x-served-by',
  'cdn-cache',
]

function pickCacheStatus(headers) {
  for (const name of CACHE_HEADERS) {
    const value = headers[name]
    if (typeof value === 'string' && value !== '') return value
  }
  return ''
}

/** A short content fingerprint: enough to notice the file changed, cheap enough
 *  to run on every probe. Range-limited, so this reads at most 1 KB. */
function sampleDigest(buffer) {
  if (!buffer || buffer.length === 0) return ''
  const slice = buffer.subarray(0, PROBE_SAMPLE_BYTES)
  // A cheap FNV-1a is enough here: this is a change detector, not a signature.
  let hash = 0x811c9dc5
  for (let i = 0; i < slice.length; i++) {
    hash ^= slice[i]
    hash = Math.imul(hash, 0x01000193) >>> 0
  }
  return hash.toString(16).padStart(8, '0') + ':' + slice.length
}

function looksExpiredSignature(url) {
  const lower = url.toLowerCase()
  return /[?&](expires|exp|signature|sig|x-amz-signature|x-amz-expires|x-goog-signature|auth_key|token)=/.test(lower)
}

/**
 * One probe. `resolve` lets the caller pin the TCP destination so the request
 * goes straight to an origin IP while keeping the CDN hostname in Host/SNI —
 * the only way to see origin truth without the CDN in the path.
 */
async function probeOnce(url, options = {}) {
  const headers = {
    'user-agent': options.userAgent || BROWSER_UA,
    accept: '*/*',
    'accept-encoding': 'identity',
    'cache-control': 'no-cache, no-store, max-age=0',
    pragma: 'no-cache',
    range: 'bytes=0-' + (PROBE_SAMPLE_BYTES - 1),
  }
  if (typeof options.referer === 'string' && options.referer !== '') headers.referer = options.referer

  const started = Date.now()
  try {
    // Follow redirects here rather than in `oneShot`: an http→https hop is
    // routine on government sites, and reporting the 301 says nothing about
    // whether the attachment exists.
    let currentUrl = url
    let response
    let hops = 0
    for (;;) {
      response = await oneShot(currentUrl, {
        method: 'GET',
        headers,
        timeoutMs: options.timeoutMs || PROBE_TIMEOUT_MS,
        verifyTls: options.verifyTls,
        resolve: options.resolve,
      })
      const location = response.headers.location
      if (response.status < 300 || response.status >= 400 || typeof location !== 'string') break
      if (hops >= 5) break
      hops += 1
      try {
        currentUrl = new URL(location, currentUrl).toString()
      } catch {
        break
      }
      // A pinned origin address only makes sense for the original hostname.
      if (options.resolve !== undefined && options.resolve !== null) {
        try {
          if (new URL(currentUrl).hostname !== options.resolve.hostname) delete options.resolve
        } catch {
          /* leave it */
        }
      }
    }
    const flat = {}
    for (let i = 0; i + 1 < response.rawHeaders.length; i += 2) {
      const key = String(response.rawHeaders[i]).toLowerCase()
      // Keep the first occurrence: repeated headers are rare and the first is
      // the one curl-style tools report.
      if (flat[key] === undefined) flat[key] = String(response.rawHeaders[i + 1])
    }
    return {
      via: options.via,
      ok: true,
      url,
      finalUrl: currentUrl,
      hops,
      status: response.status,
      ms: Date.now() - started,
      server: flat['server'] || '',
      viaHeader: flat['via'] || '',
      age: flat['age'] !== undefined ? Number(flat['age']) : null,
      cacheStatus: pickCacheStatus(flat),
      etag: flat['etag'] || '',
      lastModified: flat['last-modified'] || '',
      contentLength: flat['content-length'] !== undefined ? Number(flat['content-length']) : null,
      contentType: flat['content-type'] || '',
      digest: sampleDigest(response.buffer),
      bytesRead: response.buffer ? response.buffer.length : 0,
      error: '',
    }
  } catch (error) {
    const code = error && error.code ? String(error.code) : ''
    return {
      via: options.via,
      ok: false,
      url,
      finalUrl: url,
      hops: 0,
      status: 0,
      ms: Date.now() - started,
      server: '',
      viaHeader: '',
      age: null,
      cacheStatus: '',
      etag: '',
      lastModified: '',
      contentLength: null,
      contentType: '',
      digest: '',
      bytesRead: 0,
      error: code ? String(error.message) + ' [' + code + ']' : String(error && error.message ? error.message : error),
    }
  }
}

const DELETED_STATUSES = new Set([404, 410])
const AUTH_STATUSES = new Set([401, 403])
const TRANSIENT = new Set([408, 425, 429, 500, 502, 503, 504])

/** Did the edge actually answer from cache? */
function servedFromCache(probe) {
  if (!probe || !probe.ok) return false
  const token = String(probe.cacheStatus || '').toUpperCase()
  if (token !== '') {
    if (/(^|[^A-Z])(MISS|BYPASS|DYNAMIC|EXPIRED|REVALIDATED)([^A-Z]|$)/.test(token)) return false
    if (/(HIT|HIT-STALE|STALE|REFRESH)/.test(token)) return true
  }
  // No vendor header: a positive Age means this copy waited in a cache.
  return typeof probe.age === 'number' && probe.age > 0
}

/**
 * Turn three probes into one verdict plus the reasoning behind it, so the UI
 * can show why instead of just a colour.
 */
function judgeProbe(url, plain, busted, origin) {
  const reasons = []
  const expired = looksExpiredSignature(url)

  const originProbe = origin && origin.ok ? origin : null
  const originAlive = originProbe && (originProbe.status === 200 || originProbe.status === 206)
  const originGone = originProbe && DELETED_STATUSES.has(originProbe.status)

  // 1. A direct read of the origin settles the question outright.
  if (originGone) {
    reasons.push('源站直接返回 ' + originProbe.status + '，文件已不存在')
    return { verdict: 'deleted', label: '已删除（源站确认）', reasons }
  }
  if (originAlive) {
    reasons.push('源站直连返回 ' + originProbe.status)
    if (servedFromCache(plain) && DELETED_STATUSES.has(busted.status)) {
      reasons.push('但穿透请求返回 ' + busted.status + '，边缘与源站不一致，重试一次')
      return { verdict: 'conflict', label: '结果冲突，建议重试', reasons }
    }
    if (!plain.ok) {
      reasons.push('CDN 请求失败：' + plain.error)
      return { verdict: 'alive', label: '文件存在（CDN 不可达）', reasons }
    }
    if (servedFromCache(plain)) reasons.push('CDN 返回的是缓存副本')
    if (plain.digest && busted.digest && plain.digest !== busted.digest) {
      reasons.push('缓存内容与源站不一致（指纹 ' + plain.digest + ' ≠ ' + busted.digest + '），文件可能已被替换')
      return { verdict: 'changed', label: '文件存在但内容有变', reasons }
    }
    return { verdict: 'alive', label: '文件存在', reasons }
  }

  // 2. No usable origin probe: judge from the two CDN reads, conservatively.
  if (!plain.ok && !busted.ok) {
    reasons.push('两次请求都失败：' + plain.error)
    return { verdict: 'unknown', label: '无法连接', reasons }
  }

  const edgeWasCached = servedFromCache(plain)
  if (!edgeWasCached) reasons.push('第一次请求未命中缓存，它本身就是源站的回答')
  else reasons.push('第一次请求命中了缓存，需要靠穿透请求判断源站')

  const authority = edgeWasCached ? busted : plain
  const viaLabel = edgeWasCached ? '穿透请求' : '首次请求'

  if (!authority.ok) {
    reasons.push(viaLabel + '失败：' + authority.error)
    if (TRANSIENT.has(plain.status)) reasons.push('状态码 ' + plain.status + ' 属于临时故障，可重试')
    return { verdict: 'unknown', label: '无法判定', reasons }
  }

  if (DELETED_STATUSES.has(authority.status)) {
    reasons.push(viaLabel + '返回 ' + authority.status + '，源站确认不存在')
    if (edgeWasCached) reasons.push('CDN 仍在提供旧缓存，属于脏缓存，需要刷新')
    return { verdict: 'deleted', label: edgeWasCached ? '已删除（CDN 还在发缓存）' : '已删除', reasons }
  }

  if (AUTH_STATUSES.has(authority.status)) {
    if (expired) reasons.push('URL 里带签名/过期参数，' + authority.status + ' 更可能是签名失效')
    else reasons.push(authority.status + ' 通常是防盗链（Referer）、UA 过滤或权限问题')
    reasons.push('这个状态码不能用来判断文件是否存在')
    return { verdict: 'blocked', label: '被拦截，无法判定', reasons }
  }

  if (authority.status === 405 || authority.status === 501) {
    reasons.push('服务器不接受该方法（' + authority.status + '），不是文件状态')
    return { verdict: 'unknown', label: '方法不被接受', reasons }
  }

  if (TRANSIENT.has(authority.status)) {
    reasons.push('状态码 ' + authority.status + ' 属于临时故障，可重试')
    return { verdict: 'unknown', label: '源站临时故障', reasons }
  }

  if (authority.status === 200 || authority.status === 206) {
    reasons.push(viaLabel + '返回 ' + authority.status + '，文件存在')
    if (!expired && plain.etag && busted.etag && plain.etag !== busted.etag) {
      reasons.push('ETag 不一致（' + plain.etag + ' ≠ ' + busted.etag + '），缓存可能是旧版本')
      return { verdict: 'changed', label: '文件存在，缓存可能过期', reasons }
    }
    return { verdict: 'alive', label: '文件存在', reasons }
  }

  reasons.push('状态码 ' + authority.status + ' 无法归类，需要人工判断')
  return { verdict: 'unknown', label: '结果不明确（' + authority.status + '）', reasons }
}

/**
 * Run the full probe: plain read, cache-busted read, and — when the caller
 * supplied an origin address — a direct origin read that skips the CDN.
 */
async function runProbe(input) {
  const url = typeof input.url === 'string' ? input.url.trim() : ''
  if (url === '') throw new Error('URL 不能为空')
  let parsed
  try {
    parsed = new URL(url)
  } catch {
    throw new Error('URL 无效')
  }
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') throw new Error('只支持 http/https')

  const common = {
    referer: typeof input.referer === 'string' ? input.referer : '',
    userAgent: typeof input.userAgent === 'string' && input.userAgent !== '' ? input.userAgent : BROWSER_UA,
    timeoutMs: Number.isFinite(input.timeoutMs) && input.timeoutMs > 0 ? Math.min(Math.round(input.timeoutMs), 120_000) : PROBE_TIMEOUT_MS,
    verifyTls: input.verifyTls,
  }

  const tag = Date.now().toString(36) + Math.random().toString(36).slice(2, 8)
  const bustedUrl = withCacheBuster(url, tag)

  // Sequential, not parallel: a parallel pair can both miss the edge cache and
  // then both hit the origin, which destroys the very distinction this probe
  // exists to measure. The first read has to populate the cache so the second
  // one can demonstrably avoid it.
  const plain = await probeOnce(url, { ...common, via: 'plain' })
  const busted = await probeOnce(bustedUrl, { ...common, via: 'busted' })

  let origin = null
  const originIp = typeof input.originIp === 'string' ? input.originIp.trim() : ''
  let originNote = ''
  if (originIp !== '') {
    try {
      origin = await probeOnce(url, {
        ...common,
        via: 'origin',
        // The port still comes from the URL: an origin normally listens on the
        // same port the CDN does.
        resolve: { hostname: parsed.hostname, address: originIp },
      })
    } catch (error) {
      originNote = '源站直连失败：' + (error instanceof Error ? error.message : String(error))
    }
  }

  const judged = judgeProbe(url, plain, busted, origin)
  return {
    url,
    bustedUrl,
    at: Date.now(),
    plain,
    busted,
    origin,
    originNote,
    expiredSignature: looksExpiredSignature(url),
    judge: judged,
  }
}

// ── route plumbing ─────────────────────────────────────────────────────────


function readJson(req, limit = MAX_REQUEST_BYTES) {
  return new Promise((resolve, reject) => {
    let size = 0
    const chunks = []
    req.on('data', (chunk) => {
      size += chunk.length
      if (size > limit) {
        reject(new Error('请求体过大'))
        try {
          req.destroy()
        } catch {
          /* ignore */
        }
        return
      }
      chunks.push(chunk)
    })
    req.on('end', () => {
      const text = Buffer.concat(chunks).toString('utf8')
      if (text.trim() === '') {
        resolve({})
        return
      }
      try {
        resolve(JSON.parse(text))
      } catch (error) {
        reject(new Error('JSON 解析失败: ' + (error instanceof Error ? error.message : String(error))))
      }
    })
    req.on('error', reject)
  })
}

function writeJson(res, status, payload) {
  const body = JSON.stringify(payload)
  res.statusCode = status
  res.setHeader('content-type', 'application/json; charset=utf-8')
  res.setHeader('cache-control', 'no-store')
  res.end(body)
}

function sameOrigin(req) {
  const host = req.headers.host
  if (typeof host !== 'string') return false
  const origin = req.headers.origin
  if (origin === undefined) return true
  try {
    return new URL(origin).host === host
  } catch {
    return false
  }
}

// ── agent tool ─────────────────────────────────────────────────────────────

const HTTP_TOOL_TEXT_LIMIT = 20_000

function summarizeForAgent(result) {
  if (result.ok === false && typeof result.error === 'string') {
    return '请求失败：' + result.error + (result.ms ? '（' + result.ms + 'ms）' : '')
  }
  const lines = []
  lines.push(
    result.requestMethod + ' ' + result.requestUrl + ' → ' + result.status + (result.statusText ? ' ' + result.statusText : '') +
      '  ' + result.ms + 'ms  ' + result.size + 'B',
  )
  if (result.redirected) lines.push('经过 ' + result.redirects + ' 次重定向，最终 ' + result.finalUrl)
  lines.push('--- 响应头 ---')
  for (const [key, value] of result.headers) lines.push(key + ': ' + value)
  lines.push('--- 响应正文 ---')
  if (result.bodyEncoding === 'base64') {
    lines.push('（二进制响应，' + result.size + ' 字节，base64 前 2000 字符）')
    lines.push(String(result.body).slice(0, 2000))
  } else {
    const body = String(result.body)
    lines.push(body.length > HTTP_TOOL_TEXT_LIMIT ? body.slice(0, HTTP_TOOL_TEXT_LIMIT) + '\n…（已截断）' : body)
  }
  return lines.join('\n')
}

function makeHttpTool() {
  return {
    name: 'http_request_desktop',
    description:
      '发送一次 HTTP 请求并返回状态码、耗时、响应头与响应正文。与 GUI 里的「发包工作台」共用同一条发送链路。用于调试接口、验证 Webhook、抓取 JSON API。支持变量 {{name}}（读取当前环境的变量）、Bearer/Basic/API Key 认证、raw/urlencoded/form-data 正文、重定向与超时控制。正文超过 20000 字符会截断。',
    parameters: {
      type: 'object',
      additionalProperties: false,
      properties: {
        method: { type: 'string', description: 'HTTP 方法，如 GET/POST/PUT/PATCH/DELETE/HEAD/OPTIONS' },
        url: { type: 'string', description: '完整 URL，可含 {{变量}}' },
        headers: {
          type: 'object',
          description: '请求头键值对，例如 {"Content-Type":"application/json"}',
        },
        body: { type: 'string', description: '原始请求正文；form 字段优先使用 form 参数' },
        bodyType: {
          type: 'string',
          enum: ['json', 'text', 'xml', 'html', 'urlencoded'],
          description: '正文类型，决定默认 Content-Type（默认 json）',
        },
        form: {
          type: 'array',
          description: '表单字段，发送 application/x-www-form-urlencoded',
          items: { type: 'object', additionalProperties: true },
        },
        environment: { type: 'string', description: '环境名或 id，用于解析 {{变量}}；省略则使用当前激活环境' },
        timeoutMs: { type: 'integer', description: '超时毫秒数，默认 30000' },
        followRedirects: { type: 'boolean', description: '是否跟随重定向，默认 true' },
        verifyTls: { type: 'boolean', description: '是否校验 TLS 证书，默认 true' },
      },
      required: ['url'],
    },
    output: {
      schema: { type: 'string' },
      render: (_args, value) => [{ type: 'text', text: String(value) }],
    },
    async execute(args) {
      const store = loadStore()
      let environmentId
      if (typeof args.environment === 'string' && args.environment !== '') {
        const hit = store.environments.find((env) => env.id === args.environment || env.name === args.environment)
        environmentId = hit === undefined ? args.environment : hit.id
      } else {
        environmentId = store.activeEnvironmentId ?? undefined
      }
      const headers = []
      if (isObject(args.headers)) {
        for (const [key, value] of Object.entries(args.headers)) headers.push({ key, value: String(value), enabled: true })
      }
      const bodyMode = args.form !== undefined && Array.isArray(args.form) ? 'urlencoded' : typeof args.body === 'string' ? 'raw' : 'none'
      const request = {
        method: args.method ?? (bodyMode === 'none' ? 'GET' : 'POST'),
        url: args.url,
        headers,
        body: {
          mode: bodyMode,
          raw: typeof args.body === 'string' ? args.body : '',
          rawLanguage: args.bodyType ?? 'json',
          urlencoded: Array.isArray(args.form)
            ? args.form.filter(isObject).map((row) => ({ key: String(row.key ?? ''), value: String(row.value ?? ''), enabled: true }))
            : [],
        },
        options: {
          timeoutMs: args.timeoutMs,
          followRedirects: args.followRedirects,
          verifyTls: args.verifyTls,
        },
      }
      const result = await sendRequest(request, environmentId)
      return summarizeForAgent(result)
    },
  }
}

// ── plugin body ────────────────────────────────────────────────────────────

export function apply(ctx) {
  // Warm the cache and make sure the directory exists, without blocking activation.
  try {
    loadStore()
  } catch {
    /* ignore */
  }

  ctx.effect(() => {
    const dispose = ctx.tools.register(makeHttpTool())
    return () => dispose()
  }, 'dsh-postman-desktop: http_request_desktop tool')

  ctx.inject(['webServer'], (scoped) => {
    scoped.effect(
      () =>
        scoped.webServer.register({
          kind: 'prefix',
          path: '/api/dsh-postman-desktop',
          async handler(req, res) {
            if (!sameOrigin(req)) {
              writeJson(res, 403, { error: 'forbidden: cross-origin' })
              return
            }
            const rawUrl = req.url ?? '/'
            const path = rawUrl.split('?')[0]
            const suffix = path.slice('/api/dsh-postman-desktop'.length).replace(/\/+$/, '') || '/'
            const method = (req.method ?? 'GET').toUpperCase()

            try {
              if (suffix === '/store') {
                if (method === 'GET') {
                  const store = loadStore()
                  writeJson(res, 200, { store })
                  return
                }
                if (method === 'PUT' || method === 'POST') {
                  const body = await readJson(req)
                  const next = await serial(() => saveStore(isObject(body.store) ? body.store : body))
                  writeJson(res, 200, { store: next })
                  return
                }
                writeJson(res, 405, { error: 'method not allowed' })
                return
              }

              if (suffix === '/send') {
                if (method !== 'POST') {
                  writeJson(res, 405, { error: 'method not allowed' })
                  return
                }
                const body = await readJson(req)
                const request = isObject(body.request) ? body.request : {}
                const environmentId = typeof body.environmentId === 'string' && body.environmentId !== '' ? body.environmentId : undefined
                const result = await sendRequest(request, environmentId)
                writeJson(res, 200, { result, store: loadStore() })
                return
              }

              if (suffix === '/curl') {
                if (method !== 'POST') {
                  writeJson(res, 405, { error: 'method not allowed' })
                  return
                }
                const body = await readJson(req)
                const parsed = parseCurl(typeof body.command === 'string' ? body.command : '')
                if (parsed === null) {
                  writeJson(res, 400, { error: '无法解析这条 curl 命令' })
                  return
                }
                writeJson(res, 200, { request: parsed })
                return
              }

              if (suffix === '/history') {
                if (method === 'DELETE') {
                  const next = await serial(() => saveStore({ ...loadStore(), history: [] }))
                  writeJson(res, 200, { store: next })
                  return
                }
                writeJson(res, 200, { history: loadStore().history })
                return
              }

              if (suffix === '/probe') {
                if (method !== 'POST') {
                  writeJson(res, 405, { error: 'method not allowed' })
                  return
                }
                const body = await readJson(req)
                const result = await runProbe(isObject(body) ? body : {})
                writeJson(res, 200, { result })
                return
              }

              if (suffix === '/health') {
                writeJson(res, 200, { ok: true, storePath: storePath(), exists: existsSync(storePath()) })
                return
              }

              writeJson(res, 404, { error: 'not found: ' + suffix })
            } catch (error) {
              writeJson(res, 400, { error: error instanceof Error ? error.message : String(error) })
            }
          },
        }),
      'dsh-postman-desktop: routes',
    )
  })
}
