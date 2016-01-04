The alkali metals are a set of elements known for being extremely reactive, conductive, and lightweight. The alkali library is a lightweight set of modules for accessing simple native JavaScript objects with modeling and reactivity capabilities. Alkali uses categorical models with contextualized calculations and caching, with an invalidation-based notification system. This makes it possible to build highly efficient and fast applications, with UI components driven by standard JavaScript objects using modern functionally reactive techniques, and without any large framework impositions.

There are several key paradigms in alkali:

## Variables

The central entity in the data model system is a "Variable" (this notion has variously been known by various names such as "reactive", "stream", "signal" and others). This object represents and holds a value that may change in the future. A variable can also be likened to a promise, except it can continue to change, rather than resolving one time. Depending on the interface, we can read the value, be notified when it has changed, change the value, and get meta and error information about the value.

Notifications of data changes are delivered by invalidation notifications. When a downstream subscriber is interested in the results of a variable change, it can request the lates value. Variables can employ internal caching of calculated values. Variables support bi-directional flow. They can be updated as well as monitored.

Variables also support promises as values, and the variable pipeline will handle waiting for a promises to resolve to do computations.

## Variable API

### valueOf(context?)

This returns the current value of the variable.

### put(value, context?)

This allows us to update the value of a variable with a new value. This can be given a standard value, or you can pass in another variable, in which case this variable will be "linked" to the other, receiving all values and updates from the provided variable.

If the `value` passed in is not different than the current value, no changes will be made and this will return `Variable.noChange`. If the value can be assigned (like a property of a `null` value), it will return `Variable.deny`.

### subscribe(listener)

This adds a listener for any changes to the variable. This will be called with an event object that has a `value()` method that can be called to get the current value. Generally it is preferred to propagate changes through Variables and Updaters, as they provide more efficient resource management.

### map(function)

This maps the value of the current variable to a new variable (that is returned), reflecting the current value of the variable (and any future changes) through the execution of the callback function. The callback function is called when the variable is changed and there is downstream interest in it, and is called with the value and should return a value to be used by the returned variable.

### notifies(dependentVariable)

This is called to indicate that the dependent variable is dependent on this variable, and will result in changes or invalidation on this variable to invalidate the provided dependent variable. If this variable changes, it will call the invalidate method on the dependent variable.

### stopNotifies(dependentVariable)

This stops the notifications to the dependent variable, undoing the action of `notifies`.

### invalidate(context?)

This should be called to indicate that the variable's current value is no longer valid, (it has changed or dependency values have changed), and it should return a new value from valueOf in the future.

### apply(instance, functionVariable)

This allows you to execute a function that is the value of a variable, with arguments that come from other variables, (and an instance variable) returning a new variable representing the return value of that function call. The returned variable's valueOf will return the return value of the function's execution. If the this variable, or the instance variable, or any of the argument variables become invalidated (change), than the returned variable will invalidated. The function can be re-executed with the changed values on the next call to valueOf.

### property(propertyName)

This returns a variable representing the property of the value of the variable. If this variable's value is an object, the property variable's value will be the value of the given property name. This variable will respond to changes in the object, and putting a value in property variable will update the corresponding property on the parent object.

### fixed

This property can be set to true, when a variable holds another variable (acting as proxy), so that subsequent `put()` will not replace the contained variable, but will put in it.

## Updaters

Updaters are the central mechanism for making UI components react to data changes. Updaters allow us to add reactive capabilities to existing components with minimal change. Updaters are given a variable to respond to, an element (or set of elements) to attach to, and rendering functionality to perform. When an updater's variable changes, it will queue the rendering functionality, and render the change in the next rendering frame, if the element is still visible. The `Updater` module includes several specific updaters, for updating attributes and the text of an element. The following Updaters are available from `alkali/Updater`:

Updater - This should be constructed with an options object that defines the source `variable`, the associated DOM `element`, and an `renderUpdate` method that will perform the rerender with the latest value from the variable.

Updater.AttributeUpdater - This perform updates on an element's attribute. This should be constructed with an options object that defines the source `variable`, the associated DOM `element`, and the `name` of the attribute to be updated when the variable changes.

Updater.ContentUpdater - This perform updates on an element's text content. This should be constructed with an options object that defines the source `variable` and the associated DOM `element` to be updated when the variable changes.

 For example, we could create a simple variable:

	var Variable = require('alkali/Variable');

	var greeting = new Variable('Hi');

