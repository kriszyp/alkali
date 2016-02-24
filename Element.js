define(['./Updater', './lang', './Context'], function (Updater, lang, Context) {
	var knownElementProperties = {
	}
	['href', 'title', 'role', 'id', 'className'].forEach(function (name) {
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
	var baseDefinitions = {
		class: {
			is: function (className) {
				return {
					for: function(context) {
						var elementType = context.get('type')
						elementType.selector += '.' + className
					}
				}
			}
		}
	}

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

	classToTag = {
		Anchor: 'a',
		UList: 'ul',
		OList: 'ol',
		DList: 'dl'
	}

	function getClassName(Class) {
		return Class.name || Class.toString().match(/function ([_\w]+)\(/)[0]
	}
	function getTagName(BaseClass) {
		var className = (BaseClass.name || BaseClass.toString().slice(0,30)).match(/HTML(\w+)Element/)
		if (className) {
			var tagName = className[1]
			return classToTag[tagName] || tagName
		}
		// try with the base class
		return getTagName(Object.getPrototypeOf(BaseClass))
	}


	function layoutChildren(parent, children, container) {
		for(var i = 0, l = children.length; i < l; i++) {
			var child = children[i]
			var childNode
			if (typeof child == 'string') {
				childNode = document.createTextNode(child)
			} else if (child instanceof Array) {
				container = container || parent
				layoutChildren(childNode, child, container)
				if (child.isContentNode) {
					container.contentNode = childNode
				}
			} else if (child.create) {
				childNode = child.create(parent)
			}
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

	function extend(properties) {
		function Element(properties) {
			if (this instanceof Element){
				// create DOM element
				return create.apply(this, arguments)
			} else {
				// extend to create new class
				return extend.apply(this, arguments)
			}
		}
		setPrototypeOf(Element, this)
		var prototype = Element.prototype = Object.create(this.prototype)
		var applyOnCreate
		for (var i = 0, l = arguments.length; i < l; i++) {
			var argument = arguments[i]
			if (argument instanceof Array) {
				prototype.childrenToRender = argument
			} else {
				var base = this
				Object.getOwnPropertyNames(properties).forEach(function(key) {
					var descriptor = Object.getOwnPropertyDescriptor(properties, key)
					var onClassPrototype = typeof descriptor.value === 'function' || descriptor.get || descriptor.set
					if (onClassPrototype) {
						Object.defineProperty(prototype, key, descriptor)
					}
					if (!onClassPrototype || key.slice(0, 2) == 'on') {
						if (!applyOnCreate){
							applyOnCreate = Element._applyOnCreate = Object.create(base._applyOnCreate || null)
						}
						applyOnCreate[key] = descriptor.value
						applyOnCreate[applyOnCreate.length = applyOnCreate.length + 1 || 0] = key
					}
				})
			}
		}
		if (!Element.create) {
			// if we are inheriting from a native prototype, we will create the inherited base static functions
			Element.create = create
			Element.extend = extend
		}
	}

	function create(properties) {
		// TODO: make this a symbol
		var applyOnCreate = this._applyOnCreate
		var tagName = this.tagName || applyOnCreate.tagName
		if (this._initialized != this) {
			this._initialized = this
			var styles = this.styles
			if (styles) {
				var rule = createCssRule('.' + className)
				for (var key in styles) {
					rule.style[key] = styles[key]
				}
			}
			if (tagName.indexOf('-') > -1) {
				document.registerElement(tagName, this)
			}
		}
		var element = document.createElement(tagName)
		Object.setPrototypeOf(element, prototype)
		applyProperties(element, applyOnCreate, applyOnCreate)
		// TODO: we may want to put these on the instance so it can be overriden
		if (this.childrenToRender) {
			layoutChildren(element, this.childrenToRender)
		}
		if (properties) {
			applyProperties(element, properties, Object.keys(properties))
		}
		if (children) {
			layoutChildren(element.container || element, children)
		}
		element.className = className
		element.createdCallback && element.createdCallback()
		element.created && element.created()
		if (parent.tagName) {
			parent.appendChild(element)
			element.attachedCallback && element.attachedCallback()
			element.attached && element.attached()
		}
	}

	Element.prototype.closest = function(element){
		// find closest parent
	}
	Element.prototype.find = function(element){
		// find closest child
	}
	Element.Div = Element(HTMLDivElement)
	ElementType.refresh = Updater.refresh
	Element.content = function(element){
		// container marker
		return {
			isContentNode: true,
			create: element.create.bind(element)
		}
	}
	return ElementType
});