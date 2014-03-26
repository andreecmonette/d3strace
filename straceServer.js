/*
var child_process = require('child_process');
var readline = require('readline');

var rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  stderr: process.stderr
});

rl.question("strace ", function(answer) {
  var spawnProc = answer.split(" ");
  spawnProc.unshift("-ttt");
  var echoProc = child_process.spawn("strace", spawnProc);
  var lastLine = "";
  echoProc.stderr.on('data', function (chunk) {
    var lines = chunk.toString().split("\n");
    lines[0] = lastLine + lines[0];
    lastLine = lines.pop();
    
    for (line in lines) {
      var matchArray = lines[line].match(/(\S+?) (\S+?)\((.*?)\) +\= (.*)$/)
      if (matchArray) {
      sysCalls.push({
        
        time : matchArray[1],
        call : matchArray[2],
        args : matchArray[3].split(", "),
        retVal : matchArray[4]
      });
      } else {
        sysCalls.push({
          call : lines[line]
        });
      }
    }
   

    
  console.log(sysCalls);
  });
  rl.close();

});
*/




var app = require('http').createServer(handler)
  , io = require('socket.io').listen(app)
  , fs = require('fs')
  , child_process = require('child_process');

app.listen(3000);

function handler (req, res) {
  fs.readFile(__dirname + '/index.html',
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
  socket.on('strace', function(data) {
    
    var call = data.val;
    var spawnProc = call.split(" ");
    spawnProc.unshift("-ttt");

    var echoProc = child_process.spawn("strace", spawnProc);
    var lastLine = "";

    echoProc.stderr.on('data', function (chunk) {
      
      var sysCalls = [];
      var lines = chunk.toString().split("\n");
      lines[0] = lastLine + lines[0];
      lastLine = lines.pop();
      
      for (line in lines) {
        var matchArray = lines[line].match(/(\S+?) (\S+?)\((.*?)\) +\= (.*)$/)
        if (matchArray) {
        sysCalls.push({
          
          time : matchArray[1],
          call : matchArray[2],
          args : matchArray[3].split(", "),
          retVal : matchArray[4]
        });
        } else {
          sysCalls.push({
            call : lines[line]
          });
        }
      }
      socket.emit('sysCalls', sysCalls);
    });
  
  })
});
