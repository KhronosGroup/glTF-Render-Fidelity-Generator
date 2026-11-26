/* @license
 * Copyright 2019 Google LLC. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
const canvas = document.createElement('canvas');
const context = canvas.getContext('2d');
class ImageAccessor {
    static fromArrayBuffer(buffer, width, height) {
        return new ImageAccessor(new ImageData(new Uint8ClampedArray(buffer), width, height));
    }
    static fromImageElement(image) {
        canvas.width = image.naturalWidth;
        canvas.height = image.naturalHeight;
        context.drawImage(image, 0, 0);
        return new ImageAccessor(context.getImageData(0, 0, canvas.width, canvas.height));
    }
    toArrayBuffer() {
        const { buffer } = this.source.data;
        return buffer.slice(0, buffer.byteLength);
    }
    cssColorAt(x, y) {
        if (x < 0 || y < 0 || x > (this.width - 1) || y > (this.height - 1)) {
            return 'black';
        }
        const position = (y * this.width + x) * 4;
        const array = this.source.data;
        const color = `rgb(${array[position]}, ${array[position + 1]}, ${array[position + 2]})`;
        return color;
    }
    constructor(source) {
        this.source = source;
    }
    get width() {
        return this.source.width;
    }
    get height() {
        return this.source.height;
    }
}

/**
 * @license
 * Copyright 2019 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const t$1=globalThis,e$4=t$1.ShadowRoot&&(void 0===t$1.ShadyCSS||t$1.ShadyCSS.nativeShadow)&&"adoptedStyleSheets"in Document.prototype&&"replace"in CSSStyleSheet.prototype,s$2=Symbol(),o$4=new WeakMap;let n$3 = class n{constructor(t,e,o){if(this._$cssResult$=true,o!==s$2)throw Error("CSSResult is not constructable. Use `unsafeCSS` or `css` instead.");this.cssText=t,this.t=e;}get styleSheet(){let t=this.o;const s=this.t;if(e$4&&void 0===t){const e=void 0!==s&&1===s.length;e&&(t=o$4.get(s)),void 0===t&&((this.o=t=new CSSStyleSheet).replaceSync(this.cssText),e&&o$4.set(s,t));}return t}toString(){return this.cssText}};const r$3=t=>new n$3("string"==typeof t?t:t+"",void 0,s$2),S$1=(s,o)=>{if(e$4)s.adoptedStyleSheets=o.map(t=>t instanceof CSSStyleSheet?t:t.styleSheet);else for(const e of o){const o=document.createElement("style"),n=t$1.litNonce;void 0!==n&&o.setAttribute("nonce",n),o.textContent=e.cssText,s.appendChild(o);}},c$2=e$4?t=>t:t=>t instanceof CSSStyleSheet?(t=>{let e="";for(const s of t.cssRules)e+=s.cssText;return r$3(e)})(t):t;

/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */const{is:i$2,defineProperty:e$3,getOwnPropertyDescriptor:h$1,getOwnPropertyNames:r$2,getOwnPropertySymbols:o$3,getPrototypeOf:n$2}=Object,a$1=globalThis,c$1=a$1.trustedTypes,l$1=c$1?c$1.emptyScript:"",p$1=a$1.reactiveElementPolyfillSupport,d$1=(t,s)=>t,u$1={toAttribute(t,s){switch(s){case Boolean:t=t?l$1:null;break;case Object:case Array:t=null==t?t:JSON.stringify(t);}return t},fromAttribute(t,s){let i=t;switch(s){case Boolean:i=null!==t;break;case Number:i=null===t?null:Number(t);break;case Object:case Array:try{i=JSON.parse(t);}catch(t){i=null;}}return i}},f$1=(t,s)=>!i$2(t,s),b$1={attribute:true,type:String,converter:u$1,reflect:false,useDefault:false,hasChanged:f$1};Symbol.metadata??=Symbol("metadata"),a$1.litPropertyMetadata??=new WeakMap;let y$1 = class y extends HTMLElement{static addInitializer(t){this._$Ei(),(this.l??=[]).push(t);}static get observedAttributes(){return this.finalize(),this._$Eh&&[...this._$Eh.keys()]}static createProperty(t,s=b$1){if(s.state&&(s.attribute=false),this._$Ei(),this.prototype.hasOwnProperty(t)&&((s=Object.create(s)).wrapped=true),this.elementProperties.set(t,s),!s.noAccessor){const i=Symbol(),h=this.getPropertyDescriptor(t,i,s);void 0!==h&&e$3(this.prototype,t,h);}}static getPropertyDescriptor(t,s,i){const{get:e,set:r}=h$1(this.prototype,t)??{get(){return this[s]},set(t){this[s]=t;}};return {get:e,set(s){const h=e?.call(this);r?.call(this,s),this.requestUpdate(t,h,i);},configurable:true,enumerable:true}}static getPropertyOptions(t){return this.elementProperties.get(t)??b$1}static _$Ei(){if(this.hasOwnProperty(d$1("elementProperties")))return;const t=n$2(this);t.finalize(),void 0!==t.l&&(this.l=[...t.l]),this.elementProperties=new Map(t.elementProperties);}static finalize(){if(this.hasOwnProperty(d$1("finalized")))return;if(this.finalized=true,this._$Ei(),this.hasOwnProperty(d$1("properties"))){const t=this.properties,s=[...r$2(t),...o$3(t)];for(const i of s)this.createProperty(i,t[i]);}const t=this[Symbol.metadata];if(null!==t){const s=litPropertyMetadata.get(t);if(void 0!==s)for(const[t,i]of s)this.elementProperties.set(t,i);}this._$Eh=new Map;for(const[t,s]of this.elementProperties){const i=this._$Eu(t,s);void 0!==i&&this._$Eh.set(i,t);}this.elementStyles=this.finalizeStyles(this.styles);}static finalizeStyles(s){const i=[];if(Array.isArray(s)){const e=new Set(s.flat(1/0).reverse());for(const s of e)i.unshift(c$2(s));}else void 0!==s&&i.push(c$2(s));return i}static _$Eu(t,s){const i=s.attribute;return  false===i?void 0:"string"==typeof i?i:"string"==typeof t?t.toLowerCase():void 0}constructor(){super(),this._$Ep=void 0,this.isUpdatePending=false,this.hasUpdated=false,this._$Em=null,this._$Ev();}_$Ev(){this._$ES=new Promise(t=>this.enableUpdating=t),this._$AL=new Map,this._$E_(),this.requestUpdate(),this.constructor.l?.forEach(t=>t(this));}addController(t){(this._$EO??=new Set).add(t),void 0!==this.renderRoot&&this.isConnected&&t.hostConnected?.();}removeController(t){this._$EO?.delete(t);}_$E_(){const t=new Map,s=this.constructor.elementProperties;for(const i of s.keys())this.hasOwnProperty(i)&&(t.set(i,this[i]),delete this[i]);t.size>0&&(this._$Ep=t);}createRenderRoot(){const t=this.shadowRoot??this.attachShadow(this.constructor.shadowRootOptions);return S$1(t,this.constructor.elementStyles),t}connectedCallback(){this.renderRoot??=this.createRenderRoot(),this.enableUpdating(true),this._$EO?.forEach(t=>t.hostConnected?.());}enableUpdating(t){}disconnectedCallback(){this._$EO?.forEach(t=>t.hostDisconnected?.());}attributeChangedCallback(t,s,i){this._$AK(t,i);}_$ET(t,s){const i=this.constructor.elementProperties.get(t),e=this.constructor._$Eu(t,i);if(void 0!==e&&true===i.reflect){const h=(void 0!==i.converter?.toAttribute?i.converter:u$1).toAttribute(s,i.type);this._$Em=t,null==h?this.removeAttribute(e):this.setAttribute(e,h),this._$Em=null;}}_$AK(t,s){const i=this.constructor,e=i._$Eh.get(t);if(void 0!==e&&this._$Em!==e){const t=i.getPropertyOptions(e),h="function"==typeof t.converter?{fromAttribute:t.converter}:void 0!==t.converter?.fromAttribute?t.converter:u$1;this._$Em=e;const r=h.fromAttribute(s,t.type);this[e]=r??this._$Ej?.get(e)??r,this._$Em=null;}}requestUpdate(t,s,i,e=false,h){if(void 0!==t){const r=this.constructor;if(false===e&&(h=this[t]),i??=r.getPropertyOptions(t),!((i.hasChanged??f$1)(h,s)||i.useDefault&&i.reflect&&h===this._$Ej?.get(t)&&!this.hasAttribute(r._$Eu(t,i))))return;this.C(t,s,i);} false===this.isUpdatePending&&(this._$ES=this._$EP());}C(t,s,{useDefault:i,reflect:e,wrapped:h},r){i&&!(this._$Ej??=new Map).has(t)&&(this._$Ej.set(t,r??s??this[t]),true!==h||void 0!==r)||(this._$AL.has(t)||(this.hasUpdated||i||(s=void 0),this._$AL.set(t,s)),true===e&&this._$Em!==t&&(this._$Eq??=new Set).add(t));}async _$EP(){this.isUpdatePending=true;try{await this._$ES;}catch(t){Promise.reject(t);}const t=this.scheduleUpdate();return null!=t&&await t,!this.isUpdatePending}scheduleUpdate(){return this.performUpdate()}performUpdate(){if(!this.isUpdatePending)return;if(!this.hasUpdated){if(this.renderRoot??=this.createRenderRoot(),this._$Ep){for(const[t,s]of this._$Ep)this[t]=s;this._$Ep=void 0;}const t=this.constructor.elementProperties;if(t.size>0)for(const[s,i]of t){const{wrapped:t}=i,e=this[s];true!==t||this._$AL.has(s)||void 0===e||this.C(s,void 0,i,e);}}let t=false;const s=this._$AL;try{t=this.shouldUpdate(s),t?(this.willUpdate(s),this._$EO?.forEach(t=>t.hostUpdate?.()),this.update(s)):this._$EM();}catch(s){throw t=false,this._$EM(),s}t&&this._$AE(s);}willUpdate(t){}_$AE(t){this._$EO?.forEach(t=>t.hostUpdated?.()),this.hasUpdated||(this.hasUpdated=true,this.firstUpdated(t)),this.updated(t);}_$EM(){this._$AL=new Map,this.isUpdatePending=false;}get updateComplete(){return this.getUpdateComplete()}getUpdateComplete(){return this._$ES}shouldUpdate(t){return  true}update(t){this._$Eq&&=this._$Eq.forEach(t=>this._$ET(t,this[t])),this._$EM();}updated(t){}firstUpdated(t){}};y$1.elementStyles=[],y$1.shadowRootOptions={mode:"open"},y$1[d$1("elementProperties")]=new Map,y$1[d$1("finalized")]=new Map,p$1?.({ReactiveElement:y$1}),(a$1.reactiveElementVersions??=[]).push("2.1.2");

