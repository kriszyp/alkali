/******/ (function(modules) { // webpackBootstrap
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

	'use strict';

	var _alkali = __webpack_require__(1);

	var _alkali2 = _interopRequireDefault(_alkali);

	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

	function makeExample(code) {
		var content = new _alkali.Variable(code);
		var Example = (0, _alkali.Div)('.demo', [(0, _alkali.Div)('.demo-contents', [(0, _alkali.H3)('.demo-header', ['EXAMPLE']), (0, _alkali.Textarea)(content, { spellcheck: false }), (0, _alkali.Div)('.output', {
			created: function created(properties) {
				var _this = this;

				properties.code = content.to(function (newCode) {
					var container = _this;
					container.innerHTML = '';
					try {
						container.appendChild(evalWith(newCode, _alkali2.default, container));
					} catch (e) {
						container.textContent = e.message;
					}
				});
			}
		})]), (0, _alkali.Div)('.fade')], {
			onclick: function onclick() {
				this.className += ' active';
			}
		});
		var example = new Example();
		document.body.addEventListener('click', function (event) {
			example.className = example.className.replace(/ active/g, '');
			if (example.contains(event.target)) {
				example.className += ' active';
			}
		});
		return example;
	}
	var examples = document.querySelectorAll('.example');
	for (var i = 0, l = examples.length; i < l; i++) {
		var example = examples[i];
		var code = example.textContent;
		example.parentNode.replaceChild(makeExample(code), example);
	}

/***/ },
/* 1 */
/***/ function(module, exports, __webpack_require__) {

	var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;/// <reference path="./index.d.ts" />
	if (true) {
	!(__WEBPACK_AMD_DEFINE_ARRAY__ = [__webpack_require__(2), __webpack_require__(3), __webpack_require__(6), __webpack_require__(5), __webpack_require__(7), __webpack_require__(8)], __WEBPACK_AMD_DEFINE_RESULT__ = function(Element, Variable, react, Renderer, operators, Copy) {
		var main = Object.create(Element)
		main.Copy = Copy
		main.Element = Element
		main.Variable = Variable
		main.VMap = Variable.VMap
		main.VArray = Variable.VArray
		main.VPromised = Variable.VPromised
		main.all = Variable.all
		main.react = react
		main.spawn = function(func) {
			return react(func).valueOf()
		}
		main.Renderer = Renderer
		Object.assign(main, Renderer)
		Object.assign(main, operators)
		return main
	}.apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__))
	} else if (typeof module === 'object' && module.exports) {
		// delegate to the built UMD file, if loaded in node
		module.exports = (require)('./dist/index')
	}

/***/ },
/* 2 */
/***/ function(module, exports, __webpack_require__) {

	var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;!(__WEBPACK_AMD_DEFINE_ARRAY__ = [__webpack_require__(3), __webpack_require__(5), __webpack_require__(4)], __WEBPACK_AMD_DEFINE_RESULT__ = function (Variable, Renderer, lang) {
		var knownElementProperties = {};
		['textContent', 'innerHTML', 'title', 'href', 'value', 'valueAsNumber', 'role', 'render'].forEach(function(property) {
			knownElementProperties[property] = true
		})

		var SELECTOR_REGEX = /(\.|#)([-\w]+)(.+)?/
		var isGenerator = lang.isGenerator
		var Context = Variable.Context
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
		
		var toAddToElementPrototypes = []
		var createdBaseElements = []
		var doc = typeof document !== 'undefined' ? document : {
			createElement: function(tag) {
				return {}
			},
			addEventListener: function() {
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
				doc.head.insertBefore(styleSheetElement, doc.head.firstChild)
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
						fragment.appendChild(childNode = variableAsContent(parent, child))
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
				new TextRenderer({
					element: parent,
					textNode: textNode,
					variable: content
				})
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
			content: noop, // content and children have special handling in create
			children: noop,
			tagName: noop,
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
			for: applyAttribute,
			role: applyAttribute,
			render: function(element, value, key, properties) {
				// TODO: This doesn't need to be a property updater
				// we should also verify it is a generator
				// and maybe, at some point, find an optimization to eliminate the bind()
				new PropertyRenderer({
					name: key,
					variable: new Variable.GeneratorVariable(value.bind(element, properties)),
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
					new AttributeRenderer({
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
				var target = element[key]
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
			for (var key in properties) {
				var value = properties[key]
				var styleDefinition = styleDefinitions[key]
				if (propertyHandlers[key]) {
					propertyHandlers[key](element, value, key, properties)
				} else if ((styleDefinition = styleDefinitions[key]) && element[key] === undefined) {
					if (value && value.notifies) {
						new StyleRenderer({
							name: key,
							variable: value,
							element: element
						})
					} else {
						styleDefinition(element, value, key)
					}
				} else if (value && value.notifies) {
					new PropertyRenderer({
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
						if (result === Variable.deny) {
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
			Element.tagName = this.tagName
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
					if (argument && typeof argument === 'object') {
						if (argument instanceof Array || argument.notifies) {
							applyOnCreate.content = argument
						} else {
							for (var key in argument) {
								// TODO: do deep merging of styles and classes, but not variables
								applyOnCreate[key] = argument[key]
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
			if (this.children) {
				layoutChildren(element, this.children, element)
			}
			// always do this last, so it can be properly inserted inside the children
			if (applyOnCreate.content) {
				buildContent(element, applyOnCreate.content, 'content', applyOnCreate)
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

		function registerTag(tagName) {
			this.tagName = tagName
			if (doc.registerElement && this.prototype.constructor === this) {
				doc.registerElement(tagName, this)
			}
		}

		var Element = withProperties.call(typeof HTMLElement !== 'undefined' ? HTMLElement : function() {})

		Element.registerTag = registerTag
		Element.assign = assignProperties

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
		Element.refresh = Renderer.refresh
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
			var instanceMap = new WeakMap()
			instanceMap.createInstance = createInstance
			var elementMap = From.ownedClasses || (From.ownedClasses = new WeakMap())
			elementMap.set(Target, instanceMap)
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
					// TODO: we might want to do this in init instead
					var variableProperties = {}
					for (var i = 0; i < element.alkaliRenderers.length; i++){
						var renderer = element.alkaliRenderers[i]
						if (renderer.name) {
							variableProperties[renderer.name] = {value: renderer.variable}
						}
					}

					var elementOverlay = Object.create(element, variableProperties)
					var instance = new ThisElementVariable(elementOverlay)
					// we are not observing, because you can't delegate getters and setters in safari
					// instance.observeObject()
					return instance
				})
			}
			// now actually get the property class
			return ThisElementVariable.property(key)
		}

		var Item = Element.Item = Variable.Item

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
			var docBody = doc.body
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
					if (docBody.contains(node)) {
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
			observer.observe(docBody, {
				childList: true,
				subtree: true
			})
		}
		
		lang.copy(Variable.Context.prototype, {
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
			  if (!this.distinctSubject || this.distinctSubject.contains(childContext.distinctSubject)) {
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
	}.apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__))


/***/ },
/* 3 */
/***/ function(module, exports, __webpack_require__) {

	var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;!(__WEBPACK_AMD_DEFINE_ARRAY__ = [__webpack_require__(4)], __WEBPACK_AMD_DEFINE_RESULT__ = function (lang) {
		var deny = {}
		var noChange = {}
		var WeakMap = lang.WeakMap
		var setPrototypeOf = Object.setPrototypeOf || (function(base, proto) { base.__proto__ = proto})
		var getPrototypeOf = Object.getPrototypeOf || (function(base) { return base.__proto__ })
		// update types
		var ToParent = 2
		var RequestChange = 3
		var RequestSet = 4
		
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

		function when(value, callback) {
			if (value && value.then) {
				return value.then(callback)
			}
			return callback(value)
		}

		function Context(subject){
			this.subject = subject
			this.inputs = []
		}
		Context.prototype = {
			constructor: Context,
			newContext: function(variable) {
				return new Context(this.subject)
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
						var inputs = this.inputs
						for (var i = 0, l = inputs.length; i < l; i++) {
							contextualized[inputs[i]] = inputs[++i]
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
				parentContext.addInput(contextualized)
				return contextualized
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

				// returns a variable that has already been contextualized
				var instance = variable._contextMap && this.subject && variable._contextMap.get(this.subject)
				if (instance && instance.context && instance.context.matches(this)) {
					return instance
				}
			},
			addInput: function(inputVariable) {
				this.inputs.push(this.nextProperty, inputVariable)
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

		function whenAll(inputs, callback){
			var promiseInvolved
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

		function forPropertyNotifyingValues(properties, callback) {
			for (var key in properties) {
				var property = properties[key]
				if (property.returnedVariable) {
					callback(property.returnedVariable)
				}
				if (property.hasChildNotifiers) {
					var subProperties = property._properties
					if (subProperties) {
						forPropertyNotifyingValues(subProperties, callback)
					}
				}
			}
		}

		function Variable(value) {
			if (this instanceof Variable) {
				// new call, may eventually use new.target
				this.value = typeof value === 'undefined' ? this.default : value
			} else {
				return Variable.extend(value)
			}
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
			valueOf: function(context) {
				var valueContext
				return this.gotValue(this.getValue ?
					this.getValue(context && (valueContext = context.newContext())) :
					this.value, context, valueContext)
			},
			gotValue: function(value, parentContext, context) {
				var previousNotifyingValue = this.returnedVariable
				var variable = this
				if (previousNotifyingValue) {
					if (value === previousNotifyingValue) {
						// nothing changed, immediately return valueOf (or ownObject if we have it)
						if (variable.ownObject) {
							return variable.ownObject
						}
						if (parentContext) {
							if (!context) {
								context = parentContext.newContext()
							}
							context.contextualize(this, parentContext)
							context.nextProperty = 'returnedVariable'
							return value.valueOf(context)
						} else {
							return value.valueOf()
						}
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
					/*var parent = variable
					do {
						if (parent.listeners) {
							// the value is another variable, start receiving notifications, if we, or any parent is live
							variable.returnedVariable.notifies(variable)
							break
						}
						parent.hasNotifyingChild = true
					} while((parent = parent.parent))*/
					context = context || parentContext && (context = parentContext.newContext())
					if (context) {
						context.nextProperty = 'returnedVariable'
					}
					value = value.valueOf(context)
					if (variable.ownObject) {
						if (getPrototypeOf(variable.ownObject) !== value) {
							setPrototypeOf(variable.ownObject, value)
						}
						value = variable.ownObject
					}
				}
				if (value === undefined) {
					value = variable.default
				}
				if (context) {
					context.contextualize(this, parentContext)
				}
				if (parentContext) {

					/*if (!contextualized.listeners) {
						// mark it as initialized, since we have already recursively dependended on inputs
						contextualized.listeners = []
					}*/

					if (!context) {
						parentContext.addInput(this)
					}				
				}
				if (value && value.then) {
					return when(value, function(value) {
						return Variable.prototype.gotValue.call(variable, value, context)
					})
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
				return new ContextualizedVariable(this, subject || defaultContext)
			},
			_propertyChange: function(propertyName, object, context, type) {
				if (this.onPropertyChange) {
					this.onPropertyChange(propertyName, object, context)
				}
				this.updated(new PropertyChangeEvent(propertyName, new RefreshEvent(), this), null, context)
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
				if (this.returnedVariable) {
					callback(this.returnedVariable)
				}
				if (this.hasNotifyingChild) {
					var properties = this._properties
					if (properties) {
						forPropertyNotifyingValues(properties, callback)
					}
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
				if (returnedVariable) {
					// TODO: move this into the caching class
					this.computedVariable = null
				}
				var variable = this
				this.forDependencies(function(dependency) {
					dependency.stopNotifies(variable)
				})
			},

			updateVersion: function(version) {
				this.version = nextId++
			},

			getVersion: function(context) {
				return Math.max(this.version || 0, this.returnedVariable && this.returnedVariable.getVersion ? this.returnedVariable.getVersion(context) : 0)
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

			updated: function(updateEvent, by, context) {
				if (!updateEvent) {
					updateEvent = new RefreshEvent()
				}
				if (updateEvent.visited.has(this)){
					// if this event has already visited this variable, skip it
					return
				}
				updateEvent.visited.add(this)
				var contextualInstance = context ? context.getContextualized(this) : this
				if (contextualInstance) {
					contextualInstance.updated(updateEvent, this, context)
				}
				/*
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
				this.updateVersion()
				var value = this.value

				var listeners = this.listeners
				if (listeners) {
					var variable = this
					// make a copy, in case they change
					listeners.forEach(function(dependent) {
						if ((updateEvent instanceof PropertyChangeEvent) &&
								(dependent instanceof Property)) {
							if (dependent.key === updateEvent.key) {
								dependent.updated(updateEvent.childEvent, variable, context)
							}
						} else {
							dependent.updated(updateEvent, variable, context)
						}
					})
				}
				if (updateEvent instanceof PropertyChangeEvent) {
					if (this.returnedVariable && this.fixed) {
						this.returnedVariable.updated(updateEvent, this, context)
					}
					if (this.constructor.collection) {
						this.constructor.collection.updated(updateEvent, this, context)
					}
				}
				return updateEvent
			},

			invalidate: function() {
				// for back-compatibility for now
				this.updated()
			},

			notifies: function(target) {
				var listeners = this.listeners
				if (!listeners || !this.hasOwnProperty('listeners')) {
					this.listeners = listeners = new Set()
					this.init()
				}
				listeners.add(target)
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
					listeners.delete(dependent)
					if (listeners.size === 0) {
						// clear the listeners so it will be reinitialized if it has
						// listeners again
						this.cleanup()
					}
				}
			},
			put: function(value, context) {
				var variable = this
				if (this.ownObject) {
					this.ownObject = false
				}		
				return when(this.getValue ? this.getValue(context) : this.value, function(oldValue) {
					if (variable.__debug) {
						// _debug _debug is on
						console.log('Variable changed from', oldValue, newValue, 'at')
						console.log((new Error().stack || '').replace(/Error/, ''))
					}
					if (oldValue === value) {
						return noChange
					}
					if (variable.fixed &&
							// if it is set to fixed, we see we can put in the current variable
							oldValue && oldValue.put) {
						return oldValue.put(value)
					}
					return when(variable.setValue(value, context), function(value) {
						variable.updated(new RefreshEvent(), variable, context)
					})
				})
			},
			get: function(key) {
				if (this._properties && this._properties[key]) {
					return this.property(key).valueOf()
				}
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
				this.property(key)._changeValue(null, RequestSet, value)
			},
			undefine: function(key, context) {
				this.set(key, undefined, context)
			},
			proxy: function(proxiedVariable) {
				var thisVariable = this
				this.fixed = true
				return when(this.setValue(proxiedVariable), function(value) {
					thisVariable.updated(new RefreshEvent(), thisVariable)
				})
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
				this.value = value
			},
			onValue: function(listener) {
				return this.subscribe(function(event) {
					lang.when(event.value(), function(value) {
						listener(value)
					})
				})
			},
			toJSON: function() {
				return this.valueOf()
			},
			toString: function() {
				return this.valueOf()
			},
			forEach: function(callbackOrItemClass, callbackOrContext, context) {
				// iterate through current value of variable
				if (callbackOrItemClass.notifies) {
					var collectionVariable = this
					return this.forEach(function(item) {
						var itemVariable = callbackOrItemClass.from(item)
						callbackOrContext.call(this, itemVariable)
					}, context)
				}
				return when(this.valueOf(callbackOrContext), function(value) {
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
						reverse.call(this, args[0], context)
					}
				}
				return new Call(transformFunction, [this])
			},
			get schema() {
				// default schema is the constructor
				return this.returnedVariable ? this.returnedVariable.schema : this.constructor
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
				if (schema && schema.type && (schema.type !== typeof target)) {
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
				return this.constructor.collectionOf
			},
			_willModify: function(context) {
				// an intent to modify, so we need to make sure we have our own copy
				// of an object when necessary
				if (this.fixed) {
					if (this.value && this.value._willModify) {
						return this.value._willModify(context)
					}
				}
				if (!this.ownObject && this.value && this.value.notifies) {
					var variable = this
					return when(this.valueOf(context), function(value) {
						if (value && typeof value === 'object') {
							if (value instanceof Array) {
								variable.ownObject = value.slice(0)
							} else {
								variable.ownObject = Object.create(value)
							}
						}
					})
				}
			},
			_sN: function(name) {
				// for compilers to set a name
				this.name = name
				return this
			},
			get _debug() {
				if (this.__debug === undefined) {
					this.__debug = true
				}
				return this.__debug
			},
			set _debug(_debug) {
				this.__debug = _debug
			},
			// TODO: Move these to VArray
			splice: function(startingIndex, removalCount) {
				var args = arguments
				return arrayToModify(this, function(array) {
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
		}

		function arrayToModify(variable, callback) {
			variable._willModify()
			// TODO: switch this to allow promises
			when(variable.cachedValue || variable.valueOf(), function(array) {
				if (!array) {
					variable.put(array = [])
				}
				variable.updateVersion()
				var results = callback.call(variable, array)
				variable.cachedVersion = variable.version // update the cached version so it doesn't need to be recomputed
				return results
			})
		}

		function insertedAt(variable, added, startingIndex, arrayLength) {
			var addedCount = added.length
			// adjust the key positions of any index properties after splice
			if (addedCount > 0) {
				if (variable._properties) {
					var arrayPosition
					for (var i = arrayLength - addedCount; i > startingIndex;) {
						var arrayPosition = variable._properties[--i]
						if (arrayPosition) {
							variable._properties[i] = undefined
							arrayPosition.key += addedCount
							variable._properties[arrayPosition.key] = arrayPosition
						}
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
				if (variable._properties) {
					for (var i = startingIndex + removalCount; i < arrayLength + removalCount; i++) {
						var arrayPosition = variable._properties[i]
						if (arrayPosition) {
							variable._properties[i] = undefined
							arrayPosition.key -= removalCount
							variable._properties[arrayPosition.key] = arrayPosition
						}
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
				return this.valueOf()[Symbol.iterator]()
			}
		}

		Variable.VMap = lang.compose(Variable, function(value){
			this.value = typeof value === 'undefined' ? this.default : value
		}, {
			// TODO: Move all the get and set functionality for maps out of Variable
			property: function(key) {
				var properties = this._properties || (this._properties = new Map())
				var propertyVariable = properties.get(key)
				if (!propertyVariable) {
					// create the property variable
					propertyVariable = new Property(this, key)
					properties.set(key, propertyVariable)
				}
				return propertyVariable
			}
		})

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
				var contextualizedVariable = this
				if (context) {
					contextualizedVariable = context.getContextualized(this)
					if (!contextualizedVariable && this.context && this.context.matches(context)) {
						contextualizedVariable = this
					}
				}
				if (contextualizedVariable && contextualizedVariable.cachedVersion === contextualizedVariable.getVersion()) {
					if (context) {
						context.addInput(contextualizedVariable)
					}
					return contextualizedVariable.cachedValue
				}			

				var variable = this
				function withComputedValue(computedValue) {
					if (computedValue && computedValue.notifies && variable.listeners) {
						variable.computedVariable = computedValue
					}
					computedValue = variable.gotValue(computedValue, context, transformContext)
					var contextualizedVariable = transformContext && transformContext.contextualized || variable
					contextualizedVariable.cachedVersion = newVersion
					contextualizedVariable.cachedValue = computedValue
					contextualizedVariable.context = transformContext
					return computedValue
				}

				var transformContext
				if (context) {
					transformContext = context.newContext()
				}
				var newVersion = this.getVersion()
				var computedValue = this.getValue(transformContext)
				if (computedValue && computedValue.then) {
					// call it initially so the dependencies can be registered
					this.gotValue(null, context, transformContext)
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
				if (context) {
					var propertyContext = context.newContext()
					propertyContext.nextProperty = 'parent'
				}
				var key = this.key
				var property = this
				var object = this.parent.valueOf(propertyContext)
				function gotValueAndListen(object) {
					var value = property.gotValue(object == null ? undefined : typeof object.get === 'function' ? object.get(key) : object[key], context, propertyContext)
					if (property.listeners) {
						var listeners = propertyListenersMap.get(object)
						if (listeners && listeners.observer && listeners.observer.addKey) {
							listeners.observer.addKey(key)
						}
					}
					return value
				}
				if (object && object.then) {
					// call it initially so the dependencies can be registered
					this.gotValue(null, context, propertyContext)
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
				if (updateEvent = Variable.prototype.updated.call(this, updateEvent, by, context)) {
					this.parent.updated(new PropertyChangeEvent(this.key, updateEvent, this.parent), this, context)
				}
			},
			for: function(subject) {
				return this.parent.for(subject).property(this.key)
			},
			_changeValue: function(context, type, newValue) {
				var key = this.key
				var parent = this.parent
				var variable = this
				parent._willModify(context)
				return when(parent.valueOf(context), function(object) {
					if (object == null) {
						// nothing there yet, create an object to hold the new property
						var response = parent.put(object = typeof key == 'number' ? [] : {}, context)
					} else if (typeof object != 'object') {
						// if the parent is not an object, we can't set anything (that will be retained)
						return deny
					}
					var oldValue = typeof object.get === 'function' ? object.get(key) : object[key]
					if (oldValue === newValue) {
						// no actual change to make
						return noChange
					}
					if (variable.__debug) {
						// debug is on
						console.log('Variable changed from', oldValue, newValue, 'at')
						console.log((new Error().stack || '').replace(/Error/, ''))
					}
					if (typeof object.set === 'function') {
						object.set(key, newValue)
					} else {
						if (type == RequestChange && oldValue && oldValue.put) {
							// if a put and the property value is a variable, assign it to that.
							oldValue.put(newValue)
						} else {
							object[key] = newValue
							// or set the setter/getter
						}
					}
					variable.updated(null, variable, context)

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
								listener._propertyChange(key, object, context, type)
							}
						}
					}
				})
			},
			_willModify: function() {
				this.parent._willModify()
				return Variable.prototype._willModify.call(this)
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

		var Item = Variable.Item = lang.compose(Variable, function Item(value, content) {
			this.value = value
			this.collection = content
		}, {})

		var Composite = Variable.Composite = lang.compose(Caching, function Composite(args) {
			for (var i = 0, l = args.length; i < l; i++) {
				this['argument' + i] = args[i]
			}
		}, {
			forDependencies: function(callback) {
				// depend on the args
				Caching.prototype.forDependencies.call(this, callback)
				var argument, argumentName
				for (var i = 0; (argument = this[argumentName = 'argument' + i]) || argumentName in this; i++) {
					if (argument && argument.notifies) {
						callback(argument)
					}
				}
			},

			updated: function(updateEvent, by, context) {
				if (by !== this.returnedVariable && updateEvent && updateEvent.type !== 'refresh') {
					// search for the output in the inputs
					var argument, argumentName
					for (var i = 0; (argument = this[argumentName = 'argument' + i]) || argumentName in this; i++) {
						if (argument === by) {
							// if one of the args was updated, we need to do a full refresh (we can't compute differential events without knowledge of how the mapping function works)
							updateEvent = new RefreshEvent()
							continue
						}
					}
				}
				return Caching.prototype.updated.call(this, updateEvent, by, context)
			},

			getUpdates: function(since) {
				// this always issues updates, nothing incremental can flow through it
				if (!since || since.version < getVersion()) {
					return [new RefreshEvent()]
				}
			},

			getVersion: function(context) {
				var version = Variable.prototype.getVersion.call(this, context)
				var argument, argumentName
				for (var i = 0; (argument = this[argumentName = 'argument' + i]) || argumentName in this; i++) {
					if (argument && argument.getVersion) {
						version = Math.max(version, argument.getVersion(context))
					}
				}
				return version
			},

			getValue: function(context) {
				var results = []
				var argument, argumentName
				for (var i = 0; (argument = this[argumentName = 'argument' + i]) || argumentName in this; i++) {
					if (context) {
						context.nextProperty = argumentName
					}
					results[i] = argument && argument.valueOf(context)
				}
				return whenAll(results, function(resolved) {
					return resolved
				})
			},
			getArguments: function() {
				var args = []
				var argument, argumentName
				for (var i = 0; (argument = this[argumentName = 'argument' + i]) || argumentName in this; i++) {
					args.push(argument)
				}
				return args
			}
		})

		// a call variable is the result of a call
		var Call = lang.compose(Composite, function Transform(transform, args) {
			this.transform = transform
			for (var i = 0, l = args.length; i < l; i++) {
				this['argument' + i] = args[i]
			}
		}, {
			fixed: true,
			forDependencies: function(callback) {
				// depend on the args
				Composite.prototype.forDependencies.call(this, callback)
				if (this.transform.notifies) {
					callback(this.transform)
				}
			},

			getValue: function(context) {
				if (context) {
					context.nextProperty = 'transform'
				}
				var functionValue = this.transform.valueOf(context)
				if (functionValue.then) {
					var call = this
					return functionValue.then(function(functionValue) {
						return call.invoke(functionValue, context)
					})
				}
				return this.invoke(functionValue, context)
			},

			getVersion: function(context) {
				// TODO: shortcut if we are live and since equals this.lastUpdate
				var argsVersion = Composite.prototype.getVersion.call(this, context)
				if (this.transform.getVersion) {
					return Math.max(argsVersion, this.transform.getVersion(context))
				}
				return argsVersion
			},

			execute: function(context) {
				var call = this
				return when(this.transform.valueOf(context), function(functionValue) {
					return call.invoke(functionValue, context, true)
				})
			},

			put: function(value, context) {
				var call = this
				return when(this.valueOf(context), function(originalValue) {
					if (originalValue === value) {
						return noChange
					}
					return when(call.transform.valueOf(context), function(functionValue) {
						return call.invoke(function() {
							if (functionValue.reverse) {
								functionValue.reverse.call(call, value, call.getArguments(), context)
								return Variable.prototype.put.call(call, value, context)
							} else if (originalValue && originalValue.put) {
								return originalValue.put(value)
							} else {
								return deny
							}
						}, context)
					});				
				})
			},
			invoke: function(functionValue, context, observeArguments) {
				var instance = this.transform.parent
				if (functionValue.handlesVariables || functionValue.property) {
					return functionValue.apply(instance, this.getArguments(), context)
				}else{
					var results = []
					var argument, argumentName
					for (var i = 0; (argument = this[argumentName = 'argument' + i]) || argumentName in this; i++) {
						if (context) {
							context.nextProperty = argumentName
						}
						results[i] = argument && argument.valueOf(context)
					}
					instance = instance && instance.valueOf(context)
					if (functionValue.handlesPromises) {
						return functionValue.apply(instance, results, context)
					} else {
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
				this.transform.valueOf().reverse = reverse
				return this
			},
			getCollectionOf: function() {
				return this.returnedVariable && this.returnedVariable.getCollectionOf()
			}
		})
		Variable.Call = Call

		var ContextualizedVariable = lang.compose(Variable, function ContextualizedVariable(generic, subject) {
			this.generic = generic
			this.subject = subject
		}, {
			valueOf: function() {
				// TODO: Lookup Context type for all of these using registry or something
				var subject = this.subject
				return this.generic.valueOf(subject.getContextualized ? subject : new Context(subject))
			},

			forDependencies: function(callback) {
				this.inputs && this.inputs.forEach(callback)
			},

			getVersion: function() {
				var version = Variable.prototype.getVersion.call(this)
				var inputs = this.inputs || 0
				for (var i = 0, l = inputs.length; i < l; i++) {
					var input = inputs[i]
					if (input.getVersion) {
						version = Math.max(version, input.getVersion())
					}
				}
				return version
			},

			put: function(value) {
				var subject = this.subject
				return this.generic.put(value, subject.getContextualized ? subject : new Context(subject))
			}
		})


		function iterateMethod(method) {
			Variable.prototype[method] = function() {
				return new IterativeMethod(this, method, arguments)
			}
		}

		iterateMethod('filter')
		iterateMethod('map')
		iterateMethod('reduce')
		iterateMethod('reduceRight')
		iterateMethod('some')
		iterateMethod('every')
		iterateMethod('slice')
		
		var IterativeMethod = lang.compose(Composite, function(source, method, args) {
			this.source = source
			// source.interestWithin = true
			this.method = method
			this.arguments = args
		}, {
			getValue: function(context) {
				var method = this.method
				var args = this.arguments
				var variable = this
				if (context) {
					context.nextProperty = 'source'
				}
				return when(this.source.valueOf(context), function(array) {
					if (array && array.forEach) {
						if (context && context.notify) {
							var contextualizedVariable
							if (context.distinctSubject) {
								var contextMap = variable._contextMap || (variable._contextMap = new WeakMap())
								if (contextMap.has(context.distinctSubject)) {
									contextualizedVariable = contextMap.get(context.distinctSubject)
								} else {
									contextMap.set(context.distinctSubject, contextualizedVariable = Object.create(variable))
									contextualizedVariable.listeners = false
								}
							} else {
								contextualizedVariable = variable
							}
							variable.notifies(contextualizedVariable)
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
				if (!event || event.modifier === this || (event.modifier && event.modifier.constructor === this)) {
					return Composite.prototype.updated.call(this, event, by, context)
				}
				var propagatedEvent = event.type === 'refresh' ? event : // always propagate refreshes
					this[this.method + 'Updated'] ? this[this.method + 'Updated'](event, context) : // if we have an updated handler, use it
					new RefreshEvent() // else recompute the array method
				// TODO: make sure we normalize the event structure
				if (propagatedEvent) {
					Composite.prototype.updated.call(this, propagatedEvent, by, context)
				}
			},
			filterUpdated: function(event, context) {
				var contextualizedVariable = context ? context.getContextualized(this) : this
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
					var object = event.parent.valueOf(context)
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
					return event
				}
			},
			mapUpdated: function(event, context) {
				var contextualizedVariable = context ? context.getContextualized(this) : this
				if (event.type === 'delete') {
					contextualizedVariable.splice(event.previousIndex, 1)
				} else if (event.type === 'add') {
					contextualizedVariable.push(this.arguments[0].call(this.arguments[1], event.value))
				} else if (event.type === 'update') {
					var object = event.parent.valueOf(context)
					var array = contextualizedVariable.cachedValue
					if (array && array.map) {
						var index = array.indexOf(object)
						var matches = [object].filter(this.arguments[0]).length > 0
						contextualizedVariable.splice(index, 1, this.arguments[0].call(this.arguments[1], event.value))
					} else {
						return event
					}
				} else {
					return event
				}
			},
			// TODO: Create specialized updated handlers for faster recomputation of other array derivatives
			forDependencies: function(callback) {
				// depend on the args
				Composite.prototype.forDependencies.call(this, callback)
				callback(this.source)
			},
			getVersion: function(context) {
				return Math.max(Composite.prototype.getVersion.call(this, context), this.source.getVersion(context))
			},
			getCollectionOf: function(){
				return this.source.getCollectionOf()
			}
		})


		var getValue
		var GeneratorVariable = Variable.GeneratorVariable = lang.compose(Variable.Composite, function ReactiveGenerator(generator){
			this.generator = generator
		}, {
			getValue: getValue = function(context, resuming) {
				var lastValue
				var i
				var generatorIterator
				var isThrowing
				if (resuming) {
					// resuming from a promise
					generatorIterator = resuming.iterator
					i = resuming.i
					lastValue = resuming.value
					isThrowing = resuming.isThrowing
				} else {
					// a fresh start
					i = 0
					generatorIterator = this.generator()				
				}

				do {
					var stepReturn = generatorIterator[isThrowing ? 'throw' : 'next'](lastValue)
					if (stepReturn.done) {
						return stepReturn.value
					}
					var nextVariable = stepReturn.value
					// compare with the arguments from the last
					// execution to see if they are the same
					var argumentName = 'argument' + i
					if (this[argumentName] !== nextVariable) {
						if (this[argumentName]) {
							this[argumentName].stopNotifies(this)
						}
						// subscribe if it is a variable
						if (nextVariable && nextVariable.notifies) {
							if (this.listeners) {
								nextVariable.notifies(this)
							}
							this[argumentName] = nextVariable
						} else {
							this[argumentName] = null
						}
					}
					i++
					if (context) {
						context.nextProperty = argumentName
					}
					lastValue = nextVariable && nextVariable.valueOf(context)
					if (lastValue && lastValue.then) {
						// if it is a promise, we will wait on it
						var variable = this
						// and return the promise so that the getValue caller can wait on this
						return lastValue.then(function(value) {
							return getValue.call(variable, context, {
								i: i,
								iterator: generatorIterator,
								value: value
							})
						}, function(error) {
							return getValue.call(variable, context, {
								i: i,
								iterator: generatorIterator,
								value: error,
								isThrowing: true
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
				// need to actually access the target value, so it can be evaluated in case it
				// there is a returned variable that we should delegate to.
				target.valueOf(context)
				return target.validate(target, target.schema)
			}
		})

		function validate(target) {
			var schemaForObject = schema(target)
			return new Validating(target, schemaForObject)
		}
		Variable.VArray = Variable
		Variable.VPromised = Variable
		Variable.deny = deny
		Variable.noChange = noChange
		function addFlag(name) {
			Variable[name] = function(functionValue) {
				functionValue[name] = true
			}
		}
		addFlag(Variable, 'handlesContext')
		addFlag(Variable, 'handlesPromises')

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
				return Class.defaultInstance
			}
			return context.specify(Class)
	//		var instance = context.subject.constructor.getForClass && context.subject.constructor.getForClass(context.subject, Class) || Class.defaultInstance
	//		context.distinctSubject = mergeSubject(context.distinctSubject, instance.subject)
	//		return instance
		}
		// a variable inheritance change goes through its own prototype, so classes/constructor
		// can be used as variables as well
		for (var key in VariablePrototype) {
			Object.defineProperty(Variable, key, Object.getOwnPropertyDescriptor(VariablePrototype, key))
		}
		Variable.valueOf = function(context) {
			// contextualized getValue
			return instanceForContext(this, context).valueOf(context)
		}
		Variable.put = function(value, context) {
			// contextualized setValue
			return instanceForContext(this, context).put(value, context)
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
		Variable.updated = function(updateEvent, by, context) {
			return instanceForContext(this, context).updated(updateEvent, by, context)
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
		Variable.Context = Context
		Variable.NotifyingContext = NotifyingContext
		Variable.generalize = generalizeClass
		Variable.call = Function.prototype.call // restore these
		Variable.apply = Function.prototype.apply
		Variable.extend = function(properties) {
			// TODO: handle arguments
			var Base = this
			function ExtendedVariable() {
				if (this instanceof ExtendedVariable) {
					Base.apply(this, arguments)
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
		Variable.hasOwn = function(Target, createInstance) {
			var instanceMap = new WeakMap()
			instanceMap.createInstance = createInstance
			var subjectMap = this.ownedClasses || (this.ownedClasses = new WeakMap())
			subjectMap.set(Target, instanceMap)
		}
		Variable.all = all
		Variable.objectUpdated = objectUpdated
		
		return Variable
	}.apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__))

/***/ },
/* 4 */
/***/ function(module, exports, __webpack_require__) {

	var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;!(__WEBPACK_AMD_DEFINE_ARRAY__ = [], __WEBPACK_AMD_DEFINE_RESULT__ = function () {
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
		function isGenerator(func) {
			if (typeof func === 'function') {
				var constructor = func.constructor
				return (constructor.displayName || constructor.name) === 'GeneratorFunction'
			}
		}
		lang.isGenerator = isGenerator
		return lang
	}.apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__))

/***/ },
/* 5 */
/***/ function(module, exports, __webpack_require__) {

	var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;!(__WEBPACK_AMD_DEFINE_ARRAY__ = [__webpack_require__(4), __webpack_require__(3)], __WEBPACK_AMD_DEFINE_RESULT__ = function (lang, Variable) {
		var doc = typeof document !== 'undefined' && document
		var invalidatedElements
		var queued
		var toRender = []
		var nextId = 1
		var requestAnimationFrame = lang.requestAnimationFrame
		var Context = Variable.Context

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
			if (variable.updated) {
				// if it has update, we don't need to instantiate a closure
				if (options.updateOnStart === false) {
					variable.notifies(this)
				}
			} else {
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
			if (options.updateOnStart !== false){
				this.updateRendering(true)
			}
		}
		Renderer.prototype = {
			constructor: Renderer,
			updateRendering: function () {
				throw new Error ('updateRendering must be implemented by sub class of Renderer')
			},
			updated: function (updateEvent, by, context) {
				if (!this.invalidated) {
					if (!context || this.contextMatches(context)) {
						// do this only once, until we render again
						this.invalidated = true
						var renderer = this
						requestAnimationFrame(function(){
							invalidatedElements = null
							renderer.updateRendering(renderer.alwaysUpdate)
						})
					}
				}
			},
			newContext: function() {
				return new Variable.Context(this.element)
			},
			addInput: function(variable) {
				this.contextualized = variable
			},
			getContextualized: function() {
				return this.contextualized
			},
			specify: function(Variable) {
				// a new context to get thsi
				return this.newContext().specify(Variable)
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
			try {
				if (!this.omitValueOf) {
					var value = this.variable.valueOf(this)
					var contextualized = this.contextualized || this.variable
					// TODO: we may need to handle recontextualization if it returns a promise
					contextualized.notifies(this)
				}
			} catch (error) {
				element.appendChild(document.createTextNode(error))
			}
			if(value !== undefined || this.started || this.omitValueOf){
				this.started = true
				if(value && value.then){
					if(this.renderLoading){
						this.renderLoading(value, element)
					}
					var renderer = this
					value.then(function (value) {
						renderer.renderUpdate(value, element)
					})
				}else{
					this.renderUpdate(value, element)
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
			element[this.name] = newValue
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
				container = document.createDocumentFragment()
				var childElements = this.childElements = []
				if (each.defineHasOwn) {
					each.defineHasOwn()
				}
				newValue.forEach(function(item) {
					eachItem(item)
				})
				var contextualized = this.contextualized || this.variable
				contextualized.notifies(this)

				thisElement.appendChild(container)
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
					if (childElement.create) {
						childElement = childElement.create({parent: thisElement, _item: item})
					}
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
	}.apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__))

/***/ },
/* 6 */
/***/ function(module, exports, __webpack_require__) {

	var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;!(__WEBPACK_AMD_DEFINE_ARRAY__ = [__webpack_require__(4), __webpack_require__(3), __webpack_require__(7)], __WEBPACK_AMD_DEFINE_RESULT__ = function (lang, Variable, operators) {

	  var isGenerator = lang.isGenerator
	  var ObjectTransform = lang.compose(Variable.Call, function ObjectTransform(transform, inputs) {
	    this.inputs = inputs
	    Variable.Call.apply(this, arguments)
	  }, {
	    _getAsObject: function() {
	      return this.transform.apply(this, preserveObjects(this.inputs))
	    }
	  })
	  function preserveObjects(inputs) {
	    for (var i = 0, l = inputs.length; i < l; i++) {
	      var input = inputs[i]
	      if (input && input._getAsObject) {
	        inputs[i] = input._getAsObject()
	      }
	    }
	    return inputs
	  }
		function react(generator, options) {
	    if (typeof generator !== 'function') {
	      throw new Error('react() must be called with a generator. You need to use the babel-plugin-transform-alkali plugin if you want to use reactive expressions')
	    }
			if (options && options.reverse) {
				generator.reverse = options.reverse
			}
			return new Variable.GeneratorVariable(generator)
		}
	  Object.assign(react, operators)
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
	    return new Variable.Call(target, args)
	  }
	  react.mcall = function(target, key, args) {
	    var method = target[key]
	    if (typeof method === 'function' && method.property || key === 'bind') {
	      // for now we check to see if looks like it could handle a variable, or is a bind call
	      return method.apply(target, preserveObjects(args))
	    }
	    return new Variable.Call(target[key].bind(target), args)
	  }
	  react.ncall = function(target, args) {
	    if (target.property && typeof target === 'function') {
	      return new (target.bind.apply(target, [null].concat(preserveObjects(args))))()
	    }
	    return new Variable.Call(function() {
	      return new (target.bind.apply(target, [null].concat(arguments)))()
	    }, args)
	  }

	  react.obj = function(transform, inputs) {
	    return new ObjectTransform(transform, inputs)
	  }

		return react
	}.apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__))

/***/ },
/* 7 */
/***/ function(module, exports, __webpack_require__) {

	var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;!(__WEBPACK_AMD_DEFINE_ARRAY__ = [__webpack_require__(3)], __WEBPACK_AMD_DEFINE_RESULT__ = function (Variable) {
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
		operator('===', 'looseEqual', 9, 'a===b');
		operator('==', 'equal', 9, 'a==b');
		operator('&', 'and', 8, 'a&&b');
		operator('|', 'or', 8, 'a||b');
		operator('round', 'round', 8, 'Math.round(a*Math.pow(10,b||1))/Math.pow(10,b||1)', 'a', 'a');
		return operators;
	}.apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__))

/***/ },
/* 8 */
/***/ function(module, exports, __webpack_require__) {

	var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;!(__WEBPACK_AMD_DEFINE_ARRAY__ = [__webpack_require__(4), __webpack_require__(3)], __WEBPACK_AMD_DEFINE_RESULT__ = function (lang, Variable) {

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
			valueOf: function(context) {
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
				var thisValue = this.getValue ? this.getValue(context) : this.value
				if(thisValue === undefined) {
					return value
				}
				return thisValue
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
			revert: function() {
				var original = this.copiedFrom.valueOf()
				this.put(deepCopy(original, this.derivativeMap.get(original), this.derivativeMap))
				this.isDirty.put(false)
			},
			updated: function() {
				this.isDirty.put(true)
				return Variable.prototype.updated.apply(this, arguments)
			}
		})
		return Copy
	}.apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__))

/***/ }
/******/ ]);
//# sourceMappingURL=bundle.js.map