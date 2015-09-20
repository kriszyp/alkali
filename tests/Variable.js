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
			variable.notifies({
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
			variable.notifies({
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
		'on/off': function () {
			var invalidated = false;
			var value = 1;
			var variable = new Variable.Caching(function () {
				return value;
			}, function (newValue) {
				value = newValue;
			});
			var target = {
				invalidate: function(){
					invalidated = true;
				}
			};
			variable.notifies(target);
			assert.equal(variable.valueOf(), 1);
			assert.isFalse(invalidated);
			variable.put(2);
			assert.equal(variable.valueOf(), 2);
			assert.equal(value, 2);
			assert.isTrue(invalidated);
			variable.stopNotifies(target);
			invalidated = false;
			variable.put(3);
			assert.isFalse(invalidated);	
		},
		'property access': function () {
			var object = {
				a: 1,
				b: 10
			};
			var variable = new Variable(object);
			Variable.observe(object);
			var invalidated;
			var aProperty = variable.property('a');
			aProperty.notifies({
				invalidate: function(){
					invalidated = true;
				}
			});
			assert.equal(aProperty.valueOf(), 1);
			object.a = 2;
			return Promise.resolve().then(function(){
			//Object.deliverChangeRecords && Object.deliverChangeRecords();
				assert.equal(aProperty.valueOf(), 2);
				assert.isTrue(invalidated);
				invalidated = false;
				variable.put({
					a: 3
				});
				assert.equal(aProperty.valueOf(), 3);
				assert.isTrue(invalidated);
			});
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
			sum.notifies({
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
		map: function () {
			var a = new Variable();
			var b = new Variable();
			var sum = a.map(function (a) {
				return b.map(function(){
					return a + b;
				});
			});
			var invalidated = false;
			sum.notifies({
				invalidate: function() {
					invalidated = true;
				}
			});
			var target = new Variable();
			target.put(sum);
			var targetInvalidated = false;
			target.notifies({
				invalidate: function() {
					targetInvalidated = true;
				}
			});
			a.put(3);
			// assert.isFalse(invalidated);
			b.put(5);
			//assert.isTrue(invalidated);
			assert.equal(sum.valueOf(), 8);
			invalidated = false;
			assert.equal(target.valueOf(), 8);
			targetInvalidated = false;
			a.put(4);
			assert.isTrue(invalidated);
			assert.equal(sum.valueOf(), 9);
			invalidated = false;
			assert.isTrue(targetInvalidated);
			assert.equal(target.valueOf(), 9);
			targetInvalidated = false;
			b.put(6);
			assert.isTrue(invalidated);
			assert.equal(sum.valueOf(), 10);
			assert.isTrue(targetInvalidated);
			assert.equal(target.valueOf(), 10);
		},
                derivedMap: function() {
                  var a = new Variable(2);
                  var b = new Variable(3);
                  var sum = a.map(function (a_val) {
                    return b.map(function(b_val){
                      return a_val + b_val;
                    });
                  });
                  var mult = sum.map(function(s) { return s.valueOf() * 2; });
                  assert.equal(mult.valueOf(), 10);
                },
                derivedMapWithArray: function() {
                  var a = new Variable([2]);
                  var b = new Variable([3]);
                  var sum = a.map(function (a_val) {
                    return b.map(function(b_val){
                      return [a_val[0] + b_val[0]];
                    });
                  });
                  assert.deepEqual(sum.valueOf(), [5]);
                  var mult = sum.map(function(s) { return [s.valueOf()[0] * 2]; });
                  assert.deepEqual(mult.valueOf(), [10]);
                },
                mapWithArray: function() {
                  var values = [0,1,2,3,4,5]
                  var all = new Variable(values);
                  var odd = all.map(function(arr) {
                    var result = [], i = 0;
                    for (;i<arr.length; i++) {
                      if (arr[i] % 2 == 1) result.push(arr[i]);
                    }
                    return result;
                  });
                  var last = odd.map(function(arr) {
                    return arr[arr.length-1];
                  });
                  assert.deepEqual(last.valueOf(), 5);
                },
                derivedConditionalMapWithArray: function() {
                  var values = [0,1,2,3,4,5]
                  var all = new Variable(values);
                  var subset = new Variable([2,3,4]);
                  var returnSubset = false;
                  var filter1 = all.map(function (all_val) {
                    return subset.map(function(subset_val) {
                      return returnSubset ? subset_val : all_val;
                    });
                  });
                  var filter2 = filter1.map(function(filter1_val) { return [filter1_val[0]]; }); 
                  assert.deepEqual(filter1.valueOf(), values, 'filter1 should return all values');
                  assert.deepEqual(filter2.valueOf(), [1], 'filter2 should return first element of all values');
                  returnSubset = true;
                  filter1.invalidate();
                  assert.deepEqual(filter1.valueOf(), [2,3,4], 'filter1 should return subset of values');
                  assert.deepEqual(filter2.valueOf(), [2], 'filter2 should return first element of subset');
                },
		items: function () {

		},
		schema: function () {
			var object = {
				a: 1,
				b: 'foo'
			};
			var variable = new Variable(object);
			var schema = variable.schema;
			schema.put({
				a: 'number',
				b: 'string'
			});
			doValidation = function(target, schema){
				if(typeof target != schema){
					return ['error'];
				}
				return [];
			};
			var propertyA = variable.property('a');
			assert.equal(propertyA.schema.valueOf(), 'number');
			assert.deepEqual(propertyA.validate.valueOf(), []);
			object.a = 'not a number';
			assert.deepEqual(propertyA.validate.valueOf(), ['error']);
			object.a = 8;
			assert.deepEqual(propertyA.validate.valueOf(), []);
		}
	});
});
