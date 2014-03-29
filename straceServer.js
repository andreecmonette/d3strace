var app = require('http').createServer(handler)
  , io = require('socket.io').listen(app)//, {log : false})
  , fs = require('fs')
  , child_process = require('child_process');

app.listen(3000);

function handler (req, res) {
  // For local testing:
  if (req.url == "/d3.v3.min.js") {
  fs.readFile(__dirname + "/d3.min.js",
  function (err, data) {
    if (err) {
      res.writeHead(500);
      return res.end('console.log("Error loading D3");');
      }
    res.writeHead(200, {'Content-Type': 'text/javascript'});
    res.end(data);
  });
  } else {
  
  
  fs.readFile(__dirname + "/straceGraph.html",
  function (err, data) {
    if (err) {
      res.writeHead(500);
      return res.end('Error loading graph');
    }
    
    res.writeHead(200);
    res.end(data);
  });
   }
}

io.sockets.on('connection', function (socket) {
  socket.on('strace', function(data) {
    var index = 0;
    var call = data.val;
    var spawnProc = call.split(" ");
    spawnProc.unshift("-ttt");

    var echoProc = child_process.spawn("strace", spawnProc);
    var lastLine = "";


    var stdOutIndex = 0;

    echoProc.stdout.on('data', function (chunk) {
      socket.emit('stdOutData', {index: stdOutIndex++, content: chunk.toString()});
    });

    




    echoProc.stderr.on('data', function (chunk) {
      
      var sysCalls = [];
      var lines = chunk.toString().split("\n");
      lines[0] = lastLine + lines[0];
      lastLine = lines.pop();
      
      for (line in lines) {
        var matchArray = lines[line].match(/^(\S+?) (\S+?)\((.*?)\) +\= (.*)$/)
        if (matchArray) {
        sysCalls.push({
          
          time : matchArray[1],
          call : matchArray[2],
          args : matchArray[3].split(", "),
          retVal : matchArray[4]
        });
        } else {
          // errors
          //sysCalls.push({
          //  call : lines[line]
          //});
        }
      }
      socket.emit('sysCalls', {index:index++, content:sysCalls});
    });
  
  })
});
