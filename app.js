
/**
 * Module dependencies.
 */

var express = require('express');
var routes = require('./routes');
var user = require('./routes/user');
var http = require('http');
var path = require('path');
var ejs = require('ejs');
var url = require('url');
var resumable = require('resumable');

var app = express();

// all environments
app.set('port', process.env.PORT || 3000);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.json());
app.use(express.urlencoded());
app.use(express.methodOverride());
app.use(express.cookieParser('your secret here'));
app.use(express.session());
app.use(app.router);
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.bodyParser());
app.engine('html', require('ejs').renderFile);

// development only
if ('development' == app.get('env')) {
  app.use(express.errorHandler());
}
// variables for video and transcript:
var inputvideo =  { id: 'inputvideo'};
var inputtrans =  { id: 'inputtrans'};
var outputvideo =  { id: 'outputvideo', src: ''};
var outputtrans =  { id: 'outputtrans', target: ''};


// BEGIN CODE COPIED FROM RESUMABLE
/*
app.post('/upload', function(req, res){
	// console.log(req);
    resumable.post(req, function(status, 
                                 filename, 
                                 original_filename, 
                                 identifier){
        console.log('POST', status, original_filename, identifier);
        res.send(status, {
          // NOTE: Uncomment this funciton to enable cross-domain
          // request.
          //'Access-Control-Allow-Origin': '*'
        });
    });
});

// Handle status checks on chunks through Resumable.js
app.get('/upload', function(req, res){
    resumable.get(req, function(status, 
                                filename, 
                                original_filename, 
                                identifier){
        console.log('GET', status);
        res.send(status, (status == 'found' ? 200 : 404));
      });
  });

app.get('/download/:identifier', function(req, res){
    resumable.write(req.params.identifier, res);
});

/*
app.get('/resumable.js', function (req, res) {
  var fs = require('fs');
  res.setHeader("content-type", "application/javascript");
  fs.createReadStream("./public/resumable.js").pipe(res);
});
app.listen(3000);
*/
// END CODE COPIED FROM RESUMABLE 

// THIS IS OLDER CODE, COMMENTED FOR NOW
app.get('/', function (req, res) //this '/' refers to '/index.html'
        // note changing it to app.get('/index.html'... will require the
        // user to include 'index.html' in the web address.
{
    res.render('index.html', {
      inputvideo: inputvideo,
      inputtrans: inputtrans,
      outputvideo: outputvideo,
      outputtrans: outputtrans
    });
});

app.get('/main.html', function (req, res)
{
    res.render('main.html', {
      inputvideo: inputvideo,
      inputtrans: inputtrans,
      outputvideo: outputvideo,
      outputtrans: outputtrans
    });
});

// app.post('/transcript_file', function (req, res) { 
//   var selectedUrl = String(req.body.url); 
//   console.log("Requested URL -" + selectedUrl); 
// });

app.get('/transcript_file', function (req, res) { 
  var selectedURL = url.parse(req.url, true); //creates object
  var transcriptParams = selectedURL.query;
  console.log(transcriptParams.transcript);
  outputtrans.target = transcriptParams.transcript;
  // this sets the above defined variables
  res.end();
});

app.get('/receive_transcript_file', function (req, res) { 
  res.writeHead(200);
  res.write(outputtrans.target);
  res.end()
});

app.get('/video_parameters', function (req, res) { 
  var selectedURL = url.parse(req.url, true); //creates object
  var videoParams = selectedURL.query;
  outputvideo.src = videoParams.videoURL;
  res.end();
});

app.get('/main', function (req, res)
{
    console.log('video '+ outputvideo.src);
    res.render('main.html', {
      inputvideo: inputvideo,
      inputtrans: inputtrans,
      outputvideo: outputvideo,
      outputtrans: outputtrans
    });
});

http.createServer(app).listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});
// END OF OLDER CODE, UNCOMMENT IF RESUMABLE DOES NOT WORK
