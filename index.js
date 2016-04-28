define(['./Element', './Variable', './react', './Updater', './operators'], function(Element, Variable, react, Updater, operators) {
	var main = Object.create(Element)
	main.Variable = Variable
	main.all = Variable.all
	main.react = react
	main.Updater = Updater
	main.operators = operators
	return main
})