(function (root, factory) { if (typeof define === 'function' && define.amd) {
	define([], factory) } else if (typeof module === 'object' && module.exports) {
	module.exports = factory() // Node
}}(this, function () {
	var getPrototypeOf = Object.getPrototypeOf || (function(base) { return base.__proto__ })
	var setPrototypeOf = Object.setPrototypeOf || (function(base, proto) {
		for (var key in proto) {
			try {
				if (!base.hasOwnProperty(key)) {
					if (proto.hasOwnProperty(key)) {
						Object.defineProperty(base, key,
							Object.getOwnPropertyDescriptor(proto, key))
					} else {
						base[key] = proto[key]
					}
				}
			} catch(error) {}
		}
	})
	var hasFeatures = {
		requestAnimationFrame: typeof requestAnimationFrame != 'undefined',
		defineProperty: Object.defineProperty && (function() {
			try{
				Object.defineProperty({}, 't', {})
				return true
			}catch(e) {
			}
		})(),
		promise: typeof Promise !== 'undefined',
		MutationObserver: typeof MutationObserver !== 'undefined',
		'WeakMap': typeof WeakMap === 'function'
	}
	function has(feature) {
		return hasFeatures[feature]
	}

	function SyncPromise(value) {
		this.value = value
	}
	SyncPromise.prototype = {
		then: function(onFulfilled, onRejected) {
			if (!onFulfilled) {
				return new SyncPromise(this.value)
			}
			try {
				var result = onFulfilled(this.value)
				return (result && result.then) ? result : new SyncPromise(result)
			} catch(error) {
				return new SyncErrorPromise(error)
			}
		},
		catch: function(handler) {
			return this.then(null, handler)
		}
	}
	function SyncErrorPromise(error) {
		this.value = error
		this.unhandledTimeout = setTimeout(function() {
			console.error('Uncaught (in promise)', error)
		})
	}
	SyncErrorPromise.prototype = new SyncPromise()
	SyncErrorPromise.prototype.then = function(onFulfilled, onRejected) {
		clearTimeout(this.unhandledTimeout)
		if (!onRejected) {
			return new SyncErrorPromise(this.value)
		}
		return SyncPromise.prototype.then.call(this, onRejected)
	}
	// This is an polyfill for Object.observe with just enough functionality
	// for what Variables need
	// An observe function, with polyfile
	var observe =
		has('defineProperty') ?
		function observe(target, listener) {
			/*for(var i in target) {
				addKey(i)
			}*/
			listener.addKey = addKey
			listener.remove = function() {
				listener = null
			}
			return listener
			function addKey(key) {
				var keyFlag = 'key' + key
				if(this[keyFlag]) {
					return
				}else{
					this[keyFlag] = true
				}
				var currentValue = target[key]
				var targetAncestor = target
				var descriptor
				do {
					descriptor = Object.getOwnPropertyDescriptor(targetAncestor, key)
				} while(!descriptor && (targetAncestor = getPrototypeOf(targetAncestor)))

				if(descriptor && descriptor.set) {
					var previousSet = descriptor.set
					var previousGet = descriptor.get
					Object.defineProperty(target, key, {
						get: function() {
							return (currentValue = previousGet.call(this))
						},
						set: function(value) {
							previousSet.call(this, value)
							if(currentValue !== value) {
								currentValue = value
								if(listener) {
									listener([{target: this, name: key}])
								}
							}
						},
						enumerable: descriptor.enumerable
					})
				}else{
					Object.defineProperty(target, key, {
						get: function() {
							return currentValue
						},
						set: function(value) {
							if(currentValue !== value) {
								currentValue = value
								if(listener) {
									listener([{target: this, name: key}])
								}
							}
						},
						enumerable: !descriptor || descriptor.enumerable
					})
				}
			}
		} :
		// and finally a polling-based solution, for the really old browsers
		function(target, listener) {
			if(!timerStarted) {
				timerStarted = true
				setInterval(function() {
					for(var i = 0, l = watchedObjects.length; i < l; i++) {
						diff(watchedCopies[i], watchedObjects[i], listeners[i])
					}
				}, 20)
			}
			var copy = {}
			for(var i in target) {
				if(target.hasOwnProperty(i)) {
					copy[i] = target[i]
				}
			}
			watchedObjects.push(target)
			watchedCopies.push(copy)
			listeners.push(listener)
		}
	var queuedListeners
	function queue(listener, object, name) {
		if(queuedListeners) {
			if(queuedListeners.indexOf(listener) === -1) {
				queuedListeners.push(listener)
			}
		}else{
			queuedListeners = [listener]
			lang.nextTurn(function() {
				queuedListeners.forEach(function(listener) {
					var events = []
					listener.properties.forEach(function(property) {
						events.push({target: listener.object, name: property})
					})
					listener(events)
					listener.object = null
					listener.properties = null
				})
				queuedListeners = null
			}, 0)
		}
		listener.object = object
		var properties = listener.properties || (listener.properties = [])
		if(properties.indexOf(name) === -1) {
			properties.push(name)
		}
	}
	var unobserve = has('observe') ? Object.unobserve :
		function(target, listener) {
			if(listener.remove) {
				listener.remove()
			}
			for(var i = 0, l = watchedObjects.length; i < l; i++) {
				if(watchedObjects[i] === target && listeners[i] === listener) {
					watchedObjects.splice(i, 1)
					watchedCopies.splice(i, 1)
					listeners.splice(i, 1)
					return
				}
			}
		}
	var watchedObjects = []
	var watchedCopies = []
	var listeners = []
	var timerStarted = false
	function diff(previous, current, callback) {
		// TODO: keep an array of properties for each watch for faster iteration
		var queued
		for(var i in previous) {
			if(previous.hasOwnProperty(i) && previous[i] !== current[i]) {
				// a property has changed
				previous[i] = current[i]
				(queued || (queued = [])).push({name: i})
			}
		}
		for(var i in current) {
			if(current.hasOwnProperty(i) && !previous.hasOwnProperty(i)) {
				// a property has been added
				previous[i] = current[i]
				(queued || (queued = [])).push({name: i})
			}
		}
		if(queued) {
			callback(queued)
		}
	}

	var id = 1
	// a function that returns a function, to stop JSON serialization of an
	// object
	function toJSONHidden() {
		return toJSONHidden
	}
	// An object that will be hidden from JSON serialization
	var Hidden = function () {
	}
	Hidden.prototype.toJSON = toJSONHidden

	var extendClass, constructOrCall
	try {
		// do this with an eval to avoid syntax errors in browsers that do not support class and new.target
		extendClass = eval('(function(Base){ return class extends Base {}})\n\n//# sourceURL=class-extend')
		var possibleConstructOrCall = eval('"use strict";(function(BaseClass, constructHandler, callHandler, constructClass){ return function Element() { return this instanceof Element ? constructHandler ? constructHandler.apply(new.target || this.constructor, arguments) : constructClass ? Reflect.construct(BaseClass, arguments, new.target || this.constructor) : lang.functionConstruct(BaseClass, arguments, new.target || this.constructor, this) : callHandler.apply(Element, arguments) } })\n\n//# sourceURL=construct-or-call')
		// actually using new.target bombs in Edge, so it is basically unusable
		new (possibleConstructOrCall(function() {}, function() {}))()
		constructOrCall = possibleConstructOrCall
	} catch(e) {
	}

	var lang = {
		requestAnimationFrame: has('requestAnimationFrame') ? requestAnimationFrame :
			(function() {
				var toRender = []
				var queued = false
				function processAnimationFrame() {
					for (var i = 0; i < toRender.length; i++) {
						toRender[i]()
					}
					toRender = []
					queued = false
				}
				function requestAnimationFrame(renderer) {
				 	if (!queued) {
						setTimeout(processAnimationFrame)
						queued = true
					}
					toRender.push(renderer)
				}
				return requestAnimationFrame
			})(),
		SyncPromise: SyncPromise,
		Promise: has('promise') ? Promise : (function() {
			function Promise(execute) {
				var isResolved, resolution, errorResolution
				var queue = 0
				function resolve(value) {
					// resolve function
					if(value && value.then) {
						// received a promise, wait for it
						value.then(resolve, reject)
					}else{
						resolution = value
						finished()
					}
				}
				function reject(error) {
					// reject function
					errorResolution = error
					finished()
				}
				execute(resolve, reject)
				function finished() {
					isResolved = true
					for(var i = 0, l = queue.length; i < l; i++) {
						queue[i]()
					}
					// clean out the memory
					queue = 0
				}
				return {
					then: function(callback, errback) {
						return new Promise(function(resolve, reject) {
							function handle() {
								// promise fulfilled, call the appropriate callback
								try{
									if(errorResolution && !errback) {
										// errors without a handler flow through
										reject(errorResolution)
									}else{
										// resolve to the callback's result
										resolve(errorResolution ?
											errback(errorResolution) :
											callback ?
												callback(resolution) : resolution)
									}
								}catch(newError) {
									// caught an error, reject the returned promise
									reject(newError)
								}
							}
							if(isResolved) {
								// already resolved, immediately handle
								handle()
							}else{
								(queue || (queue = [])).push(handle)
							}
						})
					}
				}
			}
			return Promise
		}()),
		Set: typeof Set !== 'undefined' ?
			new Set(['a']).length ? Set :
			function (elements) { // IE 11 doesn't support arguments to constructor
				var set = new Set()
				if (elements) {
					for (var i = 0; i < elements.length; i++) {
						set.add(elements[i])
					}
				}
				return set
			} :
		function (elements) {
			elements = elements || []
			return {
				add: function(element) {
					if (!this.has(element)) {
						elements.push(element)
					}
				},
				has: function(element) {
					return elements.indexOf(element) > -1
				}
			}
		},
		Map: typeof Map !== 'undefined' ? Map : function () {
			var map = Object.create(null)
			return {
				set: function(key, value) {
					map[key] = value
				},
				has: function(element) {
					return Object.prototype.hasOwnProperty.call(map, key)
				},
				get: function(key) {
					return map[key]
				}
			}
		},
		WeakMap: has('WeakMap') ? WeakMap :
	 	function (values, name) {
	 		var mapProperty = '__' + (name || '') + id++
	 		return has('defineProperty') ?
	 		{
	 			get: function (key) {
	 				return key[mapProperty]
	 			},
	 			set: function (key, value) {
	 				Object.defineProperty(key, mapProperty, {
	 					value: value,
	 					enumerable: false
	 				})
	 			}
	 		} :
	 		{
	 			get: function (key) {
	 				var intermediary = key[mapProperty]
	 				return intermediary && intermediary.value
	 			},
	 			set: function (key, value) {
	 				// we use an intermediary that is hidden from JSON serialization, at least
	 				var intermediary = key[mapProperty] || (key[mapProperty] = new Hidden())
	 				intermediary.value = value
	 			}
	 		}
	 	},

		observe: observe,
		unobserve: unobserve,
		extendClass: extendClass,
		when: function(value, callback, errorHandler) {
			return value && value.then ?
				(value.then(callback, errorHandler) || value) : callback(value)
		},
		compose: function(Base, constructor, properties) {
			var prototype = constructor.prototype = Object.create(Base.prototype)
			setPrototypeOf(constructor, Base)
			for(var i in properties) {
				prototype[i] = properties[i]
			}
			prototype.constructor = constructor
			return constructor
		},
		setPrototypeOf: setPrototypeOf,
		nextTurn: has('MutationObserver') ?
			function (callback) {
				// promises don't resolve consistently on the next micro turn (Edge doesn't do it right),
				// so use mutation observer
				// TODO: make a faster mode that doesn't recreate each time
				var div = document.createElement('div')
				var observer = new MutationObserver(callback)
				observer.observe(div, {
					attributes: true
				})
				div.setAttribute('a', id++)
			} :
			function (callback) {
				// TODO: we can do better for other, older browsers
				setTimeout(callback, 0)
			},
		copy: Object.assign || function(target, source) {
			for(var i in source) {
				target[i] = source[i]
			}
			return target
		},
		deepCopy: function(source) {
			if (source && typeof source == 'object') {
				if (source instanceof Array) {
					var target = [] // always create a new array for array targets
					for(var i = 0, l = source.length; i < l; i++) {
						target[i] = lang.deepCopy(source[i])
					}
				} else {
					var target = {}
					for (var i in source) {
						target[i] = lang.deepCopy(source[i])
					}
				}
				return target
			}
			return source
		},
		constructOrCall: constructOrCall || function(BaseClass, constructHandler, callHandler) {
			return function Element() {
				if (this instanceof Element) {
					if (!this.hasOwnProperty('constructor') && Element.prototype === getPrototypeOf(this)) {
						if (constructHandler) {
							return constructHandler.apply(Element, arguments)
						}
						if (lang.buggyConstructorSetter) {
							// in safari, directly setting the constructor messes up the native prototype
							Object.defineProperty(this, 'constructor', { value: Element })
						} else {
							this.constructor = Element
						}
					} else if (constructHandler) {
						return constructHandler.apply(this.constructor, arguments)
					}
					return BaseClass.apply(this, arguments)
				} else {
					return callHandler.apply(Element, arguments)
				}
			}
		},
		functionConstruct: function(BaseClass, args, SubClass, instance) {
			if (!instance.hasOwnProperty('constructor') && SubClass.prototype === Object.getPrototypeOf(instance)) {
				instance = Object.create(SubClass.prototype)
				if (lang.buggyConstructorSetter) {
					// in safari, directly setting the constructor messes up the native prototype
					Object.defineProperty(instance, 'constructor', { value: SubClass })
				} else {
					instance.constructor = SubClass
				}
			}
			return BaseClass.apply(instance, args)
		}
	}
	function isGenerator(func) {
		if (typeof func === 'function') {
			var constructor = func.constructor
			// this is used to handle both native generators and transpiled generators
			return (constructor.displayName || constructor.name) === 'GeneratorFunction'
		}
	}
	function isGeneratorIterator(iterator) {
		if (iterator && iterator.next) {
			var constructor = iterator.constructor.constructor
			return (constructor.displayName || constructor.name) === 'GeneratorFunction'
		}
	}
	lang.isGenerator = isGenerator

	function spawn(generator) {
		var generatorIterator = typeof generator === 'function' ? generator() : generator
		var resuming
		var nextValue
		var isThrowing
		return next()
		function next() {
			do {
				var stepReturn = generatorIterator[isThrowing ? 'throw' : 'next'](nextValue)
				if (stepReturn.done) {
					return stepReturn.value
				}
				nextValue = stepReturn.value
				// if the return value is a (generator) iterator, execute it
				if (nextValue && nextValue.next && isGeneratorIterator(nextValue)) {
					nextValue = spawn(nextValue)
				}
				if (nextValue && nextValue.then) {
					// if it is a promise, we will wait on it
					// and return the promise so that the next caller can wait on this
					var resolved
					var isSync = null
					var result = nextValue.then(function(value) {
						nextValue = value
						isThrowing = false
						if (isSync === false) {
							return next()
						} else {
							isSync = true
						}
					}, function(error) {
						nextValue = error
						isThrowing = true
						return next()
					})
					if (!isSync) {
						isSync = false
						return result
					} // else keeping looping to avoid recursion
				}
				isThrowing = false
			} while(true)
		}
	}
	lang.spawn = spawn
	return lang
}))
