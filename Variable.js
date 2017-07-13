(function (root, factory) { if (typeof define === 'function' && define.amd) {
	define(['./util/lang'], factory) } else if (typeof module === 'object' && module.exports) {				
	module.exports = factory(require('./util/lang')) // Node
}}(this, function (lang) {
	var deny = {}
	var noChange = {}
	var context
	var WeakMap = lang.WeakMap
	var setPrototypeOf = Object.setPrototypeOf || (function(base, proto) { base.__proto__ = proto})
	var getPrototypeOf = Object.getPrototypeOf || (function(base) { return base.__proto__ })
	var isGenerator = lang.isGenerator
	var undefined // makes it faster to be locally scoped
	// update types
	var RequestChange = 3
	var RequestSet = 4
	var NOT_MODIFIED = {}

	var propertyListenersMap = new WeakMap(null, 'propertyListenersMap')
	var isStructureChecked = new WeakMap()
	var nextVersion = Date.now()

	var CacheEntry = lang.compose(WeakMap, function() {
	},{
		_propertyChange: function(propertyName) {
			this.variable._propertyChange(propertyName, contextFromCache(this))
		}
	})
	var listenerId = 1

	function when(value, callback, errback) {
		if (value && value.then) {
			return value.then(callback, errback)
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
		executeWithin: function(executor) {
			var previousContext = context
			try {
				context = this
				return executor()
			} finally {
				context = previousContext
			}
		},
		//version: 2166136261, // FNV-1a prime seed
		version: 0,
		restart: function() {
			//this.version = 2166136261
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
			this.setVersion(context.version)
			this.setVersion(Math.max(contextualized.version || 0, contextualized.versionWithChildren || 0))
		},
		setVersion: function(version) {
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
			
			// a fast, efficient hash
			//return this.version = (this.version ^ (version || 0)) * 1049011 + (this.version / 5555555 >>> 0)
			// if we are using globally monotonically increasing version, we can just use max
			if (isNaN(version)) {
				throw new Error('Bad version')
			}
			return this.version = Math.max(this.version, version)
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

	var whenAll = lang.whenAll

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

	function assignPromise(variable, promise, callback) {
		var isSync
		promise.then(function(value) {
			if (isSync !== false) {
				// synchronous resolution
				isSync = true
			} else if (variable.promise === promise) {
				// async resolution make sure we are the still the most recent promise
				variable.promise = null
			} else {
				// if async and we are not the most recent, just return
				return
			}
			if (callback) { // custom handler
				callback(value) 
			} else {
				variable.value = value
			}
		}, function(error) {
			if (isSync !== false) {
				// synchronous resolution
				isSync = true
			} else if (variable.promise === promise) {
				// async resolution make sure we are the still the most recent promise
				variable.promise = null
			} else {
				// if async and we are not the most recent, just return
				return
			}
			variable.error = error
		})
		if (!isSync) {
			isSync = false
			variable.promise = promise
		}
		return promise
	}

	function Variable(value) {
		if (this instanceof Variable) {
			// new call, may eventually use new.target
			if (value !== undefined) {
				if (value && value.then && !value.notifies) {
					assignPromise(this, value)
				} else {
					this.value = value
				}
			}
		} else {
			return Variable.with(value)
		}
	}

	Variable._logStackTrace = function(v) {
		var stack = (new Error().stack || '').split(/[\r\n]+/)
		if (stack[0] && /^Error\s*/.test(stack[0])) stack.shift()
		if (stack[0] && /_logStackTrace/.test(stack[0])) stack.shift()
		var coalesce = (this._debugOpts && this._debugOpts.coalesce) || []
		if (this._debugOpts && this._debugOpts.shortStackTrace) {
			// find the first non-coalesced line
			var line
			stack.some(function(line) {
				if (!coalesce.some(function(re) {
					return re.re.test(line)
				})) {
					line = stack[0]
				}
			})
			console.log('Variable ' + v.__debug + ' changed', line && line.replace(/^\s+/, ''))
		} else {
			if (coalesce.length) {
				var s = []
				var re
				for (var i = 0; i < stack.length; i++) {
					var line = stack[i]
					if (re) {
						if (re.test(line)) continue
						re = null
					}
					re
					coalesce.some(function(re) {
						return re = re.re.test(line)
					})
					line = line.replace(/^\s+/,'')
					if (re) {
						s.push('(' + re.name + ') ' + line)
						re = re.re
					} else {
						s.push(line)
					}
				}
				stack = s
			}
			var stackObject = this._debugOpts && this._debugOpts.stackObject
			if (stackObject) {
				console.log('Variable ' + v.__debug + ' changed', stack)
			} else {
				console.log('Variable ' + v.__debug + ' changed\r\n' + stack.join('\r\n'))
			}
		}
	}

	Variable._debugOpts = {
		coalesce: [{ name: 'alkali', re: /\/alkali\// }, { name: 'Promise', re: /(Promise\.)|(PromiseArray\.)|(\/bluebird\/)/ }],
		stackObject: false
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
		valueOf: function() {
			return this.gotValue(true, this.getValue(true))
		},
		then: function(onFulfilled, onRejected) {
			var result = this.gotValue(false, this.getValue())
			if (!result || !result.then) {
				result = new lang.SyncPromise(result) // ensure it is promise-like
			}
			if (onFulfilled || onRejected) { // call then if we have any callbacks
				return result.then(onFulfilled, onRejected)
			}
			return result
		},
		getValue: function(sync, forModification, forChild) {
			if (context) {
				context.setVersion(forChild ? this.version : Math.max(this.version || 0, this.versionWithChildren || 0))
			}
			if (this.parent) {
				if (context) {
					if (context.ifModifiedSince != null) {
						// just too complicated to handle NOT_MODIFED objects for now
						// TODO: Maybe handle this and delegate NOT_MODIFIED through this
						// chain and through gotValue
						context.ifModifiedSince = undefined 
					}
				}
				var key = this.key
				var property = this
				var parent = this.parent
				var object
				if (parent.getValue) {
					// parent needs value context, might want to do separate context,
					// but would need to treat special so it retrieves the version
					// only and not the versionWithChildren
					object = parent.getValue(sync, forModification, true)
				} else {
					object = parent.value
				}
				if (!sync && object && object.then && !object.notifies) {
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
				return value
			}
			if (this.promise) {
				if (sync) {
					if (context) {
						context.notResolvedYet = true
					}
				} else { // async mode, we are fine with waiting
					return this.promise
				}
			}
			return this.hasOwnProperty('value') ?
				this.value :
				forModification ? (this.value = lang.deepCopy(this.default && this.default.valueOf())) : this.default
		},
		gotValue: function(sync, value) {
			var previousNotifyingValue = this.returnedVariable
			var variable = this
			if (previousNotifyingValue) {
				if (value === previousNotifyingValue) {
					// nothing changed, immediately return valueOf
					return sync ? value.valueOf() : value.then()
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
				if (sync) {
					value = value.valueOf()
				}
			}
			if (!sync && value && value.then) {
				var deferredContext = context
				return value.then(function(value) {
					if (value && value.subscribe) {
						if (deferredContext) {
							return deferredContext.executeWithin(function() {
								return Variable.prototype.gotValue.call(variable, sync, value)
							})
						} else {
							return Variable.prototype.gotValue.call(variable, sync, value)							
						}
					}
					return value
				})
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
		_changeValue: function(type, newValue) {
			var key = this.key
			var parent = this.parent
			if (!parent) {
				return this.put(newValue, context)
			}
			var variable = this
			var object = parent.getValue ? parent.getValue(true, true, true) : parent.value
			if (object == null) {
				// nothing there yet, create an object to hold the new property
				parent.put(object = typeof key == 'number' ? [] : {})
			} else if (typeof object != 'object') {
				// if the parent is not an object, we can't set anything (that will be retained)
				var error = new Error('Can not set property on non-object')
				error.deniedPut = true
				throw error

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
					if (newValue && newValue.then && !newValue.notifies) {
						newValue = assignPromise(this, newValue, function(value) {
							object[key] = value
						})
					} else {
						object[key] = newValue
					}
					// or set the setter/getter
				}
			}
			var event = new RefreshEvent()
			event.oldValue = oldValue
			event.target = variable
			variable.updated(event, variable)

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
						listener._propertyChange(key, object, type)
					}
				}
			}
			return newValue
		},

		_propertyChange: function(propertyName, object, type) {
			if (this.onPropertyChange) {
				this.onPropertyChange(propertyName, object)
			}
			this.updated(new PropertyChangeEvent(propertyName, new RefreshEvent(), this))
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

		version: 0,
		versionWithChildren: 0,

		updateVersion: function(version) {
			this.version = nextVersion = Math.max(Date.now(), nextVersion + 1)
		},

		getVersion: function() {
			return Math.max(this.version,
				this.returnedVariable && this.returnedVariable.getVersion ? this.returnedVariable.getFullVersion(context) : 0,
				this.parent ? this.parent.getVersion(context) : 0)
		},
		getFullVersion: function() {
			return Math.max(this.versionWithChildren, this.getVersion())
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

		updated: function(updateEvent, by, isDownstream) {
			if (!updateEvent) {
				updateEvent = new RefreshEvent()
				updateEvent.source = this
			}
			if (updateEvent.visited.has(this)){
				// if this event has already visited this variable, skip it
				return updateEvent
			}
			updateEvent.visited.add(this)
			if (this.__debug) {
				// debug is on
				Variable._logStackTrace(this)
			}

			/*var contextualInstance = context && context.getContextualized(this)
			if (contextualInstance) {
				contextualInstance.updated(updateEvent, this)
			}

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
				this.versionWithChildren = Math.max(Date.now(), nextVersion + 1)
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
							dependent.updated(updateEvent.childEvent, variable, true)
						}
					} else {
						dependent.updated(updateEvent, variable, true)
					}
				}
			}
			if (updateEvent instanceof PropertyChangeEvent) {
				if (this.returnedVariable && this.fixed) {
					this.returnedVariable.updated(updateEvent, this)
				}
				if (this.constructor.collection) {
					this.constructor.collection.updated(updateEvent, this)
				}
			}
			if (this.parent) {
				this.parent.updated(new PropertyChangeEvent(this.key, updateEvent, this.parent), this)
			}
			if (this.collection) {
				this.collection.updated(updateEvent, this)
			}
			return updateEvent
		},

		invalidate: function() {
			// for back-compatibility for now
			this.updated()
		},

		notifies: function(target) {
			if (!target) {
				throw new Error('No listener provided for notification')
			}
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
					variable.then(function(value) {
						listener.next(value)
					}, function(error) {
						listener.error(value)
					})
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
		put: function(value) {
			var variable = this
			if (this.parent) {
				return this._changeValue(RequestChange, value)
			}
			var oldValue = this.getValue ? this.getValue(true) : this.value
			if (oldValue === value && typeof value != 'object') {
				return noChange
			}
			if (oldValue && oldValue.put &&
					// if it is set to fixed, we see we can put in the current variable
					(variable.fixed || !(value && value.put))) {
				try {
					return oldValue.put(value)
				} catch (error) {
					if (!error.deniedPut) {
						throw error
					}// else if the put was denied, continue on and set the value on this variable
				}
			}
			if (value && value.then && !value.notifies) {
				value = assignPromise(this, value)
			} else {
				variable.value = value
			}
			var event = new RefreshEvent()
			event.oldValue = oldValue
			event.target = variable
			variable.updated(event, variable)
			return value
		},
		get: function(key) {
			if (this[key] || (this._properties && this._properties[key])) {
				return this.property(key).valueOf()
			}
			var object = this.getValue(true)
			if (!object) {
				return
			}
			if (typeof object.get === 'function') {
				return object.get(key)
			}
			var value = object[key]
			if (value && value.notifies) {
				// nested variable situation, get underlying value
				return value.valueOf()
			}
			return value
		},
		set: function(key, value) {
			// TODO: create an optimized route when the property doesn't exist yet
			this.property(key)._changeValue(RequestSet, value)
		},
		undefine: function(key) {
			this.set(key, undefined)
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
			return this.value = value
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
			return String(this.valueOf())
		},
		forEach: function(callbackOrItemClass, callback) {
			// iterate through current value of variable
			if (callbackOrItemClass.notifies) {
				return this.forEach(function(item) {
					var itemVariable = callbackOrItemClass.from(item)
					callback.call(this, itemVariable)
				}, context)
			}
			var collectionOf = this.collectionOf
			if (collectionOf) {
				var variable = this
				return when(this.valueOf(), function(value) {
					if (value && value.forEach) {
						value.forEach(function(item, index) {
							callbackOrItemClass.call(variable, variable.property(index, collectionOf))
						})
					}
				})
			}
			return when(this.valueOf(callback), function(value) {
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
				this.__debug = this.name || (Math.random() + '').slice(2)
			}
			return this.__debug
		},
		set _debug(_debug) {
			this.__debug = _debug
		},
		get _lastUpdated() {
			return new Date(this.getVersion())
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
								this[key]._changeValue(RequestSet, value)
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
			var variable = this
			var collectionOf = this.collectionOf
			if (collectionOf) {
				var parent = this
				var i = 0
				return {
					next: function() {
						var result = iterator.next()
						if (!result.done) {
							result.value = variable.property(i++, collectionOf)
						}
						return result
					}
				}
			}
			return iterator
		}
	}

	var VMap = Variable.VMap = lang.compose(Variable, function(value){
		if (typeof value !== 'undefined') {
			this.value = value
		}
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
		if (source !== undefined || sources) {
			this.source = source
		}
		if (transform) {
			this.transform = transform
			if (sources) {
				for (var i = 1, l = sources.length; i < l; i++) {
					this['source' + i] = sources[i]
				}
			}
		}
	}, {
		getValue: function(sync) {
			// first check to see if we have the variable already computed
			if (this.readyState == 'invalidated') {
				this.readyState = nextVersion.toString()
			} else if (isFinite(this.readyState)) {
				// will un-invalidate this later (contextualizedVariable.readyState = 'up-to-date')
			} else if ((this.listeners || this.staysUpdated) && this.cachedVersion > -1) {
				// it is live, so we can shortcut and just return the cached value
				if (context) {
					context.setVersion(this.cachedVersion)
				}
				if (sync) {
					if (this.promise && context) {
						context.notResolvedYet = true
					}
					return this.cachedValue
				} else {
					return this.promise || this.cachedValue
				}
			}
			if (!this.hasOwnProperty('source1') && context) {
				// TODO: Not sure if this is a helpful optimization or not
				// if we have a single source, we can use ifModifiedSince
					/*if (!contextualizedVariable && this.context && this.context.matches(context)) {
						contextualizedVariable = this
					}*/
			}
			var readyState = this.readyState
			let parentContext = context
			let transformContext = context = context ? context.newContext() : new Context()
			var args = []
			try {
				if (this.version) {
					// get the version in there
					transformContext.setVersion(this.version)
				}
				if (this && this.cachedVersion >= this.version && this.cachedVersion > -1 && !this.hasOwnProperty('source1')) {
					transformContext.ifModifiedSince = this.cachedVersion
				}
		 		var transform = this.transform && this.transform.valueOf()

				var argument, argumentName
				for (var i = 0; (argument = this[argumentName = i > 0 ? 'source' + i : 'source']) || argumentName in this; i++) {
					if (transformContext) {
						transformContext.nextProperty = argumentName
					}
					args[i] = (argument && sync) ? argument.valueOf() : argument // for async, `then` will be called in whenAll
				}
				var variable = this
	 			return whenAll(args, function(resolved) {
	 				if (transformContext.ifModifiedSince !== undefined) {
	 					transformContext.ifModifiedSince = undefined
	 				}
					var version = transformContext.version
					var notResolvedYet = transformContext.notResolvedYet
					if (notResolvedYet) {
						if (parentContext)
							parentContext.notResolvedYet = true 
						if (resolved[0] === undefined && resolved.length === 1) {
							variable.readyState = 'invalidated'
							return variable.cachedValue // always sync here
						}
					} else {
						if (variable.cachedVersion >= version || resolved[0] == NOT_MODIFIED) { // note that cached version can get "ahead" of `version` of all dependencies, in cases where the transform ends up executing an valueOf() that advances the resolution context version number. 
							// get it out of the cache
							if (parentContext) {
								parentContext.setVersion(version)
							}
							if (parentContext && parentContext.ifModifiedSince >= version && !variable.returnedVariable) {
								return NOT_MODIFIED
							}
							if (sync) {
								if (variable.promise && parentContext) {
									parentContext.notResolvedYet = true
								}
								return variable.cachedValue
							} else {
								return variable.promise || variable.cachedValue
							}
						}
						var finishedResolvingArgs = true
					}

					var result = transform ? transform.apply(variable, resolved) : resolved[0]
					var isPromise = result && result.then && !result.notifies
					version = transformContext.version

					if (finishedResolvingArgs) {
						if (isPromise) {
							variable.promise = result
							variable.cachedVersion = version
							result.then(function(resolved) {
								if (result === variable.promise) { // make sure we are still the latest promise
									variable.promise = null
									onResolve(resolved, transformContext.version)
								}
							}, function(error) {
								if (result === variable.promise) { // make sure we are still the latest promise
									// clear out the cache on an error
									variable.promise = null
									variable.lastError = error
									onResolve(null, 0)
								}
							})
						} else {
							onResolve(result, version)
						}
					}
					if (sync && isPromise) {
						if (parentContext) {
							parentContext.notResolvedYet = true 
						}
						// return what we have, stale or otherwise
						return variable.cachedValue
					}
					return result

					function onResolve(result, version) {
						if (variable.readyState === readyState) {
							if (parentContext) {
								parentContext.setVersion(version)
							}
							variable.readyState = 'up-to-date' // mark it as up-to-date now
							variable.cachedVersion = version
							variable.cachedValue = result
						}/* else {
							console.log('ready state different than when the variable trasnform started ', variable, variable.readyState, readyState)
						}*/
					}
				})
	 		} finally {
	 			context = parentContext
	 		}
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

		updated: function(updateEvent, by, isDownstream) {
			this.readyState = 'invalidated'
			if (this.promise) {
				this.promise = null
			}
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
			return Variable.prototype.updated.call(this, updateEvent, by, isDownstream)
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
		put: function(value) {
			var call = this
			return when(this.valueOf(), function(originalValue) {
				if (originalValue === value && typeof value != 'object') {
					return noChange
				}
				var transform = call.transform.valueOf()
				if (transform.reverse) {
					(transform.reverse).call(call, value, call.getArguments())
					call.updated()
				} else if (originalValue && originalValue.put) {
					return originalValue.put(value)
				} else {
					var error = new Error('Can not put value into a one-way transform, that lacks a reversal')
					error.deniedPut = true
					throw error
				}
			})
		},
		setReverse: function(reverse) {
			this.transform.valueOf().reverse = reverse
			return this
		}
	})

	var ContextualizedTransform = {
		getValue: function(sync) {
			// first check to see if we have the variable already computed
			var contextualizedVariable = context ? context.getContextualized(this) : this
			var readyState = null
			if (contextualizedVariable) {
				if (contextualizedVariable.readyState == 'invalidated')
					readyState = contextualizedVariable.readyState = nextVersion.toString()
				else if (isFinite(contextualizedVariable.readyState)) {
					// will un-invalidate this later (contextualizedVariable.readyState = 'up-to-date')
				} else if (contextualizedVariable.listeners && contextualizedVariable.cachedVersion > -1) {
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
				}
				readyState = contextualizedVariable.readyState
			}
			if (!transformContext) {
				transformContext = context ? context.newContext() : new Context()
			}
			// get the version in there
	 		transformContext.nextProperty = 'transform'
	 		var transform = this.transform && this.transform.valueOf(transformContext)
			var args = []
			if (this.version) {
				// get the version in there
				transformContext.setVersion(this.version)
			}
			if (contextualizedVariable && this.cachedVersion >= transformContext.version && contextualizedVariable.cachedVersion > -1 && !this.hasOwnProperty('source1')) {
				transformContext.ifModifiedSince = contextualizedVariable.cachedVersion
			}
			var argument, argumentName
			for (var i = 0; (argument = this[argumentName = i > 0 ? 'source' + i : 'source']) || argumentName in this; i++) {
				if (transformContext) {
					transformContext.nextProperty = argumentName
				}
				args[i] = argument && (
					sync ? argument.valueOf(transformContext) :
						argument.then(null, null, transformContext))
			}
	 		var variable = this
 			return whenAll(args, function(resolved) {
 				if (transformContext.ifModifiedSince !== undefined) {
 					transformContext.ifModifiedSince = undefined
 				}
				var contextualizedVariable = transformContext.contextualize(variable, context)
				var version = transformContext.version
				if (contextualizedVariable && contextualizedVariable.cachedVersion === version) {
					// get it out of the cache
					contextualizedVariable.readyState = 'up-to-date' // mark it as up-to-date now
					if (context && context.ifModifiedSince >= version && !contextualizedVariable.returnedVariable) {
						return NOT_MODIFIED
					}

					return contextualizedVariable.cachedValue
				}
				if (resolved[0] == NOT_MODIFIED) {
					throw new Error('A not-modified signal was passed to a transform, which usually means a version number was decreased (they must monotically increase), computed version' + version +
						' this variable version: ' + contextualizedVariable.version + ' cached version: ' +
						contextualizedVariable.cachedVersion + ' ifModifiedSince: ' +
						transformContext.ifModifiedSince +
						' source version: ' + contextualizedVariable.source.version +
						' source cached version: ' + contextualizedVariable.source.cachedVersion)
				}
				var result = transform ? transform.apply(variable, resolved) : resolved[0]
				// an empty ready state means it is up-to-date as well
				if (readyState == contextualizedVariable.readyState || readyState === null) {
					if (contextualizedVariable.readyState)
						contextualizedVariable.readyState = 'up-to-date' // mark it as up-to-date now
					// cache it
					if (result && result.then && !result.notifies) {
						result.then(function() {
							// if it was a generator then the version could have been computed asynchronously as well
							contextualizedVariable.cachedVersion = transformContext.version
						}, function() {
							// clear out the cache on an error
							contextualizedVariable.cachedValue = null
							contextualizedVariable.cachedVersion = 0
						})
						if (sync) // should we return the stale data if we are in sync mode?
							return contextualizedVariable.cachedValue
					} else {
						contextualizedVariable.cachedVersion = transformContext.version
						contextualizedVariable.cachedValue = result
					}
				}
				return result
			})
		},

	}

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
			var context = subject.getContextualized ? subject : new Context(subject)
			var generic = this.generic
			return context.executeWithin(function() {
				return generic.valueOf()
			})
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
			valueOf: function() {
				var resuming
				return next
				function next() {
					var nextValue
					var i
					var generatorIterator
					var isThrowing
					if (resuming) {
						// resuming from a promise
						generatorIterator = resuming.iterator
						i = resuming.i
						nextValue = resuming.value
						if (nextValue && nextValue.then) {
							throw new Error('Generator resumed with promise or variable', nextValue)
						}
						isThrowing = resuming.isThrowing
					} else {
						if (context) {
							// must restart the context, if the input values had previously been checked and hashed against this context, must restart them.
							context.restart()
						}
						i = 0
						generatorIterator = this.generator()
					}

					do {
						var stepReturn = generatorIterator[isThrowing ? 'throw' : 'next'](nextValue)
						if (stepReturn.done) {
							var oldSources = this.sources || []
							var newLength = i
							var newSources = []
							while(this[argumentName = i > 0 ? 'source' + i : 'source']) {
								// clear out old properties
								this[argumentName] = undefined
								i++
							}
							for (i = 0; i < newLength; i++) {
								// create new array
								var argumentName = i > 0 ? 'source' + i : 'source'
								if (this[argumentName] && this[argumentName].notifies) {
									newSources.push(this[argumentName])
								}
							}
							for (i = 0; i < oldSources.length; i++) {
								if (newSources.indexOf(oldSources[i]) == -1) {
									oldSources[i].stopNotifies(this)
								}
							}
							this.sources = newSources
							return stepReturn.value
						}
						nextValue = stepReturn.value
						// compare with the arguments from the last
						// execution to see if they are the same
						try {
							var argumentName = i > 0 ? 'source' + i : 'source'
							if (this[argumentName] !== nextValue || this[argumentName] === undefined) {
								// subscribe if it is a variable
								if (nextValue && nextValue.notifies) {
									if (this.listeners) {
										nextValue.notifies(this)
									}
									this[argumentName] = nextValue
								} else if (typeof nextValue === 'function' && isGenerator(nextValue)) {
									resuming = {
										i: i,
										iterator: nextValue()
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
							if (nextValue && nextValue.then) {
								// if it is a promise or variable, we will wait on it
								var variable = this
								resuming = {
									i: i,
									iterator: generatorIterator
								}
								var deferredContext = context
								var isSync = null
								// and return the promise so that the next caller can wait on this
								var promise = nextValue.then(function(value) {
									if (isSync !== false) {
										isSync = true
										nextValue = value
										return
									}
									resuming.value = value
									if (deferredContext) {
										return deferredContext.executeWithin(next.bind(variable))
									}
									return next.call(variable)
								}, function(error) {
									resuming.value = error
									resuming.isThrowing = true
									if (deferredContext) {
										return deferredContext.executeWithin(next.bind(variable))
									}
									return next.call(variable)
								})
								if (!isSync) {
									isSync = false
									return promise
								}
							}
							isThrowing = false
						} catch (error) {
							isThrowing = true
							nextValue = error
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
			return target && target.validate(target, target.schema)
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
		if (array instanceof Array) {
			if (array.length > 1000) {
				 //throw new Error('too big')
			}
			if (array.length > 0 || typeof transform === 'function') {
				// TODO: Return VArray Transform
				return new Transform(array[0], typeof transform === 'function' ? transform : argsToArray, array)
			} else {
				return new VArray([])
			}
		}
		if (arguments.length > 1) {
			// support multiple arguments as an array
			return new Transform(arguments[0], argsToArray, arguments).as(VArray)
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
	Variable.valueOf = function() {
		// contextualized valueOf
		return instanceForContext(this, context).valueOf()
	}
	Variable.then = function(callback, errback) {
		// contextualized valueOf
		return instanceForContext(this, context).then(callback, errback)
	}
	Variable.getValue = function(sync) {
		// contextualized getValue
		return instanceForContext(this, context)
	}
	Variable.put = function(value) {
		// contextualized setValue
		return instanceForContext(this, context).put(value)
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
	Variable.updated = function(updateEvent, by) {
		return instanceForContext(this, context).updated(updateEvent, by)
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
	Variable.nextVersion = Date.now()
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
					return when(variable.put(value), function() {
						return returnValue
					})
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
		valueOf: function() {
			return this.then()
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
		all: all,
		objectUpdated: objectUpdated,
		reactive: reactive,
		NOT_MODIFIED: NOT_MODIFIED
	}
	Object.defineProperty(exports, 'currentContext', {
		get: function() {
			return context
		}
	})
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
		property.parent ? property._changeValue(RequestSet, value) : property.put(value)
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
				// already an array
				//array = this._mappedItems(array)
			} else if (isStrictArray) {
				array = []
			} else {
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
			var source = this.source
			var collectionOf = source && source.collectionOf
			return collectionOf ? array.map(function(item, i) {
				var wrapped = collectionOf.from(item)
				wrapped.collection = source
				return wrapped
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
		updated: function(event, by, isDownstream) {
			if (!event || event.modifier === this || (event.modifier && event.modifier.constructor === this)) {
				return Transform.prototype.updated.call(this, event, by)
			}
			var contextualizedVariable = context && context.getContextualized(this) || this
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
				var object = event.parent.valueOf()
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
				return Transform.prototype.updated.call(this, event, by, isDownstream)
			}
		}
	}, VArray)
	defineArrayMethod('map', function Mapped(source) {
		this._isStrictArray = source._isStrictArray
	}, {
		transform: function(array) {
			var isStrictArray = this.source && this.source._isStrictArray
			var mapFunction = this.arguments[0]
			if (array && array.map) {
				var source = this.source
				var collectionOf = source && source.collectionOf
				return array.map(collectionOf ? function(item, i) {
					return mapFunction(source.property(i), i)
				} : mapFunction)
			} else if (!isStrictArray) {
				if (method === 'map'){
					// fast path, and special behavior for map
					return mapFunction(array)
				}
			}
			return IterativeMethod.prototype.transform.call(this, array)
		},
		updated: function(event, by, isDownstream) {
			if (!event || event.modifier === this || (event.modifier && event.modifier.constructor === this)) {
				return Variable.prototype.updated.call(this, event, by)
			}
			var contextualizedVariable = context && context.getContextualized(this) || this
			if (event.type === 'delete') {
				contextualizedVariable.splice(event.previousIndex, 1)
			} else if (event.type === 'add') {
				var array = contextualizedVariable.cachedValue
				contextualizedVariable.push(this.arguments[0].call(this.arguments[1], this.source.property(array && array.length)))
			} else if (event.type === 'update') {
				if (this.getCollectionOf()) {
					return // if it has typed items, we don't need to propagate update events, since they will be handled by the variable item.
				}
				var object = event.parent.valueOf()
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
					contextualizedVariable.splice(index, 1, this.arguments[0].call(this.arguments[1], this.source.property(index)))
				} else {
					return Transform.prototype.updated.call(this, event, by, isDownstream)
				}
			} else {
				return Transform.prototype.updated.call(this, event, by, isDownstream)
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
