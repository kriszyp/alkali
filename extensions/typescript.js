(function (root, factory) { if (typeof define === 'function' && define.amd) {
  define(['../Variable'], factory) } else if (typeof module === 'object' && module.exports) {        
  module.exports = factory(require('../Variable')) // Node
}}(this, function (Variable) {

return {
  reactive: function(target, key) {
    var Type = Reflect.getMetadata('design:type', target, key)
    if (!Type.notifies) {
      //if (Type === Array) {}
      Type = Variable
    }
    Object.defineProperty(target, key, {
      get: function() {
        var property = (this._properties || (this._properties = {}))[key]
        if (!property) {
          this._properties[key] = property = new Type()
          if (this.getValue) {
            property.key = key
            property.parent = this
          }
        }
        return property
      },
      set: function(value) {
        var property = this[key]
        property.parent ? property._changeValue(null, 4, value) : property.put(value)
      },
      enumerable: true
    })
  }
}
}))