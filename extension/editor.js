'use strict';
const $=id=>document.getElementById(id),canvas=$('image'),ctx=canvas.getContext('2d');
let image=null,masks=[],mode='cover',drag=null,working=false,loadSequence=0;
function announce(s){$('status').textContent=s;}
function rectangle(a,b){return {x:Math.min(a.x,b.x),y:Math.min(a.y,b.y),w:Math.abs(a.x-b.x),h:Math.abs(a.y-b.y),mode};}
function point(e){const r=canvas.getBoundingClientRect();return{x:Math.max(0,Math.min(canvas.width,(e.clientX-r.left)*canvas.width/r.width)),y:Math.max(0,Math.min(canvas.height,(e.clientY-r.top)*canvas.height/r.height))};}
function mask(m){if(m.mode==='cover'){ctx.fillStyle='#292431';ctx.fillRect(m.x,m.y,m.w,m.h);}else{
  // Blur a padded source area; clipped output prevents reading neighbouring pixels outside the selected rectangle.
  ctx.save();ctx.beginPath();ctx.rect(m.x,m.y,m.w,m.h);ctx.clip();ctx.filter='blur(18px)';ctx.drawImage(image,0,0);ctx.restore();
}}
function paint(preview){if(!image)return;ctx.clearRect(0,0,canvas.width,canvas.height);ctx.drawImage(image,0,0);for(const m of masks.filter(m=>m.mode==='blur'))mask(m);for(const m of masks.filter(m=>m.mode==='cover'))mask(m);if(preview){ctx.save();ctx.strokeStyle='#9e7ece';ctx.lineWidth=Math.max(2,canvas.width/600);ctx.setLineDash([6,4]);ctx.strokeRect(preview.x,preview.y,preview.w,preview.h);ctx.restore();}$('undo').disabled=!masks.length;$('reset').disabled=!masks.length;}
async function load(src){const sequence=++loadSequence,candidate=new Image();await new Promise((resolve,reject)=>{candidate.onload=resolve;candidate.onerror=()=>reject(new Error('This image could not be opened. Choose a valid PNG, JPG or WebP.'));candidate.src=src;});if(sequence!==loadSequence)return;if(!candidate.naturalWidth||candidate.naturalWidth*candidate.naturalHeight>32000000)throw new Error('Image too large. Use an image under 32 megapixels.');image=candidate;canvas.width=image.naturalWidth;canvas.height=image.naturalHeight;masks=[];drag=null;$('empty').hidden=true;$('canvas-wrap').hidden=false;$('keyboard-mask').hidden=false;$('export').disabled=false;paint();announce(`Image opened: ${canvas.width} × ${canvas.height}. Draw a rectangle or enter coordinates. Review the whole image before exporting.`);}
$('file').onchange=async e=>{const file=e.target.files[0];if(!file)return;if(!['image/png','image/jpeg','image/webp'].includes(file.type)&&!(file.type===''&&/\.(png|jpe?g|webp)$/i.test(file.name))){announce('Choose a PNG, JPG or WebP image.');e.target.value='';return;}if(file.size>25000000){announce('Choose an image smaller than 25 MB.');e.target.value='';return;}const url=URL.createObjectURL(file);try{await load(url);}catch(err){announce(err.message||'This image could not be opened.');}finally{URL.revokeObjectURL(url);e.target.value='';}};
for(const option of ['cover','blur'])$(option).onclick=()=>{mode=option;for(const m of ['cover','blur'])$(m).setAttribute('aria-pressed',String(m===mode));announce(mode==='cover'?'Cover replaces the selected pixels when exported.':'Blur is visual only. Use Cover for private information.');};
canvas.onpointerdown=e=>{if(!image||e.button!==0)return;drag=point(e);canvas.setPointerCapture(e.pointerId);};
canvas.onpointermove=e=>{if(drag)paint(rectangle(drag,point(e)));};
canvas.onpointerup=e=>{if(!drag)return;const m=rectangle(drag,point(e));drag=null;if(m.w>=3&&m.h>=3)masks.push(m);paint();announce(`${masks.length} masks added. Review before saving.`);};
canvas.onpointercancel=()=>{drag=null;paint();};
document.addEventListener('keydown',e=>{if(e.key==='Escape'){drag=null;paint();}});
$('add-rect').onclick=()=>{if(!image)return;const values=['rect-x','rect-y','rect-w','rect-h'].map(id=>Number($(id).value));if(!values.every(Number.isFinite)){announce('Enter finite numbers for the rectangle.');return;}const [x,y,w,h]=values;if(x>=0&&y>=0&&w>0&&h>0&&x+w<=canvas.width&&y+h<=canvas.height){masks.push({x,y,w,h,mode});paint();announce(`${masks.length} masks added.`);}else announce('The rectangle must fit inside the image.');};
$('undo').onclick=()=>{masks.pop();paint();announce(`${masks.length} masks remaining.`);};$('reset').onclick=()=>{masks=[];drag=null;paint();announce('All masks removed.');};
$('export').onclick=()=>{if(!image||working)return;working=true;drag=null;paint();canvas.toBlob(blob=>{if(blob){const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='veilo-screenshot.png';a.click();setTimeout(()=>URL.revokeObjectURL(url),10000);announce('PNG saved. Only the flattened image is exported.');}else announce('Export failed. Try a smaller image.');working=false;},'image/png');};

// Both surfaces use this editor; the optional Chrome adapter owns capture transport.
globalThis.VeiloEditor=Object.freeze({load,announce});
