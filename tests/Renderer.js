define([
	'../Renderer',
	'../Variable',
	'intern!object',
	'intern/chai!assert',
	'bluebird/js/browser/bluebird'
], function (Renderer, Variable, registerSuite, assert, Promise) {
	var div = document.createElement('div');
	registerSuite({
		name: 'Renderer',
		PropertyRenderer: function () {
			document.body.appendChild(div);
			var variable = new Variable('start');
			var renderer = new Renderer.PropertyRenderer({
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
					Renderer.onShowElement(div); // now it should be shown and updated
					return new Promise(requestAnimationFrame).then(function(){
						assert.equal(div.title, 'third');
					});
				});
			});
		},
		ContentRenderer: function () {
			document.body.appendChild(div);
			var variable = new Variable('start');
			var renderer = new Renderer.ContentRenderer({
				variable: variable,
				element: div
			});
			assert.equal(div.innerHTML, 'start');
			variable.put('next');
			return new Promise(requestAnimationFrame).then(function(){
				assert.equal(div.innerHTML, 'next');
			});
		},
		PromisedUpdate: function () {
			var resolvePromise;
			var promise = new Promise(function(resolve){
				resolvePromise = resolve;
			});
			var variable = new Variable(promise);
			var renderer = new Renderer.PropertyRenderer({
				variable: variable,
				element: div,
				renderUpdate: function(value){
					assert.equal(value, 4);
				}
			});
			resolvePromise(4);

			return variable.valueOf().then(function() {
				return new Promise(requestAnimationFrame);
			});

		},
		getPropertyWithVariable: function() {
			var foo = new Variable('foo')
			var bar = new Variable({ foo: foo })
			var renderer = new Renderer.PropertyRenderer({
				variable: bar.property('foo'),
				element: div,
				name: 'foo'
			});
			return new Promise(requestAnimationFrame).then(function(){
				assert.equal(div.foo, 'foo')
			})
		},
		'transform with Renderer': function() {
			var state = new Variable({
				selection: []
			})
			var transformed = 0
			var data = new Variable(3).to(function(v) {
				transformed++
				return v + 1
			})
			var result = Variable.all([data, state.property('selection') ]).to(function(args) {
				return args[0] + args[1].length
			})
			var div = document.createElement('div')
			document.body.appendChild(div)
			var updated
			new Renderer.ElementRenderer({
				variable: result,
				element: div,
				renderUpdate: function() {
					updated = true
				}
			})
			return new Promise(requestAnimationFrame).then(function(){
				assert.equal(transformed, 1)
				state.set('selection', ['a'])
				return new Promise(requestAnimationFrame).then(function(){
					assert.equal(transformed, 1)
				})
			})
		},
		RendererInvalidation: function() {
			document.body.appendChild(div);
			var outer = new Variable(false);
			var signal = new Variable();
			var arr = [1,2,3];
			var data = signal.to(function() { return arr; });
			var inner = data.to(function(a) { return a.map(function(o) { return o*2; }); });
			var derived = outer.to(function (o) {
				return inner.to(function(i){
					return [o, i];
				});
			});
			var valuesSeen = [];
			var renderer = new Renderer.ElementRenderer({
				variable: derived,
				element: div,
				renderUpdate: function (value) {
					valuesSeen.push(value);
				}
			});

			var INTERMEDIATE_ANIMATION_FRAME = false;
			var resolver = function(r){r();}; // resolve asynchronously without an animation frame
			// we expect the renderer to observe the inner array mutation regardless of the outer end state
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
					signal.updated();
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
