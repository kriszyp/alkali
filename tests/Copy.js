define(function(require) {
	var VariableExports = require('../Variable')
	var Copy = require('../Copy')
	var Variable = VariableExports.Variable
	suite('Copy Variable', function() {

		test('simple single value', function() {
			var invalidated = false;
			var variable = new Variable({
				a: 1,
				b: 2
			});
			var a = variable.property('a');
			var copy = new Copy(variable);
			var copyA = copy.property('a');
			var invalidated = false;
			a.notifies({
				updated: function(){
					invalidated = true;
				}
			});
			var copyInvalidated = false;
			copyA.notifies({
				updated: function(){
					copyInvalidated = true;
				}
			});
			copyA.put('4');
			assert.isTrue(copyInvalidated);
			assert.isFalse(invalidated);
			copy.save();
			assert.isTrue(invalidated);
			assert.equal(a.valueOf(), 4);
		})
		test('nested object', function() {
			var invalidated = false;
			var variable = new Variable({
				a: 1,
				b: {
					c: 3
				}
			});
			var c = variable.property('b').property('c');
			var copy = new Copy(variable);
			var copyC = copy.property('b').property('c');
			var invalidated = false;
			c.notifies({
				updated: function(){
					invalidated = true;
				}
			});
			var copyInvalidated = false;
			copyC.notifies({
				updated: function(){
					copyInvalidated = true;
				}
			});
			copyC.put('4');
			assert.isTrue(copyInvalidated);
			assert.isFalse(invalidated);
			copy.save();
			assert.isTrue(invalidated);
			assert.equal(c.valueOf(), 4);
		})

	});
});
