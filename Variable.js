(function (root, factory) { if (typeof define === 'function' && define.amd) {
	define(['./util/lang'], factory) } else if (typeof module === 'object' && module.exports) {
	module.exports = factory(require('./util/lang')) // Node
}}(this, function (lang) {
	var deny = {}
	var noChange = {}
	var context
	var WeakMap = lang.WeakMap
	var Map = lang.Map
	var Set = lang.Set
	var setPrototypeOf = lang.setPrototypeOf
	var getPrototypeOf = Object.getPrototypeOf || (function(base) { return base.__proto__ })
	var isGenerator = lang.isGenerator
	var undefined // makes it faster to be locally scoped
	// update types
	var RequestChange = 3
	var RequestSet = 4
	var NOT_MODIFIED = {
		name: 'Not modified',
		toString: function () {
			return 'Marker for not-modified response'
		},
	}
	var GET_TYPED_ARRAY = {
		getTyped: true
	}
	var GET_TYPED_OR_UNTYPED_ARRAY = {
		getTyped: true,
		allowUntyped: true
	}
	var GET_VALID_TYPE = {
		ensureValidType: true
	}

	var propertyListenersMap = new lang.WeakMap(null, 'propertyListenersMap')
	var isStructureChecked = new lang.WeakMap()
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

	function Context(subject, notifies){
		this.subject = subject
		if (notifies) {
			this.notifies = notifies
		}
	}
	Context.prototype = {
		constructor: Context,
		newContext: function(variable) {
			return new this.constructor(this.subject, this.notifies)
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
				var contextMap = variable._contextMap || (variable._contextMap = new lang.WeakMap())
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

	function UpdateEvent() {
		this.visited = new Set()
	}
	UpdateEvent.prototype.type = 'replaced'

	function ReplacedEvent(triggerEvent) {
		this.visited = triggerEvent ? triggerEvent.visited : new Set()
	}
	ReplacedEvent.prototype.type = 'replaced'

	function PropertyChangeEvent(key, propertyEvent, parent) {
		this.key = key
		this.propertyEvent = propertyEvent
		this.parent = parent
		this.visited = propertyEvent.visited
	}
	PropertyChangeEvent.prototype.type = 'property'

	function SplicedEvent(modifier, items, removed, start, deleteCount) {
		this.visited = new Set()
		this.modifier = modifier
		this.items = items
		this.removed = removed
		this.start = start
		this.deleteCount = deleteCount
	}
	SplicedEvent.prototype.type = 'spliced'
	function EntryEvent(key, value, entryEvent) {
		this.entryEvent = entryEvent
		this.visited = entryEvent.visited
		this.key = key
		this.value = value
	}
	EntryEvent.prototype.type = 'entry'
	EntryEvent.prototype.doesAffect = function(subject) {
		return this.value.constructor.for(subject).id.valueOf() == this.value.id.valueOf()
	}

	function DeletedEvent(key, value) {
		this.key = key
		this.value = value
		this.visited = new Set()
	}
	DeletedEvent.prototype.type = 'deleted'

	function AddedEvent(key, value) {
		this.key = key
		this.value = value
		this.visited = new Set()
	}
	AddedEvent.prototype.type = 'added'
	AddedEvent.prototype.doesAffect = function() {
		return false
	}

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
			return this.valueOf(true)
		},
		set _currentValue(value) {
			this.put(value)
		},
		constructor: Variable,
		valueOf: function(allowPromise) {
			var result = this.gotValue(this.getValue())
			return (allowPromise || !(result && result.then)) ? result : undefined
		},
		then: function(onFulfilled, onRejected) {
			var result = this.valueOf(true)
			var isAsyncPromise = result && result.then
			if (!isAsyncPromise) {
				result = new lang.SyncPromise(result) // ensure it is promise-like
			}
			if (onFulfilled || onRejected) { // call then if we have any callbacks
				if (isAsyncPromise && context) {
					// if it is async and we have a context, we will restore it for the callback
					var currentContext = context
					return result.then(onFulfilled && function(result) {
						return currentContext.executeWithin(function() {
							return onFulfilled(result)
						})
					}, onRejected && function(error) {
						return currentContext.executeWithin(function() {
							return onRejected(error)
						})
					})
				}
				return result.then(onFulfilled, onRejected)
			}
			return result
		},
		getValue: function(forChild) {
			if (context) {
				context.setVersion(forChild ? this.version : Math.max(this.version || 0, this.versionWithChildren || 0))
			}
			var key = this.key
			var parent
			if (key != null && (parent = this.parent) != null) {
				if (context) {
					if (context.ifModifiedSince != null) {
						// just too complicated to handle NOT_MODIFED objects for now
						// TODO: Maybe handle this and delegate NOT_MODIFIED through this
						// chain and through gotValue
						context.ifModifiedSince = undefined
					}
				}
				var property = this
				var object
				if (parent.getValue) {
					// parent needs value context, might want to do separate context,
					// but would need to treat special so it retrieves the version
					// only and not the versionWithChildren
					object = parent.getValue(true)
				} else {
					object = parent.value
				}
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
				return this.promise
			}
			var value = this.value
			return value !== undefined ?
				this.value : this.default
		},
		gotValue: function(value) {
			var previousNotifyingValue = this.returnedVariable
			var variable = this
			if (previousNotifyingValue) {
				if (value === previousNotifyingValue) {
					// nothing changed, immediately return valueOf
					if (context && context.ifModifiedSince > -1) // we don't want the nested value to return a NOT_MODIFIED
						context.ifModifiedSince = undefined
					return value.valueOf(true)
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
				if (context && context.ifModifiedSince > -1) // we don't want the nested value to return a NOT_MODIFIED
					context.ifModifiedSince = undefined
				value = value.valueOf(true)
			}
			if (value && value.then) {
				var deferredContext = context
				return value.then(function(value) {
					if (value) {
						if (value.__variable) {
							value = value.__variable
						}
						if (value.subscribe) {
							if (deferredContext) {
								return deferredContext.executeWithin(function() {
									return Variable.prototype.gotValue.call(variable, value)
								})
							} else {
								return Variable.prototype.gotValue.call(variable, value)
							}
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
		get isWritable() {
			return this.fixed ? !this.value || this.value.isWritable : this._isWritable
		},
		set isWritable(isWritable) {
			this._isWritable = isWritable
		},
		_isWritable: true,
		_propertyChange: function(propertyName, object, type) {
			if (this.onPropertyChange) {
				this.onPropertyChange(propertyName, object)
			}
			this.updated(new PropertyChangeEvent(propertyName, new ReplacedEvent(), this))
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
			var contextualizes, sources = [] // TODO: optimize this
			this.forDependencies(function(dependency) {
				var contextualized = dependency.notifies(variable)
				if (contextualized !== dependency) {
					contextualizes = true
				}
				sources.push(contextualized)
			})
/*			if (contextualizes) {
				var contextualized = new ContextualizedVariable()
				//context.instanceMap.set(this, contextualized)
				contextualized.sources = sources
				contextualized.init()
				return contextualized
			}
*/
			if (this.listeningToObject === null) {
				// we were previously listening to an object, but it needs to be restored
				// calling valueOf will cause the listening object to be restored
				this.valueOf()
			}
			return this
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
			var now = Date.now()
			this.version = nextVersion = nextVersion < now ? now :
				nextVersion + ((nextVersion > now + 500) ? 0.0003 : 1)
			if (nextVersion > now && ((nextVersion - now) % 600000) == 0)
				console.warn('Version/timestamp has drifted ahead of real time by', (nextVersion - now) / 1000, 'seconds')
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
					if (since.type === 'replaced') {
						// if it was refresh, we can clear any prior entries
						updates = []
					}
					updates.push(since)
				}
			}
			return updates
		},

		_initUpdate: function(updateEvent, isDownstream) {
			if (!updateEvent.version) {
				var now = Date.now()
				updateEvent.version = nextVersion = nextVersion < now ? now :
					nextVersion + ((nextVersion > now + 500) ? 0.001 : 1)
				if (nextVersion > now && (nextVersion - now) % 600000 == 0)
					console.warn('Version/timestamp has drifted ahead of real time by', (nextVersion - now) / 1000, 'seconds')
			}
			if (updateEvent instanceof PropertyChangeEvent) {
				this.versionWithChildren = updateEvent.version
			} else if (!isDownstream) {
				this.version = updateEvent.version
			}
			return updateEvent
		},

		updated: function(updateEvent, by, isDownstream) {
			if (!updateEvent) {
				updateEvent = new ReplacedEvent()
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
					nextUpdateMap = this.nextUpdateMap = new lang.WeakMap()
				}
				nextUpdateMap.set(this.lastUpdate, updateEvent)
			}

			this.lastUpdate = updateEvent */
			this._initUpdate(updateEvent, isDownstream)
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
							dependent.updated(updateEvent.propertyEvent, variable)
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
				var Class = this.constructor
				var variable = this
				if (Class.collection) {
					Class.collection.updated(new EntryEvent(this.id, this, updateEvent))
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
			// TODO: Eventually we want this to be trigerred from context, but context gets shared with returned variables, so will need to handle that
			if (!target) {
				throw new Error('No listener provided for notification')
			}
			var listeners = this.listeners
			if (!listeners || !this.hasOwnProperty('listeners')) {
				var variable = this.init()
				variable.listeners = listeners = [target]
				return variable
			} else if (listeners.indexOf(target) === -1) {
				listeners.push(target)
			}
			return this
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
						return new Context(null, true).executeWithin(function() {
							return variable.valueOf(true)
						})
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
		put: function(value, event) {
			if (this.parent && this.key !== undefined) {
				return changeValue(this, RequestChange, value, event)
			}
			var oldValue = this.getValue ? this.getValue() : this.value
			if (oldValue === value && typeof value != 'object') {
				return noChange
			}
			if (oldValue && oldValue.put) {
				// if it is set to fixed, we see we can put in the current variable
				if (this.fixed || !(value && value.put)) {
					try {
						return oldValue.put(value)
					} catch (error) {
						if (!error.deniedPut) {
							throw error
						}// else if the put was denied, continue on and set the value on this variable
					}
				}
			}
			if (value && value.then && !value.notifies) {
				value = assignPromise(this, value)
			} else {
				this.value = value
				if (value && value.put) {
					// preserve a reference to the original variable so we can `save()` back into it
					this.copiedFrom = value
				}
			}
			event = event || new ReplacedEvent()
			event.oldValue = oldValue
			event.target = this
			this.updated(event, this)
			return value
		},
		get: function(key) {
			if (this[key] || (this._properties && this._properties[key])) {
				return this.property(key).valueOf(true)
			}
			var object = this.getValue()
			if (!object) {
				return
			}
			if (typeof object.get === 'function') {
				return object.get(key)
			}
			var value = object[key]
			if (value && value.notifies) {
				// nested variable situation, get underlying value
				return value.valueOf(true)
			}
			return value
		},
		set: function(key, value, event) {
			// TODO: create an optimized route when the property doesn't exist yet
			changeValue(this.property(key), RequestSet, value, event)
		},
		undefine: function(key) {
			this.set(key, undefined)
		},
		is: function(newValue, event) {
			if (this.parent) {
				var parent = this.parent
				var key = this.key
				var object = (parent.getValue ? parent.getValue(true) : parent.value)
				var parentEvent = new PropertyChangeEvent(key, event || new ReplacedEvent(), parent)
				if (object) {
					object[key] = newValue
					this.updated(parentEvent, this)
				} else {
					object = (typeof key === 'number' ? [] : {})
					object[key] = newValue
					parent.is(object, parentEvent)
				}
				return this
			}
			this.fixed = true

			this.value = newValue
			this.updated(new ReplacedEvent(), this)
			return this
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
		save: function() {
			if (this.copiedFrom) {
				this.copiedFrom.put(this.valueOf())
				return true
			} else {
				return false
			}
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
		to: function (transformFunction, reverse) {
			if (typeof transformFunction !== 'function') {
				if (typeof transformFunction === 'object') {
					this.to(transformFunction.get, transformFunction.set)
				}
				throw new Error('No function provided to transform')
			}
			if (reverse) {
				transformFunction.reverse = function(value, args) {
					// for direct to, we can just use the first argument
					return reverse.call(this, value, args[0])
				}
			}
			if (transformFunction.prototype instanceof Variable) {
				return new transformFunction(this)
			}
			return new (this._Transform || Transform)(this, transformFunction)
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
			var instance = new Class(this)
			instance.fixed = true
			return instance
		},
		whileResolving: function(valueUntilResolved, useLastValue) {
			return valueUntilResolved || arguments.length > 0 ? new WhileResolving(this, valueUntilResolved, useLastValue) :
				new WhileResolving(this, undefined, true) // for zero arguments we default to the last value
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
			return this.collectionOf || this.returnedVariable && this.returnedVariable.collectionOf || this.constructor.collectionOf
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

	function changeValue(variable, type, newValue, event) {
		var key = variable.key
		var parent = variable.parent
		if (!parent) {
			return variable.put(newValue, event)
		}
		var object = parent.getValue ? parent.getValue(true) : parent.value
		if (object != null) {
			if (typeof object != 'object') {
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
		}
		if (object && typeof object.set === 'function') {
			object.set(key, newValue, event)
		} else {
			if (type == RequestChange && oldValue && oldValue.put && (!newValue && newValue.put)) {
				// if a put and the property value is a variable, assign it to that.
				return oldValue.put(newValue, event)
			} else {
				if (newValue && newValue.then && !newValue.notifies) {
					// wait for it to resolve and then assign
					return newValue.then(function(newValue) {
						return changeValue(variable, type, newValue, event)
					})
				} else {
					// copy, if this is a copy-on-write variable
					// nothing there yet, create an object to hold the new property
					var newObject = object == null
						? typeof key == 'number' ? [] : {}
						: parent.isWritable
							? lang.copy(
								object.constructor === Object
								?	{}
								:	object.constructor === Array
									?	[]
									: Object.create(Object.getPrototypeOf(object)), object)
							: object
					newObject[key] = newValue
				}
				// or set the setter/getter
			}
			event = event || new ReplacedEvent()
			var parentEvent = new PropertyChangeEvent(key, event, variable)
			parentEvent.oldValue = oldValue
			parentEvent.target = variable
			return when(newObject === object ?
					parent.updated(parentEvent, variable) :
					parent.put(newObject, parentEvent), function() {
				variable.updated(event, variable)
			})
		}
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
					listener.updated(event)
				}
			}
		}
		return newValue
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
			if (!ExtendedVariable) {
				ExtendedVariable = function() {
					if (this instanceof ExtendedVariable) {
						Base.apply(this, arguments)
					} else {
						return ExtendedVariable.with(properties)
					}
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
		function toType(value) {
			if (typeof value === 'object') {
				if (value instanceof Array) {
					return value[0] ? VArray.of(toType(value[0])) : VArray
				} else {
					return Variable.with(value)
				}
			} else if (typeof value === 'string') { // primitive values
				return VString(value)
			} else if (typeof value === 'number') {
				return VNumber(value)
			} else if (typeof value === 'boolean') {
				return VBoolean(value)
			} else if (typeof value === 'function') {
				return value // hopefully another type
			} else {
				return Variable
			}
		}
		if (typeof properties !== 'object') {
			this.prototype.default = properties
			return this
		}
		for (var key in properties) {
			var descriptor = Object.getOwnPropertyDescriptor(properties, key)
			var value = descriptor.value
			if (typeof value !== 'function' && !this.isPrimitive) {
				value = toType(value)
				if (value.prototype.default !== undefined) {
					if (!prototype.hasOwnProperty('default')){
						prototype.default = prototype.default ? Object.create(prototype.default) : {}
					}
					prototype.default[key] = value.prototype.default
				}
			}
			if (typeof value === 'function' && key !== 'collectionOf') {
				if (value.notifies) {
					// variable class
					function getDescriptor(key, Class) {
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
								changeValue(this[key], RequestSet, value)
							},
							enumerable: true
						}
					}
					var descriptor = getDescriptor(key, value)
					Object.defineProperty(prototype, key, descriptor)
					try {
						Object.defineProperty(this, key, descriptor)
					} catch(error) {
						console.warn('Unable to define property', key)
					}
					continue
				} else if (isGenerator(value)) {
					descriptor = getGeneratorDescriptor(value)
				} else if (value.defineAs) {
					descriptor = value.defineAs(key, this)
					if (!descriptor) {
						continue
					}
				} else {
					value = generalizeMethod(value, key)
				}
			}
			Object.defineProperty(prototype, key, descriptor)
			if (value !== undefined) {
				if (key in this) {
					Object.defineProperty(this, key, { value: value, configurable: true, enumerable: true })
				} else {
					this[key] = value
				}
				prototype.default
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
		var instanceMap = new lang.WeakMap()
		instanceMap.createInstance = createInstance
		var subjectMap = this.ownedClasses || (this.ownedClasses = new lang.WeakMap())
		subjectMap.set(Target, instanceMap)
	}


	function arrayToModify(variable, callback) {
		return when(variable.cachedValue || variable.valueOf(true), function(array) {
			// if there is a typed array
			var typedArray = variable.valueOf(GET_TYPED_ARRAY)
			var newArray = array ?
				variable.isWritable ? array.slice(0) : array
				: []
			return callback.call(variable, newArray, function(startingIndex, deleteCount, items) {
				if (startingIndex < 0) {
					startingIndex = newArray.length + startingIndex
				}
				if (startingIndex === newArray.length) {
					var atEnd = true
				}
				var spliceArgs = [startingIndex, deleteCount]
				var results = newArray.splice.apply(newArray, spliceArgs.concat(items))
				var collectionOf = variable.collectionOf
				if (typedArray && collectionOf) {
					// create variable casted items
					var untypedItems = items
					items = items.map(function(item) {
						item = item instanceof collectionOf ? item : collectionOf.from(item)
						item.parent = variable
						return item
					})
					items.untypedItems = untypedItems
					results = typedArray.slice(startingIndex, deleteCount + startingIndex)
				}
				var event = new SplicedEvent(variable, items, results, startingIndex, deleteCount)
				if (atEnd) {
					event.atEnd = true
				}
				var addedCount = items.length
				if (addedCount > 0) {
					var arrayPosition
					for (var i = newArray.length - addedCount; i > startingIndex;) {
						var arrayPosition = variable[--i]
						if (arrayPosition) {
							variable[i] = undefined
							arrayPosition.key += addedCount
							variable[arrayPosition.key] = arrayPosition
						}
					}
				}
				return when(newArray === array ? // if we are just modifying the original array
						variable.updated(event, variable) : // then just send out an updated event
						variable.put(newArray, event), function() { // otherwise put in the new array
					if (typedArray) {
						// do this afterwards once we have confirmed that it completed successfully
						variable._typedVersion = variable.version
						results = typedArray.splice.apply(typedArray, spliceArgs.concat(items))
						// adjust the key positions of any index properties after splice
						if (variable.isWritable) {
							for (var i = startingIndex; i < typedArray.length; i++) {
								typedArray[i].key = i
							}
						}
					}
					variable.cachedVersion = variable.version // update the cached version, so any version checking will know it has changed
					return results
				})
			})
		})
	}

	function insertedAt(variable, added, startingIndex, arrayLength, event) {
		var addedCount = added.length
		// adjust the key positions of any index properties after splice
		if (addedCount > 0) {
			event = event || new SplicedEvent({
				modifier: variable,
				actions: []
			})
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
				event.actions.push({
					value: added[i],
					index: i + startingIndex,
				})
			}
		}
		return event
	}

	function removedAt(variable, removed, startingIndex, removalCount, arrayLength) {
		// adjust the properties
		var i = startingIndex + removalCount
		var arrayPosition
		if (removalCount > 0) {
			var event = new SplicedEvent({
				modifier: variable,
				actions: []
			})
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
				event.actions.push({
					previousIndex: startingIndex,
					oldValue: removed[i]
				})
			}
			variable.cachedVersion = variable.version // update the cached version so it doesn't need to be recomputed
		}
		return event
	}

	if (typeof Symbol !== 'undefined') {
		Variable.prototype[Symbol.iterator] = function() {
			var iterator = this.valueOf(GET_TYPED_OR_UNTYPED_ARRAY)[Symbol.iterator]()
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
		isWritable: false,
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
		getTransform: function() {
			return this.transform && this.transform.valueOf()
		},
		getValue: function() {
			// first check to see if we have the variable already computed
			if (this.readyState == 'invalidated') {
				this.readyState = nextVersion.toString()
			} else if (isFinite(this.readyState)) {
				// will un-invalidate this later (contextualizedVariable.readyState = 'up-to-date')
			} else if ((this.listeners && this.readyState === 'up-to-date' || this.staysUpdated) && this.cachedVersion > -1) {
				// it is live, so we can shortcut and just return the cached value
				if (context) {
					context.setVersion(this.cachedVersion)
					if (context.ifModifiedSince >= this.cachedVersion && !this.returnedVariable) {
						return NOT_MODIFIED
					}
				}
				return this.promise || this.cachedValue
			}
			/*if (!this.hasOwnProperty('source1') && context) {
				// TODO: Not sure if this is a helpful optimization or not
				// if we have a single source, we can use ifModifiedSince
				if (!contextualizedVariable && this.context && this.context.matches(context)) {
						contextualizedVariable = this
					}
			}*/
			var readyState = this.readyState
			var parentContext = context
			var transformContext = context = context ? context.newContext() : new Context()
			var args = []
			var isAsyncInputs
			try {
				if (this.version) {
					// get the version in there
					transformContext.setVersion(this.version)
				}
				if (this && this.cachedVersion == this.version && this.cachedVersion > -1 && !this.hasOwnProperty('source1')) {
					transformContext.ifModifiedSince = this.cachedVersion
				}
				// TODO: var hasCustomTransformFunction = this.transform && this.transform.value === ObjectValueOf
		 		var transform = this.getTransform()

				var argument, argumentName, lastPromiseResult, resolved = []
				var afterPromiseResolved
				var remaining = 1
				var variable = this
				var whenArgumentResolved = function(result) {
					resolved[this.__index || 0] = result
					remaining--
					if(remaining === 0) {
						return whenAllResolved()
					}else{
						return this.__previousPromiseResult
					}
				}
				for (var i = 0; (argument = this[argumentName = i > 0 ? 'source' + i : 'source']) || argumentName in this; i++) {
					if (argument) {
						var result = argument.valueOf(GET_VALID_TYPE)
						if (result && result.then) {
							remaining++
							if (i === 0) {
								lastPromiseResult = result.then(whenArgumentResolved)
							} else {
								lastPromiseResult = result.then(whenArgumentResolved.bind({
									__index: i,
									__previousPromiseResult: lastPromiseResult
								}))
							}
						} else {
							resolved[i] = result
						}
					} else {
						resolved[i] = argument
					}
				}
				if (--remaining === 0) {
					return whenAllResolved()
					// everything resolved, fast path
				}
				isAsyncInputs = true
				function whenAllResolved() {
	 				if (transformContext.ifModifiedSince !== undefined) {
	 					transformContext.ifModifiedSince = undefined
	 				}
					var version = transformContext.version
					if (variable.cachedVersion >= version || resolved[0] == NOT_MODIFIED) { // note that cached version can get "ahead" of `version` of all dependencies, in cases where the transform ends up executing an valueOf() that advances the resolution context version number.
						// get it out of the cache
						if (parentContext) {
							parentContext.setVersion(version)
						}
						if (parentContext && parentContext.ifModifiedSince >= version &&
								parentContext.ifModifiedSince >= variable.cachedVersion &&
								!variable.returnedVariable) {
							return NOT_MODIFIED
						}
						return variable.promise || promiseSafeResult(variable.cachedValue)
					}

					var result = transform ? transform.apply(variable, resolved) : resolved[0]
					var isPromise = result && result.then && !result.notifies
					version = transformContext.version

					if (isPromise) {
						if (variable.promise && variable.promise.abort) {
							// promises with an abort method can be aborted and replaced with the latest result
							variable.promise.replacedResolutionWith = result
							variable.promise.abort('Cancelled due to updated value being available')
						}
						variable.cachedVersion = version
						var promise = variable.promise = result = result.then(function(resolved) {
							if (promise === variable.promise) { // make sure we are still the latest promise
								variable.promise = null
								onResolve(resolved, transformContext.version)
							}
							return resolved
						}, function(error) {
							if (promise === variable.promise) { // make sure we are still the latest promise
								// clear out the cache on an error
								variable.promise = null
								variable.lastError = error
								onResolve(null, -1)
							} else if (promise.replacedResolutionWith) {
								// if it was aborted and substituted with the latest promise, return that value
								return promise.replacedResolutionWith
							}
							throw error // rethrow so it isn't silenced
						})
					} else {
						onResolve(result, version)
					}
					return promiseSafeResult(result)

					function promiseSafeResult(result) {
						if (isAsyncInputs && result && result.notifies) {
							return {
								__variable: result
							}
						}
						return result
					}
					function onResolve(result, version) {
						if (variable.readyState === readyState) {
							if (parentContext) {
								parentContext.setVersion(version)
							}
							variable.cachedVersion = version
							variable.cachedValue = result
							variable.readyState = (variable.listeners || variable.staysUpdated || parentContext && parentContext.notifies) && version !== -1 ? 'up-to-date' : '' // mark it as up-to-date now
						}/* else {
							console.log('ready state different than when the variable trasnform started ', variable, variable.readyState, readyState)
						}*/
					}
				}
				if (lastPromiseResult.abort) {
					// if abort was propagated, don't propagate past the variable, as we want to finish our resolution of the value
					lastPromiseResult.abort = null
				}
				return lastPromiseResult
			} finally {
				if (parentContext) {
					parentContext.setVersion(transformContext.version)
				}
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
			if (this.promise && !this.promise.abort) { // if it can be aborted, keep it around for better network cleanup, otherwise remove reference for immediate memory cleanup
				this.promise = null
			}
			if (by !== this.returnedVariable && updateEvent && updateEvent.type !== 'replaced') {
				// search for the output in the sources
				var argument, argumentName
				for (var i = 0; (argument = this[argumentName = i > 0 ? 'source' + i : 'source']) || argumentName in this; i++) {
					if (argument === by) {
						// if one of the args was updated, we need to do a full refresh (we can't compute differential events without knowledge of how the mapping function works)
						updateEvent = new ReplacedEvent(updateEvent)
						continue
					}
				}
			}
			return Variable.prototype.updated.call(this, updateEvent, by, isDownstream)
		},

		cleanup: function() {
			if (this.readyState === 'up-to-date' && !this.staysUpdated) {
				this.readyState = '' // once there are no listeners, we can't guarantee we are up-to-date
			}
			Variable.prototype.cleanup.call(this)
		},

		getUpdates: function(since) {
			// this always issues updates, nothing incremental can flow through it
			if (!since || since.version < getVersion()) {
				return [new ReplacedEvent()]
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
		put: function(value, event) {
			var call = this
			return whenStrict(this.getValue(), function(originalValue) {
				if (originalValue === value && typeof value != 'object') {
					return noChange
				}
				var transform = call.transform.valueOf()
				if (transform.reverse) {
					(transform.reverse).call(call, value, call.getArguments())
					return call.updated(event)
				} else if (originalValue && originalValue.put) {
					return originalValue.put(value, event)
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
	Object.defineProperty(Transform.prototype, 'isWritable', {
		get: function() {
			return this.transform && !!this.transform.reverse
		}
	})

	var RESOLUTION_UPDATE = {}
		WhileResolving = lang.compose(Transform, function WhileResolving(variable, defaultValue, useLastValue) {
		this.source = variable
		if (defaultValue !== undefined) {
			this.default = defaultValue
		}
		if (useLastValue) {
			this.useLastValue = true
		}
	}, {
		fixed: true,
		getValue: function() {
			var result = Transform.prototype.getValue.call(this)
			if (result && result.then) {
				var version = this.version
				var variable = this
				result.then(function(value) {
					if (version === variable.version) {
						Variable.prototype.updated.call(variable)
						variable.cachedVersion = variable.version
					}
				}, function (error) {
					// we have to go into an error state so the subsequent request can throw
					console.error('Variable resolution failed', error)
					if (version === variable.version) {
						Variable.prototype.updated.call(variable)
						variable.cachedVersion = variable.version
						variable.cachedValue = 'Error occurred: ' + error
						variable.readyState = 'up-to-date'
					}
				})
				return this.useLastValue && 'cachedValue' in this ? this.cachedValue : this.default
			}
			return result
		},
		put: function(value, event) {
			return this.source.put(value, event)
		}
	})

	var ContextualTransform = lang.compose(Transform, function ContextualTransform() {
		Transform.apply(this, arguments)
	}, {
		getValue: function() {
			// first check to see if we have the variable already computed
			var contextualizedVariable = context ? context.getContextualized(this) : this
			if (contextualizedVariable && contextualizedVariable !== this) {
				return contextualizedVariable.getValue()
			}
			return Transform.prototype.getValue.call(this)
		},
		_needsContextualization: true
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

		put: function(value, event) {
			var subject = this.subject
			return this.generic.put(value, event)
		}
	})

	var VArray = lang.compose(Variable, function VArray(value) {
		return makeSubVar(this, value, VArray)
	}, {
		valueOf: function(mode) {
			var value = Variable.prototype.valueOf.call(this, mode)
			var varray = this
			return when(value, function(array) {
				if (mode && mode.getTyped) {
					if (mode.allowUntyped) {
						if (!array) {
							return []
						}
					} else {
						return // untyped not allowed
					}
				} else if (!array) {
					if (mode && mode.ensureValidType) {
						return []
					}
					return array
				}
				if (varray.sortFunction && varray._sortedArray != array) {
					// we have a sort function, and a new incoming array, need to resort
					var reversed = varray.reversed
					var sortFunction = varray.sortFunction
					varray.sortFunction = null // null this so we don't reenter here
					array = varray.sort(sortFunction)
					if (reversed) {
						varray.reversed()
					}
				}
				return array
			})
		},
		forEach: function(callback, instance) {
			return when(this.valueOf(GET_TYPED_OR_UNTYPED_ARRAY), function(array) {
				array.forEach(callback, instance)
			})
		},
		splice: function(start, deleteCount) {
			var args = arguments
			return arrayToModify(this, function(array, doSplice) {
				return doSplice(start, deleteCount, [].slice.call(args, 2))
			})
		},
		push: function() {
			var args = arguments
			return arrayToModify(this, function(array, doSplice) {
				return when(doSplice(array.length, 0, [].slice.call(args)), function(results) {
					return array.length
				})
			})
		},
		unshift: function() {
			var args = arguments
			return arrayToModify(this, function(array, doSplice) {
				return when(doSplice(0, 0, [].slice.call(args)), function(results) {
					return array.length
				})
			})
		},
		pop: function() {
			return arrayToModify(this, function(array, doSplice) {
				return when(doSplice(array.length - 1, 1, []), function(results) {
					return results[0]
				})
			})
		},
		shift: function() {
			return arrayToModify(this, function(array, doSplice) {
				return when(doSplice(0, 1, []), function(results) {
					return results[0]
				})
			})
		},
		sort: function(compareFunction) {
			var variable = this
			return when(this.valueOf(true), function(array) {
				var typedArray = variable.valueOf(GET_TYPED_ARRAY)
				if (typedArray) {
					var combined = []
					for (var l = array.length, i = 0; i < l; i++) {
						combined.push({
							typed: typedArray[i],
							untyped: array[i]
						})
					}
					combined.sort(function(a, b) {
						return compareFunction(a.typed, b.typed)
					})
					array.splice(0, array.length) // clear and replace with sorted untyped values
					array.push.apply(array, combined.map(function(combined) {
						return combined.untyped
					}))
					variable._typedArray = combined.map(function(combined) {
						return combined.typed
					})
				} else {
					array.sort(compareFunction)
				}
				if (variable.source) {
					variable.sortFunction = compareFunction
					variable._sortedArray = array
					if (variable.reversed) {
						variable.reversed = false
					}
				}
				variable.updated() // this is treated as an in-place update with no upstream impact
				variable.cachedVersion = variable.version
				if (variable._typedArray) {
					variable._typedVersion = variable.version
				}
				return array
			})
		},
		reverse: function() {
			var variable = this
			return when(this.valueOf(GET_TYPED_OR_UNTYPED_ARRAY), function(array) {
				array.reverse()
				if (variable.source) {
					variable.reversed = !variable.reversed
				}
				variable.updated() // this is treated as an in-place update with no upstream impact
				return array
			})
		},
		slice: function(start, end) {
			return when(this.valueOf(true), function(array) {
				return array.slice(start, end)
			})
		},
		indexOf: function(idOrValue) {
			// TODO: After a certain threshold of accesses we should build an index for O(1) time access
			var array = this.valueOf(GET_TYPED_OR_UNTYPED_ARRAY)
			return array.indexOf(idOrValue)
		},
		includes: function(idOrValue) {
			return this.indexOf(idOrValue) > -1
		},
		// id-based methods:
		for: function(idOrValue) {
			if (this.source) {
				return this.source.for(idOrValue)
			}
			var i = this.indexOf(idOrValue)
			var array = this.valueOf()
			var instance = new this.collectionOf.from(array[i] || {})
			instance.id = idOrValue
			return instance
		},
		// Set methods:
		add: function(value) {
			if (this.indexOf(value) === -1) {
				this.push(value)
			}
		},
		delete: function(instanceOrId) {
			var removeIndex = this.indexOf(instanceOrId)
			if (removeIndex > -1) {
				this.splice(removeIndex, 1)
			}
			return this
		},
		clear: function() {
			this.is([])
		},
		has: function(idOrValue) { // same as includes
			return this.indexOf(idOrValue) > -1
		}
	})
	Object.defineProperty(VArray.prototype, 'length', {
		get: function() {
			if (typeof this !== 'function') {
				var properties = this._properties || (this._properties = {})
				if (!properties.length) {
					var length = properties.length = new VNumber()
					length.key = 'length'
					length.parent = this
					Object.defineProperty(this, 'length', {
						configurable: true,
						value: length
					})
					return length
				}
			}
		},
		configurable: true,
		set: function(length) {
			// allow overriding
			this.value.length = length
		},
	})
	VArray.of = function(collectionOf) {
		var ArrayClass = VCollection({collectionOf: collectionOf})
		if (this !== VArray) {
			// new operator
			return new ArrayClass()
		}
		return ArrayClass
	}

	function setToArray(set) {
		var newArray = []
		if (set.forEach) {
			set.forEach(function(item) {
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
				var generatorContext = context
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
						if (generatorContext) {
							// must restart the context, if the input values had previously been checked and hashed against this context, must restart them.
							generatorContext.restart()
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
							if (nextValue && nextValue.then) {
								// if it is a promise or variable, we will wait on it
								var variable = this
								resuming = {
									i: i,
									iterator: generatorIterator
								}
								var isSync = null
								// and return the promise so that the next caller can wait on this
								var promise = nextValue.then(function(value) {
									if (isSync !== false) {
										isSync = true
										nextValue = value
										return
									}
									resuming.value = value
									if (generatorContext) {
										return generatorContext.executeWithin(next.bind(variable))
									}
									return next.call(variable)
								}, function(error) {
									resuming.value = error
									resuming.isThrowing = true
									if (generatorContext) {
										return generatorContext.executeWithin(next.bind(variable))
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
		},
		reverse: function(value, args) {
			// reverse the conversion, putting an array of values into the source inputs
			return args.map(function(arg, i) {
				return arg.put(value[i])
			})
		}
	}

	function all(array, transform) {
		// This is intended to mirror Promise.all. It actually takes
		// an iterable, but for now we are just looking for array-like
		if (array instanceof Array) {
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

		var ownedClasses = this.ownedClasses || (this.ownedClasses = new lang.WeakMap())
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
	function delayUpdate(variable, promise) {
		var originalUpdated = variable.updated
		variable.updated = function() {
			var event = originalUpdated.apply(this, arguments)
			event.visited.enqueueUpdate = function(update) {
				promise.then(update)
			}
		}
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
		var instance = context.specify(Class)
		if (!context.instanceMap) {
			context.instanceMap = new Map()
		}
		context.instanceMap.set(Class, instance)
		return instance
//		var instance = context.subject.constructor.getForClass && context.subject.constructor.getForClass(context.subject, Class) || Class.defaultInstance
//		context.distinctSubject = mergeSubject(context.distinctSubject, instance.subject)
//		return instance
	}
	Variable.valueOf = function(allowPromise) {
		// contextualized valueOf
		return instanceForContext(this, context).valueOf(allowPromise)
	}
	Variable.then = function(callback, errback) {
		// contextualized valueOf
		return instanceForContext(this, context).then(callback, errback)
	}
	Variable.getValue = function(forChild) {
		// contextualized getValue
		return instanceForContext(this, context).getValue(forChild)
	}
	Variable.put = function(value) {
		// contextualized setValue
		return instanceForContext(this, context).put(value)
	}
	Variable.for = function(subject) {
		if (subject != null) {
			if (typeof subject == 'object') {
				if (subject.target && !subject.constructor.getForClass) {
					// makes HTML events work
					subject = subject.target
				}
				var instance
				instance = new Context(subject).specify(this)
				if (instance && !instance.subject) {
					instance.subject = subject
				}
			} else {
				return this.collection.for(subject)
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
			var instanceMap = this.instanceMap || (this.instanceMap = new lang.WeakMap())
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
		var instance = instanceForContext(this, context)
		instance.notifies(target)
		return instance
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
	Variable._Transform = ContextualTransform;

	// delegate to the variable's collection
	['add', 'delete', 'clear', 'filter', 'map', 'forEach', 'slice', 'push', 'splice', 'pop', 'shift', 'unshift'].forEach(function(name) {
		Variable[name] = function() {
			return this.collection[name].apply(this.collection, arguments)
		}
		// preserve array functionality on static methods of VArray
		VArray[name] = VArray.prototype[name]
	})
	// create a new variable with a default value
	Variable.default = function(value) {
		return Variable.with({default: value})
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
			if (this.hasOwnProperty('_collection')) {
				return this._collection
			}
			this.collection = new VCollection()
			this.collection.fixed = true // by default a model collection does not need to replace the array each time it is changed
			return this.collection
		},
		set: function(Collection) {
			if (!this.hasOwnProperty('_collection') || this._collection != Collection) {
				this._collection = Collection
				Collection.collectionOf = this
			}
		}
	})
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
				},
				writable: true,
				configurable: true
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
					if (!value || !value[method]) {
						value = new variable.constructor.wrapsType(value)
					}
					var returnValue = value[method].apply(value, args)
					return when(variable.put(value), function() {
						return returnValue
					})
				})
			},
			writable: true,
			configurable: true
		}
	}

	function VString(value) {
		return makeSubVar(this, (typeof value === 'object' || value === undefined) ? value : String(value), VString)
	}

	function VNumber(value) {
		return makeSubVar(this, (typeof value === 'object' || value === undefined) ? value : Number(value), VNumber)
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
		replace: VFunction.returns(VString),
		toString: function() {
			return this.valueOf() || '' // if it is null or undefined, return blank string
		}
		//length: VNumber
	}, VString)
	VString.prototype.type = 'string'
	VString.isPrimitive = true

	VNumber = Variable.with({
		toFixed: VFunction.returns(VString),
		toExponential: VFunction.returns(VString),
		toPrecision: VFunction.returns(VString),
		toLocaleString: VFunction.returns(VString)
	}, VNumber)
	VNumber.prototype.type = 'number'
	VNumber.isPrimitive = true

	function VBoolean(value) {
		return makeSubVar(this, typeof value === 'object' ? value : Boolean(value), VBoolean)
	}
	VBoolean = Variable.with({}, VBoolean)
	VBoolean.prototype.type = 'boolean'
	VBoolean.isPrimitive = true

	function VSet(value) {
		return makeSubVar(this, value instanceof Array ? new lang.Set(value) : value, VSet)
	}
	VSet = Variable.with({
		has: function(value) {
			return this.to(function(set) {
				if (set && set.has) { // ideally
					return set.has(value)
				}
				if (set && set.indexOf) { // also handle arrays
					return set.indexOf(value) > -1
				}
				return false
			}).as(VBoolean)
		},
		add: VMethod,
		clear: VMethod,
		delete: VMethod
	}, VSet)
	Object.defineProperty(VSet.prototype, 'array', {
		get: function() {
			return this._array || (this._array = this.to(setToArray).as(VArray))
		}
	})
	VSet.wrapsType = lang.Set

	var VCollection = lang.compose(VArray, function VCollection(value) {
		return makeSubVar(this, value, VCollection)
	}, {
		valueOf: function(mode) {
			// skip past VArray valueOf, since it is redundant
			var parentContext = context
			var sourceContext = context = context ? context.newContext() : new Context()
			var value = Variable.prototype.valueOf.call(this, mode)
			sourceContext.setVersion(this.version)
			var varray = this
			try {
				return when(value, function(array) {
					if (!mode || !mode.getTyped) {
						return array
					}
					if (!array) {
						return []
					}
					var collectionOf = varray.getCollectionOf()

					if (collectionOf && (!varray._typedArray || !(varray._typedVersion >= sourceContext.version))) {
						// TODO: eventually we may want to do this even more lazily for slice operations
						varray._typedArray = array.map(function(item, index) {
							if (!(item instanceof collectionOf)) {
								item = collectionOf === Variable ? exports.reactive(item) : collectionOf.from(item)
								if (!item.parent) {
									// set the parent; we may eventually put a check in place here to make sure we aren't
									// reparenting, but this could legimately be a different parent if the array originates
									// from another "source" variable that drives this.
									item.parent = varray
								}
								if (varray.isWritable) {
									item.key = index
								}
							}
							return item
						})
						// items were converted, store the original array
						varray._typedVersion = sourceContext.version
					}
					array = varray._typedArray || mode.allowUntyped && array
					if (varray.sortFunction && varray._sortedArray != array) {
						// we have a sort function, and a new incoming array, need to resort
						var reversed = varray.reversed
						var sortFunction = varray.sortFunction
						varray.sortFunction = null // null this so we don't reenter here
						array = varray.sort(sortFunction)
						if (reversed) {
							varray.reversed()
						}
					}
					return array
				})
			} finally {
				if (parentContext) {
					parentContext.setVersion(sourceContext.version)
				}
				context = parentContext
			}
		},
		property: function(key, PropertyClass) {
			if (this._typedArray) {
				var entry = this._typedArray[key]
				entry.key = key
				return entry
			}
			return Variable.prototype.property.call(this, key, PropertyClass || typeof key === 'number' && this.collectionOf)
		},
		indexOf: function(idOrValue) {
			var array = this.valueOf() || []
			var collectionOf = this.collectionOf
			if (collectionOf.prototype.getId) {
				var id = idOrValue && idOrValue.getId ? idOrValue.getId() : idOrValue
				for (var i = 0, l = array.length; i < l; i++) {
					if (array[i].getId() == id) {
						return i
					}
				}
				return -1
			} else {
				return array.indexOf(idOrValue && idOrValue.valueOf())
			}
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

	VDate.wrapsType = Date

	var VPromise = lang.compose(Variable, function VPromise(value) {
		return makeSubVar(this, value, VPromise)
	}, {
		valueOf: function() {
			return this.then()
		},
	})

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
		GeneratorVariable: GeneratorVariable,
		Transform: Transform,
		deny: deny,
		noChange: noChange,
		Context: Context,
		Item: Item,
		NotifyingContext: NotifyingContext,
		all: all,
		react: react,
		delayUpdate: delayUpdate,
		objectUpdated: objectUpdated,
		NOT_MODIFIED: NOT_MODIFIED,
		_changeValue: changeValue,
		getNextVersion: getNextVersion,
		ReplacedEvent: ReplacedEvent,
		AddedEvent: AddedEvent,
		DeletedEvent: DeletedEvent,
		UpdateEvent: UpdateEvent,
	}
	Object.defineProperty(exports, 'currentContext', {
		get: function() {
			return context
		}
	})

	function getNextVersion() {
		return nextVersion = Math.max(Date.now(), nextVersion + 1)
	}

	var IterativeMethod = lang.compose(Transform, function(source, method) {
	}, {
		transform: function() {
			var array = this.source.valueOf(GET_TYPED_OR_UNTYPED_ARRAY)
			var method = this.method
			if (typeof method === 'string') {
				// apply method
				return this.hasOwnProperty('source2') ?
					[][method].call(array, this.source1.valueOf(), this.source2) :
					[][method].call(array, this.source1.valueOf())
			} else {
				return method(array, [this.source1.valueOf(), this.source2])
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
		slice: function(start, end) {
			return when(this.valueOf(true), function(array) {
				return array.slice(start, end)
			})
		},

		getCollectionOf: function(){
			return this.source.getCollectionOf()
		}
	})

	function defineIterativeFunction(method, constructor, properties, returns, definedOn) {
		var IterativeResults = lang.compose(returns ? returns.as(IterativeMethod) : IterativeMethod, constructor, properties)
		IterativeResults.prototype.method || (IterativeResults.prototype.method = method)
		Object.defineProperty(IterativeResults.prototype, 'isIterable', {value: true});
		definedOn = definedOn || VArray;
		definedOn[method] = definedOn.prototype[method] = function(iteratee, arg2) {
			var results = new IterativeResults(this)
			results.source = this
			results.source1 = iteratee
			if (arg2) {
				results.source2 = arg2
			}
			return results
		}
	}

	defineIterativeFunction('filter', function Filtered(source) {
	}, {
		updated: function(event, by, isDownstream) {
			if (!event || event.modifier === this || (event.modifier && event.modifier.constructor === this)) {
				return Transform.prototype.updated.call(this, event, by)
			}
			var contextualizedVariable = context && context.getContextualized(this) || this
			var filterFunction = this.source1.valueOf()
			if (event.type === 'spliced') { // if we don't have unique items in the array, we can't match indices
				var toAdd = []
				var newItems = event.items
				for (var i = 0; i < newItems.length; i++) {
					// filter, preserving the original untyped value
					if (filterFunction.call(newItems, newItems[i], i)) {
						if (newItems.untypedItems) {
							toAdd.push(newItems.untypedItems[i])
						} else {
							toAdd.push(newItems[i])
						}
					}
				}
				var toRemove = event.removed.filter(filterFunction)
				var start, deleteCount
				if (toRemove.length > 1) {
					// bail and consider it a full refresh
					return Transform.prototype.updated.call(this, new ReplacedEvent(event))
				} else if (toRemove.length == 1) {
					// removing one
					if (!toRemove[0].parent) {
						// if we are not dealing with unique variables, we bail
						return Transform.prototype.updated.call(this, new ReplacedEvent(event))
					}
					start = contextualizedVariable.cachedValue.indexOf(toRemove[0])
					deleteCount = 1
				} else {
					start = event.atEnd ? contextualizedVariable.cachedValue.length : 0
					deleteCount = 0
				}
				arrayToModify(contextualizedVariable, function(array, doSplice) {
					doSplice(start, deleteCount, toAdd)
				})
			} else if (event.type === 'entry') {
				var object = event.value
				var index = contextualizedVariable.cachedValue.indexOf(object)
				var matches = [object].filter(filterFunction).length > 0
				if (index > -1) {
					if (matches) {
						return Variable.prototype.updated.call(this, event, by, isDownstream)
					} else {
						arrayToModify(contextualizedVariable, function(array, doSplice) {
							doSplice(index, 1, [])
						})
					}
				}	else {
					if (matches) {
						arrayToModify(contextualizedVariable, function(array, doSplice) {
							doSplice(array.length, 0, [object])
						})
					}
					// else nothing matches
				}
				return
			} else {
				return Transform.prototype.updated.call(this, event, by, isDownstream)
			}
		},
		transform: function() {
			var array = this.source.valueOf(GET_TYPED_OR_UNTYPED_ARRAY)
			var source = this.source
			var results = []
			var callback = this.source1.valueOf()
			return when(array, function(array) {
				var untypedArray = source.valueOf() // wait until the variable is resolved to resolve this
				array.forEach(function(value, index) {
					if (callback(value, index)) {
						// push the original values, so we preserve underlying and typed values
						results.push(untypedArray[index])
					}
				}, this.source2)
				return results
			})
		},
		// just delegate directly to the source for these methods
		push: function(value) {
			return this.source.push.apply(this.source, arguments)
		},
		unshift: function(value) {
			return this.source.unshift.apply(this.source, arguments)
		},
		// these rely on data from this array to compute the additions/removals to the source
		pop: function(value) {
			return when(this.valueOf(), function(array) {
				return array.length && this.source.remove(array[array.length - 1])
			})
		},
		shift: function(value) {
			return when(this.valueOf(), function(array) {
				return array.length && this.source.remove(array[0])
			})
		},
		splice: function(value) {
			throw new Error('Not supported yet')
		},
		getCollectionOf: function() {
			return this.source.getCollectionOf()
		}
	}, VCollection)
	defineIterativeFunction('map', function Mapped(source) {
	}, {
		updated: function(event, by, isDownstream) {
			if (!event || event.modifier === this || (event.modifier && event.modifier.constructor === this)) {
				return Variable.prototype.updated.call(this, event, by)
			}
			var contextualizedVariable = context && context.getContextualized(this) || this
			if (event.type === 'spliced') {
				this.splice.apply(this, [event.start, event.deleteCount].concat(event.items.map(this.source1.valueOf())))
			} else if (event.type === 'property') {
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
					contextualizedVariable.splice(index, 1, this.source1.valueOf().call(this.source2, this.source.property(index)))
				} else {
					return Transform.prototype.updated.call(this, event, by, isDownstream)
				}
			} else if (event.type === 'entry') {
				if (this.getCollectionOf()) {
					return // if it has typed items, we don't need to propagate update events, since they will be handled by the variable item.
				}
				// TODO: find the element
			} else {
				return Transform.prototype.updated.call(this, event, by, isDownstream)
			}
		}
	}, VArray)
	defineIterativeFunction('reduce', function Reduced() {})
	defineIterativeFunction('reduceRight', function Reduced() {})
	defineIterativeFunction('some', function Aggregated() {}, {}, VBoolean)
	defineIterativeFunction('every', function Aggregated() {}, {}, VBoolean)
	defineIterativeFunction('join', function Aggregated() {}, {}, VString)
	defineIterativeFunction('keyBy', function UniqueIndex(source, args) {}, {
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

	defineIterativeFunction('groupBy', function UniqueIndex(source, args) {}, {
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
					 variables = new lang.WeakMap()
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

	function react(generator, options) {
		if (typeof generator !== 'function') {
			throw new Error('react() must be called with a generator.')
		}
		if (options && options.reverse) {
			generator.reverse = options.reverse
		}
		return new GeneratorVariable(generator)
	}

	Variable.all = all
	Variable.Context = Context

	return exports
}))
