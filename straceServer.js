var app = require('http').createServer(handler)
  , io = require('socket.io').listen(app)
  , fs = require('fs')
  , child_process = require('child_process')
  , os = require('os');

app.listen(3000);

var stop = false;
var proces = [];
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
  var proc = null;

  socket.on('stop', function(data) {
    stop = true;
  })

  var index = 0;
  socket.on('strace', function(data) {
    var call = data.val;

    if (proc != null) {
      proc.stdin.write(data);
    } else {
      var spawnProc = call.split(" ");
      //osx
      spawnProc.unshift('sudo -u damian')
      spawnProc.unshift("dtruss");
      var proc = child_process.spawn("sudo", spawnProc);

      /*linux
      spawnProc.unshift("-ttt");
      var echoProc = child_process.spawn("strace", spawnProc);
      */

      var lastLine = "";

      proc.stderr.on('data', function (chunk) {
        if (stop == false) {
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
        } else {
          proc.stderr.end();
          stop = false;
        }
      });

      proc.stdout.on('data', function(chunk) {
        socket.emit('stdout', {content:chunk.toString().split('\n')})
      })

      proc.on('close', function() {
        socket.emit('stdout', {content:'closed'});
        proc = null;
      })
    }
  })
});
