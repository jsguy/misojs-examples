(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
//	Various utilities that normalise usage between client and server
//	This is the client version - see miso.util.js for server version
var m = require('mithril');

module.exports = {
	//	Are we on the server?
	isServer: function() {
		return false;
	},
	
	//	Each abstraction
	//	
	//	miso.each(['hello', 'world'], function(value, key){
	//		console.log(value, key);
	//	});
	//	//	hello 0\nhello 1
	//
	// 	miso.each({'hello': 'world'}, function(value, key){
	//		console.log(value, key);
	//	});
	//	//	world hello
	//
	each: function(obj, fn) {
		if(Object.prototype.toString.call(obj) === '[object Array]' ) {
			return obj.map(fn);
		} else if(typeof obj == 'object') {
			return Object.keys(obj).map(function(key){
				return fn(obj[key], key);
			});
		} else {
			return fn(obj);
		}
	},

	readyBinder: function(){
		var bindings = [];
		return {
			bind: function(cb) {
				bindings.push(cb);
			},
			ready: function(){
				for(var i = 0; i < bindings.length; i += 1) {
					bindings[i]();
				}
			}
		};
	},

	//	Get parameters for an action
	getParam: function(key, params, def){
		return typeof m.route.param(key) !== "undefined"? m.route.param(key): def;
	},

	//	Get info for an action from the params
	routeInfo: function(params){
		/*

			path: req.path,
			params: req.params, 
			query: req.query, 
			session: session

		*/
		return {
			path: m.route(),
			params: req.params, 
			query: req.query, 
			session: session
		}
	}
};
},{"mithril":6}],2:[function(require,module,exports){
var m = require('mithril'),
	sugartags = require('mithril.sugartags')(m);

var self = module.exports.index = {
	models: {
        todo: function(data){
            this.text = data.text;
            this.done = m.prop(data.done == "false"? false: data.done);
        }
    },
	controller: function() {
	    var myTodos = [{text: "Learn miso"}, {text: "Build miso app"}];
	    this.list = Object.keys(myTodos).map(function(key) {
	        return new self.models.todo(myTodos[key]);
	    });
	    return this;
	},
	view: function(ctrl) {
	    return m("div.cw", [
	        m("H1", "Todos"),
	        m("UL", [
	            ctrl.list.map(function(todo){
	                return m("LI", todo.text)
	            })
	        ])
	    ]);
	}
};
},{"mithril":6,"mithril.sugartags":5}],3:[function(require,module,exports){
/*	Miso custom layout page
	Example custom layout page - it removes most components
*/
var m = require('mithril'),
	sugartags = require('mithril.sugartags')(m),
	authentication = require("../system/api/authentication/api.client.js")(m);

//	The full layout - always only rendered server side
module.exports.view = function(ctrl){
	with(sugartags) {
		return [
			m.trust("<!doctype html>"),
			HTML([
				HEAD([
					LINK({href: '/css/style.css', rel:'stylesheet'}),
					//	Add in the misoGlobal object...
					SCRIPT("var misoGlobal = "+(ctrl.misoGlobal? JSON.stringify(ctrl.misoGlobal): {})+";")
				]),
				BODY([
					SECTION({id: ctrl.misoAttachmentNode}, ctrl.content),
					SCRIPT({src: '/miso.js'}),
					(ctrl.reload? SCRIPT({src: '/reload.js'}): "")
				])
			])
		];
	}
};
},{"../system/api/authentication/api.client.js":8,"mithril":6,"mithril.sugartags":5}],4:[function(require,module,exports){
//	Mithril bindings.
//	Copyright (C) 2014 jsguy (Mikkel Bergmann)
//	MIT licensed
(function(){
var mithrilBindings = function(m){
	m.bindings = m.bindings || {};

	//	Pub/Sub based extended properties
	m.p = function(value) {
		var self = this,
			subs = [],
			prevValue,
			delay = false,
			//  Send notifications to subscribers
			notify = function (value, prevValue) {
				var i;
				for (i = 0; i < subs.length; i += 1) {
					subs[i].func.apply(subs[i].context, [value, prevValue]);
				}
			},
			prop = function() {
				if (arguments.length) {
					value = arguments[0];
					if (prevValue !== value) {
						var tmpPrev = prevValue;
						prevValue = value;
						notify(value, tmpPrev);
					}
				}
				return value;
			};

		//	Allow push on arrays
		prop.push = function(val) {
			if(value.push && typeof value.length !== "undefined") {
				value.push(val);
			}
			prop(value);
		};

		//	Subscribe for when the value changes
		prop.subscribe = function (func, context) {
			subs.push({ func: func, context: context || self });
			return prop;
		};

		//	Allow property to not automatically render
		prop.delay = function(value) {
			delay = !!value;
			return prop;
		};

		//	Automatically update rendering when a value changes
		//	As mithril waits for a request animation frame, this should be ok.
		//	You can use .delay(true) to be able to manually handle updates
		prop.subscribe(function(val){
			if(!delay) {
				m.startComputation();
				m.endComputation();
			}
			return prop;
		});

		return prop;
	};

	//	Element function that applies our extended bindings
	//	Note: 
	//		. Some attributes can be removed when applied, eg: custom attributes
	//	
	m.e = function(element, attrs, children) {
		for (var name in attrs) {
			if (m.bindings[name]) {
				m.bindings[name].func.apply(attrs, [attrs[name]]);
				if(m.bindings[name].removeable) {
					delete attrs[name];
				}
			}
		}
		return m(element, attrs, children);
	};

	//	Add bindings method
	//	Non-standard attributes do not need to be rendered, eg: valueInput
	//	so they are set as removable
	m.addBinding = function(name, func, removeable){
		m.bindings[name] = {
			func: func,
			removeable: removeable
		};
	};

	//	Get the underlying value of a property
	m.unwrap = function(prop) {
		return (typeof prop == "function")? prop(): prop;
	};

	//	Bi-directional binding of value
	m.addBinding("value", function(prop) {
		if (typeof prop == "function") {
			this.value = prop();
			this.onchange = m.withAttr("value", prop);
		} else {
			this.value = prop;
		}
	});

	//	Bi-directional binding of checked property
	m.addBinding("checked", function(prop) {
		if (typeof prop == "function") {
			this.checked = prop();
			this.onchange = m.withAttr("checked", prop);
		} else {
			this.checked = prop;
		}
	});

	//	Hide node
	m.addBinding("hide", function(prop){
		this.style = {
			display: m.unwrap(prop)? "none" : ""
		};
	}, true);

	//	Toggle value(s) on click
	m.addBinding('toggle', function(prop){
		this.onclick = function(){
			//	Toggle allows an enum list to be toggled, eg: [prop, value2, value2]
			var isFunc = typeof prop === 'function', tmp, i, vals = [], val, tVal;

			//	Toggle boolean
			if(isFunc) {
				value = prop();
				prop(!value);
			} else {
				//	Toggle enumeration
				tmp = prop[0];
				val = tmp();
				vals = prop.slice(1);
				tVal = vals[0];

				for(i = 0; i < vals.length; i += 1) {
					if(val == vals[i]) {
						if(typeof vals[i+1] !== 'undefined') {
							tVal = vals[i+1];
						}
						break;
					}
				}
				tmp(tVal);
			}
		};
	}, true);

	//	Set hover states, a'la jQuery pattern
	m.addBinding('hover', function(prop){
		this.onmouseover = prop[0];
		if(prop[1]) {
			this.onmouseout = prop[1];
		}
	}, true );

	//	Add value bindings for various event types 
	var events = ["Input", "Keyup", "Keypress"],
		createBinding = function(name, eve){
			//	Bi-directional binding of value
			m.addBinding(name, function(prop) {
				if (typeof prop == "function") {
					this.value = prop();
					this[eve] = m.withAttr("value", prop);
				} else {
					this.value = prop;
				}
			}, true);
		};

	for(var i = 0; i < events.length; i += 1) {
		var eve = events[i];
		createBinding("value" + eve, "on" + eve.toLowerCase());
	}


	//	Set a value on a property
	m.set = function(prop, value){
		return function() {
			prop(value);
		};
	};

	/*	Returns a function that can trigger a binding 
		Usage: onclick: m.trigger('binding', prop)
	*/
	m.trigger = function(){
		var args = Array.prototype.slice.call(arguments);
		return function(){
			var name = args[0],
				argList = args.slice(1);
			if (m.bindings[name]) {
				m.bindings[name].func.apply(this, argList);
			}
		};
	};

	return m.bindings;
};

if (typeof module != "undefined" && module !== null && module.exports) {
	module.exports = mithrilBindings;
} else if (typeof define === "function" && define.amd) {
	define(function() {
		return mithrilBindings;
	});
} else {
	mithrilBindings(typeof window != "undefined"? window.m || {}: {});
}

}());
},{}],5:[function(require,module,exports){
//	Mithril sugar tags.
//	Copyright (C) 2015 jsguy (Mikkel Bergmann)
//	MIT licensed
(function(){
var mithrilSugartags = function(m, scope){
	m.sugarTags = m.sugarTags || {};
	scope = scope || m;

	var arg = function(l1, l2){
			var i;
			for (i in l2) {if(l2.hasOwnProperty(i)) {
				l1.push(l2[i]);
			}}
			return l1;
		}, 
		getClassList = function(args){
			var i, result;
			for(i in args) {
				if(args[i] && args[i].class) {
					return typeof (args[i].class == "string")? 
						args[i].class.split(" "):
						false;
				}
			}
		},
		makeSugarTag = function(tag) {
			var c, el;
			return function() {
				var args = Array.prototype.slice.call(arguments);
				//	if class is string, allow use of cache
				if(c = getClassList(args)) {
					el = [tag + "." + c.join(".")];
					//	Remove class tag, so we don't duplicate
					for(var i in args) {
						if(args[i] && args[i].class) {
							delete args[i].class;
						}
					}
				} else {
					el = [tag];
				}
				return (m.e? m.e: m).apply(this, arg(el, args));
			};
		},
		tagList = ["A","ABBR","ACRONYM","ADDRESS","AREA","ARTICLE","ASIDE","AUDIO","B","BDI","BDO","BIG","BLOCKQUOTE","BODY","BR","BUTTON","CANVAS","CAPTION","CITE","CODE","COL","COLGROUP","COMMAND","DATALIST","DD","DEL","DETAILS","DFN","DIV","DL","DT","EM","EMBED","FIELDSET","FIGCAPTION","FIGURE","FOOTER","FORM","FRAME","FRAMESET","H1","H2","H3","H4","H5","H6","HEAD","HEADER","HGROUP","HR","HTML","I","IFRAME","IMG","INPUT","INS","KBD","KEYGEN","LABEL","LEGEND","LI","LINK","MAP","MARK","META","METER","NAV","NOSCRIPT","OBJECT","OL","OPTGROUP","OPTION","OUTPUT","P","PARAM","PRE","PROGRESS","Q","RP","RT","RUBY","SAMP","SCRIPT","SECTION","SELECT","SMALL","SOURCE","SPAN","SPLIT","STRONG","STYLE","SUB","SUMMARY","SUP","TABLE","TBODY","TD","TEXTAREA","TFOOT","TH","THEAD","TIME","TITLE","TR","TRACK","TT","UL","VAR","VIDEO","WBR"],
		lowerTagCache = {},
		i;

	//	Create sugar'd functions in the required scopes
	for (i in tagList) {if(tagList.hasOwnProperty(i)) {
		(function(tag){
			var lowerTag = tag.toLowerCase();
			scope[tag] = lowerTagCache[lowerTag] = makeSugarTag(lowerTag);
		}(tagList[i]));
	}}

	//	Lowercased sugar tags
	m.sugarTags.lower = function(){
		return lowerTagCache;
	};

	return scope;
};

if (typeof module != "undefined" && module !== null && module.exports) {
	module.exports = mithrilSugartags;
} else if (typeof define === "function" && define.amd) {
	define(function() {
		return mithrilSugartags;
	});
} else {
	mithrilSugartags(
		typeof window != "undefined"? window.m || {}: {},
		typeof window != "undefined"? window: {}
	);
}

}());
},{}],6:[function(require,module,exports){
var m = (function app(window, undefined) {
	var OBJECT = "[object Object]", ARRAY = "[object Array]", STRING = "[object String]", FUNCTION = "function";
	var type = {}.toString;
	var parser = /(?:(^|#|\.)([^#\.\[\]]+))|(\[.+?\])/g, attrParser = /\[(.+?)(?:=("|'|)(.*?)\2)?\]/;
	var voidElements = /^(AREA|BASE|BR|COL|COMMAND|EMBED|HR|IMG|INPUT|KEYGEN|LINK|META|PARAM|SOURCE|TRACK|WBR)$/;
	var noop = function() {}

	// caching commonly used variables
	var $document, $location, $requestAnimationFrame, $cancelAnimationFrame;

	// self invoking function needed because of the way mocks work
	function initialize(window){
		$document = window.document;
		$location = window.location;
		$cancelAnimationFrame = window.cancelAnimationFrame || window.clearTimeout;
		$requestAnimationFrame = window.requestAnimationFrame || window.setTimeout;
	}

	initialize(window);


	/**
	 * @typedef {String} Tag
	 * A string that looks like -> div.classname#id[param=one][param2=two]
	 * Which describes a DOM node
	 */

	/**
	 *
	 * @param {Tag} The DOM node tag
	 * @param {Object=[]} optional key-value pairs to be mapped to DOM attrs
	 * @param {...mNode=[]} Zero or more Mithril child nodes. Can be an array, or splat (optional)
	 *
	 */
	function m() {
		var args = [].slice.call(arguments);
		var hasAttrs = args[1] != null && type.call(args[1]) === OBJECT && !("tag" in args[1] || "view" in args[1]) && !("subtree" in args[1]);
		var attrs = hasAttrs ? args[1] : {};
		var classAttrName = "class" in attrs ? "class" : "className";
		var cell = {tag: "div", attrs: {}};
		var match, classes = [];
		if (type.call(args[0]) != STRING) throw new Error("selector in m(selector, attrs, children) should be a string")
		while (match = parser.exec(args[0])) {
			if (match[1] === "" && match[2]) cell.tag = match[2];
			else if (match[1] === "#") cell.attrs.id = match[2];
			else if (match[1] === ".") classes.push(match[2]);
			else if (match[3][0] === "[") {
				var pair = attrParser.exec(match[3]);
				cell.attrs[pair[1]] = pair[3] || (pair[2] ? "" :true)
			}
		}

		var children = hasAttrs ? args.slice(2) : args.slice(1);
		if (children.length === 1 && type.call(children[0]) === ARRAY) {
			cell.children = children[0]
		}
		else {
			cell.children = children
		}
		
		for (var attrName in attrs) {
			if (attrs.hasOwnProperty(attrName)) {
				if (attrName === classAttrName && attrs[attrName] != null && attrs[attrName] !== "") {
					classes.push(attrs[attrName])
					cell.attrs[attrName] = "" //create key in correct iteration order
				}
				else cell.attrs[attrName] = attrs[attrName]
			}
		}
		if (classes.length > 0) cell.attrs[classAttrName] = classes.join(" ");
		
		return cell
	}
	function build(parentElement, parentTag, parentCache, parentIndex, data, cached, shouldReattach, index, editable, namespace, configs) {
		//`build` is a recursive function that manages creation/diffing/removal of DOM elements based on comparison between `data` and `cached`
		//the diff algorithm can be summarized as this:
		//1 - compare `data` and `cached`
		//2 - if they are different, copy `data` to `cached` and update the DOM based on what the difference is
		//3 - recursively apply this algorithm for every array and for the children of every virtual element

		//the `cached` data structure is essentially the same as the previous redraw's `data` data structure, with a few additions:
		//- `cached` always has a property called `nodes`, which is a list of DOM elements that correspond to the data represented by the respective virtual element
		//- in order to support attaching `nodes` as a property of `cached`, `cached` is *always* a non-primitive object, i.e. if the data was a string, then cached is a String instance. If data was `null` or `undefined`, cached is `new String("")`
		//- `cached also has a `configContext` property, which is the state storage object exposed by config(element, isInitialized, context)
		//- when `cached` is an Object, it represents a virtual element; when it's an Array, it represents a list of elements; when it's a String, Number or Boolean, it represents a text node

		//`parentElement` is a DOM element used for W3C DOM API calls
		//`parentTag` is only used for handling a corner case for textarea values
		//`parentCache` is used to remove nodes in some multi-node cases
		//`parentIndex` and `index` are used to figure out the offset of nodes. They're artifacts from before arrays started being flattened and are likely refactorable
		//`data` and `cached` are, respectively, the new and old nodes being diffed
		//`shouldReattach` is a flag indicating whether a parent node was recreated (if so, and if this node is reused, then this node must reattach itself to the new parent)
		//`editable` is a flag that indicates whether an ancestor is contenteditable
		//`namespace` indicates the closest HTML namespace as it cascades down from an ancestor
		//`configs` is a list of config functions to run after the topmost `build` call finishes running

		//there's logic that relies on the assumption that null and undefined data are equivalent to empty strings
		//- this prevents lifecycle surprises from procedural helpers that mix implicit and explicit return statements (e.g. function foo() {if (cond) return m("div")}
		//- it simplifies diffing code
		//data.toString() might throw or return null if data is the return value of Console.log in Firefox (behavior depends on version)
		try {if (data == null || data.toString() == null) data = "";} catch (e) {data = ""}
		if (data.subtree === "retain") return cached;
		var cachedType = type.call(cached), dataType = type.call(data);
		if (cached == null || cachedType !== dataType) {
			if (cached != null) {
				if (parentCache && parentCache.nodes) {
					var offset = index - parentIndex;
					var end = offset + (dataType === ARRAY ? data : cached.nodes).length;
					clear(parentCache.nodes.slice(offset, end), parentCache.slice(offset, end))
				}
				else if (cached.nodes) clear(cached.nodes, cached)
			}
			cached = new data.constructor;
			if (cached.tag) cached = {}; //if constructor creates a virtual dom element, use a blank object as the base cached node instead of copying the virtual el (#277)
			cached.nodes = []
		}

		if (dataType === ARRAY) {
			//recursively flatten array
			for (var i = 0, len = data.length; i < len; i++) {
				if (type.call(data[i]) === ARRAY) {
					data = data.concat.apply([], data);
					i-- //check current index again and flatten until there are no more nested arrays at that index
					len = data.length
				}
			}
			
			var nodes = [], intact = cached.length === data.length, subArrayCount = 0;

			//keys algorithm: sort elements without recreating them if keys are present
			//1) create a map of all existing keys, and mark all for deletion
			//2) add new keys to map and mark them for addition
			//3) if key exists in new list, change action from deletion to a move
			//4) for each key, handle its corresponding action as marked in previous steps
			var DELETION = 1, INSERTION = 2 , MOVE = 3;
			var existing = {}, shouldMaintainIdentities = false;
			for (var i = 0; i < cached.length; i++) {
				if (cached[i] && cached[i].attrs && cached[i].attrs.key != null) {
					shouldMaintainIdentities = true;
					existing[cached[i].attrs.key] = {action: DELETION, index: i}
				}
			}
			
			var guid = 0
			for (var i = 0, len = data.length; i < len; i++) {
				if (data[i] && data[i].attrs && data[i].attrs.key != null) {
					for (var j = 0, len = data.length; j < len; j++) {
						if (data[j] && data[j].attrs && data[j].attrs.key == null) data[j].attrs.key = "__mithril__" + guid++
					}
					break
				}
			}
			
			if (shouldMaintainIdentities) {
				var keysDiffer = false
				if (data.length != cached.length) keysDiffer = true
				else for (var i = 0, cachedCell, dataCell; cachedCell = cached[i], dataCell = data[i]; i++) {
					if (cachedCell.attrs && dataCell.attrs && cachedCell.attrs.key != dataCell.attrs.key) {
						keysDiffer = true
						break
					}
				}
				
				if (keysDiffer) {
					for (var i = 0, len = data.length; i < len; i++) {
						if (data[i] && data[i].attrs) {
							if (data[i].attrs.key != null) {
								var key = data[i].attrs.key;
								if (!existing[key]) existing[key] = {action: INSERTION, index: i};
								else existing[key] = {
									action: MOVE,
									index: i,
									from: existing[key].index,
									element: cached.nodes[existing[key].index] || $document.createElement("div")
								}
							}
						}
					}
					var actions = []
					for (var prop in existing) actions.push(existing[prop])
					var changes = actions.sort(sortChanges);
					var newCached = new Array(cached.length)
					newCached.nodes = cached.nodes.slice()

					for (var i = 0, change; change = changes[i]; i++) {
						if (change.action === DELETION) {
							clear(cached[change.index].nodes, cached[change.index]);
							newCached.splice(change.index, 1)
						}
						if (change.action === INSERTION) {
							var dummy = $document.createElement("div");
							dummy.key = data[change.index].attrs.key;
							parentElement.insertBefore(dummy, parentElement.childNodes[change.index] || null);
							newCached.splice(change.index, 0, {attrs: {key: data[change.index].attrs.key}, nodes: [dummy]})
							newCached.nodes[change.index] = dummy
						}

						if (change.action === MOVE) {
							if (parentElement.childNodes[change.index] !== change.element && change.element !== null) {
								parentElement.insertBefore(change.element, parentElement.childNodes[change.index] || null)
							}
							newCached[change.index] = cached[change.from]
							newCached.nodes[change.index] = change.element
						}
					}
					cached = newCached;
				}
			}
			//end key algorithm

			for (var i = 0, cacheCount = 0, len = data.length; i < len; i++) {
				//diff each item in the array
				var item = build(parentElement, parentTag, cached, index, data[i], cached[cacheCount], shouldReattach, index + subArrayCount || subArrayCount, editable, namespace, configs);
				if (item === undefined) continue;
				if (!item.nodes.intact) intact = false;
				if (item.$trusted) {
					//fix offset of next element if item was a trusted string w/ more than one html element
					//the first clause in the regexp matches elements
					//the second clause (after the pipe) matches text nodes
					subArrayCount += (item.match(/<[^\/]|\>\s*[^<]/g) || [0]).length
				}
				else subArrayCount += type.call(item) === ARRAY ? item.length : 1;
				cached[cacheCount++] = item
			}
			if (!intact) {
				//diff the array itself
				
				//update the list of DOM nodes by collecting the nodes from each item
				for (var i = 0, len = data.length; i < len; i++) {
					if (cached[i] != null) nodes.push.apply(nodes, cached[i].nodes)
				}
				//remove items from the end of the array if the new array is shorter than the old one
				//if errors ever happen here, the issue is most likely a bug in the construction of the `cached` data structure somewhere earlier in the program
				for (var i = 0, node; node = cached.nodes[i]; i++) {
					if (node.parentNode != null && nodes.indexOf(node) < 0) clear([node], [cached[i]])
				}
				if (data.length < cached.length) cached.length = data.length;
				cached.nodes = nodes
			}
		}
		else if (data != null && dataType === OBJECT) {
			var views = [], controllers = []
			while (data.view) {
				var view = data.view.$original || data.view
				var controllerIndex = m.redraw.strategy() == "diff" && cached.views ? cached.views.indexOf(view) : -1
				var controller = controllerIndex > -1 ? cached.controllers[controllerIndex] : new (data.controller || noop)
				var key = data && data.attrs && data.attrs.key
				data = pendingRequests == 0 || (cached && cached.controllers && cached.controllers.indexOf(controller) > -1) ? data.view(controller) : {tag: "placeholder"}
				if (data.subtree === "retain") return cached;
				if (key) {
					if (!data.attrs) data.attrs = {}
					data.attrs.key = key
				}
				if (controller.onunload) unloaders.push({controller: controller, handler: controller.onunload})
				views.push(view)
				controllers.push(controller)
			}
			if (!data.tag && controllers.length) throw new Error("Component template must return a virtual element, not an array, string, etc.")
			if (!data.attrs) data.attrs = {};
			if (!cached.attrs) cached.attrs = {};

			var dataAttrKeys = Object.keys(data.attrs)
			var hasKeys = dataAttrKeys.length > ("key" in data.attrs ? 1 : 0)
			//if an element is different enough from the one in cache, recreate it
			if (data.tag != cached.tag || dataAttrKeys.sort().join() != Object.keys(cached.attrs).sort().join() || data.attrs.id != cached.attrs.id || data.attrs.key != cached.attrs.key || (m.redraw.strategy() == "all" && (!cached.configContext || cached.configContext.retain !== true)) || (m.redraw.strategy() == "diff" && cached.configContext && cached.configContext.retain === false)) {
				if (cached.nodes.length) clear(cached.nodes);
				if (cached.configContext && typeof cached.configContext.onunload === FUNCTION) cached.configContext.onunload()
				if (cached.controllers) {
					for (var i = 0, controller; controller = cached.controllers[i]; i++) {
						if (typeof controller.onunload === FUNCTION) controller.onunload({preventDefault: noop})
					}
				}
			}
			if (type.call(data.tag) != STRING) return;

			var node, isNew = cached.nodes.length === 0;
			if (data.attrs.xmlns) namespace = data.attrs.xmlns;
			else if (data.tag === "svg") namespace = "http://www.w3.org/2000/svg";
			else if (data.tag === "math") namespace = "http://www.w3.org/1998/Math/MathML";
			
			if (isNew) {
				if (data.attrs.is) node = namespace === undefined ? $document.createElement(data.tag, data.attrs.is) : $document.createElementNS(namespace, data.tag, data.attrs.is);
				else node = namespace === undefined ? $document.createElement(data.tag) : $document.createElementNS(namespace, data.tag);
				cached = {
					tag: data.tag,
					//set attributes first, then create children
					attrs: hasKeys ? setAttributes(node, data.tag, data.attrs, {}, namespace) : data.attrs,
					children: data.children != null && data.children.length > 0 ?
						build(node, data.tag, undefined, undefined, data.children, cached.children, true, 0, data.attrs.contenteditable ? node : editable, namespace, configs) :
						data.children,
					nodes: [node]
				};
				if (controllers.length) {
					cached.views = views
					cached.controllers = controllers
					for (var i = 0, controller; controller = controllers[i]; i++) {
						if (controller.onunload && controller.onunload.$old) controller.onunload = controller.onunload.$old
						if (pendingRequests && controller.onunload) {
							var onunload = controller.onunload
							controller.onunload = noop
							controller.onunload.$old = onunload
						}
					}
				}
				
				if (cached.children && !cached.children.nodes) cached.children.nodes = [];
				//edge case: setting value on <select> doesn't work before children exist, so set it again after children have been created
				if (data.tag === "select" && "value" in data.attrs) setAttributes(node, data.tag, {value: data.attrs.value}, {}, namespace);
				parentElement.insertBefore(node, parentElement.childNodes[index] || null)
			}
			else {
				node = cached.nodes[0];
				if (hasKeys) setAttributes(node, data.tag, data.attrs, cached.attrs, namespace);
				cached.children = build(node, data.tag, undefined, undefined, data.children, cached.children, false, 0, data.attrs.contenteditable ? node : editable, namespace, configs);
				cached.nodes.intact = true;
				if (controllers.length) {
					cached.views = views
					cached.controllers = controllers
				}
				if (shouldReattach === true && node != null) parentElement.insertBefore(node, parentElement.childNodes[index] || null)
			}
			//schedule configs to be called. They are called after `build` finishes running
			if (typeof data.attrs["config"] === FUNCTION) {
				var context = cached.configContext = cached.configContext || {};

				// bind
				var callback = function(data, args) {
					return function() {
						return data.attrs["config"].apply(data, args)
					}
				};
				configs.push(callback(data, [node, !isNew, context, cached]))
			}
		}
		else if (typeof data != FUNCTION) {
			//handle text nodes
			var nodes;
			if (cached.nodes.length === 0) {
				if (data.$trusted) {
					nodes = injectHTML(parentElement, index, data)
				}
				else {
					nodes = [$document.createTextNode(data)];
					if (!parentElement.nodeName.match(voidElements)) parentElement.insertBefore(nodes[0], parentElement.childNodes[index] || null)
				}
				cached = "string number boolean".indexOf(typeof data) > -1 ? new data.constructor(data) : data;
				cached.nodes = nodes
			}
			else if (cached.valueOf() !== data.valueOf() || shouldReattach === true) {
				nodes = cached.nodes;
				if (!editable || editable !== $document.activeElement) {
					if (data.$trusted) {
						clear(nodes, cached);
						nodes = injectHTML(parentElement, index, data)
					}
					else {
						//corner case: replacing the nodeValue of a text node that is a child of a textarea/contenteditable doesn't work
						//we need to update the value property of the parent textarea or the innerHTML of the contenteditable element instead
						if (parentTag === "textarea") parentElement.value = data;
						else if (editable) editable.innerHTML = data;
						else {
							if (nodes[0].nodeType === 1 || nodes.length > 1) { //was a trusted string
								clear(cached.nodes, cached);
								nodes = [$document.createTextNode(data)]
							}
							parentElement.insertBefore(nodes[0], parentElement.childNodes[index] || null);
							nodes[0].nodeValue = data
						}
					}
				}
				cached = new data.constructor(data);
				cached.nodes = nodes
			}
			else cached.nodes.intact = true
		}

		return cached
	}
	function sortChanges(a, b) {return a.action - b.action || a.index - b.index}
	function setAttributes(node, tag, dataAttrs, cachedAttrs, namespace) {
		for (var attrName in dataAttrs) {
			var dataAttr = dataAttrs[attrName];
			var cachedAttr = cachedAttrs[attrName];
			if (!(attrName in cachedAttrs) || (cachedAttr !== dataAttr)) {
				cachedAttrs[attrName] = dataAttr;
				try {
					//`config` isn't a real attributes, so ignore it
					if (attrName === "config" || attrName == "key") continue;
					//hook event handlers to the auto-redrawing system
					else if (typeof dataAttr === FUNCTION && attrName.indexOf("on") === 0) {
						node[attrName] = autoredraw(dataAttr, node)
					}
					//handle `style: {...}`
					else if (attrName === "style" && dataAttr != null && type.call(dataAttr) === OBJECT) {
						for (var rule in dataAttr) {
							if (cachedAttr == null || cachedAttr[rule] !== dataAttr[rule]) node.style[rule] = dataAttr[rule]
						}
						for (var rule in cachedAttr) {
							if (!(rule in dataAttr)) node.style[rule] = ""
						}
					}
					//handle SVG
					else if (namespace != null) {
						if (attrName === "href") node.setAttributeNS("http://www.w3.org/1999/xlink", "href", dataAttr);
						else if (attrName === "className") node.setAttribute("class", dataAttr);
						else node.setAttribute(attrName, dataAttr)
					}
					//handle cases that are properties (but ignore cases where we should use setAttribute instead)
					//- list and form are typically used as strings, but are DOM element references in js
					//- when using CSS selectors (e.g. `m("[style='']")`), style is used as a string, but it's an object in js
					else if (attrName in node && !(attrName === "list" || attrName === "style" || attrName === "form" || attrName === "type" || attrName === "width" || attrName === "height")) {
						//#348 don't set the value if not needed otherwise cursor placement breaks in Chrome
						if (tag !== "input" || node[attrName] !== dataAttr) node[attrName] = dataAttr
					}
					else node.setAttribute(attrName, dataAttr)
				}
				catch (e) {
					//swallow IE's invalid argument errors to mimic HTML's fallback-to-doing-nothing-on-invalid-attributes behavior
					if (e.message.indexOf("Invalid argument") < 0) throw e
				}
			}
			//#348 dataAttr may not be a string, so use loose comparison (double equal) instead of strict (triple equal)
			else if (attrName === "value" && tag === "input" && node.value != dataAttr) {
				node.value = dataAttr
			}
		}
		return cachedAttrs
	}
	function clear(nodes, cached) {
		for (var i = nodes.length - 1; i > -1; i--) {
			if (nodes[i] && nodes[i].parentNode) {
				try {nodes[i].parentNode.removeChild(nodes[i])}
				catch (e) {} //ignore if this fails due to order of events (see http://stackoverflow.com/questions/21926083/failed-to-execute-removechild-on-node)
				cached = [].concat(cached);
				if (cached[i]) unload(cached[i])
			}
		}
		if (nodes.length != 0) nodes.length = 0
	}
	function unload(cached) {
		if (cached.configContext && typeof cached.configContext.onunload === FUNCTION) {
			cached.configContext.onunload();
			cached.configContext.onunload = null
		}
		if (cached.controllers) {
			for (var i = 0, controller; controller = cached.controllers[i]; i++) {
				if (typeof controller.onunload === FUNCTION) controller.onunload({preventDefault: noop});
			}
		}
		if (cached.children) {
			if (type.call(cached.children) === ARRAY) {
				for (var i = 0, child; child = cached.children[i]; i++) unload(child)
			}
			else if (cached.children.tag) unload(cached.children)
		}
	}
	function injectHTML(parentElement, index, data) {
		var nextSibling = parentElement.childNodes[index];
		if (nextSibling) {
			var isElement = nextSibling.nodeType != 1;
			var placeholder = $document.createElement("span");
			if (isElement) {
				parentElement.insertBefore(placeholder, nextSibling || null);
				placeholder.insertAdjacentHTML("beforebegin", data);
				parentElement.removeChild(placeholder)
			}
			else nextSibling.insertAdjacentHTML("beforebegin", data)
		}
		else parentElement.insertAdjacentHTML("beforeend", data);
		var nodes = [];
		while (parentElement.childNodes[index] !== nextSibling) {
			nodes.push(parentElement.childNodes[index]);
			index++
		}
		return nodes
	}
	function autoredraw(callback, object) {
		return function(e) {
			e = e || event;
			m.redraw.strategy("diff");
			m.startComputation();
			try {return callback.call(object, e)}
			finally {
				endFirstComputation()
			}
		}
	}

	var html;
	var documentNode = {
		appendChild: function(node) {
			if (html === undefined) html = $document.createElement("html");
			if ($document.documentElement && $document.documentElement !== node) {
				$document.replaceChild(node, $document.documentElement)
			}
			else $document.appendChild(node);
			this.childNodes = $document.childNodes
		},
		insertBefore: function(node) {
			this.appendChild(node)
		},
		childNodes: []
	};
	var nodeCache = [], cellCache = {};
	m.render = function(root, cell, forceRecreation) {
		var configs = [];
		if (!root) throw new Error("Ensure the DOM element being passed to m.route/m.mount/m.render is not undefined.");
		var id = getCellCacheKey(root);
		var isDocumentRoot = root === $document;
		var node = isDocumentRoot || root === $document.documentElement ? documentNode : root;
		if (isDocumentRoot && cell.tag != "html") cell = {tag: "html", attrs: {}, children: cell};
		if (cellCache[id] === undefined) clear(node.childNodes);
		if (forceRecreation === true) reset(root);
		cellCache[id] = build(node, null, undefined, undefined, cell, cellCache[id], false, 0, null, undefined, configs);
		for (var i = 0, len = configs.length; i < len; i++) configs[i]()
	};
	function getCellCacheKey(element) {
		var index = nodeCache.indexOf(element);
		return index < 0 ? nodeCache.push(element) - 1 : index
	}

	m.trust = function(value) {
		value = new String(value);
		value.$trusted = true;
		return value
	};

	function gettersetter(store) {
		var prop = function() {
			if (arguments.length) store = arguments[0];
			return store
		};

		prop.toJSON = function() {
			return store
		};

		return prop
	}

	m.prop = function (store) {
		//note: using non-strict equality check here because we're checking if store is null OR undefined
		if (((store != null && type.call(store) === OBJECT) || typeof store === FUNCTION) && typeof store.then === FUNCTION) {
			return propify(store)
		}

		return gettersetter(store)
	};

	var roots = [], components = [], controllers = [], lastRedrawId = null, lastRedrawCallTime = 0, computePreRedrawHook = null, computePostRedrawHook = null, prevented = false, topComponent, unloaders = [];
	var FRAME_BUDGET = 16; //60 frames per second = 1 call per 16 ms
	function parameterize(component, args) {
		var controller = function() {
			return (component.controller || noop).apply(this, args) || this
		}
		var view = function(ctrl) {
			if (arguments.length > 1) args = args.concat([].slice.call(arguments, 1))
			return component.view.apply(component, args ? [ctrl].concat(args) : [ctrl])
		}
		view.$original = component.view
		var output = {controller: controller, view: view}
		if (args[0] && args[0].key != null) output.attrs = {key: args[0].key}
		return output
	}
	m.component = function(component) {
		return parameterize(component, [].slice.call(arguments, 1))
	}
	m.mount = m.module = function(root, component) {
		if (!root) throw new Error("Please ensure the DOM element exists before rendering a template into it.");
		var index = roots.indexOf(root);
		if (index < 0) index = roots.length;
		
		var isPrevented = false;
		var event = {preventDefault: function() {
			isPrevented = true;
			computePreRedrawHook = computePostRedrawHook = null;
		}};
		for (var i = 0, unloader; unloader = unloaders[i]; i++) {
			unloader.handler.call(unloader.controller, event)
			unloader.controller.onunload = null
		}
		if (isPrevented) {
			for (var i = 0, unloader; unloader = unloaders[i]; i++) unloader.controller.onunload = unloader.handler
		}
		else unloaders = []
		
		if (controllers[index] && typeof controllers[index].onunload === FUNCTION) {
			controllers[index].onunload(event)
		}
		
		if (!isPrevented) {
			m.redraw.strategy("all");
			m.startComputation();
			roots[index] = root;
			if (arguments.length > 2) component = subcomponent(component, [].slice.call(arguments, 2))
			var currentComponent = topComponent = component = component || {controller: function() {}};
			var constructor = component.controller || noop
			var controller = new constructor;
			//controllers may call m.mount recursively (via m.route redirects, for example)
			//this conditional ensures only the last recursive m.mount call is applied
			if (currentComponent === topComponent) {
				controllers[index] = controller;
				components[index] = component
			}
			endFirstComputation();
			return controllers[index]
		}
	};
	var redrawing = false
	m.redraw = function(force) {
		if (redrawing) return
		redrawing = true
		//lastRedrawId is a positive number if a second redraw is requested before the next animation frame
		//lastRedrawID is null if it's the first redraw and not an event handler
		if (lastRedrawId && force !== true) {
			//when setTimeout: only reschedule redraw if time between now and previous redraw is bigger than a frame, otherwise keep currently scheduled timeout
			//when rAF: always reschedule redraw
			if ($requestAnimationFrame === window.requestAnimationFrame || new Date - lastRedrawCallTime > FRAME_BUDGET) {
				if (lastRedrawId > 0) $cancelAnimationFrame(lastRedrawId);
				lastRedrawId = $requestAnimationFrame(redraw, FRAME_BUDGET)
			}
		}
		else {
			redraw();
			lastRedrawId = $requestAnimationFrame(function() {lastRedrawId = null}, FRAME_BUDGET)
		}
		redrawing = false
	};
	m.redraw.strategy = m.prop();
	function redraw() {
		if (computePreRedrawHook) {
			computePreRedrawHook()
			computePreRedrawHook = null
		}
		for (var i = 0, root; root = roots[i]; i++) {
			if (controllers[i]) {
				var args = components[i].controller && components[i].controller.$$args ? [controllers[i]].concat(components[i].controller.$$args) : [controllers[i]]
				m.render(root, components[i].view ? components[i].view(controllers[i], args) : "")
			}
		}
		//after rendering within a routed context, we need to scroll back to the top, and fetch the document title for history.pushState
		if (computePostRedrawHook) {
			computePostRedrawHook();
			computePostRedrawHook = null
		}
		lastRedrawId = null;
		lastRedrawCallTime = new Date;
		m.redraw.strategy("diff")
	}

	var pendingRequests = 0;
	m.startComputation = function() {pendingRequests++};
	m.endComputation = function() {
		pendingRequests = Math.max(pendingRequests - 1, 0);
		if (pendingRequests === 0) m.redraw()
	};
	var endFirstComputation = function() {
		if (m.redraw.strategy() == "none") {
			pendingRequests--
			m.redraw.strategy("diff")
		}
		else m.endComputation();
	}

	m.withAttr = function(prop, withAttrCallback) {
		return function(e) {
			e = e || event;
			var currentTarget = e.currentTarget || this;
			withAttrCallback(prop in currentTarget ? currentTarget[prop] : currentTarget.getAttribute(prop))
		}
	};

	//routing
	var modes = {pathname: "", hash: "#", search: "?"};
	var redirect = noop, routeParams, currentRoute, isDefaultRoute = false;
	m.route = function() {
		//m.route()
		if (arguments.length === 0) return currentRoute;
		//m.route(el, defaultRoute, routes)
		else if (arguments.length === 3 && type.call(arguments[1]) === STRING) {
			var root = arguments[0], defaultRoute = arguments[1], router = arguments[2];
			redirect = function(source) {
				var path = currentRoute = normalizeRoute(source);
				if (!routeByValue(root, router, path)) {
					if (isDefaultRoute) throw new Error("Ensure the default route matches one of the routes defined in m.route")
					isDefaultRoute = true
					m.route(defaultRoute, true)
					isDefaultRoute = false
				}
			};
			var listener = m.route.mode === "hash" ? "onhashchange" : "onpopstate";
			window[listener] = function() {
				var path = $location[m.route.mode]
				if (m.route.mode === "pathname") path += $location.search
				if (currentRoute != normalizeRoute(path)) {
					redirect(path)
				}
			};
			computePreRedrawHook = setScroll;
			window[listener]()
		}
		//config: m.route
		else if (arguments[0].addEventListener || arguments[0].attachEvent) {
			var element = arguments[0];
			var isInitialized = arguments[1];
			var context = arguments[2];
			var vdom = arguments[3];
			element.href = (m.route.mode !== 'pathname' ? $location.pathname : '') + modes[m.route.mode] + vdom.attrs.href;
			if (element.addEventListener) {
				element.removeEventListener("click", routeUnobtrusive);
				element.addEventListener("click", routeUnobtrusive)
			}
			else {
				element.detachEvent("onclick", routeUnobtrusive);
				element.attachEvent("onclick", routeUnobtrusive)
			}
		}
		//m.route(route, params, shouldReplaceHistoryEntry)
		else if (type.call(arguments[0]) === STRING) {
			var oldRoute = currentRoute;
			currentRoute = arguments[0];
			var args = arguments[1] || {}
			var queryIndex = currentRoute.indexOf("?")
			var params = queryIndex > -1 ? parseQueryString(currentRoute.slice(queryIndex + 1)) : {}
			for (var i in args) params[i] = args[i]
			var querystring = buildQueryString(params)
			var currentPath = queryIndex > -1 ? currentRoute.slice(0, queryIndex) : currentRoute
			if (querystring) currentRoute = currentPath + (currentPath.indexOf("?") === -1 ? "?" : "&") + querystring;

			var shouldReplaceHistoryEntry = (arguments.length === 3 ? arguments[2] : arguments[1]) === true || oldRoute === arguments[0];

			if (window.history.pushState) {
				computePreRedrawHook = setScroll
				computePostRedrawHook = function() {
					window.history[shouldReplaceHistoryEntry ? "replaceState" : "pushState"](null, $document.title, modes[m.route.mode] + currentRoute);
				};
				redirect(modes[m.route.mode] + currentRoute)
			}
			else {
				$location[m.route.mode] = currentRoute
				redirect(modes[m.route.mode] + currentRoute)
			}
		}
	};
	m.route.param = function(key) {
		if (!routeParams) throw new Error("You must call m.route(element, defaultRoute, routes) before calling m.route.param()")
		return routeParams[key]
	};
	m.route.mode = "search";
	function normalizeRoute(route) {
		return route.slice(modes[m.route.mode].length)
	}
	function routeByValue(root, router, path) {
		routeParams = {};

		var queryStart = path.indexOf("?");
		if (queryStart !== -1) {
			routeParams = parseQueryString(path.substr(queryStart + 1, path.length));
			path = path.substr(0, queryStart)
		}

		// Get all routes and check if there's
		// an exact match for the current path
		var keys = Object.keys(router);
		var index = keys.indexOf(path);
		if(index !== -1){
			m.mount(root, router[keys [index]]);
			return true;
		}

		for (var route in router) {
			if (route === path) {
				m.mount(root, router[route]);
				return true
			}

			var matcher = new RegExp("^" + route.replace(/:[^\/]+?\.{3}/g, "(.*?)").replace(/:[^\/]+/g, "([^\\/]+)") + "\/?$");

			if (matcher.test(path)) {
				path.replace(matcher, function() {
					var keys = route.match(/:[^\/]+/g) || [];
					var values = [].slice.call(arguments, 1, -2);
					for (var i = 0, len = keys.length; i < len; i++) routeParams[keys[i].replace(/:|\./g, "")] = decodeURIComponent(values[i])
					m.mount(root, router[route])
				});
				return true
			}
		}
	}
	function routeUnobtrusive(e) {
		e = e || event;
		if (e.ctrlKey || e.metaKey || e.which === 2) return;
		if (e.preventDefault) e.preventDefault();
		else e.returnValue = false;
		var currentTarget = e.currentTarget || e.srcElement;
		var args = m.route.mode === "pathname" && currentTarget.search ? parseQueryString(currentTarget.search.slice(1)) : {};
		while (currentTarget && currentTarget.nodeName.toUpperCase() != "A") currentTarget = currentTarget.parentNode
		m.route(currentTarget[m.route.mode].slice(modes[m.route.mode].length), args)
	}
	function setScroll() {
		if (m.route.mode != "hash" && $location.hash) $location.hash = $location.hash;
		else window.scrollTo(0, 0)
	}
	function buildQueryString(object, prefix) {
		var duplicates = {}
		var str = []
		for (var prop in object) {
			var key = prefix ? prefix + "[" + prop + "]" : prop
			var value = object[prop]
			var valueType = type.call(value)
			var pair = (value === null) ? encodeURIComponent(key) :
				valueType === OBJECT ? buildQueryString(value, key) :
				valueType === ARRAY ? value.reduce(function(memo, item) {
					if (!duplicates[key]) duplicates[key] = {}
					if (!duplicates[key][item]) {
						duplicates[key][item] = true
						return memo.concat(encodeURIComponent(key) + "=" + encodeURIComponent(item))
					}
					return memo
				}, []).join("&") :
				encodeURIComponent(key) + "=" + encodeURIComponent(value)
			if (value !== undefined) str.push(pair)
		}
		return str.join("&")
	}
	function parseQueryString(str) {
		if (str.charAt(0) === "?") str = str.substring(1);
		
		var pairs = str.split("&"), params = {};
		for (var i = 0, len = pairs.length; i < len; i++) {
			var pair = pairs[i].split("=");
			var key = decodeURIComponent(pair[0])
			var value = pair.length == 2 ? decodeURIComponent(pair[1]) : null
			if (params[key] != null) {
				if (type.call(params[key]) !== ARRAY) params[key] = [params[key]]
				params[key].push(value)
			}
			else params[key] = value
		}
		return params
	}
	m.route.buildQueryString = buildQueryString
	m.route.parseQueryString = parseQueryString
	
	function reset(root) {
		var cacheKey = getCellCacheKey(root);
		clear(root.childNodes, cellCache[cacheKey]);
		cellCache[cacheKey] = undefined
	}

	m.deferred = function () {
		var deferred = new Deferred();
		deferred.promise = propify(deferred.promise);
		return deferred
	};
	function propify(promise, initialValue) {
		var prop = m.prop(initialValue);
		promise.then(prop);
		prop.then = function(resolve, reject) {
			return propify(promise.then(resolve, reject), initialValue)
		};
		return prop
	}
	//Promiz.mithril.js | Zolmeister | MIT
	//a modified version of Promiz.js, which does not conform to Promises/A+ for two reasons:
	//1) `then` callbacks are called synchronously (because setTimeout is too slow, and the setImmediate polyfill is too big
	//2) throwing subclasses of Error cause the error to be bubbled up instead of triggering rejection (because the spec does not account for the important use case of default browser error handling, i.e. message w/ line number)
	function Deferred(successCallback, failureCallback) {
		var RESOLVING = 1, REJECTING = 2, RESOLVED = 3, REJECTED = 4;
		var self = this, state = 0, promiseValue = 0, next = [];

		self["promise"] = {};

		self["resolve"] = function(value) {
			if (!state) {
				promiseValue = value;
				state = RESOLVING;

				fire()
			}
			return this
		};

		self["reject"] = function(value) {
			if (!state) {
				promiseValue = value;
				state = REJECTING;

				fire()
			}
			return this
		};

		self.promise["then"] = function(successCallback, failureCallback) {
			var deferred = new Deferred(successCallback, failureCallback);
			if (state === RESOLVED) {
				deferred.resolve(promiseValue)
			}
			else if (state === REJECTED) {
				deferred.reject(promiseValue)
			}
			else {
				next.push(deferred)
			}
			return deferred.promise
		};

		function finish(type) {
			state = type || REJECTED;
			next.map(function(deferred) {
				state === RESOLVED && deferred.resolve(promiseValue) || deferred.reject(promiseValue)
			})
		}

		function thennable(then, successCallback, failureCallback, notThennableCallback) {
			if (((promiseValue != null && type.call(promiseValue) === OBJECT) || typeof promiseValue === FUNCTION) && typeof then === FUNCTION) {
				try {
					// count protects against abuse calls from spec checker
					var count = 0;
					then.call(promiseValue, function(value) {
						if (count++) return;
						promiseValue = value;
						successCallback()
					}, function (value) {
						if (count++) return;
						promiseValue = value;
						failureCallback()
					})
				}
				catch (e) {
					m.deferred.onerror(e);
					promiseValue = e;
					failureCallback()
				}
			} else {
				notThennableCallback()
			}
		}

		function fire() {
			// check if it's a thenable
			var then;
			try {
				then = promiseValue && promiseValue.then
			}
			catch (e) {
				m.deferred.onerror(e);
				promiseValue = e;
				state = REJECTING;
				return fire()
			}
			thennable(then, function() {
				state = RESOLVING;
				fire()
			}, function() {
				state = REJECTING;
				fire()
			}, function() {
				try {
					if (state === RESOLVING && typeof successCallback === FUNCTION) {
						promiseValue = successCallback(promiseValue)
					}
					else if (state === REJECTING && typeof failureCallback === "function") {
						promiseValue = failureCallback(promiseValue);
						state = RESOLVING
					}
				}
				catch (e) {
					m.deferred.onerror(e);
					promiseValue = e;
					return finish()
				}

				if (promiseValue === self) {
					promiseValue = TypeError();
					finish()
				}
				else {
					thennable(then, function () {
						finish(RESOLVED)
					}, finish, function () {
						finish(state === RESOLVING && RESOLVED)
					})
				}
			})
		}
	}
	m.deferred.onerror = function(e) {
		if (type.call(e) === "[object Error]" && !e.constructor.toString().match(/ Error/)) throw e
	};

	m.sync = function(args) {
		var method = "resolve";
		function synchronizer(pos, resolved) {
			return function(value) {
				results[pos] = value;
				if (!resolved) method = "reject";
				if (--outstanding === 0) {
					deferred.promise(results);
					deferred[method](results)
				}
				return value
			}
		}

		var deferred = m.deferred();
		var outstanding = args.length;
		var results = new Array(outstanding);
		if (args.length > 0) {
			for (var i = 0; i < args.length; i++) {
				args[i].then(synchronizer(i, true), synchronizer(i, false))
			}
		}
		else deferred.resolve([]);

		return deferred.promise
	};
	function identity(value) {return value}

	function ajax(options) {
		if (options.dataType && options.dataType.toLowerCase() === "jsonp") {
			var callbackKey = "mithril_callback_" + new Date().getTime() + "_" + (Math.round(Math.random() * 1e16)).toString(36);
			var script = $document.createElement("script");

			window[callbackKey] = function(resp) {
				script.parentNode.removeChild(script);
				options.onload({
					type: "load",
					target: {
						responseText: resp
					}
				});
				window[callbackKey] = undefined
			};

			script.onerror = function(e) {
				script.parentNode.removeChild(script);

				options.onerror({
					type: "error",
					target: {
						status: 500,
						responseText: JSON.stringify({error: "Error making jsonp request"})
					}
				});
				window[callbackKey] = undefined;

				return false
			};

			script.onload = function(e) {
				return false
			};

			script.src = options.url
				+ (options.url.indexOf("?") > 0 ? "&" : "?")
				+ (options.callbackKey ? options.callbackKey : "callback")
				+ "=" + callbackKey
				+ "&" + buildQueryString(options.data || {});
			$document.body.appendChild(script)
		}
		else {
			var xhr = new window.XMLHttpRequest;
			xhr.open(options.method, options.url, true, options.user, options.password);
			xhr.onreadystatechange = function() {
				if (xhr.readyState === 4) {
					if (xhr.status >= 200 && xhr.status < 300) options.onload({type: "load", target: xhr});
					else options.onerror({type: "error", target: xhr})
				}
			};
			if (options.serialize === JSON.stringify && options.data && options.method !== "GET") {
				xhr.setRequestHeader("Content-Type", "application/json; charset=utf-8")
			}
			if (options.deserialize === JSON.parse) {
				xhr.setRequestHeader("Accept", "application/json, text/*");
			}
			if (typeof options.config === FUNCTION) {
				var maybeXhr = options.config(xhr, options);
				if (maybeXhr != null) xhr = maybeXhr
			}

			var data = options.method === "GET" || !options.data ? "" : options.data
			if (data && (type.call(data) != STRING && data.constructor != window.FormData)) {
				throw "Request data should be either be a string or FormData. Check the `serialize` option in `m.request`";
			}
			xhr.send(data);
			return xhr
		}
	}
	function bindData(xhrOptions, data, serialize) {
		if (xhrOptions.method === "GET" && xhrOptions.dataType != "jsonp") {
			var prefix = xhrOptions.url.indexOf("?") < 0 ? "?" : "&";
			var querystring = buildQueryString(data);
			xhrOptions.url = xhrOptions.url + (querystring ? prefix + querystring : "")
		}
		else xhrOptions.data = serialize(data);
		return xhrOptions
	}
	function parameterizeUrl(url, data) {
		var tokens = url.match(/:[a-z]\w+/gi);
		if (tokens && data) {
			for (var i = 0; i < tokens.length; i++) {
				var key = tokens[i].slice(1);
				url = url.replace(tokens[i], data[key]);
				delete data[key]
			}
		}
		return url
	}

	m.request = function(xhrOptions) {
		if (xhrOptions.background !== true) m.startComputation();
		var deferred = new Deferred();
		var isJSONP = xhrOptions.dataType && xhrOptions.dataType.toLowerCase() === "jsonp";
		var serialize = xhrOptions.serialize = isJSONP ? identity : xhrOptions.serialize || JSON.stringify;
		var deserialize = xhrOptions.deserialize = isJSONP ? identity : xhrOptions.deserialize || JSON.parse;
		var extract = isJSONP ? function(jsonp) {return jsonp.responseText} : xhrOptions.extract || function(xhr) {
			return xhr.responseText.length === 0 && deserialize === JSON.parse ? null : xhr.responseText
		};
		xhrOptions.method = (xhrOptions.method || 'GET').toUpperCase();
		xhrOptions.url = parameterizeUrl(xhrOptions.url, xhrOptions.data);
		xhrOptions = bindData(xhrOptions, xhrOptions.data, serialize);
		xhrOptions.onload = xhrOptions.onerror = function(e) {
			try {
				e = e || event;
				var unwrap = (e.type === "load" ? xhrOptions.unwrapSuccess : xhrOptions.unwrapError) || identity;
				var response = unwrap(deserialize(extract(e.target, xhrOptions)), e.target);
				if (e.type === "load") {
					if (type.call(response) === ARRAY && xhrOptions.type) {
						for (var i = 0; i < response.length; i++) response[i] = new xhrOptions.type(response[i])
					}
					else if (xhrOptions.type) response = new xhrOptions.type(response)
				}
				deferred[e.type === "load" ? "resolve" : "reject"](response)
			}
			catch (e) {
				m.deferred.onerror(e);
				deferred.reject(e)
			}
			if (xhrOptions.background !== true) m.endComputation()
		};
		ajax(xhrOptions);
		deferred.promise = propify(deferred.promise, xhrOptions.initialValue);
		return deferred.promise
	};

	//testing API
	m.deps = function(mock) {
		initialize(window = mock || window);
		return window;
	};
	//for internal testing only, do not use `m.deps.factory`
	m.deps.factory = app;

	return m
})(typeof window != "undefined" ? window : {});

if (typeof module != "undefined" && module !== null && module.exports) module.exports = m;
else if (typeof define === "function" && define.amd) define(function() {return m});

},{}],7:[function(require,module,exports){
/*
	mithril.animate - Copyright 2014 jsguy
	MIT Licensed.
*/
(function(){
var mithrilAnimate = function (m) {
	//	Known prefiex
	var prefixes = ['Moz', 'Webkit', 'Khtml', 'O', 'ms'],
	transitionProps = ['TransitionProperty', 'TransitionTimingFunction', 'TransitionDelay', 'TransitionDuration', 'TransitionEnd'],
	transformProps = ['rotate', 'rotatex', 'rotatey', 'scale', 'skew', 'translate', 'translatex', 'translatey', 'matrix'],

	defaultDuration = 400,

	err = function(msg){
		(typeof window != "undefined") && window.console && console.error && console.error(msg);
	},
	
	//	Capitalise		
	cap = function(str){
		return str.charAt(0).toUpperCase() + str.substr(1);
	},

	//	For checking what vendor prefixes are native
	div = document.createElement('div'),

	//	vendor prefix, ie: transitionDuration becomes MozTransitionDuration
	vp = function (prop) {
		var pf;
		//	Handle unprefixed
		if (prop in div.style) {
			return prop;
		}

		//	Handle keyframes
		if(prop == "@keyframes") {
			for (var i = 0; i < prefixes.length; i += 1) {
				//	Testing using transition
				pf = prefixes[i] + "Transition";
				if (pf in div.style) {
					return "@-" + prefixes[i].toLowerCase() + "-keyframes";
				}
			}
			return prop;
		}

		for (var i = 0; i < prefixes.length; i += 1) {
			pf = prefixes[i] + cap(prop);
			if (pf in div.style) {
				return pf;
			}
		}
		//	Can't find it - return original property.
		return prop;
	},

	//	See if we can use native transitions
	supportsTransitions = function() {
		var b = document.body || document.documentElement,
			s = b.style,
			p = 'transition';

		if (typeof s[p] == 'string') { return true; }

		// Tests for vendor specific prop
		p = p.charAt(0).toUpperCase() + p.substr(1);

		for (var i=0; i<prefixes.length; i++) {
			if (typeof s[prefixes[i] + p] == 'string') { return true; }
		}

		return false;
	},

	//	Converts CSS transition times to MS
	getTimeinMS = function(str) {
		var result = 0, tmp;
		str += "";
		str = str.toLowerCase();
		if(str.indexOf("ms") !== -1) {
			tmp = str.split("ms");
			result = Number(tmp[0]);
		} else if(str.indexOf("s") !== -1) {
			//	s
			tmp = str.split("s");
			result = Number(tmp[0]) * 1000;
		} else {
			result = Number(str);
		}

		return Math.round(result);
	},

	//	Set style properties
	setStyleProps = function(obj, props){
		for(var i in props) {if(props.hasOwnProperty(i)) {
			obj.style[vp(i)] = props[i];
		}}
	},

	//	Set props for transitions and transforms with basic defaults
	setTransitionProps = function(args){
		var props = {
				//	ease, linear, ease-in, ease-out, ease-in-out, cubic-bezier(n,n,n,n) initial, inherit
				TransitionTimingFunction: "ease",
				TransitionDuration: defaultDuration + "ms",
				TransitionProperty: "all"
			},
			p, i, tmp, tmp2, found;

		//	Set any allowed properties 
		for(p in args) { if(args.hasOwnProperty(p)) {
			tmp = 'Transition' + cap(p);
			tmp2 = p.toLowerCase();
			found = false;

			//	Look at transition props
			for(i = 0; i < transitionProps.length; i += 1) {
				if(tmp == transitionProps[i]) {
					props[transitionProps[i]] = args[p];
					found = true;
					break;
				}
			}

			//	Look at transform props
			for(i = 0; i < transformProps.length; i += 1) {
				if(tmp2 == transformProps[i]) {
					props[vp("transform")] = props[vp("transform")] || "";
					props[vp("transform")] += " " +p + "(" + args[p] + ")";
					found = true;
					break;
				}
			}

			if(!found) {
				props[p] = args[p];
			}
		}}
		return props;
	},

	//	Fix animatiuon properties
	//	Normalises transforms, eg: rotate, scale, etc...
	normaliseTransformProps = function(args){
		var props = {},
			tmpProp,
			p, i, found,
			normal = function(props, p, value){
				var tmp = p.toLowerCase(),
					found = false, i;

				//	Look at transform props
				for(i = 0; i < transformProps.length; i += 1) {
					if(tmp == transformProps[i]) {
						props[vp("transform")] = props[vp("transform")] || "";
						props[vp("transform")] += " " +p + "(" + value + ")";
						found = true;
						break;
					}
				}

				if(!found) {
					props[p] = value;
				} else {
					//	Remove transform property
					delete props[p];
				}
			};

		//	Set any allowed properties 
		for(p in args) { if(args.hasOwnProperty(p)) {
			//	If we have a percentage, we have a key frame
			if(p.indexOf("%") !== -1) {
				for(i in args[p]) { if(args[p].hasOwnProperty(i)) {
					normal(args[p], i, args[p][i]);
				}}
				props[p] = args[p];
			} else {
				normal(props, p, args[p]);
			}
		}}

		return props;
	},


	//	If an object is empty
	isEmpty = function(obj) {
		for(var i in obj) {if(obj.hasOwnProperty(i)) {
			return false;
		}}
		return true; 
	},
	//	Creates a hashed name for the animation
	//	Use to create a unique keyframe animation style rule
	aniName = function(props){
		return "ani" + JSON.stringify(props).split(/[{},%":]/).join("");
	},
	animations = {},

	//	See if we can use transitions
	canTrans = supportsTransitions();

	//	IE10+ http://caniuse.com/#search=css-animations
	m.animateProperties = function(el, args, cb){
		el.style = el.style || {};
		var props = setTransitionProps(args), time;

		if(typeof props.TransitionDuration !== 'undefined') {
			props.TransitionDuration = getTimeinMS(props.TransitionDuration) + "ms";
		} else {
			props.TransitionDuration = defaultDuration + "ms";
		}

		time = getTimeinMS(props.TransitionDuration) || 0;

		//	See if we support transitions
		if(canTrans) {
			setStyleProps(el, props);
		} else {
			//	Try and fall back to jQuery
			//	TODO: Switch to use velocity, it is better suited.
			if(typeof $ !== 'undefined' && $.fn && $.fn.animate) {
				$(el).animate(props, time);
			}
		}

		if(cb){
			setTimeout(cb, time+1);
		}
	};

	//	Trigger a transition animation
	m.trigger = function(name, value, options, cb){
		options = options || {};
		var ani = animations[name];
		if(!ani) {
			return err("Animation " + name + " not found.");
		}

		return function(e){
			var args = ani.fn(function(){
				return typeof value == 'function'? value(): value;
			});

			//	Allow override via options
			for(i in options) if(options.hasOwnProperty(i)) {{
				args[i] = options[i];
			}}

			m.animateProperties(e.target, args, cb);
		};
	};

	//	Adds an animation for bindings and so on.
	m.addAnimation = function(name, fn, options){
		options = options || {};

		if(animations[name]) {
			return err("Animation " + name + " already defined.");
		} else if(typeof fn !== "function") {
			return err("Animation " + name + " is being added as a transition based animation, and must use a function.");
		}

		options.duration = options.duration || defaultDuration;

		animations[name] = {
			options: options,
			fn: fn
		};

		//	Add a default binding for the name
		m.addBinding(name, function(prop){
			m.bindAnimation(name, this, fn, prop);
		}, true);
	};

	m.addKFAnimation = function(name, arg, options){
		options = options || {};

		if(animations[name]) {
			return err("Animation " + name + " already defined.");
		}

		var init = function(props) {
			var aniId = aniName(props),
				hasAni = document.getElementById(aniId),
				kf;

			//	Only insert once
			if(!hasAni) {
				animations[name].id = aniId;

				props = normaliseTransformProps(props);
				//  Create keyframes
				kf = vp("@keyframes") + " " + aniId + " " + JSON.stringify(props)
					.split("\"").join("")
					.split("},").join("}\n")
					.split(",").join(";")
					.split("%:").join("% ");

				var s = document.createElement('style');
				s.setAttribute('id', aniId);
				s.id = aniId;
				s.textContent = kf;
				//  Might not have head?
				document.head.appendChild(s);
			}

			animations[name].isInitialised = true;
			animations[name].options.animateImmediately = true;
		};

		options.duration = options.duration || defaultDuration;
		options.animateImmediately = options.animateImmediately || false;

		animations[name] = {
			init: init,
			options: options,
			arg: arg
		};

		//	Add a default binding for the name
		m.addBinding(name, function(prop){
			m.bindAnimation(name, this, arg, prop);
		}, true);
	};


	/*	Options - defaults - what it does:

		Delay - unedefined - delays the animation
		Direction - 
		Duration
		FillMode - "forward" makes sure it sticks: http://www.w3schools.com/cssref/css3_pr_animation-fill-mode.asp
		IterationCount, 
		Name, PlayState, TimingFunction
	
	*/

	//	Useful to know, 'to' and 'from': http://lea.verou.me/2012/12/animations-with-one-keyframe/
	m.animateKF = function(name, el, options, cb){
		options = options || {};
		var ani = animations[name], i, props = {};
		if(!ani) {
			return err("Animation " + name + " not found.");
		}

		//	Allow override via options
		ani.options = ani.options || {};
		for(i in options) if(options.hasOwnProperty(i)) {{
			ani.options[i] = options[i];
		}}

		if(!ani.isInitialised && ani.init) {
			ani.init(ani.arg);
		}

		//	Allow animate overrides
		for(i in ani.options) if(ani.options.hasOwnProperty(i)) {{
			props[vp("animation" + cap(i))] = ani.options[i];
		}}

		//	Set required items and default values for props
		props[vp("animationName")] = ani.id;
		props[vp("animationDuration")] = (props[vp("animationDuration")]? props[vp("animationDuration")]: defaultDuration) + "ms";
		props[vp("animationDelay")] = props[vp("animationDelay")]? props[vp("animationDuration")] + "ms": undefined;
		props[vp("animationFillMode")] = props[vp("animationFillMode")] || "forwards";

		el.style = el.style || {};

		//	Use for callback
		var endAni = function(){
			//	Remove listener
			el.removeEventListener("animationend", endAni, false);
			if(cb){
				cb(el);
			}
		};

		//	Remove animation if any
		el.style[vp("animation")] = "";
		el.style[vp("animationName")] = "";

		//	Must use two request animation frame calls, for FF to
		//	work properly, does not seem to have any adverse effects
		requestAnimationFrame(function(){
			requestAnimationFrame(function(){
				//	Apply props
				for(i in props) if(props.hasOwnProperty(i)) {{
					el.style[i] = props[i];
				}}

				el.addEventListener("animationend", endAni, false);
			});
		});
	};

	m.triggerKF = function(name, options){
		return function(){
			m.animateKF(name, this, options);
		};
	};

	m.bindAnimation = function(name, el, options, prop) {
		var ani = animations[name];

		if(!ani && !ani.name) {
			return err("Animation " + name + " not found.");
		}

		if(ani.fn) {
			m.animateProperties(el, ani.fn(prop));
		} else {
			var oldConfig = el.config;
			el.config = function(el, isInit){
				if(!ani.isInitialised && ani.init) {
					ani.init(options);
				}
				if(prop() && isInit) {
					m.animateKF(name, el, options);
				}
				if(oldConfig) {
					oldConfig.apply(el, arguments);
				}
			};
		}
	};



	/* Default transform2d bindings */
	var basicBindings = ['scale', 'scalex', 'scaley', 'translate', 'translatex', 'translatey', 
		'matrix', 'backgroundColor', 'backgroundPosition', 'borderBottomColor', 
		'borderBottomWidth', 'borderLeftColor', 'borderLeftWidth', 'borderRightColor', 
		'borderRightWidth', 'borderSpacing', 'borderTopColor', 'borderTopWidth', 'bottom', 
		'clip', 'color', 'fontSize', 'fontWeight', 'height', 'left', 'letterSpacing', 
		'lineHeight', 'marginBottom', 'marginLeft', 'marginRight', 'marginTop', 'maxHeight', 
		'maxWidth', 'minHeight', 'minWidth', 'opacity', 'outlineColor', 'outlineWidth', 
		'paddingBottom', 'paddingLeft', 'paddingRight', 'paddingTop', 'right', 'textIndent', 
		'textShadow', 'top', 'verticalAlign', 'visibility', 'width', 'wordSpacing', 'zIndex'],
		degBindings = ['rotate', 'rotatex', 'rotatey', 'skewx', 'skewy'], i;

	//	Basic bindings where we pass the prop straight through
	for(i = 0; i < basicBindings.length; i += 1) {
		(function(name){
			m.addAnimation(name, function(prop){
				var options = {};
				options[name] = prop();
				return options;
			});
		}(basicBindings[i]));
	}

	//	Degree based bindings - conditionally postfix with "deg"
	for(i = 0; i < degBindings.length; i += 1) {
		(function(name){
			m.addAnimation(name, function(prop){
				var options = {}, value = prop();
				options[name] = isNaN(value)? value: value + "deg";
				return options;
			});
		}(degBindings[i]));
	}

	//	Attributes that require more than one prop
	m.addAnimation("skew", function(prop){
		var value = prop();
		return {
			skew: [
				value[0] + (isNaN(value[0])? "":"deg"), 
				value[1] + (isNaN(value[1])? "":"deg")
			]
		};
	});



	//	A few more bindings
	m = m || {};
	//	Hide node
	m.addBinding("hide", function(prop){
		this.style = {
			display: m.unwrap(prop)? "none" : ""
		};
	}, true);

	//	Toggle boolean value on click
	m.addBinding('toggle', function(prop){
		this.onclick = function(){
			var value = prop();
			prop(!value);
		}
	}, true);

	//	Set hover states, a'la jQuery pattern
	m.addBinding('hover', function(prop){
		this.onmouseover = prop[0];
		if(prop[1]) {
			this.onmouseout = prop[1];
		}
	}, true );


};







if (typeof module != "undefined" && module !== null && module.exports) {
	module.exports = mithrilAnimate;
} else if (typeof define === "function" && define.amd) {
	define(function() {
		return mithrilAnimate;
	});
} else {
	mithrilAnimate(typeof window != "undefined"? window.m || {}: {});
}

}());
},{}],8:[function(require,module,exports){
/* NOTE: This is a generated file, please do not modify it, your changes will be lost */
module.exports = function(m){
	var getModelData = function(model){
		var i, result = {};
		for(i in model) {if(model.hasOwnProperty(i)) {
			if(i !== 'isValid') {
				if(i == 'id') {
					result['_id'] = (typeof model[i] == 'function')? model[i](): model[i];
				} else {
					result[i] = (typeof model[i] == 'function')? model[i](): model[i];
				}
			}
		}}
		return result;
	};
	return {
'find': function(args, options){
	args = args || {};
	options = options || {};
	var requestObj = {
			method:'post', 
			url: '/api/authentication/find',
			data: args
		},
		rootNode = document.documentElement || document.body;
	for(var i in options) {if(options.hasOwnProperty(i)){
		requestObj[i] = options[i];
	}}
	if(args.model) {
 		args.model = getModelData(args.model);
	}
	rootNode.className += ' loading';
	var myDeferred = m.deferred();
	m.request(requestObj).then(function(){
		rootNode.className = rootNode.className.split(' loading').join('');
		myDeferred.resolve.apply(this, arguments);
		if(requestObj.background){
			m.redraw(true);
		}
	});
	return myDeferred.promise;
},
'save': function(args, options){
	args = args || {};
	options = options || {};
	var requestObj = {
			method:'post', 
			url: '/api/authentication/save',
			data: args
		},
		rootNode = document.documentElement || document.body;
	for(var i in options) {if(options.hasOwnProperty(i)){
		requestObj[i] = options[i];
	}}
	if(args.model) {
 		args.model = getModelData(args.model);
	}
	rootNode.className += ' loading';
	var myDeferred = m.deferred();
	m.request(requestObj).then(function(){
		rootNode.className = rootNode.className.split(' loading').join('');
		myDeferred.resolve.apply(this, arguments);
		if(requestObj.background){
			m.redraw(true);
		}
	});
	return myDeferred.promise;
},
'remove': function(args, options){
	args = args || {};
	options = options || {};
	var requestObj = {
			method:'post', 
			url: '/api/authentication/remove',
			data: args
		},
		rootNode = document.documentElement || document.body;
	for(var i in options) {if(options.hasOwnProperty(i)){
		requestObj[i] = options[i];
	}}
	if(args.model) {
 		args.model = getModelData(args.model);
	}
	rootNode.className += ' loading';
	var myDeferred = m.deferred();
	m.request(requestObj).then(function(){
		rootNode.className = rootNode.className.split(' loading').join('');
		myDeferred.resolve.apply(this, arguments);
		if(requestObj.background){
			m.redraw(true);
		}
	});
	return myDeferred.promise;
},
'authenticate': function(args, options){
	args = args || {};
	options = options || {};
	var requestObj = {
			method:'post', 
			url: '/api/authentication/authenticate',
			data: args
		},
		rootNode = document.documentElement || document.body;
	for(var i in options) {if(options.hasOwnProperty(i)){
		requestObj[i] = options[i];
	}}
	if(args.model) {
 		args.model = getModelData(args.model);
	}
	rootNode.className += ' loading';
	var myDeferred = m.deferred();
	m.request(requestObj).then(function(){
		rootNode.className = rootNode.className.split(' loading').join('');
		myDeferred.resolve.apply(this, arguments);
		if(requestObj.background){
			m.redraw(true);
		}
	});
	return myDeferred.promise;
},
'login': function(args, options){
	args = args || {};
	options = options || {};
	var requestObj = {
			method:'post', 
			url: '/api/authentication/login',
			data: args
		},
		rootNode = document.documentElement || document.body;
	for(var i in options) {if(options.hasOwnProperty(i)){
		requestObj[i] = options[i];
	}}
	if(args.model) {
 		args.model = getModelData(args.model);
	}
	rootNode.className += ' loading';
	var myDeferred = m.deferred();
	m.request(requestObj).then(function(){
		rootNode.className = rootNode.className.split(' loading').join('');
		myDeferred.resolve.apply(this, arguments);
		if(requestObj.background){
			m.redraw(true);
		}
	});
	return myDeferred.promise;
},
'logout': function(args, options){
	args = args || {};
	options = options || {};
	var requestObj = {
			method:'post', 
			url: '/api/authentication/logout',
			data: args
		},
		rootNode = document.documentElement || document.body;
	for(var i in options) {if(options.hasOwnProperty(i)){
		requestObj[i] = options[i];
	}}
	if(args.model) {
 		args.model = getModelData(args.model);
	}
	rootNode.className += ' loading';
	var myDeferred = m.deferred();
	m.request(requestObj).then(function(){
		rootNode.className = rootNode.className.split(' loading').join('');
		myDeferred.resolve.apply(this, arguments);
		if(requestObj.background){
			m.redraw(true);
		}
	});
	return myDeferred.promise;
},
'findUsers': function(args, options){
	args = args || {};
	options = options || {};
	var requestObj = {
			method:'post', 
			url: '/api/authentication/findUsers',
			data: args
		},
		rootNode = document.documentElement || document.body;
	for(var i in options) {if(options.hasOwnProperty(i)){
		requestObj[i] = options[i];
	}}
	if(args.model) {
 		args.model = getModelData(args.model);
	}
	rootNode.className += ' loading';
	var myDeferred = m.deferred();
	m.request(requestObj).then(function(){
		rootNode.className = rootNode.className.split(' loading').join('');
		myDeferred.resolve.apply(this, arguments);
		if(requestObj.background){
			m.redraw(true);
		}
	});
	return myDeferred.promise;
},
'saveUser': function(args, options){
	args = args || {};
	options = options || {};
	var requestObj = {
			method:'post', 
			url: '/api/authentication/saveUser',
			data: args
		},
		rootNode = document.documentElement || document.body;
	for(var i in options) {if(options.hasOwnProperty(i)){
		requestObj[i] = options[i];
	}}
	if(args.model) {
 		args.model = getModelData(args.model);
	}
	rootNode.className += ' loading';
	var myDeferred = m.deferred();
	m.request(requestObj).then(function(){
		rootNode.className = rootNode.className.split(' loading').join('');
		myDeferred.resolve.apply(this, arguments);
		if(requestObj.background){
			m.redraw(true);
		}
	});
	return myDeferred.promise;
}
	};
};
},{}],9:[function(require,module,exports){
/* NOTE: This is a generated file, please do not modify it, your changes will be lost */var m = require('mithril');var sugartags = require('mithril.sugartags')(m);var bindings = require('mithril.bindings')(m);var animate = require('../public/js/mithril.animate.js')(m);var permissions = require('../system/miso.permissions.js');var layout = require('../mvc/layout_plain.js');var restrict = function(route, actionName){	return route;};var permissionObj = {};var home = require('../mvc/home.js');if(typeof window !== 'undefined') {	window.m = m;}	m.route.mode = 'pathname';m.route(document.getElementById('misoAttachmentNode'), '/', {'/': restrict(home.index, 'home.index')});misoGlobal.renderHeader = function(obj){	var headerNode = document.getElementById('misoHeaderNode');	if(headerNode){		m.render(document.getElementById('misoHeaderNode'), layout.headerContent? layout.headerContent({misoGlobal: obj || misoGlobal}): '');	}};misoGlobal.renderHeader();
},{"../mvc/home.js":2,"../mvc/layout_plain.js":3,"../public/js/mithril.animate.js":7,"../system/miso.permissions.js":10,"mithril":6,"mithril.bindings":4,"mithril.sugartags":5}],10:[function(require,module,exports){
/*	miso permissions
	Permit users access to controller actions based on roles 
*/
var miso = require("../modules/miso.util.client.js"),
	hasRole = function(userRoles, roles){
		var hasRole = false;
		//	All roles
		if(userRoles == "*") {
			return true;
		}
		//	Search each user role
		miso.each(userRoles, function(userRole){
			userRole = (typeof userRole !== "string")? userRole: [userRole];
			//	Search each role
			miso.each(roles, function(role){
				if(userRole == role) {
					hasRole = true;
					return false;
				}
			});
		});
		return hasRole;
	};

//	Determine if the user has access to an APP action
//	TODO: 
module.exports.app = function(permissions, actionName, userRoles){
	//	TODO: Probably need to use pass=false by default, but first:
	//
	//	* Add global config for pass default in server.json
	//	* 
	//
	var pass = true;

	//	Apply deny first, then allow.
	if(permissions && userRoles){
		if(permissions.deny) {
			pass = ! hasRole(user.roles, permissions.deny);
		}
		if(permissions.allow) {
			pass = hasRole(user.roles, permissions.allow);
		}
	}

	return pass;
};


//	Determine if the user has access to an API action
//	TODO: 
module.exports.api = function(permissions, actionName, userRoles){
	//	TODO: Probably need to use pass=false by default, but first:
	//
	//	* Add global config for pass default in server.json
	//	* 
	//
	var pass = true;

	//	Apply deny first, then allow.
	if(permissions && userRoles){
		if(permissions.deny) {
			pass = ! hasRole(user.roles, permissions.deny);
		}
		if(permissions.allow) {
			pass = hasRole(user.roles, permissions.allow);
		}
	}

	return pass;
};
},{"../modules/miso.util.client.js":1}]},{},[9])
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJtb2R1bGVzL21pc28udXRpbC5jbGllbnQuanMiLCJtdmMvaG9tZS5qcyIsIm12Yy9sYXlvdXRfcGxhaW4uanMiLCJub2RlX21vZHVsZXMvbWl0aHJpbC5iaW5kaW5ncy9kaXN0L21pdGhyaWwuYmluZGluZ3MuanMiLCJub2RlX21vZHVsZXMvbWl0aHJpbC5zdWdhcnRhZ3MvbWl0aHJpbC5zdWdhcnRhZ3MuanMiLCJub2RlX21vZHVsZXMvbWl0aHJpbC9taXRocmlsLmpzIiwicHVibGljL2pzL21pdGhyaWwuYW5pbWF0ZS5qcyIsInN5c3RlbS9hcGkvYXV0aGVudGljYXRpb24vYXBpLmNsaWVudC5qcyIsInN5c3RlbS9tYWluLmpzIiwic3lzdGVtL21pc28ucGVybWlzc2lvbnMuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3RFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMzQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzFCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN4TkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzdFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3ZvQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDMWdCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNqT0E7O0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwiLy9cdFZhcmlvdXMgdXRpbGl0aWVzIHRoYXQgbm9ybWFsaXNlIHVzYWdlIGJldHdlZW4gY2xpZW50IGFuZCBzZXJ2ZXJcbi8vXHRUaGlzIGlzIHRoZSBjbGllbnQgdmVyc2lvbiAtIHNlZSBtaXNvLnV0aWwuanMgZm9yIHNlcnZlciB2ZXJzaW9uXG52YXIgbSA9IHJlcXVpcmUoJ21pdGhyaWwnKTtcblxubW9kdWxlLmV4cG9ydHMgPSB7XG5cdC8vXHRBcmUgd2Ugb24gdGhlIHNlcnZlcj9cblx0aXNTZXJ2ZXI6IGZ1bmN0aW9uKCkge1xuXHRcdHJldHVybiBmYWxzZTtcblx0fSxcblx0XG5cdC8vXHRFYWNoIGFic3RyYWN0aW9uXG5cdC8vXHRcblx0Ly9cdG1pc28uZWFjaChbJ2hlbGxvJywgJ3dvcmxkJ10sIGZ1bmN0aW9uKHZhbHVlLCBrZXkpe1xuXHQvL1x0XHRjb25zb2xlLmxvZyh2YWx1ZSwga2V5KTtcblx0Ly9cdH0pO1xuXHQvL1x0Ly9cdGhlbGxvIDBcXG5oZWxsbyAxXG5cdC8vXG5cdC8vIFx0bWlzby5lYWNoKHsnaGVsbG8nOiAnd29ybGQnfSwgZnVuY3Rpb24odmFsdWUsIGtleSl7XG5cdC8vXHRcdGNvbnNvbGUubG9nKHZhbHVlLCBrZXkpO1xuXHQvL1x0fSk7XG5cdC8vXHQvL1x0d29ybGQgaGVsbG9cblx0Ly9cblx0ZWFjaDogZnVuY3Rpb24ob2JqLCBmbikge1xuXHRcdGlmKE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmcuY2FsbChvYmopID09PSAnW29iamVjdCBBcnJheV0nICkge1xuXHRcdFx0cmV0dXJuIG9iai5tYXAoZm4pO1xuXHRcdH0gZWxzZSBpZih0eXBlb2Ygb2JqID09ICdvYmplY3QnKSB7XG5cdFx0XHRyZXR1cm4gT2JqZWN0LmtleXMob2JqKS5tYXAoZnVuY3Rpb24oa2V5KXtcblx0XHRcdFx0cmV0dXJuIGZuKG9ialtrZXldLCBrZXkpO1xuXHRcdFx0fSk7XG5cdFx0fSBlbHNlIHtcblx0XHRcdHJldHVybiBmbihvYmopO1xuXHRcdH1cblx0fSxcblxuXHRyZWFkeUJpbmRlcjogZnVuY3Rpb24oKXtcblx0XHR2YXIgYmluZGluZ3MgPSBbXTtcblx0XHRyZXR1cm4ge1xuXHRcdFx0YmluZDogZnVuY3Rpb24oY2IpIHtcblx0XHRcdFx0YmluZGluZ3MucHVzaChjYik7XG5cdFx0XHR9LFxuXHRcdFx0cmVhZHk6IGZ1bmN0aW9uKCl7XG5cdFx0XHRcdGZvcih2YXIgaSA9IDA7IGkgPCBiaW5kaW5ncy5sZW5ndGg7IGkgKz0gMSkge1xuXHRcdFx0XHRcdGJpbmRpbmdzW2ldKCk7XG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHR9O1xuXHR9LFxuXG5cdC8vXHRHZXQgcGFyYW1ldGVycyBmb3IgYW4gYWN0aW9uXG5cdGdldFBhcmFtOiBmdW5jdGlvbihrZXksIHBhcmFtcywgZGVmKXtcblx0XHRyZXR1cm4gdHlwZW9mIG0ucm91dGUucGFyYW0oa2V5KSAhPT0gXCJ1bmRlZmluZWRcIj8gbS5yb3V0ZS5wYXJhbShrZXkpOiBkZWY7XG5cdH0sXG5cblx0Ly9cdEdldCBpbmZvIGZvciBhbiBhY3Rpb24gZnJvbSB0aGUgcGFyYW1zXG5cdHJvdXRlSW5mbzogZnVuY3Rpb24ocGFyYW1zKXtcblx0XHQvKlxuXG5cdFx0XHRwYXRoOiByZXEucGF0aCxcblx0XHRcdHBhcmFtczogcmVxLnBhcmFtcywgXG5cdFx0XHRxdWVyeTogcmVxLnF1ZXJ5LCBcblx0XHRcdHNlc3Npb246IHNlc3Npb25cblxuXHRcdCovXG5cdFx0cmV0dXJuIHtcblx0XHRcdHBhdGg6IG0ucm91dGUoKSxcblx0XHRcdHBhcmFtczogcmVxLnBhcmFtcywgXG5cdFx0XHRxdWVyeTogcmVxLnF1ZXJ5LCBcblx0XHRcdHNlc3Npb246IHNlc3Npb25cblx0XHR9XG5cdH1cbn07IiwidmFyIG0gPSByZXF1aXJlKCdtaXRocmlsJyksXG5cdHN1Z2FydGFncyA9IHJlcXVpcmUoJ21pdGhyaWwuc3VnYXJ0YWdzJykobSk7XG5cbnZhciBzZWxmID0gbW9kdWxlLmV4cG9ydHMuaW5kZXggPSB7XG5cdG1vZGVsczoge1xuICAgICAgICB0b2RvOiBmdW5jdGlvbihkYXRhKXtcbiAgICAgICAgICAgIHRoaXMudGV4dCA9IGRhdGEudGV4dDtcbiAgICAgICAgICAgIHRoaXMuZG9uZSA9IG0ucHJvcChkYXRhLmRvbmUgPT0gXCJmYWxzZVwiPyBmYWxzZTogZGF0YS5kb25lKTtcbiAgICAgICAgfVxuICAgIH0sXG5cdGNvbnRyb2xsZXI6IGZ1bmN0aW9uKCkge1xuXHQgICAgdmFyIG15VG9kb3MgPSBbe3RleHQ6IFwiTGVhcm4gbWlzb1wifSwge3RleHQ6IFwiQnVpbGQgbWlzbyBhcHBcIn1dO1xuXHQgICAgdGhpcy5saXN0ID0gT2JqZWN0LmtleXMobXlUb2RvcykubWFwKGZ1bmN0aW9uKGtleSkge1xuXHQgICAgICAgIHJldHVybiBuZXcgc2VsZi5tb2RlbHMudG9kbyhteVRvZG9zW2tleV0pO1xuXHQgICAgfSk7XG5cdCAgICByZXR1cm4gdGhpcztcblx0fSxcblx0dmlldzogZnVuY3Rpb24oY3RybCkge1xuXHQgICAgcmV0dXJuIG0oXCJkaXYuY3dcIiwgW1xuXHQgICAgICAgIG0oXCJIMVwiLCBcIlRvZG9zXCIpLFxuXHQgICAgICAgIG0oXCJVTFwiLCBbXG5cdCAgICAgICAgICAgIGN0cmwubGlzdC5tYXAoZnVuY3Rpb24odG9kbyl7XG5cdCAgICAgICAgICAgICAgICByZXR1cm4gbShcIkxJXCIsIHRvZG8udGV4dClcblx0ICAgICAgICAgICAgfSlcblx0ICAgICAgICBdKVxuXHQgICAgXSk7XG5cdH1cbn07IiwiLypcdE1pc28gY3VzdG9tIGxheW91dCBwYWdlXG5cdEV4YW1wbGUgY3VzdG9tIGxheW91dCBwYWdlIC0gaXQgcmVtb3ZlcyBtb3N0IGNvbXBvbmVudHNcbiovXG52YXIgbSA9IHJlcXVpcmUoJ21pdGhyaWwnKSxcblx0c3VnYXJ0YWdzID0gcmVxdWlyZSgnbWl0aHJpbC5zdWdhcnRhZ3MnKShtKSxcblx0YXV0aGVudGljYXRpb24gPSByZXF1aXJlKFwiLi4vc3lzdGVtL2FwaS9hdXRoZW50aWNhdGlvbi9hcGkuY2xpZW50LmpzXCIpKG0pO1xuXG4vL1x0VGhlIGZ1bGwgbGF5b3V0IC0gYWx3YXlzIG9ubHkgcmVuZGVyZWQgc2VydmVyIHNpZGVcbm1vZHVsZS5leHBvcnRzLnZpZXcgPSBmdW5jdGlvbihjdHJsKXtcblx0d2l0aChzdWdhcnRhZ3MpIHtcblx0XHRyZXR1cm4gW1xuXHRcdFx0bS50cnVzdChcIjwhZG9jdHlwZSBodG1sPlwiKSxcblx0XHRcdEhUTUwoW1xuXHRcdFx0XHRIRUFEKFtcblx0XHRcdFx0XHRMSU5LKHtocmVmOiAnL2Nzcy9zdHlsZS5jc3MnLCByZWw6J3N0eWxlc2hlZXQnfSksXG5cdFx0XHRcdFx0Ly9cdEFkZCBpbiB0aGUgbWlzb0dsb2JhbCBvYmplY3QuLi5cblx0XHRcdFx0XHRTQ1JJUFQoXCJ2YXIgbWlzb0dsb2JhbCA9IFwiKyhjdHJsLm1pc29HbG9iYWw/IEpTT04uc3RyaW5naWZ5KGN0cmwubWlzb0dsb2JhbCk6IHt9KStcIjtcIilcblx0XHRcdFx0XSksXG5cdFx0XHRcdEJPRFkoW1xuXHRcdFx0XHRcdFNFQ1RJT04oe2lkOiBjdHJsLm1pc29BdHRhY2htZW50Tm9kZX0sIGN0cmwuY29udGVudCksXG5cdFx0XHRcdFx0U0NSSVBUKHtzcmM6ICcvbWlzby5qcyd9KSxcblx0XHRcdFx0XHQoY3RybC5yZWxvYWQ/IFNDUklQVCh7c3JjOiAnL3JlbG9hZC5qcyd9KTogXCJcIilcblx0XHRcdFx0XSlcblx0XHRcdF0pXG5cdFx0XTtcblx0fVxufTsiLCIvL1x0TWl0aHJpbCBiaW5kaW5ncy5cbi8vXHRDb3B5cmlnaHQgKEMpIDIwMTQganNndXkgKE1pa2tlbCBCZXJnbWFubilcbi8vXHRNSVQgbGljZW5zZWRcbihmdW5jdGlvbigpe1xudmFyIG1pdGhyaWxCaW5kaW5ncyA9IGZ1bmN0aW9uKG0pe1xuXHRtLmJpbmRpbmdzID0gbS5iaW5kaW5ncyB8fCB7fTtcblxuXHQvL1x0UHViL1N1YiBiYXNlZCBleHRlbmRlZCBwcm9wZXJ0aWVzXG5cdG0ucCA9IGZ1bmN0aW9uKHZhbHVlKSB7XG5cdFx0dmFyIHNlbGYgPSB0aGlzLFxuXHRcdFx0c3VicyA9IFtdLFxuXHRcdFx0cHJldlZhbHVlLFxuXHRcdFx0ZGVsYXkgPSBmYWxzZSxcblx0XHRcdC8vICBTZW5kIG5vdGlmaWNhdGlvbnMgdG8gc3Vic2NyaWJlcnNcblx0XHRcdG5vdGlmeSA9IGZ1bmN0aW9uICh2YWx1ZSwgcHJldlZhbHVlKSB7XG5cdFx0XHRcdHZhciBpO1xuXHRcdFx0XHRmb3IgKGkgPSAwOyBpIDwgc3Vicy5sZW5ndGg7IGkgKz0gMSkge1xuXHRcdFx0XHRcdHN1YnNbaV0uZnVuYy5hcHBseShzdWJzW2ldLmNvbnRleHQsIFt2YWx1ZSwgcHJldlZhbHVlXSk7XG5cdFx0XHRcdH1cblx0XHRcdH0sXG5cdFx0XHRwcm9wID0gZnVuY3Rpb24oKSB7XG5cdFx0XHRcdGlmIChhcmd1bWVudHMubGVuZ3RoKSB7XG5cdFx0XHRcdFx0dmFsdWUgPSBhcmd1bWVudHNbMF07XG5cdFx0XHRcdFx0aWYgKHByZXZWYWx1ZSAhPT0gdmFsdWUpIHtcblx0XHRcdFx0XHRcdHZhciB0bXBQcmV2ID0gcHJldlZhbHVlO1xuXHRcdFx0XHRcdFx0cHJldlZhbHVlID0gdmFsdWU7XG5cdFx0XHRcdFx0XHRub3RpZnkodmFsdWUsIHRtcFByZXYpO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0fVxuXHRcdFx0XHRyZXR1cm4gdmFsdWU7XG5cdFx0XHR9O1xuXG5cdFx0Ly9cdEFsbG93IHB1c2ggb24gYXJyYXlzXG5cdFx0cHJvcC5wdXNoID0gZnVuY3Rpb24odmFsKSB7XG5cdFx0XHRpZih2YWx1ZS5wdXNoICYmIHR5cGVvZiB2YWx1ZS5sZW5ndGggIT09IFwidW5kZWZpbmVkXCIpIHtcblx0XHRcdFx0dmFsdWUucHVzaCh2YWwpO1xuXHRcdFx0fVxuXHRcdFx0cHJvcCh2YWx1ZSk7XG5cdFx0fTtcblxuXHRcdC8vXHRTdWJzY3JpYmUgZm9yIHdoZW4gdGhlIHZhbHVlIGNoYW5nZXNcblx0XHRwcm9wLnN1YnNjcmliZSA9IGZ1bmN0aW9uIChmdW5jLCBjb250ZXh0KSB7XG5cdFx0XHRzdWJzLnB1c2goeyBmdW5jOiBmdW5jLCBjb250ZXh0OiBjb250ZXh0IHx8IHNlbGYgfSk7XG5cdFx0XHRyZXR1cm4gcHJvcDtcblx0XHR9O1xuXG5cdFx0Ly9cdEFsbG93IHByb3BlcnR5IHRvIG5vdCBhdXRvbWF0aWNhbGx5IHJlbmRlclxuXHRcdHByb3AuZGVsYXkgPSBmdW5jdGlvbih2YWx1ZSkge1xuXHRcdFx0ZGVsYXkgPSAhIXZhbHVlO1xuXHRcdFx0cmV0dXJuIHByb3A7XG5cdFx0fTtcblxuXHRcdC8vXHRBdXRvbWF0aWNhbGx5IHVwZGF0ZSByZW5kZXJpbmcgd2hlbiBhIHZhbHVlIGNoYW5nZXNcblx0XHQvL1x0QXMgbWl0aHJpbCB3YWl0cyBmb3IgYSByZXF1ZXN0IGFuaW1hdGlvbiBmcmFtZSwgdGhpcyBzaG91bGQgYmUgb2suXG5cdFx0Ly9cdFlvdSBjYW4gdXNlIC5kZWxheSh0cnVlKSB0byBiZSBhYmxlIHRvIG1hbnVhbGx5IGhhbmRsZSB1cGRhdGVzXG5cdFx0cHJvcC5zdWJzY3JpYmUoZnVuY3Rpb24odmFsKXtcblx0XHRcdGlmKCFkZWxheSkge1xuXHRcdFx0XHRtLnN0YXJ0Q29tcHV0YXRpb24oKTtcblx0XHRcdFx0bS5lbmRDb21wdXRhdGlvbigpO1xuXHRcdFx0fVxuXHRcdFx0cmV0dXJuIHByb3A7XG5cdFx0fSk7XG5cblx0XHRyZXR1cm4gcHJvcDtcblx0fTtcblxuXHQvL1x0RWxlbWVudCBmdW5jdGlvbiB0aGF0IGFwcGxpZXMgb3VyIGV4dGVuZGVkIGJpbmRpbmdzXG5cdC8vXHROb3RlOiBcblx0Ly9cdFx0LiBTb21lIGF0dHJpYnV0ZXMgY2FuIGJlIHJlbW92ZWQgd2hlbiBhcHBsaWVkLCBlZzogY3VzdG9tIGF0dHJpYnV0ZXNcblx0Ly9cdFxuXHRtLmUgPSBmdW5jdGlvbihlbGVtZW50LCBhdHRycywgY2hpbGRyZW4pIHtcblx0XHRmb3IgKHZhciBuYW1lIGluIGF0dHJzKSB7XG5cdFx0XHRpZiAobS5iaW5kaW5nc1tuYW1lXSkge1xuXHRcdFx0XHRtLmJpbmRpbmdzW25hbWVdLmZ1bmMuYXBwbHkoYXR0cnMsIFthdHRyc1tuYW1lXV0pO1xuXHRcdFx0XHRpZihtLmJpbmRpbmdzW25hbWVdLnJlbW92ZWFibGUpIHtcblx0XHRcdFx0XHRkZWxldGUgYXR0cnNbbmFtZV07XG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHR9XG5cdFx0cmV0dXJuIG0oZWxlbWVudCwgYXR0cnMsIGNoaWxkcmVuKTtcblx0fTtcblxuXHQvL1x0QWRkIGJpbmRpbmdzIG1ldGhvZFxuXHQvL1x0Tm9uLXN0YW5kYXJkIGF0dHJpYnV0ZXMgZG8gbm90IG5lZWQgdG8gYmUgcmVuZGVyZWQsIGVnOiB2YWx1ZUlucHV0XG5cdC8vXHRzbyB0aGV5IGFyZSBzZXQgYXMgcmVtb3ZhYmxlXG5cdG0uYWRkQmluZGluZyA9IGZ1bmN0aW9uKG5hbWUsIGZ1bmMsIHJlbW92ZWFibGUpe1xuXHRcdG0uYmluZGluZ3NbbmFtZV0gPSB7XG5cdFx0XHRmdW5jOiBmdW5jLFxuXHRcdFx0cmVtb3ZlYWJsZTogcmVtb3ZlYWJsZVxuXHRcdH07XG5cdH07XG5cblx0Ly9cdEdldCB0aGUgdW5kZXJseWluZyB2YWx1ZSBvZiBhIHByb3BlcnR5XG5cdG0udW53cmFwID0gZnVuY3Rpb24ocHJvcCkge1xuXHRcdHJldHVybiAodHlwZW9mIHByb3AgPT0gXCJmdW5jdGlvblwiKT8gcHJvcCgpOiBwcm9wO1xuXHR9O1xuXG5cdC8vXHRCaS1kaXJlY3Rpb25hbCBiaW5kaW5nIG9mIHZhbHVlXG5cdG0uYWRkQmluZGluZyhcInZhbHVlXCIsIGZ1bmN0aW9uKHByb3ApIHtcblx0XHRpZiAodHlwZW9mIHByb3AgPT0gXCJmdW5jdGlvblwiKSB7XG5cdFx0XHR0aGlzLnZhbHVlID0gcHJvcCgpO1xuXHRcdFx0dGhpcy5vbmNoYW5nZSA9IG0ud2l0aEF0dHIoXCJ2YWx1ZVwiLCBwcm9wKTtcblx0XHR9IGVsc2Uge1xuXHRcdFx0dGhpcy52YWx1ZSA9IHByb3A7XG5cdFx0fVxuXHR9KTtcblxuXHQvL1x0QmktZGlyZWN0aW9uYWwgYmluZGluZyBvZiBjaGVja2VkIHByb3BlcnR5XG5cdG0uYWRkQmluZGluZyhcImNoZWNrZWRcIiwgZnVuY3Rpb24ocHJvcCkge1xuXHRcdGlmICh0eXBlb2YgcHJvcCA9PSBcImZ1bmN0aW9uXCIpIHtcblx0XHRcdHRoaXMuY2hlY2tlZCA9IHByb3AoKTtcblx0XHRcdHRoaXMub25jaGFuZ2UgPSBtLndpdGhBdHRyKFwiY2hlY2tlZFwiLCBwcm9wKTtcblx0XHR9IGVsc2Uge1xuXHRcdFx0dGhpcy5jaGVja2VkID0gcHJvcDtcblx0XHR9XG5cdH0pO1xuXG5cdC8vXHRIaWRlIG5vZGVcblx0bS5hZGRCaW5kaW5nKFwiaGlkZVwiLCBmdW5jdGlvbihwcm9wKXtcblx0XHR0aGlzLnN0eWxlID0ge1xuXHRcdFx0ZGlzcGxheTogbS51bndyYXAocHJvcCk/IFwibm9uZVwiIDogXCJcIlxuXHRcdH07XG5cdH0sIHRydWUpO1xuXG5cdC8vXHRUb2dnbGUgdmFsdWUocykgb24gY2xpY2tcblx0bS5hZGRCaW5kaW5nKCd0b2dnbGUnLCBmdW5jdGlvbihwcm9wKXtcblx0XHR0aGlzLm9uY2xpY2sgPSBmdW5jdGlvbigpe1xuXHRcdFx0Ly9cdFRvZ2dsZSBhbGxvd3MgYW4gZW51bSBsaXN0IHRvIGJlIHRvZ2dsZWQsIGVnOiBbcHJvcCwgdmFsdWUyLCB2YWx1ZTJdXG5cdFx0XHR2YXIgaXNGdW5jID0gdHlwZW9mIHByb3AgPT09ICdmdW5jdGlvbicsIHRtcCwgaSwgdmFscyA9IFtdLCB2YWwsIHRWYWw7XG5cblx0XHRcdC8vXHRUb2dnbGUgYm9vbGVhblxuXHRcdFx0aWYoaXNGdW5jKSB7XG5cdFx0XHRcdHZhbHVlID0gcHJvcCgpO1xuXHRcdFx0XHRwcm9wKCF2YWx1ZSk7XG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHQvL1x0VG9nZ2xlIGVudW1lcmF0aW9uXG5cdFx0XHRcdHRtcCA9IHByb3BbMF07XG5cdFx0XHRcdHZhbCA9IHRtcCgpO1xuXHRcdFx0XHR2YWxzID0gcHJvcC5zbGljZSgxKTtcblx0XHRcdFx0dFZhbCA9IHZhbHNbMF07XG5cblx0XHRcdFx0Zm9yKGkgPSAwOyBpIDwgdmFscy5sZW5ndGg7IGkgKz0gMSkge1xuXHRcdFx0XHRcdGlmKHZhbCA9PSB2YWxzW2ldKSB7XG5cdFx0XHRcdFx0XHRpZih0eXBlb2YgdmFsc1tpKzFdICE9PSAndW5kZWZpbmVkJykge1xuXHRcdFx0XHRcdFx0XHR0VmFsID0gdmFsc1tpKzFdO1xuXHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdFx0YnJlYWs7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9XG5cdFx0XHRcdHRtcCh0VmFsKTtcblx0XHRcdH1cblx0XHR9O1xuXHR9LCB0cnVlKTtcblxuXHQvL1x0U2V0IGhvdmVyIHN0YXRlcywgYSdsYSBqUXVlcnkgcGF0dGVyblxuXHRtLmFkZEJpbmRpbmcoJ2hvdmVyJywgZnVuY3Rpb24ocHJvcCl7XG5cdFx0dGhpcy5vbm1vdXNlb3ZlciA9IHByb3BbMF07XG5cdFx0aWYocHJvcFsxXSkge1xuXHRcdFx0dGhpcy5vbm1vdXNlb3V0ID0gcHJvcFsxXTtcblx0XHR9XG5cdH0sIHRydWUgKTtcblxuXHQvL1x0QWRkIHZhbHVlIGJpbmRpbmdzIGZvciB2YXJpb3VzIGV2ZW50IHR5cGVzIFxuXHR2YXIgZXZlbnRzID0gW1wiSW5wdXRcIiwgXCJLZXl1cFwiLCBcIktleXByZXNzXCJdLFxuXHRcdGNyZWF0ZUJpbmRpbmcgPSBmdW5jdGlvbihuYW1lLCBldmUpe1xuXHRcdFx0Ly9cdEJpLWRpcmVjdGlvbmFsIGJpbmRpbmcgb2YgdmFsdWVcblx0XHRcdG0uYWRkQmluZGluZyhuYW1lLCBmdW5jdGlvbihwcm9wKSB7XG5cdFx0XHRcdGlmICh0eXBlb2YgcHJvcCA9PSBcImZ1bmN0aW9uXCIpIHtcblx0XHRcdFx0XHR0aGlzLnZhbHVlID0gcHJvcCgpO1xuXHRcdFx0XHRcdHRoaXNbZXZlXSA9IG0ud2l0aEF0dHIoXCJ2YWx1ZVwiLCBwcm9wKTtcblx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHR0aGlzLnZhbHVlID0gcHJvcDtcblx0XHRcdFx0fVxuXHRcdFx0fSwgdHJ1ZSk7XG5cdFx0fTtcblxuXHRmb3IodmFyIGkgPSAwOyBpIDwgZXZlbnRzLmxlbmd0aDsgaSArPSAxKSB7XG5cdFx0dmFyIGV2ZSA9IGV2ZW50c1tpXTtcblx0XHRjcmVhdGVCaW5kaW5nKFwidmFsdWVcIiArIGV2ZSwgXCJvblwiICsgZXZlLnRvTG93ZXJDYXNlKCkpO1xuXHR9XG5cblxuXHQvL1x0U2V0IGEgdmFsdWUgb24gYSBwcm9wZXJ0eVxuXHRtLnNldCA9IGZ1bmN0aW9uKHByb3AsIHZhbHVlKXtcblx0XHRyZXR1cm4gZnVuY3Rpb24oKSB7XG5cdFx0XHRwcm9wKHZhbHVlKTtcblx0XHR9O1xuXHR9O1xuXG5cdC8qXHRSZXR1cm5zIGEgZnVuY3Rpb24gdGhhdCBjYW4gdHJpZ2dlciBhIGJpbmRpbmcgXG5cdFx0VXNhZ2U6IG9uY2xpY2s6IG0udHJpZ2dlcignYmluZGluZycsIHByb3ApXG5cdCovXG5cdG0udHJpZ2dlciA9IGZ1bmN0aW9uKCl7XG5cdFx0dmFyIGFyZ3MgPSBBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbChhcmd1bWVudHMpO1xuXHRcdHJldHVybiBmdW5jdGlvbigpe1xuXHRcdFx0dmFyIG5hbWUgPSBhcmdzWzBdLFxuXHRcdFx0XHRhcmdMaXN0ID0gYXJncy5zbGljZSgxKTtcblx0XHRcdGlmIChtLmJpbmRpbmdzW25hbWVdKSB7XG5cdFx0XHRcdG0uYmluZGluZ3NbbmFtZV0uZnVuYy5hcHBseSh0aGlzLCBhcmdMaXN0KTtcblx0XHRcdH1cblx0XHR9O1xuXHR9O1xuXG5cdHJldHVybiBtLmJpbmRpbmdzO1xufTtcblxuaWYgKHR5cGVvZiBtb2R1bGUgIT0gXCJ1bmRlZmluZWRcIiAmJiBtb2R1bGUgIT09IG51bGwgJiYgbW9kdWxlLmV4cG9ydHMpIHtcblx0bW9kdWxlLmV4cG9ydHMgPSBtaXRocmlsQmluZGluZ3M7XG59IGVsc2UgaWYgKHR5cGVvZiBkZWZpbmUgPT09IFwiZnVuY3Rpb25cIiAmJiBkZWZpbmUuYW1kKSB7XG5cdGRlZmluZShmdW5jdGlvbigpIHtcblx0XHRyZXR1cm4gbWl0aHJpbEJpbmRpbmdzO1xuXHR9KTtcbn0gZWxzZSB7XG5cdG1pdGhyaWxCaW5kaW5ncyh0eXBlb2Ygd2luZG93ICE9IFwidW5kZWZpbmVkXCI/IHdpbmRvdy5tIHx8IHt9OiB7fSk7XG59XG5cbn0oKSk7IiwiLy9cdE1pdGhyaWwgc3VnYXIgdGFncy5cbi8vXHRDb3B5cmlnaHQgKEMpIDIwMTUganNndXkgKE1pa2tlbCBCZXJnbWFubilcbi8vXHRNSVQgbGljZW5zZWRcbihmdW5jdGlvbigpe1xudmFyIG1pdGhyaWxTdWdhcnRhZ3MgPSBmdW5jdGlvbihtLCBzY29wZSl7XG5cdG0uc3VnYXJUYWdzID0gbS5zdWdhclRhZ3MgfHwge307XG5cdHNjb3BlID0gc2NvcGUgfHwgbTtcblxuXHR2YXIgYXJnID0gZnVuY3Rpb24obDEsIGwyKXtcblx0XHRcdHZhciBpO1xuXHRcdFx0Zm9yIChpIGluIGwyKSB7aWYobDIuaGFzT3duUHJvcGVydHkoaSkpIHtcblx0XHRcdFx0bDEucHVzaChsMltpXSk7XG5cdFx0XHR9fVxuXHRcdFx0cmV0dXJuIGwxO1xuXHRcdH0sIFxuXHRcdGdldENsYXNzTGlzdCA9IGZ1bmN0aW9uKGFyZ3Mpe1xuXHRcdFx0dmFyIGksIHJlc3VsdDtcblx0XHRcdGZvcihpIGluIGFyZ3MpIHtcblx0XHRcdFx0aWYoYXJnc1tpXSAmJiBhcmdzW2ldLmNsYXNzKSB7XG5cdFx0XHRcdFx0cmV0dXJuIHR5cGVvZiAoYXJnc1tpXS5jbGFzcyA9PSBcInN0cmluZ1wiKT8gXG5cdFx0XHRcdFx0XHRhcmdzW2ldLmNsYXNzLnNwbGl0KFwiIFwiKTpcblx0XHRcdFx0XHRcdGZhbHNlO1xuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0fSxcblx0XHRtYWtlU3VnYXJUYWcgPSBmdW5jdGlvbih0YWcpIHtcblx0XHRcdHZhciBjLCBlbDtcblx0XHRcdHJldHVybiBmdW5jdGlvbigpIHtcblx0XHRcdFx0dmFyIGFyZ3MgPSBBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbChhcmd1bWVudHMpO1xuXHRcdFx0XHQvL1x0aWYgY2xhc3MgaXMgc3RyaW5nLCBhbGxvdyB1c2Ugb2YgY2FjaGVcblx0XHRcdFx0aWYoYyA9IGdldENsYXNzTGlzdChhcmdzKSkge1xuXHRcdFx0XHRcdGVsID0gW3RhZyArIFwiLlwiICsgYy5qb2luKFwiLlwiKV07XG5cdFx0XHRcdFx0Ly9cdFJlbW92ZSBjbGFzcyB0YWcsIHNvIHdlIGRvbid0IGR1cGxpY2F0ZVxuXHRcdFx0XHRcdGZvcih2YXIgaSBpbiBhcmdzKSB7XG5cdFx0XHRcdFx0XHRpZihhcmdzW2ldICYmIGFyZ3NbaV0uY2xhc3MpIHtcblx0XHRcdFx0XHRcdFx0ZGVsZXRlIGFyZ3NbaV0uY2xhc3M7XG5cdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdGVsID0gW3RhZ107XG5cdFx0XHRcdH1cblx0XHRcdFx0cmV0dXJuIChtLmU/IG0uZTogbSkuYXBwbHkodGhpcywgYXJnKGVsLCBhcmdzKSk7XG5cdFx0XHR9O1xuXHRcdH0sXG5cdFx0dGFnTGlzdCA9IFtcIkFcIixcIkFCQlJcIixcIkFDUk9OWU1cIixcIkFERFJFU1NcIixcIkFSRUFcIixcIkFSVElDTEVcIixcIkFTSURFXCIsXCJBVURJT1wiLFwiQlwiLFwiQkRJXCIsXCJCRE9cIixcIkJJR1wiLFwiQkxPQ0tRVU9URVwiLFwiQk9EWVwiLFwiQlJcIixcIkJVVFRPTlwiLFwiQ0FOVkFTXCIsXCJDQVBUSU9OXCIsXCJDSVRFXCIsXCJDT0RFXCIsXCJDT0xcIixcIkNPTEdST1VQXCIsXCJDT01NQU5EXCIsXCJEQVRBTElTVFwiLFwiRERcIixcIkRFTFwiLFwiREVUQUlMU1wiLFwiREZOXCIsXCJESVZcIixcIkRMXCIsXCJEVFwiLFwiRU1cIixcIkVNQkVEXCIsXCJGSUVMRFNFVFwiLFwiRklHQ0FQVElPTlwiLFwiRklHVVJFXCIsXCJGT09URVJcIixcIkZPUk1cIixcIkZSQU1FXCIsXCJGUkFNRVNFVFwiLFwiSDFcIixcIkgyXCIsXCJIM1wiLFwiSDRcIixcIkg1XCIsXCJINlwiLFwiSEVBRFwiLFwiSEVBREVSXCIsXCJIR1JPVVBcIixcIkhSXCIsXCJIVE1MXCIsXCJJXCIsXCJJRlJBTUVcIixcIklNR1wiLFwiSU5QVVRcIixcIklOU1wiLFwiS0JEXCIsXCJLRVlHRU5cIixcIkxBQkVMXCIsXCJMRUdFTkRcIixcIkxJXCIsXCJMSU5LXCIsXCJNQVBcIixcIk1BUktcIixcIk1FVEFcIixcIk1FVEVSXCIsXCJOQVZcIixcIk5PU0NSSVBUXCIsXCJPQkpFQ1RcIixcIk9MXCIsXCJPUFRHUk9VUFwiLFwiT1BUSU9OXCIsXCJPVVRQVVRcIixcIlBcIixcIlBBUkFNXCIsXCJQUkVcIixcIlBST0dSRVNTXCIsXCJRXCIsXCJSUFwiLFwiUlRcIixcIlJVQllcIixcIlNBTVBcIixcIlNDUklQVFwiLFwiU0VDVElPTlwiLFwiU0VMRUNUXCIsXCJTTUFMTFwiLFwiU09VUkNFXCIsXCJTUEFOXCIsXCJTUExJVFwiLFwiU1RST05HXCIsXCJTVFlMRVwiLFwiU1VCXCIsXCJTVU1NQVJZXCIsXCJTVVBcIixcIlRBQkxFXCIsXCJUQk9EWVwiLFwiVERcIixcIlRFWFRBUkVBXCIsXCJURk9PVFwiLFwiVEhcIixcIlRIRUFEXCIsXCJUSU1FXCIsXCJUSVRMRVwiLFwiVFJcIixcIlRSQUNLXCIsXCJUVFwiLFwiVUxcIixcIlZBUlwiLFwiVklERU9cIixcIldCUlwiXSxcblx0XHRsb3dlclRhZ0NhY2hlID0ge30sXG5cdFx0aTtcblxuXHQvL1x0Q3JlYXRlIHN1Z2FyJ2QgZnVuY3Rpb25zIGluIHRoZSByZXF1aXJlZCBzY29wZXNcblx0Zm9yIChpIGluIHRhZ0xpc3QpIHtpZih0YWdMaXN0Lmhhc093blByb3BlcnR5KGkpKSB7XG5cdFx0KGZ1bmN0aW9uKHRhZyl7XG5cdFx0XHR2YXIgbG93ZXJUYWcgPSB0YWcudG9Mb3dlckNhc2UoKTtcblx0XHRcdHNjb3BlW3RhZ10gPSBsb3dlclRhZ0NhY2hlW2xvd2VyVGFnXSA9IG1ha2VTdWdhclRhZyhsb3dlclRhZyk7XG5cdFx0fSh0YWdMaXN0W2ldKSk7XG5cdH19XG5cblx0Ly9cdExvd2VyY2FzZWQgc3VnYXIgdGFnc1xuXHRtLnN1Z2FyVGFncy5sb3dlciA9IGZ1bmN0aW9uKCl7XG5cdFx0cmV0dXJuIGxvd2VyVGFnQ2FjaGU7XG5cdH07XG5cblx0cmV0dXJuIHNjb3BlO1xufTtcblxuaWYgKHR5cGVvZiBtb2R1bGUgIT0gXCJ1bmRlZmluZWRcIiAmJiBtb2R1bGUgIT09IG51bGwgJiYgbW9kdWxlLmV4cG9ydHMpIHtcblx0bW9kdWxlLmV4cG9ydHMgPSBtaXRocmlsU3VnYXJ0YWdzO1xufSBlbHNlIGlmICh0eXBlb2YgZGVmaW5lID09PSBcImZ1bmN0aW9uXCIgJiYgZGVmaW5lLmFtZCkge1xuXHRkZWZpbmUoZnVuY3Rpb24oKSB7XG5cdFx0cmV0dXJuIG1pdGhyaWxTdWdhcnRhZ3M7XG5cdH0pO1xufSBlbHNlIHtcblx0bWl0aHJpbFN1Z2FydGFncyhcblx0XHR0eXBlb2Ygd2luZG93ICE9IFwidW5kZWZpbmVkXCI/IHdpbmRvdy5tIHx8IHt9OiB7fSxcblx0XHR0eXBlb2Ygd2luZG93ICE9IFwidW5kZWZpbmVkXCI/IHdpbmRvdzoge31cblx0KTtcbn1cblxufSgpKTsiLCJ2YXIgbSA9IChmdW5jdGlvbiBhcHAod2luZG93LCB1bmRlZmluZWQpIHtcclxuXHR2YXIgT0JKRUNUID0gXCJbb2JqZWN0IE9iamVjdF1cIiwgQVJSQVkgPSBcIltvYmplY3QgQXJyYXldXCIsIFNUUklORyA9IFwiW29iamVjdCBTdHJpbmddXCIsIEZVTkNUSU9OID0gXCJmdW5jdGlvblwiO1xyXG5cdHZhciB0eXBlID0ge30udG9TdHJpbmc7XHJcblx0dmFyIHBhcnNlciA9IC8oPzooXnwjfFxcLikoW14jXFwuXFxbXFxdXSspKXwoXFxbLis/XFxdKS9nLCBhdHRyUGFyc2VyID0gL1xcWyguKz8pKD86PShcInwnfCkoLio/KVxcMik/XFxdLztcclxuXHR2YXIgdm9pZEVsZW1lbnRzID0gL14oQVJFQXxCQVNFfEJSfENPTHxDT01NQU5EfEVNQkVEfEhSfElNR3xJTlBVVHxLRVlHRU58TElOS3xNRVRBfFBBUkFNfFNPVVJDRXxUUkFDS3xXQlIpJC87XHJcblx0dmFyIG5vb3AgPSBmdW5jdGlvbigpIHt9XHJcblxyXG5cdC8vIGNhY2hpbmcgY29tbW9ubHkgdXNlZCB2YXJpYWJsZXNcclxuXHR2YXIgJGRvY3VtZW50LCAkbG9jYXRpb24sICRyZXF1ZXN0QW5pbWF0aW9uRnJhbWUsICRjYW5jZWxBbmltYXRpb25GcmFtZTtcclxuXHJcblx0Ly8gc2VsZiBpbnZva2luZyBmdW5jdGlvbiBuZWVkZWQgYmVjYXVzZSBvZiB0aGUgd2F5IG1vY2tzIHdvcmtcclxuXHRmdW5jdGlvbiBpbml0aWFsaXplKHdpbmRvdyl7XHJcblx0XHQkZG9jdW1lbnQgPSB3aW5kb3cuZG9jdW1lbnQ7XHJcblx0XHQkbG9jYXRpb24gPSB3aW5kb3cubG9jYXRpb247XHJcblx0XHQkY2FuY2VsQW5pbWF0aW9uRnJhbWUgPSB3aW5kb3cuY2FuY2VsQW5pbWF0aW9uRnJhbWUgfHwgd2luZG93LmNsZWFyVGltZW91dDtcclxuXHRcdCRyZXF1ZXN0QW5pbWF0aW9uRnJhbWUgPSB3aW5kb3cucmVxdWVzdEFuaW1hdGlvbkZyYW1lIHx8IHdpbmRvdy5zZXRUaW1lb3V0O1xyXG5cdH1cclxuXHJcblx0aW5pdGlhbGl6ZSh3aW5kb3cpO1xyXG5cclxuXHJcblx0LyoqXHJcblx0ICogQHR5cGVkZWYge1N0cmluZ30gVGFnXHJcblx0ICogQSBzdHJpbmcgdGhhdCBsb29rcyBsaWtlIC0+IGRpdi5jbGFzc25hbWUjaWRbcGFyYW09b25lXVtwYXJhbTI9dHdvXVxyXG5cdCAqIFdoaWNoIGRlc2NyaWJlcyBhIERPTSBub2RlXHJcblx0ICovXHJcblxyXG5cdC8qKlxyXG5cdCAqXHJcblx0ICogQHBhcmFtIHtUYWd9IFRoZSBET00gbm9kZSB0YWdcclxuXHQgKiBAcGFyYW0ge09iamVjdD1bXX0gb3B0aW9uYWwga2V5LXZhbHVlIHBhaXJzIHRvIGJlIG1hcHBlZCB0byBET00gYXR0cnNcclxuXHQgKiBAcGFyYW0gey4uLm1Ob2RlPVtdfSBaZXJvIG9yIG1vcmUgTWl0aHJpbCBjaGlsZCBub2Rlcy4gQ2FuIGJlIGFuIGFycmF5LCBvciBzcGxhdCAob3B0aW9uYWwpXHJcblx0ICpcclxuXHQgKi9cclxuXHRmdW5jdGlvbiBtKCkge1xyXG5cdFx0dmFyIGFyZ3MgPSBbXS5zbGljZS5jYWxsKGFyZ3VtZW50cyk7XHJcblx0XHR2YXIgaGFzQXR0cnMgPSBhcmdzWzFdICE9IG51bGwgJiYgdHlwZS5jYWxsKGFyZ3NbMV0pID09PSBPQkpFQ1QgJiYgIShcInRhZ1wiIGluIGFyZ3NbMV0gfHwgXCJ2aWV3XCIgaW4gYXJnc1sxXSkgJiYgIShcInN1YnRyZWVcIiBpbiBhcmdzWzFdKTtcclxuXHRcdHZhciBhdHRycyA9IGhhc0F0dHJzID8gYXJnc1sxXSA6IHt9O1xyXG5cdFx0dmFyIGNsYXNzQXR0ck5hbWUgPSBcImNsYXNzXCIgaW4gYXR0cnMgPyBcImNsYXNzXCIgOiBcImNsYXNzTmFtZVwiO1xyXG5cdFx0dmFyIGNlbGwgPSB7dGFnOiBcImRpdlwiLCBhdHRyczoge319O1xyXG5cdFx0dmFyIG1hdGNoLCBjbGFzc2VzID0gW107XHJcblx0XHRpZiAodHlwZS5jYWxsKGFyZ3NbMF0pICE9IFNUUklORykgdGhyb3cgbmV3IEVycm9yKFwic2VsZWN0b3IgaW4gbShzZWxlY3RvciwgYXR0cnMsIGNoaWxkcmVuKSBzaG91bGQgYmUgYSBzdHJpbmdcIilcclxuXHRcdHdoaWxlIChtYXRjaCA9IHBhcnNlci5leGVjKGFyZ3NbMF0pKSB7XHJcblx0XHRcdGlmIChtYXRjaFsxXSA9PT0gXCJcIiAmJiBtYXRjaFsyXSkgY2VsbC50YWcgPSBtYXRjaFsyXTtcclxuXHRcdFx0ZWxzZSBpZiAobWF0Y2hbMV0gPT09IFwiI1wiKSBjZWxsLmF0dHJzLmlkID0gbWF0Y2hbMl07XHJcblx0XHRcdGVsc2UgaWYgKG1hdGNoWzFdID09PSBcIi5cIikgY2xhc3Nlcy5wdXNoKG1hdGNoWzJdKTtcclxuXHRcdFx0ZWxzZSBpZiAobWF0Y2hbM11bMF0gPT09IFwiW1wiKSB7XHJcblx0XHRcdFx0dmFyIHBhaXIgPSBhdHRyUGFyc2VyLmV4ZWMobWF0Y2hbM10pO1xyXG5cdFx0XHRcdGNlbGwuYXR0cnNbcGFpclsxXV0gPSBwYWlyWzNdIHx8IChwYWlyWzJdID8gXCJcIiA6dHJ1ZSlcclxuXHRcdFx0fVxyXG5cdFx0fVxyXG5cclxuXHRcdHZhciBjaGlsZHJlbiA9IGhhc0F0dHJzID8gYXJncy5zbGljZSgyKSA6IGFyZ3Muc2xpY2UoMSk7XHJcblx0XHRpZiAoY2hpbGRyZW4ubGVuZ3RoID09PSAxICYmIHR5cGUuY2FsbChjaGlsZHJlblswXSkgPT09IEFSUkFZKSB7XHJcblx0XHRcdGNlbGwuY2hpbGRyZW4gPSBjaGlsZHJlblswXVxyXG5cdFx0fVxyXG5cdFx0ZWxzZSB7XHJcblx0XHRcdGNlbGwuY2hpbGRyZW4gPSBjaGlsZHJlblxyXG5cdFx0fVxyXG5cdFx0XHJcblx0XHRmb3IgKHZhciBhdHRyTmFtZSBpbiBhdHRycykge1xyXG5cdFx0XHRpZiAoYXR0cnMuaGFzT3duUHJvcGVydHkoYXR0ck5hbWUpKSB7XHJcblx0XHRcdFx0aWYgKGF0dHJOYW1lID09PSBjbGFzc0F0dHJOYW1lICYmIGF0dHJzW2F0dHJOYW1lXSAhPSBudWxsICYmIGF0dHJzW2F0dHJOYW1lXSAhPT0gXCJcIikge1xyXG5cdFx0XHRcdFx0Y2xhc3Nlcy5wdXNoKGF0dHJzW2F0dHJOYW1lXSlcclxuXHRcdFx0XHRcdGNlbGwuYXR0cnNbYXR0ck5hbWVdID0gXCJcIiAvL2NyZWF0ZSBrZXkgaW4gY29ycmVjdCBpdGVyYXRpb24gb3JkZXJcclxuXHRcdFx0XHR9XHJcblx0XHRcdFx0ZWxzZSBjZWxsLmF0dHJzW2F0dHJOYW1lXSA9IGF0dHJzW2F0dHJOYW1lXVxyXG5cdFx0XHR9XHJcblx0XHR9XHJcblx0XHRpZiAoY2xhc3Nlcy5sZW5ndGggPiAwKSBjZWxsLmF0dHJzW2NsYXNzQXR0ck5hbWVdID0gY2xhc3Nlcy5qb2luKFwiIFwiKTtcclxuXHRcdFxyXG5cdFx0cmV0dXJuIGNlbGxcclxuXHR9XHJcblx0ZnVuY3Rpb24gYnVpbGQocGFyZW50RWxlbWVudCwgcGFyZW50VGFnLCBwYXJlbnRDYWNoZSwgcGFyZW50SW5kZXgsIGRhdGEsIGNhY2hlZCwgc2hvdWxkUmVhdHRhY2gsIGluZGV4LCBlZGl0YWJsZSwgbmFtZXNwYWNlLCBjb25maWdzKSB7XHJcblx0XHQvL2BidWlsZGAgaXMgYSByZWN1cnNpdmUgZnVuY3Rpb24gdGhhdCBtYW5hZ2VzIGNyZWF0aW9uL2RpZmZpbmcvcmVtb3ZhbCBvZiBET00gZWxlbWVudHMgYmFzZWQgb24gY29tcGFyaXNvbiBiZXR3ZWVuIGBkYXRhYCBhbmQgYGNhY2hlZGBcclxuXHRcdC8vdGhlIGRpZmYgYWxnb3JpdGhtIGNhbiBiZSBzdW1tYXJpemVkIGFzIHRoaXM6XHJcblx0XHQvLzEgLSBjb21wYXJlIGBkYXRhYCBhbmQgYGNhY2hlZGBcclxuXHRcdC8vMiAtIGlmIHRoZXkgYXJlIGRpZmZlcmVudCwgY29weSBgZGF0YWAgdG8gYGNhY2hlZGAgYW5kIHVwZGF0ZSB0aGUgRE9NIGJhc2VkIG9uIHdoYXQgdGhlIGRpZmZlcmVuY2UgaXNcclxuXHRcdC8vMyAtIHJlY3Vyc2l2ZWx5IGFwcGx5IHRoaXMgYWxnb3JpdGhtIGZvciBldmVyeSBhcnJheSBhbmQgZm9yIHRoZSBjaGlsZHJlbiBvZiBldmVyeSB2aXJ0dWFsIGVsZW1lbnRcclxuXHJcblx0XHQvL3RoZSBgY2FjaGVkYCBkYXRhIHN0cnVjdHVyZSBpcyBlc3NlbnRpYWxseSB0aGUgc2FtZSBhcyB0aGUgcHJldmlvdXMgcmVkcmF3J3MgYGRhdGFgIGRhdGEgc3RydWN0dXJlLCB3aXRoIGEgZmV3IGFkZGl0aW9uczpcclxuXHRcdC8vLSBgY2FjaGVkYCBhbHdheXMgaGFzIGEgcHJvcGVydHkgY2FsbGVkIGBub2Rlc2AsIHdoaWNoIGlzIGEgbGlzdCBvZiBET00gZWxlbWVudHMgdGhhdCBjb3JyZXNwb25kIHRvIHRoZSBkYXRhIHJlcHJlc2VudGVkIGJ5IHRoZSByZXNwZWN0aXZlIHZpcnR1YWwgZWxlbWVudFxyXG5cdFx0Ly8tIGluIG9yZGVyIHRvIHN1cHBvcnQgYXR0YWNoaW5nIGBub2Rlc2AgYXMgYSBwcm9wZXJ0eSBvZiBgY2FjaGVkYCwgYGNhY2hlZGAgaXMgKmFsd2F5cyogYSBub24tcHJpbWl0aXZlIG9iamVjdCwgaS5lLiBpZiB0aGUgZGF0YSB3YXMgYSBzdHJpbmcsIHRoZW4gY2FjaGVkIGlzIGEgU3RyaW5nIGluc3RhbmNlLiBJZiBkYXRhIHdhcyBgbnVsbGAgb3IgYHVuZGVmaW5lZGAsIGNhY2hlZCBpcyBgbmV3IFN0cmluZyhcIlwiKWBcclxuXHRcdC8vLSBgY2FjaGVkIGFsc28gaGFzIGEgYGNvbmZpZ0NvbnRleHRgIHByb3BlcnR5LCB3aGljaCBpcyB0aGUgc3RhdGUgc3RvcmFnZSBvYmplY3QgZXhwb3NlZCBieSBjb25maWcoZWxlbWVudCwgaXNJbml0aWFsaXplZCwgY29udGV4dClcclxuXHRcdC8vLSB3aGVuIGBjYWNoZWRgIGlzIGFuIE9iamVjdCwgaXQgcmVwcmVzZW50cyBhIHZpcnR1YWwgZWxlbWVudDsgd2hlbiBpdCdzIGFuIEFycmF5LCBpdCByZXByZXNlbnRzIGEgbGlzdCBvZiBlbGVtZW50czsgd2hlbiBpdCdzIGEgU3RyaW5nLCBOdW1iZXIgb3IgQm9vbGVhbiwgaXQgcmVwcmVzZW50cyBhIHRleHQgbm9kZVxyXG5cclxuXHRcdC8vYHBhcmVudEVsZW1lbnRgIGlzIGEgRE9NIGVsZW1lbnQgdXNlZCBmb3IgVzNDIERPTSBBUEkgY2FsbHNcclxuXHRcdC8vYHBhcmVudFRhZ2AgaXMgb25seSB1c2VkIGZvciBoYW5kbGluZyBhIGNvcm5lciBjYXNlIGZvciB0ZXh0YXJlYSB2YWx1ZXNcclxuXHRcdC8vYHBhcmVudENhY2hlYCBpcyB1c2VkIHRvIHJlbW92ZSBub2RlcyBpbiBzb21lIG11bHRpLW5vZGUgY2FzZXNcclxuXHRcdC8vYHBhcmVudEluZGV4YCBhbmQgYGluZGV4YCBhcmUgdXNlZCB0byBmaWd1cmUgb3V0IHRoZSBvZmZzZXQgb2Ygbm9kZXMuIFRoZXkncmUgYXJ0aWZhY3RzIGZyb20gYmVmb3JlIGFycmF5cyBzdGFydGVkIGJlaW5nIGZsYXR0ZW5lZCBhbmQgYXJlIGxpa2VseSByZWZhY3RvcmFibGVcclxuXHRcdC8vYGRhdGFgIGFuZCBgY2FjaGVkYCBhcmUsIHJlc3BlY3RpdmVseSwgdGhlIG5ldyBhbmQgb2xkIG5vZGVzIGJlaW5nIGRpZmZlZFxyXG5cdFx0Ly9gc2hvdWxkUmVhdHRhY2hgIGlzIGEgZmxhZyBpbmRpY2F0aW5nIHdoZXRoZXIgYSBwYXJlbnQgbm9kZSB3YXMgcmVjcmVhdGVkIChpZiBzbywgYW5kIGlmIHRoaXMgbm9kZSBpcyByZXVzZWQsIHRoZW4gdGhpcyBub2RlIG11c3QgcmVhdHRhY2ggaXRzZWxmIHRvIHRoZSBuZXcgcGFyZW50KVxyXG5cdFx0Ly9gZWRpdGFibGVgIGlzIGEgZmxhZyB0aGF0IGluZGljYXRlcyB3aGV0aGVyIGFuIGFuY2VzdG9yIGlzIGNvbnRlbnRlZGl0YWJsZVxyXG5cdFx0Ly9gbmFtZXNwYWNlYCBpbmRpY2F0ZXMgdGhlIGNsb3Nlc3QgSFRNTCBuYW1lc3BhY2UgYXMgaXQgY2FzY2FkZXMgZG93biBmcm9tIGFuIGFuY2VzdG9yXHJcblx0XHQvL2Bjb25maWdzYCBpcyBhIGxpc3Qgb2YgY29uZmlnIGZ1bmN0aW9ucyB0byBydW4gYWZ0ZXIgdGhlIHRvcG1vc3QgYGJ1aWxkYCBjYWxsIGZpbmlzaGVzIHJ1bm5pbmdcclxuXHJcblx0XHQvL3RoZXJlJ3MgbG9naWMgdGhhdCByZWxpZXMgb24gdGhlIGFzc3VtcHRpb24gdGhhdCBudWxsIGFuZCB1bmRlZmluZWQgZGF0YSBhcmUgZXF1aXZhbGVudCB0byBlbXB0eSBzdHJpbmdzXHJcblx0XHQvLy0gdGhpcyBwcmV2ZW50cyBsaWZlY3ljbGUgc3VycHJpc2VzIGZyb20gcHJvY2VkdXJhbCBoZWxwZXJzIHRoYXQgbWl4IGltcGxpY2l0IGFuZCBleHBsaWNpdCByZXR1cm4gc3RhdGVtZW50cyAoZS5nLiBmdW5jdGlvbiBmb28oKSB7aWYgKGNvbmQpIHJldHVybiBtKFwiZGl2XCIpfVxyXG5cdFx0Ly8tIGl0IHNpbXBsaWZpZXMgZGlmZmluZyBjb2RlXHJcblx0XHQvL2RhdGEudG9TdHJpbmcoKSBtaWdodCB0aHJvdyBvciByZXR1cm4gbnVsbCBpZiBkYXRhIGlzIHRoZSByZXR1cm4gdmFsdWUgb2YgQ29uc29sZS5sb2cgaW4gRmlyZWZveCAoYmVoYXZpb3IgZGVwZW5kcyBvbiB2ZXJzaW9uKVxyXG5cdFx0dHJ5IHtpZiAoZGF0YSA9PSBudWxsIHx8IGRhdGEudG9TdHJpbmcoKSA9PSBudWxsKSBkYXRhID0gXCJcIjt9IGNhdGNoIChlKSB7ZGF0YSA9IFwiXCJ9XHJcblx0XHRpZiAoZGF0YS5zdWJ0cmVlID09PSBcInJldGFpblwiKSByZXR1cm4gY2FjaGVkO1xyXG5cdFx0dmFyIGNhY2hlZFR5cGUgPSB0eXBlLmNhbGwoY2FjaGVkKSwgZGF0YVR5cGUgPSB0eXBlLmNhbGwoZGF0YSk7XHJcblx0XHRpZiAoY2FjaGVkID09IG51bGwgfHwgY2FjaGVkVHlwZSAhPT0gZGF0YVR5cGUpIHtcclxuXHRcdFx0aWYgKGNhY2hlZCAhPSBudWxsKSB7XHJcblx0XHRcdFx0aWYgKHBhcmVudENhY2hlICYmIHBhcmVudENhY2hlLm5vZGVzKSB7XHJcblx0XHRcdFx0XHR2YXIgb2Zmc2V0ID0gaW5kZXggLSBwYXJlbnRJbmRleDtcclxuXHRcdFx0XHRcdHZhciBlbmQgPSBvZmZzZXQgKyAoZGF0YVR5cGUgPT09IEFSUkFZID8gZGF0YSA6IGNhY2hlZC5ub2RlcykubGVuZ3RoO1xyXG5cdFx0XHRcdFx0Y2xlYXIocGFyZW50Q2FjaGUubm9kZXMuc2xpY2Uob2Zmc2V0LCBlbmQpLCBwYXJlbnRDYWNoZS5zbGljZShvZmZzZXQsIGVuZCkpXHJcblx0XHRcdFx0fVxyXG5cdFx0XHRcdGVsc2UgaWYgKGNhY2hlZC5ub2RlcykgY2xlYXIoY2FjaGVkLm5vZGVzLCBjYWNoZWQpXHJcblx0XHRcdH1cclxuXHRcdFx0Y2FjaGVkID0gbmV3IGRhdGEuY29uc3RydWN0b3I7XHJcblx0XHRcdGlmIChjYWNoZWQudGFnKSBjYWNoZWQgPSB7fTsgLy9pZiBjb25zdHJ1Y3RvciBjcmVhdGVzIGEgdmlydHVhbCBkb20gZWxlbWVudCwgdXNlIGEgYmxhbmsgb2JqZWN0IGFzIHRoZSBiYXNlIGNhY2hlZCBub2RlIGluc3RlYWQgb2YgY29weWluZyB0aGUgdmlydHVhbCBlbCAoIzI3NylcclxuXHRcdFx0Y2FjaGVkLm5vZGVzID0gW11cclxuXHRcdH1cclxuXHJcblx0XHRpZiAoZGF0YVR5cGUgPT09IEFSUkFZKSB7XHJcblx0XHRcdC8vcmVjdXJzaXZlbHkgZmxhdHRlbiBhcnJheVxyXG5cdFx0XHRmb3IgKHZhciBpID0gMCwgbGVuID0gZGF0YS5sZW5ndGg7IGkgPCBsZW47IGkrKykge1xyXG5cdFx0XHRcdGlmICh0eXBlLmNhbGwoZGF0YVtpXSkgPT09IEFSUkFZKSB7XHJcblx0XHRcdFx0XHRkYXRhID0gZGF0YS5jb25jYXQuYXBwbHkoW10sIGRhdGEpO1xyXG5cdFx0XHRcdFx0aS0tIC8vY2hlY2sgY3VycmVudCBpbmRleCBhZ2FpbiBhbmQgZmxhdHRlbiB1bnRpbCB0aGVyZSBhcmUgbm8gbW9yZSBuZXN0ZWQgYXJyYXlzIGF0IHRoYXQgaW5kZXhcclxuXHRcdFx0XHRcdGxlbiA9IGRhdGEubGVuZ3RoXHJcblx0XHRcdFx0fVxyXG5cdFx0XHR9XHJcblx0XHRcdFxyXG5cdFx0XHR2YXIgbm9kZXMgPSBbXSwgaW50YWN0ID0gY2FjaGVkLmxlbmd0aCA9PT0gZGF0YS5sZW5ndGgsIHN1YkFycmF5Q291bnQgPSAwO1xyXG5cclxuXHRcdFx0Ly9rZXlzIGFsZ29yaXRobTogc29ydCBlbGVtZW50cyB3aXRob3V0IHJlY3JlYXRpbmcgdGhlbSBpZiBrZXlzIGFyZSBwcmVzZW50XHJcblx0XHRcdC8vMSkgY3JlYXRlIGEgbWFwIG9mIGFsbCBleGlzdGluZyBrZXlzLCBhbmQgbWFyayBhbGwgZm9yIGRlbGV0aW9uXHJcblx0XHRcdC8vMikgYWRkIG5ldyBrZXlzIHRvIG1hcCBhbmQgbWFyayB0aGVtIGZvciBhZGRpdGlvblxyXG5cdFx0XHQvLzMpIGlmIGtleSBleGlzdHMgaW4gbmV3IGxpc3QsIGNoYW5nZSBhY3Rpb24gZnJvbSBkZWxldGlvbiB0byBhIG1vdmVcclxuXHRcdFx0Ly80KSBmb3IgZWFjaCBrZXksIGhhbmRsZSBpdHMgY29ycmVzcG9uZGluZyBhY3Rpb24gYXMgbWFya2VkIGluIHByZXZpb3VzIHN0ZXBzXHJcblx0XHRcdHZhciBERUxFVElPTiA9IDEsIElOU0VSVElPTiA9IDIgLCBNT1ZFID0gMztcclxuXHRcdFx0dmFyIGV4aXN0aW5nID0ge30sIHNob3VsZE1haW50YWluSWRlbnRpdGllcyA9IGZhbHNlO1xyXG5cdFx0XHRmb3IgKHZhciBpID0gMDsgaSA8IGNhY2hlZC5sZW5ndGg7IGkrKykge1xyXG5cdFx0XHRcdGlmIChjYWNoZWRbaV0gJiYgY2FjaGVkW2ldLmF0dHJzICYmIGNhY2hlZFtpXS5hdHRycy5rZXkgIT0gbnVsbCkge1xyXG5cdFx0XHRcdFx0c2hvdWxkTWFpbnRhaW5JZGVudGl0aWVzID0gdHJ1ZTtcclxuXHRcdFx0XHRcdGV4aXN0aW5nW2NhY2hlZFtpXS5hdHRycy5rZXldID0ge2FjdGlvbjogREVMRVRJT04sIGluZGV4OiBpfVxyXG5cdFx0XHRcdH1cclxuXHRcdFx0fVxyXG5cdFx0XHRcclxuXHRcdFx0dmFyIGd1aWQgPSAwXHJcblx0XHRcdGZvciAodmFyIGkgPSAwLCBsZW4gPSBkYXRhLmxlbmd0aDsgaSA8IGxlbjsgaSsrKSB7XHJcblx0XHRcdFx0aWYgKGRhdGFbaV0gJiYgZGF0YVtpXS5hdHRycyAmJiBkYXRhW2ldLmF0dHJzLmtleSAhPSBudWxsKSB7XHJcblx0XHRcdFx0XHRmb3IgKHZhciBqID0gMCwgbGVuID0gZGF0YS5sZW5ndGg7IGogPCBsZW47IGorKykge1xyXG5cdFx0XHRcdFx0XHRpZiAoZGF0YVtqXSAmJiBkYXRhW2pdLmF0dHJzICYmIGRhdGFbal0uYXR0cnMua2V5ID09IG51bGwpIGRhdGFbal0uYXR0cnMua2V5ID0gXCJfX21pdGhyaWxfX1wiICsgZ3VpZCsrXHJcblx0XHRcdFx0XHR9XHJcblx0XHRcdFx0XHRicmVha1xyXG5cdFx0XHRcdH1cclxuXHRcdFx0fVxyXG5cdFx0XHRcclxuXHRcdFx0aWYgKHNob3VsZE1haW50YWluSWRlbnRpdGllcykge1xyXG5cdFx0XHRcdHZhciBrZXlzRGlmZmVyID0gZmFsc2VcclxuXHRcdFx0XHRpZiAoZGF0YS5sZW5ndGggIT0gY2FjaGVkLmxlbmd0aCkga2V5c0RpZmZlciA9IHRydWVcclxuXHRcdFx0XHRlbHNlIGZvciAodmFyIGkgPSAwLCBjYWNoZWRDZWxsLCBkYXRhQ2VsbDsgY2FjaGVkQ2VsbCA9IGNhY2hlZFtpXSwgZGF0YUNlbGwgPSBkYXRhW2ldOyBpKyspIHtcclxuXHRcdFx0XHRcdGlmIChjYWNoZWRDZWxsLmF0dHJzICYmIGRhdGFDZWxsLmF0dHJzICYmIGNhY2hlZENlbGwuYXR0cnMua2V5ICE9IGRhdGFDZWxsLmF0dHJzLmtleSkge1xyXG5cdFx0XHRcdFx0XHRrZXlzRGlmZmVyID0gdHJ1ZVxyXG5cdFx0XHRcdFx0XHRicmVha1xyXG5cdFx0XHRcdFx0fVxyXG5cdFx0XHRcdH1cclxuXHRcdFx0XHRcclxuXHRcdFx0XHRpZiAoa2V5c0RpZmZlcikge1xyXG5cdFx0XHRcdFx0Zm9yICh2YXIgaSA9IDAsIGxlbiA9IGRhdGEubGVuZ3RoOyBpIDwgbGVuOyBpKyspIHtcclxuXHRcdFx0XHRcdFx0aWYgKGRhdGFbaV0gJiYgZGF0YVtpXS5hdHRycykge1xyXG5cdFx0XHRcdFx0XHRcdGlmIChkYXRhW2ldLmF0dHJzLmtleSAhPSBudWxsKSB7XHJcblx0XHRcdFx0XHRcdFx0XHR2YXIga2V5ID0gZGF0YVtpXS5hdHRycy5rZXk7XHJcblx0XHRcdFx0XHRcdFx0XHRpZiAoIWV4aXN0aW5nW2tleV0pIGV4aXN0aW5nW2tleV0gPSB7YWN0aW9uOiBJTlNFUlRJT04sIGluZGV4OiBpfTtcclxuXHRcdFx0XHRcdFx0XHRcdGVsc2UgZXhpc3Rpbmdba2V5XSA9IHtcclxuXHRcdFx0XHRcdFx0XHRcdFx0YWN0aW9uOiBNT1ZFLFxyXG5cdFx0XHRcdFx0XHRcdFx0XHRpbmRleDogaSxcclxuXHRcdFx0XHRcdFx0XHRcdFx0ZnJvbTogZXhpc3Rpbmdba2V5XS5pbmRleCxcclxuXHRcdFx0XHRcdFx0XHRcdFx0ZWxlbWVudDogY2FjaGVkLm5vZGVzW2V4aXN0aW5nW2tleV0uaW5kZXhdIHx8ICRkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiZGl2XCIpXHJcblx0XHRcdFx0XHRcdFx0XHR9XHJcblx0XHRcdFx0XHRcdFx0fVxyXG5cdFx0XHRcdFx0XHR9XHJcblx0XHRcdFx0XHR9XHJcblx0XHRcdFx0XHR2YXIgYWN0aW9ucyA9IFtdXHJcblx0XHRcdFx0XHRmb3IgKHZhciBwcm9wIGluIGV4aXN0aW5nKSBhY3Rpb25zLnB1c2goZXhpc3RpbmdbcHJvcF0pXHJcblx0XHRcdFx0XHR2YXIgY2hhbmdlcyA9IGFjdGlvbnMuc29ydChzb3J0Q2hhbmdlcyk7XHJcblx0XHRcdFx0XHR2YXIgbmV3Q2FjaGVkID0gbmV3IEFycmF5KGNhY2hlZC5sZW5ndGgpXHJcblx0XHRcdFx0XHRuZXdDYWNoZWQubm9kZXMgPSBjYWNoZWQubm9kZXMuc2xpY2UoKVxyXG5cclxuXHRcdFx0XHRcdGZvciAodmFyIGkgPSAwLCBjaGFuZ2U7IGNoYW5nZSA9IGNoYW5nZXNbaV07IGkrKykge1xyXG5cdFx0XHRcdFx0XHRpZiAoY2hhbmdlLmFjdGlvbiA9PT0gREVMRVRJT04pIHtcclxuXHRcdFx0XHRcdFx0XHRjbGVhcihjYWNoZWRbY2hhbmdlLmluZGV4XS5ub2RlcywgY2FjaGVkW2NoYW5nZS5pbmRleF0pO1xyXG5cdFx0XHRcdFx0XHRcdG5ld0NhY2hlZC5zcGxpY2UoY2hhbmdlLmluZGV4LCAxKVxyXG5cdFx0XHRcdFx0XHR9XHJcblx0XHRcdFx0XHRcdGlmIChjaGFuZ2UuYWN0aW9uID09PSBJTlNFUlRJT04pIHtcclxuXHRcdFx0XHRcdFx0XHR2YXIgZHVtbXkgPSAkZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImRpdlwiKTtcclxuXHRcdFx0XHRcdFx0XHRkdW1teS5rZXkgPSBkYXRhW2NoYW5nZS5pbmRleF0uYXR0cnMua2V5O1xyXG5cdFx0XHRcdFx0XHRcdHBhcmVudEVsZW1lbnQuaW5zZXJ0QmVmb3JlKGR1bW15LCBwYXJlbnRFbGVtZW50LmNoaWxkTm9kZXNbY2hhbmdlLmluZGV4XSB8fCBudWxsKTtcclxuXHRcdFx0XHRcdFx0XHRuZXdDYWNoZWQuc3BsaWNlKGNoYW5nZS5pbmRleCwgMCwge2F0dHJzOiB7a2V5OiBkYXRhW2NoYW5nZS5pbmRleF0uYXR0cnMua2V5fSwgbm9kZXM6IFtkdW1teV19KVxyXG5cdFx0XHRcdFx0XHRcdG5ld0NhY2hlZC5ub2Rlc1tjaGFuZ2UuaW5kZXhdID0gZHVtbXlcclxuXHRcdFx0XHRcdFx0fVxyXG5cclxuXHRcdFx0XHRcdFx0aWYgKGNoYW5nZS5hY3Rpb24gPT09IE1PVkUpIHtcclxuXHRcdFx0XHRcdFx0XHRpZiAocGFyZW50RWxlbWVudC5jaGlsZE5vZGVzW2NoYW5nZS5pbmRleF0gIT09IGNoYW5nZS5lbGVtZW50ICYmIGNoYW5nZS5lbGVtZW50ICE9PSBudWxsKSB7XHJcblx0XHRcdFx0XHRcdFx0XHRwYXJlbnRFbGVtZW50Lmluc2VydEJlZm9yZShjaGFuZ2UuZWxlbWVudCwgcGFyZW50RWxlbWVudC5jaGlsZE5vZGVzW2NoYW5nZS5pbmRleF0gfHwgbnVsbClcclxuXHRcdFx0XHRcdFx0XHR9XHJcblx0XHRcdFx0XHRcdFx0bmV3Q2FjaGVkW2NoYW5nZS5pbmRleF0gPSBjYWNoZWRbY2hhbmdlLmZyb21dXHJcblx0XHRcdFx0XHRcdFx0bmV3Q2FjaGVkLm5vZGVzW2NoYW5nZS5pbmRleF0gPSBjaGFuZ2UuZWxlbWVudFxyXG5cdFx0XHRcdFx0XHR9XHJcblx0XHRcdFx0XHR9XHJcblx0XHRcdFx0XHRjYWNoZWQgPSBuZXdDYWNoZWQ7XHJcblx0XHRcdFx0fVxyXG5cdFx0XHR9XHJcblx0XHRcdC8vZW5kIGtleSBhbGdvcml0aG1cclxuXHJcblx0XHRcdGZvciAodmFyIGkgPSAwLCBjYWNoZUNvdW50ID0gMCwgbGVuID0gZGF0YS5sZW5ndGg7IGkgPCBsZW47IGkrKykge1xyXG5cdFx0XHRcdC8vZGlmZiBlYWNoIGl0ZW0gaW4gdGhlIGFycmF5XHJcblx0XHRcdFx0dmFyIGl0ZW0gPSBidWlsZChwYXJlbnRFbGVtZW50LCBwYXJlbnRUYWcsIGNhY2hlZCwgaW5kZXgsIGRhdGFbaV0sIGNhY2hlZFtjYWNoZUNvdW50XSwgc2hvdWxkUmVhdHRhY2gsIGluZGV4ICsgc3ViQXJyYXlDb3VudCB8fCBzdWJBcnJheUNvdW50LCBlZGl0YWJsZSwgbmFtZXNwYWNlLCBjb25maWdzKTtcclxuXHRcdFx0XHRpZiAoaXRlbSA9PT0gdW5kZWZpbmVkKSBjb250aW51ZTtcclxuXHRcdFx0XHRpZiAoIWl0ZW0ubm9kZXMuaW50YWN0KSBpbnRhY3QgPSBmYWxzZTtcclxuXHRcdFx0XHRpZiAoaXRlbS4kdHJ1c3RlZCkge1xyXG5cdFx0XHRcdFx0Ly9maXggb2Zmc2V0IG9mIG5leHQgZWxlbWVudCBpZiBpdGVtIHdhcyBhIHRydXN0ZWQgc3RyaW5nIHcvIG1vcmUgdGhhbiBvbmUgaHRtbCBlbGVtZW50XHJcblx0XHRcdFx0XHQvL3RoZSBmaXJzdCBjbGF1c2UgaW4gdGhlIHJlZ2V4cCBtYXRjaGVzIGVsZW1lbnRzXHJcblx0XHRcdFx0XHQvL3RoZSBzZWNvbmQgY2xhdXNlIChhZnRlciB0aGUgcGlwZSkgbWF0Y2hlcyB0ZXh0IG5vZGVzXHJcblx0XHRcdFx0XHRzdWJBcnJheUNvdW50ICs9IChpdGVtLm1hdGNoKC88W15cXC9dfFxcPlxccypbXjxdL2cpIHx8IFswXSkubGVuZ3RoXHJcblx0XHRcdFx0fVxyXG5cdFx0XHRcdGVsc2Ugc3ViQXJyYXlDb3VudCArPSB0eXBlLmNhbGwoaXRlbSkgPT09IEFSUkFZID8gaXRlbS5sZW5ndGggOiAxO1xyXG5cdFx0XHRcdGNhY2hlZFtjYWNoZUNvdW50KytdID0gaXRlbVxyXG5cdFx0XHR9XHJcblx0XHRcdGlmICghaW50YWN0KSB7XHJcblx0XHRcdFx0Ly9kaWZmIHRoZSBhcnJheSBpdHNlbGZcclxuXHRcdFx0XHRcclxuXHRcdFx0XHQvL3VwZGF0ZSB0aGUgbGlzdCBvZiBET00gbm9kZXMgYnkgY29sbGVjdGluZyB0aGUgbm9kZXMgZnJvbSBlYWNoIGl0ZW1cclxuXHRcdFx0XHRmb3IgKHZhciBpID0gMCwgbGVuID0gZGF0YS5sZW5ndGg7IGkgPCBsZW47IGkrKykge1xyXG5cdFx0XHRcdFx0aWYgKGNhY2hlZFtpXSAhPSBudWxsKSBub2Rlcy5wdXNoLmFwcGx5KG5vZGVzLCBjYWNoZWRbaV0ubm9kZXMpXHJcblx0XHRcdFx0fVxyXG5cdFx0XHRcdC8vcmVtb3ZlIGl0ZW1zIGZyb20gdGhlIGVuZCBvZiB0aGUgYXJyYXkgaWYgdGhlIG5ldyBhcnJheSBpcyBzaG9ydGVyIHRoYW4gdGhlIG9sZCBvbmVcclxuXHRcdFx0XHQvL2lmIGVycm9ycyBldmVyIGhhcHBlbiBoZXJlLCB0aGUgaXNzdWUgaXMgbW9zdCBsaWtlbHkgYSBidWcgaW4gdGhlIGNvbnN0cnVjdGlvbiBvZiB0aGUgYGNhY2hlZGAgZGF0YSBzdHJ1Y3R1cmUgc29tZXdoZXJlIGVhcmxpZXIgaW4gdGhlIHByb2dyYW1cclxuXHRcdFx0XHRmb3IgKHZhciBpID0gMCwgbm9kZTsgbm9kZSA9IGNhY2hlZC5ub2Rlc1tpXTsgaSsrKSB7XHJcblx0XHRcdFx0XHRpZiAobm9kZS5wYXJlbnROb2RlICE9IG51bGwgJiYgbm9kZXMuaW5kZXhPZihub2RlKSA8IDApIGNsZWFyKFtub2RlXSwgW2NhY2hlZFtpXV0pXHJcblx0XHRcdFx0fVxyXG5cdFx0XHRcdGlmIChkYXRhLmxlbmd0aCA8IGNhY2hlZC5sZW5ndGgpIGNhY2hlZC5sZW5ndGggPSBkYXRhLmxlbmd0aDtcclxuXHRcdFx0XHRjYWNoZWQubm9kZXMgPSBub2Rlc1xyXG5cdFx0XHR9XHJcblx0XHR9XHJcblx0XHRlbHNlIGlmIChkYXRhICE9IG51bGwgJiYgZGF0YVR5cGUgPT09IE9CSkVDVCkge1xyXG5cdFx0XHR2YXIgdmlld3MgPSBbXSwgY29udHJvbGxlcnMgPSBbXVxyXG5cdFx0XHR3aGlsZSAoZGF0YS52aWV3KSB7XHJcblx0XHRcdFx0dmFyIHZpZXcgPSBkYXRhLnZpZXcuJG9yaWdpbmFsIHx8IGRhdGEudmlld1xyXG5cdFx0XHRcdHZhciBjb250cm9sbGVySW5kZXggPSBtLnJlZHJhdy5zdHJhdGVneSgpID09IFwiZGlmZlwiICYmIGNhY2hlZC52aWV3cyA/IGNhY2hlZC52aWV3cy5pbmRleE9mKHZpZXcpIDogLTFcclxuXHRcdFx0XHR2YXIgY29udHJvbGxlciA9IGNvbnRyb2xsZXJJbmRleCA+IC0xID8gY2FjaGVkLmNvbnRyb2xsZXJzW2NvbnRyb2xsZXJJbmRleF0gOiBuZXcgKGRhdGEuY29udHJvbGxlciB8fCBub29wKVxyXG5cdFx0XHRcdHZhciBrZXkgPSBkYXRhICYmIGRhdGEuYXR0cnMgJiYgZGF0YS5hdHRycy5rZXlcclxuXHRcdFx0XHRkYXRhID0gcGVuZGluZ1JlcXVlc3RzID09IDAgfHwgKGNhY2hlZCAmJiBjYWNoZWQuY29udHJvbGxlcnMgJiYgY2FjaGVkLmNvbnRyb2xsZXJzLmluZGV4T2YoY29udHJvbGxlcikgPiAtMSkgPyBkYXRhLnZpZXcoY29udHJvbGxlcikgOiB7dGFnOiBcInBsYWNlaG9sZGVyXCJ9XHJcblx0XHRcdFx0aWYgKGRhdGEuc3VidHJlZSA9PT0gXCJyZXRhaW5cIikgcmV0dXJuIGNhY2hlZDtcclxuXHRcdFx0XHRpZiAoa2V5KSB7XHJcblx0XHRcdFx0XHRpZiAoIWRhdGEuYXR0cnMpIGRhdGEuYXR0cnMgPSB7fVxyXG5cdFx0XHRcdFx0ZGF0YS5hdHRycy5rZXkgPSBrZXlcclxuXHRcdFx0XHR9XHJcblx0XHRcdFx0aWYgKGNvbnRyb2xsZXIub251bmxvYWQpIHVubG9hZGVycy5wdXNoKHtjb250cm9sbGVyOiBjb250cm9sbGVyLCBoYW5kbGVyOiBjb250cm9sbGVyLm9udW5sb2FkfSlcclxuXHRcdFx0XHR2aWV3cy5wdXNoKHZpZXcpXHJcblx0XHRcdFx0Y29udHJvbGxlcnMucHVzaChjb250cm9sbGVyKVxyXG5cdFx0XHR9XHJcblx0XHRcdGlmICghZGF0YS50YWcgJiYgY29udHJvbGxlcnMubGVuZ3RoKSB0aHJvdyBuZXcgRXJyb3IoXCJDb21wb25lbnQgdGVtcGxhdGUgbXVzdCByZXR1cm4gYSB2aXJ0dWFsIGVsZW1lbnQsIG5vdCBhbiBhcnJheSwgc3RyaW5nLCBldGMuXCIpXHJcblx0XHRcdGlmICghZGF0YS5hdHRycykgZGF0YS5hdHRycyA9IHt9O1xyXG5cdFx0XHRpZiAoIWNhY2hlZC5hdHRycykgY2FjaGVkLmF0dHJzID0ge307XHJcblxyXG5cdFx0XHR2YXIgZGF0YUF0dHJLZXlzID0gT2JqZWN0LmtleXMoZGF0YS5hdHRycylcclxuXHRcdFx0dmFyIGhhc0tleXMgPSBkYXRhQXR0cktleXMubGVuZ3RoID4gKFwia2V5XCIgaW4gZGF0YS5hdHRycyA/IDEgOiAwKVxyXG5cdFx0XHQvL2lmIGFuIGVsZW1lbnQgaXMgZGlmZmVyZW50IGVub3VnaCBmcm9tIHRoZSBvbmUgaW4gY2FjaGUsIHJlY3JlYXRlIGl0XHJcblx0XHRcdGlmIChkYXRhLnRhZyAhPSBjYWNoZWQudGFnIHx8IGRhdGFBdHRyS2V5cy5zb3J0KCkuam9pbigpICE9IE9iamVjdC5rZXlzKGNhY2hlZC5hdHRycykuc29ydCgpLmpvaW4oKSB8fCBkYXRhLmF0dHJzLmlkICE9IGNhY2hlZC5hdHRycy5pZCB8fCBkYXRhLmF0dHJzLmtleSAhPSBjYWNoZWQuYXR0cnMua2V5IHx8IChtLnJlZHJhdy5zdHJhdGVneSgpID09IFwiYWxsXCIgJiYgKCFjYWNoZWQuY29uZmlnQ29udGV4dCB8fCBjYWNoZWQuY29uZmlnQ29udGV4dC5yZXRhaW4gIT09IHRydWUpKSB8fCAobS5yZWRyYXcuc3RyYXRlZ3koKSA9PSBcImRpZmZcIiAmJiBjYWNoZWQuY29uZmlnQ29udGV4dCAmJiBjYWNoZWQuY29uZmlnQ29udGV4dC5yZXRhaW4gPT09IGZhbHNlKSkge1xyXG5cdFx0XHRcdGlmIChjYWNoZWQubm9kZXMubGVuZ3RoKSBjbGVhcihjYWNoZWQubm9kZXMpO1xyXG5cdFx0XHRcdGlmIChjYWNoZWQuY29uZmlnQ29udGV4dCAmJiB0eXBlb2YgY2FjaGVkLmNvbmZpZ0NvbnRleHQub251bmxvYWQgPT09IEZVTkNUSU9OKSBjYWNoZWQuY29uZmlnQ29udGV4dC5vbnVubG9hZCgpXHJcblx0XHRcdFx0aWYgKGNhY2hlZC5jb250cm9sbGVycykge1xyXG5cdFx0XHRcdFx0Zm9yICh2YXIgaSA9IDAsIGNvbnRyb2xsZXI7IGNvbnRyb2xsZXIgPSBjYWNoZWQuY29udHJvbGxlcnNbaV07IGkrKykge1xyXG5cdFx0XHRcdFx0XHRpZiAodHlwZW9mIGNvbnRyb2xsZXIub251bmxvYWQgPT09IEZVTkNUSU9OKSBjb250cm9sbGVyLm9udW5sb2FkKHtwcmV2ZW50RGVmYXVsdDogbm9vcH0pXHJcblx0XHRcdFx0XHR9XHJcblx0XHRcdFx0fVxyXG5cdFx0XHR9XHJcblx0XHRcdGlmICh0eXBlLmNhbGwoZGF0YS50YWcpICE9IFNUUklORykgcmV0dXJuO1xyXG5cclxuXHRcdFx0dmFyIG5vZGUsIGlzTmV3ID0gY2FjaGVkLm5vZGVzLmxlbmd0aCA9PT0gMDtcclxuXHRcdFx0aWYgKGRhdGEuYXR0cnMueG1sbnMpIG5hbWVzcGFjZSA9IGRhdGEuYXR0cnMueG1sbnM7XHJcblx0XHRcdGVsc2UgaWYgKGRhdGEudGFnID09PSBcInN2Z1wiKSBuYW1lc3BhY2UgPSBcImh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnXCI7XHJcblx0XHRcdGVsc2UgaWYgKGRhdGEudGFnID09PSBcIm1hdGhcIikgbmFtZXNwYWNlID0gXCJodHRwOi8vd3d3LnczLm9yZy8xOTk4L01hdGgvTWF0aE1MXCI7XHJcblx0XHRcdFxyXG5cdFx0XHRpZiAoaXNOZXcpIHtcclxuXHRcdFx0XHRpZiAoZGF0YS5hdHRycy5pcykgbm9kZSA9IG5hbWVzcGFjZSA9PT0gdW5kZWZpbmVkID8gJGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoZGF0YS50YWcsIGRhdGEuYXR0cnMuaXMpIDogJGRvY3VtZW50LmNyZWF0ZUVsZW1lbnROUyhuYW1lc3BhY2UsIGRhdGEudGFnLCBkYXRhLmF0dHJzLmlzKTtcclxuXHRcdFx0XHRlbHNlIG5vZGUgPSBuYW1lc3BhY2UgPT09IHVuZGVmaW5lZCA/ICRkb2N1bWVudC5jcmVhdGVFbGVtZW50KGRhdGEudGFnKSA6ICRkb2N1bWVudC5jcmVhdGVFbGVtZW50TlMobmFtZXNwYWNlLCBkYXRhLnRhZyk7XHJcblx0XHRcdFx0Y2FjaGVkID0ge1xyXG5cdFx0XHRcdFx0dGFnOiBkYXRhLnRhZyxcclxuXHRcdFx0XHRcdC8vc2V0IGF0dHJpYnV0ZXMgZmlyc3QsIHRoZW4gY3JlYXRlIGNoaWxkcmVuXHJcblx0XHRcdFx0XHRhdHRyczogaGFzS2V5cyA/IHNldEF0dHJpYnV0ZXMobm9kZSwgZGF0YS50YWcsIGRhdGEuYXR0cnMsIHt9LCBuYW1lc3BhY2UpIDogZGF0YS5hdHRycyxcclxuXHRcdFx0XHRcdGNoaWxkcmVuOiBkYXRhLmNoaWxkcmVuICE9IG51bGwgJiYgZGF0YS5jaGlsZHJlbi5sZW5ndGggPiAwID9cclxuXHRcdFx0XHRcdFx0YnVpbGQobm9kZSwgZGF0YS50YWcsIHVuZGVmaW5lZCwgdW5kZWZpbmVkLCBkYXRhLmNoaWxkcmVuLCBjYWNoZWQuY2hpbGRyZW4sIHRydWUsIDAsIGRhdGEuYXR0cnMuY29udGVudGVkaXRhYmxlID8gbm9kZSA6IGVkaXRhYmxlLCBuYW1lc3BhY2UsIGNvbmZpZ3MpIDpcclxuXHRcdFx0XHRcdFx0ZGF0YS5jaGlsZHJlbixcclxuXHRcdFx0XHRcdG5vZGVzOiBbbm9kZV1cclxuXHRcdFx0XHR9O1xyXG5cdFx0XHRcdGlmIChjb250cm9sbGVycy5sZW5ndGgpIHtcclxuXHRcdFx0XHRcdGNhY2hlZC52aWV3cyA9IHZpZXdzXHJcblx0XHRcdFx0XHRjYWNoZWQuY29udHJvbGxlcnMgPSBjb250cm9sbGVyc1xyXG5cdFx0XHRcdFx0Zm9yICh2YXIgaSA9IDAsIGNvbnRyb2xsZXI7IGNvbnRyb2xsZXIgPSBjb250cm9sbGVyc1tpXTsgaSsrKSB7XHJcblx0XHRcdFx0XHRcdGlmIChjb250cm9sbGVyLm9udW5sb2FkICYmIGNvbnRyb2xsZXIub251bmxvYWQuJG9sZCkgY29udHJvbGxlci5vbnVubG9hZCA9IGNvbnRyb2xsZXIub251bmxvYWQuJG9sZFxyXG5cdFx0XHRcdFx0XHRpZiAocGVuZGluZ1JlcXVlc3RzICYmIGNvbnRyb2xsZXIub251bmxvYWQpIHtcclxuXHRcdFx0XHRcdFx0XHR2YXIgb251bmxvYWQgPSBjb250cm9sbGVyLm9udW5sb2FkXHJcblx0XHRcdFx0XHRcdFx0Y29udHJvbGxlci5vbnVubG9hZCA9IG5vb3BcclxuXHRcdFx0XHRcdFx0XHRjb250cm9sbGVyLm9udW5sb2FkLiRvbGQgPSBvbnVubG9hZFxyXG5cdFx0XHRcdFx0XHR9XHJcblx0XHRcdFx0XHR9XHJcblx0XHRcdFx0fVxyXG5cdFx0XHRcdFxyXG5cdFx0XHRcdGlmIChjYWNoZWQuY2hpbGRyZW4gJiYgIWNhY2hlZC5jaGlsZHJlbi5ub2RlcykgY2FjaGVkLmNoaWxkcmVuLm5vZGVzID0gW107XHJcblx0XHRcdFx0Ly9lZGdlIGNhc2U6IHNldHRpbmcgdmFsdWUgb24gPHNlbGVjdD4gZG9lc24ndCB3b3JrIGJlZm9yZSBjaGlsZHJlbiBleGlzdCwgc28gc2V0IGl0IGFnYWluIGFmdGVyIGNoaWxkcmVuIGhhdmUgYmVlbiBjcmVhdGVkXHJcblx0XHRcdFx0aWYgKGRhdGEudGFnID09PSBcInNlbGVjdFwiICYmIFwidmFsdWVcIiBpbiBkYXRhLmF0dHJzKSBzZXRBdHRyaWJ1dGVzKG5vZGUsIGRhdGEudGFnLCB7dmFsdWU6IGRhdGEuYXR0cnMudmFsdWV9LCB7fSwgbmFtZXNwYWNlKTtcclxuXHRcdFx0XHRwYXJlbnRFbGVtZW50Lmluc2VydEJlZm9yZShub2RlLCBwYXJlbnRFbGVtZW50LmNoaWxkTm9kZXNbaW5kZXhdIHx8IG51bGwpXHJcblx0XHRcdH1cclxuXHRcdFx0ZWxzZSB7XHJcblx0XHRcdFx0bm9kZSA9IGNhY2hlZC5ub2Rlc1swXTtcclxuXHRcdFx0XHRpZiAoaGFzS2V5cykgc2V0QXR0cmlidXRlcyhub2RlLCBkYXRhLnRhZywgZGF0YS5hdHRycywgY2FjaGVkLmF0dHJzLCBuYW1lc3BhY2UpO1xyXG5cdFx0XHRcdGNhY2hlZC5jaGlsZHJlbiA9IGJ1aWxkKG5vZGUsIGRhdGEudGFnLCB1bmRlZmluZWQsIHVuZGVmaW5lZCwgZGF0YS5jaGlsZHJlbiwgY2FjaGVkLmNoaWxkcmVuLCBmYWxzZSwgMCwgZGF0YS5hdHRycy5jb250ZW50ZWRpdGFibGUgPyBub2RlIDogZWRpdGFibGUsIG5hbWVzcGFjZSwgY29uZmlncyk7XHJcblx0XHRcdFx0Y2FjaGVkLm5vZGVzLmludGFjdCA9IHRydWU7XHJcblx0XHRcdFx0aWYgKGNvbnRyb2xsZXJzLmxlbmd0aCkge1xyXG5cdFx0XHRcdFx0Y2FjaGVkLnZpZXdzID0gdmlld3NcclxuXHRcdFx0XHRcdGNhY2hlZC5jb250cm9sbGVycyA9IGNvbnRyb2xsZXJzXHJcblx0XHRcdFx0fVxyXG5cdFx0XHRcdGlmIChzaG91bGRSZWF0dGFjaCA9PT0gdHJ1ZSAmJiBub2RlICE9IG51bGwpIHBhcmVudEVsZW1lbnQuaW5zZXJ0QmVmb3JlKG5vZGUsIHBhcmVudEVsZW1lbnQuY2hpbGROb2Rlc1tpbmRleF0gfHwgbnVsbClcclxuXHRcdFx0fVxyXG5cdFx0XHQvL3NjaGVkdWxlIGNvbmZpZ3MgdG8gYmUgY2FsbGVkLiBUaGV5IGFyZSBjYWxsZWQgYWZ0ZXIgYGJ1aWxkYCBmaW5pc2hlcyBydW5uaW5nXHJcblx0XHRcdGlmICh0eXBlb2YgZGF0YS5hdHRyc1tcImNvbmZpZ1wiXSA9PT0gRlVOQ1RJT04pIHtcclxuXHRcdFx0XHR2YXIgY29udGV4dCA9IGNhY2hlZC5jb25maWdDb250ZXh0ID0gY2FjaGVkLmNvbmZpZ0NvbnRleHQgfHwge307XHJcblxyXG5cdFx0XHRcdC8vIGJpbmRcclxuXHRcdFx0XHR2YXIgY2FsbGJhY2sgPSBmdW5jdGlvbihkYXRhLCBhcmdzKSB7XHJcblx0XHRcdFx0XHRyZXR1cm4gZnVuY3Rpb24oKSB7XHJcblx0XHRcdFx0XHRcdHJldHVybiBkYXRhLmF0dHJzW1wiY29uZmlnXCJdLmFwcGx5KGRhdGEsIGFyZ3MpXHJcblx0XHRcdFx0XHR9XHJcblx0XHRcdFx0fTtcclxuXHRcdFx0XHRjb25maWdzLnB1c2goY2FsbGJhY2soZGF0YSwgW25vZGUsICFpc05ldywgY29udGV4dCwgY2FjaGVkXSkpXHJcblx0XHRcdH1cclxuXHRcdH1cclxuXHRcdGVsc2UgaWYgKHR5cGVvZiBkYXRhICE9IEZVTkNUSU9OKSB7XHJcblx0XHRcdC8vaGFuZGxlIHRleHQgbm9kZXNcclxuXHRcdFx0dmFyIG5vZGVzO1xyXG5cdFx0XHRpZiAoY2FjaGVkLm5vZGVzLmxlbmd0aCA9PT0gMCkge1xyXG5cdFx0XHRcdGlmIChkYXRhLiR0cnVzdGVkKSB7XHJcblx0XHRcdFx0XHRub2RlcyA9IGluamVjdEhUTUwocGFyZW50RWxlbWVudCwgaW5kZXgsIGRhdGEpXHJcblx0XHRcdFx0fVxyXG5cdFx0XHRcdGVsc2Uge1xyXG5cdFx0XHRcdFx0bm9kZXMgPSBbJGRvY3VtZW50LmNyZWF0ZVRleHROb2RlKGRhdGEpXTtcclxuXHRcdFx0XHRcdGlmICghcGFyZW50RWxlbWVudC5ub2RlTmFtZS5tYXRjaCh2b2lkRWxlbWVudHMpKSBwYXJlbnRFbGVtZW50Lmluc2VydEJlZm9yZShub2Rlc1swXSwgcGFyZW50RWxlbWVudC5jaGlsZE5vZGVzW2luZGV4XSB8fCBudWxsKVxyXG5cdFx0XHRcdH1cclxuXHRcdFx0XHRjYWNoZWQgPSBcInN0cmluZyBudW1iZXIgYm9vbGVhblwiLmluZGV4T2YodHlwZW9mIGRhdGEpID4gLTEgPyBuZXcgZGF0YS5jb25zdHJ1Y3RvcihkYXRhKSA6IGRhdGE7XHJcblx0XHRcdFx0Y2FjaGVkLm5vZGVzID0gbm9kZXNcclxuXHRcdFx0fVxyXG5cdFx0XHRlbHNlIGlmIChjYWNoZWQudmFsdWVPZigpICE9PSBkYXRhLnZhbHVlT2YoKSB8fCBzaG91bGRSZWF0dGFjaCA9PT0gdHJ1ZSkge1xyXG5cdFx0XHRcdG5vZGVzID0gY2FjaGVkLm5vZGVzO1xyXG5cdFx0XHRcdGlmICghZWRpdGFibGUgfHwgZWRpdGFibGUgIT09ICRkb2N1bWVudC5hY3RpdmVFbGVtZW50KSB7XHJcblx0XHRcdFx0XHRpZiAoZGF0YS4kdHJ1c3RlZCkge1xyXG5cdFx0XHRcdFx0XHRjbGVhcihub2RlcywgY2FjaGVkKTtcclxuXHRcdFx0XHRcdFx0bm9kZXMgPSBpbmplY3RIVE1MKHBhcmVudEVsZW1lbnQsIGluZGV4LCBkYXRhKVxyXG5cdFx0XHRcdFx0fVxyXG5cdFx0XHRcdFx0ZWxzZSB7XHJcblx0XHRcdFx0XHRcdC8vY29ybmVyIGNhc2U6IHJlcGxhY2luZyB0aGUgbm9kZVZhbHVlIG9mIGEgdGV4dCBub2RlIHRoYXQgaXMgYSBjaGlsZCBvZiBhIHRleHRhcmVhL2NvbnRlbnRlZGl0YWJsZSBkb2Vzbid0IHdvcmtcclxuXHRcdFx0XHRcdFx0Ly93ZSBuZWVkIHRvIHVwZGF0ZSB0aGUgdmFsdWUgcHJvcGVydHkgb2YgdGhlIHBhcmVudCB0ZXh0YXJlYSBvciB0aGUgaW5uZXJIVE1MIG9mIHRoZSBjb250ZW50ZWRpdGFibGUgZWxlbWVudCBpbnN0ZWFkXHJcblx0XHRcdFx0XHRcdGlmIChwYXJlbnRUYWcgPT09IFwidGV4dGFyZWFcIikgcGFyZW50RWxlbWVudC52YWx1ZSA9IGRhdGE7XHJcblx0XHRcdFx0XHRcdGVsc2UgaWYgKGVkaXRhYmxlKSBlZGl0YWJsZS5pbm5lckhUTUwgPSBkYXRhO1xyXG5cdFx0XHRcdFx0XHRlbHNlIHtcclxuXHRcdFx0XHRcdFx0XHRpZiAobm9kZXNbMF0ubm9kZVR5cGUgPT09IDEgfHwgbm9kZXMubGVuZ3RoID4gMSkgeyAvL3dhcyBhIHRydXN0ZWQgc3RyaW5nXHJcblx0XHRcdFx0XHRcdFx0XHRjbGVhcihjYWNoZWQubm9kZXMsIGNhY2hlZCk7XHJcblx0XHRcdFx0XHRcdFx0XHRub2RlcyA9IFskZG9jdW1lbnQuY3JlYXRlVGV4dE5vZGUoZGF0YSldXHJcblx0XHRcdFx0XHRcdFx0fVxyXG5cdFx0XHRcdFx0XHRcdHBhcmVudEVsZW1lbnQuaW5zZXJ0QmVmb3JlKG5vZGVzWzBdLCBwYXJlbnRFbGVtZW50LmNoaWxkTm9kZXNbaW5kZXhdIHx8IG51bGwpO1xyXG5cdFx0XHRcdFx0XHRcdG5vZGVzWzBdLm5vZGVWYWx1ZSA9IGRhdGFcclxuXHRcdFx0XHRcdFx0fVxyXG5cdFx0XHRcdFx0fVxyXG5cdFx0XHRcdH1cclxuXHRcdFx0XHRjYWNoZWQgPSBuZXcgZGF0YS5jb25zdHJ1Y3RvcihkYXRhKTtcclxuXHRcdFx0XHRjYWNoZWQubm9kZXMgPSBub2Rlc1xyXG5cdFx0XHR9XHJcblx0XHRcdGVsc2UgY2FjaGVkLm5vZGVzLmludGFjdCA9IHRydWVcclxuXHRcdH1cclxuXHJcblx0XHRyZXR1cm4gY2FjaGVkXHJcblx0fVxyXG5cdGZ1bmN0aW9uIHNvcnRDaGFuZ2VzKGEsIGIpIHtyZXR1cm4gYS5hY3Rpb24gLSBiLmFjdGlvbiB8fCBhLmluZGV4IC0gYi5pbmRleH1cclxuXHRmdW5jdGlvbiBzZXRBdHRyaWJ1dGVzKG5vZGUsIHRhZywgZGF0YUF0dHJzLCBjYWNoZWRBdHRycywgbmFtZXNwYWNlKSB7XHJcblx0XHRmb3IgKHZhciBhdHRyTmFtZSBpbiBkYXRhQXR0cnMpIHtcclxuXHRcdFx0dmFyIGRhdGFBdHRyID0gZGF0YUF0dHJzW2F0dHJOYW1lXTtcclxuXHRcdFx0dmFyIGNhY2hlZEF0dHIgPSBjYWNoZWRBdHRyc1thdHRyTmFtZV07XHJcblx0XHRcdGlmICghKGF0dHJOYW1lIGluIGNhY2hlZEF0dHJzKSB8fCAoY2FjaGVkQXR0ciAhPT0gZGF0YUF0dHIpKSB7XHJcblx0XHRcdFx0Y2FjaGVkQXR0cnNbYXR0ck5hbWVdID0gZGF0YUF0dHI7XHJcblx0XHRcdFx0dHJ5IHtcclxuXHRcdFx0XHRcdC8vYGNvbmZpZ2AgaXNuJ3QgYSByZWFsIGF0dHJpYnV0ZXMsIHNvIGlnbm9yZSBpdFxyXG5cdFx0XHRcdFx0aWYgKGF0dHJOYW1lID09PSBcImNvbmZpZ1wiIHx8IGF0dHJOYW1lID09IFwia2V5XCIpIGNvbnRpbnVlO1xyXG5cdFx0XHRcdFx0Ly9ob29rIGV2ZW50IGhhbmRsZXJzIHRvIHRoZSBhdXRvLXJlZHJhd2luZyBzeXN0ZW1cclxuXHRcdFx0XHRcdGVsc2UgaWYgKHR5cGVvZiBkYXRhQXR0ciA9PT0gRlVOQ1RJT04gJiYgYXR0ck5hbWUuaW5kZXhPZihcIm9uXCIpID09PSAwKSB7XHJcblx0XHRcdFx0XHRcdG5vZGVbYXR0ck5hbWVdID0gYXV0b3JlZHJhdyhkYXRhQXR0ciwgbm9kZSlcclxuXHRcdFx0XHRcdH1cclxuXHRcdFx0XHRcdC8vaGFuZGxlIGBzdHlsZTogey4uLn1gXHJcblx0XHRcdFx0XHRlbHNlIGlmIChhdHRyTmFtZSA9PT0gXCJzdHlsZVwiICYmIGRhdGFBdHRyICE9IG51bGwgJiYgdHlwZS5jYWxsKGRhdGFBdHRyKSA9PT0gT0JKRUNUKSB7XHJcblx0XHRcdFx0XHRcdGZvciAodmFyIHJ1bGUgaW4gZGF0YUF0dHIpIHtcclxuXHRcdFx0XHRcdFx0XHRpZiAoY2FjaGVkQXR0ciA9PSBudWxsIHx8IGNhY2hlZEF0dHJbcnVsZV0gIT09IGRhdGFBdHRyW3J1bGVdKSBub2RlLnN0eWxlW3J1bGVdID0gZGF0YUF0dHJbcnVsZV1cclxuXHRcdFx0XHRcdFx0fVxyXG5cdFx0XHRcdFx0XHRmb3IgKHZhciBydWxlIGluIGNhY2hlZEF0dHIpIHtcclxuXHRcdFx0XHRcdFx0XHRpZiAoIShydWxlIGluIGRhdGFBdHRyKSkgbm9kZS5zdHlsZVtydWxlXSA9IFwiXCJcclxuXHRcdFx0XHRcdFx0fVxyXG5cdFx0XHRcdFx0fVxyXG5cdFx0XHRcdFx0Ly9oYW5kbGUgU1ZHXHJcblx0XHRcdFx0XHRlbHNlIGlmIChuYW1lc3BhY2UgIT0gbnVsbCkge1xyXG5cdFx0XHRcdFx0XHRpZiAoYXR0ck5hbWUgPT09IFwiaHJlZlwiKSBub2RlLnNldEF0dHJpYnV0ZU5TKFwiaHR0cDovL3d3dy53My5vcmcvMTk5OS94bGlua1wiLCBcImhyZWZcIiwgZGF0YUF0dHIpO1xyXG5cdFx0XHRcdFx0XHRlbHNlIGlmIChhdHRyTmFtZSA9PT0gXCJjbGFzc05hbWVcIikgbm9kZS5zZXRBdHRyaWJ1dGUoXCJjbGFzc1wiLCBkYXRhQXR0cik7XHJcblx0XHRcdFx0XHRcdGVsc2Ugbm9kZS5zZXRBdHRyaWJ1dGUoYXR0ck5hbWUsIGRhdGFBdHRyKVxyXG5cdFx0XHRcdFx0fVxyXG5cdFx0XHRcdFx0Ly9oYW5kbGUgY2FzZXMgdGhhdCBhcmUgcHJvcGVydGllcyAoYnV0IGlnbm9yZSBjYXNlcyB3aGVyZSB3ZSBzaG91bGQgdXNlIHNldEF0dHJpYnV0ZSBpbnN0ZWFkKVxyXG5cdFx0XHRcdFx0Ly8tIGxpc3QgYW5kIGZvcm0gYXJlIHR5cGljYWxseSB1c2VkIGFzIHN0cmluZ3MsIGJ1dCBhcmUgRE9NIGVsZW1lbnQgcmVmZXJlbmNlcyBpbiBqc1xyXG5cdFx0XHRcdFx0Ly8tIHdoZW4gdXNpbmcgQ1NTIHNlbGVjdG9ycyAoZS5nLiBgbShcIltzdHlsZT0nJ11cIilgKSwgc3R5bGUgaXMgdXNlZCBhcyBhIHN0cmluZywgYnV0IGl0J3MgYW4gb2JqZWN0IGluIGpzXHJcblx0XHRcdFx0XHRlbHNlIGlmIChhdHRyTmFtZSBpbiBub2RlICYmICEoYXR0ck5hbWUgPT09IFwibGlzdFwiIHx8IGF0dHJOYW1lID09PSBcInN0eWxlXCIgfHwgYXR0ck5hbWUgPT09IFwiZm9ybVwiIHx8IGF0dHJOYW1lID09PSBcInR5cGVcIiB8fCBhdHRyTmFtZSA9PT0gXCJ3aWR0aFwiIHx8IGF0dHJOYW1lID09PSBcImhlaWdodFwiKSkge1xyXG5cdFx0XHRcdFx0XHQvLyMzNDggZG9uJ3Qgc2V0IHRoZSB2YWx1ZSBpZiBub3QgbmVlZGVkIG90aGVyd2lzZSBjdXJzb3IgcGxhY2VtZW50IGJyZWFrcyBpbiBDaHJvbWVcclxuXHRcdFx0XHRcdFx0aWYgKHRhZyAhPT0gXCJpbnB1dFwiIHx8IG5vZGVbYXR0ck5hbWVdICE9PSBkYXRhQXR0cikgbm9kZVthdHRyTmFtZV0gPSBkYXRhQXR0clxyXG5cdFx0XHRcdFx0fVxyXG5cdFx0XHRcdFx0ZWxzZSBub2RlLnNldEF0dHJpYnV0ZShhdHRyTmFtZSwgZGF0YUF0dHIpXHJcblx0XHRcdFx0fVxyXG5cdFx0XHRcdGNhdGNoIChlKSB7XHJcblx0XHRcdFx0XHQvL3N3YWxsb3cgSUUncyBpbnZhbGlkIGFyZ3VtZW50IGVycm9ycyB0byBtaW1pYyBIVE1MJ3MgZmFsbGJhY2stdG8tZG9pbmctbm90aGluZy1vbi1pbnZhbGlkLWF0dHJpYnV0ZXMgYmVoYXZpb3JcclxuXHRcdFx0XHRcdGlmIChlLm1lc3NhZ2UuaW5kZXhPZihcIkludmFsaWQgYXJndW1lbnRcIikgPCAwKSB0aHJvdyBlXHJcblx0XHRcdFx0fVxyXG5cdFx0XHR9XHJcblx0XHRcdC8vIzM0OCBkYXRhQXR0ciBtYXkgbm90IGJlIGEgc3RyaW5nLCBzbyB1c2UgbG9vc2UgY29tcGFyaXNvbiAoZG91YmxlIGVxdWFsKSBpbnN0ZWFkIG9mIHN0cmljdCAodHJpcGxlIGVxdWFsKVxyXG5cdFx0XHRlbHNlIGlmIChhdHRyTmFtZSA9PT0gXCJ2YWx1ZVwiICYmIHRhZyA9PT0gXCJpbnB1dFwiICYmIG5vZGUudmFsdWUgIT0gZGF0YUF0dHIpIHtcclxuXHRcdFx0XHRub2RlLnZhbHVlID0gZGF0YUF0dHJcclxuXHRcdFx0fVxyXG5cdFx0fVxyXG5cdFx0cmV0dXJuIGNhY2hlZEF0dHJzXHJcblx0fVxyXG5cdGZ1bmN0aW9uIGNsZWFyKG5vZGVzLCBjYWNoZWQpIHtcclxuXHRcdGZvciAodmFyIGkgPSBub2Rlcy5sZW5ndGggLSAxOyBpID4gLTE7IGktLSkge1xyXG5cdFx0XHRpZiAobm9kZXNbaV0gJiYgbm9kZXNbaV0ucGFyZW50Tm9kZSkge1xyXG5cdFx0XHRcdHRyeSB7bm9kZXNbaV0ucGFyZW50Tm9kZS5yZW1vdmVDaGlsZChub2Rlc1tpXSl9XHJcblx0XHRcdFx0Y2F0Y2ggKGUpIHt9IC8vaWdub3JlIGlmIHRoaXMgZmFpbHMgZHVlIHRvIG9yZGVyIG9mIGV2ZW50cyAoc2VlIGh0dHA6Ly9zdGFja292ZXJmbG93LmNvbS9xdWVzdGlvbnMvMjE5MjYwODMvZmFpbGVkLXRvLWV4ZWN1dGUtcmVtb3ZlY2hpbGQtb24tbm9kZSlcclxuXHRcdFx0XHRjYWNoZWQgPSBbXS5jb25jYXQoY2FjaGVkKTtcclxuXHRcdFx0XHRpZiAoY2FjaGVkW2ldKSB1bmxvYWQoY2FjaGVkW2ldKVxyXG5cdFx0XHR9XHJcblx0XHR9XHJcblx0XHRpZiAobm9kZXMubGVuZ3RoICE9IDApIG5vZGVzLmxlbmd0aCA9IDBcclxuXHR9XHJcblx0ZnVuY3Rpb24gdW5sb2FkKGNhY2hlZCkge1xyXG5cdFx0aWYgKGNhY2hlZC5jb25maWdDb250ZXh0ICYmIHR5cGVvZiBjYWNoZWQuY29uZmlnQ29udGV4dC5vbnVubG9hZCA9PT0gRlVOQ1RJT04pIHtcclxuXHRcdFx0Y2FjaGVkLmNvbmZpZ0NvbnRleHQub251bmxvYWQoKTtcclxuXHRcdFx0Y2FjaGVkLmNvbmZpZ0NvbnRleHQub251bmxvYWQgPSBudWxsXHJcblx0XHR9XHJcblx0XHRpZiAoY2FjaGVkLmNvbnRyb2xsZXJzKSB7XHJcblx0XHRcdGZvciAodmFyIGkgPSAwLCBjb250cm9sbGVyOyBjb250cm9sbGVyID0gY2FjaGVkLmNvbnRyb2xsZXJzW2ldOyBpKyspIHtcclxuXHRcdFx0XHRpZiAodHlwZW9mIGNvbnRyb2xsZXIub251bmxvYWQgPT09IEZVTkNUSU9OKSBjb250cm9sbGVyLm9udW5sb2FkKHtwcmV2ZW50RGVmYXVsdDogbm9vcH0pO1xyXG5cdFx0XHR9XHJcblx0XHR9XHJcblx0XHRpZiAoY2FjaGVkLmNoaWxkcmVuKSB7XHJcblx0XHRcdGlmICh0eXBlLmNhbGwoY2FjaGVkLmNoaWxkcmVuKSA9PT0gQVJSQVkpIHtcclxuXHRcdFx0XHRmb3IgKHZhciBpID0gMCwgY2hpbGQ7IGNoaWxkID0gY2FjaGVkLmNoaWxkcmVuW2ldOyBpKyspIHVubG9hZChjaGlsZClcclxuXHRcdFx0fVxyXG5cdFx0XHRlbHNlIGlmIChjYWNoZWQuY2hpbGRyZW4udGFnKSB1bmxvYWQoY2FjaGVkLmNoaWxkcmVuKVxyXG5cdFx0fVxyXG5cdH1cclxuXHRmdW5jdGlvbiBpbmplY3RIVE1MKHBhcmVudEVsZW1lbnQsIGluZGV4LCBkYXRhKSB7XHJcblx0XHR2YXIgbmV4dFNpYmxpbmcgPSBwYXJlbnRFbGVtZW50LmNoaWxkTm9kZXNbaW5kZXhdO1xyXG5cdFx0aWYgKG5leHRTaWJsaW5nKSB7XHJcblx0XHRcdHZhciBpc0VsZW1lbnQgPSBuZXh0U2libGluZy5ub2RlVHlwZSAhPSAxO1xyXG5cdFx0XHR2YXIgcGxhY2Vob2xkZXIgPSAkZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcInNwYW5cIik7XHJcblx0XHRcdGlmIChpc0VsZW1lbnQpIHtcclxuXHRcdFx0XHRwYXJlbnRFbGVtZW50Lmluc2VydEJlZm9yZShwbGFjZWhvbGRlciwgbmV4dFNpYmxpbmcgfHwgbnVsbCk7XHJcblx0XHRcdFx0cGxhY2Vob2xkZXIuaW5zZXJ0QWRqYWNlbnRIVE1MKFwiYmVmb3JlYmVnaW5cIiwgZGF0YSk7XHJcblx0XHRcdFx0cGFyZW50RWxlbWVudC5yZW1vdmVDaGlsZChwbGFjZWhvbGRlcilcclxuXHRcdFx0fVxyXG5cdFx0XHRlbHNlIG5leHRTaWJsaW5nLmluc2VydEFkamFjZW50SFRNTChcImJlZm9yZWJlZ2luXCIsIGRhdGEpXHJcblx0XHR9XHJcblx0XHRlbHNlIHBhcmVudEVsZW1lbnQuaW5zZXJ0QWRqYWNlbnRIVE1MKFwiYmVmb3JlZW5kXCIsIGRhdGEpO1xyXG5cdFx0dmFyIG5vZGVzID0gW107XHJcblx0XHR3aGlsZSAocGFyZW50RWxlbWVudC5jaGlsZE5vZGVzW2luZGV4XSAhPT0gbmV4dFNpYmxpbmcpIHtcclxuXHRcdFx0bm9kZXMucHVzaChwYXJlbnRFbGVtZW50LmNoaWxkTm9kZXNbaW5kZXhdKTtcclxuXHRcdFx0aW5kZXgrK1xyXG5cdFx0fVxyXG5cdFx0cmV0dXJuIG5vZGVzXHJcblx0fVxyXG5cdGZ1bmN0aW9uIGF1dG9yZWRyYXcoY2FsbGJhY2ssIG9iamVjdCkge1xyXG5cdFx0cmV0dXJuIGZ1bmN0aW9uKGUpIHtcclxuXHRcdFx0ZSA9IGUgfHwgZXZlbnQ7XHJcblx0XHRcdG0ucmVkcmF3LnN0cmF0ZWd5KFwiZGlmZlwiKTtcclxuXHRcdFx0bS5zdGFydENvbXB1dGF0aW9uKCk7XHJcblx0XHRcdHRyeSB7cmV0dXJuIGNhbGxiYWNrLmNhbGwob2JqZWN0LCBlKX1cclxuXHRcdFx0ZmluYWxseSB7XHJcblx0XHRcdFx0ZW5kRmlyc3RDb21wdXRhdGlvbigpXHJcblx0XHRcdH1cclxuXHRcdH1cclxuXHR9XHJcblxyXG5cdHZhciBodG1sO1xyXG5cdHZhciBkb2N1bWVudE5vZGUgPSB7XHJcblx0XHRhcHBlbmRDaGlsZDogZnVuY3Rpb24obm9kZSkge1xyXG5cdFx0XHRpZiAoaHRtbCA9PT0gdW5kZWZpbmVkKSBodG1sID0gJGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJodG1sXCIpO1xyXG5cdFx0XHRpZiAoJGRvY3VtZW50LmRvY3VtZW50RWxlbWVudCAmJiAkZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50ICE9PSBub2RlKSB7XHJcblx0XHRcdFx0JGRvY3VtZW50LnJlcGxhY2VDaGlsZChub2RlLCAkZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50KVxyXG5cdFx0XHR9XHJcblx0XHRcdGVsc2UgJGRvY3VtZW50LmFwcGVuZENoaWxkKG5vZGUpO1xyXG5cdFx0XHR0aGlzLmNoaWxkTm9kZXMgPSAkZG9jdW1lbnQuY2hpbGROb2Rlc1xyXG5cdFx0fSxcclxuXHRcdGluc2VydEJlZm9yZTogZnVuY3Rpb24obm9kZSkge1xyXG5cdFx0XHR0aGlzLmFwcGVuZENoaWxkKG5vZGUpXHJcblx0XHR9LFxyXG5cdFx0Y2hpbGROb2RlczogW11cclxuXHR9O1xyXG5cdHZhciBub2RlQ2FjaGUgPSBbXSwgY2VsbENhY2hlID0ge307XHJcblx0bS5yZW5kZXIgPSBmdW5jdGlvbihyb290LCBjZWxsLCBmb3JjZVJlY3JlYXRpb24pIHtcclxuXHRcdHZhciBjb25maWdzID0gW107XHJcblx0XHRpZiAoIXJvb3QpIHRocm93IG5ldyBFcnJvcihcIkVuc3VyZSB0aGUgRE9NIGVsZW1lbnQgYmVpbmcgcGFzc2VkIHRvIG0ucm91dGUvbS5tb3VudC9tLnJlbmRlciBpcyBub3QgdW5kZWZpbmVkLlwiKTtcclxuXHRcdHZhciBpZCA9IGdldENlbGxDYWNoZUtleShyb290KTtcclxuXHRcdHZhciBpc0RvY3VtZW50Um9vdCA9IHJvb3QgPT09ICRkb2N1bWVudDtcclxuXHRcdHZhciBub2RlID0gaXNEb2N1bWVudFJvb3QgfHwgcm9vdCA9PT0gJGRvY3VtZW50LmRvY3VtZW50RWxlbWVudCA/IGRvY3VtZW50Tm9kZSA6IHJvb3Q7XHJcblx0XHRpZiAoaXNEb2N1bWVudFJvb3QgJiYgY2VsbC50YWcgIT0gXCJodG1sXCIpIGNlbGwgPSB7dGFnOiBcImh0bWxcIiwgYXR0cnM6IHt9LCBjaGlsZHJlbjogY2VsbH07XHJcblx0XHRpZiAoY2VsbENhY2hlW2lkXSA9PT0gdW5kZWZpbmVkKSBjbGVhcihub2RlLmNoaWxkTm9kZXMpO1xyXG5cdFx0aWYgKGZvcmNlUmVjcmVhdGlvbiA9PT0gdHJ1ZSkgcmVzZXQocm9vdCk7XHJcblx0XHRjZWxsQ2FjaGVbaWRdID0gYnVpbGQobm9kZSwgbnVsbCwgdW5kZWZpbmVkLCB1bmRlZmluZWQsIGNlbGwsIGNlbGxDYWNoZVtpZF0sIGZhbHNlLCAwLCBudWxsLCB1bmRlZmluZWQsIGNvbmZpZ3MpO1xyXG5cdFx0Zm9yICh2YXIgaSA9IDAsIGxlbiA9IGNvbmZpZ3MubGVuZ3RoOyBpIDwgbGVuOyBpKyspIGNvbmZpZ3NbaV0oKVxyXG5cdH07XHJcblx0ZnVuY3Rpb24gZ2V0Q2VsbENhY2hlS2V5KGVsZW1lbnQpIHtcclxuXHRcdHZhciBpbmRleCA9IG5vZGVDYWNoZS5pbmRleE9mKGVsZW1lbnQpO1xyXG5cdFx0cmV0dXJuIGluZGV4IDwgMCA/IG5vZGVDYWNoZS5wdXNoKGVsZW1lbnQpIC0gMSA6IGluZGV4XHJcblx0fVxyXG5cclxuXHRtLnRydXN0ID0gZnVuY3Rpb24odmFsdWUpIHtcclxuXHRcdHZhbHVlID0gbmV3IFN0cmluZyh2YWx1ZSk7XHJcblx0XHR2YWx1ZS4kdHJ1c3RlZCA9IHRydWU7XHJcblx0XHRyZXR1cm4gdmFsdWVcclxuXHR9O1xyXG5cclxuXHRmdW5jdGlvbiBnZXR0ZXJzZXR0ZXIoc3RvcmUpIHtcclxuXHRcdHZhciBwcm9wID0gZnVuY3Rpb24oKSB7XHJcblx0XHRcdGlmIChhcmd1bWVudHMubGVuZ3RoKSBzdG9yZSA9IGFyZ3VtZW50c1swXTtcclxuXHRcdFx0cmV0dXJuIHN0b3JlXHJcblx0XHR9O1xyXG5cclxuXHRcdHByb3AudG9KU09OID0gZnVuY3Rpb24oKSB7XHJcblx0XHRcdHJldHVybiBzdG9yZVxyXG5cdFx0fTtcclxuXHJcblx0XHRyZXR1cm4gcHJvcFxyXG5cdH1cclxuXHJcblx0bS5wcm9wID0gZnVuY3Rpb24gKHN0b3JlKSB7XHJcblx0XHQvL25vdGU6IHVzaW5nIG5vbi1zdHJpY3QgZXF1YWxpdHkgY2hlY2sgaGVyZSBiZWNhdXNlIHdlJ3JlIGNoZWNraW5nIGlmIHN0b3JlIGlzIG51bGwgT1IgdW5kZWZpbmVkXHJcblx0XHRpZiAoKChzdG9yZSAhPSBudWxsICYmIHR5cGUuY2FsbChzdG9yZSkgPT09IE9CSkVDVCkgfHwgdHlwZW9mIHN0b3JlID09PSBGVU5DVElPTikgJiYgdHlwZW9mIHN0b3JlLnRoZW4gPT09IEZVTkNUSU9OKSB7XHJcblx0XHRcdHJldHVybiBwcm9waWZ5KHN0b3JlKVxyXG5cdFx0fVxyXG5cclxuXHRcdHJldHVybiBnZXR0ZXJzZXR0ZXIoc3RvcmUpXHJcblx0fTtcclxuXHJcblx0dmFyIHJvb3RzID0gW10sIGNvbXBvbmVudHMgPSBbXSwgY29udHJvbGxlcnMgPSBbXSwgbGFzdFJlZHJhd0lkID0gbnVsbCwgbGFzdFJlZHJhd0NhbGxUaW1lID0gMCwgY29tcHV0ZVByZVJlZHJhd0hvb2sgPSBudWxsLCBjb21wdXRlUG9zdFJlZHJhd0hvb2sgPSBudWxsLCBwcmV2ZW50ZWQgPSBmYWxzZSwgdG9wQ29tcG9uZW50LCB1bmxvYWRlcnMgPSBbXTtcclxuXHR2YXIgRlJBTUVfQlVER0VUID0gMTY7IC8vNjAgZnJhbWVzIHBlciBzZWNvbmQgPSAxIGNhbGwgcGVyIDE2IG1zXHJcblx0ZnVuY3Rpb24gcGFyYW1ldGVyaXplKGNvbXBvbmVudCwgYXJncykge1xyXG5cdFx0dmFyIGNvbnRyb2xsZXIgPSBmdW5jdGlvbigpIHtcclxuXHRcdFx0cmV0dXJuIChjb21wb25lbnQuY29udHJvbGxlciB8fCBub29wKS5hcHBseSh0aGlzLCBhcmdzKSB8fCB0aGlzXHJcblx0XHR9XHJcblx0XHR2YXIgdmlldyA9IGZ1bmN0aW9uKGN0cmwpIHtcclxuXHRcdFx0aWYgKGFyZ3VtZW50cy5sZW5ndGggPiAxKSBhcmdzID0gYXJncy5jb25jYXQoW10uc2xpY2UuY2FsbChhcmd1bWVudHMsIDEpKVxyXG5cdFx0XHRyZXR1cm4gY29tcG9uZW50LnZpZXcuYXBwbHkoY29tcG9uZW50LCBhcmdzID8gW2N0cmxdLmNvbmNhdChhcmdzKSA6IFtjdHJsXSlcclxuXHRcdH1cclxuXHRcdHZpZXcuJG9yaWdpbmFsID0gY29tcG9uZW50LnZpZXdcclxuXHRcdHZhciBvdXRwdXQgPSB7Y29udHJvbGxlcjogY29udHJvbGxlciwgdmlldzogdmlld31cclxuXHRcdGlmIChhcmdzWzBdICYmIGFyZ3NbMF0ua2V5ICE9IG51bGwpIG91dHB1dC5hdHRycyA9IHtrZXk6IGFyZ3NbMF0ua2V5fVxyXG5cdFx0cmV0dXJuIG91dHB1dFxyXG5cdH1cclxuXHRtLmNvbXBvbmVudCA9IGZ1bmN0aW9uKGNvbXBvbmVudCkge1xyXG5cdFx0cmV0dXJuIHBhcmFtZXRlcml6ZShjb21wb25lbnQsIFtdLnNsaWNlLmNhbGwoYXJndW1lbnRzLCAxKSlcclxuXHR9XHJcblx0bS5tb3VudCA9IG0ubW9kdWxlID0gZnVuY3Rpb24ocm9vdCwgY29tcG9uZW50KSB7XHJcblx0XHRpZiAoIXJvb3QpIHRocm93IG5ldyBFcnJvcihcIlBsZWFzZSBlbnN1cmUgdGhlIERPTSBlbGVtZW50IGV4aXN0cyBiZWZvcmUgcmVuZGVyaW5nIGEgdGVtcGxhdGUgaW50byBpdC5cIik7XHJcblx0XHR2YXIgaW5kZXggPSByb290cy5pbmRleE9mKHJvb3QpO1xyXG5cdFx0aWYgKGluZGV4IDwgMCkgaW5kZXggPSByb290cy5sZW5ndGg7XHJcblx0XHRcclxuXHRcdHZhciBpc1ByZXZlbnRlZCA9IGZhbHNlO1xyXG5cdFx0dmFyIGV2ZW50ID0ge3ByZXZlbnREZWZhdWx0OiBmdW5jdGlvbigpIHtcclxuXHRcdFx0aXNQcmV2ZW50ZWQgPSB0cnVlO1xyXG5cdFx0XHRjb21wdXRlUHJlUmVkcmF3SG9vayA9IGNvbXB1dGVQb3N0UmVkcmF3SG9vayA9IG51bGw7XHJcblx0XHR9fTtcclxuXHRcdGZvciAodmFyIGkgPSAwLCB1bmxvYWRlcjsgdW5sb2FkZXIgPSB1bmxvYWRlcnNbaV07IGkrKykge1xyXG5cdFx0XHR1bmxvYWRlci5oYW5kbGVyLmNhbGwodW5sb2FkZXIuY29udHJvbGxlciwgZXZlbnQpXHJcblx0XHRcdHVubG9hZGVyLmNvbnRyb2xsZXIub251bmxvYWQgPSBudWxsXHJcblx0XHR9XHJcblx0XHRpZiAoaXNQcmV2ZW50ZWQpIHtcclxuXHRcdFx0Zm9yICh2YXIgaSA9IDAsIHVubG9hZGVyOyB1bmxvYWRlciA9IHVubG9hZGVyc1tpXTsgaSsrKSB1bmxvYWRlci5jb250cm9sbGVyLm9udW5sb2FkID0gdW5sb2FkZXIuaGFuZGxlclxyXG5cdFx0fVxyXG5cdFx0ZWxzZSB1bmxvYWRlcnMgPSBbXVxyXG5cdFx0XHJcblx0XHRpZiAoY29udHJvbGxlcnNbaW5kZXhdICYmIHR5cGVvZiBjb250cm9sbGVyc1tpbmRleF0ub251bmxvYWQgPT09IEZVTkNUSU9OKSB7XHJcblx0XHRcdGNvbnRyb2xsZXJzW2luZGV4XS5vbnVubG9hZChldmVudClcclxuXHRcdH1cclxuXHRcdFxyXG5cdFx0aWYgKCFpc1ByZXZlbnRlZCkge1xyXG5cdFx0XHRtLnJlZHJhdy5zdHJhdGVneShcImFsbFwiKTtcclxuXHRcdFx0bS5zdGFydENvbXB1dGF0aW9uKCk7XHJcblx0XHRcdHJvb3RzW2luZGV4XSA9IHJvb3Q7XHJcblx0XHRcdGlmIChhcmd1bWVudHMubGVuZ3RoID4gMikgY29tcG9uZW50ID0gc3ViY29tcG9uZW50KGNvbXBvbmVudCwgW10uc2xpY2UuY2FsbChhcmd1bWVudHMsIDIpKVxyXG5cdFx0XHR2YXIgY3VycmVudENvbXBvbmVudCA9IHRvcENvbXBvbmVudCA9IGNvbXBvbmVudCA9IGNvbXBvbmVudCB8fCB7Y29udHJvbGxlcjogZnVuY3Rpb24oKSB7fX07XHJcblx0XHRcdHZhciBjb25zdHJ1Y3RvciA9IGNvbXBvbmVudC5jb250cm9sbGVyIHx8IG5vb3BcclxuXHRcdFx0dmFyIGNvbnRyb2xsZXIgPSBuZXcgY29uc3RydWN0b3I7XHJcblx0XHRcdC8vY29udHJvbGxlcnMgbWF5IGNhbGwgbS5tb3VudCByZWN1cnNpdmVseSAodmlhIG0ucm91dGUgcmVkaXJlY3RzLCBmb3IgZXhhbXBsZSlcclxuXHRcdFx0Ly90aGlzIGNvbmRpdGlvbmFsIGVuc3VyZXMgb25seSB0aGUgbGFzdCByZWN1cnNpdmUgbS5tb3VudCBjYWxsIGlzIGFwcGxpZWRcclxuXHRcdFx0aWYgKGN1cnJlbnRDb21wb25lbnQgPT09IHRvcENvbXBvbmVudCkge1xyXG5cdFx0XHRcdGNvbnRyb2xsZXJzW2luZGV4XSA9IGNvbnRyb2xsZXI7XHJcblx0XHRcdFx0Y29tcG9uZW50c1tpbmRleF0gPSBjb21wb25lbnRcclxuXHRcdFx0fVxyXG5cdFx0XHRlbmRGaXJzdENvbXB1dGF0aW9uKCk7XHJcblx0XHRcdHJldHVybiBjb250cm9sbGVyc1tpbmRleF1cclxuXHRcdH1cclxuXHR9O1xyXG5cdHZhciByZWRyYXdpbmcgPSBmYWxzZVxyXG5cdG0ucmVkcmF3ID0gZnVuY3Rpb24oZm9yY2UpIHtcclxuXHRcdGlmIChyZWRyYXdpbmcpIHJldHVyblxyXG5cdFx0cmVkcmF3aW5nID0gdHJ1ZVxyXG5cdFx0Ly9sYXN0UmVkcmF3SWQgaXMgYSBwb3NpdGl2ZSBudW1iZXIgaWYgYSBzZWNvbmQgcmVkcmF3IGlzIHJlcXVlc3RlZCBiZWZvcmUgdGhlIG5leHQgYW5pbWF0aW9uIGZyYW1lXHJcblx0XHQvL2xhc3RSZWRyYXdJRCBpcyBudWxsIGlmIGl0J3MgdGhlIGZpcnN0IHJlZHJhdyBhbmQgbm90IGFuIGV2ZW50IGhhbmRsZXJcclxuXHRcdGlmIChsYXN0UmVkcmF3SWQgJiYgZm9yY2UgIT09IHRydWUpIHtcclxuXHRcdFx0Ly93aGVuIHNldFRpbWVvdXQ6IG9ubHkgcmVzY2hlZHVsZSByZWRyYXcgaWYgdGltZSBiZXR3ZWVuIG5vdyBhbmQgcHJldmlvdXMgcmVkcmF3IGlzIGJpZ2dlciB0aGFuIGEgZnJhbWUsIG90aGVyd2lzZSBrZWVwIGN1cnJlbnRseSBzY2hlZHVsZWQgdGltZW91dFxyXG5cdFx0XHQvL3doZW4gckFGOiBhbHdheXMgcmVzY2hlZHVsZSByZWRyYXdcclxuXHRcdFx0aWYgKCRyZXF1ZXN0QW5pbWF0aW9uRnJhbWUgPT09IHdpbmRvdy5yZXF1ZXN0QW5pbWF0aW9uRnJhbWUgfHwgbmV3IERhdGUgLSBsYXN0UmVkcmF3Q2FsbFRpbWUgPiBGUkFNRV9CVURHRVQpIHtcclxuXHRcdFx0XHRpZiAobGFzdFJlZHJhd0lkID4gMCkgJGNhbmNlbEFuaW1hdGlvbkZyYW1lKGxhc3RSZWRyYXdJZCk7XHJcblx0XHRcdFx0bGFzdFJlZHJhd0lkID0gJHJlcXVlc3RBbmltYXRpb25GcmFtZShyZWRyYXcsIEZSQU1FX0JVREdFVClcclxuXHRcdFx0fVxyXG5cdFx0fVxyXG5cdFx0ZWxzZSB7XHJcblx0XHRcdHJlZHJhdygpO1xyXG5cdFx0XHRsYXN0UmVkcmF3SWQgPSAkcmVxdWVzdEFuaW1hdGlvbkZyYW1lKGZ1bmN0aW9uKCkge2xhc3RSZWRyYXdJZCA9IG51bGx9LCBGUkFNRV9CVURHRVQpXHJcblx0XHR9XHJcblx0XHRyZWRyYXdpbmcgPSBmYWxzZVxyXG5cdH07XHJcblx0bS5yZWRyYXcuc3RyYXRlZ3kgPSBtLnByb3AoKTtcclxuXHRmdW5jdGlvbiByZWRyYXcoKSB7XHJcblx0XHRpZiAoY29tcHV0ZVByZVJlZHJhd0hvb2spIHtcclxuXHRcdFx0Y29tcHV0ZVByZVJlZHJhd0hvb2soKVxyXG5cdFx0XHRjb21wdXRlUHJlUmVkcmF3SG9vayA9IG51bGxcclxuXHRcdH1cclxuXHRcdGZvciAodmFyIGkgPSAwLCByb290OyByb290ID0gcm9vdHNbaV07IGkrKykge1xyXG5cdFx0XHRpZiAoY29udHJvbGxlcnNbaV0pIHtcclxuXHRcdFx0XHR2YXIgYXJncyA9IGNvbXBvbmVudHNbaV0uY29udHJvbGxlciAmJiBjb21wb25lbnRzW2ldLmNvbnRyb2xsZXIuJCRhcmdzID8gW2NvbnRyb2xsZXJzW2ldXS5jb25jYXQoY29tcG9uZW50c1tpXS5jb250cm9sbGVyLiQkYXJncykgOiBbY29udHJvbGxlcnNbaV1dXHJcblx0XHRcdFx0bS5yZW5kZXIocm9vdCwgY29tcG9uZW50c1tpXS52aWV3ID8gY29tcG9uZW50c1tpXS52aWV3KGNvbnRyb2xsZXJzW2ldLCBhcmdzKSA6IFwiXCIpXHJcblx0XHRcdH1cclxuXHRcdH1cclxuXHRcdC8vYWZ0ZXIgcmVuZGVyaW5nIHdpdGhpbiBhIHJvdXRlZCBjb250ZXh0LCB3ZSBuZWVkIHRvIHNjcm9sbCBiYWNrIHRvIHRoZSB0b3AsIGFuZCBmZXRjaCB0aGUgZG9jdW1lbnQgdGl0bGUgZm9yIGhpc3RvcnkucHVzaFN0YXRlXHJcblx0XHRpZiAoY29tcHV0ZVBvc3RSZWRyYXdIb29rKSB7XHJcblx0XHRcdGNvbXB1dGVQb3N0UmVkcmF3SG9vaygpO1xyXG5cdFx0XHRjb21wdXRlUG9zdFJlZHJhd0hvb2sgPSBudWxsXHJcblx0XHR9XHJcblx0XHRsYXN0UmVkcmF3SWQgPSBudWxsO1xyXG5cdFx0bGFzdFJlZHJhd0NhbGxUaW1lID0gbmV3IERhdGU7XHJcblx0XHRtLnJlZHJhdy5zdHJhdGVneShcImRpZmZcIilcclxuXHR9XHJcblxyXG5cdHZhciBwZW5kaW5nUmVxdWVzdHMgPSAwO1xyXG5cdG0uc3RhcnRDb21wdXRhdGlvbiA9IGZ1bmN0aW9uKCkge3BlbmRpbmdSZXF1ZXN0cysrfTtcclxuXHRtLmVuZENvbXB1dGF0aW9uID0gZnVuY3Rpb24oKSB7XHJcblx0XHRwZW5kaW5nUmVxdWVzdHMgPSBNYXRoLm1heChwZW5kaW5nUmVxdWVzdHMgLSAxLCAwKTtcclxuXHRcdGlmIChwZW5kaW5nUmVxdWVzdHMgPT09IDApIG0ucmVkcmF3KClcclxuXHR9O1xyXG5cdHZhciBlbmRGaXJzdENvbXB1dGF0aW9uID0gZnVuY3Rpb24oKSB7XHJcblx0XHRpZiAobS5yZWRyYXcuc3RyYXRlZ3koKSA9PSBcIm5vbmVcIikge1xyXG5cdFx0XHRwZW5kaW5nUmVxdWVzdHMtLVxyXG5cdFx0XHRtLnJlZHJhdy5zdHJhdGVneShcImRpZmZcIilcclxuXHRcdH1cclxuXHRcdGVsc2UgbS5lbmRDb21wdXRhdGlvbigpO1xyXG5cdH1cclxuXHJcblx0bS53aXRoQXR0ciA9IGZ1bmN0aW9uKHByb3AsIHdpdGhBdHRyQ2FsbGJhY2spIHtcclxuXHRcdHJldHVybiBmdW5jdGlvbihlKSB7XHJcblx0XHRcdGUgPSBlIHx8IGV2ZW50O1xyXG5cdFx0XHR2YXIgY3VycmVudFRhcmdldCA9IGUuY3VycmVudFRhcmdldCB8fCB0aGlzO1xyXG5cdFx0XHR3aXRoQXR0ckNhbGxiYWNrKHByb3AgaW4gY3VycmVudFRhcmdldCA/IGN1cnJlbnRUYXJnZXRbcHJvcF0gOiBjdXJyZW50VGFyZ2V0LmdldEF0dHJpYnV0ZShwcm9wKSlcclxuXHRcdH1cclxuXHR9O1xyXG5cclxuXHQvL3JvdXRpbmdcclxuXHR2YXIgbW9kZXMgPSB7cGF0aG5hbWU6IFwiXCIsIGhhc2g6IFwiI1wiLCBzZWFyY2g6IFwiP1wifTtcclxuXHR2YXIgcmVkaXJlY3QgPSBub29wLCByb3V0ZVBhcmFtcywgY3VycmVudFJvdXRlLCBpc0RlZmF1bHRSb3V0ZSA9IGZhbHNlO1xyXG5cdG0ucm91dGUgPSBmdW5jdGlvbigpIHtcclxuXHRcdC8vbS5yb3V0ZSgpXHJcblx0XHRpZiAoYXJndW1lbnRzLmxlbmd0aCA9PT0gMCkgcmV0dXJuIGN1cnJlbnRSb3V0ZTtcclxuXHRcdC8vbS5yb3V0ZShlbCwgZGVmYXVsdFJvdXRlLCByb3V0ZXMpXHJcblx0XHRlbHNlIGlmIChhcmd1bWVudHMubGVuZ3RoID09PSAzICYmIHR5cGUuY2FsbChhcmd1bWVudHNbMV0pID09PSBTVFJJTkcpIHtcclxuXHRcdFx0dmFyIHJvb3QgPSBhcmd1bWVudHNbMF0sIGRlZmF1bHRSb3V0ZSA9IGFyZ3VtZW50c1sxXSwgcm91dGVyID0gYXJndW1lbnRzWzJdO1xyXG5cdFx0XHRyZWRpcmVjdCA9IGZ1bmN0aW9uKHNvdXJjZSkge1xyXG5cdFx0XHRcdHZhciBwYXRoID0gY3VycmVudFJvdXRlID0gbm9ybWFsaXplUm91dGUoc291cmNlKTtcclxuXHRcdFx0XHRpZiAoIXJvdXRlQnlWYWx1ZShyb290LCByb3V0ZXIsIHBhdGgpKSB7XHJcblx0XHRcdFx0XHRpZiAoaXNEZWZhdWx0Um91dGUpIHRocm93IG5ldyBFcnJvcihcIkVuc3VyZSB0aGUgZGVmYXVsdCByb3V0ZSBtYXRjaGVzIG9uZSBvZiB0aGUgcm91dGVzIGRlZmluZWQgaW4gbS5yb3V0ZVwiKVxyXG5cdFx0XHRcdFx0aXNEZWZhdWx0Um91dGUgPSB0cnVlXHJcblx0XHRcdFx0XHRtLnJvdXRlKGRlZmF1bHRSb3V0ZSwgdHJ1ZSlcclxuXHRcdFx0XHRcdGlzRGVmYXVsdFJvdXRlID0gZmFsc2VcclxuXHRcdFx0XHR9XHJcblx0XHRcdH07XHJcblx0XHRcdHZhciBsaXN0ZW5lciA9IG0ucm91dGUubW9kZSA9PT0gXCJoYXNoXCIgPyBcIm9uaGFzaGNoYW5nZVwiIDogXCJvbnBvcHN0YXRlXCI7XHJcblx0XHRcdHdpbmRvd1tsaXN0ZW5lcl0gPSBmdW5jdGlvbigpIHtcclxuXHRcdFx0XHR2YXIgcGF0aCA9ICRsb2NhdGlvblttLnJvdXRlLm1vZGVdXHJcblx0XHRcdFx0aWYgKG0ucm91dGUubW9kZSA9PT0gXCJwYXRobmFtZVwiKSBwYXRoICs9ICRsb2NhdGlvbi5zZWFyY2hcclxuXHRcdFx0XHRpZiAoY3VycmVudFJvdXRlICE9IG5vcm1hbGl6ZVJvdXRlKHBhdGgpKSB7XHJcblx0XHRcdFx0XHRyZWRpcmVjdChwYXRoKVxyXG5cdFx0XHRcdH1cclxuXHRcdFx0fTtcclxuXHRcdFx0Y29tcHV0ZVByZVJlZHJhd0hvb2sgPSBzZXRTY3JvbGw7XHJcblx0XHRcdHdpbmRvd1tsaXN0ZW5lcl0oKVxyXG5cdFx0fVxyXG5cdFx0Ly9jb25maWc6IG0ucm91dGVcclxuXHRcdGVsc2UgaWYgKGFyZ3VtZW50c1swXS5hZGRFdmVudExpc3RlbmVyIHx8IGFyZ3VtZW50c1swXS5hdHRhY2hFdmVudCkge1xyXG5cdFx0XHR2YXIgZWxlbWVudCA9IGFyZ3VtZW50c1swXTtcclxuXHRcdFx0dmFyIGlzSW5pdGlhbGl6ZWQgPSBhcmd1bWVudHNbMV07XHJcblx0XHRcdHZhciBjb250ZXh0ID0gYXJndW1lbnRzWzJdO1xyXG5cdFx0XHR2YXIgdmRvbSA9IGFyZ3VtZW50c1szXTtcclxuXHRcdFx0ZWxlbWVudC5ocmVmID0gKG0ucm91dGUubW9kZSAhPT0gJ3BhdGhuYW1lJyA/ICRsb2NhdGlvbi5wYXRobmFtZSA6ICcnKSArIG1vZGVzW20ucm91dGUubW9kZV0gKyB2ZG9tLmF0dHJzLmhyZWY7XHJcblx0XHRcdGlmIChlbGVtZW50LmFkZEV2ZW50TGlzdGVuZXIpIHtcclxuXHRcdFx0XHRlbGVtZW50LnJlbW92ZUV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCByb3V0ZVVub2J0cnVzaXZlKTtcclxuXHRcdFx0XHRlbGVtZW50LmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCByb3V0ZVVub2J0cnVzaXZlKVxyXG5cdFx0XHR9XHJcblx0XHRcdGVsc2Uge1xyXG5cdFx0XHRcdGVsZW1lbnQuZGV0YWNoRXZlbnQoXCJvbmNsaWNrXCIsIHJvdXRlVW5vYnRydXNpdmUpO1xyXG5cdFx0XHRcdGVsZW1lbnQuYXR0YWNoRXZlbnQoXCJvbmNsaWNrXCIsIHJvdXRlVW5vYnRydXNpdmUpXHJcblx0XHRcdH1cclxuXHRcdH1cclxuXHRcdC8vbS5yb3V0ZShyb3V0ZSwgcGFyYW1zLCBzaG91bGRSZXBsYWNlSGlzdG9yeUVudHJ5KVxyXG5cdFx0ZWxzZSBpZiAodHlwZS5jYWxsKGFyZ3VtZW50c1swXSkgPT09IFNUUklORykge1xyXG5cdFx0XHR2YXIgb2xkUm91dGUgPSBjdXJyZW50Um91dGU7XHJcblx0XHRcdGN1cnJlbnRSb3V0ZSA9IGFyZ3VtZW50c1swXTtcclxuXHRcdFx0dmFyIGFyZ3MgPSBhcmd1bWVudHNbMV0gfHwge31cclxuXHRcdFx0dmFyIHF1ZXJ5SW5kZXggPSBjdXJyZW50Um91dGUuaW5kZXhPZihcIj9cIilcclxuXHRcdFx0dmFyIHBhcmFtcyA9IHF1ZXJ5SW5kZXggPiAtMSA/IHBhcnNlUXVlcnlTdHJpbmcoY3VycmVudFJvdXRlLnNsaWNlKHF1ZXJ5SW5kZXggKyAxKSkgOiB7fVxyXG5cdFx0XHRmb3IgKHZhciBpIGluIGFyZ3MpIHBhcmFtc1tpXSA9IGFyZ3NbaV1cclxuXHRcdFx0dmFyIHF1ZXJ5c3RyaW5nID0gYnVpbGRRdWVyeVN0cmluZyhwYXJhbXMpXHJcblx0XHRcdHZhciBjdXJyZW50UGF0aCA9IHF1ZXJ5SW5kZXggPiAtMSA/IGN1cnJlbnRSb3V0ZS5zbGljZSgwLCBxdWVyeUluZGV4KSA6IGN1cnJlbnRSb3V0ZVxyXG5cdFx0XHRpZiAocXVlcnlzdHJpbmcpIGN1cnJlbnRSb3V0ZSA9IGN1cnJlbnRQYXRoICsgKGN1cnJlbnRQYXRoLmluZGV4T2YoXCI/XCIpID09PSAtMSA/IFwiP1wiIDogXCImXCIpICsgcXVlcnlzdHJpbmc7XHJcblxyXG5cdFx0XHR2YXIgc2hvdWxkUmVwbGFjZUhpc3RvcnlFbnRyeSA9IChhcmd1bWVudHMubGVuZ3RoID09PSAzID8gYXJndW1lbnRzWzJdIDogYXJndW1lbnRzWzFdKSA9PT0gdHJ1ZSB8fCBvbGRSb3V0ZSA9PT0gYXJndW1lbnRzWzBdO1xyXG5cclxuXHRcdFx0aWYgKHdpbmRvdy5oaXN0b3J5LnB1c2hTdGF0ZSkge1xyXG5cdFx0XHRcdGNvbXB1dGVQcmVSZWRyYXdIb29rID0gc2V0U2Nyb2xsXHJcblx0XHRcdFx0Y29tcHV0ZVBvc3RSZWRyYXdIb29rID0gZnVuY3Rpb24oKSB7XHJcblx0XHRcdFx0XHR3aW5kb3cuaGlzdG9yeVtzaG91bGRSZXBsYWNlSGlzdG9yeUVudHJ5ID8gXCJyZXBsYWNlU3RhdGVcIiA6IFwicHVzaFN0YXRlXCJdKG51bGwsICRkb2N1bWVudC50aXRsZSwgbW9kZXNbbS5yb3V0ZS5tb2RlXSArIGN1cnJlbnRSb3V0ZSk7XHJcblx0XHRcdFx0fTtcclxuXHRcdFx0XHRyZWRpcmVjdChtb2Rlc1ttLnJvdXRlLm1vZGVdICsgY3VycmVudFJvdXRlKVxyXG5cdFx0XHR9XHJcblx0XHRcdGVsc2Uge1xyXG5cdFx0XHRcdCRsb2NhdGlvblttLnJvdXRlLm1vZGVdID0gY3VycmVudFJvdXRlXHJcblx0XHRcdFx0cmVkaXJlY3QobW9kZXNbbS5yb3V0ZS5tb2RlXSArIGN1cnJlbnRSb3V0ZSlcclxuXHRcdFx0fVxyXG5cdFx0fVxyXG5cdH07XHJcblx0bS5yb3V0ZS5wYXJhbSA9IGZ1bmN0aW9uKGtleSkge1xyXG5cdFx0aWYgKCFyb3V0ZVBhcmFtcykgdGhyb3cgbmV3IEVycm9yKFwiWW91IG11c3QgY2FsbCBtLnJvdXRlKGVsZW1lbnQsIGRlZmF1bHRSb3V0ZSwgcm91dGVzKSBiZWZvcmUgY2FsbGluZyBtLnJvdXRlLnBhcmFtKClcIilcclxuXHRcdHJldHVybiByb3V0ZVBhcmFtc1trZXldXHJcblx0fTtcclxuXHRtLnJvdXRlLm1vZGUgPSBcInNlYXJjaFwiO1xyXG5cdGZ1bmN0aW9uIG5vcm1hbGl6ZVJvdXRlKHJvdXRlKSB7XHJcblx0XHRyZXR1cm4gcm91dGUuc2xpY2UobW9kZXNbbS5yb3V0ZS5tb2RlXS5sZW5ndGgpXHJcblx0fVxyXG5cdGZ1bmN0aW9uIHJvdXRlQnlWYWx1ZShyb290LCByb3V0ZXIsIHBhdGgpIHtcclxuXHRcdHJvdXRlUGFyYW1zID0ge307XHJcblxyXG5cdFx0dmFyIHF1ZXJ5U3RhcnQgPSBwYXRoLmluZGV4T2YoXCI/XCIpO1xyXG5cdFx0aWYgKHF1ZXJ5U3RhcnQgIT09IC0xKSB7XHJcblx0XHRcdHJvdXRlUGFyYW1zID0gcGFyc2VRdWVyeVN0cmluZyhwYXRoLnN1YnN0cihxdWVyeVN0YXJ0ICsgMSwgcGF0aC5sZW5ndGgpKTtcclxuXHRcdFx0cGF0aCA9IHBhdGguc3Vic3RyKDAsIHF1ZXJ5U3RhcnQpXHJcblx0XHR9XHJcblxyXG5cdFx0Ly8gR2V0IGFsbCByb3V0ZXMgYW5kIGNoZWNrIGlmIHRoZXJlJ3NcclxuXHRcdC8vIGFuIGV4YWN0IG1hdGNoIGZvciB0aGUgY3VycmVudCBwYXRoXHJcblx0XHR2YXIga2V5cyA9IE9iamVjdC5rZXlzKHJvdXRlcik7XHJcblx0XHR2YXIgaW5kZXggPSBrZXlzLmluZGV4T2YocGF0aCk7XHJcblx0XHRpZihpbmRleCAhPT0gLTEpe1xyXG5cdFx0XHRtLm1vdW50KHJvb3QsIHJvdXRlcltrZXlzIFtpbmRleF1dKTtcclxuXHRcdFx0cmV0dXJuIHRydWU7XHJcblx0XHR9XHJcblxyXG5cdFx0Zm9yICh2YXIgcm91dGUgaW4gcm91dGVyKSB7XHJcblx0XHRcdGlmIChyb3V0ZSA9PT0gcGF0aCkge1xyXG5cdFx0XHRcdG0ubW91bnQocm9vdCwgcm91dGVyW3JvdXRlXSk7XHJcblx0XHRcdFx0cmV0dXJuIHRydWVcclxuXHRcdFx0fVxyXG5cclxuXHRcdFx0dmFyIG1hdGNoZXIgPSBuZXcgUmVnRXhwKFwiXlwiICsgcm91dGUucmVwbGFjZSgvOlteXFwvXSs/XFwuezN9L2csIFwiKC4qPylcIikucmVwbGFjZSgvOlteXFwvXSsvZywgXCIoW15cXFxcL10rKVwiKSArIFwiXFwvPyRcIik7XHJcblxyXG5cdFx0XHRpZiAobWF0Y2hlci50ZXN0KHBhdGgpKSB7XHJcblx0XHRcdFx0cGF0aC5yZXBsYWNlKG1hdGNoZXIsIGZ1bmN0aW9uKCkge1xyXG5cdFx0XHRcdFx0dmFyIGtleXMgPSByb3V0ZS5tYXRjaCgvOlteXFwvXSsvZykgfHwgW107XHJcblx0XHRcdFx0XHR2YXIgdmFsdWVzID0gW10uc2xpY2UuY2FsbChhcmd1bWVudHMsIDEsIC0yKTtcclxuXHRcdFx0XHRcdGZvciAodmFyIGkgPSAwLCBsZW4gPSBrZXlzLmxlbmd0aDsgaSA8IGxlbjsgaSsrKSByb3V0ZVBhcmFtc1trZXlzW2ldLnJlcGxhY2UoLzp8XFwuL2csIFwiXCIpXSA9IGRlY29kZVVSSUNvbXBvbmVudCh2YWx1ZXNbaV0pXHJcblx0XHRcdFx0XHRtLm1vdW50KHJvb3QsIHJvdXRlcltyb3V0ZV0pXHJcblx0XHRcdFx0fSk7XHJcblx0XHRcdFx0cmV0dXJuIHRydWVcclxuXHRcdFx0fVxyXG5cdFx0fVxyXG5cdH1cclxuXHRmdW5jdGlvbiByb3V0ZVVub2J0cnVzaXZlKGUpIHtcclxuXHRcdGUgPSBlIHx8IGV2ZW50O1xyXG5cdFx0aWYgKGUuY3RybEtleSB8fCBlLm1ldGFLZXkgfHwgZS53aGljaCA9PT0gMikgcmV0dXJuO1xyXG5cdFx0aWYgKGUucHJldmVudERlZmF1bHQpIGUucHJldmVudERlZmF1bHQoKTtcclxuXHRcdGVsc2UgZS5yZXR1cm5WYWx1ZSA9IGZhbHNlO1xyXG5cdFx0dmFyIGN1cnJlbnRUYXJnZXQgPSBlLmN1cnJlbnRUYXJnZXQgfHwgZS5zcmNFbGVtZW50O1xyXG5cdFx0dmFyIGFyZ3MgPSBtLnJvdXRlLm1vZGUgPT09IFwicGF0aG5hbWVcIiAmJiBjdXJyZW50VGFyZ2V0LnNlYXJjaCA/IHBhcnNlUXVlcnlTdHJpbmcoY3VycmVudFRhcmdldC5zZWFyY2guc2xpY2UoMSkpIDoge307XHJcblx0XHR3aGlsZSAoY3VycmVudFRhcmdldCAmJiBjdXJyZW50VGFyZ2V0Lm5vZGVOYW1lLnRvVXBwZXJDYXNlKCkgIT0gXCJBXCIpIGN1cnJlbnRUYXJnZXQgPSBjdXJyZW50VGFyZ2V0LnBhcmVudE5vZGVcclxuXHRcdG0ucm91dGUoY3VycmVudFRhcmdldFttLnJvdXRlLm1vZGVdLnNsaWNlKG1vZGVzW20ucm91dGUubW9kZV0ubGVuZ3RoKSwgYXJncylcclxuXHR9XHJcblx0ZnVuY3Rpb24gc2V0U2Nyb2xsKCkge1xyXG5cdFx0aWYgKG0ucm91dGUubW9kZSAhPSBcImhhc2hcIiAmJiAkbG9jYXRpb24uaGFzaCkgJGxvY2F0aW9uLmhhc2ggPSAkbG9jYXRpb24uaGFzaDtcclxuXHRcdGVsc2Ugd2luZG93LnNjcm9sbFRvKDAsIDApXHJcblx0fVxyXG5cdGZ1bmN0aW9uIGJ1aWxkUXVlcnlTdHJpbmcob2JqZWN0LCBwcmVmaXgpIHtcclxuXHRcdHZhciBkdXBsaWNhdGVzID0ge31cclxuXHRcdHZhciBzdHIgPSBbXVxyXG5cdFx0Zm9yICh2YXIgcHJvcCBpbiBvYmplY3QpIHtcclxuXHRcdFx0dmFyIGtleSA9IHByZWZpeCA/IHByZWZpeCArIFwiW1wiICsgcHJvcCArIFwiXVwiIDogcHJvcFxyXG5cdFx0XHR2YXIgdmFsdWUgPSBvYmplY3RbcHJvcF1cclxuXHRcdFx0dmFyIHZhbHVlVHlwZSA9IHR5cGUuY2FsbCh2YWx1ZSlcclxuXHRcdFx0dmFyIHBhaXIgPSAodmFsdWUgPT09IG51bGwpID8gZW5jb2RlVVJJQ29tcG9uZW50KGtleSkgOlxyXG5cdFx0XHRcdHZhbHVlVHlwZSA9PT0gT0JKRUNUID8gYnVpbGRRdWVyeVN0cmluZyh2YWx1ZSwga2V5KSA6XHJcblx0XHRcdFx0dmFsdWVUeXBlID09PSBBUlJBWSA/IHZhbHVlLnJlZHVjZShmdW5jdGlvbihtZW1vLCBpdGVtKSB7XHJcblx0XHRcdFx0XHRpZiAoIWR1cGxpY2F0ZXNba2V5XSkgZHVwbGljYXRlc1trZXldID0ge31cclxuXHRcdFx0XHRcdGlmICghZHVwbGljYXRlc1trZXldW2l0ZW1dKSB7XHJcblx0XHRcdFx0XHRcdGR1cGxpY2F0ZXNba2V5XVtpdGVtXSA9IHRydWVcclxuXHRcdFx0XHRcdFx0cmV0dXJuIG1lbW8uY29uY2F0KGVuY29kZVVSSUNvbXBvbmVudChrZXkpICsgXCI9XCIgKyBlbmNvZGVVUklDb21wb25lbnQoaXRlbSkpXHJcblx0XHRcdFx0XHR9XHJcblx0XHRcdFx0XHRyZXR1cm4gbWVtb1xyXG5cdFx0XHRcdH0sIFtdKS5qb2luKFwiJlwiKSA6XHJcblx0XHRcdFx0ZW5jb2RlVVJJQ29tcG9uZW50KGtleSkgKyBcIj1cIiArIGVuY29kZVVSSUNvbXBvbmVudCh2YWx1ZSlcclxuXHRcdFx0aWYgKHZhbHVlICE9PSB1bmRlZmluZWQpIHN0ci5wdXNoKHBhaXIpXHJcblx0XHR9XHJcblx0XHRyZXR1cm4gc3RyLmpvaW4oXCImXCIpXHJcblx0fVxyXG5cdGZ1bmN0aW9uIHBhcnNlUXVlcnlTdHJpbmcoc3RyKSB7XHJcblx0XHRpZiAoc3RyLmNoYXJBdCgwKSA9PT0gXCI/XCIpIHN0ciA9IHN0ci5zdWJzdHJpbmcoMSk7XHJcblx0XHRcclxuXHRcdHZhciBwYWlycyA9IHN0ci5zcGxpdChcIiZcIiksIHBhcmFtcyA9IHt9O1xyXG5cdFx0Zm9yICh2YXIgaSA9IDAsIGxlbiA9IHBhaXJzLmxlbmd0aDsgaSA8IGxlbjsgaSsrKSB7XHJcblx0XHRcdHZhciBwYWlyID0gcGFpcnNbaV0uc3BsaXQoXCI9XCIpO1xyXG5cdFx0XHR2YXIga2V5ID0gZGVjb2RlVVJJQ29tcG9uZW50KHBhaXJbMF0pXHJcblx0XHRcdHZhciB2YWx1ZSA9IHBhaXIubGVuZ3RoID09IDIgPyBkZWNvZGVVUklDb21wb25lbnQocGFpclsxXSkgOiBudWxsXHJcblx0XHRcdGlmIChwYXJhbXNba2V5XSAhPSBudWxsKSB7XHJcblx0XHRcdFx0aWYgKHR5cGUuY2FsbChwYXJhbXNba2V5XSkgIT09IEFSUkFZKSBwYXJhbXNba2V5XSA9IFtwYXJhbXNba2V5XV1cclxuXHRcdFx0XHRwYXJhbXNba2V5XS5wdXNoKHZhbHVlKVxyXG5cdFx0XHR9XHJcblx0XHRcdGVsc2UgcGFyYW1zW2tleV0gPSB2YWx1ZVxyXG5cdFx0fVxyXG5cdFx0cmV0dXJuIHBhcmFtc1xyXG5cdH1cclxuXHRtLnJvdXRlLmJ1aWxkUXVlcnlTdHJpbmcgPSBidWlsZFF1ZXJ5U3RyaW5nXHJcblx0bS5yb3V0ZS5wYXJzZVF1ZXJ5U3RyaW5nID0gcGFyc2VRdWVyeVN0cmluZ1xyXG5cdFxyXG5cdGZ1bmN0aW9uIHJlc2V0KHJvb3QpIHtcclxuXHRcdHZhciBjYWNoZUtleSA9IGdldENlbGxDYWNoZUtleShyb290KTtcclxuXHRcdGNsZWFyKHJvb3QuY2hpbGROb2RlcywgY2VsbENhY2hlW2NhY2hlS2V5XSk7XHJcblx0XHRjZWxsQ2FjaGVbY2FjaGVLZXldID0gdW5kZWZpbmVkXHJcblx0fVxyXG5cclxuXHRtLmRlZmVycmVkID0gZnVuY3Rpb24gKCkge1xyXG5cdFx0dmFyIGRlZmVycmVkID0gbmV3IERlZmVycmVkKCk7XHJcblx0XHRkZWZlcnJlZC5wcm9taXNlID0gcHJvcGlmeShkZWZlcnJlZC5wcm9taXNlKTtcclxuXHRcdHJldHVybiBkZWZlcnJlZFxyXG5cdH07XHJcblx0ZnVuY3Rpb24gcHJvcGlmeShwcm9taXNlLCBpbml0aWFsVmFsdWUpIHtcclxuXHRcdHZhciBwcm9wID0gbS5wcm9wKGluaXRpYWxWYWx1ZSk7XHJcblx0XHRwcm9taXNlLnRoZW4ocHJvcCk7XHJcblx0XHRwcm9wLnRoZW4gPSBmdW5jdGlvbihyZXNvbHZlLCByZWplY3QpIHtcclxuXHRcdFx0cmV0dXJuIHByb3BpZnkocHJvbWlzZS50aGVuKHJlc29sdmUsIHJlamVjdCksIGluaXRpYWxWYWx1ZSlcclxuXHRcdH07XHJcblx0XHRyZXR1cm4gcHJvcFxyXG5cdH1cclxuXHQvL1Byb21pei5taXRocmlsLmpzIHwgWm9sbWVpc3RlciB8IE1JVFxyXG5cdC8vYSBtb2RpZmllZCB2ZXJzaW9uIG9mIFByb21pei5qcywgd2hpY2ggZG9lcyBub3QgY29uZm9ybSB0byBQcm9taXNlcy9BKyBmb3IgdHdvIHJlYXNvbnM6XHJcblx0Ly8xKSBgdGhlbmAgY2FsbGJhY2tzIGFyZSBjYWxsZWQgc3luY2hyb25vdXNseSAoYmVjYXVzZSBzZXRUaW1lb3V0IGlzIHRvbyBzbG93LCBhbmQgdGhlIHNldEltbWVkaWF0ZSBwb2x5ZmlsbCBpcyB0b28gYmlnXHJcblx0Ly8yKSB0aHJvd2luZyBzdWJjbGFzc2VzIG9mIEVycm9yIGNhdXNlIHRoZSBlcnJvciB0byBiZSBidWJibGVkIHVwIGluc3RlYWQgb2YgdHJpZ2dlcmluZyByZWplY3Rpb24gKGJlY2F1c2UgdGhlIHNwZWMgZG9lcyBub3QgYWNjb3VudCBmb3IgdGhlIGltcG9ydGFudCB1c2UgY2FzZSBvZiBkZWZhdWx0IGJyb3dzZXIgZXJyb3IgaGFuZGxpbmcsIGkuZS4gbWVzc2FnZSB3LyBsaW5lIG51bWJlcilcclxuXHRmdW5jdGlvbiBEZWZlcnJlZChzdWNjZXNzQ2FsbGJhY2ssIGZhaWx1cmVDYWxsYmFjaykge1xyXG5cdFx0dmFyIFJFU09MVklORyA9IDEsIFJFSkVDVElORyA9IDIsIFJFU09MVkVEID0gMywgUkVKRUNURUQgPSA0O1xyXG5cdFx0dmFyIHNlbGYgPSB0aGlzLCBzdGF0ZSA9IDAsIHByb21pc2VWYWx1ZSA9IDAsIG5leHQgPSBbXTtcclxuXHJcblx0XHRzZWxmW1wicHJvbWlzZVwiXSA9IHt9O1xyXG5cclxuXHRcdHNlbGZbXCJyZXNvbHZlXCJdID0gZnVuY3Rpb24odmFsdWUpIHtcclxuXHRcdFx0aWYgKCFzdGF0ZSkge1xyXG5cdFx0XHRcdHByb21pc2VWYWx1ZSA9IHZhbHVlO1xyXG5cdFx0XHRcdHN0YXRlID0gUkVTT0xWSU5HO1xyXG5cclxuXHRcdFx0XHRmaXJlKClcclxuXHRcdFx0fVxyXG5cdFx0XHRyZXR1cm4gdGhpc1xyXG5cdFx0fTtcclxuXHJcblx0XHRzZWxmW1wicmVqZWN0XCJdID0gZnVuY3Rpb24odmFsdWUpIHtcclxuXHRcdFx0aWYgKCFzdGF0ZSkge1xyXG5cdFx0XHRcdHByb21pc2VWYWx1ZSA9IHZhbHVlO1xyXG5cdFx0XHRcdHN0YXRlID0gUkVKRUNUSU5HO1xyXG5cclxuXHRcdFx0XHRmaXJlKClcclxuXHRcdFx0fVxyXG5cdFx0XHRyZXR1cm4gdGhpc1xyXG5cdFx0fTtcclxuXHJcblx0XHRzZWxmLnByb21pc2VbXCJ0aGVuXCJdID0gZnVuY3Rpb24oc3VjY2Vzc0NhbGxiYWNrLCBmYWlsdXJlQ2FsbGJhY2spIHtcclxuXHRcdFx0dmFyIGRlZmVycmVkID0gbmV3IERlZmVycmVkKHN1Y2Nlc3NDYWxsYmFjaywgZmFpbHVyZUNhbGxiYWNrKTtcclxuXHRcdFx0aWYgKHN0YXRlID09PSBSRVNPTFZFRCkge1xyXG5cdFx0XHRcdGRlZmVycmVkLnJlc29sdmUocHJvbWlzZVZhbHVlKVxyXG5cdFx0XHR9XHJcblx0XHRcdGVsc2UgaWYgKHN0YXRlID09PSBSRUpFQ1RFRCkge1xyXG5cdFx0XHRcdGRlZmVycmVkLnJlamVjdChwcm9taXNlVmFsdWUpXHJcblx0XHRcdH1cclxuXHRcdFx0ZWxzZSB7XHJcblx0XHRcdFx0bmV4dC5wdXNoKGRlZmVycmVkKVxyXG5cdFx0XHR9XHJcblx0XHRcdHJldHVybiBkZWZlcnJlZC5wcm9taXNlXHJcblx0XHR9O1xyXG5cclxuXHRcdGZ1bmN0aW9uIGZpbmlzaCh0eXBlKSB7XHJcblx0XHRcdHN0YXRlID0gdHlwZSB8fCBSRUpFQ1RFRDtcclxuXHRcdFx0bmV4dC5tYXAoZnVuY3Rpb24oZGVmZXJyZWQpIHtcclxuXHRcdFx0XHRzdGF0ZSA9PT0gUkVTT0xWRUQgJiYgZGVmZXJyZWQucmVzb2x2ZShwcm9taXNlVmFsdWUpIHx8IGRlZmVycmVkLnJlamVjdChwcm9taXNlVmFsdWUpXHJcblx0XHRcdH0pXHJcblx0XHR9XHJcblxyXG5cdFx0ZnVuY3Rpb24gdGhlbm5hYmxlKHRoZW4sIHN1Y2Nlc3NDYWxsYmFjaywgZmFpbHVyZUNhbGxiYWNrLCBub3RUaGVubmFibGVDYWxsYmFjaykge1xyXG5cdFx0XHRpZiAoKChwcm9taXNlVmFsdWUgIT0gbnVsbCAmJiB0eXBlLmNhbGwocHJvbWlzZVZhbHVlKSA9PT0gT0JKRUNUKSB8fCB0eXBlb2YgcHJvbWlzZVZhbHVlID09PSBGVU5DVElPTikgJiYgdHlwZW9mIHRoZW4gPT09IEZVTkNUSU9OKSB7XHJcblx0XHRcdFx0dHJ5IHtcclxuXHRcdFx0XHRcdC8vIGNvdW50IHByb3RlY3RzIGFnYWluc3QgYWJ1c2UgY2FsbHMgZnJvbSBzcGVjIGNoZWNrZXJcclxuXHRcdFx0XHRcdHZhciBjb3VudCA9IDA7XHJcblx0XHRcdFx0XHR0aGVuLmNhbGwocHJvbWlzZVZhbHVlLCBmdW5jdGlvbih2YWx1ZSkge1xyXG5cdFx0XHRcdFx0XHRpZiAoY291bnQrKykgcmV0dXJuO1xyXG5cdFx0XHRcdFx0XHRwcm9taXNlVmFsdWUgPSB2YWx1ZTtcclxuXHRcdFx0XHRcdFx0c3VjY2Vzc0NhbGxiYWNrKClcclxuXHRcdFx0XHRcdH0sIGZ1bmN0aW9uICh2YWx1ZSkge1xyXG5cdFx0XHRcdFx0XHRpZiAoY291bnQrKykgcmV0dXJuO1xyXG5cdFx0XHRcdFx0XHRwcm9taXNlVmFsdWUgPSB2YWx1ZTtcclxuXHRcdFx0XHRcdFx0ZmFpbHVyZUNhbGxiYWNrKClcclxuXHRcdFx0XHRcdH0pXHJcblx0XHRcdFx0fVxyXG5cdFx0XHRcdGNhdGNoIChlKSB7XHJcblx0XHRcdFx0XHRtLmRlZmVycmVkLm9uZXJyb3IoZSk7XHJcblx0XHRcdFx0XHRwcm9taXNlVmFsdWUgPSBlO1xyXG5cdFx0XHRcdFx0ZmFpbHVyZUNhbGxiYWNrKClcclxuXHRcdFx0XHR9XHJcblx0XHRcdH0gZWxzZSB7XHJcblx0XHRcdFx0bm90VGhlbm5hYmxlQ2FsbGJhY2soKVxyXG5cdFx0XHR9XHJcblx0XHR9XHJcblxyXG5cdFx0ZnVuY3Rpb24gZmlyZSgpIHtcclxuXHRcdFx0Ly8gY2hlY2sgaWYgaXQncyBhIHRoZW5hYmxlXHJcblx0XHRcdHZhciB0aGVuO1xyXG5cdFx0XHR0cnkge1xyXG5cdFx0XHRcdHRoZW4gPSBwcm9taXNlVmFsdWUgJiYgcHJvbWlzZVZhbHVlLnRoZW5cclxuXHRcdFx0fVxyXG5cdFx0XHRjYXRjaCAoZSkge1xyXG5cdFx0XHRcdG0uZGVmZXJyZWQub25lcnJvcihlKTtcclxuXHRcdFx0XHRwcm9taXNlVmFsdWUgPSBlO1xyXG5cdFx0XHRcdHN0YXRlID0gUkVKRUNUSU5HO1xyXG5cdFx0XHRcdHJldHVybiBmaXJlKClcclxuXHRcdFx0fVxyXG5cdFx0XHR0aGVubmFibGUodGhlbiwgZnVuY3Rpb24oKSB7XHJcblx0XHRcdFx0c3RhdGUgPSBSRVNPTFZJTkc7XHJcblx0XHRcdFx0ZmlyZSgpXHJcblx0XHRcdH0sIGZ1bmN0aW9uKCkge1xyXG5cdFx0XHRcdHN0YXRlID0gUkVKRUNUSU5HO1xyXG5cdFx0XHRcdGZpcmUoKVxyXG5cdFx0XHR9LCBmdW5jdGlvbigpIHtcclxuXHRcdFx0XHR0cnkge1xyXG5cdFx0XHRcdFx0aWYgKHN0YXRlID09PSBSRVNPTFZJTkcgJiYgdHlwZW9mIHN1Y2Nlc3NDYWxsYmFjayA9PT0gRlVOQ1RJT04pIHtcclxuXHRcdFx0XHRcdFx0cHJvbWlzZVZhbHVlID0gc3VjY2Vzc0NhbGxiYWNrKHByb21pc2VWYWx1ZSlcclxuXHRcdFx0XHRcdH1cclxuXHRcdFx0XHRcdGVsc2UgaWYgKHN0YXRlID09PSBSRUpFQ1RJTkcgJiYgdHlwZW9mIGZhaWx1cmVDYWxsYmFjayA9PT0gXCJmdW5jdGlvblwiKSB7XHJcblx0XHRcdFx0XHRcdHByb21pc2VWYWx1ZSA9IGZhaWx1cmVDYWxsYmFjayhwcm9taXNlVmFsdWUpO1xyXG5cdFx0XHRcdFx0XHRzdGF0ZSA9IFJFU09MVklOR1xyXG5cdFx0XHRcdFx0fVxyXG5cdFx0XHRcdH1cclxuXHRcdFx0XHRjYXRjaCAoZSkge1xyXG5cdFx0XHRcdFx0bS5kZWZlcnJlZC5vbmVycm9yKGUpO1xyXG5cdFx0XHRcdFx0cHJvbWlzZVZhbHVlID0gZTtcclxuXHRcdFx0XHRcdHJldHVybiBmaW5pc2goKVxyXG5cdFx0XHRcdH1cclxuXHJcblx0XHRcdFx0aWYgKHByb21pc2VWYWx1ZSA9PT0gc2VsZikge1xyXG5cdFx0XHRcdFx0cHJvbWlzZVZhbHVlID0gVHlwZUVycm9yKCk7XHJcblx0XHRcdFx0XHRmaW5pc2goKVxyXG5cdFx0XHRcdH1cclxuXHRcdFx0XHRlbHNlIHtcclxuXHRcdFx0XHRcdHRoZW5uYWJsZSh0aGVuLCBmdW5jdGlvbiAoKSB7XHJcblx0XHRcdFx0XHRcdGZpbmlzaChSRVNPTFZFRClcclxuXHRcdFx0XHRcdH0sIGZpbmlzaCwgZnVuY3Rpb24gKCkge1xyXG5cdFx0XHRcdFx0XHRmaW5pc2goc3RhdGUgPT09IFJFU09MVklORyAmJiBSRVNPTFZFRClcclxuXHRcdFx0XHRcdH0pXHJcblx0XHRcdFx0fVxyXG5cdFx0XHR9KVxyXG5cdFx0fVxyXG5cdH1cclxuXHRtLmRlZmVycmVkLm9uZXJyb3IgPSBmdW5jdGlvbihlKSB7XHJcblx0XHRpZiAodHlwZS5jYWxsKGUpID09PSBcIltvYmplY3QgRXJyb3JdXCIgJiYgIWUuY29uc3RydWN0b3IudG9TdHJpbmcoKS5tYXRjaCgvIEVycm9yLykpIHRocm93IGVcclxuXHR9O1xyXG5cclxuXHRtLnN5bmMgPSBmdW5jdGlvbihhcmdzKSB7XHJcblx0XHR2YXIgbWV0aG9kID0gXCJyZXNvbHZlXCI7XHJcblx0XHRmdW5jdGlvbiBzeW5jaHJvbml6ZXIocG9zLCByZXNvbHZlZCkge1xyXG5cdFx0XHRyZXR1cm4gZnVuY3Rpb24odmFsdWUpIHtcclxuXHRcdFx0XHRyZXN1bHRzW3Bvc10gPSB2YWx1ZTtcclxuXHRcdFx0XHRpZiAoIXJlc29sdmVkKSBtZXRob2QgPSBcInJlamVjdFwiO1xyXG5cdFx0XHRcdGlmICgtLW91dHN0YW5kaW5nID09PSAwKSB7XHJcblx0XHRcdFx0XHRkZWZlcnJlZC5wcm9taXNlKHJlc3VsdHMpO1xyXG5cdFx0XHRcdFx0ZGVmZXJyZWRbbWV0aG9kXShyZXN1bHRzKVxyXG5cdFx0XHRcdH1cclxuXHRcdFx0XHRyZXR1cm4gdmFsdWVcclxuXHRcdFx0fVxyXG5cdFx0fVxyXG5cclxuXHRcdHZhciBkZWZlcnJlZCA9IG0uZGVmZXJyZWQoKTtcclxuXHRcdHZhciBvdXRzdGFuZGluZyA9IGFyZ3MubGVuZ3RoO1xyXG5cdFx0dmFyIHJlc3VsdHMgPSBuZXcgQXJyYXkob3V0c3RhbmRpbmcpO1xyXG5cdFx0aWYgKGFyZ3MubGVuZ3RoID4gMCkge1xyXG5cdFx0XHRmb3IgKHZhciBpID0gMDsgaSA8IGFyZ3MubGVuZ3RoOyBpKyspIHtcclxuXHRcdFx0XHRhcmdzW2ldLnRoZW4oc3luY2hyb25pemVyKGksIHRydWUpLCBzeW5jaHJvbml6ZXIoaSwgZmFsc2UpKVxyXG5cdFx0XHR9XHJcblx0XHR9XHJcblx0XHRlbHNlIGRlZmVycmVkLnJlc29sdmUoW10pO1xyXG5cclxuXHRcdHJldHVybiBkZWZlcnJlZC5wcm9taXNlXHJcblx0fTtcclxuXHRmdW5jdGlvbiBpZGVudGl0eSh2YWx1ZSkge3JldHVybiB2YWx1ZX1cclxuXHJcblx0ZnVuY3Rpb24gYWpheChvcHRpb25zKSB7XHJcblx0XHRpZiAob3B0aW9ucy5kYXRhVHlwZSAmJiBvcHRpb25zLmRhdGFUeXBlLnRvTG93ZXJDYXNlKCkgPT09IFwianNvbnBcIikge1xyXG5cdFx0XHR2YXIgY2FsbGJhY2tLZXkgPSBcIm1pdGhyaWxfY2FsbGJhY2tfXCIgKyBuZXcgRGF0ZSgpLmdldFRpbWUoKSArIFwiX1wiICsgKE1hdGgucm91bmQoTWF0aC5yYW5kb20oKSAqIDFlMTYpKS50b1N0cmluZygzNik7XHJcblx0XHRcdHZhciBzY3JpcHQgPSAkZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcInNjcmlwdFwiKTtcclxuXHJcblx0XHRcdHdpbmRvd1tjYWxsYmFja0tleV0gPSBmdW5jdGlvbihyZXNwKSB7XHJcblx0XHRcdFx0c2NyaXB0LnBhcmVudE5vZGUucmVtb3ZlQ2hpbGQoc2NyaXB0KTtcclxuXHRcdFx0XHRvcHRpb25zLm9ubG9hZCh7XHJcblx0XHRcdFx0XHR0eXBlOiBcImxvYWRcIixcclxuXHRcdFx0XHRcdHRhcmdldDoge1xyXG5cdFx0XHRcdFx0XHRyZXNwb25zZVRleHQ6IHJlc3BcclxuXHRcdFx0XHRcdH1cclxuXHRcdFx0XHR9KTtcclxuXHRcdFx0XHR3aW5kb3dbY2FsbGJhY2tLZXldID0gdW5kZWZpbmVkXHJcblx0XHRcdH07XHJcblxyXG5cdFx0XHRzY3JpcHQub25lcnJvciA9IGZ1bmN0aW9uKGUpIHtcclxuXHRcdFx0XHRzY3JpcHQucGFyZW50Tm9kZS5yZW1vdmVDaGlsZChzY3JpcHQpO1xyXG5cclxuXHRcdFx0XHRvcHRpb25zLm9uZXJyb3Ioe1xyXG5cdFx0XHRcdFx0dHlwZTogXCJlcnJvclwiLFxyXG5cdFx0XHRcdFx0dGFyZ2V0OiB7XHJcblx0XHRcdFx0XHRcdHN0YXR1czogNTAwLFxyXG5cdFx0XHRcdFx0XHRyZXNwb25zZVRleHQ6IEpTT04uc3RyaW5naWZ5KHtlcnJvcjogXCJFcnJvciBtYWtpbmcganNvbnAgcmVxdWVzdFwifSlcclxuXHRcdFx0XHRcdH1cclxuXHRcdFx0XHR9KTtcclxuXHRcdFx0XHR3aW5kb3dbY2FsbGJhY2tLZXldID0gdW5kZWZpbmVkO1xyXG5cclxuXHRcdFx0XHRyZXR1cm4gZmFsc2VcclxuXHRcdFx0fTtcclxuXHJcblx0XHRcdHNjcmlwdC5vbmxvYWQgPSBmdW5jdGlvbihlKSB7XHJcblx0XHRcdFx0cmV0dXJuIGZhbHNlXHJcblx0XHRcdH07XHJcblxyXG5cdFx0XHRzY3JpcHQuc3JjID0gb3B0aW9ucy51cmxcclxuXHRcdFx0XHQrIChvcHRpb25zLnVybC5pbmRleE9mKFwiP1wiKSA+IDAgPyBcIiZcIiA6IFwiP1wiKVxyXG5cdFx0XHRcdCsgKG9wdGlvbnMuY2FsbGJhY2tLZXkgPyBvcHRpb25zLmNhbGxiYWNrS2V5IDogXCJjYWxsYmFja1wiKVxyXG5cdFx0XHRcdCsgXCI9XCIgKyBjYWxsYmFja0tleVxyXG5cdFx0XHRcdCsgXCImXCIgKyBidWlsZFF1ZXJ5U3RyaW5nKG9wdGlvbnMuZGF0YSB8fCB7fSk7XHJcblx0XHRcdCRkb2N1bWVudC5ib2R5LmFwcGVuZENoaWxkKHNjcmlwdClcclxuXHRcdH1cclxuXHRcdGVsc2Uge1xyXG5cdFx0XHR2YXIgeGhyID0gbmV3IHdpbmRvdy5YTUxIdHRwUmVxdWVzdDtcclxuXHRcdFx0eGhyLm9wZW4ob3B0aW9ucy5tZXRob2QsIG9wdGlvbnMudXJsLCB0cnVlLCBvcHRpb25zLnVzZXIsIG9wdGlvbnMucGFzc3dvcmQpO1xyXG5cdFx0XHR4aHIub25yZWFkeXN0YXRlY2hhbmdlID0gZnVuY3Rpb24oKSB7XHJcblx0XHRcdFx0aWYgKHhoci5yZWFkeVN0YXRlID09PSA0KSB7XHJcblx0XHRcdFx0XHRpZiAoeGhyLnN0YXR1cyA+PSAyMDAgJiYgeGhyLnN0YXR1cyA8IDMwMCkgb3B0aW9ucy5vbmxvYWQoe3R5cGU6IFwibG9hZFwiLCB0YXJnZXQ6IHhocn0pO1xyXG5cdFx0XHRcdFx0ZWxzZSBvcHRpb25zLm9uZXJyb3Ioe3R5cGU6IFwiZXJyb3JcIiwgdGFyZ2V0OiB4aHJ9KVxyXG5cdFx0XHRcdH1cclxuXHRcdFx0fTtcclxuXHRcdFx0aWYgKG9wdGlvbnMuc2VyaWFsaXplID09PSBKU09OLnN0cmluZ2lmeSAmJiBvcHRpb25zLmRhdGEgJiYgb3B0aW9ucy5tZXRob2QgIT09IFwiR0VUXCIpIHtcclxuXHRcdFx0XHR4aHIuc2V0UmVxdWVzdEhlYWRlcihcIkNvbnRlbnQtVHlwZVwiLCBcImFwcGxpY2F0aW9uL2pzb247IGNoYXJzZXQ9dXRmLThcIilcclxuXHRcdFx0fVxyXG5cdFx0XHRpZiAob3B0aW9ucy5kZXNlcmlhbGl6ZSA9PT0gSlNPTi5wYXJzZSkge1xyXG5cdFx0XHRcdHhoci5zZXRSZXF1ZXN0SGVhZGVyKFwiQWNjZXB0XCIsIFwiYXBwbGljYXRpb24vanNvbiwgdGV4dC8qXCIpO1xyXG5cdFx0XHR9XHJcblx0XHRcdGlmICh0eXBlb2Ygb3B0aW9ucy5jb25maWcgPT09IEZVTkNUSU9OKSB7XHJcblx0XHRcdFx0dmFyIG1heWJlWGhyID0gb3B0aW9ucy5jb25maWcoeGhyLCBvcHRpb25zKTtcclxuXHRcdFx0XHRpZiAobWF5YmVYaHIgIT0gbnVsbCkgeGhyID0gbWF5YmVYaHJcclxuXHRcdFx0fVxyXG5cclxuXHRcdFx0dmFyIGRhdGEgPSBvcHRpb25zLm1ldGhvZCA9PT0gXCJHRVRcIiB8fCAhb3B0aW9ucy5kYXRhID8gXCJcIiA6IG9wdGlvbnMuZGF0YVxyXG5cdFx0XHRpZiAoZGF0YSAmJiAodHlwZS5jYWxsKGRhdGEpICE9IFNUUklORyAmJiBkYXRhLmNvbnN0cnVjdG9yICE9IHdpbmRvdy5Gb3JtRGF0YSkpIHtcclxuXHRcdFx0XHR0aHJvdyBcIlJlcXVlc3QgZGF0YSBzaG91bGQgYmUgZWl0aGVyIGJlIGEgc3RyaW5nIG9yIEZvcm1EYXRhLiBDaGVjayB0aGUgYHNlcmlhbGl6ZWAgb3B0aW9uIGluIGBtLnJlcXVlc3RgXCI7XHJcblx0XHRcdH1cclxuXHRcdFx0eGhyLnNlbmQoZGF0YSk7XHJcblx0XHRcdHJldHVybiB4aHJcclxuXHRcdH1cclxuXHR9XHJcblx0ZnVuY3Rpb24gYmluZERhdGEoeGhyT3B0aW9ucywgZGF0YSwgc2VyaWFsaXplKSB7XHJcblx0XHRpZiAoeGhyT3B0aW9ucy5tZXRob2QgPT09IFwiR0VUXCIgJiYgeGhyT3B0aW9ucy5kYXRhVHlwZSAhPSBcImpzb25wXCIpIHtcclxuXHRcdFx0dmFyIHByZWZpeCA9IHhock9wdGlvbnMudXJsLmluZGV4T2YoXCI/XCIpIDwgMCA/IFwiP1wiIDogXCImXCI7XHJcblx0XHRcdHZhciBxdWVyeXN0cmluZyA9IGJ1aWxkUXVlcnlTdHJpbmcoZGF0YSk7XHJcblx0XHRcdHhock9wdGlvbnMudXJsID0geGhyT3B0aW9ucy51cmwgKyAocXVlcnlzdHJpbmcgPyBwcmVmaXggKyBxdWVyeXN0cmluZyA6IFwiXCIpXHJcblx0XHR9XHJcblx0XHRlbHNlIHhock9wdGlvbnMuZGF0YSA9IHNlcmlhbGl6ZShkYXRhKTtcclxuXHRcdHJldHVybiB4aHJPcHRpb25zXHJcblx0fVxyXG5cdGZ1bmN0aW9uIHBhcmFtZXRlcml6ZVVybCh1cmwsIGRhdGEpIHtcclxuXHRcdHZhciB0b2tlbnMgPSB1cmwubWF0Y2goLzpbYS16XVxcdysvZ2kpO1xyXG5cdFx0aWYgKHRva2VucyAmJiBkYXRhKSB7XHJcblx0XHRcdGZvciAodmFyIGkgPSAwOyBpIDwgdG9rZW5zLmxlbmd0aDsgaSsrKSB7XHJcblx0XHRcdFx0dmFyIGtleSA9IHRva2Vuc1tpXS5zbGljZSgxKTtcclxuXHRcdFx0XHR1cmwgPSB1cmwucmVwbGFjZSh0b2tlbnNbaV0sIGRhdGFba2V5XSk7XHJcblx0XHRcdFx0ZGVsZXRlIGRhdGFba2V5XVxyXG5cdFx0XHR9XHJcblx0XHR9XHJcblx0XHRyZXR1cm4gdXJsXHJcblx0fVxyXG5cclxuXHRtLnJlcXVlc3QgPSBmdW5jdGlvbih4aHJPcHRpb25zKSB7XHJcblx0XHRpZiAoeGhyT3B0aW9ucy5iYWNrZ3JvdW5kICE9PSB0cnVlKSBtLnN0YXJ0Q29tcHV0YXRpb24oKTtcclxuXHRcdHZhciBkZWZlcnJlZCA9IG5ldyBEZWZlcnJlZCgpO1xyXG5cdFx0dmFyIGlzSlNPTlAgPSB4aHJPcHRpb25zLmRhdGFUeXBlICYmIHhock9wdGlvbnMuZGF0YVR5cGUudG9Mb3dlckNhc2UoKSA9PT0gXCJqc29ucFwiO1xyXG5cdFx0dmFyIHNlcmlhbGl6ZSA9IHhock9wdGlvbnMuc2VyaWFsaXplID0gaXNKU09OUCA/IGlkZW50aXR5IDogeGhyT3B0aW9ucy5zZXJpYWxpemUgfHwgSlNPTi5zdHJpbmdpZnk7XHJcblx0XHR2YXIgZGVzZXJpYWxpemUgPSB4aHJPcHRpb25zLmRlc2VyaWFsaXplID0gaXNKU09OUCA/IGlkZW50aXR5IDogeGhyT3B0aW9ucy5kZXNlcmlhbGl6ZSB8fCBKU09OLnBhcnNlO1xyXG5cdFx0dmFyIGV4dHJhY3QgPSBpc0pTT05QID8gZnVuY3Rpb24oanNvbnApIHtyZXR1cm4ganNvbnAucmVzcG9uc2VUZXh0fSA6IHhock9wdGlvbnMuZXh0cmFjdCB8fCBmdW5jdGlvbih4aHIpIHtcclxuXHRcdFx0cmV0dXJuIHhoci5yZXNwb25zZVRleHQubGVuZ3RoID09PSAwICYmIGRlc2VyaWFsaXplID09PSBKU09OLnBhcnNlID8gbnVsbCA6IHhoci5yZXNwb25zZVRleHRcclxuXHRcdH07XHJcblx0XHR4aHJPcHRpb25zLm1ldGhvZCA9ICh4aHJPcHRpb25zLm1ldGhvZCB8fCAnR0VUJykudG9VcHBlckNhc2UoKTtcclxuXHRcdHhock9wdGlvbnMudXJsID0gcGFyYW1ldGVyaXplVXJsKHhock9wdGlvbnMudXJsLCB4aHJPcHRpb25zLmRhdGEpO1xyXG5cdFx0eGhyT3B0aW9ucyA9IGJpbmREYXRhKHhock9wdGlvbnMsIHhock9wdGlvbnMuZGF0YSwgc2VyaWFsaXplKTtcclxuXHRcdHhock9wdGlvbnMub25sb2FkID0geGhyT3B0aW9ucy5vbmVycm9yID0gZnVuY3Rpb24oZSkge1xyXG5cdFx0XHR0cnkge1xyXG5cdFx0XHRcdGUgPSBlIHx8IGV2ZW50O1xyXG5cdFx0XHRcdHZhciB1bndyYXAgPSAoZS50eXBlID09PSBcImxvYWRcIiA/IHhock9wdGlvbnMudW53cmFwU3VjY2VzcyA6IHhock9wdGlvbnMudW53cmFwRXJyb3IpIHx8IGlkZW50aXR5O1xyXG5cdFx0XHRcdHZhciByZXNwb25zZSA9IHVud3JhcChkZXNlcmlhbGl6ZShleHRyYWN0KGUudGFyZ2V0LCB4aHJPcHRpb25zKSksIGUudGFyZ2V0KTtcclxuXHRcdFx0XHRpZiAoZS50eXBlID09PSBcImxvYWRcIikge1xyXG5cdFx0XHRcdFx0aWYgKHR5cGUuY2FsbChyZXNwb25zZSkgPT09IEFSUkFZICYmIHhock9wdGlvbnMudHlwZSkge1xyXG5cdFx0XHRcdFx0XHRmb3IgKHZhciBpID0gMDsgaSA8IHJlc3BvbnNlLmxlbmd0aDsgaSsrKSByZXNwb25zZVtpXSA9IG5ldyB4aHJPcHRpb25zLnR5cGUocmVzcG9uc2VbaV0pXHJcblx0XHRcdFx0XHR9XHJcblx0XHRcdFx0XHRlbHNlIGlmICh4aHJPcHRpb25zLnR5cGUpIHJlc3BvbnNlID0gbmV3IHhock9wdGlvbnMudHlwZShyZXNwb25zZSlcclxuXHRcdFx0XHR9XHJcblx0XHRcdFx0ZGVmZXJyZWRbZS50eXBlID09PSBcImxvYWRcIiA/IFwicmVzb2x2ZVwiIDogXCJyZWplY3RcIl0ocmVzcG9uc2UpXHJcblx0XHRcdH1cclxuXHRcdFx0Y2F0Y2ggKGUpIHtcclxuXHRcdFx0XHRtLmRlZmVycmVkLm9uZXJyb3IoZSk7XHJcblx0XHRcdFx0ZGVmZXJyZWQucmVqZWN0KGUpXHJcblx0XHRcdH1cclxuXHRcdFx0aWYgKHhock9wdGlvbnMuYmFja2dyb3VuZCAhPT0gdHJ1ZSkgbS5lbmRDb21wdXRhdGlvbigpXHJcblx0XHR9O1xyXG5cdFx0YWpheCh4aHJPcHRpb25zKTtcclxuXHRcdGRlZmVycmVkLnByb21pc2UgPSBwcm9waWZ5KGRlZmVycmVkLnByb21pc2UsIHhock9wdGlvbnMuaW5pdGlhbFZhbHVlKTtcclxuXHRcdHJldHVybiBkZWZlcnJlZC5wcm9taXNlXHJcblx0fTtcclxuXHJcblx0Ly90ZXN0aW5nIEFQSVxyXG5cdG0uZGVwcyA9IGZ1bmN0aW9uKG1vY2spIHtcclxuXHRcdGluaXRpYWxpemUod2luZG93ID0gbW9jayB8fCB3aW5kb3cpO1xyXG5cdFx0cmV0dXJuIHdpbmRvdztcclxuXHR9O1xyXG5cdC8vZm9yIGludGVybmFsIHRlc3Rpbmcgb25seSwgZG8gbm90IHVzZSBgbS5kZXBzLmZhY3RvcnlgXHJcblx0bS5kZXBzLmZhY3RvcnkgPSBhcHA7XHJcblxyXG5cdHJldHVybiBtXHJcbn0pKHR5cGVvZiB3aW5kb3cgIT0gXCJ1bmRlZmluZWRcIiA/IHdpbmRvdyA6IHt9KTtcclxuXHJcbmlmICh0eXBlb2YgbW9kdWxlICE9IFwidW5kZWZpbmVkXCIgJiYgbW9kdWxlICE9PSBudWxsICYmIG1vZHVsZS5leHBvcnRzKSBtb2R1bGUuZXhwb3J0cyA9IG07XHJcbmVsc2UgaWYgKHR5cGVvZiBkZWZpbmUgPT09IFwiZnVuY3Rpb25cIiAmJiBkZWZpbmUuYW1kKSBkZWZpbmUoZnVuY3Rpb24oKSB7cmV0dXJuIG19KTtcclxuIiwiLypcblx0bWl0aHJpbC5hbmltYXRlIC0gQ29weXJpZ2h0IDIwMTQganNndXlcblx0TUlUIExpY2Vuc2VkLlxuKi9cbihmdW5jdGlvbigpe1xudmFyIG1pdGhyaWxBbmltYXRlID0gZnVuY3Rpb24gKG0pIHtcblx0Ly9cdEtub3duIHByZWZpZXhcblx0dmFyIHByZWZpeGVzID0gWydNb3onLCAnV2Via2l0JywgJ0todG1sJywgJ08nLCAnbXMnXSxcblx0dHJhbnNpdGlvblByb3BzID0gWydUcmFuc2l0aW9uUHJvcGVydHknLCAnVHJhbnNpdGlvblRpbWluZ0Z1bmN0aW9uJywgJ1RyYW5zaXRpb25EZWxheScsICdUcmFuc2l0aW9uRHVyYXRpb24nLCAnVHJhbnNpdGlvbkVuZCddLFxuXHR0cmFuc2Zvcm1Qcm9wcyA9IFsncm90YXRlJywgJ3JvdGF0ZXgnLCAncm90YXRleScsICdzY2FsZScsICdza2V3JywgJ3RyYW5zbGF0ZScsICd0cmFuc2xhdGV4JywgJ3RyYW5zbGF0ZXknLCAnbWF0cml4J10sXG5cblx0ZGVmYXVsdER1cmF0aW9uID0gNDAwLFxuXG5cdGVyciA9IGZ1bmN0aW9uKG1zZyl7XG5cdFx0KHR5cGVvZiB3aW5kb3cgIT0gXCJ1bmRlZmluZWRcIikgJiYgd2luZG93LmNvbnNvbGUgJiYgY29uc29sZS5lcnJvciAmJiBjb25zb2xlLmVycm9yKG1zZyk7XG5cdH0sXG5cdFxuXHQvL1x0Q2FwaXRhbGlzZVx0XHRcblx0Y2FwID0gZnVuY3Rpb24oc3RyKXtcblx0XHRyZXR1cm4gc3RyLmNoYXJBdCgwKS50b1VwcGVyQ2FzZSgpICsgc3RyLnN1YnN0cigxKTtcblx0fSxcblxuXHQvL1x0Rm9yIGNoZWNraW5nIHdoYXQgdmVuZG9yIHByZWZpeGVzIGFyZSBuYXRpdmVcblx0ZGl2ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2JyksXG5cblx0Ly9cdHZlbmRvciBwcmVmaXgsIGllOiB0cmFuc2l0aW9uRHVyYXRpb24gYmVjb21lcyBNb3pUcmFuc2l0aW9uRHVyYXRpb25cblx0dnAgPSBmdW5jdGlvbiAocHJvcCkge1xuXHRcdHZhciBwZjtcblx0XHQvL1x0SGFuZGxlIHVucHJlZml4ZWRcblx0XHRpZiAocHJvcCBpbiBkaXYuc3R5bGUpIHtcblx0XHRcdHJldHVybiBwcm9wO1xuXHRcdH1cblxuXHRcdC8vXHRIYW5kbGUga2V5ZnJhbWVzXG5cdFx0aWYocHJvcCA9PSBcIkBrZXlmcmFtZXNcIikge1xuXHRcdFx0Zm9yICh2YXIgaSA9IDA7IGkgPCBwcmVmaXhlcy5sZW5ndGg7IGkgKz0gMSkge1xuXHRcdFx0XHQvL1x0VGVzdGluZyB1c2luZyB0cmFuc2l0aW9uXG5cdFx0XHRcdHBmID0gcHJlZml4ZXNbaV0gKyBcIlRyYW5zaXRpb25cIjtcblx0XHRcdFx0aWYgKHBmIGluIGRpdi5zdHlsZSkge1xuXHRcdFx0XHRcdHJldHVybiBcIkAtXCIgKyBwcmVmaXhlc1tpXS50b0xvd2VyQ2FzZSgpICsgXCIta2V5ZnJhbWVzXCI7XG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHRcdHJldHVybiBwcm9wO1xuXHRcdH1cblxuXHRcdGZvciAodmFyIGkgPSAwOyBpIDwgcHJlZml4ZXMubGVuZ3RoOyBpICs9IDEpIHtcblx0XHRcdHBmID0gcHJlZml4ZXNbaV0gKyBjYXAocHJvcCk7XG5cdFx0XHRpZiAocGYgaW4gZGl2LnN0eWxlKSB7XG5cdFx0XHRcdHJldHVybiBwZjtcblx0XHRcdH1cblx0XHR9XG5cdFx0Ly9cdENhbid0IGZpbmQgaXQgLSByZXR1cm4gb3JpZ2luYWwgcHJvcGVydHkuXG5cdFx0cmV0dXJuIHByb3A7XG5cdH0sXG5cblx0Ly9cdFNlZSBpZiB3ZSBjYW4gdXNlIG5hdGl2ZSB0cmFuc2l0aW9uc1xuXHRzdXBwb3J0c1RyYW5zaXRpb25zID0gZnVuY3Rpb24oKSB7XG5cdFx0dmFyIGIgPSBkb2N1bWVudC5ib2R5IHx8IGRvY3VtZW50LmRvY3VtZW50RWxlbWVudCxcblx0XHRcdHMgPSBiLnN0eWxlLFxuXHRcdFx0cCA9ICd0cmFuc2l0aW9uJztcblxuXHRcdGlmICh0eXBlb2Ygc1twXSA9PSAnc3RyaW5nJykgeyByZXR1cm4gdHJ1ZTsgfVxuXG5cdFx0Ly8gVGVzdHMgZm9yIHZlbmRvciBzcGVjaWZpYyBwcm9wXG5cdFx0cCA9IHAuY2hhckF0KDApLnRvVXBwZXJDYXNlKCkgKyBwLnN1YnN0cigxKTtcblxuXHRcdGZvciAodmFyIGk9MDsgaTxwcmVmaXhlcy5sZW5ndGg7IGkrKykge1xuXHRcdFx0aWYgKHR5cGVvZiBzW3ByZWZpeGVzW2ldICsgcF0gPT0gJ3N0cmluZycpIHsgcmV0dXJuIHRydWU7IH1cblx0XHR9XG5cblx0XHRyZXR1cm4gZmFsc2U7XG5cdH0sXG5cblx0Ly9cdENvbnZlcnRzIENTUyB0cmFuc2l0aW9uIHRpbWVzIHRvIE1TXG5cdGdldFRpbWVpbk1TID0gZnVuY3Rpb24oc3RyKSB7XG5cdFx0dmFyIHJlc3VsdCA9IDAsIHRtcDtcblx0XHRzdHIgKz0gXCJcIjtcblx0XHRzdHIgPSBzdHIudG9Mb3dlckNhc2UoKTtcblx0XHRpZihzdHIuaW5kZXhPZihcIm1zXCIpICE9PSAtMSkge1xuXHRcdFx0dG1wID0gc3RyLnNwbGl0KFwibXNcIik7XG5cdFx0XHRyZXN1bHQgPSBOdW1iZXIodG1wWzBdKTtcblx0XHR9IGVsc2UgaWYoc3RyLmluZGV4T2YoXCJzXCIpICE9PSAtMSkge1xuXHRcdFx0Ly9cdHNcblx0XHRcdHRtcCA9IHN0ci5zcGxpdChcInNcIik7XG5cdFx0XHRyZXN1bHQgPSBOdW1iZXIodG1wWzBdKSAqIDEwMDA7XG5cdFx0fSBlbHNlIHtcblx0XHRcdHJlc3VsdCA9IE51bWJlcihzdHIpO1xuXHRcdH1cblxuXHRcdHJldHVybiBNYXRoLnJvdW5kKHJlc3VsdCk7XG5cdH0sXG5cblx0Ly9cdFNldCBzdHlsZSBwcm9wZXJ0aWVzXG5cdHNldFN0eWxlUHJvcHMgPSBmdW5jdGlvbihvYmosIHByb3BzKXtcblx0XHRmb3IodmFyIGkgaW4gcHJvcHMpIHtpZihwcm9wcy5oYXNPd25Qcm9wZXJ0eShpKSkge1xuXHRcdFx0b2JqLnN0eWxlW3ZwKGkpXSA9IHByb3BzW2ldO1xuXHRcdH19XG5cdH0sXG5cblx0Ly9cdFNldCBwcm9wcyBmb3IgdHJhbnNpdGlvbnMgYW5kIHRyYW5zZm9ybXMgd2l0aCBiYXNpYyBkZWZhdWx0c1xuXHRzZXRUcmFuc2l0aW9uUHJvcHMgPSBmdW5jdGlvbihhcmdzKXtcblx0XHR2YXIgcHJvcHMgPSB7XG5cdFx0XHRcdC8vXHRlYXNlLCBsaW5lYXIsIGVhc2UtaW4sIGVhc2Utb3V0LCBlYXNlLWluLW91dCwgY3ViaWMtYmV6aWVyKG4sbixuLG4pIGluaXRpYWwsIGluaGVyaXRcblx0XHRcdFx0VHJhbnNpdGlvblRpbWluZ0Z1bmN0aW9uOiBcImVhc2VcIixcblx0XHRcdFx0VHJhbnNpdGlvbkR1cmF0aW9uOiBkZWZhdWx0RHVyYXRpb24gKyBcIm1zXCIsXG5cdFx0XHRcdFRyYW5zaXRpb25Qcm9wZXJ0eTogXCJhbGxcIlxuXHRcdFx0fSxcblx0XHRcdHAsIGksIHRtcCwgdG1wMiwgZm91bmQ7XG5cblx0XHQvL1x0U2V0IGFueSBhbGxvd2VkIHByb3BlcnRpZXMgXG5cdFx0Zm9yKHAgaW4gYXJncykgeyBpZihhcmdzLmhhc093blByb3BlcnR5KHApKSB7XG5cdFx0XHR0bXAgPSAnVHJhbnNpdGlvbicgKyBjYXAocCk7XG5cdFx0XHR0bXAyID0gcC50b0xvd2VyQ2FzZSgpO1xuXHRcdFx0Zm91bmQgPSBmYWxzZTtcblxuXHRcdFx0Ly9cdExvb2sgYXQgdHJhbnNpdGlvbiBwcm9wc1xuXHRcdFx0Zm9yKGkgPSAwOyBpIDwgdHJhbnNpdGlvblByb3BzLmxlbmd0aDsgaSArPSAxKSB7XG5cdFx0XHRcdGlmKHRtcCA9PSB0cmFuc2l0aW9uUHJvcHNbaV0pIHtcblx0XHRcdFx0XHRwcm9wc1t0cmFuc2l0aW9uUHJvcHNbaV1dID0gYXJnc1twXTtcblx0XHRcdFx0XHRmb3VuZCA9IHRydWU7XG5cdFx0XHRcdFx0YnJlYWs7XG5cdFx0XHRcdH1cblx0XHRcdH1cblxuXHRcdFx0Ly9cdExvb2sgYXQgdHJhbnNmb3JtIHByb3BzXG5cdFx0XHRmb3IoaSA9IDA7IGkgPCB0cmFuc2Zvcm1Qcm9wcy5sZW5ndGg7IGkgKz0gMSkge1xuXHRcdFx0XHRpZih0bXAyID09IHRyYW5zZm9ybVByb3BzW2ldKSB7XG5cdFx0XHRcdFx0cHJvcHNbdnAoXCJ0cmFuc2Zvcm1cIildID0gcHJvcHNbdnAoXCJ0cmFuc2Zvcm1cIildIHx8IFwiXCI7XG5cdFx0XHRcdFx0cHJvcHNbdnAoXCJ0cmFuc2Zvcm1cIildICs9IFwiIFwiICtwICsgXCIoXCIgKyBhcmdzW3BdICsgXCIpXCI7XG5cdFx0XHRcdFx0Zm91bmQgPSB0cnVlO1xuXHRcdFx0XHRcdGJyZWFrO1xuXHRcdFx0XHR9XG5cdFx0XHR9XG5cblx0XHRcdGlmKCFmb3VuZCkge1xuXHRcdFx0XHRwcm9wc1twXSA9IGFyZ3NbcF07XG5cdFx0XHR9XG5cdFx0fX1cblx0XHRyZXR1cm4gcHJvcHM7XG5cdH0sXG5cblx0Ly9cdEZpeCBhbmltYXRpdW9uIHByb3BlcnRpZXNcblx0Ly9cdE5vcm1hbGlzZXMgdHJhbnNmb3JtcywgZWc6IHJvdGF0ZSwgc2NhbGUsIGV0Yy4uLlxuXHRub3JtYWxpc2VUcmFuc2Zvcm1Qcm9wcyA9IGZ1bmN0aW9uKGFyZ3Mpe1xuXHRcdHZhciBwcm9wcyA9IHt9LFxuXHRcdFx0dG1wUHJvcCxcblx0XHRcdHAsIGksIGZvdW5kLFxuXHRcdFx0bm9ybWFsID0gZnVuY3Rpb24ocHJvcHMsIHAsIHZhbHVlKXtcblx0XHRcdFx0dmFyIHRtcCA9IHAudG9Mb3dlckNhc2UoKSxcblx0XHRcdFx0XHRmb3VuZCA9IGZhbHNlLCBpO1xuXG5cdFx0XHRcdC8vXHRMb29rIGF0IHRyYW5zZm9ybSBwcm9wc1xuXHRcdFx0XHRmb3IoaSA9IDA7IGkgPCB0cmFuc2Zvcm1Qcm9wcy5sZW5ndGg7IGkgKz0gMSkge1xuXHRcdFx0XHRcdGlmKHRtcCA9PSB0cmFuc2Zvcm1Qcm9wc1tpXSkge1xuXHRcdFx0XHRcdFx0cHJvcHNbdnAoXCJ0cmFuc2Zvcm1cIildID0gcHJvcHNbdnAoXCJ0cmFuc2Zvcm1cIildIHx8IFwiXCI7XG5cdFx0XHRcdFx0XHRwcm9wc1t2cChcInRyYW5zZm9ybVwiKV0gKz0gXCIgXCIgK3AgKyBcIihcIiArIHZhbHVlICsgXCIpXCI7XG5cdFx0XHRcdFx0XHRmb3VuZCA9IHRydWU7XG5cdFx0XHRcdFx0XHRicmVhaztcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH1cblxuXHRcdFx0XHRpZighZm91bmQpIHtcblx0XHRcdFx0XHRwcm9wc1twXSA9IHZhbHVlO1xuXHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdC8vXHRSZW1vdmUgdHJhbnNmb3JtIHByb3BlcnR5XG5cdFx0XHRcdFx0ZGVsZXRlIHByb3BzW3BdO1xuXHRcdFx0XHR9XG5cdFx0XHR9O1xuXG5cdFx0Ly9cdFNldCBhbnkgYWxsb3dlZCBwcm9wZXJ0aWVzIFxuXHRcdGZvcihwIGluIGFyZ3MpIHsgaWYoYXJncy5oYXNPd25Qcm9wZXJ0eShwKSkge1xuXHRcdFx0Ly9cdElmIHdlIGhhdmUgYSBwZXJjZW50YWdlLCB3ZSBoYXZlIGEga2V5IGZyYW1lXG5cdFx0XHRpZihwLmluZGV4T2YoXCIlXCIpICE9PSAtMSkge1xuXHRcdFx0XHRmb3IoaSBpbiBhcmdzW3BdKSB7IGlmKGFyZ3NbcF0uaGFzT3duUHJvcGVydHkoaSkpIHtcblx0XHRcdFx0XHRub3JtYWwoYXJnc1twXSwgaSwgYXJnc1twXVtpXSk7XG5cdFx0XHRcdH19XG5cdFx0XHRcdHByb3BzW3BdID0gYXJnc1twXTtcblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdG5vcm1hbChwcm9wcywgcCwgYXJnc1twXSk7XG5cdFx0XHR9XG5cdFx0fX1cblxuXHRcdHJldHVybiBwcm9wcztcblx0fSxcblxuXG5cdC8vXHRJZiBhbiBvYmplY3QgaXMgZW1wdHlcblx0aXNFbXB0eSA9IGZ1bmN0aW9uKG9iaikge1xuXHRcdGZvcih2YXIgaSBpbiBvYmopIHtpZihvYmouaGFzT3duUHJvcGVydHkoaSkpIHtcblx0XHRcdHJldHVybiBmYWxzZTtcblx0XHR9fVxuXHRcdHJldHVybiB0cnVlOyBcblx0fSxcblx0Ly9cdENyZWF0ZXMgYSBoYXNoZWQgbmFtZSBmb3IgdGhlIGFuaW1hdGlvblxuXHQvL1x0VXNlIHRvIGNyZWF0ZSBhIHVuaXF1ZSBrZXlmcmFtZSBhbmltYXRpb24gc3R5bGUgcnVsZVxuXHRhbmlOYW1lID0gZnVuY3Rpb24ocHJvcHMpe1xuXHRcdHJldHVybiBcImFuaVwiICsgSlNPTi5zdHJpbmdpZnkocHJvcHMpLnNwbGl0KC9be30sJVwiOl0vKS5qb2luKFwiXCIpO1xuXHR9LFxuXHRhbmltYXRpb25zID0ge30sXG5cblx0Ly9cdFNlZSBpZiB3ZSBjYW4gdXNlIHRyYW5zaXRpb25zXG5cdGNhblRyYW5zID0gc3VwcG9ydHNUcmFuc2l0aW9ucygpO1xuXG5cdC8vXHRJRTEwKyBodHRwOi8vY2FuaXVzZS5jb20vI3NlYXJjaD1jc3MtYW5pbWF0aW9uc1xuXHRtLmFuaW1hdGVQcm9wZXJ0aWVzID0gZnVuY3Rpb24oZWwsIGFyZ3MsIGNiKXtcblx0XHRlbC5zdHlsZSA9IGVsLnN0eWxlIHx8IHt9O1xuXHRcdHZhciBwcm9wcyA9IHNldFRyYW5zaXRpb25Qcm9wcyhhcmdzKSwgdGltZTtcblxuXHRcdGlmKHR5cGVvZiBwcm9wcy5UcmFuc2l0aW9uRHVyYXRpb24gIT09ICd1bmRlZmluZWQnKSB7XG5cdFx0XHRwcm9wcy5UcmFuc2l0aW9uRHVyYXRpb24gPSBnZXRUaW1laW5NUyhwcm9wcy5UcmFuc2l0aW9uRHVyYXRpb24pICsgXCJtc1wiO1xuXHRcdH0gZWxzZSB7XG5cdFx0XHRwcm9wcy5UcmFuc2l0aW9uRHVyYXRpb24gPSBkZWZhdWx0RHVyYXRpb24gKyBcIm1zXCI7XG5cdFx0fVxuXG5cdFx0dGltZSA9IGdldFRpbWVpbk1TKHByb3BzLlRyYW5zaXRpb25EdXJhdGlvbikgfHwgMDtcblxuXHRcdC8vXHRTZWUgaWYgd2Ugc3VwcG9ydCB0cmFuc2l0aW9uc1xuXHRcdGlmKGNhblRyYW5zKSB7XG5cdFx0XHRzZXRTdHlsZVByb3BzKGVsLCBwcm9wcyk7XG5cdFx0fSBlbHNlIHtcblx0XHRcdC8vXHRUcnkgYW5kIGZhbGwgYmFjayB0byBqUXVlcnlcblx0XHRcdC8vXHRUT0RPOiBTd2l0Y2ggdG8gdXNlIHZlbG9jaXR5LCBpdCBpcyBiZXR0ZXIgc3VpdGVkLlxuXHRcdFx0aWYodHlwZW9mICQgIT09ICd1bmRlZmluZWQnICYmICQuZm4gJiYgJC5mbi5hbmltYXRlKSB7XG5cdFx0XHRcdCQoZWwpLmFuaW1hdGUocHJvcHMsIHRpbWUpO1xuXHRcdFx0fVxuXHRcdH1cblxuXHRcdGlmKGNiKXtcblx0XHRcdHNldFRpbWVvdXQoY2IsIHRpbWUrMSk7XG5cdFx0fVxuXHR9O1xuXG5cdC8vXHRUcmlnZ2VyIGEgdHJhbnNpdGlvbiBhbmltYXRpb25cblx0bS50cmlnZ2VyID0gZnVuY3Rpb24obmFtZSwgdmFsdWUsIG9wdGlvbnMsIGNiKXtcblx0XHRvcHRpb25zID0gb3B0aW9ucyB8fCB7fTtcblx0XHR2YXIgYW5pID0gYW5pbWF0aW9uc1tuYW1lXTtcblx0XHRpZighYW5pKSB7XG5cdFx0XHRyZXR1cm4gZXJyKFwiQW5pbWF0aW9uIFwiICsgbmFtZSArIFwiIG5vdCBmb3VuZC5cIik7XG5cdFx0fVxuXG5cdFx0cmV0dXJuIGZ1bmN0aW9uKGUpe1xuXHRcdFx0dmFyIGFyZ3MgPSBhbmkuZm4oZnVuY3Rpb24oKXtcblx0XHRcdFx0cmV0dXJuIHR5cGVvZiB2YWx1ZSA9PSAnZnVuY3Rpb24nPyB2YWx1ZSgpOiB2YWx1ZTtcblx0XHRcdH0pO1xuXG5cdFx0XHQvL1x0QWxsb3cgb3ZlcnJpZGUgdmlhIG9wdGlvbnNcblx0XHRcdGZvcihpIGluIG9wdGlvbnMpIGlmKG9wdGlvbnMuaGFzT3duUHJvcGVydHkoaSkpIHt7XG5cdFx0XHRcdGFyZ3NbaV0gPSBvcHRpb25zW2ldO1xuXHRcdFx0fX1cblxuXHRcdFx0bS5hbmltYXRlUHJvcGVydGllcyhlLnRhcmdldCwgYXJncywgY2IpO1xuXHRcdH07XG5cdH07XG5cblx0Ly9cdEFkZHMgYW4gYW5pbWF0aW9uIGZvciBiaW5kaW5ncyBhbmQgc28gb24uXG5cdG0uYWRkQW5pbWF0aW9uID0gZnVuY3Rpb24obmFtZSwgZm4sIG9wdGlvbnMpe1xuXHRcdG9wdGlvbnMgPSBvcHRpb25zIHx8IHt9O1xuXG5cdFx0aWYoYW5pbWF0aW9uc1tuYW1lXSkge1xuXHRcdFx0cmV0dXJuIGVycihcIkFuaW1hdGlvbiBcIiArIG5hbWUgKyBcIiBhbHJlYWR5IGRlZmluZWQuXCIpO1xuXHRcdH0gZWxzZSBpZih0eXBlb2YgZm4gIT09IFwiZnVuY3Rpb25cIikge1xuXHRcdFx0cmV0dXJuIGVycihcIkFuaW1hdGlvbiBcIiArIG5hbWUgKyBcIiBpcyBiZWluZyBhZGRlZCBhcyBhIHRyYW5zaXRpb24gYmFzZWQgYW5pbWF0aW9uLCBhbmQgbXVzdCB1c2UgYSBmdW5jdGlvbi5cIik7XG5cdFx0fVxuXG5cdFx0b3B0aW9ucy5kdXJhdGlvbiA9IG9wdGlvbnMuZHVyYXRpb24gfHwgZGVmYXVsdER1cmF0aW9uO1xuXG5cdFx0YW5pbWF0aW9uc1tuYW1lXSA9IHtcblx0XHRcdG9wdGlvbnM6IG9wdGlvbnMsXG5cdFx0XHRmbjogZm5cblx0XHR9O1xuXG5cdFx0Ly9cdEFkZCBhIGRlZmF1bHQgYmluZGluZyBmb3IgdGhlIG5hbWVcblx0XHRtLmFkZEJpbmRpbmcobmFtZSwgZnVuY3Rpb24ocHJvcCl7XG5cdFx0XHRtLmJpbmRBbmltYXRpb24obmFtZSwgdGhpcywgZm4sIHByb3ApO1xuXHRcdH0sIHRydWUpO1xuXHR9O1xuXG5cdG0uYWRkS0ZBbmltYXRpb24gPSBmdW5jdGlvbihuYW1lLCBhcmcsIG9wdGlvbnMpe1xuXHRcdG9wdGlvbnMgPSBvcHRpb25zIHx8IHt9O1xuXG5cdFx0aWYoYW5pbWF0aW9uc1tuYW1lXSkge1xuXHRcdFx0cmV0dXJuIGVycihcIkFuaW1hdGlvbiBcIiArIG5hbWUgKyBcIiBhbHJlYWR5IGRlZmluZWQuXCIpO1xuXHRcdH1cblxuXHRcdHZhciBpbml0ID0gZnVuY3Rpb24ocHJvcHMpIHtcblx0XHRcdHZhciBhbmlJZCA9IGFuaU5hbWUocHJvcHMpLFxuXHRcdFx0XHRoYXNBbmkgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChhbmlJZCksXG5cdFx0XHRcdGtmO1xuXG5cdFx0XHQvL1x0T25seSBpbnNlcnQgb25jZVxuXHRcdFx0aWYoIWhhc0FuaSkge1xuXHRcdFx0XHRhbmltYXRpb25zW25hbWVdLmlkID0gYW5pSWQ7XG5cblx0XHRcdFx0cHJvcHMgPSBub3JtYWxpc2VUcmFuc2Zvcm1Qcm9wcyhwcm9wcyk7XG5cdFx0XHRcdC8vICBDcmVhdGUga2V5ZnJhbWVzXG5cdFx0XHRcdGtmID0gdnAoXCJAa2V5ZnJhbWVzXCIpICsgXCIgXCIgKyBhbmlJZCArIFwiIFwiICsgSlNPTi5zdHJpbmdpZnkocHJvcHMpXG5cdFx0XHRcdFx0LnNwbGl0KFwiXFxcIlwiKS5qb2luKFwiXCIpXG5cdFx0XHRcdFx0LnNwbGl0KFwifSxcIikuam9pbihcIn1cXG5cIilcblx0XHRcdFx0XHQuc3BsaXQoXCIsXCIpLmpvaW4oXCI7XCIpXG5cdFx0XHRcdFx0LnNwbGl0KFwiJTpcIikuam9pbihcIiUgXCIpO1xuXG5cdFx0XHRcdHZhciBzID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnc3R5bGUnKTtcblx0XHRcdFx0cy5zZXRBdHRyaWJ1dGUoJ2lkJywgYW5pSWQpO1xuXHRcdFx0XHRzLmlkID0gYW5pSWQ7XG5cdFx0XHRcdHMudGV4dENvbnRlbnQgPSBrZjtcblx0XHRcdFx0Ly8gIE1pZ2h0IG5vdCBoYXZlIGhlYWQ/XG5cdFx0XHRcdGRvY3VtZW50LmhlYWQuYXBwZW5kQ2hpbGQocyk7XG5cdFx0XHR9XG5cblx0XHRcdGFuaW1hdGlvbnNbbmFtZV0uaXNJbml0aWFsaXNlZCA9IHRydWU7XG5cdFx0XHRhbmltYXRpb25zW25hbWVdLm9wdGlvbnMuYW5pbWF0ZUltbWVkaWF0ZWx5ID0gdHJ1ZTtcblx0XHR9O1xuXG5cdFx0b3B0aW9ucy5kdXJhdGlvbiA9IG9wdGlvbnMuZHVyYXRpb24gfHwgZGVmYXVsdER1cmF0aW9uO1xuXHRcdG9wdGlvbnMuYW5pbWF0ZUltbWVkaWF0ZWx5ID0gb3B0aW9ucy5hbmltYXRlSW1tZWRpYXRlbHkgfHwgZmFsc2U7XG5cblx0XHRhbmltYXRpb25zW25hbWVdID0ge1xuXHRcdFx0aW5pdDogaW5pdCxcblx0XHRcdG9wdGlvbnM6IG9wdGlvbnMsXG5cdFx0XHRhcmc6IGFyZ1xuXHRcdH07XG5cblx0XHQvL1x0QWRkIGEgZGVmYXVsdCBiaW5kaW5nIGZvciB0aGUgbmFtZVxuXHRcdG0uYWRkQmluZGluZyhuYW1lLCBmdW5jdGlvbihwcm9wKXtcblx0XHRcdG0uYmluZEFuaW1hdGlvbihuYW1lLCB0aGlzLCBhcmcsIHByb3ApO1xuXHRcdH0sIHRydWUpO1xuXHR9O1xuXG5cblx0LypcdE9wdGlvbnMgLSBkZWZhdWx0cyAtIHdoYXQgaXQgZG9lczpcblxuXHRcdERlbGF5IC0gdW5lZGVmaW5lZCAtIGRlbGF5cyB0aGUgYW5pbWF0aW9uXG5cdFx0RGlyZWN0aW9uIC0gXG5cdFx0RHVyYXRpb25cblx0XHRGaWxsTW9kZSAtIFwiZm9yd2FyZFwiIG1ha2VzIHN1cmUgaXQgc3RpY2tzOiBodHRwOi8vd3d3Lnczc2Nob29scy5jb20vY3NzcmVmL2NzczNfcHJfYW5pbWF0aW9uLWZpbGwtbW9kZS5hc3Bcblx0XHRJdGVyYXRpb25Db3VudCwgXG5cdFx0TmFtZSwgUGxheVN0YXRlLCBUaW1pbmdGdW5jdGlvblxuXHRcblx0Ki9cblxuXHQvL1x0VXNlZnVsIHRvIGtub3csICd0bycgYW5kICdmcm9tJzogaHR0cDovL2xlYS52ZXJvdS5tZS8yMDEyLzEyL2FuaW1hdGlvbnMtd2l0aC1vbmUta2V5ZnJhbWUvXG5cdG0uYW5pbWF0ZUtGID0gZnVuY3Rpb24obmFtZSwgZWwsIG9wdGlvbnMsIGNiKXtcblx0XHRvcHRpb25zID0gb3B0aW9ucyB8fCB7fTtcblx0XHR2YXIgYW5pID0gYW5pbWF0aW9uc1tuYW1lXSwgaSwgcHJvcHMgPSB7fTtcblx0XHRpZighYW5pKSB7XG5cdFx0XHRyZXR1cm4gZXJyKFwiQW5pbWF0aW9uIFwiICsgbmFtZSArIFwiIG5vdCBmb3VuZC5cIik7XG5cdFx0fVxuXG5cdFx0Ly9cdEFsbG93IG92ZXJyaWRlIHZpYSBvcHRpb25zXG5cdFx0YW5pLm9wdGlvbnMgPSBhbmkub3B0aW9ucyB8fCB7fTtcblx0XHRmb3IoaSBpbiBvcHRpb25zKSBpZihvcHRpb25zLmhhc093blByb3BlcnR5KGkpKSB7e1xuXHRcdFx0YW5pLm9wdGlvbnNbaV0gPSBvcHRpb25zW2ldO1xuXHRcdH19XG5cblx0XHRpZighYW5pLmlzSW5pdGlhbGlzZWQgJiYgYW5pLmluaXQpIHtcblx0XHRcdGFuaS5pbml0KGFuaS5hcmcpO1xuXHRcdH1cblxuXHRcdC8vXHRBbGxvdyBhbmltYXRlIG92ZXJyaWRlc1xuXHRcdGZvcihpIGluIGFuaS5vcHRpb25zKSBpZihhbmkub3B0aW9ucy5oYXNPd25Qcm9wZXJ0eShpKSkge3tcblx0XHRcdHByb3BzW3ZwKFwiYW5pbWF0aW9uXCIgKyBjYXAoaSkpXSA9IGFuaS5vcHRpb25zW2ldO1xuXHRcdH19XG5cblx0XHQvL1x0U2V0IHJlcXVpcmVkIGl0ZW1zIGFuZCBkZWZhdWx0IHZhbHVlcyBmb3IgcHJvcHNcblx0XHRwcm9wc1t2cChcImFuaW1hdGlvbk5hbWVcIildID0gYW5pLmlkO1xuXHRcdHByb3BzW3ZwKFwiYW5pbWF0aW9uRHVyYXRpb25cIildID0gKHByb3BzW3ZwKFwiYW5pbWF0aW9uRHVyYXRpb25cIildPyBwcm9wc1t2cChcImFuaW1hdGlvbkR1cmF0aW9uXCIpXTogZGVmYXVsdER1cmF0aW9uKSArIFwibXNcIjtcblx0XHRwcm9wc1t2cChcImFuaW1hdGlvbkRlbGF5XCIpXSA9IHByb3BzW3ZwKFwiYW5pbWF0aW9uRGVsYXlcIildPyBwcm9wc1t2cChcImFuaW1hdGlvbkR1cmF0aW9uXCIpXSArIFwibXNcIjogdW5kZWZpbmVkO1xuXHRcdHByb3BzW3ZwKFwiYW5pbWF0aW9uRmlsbE1vZGVcIildID0gcHJvcHNbdnAoXCJhbmltYXRpb25GaWxsTW9kZVwiKV0gfHwgXCJmb3J3YXJkc1wiO1xuXG5cdFx0ZWwuc3R5bGUgPSBlbC5zdHlsZSB8fCB7fTtcblxuXHRcdC8vXHRVc2UgZm9yIGNhbGxiYWNrXG5cdFx0dmFyIGVuZEFuaSA9IGZ1bmN0aW9uKCl7XG5cdFx0XHQvL1x0UmVtb3ZlIGxpc3RlbmVyXG5cdFx0XHRlbC5yZW1vdmVFdmVudExpc3RlbmVyKFwiYW5pbWF0aW9uZW5kXCIsIGVuZEFuaSwgZmFsc2UpO1xuXHRcdFx0aWYoY2Ipe1xuXHRcdFx0XHRjYihlbCk7XG5cdFx0XHR9XG5cdFx0fTtcblxuXHRcdC8vXHRSZW1vdmUgYW5pbWF0aW9uIGlmIGFueVxuXHRcdGVsLnN0eWxlW3ZwKFwiYW5pbWF0aW9uXCIpXSA9IFwiXCI7XG5cdFx0ZWwuc3R5bGVbdnAoXCJhbmltYXRpb25OYW1lXCIpXSA9IFwiXCI7XG5cblx0XHQvL1x0TXVzdCB1c2UgdHdvIHJlcXVlc3QgYW5pbWF0aW9uIGZyYW1lIGNhbGxzLCBmb3IgRkYgdG9cblx0XHQvL1x0d29yayBwcm9wZXJseSwgZG9lcyBub3Qgc2VlbSB0byBoYXZlIGFueSBhZHZlcnNlIGVmZmVjdHNcblx0XHRyZXF1ZXN0QW5pbWF0aW9uRnJhbWUoZnVuY3Rpb24oKXtcblx0XHRcdHJlcXVlc3RBbmltYXRpb25GcmFtZShmdW5jdGlvbigpe1xuXHRcdFx0XHQvL1x0QXBwbHkgcHJvcHNcblx0XHRcdFx0Zm9yKGkgaW4gcHJvcHMpIGlmKHByb3BzLmhhc093blByb3BlcnR5KGkpKSB7e1xuXHRcdFx0XHRcdGVsLnN0eWxlW2ldID0gcHJvcHNbaV07XG5cdFx0XHRcdH19XG5cblx0XHRcdFx0ZWwuYWRkRXZlbnRMaXN0ZW5lcihcImFuaW1hdGlvbmVuZFwiLCBlbmRBbmksIGZhbHNlKTtcblx0XHRcdH0pO1xuXHRcdH0pO1xuXHR9O1xuXG5cdG0udHJpZ2dlcktGID0gZnVuY3Rpb24obmFtZSwgb3B0aW9ucyl7XG5cdFx0cmV0dXJuIGZ1bmN0aW9uKCl7XG5cdFx0XHRtLmFuaW1hdGVLRihuYW1lLCB0aGlzLCBvcHRpb25zKTtcblx0XHR9O1xuXHR9O1xuXG5cdG0uYmluZEFuaW1hdGlvbiA9IGZ1bmN0aW9uKG5hbWUsIGVsLCBvcHRpb25zLCBwcm9wKSB7XG5cdFx0dmFyIGFuaSA9IGFuaW1hdGlvbnNbbmFtZV07XG5cblx0XHRpZighYW5pICYmICFhbmkubmFtZSkge1xuXHRcdFx0cmV0dXJuIGVycihcIkFuaW1hdGlvbiBcIiArIG5hbWUgKyBcIiBub3QgZm91bmQuXCIpO1xuXHRcdH1cblxuXHRcdGlmKGFuaS5mbikge1xuXHRcdFx0bS5hbmltYXRlUHJvcGVydGllcyhlbCwgYW5pLmZuKHByb3ApKTtcblx0XHR9IGVsc2Uge1xuXHRcdFx0dmFyIG9sZENvbmZpZyA9IGVsLmNvbmZpZztcblx0XHRcdGVsLmNvbmZpZyA9IGZ1bmN0aW9uKGVsLCBpc0luaXQpe1xuXHRcdFx0XHRpZighYW5pLmlzSW5pdGlhbGlzZWQgJiYgYW5pLmluaXQpIHtcblx0XHRcdFx0XHRhbmkuaW5pdChvcHRpb25zKTtcblx0XHRcdFx0fVxuXHRcdFx0XHRpZihwcm9wKCkgJiYgaXNJbml0KSB7XG5cdFx0XHRcdFx0bS5hbmltYXRlS0YobmFtZSwgZWwsIG9wdGlvbnMpO1xuXHRcdFx0XHR9XG5cdFx0XHRcdGlmKG9sZENvbmZpZykge1xuXHRcdFx0XHRcdG9sZENvbmZpZy5hcHBseShlbCwgYXJndW1lbnRzKTtcblx0XHRcdFx0fVxuXHRcdFx0fTtcblx0XHR9XG5cdH07XG5cblxuXG5cdC8qIERlZmF1bHQgdHJhbnNmb3JtMmQgYmluZGluZ3MgKi9cblx0dmFyIGJhc2ljQmluZGluZ3MgPSBbJ3NjYWxlJywgJ3NjYWxleCcsICdzY2FsZXknLCAndHJhbnNsYXRlJywgJ3RyYW5zbGF0ZXgnLCAndHJhbnNsYXRleScsIFxuXHRcdCdtYXRyaXgnLCAnYmFja2dyb3VuZENvbG9yJywgJ2JhY2tncm91bmRQb3NpdGlvbicsICdib3JkZXJCb3R0b21Db2xvcicsIFxuXHRcdCdib3JkZXJCb3R0b21XaWR0aCcsICdib3JkZXJMZWZ0Q29sb3InLCAnYm9yZGVyTGVmdFdpZHRoJywgJ2JvcmRlclJpZ2h0Q29sb3InLCBcblx0XHQnYm9yZGVyUmlnaHRXaWR0aCcsICdib3JkZXJTcGFjaW5nJywgJ2JvcmRlclRvcENvbG9yJywgJ2JvcmRlclRvcFdpZHRoJywgJ2JvdHRvbScsIFxuXHRcdCdjbGlwJywgJ2NvbG9yJywgJ2ZvbnRTaXplJywgJ2ZvbnRXZWlnaHQnLCAnaGVpZ2h0JywgJ2xlZnQnLCAnbGV0dGVyU3BhY2luZycsIFxuXHRcdCdsaW5lSGVpZ2h0JywgJ21hcmdpbkJvdHRvbScsICdtYXJnaW5MZWZ0JywgJ21hcmdpblJpZ2h0JywgJ21hcmdpblRvcCcsICdtYXhIZWlnaHQnLCBcblx0XHQnbWF4V2lkdGgnLCAnbWluSGVpZ2h0JywgJ21pbldpZHRoJywgJ29wYWNpdHknLCAnb3V0bGluZUNvbG9yJywgJ291dGxpbmVXaWR0aCcsIFxuXHRcdCdwYWRkaW5nQm90dG9tJywgJ3BhZGRpbmdMZWZ0JywgJ3BhZGRpbmdSaWdodCcsICdwYWRkaW5nVG9wJywgJ3JpZ2h0JywgJ3RleHRJbmRlbnQnLCBcblx0XHQndGV4dFNoYWRvdycsICd0b3AnLCAndmVydGljYWxBbGlnbicsICd2aXNpYmlsaXR5JywgJ3dpZHRoJywgJ3dvcmRTcGFjaW5nJywgJ3pJbmRleCddLFxuXHRcdGRlZ0JpbmRpbmdzID0gWydyb3RhdGUnLCAncm90YXRleCcsICdyb3RhdGV5JywgJ3NrZXd4JywgJ3NrZXd5J10sIGk7XG5cblx0Ly9cdEJhc2ljIGJpbmRpbmdzIHdoZXJlIHdlIHBhc3MgdGhlIHByb3Agc3RyYWlnaHQgdGhyb3VnaFxuXHRmb3IoaSA9IDA7IGkgPCBiYXNpY0JpbmRpbmdzLmxlbmd0aDsgaSArPSAxKSB7XG5cdFx0KGZ1bmN0aW9uKG5hbWUpe1xuXHRcdFx0bS5hZGRBbmltYXRpb24obmFtZSwgZnVuY3Rpb24ocHJvcCl7XG5cdFx0XHRcdHZhciBvcHRpb25zID0ge307XG5cdFx0XHRcdG9wdGlvbnNbbmFtZV0gPSBwcm9wKCk7XG5cdFx0XHRcdHJldHVybiBvcHRpb25zO1xuXHRcdFx0fSk7XG5cdFx0fShiYXNpY0JpbmRpbmdzW2ldKSk7XG5cdH1cblxuXHQvL1x0RGVncmVlIGJhc2VkIGJpbmRpbmdzIC0gY29uZGl0aW9uYWxseSBwb3N0Zml4IHdpdGggXCJkZWdcIlxuXHRmb3IoaSA9IDA7IGkgPCBkZWdCaW5kaW5ncy5sZW5ndGg7IGkgKz0gMSkge1xuXHRcdChmdW5jdGlvbihuYW1lKXtcblx0XHRcdG0uYWRkQW5pbWF0aW9uKG5hbWUsIGZ1bmN0aW9uKHByb3Ape1xuXHRcdFx0XHR2YXIgb3B0aW9ucyA9IHt9LCB2YWx1ZSA9IHByb3AoKTtcblx0XHRcdFx0b3B0aW9uc1tuYW1lXSA9IGlzTmFOKHZhbHVlKT8gdmFsdWU6IHZhbHVlICsgXCJkZWdcIjtcblx0XHRcdFx0cmV0dXJuIG9wdGlvbnM7XG5cdFx0XHR9KTtcblx0XHR9KGRlZ0JpbmRpbmdzW2ldKSk7XG5cdH1cblxuXHQvL1x0QXR0cmlidXRlcyB0aGF0IHJlcXVpcmUgbW9yZSB0aGFuIG9uZSBwcm9wXG5cdG0uYWRkQW5pbWF0aW9uKFwic2tld1wiLCBmdW5jdGlvbihwcm9wKXtcblx0XHR2YXIgdmFsdWUgPSBwcm9wKCk7XG5cdFx0cmV0dXJuIHtcblx0XHRcdHNrZXc6IFtcblx0XHRcdFx0dmFsdWVbMF0gKyAoaXNOYU4odmFsdWVbMF0pPyBcIlwiOlwiZGVnXCIpLCBcblx0XHRcdFx0dmFsdWVbMV0gKyAoaXNOYU4odmFsdWVbMV0pPyBcIlwiOlwiZGVnXCIpXG5cdFx0XHRdXG5cdFx0fTtcblx0fSk7XG5cblxuXG5cdC8vXHRBIGZldyBtb3JlIGJpbmRpbmdzXG5cdG0gPSBtIHx8IHt9O1xuXHQvL1x0SGlkZSBub2RlXG5cdG0uYWRkQmluZGluZyhcImhpZGVcIiwgZnVuY3Rpb24ocHJvcCl7XG5cdFx0dGhpcy5zdHlsZSA9IHtcblx0XHRcdGRpc3BsYXk6IG0udW53cmFwKHByb3ApPyBcIm5vbmVcIiA6IFwiXCJcblx0XHR9O1xuXHR9LCB0cnVlKTtcblxuXHQvL1x0VG9nZ2xlIGJvb2xlYW4gdmFsdWUgb24gY2xpY2tcblx0bS5hZGRCaW5kaW5nKCd0b2dnbGUnLCBmdW5jdGlvbihwcm9wKXtcblx0XHR0aGlzLm9uY2xpY2sgPSBmdW5jdGlvbigpe1xuXHRcdFx0dmFyIHZhbHVlID0gcHJvcCgpO1xuXHRcdFx0cHJvcCghdmFsdWUpO1xuXHRcdH1cblx0fSwgdHJ1ZSk7XG5cblx0Ly9cdFNldCBob3ZlciBzdGF0ZXMsIGEnbGEgalF1ZXJ5IHBhdHRlcm5cblx0bS5hZGRCaW5kaW5nKCdob3ZlcicsIGZ1bmN0aW9uKHByb3Ape1xuXHRcdHRoaXMub25tb3VzZW92ZXIgPSBwcm9wWzBdO1xuXHRcdGlmKHByb3BbMV0pIHtcblx0XHRcdHRoaXMub25tb3VzZW91dCA9IHByb3BbMV07XG5cdFx0fVxuXHR9LCB0cnVlICk7XG5cblxufTtcblxuXG5cblxuXG5cblxuaWYgKHR5cGVvZiBtb2R1bGUgIT0gXCJ1bmRlZmluZWRcIiAmJiBtb2R1bGUgIT09IG51bGwgJiYgbW9kdWxlLmV4cG9ydHMpIHtcblx0bW9kdWxlLmV4cG9ydHMgPSBtaXRocmlsQW5pbWF0ZTtcbn0gZWxzZSBpZiAodHlwZW9mIGRlZmluZSA9PT0gXCJmdW5jdGlvblwiICYmIGRlZmluZS5hbWQpIHtcblx0ZGVmaW5lKGZ1bmN0aW9uKCkge1xuXHRcdHJldHVybiBtaXRocmlsQW5pbWF0ZTtcblx0fSk7XG59IGVsc2Uge1xuXHRtaXRocmlsQW5pbWF0ZSh0eXBlb2Ygd2luZG93ICE9IFwidW5kZWZpbmVkXCI/IHdpbmRvdy5tIHx8IHt9OiB7fSk7XG59XG5cbn0oKSk7IiwiLyogTk9URTogVGhpcyBpcyBhIGdlbmVyYXRlZCBmaWxlLCBwbGVhc2UgZG8gbm90IG1vZGlmeSBpdCwgeW91ciBjaGFuZ2VzIHdpbGwgYmUgbG9zdCAqL1xubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbihtKXtcblx0dmFyIGdldE1vZGVsRGF0YSA9IGZ1bmN0aW9uKG1vZGVsKXtcblx0XHR2YXIgaSwgcmVzdWx0ID0ge307XG5cdFx0Zm9yKGkgaW4gbW9kZWwpIHtpZihtb2RlbC5oYXNPd25Qcm9wZXJ0eShpKSkge1xuXHRcdFx0aWYoaSAhPT0gJ2lzVmFsaWQnKSB7XG5cdFx0XHRcdGlmKGkgPT0gJ2lkJykge1xuXHRcdFx0XHRcdHJlc3VsdFsnX2lkJ10gPSAodHlwZW9mIG1vZGVsW2ldID09ICdmdW5jdGlvbicpPyBtb2RlbFtpXSgpOiBtb2RlbFtpXTtcblx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHRyZXN1bHRbaV0gPSAodHlwZW9mIG1vZGVsW2ldID09ICdmdW5jdGlvbicpPyBtb2RlbFtpXSgpOiBtb2RlbFtpXTtcblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdH19XG5cdFx0cmV0dXJuIHJlc3VsdDtcblx0fTtcblx0cmV0dXJuIHtcbidmaW5kJzogZnVuY3Rpb24oYXJncywgb3B0aW9ucyl7XG5cdGFyZ3MgPSBhcmdzIHx8IHt9O1xuXHRvcHRpb25zID0gb3B0aW9ucyB8fCB7fTtcblx0dmFyIHJlcXVlc3RPYmogPSB7XG5cdFx0XHRtZXRob2Q6J3Bvc3QnLCBcblx0XHRcdHVybDogJy9hcGkvYXV0aGVudGljYXRpb24vZmluZCcsXG5cdFx0XHRkYXRhOiBhcmdzXG5cdFx0fSxcblx0XHRyb290Tm9kZSA9IGRvY3VtZW50LmRvY3VtZW50RWxlbWVudCB8fCBkb2N1bWVudC5ib2R5O1xuXHRmb3IodmFyIGkgaW4gb3B0aW9ucykge2lmKG9wdGlvbnMuaGFzT3duUHJvcGVydHkoaSkpe1xuXHRcdHJlcXVlc3RPYmpbaV0gPSBvcHRpb25zW2ldO1xuXHR9fVxuXHRpZihhcmdzLm1vZGVsKSB7XG4gXHRcdGFyZ3MubW9kZWwgPSBnZXRNb2RlbERhdGEoYXJncy5tb2RlbCk7XG5cdH1cblx0cm9vdE5vZGUuY2xhc3NOYW1lICs9ICcgbG9hZGluZyc7XG5cdHZhciBteURlZmVycmVkID0gbS5kZWZlcnJlZCgpO1xuXHRtLnJlcXVlc3QocmVxdWVzdE9iaikudGhlbihmdW5jdGlvbigpe1xuXHRcdHJvb3ROb2RlLmNsYXNzTmFtZSA9IHJvb3ROb2RlLmNsYXNzTmFtZS5zcGxpdCgnIGxvYWRpbmcnKS5qb2luKCcnKTtcblx0XHRteURlZmVycmVkLnJlc29sdmUuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcblx0XHRpZihyZXF1ZXN0T2JqLmJhY2tncm91bmQpe1xuXHRcdFx0bS5yZWRyYXcodHJ1ZSk7XG5cdFx0fVxuXHR9KTtcblx0cmV0dXJuIG15RGVmZXJyZWQucHJvbWlzZTtcbn0sXG4nc2F2ZSc6IGZ1bmN0aW9uKGFyZ3MsIG9wdGlvbnMpe1xuXHRhcmdzID0gYXJncyB8fCB7fTtcblx0b3B0aW9ucyA9IG9wdGlvbnMgfHwge307XG5cdHZhciByZXF1ZXN0T2JqID0ge1xuXHRcdFx0bWV0aG9kOidwb3N0JywgXG5cdFx0XHR1cmw6ICcvYXBpL2F1dGhlbnRpY2F0aW9uL3NhdmUnLFxuXHRcdFx0ZGF0YTogYXJnc1xuXHRcdH0sXG5cdFx0cm9vdE5vZGUgPSBkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQgfHwgZG9jdW1lbnQuYm9keTtcblx0Zm9yKHZhciBpIGluIG9wdGlvbnMpIHtpZihvcHRpb25zLmhhc093blByb3BlcnR5KGkpKXtcblx0XHRyZXF1ZXN0T2JqW2ldID0gb3B0aW9uc1tpXTtcblx0fX1cblx0aWYoYXJncy5tb2RlbCkge1xuIFx0XHRhcmdzLm1vZGVsID0gZ2V0TW9kZWxEYXRhKGFyZ3MubW9kZWwpO1xuXHR9XG5cdHJvb3ROb2RlLmNsYXNzTmFtZSArPSAnIGxvYWRpbmcnO1xuXHR2YXIgbXlEZWZlcnJlZCA9IG0uZGVmZXJyZWQoKTtcblx0bS5yZXF1ZXN0KHJlcXVlc3RPYmopLnRoZW4oZnVuY3Rpb24oKXtcblx0XHRyb290Tm9kZS5jbGFzc05hbWUgPSByb290Tm9kZS5jbGFzc05hbWUuc3BsaXQoJyBsb2FkaW5nJykuam9pbignJyk7XG5cdFx0bXlEZWZlcnJlZC5yZXNvbHZlLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG5cdFx0aWYocmVxdWVzdE9iai5iYWNrZ3JvdW5kKXtcblx0XHRcdG0ucmVkcmF3KHRydWUpO1xuXHRcdH1cblx0fSk7XG5cdHJldHVybiBteURlZmVycmVkLnByb21pc2U7XG59LFxuJ3JlbW92ZSc6IGZ1bmN0aW9uKGFyZ3MsIG9wdGlvbnMpe1xuXHRhcmdzID0gYXJncyB8fCB7fTtcblx0b3B0aW9ucyA9IG9wdGlvbnMgfHwge307XG5cdHZhciByZXF1ZXN0T2JqID0ge1xuXHRcdFx0bWV0aG9kOidwb3N0JywgXG5cdFx0XHR1cmw6ICcvYXBpL2F1dGhlbnRpY2F0aW9uL3JlbW92ZScsXG5cdFx0XHRkYXRhOiBhcmdzXG5cdFx0fSxcblx0XHRyb290Tm9kZSA9IGRvY3VtZW50LmRvY3VtZW50RWxlbWVudCB8fCBkb2N1bWVudC5ib2R5O1xuXHRmb3IodmFyIGkgaW4gb3B0aW9ucykge2lmKG9wdGlvbnMuaGFzT3duUHJvcGVydHkoaSkpe1xuXHRcdHJlcXVlc3RPYmpbaV0gPSBvcHRpb25zW2ldO1xuXHR9fVxuXHRpZihhcmdzLm1vZGVsKSB7XG4gXHRcdGFyZ3MubW9kZWwgPSBnZXRNb2RlbERhdGEoYXJncy5tb2RlbCk7XG5cdH1cblx0cm9vdE5vZGUuY2xhc3NOYW1lICs9ICcgbG9hZGluZyc7XG5cdHZhciBteURlZmVycmVkID0gbS5kZWZlcnJlZCgpO1xuXHRtLnJlcXVlc3QocmVxdWVzdE9iaikudGhlbihmdW5jdGlvbigpe1xuXHRcdHJvb3ROb2RlLmNsYXNzTmFtZSA9IHJvb3ROb2RlLmNsYXNzTmFtZS5zcGxpdCgnIGxvYWRpbmcnKS5qb2luKCcnKTtcblx0XHRteURlZmVycmVkLnJlc29sdmUuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcblx0XHRpZihyZXF1ZXN0T2JqLmJhY2tncm91bmQpe1xuXHRcdFx0bS5yZWRyYXcodHJ1ZSk7XG5cdFx0fVxuXHR9KTtcblx0cmV0dXJuIG15RGVmZXJyZWQucHJvbWlzZTtcbn0sXG4nYXV0aGVudGljYXRlJzogZnVuY3Rpb24oYXJncywgb3B0aW9ucyl7XG5cdGFyZ3MgPSBhcmdzIHx8IHt9O1xuXHRvcHRpb25zID0gb3B0aW9ucyB8fCB7fTtcblx0dmFyIHJlcXVlc3RPYmogPSB7XG5cdFx0XHRtZXRob2Q6J3Bvc3QnLCBcblx0XHRcdHVybDogJy9hcGkvYXV0aGVudGljYXRpb24vYXV0aGVudGljYXRlJyxcblx0XHRcdGRhdGE6IGFyZ3Ncblx0XHR9LFxuXHRcdHJvb3ROb2RlID0gZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50IHx8IGRvY3VtZW50LmJvZHk7XG5cdGZvcih2YXIgaSBpbiBvcHRpb25zKSB7aWYob3B0aW9ucy5oYXNPd25Qcm9wZXJ0eShpKSl7XG5cdFx0cmVxdWVzdE9ialtpXSA9IG9wdGlvbnNbaV07XG5cdH19XG5cdGlmKGFyZ3MubW9kZWwpIHtcbiBcdFx0YXJncy5tb2RlbCA9IGdldE1vZGVsRGF0YShhcmdzLm1vZGVsKTtcblx0fVxuXHRyb290Tm9kZS5jbGFzc05hbWUgKz0gJyBsb2FkaW5nJztcblx0dmFyIG15RGVmZXJyZWQgPSBtLmRlZmVycmVkKCk7XG5cdG0ucmVxdWVzdChyZXF1ZXN0T2JqKS50aGVuKGZ1bmN0aW9uKCl7XG5cdFx0cm9vdE5vZGUuY2xhc3NOYW1lID0gcm9vdE5vZGUuY2xhc3NOYW1lLnNwbGl0KCcgbG9hZGluZycpLmpvaW4oJycpO1xuXHRcdG15RGVmZXJyZWQucmVzb2x2ZS5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuXHRcdGlmKHJlcXVlc3RPYmouYmFja2dyb3VuZCl7XG5cdFx0XHRtLnJlZHJhdyh0cnVlKTtcblx0XHR9XG5cdH0pO1xuXHRyZXR1cm4gbXlEZWZlcnJlZC5wcm9taXNlO1xufSxcbidsb2dpbic6IGZ1bmN0aW9uKGFyZ3MsIG9wdGlvbnMpe1xuXHRhcmdzID0gYXJncyB8fCB7fTtcblx0b3B0aW9ucyA9IG9wdGlvbnMgfHwge307XG5cdHZhciByZXF1ZXN0T2JqID0ge1xuXHRcdFx0bWV0aG9kOidwb3N0JywgXG5cdFx0XHR1cmw6ICcvYXBpL2F1dGhlbnRpY2F0aW9uL2xvZ2luJyxcblx0XHRcdGRhdGE6IGFyZ3Ncblx0XHR9LFxuXHRcdHJvb3ROb2RlID0gZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50IHx8IGRvY3VtZW50LmJvZHk7XG5cdGZvcih2YXIgaSBpbiBvcHRpb25zKSB7aWYob3B0aW9ucy5oYXNPd25Qcm9wZXJ0eShpKSl7XG5cdFx0cmVxdWVzdE9ialtpXSA9IG9wdGlvbnNbaV07XG5cdH19XG5cdGlmKGFyZ3MubW9kZWwpIHtcbiBcdFx0YXJncy5tb2RlbCA9IGdldE1vZGVsRGF0YShhcmdzLm1vZGVsKTtcblx0fVxuXHRyb290Tm9kZS5jbGFzc05hbWUgKz0gJyBsb2FkaW5nJztcblx0dmFyIG15RGVmZXJyZWQgPSBtLmRlZmVycmVkKCk7XG5cdG0ucmVxdWVzdChyZXF1ZXN0T2JqKS50aGVuKGZ1bmN0aW9uKCl7XG5cdFx0cm9vdE5vZGUuY2xhc3NOYW1lID0gcm9vdE5vZGUuY2xhc3NOYW1lLnNwbGl0KCcgbG9hZGluZycpLmpvaW4oJycpO1xuXHRcdG15RGVmZXJyZWQucmVzb2x2ZS5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuXHRcdGlmKHJlcXVlc3RPYmouYmFja2dyb3VuZCl7XG5cdFx0XHRtLnJlZHJhdyh0cnVlKTtcblx0XHR9XG5cdH0pO1xuXHRyZXR1cm4gbXlEZWZlcnJlZC5wcm9taXNlO1xufSxcbidsb2dvdXQnOiBmdW5jdGlvbihhcmdzLCBvcHRpb25zKXtcblx0YXJncyA9IGFyZ3MgfHwge307XG5cdG9wdGlvbnMgPSBvcHRpb25zIHx8IHt9O1xuXHR2YXIgcmVxdWVzdE9iaiA9IHtcblx0XHRcdG1ldGhvZDoncG9zdCcsIFxuXHRcdFx0dXJsOiAnL2FwaS9hdXRoZW50aWNhdGlvbi9sb2dvdXQnLFxuXHRcdFx0ZGF0YTogYXJnc1xuXHRcdH0sXG5cdFx0cm9vdE5vZGUgPSBkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQgfHwgZG9jdW1lbnQuYm9keTtcblx0Zm9yKHZhciBpIGluIG9wdGlvbnMpIHtpZihvcHRpb25zLmhhc093blByb3BlcnR5KGkpKXtcblx0XHRyZXF1ZXN0T2JqW2ldID0gb3B0aW9uc1tpXTtcblx0fX1cblx0aWYoYXJncy5tb2RlbCkge1xuIFx0XHRhcmdzLm1vZGVsID0gZ2V0TW9kZWxEYXRhKGFyZ3MubW9kZWwpO1xuXHR9XG5cdHJvb3ROb2RlLmNsYXNzTmFtZSArPSAnIGxvYWRpbmcnO1xuXHR2YXIgbXlEZWZlcnJlZCA9IG0uZGVmZXJyZWQoKTtcblx0bS5yZXF1ZXN0KHJlcXVlc3RPYmopLnRoZW4oZnVuY3Rpb24oKXtcblx0XHRyb290Tm9kZS5jbGFzc05hbWUgPSByb290Tm9kZS5jbGFzc05hbWUuc3BsaXQoJyBsb2FkaW5nJykuam9pbignJyk7XG5cdFx0bXlEZWZlcnJlZC5yZXNvbHZlLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG5cdFx0aWYocmVxdWVzdE9iai5iYWNrZ3JvdW5kKXtcblx0XHRcdG0ucmVkcmF3KHRydWUpO1xuXHRcdH1cblx0fSk7XG5cdHJldHVybiBteURlZmVycmVkLnByb21pc2U7XG59LFxuJ2ZpbmRVc2Vycyc6IGZ1bmN0aW9uKGFyZ3MsIG9wdGlvbnMpe1xuXHRhcmdzID0gYXJncyB8fCB7fTtcblx0b3B0aW9ucyA9IG9wdGlvbnMgfHwge307XG5cdHZhciByZXF1ZXN0T2JqID0ge1xuXHRcdFx0bWV0aG9kOidwb3N0JywgXG5cdFx0XHR1cmw6ICcvYXBpL2F1dGhlbnRpY2F0aW9uL2ZpbmRVc2VycycsXG5cdFx0XHRkYXRhOiBhcmdzXG5cdFx0fSxcblx0XHRyb290Tm9kZSA9IGRvY3VtZW50LmRvY3VtZW50RWxlbWVudCB8fCBkb2N1bWVudC5ib2R5O1xuXHRmb3IodmFyIGkgaW4gb3B0aW9ucykge2lmKG9wdGlvbnMuaGFzT3duUHJvcGVydHkoaSkpe1xuXHRcdHJlcXVlc3RPYmpbaV0gPSBvcHRpb25zW2ldO1xuXHR9fVxuXHRpZihhcmdzLm1vZGVsKSB7XG4gXHRcdGFyZ3MubW9kZWwgPSBnZXRNb2RlbERhdGEoYXJncy5tb2RlbCk7XG5cdH1cblx0cm9vdE5vZGUuY2xhc3NOYW1lICs9ICcgbG9hZGluZyc7XG5cdHZhciBteURlZmVycmVkID0gbS5kZWZlcnJlZCgpO1xuXHRtLnJlcXVlc3QocmVxdWVzdE9iaikudGhlbihmdW5jdGlvbigpe1xuXHRcdHJvb3ROb2RlLmNsYXNzTmFtZSA9IHJvb3ROb2RlLmNsYXNzTmFtZS5zcGxpdCgnIGxvYWRpbmcnKS5qb2luKCcnKTtcblx0XHRteURlZmVycmVkLnJlc29sdmUuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcblx0XHRpZihyZXF1ZXN0T2JqLmJhY2tncm91bmQpe1xuXHRcdFx0bS5yZWRyYXcodHJ1ZSk7XG5cdFx0fVxuXHR9KTtcblx0cmV0dXJuIG15RGVmZXJyZWQucHJvbWlzZTtcbn0sXG4nc2F2ZVVzZXInOiBmdW5jdGlvbihhcmdzLCBvcHRpb25zKXtcblx0YXJncyA9IGFyZ3MgfHwge307XG5cdG9wdGlvbnMgPSBvcHRpb25zIHx8IHt9O1xuXHR2YXIgcmVxdWVzdE9iaiA9IHtcblx0XHRcdG1ldGhvZDoncG9zdCcsIFxuXHRcdFx0dXJsOiAnL2FwaS9hdXRoZW50aWNhdGlvbi9zYXZlVXNlcicsXG5cdFx0XHRkYXRhOiBhcmdzXG5cdFx0fSxcblx0XHRyb290Tm9kZSA9IGRvY3VtZW50LmRvY3VtZW50RWxlbWVudCB8fCBkb2N1bWVudC5ib2R5O1xuXHRmb3IodmFyIGkgaW4gb3B0aW9ucykge2lmKG9wdGlvbnMuaGFzT3duUHJvcGVydHkoaSkpe1xuXHRcdHJlcXVlc3RPYmpbaV0gPSBvcHRpb25zW2ldO1xuXHR9fVxuXHRpZihhcmdzLm1vZGVsKSB7XG4gXHRcdGFyZ3MubW9kZWwgPSBnZXRNb2RlbERhdGEoYXJncy5tb2RlbCk7XG5cdH1cblx0cm9vdE5vZGUuY2xhc3NOYW1lICs9ICcgbG9hZGluZyc7XG5cdHZhciBteURlZmVycmVkID0gbS5kZWZlcnJlZCgpO1xuXHRtLnJlcXVlc3QocmVxdWVzdE9iaikudGhlbihmdW5jdGlvbigpe1xuXHRcdHJvb3ROb2RlLmNsYXNzTmFtZSA9IHJvb3ROb2RlLmNsYXNzTmFtZS5zcGxpdCgnIGxvYWRpbmcnKS5qb2luKCcnKTtcblx0XHRteURlZmVycmVkLnJlc29sdmUuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcblx0XHRpZihyZXF1ZXN0T2JqLmJhY2tncm91bmQpe1xuXHRcdFx0bS5yZWRyYXcodHJ1ZSk7XG5cdFx0fVxuXHR9KTtcblx0cmV0dXJuIG15RGVmZXJyZWQucHJvbWlzZTtcbn1cblx0fTtcbn07IiwiLyogTk9URTogVGhpcyBpcyBhIGdlbmVyYXRlZCBmaWxlLCBwbGVhc2UgZG8gbm90IG1vZGlmeSBpdCwgeW91ciBjaGFuZ2VzIHdpbGwgYmUgbG9zdCAqL3ZhciBtID0gcmVxdWlyZSgnbWl0aHJpbCcpO3ZhciBzdWdhcnRhZ3MgPSByZXF1aXJlKCdtaXRocmlsLnN1Z2FydGFncycpKG0pO3ZhciBiaW5kaW5ncyA9IHJlcXVpcmUoJ21pdGhyaWwuYmluZGluZ3MnKShtKTt2YXIgYW5pbWF0ZSA9IHJlcXVpcmUoJy4uL3B1YmxpYy9qcy9taXRocmlsLmFuaW1hdGUuanMnKShtKTt2YXIgcGVybWlzc2lvbnMgPSByZXF1aXJlKCcuLi9zeXN0ZW0vbWlzby5wZXJtaXNzaW9ucy5qcycpO3ZhciBsYXlvdXQgPSByZXF1aXJlKCcuLi9tdmMvbGF5b3V0X3BsYWluLmpzJyk7dmFyIHJlc3RyaWN0ID0gZnVuY3Rpb24ocm91dGUsIGFjdGlvbk5hbWUpe1x0cmV0dXJuIHJvdXRlO307dmFyIHBlcm1pc3Npb25PYmogPSB7fTt2YXIgaG9tZSA9IHJlcXVpcmUoJy4uL212Yy9ob21lLmpzJyk7aWYodHlwZW9mIHdpbmRvdyAhPT0gJ3VuZGVmaW5lZCcpIHtcdHdpbmRvdy5tID0gbTt9XHRtLnJvdXRlLm1vZGUgPSAncGF0aG5hbWUnO20ucm91dGUoZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ21pc29BdHRhY2htZW50Tm9kZScpLCAnLycsIHsnLyc6IHJlc3RyaWN0KGhvbWUuaW5kZXgsICdob21lLmluZGV4Jyl9KTttaXNvR2xvYmFsLnJlbmRlckhlYWRlciA9IGZ1bmN0aW9uKG9iail7XHR2YXIgaGVhZGVyTm9kZSA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdtaXNvSGVhZGVyTm9kZScpO1x0aWYoaGVhZGVyTm9kZSl7XHRcdG0ucmVuZGVyKGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdtaXNvSGVhZGVyTm9kZScpLCBsYXlvdXQuaGVhZGVyQ29udGVudD8gbGF5b3V0LmhlYWRlckNvbnRlbnQoe21pc29HbG9iYWw6IG9iaiB8fCBtaXNvR2xvYmFsfSk6ICcnKTtcdH19O21pc29HbG9iYWwucmVuZGVySGVhZGVyKCk7IiwiLypcdG1pc28gcGVybWlzc2lvbnNcblx0UGVybWl0IHVzZXJzIGFjY2VzcyB0byBjb250cm9sbGVyIGFjdGlvbnMgYmFzZWQgb24gcm9sZXMgXG4qL1xudmFyIG1pc28gPSByZXF1aXJlKFwiLi4vbW9kdWxlcy9taXNvLnV0aWwuY2xpZW50LmpzXCIpLFxuXHRoYXNSb2xlID0gZnVuY3Rpb24odXNlclJvbGVzLCByb2xlcyl7XG5cdFx0dmFyIGhhc1JvbGUgPSBmYWxzZTtcblx0XHQvL1x0QWxsIHJvbGVzXG5cdFx0aWYodXNlclJvbGVzID09IFwiKlwiKSB7XG5cdFx0XHRyZXR1cm4gdHJ1ZTtcblx0XHR9XG5cdFx0Ly9cdFNlYXJjaCBlYWNoIHVzZXIgcm9sZVxuXHRcdG1pc28uZWFjaCh1c2VyUm9sZXMsIGZ1bmN0aW9uKHVzZXJSb2xlKXtcblx0XHRcdHVzZXJSb2xlID0gKHR5cGVvZiB1c2VyUm9sZSAhPT0gXCJzdHJpbmdcIik/IHVzZXJSb2xlOiBbdXNlclJvbGVdO1xuXHRcdFx0Ly9cdFNlYXJjaCBlYWNoIHJvbGVcblx0XHRcdG1pc28uZWFjaChyb2xlcywgZnVuY3Rpb24ocm9sZSl7XG5cdFx0XHRcdGlmKHVzZXJSb2xlID09IHJvbGUpIHtcblx0XHRcdFx0XHRoYXNSb2xlID0gdHJ1ZTtcblx0XHRcdFx0XHRyZXR1cm4gZmFsc2U7XG5cdFx0XHRcdH1cblx0XHRcdH0pO1xuXHRcdH0pO1xuXHRcdHJldHVybiBoYXNSb2xlO1xuXHR9O1xuXG4vL1x0RGV0ZXJtaW5lIGlmIHRoZSB1c2VyIGhhcyBhY2Nlc3MgdG8gYW4gQVBQIGFjdGlvblxuLy9cdFRPRE86IFxubW9kdWxlLmV4cG9ydHMuYXBwID0gZnVuY3Rpb24ocGVybWlzc2lvbnMsIGFjdGlvbk5hbWUsIHVzZXJSb2xlcyl7XG5cdC8vXHRUT0RPOiBQcm9iYWJseSBuZWVkIHRvIHVzZSBwYXNzPWZhbHNlIGJ5IGRlZmF1bHQsIGJ1dCBmaXJzdDpcblx0Ly9cblx0Ly9cdCogQWRkIGdsb2JhbCBjb25maWcgZm9yIHBhc3MgZGVmYXVsdCBpbiBzZXJ2ZXIuanNvblxuXHQvL1x0KiBcblx0Ly9cblx0dmFyIHBhc3MgPSB0cnVlO1xuXG5cdC8vXHRBcHBseSBkZW55IGZpcnN0LCB0aGVuIGFsbG93LlxuXHRpZihwZXJtaXNzaW9ucyAmJiB1c2VyUm9sZXMpe1xuXHRcdGlmKHBlcm1pc3Npb25zLmRlbnkpIHtcblx0XHRcdHBhc3MgPSAhIGhhc1JvbGUodXNlci5yb2xlcywgcGVybWlzc2lvbnMuZGVueSk7XG5cdFx0fVxuXHRcdGlmKHBlcm1pc3Npb25zLmFsbG93KSB7XG5cdFx0XHRwYXNzID0gaGFzUm9sZSh1c2VyLnJvbGVzLCBwZXJtaXNzaW9ucy5hbGxvdyk7XG5cdFx0fVxuXHR9XG5cblx0cmV0dXJuIHBhc3M7XG59O1xuXG5cbi8vXHREZXRlcm1pbmUgaWYgdGhlIHVzZXIgaGFzIGFjY2VzcyB0byBhbiBBUEkgYWN0aW9uXG4vL1x0VE9ETzogXG5tb2R1bGUuZXhwb3J0cy5hcGkgPSBmdW5jdGlvbihwZXJtaXNzaW9ucywgYWN0aW9uTmFtZSwgdXNlclJvbGVzKXtcblx0Ly9cdFRPRE86IFByb2JhYmx5IG5lZWQgdG8gdXNlIHBhc3M9ZmFsc2UgYnkgZGVmYXVsdCwgYnV0IGZpcnN0OlxuXHQvL1xuXHQvL1x0KiBBZGQgZ2xvYmFsIGNvbmZpZyBmb3IgcGFzcyBkZWZhdWx0IGluIHNlcnZlci5qc29uXG5cdC8vXHQqIFxuXHQvL1xuXHR2YXIgcGFzcyA9IHRydWU7XG5cblx0Ly9cdEFwcGx5IGRlbnkgZmlyc3QsIHRoZW4gYWxsb3cuXG5cdGlmKHBlcm1pc3Npb25zICYmIHVzZXJSb2xlcyl7XG5cdFx0aWYocGVybWlzc2lvbnMuZGVueSkge1xuXHRcdFx0cGFzcyA9ICEgaGFzUm9sZSh1c2VyLnJvbGVzLCBwZXJtaXNzaW9ucy5kZW55KTtcblx0XHR9XG5cdFx0aWYocGVybWlzc2lvbnMuYWxsb3cpIHtcblx0XHRcdHBhc3MgPSBoYXNSb2xlKHVzZXIucm9sZXMsIHBlcm1pc3Npb25zLmFsbG93KTtcblx0XHR9XG5cdH1cblxuXHRyZXR1cm4gcGFzcztcbn07Il19
