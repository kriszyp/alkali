(function (root, factory) { if (typeof define === 'function' && define.amd) {
	define(['./Variable'], factory) } else if (typeof module === 'object' && module.exports) {        
  module.exports = factory(require('./Variable')) // Node
}}(this, function (VariableExports) {

	var deny = VariableExports.deny;
	var VBoolean = VariableExports.VBoolean
	var VNumber = VariableExports.VNumber
	var operatingFunctions = {};
	var operators = {};
	function getOperatingFunction(expression){
		// jshint evil: true
		return operatingFunctions[expression] ||
			(operatingFunctions[expression] =
				new Function('a', 'b', 'deny', 'return ' + expression));
	}
	function operator(operator, type, name, precedence, forward, reverseA, reverseB){
		// defines the standard operators
		var reverse = function(output, inputs){
			var a = inputs[0],
				b = inputs[1];
			if(a && a.put){
				var result = reverseA(output, b && b.valueOf());
				if(result !== deny){
					a.put(result);
				}
			}else if(b && b.put){
				b.put(reverseB(output, a && a.valueOf()));
			}else{
				return deny;
			}
		};
		// define a function that can lazily ensure the operating function
		// is available
		var operatorHandler = {
			apply: function(instance, args){
				forward = getOperatingFunction(forward);
				reverseA = reverseA && getOperatingFunction(reverseA);
				reverseB = reverseB && getOperatingFunction(reverseB);
				forward.reverse = reverse;
				operators[operator] = operatorHandler = new VariableExports.Variable(forward);

				addFlags(operatorHandler);
				args = Array.prototype.slice.call(args);
				args.push(deny)
				return operatorHandler.apply(instance, args);
			}
		};
		function addFlags(operatorHandler){
			operatorHandler.precedence = precedence;
			operatorHandler.infix = reverseB !== false;
		}
		addFlags(operatorHandler);
		operators[operator] = operatorHandler;
		operators[name] = function() {
			var result = operatorHandler.apply(null, arguments)
			return type ? result.as(type) : result
		}
	}
	// using order precedence from:
	// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Operator_Precedence
	operator('+', VNumber, 'add', 6, 'a+b', 'a-b', 'a-b');
	operator('-', VNumber, 'subtract', 6, 'a-b', 'a+b', 'b-a');
	operator('*', VNumber, 'multiply', 5, 'a*b', 'a/b', 'a/b');
	operator('/', VNumber, 'divide', 5, 'a/b', 'a*b', 'b/a');
//	operator('^', 7, 'a^b', 'a^(-b)', 'Math.log(a)/Math.log(b)');
	operator('?', null, 'if', 16, 'b[a?0:1]', 'a===b[0]||(a===b[1]?false:deny)', '[a,b]');
	operator(':', null, 'choose', 15, '[a,b]', 'a[0]?a[1]:deny', 'a[1]');
	operator('!', VBoolean, 'not', 4, '!a', '!a', false);
	operator('%', VNumber, 'remainder', 5, 'a%b');
	operator('>', VBoolean, 'greater', 8, 'a>b');
	operator('>=', VBoolean, 'greaterOrEqual', 8, 'a>=b');
	operator('<', VBoolean, 'less', 8, 'a<b');
	operator('<=', VBoolean, 'lessOrEqual', 8, 'a<=b');
	operator('===', VBoolean, 'strictEqual', 9, 'a===b');
	operator('==', VBoolean, 'equal', 9, 'a==b');
	operator('&', VBoolean, 'and', 8, 'a&&b');
	operator('|', VBoolean, 'or', 8, 'a||b');
	operator('round', 'round', 8, 'Math.round(a*Math.pow(10,b||1))/Math.pow(10,b||1)', 'a', 'a');
	return operators;
}))