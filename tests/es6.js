define([
	'../Element',
	'../Variable',
	'../react',
	'intern!object',
	'intern/chai!assert'
], function (Element, Variable, react, registerSuite, assert) {
	function valueOfAndNotify(variable, callback) {
		return variable.valueOf(new Variable.NotifyingContext(typeof callback === 'object' ? callback : {
			updated: callback
		}))
	}
	var Div = Element.Div
	registerSuite({
		name: 'es6',
		react: function () {
			var a = new Variable()
			var b = new Variable()
			var sum = react(function*() {
				return (yield a) + (yield b)
			})
			var invalidated = false
			valueOfAndNotify(sum, function() {
				invalidated = true
			})
			var target = new Variable()
			target.put(sum)
			var targetInvalidated = false
			valueOfAndNotify(target, function() {
				targetInvalidated = true
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

		elementClass: function() {
			class MyDiv extends Div('.my-class', {title: 'my-title', wasClicked: false}) {
				onclick() {
					this.otherMethod()
				}
				otherMethod() {
					this.wasClicked = true
				}
			}
			var myDiv = new MyDiv()
			assert.isFalse(myDiv.wasClicked)
			myDiv.click()
			assert.isTrue(myDiv.wasClicked)
			class MySubDiv extends MyDiv {
				otherMethod() {
					super.otherMethod()
					this.alsoFlagged = true
				}
			}
			var mySubDiv = new MySubDiv()
			assert.isFalse(mySubDiv.wasClicked)
			mySubDiv.click()
			assert.isTrue(mySubDiv.wasClicked)
			assert.isTrue(mySubDiv.alsoFlagged)
		},
		forOf: function() {
			var arrayVariable = new Variable(['a', 'b', 'c'])
			var results = []
			for (let letter of arrayVariable) {
				results.push(letter)
			}
			assert.deepEqual(results, ['a', 'b', 'c'])
		},
		Symbol: function() {
			let mySymbol = Symbol('my')
			let obj = {
				[mySymbol]: 'test'
			}
			let v = new Variable(obj)
			assert.strictEqual(v.property(mySymbol).valueOf(), 'test')
		},
		Map: function() {
			let map = new Map()
			map.set('a', 2)
			var v = new Variable.VMap(map)
			var updated
			v.property('a').notifies({
				updated: function(){
					updated = true
				}
			})
			assert.strictEqual(v.get('a'), 2)
			updated = false
			v.set('a', 3)
			assert.strictEqual(updated, true)
			assert.strictEqual(v.get('a'), 3)
			assert.strictEqual(map.get('a'), 3)
			v.set(2, 2)
			v.set('2', 'two')
			assert.strictEqual(map.get(2), 2)
			assert.strictEqual(map.get('2'), 'two')
		},
		renderGenerator: function() {
			var a = new Variable(1)
			var b = new Variable(2)
			class GeneratorDiv extends Div {
				*render() {
					this.textContent = (yield a) + (yield b)
				}
			}
			var div = new GeneratorDiv()
			document.body.appendChild(div)
			return new Promise(requestAnimationFrame).then(function(){
				assert.strictEqual(div.textContent, '3')
				a.put(2)
				return new Promise(requestAnimationFrame).then(function(){
					assert.strictEqual(div.textContent, '4')
					b.put(3)
					return new Promise(requestAnimationFrame).then(function(){
						assert.strictEqual(div.textContent, '5')
					})
				})
			})
		},
		reactPromises: function() {
			let currentResolver, currentRejecter, sum = 0, done = false
			let errorThrown
			var sequence = react(function*() {
				while (!done) {
					try {
						sum += yield new Promise((resolve, reject) => {
							currentResolver = resolve
							currentRejecter = reject
						})
					} catch (e) {
						errorThrown = e
					}
				}
				return sum
			})
			var sequencePromise = sequence.valueOf() // start it
			currentResolver(2)
			return Promise.resolve().then(() => {
				assert.strictEqual(sum, 2)
				currentResolver(3)
				return Promise.resolve().then(() => {
					assert.strictEqual(sum, 5)
					currentResolver(4)
					return Promise.resolve().then(() => {
						assert.strictEqual(sum, 9)
						currentRejecter('error occurred')
						return Promise.resolve().then(() => {
							assert.strictEqual(errorThrown, 'error occurred')
							done = true
							currentResolver(1)
							return Promise.resolve().then(() => {
								assert.strictEqual(sum, 10)
								return sequencePromise.then((result) => {
									assert.strictEqual(result, 10)
								})
							})
						})
					})
				})
			})
		},
		getPropertyWithClass: function() {
			class Foo extends Variable {
				constructor() {
					super(...arguments)
					// prelude to class properties
					this.baz = this.property('baz')
					this.baz2 = this.property('baz')
					this.structured = true // make sure this doesn't change anything
				}
			}
			class Bar extends Variable {
				constructor() {
					super(...arguments)
					this.foo = this.property('foo', Foo)
				}
			}
			var obj = { foo: { baz: 3 } }
			var bar = new Bar(obj)
			assert.strictEqual(bar.foo.baz.valueOf(), 3)
			assert.strictEqual(bar.foo.baz2.valueOf(), 3)
			bar.foo.baz.put(5)
			assert.strictEqual(obj.foo.baz, 5)
		},
		structuredClass: function() {
			class Foo extends Variable {
				constructor() {
					super(...arguments)
					// prelude to class properties
					this.baz = new Variable()
					this.bazDerived = this.baz.to(baz => baz * 2)
					this.structured = true
				}
			}
			class Bar extends Variable {
				constructor() {
					super(...arguments)
					this.foo = new Foo()
					this.structured = true
				}
			}
			var obj = { foo: { baz: 3 } }
			var bar = new Bar(obj)
			assert.strictEqual(bar.foo.baz.valueOf(), 3)
			assert.strictEqual(bar.foo.bazDerived.valueOf(), 6)
			bar.foo.baz.put(5)
			assert.strictEqual(obj.foo.baz, 5)
			assert.strictEqual(bar.property('foo').get('baz'), 5)
			assert.strictEqual(bar.property('foo').get('bazDerived'), 10)
		},
		instanceofElementClass: function() {
			var MyDiv = Div('.test')
			// only do this if the language supports Symbol.hasInstance
			//assert.isTrue(MyDiv instanceof Element.ElementClass)
		}
	})
})