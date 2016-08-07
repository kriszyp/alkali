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
    if (value && value.notifies) {
      return value
    }
    return new Variable(value)
  }
  react.prop = function(object, property) {
    if (object) {
      var value = object[property]
      if (value !== undefined || !object.property) {
        return value
      } else {
        return object.property(property)
      }
    }
    return object
  }
  react.cond = function(test, consequent, alternate) {
    return operators.if(test, operators.choose(consequent, alternate))
  }
  react.fcall = function(target, args) {
    return new Variable.Call(target, args)
  }
  react.mcall = function(target, key, args) {
    return new Variable.Call(target[key].bind(target), args)
  }
	return react
})