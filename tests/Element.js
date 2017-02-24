define([
	'../Element',
	'../Variable',
	'intern!object',
	'intern/chai!assert',
	'bluebird/js/browser/bluebird'
], function (Element, Variable, registerSuite, assert, Promise) {
	var Div = Element.Div
	var Label = Element.Label
	var Span = Element.Span
	var Checkbox = Element.Checkbox
	var Radio = Element.Radio
	var Anchor = Element.Anchor
	var Input = Element.Input
	var Textarea = Element.Textarea
	var H6 = Element.H6
	var P = Element.P
	var NumberInput = Element.NumberInput
	var DateInput = Element.DateInput
	var Select = Element.Select
	var Option = Element.Option
	var content = Element.content
	var UL = Element.UL
	var LI = Element.LI
	var Item = Element.Item
	var Radio = Element.Radio
	var append = Element.append
	var prepend = Element.prepend
	var extend = Element.extend
	var assign = Element.assign
	var VArray = Variable.VArray
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
		radio: function() {
			var boolVariable = new Variable(true)
			var radio = new Radio(boolVariable)
			document.body.appendChild(radio)
			assert.strictEqual(radio.type, 'radio')
			assert.strictEqual(radio.checked, true)
			boolVariable.put(false)
			return new Promise(requestAnimationFrame).then(function(){
				assert.strictEqual(radio.checked, false)
			})
		},
		numberInput: function() {
			var numberVariable = new Variable(0)
			var numberInput = new NumberInput(numberVariable)
			assert.strictEqual(numberInput.type, 'number')
			if (isNaN(numberInput.valueAsNumber)) {
				// in IE, valueAsNumber doesn't work
				assert.strictEqual(numberInput.value, '0')
				return
			}
			assert.strictEqual(numberInput.valueAsNumber, 0)

			numberVariable = new Variable(2020)
			numberInput = new NumberInput(numberVariable)
			document.body.appendChild(numberInput)
			assert.strictEqual(numberInput.type, 'number')
			if (isNaN(numberInput.valueAsNumber)) {
				// in IE, valueAsNumber doesn't work
				assert.strictEqual(numberInput.value, '2020')
				return
			}
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
		dateInput: function() {
			var startingDate = new Date(1458345600000)
			var dateVariable = new Variable(startingDate)
			var dateInput = new DateInput(dateVariable)
			if (dateInput.type === 'text') {
				// this browser doesn't support this
				return
			}
			document.body.appendChild(dateInput)
			assert.strictEqual(dateInput.type, 'date')
			assert.strictEqual(dateInput.valueAsDate.getTime(), startingDate.getTime())
			dateVariable.put(new Date(0))
			return new Promise(requestAnimationFrame).then(function(){
				assert.strictEqual(dateInput.valueAsDate.getTime(), 0)
				dateInput.valueAsDate = startingDate
				var nativeEvent = document.createEvent('HTMLEvents')
				nativeEvent.initEvent('change', true, true)
				dateInput.dispatchEvent(nativeEvent)
				assert.strictEqual(dateVariable.valueOf().getTime(), startingDate.getTime())
			})
		},
		radios: function() {
			var radioGroup = new Div([
				new Radio({
					name: 'radio-group',
					value: 'a'
				}),
				new Radio({
					name: 'radio-group',
					value: 'b'
				})
			])
			assert.strictEqual(radioGroup.firstChild.type, 'radio')
		},
		select: function() {
			var options = [{id: 1, text: 'One'}, {id: 2, text: 'Two'}, {id: 3, text: 'Three'}]
			var selected = new Variable(3)
			var select = new Select({
				content: options,
				value: selected,
				each: Option({
					value: Item.property('id'),
					content: Item.property('text')
				})
			})
			document.body.appendChild(select)
			assert.strictEqual(select.firstChild.tagName, 'OPTION')
			assert.strictEqual(select.firstChild.value, '1')
			assert.strictEqual(select.firstChild.textContent, 'One')
			//assert.strictEqual(select.firstChild.selected, false)
			assert.strictEqual(select.lastChild.tagName, 'OPTION')
			assert.strictEqual(select.lastChild.value, '3')
			assert.strictEqual(select.lastChild.textContent, 'Three')
			//assert.strictEqual(select.lastChild.selected, true)
			select.firstChild.selected = true
			var nativeEvent = document.createEvent('HTMLEvents')
			nativeEvent.initEvent('change', true, true)
			select.dispatchEvent(nativeEvent)
			//assert.strictEqual(selected.valueOf(), '1')
			selected.put(2)
			return new Promise(requestAnimationFrame).then(function(){
				assert.strictEqual(select.firstChild.nextSibling.selected, true)
				assert.strictEqual(select.value, '2')
			})
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
			var Layout = extend(Div, {id: 'top'})
			Layout.children = [
				Div('.middle-1'), [
					title,
					content(Div('.content-node'))
				],
				Anchor('.middle-2', {href: 'https://github.com/kriszyp/alkali'})
			]
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

		childrenDOMOrderWithVariables: function(){
			var Vars = [1, 2, 3].map(function(v) { return new Variable(v) });
			var children = [
				'First node ', new VArray(Vars).map(function(v) { return Span([v]) })
			];
			var div = new Div(children);
			document.body.appendChild(div)
			assert.strictEqual(div.firstChild.nodeType, 3)
		},

		append: function() {
			var top = new Div('.top')
			append(top, Span, Span('.second'))
			assert.strictEqual(top.firstChild.tagName, 'SPAN')
			assert.strictEqual(top.firstChild.nextSibling.className, 'second')
		},

		appendAsMethod: function() {
			HTMLElement.prototype.append = append
			var top = new Div('.top')
			top.append(Span, Span('.second'))
			assert.strictEqual(top.firstChild.tagName, 'SPAN')
			assert.strictEqual(top.firstChild.nextSibling.className, 'second')
		},

		prependAsMethod: function() {
			HTMLElement.prototype.prepend = prepend
			HTMLElement.prototype.append = append
			var top = new Div('.top')
			top.append(Span('.last'))
			top.prepend(Span, Span('.second'))
			assert.strictEqual(top.firstChild.tagName, 'SPAN')
			assert.strictEqual(top.firstChild.nextSibling.className, 'second')
			assert.strictEqual(top.firstChild.nextSibling.nextSibling.className, 'last')
		},

		list: function() {
			var arrayVariable = new VArray(['a', 'b', 'c'])
			var listElement = new UL({
				content: arrayVariable,
				each: LI([
					Span(Item)
				])
			})
			document.body.appendChild(listElement)
			assert.strictEqual(listElement.childNodes.length, 3)
			assert.strictEqual(listElement.childNodes[0].firstChild.innerHTML, 'a')
			assert.strictEqual(listElement.childNodes[1].firstChild.innerHTML, 'b')
			arrayVariable.push('d')
			arrayVariable.push('e')
			return new Promise(requestAnimationFrame).then(function(){
				assert.strictEqual(listElement.childNodes.length, 5)
				assert.strictEqual(listElement.childNodes[3].firstChild.innerHTML, 'd')
				assert.strictEqual(listElement.childNodes[4].firstChild.innerHTML, 'e')
				arrayVariable.splice(2, 2)
				return new Promise(requestAnimationFrame).then(function(){
					assert.strictEqual(listElement.childNodes.length, 3)
					arrayVariable.splice(1, 0, 'f')
					return new Promise(requestAnimationFrame).then(function(){
						assert.strictEqual(listElement.childNodes.length, 4)
						assert.strictEqual(listElement.childNodes[1].firstChild.innerHTML, 'f')
					})
				})
			})
		},
		listOfMappedObjects: function() {
			var TypedArray = VArray.of(Variable.with({name: Variable}))
			var arrayVariable = new TypedArray([{name:'a'}, {name: 'b'},{name: 'c'}])
			var listElement = new UL(arrayVariable.map(function(item) {
				return LI(item.name)
			}))
			document.body.appendChild(listElement)
			assert.strictEqual(listElement.children.length, 3)
			assert.strictEqual(listElement.childNodes[0].innerHTML, 'a')
			assert.strictEqual(listElement.childNodes[1].innerHTML, 'b')
			arrayVariable.property(0).name.put('A')
			return new Promise(requestAnimationFrame).then(function(){
				assert.strictEqual(listElement.childNodes[0].innerHTML, 'A')
				assert.strictEqual(listElement.children.length, 3)
			})
		},
		listOfMappedObjectsWithChangingType: function() {
			var TypedArray = VArray.of(Variable.with({name: Variable}))
			var arrayVariable = new TypedArray([{name:'a'}, {name: 'b'},{name: 'c', isSpan: true}])
			var listElement = new UL(arrayVariable.map(function(item) {
				return item.to(function(item) {
					return item.isSpan ? Span(item.name) : LI(item.name)
				})
			}))
			document.body.appendChild(listElement)
			assert.strictEqual(listElement.children.length, 3)
			assert.strictEqual(listElement.childNodes[0].innerHTML, 'a')
			assert.strictEqual(listElement.childNodes[0].tagName, 'LI')
			assert.strictEqual(listElement.childNodes[1].innerHTML, 'b')
			arrayVariable.property(0).name.put('A')
			arrayVariable.property(0).set('isSpan', true)
			return new Promise(requestAnimationFrame).then(function(){
				assert.strictEqual(listElement.childNodes[0].innerHTML, 'A')
				assert.strictEqual(listElement.childNodes[0].tagName, 'SPAN')
				assert.strictEqual(listElement.children.length, 3)
			})
		},
		simplePropertyAccess: function() {
			var MyComponent = extend(Div, {})
			MyComponent.children = [
			    Span(MyComponent.property('title')),
			]

			// init
			var el = new MyComponent({
			    title: 'text for the span',
			    link: 'a link for a[href]'
			})

			document.body.appendChild( el )
			assert.strictEqual(el.firstChild.textContent, 'text for the span')
		},
		applyPropertyToChild: function() {
			var MyComponent = extend(Div, {})
			MyComponent.children = [
				Anchor(MyComponent.property('title'), {
					href: MyComponent.property('link')
				}),
				P(MyComponent.property('title').to(function(title) {
					return MyComponent.property('body').to(function(body) {
						return title + ', ' + body
					})
				}))
			]
			var greeting = new Variable('Hello')
			var myComponent = new MyComponent({
				title: greeting,
				link: 'https://github.com/kriszyp/alkali',
				body: 'World'
			})
			document.body.appendChild(myComponent)
			assert.strictEqual(myComponent.firstChild.textContent, 'Hello')
			assert.strictEqual(myComponent.firstChild.href, 'https://github.com/kriszyp/alkali')
			assert.strictEqual(myComponent.lastChild.textContent, 'Hello, World')
			greeting.put('New Title')
			return new Promise(requestAnimationFrame).then(function(){
				return new Promise(requestAnimationFrame).then(function(){
					assert.strictEqual(MyComponent.property('title').for(myComponent).valueOf(), 'New Title')
					assert.strictEqual(myComponent.firstChild.textContent, 'New Title')
					assert.strictEqual(myComponent.lastChild.textContent, 'New Title, World')
				})
			})
		},
		applyVariableToChild: function() {
			var Link, Body, Title
			var MyComponent = Div({
				title: Title = Variable(),
				link: Link = Variable(),
				body: Body = Variable(),
				children: [
					Anchor(Title, {
						href: Link
					}),
					P(Title.to(function(title) {
						return Body.to(function(body) {
							return title + ', ' + body
						})
					}))
				]
			})
			assert.isTrue(MyComponent.link === Link)
			var greeting = new Variable('Hello')
			var myComponent = new MyComponent({
				title: greeting,
				link: 'https://github.com/kriszyp/alkali',
				body: 'World'
			})
			document.body.appendChild(myComponent)
			assert.strictEqual(myComponent.firstChild.textContent, 'Hello')
			assert.strictEqual(myComponent.firstChild.href, 'https://github.com/kriszyp/alkali')
			assert.strictEqual(myComponent.lastChild.textContent, 'Hello, World')
			greeting.put('New Title')
			return new Promise(requestAnimationFrame).then(function(){
				return new Promise(requestAnimationFrame).then(function(){
					assert.strictEqual(MyComponent.property('title').for(myComponent).valueOf(), 'New Title')
					assert.strictEqual(myComponent.firstChild.textContent, 'New Title')
					assert.strictEqual(myComponent.lastChild.textContent, 'New Title, World')
				})
			})
		},
		lookupForSingleInstanceVariable: function() {
			var MyVariable = Variable()
			var MyDiv = Div(MyVariable)
			var div1 = new MyDiv()
			document.body.appendChild(div1)
			var div2 = new MyDiv()
			document.body.appendChild(div2)
			MyVariable.defaultInstance.put(3)
			return new Promise(requestAnimationFrame).then(function(){
				assert.strictEqual(div1.textContent, '3')
				assert.strictEqual(div2.textContent, '3')
			})
		},
		lookupForMultipleInstanceVariable: function() {
			var MyVariable = Variable.with()
			var MyDiv = Div(MyVariable, {
				hasOwn: MyVariable
			})
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
		},
		inheritance: function() {
			var a = new Variable('a')
			var b = new Variable('b')

			var MyDiv = Div({
				textContent: a,
				title: a
			})
			var div1 = new MyDiv({title: b})
			document.body.appendChild(div1)
			assert.strictEqual(div1.textContent, 'a')
			assert.strictEqual(div1.title, 'b')
			a.put('A')
			return new Promise(requestAnimationFrame).then(function(){
				assert.strictEqual(div1.textContent, 'A')
				assert.strictEqual(div1.title, 'b')
				b.put('B')
				return new Promise(requestAnimationFrame).then(function(){
					assert.strictEqual(div1.textContent, 'A')
					assert.strictEqual(div1.title, 'B')
				})
			})
		},
		cleanup: function() {
			var a = new Variable('a')
			var div = new Div([
				a,
				Span(a)])
			document.body.appendChild(div)
			return new Promise(requestAnimationFrame).then(function() {
				assert.strictEqual(a.listeners.length, 2)
				document.body.removeChild(div)
				return new Promise(requestAnimationFrame).then(function() {
					assert.strictEqual(a.listeners, false)
				})
			})
		},
		classes: function() {
			var a = new Variable(false)
			var b = new Variable(true)
			var DivWithClass = Div('.first')
			var div = new DivWithClass('.second.third', {
				classes: {
					a: a,
					b: b
				}
			})
			var div2 = new Div('.one.two')
			var divWithoutInitialClass = new Div({ classes: { dynamicclass: b }})
			document.body.appendChild(div)
			return new Promise(requestAnimationFrame).then(function() {
				assert.strictEqual(div2.className, 'one two')
				assert.strictEqual(div.className, 'first second third b')
				assert.strictEqual(divWithoutInitialClass.className, 'dynamicclass')
				a.put(true)
				return new Promise(requestAnimationFrame).then(function() {
					assert.strictEqual(div.className, 'first second third b a')
					b.put(false)
					return new Promise(requestAnimationFrame).then(function() {
						assert.strictEqual(div.className, 'first second third a')
						a.put(false)
						return new Promise(requestAnimationFrame).then(function() {
							assert.strictEqual(div.className, 'first second third')
						})
					})
				})
			})
		},
		renderProperty: function() {
			var MyComponent = extend(Div, {
				renderFoo: function(value) {
					this.textContent = value + 'foo'
				}
			})
			var foo = new Variable(1)
			var div = new MyComponent({
				foo: foo
			})
			document.body.appendChild(div)
			return new Promise(requestAnimationFrame).then(function() {
				assert.strictEqual(div.textContent, '1foo')
				foo.put(2)
				return new Promise(requestAnimationFrame).then(function() {
					assert.strictEqual(div.textContent, '2foo')
					div.foo = 3
					return new Promise(requestAnimationFrame).then(function() {
						assert.strictEqual(div.textContent, '3foo')
					})
				})
			})
		},
		attributes: function() {
			var v = new Variable('one')
			var div = new Div({
				attributes: {
					role: 'button',
					'aria-describedby': v
				}
			})
			document.body.appendChild(div)
			assert.strictEqual(div.getAttribute('role'), 'button')
			assert.strictEqual(div.getAttribute('aria-describedby'), 'one')
			v.put('two')
			return new Promise(requestAnimationFrame).then(function() {
				assert.strictEqual(div.getAttribute('aria-describedby'), 'two')
			})
		},
		dataset: function() {
			var v = new Variable('one')
			var div = new Div({
				dataset: {
					foo: 'foo-value',
					bar: v
				}
			})
			document.body.appendChild(div)
			assert.strictEqual(div.getAttribute('data-foo'), 'foo-value')
			assert.strictEqual(div.dataset.foo, 'foo-value')
			assert.strictEqual(div.getAttribute('data-bar'), 'one')
			v.put('two')
			return new Promise(requestAnimationFrame).then(function() {
				assert.strictEqual(div.getAttribute('data-bar'), 'two')
			})
		},
		styleObject: function() {
			var v = new Variable('25px')
			var MyDiv = Div({
				style: {
					marginLeft: '10px',
					paddingLeft: '10px'
				}
			})
			var MyDiv2 = MyDiv({
				style: {
					paddingLeft: v
				}
			})
			var div = new MyDiv2({
				style: {
				  display: 'inline-block'
				}
			})
			document.body.appendChild(div)
			assert.strictEqual(div.style.marginLeft, '10px')
			assert.strictEqual(div.style.paddingLeft, '25px')
			assert.strictEqual(div.style.display, 'inline-block')
			v.put('35px')
			return new Promise(requestAnimationFrame).then(function() {
				assert.strictEqual(div.style.paddingLeft, '35px')
			})
		},

		attributeProperties: function() {
			var v = new Variable('one')
			var label = new Label({
				role: 'button',
				for: v
			})
			document.body.appendChild(label)
			assert.strictEqual(label.getAttribute('role'), 'button')
			assert.strictEqual(label.htmlFor, 'one')
			v.put('two')
			return new Promise(requestAnimationFrame).then(function() {
				assert.strictEqual(label.htmlFor, 'two')
			})
		},

		overrideDefaultWithRender: function() {
			var widthRendered, textContentRendered
			var MyComponent = extend(Div, {
				renderWidth: function() {
					widthRendered = true
				},
				renderTextContent: function() {
					textContentRendered = true
				}
			})
			var component = new MyComponent({
				width: '10px'
			})
			assert.strictEqual(component.style.width, '') // shouldn't get set
			assert.strictEqual(widthRendered, true)
			widthRendered = false
			component.width = '20px'
			assert.strictEqual(widthRendered, true)
			assert.strictEqual(component.width, '20px')
			component.textContent = 'hello'
			assert.strictEqual(textContentRendered, true)
			assert.strictEqual(component.textContent, 'hello')
			assert.strictEqual(component.innerHTML, '') // make sure it blocks normal textContent
		},
		lifecycle: function() {
			var created = false
			var attached = 0
			var detached = 0
			var MyDiv = extend(Div, {
				created: function(properties) {
					if (properties.foo) {
						created = true
					}
					var div = document.createElement('div')
					this.appendChild(div)
				},
				attached: function() {
					attached++
				},
				detached: function() {
					detached++
				}
			})
			var parentEl = document.createElement('div')
			document.body.appendChild(parentEl)
			var div = new MyDiv({foo: 'bar'})
			assert.isTrue(created)
			parentEl.appendChild(div)
			return new Promise(requestAnimationFrame).then(function() {
				assert.equal(attached, 1, 'expected a single attach event')
				parentEl.removeChild(div)
				document.body.removeChild(parentEl)
				return new Promise(requestAnimationFrame).then(function() {
					assert.equal(detached, 1, 'expected a single detach event')
				})
			})
		},

		assignElement: function() {
			var div = document.body.appendChild(new Div())
			var v = new Variable()
			assign(div, {
				title: v
			})
			v.put('foo')
			return new Promise(requestAnimationFrame).then(function() {
				assert.equal(div.title, 'foo')
			})
		},

		assignConstructor: function() {
			var MyDiv = Div()
			assign(MyDiv, {
				title: 'foo'
			})
			var div = document.body.appendChild(new MyDiv())
			assert.equal(div.title, 'foo')
		},

		content0: function() {
			var div = document.body.appendChild(new Div([Span(0), new Span(0), Span({content: 0})]))
			assert.equal(div.childNodes[0].textContent, '0')
			assert.equal(div.childNodes[1].textContent, '0')
			assert.equal(div.childNodes[2].textContent, '0')
		},

		performanceBaseline: function() {
			var container = document.body.appendChild(document.createElement('div'))
			for (var i = 0; i < 100; i++) {
				var childDiv = container.appendChild(document.createElement('div'))
				childDiv.appendChild(document.createElement('span'))
				childDiv.appendChild(document.createElement('input')).className = 'test'
				container.innerHTML = ''
			}

		},
		performance: function() {
			var container = document.body.appendChild(document.createElement('div'))
			for (var i = 0; i < 100; i++) {
				var a = new Variable('a')
				container.appendChild(new Div([
					Span(a),
					Input('.test')
				]))
				container.innerHTML = ''
			}
		}
	})
});
