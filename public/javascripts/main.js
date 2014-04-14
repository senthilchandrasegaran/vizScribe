// Intension: A visual analytics tool for protocol analysis
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

// This function allows selection of transcript file (a CSV file) and
// displays it on the left bottom pane in the browser. Stop words are
// removed and the resulting tags are scaled by frequency and showed on
// the right pane.
window.onload = function() {
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
            console.log(captionArray);
            for (var i in captionArray) {
              if (captionArray[i][0].toLowerCase() !== "start time") {
                var words = captionArray[i][3].split(wordSeparators);
                var lowerCaseWords = captionArray[i][3].toLowerCase()
                                     .split(wordSeparators);
                lowerCaseLines.push(lowerCaseWords);
                for (var k in words) {
                  tempspan+= '<span id="line'+i+'word'+k+'">' +
                             words[k] + ' </span>';
                  spanArray.push([i,k,words[k].toLowerCase()]);
                }

                displayLines.push('<ul id="line ' + i + 
                                  ' speaker ' + captionArray[i][2] +'">' + 
                                  tempspan + '</ul>')
                tempspan = "";
              }
            }
            for (var j in displayLines) {
              $("#transContent").append(displayLines[j]);  
            }
            numLines = displayLines.length;
            // representation of lines in transcript overall window
            d3.select("#transGraph").selectAll("svg").remove();
            var transSvg = d3.select("#transGraph").append("svg");
            var w = $('#transGraph').width();
            var h = $('#transGraph').height();
            transSvg.attr("width", w)
                    .attr("height", h);

            var maxvalue = Math.max.apply(Math, tagFreq);
            var transGraphPadding = 1;                
            console.log("Number of lines = ", numLines);
            console.log("Graph width = ", w);
            console.log("Graph height = ", h);
            var rects = transSvg.selectAll("rect")   
                           .data(lowerCaseLines)       
                           .enter()             
                           .append("rect")
                           .attr("y", function(d,i) {
                                            return i* (h/numLines);
                                        })
                           .attr("x", function(d) {
                                            return 0;
                                            })
                           .attr("width", w)
                           .attr("height", h/numLines - transGraphPadding)
                           .attr("fill", function(d) {
                                return "rgba(123, 123, 123, 0.1)";
                           });
            var halfHeight = (h/numLines - transGraphPadding)/2;
            for (lineInd in lowerCaseLines){
              var numWords = lowerCaseLines[lineInd].length;
              console.log("lineInd = ", lineInd);
              console.log("numWords = ", numWords);
              var circles = transSvg.selectAll("circle")   
                           .data(lowerCaseLines[lineInd])       
                           .enter()             
                           .append("circle")
                           .attr("cy", lineInd * (h/numLines) + halfHeight)
                           .attr("cx", function(d, i){
                                        console.log("circle for word ", i);
                                        return i * (w/numWords);
                                    })
                           .attr("r", halfHeight)
                           .style("fill", "rgba(220, 138, 12, 1)");
            }
            // end representation of lines


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

          for (var tagNum in tagList) {
              tagspans+= '<text id="tag '+ 
                         tagNum + 
                         '" style = "font-size:' +
                         (tagList[tagNum][1]+10)+'pt;' + 
                         ' color:rgba(10, 100, 170, ' + 
                         parseFloat(tagList[tagNum][1] /
                                    maxfreq * 0.5 + 0.5).toFixed(3) +
                         ');">' +  
                         tagList[tagNum][0] + 
                         ' </text>';
              tagFreq.push(tagList[tagNum][1]);
            }
          $("#tagList").empty()
          $("#tagList").append(tagspans);  

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
                    var removeIndex = tagListDOM.children("text").index(this);
                    console.log(removeIndex);
                    console.log(tagList.length);
                    if (removeIndex > -1) {tagList.splice(removeIndex, 1);}
                    console.log(tagList.length);
                    // Then Regenerate taglist and barchart
                    // first empty the div
                    $("#tagList").empty();
                    console.log($("#tagList")[0].text);
                    // Then add everything with the updated tagList
                    var cloudArray = []
                    var tagNum = 0;
                    var maxfreq = tagList[0][1];
                    var tagspans = "";
                    var tagFreq = [];

                    for (var tagNum in tagList) {
                        tagspans+= '<text id="tag '+ 
                                   tagNum + 
                                   '" style = "font-size:' +
                                   (tagList[tagNum][1]+10)+'pt;' + 
                                   ' color:rgba(10, 100, 170, ' + 
                                   parseFloat(tagList[tagNum][1] /
                                              maxfreq * 0.5 + 0.5).toFixed(3) +
                                   ');">' +  
                                   tagList[tagNum][0] + 
                                   ' </text>';
                        tagFreq.push(tagList[tagNum][1]);
                      }
                    $("#tagList").append(tagspans);  

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
                    // Finally remove all highlights from transcript
                    $("#transContent ul").removeClass('hoverHighlight');
                    $("#transContent ul").removeClass('boldText');
                    d3.select("#timelineHover").selectAll("svg").remove()
            
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
            var player = videojs('discussion-video');
            var videoDuration = 0
            player.ready(function() {
              console.log('player is ready');
              $('#transContent').on('click', 'ul', function(e){
                var captionIndex = $('#transContent').children('ul').index(this);
                var captionStartTimeMin = captionArray[captionIndex][0]
                captionStartTimeSec = hmsToSec(captionStartTimeMin);
                e.preventDefault();
                player.currentTime(captionStartTimeSec);
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
              var transItemIds = []
              transItems.each(function(index, value){
                  var idIndex = $('#transContent').children('ul').index(this);
                  transItemIds.push(idIndex);
                  console.log(idIndex);
                  // change color of vertical text rep bars
                  var hiRects = $("#transGraph svg")
                                    .children('rect');
                  d3.select(hiRects[idIndex])
                    .attr("fill", "rgba(220, 138, 12, 0.3)");
                  var transSvg = d3.select("#transGraph").selectAll("svg");
                  var w = $('#transGraph').width();
                  var h = $('#transGraph').height();
                  transSvg.attr("width", w)
                          .attr("height", h);
                  console.log(w, h);
                  var numLines = hiRects.length;
        //          d3.select("#transGraph")
        //              .append("svg")
        //              .selectAll("circle")   
        //                .data(transWords)
        //                .enter()
        //                .append("circle")
        //                .attr("cy", idIndex* h/numLines)
        //                .attr("cx", 10)
        //                .attr("r", 3)
        //                .attr("fill", "rgba(220, 138, 12, 0.6)");
        //          console.log("circle!");
              });
              // TEST
        //      var transSvg = d3.select("#transGraph").selectAll("svg");
        //      var w = $('#transGraph').width();
        //      var h = $('#transGraph').height();
        //      transSvg.attr("width", w)
        //              .attr("height", h);
        //      var transList = $("#transContent ul");
        //      var numLines = transList.length;
        //      console.log("numLines = ", numLines);
        //      transList.each(function(transInd, transVal){
        //        console.log("transInd = ", transInd);
        //        console.log("transVal = ", transVal);
        //        var transWords = $(transList).children("span");
        //        transWords.each(function(wordInd, wordVal){
        //          console.log("wordInd = ", wordInd);
        //          console.log("wordVal = ", wordVal);
        //          if (transWords[wordInd].text == this.text) {
        //            console.log(transWords[wordInd].text);
        //            console.log(this.text);
        //            console.log(transInd, wordInd);
        //            d3.select("#transGraph")
        //                .selectAll("svg")
        //                .selectAll("circle")   
        //                  .data(transWords)
        //                  .enter()
        //                  .append("circle")
        //                  .attr("cy", transInd* h/numLines)
        //                  .attr("cx", wordInd* w/transWords.length)
        //                  .attr("r", 3)
        //                  .attr("fill", "rgba(220, 138, 12, 0.6)");
        //            console.log("circle!");
        //          }
        //        });
        //      });
              // END TEST
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

              var svgVideo = d3.select("#timelineHover").append("svg");
              var timelineLength = $('#timelineHover').width();
              var h = $('#timelineHover').height();
              svgVideo.attr("width", timelineLength)
                      .attr("height", h);

              var totalTime = videoDuration;
              var timeScale = timelineLength/videoDuration;
              var rects = svgVideo.selectAll("rect")   
                             .data(timeSegArray)       
                             .enter()             
                             .append("rect")
                             .style("stroke", "rgba(232, 138, 12, 0.7)")
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
                             .attr("fill", "rgba(232, 138, 12, 0.2)");
           // end highlight bars
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
              d3.select("#timelineHover").selectAll("svg").remove()
              // change color of vertical text rep bars
              d3.select("#transGraph").selectAll("svg")
                  .selectAll("rect")
                  .attr("fill", "rgba(123, 123, 123, 0.1)");
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
              // first remove previous highlighted bits
              d3.select("#timelineSelect").selectAll("svg").remove()
              var transItemIds = []
              transItems.each(function(index, value){
                  var idIndex = $('#transContent').children('ul').index(this);
                  transItemIds.push(idIndex);
                  // change color of vertical text rep bars
                  var hiRects = $("#transGraph svg")
                                    .children('rect');
                  d3.select(hiRects[idIndex])
                    .attr("fill", "rgba(75, 224, 0, 0.4)");
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

              var svgVideo = d3.select("#timelineSelect").append("svg");
              var timelineLength = $('#timelineSelect').width();
              var h = $('#timelineHover').height();
              svgVideo.attr("width", timelineLength)
                      .attr("height", h);

              var totalTime = videoDuration;
              var timeScale = timelineLength/videoDuration;
              var rects = svgVideo.selectAll("rect")   
                             .data(timeSegArray)       
                             .enter()             
                             .append("rect")
                             .style("stroke", "rgba(20, 255, 0, 0.8)")
                             .style("stroke-width", 1)
                             .attr("x", function(d,i) {
                                          return (d[0]*timeScale);
                                        })
                             .attr("y", 0)
                             .attr("rx", 2)
                             .attr("ry", 2)
                             .attr("width", 3)
                             .attr("height", h)
                             .attr("fill", "rgba(20, 255, 0, 0.3)");
           // end highlight bars
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
                .attr("fill", "rgba(123, 123, 123, 0.4)");
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

              var svgVideo = d3.select("#timelineHover").append("svg");
              var timelineLength = $('#timelineHover').width();
              var h = $('#timelineSelect').height();
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
            });

            // remove light highlighting on mouse leave
            $('#transContent').on('mouseleave', 'ul', function(){
              $(this).removeClass('transHighlight');
              d3.select("#timelineHover").selectAll("svg").remove()
              d3.select("#transGraph").selectAll("svg")
                  .selectAll("rect")
                  .attr("fill", "rgba(123, 123, 123, 0.1)");
            });

            // perform similar highlighting on mouse enter/ leave for bar chart
            $('#barChart').on('mouseenter', 'svg rect', function() {
              $(this).attr("fill", "rgba(232, 138, 12, 0.7)");
              var barIndex = $('#barChart svg').children('rect').index(this);
            //---------------------------------------------------------------   
            // light highlighting of tags and transcript
            //---------------------------------------------------------------   
              videoDuration = player.duration();
              var tagHoverText = $('#tagList').children('text')
                                                  .eq(barIndex)
                                                  .text();
              var highlightTag = $('#tagList').children('text').eq(barIndex);
              // note: 'eq' returns jquery object at index. 
              // For DOM object at index use 'get'
              $(highlightTag).addClass('hoverHighlight');
              var transItems =  $("#transContent ul span:contains('" 
                                  + tagHoverText + "')").closest("ul");
              transItems.addClass('hoverHighlight');
              $("#transContent ul span:contains('" + tagHoverText + "')")
                 .addClass('boldText');

              //----------------------------------------------   
              // add bars of highlighted bits next to seekbar
              //----------------------------------------------   
              var transItemIds = []
              transItems.each(function(index, value){
                  var idIndex = $('#transContent').children('ul')
                                                  .index(tagHoverText);
                  transItemIds.push(barIndex);
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

              var svgVideo = d3.select("#timelineHover").append("svg");
              var timelineLength = $('#timelineHover').width();
              var h = $('#timelineHover').height();
              svgVideo.attr("width", timelineLength)
                      .attr("height", h);

              var totalTime = videoDuration;
              var timeScale = timelineLength/videoDuration;
              var rects = svgVideo.selectAll("rect")   
                             .data(timeSegArray)       
                             .enter()             
                             .append("rect")
                             .style("stroke", "rgba(232, 138, 12, 0.7)")
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
                             .attr("fill", "rgba(232, 138, 12, 0.2)");
           // end highlight bars
            }); // end of barchart onmouseenter function.

            $('#barChart').on('mouseleave', 'svg rect', function() {
              $(this).attr("fill", "rgba(0, 120, 200, 1)");
              //---------------------------------------------------------------   
              // remove light highlighting on mouse leave
              //---------------------------------------------------------------   
              $("#tagList text").removeClass('hoverHighlight');
              $("#transContent ul").removeClass('hoverHighlight');
              $("#transContent ul span").removeClass('boldText');
              d3.select("#timelineHover").selectAll("svg").remove()
            }); // end of barchart onmouseleave function

            // More permanent highlighting on mouse click (on the bars)
            $('#barChart').on('click', 'svg rect', function() {
              //first remove any current highlighting:
              $("barChart").select("svg").children("rect")
                                         .attr("fill", "rgba(0, 120, 200, 1)");
              $("#tagList text").removeClass('tagClickHighlight');
              $("#transContent ul").removeClass('textClickHighlight');
              $("#transContent ul span").removeClass('boldText');
              // then add highlighting based on current selection:
              $(this).attr("fill", "rgba(75, 224, 0, 0.4)");
              var barIndex = $('#barChart svg').children('rect').index(this);
            //---------------------------------------------------------------   
            // light highlighting of tags and transcript
            //---------------------------------------------------------------   
              videoDuration = player.duration();
              var tagHoverText = $('#tagList').children('text')
                                                  .eq(barIndex)
                                                  .text();
              var highlightTag = $('#tagList').children('text').eq(barIndex);
              // note: 'eq' returns jquery object at index. 
              // For DOM object at index use 'get'
              $(highlightTag).removeClass('tagClickHighlight');
              $(highlightTag).addClass('tagClickHighlight');
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
                  var idIndex = $('#transContent').children('ul')
                                                  .index(tagHoverText);
                  transItemIds.push(barIndex);
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

              var svgVideo = d3.select("#timelineSelect").append("svg");
              var timelineLength = $('#timelineSelect').width();
              var h = $('#timelineHover').height();
              svgVideo.attr("width", timelineLength)
                      .attr("height", h);

              var totalTime = videoDuration;
              var timeScale = timelineLength/videoDuration;
              var rects = svgVideo.selectAll("rect")   
                             .data(timeSegArray)       
                             .enter()             
                             .append("rect")
                             .style("stroke", "rgba(20, 255, 0, 0.7)")
                             .style("stroke-width", 1)
                             .attr("x", function(d,i) {
                                          return (d[0]*timeScale);
                                        })
                             .attr("y", 0)
                             .attr("rx", 2)
                             .attr("ry", 2)
                             .attr("width", 3)
                             .attr("height", h)
                             .attr("fill", "rgba(20, 255, 0, 0.2)");
           // end highlight bars
          }); // end of barchart onclick function.

          // add brushing on protocols
  

        // this part executed when json file is opened by the user.
        // This calls the handleJSONselect function and generates the tree.
          document.getElementById('jsonFile')
                  .addEventListener('change', handleJSONSelect, false);
          // Generate hierarchical protocol tree from json file.
          function handleJSONSelect(evt) {
            var jsonFiles = evt.target.files;
            var jsonFile = jsonFiles[0];
            var reader = new FileReader();
            reader.readAsDataURL(jsonFile);
            reader.onloadend = function() {
              var margin = {top: 30, right: 20, bottom: 30, left: 20},
                  width = $('#protocolContent').innerWidth() - 
                          margin.left - margin.right,
                  barHeight = 20,
                  barWidth = width * .8;

              var i = 0,
                  duration = 400,
                  root;

              var tree = d3.layout.tree()
                  .size([0, 100]);

              var diagonal = d3.svg.diagonal()
                  .projection(function(d) { return [d.y, d.x]; });
              d3.select("#protocolContent").selectAll("svg").remove();
              var svg = d3.select("#protocolContent").append("svg")
                  .attr("width", width + margin.left + margin.right)
                .append("g")
                  .attr("transform", "translate(" + 
                        margin.left + "," + margin.top + ")");
              d3.json(reader.result, function(error, protocols) {
                protocols.x0 = 0;
                protocols.y0 = 0;
                update(root = protocols);
              });

              function update(source) {
                // Compute the flattened node list. TODO use d3.layout.hierarchy.
                var nodes = tree.nodes(root);

                var height = Math.max(500, nodes.length * barHeight + 
                                      margin.top + margin.bottom);
                d3.select("svg")
                    .attr("height", height);

                d3.select(self.frameElement)
                    .style("height", height + "px");
                // Compute the "layout".
                nodes.forEach(function(n, i) {
                  n.x = i * barHeight;
                });
                // Update the nodes…
                var node = svg.selectAll("g.node")
                    .data(nodes, function(d) { return d.id || (d.id = ++i); });
                var nodeEnter = node.enter().append("g")
                    .attr("class", "node")
                    .attr("transform", function(d) { 
                        return "translate(" + source.y0 + "," + source.x0 + ")"; 
                        })
                    .style("opacity", 1e-6);
                // Enter any new nodes at the parent's previous position.
                nodeEnter.append("rect")
                    .attr("y", -barHeight / 2)
                    .attr("height", barHeight)
                    .attr("width", barWidth)
                    .style("fill", color)
                    .on("click", click);
                nodeEnter.append("text")
                    .attr("dy", 3.5)
                    .attr("dx", 5.5)
                    .text(function(d) { return d.name; });
                // Transition nodes to their new position.
                nodeEnter.transition()
                    .duration(duration)
                    .attr("transform", function(d) { 
                        return "translate(" + d.y + "," + d.x + ")"; 
                        })
                    .style("opacity", 1);
                node.transition()
                    .duration(duration)
                    .attr("transform", function(d) { 
                        return "translate(" + d.y + "," + d.x + ")"; 
                        })
                    .style("opacity", 1)
                  .select("rect")
                    .style("fill", color);
                // Transition exiting nodes to the parent's new position.
                node.exit().transition()
                    .duration(duration)
                    .attr("transform", function(d) { 
                        return "translate(" + source.y + "," + source.x + ")"; 
                        })
                    .style("opacity", 1e-6)
                    .remove();
                // Update the links…
                var link = svg.selectAll("path.link")
                    .data(tree.links(nodes), 
                          function(d) { return d.target.id; });
                // Enter any new links at the parent's previous position.
                link.enter().insert("path", "g")
                    .attr("class", "link")
                    .attr("d", function(d) {
                      var o = {x: source.x0, y: source.y0};
                      return diagonal({source: o, target: o});
                    })
                  .transition()
                    .duration(duration)
                    .attr("d", diagonal);
                // Transition links to their new position.
                link.transition()
                    .duration(duration)
                    .attr("d", diagonal);
                // Transition exiting nodes to the parent's new position.
                link.exit().transition()
                    .duration(duration)
                    .attr("d", function(d) {
                      var o = {x: source.x, y: source.y};
                      return diagonal({source: o, target: o});
                    })
                    .remove();
                // Stash the old positions for transition.
                nodes.forEach(function(d) {
                  d.x0 = d.x;
                  d.y0 = d.y;
                });
              } // end of function update(source)
              // Toggle children on click.
              function click(d) {
                if (d.children) {
                  d._children = d.children;
                  d.children = null;
                } else {
                  d.children = d._children;
                  d._children = null;
                }
                update(d);
              }
              function color(d) {
                return d._children ? "#3182bd" : 
                       d.children ? "#c6dbef" : "#fd8d3c";
              }
            } // end of filereader function
          } // end of handleJSONselect part of the code.

        // NOTES FOR CODE FOLDING in VIM:
        // zc -- close fold
        // zo -- open fold
        // zM -- close all folds
        // zR -- open all folds
        // set foldmethod = syntax
          });
        }
