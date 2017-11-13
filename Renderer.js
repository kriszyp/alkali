(function (root, factory) { if (typeof define === 'function' && define.amd) {
	define(['./util/lang', './Variable'], factory) } else if (typeof module === 'object' && module.exports) {
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
		if (options.getElements) {
			this.getElements = options.getElements
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
		version: 0,
		notifies: true,
		updateRendering: function () {
			throw new Error ('updateRendering must be implemented by sub class of Renderer')
		},
		updated: function (updateEvent, by, context) {
			if (!this.invalidated) {
				if (this.getElements) {
					var variable = this.variable
					var invalidated = this.invalidated || (this.invalidated = new lang.Set())
					this.getElements().forEach(function(element) {
						if (doesEffect(variable, element, updateEvent)){
							invalidated.add(element)
						}
						/*if (element.constructor.getForClass(element, variable) == by) {
							invalidated.add(element)
						}*/
					})
				} else {
				// do this only once, until we render again
					this.invalidated = true
				}
				if (this.deferredRender) {
					this.deferredRender.isCanceled = true
					this.deferredRender = null
				}
				var renderer = this
				requestAnimationFrame(function() {
					if (renderer.invalidated === true) {
						renderer.updateRendering(renderer.alwaysUpdate, renderer.element)
					} else {
						renderer.invalidated.forEach(function(element) {
							renderer.updateRendering(renderer.alwaysUpdate, element)
						})
					}
				})
			}
		},
		executeWithin: Context.prototype.executeWithin,
		setVersion: function(){
			// this doesn't need its own version/hash
		},
		newContext: function() {
			return new Context(this.element, true)
		},
		integrate: function(context, contextualized) {
			this.addInput(contextualized)
		},
		addInput: function(contextualized) {
			if (this.variable !== contextualized) {
				this.contextualized = contextualized
			}
		},
		getContextualized: function(Variable) {
			return Context.prototype.getContextualized.call(this, Variable)
			//return this.contextualized || this.variable
		},
		specify: function(Variable) {
			return this.contextualized = Context.prototype.specify.call(this, Variable)
			// a new context to get this
			this.contextualized = this.newContext(null, true).specify(Variable)

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
	Object.defineProperty(Renderer.prototype, 'subject', {
		get: function() {
			return this.element
		}
	})

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
		var Element = element.constructor
		var generalized = Element._generalized
		var resolved
		var renderer = this
		var deferredRender
		this.executeWithin(function() {
			deferredRender = renderer.variable.then(function(value) {
				resolved = true
				if (deferredRender) {
					if (deferredRender === renderer.deferredRender) {
						renderer.deferredRender = null
					}
					if (deferredRender.isCanceled) {
						return
					}
				}
				if (!renderer.invalidated) {
					if (renderer.contextualized && renderer.contextualized !== renderer.variable) {
						renderer.contextualized.stopNotifies(renderer)
					}
					if (generalized) {
						var rendererIdentifier = renderer.toString()
						if (!generalized[rendererIdentifier]) {
							generalized[rendererIdentifier] = true;
							(renderer.contextualized = renderer.variable).notifies(renderer)
						}
					} else {
						renderer.executeWithin(function() {
							renderer.contextualized = renderer.variable.notifies(renderer)
						})
					}
					if(value !== undefined || renderer.started){
						renderer.started = true
						renderer.renderUpdate(value, element)
					}
				}
			}, function(error) {
				console.error('Error rendering', renderer, error)
			})
		})
		if(!resolved){
			// start listening for changes immediately
			if (generalized) {
				var rendererIdentifier = renderer.toString()
				if (!generalized[rendererIdentifier]) {
					generalized[rendererIdentifier] = true;
					(renderer.contextualized = renderer.variable).notifies(renderer)
				}
			} else {
				renderer.executeWithin(function() {
					renderer.contextualized = renderer.variable.notifies(renderer)
				})
			}
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
		if (typeof newValue == 'boolean' || newValue == null) {
			// for booleans or null/undefined, treat the attribute boolean-like, setting and removing
			if (newValue) {
				element.setAttribute(this.name, '') // "set" the attribute to enabled
			} else {
				element.removeAttribute(this.name) // disable the attribute, removing it
			}
		} else {
			// otherwise, assign value as string
			element.setAttribute(this.name, newValue)
		}
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
					for (var i = 0, l = update.actions.length; i < l; i++) {
						var action = update.actions[i]
						if (action.previousIndex > -1) {
							thisElement.removeChild(childElements[action.previousIndex])
							childElements.splice(action.previousIndex, 1)
						}
						if (action.index > -1) {
							var nextChild = childElements[action.index]
							var newElement = Renderer.append(thisElement, eachItem(action.value))
							if (nextChild) {
								thisElement.insertBefore(newElement, nextChild)
								childElements.splice(action.index, 0, newElement)
							} else {
								childElements.push(newElement)
							}
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
