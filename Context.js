define([],
		function(){
	// a simple context object class
	function Context(rule, element){
		this.rule = rule;
		if(element){
			this.element = element;
		}
	}
	Context.prototype = {
		get: function(name, select){
			var value = this[name];
			// allow for selecting a more generic value
			return select ? select(value) : value;
		}
	};
	return Context;
});