And then define an updater:

	var AttributeUpdater = require('alkali/Updater').AttributeUpdater;
	new AttributeUpdater({
			variable: myNumber,
			element: someElement,
			name: 'title' // update the title attribute with the variable value
		})

This will immediately assign the string 'Hi' to the title attribute of the element. If later we change the variable:

	greeting.put('Hello World');

This will schedule an update to the title. However, we change the variable again before the rendering phase (usually through `requestAnimationFrame`), we do not have to worry about multiple renderings taking place, it will simply render once, with the latest value.

We can also create custom updaters:

	var greeting = new Variable('Hi');
	new Updater({
			variable: myNumber,
			element: someElement,
			renderUpdate: function (newValue) {
				element.innerHTML = newValue + '.';
			}
		})

An Updater will only update an element if it is visible, and will mark it as needing rerendering. If a hidden element is made visible again, you can trigger the rerendering by calling `Updater.onShowElement(element)` on a parent element. You can also provide a custom definition for what constitutes a visible element that should be immediately rendered by defining a `shouldRender(element)` method, which should return true or false indicating if the element needs to be rendered.

Alternately, you may set `alwaysUpdate` to true on the Updater options to force the Updater to always render in response to changes.

If your variables use promises, alkali will wait for the promise to resolve before calling `renderUpdate` (and it will be called with the resolution of the promise). You may define a `renderLoading` to render something while a promise is waiting to be resolved.

## Data Objects

Data objects are plain JS objects: Variables can be used on their own, or the Variable interface is designed to provide an enhanced interface to objects without requiring any special properties or prototypes on the data objects themselves. Objects can be used in conjunction with property variables to receive notification of object changes using the consistent variable interface. To actively monitor an object for property changes (direct assignment of properties outside of alkali), you can `observe` the object. For example:

	var myObject = {name: 'simple property'};
	var myVariable = new Variable(myObject);
	// actively observe this object
	Variable.observe(myObject);
	var nameProperty = myVariable.property('name');

	nameProperty.subscribe(function (event) {
		console.log('name change', event.value())
	});

	myObject.name = 'new name'; // this will trigger a change on the nameProperty


## Contextualization

The computations (and invalidations) can be all be executed with an optional context, which effectively allows variables to be parameterized. This means that a given variable does not have to be used to only represent a single value, but the variable may be used to represent set of different variables depending on their context. This also facilitates the construction of very powerful caching mechanisms that can intelligently cache based on determining which parameters may lead to different results.

## Variable Copies

Alkali includes a variable Copy constructor, that allows you to maintain a copy of an object from another variable. Variable copies are very useful in situations where you want to reactively create a working copy of any object to edit and change, and potentially later save those changes back to the original object. For example, you may want to select an object to open in a form, and allow changes to be made in form. By using a working copy, the form edits can automatically be mapped to the object, but not committed back to the original object until later:

	var selectedObject = new Variable(); // this will be set to the currently selected object
	var workingCopy = new Copy(selectedObject); // holds a copy of each object contained in selectedObject
	var myForm = new MyForm({
		variable: workingCopy // we can pass this to a form, with changing the original object
	});
	myForm.on('submit', function() {
		workingCopy.save(); // now save the changes back to the original object
	})




# Design Philosophy

 This has several key architectural advantages:
* Getting values from a variable always (new or original) always goes through the same code path.
* Caching avoids unnecessary computations
* Getting values and performing computations based on changes is not performed until needed (lazy, on-demand).
* Deduplication of messages is handled by the top level of dependency layer, the UI layer. When elements are invalidated, multiple invalidation don't need to trigger recomputations. The alkali UI handler can schedule rendering invalidated portions once a rendering phase each reached (the same way repainting works in the browser).
Hidden components can use invalidation information to determine if they need to re-render anything next time they are shown, without having to immediately recompute or re-render anything.
Caching can be performed safely because dependencies and the cache can be invalidated once any dependencies invalidate.
These advantages are explained in more depth here:
http://kriszyp.name/2015/01/13/reactivity-and-caching/

The two phase rendering approach of alkali is described here:
http://kriszyp.name/2015/11/25/rendering-efficiently-with-two-phase-ui-updates/

## License
Alkali is freely available under *either* the terms of the modified BSD license *or* the
Academic Free License version 2.1. More details can be found in the [LICENSE](LICENSE).
The alkali project follows the IP guidelines of Dojo foundation packages and all contributions require a Dojo CLA. 
