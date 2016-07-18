define(['./Element', './Variable', './react', './Renderer', './operators', './Copy'], function(Element, Variable, react, Renderer, operators, Copy) {
	var main = Object.create(Element)
	main.Copy = Copy
	main.Element = Element
	main.Variable = Variable
	main.all = Variable.all
	main.react = react
	main.spawn = function(func) {
		return react(func).valueOf()
	}
	main.Renderer = Renderer
	Object.assign(main, Renderer)
	Object.assign(main, operators)
	return main
})