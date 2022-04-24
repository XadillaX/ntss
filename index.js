'use strict';

const fs = require('fs');
const path = require('path');
const querystring = require('querystring');
const url = require('url');

const argv = require('optimist').argv;
const log4js = require('log4js');

const showError = require('./lib/show_error');
const showFile = require('./lib/show_File');
const showList = require('./lib/show_list');

const logger = log4js.getLogger();
logger.level = 'trace';

let directory = argv.path ? argv.path : '.';
const port = argv.port ? argv.port : 80;
let defaultPage = argv.default ?
  argv.default :
  'index.html|index.htm|default.html|default.htm';
const notListIndex = argv.nlist ? argv.nlist : false;

defaultPage = defaultPage.split('|');
directory = path.resolve(process.cwd(), directory);
if (argv.path && argv.path.indexOf('~') === 0) {
  directory = argv.path;
}

function getIp(req) {
  if (req.headers['cf-connecting-ip']) {
    return req.headers['cf-connecting-ip'];
  } else if (req.headers['x-real-ip']) {
    return req.headers['x-real-ip'];
  }
  return req.socket.remoteAddress;

}

function strengthResp(resp) {
  resp.send = function(status, html) {
    resp.statusCode = status;

    if (typeof html === 'object') {
      html = JSON.stringify(html, null, 2);
    }

    if (undefined === resp.getHeader('content-type')) {
      resp.setHeader('content-type', 'text/plain');
    }

    resp.setHeader(
      'X-Powered-By',
      'Death Moon\'s Tiny Static Server [https://github.com/XadillaX/ntss] ' +
        `(Node.js ${process.version})`);
    resp.write(html);
    resp.end();
  };
}

const http = require('http');
http.createServer(function(req, resp) {
  // parse req...
  let u = url.parse(req.url);
  u = {
    originalUrl: req.url,
    pathname: '.' + u.pathname,
    query: querystring.parse(u.query),
    sharp: '',
  };

  const log = `[${getIp(req)}] visited "${u.originalUrl}", ` +
    `UA: ${req.headers['user-agent']}`;
  logger.trace(log);

  strengthResp(resp);

  // path...
  if (u.pathname.indexOf('/../') !== -1) {
    showError.show404(u, resp);
    return;
  }


  const dir = path.resolve(directory, u.pathname);

  // eslint-disable-next-line node/prefer-promises/fs
  fs.stat(dir, function(err, stats) {
    // console.log(err);
    if (err) {
      if (err.code === 'ENOENT') {
        showError.show404(u, resp);
      } else {
        showError.show502(u, resp);
      }
      return;
    }

    // directory...
    if (stats.isDirectory()) {
      for (let i = 0; i < defaultPage.length; i++) {
        const filename = path.normalize(dir + '/' + defaultPage[i]);

        try {
          stats = fs.statSync(filename);
          if (stats.isDirectory()) {
            continue;
          }

          // console.log(filename);
          showFile(filename, u, resp);
          return;
        } catch (e) {
          // ...
        }
      }

      // ... list
      if (!notListIndex) {
        showList(dir, u, resp);
      } else {
        showError.show403(u, resp);
      }
    } else {
      showFile(dir, u, resp);
    }
  });
}).listen(port);

logger.info('Node Tiny Static Server started at port ' + port + '.');
logger.info('Static directory: [ ' + directory + ' ].');
