/// <reference path="./typings.d.ts" />
(function (root, factory) { if (typeof define === 'function' && define.amd) {
  define(['./Element', './Renderer', './reactive', './Copy', './operators', './Variable', './util/lang'], factory) } else if (typeof module === 'object' && module.exports) {
  module.exports = factory(require('./Element'), require('./Renderer'), require('./reactive'), require('./Copy'), require('./operators'), require('./Variable'), require('./util/lang')) // Node
}}(this, function (Element, Renderer, reactive, Copy, operators, VariableExports, lang) {

	var main = Object.create(Element)
	main.Copy = Copy
	main.Element = Element
	lang.copy(main, VariableExports)
	Object.defineProperty(main, 'currentContext', Object.getOwnPropertyDescriptor(VariableExports, 'currentContext'))
	main.reactive = reactive
	lang.copy(main.react, reactive) // For backwards compatibility with babel transform
	main.spawn = lang.spawn
	main.Renderer = Renderer.ElementRenderer
	lang.copy(main, Renderer)
	lang.copy(main, operators)
	main.default = reactive // no default export
	return main
}))
