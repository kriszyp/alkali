# Alkali

[![Join the chat at https://gitter.im/alkali-js/Lobby](https://badges.gitter.im/alkali-js/Lobby.svg)](https://gitter.im/alkali-js/Lobby?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)
[![Build Status](https://travis-ci.org/kriszyp/alkali.svg?branch=master)](https://travis-ci.org/kriszyp/alkali)
[![devDependency status](https://david-dm.org/kriszyp/alkali/dev-status.svg)](https://david-dm.org/kriszyp/alkali#info=devDependencies)

[Alkali](https://kriszyp.github.io/alkali/) is a package for creating efficient, reactive data flow that drives native HTML elements. The namesake, alkali metals are a set of elements known for being extremely reactive, conductive, and lightweight, and likewise this library is designed to be a lightweight (20KB gzipped), dependency-free package for accessing simple pure native JavaScript objects with modeling and reactivity capabilities, and creating reactive UIs based on native DOM elements. Alkali is designed for speed and scalability, using a true functional reactive, cache and invalidation-based system that provides optimized on-demand rendering performance. This makes it possible to build highly efficient and fast applications, with UI components driven by standard JavaScript objects using modern functionally reactive techniques, and without any large framework impositions.

# Alkali Basics

The basic approach of using Alkali within your application, is to first create "Variables" that holds your source data. A variable is the central entity in Alkali and represents a value that may change and can be reacted to. Next, we can traverse or transform variables into other derived variables. These variables can be used in the browser or server-side (in Node). In the browser, we can use these transformations, or the orginal variables directly, in element constructors to create bindings to DOM elements. A simple example would look like:
```javascript
import { Variable, Div, Span } from 'alkali'

// construct a variable
let greeting = new Variable('Hi')
// create a new variable based on the first
let fullGreeting = greeting.to(greeting => greeting + ', World')
// construct a div, with the fullGreeting variable bound as the content
document.body.appendChild(new Div(fullGreeting))
```
This would create a new `<div>` bound to our `greeting` variable with an initial value of `"Hi"`. From here we can make changes to variables, and changes will flow through:
```javascript
greeting.put('Hello')
```
This will notify derived variables and bound elements. This will result in the element binding queuing up a rendering, which will later execute and execute any necessary transforms, showing "Hello, World" in our `<div>`.

## Installation

Alkali can be installed with standard package managers, `npm install alkali` or `bower install alkali`, or cloned from the github. Alkali works with ES6, CommonJS, or AMD modules bundlers/loaders. Or, you can load `dist/index.js` (from the package or from [github CDN](http://rawgit.com/kriszyp/alkali/master/dist/index.js)) as a script and use the `alkali` global. Also, here is a [codepen with a basic example to start trying out Alkali](http://codepen.io/kriszyp/pen/xEEBKY?editors=1111).

# Compatibility

Alkali is tested and runs on IE11+ or any other modern browser, and can also on NodeJS (without DOM generation).

# Variables

Again, the central entity in the data model system is a "Variable" (similar notion has variously been known by various names such as "reactive", "signal", "property", "stream", "observable", and others). This object represents and holds a value that may change in the future. A variable can also be likened to a promise, except it can continue to change, rather than resolving one time. Depending on the interface, we can read the value, be notified when it has changed, change the value, and get meta and error information about the type of the value.

Notifications of data changes are delivered by update notifications. When a downstream subscriber is interested in the results of a variable change, it can request the latest value. This is subtly distinct from "streams", in that unnecessary computations can be avoided and optimized when only the current state (rather than the history of every intermediate change) is of interest. Variables can also employ internal caching of calculated values. And Variables support bi-directional flow. They can be updated as well as monitored.

Variables also support promises as values, and the variable pipeline will handle waiting for a promises to resolve to do computations.

Alkali uses extendable element constructors and updaters that are designed to consume variables, binding to variables values, and reactively responding to variable changes. They can also bound to inputs that will update variables in respond to user changes.

The Variable class can be extended and variable classes can be used like variables, where the instance to be acted on, can be resolved as needed. This allows for categorical relationships between variable and element classes to be defined, and resolved based on context.

The main/index module in alkali exports all of functionality in alkali. If you are using ES6 module format, you can import different constructors and utilities like:
```javascript
import { Variable, Div } from 'alkali'
```
Alkali uses UMD format, so it can be consumed by CommonJS or AMD module systems as well.

## Debugging/Interaction

See the [Debugging](#debugging) section below for information on debugging tips with standard developer tools. Also [Litmus](https://github.com/kriszyp/litmus) is a project that aims to provide a visual explorer/graph of alkali variables and data flow.

## Todo Example
[Alkali-Todo](https://github.com/kriszyp/alkali-todo) is a the TodoMVC application written with Alkali. This repository includes a walk-through for a good example-based approach to learning to use Alkali.

## Typings
Alkali includes an `index.d.ts` file to provide a TypeScript type interface.

## TypeScript Plugin for Reactive Expressions
The [ts-transform-alkali](https://github.com/kriszyp/ts-transform-reactive) can optionally be used to write and transform reactive properties and expressions that create alkali variables and properties with decorators.

## Babel Plugin for Reactive Expressions
Also, the [babel-plugin-transform-alkali](https://github.com/kriszyp/babel-plugin-transform-alkali) can optionally be used to write and transform reactive expressions for babel.

## Variable API

The Variable is main API for creating variables and their derivative.

### Variable(initialValue)

This is the constructor for a variable. You may create a variable with an initial value, provided as the optional argument.

### `valueOf()`

This returns the current value of the variable. This method also allows variables to be used directly in expressions in place of primitive values, where JavaScript coercion will automatically convert a value. For example a variable with the number 4 can be used:
```javascript
import { Variable } from 'alkali' // assuming ES6 module transpilation
let four = new Variable(4)
four * four -> 16
'#' + four -> '#4'
four < 5 -> true
four == 4 -> true
```

### `put(value)`

`put` allows us to update the value of a variable with a new value. This can be given a standard value, or you can pass in another variable, in which case this variable will be "linked" to the other, receiving all values and updates from the provided variable.

If the `value` passed in is not different than the current value, no changes will be made and this will return `Variable.noChange`. If the value can not be assigned, it will return `Variable.deny`.

### `property(propertyName, PropertyClass?)`

This returns a variable representing the value of the property of the variable. If this variable's value is an object, the property variable's value will be the value of the given property name. This variable will respond to changes in the object, and putting a value in a property variable will update the corresponding property on the parent object. For example:
```javascript
let object = {foo: 1};
let objectVar = new Variable(object);
let foo = objectVar.property('foo');
foo.valueOf() -> 1
foo.put(2);
object.foo -> 2
```
An optional class can be provided to define the class to use/instantiate for the property. Once the property variable has been created/accessed, it will be available as a property directly on the variable (as long as it doesn't conflict with any methods). In the case the property variable can be accessed from `objectVar.foo`.


### `to(function, reversal?)`

This maps or transforms the value of the current variable to a new variable (that is returned), reflecting the current value of the variable (and any future changes) through the execution of the callback function. The callback function is called when the variable is changed and there is downstream interest in it, and is called with the value and should return a value to be provided to the returned variable. For example:
```javascript
let number = new Variable(3);
number.valueOf() -> 3
let doubled = number.to((value) => value * 2);
doubled.valueOf() -> 6
number.put(5);
number.valueOf() -> 5
doubled.valueOf() -> 10
```

A `to` function can return variables as well, in which case you can effectively chain variables together, merging their changes. For example:
```javascript
let a = new Variable(1)
let b = new Variable(2)
let sum = a.to((aValue) => {
	return b.to((bValue) => {
		return aValue + bValue;
	})
})
// sum will reactively update to changes in either a or b
```
The `to` function will also wait for any promise values to resolve before executing as well.

The optional `reversal` argument can define a function that will be called when the returned variable is changed (with `put` or child `set`), and can handle sending data back to the source.

### `get(propertyName)`

This returns the value of the named property. The following are functionally equivalent:

```javascript
variable.property(name).valueOf() === variable.get(name)
```

### `set(propertyName, value)`

This sets the value of the named property. The following are functionally equivalent:

```javascript
variable.property(name).put(value)
```
and
```
variable.set(name, value)
```

### `schema`

This is a property that provides a variable representing the schema for the variable. The schema can include metadata and validation information (used for the `validation` property below). A schema can define sub-property schemas that will be applied to variable properties, as well. You can get and set this property. By default, this will return the constructor for plain variables, will get the `schema.properties[propertyName]` for property variables, and will use returned variables for derived variables.

### `validation`

This is a property that provides a variable representing the validation of this variable. Alkali provides very basic validation, but generally you will want to implement your own `validate` method, which can use the `schema` to validate variable values. See the validation section below for more information.

### `subscribe(listener)`

This adds a listener for any changes to the variable. If you provide a function, this will be called with an event object that has a `value()` method that can be called to get the current value. You can also use a subscriber object with a `next(value)` method, based on the proposed ES7 Observable API. However, use of `subscribe` to immediately access the value is generally discouraged, because it require immediate recomputation, rather than using alkali's optimized resource management. It is preferred to propagate changes through Variables to Elements and Renderers, as they provide more efficient resource management and avoid unnecessary computations. One of other distinction in these APIs is that when an object with `next(value)` is provided, and the variable resolves asynchrounsly (it or an upstream variable is assigned a promise), `next` will not be called until the promise is resolved the event listener will be called immediately (when the assignment takes place).

This method will return an object with an `unsubscribe` method, which you can call to stop a subscription.

### `Variable.for(subject)`

This static method will return a variable instance mapped to the target object. This will return a stable reference to a variable instance, the first call for a given target object will create a new instance, and subsequently calls with return the same variable. This can be very useful if independent code will access the same object(s) and make changes to the object and ensure that the changes are communicated through the same variable.

### `all(array, transform?)`

This function allows you to compose a new variable from an array of input variables, where the resulting variable will update in response to changes from any of the input variables. The return variable will hold an array of values that represent the value of each of the input variable's values (in the same order as the variables were provided). This is intended to mirror the `Promise.all()` API. For example:

```javascript
import { all, Variable } from 'alkali'
let a = Variable(1);
let b = Variable(2);
let sum = Variable.all(a, b).to(([a, b]) => a + b);
```

`all` will also work with a set of arguments, instead of an array. It was will also work with an object, in which case each property value will be resolved, and the result will resolved to an object with the resolved values.

You can also provide an optional `transform` argument that will do a transform of the input values, which is essentially shorthand for `all(...).to(...)`:
```
let sum = Variable.all([a, b], (a, b) => a + b);
```

## Variables as Arrays (`VArray`)

Variables provide most of the array methods for when the value of a variable is an array, by using the `VArray` constructor. Methods including `push`, `splice`, `pop`, and `forEach` are all available on these variables, and will act on the underlying array, and send out the proper update notifications for modifications. When arrays are modified through variables, the update notifications are incremental, and can be much more efficient for downstream listeners that support them (including alkali element lists).

Functional array methods can also be applied, which will return a new variable, which will stay updated with results synced to the source array. These include `filter`, `map`, `every`, `same`, `reduce`, and `reduceRight` which take the same arguments and behave according to the standard methods.

Also, variables with arrays can be used as iterables in for-of loops. For example:
```javascript
var letters = new VArray(['a', 'b', 'c']);
arrayVariable.push('d');
let lettersAfterB = letters.filter(letter => letter > 'b');
for (let letter of lettersAfterB) {
	...
}
```

In addition, `keyBy` and `groupBy` methods are also available:
`keyBy(getKey(element, emit(key, value))?, getValue(element)?)` - This will index the values in array using the provided key retrieval, `getKey`, which can be a string to indicate a property, or a function to retrieve the key from the element. The `getKey` receives the `element` and can return the appropriate key. It also has an `emit` function that can optionally be used to add additional entries to the index. If omitted, value itself will be the key. In addition `getValue` can also provided to retrieve the value, if something other than the original array element is desired. This will return a Map variable, which can be used to retrieve values by id.

`groupBy(getKey(element, emit), ?, getValue(element)?)` - This behaves the same as `keyBy` but can be used when multiple elements may share the same key. This will put all the elements for a given in an array under the key. The returned Map variable will have array values.

## Structured Variables

With variables we can define structured data that will be represented by a corresponding variable structure. We can create new extended `Variable`s with their own object structure. This can be done by provided a structure in a direct call to `Variable` (without `new`) which will return an subclassed `Variable` class/constructor. Once we have defined the structure, these property variables will be available as properties directly on the variable class and instances. For example:
```javascript
let MyVariable = Variable({
	name: Variable
	// we can subclass and define structures and use these in properties
	subObject: Variable({
		subValue: Variable,
		foo: OtherCustomVariable
	})
})
```
([JSFiddle example](https://jsfiddle.net/kriszyp/8oLtfz10/4/))

This is a useful pattern because it defines a structure for your data, and these sub-variables can easily be accessed as first class properties (rather than going through the `property` API). We can also values to these properties and they will be assigned to the value of the variable. For example:
```
let myVar = new MyVariable({ name: 'Alkali' })
myVar.name // the "name" property variable
myVar.name.valueOf() -> 'Alkali'
myVar.name.subscribe(event => console.log('new name', event.value()))
// assign a new value to the property, will trigger the listener
myVar.name = 'New name'
// assignment the same as this:
myVar.name.put('New name')
// we can traverse into the sub class/objects:
myVar.subObject.subValue.put(3)
```
We could go further and define list structures as well (here we demonstrate inline class definitions):
```javascript
let MyVariable = Variable({
	myList: VArray.of(Variable({
		foo: Variable()
	}))
})
```


### Primitive Typed Variables
We can also define properties with a specific primitive type. Alkali exports classes for primitive typed variables:
* VString
* VNumber
* VBoolean
* VDate
* VSet
* VPromise
* VMap

Each of these have methods corresponding to the methods on the original primitive. For non-mutating accessor methods, the method will return a new variable representing the result of applying the method to the value. For example:
```
let greeting = new VString('hello, world')
let greet = vs.slice(0, 5)
greet.valueOf() -> 'hello'
greeting.put('hi there')
greet.valueOf() -> 'hi th'
```
And the mutating methods (that change the value of the primitive) will change the primitive and notifying any listeners:
```
let set = new VSet(['a', 'b'])
let hasC = set.has('c')
hasC.valueOf() -> false
set.add('c')
hasC.valueOf() -> true
```

### Subclassing Structured Variables
Variables can also be subclassed with native class syntax. Subclassed variables can not be directly called without `new` (no classes can), but you can derive new structured variables from variable subclasses using the `.with(structure)` method, just as you would above:
```javascript
class MyVariable extends Variable {
  ...
}
let AnotherVariable = MyVariable.with({
  name: VString
})
```

## EcmaScript Generator Support (`react()`)

EcmaScript's new generator functions provide an elegant way to define reactive variable-based functions. Alkali provides a `react()` function that will take a generator function that yields variables and execute the function reactively, inputting variable values, and re-executing in response to changes. For example, we could create a function that computes the maximum of two other variables by simply writing:
```javascript
import { react } from 'alkali'

let sumOfAAndB = react(function*(){
	return Math.max(yield a, yield b)
})
```
The resulting variable will reactively update in response to changes in the variable `a` or `b`.

This reactive function will also properly wait for promises; it can be used with variables that resolve to promises or even directly with promises themselves.

### Generator Computed Properties

Reactive generators can also be directly defined in the variable structures. A computed variable property be assigned by providing a generator method used to calculate the variable value. This will generate a getter for the property that will return a variable based on the generator method. This method can be written in same way as the `react` generator functions described above, where you use the `yield` operator on each variable. The generator method also has access to `this`. Generator getters can be defined on variable classes or element classes. For example:

```javascript
let MyVariable = Variable({
	*name() { // this will create a computed property for "name"
		return `${yield this.firstName} ${yield this.lastName}`
	},
	firstName: Variable,
	lastName: Variable
})
let v = new MyVariable({
	firstName: 'John',
	lastName: 'Doe'
})
let name = v.name // the name property will return a variable
name.valueOf() -> 'John Doe'
v.lastName = 'Smith' // this will update "name" to have a value of "John Smith"
```
[See JSFiddle Example](https://jsfiddle.net/kriszyp/54b9gq7b/4/)

# Element Construction

Alkali includes functionality for constructing and extending from native DOM elements, and binding these elements to variables for reactive UIs. The `alkali` module exports the full set of native element constructors (see the list at the end of the documentation), as properties, to use for streamlined creation of DOM elements. For example, using EcmaScript's module format to import:

```javascript
import { Div, Span, Anchor, TextInput } from 'alkali';

let divElement = new Div();
let spanElement = new Span();
document.body.appendChild(divElement).appendChild(spanElement);
```

In addition, an element has a `create` method that may be alternately called to create a new element. `new Element()` and `Element.create()` are equivalent.

These classes create native DOM elements that can be placed directly into the DOM (it is not a wrapper). All the standardized element types should be available from the module (they are all properties of the module, and if you are not using ES6, you can access them like `Element.Div`). These classes can take several arguments for constructing elements. The first argument is an optional string in CSS selector format that can be used to define the class, id, or tag. For example, to create a div with a class of `'my-class'` and id of `'my-id'`:

```javascript
let divElement = new Div('.my-class#my-id');
```
All remaining arguments can be in any order and be any of these types:

## Properties Argument

An argument can be an object with properties that will be copied to the target element. For example, we could create `<a>` element with a link:
```javascript
new Anchor({
	href: 'a url',
	textContent: 'click here'
});
```
Each of the property values will be assigned to the newly created element.

If any of the values are alkali variables, they will be automatically bound to the element, reactively updating the element in response to any changes to the variable. For example:
```javascript
let a = new Variable(1);
document.body.appendChild(new Div({title: a}));
a.put(2); // will update the title of the div
```

You can also use a variable for input value properties (`value`, `valueAsNumber`, and `checked`), and the variable will be auto-updated with user changes to the input.

You can alse use variable classes for property values as well. These are described below.

Alkali uses an optimized strategy for updating elements, by waiting for the next animation frame to update, and only updating elements that are connected to the DOM.

By default, properties are copied directly to the element that is being, or will be, created. However, Alkali also provides special handling for certain properties:
* `href`, `id`, `innerHTML`, `src`, `tabIndex`, `title`, `textContent`, etc. - All the standard DOM element properties are copied to the target element, and any of these can contain a static value or a variable. A variable will auto-update the value of the property with the value of the variable.
* `content` - This represents the main content of an element, and can depend on the type of element. For most elements, this represents the inner content of element. If it is a primitive, it will be the text content (inserted as a text node). If it is an array, it will generate a set of child elements. For inputs, the content corresponds to the `value` or `checked` property of the input, typed to the type of value that the input expects (numbers for number inputs), with bi-directional binding.
* `classes` - This can be an object where each property corresponds to a class name that can be conditionally turned on or off for the element. For each property, the value can be a boolean or variable that returns a boolean (or anything that can be evaluated as truthy or falsy). This is typically the best way to enable and disable conditional styling for an element.
* `class`, `for`, `role` - These are copied to their corresponding attributes.
* `attributes` This can be an object, and the properties are copied to attributes on the element.
* `dataset` - This can be an object, and the properties are copied to the elements `dataset` object to construct custom-user attributes.
* `style` - This can be an object, and the properties are copied to the elements `style` object to construct inline styles.
* CSS style properties - Inline style properties can be defined directly in the properties argument as well, and will create inline styles. When used as direct properties, booleans will be converted to named values for certain properties (for `display`, `visibility`), and numbers will be appended with `px` for dimensional properties.
* `render` - This described below.
* If a property is not recognized as one of these handled properties described above, the value will be copied to the target element (if the value is variable, the variable itself will be copied directly). To avoid any unexpected property collisions, Alkali keeps a whitelist of known/standard element and style properties, such that if an unknown property on an element exists, it will be overriden (and its behavior ignored).

In addition, custom handling of properties can be defined creating render methods or getters and setters as described below.
[See JSFiddle Example](https://jsfiddle.net/kriszyp/7ndqjoyd/3/)

### Children Array Argument

An argument can be an array that defines a set of elements to use as the content or children of the created element. An array should consist of items where each item corresponds to the node that will be created as a child. This array can contain any of the following:
* Element classes - These will generate new elements
* Element instances - This is will be directly inserted
* Variables or primitives - These will be converted to text nodes
* Or nested arrays -	This will result in nested elements (within the last element before the array). Sub-array elements will be added as children of the preceding element.

For example, we could create a table:
```javascript
import { Table, TR, TD } from 'alkali/Element';
let table = new Table([
	TR, [
		TD, ['Column 1, Row 1'],
		TD, ['Column 2, Row 1'],
	],
	TR, [
		TD, ['Column 1, Row 2'],
		TD, ['Column 2, Row 2'],
	]
]);
```
[See JSFiddle Example](https://jsfiddle.net/kriszyp/nyz05qLm/1/)

### Variable Argument

A variable may be provided directly as an argument as well. This variable will be connected to the default `content` of the element. Again, for most elements, this variable will be mapped to the text content of the element. For example:
```javascript
let greeting = new Variable('Hello');
new Span(greeting);
```
And for input elements, the `content` of the element is the value of the input. This makes it easy to setup bi-direction bindings from inputs to variables. For example:
```javascript
let a = new Variable();
new TextInput(a);
```
The variable `a` will be mapped to this new input. This means that any changes made to `a` will cause the input to be updated, and any changes that the user makes to the input will update the variable (two-way binding).

When an element is detached from the DOM, it will no longer listen for variable changes (allowing the variables and all dependencies to be automatically cleaned up).

### String (and numbers, booleans) Argument
You can also simply provide a string (or any primitive, including numbers or booleans), and this will also be directly inserted as a text node. For example:
```javascript
new Div('Some text to put in the div');
```

Note that if you are using a string as the first argument, if it starts with a '.' or '#', it will be interpreted as a selector. Only the first argument can be selector, so a string-as-text can be safely used with any starting character for subsequent arguments. You can safely output variable or user-provided strings with explicit content (`Div({content: someString})`), or as an explicit child (`Div([someString])`).

### `null` and `undefined`
Any null or undefined argument will be ignored. This can be useful for conditionally creating elements:

```javascript
Div([
	maybeIncludeChild ? Span : null
])
```

### Event Handlers
The properties argument may also define event handlers. These event handlers are simply functions defined with the same event handler names as used by event attributes (however, these are not implemented using "DOM0" event registration, Alkali uses modern event registration to setup these handlers). For example, we could create a span that listens for clicks:
```javascript
new Span({
	onclick(event) {
		// click event occurred
	},
	onmouseover: mouseOverHandler
});
```
[See Example](https://jsfiddle.net/kriszyp/7ndqjoyd/3/)

## Extending Elements

The Alkali element classes are designed to be extended or derived so that you can easily create your own custom components and constructors. Extended element classes can define default properties, bindings, and children elements as well. When you call a class with the `new` operator or call the `create` method, you are creating a new element instance. But, you can also derive new constructors or classes. The first way to do this is by creating an extended constructor. By calling a class without the `new` operator or if you use the `with` method, you will create a new constructor of the original element class (or constructor). Creating new constructors works much like creating new instances, taking the same types of arguments, and defines a set of properties or event handlers to be assigned to an element instance on instantiation. An extended constructor constructs true extended native DOM element. For example, we could create a custom div constructor with a pre-defined HTML class attribute:
```javascript
let MyDiv = Div('.my-class')
// and we can create new elements from this, just like with standard element classes
let myDivElement = new MyDiv()
```
We can also define default property values and define a children layout, to create our own complex components. For example, we could go further in extending a Div:
```javascript
let MyComponent = Div({
	title: 'a default title'
}, [
	Span,
	P
]);
```
These resulting extended constructors can be used like any other element classes, including in child layouts, making it easy to create a hierarchy of layout:
```javascript
let AnotherComponent = Div([
	H2(someVariable),
	MyComponent('.add-a-class', {
		onclick() { // ...
		}
	})
]);
```
And we can create element instances by using a new operator with nested constructors for a clean hierarchical syntax:
```javascript
	new UList([
		LI([Span('.a-class', 'first')]),
		LI([Span('.a-class', 'second')]),
	]);
```

## Creating/Extending Element Classes (Components)
True custom element classes or components can also be created by using the native JavaScript class extension mechanism, or any transpilation or class emulation (like Babel). We can extend from an existing element class (or constructor), and create a real new class with its own prototype (that inherits the native methods and properties). This is appropriate to use when creating new components with their own behavior defined in methods and event handlers. For example, we could write:
```javascript
class MyDiv extends Div {
	onclick() {
		this.doSomething();
	}
	doSomething() {
		super.click();
	}
}
```
One of the advantages of using classes is that it allows you to use the `super` operator to call super class methods, permitting more sophisticated element class composition. Note that there are some limitations to using native class syntax. EcmaScript does not currently support properties, nor does it support direct constructor calls, so if you want to create a new derived constructor from a natively constructed class, this must be done through the `with` method (instances can still be created with the `new` operator). Assigning default properties or children can be done by calling with properties before or after class extending:
```javascript
class MyDiv extends Div({title: 'default title'}) {
	// class methods
}
```
And we can create a constructor from MyDiv with properties to be assigned to the instances:
```javascript
MyDivWithClass = MyDiv.with('.a-class', {title: 'a different title'});
```

Note that if you are using TypeScript, event handlers must be defined as class property (with a function value):
```javascript
	onclick = function() {
		this.doSomething();
	}
```
[See JSFiddle Example](https://jsfiddle.net/kriszyp/yun2y5dy/4/)

#### Children
You can also define a set of children for by setting the static children property of a class:
```javascript
MyDiv.children = [
	Div,
	Span
];
```
or
```javascript
class MyDiv extends Div {
	static get children() {
		return [Div, Span];
	}
}
```
This is distinct from providing an array of elements or other values as the `content` (or as an argument) of an element. The `children` represents  the intrinsic structure of an element, and the `content` is inserted after the children are created. Consequently we could define a structure like:
```javascript
import { Div, Span, content } from 'alkali'
...
MyDiv.children = [
	Span('Hello'),
	content(Div)
]

new MyDiv([Span('.inner-span', 'World')])
```
Which would create a structure like:
```html
<div>
	<span>Hello</span>
	<div>
		<span class="inner-span">World</span>
	</div>
</div>
```
Children can alternately be defined as a shadow DOM structure by using `shadow` instead of `children`.


[See JSFiddle Example](https://jsfiddle.net/kriszyp/yun2y5dy/4/)

### Property Declaration

We can also declare properties on our elements through a constructor call, just as we would with a variable. When we define a property with a variable, this will make the property consistently available as a variable statically on the element and on the element instance. For example, we can declare that an element expects a `title` and `body` properties that we expect to be passed in on creation:
```javascript
let MyDiv = Div({
  title: Variable,
  body: Variable,
  created(properties) {
    properties.title // this will always be a variable, if a title is provided it will be initialized that value
    // properties.body will be a variable as well
    properties.content = properties.body.to(body => 'Body: ' + body)
  }
})
let myDiv = new MyDiv({title: 3})
myDiv.title // this will be a variable that has been initialized to 3
myDiv.title.put(4) // we can update the variable
myDiv.body.put('new body') // this will be a variable as well, and we can update it
```
This variables will also be statically available, which can be useful for statically defining the element children/structure:
```javascript
let MyDiv = Div({
  title: Variable,
  body: Variable
})
```
We can then easily reference those properties:
```javascript
MyDiv.children = [
  H1(MyDiv.title),
  Div('.body', MyDiv.body),
]
```
[See JSFiddle Example](https://jsfiddle.net/kriszyp/yun2y5dy/4/)


### Generator getter methods

Again, if you are developing in an ES6 compatible environment (Babel or restricted set of modern browsers), you can define generator getters in constructor arguments, making it very simple to construct element properties that react to other properties and variables. A generator getter will result a property variable for custom properties. For standard/native element properties, the generator getter will reactively assign its output to the standard element property. For example:

```javascript
let MyLink = Anchor({
	*path() { // custom property
		return `${yield this.owner}/${this.repo}`
	},
	*href() { // defines the href for the <a> element
		return `https://${yield this.domain}/${yield this.path}`
	},
	*content() { // defines the contents of the <a> element
		return 'Link to ' + (yield this.path)
	}
})
let alkali = new Variable('alkali')
new MyLink({
	domain: 'github.com', // these can be variables or static values
	owner: 'kriszyp',
	repo: alkali
})
```

#### Generator `*render` Method

In addition to getter generators, you can define a singular `*render` method to modify an element in response to variables. The `*render` method can be used on classes, constructors, or element instantiation. For example, without even creating a class we can write:
```javascript
new Div({
	*render() {
		this.title = yield titleVariable;
		...
	}
})
```
[See JSFiddle Example](https://jsfiddle.net/kriszyp/yun2y5dy/4/)

### Construction Lifecycle Methods

There are several methods that are called as part of the construction of an element that can be used to define additional behavior of an element. These include:
* `created(properties)` - This is called for each new element instance prior to applying any properties or doing any rendering of the element or children, or attaching to the DOM. It is called with the properties that were provided to construct the element (merged arguments from construction, including original variables in the case of properties that contain variables). This method can modify the properties object, to apply different properties to the element during construction. This is the most common method for adding custom handling of elements. When an element contains children, the parent will be executed before the children `created` methods.
* `ready(properties)` - This is called for each new element instance after the properties have been applied and rendering and construction of children have completed, and is called with the properties that were provided to construct the element (including original variables in the case of properties that contain variables). It is called after the properties and children have been assigned, but before the element is attached to a parent. Generally, DOM operations are faster prior to an element being attached. When an element contains children, the children will be executed before the parent `ready` method.
* `attached()` (and `attachedCallback()`) - This is called when an element is attached to the document tree. This is useful for performing operations that may involve dimensional layout (measuring dimensions), requiring the element to be attached. When an element contains children, the parent will be executed before the children `attached` methods.
* `detached()` - This is called when an element is detached from the document tree. This can be a useful place to perform cleanup operations. However, elements may be reattached as well (and `attached` would be called again).

For example:
```javascript
class MyComponent extends Div {
	created(properties) {
		// we can interact with the properties that were passed in, and add to them
		properties.content = [
			H2('Hello, ' + properties.greeting)
		];
	}
	ready(properties) {
		// the properties have been set, do any additional manipulation
		this.appendChild(new Span('World'));
	}
	attached() {
		// we can measure now
		let myWidth = this.offsetWidth;
	}
}
```

## Variable Classes

We can create our own variable classes that can be used to define properties and be referenced as well. When we use our own variable classes in property declarations, this will define a relationship between an element class and a variable class. Variable classes have the same api as normal variables, and you can then use the variable class within properties of the defined element, or any child elements. For example:

```javascript
let Title = Variable()
let MyComponent = Div({
	title: Title // Define title to be our own variable type
}, [
	Span('.some-child-element', [
		Title // can even reference the variable class in child elements
	])
])
```
Now each instance of `MyComponent` that we create, will have a corresponding value/object for `MyVariable`, and those can even be accessed from child elements. We can also programmatically access the variable instance for a given element:
```javascript
let myComponent = new MyComponent()
var title = Title.for(myComponent)
// will update the element instance
title.put('Hello')
```

Element classes themselves also act as variable classes. Element classes include a static `property` method, like variables, which maps to the properties of the elements themselves. This makes it convenient to declaratively use element properties in child elements.
```

## Element Lists/Loops

Often you may want to create a set of child elements, based on an array or list of values or objects. You can provide an array, or a variable with an array, as the `content` of an element, and then define a child element structure to be generated for item in the array with an `each` property. The child element structure can then access the current item in the array loop through the `Item` variable class. For example, we could create a `ul` element with `li` children by doing:

```javascript
import {UL, LI, Item} from 'alkali/Element';

new UL({
	content: ['One', 'Two'],
	each: LI(Item)
});
```
Like any other variable class, we can access properties from the `Item` class as well, and create more sophisticated child structures. Here is how to create a select dropdown:
```javascript
import {Select, Option, Item} from 'alkali/Element';
new Select({
	content: [{id: 1, name: 'One'}, {id: 2, name: 'Two'}],
	each: Option({
		value: Item.property('id'),
		content: Item.property('name')
	})
});

```
Again, we can also use a variable that contains an array as the content to drive the list. When using a variable, the child elements will reactively be added, removed, or updated as the variable is modified in the future. If we use the array methods on the variable, the updates will be progressive or iterative, and will not require rerendering the whole list.

The generic `Item` class can be limiting in that it offers no connection back to a collection for updates. However, classes can extend a `VArray` and define a relationship with the class of the items within the array/collection. This can done setting a static `collection` property on the item class to reference the collection class. For example:
```javascript
class Widgets extends VArray {...}
class Widget extends Variable {...}
Widget.collection = Widgets
```
One this has been the child class can be referenced in loops as well, and the changes can propagate to the collection:
```javascript
new Div({
	content: Widgets,
	each: Input(Widget.property('selected'))
});
```
Alternately, you can define this relationship with `Widgets.collectionOf = Widget`

Another means of generating elements from list or array data is to use a `map` method:
```javascript
new Select({
	content: options.map(item =>
		Option({
			value: item.id,
			content: item.name
		}))
})
```
This will also respond to changes (additions, removals) in the source array, if it is a variable.

## Metadata and Validation

Alkali provides metadata/schema information, as well as validation functionality that can be associated with variables and their properties and derived variables. This can further facilitate the encapsulation of a property, allowing you variable-aware UI controls to interact with a variable or property's future value changes, as well as metadata and validation that further defines the property.

You can define the schema for a variable by setting the `schema` property on a variable or defining a getter for the property. If you don't define a schema, the default schema is the variable's constructor. In any case, you can define metadata on your schema that is available for downstream use. A schema can also define metadata for properties, which is generally more useful. This is done by putting property definitions, in a `properties` object, with each property defining a schema for the corresponding property. For example, we could define a variable class that specifies that the `email` property should have a metadata property of `required: true`:
```javascript
let ValidatedVariable = Variable({
	email: Variable({
		required: true,
		description: 'Email address'
	})
}
```
Now we could define a UI control that makes use of this:
```javascript
class FormField extends Label {

}
let content = FormField.property('content')
FormField.children = [
	content.schema.description, ': ',
	Input(content, {
		required: content.schema.required
	})
]
```
This form field class only relies on the variable/property to construct the label, input, and required attribute. We could then use it:
```javascript
var entry = new ValidatedVariable({})
form.append(FormField(entry.property('email')))
```
We could also add a `validate` method that will be called to determine the `validation` of the variable:
```javascript
let ValidatedVariable = Variable({
	validate(value, schema) {
		if (schema.pattern && !schema.pattern.test(value)) {
			return ['Value is not the right format']
		}
	}
	email: Variable({
		pattern: /\w+@\w+/,
		...
})
...
FormField.children = [
	...
	Input(content),
	Span('.errors', content.validation, {
		each: errors
}
```

## Alkali Element API

All the element classes/constructors that are exported or generated by Alkali have the following static methods/properties:
* `create(...elementArguments)` - Creates a new element instance
* `with(...elementArguments)` - Creates a new element constructor
* `property(name)` - Returns a generalized variable for the property of elements of this class
* `for(subject)` - Gets an instance of the element for the given subject
* `children` - This an array of the children (constructors, variables, or elements) that will be constructed on instantiation
* `inputEvents` - This is an array of events types to listen for when a variable is connected to an input's value. By default this is `['change']`.

### Alkali Element Exports

Several additional exports are available from alkali for working with elements. The first is `assign` which allows the same type of element properties (like `classes`) that constructors can take, along with variable values, to be applied to an existing element or class/constructor. It takes the form:
`assign(target, properties)`

The `target` can be an element, constructor, or class, and the `properties` should be an object with properties to be assigned.

These include two methods that can be added to `HTMLElement.prototype` to easily add elements to existing elements, using Alkali constructors and variables.

When added to elements their API is:
* `parentElement.append(...elementArguments)` - This appends new child elements to the parent element using standard alkali arguments for children (constructors, variables, elements, etc.).
* `parentElement.prepend(...elementArguments)` - This inserts new child elements in the parent element using standard alkali arguments for children (constructors, variables, elements, etc.), before other existing elements.

Both of these methods are compatible with proposed DOM4 methods. While augmenting native objects isn't recommended for consumption by other libraries, it is recommended for application developers, and can be done:
```javascript
import { append, prepend } from 'alkali'

HTMLElement.prototype.append = append
HTMLElement.prototype.prepend = prepend
```

#### Options

Alkali also exports an options object. It has the following properties:
`options.moveLiveElementsEnabled` - This indicates whether or not alkali supports elements with variables, restarting the variables when an element is reattached. This is enabled (`true`) by default, but it requires expensive mutation observation, and it is recommended that you disable it, and avoid reattaching alkali constructed elements (that should be created, attached, removed and left to be collected).

## Renderers

Renderers are an additional mechanism for making UI components react to data changes. Renderers allow us to add reactive capabilities to existing components with minimal change. Renderers are given a variable to respond to, an element (or set of elements) to attach to, and rendering functionality to perform. When an updater's variable changes, it will queue the rendering functionality, and render the change in the next rendering frame, if the element is still visible. A `Renderer` can be constructed with an options object that defines the source `variable`, the associated DOM `element`, and an `renderUpdate` method that will perform the rerender with the latest value from the variable.

For example, we could create a simple variable:

	var Variable = require('alkali/Variable');

	var greeting = new Variable('Hi');

And then define an updater:

	import { Renderer } from 'alkali'

	var greeting = new Variable('Hi');
	new Renderer({
		variable: myNumber,
		element: someElement,
		renderUpdate: function (newValue) {
			element.innerHTML = newValue + '.';
		}
	})

An Renderer will only update an element if it is visible, and will mark it as needing rerendering. If a hidden element is made visible again, you can trigger the rerendering by calling `Renderer.onShowElement(element)` on a parent element. You can also provide a custom definition for what constitutes a visible element that should be immediately rendered by defining a `shouldRender(element)` method, which should return true or false indicating if the element needs to be rendered.

Alternately, you may set `alwaysUpdate` to true on the Renderer options to force the Renderer to always render in response to changes.

If your variables use promises, alkali will wait for the promise to resolve before calling `renderUpdate` (and it will be called with the resolution of the promise). You may define a `renderLoading` to render something while a promise is waiting to be resolved.

## Object Monitoring

The plain JavaScript objects in a variable can be observed by the variable for changes. To actively monitor an object for property changes (direct assignment of properties outside of alkali), you can `observeObject` method on a variable. For example:

	var myObject = {name: 'simple property'};
	var myVariable = new Variable(myObject);
	// actively observe this object
	myVariable.observeObject();
	var nameProperty = myVariable.property('name');

	nameProperty.subscribe(function (event) {
		console.log('name change', event.value())
	});

	myObject.name = 'new name'; // this will trigger a change on the nameProperty


## Reverse Mappings

Alkali supports assymetric, bi-directional bindings, which means that we can variables can no only pass data downstream, but data can flow back upstream. For examples, a variable can be bound to an input, but that input may be changed by the user, causing a new value flow back up into the variable. If this flow goes through variable function mappings, that transform data downstream, you may want to define a reverse transform for data flowing back upstream. This can be done by defining a `reverse` function attached to the primary mapping function. This takes two arguments, the incoming `output` variable with the change upstream, and the downstream `inputs` variables that may need to be updated in response to the change. For example:
```javascript
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


## Variable Copy-on-Write

Alkali variables that contain objects default to using copy-on-write semantics that protects object immutability. Whenever you `set` a property on a variable containing an object, a new copy of the object will be created and assigned the provide property value, leaving the original object untouched. For example:
```javascript
let obj = {foo: 1}
let v = new Variable(obj)
v.set('foo', 2)
v.valueOf() -> {foo: 2}
obj.foo -> 1
```
This behavior can be altered by setting the `isWritable` flag to false on a variable:
```javascript
let obj = {foo: 1}
let v = new Variable(obj)
v.isWritable = false
v.set('foo', 2)
obj.foo -> 2
```

Alkali variables can be assigned (with `put`) a value that is another variable. When this happens the first variable will receive the value of the assigned variable, and reflect any changes of the assigned or linked variable. The linked variable acts as an "upstream" source, and changes will propagate down. In a default assignment, changes will *not* propagate upstream, changes to the downstream variable will not affect the source. Again, a new copied object will be created to contain the changes of a downstream variable. For example:
```javascript
let sourceVariable = new Variable({foo: 1})
let containingVariable = new Variable(sourceVariable)
sourceVariable.set('foo', 2) // this will propagate down to containingVariable
containingVariable.set('foo', 3) // this will not affect the sourceVariable
containingVariable.get('foo') -> 3
sourceVariable.get('foo') -> 2
```

## Variable Proxying

However, there may be situations where you want to explicitly define a variable as a proxy, such that changes propagate to the source, as well as to the proxying variable. This can be done by using the `is` method to assign the variable:
```javascript
let sourceVariable = new Variable({foo: 1})
let containingVariable = new Variable()
containingVariable.is(sourceVariable)
containingVariable.set('foo', 3) // this *will* affect the sourceVariable
sourceVariable.get('foo') -> 3
containingVariable.put({foo: 4}) // this will also affect the sourceVariable
sourceVariable.get('foo') -> 4
```
Note that when returning a variable from `to` variable transform, the resulting transform variable will use proxying behavior, by default, if there is no reverse transform that was defined.

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

## Creating Web Components/Custom Tag Named Elements

Custom elements (web components) can be registered with their own custom tag name as well. This can be done by extending an Element class, and calling `defineElement` with that class. This will set the tag name of the created elements, attempt to call `customElements.define` to register the element with the browser, if it is available in the browser, and return a class/constructor for the element. For example:
```javascript
import { Element, defineElement } from 'alkali'

export default defineElement('custom-element',
class MyCustomElement extends Element { // on newer browsers we could extend other elements
	...
}
```
Note that this functionality currently will only work predictably on all browsers by extending the generic `Element` class, as other base elements with specific functionality, like inputs and tables, will not properly inherit their functionality in olders browsers (that do not support `customElements.define`). Using `defineElement` is recommended for classes that will be frequently used and can extend generic element functionality, or in newer browser environments.

Again, the returned element constructor can be called directly to construct new constructors, instantiated.

The provided name can include selectors as well as to define a class name or ids to assign on construction:
```
defineElement('custom-element.add-this-class-too')
```

## Additional Variable Methods

The following methods are also available on variables (but mostly used internally):

### `updated(updateEvent)`

This is called to indicate that the variable has been updated. This is typically called between dependent variables, but you can also call this to indicate that an object in a variable has been modified.

### `apply(instance, functionVariable)`

This allows you to execute a function that is the value of a variable, with arguments that come from other variables, (and an instance variable) returning a new variable representing the return value of that function call. The returned variable's valueOf will return the return value of the function's execution. If the this variable, or the instance variable, or any of the argument variables are updated, than the returned variable will update. The function can be re-executed with the changed values on the next call to valueOf.

### `is(sourceVariable)`

This will cause the variable to act as a direct proxy for the source variable, and changes to this variable will be directed to the source variable, and vice versa.

### `whileResolving(valueUntilResolved?, useLastValue: boolean?)`
Returns a new variable that is sourced from `this` variable and when the source
returns asynchronously (an upstream promise), this will immediately return 
the `valueUntilResolved` until the `this` variable is resolved (and which point
it will update and return that source value). If `useLastValue` is true, once the
variable has been resolved, the last resolved value will be used until the
next resolution. If no arguments are provided, will default to using the
last resolved value (with `undefined` returned until the first resolution). 

### `Variable.proxy(source)`

This will utilize ES2015 Proxy's to create a proxy object that will intercept all property access and modification, make them act like `property` and `set` methods.

## `Transform(source)`
The `Transform` class is available for defining transforms with a class structure. For simple transforms, the `to` method will usually suffice, but if you would like to use a class structure with methods that can be used by/for the transform, this extension of a `Variable` class can be useful. The `Transform` constructor takes a `source` argument (available as a property0, and can define a `transform(source)` method. Instances are standard variables, and can be used as such. Additional sources can be defined with properties `source1`, `source2`, etc. and will be passed in as additional arguments to the `transform` method.

## Variables with Maps
JavaScript `Map` objects can be used as the value for a variable, with the `Map` properties mapped to the variable properties. This can be done using the `VMap` constructor. The `Map` can be provided as a standard value as the argument or through `put`:
```javascript
new VMap(new Map())
```

### `spawn()`

Alkali also exports a `spawn` function, which waits for promises like `react`, but rather than returning a variable that will execute the provided transform generator/function on-demand, will immediately execute the generator, returning a promise (if there are promises yielded in the generator). This is effectively the same as task.js's `spawn` function. The 'spawn' can accept an iterator returned from a generator as well.

## Operator Functions

Alkali includes several operator functions for combining variables with operators, corresponding to JavaScript operators. These functions take variables or static values as arguments, and return a variable that is result of this operation. These operator functions are also reversible, the returned variable can be modified, triggering a change in input variable. These operators include:

* `add(a, b)` - The `add` function returns a variable that is the sum of two input variables or values, corresponding to a + b.
* `subtract(a, b)` - Returns a variable corresponding to a - b
* `multiply(a, b)` - Returns a variable corresponding to a * b
* `divide(a, b)` - Returns a variable corresponding to a / b
* `not(a)` - Returns a variable corresponding to !a
* `remainder(a, b)` - Returns a variable corresponding to a % b
* `greater(a, b)` - Returns a variable with a boolean corresponding to a > b
* `greaterOrEqual(a, b)` - Returns a variable with a boolean corresponding to a > b
* `less(a, b)` - Returns a variable with a boolean corresponding to a > b
* `lessOrEqual(a, b)` - Returns a variable with a boolean corresponding to a > b
* `strictEqual(a, b)` - Returns a variable corresponding to a === b
* `equal(a, b)` - Returns a variable corresponding to a == b
* `and(a, b)` - Returns a variable corresponding to a && b
* `or(a, b)` - Returns a variable corresponding to a || b
* `round(a, decimals)` - Returns a variable corresponding to rounded a, optionally to provided decimal points

## Which Listener To Use?

There are several ways to listen for variable updates with Alkali, and which are designed and optimized for different situations. Here are a list of the main ways to listen for changes, and which is preferred (starting with the most preferred):
* `to`, (and `map` and `filter`) - These are passive listeners or transforms, that are only called lazily when needed. These are used to transform the value or values of one variable into an other variable. When a variable changes, these transform functions are only called when a downstream subscriber actually needs the value to be computed. As a passive, or lazy callback function, the function will not be executed by merely calling `to(callback)`, but as needed. Ideally with Alkali, an application should consist of variables, which then are transformed to other downstream variables, which are eventually used directly by elements without any other imperative listeners (the elements handle listening themselves). This is the preferred mechanism for defining functions that response to variables, but, of course there are always other needs, so we have other mechanisms.
* `Renderer` - The Renderers are designed as a reactive listening endpoint to a variable, and is optimized for rendering variable changes into DOM elements. An Renderer will respond to changes in variables, but will debounce updates, waiting for the next rendering frame, to ensure that unnecessary variable access (through the lazy transform functions) is avoided. Renderers will also avoid accessing variables to update elements, when an element is detached from the DOM.
* `subscribe(callback)` - This is an active listener to updates from variables. This will be called for each update made to a variable (or any upstream variable). This is not lazy, and does not need to wait for a downstream listener to request a value, it will be called immediately after any update. However, while the callback function will be called immediately, this does not necessarily immediately trigger upstream transform functions, until you call `event.value()`. Once you call `event.value()`, you will trigger the upstream transform functions. If you call this to retrieve the value, for every update event, without any debouncing, you can potentially incur a lot of thrashing if you have multiple updates taking place in immediate sequence. However, if you have a function that you really want to be directly notified of variable changes, this is the most direct and reliable way to be notified.

One other difference is that if a variable is given a value that is a promise, both `to` and `Renderer` will resolve any promise first, and then call the callback functions with the resolved value. `subscribe`, on the otherhand, calls the listener immediately in response to update events, so the value returned from `event.value()` may be a yet-to-be-resolved promise.

# Debugging

Debugging reactive code may seem unfamilar at first, but there are actually substantial benefits, since data flows can be visually inspected rather than requiring the complex reasoning involved in stepping through imperative state changes. Alkali element constructors and variables are designed to easily be traced with standard web development tools. If you are using Alkali element constructors, the easiest way to start inspecting code flow is by select an element that was constructed with variables. With Chrome's developer tools, we select an element (which can be done by right clicking on the page and choosing "inspect"), and then choose the "Properties" tab on the element information pane. Then expand the first item in the list. If the element is driven by variables, you should now see an `alkaliRenderers` property, that you can expand. This will show you a renderer for each variable that controls the element (different renderers are used for text, properties, styles, etc.). Each renderer has a `variable` property that can be expanded to show you the variable itself. This represents the bottom of the dependency chain, and we can continue to walk up the chain to see how the data is derived.

You can check the current value of variable by clicking on the `currentValue` getter (it will show `(...)` until you click on it, at which point it will be evaluated). You can also reassign this value, and elements should reactively respond. This can be a great way to test if elements are responding to different variable values as expected. If the variable is a transform, we can then expand the input arguments in the `input`, `input1` properties, for inspection into the input variables. We can also inspect the `transform` to see what function is handling transforms (and you can right click on the function, and choose "Show function definition" to go to your source code, and potentially set breakpoints in the transform function). If a transform returns another variable (or a variable contains another variable), this will be available in the `returnedVariable` property.

You can also walk back down the dependency chain to see what other renderers or variables may be driven by this variable by expanding the `listeners` property.

There can be situations where you may wish to understand what is causing variables to change their state. Often there may be some code that is reassigning variable values, and determine what caused the change can be helpful. Alkali provides a `_debug` getter to easily turn on debugging of a variable. Clicking on the getter will turn on the debugging. At this point, any changes to the variable will be logged to console, along with a stack trace of the call that triggered the variable change, so you can actually see exactly what code made variable changes.

Using the babel-plugin-transform-alkali can also provide additional information in the form of a `name` property on variables, based on the code context.

# Design Philosophy

Alkali has several key architectural advantages:
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

The `alkali` module exports the following element constructors:

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
Img
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
Image (same as Img)
Paragraph (same as P)
Textarea (same as TextArea)
DList (same as DL)
UList (same as UL)
OList (same as OL)
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

This package uses the [Intern test framework](https://theintern.github.io/intern/#what-is-intern) installed via `npm`. To run tests, after installing intern-geezer dependency, serve the project directory and open the url in a browser:

`http://localhost:<port>/node_modules/intern-geezer/client.html?config=tests/intern` (add `&grep=...` to filter tests)

# Browser Support

Basic variables will work on virtually any browser, but the Alkali elements require at least IE11+ or any other modern browser.

# License
Alkali is freely available under *either* the terms of the modified BSD license *or* the
Academic Free License version 2.1. More details can be found in the [LICENSE](LICENSE).
The alkali project follows the IP guidelines of Dojo foundation packages and all contributions require a Dojo CLA.
