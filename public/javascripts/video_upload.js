
window.onload = function() {
    //Check File API support
    if (window.File && window.FileList && window.FileReader) {
        var filesInput = document.getElementById(inputvideo.id);
        var filesInput2 = document.getElementById(inputtrans.id);

        // Read video
        filesInput.addEventListener("change", function(event) {
            var files = event.target.files; //FileList object
            var output = document.getElementById(outputvideo.id);
            for (var i = 0; i < files.length; i++) {
                var file = files[i];
                var picReader = new FileReader();
                var fileURL = URL.createObjectURL(file);
                outputvideo.src = fileURL.split(":")[1];
                console.log("video almost read!");
                console.log("File URL = "+ fileURL);

                $.ajax({
                  type: "GET",
                  url: "/video_parameters",
                  data: { videoURL: fileURL.split(":")[1]}
                  }).done(function( msg ) {
                    alert( "Video Saved: " + msg );
                    });

                picReader.addEventListener("load", function(event) {
                   var fileURL = URL.createObjectURL(file);
                   outputvideo.src = fileURL;
                   console.log("video almost read!");
                   console.log("File URL = "+ fileURL);
                });
                console.log("video read!");
            }
        });
        // Read video (alternate: using resumable)
        // Video code commented out for future development
        /*
        var r = new Resumable({
          target: '/video_parameters',
          query: {upload_video_token: 'video_token'}
        });

        // allow files to be selected:
        r.assignBrowse(document.getElementById(inputvideo.id));
        
        // allow interaction with Resumable.js
        r.on('fileAdded', function(file){
          
        });
        */
        // Read transcript and print result on the same page
        filesInput2.addEventListener("change", function(event) {
            var files = event.target.files; //FileList object
            var output = document.getElementById(outputtrans.id);
            for (var i = 0; i < files.length; i++) {
                var file = files[i];
                //Only plain text
                //if (!file.type.match('plain')) continue;
                var picReader = new FileReader();
                picReader.addEventListener("load", function(event) {
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
                  }).done(function( msg ) {
                    alert( "Transcript Saved: " + msg );
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



