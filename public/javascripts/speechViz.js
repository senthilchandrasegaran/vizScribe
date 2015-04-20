function speechViz(speechdata, player){
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
  // create carefully structured data array
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

  // use data array to generate d3 representations
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
}
