define(['../util/lang', '../Variable'], function(lang, Variable){
	var DstoreVariable = lang.compose(Variable, function DstoreVariable(value){
		this.value = value
	},
	{
		gotValue: function(value, context) {
			value = Variable.prototype.gotValue.call(this, value, context)
			if (value && value.on){
				// if it an object that can deliver notifications through `on` events, we listen for that (like dstore collections)
				var variable = this
				var handle = value.on(['add','update','delete'], function(event) {
					variable.updated(event)
				})
				this.notifyingValue = {
					stopNotifies: handle.remove, // remove the listener when we unsubscribe
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