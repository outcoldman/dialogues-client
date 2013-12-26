define([
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
) { 'use strict';

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