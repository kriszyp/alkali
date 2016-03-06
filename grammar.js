define(['./Variable', './lang'],
		function(Variable, lang){
	/*new Grammar([
		'string',
		{
			default: ' ',
			pattern: /\s+/
		},
		{
			variable: amount,
			pattern: /\d+/
		},
		or([

		]),
		zeroOrMore([]), oneOrMore([]), optional([])
	*/
	function serialize(ast, optional) {
		if (ast instanceof Array) {
			return ast.map(serialize).join('')
		}
		if (typeof ast === 'string') {
			return ast
		}
		if (ast.variable) {
			return ast.variable.valueOf() + ''
		}
		if (ast.default) {
			return ast.default
		}
	}
	function parse(string, ast) {
		var extraCharacters = parsePart(string, ast)
		if (extraCharacters) {
			throw new SyntaxError('Unexpected characters ' + extraCharacters)
		}
	}
	function parseParse(string, ast) {
		if (typeof ast === 'string') {
			if (string.slice(0, ast.length) === ast) {
				return string.slice(ast.length)
			}
		}
	}
})
