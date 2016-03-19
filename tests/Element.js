define([
	'../Element',
	'../Variable',
	'intern!object',
	'intern/chai!assert'
], function (Element, Variable, registerSuite, assert) {
	var Div = Element.Div
	var Span = Element.Span
	var Checkbox = Element.Checkbox
	var Radio = Element.Radio
	var Anchor = Element.Anchor
	var Input = Element.Input
	var Textarea = Element.Textarea
	var H6 = Element.H6
	var P = Element.P
	var NumberInput = Element.NumberInput
	var content = Element.content
	var UL = Element.UL
	var LI = Element.LI
	registerSuite({
		name: 'Element',
		simpleElement: function () {
			var testDiv = new Div({id: 'test-div'})
			assert.equal(testDiv.tagName, 'DIV')
			assert.equal(testDiv.getAttribute('id'), 'test-div')
		},
		'change in variable': function () {
			var variable = new Variable(4)
			var withVariable = Div({
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
			var Structure = Div('.top', {id: 'top'}, [
				Div('.middle-1', [
					Span('#bottom-1'),
					'a text node',
					Span('#bottom-2')
				], {id: 'middle-1'}),
				Div('.middle-2')
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
		textInput: function() {
			var textVariable = new Variable('start')
			var textInput = new Input(textVariable)
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
		},
		checkbox: function() {
			var boolVariable = new Variable(true)
			var BoundCheckbox = Checkbox(boolVariable)
			var checkboxInput = new BoundCheckbox()
			document.body.appendChild(checkboxInput)
			assert.strictEqual(checkboxInput.type, 'checkbox')
			assert.strictEqual(checkboxInput.checked, true)
			boolVariable.put(false)
			return new Promise(requestAnimationFrame).then(function(){
				assert.strictEqual(checkboxInput.checked, false)
			})
		},
		numberInput: function() {
			var numberVariable = new Variable(2020)
			var numberInput = new NumberInput(numberVariable)
			document.body.appendChild(numberInput)
			assert.strictEqual(numberInput.type, 'number')
			assert.strictEqual(numberInput.valueAsNumber, 2020)
			numberVariable.put(122)
			return new Promise(requestAnimationFrame).then(function(){
				assert.strictEqual(numberInput.valueAsNumber, 122)
				numberInput.valueAsNumber = 10
				var nativeEvent = document.createEvent('HTMLEvents')
				nativeEvent.initEvent('change', true, true)
				numberInput.dispatchEvent(nativeEvent)
				assert.strictEqual(numberVariable.valueOf(), 10)
			})
			assert.strictEqual(new Radio().type, 'radio')

		},
		textarea: function() {
			var textVariable = new Variable('start')
			var textInput = new Textarea(textVariable)
			document.body.appendChild(textInput)
			assert.strictEqual(textInput.tagName, 'TEXTAREA')
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

		},
		events: function() {
			var WithClick = Div({
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
			var Layout = Div('.top', {id: 'top'}, [
				Div('.middle-1'), [
					title,
					content(Div('.content-node'))
				],
				Anchor('.middle-2', {href: 'https://github.com/kriszyp/alkali'})
			])
			var result = new Layout([
				Div('.inside-layout', [someContent])
			])
			document.body.appendChild(result)
			var middle = result.firstChild
			assert.strictEqual(middle.firstChild.nodeValue, 'title')
			assert.strictEqual(middle.nextSibling.tagName, 'A')
			assert.strictEqual(middle.nextSibling.href, 'https://github.com/kriszyp/alkali')
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
		nestedElements: function() {
			var result = new Div('.top', [
				new Div('.middle-1')
			])
			var middle = result.firstChild
			assert.strictEqual(middle.className, 'middle-1')
		},
		
		addToPrototype: function() {
			Element.addToElementPrototypes({
				get foo() {
					return 3
				},
				bar: function() {
					return this
				}
			})
			var divElement = new Div()
			assert.strictEqual(divElement.foo, 3)
			assert.strictEqual(divElement.bar(), divElement)
			var sectionElement = new Element.Section()
			assert.strictEqual(sectionElement.foo, 3)
			assert.strictEqual(sectionElement.bar(), sectionElement)
		},
		list: function() {
			var arrayVariable = new Variable(['a', 'b', 'c'])
			var item = new Variable('placeholder')
			var listElement = new UL({
				content: arrayVariable,
				each: LI([
					Span(item)
				])
			})
			document.body.appendChild(listElement)
			assert.strictEqual(listElement.childNodes.length, 3)
			assert.strictEqual(listElement.childNodes[0].childNodes[0].innerHTML, 'placeholder')
			arrayVariable.push('d')
			return new Promise(requestAnimationFrame).then(function(){
				assert.strictEqual(listElement.childNodes.length, 4)
				assert.strictEqual(listElement.childNodes[3].childNodes[0].innerHTML, 'placeholder')
				arrayVariable.splice(2, 1)
				return new Promise(requestAnimationFrame).then(function(){
					assert.strictEqual(listElement.childNodes.length, 3)
				})
			})
		},
		applyPropertyToChild: function() {
			var MyComponent = Div(function() {
				return [
					H6(MyComponent.property('title')),
					P(MyComponent.property('body'))
				]})
			var myComponent = new MyComponent({
				title: 'Hello',
				body: 'World'
			})
			document.body.appendChild(myComponent)
			assert.strictEqual(myComponent.firstChild.textContent, 'Hello')
			assert.strictEqual(myComponent.lastChild.textContent, 'World')
			myComponent.title = 'New Title'
			return new Promise(requestAnimationFrame).then(function(){
				return new Promise(requestAnimationFrame).then(function(){
					assert.strictEqual(myComponent.firstChild.textContent, 'New Title')
				})
			})
		},
		lookupForSingleInstanceVariable: function() {
			var MyVariable = Variable.extend()
			var MyDiv = Div(MyVariable)
			var div1 = new MyDiv()
			document.body.appendChild(div1)
			var div2 = new MyDiv()
			document.body.appendChild(div2)
			var variable = MyVariable.for(div1)
			variable.put(3)
			return new Promise(requestAnimationFrame).then(function(){
				assert.strictEqual(div1.textContent, '3')
				assert.strictEqual(div2.textContent, '3')
			})
		},
		lookupForMultipleInstanceVariable: function() {
			var MyVariable = Variable.extend()
			var MyDiv = Div(MyVariable).hasOwn(MyVariable)
			var div1 = new MyDiv()
			document.body.appendChild(div1)
			var div2 = new MyDiv()
			document.body.appendChild(div2)
			var variable1 = MyVariable.for(div1)
			variable1.put(1)
			var variable2 = MyVariable.for(div2)
			variable2.put(2)
			return new Promise(requestAnimationFrame).then(function(){
				assert.strictEqual(div1.textContent, '1')
				assert.strictEqual(div2.textContent, '2')
			})
		}
	})
});