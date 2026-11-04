import assert from 'node:assert/strict';import fs from 'node:fs';import ts from 'typescript';
const exports={};new Function('exports',ts.transpileModule(fs.readFileSync('lib/whatsapp.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText)(exports);
const {validMetaSignature,incomingMessages}=exports,raw=new TextEncoder().encode('{"message":"xin chào"}').buffer;
const key=await crypto.subtle.importKey('raw',new TextEncoder().encode('test-only-secret'),{name:'HMAC',hash:'SHA-256'},false,['sign']);const sig='sha256='+Buffer.from(await crypto.subtle.sign('HMAC',key,raw)).toString('hex');
assert.equal(await validMetaSignature(raw,sig,'test-only-secret'),true);assert.equal(await validMetaSignature(raw,sig,'wrong'),false);assert.equal(await validMetaSignature(raw,'','test-only-secret'),false);assert.equal(await validMetaSignature(new TextEncoder().encode('tampered').buffer,sig,'test-only-secret'),false);
const payload={object:'whatsapp_business_account',entry:[{changes:[{field:'messages',value:{metadata:{phone_number_id:'approved-number'},contacts:[{wa_id:'84912345678',profile:{name:'Test customer'}}],messages:[{id:'wamid.test',from:'84912345678',type:'text',text:{body:'Hello'},timestamp:'123'}]}}]}]};
assert.equal(incomingMessages(payload,'approved-number')[0].preview,'Hello');assert.equal(incomingMessages(payload,'another-number').length,0);assert.equal(incomingMessages({object:'other'},'approved-number').length,0);
console.log('PASS: Meta HMAC verification, tamper rejection, phone-number isolation and incoming message parsing');
