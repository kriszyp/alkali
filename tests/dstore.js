define([
	'../Variable',
	'../extensions/dstore',
	'dstore/Memory',
	'intern!object',
	'intern/chai!assert'
], function (Variable, dstore, Memory, registerSuite, assert) {
	var DstoreVariable = dstore.DstoreVariable
	function MockStore() {
		this.handlers = []
		this.on = function(events, f) {
			this.handlers.push(f)
			var that = this
			return {
				remove: function() {
					that.handlers = that.handlers.filter(function(h) { return h !== f })
				}
			}
		}
	}
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
			count.notifies({
				updated: function(updateEvent) {
					lastCountUpdate = updateEvent
				}
			})

			assert.strictEqual(count.valueOf(), 3)
			store.add({id: 4, name: 'four'})
			assert.strictEqual(count.valueOf(), 4)
			assert.strictEqual(lastCountUpdate.type, 'refresh')
			lastCountUpdate = null
			store.remove(2)
			assert.strictEqual(count.valueOf(), 3)
			assert.strictEqual(lastCountUpdate.type, 'refresh')
			lastCountUpdate = null
			store.put({id: 4, name: 'FOUR'})
			assert.strictEqual(count.valueOf(), 3)			
			assert.strictEqual(lastCountUpdate.type, 'refresh')
		},
		resolveDStoreAsyncPromise: function() {
			var store = new Memory({
				data: [
					{id: 1, name: 'one'},
					{id: 2, name: 'two'},
					{id: 3, name: 'three'}
				]
			})
			//var storeVar = new DstoreVariable(store)
			var storeVar = new Variable(store)
			var result = []
			storeVar.forEach(function(item){
				result.push({i: item.id, n: item.name})
			})
			assert.deepEqual(result, [{i:1,n:'one'},{i:2,n:'two'},{i:3,n:'three'}])
		},
		listenerRemovedWhenVariableChanged: function() {
			var m1 = new MockStore()
			var m2 = new MockStore()
			assert.equal(m1.handlers.length, 0)
			assert.equal(m2.handlers.length, 0)
			var storeVar = new DstoreVariable()
			storeVar.put(m1)
			storeVar.valueOf()
			assert.equal(m1.handlers.length, 1)
			assert.equal(m2.handlers.length, 0)
			storeVar.put(m2)
			storeVar.valueOf()
			assert.equal(m1.handlers.length, 0)
			assert.equal(m2.handlers.length, 1)
		},
		listenerRegistrationIdempotent: function() {
			var m1 = new MockStore()
			var m2 = new MockStore()
			assert.equal(m1.handlers.length, 0)
			assert.equal(m2.handlers.length, 0)
			var storeVar = new DstoreVariable()
			storeVar.put(m1)
			storeVar.valueOf()
			assert.equal(m1.handlers.length, 1)
			storeVar.valueOf()
			assert.equal(m1.handlers.length, 1)
			storeVar.put(m1)
			storeVar.valueOf()
			assert.equal(m1.handlers.length, 1)
			storeVar.put(m2)
			storeVar.valueOf()
			assert.equal(m1.handlers.length, 0)
			assert.equal(m2.handlers.length, 1)
			// put seen m1 again
			storeVar.put(m1)
			storeVar.valueOf()
			assert.equal(m1.handlers.length, 1)
			assert.equal(m2.handlers.length, 0)
		}
	})
})