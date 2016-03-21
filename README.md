The alkali metals are a set of elements known for being extremely reactive, conductive, and lightweight. The alkali library is a lightweight set of modules for accessing simple native JavaScript objects with modeling and reactivity capabilities, and creating reactive UIs based on native DOM elements. Alkali is designed to be for sped and scalability, using a true functional reactive, cache and invalidation-based system that provides optimized rendering performance. This makes it possible to build highly efficient and fast applications, with UI components driven by standard JavaScript objects using modern functionally reactive techniques, and without any large framework impositions.

There are several key paradigms in alkali:

## Variables

The central entity in the data model system is a "Variable" (this notion has variously been known by various names such as "reactive", "stream", "signal" and others). This object represents and holds a value that may change in the future. A variable can also be likened to a promise, except it can continue to change, rather than resolving one time. Depending on the interface, we can read the value, be notified when it has changed, change the value, and get meta and error information about the value.

Notifications of data changes are delivered by invalidation notifications. When a downstream subscriber is interested in the results of a variable change, it can request the lates value. This is subtly distinct from "streams", in that unnecessary computations can be avoided and optimized when only the current state (rather than the history of every intermediate change) is of interest. Variables can also employ internal caching of calculated values. Variables support bi-directional flow. They can be updated as well as monitored.

Variables also support promises as values, and the variable pipeline will handle waiting for a promises to resolve to do computations.

## Debugging/Interaction

