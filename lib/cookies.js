define(function() { 'use strict';

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