// Copyright 2026 HAT Inc. SPDX-License-Identifier: MIT
import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, existsSync, rmSync, chmodSync, symlinkSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, dirname } from 'node:path'
import { spawnSync } from 'node:child_process'
const script = new URL('../install.sh', import.meta.url).pathname
function home(): string { return mkdtempSync(join(tmpdir(), 'hatter-install-test-')) }
function run(directory: string, args: string[], source = script) {
  return spawnSync('/bin/bash', [source, ...args], {
    env: { ...process.env, PATH: `${dirname(process.execPath)}:${process.env.PATH}`, HOME: directory }, encoding: 'utf8', timeout: 180_000, maxBuffer: 65_536
  })
}
for (const [name, args] of [['help', ['--help']], ['unknown option', ['--bogus']], ['extra argument', ['--check', '--yes']]] as const) {
  test(name, () => {
    const directory = home()
    try {
      const result = run(directory, [...args])
      assert.equal(result.status, name === 'help' ? 0 : 1)
      assert.equal(existsSync(join(directory, '.local')), false)
    } finally { rmSync(directory, { recursive: true, force: true }) }
  })
}
for (const kind of ['symlink', 'shared', 'command', 'version'] as const) {
  test(`refuses unsafe/existing ${kind} before downloading`, () => {
    const directory = home()
    try {
      if (kind === 'symlink') symlinkSync(tmpdir(), join(directory, '.local'))
      if (kind === 'shared') { mkdirSync(join(directory, '.local')); chmodSync(join(directory, '.local'), 0o777) }
      if (kind === 'command') { mkdirSync(join(directory, '.local/bin'), { recursive: true }); symlinkSync('/nonexistent', join(directory, '.local/bin/hatter')) }
      if (kind === 'version') mkdirSync(join(directory, '.local/share/hatter/releases/0.10.0'), { recursive: true })
      const result = run(directory, ['--check'])
      assert.notEqual(result.status, 0)
      assert.match(result.stderr, /Refusing symlink|shared directory|existing hatter|already exists/)
      assert.equal(existsSync(join(directory, '.hatter')), false)
    } finally { rmSync(directory, { recursive: true, force: true }) }
  })
}
test('corrupt download is refused before extraction/setup', () => {
  const directory = home(), fixtures = home()
  try {
    // Test-only transport substitution in a temporary script; the shipped installer has no origin/hash override.
    const source = readFileSync(script, 'utf8').replace('PATH=/usr/bin:/bin', `PATH=${fixtures}:/usr/bin:/bin`)
    writeFileSync(join(fixtures, 'install.sh'), source)
    writeFileSync(join(fixtures, 'curl'), '#!/bin/bash\nwhile [[ $# -gt 0 ]]; do if [[ "$1" == --output ]]; then truncate -s 30094055 "$2"; exit; fi; shift; done\n', { mode: 0o700 })
    const result = run(directory, ['--yes'], join(fixtures, 'install.sh'))
    assert.notEqual(result.status, 0)
    assert.match(result.stderr, /hash mismatch/)
    assert.equal(existsSync(join(directory, '.local')), false)
  } finally { rmSync(directory, { recursive: true, force: true }); rmSync(fixtures, { recursive: true, force: true }) }
})
test('official immutable archive checks without installing or initializing state', () => {
  const directory = home()
  try {
    const result = run(directory, ['--check'])
    assert.equal(result.status, 0, result.stderr + result.stdout)
    assert.match(result.stdout, /nothing installed or initialized/)
    assert.equal(existsSync(join(directory, '.local')), false)
    assert.equal(existsSync(join(directory, '.hatter')), false)
  } finally { rmSync(directory, { recursive: true, force: true }) }
})
test('installs the official archive in an isolated HOME; restart/version and duplicate refusal', () => {
  const directory = home()
  try {
    const result = run(directory, ['--yes'])
    assert.equal(result.status, 0, result.stderr + result.stdout)
    const launcher = join(directory, '.local/bin/hatter')
    assert.ok(existsSync(launcher))
    const version = spawnSync(launcher, ['--version'], { env: { ...process.env, PATH: `${dirname(process.execPath)}:${process.env.PATH}`, HOME: directory }, encoding: 'utf8', timeout: 15_000 })
    assert.equal(version.status, 0, version.stderr)
    assert.match(version.stdout, /0\.10\.0/)
    assert.notEqual(run(directory, ['--yes']).status, 0)
    assert.equal(existsSync(join(directory, '.hatter')), false)
    assert.equal(existsSync(join(directory, '.local/share/hatter/releases/0.10.0/licenses')), true)
  } finally { rmSync(directory, { recursive: true, force: true }) }
})
