define(['./lang', './Context', './dom'], function(lang, Context, dom){
	var doc = document;
	var childTagForParent = {
		TABLE: 'tr td',
		TBODY: 'tr td',
		TR: 'td',
		UL: 'li',
		OL: 'li',
		SELECT: 'option'
	};
	var inputs = {
		INPUT: 1,
		TEXTAREA: 1,
		SELECT: 1
	};

	function ElementBinding(){
	}

	ElementBinding.prototype = {
		to: function(variable){
			this.target = variable;
			variable.dependencyOf(this);
		},
		render: function(element){
			var target = this.target;
			var value = this.target.valueOf(new Context(this.rule, element));

			if(!element._generatedChildren &&
					value && value.then && element.tagName !== 'INPUT'){
				try{
					element.appendChild(doc.createTextNode('Loading'));
				}catch(e){
					// IE can fail on appending text for some elements,
					// TODO: we might want to only try/catch for IE, for performance
				}
			}
			var rule = this.rule;
			var elementVariable = this;
			lang.when(value, function(value){
				if(element._generatedChildren){
					element.content = value;
					root.definitions.content.invalidate({elements: [element]});
				}else{
					cleanup(element);
					if(element.childNodes.length){
						// clear out any existing content
						element.innerHTML = '';
					}
					if(value && value.sort){
						elementVariable.renderArray(value, element);
					}else if(value && value.nodeType){
						element.appendChild(value);
					}else{
						value = value === undefined ? '' : value;
						if(element.tagName in inputs){
							// set the text
							if(element.type === 'checkbox'){
								element.checked = value;
							}else{
								element.value = value;
							}
							if(!rule._inputConnected){
								rule._inputConnected = true;
								dom.addInputConnector(rule, target);
							}
						}else{
							// render plain text
							element.appendChild(doc.createTextNode(value));
						}
					}
				}
			});

		}
	};
	var RuleBinding = lang.compose(ElementBinding, function(rule){
		this.rule = rule;
	}, {
		invalidate: function(context){
			var elementsToRerender;
			var selector = this.rule.selector;
			if(context){
				var element = context.get('element');
				if(dom.matchesRule(element, this.rule)){
					elementsToRerender = [element];
				}else{
					elementsToRerender = element.querySelectorAll(selector);
				}
			}else{
				elementsToRerender = document.querySelectorAll(selector);
			}
			for(var i = 0, l = elementsToRerender.length;i < l; i++){
				this.render(elementsToRerender[i]);
			}
		}
	});

	var RuleAttributeBinding = lang.compose(RuleBinding, function(rule, attributeName){
		this.rule = rule;
		this.attributeName = attributeName;
	}, {
		render: function(element){
			lang.when(this.target.valueOf(new Context(this.rule, element)), function(value){
				element.setAttribute(name, value);
			});

		}
	});


	function cleanup(element, destroy){
		if(element.xcleanup){
			element.xcleanup(destroy);
		}
		var descendants = element.getElementsByTagName('*');
		for(var i = 0, l = descendants.length; i < l; i++){
			var descendant = descendants[i];
			descendant.xcleanup && descendant.xcleanup(true);
		}
	}
	return {
		ElementBinding: ElementBinding,
		RuleBinding: RuleBinding,
		RuleAttributeBinding: RuleAttributeBinding
	};
});