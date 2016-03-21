define(function (require, exports, module) {
	var lang = require('./lang')
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
			variable.subscribe(this)
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
		if (options) {
			if (options.selector) {
				this.selector = options.selector
			}
			if (options.element) {
				var element = this.element = options.element;
				(element.alkaliRenderers || (element.alkaliRenderers = [])).push(this)
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
		updated: function (updateEvent, context) {
			if (!this.invalidated) {
				// do this only once, until we render again
				this.invalidated = true
				var updater = this
				requestAnimationFrame(function(){
					invalidatedElements = null
					updater.updateRendering(updater.alwaysUpdate)
				})
			}
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
		element = this.element || element
		if(!element){
			if(this.selector){
				var elements = document.querySelectorAll(this.selector)
				for(var i = 0, l = elements.length; i < l; i++){
					this.updateRendering(always, elements[i])
				}
			}else{
				throw new Error('No element or selector was provided to the Updater')
			}
			return
		}
		if(always || this.shouldRender(element)){
			// it is connected
			this.updateElement(element)
		}else{
			var id = this.getId()
			var updaters = element.updaters
			if(!updaters){
				updaters = element.updaters = []
				element.className += ' needs-rerendering'
			}
			if (!updaters[id]) {
				updaters[id] = this
			}
		}
	}
	ElementUpdater.prototype.addElement = function (element) {
		if (this.selector) {
			element.updaters = [this]
		} else {
			// no way of tracking so, we have to keep an array
			(this.elements = (this.elements || [])).push(element)
		}
		// and immediately do an update
		this.updateElement(element)
	}
	ElementUpdater.prototype.updateElement = function(element) {
		this.invalidated = false
		var value = !this.omitValueOf && this.variable.valueOf(element)
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
		var thisElement = this.element
		var updater = this
		if (!this.builtList) {
			this.builtList = true
			container = document.createDocumentFragment()
			var childElements = this.childElements = []
			this.variable.forEach(function(item) {
				eachItem(item)
			})
			this.element.appendChild(container)
		} else {
			var childElements = this.childElements
			var updates = this.updates
			container = this.element
			updates.forEach(function(update) {
				if (update.type === 'refresh') {
					this.builtList = false
					for (var i = 0, l = childElements.length; i < l; i++) {
						thisElement.removeChild(childElements[i])
					}
					this.renderUpdate()
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
				childElement = each.create(thisElement, {_item: item}) // TODO: make a faster object here potentially
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
				var updaters = element.updaters
				if(updaters){
					element.updaters = null
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
				renderer.variable.unsubscribe(renderer)
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
	module.exports = Updater
});