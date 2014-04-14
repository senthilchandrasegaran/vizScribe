
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
var fs = require('fs'),
  exec = require('child_process').exec,
  util = require('util');

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

/* uploaded files */
var Files = {};

// development only
if ('development' == app.get('env')) {
    app.use(express.errorHandler());
}
// variables for video and transcript:
var inputvideo = { id: 'inputvideo' };
var inputtrans = { id: 'inputtrans' };
var outputvideo = { id: 'outputvideo', src: '' };
var outputtrans = { id: 'outputtrans', target: '' };

/* polychrome listen */
var httpserver = http.createServer(app);
httpserver.listen(app.get('port'), function () {
    console.log('Express server listening on port ' + app.get('port'));
});

/* socket io */
var io = require('socket.io').listen(httpserver);

// Delete this row if you want to see debug messages
io.set('log level', 1);

/* socket.io for uploaded videos */
io.sockets.on('connection', function (socket) {
    socket.on('Start', function (data) { //data contains the variables that we passed through in the html file
        var Name = data['Name'];
        Files[Name] = {  //Create a new Entry in The Files Variable
            FileSize: data['Size'],
            Data: "",
            Downloaded: 0
        }
        var Place = 0;
        try {
            var Stat = fs.statSync('public/video' + Name);
            if (Stat.isFile()) {
                Files[Name]['Downloaded'] = Stat.size;
                Place = Stat.size / 524288;
                
            }
        }
        catch (er) { } //It's a New File
        fs.open("public/video/" + Name, "a", 0755, function (err, fd) {
            if (err) {
                console.log(err);
            }
            else {
                Files[Name]['Handler'] = fd; //We store the file handler so we can write to it later
                socket.emit('MoreData', { 'Place': Place, Percent: 0 });
            }
        });
    });

    socket.on('Upload', function (data) {
        var Name = data['Name'];
        Files[Name]['Downloaded'] += data['Data'].length;
        Files[Name]['Data'] += data['Data'];
        if (Files[Name]['Downloaded'] == Files[Name]['FileSize']) //If File is Fully Uploaded
        {
            fs.write(Files[Name]['Handler'], Files[Name]['Data'], null, 'Binary', function (err, Writen) {
                socket.emit('MoreData', { 'Place': Files[Name]['FileSize']/ 524288, Percent: 100 });
                socket.emit('Done', {'URL' : 'public/video/' + Name});
            });
        }
        else if (Files[Name]['Data'].length > 10485760) { //If the Data Buffer reaches 10MB
            fs.write(Files[Name]['Handler'], Files[Name]['Data'], null, 'Binary', function (err, Writen) {
                Files[Name]['Data'] = ""; //Reset The Buffer
                var Place = Files[Name]['Downloaded'] / 524288;
                var Percent = (Files[Name]['Downloaded'] / Files[Name]['FileSize']) * 100;
                socket.emit('MoreData', { 'Place': Place, 'Percent': Percent });
            });
        }
        else {
            var Place = Files[Name]['Downloaded'] / 524288;
            var Percent = (Files[Name]['Downloaded'] / Files[Name]['FileSize']) * 100;
            socket.emit('MoreData', { 'Place': Place, 'Percent': Percent });
        }
    });
});


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

app.get('/video.html', function (req, res) {
    res.render('video.html');
});


app.get('/main.html', function (req, res) {
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

app.get('/main', function (req, res) {
    console.log('video ' + outputvideo.src);
    res.render('main.html', {
        inputvideo: inputvideo,
        inputtrans: inputtrans,
        outputvideo: outputvideo,
        outputtrans: outputtrans
    });
});

//http.createServer(app).listen(app.get('port'), function(){
//  console.log('Express server listening on port ' + app.get('port'));
//});
// END OF OLDER CODE, UNCOMMENT IF RESUMABLE DOES NOT WORK
