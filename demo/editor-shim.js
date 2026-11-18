'use strict';
window.chrome={storage:{session:{async get(){return {'demo-capture':{dataUrl:await fixture(),created:Date.now()}};},async remove(){}}}};
async function fixture(){return new Promise((resolve,reject)=>{const image=new Image();image.onload=()=>{const canvas=document.createElement('canvas');canvas.width=image.naturalWidth;canvas.height=image.naturalHeight;canvas.getContext('2d').drawImage(image,0,0);resolve(canvas.toDataURL('image/png'));};image.onerror=reject;image.src='fixture.png';});}
