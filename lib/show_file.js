'use strict';

const fs = require('fs');
const path = require('path');

const mime = require('./mime');
const showError = require('./show_error');

module.exports = function(filename, uri, resp) {
  // eslint-disable-next-line node/prefer-promises/fs
  fs.readFile(filename, { encoding: 'binary' }, function(err, html) {
    if (err) {
      showError.show404(resp);
    } else {
      const extName = path.extname(filename).substr(1);
      try {
        if (mime[extName]) {
          resp.setHeader('content-type', mime[extName]);
        } else {
          resp.setHeader('content-type', 'application/' + extName);
        }
      } catch (e) {
        // ...
      }

      resp.statusCode = 200;
      resp.setHeader(
        'X-Powered-By',
        'Death Moon\'s Tiny Static Server [https://github.com/XadillaX/ntss] ' +
          `(Node.js ${process.version})`);
      resp.write(html, 'binary');
      resp.end();
    }
  });
};
