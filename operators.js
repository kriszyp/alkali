define(['./Variable'],
		function(Variable){
	var deny = Variable.deny;
	var operatingFunctions = {};
	var operators = {};
	function getOperatingFunction(expression){
		// jshint evil: true
		return operatingFunctions[expression] ||
			(operatingFunctions[expression] =
				new Function('a', 'b', 'return ' + expression));
	}
	function operator(operator, precedence, forward, reverseA, reverseB){
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
				var operatorReactive;
				forward = getOperatingFunction(forward);
				reverseA = reverseA && getOperatingFunction(reverseA);
				reverseB = reverseB && getOperatingFunction(reverseB);
				forward.reverse = reverse;
				operators[operator] = operatorReactive = new Variable(forward);

				addFlags(operatorReactive);
				return operatorReactive.apply(instance, args);
			}
		};
		function addFlags(operatorHandler){
			operatorHandler.precedence = precedence;
			operatorHandler.infix = reverseB !== false;
		}
		addFlags(operatorHandler);
		operators[operator] = operatorHandler;
	}
	// using order precedence from:
	// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Operator_Precedence
	operator('+', 6, 'a+b', 'a-b', 'a-b');
	operator('-', 6, 'a-b', 'a+b', 'b-a');
	operator('*', 5, 'a*b', 'a/b', 'a/b');
	operator('/', 5, 'a/b', 'a*b', 'b/a');
//	operator('^', 7, 'a^b', 'a^(-b)', 'Math.log(a)/Math.log(b)');
	operator('?', 16, 'b[a?0:1]', 'a===b[0]||(a===b[1]?false:deny)', '[a,b]');
	operator(':', 15, '[a,b]', 'a[0]?a[1]:deny', 'a[1]');
	operator('!', 4, '!a', '!a', false);
	operator('%', 5, 'a%b');
	operator('>', 8, 'a>b');
	operator('>=', 8, 'a>=b');
	operator('<', 8, 'a<b');
	operator('<=', 8, 'a<=b');
	operator('==', 9, 'a===b');
	operator('&', 8, 'a&&b');
	operator('|', 8, 'a||b');
	return operators;
});