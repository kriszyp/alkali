(function (root, factory) { if (typeof define === 'function' && define.amd) {
  define(['./util/lang', './operators', './Variable'], factory) } else if (typeof module === 'object' && module.exports) {        
  module.exports = factory(require('./util/lang'), require('./operators'), require('./Variable')) // Node
}}(this, function (lang, operators, Variable) {

  var isGenerator = lang.isGenerator
  var ObjectTransform = lang.compose(Variable.Call, function ObjectTransform(transform, inputs) {
    this.inputs = inputs
    Variable.Call.apply(this, arguments)
  }, {
    _getAsObject: function() {
      return this.transform.apply(this, preserveObjects(this.inputs))
    }
  })
  function preserveObjects(inputs) {
    for (var i = 0, l = inputs.length; i < l; i++) {
      var input = inputs[i]
      if (input && input._getAsObject) {
        inputs[i] = input._getAsObject()
      }
    }
    return inputs
  }
	function react(generator, options) {
    if (typeof generator !== 'function') {
      throw new Error('react() must be called with a generator. You need to use the babel-plugin-transform-alkali plugin if you want to use reactive expressions')
    }
		if (options && options.reverse) {
			generator.reverse = options.reverse
		}
		return new Variable.GeneratorVariable(generator)
	}
  Object.assign(react, operators)
  react.from = function(value, options) {
    if (value && value.property) {
      return value
    }
    if (typeof value === 'function' && isGenerator(value)) {
      return react(value, options)
    }
    return Variable.from(value)
  }
  react.prop = function(object, property) {
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
  }
  react.cond = function(test, consequent, alternate) {
    return operators.if(test, operators.choose(consequent, alternate))
  }
  react.fcall = function(target, args) {
    if (target.property && typeof target === 'function') {
      return target.apply(null, preserveObjects(args))
    }
    return new Variable.Call(target, args)
  }
  react.mcall = function(target, key, args) {
    var method = target[key]
    if (typeof method === 'function' && method.property || key === 'bind') {
      // for now we check to see if looks like it could handle a variable, or is a bind call
      return method.apply(target, preserveObjects(args))
    }
    return new Variable.Call(target[key].bind(target), args)
  }
  react.ncall = function(target, args) {
    if (target.property && typeof target === 'function') {
      return new (target.bind.apply(target, [null].concat(preserveObjects(args))))()
    }
    return new Variable.Call(function() {
      return new (target.bind.apply(target, [null].concat(arguments)))()
    }, args)
  }

  react.obj = function(transform, inputs) {
    return new ObjectTransform(transform, inputs)
  }

	return react
}))