const {test}=require('node:test');const assert=require('node:assert/strict');const fs=require('node:fs');const {JSDOM}=require('jsdom');const {createCanvas,Image,loadImage}=require('@napi-rs/canvas');
test('exported PNG keeps cover pixels opaque even when a later blur overlaps',async()=>{
 const html=fs.readFileSync('extension/editor.html','utf8');
 const dom=new JSDOM(html,{runScripts:'outside-only',url:'https://example.com/editor.html?capture=test'});const w=dom.window,c=w.document.getElementById('image'),back=createCanvas(300,150);let exported;
 Object.defineProperty(c,'width',{get:()=>back.width,set:v=>{back.width=v;}});Object.defineProperty(c,'height',{get:()=>back.height,set:v=>{back.height=v;}});
 c.getContext=()=>back.getContext('2d');c.toBlob=fn=>{exported=back.toBuffer('image/png');fn(new w.Blob([exported]));};
 w.Image=Image;w.URL.createObjectURL=()=> 'blob:test';w.URL.revokeObjectURL=()=>{};w.HTMLAnchorElement.prototype.click=function(){};
 const dataUrl='data:image/png;base64,'+fs.readFileSync('demo/fixture.png').toString('base64');
 w.chrome={storage:{session:{async get(){return{test:{dataUrl,created:Date.now()}};},async remove(){}}}};
 w.eval(fs.readFileSync('extension/editor.js','utf8'));w.eval(fs.readFileSync('extension/editor-capture.js','utf8'));
 for(let i=0;i<100&&w.document.getElementById('export').disabled;i++)await new Promise(r=>setTimeout(r,10));
 assert.equal(w.document.getElementById('export').disabled,false,'fixture loaded');
 for(const [id,value]of Object.entries({'rect-x':70,'rect-y':185,'rect-w':320,'rect-h':50}))w.document.getElementById(id).value=value;
 w.document.getElementById('add-rect').click();w.document.getElementById('blur').click();w.document.getElementById('add-rect').click();w.document.getElementById('export').click();
 assert.ok(exported?.length>1000,'flattened PNG encoded');const image=await loadImage(exported),check=createCanvas(image.width,image.height);check.getContext('2d').drawImage(image,0,0);
 assert.deepEqual([...check.getContext('2d').getImageData(100,200,1,1).data],[41,36,49,255]);
 assert.equal(image.width,1000);assert.equal(image.height,560);dom.window.close();
});
