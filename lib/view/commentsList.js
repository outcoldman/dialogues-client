define([
  './../jQuery',
  './comment'
], function($, CommentView) {

var CommentsListView = function(dlgsHost, $container) {
  var that = this;

  that.$container = $container;
  var _commentViews = [];
  var _preloadedComments = null;

  that.contains = function(comment) {
    for (var index = 0; index < _commentViews.length; index++) {
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