/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const t=globalThis,i$1=t=>t,s$1=t.trustedTypes,e$2=s$1?s$1.createPolicy("lit-html",{createHTML:t=>t}):void 0,h="$lit$",o$2=`lit$${Math.random().toFixed(9).slice(2)}$`,n$1="?"+o$2,r$1=`<${n$1}>`,l=document,c=()=>l.createComment(""),a=t=>null===t||"object"!=typeof t&&"function"!=typeof t,u=Array.isArray,d=t=>u(t)||"function"==typeof t?.[Symbol.iterator],f="[ \t\n\f\r]",v=/<(?:(!--|\/[^a-zA-Z])|(\/?[a-zA-Z][^>\s]*)|(\/?$))/g,_=/-->/g,m=/>/g,p=RegExp(`>|${f}(?:([^\\s"'>=/]+)(${f}*=${f}*(?:[^ \t\n\f\r"'\`<>=]|("|')|))|$)`,"g"),g=/'/g,$=/"/g,y=/^(?:script|style|textarea|title)$/i,x=t=>(i,...s)=>({_$litType$:t,strings:i,values:s}),b=x(1),E=Symbol.for("lit-noChange"),A=Symbol.for("lit-nothing"),C=new WeakMap,P=l.createTreeWalker(l,129);function V(t,i){if(!u(t)||!t.hasOwnProperty("raw"))throw Error("invalid template strings array");return void 0!==e$2?e$2.createHTML(i):i}const N=(t,i)=>{const s=t.length-1,e=[];let n,l=2===i?"<svg>":3===i?"<math>":"",c=v;for(let i=0;i<s;i++){const s=t[i];let a,u,d=-1,f=0;for(;f<s.length&&(c.lastIndex=f,u=c.exec(s),null!==u);)f=c.lastIndex,c===v?"!--"===u[1]?c=_:void 0!==u[1]?c=m:void 0!==u[2]?(y.test(u[2])&&(n=RegExp("</"+u[2],"g")),c=p):void 0!==u[3]&&(c=p):c===p?">"===u[0]?(c=n??v,d=-1):void 0===u[1]?d=-2:(d=c.lastIndex-u[2].length,a=u[1],c=void 0===u[3]?p:'"'===u[3]?$:g):c===$||c===g?c=p:c===_||c===m?c=v:(c=p,n=void 0);const x=c===p&&t[i+1].startsWith("/>")?" ":"";l+=c===v?s+r$1:d>=0?(e.push(a),s.slice(0,d)+h+s.slice(d)+o$2+x):s+o$2+(-2===d?i:x);}return [V(t,l+(t[s]||"<?>")+(2===i?"</svg>":3===i?"</math>":"")),e]};class S{constructor({strings:t,_$litType$:i},e){let r;this.parts=[];let l=0,a=0;const u=t.length-1,d=this.parts,[f,v]=N(t,i);if(this.el=S.createElement(f,e),P.currentNode=this.el.content,2===i||3===i){const t=this.el.content.firstChild;t.replaceWith(...t.childNodes);}for(;null!==(r=P.nextNode())&&d.length<u;){if(1===r.nodeType){if(r.hasAttributes())for(const t of r.getAttributeNames())if(t.endsWith(h)){const i=v[a++],s=r.getAttribute(t).split(o$2),e=/([.?@])?(.*)/.exec(i);d.push({type:1,index:l,name:e[2],strings:s,ctor:"."===e[1]?I:"?"===e[1]?L:"@"===e[1]?z:H}),r.removeAttribute(t);}else t.startsWith(o$2)&&(d.push({type:6,index:l}),r.removeAttribute(t));if(y.test(r.tagName)){const t=r.textContent.split(o$2),i=t.length-1;if(i>0){r.textContent=s$1?s$1.emptyScript:"";for(let s=0;s<i;s++)r.append(t[s],c()),P.nextNode(),d.push({type:2,index:++l});r.append(t[i],c());}}}else if(8===r.nodeType)if(r.data===n$1)d.push({type:2,index:l});else {let t=-1;for(;-1!==(t=r.data.indexOf(o$2,t+1));)d.push({type:7,index:l}),t+=o$2.length-1;}l++;}}static createElement(t,i){const s=l.createElement("template");return s.innerHTML=t,s}}function M(t,i,s=t,e){if(i===E)return i;let h=void 0!==e?s._$Co?.[e]:s._$Cl;const o=a(i)?void 0:i._$litDirective$;return h?.constructor!==o&&(h?._$AO?.(false),void 0===o?h=void 0:(h=new o(t),h._$AT(t,s,e)),void 0!==e?(s._$Co??=[])[e]=h:s._$Cl=h),void 0!==h&&(i=M(t,h._$AS(t,i.values),h,e)),i}class R{constructor(t,i){this._$AV=[],this._$AN=void 0,this._$AD=t,this._$AM=i;}get parentNode(){return this._$AM.parentNode}get _$AU(){return this._$AM._$AU}u(t){const{el:{content:i},parts:s}=this._$AD,e=(t?.creationScope??l).importNode(i,true);P.currentNode=e;let h=P.nextNode(),o=0,n=0,r=s[0];for(;void 0!==r;){if(o===r.index){let i;2===r.type?i=new k(h,h.nextSibling,this,t):1===r.type?i=new r.ctor(h,r.name,r.strings,this,t):6===r.type&&(i=new Z(h,this,t)),this._$AV.push(i),r=s[++n];}o!==r?.index&&(h=P.nextNode(),o++);}return P.currentNode=l,e}p(t){let i=0;for(const s of this._$AV) void 0!==s&&(void 0!==s.strings?(s._$AI(t,s,i),i+=s.strings.length-2):s._$AI(t[i])),i++;}}class k{get _$AU(){return this._$AM?._$AU??this._$Cv}constructor(t,i,s,e){this.type=2,this._$AH=A,this._$AN=void 0,this._$AA=t,this._$AB=i,this._$AM=s,this.options=e,this._$Cv=e?.isConnected??true;}get parentNode(){let t=this._$AA.parentNode;const i=this._$AM;return void 0!==i&&11===t?.nodeType&&(t=i.parentNode),t}get startNode(){return this._$AA}get endNode(){return this._$AB}_$AI(t,i=this){t=M(this,t,i),a(t)?t===A||null==t||""===t?(this._$AH!==A&&this._$AR(),this._$AH=A):t!==this._$AH&&t!==E&&this._(t):void 0!==t._$litType$?this.$(t):void 0!==t.nodeType?this.T(t):d(t)?this.k(t):this._(t);}O(t){return this._$AA.parentNode.insertBefore(t,this._$AB)}T(t){this._$AH!==t&&(this._$AR(),this._$AH=this.O(t));}_(t){this._$AH!==A&&a(this._$AH)?this._$AA.nextSibling.data=t:this.T(l.createTextNode(t)),this._$AH=t;}$(t){const{values:i,_$litType$:s}=t,e="number"==typeof s?this._$AC(t):(void 0===s.el&&(s.el=S.createElement(V(s.h,s.h[0]),this.options)),s);if(this._$AH?._$AD===e)this._$AH.p(i);else {const t=new R(e,this),s=t.u(this.options);t.p(i),this.T(s),this._$AH=t;}}_$AC(t){let i=C.get(t.strings);return void 0===i&&C.set(t.strings,i=new S(t)),i}k(t){u(this._$AH)||(this._$AH=[],this._$AR());const i=this._$AH;let s,e=0;for(const h of t)e===i.length?i.push(s=new k(this.O(c()),this.O(c()),this,this.options)):s=i[e],s._$AI(h),e++;e<i.length&&(this._$AR(s&&s._$AB.nextSibling,e),i.length=e);}_$AR(t=this._$AA.nextSibling,s){for(this._$AP?.(false,true,s);t!==this._$AB;){const s=i$1(t).nextSibling;i$1(t).remove(),t=s;}}setConnected(t){ void 0===this._$AM&&(this._$Cv=t,this._$AP?.(t));}}class H{get tagName(){return this.element.tagName}get _$AU(){return this._$AM._$AU}constructor(t,i,s,e,h){this.type=1,this._$AH=A,this._$AN=void 0,this.element=t,this.name=i,this._$AM=e,this.options=h,s.length>2||""!==s[0]||""!==s[1]?(this._$AH=Array(s.length-1).fill(new String),this.strings=s):this._$AH=A;}_$AI(t,i=this,s,e){const h=this.strings;let o=false;if(void 0===h)t=M(this,t,i,0),o=!a(t)||t!==this._$AH&&t!==E,o&&(this._$AH=t);else {const e=t;let n,r;for(t=h[0],n=0;n<h.length-1;n++)r=M(this,e[s+n],i,n),r===E&&(r=this._$AH[n]),o||=!a(r)||r!==this._$AH[n],r===A?t=A:t!==A&&(t+=(r??"")+h[n+1]),this._$AH[n]=r;}o&&!e&&this.j(t);}j(t){t===A?this.element.removeAttribute(this.name):this.element.setAttribute(this.name,t??"");}}class I extends H{constructor(){super(...arguments),this.type=3;}j(t){this.element[this.name]=t===A?void 0:t;}}class L extends H{constructor(){super(...arguments),this.type=4;}j(t){this.element.toggleAttribute(this.name,!!t&&t!==A);}}class z extends H{constructor(t,i,s,e,h){super(t,i,s,e,h),this.type=5;}_$AI(t,i=this){if((t=M(this,t,i,0)??A)===E)return;const s=this._$AH,e=t===A&&s!==A||t.capture!==s.capture||t.once!==s.once||t.passive!==s.passive,h=t!==A&&(s===A||e);e&&this.element.removeEventListener(this.name,this,s),h&&this.element.addEventListener(this.name,this,t),this._$AH=t;}handleEvent(t){"function"==typeof this._$AH?this._$AH.call(this.options?.host??this.element,t):this._$AH.handleEvent(t);}}class Z{constructor(t,i,s){this.element=t,this.type=6,this._$AN=void 0,this._$AM=i,this.options=s;}get _$AU(){return this._$AM._$AU}_$AI(t){M(this,t);}}const B=t.litHtmlPolyfillSupport;B?.(S,k),(t.litHtmlVersions??=[]).push("3.3.3");const D=(t,i,s)=>{const e=s?.renderBefore??i;let h=e._$litPart$;if(void 0===h){const t=s?.renderBefore??null;e._$litPart$=h=new k(i.insertBefore(c(),t),t,void 0,s??{});}return h._$AI(t),h};

