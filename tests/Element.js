define([
	'../Element',
	'../Variable',
	'intern!object',
	'intern/chai!assert'
], function (Element, Variable, registerSuite, assert) {
	var div = Element.div
	var span = Element.span
	registerSuite({
		name: 'Element',
		simpleElement: function () {
			var div = ElementType.div
			var testDiv = new div({id: 'test-div'})
			assert.equal(testDiv.tagName, 'DIV')
			assert.equal(testDiv.getAttribute('id'), 'test-div')
		},
		'change in variable': function () {
			var variable = new Variable(4)
			var withVariable = div({
				title: variable,
				id: 'id-1'
			})
			var element = withVariable.create()
			document.body.appendChild(element)
			assert.strictEqual(element.id, 'id-1')
			assert.strictEqual(element.title, '4')
			variable.put(5)
			return new Promise(requestAnimationFrame).then(function(){
				assert.strictEqual(element.title, '5')
			})
		}

	})
});