'use strict';
(() => {
 const root=document.getElementById('veilo-demo');if(!root)return;
 const effects=globalThis.VeiloMaskEffects, records=new Map();let mode='blur',strength=12;
 const targets=[...root.querySelectorAll('.demo-target')];
 function drawCount(count,n){
  const digits=['111101101101111','010110010010111','111001111100111','111001111001111','101101111001001','111100111001111','111100111101111','111001001001001','111101111101111','111101111001111'];
  const text=String(n).padStart(2,'0'),ns='http://www.w3.org/2000/svg',svg=document.createElementNS(ns,'svg');
  svg.setAttribute('viewBox',`0 0 ${text.length*24-6} 30`);svg.setAttribute('aria-hidden','true');
  [...text].forEach((digit,i)=>[...digits[Number(digit)]].forEach((on,j)=>{const dot=document.createElementNS(ns,'circle');dot.setAttribute('cx',String((i*4+j%3)*6+3));dot.setAttribute('cy',String(Math.floor(j/3)*6+3));dot.setAttribute('r','1.9');dot.setAttribute('fill',on==='1'?'#fff':'#ffffff30');svg.append(dot);}));
  count.replaceChildren(document.createTextNode(text),svg);count.classList.add('has-dots');
 }

 function apply(button,record){effects.apply(button.querySelector('.mask-value'),record,{mode,strength,createOverlay(){const node=document.createElement('span');node.className='demo-cover';node.setAttribute('aria-hidden','true');button.append(node);return node;}});}
 function render(){const n=records.size;const count=root.querySelector('#demo-count');drawCount(count,n);count.setAttribute('aria-label',`${n} ${n===1?'element':'elements'} hidden`);root.querySelectorAll('[data-mode]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.mode===mode)));root.querySelector('#demo-strength').disabled=mode==='cover';root.querySelector('#demo-strength-value').textContent=`${strength} px`;root.querySelector('#demo-undo').disabled=!n;root.querySelector('#demo-clear').disabled=!n;root.querySelector('#demo-feedback').textContent=n?`${n} ${n===1?'detail':'details'} hidden. Click a hidden detail to reveal it.`:'Click any name, email, or amount to try it.';for(const b of targets){const hidden=records.has(b);b.setAttribute('aria-pressed',String(hidden));b.setAttribute('aria-label',`${hidden?'Reveal':'Hide'} ${b.querySelector('.mask-value').textContent}`);}}
 targets.forEach(button=>button.addEventListener('click',()=>{const el=button.querySelector('.mask-value');if(records.has(button)){effects.restore(el,records.get(button));records.delete(button);}else{const record=effects.capture(el);records.set(button,record);apply(button,record);}render();}));
 root.querySelectorAll('[data-mode]').forEach(b=>b.addEventListener('click',()=>{mode=b.dataset.mode;for(const [button,record]of records)apply(button,record);render();}));
 root.querySelector('#demo-strength').addEventListener('input',e=>{strength=Number(e.target.value);for(const [button,record]of records)apply(button,record);render();});
 root.querySelector('#demo-undo').addEventListener('click',()=>{const last=[...records].at(-1);if(last){effects.restore(last[0].querySelector('.mask-value'),last[1]);records.delete(last[0]);}render();});
 root.querySelector('#demo-clear').addEventListener('click',()=>{for(const [button,record]of records)effects.restore(button.querySelector('.mask-value'),record);records.clear();render();});
 render();
})();
