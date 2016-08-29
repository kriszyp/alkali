define(['./Variable'], function (Variable) {

var classMaps = new WeakMap()
var instanceContextualizations = new WeakMap()

function HTMLContext(element) {
  // construct a new context that contextualizes based on an HTML Element
  this.subject = element
  this.inputs = [] // this is an array that can mix contexts and variables
}
HTMLContext.prototype = Object.create(Variable.Context.prototype)
HTMLContext.prototype.constructor = HTMLContext
HTMLContext.prototype.merge = function(childContext) {
  if (!this.distinctSubject || this.distinctSubject.contains(childContext.distinctSubject)) {
    this.distinctSubject = childContext.distinctSubject
  }
}
HTMLContext.prototype.specify = function(Variable) {
  // specify a particular instance of a generic variable
  var subject = this.subject
  var distinctive = true
  do {
    if (this.distinctSubject === subject) {
      distinctive = false
    }
    var subjectMap = classMaps.get(subject.constructor)
    if (subjectMap) {
      var variableMap = subjectMap.get(Variable)
      if (variableMap) {
        if (distinctive) {
          this.distinctSubject = subject
        }
        return variableMap.get(subject)
      }
    }
  } while ((subject = subject.parentNode))
  // else if no specific context is found, return default instance
  return Variable.defaultInstance
}
HTMLContext.prototype.matches = function(context) {
  // does another context match the resolution of this one?
  return true
}


function HTMLChildContext(element) {
  this.subject = element
  this.inputs = []
}

HTMLChildContext.prototype = Object.create(HTMLContext.prototype)
HTMLChildContext.prototype.constructor = HTMLChildContext
HTMLChildContext.prototype.notifies = Variable.ChildContext.prototype.notifies

HTMLContext.prototype.ChildContext = HTMLChildContext

return HTMLContext
})