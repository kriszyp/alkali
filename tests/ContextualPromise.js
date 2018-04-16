define(function(require) {
	require('bluebird/js/browser/bluebird')
	var VariableExports = require('../Variable')
	var ContextualPromise = require('../util/ContextualPromise')
	var Variable = VariableExports.Variable
	var Context = VariableExports.Context
	suite('Contextual Promise', function() {

		test('preserve context', function() {
			var context = new Context({ flag: true })
			var MyVariable = Variable({})
			MyVariable.prototype.valueOf = function() {
				var myContext = VariableExports.currentContext
				return myContext
			}
			var myVar = new MyVariable()
			assert.equal(myVar.valueOf(), undefined)
			var promise = context.executeWithin(function() {
				assert.isTrue(myVar.valueOf().subject.flag)
				return new ContextualPromise(function(resolved) {
					setTimeout(resolved)
				}).then(function() {
					assert.isTrue(myVar.valueOf().subject.flag)
				})
			})
			assert.equal(myVar.valueOf(), undefined)
			return promise
		})
	})
})
