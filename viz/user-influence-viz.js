const SVG_WIDTH = 700;
const SVG_HEIGHT = 620;

const CIRCLE_DATA_DOMAIN = [0, 30]; // [0,10] for real data, [0,30] for fake
const CIRCLE_PIXELS_SIZE = [30, 90];
const CIRCLE_REPULSION_RADIUS = 10; // lower this for weaker repulsion

const MIN_CONVERSATIONS = 0;

// const DATA_CSV_PATH = "./data/influenceByMonth.csv"
const DATA_CSV_PATH = "./data/influenceByMonthFake.csv"

////// slider setup ///////

var dataset;

var margin = {top:0, right:50, bottom:0, left:50},
    width = 700 - margin.left - margin.right,
    height = 150 - margin.top - margin.bottom;

////////// slider //////////

var formatDateIntoYear = d3.timeFormat("%Y");
var formatDate = d3.timeFormat("%b %Y");

var startDate = new Date(2019, 0), // new Date(year, month) --> month is 0-based indexing so 0 is january
    endDate   = new Date(2020, 7);

var svgSlider = d3.select("#slider")
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height);

var x = d3.scaleTime()
    .domain([startDate, endDate])
    .range([0, width])
    .clamp(true);

var slider = svgSlider.append("g")
    .attr("class", "slider")
    .attr("transform", "translate(" + margin.left + "," + height / 2 + ")");

slider.append("line")
    .attr("class", "track")
    .attr("x1", x.range()[0])
    .attr("x2", x.range()[1])
    .select(function() { return this.parentNode.appendChild(this.cloneNode(true)); })
    .attr("class", "track-inset")
    .select(function() { return this.parentNode.appendChild(this.cloneNode(true)); })
    .attr("class", "track-overlay")
    .call(d3.drag()
        .on("start.interrupt", function() { slider.interrupt(); })
        .on("start drag", function() {
            updateViz(x.invert(d3.event.x));
            updateTable(x.invert(d3.event.x));
        }));

slider.insert("g", ".track-overlay")
    .attr("class", "ticks")
    .attr("transform", "translate(0," + 18 + ")")
    .selectAll("text")
    .data(x.ticks(2)) // controls amount of tick marks with text: 2 => 10 same as [2019     2020] => [2019 2019 2019 2019 2020 2020 2020 2020]
    .enter()
    .append("text")
    .attr("x", x)
    .attr("y", 10) // displacement under the timeline itself
    .attr("text-anchor", "middle")
    .text(function(d) { return formatDateIntoYear(d); });
    
// the circle you can drag to change the date
var handle = slider.insert("circle", ".track-overlay")
    .attr("class", "handle")
    .attr("r", 9);

var label = slider.append("text")  
    .attr("class", "label")
    .attr("text-anchor", "middle")
    .text(formatDate(startDate))
    .attr("transform", "translate(0," + (-25) + ")");

////////// plot //////////

// does all the sizing and scaling, called as a function when setting circle radius
var size = d3.scaleLinear()
    .domain(CIRCLE_DATA_DOMAIN) // data domain
    .range(CIRCLE_PIXELS_SIZE); // pixel size range

var svgPlot = d3.select("#tab0Content")
    .append("svg")
    .attr("width", 500)
    .attr("class", "viz-svg")
    .style("overflow", "visible");

var plot = svgPlot.append("g")
    .attr("class", "plot")
    .attr("transform", "translate(-50, -80)");
    

d3.csv(DATA_CSV_PATH, function(d) {
    return {
        name: d.Name,
        conversationsReceived: d["Conversations Received"],
        conversationsStarted: d["Conversations Started"],
        date: new Date(d.Year, d.Month - 1) // month - 1 because it is zero-based index
    }
}).then(function(data) {
    dataset = data;
    updateViz(x.invert(0));
    updateTable(x.invert(0));
});




//////////////////////////////////
//////// DRAWING CIRCLES /////////
//////////////////////////////////


