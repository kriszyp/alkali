define([
	'../Element',
	'../Variable',
	'intern!object',
	'intern/chai!assert'
], function (Element, Variable, registerSuite, assert) {
	var div = Element.div
	var span = Element.span
	var checkbox = Element.checkbox
	var radio = Element.radio
	var input = Element.input
	var number = Element.number
	var content = Element.content
	var ul = Element.ul
	var li = Element.li
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
			var structureElement = Structure.create()
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
			var textVariable = new Variable('start')
			var textInput = new input(textVariable)
			document.body.appendChild(textInput)
			assert.strictEqual(textInput.type, 'text')
			assert.strictEqual(textInput.value, 'start')
			textVariable.put('new value')
			return new Promise(requestAnimationFrame).then(function(){
				assert.strictEqual(textInput.value, 'new value')

				textInput.value = 'change from input'
				var nativeEvent = document.createEvent('HTMLEvents')
				nativeEvent.initEvent('change', true, true)
				textInput.dispatchEvent(nativeEvent)
				assert.strictEqual(textVariable.valueOf(), 'change from input')
			})
			var boolVariable = new Variable(true)
			var checkboxInput = new checkbox(boolVariable)
			document.body.appendChild(checkboxInput)
			assert.strictEqual(checkboxInput.type, 'checkbox')
			assert.strictEqual(checkboxInput.checked, true)
			checkboxInput.put(false)
			return new Promise(requestAnimationFrame).then(function(){
				assert.strictEqual(checkboxInput.checked, false)
			})
			var numberVariable = new Variable(2020)
			var numberInput = new number(dateVariable)
			document.body.appendChild(numberInput)
			assert.strictEqual(numberInput.type, 'number')
			assert.strictEqual(numberInput.valueAsNumber, 2020)
			checkboxInput.put(122)
			return new Promise(requestAnimationFrame).then(function(){
				assert.strictEqual(numberInput.valueAsNumber, 122)
				numberInput.valueAsNumber = 10
				var nativeEvent = document.createEvent('HTMLEvents')
				nativeEvent.initEvent('change', true, true)
				numberInput.dispatchEvent(nativeEvent)
				assert.strictEqual(numberVariable.valueOf(), 10)
			})
			assert.strictEqual(new radio().type, 'radio')

		},
		events: function() {
			var WithClick = div({
				onclick: function() {
					this.wasClicked = true
				}
			})
			var divElement = new WithClick()
			divElement.click()
			assert.isTrue(divElement.wasClicked)
		},
		contentNode: function() {
			var title = new Variable('title')
			var someContent = new Variable('content')
			var Layout = div('.top', {id: 'top'}, [
				div('.middle-1'), [
					title,
					content(div('.content-node'))
				],
				div('.middle-2')
			])
			var result = new Layout([
				div('.inside-layout', [someContent])
			])
			document.body.appendChild(result)
			var middle = result.firstChild
			assert.strictEqual(middle.firstChild.nodeValue, 'title')
			var container = middle.firstChild.nextSibling
			assert.strictEqual(container.className, 'content-node')
			assert.strictEqual(container.firstChild.className, 'inside-layout')
			assert.strictEqual(container.firstChild.firstChild.nodeValue, 'content')
			title.put('new title')
			someContent.put('new content')
			return new Promise(requestAnimationFrame).then(function(){
				assert.strictEqual(middle.firstChild.nodeValue, 'new title')
				assert.strictEqual(container.firstChild.firstChild.nodeValue, 'new content')
			})
		},
		list: function() {
			var arrayVariable = new Variable(['a', 'b', 'c'])
			var listElement = new ul({
				content: arrayVariable,
				each: li([
					span('item')
				])
			})
			assert.strictEqual(listElement.childNodes.length, 3)
		}
	})
});