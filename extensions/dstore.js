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
		},
		forEach: function(callback) {
			this.valueOf().forEach(callback)
		}
	})

	function VArrayDstore(varray) {
		return {
			fetchRange: function(options) {
				return Promise.resolve(varray.slice(options.start, options.end))
			},
			on: function(eventType, listener) {
				var eventTypes = eventType.split('. ')
				varray.notifies({
					updated: function(event) {
						if (event.type === 'entry') {
							if (eventType.includes('update')) {
								var value = event.value
								var index = varray.valueOf().indexOf(value)
								listener({
									index: index,
									previousIndex: index,
									target: value
								})
							}
						}
						if (event.type === 'spliced') {

						}
					}
				})
			},
			track: function() {
				return this
			},
			sort: function(sortFunction) {
				return new VArrayDStore(varray.sort(sortFunction))
			},
			getIdentity(object) {
				return object.getId()
			}
		}
	}

	return {
		DstoreVariable: DstoreVariable,
		VArrayDstore: VArrayDstore
	}
})
