define(['./lang', './Context'],
		function(lang, Context){
	var deny = {};
	var noChange = {};
	var WeakMap = lang.WeakMap;
	// Invalidation types
	var ToChild = 1;
	var ToParent = 2;
	var RequestChange = 3;
	var propertyListenersMap = new WeakMap(null, 'propertyListenersMap');

	var CacheEntry = lang.compose(WeakMap, function() {
	},{
		_propertyChange: function(propertyName){
			this.variable._propertyChange(propertyName, contextFromCache(this));
		}
	});
	var listenerId = 1;
	function registerListener(value, listener){
		var listeners = propertyListenersMap.get(value);
		var id = listener.id || (listener.id = ('-' + listenerId++));
		if(listeners){
			if(listeners[id] === undefined){
				listeners[id] = listeners.push(listener) - 1;
			}
		}else{
			propertyListenersMap.set(value, listeners = [listener]);
			listeners[id] = 0;
			if(Variable.autoObserveObjects){
				observe(value);
			}
		}
	}
	function deregisterListener(value, listener){
		var listeners = propertyListenersMap.get(value);
		if(listeners){
			var index = listeners[listener.id];
			if(index > -1){
				listeners.splice(index, 1);
				delete listeners[listener.id];
			}
		}
	}
	function contextFromCache(cache){
		var context = new Context();
		do{
			context[cache.propertyName] = cache.key;
			cache = cache.parent;
		}while(cache);
		return context;
	}

	function Variable(value){
		this.value = value;
	}
	Variable.prototype = {
		constructor: Variable,
		valueOf: function(context){
			return this.gotValue(this.getValue(context), context);
		},
		getValue: function(){
			return this.value;
		},
		gotValue: function(value, context){
			if(this.notifyingValue){
				this.notifyingValue.stopNotifies(this);
				this.notifyingValue = null;
			}
			if(value && value.notifies){
				if(this.dependents){
					// the value is another variable, start receiving notifications
					// TODO: do cleanup of this notifies
					value.notifies(this);
					this.notifyingValue = value;
				}
				value = value.valueOf(context);
			}
			if(typeof value === 'object' && value && this.dependents && this._properties){
				// set up the listeners tracking
				registerListener(value, this);
			}
			return value;
		},
		property: function(key){
			var properties = this._properties || (this._properties = {});
			var propertyVariable = properties[key];
			if(!propertyVariable){
				// create the property variable
				propertyVariable = properties[key] = new Property(this, key);
			}
			return propertyVariable;
		},
		_propertyChange: function(propertyName, context, type){
			var property = type !== ToParent && propertyName && this._properties && this._properties[propertyName];
			if(property){// should not call this if coming from child
				property.invalidate(context, ToChild);
			}
			this.invalidate(context, ToParent);
		},
		eachKey: function(callback){
			for(var i in this._properties){
				callback(i);
			}
		},
		apply: function(instance, args){
			return new Call(this, args);
		},
		call: function(instance){
			return this.apply(instance, Array.prototype.slice.call(arguments, 1));
		},
		init: function(){
			if(this.notifyingValue){
				this.notifyingValue.notifies(this);
			}
		},
		cleanup: function(){
			var handles = this.handles;
			if(handles){
				for(var i = 0; i < handles.length; i++){
					handles[i].remove();
				}
			}
			this.handles = null;
			var value = this.value;
			if(value && typeof value === 'object'){
				deregisterListener(value, this);
			}
			var notifyingValue = this.notifyingValue;
			if(notifyingValue){
				this.notifyingValue.stopNotifies(this);
				this.notifyingValue = null;
				// TODO: move this into the caching class
				this.computedVariable = null;
			}
		},

		invalidate: function(context, type){
			var value = this.value;
			if(value && typeof value === 'object' && type !== ToParent){
				deregisterListener(value, this);
			}

			var dependents = this.dependents;
			if(dependents){
				// make a copy, in case they change
				dependents = dependents.slice(0);
				for(var i = 0, l = dependents.length; i < l; i++){
					try{
						var dependent = dependents[i];
						// skip notifying property dependents if we are headed up the parent chain
						if(type !== ToParent || dependent.parent !== this){
							dependent.invalidate(context, dependent.parent === this ? ToChild : undefined);
						}
					}catch(e){
						console.error(e, 'invalidating a variable');
					}
				}
			}
		},
		notifies: function(dependent){
			if(!dependent.invalidate){
				throw new Error('Invalid variable provided as notification receipient, a variable must have an invalidate method');
			}
			var dependents = this.dependents;
			if(!dependents){
				this.init();
				this.dependents = dependents = [];
			}
			var variable = this;
			dependents.push(dependent);
			return {
				remove: function(){
					variable.stopNotifies(dependent);
				}
			};
		},
		stopNotifies: function(dependent){
			var dependents = this.dependents;
			for(var i = 0; i < dependents.length; i++){
				if(dependents[i] === dependent){
					dependents.splice(i--, 1);
				}
			}
			if(dependents.length === 0){
				// clear the dependents so it will be reinitialized if it has
				// dependents again
				this.dependents = dependents = false;
				this.cleanup();
			}
		},
		put: function(value, context){
			if(this.getValue() === value){
				return noChange;
			}
			this.setValue(value);
			this.invalidate(context);
		},
		get: function(key, context){
			var object = this.valueOf(context);
			return object && object[key];
		},
		set: function(key, value, context){
			// TODO: create an optimized route when the property doesn't exist yet
			this.property(key).put(value, context);
		},
		setValue: function(value){
			this.value = value;
		},
		subscribe: function(listener){
			// baconjs compatible
			var variable = this;
			// it is important to make sure you register for notifications before getting the value
			var handle = this.notifies({
				invalidate: function(){
					listener({
						value: function(){
							return variable.valueOf();
						}
					});
				}
			});
			var initialValue = this.valueOf();
			if(initialValue !== undefined){
				listener({
					value: function(){
						return initialValue;
					}
				});
			}
			return handle;
		},
		onValue: function(listener){
			return this.subscribe(function(event){
				lang.when(event.value(), function(value){
					listener(value);
				});
			});
		},
		forEach: function(callback, context){
			// iterate through current value of variable
			return lang.when(this.valueOf(context), function(value){
				if(value && value.forEach){
					value.forEach(callback);
				}else{
					for(var i in value){
						callback(value[i]);
					}
				}
			});
		},
		each: function(callback){
			// returns a new mapped variable
			// TODO: support events on array (using dstore api)
			return this.map(function(array){
				return array.map(callback);
			});
		},
		newElement: function(){
			return lang.when(this.valueOf(), function(value){
				return value && value.newElement && value.newElement();
			});
		},
		map: function (operator) {
			// TODO: create a more efficient map, we don't really need a full variable here
			return new Variable(operator).apply(null, [this]);
		},
		get withDescendants(){
			return this;
		},
		get schema(){
			var schema = new Schema(this);
			Object.defineProperty(this, 'schema', {
				value: schema
			});
			return schema;
		},
		get validate(){
			var schema = this.schema;
			var validate = new Validating(this, schema);
			Object.defineProperty(this, 'validate', {
				value: validate
			});
			return validate;
		}
	};

	var Caching = Variable.Caching = lang.compose(Variable, function(getValue, setValue){
		if(getValue){
			this.getValue = getValue;
		}
		if(setValue){
			this.setValue = setValue;
		}
	}, {
		getCache: function(context){
			var cache = this.cache || (this.cache = new CacheEntry());
			while(cache.getNextKey){
				var propertyName = cache.propertyName;
				var keyValue = context.get(propertyName);
				// TODO: handle the case of a primitive
				var nextCache = cache.get(keyValue);
				if(!nextCache){
					nextCache = new CacheEntry();
					cache.set(keyValue, nextCache);
					nextCache.key = keyValue;
				}
				cache = nextCache;
			}
			return cache;
		},
		valueOf: function(context, cacheHolder){
			// first check to see if we have the variable already computed
			var useCache = this.dependents || this._properties;
			if(!useCache){
				return Variable.prototype.valueOf.apply(this, arguments);
			}
			var cache = this.getCache(context);
			if('value' in cache){
				if(cacheHolder && cacheHolder instanceof GetCache){
					cacheHolder.cache = cache;
				}
				return cache.value;
			}
			var cache = this.cache;
			
			var watchedContext = {
				get: function(propertyName, select){
					var keyValue = context.get(propertyName, select);
					// determine if we have already keyed of this value
					if(cache.propertyName !== propertyName){
						// TODO: check it against all previous property names						
						if(!cache.propertyName){
							cache.propertyName = propertyName;
						}
						var nextCache = cache.get(keyValue);
						if(!nextCache){
							nextCache = new CacheEntry();
							cache.set(keyValue, nextCache);
							nextCache.parent = cache;
							nextCache.key = keyValue;
							nextCache.propertyName = propertyName;
						}
						cache = nextCache;
					}
					return keyValue;
				}
			};
			var variable = this;
			return lang.when(this.getValue(watchedContext), function(computedValue){
				if(computedValue && computedValue.notifies && this.dependents){
					if(variable.computedVariable && variable.computedVariable !== computedValue){
						throw new Error('Can pass in a different variable for a different context as the result of a single variable');
					}
					variable.computedVariable = computedValue;
				}
				computedValue = variable.gotValue(computedValue, watchedContext);
				if(computedValue && typeof computedValue === 'object' &&
						variable._properties && variable.dependents){

					cache.variable = variable;
				}
				cache.value = computedValue;
				if(cacheHolder && cacheHolder instanceof GetCache){
					cacheHolder.cache = cache;
				}
				return computedValue;
			});
		},

		getValue: function(){
			return this.value && this.value.valueOf();
		},
		invalidate: function(context){
			// TODO: there might actually be a collection of listeners
			// clear the cache
			if(context){
				// just based on the context
				var cache = this.getCache(context);
				// deregisterListener(cache.value, cache);
				delete cache.value;
			}else{
				// delete our whole cache if it is an unconstrained invalidation
				// deregisterListener(this.cache.value, this.cache);
				this.cache = {};
			}
			if(this.computedVariable){
				this.computedVariable = null;
			}
			Variable.prototype.invalidate.call(this, context);
		},
		cleanup: function(){
			// once we are no longer "live", we no longer receive notifications, so can't keep the cache up-to-date, better empty it
			this.cache = {};
			Variable.prototype.cleanup.call();
		}

	});

	function GetCache(){
	}

	var Property = lang.compose(Variable, function Property(parent, key){
		this.parent = parent;
		this.key = key;
	},
	{
		init: function(){
			this.parent.notifies(this);
		},
		cleanup: function(){
			Variable.prototype.cleanup.call(this);
			this.parent.stopNotifies(this);
		},
		valueOf: function(context){
			var key = this.key;
			var parent = this.parent;
			var property = this;
			var cacheHolder = new GetCache();
			return lang.when(parent.valueOf(context, cacheHolder), function(object){
				if(property.dependents){
					var cache = cacheHolder.cache || object;
					var listeners = propertyListenersMap.get(cache);
					if(listeners && listeners.observer && listeners.observer.addKey){
						listeners.observer.addKey(key);
					}
				}
				return property.gotValue(object == null ? undefined : object[key], context);
			});
		},
		put: function(value, context){
			return this._changeValue(context, RequestChange, value);
		},
		invalidate: function(context, type){
			if(type !== ToChild){
				this._changeValue(context, type);
			}
			if(type === ToChild || type == ToParent){
				return Variable.prototype.invalidate.call(this, context, type);
			} // else
		},
		_changeValue: function(context, type, newValue){
			var key = this.key;
			var parent = this.parent;
			return lang.when(parent.valueOf(context), function(object){
				if(object == null){
					return deny;
				}
				if(type == RequestChange){
					if(object[key] === newValue){
						// no actual change to make
						return noChange;
					}
					object[key] = newValue;
				}
				var listeners = propertyListenersMap.get(object);
				var parentListenerFound;
				if(listeners){
					for(var i = 0, l = listeners.length; i < l; i++){
						var listener = listeners[i];
						if (listener === parent){
							parentListenerFound = true;
						}
						listener._propertyChange(key, context, type);
					}
				}
				if(!parentListenerFound){
					// at least make sure we notify the parent
					parent._propertyChange(key, context, type);
				}
			});
		}
	});

	// a call variable is the result of a call
	var Call = lang.compose(Caching, function Call(functionVariable, args){
		this.functionVariable = functionVariable;
		this.args = args;
	}, {
		init: function(){
			// depend on the function itself
			this.functionVariable.notifies(this);
			// depend on the args
			var args = this.args;
			for(var i = 0, l = args.length; i < l; i++){
				var arg = args[i];
				if(arg.notifies){
					arg.notifies(this);
				}
			}
		},
		cleanup: function(){
			Caching.prototype.cleanup.call(this);
			this.functionVariable.stopNotifies(this);
			// depend on the args
			var args = this.args;
			for(var i = 0, l = args.length; i < l; i++){
				var arg = args[i];
				if(arg.notifies){
					arg.stopNotifies(this);
				}
			}
		},

		getValue: function(context){
			var call = this;
			return lang.when(this.functionVariable.valueOf(context), function(functionValue){
				return call.invoke(functionValue, call.args, context);
			});
		},
		execute: function(context){
			var call = this;
			return lang.when(this.functionVariable.valueOf(context), function(functionValue){
				return call.invoke(functionValue, call.args, context, true);
			});
		},

		put: function(value, context){
			var call = this;
			return lang.when(this.valueOf(context), function(originalValue){
				if(originalValue === value){
					return noChange;
				}
				return lang.when(call.functionVariable.valueOf(context), function(functionValue){
					return call.invoke(function(){
						if(functionValue.reverse){
							functionValue.reverse.call(call, value, call.args, context);
							return Variable.prototype.put.call(call, value, context);
						}else{
							return deny;
						}
					}, call.args, context);
				});				
			});
		},
		invoke: function(functionValue, args, context, observeArguments){
			var instance = this.functionVariable.parent;
			if(functionValue.handlesContext){
				return functionValue.apply(instance, args, context);
			}else{
				var results = [];
				for(var i = 0, l = args.length; i < l; i++){
					results[i] = args[i].valueOf(context);
				}
				instance = instance && instance.valueOf(context);
				if(functionValue.handlesPromises){
					return functionValue.apply(instance, results, context);
				}else{
					// include the instance in whenAll
					results.push(instance);
					// wait for the values to be received
					return lang.whenAll(results, function(inputs){
						if(observeArguments){
							var handles = [];
							for(var i = 0, l = inputs.length; i < l; i++){
								var input = inputs[i];
								if(input && typeof input === 'object'){
									handles.push(observe(input));
								}
							}
							var instance = inputs.pop();
							try{
								var result = functionValue.apply(instance, inputs, context);
							}finally{
								lang.when(result, function(){
									for(var i = 0; i < l; i++){
										handles[i].done();
									}
								});
							}
							return result;
						}
						var instance = inputs.pop();
						return functionValue.apply(instance, inputs, context);
					});
				}
			}
		}
	});
	Variable.Call = Call;

	var Items = lang.compose(Variable, function(parent){
		this.parent = parent;
	}, {
		init: function(){
			this.parent.notifies(this);
		},
		cleanup: function(){
			Variable.prototype.cleanup.call(this);
			this.parent.stopNotifies(this);
		},
		lastIndex: 0,
		valueOf: function(context){
			var parent = this.parent;
			var variable = this;
			return lang.when(parent.valueOf(context), function(array){

				if(!context || !array){
					return array;
				}
				var previous = context.get('after');
				if(!previous){
					return array[0];
				}else{
					// performance shortcut
					if(array[variable.lastIndex++] === previous){
						return array[variable.lastIndex];
					}
					for(var i = 0, l = array.length; i < l;){
						if(array[i++] === previous){
							variable.lastIndex = i;
							return array[i];
						}
					}
				}
				if(variable.dependents){
					lang.observeArray(array, function(events){
						event.name;
						variable.invalidate(new ArrayContext(changedItem));
					});
				}
			});
		},
		forEach: function(callback, context){
			var iteratorContext = lang.mixin({}, context);
			var variable = this;
			return lang.when(this.valueOf(iteratorContext), function(item){
				while(item){
					callback(item);
					iteratorContext.after = item;
					item = variable.valueOf(iteratorContext);
				}
			});
		}
	});
	var Validating = lang.compose(Caching, function(target, schema){
		this.target = target;
		this.targetSchema = schema;
	}, {
		init: function(){
			this.target.notifies(this);
			this.targetSchema.notifies(this);
		},
		cleanup: function(){
			Caching.prototype.cleanup.call(this);
			this.target.stopNotifies(this);
			this.targetSchema.stopNotifies(this);			
		},
		valueOf: function(context){
			return doValidation(this.target.valueOf(context), this.targetSchema.valueOf(context));
		}
	});

	var Schema = lang.compose(Caching, function(target){
		this.target = target;
	}, {
		init: function(){
			this.target.notifies(this);
		},
		cleanup: function(){
			Caching.prototype.cleanup.call(this);
			this.target.notifies(this);
		},
		getValue: function(context){
			if(this.value){ // if it has an explicit schema, we can use that.
				return this.value;
			}
			// get the schema, going through target parents until it is found
			return getSchema(this.target);
			function getSchema(target){
				return lang.when(target.valueOf(context), function(value){
					var schema;
					return (value && value._schema) || (target.parent && (schema = target.parent.schema)
						&& (schema = schema.valueOf()) && schema[target.key]);
				});
			}
		}
	});
	function validate(target){
		var schemaForObject = schema(target);
		return new Validating(target, schemaForObject);
	}
	Variable.deny = deny;
	Variable.noChange = noChange;
	function addFlag(name){
		Variable[name] = function(functionValue){
			functionValue[name] = true;
		};
	}
	addFlag(Variable, 'handlesContext');
	addFlag(Variable, 'handlesPromises');

	function observe(object){
		var listeners = propertyListenersMap.get(object);
		if(!listeners){
			propertyListenersMap.set(object, listeners = []);
		}
		if(listeners.observerCount){
			listeners.observerCount++;
		}else{
			listeners.observerCount = 1;
			var observer = listeners.observer = lang.observe(object, function(events){
				for(var i = 0, l = listeners.length; i < l; i++){
					var listener = listeners[i];
					for(var j = 0, el = events.length; j < el; j++){
						var event = events[j];
						listener._propertyChange(event.name);
					}
				}
			});
			if(observer.addKey){
				for(var i = 0, l = listeners.length; i < l; i++){
					var listener = listeners[i];
					listener.eachKey(function(key){
						observer.addKey(key);
					});
				}
			}
		}
		return {
			remove: function(){
				if(!(--listeners.observerCount)){
					listeners.observer.remove();
				}
			},
			done: function(){
				// deliver changes
				lang.deliverChanges(observer);
				this.remove();
			}
		};
	}
	Variable.observe = observe;
	return Variable;
});