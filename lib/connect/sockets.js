define(function() { 'use strict';

var Connections = function() {
  var _connections = {};

  var _getConnection = function(server) {
    if (!_connections[server]) {
      _connections[server] = {
        socket: null,
        subscriptions: []
      };
    }
    return _connections[server];
  };

  var _destroyConnection = function(server) {
    if (_connections[server].socket) {
      // TOOD: Verify this call
      _connections[server].socket.disconnect();
    }
    delete _connections[server];
  };

  var _ensureConnected = function(server) {
    var connection = _getConnection(server);
    if (!connection.socket) {
      connection = _connections[server] = {
        socket: io.connect(server),
        subscriptions: []
      };
      connection.socket.on('connect', function() {
        _onConnected(connection.socket, /* first: */ true, connection.subscriptions);
      });
      connection.socket.on('reconnect', function() {
        _onConnected(connection.socket, /* first: */ false, connection.subscriptions);
      });
      return false;
    }
    return true;
  };

  var _onConnected = function(socket, firstConnection, subscriptions) {
    $.each(subscriptions, function(index, subscription) {
      subscription(socket, firstConnection);
    });
  };

  this.connect = function(server, subscription) {
    var connection = _getConnection(server);
    connection.subscriptions.push(subscription);
    if (_ensureConnected(server)) {
      _onConnected(connection.socket, /* first: */ true, connection.subscriptions);
    }
  };

  this.disconnect = function(server, subscription) {
    var connection = _getConnection(server);
    for (var i = 0; i < connection.subscriptions.length; i++) {
      if (connection.subscriptions[i] === subscription) {
        connection.subscriptions.splice(i, 1);
        break;
      }
    }
    if (connection.subscriptions.length === 0) {
      _destroyConnection(server);
    }
  };
};


var _connections = null;
var _getConnections = function() {
  return _connections || (_connections = new Connections());
};

var SocketsClient = function(dlgsHost) {
  var _onUpdate = function(data) {
    if (data.dialoguesId === dlgsHost.dialoguesId) {
      dlgsHost.eventAggregator.trigger('add-comments', data.comments);
    }
  };

  var _onConnected = function(socket, firstConnection) {
    if (!firstConnection) {
      socket.off('update', _onUpdate);
    }
    socket.on('update', _onUpdate);
    socket.emit('subscribe', dlgsHost.dialoguesId);
  };

  this.connect = function() {
    var connections = _getConnections();
    connections.connect(dlgsHost.options.server, _onConnected);
  };

  this.disconnect = function() {
    socket.off('update', _onUpdate);
    var connections = _getConnections();
    connections.disconnect(dlgsHost.options.server, _onConnected);
  };
};

return SocketsClient;

});