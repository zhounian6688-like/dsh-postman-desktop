#!/usr/bin/env node
// Fill the publishing placeholders in package.json in one shot.
//
//   node scripts/set-owner.mjs <github-owner> [author-name] [author-email]
//
// Rewrites repository/homepage/bugs to point at github.com/<owner> and, when
// given, sets author. Idempotent: running it twice changes nothing.

import { readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const [, , owner, authorName, authorEmail] = process.argv
if (owner === undefined || owner.trim() === '') {
  console.error('usage: node scripts/set-owner.mjs <github-owner> [author-name] [author-email]')
  process.exit(1)
}

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const file = join(root, 'package.json')
const pkg = JSON.parse(readFileSync(file, 'utf8'))
const slug = pkg.name
const base = `https://github.com/${owner}/${slug}`

pkg.repository = { type: 'git', url: `git+${base}.git` }
pkg.homepage = `${base}#readme`
pkg.bugs = { url: `${base}/issues` }
if (authorName !== undefined) {
  pkg.author = authorEmail === undefined ? authorName : `${authorName} <${authorEmail}>`
}

writeFileSync(file, JSON.stringify(pkg, null, 2) + '\n')
console.log('updated ' + file)
console.log('  repository ' + pkg.repository.url)
if (pkg.author !== undefined) console.log('  author     ' + pkg.author)
