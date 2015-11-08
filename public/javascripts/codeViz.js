function codeViz(selectedIndices, player, protocolList, 
                 protocolColorList){
    console.log(selectedIndices);
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
        // note that the length of protocolList is reduced by 1
        // because the list has an extra "unassign" item
        // that has no place in the timeline.
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
      console.log("codedData:");
      console.log(codedData);
      var codeTip = d3.tip()
                      .attr('class', 'd3-tip')
                      .offset([0, 20])
                      .direction('e');
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
        .attr("fill-opacity", 0.7)
        .attr("z-index", -1)
        .on("mouseover", function(d){
          codeTip.html("<b>CODE: </b>" + d.code).show();
          if (d.clickStatus === 0){
            for (var si in d.spanIds){
              $("#"+d.spanIds[si])
                .css({"background-color":d.fill});
            }
            d3.select(this).attr('width', 3);
            d3.select(this).attr('fill', boldHighlightColor);
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
            d3.select(this).attr('fill', d.fill);
            d3.select(this).attr('fill-opacity', 0.7);
          }
        })
        .on("click", function(d){
          if (d3.event.ctrlKey || d3.event.metaKey){
            //
            cTime =  new Date();
            var tempTime = cTime.getHours() + ":" +
                          cTime.getMinutes() + ":" +
                          cTime.getSeconds();
            /*
            clickLog.push([tempTime, "genCodeWordCloud", 
                          d.code + "\n"]);
            sendClickData.data = clickLog;
            $.post("/clicklog", sendClickData, function (data, error) { });
            */
            //
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
              $("#tagList").css("background-color", "#ffffff");
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
            //
            /*
            cTime =  new Date();
            var tempTime = cTime.getHours() + ":" +
                          cTime.getMinutes() + ":" +
                          cTime.getSeconds();
            clickLog.push([tempTime, "codeSkipToTime", 
                          d.startTime, d.code + "\n"]);
            sendClickData.data = clickLog;
            $.post("/clicklog", sendClickData, 
                   function (data, error) { });
            */
            //
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

};
