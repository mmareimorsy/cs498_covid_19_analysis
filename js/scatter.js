/*
    main.js
    Covid 19 d3 visualization
    Scatter Plot for fatality ratio vs confirmed cases
    UIUC - CS498 Data Visualization
    mmorsy2
*/

// Dimensions of chart area

function scatterPlot(){
    var margin = { left:80, right:20, top:20, bottom:100 };
    var height = 500 - margin.top - margin.bottom, 
        width = 800 - margin.left - margin.right;
    
    
    var svg = d3.select("#scatter-area")
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", "translate(" + margin.left + ", " + margin.top + ")");
    
    // Labels
    var xLabel = svg.append("text")
        .attr("y", height + 50)
        .attr("x", width / 2)
        .attr("font-size", "20px")
        .attr("text-anchor", "middle")
        .text("Confirmed Cases");

    var yLabel = svg.append("text")
        .attr("transform", "rotate(-90)")
        .attr("y", -40)
        .attr("x", -170)
        .attr("font-size", "20px")
        .attr("text-anchor", "middle")
        .text("Fatality Ratio %")
    
    var timeLabel = svg.append("text")
        .attr("y", height - 300)
        .attr("x", width - 40)
        .attr("font-size", "25px")
        .attr("opacity", "0.4")
        .attr("text-anchor", "middle");
    
    // line for annotation when it is triggered 
    svg.append("line")
        .attr("id", "annotation-line-scatter")
        .attr("x1",0)
        .attr("x2",0)
        .attr("y1",0)
        .attr("y2",0);
    
    // text for annotation when triggered
    svg.append("text")
        .attr("id", "annotation-text-scatter")
        .attr("x",0)
        .attr("y",0);

    // X Axis 
    var x = d3.scaleLog()
        .clamp(true)
        .domain([1,100000000])
        .range([0,width]);
    
    svg.append("g")
        .attr("transform", "translate(0," + height + ")")
        .call(d3.axisBottom(x).tickValues([1,10,100,1000,10000,100000,1000000,10000000,100000000]).tickFormat(d3.format(".2s")));
    
    // Y Axis 
    var y = d3.scaleLinear()
        .domain([0,40])
        .range([height,0]);
    
    svg.append("g").call(d3.axisLeft(y));
    
    // Continent legends
    var legend = svg.append("g")
        .attr("transform", "translate(" + (width - 10) + "," + (height - 280) + ")");
    
    continents.forEach(function(continent, i){
        var legendRow = legend.append("g")
            .attr("transform", "translate(0, " + (i * 20) + ")");
    
        legendRow.append("rect")
            .attr("width", 10)
            .attr("height", 10)
            .attr("fill", continentColor(continent));
    
        legendRow.append("text")
            .attr("x", -10)
            .attr("y", 10)
            .attr("text-anchor", "end")
            .style("text-transform", "capitalize")
            .text(continent);
    });
    
    // Tooltip
    var div = d3.select("body")
        .append("div")
        .style("opacity",0)
        .attr('class', 'd3-tip');
    
    // Transition setup 
    var transitionPer = 200;

    // Load all 3 CSV files via promises
    var promises = [
        d3.csv("data/confirmed.csv"),
        d3.csv("data/deaths.csv"),
        d3.csv("data/recovered.csv"),
        d3.csv("data/continents.csv")
    ];

    Promise.all(promises).then(function(allData){
        var confirmed = allData[0];
        var deaths = allData[1];
        var recovered = allData[2];
        var continentsMap = allData[3];

        var dates = confirmed.columns.slice(1,);
        var dateIndex = dates.length-1;
        var dateInput = dates[dateIndex];

        var annotate = true;
        update(confirmed, deaths, recovered,continentsMap, dateInput, annotate);

        var interval;
        dateIndex = 0;
        d3.select("#play-button").on("click", function(){
            var button = d3.select("#play-button");
                if (button.text() == "Play"){
                    button.text("Pause");
                    interval = d3.interval(function(){
                        if (dateIndex == dates.length - 1){
                            dateInput = dates[dateIndex];
                            annotate = true;
                            update(confirmed, deaths, recovered, continentsMap, dateInput, annotate);
                            button.text("play");
                            dateIndex = 0;
                            interval.stop();
                        }
                        else if (dateIndex < dates.length){
                            dateInput = dates[dateIndex];
                            annotate = false;
                            update(confirmed, deaths, recovered, continentsMap, dateInput, annotate);
                            dateIndex = dateIndex + 1;
                        }
                        
                    }, transitionPer);            
                }
                else {
                    button.text("Play");
                    interval.stop();
                }
        })
        
        d3.select("#reset-button").on("click", function(){
            dateIndex = 0;
            dateInput = dates[dateIndex];
            annotate = false;
            update(confirmed, deaths, recovered, continentsMap, dateInput, annotate);

        });
        

    }).catch(function(error){
        console.log(error);
    });
    
    // helper function to update data
    function update(confirmed, deaths, recovered, continentsMap, dateInput, annotate){
        var fConfirmed = Array.from(confirmed, function(d){return +d[dateInput];});
        var fDeaths = Array.from(deaths, function(d){return +d[dateInput];});
        var fRecovered = Array.from(recovered, function(d){return +d[dateInput];});
        
        var fatality_ratio = Array.from(fConfirmed, function(d,i){
            if(fConfirmed[i]==0){
                return 0;
            }
            else{
                return (100 * (+fDeaths[i])/(+fConfirmed[i]));
            }
        });

        var recovery_ratio = Array.from(fConfirmed, function(d,i){
            if(fConfirmed[i]==0){
                return 0;
            }
            else{
                return (100 * (+fRecovered[i])/(+fConfirmed[i]));
            }
        });
        
        var toolTipText = Array.from(fConfirmed, function(d,i){
            return ("<strong>Country:</strong> <span style='color:yellow'>" + confirmed[i].country + "</span><br>" + 
            "<strong>Continent:</strong> <span style='color:yellow'>" + continentsMap[i].continent + "</span><br>" + 
            "<strong>Confirmed Cases:</strong> <span style='color:yellow'>" + d3.format(",")(d) + "</span><br>" +
            "<strong>Total Deaths:</strong> <span style='color:yellow'>" + d3.format(",")(fDeaths[i]) + "</span><br>" +
            "<strong>Recovered Cases:</strong> <span style='color:yellow'>" + d3.format(",")(fRecovered[i]) + "</span><br>" + 
            "<strong>Fatality Ratio:</strong> <span style='color:yellow'>" + d3.format(",.2f")(fatality_ratio[i]) + "%</span><br>" +
            "<strong>Recovery Ratio:</strong> <span style='color:yellow'>" + d3.format(",.2f")(recovery_ratio[i]) + "%</span><br>");
        })
        
        // Update Date text 
        var t = d3.transition().duration(transitionPer);  
        timeLabel.text(dateInput).transition(t);
        
        // Update circles of each country including tooltips
        var circles = svg.selectAll("circle").data(toolTipText);
        
        circles.exit()
            .attr("class","exit")
            .remove();
        
        circles.enter().append("circle")
            .attr("class","enter")
            .style("fill", function(d,i){return continentColor(continentsMap[i].continent);})
            .on("mouseover", function(d,i){
                div.transition().duration(200).style("opacity", 0.9);
                div.html(
                    d
                ).style("left", (d3.event.pageX) + "px")
                .style("top", (d3.event.pageY) + "px")
                .style('pointer-events', 'all');
            })
            .on("mouseout", function(){
                div.transition().duration(200).style("opacity", 0).style('pointer-events', 'none');})
            .merge(circles)
            .transition(t)
            .attr("cx", function(d,i){return x(fConfirmed[i]);})
            .attr("cy",function(d,i){return y(fatality_ratio[i]); })
            .attr("r",function(d,i){return 1.25*fatality_ratio[i];});
        
        // trigger annotation once the graph reaches the last step
        if (annotate == true){
            var highestFatality = d3.max(fatality_ratio, function(d){return d;});
            var highestFatalityIndex = fatality_ratio.findIndex(function(d){return d == highestFatality});
            var highestFatalityCountry = confirmed[highestFatalityIndex].country;
            var highestFatalityConfirmed = confirmed[highestFatalityIndex][dateInput];
            
            svg.append("marker")
                .attr("id", "arrowhead-scatter")
                .attr("refX", 6)
                .attr("refY", 6)
                .attr("markerWidth", 30)
                .attr("markerHeight", 30)
                .attr("markerUnits", "userSpaceOnUse")
                .attr("orient", "auto")
                .append("path")
                .attr("d", "M 0 0 12 6 0 12 3 6")
                .style("fill",continentColor(continentsMap[highestFatalityIndex].continent));

            var line = d3.select("#annotation-line-scatter");

            line.transition()
                .attr("x1", x(highestFatalityConfirmed)+50)
                .attr("y1", y(highestFatality)-100)
                .attr("x2", x(highestFatalityConfirmed)+(highestFatality/2))
                .attr("y2", y(highestFatality)-highestFatality)
                .attr("stroke-width", 3)
                .attr("marker-end", "url(#arrowhead-scatter)")
                .attr("stroke", continentColor(continentsMap[highestFatalityIndex].continent));
            
            var annotationText = d3.select("#annotation-text-scatter");
            annotationText.attr("class", "annotation-scatter")
                .transition()
                .attr("x",x(highestFatalityConfirmed)+50)
                .attr("y",y(highestFatality)-100)
                .attr("font-family","sans-serif")
                .attr("font-size",15)
                .style("fill",continentColor(continentsMap[highestFatalityIndex].continent))
                .style("text-decoration","underline")
                .attr("text-anchor", "start")
            
            var annotation = d3.select(".annotation-scatter")
                .html("Top fatality ratio is in " + highestFatalityCountry + " at " + d3.format(",.2f")(+highestFatality) + "%");
        }
        else{
            d3.select("#annotation-text-scatter")
                .attr("x",0)
                .attr("y",0)
                .html("");
            d3.select("#annotation-line-scatter")
                .attr("x1",0)
                .attr("x2",0)
                .attr("y1",0)
                .attr("y2",0)
                .attr("marker-end","");
        }
    };
}

scatterPlot();