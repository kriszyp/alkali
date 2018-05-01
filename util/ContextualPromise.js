(function (root, factory) { if (typeof define === 'function' && define.amd) {
	define(['./lang', '../Variable'], factory) } else if (typeof module === 'object' && module.exports) {
  module.exports = factory(require('./lang'), require('../Variable')) // Node
}}(this, function (lang, VariableExports) {

const Promise = (typeof global != 'undefined' ? global : window).Promise
function ContextualPromise(executor) {
	this.context = VariableExports.currentContext
	this.promise = new Promise(executor)
}
lang.copy(ContextualPromise.prototype, {
	then: function(onFulfilled, onRejected) {
		var context = this.context
		var promise = this.promise
		if (context && promise.notifies) {
			return context.executeWithin(function() {
				return new ContextualPromiseFromPromise(promise.then(
					getExecutor(onFulfilled, context),
					getExecutor(onRejected, context)
				), context)
			})
		}
		return new ContextualPromiseFromPromise(promise.then(
			getExecutor(onFulfilled, context),
			getExecutor(onRejected, context)
		), context)
	},
	catch: function(onRejected) {
		var context = this.context
		return new ContextualPromiseFromPromise(this.promise.catch(
			getExecutor(onRejected, context)
		), context)
	},
	finally: function(onResolved) {
		var context = this.context
		return new ContextualPromiseFromPromise(this.promise.finally(
			getExecutor(onResolved, context)
		), context)
	},
	isContextual: true
})

function getExecutor(executor, context) {
	if (executor && context) {
		return function(value) {
			return context.executeWithin(function() {
				var result = executor(value)
				if (result && result.then) {
					return new ContextualPromiseFromPromise(result, context)
				}
				return result
			})
		}
	}
	return executor
}
ContextualPromise.resolve = function(value) {
	var promise = (value && value.then) ? value : Promise.resolve(value)
	return new ContextualPromiseFromPromise(promise, VariableExports.currentContext)
}
ContextualPromise.all = function(promises) {
	return new ContextualPromiseFromPromise(Promise.all(startPromises(promises)), VariableExports.currentContext)
}
ContextualPromise.race = function(promises) {
	return new ContextualPromiseFromPromise(Promise.race(startPromises(promises)), VariableExports.currentContext)
}
function startPromises(promises) {
	var contextualizedPromises = new Array(promises.length)
	for (var i = 0, l = promises.length; i < l; i++) {
		var value = promises[i]
		if (value && value.then) {
			value = value.then() // execute then immediately (still using the current context)
		}
		contextualizedPromises[i] = value
	}
	return contextualizedPromises
}
function ContextualPromiseFromPromise(promise, context) {
	this.context = context
	this.promise = promise
}
ContextualPromiseFromPromise.prototype = ContextualPromise.prototype
return ContextualPromise
}))
