var socket = io.connect('http://localhost:3000');
var FReader;
var Name;

window.onload = function () {
    //Check File API support
    if (window.File && window.FileList && window.FileReader) {
        var filesInput = document.getElementById("VideoFileBox");
        var filesInput2 = document.getElementById(inputtrans.id);
        var filesInput3 = document.getElementById("ZipFileBox");

        // Read video
        filesInput.addEventListener("change", function (event) {
            var files = event.target.files; //FileList object
            var output = document.getElementById(outputvideo.id);
            SelectedFile = event.target.files[0];

            if (document.getElementById('VideoFileBox').value != "") {
                FReader = new FileReader();
                Name = files[0].name;
                var Content = "<span id='NameArea'>Uploading " + SelectedFile.name + " as " + Name + "</span>";
                Content += '<div id="ProgressContainer"><div id="ProgressBar"></div></div><span id="percent">0%</span>';
                Content += "<span id='Uploaded'> - <span id='MB'>0</span>/" + Math.round(SelectedFile.size / 1048576) + "MB</span>";
                document.getElementById('UploadArea').innerHTML = Content;
                FReader.onload = function (evnt) {
                    socket.emit('Upload', { 'Name': Name, Data: evnt.target.result });
                }
                socket.emit('Start', { 'Name': Name, 'Size': SelectedFile.size });
            } else {
                alert("Please Select A File");
            }

            socket.on('MoreData', function (data) {
                UpdateBar(data['Percent']);
                var Place = data['Place'] * 524288; //The Next Blocks Starting Position
                var NewFile; //The Variable that will hold the new Block of Data
                if (SelectedFile.slice)
                    NewFile = SelectedFile.slice(Place, Place + Math.min(524288, (SelectedFile.size - Place)));
                else
                    NewFile = SelectedFile.mozSlice(Place, Place + Math.min(524288, (SelectedFile.size - Place)));
                FReader.readAsBinaryString(NewFile);
            });

            socket.on('Done', function (data) {
                $("#UploadArea").empty();
                var Content = "Video Successfully Uploaded !!"
                alert(Content);
            });
            function Refresh() {
                location.reload(true);
            }

            function UpdateBar(percent) {
                document.getElementById('ProgressBar').style.width = percent + '%';
                document.getElementById('percent').innerHTML = (Math.round(percent * 100) / 100) + '%';
                var MBDone = Math.round(((percent / 100.0) * SelectedFile.size) / 1048576);
                document.getElementById('MB').innerHTML = MBDone;
            }


            for (var i = 0; i < files.length; i++) {
                var file = files[i];
                var picReader = new FileReader();
                var fileURL = URL.createObjectURL(file);
                outputvideo.src = fileURL.split(":")[1];
                console.log("video almost read!");
                console.log("File URL = " + fileURL);

                $.ajax({
                    type: "GET",
                    url: "/video_parameters",
                    data: { videoURL: "video/" + file.name }
                }).done(function (msg) {
                    //alert("Video Saved: " + msg);
                });

                picReader.addEventListener("load", function (event) {
                    var fileURL = URL.createObjectURL(file);
                    outputvideo.src = fileURL;
                    console.log("video almost read!");
                    console.log("File URL = " + fileURL);
                });
                console.log("video read!");
            }

        });

        // Read zip images
        filesInput3.addEventListener("change", function (event) {
            var files = event.target.files; //FileList object
            var output = document.getElementById("zipFileOutput");
            SelectedFile = event.target.files[0];

            if (document.getElementById('ZipFileBox').value != "") {
                FReader = new FileReader();
                Name = files[0].name;
                var Content = "<span id='NameArea'>Uploading " + SelectedFile.name + " as " + Name + "</span>";
                Content += '<div id="ProgressContainer"><div id="ProgressBar"></div></div><span id="percent">0%</span>';
                Content += "<span id='Uploaded'> - <span id='MB'>0</span>/" + Math.round(SelectedFile.size / 1048576) + "MB</span>";
                document.getElementById('UploadArea').innerHTML = Content;
                FReader.onload = function (evnt) {
                    socket.emit('Upload', { 'Name': Name, Data: evnt.target.result });
                }
                socket.emit('Start', { 'Name': Name, 'Size': SelectedFile.size });
            } else {
                alert("Please Select A File");
            }

            socket.on('MoreData', function (data) {
                UpdateBar(data['Percent']);
                var Place = data['Place'] * 524288; //The Next Blocks Starting Position
                var NewFile; //The Variable that will hold the new Block of Data
                if (SelectedFile.slice)
                    NewFile = SelectedFile.slice(Place, Place + Math.min(524288, (SelectedFile.size - Place)));
                else
                    NewFile = SelectedFile.mozSlice(Place, Place + Math.min(524288, (SelectedFile.size - Place)));
                FReader.readAsBinaryString(NewFile);
            });

            socket.on('Done', function (data) {
                $("#UploadArea").remove();
                var Content = "Zip File Successfully Uploaded !!"
                alert(Content);
            });
            function Refresh() {
                location.reload(true);
            }

            function UpdateBar(percent) {
                document.getElementById('ProgressBar').style.width = percent + '%';
                document.getElementById('percent').innerHTML = (Math.round(percent * 100) / 100) + '%';
                var MBDone = Math.round(((percent / 100.0) * SelectedFile.size) / 1048576);
                document.getElementById('MB').innerHTML = MBDone;
            }


            for (var i = 0; i < files.length; i++) {
                var file = files[i];
                var picReader = new FileReader();
                var fileURL = URL.createObjectURL(file);
                outputvideo.src = fileURL.split(":")[1];
                console.log("Zip almost read!");
                console.log("File URL = " + fileURL);

                //$.ajax({
                //    type: "GET",
                //    url: "/video_parameters",
                //    data: { videoURL: "zip/" + file.name }
                //}).done(function (msg) {
                //    //alert("Video Saved: " + msg);
                //});

                picReader.addEventListener("load", function (event) {
                    var fileURL = URL.createObjectURL(file);
                    outputvideo.src = fileURL;
                    console.log("Zip almost read!");
                    console.log("File URL = " + fileURL);
                });
                console.log("Zip read!");
            }

        });

        // Read video (alternate: using resumable)
        //var r = new Resumable({
        //  target: '/video_parameters',
        //  query: {upload_video_token: 'video_token'}
        //});

        //// allow files to be selected:
        //r.assignBrowse(document.getElementById(inputvideo.id));
        //
        //// allow interaction with Resumable.js
        //r.on('fileAdded', function(file){
        //  
        //});

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
                    var div = document.createElement("div");
                    div.innerText = textFile.result;
                    console.log(textFile.result.toString());
                    output.insertBefore(div, null);

                    $.ajax({
                        type: "GET",
                        url: "/transcript_file",
                        data: { transcript: textFile.result.toString() }
                    }).done(function (msg) {
                        alert("Transcript Saved: " + msg);
                    });
                });

                //Read the text file
                picReader.readAsText(file);
                console.log("transcript read!");
            }
        });
    }
    else {
        console.log("Your browser does not support File API");
    }
}



