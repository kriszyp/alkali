define(['./lang', './Context'], function(lang, Context){
	// using delegation, listen for any input changes in the document and 'put' the value  
	// TODO: add a hook so one could add support for IE8, or maybe this event delegation isn't really that useful
	var doc = document;
	var nextId = 1;
	var hasAddEventListener = !!doc.addEventListener;
	// selection of default children for given elements
	var needsCapture = {
		blur: 'focusout',
		focus: 'focusin'
	};
	on(doc, 'change', null, inputChanged);
	// IE doesn't change on enter, and there isn't really any feature to detect to demonstrate that
	if (navigator.userAgent.match(/MSIE|Trident/)){
		on(doc, 'keydown', null, function(event){
			if(event.keyCode == 13){
				var element = event.target;
				if(document.createEvent){
					event = document.createEvent('Events');
					event.initEvent('change', true, true);
					element.dispatchEvent(event);
				}else{
					document.onchange({target: element});
				}
			}
		});
	}
	function inputChanged(event){
		var element = event.target;
		// get the variable computation so we can put the value
		for(var i = 0, l = inputConnectors.length; i < l; i++){
			var inputConnector = inputConnectors[i];
			// we could alternately use the matchesRule
			if((' ' + element.className + ' ').indexOf(inputConnector.rule.selector.slice(1)) > -1){
				var variable = inputConnector.variable;
				var context = new Context(inputConnector.rule.parent, element);
				var currentValue = variable.valueOf(context);
				var oldType = typeof currentValue;
				var value = element.type === 'checkbox' ? element.checked : element.value;
				// do type coercion
				if(oldType === 'number' && isFinite(value)){
					value = +value;
				}
				var result = variable.put(value, context);
				// TODO: should we return here, now that we found a match?
			}
		}
	}
/*	sometime we might reimplement this, but for now just relying on dojo/on
right now, the main thing missing from this on implementation is the ability
to do capture
Have considered doing class name comparison, but any advantage is iffy:
http://jsperf.com/matches-vs-classname-check
*/
	function on(target, type, rule, listener){
		// this function can be overriden to provide better event handling
		hasAddEventListener ?
			target.addEventListener(type, select, !!needsCapture[type]) :
			ieListen(target, needsCapture[type] || type, select);
		function select(event){
			// do event delegation
			if(!rule){
				return listener(event);
			}
			var element = event.target;
			do{
				if(matchesRule(element, rule)){
					return listener(event);
				}
			}while((element = element.parentNode) && element.nodeType === 1);
		}
	}
	function ieListen(target, type, listener){
		type = 'on' + type;
		var previousListener = target[type];
		target[type] = function(event){
			event = event || window.event;
			event.target = event.target || event.srcElement;
			if(previousListener){
				previousListener(event);
			}
			listener(event);
		};
	}

	// elemental section, this code is for property handlers that need to mutate the DOM for elements
	// that match it's rule
	var testDiv = doc.createElement('div');
	// get the matches function, whatever it is called in this browser	
	var matchesSelector = testDiv.matches || testDiv.matchesSelector ||
		testDiv.webkitMatchesSelector || testDiv.mozMatchesSelector ||
		testDiv.msMatchesSelector || testDiv.oMatchesSelector;
	var inputConnectors = [];


	function addInputConnector(rule, variable){
		inputConnectors.push({
			rule: rule,
			variable: variable
		});
	}

	var matchesRule = matchesSelector?
		function(element, rule){
			// use matchesSelector if available
			return matchesSelector.call(element, rule.selector);
		} :
		function(element, rule){
			// so we can match this rule by checking inherited styles
			if(!rule.ieId){
				rule.setStyle(rule.ieId = ('x-ie-' + nextId++), 'true');
			}
			// use IE's custom css property inheritance mechanism
			// TODO: determine if it is higher specificity that other  same name properties
			return !!element.currentStyle[rule.ieId];
		};

	return {
		on: on,
		matchesRule: matchesRule,
		addInputConnector: addInputConnector
	};
});