define([
	'../Variable',
	'../dstore',
	'dstore/Memory',
	'intern!object',
	'intern/chai!assert',
	'./has!promise?:bluebird/js/browser/bluebird'
], function (Variable, dstore, Memory, registerSuite, assert, bluebird) {
	var DstoreVariable = dstore.DstoreVariable
	registerSuite({
		name: 'dstore',
		dstoreUpdates: function() {
			var store = new Memory({
				data: [
					{id: 1, name: 'one'},
					{id: 2, name: 'two'},
					{id: 3, name: 'three'}
				]
			})
			// wrap an existing variable just to make sure we get flow through
			var array = new DstoreVariable(new Variable(store))
			var count = array.to(function(){
				return store.fetchSync().length
			})
			var lastCountUpdate
			count.subscribe({
				updated: function(updateEvent) {
					lastCountUpdate = updateEvent
				}
			})

			assert.strictEqual(count.valueOf(), 3)
			store.add({id: 4, name: 'four'})
			assert.strictEqual(count.valueOf(), 4)
			assert.deepEqual(lastCountUpdate, {type: 'refresh'})
			lastCountUpdate = null
			store.remove(2)
			assert.strictEqual(count.valueOf(), 3)
			assert.deepEqual(lastCountUpdate, {type: 'refresh'})
			lastCountUpdate = null
			store.put({id: 4, name: 'FOUR'})
			assert.strictEqual(count.valueOf(), 3)			
			assert.deepEqual(lastCountUpdate, {type: 'refresh'})
		}
	})
})
