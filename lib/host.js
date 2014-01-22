define([
  './jQuery',
  './connect/sockets',
  './connect/rest',
  './eventAggregator'
], 
function(
  $,
  SocketsClient,
  RestClient,
  EventAggregator
) { 'use strict';

var DialoguesHost = function(options) {
  if (options.$el) {
    this.$el = $(options.$el);
  } else {
    this.$el = $('<div />').insertAfter(document.currentScript);
  }
  this.dialoguesId = { id: options.id, host: options.id };
  this.options = options;
  this.eventAggregator = new EventAggregator(options);
  this.connect = {};
  this.connect.rest = new RestClient(this);
  if (this.options.load.sockets && typeof window.io === 'object') {
    this.connect.socket = new SocketsClient(this);
  }
};

return DialoguesHost;

});