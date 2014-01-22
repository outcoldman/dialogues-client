define([
  './../jQuery',
  './../connect/rest',
  './../storage',
  './../cookies'
],
function($, RestClient, storage, cookies) { 'use strict';

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

  that.$placeholder = $(formRender.templatePlaceholder).appendTo(dlgsHost.$el);
  that.$form = $(formRender.template.replace(/{id}/g, dialoguesId)).appendTo(dlgsHost.$el).hide();
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