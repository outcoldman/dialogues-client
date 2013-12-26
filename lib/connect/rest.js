define([
  './../jQuery'
], 
function($) { 'use strict';

var RestClient = function(dlgsHost) {
  this.getAll = function(callback) {
    $.getJSON(
      dlgsHost.options.server,
      dlgsHost.dialoguesId, 
      function(data) {
        callback(null, data);
      })
    .fail(function(jqxhr, textStatus, error) {
      callback({ message: textStatus, error: error }, null);
    });
  };

  this.post = function(comment, callback) {
    var data = JSON.stringify({ 
      dialogues: lgsHost.dialoguesId,
      comment: comment
    });
    $.post(
      dlgsHost.options.server,
      data, 
      function(result, textStatus, jqXHR) {
        callback(null, result);
      },
      'json')
    .fail(function(jqxhr, textStatus, error) {
      callback({ message: textStatus, error: error }, null);
    });
  };
};

return RestClient;

});