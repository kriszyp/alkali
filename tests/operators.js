define([
  '../operators',
  '../Variable',
  'intern!object',
  'intern/chai!assert',
  'bluebird/js/browser/bluebird'
], function (operators, VariableExports, registerSuite, assert, Promise) {
  var Variable = VariableExports.Variable
  var VNumber = VariableExports.VNumber
  var VBoolean = VariableExports.VBoolean

  registerSuite({
    name: 'operators',
    operatorType: function() {
      var v = new Variable(2)
      var v2 = new Variable(2)
      assert.isTrue(operators.equal(v, v2) instanceof VBoolean)
      assert.isTrue(operators.equal(v, v2).valueOf())
      assert.isTrue(operators.add(v, v2) instanceof VNumber)
      assert.equal(operators.add(v, v2).valueOf(), 4)
    }
  })
})
