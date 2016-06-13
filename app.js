/***********************************************************************
 * VizScribe web application for protocol analysis
 * Code by Senthil Chandrasegaran & Karthik Badam

 * To add more time-series datasets, please see the README file.
 **********************************************************************/



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
var jwt = require('express-jwt');
var app = express();
var fs = require('fs'),
    exec = require('child_process').exec,
    util = require('util'),
    admZip = require('adm-zip');
var PythonShell = require('python-shell');

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
var sketchlog = { id: 'sketchlog' };
var speechlog = { id: 'speechlog' };
var activitylog = { id: 'activitylog' };
var outputvideo = { id: 'outputvideo', src: '' };
var outputtrans = { id: 'outputtrans', target: '' };
var outputlog = { id: 'outputlog', target: '' };
var outputSpeechLog = { id: 'outputSpeechLog', target: '' };
var outputActivityLog = { id: 'outputActivityLog', target: '' };
var userlog = { id: 'userlog' };
var clicklog = { id: 'clicklog' };

/* listen */
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
    socket.on('Start', function (data) { // data contains the variables
                                         // that we passed through in
                                         // the html file
        var Name = data['Name'];
        Files[Name] = {  //Create a new Entry in The Files Variable
            FileSize: data['Size'],
            Data: "",
            Downloaded: 0
        }
        var Place = 0;
        try {
            var Stat = fs.statSync('public/video/' + Name);
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
                Files[Name]['Handler'] = fd; // We store the file
                                             // handler so we can write
                                             // to it later
                socket.emit('MoreData', { 'Place': Place,
                                          Percent: 0,
                                          'Name': Name  });
            }
        });
    });

    socket.on('Upload', function (data) {
      var Name = data['Name'];
      Files[Name]['Downloaded'] += data['Data'].length;
      Files[Name]['Data'] += data['Data'];
      if (Files[Name]['Downloaded'] == Files[Name]['FileSize']) {
      // If File is Fully Uploaded, that is
        fs.write(Files[Name]['Handler'], Files[Name]['Data'],
                 null, 'Binary', function (err, Writen) {
          socket.emit('MoreData',
                      {'Place': Files[Name]['FileSize']/ 524288,
                       Percent: 100,
                       'Name': Name  });
          Files[Name]['Data'] = ""; //Reset The Buffer

                /* check if a zip file */
          if (Name.indexOf(".zip") >= 0) {
            var zip = new admZip('public/video/' + Name);
            zip.extractAllTo("public/images/sketches",
                             /*overwrite*/true);
          }

          socket.emit('Done', {'URL' : 'public/video/' + Name});

        });

      } else if (Files[Name]['Data'].length > 10485760) {
        //If the Data Buffer reaches 10MB
        fs.write(Files[Name]['Handler'],
                 Files[Name]['Data'], null,
                 'Binary', function (err, Writen) {
          Files[Name]['Data'] = ""; //Reset The Buffer
          var Place = Files[Name]['Downloaded'] / 524288;
          var Percent = (Files[Name]['Downloaded'] /
                         Files[Name]['FileSize']) * 100;
          socket.emit('MoreData',
                      {'Place': Place,
                       'Percent': Percent,
                       'Name': Name });
        });

      } else {
        var Place = Files[Name]['Downloaded'] / 524288;
        var Percent = (Files[Name]['Downloaded'] /
                       Files[Name]['FileSize']) * 100;
        socket.emit('MoreData',
                    {'Place': Place,
                     'Percent': Percent,
                     'Name': Name  });
      }
    });
});

// The following function launches the index.html page where the user
// uploads the data
// See views/index.html for the corresponding html file
app.get('/', function (req, res) {
  //this '/' refers to '/index.html'
  // note changing it to app.get('/index.html'... will require the
  // user to include 'index.html' in the web address.
  res.render('index.html', {
    inputvideo: inputvideo,
    inputtrans: inputtrans,
    outputvideo: outputvideo,
    outputtrans: outputtrans,
    sketchlog: sketchlog,
    speechlog: speechlog,
    activitylog: activitylog,
    outputlog: outputlog,
    outputSpeechLog: outputSpeechLog,
    outputActivityLog: outputActivityLog
  });
});

