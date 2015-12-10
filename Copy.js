define(['./Variable', './lang'],
		function(Variable, lang){

	function deepCopy(source) {
		if(source && typeof source == 'object'){
			if(source instanceof Array){
				var target = [];
				for(var i = 0, l = source.length; i < l; i++){
					target[i] = deepCopy(source[i]);
				}
			}else{
				var target = {};
				for(var i in source){
					target[i] = deepCopy(source[i]);
				}
			}
			return target;
		}
		return source;
	}
	return lang.compose(Variable, function(copiedFrom){
		// this is the variable that we derive from
		this.copiedFrom = copiedFrom;
		this.map = new lang.WeakMap(null, 'derivative');
	}, {
		valueOf: function(context){
			if(this.state){
				this.state = null;
			}
			var value = this.copiedFrom.valueOf(context);
			if(value && typeof value == 'object'){
				var derivative = this.map.get(value);
				if (derivative == null){
					this.map.set(value, derivative = deepCopy(value));
				}
				return derivative;
			}
			var thisValue = this.getValue(context);
			if(thisValue === undefined){
				return value;
			}
			return thisValue;
		},
		save: function(){
			// TODO: copy instead?
			this.copiedFrom.put(this.valueOf());
		}
	});
});