define(['./lang', './Variable'], function(lang, Variable) {
	var GeneratorVariable = lang.compose(Variable.Composite, function Call(generator){
		this.generator = generator
	}, {
		init: function() {
			this.args = []
		},
		getValue: function(context) {
			var lastValue
			var generation = this.generator()
			var i = 0
			var args = this.args
			do {
				var stepReturn = generation.next(lastValue)
				if (stepReturn.done) {
					return stepReturn.value
				}
				var nextVariable = stepReturn.value
				if (args[i] !== nextVariable) {
					if (args[i]) {
						args[i].unsubscribe(this)
					}
					nextVariable.subscribe(this)
					this.args[i] = nextVariable
				}
				i++
				lastValue = nextVariable.valueOf()
			} while(true)
		}
	})

	function react(generator) {
		return new GeneratorVariable(generator)
	}
	return react
})