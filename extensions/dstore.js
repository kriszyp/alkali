define(['../util/lang', '../Variable'], function(lang, Variable){
	var DstoreVariable = lang.compose(Variable, function DstoreVariable(value){
		this.value = value
	},
	{
		gotValue: function(value, context) {
			value = Variable.prototype.gotValue.call(this, value, context)
			if (value && value.on && !(this.seen || (this.seen = new Set())).has(value)){
				// if it an object that can deliver notifications through `on` events, we listen for that (like dstore collections)
				var variable = this
				var handle = value.on(['add','update','delete'], function(event) {
					event.visited = new Set()
					variable.updated(event)
				})
				var seen = this.seen.add(value)
				this.returnedVariable = {
					// remove the listener when we unsubscribe
					stopNotifies: function() {
						seen.delete(value)
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