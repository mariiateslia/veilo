'use strict';
window.chrome={
 storage:{local:{async get(){return {veiloPreferences:parent.VeiloDemo.preferences};},async set(value){parent.VeiloDemo.preferences=value.veiloPreferences;}},session:{async set(){}}},
 tabs:{async query(){return[{id:1,windowId:1,url:'https://workspace.example/people'}];},async sendMessage(_id,msg){return parent.VeiloDemo.send(msg);},async captureVisibleTab(){throw new Error('Preview does not capture browser tabs');},async create(){location.href='editor-preview.html';}},
 scripting:{async executeScript(){}},runtime:{getURL(path){return '../extension/'+path;}}
};
window.close=()=>{};
