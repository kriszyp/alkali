define([
	'../Element',
	'../Variable',
	'intern!object',
	'intern/chai!assert'
], function (Element, VariableExports, registerSuite, assert) {
	function valueOfAndNotify(variable, callback) {
		var value = variable.valueOf()
		variable.notifies(typeof callback === 'object' ? callback : {
			updated: callback
		})
		return value
	}
	var Variable = VariableExports.Variable
	var VSet = VariableExports.VSet
	var react = VariableExports.react
	var Div = Element.Div
	var Button = Element.Button
	var defineElement = Element.defineElement
	var element = Element.element
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
			function *render2() {
				this.textContent = 5 + (yield b)
			}
			var div = new GeneratorDiv()
			var Div2 = Div({
				render: render2
			})
			var div2
			document.body.appendChild(div)
			document.body.appendChild(div2 = new Div2())
			return new Promise(requestAnimationFrame).then(function(){
				assert.strictEqual(div.textContent, '3')
				assert.strictEqual(div2.textContent, '7')
				a.put(2)
				return new Promise(requestAnimationFrame).then(function(){
					assert.strictEqual(div.textContent, '4')
					assert.strictEqual(div2.textContent, '7')
					b.put(3)
					return new Promise(requestAnimationFrame).then(function(){
						assert.strictEqual(div.textContent, '5')
						assert.strictEqual(div2.textContent, '8')
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
			var sequencePromise = sequence.then(function(value) { return value }) // start it
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
		proxiedVariable: function() {
			let Foo = Variable({
				a: Variable,
				*derived() {
					return 4 + (yield this.a)
				}
			})
			let foo = Foo.proxy({a: 3, bar: 'hi'})
			let aInvalidated, barInvalidated, derivedInvalidated
			assert.strictEqual(valueOfAndNotify(foo.a, function() {
				aInvalidated = true
			}), 3)
			assert.strictEqual(valueOfAndNotify(foo.bar, function() {
				barInvalidated = true
			}), 'hi')
			assert.strictEqual(valueOfAndNotify(foo.derived, function() {
				derivedInvalidated = true
			}), 7)
			foo.a = 5
			assert.isTrue(aInvalidated)
			assert.isTrue(derivedInvalidated)
			assert.isTrue(foo.derived == 9)
			foo.bar = 'hello'
			assert.isTrue(barInvalidated)
			assert.isTrue(foo.bar == 'hello')
			delete foo.bar
			assert.isTrue(foo.bar.valueOf() == undefined)
		},
		instanceofElementClass: function() {
			var MyDiv = Div('.test')
			// only do this if the language supports Symbol.hasInstance
			//assert.isTrue(MyDiv instanceof Element.ElementClass)
		},
		registerTag: function() {
			class CustomElementTemp extends Div {
				constructor() {
					super(...arguments)
					this.bar = 4
				}
				foo() {
					return 3
				}
			}
			var CustomElement = defineElement('custom-tag', CustomElementTemp)

			var custom = new CustomElement()//.create()
			assert.equal(custom.tagName.toUpperCase(), 'CUSTOM-TAG')
			assert.equal(custom.foo(), 3)
			assert.equal(custom.bar, 4)
			var custom = new CustomElement('.some-class', { content: 'hi' })
			assert.equal(custom.tagName.toUpperCase(), 'CUSTOM-TAG')
			assert.equal(custom.foo(), 3)
			assert.equal(custom.bar, 4)
			assert.equal(custom.className, 'some-class')
			assert.equal(custom.innerHTML, 'hi')
		},

		getterGeneratorOnVariable() {
			var Foo = Variable({
				planet: Variable,
				*recipient() {
					return yield this.planet
				},
				*greeting() {
					return 'Hello, ' + (yield this.recipient)
				}
			})
			var foo = new Foo({planet: 'World'})
			var greeting = foo.greeting
			var updated
			assert.strictEqual(valueOfAndNotify(greeting, function() {
				updated = true
			}), 'Hello, World')
			foo.planet.put('Saturn')
			assert.isTrue(updated)
			assert.strictEqual(greeting.valueOf(), 'Hello, Saturn')
		},
		getterGeneratorOnElement() {
			var Foo = Div({
				name: Variable,
				*title() {
					return yield this.name
				},
				*greeting() {
					return 'Hello, ' + (yield this.name)
				},
				*content() {
					return (yield this.greeting) + '.'
				}
			})

			var SubFoo = Foo({
				*name() {
					return `${yield this.firstName} ${yield this.lastName}`
				}
			})

			var name = new Variable('World')
			var foo = new Foo({name: name})
			document.body.appendChild(foo)
			var lastName = new Variable('Doe')
			var subFoo = new SubFoo({firstName: 'John', lastName: lastName})
			document.body.appendChild(subFoo)
			return new Promise(requestAnimationFrame).then(function(){
				assert.strictEqual(foo.textContent, 'Hello, World.')
				assert.strictEqual(foo.title, 'World')
				assert.strictEqual(subFoo.textContent, 'Hello, John Doe.')
				assert.strictEqual(subFoo.title, 'John Doe')
				name.put('Moon')
				lastName.put('Smith')
				return new Promise(requestAnimationFrame).then(function(){
					assert.strictEqual(foo.textContent, 'Hello, Moon.')
					assert.strictEqual(foo.title, 'Moon')
					assert.strictEqual(subFoo.textContent, 'Hello, John Smith.')
					assert.strictEqual(subFoo.title, 'John Smith')
				})
			})
		
		}
	})
})