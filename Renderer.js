define(['./util/lang'], function (lang, Variable) {
	var doc = typeof document !== 'undefined' && document
	var invalidatedElements
	var queued
	var toRender = []
	var nextId = 1
	var requestAnimationFrame = lang.requestAnimationFrame

	function Context(subject){
		this.subject = subject
	}

	function Renderer(options) {
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
		if(options && options.updateOnStart !== false){
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
			this.variable.stopNotifies(this)
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
		return this.element || this.elements[0]
	}
	ElementRenderer.prototype.updateRendering = function (always, element) {
		var elements = this.elements || (element && [element]) || []
		if(!elements.length){
			if(this.selector){
				elements = document.querySelectorAll(this.selector)
			}else{
				throw new Error('No element or selector was provided to the Renderer')
			}
			return
		}
		for(var i = 0, l = elements.length; i < l; i++){
			if(always || this.shouldRender(elements[i])){
				// it is connected
				this.updateElement(elements[i])
			}else{
				var id = this.getId()
				var renderers = elements[i].renderersOnShow
				if(!renderers){
					renderers = elements[i].renderersOnShow = []
					elements[i].className += ' needs-rerendering'
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
		if (element.type === 'number') {
			if (isNaN(newValue)) {
				newValue = ''
			}
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
	TextRenderer.prototype.renderUpdate = function (newValue, element) {
		if (newValue === undefined){
			newValue = ''
		}
		(this.textNode || element.childNodes[this.position]).nodeValue = newValue
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
		(this.updates || (this.updates = [])).push(updateEvent)
		ElementRenderer.prototype.updated.call(this, updateEvent, context)
	}
	ListRenderer.prototype.type = 'ListRenderer'
	ListRenderer.prototype.omitValueOf = true
	ListRenderer.prototype.renderUpdate = function (newValue, element) {
		var container
		var each = this.each
		var thisElement = this.elements[0]
		var renderer = this
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
})