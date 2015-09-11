define(['./Updater', './lang', './Context'], function (Updater, lang, Context) {
	var knownElementProperties = {
	};
	['href', 'title', 'role', 'id', 'className'].forEach(function (name) {
		knownElementProperties[name] = true;
	});
	var testStyle = document.createElement('div').style;
	var childTagForParent = {
		TABLE: ['tr','td'],
		TBODY: ['tr','td'],
		TR: 'td',
		UL: 'li',
		OL: 'li',
		SELECT: 'option'
	};
	var inputs = {
		INPUT: 1,
		TEXTAREA: 1,
		SELECT: 1
	};
	var doc = document;
	var invalidatedElements = new WeakMap(null, 'invalidated');
	var queued;
	var baseDefinitions = {
		class: {
			is: function (className) {
				return {
					for: function(context) {
						var elementType = context.get('type');
						elementType.selector += '.' + className;
					}
				};
			}
		}
	};
	function processQueue() {
		for (var i = 0; i < toRender.length; i++){
			toRender[i]();
		}
		invalidatedElements = new WeakMap(null, 'invalidated');
		// TODO: if this is not a real weak map, we don't want to GC it, or it will leak
		queued = false;
	}


	var toRender = [];
	function flatten(target, part) {
		var base = target.base;
		if (base) {
			var basePart = base[part];
			if (basePart) {
				target[part] || target[part];
			}
		}
	}

	var nextId = 1;
	function ElementType(tagName) {
		this.tagName = tagName || 'span';
	}
	ElementType.prototype = {
		with: function (properties, targetValue) {
			var derivative = this.deriveType();
			for (var key in properties) {
				derivative.set(key, properties[key]);
			}
			if (targetValue) {
				derivative.bindTo(targetValue);
			}
			return derivative;
		},
		bindTo: function(targetValue){
			this.content = targetValue;
		},
		deriveType: function () {
			var derivative = Object.create(this);
			derivative.base = this;
			if (this.definitions) {
				derivative.definitions = Object.create(this.definitions);
			}
			return derivative;
		},
		define: function (name, value) {
			this.definitions[name] = value;
		},
		init: function () {
			this._initialized = true;
			this.selector = this.selector || 
				(this.tagName + nextId++);
			if (this.base) {
				//this.base.init();
				flatten(this, 'styles');
				flatten(this, 'properties');
			}
			var properties = this.properties;
			if (properties) {
				for (var i = 0; i < this.properties.length; i++){
					var name = properties[i];
					var value = properties[name];
					if (value && value.invalidate) {
						// a variable
						new Updater.PropertyUpdater({
							variable: value,
							selector: this.selector,
							name: name
						});
					}
				}
			}
		},
		set: function (name, value) {
			var definitions = this.definitions;
			if (definitions && definitions[name]) {
				var result = definitions[name].is(value, new Context(this));
				if (result && result.for) {
					result.for()
				}
			} else if (knownElementProperties[name]){
				this.setProperty(name, value);
			} else if (testStyle[name] !== undefined) {
				this.setStyle(name, value);
			} else {
				this.setProperty(name, value);
			}
			return this;
		},
		setStyle: function (name, value) {
			var styles = this.styles || (this.styles = []);
			if (styles[name] === undefined) {
				styles[name] = value;
				styles.push(name);
			} else {
				styles[name] = value;
			}
			return this;
		},
		setProperty: function (name, value) {
			var properties = this.properties || (this.properties = []);
			if (properties[name] === undefined) {
				properties[name] = value;
				properties.push(name);
			} else {
				properties[name] = value;
			}
			return this;
		},
		elements: function (callback) {
			var elements = document.querySelectorAll(this.selector);
			for (var i = 0; i < elements.length; i++) {
				callback(elements[i]);
			}
		},
		newElement: function () {
			if (!this._initialized) {
				this.init();
			}
			var element = document.createElement(this.tagName);
			// simple conversion of CSS selector class names to space separated class names
			element.className = this.selector.replace(/[^\.]+\.([\w-]+)/g, '$1 ');
			var properties = this.properties || 0;
			var context = new Context(this, element);
			for (var i = 0, l = properties.length; i < l; i++) {
				var name = properties[i];
				element[name] = properties[name].valueOf(context);
			}
			this.renderStyles(element, context);
			this.fillElement(element, context);
			return element;
		},
		renderStyles: function (element, context) {
			var inlineStyles = this.inlineStyles;
			if (inlineStyles) {
				// if initialized (although we might consider using a different variable for checking
				// for initialization), we just apply the inline styles
				for (var i = 0, l = inlineStyles.length; i < l; i++) {
					var name = inlineStyles[i];
					lang.when(inlineStyles[name].valueOf(context), function (value) {
						element.style[name] = value;
					});
				}
			} else {
				// this is the first time through, so for each style we evaluate, and determine
				// if it is element dependent
				this.inlineStyles = [];
				var addCssProperty = function(name) {
					return function (value) {
						if (ruleStyles) {
							ruleStyles[name] = value;
						} else {
							ruleCssText += name + ':' + value;
						}
					};
				};
				var styles = this.styles || 0;
				for (var i = 0; i < styles.length; i++) {
					var name = this.styles[i];
					var value = this.styles[name];
					var ruleStyles;
					var ruleCssText = '';
					if (value && value.invalidate) {
						// a variable
						var elementType = this;
						var updater = new Updater({
							variable: value,
							selector: this.selector,
							renderUpdate: function(){

							}
						});
						context = context || new Context(this);
						context.get = function (contextKey) {
							if (contextKey === 'element') {
								// element was accessed, must be element dependent
								var inlineStyles = elementType.inlineStyles || (elementType.inlineStyles = []);
								updater.needsElement = true;
								if (!inlineStyles[name]) {
									inlineStyles.push(name);
								}
								inlineStyles[name] = value;
								// apply the actual inline style for this element
								lang.when(value.valueOf(context), function (value) {
									element.style[name] = value;
								});
								return element;
							}
							return Context.prototype.get.apply(this, arguments);
						};
						lang.when(value.valueOf(context), addCssProperty(name));
					} else {
						addCssProperty(name)(value);
					}

					// copy styles to a rule
					ruleStyles = createRule(selector, ruleCssText);
				}
			}
		},
		fillElement: function (element, context) {
			if (this.children) {
				this.renderChildren(element, context);
			} else if (this.content) {
				this.renderContent(element, context);
			}
		},
		renderChildren: function (element, context) {
			// make the content available to children
			element.content = this.content;
			// iterate through the children
			var children = this.children;
			children && createChildren(element, children);
			function createChildren(parent, children) {
				var element;
				if (children) {
					for (var i = 0, l = children.length; i < l; i++) {
						var child = children[i];
						if (child.newElement) {
							element = parent.appendChild(child.newElement(context));
						} else if (child instanceof Array) {
							createChildren(element, child);
						} else if (typeof child === 'string') {
							parent.appendChild(document.createTextNode(child));
						}
					}
				}
			}
			this.applyContent(element);
			return element;
		},
		renderContent: function (element, context) {
			var elementType = this;
			var contentVariable = this.content;
			var content = contentVariable.valueOf(context);
			lang.when(content, function (content) {
				if (element.tagName in inputs) {
					// set the text
					if (element.type === 'checkbox') {
						element.checked = content;
					} else if(element.type === 'radio') {
						element.checked = (content == element.value);
					} else {
						element.value = content;
					}
					if(!rule._inputConnected){
						rule._inputConnected = true;
						dom.addInputConnector(elementType, contentVariable);
					}
				}else{
					// render plain text
					element.appendChild(doc.createTextNode(content));
				}

			});

		}
	};
	ElementType.refresh = processQueue;
	return ElementType;
});