[Litmus](https://github.com/kriszyp/litmus) is a project that provides a visual explorer/graph of alkali variables and data flow, that can assist with debugging and interaction with alkali data.

## Variable API

The Variable constructor is returned from the `alkali/Variable` module.

### Variable(initialValue)

This is the constructor for a variable. You may create a variable with an initial value, provided as the argument.

### valueOf(context?)

This returns the current value of the variable.

### put(value, context?)

This allows us to update the value of a variable with a new value. This can be given a standard value, or you can pass in another variable, in which case this variable will be "linked" to the other, receiving all values and updates from the provided variable.

If the `value` passed in is not different than the current value, no changes will be made and this will return `Variable.noChange`. If the value can be assigned (like a property of a `null` value), it will return `Variable.deny`.

### property(propertyName)

This returns a variable representing the property of the value of the variable. If this variable's value is an object, the property variable's value will be the value of the given property name. This variable will respond to changes in the object, and putting a value in property variable will update the corresponding property on the parent object.

### to(function)

This maps or transforms the value of the current variable to a new variable (that is returned), reflecting the current value of the variable (and any future changes) through the execution of the callback function. The callback function is called when the variable is changed and there is downstream interest in it, and is called with the value and should return a value to be used by the returned variable.

For example:
```
let number = new Variable(3)
number.valueOf() -> 3
let doubled = number.to((value) => value * 2)
doubled.valueOf() -> 6
number.put(5)
number.valueOf() -> 5
doubled.valueOf() -> 10
```

A `to` function can return variables as well, in which case you can effectively chain variables together, merging their changes. For example:
```
let a = new Variable(1)
let b = new Variable(2)
let sum = a.to((aValue) => {
	return b.to((bValue) => {
		return aValue + bValue;
	})
})
// sum will reactively update to changes in either a or b
```

### get(propertyName)

This returns the value of the named property. The following are functionally equivalent:

```
variable.property(name).valueOf() === variable.get(name)
```

### set(propertyName, value)

This sets the value of the named property.  The following are functionally equivalent:

```
variable.property(name).put(value)
```
and
```
variable.set(name, value)
```

### subscribe(listener)

This adds a listener for any changes to the variable. The `listener` can be an object with an `updated(updateEvent)` method that will be called with update notifications. The `updateEvent` has the following properties:
`type` - This is the type of notification. The most common is `'refresh'`.
`key`	- This is the name of the property or index of the position that was changed.

Alternately, if you provide a function, this will be called with an event object that has a `value()` method that can be called to get the current value. You can also use a subscriber object with a `next(value)` method, based on the proposed ES7 Observable API. However, use of `subscribe` to immediately access the value is generally discouraged, because it require immediate recomputation, rather than using  alkali's optimized resource management. It is preferred to propagate changes through Variables and Updaters, as they provide more efficient resource management and avoid unnecessary computations.

### unsubscribe(listener)

This stops the notifications to the dependent variable, undoing the action of `subscribe`.

### updated(updateEvent, context?)

This is the variable's implementation of a subscriber listeners interface for receiving notifications from other variables.

### apply(instance, functionVariable)

This allows you to execute a function that is the value of a variable, with arguments that come from other variables, (and an instance variable) returning a new variable representing the return value of that function call. The returned variable's valueOf will return the return value of the function's execution. If the this variable, or the instance variable, or any of the argument variables become invalidated (change), than the returned variable will invalidated. The function can be re-executed with the changed values on the next call to valueOf.

### fixed

This property can be set to true, when a variable holds another variable (acting as proxy), so that subsequent `put()` will not replace the contained variable, but will replace the value in the target variable.

### Variable.all(array)

This function allows you to compose a new variable from an array of input variables, where the resulting variable will update in response to changes from any of the input variables. The return variable will hold an array of values that represent the value of each of the input variable's values (in the same order as the variables were provided). This is intended to mirror the `Promise.all()` API. For example:

```
let a = Variable(1)
let b = Variable(2)
let sum = Variable.all(a, b).to(([a, b]) => a + b)
```

## Element Construction

Alkali includes functionality for constructing and extending from native DOM elements, and binding these elements to variables for reactive UIs. The `Element` constructor is returned from the `alkali/Element` module, but this also includes a large set of native element constructors, as properties, to use for streamlined creation of DOM elements. For example, using EcmaScript's module format to import:

```
import { Div, Span, Anchor, TextInput } from 'alkali/Element'

let divElement = new Div()
let spanElement = new Span()
document.body.appendChild(divElement).appendChild(spanElement)
```

In addition, an element has a `create` method that may be alternately called to create a new element. `new Element()` and `Element.create()` are equivalent.

This classes create native DOM elements that can be placed directly into the DOM. All the standardized element tags should be available from the module (they are all properties of the module, and if you are not using ES6, you can access them like `Element.Div`). These classes can take several arguments for constructing elements. The first argument is an optional string in CSS selector format that can be used to define the class, id, or tag. For example, to create a div with a class of `'my-class'` and id of `'my-id'`:

```
let divElement = new Div('.my-class#my-id')
```
All remaining arguments can be in any order and be any of these types:

#### Properties Argument
An argument can be an object with properties that will be copied to the target element. For example, we could create anchor element with a link:
```
new Anchor({href: 'a url'})
```
Each of the property values will be assigned to the newly created element.

If any of the values are alkali variables, they will be automatically bound to the element, reactively updating the element in response to any changes to the variable. For example:
```
let a = new Variable(1)
document.body.appendChild(new Div({title: a}))
a.put(2) // will update the title of the div
```
Alkali uses an optimized strategy for updating elements, by waiting for the next animation frame to update, and only updating elements that are connected to the DOM.

#### Children Array Argument
An argument can be array that defines children nodes. An array should consist of items where each item corresponds to the node that will be created as a child. This array can contain any of the following:
** Element classes - These will generate new elements
** Element instances - This is will be directly inserted
** Variables or primitives - These will be converted to text nodes
** Or nested arrays -  This will result in nested elements (within the last element before the array).
For example, we could create a table:
```
import { Table, TR, TD } from 'alkali/Element'
let table = new Table([
	TR, [
		TD, [
			'First Cell'
		]
	],
	TR, [
		TD, [
			'Second Cell'
		]
	]
])
```

#### Variable Argument
A variable may be provided directly as an argument as well. This variable will be connected to the default "content" of the element. For most elements, this variable will be mapped to the text content of the element. For example:
```
let greeting = new Variable('Hello')
new Span(greeting)
```
However, for input elements, the "content" of the element is the value of the input. This makes it easy to setup bi-direction bindings from inputs to variables. For example:
```
let a = new Variable()
new TextInput(a)
```
The variable `a` will be mapped to this new input. This means that any changes made to `a` will cause the input to be updated, and any changes that the user makes to the input will update the variable (two-way binding).

#### String Argument
You can also simply provide a string (or any primitive, including numbers or booleans), and this will also be directly inserted as a text node. However, this can't be the first argument, as it would be interpreted as a selector. For example:
```
new Div('.my-class', 'Some text to put in the div')
```

### Event Handlers
The properties argument may also define event handlers. These event handlers are simply functions defined with the same event handler names as used by event attributes (however, these are not implemented using "DOM0" event registration, Alkali uses modern event registration to setup these handlers). For example, we could create a span that listens for clicks:
```
new Span({
	onclick(event) {
		// click event occurred
	}
})
```

## Class Extension (Components)

Element classes are designed to be extended so that you can easily create your own custom classes or components. Extended element classes can define default properties, bindings, and children elements as well. When you call a class with the `new` operator or call the `create` method, you are creating a new element instance. But, if you call a class without the `new` operator or if you use the `extend` method, you will create a new subclass of the called element class. Calling the classes to extend a class works much like create new instances, taking the same types of arguments. For example, we could create a custom div class with a pre-defined HTML class attribute:
```
let MyDiv = Div('.my-class')
// and we can create new elements from this, just like with standard element classes
let myDivElement = new MyDiv()
```
We can also define default property values and define a children layout, to create our own complex components. For example, we could go further in extending a Div:
```
let MyComponent = Div({
	title: 'a default title'
}, [
	Span,
	P
])
```
These resulting extended classes can be used like any other element classes, including in child layouts, making it easy to create a hierarchy of layout:
```
let AnotherComponent = Div([
	H2(someVariable),
	MyComponent('.add-a-class', {
		onclick() { // ...
		}
	})
])
```
Element classes can also be extended using the native class extension mechanism. For example, we could write:
```
class MyDiv extends Div {
	onclick() {
		this.doSomething()
	}
	doSomething() {
		super.click()
	}
}
```
One of the advantages with using classes is that it allows you to use the `super` operator to call super class methods, permitting more sophisticated element class composition. Note that there are some limitations to using native class syntax. EcmaScript does not currently support properties, nor does it support direct constructor calls, so classes created this way must be extended through the `extend` method (instances can still be created with the `new` operator). Assigning default properties or children can be done by using the call existing mechanism before or after extending:
```
class MyDiv extends Div({title: 'default title'}) {
	// class methods
}
```

## EcmaScript Generator Support

EcmaScript's new generator functions provide an elegant way to define reactive variable-based functions. Alkali provides a `react()` function that will take a generator function that yields variables and execute the function reactively, inputting variable values, and re-executing in response to changes. For example, we could create a function that computes the maximum of two other variables by simply writing:
```
import react from 'alkali/react'

let sumOfAAndB = react(function*(){
	return Math.max(yield a, yield b)
})
```
The resulting variable will reactively update in response to changes in the variable `a` or `b`.

This reactive function will also properly wait for promises; it can be used with variables that resolve to promises or even directly with promises themselves.

## Updaters

Updaters are an additional mechanism for making UI components react to data changes. Updaters allow us to add reactive capabilities to existing components with minimal change. Updaters are given a variable to respond to, an element (or set of elements) to attach to, and rendering functionality to perform. When an updater's variable changes, it will queue the rendering functionality, and render the change in the next rendering frame, if the element is still visible. The `Updater` module includes several specific updaters, for updating attributes and the text of an element. The following Updaters are available from `alkali/Updater`:

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


## Reverse Mappings

Alkali supports assymetric, bi-directional bindings, which means that we can variables can no only pass data downstream, but data can flow back upstream. For examples, a variable can be bound to an input, but that input may be changed by the user, causing a new value flow back up into the variable. If this flow goes through variable function mappings, that transform data downstream, you may want to define a reverse transform for data flowing back upstream. This can be done by defining a `reverse` function attached to the primary mapping function. This takes two arguments, the incoming `output` variable with the change upstream, and the downstream `inputs` variables that may need to be updated in response to the change. For example:
```
function double(value) {
	return value * 2
}
double.reverse = function(output, inputs) {
	// in reverse, we divide the value by 2
	inputs[0].put(output.valueOf() / 2)
}
let aNumber = new Variable(4)
let doubled = aNumber.to(double)
doubled.valueOf() // -> returns 8
doubled.put(20) // change the output, this will feed back up, and change the original variable
aNumber.valueOf() // -> returns 10
```

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

# Element Constructors

`alkali/Element` exports the following element constructors:

## Standard Elements
Video
Source
Media
Audio
UL
Track
Title
TextArea
Template
TBody
THead
TFoot
TR
Table
Col
ColGroup
TH
TD
Caption
Style
Span
Shadow
Select
Script
Quote
Progress
Pre
Picture
Param
P
Output
Option
Optgroup
Object
OL
Ins
Del
Meter
Meta
Menu
Map
Link
Legend
Label
LI
KeyGen
Image
IFrame
H1
H2
H3
H4
H5
H6
Hr
FrameSet
Frame
Form
Font
Embed
Article
Aside
Figure
FigCaption
Header
Main
Mark
MenuItem
Nav
Section
Summary
WBr
Div
Dialog
Details
DataList
DL
Canvas
Button
Base
Br
Area
A

Anchor (same as A)
Paragraph (same as P)
Textarea (same as TextArea)
DList (same as Dl)
UList (same as Ul)
OList (same as Ol)
ListItem (same as LI)
Input (same as TextInput)
TableRow (same as TR)
TableCell (same as TD)
TableHeaderCell (same as TH)
TableHeader (same as THead)
TableBody (same as TBody)


## Inputs
Checkbox (also CheckboxInput)
Password (also PasswordInput)
Text (also TextInput)
Submit (also SubmitInput)
Radio (also RadioInput)
Color (also ColorInput)
Date (also DateInput)
DateTime (also DateTimeInput)
Email (also EmailInput)
Month (also MonthInput)
Number (also NumberInput)
Range (also RangeInput)
Search (also SearchInput)
Tel (also TelInput)
Time (also TimeInput)
Url (also UrlInput)
Week (also WeekInput)

# Contributing

## Testing

This package uses the [Intern test framework](https://theintern.github.io/intern/#what-is-intern) installed via `npm`.  To run tests, after installing intern-geezer dependency, serve the project directory and open the url in a browser:

`http://localhost:<port>/node_modules/intern-geezer/client.html?config=tests/intern` (add `&grep=...` to filter tests)

# License
Alkali is freely available under *either* the terms of the modified BSD license *or* the
Academic Free License version 2.1. More details can be found in the [LICENSE](LICENSE).
The alkali project follows the IP guidelines of Dojo foundation packages and all contributions require a Dojo CLA. 
