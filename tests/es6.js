define([
	'../Element',
	'../Variable',
	'../react',
	'intern!object',
	'intern/chai!assert'
], function (Element, Variable, react, registerSuite, assert) {
	registerSuite({
		name: 'es6',
		react: function () {
			var a = new Variable()
			var b = new Variable()
			var sum = react(function*() {
				return (yield a) + (yield b)
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

		elementClass: function() {
			var div = Element.div
			class MyDiv extends div('.my-class', {title: 'my-title', wasClicked: false}) {
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
		}
	})
})