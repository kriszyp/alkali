define(['./util/lang'], function (lang) {
	var deny = {}
	var noChange = {}
	var WeakMap = lang.WeakMap
	var setPrototypeOf = Object.setPrototypeOf || (function(base, proto) { base.__proto__ = proto})
	var getPrototypeOf = Object.getPrototypeOf || (function(base) { return base.__proto__ })
	var isGenerator = lang.isGenerator
	// update types
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
			if (value === undefined) {
				if (this.default !== undefined) {
					this.value = this.default
				}
			} else {
				this.value = value
			}
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
			if (this.parent) {
				if (context) {
					valueContext = context.newContext()
					valueContext.nextProperty = 'parent'
				}
				var key = this.key
				var property = this
				var object = this.parent.valueOf(valueContext)
				var gotValueAndListen = function(object) {
					var value = property.gotValue(object == null ? undefined : typeof object.get === 'function' ? object.get(key) : object[key], context, valueContext)
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
					this.gotValue(null, context, valueContext)
					return when(object, gotValueAndListen)
				}
				return gotValueAndListen(object)
			}
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
		property: function(key, PropertyClass) {
			var isMap = this.isMap()
			var properties = this._properties || (this._properties = isMap ? new Map() : {})
			var propertyVariable = isMap ? properties.get(key) : properties[key]
			if (!propertyVariable) {
				// create the property variable
				propertyVariable = new (PropertyClass || Variable)()
				propertyVariable.key = key
				propertyVariable.parent = this
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
			if (this.parent) {
				return this.parent.for(subject).property(this.key)	
			}
			return new ContextualizedVariable(this, subject || defaultContext)
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
			if (this.parent) {
				callback(this.parent)
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

			var listeners = this.listeners
			if (listeners) {
				var variable = this
				// make a copy, in case they change
				listeners.forEach(function(dependent) {
					if ((updateEvent instanceof PropertyChangeEvent) &&
							dependent.parent) {
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
			if (this.parent) {
					this.parent.updated(new PropertyChangeEvent(this.key, updateEvent, this.parent), this, context)
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
			if (this.parent) {
				return this._changeValue(context, RequestChange, value)
			}
			if (this.ownObject) {
				this.ownObject = false
			}
			return when(this.getValue ? this.getValue(context) : this.value, function(oldValue) {
				if (variable.__debug) {
					// debug is on
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
				return thisVariable
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
			if (this.parent) {
				var parentSchemaProperties = this.parent.schema.properties
				return parentSchemaProperties && parentSchemaProperties[this.key]
			}
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
			if (this.parent) {
				return this.parent.validate(target.valueOf(), schema)
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
		set structured(structure) {
			// find any variable properties and attaches them as a property
			var keys = Object.keys(this)
			var properties = keys.length > 1 && this._properties || (this._properties = {})
			for(var i = 0, l = keys.length; i < l; i++) {
				var key = keys[i]
				var value = this[key]
				if (value instanceof Variable) {
					var existing = properties[key]
					if (existing) {
						if (existing !== value) {
							// an existing property exists, put in it
							existing.put(value)
						}
					} else {
						if (value.parent) {
							if (value.parent === this) {
								continue // just being assigned to another property
							} else {
								// property already exists with different parent, make a proxy
								var newValue = new Variable()
								newValue.proxy(value)
								value = newValue
							}
						}
						value.key = key
						value.parent = this
						properties[key] = value
					}
				}
			}
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
			} else if (this.parent) {
				this.parent._willModify()
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
				propertyVariable = new Variable()
				propertyVariable.key = key
				propertyVariable.parent = this
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
				if (typeof method === 'string') {
					// apply method
					return array[method].apply(array, args)
				} else {
					return method(array, args)
				}
			})
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

	function defineArrayMethod(method, constructor, properties) {
		var IterativeResults = lang.compose(IterativeMethod, constructor, properties)
		IterativeResults.prototype.method || (IterativeResults.prototype.method = method)
		Variable.prototype[method] = function() {
			var results = new IterativeResults()
			results.source = this
			results.arguments = arguments
			return results
		}
	}

	defineArrayMethod('filter', function Filtered() {}, {
		updated: function(event, by, context) {
			if (!event || event.modifier === this || (event.modifier && event.modifier.constructor === this)) {
				return Composite.prototype.updated.call(this, event, by, context)
			}
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
				return Composite.prototype.updated.call(this, event, by, context)
			}
		}
	})
	defineArrayMethod('map', function Mapped() {}, {
		updated: function(event, by, context) {
			if (!event || event.modifier === this || (event.modifier && event.modifier.constructor === this)) {
				return Composite.prototype.updated.call(this, event, by, context)
			}
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
					return Composite.prototype.updated.call(this, event, by, context)
				}
			} else {
				return Composite.prototype.updated.call(this, event, by, context)
			}
		}
	})
	defineArrayMethod('reduce', function Reduced() {})
	defineArrayMethod('reduceRight', function Reduced() {})
	defineArrayMethod('some', function Aggregated() {})
	defineArrayMethod('every', function Aggregated() {})
	defineArrayMethod('slice', function Aggregated() {})
	defineArrayMethod('keyBy', function UniqueIndex(source, args) {}, {
		isMap: function () {
			return true
		},
		method: function(array, args) {
			var index = new Map()
			var keyGenerator = args[0]
			var valueGenerator = args[1]
			var hasKeyFunction = typeof keyGenerator === 'function'
			var hasValueFunction = typeof valueGenerator === 'function'
			var hasKey = !!keyGenerator
			for (var i = 0, l = array.length; i < l; i++) {
				var element = array[i]
				index.set(
					hasKeyFunction ? keyGenerator(element) :
						hasKey ? element[keyGenerator] : element,
					hasValueFunction ? valueGenerator(element) : element)
			}
			return index
		}
	})

	defineArrayMethod('groupBy', function UniqueIndex(source, args) {}, {
		isMap: function () {
			return true
		},
		method: function(array, args) {
			var index = new Map()
			var keyGenerator = args[0]
			var valueGenerator = args[1]
			var hasKeyFunction = typeof keyGenerator === 'function'
			var hasValueFunction = typeof valueGenerator === 'function'
			var hasKey = !!keyGenerator
			for (var i = 0, l = array.length; i < l; i++) {
				var element = array[i]
				var key = hasKeyFunction ? keyGenerator(element) :
						hasKey ? element[keyGenerator] : element
				var group = index.get(key)
				if (!group) {
					index.set(key, group = [])
				}
				group.push(hasValueFunction ? valueGenerator(element) : element)
			}
			return index
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
					} else if (typeof nextVariable === 'function' && isGenerator(nextVariable)) {
						var delegatedGenerator
						getValue.call(this, context, delegatedGenerator = {
							i: i,
							iterator: nextVariable()
						})
						i = delegatedGenerator.i
					} else {
						this[argumentName] = null
					}
				}
				i++
				if (resuming) {
					resuming.i = i
				}
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
})