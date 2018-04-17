(function (root, factory) { if (typeof define === 'function' && define.amd) {
	define(['./lang', '../Variable'], factory) } else if (typeof module === 'object' && module.exports) {
  module.exports = factory(require('./lang'), require('../Variable')) // Node
}}(this, function (lang, VariableExports) {

function ContextualPromise(executor) {
	this.context = VariableExports.currentContext
	this.promise = new Promise(executor)
}
lang.copy(ContextualPromise.prototype, {
	then: function(onFulfilled, onRejected) {
		var context = this.context
		return new ContextualPromiseFromPromise(this.promise.then(
			onFulfilled && context ? function(result) {
				return context.executeWithin(function() {
					return onFulfilled(result)
				})
			} : onFulfilled,
			onRejected && context ? function(error) {
				return context.executeWithin(function() {
					return onRejected(error)
				})
			} : onRejected
		), this.context)
	},
	catch: function(onRejected) {
		var context = this.context
		return new ContextualPromiseFromPromise(this.promise.catch(
			onRejected && context ? function(error) {
				return context.executeWithin(function() {
					return onRejected(error)
				})
			} : onRejected
		), this.context)
	},
	finally: function(onResolved) {
		var context = this.context
		return new ContextualPromiseFromPromise(this.promise.finally(
			onResolved && context ? function(error) {
				return context.executeWithin(function() {
					return onResolved(error)
				})
			} : onResolved
		), this.context)
	}
})
ContextualPromise.resolve = function(value) {
	var promise = value && value.then || new Promise(value)
	var context = currentContext
	return new ContextualPromiseFromPromise(value, context)
}
function ContextualPromiseFromPromise(promise, context) {
	this.context = context
	this.promise = promise
}
ContextualPromiseFromPromise.prototype = ContextualPromise.prototype
return ContextualPromise
}))
