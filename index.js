define(['./Element', './Variable', './react', './Updater', './operators'], function(Element, Variable, react, Updater, operators) {
	var main = Object.create(Element)
	main.Element = Element
	main.Variable = Variable
	main.all = Variable.all
	main.react = react
	main.Updater = Updater
	Object.assign(main, operators)
	return main
})