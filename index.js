define(['alkali/Variable', 'alkali/Element', 'alkali/operators'], function(Variable, Element, operators) {
	var Div = Element.Div
	var Textarea = Element.Textarea
	var add = operators.add
	var sampleCode = `
		let a = new Variable('hi')
		container.appendChild(new div(a))
	`
	function makeExample(code) {
		var content = new Variable(code)
		var Example = Div('.demo', [
			Textarea(content),
			Div({
				renderContent: (newContent) => {
					var container = this
					eval(newContent)
				},
				content: content
			})
		])
		return new Example()
	}
	var examples = document.querySelectorAll('.example')
	for (var i = 0, l = examples.length; i < l; i++) {
		var example = examples[i]
		var code = example.innerText
		example.parentNode.replaceChild(example, makeExample(code))
	}
})