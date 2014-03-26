var child_process = require('child_process');
var readline = require('readline');

var rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  stderr: process.stderr
});
var sysCalls = [];

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

