define(['./util/lang'],
		function(lang, Context) {
	var deny = {}
	var noChange = {}
	var WeakMap = lang.WeakMap
	var setPrototypeOf = Object.setPrototypeOf || (function(base, proto) { base.__proto__ = proto})
	var getPrototypeOf = Object.getPrototypeOf || (function(base) { return base.__proto__ })
	// update types
	var ToParent = 2
	var RequestChange = 3
	var Refresh = Object.freeze({
		type: 'refresh'
	})
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

	function NeedsContext(retrieve) {
		// constructor that signals a computation needs a context to continue
		this.for = retrieve
	}
	NeedsContext.prototype.toString = function() {
		return 'This variable needs to be resolved with a context, call this object with .for(context) to resolve the value'
	}

	function mergeContext(context) {
		for (var i = 1, l = arguments.length; i < l; i++) {
			var nextContext = arguments[i]
			if (!context || nextContext && context.contains(nextContext)) {
				context = nextContext
			}
		}
		return context
	}

	function inContext(value, context) {
		if (value instanceof NeedsContext) {
			return value.for(context)
		}
		return value
	}
	function when(value, callback) {
		if (value instanceof NeedsContext) {
			var retrieveContext = new NeedsContext(function(context) {
				var newValue = value.for(context)
				if (newValue && newValue.then) {
					return newValue.then(function(resolvedValue) {
						var result = callback(resolvedValue, context)
						if (result instanceof NeedsContext) {
							result.for(context)
							retrieveContext.context = mergeContext(value.context, result.context)
						} else {
							retrieveContext.context = value.context

						}
					})
				}
				var result = callback(newValue, context)
				if (result instanceof NeedsContext) {
					var resolvedResult = result.for(context)
					retrieveContext.context = mergeContext(value.context, result.context)
					return resolvedResult
				} else {
					retrieveContext.context = value.context
				}
				return result
			})
			return retrieveContext
		}
		if (value && value.then) {
			return value.then(callback)
		}
		return callback(value)
	}

	function whenAll(inputs, callback){
		var promiseInvolved
		var needsContext
		for (var i = 0, l = inputs.length; i < l; i++) {
			if (inputs[i] && inputs[i].then) {
				promiseInvolved = true
			}
			if (inputs[i] instanceof NeedsContext) {
				needsContext = true
			}
		}
		if (needsContext) {
			var retrieveContext = new NeedsContext(function(context) {
				var newValues = []
				for (var i = 0, l = inputs.length; i < l; i++) {
					var input = inputs[i]
					if (input instanceof NeedsContext) {
						newValues[i] = input.for(context)
						// TODO: figure out the most specific context
						retrieveContext.context = mergeContext(retrieveContext.context, input.context)
					} else {
						newValues[i] = inputs[i]
					}
				}
				return lang.whenAll(newValues, callback)
			})
			return retrieveContext
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
	}
	function deregisterListener(value, listener) {
		var listeners = propertyListenersMap.get(value)
		if (listeners) {
			var index = listeners[listener.listenerId]
			if (index > -1) {
				listeners.splice(index, 1)
				delete listeners[listener.listenerId]
			}
		}
	}
	function contextFromCache(cache) {
		var context = new Context()
		do{
			context[cache.propertyName] = cache.key
			cache = cache.parent
		}while(cache)
		return context
	}

	function PropertyChange(key, object, childEvent) {
		this.key = key
		this.object = object
		this.childEvent = childEvent
		this.version = nextId++
	}
	PropertyChange.prototype.type = 'update'
	function Variable(value) {
		if (this instanceof Variable) {
			// new call, may eventually use new.target
			this.value = typeof value === 'undefined' ? this.default : value
		} else {
			return Variable.extend(value)
		}
	}
	Variable.prototype = {
		constructor: Variable,
		valueOf: function() {
			return this.gotValue(this.getValue())
		},
		getValue: function() {
			return this.value
		},
		gotValue: function(value, context) {
			var previousNotifyingValue = this.notifyingValue
			var variable = this
			if (value && value.then) {
				return value.then(function(value) {
					return Variable.prototype.gotValue.call(variable, value)
				})
			}
			if (value instanceof NeedsContext) {
				return new NeedsContext(function(context) {
					return Variable.prototype.gotValue.call(variable, value.for(context), context)
				})
			}
			if (previousNotifyingValue) {
				if (value === previousNotifyingValue) {
					// nothing changed, immediately return valueOf
					return value.valueOf()
				}
				// if there was a another value that we were dependent on before, stop listening to it
				// TODO: we may want to consider doing cleanup after the next rendering turn
				if (variable.dependents) {
					previousNotifyingValue.stopNotifies(variable)
				}
				variable.notifyingValue = null
			}
			if (value && value.notifies) {
				if (variable.dependents) {
						// the value is another variable, start receiving notifications
					value.notifies(variable)
				}
				variable.notifyingValue = value
				value = value.valueOf()
				if (value instanceof NeedsContext) {
					if (context) {
						var contextualValue = value
						value = value.for(context)
					} else {
						return new NeedsContext(function(context) {
							value = value.for(context)
							if (typeof value === 'object' && value && variable.dependents) {
								// TODO: merge contexts
								registerListener(value, variable.for(context))
							}
							return value
						})
					}
				}
			}
			if (typeof value === 'object' && value && variable.dependents) {
				// set up the listeners tracking
				registerListener(value, context ? variable.for(context) : variable)
			}
			if (value === undefined) {
				value = variable.default
			}
			return value
		},
		isMap: function(){
			return this.value instanceof Map
		},
		property: function(key) {
			var isMap = this.isMap()
			var properties = this._properties || (this._properties = isMap ? new Map() : {})
			var propertyVariable = isMap ? properties.get(key) : properties[key]
			if (!propertyVariable) {
				// create the property variable
				propertyVariable = new Property(this, key)
				if (isMap) {
					properties.set(key, propertyVariable)
				} else {
					properties[key] = propertyVariable
				}
			}
			return propertyVariable
		},
		for: function(context) {
			if (context && context.target && !context.getForClass) {
				// makes HTML events work
				context = context.target
			}
			if (typeof this === 'function') {
				// this is a class, the context should hopefully have an entry
				if (context) {
					var instance = context.getForClass(this)
					if (instance && !instance.context) {
						instance.context = context
					}
					// TODO: Do we have a global context that we set on defaultInstance?
					return instance || this.defaultInstance
				} else {
					return this.defaultInstance
				}
			}
			return new ContextualizedVariable(this, context || defaultContext)
		},
		_propertyChange: function(propertyName, object, context, type) {
			context = context && this.getKeyContext(context)
			if (this.onPropertyChange) {
				this.onPropertyChange(propertyName, object, context)
			}
			var properties = this._properties
			var property = properties && (properties instanceof Map ? properties.get(propertyName) : properties[propertyName])
			if (property && !(type instanceof PropertyChange) && object === this.valueOf(context)) {
				property.parentUpdated(ToChild, context)
			}
			this.updated(new PropertyChange(propertyName, object, type), null, context)
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
			if (this.notifyingValue) {
				callback(this.notifyingValue)
			}
		},
		init: function() {
			if (this.context) {
				this.constructor.notifies(this)
			}
			var variable = this
			this.forDependencies(function(dependency) {
				dependency.notifies(variable)
			})
		},
		cleanup: function() {
			var handles = this.handles
			if (handles) {
				for (var i = 0; i < handles.length; i++) {
					handles[i].remove()
				}
			}
			this.handles = null
			var value = this.value
			if (value && typeof value === 'object') {
				deregisterListener(value, this)
			}
			var notifyingValue = this.notifyingValue
			if (notifyingValue) {
				// TODO: move this into the caching class
				this.computedVariable = null
			}
			var variable = this
			this.forDependencies(function(dependency) {
				dependency.stopNotifies(variable)
			})
			if (this.context) {
				this.constructor.stopNotifies(this)
			}
		},

		updateVersion: function() {
			this.version = nextId++
		},

		getVersion: function(context) {
			return Math.max(this.version || 0, this.notifyingValue && this.notifyingValue.getVersion ? this.notifyingValue.getVersion(context) : 0)
		},

		getUpdates: function(since) {
			var updates = []
			var nextUpdateMap = this.nextUpdateMap
			if (nextUpdateMap && since) {
				while ((since = nextUpdateMap.get(since))) {
					if (since === Refresh) {
						// if it was refresh, we can clear any prior entries
						updates = []
					}
					updates.push(since)
				}
			}
			return updates
		},

		updated: function(updateEvent, by, context) {
			if (this.context) {
				if (by === this.constructor) {
					// if we receive an update from the constructor, filter it
					if (!(!context || context === this.context || (context.contains && this.context.nodeType && context.contains(this.context)))) {
						return
					}
				} else {
					// if we receive an outside update, send it to the constructor
					return this.constructor.updated(updateEvent, this, this.context)
				}
			}
			if (this.lastUpdate) {
				var nextUpdateMap = this.nextUpdateMap
				if (!nextUpdateMap) {
					nextUpdateMap = this.nextUpdateMap = new WeakMap()
				}
				nextUpdateMap.set(this.lastUpdate, updateEvent)
			}

			this.lastUpdate = updateEvent
			this.updateVersion()
			var value = this.value
			if (value && typeof value === 'object' && !(updateEvent instanceof PropertyChange)) {
				deregisterListener(value, this)
			}

			var dependents = this.dependents
			if (dependents) {
				// make a copy, in case they change
				dependents = dependents.slice(0)
				for (var i = 0, l = dependents.length; i < l; i++) {
					try{
						var dependent = dependents[i]
						// skip notifying property dependents if we are headed up the parent chain
						if (!(updateEvent instanceof PropertyChange) ||
								dependent.parent !== this || // if it is not a child property
								(by && by.constructor === this)) { // if it is coming from a child context
							if (dependent.parent === this) {
								dependent.parentUpdated(ToChild, context)
							} else {
								dependent.updated(updateEvent, this, context)
							}
						}
					}catch(e) {
						console.error(e, e.stack, 'updating a variable')
					}
				}
			}
		},

		getKeyContext: function(context) {
			return context
		},

		invalidate: function() {
			// for back-compatibility for now
			this.updated()
		},

		notifies: function(target) {
			var dependents = this.dependents
			if (!dependents || !this.hasOwnProperty('dependents')) {
				this.init()
				this.dependents = dependents = []
			}
			dependents.push(target)
			var variable = this
			return {
				unsubscribe: function() {
					variable.stopNotifies(target)
				}
			}
		},
		subscribe: function(listener) {
			// ES7 Observable (and baconjs) compatible API
			var updated
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
					listener(event)
				}
			}	else if (listener.next) {
				// Assuming ES7 Observable API. It is actually a streaming API, this pretty much violates all principles of reactivity, but we will support it
				updated = function() {
					listener.next(variable.valueOf())
				}
			} else {
				throw new Error('Subscribing to an invalid listener, the listener must be a function, or have an update or next method')
			}

			var handle = this.notifies({
				updated: updated
			})
			var initialValue = this.valueOf()
			if (initialValue !== undefined) {
				updated()
			}
			return handle
		},
		stopNotifies: function(dependent) {
			var dependents = this.dependents
			if (dependents) {
				for (var i = 0; i < dependents.length; i++) {
					if (dependents[i] === dependent) {
						dependents.splice(i--, 1)
					}
				}
				if (dependents.length === 0) {
					// clear the dependents so it will be reinitialized if it has
					// dependents again
					this.dependents = dependents = false
					this.cleanup()
				}
			}
		},
		put: function(value) {
			var variable = this
			return when(this.getValue(), function(oldValue, context) {
				if (oldValue === value) {
					return noChange
				}
				if (variable.fixed &&
						// if it is set to fixed, we see we can put in the current variable
						oldValue && oldValue.put && // if we currently have a variable
						// and it is always fixed, or not a new variable
						(variable.fixed == 'always' || !(value && value.notifies))) {
					return oldValue.put(value)
				}
				return when(variable.setValue(value), function(value, setValueContext) {
					variable.updated(Refresh, variable, setValueContext || context)
				})
			})
		},
		get: function(key) {
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
			this.property(key).put(value)
		},
		undefine: function(key, context) {
			this.set(key, undefined, context)
		},
		getForClass: getForClass,

		next: function(value) {
			// for ES7 observable compatibility
			this.put(value)
		},
		error: function(error) {
			// for ES7 observable compatibility
			var dependents = this.dependents
			if (dependents) {
				// make a copy, in case they change
				dependents = dependents.slice(0)
				for (var i = 0, l = dependents.length; i < l; i++) {
					try{
						var dependent = dependents[i]
						// skip notifying property dependents if we are headed up the parent chain
						dependent.error(error)
					}catch(e) {
						console.error(e, 'sending an error')
					}
				}
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
		forEach: function(callback, context) {
			// iterate through current value of variable
			return when(this.valueOf(), function(value) {
				if (value && value.forEach) {
					value.forEach(callback)
				}else{
					for (var i in value) {
						callback(value[i], i)
					}
				}
			})
		},
		each: function(callback) {
			// returns a new mapped variable
			// TODO: support events on array (using dstore api)
			return this.map(function(array) {
				return array.map(callback)
			})
		},

		map: function (operator) {
			// TODO: eventually make this act on the array items instead
			return this.to(operator)
		},
		to: function (operator) {
			// TODO: create a more efficient map, we don't really need a full variable here
			if (!operator) {
				throw new Error('No function provided to map')
			}
			return new Variable(operator).apply(null, [this])
		},
		get schema() {
			var schema = new Schema(this)
			Object.defineProperty(this, 'schema', {
				value: schema
			})
			return schema
		},
		get validate() {
			var schema = this.schema
			var validate = new Validating(this, schema)
			Object.defineProperty(this, 'validate', {
				value: validate
			})
			return validate
		},
		getId: function() {
			return this.id || (this.id = nextId++)
		}
	}
	// a variable inheritance change goes through its own prototype, so classes/constructor
	// can be used as variables as well
	setPrototypeOf(Variable, Variable.prototype)

	if (typeof Symbol !== 'undefined') {
		Variable.prototype[Symbol.iterator] = function() {
			return this.valueOf()[Symbol.iterator]()
		}
	}
	var Caching = Variable.Caching = lang.compose(Variable, function(getValue, setValue) {
		if (getValue) {
			this.getValue = getValue
		}
		if (setValue) {
			this.setValue = setValue
		}
	}, {
		valueOf: function() {

			// first check to see if we have the variable already computed
			if (this.cachedVersion === this.getVersion()) {
				return this.cachedValue
			}
			
			var variable = this

			function withComputedValue(computedValue) {
				if (computedValue && computedValue.notifies && variable.dependents) {
					variable.computedVariable = computedValue
				}
				computedValue = variable.gotValue(computedValue)
				variable.cachedVersion = variable.getVersion()
				if (computedValue instanceof NeedsContext) {
					var contextualizedValue = new NeedsContext(function(context) {
						var cacheMap = variable.cacheMap = new WeakMap()
						var resolvedValue = computedValue.for(context)
						cacheMap.set(context, resolvedValue)
						return resolvedValue
					})
					variable.cachedValue = new NeedsContext(function(context) {
						var cacheMap = variable.cacheMap
						var resolvedValue
						if (cacheMap.has(context)) {
							resolvedValue = variable.cacheMap.get(context)
						} else {
							var resolvedValue = variable.gotValue(variable.getValue()).for(context)
							cacheMap.set(context, resolvedValue)
						}
						return resolvedValue
					})
					return contextualizedValue
				}
				variable.cachedValue = computedValue
				return computedValue
			}

			var computedValue = this.getValue()
			if (computedValue && computedValue.then) {
				return computedValue.then(withComputedValue)
			} else {
				return withComputedValue(computedValue)
			}
		}
	})

	function GetCache() {
	}

	var Property = lang.compose(Variable, function Property(parent, key) {
		this.parent = parent
		this.key = key
	},
	{
		forDependencies: function(callback) {
			Variable.prototype.forDependencies.call(this, callback)
			callback(this.parent)
		},
		valueOf: function() {
			var key = this.key
			var property = this
			var object = this.parent.valueOf()
			function gotValueAndListen(object, context) {
				if (property.dependents) {
					var listeners = propertyListenersMap.get(object)
					if (listeners && listeners.observer && listeners.observer.addKey) {
						listeners.observer.addKey(key)
					}
				}
				return property.gotValue(object == null ? undefined : typeof object.get === 'function' ? object.get(key) : object[key], context)
			}
			if (object instanceof NeedsContext) {
				return when(object, gotValueAndListen)
			}
			if (object && object.then) {
				return object.then(gotValueAndListen)
			}
			return gotValueAndListen(object)
		},
		put: function(value, context) {
			return this._changeValue(context, RequestChange, value)
		},
		parentUpdated: function(updateEvent, context) {
			return Variable.prototype.updated.call(this, updateEvent, this.parent, context)
		},
		getKeyContext: function(context) {
			return this.parent.getKeyContext(context)
		},
		updated: function(updateEvent, by, context) {
			//if (updateEvent !== ToChild) {
				this._changeValue(context, updateEvent)
			//}
			return Variable.prototype.updated.call(this, updateEvent, by, context)
		},
		_changeValue: function(context, type, newValue) {
			var key = this.key
			var parent = this.parent
			return when(parent.valueOf(), function(object, requestedContext) {
				context = requestedContext || context
				if (object == null) {
					// nothing there yet, create an object to hold the new property
					var response = inContext(parent.put(object = typeof key == 'number' ? [] : {}), context)
				}else if (typeof object != 'object') {
					// if the parent is not an object, we can't set anything (that will be retained)
					return deny
				}
				if (type == RequestChange) {
					var oldValue = typeof object.get === 'function' ? object.get(key) : object[key]
					if (oldValue === newValue) {
						// no actual change to make
						return noChange
					}
					if (typeof object.set === 'function') {
						object.set(key, newValue)
					} else {
						object[key] = newValue
					}
				}
				var listeners = propertyListenersMap.get(object)
				// at least make sure we notify the parent
				// we need to do it before the other listeners, so we can update it before
				// we trigger a full clobbering of the object
				parent._propertyChange(key, object, context, type)
				if (listeners) {
					for (var i = 0, l = listeners.length; i < l; i++) {
						var listener = listeners[i]
						if (listener !== parent) {
							// now go ahead and actually trigger the other listeners (but make sure we don't do the parent again)
							listener._propertyChange(key, object, context, type)
						}
					}
				}
			})
		}
	})
	Variable.Property = Property

	var Item = Variable.Item = lang.compose(Variable, function Item(value) {
		this.value = value
	}, {})

	var Composite = Variable.Composite = lang.compose(Caching, function Composite(args) {
		this.args = args
	}, {
		forDependencies: function(callback) {
			// depend on the args
			Caching.prototype.forDependencies.call(this, callback)
			var args = this.args
			for (var i = 0, l = args.length; i < l; i++) {
				var arg = args[i]
				if (arg && arg.notifies) {
					callback(arg)
				}
			}
		},

		updated: function(updateEvent, by, context) {
			var args = this.args
			if (by !== this.notifyingValue && updateEvent !== Refresh) {
				// using a painful search instead of indexOf, because args may be an arguments object
				for (var i = 0, l = args.length; i < l; i++) {
					var arg = args[i]
					if (arg === by) {
						// if one of the args was updated, we need to do a full refresh (we can't compute differential events without knowledge of how the mapping function works)
						updateEvent = Refresh
						continue
					}
				}
			}
			Caching.prototype.updated.call(this, updateEvent, by, context)
		},

		getUpdates: function(since) {
			// this always issues updates, nothing incremental can flow through it
			if (!since || since.version < getVersion()) {
				return [new Refresh()]
			}
		},

		getVersion: function(context) {
			var args = this.args
			var version = Variable.prototype.getVersion.call(this, context)
			for (var i = 0, l = args.length; i < l; i++) {
				var arg = args[i]
				if (arg && arg.getVersion) {
					version = Math.max(version, arg.getVersion(context))
				}
			}
			return version
		},

		getValue: function() {
			var results = []
			var args = this.args
			for (var i = 0, l = args.length; i < l; i++) {
				var arg = args[i]
				results[i] = arg && arg.valueOf()
			}
			return whenAll(results, function(resolved) {
				return resolved
			})
		}
	})

	// a call variable is the result of a call
	var Call = lang.compose(Composite, function Call(functionVariable, args) {
		this.functionVariable = functionVariable
		this.args = args
	}, {
		forDependencies: function(callback) {
			// depend on the args
			Composite.prototype.forDependencies.call(this, callback)
			callback(this.functionVariable)
		},

		getValue: function(context) {
			var functionValue = this.functionVariable.valueOf(context)
			if (functionValue.then) {
				var call = this
				return functionValue.then(function(functionValue) {
					return call.invoke(functionValue, call.args, context)
				})
			}
			return this.invoke(functionValue, this.args, context)
		},

		getVersion: function(context) {
			// TODO: shortcut if we are live and since equals this.lastUpdate
			return Math.max(Composite.prototype.getVersion.call(this, context), this.functionVariable.getVersion(context))
		},

		execute: function(context) {
			var call = this
			return when(this.functionVariable.valueOf(context), function(functionValue) {
				return call.invoke(functionValue, call.args, context, true)
			})
		},

		put: function(value, context) {
			var call = this
			return when(this.valueOf(context), function(originalValue) {
				if (originalValue === value) {
					return noChange
				}
				return when(call.functionVariable.valueOf(context), function(functionValue) {
					return call.invoke(function() {
						if (functionValue.reverse) {
							functionValue.reverse.call(call, value, call.args, context)
							return Variable.prototype.put.call(call, value, context)
						}else{
							return deny
						}
					}, call.args, context)
				});				
			})
		},
		invoke: function(functionValue, args, context, observeArguments) {
			var instance = this.functionVariable.parent
			if (functionValue.handlesContext) {
				return functionValue.apply(instance, args, context)
			}else{
				var results = []
				for (var i = 0, l = args.length; i < l; i++) {
					var arg = args[i]
					results[i] = arg && arg.valueOf(context)
				}
				instance = instance && instance.valueOf(context)
				if (functionValue.handlesPromises) {
					return functionValue.apply(instance, results, context)
				}else{
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
			this.functionVariable.valueOf().reverse = reverse
			return this
		}
	})
	Variable.Call = Call

	var ContextualizedVariable = lang.compose(Variable, function ContextualizedVariable(Source, context) {
		this.constructor = Source
		this.context = context
	}, {

		valueOf: function() {
			return inContext(this.constructor.valueOf(), this.context)
		},
		put: function(value) {
			return inContext(this.constructor.put(value), this.context)
		},
		parentUpdated: function(event, context) {
			// if we receive an outside update, send it to the constructor
			this.constructor.updated(event, this.parent, this.context)
		}

	})

	function arrayMethod(name, sendUpdates) {
		Variable.prototype[name] = function() {
			var args = arguments
			var variable = this
			return when(this.cachedValue || this.valueOf(), function(array) {
				if (!array) {
					variable.put(array = [])
				}
				// try to use own method, but if not available, use Array's methods
				var result = array[name] ? array[name].apply(array, args) : Array.prototype[name].apply(array, args)
				if (sendUpdates) {
					sendUpdates.call(variable, args, result, array)
				}
				return result
			})
		}
	}
	arrayMethod('splice', function(args, result) {
		for (var i = 0; i < args[1]; i++) {
			this.updated({
				type: 'delete',
				previousIndex: args[0],
				oldValue: result[i]
			}, this)
		}
		for (i = 2, l = args.length; i < l; i++) {
			this.updated({
				type: 'add',
				value: args[i],
				index: args[0] + i - 2
			}, this)
		}
	})
	arrayMethod('push', function(args, result) {
		for (var i = 0, l = args.length; i < l; i++) {
			var arg = args[i]
			this.updated({
				type: 'add',
				index: result - i - 1,
				value: arg
			}, this)
		}
	})
	arrayMethod('unshift', function(args, result) {
		for (var i = 0, l = args.length; i < l; i++) {
			var arg = args[i]
			this.updated({
				type: 'add',
				index: i,
				value: arg
			}, this)
		}
	})
	arrayMethod('shift', function(args, results) {
		this.updated({
			type: 'delete',
			previousIndex: 0
		}, this)
	})
	arrayMethod('pop', function(args, results, array) {
		this.updated({
			type: 'delete',
			previousIndex: array.length
		}, this)
	})

	function iterateMethod(method) {
		Variable.prototype[method] = function() {
			return new IterativeMethod(this, method, arguments)
		}
	}

	iterateMethod('filter')
	//iterateMethod('map')

	var IterativeMethod = lang.compose(Composite, function(source, method, args) {
		this.source = source
		// source.interestWithin = true
		this.method = method
		this.args = args
	}, {
		getValue: function() {
			var method = this.method
			var args = this.args
			var variable = this
			return when(this.source.valueOf(), function(array, context) {
				if (variable.dependents) {
					array.forEach(function(object) {
						registerListener(object, context ? variable.for(context) : variable)
					})
				}
				if (context) {
					variable = variable.for(context)
				}
				return variable.value = array && array[method] && array[method].apply(array, args)
			})
		},
		updated: function(event, by, context) {
			if (by === this) {
				return Composite.prototype.updated.call(this, event, by, context)
			}
			var propagatedEvent = event.type === 'refresh' ? event : // always propagate refreshes
				this[this.method + 'Updated'](event, context)
			// TODO: make sure we normalize the event structure
			if (this.dependents && event.oldValue && typeof event.value === 'object') {
				deregisterListener(event.value, this)
			}
			if (this.dependents && event.value && typeof event.value === 'object') {
				registerListener(event.value, this)
			}
			if (propagatedEvent) {
				Composite.prototype.updated.call(this, propagatedEvent, by, context)
			}
		},
		filterUpdated: function(event, context) {
			if (event.type === 'delete') {
				var index = inContext(this.cachedValue || this.valueOf(), context).indexOf(event.oldValue)
				if (index > -1) {
					this.splice(index, 1)
				}
			} else if (event.type === 'add') {
				if ([event.value].filter(this.args[0]).length > 0) {
					inContext(this.push(event.value), context)
				}
			} else if (event.type === 'update') {
				var index = inContext(this.cachedValue || this.valueOf(), context).indexOf(event.object)
				var matches = [event.object].filter(this.args[0]).length > 0
				if (index > -1) {
					if (matches) {
						return {
							type: 'updated',
							object: event.object,
							index: index
						}
					} else {
						inContext(this.splice(index, 1), context)
					}
				}	else {
					if (matches) {
						inContext(this.push(event.object), context)
					}
					// else nothing mactches
				}
				return
			} else {
				return event
			}
		},
		mapUpdated: function(event) {
			return {
				type: event.type,
				value: [event.value].map(this.args[0])
			}
		},
		forDependencies: function(callback) {
			// depend on the args
			Composite.prototype.forDependencies.call(this, callback)
			callback(this.source)
		},
		getVersion: function(context) {
			return Math.max(Composite.prototype.getVersion.call(this, context), this.source.getVersion(context))
		}		
	})

	var Validating = lang.compose(Caching, function(target, schema) {
		this.target = target
		this.targetSchema = schema
	}, {
		forDependencies: function(callback) {
			Caching.prototype.forDependencies.call(this, callback)
			callback(this.target)
			callback(this.targetSchema)
		},
		getVersion: function(context) {
			return Math.max(Variable.prototype.getVersion.call(this, context), this.target.getVersion(context), this.targetSchema.getVersion(context))
		},
		getValue: function(context) {
			return doValidation(this.target.valueOf(context), this.targetSchema.valueOf(context))
		}
	})

	var Schema = lang.compose(Caching, function(target) {
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
			if (this.value) { // if it has an explicit schema, we can use that.
				return this.value
			}
			// get the schema, going through target parents until it is found
			return getSchema(this.target)
			function getSchema(target) {
				return when(target.valueOf(), function(value, context) {
					var schema
					return (value && value._schema) || (target.parent && (schema = target.parent.schema)
						&& (schema = schema.valueOf()) && schema[target.key])
				})
			}
		}
	})
	function validate(target) {
		var schemaForObject = schema(target)
		return new Validating(target, schemaForObject)
	}
	Variable.deny = deny
	Variable.noChange = noChange
	function addFlag(name) {
		Variable[name] = function(functionValue) {
			functionValue[name] = true
		}
	}
	addFlag(Variable, 'handlesContext')
	addFlag(Variable, 'handlesPromises')

	function observe(object) {
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
		return {
			remove: function() {
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

	function all(array) {
		// This is intended to mirror Promise.all. It actually takes
		// an iterable, but for now we are just looking for array-like
		if (array.length > -1) {
			return new Composite(array)
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
	function getForClass(Target, type) {
		var createInstance = this.constructor.ownedClasses && this.constructor.ownedClasses.get(Target)
		if (createInstance) {
			if (type === 'key') {
				return this
			}
			var ownedInstances = this.ownedInstances || (this.ownedInstances = new WeakMap())
			var instance = ownedInstances.get(Target)
			if (!instance) {
				ownedInstances.set(Target, instance = createInstance(this))
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
		getForClass: function(Class, type) {
			if (type === 'key') {
				return this
			}
			return Class.defaultInstance
		},
		contains: function() {
			return true // contains everything
		}
	}
	Variable.getValue = function() {
		// contextualized getValue
		var Class = this
		return new NeedsContext(function(context) {
			return (context && context.getForClass && context.getForClass(Class) || Class.defaultInstance).valueOf()	
		})
	}
	Variable.setValue = function(value, context) {
		// contextualized setValue
		var Class = this
		return new NeedsContext(function(context) {
			return (context && context.getForClass && context.getForClass(Class) || Class.defaultInstance).put(value)
		})
	}
	Variable.generalize = generalizeClass
	Variable.call = Function.prototype.call // restore these
	Variable.apply = Function.prototype.apply
	Variable.extend = function(properties) {
		// TODO: handle arguments
		var Base = this
		function ExtendedVariable() {
			if (this instanceof ExtendedVariable) {
				return Base.apply(this, arguments)
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
	Variable.updated = function(updateEvent, by, context) {
		context = context && this.getKeyContext(context)
		return Variable.prototype.updated.call(this, updateEvent, by, context)
	}
	Variable.getKeyContext = function(context) {
		return context.getForClass(this, 'key') || context
	}
	Object.defineProperty(Variable, 'defaultInstance', {
		get: function() {
			return this.hasOwnProperty('_defaultInstance') ?
				this._defaultInstance : (
					this._defaultInstance = new this(),
					this._defaultInstance.context = defaultContext,
					this._defaultInstance)
		}
	})
	Variable.hasOwn = hasOwn
	Variable.all = all
	Variable.objectUpdated = objectUpdated
	Variable.observe = observe
	Variable.NeedsContext = NeedsContext

	return Variable
});