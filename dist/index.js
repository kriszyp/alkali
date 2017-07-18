(function webpackUniversalModuleDefinition(root, factory) {
	if(typeof exports === 'object' && typeof module === 'object')
		module.exports = factory();
	else if(typeof define === 'function' && define.amd)
		define([], factory);
	else if(typeof exports === 'object')
		exports["alkali"] = factory();
	else
		root["alkali"] = factory();
})(this, function() {
return /******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId])
/******/ 			return installedModules[moduleId].exports;
/******/
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			exports: {},
/******/ 			id: moduleId,
/******/ 			loaded: false
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.loaded = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(0);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ function(module, exports, __webpack_require__) {

	var __WEBPACK_AMD_DEFINE_FACTORY__, __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;/// <reference path="./typings.d.ts" />
	(function (root, factory) { if (true) {
	  !(__WEBPACK_AMD_DEFINE_ARRAY__ = [__webpack_require__(1), __webpack_require__(3), __webpack_require__(5), __webpack_require__(7), __webpack_require__(6), __webpack_require__(4), __webpack_require__(2)], __WEBPACK_AMD_DEFINE_FACTORY__ = (factory), __WEBPACK_AMD_DEFINE_RESULT__ = (typeof __WEBPACK_AMD_DEFINE_FACTORY__ === 'function' ? (__WEBPACK_AMD_DEFINE_FACTORY__.apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__)) : __WEBPACK_AMD_DEFINE_FACTORY__), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__)) } else if (typeof module === 'object' && module.exports) {        
	  module.exports = factory(require('./Element'), require('./Renderer'), require('./react'), require('./Copy'), require('./operators'), require('./Variable'), require('./util/lang')) // Node
	}}(this, function (Element, Renderer, react, Copy, operators, VariableExports, lang) {
	
		var main = Object.create(Element)
		main.Copy = Copy
		main.Element = Element
		lang.copy(main, VariableExports)
		Object.defineProperty(main, 'currentContext', Object.getOwnPropertyDescriptor(VariableExports, 'currentContext'))
		main.react = react
		main.spawn = lang.spawn
		main.Renderer = Renderer.ElementRenderer
		lang.copy(main, Renderer)
		lang.copy(main, operators)
		main.default = undefined // no default export
		return main
	}))

/***/ },
/* 1 */
/***/ function(module, exports, __webpack_require__) {

	var __WEBPACK_AMD_DEFINE_FACTORY__, __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;(function (root, factory) { if (true) {
		!(__WEBPACK_AMD_DEFINE_ARRAY__ = [__webpack_require__(2), __webpack_require__(3), __webpack_require__(4)], __WEBPACK_AMD_DEFINE_FACTORY__ = (factory), __WEBPACK_AMD_DEFINE_RESULT__ = (typeof __WEBPACK_AMD_DEFINE_FACTORY__ === 'function' ? (__WEBPACK_AMD_DEFINE_FACTORY__.apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__)) : __WEBPACK_AMD_DEFINE_FACTORY__), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__)) } else if (typeof module === 'object' && module.exports) {        
	  module.exports = factory(require('./util/lang'), require('./Renderer'), require('./Variable')) // Node
	}}(this, function (lang, Renderer, VariableExports) {
		var Variable = VariableExports.Variable
		var knownElementProperties = [
			'textContent', // Node
			'id', 'className', 'innerHTML', // Element
			'title', 'lang', 'translate', 'dir', 'tabIndex', 'accessKey', 'draggable', 'spellcheck', 'contentEditable', 'innerText', 'webkitdropzone'] // HTMLElement
	
		var SELECTOR_REGEX = /^(\.|#)([-\w]+)(.+)?/
		var isGenerator = lang.isGenerator
		var Context = VariableExports.Context
		var PropertyRenderer = Renderer.PropertyRenderer
		var InputPropertyRenderer = Renderer.InputPropertyRenderer
		var AttributeRenderer = Renderer.AttributeRenderer
		var StyleRenderer = lang.compose(Renderer.StyleRenderer, function StyleRenderer() {
			Renderer.StyleRenderer.apply(this, arguments)
		}, {
			renderUpdate: function(newValue, element) {
				var definition = styleDefinitions[this.name]
				if (definition) {
					definition(element, newValue, this.name)
				} else {
					element.style[this.name] = newValue
				}
			}
		})
	
		var ClassNameRenderer = lang.compose(Renderer.ElementRenderer, function ClassNameRenderer(options) {
			this.className = options.className
			Renderer.apply(this, arguments)
		}, {
			renderUpdate: function(newValue, element) {
				var currentClassName = element.className
				var changingClassName = this.className
				// remove the className (needed for addition or removal)
				// see http://jsperf.com/remove-class-name-algorithm/2 for some tests on this
				var removed = currentClassName && (' ' + currentClassName + ' ').replace(' ' + changingClassName + ' ', ' ')
				if (newValue) {
					// addition, add the className
					changingClassName = currentClassName ? (removed + changingClassName).slice(1) : changingClassName;
				} else {
					// we already have removed the class, just need to trim
					changingClassName = removed.slice(1, removed.length - 1)
				}
				// only assign if it changed, this can save a lot of time
				if (changingClassName != currentClassName) {
					element.className = changingClassName
				}
			}
		})
	
		// TODO: check for renderContent with text updater
		var TextRenderer = Renderer.TextRenderer
		var ListRenderer = Renderer.ListRenderer
	
		var doc = typeof document !== 'undefined' ? document : {
			createElement: function(tag) {
				return {}
			},
			addEventListener: function() {
			}
		}
	
		var inputs = {
			INPUT: 1,
			TEXTAREA: 1
			// SELECT: 1, we exclude this, so the default "content" of the element can be the options
		}
	
		var buggyConstructorSetter = false
		var testElement = doc.createElement('font')
		var originalConstructor = testElement.constructor
		testElement.constructor = function(){}
		if (doc.createElement('font').constructor == testElement.constructor) {
			// In safari, setting the constructor can actually assign it at the prototype level, instead of at the instance
			testElement.__proto__.constructor = originalConstructor // restore the original constructor
			buggyConstructorSetter = true
		}
	
	
		function booleanStyle(options) {
			return function(element, value, key) {
				if (typeof value !== 'string') {
					// use the boolean conversion
					value = options[value ? 0 : 1]
				}
				element.style[key] = value
			}
		}
	
		function defaultStyle(element, value, key) {
			if (typeof value === 'number') {
				value = value + 'px'
			}
			element.style[key] = value
		}
		function directStyle(element, value, key) {
			element.style[key] = value
		}
	
		var styleDefinitions = {
			display: booleanStyle(['', 'none']),
			visibility: booleanStyle(['visible', 'hidden']),
			color: directStyle,
			opacity: directStyle,
			zoom: directStyle,
			minZoom: directStyle,
			maxZoom: directStyle,
			fontWeight: directStyle,
			position: booleanStyle(['absolute', '']),
			textDecoration: booleanStyle(['underline', '']),
			fontWeight: directStyle // numbers are allowed here (TODO: eventually allow booleans too)
		}
		;["alignContent","alignItems","alignSelf","animation","animationDelay","animationDirection","animationDuration","animationFillMode","animationIterationCount","animationName","animationPlayState","animationTimingFunction","backfaceVisibility","background","backgroundAttachment","backgroundBlendMode","backgroundClip","backgroundColor","backgroundImage","backgroundOrigin","backgroundPosition","backgroundPositionX","backgroundPositionY","backgroundRepeat","backgroundRepeatX","backgroundRepeatY","backgroundSize","baselineShift","border","borderBottom","borderBottomColor","borderBottomLeftRadius","borderBottomRightRadius","borderBottomStyle","borderBottomWidth","borderCollapse","borderColor","borderImage","borderImageOutset","borderImageRepeat","borderImageSlice","borderImageSource","borderImageWidth","borderLeft","borderLeftColor","borderLeftStyle","borderLeftWidth","borderRadius","borderRight","borderRightColor","borderRightStyle","borderRightWidth","borderSpacing","borderStyle","borderTop","borderTopColor","borderTopLeftRadius","borderTopRightRadius","borderTopStyle","borderTopWidth","borderWidth","bottom","boxShadow","boxSizing","bufferedRendering","captionSide","clear","clip","clipPath","clipRule","color","colorInterpolation","colorInterpolationFilters","colorRendering","counterIncrement","counterReset","cursor","direction","display","emptyCells","fill","fillOpacity","fillRule","filter","flex","flexBasis","flexDirection","flexFlow","flexGrow","flexShrink","flexWrap","float","floodColor","floodOpacity","font","fontFamily","fontFeatureSettings","fontKerning","fontSize","fontStretch","fontStyle","fontVariant","fontVariantLigatures","fontWeight","height","imageRendering","isolation","justifyContent","left","letterSpacing","lightingColor","lineHeight","listStyle","listStyleImage","listStylePosition","listStyleType","margin","marginBottom","marginLeft","marginRight","marginTop","marker","markerEnd","markerMid","markerStart","mask","maskType","maxHeight","maxWidth","maxZoom","minHeight","minWidth","minZoom","mixBlendMode","motion","motionOffset","motionPath","motionRotation","objectFit","objectPosition","opacity","order","orientation","orphans","outline","outlineColor","outlineOffset","outlineStyle","outlineWidth","overflow","overflowWrap","overflowX","overflowY","padding","paddingBottom","paddingLeft","paddingRight","paddingTop","page","pageBreakAfter","pageBreakBefore","pageBreakInside","paintOrder","perspective","perspectiveOrigin","pointerEvents","position","quotes","resize","right","shapeImageThreshold","shapeMargin","shapeOutside","shapeRendering","size","speak","src","stopColor","stopOpacity","stroke","strokeDasharray","strokeDashoffset","strokeLinecap","strokeLinejoin","strokeMiterlimit","strokeOpacity","strokeWidth","tabSize","tableLayout","textAlign","textAlignLast","textAnchor","textCombineUpright","textDecoration","textIndent","textOrientation","textOverflow","textRendering","textShadow","textTransform","top","touchAction","transform","transformOrigin","transformStyle","transition","transitionDelay","transitionDuration","transitionProperty","transitionTimingFunction","unicodeBidi","unicodeRange","userZoom","vectorEffect","verticalAlign","visibility","whiteSpace","widows","width","willChange","wordBreak","wordSpacing","wordWrap","writingMode","zIndex","zoom"].forEach(function(property) {
			styleDefinitions[property] = styleDefinitions[property] || defaultStyle
		})
		var styleSheet
		var presumptiveParentMap = new WeakMap()
	
		var setPrototypeOf = Object.setPrototypeOf || (function(base, proto) { base.__proto__ = proto})
		var getPrototypeOf = Object.getPrototypeOf || (function(base) { return base.__proto__ })
		function createCssRule(selector) {
			if (!styleSheet) {
				var styleSheetElement = doc.createElement("style")
				styleSheetElement.setAttribute("type", "text/css")
	//			styleSheet.appendChild(doc.createTextNode(css))
				doc.head.insertBefore(styleSheetElement, doc.head.firstChild)
				styleSheet = styleSheetElement.sheet
			}
			var cssRules = styleSheet.cssRules || styleSheet.rules
			return cssRules[styleSheet.addRule(selector, ' ', cssRules.length)]
		}
	
		// TODO: Need to do some more testing to see if that would improve performance:
		// var fragmentThresholdHeuristic = (typeof navigator !== 'undefined' && navigator.userAgent.indexOf('Chrome') > 0) ? 1 : 3
	
		function layoutChildren(parent, children, container, prepend) {
			var fragment = (children.length > 1 || prepend) ? doc.createDocumentFragment() : parent
			for(var i = 0, l = children.length; i < l; i++) {
				var child = children[i]
				var childNode
				if (child != null) { // we just skip nulls and undefined, helps make it easier to write conditional element logic
					if (child.create) {
						// an element constructor
						currentParent = parent
						childNode = child.create()
						fragment.appendChild(childNode)
						if (child.isContentNode) {
							container.contentNode = childNode
						}
					} else if (child.notifies) {
						// a variable
						var ref = child.isIterable ? fragment : parent
						fragment.appendChild(childNode = variableAsContent(ref, child))
					} else if (typeof child == 'object') {
						if (child instanceof Array) {
							// array of sub-children
							container = container || parent
							childNode = childNode || parent
							layoutChildren(childNode.contentNode || childNode, child, container)
						} else if (child.nodeType) {
							// an element itself
							fragment.appendChild(childNode = child)
						} else {
							// TODO: apply properties to last child, but with binding to the parent (for events)
							throw new Error('Unknown child type ' + child)
						}
					} else {
						// a primitive value
						childNode = doc.createTextNode(child)
						fragment.appendChild(childNode)
					}
				}
			}
			if (fragment != parent) {
				if (prepend) {
					parent.insertBefore(fragment, parent.firstChild)
				} else {
					parent.appendChild(fragment)
				}
			}
			return childNode
		}
		function variableAsContent(parent, content) {
			if (content == null) {
				return doc.createTextNode('')
			}
			var textNode
			if (content.notifies) {
				textNode = doc.createTextNode('')
				var renderer = new TextRenderer({
					element: parent,
					textNode: textNode,
					variable: content
				})
				textNode = renderer.textNode // it can be swapped for another node
			} else {
				textNode = doc.createTextNode(content)
			}
			return textNode
		}
	
		function bidirectionalHandler(element, value, key) {
			if (value && value.notifies) {
				new InputPropertyRenderer({
					name: key,
					variable: value,
					element: element
				})
				if (inputs[element.tagName] || element.tagName === 'SELECT') {
					bindChanges(element, value, key)
				}
			} else {
				if (element.tagName === 'SELECT' && key === 'value') {
					// use the deferred <select> value assignment
					InputPropertyRenderer.prototype.renderSelectValueUpdate(value, element)
				} else {
					if (element.type === 'number') {
						if (isNaN(value)) {
							value = ''
						}
					}
					element[key] = value
				}
			}
		}
	
		function noop() {}
		var propertyHandlers = {
			children: noop,
			tagName: noop,
			_generators: noop,
			classes: function(element, classes) {
				if (!(classes.length > -1)) {
					// index the classes, if necessary
					var i = 0
					for (var key in classes) {
						if (!classes[i]) {
							classes[i] = key
						}
						i++
					}
					classes.length = i
				}
				for (var i = 0, l = classes.length; i < l; i++) {
					// find each class name
					var className = classes[i]
					var flag = classes[className]
					if (flag && flag.notifies) {
						// if it is a variable, we react to it
						new ClassNameRenderer({
							element: element,
							className: className,
							variable: flag
						})
					} else if (flag || flag === undefined) {
						element.className += ' ' + className
					}
				}
			},
			class: applyAttribute,
			for: applyAttribute, // TODO: move to label?
			role: applyAttribute,
			render: function(element, value, key, properties) {
				// TODO: This doesn't need to be a property updater (is in place for *render())
				// we should also verify it is a generator
				// and maybe, at some point, find an optimization to eliminate the bind()
				new PropertyRenderer({
					name: key,
					variable: new VariableExports.GeneratorVariable(value.bind(element, properties)),
					element: element
				})
			},
			dataset: applySubProperties(function(newValue, element, key) {
				element.dataset[key || this.name] = newValue
			}),
			attributes: applySubProperties(function(newValue, element, key) {
				element.setAttribute(key || this.name, newValue)
			}),
			style: function(element, value, key) {
				if (typeof value === 'string') {
					element.setAttribute('style', value)
				} else if (value && value.notifies) {
					new AttributeRenderer({
						name: 'style',
						variable: value,
						element: element
					})
				} else {
					styleObjectHandler(element, value, key)
				}
			}
		}
	
		knownElementProperties.forEach(function(property) {
			propertyHandlers[property] = true
		})
		if (typeof HTMLElement !== 'undefined') {
			HTMLElement.prototype._propertyHandlers = propertyHandlers // inherit this, at least for now
		}
		var elementPropertyHandlers = {
			input: lang.copy(['accept', 'alt', 'autocomplete', 'autofocus', 'capture', 'defaultChecked', 'dirName', 'disabled', 'form', 'files', 'formAction', 'formEnctype', 'formMethod', 'formNoValidate', 'formTarget', 'indeterminate', 'inputMode', 'list', 'max', 'maxLength', 'min', 'minLength', 'multiple', 'name', 'pattern', 'placeholder', 'readOnly', 'required', 'size', 'src', 'step', 'type', 'defaultValue', 'willValidate', 'validity', 'validationMessage', 'useMap', 'autocapitalize', 'webkitdirectory', 'incremental', 'stepUp', 'stepDown'], {
				value: bidirectionalHandler,
				valueAsNumber: bidirectionalHandler,
				valueAsDate: bidirectionalHandler,
				checked: bidirectionalHandler,
				type: function(element, value) {
					try {
						element.type = value
					} catch(e) {
						// IE 11 will throw an error here
					}
				}
			}),
			select: lang.copy(['name', 'size', 'type', 'selectedIndex', 'validationMessage'], {
				value: bidirectionalHandler
			}),
			textarea: lang.copy(['cols', 'dirName', 'maxLength', 'minLength', 'name', 'placeholder', 'rows', 'wrap', 'type', 'defaultValue', 'textLength', 'validationMessage', 'autocapitalize'], {
				value: bidirectionalHandler
			}),
			a: ['target', 'download', 'ping', 'rel', 'hreflang', 'type', 'referrerPolicy', 'href', 'media'],
			area: ['target', 'download', 'coords', 'rel', 'hreflang', 'type', 'referrerPolicy', 'href', 'media', 'alt', 'shape'],
			button: ['formAction', 'formEnctype', 'formMethod', 'formTarget', 'name', 'type', 'value', 'validationMessage'],
			dialog: ['open'],
			embed: ['src', 'type', 'name'],
			form: ['acceptCharset', 'action', 'autocomplete', 'enctype', 'encoding', 'method', 'name', 'target', 'novalidate'],
			frame: ['name', 'scrolling', 'src', 'frameBorder'],
			frameset: ['cols', 'rows'],
	    iframe: ['src', 'srcdoc', 'name', 'referrerPolicy', 'align', 'scrolling', 'frameBorder', 'longDesc'],
	    img: ['src', 'alt', 'crossorigin', 'ismap', 'longdesc', 'sizes', 'srcset', 'usemap', 'referrerpolicy'],
	    option: ['label', 'value', 'text', 'index'],
	    optgroup: ['label'],
	    output: ['name', 'type', 'defaultValue', 'value', 'validationMessage'],
	    label: ['htmlFor'],
	    td: ['colSpan', 'rowSpan'],
	    th: ['colSpan', 'rowSpan'],
	    script: ['src', 'type', 'charset', 'text', 'event', 'htmlFor', 'integrity'],
	    style: ['media', 'type'],
	    track: ['kind', 'src', 'srclang', 'label'],
	    link: ['href', 'rel', 'media', 'hreflang', 'type', 'charset', 'rev', 'target', 'integrity', 'as'],
	    meta: ['name', 'httpEquiv', 'content', 'scheme'],
	    meter: ['value', 'min', 'max', 'low', 'high', 'optimum'],
	    progress: ['value', 'max', 'position'],
	    del: ['cite', 'dateTime'],
	    ins: ['cite', 'dateTime'],
	    source: ['src', 'type', 'srcset', 'sizes', 'media'],
	    video: ['videoWidth', 'videoHeight', 'poster', 'webkitDecodedFrameCount', 'webkitDroppedFrameCount'],
	    keygen: ['challenge', 'keytype', 'name', 'type', 'validationMessage'],
	    object: ['data', 'type', 'name', 'useMap', 'validationMessage', 'archive', 'code', 'hspace', 'standby', 'vspace', 'codeBase', 'codeType'],
	    param: ['name', 'value', 'type', 'valueType']
		}
	
		function applyAttribute(element, value, key) {
			if (value && value.notifies) {
				new AttributeRenderer({
					name: key,
					variable: value,
					element: element
				})
			} else {
				element.setAttribute(key, value)
			}
		}
	
		var styleObjectHandler = applySubProperties(function(newValue, element, key) {
			element.style[key || this.name] = newValue
		})
	
		function applySubProperties(renderer) {
			var SubPropertyRenderer = lang.compose(PropertyRenderer, function SubPropertyRenderer(options) {
				PropertyRenderer.apply(this, arguments)
			}, {
				renderUpdate: renderer
			})
			return function(element, value, key) {
				for (var subKey in value) {
					var subValue = value[subKey]
					if (subValue && subValue.notifies) {
						new SubPropertyRenderer({
							name: subKey,
							variable: subValue,
							element: element
						})
					} else {
						renderer(subValue, element, subKey)
					}
				}
			}
		}
	
		function assignProperties(element, properties) {
			var propertyHandlers = element._propertyHandlers
			var Element = element.constructor
			for (var key in properties) {
				var value = properties[key]
				var VariableClass = Element[key]
				if (typeof VariableClass === 'function' && VariableClass.notifies && VariableClass !== value) {
					hasOwn(Element, VariableClass)
					// if (value instanceof VariableClass) { TODO: assign the value as the owned instance
					VariableClass.for(element).put(value)
				}
				var styleDefinition
				var propertyHandler = propertyHandlers[key]
				if (propertyHandler) {
					if (propertyHandler === true) {
						if (value && value.notifies) {
						// a standard, known element property
							new PropertyRenderer({
								name: key,
								variable: value,
								element: element
							})
						} else {
							element[key] = value
						}
					} else {
						propertyHandler(element, value, key, properties)
					}
				} else if ((styleDefinition = styleDefinitions[key])) {
					if (value && value.notifies) {
						new StyleRenderer({
							name: key,
							variable: value,
							element: element
						})
					} else {
						styleDefinition(element, value, key)
					}
				} else if (element[key] == null) {
					// we are working an unknown/unstandard property (or an event listener)
					// undefined or null means we can safely set
					// TODO: we may want to do the event listener check first so we can handle oncustomevent (that needs an addEventListener call to work)
					element[key] = value
				} else if (typeof value === 'function' && key.slice(0, 2) === 'on') {
					// event listener with one already defined on the prototype
					element.addEventListener(key.slice(2), value)
				} else {
					// otherwise bypass/override the native getter/setter
					Object.defineProperty(element, key, {
						value: value,
						enumerable: true,
						configurable: true,
						writable: true
					})
				}
			}
		}
	
		function assignGenerators(element, properties) {
			var generators = properties._generators
			var customGenerators
			var styleGenerators
			var nativeGenerators
			var propertyHandlers = element._propertyHandlers
			for (var key in generators) {
				var variable = new VariableExports.GeneratorVariable(generators[key].bind(element, properties))
				if (propertyHandlers[key]) {
					(nativeGenerators || (nativeGenerators = {}))[key] = variable
				} else if (styleDefinitions[key]) {
					(styleGenerators || (styleGenerators = {}))[key] = variable
				} else {
					(customGenerators || (customGenerators = {}))[key] = variable
				}
			}
			if (customGenerators) {
				// custom ones must go first
				assignProperties(element, customGenerators)
			}
			if (styleGenerators) {
				assignProperties(element, styleGenerators)
			}
			if (nativeGenerators) {
				// native ones must come last so they can access custom ones
				assignProperties(element, nativeGenerators)
			}
		}
	
		function buildContent(element, content, key, properties) {
			var each = element.each || properties.each
			if (each && content) {
				// render as list
				if (each.create) {
					each.defineHasOwn = function () {
						var ItemClass = content.getCollectionOf && content.getCollectionOf() || Item
						hasOwn(each, ItemClass, function (element) {
							var itemVariable = ItemClass.from(element._item)
							return itemVariable
						})
					}
				}
				if (content.notifies) {
					new ListRenderer({
						each: each,
						variable: content,
						element: element
					})
				} else {
					var fragment = doc.createDocumentFragment()
					if (each.defineHasOwn) {
						each.defineHasOwn()
					}
					content.forEach(function(item) {
						if (each.create) {
							childElement = each.create({parent: element, _item: item}) // TODO: make a faster object here potentially
						} else {
							childElement = each(item, element)
						}
						fragment.appendChild(childElement)
					})
					element.appendChild(fragment)
				}
			} else if (inputs[element.tagName]) {
				// render into input
				buildInputContent(element, content)
			} else if (content instanceof Array) {
				// treat array as children (potentially of the content node)
				element = element.contentNode || element
				layoutChildren(element, content, element)
			} else {
				// render as string
				element.appendChild(variableAsContent(element, content))
			}
		}
	
		function bindChanges(element, variable, key, conversion) {
			lang.nextTurn(function() { // wait for next turn in case inputChanges isn't set yet
				var inputEvents = element.inputEvents || ['change', 'alkali-change']
				for (var i = 0, l = inputEvents.length; i < l; i++) {
					element.addEventListener(inputEvents[i], function (event) {
						var value = element[key]
						var result = variable.put(conversion ? conversion(value, element) : value, new Context(element))
						if (result === VariableExports.deny) {
							throw new Error('Variable change denied')
						}
					})
				}
			})
		}
	
		doc.addEventListener('click', function(event) {
			var target = event.target
			if (target.type === 'radio') {
				var radios = doc.querySelectorAll('input[type=radio]')
				for (var i = 0, l = radios.length; i < l; i++) {
					var radio = radios[i]
					if (radio.name === target.name && radio !== target) {
						radio.dispatchEvent(new Event('alkali-change', {}))
					}
				}
			}
		})
	
		function conversion(value, element) {
			if (element.type == 'number') {
				return parseFloat(value)
			}
			return value
		}
	
		function buildInputContent(element, content) {
			var inputType = element.type
			var inputProperty = inputType in {date: 1, datetime: 1, time: 1} ?
					'valueAsDate' : (inputType === 'checkbox' || inputType === 'radio') ?
						'checked' : 'value'
	
			if (content && content.notifies) {
				// a variable, respond to changes
				new InputPropertyRenderer({
					variable: content,
					name: inputProperty,
					element: element
				})
				// and bind the other way as well, updating the variable in response to input changes
				bindChanges(element, content, inputProperty, conversion)
			} else {
				// primitive
				element[inputProperty] = content
			}
		}
	
		function mergeObject(Element, value, key, properties) {
			var existing = properties[key]
			if (existing) {
				for (var subKey in value) {
					existing[subKey] = value[subKey]
				}
			} else {
				properties[key] = value
			}
		}
	
		var classHandlers = {
			classes: mergeObject,
			_generators: mergeObject,
			dataset: mergeObject,
			attributes: mergeObject,
			style: mergeObject,
			hasOwn: function(Element, value) {
				hasOwn(Element, value)
			},
			children: function(Element, value) {
				Element.children = value
			},
			shadow: function(Element, value) {
				Element.shadow = value
			}
		}
	
		function applyToConstructor(argument, Element) {
			var applyOnCreate = Element._applyOnCreate
			if (argument && typeof argument === 'object') {
				if (argument instanceof Array || argument.notifies) {
					applyOnCreate.content = argument
				} else {
					for (var key in argument) {
					// TODO: eventually we want to be able to set these as rules statically per element
					/*if (styleDefinitions[key]) {
						var styles = Element.styles || (Element.styles = [])
						styles.push(key)
						styles[key] = descriptor.value
					} else {*/
						var value = argument[key]
						var VariableClass = Element[key]
						if (typeof value === 'function') {
							if (value.notifies) {
								if (value === Variable) {
									value = Variable() // create a branded variable if we are using a generic one
								}
								// for Variable classes we make them statically available on the element
								Element[key] = value
							} else if (isGenerator(value)) {
								if (key.slice(0, 4) === 'get_') {
									key = key.slice(4)
								}
								(applyOnCreate._generators || (applyOnCreate._generators = {}))[key] = value
							}
						} else if (value && value.notifies) {
							// also store any variables as statically available properties
							Element[key] = value
						}
						if (classHandlers[key]) { // Could eliminate this if we got rid of hasOwn
							classHandlers[key](Element, value, key, applyOnCreate)
						} else if (typeof VariableClass === 'function' && VariableClass.notifies) {
							applyOnCreate[key] = new VariableClass(value)
						} else {
							applyOnCreate[key] = value
						}
					}
				}
			} else if (typeof argument === 'function' && !argument.for) {
				throw new TypeError('Function as argument not supported')
			} else {
				applyOnCreate.content = argument
			}
		}
	
		function getApplySet(Class) {
			if (Class.hasOwnProperty('_applyOnCreate')) {
				return Class._applyOnCreate
			}
			// this means we didn't extend and evaluate the prototype yet
			if (Class.getForClass) {
				// we are extending an alkali constructor
				// if this class is inheriting from an alkali constructor, work our way up the chain
				var applyOnCreate = Class._applyOnCreate = {}
				var parentApplySet = getApplySet(getPrototypeOf(Class))
				for (var key in parentApplySet) {
					applyOnCreate[key] = classHandlers[key] ? Object.create(parentApplySet[key]) : parentApplySet[key]
				}
				// we need to check the prototype for event handlers
				var prototype = Class.prototype
				var propertyHandlers
				var keys = Object.getOwnPropertyNames(prototype)
				for (var i = 0, l = keys.length; i < l; i++) {
					var key = keys[i]
					if (key.slice(0, 2) === 'on' || (key === 'render' && isGenerator(prototype[key]))) {
						applyOnCreate[key] = prototype[key]
					} else if (key.slice(0, 6) === 'render') {
						var propertyName = key[6].toLowerCase() + key.slice(7)
						if (!propertyHandlers) {
							propertyHandlers = prototype._propertyHandlers = Object.create(prototype._propertyHandlers)
						}
						propertyHandlers[propertyName] = true // TODO: is it better to implement this with property handlers?
						Object.defineProperty(prototype, propertyName, renderDescriptor(key))
					}
				}
				return applyOnCreate
			}
			return null
		}
	
		function renderDescriptor(renderMethod) {
			var map = new WeakMap()
			return {
				get: function() {
					return map.has(this) ? map.get(this) : null
				},
				set: function(value) {
					map.set(this, value)
					this[renderMethod](value)
				}
			}
		}
	
		function makeElementConstructor() {
			function Element(selector, properties) {
				if (this instanceof Element){
					// create DOM element
					// Need to detect if we have registered the element and `this` is actually already the correct instance
					return create.apply(Element.prototype === getPrototypeOf(this) ? Element :// this means it is from this constructor
						this.constructor, // this means it was constructed from a subclass
						arguments)
				} else {
					// extend to create new class
					return withProperties.apply(Element, arguments)
				}
			}
			return Element
		}
	
		function withProperties(selector, properties) {
			var Element = makeElementConstructor()
			if (this.with) {
				// TODO: Might consider only doing this for derivatives of derivatives, since we don't need to inherit from base constructors
				// or only doing this in the case of element having custom properties (could mark it with a flag)
				setPrototypeOf(Element, this)
				Element.ownedClasses = null
			} else {
				Element.create = create
				Element.with = withProperties
				Element.for = forTarget
				Element.property = propertyForElement
				Element.getForClass = getForClass
			}
			Element.prototype = this.prototype
	
			var applyOnCreate = Element._applyOnCreate = {}
			var parentApplySet = getApplySet(this)
			// copy parent properties
			for (var key in parentApplySet) {
				applyOnCreate[key] = classHandlers[key] ? Object.create(parentApplySet[key]) : parentApplySet[key]
			}
	
			var i = 0 // for arguments
			if (typeof selector === 'string') {
				var selectorMatch = selector.match(SELECTOR_REGEX)
				if (selectorMatch) {
					do {
						var operator = selectorMatch[1]
						var name = selectorMatch[2]
						if (operator == '.') {
							if (applyOnCreate.className) {
								applyOnCreate.className += ' ' + name
							} else {
								applyOnCreate.className = name
							}
						} else {
							applyOnCreate.id = name
						}
						var remaining = selectorMatch[3]
						selectorMatch = remaining && remaining.match(SELECTOR_REGEX)
					} while (selectorMatch)
				} else {
					applyOnCreate.content = selector
				}
				i++ // skip the first argument
			}
	
			for (var l = arguments.length; i < l; i++) {
				applyToConstructor(arguments[i], Element)
			}
			return Element
		}
		var currentParent
		function create(selector, properties) {
			// TODO: make this a symbol
			var applyOnCreate = getApplySet(this)
			if (currentParent) {
				var parent = currentParent
				currentParent = null
			}
	/*		if (this._initialized != this) {
				this._initialized = this
				this.initialize && this.initialize()
				var styles = this.styles
				if (styles) {
					var rule = createCssRule(getUniqueSelector(this))
					for (var i = 0, l = styles.length; i < l; i++) {
						var key = styles[i]
						var value = styles[key]
						// TODO: if it is a contextualized variable, do this on the element
						var styleDefinition = styleDefinitions[key]
						if (styleDefinition) {
							styleDefinition(rule, value, key)
						}
					}
				}
				if (!this.hasOwnProperty('_applyOnCreate')) {
					applyOnCreate = getApplySet(this)
				}
			}*/
			var element = doc.createElement(this.tagName)
			if (selector && selector.parent) {
				parent = selector.parent
			}
			if (parent) {
				presumptiveParentMap.set(element, parent)
			}
			if (!(element instanceof this)) {
				// ideally we want to avoid this call, as it is expensive, but for classes that
				// don't register a tag name, we have to make sure the prototype chain is correct
				setPrototypeOf(element, this.prototype)
			}
			if (element.constructor != this) {
				if (buggyConstructorSetter) {
					// in safari, directly setting the constructor messes up the native prototype
					Object.defineProperty(element, 'constructor', { value: this })
				} else {
					element.constructor = this // need to do this for hasOwn contextualization to work
				}
			}
			if (arguments.length > 0) {
				// copy applyOnCreate when we have arguments
				var ElementApplyOnCreate = applyOnCreate
				applyOnCreate = {}
				for (var key in ElementApplyOnCreate) {
					applyOnCreate[key] = classHandlers[key] ? Object.create(ElementApplyOnCreate[key]) : ElementApplyOnCreate[key]
				}
				var i = 0
				if (typeof selector == 'string') {
					i++
					var selectorMatch = selector.match(SELECTOR_REGEX)
					if (selectorMatch) {
						do {
							var operator = selectorMatch[1]
							var name = selectorMatch[2]
							if (operator == '.') {
								if (applyOnCreate.className) {
									applyOnCreate.className += ' ' + name
								} else {
									if (element.className) {
											element.className += ' ' + name
									} else {
											element.className = name
									}
								}
							} else {
								if (applyOnCreate.id) {
									applyOnCreate.id = name
								} else {
									// just skip right to the element
									element.id = name
								}
							}
							var remaining = selectorMatch[3]
							selectorMatch = remaining && remaining.match(SELECTOR_REGEX)
						} while (selectorMatch)
					} else {
						applyOnCreate.content = selector
					}
				} else if (selector && selector._item) {
					// this is kind of hack, to get the Item available before the properties, eventually we may want to
					// order static properties before variable binding applications, but for now.
					element._item = selector._item
				}
				for (var l = arguments.length; i < l; i++) {
					var argument = arguments[i]
					if (argument && typeof argument === 'object') {
						if (argument instanceof Array || argument.notifies) {
							applyOnCreate.content = argument
						} else {
							for (var key in argument) {
								if (classHandlers[key]) {
									classHandlers[key](this, argument[key], key, applyOnCreate)
								} else {
									applyOnCreate[key] = argument[key]
								}
							}
						}
					} else if (typeof argument === 'function' && argument.for) {
						applyOnCreate.content = argument.for(element)
					} else {
						applyOnCreate.content = argument
					}
				}
			}
			if (element.created) {
				applyOnCreate = element.created(applyOnCreate) || applyOnCreate
			} else if (applyOnCreate.created) {
				applyOnCreate = applyOnCreate.created.call(element, applyOnCreate) || applyOnCreate
			}
			// TODO: inline this for better performance, possibly
			assignProperties(element, applyOnCreate)
	
			if (applyOnCreate._generators) {
				assignGenerators(element, applyOnCreate)
			}
	
			if (this.children) {
				layoutChildren(element, this.children, element)
			}
			if (this.shadow) {
				layoutChildren(element.attachShadow({mode: 'open'}), this.shadow, element)
			}
			// always do this last, so it can be properly inserted inside the children
			if (element.content != null) {
				buildContent(element, element.content, 'content', applyOnCreate)
			}
			element.ready && element.ready(applyOnCreate)
			return element
		}
	
		var slice = [].slice
		function append(parent){
			return this.nodeType ?
				layoutChildren(this, arguments, this) : // called as a method
				layoutChildren(parent, slice.call(arguments, 1), parent) // called as a function
		}
	
		function prepend(parent){
			return this.nodeType ?
				layoutChildren(this, arguments, this, true) : // called as a method
				layoutChildren(parent, slice.call(arguments, 1), parent, true) // called as a function
		}
	
		function defineTag(tagName, Element) {
			var extendElement = Element.tagName
			Element.tagName = tagName
			if (typeof customElements === 'object') {
				customElements.define(tagName, lang.extendClass(HTMLElement), { extends: extendElement })
			} else {
				console.warn('This browser does not support customElements, ensure that the constructor is used to create new elements')
			}
		}
	
		var Element = withProperties.call(typeof HTMLElement !== 'undefined' ? HTMLElement : function() {})
	
		Element.defineTag = defineTag
		Element.assign = function(target, properties) {
			if (typeof target === 'function') {
				// assign properties to an existing constructor/class
				getApplySet(target) // make sure we have our own applyOnCreate first
				applyToConstructor(properties, target)
			} else {
				// assign to an element
				// TODO: Handle content property separately
				return assignProperties(target, properties)
			}
		}
	
		Element.within = function(element){
			// find closest child
		}
	
		generate([
			'Video',
			'Source',
			'Media',
			'Audio',
			'UL',
			'U',
			'Track',
			'Title',
			'TextArea',
			'Template',
			'TBody',
			'THead',
			'TFoot',
			'TR',
			'Table',
			'Col',
			'ColGroup',
			'TH',
			'TD',
			'Caption',
			'Sup',
			'Sub',
			'Style',
			'Strong',
			'Span',
			'Small',
			'Shadow',
			'Select',
			'Script',
			'S',
			'Quote',
			'Progress',
			'Pre',
			'Picture',
			'Param',
			'P',
			'Output',
			'Option',
			'Optgroup',
			'Object',
			'OL',
			'Ins',
			'I',
			'Del',
			'Meter',
			'Meta',
			'Menu',
			'Map',
			'Link',
			'Legend',
			'Label',
			'LI',
			'KeyGen',
			'Input',
			'Img',
			'IFrame',
			'H1',
			'H2',
			'H3',
			'H4',
			'H5',
			'H6',
			'Hr',
			'FrameSet',
			'Frame',
			'Form',
			'Font',
			'Embed',
			'Em',
			'Code',
			'Cite',
			'Dfn',
			'B',
			'Article',
			'Aside',
			'Abbr',
			'Footer',
			'Figure',
			'FigCaption',
			'Header',
			'Main',
			'Mark',
			'MenuItem',
			'Nav',
			'Section',
			'Slot',
			'Summary',
			'WBr',
			'Div',
			'Dialog',
			'Details',
			'DataList',
			'DL',
			'Canvas',
			'Button',
			'Base',
			'Br',
			'Area',
			'A'
		])
		generateInputs([
			'Checkbox',
			'Password',
			'Submit',
			'Radio',
			'Color',
			'Date',
			'DateTime',
			'Email',
			'Month',
			'Number',
			'Range',
			'Search',
			'Tel',
			'Time',
			'Url',
			'Week'])
	
		var tags = {}
		function getConstructor(tagName) {
			tagName = tagName.toLowerCase()
			return tags[tagName] ||
				(tags[tagName] =
					setupElement(withProperties.call(doc.createElement(tagName).constructor), tagName))
		}
	
		function setupElement(Element, tagName) {
			var props = elementPropertyHandlers[tagName]
			if (props && !props.assigned) {
				var handlers = Element.prototype._propertyHandlers = Object.create(propertyHandlers)
				for (var i = 0, l = props.length; i < l; i++) {
					handlers[props[i]] = true
				}
				if (props.value) {
					for (var i in props) {
						if (!(i > -1)) { // assign any string properties if necessary
							handlers[i] = props[i]
						}
					}
				}
				props.assigned = true
			}
			Element.tagName = tagName
			return Element
		}
		function generate(elements) {
			elements.forEach(function(elementName) {
				var ElementClass
				Object.defineProperty(Element, elementName, {
					get: function() {
						return ElementClass || (ElementClass = getConstructor(elementName))
					}
				})
			})
		}
		function generateInputs(elements) {
			elements.forEach(function(inputType) {
				var ElementClass
				Object.defineProperty(Element, inputType, {
					get: function() {
						// TODO: make all inputs extend from input generated from generate
						return ElementClass || (ElementClass = setupElement(withProperties.call(HTMLInputElement, {
							type: inputType.toLowerCase()
						}), 'input'))
					}
				})
				// alias all the inputs with an Input suffix
				Object.defineProperty(Element, inputType + 'Input', {
					get: function() {
						return this[inputType]
					}
				})
			})
		}
	
		var aliases = {
			Anchor: 'A',
			Image: 'Img',
			Paragraph: 'P',
			Textarea: 'TextArea',
			DList: 'DL',
			UList: 'UL',
			OList: 'OL',
			ListItem: 'LI',
			Text: 'Input',
			TextInput: 'Input',
			TableRow: 'TR',
			TableCell: 'TD',
			TableHeaderCell: 'TH',
			TableHeader: 'THead',
			TableBody: 'TBody'
		}
		for (var alias in aliases) {
			(function(alias, to) {
				Object.defineProperty(Element, alias, {
					get: function() {
						return this[to]
					}
				})
			})(alias, aliases[alias])
		}
	
		Element.append = append
		Renderer.append = append // make it available to the renderer
		Element.prepend = prepend
		Element.refresh = Renderer.refresh
		Element.options = {
			moveLiveElementsEnabled: true,
		}
		Element.content = function(element){
			// container marker
			return {
				isContentNode: true,
				create: element.create.bind(element)
			}
		}
	
		Element.ElementClass = function() {}
		if (typeof Symbol !== 'undefined') {
			// make instanceof work for Element
			Object.defineProperty(Element.ElementClass, Symbol.hasInstance, { value: function(target) {
				return target && (target.create && target.with)
			}})
		}
	
		// TODO: unify this in lang
		Element.extend = function(Class, properties) {
			function ExtendedElement() {
				return Class.apply(this, arguments)
			}
			setPrototypeOf(ExtendedElement, Class)
			var prototype = ExtendedElement.prototype = Object.create(Class.prototype, {
				constructor: { value: ExtendedElement }
			})
			Object.getOwnPropertyNames(properties).forEach(function(key) {
				var descriptor = Object.getOwnPropertyDescriptor(properties, key)
				if (classHandlers[key]) {
					classHandlers[key](ExtendedElement, descriptor.value, key, properties)
				} else {
					Object.defineProperty(prototype, key, descriptor)
				}
			})
			return ExtendedElement
		}
	
		function forTarget(target) {
			return target.constructor.getForClass(target, this)
		}
	
		function hasOwn(From, Target, createInstance) {
			if (typeof Target === 'object') {
				// we were given an actual instance, use that
				var elementMap = From.ownedClasses || (From.ownedClasses = new WeakMap())
				var instanceMap = {get: function () {
					return Target
				}}
				elementMap.set(Target.constructor, instanceMap)
				return hasOwn(From, Target.Class, Target.createInstance)
			}
			if (Target instanceof Array) {
				return Target.forEach(function(Target) {
					hasOwn(From, Target)
				})
			}
			var elementMap = From.ownedClasses || (From.ownedClasses = new WeakMap())
			// TODO: Go up through prototype chain of Target and set each one
			if (!elementMap.has(Target)) {
				var instanceMap = new WeakMap()
				instanceMap.createInstance = createInstance
				elementMap.set(Target, instanceMap)
			}
			return From
		}
	
		function getForClass(element, Target) {
			var createInstance
			while (element && !(createInstance = element.constructor.ownedClasses && element.constructor.ownedClasses.get(Target))) {
				element = element.parentNode || presumptiveParentMap.get(element)
			}
			if (createInstance) {
				var ownedInstances = element.ownedInstances || (element.ownedInstances = new WeakMap())
				var instance = ownedInstances.get(Target)
				if (instance === undefined) {
					ownedInstances.set(Target, instance = createInstance(element))
					instance.subject = element
				}
				return instance
			}
		}
	
		function propertyForElement(key) {
			// we just need to establish one Variable class for each element, so we cache it
			ThisElementVariable = this._Variable
			if (!ThisElementVariable) {
				// need our own branded variable class for this element class
				ThisElementVariable = this._Variable = Variable()
	
				hasOwn(this, ThisElementVariable, function(element) {
					// TODO: we might want to do this in init instead
					var elementOverlay
					if (element.alkaliRenderers) {
						var variableProperties = {}
						for (var i = 0; i < element.alkaliRenderers.length; i++){
							var renderer = element.alkaliRenderers[i]
							if (renderer.name) {
								variableProperties[renderer.name] = {value: renderer.variable}
							}
						}
						elementOverlay = Object.create(element, variableProperties)
					} else {
						elementOverlay = element
					}
					var instance = new ThisElementVariable(elementOverlay)
					// we are not observing, because you can't delegate getters and setters in safari
					// instance.observeObject()
					return instance
				})
			}
			// now actually get the property class
			return ThisElementVariable.property(key)
		}
	
		var Item = Element.Item = VariableExports.Item
	
		function enterRenderer(Renderer, options/*, target*/) {
			// this will be used for optimized class-level variables
			/*if (target.started) { // TODO: Might want to pass in started as a parameter
				// this means that the renderer has already been created, so we just need to add this instance
				Renderer.prototype.renderUpdate.call(options, element)
			} else {*/
			new Renderer(options)
			//}
		}
	
		function cleanup(target) {
			var renderers = target.alkaliRenderers
			if (renderers) {
				for (var i = 0, l = renderers.length; i < l; i++) {
					renderers[i].stop()
				}
				target.needsRestart = true
			}
		}
		function restart(target) {
			var renderers = target.alkaliRenderers
			if (renderers) {
				for (var i = 0, l = renderers.length; i < l; i++) {
	//				updaters[i].start()
				}
			}
		}
		// setup the mutation observer so we can be notified of attachments and removals
		function elementAttached(element) {
			var Class = element.constructor
			if (Class.create) {
	/*			if (Class.attachedInstances) {
					Class.attachedInstances.push(element)
					if (Class.attachedInstances.length === 1 && Class.needsRestart) {
						restart(Class)
					}
				} else {
					Class.attachedInstances = [element]
				}*/
				if (element.attached) {
					element.attached()
				}
				if (element.needsRestart) {
					restart(element)
				}
			}
		}
		function elementDetached(element) {
			/*var attachedInstances = element.constructor.attachedInstances
			if (attachedInstances) {
				var index = attachedInstances.indexOf(element)
				if (index > -1) {
					attachedInstances.splice(index, 1)
					if (attachedInstances.length === 0) {
						cleanup(Class)
					}
				}*/
				if (element.detached) {
					element.detached()
				}
				cleanup(element)
			//}
		}
		if (typeof MutationObserver === 'function') {
			var lifeStates = [{
				name: 'detached',
				nodes: 'removedNodes',
				action: elementDetached
			}, {
				name: 'attached',
				nodes: 'addedNodes',
				action: elementAttached
			}]
			function firstVisit(node, state) {
				if (state.name === 'attached') {
					if (node.__alkaliAttached__) {
						return false
					} else {
						node.__alkaliAttached__ = true
						state.action(node)
						return true
					}
				} else if (node.__alkaliAttached__) {
					if (doc.body.contains(node)) {
						// detached event, but it is actually still attached (will get attached in a later mutation record)
						// so don't get through the detached/attached lifecycle
						return false
					}
					node.__alkaliAttached__ = false
					state.action(node)
				}
				return true
			}
			var observer = new MutationObserver(function(mutations) {
				for (var i = 0, il = mutations.length; i < il; i++) {
					var mutation = mutations[i]
					// invoke action on element if we haven't already
					actionIteration:
					for (var j = 0, jl = lifeStates.length; j < jl; j++) { // two steps, removed nodes and added nodes
						var state = lifeStates[j]
						var nodes = mutation[state.nodes]
						// iterate over node list
						nodeIteration:
						for (var k = 0, kl = nodes.length; k < kl; k++) {
							var baseNode = nodes[k]
							if (firstVisit(baseNode, state)) {
								// start traversal with child, if it exists
								var currentNode = baseNode.firstChild
								if (currentNode) {
									do {
										var nextNode
										if (currentNode.nodeType === 1 && firstVisit(currentNode, state)) {
											// depth-first search
											nextNode = currentNode.firstChild
											if (!nextNode) {
												nextNode = currentNode.nextSibling
											}
										} else {
											nextNode = currentNode.nextSibling
										}
										if (!nextNode) {
											// come back out to parents
											// TODO: try keeping a stack to make this faster
											do {
												currentNode = currentNode.parentNode
												if (currentNode === baseNode) {
													continue nodeIteration
												}
											} while (!(nextNode = currentNode.nextSibling))
										}
										currentNode = nextNode
									} while (true)
								}
							}
						}
						// if (options.moveLiveElementsEnabled) {
							// TODO: any options that we can really do here?
					}
				}
			})
			observer.observe(doc.body || doc, {
				childList: true,
				subtree: true
			})
		}
	
		lang.copy(VariableExports.Context.prototype, {
			specify: function(Variable) {
				var element = this.subject
				var distinctive = true
				;(this.generics || (this.generics = [])).push(Variable)
				do {
					if (this.distinctSubject === element) {
						distinctive = false
					}
					var subjectMap = element.constructor.ownedClasses
					if (subjectMap) {
						var instanceMap = subjectMap.get(Variable)
						if (instanceMap) {
							if (distinctive) {
								this.distinctSubject = element
							}
							specifiedInstance = instanceMap.get(element)
							if (!specifiedInstance) {
								instanceMap.set(element, specifiedInstance = instanceMap.createInstance ?
									instanceMap.createInstance(element) : new Variable())
							}
							return specifiedInstance
						}
					}
				} while ((element = element.parentNode || presumptiveParentMap.get(element)))
				// else if no specific context is found, return default instance
				return Variable.defaultInstance
			},
	
			getContextualized: function(variable) {
				// returns a variable that has already been contextualized
				var element = this.subject
				if (!element) {
					// no element, just use the default variable
					return variable
				}
				if (variable._contextMap) {
					do {
						var instance = variable._contextMap.get(element)
						if (instance && instance.context.matches(element)) {
							return instance
						}
					} while ((element = element.parentNode || presumptiveParentMap.get(element)))
				}
				if (variable.context && variable.context.matches(this.subject)) {
					// check if the default variable is allowed
					return variable
				}
			},
	
			merge: function(childContext) {
				if (!this.distinctSubject ||
						(this.distinctSubject !== childContext.distinctSubject && this.distinctSubject.contains(childContext.distinctSubject))) {
					this.distinctSubject = childContext.distinctSubject
				}
				[].push.apply(this.generics || (this.generics = []), childContext.generics)
			},
			getDistinctElement: function(Variable, element) {
				do {
					var subjectMap = element.constructor.ownedClasses
					if (subjectMap) {
						var instanceMap = subjectMap.get(Variable)
						if (instanceMap && instanceMap.has(element)) {
							return element
						}
					}
				} while ((element = element.parentNode || presumptiveParentMap.get(element)))
			},
			matches: function(element) {
				var generics = this.generics
				if (generics) {
					for (var i = 0, l = generics.length; i < l; i++) {
						if (this.getDistinctElement(generics[i], element) !== this.distinctSubject) {
							return false
						}
					}
				}
				return true
			}
		})
	
	
	
		return Element
	}))

