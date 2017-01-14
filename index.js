/// <reference path="./typings.d.ts" />
(function (root, factory) { if (typeof define === 'function' && define.amd) {
  define(['./Element', './Renderer', './react', './Copy', './operators', './Variable', './util/lang'], factory) } else if (typeof module === 'object' && module.exports) {        
  module.exports = factory(require('./Element'), require('./Renderer'), require('./react'), require('./Copy'), require('./operators'), require('./Variable'), require('./util/lang')) // Node
}}(this, function (Element, Renderer, react, Copy, operators, Variable, lang) {

	var main = Object.create(Element)
	main.Copy = Copy
	main.Element = Element
	main.Variable = Variable
	main.VMap = Variable.VMap
	main.VSet = Variable.VSet
	main.VArray = Variable.VArray
	main.VString = Variable.VString
	main.VNumber = Variable.VNumber
	main.VBoolean = Variable.VBoolean
	main.VDate = Variable.VDate
	main.VPromise = Variable.VPromise
	main.all = Variable.all
	main.Transform = Variable.Transform
	main.Caching = Variable.Caching
	main.react = react
	main.spawn = function(func) {
		return react(func).valueOf()
	}
	main.Renderer = Renderer.ElementRenderer
	lang.copy(main, Renderer)
	lang.copy(main, operators)
	return main
}))