window.onload = function() {
  var socket = io.connect('http://localhost:3000');
  var FReaderVideo;
  var FReaderImages;
  // var Name;

    //Check File API support
    if (window.File && window.FileList && window.FileReader) {
        var filesInput = document.getElementById("VideoFileBox");
        var filesInput2 = document.getElementById(inputtrans.id);
        var filesInput3 = document.getElementById("ZipFileBox");
        var filesInput4 = document.getElementById(sketchlog.id);

        // Read video
        filesInput.addEventListener("change", function (event) {
            var videofiles = event.target.files; //FileList object
            var output = document.getElementById(outputvideo.id);
            var SelectedVideoFile = event.target.files[0];

            if (document.getElementById('VideoFileBox').value != "") {
                FReaderVideo = new FileReader();
                var vidName = videofiles[0].name;
                /*
                var Content = "<span id='NameArea'>Uploading " + SelectedVideoFile.name + " as " + vidName + "</span>";
                Content += '<div id="ProgressContainer"><div id="ProgressBar"></div></div><span id="percent">0%</span>';
                Content += "<span id='Uploaded'> - <span id='MB'>0</span>/" + Math.round(SelectedVideoFile.size / 1048576) + "MB</span>";
                document.getElementById('UploadArea').innerHTML = Content;
                */
                FReaderVideo.onload = function (evnt) {
                    socket.emit('Upload', { 'Name': vidName, Data: evnt.target.result });
                }
                socket.emit('Start', { 'Name': vidName, 'Size': SelectedVideoFile.size });
            } else {
                alert("Please Select A File");
            }

            socket.on('MoreData', function (data) {
                if (data['Name'].indexOf('zip') < 0) {
                    UpdateVideoBar(data['Percent']);
                    var Place = data['Place'] * 524288; //The Next Blocks Starting Position
                    var NewFile; //The Variable that will hold the new Block of Data
                    if (SelectedVideoFile.slice)
                        NewFile = SelectedVideoFile.slice(Place, Place + Math.min(524288, (SelectedVideoFile.size - Place)));
                    else
                        NewFile = SelectedVideoFile.mozSlice(Place, Place + Math.min(524288, (SelectedVideoFile.size - Place)));
                    FReaderVideo.readAsBinaryString(NewFile);
                }
            });

            socket.on('Done', function (data) {
                /*
                $("#UploadArea").empty();
                var Content = "Video Successfully Uploaded !!"
                console.log(Content);
                */
            });
            function Refresh() {
                location.reload(true);
            }

            function UpdateVideoBar(percent) {
                $('#videoProgress').attr("value", percent);
                console.log($('#videoProgress').attr("value"));
                //document.getElementById('ProgressBar').style.width = percent + '%';
                document.getElementById('vidProg').innerHTML = (Math.round(percent * 100) / 100) + '%';
                var MBDone = Math.round(((percent / 100.0) * SelectedVideoFile.size) / 1048576);
                document.getElementById('videoMB').innerHTML = MBDone+'/'+Math.round(SelectedVideoFile.size/1048576)+' MB';
            }


            for (var i = 0; i < videofiles.length; i++) {
                var videofile = videofiles[i];
                var vidReader = new FileReader();
                var videofileURL = URL.createObjectURL(videofile);
                outputvideo.src = videofileURL.split(":")[1];
                console.log("video almost read!");
                console.log("File URL = " + videofileURL);

                $.ajax({
                    type: "GET",
                    url: "/video_parameters",
                    data: { videoURL: "video/" + videofile.name }
                }).done(function (msg) {
                    //alert("Video Saved: " + msg);
                });

                vidReader.addEventListener("load", function (event) {
                    var videofileURL = URL.createObjectURL(videofile);
                    outputvideo.src = videofileURL;
                    console.log("video almost read!");
                    console.log("File URL = " + videofileURL);
                });
                console.log("video read!");
            }
        });

        // Read zip images
        filesInput3.addEventListener("change", function (event) {
            var imgfiles = event.target.files; //FileList object
            var output = document.getElementById("zipFileOutput");
            SelectedImgFile = event.target.files[0];

            if (document.getElementById('ZipFileBox').value != "") {
                FReaderImages = new FileReader();
                var imgName = imgfiles[0].name;
                /*
                var Content = "<span id='NameArea'>Uploading " + SelectedImgFile.name + " as " + imgName + "</span>";
                Content += '<div id="ProgressContainer"><div id="ProgressBar"></div></div><span id="percent">0%</span>';
                Content += "<span id='Uploaded'> - <span id='MB'>0</span>/" + Math.round(SelectedImgFile.size / 1048576) + "MB</span>";
                document.getElementById('UploadArea').innerHTML = Content;
                */
                FReaderImages.onload = function (evnt) {
                    socket.emit('Upload', { 'Name': imgName, Data: evnt.target.result });
                }
                socket.emit('Start', { 'Name': imgName, 'Size': SelectedImgFile.size });
            } else {
                alert("Please Select A File");
            }

            socket.on('MoreData', function (data) {
                if (data['Name'].indexOf('zip') > 0) {
                    UpdateImageBar1(data['Percent']);
                    var Place = data['Place'] * 524288; //The Next Blocks Starting Position
                    var NewFile; //The Variable that will hold the new Block of Data
                    if (SelectedImgFile.slice)
                        NewImgFile = SelectedImgFile.slice(Place, Place + Math.min(524288, (SelectedImgFile.size - Place)));
                    else
                        NewImgFile = SelectedImgFile.mozSlice(Place, Place + Math.min(524288, (SelectedImgFile.size - Place)));
                    FReaderImages.readAsBinaryString(NewImgFile);
                }
            });

            socket.on('Done', function (data) {
                $("#UploadArea").remove();
                var Content = "Zip File Successfully Uploaded !!"
                //console.log(Content);
            });
            function Refresh() {
                location.reload(true);
            }

            function UpdateImageBar1(percent) {
                $('#imageProgress').attr("value", percent);
                console.log($('#imageProgress').attr("value"));
                //document.getElementById('ProgressBar').style.width = percent + '%';
                document.getElementById('imgProg').innerHTML = (Math.round(percent * 100) / 100) + '%';
                var MBDone = Math.round(((percent / 100.0) * SelectedImgFile.size) / 1048576);
                document.getElementById('imageMB').innerHTML = MBDone+'/'+Math.round(SelectedImgFile.size/1048576)+' MB';
                /*
                document.getElementById('ProgressBar').style.width = percent + '%';
                document.getElementById('percent').innerHTML = (Math.round(percent * 100) / 100) + '%';
                var MBDone = Math.round(((percent / 100.0) * SelectedImgFile.size) / 1048576);
                document.getElementById('MB').innerHTML = MBDone;
                */
            }


            for (var i = 0; i < imgfiles.length; i++) {
                var imgfile = imgfiles[i];
                var picReader = new FileReader();
                var imgfileURL = URL.createObjectURL(imgfile);
                outputvideo.src = imgfileURL.split(":")[1];
                console.log("Zip almost read!");
                console.log("File URL = " + imgfileURL);

                //$.ajax({
                //    type: "GET",
                //    url: "/video_parameters",
                //    data: { videoURL: "zip/" + file.name }
                //}).done(function (msg) {
                //    //alert("Video Saved: " + msg);
                //});

                picReader.addEventListener("load", function (event) {
                    var imgfileURL = URL.createObjectURL(imgfile);
                    outputvideo.src = imgfileURL;
                    console.log("Zip almost read!");
                    console.log("File URL = " + imgfileURL);
                });
                console.log("Zip read!");
            }

        });
        // Read transcript and print result on the same page
        filesInput2.addEventListener("change", function (event) {
            var files = event.target.files; //FileList object
            var output = document.getElementById(outputtrans.id);
            for (var i = 0; i < files.length; i++) {
                var file = files[i];
                //Only plain text
                //if (!file.type.match('plain')) continue;
                var picReader = new FileReader();
                picReader.addEventListener("load", function (event) {
                    //outputtrans.target = event.target;
                    var textFile = event.target;
                    // var div = document.createElement("div");
                    // div.innerText = textFile.result;
                    console.log(textFile.result.toString());
                    // output.insertBefore(div, null);

                    $.ajax({
                        type: "GET",
                        url: "/transcript_file",
                        data: { transcript: textFile.result.toString() }
                    }).done(function (msg) {
                        console.log("Transcript Saved: " + msg);
                    });
                });

                //Read the text file
                picReader.readAsText(file);
                console.log("transcript read!");
            }
        });

        // Read transcript and print result on the same page
        filesInput4.addEventListener("change", function (event) {
            var files = event.target.files; //FileList object
            var output = document.getElementById(outputtrans.id);
            for (var i = 0; i < files.length; i++) {
                var file = files[i];
                //Only plain text
                //if (!file.type.match('plain')) continue;
                var logReader = new FileReader();
                logReader.addEventListener("load", function (event) {
                    //outputtrans.target = event.target;
                    var textFile = event.target;
                    // var div = document.createElement("div");
                    // div.innerText = textFile.result;
                    console.log("log file: " +
                                textFile.result.toString());
                    //output.insertBefore(div, null);

                    $.ajax({
                        type: "GET",
                        url: "/log_file",
                        data: { logFile: textFile.result.toString() }
                    }).done(function (msg) {
                        console.log("Logfile Saved: " + msg);
                    });
                });

                //Read the text file
                logReader.readAsText(file);
                console.log("logfile read!");
            }
        });
    }
    else {
        console.log("Your browser does not support File API");
    }
}
