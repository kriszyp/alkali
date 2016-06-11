define(['./util/lang', './Variable'], function (lang, Variable) {

	function react(generator, options) {
		if (options && options.reverse) {
			generator.reverse = options.reverse
		}
		return new Variable.GeneratorVariable(generator)
	}
	return react
})