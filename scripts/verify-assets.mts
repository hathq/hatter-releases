// Copyright 2026 HAT Inc. SPDX-License-Identifier: MIT
// Verify only committed public asset metadata; never import or execute product code.
import { readFile, readdir, lstat } from 'node:fs/promises'
import { createReadStream } from 'node:fs'
import { createHash } from 'node:crypto'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'
const names = ['SHA256SUMS', 'hatter-linux-x86_64.tar.gz', 'release-manifest.json'].sort()
interface Asset { size: number; sha256: string }
interface RecordV1 { schema: string; version: string; assets: Record<string, Asset> }
async function bounded(path: string): Promise<string> {
  const info = await lstat(path)
  if (!info.isFile() || info.isSymbolicLink() || info.size > 1_048_576) throw Error('Unsafe metadata input')
  return readFile(path, 'utf8')
}
export async function verifyAssets(recordPath: string, directory: string, tag: string): Promise<void> {
  if (!/^v\d+\.\d+\.\d+$/.test(tag)) throw Error('Exact stable version tag required')
  const record = JSON.parse(await bounded(recordPath)) as RecordV1
  if (record.schema !== 'hatter/public-release-assets/v1' || record.version !== tag.slice(1)
    || JSON.stringify(Object.keys(record.assets).sort()) !== JSON.stringify(names)
    || JSON.stringify((await readdir(directory)).sort()) !== JSON.stringify(names)) throw Error('Mixed version or asset set')
  for (const name of names) {
    const expected = record.assets[name]!, path = join(directory, name), info = await lstat(path)
    if (!Number.isSafeInteger(expected.size) || expected.size < 1 || expected.size > 536_870_912
      || !/^[a-f0-9]{64}$/.test(expected.sha256) || !info.isFile() || info.isSymbolicLink()
      || info.size !== expected.size) throw Error('Unsafe or incomplete asset')
    const hash = createHash('sha256')
    for await (const chunk of createReadStream(path, { highWaterMark: 65_536 })) hash.update(chunk)
    if (hash.digest('hex') !== expected.sha256) throw Error('Asset digest mismatch')
  }
  const manifest = JSON.parse(await bounded(join(directory, 'release-manifest.json'))) as { schema: string; version: string }
  if (manifest.schema !== 'hathq://hatter-console/release/v3' || manifest.version !== record.version) throw Error('Wrong product manifest')
  const expectedSums = ['hatter-linux-x86_64.tar.gz', 'release-manifest.json']
    .map(name => record.assets[name]!.sha256 + '  ' + name + '\n').join('')
  if (await bounded(join(directory, 'SHA256SUMS')) !== expectedSums) throw Error('Mixed checksum document')
}
if (process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url) {
  const [record, directory, tag] = process.argv.slice(2)
  if (process.argv.length !== 5 || !record || !directory || !tag) throw Error('record directory tag required')
  await verifyAssets(record, directory, tag)
  process.stdout.write('Exact public release asset bytes accepted; product not executed.\n')
}