/***/ },
/* 2 */
/***/ function(module, exports, __webpack_require__) {

	var __WEBPACK_AMD_DEFINE_FACTORY__, __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;(function (root, factory) { if (true) {
		!(__WEBPACK_AMD_DEFINE_ARRAY__ = [], __WEBPACK_AMD_DEFINE_FACTORY__ = (factory), __WEBPACK_AMD_DEFINE_RESULT__ = (typeof __WEBPACK_AMD_DEFINE_FACTORY__ === 'function' ? (__WEBPACK_AMD_DEFINE_FACTORY__.apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__)) : __WEBPACK_AMD_DEFINE_FACTORY__), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__)) } else if (typeof module === 'object' && module.exports) {				
		module.exports = factory() // Node
	}}(this, function () {
		var getPrototypeOf = Object.getPrototypeOf || (function(base) { return base.__proto__ })
		var setPrototypeOf = Object.setPrototypeOf || (function(base, proto) { base.__proto__ = proto})
		var hasFeatures = {
			requestAnimationFrame: typeof requestAnimationFrame != 'undefined',
			defineProperty: Object.defineProperty && (function() {
				try{
					Object.defineProperty({}, 't', {})
					return true
				}catch(e) {
				}
			})(),
			promise: typeof Promise !== 'undefined',
			MutationObserver: typeof MutationObserver !== 'undefined',
			'WeakMap': typeof WeakMap === 'function'
		}
		function has(feature) {
			return hasFeatures[feature]
		}
	
		function SyncPromise(value) {
			this.value = value
		}
		SyncPromise.prototype = {
			then: function(onFulfilled, onRejected) {
				if (!onFulfilled) {
					return new SyncPromise(this.value)
				}
				try {
					var result = onFulfilled(this.value)
					return (result && result.then) ? result : new SyncPromise(result)
				} catch(error) {
					return new SyncErrorPromise(error)
				}
			},
			catch: function(handler) {
				return this.then(null, handler)
			}
		}
		function SyncErrorPromise(error) {
			this.value = error
		}
		SyncErrorPromise.prototype = new SyncPromise()
		SyncErrorPromise.prototype.then = function(onFulfilled, onRejected) {
			if (!onRejected) {
				return new SyncErrorPromise(this.value)
			}
			return SyncPromise.prototype.then.call(this, onRejected)
		}
		// This is an polyfill for Object.observe with just enough functionality
		// for what Variables need
		// An observe function, with polyfile
		var observe =
			has('defineProperty') ? 
			function observe(target, listener) {
				/*for(var i in target) {
					addKey(i)
				}*/
				listener.addKey = addKey
				listener.remove = function() {
					listener = null
				}
				return listener
				function addKey(key) {
					var keyFlag = 'key' + key
					if(this[keyFlag]) {
						return
					}else{
						this[keyFlag] = true
					}
					var currentValue = target[key]
					var targetAncestor = target
					var descriptor
					do {
						descriptor = Object.getOwnPropertyDescriptor(targetAncestor, key)
					} while(!descriptor && (targetAncestor = getPrototypeOf(targetAncestor)))
	
					if(descriptor && descriptor.set) {
						var previousSet = descriptor.set
						var previousGet = descriptor.get
						Object.defineProperty(target, key, {
							get: function() {
								return (currentValue = previousGet.call(this))
							},
							set: function(value) {
								previousSet.call(this, value)
								if(currentValue !== value) {
									currentValue = value
									if(listener) {
										listener([{target: this, name: key}])
									}
								}
							},
							enumerable: descriptor.enumerable
						})
					}else{
						Object.defineProperty(target, key, {
							get: function() {
								return currentValue
							},
							set: function(value) {
								if(currentValue !== value) {
									currentValue = value
									if(listener) {
										listener([{target: this, name: key}])
									}
								}
							},
							enumerable: !descriptor || descriptor.enumerable
						})
					}
				}
			} :
			// and finally a polling-based solution, for the really old browsers
			function(target, listener) {
				if(!timerStarted) {
					timerStarted = true
					setInterval(function() {
						for(var i = 0, l = watchedObjects.length; i < l; i++) {
							diff(watchedCopies[i], watchedObjects[i], listeners[i])
						}
					}, 20)
				}
				var copy = {}
				for(var i in target) {
					if(target.hasOwnProperty(i)) {
						copy[i] = target[i]
					}
				}
				watchedObjects.push(target)
				watchedCopies.push(copy)
				listeners.push(listener)
			}
		var queuedListeners
		function queue(listener, object, name) {
			if(queuedListeners) {
				if(queuedListeners.indexOf(listener) === -1) {
					queuedListeners.push(listener)
				}
			}else{
				queuedListeners = [listener]
				lang.nextTurn(function() {
					queuedListeners.forEach(function(listener) {
						var events = []
						listener.properties.forEach(function(property) {
							events.push({target: listener.object, name: property})
						})
						listener(events)
						listener.object = null
						listener.properties = null
					})
					queuedListeners = null
				}, 0)
			}
			listener.object = object
			var properties = listener.properties || (listener.properties = [])
			if(properties.indexOf(name) === -1) {
				properties.push(name)
			}
		}
		var unobserve = has('observe') ? Object.unobserve :
			function(target, listener) {
				if(listener.remove) {
					listener.remove()
				}
				for(var i = 0, l = watchedObjects.length; i < l; i++) {
					if(watchedObjects[i] === target && listeners[i] === listener) {
						watchedObjects.splice(i, 1)
						watchedCopies.splice(i, 1)
						listeners.splice(i, 1)
						return
					}
				}
			}
		var watchedObjects = []
		var watchedCopies = []
		var listeners = []
		var timerStarted = false
		function diff(previous, current, callback) {
			// TODO: keep an array of properties for each watch for faster iteration
			var queued
			for(var i in previous) {
				if(previous.hasOwnProperty(i) && previous[i] !== current[i]) {
					// a property has changed
					previous[i] = current[i]
					(queued || (queued = [])).push({name: i})
				}
			}
			for(var i in current) {
				if(current.hasOwnProperty(i) && !previous.hasOwnProperty(i)) {
					// a property has been added
					previous[i] = current[i]
					(queued || (queued = [])).push({name: i})
				}
			}
			if(queued) {
				callback(queued)
			}
		}
	
		var id = 1
		// a function that returns a function, to stop JSON serialization of an
		// object
		function toJSONHidden() {
			return toJSONHidden
		}
		// An object that will be hidden from JSON serialization
		var Hidden = function () {
		}
		Hidden.prototype.toJSON = toJSONHidden
	
		var extendClass
		try {
			extendClass = eval('(function(Base){ return class extends Base {}})')
		} catch(e) {}
	
		var lang = {
			requestAnimationFrame: has('requestAnimationFrame') ? requestAnimationFrame :
				(function() {
					var toRender = []
					var queued = false
					function processAnimationFrame() {
						for (var i = 0; i < toRender.length; i++) {
							toRender[i]()
						}
						toRender = []
						queued = false
					}
					function requestAnimationFrame(renderer) {
					 	if (!queued) {
							setTimeout(processAnimationFrame)
							queued = true
						}
						toRender.push(renderer)
					}
					return requestAnimationFrame
				})(),
			SyncPromise: SyncPromise,
			Promise: has('promise') ? Promise : (function() {
				function Promise(execute) {
					var isResolved, resolution, errorResolution
					var queue = 0
					function resolve(value) {
						// resolve function
						if(value && value.then) {
							// received a promise, wait for it
							value.then(resolve, reject)
						}else{
							resolution = value
							finished()
						}
					}
					function reject(error) {
						// reject function
						errorResolution = error
						finished()
					}
					execute(resolve, reject)
					function finished() {
						isResolved = true
						for(var i = 0, l = queue.length; i < l; i++) {
							queue[i]()
						}
						// clean out the memory
						queue = 0
					}
					return {
						then: function(callback, errback) {
							return new Promise(function(resolve, reject) {
								function handle() {
									// promise fulfilled, call the appropriate callback
									try{
										if(errorResolution && !errback) {
											// errors without a handler flow through
											reject(errorResolution)
										}else{
											// resolve to the callback's result
											resolve(errorResolution ?
												errback(errorResolution) :
												callback ?
													callback(resolution) : resolution)
										}
									}catch(newError) {
										// caught an error, reject the returned promise
										reject(newError)
									}
								}
								if(isResolved) {
									// already resolved, immediately handle
									handle()
								}else{
									(queue || (queue = [])).push(handle)
								}
							})
						}
					}
				}
				return Promise
			}()),
	
			WeakMap: has('WeakMap') ? WeakMap :
		 	function (values, name) {
		 		var mapProperty = '__' + (name || '') + id++
		 		return has('defineProperty') ?
		 		{
		 			get: function (key) {
		 				return key[mapProperty]
		 			},
		 			set: function (key, value) {
		 				Object.defineProperty(key, mapProperty, {
		 					value: value,
		 					enumerable: false
		 				})
		 			}
		 		} :
		 		{
		 			get: function (key) {
		 				var intermediary = key[mapProperty]
		 				return intermediary && intermediary.value
		 			},
		 			set: function (key, value) {
		 				// we use an intermediary that is hidden from JSON serialization, at least
		 				var intermediary = key[mapProperty] || (key[mapProperty] = new Hidden())
		 				intermediary.value = value
		 			}
		 		}
		 	},
	
			observe: observe,
			unobserve: unobserve,
			extendClass: extendClass,
			when: function(value, callback, errorHandler) {
				return value && value.then ?
					(value.then(callback, errorHandler) || value) : callback(value)
			},
			whenAll: function(inputs, callback) {
				var promiseInvolved
				var readyInputs = []
				var remaining = 1
				var result
				var lastPromiseResult
				for(var i = 0, l = inputs.length; i < l; i++) {
					var input = inputs[i]
					if(input && input.then) {
						remaining++
						(function(i, previousPromiseResult) {
							lastPromiseResult = input.then(function(value) {
								readyInputs[i] = value
								onEach()
								if(!remaining) {
									return result
								}else{
									return previousPromiseResult
								}
							})
						})(i, lastPromiseResult)
					} else {
						readyInputs[i] = input
					}
				}
				onEach()
				if (remaining > 0) {
					return lastPromiseResult
				} else {
					return result
				}
				function onEach() {
					remaining--
					if (!remaining) {
						 result = callback(readyInputs)
					}
				}
			},
			compose: function(Base, constructor, properties) {
				var prototype = constructor.prototype = Object.create(Base.prototype)
				setPrototypeOf(constructor, Base)
				for(var i in properties) {
					prototype[i] = properties[i]
				}
				prototype.constructor = constructor
				return constructor
			},
			nextTurn: has('MutationObserver') ?
				function (callback) {
					// promises don't resolve consistently on the next micro turn (Edge doesn't do it right),
					// so use mutation observer
					// TODO: make a faster mode that doesn't recreate each time
					var div = document.createElement('div')
					var observer = new MutationObserver(callback)
					observer.observe(div, {
						attributes: true
					})
					div.setAttribute('a', id++)
				} :
				function (callback) {
					// TODO: we can do better for other, older browsers
					setTimeout(callback, 0)
				},
			copy: Object.assign || function(target, source) {
				for(var i in source) {
					target[i] = source[i]
				}
				return target
			},
			deepCopy: function(source) {
				if (source && typeof source == 'object') {
					if (source instanceof Array) {
						var target = [] // always create a new array for array targets
						for(var i = 0, l = source.length; i < l; i++) {
							target[i] = lang.deepCopy(source[i])
						}
					} else {
						var target = {}
						for (var i in source) {
							target[i] = lang.deepCopy(source[i])
						}
					}
					return target
				}
				return source
			}
		}
		function isGenerator(func) {
			if (typeof func === 'function') {
				var constructor = func.constructor
				// this is used to handle both native generators and transpiled generators
				return (constructor.displayName || constructor.name) === 'GeneratorFunction'
			}
		}
		function isGeneratorIterator(iterator) {
			if (iterator && iterator.next) {
				let constructor = iterator.constructor.constructor
				return (constructor.displayName || constructor.name) === 'GeneratorFunction'
			}
		}
		lang.isGenerator = isGenerator
	
		function spawn(generator) {
			var generatorIterator = typeof generator === 'function' ? generator() : generator
			var resuming
			var nextValue
			var isThrowing
			return next()
			function next() {
				do {
					var stepReturn = generatorIterator[isThrowing ? 'throw' : 'next'](nextValue)
					if (stepReturn.done) {
						return stepReturn.value
					}
					nextValue = stepReturn.value
					// if the return value is a (generator) iterator, execute it
					if (nextValue && nextValue.next && isGeneratorIterator(nextValue)) {
						nextValue = spawn(nextValue)
					}
					if (nextValue && nextValue.then) {
						// if it is a promise, we will wait on it
						// and return the promise so that the next caller can wait on this
						var resolved
						var isSync = null
						var result = nextValue.then(function(value) {
							nextValue = value
							if (isSync === false) {
								return next()
							} else {
								isSync = true
							}
						}, function(error) {
							nextValue = error
							isThrowing = true
							return next()
						})
						if (!isSync) {
							isSync = false
							return result
						} // else keeping looping to avoid recursion
					}
					isThrowing = false
				} while(true)
			}
		}
		lang.spawn = spawn
		return lang
	}))

