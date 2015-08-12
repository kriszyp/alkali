define(function (require, exports, module) {
	var doc = document;
	var invalidatedElements = new WeakMap(null, 'invalidated');
	var queued;
	var toRender = [];
	nextFrame = window.requestAnimationFrame || setTimeout
	function processQueue() {
		for (var i = 0; i < toRender.length; i++){
			toRender[i]();
		}
		toRender = [];
		invalidatedElements = new WeakMap(null, 'invalidated');
		// TODO: if this is not a real weak map, we don't want to GC it, or it will leak
		queued = false;
	}
	function Updater(variable, selector) {
		variable.notifies(this);
		this.variable = variable;
		this.selector = selector;
	}
	Updater.prototype = {
		constructor: Updater,
		update: function (newValue) {
			throw new Error ('update must be implemented by sub class of Updater');
		},
		addElement: function (element) {
			if (this.selector) {
				element.updaters = [this];
			} else {
				// no way of tracking so, we have to keep an array
				(this.elements = (this.elements || [])).push(element);
			}
			// and immediately do an update
			this.update(element, this.variable.valueOf());
		},
		invalidate: function (context) {
			if (!this.invalidated) {
				// do this only once, until we render again
				this.invalidated = true;
				var elements = this.elements;
	 			if (!queued) {
					nextFrame(processQueue);
					queued = true;
				}
				var updater = this;
				toRender.push(function(){
					updater.invalidated = false;
					updater.update(updater.variable.valueOf());
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

	function ElementUpdater(variable, selector) {
		Updater.call(this, variable, selector);
	}
	ElementUpdater.prototype.update = function (newValue) {
		var updater = this;
		elements && elements.forEach(function (element) {
			updater.update(element, newValue);
		});
	};
	Updater.ElementUpdater = ElementUpdater;

	function AttributeUpdater(variable, selector) {
		ElementUpdater.call(this, variable, selector);
	}
	AttributeUpdater.prototype = Object.create(Updater.prototype);
	AttributeUpdater.prototype.updateElement = function (element, newValue) {
		element.setAttribute(name, newValue);
	};
	Updater.AttributeUpdater = AttributeUpdater;

	function ContentUpdater(variable, selector) {
		Updater.call(this, variable, selector);
	}
	ContentUpdater.prototype = Object.create(Updater.prototype);
	ContentUpdater.prototype.update = function (element, newValue) {
		element.innerHTML = '';
		element.appendChild(document.createTextNode(newValue));
	};
	Updater.ContentUpdater = ContentUpdater;
	module.exports = Updater;
});