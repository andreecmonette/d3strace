var app = require('http').createServer(handler)
  , io = require('socket.io').listen(app)
  , fs = require('fs')
  , child_process = require('child_process');

app.listen(3000);

function handler (req, res) {
  //console.log(req);
  fs.readFile(__dirname + "/straceGraph.html",
  function (err, data) {
    if (err) {
      res.writeHead(500);
      return res.end('Error loading index.html');
    }

    res.writeHead(200);
    res.end(data);
  });
}

io.sockets.on('connection', function (socket) {
  var index = 0;
  socket.on('strace', function(data) {
    var call = data.val;
    var spawnProc = call.split(" ");
    spawnProc.unshift("dtruss");

    console.log(spawnProc)
    var echoProc = child_process.spawn("sudo", spawnProc);
    var lastLine = "";

    echoProc.stderr.on('data', function (chunk) {
      var sysCalls = [];
      var lines = chunk.toString().split("\n");
      lines.pop();
      lines[0] = lastLine + lines[0];
      lastLine = lines.pop();
      
      for (line in lines) {
        var call = lines[line].split('(')[0];
        sysCalls.push({
          call: call
        });
      }
      socket.emit('sysCalls', {index:index++, content:sysCalls});
    });

    echoProc.stdout.on('data', function(chunk) {
      socket.emit('stdout', {content:chunk.toString().split('\n')})
    })
  })
});
