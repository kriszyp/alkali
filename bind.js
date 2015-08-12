define([], function () {
	return function (variable, target, method, name) {
		function setValue() {
			target[method](name, variable.valueOf(new Context(target)));
		}
		variable.dependencyOf({
			invalidate: function () {
				setValue();
			}
		});
		setValue();
	};
});