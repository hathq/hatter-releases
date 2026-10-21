// Copyright 2026 HAT Inc. SPDX-License-Identifier: MIT
import test from 'node:test'
import assert from 'node:assert/strict'
import {readFileSync,mkdtempSync,writeFileSync,rmSync} from 'node:fs'
import {tmpdir} from 'node:os'
import {join} from 'node:path'
import {spawnSync} from 'node:child_process'
const source=readFileSync(new URL('../install.sh',import.meta.url),'utf8')
const start=source.indexOf('check_node_version() {'),end=source.indexOf('\n}\n',start)+2
assert.ok(start>0&&end>start)
const check=source.slice(start,end)
const cases:readonly (readonly [string,boolean])[]=[['v22.23.3',false],['v22.23.4',true],['v22.24.0',true],['v24.15.0',false],['v24.22.0',false],['v24.22.1',true],['v24.22.2',true],['v24.23.0',true],['v20.19.0',false],['v26.12.1',false],['v24.22.1-rc.1',false],['24.22.1',false],['v24.22.1; touch injected',false],['v24.999999999999999999.1',false]]
for(const [version,allowed]of cases)test('Node security floor: '+version,()=>{
 const directory=mkdtempSync(join(tmpdir(),'hatter-node-floor-'))
 try{
  const fake=join(directory,'selected node'),launcher=join(directory,'launcher')
  writeFileSync(fake,"#!/bin/bash\nprintf '%s\\n' '"+version+"'\n",{mode:0o700})
  writeFileSync(launcher,'#!/bin/bash\nset -euo pipefail\n'+check+'\ncheck_node_version "$1"\necho PRODUCT_STARTED\n',{mode:0o700})
  const result=spawnSync('/bin/bash',[launcher,fake],{encoding:'utf8',timeout:8000,maxBuffer:4096})
  assert.equal(result.status===0,allowed,result.stderr);assert.equal(result.stdout.includes('PRODUCT_STARTED'),allowed)
 }finally{rmSync(directory,{recursive:true,force:true})}
})
test('installer and generated launcher share the same bound security-floor check',()=>{
 assert.match(source,/check_node_version "\$node" \|\| fail/)
 assert.match(source,/declare -f check_node_version/)
 assert.match(source,/check_node_version "\$HATTER_CONSOLE_NODE_EXECUTABLE" \|\|/)
})
