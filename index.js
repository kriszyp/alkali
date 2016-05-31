define(['./Element', './Variable', './react', './Updater', './operators', './Copy'], function(Element, Variable, react, Updater, operators, Copy) {
	var main = Object.create(Element)
  main.Copy = Copy
	main.Element = Element
	main.Variable = Variable
	main.all = Variable.all
	main.react = react
	main.Updater = Updater
  Object.assign(main, Updater)
	Object.assign(main, operators)
	return main
})