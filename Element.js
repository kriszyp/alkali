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
	var cssRules;
	function createCssRule(selector) {
		if (!cssRules) {
			var styleSheet = document.createElement("style");
			styleSheet.setAttribute("type", "text/css");
			styleSheet.appendChild(document.createTextNode(css));
			document.head.insertBefore(styleSheet, document.head.firstChild);
			cssRules = styleSheet.cssRules || styleSheet.rules;
		}
		var ruleNumber = cssRules.length;
		return styleSheet.addRule(selector, ' ', ruleNumber);
	}
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

	classToTag = {
		Anchor: 'a',
		UList: 'ul',
		OList: 'ol',
		DList: 'dl'
	}

	function getClassName(Class) {
		return Class.name || Class.toString().match(/function ([_\w]+)\(/)[0]
	}
	function getTagName(BaseClass) {
		var className = (BaseClass.name || BaseClass.toString().slice(0,30)).match(/HTML(\w+)Element/);
		if (className) {
			var tagName = className[1]
			return classToTag[tagName] || tagName
		}
		// try with the base class
		return getTagName(Object.getPrototypeOf(BaseClass))
	}


	function layoutChildren(parent, children) {
		var container
		for(var i = 0, l = children.length; i < l; i++) {
			var child = children[i]
			var childNode
			if (typeof child == 'string') {
				childNode = document.createTextNode(child)
			} else if (child instanceof Array) {
				layoutChildren(childNode, child)
			} else if (child.make) {
				childNode = child.make(parent)
			}
		}
	}

	function applyProperties(element, properties) {
		for (var key in properties) {
			value = properties[value]
			if (value && value.notifies) {
        new PropertyUpdater({
          name: key,
          variable: value,
          element: element
        })
			} else {
				element[key] = value
			}
		}
	}

	function makeElement(Base, tagName, args) {
		function Element(properties) {
			makeElement(Element, arguments)
		}
		var prototype = Element.prototype = Object.create(Base.prototype)
		for (var i = 0, l = args.length; i < l; i++) {
			var argument = args[i]
			if (argument instanceof Array) {
				prototype.childrenToRender = argument
			} else {
				for (var key in argument) {
					var value = argument[key]
					if (typeof value === 'function') {
						prototype[key] = value
					}
				}
			}
		}
		var initialized
		var className
		Element.make || (Element.make = function(parent, properties, children) {
			if (!initialized) {
				className = getClassName(this).replace(/A-Z/g, function (letter) { return '-'.toLowerCase() })
				className = className.indexOf('-') > -1 ? '' : 'x-'
				var prototype = this.prototype;
				initialized = true
				for (var key in prototype) {
					if (key.slice(0, 2) === 'on' && prototype[key]) {
						(Element.events || (Element.events = {}))[key] = prototype[key]
						doc.addEventListener(key.slice(2), function (event) {
							var target = event.target
							// TODO: find parent matching
							target['on' + type](target, event)
						})
					}
				}
				var styles = this.styles
				if (styles) {
					var rule = createCssRule('.' + className)
					for (var key in styles) {
						rule.style[key] = styles[key]
					}
				}
			}
			tagName = tagName || getTagName(Base)
			var element = document.createElement(tagName)
			Object.setPrototypeOf(element, prototype)
			element.className = className
			element.createdCallback && element.createdCallback()
			element.created && element.created()
			if (parent.tagName) {
				parent.appendChild(element)
				element.attachedCallback && element.attachedCallback()
				element.attached && element.attached()
			}
			// TODO: we may want to put these on the instance so it can be overriden
			if (this.childrenToRender) {
				layoutChildren(element, this.childrenToRender)
			}
			if (properties) {
				applyProperties(element, properties)
			}
			if (children) {
				layoutChildren(element, children)
			}
		})
	}
	Element.prototype 
	Element.Div = Element(HTMLDivElement)
	ElementType.refresh = Updater.refresh;
	Element.container = function(){
		// container marker
	}
	return ElementType;
});