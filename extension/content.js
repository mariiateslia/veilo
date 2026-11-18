(() => {
  'use strict';
  // One controller per document, even after reopening the popup.
  if(globalThis.__veiloController) return;
  const records=new Map(); let mode='blur',strength=12,paused=false,selecting=false,current=null,frame=0;
  const host=document.createElement('div');host.id=`veilo-${crypto.randomUUID()}`;
  host.style.cssText='all:initial!important;position:fixed!important;inset:0!important;pointer-events:none!important;z-index:2147483647!important;';
  const shadow=host.attachShadow({mode:'open'});
  shadow.innerHTML=`<style>
    :host{all:initial}*{box-sizing:border-box} .outline{z-index:3;position:fixed;border:2px solid #9c87d0;border-radius:5px;background:#ac91e21a;pointer-events:none;display:none}
    .veil{z-index:1;position:fixed;background:#25222c;border-radius:4px;pointer-events:none;overflow:hidden}.veil:after{content:'';position:absolute;inset:0;background:radial-gradient(circle,#ffffff19 1px,transparent 1px) 0 0/6px 6px}
    .toolbar{z-index:2;position:fixed;left:50%;bottom:24px;transform:translateX(-50%);display:none;align-items:center;gap:9px;padding:10px 12px;background:#f5f2ed;color:#29242e;border:1px solid #fff;border-radius:15px;box-shadow:0 6px 35px #17101d35;pointer-events:auto;font:12px/1.3 -apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:calc(100vw - 24px);flex-wrap:wrap}
    .toolbar strong{font-size:15px;font-weight:600;letter-spacing:-.5px}.toolbar span{color:#6f6576;font-size:11px}.toolbar button{font:inherit;cursor:pointer;padding:8px 11px;background:#e8e0ee;border:0;border-radius:8px;color:#42334e}.toolbar button:last-child{background:#2c2632;color:#fff}.toolbar button:focus-visible{outline:2px solid #8463b4;outline-offset:2px}.toolbar button:disabled{opacity:.4}.sr{position:absolute;width:1px;height:1px;overflow:hidden;clip-path:inset(50%)}
    @media(max-width:480px){.toolbar{bottom:12px;width:calc(100vw - 24px);justify-content:center}.hint{width:100%;text-align:center}}
  </style><div class="outline"></div><div class="toolbar" role="region" aria-label="Veilo selection controls"><strong>◐ Veilo</strong><span class="hint">Click to hide · Tab + Enter · Esc to finish</span><button data-action="undo">Undo</button><button data-action="clear">Show all</button><button data-action="done">Done</button><span class="sr" role="status" aria-live="polite"></span></div>`;
  document.documentElement.append(host);
  const outline=shadow.querySelector('.outline'),toolbar=shadow.querySelector('.toolbar');
  function state(){prune();return {count:records.size,paused,selecting,mode,strength};}
  function prune(){for(const [el,r] of records)if(!el.isConnected){restore(el,r);r.overlay?.remove();records.delete(el);}}
  const effects=globalThis.VeiloMaskEffects;
  function remember(el){return effects.capture(el);}
  function restore(el,r){effects.restore(el,r);}
  function apply(el,r){effects.apply(el,r,{mode,strength,paused,createOverlay(){const overlay=document.createElement('div');overlay.className='veil';overlay.setAttribute('aria-hidden','true');shadow.append(overlay);return overlay;}});}
  function position(el,node){const r=el.getBoundingClientRect();node.style.left=`${r.left}px`;node.style.top=`${r.top}px`;node.style.width=`${r.width}px`;node.style.height=`${r.height}px`;}
  function layout(){frame=0;prune();for(const [el,r] of records)if(r.overlay)position(el,r.overlay);if(selecting&&current?.isConnected){position(current,outline);outline.style.display='block';}else outline.style.display='none';}
  function schedule(){if(!frame)frame=requestAnimationFrame(layout);}
  function notify(){const n=records.size;shadow.querySelector('.sr').textContent=`${n} elements hidden`;shadow.querySelector('[data-action=undo]').disabled=!n;schedule();}
  function candidate(event){if(event.composedPath().includes(host))return null;let el=event.target;if(!(el instanceof Element))return null;if(el===document.body||el===document.documentElement||['SCRIPT','STYLE','LINK','META'].includes(el.tagName))return null;return el.closest('button,a,label')||el;}
  function move(event){if(!selecting)return;current=candidate(event);schedule();}
  function choose(el){if(!el)return; // Avoid nested masks: selecting a parent replaces its child masks.
    for(const [node,r] of [...records])if(node===el||node.contains(el)){restore(node,r);records.delete(node);notify();return;}
    for(const [node,r] of [...records])if(el.contains(node)){restore(node,r);records.delete(node);}
    paused=false;const r=remember(el);records.set(el,r);apply(el,r);notify();
  }
  function click(event){if(!selecting)return;const el=candidate(event);if(!el)return;event.preventDefault();event.stopImmediatePropagation();choose(el);}
  function guard(event){if(selecting&&candidate(event)){event.preventDefault();event.stopImmediatePropagation();}}
  function key(event){if(!selecting||event.composedPath().includes(host))return;if(event.key==='Escape'){event.preventDefault();event.stopImmediatePropagation();finish();}
    else if(event.key==='Enter'){const el=document.activeElement;if(el&&el!==document.body&&el!==host){event.preventDefault();event.stopImmediatePropagation();choose(el);}}
  }
  function start(){selecting=true;toolbar.style.display='flex';notify();}
  function finish(){selecting=false;current=null;toolbar.style.display='none';outline.style.display='none';}
  function clear(){for(const [el,r] of records)restore(el,r);records.clear();paused=false;notify();}
  function undo(){const entry=[...records].at(-1);if(entry){restore(...entry);records.delete(entry[0]);notify();}}
  function refresh(){for(const [el,r] of records)apply(el,r);notify();}
  function handle(msg){if(!msg?.veilo)return;switch(msg.type){case 'settings':mode=msg.mode==='cover'?'cover':'blur';strength=Math.max(4,Math.min(24,Number(msg.strength)||12));refresh();break;case 'select':mode=msg.mode==='cover'?'cover':'blur';strength=Math.max(4,Math.min(24,Number(msg.strength)||12));refresh();start();break;case 'finish':finish();break;case 'undo':undo();break;case 'clear':clear();break;case 'pause':paused=!paused;refresh();break;}return state();}
  shadow.querySelectorAll('button').forEach(b=>b.onclick=()=>{if(b.dataset.action==='done')finish();if(b.dataset.action==='undo')undo();if(b.dataset.action==='clear')clear();});
  window.addEventListener('pointerover',move,true);window.addEventListener('focusin',move,true);window.addEventListener('click',click,true);window.addEventListener('keydown',key,true);
  for(const type of ['pointerdown','mousedown','mouseup'])window.addEventListener(type,guard,true);
  window.addEventListener('scroll',schedule,true);window.addEventListener('resize',schedule);
  // Track moving covers, including layout shifts and animations, while any cover exists.
  setInterval(()=>{if(records.size){schedule();if(!host.isConnected)document.documentElement.append(host);}},100);
  chrome.runtime.onMessage.addListener((msg,_sender,reply)=>{const result=handle(msg);if(result)reply(result);});
  globalThis.__veiloController={handle};
})();
