define([
	'../Variable',
	'intern!object',
	'intern/chai!assert'
], function (Variable, registerSuite, assert) {
	registerSuite({
		name: 'Variable',

		'simple single value': function () {
			var invalidated = false;
			var variable = new Variable(1);
			variable.dependencyOf({
				invalidate: function(){
					invalidated = true;
				}
			});
			assert.equal(variable.valueOf(), 1);
			assert.isFalse(invalidated);
			variable.put(2);
			assert.equal(variable.valueOf(), 2);
			assert.isTrue(invalidated);
		},

		'simple caching value': function () {
			var invalidated = false;
			var value = 1;
			var variable = new Variable.Caching(function () {
				return value;
			}, function (newValue) {
				value = newValue;
			});
			variable.dependencyOf({
				invalidate: function(){
					invalidated = true;
				}
			});
			assert.equal(variable.valueOf(), 1);
			assert.isFalse(invalidated);
			variable.put(2);
			assert.equal(variable.valueOf(), 2);
			assert.equal(value, 2);
			assert.isTrue(invalidated);
		},
		'property access': function () {
			var object = {
				a: 1,
				b: 10
			};
			var variable = new Variable(object);
			var invalidated;
			var aProperty = variable.property('a');
			aProperty.dependencyOf({
				invalidate: function(){
					invalidated = true;
				}
			});
			assert.equal(aProperty.valueOf(), 1);
			object.a = 2;
			//Object.deliverChangeRecords && Object.deliverChangeRecords();
			assert.equal(aProperty.valueOf(), 2);
			assert.isTrue(invalidated);
			invalidated = false;
			variable.put({
				a: 3
			});
			assert.equal(aProperty.valueOf(), 3);
			assert.isTrue(invalidated);
		},
		'function call': function () {
			var add = new Variable(function (a, b) {
				return a + b;
			}, function (value, args) {
				args[0].put(value - args[1].valueOf());
			});
			var a = new Variable(1);
			var b = new Variable(2);
			var sum = add.apply(null, [a, b]);
			var invalidated;
			sum.dependencyOf({
				invalidate: function(){
					invalidated = true;
				}
			});
			assert.equal(sum.valueOf(), 3);
			a.put(3);
			assert.isTrue(invalidated);
			assert.equal(sum.valueOf(), 5);
			invalidated = false;
			b.put(4);
			assert.isTrue(invalidated);
			assert.equal(sum.valueOf(), 7);
		},
		items: function () {

		},
		schema: function () {
			var object = {
				a: 1,
				b: 'foo'
			};
			var variable = new Variable(object);
			var schema = variable.schema();
			schema.put({
				a: 'number',
				b: 'string'
			});
			var propertyA = variable.property('a');
			assert.equal(propertyA.schema().valueOf(), 'number');
			assert.equal(propertyA.validate().valueOf(), []);
			object.a = 'not a number';
			assert.equal(propertyA.validate().valueOf(), ['error']);
		}
	});
});
