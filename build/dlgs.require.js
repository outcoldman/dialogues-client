
define('jQuery',[],function() { 

if (!$) throw new Error('jQuery is required');

return $;

});
define('utils',[],function() { 

var _deepExtend = function(a, b) {
  for (var propertyName in b) {
    if (b.hasOwnProperty(propertyName)) {
      var aProperty = typeof a[propertyName];
      if (aProperty === 'undefined') {
        a[propertyName] = b[propertyName];
      } else if (aProperty === 'object') {
        a[propertyName] = _deepExtend(a[propertyName], b[propertyName]);
      }
    }
  }
  return a;
};

return {
  deepExtend: _deepExtend,
  getDocumentUrl: function() {
    var url = document.location;
    return url.href.substr(0, url.href.length - url.hash.length);
  }
};

});
define('cookies',[],function() { 

return {
  get: function (sKey) {
    var url = encodeURIComponent(sKey).replace(/[\-\.\+\*]/g, "\\$&");
    return decodeURIComponent(document.cookie.replace(new RegExp("(?:(?:^|.*;)\\s*" + url + "\\s*\\=\\s*([^;]*).*$)|^.*$"), "$1")) || null;
  },

  set: function(sKey, sValue, sDomain, sPath) {
    if (!sKey || /^(?:expires|max\-age|path|domain|secure)$/i.test(sKey)) { return false; }
    document.cookie = 
      encodeURIComponent(sKey) + 
      "=" + 
      encodeURIComponent(sValue) + 
      "; expires=Fri, 31 Dec 9999 23:59:59 GMT" + 
      (sDomain ? "; domain=" + sDomain : "") + 
      (sPath ? "; path=" + sPath : "");
    return true;
  }
};

});
define('storage',[],function() { 

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
define('view/comment',[
  './../jQuery',
  './../utils'
], function($, utils) { 

var CommentView = function(dlgsHost, $parent, comment) {
  var that = this;

  var _render = dlgsHost.options.render;
  var _selectors = _render.selectors;
  var _dateFormatter = dlgsHost.options.dateFormatter;
  var _bodyFormatter = dlgsHost.options.bodyFormatter;

  that.$el = null;

  that.comment = comment;

  that.render = function() {
    that.$el = $(_render.template).data('dlgs-comment', that);

    var name = comment.name || dlgsHost.options.resources.anonymous;

    // Set icon
    if (comment.icon && _selectors.icon) {
      $(_selectors.icon, that.$el)
        .attr({
          alt: name,
          src: comment.icon
        });
    }

    // Set website
    if (comment.website) {
      $(_selectors.website, that.$el).attr({ href: comment.website });
    } else {
      $(_selectors.website, that.$el).attr({ disabled: true });
    }

    // Set author name
    $(_selectors.name, that.$el).text(name);

    // Set comment date
    if(_selectors.date && comment.date) {
      $(_selectors.date, that.$el)
        .text(_dateFormatter(new Date(comment.date)));
    }

    // Set link to commentary
    if (_selectors.commentLink && comment.id) {
      var sectionId = 'dlgs_' + comment.id;
      $(_selectors.commentLink, that.$el).attr({
        href: utils.getDocumentUrl() + '#' + sectionId
      });
      that.$el.attr({ id: sectionId });
    }

    // Set body
    $(_selectors.body, that.$el)
      .html(_bodyFormatter(comment.body));

    // Append to parent element
    $parent.append(that.$el);
  };

  that.render();
};

return CommentView;

});
define('view/commentsList',[
  './../jQuery',
  './comment'
], function($, CommentView) {

var CommentsListView = function(dlgsHost, $container) {
  var that = this;

  that.$container = $container;
  var _commentViews = [];
  var _preloadedComments = null;

  that.contains = function(comment) {
    for (var index = 0; index < that.commentViews.length; index++) {
      if (_commentViews[index].comment.id === comment.id) {
        return true;
      }
    }
    return false;
  };

  that.add = function(comments) {
    if (_commentViews.length > 0) {
      for (var i = (comments.length - 1); i >= 0; i--) {
        if (that.contains(comments[i])) {
          comments.splice(i, 1);
        }
      }
    }

    $.each(comments, function(index, comment) {
      _commentViews.push(new CommentView(dlgsHost, that.$container, comment));
    });
  };

  that.scrollToLatest = function() {
    var container = that.$container.get(0);
    if (container.scrollHeight > that.$container.height()) {
      that.$container.animate({ scrollTop: container.scrollHeight }, "slow");
    }
  };

  dlgsHost.eventAggregator.on('add-comments', function(comments) {
    if (_preloadedComments) {
      for (var index = 0; index < comments; index++) {
        _preloadedComments.push(comments[index]);
      }
    } else {
      _add(comments);
    }
  });

  dlgsHost.eventAggregator.on('form-opened', function() {
    _preloadedComments = [];
  });

  dlgsHost.eventAggregator.on('form-submitted', function(comment) {
    that.add(_preloadedComments);
    _preloadedComments = null;
    that.add([comment]);
    that.scrollToLatest();
  });
};

return CommentsListView;

});
define('connect/rest',[
  './../jQuery'
], 
function($) { 

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
define('view/form',[
  './../jQuery',
  './../connect/rest',
  './../storage',
  './../cookies'
],
function($, RestClient, storage, cookies) { 

var FormView = function(dlgsHost) {
  var that = this;

  var host = dlgsHost.options.host;
  var id = dlgsHost.options.id;
  var formRender = dlgsHost.options.formRender;
  var bodyFormatter = dlgsHost.options.bodyFormatter;
  var selectors = formRender.selectors;
  var placeholderSelectors = formRender.placeholderSelectors;
  var dialoguesId = host + '_' + id;
  var storageKey = 'dlgs_backup_' + dialoguesId;
  var restClient = dlgsHost.connect.rest;
  var eventAggregator = dlgsHost.eventAggregator;

  that.$placeholder = $(formRender.templatePlaceholder).appendTo($parent);
  that.$form = $(formRender.template.replace(/{id}/g, dialoguesId)).appendTo($parent).hide();
  that.isOpened = false;

  var $bodyInput = $(selectors.body, that.$form);
  var $usernameInput = $(selectors.username, that.$form);
  var $emailInput = $(selectors.email, that.$form);
  var $websiteInput = $(selectors.website, that.$form);
  var $subscriptionInput = $(selectors.subscription, that.$form);
  var $preview = $(selectors.preview, that.$form);

  var _onBodyChange = function() {
    $preview.html(bodyFormatter($bodyInput.val()));
    if (storage.exists) {
      if ($bodyInput.val()) {
        storage.set(storageKey, $bodyInput.val());
      } else {
        storage.remove(storageKey);
      }
    }
  };

  var _saveAuthorData = function() {
    cookies.set('dlgs-participant', JSON.stringify({
      username: $usernameInput.val(),
      email: $emailInput.val(),
      website: $websiteInput.val()
    }), document.location.hostname);
  };

  var _restoreAuthorData = function() {
    var author = cookies.get('dlgs-participant');
    if (author) {
      author = JSON.parse(author);
      $usernameInput.val(author.username);
      $emailInput.val(author.email);
      $websiteInput.val(author.website);
    }
  };

  var _onAddComment = function() {
    that.$placeholder.hide();

    _restoreAuthorData();

    // Restore body
    if (storage.exists) {
      var commentBody = storage.get(storageKey);
      if (commentBody) {
         $bodyInput.val(commentBody).trigger('input');
      }
    }

    that.$form.fadeIn();
    var form = that.$form.get(0);
    var bottom = form.getBoundingClientRect().bottom; 
    var windowHeight = $(window).height();
    if (bottom > windowHeight) {
      $("body").animate({
        scrollTop: $("body").scrollTop() + (bottom - windowHeight)
      }, 'slow');
    }
    $bodyInput.focus();
    that.isOpened = true;
  };

  var _resetForm = function() {
    that.$form.hide();
    that.$placeholder.fadeIn();
    $bodyInput.val('').trigger('input');
    that.isOpened = false;
  };

  var _onSubmit = function() {
    var comment = {
      username: $usernameInput.val(),
      website: $websiteInput.val(),
      email: $emailInput.val(),
      subscription: $subscriptionInput.prop('checked') || false,
      body: $bodyInput.val()
    };

    restClient.post(comment, function(err, result) {
      if (err) {
        // TODO: Error to user
      } else {
        _resetForm();
        eventAggregator.trigger('submitted', result);
      }
    });
  };

  // Enable preview on input
  $bodyInput.on('input', _onBodyChange);

  // Save user information in cookie
  $.each(
    [$usernameInput, $emailInput, $websiteInput], 
    function(index, $el) {
      $el.on('input', _saveAuthorData);
    }
  );

  // On placeholder button click (add comment)
  $(placeholderSelectors.button, that.$placeholder).click(function() {
    _onAddComment();
    return false;
  });

  // Cancel adding comment
  $(selectors.cancel, that.$form).click(function() {
    _resetForm();
    return false;
  });

  // Submit comment
  $(selectors.submit, that.$form).click(function() {
    _onSubmit();
    return false;
  });
};

return FormView;

});
define('connect/sockets',[],function() { 

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
    if (connection.socket) {
      connection = _connections[server] = {
        socket: io.connect(server),
        subscriptions: []
      };
      connection.socket.on('connect', function() {
        _onConnected(socket, /* first: */ true, connection.subscriptions);
      });
      connection.socket.on('reconnect', function() {
        _onConnected(socket, /* first: */ false, connection.subscriptions);
      });
      return false;
    }
    return true;
  };

  var _onConnected = function(socket, firstConnection, subscriptions) {
    $.each(subscriptions, function(subscription) {
      subscription(socket, firstConnection);
    });
  };

  this.connect = function(server, subscription) {
    var connection = _getConnection(server);
    connection.subscriptions.push(subscription);
    if (_ensureConnected(server)) {
      _onConnected(connection.socket, /* first: */ true);
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
    _connect(dlgsHost.options.server, _onConnected);
  };

  this.disconnect = function() {
    socket.off('update', _onUpdate);
    var connections = _getConnections();
    connections.disconnect(dlgsHost.options.server, _onConnected);
  };
};

return SocketsClient;

});
define('eventAggregator',[
  './jQuery'
],
function($) { 

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
define('host',[
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
) { 

var DialoguesHost = function(options) {
  if (options.$el) {
    this.$el = $(options.$el);
  } else {
    this.$el = $('<div />').insertAfter(document.currentScript);
  }
  this.dialoguesId = (typeof options.dialoguesId === 'string') ? options.dialoguesId : JSON.stringify(options.dialoguesId);
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
define('core.js',[
  './jQuery',
  './utils',
  './cookies',
  './storage',
  './view/commentsList',
  './view/form',
  './host'
], 
function(
  $,
  utils,
  cookies, 
  storage,
  CommentsView,
  FormView,
  DialoguesHost
) { 

var DEFAULT_OPTIONS = {
  $el: null,
  host: document.location.hostname,
  id: document.location.pathname,
  server: '/api/dialogues/', // url to load dialogues
  debug: false, // enable additional logging
  load: { // loading settings
    manual: false, // true if you want to load commentaries in special moment with load() method
    delay: true, // true if you want to load dialogues only when they will be visible on page.
    sockets: true // use sockets when available
  },
  render: { // Render options for commentaries
    templateContainer: '<ul class="dlgs-list" />', // Container for commentaries
    template: // Template for each commentary
'<li>' +
'<section class="dlgs-comment">' +
'  <a class="dlgs-participant-website" >' +
'    <img class="dlgs-participant-avatar" height=80 width=80 />' +
'  </a>' +
'  <div class="dlgs-comment-header">' +
'    <div>' +
'      <a class="dlgs-participant-name dlgs-participant-website" />' +
'      <a class="dlgs-comment-link">' +
'        <span class="dlgs-comment-date" />' +
'      </a>' +
'    </div>' +
'  </div>' +
'  <div class="dlgs-comment-body" />' +
'</section>' +
'</li>',
    selectors: { // Selectors for main elements which dialogues expects
      name: 'a.dlgs-participant-name',
      website: 'a.dlgs-participant-website',
      icon: 'img.dlgs-participant-avatar',
      date: 'span.dlgs-comment-date',
      body: 'div.dlgs-comment-body',
      commentLink: 'a.dlgs-comment-link' 
    }
  },
  preloadRender: {
    template: 
'<div style="text-align: center;">' +
'<a href class="btn btn-primary btn-lg" style="width:80%;">New comments loaded...</button>' +
'</div>',
    selectors: {
      button: 'a'
    }
  },
  formRender: { // Render options for form
    templatePlaceholder: // Placeholder for form
'<div style="text-align: center;">' +
'<a href class="btn btn-primary btn-lg" style="width:80%;">Reply</button>' +
'</div>',
    placeholderSelectors: { 
      button: 'a' // Add commentary button.
    },
    template: // Template for comment form
'<form role="form" class="dlgs-form">' +
'<div class="row">' +
'  <div class="col-md-4">' +
'    <div class="form-group">' +
'      <label for="dlgs-participant-name-{id}">Display name:</label>' +
'      <input type="text" class="form-control" name="dlgs-participant-name" id="dlgs-participant-name{-id}" placeholder="Enter display name">' +
'    </div>' +
'    <div class="form-group">' +
'      <label for="dlgs-participant-email-{id}">Email:</label>' +
'      <input type="email" class="form-control" name="dlgs-participant-email" id="dlgs-participant-email-{id}" placeholder="Enter email">' +
'    </div>' +
'    <div class="form-group">' +
'      <label for="dlgs-participant-website-{id}">Website:</label>' +
'      <input type="url" class="form-control" name="dlgs-participant-website" id="dlgs-participant-website-{id}" placeholder="Enter website">' +
'    </div>' +
'    <!--<div class="checkbox">' +
'      <label>' +
'        <input type="checkbox" name="dlgs-participant-subscription" id="dlgs-participant-subscription-{id}"> Notify about new comments' +
'      </label>' +
'    </div>-->' +
'  </div>' +
'  <div class="col-md-8">' +
'    <div class="form-group">' +
'      <label for="dlgs-comment-body-{id}">Body:</label>' +
'      <textarea class="form-control" rows="10" name="dlgs-comment-body" id="dlgs-comment-body-{id}" autofocus="true"></textarea>' +
'    </div>' +
'  </div>' +
'</div>' +
'<div class="dlgs-comment-preview" />' +
'<div class="form-actions">' +
'  <button type="submit" class="btn btn-primary">Submit</button>' +
'  <button type="button" class="btn btn-default">Cancel</button>' +
'</div>' +
'</form>',
    selectors: { // Selectors for main elements on form
      username: 'input[name=dlgs-participant-name]',
      email: 'input[name=dlgs-participant-email]',
      website: 'input[name=dlgs-participant-website]',
      // subscription: 'input[name=dlgs-participant-subscription]',
      body: 'textarea[name=dlgs-comment-body]',
      submit: 'button[type=submit]',
      cancel: 'button[type=button]',
      preview: 'div.dlgs-comment-preview'
    }
  },
  dateFormatter: function(date) { // Default date formatter converts it to local string
    return date.toLocaleString();
  }, 
  bodyFormatter: function(text) { // Default body formatter is plain text
    return $('<div />').text(text).html().replace(/\n/g, '<br/>');
  },
  resources: { // String resources
    anonymous: 'Anonymous'
  }
};

/*
 * Render method returns instance of this type, which can be used to 
 * manipulate with commentaries on the page.
*/ 
var DialoguesInstance = function (options) {

  options = options ? utils.deepExtend(options, DEFAULT_OPTIONS) : DEFAULT_OPTIONS;

  var dlgsHost = new DialoguesHost(options);

  this._options = options;
  this._load = options.load;
  this._render = options.render;
  this._commentsContainer = $(this._render.templateContainer).appendTo(host.$el);
  this._preloadedCommentsButton = null;

  var _preloadedComments = [];
  var _formIsOpened = false;

  var commentsView = new CommentsView(dlgsHost, this._commentsContainer);
  var formView = null;

  /*
  * When user is publishing commentaries we don't want to distract him 
  * by adding new commentaries, this is why we preload them and render
  * only when user click on post comment or when he click on show
  * new comments button.
  */
  var _renderPreloadedComments = function() {
    // Let's sort it first, who knows how we can get these updates.
    _preloadedComments.sort(function(a, b) {
      return a.date - b.date;
    });
    commentsView.add(_preloadedComments);
    commentsView.scrollToLatest();
    if (this._preloadedCommentsButton) {
      this._preloadedCommentsButton.remove();
      _preloadedComments = [];
      this._preloadedCommentsButton = null;
    }
  }.bind(this);

  host.eventAggregator.on('submitted', function(comment) {
    if (_preloadedComments.length > 0) {
      _renderPreloadedComments();
    }
    commentsView.add(comment);
    commentsView.scrollToLatest();
  });

  /*
   * Load commentaries from server
  */
  this.load = function() {
    host.connect.rest.getAll(function(err, comments) {
      if (err) {
        console.error('Cannot load comments from server, error: ' + error + ', response: ' + status);
        /* TODO: show error to user. */
        return;
      }

      host.$el.hide();
      commentsView.add(comments);
      
      if (this._options.formRender) {
        formView = new FormView(host);
      }

      host.$el.fadeIn();

      if (host.connect.socket) {
        host.connect.socket.connect();

        host.connect.sockets.subscribe({
            host: this._options.host,
            id: this._options.id
          },
          function(update) {
            var i;
            for (i = (update.comments.length - 1); i >= 0; i--) {
              if (commentsView.contains(update.comments[i])) {
                update.comments.splice(i, 1);
              }
            }

            if (_formIsOpened || _preloadedComments.length > 0) {
              // Push all un rendered comments 
              for (i = 0; i < update.comments.length; i++) {
                _preloadedComments.push(update.comments[i]);
              }

              if (_preloadedComments.length > 0 && !this._preloadedCommentsButton) {
                var render = this._options.preloadRender;
                this._preloadedCommentsButton = $(render.template).insertAfter(this._commentsContainer);
                $(render.selectors.button, this._preloadedCommentsButton)
                  .click(function() {
                    _renderPreloadedComments();
                    return false;
                  }.bind(this));
              }
            } else {
              commentsView.add(update.comments);
            }
          }.bind(this));
      }
    });
  }.bind(this);

  if (this._load && !this._load.manual) {
    if (this._load.delay) {
      var loaded = false;
      var loadOnVisible = function () {
        if (!loaded && host.$el[0].getBoundingClientRect().top <= window.innerHeight) {
          this.load();
          loaded = true;
        }
      }.bind(this);
      loadOnVisible();
      // if comments got loaded on page show - no reason to subscribe on scroll event.
      if (!loaded) {
        window.onscroll = loadOnVisible;
      }
    } else {
      this.load();
    }
  }
};

return DialoguesInstance;

});
define('dialogues',[
  './core.js'
  ], function(Dialogues) { 

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