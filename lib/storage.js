define(function() { 'use strict';

return {
  exists: function() {
    // Took this part from modernizr script
    var mod = 'modernizr';
    try {
      localStorage.setItem(mod, mod);
      localStorage.removeItem(mod);
      return true;
    } catch(e) {
      return false;
    }
  },

  set: function(key, content) {
    localStorage.setItem(key, content);
  },

  get: function(key) {
    return localStorage.getItem(key);
  },

  remove: function(key) {
    localStorage.removeItem(key);
  }
};

});