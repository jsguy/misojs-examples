(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
var m=require("mithril");module.exports={isServer:function(){return!1},each:function(r,e){return"[object Array]"===Object.prototype.toString.call(r)?r.map(e):"object"==typeof r?Object.keys(r).map(function(t){return e(r[t],t)}):e(r)},readyBinder:function(){var r=[];return{bind:function(e){r.push(e)},ready:function(){for(var e=0;e<r.length;e+=1)r[e]()}}},getParam:function(r,e,t){return"undefined"!=typeof m.route.param(r)?m.route.param(r):t},routeInfo:function(r){return{path:m.route(),params:req.params,query:req.query,session:session}}};
},{"mithril":6}],2:[function(require,module,exports){
var m=require("mithril"),sugartags=require("mithril.sugartags")(m),db=require("../system/api/flatfiledb/api.client.js")(m),self=module.exports.index={models:{todo:function(t){this.text=t.text,this.done=m.prop("false"==t.done?!1:t.done),this._id=t._id}},controller:function(){var t=this,e="home.index.todo";return t.list=[],db.find({type:e},{background:!0,initialValue:[]}).then(function(e){t.list=Object.keys(e.result).map(function(t){return new self.models.todo(e.result[t])})}),t.addTodo=function(n){var i=t.vm.input();if(i){var o=new self.models.todo({text:t.vm.input(),done:!1});t.list.push(o),t.vm.input(""),db.save({type:e,model:o}).then(function(t){o._id=t.result})}return n.preventDefault(),!1},t.archive=function(){var n=[];t.list.map(function(t){t.done()?db.remove({type:e,_id:t._id}).then(function(t){console.log(t.result)}):n.push(t)}),t.list=n},t.vm={left:function(){var e=0;return t.list.map(function(t){e+=t.done()?0:1}),e},toggle:function(t){return function(){t.done(!t.done())}},input:m.prop("")},t},view:function(ctrl){with(sugartags)return DIV({"class":"cw cf"},[STYLE(".done{text-decoration: line-through;}"),H1("Todos - "+ctrl.vm.left()+" of "+ctrl.list.length+" remaining"),BUTTON({onclick:ctrl.archive},"Archive"),UL([ctrl.list.map(function(t){return LI({"class":t.done()?"done":"",onclick:ctrl.vm.toggle(t)},t.text)})]),FORM({onsubmit:ctrl.addTodo},[INPUT({type:"text",value:ctrl.vm.input,placeholder:"Add todo"}),BUTTON({type:"submit"},"Add")])])}};
},{"../system/api/flatfiledb/api.client.js":9,"mithril":6,"mithril.sugartags":5}],3:[function(require,module,exports){
var m=require("mithril"),sugartags=require("mithril.sugartags")(m),authentication=require("../system/api/authentication/api.client.js")(m);module.exports.view=function(ctrl){with(sugartags)return[m.trust("<!doctype html>"),HTML([HEAD([TITLE("Todos"),LINK({href:"/css/style.css",rel:"stylesheet"})]),BODY([SECTION({id:ctrl.misoAttachmentNode},ctrl.content),SCRIPT({src:"/miso.js"}),ctrl.reload?SCRIPT({src:"/reload.js"}):""])])]};
},{"../system/api/authentication/api.client.js":8,"mithril":6,"mithril.sugartags":5}],4:[function(require,module,exports){
!function(){var n=function(n){n.bindings=n.bindings||{},n.p=function(e){var t,i=this,u=[],o=!1,r=function(n,e){var t;for(t=0;t<u.length;t+=1)u[t].func.apply(u[t].context,[n,e])},f=function(){if(arguments.length&&(e=arguments[0],t!==e)){var n=t;t=e,r(e,n)}return e};return f.push=function(n){e.push&&"undefined"!=typeof e.length&&e.push(n),f(e)},f.subscribe=function(n,e){return u.push({func:n,context:e||i}),f},f.delay=function(n){return o=!!n,f},f.subscribe(function(e){return o||(n.startComputation(),n.endComputation()),f}),f},n.e=function(e,t,i){for(var u in t)n.bindings[u]&&(n.bindings[u].func.apply(t,[t[u]]),n.bindings[u].removeable&&delete t[u]);return n(e,t,i)},n.addBinding=function(e,t,i){n.bindings[e]={func:t,removeable:i}},n.unwrap=function(n){return"function"==typeof n?n():n},n.addBinding("value",function(e){"function"==typeof e?(this.value=e(),this.onchange=n.withAttr("value",e)):this.value=e}),n.addBinding("checked",function(e){"function"==typeof e?(this.checked=e(),this.onchange=n.withAttr("checked",e)):this.checked=e}),n.addBinding("hide",function(e){this.style={display:n.unwrap(e)?"none":""}},!0),n.addBinding("toggle",function(n){this.onclick=function(){var e,t,i,u,o="function"==typeof n,r=[];if(o)value=n(),n(!value);else{for(e=n[0],i=e(),r=n.slice(1),u=r[0],t=0;t<r.length;t+=1)if(i==r[t]){"undefined"!=typeof r[t+1]&&(u=r[t+1]);break}e(u)}}},!0),n.addBinding("hover",function(n){this.onmouseover=n[0],n[1]&&(this.onmouseout=n[1])},!0);for(var e=["Input","Keyup","Keypress"],t=function(e,t){n.addBinding(e,function(e){"function"==typeof e?(this.value=e(),this[t]=n.withAttr("value",e)):this.value=e},!0)},i=0;i<e.length;i+=1){var u=e[i];t("value"+u,"on"+u.toLowerCase())}return n.set=function(n,e){return function(){n(e)}},n.trigger=function(){var e=Array.prototype.slice.call(arguments);return function(){var t=e[0],i=e.slice(1);n.bindings[t]&&n.bindings[t].func.apply(this,i)}},n.bindings};"undefined"!=typeof module&&null!==module&&module.exports?module.exports=n:"function"==typeof define&&define.amd?define(function(){return n}):n("undefined"!=typeof window?window.m||{}:{})}();
},{}],5:[function(require,module,exports){
!function(){var T=function(T,n){T.sugarTags=T.sugarTags||{},n=n||T;var E,e=function(T,n){var E;for(E in n)n.hasOwnProperty(E)&&T.push(n[E]);return T},r=function(T){var n;for(n in T)if(T[n]&&T[n]["class"])return T[n]["class"].split(" ")},A=function(n){var E,A;return function(){var o=Array.prototype.slice.call(arguments);if(E=r(o)){A=[n+"."+E.join(".")];for(var O in o)o[O]&&o[O]["class"]&&delete o[O]["class"]}else A=[n];return(T.e?T.e:T).apply(this,e(A,o))}},o=["A","ABBR","ACRONYM","ADDRESS","AREA","ARTICLE","ASIDE","AUDIO","B","BDI","BDO","BIG","BLOCKQUOTE","BODY","BR","BUTTON","CANVAS","CAPTION","CITE","CODE","COL","COLGROUP","COMMAND","DATALIST","DD","DEL","DETAILS","DFN","DIV","DL","DT","EM","EMBED","FIELDSET","FIGCAPTION","FIGURE","FOOTER","FORM","FRAME","FRAMESET","H1","H2","H3","H4","H5","H6","HEAD","HEADER","HGROUP","HR","HTML","I","IFRAME","IMG","INPUT","INS","KBD","KEYGEN","LABEL","LEGEND","LI","LINK","MAP","MARK","META","METER","NAV","NOSCRIPT","OBJECT","OL","OPTGROUP","OPTION","OUTPUT","P","PARAM","PRE","PROGRESS","Q","RP","RT","RUBY","SAMP","SCRIPT","SECTION","SELECT","SMALL","SOURCE","SPAN","SPLIT","STRONG","STYLE","SUB","SUMMARY","SUP","TABLE","TBODY","TD","TEXTAREA","TFOOT","TH","THEAD","TIME","TITLE","TR","TRACK","TT","UL","VAR","VIDEO","WBR"],O={};for(E in o)o.hasOwnProperty(E)&&!function(T){var E=T.toLowerCase();n[T]=O[E]=A(E)}(o[E]);return T.sugarTags.lower=function(){return O},n};"undefined"!=typeof module&&null!==module&&module.exports?module.exports=T:"function"==typeof define&&define.amd?define(function(){return T}):T("undefined"!=typeof window?window.m||{}:{},"undefined"!=typeof window?window:{})}();
},{}],6:[function(require,module,exports){
var m=function e(t,n){function r(e){A=e.document,S=e.location,M=e.cancelAnimationFrame||e.clearTimeout,R=e.requestAnimationFrame||e.setTimeout}function o(){var e,t=[].slice.call(arguments),n=!(null==t[1]||I.call(t[1])!==$||"tag"in t[1]||"view"in t[1]||"subtree"in t[1]),r=n?t[1]:{},o="class"in r?"class":"className",a={tag:"div",attrs:{}},l=[];if(I.call(t[0])!=L)throw new Error("selector in m(selector, attrs, children) should be a string");for(;e=U.exec(t[0]);)if(""===e[1]&&e[2])a.tag=e[2];else if("#"===e[1])a.attrs.id=e[2];else if("."===e[1])l.push(e[2]);else if("["===e[3][0]){var i=q.exec(e[3]);a.attrs[i[1]]=i[3]||(i[2]?"":!0)}var s=n?t.slice(2):t.slice(1);1===s.length&&I.call(s[0])===D?a.children=s[0]:a.children=s;for(var u in r)r.hasOwnProperty(u)&&(u===o&&null!=r[u]&&""!==r[u]?(l.push(r[u]),a.attrs[u]=""):a.attrs[u]=r[u]);return l.length>0&&(a.attrs[o]=l.join(" ")),a}function a(e,t,r,u,d,f,h,g,m,p,v){try{(null==d||null==d.toString())&&(d="")}catch(y){d=""}if("retain"===d.subtree)return f;var w=I.call(f),x=I.call(d);if(null==f||w!==x){if(null!=f)if(r&&r.nodes){var C=g-u,E=C+(x===D?d:f.nodes).length;s(r.nodes.slice(C,E),r.slice(C,E))}else f.nodes&&s(f.nodes,f);f=new d.constructor,f.tag&&(f={}),f.nodes=[]}if(x===D){for(var b=0,N=d.length;N>b;b++)I.call(d[b])===D&&(d=d.concat.apply([],d),b--,N=d.length);for(var k=[],O=f.length===d.length,T=0,j=1,S=2,R=3,M={},U=!1,b=0;b<f.length;b++)f[b]&&f[b].attrs&&null!=f[b].attrs.key&&(U=!0,M[f[b].attrs.key]={action:j,index:b});for(var q=0,b=0,N=d.length;N>b;b++)if(d[b]&&d[b].attrs&&null!=d[b].attrs.key){for(var J=0,N=d.length;N>J;J++)d[J]&&d[J].attrs&&null==d[J].attrs.key&&(d[J].attrs.key="__mithril__"+q++);break}if(U){var K=!1;if(d.length!=f.length)K=!0;else for(var _,G,b=0;_=f[b],G=d[b];b++)if(_.attrs&&G.attrs&&_.attrs.key!=G.attrs.key){K=!0;break}if(K){for(var b=0,N=d.length;N>b;b++)if(d[b]&&d[b].attrs&&null!=d[b].attrs.key){var F=d[b].attrs.key;M[F]?M[F]={action:R,index:b,from:M[F].index,element:f.nodes[M[F].index]||A.createElement("div")}:M[F]={action:S,index:b}}var P=[];for(var V in M)P.push(M[V]);var Q=P.sort(l),Y=new Array(f.length);Y.nodes=f.nodes.slice();for(var W,b=0;W=Q[b];b++){if(W.action===j&&(s(f[W.index].nodes,f[W.index]),Y.splice(W.index,1)),W.action===S){var X=A.createElement("div");X.key=d[W.index].attrs.key,e.insertBefore(X,e.childNodes[W.index]||null),Y.splice(W.index,0,{attrs:{key:d[W.index].attrs.key},nodes:[X]}),Y.nodes[W.index]=X}W.action===R&&(e.childNodes[W.index]!==W.element&&null!==W.element&&e.insertBefore(W.element,e.childNodes[W.index]||null),Y[W.index]=f[W.from],Y.nodes[W.index]=W.element)}f=Y}}for(var b=0,Z=0,N=d.length;N>b;b++){var te=a(e,t,f,g,d[b],f[Z],h,g+T||T,m,p,v);te!==n&&(te.nodes.intact||(O=!1),T+=te.$trusted?(te.match(/<[^\/]|\>\s*[^<]/g)||[0]).length:I.call(te)===D?te.length:1,f[Z++]=te)}if(!O){for(var b=0,N=d.length;N>b;b++)null!=f[b]&&k.push.apply(k,f[b].nodes);for(var ne,b=0;ne=f.nodes[b];b++)null!=ne.parentNode&&k.indexOf(ne)<0&&s([ne],[f[b]]);d.length<f.length&&(f.length=d.length),f.nodes=k}}else if(null!=d&&x===$){for(var oe=[],ae=[];d.view;){var le=d.view.$original||d.view,ie="diff"==o.redraw.strategy()&&f.views?f.views.indexOf(le):-1,se=ie>-1?f.controllers[ie]:new(d.controller||H),F=d&&d.attrs&&d.attrs.key;if(d=0==re||f&&f.controllers&&f.controllers.indexOf(se)>-1?d.view(se):{tag:"placeholder"},"retain"===d.subtree)return f;F&&(d.attrs||(d.attrs={}),d.attrs.key=F),se.onunload&&ee.push({controller:se,handler:se.onunload}),oe.push(le),ae.push(se)}if(!d.tag&&ae.length)throw new Error("Component template must return a virtual element, not an array, string, etc.");d.attrs||(d.attrs={}),f.attrs||(f.attrs={});var ue=Object.keys(d.attrs),ce=ue.length>("key"in d.attrs?1:0);if((d.tag!=f.tag||ue.sort().join()!=Object.keys(f.attrs).sort().join()||d.attrs.id!=f.attrs.id||d.attrs.key!=f.attrs.key||"all"==o.redraw.strategy()&&(!f.configContext||f.configContext.retain!==!0)||"diff"==o.redraw.strategy()&&f.configContext&&f.configContext.retain===!1)&&(f.nodes.length&&s(f.nodes),f.configContext&&typeof f.configContext.onunload===B&&f.configContext.onunload(),f.controllers))for(var se,b=0;se=f.controllers[b];b++)typeof se.onunload===B&&se.onunload({preventDefault:H});if(I.call(d.tag)!=L)return;var ne,de=0===f.nodes.length;if(d.attrs.xmlns?p=d.attrs.xmlns:"svg"===d.tag?p="http://www.w3.org/2000/svg":"math"===d.tag&&(p="http://www.w3.org/1998/Math/MathML"),de){if(ne=d.attrs.is?p===n?A.createElement(d.tag,d.attrs.is):A.createElementNS(p,d.tag,d.attrs.is):p===n?A.createElement(d.tag):A.createElementNS(p,d.tag),f={tag:d.tag,attrs:ce?i(ne,d.tag,d.attrs,{},p):d.attrs,children:null!=d.children&&d.children.length>0?a(ne,d.tag,n,n,d.children,f.children,!0,0,d.attrs.contenteditable?ne:m,p,v):d.children,nodes:[ne]},ae.length){f.views=oe,f.controllers=ae;for(var se,b=0;se=ae[b];b++)if(se.onunload&&se.onunload.$old&&(se.onunload=se.onunload.$old),re&&se.onunload){var fe=se.onunload;se.onunload=H,se.onunload.$old=fe}}f.children&&!f.children.nodes&&(f.children.nodes=[]),"select"===d.tag&&"value"in d.attrs&&i(ne,d.tag,{value:d.attrs.value},{},p),e.insertBefore(ne,e.childNodes[g]||null)}else ne=f.nodes[0],ce&&i(ne,d.tag,d.attrs,f.attrs,p),f.children=a(ne,d.tag,n,n,d.children,f.children,!1,0,d.attrs.contenteditable?ne:m,p,v),f.nodes.intact=!0,ae.length&&(f.views=oe,f.controllers=ae),h===!0&&null!=ne&&e.insertBefore(ne,e.childNodes[g]||null);if(typeof d.attrs.config===B){var he=f.configContext=f.configContext||{},ge=function(e,t){return function(){return e.attrs.config.apply(e,t)}};v.push(ge(d,[ne,!de,he,f]))}}else if(typeof d!=B){var k;0===f.nodes.length?(d.$trusted?k=c(e,g,d):(k=[A.createTextNode(d)],e.nodeName.match(z)||e.insertBefore(k[0],e.childNodes[g]||null)),f="string number boolean".indexOf(typeof d)>-1?new d.constructor(d):d,f.nodes=k):f.valueOf()!==d.valueOf()||h===!0?(k=f.nodes,m&&m===A.activeElement||(d.$trusted?(s(k,f),k=c(e,g,d)):"textarea"===t?e.value=d:m?m.innerHTML=d:((1===k[0].nodeType||k.length>1)&&(s(f.nodes,f),k=[A.createTextNode(d)]),e.insertBefore(k[0],e.childNodes[g]||null),k[0].nodeValue=d)),f=new d.constructor(d),f.nodes=k):f.nodes.intact=!0}return f}function l(e,t){return e.action-t.action||e.index-t.index}function i(e,t,n,r,o){for(var a in n){var l=n[a],i=r[a];if(a in r&&i===l)"value"===a&&"input"===t&&e.value!=l&&(e.value=l);else{r[a]=l;try{if("config"===a||"key"==a)continue;if(typeof l===B&&0===a.indexOf("on"))e[a]=d(l,e);else if("style"===a&&null!=l&&I.call(l)===$){for(var s in l)(null==i||i[s]!==l[s])&&(e.style[s]=l[s]);for(var s in i)s in l||(e.style[s]="")}else null!=o?"href"===a?e.setAttributeNS("http://www.w3.org/1999/xlink","href",l):"className"===a?e.setAttribute("class",l):e.setAttribute(a,l):a in e&&"list"!==a&&"style"!==a&&"form"!==a&&"type"!==a&&"width"!==a&&"height"!==a?("input"!==t||e[a]!==l)&&(e[a]=l):e.setAttribute(a,l)}catch(u){if(u.message.indexOf("Invalid argument")<0)throw u}}}return r}function s(e,t){for(var n=e.length-1;n>-1;n--)if(e[n]&&e[n].parentNode){try{e[n].parentNode.removeChild(e[n])}catch(r){}t=[].concat(t),t[n]&&u(t[n])}0!=e.length&&(e.length=0)}function u(e){if(e.configContext&&typeof e.configContext.onunload===B&&(e.configContext.onunload(),e.configContext.onunload=null),e.controllers)for(var t,n=0;t=e.controllers[n];n++)typeof t.onunload===B&&t.onunload({preventDefault:H});if(e.children)if(I.call(e.children)===D)for(var r,n=0;r=e.children[n];n++)u(r);else e.children.tag&&u(e.children)}function c(e,t,n){var r=e.childNodes[t];if(r){var o=1!=r.nodeType,a=A.createElement("span");o?(e.insertBefore(a,r||null),a.insertAdjacentHTML("beforebegin",n),e.removeChild(a)):r.insertAdjacentHTML("beforebegin",n)}else e.insertAdjacentHTML("beforeend",n);for(var l=[];e.childNodes[t]!==r;)l.push(e.childNodes[t]),t++;return l}function d(e,t){return function(n){n=n||event,o.redraw.strategy("diff"),o.startComputation();try{return e.call(t,n)}finally{oe()}}}function f(e){var t=_.indexOf(e);return 0>t?_.push(e)-1:t}function h(e){var t=function(){return arguments.length&&(e=arguments[0]),e};return t.toJSON=function(){return e},t}function g(e,t){var n=function(){return(e.controller||H).apply(this,t)||this},r=function(n){return arguments.length>1&&(t=t.concat([].slice.call(arguments,1))),e.view.apply(e,t?[n].concat(t):[n])};r.$original=e.view;var o={controller:n,view:r};return t[0]&&null!=t[0].key&&(o.attrs={key:t[0].key}),o}function m(){X&&(X(),X=null);for(var e,t=0;e=P[t];t++)if(Q[t]){var n=V[t].controller&&V[t].controller.$$args?[Q[t]].concat(V[t].controller.$$args):[Q[t]];o.render(e,V[t].view?V[t].view(Q[t],n):"")}Z&&(Z(),Z=null),Y=null,W=new Date,o.redraw.strategy("diff")}function p(e){return e.slice(ie[o.route.mode].length)}function v(e,t,n){ae={};var r=n.indexOf("?");-1!==r&&(ae=C(n.substr(r+1,n.length)),n=n.substr(0,r));var a=Object.keys(t),l=a.indexOf(n);if(-1!==l)return o.mount(e,t[a[l]]),!0;for(var i in t){if(i===n)return o.mount(e,t[i]),!0;var s=new RegExp("^"+i.replace(/:[^\/]+?\.{3}/g,"(.*?)").replace(/:[^\/]+/g,"([^\\/]+)")+"/?$");if(s.test(n))return n.replace(s,function(){for(var n=i.match(/:[^\/]+/g)||[],r=[].slice.call(arguments,1,-2),a=0,l=n.length;l>a;a++)ae[n[a].replace(/:|\./g,"")]=decodeURIComponent(r[a]);o.mount(e,t[i])}),!0}}function y(e){if(e=e||event,!e.ctrlKey&&!e.metaKey&&2!==e.which){e.preventDefault?e.preventDefault():e.returnValue=!1;for(var t=e.currentTarget||e.srcElement,n="pathname"===o.route.mode&&t.search?C(t.search.slice(1)):{};t&&"A"!=t.nodeName.toUpperCase();)t=t.parentNode;o.route(t[o.route.mode].slice(ie[o.route.mode].length),n)}}function w(){"hash"!=o.route.mode&&S.hash?S.hash=S.hash:t.scrollTo(0,0)}function x(e,t){var r={},o=[];for(var a in e){var l=t?t+"["+a+"]":a,i=e[a],s=I.call(i),u=null===i?encodeURIComponent(l):s===$?x(i,l):s===D?i.reduce(function(e,t){return r[l]||(r[l]={}),r[l][t]?e:(r[l][t]=!0,e.concat(encodeURIComponent(l)+"="+encodeURIComponent(t)))},[]).join("&"):encodeURIComponent(l)+"="+encodeURIComponent(i);i!==n&&o.push(u)}return o.join("&")}function C(e){"?"===e.charAt(0)&&(e=e.substring(1));for(var t=e.split("&"),n={},r=0,o=t.length;o>r;r++){var a=t[r].split("="),l=decodeURIComponent(a[0]),i=2==a.length?decodeURIComponent(a[1]):null;null!=n[l]?(I.call(n[l])!==D&&(n[l]=[n[l]]),n[l].push(i)):n[l]=i}return n}function E(e){var t=f(e);s(e.childNodes,G[t]),G[t]=n}function b(e,t){var n=o.prop(t);return e.then(n),n.then=function(n,r){return b(e.then(n,r),t)},n}function N(e,t){function n(e){d=e||u,h.map(function(e){d===s&&e.resolve(f)||e.reject(f)})}function r(e,t,n,r){if((null!=f&&I.call(f)===$||typeof f===B)&&typeof e===B)try{var a=0;e.call(f,function(e){a++||(f=e,t())},function(e){a++||(f=e,n())})}catch(l){o.deferred.onerror(l),f=l,n()}else r()}function a(){var u;try{u=f&&f.then}catch(h){return o.deferred.onerror(h),f=h,d=i,a()}r(u,function(){d=l,a()},function(){d=i,a()},function(){try{d===l&&typeof e===B?f=e(f):d===i&&"function"==typeof t&&(f=t(f),d=l)}catch(a){return o.deferred.onerror(a),f=a,n()}f===c?(f=TypeError(),n()):r(u,function(){n(s)},n,function(){n(d===l&&s)})})}var l=1,i=2,s=3,u=4,c=this,d=0,f=0,h=[];c.promise={},c.resolve=function(e){return d||(f=e,d=l,a()),this},c.reject=function(e){return d||(f=e,d=i,a()),this},c.promise.then=function(e,t){var n=new N(e,t);return d===s?n.resolve(f):d===u?n.reject(f):h.push(n),n.promise}}function k(e){return e}function O(e){if(!e.dataType||"jsonp"!==e.dataType.toLowerCase()){var r=new t.XMLHttpRequest;if(r.open(e.method,e.url,!0,e.user,e.password),r.onreadystatechange=function(){4===r.readyState&&(r.status>=200&&r.status<300?e.onload({type:"load",target:r}):e.onerror({type:"error",target:r}))},e.serialize===JSON.stringify&&e.data&&"GET"!==e.method&&r.setRequestHeader("Content-Type","application/json; charset=utf-8"),e.deserialize===JSON.parse&&r.setRequestHeader("Accept","application/json, text/*"),typeof e.config===B){var o=e.config(r,e);null!=o&&(r=o)}var a="GET"!==e.method&&e.data?e.data:"";if(a&&I.call(a)!=L&&a.constructor!=t.FormData)throw"Request data should be either be a string or FormData. Check the `serialize` option in `m.request`";return r.send(a),r}var l="mithril_callback_"+(new Date).getTime()+"_"+Math.round(1e16*Math.random()).toString(36),i=A.createElement("script");t[l]=function(r){i.parentNode.removeChild(i),e.onload({type:"load",target:{responseText:r}}),t[l]=n},i.onerror=function(r){return i.parentNode.removeChild(i),e.onerror({type:"error",target:{status:500,responseText:JSON.stringify({error:"Error making jsonp request"})}}),t[l]=n,!1},i.onload=function(e){return!1},i.src=e.url+(e.url.indexOf("?")>0?"&":"?")+(e.callbackKey?e.callbackKey:"callback")+"="+l+"&"+x(e.data||{}),A.body.appendChild(i)}function T(e,t,n){if("GET"===e.method&&"jsonp"!=e.dataType){var r=e.url.indexOf("?")<0?"?":"&",o=x(t);e.url=e.url+(o?r+o:"")}else e.data=n(t);return e}function j(e,t){var n=e.match(/:[a-z]\w+/gi);if(n&&t)for(var r=0;r<n.length;r++){var o=n[r].slice(1);e=e.replace(n[r],t[o]),delete t[o]}return e}var A,S,R,M,$="[object Object]",D="[object Array]",L="[object String]",B="function",I={}.toString,U=/(?:(^|#|\.)([^#\.\[\]]+))|(\[.+?\])/g,q=/\[(.+?)(?:=("|'|)(.*?)\2)?\]/,z=/^(AREA|BASE|BR|COL|COMMAND|EMBED|HR|IMG|INPUT|KEYGEN|LINK|META|PARAM|SOURCE|TRACK|WBR)$/,H=function(){};r(t);var J,K={appendChild:function(e){J===n&&(J=A.createElement("html")),A.documentElement&&A.documentElement!==e?A.replaceChild(e,A.documentElement):A.appendChild(e),this.childNodes=A.childNodes},insertBefore:function(e){this.appendChild(e)},childNodes:[]},_=[],G={};o.render=function(e,t,r){var o=[];if(!e)throw new Error("Ensure the DOM element being passed to m.route/m.mount/m.render is not undefined.");var l=f(e),i=e===A,u=i||e===A.documentElement?K:e;i&&"html"!=t.tag&&(t={tag:"html",attrs:{},children:t}),G[l]===n&&s(u.childNodes),r===!0&&E(e),G[l]=a(u,null,n,n,t,G[l],!1,0,null,n,o);for(var c=0,d=o.length;d>c;c++)o[c]()},o.trust=function(e){return e=new String(e),e.$trusted=!0,e},o.prop=function(e){return(null!=e&&I.call(e)===$||typeof e===B)&&typeof e.then===B?b(e):h(e)};var F,P=[],V=[],Q=[],Y=null,W=0,X=null,Z=null,ee=[],te=16;o.component=function(e){return g(e,[].slice.call(arguments,1))},o.mount=o.module=function(e,t){if(!e)throw new Error("Please ensure the DOM element exists before rendering a template into it.");var n=P.indexOf(e);0>n&&(n=P.length);for(var r,a=!1,l={preventDefault:function(){a=!0,X=Z=null}},i=0;r=ee[i];i++)r.handler.call(r.controller,l),r.controller.onunload=null;if(a)for(var r,i=0;r=ee[i];i++)r.controller.onunload=r.handler;else ee=[];if(Q[n]&&typeof Q[n].onunload===B&&Q[n].onunload(l),!a){o.redraw.strategy("all"),o.startComputation(),P[n]=e,arguments.length>2&&(t=subcomponent(t,[].slice.call(arguments,2)));var s=F=t=t||{controller:function(){}},u=t.controller||H,c=new u;return s===F&&(Q[n]=c,V[n]=t),oe(),Q[n]}};var ne=!1;o.redraw=function(e){ne||(ne=!0,Y&&e!==!0?(R===t.requestAnimationFrame||new Date-W>te)&&(Y>0&&M(Y),Y=R(m,te)):(m(),Y=R(function(){Y=null},te)),ne=!1)},o.redraw.strategy=o.prop();var re=0;o.startComputation=function(){re++},o.endComputation=function(){re=Math.max(re-1,0),0===re&&o.redraw()};var oe=function(){"none"==o.redraw.strategy()?(re--,o.redraw.strategy("diff")):o.endComputation()};o.withAttr=function(e,t){return function(n){n=n||event;var r=n.currentTarget||this;t(e in r?r[e]:r.getAttribute(e))}};var ae,le,ie={pathname:"",hash:"#",search:"?"},se=H,ue=!1;return o.route=function(){if(0===arguments.length)return le;if(3===arguments.length&&I.call(arguments[1])===L){var e=arguments[0],n=arguments[1],r=arguments[2];se=function(t){var a=le=p(t);if(!v(e,r,a)){if(ue)throw new Error("Ensure the default route matches one of the routes defined in m.route");ue=!0,o.route(n,!0),ue=!1}};var a="hash"===o.route.mode?"onhashchange":"onpopstate";t[a]=function(){var e=S[o.route.mode];"pathname"===o.route.mode&&(e+=S.search),le!=p(e)&&se(e)},X=w,t[a]()}else if(arguments[0].addEventListener||arguments[0].attachEvent){var l=arguments[0],i=(arguments[1],arguments[2],arguments[3]);l.href=("pathname"!==o.route.mode?S.pathname:"")+ie[o.route.mode]+i.attrs.href,l.addEventListener?(l.removeEventListener("click",y),l.addEventListener("click",y)):(l.detachEvent("onclick",y),l.attachEvent("onclick",y))}else if(I.call(arguments[0])===L){var s=le;le=arguments[0];var u=arguments[1]||{},c=le.indexOf("?"),d=c>-1?C(le.slice(c+1)):{};for(var f in u)d[f]=u[f];var h=x(d),g=c>-1?le.slice(0,c):le;h&&(le=g+(-1===g.indexOf("?")?"?":"&")+h);var m=(3===arguments.length?arguments[2]:arguments[1])===!0||s===arguments[0];t.history.pushState?(X=w,Z=function(){t.history[m?"replaceState":"pushState"](null,A.title,ie[o.route.mode]+le)},se(ie[o.route.mode]+le)):(S[o.route.mode]=le,se(ie[o.route.mode]+le))}},o.route.param=function(e){if(!ae)throw new Error("You must call m.route(element, defaultRoute, routes) before calling m.route.param()");return ae[e]},o.route.mode="search",o.route.buildQueryString=x,o.route.parseQueryString=C,o.deferred=function(){var e=new N;return e.promise=b(e.promise),e},o.deferred.onerror=function(e){if("[object Error]"===I.call(e)&&!e.constructor.toString().match(/ Error/))throw e},o.sync=function(e){function t(e,t){return function(o){return l[e]=o,t||(n="reject"),0===--a&&(r.promise(l),r[n](l)),o}}var n="resolve",r=o.deferred(),a=e.length,l=new Array(a);if(e.length>0)for(var i=0;i<e.length;i++)e[i].then(t(i,!0),t(i,!1));else r.resolve([]);return r.promise},o.request=function(e){e.background!==!0&&o.startComputation();var t=new N,n=e.dataType&&"jsonp"===e.dataType.toLowerCase(),r=e.serialize=n?k:e.serialize||JSON.stringify,a=e.deserialize=n?k:e.deserialize||JSON.parse,l=n?function(e){return e.responseText}:e.extract||function(e){return 0===e.responseText.length&&a===JSON.parse?null:e.responseText};return e.method=(e.method||"GET").toUpperCase(),e.url=j(e.url,e.data),e=T(e,e.data,r),e.onload=e.onerror=function(n){try{n=n||event;var r=("load"===n.type?e.unwrapSuccess:e.unwrapError)||k,i=r(a(l(n.target,e)),n.target);if("load"===n.type)if(I.call(i)===D&&e.type)for(var s=0;s<i.length;s++)i[s]=new e.type(i[s]);else e.type&&(i=new e.type(i));t["load"===n.type?"resolve":"reject"](i)}catch(n){o.deferred.onerror(n),t.reject(n)}e.background!==!0&&o.endComputation()},O(e),t.promise=b(t.promise,e.initialValue),t.promise},o.deps=function(e){return r(t=e||t),t},o.deps.factory=e,o}("undefined"!=typeof window?window:{});"undefined"!=typeof module&&null!==module&&module.exports?module.exports=m:"function"==typeof define&&define.amd&&define(function(){return m});
},{}],7:[function(require,module,exports){
!function(){var n=function(n){var i=["Moz","Webkit","Khtml","O","ms"],t=["TransitionProperty","TransitionTimingFunction","TransitionDelay","TransitionDuration","TransitionEnd"],o=["rotate","rotatex","rotatey","scale","skew","translate","translatex","translatey","matrix"],e=400,r=function(n){"undefined"!=typeof window&&window.console&&console.error&&console.error(n)},a=function(n){return n.charAt(0).toUpperCase()+n.substr(1)},s=document.createElement("div"),d=function(n){var t;if(n in s.style)return n;if("@keyframes"==n){for(var o=0;o<i.length;o+=1)if(t=i[o]+"Transition",t in s.style)return"@-"+i[o].toLowerCase()+"-keyframes";return n}for(var o=0;o<i.length;o+=1)if(t=i[o]+a(n),t in s.style)return t;return n},f=function(){var n=document.body||document.documentElement,t=n.style,o="transition";if("string"==typeof t[o])return!0;o=o.charAt(0).toUpperCase()+o.substr(1);for(var e=0;e<i.length;e++)if("string"==typeof t[i[e]+o])return!0;return!1},u=function(n){var i,t=0;return n+="",n=n.toLowerCase(),-1!==n.indexOf("ms")?(i=n.split("ms"),t=Number(i[0])):-1!==n.indexOf("s")?(i=n.split("s"),t=1e3*Number(i[0])):t=Number(n),Math.round(t)},m=function(n,i){for(var t in i)i.hasOwnProperty(t)&&(n.style[d(t)]=i[t])},l=function(n){var i,r,s,f,u,m={TransitionTimingFunction:"ease",TransitionDuration:e+"ms",TransitionProperty:"all"};for(i in n)if(n.hasOwnProperty(i)){for(s="Transition"+a(i),f=i.toLowerCase(),u=!1,r=0;r<t.length;r+=1)if(s==t[r]){m[t[r]]=n[i],u=!0;break}for(r=0;r<o.length;r+=1)if(f==o[r]){m[d("transform")]=m[d("transform")]||"",m[d("transform")]+=" "+i+"("+n[i]+")",u=!0;break}u||(m[i]=n[i])}return m},c=function(n){var i,t,e={},r=function(n,i,t){var e,r=i.toLowerCase(),a=!1;for(e=0;e<o.length;e+=1)if(r==o[e]){n[d("transform")]=n[d("transform")]||"",n[d("transform")]+=" "+i+"("+t+")",a=!0;break}a?delete n[i]:n[i]=t};for(i in n)if(n.hasOwnProperty(i))if(-1!==i.indexOf("%")){for(t in n[i])n[i].hasOwnProperty(t)&&r(n[i],t,n[i][t]);e[i]=n[i]}else r(e,i,n[i]);return e},p=function(n){return"ani"+JSON.stringify(n).split(/[{},%":]/).join("")},g={},y=f();n.animateProperties=function(n,i,t){n.style=n.style||{};var o,r=l(i);"undefined"!=typeof r.TransitionDuration?r.TransitionDuration=u(r.TransitionDuration)+"ms":r.TransitionDuration=e+"ms",o=u(r.TransitionDuration)||0,y?m(n,r):"undefined"!=typeof $&&$.fn&&$.fn.animate&&$(n).animate(r,o),t&&setTimeout(t,o+1)},n.trigger=function(i,t,o,e){o=o||{};var a=g[i];return a?function(i){var r=a.fn(function(){return"function"==typeof t?t():t});for(h in o)o.hasOwnProperty(h)&&(r[h]=o[h]);n.animateProperties(i.target,r,e)}:r("Animation "+i+" not found.")},n.addAnimation=function(i,t,o){return o=o||{},g[i]?r("Animation "+i+" already defined."):"function"!=typeof t?r("Animation "+i+" is being added as a transition based animation, and must use a function."):(o.duration=o.duration||e,g[i]={options:o,fn:t},void n.addBinding(i,function(o){n.bindAnimation(i,this,t,o)},!0))},n.addKFAnimation=function(i,t,o){if(o=o||{},g[i])return r("Animation "+i+" already defined.");var a=function(n){var t,o=p(n),e=document.getElementById(o);if(!e){g[i].id=o,n=c(n),t=d("@keyframes")+" "+o+" "+JSON.stringify(n).split('"').join("").split("},").join("}\n").split(",").join(";").split("%:").join("% ");var r=document.createElement("style");r.setAttribute("id",o),r.id=o,r.textContent=t,document.head.appendChild(r)}g[i].isInitialised=!0,g[i].options.animateImmediately=!0};o.duration=o.duration||e,o.animateImmediately=o.animateImmediately||!1,g[i]={init:a,options:o,arg:t},n.addBinding(i,function(o){n.bindAnimation(i,this,t,o)},!0)},n.animateKF=function(n,i,t,o){t=t||{};var s,f=g[n],u={};if(!f)return r("Animation "+n+" not found.");f.options=f.options||{};for(s in t)t.hasOwnProperty(s)&&(f.options[s]=t[s]);!f.isInitialised&&f.init&&f.init(f.arg);for(s in f.options)f.options.hasOwnProperty(s)&&(u[d("animation"+a(s))]=f.options[s]);u[d("animationName")]=f.id,u[d("animationDuration")]=(u[d("animationDuration")]?u[d("animationDuration")]:e)+"ms",u[d("animationDelay")]=u[d("animationDelay")]?u[d("animationDuration")]+"ms":void 0,u[d("animationFillMode")]=u[d("animationFillMode")]||"forwards",i.style=i.style||{};var m=function(){i.removeEventListener("animationend",m,!1),o&&o(i)};i.style[d("animation")]="",i.style[d("animationName")]="",requestAnimationFrame(function(){requestAnimationFrame(function(){for(s in u)u.hasOwnProperty(s)&&(i.style[s]=u[s]);i.addEventListener("animationend",m,!1)})})},n.triggerKF=function(i,t){return function(){n.animateKF(i,this,t)}},n.bindAnimation=function(i,t,o,e){var a=g[i];if(!a&&!a.name)return r("Animation "+i+" not found.");if(a.fn)n.animateProperties(t,a.fn(e));else{var s=t.config;t.config=function(t,r){!a.isInitialised&&a.init&&a.init(o),e()&&r&&n.animateKF(i,t,o),s&&s.apply(t,arguments)}}};var h,v=["scale","scalex","scaley","translate","translatex","translatey","matrix","backgroundColor","backgroundPosition","borderBottomColor","borderBottomWidth","borderLeftColor","borderLeftWidth","borderRightColor","borderRightWidth","borderSpacing","borderTopColor","borderTopWidth","bottom","clip","color","fontSize","fontWeight","height","left","letterSpacing","lineHeight","marginBottom","marginLeft","marginRight","marginTop","maxHeight","maxWidth","minHeight","minWidth","opacity","outlineColor","outlineWidth","paddingBottom","paddingLeft","paddingRight","paddingTop","right","textIndent","textShadow","top","verticalAlign","visibility","width","wordSpacing","zIndex"],w=["rotate","rotatex","rotatey","skewx","skewy"];for(h=0;h<v.length;h+=1)!function(i){n.addAnimation(i,function(n){var t={};return t[i]=n(),t})}(v[h]);for(h=0;h<w.length;h+=1)!function(i){n.addAnimation(i,function(n){var t={},o=n();return t[i]=isNaN(o)?o:o+"deg",t})}(w[h]);n.addAnimation("skew",function(n){var i=n();return{skew:[i[0]+(isNaN(i[0])?"":"deg"),i[1]+(isNaN(i[1])?"":"deg")]}}),n=n||{},n.addBinding("hide",function(i){this.style={display:n.unwrap(i)?"none":""}},!0),n.addBinding("toggle",function(n){this.onclick=function(){var i=n();n(!i)}},!0),n.addBinding("hover",function(n){this.onmouseover=n[0],n[1]&&(this.onmouseout=n[1])},!0)};"undefined"!=typeof module&&null!==module&&module.exports?module.exports=n:"function"==typeof define&&define.amd?define(function(){return n}):n("undefined"!=typeof window?window.m||{}:{})}();
},{}],8:[function(require,module,exports){
module.exports=function(e){var a=function(e){var a,o={};for(a in e)e.hasOwnProperty(a)&&"isValid"!==a&&("id"==a?o._id="function"==typeof e[a]?e[a]():e[a]:o[a]="function"==typeof e[a]?e[a]():e[a]);return o};return{find:function(o,n){o=o||{},n=n||{};var t={method:"post",url:"/api/authentication/find",data:o},r=document.documentElement||document.body;for(var d in n)n.hasOwnProperty(d)&&(t[d]=n[d]);o.model&&(o.model=a(o.model)),r.className+=" loading";var s=e.deferred();return e.request(t).then(function(){r.className=r.className.split(" loading").join(""),s.resolve.apply(this,arguments),t.background&&e.redraw(!0)}),s.promise},save:function(o,n){o=o||{},n=n||{};var t={method:"post",url:"/api/authentication/save",data:o},r=document.documentElement||document.body;for(var d in n)n.hasOwnProperty(d)&&(t[d]=n[d]);o.model&&(o.model=a(o.model)),r.className+=" loading";var s=e.deferred();return e.request(t).then(function(){r.className=r.className.split(" loading").join(""),s.resolve.apply(this,arguments),t.background&&e.redraw(!0)}),s.promise},remove:function(o,n){o=o||{},n=n||{};var t={method:"post",url:"/api/authentication/remove",data:o},r=document.documentElement||document.body;for(var d in n)n.hasOwnProperty(d)&&(t[d]=n[d]);o.model&&(o.model=a(o.model)),r.className+=" loading";var s=e.deferred();return e.request(t).then(function(){r.className=r.className.split(" loading").join(""),s.resolve.apply(this,arguments),t.background&&e.redraw(!0)}),s.promise},authenticate:function(o,n){o=o||{},n=n||{};var t={method:"post",url:"/api/authentication/authenticate",data:o},r=document.documentElement||document.body;for(var d in n)n.hasOwnProperty(d)&&(t[d]=n[d]);o.model&&(o.model=a(o.model)),r.className+=" loading";var s=e.deferred();return e.request(t).then(function(){r.className=r.className.split(" loading").join(""),s.resolve.apply(this,arguments),t.background&&e.redraw(!0)}),s.promise},login:function(o,n){o=o||{},n=n||{};var t={method:"post",url:"/api/authentication/login",data:o},r=document.documentElement||document.body;for(var d in n)n.hasOwnProperty(d)&&(t[d]=n[d]);o.model&&(o.model=a(o.model)),r.className+=" loading";var s=e.deferred();return e.request(t).then(function(){r.className=r.className.split(" loading").join(""),s.resolve.apply(this,arguments),t.background&&e.redraw(!0)}),s.promise},logout:function(o,n){o=o||{},n=n||{};var t={method:"post",url:"/api/authentication/logout",data:o},r=document.documentElement||document.body;for(var d in n)n.hasOwnProperty(d)&&(t[d]=n[d]);o.model&&(o.model=a(o.model)),r.className+=" loading";var s=e.deferred();return e.request(t).then(function(){r.className=r.className.split(" loading").join(""),s.resolve.apply(this,arguments),t.background&&e.redraw(!0)}),s.promise},findUsers:function(o,n){o=o||{},n=n||{};var t={method:"post",url:"/api/authentication/findUsers",data:o},r=document.documentElement||document.body;for(var d in n)n.hasOwnProperty(d)&&(t[d]=n[d]);o.model&&(o.model=a(o.model)),r.className+=" loading";var s=e.deferred();return e.request(t).then(function(){r.className=r.className.split(" loading").join(""),s.resolve.apply(this,arguments),t.background&&e.redraw(!0)}),s.promise},saveUser:function(o,n){o=o||{},n=n||{};var t={method:"post",url:"/api/authentication/saveUser",data:o},r=document.documentElement||document.body;for(var d in n)n.hasOwnProperty(d)&&(t[d]=n[d]);o.model&&(o.model=a(o.model)),r.className+=" loading";var s=e.deferred();return e.request(t).then(function(){r.className=r.className.split(" loading").join(""),s.resolve.apply(this,arguments),t.background&&e.redraw(!0)}),s.promise}}};
},{}],9:[function(require,module,exports){
module.exports=function(e){var a=function(e){var a,o={};for(a in e)e.hasOwnProperty(a)&&"isValid"!==a&&("id"==a?o._id="function"==typeof e[a]?e[a]():e[a]:o[a]="function"==typeof e[a]?e[a]():e[a]);return o};return{find:function(o,n){o=o||{},n=n||{};var r={method:"post",url:"/api/flatfiledb/find",data:o},t=document.documentElement||document.body;for(var d in n)n.hasOwnProperty(d)&&(r[d]=n[d]);o.model&&(o.model=a(o.model)),t.className+=" loading";var l=e.deferred();return e.request(r).then(function(){t.className=t.className.split(" loading").join(""),l.resolve.apply(this,arguments),r.background&&e.redraw(!0)}),l.promise},save:function(o,n){o=o||{},n=n||{};var r={method:"post",url:"/api/flatfiledb/save",data:o},t=document.documentElement||document.body;for(var d in n)n.hasOwnProperty(d)&&(r[d]=n[d]);o.model&&(o.model=a(o.model)),t.className+=" loading";var l=e.deferred();return e.request(r).then(function(){t.className=t.className.split(" loading").join(""),l.resolve.apply(this,arguments),r.background&&e.redraw(!0)}),l.promise},remove:function(o,n){o=o||{},n=n||{};var r={method:"post",url:"/api/flatfiledb/remove",data:o},t=document.documentElement||document.body;for(var d in n)n.hasOwnProperty(d)&&(r[d]=n[d]);o.model&&(o.model=a(o.model)),t.className+=" loading";var l=e.deferred();return e.request(r).then(function(){t.className=t.className.split(" loading").join(""),l.resolve.apply(this,arguments),r.background&&e.redraw(!0)}),l.promise},authenticate:function(o,n){o=o||{},n=n||{};var r={method:"post",url:"/api/flatfiledb/authenticate",data:o},t=document.documentElement||document.body;for(var d in n)n.hasOwnProperty(d)&&(r[d]=n[d]);o.model&&(o.model=a(o.model)),t.className+=" loading";var l=e.deferred();return e.request(r).then(function(){t.className=t.className.split(" loading").join(""),l.resolve.apply(this,arguments),r.background&&e.redraw(!0)}),l.promise}}};
},{}],10:[function(require,module,exports){
var m=require("mithril"),misoGlobal=misoGlobal||{},sugartags=require("mithril.sugartags")(m),bindings=require("mithril.bindings")(m),animate=require("../public/js/mithril.animate.js")(m),permissions=require("../system/miso.permissions.js"),layout=require("../mvc/layout_plain.js"),restrict=function(e,i){return e},permissionObj={},home=require("../mvc/home.js");"undefined"!=typeof window&&(window.m=m),m.route.mode="pathname",m.route(document.getElementById("misoAttachmentNode"),"/",{"/":restrict(home.index,"home.index")}),misoGlobal.renderHeader=function(e){var i=document.getElementById("misoHeaderNode");i&&m.render(document.getElementById("misoHeaderNode"),layout.headerContent?layout.headerContent({misoGlobal:e||misoGlobal}):"")},misoGlobal.renderHeader();
},{"../mvc/home.js":2,"../mvc/layout_plain.js":3,"../public/js/mithril.animate.js":7,"../system/miso.permissions.js":11,"mithril":6,"mithril.bindings":4,"mithril.sugartags":5}],11:[function(require,module,exports){
var miso=require("../modules/miso.util.client.js"),hasRole=function(e,o){var r=!1;return"*"==e?!0:(miso.each(e,function(e){e="string"!=typeof e?e:[e],miso.each(o,function(o){return e==o?(r=!0,!1):void 0})}),r)};module.exports.app=function(e,o,r){var l=!0;return e&&r&&(e.deny&&(l=!hasRole(user.roles,e.deny)),e.allow&&(l=hasRole(user.roles,e.allow))),l},module.exports.api=function(e,o,r){var l=!0;return e&&r&&(e.deny&&(l=!hasRole(user.roles,e.deny)),e.allow&&(l=hasRole(user.roles,e.allow))),l};
},{"../modules/miso.util.client.js":1}]},{},[10])


//# sourceMappingURL=/miso.map.json