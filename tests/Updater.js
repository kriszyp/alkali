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
		},
		UpdaterInvalidation: function() {
			document.body.appendChild(div);
			var outer = new Variable(false);
			var signal = new Variable();
			var arr = [1,2,3];
			var data = signal.map(function() { return arr; });
			var inner = data.map(function(a) { return a.map(function(o) { return o*2; }); });
			var derived = outer.map(function (o) {
				return inner.map(function(i){
					return [o, i];
				});
			});
			var valuesSeen = [];
			var updater = new Updater.ElementUpdater({
				variable: derived,
				element: div,
				renderUpdate: function (value) {
					valuesSeen.push(value);
				}
			});

			var INTERMEDIATE_ANIMATION_FRAME = false;
			var resolver = function(r){r();}; // resolve asynchronously without an animation frame
			// we expect the updater to observe the inner array mutation regardless of the outer end state
			var firstResult = [false, [2,4,6]];
			var lastResult = [false, [8,10,12]];
			var expected = [firstResult,lastResult];

			if (INTERMEDIATE_ANIMATION_FRAME) {
			  // request an intermediate animation frame
			  resolver = requestAnimationFrame;
			  // the intermediate frame observes the outer state change
			  expected = [firstResult, [true,[2,4,6]], lastResult]
			}

			return new Promise(requestAnimationFrame).then(function(){
				// confirm the initial state
				assert.deepEqual(valuesSeen, [firstResult]);
				// processing
				outer.put(true);
				// simulate an async task
				return new Promise(resolver).then(function() {
					// do some "work"
					arr = [4,5,6];
					// invalidate the data signal
					signal.invalidate();
				}).then(function() {
					// done processing
					outer.put(false);

					// UI should now reflect changes to data array

					return new Promise(requestAnimationFrame).then(function() {
						assert.deepEqual(valuesSeen, expected);
					});
				});
			});
		}
	});
});
