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
	main.default = reactive // default export
	var localGlobal = typeof window == 'undefined' ? global : window
	if (localGlobal.alkali) {
		console.warn('Multiple instances of alkali have been defined, which can cause alkali context instances to be out of sync')
	}
	return localGlobal.alkali = main
}))
