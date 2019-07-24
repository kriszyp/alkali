(function (root, factory) { if (typeof define === 'function' && define.amd) {
	define(['./util/lang', './Renderer', './Variable'], factory) } else if (typeof module === 'object' && module.exports) {
	module.exports = factory(require('./util/lang'), require('./Renderer'), require('./Variable')) // Node
}}(this, function (lang, Renderer, VariableExports) {
	var Variable = VariableExports.Variable
	var knownElementProperties = [
		'textContent', // Node
		'id', 'className', 'innerHTML', // Element
		'title', 'lang', 'hidden', 'translate', 'dir', 'tabIndex', 'accessKey', 'draggable', 'dropzone', 'spellcheck', 'contentEditable', 'innerText', // HTMLElement
		'translate', 'webkitdropzone'] // HTMLElement

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

	var construct = typeof Reflect !== 'undefined' ? Reflect.construct :
		function(Constructor, args, Class) {
			return Constructor.apply(Object.create(Class.prototype), args)
		}

	var constructOrCall = lang.constructOrCall
	var ClassNameRenderer = lang.compose(Renderer.ElementRenderer, function ClassNameRenderer(options) {
		this.name = options.name
		Renderer.apply(this, arguments)
	}, {
		renderUpdate: function(newValue, element) {
			var currentClassName = element.className
			var changingClassName = this.name
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
	var PropertiesRenderer = lang.compose(Renderer.ElementRenderer, function PropertiesRenderer(options) {
		this.PropertyRenderer = options.PropertyRenderer
		Renderer.apply(this, arguments)
	}, {
		renderUpdate: function(newValue, element) {
			var newProperties = []
			// assign properties based on object properties
			for (var name in newValue) {
				this.PropertyRenderer.prototype.renderUpdate.call({
					name: name
				}, newValue[name], element)
				newProperties.push(name)
			}
			var lastProperties = this.lastProperties
			if (lastProperties) {
				// if previous state existed, remove old names of any properties that don't exist anymore
				for (var i = 0, l = lastProperties.length; i < l; i++) {
					var name = lastProperties[i]
					if (!(name in newValue)) {
						this.PropertyRenderer.prototype.renderUpdate.call({
							name: name
						}, undefined, element)
					}
				}
			}
			this.lastProperties = newProperties // store the class names if we need to remove any on next state change
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

	var canExtendBuiltinElements
	var buggyConstructorSetter = false
	var testElement = doc.createElement('font')
	var originalConstructor = testElement.constructor
	testElement.constructor = function(){}
	if (doc.createElement('font').constructor == testElement.constructor) {
		// In safari, setting the constructor can actually assign it at the prototype level, instead of at the instance
		testElement.__proto__.constructor = originalConstructor // restore the original constructor
		buggyConstructorSetter = true
		lang.buggyConstructorSetter = buggyConstructorSetter
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
	var presumptiveParentMap = new lang.WeakMap()

	var setPrototypeOf = lang.setPrototypeOf
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
		return cssRules[styleSheet.insertRule(selector + ' {}', cssRules.length)]
	}

	// TODO: Need to do some more testing to see if that would improve performance:
	// var fragmentThresholdHeuristic = (typeof navigator !== 'undefined' && navigator.userAgent.indexOf('Chrome') > 0) ? 1 : 3

	function layoutChildren(parent, children, container, prepend) {
		var fragment = (children.length > 1 || prepend) ? doc.createDocumentFragment() : parent
		for(var i = 0, l = children.length; i < l; i++) {
			var child = children[i]
			var childNode
			if (child != null) { // we just skip nulls and undefined, helps make it easier to write conditional element logic
				if (child.notifies) {
					// a variable
					var ref = child.isIterable ? fragment : parent
					fragment.appendChild(childNode = variableAsContent(ref, child))
				} else if (typeof child === 'function') {
					// an element constructor
					currentParent = parent
					childNode = new child()
					fragment.appendChild(childNode)
					if (child.isContentNode) {
						container.contentNode = childNode
					}
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
			if (classes.notifies && classes.put) {
				// it is a variable
				new PropertiesRenderer({
					PropertyRenderer: ClassNameRenderer,
					element: element,
					variable: classes
				})
				return
			}
			var isArray
			if (classes.length > -1) {
				isArray = true
			} else {
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
						name: className,
						variable: flag
					})
				} else if (flag || isArray) {
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
				variable: typeof value === 'function' ? new VariableExports.GeneratorVariable(value.bind(element, properties)) : value, // if it was defined on the constructor, it should already be bound
				element: element
			})
		},
		dataset: applySubProperties(function(newValue, element, key) {
			key = key || this.name
			if (newValue == null) {
				delete element.dataset[key]
			} else {
				element.dataset[key] = newValue
			}
		}),
		attributes: applySubProperties(function(newValue, element, key) {
			AttributeRenderer.prototype.renderUpdate.call({
				name: key || this.name
			}, newValue, element)
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
		},
		_item: function(element, value) {
			setForClass(element, value.constructor, value)
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
		select: lang.copy(['disabled', 'name', 'size', 'type', 'selectedIndex', 'validationMessage'], {
			value: bidirectionalHandler
		}),
		textarea: lang.copy(['cols', 'dirName', 'maxLength', 'minLength', 'name', 'placeholder', 'rows', 'wrap', 'type', 'defaultValue', 'textLength', 'validationMessage', 'autocapitalize'], {
			value: bidirectionalHandler
		}),
		a: ['target', 'download', 'ping', 'rel', 'hreflang', 'type', 'referrerPolicy', 'href', 'media'],
		area: ['target', 'download', 'coords', 'rel', 'hreflang', 'type', 'referrerPolicy', 'href', 'media', 'alt', 'shape'],
		button: ['disabled', 'formAction', 'formEnctype', 'formMethod', 'formTarget', 'name', 'type', 'value', 'validationMessage'],
		details: ['open'],
		dialog: ['open'],
		embed: ['src', 'type', 'name'],
		fieldset: ['disabled', 'form', 'name'],
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
			if (value.notifies && value.put) {
				new PropertiesRenderer({
					PropertyRenderer: SubPropertyRenderer,
					variable: value,
					element: element
				})
				return
			}
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
			} else if (typeof value === 'function' && key.slice(0, 2) === 'on') {
				// event listener
				if (element[key] !== null && !element['_registeredEvent_' + key]) {
					// setup custom event listener
					element['_registeredEvent_' + key] = true
					element.addEventListener(key.slice(2), function(event) {
						this['on' + event.type](event)
					})
				}
				element[key] = value // standard assignment
			} else if (element[key] == null) {
				// we are working an unknown/unstandard property (or a standard/registered event listener)
				// undefined or null means we can safely set
				element[key] = value
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
					hasOwn(each, Item, function (element) {
						var itemVariable = Item.from(element._item)
						return itemVariable
					})
					var ItemClass = content.getCollectionOf && content.getCollectionOf()
					if (ItemClass) {
						// if it is typed, make it available through the typed class as well.
						hasOwn(each, ItemClass, function (element) {
							var itemVariable = ItemClass.from(element._item)
							return itemVariable
						})
					}
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
		} else if (typeof content === 'function' && content.for) {
			// a child constructor
			element = element.contentNode || element
			layoutChildren(element, [content], element)
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
					new Context(element).executeWithin(function() {
						var result = variable.put(conversion ? conversion(value, element) : value)
						if (result === VariableExports.deny) {
							throw new Error('Variable change denied')
						}
					})
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
							if (Element[key]) {
								Object.defineProperty(Element, key, {
									value: value,
									enumerable: true
								})
							} else {
								Element[key] = value
							}
						} else if (isGenerator(value)) {
							if (key.slice(0, 4) === 'get_') {
								key = key.slice(4)
							}
							(applyOnCreate._generators || (applyOnCreate._generators = {}))[key] = value
						}
					} else if (value && value.notifies) {
						// also store any variables as statically available properties
						if (Element[key]) {
							Object.defineProperty(Element, key, {
								value: value,
								enumerable: true
							})
						} else {
							Element[key] = value
						}
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
					if (Element.disallowClassEventHandlers && getPrototypeOf(prototype)[key] === null) {
						throw new Error('Defining event handlers through class methods is not allowed (due to incompatibility with compiled code)')
					}
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
		var map = new lang.WeakMap()
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

	function makeElementConstructor(BaseClass) {
		var isNativeElement = !BaseClass.with // TODO: Create a separate constructor for this
		// this is an optimization to allow consecutive alkali constructors to bypass each other
		if (Object.setPrototypeOf) {
			while (BaseClass.prototype.constructor !== BaseClass && !BaseClass.hasOwnProperty('with')) {
				BaseClass = getPrototypeOf(BaseClass)
			}
		}
		var isNativeClass = Object.getOwnPropertyDescriptor(BaseClass, 'prototype').writable === false
		return constructOrCall(BaseClass, isNativeElement && create, withProperties, isNativeClass)
	}

	function withProperties(selector, properties) {
		var Element = makeElementConstructor(this)
		if (this.with) {
			// TODO: Might consider only doing this for derivatives of derivatives, since we don't need to inherit from base constructors
			// or only doing this in the case of element having custom properties (could mark it with a flag)
			setPrototypeOf(Element, this)
			Element.ownedClasses = null
		} else {
			Element.create = create
			Element.with = withProperties
			Element.defineElement = defineElement
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
		var element = this._ElementClass ?
			construct(this._BaseElementClass || HTMLElement, arguments, this._ElementClass) : // does HTMLElement differ from any other constructors?
			doc.createElement(this.tagName)
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
		var hasArguments = arguments.length > 0
		if (hasArguments || element.created || element.ready) {
			// copy applyOnCreate when we have arguments or method that accepts applyOnCreate
			var ElementApplyOnCreate = applyOnCreate
			applyOnCreate = {}
			for (var key in ElementApplyOnCreate) {
				applyOnCreate[key] = classHandlers[key] ? Object.create(ElementApplyOnCreate[key]) : ElementApplyOnCreate[key]
			}

		}
		if (hasArguments) {
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

	function defineElement(tagSelector, Element) {
		if (!Element) {
			if (typeof tagSelector === 'string') {
				// allow calling as target
				Element = this
			} else {
				// allow optional first param
				return tagSelector.with()
			}
		}
		var extendElement = Element.nativeTagName === undefined ? Element.tagName : Element.nativeTagName
		var selector = tagSelector.match(/[\.\#].+/)
		var tagName = selector ? tagSelector.slice(0, tagSelector.length - (selector = selector[0]).length) : tagSelector
		if (!extendElement) {
			Element.tagName = tagName
		}
		Element.nativeTagName = extendElement || null // regardless of subclassing, want to preserve the original native tag name

		if (typeof customElements === 'object') {
			if (canExtendBuiltinElements === undefined) {
				var TestSupport = function() {}
				customElements.define('alkali-test-support', TestSupport, { extends: 'div' })
				canExtendBuiltinElements = false
				try {
					construct(HTMLDivElement, [], TestSupport)
					canExtendBuiltinElements = true
				} catch (error) {}
			}
			if (!extendElement || canExtendBuiltinElements) {
				try {
					if (Element._ElementClass = customElements.get(tagName)) {
						console.warn('Element', tagName, 'already registered')
					} else {
						customElements.define(tagName, Element, { extends: extendElement })
						Element._ElementClass = Element
						if (extendElement)
							Element._BaseElementClass = customElements.get(extendElement) || doc.createElement(extendElement).constructor
					}
				} catch(error) {
					console.warn(error)
				}
			}
		}
		if (!Element.with) {
			Element.with = withProperties
		}
		return bindElementClass(Element, {
			selector: selector,
			uniqueTag: true
		})
	}

	var Element = setupElement(typeof HTMLElement !== 'undefined' ? HTMLElement : function() {})

	Element.defineElement = defineElement
	Element.assign = function(target, properties) {
		if (typeof target === 'function') {
			// assign properties to an existing constructor/class
			getApplySet(target) // make sure we have our own applyOnCreate first
			applyToConstructor(properties, target)
		} else {
			// assign to an element
			// TODO: Handle content property separately
			var renderers = target.alkaliRenderers
			var startingRenderers = renderers ? renderers.length : 0
			assignProperties(target, properties)
			var endingRenderers = renderers ? renderers.length : 0
			// look for duplicate renderers so overriden renderers can be stopped and removed
			for (var newIndex = startingRenderers; newIndex < endingRenderers; newIndex++) {
				for (var oldIndex = 0; oldIndex < startingRenderers; oldIndex++) {
					if (renderers[oldIndex].isSameProperty(renderers[newIndex])) {
						renderers[oldIndex].stop()
						renderers.splice(oldIndex, 1)
						// adjust the indices
						oldIndex = -1
						startingRenderers--
						endingRenderers--
					}
				}
			}
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
		'FieldSet',
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
		'DT',
		'DD',
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
				setupElement(doc.createElement(tagName).constructor, tagName))
	}

	function setupElement(HTMLConstructor, tagName, type) {
		if (buggyConstructorSetter) {
			// fix safari's broken constructor property
			Object.defineProperty(HTMLConstructor.prototype, 'constructor', {
				get: function() {
					return this._constructor
				},
				set: function(constructor) {
					this._constructor = constructor
				}
			})
			HTMLConstructor.prototype._constructor = HTMLConstructor
		}
		var Element = type ?
			withProperties.call(HTMLConstructor, { type: type }) :
			withProperties.call(HTMLConstructor)
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
		// once https://bugs.chromium.org/p/chromium/issues/detail?id=648828&desc=4 is implemented we can do:
		// Element._HTMLConstructor = HTMLConstructor
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
					return ElementClass || (ElementClass = setupElement(HTMLInputElement, 'input', inputType.toLowerCase()))
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
	Element.content = function(Element){
		// container marker
		function Content() {
			return new Element()
		}
		Content.isContentNode = true
		return Content
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

	function makePreBoundVariable(variable) {
		// once the variable has been bound for the whole collection, we don't want to
		// create a listener for each instance
		return {
			variable: variable,
			then: function(callback, errorHandler) {
				return this.variable.then(callback, errorHandler)
			},
			notifies: function() {}, // noop in this case
			stopNotifies: function() {}
		}
	}

	Element.bindElementClass = bindElementClass
	function bindElementClass(Element, options) {
		options = options || {}
		var applyOnCreate = getApplySet(Element)
		var preBoundProperties = {}
		var propertyHandlers = Element.prototype._propertyHandlers
		var cssRule
		for (var key in applyOnCreate) {
			var value = applyOnCreate[key]
			if (value && value.notifies && propertyHandlers[key] === true) {
				new PropertyRenderer({
					name: key,
					variable: value.collection || value,
					getElements: function() {
						if (options.uniqueTag) {
							return document.getElementsByTagName(BoundElement.tagName)
						}
						return getElementInstances(BoundElement, options.parent)
					}
				})
				preBoundProperties[key] = makePreBoundVariable(value)
			} else if (styleDefinitions[key]) {
				if (value && value.notifies) {
					new StyleRenderer({
						name: key,
						variable: value.collection || value,
						getElements: function() {
							if (options.uniqueTag) {
								return document.getElementsByTagName(BoundElement.tagName)
							}
							return getElementInstances(BoundElement, options.parent)
						}
					})
					preBoundProperties[key] = makePreBoundVariable(value)
				} else {
					cssRule = cssRule || createCssRule(options.uniqueTag ? Element.tagName :
						(Element.tagName + '.' + applyOnCreate.className))
					styleDefinitions[key](cssRule, value, key)
					preBoundProperties[key] = undefined
				}
			} else if (key === 'style' && value && !value.notifies) {
				cssRule = cssRule || createCssRule(options.uniqueTag ? Element.tagName :
					(Element.tagName + '.' + applyOnCreate.className))
				for (var name in value) {
					cssRule.style[name] = value[name]
				}
				preBoundProperties.style = undefined
			}
		}
		if (Element._cssRule && options.uniqueTag) {
			// make the inherited rule apply to this tag too
			Element._cssRule.selectorText += ',' + Element.tagName
		}

		if (Element.children) {
			var newChildren = []
			for (var i = 0; i < Element.children.length; i++) {
				var child = Element.children[i]
				if (child) {
					if (child.notifies) {
						throw new Error('Variables can not be used as child nodes in generalized/bound classes, consider wrapping with a span')
					}
					if (typeof child === 'function') {
						child = bindElementClass(child, {
							parent: options.parent
						})
					}
				}
				newChildren[i] = child
			}
			preBoundProperties.children = newChildren
		}
		var content = applyOnCreate.content
		if (content) {
			if (content.notifies) {
				var renderer = new TextRenderer({
					getElements: function() {
						if (options.uniqueTag) {
							return document.getElementsByTagName(BoundElement.tagName)
						}
						return getElementInstances(BoundElement, options.parent)
					}, // TODO: find main text node
					variable: content.collection || content,
					position: 0
				})
				preBoundProperties.content = makePreBoundVariable(content)
			} else if (content instanceof Array) {
				preBoundProperties.content = content.map(function(child) {
					if (child.notifies) {
						// TODO: Maybe we can support this with position
						throw new Error('Variables can not be used as child nodes in generalized/bound classes, consider wrapping with a span')
					}
					if (typeof child === 'function') {
						child = bindElementClass(child, {
							parent: options.parent
						})
					}
					return child
				})
			}
		}
		var BoundElement = options.selector ? Element.with(options.selector, preBoundProperties) : Element.with(preBoundProperties)
		if (cssRule) {
			BoundElement._cssRule = cssRule
		}
		return BoundElement
	}

	function getElementInstances(Element, parent) {
		var selector = Element.tagName
		var className = Element._applyOnCreate.className
		if (className) {
			selector += '.' + className
		}
		return [].filter.call((parent || document).querySelectorAll(selector), function(element) {
			return element.constructor === Element
		})
	}

	function forTarget(target) {
		return target.constructor.getForClass(target, this)
	}

	function hasOwn(From, Target, createInstance) {
		if (typeof Target === 'object') {
			// we were given an actual instance, use that
			var elementMap = From.ownedClasses || (From.ownedClasses = new lang.WeakMap())
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
		var elementMap = From.ownedClasses || (From.ownedClasses = new lang.WeakMap())
		// TODO: Go up through prototype chain of Target and set each one
		if (!elementMap.has(Target)) {
			var instanceMap = new lang.WeakMap()
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
			var ownedInstances = element.ownedInstances || (element.ownedInstances = new lang.WeakMap())
			var instance = ownedInstances.get(Target)
			if (instance === undefined) {
				ownedInstances.set(Target, instance = createInstance(element))
				instance.subject = element
			}
			return instance
		}
	}

	function setForClass(element, Target, instance) {
		var From = element.constructor
		var ownedClasses = From.ownedClasses || (From.ownedClasses = new lang.WeakMap())
		var instanceMap = ownedClasses.get(Target)
		if (!instanceMap) {
			ownedClasses.set(Target, instanceMap = new lang.WeakMap())
		}
		var ownedInstances = element.ownedInstances || (element.ownedInstances = new lang.WeakMap())
		ownedInstances.set(Target, instance)
		instanceMap.set(element, instance)
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
				renderers[i].restart()
			}
		}
		target.needsRestart = false
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
			if (element.needsRestart) {
				restart(element)
			}
			if (element.attached) {
				element.attached()
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
	if (typeof MutationObserver === 'function') {
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
	} else if (typeof document !== 'undefined') {
		// polling for ancient IE browsers
		setInterval(function() {
			var all = document.all
			var state = lifeStates[1]
			for (var i = 0, l = all.length; i < l; i++) {
				firstVisit(all[i], state)
			}
		}, 300)
	}

	lang.copy(VariableExports.Context.prototype, {
		specify: function(Variable) {
			var element = this.subject
			var distinctive = true
			;(this.generics || (this.generics = [])).push(Variable)
			while (element) {
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
				element = element.parentNode || presumptiveParentMap.get(element)
			}
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

	Element.createElement = function(element, props) {
		props = props || {}
		if (arguments.length > 2)
			props.content = [].slice.call(arguments, 2)
		if (typeof element === 'string')
			element = getConstructor(element)
		if (element.with)
			return element.with(props)
		if (typeof element === 'function')
			return element(props)
		throw Error('Unrecognize element type')
	}

	return Element
}))
