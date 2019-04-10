var async_hooks = require('async_hooks');
var Variable = require('../Variable')

var contexts = []
var previousContext
const alkaliAsyncHook = async_hooks.createHook({
	init(asyncId, type, triggerAsyncId) {
    	contexts[asyncId] = Variable.currentContext
    },
    before(asyncId) {
    	previousContext = Variable.currentContext
    	Variable.currentContext = contexts[asyncId]
    },
    after(asyncId) {
    	previousContext = Variable.currentContext
    },
    destroy(asyncId) {
    	delete contexts[asyncId]
    } 
})
module.exports = alkaliAsyncHook