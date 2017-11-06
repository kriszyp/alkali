define(['../util/lang', '../Variable'], function(lang, VariableExports){
	var Variable = VariableExports.Variable
	var DstoreVariable = lang.compose(Variable, function DstoreVariable(value){
		this.value = value
	},
	{
		gotValue: function(value, context) {
			value = Variable.prototype.gotValue.call(this, value, context)
			if (value && value.on && !(this._lastDSValue === value)){
				// if it an object that can deliver notifications through `on` events, we listen for that (like dstore collections)
				var variable = this
				if (this._lastHandle) {
					this._lastHandle.remove()
				}
				var handle = this._lastHandle = value.on(['add','update','delete'], function(event) {
					event.visited = new Set()
					variable.updated(event)
				})
				this._lastDSValue = value
				this.returnedVariable = {
					// remove the listener when we unsubscribe
					stopNotifies: function() {
						variable._lastDSValue = undefined
						handle.remove()
					},
					notifies: function(){}
				}
			}
			return value
		}
	})

	return {
		DstoreVariable: DstoreVariable
	}
})
