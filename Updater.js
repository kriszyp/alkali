define(function (require, exports, module) {
	var lang = require('./lang');
	var doc = document;
	var invalidatedElements = new WeakMap(null, 'invalidated');
	var queued;
	var toRender = [];
	var nextId = 1;
	var nextFrame = window.requestAnimationFrame || setTimeout;
	function processQueue() {
		for (var i = 0; i < toRender.length; i++){
			toRender[i]();
		}
		toRender = [];
		invalidatedElements = new WeakMap(null, 'invalidated');
		// TODO: if this is not a real weak map, we don't want to GC it, or it will leak
		queued = false;
	}
	function queueRenderer(renderer){
	 	if (!queued) {
			nextFrame(processQueue);
			queued = true;
		}
		toRender.push(renderer);
	}
	function Updater(options) {
		var variable = options.variable;
		if (variable.notifies) {
			// if it has notifies, we don't need to instantiate a closure
			variable.notifies(this);
		} else {
			// baconjs-esqe API
			var updater = this;
			variable.subscribe(function (event) {
				// replace the variable with an object
				// that returns the value from the event
				updater.variable = {
					valueOf: function () {
						return event.value();
					}
				};
			});
		}

		this.variable = variable;
		if (options) {
			if (options.selector) {
				this.selector = options.selector;
			}
			if (options.element) {
				this.element = options.element;
			}
			if (options.update) {
				this.update = options.update;
			}
			if (options.renderUpdate) {
				this.renderUpdate = options.renderUpdate;
			}
		}
		this.update(true);
	}
	Updater.prototype = {
		constructor: Updater,
		update: function () {
			throw new Error ('update must be implemented by sub class of Updater');
		},
		invalidate: function (context) {
			if (!this.invalidated) {
				// do this only once, until we render again
				this.invalidated = true;
				var updater = this;
				queueRenderer(function(){
					updater.invalidated = false;
					updater.update();
				});
			}
		},
		invalidateElement: function(element) {
			var invalidatedParts = invalidatedElements.get(element);
			invalidatedElements.set(element, invalidatedParts = {});
			if (!invalidatedParts[id]) {
				invalidatedParts[id] = true;
			}
			if (!queued) {
				lang.queueTask(processQueue);
				queued = true;
			}
			var updater = this;
			toRender.push(function(){
				updater.invalidated = false;
				updater.updateElement(updater.variable.valueOf(), element);
			});
		}

	};

	function ElementUpdater(variable, options) {
		Updater.call(this, variable, options);
	}
	ElementUpdater.prototype = Object.create(Updater.prototype);
	ElementUpdater.prototype.update = function (always) {
		var element = this.element;
		if(always || element.offsetParent){
			// it is visible
			this.updateElement();
		}else{
			var id = this.id || (this.id = nextId++);
			var updaters = element.updaters;
			if(!updaters){
				updaters = element.updaters = [];
				element.className += ' needs-rerendering';
			}
			if (!updaters[id]) {
				updaters[id] = this;
			}
		}
	};
	ElementUpdater.prototype.addElement = function (element) {
		if (this.selector) {
			element.updaters = [this];
		} else {
			// no way of tracking so, we have to keep an array
			(this.elements = (this.elements || [])).push(element);
		}
		// and immediately do an update
		this.updateElement(element);
	};
	ElementUpdater.prototype.updateElement = function () {
		var value = this.variable.valueOf();
		if(value !== undefined){
			var updater = this;
			lang.when(value, function (value) {
				updater.renderUpdate(value);
			});
		}
	};
	ElementUpdater.prototype.renderUpdate = function (newValue) {
		throw new Error('renderUpdate(newValue) must be implemented');
	};
	Updater.Updater = Updater;
	Updater.ElementUpdater = ElementUpdater;

	function AttributeUpdater(options) {
		if(options.name){
			this.name = options.name;
		}
		ElementUpdater.apply(this, arguments);
	}
	AttributeUpdater.prototype = Object.create(ElementUpdater.prototype);
	AttributeUpdater.prototype.renderUpdate = function (newValue) {
		this.element.setAttribute(this.name, newValue);
	};
	Updater.AttributeUpdater = AttributeUpdater;

	function PropertyUpdater(options) {
		if(options.name){
			this.name = options.name;
		}
		ElementUpdater.apply(this, arguments);
	}
	PropertyUpdater.prototype = Object.create(ElementUpdater.prototype);
	PropertyUpdater.prototype.renderUpdate = function (newValue) {
		this.element[this.name] = newValue;
	};
	Updater.PropertyUpdater = PropertyUpdater;


	function ContentUpdater(options) {
		ElementUpdater.apply(this, arguments);
	}
	ContentUpdater.prototype = Object.create(ElementUpdater.prototype);
	ContentUpdater.prototype.renderUpdate = function (newValue) {
		this.element.innerHTML = '';
		this.element.appendChild(document.createTextNode(newValue));
	};
	Updater.ContentUpdater = ContentUpdater;
	var onShowElement = Updater.onShowElement = function(shownElement){
		queueRenderer(function(){
			var elements = [].slice.call(shownElement.getElementsByClassName('needs-rerendering'));
			if (shownElement.className.indexOf('needs-rerendering') > 0){
				var includingTop = [shownElement];
				includingTop.push.apply(includingTop, elements);
				elements = includingTop;
			}
			for (var i = 0, l = elements.length; i < l; i++){
				var element = elements[i];
				if(element.offsetParent){ // check to make sure it is really visible
					var updaters = element.updaters;
					if(updaters){
						element.updaters = null;
						// remove needs-rerendering class
						element.className = element.className.replace(/\s?needs\-rerendering\s?/g, '');
						for (var id in updaters) {
							var updater = updaters[id];
							updater.updateElement(element);
						}
					}
				}
			}
		});
	};
	module.exports = Updater;
});