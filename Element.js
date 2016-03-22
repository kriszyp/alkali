define(['./Variable', './Updater', './lang', './Context'], function (Variable, Updater, lang, Context) {
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
		TEXTAREA: 1
		// SELECT: 1, we exclude this, so the default "content" of the element can be the options
	}
	var bidirectionalProperties = {
		value: 1,
		typedValue: 1,
		valueAsNumber: 1,
		valueAsDate: 1
	}
	function booleanStyle(options) {
		return function(value) {
			if (typeof value === 'boolean') {
				// has a boolean conversion
				return options[value ? 0 : 1]
			}
			return value
		}
	}
	function hasUnit(unit) {
		return function(value) {
			if (typeof value === 'number') {
				return value + unit
			}
			return value
		}
	}
	var px = hasUnit('px')
	function identity(value) {
		return value
	}
	var styleDefinitions = {
		display: booleanStyle(['', 'none']),
		visibility: booleanStyle(['visible', 'hidden']),
		float: identity,
		width: px,
		height: px,
		left: px,
		right: px,
		top: px,
		bottom: px,
		color: identity,
		opacity: identity,
		position: booleanStyle(['absolute', ''])
	}
	var propertyHandlers = {

	}
	var doc = document
	var styleSheet
	var presumptiveParentMap = new WeakMap()

	var setPrototypeOf = Object.setPrototypeOf || (function(base, proto) { base.__proto__ = proto})
	var getPrototypeOf = Object.getPrototypeOf || (function(base) { return base.__proto__ })
	function createCssRule(selector) {
		if (!styleSheet) {
			var styleSheetElement = document.createElement("style")
			styleSheetElement.setAttribute("type", "text/css")
//			styleSheet.appendChild(document.createTextNode(css))
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

	function layoutChildren(parent, children, container) {
		var fragment = children.length > 1 ? document.createDocumentFragment() : parent
		for(var i = 0, l = children.length; i < l; i++) {
			var child = children[i]
			var childNode
			if (child && child.create) {
				// an element constructor
				childNode = child.create(parent)
				fragment.appendChild(childNode)
				if (child.isContentNode) {
					container.contentNode = childNode
				}
			} else if (typeof child == 'function') {
//				if (child.for) {
					// a variable constructor that can be contextualized
	//				fragment.appendChild(variableAsText(parent, child.for(parent)))
		//		} else {
					// an element constructor
					childNode = new child()
					fragment.appendChild(childNode)
			//	}
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
		var childNode = document.createTextNode(variable.valueOf(parent))
		new TextUpdater({
			element: parent,
			textNode: childNode,
			variable: variable
		})
		return childNode
	}

	function applyProperties(element, properties, keys) {
		for (var i = 0, l = keys.length; i < l; i++) {
			var key = keys[i]
			var value = properties[key]
			var styleDefinition = styleDefinitions[key]
			if (styleDefinition) {
				element.style[key] = styleDefinition(value)
			} else if (value && value.subscribe && key !== 'content') {
				new PropertyUpdater({
					name: key,
					variable: value,
					element: element
				})
				if (bidirectionalProperties[key]) {
					bindChanges(element, value)
				}
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
		var each = this.each
		if (each && content) {
			// render as list
			if (each.hasOwn) {
				each.hasOwn(this.itemAs || Item, function (element) {
					return element._item
				})
			}
			if (content.subscribe) {
				new ListUpdater({
					each: each,
					variable: content,
					element: this
				})
			} else {
				var fragment = document.createDocumentFragment()
				var element = this
				content.forEach(function(item) {
					if (each.create) {
						childElement = each.create(element, {_item: item}) // TODO: make a faster object here potentially
					} else {
						childElement = each(item, element)
					}
					fragment.appendChild(childElement)
				})
				this.appendChild(fragment)
			}
		} else if (inputs[this.tagName]) {
			// render into input
			this.renderInputContent(content)
		} else {
			// render as string
			var textNode = document.createTextNode(content === undefined ? '' : (content.valueOf(this)))
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

	function bindChanges(element, variable) {
		element.addEventListener('change', function (event) {
			variable.put(element['typedValue' in element ? 'typedValue' : 'value'])
		})
	}
	function renderInputContent(content) {
		if (content && content.subscribe) {
			// a variable, respond to changes
			new PropertyUpdater({
				variable: content,
				name: 'typedValue' in this ? 'typedValue' : 'value',
				element: this
			})
			// and bind the other way as well, updating the variable in response to input changes
			bindChanges(this, content)
		} else {
			// primitive
			this['typedValue' in this ? 'typedValue' : 'value'] = content
		}
	}

	function applyToClass(value, Element) {
		var applyOnCreate = Element._applyOnCreate
		var prototype = Element.prototype
		if (value && typeof value === 'object') {
			if (value instanceof Array) {
				Element.childrenToRender = value
			} else if (value.subscribe) {
				prototype.content = value
			} else {
				Object.getOwnPropertyNames(value).forEach(function(key) {
					var descriptor = Object.getOwnPropertyDescriptor(value, key)
					var onClassPrototype = typeof descriptor.value === 'function' || descriptor.get || descriptor.set
					if (onClassPrototype) {
						Object.defineProperty(prototype, key, descriptor)
					}
					if (!onClassPrototype || key.slice(0, 2) == 'on') {
						// TODO: eventually we want to be able to set these as rules statically per element
						/*if (styleDefinitions[key]) {
							var styles = Element.styles || (Element.styles = [])
							styles.push(key)
							styles[key] = descriptor.value
						} else {*/
							if (!(key in applyOnCreate)) {
								var lastLength = applyOnCreate.length || 0
								applyOnCreate[lastLength] = key
								applyOnCreate.length = lastLength + 1
							}
							// TODO: do deep merging of styles and classes, but not variables
							applyOnCreate[key] = descriptor.value
						//}
					}
				})
			}
		} else if (typeof value === 'function' && !value.for) {
			Element.initialize = function() {
				var Base = getPrototypeOf(Element)
				if (Base.initialize && !Base._initialized) {
					Base._initialized = true
					Base.initialize()
				}
				applyToClass(value(Element), Element)
			}
		} else {
			prototype.content = value
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

		if (!Element.create) {
			// if we are inheriting from a native prototype, we will create the inherited base static functions
			Element.create = create
			Element.extend = extend
			Element.for = forTarget
			Element.hasOwn = hasOwn
			Element.property = propertyForElement
		}
		if (!prototype.renderContent) {
			prototype.renderContent = renderContent
			prototype.renderInputContent = renderInputContent
			prototype.get = getForClass
			prototype.set = setForClass
		}

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
		Element._applyOnCreate = Object.create(this._applyOnCreate || null)

		for (var l = arguments.length; i < l; i++) {
			applyToClass(arguments[i], Element)
		}
		return Element
	}

	function create(parentOrSelector, properties) {
		// TODO: make this a symbol
		var applyOnCreate = this._applyOnCreate
		var tagName = this._tag
		if (this._initialized != this) {
			this._initialized = this
			this.initialize && this.initialize()
			if (!tagName) {
				throw new Error('No tag name defined for element')
			}
			var styles = this.styles
			if (styles) {
				var rule = createCssRule(getUniqueSelector(this))
				for (var i = 0, l = styles.length; i < l; i++) {
					var key = styles[i]
					var value = styles[key]
					// TODO: if it is a contextualized variable, do this on the element
					var styleDefinition = styleDefinitions[key]
					if (styleDefinition) {
						value = styleDefinition(value)
						rule.style[key] = value
					}
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
			presumptiveParentMap.set(element, parent)
			i++
		}
		if (properties && properties._item) {
			// this is kind of hack, to get the Item available before the properties, eventually we may want to
			// order static properties before variable binding applications, but for now.
			element._item = properties._item
		}
		if (applyOnCreate) {
			applyProperties(element, applyOnCreate, applyOnCreate)
		}
		var childrenToRender
		for (var l = arguments.length; i < l; i++) {
			var argument = arguments[i]
			if (argument instanceof Array) {
				childrenToRender = argument
			} else if (argument.subscribe) {
				element.content = argument
			} else if (typeof argument === 'function' && argument.for) {
				element.content = argument.for(element)
			} else {
				applyProperties(element, argument, Object.keys(argument))
			}
		}
		// TODO: we may want to put these on the instance so it can be overriden
		if (this.childrenToRender) {
			layoutChildren(element, this.childrenToRender, element)
		}
		if (childrenToRender) {
			var contentNode = element.contentNode || element
			layoutChildren(contentNode, argument, contentNode)
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
		return element
	}

	var Element = extend.call(HTMLElement)

	Element.closest = function(element){
		// find closest parent
	}
	Element.find = function(element){
		// find closest child
	}

	var typedValueDescriptor = {
		// TODO: eventually make this a getter/setter
		get: function() {
			var inputType = this.type
			return inputType in {date: 1, datetime: 1, time: 1} ?
				this.valueAsDate :
				inputType === 'number' ?
					parseFloat(this.value) :
					inputType === 'checkbox' ? this.checked : this.value
		},
		set: function(value) {
			var inputType = this.type
			inputType in {date: 1, datetime: 1, time: 1} ?
				this.valueAsDate = value :
				inputType === 'checkbox' ?
					this.checked = value :
					this.value = value
		}
	}
	var typedValuePrototype = Object.create(null, {typedValue: typedValueDescriptor})
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
		'Text',
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
						type: inputType.toLowerCase()
					}, typedValuePrototype)))
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

	Object.defineProperty(Element.TextArea.prototype, 'typedValue', typedValueDescriptor)
	Object.defineProperty(Element.Select.prototype, 'typedValue', typedValueDescriptor)
	var aliases = {
		Anchor: 'A',
		Paragraph: 'P',
		Textarea: 'TextArea',
		DList: 'Dl',
		UList: 'Ul',
		OList: 'Ol',
		ListItem: 'LI',
		Input: 'Text',
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
	function nothing(value) {
	}

	function hasOwn(Target, handleValue) {
		var ownedClasses = this.ownedClasses || (this.ownedClasses = new WeakMap())
		// TODO: assign to super classes
		var Class = this
		ownedClasses.set(Target, handleValue || nothing)
		return this
	}

	var globalInstances = {}
	function getForClass(Target) {
		var element = this
		var handleValue
		while (element && !(handleValue = element.constructor.ownedClasses && element.constructor.ownedClasses.get(Target))) {
			element = element.parentNode || presumptiveParentMap.get(element)
		}
		if (!handleValue) {
			return Target.valueOf()
		}
		var ownedInstances = element.ownedInstances || (element.ownedInstances = new WeakMap())
		var instance = ownedInstances.get(Target)
		if (!instance) {
			ownedInstances.set(Target, instance = handleValue(element))
		}
		return instance
	}
	function setForClass(Target, value) {
		var element = this
		var handleValue
		while (element && !(handleValue = element.constructor.ownedClasses && element.constructor.ownedClasses.get(Target))) {
			element = element.parentNode || presumptiveParentMap.get(element)
		}
		if (!handleValue) {
			return Target.put(value)
		}
		var ownedInstances = element.ownedInstances || (element.ownedInstances = new WeakMap())
		ownedInstances.set(Target, value)
	}

	function propertyForElement(key) {
		// we just need to establish one Variable class for each element, so we cache it
		ThisElementVariable = this._Variable
		if (!ThisElementVariable) {
			// need our own branded variable class for this element class
			ThisElementVariable = this._Variable = Variable.extend()
			// define a relationship
			this.hasOwn(ThisElementVariable, function(element) {
				// when we create the instance, immediately observe it
				// TODO: we might want to do this in init instead
				Variable.observe(element)
				return element
			})
		}
		// now actually get the property class
		return ThisElementVariable.property(key)
	}

	// variable class for each item in array
	var Item = Element.Item = Variable.extend()

	// setup the mutation observer so we can be notified of attachments and removals
	/*var observer = new MutationObserver(function(mutations) {
		mutations.forEach(function(mutation) {
			var addedNodes = mutation.addedNodes
			for (var i = 0, l = addedNodes.length; i < l; i++) {
				var node = addedNodes[i]
				if (node.attached) {
					node.attached()
				}
			}
			var removedNodes = mutation.removedNodes
			for (var i = 0, l = removedNodes.length; i < l; i++) {
				var node = removedNodes[i]
				if (node.detached) {
					node.detached()
				}
			}
		})
	})
	observer.observe(document.body, {
		childList: true
	})*/

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