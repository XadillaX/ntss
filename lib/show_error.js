'use strict';

const fs = require('fs');
const path = require('path');

const ejs = require('ejs');

function showXXX(status) {
  const filename = path.join(__dirname, `../pages/${status}.ejs`);
  let html;
  return function(uri, resp) {
    if (html) {
      resp.send(status, html);
      resp.send(status, ejs.render(html, { uri }));
    }

    // eslint-disable-next-line node/prefer-promises/fs
    fs.readFile(filename, 'utf8', function(err, _html) {
      if (err) {
        resp.send(status, `${status} Error`);
      } else {
        html = _html;
        resp.setHeader('content-type', 'text/html');
        resp.send(status, ejs.render(html, { uri }));
      }
    });
  };
}

exports.show403 = showXXX(403);
exports.show502 = showXXX(502);
exports.show404 = showXXX(404);
