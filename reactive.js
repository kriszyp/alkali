(function (root, factory) { if (typeof define === 'function' && define.amd) {
	define(['./util/lang', './operators', './Variable'], factory) } else if (typeof module === 'object' && module.exports) {
	module.exports = factory(require('./util/lang'), require('./operators'), require('./Variable')) // Node
}}(this, function (lang, operators, VariableExports) {

	var Transform = VariableExports.Transform
	var Variable = VariableExports.Variable
	var VArray = VariableExports.VArray
	var isGenerator = lang.isGenerator
	var ObjectTransform = lang.compose(Transform, function ObjectTransform(source, transform, sources) {
		this.sources = sources
		Transform.apply(this, arguments)
	}, {
		_getAsObject: function() {
			return this.transform.apply(this, preserveObjects(this.sources))
		}
	})
	function preserveObjects(sources) {
		for (var i = 0, l = sources.length; i < l; i++) {
			var source = sources[i]
			if (source && source._getAsObject) {
				sources[i] = source._getAsObject()
			}
		}
		return sources
	}

	var typeMappings = new Map()
	typeMappings.set('string', VariableExports.VString)
	typeMappings.set('number', VariableExports.VNumber)
	typeMappings.set('boolean', VariableExports.VBoolean)
	typeMappings.set('undefined', Variable)
	typeMappings.set(null, Variable)
	typeMappings.set(Array, VArray)
	typeMappings.set(Map, VariableExports.VMap)
	typeMappings.set(Set, VariableExports.VSet)
	function reactive(value) {
		return fromValue(value, true)
	}
	function fromValue(value, fixed, deferObject) {

		// get the type for primitives or known constructors (or null)
		let Type = typeMappings.get(typeof value) || typeMappings.get(value && value.constructor)
		if (Type) {
			return new Type(value)
		}
		if (deferObject) {
			return
		}
		// an object
		var objectVar = new Variable()
		if (fixed) {
			objectVar.fixed = true
		}
		for (var key in value) {
			var propertyValue = value[key]
			var propertyVariable = fromValue(propertyValue, false, true)
			if (propertyVariable) {
				propertyVariable.key = key
				propertyVariable.parent = objectVar
				if (objectVar[key] === undefined) {
					objectVar[key] = propertyVariable
				} else {
					(objectVar._properties || (objectVar._properties = {}))[key] = propertyVariable
				}
			} else {
				// deferred, use getter/setter
				defineValueProperty(objectVar, key, value)
			}
		}
		return objectVar
	}


	function defineValueProperty(target, key, object) {
		var Type
		Object.defineProperty(target, key, {
			get: function() {
				return reactive.get(this, key, Type || (Type = fromValue(object[key])))
			},
			set: function(value) {
				reactive.set(this, key, value)
			},
			enumerable: true
		})
	}
	lang.copy(reactive, {
		from: function(value, options) {
			if (value && value.property) {
				return value
			}
			if (typeof value === 'function' && isGenerator(value)) {
				return VariableExports.react(value, options)
			}
			return Variable.from(value)
		},
		getp: function(object, property) {
			if (object) {
				// TODO: Use a static set of public methods/properties that can be accessed
				if (object.property) {
					// it is a variable already, but check to see if we are using a method/property directly on the variable
					var directPropertyValue = object[property]
					return directPropertyValue !== undefined ? directPropertyValue : object.property(property)
				}
				return object[property]
			}
			// not even truthy, return undefined
		},
		get: function(target, key, Type) { // for TS/Babel decorators
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
		},
		set: function(target, key, value) {
			var property = target[key]
			property.parent ? property._changeValue(3, value) : property.put(value)
		},
		prop: function(Type) {
			return function(prototype, key) {
				defineProperty(prototype, key, Type)
			}
		},
		cond: function(test, consequent, alternate) {
			return operators.if(test, operators.choose(consequent, alternate))
		},
		fcall: function(target, args) {
			if (target.property && typeof target === 'function') {
				return target.apply(null, preserveObjects(args))
			}
			return new Transform(args[0], target, args)
		},
		mcall: function(target, key, args) {
			var method = target[key]
			if (typeof method === 'function' && method.property || key === 'bind') {
				// for now we check to see if looks like it could handle a variable, or is a bind call
				return method.apply(target, preserveObjects(args))
			}
			return new Transform(args[0], target[key].bind(target), args)
		},
		ncall: function(target, args) {
			if (target.property && typeof target === 'function') {
				return new (target.bind.apply(target, [null].concat(preserveObjects(args))))()
			}
			return new Transform(args[0], function() {
				return new (target.bind.apply(target, [null].concat(arguments)))()
			}, args)
		},

		obj: function(sources) {
			return sources
			//return new ObjectTransform(sources[0], transform, sources)
		},

		val: function(value) {
			return value && value.valueOf()
		},
		cls: function(definitions) {
			reactive = this // TODO: clean this up
			return function(Class) {
				var prototype = Class.prototype
				if (!(prototype instanceof Variable)) {
					if (Object.getPrototypeOf(prototype) == Object.prototype) {
						Object.setPrototypeOf(Class, Variable)
						Object.setPrototypeOf(prototype, Variable.prototype)
					} else {
						console.warn('Unable to make class a reactive variable')
					}
				}
				for (var key in definitions) {
					defineProperty(prototype, key, definitions[key])
				}
			}
		}
	})
	lang.copy(reactive, operators)

	function getType(Type) {
		if (typeMappings.has(Type)) {
			return typeMappings.get(Type)
		} else if (typeof Type === 'object') {
			if (Type instanceof Array) {
				if (Type[0]) {
					return VArray.of(getType(Type[0]))
				} else {
					return VArray
				}
			}
			var typedObject = {}
			for (var key in Type) {
				typedObject[key] = getType(Type[key])
			}
			return Variable.with(typedObject)
		}
		return Type
	}

	function defineProperty(target, key, Type) {
		if (!Type) {
			console.warn('Invalid type specified for', target && target.constructor.name, 'property', key, '(ensure you are using a concrete type, not an interface)')
		} else if (!Type.notifies) {
			Type = getType(Type) || Variable
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

	return reactive
}))