function drawPlot(data) {
    // remove previous circles before redrawing them
    plot.selectAll(".node")
        .data([])
        .exit()
        .remove();

    // remove previous text before redrawing them
    plot.selectAll("text")
        .data([])
        .exit()
        .remove();

    // draw the new circles
    var circles = plot.selectAll(".node")
        .data(data)
        .enter()
        .append("circle")
        .attr("class", "node")
        .attr("r", function(d) {
            return size(d.conversationsReceived);
        })
        .attr("cx", SVG_WIDTH / 2)
        .attr("cy", SVG_HEIGHT / 2)
        .style("fill","#69b3a2")
        .style("fill", function(d) {
            return d3.hsl(Math.pow(d.conversationsReceived, 3) / 4 + 150, 0.8, 0.8)
        })
        .style("fill-opacity", 0.3)
        .attr("stroke", "#69b3a2")
        .attr("stroke", function(d) {
            return d3.hsl(Math.pow(d.conversationsReceived, 3) / 4 + 150, 0.7, 0.7)
        })
        .style("stroke-width", 4)
        .on("mouseover", mouseover) // pass the tooltip functions here
        .on("mousemove", mousemove)
        .on("mouseleave", mouseleave);

    //  draw the new text
    var text = plot.selectAll("text")
        .data(data)
        .enter()
        .append("text")
        .attr("text-anchor", "middle")
        .attr("x", SVG_WIDTH / 2)
        .attr("y", SVG_HEIGHT / 2)
        .attr("font-size", 18)
        .text(function(d) {
            var name = d.name;
            var nameParts = name.split(' ');
            var firstInitial = nameParts[0].charAt(0).toUpperCase();
            var lastInitial = "";
            if (nameParts.length > 1) {
                lastInitial = nameParts[1].charAt(0).toUpperCase();
            }
            return firstInitial + lastInitial;
        })


    // create blueprint for force simulation (physics)
    // one for circles, one for text
    var simulation = d3.forceSimulation()
        .force("center", d3.forceCenter().x(SVG_WIDTH / 2).y(SVG_HEIGHT / 2)) // attraction to center of svg box
        .force("charge", d3.forceManyBody().strength(0.5)) // node attraction strength to each other is 0.5
        .force("collide", d3.forceCollide().strength(0.1).radius(80).iterations(1)) // force that keeps circles from overlapping

    var simulationForText = d3.forceSimulation()
        .force("center", d3.forceCenter().x(SVG_WIDTH / 2).y(SVG_HEIGHT / 2)) // attraction to center of svg box
        .force("charge", d3.forceManyBody().strength(0.5)) // node attraction strength to each other is 0.5
        .force("collide", d3.forceCollide().strength(0.1).radius(CIRCLE_REPULSION_RADIUS).iterations(1)) // force that keeps circles from overlapping

    // actually apply these forces to the nodes and update their positions
    // once force algorithm is happy with positions (the 'alpha' value is low enough), simulation will stop
    simulation
        .nodes(data)
        .on("tick", function(d) {
            circles.attr("cx", function(d) { return d.x; })
                .attr("cy", function(d) { return d.y; })
        });

    simulationForText
        .nodes(data)
        .on("tick", function(d) {
            text.attr("x", function(d) { return d.x; })
                .attr("y", function(d) { return d.y; })
        })
}

function updateViz(h) {
    // update position and text of label according to slider scale
    handle.attr("cx", x(h));
    label.attr("x", x(h)).text(formatDate(h));
    
    // filter data set and redraw plot
    var newData = dataset.filter(function(d) {
        if (d.date.getMonth() == h.getMonth() && d.date.getFullYear() == h.getFullYear() && d.conversationsReceived > MIN_CONVERSATIONS) {
            return d;
        }
    })
    drawPlot(newData);
}


////////////////////////////////
///////// TABLE STUFF //////////
////////////////////////////////

function drawTable(data) {

    data.sort(function(a, b) {
        return (b.conversationsReceived + b.conversationsStarted) - (a.conversationsReceived + a.conversationsStarted);
    })

    // remove rows first
    d3.select(".influence-table tbody")
        .selectAll("tr")
        .data([])
        .exit()
        .remove()

    var tr = d3.select(".influence-table tbody")
        .selectAll("tr")
        .data(data)
        .enter()
        .append("tr");

    var td = tr.selectAll("td")
        .data(function(d, i) {
            return [d.name, d.conversationsStarted, d.conversationsReceived];
        })
        .enter()
        .append("td")
        .text(function(d) { return d; });
}

function updateTable(h) {
    // filter data set and redraw plot
    var newData = dataset.filter(function(d) {
        if (d.date.getMonth() == h.getMonth() && d.date.getFullYear() == h.getFullYear()) {
            return d;
        }
    })
    drawTable(newData);
}

// create a tooltip
var tooltip = d3.select("#tab0Content")
    .append("div")
    .style("opacity", 0)
    .style("position", "absolute")
    .attr("class", "tooltip")
    .style("color", "black")
    .style("background-color", "white")
    .style("border", "solid")
    .style("border-width", "2px")
    .style("border-radius", "5px")
    .style("padding", "5px")

// functions that change the tooltip when user mouse action hovers/moves/leaves the popup
var mouseover = function(d) {
    tooltip.style("opacity", 1)
    d3.select(this)
      .style("stroke-width", 6)
      .style("opacity", 1)
      .style("z-index", "999")
}
var mousemove = function(d) {
    tooltip
    .html('<b>' + d.name + '</b>' + "<br>" + d.conversationsStarted + " conversations started"
            + "<br>" + d.conversationsReceived + " conversations received")
    .style("left", (d3.mouse(this)[0] + 20) + "px")
    .style("top", (d3.mouse(this)[1] + 120) + "px")
    .style("font-size", "18px");
}
var mouseleave = function(d) {
    tooltip.style("opacity", 0)
    d3.select(this)
        .style("stroke-width", 4)
        .style("z-index", "-1");
}
