// Copyright 2026 HAT Inc. SPDX-License-Identifier: MIT
import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { createHash } from 'node:crypto'
import { verifyAssets } from './verify-assets.mts'
test('exact set passes while changed bytes, extra private assets and mixed version fail', async () => {
  const root = await mkdtemp(join(tmpdir(), 'release-assets-')), directory = join(root, 'assets')
  try {
    await mkdir(directory)
    const digest = (s: string) => createHash('sha256').update(s).digest('hex')
    const archive = 'synthetic archive, not executable', manifest = JSON.stringify({ schema: 'hathq://hatter-console/release/v3', version: '0.10.0' })
    const files: Record<string, string> = { 'hatter-linux-x86_64.tar.gz': archive, 'release-manifest.json': manifest,
      SHA256SUMS: digest(archive) + '  hatter-linux-x86_64.tar.gz\n' + digest(manifest) + '  release-manifest.json\n' }
    const assets: Record<string, { size: number; sha256: string }> = {}
    for (const [name, bytes] of Object.entries(files)) {
      await writeFile(join(directory, name), bytes); assets[name] = { size: Buffer.byteLength(bytes), sha256: digest(bytes) }
    }
    const record = join(root, 'record.json')
    await writeFile(record, JSON.stringify({ schema: 'hatter/public-release-assets/v1', version: '0.10.0', assets }))
    await verifyAssets(record, directory, 'v0.10.0')
    await assert.rejects(verifyAssets(record, directory, 'v0.10.1'))
    await writeFile(join(directory, 'private-receipt.json'), '{}')
    await assert.rejects(verifyAssets(record, directory, 'v0.10.0'))
    await rm(join(directory, 'private-receipt.json'))
    await writeFile(join(directory, 'hatter-linux-x86_64.tar.gz'), archive.replace('synthetic', 'different'))
    await assert.rejects(verifyAssets(record, directory, 'v0.10.0'), /digest/)
  } finally { await rm(root, { recursive: true, force: true }) }
})
