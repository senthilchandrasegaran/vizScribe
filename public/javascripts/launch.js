// A misguided attempt to load a local html file using Node. 
// This didn't work: it loads the file, but does not support any
// interactions.
var http = require('http');
var fs = require('fs');
http.createServer(function(request, response) {
  fs.readFile('main.html', function(err, contents){
    response.writeHead(200, {'Content-Type': 'text/html'}); // header
    // status code
    response.write(contents); // response body
    response.end(); // this closes the connection
  });
}).listen(8080);
console.log('Listening on port 8080..');
