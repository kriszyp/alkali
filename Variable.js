(function (root, factory) { if (typeof define === 'function' && define.amd) {
	define(['./util/lang'], factory) } else if (typeof module === 'object' && module.exports) {				
	module.exports = factory(require('./util/lang')) // Node
}}(this, function (lang) {
	var deny = {}
	var noChange = {}
	var WeakMap = lang.WeakMap
	var setPrototypeOf = Object.setPrototypeOf || (function(base, proto) { base.__proto__ = proto})
	var getPrototypeOf = Object.getPrototypeOf || (function(base) { return base.__proto__ })
	var isGenerator = lang.isGenerator
	var undefined // makes it faster to be locally scoped
	// update types
	var RequestChange = 3
	var RequestSet = 4

	var propertyListenersMap = new WeakMap(null, 'propertyListenersMap')
	var isStructureChecked = new WeakMap()

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
	function whenStrict(value, callback) {
		if (value && value.then && !value.notifies) {
			return value.then(callback)
		}
		return callback(value)
	}

	function Context(subject){
		this.subject = subject
		this.sources = []
	}
	Context.prototype = {
		constructor: Context,
		newContext: function(variable) {
			return new Context(this.subject)
		},
		version: 2166136261, // FNV-1a prime seed
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
					var sources = this.sources
					for (var i = 0, l = sources.length; i < l; i++) {
						contextualized[sources[i]] = sources[++i]
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
			return contextualized
		},
		integrate: function(context, contextualized) {
			this.addInput(contextualized)
			this.hash(context.version)
			this.hash(Math.max(contextualized.version || 0, contextualized.versionWithChildren || 0))
		},
		hash: function(version) {
/*			// FNV1a hash algorithm 32-bit
			return this.version = (this.version ^ (version || 0)) * 16777619 >>> 0*/

/*			// 54 bit FNV1a hash algorithm
			var xored = this.version ^ (version || 0)
			// 435 + 1099511627776 = 1099511628211 is 64 bit FNV prime
			return this.version =
				xored * 435 + // compute hash on lower 32 bits
				(xor & 16777215) * 1099511627776 + // compute hash on lower 24 bits that overflow into upper 32 bits
				((this.version / 4294967296 >>> 0) * 435 & 2097151) * 4294967296 // hash on upper 32 bits*/
			// 54 bit derivative of FNV1a that better uses JS numbers/operators
			return this.version = (this.version ^ (version || 0)) * 1049011 + (this.version / 5555555 >>> 0)
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
			if (!this.subject) {
				// no subject, just use the default variable
				return variable
			}
			// returns a variable that has already been contextualized
			var instance = variable._contextMap && this.subject && variable._contextMap.get(this.subject)
			if (instance && instance.context && instance.context.matches(this)) {
				return instance
			}
		},
		addInput: function(sourceVariable) {
			this.sources.push(this.nextProperty, sourceVariable)
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

	function forPropertyNotifyingValues(variable, properties, callback) {
		if (variable === properties) {
			forPropertyNotifyingValues(variable, variable._properties, callback)
		}
		for (var key in properties) {
			var property = properties[key]
			if (property && property.parent == variable) {
				if (property.returnedVariable) {
					callback(property.returnedVariable)
				}
				if (property.hasChildNotifiers) {
					var subProperties = property._properties
					if (subProperties) {
						forPropertyNotifyingValues(property, property, callback)
					}
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
			return Variable.with(value)
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
			return this.gotValue(this.getValue ?
				this.getValue(context, context && (valueContext = context.newContext())) :
				this.value, context, valueContext)
		},
		getValue: function(context, valueContext) {
			if (context) {
				context.hash(this.version)
			}
			if (this.parent) {
				if (context) {
					if (!valueContext) {
						valueContext = context.newContext()
					}
					valueContext.nextProperty = 'parent'
				}
				var key = this.key
				var property = this
				var parent = this.parent
				var object = parent.getValue ? parent.getValue(valueContext) : parent.value
				if (object && object.then && !object.notifies) {
					return when(object, function(object) {
						var value = object == null ? undefined :
							typeof object.property === 'function' ? object.property(key) :
							typeof object.get === 'function' ? object.get(key) : object[key]
						//if (property.listeners) {
							var listeners = propertyListenersMap.get(object)
							if (listeners && listeners.observer && listeners.observer.addKey) {
								listeners.observer.addKey(key)
							}
						//}
						if (valueContext) {
							context.hash(valueContext.version)
						}
						return value
					})
				}
				var value = object == null ? undefined :
					typeof object.property === 'function' ? object.property(key) :
					typeof object.get === 'function' ? object.get(key) : object[key]
				//if (property.listeners) {
					var listeners = propertyListenersMap.get(object)
					if (listeners && listeners.observer && listeners.observer.addKey) {
						listeners.observer.addKey(key)
					}
				//}
				if (valueContext) {
					context.hash(valueContext.version)
				}
				return value
			}
			return this.value
		},
		gotValue: function(value, parentContext, context) {
			var previousNotifyingValue = this.returnedVariable
			var variable = this
			if (previousNotifyingValue) {
				if (value === previousNotifyingValue) {
					// nothing changed, immediately return valueOf
					if (parentContext) {
						if (!context) {
							context = parentContext.newContext()
						}
						context.nextProperty = 'returnedVariable'
						value = value.valueOf(context)
						parentContext.integrate(context, context.contextualize(this, parentContext) || this)
						return value
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
			}
			if (value === undefined) {
				value = variable.default
			}
			if (value && value.then) {
				return when(value, function(value) {
					return Variable.prototype.gotValue.call(variable, value, parentContext, context)
				})
			}
			if (context) {
				// maybe we should not do this if this is a promise so we don't double hash
				parentContext.integrate(context, context.contextualize(this, parentContext) || this)
			}
			if (parentContext) {

				/*if (!contextualized.listeners) {
					// mark it as initialized, since we have already recursively dependended on sources
					contextualized.listeners = []
				}*/

				if (!context) {
					parentContext.addInput(this)
				}
			}
			return value
		},
		PropertyClass: Variable,
		property: function(key, PropertyClass) {
			var propertyVariable = this[key]
			if (!propertyVariable || !propertyVariable.notifies) {
				propertyVariable = this._properties && this._properties[key]
			}
			if (!propertyVariable) {
				// create the property variable
				var Class = PropertyClass
				if (!Class) {
					Class = this.constructor[key]
					if (typeof Class !== 'function' || !Class.isPropertyClass) {
						Class = this.PropertyClass
					}
				}
				propertyVariable = new Class()
				propertyVariable.key = key
				propertyVariable.parent = this
				if (this[key] === undefined) {
					this[key] = propertyVariable
				} else {
					(this._properties || (this._properties = {}))[key] = propertyVariable
				}
			} else if (PropertyClass) {
				if (!(propertyVariable instanceof PropertyClass)) {
					throw new TypeError('Existing property variable does not match requested variable type')
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
			if (!parent) {
				return this.put(newValue, context)
			}
			var variable = this
			return whenStrict(parent.getValue ? parent.getValue(context) : parent.value, function(object) {
				if (object == null) {
					// nothing there yet, create an object to hold the new property
					parent.put(object = typeof key == 'number' ? [] : {}, context)
				} else if (typeof object != 'object') {
					// if the parent is not an object, we can't set anything (that will be retained)
					return deny
				}
				var oldValue = typeof object.get === 'function' ? object.get(key) : object[key]
				if (oldValue === newValue && typeof newValue != 'object') {
					// no actual change to make
					return noChange
				}
				if (typeof object.set === 'function') {
					object.set(key, newValue)
				} else {
					if (type == RequestChange && oldValue && oldValue.put && (!newValue && newValue.put)) {
						// if a put and the property value is a variable, assign it to that.
						oldValue.put(newValue)
					} else {
						object[key] = newValue
						// or set the setter/getter
					}
				}
				var event = new RefreshEvent()
				event.oldValue = oldValue
				event.target = variable
				variable.updated(event, variable, context)

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
				return newValue
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
			for (var i in this) {
				if (this.hasOwnProperty[i]) {
					var value = this[i]
					if (value && value.parent == this && value.listeners) {
						callback(i)
					}
				}
			}
		},
		apply: function(instance, args) {
			return new Transform(args[0], this, args)
		},
		call: function(instance) {
			return this.apply(instance, Array.prototype.slice.call(arguments, 1))
		},
		forDependencies: function(callback) {
			if (this.returnedVariable) {
				callback(this.returnedVariable)
			}
			if (this.hasNotifyingChild) {
				forPropertyNotifyingValues(this, this, callback)
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
			var variable = this
			this.forDependencies(function(dependency) {
				dependency.stopNotifies(variable)
			})
		},

		updateVersion: function(version) {
			this.version = Math.max(this.version || 0, this.versionWithChildren || 0) + 1
		},

		getVersion: function(context) {
			return Math.max(this.version || 0,
				this.returnedVariable && this.returnedVariable.getVersion ? this.returnedVariable.getFullVersion(context) : 0,
				this.parent ? this.parent.getVersion(context) : 0)
		},
		getFullVersion: function(context) {
			return Math.max(this.versionWithChildren || 0, this.getVersion(context))
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

		updated: function(updateEvent, by, context, isDownstream) {
			if (!updateEvent) {
				updateEvent = new RefreshEvent()
			}
			if (updateEvent.visited.has(this)){
				// if this event has already visited this variable, skip it
				return
			}
			updateEvent.visited.add(this)
			if (this.__debug) {
				// debug is on
				console.log('Variable changed at')
				console.log((new Error().stack || '').replace(/Error/, ''))
			}

			var contextualInstance = context && context.getContextualized(this)
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
			if (updateEvent instanceof PropertyChangeEvent) {
				this.versionWithChildren = Math.max(this.version || 0, this.versionWithChildren || 0) + 1
			} else if (!isDownstream) {
				this.updateVersion()
			}

			var listeners = this.listeners
			if (listeners) {
				var variable = this
				// make a copy, in case they change
				listeners = listeners.slice()
				for (var i = 0, l = listeners.length; i < l; i++) {
					var dependent = listeners[i]
					if ((updateEvent instanceof PropertyChangeEvent) &&
							dependent.parent) {
						if (dependent.key === updateEvent.key) {
							dependent.updated(updateEvent.childEvent, variable, context, true)
						}
					} else {
						dependent.updated(updateEvent, variable, context, true)
					}
				}
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
				this.listeners = listeners = [target]
				this.init()
			} else if (listeners.indexOf(target) === -1) {
				listeners.push(target)
			}
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
				var index = listeners.indexOf(dependent)
				if (index > -1) {
					listeners.splice(index, 1)
					if (listeners.length === 0) {
						// clear the listeners so it will be reinitialized if it has
						// listeners again
						this.cleanup()
					}
				}
			}
		},
		put: function(value, context) {
			var variable = this
			if (this.parent) {
				return this._changeValue(context, RequestChange, value)
			}
			return whenStrict(this.getValue ? this.getValue(context) : this.value, function(oldValue) {
				if (oldValue === value && typeof value != 'object') {
					return noChange
				}
				if (oldValue && oldValue.put &&
						// if it is set to fixed, we see we can put in the current variable
						(variable.fixed || !(value && value.put))) {
					return oldValue.put(value)
				}
				return whenStrict(variable.setValue(value, context), function(value) {
					var event = new RefreshEvent()
					event.oldValue = oldValue
					event.target = variable
					variable.updated(event, variable, context)
					return value
				})
			})
		},
		get: function(key) {
			if (this[key] || (this._properties && this._properties[key])) {
				return this.property(key).valueOf()
			}
			var object = this.getValue()
			if (!object) {
				return
			}
			if (typeof object.get === 'function') {
				return object.get(key)
			}
			return whenStrict(object, function(object) {
				var value = object[key]
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
		is: function(proxiedVariable) {
			var thisVariable = this
			this.fixed = true
			return whenStrict(this.setValue(proxiedVariable), function(value) {
				thisVariable.updated(new RefreshEvent(), thisVariable)
				return thisVariable
			})
		},
		proxy: function(proxiedVariable) {
			return this.is(proxiedVariable)
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
				when(event.value(), function(value) {
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
				return this.forEach(function(item) {
					var itemVariable = callbackOrItemClass.from(item)
					callbackOrContext.call(this, itemVariable)
				}, context)
			}
			if (this.collectionOf) {
				var variable = this
				return when(this.valueOf(callbackOrContext), function(value) {
					if (value && value.forEach) {
						value.forEach(function(item) {
							callbackOrItemClass.call(variable, variable.collectionOf.from(item))
						})
					}
				})
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
					reverse.call(this, value, args[0], context)
				}
			}
			if (transformFunction.prototype instanceof Variable) {
				return new transformFunction(this)
			}
			return new Transform(this, transformFunction)
		},
		map: function (transformFunction) {
			return this.to(function(value) {
				if (value instanceof Array) {
					throw new Error('map without VArray')
				}
				return transformFunction(value)
			})
		},
		as: function(Class) {
			// easiest way to cast to a variable class
			return new Class(this)
		},
		get schema() {
			// default schema is the constructor
			if (this.returnedVariable) {
				return this.returnedVariable.schema
			}
			if (this.parent) {
				var parentSchemaProperties = this.parent.schema.properties || this.parent.schema
				return parentSchemaProperties && parentSchemaProperties[this.key]
			}
			return this.constructor
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
			if (schema) {
				if (schema.type && (schema.type !== typeof target)) {
					return ['Target type of ' + typeof target + ' does not match schema type of ' + schema.type]
				}
				if (schema.required && (target == null || target == '' || (typeof target === 'number' && isNaN(target)))) {
					return ['Value is required']
				}
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
			return this.id || (this.id = Variable.nextId++)
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
			return this.returnedVariable && this.returnedVariable.collectionOf || this.constructor.collectionOf
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
		}
	}

	// a variable inheritance change goes through its own prototype, so classes/constructor
	// can be used as variables as well
	for (var key in VariablePrototype) {
		Object.defineProperty(Variable, key, Object.getOwnPropertyDescriptor(VariablePrototype, key))
	}

	Variable.as = function(Type) {
		var NewType = this.with({})
		var target = NewType.prototype
		var prototype = Type.prototype
		do {
			var names = Object.getOwnPropertyNames(prototype)
			for (var i = 0; i < names.length; i++) {
				var name = names[i]
				if (!Object.getOwnPropertyDescriptor(target, name)) {
					Object.defineProperty(target, name, Object.getOwnPropertyDescriptor(prototype, name))
				}
			}
			prototype = getPrototypeOf(prototype)
		} while (prototype && prototype !== Variable.prototype)
		return NewType
	}

	Variable.with = function(properties, ExtendedVariable) {
		// TODO: handle arguments
		var Base = this
		var prototype
		if (Object.getOwnPropertyDescriptor(this, 'prototype').writable === false) {
			// extending native class
			ExtendedVariable = lang.extendClass(this)
			prototype = ExtendedVariable.prototype
		} else {
			// extending function/constructor
			ExtendedVariable = ExtendedVariable || function() {
				if (this instanceof ExtendedVariable) {
					Base.apply(this, arguments)
				} else {
					return ExtendedVariable.with(properties)
				}
			}
			prototype = ExtendedVariable.prototype = Object.create(this.prototype)
			prototype.constructor = ExtendedVariable
			setPrototypeOf(ExtendedVariable, this)
		}
		return ExtendedVariable.assign(properties)
	}
	Variable.assign = function(properties) {
		var prototype = this.prototype
		for (var key in properties) {
			var descriptor = Object.getOwnPropertyDescriptor(properties, key)
			var value = descriptor.value
			if (typeof value === 'function' && key !== 'collectionOf') {
				if (value.notifies) {
					// variable class
					descriptor = (function(key, Class) {
						return {
							get: function() {
								var property = (this._properties || (this._properties = {}))[key]
								if (!property) {
									this._properties[key] = property = new Class()
									property.key = key
									property.parent = this
									if (property.listeners) {
										// if it already has listeners, need to reinit it with the parent
										property.init()
									}
								}
								return property
							},
							set: function(value) {
								this[key]._changeValue(null, RequestSet, value)
							},
							enumerable: true
						}
					})(key, value)
					if (value === Variable) {
						value = Variable() // create own instance
					}
					value.isPropertyClass = true
				} else if (isGenerator(value)) {
					descriptor = getGeneratorDescriptor(value)
				} else if (value.defineAs) {
					descriptor = value.defineAs(key)
				} else {
					value = generalizeMethod(value, key)
				}
			}
			Object.defineProperty(prototype, key, descriptor)
			if (value !== undefined) {
				// TODO: If there is a getter/setter here, use defineProperty
				this[key] = value
			} else {
				// getter/setter
				Object.defineProperty(this, key, descriptor)
			}
		}
		if (properties && properties.hasOwn) {
			hasOwn.call(this, properties.hasOwn)
		}
		return this
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


	function arrayToModify(variable, callback) {
		// TODO: switch this to allow promises
		return when(variable.cachedValue || variable.valueOf(), function(array) {
			if (!array) {
				variable.put(array = [])
			}
			var results = callback.call(variable, array)
			variable.cachedVersion++ // update the cached version, so any version checking will know it has changed
			return results
		})
	}

	function insertedAt(variable, added, startingIndex, arrayLength) {
		var addedCount = added.length
		// adjust the key positions of any index properties after splice
		if (addedCount > 0) {
			var arrayPosition
			for (var i = arrayLength - addedCount; i > startingIndex;) {
				var arrayPosition = variable[--i]
				if (arrayPosition) {
					variable[i] = undefined
					arrayPosition.key += addedCount
					variable[arrayPosition.key] = arrayPosition
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
			for (var i = startingIndex + removalCount; i < arrayLength + removalCount; i++) {
				var arrayPosition = variable[i]
				if (arrayPosition) {
					variable[i] = undefined
					arrayPosition.key -= removalCount
					variable[arrayPosition.key] = arrayPosition
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
			var iterator = this.valueOf()[Symbol.iterator]()
			var collectionOf = this.collectionOf
			if (collectionOf) {
				return {
					next: function() {
						var result = iterator.next()
						if (!result.done) {
							result.value = collectionOf.from(result.value)
						}
						return result
					}
				}
			}
			return iterator
		}
	}

	var VMap = Variable.VMap = lang.compose(Variable, function(value){
		this.value = typeof value === 'undefined' ? this.default : value
	}, {
		fixed: true,
		// TODO: Move all the get and set functionality for maps out of Variable
		property: function(key, PropertyClass) {
			var properties = this._properties || (this._properties = new Map())
			var propertyVariable = properties.get(key)
			if (!propertyVariable) {
				// create the property variable
				propertyVariable = new (PropertyClass || this.PropertyClass)()
				propertyVariable.key = key
				propertyVariable.parent = this
				if (propertyVariable.listeners) {
					// if it already has listeners, need to reinit it with the parent
					propertyVariable.init()
				}
				properties.set(key, propertyVariable)
			}
			return propertyVariable
		}
	})

	var Transform = Variable.Transform = lang.compose(Variable, function Transform(source, transform, sources) {
		this.source = source
		if (transform) {
			this.transform = transform
			if (sources) {
				for (var i = 1, l = sources.length; i < l; i++) {
					this['source' + i] = sources[i]
				}
			}
		}
	}, {
		getValue: function(context, transformContext) {
			// first check to see if we have the variable already computed
			var contextualizedVariable = context ? context.getContextualized(this) : this
			if (contextualizedVariable) {
				if (contextualizedVariable.invalidated) {
					contextualizedVariable.invalidated = false
				} else if (contextualizedVariable.listeners && contextualizedVariable.cachedVersion) {
					// it is live, so we can shortcut and just return the cached value
					if (transformContext) {
						transformContext.version = contextualizedVariable.cachedVersion
						transformContext.contextualize(contextualizedVariable, context)
					}
					return contextualizedVariable.cachedValue
				}
				if (!this.hasOwnProperty('source1') && context) {
					// TODO: Not sure if this is a helpful optimization or not
					// if we have a single source, we can use ifModifiedSince
						/*if (!contextualizedVariable && this.context && this.context.matches(context)) {
							contextualizedVariable = this
						}*/
					if (contextualizedVariable && transformContext && contextualizedVariable.cachedVersion > -1) {
						transformContext.ifNoMatch = contextualizedVariable.cachedVersion
					}
				}
			}
			if (!transformContext) {
				transformContext = context ? context.newContext() : new Context()
			}
			var args = []
			var argument, argumentName
			var lastArg
			var i = 0
			var variable = this
			function getNextArg() {
				// for now, we are sequentially resolving arguments so that hashes are deterministally in order
				// at some point it would be nice to come up with a scheme for deferred context so we can do it in
				// parallel
				argument = variable[argumentName = i > 0 ? 'source' + i : 'source']
				if (!argument && !(argumentName in variable)) {
					return
				}
				if (transformContext) {
					transformContext.nextProperty = argumentName
				}
				return when(argument && argument.valueOf(transformContext), function(resolved) {
					args[i++] = resolved
					return getNextArg()
				})
			}

			return when(getNextArg(), function() {
				transformContext.nextProperty = 'transform'
				var transform = variable.transform && variable.transform.valueOf(transformContext)
				if (variable.version) {
					// get the version in there
					transformContext.hash(variable.version ^ 55555555555)
				}
				var contextualizedVariable = transformContext.contextualize(variable, context)
				var version = transformContext.version
				if (contextualizedVariable && contextualizedVariable.cachedVersion === version) {
					// get it out of the cache
					return contextualizedVariable.cachedValue
				}
				var result = transform ? transform.apply(variable, args) : args[0]
				// cache it
				contextualizedVariable.cachedValue = result
				contextualizedVariable.cachedVersion = version
				if (result && result.then) {
					result.then(null, function() {
						// clear out the cache on an error
						contextualizedVariable.cachedValue = null
						contextualizedVariable.cachedVersion = 0
					})
				}
				return result
			})
		},
		forDependencies: function(callback) {
			// depend on the args
			Variable.prototype.forDependencies.call(this, callback)
			var argument, argumentName
			for (var i = 0; (argument = this[argumentName = i > 0 ? 'source' + i : 'source']) || argumentName in this; i++) {
				if (argument && argument.notifies) {
					callback(argument)
				}
			}
		},

		updated: function(updateEvent, by, context) {
			this.invalidated = true
			if (by !== this.returnedVariable && updateEvent && updateEvent.type !== 'refresh') {
				// search for the output in the sources
				var argument, argumentName
				for (var i = 0; (argument = this[argumentName = i > 0 ? 'source' + i : 'source']) || argumentName in this; i++) {
					if (argument === by) {
						// if one of the args was updated, we need to do a full refresh (we can't compute differential events without knowledge of how the mapping function works)
						updateEvent = new RefreshEvent()
						continue
					}
				}
			}
			return Variable.prototype.updated.call(this, updateEvent, by, context)
		},

		getUpdates: function(since) {
			// this always issues updates, nothing incremental can flow through it
			if (!since || since.version < getVersion()) {
				return [new RefreshEvent()]
			}
		},

		getArguments: function() {
			var args = []
			var argument, argumentName
			for (var i = 0; (argument = this[argumentName = i > 0 ? 'source' + i : 'source']) || argumentName in this; i++) {
				args.push(argument)
			}
			return args
		},
		put: function(value, context) {
			var call = this
			return when(this.valueOf(context), function(originalValue) {
				if (originalValue === value && typeof value != 'object') {
					return noChange
				}
				var transform = call.transform.valueOf(context)
				if (transform.reverse) {
					(transform.reverse).call(call, value, call.getArguments(), context)
					call.updated(null, null, context)
				} else if (originalValue && originalValue.put) {
					return originalValue.put(value)
				} else {
					return deny
				}
			})
		},
		setReverse: function(reverse) {
			this.transform.valueOf().reverse = reverse
			return this
		}
	})

	var Item = lang.compose(Variable, function Item(value, content) {
		this.value = value
		this.collection = content
	}, {})

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
			this.sources && this.sources.forEach(callback)
		},

		getVersion: function() {
			var version = Variable.prototype.getVersion.call(this)
			var sources = this.sources || 0
			for (var i = 0, l = sources.length; i < l; i++) {
				var source = sources[i]
				if (source.getFullVersion) {
					version = Math.max(version, source.getFullVersion())
				}
			}
			return version
		},

		put: function(value) {
			var subject = this.subject
			return this.generic.put(value, subject.getContextualized ? subject : new Context(subject))
		}
	})

	var VArray = Variable.VArray = lang.compose(Variable, function VArray(value) {
		return makeSubVar(this, value, VArray)
	}, {
		_isStrictArray: true,
		/* TODO: at some point, we might add support for length, but need to make it be dependent/notified by array changes
		get length() {
			if (typeof this !== 'function') {
				Object.defineProperty(this, 'length', {
					configurable: true
				})
				return this.property('length')
			}
		},
		set length(length) {
			// allow overriding
			Object.defineProperty(this, 'length', {
				value: length
			})
		},*/
		property: function(key, PropertyClass) {
			return Variable.prototype.property.call(this, key, PropertyClass || typeof key === 'number' && this.collectionOf)
		},
		splice: function(startingIndex, removalCount) {
			var args = arguments
			return arrayToModify(this, function(array) {
				if (startingIndex < 0) {
					startingIndex = array.length + startingIndex
				}
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
	})
	VArray.of = function(collectionOf) {
		var ArrayClass = VArray({collectionOf: collectionOf})
		if (this !== VArray) {
			// new operator
			return new ArrayClass()
		}
		return ArrayClass
	}

	function toArray(array) {
		if (!array) {
			return []
		}
		if (array.length > -1) {
			return array
		}
		var newArray = []
		if (array.forEach) {
			array.forEach(function(item) {
				newArray.push(item)
			})
		}
		return newArray
	}

	var getValue
	var GeneratorVariable = lang.compose(Transform, function ReactiveGenerator(generator){
		this.generator = generator
	}, {
		transform: {
			valueOf: function(context) {
				var resuming
				return next
				function next() {
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
						try {
							var argumentName = i > 0 ? 'source' + i : 'source'
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
									resuming = {
										i: i,
										iterator: nextVariable()
									}
									next.call(this)
									i = resuming.i
								} else {
									this[argumentName] = null
								}
							}
							i++
							if (context) {
								context.nextProperty = argumentName
							}
							lastValue = nextVariable && nextVariable.valueOf(context)
							if (lastValue && lastValue.then) {
								// if it is a promise, we will wait on it
								var variable = this
								resuming = {
									i: i,
									iterator: generatorIterator
								}
								// and return the promise so that the next caller can wait on this
								return lastValue.then(function(value) {
									resuming.value = value
									return next.call(variable)
								}, function(error) {
									resuming.value = error
									resuming.isThrowing = true
									return next.call(variable)
								})
							}
							isThrowing = false
						} catch (error) {
							isThrowing = true
							lastValue = error
						}
					} while(true)
				}
			}
		}
	})

	var Validating = lang.compose(Transform, function(source) {
		this.source = source
	}, {
		transform: function(target) {
			var target = this.source
			return target.validate(target, target.schema)
		}
	})

	function makeSubVar(instance, value, Type) {
		if (instance instanceof Variable) {
			Variable.call(instance, value)
		} else {
			return Type.with(value)
		}
	}

	function objectUpdated(object) {
		// simply notifies any subscribers to an object, that it has changed
		var listeners = propertyListenersMap.get(object)
		if (listeners) {
			for (var i = 0, l = listeners.length; i < l; i++) {
				listeners[i]._propertyChange(null, object)
			}
		}
	}

	var argsToArray = {
		apply: function(instance, args) {
			return args
		}
	}

	function all(array, transform) {
		// This is intended to mirror Promise.all. It actually takes
		// an iterable, but for now we are just looking for array-like
		if (array.length > -1) {
			if (array.length > 0 || typeof transform === 'function') {
				// TODO: Return VArray Transform
				return new Transform(array[0], typeof transform === 'function' ? transform : argsToArray, array)
			} else {
				return new VArray([])
			}
		}
		if (arguments.length > 1) {
			// support multiple arguments as an array
			// TODO: Return VArray Transform
			return new Transform(arguments[0], argsToArray, arguments)
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
	Variable.valueOf = function(context) {
		// contextualized valueOf
		return instanceForContext(this, context).valueOf(context)
	}
	Variable.getValue = function(context) {
		// contextualized getValue
		return instanceForContext(this, context)
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
	var proxyHandler = {
		get: function(target, name) {
			var value = target[name]
			return value === undefined ? target.property(name) : value
		},
		set: function(target, name, value) {
			var oldValue = target[name]
			if (oldValue && oldValue.put) {
				// own property available to put into
				oldValue.put(value)
			} else {
				target.set(name, value)
			}
			return true
		},
		has: function(target, name) {
			return (name in target) || (name in target.valueOf())
		},
		deleteProperty: function(target, name) {
			return proxyHandler.set(target, name, undefined)
		},
		ownKeys: function(target) {
			return Object.getOwnPropertyNames(target.valueOf())
		}
	}
	Variable.proxy = function(source) {
		// should we memoize?
		return new Proxy(source instanceof this ? source : this.from(source), proxyHandler)
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
	Variable.nextId = 1
	Variable.generalize = generalizeClass
	Variable.call = Function.prototype.call // restore these
	Variable.apply = Function.prototype.apply

	function VFunction() {
	}
	(VFunction.returns = function(Type){
		function VFunction() {}
		VFunction.defineAs = function(method)	{
			return {
				value: function() {
					var args = arguments
					// TODO: make these args part of the call so variables can be resolved
					// TODO: may actually want to do getValue().invoke()
					return new Type(new Transform(this, function(value) {
							return value == null ? undefined : value[method].apply(value, args)
					}))
				}
			}
		}
		return VFunction
	})

	function VMethod() {
	}
	VMethod.defineAs = function(method) {
		return {
			value: function() {
				var args = arguments
				// TODO: make these args part of the call so variables can be resolved
				// TODO: may actually want to do getValue().invoke()
				var variable = this
				return when(this.valueOf(), function(value) {
					var returnValue = value[method].apply(value, args)
					variable.put(value)
					return returnValue
				})
			}
		}		
	}

	function VString(value) {
		return makeSubVar(this, typeof value === 'object' ? value : String(value), VString)
	}

	function VNumber(value) {
		return makeSubVar(this, typeof value === 'object' ? value : Number(value), VNumber)
	}
	
	VString = Variable.with({
		charAt: VFunction.returns(VString),
		codeCharAt: VFunction.returns(VNumber),
		indexOf: VFunction.returns(VNumber),
		lastIndexOf: VFunction.returns(VNumber),
		match: VFunction.returns(VArray),
		replace: VFunction.returns(VString),
		substr: VFunction.returns(VString),
		slice: VFunction.returns(VString),
		toUpperCase: VFunction.returns(VString),
		toLowerCase: VFunction.returns(VString),
		length: VNumber
	}, VString)

	VNumber = Variable.with({
		toFixed: VFunction.returns(VString),
		toExponential: VFunction.returns(VString),
		toPrecision: VFunction.returns(VString),
		toLocaleString: VFunction.returns(VString)
	}, VNumber)

	function VBoolean(value) {
		return makeSubVar(this, typeof value === 'object' ? value : Boolean(value), VBoolean)
	}
	VBoolean = Variable.with({}, VBoolean)

	function VSet(value) {
		return makeSubVar(this, value instanceof Array ? new Set(value) : value, VSet)
	}
	VSet = Variable.with({
		has: VFunction.returns(VBoolean),
		add: VMethod,
		clear: VMethod,
		delete: VMethod
	}, VSet)
	Object.defineProperty(VSet.prototype, 'array', {
		get: function() {
			return this._array || (this._array = this.to(toArray).as(VArray))
		}
	})

	function VDate(value) {
		return makeSubVar(this, typeof value === 'object' ? value : new Date(value), VDate)
	}
	VDate = Variable.with({
		toDateString: VFunction.returns(VString),
		toTimeString: VFunction.returns(VString),
		toGMTString: VFunction.returns(VString),
		toUTCString: VFunction.returns(VString),
		getTime: VFunction.returns(VNumber),
		setTime: VMethod
	}, VDate)

	var VPromise = lang.compose(Variable, function VPromise(value) {
		return makeSubVar(this, value, VPromise)
	}, {
		then: function(onResolve, onError) {
			// short hand for this.valueOf().then()
			var value = this.valueOf()
			if (value && value.then) {
				return value.then(onResolve, onError)
			}
			return onResolve(value)
		},
	})

	var primitives = {
		'string': VString,
		'number': VNumber,
		'boolean': VBoolean
	}
	function getType(Type) {
		if (typeof Type === 'string') {
			return primitives[Type]
		} else if (typeof Type === 'object') {
			if (Type instanceof Array) {
				return VArray.of(getType(Type[0]))
			}
			var typedObject = {}
			for (var key in Type) {
				typedObject[key] = getType(Type[key])
			}
			return Variable.with(typedObject)
		}
		return Type
	}
	var exports = {
		__esModule: true,
		Variable: Variable,
		VArray: VArray,
		default: Variable,
		VString: VString,
		VNumber: VNumber,
		VBoolean: VBoolean,
		VPromise: VPromise,
		VDate: VDate,
		VSet: VSet,
		VMap: VMap,
		Transform: Transform,
		deny: deny,
		noChange: noChange,
		Context: Context,
		GeneratorVariable: GeneratorVariable,
		Item: Item,
		NotifyingContext: NotifyingContext,
		Context: Context,
		all: all,
		objectUpdated: objectUpdated,
		reactive: reactive
	}
	var typeScriptConversions = new Map()
	typeScriptConversions.set(Array, VArray)
	typeScriptConversions.set(String, VString)
	typeScriptConversions.set(Number, VNumber)
	typeScriptConversions.set(Boolean, VBoolean)
	function reactive(target, key) { // for typescript decorators
    var Type = Reflect.getMetadata('design:type', target, key)
    console.log('Type', Type)
    if (!Type.notifies) {
    	Type = typeScriptConversions.get(Type) || Variable
    }
    Object.defineProperty(target, key, {
      get: function() {
      	return reactive.get(this, key, Type)
      },
      set: function(value) {
      	reactive.set(this, key, value)
      },
      enumerable: true
    })
  }
	reactive.get = function(target, key, Type) { // for babel decorators
    var property = (target._properties || (target._properties = {}))[key]
    if (!property) {
      target._properties[key] = property = new (getType(Type))()
      if (target.getValue) {
        property.key = key
        property.parent = target
				if (property.listeners) {
					// if it already has listeners, need to reinit it with the parent
					property.init()
				}
      }
    }
    return property
  }
  reactive.set = function(target, key, value) {
    var property = target[key]
    property.parent ? property._changeValue(null, RequestSet, value) : property.put(value)
  }


	var IterativeMethod = lang.compose(Transform, function(source, method, args) {
		this.source = source
		// source.interestWithin = true
		this.method = method
		this.arguments = args
	}, {
		transform: function(array) {
			var method = this.method
			var isStrictArray = this.source && this.source._isStrictArray
			if (array && array.forEach) {
				array = this._mappedItems(array)
			} else if (isStrictArray) {
				array = []
			} else {
				if (method === 'map'){
					// fast path, and special behavior for map
					return this.arguments[0](array)
				}
				// if not an array convert to an array
				array = [array]
			}
			if (typeof method === 'string') {
				// apply method
				return array[method].apply(array, this.arguments)
			} else {
				return method(array, this.arguments)
			}
		},
		_mappedItems: function(array) {
			var collectionOf = this.source && this.source.collectionOf
			return collectionOf ? array.map(function(item) {
				return collectionOf.from(item)
			}) : array
		},

		getCollectionOf: function(){
			return this.source.getCollectionOf()
		},
		_isStrictArray: true
	})

	function defineArrayMethod(method, constructor, properties, returns) {
		var IterativeResults = lang.compose(returns ? returns.as(IterativeMethod) : IterativeMethod, constructor, properties)
		IterativeResults.prototype.method || (IterativeResults.prototype.method = method)
		Object.defineProperty(IterativeResults.prototype, 'isIterable', {value: true});
		VArray[method] = VArray.prototype[method] = function() {
			var results = new IterativeResults(this)
			results.source = this
			results.arguments = arguments
			return results
		}
	}

	defineArrayMethod('filter', function Filtered() {}, {
		updated: function(event, by, context) {
			if (!event || event.modifier === this || (event.modifier && event.modifier.constructor === this)) {
				return Transform.prototype.updated.call(this, event, by, context)
			}
			var contextualizedVariable = context && context.getContextualized(this) || this
			if (event.type === 'delete') {
				var index = contextualizedVariable.cachedValue.indexOf(event.oldValue)
				if (index > -1) {
					contextualizedVariable.splice(index, 1)
				}
			} else if (event.type === 'add') {
				if (this._mappedItems([event.value]).filter(this.arguments[0]).length > 0) {
					contextualizedVariable.push(event.value)
				}
			} else if (event.type === 'update') {
				var object = event.parent.valueOf(context)
				var index = contextualizedVariable.cachedValue.indexOf(object)
				var matches = this._mappedItems([object]).filter(this.arguments[0]).length > 0
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
				return Transform.prototype.updated.call(this, event, by, context)
			}
		}
	}, VArray)
	defineArrayMethod('map', function Mapped(source) {
		this._isStrictArray = source._isStrictArray
	}, {
		updated: function(event, by, context) {
			if (!event || event.modifier === this || (event.modifier && event.modifier.constructor === this)) {
				return Variable.prototype.updated.call(this, event, by, context)
			}
			var contextualizedVariable = context && context.getContextualized(this) || this
			if (event.type === 'delete') {
				contextualizedVariable.splice(event.previousIndex, 1)
			} else if (event.type === 'add') {
				contextualizedVariable.push(this.arguments[0].apply(this.arguments[1], this._mappedItems([event.value])))
			} else if (event.type === 'update') {
				var object = event.parent.valueOf(context)
				var array = contextualizedVariable.cachedValue
				var index = event.key
				var value = event.value
				if (index > -1) {
					// update was to an index property of this array variable
					value = object[index]
				} else {
					// update was inside an object inside of our array
					index = array && array.map && array.indexOf(object)
				}
				if (index > -1) {
					contextualizedVariable.splice(index, 1, this.arguments[0].apply(this.arguments[1], this._mappedItems([value])))
				} else {
					return Transform.prototype.updated.call(this, event, by, context)
				}
			} else {
				return Transform.prototype.updated.call(this, event, by, context)
			}
		}
	}, VArray)
	defineArrayMethod('reduce', function Reduced() {})
	defineArrayMethod('reduceRight', function Reduced() {})
	defineArrayMethod('some', function Aggregated() {}, {}, VBoolean)
	defineArrayMethod('every', function Aggregated() {}, {}, VBoolean)
	defineArrayMethod('slice', function Aggregated() {}, {}, VArray)
	defineArrayMethod('keyBy', function UniqueIndex(source, args) {}, {
		property: VMap.prototype.property,
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
					hasKeyFunction ? keyGenerator(element, emit) :
						hasKey ? element[keyGenerator] : element,
					hasValueFunction ? valueGenerator(element) : element)
			}
			function emit(key, value) {
				index.set(key, value)
			}
			return index
		}
	})

	defineArrayMethod('groupBy', function UniqueIndex(source, args) {}, {
		property: VMap.prototype.property,
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
			function emit(key, value) {
				var group = index.get(key)
				if (!group) {
					index.set(key, group = [])
				}
				group.push(value)
			}
			return index
		}
	})

	var getGeneratorDescriptor = Variable.getGeneratorDescriptor = function(value) {
		var variables
		return {
			get: function() {
				if (!variables) {
					 variables = new WeakMap()
				}
				var variable = variables.get(this)
				if (!variable) {
					variables.set(this, variable = new GeneratorVariable(value.bind(this)))
				}
				return variable
			},
			enumerable: true
		}
	}

	Variable.all = all
	Variable.Context = Context

	return exports
}))
