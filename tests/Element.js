define([
	'../Element',
	'../Variable',
	'intern!object',
	'intern/chai!assert'
], function (Element, Variable, registerSuite, assert) {
	var div = Element.div
	var span = Element.span
	var checkbox = Element.checkbox
	var input = Element.input
	registerSuite({
		name: 'Element',
		simpleElement: function () {
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
		},
		nesting: function() {
			var Structure = div('.top', {id: 'top'}, [
				div('.middle-1', [
					span('#bottom-1'),
					'a text node',
					span('#bottom-2')
				], {id: 'middle-1'}),
				div('.middle-2')
			])
			var structureElement = new Structure()
			assert.strictEqual(structureElement.tagName, 'DIV')
			assert.strictEqual(structureElement.className, 'top')
			assert.strictEqual(structureElement.id, 'top')
			var middle1 = structureElement.firstChild
			assert.strictEqual(middle1.className, 'middle-1')
			assert.strictEqual(middle1.id, 'middle-1')
			assert.strictEqual(middle1.firstChild.id, 'bottom-1')
			assert.strictEqual(middle1.firstChild.tagName, 'SPAN')
			assert.strictEqual(middle1.firstChild.nextSibling.nodeValue, 'a text node')
			assert.strictEqual(middle1.firstChild.nextSibling.nextSibling.id, 'bottom-2')
			assert.strictEqual(structureElement.lastChild.className, 'middle-2')
		},
		inputs: function() {
			var inputElement = new input()
			var checkboxElement = new checkbox()
			assert.strictEqual(checkboxElement.type, 'checkbox')
		}
	})
});