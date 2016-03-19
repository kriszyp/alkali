define(['./lang', './Context'],
		function(lang, Context){
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
		_propertyChange: function(propertyName){
			this.variable._propertyChange(propertyName, contextFromCache(this))
		}
	})
	var listenerId = 1
	function registerListener(value, listener){
		var listeners = propertyListenersMap.get(value)
		var id = listener.listenerId || (listener.listenerId = ('-' + listenerId++))
		if(listeners){
			if(listeners[id] === undefined){
				listeners[id] = listeners.push(listener) - 1
			}
		}else{
			propertyListenersMap.set(value, listeners = [listener])
			listeners[id] = 0
			if(Variable.autoObserveObjects){
				observe(value)
			}
		}
	}
	function deregisterListener(value, listener){
		var listeners = propertyListenersMap.get(value)
		if(listeners){
			var index = listeners[listener.listenerId]
			if(index > -1){
				listeners.splice(index, 1)
				delete listeners[listener.listenerId]
			}
		}
	}
	function contextFromCache(cache){
		var context = new Context()
		do{
			context[cache.propertyName] = cache.key
			cache = cache.parent
		}while(cache)
		return context
	}

	function PropertyChange(key) {
		this.key = key
		this.version = nextId++
	}
	PropertyChange.prototype.type = 'update'
	function Variable(value){
		this.value = value
	}
	Variable.prototype = {
		constructor: Variable,
		valueOf: function(context){
			if(this.state){
				this.state = null
			}
			return this.gotValue(this.getValue(context), context)
		},
		getValue: function(){
			return this.value
		},
		gotValue: function(value, context){
			var previousNotifyingValue = this.notifyingValue
			var variable = this
			return lang.when(value, function(value){
				if(previousNotifyingValue){
					if(value === previousNotifyingValue){
						// nothing changed, immediately return valueOf
						return value.valueOf(context)
					}
					// if there was a another value that we were dependent on before, stop listening to it
					// TODO: we may want to consider doing cleanup after the next rendering turn
					if (variable.dependents) {
						previousNotifyingValue.unsubscribe(variable)
					}
					variable.notifyingValue = null
				}
				if(value && value.subscribe){
					if(variable.dependents){
							// the value is another variable, start receiving notifications
						value.subscribe(variable)
					}
					variable.notifyingValue = value
					value = value.valueOf(context)
				}
				if(typeof value === 'object' && value && variable.dependents){
					// set up the listeners tracking
					registerListener(value, variable)
				}
				if(value === undefined) {
					value = variable.default
				}
				return value
			})
		},
		property: function(key){
			var properties = this._properties || (this._properties = {})
			var propertyVariable = properties[key]
			if(!propertyVariable){
				// create the property variable
				propertyVariable = properties[key] = new Property(this, key)
			}
			return propertyVariable
		},
		_propertyChange: function(propertyName, context, type){
			if(this.onPropertyChange){
				this.onPropertyChange(propertyName, context)
			}
			var property = propertyName && this._properties && this._properties[propertyName]
			if(property && !(type instanceof PropertyChange)){
				property.parentUpdated(ToChild, context)
			}
			this.updated(new PropertyChange(propertyName), this, context)
		},
		eachKey: function(callback){
			for(var i in this._properties){
				callback(i)
			}
		},
		apply: function(instance, args){
			return new Call(this, args)
		},
		call: function(instance){
			return this.apply(instance, Array.prototype.slice.call(arguments, 1))
		},
		init: function(){
			if(this.notifyingValue){
				this.notifyingValue.subscribe(this)
			}
		},
		cleanup: function(){
			var handles = this.handles
			if(handles){
				for(var i = 0; i < handles.length; i++){
					handles[i].remove()
				}
			}
			this.handles = null
			var value = this.value
			if(value && typeof value === 'object'){
				deregisterListener(value, this)
			}
			var notifyingValue = this.notifyingValue
			if(notifyingValue){
				this.notifyingValue.unsubscribe(this)
				// TODO: move this into the caching class
				this.computedVariable = null
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

		updated: function(updateEvent, by, context){
			if(this.state === 'invalidated'){
				return
			}
			this.state = 'invalidated'
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
			if(value && typeof value === 'object' && !(updateEvent instanceof PropertyChange)){
				deregisterListener(value, this)
			}

			var dependents = this.dependents
			if(dependents){
				// make a copy, in case they change
				dependents = dependents.slice(0)
				for(var i = 0, l = dependents.length; i < l; i++){
					try{
						var dependent = dependents[i]
						// skip notifying property dependents if we are headed up the parent chain
						if(!(updateEvent instanceof PropertyChange) || dependent.parent !== this){
							if (dependent.parent === this) {
								dependent.parentUpdated(ToChild, context)
							} else {
								dependent.updated(updateEvent, this, context)
							}
						}
					}catch(e){
						console.error(e, 'updating a variable')
					}
				}
			}
		},

		invalidate: function() {
			// for back-compatibility for now
			this.updated()
		},

		subscribe: function(listener){
			// ES7 Observable (and baconjs) compatible API
			var updated
			var variable = this
			// it is important to make sure you register for notifications before getting the value
			if (typeof listener === 'function'){
				// BaconJS compatible API
				var variable = this
				var event = {
					value: function(){
						return variable.valueOf()
					}
				}
				updated = function() {
					listener(event)
				}
			} else if (listener.updated) {
				// An alkali compatible updateable listener, this is the ideal option
				var dependents = this.dependents
				if(!dependents){
					this.init()
					this.dependents = dependents = []
				}
				dependents.push(listener)
				return {
					unsubscribe: function(){
						variable.unsubscribe(listener)
					}
				}

			}	else if (listener.next) {
				// Assuming ES7 Observable API. It is actually a streaming API, this pretty much violates all principles of reactivity, but we will support it
				updated = function(){
					listener.next(variable.valueOf())
				}
			} else {
				throw new Error('Subscribing to an invalid listener, the listener must be a function, or have an update or next method')
			}

			var handle = this.subscribe({
				updated: updated
			})
			var initialValue = this.valueOf()
			if(initialValue !== undefined){
				updated()
			}
			return handle
		},
		unsubscribe: function(dependent){
			var dependents = this.dependents
			if (dependents) {
				for(var i = 0; i < dependents.length; i++){
					if(dependents[i] === dependent){
						dependents.splice(i--, 1)
					}
				}
				if(dependents.length === 0){
					// clear the dependents so it will be reinitialized if it has
					// dependents again
					this.dependents = dependents = false
					this.cleanup()
				}
			}
		},
		put: function(value, context){
			var oldValue = this.getValue()
			if(oldValue === value){
				return noChange
			}
			if(this.fixed &&
					// if it is set to fixed, we see we can put in the current variable
					oldValue && oldValue.put && // if we currently have a variable
					// and it is always fixed, or not a new variable
					(this.fixed == 'always' || !(value && value.subscribe))){
				return oldValue.put(value)
			}
			this.setValue(value)
			this.updated(Refresh, this, context)
		},
		get: function(key, context){
			var object = this.valueOf(context)
			if (typeof key === 'function') {
				return getForClass.call(object, key)
			}
			return object && object[key]
		},
		set: function(key, value, context){
			// TODO: create an optimized route when the property doesn't exist yet
			this.property(key).put(value, context)
		},
		undefine: function(key, context){
			this.set(key, undefined, context)
		},
		next: function(value) {
			// for ES7 observable compatibility
			this.put(value)
		},
		error: function(error) {
			// for ES7 observable compatibility
			var dependents = this.dependents
			if(dependents){
				// make a copy, in case they change
				dependents = dependents.slice(0)
				for(var i = 0, l = dependents.length; i < l; i++){
					try{
						var dependent = dependents[i]
						// skip notifying property dependents if we are headed up the parent chain
						dependent.error(error)
					}catch(e){
						console.error(e, 'sending an error')
					}
				}
			}
		},
		complete: function(value) {
			// for ES7 observable compatibility
			this.put(value)
		},
		setValue: function(value){
			this.value = value
		},
		onValue: function(listener){
			return this.subscribe(function(event){
				lang.when(event.value(), function(value){
					listener(value)
				})
			})
		},
		forEach: function(callback, context){
			// iterate through current value of variable
			return lang.when(this.valueOf(context), function(value){
				if(value && value.forEach){
					value.forEach(callback)
				}else{
					for(var i in value){
						callback(value[i])
					}
				}
			})
		},
		each: function(callback){
			// returns a new mapped variable
			// TODO: support events on array (using dstore api)
			return this.map(function(array){
				return array.map(callback)
			})
		},

		map: function (operator) {
			// TODO: eventually make this act on the array items instead
			return this.to(operator)
		},
		to: function (operator) {
			// TODO: create a more efficient map, we don't really need a full variable here
			if(!operator){
				throw new Error('No function provided to map')
			}
			return new Variable(operator).apply(null, [this])
		},
		get schema(){
			var schema = new Schema(this)
			Object.defineProperty(this, 'schema', {
				value: schema
			})
			return schema
		},
		get validate(){
			var schema = this.schema
			var validate = new Validating(this, schema)
			Object.defineProperty(this, 'validate', {
				value: validate
			})
			return validate
		},
		getId: function(){
			return this.id || (this.id = nextId++)
		}

	}

	if (typeof Symbol !== 'undefined') {
		Variable.prototype[Symbol.iterator] = function() {
			return this.valueOf()[Symbol.iterator]()
		}
	}
	var Caching = Variable.Caching = lang.compose(Variable, function(getValue, setValue){
		if(getValue){
			this.getValue = getValue
		}
		if(setValue){
			this.setValue = setValue
		}
	}, {
		getCache: function(context){
			var cache = this.cache || (this.cache = new CacheEntry())
			while(cache.getNextKey){
				var propertyName = cache.propertyName
				var keyValue = context.get(propertyName)
				// TODO: handle the case of a primitive
				var nextCache = cache.get(keyValue)
				if(!nextCache){
					nextCache = new CacheEntry()
					cache.set(keyValue, nextCache)
					nextCache.key = keyValue
				}
				cache = nextCache
			}
			return cache
		},

		valueOf: function(context, cacheHolder){
			// first check to see if we have the variable already computed
			if(this.state){
				this.state = null
			}
			var cache = this.getCache(context)
			if('value' in cache){
				if(cacheHolder && cacheHolder instanceof GetCache){
					cacheHolder.cache = cache
				}
				if (cache.version === this.getVersion(context)){
					return cache.value
				}
			}
			var cache = this.cache
			
			var watchedContext = {
				get: function(propertyName, select){
					var keyValue = context.get(propertyName, select)
					// determine if we have already keyed of this value
					if(cache.propertyName !== propertyName){
						// TODO: check it against all previous property names						
						if(!cache.propertyName){
							cache.propertyName = propertyName
						}
						var nextCache = cache.get(keyValue)
						if(!nextCache){
							nextCache = new CacheEntry()
							cache.set(keyValue, nextCache)
							nextCache.parent = cache
							nextCache.key = keyValue
							nextCache.propertyName = propertyName
						}
						cache = nextCache
					}
					return keyValue
				}
			}
			var variable = this
			return lang.when(this.getValue(watchedContext), function(computedValue){
				if(computedValue && computedValue.subscribe && this.dependents){
					if(variable.computedVariable && variable.computedVariable !== computedValue){
						throw new Error('Can pass in a different variable for a different context as the result of a single variable')
					}
					variable.computedVariable = computedValue
				}
				computedValue = variable.gotValue(computedValue, watchedContext)
				if(computedValue && typeof computedValue === 'object' &&
						variable._properties && variable.dependents){

					cache.variable = variable
				}
				cache.value = computedValue
				cache.version = variable.getVersion()
				if(cacheHolder && cacheHolder instanceof GetCache){
					cacheHolder.cache = cache
				}
				return computedValue
			})
		},

		getValue: function(){
			return this.value && this.value.valueOf()
		},
		updated: function(updateEvent, by, context){
			// TODO: there might actually be a collection of listeners
			// clear the cache
			if(context){
				// just based on the context
				var cache = this.getCache(context)
				// deregisterListener(cache.value, cache)
				delete cache.value
			}else{
				// delete our whole cache if it is an unconstrained invalidation
				// deregisterListener(this.cache.value, this.cache)
				this.cache = {}
			}
			if(this.computedVariable){
				this.computedVariable = null
			}
			Variable.prototype.updated.call(this, updateEvent, by, context)
		}
	})

	function GetCache(){
	}

	var Property = lang.compose(Variable, function Property(parent, key){
		this.parent = parent
		this.key = key
	},
	{
		init: function(){
			Variable.prototype.init.call(this)
			this.parent.subscribe(this)
		},
		cleanup: function(){
			Variable.prototype.cleanup.call(this)
			this.parent.unsubscribe(this)
		},
		valueOf: function(context){
			if(this.state){
				this.state = null
			}
			var key = this.key
			var parent = this.parent
			var property = this
			var cacheHolder = new GetCache()
			return lang.when(parent.valueOf(context, cacheHolder), function(object){
				if(property.dependents){
					var cache = cacheHolder.cache || object
					var listeners = cache && propertyListenersMap.get(cache)
					if(listeners && listeners.observer && listeners.observer.addKey){
						listeners.observer.addKey(key)
					}
				}
				return property.gotValue(object == null ? undefined : object[key], context)
			})
		},
		put: function(value, context){
			return this._changeValue(context, RequestChange, value)
		},
		parentUpdated: function(updateEvent, context){
			return Variable.prototype.updated.call(this, updateEvent, this.parent, context)
		},
		updated: function(updateEvent, by, context){
			//if(updateEvent !== ToChild){
				this._changeValue(context, updateEvent)
			//}
			return Variable.prototype.updated.call(this, updateEvent, by, context)
		},
		_changeValue: function(context, type, newValue){
			var key = this.key
			var parent = this.parent
			return lang.when(parent.valueOf(context), function(object){
				if(object == null){
					// nothing there yet, create an object to hold the new property
					parent.put(object = typeof key == 'number' ? [] : {})
				}else if(typeof object != 'object'){
					// if the parent is not an object, we can't set anything (that will be retained)
					return deny
				}
				if(type == RequestChange){
					if(object[key] === newValue){
						// no actual change to make
						return noChange
					}
					object[key] = newValue
				}
				var listeners = propertyListenersMap.get(object)
				// at least make sure we notify the parent
				// we need to do it before the other listeners, so we can update it before
				// we trigger a full clobbering of the object
				parent._propertyChange(key, context, type)
				if(listeners){
					for(var i = 0, l = listeners.length; i < l; i++){
						var listener = listeners[i]
						if (listener !== parent){
							// now go ahead and actually trigger the other listeners (but make sure we don't do the parent again)
							listener._propertyChange(key, context, type)
						}
					}
				}
			})
		}
	})
	Variable.Property = Property

	var Composite = Variable.Composite = lang.compose(Caching, function Composite(args){
		this.args = args
	}, {
		init: function(){
			// depend on the args
			Caching.prototype.init.call(this)
			var args = this.args
			for(var i = 0, l = args.length; i < l; i++){
				var arg = args[i]
				if(arg && arg.subscribe){
					arg.subscribe(this)
				}
			}
		},

		updated: function(updateEvent, by, context){
			if (by !== this.notifyingValue && updateEvent !== Refresh) {
				var args = this.args
				// using a painful search instead of indexOf, because args may be an arguments object
				for(var i = 0, l = args.length; i < l; i++){
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
			for(var i = 0, l = args.length; i < l; i++){
				var arg = args[i]
				if (arg && arg.getVersion) {
					version = Math.max(version, arg.getVersion(context))
				}
			}
			return version
		},

		cleanup: function(){
			Caching.prototype.cleanup.call(this)
			// depend on the args
			var args = this.args
			for(var i = 0, l = args.length; i < l; i++){
				var arg = args[i]
				if(arg && arg.subscribe){
					arg.unsubscribe(this)
				}
			}
		},

		getValue: function(context){
			var results = []
			var args = this.args
			for(var i = 0, l = args.length; i < l; i++){
				var arg = args[i]
				results[i] = arg && arg.valueOf(context)
			}
			return lang.whenAll(results, function(resolved) {
				return resolved
			})
		}
	})

	// a call variable is the result of a call
	var Call = lang.compose(Composite, function Call(functionVariable, args){
		this.functionVariable = functionVariable
		this.args = args
	}, {
		init: function(){
			// depend on the function itself
			this.functionVariable.subscribe(this)
			// depend on the args
			Composite.prototype.init.call(this)
		},
		cleanup: function(){
			this.functionVariable.unsubscribe(this)
			Composite.prototype.cleanup.call(this)
		},

		getValue: function(context){
			var call = this
			return lang.when(this.functionVariable.valueOf(context), function(functionValue){
				return call.invoke(functionValue, call.args, context)
			})
		},

		getVersion: function(context) {
			// TODO: shortcut if we are live and since equals this.lastUpdate
			return Math.max(Composite.prototype.getVersion.call(this, context), this.functionVariable.getVersion(context))
		},

		execute: function(context){
			var call = this
			return lang.when(this.functionVariable.valueOf(context), function(functionValue){
				return call.invoke(functionValue, call.args, context, true)
			})
		},

		put: function(value, context){
			var call = this
			return lang.when(this.valueOf(context), function(originalValue){
				if(originalValue === value){
					return noChange
				}
				return lang.when(call.functionVariable.valueOf(context), function(functionValue){
					return call.invoke(function(){
						if(functionValue.reverse){
							functionValue.reverse.call(call, value, call.args, context)
							return Variable.prototype.put.call(call, value, context)
						}else{
							return deny
						}
					}, call.args, context)
				});				
			})
		},
		invoke: function(functionValue, args, context, observeArguments){
			var instance = this.functionVariable.parent
			if(functionValue.handlesContext){
				return functionValue.apply(instance, args, context)
			}else{
				var results = []
				for(var i = 0, l = args.length; i < l; i++){
					var arg = args[i]
					results[i] = arg && arg.valueOf(context)
				}
				instance = instance && instance.valueOf(context)
				if(functionValue.handlesPromises){
					return functionValue.apply(instance, results, context)
				}else{
					// include the instance in whenAll
					results.push(instance)
					// wait for the values to be received
					return lang.whenAll(results, function(inputs){
						if(observeArguments){
							var handles = []
							for(var i = 0, l = inputs.length; i < l; i++){
								var input = inputs[i]
								if(input && typeof input === 'object'){
									handles.push(observe(input))
								}
							}
							var instance = inputs.pop()
							try{
								var result = functionValue.apply(instance, inputs, context)
							}finally{
								lang.when(result, function(){
									for(var i = 0; i < l; i++){
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
		}
	})
	Variable.Call = Call

	var Items = lang.compose(Variable, function(parent){
		this.parent = parent
	}, {
		init: function(){
			Variable.prototype.init.call(this)
			this.parent.subscribe(this)
		},
		cleanup: function(){
			Variable.prototype.cleanup.call(this)
			this.parent.unsubscribe(this)
		},
		lastIndex: 0,
		valueOf: function(context){
			if(this.state){
				this.state = null
			}

			var parent = this.parent
			var variable = this
			return lang.when(parent.valueOf(context), function(array){

				if(!context || !array){
					return array
				}
				var previous = context.get('after')
				if(!previous){
					return array[0]
				}else{
					// performance shortcut
					if(array[variable.lastIndex++] === previous){
						return array[variable.lastIndex]
					}
					for(var i = 0, l = array.length; i < l;){
						if(array[i++] === previous){
							variable.lastIndex = i
							return array[i]
						}
					}
				}
				if(variable.dependents){
					lang.observeArray(array, function(events){
						event.name
						variable.updated(new ArrayContext(changedItem))
					})
				}
			})
		},
		forEach: function(callback, context){
			var iteratorContext = lang.mixin({}, context)
			var variable = this
			return lang.when(this.valueOf(iteratorContext), function(item){
				while(item){
					callback(item)
					iteratorContext.after = item
					item = variable.valueOf(iteratorContext)
				}
			})
		},
		push: function(value) {
			args = arguments
			return lang.when(this.valueOf(), function(array) {
				array.push.apply(array, args)

			})
		},
		arrayContext: function(context){
			return new ContextualArray(context, this)
		}
	})
	function ContextualArray(context, parent){
		this.context = context
		this.parent = parent
	}
	ContextualArray.prototype.valueOf = function(){
		return this.parent.valueOf(this.context)
	}
	function arrayMethod(name, sendUpdates){
		Variable.prototype[name] = ContextualArray.prototype[name] = function(){
			var args = arguments
			var variable = this
			return lang.when(this.valueOf(), function(array){
				var result = array[name].apply(array, args)
				if (sendUpdates) {
					sendUpdates.call(variable, args, result, array)
				}
				return result
			})
		}
	}
	arrayMethod('splice', function(args, result) {
		for(var i = 0; i < args[1]; i++) {
			this.updated({
				type: 'delete',
				previousIndex: args[0]
			})
		}
		for(i = 2, l = args.length; i < l; i++) {
			this.updated({
				type: 'add',
				value: args[i],
				index: args[0] + i - 2
			})
		}
	})
	arrayMethod('push', function(args, result) {
		for(var i = 0, l = args.length; i < l; i++) {
			var arg = args[i]
			this.updated({
				type: 'add',
				index: result - i - 1,
				value: arg
			})
		}
	})
	arrayMethod('unshift', function(args, result) {
		for(var i = 0, l = args.length; i < l; i++) {
			var arg = args[i]
			this.updated({
				type: 'add',
				index: i,
				value: arg
			})
		}
	})
	arrayMethod('shift', function(args, results) {
		this.updated({
			type: 'delete',
			previousIndex: 0
		})
	})
	arrayMethod('pop', function(args, results, array) {
		this.updated({
			type: 'delete',
			previousIndex: array.length
		})
	})

	var Validating = lang.compose(Caching, function(target, schema){
		this.target = target
		this.targetSchema = schema
	}, {
		init: function(){
			Variable.prototype.init.call(this)
			this.target.subscribe(this)
			this.targetSchema.subscribe(this)
		},
		cleanup: function(){
			Caching.prototype.cleanup.call(this)
			this.target.unsubscribe(this)
			this.targetSchema.unsubscribe(this);			
		},
		getVersion: function(context){
			return Variable.prototype.getVersion.call(this, context) + this.target.getVersion(context) + this.targetSchema.getVersion(context)
		},
		getValue: function(context){
			return doValidation(this.target.valueOf(context), this.targetSchema.valueOf(context))
		}
	})

	var Schema = lang.compose(Caching, function(target){
		this.target = target
	}, {
		init: function(){
			Variable.prototype.init.call(this)
			this.target.subscribe(this)
		},
		cleanup: function(){
			Caching.prototype.cleanup.call(this)
			this.target.unsubscribe(this)
		},
		getVersion: function(context){
			return Variable.prototype.getVersion.call(this, context) + this.target.getVersion(context)
		},
		getValue: function(context){
			if(this.value){ // if it has an explicit schema, we can use that.
				return this.value
			}
			// get the schema, going through target parents until it is found
			return getSchema(this.target)
			function getSchema(target){
				return lang.when(target.valueOf(context), function(value){
					var schema
					return (value && value._schema) || (target.parent && (schema = target.parent.schema)
						&& (schema = schema.valueOf()) && schema[target.key])
				})
			}
		}
	})
	function validate(target){
		var schemaForObject = schema(target)
		return new Validating(target, schemaForObject)
	}
	Variable.deny = deny
	Variable.noChange = noChange
	function addFlag(name){
		Variable[name] = function(functionValue){
			functionValue[name] = true
		}
	}
	addFlag(Variable, 'handlesContext')
	addFlag(Variable, 'handlesPromises')

	function observe(object){
		var listeners = propertyListenersMap.get(object)
		if(!listeners){
			propertyListenersMap.set(object, listeners = [])
		}
		if(listeners.observerCount){
			listeners.observerCount++
		}else{
			listeners.observerCount = 1
			var observer = listeners.observer = lang.observe(object, function(events){
				for(var i = 0, l = listeners.length; i < l; i++){
					var listener = listeners[i]
					for(var j = 0, el = events.length; j < el; j++){
						var event = events[j]
						listener._propertyChange(event.name)
					}
				}
			})
			if(observer.addKey){
				for(var i = 0, l = listeners.length; i < l; i++){
					var listener = listeners[i]
					listener.eachKey(function(key){
						observer.addKey(key)
					})
				}
			}
		}
		return {
			remove: function(){
				if(!(--listeners.observerCount)){
					listeners.observer.remove()
				}
			},
			done: function(){
				// deliver changes
				lang.deliverChanges(observer)
				this.remove()
			}
		}
	}
	function all(array){
		// This is intended to mirror Promise.all. It actually takes
		// an iterable, but for now we are just looking for array-like
		if (array.length > -1) {
			return new Composite(array)
		}
		throw new TypeError('Variable.all requires an array')
	}

	function forRelated(related) {
		return related ? related.get(this) : this.defaultInstance
	}
	function hasOwn(Target, createForInstance) {
		var ownedClasses = this.ownedClasses || (this.ownedClasses = new WeakMap())
		// TODO: assign to super classes
		var Class = this
		ownedClasses.set(Target, createForInstance || function() { return new Target() })
		return this
	}
	function getForClass(Target) {
		var createForInstance = this.constructor.ownedClasses.get(Target)
		if (createForInstance) {
			var ownedInstances = this.ownedInstances || (this.ownedInstances = new WeakMap())
			var instance = ownedInstances.get(Target)
			if (!instance) {
				ownedInstances.set(Target, instance = createForInstance(this))
			}
			return instance
		}
	}

	Variable.for = forRelated
	Variable.hasOwn = hasOwn
	Variable.all = all
	Variable.observe = observe
	Variable.extend = function () {
		// TODO: handle arguments
		var Base = this
		function ExtendedVariable() {
			return Base.apply(this, arguments)
		}
		ExtendedVariable.prototype = Object.create(this.prototype)
		setPrototypeOf(ExtendedVariable, this)
		return ExtendedVariable
	}
	Object.defineProperty(Variable, 'defaultInstance', {
		get: function() {
			return this._defaultInstance || (this._defaultInstance = new this())
		}
	})

	function setStaticHandler(name) {
		Variable[name] = function() {
			var Base = this
			var args = arguments
			// we create a new class, that applies the method call to the base instance after being created from the base
			function AppliedVariable() {
				var baseInstance = Base.apply(this, arguments)
				return baseInstance[name].apply(baseInstance, args)
			}
			AppliedVariable.for = function(related) {
				var baseInstance = Base.for(related)
				return baseInstance[name].apply(baseInstance, args)
			}
			/* not sure if we really need this
			AppliedVariable.queuedAction = {
				name: name,
				args: arguments
			}*/
			AppliedVariable.prototype = Object.create(this.prototype)
			setPrototypeOf(AppliedVariable, this)
			return AppliedVariable
		}
	}
	['property', 'to', 'map'].forEach(setStaticHandler)

	return Variable
});