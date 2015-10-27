define([
	'../Element',
	'../Variable',
	'intern!object',
	'intern/chai!assert'
], function (ElementType, Variable, registerSuite, assert) {
	registerSuite({
		name: 'Element',
		simpleElement: function () {
			var div = new ElementType('div');
			var element = div.newElement();
			assert.equal(element.tagName, 'DIV');
		},
		'change in variable': function () {
			var variable = new Variable(4);
			var div = new ElementType('div');
			var withVariable = div.with({
				title: variable,
				id: 'id-1'
			});
			var element = withVariable.newElement();
			document.body.appendChild(element);
			assert.strictEqual(element.id, 'id-1');
			assert.strictEqual(element.title, '4');
			variable.put(5);
			ElementType.refresh();
			assert.strictEqual(element.title, '5');
		}

	});
});