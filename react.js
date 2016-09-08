define(['./util/lang', './Variable', './operators'], function (lang, Variable, operators) {

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
  react.from = function(value) {
    if (value && value.property) {
      return value
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
      return target.apply(null, args)
    }
    return new Variable.Call(target, args)
  }
  react.mcall = function(target, key, args) {
    var method = target[key]
    if (method.property && typeof method === 'function') {
      return method.apply(target, args)
    }
    return new Variable.Call(target[key].bind(target), args)
  }
  react.ncall = function(target, args) {
    if (target.property && typeof target === 'function') {
      return new (target.bind.apply(target, [null].concat(args)))()
    }
    return new Variable.Call(function() {
      return new (target.bind.apply(target, [null].concat(arguments)))()
    }, args)
  }

	return react
})