/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */const s=globalThis;class i extends y$1{constructor(){super(...arguments),this.renderOptions={host:this},this._$Do=void 0;}createRenderRoot(){const t=super.createRenderRoot();return this.renderOptions.renderBefore??=t.firstChild,t}update(t){const r=this.render();this.hasUpdated||(this.renderOptions.isConnected=this.isConnected),super.update(t),this._$Do=D(r,this.renderRoot,this.renderOptions);}connectedCallback(){super.connectedCallback(),this._$Do?.setConnected(true);}disconnectedCallback(){super.disconnectedCallback(),this._$Do?.setConnected(false);}render(){return E}}i._$litElement$=true,i["finalized"]=true,s.litElementHydrateSupport?.({LitElement:i});const o$1=s.litElementPolyfillSupport;o$1?.({LitElement:i});(s.litElementVersions??=[]).push("4.2.2");

/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */const o={attribute:true,type:String,converter:u$1,reflect:false,hasChanged:f$1},r=(t=o,e,r)=>{const{kind:n,metadata:i}=r;let s=globalThis.litPropertyMetadata.get(i);if(void 0===s&&globalThis.litPropertyMetadata.set(i,s=new Map),"setter"===n&&((t=Object.create(t)).wrapped=true),s.set(r.name,t),"accessor"===n){const{name:o}=r;return {set(r){const n=e.get.call(this);e.set.call(this,r),this.requestUpdate(o,n,t,true,r);},init(e){return void 0!==e&&this.C(o,void 0,t,e),e}}}if("setter"===n){const{name:o}=r;return function(r){const n=this[o];e.call(this,r),this.requestUpdate(o,n,t,true,r);}}throw Error("Unsupported decorator location: "+n)};function n(t){return (e,o)=>"object"==typeof o?r(t,e,o):((t,e,o)=>{const r=e.hasOwnProperty(o);return e.constructor.createProperty(o,t),r?Object.getOwnPropertyDescriptor(e,o):void 0})(t,e,o)}

