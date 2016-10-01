/// <reference path="./typings.d.ts" />
(function (root, factory) { if (typeof define === 'function' && define.amd) {
  define(['./Element', './Renderer', './react', './Copy', './operators', './Variable'], factory) } else if (typeof module === 'object' && module.exports) {        
  module.exports = factory(require('./Element'), require('./Renderer'), require('./react'), require('./Copy'), require('./operators'), require('./Variable')) // Node
}}(this, function (Element, Renderer, react, Copy, operators, Variable) {

	var main = Object.create(Element)
	main.Copy = Copy
	main.Element = Element
	main.Variable = Variable
	main.VMap = Variable.VMap
	main.VArray = Variable.VArray
	main.VPromised = Variable.VPromised
	main.all = Variable.all
	main.Transform = Variable.Call
	main.react = react
	main.spawn = function(func) {
		return react(func).valueOf()
	}
	main.Renderer = Renderer
	Object.assign(main, Renderer)
	Object.assign(main, operators)
	return main
}))