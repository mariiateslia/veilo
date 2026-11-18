const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const {JSDOM}=require('jsdom');
const {createCanvas,Image}=require('@napi-rs/canvas');

test('public demo only masks its fictional targets and preserves accessible toggles',()=>{
 const dom=new JSDOM(fs.readFileSync('site/index.html','utf8'),{runScripts:'outside-only'}),w=dom.window,d=w.document;
 w.eval(fs.readFileSync('extension/mask-core.js','utf8'));w.eval(fs.readFileSync('site/assets/demo.js','utf8'));
 const targets=d.querySelectorAll('.demo-target'),first=targets[0],nav=d.querySelector('.nav');
 first.click();assert.equal(first.getAttribute('aria-pressed'),'true');assert.match(first.querySelector('.mask-value').style.filter,/blur/);
 d.querySelector('[data-mode=cover]').click();assert.equal(first.querySelector('.mask-value').style.visibility,'hidden');assert.ok(first.querySelector('.demo-cover'));assert.equal(first.style.visibility,'','button remains keyboard accessible');
 nav.click();assert.equal(nav.getAttribute('style'),null);assert.equal(d.querySelector('#demo-count').textContent,'01');
 first.click();assert.equal(first.querySelector('.mask-value').style.visibility,'');assert.equal(first.querySelector('.demo-cover'),null);
 for(const target of targets)target.click();assert.equal(d.querySelector('#demo-count').textContent,'09');
 d.querySelector('#demo-undo').click();assert.equal(d.querySelector('#demo-count').textContent,'08');
 d.querySelector('#demo-clear').click();assert.equal(d.querySelector('#demo-count').textContent,'00');assert.ok([...targets].every(b=>b.getAttribute('aria-pressed')==='false'));
 dom.window.close();
});

test('web editor runs without Chrome, rejects unsupported files, and edits with no network or persistent storage',async()=>{
 const dom=new JSDOM(fs.readFileSync('site/editor.html','utf8'),{runScripts:'outside-only',url:'https://example.com/veilo/editor.html'}),w=dom.window,d=w.document;
 const back=createCanvas(300,150),canvas=d.getElementById('image');let outgoing=0,created=0,exported;
 Object.defineProperty(canvas,'width',{get:()=>back.width,set:v=>back.width=v});Object.defineProperty(canvas,'height',{get:()=>back.height,set:v=>back.height=v});canvas.getContext=()=>back.getContext('2d');canvas.toBlob=cb=>{exported=back.toBuffer('image/png');cb(new w.Blob([exported]));};
 w.Image=Image;w.fetch=()=>{outgoing++;throw Error('No network allowed');};w.XMLHttpRequest=function(){outgoing++;throw Error('No network allowed');};
 w.URL.createObjectURL=()=>{created++;return'blob:local';};w.URL.revokeObjectURL=()=>{};w.HTMLAnchorElement.prototype.click=function(){};
 w.eval(fs.readFileSync('extension/editor.js','utf8'));
 const input=d.getElementById('file');Object.defineProperty(input,'files',{configurable:true,value:[new w.File(['<svg/>'],'unsafe.svg',{type:'image/svg+xml'})]});await input.onchange({target:input});assert.match(d.getElementById('status').textContent,/Choose a PNG/);assert.equal(created,0);
 Object.defineProperty(input,'files',{configurable:true,value:[{type:'image/png',size:25000001,name:'large.png'}]});await input.onchange({target:input});assert.match(d.getElementById('status').textContent,/25 MB/);
 const data='data:image/png;base64,'+fs.readFileSync('demo/fixture.png').toString('base64');await w.VeiloEditor.load(data);
 assert.equal(d.getElementById('cover').getAttribute('aria-pressed'),'true');d.getElementById('add-rect').click();d.getElementById('export').click();assert.ok(exported.length>1000);
 assert.equal(outgoing,0);assert.equal(w.localStorage.length,0);assert.equal(w.sessionStorage.length,0);
 d.getElementById('rect-x').value='99999';d.getElementById('add-rect').click();assert.match(d.getElementById('status').textContent,/must fit/);
 d.getElementById('undo').click();assert.match(d.getElementById('status').textContent,/0 masks/);d.getElementById('rect-x').value='0';d.getElementById('add-rect').click();d.getElementById('reset').click();assert.match(d.getElementById('status').textContent,/All masks removed/);
 await assert.rejects(w.VeiloEditor.load('data:image/png;base64,notapng'),/valid PNG/);
 dom.window.close();
});
