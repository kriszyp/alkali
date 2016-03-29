define(['./Variable', './util/lang'],
		function(Variable, lang){

	function deepCopy(source, target, derivativeMap) {
		if(source && typeof source == 'object'){
			if(source instanceof Array){
				if(target instanceof Array){
					// truncate as necessary
					if (target.length > source.length) {
						target.splice(source.length, target.length - source.length)
					}
				} else {
					target = derivativeMap && derivativeMap.get(source)
					if (!target) {
						target = []
						derivativeMap && derivativeMap.set(source, target)
					}
				}
				for(var i = 0, l = source.length; i < l; i++){
					target[i] = deepCopy(source[i], target[i], derivativeMap)
				}
			}else {
				if (!target || typeof target !== 'object') {
					target = derivativeMap && derivativeMap.get(source)
					if (!target) {
						target = {}
						derivativeMap && derivativeMap.set(source, target)
					}
				}
				for(var i in source){
					target[i] = deepCopy(source[i], target[i], derivativeMap)
				}
			}
			return target
		}
		return source
	}

	var Copy = lang.compose(Variable, function(copiedFrom){
		// this is the variable that we derive from
		this.copiedFrom = copiedFrom
		this.derivativeMap = new lang.WeakMap(null, 'derivative')
		this.isDirty = new Variable(false)
	}, {
		valueOf: function(context){
			if(this.state){
				this.state = null
			}
			var value = this.copiedFrom.valueOf(context)
			if(value && typeof value == 'object'){
				var derivative = this.derivativeMap.get(value)
				if (derivative == null){
					this.derivativeMap.set(value, derivative = deepCopy(value, undefined, this.derivativeMap))
				}
				return derivative
			}
			var thisValue = this.getValue(context)
			if(thisValue === undefined){
				return value
			}
			return thisValue
		},
		getCopyOf: function(value){
			var derivative = this.derivativeMap.get(value)
			if (derivative == null){
				this.derivativeMap.set(value, derivative = deepCopy(value, undefined, this.derivativeMap))
			}
			return derivative
		},
		save: function(){
			// copy back to the original object
			var original = this.copiedFrom.valueOf()
			var newCopiedFrom = deepCopy(this.valueOf(), original)
			if (original !== newCopiedFrom) {
				// if we have replaced it with a new object/value, put it
				this.copiedFrom.put && this.copiedFrom.put(newCopiedFrom)
			} else {
				// else we have modified an existing object, but we still need to notify
				if (this.copiedFrom.notifies && this.copiedFrom.updated) { // copiedFrom doesn't have to be a variable, it can be a plain object
					this.copiedFrom.updated()
				}
			}
			this.isDirty.put(false)
			this.onSave && this.onSave()
		},
		revert: function(){
			var original = this.copiedFrom.valueOf()
			deepCopy(original, this.derivativeMap.get(value), this.derivativeMap)
			this.isDirty.put(false)
		},
		updated: function(){
			this.isDirty.put(true)
			return Variable.prototype.updated.apply(this, arguments)
		}
	})
	return Copy
});