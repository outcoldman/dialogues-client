var http = require('http'),
    fs = require('fs'),
    path = require('path'),
    url = require('url'),
    socket = require('socket.io')
    dialogues = require('dialogues')({
      storage: {
        type: 'memory', // 'mongodb'
        options: {
          path: path.join(__dirname, '.dialogues/storage') // for file storage 
        }
      }
      // , // Example how to enable akismet anti-spam module 
      // 'set-processors': [
      //   { 
      //     type: 'akismet', 
      //     options: {
      //       blog: 'http://outcold.2013.nodeknockout.com/',
      //       key: 'X'
      //     } 
      //   }
      // ]
    });

var port = 8010;

function staticResourceHandler(responce, resource, contentType) {
  var pagePath = path.join(__dirname, resource);

  responce.writeHead(200, {
    'Content-Type': contentType
  });

  fs.createReadStream(pagePath).pipe(responce);
}

app = http.createServer(function (req, res) {
  console.log('Handling request: ' + req.url);

  if (url.parse(req.url).pathname === '/api/dialogues/') {
    dialogues.httpHandler(req, res);
  } else if (req.url.indexOf('.js') > 0) {
    staticResourceHandler(res, './../../lib/' + req.url, 'text/javascript');
  } else if (req.url === '/' || req.url.indexOf('.html') >= 0) {
    staticResourceHandler(res, './page.html');
  } else {
    res.writeHead(404, {'Content-Type': 'text/html'});
    res.end('<html><body>Not found</body></html>\n');
  }
}).listen(port, function(err) {
  if (err) { console.error(err); process.exit(-1); }

  // if run as root, downgrade to the owner of this file
  if (process.getuid() === 0) {
    require('fs').stat(__filename, function(err, stats) {
      if (err) { return console.error(err); }
      process.setuid(stats.uid);
    });
  }

  console.log('Server running at http://0.0.0.0:' + port + '/');
});

io = socket.listen(app);
io.of('/api/dialogues/').on('connection', function (socket) {
  dialogues.socketHandler(socket);
});