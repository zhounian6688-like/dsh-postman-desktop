// Host-half smoke test: no DSH runtime required.
//
// Builds a minimal fake plugin context, calls apply(), and asserts that the
// package registers exactly what it promises: one agent tool named
// http_request_desktop and one webServer route family mounted at
// /api/dsh-postman-desktop.
//
//   node test/smoke.mjs

import assert from 'node:assert/strict'
import { mkdtempSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

// Keep the store away from the real ~/.dsh while the test runs.
process.env.DSH_HOME = mkdtempSync(join(tmpdir(), 'dsh-postman-smoke-'))

const entry = new URL('../index.js', import.meta.url).href
const mod = await import(entry)

assert.equal(mod.name, 'dsh-postman-desktop', 'plugin name')
assert.deepEqual(mod.inject, ['tools'], 'injected services')
assert.equal(typeof mod.apply, 'function', 'apply() is exported')

const tools = []
const routes = []
const disposers = []
let injectedServices = null

const ctx = {
  effect(fn) {
    const dispose = fn()
    disposers.push(typeof dispose === 'function' ? dispose : () => {})
  },
  tools: {
    register(tool) {
      tools.push(tool)
      return () => {}
    },
  },
  inject(services, fn) {
    injectedServices = services
    fn({
      effect: ctx.effect,
      webServer: {
        register(route) {
          routes.push(route)
          return () => {}
        },
      },
    })
  },
}

mod.apply(ctx)

assert.deepEqual(injectedServices, ['webServer'], 'host half needs the web server')
assert.equal(tools.length, 1, 'exactly one agent tool')

const tool = tools[0]
assert.equal(tool.name, 'http_request_desktop', 'tool name')
assert.equal(typeof tool.execute, 'function', 'tool is executable')
assert.equal(tool.parameters.required[0], 'url', 'url is required')
assert.ok(tool.parameters.properties.environment, 'environment parameter is documented')
assert.ok(tool.output.render.length > 0, 'tool output is rendered as text')

assert.equal(routes.length, 1, 'exactly one route family')
const route = routes[0]
assert.equal(route.kind, 'prefix', 'routes are mounted as a prefix')
assert.equal(route.path, '/api/dsh-postman-desktop', 'route prefix')
assert.equal(typeof route.handler, 'function', 'route has a handler')

// Cross-origin requests must be refused before any work happens.
const denied = []
await route.handler(
  { url: '/api/dsh-postman-desktop/health', method: 'GET', headers: { host: 'example.test', origin: 'https://evil.test' } },
  {
    statusCode: 0,
    headers: {},
    setHeader(name, value) {
      this.headers[String(name).toLowerCase()] = value
    },
    writeHead(code, headers) {
      this.statusCode = code
      if (headers !== undefined) Object.assign(this.headers, headers)
    },
    end(body) {
      denied.push({ code: this.statusCode, headers: this.headers, body })
    },
  },
)
assert.equal(denied.length, 1, 'cross-origin request is answered')
assert.equal(denied[0].code, 403, 'cross-origin request is refused')

// Teardown must run.
for (const dispose of disposers) dispose()

console.log('ok — http_request_desktop + /api/dsh-postman-desktop registered, cross-origin refused')
