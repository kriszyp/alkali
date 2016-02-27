define(['./Updater', './lang', './Context'], function (Updater, lang, Context) {
	var knownElementProperties = {
	}
	PropertyUpdater = Updater.PropertyUpdater
	TextUpdater = Updater.TextUpdater
	;['href', 'title', 'role', 'id', 'className'].forEach(function (name) {
		knownElementProperties[name] = true
	})
	var testStyle = document.createElement('div').style
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
		TEXTAREA: 1,
		SELECT: 1
	}
	var doc = document
	var cssRules

	var setPrototypeOf = Object.setPrototypeOf || (function(base, proto) { base.__proto__ = proto})
	function createCssRule(selector) {
		if (!cssRules) {
			var styleSheet = document.createElement("style")
			styleSheet.setAttribute("type", "text/css")
			styleSheet.appendChild(document.createTextNode(css))
			document.head.insertBefore(styleSheet, document.head.firstChild)
			cssRules = styleSheet.cssRules || styleSheet.rules
		}
		var ruleNumber = cssRules.length
		return styleSheet.addRule(selector, ' ', ruleNumber)
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

	function layoutChildren(parent, children, container) {
		var fragment = children.length > 1 ? document.createDocumentFragment() : parent
		for(var i = 0, l = children.length; i < l; i++) {
			var child = children[i]
			var childNode
			if (child && child.create) {
				// an element constructor
				childNode = child.create(fragment)
				if (child.isContentNode) {
					container.contentNode = childNode
				}
			} else if (typeof child == 'function') {
				// an element constructor
				childNode = new child()
				fragment.appendChild(childNode)
			} else if (typeof child == 'object') {
				if (child instanceof Array) {
					// array of sub-children
					container = container || parent
					layoutChildren(childNode, child, container)
				} else if (child.notifies) {
					// a variable
					childNode = document.createTextNode(child.valueOf())
					fragment.appendChild(childNode)
					new TextUpdater({
						element: parent,
						textNode: childNode,
						variable: child
					})
				} else {
					throw new Error('Unknown child type ' + child)
				}
			} else {
				// a primitive value
				childNode = document.createTextNode(child)
				fragment.appendChild(childNode)
			}
		}
		if (fragment != parent) {
			parent.appendChild(fragment)
		}
	}

	function applyProperties(element, properties, keys) {
		for (var i = 0, l = keys.length; i < l; i++) {
			var key = keys[i]
			var value = properties[key]
			if (value && value.notifies) {
				new PropertyUpdater({
					name: key,
					variable: value,
					element: element
				})
			} else if (key.slice(0, 2) === 'on') {
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

	function extend(selector, properties) {
		function Element(selector, properties) {
			if (this instanceof Element){
				// create DOM element
				// Need to detect if we have registered the element and `this` is actually already the correct instance
				return create.apply(Element, arguments)
			} else {
				// extend to create new class
				return extend.apply(Element, arguments)
			}
		}
		setPrototypeOf(Element, this)
		var prototype = Element.prototype = Object.create(this.prototype)

		var i = 0 // for arguments
		if (typeof selector === 'string') {
			selector.replace(/(\.|#)?([-\w]+)/g, function(t, operator, name) {
				if (operator == '.') {
					Element._class = (Element._class ? Element._class + ' ' : '') + name
				} else if (operator == '#') {
					Element._id = name
				} else {
					Element._tag = name
				}
			})

			i++ // skip the first argument
		}
		var applyOnCreate

		for (var l = arguments.length; i < l; i++) {
			var argument = arguments[i]
			if (argument instanceof Array) {
				Element.childrenToRender = argument
			} else {
				var base = this
				Object.getOwnPropertyNames(argument).forEach(function(key) {
					var descriptor = Object.getOwnPropertyDescriptor(argument, key)
					var onClassPrototype = typeof descriptor.value === 'function' || descriptor.get || descriptor.set
					if (onClassPrototype) {
						Object.defineProperty(prototype, key, descriptor)
					}
					if (!onClassPrototype || key.slice(0, 2) == 'on') {
						if (!applyOnCreate){
							applyOnCreate = Element._applyOnCreate = Object.create(base._applyOnCreate || null)
						}
						applyOnCreate[key] = descriptor.value
						var lastLength = applyOnCreate.length || 0
						applyOnCreate[lastLength] = key
						applyOnCreate.length = lastLength + 1
					}
				})
			}
		}
		if (!Element.create) {
			// if we are inheriting from a native prototype, we will create the inherited base static functions
			Element.create = create
			Element.extend = extend
		}
		return Element
	}

	function create(parentOrSelector, properties) {
		// TODO: make this a symbol
		var applyOnCreate = this._applyOnCreate
		var tagName = this._tag
		if (this._initialized != this) {
			this._initialized = this
			if (!tagName) {
				throw new Error('No tag name defined for element')
			}
			var styles = this.styles
			if (styles) {
				var rule = createCssRule(getUniqueSelector(this))
				for (var key in styles) {
					rule.style[key] = styles[key]
				}
			}
			if (tagName.indexOf('-') > -1) {
				document.registerElement(tagName, this)
			}
		}
		var element = document.createElement(tagName)
		setPrototypeOf(element, this.prototype)
		if (this._id) {
			element.id = this._id
		}
		if (this._class) {
			element.className = this._class
		}
		var i = 0
		var parent
		if (typeof parentOrSelector == 'string') {
			i++
			if (operator == '.') {
				element.className = (element.className ? this.className + ' ' : '') + name
			} else if (operator == '#') {
				element.id = name
			} else {
				throw new Error('Can not assign tag name when directly create an element')
			}
		} else if (parentOrSelector && parentOrSelector.appendChild) {
			parent = parentOrSelector
			i++
		}
		if (applyOnCreate) {
			applyProperties(element, applyOnCreate, applyOnCreate)
		}
		// TODO: we may want to put these on the instance so it can be overriden
		if (this.childrenToRender) {
			layoutChildren(element, this.childrenToRender, element)
		}
		for (var l = arguments.length; i < l; i++) {
			var argument = arguments[i]
			if (argument instanceof Array) {
				var contentNode = element.contentNode || element
				layoutChildren(contentNode, argument, contentNode)
			} else {
				applyProperties(element, argument, Object.keys(argument))
			}
		}
		element.createdCallback && element.createdCallback()
		element.created && element.created()
		if (parent) {
			parent.appendChild(element)
			element.attachedCallback && element.attachedCallback()
			element.attached && element.attached()
		}
		return element
	}

	var Element = extend.call(HTMLElement)

	Element.prototype.closest = function(element){
		// find closest parent
	}
	Element.prototype.find = function(element){
		// find closest child
	}
	generate([
		'video',
		'source',
		'media',
		'audio',
		'ul',
		'track',
		'title',
		'textarea',
		'template',
		'tbody',
		'thead',
		'tfoot',
		'tr',
		'table',
		'col',
		'colgroup',
		'th',
		'td',
		'caption',
		'style',
		'span',
		'shadow',
		'select',
		'script',
		'quote',
		'progress',
		'pre',
		'picture',
		'param',
		'paragraph',
		'output',
		'option',
		'optgroup',
		'object',
		'ol',
		'ins',
		'del',
		'meter',
		'meta',
		'menu',
		'map',
		'link',
		'legend',
		'label',
		'li',
		'keygen',
		'input',
		'image',
		'iframe',
		'h1',
		'h2',
		'h3',
		'h4',
		'h5',
		'h6',
		'hr',
		'frameset',
		'frame',
		'form',
		'font',
		'embed',
		'article',
		'aside',
		'figure',
		'figcaption',
		'header',
		'main',
		'mark',
		'menuitem',
		'nav',
		'section',
		'summary',
		'wbr',
		'div',
		'dialog',
		'details',
		'datalist',
		'dl',
		'canvas',
		'button',
		'base',
		'br',
		'area',
		'a'
	])
	generateInputs(['checkbox',
		'password',
		'text',
		'submit',
		'radio',
		'color',
		'date',
		'datetime',
		'email',
		'month',
		'number',
		'range',
		'search',
		'tel',
		'time',
		'url',
		'week'])

	function generate(elements) {
		elements.forEach(function(tagName) {
			var ElementClass
			Object.defineProperty(Element, tagName, {
				get: function() {
					return ElementClass || (ElementClass = extend.call(document.createElement(tagName).constructor, tagName))
				}
			})
		})
	}
	function generateInputs(elements) {
		elements.forEach(function(inputType) {
			var ElementClass
			Object.defineProperty(Element, inputType, {
				get: function() {
					return ElementClass || (ElementClass = extend.call(HTMLInputElement, 'input', {type: inputType}))
				}
			})
		})
	}
	Element.refresh = Updater.refresh
	Element.content = function(element){
		// container marker
		return {
			isContentNode: true,
			create: element.create.bind(element)
		}
	}
	return Element
})