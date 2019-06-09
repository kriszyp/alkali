define([
	'../Renderer',
	'../Variable',
	'../util/lang',
	'bluebird/js/browser/bluebird'
], function (Renderer, VariableExports, lang, Promise) {
	var Variable = VariableExports.Variable
	var div = document.createElement('div');
	var requestAnimationFrame = lang.requestAnimationFrame
	suite('Renderer', function() {
		test('PropertyRenderer', function() {
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
		})
		test('ContentRenderer', function() {
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
		})
		test('TextRenderer', function() {
			var div = document.createElement('div')
			var textNode = div.appendChild(document.createTextNode(''))
			document.body.appendChild(div);
			var variable = new Variable('start');
			var renderer = new Renderer.TextRenderer({
				variable: variable,
				element: div,
				textNode: textNode
			});
			assert.equal(div.innerHTML, 'start');
			variable.put('next');
			return new Promise(requestAnimationFrame).then(function(){
				assert.equal(div.innerHTML, 'next');
			});
		})
		test('PromisedUpdate', function() {
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

			return variable.then(function() {
				return new Promise(requestAnimationFrame);
			});

		})
		test('getPropertyWithVariable', function() {
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
		})
		test('transform with Renderer', function() {
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
		})
		test('Renderer with complex transform', function() {

	    var data = new Variable([{
	      id: 1,
	      group: 1,
	      text: 'foo'
	    }, {
	      id: 2,
	      group: 1,
	      text: 'bar'
	    }, {
	      id: 3,
	      group: 2,
	      text: 'baz'
	    }])

	    var count = 0

	    var transformedData = data.to(function(data) {
	      count++
	      if (count > 1) {
	      	throw new Error('Not cached properly')
	      }
	      return {
	        data: data.map(function(datum){
	        	return lang.copy({}, datum)
	        }),
	        otherStuff: 'lolwut',
	      }
	    })

	    var state = new Variable({
	      selection: {}
	    })

	    var selectedGroups = Variable.all([
	      state.property('selection'),
	      transformedData.property('data')
	    ], function(selection, data) {
	      return data.reduce(function(memo, datum) {
	        if (selection[datum.id]) {
	          memo[datum.group] = true
	        }

	        return memo
	      }, {})
	    })

			var div = document.createElement('div')
			document.body.appendChild(div)
			var updated

	    new Renderer.ElementRenderer({
	      variable: selectedGroups,
	      element: div,
	      renderUpdate: function(selectedGroups) {
	        console.log('selectedGroups', selectedGroups)
	        console.log('this.count === 1?', count === 1)
	      }
	    })

	    setTimeout(function() { state.set('selection', { 1: true }) }, 10)
	    setTimeout(function() { state.set('selection', { 1: true, 2: true }) }, 50)
	    return new Promise(function(resolve, reject) {
		    setTimeout(function() {
		    	state.set('selection', { 3: true })
			    resolve()
		    }, 100)
	    })
		})

		test('RendererInvalidation', function() {
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
		})
	});
});
