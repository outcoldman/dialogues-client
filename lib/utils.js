define(function() { 'use strict';

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