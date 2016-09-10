var start = performance.now()
for (var i = 0; i < 1000000; i++) {
  var obj = {}
  obj[0] = 'a'
  obj.length = 1
  obj.a = 'foo'
  for (var j = 0, l = obj.length; j < l; j++) {
    var key = obj[j]
    var value = obj[key]
  }
}
console.log(performance.now() - start)

var start = performance.now()
  var obj = {}
  obj[0] = 'type'
  obj[1] = 'className'
  obj.length = 1
  obj.type = 'text'
  obj.className = 'foo'
for (var i = 0; i < 100000; i++) {
  var input = document.createElement('input')
  applyProperties(input, obj)
}
console.log(performance.now() - start)


Input = require("alkali/Element").Input
Div = require("alkali/Element").Div
Span = require("alkali/Element").Span
var container = document.body.appendChild(document.createElement('div'))
var start = performance.now()
for (var i = 0; i < 10000; i++) {
container.appendChild(new Div([
          Span,
          Input('.test')
        ]))
container.innerHTML = ''
}
console.log(performance.now() - start)


var start = performance.now()
var selectorRegex = /(\.|#)?([-\w]+)/
for (var i = 0; i < 10000; i++) {
  '.test'.match(selectorRegex)
}
console.log(performance.now() - start)

var start = performance.now()
for (var i = 0; i < 10000; i++) {
  var str = '.test'
  if (str[0] == '.' || str[1] == '#') {
    var a = 3
  }
}
console.log(performance.now() - start)

var start = performance.now()
for (var i = 0; i < 10000; i++) {
  var d = new Div()
}
console.log(performance.now() - start)

var start = performance.now()
for (var i = 0; i < 10000; i++) {
  var selector = '.test'
      var operator = selector[0]
      if (operator === '.' || operator === '#') {
        while(true) {
          var index = selector.indexOf('.', 1)
          if (index === -1) {
            index = selector.indexOf('#', 1)
          }
          var name = selector.slice(1, index > -1 ? index : undefined)
          if (index === -1) {
            break
          } else {
            operator = selector[index]
            selector = selector.slice(index)
          }
        }
      }
}
console.log(performance.now() - start)



var start = performance.now()
for (var i = 0; i < 10000; i++) {
  var SELECTOR_REGEX = /(\.|#)?([-\w]+)/
  var selector = '.test'
      while ((selectorMatch = selector.match(SELECTOR_REGEX))) {
        var operator = selectorMatch[1]
        var name = selectorMatch[2]
        var matchLength = selectorMatch[0].length
        if (matchLength === selector.length) {
          break
        }
        selector = selector.slice(matchLength)
      }
}
console.log(performance.now() - start)


function traverse(nodes) {
  for (var i = 0, l = nodes.length; i < l; i++) {
    var node = nodes[i]
    if (node.nodeType === 1) {
      found = node.found
      traverse(node.childNodes)
    }
  }
}

function trav(firstChild) {
  var node = firstChild
  do {
    if (node.nodeType === 1) {
      found = node.found
      var child = node.firstChild
      if (child) {
        trav(child)
      }
    }
    node = node.nextSibling
  } while (node)
}


var start = performance.now()
var found
for (var i = 0; i < 1000; i++) {
  var elements = document.body.getElementsByTagName('*')
  for (var j = 0, l = elements.length; j < l; j++) {
    found = elements[j].found
  }
}
console.log(performance.now() - start)

var start = performance.now()
var found
function trav(firstChild) {
  var node = firstChild
  do {
    if (node.nodeType === 1) {
      found = node.found
      var child = node.firstChild
      if (child) {
        trav(child)
      }
    }
    node = node.nextSibling
  } while (node)
}
for (var i = 0; i < 1000; i++) {
  trav(document.body)
}
console.log(performance.now() - start)


var start = performance.now()
var found
function traverse(baseNode) {
  var currentNode = baseNode.firstChild
  found = currentNode.found
  do {
    found = currentNode.found
    var nextNode = currentNode.firstChild
    if (!nextNode) {
      nextNode = currentNode.nextSibling
    }
    if (!nextNode) {
      do {
        currentNode = currentNode.parentNode
        if (!currentNode || currentNode === baseNode) {
          return
        }
      } while (!(nextNode = currentNode.nextSibling))
    }
    currentNode = nextNode
  } while (true)
}
for (var i = 0; i < 1000; i++) {
  traverse(document.body)
}
console.log(performance.now() - start)


var start = performance.now()
var a
var array = [1,345,3,2,6,35,7,76,5,4,34,34,346,45,5,45,45,645,4,56,64,454]
for (var i = 0; i < 10000; i++) {
  for (var k of array) {
    a = k
  }
}
console.log(performance.now() - start)


var start = performance.now()
var a
var array = [1,345,3,2,6,35,7,76,5,4,34,34,346,45,5,45,45,645,4,56,64,454]
for (var i = 0; i < 10000; i++) {
  for (var k in array) {
    a = array[k]
  }
}
console.log(performance.now() - start)


var start = performance.now()
var a
var array = [1,345,3,2,6,35,7,76,5,4,34,34,346,45,5,45,45,645,4,56,64,454]
for (var i = 0; i < 10000; i++) {
  for (var i = 0, l = array.length; i < l; i++){
    a = array[j]
  }
}
console.log(performance.now() - start)

var start = performance.now()
var a
var array = [1,345,3,2,6,35,7,76,5,4,34,34,346,45,5,45,45,645,4,56,64,454]
for (var i = 0; i < 10000; i++) {
  array.forEach((b) => {
    a = b
  })
}
console.log(performance.now() - start)

var start = performance.now()
var a = {}
for (var i = 0; i < 1000000; i++) {
  Object.defineProperty(a, 'foo', {
    configurable: true,
    get() {
      return 'test'
    }
  })
}
console.log(performance.now() - start)


console.log(performance.now() - start)

var start = performance.now()
var a = {}
for (var i = 0; i < 10000; i++) {
  new Promise(function(r){r()}).then(function(){})
}
new Promise(function(r){r()}).then(function(){
  console.log(performance.now() - start)  
})

var start = performance.now()
var div = document.createElement('div')
for (var i = 0; i < 100000; i++) {
  div.setAttribute('title', i)
}
console.log(performance.now() - start)

var start = performance.now()
var div = document.createElement('div')
for (var i = 0; i < 100000; i++) {
  div.title = i
}
console.log(performance.now() - start)

var start = performance.now()
var div = document.createElement('div')
for (var i = 0; i < 100000; i++) {
  var proto = div
  do {
    proto = Object.getPrototypeOf(proto)
    var descriptor = Object.getOwnPropertyDescriptor(proto, 'title')
  } while (!descriptor)
  descriptor.set.call(div, i)
}
console.log(performance.now() - start)