/***/ },
/* 3 */
/***/ function(module, exports, __webpack_require__) {

	var __WEBPACK_AMD_DEFINE_FACTORY__, __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;(function (root, factory) { if (true) {
		!(__WEBPACK_AMD_DEFINE_ARRAY__ = [__webpack_require__(2), __webpack_require__(4)], __WEBPACK_AMD_DEFINE_FACTORY__ = (factory), __WEBPACK_AMD_DEFINE_RESULT__ = (typeof __WEBPACK_AMD_DEFINE_FACTORY__ === 'function' ? (__WEBPACK_AMD_DEFINE_FACTORY__.apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__)) : __WEBPACK_AMD_DEFINE_FACTORY__), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__)) } else if (typeof module === 'object' && module.exports) {        
	  module.exports = factory(require('./util/lang'), require('./Variable')) // Node
	}}(this, function (lang, VariableExports) {
		var doc = typeof document !== 'undefined' && document
		var invalidatedElements
		var queued
		var toRender = []
		var nextId = 1
		var requestAnimationFrame = lang.requestAnimationFrame
		var Context = VariableExports.Context
	
		function Renderer(options) {
			var variable = options.variable
	
			this.variable = variable
			if (options.selector) {
				this.selector = options.selector
			}
			if (options.elements) {
				this.elements = options.elements
				this.element = this.elements[0]
				for(var i = 0, l = this.elements.length; i < l; i++) {
					(this.elements[i].alkaliRenderers || (this.elements[i].alkaliRenderers = [])).push(this)
				}
			}
			else if (options.element) {
				var element = this.element = options.element;
				(element.alkaliRenderers || (element.alkaliRenderers = [])).push(this)
			} else {
				throw new Error('No element provided to Renderer')
			}
			if (options.update) {
				this.updateRendering = options.update
			}
			if (options.shouldRender) {
				this.shouldRender = options.shouldRender
			}
			if (options.renderUpdate) {
				this.renderUpdate = options.renderUpdate
			}
			if (options.alwaysUpdate) {
				this.alwaysUpdate = options.alwaysUpdate
			}
			if (!variable.updated) {
				// baconjs-esqe API
				var renderer = this
				variable.subscribe(function (event) {
					// replace the variable with an object
					// that returns the value from the event
					renderer.variable = {
						valueOf: function () {
							return event.value()
						}
					}
					renderer.updated()
				})
			}
			if (options.updateOnStart === false){
				var contextualized = this.contextualized || this.variable
				this.variable.valueOf(this)
				// even if we don't render on start, we still need to compute the value so we can depend on the computed 
				// TODO: we may need to handle recontextualization if it returns a promise
				contextualized.notifies(this)
			} else {
				this.updateRendering(true)
			}
		}
		Renderer.prototype = {
			constructor: Renderer,
			version: 2166136261,
			updateRendering: function () {
				throw new Error ('updateRendering must be implemented by sub class of Renderer')
			},
			updated: function (updateEvent, by, context) {
				if (!this.invalidated) {
					if (!context || this.contextMatches(context)) {
						// do this only once, until we render again
						this.invalidated = true
						if (this.deferredRender) {
							this.deferredRender.isCanceled = true
							this.deferredRender = null
						}
						var renderer = this
						requestAnimationFrame(function(){
							invalidatedElements = null
							renderer.updateRendering(renderer.alwaysUpdate)
						})
					}
				}
			},
			executeWithin: Context.prototype.executeWithin,
			setVersion: function(){
				// this doesn't need its own version/hash
			},
			newContext: function() {
				return new Context(this.element)
			},
			integrate: function(context, contextualized) {
				this.addInput(contextualized)
			},
			addInput: function(contextualized) {
				if (this.variable !== contextualized) {
					this.contextualized = contextualized
				}
			},
			getContextualized: function() {
				return this.contextualized || this.variable
			},
			specify: function(Variable) {
				// a new context to get this
				return this.contextualized = this.newContext().specify(Variable)
			},
			merge: function(){
				// noop
			},
			contextMatches: function(context) {
				return true
			},
			invalidateElement: function(element) {
				if(!invalidatedElements){
					invalidatedElements = new WeakMap(null, 'invalidated')
				}
				var invalidatedParts = invalidatedElements.get(element)
				invalidatedElements.set(element, invalidatedParts = {})
				if (!invalidatedParts[id]) {
					invalidatedParts[id] = true
				}
				if (!queued) {
					lang.queueTask(processQueue)
					queued = true
				}
				var renderer = this
				toRender.push(function(){
					renderer.invalidated = false
					renderer.updateElement(element)
				})
			},
			getId: function(){
				return this.id || (this.id = nextId++)
			},
			stop: function() {
				var contextualized = this.contextualized || this.variable
				contextualized.stopNotifies(this)
			}
		}
	
		function ElementRenderer(options) {
			Renderer.call(this, options)
		}
		ElementRenderer.prototype = Object.create(Renderer.prototype)
		ElementRenderer.prototype.shouldRender = function (element) {
			return document.body.contains(element)
		}
		ElementRenderer.prototype.getSubject = function () {
			return this.element
		}
		ElementRenderer.prototype.updateRendering = function (always, element) {
			if (!element && this.elements) {
				var elements = this.elements
				if(!elements.length){
					if(this.selector){
						elements = document.querySelectorAll(this.selector)
					}else{
						throw new Error('No element or selector was provided to the Renderer')
					}
					return
				}
				for(var i = 0, l = elements.length; i < l; i++){
					this.updateRendering(always, elements[i])
				}
			} else {
				var thisElement = element || this.element
	
				if(always || this.shouldRender(thisElement)){
					// it is connected
					this.updateElement(thisElement)
				} else {
					var id = this.getId()
					var renderers = thisElement.renderersOnShow
					if(!renderers){
						renderers = thisElement.renderersOnShow = []
						thisElement.className += ' needs-rerendering'
					}
					if (!renderers[id]) {
						renderers[id] = this
					}
				}
			}
		}
		ElementRenderer.prototype.addElement = function (element) {
			if (this.selector) {
				element.renderersOnShow = [this]
			} else {
				this.elements.push(element)
			}
			// and immediately do an update
			this.updateElement(element)
		}
		ElementRenderer.prototype.updateElement = function(element) {
			this.invalidated = false
			if (this.omitValueOf) {
				this.started = true
				this.renderUpdate(undefined, element)
				return
			}
			var resolved
			var renderer = this
			var deferredRender = this.executeWithin(function() {
				return renderer.variable.then()
			})
			deferredRender.then(function(value) {
				resolved = true
				if (!deferredRender.isCanceled) {
					if (deferredRender === renderer.deferredRender) {
						renderer.deferredRender = null
					}
					var contextualized = renderer.contextualized || renderer.variable
					contextualized.notifies(renderer)
					if(value !== undefined || renderer.started){
						renderer.started = true
						renderer.renderUpdate(value, element)
					}
				}
			})
			if(!resolved){
				// start listening for changes immediately
				var contextualized = this.contextualized || this.variable
				contextualized.notifies(renderer)
				this.deferredRender = deferredRender
				if (this.renderLoading) {
					// if we have loading renderer call it
					this.renderLoading(deferredRender, element)
				}
			}
		}
		ElementRenderer.prototype.renderUpdate = function (newValue, element) {
			throw new Error('renderUpdate(newValue) must be implemented')
		}
		Renderer.Renderer = Renderer
		Renderer.ElementRenderer = ElementRenderer
	
		function AttributeRenderer(options) {
			if(options.name){
				this.name = options.name
			}
			ElementRenderer.apply(this, arguments)
		}
		AttributeRenderer.prototype = Object.create(ElementRenderer.prototype)
		AttributeRenderer.prototype.type = 'AttributeRenderer'
		AttributeRenderer.prototype.renderUpdate = function (newValue, element) {
			element.setAttribute(this.name, newValue)
		}
		Renderer.AttributeRenderer = AttributeRenderer
	
		function PropertyRenderer(options) {
			if (options.name) {
				this.name = options.name
			}
			ElementRenderer.apply(this, arguments)
		}
		PropertyRenderer.prototype = Object.create(ElementRenderer.prototype)
		PropertyRenderer.prototype.type = 'PropertyRenderer'
		PropertyRenderer.prototype.renderUpdate = function (newValue, element) {
			element[this.name] = newValue
		}
		Renderer.PropertyRenderer = PropertyRenderer
	
		function InputPropertyRenderer(options) {
			if (options.element && options.element.tagName === 'SELECT' && options.name === 'value') {
				// use the deferred value assignment for <select>
				this.renderUpdate = this.renderSelectValueUpdate
			}
			PropertyRenderer.apply(this, arguments)
		}
		InputPropertyRenderer.prototype = Object.create(PropertyRenderer.prototype)
		InputPropertyRenderer.prototype.type = 'InputPropertyRenderer'
		InputPropertyRenderer.prototype.renderUpdate = function(newValue, element) {
			if (newValue == null || (element.type === 'number' && isNaN(newValue))) {
				newValue = ''
			}
			var oldValue = element[this.name]
			if (typeof oldValue === 'string' && typeof newValue !== 'string') {
				newValue = newValue == null ? '' : String(newValue)
			}
			if (oldValue != newValue) {
				element[this.name] = newValue
			}
		}
		InputPropertyRenderer.prototype.renderSelectValueUpdate = function (newValue, element) {
			element.value = newValue
			if (element.value != newValue && !element.value) {
				// if we didn't successfully set the value of a <select>, we may need to wait until the children are constructed
				element.eventualValue = newValue
				lang.nextTurn(function() {
					if (element.eventualValue) {
						element.value = element.eventualValue
						element.eventualValue = undefined
					}
				})
			} else {
				element.eventualValue = undefined
			}
		}
		Renderer.InputPropertyRenderer = InputPropertyRenderer
	
		function StyleRenderer(options) {
			if(options.name){
				this.name = options.name
			}
			ElementRenderer.apply(this, arguments)
		}
		StyleRenderer.prototype = Object.create(ElementRenderer.prototype)
		StyleRenderer.prototype.type = 'StyleRenderer'
		StyleRenderer.prototype.renderUpdate = function (newValue, element) {
			element.style[this.name] = newValue
		}
		Renderer.StyleRenderer = StyleRenderer
	
		function ContentRenderer(options) {
			ElementRenderer.apply(this, arguments)
		}
		ContentRenderer.prototype = Object.create(ElementRenderer.prototype)
		ContentRenderer.prototype.type = 'ContentRenderer'
		ContentRenderer.prototype.renderUpdate = function (newValue, element) {
			element.innerHTML = ''
			if (newValue === undefined){
				newValue = ''
			}
			element.appendChild(document.createTextNode(newValue))
		}
		Renderer.ContentRenderer = ContentRenderer
	
		function TextRenderer(options) {
			this.position = options.position
			this.textNode = options.textNode
			ElementRenderer.apply(this, arguments)
		}
		TextRenderer.prototype = Object.create(ElementRenderer.prototype)
		TextRenderer.prototype.type = 'TextRenderer'
		TextRenderer.prototype.updated = function (updateEvent, context) {
			if (this.builtList) {
				if (updateEvent.type === 'refresh') {
					this.builtList = false
					this.omitValueOf = false
				} else {
					(this.updates || (this.updates = [])).push(updateEvent)
				}
			}
			ElementRenderer.prototype.updated.call(this, updateEvent, context)
		}
		TextRenderer.prototype.renderUpdate = function (newValue, element) {
			if (newValue == null){
				newValue = ''
			}
			if (newValue.create) {
				newValue = newValue.create({parent: element})
			}
			if (newValue.nodeType) {
				if (this.textNode && this.textNode.parentNode == element) {
					// text node is attached, we can replace it with the node
					element.replaceChild(newValue, this.textNode)
				} else {
					element.appendChild(newValue)
				}
				this.textNode = newValue
			} else if (newValue instanceof Array) {
				this.renderUpdate = ListRenderer.prototype.renderUpdate
				this.omitValueOf = true
				this.renderUpdate(newValue, element)
			} else {
				(this.textNode || element.childNodes[this.position]).nodeValue = newValue
			}
		}
		Renderer.TextRenderer = TextRenderer
	
		function ListRenderer(options) {
			if (options.each) {
				this.each = options.each
			}
			ElementRenderer.apply(this, arguments)
		}
		ListRenderer.prototype = Object.create(ElementRenderer.prototype)
		ListRenderer.prototype.updated = function (updateEvent, context) {
			if (this.builtList) {
				if (updateEvent.type === 'refresh') {
					this.builtList = false
					this.omitValueOf = false
				} else {
					(this.updates || (this.updates = [])).push(updateEvent)
				}
			}
			ElementRenderer.prototype.updated.call(this, updateEvent, context)
		}
		ListRenderer.prototype.type = 'ListRenderer'
		ListRenderer.prototype.renderUpdate = function (newValue, element) {
			var container
			var each = this.each || function(item) { // TODO: make a single identity function
				return item
			}
			var thisElement = this.element
			var renderer = this
			if (!this.builtList) {
				this.builtList = true
				this.omitValueOf = true
				element.innerHTML = ''
				var childElements = this.childElements = []
				if (each.defineHasOwn) {
					each.defineHasOwn()
				}
				if (newValue) {
					newValue.forEach(function(item) {
						childElements.push(Renderer.append(thisElement, eachItem(item)))
					})
				}
				var contextualized = this.contextualized || this.variable
				contextualized.notifies(this)
	
				// TODO: restore using a doc fragment to add these items:
				// thisElement.appendChild(container)
			} else {
				var childElements = this.childElements
				var updates = this.updates
				container = thisElement
				updates.forEach(function(update) {
					if (update.type === 'refresh') {
						renderer.builtList = false
						for (var i = 0, l = childElements.length; i < l; i++) {
							thisElement.removeChild(childElements[i])
						}
						renderer.renderUpdate()
					} else {
						if (update.previousIndex > -1) {
							thisElement.removeChild(childElements[update.previousIndex])
							childElements.splice(update.previousIndex, 1)
						}
						if (update.index > -1) {
							var nextChild = childElements[update.index]
							var newElement = Renderer.append(thisElement, eachItem(update.value))
							if (nextChild) {
								thisElement.insertBefore(newElement, nextChild)
								childElements.splice(update.index, 0, newElement)
							} else {
								childElements.push(newElement)
							}
						}
					}
				})
				this.updates = [] // clear the updates
			}
			function eachItem(item) {
				var childElement
				if (each.create) {
					childElement = each.create({parent: thisElement, _item: item}) // TODO: make a faster object here potentially
				} else {
					childElement = each(item, thisElement)
					if (childElement.create) {
						childElement = childElement.create({parent: thisElement, _item: item})
					}
				}
				return childElement
			}
		}
		Renderer.ListRenderer = ListRenderer
	
		Renderer.onShowElement = function(shownElement){
			requestAnimationFrame(function(){
				invalidatedElements = null
				var elements = [].slice.call(shownElement.getElementsByClassName('needs-rerendering'))
				if (shownElement.className.indexOf('needs-rerendering') > 0){
					var includingTop = [shownElement]
					includingTop.push.apply(includingTop, elements)
					elements = includingTop
				}
				for (var i = 0, l = elements.length; i < l; i++){
					var element = elements[i]
					var renderers = element.renderersOnShow
					if(renderers){
						element.renderersOnShow = null
						// remove needs-rerendering class
						element.className = element.className.replace(/\s?needs\-rerendering\s?/g, '')
						for (var id in renderers) {
							var renderer = renderers[id]
							renderer.updateElement(element)
						}
					}
				}
			})
		}
	
		function onElementRemoval(element){
			// cleanup element renderers
			if(element.alkaliRenderers){
				var renderers = element.alkaliRenderers
				for(var i = 0; i < renderers.length; i++){
					var renderer = renderers[i]
					renderer.variable.stopNotifies(renderer)
				}
			}
		}
		Renderer.onElementRemoval = function(element, onlyChildren){
			if(!onlyChildren){
				onElementRemoval(element)
			}
			var children = element.getElementsByTagName('*')
			for(var i = 0, l = children.length; i < l; i++){
				var child = children[i]
				if(child.alkaliRenderers){
					onElementRemoval(child)
				}
			}
		}
		return Renderer
	}))


