define([
	'../Variable',
	'intern!object',
	'intern/chai!assert',
	'./has!promise?:bluebird/js/browser/bluebird'
], function (Variable, registerSuite, assert, bluebird) {
	if (typeof window != 'undefined' && !window.Promise) {
		window.Promise = bluebird
	}
	registerSuite({
		name: 'Variable',

		'simple single value': function () {
			var invalidated = false
			var variable = new Variable(1)
			variable.subscribe({
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
			variable.subscribe({
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
			variable.subscribe(target)
			assert.equal(variable.valueOf(), 1)
			assert.isFalse(invalidated)
			variable.put(2)
			assert.equal(variable.valueOf(), 2)
			assert.equal(value, 2)
			assert.isTrue(invalidated)
			variable.unsubscribe(target)
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
			aProperty.subscribe({
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
			sum.subscribe({
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
			sum.subscribe({
				updated: function() {
					invalidated = true
				}
			})
			var target = new Variable()
			target.put(sum)
			var targetInvalidated = false
			target.subscribe({
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
			parent.subscribe(function(event){
				event.value()
				parentNotified = true
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
			parent.subscribe(function(event){
				event.value()
				parentNotified = true
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
			parent.property('a').property('b').subscribe(function(event){
				event.value()
				parentNotified = true
			})
			var siblingNotified
			parent.property('a').property('c').subscribe(function(event){
				event.value()
				siblingNotified = true
			})
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

		schema: function () {
			var object = {
				a: 1,
				b: 'foo'
			}
			var variable = new Variable(object)
			var schema = variable.schema
			schema.put({
				a: 'number',
				b: 'string'
			})
			doValidation = function(target, schema){
				if(typeof target != schema){
					return ['error']
				}
				return []
			}
			var propertyA = variable.property('a')
			assert.equal(propertyA.schema.valueOf(), 'number')
			assert.deepEqual(propertyA.validate.valueOf(), [])
			propertyA.put('not a number')
			assert.deepEqual(propertyA.validate.valueOf(), ['error'])
			variable.set('a', 8)
			assert.deepEqual(propertyA.validate.valueOf(), [])
		},

		composite: function () {
			var a = new Variable(1)
			var b = new Variable(2)
			var c = new Variable(3)
			var result
			Variable.all([a, b, c]).subscribe({
				next: function(resolved){
					result = resolved
				}
			})
			assert.deepEqual(result, [1, 2, 3])
			a.put(4)
			assert.deepEqual(result, [4, 2, 3])
			c.put(6)
			assert.deepEqual(result, [4, 2, 6])
		}
	})
})
