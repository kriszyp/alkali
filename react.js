(function (root, factory) { if (typeof define === 'function' && define.amd) {
        define(['./util/lang', './Variable'], factory)
    } else if (typeof module === 'object' && module.exports) {
        module.exports = factory(require('./util/lang'), require('./Variable'))
    } else {
        root.alkali.react = factory(root.alkali.lang, root.alkali.Variable)
    }
}(this, function (lang, Variable) {

	function react(generator, options) {
		if (options && options.reverse) {
			generator.reverse = options.reverse
		}
		return new Variable.GeneratorVariable(generator)
	}
	return react
}))