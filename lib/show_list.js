'use strict';

const fs = require('fs');
const path = require('path');

const async = require('async');
const ejs = require('ejs');

const showError = require('./show_error');

let html = '';
const listPage = process.cwd() + '//pages//list.ejs';

module.exports = function(dir, uri, resp) {
  async.series({
    list(callback) {
      // eslint-disable-next-line node/prefer-promises/fs
      fs.readdir(dir, function(err, list) {
        callback(err, list);
      });
    },

    html(callback) {
      if (!html) {
        // eslint-disable-next-line node/prefer-promises/fs
        fs.readFile(listPage, 'binary', function(err, h) {
          if (err) {
            callback(err);
          } else {
            html = h;
            callback(null, html);
          }
        });
      } else {
        callback(null, html);
      }
    },
  }, function(err, result) {
    if (err) {
      showError.show502(uri, resp);
    } else {
      resp.setHeader('content-type', 'text/html');
      resp.send(
        200,
        ejs.render(
          result.html, {
            list: result.list,
            baseUri: path.normalize(uri.pathname.substr(1)),
          }));
    }
  });
};
