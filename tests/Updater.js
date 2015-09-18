define([
	'../Updater',
	'../Variable',
	'intern!object',
	'intern/chai!assert'
], function (Updater, Variable, registerSuite, assert) {
	var div = document.createElement('div');
	registerSuite({
		name: 'Updater',
		PropertyUpdater: function () {
			document.body.appendChild(div);
			var variable = new Variable('start');
			var updater = new Updater.PropertyUpdater({
				variable: variable,
				element: div,
				name: 'title'
			});
			assert.equal(div.title, 'start');
			variable.put('second');
			return new Promise(requestAnimationFrame).then(function(){
				assert.equal(div.title, 'second');
				document.body.removeChild(div);
				// now the change should not affect it
				variable.put('third');
				return new Promise(requestAnimationFrame).then(function(){
					assert.equal(div.title, 'second');
					document.body.appendChild(div);
					Updater.onShowElement(div); // now it should be shown and updated
					return new Promise(requestAnimationFrame).then(function(){
						assert.equal(div.title, 'third');
					});
				});
			});
		},
		ContentUpdater: function () {
			document.body.appendChild(div);
			var variable = new Variable('start');
			var updater = new Updater.ContentUpdater({
				variable: variable,
				element: div
			});
			assert.equal(div.innerHTML, 'start');
			variable.put('next');
			return new Promise(requestAnimationFrame).then(function(){
				assert.equal(div.innerHTML, 'next');
			});
		}


	});
});