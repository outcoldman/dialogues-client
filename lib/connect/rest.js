define([
  './../jQuery'
], 
function($) { 'use strict';

var RestClient = function(dlgsHost) {
  this.serverUrl = 
    dlgsHost.options.server + 'comments/' +
    dlgsHost.dialoguesId.host + '/' + 
    dlgsHost.dialoguesId.id + '/';

  this.getAll = function(callback) {
    $.getJSON(
      this.serverUrl
    )
    .done(function(result) {
      callback(null, result);
    })
    .fail(function(jqxhr, textStatus, error) {
      callback(error, null);
    });
  };

  this.post = function(comment, callback) {
    var data = JSON.stringify({ 
      dialogues: dlgsHost.dialoguesId,
      comment: comment
    });

    $.ajax(
      this.serverUrl,
      {
        type: 'PUT',
        data: JSON.stringify(comment),
        dataType: 'json'
      })
      .done(function(result) {
        callback(null, result);
      })
      .fail(function(jqxhr, textStatus, error) {
        callback(error, null);
      });
  };
};

return RestClient;

});