/***/ },
/* 4 */
/***/ function(module, exports, __webpack_require__) {

	var __WEBPACK_AMD_DEFINE_FACTORY__, __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;(function (root, factory) { if (true) {
		!(__WEBPACK_AMD_DEFINE_ARRAY__ = [__webpack_require__(2)], __WEBPACK_AMD_DEFINE_FACTORY__ = (factory), __WEBPACK_AMD_DEFINE_RESULT__ = (typeof __WEBPACK_AMD_DEFINE_FACTORY__ === 'function' ? (__WEBPACK_AMD_DEFINE_FACTORY__.apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__)) : __WEBPACK_AMD_DEFINE_FACTORY__), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__)) } else if (typeof module === 'object' && module.exports) {				
		module.exports = factory(require('./util/lang')) // Node
	}}(this, function (lang) {
		var deny = {}
		var noChange = {}
		var context
		var WeakMap = lang.WeakMap
		var setPrototypeOf = Object.setPrototypeOf || (function(base, proto) { base.__proto__ = proto})
		var getPrototypeOf = Object.getPrototypeOf || (function(base) { return base.__proto__ })
		var isGenerator = lang.isGenerator
		var undefined // makes it faster to be locally scoped
		// update types
		var RequestChange = 3
		var RequestSet = 4
		var NOT_MODIFIED = {}
	
		var propertyListenersMap = new WeakMap(null, 'propertyListenersMap')
		var isStructureChecked = new WeakMap()
		var nextVersion = Date.now()
	
		var CacheEntry = lang.compose(WeakMap, function() {
		},{
			_propertyChange: function(propertyName) {
				this.variable._propertyChange(propertyName, contextFromCache(this))
			}
		})
		var listenerId = 1
	
		function when(value, callback, errback) {
			if (value && value.then) {
				return value.then(callback, errback)
			}
			return callback(value)
		}
		function whenStrict(value, callback) {
			if (value && value.then && !value.notifies) {
				return value.then(callback)
			}
			return callback(value)
		}
	
		function Context(subject){
			this.subject = subject
			this.sources = []
		}
		Context.prototype = {
			constructor: Context,
			newContext: function(variable) {
				return new Context(this.subject)
			},
			executeWithin: function(executor) {
				var previousContext = context
				try {
					context = this
					return executor()
				} finally {
					context = previousContext
				}
			},
			//version: 2166136261, // FNV-1a prime seed
			version: 0,
			restart: function() {
				//this.version = 2166136261
			},
			contextualize: function(variable, parentContext) {
				// resolve the contextualization of a variable, and updates this context to be aware of what distinctive aspect of the context has
				// been used for resolution
				var contextualized
				if (this.distinctSubject) {
					var contextMap = variable._contextMap || (variable._contextMap = new WeakMap())
					contextualized = contextMap.get(this.distinctSubject)
					if (!contextualized) {
						contextMap.set(this.distinctSubject, contextualized = Object.create(variable))
						contextualized.listeners = false
						contextualized.context = this
						var sources = this.sources
						for (var i = 0, l = sources.length; i < l; i++) {
							contextualized[sources[i]] = sources[++i]
						}
					}
					this.contextualized = contextualized
					// do the merge
					if (parentContext) {
						parentContext.merge(this)
					}
				} else {
					contextualized = variable
				}
				//if (this.contextualized && this.contextualized !== contextualized) {
					// TOOD: if it has previously been contextualized to a different context (can happen in a promise/async situation), stop previous notifiers and start new ones
				//}
				return contextualized
			},
			integrate: function(context, contextualized) {
				this.addInput(contextualized)
				this.setVersion(context.version)
				this.setVersion(Math.max(contextualized.version || 0, contextualized.versionWithChildren || 0))
			},
			setVersion: function(version) {
	/*			// FNV1a hash algorithm 32-bit
				return this.version = (this.version ^ (version || 0)) * 16777619 >>> 0*/
	
	/*			// 54 bit FNV1a hash algorithm
				var xored = this.version ^ (version || 0)
				// 435 + 1099511627776 = 1099511628211 is 64 bit FNV prime
				return this.version =
					xored * 435 + // compute hash on lower 32 bits
					(xor & 16777215) * 1099511627776 + // compute hash on lower 24 bits that overflow into upper 32 bits
					((this.version / 4294967296 >>> 0) * 435 & 2097151) * 4294967296 // hash on upper 32 bits*/
				// 54 bit derivative of FNV1a that better uses JS numbers/operators
				
				// a fast, efficient hash
				//return this.version = (this.version ^ (version || 0)) * 1049011 + (this.version / 5555555 >>> 0)
				// if we are using globally monotonically increasing version, we can just use max
				if (isNaN(version)) {
					throw new Error('Bad version')
				}
				return this.version = Math.max(this.version, version)
			},
			merge: function(childContext) {
				if (!this.distinctSubject) {
					this.distinctSubject = childContext.distinctSubject
				}
			},
			specify: function(Variable) {
				// specify a particular instance of a generic variable
				var subject = this.subject
				var subjectMap = subject.constructor.ownedClasses
				var specifiedInstance
				if (subjectMap) {
					if (!this.distinctSubject) {
						this.distinctSubject = subject
					}
					var instanceMap = subjectMap.get(Variable)
					if (instanceMap) {
						specifiedInstance = instanceMap.get(subject)
						if (!specifiedInstance) {
							instanceMap.set(subject, specifiedInstance = instanceMap.createInstance ? instanceMap.createInstance(subject) : new Variable())
						}
						return specifiedInstance
					}
				}
				// else if no specific context is found, return default instance
				return Variable.defaultInstance
			},
			getContextualized: function(variable) {
				if (!this.subject) {
					// no subject, just use the default variable
					return variable
				}
				// returns a variable that has already been contextualized
				var instance = variable._contextMap && this.subject && variable._contextMap.get(this.subject)
				if (instance && instance.context && instance.context.matches(this)) {
					return instance
				}
			},
			addInput: function(sourceVariable) {
				this.sources.push(this.nextProperty, sourceVariable)
			},
			matches: function(context) {
				// does another context match the resolution of this one?
				return context.subject === this.subject
			}
		}
	
		function NotifyingContext(listener, subject){
			this.subject = subject
			this.listener = listener
		}
		NotifyingContext.prototype = Object.create(Context.prototype)
		NotifyingContext.prototype.constructor = NotifyingContext
		NotifyingContext.prototype.addInput = function(contextualized) {
			contextualized.notifies(this.listener)
		}
	
		var whenAll = lang.whenAll
	
		function registerListener(value, listener) {
			var listeners = propertyListenersMap.get(value)
			var id = listener.listenerId || (listener.listenerId = ('-' + listenerId++))
			if (listeners) {
				if (listeners[id] === undefined) {
					listeners[id] = listeners.push(listener) - 1
				}
			}else{
				propertyListenersMap.set(value, listeners = [listener])
				listeners[id] = 0
				if (Variable.autoObserveObjects) {
					observe(value)
				}
			}
			listener.listeningToObject = value
		}
		function deregisterListener(listener) {
			if (listener.listeningToObject) {
				var value = listener.listeningToObject
				listener.listeningToObject = null
				var listeners = propertyListenersMap.get(value)
				if (listeners) {
					var index = listeners[listener.listenerId]
					if (index > -1) {
						listeners.splice(index, 1)
						delete listeners[listener.listenerId]
					}
				}
			}
		}
	
		function RefreshEvent() {
			this.visited = new Set()
		}
		RefreshEvent.prototype.type = 'refresh'
	
		function PropertyChangeEvent(key, childEvent, parent) {
			this.key = key
			this.childEvent = childEvent
			this.parent = parent
			this.visited = childEvent.visited
		}
		PropertyChangeEvent.prototype.type = 'update'
	
		function AddEvent(args) {
			this.visited = new Set()
			for (var key in args) {
				this[key] = args[key]
			}
		}
		AddEvent.prototype.type = 'add'
		function DeleteEvent(args) {
			this.visited = new Set()
			for (var key in args) {
				this[key] = args[key]
			}
		}
		DeleteEvent.prototype.type = 'delete'
	
		function forPropertyNotifyingValues(variable, properties, callback) {
			if (variable === properties) {
				forPropertyNotifyingValues(variable, variable._properties, callback)
			}
			for (var key in properties) {
				var property = properties[key]
				if (property && property.parent == variable) {
					if (property.returnedVariable) {
						callback(property.returnedVariable)
					}
					if (property.hasChildNotifiers) {
						var subProperties = property._properties
						if (subProperties) {
							forPropertyNotifyingValues(property, property, callback)
						}
					}
				}
			}
		}
	
		function assignPromise(variable, promise, callback) {
			var isSync
			promise.then(function(value) {
				if (isSync !== false) {
					// synchronous resolution
					isSync = true
				} else if (variable.promise === promise) {
					// async resolution make sure we are the still the most recent promise
					variable.promise = null
				} else {
					// if async and we are not the most recent, just return
					return
				}
				if (callback) { // custom handler
					callback(value) 
				} else {
					variable.value = value
				}
			}, function(error) {
				if (isSync !== false) {
					// synchronous resolution
					isSync = true
				} else if (variable.promise === promise) {
					// async resolution make sure we are the still the most recent promise
					variable.promise = null
				} else {
					// if async and we are not the most recent, just return
					return
				}
				variable.error = error
			})
			if (!isSync) {
				isSync = false
				variable.promise = promise
			}
			return promise
		}
	
		function Variable(value) {
			if (this instanceof Variable) {
				// new call, may eventually use new.target
				if (value !== undefined) {
					if (value && value.then && !value.notifies) {
						assignPromise(this, value)
					} else {
						this.value = value
					}
				}
			} else {
				return Variable.with(value)
			}
		}
	
		Variable._logStackTrace = function(v) {
			var stack = (new Error().stack || '').split(/[\r\n]+/)
			if (stack[0] && /^Error\s*/.test(stack[0])) stack.shift()
			if (stack[0] && /_logStackTrace/.test(stack[0])) stack.shift()
			var coalesce = (this._debugOpts && this._debugOpts.coalesce) || []
			if (this._debugOpts && this._debugOpts.shortStackTrace) {
				// find the first non-coalesced line
				var line
				stack.some(function(line) {
					if (!coalesce.some(function(re) {
						return re.re.test(line)
					})) {
						line = stack[0]
					}
				})
				console.log('Variable ' + v.__debug + ' changed', line && line.replace(/^\s+/, ''))
			} else {
				if (coalesce.length) {
					var s = []
					var re
					for (var i = 0; i < stack.length; i++) {
						var line = stack[i]
						if (re) {
							if (re.test(line)) continue
							re = null
						}
						re
						coalesce.some(function(re) {
							return re = re.re.test(line)
						})
						line = line.replace(/^\s+/,'')
						if (re) {
							s.push('(' + re.name + ') ' + line)
							re = re.re
						} else {
							s.push(line)
						}
					}
					stack = s
				}
				var stackObject = this._debugOpts && this._debugOpts.stackObject
				if (stackObject) {
					console.log('Variable ' + v.__debug + ' changed', stack)
				} else {
					console.log('Variable ' + v.__debug + ' changed\r\n' + stack.join('\r\n'))
				}
			}
		}
	
		Variable._debugOpts = {
			coalesce: [{ name: 'alkali', re: /\/alkali\// }, { name: 'Promise', re: /(Promise\.)|(PromiseArray\.)|(\/bluebird\/)/ }],
			stackObject: false
		}
	
		var VariablePrototype = Variable.prototype = {
			// for debugging use
			get _currentValue() {
				return this.valueOf()
			},
			set _currentValue(value) {
				this.put(value)
			},
			constructor: Variable,
			valueOf: function() {
				return this.gotValue(true, this.getValue(true))
			},
			then: function(onFulfilled, onRejected) {
				var result = this.gotValue(false, this.getValue())
				if (!result || !result.then) {
					result = new lang.SyncPromise(result) // ensure it is promise-like
				}
				if (onFulfilled || onRejected) { // call then if we have any callbacks
					return result.then(onFulfilled, onRejected)
				}
				return result
			},
			getValue: function(sync, forModification, forChild) {
				if (context) {
					context.setVersion(forChild ? this.version : Math.max(this.version || 0, this.versionWithChildren || 0))
				}
				if (this.parent) {
					if (context) {
						if (context.ifModifiedSince != null) {
							// just too complicated to handle NOT_MODIFED objects for now
							// TODO: Maybe handle this and delegate NOT_MODIFIED through this
							// chain and through gotValue
							context.ifModifiedSince = undefined 
						}
					}
					var key = this.key
					var property = this
					var parent = this.parent
					var object
					if (parent.getValue) {
						// parent needs value context, might want to do separate context,
						// but would need to treat special so it retrieves the version
						// only and not the versionWithChildren
						object = parent.getValue(sync, forModification, true)
					} else {
						object = parent.value
					}
					if (!sync && object && object.then && !object.notifies) {
						return when(object, function(object) {
							var value = object == null ? undefined :
								typeof object.property === 'function' ? object.property(key) :
								typeof object.get === 'function' ? object.get(key) : object[key]
							//if (property.listeners) {
								var listeners = propertyListenersMap.get(object)
								if (listeners && listeners.observer && listeners.observer.addKey) {
									listeners.observer.addKey(key)
								}
							//}
							return value
						})
					}
					var value = object == null ? undefined :
						typeof object.property === 'function' ? object.property(key) :
						typeof object.get === 'function' ? object.get(key) : object[key]
					//if (property.listeners) {
						var listeners = propertyListenersMap.get(object)
						if (listeners && listeners.observer && listeners.observer.addKey) {
							listeners.observer.addKey(key)
						}
					//}
					return value
				}
				if (this.promise) {
					if (sync) {
						if (context) {
							context.notResolvedYet = true
						}
					} else { // async mode, we are fine with waiting
						return this.promise
					}
				}
				var value = this.value
				return value !== undefined ?
					this.value :
					forModification ? (this.value = lang.deepCopy(this.default && this.default.valueOf())) : this.default
			},
			gotValue: function(sync, value) {
				var previousNotifyingValue = this.returnedVariable
				var variable = this
				if (previousNotifyingValue) {
					if (value === previousNotifyingValue) {
						// nothing changed, immediately return valueOf
						return sync ? value.valueOf() : value.then()
					}
					// if there was a another value that we were dependent on before, stop listening to it
					// TODO: we may want to consider doing cleanup after the next rendering turn
					if (variable.listeners) {
						previousNotifyingValue.stopNotifies(variable)
					}
					variable.returnedVariable = null
				}
				if (value && value.notifies) {
					variable.returnedVariable = value
					if (variable.listeners) {
						value.notifies(variable)
					}
					if (sync) {
						value = value.valueOf()
					}
				}
				if (!sync && value && value.then) {
					var deferredContext = context
					return value.then(function(value) {
						if (value && value.subscribe) {
							if (deferredContext) {
								return deferredContext.executeWithin(function() {
									return Variable.prototype.gotValue.call(variable, sync, value)
								})
							} else {
								return Variable.prototype.gotValue.call(variable, sync, value)							
							}
						}
						return value
					})
				}
				return value
			},
			PropertyClass: Variable,
			property: function(key, PropertyClass) {
				var propertyVariable = this[key]
				if (!propertyVariable || !propertyVariable.notifies) {
					propertyVariable = this._properties && this._properties[key]
				}
				if (!propertyVariable) {
					// create the property variable
					var Class = PropertyClass
					if (!Class) {
						Class = this.constructor[key]
						if (typeof Class !== 'function' || !Class.isPropertyClass) {
							Class = this.PropertyClass
						}
					}
					propertyVariable = new Class()
					propertyVariable.key = key
					propertyVariable.parent = this
					if (this[key] === undefined) {
						this[key] = propertyVariable
					} else {
						(this._properties || (this._properties = {}))[key] = propertyVariable
					}
				} else if (PropertyClass) {
					if (!(propertyVariable instanceof PropertyClass)) {
						throw new TypeError('Existing property variable does not match requested variable type')
					}
				}
				return propertyVariable
			},
			for: function(subject) {
				if (subject && subject.target && !subject.constructor.getForClass) {
					// makes HTML events work
					subject = subject.target
				}
				if (this.parent) {
					return this.parent.for(subject).property(this.key)
				}
				return new ContextualizedVariable(this, subject || defaultContext)
			},
			_changeValue: function(type, newValue) {
				var key = this.key
				var parent = this.parent
				if (!parent) {
					return this.put(newValue, context)
				}
				var variable = this
				var object = parent.getValue ? parent.getValue(true, true, true) : parent.value
				if (object == null) {
					// nothing there yet, create an object to hold the new property
					parent.put(object = typeof key == 'number' ? [] : {})
				} else if (typeof object != 'object') {
					// if the parent is not an object, we can't set anything (that will be retained)
					var error = new Error('Can not set property on non-object')
					error.deniedPut = true
					throw error
	
				}
				var oldValue = typeof object.get === 'function' ? object.get(key) : object[key]
				if (oldValue === newValue && typeof newValue != 'object') {
					// no actual change to make
					return noChange
				}
				if (typeof object.set === 'function') {
					object.set(key, newValue)
				} else {
					if (type == RequestChange && oldValue && oldValue.put && (!newValue && newValue.put)) {
						// if a put and the property value is a variable, assign it to that.
						oldValue.put(newValue)
					} else {
						if (newValue && newValue.then && !newValue.notifies) {
							newValue = assignPromise(this, newValue, function(value) {
								object[key] = value
							})
						} else {
							object[key] = newValue
						}
						// or set the setter/getter
					}
				}
				var event = new RefreshEvent()
				event.oldValue = oldValue
				event.target = variable
				variable.updated(event, variable)
	
				// now notify any object listeners
				var listeners = propertyListenersMap.get(object)
				// we need to do it before the other listeners, so we can update it before
				// we trigger a full clobbering of the object
				if (listeners) {
					listeners = listeners.slice(0)
					for (var i = 0, l = listeners.length; i < l; i++) {
						var listener = listeners[i]
						if (listener !== parent) {
							// now go ahead and actually trigger the other listeners (but make sure we don't do the parent again)
							listener._propertyChange(key, object, type)
						}
					}
				}
				return newValue
			},
	
			_propertyChange: function(propertyName, object, type) {
				if (this.onPropertyChange) {
					this.onPropertyChange(propertyName, object)
				}
				this.updated(new PropertyChangeEvent(propertyName, new RefreshEvent(), this))
			},
			eachKey: function(callback) {
				for (var i in this._properties) {
					callback(i)
				}
				for (var i in this) {
					if (this.hasOwnProperty[i]) {
						var value = this[i]
						if (value && value.parent == this && value.listeners) {
							callback(i)
						}
					}
				}
			},
			apply: function(instance, args) {
				return new Transform(args[0], this, args)
			},
			call: function(instance) {
				return this.apply(instance, Array.prototype.slice.call(arguments, 1))
			},
			forDependencies: function(callback) {
				if (this.returnedVariable) {
					callback(this.returnedVariable)
				}
				if (this.hasNotifyingChild) {
					forPropertyNotifyingValues(this, this, callback)
				}
				if (this.parent) {
					callback(this.parent)
				}
			},
			init: function() {
				var variable = this
				this.forDependencies(function(dependency) {
					dependency.notifies(variable)
				})
	
				if (this.listeningToObject === null) {
					// we were previously listening to an object, but it needs to be restored
					// calling valueOf will cause the listening object to be restored
					this.valueOf()
				}
			},
			cleanup: function() {
				this.listeners = false
				var handles = this.handles
				if (handles) {
					for (var i = 0; i < handles.length; i++) {
						handles[i].remove()
					}
				}
				this.handles = null
				var returnedVariable = this.returnedVariable
				var variable = this
				this.forDependencies(function(dependency) {
					dependency.stopNotifies(variable)
				})
			},
	
			version: 0,
			versionWithChildren: 0,
	
			updateVersion: function(version) {
				this.version = nextVersion = Math.max(Date.now(), nextVersion + 1)
			},
	
			getVersion: function() {
				return Math.max(this.version,
					this.returnedVariable && this.returnedVariable.getVersion ? this.returnedVariable.getFullVersion(context) : 0,
					this.parent ? this.parent.getVersion(context) : 0)
			},
			getFullVersion: function() {
				return Math.max(this.versionWithChildren, this.getVersion())
			},
	
			getSubject: function(selectVariable) {
				return this.subject
			},
	
			getUpdates: function(since) {
				var updates = []
				var nextUpdateMap = this.nextUpdateMap
				if (nextUpdateMap && since) {
					while ((since = nextUpdateMap.get(since))) {
						if (since.type === 'refresh') {
							// if it was refresh, we can clear any prior entries
							updates = []
						}
						updates.push(since)
					}
				}
				return updates
			},
	
			updated: function(updateEvent, by, isDownstream) {
				if (!updateEvent) {
					updateEvent = new RefreshEvent()
					updateEvent.source = this
				}
				if (updateEvent.visited.has(this)){
					// if this event has already visited this variable, skip it
					return updateEvent
				}
				updateEvent.visited.add(this)
				if (this.__debug) {
					// debug is on
					Variable._logStackTrace(this)
				}
	
				/*var contextualInstance = context && context.getContextualized(this)
				if (contextualInstance) {
					contextualInstance.updated(updateEvent, this)
				}
	
				// at some point we could do an update list so that we could incrementally update
				// lists in non-live situations
				if (this.lastUpdate) {
					var nextUpdateMap = this.nextUpdateMap
					if (!nextUpdateMap) {
						nextUpdateMap = this.nextUpdateMap = new WeakMap()
					}
					nextUpdateMap.set(this.lastUpdate, updateEvent)
				}
	
				this.lastUpdate = updateEvent */
				if (updateEvent instanceof PropertyChangeEvent) {
					this.versionWithChildren = Math.max(Date.now(), nextVersion + 1)
				} else if (!isDownstream) {
					this.updateVersion()
				}
	
				var listeners = this.listeners
				if (listeners) {
					var variable = this
					// make a copy, in case they change
					listeners = listeners.slice()
					for (var i = 0, l = listeners.length; i < l; i++) {
						var dependent = listeners[i]
						if ((updateEvent instanceof PropertyChangeEvent) &&
								dependent.parent) {
							if (dependent.key === updateEvent.key) {
								dependent.updated(updateEvent.childEvent, variable, true)
							}
						} else {
							dependent.updated(updateEvent, variable, true)
						}
					}
				}
				if (updateEvent instanceof PropertyChangeEvent) {
					if (this.returnedVariable && this.fixed) {
						this.returnedVariable.updated(updateEvent, this)
					}
					if (this.constructor.collection) {
						this.constructor.collection.updated(updateEvent, this)
					}
				}
				if (this.parent) {
					this.parent.updated(new PropertyChangeEvent(this.key, updateEvent, this.parent), this)
				}
				if (this.collection) {
					this.collection.updated(updateEvent, this)
				}
				return updateEvent
			},
	
			invalidate: function() {
				// for back-compatibility for now
				this.updated()
			},
	
			notifies: function(target) {
				if (!target) {
					throw new Error('No listener provided for notification')
				}
				var listeners = this.listeners
				if (!listeners || !this.hasOwnProperty('listeners')) {
					this.listeners = listeners = [target]
					this.init()
				} else if (listeners.indexOf(target) === -1) {
					listeners.push(target)
				}
			},
			subscribe: function(listener) {
				// ES7 Observable (and baconjs) compatible API
				var updated
				var updateQueued
				var variable = this
				// it is important to make sure you register for notifications before getting the value
				if (typeof listener === 'function') {
					// BaconJS compatible API
					var variable = this
					var event = {
						value: function() {
							return variable.valueOf()
						}
					}
					updated = function() {
						updateQueued = false
						listener(event)
					}
				}	else if (listener.next) {
					// Assuming ES7 Observable API. It is actually a streaming API, this pretty much violates all principles of reactivity, but we will support it
					updated = function() {
						updateQueued = false
						variable.then(function(value) {
							listener.next(value)
						}, function(error) {
							listener.error(value)
						})
					}
				} else {
					throw new Error('Subscribing to an invalid listener, the listener must be a function, or have an update or next method')
				}
				var updateReceiver = {
					updated: function() {
						if (updateQueued) {
							return
						}
						updateQueued = true
						lang.nextTurn(updated)
					}
				}
				updated()
				this.notifies(updateReceiver)
				return {
					unsubscribe: function() {
						variable.stopNotifies(updateReceiver)
					}
				}
			},
			stopNotifies: function(dependent) {
				var listeners = this.listeners
				if (listeners) {
					var index = listeners.indexOf(dependent)
					if (index > -1) {
						listeners.splice(index, 1)
						if (listeners.length === 0) {
							// clear the listeners so it will be reinitialized if it has
							// listeners again
							this.cleanup()
						}
					}
				}
			},
			put: function(value) {
				var variable = this
				if (this.parent) {
					return this._changeValue(RequestChange, value)
				}
				var oldValue = this.getValue ? this.getValue(true) : this.value
				if (oldValue === value && typeof value != 'object') {
					return noChange
				}
				if (oldValue && oldValue.put &&
						// if it is set to fixed, we see we can put in the current variable
						(variable.fixed || !(value && value.put))) {
					try {
						return oldValue.put(value)
					} catch (error) {
						if (!error.deniedPut) {
							throw error
						}// else if the put was denied, continue on and set the value on this variable
					}
				}
				if (value && value.then && !value.notifies) {
					value = assignPromise(this, value)
				} else {
					variable.value = value
				}
				var event = new RefreshEvent()
				event.oldValue = oldValue
				event.target = variable
				variable.updated(event, variable)
				return value
			},
			get: function(key) {
				if (this[key] || (this._properties && this._properties[key])) {
					return this.property(key).valueOf()
				}
				var object = this.getValue(true)
				if (!object) {
					return
				}
				if (typeof object.get === 'function') {
					return object.get(key)
				}
				var value = object[key]
				if (value && value.notifies) {
					// nested variable situation, get underlying value
					return value.valueOf()
				}
				return value
			},
			set: function(key, value) {
				// TODO: create an optimized route when the property doesn't exist yet
				this.property(key)._changeValue(RequestSet, value)
			},
			undefine: function(key) {
				this.set(key, undefined)
			},
			is: function(proxiedVariable) {
				var thisVariable = this
				this.fixed = true
				return whenStrict(this.setValue(proxiedVariable), function(value) {
					thisVariable.updated(new RefreshEvent(), thisVariable)
					return thisVariable
				})
			},
			proxy: function(proxiedVariable) {
				return this.is(proxiedVariable)
			},
			next: function(value) {
				// for ES7 observable compatibility
				this.put(value)
			},
			error: function(error) {
				// for ES7 observable compatibility
				var listeners = this.listeners
				if (listeners) {
					// make a copy, in case they change
					listeners.forEach(function(dependent) {
						// skip notifying property listeners if we are headed up the parent chain
						dependent.error(error)
					})
				}
			},
			complete: function(value) {
				// for ES7 observable compatibility
				this.put(value)
			},
			setValue: function(value) {
				return this.value = value
			},
			onValue: function(listener) {
				return this.subscribe(function(event) {
					when(event.value(), function(value) {
						listener(value)
					})
				})
			},
			toJSON: function() {
				return this.valueOf()
			},
			toString: function() {
				return String(this.valueOf())
			},
			forEach: function(callbackOrItemClass, callback) {
				// iterate through current value of variable
				if (callbackOrItemClass.notifies) {
					return this.forEach(function(item) {
						var itemVariable = callbackOrItemClass.from(item)
						callback.call(this, itemVariable)
					}, context)
				}
				var collectionOf = this.collectionOf
				if (collectionOf) {
					var variable = this
					return when(this.valueOf(), function(value) {
						if (value && value.forEach) {
							value.forEach(function(item, index) {
								callbackOrItemClass.call(variable, variable.property(index, collectionOf))
							})
						}
					})
				}
				return when(this.valueOf(callback), function(value) {
					if (value && value.forEach) {
						value.forEach(callbackOrItemClass)
					}else{
						for (var i in value) {
							callbackOrItemClass.call(value, value[i], i)
						}
					}
				})
			},
	
			to: function (transformFunction, reverse) {
				if (typeof transformFunction !== 'function') {
					if (typeof transformFunction === 'object') {
						this.to(transformFunction.get, transformFunction.set)
					}
					throw new Error('No function provided to transform')
				}
				if (reverse) {
					transformFunction.reverse = function(value, args, context) {
						// for direct to, we can just use the first argument
						reverse.call(this, value, args[0], context)
					}
				}
				if (transformFunction.prototype instanceof Variable) {
					return new transformFunction(this)
				}
				return new Transform(this, transformFunction)
			},
			map: function (transformFunction) {
				return this.to(function(value) {
					if (value instanceof Array) {
						throw new Error('map without VArray')
					}
					return transformFunction(value)
				})
			},
			as: function(Class) {
				// easiest way to cast to a variable class
				return new Class(this)
			},
			get schema() {
				// default schema is the constructor
				if (this.returnedVariable) {
					return this.returnedVariable.schema
				}
				if (this.parent) {
					var parentSchemaProperties = this.parent.schema.properties || this.parent.schema
					return parentSchemaProperties && parentSchemaProperties[this.key]
				}
				return this.constructor
			},
			set schema(schema) {
				// but allow it to be overriden
				Object.defineProperty(this, 'schema', {
					value: schema
				})
			},
			validate: function(target, schema) {
				if (this.returnedVariable) {
					return this.returnedVariable.validate(target, schema)
				}
				if (this.parent) {
					return this.parent.validate(target.valueOf(), schema)
				}
				if (schema) {
					if (schema.type && (schema.type !== typeof target)) {
						return ['Target type of ' + typeof target + ' does not match schema type of ' + schema.type]
					}
					if (schema.required && (target == null || target == '' || (typeof target === 'number' && isNaN(target)))) {
						return ['Value is required']
					}
				}
				var valid = []
				valid.isValid = true
				return valid
			},
	
			get validation() {
				var validation = new Validating(this)
				Object.defineProperty(this, 'validation', {
					value: validation
				})
				return validation
			},
			set validation(validation) {
				// but allow it to be overriden
				Object.defineProperty(this, 'validation', {
					value: validation
				})
			},
			set structured(structure) {
				// find any variable properties and attaches them as a property
				var keys = Object.keys(this)
				var properties = keys.length > 1 && this._properties || (this._properties = {})
				for(var i = 0, l = keys.length; i < l; i++) {
					var key = keys[i]
					var value = this[key]
					if (value instanceof Variable) {
						var existing = properties[key]
						if (existing) {
							if (existing !== value) {
								// an existing property exists, put in it
								existing.put(value)
							}
						} else {
							if (value.parent) {
								if (value.parent === this) {
									continue // just being assigned to another property
								} else {
									// property already exists with different parent, make a proxy
									var newValue = new Variable()
									newValue.proxy(value)
									value = newValue
								}
							}
							value.key = key
							value.parent = this
							properties[key] = value
						}
					}
				}
			},
			getId: function() {
				return this.id || (this.id = Variable.nextId++)
			},
			observeObject: function() {
				var variable = this
				return when(this.valueOf(), function(object) {
					var listeners = propertyListenersMap.get(object)
					if (!listeners) {
						propertyListenersMap.set(object, listeners = [])
					}
					if (listeners.observerCount) {
						listeners.observerCount++
					}else{
						listeners.observerCount = 1
						var observer = listeners.observer = lang.observe(object, function(events) {
							for (var i = 0, l = listeners.length; i < l; i++) {
								var listener = listeners[i]
								for (var j = 0, el = events.length; j < el; j++) {
									var event = events[j]
									listener._propertyChange(event.name, object)
								}
							}
						})
						if (observer.addKey) {
							for (var i = 0, l = listeners.length; i < l; i++) {
								var listener = listeners[i]
								listener.eachKey(function(key) {
									observer.addKey(key)
								})
							}
						}
					}
					registerListener(object, variable)
					return {
						remove: function() {
							deregisterListener(object, variable)
							if (!(--listeners.observerCount)) {
								listeners.observer.remove()
							}
						},
						done: function() {
							// deliver changes
							lang.deliverChanges(observer)
							this.remove()
						}
					}
				})
			},
			getCollectionOf: function() {
				return this.returnedVariable && this.returnedVariable.collectionOf || this.constructor.collectionOf
			},
			_sN: function(name) {
				// for compilers to set a name
				this.name = name
				return this
			},
			get _debug() {
				if (this.__debug === undefined) {
					this.__debug = this.name || (Math.random() + '').slice(2)
				}
				return this.__debug
			},
			set _debug(_debug) {
				this.__debug = _debug
			},
			get _lastUpdated() {
				return new Date(this.getVersion())
			}
		}
	
		// a variable inheritance change goes through its own prototype, so classes/constructor
		// can be used as variables as well
		for (var key in VariablePrototype) {
			Object.defineProperty(Variable, key, Object.getOwnPropertyDescriptor(VariablePrototype, key))
		}
	
		Variable.as = function(Type) {
			var NewType = this.with({})
			var target = NewType.prototype
			var prototype = Type.prototype
			do {
				var names = Object.getOwnPropertyNames(prototype)
				for (var i = 0; i < names.length; i++) {
					var name = names[i]
					if (!Object.getOwnPropertyDescriptor(target, name)) {
						Object.defineProperty(target, name, Object.getOwnPropertyDescriptor(prototype, name))
					}
				}
				prototype = getPrototypeOf(prototype)
			} while (prototype && prototype !== Variable.prototype)
			return NewType
		}
	
		Variable.with = function(properties, ExtendedVariable) {
			// TODO: handle arguments
			var Base = this
			var prototype
			if (Object.getOwnPropertyDescriptor(this, 'prototype').writable === false) {
				// extending native class
				ExtendedVariable = lang.extendClass(this)
				prototype = ExtendedVariable.prototype
			} else {
				// extending function/constructor
				ExtendedVariable = ExtendedVariable || function() {
					if (this instanceof ExtendedVariable) {
						Base.apply(this, arguments)
					} else {
						return ExtendedVariable.with(properties)
					}
				}
				prototype = ExtendedVariable.prototype = Object.create(this.prototype)
				prototype.constructor = ExtendedVariable
				setPrototypeOf(ExtendedVariable, this)
			}
			return ExtendedVariable.assign(properties)
		}
		Variable.assign = function(properties) {
			var prototype = this.prototype
			for (var key in properties) {
				var descriptor = Object.getOwnPropertyDescriptor(properties, key)
				var value = descriptor.value
				if (typeof value === 'function' && key !== 'collectionOf') {
					if (value.notifies) {
						// variable class
						descriptor = (function(key, Class) {
							return {
								get: function() {
									var property = (this._properties || (this._properties = {}))[key]
									if (!property) {
										this._properties[key] = property = new Class()
										property.key = key
										property.parent = this
										if (property.listeners) {
											// if it already has listeners, need to reinit it with the parent
											property.init()
										}
									}
									return property
								},
								set: function(value) {
									this[key]._changeValue(RequestSet, value)
								},
								enumerable: true
							}
						})(key, value)
						if (value === Variable) {
							value = Variable() // create own instance
						}
						value.isPropertyClass = true
					} else if (isGenerator(value)) {
						descriptor = getGeneratorDescriptor(value)
					} else if (value.defineAs) {
						descriptor = value.defineAs(key)
					} else {
						value = generalizeMethod(value, key)
					}
				}
				Object.defineProperty(prototype, key, descriptor)
				if (value !== undefined) {
					// TODO: If there is a getter/setter here, use defineProperty
					this[key] = value
				} else {
					// getter/setter
					Object.defineProperty(this, key, descriptor)
				}
			}
			if (properties && properties.hasOwn) {
				hasOwn.call(this, properties.hasOwn)
			}
			return this
		}
	
		Object.defineProperty(Variable, 'defaultInstance', {
			get: function() {
				return this.hasOwnProperty('_defaultInstance') ?
					this._defaultInstance : (
						this._defaultInstance = new this(),
						this._defaultInstance.subject = defaultContext,
						this._defaultInstance)
			}
		})
		Variable.hasOwn = function(Target, createInstance) {
			var instanceMap = new WeakMap()
			instanceMap.createInstance = createInstance
			var subjectMap = this.ownedClasses || (this.ownedClasses = new WeakMap())
			subjectMap.set(Target, instanceMap)
		}
	
	
		function arrayToModify(variable, callback) {
			// TODO: switch this to allow promises
			return when(variable.cachedValue || variable.valueOf(), function(array) {
				if (!array) {
					variable.put(array = [])
				}
				var results = callback.call(variable, array)
				variable.cachedVersion++ // update the cached version, so any version checking will know it has changed
				return results
			})
		}
	
		function insertedAt(variable, added, startingIndex, arrayLength) {
			var addedCount = added.length
			// adjust the key positions of any index properties after splice
			if (addedCount > 0) {
				var arrayPosition
				for (var i = arrayLength - addedCount; i > startingIndex;) {
					var arrayPosition = variable[--i]
					if (arrayPosition) {
						variable[i] = undefined
						arrayPosition.key += addedCount
						variable[arrayPosition.key] = arrayPosition
					}
				}
				// send out updates
				for (var i = 0, l = added.length; i < l; i++) {
					variable.updated(new AddEvent({
						value: added[i],
						index: i + startingIndex,
						modifier: variable
					}), variable)
				}
			}
		}
	
		function removedAt(variable, removed, startingIndex, removalCount, arrayLength) {
			// adjust the properties
			var i = startingIndex + removalCount
			var arrayPosition
			if (removalCount > 0) {
				for (var i = startingIndex + removalCount; i < arrayLength + removalCount; i++) {
					var arrayPosition = variable[i]
					if (arrayPosition) {
						variable[i] = undefined
						arrayPosition.key -= removalCount
						variable[arrayPosition.key] = arrayPosition
					}
				}
				// send out updates
				for (var i = 0; i < removalCount; i++) {
					variable.updated(new DeleteEvent({
						previousIndex: startingIndex,
						oldValue: removed[i],
						modifier: variable
					}), variable)
				}
				variable.cachedVersion = variable.version // update the cached version so it doesn't need to be recomputed
			}
		}
	
		if (typeof Symbol !== 'undefined') {
			Variable.prototype[Symbol.iterator] = function() {
				var iterator = this.valueOf()[Symbol.iterator]()
				var variable = this
				var collectionOf = this.collectionOf
				if (collectionOf) {
					var parent = this
					var i = 0
					return {
						next: function() {
							var result = iterator.next()
							if (!result.done) {
								result.value = variable.property(i++, collectionOf)
							}
							return result
						}
					}
				}
				return iterator
			}
		}
	
		var VMap = Variable.VMap = lang.compose(Variable, function(value){
			if (typeof value !== 'undefined') {
				this.value = value
			}
		}, {
			fixed: true,
			// TODO: Move all the get and set functionality for maps out of Variable
			property: function(key, PropertyClass) {
				var properties = this._properties || (this._properties = new Map())
				var propertyVariable = properties.get(key)
				if (!propertyVariable) {
					// create the property variable
					propertyVariable = new (PropertyClass || this.PropertyClass)()
					propertyVariable.key = key
					propertyVariable.parent = this
					if (propertyVariable.listeners) {
						// if it already has listeners, need to reinit it with the parent
						propertyVariable.init()
					}
					properties.set(key, propertyVariable)
				}
				return propertyVariable
			}
		})
	
		var Transform = Variable.Transform = lang.compose(Variable, function Transform(source, transform, sources) {
			if (source !== undefined || sources) {
				this.source = source
			}
			if (transform) {
				this.transform = transform
				if (sources) {
					for (var i = 1, l = sources.length; i < l; i++) {
						this['source' + i] = sources[i]
					}
				}
			}
		}, {
			getValue: function(sync) {
				// first check to see if we have the variable already computed
				if (this.readyState == 'invalidated') {
					this.readyState = nextVersion.toString()
				} else if (isFinite(this.readyState)) {
					// will un-invalidate this later (contextualizedVariable.readyState = 'up-to-date')
				} else if ((this.listeners || this.staysUpdated) && this.cachedVersion > -1) {
					// it is live, so we can shortcut and just return the cached value
					if (context) {
						context.setVersion(this.cachedVersion)
					}
					if (sync) {
						if (this.promise && context) {
							context.notResolvedYet = true
						}
						return this.cachedValue
					} else {
						return this.promise || this.cachedValue
					}
				}
				if (!this.hasOwnProperty('source1') && context) {
					// TODO: Not sure if this is a helpful optimization or not
					// if we have a single source, we can use ifModifiedSince
						/*if (!contextualizedVariable && this.context && this.context.matches(context)) {
							contextualizedVariable = this
						}*/
				}
				var readyState = this.readyState
				var parentContext = context
				var transformContext = context = context ? context.newContext() : new Context()
				var args = []
				try {
					if (this.version) {
						// get the version in there
						transformContext.setVersion(this.version)
					}
					if (this && this.cachedVersion >= this.version && this.cachedVersion > -1 && !this.hasOwnProperty('source1')) {
						transformContext.ifModifiedSince = this.cachedVersion
					}
			 		var transform = this.transform && this.transform.valueOf()
	
					var argument, argumentName
					for (var i = 0; (argument = this[argumentName = i > 0 ? 'source' + i : 'source']) || argumentName in this; i++) {
						if (transformContext) {
							transformContext.nextProperty = argumentName
						}
						args[i] = (argument && sync) ? argument.valueOf() : argument // for async, `then` will be called in whenAll
					}
					var variable = this
		 			return whenAll(args, function(resolved) {
		 				if (transformContext.ifModifiedSince !== undefined) {
		 					transformContext.ifModifiedSince = undefined
		 				}
						var version = transformContext.version
						var notResolvedYet = transformContext.notResolvedYet
						if (notResolvedYet) {
							if (parentContext)
								parentContext.notResolvedYet = true 
							if (resolved[0] === undefined && resolved.length === 1) {
								variable.readyState = 'invalidated'
								return variable.cachedValue // always sync here
							}
						} else {
							if (variable.cachedVersion >= version || resolved[0] == NOT_MODIFIED) { // note that cached version can get "ahead" of `version` of all dependencies, in cases where the transform ends up executing an valueOf() that advances the resolution context version number. 
								// get it out of the cache
								if (parentContext) {
									parentContext.setVersion(version)
								}
								if (parentContext && parentContext.ifModifiedSince >= version && !variable.returnedVariable) {
									return NOT_MODIFIED
								}
								if (sync) {
									if (variable.promise && parentContext) {
										parentContext.notResolvedYet = true
									}
									return variable.cachedValue
								} else {
									return variable.promise || variable.cachedValue
								}
							}
							var finishedResolvingArgs = true
						}
	
						var result = transform ? transform.apply(variable, resolved) : resolved[0]
						var isPromise = result && result.then && !result.notifies
						version = transformContext.version
	
						if (finishedResolvingArgs) {
							if (isPromise) {
								variable.promise = result
								variable.cachedVersion = version
								result.then(function(resolved) {
									if (result === variable.promise) { // make sure we are still the latest promise
										variable.promise = null
										onResolve(resolved, transformContext.version)
									}
								}, function(error) {
									if (result === variable.promise) { // make sure we are still the latest promise
										// clear out the cache on an error
										variable.promise = null
										variable.lastError = error
										onResolve(null, 0)
									}
								})
							} else {
								onResolve(result, version)
							}
						}
						if (sync && isPromise) {
							if (parentContext) {
								parentContext.notResolvedYet = true 
							}
							// return what we have, stale or otherwise
							return variable.cachedValue
						}
						return result
	
						function onResolve(result, version) {
							if (variable.readyState === readyState) {
								if (parentContext) {
									parentContext.setVersion(version)
								}
								variable.readyState = 'up-to-date' // mark it as up-to-date now
								variable.cachedVersion = version
								variable.cachedValue = result
							}/* else {
								console.log('ready state different than when the variable trasnform started ', variable, variable.readyState, readyState)
							}*/
						}
					})
		 		} finally {
		 			context = parentContext
		 		}
			},
			forDependencies: function(callback) {
				// depend on the args
				Variable.prototype.forDependencies.call(this, callback)
				var argument, argumentName
				for (var i = 0; (argument = this[argumentName = i > 0 ? 'source' + i : 'source']) || argumentName in this; i++) {
					if (argument && argument.notifies) {
						callback(argument)
					}
				}
			},
	
			updated: function(updateEvent, by, isDownstream) {
				this.readyState = 'invalidated'
				if (this.promise) {
					this.promise = null
				}
				if (by !== this.returnedVariable && updateEvent && updateEvent.type !== 'refresh') {
					// search for the output in the sources
					var argument, argumentName
					for (var i = 0; (argument = this[argumentName = i > 0 ? 'source' + i : 'source']) || argumentName in this; i++) {
						if (argument === by) {
							// if one of the args was updated, we need to do a full refresh (we can't compute differential events without knowledge of how the mapping function works)
							updateEvent = new RefreshEvent()
							continue
						}
					}
				}
				return Variable.prototype.updated.call(this, updateEvent, by, isDownstream)
			},
	
			getUpdates: function(since) {
				// this always issues updates, nothing incremental can flow through it
				if (!since || since.version < getVersion()) {
					return [new RefreshEvent()]
				}
			},
	
			getArguments: function() {
				var args = []
				var argument, argumentName
				for (var i = 0; (argument = this[argumentName = i > 0 ? 'source' + i : 'source']) || argumentName in this; i++) {
					args.push(argument)
				}
				return args
			},
			put: function(value) {
				var call = this
				return when(this.valueOf(), function(originalValue) {
					if (originalValue === value && typeof value != 'object') {
						return noChange
					}
					var transform = call.transform.valueOf()
					if (transform.reverse) {
						(transform.reverse).call(call, value, call.getArguments())
						call.updated()
					} else if (originalValue && originalValue.put) {
						return originalValue.put(value)
					} else {
						var error = new Error('Can not put value into a one-way transform, that lacks a reversal')
						error.deniedPut = true
						throw error
					}
				})
			},
			setReverse: function(reverse) {
				this.transform.valueOf().reverse = reverse
				return this
			}
		})
	
		var ContextualizedTransform = {
			getValue: function(sync) {
				// first check to see if we have the variable already computed
				var contextualizedVariable = context ? context.getContextualized(this) : this
				var readyState = null
				if (contextualizedVariable) {
					if (contextualizedVariable.readyState == 'invalidated')
						readyState = contextualizedVariable.readyState = nextVersion.toString()
					else if (isFinite(contextualizedVariable.readyState)) {
						// will un-invalidate this later (contextualizedVariable.readyState = 'up-to-date')
					} else if (contextualizedVariable.listeners && contextualizedVariable.cachedVersion > -1) {
						// it is live, so we can shortcut and just return the cached value
						if (transformContext) {
							transformContext.version = contextualizedVariable.cachedVersion
							transformContext.contextualize(contextualizedVariable, context)
						}
						return contextualizedVariable.cachedValue
					}
					if (!this.hasOwnProperty('source1') && context) {
						// TODO: Not sure if this is a helpful optimization or not
						// if we have a single source, we can use ifModifiedSince
							/*if (!contextualizedVariable && this.context && this.context.matches(context)) {
								contextualizedVariable = this
							}*/
					}
					readyState = contextualizedVariable.readyState
				}
				if (!transformContext) {
					transformContext = context ? context.newContext() : new Context()
				}
				// get the version in there
		 		transformContext.nextProperty = 'transform'
		 		var transform = this.transform && this.transform.valueOf(transformContext)
				var args = []
				if (this.version) {
					// get the version in there
					transformContext.setVersion(this.version)
				}
				if (contextualizedVariable && this.cachedVersion >= transformContext.version && contextualizedVariable.cachedVersion > -1 && !this.hasOwnProperty('source1')) {
					transformContext.ifModifiedSince = contextualizedVariable.cachedVersion
				}
				var argument, argumentName
				for (var i = 0; (argument = this[argumentName = i > 0 ? 'source' + i : 'source']) || argumentName in this; i++) {
					if (transformContext) {
						transformContext.nextProperty = argumentName
					}
					args[i] = argument && (
						sync ? argument.valueOf(transformContext) :
							argument.then(null, null, transformContext))
				}
		 		var variable = this
	 			return whenAll(args, function(resolved) {
	 				if (transformContext.ifModifiedSince !== undefined) {
	 					transformContext.ifModifiedSince = undefined
	 				}
					var contextualizedVariable = transformContext.contextualize(variable, context)
					var version = transformContext.version
					if (contextualizedVariable && contextualizedVariable.cachedVersion === version) {
						// get it out of the cache
						contextualizedVariable.readyState = 'up-to-date' // mark it as up-to-date now
						if (context && context.ifModifiedSince >= version && !contextualizedVariable.returnedVariable) {
							return NOT_MODIFIED
						}
	
						return contextualizedVariable.cachedValue
					}
					if (resolved[0] == NOT_MODIFIED) {
						throw new Error('A not-modified signal was passed to a transform, which usually means a version number was decreased (they must monotically increase), computed version' + version +
							' this variable version: ' + contextualizedVariable.version + ' cached version: ' +
							contextualizedVariable.cachedVersion + ' ifModifiedSince: ' +
							transformContext.ifModifiedSince +
							' source version: ' + contextualizedVariable.source.version +
							' source cached version: ' + contextualizedVariable.source.cachedVersion)
					}
					var result = transform ? transform.apply(variable, resolved) : resolved[0]
					// an empty ready state means it is up-to-date as well
					if (readyState == contextualizedVariable.readyState || readyState === null) {
						if (contextualizedVariable.readyState)
							contextualizedVariable.readyState = 'up-to-date' // mark it as up-to-date now
						// cache it
						if (result && result.then && !result.notifies) {
							result.then(function() {
								// if it was a generator then the version could have been computed asynchronously as well
								contextualizedVariable.cachedVersion = transformContext.version
							}, function() {
								// clear out the cache on an error
								contextualizedVariable.cachedValue = null
								contextualizedVariable.cachedVersion = 0
							})
							if (sync) // should we return the stale data if we are in sync mode?
								return contextualizedVariable.cachedValue
						} else {
							contextualizedVariable.cachedVersion = transformContext.version
							contextualizedVariable.cachedValue = result
						}
					}
					return result
				})
			},
	
		}
	
		var Item = lang.compose(Variable, function Item(value, content) {
			this.value = value
			this.collection = content
		}, {})
	
		var ContextualizedVariable = lang.compose(Variable, function ContextualizedVariable(generic, subject) {
			this.generic = generic
			this.subject = subject
		}, {
			valueOf: function() {
				// TODO: Lookup Context type for all of these using registry or something
				var subject = this.subject
				var context = subject.getContextualized ? subject : new Context(subject)
				var generic = this.generic
				return context.executeWithin(function() {
					return generic.valueOf()
				})
			},
	
			forDependencies: function(callback) {
				this.sources && this.sources.forEach(callback)
			},
	
			getVersion: function() {
				var version = Variable.prototype.getVersion.call(this)
				var sources = this.sources || 0
				for (var i = 0, l = sources.length; i < l; i++) {
					var source = sources[i]
					if (source.getFullVersion) {
						version = Math.max(version, source.getFullVersion())
					}
				}
				return version
			},
	
			put: function(value) {
				var subject = this.subject
				return this.generic.put(value, subject.getContextualized ? subject : new Context(subject))
			}
		})
	
		var VArray = Variable.VArray = lang.compose(Variable, function VArray(value) {
			return makeSubVar(this, value, VArray)
		}, {
			_isStrictArray: true,
			/* TODO: at some point, we might add support for length, but need to make it be dependent/notified by array changes
			get length() {
				if (typeof this !== 'function') {
					Object.defineProperty(this, 'length', {
						configurable: true
					})
					return this.property('length')
				}
			},
			set length(length) {
				// allow overriding
				Object.defineProperty(this, 'length', {
					value: length
				})
			},*/
			property: function(key, PropertyClass) {
				return Variable.prototype.property.call(this, key, PropertyClass || typeof key === 'number' && this.collectionOf)
			},
			splice: function(startingIndex, removalCount) {
				var args = arguments
				return arrayToModify(this, function(array) {
					if (startingIndex < 0) {
						startingIndex = array.length + startingIndex
					}
					var results = array.splice.apply(array, args)
					removedAt(this, results, startingIndex, removalCount, array.length)
					insertedAt(this, [].slice.call(args, 2), startingIndex, array.length)
					return results
				})
			},
			push: function() {
				var args = arguments
				return arrayToModify(this, function(array) {
					var results = array.push.apply(array, args)
					insertedAt(this, args, array.length - args.length, array.length)
					return results
				})
			},
			unshift: function() {
				var args = arguments
				return arrayToModify(this, function(array) {
					var results = array.unshift.apply(array, args)
					insertedAt(this, args, 0, array.length)
					return results
				})
			},
			pop: function() {
				return arrayToModify(this, function(array) {
					var results = array.pop()
					removedAt(this, [results], array.length, 1)
					return results
				})
			},
			shift: function() {
				return arrayToModify(this, function(array) {
					var results = array.shift()
					removedAt(this, [results], 0, 1, array.length)
					return results
				})
			}
		})
		VArray.of = function(collectionOf) {
			var ArrayClass = VArray({collectionOf: collectionOf})
			if (this !== VArray) {
				// new operator
				return new ArrayClass()
			}
			return ArrayClass
		}
	
		function toArray(array) {
			if (!array) {
				return []
			}
			if (array.length > -1) {
				return array
			}
			var newArray = []
			if (array.forEach) {
				array.forEach(function(item) {
					newArray.push(item)
				})
			}
			return newArray
		}
	
		var getValue
		var GeneratorVariable = lang.compose(Transform, function ReactiveGenerator(generator){
			this.generator = generator
		}, {
			transform: {
				valueOf: function() {
					var resuming
					return next
					function next() {
						var nextValue
						var i
						var generatorIterator
						var isThrowing
						if (resuming) {
							// resuming from a promise
							generatorIterator = resuming.iterator
							i = resuming.i
							nextValue = resuming.value
							if (nextValue && nextValue.then) {
								throw new Error('Generator resumed with promise or variable', nextValue)
							}
							isThrowing = resuming.isThrowing
						} else {
							if (context) {
								// must restart the context, if the input values had previously been checked and hashed against this context, must restart them.
								context.restart()
							}
							i = 0
							generatorIterator = this.generator()
						}
	
						do {
							var stepReturn = generatorIterator[isThrowing ? 'throw' : 'next'](nextValue)
							if (stepReturn.done) {
								var oldSources = this.sources || []
								var newLength = i
								var newSources = []
								while(this[argumentName = i > 0 ? 'source' + i : 'source']) {
									// clear out old properties
									this[argumentName] = undefined
									i++
								}
								for (i = 0; i < newLength; i++) {
									// create new array
									var argumentName = i > 0 ? 'source' + i : 'source'
									if (this[argumentName] && this[argumentName].notifies) {
										newSources.push(this[argumentName])
									}
								}
								for (i = 0; i < oldSources.length; i++) {
									if (newSources.indexOf(oldSources[i]) == -1) {
										oldSources[i].stopNotifies(this)
									}
								}
								this.sources = newSources
								return stepReturn.value
							}
							nextValue = stepReturn.value
							// compare with the arguments from the last
							// execution to see if they are the same
							try {
								var argumentName = i > 0 ? 'source' + i : 'source'
								if (this[argumentName] !== nextValue || this[argumentName] === undefined) {
									// subscribe if it is a variable
									if (nextValue && nextValue.notifies) {
										if (this.listeners) {
											nextValue.notifies(this)
										}
										this[argumentName] = nextValue
									} else if (typeof nextValue === 'function' && isGenerator(nextValue)) {
										resuming = {
											i: i,
											iterator: nextValue()
										}
										next.call(this)
										i = resuming.i
									} else {
										this[argumentName] = null
									}
								}
								i++
								if (context) {
									context.nextProperty = argumentName
								}
								if (nextValue && nextValue.then) {
									// if it is a promise or variable, we will wait on it
									var variable = this
									resuming = {
										i: i,
										iterator: generatorIterator
									}
									var deferredContext = context
									var isSync = null
									// and return the promise so that the next caller can wait on this
									var promise = nextValue.then(function(value) {
										if (isSync !== false) {
											isSync = true
											nextValue = value
											return
										}
										resuming.value = value
										if (deferredContext) {
											return deferredContext.executeWithin(next.bind(variable))
										}
										return next.call(variable)
									}, function(error) {
										resuming.value = error
										resuming.isThrowing = true
										if (deferredContext) {
											return deferredContext.executeWithin(next.bind(variable))
										}
										return next.call(variable)
									})
									if (!isSync) {
										isSync = false
										return promise
									}
								}
								isThrowing = false
							} catch (error) {
								isThrowing = true
								nextValue = error
							}
						} while(true)
					}
				}
			}
		})
	
		var Validating = lang.compose(Transform, function(source) {
			this.source = source
		}, {
			transform: function(target) {
				var target = this.source
				return target && target.validate(target, target.schema)
			}
		})
	
		function makeSubVar(instance, value, Type) {
			if (instance instanceof Variable) {
				Variable.call(instance, value)
			} else {
				return Type.with(value)
			}
		}
	
		function objectUpdated(object) {
			// simply notifies any subscribers to an object, that it has changed
			var listeners = propertyListenersMap.get(object)
			if (listeners) {
				for (var i = 0, l = listeners.length; i < l; i++) {
					listeners[i]._propertyChange(null, object)
				}
			}
		}
	
		var argsToArray = {
			apply: function(instance, args) {
				return args
			}
		}
	
		function all(array, transform) {
			// This is intended to mirror Promise.all. It actually takes
			// an iterable, but for now we are just looking for array-like
			if (array instanceof Array) {
				if (array.length > 1000) {
					 //throw new Error('too big')
				}
				if (array.length > 0 || typeof transform === 'function') {
					// TODO: Return VArray Transform
					return new Transform(array[0], typeof transform === 'function' ? transform : argsToArray, array)
				} else {
					return new VArray([])
				}
			}
			if (arguments.length > 1) {
				// support multiple arguments as an array
				return new Transform(arguments[0], argsToArray, arguments).as(VArray)
			}
			if (typeof array === 'object') {
				// allow an object as a hash to be mapped
				var keyMapping = []
				var valueArray = []
				for (var key in array) {
					keyMapping.push(key)
					valueArray.push(array[key])
				}
				return new Variable(function(results) {
					var resultObject = {}
					for (var i = 0; i < results.length; i++) {
						resultObject[keyMapping[i]] = results[i]
					}
					return resultObject
				}).apply(null, valueArray)
			}
			throw new TypeError('Variable.all requires an array')
		}
	
		function hasOwn(Target, createForInstance) {
	
			var ownedClasses = this.ownedClasses || (this.ownedClasses = new WeakMap())
			// TODO: assign to super classes
			var Class = this
			ownedClasses.set(Target, createForInstance || function() { return new Target() })
			return this
		}
		function generalizeClass() {
			var prototype = this.prototype
			var prototypeNames = Object.getOwnPropertyNames(prototype)
			for(var i = 0, l = prototypeNames.length; i < l; i++) {
				var name = prototypeNames[i]
				Object.defineProperty(this, name, getGeneralizedDescriptor(Object.getOwnPropertyDescriptor(prototype, name), name, this))
			}
		}
		function getGeneralizedDescriptor(descriptor, name, Class) {
			if (typeof descriptor.value === 'function') {
				return {
					value: generalizeMethod(Class, name)
				}
			} else {
				return descriptor
			}
		}
		function generalizeMethod(Class, name) {
			// I think we can just rely on `this`, but we could use the argument:
			// function(possibleEvent) {
			// 	var target = possibleEvent && possibleEvent.target
			var method = Class[name] = function() {
				var instance = Class.for(this)
				return instance[name].apply(instance, arguments)
			}
			method.for = function(context) {
				var instance = Class.for(context)
				return function() {
					return instance[name].apply(instance, arguments)
				}
			}
			return method
		}
	
		var defaultContext = {
			name: 'Default context',
			description: 'This object is the default context for classes, corresponding to a singleton instance of that class',
			constructor: {
				getForClass: function(subject, Class) {
					return Class.defaultInstance
				}
			},
			contains: function() {
				return true // contains everything
			}
		}
		function instanceForContext(Class, context) {
			if (!context) {
				return Class.defaultInstance
			}
			return context.specify(Class)
	//		var instance = context.subject.constructor.getForClass && context.subject.constructor.getForClass(context.subject, Class) || Class.defaultInstance
	//		context.distinctSubject = mergeSubject(context.distinctSubject, instance.subject)
	//		return instance
		}
		Variable.valueOf = function() {
			// contextualized valueOf
			return instanceForContext(this, context).valueOf()
		}
		Variable.then = function(callback, errback) {
			// contextualized valueOf
			return instanceForContext(this, context).then(callback, errback)
		}
		Variable.getValue = function(sync) {
			// contextualized getValue
			return instanceForContext(this, context)
		}
		Variable.put = function(value) {
			// contextualized setValue
			return instanceForContext(this, context).put(value)
		}
		Variable.for = function(subject) {
			if (subject != null) {
				if (subject.target && !subject.constructor.getForClass) {
					// makes HTML events work
					subject = subject.target
				}
				var instance
				instance = new Context(subject).specify(this)
				if (instance && !instance.subject) {
					instance.subject = subject
				}
				// TODO: Do we have a global context that we set on defaultInstance?
				return instance || this.defaultInstance
			} else {
				return this.defaultInstance
			}
		}
		Variable.from = function(value) {
			if (value && typeof value === 'object') {
				// a plain object, we use our own map to retrieve the instance (or create one)
				var instanceMap = this.instanceMap || (this.instanceMap = new WeakMap())
				var instance = instanceMap.get(value)
				if (!instance) {
					instanceMap.set(value, instance = new this(value))
				}
				return instance
			} else {
				// a primitive, just unconditionally create a new variable for it
				return new this(value)
			}
		}
		Variable.notifies = function(target) {
			this.defaultInstance.notifies(target)
		}
		Variable.stopNotifies = function(target) {
			this.defaultInstance.stopNotifies(target)
		}
		Variable.getCollectionOf = function () {
			return this.collectionOf
		}
		Variable.updated = function(updateEvent, by) {
			return instanceForContext(this, context).updated(updateEvent, by)
		}
		var proxyHandler = {
			get: function(target, name) {
				var value = target[name]
				return value === undefined ? target.property(name) : value
			},
			set: function(target, name, value) {
				var oldValue = target[name]
				if (oldValue && oldValue.put) {
					// own property available to put into
					oldValue.put(value)
				} else {
					target.set(name, value)
				}
				return true
			},
			has: function(target, name) {
				return (name in target) || (name in target.valueOf())
			},
			deleteProperty: function(target, name) {
				return proxyHandler.set(target, name, undefined)
			},
			ownKeys: function(target) {
				return Object.getOwnPropertyNames(target.valueOf())
			}
		}
		Variable.proxy = function(source) {
			// should we memoize?
			return new Proxy(source instanceof this ? source : this.from(source), proxyHandler)
		}
		Object.defineProperty(Variable, 'collectionOf', {
			get: function() {
				return this._collectionOf
			},
			set: function(ItemClass) {
				if (this._collectionOf != ItemClass) {
					this._collectionOf = ItemClass
					ItemClass.collection = this
				}
			}
		})
		Object.defineProperty(Variable, 'collection', {
			get: function() {
				return this._collection
			},
			set: function(Collection) {
				if (this._collection != Collection) {
					this._collection = Collection
					Collection.collectionOf = this
				}
			}
		})
		Variable.nextVersion = Date.now()
		Variable.generalize = generalizeClass
		Variable.call = Function.prototype.call // restore these
		Variable.apply = Function.prototype.apply
	
		function VFunction() {
		}
		(VFunction.returns = function(Type){
			function VFunction() {}
			VFunction.defineAs = function(method)	{
				return {
					value: function() {
						var args = arguments
						// TODO: make these args part of the call so variables can be resolved
						// TODO: may actually want to do getValue().invoke()
						return new Type(new Transform(this, function(value) {
								return value == null ? undefined : value[method].apply(value, args)
						}))
					}
				}
			}
			return VFunction
		})
	
		function VMethod() {
		}
		VMethod.defineAs = function(method) {
			return {
				value: function() {
					var args = arguments
					// TODO: make these args part of the call so variables can be resolved
					// TODO: may actually want to do getValue().invoke()
					var variable = this
					return when(this.valueOf(), function(value) {
						var returnValue = value[method].apply(value, args)
						return when(variable.put(value), function() {
							return returnValue
						})
					})
				}
			}		
		}
	
		function VString(value) {
			return makeSubVar(this, typeof value === 'object' ? value : String(value), VString)
		}
	
		function VNumber(value) {
			return makeSubVar(this, typeof value === 'object' ? value : Number(value), VNumber)
		}
		
		VString = Variable.with({
			charAt: VFunction.returns(VString),
			codeCharAt: VFunction.returns(VNumber),
			indexOf: VFunction.returns(VNumber),
			lastIndexOf: VFunction.returns(VNumber),
			match: VFunction.returns(VArray),
			replace: VFunction.returns(VString),
			substr: VFunction.returns(VString),
			slice: VFunction.returns(VString),
			toUpperCase: VFunction.returns(VString),
			toLowerCase: VFunction.returns(VString),
			length: VNumber
		}, VString)
	
		VNumber = Variable.with({
			toFixed: VFunction.returns(VString),
			toExponential: VFunction.returns(VString),
			toPrecision: VFunction.returns(VString),
			toLocaleString: VFunction.returns(VString)
		}, VNumber)
	
		function VBoolean(value) {
			return makeSubVar(this, typeof value === 'object' ? value : Boolean(value), VBoolean)
		}
		VBoolean = Variable.with({}, VBoolean)
	
		function VSet(value) {
			return makeSubVar(this, value instanceof Array ? new Set(value) : value, VSet)
		}
		VSet = Variable.with({
			has: VFunction.returns(VBoolean),
			add: VMethod,
			clear: VMethod,
			delete: VMethod
		}, VSet)
		Object.defineProperty(VSet.prototype, 'array', {
			get: function() {
				return this._array || (this._array = this.to(toArray).as(VArray))
			}
		})
	
		function VDate(value) {
			return makeSubVar(this, typeof value === 'object' ? value : new Date(value), VDate)
		}
		VDate = Variable.with({
			toDateString: VFunction.returns(VString),
			toTimeString: VFunction.returns(VString),
			toGMTString: VFunction.returns(VString),
			toUTCString: VFunction.returns(VString),
			getTime: VFunction.returns(VNumber),
			setTime: VMethod
		}, VDate)
	
		var VPromise = lang.compose(Variable, function VPromise(value) {
			return makeSubVar(this, value, VPromise)
		}, {
			valueOf: function() {
				return this.then()
			},
		})
		var primitives = {
			'string': VString,
			'number': VNumber,
			'boolean': VBoolean
		}
		function getType(Type) {
			if (typeof Type === 'string') {
				return primitives[Type]
			} else if (typeof Type === 'object') {
				if (Type instanceof Array) {
					return VArray.of(getType(Type[0]))
				}
				var typedObject = {}
				for (var key in Type) {
					typedObject[key] = getType(Type[key])
				}
				return Variable.with(typedObject)
			}
			return Type
		}
		var exports = {
			__esModule: true,
			Variable: Variable,
			VArray: VArray,
			default: Variable,
			VString: VString,
			VNumber: VNumber,
			VBoolean: VBoolean,
			VPromise: VPromise,
			VDate: VDate,
			VSet: VSet,
			VMap: VMap,
			Transform: Transform,
			deny: deny,
			noChange: noChange,
			Context: Context,
			GeneratorVariable: GeneratorVariable,
			Item: Item,
			NotifyingContext: NotifyingContext,
			all: all,
			objectUpdated: objectUpdated,
			reactive: reactive,
			NOT_MODIFIED: NOT_MODIFIED
		}
		Object.defineProperty(exports, 'currentContext', {
			get: function() {
				return context
			}
		})
		var typeScriptConversions = new Map()
		typeScriptConversions.set(Array, VArray)
		typeScriptConversions.set(String, VString)
		typeScriptConversions.set(Number, VNumber)
		typeScriptConversions.set(Boolean, VBoolean)
		function reactive(target, key) { // for typescript decorators
			var Type = Reflect.getMetadata('design:type', target, key)
			console.log('Type', Type)
			if (!Type.notifies) {
				Type = typeScriptConversions.get(Type) || Variable
			}
			Object.defineProperty(target, key, {
				get: function() {
					return reactive.get(this, key, Type)
				},
				set: function(value) {
					reactive.set(this, key, value)
				},
				enumerable: true
			})
		}
		reactive.get = function(target, key, Type) { // for babel decorators
			var property = (target._properties || (target._properties = {}))[key]
			if (!property) {
				target._properties[key] = property = new (getType(Type))()
				if (target.getValue) {
					property.key = key
					property.parent = target
					if (property.listeners) {
						// if it already has listeners, need to reinit it with the parent
						property.init()
					}
				}
			}
			return property
		}
		reactive.set = function(target, key, value) {
			var property = target[key]
			property.parent ? property._changeValue(RequestSet, value) : property.put(value)
		}
	
	
		var IterativeMethod = lang.compose(Transform, function(source, method, args) {
			this.source = source
			// source.interestWithin = true
			this.method = method
			this.arguments = args
		}, {
			transform: function(array) {
				var method = this.method
				var isStrictArray = this.source && this.source._isStrictArray
				if (array && array.forEach) {
					// already an array
					//array = this._mappedItems(array)
				} else if (isStrictArray) {
					array = []
				} else {
					// if not an array convert to an array
					array = [array]
				}
				if (typeof method === 'string') {
					// apply method
					return array[method].apply(array, this.arguments)
				} else {
					return method(array, this.arguments)
				}
			},
			_mappedItems: function(array) {
				var source = this.source
				var collectionOf = source && source.collectionOf
				return collectionOf ? array.map(function(item, i) {
					var wrapped = collectionOf.from(item)
					wrapped.collection = source
					return wrapped
				}) : array
			},
	
			getCollectionOf: function(){
				return this.source.getCollectionOf()
			},
			_isStrictArray: true
		})
	
		function defineArrayMethod(method, constructor, properties, returns) {
			var IterativeResults = lang.compose(returns ? returns.as(IterativeMethod) : IterativeMethod, constructor, properties)
			IterativeResults.prototype.method || (IterativeResults.prototype.method = method)
			Object.defineProperty(IterativeResults.prototype, 'isIterable', {value: true});
			VArray[method] = VArray.prototype[method] = function() {
				var results = new IterativeResults(this)
				results.source = this
				results.arguments = arguments
				return results
			}
		}
	
		defineArrayMethod('filter', function Filtered() {}, {
			updated: function(event, by, isDownstream) {
				if (!event || event.modifier === this || (event.modifier && event.modifier.constructor === this)) {
					return Transform.prototype.updated.call(this, event, by)
				}
				var contextualizedVariable = context && context.getContextualized(this) || this
				if (event.type === 'delete') {
					var index = contextualizedVariable.cachedValue.indexOf(event.oldValue)
					if (index > -1) {
						contextualizedVariable.splice(index, 1)
					}
				} else if (event.type === 'add') {
					if ([event.value].filter(this.arguments[0]).length > 0) {
						contextualizedVariable.push(event.value)
					}
				} else if (event.type === 'update') {
					var object = event.parent.valueOf()
					var index = contextualizedVariable.cachedValue.indexOf(object)
					var matches = [object].filter(this.arguments[0]).length > 0
					if (index > -1) {
						if (matches) {
							return new PropertyChangeEvent(index, event, contextualizedVariable.cachedValue,
								// might need to do something with this
								object)
						} else {
							contextualizedVariable.splice(index, 1)
						}
					}	else {
						if (matches) {
							contextualizedVariable.push(object)
						}
						// else nothing mactches
					}
					return
				} else {
					return Transform.prototype.updated.call(this, event, by, isDownstream)
				}
			}
		}, VArray)
		defineArrayMethod('map', function Mapped(source) {
			this._isStrictArray = source._isStrictArray
		}, {
			transform: function(array) {
				var isStrictArray = this.source && this.source._isStrictArray
				var mapFunction = this.arguments[0]
				if (array && array.map) {
					var source = this.source
					var collectionOf = source && source.collectionOf
					return array.map(collectionOf ? function(item, i) {
						return mapFunction(source.property(i), i)
					} : mapFunction)
				} else if (!isStrictArray) {
					if (method === 'map'){
						// fast path, and special behavior for map
						return mapFunction(array)
					}
				}
				return IterativeMethod.prototype.transform.call(this, array)
			},
			updated: function(event, by, isDownstream) {
				if (!event || event.modifier === this || (event.modifier && event.modifier.constructor === this)) {
					return Variable.prototype.updated.call(this, event, by)
				}
				var contextualizedVariable = context && context.getContextualized(this) || this
				if (event.type === 'delete') {
					contextualizedVariable.splice(event.previousIndex, 1)
				} else if (event.type === 'add') {
					var array = contextualizedVariable.cachedValue
					contextualizedVariable.push(this.arguments[0].call(this.arguments[1], this.source.property(array && array.length)))
				} else if (event.type === 'update') {
					if (this.getCollectionOf()) {
						return // if it has typed items, we don't need to propagate update events, since they will be handled by the variable item.
					}
					var object = event.parent.valueOf()
					var array = contextualizedVariable.cachedValue
					var index = event.key
					var value = event.value
					if (index > -1) {
						// update was to an index property of this array variable
						value = object[index]
					} else {
						// update was inside an object inside of our array
						index = array && array.map && array.indexOf(object)
					}
					if (index > -1) {
						contextualizedVariable.splice(index, 1, this.arguments[0].call(this.arguments[1], this.source.property(index)))
					} else {
						return Transform.prototype.updated.call(this, event, by, isDownstream)
					}
				} else {
					return Transform.prototype.updated.call(this, event, by, isDownstream)
				}
			}
		}, VArray)
		defineArrayMethod('reduce', function Reduced() {})
		defineArrayMethod('reduceRight', function Reduced() {})
		defineArrayMethod('some', function Aggregated() {}, {}, VBoolean)
		defineArrayMethod('every', function Aggregated() {}, {}, VBoolean)
		defineArrayMethod('slice', function Aggregated() {}, {}, VArray)
		defineArrayMethod('keyBy', function UniqueIndex(source, args) {}, {
			property: VMap.prototype.property,
			method: function(array, args) {
				var index = new Map()
				var keyGenerator = args[0]
				var valueGenerator = args[1]
				var hasKeyFunction = typeof keyGenerator === 'function'
				var hasValueFunction = typeof valueGenerator === 'function'
				var hasKey = !!keyGenerator
				for (var i = 0, l = array.length; i < l; i++) {
					var element = array[i]
					index.set(
						hasKeyFunction ? keyGenerator(element, emit) :
							hasKey ? element[keyGenerator] : element,
						hasValueFunction ? valueGenerator(element) : element)
				}
				function emit(key, value) {
					index.set(key, value)
				}
				return index
			}
		})
	
		defineArrayMethod('groupBy', function UniqueIndex(source, args) {}, {
			property: VMap.prototype.property,
			method: function(array, args) {
				var index = new Map()
				var keyGenerator = args[0]
				var valueGenerator = args[1]
				var hasKeyFunction = typeof keyGenerator === 'function'
				var hasValueFunction = typeof valueGenerator === 'function'
				var hasKey = !!keyGenerator
				for (var i = 0, l = array.length; i < l; i++) {
					var element = array[i]
					var key = hasKeyFunction ? keyGenerator(element) :
							hasKey ? element[keyGenerator] : element
					var group = index.get(key)
					if (!group) {
						index.set(key, group = [])
					}
					group.push(hasValueFunction ? valueGenerator(element) : element)
				}
				function emit(key, value) {
					var group = index.get(key)
					if (!group) {
						index.set(key, group = [])
					}
					group.push(value)
				}
				return index
			}
		})
	
		var getGeneratorDescriptor = Variable.getGeneratorDescriptor = function(value) {
			var variables
			return {
				get: function() {
					if (!variables) {
						 variables = new WeakMap()
					}
					var variable = variables.get(this)
					if (!variable) {
						variables.set(this, variable = new GeneratorVariable(value.bind(this)))
					}
					return variable
				},
				enumerable: true
			}
		}
	
		Variable.all = all
		Variable.Context = Context
	
		return exports
	}))


/***/ },
/* 5 */
/***/ function(module, exports, __webpack_require__) {

	var __WEBPACK_AMD_DEFINE_FACTORY__, __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;(function (root, factory) { if (true) {
	  !(__WEBPACK_AMD_DEFINE_ARRAY__ = [__webpack_require__(2), __webpack_require__(6), __webpack_require__(4)], __WEBPACK_AMD_DEFINE_FACTORY__ = (factory), __WEBPACK_AMD_DEFINE_RESULT__ = (typeof __WEBPACK_AMD_DEFINE_FACTORY__ === 'function' ? (__WEBPACK_AMD_DEFINE_FACTORY__.apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__)) : __WEBPACK_AMD_DEFINE_FACTORY__), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__)) } else if (typeof module === 'object' && module.exports) {        
	  module.exports = factory(require('./util/lang'), require('./operators'), require('./Variable')) // Node
	}}(this, function (lang, operators, VariableExports) {
	
	  var Transform = VariableExports.Transform
	  var Variable = VariableExports.Variable
	  var isGenerator = lang.isGenerator
	  var ObjectTransform = lang.compose(Transform, function ObjectTransform(source, transform, sources) {
	    this.sources = sources
	    Transform.apply(this, arguments)
	  }, {
	    _getAsObject: function() {
	      return this.transform.apply(this, preserveObjects(this.sources))
	    }
	  })
	  function preserveObjects(sources) {
	    for (var i = 0, l = sources.length; i < l; i++) {
	      var source = sources[i]
	      if (source && source._getAsObject) {
	        sources[i] = source._getAsObject()
	      }
	    }
	    return sources
	  }
		function react(generator, options) {
	    if (typeof generator !== 'function') {
	      throw new Error('react() must be called with a generator. You need to use the babel-plugin-transform-alkali plugin if you want to use reactive expressions')
	    }
			if (options && options.reverse) {
				generator.reverse = options.reverse
			}
			return new VariableExports.GeneratorVariable(generator)
		}
	  lang.copy(react, operators)
	  react.from = function(value, options) {
	    if (value && value.property) {
	      return value
	    }
	    if (typeof value === 'function' && isGenerator(value)) {
	      return react(value, options)
	    }
	    return Variable.from(value)
	  }
	  react.prop = function(object, property) {
	    if (object) {
	      // TODO: Use a static set of public methods/properties that can be accessed
	      if (object.property) {
	        // it is a variable already, but check to see if we are using a method/property directly on the variable
	        var directPropertyValue = object[property]
	        return directPropertyValue !== undefined ? directPropertyValue : object.property(property)
	      }
	      return object[property]
	    }
	    // not even truthy, return undefined
	  }
	  react.cond = function(test, consequent, alternate) {
	    return operators.if(test, operators.choose(consequent, alternate))
	  }
	  react.fcall = function(target, args) {
	    if (target.property && typeof target === 'function') {
	      return target.apply(null, preserveObjects(args))
	    }
	    return new Transform(args[0], target, args)
	  }
	  react.mcall = function(target, key, args) {
	    var method = target[key]
	    if (typeof method === 'function' && method.property || key === 'bind') {
	      // for now we check to see if looks like it could handle a variable, or is a bind call
	      return method.apply(target, preserveObjects(args))
	    }
	    return new Transform(args[0], target[key].bind(target), args)
	  }
	  react.ncall = function(target, args) {
	    if (target.property && typeof target === 'function') {
	      return new (target.bind.apply(target, [null].concat(preserveObjects(args))))()
	    }
	    return new Transform(args[0], function() {
	      return new (target.bind.apply(target, [null].concat(arguments)))()
	    }, args)
	  }
	
	  react.obj = function(transform, sources) {
	    return new ObjectTransform(sources[0], transform, sources)
	  }
	
		return react
	}))

