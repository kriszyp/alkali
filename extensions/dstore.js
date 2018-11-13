(function (root, factory) { if (typeof define === 'function' && define.amd) {
	define(['../util/lang', '../Variable'], factory) } else if (typeof module === 'object' && module.exports) {
  module.exports = factory(require('../util/lang'), require('../Variable')) // Node
}}(this, function (lang, VariableExports) {
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
				Promise.prototype.otherwise = Promise.prototype.catch // make otherwise available
				let promise = Promise.resolve(varray.slice(options.start, options.end))
				promise.totalLength = varray.then(function(array) {
					return array.length
				})
				return promise
			},
			on: function(eventType, listener) {
				var eventTypes = eventType.split('. ')
				var subscriber = {
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
				}
				varray.notifies(subscriber)
				return {
					remove: function() {
						varray.stopNotifies(subscriber)
					}
				}
			},
			track: function() {
				return this
			},
			sort: function(sortFunction) {
				return new VArrayDstore(varray.sort(sortFunction))
			},
			getIdentity: function(object) {
				return object.getId()
			}
		}
	}

	return {
		DstoreVariable: DstoreVariable,
		VArrayDstore: VArrayDstore
	}
}))
