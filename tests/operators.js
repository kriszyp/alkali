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
    },
    conjunctionNegation: function() {
      var s = new Variable()
      var d = s.to(function(s) {
        return s && new Promise(function(r) {
          setTimeout(function() { r('promised') }, 100)
        })
      })
      var notLoading = operators.or(operators.not(s), d)
      assert.isTrue(notLoading.valueOf())
      var upstream = new Variable()
      s.put(upstream)
      assert.isTrue(!!notLoading.valueOf())
      upstream.put('source')
      return new Promise(function(r) { setTimeout(function() { r() }, 50) }).then(function () {
        assert.isFalse(!!notLoading.valueOf(), 'expected to be still loading (source selected, derived not fulfilled)')
	    return new Promise(function(r) { setTimeout(function() { r() }, 100) }).then(function () {
		  assert.isTrue(!!notLoading.valueOf(), 'expected to have fully loaded (source selected and derived has been fulfilled)')
	    })
      })
    }
  })
})