/***/ },
/* 6 */
/***/ function(module, exports, __webpack_require__) {

	var __WEBPACK_AMD_DEFINE_FACTORY__, __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;(function (root, factory) { if (true) {
		!(__WEBPACK_AMD_DEFINE_ARRAY__ = [__webpack_require__(4)], __WEBPACK_AMD_DEFINE_FACTORY__ = (factory), __WEBPACK_AMD_DEFINE_RESULT__ = (typeof __WEBPACK_AMD_DEFINE_FACTORY__ === 'function' ? (__WEBPACK_AMD_DEFINE_FACTORY__.apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__)) : __WEBPACK_AMD_DEFINE_FACTORY__), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__)) } else if (typeof module === 'object' && module.exports) {        
	  module.exports = factory(require('./Variable')) // Node
	}}(this, function (VariableExports) {
	
		var VBoolean = VariableExports.VBoolean
		var VNumber = VariableExports.VNumber
		var operatingFunctions = {};
		var operators = {};
		function getOperatingFunction(expression){
			// jshint evil: true
			return operatingFunctions[expression] ||
				(operatingFunctions[expression] =
					new Function('a', 'b', 'return ' + expression));
		}
		function operator(operator, type, name, precedence, forward, reverseA, reverseB){
			// defines the standard operators
			var reverse = function(output, inputs){
				var a = inputs[0],
					b = inputs[1]
				var firstError
				if(a && a.put){
					try {
						return a.put(reverseA(output, b && b.valueOf()))
					} catch(error) {
						if (error.deniedPut) {
							firstError = error
						} else {
							throw error
						}
					}
				}
				if(b && b.put){
					b.put(reverseB(output, a && a.valueOf()))
				} else {
					throw (firstError && firstError.message ? firstError : new Error('Can not assign change value to constant operators'))
				}
			};
			// define a function that can lazily ensure the operating function
			// is available
			var operatorHandler = {
				apply: function(instance, args){
					forward = getOperatingFunction(forward);
					reverseA = reverseA && getOperatingFunction(reverseA);
					reverseB = reverseB && getOperatingFunction(reverseB);
					forward.reverse = reverse;
					operators[operator] = operatorHandler = new VariableExports.Variable(forward);
	
					addFlags(operatorHandler);
					args = Array.prototype.slice.call(args);
					return operatorHandler.apply(instance, args);
				}
			};
			function addFlags(operatorHandler){
				operatorHandler.precedence = precedence;
				operatorHandler.infix = reverseB !== false;
			}
			addFlags(operatorHandler);
			operators[operator] = operatorHandler;
			operators[name] = function() {
				var result = operatorHandler.apply(null, arguments)
				return type ? result.as(type) : result
			}
		}
		// using order precedence from:
		// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Operator_Precedence
		operator('+', VNumber, 'add', 6, 'a+b', 'a-b', 'a-b');
		operator('-', VNumber, 'subtract', 6, 'a-b', 'a+b', 'b-a');
		operator('*', VNumber, 'multiply', 5, 'a*b', 'a/b', 'a/b');
		operator('/', VNumber, 'divide', 5, 'a/b', 'a*b', 'b/a');
	//	operator('^', 7, 'a^b', 'a^(-b)', 'Math.log(a)/Math.log(b)');
		operator('?', null, 'if', 16, 'b[a?0:1]', 'a===b[0]||(a===b[1]?false:(function(){throw new Error()})())', '[a,b]');
		operator(':', null, 'choose', 15, '[a,b]', 'a[0]?a[1]:(function(){throw new Error()})()', 'a[1]');
		operator('!', VBoolean, 'not', 4, '!a', '!a', false);
		operator('%', VNumber, 'remainder', 5, 'a%b');
		operator('>', VBoolean, 'greater', 8, 'a>b');
		operator('>=', VBoolean, 'greaterOrEqual', 8, 'a>=b');
		operator('<', VBoolean, 'less', 8, 'a<b');
		operator('<=', VBoolean, 'lessOrEqual', 8, 'a<=b');
		operator('===', VBoolean, 'strictEqual', 9, 'a===b');
		operator('==', VBoolean, 'equal', 9, 'a==b');
		operator('&', VBoolean, 'and', 8, 'a&&b');
		operator('|', VBoolean, 'or', 8, 'a||b');
		operator('round', 'round', 8, 'Math.round(a*Math.pow(10,b||1))/Math.pow(10,b||1)', 'a', 'a');
		return operators;
	}))

