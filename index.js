/// <reference path="./typings.d.ts" />
(function (root, factory) { if (typeof define === 'function' && define.amd) {
  define(['./Element', './Renderer', './react', './Copy', './operators', './Variable', './util/lang'], factory) } else if (typeof module === 'object' && module.exports) {        
  module.exports = factory(require('./Element'), require('./Renderer'), require('./react'), require('./Copy'), require('./operators'), require('./Variable'), require('./util/lang')) // Node
}}(this, function (Element, Renderer, react, Copy, operators, VariableExports, lang) {

	var main = Object.create(Element)
	main.Copy = Copy
	main.Element = Element
	lang.copy(main, VariableExports)
	main.react = react
	main.spawn = function(func) {
		return react(func).valueOf()
	}
	main.Renderer = Renderer.ElementRenderer
	lang.copy(main, Renderer)
	lang.copy(main, operators)
	main.default = undefined // no default export
	return main
}))