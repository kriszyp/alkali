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
		getValue: function(context) {
			if(this.state) {
				this.state = null
			}
			var value = this.copiedFrom.valueOf(context)
			if(value && typeof value == 'object') {
				var derivative = this.derivativeMap.get(value)
				if (derivative == null) {
					this.derivativeMap.set(value, derivative = deepCopy(value, undefined, this.derivativeMap))
					this.setValue(derivative, context)
				}
				return derivative
			}
			if(this.value === undefined) {
				return value
			}
			return this.value
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
			var original = this.copiedFrom.valueOf()
			var newCopiedFrom = deepCopy(this.valueOf(), original)
			if (this.copiedFrom.put) { // copiedFrom doesn't have to be a variable, it can be a plain object
				// assign it now
				this.copiedFrom.put(newCopiedFrom)
			}
			this.isDirty.put(false)
			this.onSave && this.onSave()
		},
		revert: function() {
			var original = this.copiedFrom.valueOf()
			this.put(deepCopy(original, this.derivativeMap.get(original), this.derivativeMap))
			this.isDirty.put(false)
		},
		updated: function() {
			this.isDirty.put(true)
			return Variable.prototype.updated.apply(this, arguments)
		}
	})
	return Copy
}))