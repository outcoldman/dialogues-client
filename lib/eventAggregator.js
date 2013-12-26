define([
  './jQuery'
],
function($) { 'use strict';

var EventAggregator = function() {
  var that = this;
  var listeners = {};

  that.on = function(key, callback) {
    if (typeof listeners[key] === 'undefined') {
      listeners[key] = [];
    }
    listeners[key].push(callback);
  };

  that.off = function(key, callback) {
    if (typeof listeners[key] !== 'undefined') {
      for (var index = 0; index < listeners[key].length; index++) {
        if (listeners[key][index] === callback) {
          listeners[key].splice(index, 1);
          break;
        }
      }
      if (listeners[key].length === 0) {
        delete listeners[key];
      }
    }
  };

  that.trigger = function(key, data) {
    if (typeof listeners[key] !== 'undefined') {
      $.each(listeners[key], function(index, callback) {
        callback(data);
      });
    }
  };
};

return EventAggregator;

});