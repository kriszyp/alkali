define(['./Updater', './lang', './Context'], function (Updater, lang, Context) {
	var knownElementProperties = {
	}
	PropertyUpdater = Updater.PropertyUpdater
	TextUpdater = Updater.TextUpdater
	ListUpdater = Updater.ListUpdater
	;['href', 'title', 'role', 'id', 'className'].forEach(function (name) {
		knownElementProperties[name] = true
	})
	var toAddToElementPrototypes = []
	var createdBaseElements = []
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
				if (child.for) {
					// a variable constructor that can be contextualized
					fragment.appendChild(variableAsText(parent, child.for(parent)))
				} else {
					// an element constructor
					childNode = new child()
					fragment.appendChild(childNode)
				}
			} else if (typeof child == 'object') {
				if (child instanceof Array) {
					// array of sub-children
					container = container || parent
					layoutChildren(childNode.contentNode || childNode, child, container)
				} else if (child.subscribe) {
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
				childNode = document.createTextNode(child)
				fragment.appendChild(childNode)
			}
		}
		if (fragment != parent) {
			parent.appendChild(fragment)
		}
	}
	function variableAsText(parent, variable) {
		var childNode = document.createTextNode(variable.valueOf())
		new TextUpdater({
			element: parent,
			textNode: childNode,
			variable: variable
		})
		return childNode
	}

	function getInstanceOf(parent, Class) {

	}
	function renderEach(parent, variable, eachChild) {
		var map = {}
		new Updater({
			element: parent,
			variable: variable,
			updateRendering: function(){
				if (update.existed) {
					var key = update.key
					var element = map[key]
					parent.removeChild(element)
					delete map[key]
				}
				if (!update.deleted) {
					update.value
					var element = eachChild.create()
					parent.insertBefore(element, map[update.before] || null)
					map[key] = element
				}
			}			
		})
	}

	function applyProperties(element, properties, keys) {
		for (var i = 0, l = keys.length; i < l; i++) {
			var key = keys[i]
			var value = properties[key]
			if (value && value.subscribe && key !== 'content') {
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

	function renderContent(content) {
		if (typeof content === 'function' && content.for) {
			content = content.for(this)
		}
		if (this.each) {
			// render as list
			new ListUpdater({
				each: this.each,
				variable: content,
				element: this
			})
		} else if (this.inputValueProperty) {
			// render into input
			this.renderInputContent(content)
		} else {
			// render as string
			var textNode = document.createTextNode(content === undefined ? '' : ('' + content))
			this.appendChild(textNode)
			if (content && content.subscribe) {
				new TextUpdater({
					variable: content,
					element: this,
					textNode: textNode
				})
			}
		}
	}

	function renderInputContent(content) {
		if (content && content.subscribe) {
			// a variable, respond to changes
			new PropertyUpdater({
				variable: content,
				name: this.inputValueProperty,
				element: this
			})
			// and bind the other way as well, updating the variable in response to input changes
			this.addEventListener('change', function (event) {
				content.put(this[this.inputValueProperty])
			})
		} else {
			// primitive
			this[this.inputValueProperty] = content
		}
	}

	function extend(selector, properties) {
		function Element(selector, properties) {
			if (this instanceof Element){
				// create DOM element
				// Need to detect if we have registered the element and `this` is actually already the correct instance
				return create.apply(this.constructor, arguments)
			} else {
				// extend to create new class
				return extend.apply(Element, arguments)
			}
		}
		setPrototypeOf(Element, this)
		var prototype = Element.prototype = Object.create(this.prototype)
		prototype.constructor = Element

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
		var applyOnCreate = Element._applyOnCreate = Object.create(this._applyOnCreate || null)

		for (var l = arguments.length; i < l; i++) {
			var argument = arguments[i]
			if (argument && typeof argument === 'object') {
				if (argument instanceof Array) {
					Element.childrenToRender = argument
				} else if (argument.subscribe) {
					prototype.content = argument
				} else {
					Object.getOwnPropertyNames(argument).forEach(function(key) {
						var descriptor = Object.getOwnPropertyDescriptor(argument, key)
						var onClassPrototype = typeof descriptor.value === 'function' || descriptor.get || descriptor.set
						if (onClassPrototype) {
							Object.defineProperty(prototype, key, descriptor)
						}
						if (!onClassPrototype || key.slice(0, 2) == 'on') {
							if (!(key in applyOnCreate)) {
								var lastLength = applyOnCreate.length || 0
								applyOnCreate[lastLength] = key
								applyOnCreate.length = lastLength + 1
							}
							// TODO: do deep merging of styles and classes, but not variables
							applyOnCreate[key] = descriptor.value
						}
					})
				}
			} else {
				prototype.content = argument
			}
		}
		if (!Element.create) {
			// if we are inheriting from a native prototype, we will create the inherited base static functions
			Element.create = create
			Element.extend = extend
			Element.for = forTarget
			Element.hasOwn = hasOwn
		}
		if (!prototype.renderContent) {
			prototype.renderContent = renderContent
			prototype.renderInputContent = renderInputContent
			prototype.get = getForClass
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
			if (!this.hasOwnProperty('_applyOnCreate')) {
				applyOnCreate = this._applyOnCreate = Object.create(applyOnCreate || null)
				// this means we didn't extend and evaluate the prototype, so we need to at least check the prototype for event handlers
				var keys = Object.getOwnPropertyNames(this.prototype)
				for (var i = 0, l = keys.length; i < l; i++) {
					var key = keys[i]
					if (key.slice(0, 2) == 'on') {
						if (!(key in applyOnCreate)) {
							var lastLength = applyOnCreate.length || 0
							applyOnCreate[lastLength] = key
							applyOnCreate.length = lastLength + 1
						}
						applyOnCreate[key] = this.prototype[key]
					}
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
			parentOrSelector.replace(/(\.|#)?([-\w]+)/g, function(t, operator, name) {
				if (operator == '.') {
					element.className = (element.className ? this.className + ' ' : '') + name
				} else if (operator == '#') {
					element.id = name
				} else {
					throw new Error('Can not assign tag name when directly create an element')
				}
			})
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
		var contentNode = element.contentNode || element
		for (var l = arguments.length; i < l; i++) {
			var argument = arguments[i]
			if (argument instanceof Array) {
				layoutChildren(contentNode, argument, contentNode)
			} else if (argument.subscribe) {
				element.content = argument
			} else {
				applyProperties(element, argument, Object.keys(argument))
			}
		}
		if (element.content) {
			element.renderContent(element.content)
		}
		var classes = this.classes
		if (classes) {
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
				if (flag && flag.subscribe) {
					// if it is a variable, we react to it
					new Updater({
						element: element,
						className: className,
						variable: flag
					})
				} else if (flag || flag === undefined) {
					element.className += ' ' + className
				}
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
		'Video',
		'Source',
		'Media',
		'Audio',
		'Ul',
		'Track',
		'Title',
		'Textarea',
		'Template',
		'Tbody',
		'Thead',
		'Tfoot',
		'Tr',
		'Table',
		'Col',
		'Colgroup',
		'Th',
		'Td',
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
		'Paragraph',
		'Output',
		'Option',
		'Optgroup',
		'Object',
		'Ol',
		'Ins',
		'Del',
		'Meter',
		'Meta',
		'Menu',
		'Map',
		'Link',
		'Legend',
		'Label',
		'Li',
		'Keygen',
		'Image',
		'Iframe',
		'H1',
		'H2',
		'H3',
		'H4',
		'H5',
		'H6',
		'Hr',
		'Frameset',
		'Frame',
		'Form',
		'Font',
		'Embed',
		'Article',
		'Aside',
		'Figure',
		'Figcaption',
		'Header',
		'Main',
		'Mark',
		'Menuitem',
		'Nav',
		'Section',
		'Summary',
		'Wbr',
		'Div',
		'Dialog',
		'Details',
		'Datalist',
		'Dl',
		'Canvas',
		'Button',
		'Base',
		'Br',
		'Area',
		'A'
	])
	generateInputs([
		'Input',
		'Checkbox',
		'Password',
		'Text',
		'Submit',
		'Radio',
		'Color',
		'Date',
		'Datetime',
		'Email',
		'Month',
		'Number',
		'Range',
		'Search',
		'Tel',
		'Time',
		'Url',
		'Week'])

	Element.Textarea.prototype.inputValueProperty = Element.Select.prototype.inputValueProperty = 'value'
	function generate(elements) {
		elements.forEach(function(elementName) {
			var ElementClass
			Object.defineProperty(Element, elementName, {
				get: function() {
					return ElementClass || (ElementClass = augmentBaseElement(extend.call(document.createElement(elementName.toLowerCase()).constructor, elementName.toLowerCase())))
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
					return ElementClass || (ElementClass = augmentBaseElement(extend.call(HTMLInputElement, 'input', {
						type: inputType === 'Input' ? 'Text' : inputType,
						inputValueProperty: inputType in {Date: 1, Datetime: 1, Time: 1} ? 'valueAsDate' : 
							inputType === 'Number' ? 'valueAsNumber' :
							inputType === 'Checkbox' ? 'checked' : 'value'
					})))
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
		Anchor: 'A'
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

	Element.refresh = Updater.refresh
	Element.content = function(element){
		// container marker
		return {
			isContentNode: true,
			create: element.create.bind(element)
		}
	}
	function forTarget(target) {
		return target.get(this)
	}
	function hasOwn(Target, createForInstance) {
		var ownedClasses = this.ownedClasses || (this.ownedClasses = new WeakMap())
		// TODO: assign to super classes
		var Class = this
		ownedClasses.set(Target, createForInstance || function() { return new Class() })
		return this
	}

	var globalInstances = {}
	function getForClass(Target) {
		var element = this
		var createForInstance
		while (element && !(createForInstance = element.constructor.ownedClasses && element.constructor.ownedClasses.get(Target))) {
			element = element.parentNode
		}
		if (!createForInstance) {
			element = globalInstances
			createForInstance = function() { return new Target() }
		}
		var ownedInstances = element.ownedInstances || (element.ownedInstances = new WeakMap())
		var instance = ownedInstances.get(Target)
		if (!instance) {
			ownedInstances.set(Target, instance = createForInstance(element))
		}
		return instance
	}

	function augmentBaseElement(Element) {
		var prototype = Element.prototype
		for(var i = 0, l = toAddToElementPrototypes.length; i < l; i++) {
			var key = toAddToElementPrototypes[i]
			Object.defineProperty(prototype, key, toAddToElementPrototypes[key])
		}
		createdBaseElements.push(Element)
		return Element
	}
	Element.addToElementPrototypes = function(properties) {
		var i = 0;
		for (var key in properties) {
			toAddToElementPrototypes.push(key)
			toAddToElementPrototypes[key] = Object.getOwnPropertyDescriptor(properties, key)
		}
		for(var i = 0, l = createdBaseElements.length; i < l; i++) {
			augmentBaseElement(createdBaseElements[i])
		}
	}
	return Element
})