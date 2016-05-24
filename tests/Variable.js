define([
	'../Variable',
	'intern!object',
	'intern/chai!assert',
	'bluebird/js/browser/bluebird'
], function (Variable, registerSuite, assert, bluebird) {
	if (typeof window != 'undefined' && !window.Promise) {
		window.Promise = bluebird
	}
	registerSuite({
		name: 'Variable',

		'simple single value': function () {
			var invalidated = false
			var variable = new Variable(1)
			variable.notifies({
				updated: function(){
					invalidated = true
				}
			})
			assert.equal(variable.valueOf(), 1)
			assert.isFalse(invalidated)
			variable.put(2)
			assert.equal(variable.valueOf(), 2)
			assert.isTrue(invalidated)
		},

		'simple caching value': function () {
			var invalidated = false
			var value = 1
			var variable = new Variable.Caching(function () {
				return value
			}, function (newValue) {
				value = newValue
			})
			variable.notifies({
				updated: function(){
					invalidated = true
				}
			})
			assert.equal(variable.valueOf(), 1)
			assert.isFalse(invalidated)
			variable.put(2)
			assert.equal(variable.valueOf(), 2)
			assert.equal(value, 2)
			assert.isTrue(invalidated)
		},
		'simple caching value, no subscribe': function () {
			var recomputed = false
			var value = 1
			var variable = new Variable(1)
			var result = variable.map(function(value){
				return value * 2
			}).map(function(value) {
				recomputed = true
				return value * 2
			})
			assert.equal(result.valueOf(), 4)
			recomputed = false
			assert.equal(result.valueOf(), 4)
			// should be cached
			assert.isFalse(recomputed)
			variable.put(2)
			assert.equal(result.valueOf(), 8)
			assert.isTrue(recomputed)
		},
		'on/off': function () {
			var invalidated = false
			var value = 1
			var variable = new Variable.Caching(function () {
				return value
			}, function (newValue) {
				value = newValue
			})
			var target = {
				updated: function(){
					invalidated = true
				}
			}
			variable.notifies(target)
			assert.equal(variable.valueOf(), 1)
			assert.isFalse(invalidated)
			variable.put(2)
			assert.equal(variable.valueOf(), 2)
			assert.equal(value, 2)
			assert.isTrue(invalidated)
			variable.stopNotifies(target)
			invalidated = false
			variable.put(3)
			assert.isFalse(invalidated);	
		},
		'property access': function () {
			var object = {
				a: 1,
				b: 10
			}
			var variable = new Variable(object)
			Variable.observe(object)
			var invalidated
			var aProperty = variable.property('a')
			aProperty.notifies({
				updated: function(){
					invalidated = true
				}
			})
			assert.equal(aProperty.valueOf(), 1)
			object.a = 2
			return Promise.resolve().then(function(){
			//Object.deliverChangeRecords && Object.deliverChangeRecords()
				assert.equal(aProperty.valueOf(), 2)
				assert.isTrue(invalidated)
				invalidated = false
				variable.put({
					a: 3
				})
				assert.equal(aProperty.valueOf(), 3)
				assert.isTrue(invalidated)
			})
		},
		'function call': function () {
			var add = new Variable(function (a, b) {
				return a + b
			}, function (value, args) {
				args[0].put(value - args[1].valueOf())
			})
			var a = new Variable(1)
			var b = new Variable(2)
			var sum = add.apply(null, [a, b])
			var invalidated
			sum.notifies({
				updated: function(){
					invalidated = true
				}
			})
			assert.equal(sum.valueOf(), 3)
			a.put(3)
			assert.isTrue(invalidated)
			assert.equal(sum.valueOf(), 5)
			invalidated = false
			b.put(4)
			assert.isTrue(invalidated)
			assert.equal(sum.valueOf(), 7)
		},
		map: function () {
			var a = new Variable()
			var b = new Variable()
			var sum = a.to(function (a) {
				return b.to(function(){
					return a + b
				})
			})
			var invalidated = false
			sum.notifies({
				updated: function() {
					invalidated = true
				}
			})
			var target = new Variable()
			target.put(sum)
			var targetInvalidated = false
			target.notifies({
				updated: function() {
					targetInvalidated = true
				}
			})
			a.put(3)
			// assert.isFalse(invalidated)
			b.put(5)
			//assert.isTrue(invalidated)
			assert.equal(sum.valueOf(), 8)
			invalidated = false
			assert.equal(target.valueOf(), 8)
			targetInvalidated = false
			a.put(4)
			assert.isTrue(invalidated)
			assert.equal(sum.valueOf(), 9)
			invalidated = false
			assert.isTrue(targetInvalidated)
			assert.equal(target.valueOf(), 9)
			targetInvalidated = false
			b.put(6)
			assert.isTrue(invalidated)
			assert.equal(sum.valueOf(), 10)
			assert.isTrue(targetInvalidated)
			assert.equal(target.valueOf(), 10)
		},
		derivedMap: function() {
			var a = new Variable(2)
			var b = new Variable(3)
			var sum = a.to(function (a_val) {
				return b.to(function(b_val){
					return a_val + b_val
				})
			})
			var mult = sum.to(function(s) { return s.valueOf() * 2; })
			assert.equal(mult.valueOf(), 10)
			b.put(4)
			assert.equal(mult.valueOf(), 12)
		},
		derivedMapWithArray: function() {
			var a = new Variable([2])
			var b = new Variable([3])
			var sum = a.to(function (a_val) {
				return b.to(function(b_val){
					return [a_val[0] + b_val[0]]
				})
			})
			assert.deepEqual(sum.valueOf(), [5])
			var mult = sum.to(function(s) { return [s.valueOf()[0] * 2]; })
			assert.deepEqual(mult.valueOf(), [10])
			b.put([4])
												assert.deepEqual(mult.valueOf(), [12])
		},
		derivedComposedInvalidations: function() {
			var outer = new Variable(false)
			var signal = new Variable()
			var arr = [1,2,3]
			var data = signal.to(function() { return arr; })
			var inner = data.to(function(a) { return a.map(function(v) { return v*2; }); })
			var derived = outer.to(function (o) {
				return inner.to(function(i){
					return [o, i]
				})
			})
			assert.deepEqual(derived.valueOf(), [false, [2,4,6]])
			outer.put(true)
			arr = [4,5,6]
			signal.updated()
			outer.put(false)
			assert.deepEqual(derived.valueOf(), [false, [8,10,12]])
		},
		mapWithArray: function() {
			var values = [0,1,2,3,4,5]
			var all = new Variable(values)
			var odd = all.to(function(arr) {
				var result = [], i = 0
				for (;i<arr.length; i++) {
					if (arr[i] % 2 == 1) result.push(arr[i])
				}
				return result
			})
			var last = odd.to(function(arr) {
				return arr[arr.length-1]
			})
			assert.deepEqual(last.valueOf(), 5)
		},
		derivedConditionalMapWithArrayDependencyFree: function() {
			var values = [0,1,2,3,4,5]
			var all = new Variable(values)
			var subset = new Variable([2,3,4])
			var returnSubset = false
			var filter1 = all.to(function (all_val) {
				return subset.to(function(subset_val) {
					return returnSubset ? subset_val : all_val
				})
			})
			var filter2 = filter1.to(function(filter1_val) { return [filter1_val[0]]; }); 
			assert.deepEqual(filter1.valueOf(), values, 'filter1 should return all values')
			assert.deepEqual(filter2.valueOf(), [0], 'filter2 should return first element of all values')
			returnSubset = true
			subset.updated()
			assert.deepEqual(filter1.valueOf(), [2,3,4], 'filter1 should return subset of values')
			assert.deepEqual(filter2.valueOf(), [2], 'filter2 should return first element of subset')
		},
		derivedConditionalMapWithArray: function() {
			var values = [0,1,2,3,4,5]
			var all = new Variable(values)
			var subset = new Variable([2,3,4])
			var returnSubset = false
			var filter1 = all.to(function (all_val) {
				return subset.to(function(subset_val) {
					return returnSubset ? subset_val : all_val
				})
			})
			var filter2 = filter1.to(function(filter1_val) { return [filter1_val[0]]; }); 
			assert.deepEqual(filter1.valueOf(), values, 'filter1 should return all values')
			assert.deepEqual(filter2.valueOf(), [0], 'filter2 should return first element of all values')
			filter2.subscribe(function(){}); // trigger a dependency chain, to test the normal dependency based flow
			returnSubset = true
			filter1.updated()
			assert.deepEqual(filter1.valueOf(), [2,3,4], 'filter1 should return subset of values')
			assert.deepEqual(filter2.valueOf(), [2], 'filter2 should return first element of subset')
		},
		parentalNotification: function(){
			var parent = new Variable({
				a: 1
			})
			var parentNotified
			parent.notifies({
				updated: function(event){
					parent.valueOf()
					parentNotified = true
				}
			})
			parentNotified = false
			parent.set('a', 2)
			assert.isTrue(parentNotified)
			parentNotified = false
			parent.property('a').updated()
			assert.isTrue(parentNotified)
		},
		parentalParentalNotification: function(){
			var parent = new Variable({
				a: {
					b: 1
				}
			})
			var parentNotified
			parent.notifies({
				updated: function(event){
					parent.valueOf()
					parentNotified = true
				}
			})
			parentNotified = false
			parent.property('a').set('b', 2)
			assert.isTrue(parentNotified)
			parentNotified = false
			parent.property('a').property('b').updated()
			assert.isTrue(parentNotified)
		},
		separateChildPath: function(){
			var parent = new Variable({
				a: {
					b: {
						d: 2
					},
					c: 3
				}
			})
			var parentReference = new Variable()
			parentReference.put(parent)
			var parentNotified
			var b = parent.property('a').property('b')
			b.notifies({
				updated: function(event){
					parentNotified = true
				}
			})
			b.valueOf()
			var siblingNotified
			var c = parent.property('a').property('c')
			c.notifies({
				updated: function(event) {
					siblingNotified = true
				}
			})
			c.valueOf()
			siblingNotified = false
			parentNotified = false
			parentReference.property('a').property('b').set('d', 6)
			assert.isTrue(parentNotified)
			assert.isFalse(siblingNotified)
		},
		array: function () {
			var array = [1, 2]
			var variable = new Variable(array)
			var twice = variable.each(function(item){
				return item * 2
			})
			var results = []
			twice.forEach(function(value){
				results.push(value)
			})
			assert.deepEqual(results, [2, 4])
		},

		promise: function () {
			var resolvePromise
			var promise = new Promise(function(resolve){
				resolvePromise = resolve
			})
			var variable = new Variable(promise)
			var plus2 = variable.to(function(value) {
				return value + 2
			})
			var sum
			var finished = plus2.valueOf().then(function(result){
				sum = result
			})
			assert.isUndefined(sum)
			resolvePromise(4)
			return finished.then(function() {
				assert.equal(sum, 6)
			})
		},

		promiseComposition: function() {
			var inner = new Variable('a')
			var resolvePromise
			var promise = new Promise(function(resolve) {
					resolvePromise = resolve
			})
			var promiseVar = new Variable(promise)
			outerCallbackInvoked = 0
			innerCallbackInvoked = 0
			var composed = promiseVar.to(function(promiseValue) {
					outerCallbackInvoked++
														console.log('outer invoked')
					return inner.to(function(innerValue) {
				innerCallbackInvoked++
																console.log('inner invoked')
				return [promiseValue, innerValue]
					})
			})
			var result
			var finished = composed.valueOf().then(function(composedValue) {
														console.log('composedValue', composedValue)
					result = composedValue
			})
			assert.isUndefined(result)
												resolvePromise('promise')
			return finished.then(function() {
					assert.equal(outerCallbackInvoked, 1, 'outer map not invoked exactly once: ' + outerCallbackInvoked)
					assert.equal(innerCallbackInvoked, 1, 'inner map not invoked exactly once: ' + innerCallbackInvoked)
														assert.deepEqual(result, ['promise','a'])
			})
		},

		schema: function() {
			var object = {
				a: 1,
				b: 'foo'
			}
			var TypedVariable = Variable.extend({
				schema: {
					properties: {
						a: {type: 'number'},
						b: {type: 'string'}
					}
				}
			})
			var variable = new TypedVariable(object)
			var propertyA = variable.property('a')
			assert.equal(propertyA.schema.type, 'number')
			assert.deepEqual(propertyA.validation.valueOf().isValid, true)
			propertyA.put('not a number')
			assert.deepEqual(propertyA.validation.valueOf().length, 1)
			variable.set('a', 8)
			assert.deepEqual(propertyA.validation.valueOf().length, 0)
		},
		schemaCustomValidate: function() {
		},

		composite: function() {
			var a = new Variable(1)
			var b = new Variable(2)
			var c = new Variable(3)
			var composite = Variable.all([a, b, c])
			var result = composite.valueOf()

			composite.notifies({
				updated: function(){
					result = composite.valueOf()
				}
			})
			assert.deepEqual(result, [1, 2, 3])
			a.put(4)
			assert.deepEqual(result, [4, 2, 3])
			c.put(6)
			assert.deepEqual(result, [4, 2, 6])
		},

		incrementalUpdate: function() {
			var array = new Variable([2, 4, 6])
			var sum = array.to(function(array) {
				return array.reduce(function(a, b) {return a + b})
			})
			var lastUpdate
			array.notifies({
				updated: function(updateEvent) {
					lastUpdate = updateEvent
				}
			})
			assert.strictEqual(sum.valueOf(), 12)
			array.push(8)
			assert.strictEqual(sum.valueOf(), 20)
			assert.deepEqual(lastUpdate, {type: 'add', index: 3, value: 8})
			array.pop()
			assert.deepEqual(lastUpdate, {type: 'delete', previousIndex: 3})
			array.unshift(0)
			assert.deepEqual(lastUpdate, {type: 'add', index: 0, value: 0})
			array.shift()
			assert.deepEqual(lastUpdate, {type: 'delete', previousIndex: 0})


		},

		nestedVariableProperty: function() {
			var obj = {a: 2}
			var v = new Variable(obj)
			obj.derived = v.property('a').to(function(v) {
				return v * 2
			})
			assert.strictEqual(v.property('derived').valueOf(), v.get('derived'))
		},

		filterArray: function() {
			var arrayVariable = new Variable([3, 5, 7])
			var greaterThanFour = arrayVariable.filter(function(item) {
				return item > 4
			})
			assert.strictEqual(greaterThanFour.valueOf().length, 2)
			arrayVariable.push(9)
			assert.strictEqual(greaterThanFour.valueOf().length, 3)
			arrayVariable.splice(1, 1)
			assert.strictEqual(greaterThanFour.valueOf().length, 2)
			arrayVariable.push(1)
			assert.strictEqual(greaterThanFour.valueOf().length, 2)
		},
		contextualClassProperty: function() {
			var TestVariable = Variable()
			var TestSubject = Variable()
			TestSubject.hasOwn(TestVariable)
			var subject1 = new TestSubject()
			var subject2 = new TestSubject()
			var variable1 = TestVariable.for(subject1)
			var variable2 = TestVariable.for(subject2)
			TestVariable.defaultInstance.put({a: 0})
			variable1.put({a: 1})
			variable2.put({a: 2})
			assert.strictEqual(TestVariable.property('a').for().valueOf(), 0)
			assert.strictEqual(TestVariable.property('a').for(subject1).valueOf(), 1)
			assert.strictEqual(TestVariable.property('a').for(subject2).valueOf(), 2)
		},
		contextualizedFilter: function() {
			var TestVariable = Variable()
			var TestSubject = Variable()
			TestSubject.hasOwn(TestVariable)
			var subject1 = new TestSubject()
			var subject2 = new TestSubject()
			var variable1 = TestVariable.for(subject1)
			var variable2 = TestVariable.for(subject2)
			variable1.put([3, 5, 7])
			variable2.put([1, 2, 3])
			var greaterThanFour = TestVariable.filter(function(item) {
				return item > 4
			})
			assert.strictEqual(greaterThanFour.for(subject1).valueOf().length, 2)
			assert.strictEqual(greaterThanFour.for(subject2).valueOf().length, 0)
			TestVariable.for(subject1).push(9)
			assert.strictEqual(greaterThanFour.for(subject1).valueOf().length, 3)
			assert.strictEqual(greaterThanFour.for(subject2).valueOf().length, 0)
			TestVariable.for(subject2).push(9)
			assert.strictEqual(greaterThanFour.for(subject1).valueOf().length, 3)
			assert.strictEqual(greaterThanFour.for(subject2).valueOf().length, 1)
			TestVariable.for(subject1).splice(1, 1)
			assert.strictEqual(greaterThanFour.for(subject1).valueOf().length, 2)
			assert.strictEqual(greaterThanFour.for(subject2).valueOf().length, 1)
			TestVariable.for(subject1).push(1)
			assert.strictEqual(greaterThanFour.for(subject1).valueOf().length, 2)
		},
		emptyKey: function() {
			var v = new Variable({})
			var updated
			v.property('').notifies({
				updated: function(updateEvent) {
					updated = true
				}
			})
			v.set('', 'test')
			assert.strictEqual(updated, true)
		},
		getPropertyWithVariable: function() {
			var foo = new Variable('foo')
			var bar = new Variable({ foo: foo })

			assert.strictEqual(bar.get('foo'), 'foo')
			assert.strictEqual(bar.property('foo').valueOf(), 'foo')
		}
	})
})