// This function renders the uploaded video
app.get('/video.html', function (req, res) {
    res.render('video.html');
});

// The next few functions handle the uploaded data and create URLs for
// the client-side code to access them.

app.post('/transcript_file', function (req, res) {
    var transcriptParams = req.body;
    outputtrans.target = transcriptParams.transcript;
    // this sets the above defined variables
    res.end();
});

app.get('/receive_transcript_file', function (req, res) {
    res.writeHead(200);
    res.write(outputtrans.target);
    res.end()
});

app.get('/log_file', function (req, res) {
    var selectedURL = url.parse(req.url, true); //creates object
    var logFileParams = selectedURL.query;
    outputlog.target = logFileParams.logFile;
    // this sets the above defined variables
    res.end();
});

app.get('/receive_log_file', function (req, res) {
    res.writeHead(200);
    res.write(outputlog.target);
    res.end()
});

app.post('/speechLog_file', function (req, res) {
    var speechLogFileParams = req.body;
    outputSpeechLog.target = speechLogFileParams.speechLogFile;
    // this sets the above defined variables
    res.end();
});

app.get('/receive_speechLog_file', function (req, res) {
    res.writeHead(200);
    res.write(outputSpeechLog.target);
    res.end();
});

app.post('/activityLog_file', function (req, res) {
    var activityLogFileParams = req.body;
    outputActivityLog.target = activityLogFileParams.activityLogFile;
    // this sets the above defined variables
    res.end();
});

app.get('/receive_activityLog_file', function (req, res) {
    res.writeHead(200);
    res.write(outputActivityLog.target);
    res.end()
});

app.get('/receive_video_file', function (req, res) {
    res.writeHead(200);
    res.write(outputvideo.src);
    res.end()
});

app.get('/video_parameters', function (req, res) {
    var selectedURL = url.parse(req.url, true); //creates object
    var videoParams = selectedURL.query;
    outputvideo.src = videoParams.videoURL;
    res.end();
});

// This function handles the main.html file, which is the VizScribe
// interface. See views/main.html for the corresponding file
app.get('/main', function (req, res) {
    console.log('video ' + outputvideo.src);
    res.render('main.html', {
        inputvideo: inputvideo,
        inputtrans: inputtrans,
        outputvideo: outputvideo,
        outputtrans: outputtrans,
        sketchlog: sketchlog,
        speechlog: speechlog,
        activitylog: activitylog,
        outputlog: outputlog,
        outputSpeechLog: outputSpeechLog,
        outputActivityLog: outputActivityLog
    });
});

// This annotator bit is to use the annotator library to allow
// annotation of the transcribed text.
/*
app.get('/annotator-token',
    jwt({secret: 'dc176c29-23da-4a19-bc5f-061d45e6d0f4',
         consumerKey: '0cc039fa9d414ddeb43f83447d6838e7',
         userID: 'senthil',
         issuedAt: '2014-09-09T10:51:18Z',
         ttl: 86400}),
    function(req, res){
      // if (!req.user.admin) return res.send(401);
      console.log("token received!");
      res.send(200);
});
*/

// records a log of user activity
app.post('/userlog', function (req, res){
  // write user log file as text
  fs.writeFile('public/userlog/userlog.csv', String(req.body.data),
               function (err) {
    if (err) throw err;
    console.log('userlog.csv was written');
    res.send(200);
  });
});

app.post('/clicklog', function (req, res){
  //res.send(req.body);
  // write user log file as text
  fs.writeFile('public/clicklog/clicklog.csv', String(req.body.data),
               function (err) {
    if (err) throw err;
    console.log('clicklog.csv was written');
    res.send(200);
  });
});

var options = {
  mode: 'text',
  pythonOptions: ['-u'],
  scriptPath: './public/pythonscripts/',
};


// This function works, but needs better data handling, and as such is
// not called right now. The idea is to scale or sort the word cloud
// based on the information content of each word.
app.post('/infoContent', function (req, res){
  // invoke this just once, and send all the data over to the client.
  // This will make the code more responsive.
  var pyShell = new PythonShell('infoContent.py', options)
  pyShell.send(req.body.data);
  pyShell.on('message', function(message){
    res.send(200, {data: message});
  });
  pyShell.end(function(err){
    if (err) throw err;
  });
});

