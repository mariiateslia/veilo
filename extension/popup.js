'use strict';
const $ = (id) => document.getElementById(id);
let tab, prefs = {mode:'blur', strength:12}, available = false;
const message = (text, error=false) => { $('status').textContent=text; $('status').classList.toggle('error',error); };

function drawCount(number) {
  const digits=['111101101101111','010110010010111','111001111100111','111001111001111','101101111001001','111100111001111','111100111101111','111001001001001','111101111101111','111101111001111'];
  const text=String(number).padStart(2,'0'),ns='http://www.w3.org/2000/svg';
  const svg=document.createElementNS(ns,'svg');svg.setAttribute('viewBox',`0 0 ${text.length*4*6-6} 30`);svg.setAttribute('aria-hidden','true');
  [...text].forEach((digit,i)=>[...digits[Number(digit)]].forEach((on,j)=>{const c=document.createElementNS(ns,'circle');c.setAttribute('cx',String((i*4+j%3)*6+3));c.setAttribute('cy',String(Math.floor(j/3)*6+3));c.setAttribute('r','1.9');c.setAttribute('fill',on==='1'?'#fff':'#ffffff25');svg.append(c);}));
  $('count').replaceChildren(svg);
}

function render(state={count:0,paused:false}) {
  drawCount(state.count); $('count').setAttribute('aria-label',`${state.count} elements hidden`);
  for(const mode of ['blur','cover']) { $(mode).classList.toggle('selected',prefs.mode===mode); $(mode).setAttribute('aria-pressed',String(prefs.mode===mode)); }
  $('strength').value=prefs.strength; $('strengthValue').textContent=`${prefs.strength} px`; $('strength').disabled=prefs.mode==='cover';
  for(const id of ['undo','pause','clear']) $(id).disabled=!state.count;
  $('pause').textContent=state.paused?'Resume':'Pause';
}
async function send(type, extra={}) {
  if(!available) return null;
  try { const state=await chrome.tabs.sendMessage(tab.id,{veilo:true,type,...extra}); render(state); return state; }
  catch { available=false; $('select').disabled=true; message('This page changed. Close Veilo and open it again.',true); return null; }
}
async function savePrefs() { await chrome.storage.local.set({veiloPreferences:prefs}); await send('settings',prefs); }
async function init() {
  render();
  try {
    const saved=await chrome.storage.local.get('veiloPreferences');
    prefs={...prefs,...saved.veiloPreferences};
    prefs.mode=prefs.mode==='cover'?'cover':'blur';prefs.strength=Math.max(4,Math.min(24,Number(prefs.strength)||12));render();
    [tab]=await chrome.tabs.query({active:true,currentWindow:true});
    const url=new URL(tab?.url||'about:blank');
    $('site').textContent=url.hostname||'This tab';
    if(!['http:','https:','file:'].includes(url.protocol)||url.hostname==='chromewebstore.google.com'||(url.hostname==='chrome.google.com'&&url.pathname.startsWith('/webstore'))) throw new Error('restricted');
    await chrome.scripting.executeScript({target:{tabId:tab.id},files:['mask-core.js','content.js']});
    available=true;await send('settings',prefs);
  } catch {
    $('site').textContent='Open a regular webpage';$('select').disabled=true;
    message('Chrome blocks this page. Try a normal website. You can still open an image in the screenshot editor.',true);
  }
}
for(const mode of ['blur','cover']) $(mode).onclick=async()=>{prefs.mode=mode;render(await send('state')||undefined);await savePrefs();};
$('strength').oninput=()=>{prefs.strength=Number($('strength').value);$('strengthValue').textContent=`${prefs.strength} px`;};
$('strength').onchange=savePrefs;
$('select').onclick=async()=>{const result=await send('select',prefs);if(result) window.close();};
$('undo').onclick=()=>send('undo');$('pause').onclick=()=>send('pause');$('clear').onclick=()=>send('clear');
$('screenshot').onclick=async()=>{
  $('screenshot').disabled=true;
  try {
    let dataUrl;
    if(available) {await send('finish'); dataUrl=await chrome.tabs.captureVisibleTab(tab.windowId,{format:'png'});}
    const key=`capture-${crypto.randomUUID()}`;
    if(dataUrl) await chrome.storage.session.set({[key]:{dataUrl,created:Date.now()}});
    await chrome.tabs.create({url:chrome.runtime.getURL(`editor.html${dataUrl?'?capture='+key:''}`)});window.close();
  } catch { message('Capture is unavailable here. Opening the image editor instead.',true);await chrome.tabs.create({url:chrome.runtime.getURL('editor.html')}); }
  finally {$('screenshot').disabled=false;}
};
init();
