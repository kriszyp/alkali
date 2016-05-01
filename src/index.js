import alkali, { Variable, operators, Div, Textarea, Form, Label, NumberInput } from 'alkali'

function makeExample(code) {
	var content = new Variable(code)
	var Example = Div('.demo', [
		Div('.demo-contents', [
			Textarea(content, {spellcheck: false}),
			Div('.output', {
				renderCode(newCode) {
					var container = this
					container.innerHTML = ''
					try {
						container.appendChild(evalWith(newCode, alkali, container))
					} catch (e) {
						container.textContent = e.message
					}
				},
				code: content
			})
		]),
		Div('.fade')
	], {
		onclick() {
			this.className += ' active'
		}
	})
	var example = new Example()
	document.body.addEventListener('click', function(event) {
		example.className = example.className.replace(/ active/g, '')
		if (example.contains(event.target)) {
			example.className += ' active'
		}
	})
	return example
}
var examples = document.querySelectorAll('.example')
for (var i = 0, l = examples.length; i < l; i++) {
	var example = examples[i]
	var code = example.textContent
	example.parentNode.replaceChild(makeExample(code), example)
}