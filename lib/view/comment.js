define([
  './../jQuery',
  './../utils'
], function($, utils) { 'use strict';

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