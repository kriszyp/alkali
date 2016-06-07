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

/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {

/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId])
/******/ 			return installedModules[moduleId].exports;

/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			exports: {},
/******/ 			id: moduleId,
/******/ 			loaded: false
/******/ 		};

/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);

/******/ 		// Flag the module as loaded
/******/ 		module.loaded = true;

/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}


/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;

/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;

/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";

/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(0);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ function(module, exports, __webpack_require__) {

	var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;!(__WEBPACK_AMD_DEFINE_ARRAY__ = [__webpack_require__(1), __webpack_require__(2), __webpack_require__(5), __webpack_require__(4), __webpack_require__(6), __webpack_require__(7)], __WEBPACK_AMD_DEFINE_RESULT__ = function(Element, Variable, react, Updater, operators, Copy) {
		var main = Object.create(Element)
	  main.Copy = Copy
		main.Element = Element
		main.Variable = Variable
		main.all = Variable.all
		main.react = react
		main.Updater = Updater
	  Object.assign(main, Updater)
		Object.assign(main, operators)
		return main
	}.apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__))

/***/ },
/* 1 */
/***/ function(module, exports, __webpack_require__) {

	var __WEBPACK_AMD_DEFINE_FACTORY__, __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;(function (root, factory) { if (true) {
					!(__WEBPACK_AMD_DEFINE_ARRAY__ = [__webpack_require__(2), __webpack_require__(4), __webpack_require__(3)], __WEBPACK_AMD_DEFINE_FACTORY__ = (factory), __WEBPACK_AMD_DEFINE_RESULT__ = (typeof __WEBPACK_AMD_DEFINE_FACTORY__ === 'function' ? (__WEBPACK_AMD_DEFINE_FACTORY__.apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__)) : __WEBPACK_AMD_DEFINE_FACTORY__), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__))
			} else if (typeof module === 'object' && module.exports) {
					module.exports = factory(require('./util/lang'), require('./Variable'), require('./Updater'))
			} else {
					root.alkali.Element = factory(root.alkali.lang, root.alkali.Variable, root.alkali.Updater)
			}
	}(this, function (Variable, Updater, lang) {
		var knownElementProperties = {};
		['textContent', 'innerHTML', 'title', 'href', 'value', 'valueAsNumber', 'role', 'render'].forEach(function(property) {
			knownElementProperties[property] = true
		})

		var SELECTOR_REGEX = /(\.|#)([-\w]+)(.+)?/
		function isGenerator(func) {
			if (typeof func === 'function') {
				var constructor = func.constructor
				return (constructor.displayName || constructor.name) === 'GeneratorFunction'
			}
		}
		function Context(subject){
			this.subject = subject
		}

		var PropertyUpdater = Updater.PropertyUpdater
		var AttributeUpdater = Updater.AttributeUpdater
		var StyleUpdater = lang.compose(Updater.StyleUpdater, function StyleUpdater() {
			Updater.StyleUpdater.apply(this, arguments)
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

		var ClassNameUpdater = lang.compose(Updater.ElementUpdater, function ClassNameUpdater(options) {
			this.className = options.className
			Updater.apply(this, arguments)
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
		var TextUpdater = Updater.TextUpdater
		var ListUpdater = Updater.ListUpdater
		
		var toAddToElementPrototypes = []
		var createdBaseElements = []
		var doc = typeof document !== 'undefined' ? document : {
			createElement: function(tag) {
				return {}
			}
		}

		var testStyle = doc.createElement('div').style
		var childTagForParent = {
			TABLE: ['tr','td'],
			TBODY: ['tr','td'],
			TR: 'td',
			UL: 'li',
			OL: 'li',
			SELECT: 'option'
		}
		var inputs = {
			INPUT: 1,
			TEXTAREA: 1
			// SELECT: 1, we exclude this, so the default "content" of the element can be the options
		}

		function booleanStyle(options) {
			return function(element, value, key) {
				if (typeof value === 'boolean') {
					// has a boolean conversion
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
			display: booleanStyle(['initial', 'none']),
			visibility: booleanStyle(['visible', 'hidden']),
			color: directStyle,
			opacity: directStyle,
			zoom: directStyle,
			minZoom: directStyle,
			maxZoom: directStyle,
			fontWeight: directStyle,
			position: booleanStyle(['absolute', '']),
			textDecoration: booleanStyle(['underline', '']),
			fontWeight: booleanStyle(['bold', 'normal'])
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
				document.head.insertBefore(styleSheetElement, document.head.firstChild)
				styleSheet = styleSheetElement.sheet
			}
			var cssRules = styleSheet.cssRules || styleSheet.rules
			return cssRules[styleSheet.addRule(selector, ' ', cssRules.length)]
		}
		var invalidatedElements = new WeakMap(null, 'invalidated')
		var queued

		var toRender = []
		function flatten(target, part) {
			var base = target.base
			if (base) {
				var basePart = base[part]
				if (basePart) {
					target[part] || target[part]
				}
			}
		}

		function layoutChildren(parent, children, container, prepend) {
			var fragment = (children.length > 3 || prepend) ? doc.createDocumentFragment() : parent
			for(var i = 0, l = children.length; i < l; i++) {
				var child = children[i]
				var childNode
				if (child && child.create) {
					// an element constructor
					currentParent = parent
					childNode = child.create()
					fragment.appendChild(childNode)
					if (child.isContentNode) {
						container.contentNode = childNode
					}
				} else if (typeof child == 'function') {
					// TODO: reenable this
	//				if (child.for) {
						// a variable constructor that can be contextualized
		//				fragment.appendChild(variableAsText(parent, child))
			//		} else {
						// an element constructor
						childNode = new child()
						fragment.appendChild(childNode)
				//	}
				} else if (typeof child == 'object') {
					if (child instanceof Array) {
						// array of sub-children
						container = container || parent
						childNode = childNode || parent
						layoutChildren(childNode.contentNode || childNode, child, container)
					} else if (child.notifies) {
						// a variable
						fragment.appendChild(variableAsText(parent, child))
					} else if (child.nodeType) {
						// an element itself
						fragment.appendChild(child)
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
			if (fragment != parent) {
				if (prepend) {
					parent.insertBefore(fragment, parent.firstChild)
				} else {
					parent.appendChild(fragment)
				}
			}
			return childNode
		}
		function variableAsText(parent, content) {
			if (content == null) {
				return doc.createTextNode('')
			}
			var text
			try {
				text = content.valueOf(new Context(parent))
			} catch (error) {
				text = error.stack
			}
			var textNode = doc.createTextNode(text)
			if (content.notifies) {
				enterUpdater(TextUpdater, {
					element: parent,
					textNode: textNode,
					variable: content
				})
			}
			return textNode
		}

		function bidirectionalHandler(element, value, key) {
			if (value && value.notifies) {
				enterUpdater(PropertyUpdater, {
					name: key,
					variable: value,
					element: element
				})
				if (inputs[element.tagName] || element.tagName === 'SELECT') {
					bindChanges(element, value, key)
				}
			} else {
				element[key] = value
			}
		}

		function noop() {}
		var propertyHandlers = {
			content: noop, // content and children have special handling in create
			children: noop,
			each: noop, // just used by content, doesn't need to be recorded on the element
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
						enterUpdater(ClassNameUpdater, {
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
			for: applyAttribute,
			role: applyAttribute,
			render: function(element, value, key) {
				// TODO: This doesn't need to be a property updater
				// we should also verify it is a generator
				// and maybe, at some point, find an optimization to eliminate the bind()
				enterUpdater(PropertyUpdater, {
					name: key,
					variable: new Variable.GeneratorVariable(value.bind(element)),
					element: element
				})
			},
			value: bidirectionalHandler,
			valueAsNumber: bidirectionalHandler,
			valueAsDate: bidirectionalHandler,
			checked: bidirectionalHandler,
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
					enterUpdater(AttributeUpdater, {
						name: 'style',
						variable: value,
						elment: element
					})
				} else {
					styleObjectHandler(element, value, key)
				}
			}
		}
		function applyAttribute(element, value, key) {
			if (value && value.notifies) {
				enterUpdater(AttributeUpdater, {
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
			var SubPropertyUpdater = lang.compose(PropertyUpdater, function SubPropertyUpdater(options) {
				PropertyUpdater.apply(this, arguments)
			}, {
				renderUpdate: renderer
			})	
			return function(element, value, key) {
				var target = element[key]
				for (var subKey in value) {
					var subValue = value[subKey]
					if (subValue && subValue.notifies) {
						enterUpdater(SubPropertyUpdater, {
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

		function applyProperties(element, properties) {
			for (var key in properties) {
				var value = properties[key]
				var styleDefinition = styleDefinitions[key]
				if (propertyHandlers[key]) {
					propertyHandlers[key](element, value, key, properties)
				} else if ((styleDefinition = styleDefinitions[key]) && element[key] === undefined) {
					if (value && value.notifies) {
						enterUpdater(StyleUpdater, {
							name: key,
							variable: value,
							element: element
						})
					} else {
						styleDefinition(element, value, key)
					}
				} else if (value && value.notifies) {
					enterUpdater(PropertyUpdater, {
						name: key,
						variable: value,
						element: element
					})
				} else if (typeof value === 'function' && key.slice(0, 2) === 'on') {
					element.addEventListener(key.slice(2), value)
				} else {
					element[key] = value
				}
			}
		}

		function applySelector(element, selector) {
			selector.replace(/(\.|#)?(\w+)/g, function(t, operator, name) {
				if (operator == '.') {
					element._class = (element._class ? element._class + ' ' : '') + name
				} else if (operator == '#') {
					element._id = name
				} else {
					element._tag = name
				}
			})
		}

		nextClassId = 1
		uniqueSelectors = {}
		function getUniqueSelector(element) {
			var selector = element.hasOwnProperty('_uniqueSelector') ? element._uniqueSelector :
				(element._tag + (element._class ? '.' + element._class.replace(/\s+/g, '.') : '') +
				(element._id ? '#' + element._id : ''))
			if (!selector.match(/[#\.-]/)) {
				if (uniqueSelectors[selector]) {
					element._class = '.x-' + nextClassId++
					selector = getUniqueSelector(element)
				} else {
					uniqueSelectors[selector] = selector
				}
			}
			return selector
		}

		function buildContent(element, content, key, properties) {
			var each = element.each || properties.each
			if (each && content) {
				// render as list
				if (each.create) {
					var ItemClass = element.itemAs || Item
					hasOwn(each, ItemClass, function (element) {
						return new ItemClass(element._item, content)
					})
				}
				if (content.notifies) {
					enterUpdater(ListUpdater, {
						each: each,
						variable: content,
						element: element
					})
				} else {
					var fragment = doc.createDocumentFragment()
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
				element.appendChild(variableAsText(element, content))
			}
		}

		function bindChanges(element, variable, key, conversion) {
			lang.nextTurn(function() { // wait for next turn in case inputChanges isn't set yet
				var inputEvents = element.inputEvents || ['change']
				for (var i = 0, l = inputEvents.length; i < l; i++) {
					element.addEventListener(inputEvents[i], function (event) {
						var value = element[key]
						var result = variable.put(conversion ? conversion(value, element) : value, new Context(element))
						if (result === Variable.deny) {
							throw new Error('Variable change denied')
						}
					})
				}
			})
		}

		function conversion(value, element) {
			if (element.type == 'number') {
				return parseFloat(value)
			}
			return value
		}

		function buildInputContent(element, content) {
			var inputType = element.type
			var inputProperty = inputType in {date: 1, datetime: 1, time: 1} ?
					'valueAsDate' : inputType === 'checkbox' ?
						'checked' : 'value'

			if (content && content.notifies) {
				// a variable, respond to changes
				enterUpdater(PropertyUpdater, {
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
		var classHandlers = {
			hasOwn: function(Element, value) {
				hasOwn(Element, value)
			}
		}

		function applyToClass(value, Element) {
			var applyOnCreate = Element._applyOnCreate
			var prototype = Element.prototype
			if (value && typeof value === 'object') {
				if (value instanceof Array || value.notifies) {
					applyOnCreate.content = value
				} else {
					for (var key in value) {
					// TODO: eventually we want to be able to set these as rules statically per element
					/*if (styleDefinitions[key]) {
						var styles = Element.styles || (Element.styles = [])
						styles.push(key)
						styles[key] = descriptor.value
					} else {*/
						if (classHandlers[key]) {
							hasOwn(Element, value[key])
						} else {
							// TODO: do deep merging of styles and classes, but not variables
							applyOnCreate[key] = value[key]
						}
					}
				}
			} else if (typeof value === 'function' && !value.for) {
				throw new TypeError('Function as argument not supported')
			} else {
				applyOnCreate.content = value
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
				applyOnCreate = Class._applyOnCreate = {}
				var parentApplySet = getApplySet(getPrototypeOf(Class))
				for (var key in parentApplySet) {
					applyOnCreate[key] = parentApplySet[key]
				}
				// we need to check the prototype for event handlers
				var prototype = Class.prototype
				var keys = Object.getOwnPropertyNames(prototype)
				for (var i = 0, l = keys.length; i < l; i++) {
					var key = keys[i]
					if (key.slice(0, 2) === 'on' || (key === 'render' && isGenerator(prototype[key]))) {
						applyOnCreate[key] = prototype[key]
					} else if (key.slice(0, 6) === 'render') {
						Object.defineProperty(prototype, key[6].toLowerCase() + key.slice(7), renderDescriptor(key))
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
			Element.create = create
			Element.with = withProperties
			Element.for = forTarget
			Element.property = propertyForElement
			Element.getForClass = getForClass
			return Element
		}

		function withProperties(selector, properties) {
			var Element = makeElementConstructor()
			Element.superConstructor = this
			if (this.children) {
				// just copy this property
				Element.children = this.children
			}
			var prototype = Element.prototype = this.prototype

			var hasOwnApplySet
			var applyOnCreate = Element._applyOnCreate = {}
			var parentApplySet = getApplySet(this)
			// copy parent properties
			for (var key in parentApplySet) {
				applyOnCreate[key] = parentApplySet[key]
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
				applyToClass(arguments[i], Element)
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
			var element = doc.createElement(applyOnCreate.tagName)
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
				element.constructor = this // need to do this for hasOwn contextualization to work
			}
			if (arguments.length > 0) {
				// copy applyOnCreate when we have arguments
				var ElementApplyOnCreate = applyOnCreate
				applyOnCreate = {}
				for (var key in ElementApplyOnCreate) {
					applyOnCreate[key] = ElementApplyOnCreate[key]
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
					if (argument instanceof Array || argument.notifies) {
						applyOnCreate.content = argument
					} else if (typeof argument === 'function' && argument.for) {
						applyOnCreate.content = argument.for(element)
					} else {
						for (var key in argument) {
							// TODO: do deep merging of styles and classes, but not variables
							applyOnCreate[key] = argument[key]
						}
					}
				}
			}
			// TODO: inline this
			applyProperties(element, applyOnCreate)
			if (this.children) {
				layoutChildren(element, this.children, element)
			}
			// always do this last, so it can be properly inserted inside the children
			if (applyOnCreate.content) {
				buildContent(element, applyOnCreate.content, 'content', applyOnCreate)
			}
			element.createdCallback && element.createdCallback()
			element.created && element.created(applyOnCreate)
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

		function registerTag(tagName) {
			getApplySet(this).tagName = tagName
			if (document.registerElement) {
				document.registerElement(tagName, this)
			}
		}

		var Element = withProperties.call(typeof HTMLElement !== 'undefined' ? HTMLElement : function() {})

		Element.within = function(element){
			// find closest child
		}

		generate([
			'Video',
			'Source',
			'Media',
			'Audio',
			'UL',
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
			'Style',
			'Span',
			'Shadow',
			'Select',
			'Script',
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
			'Image',
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
			'Article',
			'Aside',
			'Footer',
			'Figure',
			'FigCaption',
			'Header',
			'Main',
			'Mark',
			'MenuItem',
			'Nav',
			'Section',
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
					setTag(withProperties.call(doc.createElement(tagName).constructor), tagName))
		}

		function setTag(Element, tagName) {
			Element._applyOnCreate.tagName = tagName
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
						return ElementClass || (ElementClass = setTag(withProperties.call(HTMLInputElement, {
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
		Element.prepend = prepend
		Element.refresh = Updater.refresh
		var options = Element.options = {
			moveLiveElementsEnabled: true,
		}
		Element.content = function(element){
			// container marker
			return {
				isContentNode: true,
				create: element.create.bind(element)
			}
		}
		// TODO: unify this in lang
		Element.extend = function(Class, properties) {
			function ExtendedElement() {
				return Class.apply(this, arguments)
			}
			setPrototypeOf(ExtendedElement, Class)
			var prototype = ExtendedElement.prototype = Object.create(Class.prototype)
			prototype.constructor = ExtendedElement
			Object.getOwnPropertyNames(properties).forEach(function(key) {
				var descriptor = Object.getOwnPropertyDescriptor(properties, key)
				if (classHandlers[key]) {
					classHandlers[key](ExtendedElement, descriptor.value)
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
			if (typeof Target === 'object' && Target.Class) {
				return hasOwn(From, Target.Class, Target.createInstance)
			}
			if (Target instanceof Array) {
				return Target.forEach(function(Target) {
					hasOwn(From, Target)
				})
			}
			var ownedClasses = From.ownedClasses || (From.ownedClasses = new WeakMap())
			// TODO: assign to super classes
			ownedClasses.set(Target, createInstance || function() {
				return new Target()
			})
			return From
		}

		var globalInstances = {}
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
					// when we create the instance, immediately observe it
					// TODO: we might want to do this in init instead
					var instance = new ThisElementVariable(element)
					Variable.observe(element)
					return instance
				})
			}
			// now actually get the property class
			return ThisElementVariable.property(key)
		}

		var Item = Element.Item = Variable.Item

		function enterUpdater(Updater, options/*, target*/) {
			// this will be used for optimized class-level variables
			/*if (target.started) { // TODO: Might want to pass in started as a parameter
				// this means that the updater has already been created, so we just need to add this instance
				Updater.prototype.renderUpdate.call(options, element)
			} else {*/
			var target = options.element
			var updaters = target.updaters || (target.updaters = [])
			updaters.push(new Updater(options))
			//}
		}

		function cleanup(target) {
			var updaters = target.updaters
			if (updaters) {
				for (var i = 0, l = updaters.length; i < l; i++) {
					updaters[i].stop()
				}
				target.needsRestart = true
			}
		}
		function restart(target) {
			var updaters = target.updaters
			if (updaters) {
				for (var i = 0, l = updaters.length; i < l; i++) {
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
			observer.observe(document.body, {
				childList: true,
				subtree: true
			})
		}

		return Element
	}))


/***/ },
/* 2 */
/***/ function(module, exports, __webpack_require__) {

	var __WEBPACK_AMD_DEFINE_FACTORY__, __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;(function (root, factory) { if (true) {
	        !(__WEBPACK_AMD_DEFINE_ARRAY__ = [__webpack_require__(3)], __WEBPACK_AMD_DEFINE_FACTORY__ = (factory), __WEBPACK_AMD_DEFINE_RESULT__ = (typeof __WEBPACK_AMD_DEFINE_FACTORY__ === 'function' ? (__WEBPACK_AMD_DEFINE_FACTORY__.apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__)) : __WEBPACK_AMD_DEFINE_FACTORY__), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__))
	    } else if (typeof module === 'object' && module.exports) {
	        module.exports = factory(require('./util/lang'))
	    } else {
	        root.alkali.Variable = factory(root.alkali.lang)
	    }
	}(this, function (lang) {
		var deny = {}
		var noChange = {}
		var WeakMap = lang.WeakMap
		var setPrototypeOf = Object.setPrototypeOf || (function(base, proto) { base.__proto__ = proto})
		var getPrototypeOf = Object.getPrototypeOf || (function(base) { return base.__proto__ })
		// update types
		var ToParent = 2
		var RequestChange = 3
		var Refresh = Object.freeze({
			type: 'refresh'
		})
		var ToChild = Object.freeze({
			type: 'refresh'
		})
		var nextId = 1
		var propertyListenersMap = new WeakMap(null, 'propertyListenersMap')

		var CacheEntry = lang.compose(WeakMap, function() {
		},{
			_propertyChange: function(propertyName) {
				this.variable._propertyChange(propertyName, contextFromCache(this))
			}
		})
		var listenerId = 1

		function mergeSubject(context) {
			for (var i = 1, l = arguments.length; i < l; i++) {
				var nextContext = arguments[i]
				if (nextContext !== context && (!context || nextContext && context.contains && context.contains(nextContext))) {
					context = nextContext
				}
			}
			return context
		}

		function getDistinctContextualized(variable, context) {
			var subject = context && (context.distinctSubject || context.subject)
			if (typeof variable === 'function') {
				return variable.for(subject)
			}
			var contextMap = variable.contextMap
			if (context && contextMap) {
				while(subject && !contextMap.has(subject)) {
					subject = subject.parentNode
				}
				if (!subject) {
					subject = defaultContext
				}
				return contextMap.get(subject)
			}
		}
		function when(value, callback) {
			if (value && value.then) {
				return value.then(callback)
			}
			return callback(value)
		}

		function Context(subject){
			this.subject = subject
		}
		function whenAll(inputs, callback){
			var promiseInvolved
			var needsContext
			for (var i = 0, l = inputs.length; i < l; i++) {
				if (inputs[i] && inputs[i].then) {
					promiseInvolved = true
				}
			}
			if (promiseInvolved) {
				return lang.whenAll(inputs, callback)
			}
			return callback(inputs)
		}

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

		function PropertyChange(key, object, childEvent) {
			this.key = key
			this.object = object
			this.childEvent = childEvent
			this.version = nextId++
		}
		PropertyChange.prototype.type = 'update'
		function Variable(value) {
			if (this instanceof Variable) {
				// new call, may eventually use new.target
				this.value = typeof value === 'undefined' ? this.default : value
			} else {
				return Variable.extend(value)
			}
		}
		var VariablePrototype = Variable.prototype = {
			constructor: Variable,
			valueOf: function(context) {
				if (this.subject) {
					var variable = this
					context = new Context(this.subject)
				}
				return this.gotValue(this.getValue(context), context)
			},
			getValue: function() {
				return this.value
			},
			gotValue: function(value, context) {
				var previousNotifyingValue = this.notifyingValue
				var variable = this
				if (value && value.then) {
					return when(value, function(value) {
						return Variable.prototype.gotValue.call(variable, value, context)
					})
				}
				if (previousNotifyingValue) {
					if (value === previousNotifyingValue) {
						// nothing changed, immediately return valueOf
						var resolvedValue = value.valueOf()
						if (resolvedValue !== this.listeningToObject) {
							if (this.listeningToObject) {
								deregisterListener(this)
							}
							if (typeof resolvedValue === 'object' && resolvedValue && (this.dependents || this.constructor.dependents)) {
								// set up the listeners tracking
								registerListener(resolvedValue, this)
							}
						}
						return resolvedValue
					}
					// if there was a another value that we were dependent on before, stop listening to it
					// TODO: we may want to consider doing cleanup after the next rendering turn
					if (variable.dependents) {
						previousNotifyingValue.stopNotifies(variable)
					}
					variable.notifyingValue = null
				}
				if (value && value.notifies) {
					if (variable.dependents) {
							// the value is another variable, start receiving notifications
						value.notifies(variable)
					}
					variable.notifyingValue = value
					value = value.valueOf(context)
				}
				if (typeof value === 'object' && value && (this.dependents || this.constructor.dependents)) {
					// set up the listeners tracking
					registerListener(value, this)
				}
				if (value === undefined) {
					value = variable.default
				}
				return value
			},
			isMap: function() {
				return this.value instanceof Map
			},
			property: function(key) {
				var isMap = this.isMap()
				var properties = this._properties || (this._properties = isMap ? new Map() : {})
				var propertyVariable = isMap ? properties.get(key) : properties[key]
				if (!propertyVariable) {
					// create the property variable
					propertyVariable = new Property(this, key)
					if (isMap) {
						properties.set(key, propertyVariable)
					} else {
						properties[key] = propertyVariable
					}
				}
				return propertyVariable
			},
			for: function(subject) {
				if (subject && subject.target && !subject.constructor.getForClass) {
					// makes HTML events work
					subject = subject.target
				}
				if (typeof this === 'function') {
					// this is a class, the subject should hopefully have an entry
					if (subject) {
						var instance = subject.constructor.getForClass(subject, this)
						if (instance && !instance.subject) {
							instance.subject = subject
						}
						// TODO: Do we have a global context that we set on defaultInstance?
						return instance || this.defaultInstance
					} else {
						return this.defaultInstance
					}
				}
				return new ContextualizedVariable(this, subject || defaultContext)
			},
			distinctFor: function(subject) {
				if (typeof this === 'function') {
					return this.for(subject)
				}
				var map = this.contextMap || (this.contextMap = new WeakMap())
				if (map.has(subject)) {
					return map.get(subject)
				}
				var contextualizedVariable
				map.set(subject, contextualizedVariable = new ContextualizedVariable(this, subject))
				return contextualizedVariable
			},
			_propertyChange: function(propertyName, object, context, type) {
				if (this.onPropertyChange) {
					this.onPropertyChange(propertyName, object, context)
				}
				var properties = this._properties
				var property = properties && (properties instanceof Map ? properties.get(propertyName) : properties[propertyName])
				if (property && !(type instanceof PropertyChange) && object === this.valueOf(context)) {
					property.parentUpdated(ToChild, context)
				}
				this.updated(new PropertyChange(propertyName, object, type), null, context)
			},
			eachKey: function(callback) {
				for (var i in this._properties) {
					callback(i)
				}
			},
			apply: function(instance, args) {
				return new Call(this, args)
			},
			call: function(instance) {
				return this.apply(instance, Array.prototype.slice.call(arguments, 1))
			},
			forDependencies: function(callback) {
				if (this.notifyingValue) {
					callback(this.notifyingValue)
				}
			},
			init: function() {
				if (this.subject) {
					this.constructor.notifies(this)
				}
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
				var handles = this.handles
				if (handles) {
					for (var i = 0; i < handles.length; i++) {
						handles[i].remove()
					}
				}
				this.handles = null
				deregisterListener(this)
				var notifyingValue = this.notifyingValue
				if (notifyingValue) {
					// TODO: move this into the caching class
					this.computedVariable = null
				}
				var variable = this
				this.forDependencies(function(dependency) {
					dependency.stopNotifies(variable)
				})
				if (this.context) {
					this.constructor.stopNotifies(this)
				}
			},

			updateVersion: function() {
				this.version = nextId++
			},

			getVersion: function(context) {
				return Math.max(this.version || 0, this.notifyingValue && this.notifyingValue.getVersion ? this.notifyingValue.getVersion(context) : 0)
			},

			getSubject: function(selectVariable) {
				return this.subject
			},

			getUpdates: function(since) {
				var updates = []
				var nextUpdateMap = this.nextUpdateMap
				if (nextUpdateMap && since) {
					while ((since = nextUpdateMap.get(since))) {
						if (since === Refresh) {
							// if it was refresh, we can clear any prior entries
							updates = []
						}
						updates.push(since)
					}
				}
				return updates
			},

			updated: function(updateEvent, by, context) {
				if (this.subject) {
					if (by === this.constructor) {
						// if we receive an update from the constructor, filter it
						if (!(!context || context.subject === this.subject || (context.subject.contains && this.subject.nodeType && context.subject.contains(this.subject)))) {
							return
						}
					} else {
						// if we receive an outside update, send it to the constructor
						return this.constructor.updated(updateEvent, this, new Context(this.subject))
					}
				}
				if (this.lastUpdate) {
					var nextUpdateMap = this.nextUpdateMap
					if (!nextUpdateMap) {
						nextUpdateMap = this.nextUpdateMap = new WeakMap()
					}
					nextUpdateMap.set(this.lastUpdate, updateEvent)
				}

				this.lastUpdate = updateEvent
				this.updateVersion()
				var value = this.value
				if (!(updateEvent instanceof PropertyChange)) {
					deregisterListener(this)
				}

				var dependents = this.dependents
				if (dependents) {
					// make a copy, in case they change
					dependents = dependents.slice(0)
					for (var i = 0, l = dependents.length; i < l; i++) {
						try{
							var dependent = dependents[i]
							// skip notifying property dependents if we are headed up the parent chain
							if (!(updateEvent instanceof PropertyChange) ||
									dependent.parent !== this || // if it is not a child property
									(by && by.constructor === this)) { // if it is coming from a child context
								if (dependent.parent === this) {
									dependent.parentUpdated(ToChild, context)
								} else {
									dependent.updated(updateEvent, this, context)
								}
							}
						}catch(e) {
							console.error(e, e.stack, 'updating a variable')
						}
					}
				}
			},

			invalidate: function() {
				// for back-compatibility for now
				this.updated()
			},

			notifies: function(target) {
				var dependents = this.dependents
				if (!dependents || !this.hasOwnProperty('dependents')) {
					this.dependents = dependents = []
					this.init()
				}
				dependents.push(target)
				var variable = this
				return {
					unsubscribe: function() {
						variable.stopNotifies(target)
					}
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
						listener.next(variable.valueOf())
					}
				} else {
					throw new Error('Subscribing to an invalid listener, the listener must be a function, or have an update or next method')
				}

				var handle = this.notifies({
					updated: function() {
						if (updateQueued) {
							return
						}
						updateQueued = true
						lang.nextTurn(updated)
					}
				})
				var initialValue = this.valueOf()
				if (initialValue !== undefined) {
					updated()
				}
				return handle
			},
			stopNotifies: function(dependent) {
				var dependents = this.dependents
				if (dependents) {
					for (var i = 0; i < dependents.length; i++) {
						if (dependents[i] === dependent) {
							dependents.splice(i--, 1)
						}
					}
					if (dependents.length === 0) {
						// clear the dependents so it will be reinitialized if it has
						// dependents again
						this.dependents = dependents = false
						this.cleanup()
					}
				}
			},
			put: function(value, context) {
				var variable = this
				
				return when(this.getValue(context), function(oldValue) {
					if (oldValue === value) {
						return noChange
					}
					if (variable.fixed &&
							// if it is set to fixed, we see we can put in the current variable
							oldValue && oldValue.put && // if we currently have a variable
							// and it is always fixed, or not a new variable
							(variable.fixed == 'always' || !(value && value.notifies))) {
						return oldValue.put(value)
					}
					return when(variable.setValue(value, context), function(value) {
						variable.updated(Refresh, variable, context)
					})
				})
			},
			get: function(key) {
				return when(this.valueOf(), function(object) {
					var value = object && (typeof object.get === 'function' ? object.get(key) : object[key])
					if (value && value.notifies) {
						// nested variable situation, get underlying value
						return value.valueOf()
					}
					return value
				})
			},
			set: function(key, value) {
				// TODO: create an optimized route when the property doesn't exist yet
				this.property(key).put(value)
			},
			undefine: function(key, context) {
				this.set(key, undefined, context)
			},

			next: function(value) {
				// for ES7 observable compatibility
				this.put(value)
			},
			error: function(error) {
				// for ES7 observable compatibility
				var dependents = this.dependents
				if (dependents) {
					// make a copy, in case they change
					dependents = dependents.slice(0)
					for (var i = 0, l = dependents.length; i < l; i++) {
						try{
							var dependent = dependents[i]
							// skip notifying property dependents if we are headed up the parent chain
							dependent.error(error)
						}catch(e) {
							console.error(e, 'sending an error')
						}
					}
				}
			},
			complete: function(value) {
				// for ES7 observable compatibility
				this.put(value)
			},
			setValue: function(value) {
				this.value = value
			},
			onValue: function(listener) {
				return this.subscribe(function(event) {
					lang.when(event.value(), function(value) {
						listener(value)
					})
				})
			},
			forEach: function(callback, context) {
				// iterate through current value of variable
				return when(this.valueOf(), function(value) {
					if (value && value.forEach) {
						value.forEach(callback)
					}else{
						for (var i in value) {
							callback(value[i], i)
						}
					}
				})
			},
			each: function(callback) {
				// returns a new mapped variable
				// TODO: support events on array (using dstore api)
				return this.map(function(array) {
					return array.map(callback)
				})
			},

			map: function (operator) {
				// TODO: eventually make this act on the array items instead
				var stack = new Error().stack
				return this.to(function(value) {
					if (value && value.forEach) {
						console.warn('Variable `map()` usage with arrays is deprecated, should use `to()` instead at ', stack)
					}
					return operator(value)
				})
			},
			to: function (operator) {
				// TODO: create a more efficient map, we don't really need a full variable here
				if (!operator) {
					throw new Error('No function provided to transform')
				}
				return new Variable(operator).apply(null, [this])
			},
			get schema() {
				// default schema is the constructor
				return this.notifyingValue ? this.notifyingValue.schema : this.constructor
			},
			set schema(schema) {
				// but allow it to be overriden
				Object.defineProperty(this, 'schema', {
					value: schema
				})
			},
			validate: function(target, schema) {
				if (this.notifyingValue) {
					return this.notifyingValue.validate(target, schema)
				}
				if (schema.type && (schema.type !== typeof target)) {
					return ['Target type of ' + typeof target + ' does not match schema type of ' + schema.type]
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
			getId: function() {
				return this.id || (this.id = nextId++)
			}
		}	

		if (typeof Symbol !== 'undefined') {
			Variable.prototype[Symbol.iterator] = function() {
				return this.valueOf()[Symbol.iterator]()
			}
		}

		var cacheNotFound = {}
		var Caching = Variable.Caching = lang.compose(Variable, function(getValue, setValue) {
			if (getValue) {
				this.getValue = getValue
			}
			if (setValue) {
				this.setValue = setValue
			}
		}, {
			valueOf: function(context) {
				// first check to see if we have the variable already computed
				if (this.cachedVersion === this.getVersion()) {
					if (this.contextMap) {
						var contextualizedVariable = getDistinctContextualized(this, context)
						if (contextualizedVariable) {
							return contextualizedVariable.cachedValue
						}
					} else {
						return this.cachedValue
					}
				}
				
				var variable = this

				function withComputedValue(computedValue) {
					if (computedValue && computedValue.notifies && variable.dependents) {
						variable.computedVariable = computedValue
					}
					computedValue = variable.gotValue(computedValue, watchedContext)
					var contextualizedVariable
					if (watchedContext && watchedContext.distinctSubject) {
						(variable.contextMap || (variable.contextMap = new WeakMap()))
							.set(watchedContext.distinctSubject,
								contextualizedVariable = new ContextualizedVariable(variable, watchedContext.distinctSubject))
						context.distinctSubject = mergeSubject(context.distinctSubject, watchedContext.distinctSubject)
					} else {
						contextualizedVariable = variable
					}
					contextualizedVariable.cachedVersion = newVersion
					contextualizedVariable.cachedValue = computedValue
					return computedValue
				}

				var watchedContext
				if (context) {
					watchedContext = new Context(context.subject)
				}
				var newVersion = this.getVersion()
				var computedValue = this.getValue(watchedContext)
				if (computedValue && computedValue.then) {
					return computedValue.then(withComputedValue)
				} else {
					return withComputedValue(computedValue)
				}
			}
		})

		function GetCache() {
		}

		var Property = lang.compose(Variable, function Property(parent, key) {
			this.parent = parent
			this.key = key
		},
		{
			forDependencies: function(callback) {
				Variable.prototype.forDependencies.call(this, callback)
				callback(this.parent)
			},
			valueOf: function(context) {
				var key = this.key
				var property = this
				var object = this.parent.valueOf(context)
				function gotValueAndListen(object) {
					if (property.dependents) {
						var listeners = propertyListenersMap.get(object)
						if (listeners && listeners.observer && listeners.observer.addKey) {
							listeners.observer.addKey(key)
						}
					}
					var value = property.gotValue(object == null ? undefined : typeof object.get === 'function' ? object.get(key) : object[key])
					return value
				}
				if (object && object.then) {
					return when(object, gotValueAndListen)
				}
				return gotValueAndListen(object)
			},
			put: function(value, context) {
				return this._changeValue(context, RequestChange, value)
			},
			parentUpdated: function(updateEvent, context) {
				return Variable.prototype.updated.call(this, updateEvent, this.parent, context)
			},
			updated: function(updateEvent, by, context) {
				//if (updateEvent !== ToChild) {
					this._changeValue(context, updateEvent)
				//}
				return Variable.prototype.updated.call(this, updateEvent, by, context)
			},
			_changeValue: function(context, type, newValue) {
				var key = this.key
				var parent = this.parent
				return when(parent.valueOf(context), function(object) {
					if (object == null) {
						// nothing there yet, create an object to hold the new property
						var response = parent.put(object = typeof key == 'number' ? [] : {}, context)
					}else if (typeof object != 'object') {
						// if the parent is not an object, we can't set anything (that will be retained)
						return deny
					}
					if (type == RequestChange) {
						var oldValue = typeof object.get === 'function' ? object.get(key) : object[key]
						if (oldValue === newValue) {
							// no actual change to make
							return noChange
						}
						if (typeof object.set === 'function') {
							object.set(key, newValue)
						} else {
							object[key] = newValue
						}
					}
					var listeners = propertyListenersMap.get(object)
					// at least make sure we notify the parent
					// we need to do it before the other listeners, so we can update it before
					// we trigger a full clobbering of the object
					parent._propertyChange(key, object, context, type)
					if (listeners) {
						listeners = listeners.slice(0)
						for (var i = 0, l = listeners.length; i < l; i++) {
							var listener = listeners[i]
							if (listener !== parent) {
								// now go ahead and actually trigger the other listeners (but make sure we don't do the parent again)
								listener._propertyChange(key, object, context, type)
							}
						}
					}
				})
			},
			validate: function(target, schema) {
				return this.parent.validate(target.valueOf(), schema)
			}
		})
		Object.defineProperty(Property.prototype, 'schema', {
			get: function() {
				var parentSchemaProperties = this.parent.schema.properties
				return parentSchemaProperties && parentSchemaProperties[this.key]
			},
			set: function(schema) {
				// have to repeat the override
				Object.defineProperty(this, 'schema', {
					value: schema
				})
			}
		})
		Variable.Property = Property

		var Item = Variable.Item = lang.compose(Variable, function Item(value) {
			this.value = value
		}, {})

		var Composite = Variable.Composite = lang.compose(Caching, function Composite(args) {
			this.args = args
		}, {
			forDependencies: function(callback) {
				// depend on the args
				Caching.prototype.forDependencies.call(this, callback)
				var args = this.args
				for (var i = 0, l = args.length; i < l; i++) {
					var arg = args[i]
					if (arg && arg.notifies) {
						callback(arg)
					}
				}
			},

			updated: function(updateEvent, by, context) {
				var args = this.args
				if (by !== this.notifyingValue && updateEvent !== Refresh) {
					// using a painful search instead of indexOf, because args may be an arguments object
					for (var i = 0, l = args.length; i < l; i++) {
						var arg = args[i]
						if (arg === by) {
							// if one of the args was updated, we need to do a full refresh (we can't compute differential events without knowledge of how the mapping function works)
							updateEvent = Refresh
							continue
						}
					}
				}
				Caching.prototype.updated.call(this, updateEvent, by, context)
			},

			getUpdates: function(since) {
				// this always issues updates, nothing incremental can flow through it
				if (!since || since.version < getVersion()) {
					return [new Refresh()]
				}
			},

			getVersion: function(context) {
				var args = this.args
				var version = Variable.prototype.getVersion.call(this, context)
				for (var i = 0, l = args.length; i < l; i++) {
					var arg = args[i]
					if (arg && arg.getVersion) {
						version = Math.max(version, arg.getVersion(context))
					}
				}
				return version
			},

			getValue: function(context) {
				var results = []
				var args = this.args
				for (var i = 0, l = args.length; i < l; i++) {
					var arg = args[i]
					results[i] = arg && arg.valueOf(context)
				}
				return whenAll(results, function(resolved) {
					return resolved
				})
			}
		})

		// a call variable is the result of a call
		var Call = lang.compose(Composite, function Call(functionVariable, args) {
			this.functionVariable = functionVariable
			this.args = args
		}, {
			forDependencies: function(callback) {
				// depend on the args
				Composite.prototype.forDependencies.call(this, callback)
				callback(this.functionVariable)
			},

			getValue: function(context) {
				var functionValue = this.functionVariable.valueOf(context)
				if (functionValue.then) {
					var call = this
					return functionValue.then(function(functionValue) {
						return call.invoke(functionValue, call.args, context)
					})
				}
				return this.invoke(functionValue, this.args, context)
			},

			getVersion: function(context) {
				// TODO: shortcut if we are live and since equals this.lastUpdate
				return Math.max(Composite.prototype.getVersion.call(this, context), this.functionVariable.getVersion(context))
			},

			execute: function(context) {
				var call = this
				return when(this.functionVariable.valueOf(context), function(functionValue) {
					return call.invoke(functionValue, call.args, context, true)
				})
			},

			put: function(value, context) {
				var call = this
				return when(this.valueOf(context), function(originalValue) {
					if (originalValue === value) {
						return noChange
					}
					return when(call.functionVariable.valueOf(context), function(functionValue) {
						return call.invoke(function() {
							if (functionValue.reverse) {
								functionValue.reverse.call(call, value, call.args, context)
								return Variable.prototype.put.call(call, value, context)
							}else{
								return deny
							}
						}, call.args, context)
					});				
				})
			},
			invoke: function(functionValue, args, context, observeArguments) {
				var instance = this.functionVariable.parent
				if (functionValue.handlesContext) {
					return functionValue.apply(instance, args, context)
				}else{
					var results = []
					for (var i = 0, l = args.length; i < l; i++) {
						var arg = args[i]
						results[i] = arg && arg.valueOf(context)
					}
					instance = instance && instance.valueOf(context)
					if (functionValue.handlesPromises) {
						return functionValue.apply(instance, results, context)
					}else{
						// include the instance in whenAll
						results.push(instance)
						// wait for the values to be received
						return whenAll(results, function(inputs) {
							if (observeArguments) {
								var handles = []
								for (var i = 0, l = inputs.length; i < l; i++) {
									var input = inputs[i]
									if (input && typeof input === 'object') {
										handles.push(observe(input))
									}
								}
								var instance = inputs.pop()
								try{
									var result = functionValue.apply(instance, inputs, context)
								}finally{
									when(result, function() {
										for (var i = 0; i < l; i++) {
											handles[i].done()
										}
									})
								}
								return result
							}
							var instance = inputs.pop()
							return functionValue.apply(instance, inputs, context)
						})
					}
				}
			},
			setReverse: function(reverse) {
				this.functionVariable.valueOf().reverse = reverse
				return this
			}
		})
		Variable.Call = Call

		var ContextualizedVariable = lang.compose(Variable, function ContextualizedVariable(Source, subject) {
			this.constructor = Source
			this.subject = subject
		}, {
			valueOf: function() {
				return this.constructor.valueOf(new Context(this.subject))
			},

			put: function(value) {
				return this.constructor.put(value, new Context(this.subject))
			},
			parentUpdated: function(event, context) {
				// if we receive an outside update, send it to the constructor
				this.constructor.updated(event, this.parent, this.context)
			}
		})


		function arrayMethod(name, sendUpdates) {
			Variable.prototype[name] = function() {
				var args = arguments
				var variable = this
				return when(this.cachedValue || this.valueOf(), function(array) {
					if (!array) {
						variable.put(array = [])
					}
					// try to use own method, but if not available, use Array's methods
					var result = array[name] ? array[name].apply(array, args) : Array.prototype[name].apply(array, args)
					if (sendUpdates) {
						sendUpdates.call(variable, args, result, array)
					}
					return result
				})
			}
		}
		arrayMethod('splice', function(args, result) {
			for (var i = 0; i < args[1]; i++) {
				this.updated({
					type: 'delete',
					previousIndex: args[0],
					oldValue: result[i]
				}, this)
			}
			for (i = 2, l = args.length; i < l; i++) {
				this.updated({
					type: 'add',
					value: args[i],
					index: args[0] + i - 2
				}, this)
			}
		})
		arrayMethod('push', function(args, result) {
			for (var i = 0, l = args.length; i < l; i++) {
				var arg = args[i]
				this.updated({
					type: 'add',
					index: result - i - 1,
					value: arg
				}, this)
			}
		})
		arrayMethod('unshift', function(args, result) {
			for (var i = 0, l = args.length; i < l; i++) {
				var arg = args[i]
				this.updated({
					type: 'add',
					index: i,
					value: arg
				}, this)
			}
		})
		arrayMethod('shift', function(args, results) {
			this.updated({
				type: 'delete',
				previousIndex: 0
			}, this)
		})
		arrayMethod('pop', function(args, results, array) {
			this.updated({
				type: 'delete',
				previousIndex: array.length
			}, this)
		})

		function iterateMethod(method) {
			Variable.prototype[method] = function() {
				return new IterativeMethod(this, method, arguments)
			}
		}

		iterateMethod('filter')
		//iterateMethod('map')

		var IterativeMethod = lang.compose(Composite, function(source, method, args) {
			this.source = source
			// source.interestWithin = true
			this.method = method
			this.args = args
		}, {
			getValue: function(context) {
				var method = this.method
				var args = this.args
				var variable = this
				return when(this.source.valueOf(context), function(array) {
					if (array && array.forEach) {
						if (variable.dependents) {
							var map = variable.contextMap || (variable.contextMap = new WeakMap())
							var contextualizedVariable
							if (context) {
								if (map.has(context.distinctSubject)) {
									contextualizedVariable = map.get(context.distinctSubject)
								} else {
									map.set(context.distinctSubject, contextualizedVariable = new ContextualizedVariable(variable, context.distinctSubject))
								}
							} else {
								contextualizedVariable = variable
							}
							array.forEach(function(object) {
								registerListener(object, contextualizedVariable)
							})
						}
					} else {
						if (method === 'map'){
							// fast path, and special behavior for map
							return args[0](array)
						}
						// if not an array convert to an array
						array = [array]
					}
					// apply method
					return array[method].apply(array, args)
				})
			},
			updated: function(event, by, context) {
				if (by === this || by && by.constructor === this) {
					return Composite.prototype.updated.call(this, event, by, context)
				}
				var propagatedEvent = event.type === 'refresh' ? event : // always propagate refreshes
					this[this.method + 'Updated'](event, context)
				// TODO: make sure we normalize the event structure
				if (this.dependents && event.oldValue && typeof event.value === 'object') {
					deregisterListener(this)
				}
				if (this.dependents && event.value && typeof event.value === 'object') {
					registerListener(event.value, getDistinctContextualized(this, context))
				}
				if (propagatedEvent) {
					Composite.prototype.updated.call(this, propagatedEvent, by, context)
				}
			},
			filterUpdated: function(event, context) {
				var contextualizedVariable = getDistinctContextualized(this, context)
				if (event.type === 'delete') {
					var index = contextualizedVariable.cachedValue.indexOf(event.oldValue)
					if (index > -1) {
						contextualizedVariable.splice(index, 1)
					}
				} else if (event.type === 'add') {
					if ([event.value].filter(this.args[0]).length > 0) {
						contextualizedVariable.push(event.value)
					}
				} else if (event.type === 'update') {
					var index = contextualizedVariable.cachedValue.indexOf(event.object)
					var matches = [event.object].filter(this.args[0]).length > 0
					if (index > -1) {
						if (matches) {
							return {
								type: 'updated',
								object: event.object,
								index: index
							}
						} else {
							contextualizedVariable.splice(index, 1)
						}
					}	else {
						if (matches) {
							contextualizedVariable.push(event.object)
						}
						// else nothing mactches
					}
					return
				} else {
					return event
				}
			},
			mapUpdated: function(event) {
				return {
					type: event.type,
					value: [event.value].map(this.args[0])
				}
			},
			forDependencies: function(callback) {
				// depend on the args
				Composite.prototype.forDependencies.call(this, callback)
				callback(this.source)
			},
			getVersion: function(context) {
				return Math.max(Composite.prototype.getVersion.call(this, context), this.source.getVersion(context))
			}		
		})


		var getValue
		var GeneratorVariable = Variable.GeneratorVariable = lang.compose(Variable.Composite, function ReactiveGenerator(generator){
			this.generator = generator
			this.args = []
		}, {
			getValue: getValue = function(context, resuming) {
				var lastValue
				var i
				var generatorIterator
				if (resuming) {
					// resuming from a promise
					generatorIterator = resuming.iterator
					i = resuming.i
					lastValue = resuming.value
				} else {
					// a fresh start
					i = 0
					generatorIterator = this.generator()				
				}
				
				var args = this.args
				do {
					var stepReturn = generatorIterator.next(lastValue)
					if (stepReturn.done) {
						return stepReturn.value
					}
					var nextVariable = stepReturn.value
					// compare with the arguments from the last
					// execution to see if they are the same
					if (args[i] !== nextVariable) {
						if (args[i]) {
							args[i].stopNotifies(this)
						}
						// subscribe if it is a variable
						if (nextVariable && nextVariable.notifies) {
							nextVariable.notifies(this)
							this.args[i] = nextVariable
						} else {
							this.args[i] = null
						}
					}
					i++
					lastValue = nextVariable && nextVariable.valueOf(context)
					if (lastValue && lastValue.then) {
						// if it is a promise, we will wait on it
						var variable = this
						// and return the promise so that the getValue caller can wait on this
						return lastValue.then(function(value) {
							return getValue.call(this, context, {
								i: i,
								iterator: generatorIterator,
								value: value
							})
						})
					}
				} while(true)
			}
		})

		var Validating = lang.compose(Caching, function(target) {
			this.target = target
		}, {
			forDependencies: function(callback) {
				Caching.prototype.forDependencies.call(this, callback)
				callback(this.target)
			},
			getVersion: function(context) {
				return Math.max(Variable.prototype.getVersion.call(this, context), this.target.getVersion(context))
			},
			getValue: function(context) {
				var target = this.target
				return target.validate(target, target.schema)
			}
		})

		function validate(target) {
			var schemaForObject = schema(target)
			return new Validating(target, schemaForObject)
		}
		Variable.deny = deny
		Variable.noChange = noChange
		function addFlag(name) {
			Variable[name] = function(functionValue) {
				functionValue[name] = true
			}
		}
		addFlag(Variable, 'handlesContext')
		addFlag(Variable, 'handlesPromises')

		function observe(object) {
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
			return {
				remove: function() {
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

		function all(array) {
			// This is intended to mirror Promise.all. It actually takes
			// an iterable, but for now we are just looking for array-like
			if (array.length > -1) {
				return new Composite(array)
			}
			if (arguments.length > 1) {
				// support multiple arguments as an array
				return new Composite(arguments)
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
		function getForClass(subject, Target) {
			var createInstance = subject.constructor.ownedClasses && subject.constructor.ownedClasses.get(Target)
			if (createInstance) {
				var ownedInstances = subject.ownedInstances || (subject.ownedInstances = new WeakMap())
				var instance = ownedInstances.get(Target)
				if (!instance) {
					ownedInstances.set(Target, instance = createInstance(subject))
					instance.subject = subject
				}
				return instance
			}
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
				throw new TypeError('Accessing a generalized class without context to resolve to an instance, call for(context) (where context is an element or related variable instance) on your variable first')
			}
			var instance = context.subject.constructor.getForClass && context.subject.constructor.getForClass(context.subject, Class) || Class.defaultInstance
			context.distinctSubject = mergeSubject(context.distinctSubject, instance.subject)
			return instance
		}
		// a variable inheritance change goes through its own prototype, so classes/constructor
		// can be used as variables as well
		for (var key in VariablePrototype) {
			Object.defineProperty(Variable, key, Object.getOwnPropertyDescriptor(VariablePrototype, key))
		}
		Variable.valueOf = function(context) {
			// contextualized getValue
			return instanceForContext(this, context).valueOf()
		}
		Variable.setValue = function(value, context) {
			// contextualized setValue
			return instanceForContext(this, context).put(value)
		}
		Variable.getForClass = getForClass
		Variable.generalize = generalizeClass
		Variable.call = Function.prototype.call // restore these
		Variable.apply = Function.prototype.apply
		Variable.extend = function(properties) {
			// TODO: handle arguments
			var Base = this
			function ExtendedVariable() {
				if (this instanceof ExtendedVariable) {
					return Base.apply(this, arguments)
				} else {
					return ExtendedVariable.extend(properties)
				}
			}
			var prototype = ExtendedVariable.prototype = Object.create(this.prototype)
			ExtendedVariable.prototype.constructor = ExtendedVariable
			setPrototypeOf(ExtendedVariable, this)
			for (var key in properties) {
				var descriptor = Object.getOwnPropertyDescriptor(properties, key)
				Object.defineProperty(prototype, key, descriptor)
				Object.defineProperty(ExtendedVariable, key, getGeneralizedDescriptor(descriptor, key, ExtendedVariable))
			}
			if (properties && properties.hasOwn) {
				hasOwn.call(ExtendedVariable, properties.hasOwn)
			}
			return ExtendedVariable
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
		Variable.hasOwn = hasOwn
		Variable.all = all
		Variable.objectUpdated = objectUpdated
		Variable.observe = observe

		return Variable
	}));

/***/ },
/* 3 */
/***/ function(module, exports, __webpack_require__) {

	var __WEBPACK_AMD_DEFINE_FACTORY__, __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;(function (root, factory) { if (true) {
	        !(__WEBPACK_AMD_DEFINE_ARRAY__ = [], __WEBPACK_AMD_DEFINE_FACTORY__ = (factory), __WEBPACK_AMD_DEFINE_RESULT__ = (typeof __WEBPACK_AMD_DEFINE_FACTORY__ === 'function' ? (__WEBPACK_AMD_DEFINE_FACTORY__.apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__)) : __WEBPACK_AMD_DEFINE_FACTORY__), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__))
	    } else if (typeof module === 'object' && module.exports) {
	        module.exports = factory()
	    } else {
	        root.alkali = {lang: factory()}
	    }
	}(this, function () {
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
			when: function(value, callback, errorHandler) {
				return value && value.then ?
					(value.then(callback, errorHandler) || value) : callback(value)
			},
			whenAll: function(inputs, callback) {
				var promiseInvolved
				for(var i = 0, l = inputs.length; i < l; i++) {
					if(inputs[i] && inputs[i].then) {
						promiseInvolved = true
					}
				}
				if(promiseInvolved) {
					// we have asynch inputs, do lazy loading
					return {
						then: function(onResolve, onError) {
							var remaining = 1
							var result
							var readyInputs = []
							var lastPromiseResult
							for(var i = 0; i < inputs.length; i++) {
								var input = inputs[i]
								remaining++
								if(input && input.then) {
									(function(i, previousPromiseResult) {
										lastPromiseResult = input.then(function(value) {
											readyInputs[i] = value
											onEach()
											if(!remaining) {
												return result
											}else{
												return previousPromiseResult
											}
										}, onError)
									})(i, lastPromiseResult)
								}else{
									readyInputs[i] = input
									onEach()
								}
							}
							onEach()
							function onEach() {
								remaining--
								if(!remaining) {
									result = onResolve(callback(readyInputs))
								}
							}
							return lastPromiseResult
						},
						inputs: inputs
					}
				}
				// just sync inputs
				return callback(inputs)

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
			}
		}
		return lang
	}));

/***/ },
/* 4 */
/***/ function(module, exports, __webpack_require__) {

	var __WEBPACK_AMD_DEFINE_FACTORY__, __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;(function (root, factory) { if (true) {
	        !(__WEBPACK_AMD_DEFINE_ARRAY__ = [__webpack_require__(3)], __WEBPACK_AMD_DEFINE_FACTORY__ = (factory), __WEBPACK_AMD_DEFINE_RESULT__ = (typeof __WEBPACK_AMD_DEFINE_FACTORY__ === 'function' ? (__WEBPACK_AMD_DEFINE_FACTORY__.apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__)) : __WEBPACK_AMD_DEFINE_FACTORY__), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__))
	    } else if (typeof module === 'object' && module.exports) {
	        module.exports = factory(require('./util/lang'))
	    } else {
	        root.alkali.Updater = factory(root.alkali.lang)
	    }
	}(this, function (lang, Variable) {
		var doc = typeof document !== 'undefined' && document
		var invalidatedElements
		var queued
		var toRender = []
		var nextId = 1
		var requestAnimationFrame = lang.requestAnimationFrame

		function Context(subject){
			this.subject = subject
		}

		function Updater(options) {
			var variable = options.variable

			this.variable = variable
			this.elements = []
			if (options) {
				if (options.selector) {
					this.selector = options.selector
				}
				if (options.elements) {
					this.elements = options.elements
					this.element = this.elements[0]
				}
				if (options.element) {
					this.element = options.element
					this.elements.push(options.element)
				}
				for(var i = 0, l = this.elements.length; i < l; i++) {
					(this.elements[i].alkaliRenderers || (this.elements[i].alkaliRenderers = [])).push(this)
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
			}
			if (variable.updated) {
				// if it has update, we don't need to instantiate a closure
				variable.notifies(this)
			} else {
				// baconjs-esqe API
				var updater = this
				variable.subscribe(function (event) {
					// replace the variable with an object
					// that returns the value from the event
					updater.variable = {
						valueOf: function () {
							return event.value()
						}
					}
					updater.updated()
				})
			}
			if(options && options.updateOnStart !== false){
				this.updateRendering(true)
			}
		}
		Updater.prototype = {
			constructor: Updater,
			updateRendering: function () {
				throw new Error ('updateRendering must be implemented by sub class of Updater')
			},
			updated: function (updateEvent, by, context) {
				if (!this.invalidated) {
					if (!context || this.contextMatches(context)) {
						// do this only once, until we render again
						this.invalidated = true
						var updater = this
						requestAnimationFrame(function(){
							invalidatedElements = null
							updater.updateRendering(updater.alwaysUpdate)
						})
					}
				}
			},
			contextMatches: function(context) {
				return true
				return context == this.elements ||
					// if context is any element in this.elements - perhaps return only the specific matching elements?
					(this.elements.indexOf(context) != -1) ||
				  // (context is an array and any/all elements are contained in this.elements) ||
					// context contains() any of this.elements
					(function(elements) {
						for(var i = 0, l = elements.length; i < l; i++) {
							if (context.contains(elements[i])) return true
						}
						return false
					})(this.elements)
			},
			invalidateElement: function(element) {
				if(!invalidatedElements){
					invalidatedElements = new WeakMap(null, 'invalidated')
					// TODO: if this is not a real weak map, we don't want to GC it, or it will leak
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
				var updater = this
				toRender.push(function(){
					updater.invalidated = false
					updater.updateElement(element)
				})
			},
			getId: function(){
				return this.id || (this.id = nextId++)
			},
			stop: function() {
				this.variable.stopNotifies(this)
			}

		}

		function ElementUpdater(options) {
			Updater.call(this, options)
		}
		ElementUpdater.prototype = Object.create(Updater.prototype)
		ElementUpdater.prototype.shouldRender = function (element) {
			return document.body.contains(element)
		}
		ElementUpdater.prototype.getSubject = function () {
			return this.element || this.elements[0]
		}
		ElementUpdater.prototype.updateRendering = function (always, element) {
			var elements = this.elements || (element && [element]) || []
			if(!elements.length){
				if(this.selector){
					elements = document.querySelectorAll(this.selector)
				}else{
					throw new Error('No element or selector was provided to the Updater')
				}
				return
			}
			for(var i = 0, l = elements.length; i < l; i++){
				if(always || this.shouldRender(elements[i])){
					// it is connected
					this.updateElement(elements[i])
				}else{
					var id = this.getId()
					var updaters = elements[i].updatersOnShow
					if(!updaters){
						updaters = elements[i].updatersOnShow = []
						elements[i].className += ' needs-rerendering'
					}
					if (!updaters[id]) {
						updaters[id] = this
					}
				}
			}
		}
		ElementUpdater.prototype.addElement = function (element) {
			if (this.selector) {
				element.updatersOnShow = [this]
			} else {
				this.elements.push(element)
			}
			// and immediately do an update
			this.updateElement(element)
		}
		ElementUpdater.prototype.updateElement = function(element) {
			this.invalidated = false
			try {
				// TODO: might make something cheaper than for(element) for setting context?
				var value = !this.omitValueOf && this.variable.valueOf(new Context(element))
			} catch (error) {
				element.appendChild(document.createTextNode(error))
			}
			if(value !== undefined || this.started){
				this.started = true
				if(value && value.then){
					if(this.renderLoading){
						this.renderLoading(value, element)
					}
					var updater = this
					value.then(function (value) {
						updater.renderUpdate(value, element)
					})
				}else{
					this.renderUpdate(value, element)
				}
			}
		}
		ElementUpdater.prototype.renderUpdate = function (newValue, element) {
			throw new Error('renderUpdate(newValue) must be implemented')
		}
		Updater.Updater = Updater
		Updater.ElementUpdater = ElementUpdater

		function AttributeUpdater(options) {
			if(options.name){
				this.name = options.name
			}
			ElementUpdater.apply(this, arguments)
		}
		AttributeUpdater.prototype = Object.create(ElementUpdater.prototype)
		AttributeUpdater.prototype.type = 'AttributeUpdater'
		AttributeUpdater.prototype.renderUpdate = function (newValue, element) {
			element.setAttribute(this.name, newValue)
		}
		Updater.AttributeUpdater = AttributeUpdater

		function PropertyUpdater(options) {
			if(options.name){
				this.name = options.name
			}
			ElementUpdater.apply(this, arguments)
		}
		PropertyUpdater.prototype = Object.create(ElementUpdater.prototype)
		PropertyUpdater.prototype.type = 'PropertyUpdater'
		PropertyUpdater.prototype.renderUpdate = function (newValue, element) {
			element[this.name] = newValue
		}
		Updater.PropertyUpdater = PropertyUpdater

		function StyleUpdater(options) {
			if(options.name){
				this.name = options.name
			}
			ElementUpdater.apply(this, arguments)
		}
		StyleUpdater.prototype = Object.create(ElementUpdater.prototype)
		StyleUpdater.prototype.type = 'StyleUpdater'
		StyleUpdater.prototype.renderUpdate = function (newValue, element) {
			element.style[this.name] = newValue
		}
		Updater.StyleUpdater = StyleUpdater

		function ContentUpdater(options) {
			ElementUpdater.apply(this, arguments)
		}
		ContentUpdater.prototype = Object.create(ElementUpdater.prototype)
		ContentUpdater.prototype.type = 'ContentUpdater'
		ContentUpdater.prototype.renderUpdate = function (newValue, element) {
			element.innerHTML = ''
			if (newValue === undefined){
				newValue = ''
			}
			element.appendChild(document.createTextNode(newValue))
		}
		Updater.ContentUpdater = ContentUpdater

		function TextUpdater(options) {
			this.position = options.position
			this.textNode = options.textNode
			ElementUpdater.apply(this, arguments)
		}
		TextUpdater.prototype = Object.create(ElementUpdater.prototype)
		TextUpdater.prototype.type = 'TextUpdater'
		TextUpdater.prototype.renderUpdate = function (newValue, element) {
			if (newValue === undefined){
				newValue = ''
			}
			(this.textNode || element.childNodes[this.position]).nodeValue = newValue
		}
		Updater.TextUpdater = TextUpdater

		function ListUpdater(options) {
			if (options.each) {
				this.each = options.each
			}
			ElementUpdater.apply(this, arguments)
		}
		ListUpdater.prototype = Object.create(ElementUpdater.prototype)
		ListUpdater.prototype.updated = function (updateEvent, context) {
			(this.updates || (this.updates = [])).push(updateEvent)
			ElementUpdater.prototype.updated.call(this, updateEvent, context)
		}
		ListUpdater.prototype.type = 'ListUpdater'
		ListUpdater.prototype.omitValueOf = true
		ListUpdater.prototype.renderUpdate = function (newValue, element) {
			var container
			var each = this.each
			var thisElement = this.elements[0]
			var updater = this
			if (!this.builtList) {
				this.builtList = true
				container = document.createDocumentFragment()
				var childElements = this.childElements = []
				this.variable.for(thisElement).forEach(function(item) {
					eachItem(item)
				})
				this.element.appendChild(container)
			} else {
				var childElements = this.childElements
				var updates = this.updates
				container = this.element
				updates.forEach(function(update) {
					if (update.type === 'refresh') {
						updater.builtList = false
						for (var i = 0, l = childElements.length; i < l; i++) {
							thisElement.removeChild(childElements[i])
						}
						updater.renderUpdate()
					} else {
						if (update.previousIndex > -1) {
							thisElement.removeChild(childElements[update.previousIndex])
							childElements.splice(update.previousIndex, 1)
						}
						if (update.index > -1) {
							var nextChild = childElements[update.index] || null
							eachItem(update.value, update.index, nextChild)
						}
					}
				})
				this.updates = [] // clear the updates
			}
			function eachItem(item, index, nextChild) {
				var childElement
				if (each.create) {
					childElement = each.create({parent: thisElement, _item: item}) // TODO: make a faster object here potentially
				} else {
					childElement = each(item, thisElement)
				}
				if (nextChild) {
					container.insertBefore(childElement, nextChild)
					childElements.splice(index, 0, childElement)
				} else {
					container.appendChild(childElement)
					childElements.push(childElement)
				}
			}
		}
		Updater.ListUpdater = ListUpdater

		Updater.onShowElement = function(shownElement){
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
					var updaters = element.updatersOnShow
					if(updaters){
						element.updatersOnShow = null
						// remove needs-rerendering class
						element.className = element.className.replace(/\s?needs\-rerendering\s?/g, '')
						for (var id in updaters) {
							var updater = updaters[id]
							updater.updateElement(element)
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
		Updater.onElementRemoval = function(element, onlyChildren){
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
		return Updater
	}));

/***/ },
/* 5 */
/***/ function(module, exports, __webpack_require__) {

	var __WEBPACK_AMD_DEFINE_FACTORY__, __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;(function (root, factory) { if (true) {
	        !(__WEBPACK_AMD_DEFINE_ARRAY__ = [__webpack_require__(3), __webpack_require__(2)], __WEBPACK_AMD_DEFINE_FACTORY__ = (factory), __WEBPACK_AMD_DEFINE_RESULT__ = (typeof __WEBPACK_AMD_DEFINE_FACTORY__ === 'function' ? (__WEBPACK_AMD_DEFINE_FACTORY__.apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__)) : __WEBPACK_AMD_DEFINE_FACTORY__), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__))
	    } else if (typeof module === 'object' && module.exports) {
	        module.exports = factory(require('./util/lang'), require('./Variable'))
	    } else {
	        root.alkali.react = factory(root.alkali.lang, root.alkali.Variable)
	    }
	}(this, function (lang, Variable) {

		function react(generator, options) {
			if (options && options.reverse) {
				generator.reverse = options.reverse
			}
			return new Variable.GeneratorVariable(generator)
		}
		return react
	}))

/***/ },
/* 6 */
/***/ function(module, exports, __webpack_require__) {

	var __WEBPACK_AMD_DEFINE_FACTORY__, __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;(function (root, factory) { if (true) {
	        !(__WEBPACK_AMD_DEFINE_ARRAY__ = [__webpack_require__(2)], __WEBPACK_AMD_DEFINE_FACTORY__ = (factory), __WEBPACK_AMD_DEFINE_RESULT__ = (typeof __WEBPACK_AMD_DEFINE_FACTORY__ === 'function' ? (__WEBPACK_AMD_DEFINE_FACTORY__.apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__)) : __WEBPACK_AMD_DEFINE_FACTORY__), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__))
	    } else if (typeof module === 'object' && module.exports) {
	        module.exports = factory(require('./Variable'))
	    } else {
	        root.alkali.operators = factory(root.alkali.Variable)
	    }
	}(this, function (Variable) {
		var deny = Variable.deny;
		var operatingFunctions = {};
		var operators = {};
		function getOperatingFunction(expression){
			// jshint evil: true
			return operatingFunctions[expression] ||
				(operatingFunctions[expression] =
					new Function('a', 'b', 'deny', 'return ' + expression));
		}
		function operator(operator, name, precedence, forward, reverseA, reverseB){
			// defines the standard operators
			var reverse = function(output, inputs){
				var a = inputs[0],
					b = inputs[1];
				if(a && a.put){
					var result = reverseA(output, b && b.valueOf());
					if(result !== deny){
						a.put(result);
					}
				}else if(b && b.put){
					b.put(reverseB(output, a && a.valueOf()));
				}else{
					return deny;
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
					operators[operator] = operatorHandler = new Variable(forward);

					addFlags(operatorHandler);
					args = Array.prototype.slice.call(args);
					args.push(deny)
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
				return operatorHandler.apply(null, arguments)
			}
		}
		// using order precedence from:
		// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Operator_Precedence
		operator('+', 'add', 6, 'a+b', 'a-b', 'a-b');
		operator('-', 'subtract', 6, 'a-b', 'a+b', 'b-a');
		operator('*', 'multiply', 5, 'a*b', 'a/b', 'a/b');
		operator('/', 'divide', 5, 'a/b', 'a*b', 'b/a');
	//	operator('^', 7, 'a^b', 'a^(-b)', 'Math.log(a)/Math.log(b)');
		operator('?', 'if', 16, 'b[a?0:1]', 'a===b[0]||(a===b[1]?false:deny)', '[a,b]');
		operator(':', 'choose', 15, '[a,b]', 'a[0]?a[1]:deny', 'a[1]');
		operator('!', 'not', 4, '!a', '!a', false);
		operator('%', 'remainder', 5, 'a%b');
		operator('>', 'greater', 8, 'a>b');
		operator('>=', 'greaterOrEqual', 8, 'a>=b');
		operator('<', 'less', 8, 'a<b');
		operator('<=', 'lessOrEqual', 8, 'a<=b');
		operator('==', 'equal', 9, 'a===b');
		operator('&', 'and', 8, 'a&&b');
		operator('|', 'or', 8, 'a||b');
		operator('round', 'round', 8, 'Math.round(a*Math.pow(10,b||1))/Math.pow(10,b||1)', 'a', 'a');
		return operators;
	}));

/***/ },
/* 7 */
/***/ function(module, exports, __webpack_require__) {

	var __WEBPACK_AMD_DEFINE_FACTORY__, __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;(function (root, factory) { if (true) {
	        !(__WEBPACK_AMD_DEFINE_ARRAY__ = [__webpack_require__(3), __webpack_require__(2)], __WEBPACK_AMD_DEFINE_FACTORY__ = (factory), __WEBPACK_AMD_DEFINE_RESULT__ = (typeof __WEBPACK_AMD_DEFINE_FACTORY__ === 'function' ? (__WEBPACK_AMD_DEFINE_FACTORY__.apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__)) : __WEBPACK_AMD_DEFINE_FACTORY__), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__))
	    } else if (typeof module === 'object' && module.exports) {
	        module.exports = factory(require('./util/lang'), require('./Variable'))
	    } else {
	        root.alkali.Copy = factory(root.alkali.lang, root.alkali.Variable)
	    }
	}(this, function (lang, Variable) {

		function deepCopy(source, target, derivativeMap) {
			if(source && typeof source == 'object'){
				if(source instanceof Array){
					if(target instanceof Array){
						// truncate as necessary
						if (target.length > source.length) {
							target.splice(source.length, target.length - source.length)
						}
					} else {
						target = derivativeMap && derivativeMap.get(source)
						if (!target) {
							target = []
							derivativeMap && derivativeMap.set(source, target)
						}
					}
					for(var i = 0, l = source.length; i < l; i++){
						target[i] = deepCopy(source[i], target[i], derivativeMap)
					}
				}else {
					if (!target || typeof target !== 'object') {
						target = derivativeMap && derivativeMap.get(source)
						if (!target) {
							target = {}
							derivativeMap && derivativeMap.set(source, target)
						}
					}
					for(var i in source){
						target[i] = deepCopy(source[i], target[i], derivativeMap)
					}
				}
				return target
			}
			return source
		}

		var Copy = lang.compose(Variable, function(copiedFrom){
			// this is the variable that we derive from
			this.copiedFrom = copiedFrom
			this.derivativeMap = new lang.WeakMap(null, 'derivative')
			this.isDirty = new Variable(false)
		}, {
			valueOf: function(context){
				if(this.state){
					this.state = null
				}
				var value = this.copiedFrom.valueOf(context)
				if(value && typeof value == 'object'){
					var derivative = this.derivativeMap.get(value)
					if (derivative == null){
						this.derivativeMap.set(value, derivative = deepCopy(value, undefined, this.derivativeMap))
					}
					return derivative
				}
				var thisValue = this.getValue(context)
				if(thisValue === undefined){
					return value
				}
				return thisValue
			},
			getCopyOf: function(value){
				var derivative = this.derivativeMap.get(value)
				if (derivative == null){
					this.derivativeMap.set(value, derivative = deepCopy(value, undefined, this.derivativeMap))
				}
				return derivative
			},
			save: function(){
				// copy back to the original object
				var original = this.copiedFrom.valueOf()
				var newCopiedFrom = deepCopy(this.valueOf(), original)
				if (original !== newCopiedFrom) {
					// if we have replaced it with a new object/value, put it
					this.copiedFrom.put && this.copiedFrom.put(newCopiedFrom)
				} else {
					// else we have modified an existing object, but we still need to notify
					if (this.copiedFrom.notifies && this.copiedFrom.updated) { // copiedFrom doesn't have to be a variable, it can be a plain object
						this.copiedFrom.updated()
					}
				}
				this.isDirty.put(false)
				this.onSave && this.onSave()
			},
			revert: function(){
				var original = this.copiedFrom.valueOf()
				this.put(deepCopy(original, this.derivativeMap.get(original), this.derivativeMap))
				this.isDirty.put(false)
			},
			updated: function(){
				this.isDirty.put(true)
				return Variable.prototype.updated.apply(this, arguments)
			}
		})
		return Copy
	}));

/***/ }
/******/ ])
});
;