/***/ },
/* 7 */
/***/ function(module, exports, __webpack_require__) {

	var __WEBPACK_AMD_DEFINE_FACTORY__, __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;(function (root, factory) { if (true) {
		!(__WEBPACK_AMD_DEFINE_ARRAY__ = [__webpack_require__(2), __webpack_require__(4)], __WEBPACK_AMD_DEFINE_FACTORY__ = (factory), __WEBPACK_AMD_DEFINE_RESULT__ = (typeof __WEBPACK_AMD_DEFINE_FACTORY__ === 'function' ? (__WEBPACK_AMD_DEFINE_FACTORY__.apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__)) : __WEBPACK_AMD_DEFINE_FACTORY__), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__)) } else if (typeof module === 'object' && module.exports) {        
	  module.exports = factory(require('./util/lang'), require('./Variable')) // Node
	}}(this, function (lang, VariableExports) {
		var Variable = VariableExports.Variable
		
		function deepCopy(source, target, derivativeMap) {
			if (source && typeof source == 'object') {
				if (source instanceof Array) {
					target = [] // always create a new array for array targets
					for(var i = 0, l = source.length; i < l; i++) {
						target[i] = deepCopy(source[i], null, derivativeMap)
					}
				} else {
					if (!target || typeof target !== 'object') {
						target = derivativeMap && derivativeMap.get(source)
						if (!target) {
							target = {}
							derivativeMap && derivativeMap.set(source, target)
						}
					}
					for (var i in source) {
						target[i] = deepCopy(source[i], target[i], derivativeMap)
					}
				}
				return target
			}
			return source
		}
	
		var Copy = lang.compose(Variable, function(copiedFrom) {
			// this is the variable that we derive from
			this.copiedFrom = copiedFrom
			this.derivativeMap = new lang.WeakMap(null, 'derivative')
			this.isDirty = new Variable(false)
		}, {
			getValue: function(sync, context) {
				if(this.state) {
					this.state = null
				}
				var value = this.copiedFrom.valueOf(context)
				if(value && typeof value == 'object') {
					var derivative = this.derivativeMap.get(value)
					if (derivative == null) {
						this.derivativeMap.set(value, derivative = deepCopy(value, undefined, this.derivativeMap))
						this.setValue(derivative, context)
					}
					return derivative
				}
				if(this.value === undefined) {
					return value
				}
				return this.value
			},
			getCopyOf: function(value) {
				var derivative = this.derivativeMap.get(value)
				if (derivative == null) {
					this.derivativeMap.set(value, derivative = deepCopy(value, undefined, this.derivativeMap))
				}
				return derivative
			},
			save: function() {
				// copy back to the original object
				var original = this.copiedFrom.valueOf()
				var newCopiedFrom = deepCopy(this.valueOf(), original)
				if (this.copiedFrom.put) { // copiedFrom doesn't have to be a variable, it can be a plain object
					// assign it now
					this.copiedFrom.put(newCopiedFrom)
				}
				this.isDirty.put(false)
				this.onSave && this.onSave()
			},
			revert: function() {
				var original = this.copiedFrom.valueOf()
				this.derivativeMap = new lang.WeakMap(null, 'derivative') // clear out the mapping, so we can start fresh
				this.put(deepCopy(original, undefined, this.derivativeMap))
				this.isDirty.put(false)
			},
			updated: function() {
				this.isDirty.put(true)
				return Variable.prototype.updated.apply(this, arguments)
			}
		})
		return Copy
	}))

/***/ }
/******/ ])
});
;
//# sourceMappingURL=index.js.map