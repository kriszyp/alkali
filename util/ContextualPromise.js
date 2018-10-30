(function (root, factory) { if (typeof define === 'function' && define.amd) {
	define(['./lang', '../Variable'], factory) } else if (typeof module === 'object' && module.exports) {
  module.exports = factory(require('./lang'), require('../Variable')) // Node
}}(this, function (lang, VariableExports) {

var Promise = (typeof global != 'undefined' ? global : window).Promise
function ContextualPromise(executor) {
	this.context = VariableExports.currentContext
	this.promise = new Promise(executor)
}
lang.copy(ContextualPromise.prototype, {
	then: function(onFulfilled, onRejected) {
		var context = this.context
		var promise = this.promise
		if (context && promise.notifies) {
			var contextualPromise = this
			return context.executeWithin(function() {
				return new ContextualPromiseFromPromise(promise.then(
					getExecutor(onFulfilled, context),
					getExecutor(onRejected, context)
				), context, contextualPromise)
			})
		}
		return new ContextualPromiseFromPromise(promise.then(
			getExecutor(onFulfilled, context),
			getExecutor(onRejected, context)
		), context, this)
	},
	'catch': function(onRejected) {
		var context = this.context
		return new ContextualPromiseFromPromise(this.promise.catch(
			getExecutor(onRejected, context)
		), context, this)
	},
	'finally': function(onResolved) {
		var context = this.context
		return new ContextualPromiseFromPromise(this.promise.finally(
			getExecutor(onResolved, context)
		), context, this)
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
ContextualPromise.reject = function(value) {
	var promise = Promise.reject(value)
	return new ContextualPromiseFromPromise(promise, VariableExports.currentContext)
}
ContextualPromise.all = function(promises) {
	var startedPromises = startPromises(promises)
	var promise = new ContextualPromiseFromPromise(Promise.all(startedPromises), VariableExports.currentContext)
	if (startedPromises.assignAbort) {
		startedPromises.assignAbort(promise)
	}
	return promise
}
ContextualPromise.race = function(promises) {
	var startedPromises = startPromises(promises)
	var promise = new ContextualPromiseFromPromise(Promise.race(startedPromises), VariableExports.currentContext)
	if (startedPromises.assignAbort) {
		startedPromises.assignAbort(promise)
	}
	return promise
}
function startPromises(promises) {
	var contextualizedPromises = new Array(promises.length)
	var hasAbort = ContextualPromise.propagateAbort
	for (var i = 0, l = promises.length; i < l; i++) {
		var value = promises[i]
		if (value && value.then) {
			if (value.notifies)
				value = value.then() // execute then immediately (still using the current context)
			if (!value.abort) {
				hasAbort = false
			}
		}
		contextualizedPromises[i] = value
	}
	if (hasAbort) {
		contextualizedPromises.assignAbort = function(promise) {
			promise.abort = function(message) {
				for (var i = 0, l = promises.length; i < l; i++) {
					var promise = promises[i]
					if (promise && promise.abort) {
						promise.abort(message)
					}
				}
			}
		}
	}
	return contextualizedPromises
}
function ContextualPromiseFromPromise(promise, context, originalPromise) {
	this.context = context
	this.promise = promise
	if (ContextualPromise.propagateAbort && (originalPromise || promise).abort) {
		this.abort = (originalPromise || promise).abort
	}
}
ContextualPromiseFromPromise.prototype = ContextualPromise.prototype
return ContextualPromise
}))
