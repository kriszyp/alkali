if (typeof define === 'undefined') { define = function(module) { module(require) }}
if (typeof assert === 'undefined') { assert = require('chai').assert }
define(function(require) {
  require('./Variable')
  require('./Copy')
  require('./operators')
  require('./reactive')
});
