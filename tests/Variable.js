define(function(require) {
	var VariableExports = require('../Variable')
	var Promise = require('bluebird/js/browser/bluebird')
	var Variable = VariableExports.Variable
	var VArray = VariableExports.VArray
	var VString = VariableExports.VString
	var VSet = VariableExports.VSet
	var VDate = VariableExports.VDate
	var VNumber = VariableExports.VNumber
	var Transform = VariableExports.Transform
	var Context = VariableExports.Context
	function valueOfAndNotify(variable, callback) {
		var value
		new Context(null, true).executeWithin(function() {
			value = variable.valueOf()
		})
		variable.notifies(typeof callback === 'object' ? callback : {
			updated: callback
		})
		return value
	}
	suite('Variable', function() {

		test('simple single value', function() {
			var invalidated = false
			var variable = new Variable(1)
			assert.equal(valueOfAndNotify(variable, function() {
				invalidated = true
			}), 1)
			assert.isFalse(invalidated)
			variable.put(2)
			assert.equal(variable.valueOf(), 2)
			assert.isTrue(invalidated)
		})

		test('simple caching value', function() {
			var invalidated = false
			var value = 1
			var variable = new Transform(null, function () {
				return value
			})
			variable.setReverse(function (newValue) {
				value = newValue
			})
			assert.equal(valueOfAndNotify(variable, function(){
				invalidated = true
			}), 1)
			assert.isFalse(invalidated)
			variable.put(2)
			assert.equal(variable.valueOf(), 2)
			assert.equal(value, 2)
			assert.isTrue(invalidated)
		})
		test('simple caching value, no subscribe', function() {
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
		})
		test('simple caching value, resubscribe', function() {
			var recomputed = false
			var value = 1
			var variable = new Variable(1)
			var result = variable.to(function(value){
				return value * 2
			})
			assert.equal(result.valueOf(), 2)
			recomputed = false
			variable.put(2)
			result.notifies({
				updated: function() {
					recomputed = true
				}
			})
			assert.equal(result.valueOf(), 4)
		})
		test('on/off', function() {
			var invalidated = false
			var value = 1
			var variable = new Transform(null, function () {
				return value
			})
			variable.setReverse(function (newValue) {
				value = newValue
			})
			var target = {
				updated: function(){
					invalidated = true
				}
			}

			assert.equal(valueOfAndNotify(variable, target), 1)
			assert.isFalse(invalidated)
			variable.put(2)
			assert.equal(valueOfAndNotify(variable, target), 2)
			assert.equal(value, 2)
			assert.isTrue(invalidated)
			variable.stopNotifies(target)
			invalidated = false
			variable.put(3)
			assert.isFalse(invalidated);
		})
		test('property access', function() {
			var object = {
				a: 1,
				b: 10
			}
			var variable = new Variable(object)
			variable.observeObject()
			var invalidated
			var aProperty = variable.property('a')
			assert.equal(valueOfAndNotify(aProperty, function(){
				invalidated = true
			}), 1)
			object.a = 2
			return Promise.resolve().then(function(){
				assert.equal(aProperty.valueOf(), 2)
				assert.isTrue(invalidated)
				invalidated = false
				variable.put({
					a: 3
				})
				assert.equal(aProperty.valueOf(), 3)
				assert.isTrue(invalidated)
			})
		})

		test('delegated properties', function() {
			var MyVar = Variable({
				a: Variable
			})
			var myVar = new MyVar({
				a: 2,
				b: 10
			})
			myVar.a2 = myVar.a.to(function(a) { return a * a })
			myVar.b = myVar.property('b').to(function(b) { return b * 2 })
			var fromMyVar = new Variable(myVar)
			assert.equal(fromMyVar.property('a').valueOf(), 2)
			assert.equal(valueOfAndNotify(fromMyVar.property('a2'), function(){
				invalidated = true
			}), 4)
			assert.equal(fromMyVar.get('b'), 20)
			fromMyVar.a.put(5)
			assert.isTrue(invalidated)
			assert.equal(myVar.a.valueOf(), 5)
			assert.equal(fromMyVar.a2.valueOf(), 25)
		})
		test('separate non-live property caching', function() {
			var myVar = new Variable({
				a: 2,
				b: 10
			})
			var computedA
			var doubleA = myVar.property('a').to(function(a) {
				computedA = true
				return a * 2
			})
			assert.equal(doubleA.valueOf(), 4)
			assert.isTrue(computedA)
			computedA = false
			myVar.set('a', 3)
			assert.equal(doubleA.valueOf(), 6)
			assert.isTrue(computedA)
			computedA = false
			myVar.set('b', 15)
			assert.equal(doubleA.valueOf(), 6)
			assert.isFalse(computedA)
		})
		test('caching property of transform', function() {
			var v = new Variable(5)
			var transformed = 0
			var result = v.to(function(v) {
				transformed++
				return {
					twice: v * 2,
					triple: v * 3
				}
			})
			assert.equal(result.property('twice').valueOf(), 10)
			assert.equal(result.property('triple').valueOf(), 15)
			assert.equal(transformed, 1)
			v.put(10)
			assert.equal(result.property('twice').valueOf(), 20)
			assert.equal(result.property('triple').valueOf(), 30)
			assert.equal(transformed, 2)
		})
		test('caching property of transform 2', function() {
			var v = new Variable(5)
			var transformed = 0
			var result = v.to(function(v) {
				transformed++
				return {
					twice: v * 2,
					triple: v * 3
				}
			})
			var result2 = new Variable({
				twice: result.property('twice'),
				triple: result.property('triple'),
				unrelated: []
			})
			assert.equal(result2.property('twice').valueOf(), 10)
			assert.equal(result2.property('triple').valueOf(), 15)
			assert.equal(transformed, 1)
			result2.set('unrelated', ['hi'])
			assert.equal(result2.property('twice').valueOf(), 10)
			assert.equal(result2.property('triple').valueOf(), 15)
			assert.equal(transformed, 1)
		})
		test('caching property of transform live', function() {
			var v = new Variable(5)
			var transformed = 0
			var result = v.to(function(v) {
				transformed++
				return {
					twice: v * 2,
					triple: v * 3
				}
			})
			var result2 = new Variable({
				twice: result.property('twice'),
				triple: result.property('triple'),
				unrelated: []
			})
			assert.equal(valueOfAndNotify(result2.property('twice'), function(){}), 10)
			assert.equal(valueOfAndNotify(result2.property('triple'), function(){}), 15)
			assert.equal(transformed, 1)
			result2.set('unrelated', ['hi'])
			assert.equal(result2.property('twice').valueOf(), 10)
			assert.equal(result2.property('triple').valueOf(), 15)
			assert.equal(transformed, 1)
		})
		test('structured assignment', function() {
			var MyVar = Variable({
				a: Variable,
				b: Variable
			})
			var myVar = new MyVar({
				a: 2,
				b: 10
			})
			myVar.a2 = myVar.a.to(function(a) { return a * a })
			assert.equal(valueOfAndNotify(myVar.a, function(){
				invalidated = true
			}), 2)
			myVar.a = 4
			myVar.b = 20
			assert.isTrue(invalidated)
			assert.equal(myVar.a.valueOf(), 4)
			assert.equal(myVar.get('b'), 20)
			assert.equal(myVar.a2.valueOf(), 16)
		})
		test('successive puts', function() {
			var v = new Variable(1)
			var v2 = new Variable(2)
			var v3 = new Variable(3)
			v.put(v2)
			assert.equal(v.valueOf(), 2)
			v.put(v3)
			assert.equal(v.valueOf(), 3)
			assert.equal(v2.valueOf(), 2)
			v.put(6)
			assert.equal(v.valueOf(), 6)
			assert.equal(v2.valueOf(), 2)
			v3.put(v2)
			assert.equal(v.valueOf(), 2)
			assert.equal(v2.valueOf(), 2)
			v2.put(4)
			assert.equal(v.valueOf(), 4)
			assert.equal(v2.valueOf(), 4)
			v.put(7)
			assert.equal(v.valueOf(), 7)
			assert.equal(v2.valueOf(), 7)
			assert.equal(v3.valueOf(), 7)
			v.is(8)
			assert.equal(v.valueOf(), 8)
			assert.equal(v2.valueOf(), 7)
			assert.equal(v3.valueOf(), 7)
		})
		test('upstream proxy of mutations', function() {
			var v = new Variable({a: 1})
			var v2 = new Variable()
			v2.is(v)
			var updated = false
			valueOfAndNotify(v, function(){
				updated = true
			})
			v2.set('a', 2)
			assert.strictEqual(v2.get('a'), 2)
			assert.strictEqual(v2.valueOf().a, 2)
			assert.strictEqual(v.get('a'), 2)
			assert.strictEqual(v.valueOf().a, 2)
			assert.isTrue(updated)
			v2.put({a: 3})
			assert.strictEqual(v2.get('a'), 3)
			assert.strictEqual(v2.valueOf().a, 3)
			assert.strictEqual(v.get('a'), 3)
			assert.strictEqual(v.valueOf().a, 3)
		})

		test('mapAndFilter', function(){
			var v = new VArray(['a', 'b'])
			var result = v.map(function(letter) {
				return letter.toUpperCase()
			}).filter(function(letter) {
				return letter !== 'A'
			})
			assert.deepEqual(result.valueOf(), ['B'])

		})

		test('transform with mutations', function() {
			var v = new Variable({a: 1})
			var v2 = new VArray(['a'])
			var transformed = v.to(function(v) { return v2 }).as(VArray)
			transformed.push('b')
			assert.strictEqual(v2.get(1), 'b')
		})

		test('function call', function() {
			var add = new Variable(function (a, b) {
				return a + b
			}, function (value, args) {
				args[0].put(value - args[1].valueOf())
			})
			var a = new Variable(1)
			var b = new Variable(2)
			var sum = add.apply(null, [a, b])
			var invalidated
			assert.equal(valueOfAndNotify(sum, function(){
				invalidated = true
			}), 3)
			a.put(3)
			assert.isTrue(invalidated)
			assert.equal(sum.valueOf(), 5)
			invalidated = false
			b.put(4)
			assert.isTrue(invalidated)
			assert.equal(sum.valueOf(), 7)
		})
		test('transform', function() {
			var a = new Variable()
			var b = new Variable()
			var sum = a.to(function (a) {
				return b.to(function(){
					return a + b
				})
			})
			var invalidated = false
			var sumUpdater = function() {
				invalidated = true
			}
			valueOfAndNotify(sum, sumUpdater)
			var target = new Variable()
			target.put(sum)
			var targetInvalidated = false
			var targetUpdater = function() {
				targetInvalidated = true
			}
			valueOfAndNotify(target, targetUpdater)
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
			assert.equal(valueOfAndNotify(sum, sumUpdater), 9)
			invalidated = false
			assert.isTrue(targetInvalidated)
			assert.equal(target.valueOf(), 9)
			targetInvalidated = false
			b.put(6)
			assert.isTrue(invalidated)
			assert.equal(sum.valueOf(), 10)
			assert.isTrue(targetInvalidated)
			assert.equal(target.valueOf(), 10)
		})
		test('mixedMap', function() {
			var a = new Variable()
			var b = new VArray()
			var plusTwo = a.map(function(a) {
				return a + 2
			})
			var bPlusTwo = b.map(function(a) {
				return a + 2
			})
			var invalidated = false
			var updater = function() {
				invalidated = true
			}
			var result = valueOfAndNotify(plusTwo, updater)
			assert.equal(typeof result, 'number')
			assert.isTrue(isNaN(result))
			assert.deepEqual(bPlusTwo.valueOf(), [])
			a.put(2)
			b.put([1, 2])
			assert.equal(plusTwo.valueOf(), 4)
			assert.deepEqual(bPlusTwo.valueOf(), [3, 4])
		})
		test('derivedMap', function() {
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
		})
		test('derivedMapWithArray', function() {
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
		})
		test('typedMap', function() {
			var Foo = Variable({
				foo: Variable
			})
			var LotsOfFoo = Variable({
				items: VArray.of(Foo)
			})
			var lof = new LotsOfFoo({items: [{foo: 'a'}, {foo: 'b'}]})
			var letters = lof.items.map(function(item) {
				return item.get('foo')
			})
			var lettersResolved = []
			letters.forEach(function(letter) {
				lettersResolved.push(letter)
			})
			assert.deepEqual(lettersResolved, ['a', 'b'])
			valueOfAndNotify(letters, function() {
			})

			lof.items.push({foo: 'c'})
			lettersResolved = []
			letters.forEach(function(letter) {
				lettersResolved.push(letter)
			})
			assert.deepEqual(lettersResolved, ['a', 'b', 'c'])

			lof.items.splice(-1, 1)
			lettersResolved = []
			letters.forEach(function(letter) {
				lettersResolved.push(letter)
			})
			assert.deepEqual(lettersResolved, ['a', 'b'])
		})
		test('VString', function() {
			var vs = new VString('hello')
			var transformed = vs.toUpperCase().slice(1, 3)
			var invalidated
			assert.equal(valueOfAndNotify(transformed, function() {
				invalidated = true
			}), 'EL')
			vs.put('hi')
			assert.isTrue(invalidated)
			assert.equal(transformed.valueOf(), 'I')
		})
		test('VNumber', function() {
			var vn = new VNumber(344)
			var transformed = vn.toExponential().indexOf('e+')
			var invalidated
			assert.equal(valueOfAndNotify(transformed, function() {
				invalidated = true
			}), 4)
			vn.put(3)
			assert.isTrue(invalidated)
			assert.equal(transformed.valueOf(), 1)
		})
		test('transformAndCast', function() {
			var vn = new VNumber(344)
			var transformed = vn.to(function(num) {
				return 'num: ' + num
			}).as(VString).toUpperCase()
			var invalidated
			assert.equal(valueOfAndNotify(transformed, function() {
				invalidated = true
			}), 'NUM: 344')
			vn.put(3)
			assert.isTrue(invalidated)
			assert.equal(transformed.valueOf(), 'NUM: 3')
		})
		test('transformAndCastClass', function() {
			var vn = new VNumber(344)
			var TransformToString = Transform.with({
				transform: function(num) {
					return 'num: ' + num
				}
			}).as(VString)
			var transformed = new TransformToString(vn).toUpperCase()
			var invalidated
			assert.equal(valueOfAndNotify(transformed, function() {
				invalidated = true
			}), 'NUM: 344')
			vn.put(3)
			assert.isTrue(invalidated)
			assert.equal(transformed.valueOf(), 'NUM: 3')
		})
		test('VDate', function() {
			var d = new VDate(1482816115981)
			assert.equal(d.toUTCString().toUpperCase().valueOf(), 'TUE, 27 DEC 2016 05:21:55 GMT')
			d.setTime(1483816115981)
			assert.equal(d.toUTCString().toString(), 'Sat, 07 Jan 2017 19:08:35 GMT')
		})
		test('VSet', function() {
			var vs = new VSet(['a', 'b'])
			var a = vs.has('a')
			var c = vs.has('c')
			assert.equal(a.valueOf(), true)
			var invalidated
			assert.equal(valueOfAndNotify(c, function() {
				invalidated = true
			}), false)
			vs.add('c')
			assert.equal(a.valueOf(), true)
			assert.equal(c.valueOf(), true)
			assert.isTrue(invalidated)
			vs.delete('a')
			assert.equal(a.valueOf(), false)
			assert.equal(c.valueOf(), true)
			vs.clear()
			assert.equal(a.valueOf(), false)
			assert.equal(c.valueOf(), false)
		})
		test('variablePromise', function() {
			var p = new Variable(Promise.resolve('hi'))
			return p.then(function(value) {
				assert.equal(value, 'hi')
			})
		})
		test('variablePromiseWhileResolving', function() {
			var p = Promise.resolve('hi')
			var v = new Variable(p)
			var alwaysAvailable = v.whileResolving('loading')
			var currentValue
			alwaysAvailable.then(function(value) {
				currentValue = value
			})
			assert.equal(currentValue, 'loading')
			var notified
			assert.equal(valueOfAndNotify(alwaysAvailable, function() {
				notified = true
			}), 'loading')
			return new Promise(function(resolve) {
				setTimeout(resolve, 50)
			}).then(function() {
				assert.isTrue(notified)
				assert.equal(alwaysAvailable.valueOf(), 'hi')
			})
		})
		test('multiplePromisedTransforms', function() {
			var transformCount = 0
			var v = new Variable()
			var result = v.to(function() {
				transformCount++
				return Promise.resolve('done')
			})
			result.then(function() {})
			return result.then(function(result) {
				assert.equal(transformCount, 1)
				assert.equal(result, 'done')
			})
		})
		test('multipleInputPromisedTransforms', function() {
			var transformCount = 0
			var v = new Variable(Promise.resolve('done'))
			var result = v.to(function(v) {
				transformCount++
				return v
			})
			result.then(function() {})
			return result.then(function(result) {
				assert.equal(transformCount, 1)
				assert.equal(result, 'done')
			})
		})
		test('derivedComposedInvalidations', function() {
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
		})
		test('mapWithArray', function() {
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
		})
		test('derivedConditionalMapWithArray', function() {
			var values = [0,1,2,3,4,5]
			var all = new VArray(values)
			var subset = new VArray([2,3,4])
			var returnSubset = false
			var filter1 = all.to(function (all_val) {
				return subset.to(function(subset_val) {
					return returnSubset ? subset_val : all_val
				})
			})
			var filter2 = filter1.to(function(filter1_val) { return [filter1_val[0]]; })
			assert.deepEqual(filter1.valueOf(), values, 'filter1 should return all values')
			assert.deepEqual(filter2.valueOf(), [0], 'filter2 should return first element of all values')
			returnSubset = true
			subset.updated()
			assert.deepEqual(filter1.valueOf(), [2,3,4], 'filter1 should return subset of values')
			assert.deepEqual(filter2.valueOf(), [2], 'filter2 should return first element of subset')
		})
		test('parentalNotification', function(){
			var parent = new Variable({
				a: 1
			})
			var parentNotified
			valueOfAndNotify(parent, function(event){
				parent.valueOf()
				parentNotified = true
			})
			parentNotified = false
			parent.set('a', 2)
			assert.isTrue(parentNotified)
			parentNotified = false
			parent.property('a').updated()
			assert.isTrue(parentNotified)
		})
		test('parentalParentalNotification', function(){
			var parent = new Variable({
				a: {
					b: 1
				}
			})
			var parentNotified
			valueOfAndNotify(parent, function(event){
				parent.valueOf()
				parentNotified = true
			})
			parentNotified = false
			parent.property('a').set('b', 2)
			assert.isTrue(parentNotified)
			parentNotified = false
			parent.property('a').property('b').updated()
			assert.isTrue(parentNotified)
		})
		test('separateChildPath', function(){
			var parent = new Variable({
				a: {
					b: {
						d: 2
					},
					c: 3
				}
			})
			var parentReference = new Variable()
			parentReference.is(parent)
			var parentNotified
			var b = parent.property('a').property('b')
			valueOfAndNotify(b, function(event){
				parentNotified = true
			})
			var siblingNotified
			var c = parent.property('a').property('c')
			valueOfAndNotify(c, function(event) {
				siblingNotified = true
			})
			siblingNotified = false
			parentNotified = false
			parentReference.property('a').property('b').set('d', 6)
			assert.isTrue(parentNotified)
			assert.isFalse(siblingNotified)
		})

		test('relisten', function() {
			var v = new Variable({foo: 1})
			var ref = new Variable(v)
			var ref2 = new Variable()
			ref2.is(v)
			var foo = v.property('foo')
			var fooRef = ref.property('foo')
			var fooRef2 = ref2.property('foo')
			var fooTransformed = fooRef.to(function(foo) { return foo })

			var updated = false
			var updater = {
				updated: function() {
					updated = true
				}
			}

			fooTransformed.notifies(updater)
			fooTransformed.valueOf()
			fooTransformed.stopNotifies(updater)
			fooTransformed.notifies(updater)
			fooTransformed.valueOf()
			fooRef2.put(2)
			assert.isTrue(updated)
		})

		test('array', function() {
			var array = [1, 2]
			var variable = new VArray(array)
			var twice = variable.map(function(item){
				return item * 2
			})
			var results = []
			twice.forEach(function(value){
				results.push(value)
			})
			assert.deepEqual(results, [2, 4])
		})

		test('array positions', function() {
			var v = new VArray(['a', 'b'])
			var a = v.property(0)
			var b = v.property(1)
			assert.strictEqual(a.valueOf(), 'a')
			assert.strictEqual(b.valueOf(), 'b')
			v.splice(1, 0, 'ab')
			assert.strictEqual(a.valueOf(), 'a')
			assert.strictEqual(b.valueOf(), 'b')
			assert.strictEqual(v.get(1), 'ab')
			v.push('c')
			assert.strictEqual(a.valueOf(), 'a')
			assert.strictEqual(b.valueOf(), 'b')
			v.unshift('0')
			assert.strictEqual(a.valueOf(), 'a')
			assert.strictEqual(b.valueOf(), 'b')
		})

		test('array events', function() {
			var va = new (VArray.of(Variable))([{a: 1}, {a: 2}])
			var mapCount = 0
			var lastItemVar
			var ava = va.map(function(item) {
				mapCount++
				lastItemVar = item
				return item.get('a')
			})
			var arrayChangeCount = 0
			ava.subscribe(function(event) {
				arrayChangeCount++
				event.value()
			})
			assert.equal(mapCount, 2)
			assert.equal(arrayChangeCount, 1)
			lastItemVar.set('b', 3)
			return new Promise(setTimeout).then(function() {
				assert.equal(mapCount, 2)
				assert.equal(arrayChangeCount, 1)
				va.push({a: 3})
				return new Promise(setTimeout).then(function() {
					assert.equal(mapCount, 3)
					assert.equal(arrayChangeCount, 2)
				})
			})
		})

		test('promise', function() {
			var resolvePromise
			var promise = new Promise(function(resolve){
				resolvePromise = resolve
			})
			var variable = new Variable(promise)
			var plus2 = variable.to(function(value) {
				return value + 2
			})
			var sum
			var finished = plus2.then(function(result){
				sum = result
			})
			assert.isUndefined(sum)
			resolvePromise(4)
			return finished.then(function() {
				assert.equal(sum, 6)
			})
		})

		test('promiseComposition', function() {
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
				return inner.to(function(innerValue) {
					innerCallbackInvoked++
					return [promiseValue, innerValue]
				})
			})
			var result
			var finished = composed.then(function(composedValue) {
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
		})

		test('schema', function() {
			var object = {
				a: 1,
				b: 'foo'
			}
			var TypedVariable = Variable({
				a: Variable({type: 'number'}),
				b: Variable({type: 'string', required: true})
			})
			var variable = new TypedVariable(object)
			var derived = new Variable()
			derived.put(variable)
			var propertyA = variable.property('a')
			assert.equal(propertyA.type, 'number')
			propertyA = variable.a
			assert.equal(propertyA.type, 'number')
			assert.deepEqual(propertyA.validation.valueOf().isValid, true)
			propertyA.put('not a number')
			assert.strictEqual(derived.property('a').validation.valueOf().length, 1)
			assert.strictEqual(propertyA.validation.valueOf().length, 1)
			variable.set('a', 8)
			assert.strictEqual(propertyA.validation.valueOf().length, 0)
			propertyB = variable.b
			assert.strictEqual(propertyB.validation.valueOf().length, 0)
			propertyB.put('')
			assert.strictEqual(propertyB.validation.valueOf().length, 1)
		})

		test('schemaCustomValidate', function() {
			var object = {
				a: 1
			}
			var TypedVariable = Variable({
				a: Variable({type: 'number', min: 0, max: 5}),
				validate: function(target, schema) {
					if (target < schema.min || target > schema.max) {
						return ['out of range']
					}
					return []
				}
			})
			var variable = new TypedVariable(object)
			var derived = new Variable()
			derived.put(variable)
			var propertyA = variable.property('a')
			assert.deepEqual(propertyA.validation.valueOf().length, 0)
			propertyA.put(8)
			assert.strictEqual(derived.property('a').validation.valueOf().length, 1)
			assert.strictEqual(propertyA.validation.valueOf().length, 1)
		})

		test('composite', function() {
			var a = new Variable(1)
			var b = new Variable(2)
			var c = new Variable(3)
			var composite = Variable.all([a, b, c])
			var result = composite.valueOf()

			valueOfAndNotify(composite, function(){
				result = composite.valueOf()
			})
			assert.deepEqual(result, [1, 2, 3])
			a.put(4)
			assert.deepEqual(result, [4, 2, 3])
			c.put(6)
			assert.deepEqual(result, [4, 2, 6])
		})

		test('incrementalUpdate', function() {
			var array = new VArray([2, 4, 6])
			var sum = array.to(function(array) {
				return array.reduce(function(a, b) {return a + b})
			})
			var lastUpdate
			valueOfAndNotify(array, function(updateEvent) {
				lastUpdate = updateEvent
			})
			assert.strictEqual(sum.valueOf(), 12)
			array.push(8)
			assert.strictEqual(sum.valueOf(), 20)
			assert.strictEqual(lastUpdate.type, 'array-update')
			assert.strictEqual(lastUpdate.actions[0].index, 3)
			assert.strictEqual(lastUpdate.actions[0].value, 8)
			array.pop()
			assert.strictEqual(lastUpdate.type, 'array-update')
			assert.strictEqual(lastUpdate.actions[0].previousIndex, 3)
			assert.isUndefined(lastUpdate.actions[0].value)
			array.unshift(0)
			assert.strictEqual(lastUpdate.type, 'array-update')
			assert.strictEqual(lastUpdate.actions[0].index, 0)
			assert.strictEqual(lastUpdate.actions[0].value, 0)
			array.shift()
			assert.strictEqual(lastUpdate.type, 'array-update')
			assert.strictEqual(lastUpdate.actions[0].previousIndex, 0)
			assert.isUndefined(lastUpdate.actions[0].value)
		})

		test('nestedVariableProperty', function() {
			var obj = {a: 2}
			var v = new Variable(obj)
			obj.derived = v.property('a').to(function(v) {
				return v * 2
			})
			assert.strictEqual(v.property('derived').valueOf(), v.get('derived'))
		})

		test('nestedPropertyInvalidation', function() {
			var outer = { middle: { inner: new Variable() } }
			var outerVar = new Variable(outer)
			var tfInvalidated = 0
			var innerTransform = outerVar.to(function(o) { return o.middle.inner })
			innerTransform.subscribe(function(e) {
				e.value()
				tfInvalidated++
			})
			// initial invalidation
			assert.equal(tfInvalidated, 1)
			var propInvalidated = 0
			outerVar.property('middle').property('inner').subscribe(function(e) {
				e.value()
				propInvalidated++
			})
			// initial invalidation fires
			assert.equal(propInvalidated, 1)

			outerVar.updated()
			return new Promise(setTimeout).then(function() {
				assert.equal(tfInvalidated, 2)
				assert.equal(propInvalidated, 2)

				outer.middle.inner.updated()

				return new Promise(setTimeout).then(function() {
					assert.equal(tfInvalidated, 3)
					// inner property should have been invalidated
					assert.equal(propInvalidated, 3)
				})
			})
		})

		test('outerVariableCaching', function() {
			var label = new Variable()
			var internal
			var outerExecutionCount = 0
    	var l2 = label.to(function(initial) {
    		outerExecutionCount++
	      if (initial) {
	        internal = new Variable(1)
	        return internal.to(function(val) {
	          if (val) {
	            return initial + '-' + val
	          }
	        })
	      }
	    })
	    valueOfAndNotify(l2, function() { })
    	assert.equal(outerExecutionCount, 1)
	    label.put('start')
    	assert.equal(l2.valueOf(), 'start-1')
    	assert.equal(outerExecutionCount, 2)
	    internal.put(3)
	    assert.equal(l2.valueOf(), 'start-3')
    	assert.equal(outerExecutionCount, 2)
		})

		test('filterArray', function() {
			var arrayVariable = new VArray([3, 5, 7])
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
		})

		test('splice and filter', function() {
			var strings = new VArray(['foo', 'bar', 'baz'])
			var startsWithB = strings.filter(function(v) {
				return v[0] === 'b'
			})

			var updateCount = 0
			assert.deepEqual(valueOfAndNotify(startsWithB, function() {
				updateCount++
			}), ['bar', 'baz'])
			strings.splice(1, 1)

			strings.valueOf()
			// -> ['foo', 'baz']

			assert.deepEqual(startsWithB.valueOf(), ['baz'])
			assert.equal(updateCount, 1)
		})

		test('mapReduceArray', function() {
			var arrayVariable = new VArray([3, 5, 7])
			var mapOperations = 0
			var doubled = arrayVariable.map(function(item) {
				mapOperations++
				return item * 2
			})
			var sum = doubled.reduce(function(a, b) {
				return a + b
			}, 0)
			var updated = false
			valueOfAndNotify(sum, function() {
				updated = true
			})
			assert.deepEqual(doubled.valueOf(), [6, 10, 14])
			assert.strictEqual(sum.valueOf(), 30)
			assert.strictEqual(mapOperations, 3)
			arrayVariable.push(9)
			assert.isTrue(updated)
			assert.deepEqual(doubled.valueOf(), [6, 10, 14, 18])
			assert.strictEqual(sum.valueOf(), 48)
			assert.strictEqual(mapOperations, 4)
			arrayVariable.splice(1, 1)
			assert.deepEqual(doubled.valueOf(), [6, 14, 18])
			assert.strictEqual(sum.valueOf(), 38)
			assert.strictEqual(mapOperations, 4)
			arrayVariable.push(1)
			assert.deepEqual(doubled.valueOf(), [6, 14, 18, 2])
			assert.strictEqual(sum.valueOf(), 40)
			assert.strictEqual(mapOperations, 5)
			arrayVariable.set(1, 4)
			assert.deepEqual(doubled.valueOf(), [6, 8, 18, 2])
			assert.strictEqual(sum.valueOf(), 34)
			assert.strictEqual(mapOperations, 6)
		})

		test('someArray', function() {
			var arrayVariable = new VArray([3, 5, 7])
			var oneGreaterThanFour = arrayVariable.some(function(item) {
				return item > 4
			})
			assert.isTrue(oneGreaterThanFour.valueOf())
			arrayVariable.splice(1, 2)
			assert.isFalse(oneGreaterThanFour.valueOf())
		})

		test('keyBy', function() {
			var arrayVariable = new VArray([3, 5, 7])
			var index = arrayVariable.keyBy(function (key) {
				return key
			}, function (value) {
				return value * 2
			})
			assert.strictEqual(index.get(5), 10)
			arrayVariable.push(9)
			assert.strictEqual(index.get(9), 18)
			assert.strictEqual(index.get(5), 10)
		})

		test('groupBy', function() {
			var arrayVariable = new VArray([{even: false, n: 3}, {even: true, n: 4}, {even: false, n: 5}])
			var index = arrayVariable.groupBy('even')
			assert.strictEqual(index.get(false).length, 2)
			assert.strictEqual(index.get(false)[0].n, 3)
			assert.strictEqual(index.get(true).length, 1)
			assert.strictEqual(index.get(true)[0].n, 4)
			arrayVariable.push({even: true, n: 6})
			assert.strictEqual(index.get(false).length, 2)
			assert.strictEqual(index.get(true).length, 2)
			assert.strictEqual(index.get(true)[1].n, 6)
		})

		test('contextualClassProperty', function() {
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
		})
		test('contextualizedFilter', function() {
			var TestVariable = VArray()
			var TestSubject = VArray()
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
			return
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
		})
		test('emptyKey', function() {
			var v = new Variable({})
			var updated
			valueOfAndNotify(v.property(''), function(updateEvent) {
				updated = true
			})
			v.set('', 'test')
			assert.strictEqual(updated, true)
		})
		test('getPropertyWithVariable', function() {
			var foo = new Variable('foo')
			var bar = new Variable({ foo: foo })

			assert.strictEqual(bar.get('foo'), 'foo')
			var updated = false
			assert.strictEqual(valueOfAndNotify(bar.property('foo'), function(updateEvent) {
				updated = true
			}), 'foo')
			foo.put('2')
			assert.isTrue(updated)
			assert.strictEqual(bar.property('foo').valueOf(), '2')
		})

		test('switchedPropertyVariable', function() {
			var view = new Variable(0)
			var scope = new Variable(0)
			var testData = {
			  0: new Variable([['a'], ['b'], ['c']]).to(function(d) {
			  	return {
			  		filtered: view.to(function(v) {
			  			return d[v]
			  		})
			  	}
			  }),
			  1: new Variable([['d'], ['e'], ['f']]).to(function(d) {
			  	return {
			  		filtered: view.to(function(v) {
			  			return d[v]
			  		})
			  	}
			  })
			}
			var source = scope.to(function(s) {
				return testData[s]
			})
			.property('filtered')
      //.to(td => td.filtered)
			var final = source.to(function(c) {
				return '('+c.join()+')'
			})
			var updated = false
			assert.equal(final.valueOf(), '(a)')
			assert.isFalse(updated)
		  view.put(1)
			assert.equal(final.valueOf(), '(b)')
		})
		test('JSON', function() {
			var obj = new Variable({foo: new Variable('bar')})
			assert.strictEqual(JSON.stringify(obj), '{"foo":"bar"}')
		})

		test('promised', function() {
			var v = new Variable(new Promise(function (r) {
				setTimeout(function() {	r('a') }, 100)
			})).whileResolving()
			assert.equal(v.valueOf(), undefined)
			return new Promise(setTimeout).then(function () {
				// still initial/undefined value
				assert.equal(v.valueOf(), undefined)
				return new Promise(function (r) { setTimeout(r, 150) }).then(function() {
					// should contain resolved value now
					assert.equal(v.valueOf(), 'a')
					v.put(new Promise(function (r) {
						setTimeout(function() {	r('b')	}, 100)
					}))
					assert.equal(v.valueOf(), 'a')
					return new Promise(function (r) { setTimeout(r, 300) }).then(function() {
						assert.equal(v.valueOf(), 'b')
					})
				})
			})
		})

		test('promisedWithInitialValue', function() {
			var v = new Variable('z')
			assert.equal(v.valueOf(), 'z')
			v.put(new Promise(function (r) {
				setTimeout(function() { r('b') }, 100)
			}))
			// still initial value
			assert.equal(v.valueOf(), undefined)
			return new Promise(function (r) { setTimeout(r, 110) }).then(function() {
				// should contain new resolved value now
				assert.equal(v.valueOf(), 'b')
			})
		})

		test('promisedAsTransform', function() {
			var s = new Variable()
			var t = s.to(function(primitiveValue) { return '<' + primitiveValue + '>' }).whileResolving()
			s.put(new Promise(function (r) {
				setTimeout(function() { r('a') }, 100)
			}))
			assert.equal(t.valueOf(), undefined)
			return new Promise(setTimeout).then(function () {
				// still initial/undefined value
				assert.equal(t.valueOf(), undefined)
				return new Promise(function (r) { setTimeout(r, 100) }).then(function() {
					// should contain resolved value now
					assert.equal(t.valueOf(), '<a>')
				})
			})
		})

		test('promisedAsTransformWithInitial', function() {
			var s = new Variable('z')
			var t = s.to(function(primitiveValue) { return '<' + primitiveValue + '>' }).whileResolving()
			assert.equal(t.valueOf(), '<z>' )
			s.put(new Promise(function (r) {
				setTimeout(function() { r('a') }, 100)
			}))
			assert.equal(t.valueOf(), '<z>' )
			return new Promise(setTimeout).then(function () {
				assert.equal(t.valueOf(), '<z>')
				return new Promise(function (r) { setTimeout(r, 100) }).then(function() {
					// should contain resolved value now
					assert.equal(t.valueOf(), '<a>')
				})
			})
		})

		test('initialized variable updates source', function() {
			var sourceVariable = new Variable({foo: 1})
			var containingVariable = new Variable(sourceVariable)
			sourceVariable.set('foo', 2) // this will propagate down to containingVariable
			containingVariable.set('foo', 3) // this will update the sourceVariable
			assert.equal(containingVariable.get('foo'), 3)
			assert.equal(sourceVariable.get('foo'), 3)
		})

		test('initialized property updates source', function() {
			var source = new Variable('a')
			// transform as initial value
			var transform = function(v) {
				var d = {}
				d[v] = true
				return d
			}
			var reverseCalled = 0
			transform.reverse = function(output, inputs) {
				// do nothing
				reverseCalled++
			}
			var defaults = source.to(transform)
			var selection = new Variable().is(defaults)
			var pa = selection.property('a')
			var pb = selection.property('b')
			assert.deepEqual(defaults.valueOf(), { a: true })
			assert.deepEqual(selection.valueOf(), { a : true })
			assert.equal(pa.valueOf(), true)
			assert.equal(pb.valueOf(), undefined)
			// reverse function not called
			assert.equal(reverseCalled, 0)

			/*pa.put(false)
			// upstream value has been updated
			assert.deepEqual(defaults.valueOf(), { a: false })
			assert.deepEqual(selection.valueOf(), { a : false })
			assert.equal(pa.valueOf(), false)
			assert.equal(pb.valueOf(), undefined)
			assert.equal(reverseCalled, 0)*/

			// updating the upstream source should not (no longer) affect downstream variable initialized with reference to source-derived transform
			source.put('b')
			assert.deepEqual(defaults.valueOf(), { b: true })
			// updates to source still propagate downstream
			assert.deepEqual(selection.valueOf(), { b : true })
			assert.equal(pa.valueOf(), undefined)
			assert.equal(pb.valueOf(), true)
			assert.equal(reverseCalled, 0)
		})

		test('Variable default returned when variable value is undefined', function() {
			var v = new Variable()
			v.default = 'a'
			assert.equal(v.valueOf(), 'a')
			v.put('b')
			assert.equal(v.valueOf(), 'b')
			/* Isn't this an explicit assignment of the variable?
			v.put(undefined)
			assert.equal(v.valueOf(), 'a')*/
		})

		test('Variable default is not resolved', function() {
			var d = new Variable('default')
			var v = new Variable()
			v.default = d
			assert.strictEqual(v.valueOf(), 'default')
		})

		test('Property resolves to default value', function() {
			var v = new Variable()
			v.default = { v: 'default' }
			var vp = v.property('v')
			assert.deepEqual(v.valueOf(), { v: 'default' })
			assert.deepEqual(vp.valueOf(), 'default')
		})

		test('Assignment does not change defaults', function() {
			var v = new Variable()
			var defaultObject = v.default = { v: 'default' }
			var vp = v.property('v')
			assert.equal(vp.valueOf(), 'default')
			vp.put('new value')
			assert.equal(vp.valueOf(), 'new value')
			assert.equal(defaultObject.v, 'default')
		})
	})
	console.log('registered tests')
})