/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const e$1=(e,t,c)=>(c.configurable=true,c.enumerable=true,c);

/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */function e(e,r){return (n,s,i)=>{const o=t=>t.renderRoot?.querySelector(e)??null;return e$1(n,s,{get(){return o(this)}})}}

/* @license
 * Copyright 2019 Google LLC. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
var __decorate$4 = (undefined && undefined.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
const PIXEL_SIZE = 10;
class MagnifyingGlass extends i {
    constructor() {
        super(...arguments);
        this.imageAccessor = null;
        this.pixel = null;
        this.direction = 'vertical';
        this.position = { x: 0, y: 0 };
        this.context = null;
        this.xRay = true;
        this.reticleSize = 1;
    }
    enhance() {
        if (this.pixel == null || this.imageAccessor == null) {
            return;
        }
        this.classList.remove('hidden');
        if (this.context == null) {
            const canvas = this.shadowRoot.querySelector('canvas');
            if (canvas == null) {
                return;
            }
            this.context = canvas.getContext('2d');
        }
        const { context } = this;
        const rect = this.getBoundingClientRect();
        const scale = rect.width / this.imageAccessor.width;
        for (let y = 0; y < 24; ++y) {
            for (let x = 0; x < 24; ++x) {
                context.fillStyle = this.imageAccessor.cssColorAt(this.pixel.x + x - 12, this.pixel.y + y - 12);
                context.fillRect(x * PIXEL_SIZE, y * PIXEL_SIZE, PIXEL_SIZE, PIXEL_SIZE);
            }
        }
        this.reticleSize = Math.round(26 * scale);
        this.position = {
            x: this.pixel.x * scale - 130,
            y: this.pixel.y * scale - 130
        };
    }
    toggleXRay() {
        this.xRay = !this.xRay;
    }
    hide() {
        this.classList.add('hidden');
    }
    get glassPosition() {
        const { width, height } = this.imageAccessor != null ? this.imageAccessor : { width: 0, height: 0 };
        const { x, y } = this.pixel != null ? this.pixel : { x: 0, y: 0 };
        return this.direction === 'horizontal' ?
            x < (width / 2) ? 'right' : 'left' :
            y < (height / 2) ? 'bottom' : 'top';
    }
    render() {
        this.enhance();
        return b `
<style>
:host {
  display: block;
  position: relative;
}

#glass {
  display: block;
  position: absolute;
  box-sizing: border-box;
  top: 0;
  left: 0;
  width: 260px;
  height: 260px;
  transition: transform 0.1s;
  z-index: 1;
  background-color: transparent;
}

canvas {
  box-sizing: border-box;
  box-shadow: 0 2px 10px rgba(40, 40, 40, 0.25);
  width: 100%;
  height: 100%;
  transition: opacity 0.3s, transform 0.5s;
  opacity: 1;
}

#glass.top canvas {
  transform: translate(0, -180px);
}

#glass.bottom canvas {
  transform: translate(0, 180px);
}

#glass.left canvas {
  transform: translate(-180px, 0);
}

#glass.right canvas {
  transform: translate(180px, 0);
}

#glass:before {
  content: '';
  display: block;
  position: absolute;
  top: 0;
  left: 0;
  transform: translate(calc(-50% + 130px), calc(130px - var(--reticle-size) / 2));
  box-sizing: border-box;
  border: 1px solid black;
  width: var(--reticle-size);
  height: var(--reticle-size);
}

#glass:after {
  content: '';
  display: block;
  position: absolute;
  top: 0;
  left: 0;
  transform: translate(calc(-50% + 130px), calc(129px - var(--reticle-size) / 2));
  box-sizing: border-box;

  border: 1px solid white;

  width: calc(var(--reticle-size) + 2px);
  height: calc(var(--reticle-size) + 2px);
}

:host(.hidden) canvas {
  opacity: 0;
}
</style>
<slot></slot>
<div id="glass"
    class="${this.glassPosition}"
    style="transform: translate(${this.position.x}px, ${this.position.y}px); --reticle-size: ${this.reticleSize}px"
    @click="${() => this.toggleXRay()}">
  <canvas style="opacity: ${this.xRay ? 0 : 1};" width="240" height="240">
</div>
</canvas>
`;
    }
}
__decorate$4([
    n({ type: Object })
], MagnifyingGlass.prototype, "imageAccessor", void 0);
__decorate$4([
    n({ type: Object })
], MagnifyingGlass.prototype, "pixel", void 0);
__decorate$4([
    n({ type: String })
], MagnifyingGlass.prototype, "direction", void 0);
__decorate$4([
    n({ type: Object })
], MagnifyingGlass.prototype, "position", void 0);
__decorate$4([
    n({ type: Boolean })
], MagnifyingGlass.prototype, "xRay", void 0);
__decorate$4([
    n({ type: Number })
], MagnifyingGlass.prototype, "reticleSize", void 0);
customElements.define('magnifying-glass', MagnifyingGlass);

/* @license
 * Copyright 2019 Google LLC. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
var __decorate$3 = (undefined && undefined.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
class Images4Up extends i {
    constructor() {
        super(...arguments);
        this.topLeftImageAccessor = null;
        this.topRightImageAccessor = null;
        this.bottomLeftImageAccessor = null;
        this.bottomRightImageAccessor = null;
        this.magnifiedPixel = null;
        this.dimensions = { width: 0, height: 0 };
        this.containerRect = { x: 0, y: 0, width: 0, height: 0 };
    }
    localCoordinateToImagePixel(localX, localY) {
        const constrainedX = Math.min(Math.max(localX - this.containerRect.x, -1), this.containerRect.width + 1);
        const constrainedY = Math.min(Math.max(localY - this.containerRect.y, -1), this.containerRect.height + 1);
        const scaledWidth = this.containerRect.width / 2;
        const scaledHeight = this.containerRect.height / 2;
        const scale = this.dimensions.width / scaledWidth;
        return {
            x: Math.floor((constrainedX % scaledWidth) * scale),
            y: Math.floor((constrainedY % scaledHeight) * scale)
        };
    }
    selectPixel(pixel) {
        this.magnifiedPixel = pixel;
        this.dispatchEvent(new CustomEvent('select-pixel', { detail: pixel }));
    }
    onPointerEvent(event) {
        const pixel = this.localCoordinateToImagePixel(event.x, event.y);
        if (pixel.x > -1 && pixel.x < this.dimensions.width && pixel.y > -1 &&
            pixel.y < this.dimensions.height) {
            this.selectPixel(pixel);
        }
        else {
            this.magnifiedPixel = null;
        }
    }
    connectedCallback() {
        super.connectedCallback && super.connectedCallback();
        self.addEventListener('resize', (_event) => this.updateSize());
    }
    updateSize() {
        const rect = this.getBoundingClientRect();
        const { width: containerWidth, height: containerHeight } = rect;
        const fourUpWidth = 2 * this.dimensions.width;
        const fourUpHeight = 2 * this.dimensions.height;
        const containerAspectRatio = containerWidth / containerHeight;
        const fourUpAspectRatio = fourUpWidth / fourUpHeight;
        const scale = fourUpAspectRatio < containerAspectRatio ?
            containerHeight / fourUpHeight :
            containerWidth / fourUpWidth;
        const width = scale * fourUpWidth;
        const height = scale * fourUpHeight;
        const x = (containerWidth - width) / 2;
        const y = (containerHeight - height) / 2;
        this.containerRect = { x, y, width, height };
    }
    async updated(changedProperties) {
        super.updated(changedProperties);
        if (changedProperties.has('dimensions') && this.dimensions != null) {
            this.updateSize();
            this.selectPixel({
                x: Math.floor(this.dimensions.width / 2),
                y: Math.floor(this.dimensions.height / 2)
            });
        }
    }
    render() {
        const { x, y, width, height } = this.containerRect;
        return b `
<style>
:host {
  display: block;
  position: relative;
}

magnifying-glass {
  flex: 1 1 50%;
  width: 50%;
  height: 50%;
}

#container {
  display: flex;
  cursor: crosshair;
  position: absolute;
  flex-direction: row;
  flex-wrap: wrap;
  align-items: flex-start;
  justify-content: flex-start;
}

#magnifier-button {
  position: absolute;
  top: 0;
  right: 0;
}
</style>
<div id="container"
    @pointermove="${(event) => this.onPointerEvent(event)}"
    @pointerdown="${(event) => this.onPointerEvent(event)}"
    style="transform: translate(${x}px, ${y}px);
           width: ${width}px;
           height: ${height}px">
  <magnifying-glass id="top-left"
      .pixel="${this.magnifiedPixel}"
      .imageAccessor="${this.topLeftImageAccessor}">
    <slot name="top-left"></slot>
  </magnifying-glass>
  <magnifying-glass id="top-right"
      .pixel="${this.magnifiedPixel}"
      .imageAccessor="${this.topRightImageAccessor}">
    <slot name="top-right"></slot>
  </magnifying-glass>
  <magnifying-glass id="bottom-left"
      .pixel="${this.magnifiedPixel}"
      .imageAccessor="${this.bottomLeftImageAccessor}">
    <slot name="bottom-left"></slot>
  </magnifying-glass>
  <magnifying-glass id="bottom-right"
      .pixel="${this.magnifiedPixel}"
      .imageAccessor="${this.bottomRightImageAccessor}">
    <slot name="bottom-right"></slot>
  </magnifying-glass>
</div>`;
    }
}
__decorate$3([
    n({ type: Object })
], Images4Up.prototype, "topLeftImageAccessor", void 0);
__decorate$3([
    n({ type: Object })
], Images4Up.prototype, "topRightImageAccessor", void 0);
__decorate$3([
    n({ type: Object })
], Images4Up.prototype, "bottomLeftImageAccessor", void 0);
__decorate$3([
    n({ type: Object })
], Images4Up.prototype, "bottomRightImageAccessor", void 0);
__decorate$3([
    n({ type: Object })
], Images4Up.prototype, "magnifiedPixel", void 0);
__decorate$3([
    n({ type: Object })
], Images4Up.prototype, "dimensions", void 0);
__decorate$3([
    n({ type: Object })
], Images4Up.prototype, "containerRect", void 0);
customElements.define('images-4-up', Images4Up);

/* @license
 * Copyright 2019 Google LLC. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
var __decorate$2 = (undefined && undefined.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
class AnalysisView extends i {
    constructor() {
        super();
        this.leftImage = null;
        this.rightImage = null;
        this.visuals = null;
        this.leftImageAccessor = null;
        this.rightImageAccessor = null;
        this.blackWhiteImageAccessor = null;
        this.deltaImageAccessor = null;
        this.threshold = 5;
        const channel = new MessageChannel();
        this.port = channel.port1;
        this.worker = new Worker('../dist/image-comparison-worker.js');
        this.worker.postMessage('connect', [channel.port2]);
        this.port.onmessage = (event) => this.onMessage(event);
        this.port.start();
    }
    onMessage(event) {
        const data = event.data;
        const { type } = data;
        switch (type) {
            case 'analysis-completed':
                this.visuals = data.result;
                break;
        }
    }
    async connectedCallback() {
        super.connectedCallback && super.connectedCallback();
        await this.updateComplete;
        const candidateCanvas = this.shadowRoot.querySelector('canvas[slot="top-left"]')
            .transferControlToOffscreen();
        const goldenCanvas = this.shadowRoot.querySelector('canvas[slot="top-right"]')
            .transferControlToOffscreen();
        const blackWhiteCanvas = this.shadowRoot.querySelector('canvas[slot="bottom-left"]')
            .transferControlToOffscreen();
        const deltaCanvas = this.shadowRoot.querySelector('canvas[slot="bottom-right"]')
            .transferControlToOffscreen();
        this.port.postMessage({
            type: 'canvases-ready',
            candidateCanvas,
            goldenCanvas,
            blackWhiteCanvas,
            deltaCanvas
        }, [candidateCanvas, goldenCanvas, blackWhiteCanvas, deltaCanvas]);
    }
    pick(originatingElement) {
        if (originatingElement.parentNode
            .classList.contains('selected')) {
            this.deselect(originatingElement);
        }
        else {
            this.select(originatingElement);
        }
    }
    get canCompareImages() {
        return this.leftImage != null && this.rightImage != null;
    }
    deselect(element) {
        if (this.leftImage === element) {
            this.leftImage = this.rightImage;
            this.rightImage = null;
        }
        else if (this.rightImage === element) {
            this.rightImage = null;
        }
        element.parentNode.classList.remove('selected');
    }
    select(element) {
        if (this.leftImage == null) {
            this.leftImage = element;
        }
        else if (this.rightImage == null) {
            this.rightImage = element;
        }
        else {
            return;
        }
        element.parentNode.classList.add('selected');
    }
    enterAnalysisView() {
        if (this.canCompareImages) {
            this.classList.add('compare');
        }
    }
    exitAnalysisView() {
        this.classList.remove('compare');
    }
    reset() {
        if (this.rightImage != null) {
            this.deselect(this.rightImage);
        }
        if (this.leftImage != null) {
            this.deselect(this.leftImage);
        }
    }
    get comparisonDimensions() {
        if (this.canCompareImages) {
            const width = Math.max(this.leftImage.naturalWidth, this.rightImage.naturalWidth);
            const height = Math.max(this.leftImage.naturalHeight, this.rightImage.naturalHeight);
            return { width, height };
        }
        return { width: 0, height: 0 };
    }
    async updated(changedProperties) {
        super.updated(changedProperties);
        if (changedProperties.has('analysisResult') && this.visuals != null &&
            this.canCompareImages) {
            const { imageBuffers } = this.visuals;
            const { width, height } = this.comparisonDimensions;
            this.blackWhiteImageAccessor = ImageAccessor.fromArrayBuffer(imageBuffers.blackWhite, width, height);
            this.deltaImageAccessor =
                ImageAccessor.fromArrayBuffer(imageBuffers.delta, width, height);
        }
        if ((changedProperties.has('leftImage') ||
            changedProperties.has('rightImage')) &&
            this.canCompareImages) {
            this.leftImageAccessor = ImageAccessor.fromImageElement(this.leftImage);
            this.rightImageAccessor =
                ImageAccessor.fromImageElement(this.rightImage);
            const { width, height } = this.comparisonDimensions;
            const candidateImageBuffer = this.leftImageAccessor.toArrayBuffer();
            const goldenImageBuffer = this.rightImageAccessor.toArrayBuffer();
            this.port.postMessage({
                type: 'images-assigned',
                candidateImageBuffer,
                goldenImageBuffer,
                dimensions: { width, height }
            }, [
                candidateImageBuffer,
                goldenImageBuffer
            ]);
            this.port.postMessage({ type: 'threshold-changed', threshold: this.threshold });
        }
        if (changedProperties.has('threshold') && this.canCompareImages) {
            this.port.postMessage({ type: 'threshold-changed', threshold: this.threshold });
        }
    }
    render() {
        let instructions;
        if (this.canCompareImages) {
            instructions = b `
<button @click="${() => this.enterAnalysisView()}">
  Compare selected images
</button>
<button @click="${() => this.reset()}" class="no-border">
  Clear selections
</button>`;
        }
        else {
            instructions = b `<p>Select two images to compare them!</p>`;
        }
        return b `
<style>
:host {
  display: block;
  position: fixed;
  width: 100vw;
  bottom: 0;
  left: 0;

  font-family: Google Sans, sans-serif;
  background-color: #37474f;
  color: #fff;

  box-shadow: 0px 3px 12px rgba(100, 100, 100, 0.3);
}

#instructions {
  text-align: center;
  font-style: italic;
  padding: 1em;
}

button {
  font-family: Google Sans, sans-serif;
  text-transform: uppercase;
  color: #fff;
  background-color: #37474f;
  border: 1px solid #fff;
  border-radius: 3px;
  font-size: 1.1em;
  font-weight: 200;
  padding: 0.45em 0.85em;
  cursor: pointer;
}

button {
  margin: 0.35em 0;
}

button:hover, button:focus {
  background-color: #62727b;
}

#comparison {
  display: flex;
  position: fixed;
  flex-direction: column;
  align-items: stretch;
  justify-content: center;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  box-sizing: border-box;
  background-color: #37474f;
  transform: translateY(1vh);
  opacity: 0;
  pointer-events: none;
  transition: transform 0.3s, opacity 0.3s;
}

:host(.compare) #comparison {
  transform: translateY(0);
  opacity: 1;
  pointer-events: unset;
}

button.no-border {
  border: none;
}

.exit {
  margin: 0;
  border: 0;
  font-size: 0;
  line-height: 0;

  position: absolute;
  right: 32px;
  top: 32px;
  width: 32px;
  height: 32px;
  opacity: 0.75;
}

.exit:hover {
  opacity: 1;
}

.exit:before, .exit:after {
  content: ' ';
  position: absolute;
  top: 0px;
  left: 15px;
  height: 33px;
  width: 2px;
  background-color: #fff;
}

.exit:before {
  transform: rotate(45deg);
}
.exit:after {
  transform: rotate(-45deg);
}

images-4-up {
  flex: 1 1 100%;
}

#controls {
  display: flex;
  align-items: center;
  justify-content: center;
  flex: 1 1 90px;

  gap: 12px;

  color: #fff;
}

#controls input[type=range] {
  width: 200px;
  accent-color: #fff;
}

#controls output {
  min-width: 2ch;
}

canvas {
  width: 100%;
  height: 100%;
}
</style>
<div id="instructions">
  ${instructions}
</div>
<div id="comparison">
  <images-4-up .dimensions="${this.comparisonDimensions}"
      .topLeftImageAccessor="${this.leftImageAccessor}"
      .topRightImageAccessor="${this.rightImageAccessor}"
      .bottomLeftImageAccessor="${this.blackWhiteImageAccessor}"
      .bottomRightImageAccessor="${this.deltaImageAccessor}">
    <canvas slot="top-left"></canvas>
    <canvas slot="top-right"></canvas>
    <canvas slot="bottom-left"></canvas>
    <canvas slot="bottom-right"></canvas>
  </images-4-up>
  <div id="controls">
    <label id="threshold-label">Threshold</label>
    <input type="range"
        @change="${(event) => this.threshold =
            parseInt(event.target.value, 10)}"
        aria-labelledby="threshold-label"
        min="0" max="10" step="1" .value="${String(this.threshold)}">
    <output>${this.threshold}</output>
  </div>
  <button class="exit" @click="${() => this.exitAnalysisView()}">Exit</button>
</div>`;
    }
}
__decorate$2([
    n({ type: Object })
], AnalysisView.prototype, "leftImage", void 0);
__decorate$2([
    n({ type: Object })
], AnalysisView.prototype, "rightImage", void 0);
__decorate$2([
    n({ type: Object })
], AnalysisView.prototype, "visuals", void 0);
__decorate$2([
    n({ type: Object })
], AnalysisView.prototype, "leftImageAccessor", void 0);
__decorate$2([
    n({ type: Object })
], AnalysisView.prototype, "rightImageAccessor", void 0);
__decorate$2([
    n({ type: Object })
], AnalysisView.prototype, "blackWhiteImageAccessor", void 0);
__decorate$2([
    n({ type: Object })
], AnalysisView.prototype, "deltaImageAccessor", void 0);
__decorate$2([
    n({ type: Number })
], AnalysisView.prototype, "threshold", void 0);
customElements.define('analysis-view', AnalysisView);

/* @license
 * Copyright 2019 Google LLC. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
function toDecibel(value) {
    return 10 * Math.log10(value);
}

/* @license
 * Copyright 2019 Google LLC. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
var __decorate$1 = (undefined && undefined.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
const DEFAULT_DIMENSIONS = {
    width: 0,
    height: 0
};
class RenderingScenario extends i {
    constructor() {
        super(...arguments);
        this.name = '';
        this.goldens = [];
        this.dimensions = DEFAULT_DIMENSIONS;
        this.exclude = [];
        this.analysis = null;
    }
    get basePath() {
        if (!this.name) {
            return '';
        }
        return `./results/${this.name}`;
    }
    async connectedCallback() {
        super.connectedCallback && super.connectedCallback();
        this.shadowRoot.addEventListener('click', (event) => {
            const originatingElement = event.target;
            if (originatingElement == null || originatingElement.tagName !== 'IMG') {
                return;
            }
            this.dispatchEvent(new CustomEvent('select', { detail: { element: originatingElement } }));
        });
    }
    updated(changedProperties) {
        super.updated(changedProperties);
        if (this.analysis == null) {
            this.loadAnalysis();
        }
    }
    async loadAnalysis() {
        const analysisPath = `${this.basePath}/analysis.json`;
        this.analysis = await (await fetch(analysisPath)).json();
    }
    metricTemplate(analysisResults, goldenName) {
        const rmsInDecibel = toDecibel(analysisResults.rmsDistanceRatio).toFixed(2);
        return b ` <span>${rmsInDecibel} dB </span>
      <div class="tooltip">
        <span class="question-icon"> </span>
        <span class="tooltiptext">
          Root mean square(RMS) color distance between ${goldenName}'s golden
          and model-viewer's on rendering ${this.name} in decibels.
          The decibel is given by: 10 * log(RMS). More negative means a closer match.
        </span>
      </div>`;
    }
    render() {
        const { basePath } = this;
        const { width } = this.dimensions;
        const images = this.goldens.filter(golden => !this.exclude.includes(golden.name))
            .map((golden, index) => b `
              <div class="screenshot">
                <div class="check"></div>
                <img data-id="${this.name} ${golden.name}"
                    style="width:${width}px" src="${basePath}/${golden.file}">
                <header>
                  <h2>${golden.description}</h2>
                </header>
                  <div class = "metrics">
                    ${index == 0 || this.analysis == null ?
            b `<span>---</span>` :
            this.metricTemplate(this.analysis.analysisResults[index - 1], golden.name)}
                  </div>
              </div>`);
        return b `

<style>
:host {
  display: inline-flex;
  flex-direction: column;
  flex: 0 1 auto;
  position: relative;
  margin: 1em;
  padding: 1em;
  border-radius: 3px;
  box-shadow: 0px 2px 8px rgba(100, 100, 100, 0.2);
  background-color: #fff;
  color: #555;
  font-family: Google Sans, sans-serif;
}

h1 {
  font-size: 1.5em;
  margin: 0.166em 0.33em 0.33em;
}

.tooltip {
  position: relative;
  display: inline-block;
}

.tooltip .tooltiptext {
  opacity: 0.4;
  visibility: hidden;
  width: 200px;
  font-size: 0.8em;
  background-color: black;
  color: #fff;
  text-align: left;
  border-radius: 6px;
  padding: 5px 5px;
  position: absolute;
  z-index: 1;
}

.tooltip:hover .tooltiptext {
  visibility: visible;
}

.question-icon {
  background-image: url(../../shared-assets/icons/help_outline-24px.svg);
  background-size : 0.8em;
  background-repeat: no-repeat;
  background-position: 0% 100%;
  width: 1em;
  height: 1em;
  display: inline-block;
}

.metrics {
  text-align: center;
  height: 2em;
}

.screenshot > header {
  display: block;
  text-align: center;
  pointer-events: none;
}

h2 {
  font-size: 1em;

  display: inline-block;
  box-sizing: border-box;

  border-radius: 3px;
  padding: 0.25em 0.5em;
  margin: 0;
  overflow-wrap: anywhere;

  background-color: rgba(255, 255, 255, 0.75);
  pointer-events: none;
}

#screenshots {
  display: flex;
  flex-direction: row;
  width: 100%;
  align-items: flex-start;
  justify-content: center;
  flex-wrap: wrap;
}

.screenshot {
  box-sizing: border-box;
  display: flex;
  position: relative;
  flex-direction: column;
  width: min-content;
  object-fit: contain;
  margin: 0.5em;
  transition: transform 0.3s;
}

.screenshot > img {
  max-width: 256px;
  flex: 0 0 0;
}

.check {
  display: flex;
  position: absolute;
  align-items: center;
  justify-content: center;
  box-sizing: bborder-box;
  top: 0.5em;;
  right: 0.5em;
  width: 1em;
  height: 1em;
  border-radius: 2em;
  border: 2px solid #fff;
  background-color: #f8f8f8;
}

.selected .check {
  background-color: #37474f;
}

.selected .check:after {
  content: '';
  display: block;
  width: 0.25em;
  height: 0.5em;
  border: solid #fff;
  border-width: 0 2px 2px 0;
  transform: translate(-0em, -0.1em) rotate(45deg);
}

.selected {
  transform: translateY(-0.5em) scale(1.025);
  box-shadow: 0px 6px 12px rgba(100, 100, 100, 0.2);
}
</style>
<h1><a href="#${this.name}">${this.name}</a></h1>
<div id="screenshots">
  ${images}
</div>`;
    }
}
__decorate$1([
    n({ type: String })
], RenderingScenario.prototype, "name", void 0);
__decorate$1([
    n({ type: Object })
], RenderingScenario.prototype, "goldens", void 0);
__decorate$1([
    n({ type: Object })
], RenderingScenario.prototype, "dimensions", void 0);
__decorate$1([
    n({ type: Array })
], RenderingScenario.prototype, "exclude", void 0);
__decorate$1([
    n({ type: Object })
], RenderingScenario.prototype, "analysis", void 0);
customElements.define('rendering-scenario', RenderingScenario);

/* @license
 * Copyright 2019 Google LLC. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
var __decorate = (undefined && undefined.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
class ImageComparisonApp extends i {
    constructor() {
        super(...arguments);
        this.src = '';
        this.config = null;
        this.onHashChange = () => {
            if (!location.hash) {
                return;
            }
            const targetElement = this.shadowRoot.querySelector(`${location.hash}`);
            if (targetElement) {
                targetElement.scrollIntoView();
            }
        };
    }
    updated(changedProperties) {
        super.updated(changedProperties);
        if (changedProperties.has('src')) {
            this.loadConfig();
        }
    }
    connectedCallback() {
        super.connectedCallback && super.connectedCallback();
        window.addEventListener('hashchange', this.onHashChange);
    }
    disconnectedCallback() {
        super.connectedCallback && super.connectedCallback();
        window.removeEventListener('hashchange', this.onHashChange);
    }
    async loadConfig() {
        if (this.src) {
            this.config = await (await fetch(this.src)).json();
        }
        else {
            this.config = null;
        }
        await this.updateComplete;
        this.onHashChange();
    }
    selectElement(event) {
        this.analysisView.pick(event.detail.element);
    }
    render() {
        const { config } = this;
        if (config == null) {
            return this.src ? b `Loading...` : b `No config specified`;
        }
        const goldens = config.renderers.map(renderer => ({ ...renderer, file: `${renderer.name}-golden.webp` }));
        const scenarios = config.scenarios.map((scenario) => b `
<rendering-scenario id="${scenario.name}"
    .name="${scenario.name}"
    .goldens="${goldens}"
    .dimensions="${scenario.dimensions}"
    .exclude="${scenario.exclude || []}"
    @select="${this.selectElement}">
</rendering-scenario>`);
        return b `
<style>
#scenarios {
  display: flex;
  flex-direction: column;
  align-items: center;
  max-width: 100%;
  padding-bottom: 5em;
}
</style>
<div id="scenarios">
  ${scenarios}
</div>
<analysis-view></analysis-view>`;
    }
}
__decorate([
    n({ type: String })
], ImageComparisonApp.prototype, "src", void 0);
__decorate([
    n({ type: Object })
], ImageComparisonApp.prototype, "config", void 0);
__decorate([
    e('analysis-view')
], ImageComparisonApp.prototype, "analysisView", void 0);
customElements.define('image-comparison-app', ImageComparisonApp);

export { ImageComparisonApp };
//# sourceMappingURL=image-comparison-app.js.map
