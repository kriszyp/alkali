define(['./util/lang', './Variable'], function(lang, Variable) {
	var getValue
	var GeneratorVariable = lang.compose(Variable.Composite, function Call(generator){
		this.generator = generator
	}, {
		init: function() {
			this.args = []
		},
		getValue: getValue = function(context, resuming) {
			var lastValue
			var i
			var generatorIterator
			if (resuming) {
				// resuming from a promise
				generatorIterator = resuming.iterator
				i = resuming.i
				lastValue = resuming.value
			} else {
				// a fresh start
				i = 0
				generatorIterator = this.generator()				
			}
			
			var args = this.args
			do {
				var stepReturn = generatorIterator.next(lastValue)
				if (stepReturn.done) {
					return stepReturn.value
				}
				var nextVariable = stepReturn.value
				// compare with the arguments from the last
				// execution to see if they are the same
				if (args[i] !== nextVariable) {
					if (args[i]) {
						args[i].stopNotifies(this)
					}
					// subscribe if it is a variable
					if (nextVariable && nextVariable.notifies) {
						nextVariable.notifies(this)
						this.args[i] = nextVariable
					} else {
						this.args[i] = null
					}
				}
				i++
				lastValue = nextVariable && nextVariable.valueOf(context)
				if (lastValue && lastValue.then) {
					// if it is a promise, we will wait on it
					var variable = this
					// and return the promise so that the getValue caller can wait on this
					return lastValue.then(function(value) {
						return getValue.call(this, context, {
							i: i,
							iterator: generatorIterator,
							value: value
						})
					})
				}
			} while(true)
		}
	})

	function react(generator, options) {
		if (options && options.reverse) {
			generator.reverse = options.reverse
		}
		return new GeneratorVariable(generator)
	}
	return react
})