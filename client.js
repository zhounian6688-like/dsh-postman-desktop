// dsh-postman-desktop — client half (browser).
//
// Loaded by dsh-client-modules as /plugins/dsh-postman-desktop/client.js and
// executed through the vendored cordis loader's lazy-CJS module table
// (window.__ModuleLoader__.load). Talks to the host half over same-origin
// fetch: /api/dsh-postman-desktop/{store,send,curl,history,probe,health}.
//
// Registers two seats:
//   sidebar.panellist  id "postman-desktop"  — the sidebar icon
//   main               key "postman-desktop" — the workbench page
//
// Everything is plain React.createElement (no JSX, no build step) and every
// colour comes from a --dsw-alias-* theme token, so light/dark both work.

window.__ModuleLoader__.load({
  id: 'dsh-postman-desktop',
  factory: (require) => {
    var module = { exports: {} }
    var exports = module.exports
    Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' })

    var React = require('react')
    var h = React.createElement
    var useState = React.useState
    var useEffect = React.useEffect
    var useRef = React.useRef
    var useMemo = React.useMemo
    var useCallback = React.useCallback

    // ── constants ──────────────────────────────────────────────────────────

    var API = '/api/dsh-postman-desktop'
    var NS = 'dsh-postman-desktop'

    var METHODS = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS']
    var METHOD_COLOR = {
      GET: 'var(--dsw-alias-state-success-primary,#2f9e63)',
      POST: 'var(--dsw-alias-state-warn-primary,#c98a12)',
      PUT: 'var(--dsw-alias-state-business-primary,#3b6ef0)',
      PATCH: 'var(--dsw-alias-state-business-primary,#8a5cf0)',
      DELETE: 'var(--dsw-alias-state-error-primary,#d93b3b)',
      HEAD: 'var(--dsw-alias-label-tertiary,#8a8a8a)',
      OPTIONS: 'var(--dsw-alias-label-tertiary,#8a8a8a)',
    }

    // Inline dictionary. The host also ships locale/*.json for the Plugin
    // Manager metadata; this copy is what the panel itself renders with, and it
    // doubles as the fallback when the locale service is unavailable.
    var ZH = {
      nav: '发包台',
      title: '发包工作台',
      subtitle: 'HTTP 请求调试',
      collections: '集合',
      history: '历史',
      environments: '环境',
      params: '参数',
      headers: '请求头',
      body: '正文',
      auth: '认证',
      settings: '设置',
      response: '响应',
      send: '发送',
      sending: '发送中…',
      save: '保存',
      cancel: '取消',
      remove: '删除',
      duplicate: '复制',
      rename: '重命名',
      newRequest: '新建请求',
      newFolder: '新建文件夹',
      newCollection: '新建集合',
      newEnvironment: '新建环境',
      importCurl: '导入 cURL',
      exportCurl: '复制为 cURL',
      copy: '复制',
      copied: '已复制',
      clear: '清空',
      search: '搜索…',
      emptyCollections: '还没有集合。点 + 新建一个。',
      emptyHistory: '发送过的请求会出现在这里。',
      emptyEnvironments: '还没有环境变量。',
      emptyResponse: '发送一个请求，响应会显示在这里。',
      noEnvironment: '无环境',
      key: '键',
      value: '值',
      addRow: '添加一行',
      bulkEdit: '批量编辑',
      bodyNone: 'none',
      bodyRaw: 'raw',
      bodyUrlencoded: 'form-urlencoded',
      bodyFormdata: 'form-data',
      bodyBinary: 'binary',
      authNone: '无认证',
      authBearer: 'Bearer',
      authBasic: 'Basic',
      authApiKey: 'API Key',
      authHeader: 'Header',
      status: '状态',
      time: '耗时',
      size: '大小',
      respHeaders: '响应头',
      respBody: '正文',
      pretty: '美化',
      raw: '原始',
      name: '名称',
      saveTo: '保存到',
      requestName: '请求名称',
      variable: '变量',
      active: '已启用',
      use: '启用',
      resolveHint: 'URL / 头 / 正文中的 {{变量}} 会按当前环境替换',
      invalidUrl: '请先填写 URL',
      confirmDelete: '删除后不可恢复，确认？',
      timeout: '超时(ms)',
      followRedirects: '跟随重定向',
      verifyTls: '校验 TLS',
      maxRedirects: '最大重定向',
      truncated: '响应超出 4MB，已截断',
      curlPlaceholder: '粘贴 curl 命令，例如 curl -X POST https://api.example.com -H "Content-Type: application/json" -d "{\\"a\\":1}"',
      parse: '解析并填入',
      noName: '未命名请求',
      unsaved: '未保存',
      request: '请求',
      folder: '文件夹',
      collection: '集合',
      selectOrCreate: '选择集合',
      createAndSave: '新建集合并保存',
      bodyPlaceholder: '请求正文…',
      headerCommon: '常用',
      copiedCurl: '已复制 cURL 命令',
      sendFailed: '发送失败',
      reqUrl: '请求 URL',
      redirected: '重定向',
      respTime: '耗时',
      moveUp: '上移',
      moveDown: '下移',
      noCollection: '还没有集合，先新建一个',
      expand: '展开侧栏',
      collapse: '收起侧栏',
      enterName: '输入名称',
      ok: '确定',
      bytes: 'B',
    }

    var EN = {
      nav: 'Requests', title: 'Request Workbench', subtitle: 'HTTP debugging',
      collections: 'Collections', history: 'History', environments: 'Environments',
      params: 'Params', headers: 'Headers', body: 'Body', auth: 'Auth', settings: 'Settings',
      response: 'Response', send: 'Send', sending: 'Sending…', save: 'Save', cancel: 'Cancel',
      remove: 'Delete', duplicate: 'Duplicate', rename: 'Rename', newRequest: 'New request',
      newFolder: 'New folder', newCollection: 'New collection', newEnvironment: 'New environment',
      importCurl: 'Import cURL', exportCurl: 'Copy as cURL', copy: 'Copy', copied: 'Copied',
      clear: 'Clear', search: 'Search…', emptyCollections: 'No collections yet. Press + to add one.',
      emptyHistory: 'Requests you send appear here.', emptyEnvironments: 'No environments yet.',
      emptyResponse: 'Send a request to see the response here.', noEnvironment: 'No environment',
      key: 'Key', value: 'Value', addRow: 'Add row', bulkEdit: 'Bulk edit',
      bodyNone: 'none', bodyRaw: 'raw', bodyUrlencoded: 'form-urlencoded', bodyFormdata: 'form-data',
      bodyBinary: 'binary', authNone: 'No auth', authBearer: 'Bearer', authBasic: 'Basic',
      authApiKey: 'API Key', authHeader: 'Header', status: 'Status', time: 'Time', size: 'Size',
      respHeaders: 'Headers', respBody: 'Body', pretty: 'Pretty', raw: 'Raw', name: 'Name',
      saveTo: 'Save to', requestName: 'Request name', variable: 'Variable', active: 'Active',
      use: 'Use', resolveHint: '{{variables}} in URL, headers and body resolve from the active environment',
      invalidUrl: 'Enter a URL first', confirmDelete: 'This cannot be undone. Continue?',
      timeout: 'Timeout (ms)', followRedirects: 'Follow redirects', verifyTls: 'Verify TLS',
      maxRedirects: 'Max redirects', truncated: 'Response exceeded 4MB and was truncated',
      curlPlaceholder: 'Paste a curl command…', parse: 'Parse and fill', noName: 'Untitled request',
      unsaved: 'Unsaved', request: 'Request', folder: 'Folder', collection: 'Collection',
      selectOrCreate: 'Choose a collection', createAndSave: 'New collection and save',
      bodyPlaceholder: 'Request body…', headerCommon: 'Common', copiedCurl: 'cURL command copied',
      sendFailed: 'Send failed', reqUrl: 'Request URL', redirected: 'Redirected',
      respTime: 'Time', moveUp: 'Move up', moveDown: 'Move down',
      noCollection: 'No collection yet — create one first', expand: 'Show sidebar',
      collapse: 'Hide sidebar', enterName: 'Enter a name', ok: 'OK', bytes: 'B',
    }

    var dict = ZH
    var translate = null
    function t(key) {
      if (translate !== null) {
        try {
          var value = translate(key)
          if (typeof value === 'string' && value !== '' && value !== key) return value
        } catch (e) {
          /* fall through to the inline dictionary */
        }
      }
      return dict[key] !== undefined ? dict[key] : key
    }

    // ── tiny utilities ─────────────────────────────────────────────────────

    function uid() {
      return Math.random().toString(16).slice(2, 10) + Date.now().toString(16).slice(-6)
    }

    function isObject(v) {
      return typeof v === 'object' && v !== null && !Array.isArray(v)
    }

    function emptyRequest() {
      return {
        method: 'GET',
        url: '',
        params: [],
        headers: [],
        body: {
          mode: 'none',
          raw: '',
          rawLanguage: 'json',
          urlencoded: [],
          formdata: [],
          binaryBase64: '',
          binaryPath: '',
          binaryType: 'application/octet-stream',
        },
        auth: { type: 'none', token: '', username: '', password: '', key: '', value: '', in: 'header' },
        options: { followRedirects: true, verifyTls: true, timeoutMs: 30000, maxRedirects: 10 },
      }
    }

    function newDraft(request, name) {
      return {
        source: null,
        name: name || '',
        request: request ? clone(request) : emptyRequest(),
      }
    }

    function clone(value) {
      try {
        return JSON.parse(JSON.stringify(value))
      } catch (e) {
        return emptyRequest()
      }
    }

    function emptyRow() {
      return { key: '', value: '', enabled: true, description: '' }
    }

    function ensureRows(rows) {
      var list = Array.isArray(rows) ? rows.slice() : []
      if (list.length === 0 || list[list.length - 1].key !== '' || list[list.length - 1].value !== '') {
        list.push(emptyRow())
      }
      return list
    }

    function formatBytes(n) {
      if (!Number.isFinite(n) || n <= 0) return '0 B'
      if (n < 1024) return n + ' B'
      if (n < 1024 * 1024) return (n / 1024).toFixed(1) + ' KB'
      return (n / (1024 * 1024)).toFixed(2) + ' MB'
    }

    function prettyPrint(text, contentType) {
      if (typeof text !== 'string' || text === '') return text
      var ct = String(contentType || '').toLowerCase()
      if (ct.indexOf('json') !== -1 || /^\s*[\[{]/.test(text)) {
        try {
          return JSON.stringify(JSON.parse(text), null, 2)
        } catch (e) {
          /* not JSON after all */
        }
      }
      if (ct.indexOf('xml') !== -1 || ct.indexOf('html') !== -1) {
        var out = ''
        var depth = 0
        var tokens = text.replace(/>\s*</g, '><').split(/(?=<)/)
        for (var i = 0; i < tokens.length; i += 1) {
          var token = tokens[i]
          if (/^<\/[^>]+>/.test(token)) depth = Math.max(0, depth - 1)
          out += '  '.repeat(depth) + token + '\n'
          if (/^<[^\/!?][^>]*>$/.test(token) && token.indexOf('</') === -1) depth += 1
        }
        return out.replace(/\n{3,}/g, '\n\n').trim()
      }
      return text
    }

    function looksLikeImage(contentType) {
      return /^image\/(png|jpe?g|gif|webp|bmp|svg\+xml|x-icon)/i.test(String(contentType || ''))
    }

    function isHtmlContent(contentType) {
      var ct = String(contentType || '').toLowerCase()
      return ct.indexOf('text/html') !== -1 || ct.indexOf('application/xhtml') !== -1
    }

    /**
     * Would the browser refuse to show this response in a frame?
     *
     * Read from the response headers we already have, so the preview can pick
     * its mode on the first render instead of waiting out a timeout and
     * guessing. A guess is inherently wrong on a slow connection: an ordinary
     * page takes longer than the timer and gets called a refusal.
     *
     * Returns false only when a header actually forbids it; anything else —
     * including a header we do not understand — is treated as "try direct".
     */
    function framingForbidden(headers) {
      var list = Array.isArray(headers) ? headers : []
      var xfo = ''
      var csp = ''
      for (var i = 0; i < list.length; i++) {
        var row = list[i]
        if (!row || row.length < 2) continue
        var name = String(row[0] || '').toLowerCase()
        if (name === 'x-frame-options') xfo += ' ' + String(row[1] || '').toLowerCase()
        else if (name === 'content-security-policy') csp += ' ' + String(row[1] || '').toLowerCase()
      }
      if (xfo.indexOf('deny') !== -1 || xfo.indexOf('sameorigin') !== -1) return true
      // `frame-ancestors` lists who may embed this page. `*` allows everyone;
      // `'none'` and any explicit origin list do not include us.
      var match = /frame-ancestors\s+([^;]+)/.exec(csp)
      if (match !== null) {
        var sources = match[1].trim()
        if (sources.indexOf('*') === -1) return true
      }
      return false
    }

    /**
     * Turn a fetched HTML document into a `srcdoc` payload.
     *
     * The reason this exists: a cross-origin `src` iframe is refused by any site
     * that sends `X-Frame-Options` or a CSP `frame-ancestors` directive, and
     * there is no client-side way around that. `srcdoc` is not a cross-origin
     * navigation — the document is handed to the browser directly — so those
     * headers never enter the picture. What `srcdoc` loses is the document's
     * base URL (`about:srcdoc` cannot resolve a relative reference), which is
     * exactly what the injected `<base>` restores.
     *
     * Two other edits matter:
     *   - A CSP `<meta>` in the original would still be enforced inside the
     *     frame and can block the page's own inline scripts, so it is dropped.
     *     (The response's CSP *header* is not copied here, so it never applies.)
     *   - `integrity` attributes are left alone on purpose: the referenced bytes
     *     are fetched unchanged from the original origin, so the hashes still
     *     match. Rewriting a URL would break them, but this function never
     *     rewrites resource URLs — it only supplies the base.
     *
     * @param html - the response body as text.
     * @param pageUrl - absolute URL the response came from (its origin/dir is the base).
     * @returns the srcdoc payload, or '' when the input is not usable HTML.
     */
    function buildSrcdoc(html, pageUrl) {
      if (typeof html !== 'string' || html === '') return ''
      var base = 'about:blank'
      try {
        base = new URL(pageUrl).href
      } catch (e) {
        base = 'about:blank'
      }
      var out = html

      // 1. Drop CSP metas — they would otherwise govern this document too.
      out = out.replace(/<meta\b[^>]*http-equiv\s*=\s*["']?content-security-policy["']?[^>]*>/gi, '')

      // 2. Drop a `sandbox` directive that would strip scripts from our frame.
      out = out.replace(/<meta\b[^>]*http-equiv\s*=\s*["']?origin-trial["']?[^>]*>/gi, '')

      // 3. Insert the base element as early as possible. HTML uses the FIRST
      //    base element, so dropping the original one is required when the page
      //    declared its own (a later base would be ignored anyway, but leaving
      //    it in confuses readers and older UA quirks).
      out = out.replace(/<base\b[^>]*>/gi, '')
      var baseTag = '<base href="' + escapeAttribute(base) + '">'

      if (/<head\b[^>]*>/i.test(out)) {
        out = out.replace(/<head\b[^>]*>/i, function (m) {
          return m + baseTag
        })
      } else if (/<html\b[^>]*>/i.test(out)) {
        out = out.replace(/<html\b[^>]*>/i, function (m) {
          return m + '<head>' + baseTag + '</head>'
        })
      } else if (/<!doctype\b[^>]*>/i.test(out)) {
        out = out.replace(/<!doctype\b[^>]*>/i, function (m) {
          return m + baseTag
        })
      } else {
        out = baseTag + out
      }
      return out
    }

    function escapeAttribute(value) {
      return String(value)
        .replace(/&/g, '&amp;')
        .replace(/"/g, '&quot;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
    }

    function shortUrl(url) {
      if (typeof url !== 'string') return ''
      var text = url.replace(/^https?:\/\//, '')
      return text.length > 64 ? text.slice(0, 61) + '…' : text
    }

    function findNode(collections, id) {
      for (var i = 0; i < collections.length; i += 1) {
        var found = findInItems(collections[i].items, id)
        if (found !== null) return { collection: collections[i], node: found }
      }
      return null
    }

    function findInItems(items, id) {
      if (!Array.isArray(items)) return null
      for (var i = 0; i < items.length; i += 1) {
        var item = items[i]
        if (item.id === id) return item
        if (item.type === 'folder') {
          var deeper = findInItems(item.items, id)
          if (deeper !== null) return deeper
        }
      }
      return null
    }

    function mapItems(items, id, mapper) {
      return (items || []).map(function (item) {
        if (item.id === id) return mapper(item)
        if (item.type === 'folder') return Object.assign({}, item, { items: mapItems(item.items, id, mapper) })
        return item
      })
    }

    function removeFromItems(items, id) {
      var out = []
      for (var i = 0; i < (items || []).length; i += 1) {
        var item = items[i]
        if (item.id === id) continue
        if (item.type === 'folder') out.push(Object.assign({}, item, { items: removeFromItems(item.items, id) }))
        else out.push(item)
      }
      return out
    }

    function appendToItems(items, parentId, node) {
      if (parentId === null || parentId === undefined) return (items || []).concat([node])
      return (items || []).map(function (item) {
        if (item.id === parentId && item.type === 'folder') {
          return Object.assign({}, item, { items: (item.items || []).concat([node]) })
        }
        if (item.type === 'folder') return Object.assign({}, item, { items: appendToItems(item.items, parentId, node) })
        return item
      })
    }

    function buildCurl(request) {
      var parts = ['curl']
      var method = String(request.method || 'GET').toUpperCase()
      var hasBody = request.body && request.body.mode !== 'none'
      if (method !== 'GET' || hasBody) parts.push('-X ' + method)
      var url = String(request.url || '')
      var params = (request.params || []).filter(function (row) {
        return row.enabled && row.key !== ''
      })
      if (params.length > 0) {
        url += (url.indexOf('?') === -1 ? '?' : '&') + params
          .map(function (row) {
            return encodeURIComponent(row.key) + '=' + encodeURIComponent(row.value)
          })
          .join('&')
      }
      parts.push(shellQuote(url || 'https://example.com'))
      ;(request.headers || []).forEach(function (row) {
        if (row.enabled && row.key !== '') parts.push('-H ' + shellQuote(row.key + ': ' + row.value))
      })
      var auth = request.auth || { type: 'none' }
      if (auth.type === 'bearer' && auth.token) parts.push('-H ' + shellQuote('Authorization: Bearer ' + auth.token))
      if (auth.type === 'basic') parts.push('-u ' + shellQuote((auth.username || '') + ':' + (auth.password || '')))
      if (auth.type === 'apikey' && auth.key && auth.in === 'header') parts.push('-H ' + shellQuote(auth.key + ': ' + auth.value))
      if (auth.type === 'header' && auth.key) parts.push('-H ' + shellQuote(auth.key + ': ' + auth.value))
      var body = request.body || {}
      if (body.mode === 'raw' && body.raw) parts.push('--data-raw ' + shellQuote(body.raw))
      if (body.mode === 'urlencoded') {
        ;(body.urlencoded || []).forEach(function (row) {
          if (row.enabled && row.key !== '') parts.push('--data-urlencode ' + shellQuote(row.key + '=' + row.value))
        })
      }
      if (body.mode === 'formdata') {
        ;(body.formdata || []).forEach(function (row) {
          if (row.enabled && row.key !== '') parts.push('-F ' + shellQuote(row.key + '=' + row.value))
        })
      }
      if (request.options && request.options.verifyTls === false) parts.push('-k')
      if (request.options && request.options.followRedirects) parts.push('-L')
      return parts.join(' \\\n  ')
    }

    function shellQuote(text) {
      var value = String(text)
      if (value === '') return "''"
      if (/^[A-Za-z0-9_\-.\/:=@%+]+$/.test(value)) return value
      return "'" + value.replace(/'/g, "'\\''") + "'"
    }

    function copyText(text) {
      try {
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(text)
          return true
        }
      } catch (e) {
        /* fall through */
      }
      try {
        var area = document.createElement('textarea')
        area.value = text
        area.style.position = 'fixed'
        area.style.opacity = '0'
        document.body.appendChild(area)
        area.select()
        document.execCommand('copy')
        document.body.removeChild(area)
        return true
      } catch (e) {
        return false
      }
    }

    async function api(path, init) {
      var options = Object.assign({ headers: { 'content-type': 'application/json' } }, init || {})
      var res = await fetch(API + path, options)
      var data = null
      try {
        data = await res.json()
      } catch (e) {
        data = null
      }
      if (!res.ok) {
        var message = data && data.error ? data.error : 'HTTP ' + res.status
        throw new Error(message)
      }
      return data || {}
    }

    // ── styles ─────────────────────────────────────────────────────────────

    var CSS = [
      '.dshpm-root{display:flex;flex-direction:column;height:100%;min-height:0;background:var(--dsw-alias-bg-base,#fff);color:var(--dsw-alias-label-primary,#1a1a1a);font-size:13px;overflow:hidden}',
      '.dshpm-root *{box-sizing:border-box}',
      '.dshpm-top{flex:none;display:flex;align-items:center;gap:10px;padding:10px 14px;border-bottom:1px solid var(--dsw-alias-border-l1,rgba(128,128,128,.2))}',
      '.dshpm-topTitle{font-size:15px;font-weight:700;margin:0;white-space:nowrap}',
      '.dshpm-topSub{font-size:11.5px;color:var(--dsw-alias-label-tertiary,#8a8a8a)}',
      '.dshpm-topSpacer{flex:1;min-width:0}',
      '.dshpm-body{flex:1;display:flex;min-height:0;overflow:hidden;position:relative}',
      '.dshpm-side{flex:none;width:296px;display:flex;flex-direction:column;border-right:1px solid var(--dsw-alias-border-l1,rgba(128,128,128,.2));min-height:0;background:var(--dsw-alias-bg-layer-1,rgba(128,128,128,.03))}',
      '.dshpm-side[data-hidden]{display:none}',
      '.dshpm-sideMask{position:absolute;inset:0;z-index:19;background:var(--dsw-alias-bg-mask-1,rgba(0,0,0,.28))}',
      '.dshpm-side[data-overlay]{z-index:20}',
      '.dshpm-sideTabs{flex:none;display:flex;gap:2px;padding:6px 8px 0}',
      '.dshpm-sideTab{flex:1;border:0;background:transparent;color:var(--dsw-alias-label-secondary,#666);cursor:pointer;font-size:12px;padding:6px 4px;border-radius:6px 6px 0 0;border-bottom:2px solid transparent;font-family:inherit}',
      '.dshpm-sideTab:hover{color:var(--dsw-alias-label-primary,#1a1a1a);background:var(--dsw-alias-interactive-bg-hover,rgba(128,128,128,.08))}',
      '.dshpm-sideTab[data-on]{color:var(--dsw-alias-label-primary,#1a1a1a);border-bottom-color:var(--dsw-alias-state-business-primary,#3b6ef0);font-weight:600}',
      '.dshpm-sideBar{flex:none;display:flex;align-items:center;gap:6px;padding:8px;border-bottom:1px solid var(--dsw-alias-border-l1,rgba(128,128,128,.16))}',
      '.dshpm-sideList{flex:1;overflow-y:auto;padding:6px 6px 16px;min-height:0}',
      '.dshpm-main{flex:1;display:flex;flex-direction:column;min-width:0;min-height:0}',
      '.dshpm-urlBar{flex:none;display:flex;gap:6px;align-items:center;padding:10px 12px;border-bottom:1px solid var(--dsw-alias-border-l1,rgba(128,128,128,.2))}',
      '.dshpm-method{border:1px solid var(--dsw-alias-border-l2,rgba(128,128,128,.35));border-radius:8px;background:var(--dsw-specific-input-major,rgba(128,128,128,.06));color:var(--dsw-alias-label-primary,#1a1a1a);font-weight:700;font-size:12px;padding:7px 6px;font-family:inherit;cursor:pointer;outline:none;flex:none}',
      '.dshpm-input{flex:1;min-width:0;border:1px solid var(--dsw-alias-border-l2,rgba(128,128,128,.35));border-radius:8px;background:var(--dsw-specific-input-major,rgba(128,128,128,.06));color:var(--dsw-alias-label-primary,#1a1a1a);padding:9px 12px;font-size:13.5px;font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;outline:none}',
      '.dshpm-input:focus{border-color:var(--dsw-alias-state-business-primary,#3b6ef0)}',
      '.dshpm-input::placeholder{color:var(--dsw-alias-label-tertiary,#8a8a8a)}',
      '.dshpm-inputSm{border:1px solid var(--dsw-alias-border-l2,rgba(128,128,128,.35));border-radius:7px;background:var(--dsw-specific-input-major,rgba(128,128,128,.06));color:var(--dsw-alias-label-primary,#1a1a1a);padding:5px 8px;font-size:12px;outline:none;font-family:inherit;width:100%}',
      '.dshpm-inputSm:focus{border-color:var(--dsw-alias-state-business-primary,#3b6ef0)}',
      '.dshpm-send{flex:none;border:0;border-radius:8px;background:var(--dsw-alias-button-info-fill,#3b6ef0);color:var(--dsw-alias-label-primary-foreground,#fff);font-weight:600;font-size:12.5px;padding:8px 16px;cursor:pointer;font-family:inherit;white-space:nowrap}',
      '.dshpm-send:hover:not(:disabled){background:var(--dsw-alias-button-info-hover,#2f5cd8)}',
      '.dshpm-send:disabled{opacity:.55;cursor:default}',
      '.dshpm-btn{border:1px solid var(--dsw-alias-border-l2,rgba(128,128,128,.35));border-radius:7px;background:transparent;color:var(--dsw-alias-label-primary,#1a1a1a);font-size:12px;padding:4px 10px;cursor:pointer;font-family:inherit;white-space:nowrap}',
      '.dshpm-btn:hover:not(:disabled){background:var(--dsw-alias-interactive-bg-hover,rgba(128,128,128,.1))}',
      '.dshpm-btn:disabled{opacity:.45;cursor:default}',
      '.dshpm-btn[data-danger]{color:var(--dsw-alias-state-error-primary,#d93b3b)}',
      '.dshpm-btn[data-primary]{background:var(--dsw-alias-button-info-fill,#3b6ef0);color:var(--dsw-alias-label-primary-foreground,#fff);border-color:transparent;font-weight:600}',
      '.dshpm-icon{border:0;background:transparent;color:var(--dsw-alias-label-secondary,#666);width:24px;height:24px;border-radius:6px;cursor:pointer;font-size:14px;line-height:1;display:inline-flex;align-items:center;justify-content:center;padding:0;font-family:inherit;flex:none}',
      '.dshpm-icon:hover{background:var(--dsw-alias-interactive-bg-hover,rgba(128,128,128,.12));color:var(--dsw-alias-label-primary,#1a1a1a)}',
      '.dshpm-tabs{flex:none;display:flex;gap:2px;padding:0 12px;border-bottom:1px solid var(--dsw-alias-border-l1,rgba(128,128,128,.2));overflow-x:auto}',
      '.dshpm-tab{border:0;background:transparent;color:var(--dsw-alias-label-secondary,#666);cursor:pointer;font-size:12.5px;padding:8px 12px;border-bottom:2px solid transparent;font-family:inherit;white-space:nowrap}',
      '.dshpm-tab:hover{color:var(--dsw-alias-label-primary,#1a1a1a)}',
      '.dshpm-tab[data-on]{color:var(--dsw-alias-label-primary,#1a1a1a);border-bottom-color:var(--dsw-alias-state-business-primary,#3b6ef0);font-weight:600}',
      // `flex:0 1 auto` — take the height the content asks for and nothing
      // more. As `flex:1` it swallowed every spare pixel, so a params pane with
      // one row pushed the response area down to the bottom edge.
      // Desktop has the vertical room for a taller editor; the phone override
      // lives in the 760px block below.
      // Desktop build: the editor gets most of the height, the response pane
      // takes the rest. The phone override (46%) stays in the 760px block.
      '.dshpm-pane{flex:0 1 auto;overflow:auto;min-height:0;max-height:62%;padding:14px 16px}',
      '.dshpm-pane[data-flush]{padding:0}',
      '.dshpm-row{display:grid;grid-template-columns:22px minmax(90px,1fr) minmax(90px,1.4fr) 22px;gap:6px;align-items:center;margin-bottom:5px}',
      '.dshpm-rowHead{display:grid;grid-template-columns:22px minmax(90px,1fr) minmax(90px,1.4fr) 22px;gap:6px;font-size:11px;color:var(--dsw-alias-label-tertiary,#8a8a8a);padding:0 0 6px;font-weight:600}',
      '.dshpm-check{width:14px;height:14px;accent-color:var(--dsw-alias-state-business-primary,#3b6ef0);cursor:pointer;margin:0}',
      '.dshpm-treeRow{display:flex;align-items:center;gap:5px;padding:5px 6px;border-radius:7px;cursor:pointer;user-select:none}',
      '.dshpm-treeRow:hover{background:var(--dsw-alias-interactive-bg-hover,rgba(128,128,128,.1))}',
      '.dshpm-treeRow[data-on]{background:var(--dsw-alias-bg-multi-select,rgba(59,110,240,.14))}',
      '.dshpm-treeName{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:12.5px}',
      '.dshpm-treeMeta{font-size:10px;font-weight:700;color:var(--dsw-alias-label-tertiary,#8a8a8a);flex:none}',
      '.dshpm-treeKids{padding-left:12px;border-left:1px solid var(--dsw-alias-border-l1,rgba(128,128,128,.16));margin-left:8px}',
      '.dshpm-caret{width:14px;flex:none;color:var(--dsw-alias-label-tertiary,#8a8a8a);font-size:9px;text-align:center;transition:transform .12s}',
      '.dshpm-caret[data-open]{transform:rotate(90deg)}',
      '.dshpm-empty{color:var(--dsw-alias-label-tertiary,#8a8a8a);font-size:12px;padding:18px 12px;text-align:center;line-height:1.7}',
      // Fills whatever the request pane leaves, so the preview grows to the
      // bottom edge instead of sitting in a short fixed band. `flex-basis:0`
      // keeps the size independent of the tab's own content — that is what used
      // to make switching tabs jump.
      '.dshpm-resp{flex:1 1 0;min-height:180px;border-top:1px solid var(--dsw-alias-border-l1,rgba(128,128,128,.2));display:flex;flex-direction:column;overflow:hidden}',
      '.dshpm-respBar{flex:none;display:flex;align-items:center;gap:10px;padding:8px 12px;flex-wrap:wrap;border-bottom:1px solid var(--dsw-alias-border-l1,rgba(128,128,128,.16))}',
      // One unbreakable cluster. Wrapping used to depend on how many buttons
      // the tab happened to show, so hiding 原始/复制 for the preview made the
      // bar one row shorter and lifted the content 34px — measured, not guessed.
      '.dshpm-probe{flex:1;overflow:auto;min-height:0;padding:14px 12px;display:flex;flex-direction:column;gap:10px;-webkit-overflow-scrolling:touch}',
      '.dshpm-inputWrap{position:relative;display:flex;min-width:0;flex:1}',
      // Room on the right so text never runs under the clear button.
      '.dshpm-inputWrap .dshpm-input{padding-right:32px}',
      '.dshpm-clearBtn{position:absolute;right:4px;top:50%;transform:translateY(-50%);width:24px;height:24px;border:0;border-radius:50%;background:var(--dsw-alias-interactive-bg-hover,rgba(128,128,128,.16));color:var(--dsw-alias-label-secondary,#666);font-size:16px;line-height:1;cursor:pointer;display:flex;align-items:center;justify-content:center;padding:0;font-family:inherit}',
      '.dshpm-clearBtn:active{background:var(--dsw-alias-interactive-bg-pressed,rgba(128,128,128,.28))}',
      '.dshpm-probeActions{display:flex;align-items:center;gap:8px;margin-top:8px;flex-wrap:wrap}',
      '.dshpm-probeForm{display:flex;flex-direction:column;gap:6px;max-width:640px}',
      '.dshpm-probeLabel{font-size:11.5px;color:var(--dsw-alias-label-secondary,#666);margin-top:4px}',
      '.dshpm-probeTip{font-size:11.5px;color:var(--dsw-alias-label-tertiary,#8a8a8a);line-height:1.6;margin:2px 0 6px}',
      '.dshpm-probeResult{display:flex;flex-direction:column;gap:10px;padding-bottom:16px}',
      '.dshpm-probeVerdict{align-self:flex-start;font-weight:700;font-size:13.5px;padding:4px 12px;border-radius:999px;border:1px solid currentColor}',
      '.dshpm-probeReasons{margin:0;padding-left:18px;display:flex;flex-direction:column;gap:3px;font-size:12px;line-height:1.6;color:var(--dsw-alias-label-secondary,#666)}',
      '.dshpm-probeWarn{font-size:11.5px;color:var(--dsw-alias-state-warn-primary,#c98a12);line-height:1.6;margin:0}',
      '.dshpm-probeRow{border:1px solid var(--dsw-alias-border-l1,rgba(128,128,128,.2));border-radius:10px;padding:8px 10px}',
      '.dshpm-probeRowHead{font-weight:700;font-size:12px;margin-bottom:6px}',
      '.dshpm-probeFields{display:grid;grid-template-columns:max-content 1fr;gap:3px 12px;font-size:11.5px}',
      '.dshpm-probeK{color:var(--dsw-alias-label-tertiary,#8a8a8a);white-space:nowrap}',
      '.dshpm-probeV{color:var(--dsw-alias-label-primary,#1a1a1a);word-break:break-all;font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace}',
      // One unbreakable cluster, so the bar height never depends on how many
      // buttons the active tab shows. Wide screens get it inline at the right;
      // the phone block below makes it claim a full row instead.
      // Sits inline at the right on a wide window; still one unbreakable
      // cluster so the bar height does not change with the active tab.
      '.dshpm-respActions{display:flex;align-items:center;gap:8px;flex-wrap:nowrap;flex:none;margin-left:auto}',
      '.dshpm-stat{font-size:11.5px;color:var(--dsw-alias-label-secondary,#666);white-space:nowrap}',
      '.dshpm-stat b{font-weight:700;color:var(--dsw-alias-label-primary,#1a1a1a)}',
      '.dshpm-status{font-weight:700;font-size:12.5px;padding:1px 8px;border-radius:999px;border:1px solid transparent;white-space:nowrap}',
      '.dshpm-status[data-ok]{color:var(--dsw-alias-state-success-primary,#2f9e63);border-color:var(--dsw-alias-state-success-primary,#2f9e63)}',
      '.dshpm-status[data-bad]{color:var(--dsw-alias-state-error-primary,#d93b3b);border-color:var(--dsw-alias-state-error-primary,#d93b3b)}',
      '.dshpm-pre{margin:0;font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;font-size:11.5px;line-height:1.55;white-space:pre-wrap;word-break:break-word;color:var(--dsw-alias-label-primary,#1a1a1a)}',
      '.dshpm-preWrap{padding:10px 12px;overflow:auto;min-height:0;flex:1}',
      '.dshpm-preview{flex:1;display:flex;flex-direction:column;min-height:0;min-width:0;position:relative;overflow:hidden}',
      // The bar floats over the frame instead of sitting above it, so the preview
      // starts at exactly the same y as the body and headers tabs. A docked bar
      // pushed the frame down by its own height and switching tabs jumped.
      '.dshpm-previewBar{position:absolute;top:8px;right:8px;z-index:2;display:flex;align-items:center;gap:6px;padding:4px 6px;border-radius:10px;background:var(--dsw-alias-bg-elevated,var(--dsw-alias-bg-base,#fff));border:1px solid var(--dsw-alias-border-l2,rgba(128,128,128,.3));box-shadow:var(--dsw-shadow-lv2,0 4px 16px rgba(0,0,0,.12));max-width:calc(100% - 16px);flex-wrap:wrap;pointer-events:none}',
      '.dshpm-previewBar>*{pointer-events:auto}',
      '.dshpm-badge{border:1px solid var(--dsw-alias-state-warn-primary,#c98a12);color:var(--dsw-alias-state-warn-primary,#c98a12);border-radius:999px;padding:1px 8px;font-size:10.5px;white-space:nowrap}',
      '.dshpm-frame{flex:1;width:100%;min-height:0;border:0;background:#fff;display:block}',
      '.dshpm-previewHint{position:absolute;left:50%;top:44%;transform:translate(-50%,-50%);display:flex;align-items:center;gap:8px;background:var(--dsw-alias-bg-base,#fff);border:1px solid var(--dsw-alias-border-l2,rgba(128,128,128,.3));border-radius:10px;padding:8px 14px;font-size:12px;color:var(--dsw-alias-label-secondary,#666);box-shadow:var(--dsw-shadow-lv2,0 4px 16px rgba(0,0,0,.12));pointer-events:none;max-width:86%;text-align:center}',
      '.dshpm-headersGrid{display:grid;grid-template-columns:minmax(120px,max-content) 1fr;gap:4px 14px;font-size:11.5px;font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace}',
      '.dshpm-hName{color:var(--dsw-alias-label-secondary,#666);word-break:break-all}',
      '.dshpm-hVal{color:var(--dsw-alias-label-primary,#1a1a1a);word-break:break-all}',
      '.dshpm-chip{display:inline-flex;align-items:center;gap:4px;border:1px solid var(--dsw-alias-border-l2,rgba(128,128,128,.3));border-radius:999px;padding:1px 8px;font-size:11px;color:var(--dsw-alias-label-secondary,#666);cursor:pointer;background:transparent;font-family:inherit}',
      '.dshpm-chip:hover{background:var(--dsw-alias-interactive-bg-hover,rgba(128,128,128,.1))}',
      '.dshpm-chipRow{display:flex;flex-wrap:wrap;gap:5px;margin-bottom:10px}',
      '.dshpm-field{display:flex;flex-direction:column;gap:4px;margin-bottom:10px}',
      '.dshpm-label{font-size:11.5px;font-weight:600;color:var(--dsw-alias-label-secondary,#666)}',
      '.dshpm-hint{font-size:11px;color:var(--dsw-alias-label-tertiary,#8a8a8a);line-height:1.6}',
      '.dshpm-seg{display:inline-flex;border:1px solid var(--dsw-alias-border-l2,rgba(128,128,128,.3));border-radius:8px;overflow:hidden}',
      '.dshpm-segBtn{border:0;background:transparent;color:var(--dsw-alias-label-secondary,#666);font-size:11.5px;padding:4px 10px;cursor:pointer;font-family:inherit;border-right:1px solid var(--dsw-alias-border-l1,rgba(128,128,128,.2))}',
      '.dshpm-segBtn:last-child{border-right:0}',
      '.dshpm-segBtn[data-on]{background:var(--dsw-alias-button-info-fill,#3b6ef0);color:var(--dsw-alias-label-primary-foreground,#fff);font-weight:600}',
      '.dshpm-textarea{width:100%;min-height:140px;border:1px solid var(--dsw-alias-border-l2,rgba(128,128,128,.35));border-radius:8px;background:var(--dsw-specific-input-major,rgba(128,128,128,.06));color:var(--dsw-alias-label-primary,#1a1a1a);padding:8px 10px;font-size:12px;font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;resize:vertical;outline:none;line-height:1.55}',
      '.dshpm-textarea:focus{border-color:var(--dsw-alias-state-business-primary,#3b6ef0)}',
      '.dshpm-modalMask{position:absolute;inset:0;background:var(--dsw-alias-bg-mask-1,rgba(0,0,0,.35));display:flex;align-items:center;justify-content:center;z-index:30;padding:16px}',
      '.dshpm-modal{background:var(--dsw-alias-bg-base,#fff);border:1px solid var(--dsw-alias-border-l2,rgba(128,128,128,.3));border-radius:12px;box-shadow:var(--dsw-shadow-lv3,0 8px 32px rgba(0,0,0,.24));width:min(520px,100%);max-height:100%;display:flex;flex-direction:column;gap:10px;padding:16px;overflow:auto}',
      '.dshpm-modalTitle{margin:0;font-size:14px;font-weight:700}',
      '.dshpm-modalFoot{display:flex;justify-content:flex-end;gap:8px;margin-top:4px}',
      '.dshpm-notice{flex:none;padding:6px 14px;font-size:11.5px;border-bottom:1px solid var(--dsw-alias-border-l1,rgba(128,128,128,.16));color:var(--dsw-alias-state-error-primary,#d93b3b);background:var(--dsw-alias-bg-layer-2,rgba(128,128,128,.05))}',
      '.dshpm-notice[data-ok]{color:var(--dsw-alias-state-success-primary,#2f9e63)}',
      '.dshpm-spin{display:inline-block;width:11px;height:11px;border:2px solid var(--dsw-alias-state-business-primary,#3b6ef0);border-top-color:transparent;border-radius:50%;animation:dshpmSpin .8s linear infinite;vertical-align:-1px;margin-right:6px}',
      '@keyframes dshpmSpin{to{transform:rotate(360deg)}}',
      '.dshpm-histRow{display:flex;align-items:center;gap:6px;padding:5px 6px;border-radius:7px;cursor:pointer}',
      '.dshpm-histRow:hover{background:var(--dsw-alias-interactive-bg-hover,rgba(128,128,128,.1))}',
      '.dshpm-histUrl{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:11.5px;color:var(--dsw-alias-label-secondary,#666);font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace}',
      '.dshpm-code{font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;font-size:11.5px}',
      '.dshpm-scrollX{overflow-x:auto}',
      '.dshpm-menu{position:absolute;z-index:40;background:var(--dsw-alias-bg-base,#fff);border:1px solid var(--dsw-alias-border-l2,rgba(128,128,128,.3));border-radius:9px;box-shadow:var(--dsw-shadow-lv3,0 8px 24px rgba(0,0,0,.2));padding:4px;display:flex;flex-direction:column;min-width:132px}',
      '.dshpm-menuItem{border:0;background:transparent;text-align:left;color:var(--dsw-alias-label-primary,#1a1a1a);font-size:12px;padding:6px 10px;border-radius:6px;cursor:pointer;font-family:inherit;white-space:nowrap}',
      '.dshpm-menuItem:hover{background:var(--dsw-alias-interactive-bg-hover,rgba(128,128,128,.12))}',
      '.dshpm-menuItem[data-danger]{color:var(--dsw-alias-state-error-primary,#d93b3b)}',
      // Phone refinements. Every target here is touch-sized, because the whole
      // panel is used with a thumb: 16px input text stops iOS from zooming the
      // page on focus, and 44px hit areas stop the "tapped the wrong thing"
      // class of mistake. Desktop keeps its compact metrics.

    ].join('')

    function ensureStyle() {
      var id = 'dsh-postman-desktop/styles'
      if (typeof document === 'undefined') return
      if (document.querySelector('style[data-plugin-css="' + id + '"]') !== null) return
      var tag = document.createElement('style')
      tag.dataset.plugin = 'dsh-postman-desktop'
      tag.dataset.pluginCss = id
      tag.textContent = CSS
      document.head.appendChild(tag)
    }

    // ── small shared components ────────────────────────────────────────────

    function Icon({ path, size }) {
      return h(
        'svg',
        {
          viewBox: '0 0 24 24',
          width: size || 16,
          height: size || 16,
          fill: 'none',
          stroke: 'currentColor',
          strokeWidth: 1.9,
          strokeLinecap: 'round',
          strokeLinejoin: 'round',
          'aria-hidden': true,
          style: { display: 'block' },
        },
        path.map(function (d, i) {
          return h('path', { key: i, d: d })
        }),
      )
    }

    function PanelIcon({ size, active }) {
      return h(
        'svg',
        {
          viewBox: '0 0 24 24',
          width: size || 16,
          height: size || 16,
          'aria-hidden': true,
          style: { display: 'block' },
        },
        h('path', {
          d: 'M4 20 L20 4 L14.5 20 L11.5 13.5 Z',
          fill: 'none',
          stroke: 'currentColor',
          strokeWidth: 1.9,
          strokeLinejoin: 'round',
          strokeLinecap: 'round',
        }),
        h('path', {
          d: 'M11.5 13.5 L16 9',
          fill: 'none',
          stroke: 'currentColor',
          strokeWidth: 1.9,
          strokeLinecap: 'round',
        }),
      )
    }

    function KeyValueEditor({ rows, onChange, keyPlaceholder, valuePlaceholder, addLabel }) {
      var list = ensureRows(rows)
      var update = function (index, patch) {
        var next = list.map(function (row, i) {
          return i === index ? Object.assign({}, row, patch) : row
        })
        onChange(next.filter(function (row, i) {
          return i < next.length - 1 || row.key !== '' || row.value !== ''
        }))
      }
      var remove = function (index) {
        onChange(list.filter(function (_, i) {
          return i !== index
        }))
      }
      return h(
        'div',
        null,
        h(
          'div',
          { className: 'dshpm-rowHead' },
          h('span'),
          h('span', null, t('key')),
          h('span', null, t('value')),
          h('span'),
        ),
        list.map(function (row, index) {
          var isLast = index === list.length - 1
          return h(
            'div',
            { className: 'dshpm-row', key: index },
            h('input', {
              type: 'checkbox',
              className: 'dshpm-check',
              checked: row.enabled !== false,
              disabled: isLast && row.key === '' && row.value === '',
              onChange: function (e) {
                update(index, { enabled: e.target.checked })
              },
              'aria-label': t('use'),
            }),
            h('input', {
              className: 'dshpm-inputSm',
              value: row.key,
              placeholder: keyPlaceholder || t('key'),
              onChange: function (e) {
                update(index, { key: e.target.value })
              },
            }),
            h('input', {
              className: 'dshpm-inputSm',
              value: row.value,
              placeholder: valuePlaceholder || t('value'),
              onChange: function (e) {
                update(index, { value: e.target.value })
              },
            }),
            h(
              'button',
              {
                type: 'button',
                className: 'dshpm-icon',
                title: t('remove'),
                onClick: function () {
                  remove(index)
                },
              },
              '×',
            ),
          )
        }),
        h(
          'button',
          {
            type: 'button',
            className: 'dshpm-btn',
            style: { marginTop: 6 },
            onClick: function () {
              onChange(list.concat([emptyRow()]))
            },
          },
          '+ ' + (addLabel || t('addRow')),
        ),
      )
    }

    // ── request builder ────────────────────────────────────────────────────

    function ParamsPane({ request, update }) {
      return h(
        'div',
        null,
        h(KeyValueEditor, {
          rows: request.params,
          keyPlaceholder: 'key',
          valuePlaceholder: 'value',
          onChange: function (rows) {
            update({ params: rows })
          },
        }),
        h('p', { className: 'dshpm-hint', style: { marginTop: 10 } }, t('resolveHint')),
      )
    }

    var COMMON_HEADERS = ['Content-Type', 'Authorization', 'Accept', 'User-Agent', 'Origin', 'Referer', 'X-Request-Id']

    function HeadersPane({ request, update }) {
      return h(
        'div',
        null,
        h(
          'div',
          { className: 'dshpm-chipRow' },
          COMMON_HEADERS.map(function (name) {
            return h(
              'button',
              {
                key: name,
                type: 'button',
                className: 'dshpm-chip',
                onClick: function () {
                  var exists = (request.headers || []).some(function (row) {
                    return row.key.toLowerCase() === name.toLowerCase()
                  })
                  if (exists) return
                  update({
                    headers: (request.headers || [])
                      .filter(function (row) {
                        return row.key !== '' || row.value !== ''
                      })
                      .concat([{ key: name, value: '', enabled: true, description: '' }]),
                  })
                },
              },
              '+ ' + name,
            )
          }),
        ),
        h(KeyValueEditor, {
          rows: request.headers,
          keyPlaceholder: 'Header',
          valuePlaceholder: 'value',
          onChange: function (rows) {
            update({ headers: rows })
          },
        }),
      )
    }

    var RAW_LANGUAGES = [
      ['json', 'JSON'],
      ['text', 'Text'],
      ['xml', 'XML'],
      ['html', 'HTML'],
      ['javascript', 'JS'],
    ]

    var BODY_MODES = [
      ['none', 'bodyNone'],
      ['raw', 'bodyRaw'],
      ['urlencoded', 'bodyUrlencoded'],
      ['formdata', 'bodyFormdata'],
      ['binary', 'bodyBinary'],
    ]

    function BodyPane({ request, update }) {
      var body = request.body
      var setBody = function (patch) {
        update({ body: Object.assign({}, body, patch) })
      }
      var formatJson = function () {
        try {
          var formatted = JSON.stringify(JSON.parse(body.raw), null, 2)
          setBody({ raw: formatted })
        } catch (e) {
          /* leave the text as typed */
        }
      }
      return h(
        'div',
        null,
        h(
          'div',
          { style: { display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center', marginBottom: 10 } },
          h(
            'div',
            { className: 'dshpm-seg', role: 'tablist' },
            BODY_MODES.map(function (pair) {
              return h(
                'button',
                {
                  key: pair[0],
                  type: 'button',
                  role: 'tab',
                  className: 'dshpm-segBtn',
                  'data-on': body.mode === pair[0] ? '' : undefined,
                  onClick: function () {
                    setBody({ mode: pair[0] })
                  },
                },
                t(pair[1]),
              )
            }),
          ),
          body.mode === 'raw'
            ? h(
                'div',
                { className: 'dshpm-seg' },
                RAW_LANGUAGES.map(function (pair) {
                  return h(
                    'button',
                    {
                      key: pair[0],
                      type: 'button',
                      className: 'dshpm-segBtn',
                      'data-on': body.rawLanguage === pair[0] ? '' : undefined,
                      onClick: function () {
                        setBody({ rawLanguage: pair[0] })
                      },
                    },
                    pair[1],
                  )
                }),
              )
            : null,
          body.mode === 'raw'
            ? h(
                'button',
                { type: 'button', className: 'dshpm-btn', onClick: formatJson },
                t('pretty'),
              )
            : null,
        ),
        body.mode === 'none'
          ? h('p', { className: 'dshpm-hint' }, '这个请求不带正文。')
          : null,
        body.mode === 'raw'
          ? h('textarea', {
              className: 'dshpm-textarea',
              value: body.raw,
              placeholder: t('bodyPlaceholder'),
              spellCheck: false,
              onChange: function (e) {
                setBody({ raw: e.target.value })
              },
            })
          : null,
        body.mode === 'urlencoded'
          ? h(KeyValueEditor, {
              rows: body.urlencoded,
              onChange: function (rows) {
                setBody({ urlencoded: rows })
              },
            })
          : null,
        body.mode === 'formdata'
          ? h(
              'div',
              null,
              h(KeyValueEditor, {
                rows: body.formdata,
                valuePlaceholder: 'value 或 @/path/to/file',
                onChange: function (rows) {
                  setBody({ formdata: rows })
                },
              }),
              h('p', { className: 'dshpm-hint', style: { marginTop: 8 } }, '以 @ 开头的值会被当作本机文件路径上传。'),
            )
          : null,
        body.mode === 'binary'
          ? h(
              'div',
              null,
              h(
                'div',
                { className: 'dshpm-field' },
                h('span', { className: 'dshpm-label' }, '本机文件路径'),
                h('input', {
                  className: 'dshpm-inputSm',
                  value: body.binaryPath,
                  placeholder: '/sdcard/Download/file.bin',
                  onChange: function (e) {
                    setBody({ binaryPath: e.target.value })
                  },
                }),
              ),
              h(
                'div',
                { className: 'dshpm-field' },
                h('span', { className: 'dshpm-label' }, 'Content-Type'),
                h('input', {
                  className: 'dshpm-inputSm',
                  value: body.binaryType,
                  onChange: function (e) {
                    setBody({ binaryType: e.target.value })
                  },
                }),
              ),
              h('p', { className: 'dshpm-hint' }, '文件由 host 侧读取，路径必须在 host 可读的位置。'),
            )
          : null,
      )
    }

    var AUTH_TYPES = [
      ['none', 'authNone'],
      ['bearer', 'authBearer'],
      ['basic', 'authBasic'],
      ['apikey', 'authApiKey'],
      ['header', 'authHeader'],
    ]

    function AuthPane({ request, update }) {
      var auth = request.auth
      var setAuth = function (patch) {
        update({ auth: Object.assign({}, auth, patch) })
      }
      return h(
        'div',
        null,
        h(
          'div',
          { className: 'dshpm-seg', style: { marginBottom: 12, flexWrap: 'wrap' } },
          AUTH_TYPES.map(function (pair) {
            return h(
              'button',
              {
                key: pair[0],
                type: 'button',
                className: 'dshpm-segBtn',
                'data-on': auth.type === pair[0] ? '' : undefined,
                onClick: function () {
                  setAuth({ type: pair[0] })
                },
              },
              t(pair[1]),
            )
          }),
        ),
        auth.type === 'bearer'
          ? h(
              'div',
              { className: 'dshpm-field' },
              h('span', { className: 'dshpm-label' }, 'Token'),
              h('input', {
                className: 'dshpm-inputSm',
                value: auth.token,
                placeholder: '{{token}} 或直接填 token',
                onChange: function (e) {
                  setAuth({ token: e.target.value })
                },
              }),
            )
          : null,
        auth.type === 'basic'
          ? h(
              'div',
              null,
              h(
                'div',
                { className: 'dshpm-field' },
                h('span', { className: 'dshpm-label' }, 'Username'),
                h('input', {
                  className: 'dshpm-inputSm',
                  value: auth.username,
                  onChange: function (e) {
                    setAuth({ username: e.target.value })
                  },
                }),
              ),
              h(
                'div',
                { className: 'dshpm-field' },
                h('span', { className: 'dshpm-label' }, 'Password'),
                h('input', {
                  className: 'dshpm-inputSm',
                  type: 'password',
                  value: auth.password,
                  onChange: function (e) {
                    setAuth({ password: e.target.value })
                  },
                }),
              ),
            )
          : null,
        auth.type === 'apikey'
          ? h(
              'div',
              null,
              h(
                'div',
                { className: 'dshpm-field' },
                h('span', { className: 'dshpm-label' }, 'Key'),
                h('input', {
                  className: 'dshpm-inputSm',
                  value: auth.key,
                  placeholder: 'X-API-Key',
                  onChange: function (e) {
                    setAuth({ key: e.target.value })
                  },
                }),
              ),
              h(
                'div',
                { className: 'dshpm-field' },
                h('span', { className: 'dshpm-label' }, 'Value'),
                h('input', {
                  className: 'dshpm-inputSm',
                  value: auth.value,
                  onChange: function (e) {
                    setAuth({ value: e.target.value })
                  },
                }),
              ),
              h(
                'div',
                { className: 'dshpm-field' },
                h('span', { className: 'dshpm-label' }, '位置'),
                h(
                  'div',
                  { className: 'dshpm-seg' },
                  ['header', 'query'].map(function (where) {
                    return h(
                      'button',
                      {
                        key: where,
                        type: 'button',
                        className: 'dshpm-segBtn',
                        'data-on': auth.in === where ? '' : undefined,
                        onClick: function () {
                          setAuth({ in: where })
                        },
                      },
                      where,
                    )
                  }),
                ),
              ),
            )
          : null,
        auth.type === 'header'
          ? h(
              'div',
              null,
              h(
                'div',
                { className: 'dshpm-field' },
                h('span', { className: 'dshpm-label' }, 'Header'),
                h('input', {
                  className: 'dshpm-inputSm',
                  value: auth.key,
                  placeholder: 'X-Token',
                  onChange: function (e) {
                    setAuth({ key: e.target.value })
                  },
                }),
              ),
              h(
                'div',
                { className: 'dshpm-field' },
                h('span', { className: 'dshpm-label' }, 'Value'),
                h('input', {
                  className: 'dshpm-inputSm',
                  value: auth.value,
                  onChange: function (e) {
                    setAuth({ value: e.target.value })
                  },
                }),
              ),
            )
          : null,
        auth.type === 'none' ? h('p', { className: 'dshpm-hint' }, '不带任何认证信息。') : null,
      )
    }

    function SettingsPane({ request, update }) {
      var options = request.options
      var setOptions = function (patch) {
        update({ options: Object.assign({}, options, patch) })
      }
      return h(
        'div',
        null,
        h(
          'div',
          { className: 'dshpm-field' },
          h('span', { className: 'dshpm-label' }, t('timeout')),
          h('input', {
            className: 'dshpm-inputSm',
            type: 'number',
            min: 1,
            max: 300000,
            value: options.timeoutMs,
            onChange: function (e) {
              var value = parseInt(e.target.value, 10)
              setOptions({ timeoutMs: Number.isFinite(value) && value > 0 ? value : 30000 })
            },
          }),
        ),
        h(
          'div',
          { className: 'dshpm-field' },
          h('span', { className: 'dshpm-label' }, t('maxRedirects')),
          h('input', {
            className: 'dshpm-inputSm',
            type: 'number',
            min: 0,
            max: 20,
            value: options.maxRedirects,
            onChange: function (e) {
              var value = parseInt(e.target.value, 10)
              setOptions({ maxRedirects: Number.isFinite(value) && value >= 0 ? value : 10 })
            },
          }),
        ),
        h(
          'label',
          { style: { display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, cursor: 'pointer' } },
          h('input', {
            type: 'checkbox',
            className: 'dshpm-check',
            checked: options.followRedirects !== false,
            onChange: function (e) {
              setOptions({ followRedirects: e.target.checked })
            },
          }),
          h('span', { style: { fontSize: 12.5 } }, t('followRedirects')),
        ),
        h(
          'label',
          { style: { display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' } },
          h('input', {
            type: 'checkbox',
            className: 'dshpm-check',
            checked: options.verifyTls !== false,
            onChange: function (e) {
              setOptions({ verifyTls: e.target.checked })
            },
          }),
          h('span', { style: { fontSize: 12.5 } }, t('verifyTls')),
        ),
      )
    }

    // ── preview ─────────────────────────────────────────────────────────────

    // Long enough that a normal page on a mobile connection finishes loading,
    // short enough that a refused frame does not feel like a hang. Measured
    // against a cold `example.com` on this device: ~1.0s to the first paint but
    // the `load` event lands well after that, so 2.5s was producing false
    // fallbacks on pages that were never refused at all.
    var PREVIEW_FALLBACK_MS = 4500

    /**
     * Browser preview of a text/html response.
     *
     * Two modes, because neither alone covers the real web:
     *
     *   direct   — an `src` iframe pointed at the original URL. Full fidelity:
     *              the site's own JS runs, links navigate. Refused by any server
     *              sending `X-Frame-Options` or CSP `frame-ancestors`, and there
     *              is no client-side workaround for that.
     *   snapshot — the already-fetched body handed over as `srcdoc`, with a
     *              `<base>` so relative assets still resolve against the real
     *              origin. Immune to those two headers (no cross-origin
     *              navigation happens), but an SPA whose content is built by XHR
     *              arrives as a shell.
     *
     * The direct frame cannot report "I was refused": a blocked frame fires
     * neither a useful `load` nor `error`, and `contentDocument` is unreadable
     * across origins. So the switch is heuristic — no `load` within
     * PREVIEW_FALLBACK_MS means "assume refused, fall back" — and the user can
     * override in either direction with the mode buttons.
     */
    function PreviewPane({ response, requestUrl }) {
      // A header that forbids framing is a fact we can act on immediately; only
      // an unclear site needs the timeout heuristic at all.
      var respRefused = response ? framingForbidden(response.headers) : false
      var [mode, setMode] = useState(respRefused ? 'snapshot' : 'direct')
      var [phase, setPhase] = useState(respRefused ? 'done' : 'loading')
      var [stuck, setStuck] = useState(respRefused ? false : true)
      var [nonce, setNonce] = useState(0)
      var frameKey = useRef(0)
      // Once the user picks a mode by hand, the heuristic stops overriding them:
      // a slow direct frame they asked for stays a direct frame.
      var manual = useRef(false)

      var html = response.bodyEncoding === 'base64' ? '' : String(response.body || '')
      var target = response.finalUrl || requestUrl || ''
      var srcdoc = mode === 'snapshot' ? buildSrcdoc(html, target) : ''

      // A new response resets the preview: mode choice, timeout, reload key.
      useEffect(
        function () {
          frameKey.current += 1
          manual.current = false
          setMode(respRefused ? 'snapshot' : 'direct')
          setPhase(respRefused ? 'done' : 'loading')
          setStuck(!respRefused)
          setNonce(frameKey.current)
        },
        [response],
      )

      // The refusal detector. A `load` that arrives in time flips `stuck` off;
      // the timer only exists while the direct frame has not reported loading.
      useEffect(
        function () {
          if (mode !== 'direct' || phase !== 'loading' || !stuck || manual.current || respRefused) return undefined
          var timer = setTimeout(function () {
            setStuck(false)
            setMode('snapshot')
            setPhase('done')
          }, PREVIEW_FALLBACK_MS)
          return function () {
            clearTimeout(timer)
          }
        },
        [mode, phase, stuck, nonce, respRefused],
      )

      var reload = function () {
        manual.current = mode === 'snapshot'
        frameKey.current += 1
        setNonce(frameKey.current)
        setPhase('loading')
        setStuck(true)
      }

      var pickMode = function (next) {
        manual.current = true
        setMode(next)
        setPhase(next === 'snapshot' ? 'done' : 'loading')
        setStuck(next === 'direct')
        frameKey.current += 1
        setNonce(frameKey.current)
      }

      var openExternal = function () {
        try {
          window.open(target, '_blank', 'noopener,noreferrer')
        } catch (e) {
          /* popup blocked — the URL stays visible in the bar */
        }
      }

      // The tab is only enabled for HTML, but this component states its own
      // contract: a JSON or binary body has nothing to preview as a page.
      var unavailable = html === '' || target === '' || !isHtmlContent(response.contentType)
      // True when the timeout did the switch (as opposed to the user asking for
      // snapshot), so the badge can say why instead of just warning.
      // Two different reasons to be in snapshot mode, and they deserve
      // different wording: a declared refusal is a fact, a timeout is a guess.
      var autoSwitched = mode === 'snapshot' && !manual.current
      var declaredRefusal = autoSwitched && respRefused

      return h(
        'div',
        { className: 'dshpm-preview' },
        h(
          'div',
          { className: 'dshpm-previewBar' },
          h(
            'div',
            { className: 'dshpm-seg' },
            h(
              'button',
              {
                type: 'button',
                className: 'dshpm-segBtn',
                'data-on': mode === 'direct' ? '' : undefined,
                title: '直接用浏览器加载原地址（执行原站脚本）',
                onClick: function () {
                  pickMode('direct')
                },
              },
              '直连',
            ),
            h(
              'button',
              {
                type: 'button',
                className: 'dshpm-segBtn',
                'data-on': mode === 'snapshot' ? '' : undefined,
                title: '用已获取的响应体渲染（不受站点防嵌套限制）',
                onClick: function () {
                  pickMode('snapshot')
                },
              },
              '快照',
            ),
          ),
          // Only an automatic switch needs explaining. When the user picked
          // snapshot themselves they already know why, and a permanent warning
          // badge reads as "something is broken" on a page that renders fine.
          mode === 'snapshot' && autoSwitched
            ? h(
                'span',
                { className: 'dshpm-badge', title: '快照模式用已获取的响应体渲染，原站的运行时脚本不会执行' },
                declaredRefusal ? '该站点禁止嵌入' : '直连超时，已转快照',
              )
            : null,
          h('button', { type: 'button', className: 'dshpm-btn', onClick: reload, disabled: unavailable }, '刷新'),
          h('button', { type: 'button', className: 'dshpm-btn', onClick: openExternal, disabled: unavailable }, '新窗口'),
        ),
        unavailable
          ? h(
              'div',
              { className: 'dshpm-empty' },
              !isHtmlContent(response.contentType)
                ? '这不是 HTML 响应（' + (response.contentType || '未知类型') + '），没有可预览的页面。'
                : '这个响应没有可用的 HTML 正文，无法预览。',
            )
          : mode === 'direct'
            ? h('iframe', {
                key: 'direct-' + nonce,
                className: 'dshpm-frame',
                src: target,
                title: 'preview',
                sandbox: 'allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox',
                referrerPolicy: 'no-referrer',
                onLoad: function () {
                  setPhase('done')
                  setStuck(false)
                },
              })
            : h('iframe', {
                key: 'snapshot-' + nonce,
                className: 'dshpm-frame',
                srcDoc: srcdoc,
                title: 'preview',
                // No `allow-same-origin`: the document came from an untrusted
                // origin, and combined with `allow-scripts` it would let that
                // document reach back into this page's DOM and storage.
                sandbox: 'allow-scripts allow-forms allow-popups',
                referrerPolicy: 'no-referrer',
                onLoad: function () {
                  setPhase('done')
                },
              }),
        !unavailable && mode === 'direct' && phase === 'loading' && stuck
          ? h(
              'div',
              { className: 'dshpm-previewHint' },
              h('span', { className: 'dshpm-spin' }),
              '正在直连加载…若站点拒绝被嵌入，会自动切到快照模式',
            )
          : null,
      )
    }

    // ── response viewer ────────────────────────────────────────────────────

    function ResponseView({ response, sending, onClear, requestUrl }) {
      var [tab, setTab] = useState('body')
      var [pretty, setPretty] = useState(true)
      var canPreview = response !== null && response !== undefined && !response.error && isHtmlContent(response.contentType)
      useEffect(function () {
        setPretty(true)
        setTab('body')
      }, [response])

      if (sending) {
        return h(
          'div',
          { className: 'dshpm-resp' },
          h(
            'div',
            { className: 'dshpm-respBar' },
            h('span', { className: 'dshpm-stat' }, h('span', { className: 'dshpm-spin' }), t('sending')),
          ),
        )
      }
      if (!response) {
        return h(
          'div',
          { className: 'dshpm-resp', style: { maxHeight: 90, minHeight: 90 } },
          h('div', { className: 'dshpm-empty' }, t('emptyResponse')),
        )
      }
      if (response.error) {
        return h(
          'div',
          { className: 'dshpm-resp', style: { maxHeight: '40%' } },
          h(
            'div',
            { className: 'dshpm-respBar' },
            h('span', { className: 'dshpm-status', 'data-bad': '' }, t('sendFailed')),
            h('span', { className: 'dshpm-stat' }, h('b', null, response.ms + ' ms')),
            h('span', { className: 'dshpm-topSpacer', style: { flex: 1 } }),
            h('button', { type: 'button', className: 'dshpm-btn', onClick: onClear }, t('clear')),
          ),
          h('div', { className: 'dshpm-preWrap' }, h('pre', { className: 'dshpm-pre' }, response.error)),
        )
      }

      var contentType = response.contentType || ''
      var bodyText = response.bodyEncoding === 'base64' ? '' : String(response.body || '')
      var shown = pretty ? prettyPrint(bodyText, contentType) : bodyText
      var image = looksLikeImage(contentType) && response.bodyEncoding === 'base64'

      return h(
        'div',
        { className: 'dshpm-resp' },
        h(
          'div',
          { className: 'dshpm-respBar' },
          h(
            'span',
            { className: 'dshpm-status', 'data-ok': response.ok ? '' : undefined, 'data-bad': response.ok ? undefined : '' },
            response.status + (response.statusText ? ' ' + response.statusText : ''),
          ),
          h('span', { className: 'dshpm-stat' }, h('b', null, response.ms + ' ms')),
          h('span', { className: 'dshpm-stat' }, h('b', null, formatBytes(response.size))),
          response.redirected ? h('span', { className: 'dshpm-stat' }, t('redirected') + ' ' + response.redirects) : null,
          h('span', { style: { flex: 1 } }),
          h(
            'div',
            { className: 'dshpm-seg' },
            h(
              'button',
              {
                type: 'button',
                className: 'dshpm-segBtn',
                'data-on': tab === 'body' ? '' : undefined,
                onClick: function () {
                  setTab('body')
                },
              },
              t('respBody'),
            ),
            h(
              'button',
              {
                type: 'button',
                className: 'dshpm-segBtn',
                'data-on': tab === 'headers' ? '' : undefined,
                onClick: function () {
                  setTab('headers')
                },
              },
              t('respHeaders') + ' (' + (response.headers || []).length + ')',
            ),
            h(
              'button',
              {
                type: 'button',
                className: 'dshpm-segBtn',
                'data-on': tab === 'preview' ? '' : undefined,
                disabled: !canPreview,
                title: canPreview ? '在浏览器里预览这个页面' : '只有 text/html 响应能预览',
                onClick: function () {
                  if (canPreview) setTab('preview')
                },
              },
              '预览',
            ),
          ),
          h(
            'div',
            { className: 'dshpm-respActions' },
            tab === 'body'
              ? h(
                  'button',
                  {
                    type: 'button',
                    className: 'dshpm-btn',
                    onClick: function () {
                      setPretty(!pretty)
                    },
                  },
                  pretty ? t('raw') : t('pretty'),
                )
              : null,
            tab === 'preview'
              ? null
              : h(
                  'button',
                  {
                    type: 'button',
                    className: 'dshpm-btn',
                    onClick: function () {
                      copyText(tab === 'body' ? shown : (response.headers || []).map(function (pair) {
                        return pair[0] + ': ' + pair[1]
                      }).join('\n'))
                    },
                  },
                  t('copy'),
                ),
            h('button', { type: 'button', className: 'dshpm-btn', onClick: onClear }, t('clear')),
          ),
        ),
        response.truncated
          ? h('div', { className: 'dshpm-notice' }, t('truncated'))
          : null,
        tab === 'preview'
          ? h(PreviewPane, { response: response, requestUrl: requestUrl })
          : tab === 'headers'
          ? h(
              'div',
              { className: 'dshpm-preWrap' },
              h(
                'div',
                { className: 'dshpm-headersGrid' },
                (response.headers || []).map(function (pair, index) {
                  return h(
                    'div',
                    { key: index, style: { display: 'contents' } },
                    h('span', { className: 'dshpm-hName' }, pair[0]),
                    h('span', { className: 'dshpm-hVal' }, pair[1]),
                  )
                }),
              ),
            )
          : h(
              'div',
              { className: 'dshpm-preWrap' },
              image
                ? h('img', {
                    alt: 'response',
                    src: 'data:' + contentType.split(';')[0] + ';base64,' + response.body,
                    style: { maxWidth: '100%', display: 'block' },
                  })
                : response.bodyEncoding === 'base64'
                  ? h('p', { className: 'dshpm-hint' }, '二进制响应（' + formatBytes(response.size) + '），无法以文本显示。')
                  : h('pre', { className: 'dshpm-pre' }, shown),
            ),
      )
    }

    // ── sidebar tree ───────────────────────────────────────────────────────

    function TreeNode({ node, depth, activeId, onOpen, onMenu, expanded, toggle }) {
      var isFolder = node.type === 'folder'
      var open = expanded[node.id] !== false
      return h(
        'div',
        null,
        h(
          'div',
          {
            className: 'dshpm-treeRow',
            'data-on': activeId === node.id ? '' : undefined,
            style: { paddingLeft: 6 },
            onClick: function () {
              if (isFolder) toggle(node.id)
              else onOpen(node)
            },
            title: node.name,
          },
          isFolder
            ? h('span', { className: 'dshpm-caret', 'data-open': open ? '' : undefined }, '▶')
            : h('span', { className: 'dshpm-treeMeta', style: { width: 14, textAlign: 'center', color: METHOD_COLOR[(node.request && node.request.method) || 'GET'] } }, ((node.request && node.request.method) || 'GET').slice(0, 4)),
          h('span', { className: 'dshpm-treeName' }, node.name || t('noName')),
          h(
            'button',
            {
              type: 'button',
              className: 'dshpm-icon',
              style: { width: 20, height: 20 },
              title: '⋯',
              onClick: function (e) {
                e.stopPropagation()
                onMenu(e, node)
              },
            },
            '⋯',
          ),
        ),
        isFolder && open && (node.items || []).length > 0
          ? h(
              'div',
              { className: 'dshpm-treeKids' },
              node.items.map(function (child) {
                return h(TreeNode, {
                  key: child.id,
                  node: child,
                  depth: depth + 1,
                  activeId: activeId,
                  onOpen: onOpen,
                  onMenu: onMenu,
                  expanded: expanded,
                  toggle: toggle,
                })
              }),
            )
          : null,
      )
    }

    // ── main panel ─────────────────────────────────────────────────────────

    // ── CDN origin probe ───────────────────────────────────────────────────

    // Third-party text that must reach a ref or href gets a scheme check: a
    // `javascript:` URL in a probe result is still a script, and this panel
    // renders values the target server chose.
    function safeHttpUrl(value) {
      if (typeof value !== 'string' || value === '') return ''
      return /^https?:\/\//i.test(value) ? value : ''
    }

    var PROBE_VERDICT_COLOR = {
      alive: 'var(--dsw-alias-state-success-primary,#2f9e63)',
      changed: 'var(--dsw-alias-state-warn-primary,#c98a12)',
      blocked: 'var(--dsw-alias-state-warn-primary,#c98a12)',
      conflict: 'var(--dsw-alias-state-warn-primary,#c98a12)',
      deleted: 'var(--dsw-alias-state-error-primary,#d93b3b)',
      unknown: 'var(--dsw-alias-label-secondary,#666)',
    }

    function ProbeRow({ label, probe }) {
      if (probe === null || probe === undefined) return null
      var bad = !probe.ok
      return h(
        'div',
        { className: 'dshpm-probeRow' },
        h('div', { className: 'dshpm-probeRowHead' }, label),
        h(
          'div',
          { className: 'dshpm-probeFields' },
          h('span', { className: 'dshpm-probeK' }, '状态'),
          h(
            'span',
            { className: 'dshpm-probeV', style: { fontWeight: 700, color: bad ? 'var(--dsw-alias-state-error-primary,#d93b3b)' : 'inherit' } },
            bad ? '连接失败' : String(probe.status),
          ),
          bad
            ? null
            : h('span', { className: 'dshpm-probeK' }, '耗时'),
          bad ? null : h('span', { className: 'dshpm-probeV' }, probe.ms + ' ms'),
          bad ? null : h('span', { className: 'dshpm-probeK' }, '缓存'),
          bad
            ? null
            : h(
                'span',
                { className: 'dshpm-probeV' },
                probe.cacheStatus !== '' ? probe.cacheStatus : probe.age !== null ? 'Age ' + probe.age : '—',
              ),
          bad ? null : h('span', { className: 'dshpm-probeK' }, 'Server'),
          bad ? null : h('span', { className: 'dshpm-probeV' }, probe.server !== '' ? probe.server : '—'),
          bad ? null : h('span', { className: 'dshpm-probeK' }, 'Via'),
          bad ? null : h('span', { className: 'dshpm-probeV' }, probe.viaHeader !== '' ? probe.viaHeader : '（无，说明没走 CDN）'),
          bad ? null : h('span', { className: 'dshpm-probeK' }, 'ETag'),
          bad ? null : h('span', { className: 'dshpm-probeV' }, probe.etag !== '' ? probe.etag : '—'),
          bad ? null : h('span', { className: 'dshpm-probeK' }, '长度'),
          bad ? null : h('span', { className: 'dshpm-probeV' }, probe.contentLength !== null ? String(probe.contentLength) : '—'),
          bad ? null : h('span', { className: 'dshpm-probeK' }, '指纹'),
          bad ? null : h('span', { className: 'dshpm-probeV' }, probe.digest !== '' ? probe.digest : '—'),
          bad ? h('span', { className: 'dshpm-probeK' }, '错误') : null,
          bad ? h('span', { className: 'dshpm-probeV' }, probe.error) : null,
        ),
      )
    }

    /**
     * An input with a one-tap clear button.
     *
     * On a phone, emptying a URL means long-press → select all → delete, and
     * missing the long-press moves the caret instead. A visible × is one tap
     * and needs no precision. The button only exists while there is something
     * to clear, so it never covers an empty field's placeholder.
     */
    function fieldWithClear(value, setValue, placeholder, inputMode, onKeyDown) {
      return h(
        'div',
        { className: 'dshpm-inputWrap' },
        h('input', {
          className: 'dshpm-input',
          value: value,
          placeholder: placeholder,
          spellCheck: false,
          inputMode: inputMode,
          autoCapitalize: 'off',
          autoCorrect: 'off',
          onChange: function (e) {
            setValue(e.target.value)
          },
          onKeyDown: onKeyDown,
        }),
        value !== ''
          ? h(
              'button',
              {
                type: 'button',
                className: 'dshpm-clearBtn',
                title: '清空',
                'aria-label': '清空',
                onClick: function () {
                  setValue('')
                },
              },
              '×',
            )
          : null,
      )
    }

    /**
     * "Is this direct link still on the origin?" — the question a CDN makes
     * hard to answer, because a healthy cached copy and a deleted file look
     * identical from the edge. This panel runs the three reads the host exposes
     * and shows the reasoning, not just a colour.
     */
    function ProbePane() {
      var [url, setUrl] = useState('')
      var [referer, setReferer] = useState('')
      var [originIp, setOriginIp] = useState('')
      var [busy, setBusy] = useState(false)
      var [result, setResult] = useState(null)
      var [error, setError] = useState('')

      var run = useCallback(async function () {
        if (url.trim() === '') {
          setError('请先填入直链 URL')
          return
        }
        setBusy(true)
        setError('')
        setResult(null)
        try {
          var data = await api('/probe', {
            method: 'POST',
            body: JSON.stringify({
              url: url.trim(),
              referer: referer.trim(),
              originIp: originIp.trim(),
            }),
          })
          setResult(data.result)
        } catch (e) {
          setError(e && e.message ? e.message : String(e))
        } finally {
          setBusy(false)
        }
      }, [url, referer, originIp])

      var verdict = result !== null && result.judge ? result.judge : null
      var color = verdict !== null ? PROBE_VERDICT_COLOR[verdict.verdict] || PROBE_VERDICT_COLOR.unknown : 'inherit'

      return h(
        'div',
        { className: 'dshpm-probe' },
        h(
          'div',
          { className: 'dshpm-probeForm' },
          h('label', { className: 'dshpm-probeLabel' }, '直链 URL'),
          fieldWithClear(url, setUrl, 'https://cdn.example.com/path/file.zip', 'url', function (e) {
            if (e.key === 'Enter') run()
          }),
          h('label', { className: 'dshpm-probeLabel' }, 'Referer（防盗链站点必填）'),
          fieldWithClear(referer, setReferer, 'https://example.com/', 'url'),
          h(
            'label',
            { className: 'dshpm-probeLabel' },
            '源站 IP（可选，最可靠）',
          ),
          fieldWithClear(originIp, setOriginIp, '203.0.113.10', 'text'),
          h('p', { className: 'dshpm-probeTip' }, '不填源站 IP 时，只能靠缓存穿透推断；填了就直接问源站，结论最准。'),
          h(
            'div',
            { className: 'dshpm-probeActions' },
            h(
              'button',
              {
                type: 'button',
                className: 'dshpm-send',
                disabled: busy,
                onClick: run,
              },
              busy ? '探测中…' : '开始探测',
            ),
          ),
        ),
        error !== '' ? h('div', { className: 'dshpm-notice' }, error) : null,
        result !== null
          ? h(
              'div',
              { className: 'dshpm-probeResult' },
              h(
                'div',
                { className: 'dshpm-probeVerdict', style: { color: color, borderColor: color } },
                verdict !== null ? verdict.label : '—',
              ),
              result.expiredSignature
                ? h('p', { className: 'dshpm-probeWarn' }, '这个 URL 带签名/过期参数：403 更可能是签名失效，而不是文件被删。')
                : null,
              h(
                'ul',
                { className: 'dshpm-probeReasons' },
                (verdict !== null ? verdict.reasons : []).map(function (line, i) {
                  return h('li', { key: i }, line)
                }),
              ),
              result.originNote !== '' ? h('p', { className: 'dshpm-probeWarn' }, result.originNote) : null,
              h(ProbeRow, { label: '① 首次请求（原始地址）', probe: result.plain }),
              h(ProbeRow, { label: '② 穿透请求（加了 dshcb 参数）', probe: result.busted }),
              result.origin !== null ? h(ProbeRow, { label: '③ 源站直连（跳过 CDN）', probe: result.origin }) : null,
            )
          : null,
      )
    }

    function Workbench() {
      var [store, setStore] = useState(null)
      var [draft, setDraft] = useState(function () {
        return newDraft(null, '')
      })
      var [response, setResponse] = useState(null)
      var [sending, setSending] = useState(false)
      var [tab, setTab] = useState('params')
      var [sideTab, setSideTab] = useState('collections')
      // 'build' is the request builder; 'probe' answers a different question
      // ("is the origin file gone?") and shares only the top bar with it.
      var [mode, setMode] = useState('build')
      var [notice, setNoticeState] = useState(null)
      var noticeTimer = useRef(null)
      var setNotice = useCallback(function (text, ok) {
        if (noticeTimer.current !== null) clearTimeout(noticeTimer.current)
        setNoticeState({ text: text, ok: ok === true })
        noticeTimer.current = setTimeout(function () {
          noticeTimer.current = null
          setNoticeState(null)
        }, ok === true ? 2600 : 6000)
      }, [])
      useEffect(function () {
        return function () {
          if (noticeTimer.current !== null) clearTimeout(noticeTimer.current)
        }
      }, [])
      var [expanded, setExpanded] = useState({})
      // Below 760px the sidebar is an overlay (see the media query in CSS), so
      // it starts collapsed there — otherwise opening the panel would show only
      // the collection tree with the request builder hidden underneath it.
      // Desktop build: no phone-driven sidebar mode. The tree opens whenever the
      // window has room for two columns, and the user toggles it with the «
      // button otherwise. 900px is the point below which the request builder
      // would end up under ~560px wide.
      var [narrow, setNarrow] = useState(false)
      var [sideOpen, setSideOpen] = useState(function () {
        try {
          return (window.innerWidth || 1280) >= 900
        } catch (e) {
          return true
        }
      })
      useEffect(function () {
        var onResize = function () {
          // Widening past the breakpoint opens the tree again; narrowing never
          // forces it shut, so a resize cannot throw away the user's choice.
          if ((window.innerWidth || 1280) >= 900) setSideOpen(true)
        }
        window.addEventListener('resize', onResize)
        return function () {
          window.removeEventListener('resize', onResize)
        }
      }, [])
      var [menu, setMenu] = useState(null)
      var [dialog, setDialog] = useState(null)
      var [search, setSearch] = useState('')
      var saveTimer = useRef(null)
      var latestStore = useRef(null)
      var loadedRef = useRef(false)
      var writtenRef = useRef('')
      var lastSync = useRef('')

      // ---- store load ----

      useEffect(function () {
        var alive = true
        api('/store')
          .then(function (data) {
            if (!alive) return
            latestStore.current = data.store
            writtenRef.current = JSON.stringify(data.store)
            setStore(data.store)
          })
          .catch(function (error) {
            if (!alive) return
            setNotice(error.message)
          })
        return function () {
          alive = false
        }
      }, [])

      // Every store change is written back, debounced. The first pass after the
      // initial load is skipped so reading the store does not rewrite it.
      useEffect(
        function () {
          if (store === null) return
          latestStore.current = store
          if (!loadedRef.current) {
            loadedRef.current = true
            return undefined
          }
          if (saveTimer.current !== null) clearTimeout(saveTimer.current)
          saveTimer.current = setTimeout(function () {
            saveTimer.current = null
            var payload = latestStore.current
            if (payload === null) return
            var serialized = JSON.stringify(payload)
            // A store the host just returned (e.g. after a send) is already on
            // disk; writing it back would be pure noise.
            if (serialized === writtenRef.current) return
            writtenRef.current = serialized
            api('/store', { method: 'PUT', body: JSON.stringify({ store: payload }) }).catch(function (error) {
              setNotice(error.message)
            })
          }, 450)
          return undefined
        },
        [store],
      )

      // Flush a pending write when the panel unmounts.
      useEffect(function () {
        return function () {
          if (saveTimer.current !== null) clearTimeout(saveTimer.current)
          var payload = latestStore.current
          if (payload === null || !loadedRef.current) return
          api('/store', { method: 'PUT', body: JSON.stringify({ store: payload }) }).catch(function () {})
        }
      }, [])

      var persist = useCallback(function (nextStore) {
        latestStore.current = nextStore
        setStore(nextStore)
      }, [])

      // Push any pending edit to the host right now. The send path needs this:
      // the host resolves {{variables}} from ITS copy of the store, so a
      // debounced environment edit that has not landed yet would resolve against
      // stale values.
      var flushNow = useCallback(async function () {
        if (saveTimer.current !== null) {
          clearTimeout(saveTimer.current)
          saveTimer.current = null
        }
        var payload = latestStore.current
        if (payload === null || !loadedRef.current) return
        var serialized = JSON.stringify(payload)
        if (serialized === writtenRef.current) return
        writtenRef.current = serialized
        await api('/store', { method: 'PUT', body: JSON.stringify({ store: payload }) })
      }, [])

      // ---- draft editing ----

      var updateRequest = useCallback(function (patch) {
        setDraft(function (prev) {
          return Object.assign({}, prev, { request: Object.assign({}, prev.request, patch) })
        })
      }, [])

      // A draft opened from a collection writes its request back into that
      // node, so edits survive switching between requests.
      useEffect(
        function () {
          if (draft.source === null) return
          var key = draft.source.nodeId + '|' + (draft.name || '') + '|' + JSON.stringify(draft.request)
          if (lastSync.current === key) return
          lastSync.current = key
          var source = draft.source
          var request = draft.request
          var name = draft.name
          setStore(function (current) {
            if (current === null) return current
            return Object.assign({}, current, {
              collections: current.collections.map(function (collection) {
                if (collection.id !== source.collectionId) return collection
                return Object.assign({}, collection, {
                  items: mapItems(collection.items, source.nodeId, function (node) {
                    return Object.assign({}, node, {
                      request: request,
                      name: name || node.name,
                    })
                  }),
                })
              }),
            })
          })
        },
        [draft],
      )

      var openNode = useCallback(
        function (collection, node) {
          if (node.type !== 'request') return
          // The draft effect below writes back only while a node is open, so a
          // node being left must be committed by that effect before the switch.
          lastSync.current = node.id + '|' + node.name + '|' + JSON.stringify(node.request)
          setDraft({
            source: { collectionId: collection.id, nodeId: node.id },
            name: node.name,
            request: clone(node.request),
          })
          setResponse(null)
          if (narrow) setSideOpen(false)
        },
        [narrow],
      )

      // ---- send ----

      var send = useCallback(async function () {
        if (draft.request.url.trim() === '') {
          setNotice(t('invalidUrl'))
          return
        }
        setSending(true)
        setNoticeState(null)
        try {
          await flushNow()
          var data = await api('/send', {
            method: 'POST',
            body: JSON.stringify({
              request: draft.request,
              environmentId: store && store.activeEnvironmentId ? store.activeEnvironmentId : undefined,
            }),
          })
          setResponse(data.result)
          // Only the host's history is adopted: replacing the whole store would
          // discard edits the debounced write has not flushed yet.
          if (data.store && Array.isArray(data.store.history)) {
            setStore(function (current) {
              if (current === null) return current
              return Object.assign({}, current, { history: data.store.history })
            })
          }
        } catch (error) {
          setResponse({ error: error.message, ms: 0 })
        } finally {
          setSending(false)
        }
      }, [draft, store, flushNow])

      // Cmd/Ctrl + Enter sends.
      useEffect(
        function () {
          var handler = function (event) {
            if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') {
              event.preventDefault()
              send()
            }
          }
          window.addEventListener('keydown', handler)
          return function () {
            window.removeEventListener('keydown', handler)
          }
        },
        [send],
      )

      // ---- collection mutations ----

      var addCollection = function () {
        setDialog({
          kind: 'name',
          title: t('newCollection'),
          value: '',
          onConfirm: function (name) {
            var collection = { id: uid(), name: name || t('collection'), items: [] }
            persist(Object.assign({}, store, { collections: store.collections.concat([collection]) }))
            setExpanded(Object.assign({}, expanded, { [collection.id]: true }))
            setDialog(null)
          },
        })
      }

      var addToCollection = function (collectionId, parentId, node) {
        persist({
          ...store,
          collections: store.collections.map(function (collection) {
            if (collection.id !== collectionId) return collection
            return Object.assign({}, collection, { items: appendToItems(collection.items, parentId, node) })
          }),
        })
      }

      var saveDraftToCollection = function (collectionId) {
        var node = {
          id: uid(),
          type: 'request',
          name: draft.name || draft.request.url || t('noName'),
          request: clone(draft.request),
        }
        addToCollection(collectionId, null, node)
        setDraft({ source: { collectionId: collectionId, nodeId: node.id }, name: node.name, request: clone(node.request) })
        setNotice(t('save'), true)
      }

      var openMenu = function (event, node, collectionId) {
        event.stopPropagation()
        var rect = event.currentTarget.getBoundingClientRect()
        setMenu({
          x: rect.left,
          y: rect.bottom + 4,
          node: node,
          collectionId: collectionId,
        })
      }

      var removeNode = function (collectionId, nodeId) {
        persist({
          ...store,
          collections: store.collections.map(function (collection) {
            if (collection.id !== collectionId) return collection
            return Object.assign({}, collection, { items: removeFromItems(collection.items, nodeId) })
          }),
        })
        if (draft.source !== null && draft.source.nodeId === nodeId) setDraft(newDraft(null, ''))
      }

      var renameNode = function (collectionId, nodeId, name) {
        persist({
          ...store,
          collections: store.collections.map(function (collection) {
            if (collection.id !== collectionId) return collection
            return Object.assign({}, collection, {
              items: mapItems(collection.items, nodeId, function (node) {
                return Object.assign({}, node, { name: name })
              }),
            })
          }),
        })
      }

      var duplicateNode = function (collectionId, node) {
        var copy = clone(node)
        copy.id = uid()
        copy.name = node.name + ' 副本'
        if (copy.type === 'folder' && Array.isArray(copy.items)) {
          copy.items = copy.items.map(function (child) {
            return Object.assign({}, child, { id: uid() })
          })
        }
        addToCollection(collectionId, null, copy)
      }

      // ---- render ----

      if (store === null) {
        return h(
          'div',
          { className: 'dshpm-root' },
          h(
            'div',
            { className: 'dshpm-top' },
            h('h2', { className: 'dshpm-topTitle' }, t('title')),
          ),
          h(
            'div',
            { style: { flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' } },
            h('span', { className: 'dshpm-stat' }, h('span', { className: 'dshpm-spin' }), '加载中…'),
          ),
        )
      }

      var activeEnvironment = (store.environments || []).find(function (env) {
        return env.id === store.activeEnvironmentId
      })
      var filteredCollections = store.collections
      if (search.trim() !== '') {
        var needle = search.trim().toLowerCase()
        filteredCollections = store.collections.filter(function (collection) {
          if (collection.name.toLowerCase().indexOf(needle) !== -1) return true
          var walk = function (items) {
            return (items || []).some(function (item) {
              if ((item.name || '').toLowerCase().indexOf(needle) !== -1) return true
              return item.type === 'folder' ? walk(item.items) : false
            })
          }
          return walk(collection.items)
        })
      }

      var tabs = [
        ['params', 'params'],
        ['headers', 'headers'],
        ['body', 'body'],
        ['auth', 'auth'],
        ['settings', 'settings'],
      ]

      return h(
        'div',
        { className: 'dshpm-root', style: { position: 'relative' } },
        h(
          'div',
          { className: 'dshpm-top' },
          h('button', {
            type: 'button',
            className: 'dshpm-icon',
            title: sideOpen ? t('collapse') : t('expand'),
            onClick: function () {
              setSideOpen(!sideOpen)
            },
          }, sideOpen ? '«' : '»'),
          h('h2', { className: 'dshpm-topTitle' }, t('title')),
          h('span', { className: 'dshpm-topSub' }, t('subtitle')),
          h('span', { className: 'dshpm-topSpacer' }),
          h(
            'div',
            { className: 'dshpm-seg' },
            h(
              'button',
              {
                type: 'button',
                className: 'dshpm-segBtn',
                'data-on': mode === 'build' ? '' : undefined,
                onClick: function () {
                  setMode('build')
                },
              },
              '发包',
            ),
            h(
              'button',
              {
                type: 'button',
                className: 'dshpm-segBtn',
                'data-on': mode === 'probe' ? '' : undefined,
                title: '检查直链在源站是否还存在（穿透 CDN 缓存）',
                onClick: function () {
                  setMode('probe')
                },
              },
              'CDN 探测',
            ),
          ),
          mode === 'build' && activeEnvironment !== undefined
            ? h('span', { className: 'dshpm-chip' }, activeEnvironment.name)
            : null,
          mode === 'build' && activeEnvironment === undefined
            ? h('span', { className: 'dshpm-hint' }, t('noEnvironment'))
            : null,
          mode === 'build'
            ? h(
                'button',
                {
                  type: 'button',
                  className: 'dshpm-btn',
                  onClick: function () {
                    setDialog({ kind: 'curl', value: '' })
                  },
                },
                t('importCurl'),
              )
            : null,
          mode === 'build'
            ? h(
                'button',
                {
                  type: 'button',
                  className: 'dshpm-btn',
                  onClick: function () {
                    copyText(buildCurl(draft.request))
                    setNotice(t('copiedCurl'), true)
                  },
                },
                t('exportCurl'),
              )
            : null,
        ),
        notice !== null
          ? h(
              'div',
              { className: 'dshpm-notice', 'data-ok': notice.ok ? '' : undefined, role: 'status' },
              notice.text,
              h(
                'button',
                {
                  type: 'button',
                  className: 'dshpm-icon',
                  style: { float: 'right', width: 18, height: 18 },
                  onClick: function () {
                    setNoticeState(null)
                  },
                },
                '×',
              ),
            )
          : null,
        mode === 'probe' ? h(ProbePane, null) : null,
        mode === 'probe' ? null : h(
          'div',
          { className: 'dshpm-body' },
          narrow && sideOpen
            ? h('div', {
                className: 'dshpm-sideMask',
                onClick: function () {
                  setSideOpen(false)
                },
              })
            : null,
          h(
            'div',
            { className: 'dshpm-side', 'data-hidden': sideOpen ? undefined : '', 'data-overlay': narrow ? '' : undefined },
            h(
              'div',
              { className: 'dshpm-sideTabs' },
              [['collections', 'collections'], ['history', 'history'], ['environments', 'environments']].map(function (pair) {
                return h(
                  'button',
                  {
                    key: pair[0],
                    type: 'button',
                    className: 'dshpm-sideTab',
                    'data-on': sideTab === pair[0] ? '' : undefined,
                    onClick: function () {
                      setSideTab(pair[0])
                    },
                  },
                  t(pair[1]),
                )
              }),
            ),
            sideTab === 'collections'
              ? h(
                  'div',
                  { className: 'dshpm-sideBar' },
                  h('input', {
                    className: 'dshpm-inputSm',
                    placeholder: t('search'),
                    value: search,
                    onChange: function (e) {
                      setSearch(e.target.value)
                    },
                  }),
                  h(
                    'button',
                    {
                      type: 'button',
                      className: 'dshpm-icon',
                      title: t('newCollection'),
                      onClick: addCollection,
                    },
                    '+',
                  ),
                )
              : null,
            h(
              'div',
              { className: 'dshpm-sideList' },
              sideTab === 'collections'
                ? filteredCollections.length === 0
                  ? h('div', { className: 'dshpm-empty' }, t('emptyCollections'))
                  : filteredCollections.map(function (collection) {
                      var open = expanded[collection.id] !== false
                      return h(
                        'div',
                        { key: collection.id, style: { marginBottom: 6 } },
                        h(
                          'div',
                          { className: 'dshpm-treeRow' },
                          h(
                            'span',
                            {
                              className: 'dshpm-caret',
                              'data-open': open ? '' : undefined,
                              onClick: function (e) {
                                e.stopPropagation()
                                setExpanded(Object.assign({}, expanded, { [collection.id]: !open }))
                              },
                            },
                            '▶',
                          ),
                          h(
                            'span',
                            {
                              className: 'dshpm-treeName',
                              style: { fontWeight: 600 },
                              onClick: function () {
                                setExpanded(Object.assign({}, expanded, { [collection.id]: !open }))
                              },
                            },
                            collection.name,
                          ),
                          h(
                            'button',
                            {
                              type: 'button',
                              className: 'dshpm-icon',
                              title: t('newRequest'),
                              onClick: function () {
                                setDialog({
                                  kind: 'name',
                                  title: t('newRequest'),
                                  value: '',
                                  onConfirm: function (name) {
                                    var node = { id: uid(), type: 'request', name: name || t('noName'), request: emptyRequest() }
                                    addToCollection(collection.id, null, node)
                                    setDialog(null)
                                  },
                                })
                              },
                            },
                            '+',
                          ),
                          h(
                            'button',
                            {
                              type: 'button',
                              className: 'dshpm-icon',
                              title: '⋯',
                              onClick: function (e) {
                                openMenu(e, { id: collection.id, type: 'collection', name: collection.name }, collection.id)
                              },
                            },
                            '⋯',
                          ),
                        ),
                        open && (collection.items || []).length > 0
                          ? h(
                              'div',
                              { className: 'dshpm-treeKids' },
                              collection.items.map(function (child) {
                                return h(TreeNode, {
                                  key: child.id,
                                  node: child,
                                  depth: 0,
                                  activeId: draft.source !== null ? draft.source.nodeId : null,
                                  onOpen: function (node) {
                                    openNode(collection, node)
                                  },
                                  onMenu: function (e, node) {
                                    openMenu(e, node, collection.id)
                                  },
                                  expanded: expanded,
                                  toggle: function (id) {
                                    setExpanded(Object.assign({}, expanded, { [id]: expanded[id] === false }))
                                  },
                                })
                              }),
                            )
                          : null,
                      )
                    })
                : null,
              sideTab === 'history'
                ? (store.history || []).length === 0
                  ? h('div', { className: 'dshpm-empty' }, t('emptyHistory'))
                  : h(
                      'div',
                      null,
                      h(
                        'div',
                        { style: { display: 'flex', justifyContent: 'flex-end', padding: '0 2px 6px' } },
                        h(
                          'button',
                          {
                            type: 'button',
                            className: 'dshpm-btn',
                            onClick: function () {
                              persist(Object.assign({}, store, { history: [] }))
                            },
                          },
                          t('clear'),
                        ),
                      ),
                      store.history.map(function (row) {
                        return h(
                          'div',
                          {
                            key: row.id,
                            className: 'dshpm-histRow',
                            onClick: function () {
                              if (row.request) {
                                setDraft(newDraft(row.request, row.name || ''))
                                setResponse(null)
                              }
                            },
                            title: row.url,
                          },
                          h(
                            'span',
                            {
                              className: 'dshpm-treeMeta',
                              style: { color: METHOD_COLOR[row.method] || 'inherit', width: 30 },
                            },
                            row.method.slice(0, 4),
                          ),
                          h('span', { className: 'dshpm-histUrl' }, shortUrl(row.url)),
                          h(
                            'span',
                            {
                              className: 'dshpm-treeMeta',
                              style: { color: row.ok ? 'var(--dsw-alias-state-success-primary,#2f9e63)' : 'var(--dsw-alias-state-error-primary,#d93b3b)' },
                            },
                            String(row.status || '—'),
                          ),
                        )
                      }),
                    )
                : null,
              sideTab === 'environments'
                ? h(
                    'div',
                    null,
                    h(
                      'div',
                      { style: { display: 'flex', justifyContent: 'flex-end', padding: '0 2px 8px' } },
                      h(
                        'button',
                        {
                          type: 'button',
                          className: 'dshpm-btn',
                          onClick: function () {
                            setDialog({
                              kind: 'name',
                              title: t('newEnvironment'),
                              value: '',
                              onConfirm: function (name) {
                                var env = { id: uid(), name: name || '环境', variables: [] }
                                persist(
                                  Object.assign({}, store, {
                                    environments: store.environments.concat([env]),
                                    activeEnvironmentId: store.activeEnvironmentId || env.id,
                                  }),
                                )
                                setDialog(null)
                              },
                            })
                          },
                        },
                        '+ ' + t('newEnvironment'),
                      ),
                    ),
                    (store.environments || []).length === 0
                      ? h('div', { className: 'dshpm-empty' }, t('emptyEnvironments'))
                      : store.environments.map(function (env) {
                          var active = store.activeEnvironmentId === env.id
                          return h(
                            'div',
                            { key: env.id, style: { marginBottom: 12 } },
                            h(
                              'div',
                              { style: { display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 } },
                              h(
                                'button',
                                {
                                  type: 'button',
                                  className: 'dshpm-icon',
                                  title: t('use'),
                                  style: { color: active ? 'var(--dsw-alias-state-success-primary,#2f9e63)' : 'inherit' },
                                  onClick: function () {
                                    persist(Object.assign({}, store, { activeEnvironmentId: active ? null : env.id }))
                                  },
                                },
                                active ? '●' : '○',
                              ),
                              h('span', { className: 'dshpm-treeName', style: { fontWeight: 600 } }, env.name),
                              h(
                                'button',
                                {
                                  type: 'button',
                                  className: 'dshpm-icon',
                                  title: t('remove'),
                                  onClick: function () {
                                    persist(
                                      Object.assign({}, store, {
                                        environments: store.environments.filter(function (item) {
                                          return item.id !== env.id
                                        }),
                                        activeEnvironmentId: active ? null : store.activeEnvironmentId,
                                      }),
                                    )
                                  },
                                },
                                '×',
                              ),
                            ),
                            h(KeyValueEditor, {
                              rows: env.variables,
                              keyPlaceholder: t('variable'),
                              onChange: function (rows) {
                                persist({
                                  ...store,
                                  environments: store.environments.map(function (item) {
                                    return item.id === env.id ? Object.assign({}, item, { variables: rows }) : item
                                  }),
                                })
                              },
                            }),
                          )
                        }),
                  )
                : null,
            ),
          ),
          h(
            'div',
            { className: 'dshpm-main' },
            h(
              'div',
              { className: 'dshpm-urlBar' },
              h(
                'select',
                {
                  className: 'dshpm-method',
                  value: draft.request.method,
                  style: { color: METHOD_COLOR[draft.request.method] || 'inherit' },
                  onChange: function (e) {
                    updateRequest({ method: e.target.value })
                  },
                },
                METHODS.map(function (method) {
                  return h('option', { key: method, value: method }, method)
                }),
              ),
              h(
                'div',
                { className: 'dshpm-inputWrap' },
                h('input', {
                  className: 'dshpm-input',
                  value: draft.request.url,
                  placeholder: 'https://api.example.com/v1/users',
                  spellCheck: false,
                  inputMode: 'url',
                  autoCapitalize: 'off',
                  autoCorrect: 'off',
                  onChange: function (e) {
                    updateRequest({ url: e.target.value })
                  },
                  onKeyDown: function (e) {
                    if (e.key === 'Enter') send()
                  },
                }),
                // Selecting a whole URL on a phone means long-press, drag the
                // handles, then delete — three fiddly gestures. This is one tap.
                draft.request.url !== ''
                  ? h(
                      'button',
                      {
                        type: 'button',
                        className: 'dshpm-clearBtn',
                        title: '清空',
                        'aria-label': '清空 URL',
                        onClick: function () {
                          updateRequest({ url: '' })
                        },
                      },
                      '×',
                    )
                  : null,
              ),
              h(
                'button',
                {
                  type: 'button',
                  className: 'dshpm-send',
                  disabled: sending,
                  onClick: send,
                },
                sending ? t('sending') : t('send'),
              ),
            ),
            h(
              'div',
              { className: 'dshpm-tabs' },
              tabs.map(function (pair) {
                return h(
                  'button',
                  {
                    key: pair[0],
                    type: 'button',
                    className: 'dshpm-tab',
                    'data-on': tab === pair[0] ? '' : undefined,
                    onClick: function () {
                      setTab(pair[0])
                    },
                  },
                  t(pair[1]),
                )
              }),
              h('span', { style: { flex: 1 } }),
              draft.source === null
                ? h(
                    'button',
                    {
                      type: 'button',
                      className: 'dshpm-btn',
                      style: { margin: '4px 0' },
                      onClick: function () {
                        if (store.collections.length === 0) {
                          setNotice(t('noCollection'))
                          return
                        }
                        setDialog({
                          kind: 'choose',
                          title: t('saveTo'),
                          collections: store.collections,
                          onPick: function (collectionId) {
                            saveDraftToCollection(collectionId)
                            setDialog(null)
                          },
                          onCreate: function (name) {
                            var collection = { id: uid(), name: name || t('collection'), items: [] }
                            var next = Object.assign({}, store, { collections: store.collections.concat([collection]) })
                            persist(next)
                            var node = {
                              id: uid(),
                              type: 'request',
                              name: draft.name || draft.request.url || t('noName'),
                              request: clone(draft.request),
                            }
                            persist({
                              ...next,
                              collections: next.collections.map(function (item) {
                                return item.id === collection.id ? Object.assign({}, item, { items: [node] }) : item
                              }),
                            })
                            setDraft({ source: { collectionId: collection.id, nodeId: node.id }, name: node.name, request: clone(node.request) })
                            setDialog(null)
                          },
                        })
                      },
                    },
                    t('save'),
                  )
                : h('span', { className: 'dshpm-hint', style: { alignSelf: 'center', margin: '0 8px' } }, draft.name || t('noName')),
            ),
            h(
              'div',
              { className: 'dshpm-pane' },
              tab === 'params' ? h(ParamsPane, { request: draft.request, update: updateRequest }) : null,
              tab === 'headers' ? h(HeadersPane, { request: draft.request, update: updateRequest }) : null,
              tab === 'body' ? h(BodyPane, { request: draft.request, update: updateRequest }) : null,
              tab === 'auth' ? h(AuthPane, { request: draft.request, update: updateRequest }) : null,
              tab === 'settings' ? h(SettingsPane, { request: draft.request, update: updateRequest }) : null,
            ),
            h(ResponseView, {
              response: response,
              sending: sending,
              requestUrl: draft.request.url,
              onClear: function () {
                setResponse(null)
              },
            }),
          ),
        ),
        menu !== null
          ? h(
              'div',
              { style: { position: 'fixed', inset: 0, zIndex: 35 } , onClick: function () { setMenu(null) } },
              h(
                'div',
                {
                  className: 'dshpm-menu',
                  style: { left: Math.min(menu.x, (window.innerWidth || 360) - 150), top: Math.min(menu.y, (window.innerHeight || 600) - 180) },
                  onClick: function (e) {
                    e.stopPropagation()
                  },
                },
                menu.node.type === 'collection'
                  ? h(
                      'button',
                      {
                        type: 'button',
                        className: 'dshpm-menuItem',
                        onClick: function () {
                          setDialog({
                            kind: 'name',
                            title: t('rename'),
                            value: menu.node.name,
                            onConfirm: function (name) {
                              persist({
                                ...store,
                                collections: store.collections.map(function (item) {
                                  return item.id === menu.node.id ? Object.assign({}, item, { name: name }) : item
                                }),
                              })
                              setDialog(null)
                              setMenu(null)
                            },
                          })
                        },
                      },
                      t('rename'),
                    )
                  : h(
                      'button',
                      {
                        type: 'button',
                        className: 'dshpm-menuItem',
                        onClick: function () {
                          setDialog({
                            kind: 'name',
                            title: t('rename'),
                            value: menu.node.name,
                            onConfirm: function (name) {
                              renameNode(menu.collectionId, menu.node.id, name)
                              if (draft.source !== null && draft.source.nodeId === menu.node.id) {
                                setDraft(Object.assign({}, draft, { name: name }))
                              }
                              setDialog(null)
                              setMenu(null)
                            },
                          })
                        },
                      },
                      t('rename'),
                    ),
                menu.node.type !== 'collection'
                  ? h(
                      'button',
                      {
                        type: 'button',
                        className: 'dshpm-menuItem',
                        onClick: function () {
                          duplicateNode(menu.collectionId, menu.node)
                          setMenu(null)
                        },
                      },
                      t('duplicate'),
                    )
                  : null,
                menu.node.type === 'request'
                  ? h(
                      'button',
                      {
                        type: 'button',
                        className: 'dshpm-menuItem',
                        onClick: function () {
                          copyText(buildCurl(menu.node.request || emptyRequest()))
                          setNotice(t('copiedCurl'), true)
                          setMenu(null)
                        },
                      },
                      t('exportCurl'),
                    )
                  : null,
                h(
                  'button',
                  {
                    type: 'button',
                    className: 'dshpm-menuItem',
                    'data-danger': '',
                    onClick: function () {
                      if (menu.node.type === 'collection') {
                        persist({
                          ...store,
                          collections: store.collections.filter(function (item) {
                            return item.id !== menu.node.id
                          }),
                        })
                      } else {
                        removeNode(menu.collectionId, menu.node.id)
                      }
                      setMenu(null)
                    },
                  },
                  t('remove'),
                ),
              ),
            )
          : null,
        dialog !== null
          ? dialog.kind === 'name'
            ? h(NameDialog, {
                title: dialog.title,
                initial: dialog.value || '',
                onCancel: function () {
                  setDialog(null)
                },
                onConfirm: function (name) {
                  dialog.onConfirm(name)
                },
              })
            : dialog.kind === 'choose'
              ? h(ChooseDialog, {
                  title: dialog.title,
                  collections: dialog.collections,
                  onCancel: function () {
                    setDialog(null)
                  },
                  onPick: function (collectionId) {
                    dialog.onPick(collectionId)
                  },
                  onCreate: function (name) {
                    dialog.onCreate(name)
                  },
                })
              : h(CurlDialog, {
                  onCancel: function () {
                    setDialog(null)
                  },
                  onImport: function (request) {
                    setDraft(newDraft(request, ''))
                    setNotice(t('parse'), true)
                    setDialog(null)
                  },
                })
          : null,
      )
    }

    function NameDialog({ title, initial, onCancel, onConfirm }) {
      var [value, setValue] = useState(initial || '')
      var submit = function () {
        onConfirm(value.trim())
      }
      return h(
        'div',
        { className: 'dshpm-modalMask', onClick: onCancel },
        h(
          'div',
          { className: 'dshpm-modal', onClick: function (e) { e.stopPropagation() } },
          h('h3', { className: 'dshpm-modalTitle' }, title),
          h('input', {
            className: 'dshpm-inputSm',
            autoFocus: true,
            placeholder: t('enterName'),
            value: value,
            onChange: function (e) {
              setValue(e.target.value)
            },
            onKeyDown: function (e) {
              if (e.key === 'Enter') submit()
              if (e.key === 'Escape') onCancel()
            },
          }),
          h(
            'div',
            { className: 'dshpm-modalFoot' },
            h('button', { type: 'button', className: 'dshpm-btn', onClick: onCancel }, t('cancel')),
            h('button', { type: 'button', className: 'dshpm-btn', 'data-primary': '', onClick: submit }, t('ok')),
          ),
        ),
      )
    }

    function ChooseDialog({ title, collections, onCancel, onPick, onCreate }) {
      var [value, setValue] = useState('')
      return h(
        'div',
        { className: 'dshpm-modalMask', onClick: onCancel },
        h(
          'div',
          { className: 'dshpm-modal', onClick: function (e) { e.stopPropagation() } },
          h('h3', { className: 'dshpm-modalTitle' }, title),
          h(
            'div',
            { style: { display: 'flex', flexDirection: 'column', gap: 4 } },
            collections.map(function (collection) {
              return h(
                'button',
                {
                  key: collection.id,
                  type: 'button',
                  className: 'dshpm-menuItem',
                  onClick: function () {
                    onPick(collection.id)
                  },
                },
                collection.name,
              )
            }),
          ),
          h('input', {
            className: 'dshpm-inputSm',
            placeholder: t('newCollection'),
            value: value,
            onChange: function (e) {
              setValue(e.target.value)
            },
            onKeyDown: function (e) {
              if (e.key === 'Enter') onCreate(value.trim())
            },
          }),
          h(
            'div',
            { className: 'dshpm-modalFoot' },
            h('button', { type: 'button', className: 'dshpm-btn', onClick: onCancel }, t('cancel')),
            h(
              'button',
              { type: 'button', className: 'dshpm-btn', 'data-primary': '', onClick: function () { onCreate(value.trim()) } },
              t('createAndSave'),
            ),
          ),
        ),
      )
    }

    function CurlDialog({ onCancel, onImport }) {
      var [value, setValue] = useState('')
      var [busy, setBusy] = useState(false)
      var [error, setError] = useState(null)
      return h(
        'div',
        { className: 'dshpm-modalMask', onClick: onCancel },
        h(
          'div',
          { className: 'dshpm-modal', onClick: function (e) { e.stopPropagation() } },
          h('h3', { className: 'dshpm-modalTitle' }, t('importCurl')),
          h('textarea', {
            className: 'dshpm-textarea',
            autoFocus: true,
            placeholder: t('curlPlaceholder'),
            value: value,
            spellCheck: false,
            onChange: function (e) {
              setValue(e.target.value)
            },
          }),
          error !== null ? h('p', { className: 'dshpm-hint', style: { color: 'var(--dsw-alias-state-error-primary,#d93b3b)' } }, error) : null,
          h(
            'div',
            { className: 'dshpm-modalFoot' },
            h('button', { type: 'button', className: 'dshpm-btn', onClick: onCancel }, t('cancel')),
            h(
              'button',
              {
                type: 'button',
                className: 'dshpm-btn',
                'data-primary': '',
                disabled: busy || value.trim() === '',
                onClick: async function () {
                  setBusy(true)
                  setError(null)
                  try {
                    var data = await api('/curl', { method: 'POST', body: JSON.stringify({ command: value }) })
                    onImport(data.request)
                  } catch (err) {
                    setError(err.message)
                  } finally {
                    setBusy(false)
                  }
                },
              },
              busy ? t('sending') : t('parse'),
            ),
          ),
        ),
      )
    }

    // ── plugin entry ───────────────────────────────────────────────────────

    exports.inject = ['slots', 'locale']
    exports.apply = function apply(ctx) {
      ensureStyle()

      // Locale: the panel falls back to its inline dictionary when the service
      // is missing, so this is best-effort.
      try {
        ctx.locale.register(NS, { zh: ZH, en: EN })
        translate = ctx.locale.bind(NS)
      } catch (e) {
        translate = null
      }

      var slots = ctx.slots
      if (slots === undefined || slots === null) return

      ctx.effect(
        function () {
          var disposers = []
          disposers.push(
            slots.inject('sidebar.panellist', function () {
              return slots.register(
                { name: 'sidebar.panellist', id: 'postman-desktop', order: 51, label: function () { return t('nav') } },
                PanelIcon,
              )
            }),
          )
          disposers.push(
            slots.inject('main', function () {
              return slots.register({ name: 'main', key: 'postman-desktop' }, Workbench)
            }),
          )
          return function () {
            for (var i = 0; i < disposers.length; i += 1) {
              try {
                disposers[i]()
              } catch (e) {
                /* ignore */
              }
            }
          }
        },
        'dsh-postman-desktop: ui seats',
      )
    }

    return module.exports
  },
})
