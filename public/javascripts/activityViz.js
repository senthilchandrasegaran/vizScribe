function activityViz(activitydata, player){
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
  var actScale = d3.scale.pow().exponent(0.8)
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
}
