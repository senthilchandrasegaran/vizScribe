// VizScribe: A visual analytics tool for protocol analysis
//    Code by: Senthil Chandrasegaran
//             Sriram Karthik Badam

// Global variables
var wordSeparators = /[\s\u3031-\u3035\u309b\u309c\u30a0\u30fc\uff70]+/g;
var w = 960,
    h = 600;

var words = [],
    max,
    scale = 1,
    complete = 0,
    keyword = "",
    tags,
    fontSize,
    maxLength = 30,
    numLines = 0;
    // statusText = d3.select("#status");

var transcript = [];
var lowerCaseLines = [];
var tagsToRemove = []; // list of words the user removes from taglist
var displayLines = [];
var tempspan = '';
var spanArray = [];
var captionArray = [];
var protocolArray = [];
var protocolList = [];
var protocolObject = {};
var oldProtocolObject = {};
var selectedText = '';
var spanCollection = [];
var transGraphData = []; // data structure for transGraph display
var videoLenSec;


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
var greenHighlight = "rgba(232, 138, 12, 1)";

var transGraphColor = "rgba(123, 123, 123, 0.2)";
var boldHighlightColor = "rgba(255, 127, 0, 0.8)";
var mildHighlightColor = "rgba(255, 127, 0, 0.8)";
var wordCloudColor = "rgba(10, 100, 70, 0.7)";
var shadowGrey = "rgba(123,123,123,0.7)";

// div values
var bottomLeftHeight = 0;
var sketchesHeight = 0;
var speechLogHeight = 0;
var activityLogHeight = 0;
var protocolGraphHeight = 0;

var speakerColors = [
  "#e41a1c",
  "#377eb8",
  "#4daf4a",
  "#984ea3"
  ]

/*
var colorlist = [ "rgba(228,26,28,",
                  "rgba(55,126,184,",
                  "rgba(77,175,74,",
                  "rgba(152,78,163,",
                  "rgba(255,127,0," ];
*/

// Note: the color list below is instantiated in reverse order in the
// interface.
var colorlistFull = [ 
      'rgba(177,89,40,',
      'rgba(106,61,154,',
      'rgba(202,178,214,',
      'rgba(253,191,111,',
      'rgba(227,26,28,',
      'rgba(251,154,153,',
      'rgba(51,160,44,',
      'rgba(178,223,138,',
      'rgba(31,120,180,',
      'rgba(166,206,227,',
      'rgba(177,89,40,',      // color list duplicates from here on.
      'rgba(106,61,154,',
      'rgba(202,178,214,',
      'rgba(253,191,111,',
      'rgba(227,26,28,',
      'rgba(251,154,153,',
      'rgba(51,160,44,',
      'rgba(178,223,138,',
      'rgba(31,120,180,',
      'rgba(166,206,227,',
      'rgba(177,89,40,',
      'rgba(106,61,154,',
      'rgba(202,178,214,',
      'rgba(253,191,111,',
      'rgba(227,26,28,',
      'rgba(251,154,153,',
      'rgba(51,160,44,',
      'rgba(178,223,138,',
      'rgba(31,120,180,',
      'rgba(166,206,227,'
    ];

// When a new protocol is added
var getColor = function () {
    return colorlistFull.pop();
}

// When the protocol is deleted!
var pushColor = function (color) {
    colorlistFull.push(color);
};

var depthFirstTraversalProtocolTree = function () {
    var sortedList = [];
    var protocolNames = Object.keys(protocolObject);
    for (var i = 0; i < protocolNames.length; i++) {
        var protocolName = protocolNames[i];
        var level = protocolObject[protocolNames[i]].level;
        var parentName = protocolObject[protocolNames[i]].parentName;
        var deleted = protocolObject[protocolNames[i]].deleted;
        if (level == 1 && !deleted) {
            var childrenList = [];
            protocolObject[protocolName].hasChildren = preOrderTraversal(protocolName, childrenList, protocolNames);
            sortedList.push(protocolName);
            if (childrenList.length > 0)
                sortedList = sortedList.concat(childrenList);
        }
    }
    return sortedList;
}

function preOrderTraversal(protocolName, childrenList, protocolNames) {
    var hasChildren = false; 
    for (var i = 0; i < protocolNames.length; i++) {
        var tempProtocolName = protocolNames[i];
        var parentName = protocolObject[tempProtocolName].parentName;
        var deleted = protocolObject[tempProtocolName].deleted;
        
        if (parentName == protocolName && !deleted) {
            childrenList.push(tempProtocolName);
            protocolObject[tempProtocolName].hasChildren = preOrderTraversal(tempProtocolName, childrenList, protocolNames);
            hasChildren = true; 
        }
    }

    return hasChildren; 
}


var sketchPathColor = "rgba(225, 120, 0, 0.2)";

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

//copied from 
//http://stackoverflow.com/questions/3410464/how-to-find-all-occurrences-of-one-string-in-another-in-javascript
function getIndicesOf(searchStr, str, caseSensitive) {
    var startIndex = 0, searchStrLen = searchStr.length;
    var index, indices = [];
    if (!caseSensitive) {
        str = str.toLowerCase();
        searchStr = searchStr.toLowerCase();
    }
    while ((index = str.indexOf(searchStr, startIndex)) > -1) {
        indices.push(index);
        startIndex = index + searchStrLen;
    }
    return indices;
}


