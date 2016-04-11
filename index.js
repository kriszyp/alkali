define(['./Element', './Variable', './react', './Updater'], function(Element, Variable, react, Updater) {
	var main = Object.create(Element)
	main.Variable = Variable
	main.all = Variable.all
	main.react = react
	main.Updater = Updater
	return main	
})