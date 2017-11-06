define([
	'../reactive',
	'bluebird/js/browser/bluebird'
], function (reactive, Promise) {
	suite('reactive', function() {

		test('primitive types', function() {
			var numVar = reactive(3)
			assert.equal(numVar.valueOf(), 3)
			assert.equal(numVar.to(function(num) { return num * 2 }).valueOf(), 6)
			var strVar = reactive('hello')
			assert.equal(strVar.valueOf(), 'hello')
			assert.equal(strVar.toUpperCase().valueOf(), 'HELLO')
			var boolVar = reactive(false)
			assert.strictEqual(boolVar.valueOf(), false)
			assert.strictEqual(boolVar.to(function(bool) { return !bool }).valueOf(), true)
		})
		test('native types', function() {
			if (typeof Map === 'undefined') {
				return
			}
			var setVar = reactive(new Set())
			setVar.add(4)
			assert.equal(setVar.valueOf().size, 1)
		})
		''
	})
})
