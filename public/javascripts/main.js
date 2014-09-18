// VizScribe: A visual analytics tool for protocol analysis
//    Code by: Senthil Chandrasegaran
//
// list of stopwords from www.jasondavies.com
// stop word removal code from the same source, but modified to suit
// current application
//
// Begin stop word removal code
var stopWords = /^(i|me|my|myself|we|us|our|ours|ourselves|you|your|yours|yourself|yourselves|he|him|his|himself|she|her|hers|herself|it|its|itself|they|them|their|theirs|themselves|what|which|who|whom|whose|this|that|these|those|am|is|are|was|were|be|been|being|have|has|had|having|do|does|did|doing|will|would|should|can|could|ought|i'm|you're|he's|she's|it's|we're|they're|i've|you've|we've|they've|i'd|you'd|he'd|she'd|we'd|they'd|i'll|you'll|he'll|she'll|we'll|they'll|isn't|aren't|wasn't|weren't|hasn't|haven't|hadn't|doesn't|don't|didn't|won't|wouldn't|shan't|shouldn't|can't|cannot|couldn't|mustn't|let's|that's|who's|what's|here's|there's|when's|where's|why's|how's|a|an|the|and|but|if|or|because|as|until|while|of|at|by|for|with|about|against|between|into|through|during|before|after|above|below|to|from|up|upon|down|in|out|on|off|over|under|again|further|then|once|here|there|when|where|why|how|all|any|both|each|few|more|most|other|some|such|no|nor|not|only|own|same|so|than|too|very|say|says|said|shall)$/;
var punctuation = /[!&()*+,-\.\/:;<=>?\[\\\]^`\{|\}~]+/g;
//"
var wordSeparators = /[\s\u3031-\u3035\u309b\u309c\u30a0\u30fc\uff70]+/g;
var discard = /^(@|https?:)/;
var htmlTags = /(<[^>]*?>|<script.*?<\/script>|<style.*?<\/style>|<head.*?><\/head>)/g;
var w = 960,
    h = 600;

var words = [],
    max,
    scale = 1,
    complete = 0,
    keyword = "",
    tags,
    fontSize,
    maxLength = 30;
    numLines = 0;
    // statusText = d3.select("#status");
var words = [];
// "
var transcript = [];
var lowerCaseLines = [];
var displayLines = [];
var tempspan = '';
var spanArray = [];
var wordList = [];
var tagList = [];
var captionArray = [];
var protocolArray = [];
var protocolList = [];
var selectedText = '';

// this set of variables for path viewer
var timeStamps = [];
var timeStampSec = [];
var operations = [];
var users = [];
var sketchNum = [];
var logData = [];
var commitLog = [];
var selectedIndices = [];

// list of colors used
var oldHighlighting = "rgba(220, 138, 12, 0.3)";
var greenHighlight = "rgba(232, 138, 12, 0.7)";

var transGraphColor = "rgba(123, 123, 123, 0.3)";
var boldHighlightColor = "rgba(255, 127, 0, 0.8)";
var mildHighlightColor = "rgba(255, 127, 0, 0.3)";
var wordCloudColor = "rgba(10, 100, 70, 0.7)";
var shadowGrey = "rgba(123,123,123,0.7)";

var colorlist = [ "rgba(228,26,28,",
                  "rgba(55,126,184,",
                  "rgba(77,175,74,",
                  "rgba(152,78,163,",
                  "rgba(255,127,0," ];

var sketchPathColor = "rgba(225, 120, 0, 0.2)";


// audio visualization 
/*
var wavesurfer = Object.create(WaveSurfer);

wavesurfer.init({
  container: document.querySelector('#audiodiv'),
  waveColor: 'lightgray',
  progressColor: 'steelblue',
  normalize: 'true',
  dragSelection: 'false',
  interact: 'false',
  height: $('#audiodiv').height()
});

wavesurfer.setVolume(0);
*/

// The hmsToSec function takes a "hh:mm:ss", or "mm:ss" or just an "ss"
// string and converts it to seconds. Returns a number.
function hmsToSec(hms){
  var timeArray = hms.split(":");
  var tindex = timeArray.length - 1;
  var seconds = 0;
  for (timeSeg in timeArray) {
    seconds += timeArray[timeSeg] * Math.pow(60, tindex);
    tindex -= 1;
  }
  return seconds;
}

// Function to handle tabs on protocol view div
$(function(){
  $('ul.tabs li:first').addClass('active');
  $('.block article').hide();
  $('.block article:first').show();
  $('ul.tabs li').on('click',function(){
    $('ul.tabs li').removeClass('active');
    $(this).addClass('active')
    $('.block article').hide();
    var activeTab = $(this).find('a').attr('href');
    $(activeTab).show();
    return false;
  });
})

// Function to convert hh:mm:ss to seconds
function hmsToSeconds(str) {
    var p = str.split(':'),
        s = 0, m = 1;
    while (p.length > 0) {
        s += m * parseInt(p.pop(), 10);
        m *= 60;
    }
    return s;
} // End Function to convert hh:mm:ss to seconds


// This function allows selection of transcript file (a CSV file) and
// displays it on the left bottom pane in the browser. Stop words are
// removed and the resulting tags are scaled by frequency and showed on
// the right pane.
window.onload = function() {
  var player = videojs('discussion-video');
  player.on('loadedmetadata', function() {
  // var files = evt.target.files; // FileList object
  // files is a FileList of File objects. List some properties.
  var transcriptFile;
  var fileTemp = $.ajax({
          type: "GET", // can remove this to avoid confusion
          url: "/receive_transcript_file", // change to send_trn_fil
          // note: "send" from POV of client
          dataType: "text"
      }).done(function(data) {
          captionArray = $.csv.toArrays(data);
          var longestLineLength = 0; // number of words in the longest line
          for (var i in captionArray) {
            if (captionArray[i][0].toLowerCase() !== "start time") {
              var words = captionArray[i][3].split(wordSeparators);
              if (words.length > longestLineLength){
                longestLineLength = words.length;
              }
              var lowerCaseWords = captionArray[i][3].toLowerCase()
                                   .split(wordSeparators);
              lowerCaseWords.shift();
              // for some reason, the wordSeparators split the line in a
              // way that the first word is an empty "".
              // lowerCaseWords.shift() gets rid of that "".
              lowerCaseLines.push(lowerCaseWords);
              for (var k in words) {
                tempspan+= '<span id="line'+i+'word'+k+'">' +
                           words[k] + ' </span>';
                spanArray.push([i,k,words[k].toLowerCase()]);
              }

              displayLines.push('<ul style="padding-left:5px" id="line '
                                + i + 
                                ' speaker ' + captionArray[i][2] +'">' + 
                                '<span style="color:#c3c3c3;' +
                                  'font-family:courier;' + 
                                  'font-size:7pt">' +
                                captionArray[i][0].split(".")[0] + " " +
                                '</span>' +
                                tempspan + '</ul>')
              tempspan = "";
            }
          }
          for (var j in displayLines) {
            $("#transContent").append(displayLines[j]);  
          }
          numLines = displayLines.length;

          // This jQuery code below makes the transcript text annotable
          // using the annotator library.
          // The setupPlugins sets up annotator in the 'default' mode.
          jQuery(function ($) {
            $('#bottomright').annotator()
                          .annotator('setupPlugins');
          });


          player.ready(function(){
          var videoLenSec = player.duration();
          // representation of lines in transcript overall window
          d3.select("#transGraph").selectAll("svg").remove();
          var w = $('#transGraph').width();
          var h = $('#transGraph').height()-5;
          var transSvg = d3.select("#transGraph").append("svg")
                           .attr("width", w)
                           .attr("height", h);
          /*
          transSvg.attr("width", w)
                  .attr("height", h);
          */
          
          var transcriptScale = d3.scale.linear()
                                  .domain([0, Math.round(videoLenSec)])
                                  .range([0, w]);
          console.log(videoLenSec);
          // var maxvalue = Math.max.apply(Math, tagFreq);
          var transGraphPadding = 0;                
          var rects = transSvg.selectAll("rect")   
                         .data(lowerCaseLines)       
                         .enter()             
                         .append("rect")
                         .attr("x", function(d,i) {
                                          // return i* (w/numLines);
                           var xSec =
                             hmsToSec(captionArray[i+1][0]);
                           var xloc = transcriptScale(xSec);
                           return(xloc);
                                      })
                         .attr("y", function(d) {
                                          return 0;
                                          })
                         .attr("width", w/numLines - transGraphPadding)
                         .attr("width", function(d, i){
                            var endSec = hmsToSec(captionArray[i+1][1]);
                            var startSec = 
                              hmsToSec(captionArray[i+1][0]);
                            var wScaled = 
                              transcriptScale(endSec-startSec);
                            return wScaled;
                         })
                         .attr("height", function(d){
                            var lineRatio = d.length/longestLineLength;
                            var boxHeight = lineRatio*h;
                            return boxHeight;
                         })
                         .attr("stroke-width", 1)
                         .attr("stroke", "rgba(255,255,255,1)")
                         .attr("fill", function(d) {
                              return transGraphColor;
                         });
          var halfWidth = (w/numLines - transGraphPadding)/2;
          /*
          for (lineInd in lowerCaseLines){
            var numWords = lowerCaseLines[lineInd].length;
            var circles = transSvg.selectAll("circle")   
                       .data(lowerCaseLines[lineInd])       
                       .enter()             
                       .append("circle")
                       .attr("cy", lineInd * (w/numLines) + halfWidth)
                       .attr("cx", function(d, i){
                                    return i * (w/numWords);
                                })
                       .attr("r", halfWidth)
                       .style("fill", "rgba(220, 138, 12, 1)");
          }
          */
          // end representation of lines
        }); // end player.ready()


        wordList = wordList.concat.apply(wordList, lowerCaseLines);
        var conceptList = [];
        for (var num in wordList) {
          wordList[num] = wordList[num].replace(punctuation, "");
          if (!stopWords.test(wordList[num]) && (wordList[num] != "")) {
            conceptList.push(wordList[num]);
          }
        }

        var wordObj = { };
        for (var i = 0, j = conceptList.length; i < j; i++) {
           if (wordObj[conceptList[i]]) {
              wordObj[conceptList[i]]++;
           }
           else {
              wordObj[conceptList[i]] = 1;
           } 
        }

        var sortedList = [];
        for (var uniqueWord in wordObj)
              sortedList.push([uniqueWord, wordObj[uniqueWord]])
        sortedList.sort(function(a, b) {return a[1] - b[1]})

        tagList = sortedList.reverse();

        // To generate tag list
        var cloudArray = []
        var tagNum = 0;
        var maxfreq = tagList[0][1];
        var tagspans = "";
        var tagFreq = [];

        var fontScale = d3.scale.linear()
                          .domain([maxfreq, 1])
                          .range([25, 10]);

        for (var tagNum in tagList) {
            tagspans+= '<text id="tag '+ 
                       tagNum + 
                       '" style = "font-size:' +
                       Math.round(fontScale(tagList[tagNum][1]))+'pt;'+
                       ' color:' + wordCloudColor + ');">' +  
                       tagList[tagNum][0] + 
                       ' </text>';
            tagFreq.push(tagList[tagNum][1]);
          }
        $("#tagList").empty()
        $("#tagList").append(tagspans);  

        /*
        // bar chart of word frequencies, corresponds to taglist
        d3.select("#barChart").selectAll("svg").remove();
        var svg = d3.select("#barChart").append("svg");
        var w = $('#barChart').width();
        var h = $('#barChart').height();
        svg.attr("width", w)
           .attr("height", h);

        var maxvalue = Math.max.apply(Math, tagFreq);
        var barpadding = 1;                

        var rects = svg.selectAll("rect")   
                       .data(tagFreq)       
                       .enter()             
                       .append("rect")
                       .attr("x", function(d,i) {
                                        return i* (w/tagFreq.length);
                        })
                       .attr("y", function(d) {
                                        return h - d*4;
                        })
                       .attr("rx", 1)
                       .attr("ry", 1)
                       .attr("width", w/tagFreq.length - barpadding)
                       .attr("height", function(d) {
                                        return d*4;
                        })
                       .attr("fill", function(d) {
                            return "rgba(0, 120, 200, 1)";
                        });
      */
      // Remove tag on right click
          var tagListDOM = $('#tagList');
          tagListDOM.oncontextmenu = function() { return false;}
          tagListDOM.on('mousedown', 'text', function(e){
            if (e.button == 2){
              var isRemoveTag = confirm("Remove tag: " + 
                                        $(this).text() +
                                        " from list?");
                if (isRemoveTag == true){
                  var tagToRemove = $(this).text();
                  var removeIndex = tagListDOM.children("text")
                                              .index(this);
                  if (removeIndex > -1) {
                    tagList.splice(removeIndex, 1);
                  }
                  // Then Regenerate taglist and barchart
                  // first empty the div
                  $("#tagList").empty();
                  // Then add everything with the updated tagList
                  var cloudArray = []
                  var tagNum = 0;
                  var maxfreq = tagList[0][1];
                  var tagspans = "";
                  var tagFreq = [];
                  var fontScale = d3.scale.linear()
                                    .domain([maxfreq, 1])
                                    .range([25, 10]);

                  for (var tagNum in tagList) {
                      tagspans+= '<text id="tag '+ 
                         tagNum + '" style = "font-size:' +
                       Math.round(fontScale(tagList[tagNum][1]))+'pt;'+
                         ' color:' + wordCloudColor + ');">' +  
                         tagList[tagNum][0] + 
                         ' </text>';
                      tagFreq.push(tagList[tagNum][1]);
                  }

                  $("#tagList").append(tagspans);  

                  /*
                  // bar chart of word frequencies, corresponds to
                  // taglist
                  d3.select("#barChart").selectAll("svg").remove();
                  var svg = d3.select("#barChart").append("svg");
                  var w = $('#barChart').width();
                  var h = $('#barChart').height();
                  svg.attr("width", w)
                     .attr("height", h);

                  var maxvalue = Math.max.apply(Math, tagFreq);
                  var barpadding = 1;                

                  var rects = svg.selectAll("rect")   
                       .data(tagFreq)       
                       .enter()             
                       .append("rect")
                       .attr("x", function(d,i) {
                                        return i* (w/tagFreq.length);
                                    })
                       .attr("y", function(d) {
                                        return h - d*4;
                                        })
                       .attr("rx", 1)
                       .attr("ry", 1)
                       .attr("width", w/tagFreq.length - barpadding)
                       .attr("height", function(d) {
                                        return d*4;
                                        })
                       .attr("fill", function(d) {
                            return "rgba(0, 120, 200, 1)";
                       });
                  */
                  // Finally remove all highlights from transcript
                  $("#transContent ul").removeClass('hoverHighlight');
                  $("#transContent ul").removeClass('boldText');
          
                }
                else{
                  return true;
                }
            } else {
              return true;
            }
        }); //end mousedown e function
      // end function for remove tag on rightclick

      // Brushing and linking on Mouseover or Mouseclick
          //---------------------------------------------------------------   
          // Video seeking Code
          //---------------------------------------------------------------   
          var videoDuration = 0
          /*
          var wavevid = $.ajax({
              type: "GET", // can remove this to avoid confusion
              url: "/receive_video_file", // change to send_trn_fil
              // note: "send" from POV of client
              }).done(function(data){
                wavesurfer.load(data);
              });
          */
          player.ready(function() {
            $('#transContent').on('click', 'ul', function(e){
              if (e.ctrlKey) {
                var captionIndex = $('#transContent').children('ul')
                                                     .index(this);
                var captionStartTimeMin = captionArray[captionIndex][0]
                captionStartTimeSec = hmsToSec(captionStartTimeMin);
                e.preventDefault();
                player.currentTime(captionStartTimeSec);
              }
            });
          });
          //---------------------------------------------------------------   

          // interactions: hover, select etc. on text
          var tagListDOM = $('#tagList');
          var tagHoverText = "";

          //---------------------------------------------------------------  
          // light highlighting on mouse enter
          //---------------------------------------------------------------   
          tagListDOM.on('mouseenter', 'text', function(){
            videoDuration = player.duration();
            $(this).addClass('hoverHighlight');
            tagHoverText = $(this).text();
            var transItems =  $("#transContent ul span:contains('" 
                                + tagHoverText + "')").closest("ul");
            transItems.addClass('hoverHighlight');
            $("#transContent ul span:contains('" + tagHoverText + "')")
               .addClass('boldText');

            //----------------------------------------------   
            // add bars of highlighted bits next to seekbar
            //----------------------------------------------   
            var transItemIds = [];
            transItems.each(function(index, value){
                var idIndex = $('#transContent').children('ul')
                                                .index(this);
                transItemIds.push(idIndex);
                // change color of vertical text rep bars
                var hiRects = $("#transGraph svg")
                                  .children('rect');
                d3.select(hiRects[idIndex])
                  .attr("fill", oldHighlighting);
                /*
                var transSvg = d3.select("#transGraph")
                                 .selectAll("svg");
                var w = $('#transGraph').width();
                var h = $('#transGraph').height();
                transSvg.attr("width", w)
                        .attr("height", h);
                */
                var numLines = hiRects.length;
            });
            var timeSegArray = [];
            //load corresponding times of highlighted ul items in a list
            var ind = 0;
            for (ind in transItemIds) {
                  var numInd = transItemIds[ind];
                  var startTime = hmsToSec(captionArray[numInd][0]);
                  var duration = hmsToSec(captionArray[numInd][1]) - 
                                 startTime;
                  timeSegArray.push([startTime, duration]);
            }
         });

      //---------------------------------------------------------------   
      // remove light highlighting on mouse leave
      //---------------------------------------------------------------   
          tagListDOM.on('mouseleave', 'text', function(){
            $(this).removeClass('hoverHighlight');
            $("#transContent ul span:contains('" + tagHoverText + "')")
                .closest("ul").removeClass('hoverHighlight');
            $("#transContent ul span:contains('" + tagHoverText + "')")
                .removeClass('boldText');
            d3.select("#transGraph").selectAll("svg")
                .selectAll("rect")
                .attr("fill", transGraphColor);
          });

      //---------------------------------------------------------------   
      // dark highlighting on mouse click
      //---------------------------------------------------------------   
          tagListDOM.on('click', 'text', function(){
            $(this).parent().children('text')
                            .removeClass('tagClickHighlight');
            $(this).addClass('tagClickHighlight');
            tagHoverText = $(this).text();
            $('.textClickHighlight').removeClass('textClickHighlight');
            $('.boldClickText').removeClass('boldClickText');
            var transItems =  $("#transContent ul span:contains('" 
                                + tagHoverText + "')").closest("ul");
            transItems.addClass('textClickHighlight');
             $("#transContent ul span:contains('" + tagHoverText + "')")
                .addClass('boldClickText');

            //----------------------------------------------   
            // add bars of highlighted bits next to seekbar
            //----------------------------------------------   
            var transItemIds = []
            transItems.each(function(index, value){
                var idIndex = $('#transContent').children('ul').index(this);
                transItemIds.push(idIndex);
                // change color of vertical text rep bars
                var hiRects = $("#transGraph svg")
                                  .children('rect');
                d3.select(hiRects[idIndex])
                  .attr("fill", boldHighlightColor);
            })
            var timeSegArray = [];
            //load corresponding times of highlighted ul items in a list
            var ind = 0;
            for (ind in transItemIds) {
                  var numInd = transItemIds[ind];
                  var startTime = hmsToSec(captionArray[numInd][0]);
                  var duration = hmsToSec(captionArray[numInd][1]) - 
                                 startTime;
                  timeSegArray.push([startTime, duration]);
            }
          });

      //---------------------------------------------------------------   
      // light gray highlighting on mouseover for transcript
      //---------------------------------------------------------------   
          $('#transContent').on('mouseenter', 'ul', function(){
            $(this).addClass('transHighlight');
            //----------------------------------------------   
            // add bars of highlighted bits next to seekbar
            //----------------------------------------------   
            var transItem =  $(this);
            var transItemIds = []
            var idIndex = $('#transContent').children('ul').index(this);
            transItemIds.push(idIndex);
            // change color of vertical text rep bars
            var hiRects = $("#transGraph svg")
                              .children('rect');
            d3.select(hiRects[idIndex])
              .attr("fill", mildHighlightColor);
            var timeSegArray = [];
            //load corresponding times of highlighted ul items in a list
            var ind = 0;
            for (ind in transItemIds) {
                  var numInd = transItemIds[ind];
                  var startTime = hmsToSec(captionArray[numInd][0]);
                  var duration = hmsToSec(captionArray[numInd][1]) - 
                                 startTime;
                  timeSegArray.push([startTime, duration]);
            }
            /*
            var svgVideo = d3.select("#timeline").append("svg");
            var timelineLength = $('#timeline').width();
            var h = $('#timeline').height();
            svgVideo.attr("width", timelineLength)
                    .attr("height", h);

            var totalTime = videoDuration;
            var timeScale = timelineLength/videoDuration;
            var rects = svgVideo.selectAll("rect")   
                           .data(timeSegArray)       
                           .enter()             
                           .append("rect")
                           .style("stroke", "rgba(123, 123, 123, 0.7)")
                           .style("stroke-width", 1)
                           .attr("x", function(d,i) {
                                        return (d[0]*timeScale);
                                      })
                           .attr("y", 0)
                           .attr("rx", 2)
                           .attr("ry", 2)
                           .attr("width", function(d,i) {
                                            return (d[1]*timeScale);
                                          })
                           .attr("height", h)
                           .attr("fill", "rgba(123, 123, 123, 0.2)");
         // end highlight bars
         */
          });

          // remove light highlighting on mouse leave
          $('#transContent').on('mouseleave', 'ul', function(){
            $(this).removeClass('transHighlight');
            d3.select("#transGraph").selectAll("svg")
                .selectAll("rect")
                .attr("fill", transGraphColor);
          });
          
        // Allow interaction with seesoft-like visualization
        $('#transGraph').on('mouseenter', 'svg rect', function() {
          $(this).attr("fill", greenHighlight);
          var transGraphIndex = $('#transGraph svg')
                                  .children('rect').index(this);

          // light highlighting of transcript
          videoDuration = player.duration();
          var transItem = $('#transContent').children('ul')
                                            .eq(transGraphIndex);
          transItem.addClass('hoverHighlight');
          // note: 'eq' returns jquery object at index. 
          // For DOM object at index use 'get'
        }); // end of transGraph onmouseenter function.

        $('#transGraph').on('mouseleave', 'svg rect', function() {
          $(this).attr("fill", transGraphColor);

          // remove light highlighting on mouse leave
          $("#transContent ul").removeClass('hoverHighlight');
        }); // end of transGraph onmouseleave function
        
        // var player = videojs('discussion-video');
        var videoDuration = 0
         player.ready(function() {
          $('#transGraph svg').on('click', 'rect', function(e){
            var transGraphIndex = $('#transGraph svg').children('rect')
                                                   .index(this);
            var captionStartTimeMin = captionArray[transGraphIndex][0]
            captionStartTimeSec = hmsToSec(captionStartTimeMin);
            e.preventDefault();
            player.currentTime(captionStartTimeSec);
            // wavesurfer.seek(captionStartTimeSec/player.duration());
            var transClickItem = $('#transContent').children('ul')
                                                   .eq(transGraphIndex);
            transClickItem.addClass('hoverHighlight');
            // this small snippet below to scroll the transcript to show
            // the line corresponding to the item selected in transgraph
            var topPos = $("#transContent").offset.top;
            console.log(topPos);
            transClickItem.scrollTo(topPos);
            
//             transClickItem.animate({
//                  scrollTop: $(this)[0].children('span')[0]
//                                       .position().top
//             }, 'slow');
          });
        });
        
       /*
       // toggle the size of the tagList div 
        var tagListTextSizes = [];

        $("#tagListTitle").click(function(){
          if($("#tagList").hasClass('minimize')) {
            $("#tagList").animate({height:"45%"},200)
                      .removeClass('minimize');
          } else { 
            $("#tagList").animate({height:50},200)
                      .addClass('minimize');
            $("tagList").children("text").each(function(){
              tagListTextSizes.push[$(this), 
                                    $(this).css("font-size")];
            });
            $("#tagList").children("text").css("font-size", "12px");
          }
        });
       */

       // toggle the size of the sketches div (pathViewer)
        $("#sketchTitle").click(function(){
          if($("#sketches").hasClass('minimize')) {
            $("#sketches").animate({height:"45%"},200)
                      .removeClass('minimize');
          } else { 
            $("#sketches").animate({height:50},200)
                      .addClass('minimize');
          }
        });

       // toggle the size of the protocolGraph div 
        $("#protocolGraphTitle").click(function(){
          if($("#protocolGraph").hasClass('minimize')) {
            $("#protocolGraph").animate({height:"45%"},200)
                      .removeClass('minimize');
          } else { 
            $("#protocolGraph").animate({height:50},200)
                      .addClass('minimize');
            /*
            var minRects = d3.select("#protocolGraphContent")
                             .select("svg")
                             .selectAll("rect");
            minRects.transition()
                    .attr("y", 0);
            */
          }
        });

        // show Video Progress on the sketch and Protocol Divs
        var vidPlayer = videojs("discussion-video");
        vidPlayer.ready(function() {
          var $sketchScrubberProgress = $("#sketchScrubber");
          var $waveScrubberProgress = $("#waveScrubber");
          var $protocolScrubberProgress = $("#protocolGraphScrubber");
          vidPlayer.on('timeupdate', function(e) {
            var percent = this.currentTime()/this.duration();
            $sketchScrubberProgress.width((percent * 100) + "%");
            $waveScrubberProgress.width((percent * 100) + "%");
            $protocolScrubberProgress.width((percent * 100) + "%");
          });
        });


      // Allow tabbed indenting on protocol textArea field
      // Code snippet credit to
      // jqueryrain.com/2012/09/indentation-in-textarea-using-jquery/
      $('textArea').keydown(function(e) {
        if (e.keyCode == 9) {
          e.preventDefault();
          var start = $(this).get(0).selectionStart;
          $(this).val($(this).val().substring(0, start) + "\t" + 
          $(this).val().substring($(this).get(0).selectionEnd));
          $(this).get(0).selectionStart = $(this).get(0).selectionEnd = 
            start + 1;
          $(this).focus(); 
          return false;
        }
      }); // end function for tabbed indenting
      
      // On focus returning back to the "view" tab, 
      // update text in that tab with whatever was entered in the
      // protocol edit tab

      $('ul.tabs li:first').on('click',function(){
        if ($(this).hasClass('active')) {
          var pArray = document
                  .getElementById('protocolTextArea')
                  .value
                  .split("\n");

          function removeTabs(pString) {
            return pString.split("\t")[pString.split("\t").length-1];
          }
          
          // deleted code for array splitting
          // add new code that works, the old one didn't.

          // display the tree with some D3 code
          d3.select("#protoView").selectAll("svg").remove();
          var protoViewSvg = d3.select("#protoView").append("svg");
          var w = $('#protoView').width();
          var h = $('#protoView').height();
          
          var protoViewPadding = 5;                
          var colorindex = -1;
          var tmp = -1;
          var protoRect = protoViewSvg.selectAll("g")
                              .data(pArray)
                              .enter().append("g")
                              .attr("transform", function(d, i){
                                var indents = d.split("\t").length;
                                var yline = i*16 + 
                                            10 + 
                                            protoViewPadding;

                                return "translate(" +
                                        indents*10 + "," +
                                        yline + ")";
                              
                              })
          protocolList = [];
          protocolColorList = [];
          protoRect.append("rect")   
                   .attr("width", 15)
                   .attr("height", 15)
                   .attr("stroke-width", 1)
                   .attr("fill", function(d,i) {
                      var indents = d.split("\t").length;
                      if (indents == 1) {
                        colorindex++;
                        protocolList
                          .push(d.split("\t")[d.split("\t").length-1]);
                      protocolColorList.push(colorlist[colorindex]+
                                             "0.3)");
                      }
                      return colorlist[colorindex] + 
                             (0.6 - indents*0.1).toString() + ")";
                    })
                   .attr("stroke", transGraphColor);
          protoRect.append("text")
                   .attr("x", function(d, i) {
                      d.split("\t").length;
                   })
                   .attr("y", function(d, i){
                      return i+7;
                   })
                   .attr("dx", "2em")
                   .text(function(d) {
                      return d.split("\t")[d.split("\t").length -1]
                   });
                                //(0.3 - indents * 0.1).toString();
        } 
        protocolList.push("unassign");
        protocolColorList.push("rgba(255,255,255,0.1)");
      }); // end function for updating protocols from entered text

      // Add total protocol distributions
      $('ul.tabs li:eq(2)').on('click',function(){
        // get the final list of assigned protocols
        var protoTimeArray = [];
        for (var i in protocolList){
          if (protocolList[i] != "unassign"){
            protoTimeArray.push([protocolList[i], 
                                 protocolColorList[i],
                                 0]);
          } 
        }
        for (var pindex in protoTimeArray){
          for (var ind in selectedIndices){
            if (protoTimeArray[pindex][0] == selectedIndices[ind][3]){
              var timeInSecs = hmsToSeconds(selectedIndices[ind][2]) - 
                               hmsToSeconds(selectedIndices[ind][1])
              protoTimeArray[pindex][2]+= timeInSecs;
            }
          } 
        }

        var maxTime = 0;
        for (var j in protoTimeArray){
          if (protoTimeArray[j][2] > maxTime){
            maxTime = protoTimeArray[j][2];
          }
        }
        var chartWidth = $("#totalProtocols").width() - 20;
        var chartHeight = $("#totalProtocols").height();

        d3.select("#totalProtocols").selectAll("svg").remove();

        var tSVG = d3.select("#totalProtocols")
                     .append("svg")
                     .attr("width", chartWidth)
                     .attr("height", chartHeight)
                     .append("g");

        var protos = d3.scale.ordinal()
                       .domain(protocolList) 
                       .rangePoints([10, chartWidth-10], 0);

        var xAxis = d3.svg.axis()
                      .scale(protos)
                      .orient("bottom");

        tSVG.append("g")
            .attr("class", "x axis")
            .attr("transform", "translate(0," +(chartHeight+5)+ ")")
            .call(xAxis)
          .append("text")
            .attr("class", "label")
            .attr("x", chartWidth)
            .attr("y", -6)
            .style("text-anchor", "end")
            .text("protocols");

        tSVG.selectAll("rect")
            .data(protoTimeArray)
            .enter()
            .append("rect")
            .attr("x", function(d, i){
                return i/protoTimeArray.length * chartWidth;
              })
            .attr("y", function(d, i){
                return chartHeight - (d[2]/maxTime*chartHeight - 5);
              })
            .attr("width", chartWidth/protoTimeArray.length - 2)
            .attr("height", function(d, i){
                return (d[2]/maxTime * chartHeight) - 5;
              })
            .attr("fill", function(d, i){
                return d[1];
              });
      });

      // code to assign protocol codes with selected text
      $('#transContent').on('contextmenu', function(e){
        e.preventDefault();
        var t = '';
        if(window.getSelection){
          t = window.getSelection();
        }else if(document.getSelection){
          t = document.getSelection();
        }else if(document.selection){
          t = document.selection.createRange().text;
        }
        selectedText = String(t);
        var menuItems = '<p> assign to code:</p>';
        for (ind in protocolList) {
          menuItems+= '<ul id="' + protocolList[ind]+ '">' +
            protocolList[ind] + '</ul>';
        }

        // Adding a text field to add a new code on the fly
        menuItems+= '<ul id="addNew">' +
                       '<textarea id="newCode" rows=1 cols=10>'+
                       '</textarea> <br>' +
                       '<span id="buttonspan" text-align="right"' +
                       'display="block">' +
                          '<button id="newCodeBtn" type="submit">'+
                          'Add New' + 
                          '</button>'+
                        '</span>' +
                     '</ul>';
        // menuItems += '<ul>unassign</ul>';

        // The code below makes sure the context menu is fully visible
        // and doesn't overflow the displayed extents of the page
        var menuXpos, menuYpos;
        var bottomRightTopOffset = $('#bottomright').offset().top;
        var bottomRightLeftOffset = $('#bottomright').offset().left;
        var bottomRightWidth = $('#bottomright').width();
        var bottomRightHeight = $('#bottomright').height();
        var contextMenuWidth = $('.contextmenu').html(menuItems)
                                                .width();
        var contextMenuHeight = $('.contextmenu').html(menuItems)
                                                 .height();
        console.log(bottomRightLeftOffset +
                    bottomRightWidth/2);
        console.log("menu width = " + 
                    contextMenuWidth);
        if (pageXOffset+e.clientX <= 
            bottomRightLeftOffset + 
            bottomRightWidth/2){
          if (pageYOffset+e.clientY <= 
              bottomRightTopOffset +
              bottomRightHeight/2){
            menuXpos = pageXOffset +
                       e.clientX;
            menuYpos = pageYOffset +
                       e.clientY;
          } else {
            menuXpos = pageXOffset +
                       e.clientX;
            menuYpos = pageYOffset +
                       e.clientY - 
                       contextMenuHeight;
          }
        } else {
          if (pageYOffset+e.clientY <= 
              bottomRightTopOffset +
              bottomRightHeight/2){
            menuXpos = pageXOffset +
                       e.clientX -
                       contextMenuWidth;
            menuYpos = pageYOffset + 
                       e.clientY;
          } else {
            menuXpos = pageXOffset + 
                       e.clientX -
                       contextMenuWidth;
            menuYpos = pageYOffset + 
                       e.clientY -
                       contextMenuHeight;
          }
        }
        console.log("menu x pos = " + menuXpos +
                    ", menu y pos = " + menuYpos);
        console.log("mouseX = " + e.clientX + ", mouseY = " + e.clientY);
        $(".contextmenu").html(menuItems)
           .css({
             "visibility": "visible",
             "left": menuXpos + "px",
             "top": menuYpos + "px",
             "background": "white",
             "border":"solid 1px #c2c2c2",
             "z-index": 100,
             "box-shadow": "3px 3px 5px 0px " + shadowGrey});
        console.log($(".contextmenu").html(menuItems).is(":visible"));
      });
      // end of code for pop-up coding menu in transContent

      selectedIndices = [];
      // assign selected text to array under the clicked code
      $(".contextmenu").on("click", "ul", function(evt){
        evt.stopPropagation(); // stops click from propagating to
        // underlying div element.
        
        if ($.contains(this, '#newCodeBtn')){
          console.log("you can add a code here.");
          console.log($(this).has('button'));
          $('#newCodeBtn').on('click', function(){
            // If the textbox has text in it, add it to the existing
            // codes.
            var addedCode = $('#newCode').val();
            if (addedCode != ""){
              protocolList.push(addedCode);
              addedCode = "";
            }
          });
        } else {
          // Based on selection, capture from original csv first
          var selectedArray = selectedText.split("\n");
          for (var i in captionArray) {
            for (var j in selectedArray){
              selectedLine = selectedArray[j];
              if ((selectedLine != "") &&
                  (captionArray[i][3].indexOf(selectedLine) > -1)){
                if ($(this).text() == "unassign"){
                  for (var ksel in selectedIndices){
                    if (selectedIndices[ksel][4] == captionArray[i][3]){
                      selectedIndices.splice(ksel, 1);
                    }
                  }
                } else {
                  selectedIndices.push([
                    i-1, // compensate for 1st line of csv being header
                    captionArray[i][0], // start time
                    captionArray[i][1],  // end time
                    $(this).text(),
                    captionArray[i][3]+"\r"
                  ]);
                }
                var sendData = {};
                sendData.data = selectedIndices;
                $("#transContent ul:eq("+(i-1)+")")
                    .css({"background-color": 
                           protocolColorList[protocolList
                                .indexOf($(this).text())]});
              }
              break;
            }
          }
          $.post("/userlog", sendData, function(data, error){});
          // Note: the post request seems to take only JSON as data, but
          // read documentation to see if this is always the case. --
          // senthil

          d3.select("#protocolGraphContent")
                .selectAll("svg")
                .remove();
          var protoGraphWidth = $('#protocolGraphContent').width();
          var protoGraphHeight = $('#protocolGraphContent').height();
          var protocolSVG = d3.select("#protocolGraphContent")
                .append("svg")
                .attr("width", protoGraphWidth)
                .attr("height", protoGraphHeight);

          var margin = {top: 5, right: 0, bottom: 5, left: 0};
          var videoLenSec = player.duration();

          var protoX = d3.scale.linear()
                    .domain([0, videoLenSec]) 
                    // convert to scale that adapts
                    .range([0, 
                           protoGraphWidth - 
                             margin.left - 
                             margin.right]);
          var protoY = d3.scale.ordinal()
                    .domain(protocolList) // convert ditto
                    .rangePoints([margin.top, 
                                 protoGraphHeight-margin.bottom], 0);
          var proSpace = 10;
          var rects = protocolSVG.selectAll("rect")  
                       .data(selectedIndices)
                       .enter()             
                       .append("rect")
                       .attr("x", function(d,i) {
                         var startTimeScaled =  protoX(hmsToSec(d[1]));
                         return startTimeScaled;
                          })
                       .attr("y", function(d) {
                          var yloc =
                            protocolList.indexOf(d[3]);
                          return (yloc* 
                                  (protoGraphHeight-proSpace)/
                                  (protocolList.length-1)) + proSpace/2;
                          })
                       .attr("width", function(d){
                          return protoX(hmsToSec(d[2]) - 
                                        hmsToSec(d[1]));
                          })
                       .attr("height", (protoGraphHeight-proSpace)/
                                       (protocolList.length-1))
                       .attr("stroke-width", 1)
                       .attr("stroke", "rgba(255,255,255,1)")
                       .attr("fill", function(d) {
                            return protocolColorList[protocolList
                                    .indexOf(d[3])];
                         });
          // then get rid of the context menu
          $('.contextmenu').css({"box-shadow":"none", 
                                 "border":"none",
                                 "background":"none"})
                           .empty(); 
        }
      }); // end of code that decides what happens when an item is
          // clicked on the context menu
      
      // remove context menu when clicked elsewhere
      $('#transContent').on('click', function(){
          $('.contextmenu').css({"box-shadow":"none", 
                                 "border":"none",
                                 "background":"none"})
                           .empty(); 
      });
  }); // end of file ajax code

// Function to read in the log file
  var logFile;
  var fileTemp1 = $.ajax({
      type: "GET", // can remove this to avoid confusion
      url: "/receive_log_file", // change to send_trn_fil
      // note: "send" from POV of client
      dataType: "text"
      }).done(function(data) {
    var logArray = $.csv.toArrays(data);
    var prevSketch = [0, 0, 0, 0]; // these need to initialize based on
                                   // number of users.
    startTime = hmsToSeconds(logArray[1][0]);
    var commitIndex = 0;
    var player = videojs('discussion-video');
    var videoLenSec = player.duration();

    for (var i in logArray) {
      if (i > 0) {
        timeStampSec = hmsToSeconds(logArray[i][0]) - startTime;
        if (timeStampSec < videoLenSec) {
          logData.push([timeStampSec, 
                         logArray[i][1].toLowerCase(),
                         logArray[i][2].toLowerCase(),
                         logArray[i][3]
                       ]);
          timeStamps.push(logArray[i][0]);
          operations.push(logArray[i][1]);
          users.push(logArray[i][2].toLowerCase());
          sketchNum.push(logArray[i][3]);
          var op = logArray[i][1];
          // If there was a refresh since the last commit, reset prev
          // sketch counter to 0
          if (op == 'checkid') {
            // if there was a refresh since the last commit or checkout,
            // then reset previous sketch by that user to 0
            prevSketch[+logArray[i][2]
                          .toLowerCase()
                          .split("f")[1]-1] = 0;
          } else if (op == 'checkout') {
            // if a user checks out a sketch, remember that last checkout
            // by that last user
            prevSketch[+logArray[i][2]
                          .toLowerCase()
                          .split("h")[1]-1] = logArray[i][3];
          } else if (op == 'commit'){
            var tempArray = [timeStampSec, 
                             logArray[i][1].toLowerCase(), //operation
                             logArray[i][2].toLowerCase(), //user ID
                             logArray[i][3], //sketch Number
                             prevSketch[+logArray[i][2]
                                          .toLowerCase()
                                          .split("h")[1]-1] //prev sketch
                            ];
            commitLog.push(tempArray);
            commitIndex += 1;
            // set the previous sketch ID to the currently committed
            // sketch ID
            prevSketch[+logArray[i][2].toLowerCase().split("f")[1]-1] = 
              commitIndex;
          }
        }
      }
      else {logData.push(logArray[0]);
      }
    }

  // Code to generate paths
  var margin = {top: 5, right: 5, bottom: 5, left: 25},
      sketchesWidth = $('#sketches').width();
      sketchesHeight = $('#sketches').height();
      $('#sketchContent').width(sketchesWidth);
      $('#sketchContent').height(sketchesHeight);
  var sketchesPosition = $('#sketches').position();
  $('#sketchScrubber').css({height: $('#sketches').height(),
                   'margin-top': -($('#sketches').height()),
                   'z-index': 5});
  $('#sketchScrubber').attr('top', sketchesPosition.top);

  var protosPosition = $('#protocolGraph').position();
  $('#protocolGraphScrubber').css({height: $('#protocolGraph').height(),
                   'margin-top': -($('#protocolGraph').height()),
                   'z-index': 5});
  $('#protocolGraphScrubber').attr('top', protosPosition.top);

  var svg = d3.select("#sketchContent").append("svg")
      .data(logData)
      .attr("width", sketchesWidth)
      .attr("height", sketchesHeight)
      .style({'z-index': 1})
    .append("g")
      .attr("transform", 
            "translate(" + margin.left + "," + margin.top + ")");

  var x = d3.scale.linear()
            .domain([0, videoLenSec]) // convert to scale that adapts
            .range([0, sketchesWidth-margin.left-margin.right]);
  var y = d3.scale.ordinal()
            .domain(['h1', 'h2', 'h3', 'h4']) // convert ditto
            .rangePoints([margin.top*2, 
                          sketchesHeight-margin.bottom*5], 0);
  
  var color = d3.scale.category10();

  var xAxis = d3.svg.axis()
    .scale(x)
    .orient("bottom");

  var yAxis = d3.svg.axis()
      .scale(y)
      .orient("left");
  
  svg.append("g")
      .attr("class", "x axis")
      .attr("transform", "translate(0," + sketchesHeight + ")")
      .call(xAxis)
    .append("text")
      .attr("class", "label")
      .attr("x", sketchesWidth)
      .attr("y", -6)
      .style("text-anchor", "end")
      .text("time (sec)");

  svg.append("g")
      .attr("class", "y axis")
      .call(yAxis)
    .append("text")
      .attr("class", "label")
      .attr("y", 0)
      .attr("dy", ".40em")
      .attr("x", 10)
      .style("text-anchor", "end")
      .text("user ID");
  var svgContent = svg.append("g");


  svgContent.selectAll(".pathTrace")
    .data(commitLog)
    .enter()
    .append("svg:line")
    .attr("class", "pathTrace")
    .attr("stroke-width", 2)
    .attr("stroke", sketchPathColor)
    .attr("x1", function(d, i) {
        if (d[4] !=0) { return x(d[0]);
        }
      })
    .attr("y1", function(d, i) {
        if (d[4] !=0) { return y(d[2]); 
        }
      })
    .attr("x2", function(d, i) {
        if (d[4] !=0) { return x(commitLog[d[4]-1][0]); }
      })
    .attr("y2", function(d, i) {
        if (d[4] !=0) { return y(commitLog[d[4]-1][2]); }
      });

  // add the tooltip area to the webpage
  var tooltip = d3.select("#sketchContent").append("div")
      .attr("class", "tooltip")
      .style("opacity", 0);
  var largeTooltip = d3.select("#sketchContent").append("div")
      .attr("class", "tooltip")
      .style("opacity", 0);

  // add nodes to path viewer
  svgContent.selectAll(".dot")
      .data(commitLog)
    .enter().append("circle")
      .attr("class", "dot")
      .attr("r", 10)
      .attr("cx", function(d) { 
        return x(d[0]); 
        })
      .attr("cy", function(d) { return y(d[2]); })
      .on("mouseover", function(d, i) {
                d3.select(this).transition()
                               .attr("r", 15);
                var imagePath = '<img src="/images/sketches/'+ 
                                d[3] + '.png" height="100">'
                tooltip.transition()
                     .duration(200)
                     .style("opacity", 1);
                tooltip.html(imagePath)
                     .style("left", (d3.event.pageX) + "px")
                     .style("top", (d3.event.pageY) + "px")
                     .style('z-index', 100)
                     .style("box-shadow", 
                            "0px 3px 5px 5px " + shadowGrey);
          })
      .on("mouseout", function(d, i) {
          d3.select(this).transition()
                         .attr("r", 10);
          tooltip.transition()
               .duration(500)
               .style("opacity", 0);
          })
      .on("click", function(d, i) {
          d3.select(this).transition()
                         .attr("r", 12);
          var imagePath = '<img src="/images/sketches/'+
                d[3] +'.png" height="500">'
          tooltip.transition()
               .duration(200)
               .style("opacity", 1);
          tooltip.html(imagePath)
               .style("left", "300px")
               .style("top", "100px")
               .style('z-index', 600)
               .style("box-shadow", 
                      "0px 3px 5px 5px" + shadowGrey);
          }); 

  svgContent.selectAll("text")
     .data(commitLog)
     .enter()
     .append("text")
     .text(function(d){
        return d[3];
        })
     .attr("x", function(d) { return x(d[0]); })
     .attr("y", function(d) { return y(d[2])+5; })
     .attr("font-family", "sans-serif")
     .attr("font-size", "11px")
     .style("text-anchor", "middle")
     .attr("fill", "white");
  }); // End code to generate paths
  // End Stuff to execute when log file loaded
      // NOTES FOR CODE FOLDING in VIM:
      // zc -- close fold
      // zo -- open fold
      // zM -- close all folds
      // zR -- open all folds
      // set foldmethod = syntax
  }); //player.ready attempt for the whole code chunk
} // end of window.onload code