function concordance(word) {
    //take the captionArray and put in one string
    var allCaptions = "";
    var window = 60; 
    captionArray.forEach(function (caption) {
        allCaptions += caption[3] + " ";
    });
    
    //now search of the index (indices) of the word in the allCaptions
    var indices = getIndicesOf(word, allCaptions, false);

    //Array of the concordances
    var concordances = ["<table id='concTable'>"];

    for (var i = 0; i < indices.length; i++) {
        var index = indices[i];
        var left = index - window < 0 ? 0 : index - window;
        var right = index + window + word.length > 
                    allCaptions.length-1 ? 
                    allCaptions.length-1 : index + window + word.length;
        concordances.push("<tr>" + 
                          "<td align='right'>" + 
                          allCaptions.substring(left, index - 1) + 
                          "</td>" +
                          "<td width=10px></td>" +
                          "<td align='center'><b>" + 
                          allCaptions.substring(index, 
                                                index+word.length-1) + 
                          " </b></td>" +
                          "<td width=10px></td>" +
                          "<td align='left'>" +
                          allCaptions.substring(index + word.length, 
                                                right) + 
                          "</td>" + 
                          "</tr>");
    }
    concordances.push("</table>")
    return concordances; 
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
window.onload = function () {
  // determine div heights as specified in the html file
  bottomLeftHeight = $("#bottomleft").height();
  sketchesHeight = $("#sketches").height();
  sketchLogHeight = $("#sketchLog").height();
  speechLogHeight = $("#speechLog").height();
  activityLogHeight = $("#activityLog").height();
  protocolGraphHeight = $("#protocolGraph").height();
  
  var player = videojs('discussion-video');
  player.on('loadedmetadata', function () {
    // var files = evt.target.files; // FileList object
    // files is a FileList of File objects. List some properties.
    var transcriptFile;
    var fileTemp = $.ajax({
      type: "GET", // can remove this to avoid confusion
      url: "/receive_transcript_file", // change to send_trn_fil
      // note: "send" from POV of client
      dataType: "text"
    }).done(function (data) {
      console.log(typeof data);
      captionArray = $.csv.toArrays(data);
      // remove the first line, since it's the data header.
      captionArray.splice(0,1);
      /* Fix this later.
      var dataArray = data.split("\n");
      console.log(dataArray);
      for (var i=1; i< dataArray.length; i++){
        var dataRow = dataArray[i].split("\t");
        captionArray.push(dataRow);
      }
      */
      var longestLineLength = 0; // num words in the longest line
      for (var i in captionArray) {
        if ((captionArray[i].length > 1) &&
            (captionArray[i][0].toLowerCase() !== "start time")) {
          var tempLine = captionArray[i][3];
          var words = captionArray[i][3].split(wordSeparators);
          if (words.length > longestLineLength) {
            longestLineLength = words.length;
          }
          var lowerCaseWords = captionArray[i][3]
                                 .toLowerCase()
                                 .split(wordSeparators);
          // lowerCaseWords.shift();
          // for some reason, the wordSeparators split the line in
          // a way that the first word is an empty "".
          // lowerCaseWords.shift() gets rid of that "".
          lowerCaseLines.push(lowerCaseWords);
          for (var k in words) {
            tempspan += '<span id="line' + i + 'word' + k + '">' +
                        words[k] + ' </span>';
            spanArray.push([i, k, words[k].toLowerCase()]);
          }

          // this is the undo point!
          displayLines.push(
             '<tr id="row' +i+ '">' +
             '<td style="border: 1px solid rgba(200,200,200,0.8); '+
             'color: rgba(100,100,100,0.5); ' +
             'font-family:courier; font-size:7pt;"'+
             'class="unselectable" id="time'+i+'">' + 
              captionArray[i][0].split(".")[0] +  
             '</td>' +
             '<td id="line'+ i + '">' +
              tempspan + '</td></tr>')
          tempspan = "";
        }
      }
      for (var j in displayLines) {
        $("#transTable").append(displayLines[j]);
      }
      numLines = displayLines.length;

      // This jQuery code below makes the transcript text
      // annotable using the annotator library.  The setupPlugins
      // sets up annotator in the 'default' mode.
      jQuery(function ($) {
        $('#bottomright').annotator().annotator('setupPlugins');
        $('#transContent').height($('#bottomright').height()-80);
        // the above line was added because the annotator-wrapper div
        // seems to be overwriting the transContent height settings.
      });

      player.ready(function () {
        videoLenSec = player.duration();
        // representation of lines in transcript overall window
        d3.select("#transGraph").selectAll("svg").remove();
        var w = $('#transGraph').width()-2; //because of the border
        var h = $('#transGraph').height()-2; //because of the border
        var transSvg = d3.select("#transGraph").append("svg")
                   .attr("width", w)
                   .attr("height", h)
                   .style({"border" : "1px solid #d0d0d0"});
        /*
        transSvg.attr("width", w)
        .attr("height", h);
        */

        var transcriptScale = d3.scale.linear()
                            .domain([0, Math.round(videoLenSec)])
                            .range([0, w]);
        // var maxvalue = Math.max.apply(Math, tagFreq);
        var transGraphPadding = 0;
        var scaleHeights = 0;
        var constantWidth = 1;
        for (i=0; i < lowerCaseLines.length; i++){
          var d = {};
          var xSec = hmsToSec(captionArray[i][0]);
          var xloc = transcriptScale(xSec);
          d.x = xloc;
          d.y = 0;
          if (constantWidth != 0){
            d.width = 5;
          } else {
            var endSec = hmsToSec(captionArray[i][1]);
            var startSec = hmsToSec(captionArray[i][0]);
            // d.width = transcriptScale(endSec - startSec);
            d.width = 3;
          }
          if (scaleHeights === 0){
            d.height = h;
          } else {
            // scales line height proportional to the number of
            // words in the line, but it makes short utterances
            // difficult to make out.
            var lineRatio = d.length / longestLineLength;
            d.height = lineRatio * h;
          }
          d.dialog = captionArray[i][3];
          transGraphData.push(d);
        }

        var tip = d3.tip()
                    .attr('class', 'd3-tip')
                    .direction('s')
                    .html(function(d){return d.dialog;});
        transSvg.call(tip);
        var rects = transSvg.selectAll("rect")
                 .data(transGraphData)
                 .enter()
                 .append("rect")
                 .attr("x", function (d) { return d.x; })
                 .attr("y", function (d) { return d.y; })
                 .attr("width", function (d) { return d.width; })
                 .attr("z", 1)
                 .attr("height", function (d) { return d.height; })
                 .attr("stroke-width", 1)
                 .attr("stroke", "rgba(255,255,255,1)")
                 .attr("fill", function (d) {
                     return transGraphColor;
                 })
                 .on("mouseover", tip.show)
                 .on("mouseout", tip.hide);
        // end representation of lines
      }); // end player.ready()

      $("#tagList").empty()
      // $("#tagList").append(tagspans);
      $("#tagList").append(makeWordList(lowerCaseLines));

      // Remove tag on right click
      var tagListDOM = $('#tagList');
      tagListDOM.oncontextmenu = function () { return false; }
      tagListDOM.on('mousedown', 'text', function (e) {
        if (e.button == 2) {
          var isRemoveTag = confirm("Remove tag: " +
                              $(this).text() +
                              " from list?");
          if (isRemoveTag == true) {
            var tagToRemove = $(this).text();
            tagsToRemove.push(tagToRemove);
            $("#tagList").empty();
            $("#tagList").append(makeWordList(lowerCaseLines,
                                              tagsToRemove));
            // Finally remove all highlights from transcript
            $("#transTable").find("td").removeClass('hoverHighlight');
            $("#transTable").find("span").removeClass('boldText');
          }
        } 
      }); // end function for remove tag on rightclick

      //----------------------------------------------------------
      // light highlighting on mouse enter
      //----------------------------------------------------------
      var tagHoverText = "";
      tagListDOM.on('mouseenter', 'text', function () {
        videoDuration = player.duration();
        $(this).addClass('hoverHighlight');
        tagHoverText = $.trim($(this).text());
        // var transItems = $("#transTable tr td span:containsNC('"
        //                 + tagHoverText + "')").closest("td");
        var transItems = $("#transTable tr td").find("span")
              .filter(function(){
                var regex = new RegExp("\\b" + tagHoverText + "\\b");
                return (this.textContent).toLowerCase().match(regex);
              }).closest("td");
        transItems.addClass('hoverHighlight');
        $("#transTable tr td").find("span")
              .filter(function(){
                var regex = new RegExp("\\b" + tagHoverText + "\\b");
                return (this.textContent).toLowerCase().match(regex);
              }).addClass('boldText');
        /* 
        $("#transTable tr td span:containsNC('" + 
          tagHoverText + "')").addClass('boldText');
          */

        //----------------------------------------------   
        // Highlight corresponding items in transGraph
        //----------------------------------------------   
        var transItemIds = [];
        transItems.each(function (index, value) {
          var idIndex = value.parentNode.rowIndex;
          transItemIds.push(idIndex);
          // change color of vertical text rep bars
          var hiRects = $("#transGraph svg").children('rect');
          d3.select(hiRects[idIndex])
            .attr("fill", oldHighlighting);
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
      tagListDOM.on('mouseleave', 'text', function () {
        $(this).removeClass('hoverHighlight');
        $("#transTable").find("td").removeClass('hoverHighlight');
        $("#transTable").find("span").removeClass('boldText');
        /*
        $("#transContent ul li span:containsNC('" + tagHoverText + "')")
        .closest("li").removeClass('hoverHighlight');
        $("#transContent ul li span:containsNC('" + tagHoverText + "')")
        .removeClass('boldText');
        */
        d3.select("#transGraph").selectAll("svg")
        .selectAll("rect")
        .attr("fill", transGraphColor);
      });

      //---------------------------------------------------------------   
      // dark highlighting on mouse click
      //---------------------------------------------------------------   
      tagListDOM.on('click', 'text', function (e) {
          // KB edits ----
          if (e.ctrlKey || e.metaKey) {
              document.getElementById('concordance-view').style.visibility = 'visible';
              //get concordance
              var word = $(this).text();
              var allConcordances = concordance(word);
              $('#concordance-view-content').children().remove();
              //now add it to the interface
              allConcordances.forEach(function (eachConcordance) {
                  $('#concordance-view-content').append(eachConcordance + "<br/>");
              });

              // -------------
          } else {
              
              $(this).parent().children('text')
                      .removeClass('tagClickHighlight');
              $(this).addClass('tagClickHighlight');

              tagHoverText = $.trim($(this).text());
              $('.textClickHighlight').removeClass('textClickHighlight');
              $('.boldClickText').removeClass('boldClickText');
              var transItems = $("#transTable tr td").find("span")
                .filter(function(){
                  var regex = new RegExp("\\b" + tagHoverText + "\\b");
                  return (this.textContent).toLowerCase().match(regex);
                }).closest("td");
              transItems.addClass('textClickHighlight');
              $("#transTable tr td").find("span")
                .filter(function(){
                  var regex = new RegExp("\\b" + tagHoverText + "\\b");
                  return (this.textContent).toLowerCase().match(regex);
                }).addClass('boldClickText');

              //----------------------------------------------   
              // add bars of highlighted bits next to seekbar
              //----------------------------------------------   
              var transItemIds = []
              transItems.each(function (index, value) {
                  // var idIndex = $('#transContent ul').children('li').index(this);
                  var idIndex = value.parentNode.rowIndex;
                  transItemIds.push(idIndex);
                  // change color of vertical text rep bars
                  var hiRects = $("#transGraph svg")
                            .children('rect');
                  d3.select(hiRects[idIndex])
            .attr("fill", boldHighlightColor);
              })
              var timeSegArray = [];
              //load corresponding times of highlighted li items in a list
              var ind = 0;
              for (ind in transItemIds) {
                  var numInd = transItemIds[ind];
                  var startTime = hmsToSec(captionArray[numInd][0]);
                  var duration = hmsToSec(captionArray[numInd][1]) -
                           startTime;
                  timeSegArray.push([startTime, duration]);
              }
          }
      });


      //----------------------------------------------------------
      // Video seeking Code
      //----------------------------------------------------------
      var videoDuration = 0
      player.ready(function () {
          $('#transTable').on('click', 'tr', function (e) {
            if (e.ctrlKey || e.metaKey) {
              e.preventDefault();
              var captionIndex = this.rowIndex;
              var captionStartTimeMin = 
                captionArray[captionIndex][0];
              captionStartTimeSec = hmsToSec(captionStartTimeMin);
              player.currentTime(captionStartTimeSec);
            }
          });
      });
      //----------------------------------------------------------
      // End of Video seeking Code
      //----------------------------------------------------------

      //---------------------------------------------------------------   
      // light gray highlighting on mouseover for transcript
      //---------------------------------------------------------------   
      
      // Add highlighting on mouseenter
      $('#transTable').on('mouseenter', 'tr', function () {
          $(this).children().last().addClass('transHighlight');
          //----------------------------------------------   
          // add bars of highlighted bits next to seekbar
          //----------------------------------------------   
          var transItemIds = []
          var idIndex = this.rowIndex;
          transItemIds.push(idIndex);
          // change color of vertical text rep bars
          var hiRects = $("#transGraph svg")
                          .children('rect');
          d3.select(hiRects[idIndex])
        .attr("fill", mildHighlightColor);
          var timeSegArray = [];
          //load corresponding times of highlighted li items in a list
          var ind = 0;
          for (ind in transItemIds) {
              var numInd = transItemIds[ind];
              var startTime = hmsToSec(captionArray[numInd][0]);
              var duration = hmsToSec(captionArray[numInd][1]) -
                           startTime;
              timeSegArray.push([startTime, duration]);
          }
      }); 

      // remove highlighting on mouse leave
      $('#transTable').on('mouseleave', 'tr', function () {
          $(this).children().removeClass('transHighlight');
          d3.select("#transGraph").selectAll("svg")
          .selectAll("rect")
          .attr("fill", transGraphColor);
      }); 

      //--------------------------------------------------------------- 
      // end of light gray highlighting on mouseover for transcript
      //---------------------------------------------------------------

      // Allow interaction with seesoft-like visualization
      $('#transGraph').find('svg').first()
                      .on('mouseenter', 'rect', function () {
          // implementing fisheye distortion
          var localDistort = 1;
          if (localDistort != 0){
            var fisheyesvg = d3.select("#transGraph").selectAll("svg");
            var frects = fisheyesvg.selectAll("rect");
            var fisheye = d3.fisheye.circular()
                            .radius(50)
                            .distortion(20);
            fisheyesvg.on("mousemove", function(){
              fisheye.focus(d3.mouse(this));
              frects.each(function(d){
                        d.fisheye = fisheye(d);
                     })
                     .attr("x", function (d) {
                       return d.fisheye.x;
                     });
            });
          }
          $(this).attr("fill", greenHighlight);
          $(this).attr("z", 50);
          var transGraphIndex = $('#transGraph svg')
                            .children('rect').index(this);

          // light highlighting of transcript
          videoDuration = player.duration();
          var transItem = $('#transTable tr').eq(transGraphIndex)
                                             .children().last();
          transItem.addClass('hoverHighlight');
          // note: 'eq' returns jquery object at index. 
          // For DOM object at index use 'get'
      }); // end of transGraph onmouseenter function.

      $('#transGraph').on('mouseleave', 'svg rect', function () {
          $(this).attr("fill", transGraphColor);
          $(this).attr("z", 1);

          // remove light highlighting on mouse leave
          $("#transTable").find("td").removeClass('hoverHighlight');
      }); // end of transGraph onmouseleave function

      // var player = videojs('discussion-video');
      var videoDuration = 0
      player.ready(function () {
        $('#transGraph svg').on('click', 'rect', function (e) {
          var transGraphIndex = $('#transGraph svg')
                                  .children('rect')
                                  .index(this);
          var captionStartTimeMin = captionArray[transGraphIndex][0]
          captionStartTimeSec = hmsToSec(captionStartTimeMin);
          e.preventDefault();
          player.currentTime(captionStartTimeSec);
          // wavesurfer.seek(captionStartTimeSec/player.duration());
          var transClickItem = $('#transTable tr').eq(transGraphIndex)
                                                  .children().last();
          transClickItem.addClass('hoverHighlight');
          // this small snippet below to scroll the transcript to show
          // the line corresponding to the item selected in transgraph
          var topPos = $(transClickItem).offset().top;
          $('#transContent').scrollTo($(transClickItem),
                                      {duration: 'slow',
                                       transition: 'ease-in-out'});
        });
      });

      // toggle the size of the sketchLog div 
      $("#sketchLogTitle").click(function () {
          if ($("#sketchLog").hasClass('minimize')) {
              $("#sketchLog").animate({ height: sketchLogHeight }, 200,
                  function(){
                    $("#sketchLogTitle")
                      .text("sketch Participation Chart "+
                            "[click to contract view]");
                  }).removeClass('minimize');
          } else {
              $("#sketchLog").animate({ height: 1 }, 200, "swing",
                  function(){
                    $("#sketchLogTitle")
                      .text("sketch Participation Chart "+
                            "[click to expand view]");
                  }).addClass('minimize');
          }
      });

      // toggle the size of the speechLog div 
      $("#speechLogTitle").click(function () {
          if ($("#speechLog").hasClass('minimize')) {
              $("#speechLog").animate({ height: speechLogHeight }, 200,
                  function(){
                    $("#speechLogTitle")
                      .text("Speech Participation Chart "+
                            "[click to contract view]");
                  }).removeClass('minimize');
          } else {
              $("#speechLog").animate({ height: 1 }, 200, "swing",
                  function(){
                    $("#speechLogTitle")
                      .text("Speech Participation Chart "+
                            "[click to expand view]");
                  }).addClass('minimize');
          }
      });

      // toggle the size of the activityLog div 
      $("#activityLogTitle").click(function () {
          if ($("#activityLog").hasClass('minimize')) {
              $("#activityLog").animate({height:activityLogHeight},200,
                  function(){
                    $("#activityLogTitle")
                      .text("Activity Level Chart "+
                            "[click to contract view]");
                  }).removeClass('minimize');
          } else {
              $("#activityLog").animate({ height: 1 }, 200, "swing",
                  function(){
                    $("#activityLogTitle")
                      .text("Activity Level Chart "+
                            "[click to expand view]");
                  }).addClass('minimize');
          }
      });

      // toggle the size of the protocolGraph div 
      $("#protocolGraphTitle").click(function () {
          if ($("#protocolGraph").hasClass('minimize')) {
              $("#protocolGraph").animate({height:protocolGraphHeight},
                                          200,
                  function(){
                    $("#protocolGraphTitle")
                      .text("Code Timeline "+
                            "[click to contract view]");
                  }).removeClass('minimize');
          } else {
              $("#protocolGraph").animate({ height: 1}, 200, "swing",
                  function(){
                    $("#protocolGraphTitle")
                      .text("Code Timeline "+
                            "[click to expand view]");
                  }).addClass('minimize');
          }
      });

      // show Video Progress on the sketch and Protocol Divs
      var vidPlayer = videojs("discussion-video");
      vidPlayer.ready(function () {
          // this is for the new sketch div
          var $sketchLogScrubberProgress = $("#sketchLogScrubber");
          var skOffsetMargin = $("#sketchLog").height() + 
                           parseFloat(
                             $("#sketchLog").css("border-top-width")
                                            .split("px")[0])+
                           parseFloat(
                             $("#sketchLog").css("border-bottom-width")
                                          .split("px")[0]);
          $sketchLogScrubberProgress.css({"margin-top": 
                                          0-skOffsetMargin});
          // scrubber for speech div
          var $speechLogScrubberProgress = $("#speechLogScrubber");
          var spOffsetMargin = $("#speechLog").height() + 
                           parseFloat(
                             $("#speechLog").css("border-top-width")
                                            .split("px")[0])+
                           parseFloat(
                             $("#speechLog").css("border-bottom-width")
                                          .split("px")[0]);
          $speechLogScrubberProgress.css({"margin-top": 
                                          0-spOffsetMargin});
          // scrubber for activity div
          var $activityLogScrubberProgress = $("#activityLogScrubber");
          actOffsetMargin = $("#activityLog").height() + 
                           parseFloat(
                             $("#activityLog").css("border-top-width")
                                              .split("px")[0])+
                           parseFloat(
                             $("#activityLog").css("border-bottom-width")
                                              .split("px")[0]);
          $activityLogScrubberProgress.css({"margin-top": 
                                            0-actOffsetMargin});
          var $protocolScrubberProgress = $("#protocolGraphScrubber");
          protocolOffsetMargin = $("#protocolGraph").height() + 
                           parseFloat(
                             $("#protocolGraph").css("border-top-width")
                                              .split("px")[0])+
                           parseFloat(
                             $("#protocolGraph").css("border-bottom-width")
                                              .split("px")[0]);
          $protocolScrubberProgress.css({"margin-top": 
                                            0-protocolOffsetMargin});
          vidPlayer.on('timeupdate', function (e) {
              var percent = this.currentTime() / this.duration();
              $sketchLogScrubberProgress.width((percent * 100) + "%");
              $speechLogScrubberProgress.width((percent * 100) + "%");
              $activityLogScrubberProgress.width((percent * 100) + "%");
              $protocolScrubberProgress.width((percent * 100) + "%");
          });
      });

      // Allow tabbed indenting on protocol textArea field
      // Code snippet credit to
      // jqueryrain.com/2012/09/indentation-in-textarea-using-jquery/
      $('textArea').keydown(function (e) {
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

      $('ul.tabs li:first').on('click', function () {
          if ($(this).hasClass('active')) {
              var pArray = document
            .getElementById('protocolTextArea')
            .value
            .split("\n");

              function removeTabs(pString) {
                  return pString.split("\t")[pString.split("\t").length - 1];
              }

              // deleted code for array splitting
              // add new code that works, the old one didn't.

              // display the tree with some D3 code
              d3.select("#protoView").selectAll("svg").remove();
              var protoViewSvg = d3.select("#protoView")
                                   .append("svg")
                                   .attr("height", 400);
              var w = $('#protoView').width();
              var h = $('#protoView').height();

              var protoViewPadding = 5;
              var colorindex = -1;
              var tmp = -1;

              //protocolList = [];
              protocolColorList = [];


              //KB edits --------

              //working with pArray directly
              //need to find difference to 
              //make sure the protocol are not completely rewritten 

              //Structure of the protocol object
              // protocol1 : {color, level, parentName}
              // protocol2 : {color, level, parentName}
              // protocol3 : {color, level, parentName}
              // note that this is a linear buffer but the hierarchy is encoded in level variable

              //read the protocols and levels into a list first 

              var newProtocolList = [];
              var parentName = "#ISROOT#";
              for (var i = 0; i < pArray.length; i++) {
                  var d = pArray[i];
                  var tabCount = d.split("\t").length;
                  var protocolName = d.split("\t")[tabCount - 1];
                  protocolName = protocolName.trim()

                  newProtocolList.push({
                      protocolName: protocolName,
                      level: tabCount,
                      parentName: tabCount != 1 ? parentName : "#ISROOT#"
                  });

                  parentName = protocolName;
              }

              // check with the old protocolObject and change the protocolObject accordingly
              var protocolKeyList = Object.keys(protocolObject);
              for (var j = 0; j < protocolKeyList.length; j++) {
                  protocolObject[protocolKeyList[j]].deleted = true;
              }

              for (var i = 0; i < newProtocolList.length; i++) {
                  var protocolName = newProtocolList[i].protocolName;
                  var level = newProtocolList[i].level;
                  var parentName = newProtocolList[i].parentName;

                  var presenceCounter = 0;

                  //check the position of this protocol in the oldList 
                  for (var j = 0; j < protocolKeyList.length; j++) {
                      var tempProtocolName = protocolKeyList[j];
                      var templevel = protocolObject[protocolKeyList[j]].level;
                      var tempParentName = protocolObject[protocolKeyList[j]].parentName;

                      //set the delete flag

                      if (tempProtocolName == protocolName) {
                          if (templevel == level) {
                              if (tempParentName == parentName) {

                                  //found the protocol .. now unsetting the delete flag                            
                                  protocolObject[tempProtocolName].deleted = false;
                                  break;
                              } else {

                                  //renaming the parent name will just work
                                  protocolObject[tempProtocolName].parentName = parentName;
                                  protocolObject[tempProtocolName].deleted = false;
                                  break;
                              }
                          } else {

                              //changing the level
                              protocolObject[tempProtocolName].level = level;
                              protocolObject[tempProtocolName].deleted = false;

                              if (tempParentName != parentName) {
                                  //renaming the parent name will just work
                                  protocolObject[tempProtocolName].parentName = parentName;
                              }

                              break;
                          }
                      } else {
                          if (presenceCounter == protocolKeyList.length - 1) {

                              //means the protocol is NEW!
                              var color = getColor();

                              //if (level != 1) {
                              //    color = "";
                              //}

                              protocolObject[protocolName] = {
                                  color: color,
                                  level: level,
                                  parentName: parentName,
                                  deleted: false,
                                  hasChildren: false
                              };
                          }
                          presenceCounter++;
                      }
                  }

                  //What if the protocolObject is empty -- ie., there is no previous protocolList!
                  if (protocolKeyList.length == 0) {
                      //add each protocol in the protocol list to the protocolObject
                      //means the protocol is NEW!
                      var color = getColor();

                      //if (level != 1) {
                      //    color = "";
                      //}
                      protocolObject[protocolName] = {
                          color: color,
                          level: level,
                          parentName: parentName,
                          deleted: false,
                          hasChildren: false
                      };
                  }
              }

              //Now handle the deleted nodes? - not worrying about it now

              //D3 code for the tree!
              protocolList = depthFirstTraversalProtocolTree();
              protoViewSvg.selectAll("g").remove();

              var protoRect = protoViewSvg.selectAll("g")
                        .data(protocolList)
                        .enter().append("g")
                        .attr("height", "15")
                        .attr("transform", function (d, i) {
                            var indents = protocolObject[d].level;
                            var yline = i * 16 +
                                      10 +
                                      protoViewPadding;

                            return "translate(" +
                                  indents * 10 + "," +
                                  yline + ")";

                        });

              protoRect.append("rect")
             .attr("width", 15)
             .attr("height", 15)
             .attr("stroke-width", 1)
             .attr("fill", function (d, i) {
                 var indents = protocolObject[d].level;
                 var color = protocolObject[d].color;
                 color = color + (0.5).toString() + ")";
                 protocolColorList.push(color);
                 return color;
             })
             .attr("stroke", "#ffffff");

              protoRect.append("text")
             .attr("x", function (d, i) {
                 protocolObject[d].level;
             })
             .attr("y", function (d, i) {
                 return 10;
             })
             .attr("dx", "2em")
             .text(function (d) {
                 return d;
             })
             .style("background-color", function(d,i){
                 var indents = protocolObject[d].level;
                 var color = protocolObject[d].color;
                 color = color + (0.5).toString() + ")";
                 protocolColorList.push(color);
                 return color;
             });
          }
          protocolList.push("unassign");
          protocolColorList.push("rgba(255,255,255,0.1)");
      }); // end function for updating protocols from entered text

      // Add total protocol distributions
      $('ul.tabs li:eq(2)').on('click', function () {
          // get the final list of assigned protocols
          var protoTimeArray = [];
          for (var i in protocolList) {
              if (protocolList[i] != "unassign") {
                  protoTimeArray.push([protocolList[i],
                           protocolColorList[i],
                           0]);
              }
          }
          for (var pindex in protoTimeArray) {
              for (var ind in selectedIndices) {
                  if (protoTimeArray[pindex][0] == selectedIndices[ind][3]) {
                      var timeInSecs = hmsToSeconds(selectedIndices[ind][2]) -
                         hmsToSeconds(selectedIndices[ind][1])
                      protoTimeArray[pindex][2] += timeInSecs;
                  }
              }
          }

          var maxTime = 0;
          for (var j in protoTimeArray) {
              if (protoTimeArray[j][2] > maxTime) {
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
                 .rangePoints([10, chartWidth - 10], 0);

          var xAxis = d3.svg.axis()
                .scale(protos)
                .orient("bottom");

          tSVG.append("g")
              .attr("class", "x axis")
              .attr("transform", "translate(0," + (chartHeight + 5) + ")")
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
              .attr("x", function (d, i) {
                  return i / protoTimeArray.length * chartWidth;
              })
              .attr("y", function (d, i) {
                  return chartHeight - (d[2] / maxTime * chartHeight - 5);
              })
              .attr("width", chartWidth / protoTimeArray.length - 2)
              .attr("height", function (d, i) {
                  return (d[2] / maxTime * chartHeight) - 5;
              })
              .attr("fill", function (d, i) {
                  return d[1];
              });
      });

      // code to update word cloud based on user selection:
      $('#transTable').on('mouseup', function (){
        var t = '';
        if (window.getSelection) {
            t = window.getSelection();
        } else if (document.getSelection) {
            t = document.getSelection();
        } else if (document.selection) {
            t = document.selection.createRange().text;
        }
        selectedText = String(t);
        if (selectedText.length > 0){
          var rangeObject = $(t.getRangeAt(0)); 
          var startSpan = rangeObject.attr("startContainer");
          var endSpan = rangeObject.attr("endContainer");
          var startLineID = startSpan.parentNode.parentNode.id; 
          var endLineID = endSpan.parentNode.parentNode.id;          
          console.log(startLineID);
          console.log(endLineID);
          var sliceStart = startLineID.split("line")[1]; 
          var sliceEnd = parseInt(endLineID.split("line")[1])+1; 
          console.log(sliceEnd);
          var linesList = lowerCaseLines.slice(sliceStart, sliceEnd);
          console.log(lowerCaseLines);
          console.log(linesList);
          $("#tagList").empty();
          $("#tagList").append(makeWordList(linesList, tagsToRemove));
        } else {
          $("#tagList").empty();
          $("#tagList").append(makeWordList(lowerCaseLines, 
                                            tagsToRemove));
        }
      });
      // code to assign protocol codes with selected text
      $('#transContent').on('contextmenu', function (e) {
          e.preventDefault();
          var t = '';
          if (window.getSelection) {
              t = window.getSelection();
          } else if (document.getSelection) {
              t = document.getSelection();
          } else if (document.selection) {
              t = document.selection.createRange().text;
          }
          var processedSelection = returnSpans(t);
          spanCollection = processedSelection[0];
          linesList = processedSelection[1];
          orgSpanCollection = processedSelection[2];

          selectedText = String(t);
          var menuItems = '<p> assign to code:</p>';
          for (ind in protocolList) {
              menuItems += '<ul id="' + protocolList[ind] + '">' +
                protocolList[ind] + '</ul>';
          }
          
          // The code below makes sure the context menu is fully
          // visible and doesn't overflow the displayed extents of
          // the page
          var menuXpos, menuYpos;
          var bottomRightTopOffset = $('#bottomright')
                                       .offset().top;
          var bottomRightLeftOffset = $('#bottomright')
                                        .offset().left;
          var bottomRightWidth = $('#bottomright').width();
          var bottomRightHeight = $('#bottomright').height();
          var contextMenuWidth = $('.contextmenu')
                                    .html(menuItems)
                                    .width();
          var contextMenuHeight = $('.contextmenu')
                                    .html(menuItems)
                                    .height();
          if (pageXOffset + e.clientX <=
              bottomRightLeftOffset + bottomRightWidth / 2) {
              if (pageYOffset + e.clientY <=
                  bottomRightTopOffset + bottomRightHeight / 2) {
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
              if (pageYOffset + e.clientY <= bottomRightTopOffset +
                                             bottomRightHeight / 2) {
                menuXpos = pageXOffset + e.clientX - contextMenuWidth;
                menuYpos = pageYOffset + e.clientY;
              } else {
                menuXpos = pageXOffset + e.clientX - contextMenuWidth;
                menuYpos = pageYOffset + e.clientY - contextMenuHeight;
              }
          }
          $(".contextmenu").html(menuItems)
             .css({
                 "visibility": "visible",
                 "left": menuXpos + "px",
                 "top": menuYpos + "px",
                 "background": "white",
                 "border": "solid 1px #c2c2c2",
                 "z-index": 100,
                 "box-shadow": "3px 3px 5px 0px " + shadowGrey
             });
      });
      // end of code for pop-up coding menu in transContent

      selectedIndices = [];
      // assign selected text to array under the clicked code
      $(".contextmenu").on("click", "ul", function (evt) {
        evt.stopPropagation(); // stops click from propagating to
        // underlying div element.

        if ($.contains(this, '#newCodeBtn')) {
          // this condition no longer needed, get rid of it
          $('#newCodeBtn').on('click', function () {
            // If the textbox has text in it, add it to the existing
            // codes.
            var addedCode = $('#newCode').val();
            if (addedCode != "") {
              protocolList.push(addedCode);
              addedCode = "";
            }
          });
        } else {
          // Based on selection, capture from original csv first
          var selectedArray = selectedText.split("\n");
          for (var i in orgSpanCollection) {
            var spansList = orgSpanCollection[i];
            var lineIndex = Number(linesList[i].id.split("row")[1]);
            if ($(this).text() === "unassign"){
              for (var ksel in selectedIndices) {
                var spanString = "";
                for (var j in spansList){
                  var tempSpan = $(spansList[j]);
                  tempSpan.parent().children().css({
                    "background-color":
                     protocolColorList[
                       protocolList.indexOf($(this).text())] });
                  spanString += tempSpan.text();
                }
                if ((spanString
                      .indexOf(selectedIndices[ksel][4]) > -1) ||
                    (selectedIndices[ksel][4]
                      .indexOf(spanString) > -1)){
                  selectedIndices.splice(ksel, 1);
                }
              }
            } else {
              var spanString = "";
              var spanIds = [];
              for (var j in spansList){
                var tempSpan = $(spansList[j]);
                spanString += tempSpan.text();
                spanIds.push(tempSpan.attr("id"));
                tempSpan
                  .css({"background-color":
                            protocolColorList[
                            protocolList.indexOf($(this).text())]})
                  .delay(1000)
                  .animate({"background-color":
                            "rgba(0,0,0,0)"}, 'slow');
              }
              selectedIndices.push([lineIndex,
                captionArray[lineIndex][0], // start time
                captionArray[lineIndex][1], // start time
                $(this).text(),
                spanIds,
                spanString + "\n" ]);
            }
            var sendData = {};
            sendData.data = selectedIndices;
          }
          $.post("/userlog", sendData, function (data, error) { });
          // Note: the post request seems to take only JSON as data, but
          // read documentation to see if this is always the case. --
          // senthil

          d3.select("#protocolGraphContent")
            .selectAll("svg")
            .remove();
          var protoGraphWidth = $('#protocolGraphContent').width()-2;
          var protoGraphHeight = $('#protocolGraphContent').height()-2;
          var protocolSVG = d3.select("#protocolGraphContent")
                              .append("svg")
                              .attr("width", protoGraphWidth)
                              .attr("height", protoGraphHeight)
                              .style({"border" : "1px solid #d0d0d0"});

            var margin = { top: 5, right: 0, bottom: 5, left: 0 };

            var protoX = d3.scale.linear()
              .domain([0, videoLenSec])
              // convert to scale that adapts
              .range([0, protoGraphWidth-margin.left-margin.right]);
            var protoY = d3.scale.ordinal()
              .domain(protocolList) // convert ditto
              .rangePoints([margin.top, 
                           protoGraphHeight - margin.bottom], 0);
            var proSpace = 10;
            // clickStatus below determines the d3 rectangles' behavior
            // with respect to the mouseover.
            var clickStatus = 0;
            
            var codedData = [];
            for (var ind=0; ind<selectedIndices.length; ind++){
              var rowData = selectedIndices[ind];
              var d = {};
              d.startTime = hmsToSec(rowData[1]);
              d.endTime = hmsToSec(rowData[2]);
              d.x = protoX(d.startTime);
              d.code = rowData[3];
              d.codeIndex = protocolList.indexOf(d.code);
              d.y = (d.codeIndex *
                     (protoGraphHeight-proSpace)/
                     (protocolList.length - 1)
                    ) + proSpace / 2;
              d.id = d.code + "line" + rowData[0];
              d.lineID = "line" + rowData[0];
              // d.width = protoX(d.endTime - d.startTime);
              d.width = 2;
              d.height = (protoGraphHeight-proSpace)/
                         (protocolList.length - 1);
              d.fill = protocolColorList[d.codeIndex];
              d.spanIds = rowData[4];
              d.transcriptLine = rowData[5];
              d.clickStatus = 0;
              codedData.push(d);
            }
            var codeTip = d3.tip()
                            .attr('class', 'd3-tip')
                            .direction('s');
            protocolSVG.call(codeTip);

            var rects = protocolSVG.selectAll("rect")
              .data(codedData)
              .enter()
              .append("rect")
              .attr("x", function (d) {return d.x;})
              .attr("y", function (d) {return d.y;})
              .attr("id", function (d) {return d.id;})
              .attr("width", function (d) {return d.width;})
              .attr("height", function (d) {return d.height;})
              .attr("stroke-width", 1)
              .attr("stroke", "rgba(255,255,255,0)")
              .attr("fill", function (d) {return d.fill;})
              .attr("fill-opacity", 0.5)
              .attr("z-index", -1)
              .on("mouseover", function(d){
                codeTip.html(d.transcriptLine).show();
                if (d.clickStatus === 0){
                  for (var si in d.spanIds){
                    $("#"+d.spanIds[si])
                      .css({"background-color":d.fill});
                  }
                  d3.select(this).attr('width', 2);
                  d3.select(this).attr('fill-opacity', 1);
                }
              })
              .on("mouseout", function(d){
                codeTip.hide();
                if (d.clickStatus === 0){
                  for (var si in d.spanIds){
                    $("#"+d.spanIds[si])
                      .css({"background-color":"rgba(0,0,0,0)"});
                  }
                  d3.select(this).attr('width', d.width);
                  d3.select(this).attr('fill-opacity', 0.5);
                }
              })
              .on("click", function(d){
                if (d3.event.ctrlKey || d3.event.metaKey){
                  var lineCollection = [];
                  if (clickStatus===0){
                    // select all coded objects by code ID
                    var sameCodeObjs = $.grep(codedData, function(e){ 
                      return e.code == d.code; 
                    });
                    // color all spans in these objects persistently
                    for (var ind=0; ind<sameCodeObjs.length; ind++){
                      var currentObj = sameCodeObjs[ind];
                      for (var si in currentObj.spanIds){
                        $("#"+currentObj.spanIds[si])
                          .css({"background-color":d.fill});
                      }
                      var codedWords = currentObj
                                          .transcriptLine
                                          .toLowerCase()
                                          .split(wordSeparators);
                      lineCollection.push(codedWords);
                      // exempt these rectangles from mouseover,
                      // mouseout events.
                      currentObj.clickStatus = 1;
                    }
                    $("#tagList").empty();
                    $("#tagList").append(makeWordList(lineCollection, 
                                                      tagsToRemove));
                    // set general click status as 1, so that this has
                    // to be disabled before another group of spans can
                    // be permanently highlighted.
                    clickStatus = 1;
                  } else {
                    $("#transTable")
                      .find("span")
                      .css({"background-color":"rgba(0,0,0,0)"});
                    for (var ind=0; ind<codedData.length; ind++){
                      codedData[ind].clickStatus = 0;
                    }
                    clickStatus = 0;
                  }
                } else {
                  // just skip to that time.
                  player.currentTime(d.startTime);
                  var transClickItem = $('#transTable')
                          .find("#"+d.lineID);
                  // this small snippet below to scroll the transcript
                  // to show the line corresponding to the item selected
                  // in transgraph
                  var topPos = $(transClickItem).offset().top;
                  $('#transContent')
                      .scrollTo($(transClickItem),
                                {duration: 'slow',
                                 transition: 'ease-in-out'});
                }
              });

          // get rid of the context menu
          $('.contextmenu')
            .css({ "box-shadow": "none",
                   "border": "none",
                   "background": "none" })
            .empty();
        } // end of code that determines what happens when the
          // contextmenu is clicked on.
      }); // end of code that decides what happens when an item is
          // clicked on the context menu

      // remove context menu when clicked elsewhere
      $('#transContent').on('click', function () {
          $('.contextmenu')
            .css({ "box-shadow": "none",
                   "border": "none",
                   "background": "none" })
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
    }).done(function (data) {
        if (typeof data == 'string'){
          console.log("sketch log file received!");
          var sketchArray = $.csv.toArrays(data);
          var speakerList = [];
          // find the total number of people who committed sketches.
          for (var ind=1; ind<sketchArray.length; ind++){
            var speakerID = sketchArray[ind][2];
            if (speakerList.indexOf(speakerID) == -1){
              speakerList.push(speakerID);
            }
          }
          speakerList.sort();
          var numSpeakers = speakerList.length;
          // generate beautiful visuals
          d3.select("#sketchLogContent").selectAll("svg").remove();
          var sketchW = $("#sketchLogContent").width()-2;
          var sketchH = $("#sketchLog").height()-2;

          var sketchSVG = d3.select("#sketchLogContent").append("svg")
                            .attr("width", sketchW) //for border
                            .attr("height", sketchH) //for border
                            .style({"border" : "1px solid #d0d0d0"});
          var sketchScaleX = d3.scale.linear()
                              .domain([0, videoLenSec])
                              .range([0, sketchW]);
          var sketchScaleY = d3.scale.linear()
                              .domain([0, numSpeakers])
                              .range([0, sketchH]);
          var sketchPlotData = [];
          // begin loop to plot sketches on timeline
          for (speakerIndex=0; speakerIndex<numSpeakers; speakerIndex++){
            for (var i=1; i<sketchArray.length; i++){
              var spRow = sketchArray[i];
              var spID = spRow[2];
              var action = spRow[1];
              if (spRow.length > 1 && 
                  speakerList[speakerIndex]==spID &&
                  action == "commit"){
                var d = {}; // data for sketches
                var timeStampSec = hmsToSec(spRow[0]);
                d.x = sketchScaleX(timeStampSec);
                d.width = 5;
                d.height = sketchScaleY(1);
                d.y = sketchScaleY(numSpeakers-speakerIndex) - d.height;
                d.y0 = sketchScaleY(numSpeakers-speakerIndex-1);
                d.timeStamp = timeStampSec;
                d.speaker = spID;
                d.sketchID = spRow[3]; 
                var imagePath = '<img src="/images/sketches/'+
                                ("0"+ spRow[3]).slice(-2) + 
                                '.png" height="100">';
                d.info = spID + ": sketch " + spRow[3] + 
                         '<br>' + imagePath;
                d.fillColor = speakerColors[speakerIndex];
                sketchPlotData.push(d);
                prevTime = timeStampSec;
              } 
            }
          } 
          // end loop to plot sketches on timeline
          //begin loop to plot paths on timeline
          var pathData = [];
          for (var i=1; i<sketchArray.length; i++){
            var commitRow = sketchArray[i];
            if (hmsToSec(commitRow[0]) > videoLenSec){
              break;
            }
            var p = {}; // data for paths
            if (commitRow[1] == "commit"){
              // this means there was a commit.
              // save the sketch number, speaker ID, and timestamp
              var committedSketch = commitRow[3];
              var spID = commitRow[2];
              var commitTimeSec = hmsToSec(commitRow[0]);
              // then check the subsequent sketches to see if there is a
              // commit or checkout of the same sketch 
              var commitPathBroken = false; // assume the commit path is
                                       // not broken yet, this will be
                                       // explained later.
              for (var j=i+1; j<sketchArray.length; j++){
                var currentRow = sketchArray[j];
                if (currentRow[2] == spID && !commitPathBroken){
                  // if the same person commits again, make a path
                  if (currentRow[1] == "commit"){
                    if (hmsToSec(currentRow[0]) < videoLenSec){
                      p.x1 = sketchScaleX(commitTimeSec) + 2.5;
                      // the + 2.5 is to center the line start point on
                      // the width of the rectangle (width=5)
                      p.y1index = numSpeakers-speakerList.indexOf(spID); 
                      p.y1 = sketchScaleY(numSpeakers - 
                              speakerList.indexOf(spID)-0.5);
                      p.x2 = sketchScaleX(hmsToSec(currentRow[0]))+2.5;
                      // the + 2.5 is to center the line end point on
                      // the width of the rectangle (width=5)
                      p.y2index = numSpeakers-
                                  speakerList.indexOf(currentRow[2]); 
                      p.y2 = sketchScaleY(numSpeakers - 
                                speakerList.indexOf(currentRow[2])-0.5);
                      p.from = commitRow;
                      p.to = currentRow;
                      pathData.push(p);
                      break;
                    };
                  } else {
                    // if it is the same person, but no commit, don't
                    // check for this user again, the commit path for
                    // this sketch is broken, unless there is a checkout
                    commitPathBroken = true; 
                    break;
                  }
                } else {
                  // This section means that we are looking at other
                  // users, if they have "checked out" a sketch.
                  if (currentRow[3] === committedSketch){
                    var checkerOuter = currentRow[2];
                    // now for that user, check future actions to see if
                    // there are immediate commits by the same person.
                    // If not, abort.
                    for (var k=j+1; k<sketchArray.length; k++){
                      var nextRow = sketchArray[k];
                      if (nextRow[2] === checkerOuter){
                        if (nextRow[1] === "commit"){
                          // this means there is a path.
                          if (hmsToSec(nextRow[0]) < videoLenSec){
                            p.x1 = sketchScaleX(commitTimeSec) + 2.5;
                            p.y1 = sketchScaleY(numSpeakers - 
                                    speakerList.indexOf(spID)-0.5);
                            p.x2 = sketchScaleX(hmsToSec(nextRow[0]))+2.5;
                            p.y2 = sketchScaleY(numSpeakers - 
                                    speakerList.indexOf(nextRow[2])-0.5);
                            p.from = commitRow;
                            p.to = nextRow;
                            pathData.push(p);
                            // no more checks for this checkerOuter
                            break;
                          }
                        } else {
                          // If there is no commit,
                          // this means the checkout path is broken
                          break;
                        }
                      }
                      // if the next row is not the same person, keep
                      // looking for the next action by the same person
                    }
                  }
                  // if the current row's sketch is not the same as the
                  // committed sketch, keep looking.
                }
              }
            }
          }
          // end loop to plot paths on timeline
          var sketchPaths = sketchSVG.selectAll(".pathTrace")
                    .data(pathData)
                    .enter()
                    .append("svg:line")
                    .attr("class", "pathTrace")
                    .attr("stroke-width", 2)
                    .attr("x1", function (d){return d.x1})
                    .attr("y1", function (d) {return d.y1})
                    .attr("x2", function (d) {return d.x2})
                    .attr("y2", function (d) {return d.y2});

          var sketchTip = d3.tip()
                            .attr('class', 'd3-tip')
                            .direction('s');
          sketchSVG.call(sketchTip);
          var sketchRects = sketchSVG.selectAll("rect")
                .data(sketchPlotData)
                .enter()
                .append("rect")
                .attr("x", function(d){return d.x;})
                .attr("y", function(d){return d.y;})
                .attr("width", function(d){return d.width;})
                .attr("height", function(d){return d.height;})
                .attr("fill", function(d){return d.fillColor;})
                .attr("z-index", "10")
                .on('mouseover', function(d){
                  d3.select(this).attr('y', d.y0);
                  d3.select(this).attr('fill', greenHighlight);
                  sketchTip.html(d.info).show();
                })
                .on('mouseout', function(d){
                  d3.select(this).attr('height', d.height);
                  d3.select(this).attr('width', d.width);
                  d3.select(this).attr('y', d.y);
                  d3.select(this)
                    .attr("fill", function(d){return d.fillColor;});
                  sketchTip.hide();
                })
                .on('click', function(d){
                  if (d3.event.ctrlKey || d3.event.metaKey){
                    $('#imgPath-content').children().remove();
                    d3.select(this).transition()
                                   .attr("r", 12);
                    var imagePath = '<img src="/images/sketches/'+
                                    ("0"+ d.sketchID).slice(-2) + 
                                    '.png" height="600">';
                    $("#imgPath-content").append(imagePath);
                    document.getElementById('imgPath')
                            .style.visibility = 'visible';
                    
                  } else {
                    player.currentTime(d.timeStamp);
                  }
                });
          
        } else {
          $('#sketchLogTitle').hide();
          $('#sketchLog').hide();
          console.log("sketch divs are now hidden");
        }
    }); // End code to generate paths
    // End Stuff to execute when log file loaded
      
    // Function to read in the speech log file
    var speechLogFile;
    var fileTemp2 = $.ajax({
        type: "GET", // can remove this to avoid confusion
        url: "/receive_speechLog_file", // change to send_trn_fil
        // note: "send" from POV of client
        dataType: "text"
    }).done(function (speechdata) {
      speechdata = JSON.parse(speechdata);
      if (typeof speechdata == "string"){
        console.log("speech log file received!");
        // parse speech data
        var speechArray = speechdata.split("\n");
        var numSpeakers = speechArray[0].split(",").length - 1;
        var speakerList = speechArray[0]
                            .split(",")
                            .slice(1, speechArray[0].length-1);
        // generate beautiful visuals
        d3.select("#speechLogContent").selectAll("svg").remove();
        var speechW = $("#speechLogContent").width()-2;
        var speechH = $("#speechLog").height()-2;

        var speechSVG = d3.select("#speechLogContent").append("svg")
                          .attr("width", speechW) //for border
                          .attr("height", speechH) //for border
                          .style({"border" : "1px solid #d0d0d0"});
        var speechScaleX = d3.scale.linear()
                            .domain([0, videoLenSec])
                            .range([0, speechW]);
        var speechScaleY = d3.scale.linear()
                            .domain([0, numSpeakers])
                            .range([0, speechH]);
        var speechScaleSp = d3.scale.linear()
                              .domain([0,1])
                              .range([0, speechH/numSpeakers]);
        var speechPlotData = [];
        for (speakerIndex=0; speakerIndex<numSpeakers; speakerIndex++){
          var prevTime = 0;
          for (var i=1; i<speechArray.length; i++){
            var spRow = speechArray[i].split(",");
            if (spRow.length > 1){
              var d = {};
              var timeStampSec = hmsToSec(spRow[0]);
              d.x = speechScaleX(timeStampSec);
              d.width = speechScaleX(timeStampSec - prevTime);
              d.height = speechScaleY(spRow[speakerIndex+1]);
              d.y = speechScaleY(numSpeakers-speakerIndex) - d.height;
              d.y0 = speechScaleY(numSpeakers-speakerIndex-1);
              d.timeStamp = timeStampSec;
              d.speaker = speakerList[speakerIndex];
              d.participationValue = parseFloat(spRow[speakerIndex+1]); 
              d.fillColor = speakerColors[speakerIndex];
              speechPlotData.push(d);
              prevTime = timeStampSec;
            }
          }
        }

        var speechTip = d3.tip()
                          .attr('class', 'd3-tip')
                          .direction('s');
        speechSVG.call(speechTip);
        var speechRects = speechSVG.selectAll("rect")
              .data(speechPlotData)
              .enter()
              .append("rect")
              .attr("x", function(d){return d.x;})
              .attr("y", function(d){return d.y;})
              .attr("width", function(d){return d.width;})
              .attr("height", function(d){return d.height;})
              .attr("fill", function(d){return d.fillColor;})
              .attr("z-index", "10")
              .on('mouseover', function(d){
                d3.select(this).attr('height', speechScaleY(1));
                d3.select(this).attr('width', 2);
                d3.select(this).attr('y', d.y0);
                d3.select(this).attr('fill', greenHighlight);
                speechTip.html(d.speaker).show();
              })
              .on('mouseout', function(d){
                d3.select(this).attr('height', d.height);
                d3.select(this).attr('width', d.width);
                d3.select(this).attr('y', d.y);
                d3.select(this)
                  .attr("fill", function(d){return d.fillColor;});
                speechTip.hide();
              })
              .on('click', function(d){
                player.currentTime(d.timeStamp);
              });

      } else {
        // hide everything!
        $('#speechLogTitle').hide();
        $('#speechLog').hide();
        console.log("speech divs are now hidden");
      }

    }); // end of stuff to do with speechLog

    // Function to read in the activity log file
    var activityLogFile;
    var fileTemp2 = $.ajax({
        type: "GET", // can remove this to avoid confusion
        url: "/receive_activityLog_file", // change to send_trn_fil
        // note: "send" from POV of client
        dataType: "text"
    }).done(function (activitydata) {
      activitydata = JSON.parse(activitydata);
      if (typeof activitydata == "string"){
        console.log("activity log file received!");
        // generate beautiful visuals
        // parse activity data
        var activityArray = activitydata.split("\n");
        var numSpeakers = activityArray[0].split(",").length - 1;
        var speakerList = activityArray[0]
                            .split(",")
                            .slice(1, activityArray[0].length-1);
        // generate beautiful visuals
        var maxAct = 0;
        for (var i=1;i<activityArray.length; i++){
          var row = activityArray[i].split(",");
          var rowMax = Math.max.apply(Math, row.slice(1,row.length-1));
          if (maxAct < rowMax){
            maxAct = rowMax;
          }
        }

        d3.select("#activityLogContent").selectAll("svg").remove();
        var activityW = $("#activityLogContent").width()-2;
        var activityH = $("#activityLog").height()-2;

        var activitySVG = d3.select("#activityLogContent").append("svg")
                          .attr("width", activityW)
                          .attr("height", activityH)
                          .style({"border" : "1px solid #d0d0d0"});
        var activityScaleX = d3.scale.linear()
                            .domain([0, videoLenSec])
                            .range([0, activityW]);
        var activityScaleY = d3.scale.linear()
                            .domain([0, numSpeakers])
                            .range([0, activityH]);
        var activityScaleSp = d3.scale.linear()
                              .domain([0,1])
                              .range([0, activityH/numSpeakers]);
        var actScale = d3.scale.pow().exponent(1)
                               .domain([0,maxAct-0.2])
                               .range([0,1]);
        var activityPlotData = [];

        for (speakerIndex=0; speakerIndex<numSpeakers; speakerIndex++){
          var prevTime = 0;
          for (var i=1; i<activityArray.length; i++){
            var spRow = activityArray[i].split(",");
            if (spRow.length > 1){
              var d = {};
              var timeStampSec = hmsToSec(spRow[0]);
              d.x = activityScaleX(timeStampSec);
              d.width = activityScaleX(timeStampSec - prevTime);
              //d.height = activityScaleY(spRow[speakerIndex+1]/maxAct);
              //d.height = activityScaleY(actScale(heightValue));
              d.height = activityScaleY(1);
              d.y = activityScaleY(numSpeakers-speakerIndex) - d.height;
              d.y0 = activityScaleY(numSpeakers-speakerIndex-1);
              d.timeStamp = timeStampSec;
              d.speaker = speakerList[speakerIndex];
              d.participationValue = parseFloat(spRow[speakerIndex+1]); 
              d.fillColor = speakerColors[speakerIndex];
              d.fillOpacity = actScale(spRow[speakerIndex+1]);
              //d.fillOpacity = 1;
              activityPlotData.push(d);
              prevTime = timeStampSec;
            }
          }
        }
        var activityTip = d3.tip()
                          .attr('class', 'd3-tip')
                          .direction('s');
        activitySVG.call(activityTip);
        var activityRects = activitySVG.selectAll("rect")
              .data(activityPlotData)
              .enter()
              .append("rect")
              .attr("x", function(d){return d.x;})
              .attr("y", function(d){return d.y;})
              .attr("width", function(d){return d.width;})
              .attr("height", function(d){return d.height;})
              .attr("height", function(d){return d.height;})
              .attr("fill", function(d){return d.fillColor;})
              .attr("fill-opacity", function(d){return d.fillOpacity;})
              .attr("z-index", "10")
              .on('mouseover', function(d){
                d3.select(this).attr('height', activityScaleY(1));
                d3.select(this).attr('width', 2);
                d3.select(this).attr('y', d.y0);
                d3.select(this).attr('fill', greenHighlight);
                d3.select(this).attr('fill-opacity', 1);
                activityTip.html(d.speaker).show();
              })
              .on('mouseout', function(d){
                d3.select(this).attr('height', d.height);
                d3.select(this).attr('width', d.width);
                d3.select(this).attr('y', d.y);
                d3.select(this)
                  .attr("fill", function(d){
                    return d.fillColor;
                  })
                  .attr("fill-opacity", function(d){
                    return d.fillOpacity;
                  })
                activityTip.hide();
              })
              .on('click', function(d){
                player.currentTime(d.timeStamp);
              });
      } else {
        // hide everything!
        $('#activityLogTitle').hide();
        $('#activityLog').hide();
        console.log("activity divs are now hidden");
      }

    }); // end of stuff to do with activityLog
        // NOTES FOR CODE FOLDING in VIM:
        // zc -- close fold
        // zo -- open fold
        // zM -- close all folds
        // zR -- open all folds
        // set foldmethod = syntax
  }); //player.ready attempt for the whole code chunk
} // end of window.onload code


