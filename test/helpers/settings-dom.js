'use strict';
function documentFixture(html) {
  const camel=s=>s.replace(/-([a-z])/g,(_,c)=>c.toUpperCase());
  let document;
  class Node {
    constructor(tag=null,text=''){this.tagName=tag?.toUpperCase();this.tag=tag;this.text=text;this.childNodes=[];this.dataset={};this.attributes={};this.listeners={};this.className='';this.value='';this.checked=false;this.disabled=false;this.open=false;this.hidden=false;
      this.style={};this.classList={add:(...names)=>{this.className=[...new Set([...this.className.split(/\s+/),...names])].filter(Boolean).join(' ');},remove:(...names)=>{this.className=this.className.split(/\s+/).filter(name=>!names.includes(name)).join(' ');},contains:name=>this.className.split(/\s+/).includes(name),toggle:(name,value)=>{if(value??!this.classList.contains(name))this.classList.add(name);else this.classList.remove(name);}};}
    get children(){return this.childNodes.filter(n=>n.tag);}
    get lastChild(){return this.childNodes.at(-1);}
    get parentElement(){return this.parent?.tag?this.parent:null;}
    get elements(){return this.querySelectorAll('input,select,textarea,button');}
    get textContent(){return this.tag?this.childNodes.map(n=>n.textContent).join(''):this.text;}
    set textContent(text){this.replaceChildren(new Node(null,String(text)));}
    get isConnected(){let n=this;while(n){if(n===document)return true;n=n.parent;}return false;}
    append(...nodes){for(let n of nodes){if(typeof n!=='object')n=new Node(null,String(n));n.parent=this;this.childNodes.push(n);}}
    replaceChildren(...nodes){for(const n of this.childNodes)n.parent=null;this.childNodes=[];this.append(...nodes);}
    setAttribute(name,value){this.attributes[name]=String(value);if(name.startsWith('data-'))this.dataset[camel(name.slice(5))]=String(value);else if(['open','hidden','checked','disabled'].includes(name))this[name]=true;else if(['id','class','type'].includes(name))this[name==='class'?'className':name]=String(value);}
    getAttribute(name){return this.attributes[name];}
    removeAttribute(name){delete this.attributes[name];}
    add(node){this.append(node);if(this.children.length===1)this.value=node.value;}
    prepend(...nodes){const previous=this.childNodes;this.childNodes=[];this.append(...nodes,...previous);}
    remove(){if(this.parent)this.parent.childNodes=this.parent.childNodes.filter(node=>node!==this);this.parent=null;}
    getBoundingClientRect(){return {width:120};}
    showModal(){this.open=true;}
    close(){this.open=false;}
    reset(){for(const node of this.elements){node.value=node.attributes.value||'';node.checked=Object.hasOwn(node.attributes,'checked');}}
    closest(selector){let node=this;while(node){if(node.parent?.querySelectorAll(selector).includes(node))return node;node=node.parent;}return null;}
    addEventListener(name,listener){(this.listeners[name]||=[]).push(listener);}
    async fire(name,event={}){event.target=this;event.preventDefault||=()=>{};await this['on'+name]?.(event);for(const listener of this.listeners[name]||[])await listener(event);}
    click(){return this.fire('click');}
    focus(){document.activeElement=this;}
    scrollIntoView(){}
    checkValidity(){return this.type!=='number'||this.value!==''&&Number.isFinite(Number(this.value))&&(!this.min||Number(this.value)>=Number(this.min))&&(!this.max||Number(this.value)<=Number(this.max));}
    querySelectorAll(selector){const matches=n=>selector.split(',').some(selector=>{
      selector=selector.trim();if(!n.tag)return false;const tag=selector.match(/^[\w-]+/)?.[0];if(tag&&n.tag!==tag)return false;
      const id=selector.match(/#([\w-]+)/)?.[1];if(id&&n.id!==id)return false;for(const [,name]of selector.matchAll(/\.([\w-]+)/g))if(!n.classList.contains(name))return false;
      for(const [,name,quoted,plain]of selector.matchAll(/\[([\w-]+)(?:=(?:"([^"]*)"|([^\]"\s]+)))?\]/g)){
        const value=quoted??plain;
        const current=name.startsWith('data-')?n.dataset[camel(name.slice(5))]:name==='open'?(n.open?'':undefined):n.attributes[name];if(value!==undefined?current!==value:current===undefined)return false;
      }return true;
    });const found=[];const walk=n=>{for(const child of n.childNodes){if(matches(child))found.push(child);walk(child);}};walk(this);return found;}
    querySelector(selector){return this.querySelectorAll(selector)[0]||null;}
  }
  document=new Node('#document');document.createElement=tag=>new Node(tag);document.createTextNode=text=>new Node(null,text);
  document.getElementById=id=>{let found;const walk=n=>{if(n.id===id)found=n;for(const child of n.childNodes)walk(child);};walk(document);return found||null;};
  const stack=[document],voids=new Set(['meta','link','input','br','hr','img','source']);
  for(const token of html.match(/<\/?[\w-]+\b[^>]*>|[^<]+/g)||[]){
    if(token.startsWith('</')){if(stack.length>1)stack.pop();continue;}
    if(token.startsWith('<')){const tag=token.match(/^<([\w-]+)/)[1],node=new Node(tag);for(const [,name,value]of token.slice(tag.length+1,-1).matchAll(/([\w-]+)(?:="([^"]*)")?/g))node.setAttribute(name,value||'');stack.at(-1).append(node);if(!voids.has(tag)&&!token.endsWith('/>'))stack.push(node);}
    else stack.at(-1).append(new Node(null,token));
  }
  document.documentElement=document.querySelector('html');
  for(const node of document.querySelectorAll('select')){node.type='select-one';node.value=node.children.find(child=>child.tag==='option')?.attributes.value||'';}
  for(const node of document.querySelectorAll('option,input'))if(node.attributes.value!==undefined)node.value=node.attributes.value;
  return document;
}
module.exports={documentFixture};
