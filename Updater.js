(function (root, factory) { if (typeof define === 'function' && define.amd) {
        define(['./util/lang'], factory)
    } else if (typeof module === 'object' && module.exports) {
        module.exports = factory(require('./util/lang'))
    } else {
        root.alkali.Updater = factory(root.alkali.lang)
    }
}(this, function (lang, Variable) {
	var doc = document
	var invalidatedElements
	var queued
	var toRender = []
	var nextId = 1
	var requestAnimationFrame = lang.requestAnimationFrame
	function Updater(options) {
		var variable = options.variable
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
			var value = !this.omitValueOf && this.variable.for(element).valueOf()
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