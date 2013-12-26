define([
  './core.js'
  ], function(Dialogues) { 'use strict';

var root = window;
var previousDialogues = root.dialogues;

return {
  // If global object `dialogues` already defined this method allows to resolve conflicts.
  // Call it to get access to current module.
  noConflict: function() {
    root.dialogues = previousDialogues;
    return module;
  },

  // Render dialogues
  render: function(options) {
    return new Dialogues(options);
  }
};

});