(function (root, factory) { if (typeof define === 'function' && define.amd) {
	define(['./util/lang', './Variable'], factory) } else if (typeof module === 'object' && module.exports) {
  module.exports = factory(require('./util/lang'), require('./Variable')) // Node
}}(this, function (lang, VariableExports) {
	var Variable = VariableExports.Variable

	function deepCopy(source, target, derivativeMap) {
		if (source && typeof source == 'object') {
			if (source instanceof Array) {
				target = [] // always create a new array for array targets
				for(var i = 0, l = source.length; i < l; i++) {
					target[i] = deepCopy(source[i], null, derivativeMap)
				}
			} else {
				if (!target || typeof target !== 'object') {
					target = derivativeMap && derivativeMap.get(source)
					if (!target) {
						target = {}
						derivativeMap && derivativeMap.set(source, target)
					}
				}
				for (var i in source) {
					target[i] = deepCopy(source[i], target[i], derivativeMap)
				}
			}
			return target
		}
		return source
	}

	var Copy = lang.compose(Variable, function(copiedFrom) {
		// this is the variable that we derive from
		this.copiedFrom = copiedFrom
		this.derivativeMap = new lang.WeakMap(null, 'derivative')
		this.isDirty = new Variable(false)
	}, {
		getValue: function(sync, forModification, forChild) {
			if(this.state) {
				this.state = null
			}
			var value = this.copiedFrom.valueOf()
			if(value && typeof value == 'object') {
				var derivative = this.derivativeMap.get(value)
				if (derivative == null) {
					this.derivativeMap.set(value, derivative = deepCopy(value, undefined, this.derivativeMap))
					this.value = derivative
				}
			}
			if(this.value === undefined) {
				return value
			}
			return Variable.prototype.getValue.call(this, sync, forModification, forChild)
		},
		getCopyOf: function(value) {
			var derivative = this.derivativeMap.get(value)
			if (derivative == null) {
				this.derivativeMap.set(value, derivative = deepCopy(value, undefined, this.derivativeMap))
			}
			return derivative
		},
		save: function() {
			// copy back to the original object
			if (this.copiedFrom.put) { // copiedFrom doesn't have to be a variable, it can be a plain object
				// just assign it now
				this.copiedFrom.put(this.valueOf())
			} else {
				// copy back into the original object
				var original = this.copiedFrom.valueOf()
				var newCopiedFrom = deepCopy(this.valueOf(), original)
			}
			this.isDirty.put(false)
			this.onSave && this.onSave()
		},
		revert: function() {
			var original = this.copiedFrom.valueOf()
			this.derivativeMap = new lang.WeakMap(null, 'derivative') // clear out the mapping, so we can start fresh
			this.put(deepCopy(original, undefined, this.derivativeMap))
			this.isDirty.put(false)
		},
		updated: function() {
			this.isDirty.put(true)
			return Variable.prototype.updated.apply(this, arguments)
		}
	})
	return Copy
}))
