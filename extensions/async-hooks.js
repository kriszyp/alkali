var async_hooks = require('async_hooks');
var Variable = require('../Variable')

var contexts = []
//global.asyncEvents = []
var previousContext
module.exports.enable = () => {
	const alkaliAsyncHook = async_hooks.createHook({
		init(asyncId, type, triggerAsyncId, resource) {
			if (type === 'PROMISE') {// might also do Timeout
				if (resource.isChainedPromise) {
					let context = Variable.currentContext
					if (context) {
				    	contexts[asyncId] = context
//				    	global.asyncEvents[asyncId] = [type + 'init ' + new Error().stack, context]
				    }
				}
			}
	    },
	    before(asyncId) {
	    	previousContext = Variable.currentContext
	    	// we could potentially throw an error if there is an existing previousContext, since there should not be a global context
	    	Variable.currentContext = contexts[asyncId];
//	    	(global.asyncEvents[asyncId] || (global.asyncEvents[asyncId] = [])).push('before', previousContext)
	    },
	    after(asyncId) {
	    	Variable.currentContext = undefined
	    	delete contexts[asyncId]
//	    	delete global.asyncEvents[asyncId]
	    },
	    destroy(asyncId) {
	    	delete contexts[asyncId]
//	    	delete global.asyncEvents[asyncId]
	    }
	})
	alkaliAsyncHook.enable()
}
