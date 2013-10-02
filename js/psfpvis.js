//global variables to hold the current variables plotted on each axis
var currentX = "lambda_ex" 
var currentY = "lambda_em"
var symbolsize = 7; //radius of circle
//global varable to set the ranges over which the data is filtered.  
var filters = {
	"lambda_ex" : [350,800,1],		// array values represent [min range, max range, step (for the range slider)]
	"lambda_em" : [350,800,1],
	"E"			: [10000,140000,1000],
	"QY"		: [0,1,0.01],
	"brightness": [0,100,1]
}
//string variables for updating the axis labels
var strings = {
	"lambda_em" : "Emission Wavelength (nm)",
	"lambda_ex" : "Excitation Wavelength (nm)",
	"stokes"	: "Stokes Shift (nm)",
	"E"			: "Extinction Coefficient",
	"QY"		: "Quantum Yield",
	"brightness": "Brightness",
	"pka" 		: "pKa",
	"bleach" 	: "Bleaching Half-life (s)",
	"mature" 	: "Maturation Half-time (min)",
	"lifetime" 	: "Lifetime (ns)",
}

//shorter strings for the table
var tableStrings = {
	"Name"		: "Protein",
	"state"		: "State",
	"lambda_ex" : "&lambda;<sub>ex</sub> (nm)",
	"lambda_em" : "&lambda;<sub>em</sub> (nm)",
	"E"			: "EC",
	"QY"		: "QY",
	"brightness": "Brightness",
	"pka" 		: "pKa",
	"bleach" 	: "Bleaching (s)",
	"mature" 	: "Maturation (min)",
	"lifetime" 	: "Lifetime (ns)",
	"RefNum"	: "Reference"
}

//Protein classes for tables
var FPgroups = [
		{"Name" : "Photoactivatible", "type" : "pa", "color" : "#808080"},
		{"Name" : "Photoconvertible", "type" : "pc", "color" : "#808080"},
		{"Name" : "Photoswitchable", "type" : "ps", "color" : "#808080"}
]

//on page load, listen to slider events and respond by updating the filter ranges (and updating the ui)
//this uses jQuery and jQuery UI which have been added to the head of the document.
$(function() {
	
	//dynamically generate filter sliders based on "filters" object
	$.each(filters, function(i,v){
		var label = $("<label class='rangeSlider' for="+i+">"+strings[i]+"</label>").appendTo("#sliders");
		var slider = $("<div id='"+i+"' class='rangeSlider'/>").appendTo("#sliders");

		slider.rangeSlider({
		 	bounds:{min: v[0], max: v[1]},
		 	defaultValues:{min: v[0], max: v[1]},
		 	step: v[2],
		 	arrows: false,
		 	formatter:function(val){
		        return (Math.round(val * 100) / 100);
		      }
		 });
	});

	// update filter settings when user changes slider
	$(".rangeSlider").on("valuesChanging", function(e, data){
		var filtID = $(this).attr('id');
	  filters[filtID][0] = data.values.min;
	  filters[filtID][1] = data.values.max;
	  plot();
	});

    $("#Xradio").buttonsetv();
    $("#Yradio").buttonsetv();

    $( "#Xradio input" ).click(function() {
	  currentX = $(this).val();
	  plot();
	});
	$( "#Yradio input" ).click(function() {
	  currentY = $(this).val();
	  plot();
	});

	//easter egg
	$("#doalittledance").click(function(){doalittledance(1600);});
	});

//load the bibliography
$("#bibliography").load('PSFPs_bibliography.html');

// Chart dimensions.
var margin = {top: 20, right: 30, bottom: 20, left: 50},
width = 700 - margin.right,
height = 700 - margin.top - margin.bottom;

//Scales and axes
var xScale = d3.scale.linear()
			.range ([0, width]);

var yScale = d3.scale.linear()
			.range ([height, 0]);

//This scale will set the saturation (gray to saturated color).  We will use it for mapping brightness.
var saturationScale = d3.scale.linear()
			.range([0, 1])
			.domain([0, 100]);
			
//This scale will set the hue.  We will use it for mapping emission wavelength.
var hueScale = d3.scale.linear()
			.range([300, 300, 240, 0, 0])
			.domain([200, 405, 440, 650, 850]);				

//X and Y axes
var xAxis_bottom = d3.svg.axis().scale(xScale).tickSize(5).tickSubdivide(true);
var yAxis_left = d3.svg.axis().scale(yScale).tickSize(5).orient("left").tickSubdivide(true);

//top and right axes are identical but without tick labels
var xAxis_top = d3.svg.axis().scale(xScale).tickSize(5).orient("top").tickSubdivide(true).tickFormat(function (d) { return ''; });;;
var yAxis_right = d3.svg.axis().scale(yScale).tickSize(5).orient("right").tickSubdivide(true).tickFormat(function (d) { return ''; });;

// Create the SVG container and set the origin.
var svg = d3.select("#graph").append("svg")
	.attr("width", width + margin.left + margin.right)
	.attr("height", height + margin.top + margin.bottom)
	.append("g")
	.attr("transform", "translate(" + margin.left + "," + margin.top + ")");
	
//Add the axes
svg.append("g")
	.attr("class", "x axis bottom")
	.attr("transform", "translate(0," + height + ")")
	.call(xAxis_bottom);		
svg.append("g")
	.attr("class", "y axis left")
	.call(yAxis_left);
svg.append("g")
	.attr("class", "x axis top")
	.call(xAxis_top);
svg.append("svg:g")
	.attr("class", "y axis right")
	.attr("transform", "translate(" + width + ",0)")
	.call(yAxis_right);

// Add an x-axis label.
svg.append("text")
	.attr("class", "x label")
	.attr("text-anchor", "middle")
	.attr("x", width/2 )
	.attr("y", height-10)
	.text("Excitation wavelength (nm)");
	
// Add a y-axis label.
svg.append("text")
	.attr("class", "y label")
	.attr("text-anchor", "middle")
	.attr("x", -height/2)
	.attr("y", margin.left-30)
	.attr("transform", "rotate(-90)")
	.text("Emission wavelength (nm)");
	
//Add a clipping path so that data points don't go outside of frame
svg.append("clipPath")                  //Make a new clipPath
	.attr("id", "chart-area")           //Assign an ID
		.append("rect")                     
		.attr("width", width)
		.attr("height", height);
		
// Create definition for arrowhead on lines
defs = svg.append("defs"); //where marker definitions will go
	
//enable zooming	
var zoom = d3.behavior.zoom()
	.x(xScale)
	.y(yScale)
	.scaleExtent([1, 10])
	.on("zoom", draw_graph);

svg.append("rect")
	.attr("class", "pane")
	.attr("width", width)
	.attr("height", height)
	.call(zoom);

//a group to contain the clipping path that all out plots will go into.	
plotarea = svg.append("g")
	.attr("clip-path", "url(#chart-area)");
	
var FPdata = []; //Where the fluorescent protein data table will end up.
var linkdata = []; //links between photoconvertible states

// load the csv file and plot it
d3.csv("PSFPs_processed.csv", function (data) {
	data.forEach(function(d){
		d.lambda_em = +d.lambda_em;		// typing these variables here for simplicity of code later on
		d.lambda_ex = +d.lambda_ex;
		d.E = +d.E;
		d.QY = +d.QY;
		d.brightness = +d.brightness;
		
		//caclulate Stokes shift
		d.stokes = d.lambda_em - d.lambda_ex;
		
	})

	FPdata = data;
	
	//Only update max of saturation scale, so that gray corresponds to 0 brightness
	//Use 80th percentile as max saturation so that not everything is muddy gray
	saturationScale.domain([0, 
		d3.quantile(FPdata.map(function(a) {return (+a.brightness)}).sort(function(a,b){return a-b}),0.8)
	]);
	
	d3.csv("links.csv", function (links) {		
		links.forEach(function(link){
			//populate link data with appropriate starting and ending coordinates
			link.lambda = +link.lambda;
			var startFP = $.grep(FPdata, function(e){ return e.UID == link.state1; });
			var endFP = $.grep(FPdata, function(e){ return e.UID == link.state2; });
			startFP = startFP[0];
			endFP = endFP[0];
			link.lambda_ex = [startFP.lambda_ex, endFP.lambda_ex];
			link.lambda_em = [startFP.lambda_em, endFP.lambda_em];
			link.E = [startFP.E, endFP.E];
			link.QY= [startFP.QY, endFP.QY];
			link.brightness = [startFP.brightness, endFP.brightness];
			link.pka = [startFP.pka, endFP.pka];
			link.stokes = [startFP.stokes, endFP.stokes]
			link.Name = startFP.Name;
		});
		
		linkdata = links;
		
		//we have to generate separate markers for each line since markers can't inherit line color
		//do this here because we only have to do it once
		var markers = defs.selectAll("marker").data(links, function (d){ return d.state1;});
		markers.enter().append("marker")
			.attr("stroke", function (d) { return d3.hsl(hueScale (d.lambda_sw), 1, 0.5)})
			.attr("fill", function (d) { return d3.hsl(hueScale (d.lambda_sw), 1, 0.5)})
			.attr("id", function (d){ return "arrowhead" + d.state1;})
			.attr("viewBox", "0 -5 10 10")
			.attr("refX", 8)
			.attr("refY", 0)
			.attr("markerUnits", "strokeWidth")
			.attr("markerWidth", 5)
			.attr("markerHeight", 5)
			.attr("orient", "auto")
		 .append("path")
			.attr("d", "M0,-5L10,0L0,5");
		
		plot();
		draw_table();
	});		
});

function draw_graph(){
	//redraw axes with new domains
	svg.select(".x.axis.bottom").call(xAxis_bottom);
	svg.select(".y.axis.left").call(yAxis_left);
	svg.select(".x.axis.top").call(xAxis_top);
	svg.select(".y.axis.right").call(yAxis_right);
	
	svg.selectAll("circle.PSFP")
		.attr("cx", function (d) { return xScale (d[currentX]); })
		.attr("cy", function (d) { return yScale (d[currentY]); });
		
	svg.selectAll("rect.PSFP")
		.attr("x", function (d) { return xScale (d[currentX]) - symbolsize; })
		.attr("y", function (d) { return yScale (d[currentY]) -symbolsize; });
		
	svg.selectAll("line.PSFP")
		.attr("x1", function (d) { return xScale (d[currentX][0]); })
		.attr("x2", function (d) { return xScale (d[currentX][1]); })
		.attr("y1", function (d) { return yScale (d[currentY][0]); })
		.attr("y2", function (d) { return yScale (d[currentY][1]); });
}

//i added this more flexible plotting function to be able to plot different variables on each axis.  It takes three optional parameters: the data array, and two axes variables.  
function plot(xvar,yvar,data,links){
	//set default values... if plot() is called without arguments, these default values will be used.
	xvar = xvar || currentX;
	yvar = yvar || currentY;
	data = data || FPdata;
	links = links || linkdata;

	//filter the data according to the user settings for EC, QY, and brightness range
	//we want to keep proteins where any state satisfies the criteria and only remove proteins where all states fail
	
	var goodFPs = [];
	for (var i=0; i < data.length; i++){
		//must pass filtercheck, be non-empty, and not previously recorded.
		d = data[i];
		if (filtercheck(d) && d[xvar] > 0 && d[yvar] > 0 && goodFPs.indexOf(d.Name) == -1) {
			//add Name to keeplist
			goodFPs.push(d.Name);
		}
	}

	// helper function to iterate through all of the data filters (without having to type them all out)
	function filtercheck(data){		
		for (f in filters){
			v = filters[f];
			if( data[f] < v[0] || data[f] > v[1] ) {return false;}
		}
		return true;
	}
	data = data.filter(function(d) { return goodFPs.indexOf(d.Name) > -1; });
	links = links.filter(function(d) { return goodFPs.indexOf(d.Name) > -1; });
	
	//additionally remove off states from data; we don't need to show them. These are found by looking for lambda_ex = 0
	data = data.filter(function(d) { return d.lambda_ex > 0; });

	//update scale domains based on data
	xScale.domain([
		d3.min (data, function(d) { return .99 * d[xvar]; }),
		d3.max (data, function(d) { return 1.01 * d[xvar]; })
	])
	.nice();
	zoom.x(xScale);

	yScale.domain([
		d3.min (data, function(d) { return .99 * d[yvar]; }),
		d3.max (data, function(d) { return 1.01 * d[yvar]; })
	])
	.nice();
	zoom.y(yScale);

	//relabel X and Y axes
	svg.select(".x.label").text(strings[xvar])
	svg.select(".y.label").text(strings[yvar])
	
	//filter out just photoactivatible proteins, plot them as circles
	PAdata = data.filter(function(d) {return d.type == "pa" || d.type =="ps"; });
	// Join new data with old elements, if any.
	var circle = plotarea.selectAll("circle.PSFP").data(PAdata, function (d){ return d.UID;});

	// Create new elements as needed.
	circle.enter().append("circle")
		.attr("class", function(d) {
			return d.type == "pa" ? "PSFP" : "PSFP ps";})
		.attr("r", symbolsize)
		.attr("stroke", function (d) { return d3.hsl(hueScale (d.lambda_on), 1, 0.5)})
		.style("fill", function (d) { return d3.hsl(hueScale (d.lambda_em), saturationScale (d.brightness), 0.5)})
		.on('click', function(e){
    		if(e.DOI){window.location = "http://dx.doi.org/" + e.DOI;}
		})
		.on("mouseover", function(d) { draw_tooltip(d, this);})
		.on("mouseout", function() {
			d3.select(this).transition().duration(200).attr("r",8)
			//Hide the tooltip
			d3.select("#tooltip").classed("hidden", true);			
		})
		.call(zoom)		//so we can zoom while moused over circles as well

	// Remove old elements as needed.
	circle.exit().remove();

	// move circles to their new positions (based on axes) with transition animation
	circle.transition()
	    .attr("cx", function (d) { return xScale (d[xvar]); })
	    .attr("cy", function (d) { return yScale (d[yvar]); })
	    .duration(800); //change this number to speed up or slow down the animation
		
	//filter out just photoconvertible proteins, plot them as squares
	PCdata = data.filter(function(d) {return d.type == "pc"; });
	// Join new data with old elements, if any.
	var square = plotarea.selectAll("rect.PSFP").data(PCdata, function (d){ return d.UID;});

	// Create new elements as needed.
	square.enter().append("rect")
		.attr("class", "PSFP")
		.attr("width", symbolsize*2)
		.attr("height", symbolsize*2)
		.attr("stroke", "#000")
		.style("fill", function (d) { return d3.hsl(hueScale (d.lambda_em), saturationScale (d.brightness), 0.5)})
		.on('click', function(e){
    		if(e.DOI){window.location = "http://dx.doi.org/" + e.DOI;}
		})
		.on("mouseover", function(d) { draw_tooltip(d, this);})
		.on("mouseout", function() {
			d3.select(this).transition().duration(200).attr("r",8)
			//Hide the tooltip
			d3.select("#tooltip").classed("hidden", true);			
		})
		.call(zoom)		//so we can zoom while moused over circles as well

	// Remove old elements as needed.
	square.exit().remove();

	// move squares to their new positions (based on axes) with transition animation
	square.transition()
	    .attr("x", function (d) { return xScale (d[xvar]) - symbolsize; })
	    .attr("y", function (d) { return yScale (d[yvar]) - symbolsize; })
	    .duration(800); //change this number to speed up or slow down the animation
		
	//Add links for photoconvertible proteins
	//remove links that go to proteins in the off state (those with lambda_ex = 0);
	
	links = links.filter(function(d) { return !d.lambda_ex.some( function(w) { return w == 0}) });
	
	var line = plotarea.selectAll("line.PSFP").data(links, function (d){ return d.state1;});
	line.enter().append("line")
		.attr("class", "PSFP")
		.attr("stroke", function (d) { return d3.hsl(hueScale (d.lambda_sw), 1, 0.5)})
		.attr("marker-end", function (d){ return "url(#arrowhead" + d.state1 +")";})
		.call(zoom);
		
	line.exit().remove();
		
	line.transition()
		.attr("x1", function (d) { return xScale (d[currentX][0]); })
		.attr("x2", function (d) { return xScale (d[currentX][1]); })
		.attr("y1", function (d) { return yScale (d[currentY][0]); })
		.attr("y2", function (d) { return yScale (d[currentY][1]); })
	    .duration(800); //change this number to speed up or slow down the animation

	// these two lines cause the transition animation on the axes... they are also cause chopiness in the user interface when the user slides the range sliders on the right side...  uncomment to see their effect.
	svg.select(".x.axis.bottom").call(xAxis_bottom);
	svg.select(".y.axis.left").call(yAxis_left);
}

function draw_tooltip(d, target) {
			d3.select(target).transition().duration(100).attr("r",11)
			d3.select(target).text("<a href='#'>hi</a>")
			//Get target bar's x/y values, then augment for the tooltip
			var xPosition = parseFloat(d3.select(target).attr("cx"))
			var yPosition = parseFloat(d3.select(target).attr("cy"))
			if (xPosition<width*2/3){
				xPosition +=70;
			} else {
				xPosition -=140;
			}
			if (yPosition>520){
				yPosition =520;
			}
			//Update the tooltip position and value
			d3.select("#tooltip")
				.style("left", xPosition + "px")
				.style("top", yPosition + "px")						
				.select("#exvalue")
				.text(d.lambda_ex)
			d3.select("#tooltip")
				.select("#emvalue")
				.text(d.lambda_em);
			d3.select("#tooltip")
				.select("#ecvalue")
				.text(d.E);
			d3.select("#tooltip")
				.select("#qyvalue")
				.text(d.QY);
			d3.select("#tooltip")
				.select("h3")
				.text(d.Name);
			d3.select("#tooltip")
				.select("#brightnessvalue")
				.text(d.brightness);

			//Show the tooltip
			d3.select("#tooltip").classed("hidden", false);

		}

function draw_table() {
columns = Object.keys(tableStrings); //column names
//split up fluorescent proteins by type and add the relevant tables
FPgroups.forEach( function(FPtype) {
	function testfilt(element){
		return element.type == FPtype.type;
	}

	var table = d3.select("#table").append("table");
	//add title row
	table.append("tr").append("th")
		.attr("colspan", columns.length)
		.attr("class", "tabletitle")
		.style("background-color", FPtype.color)
		.text(FPtype.Name + " Proteins");

	//filter table data
	//remove proteins with lambda_ex = 0 (off states)
	tdata = FPdata.filter(function(d) {return d.lambda_ex > 0;});
	
	tdata = tdata.filter(testfilt);			
	table.append("tr")
		.attr("class", "header")
		.selectAll("th")
		.data(columns)
	.enter().append("th")
		.html(function(d,i) { return tableStrings[columns[i]]; })
		.attr("class", function(d,i) { return (d == "Name") ? "col head protein" : "col head numeric"; }); // conditional here to limit the use of unneccesary global variables 
		
	//populate the table
	//Can't use d3's data binding because we want to group different states of
	//the same molecule as these in different rows of the data table.
	
	//Get list of all unique proteins from dataset
	var FPnames = d3.set(tdata.map(function (d) {return d.Name;}));
	FPnames.forEach( function(currprotein) {
		//Get all states for current protein
		var proteinData = tdata.filter(function(d) {return d.Name == currprotein;});
		var nStates = proteinData.length;
		for (var i=0; i < nStates; i++){
			//Add row
			var row = table.append("tr").attr("class", "data");
			
			if (i == 0){
			//First row, add protein name with rowspan
			row.append("td")
				.attr("class", "col protein")
				.attr("rowspan", nStates)
				.html(currprotein);
			}
			//loop over remaining data columns
			for (var key in tableStrings) {
				if (tableStrings.hasOwnProperty(key) && key != "Name") {		
					//format text to print in table cell
					var text = "";
					if (key == "RefNum"){
						//add links to bibliography
						//make references rowspan to avoid duplication for each state
						if (i==0){
							row.append("td")
								.attr("class", "col numeric")
								.attr("rowspan", nStates)
								.html("<a href=\"#ref" + proteinData[i][key] + "\">" + proteinData[i][key] + "</a>");
							}
						}
						else{
						row.append("td")
							.attr("class", "col numeric")
							.html(proteinData[i][key]);
						}

				}
			}		
		}
	});
});
};

function generate_transitions(name) {
	var outputHTML = "";
	//get all states for the protein with the given name
	var proteinData = FPdata.filter(function(d) {return d.Name == name;})	
	var statesToProcess = new Array();
	var statesProcessed = new Array();
	
	//get initial state for protein
	var startState = proteinData.filter(function(d) {return d.initialState == 1;});
	statesToProcess.push(startState[0].UID);
	while (statesToProcess.length > 0){
		//pull next state off queue
		var nextState = statesToProcess.shift();
		//check if we've processed it
		if (!statesProcessed.some(function(d) {return d == nextState;})) {		
			var transitions = linkdata.filter(function(d) {return d.state1 == nextState});
			outputHTML = print_transitions(transitions, outputHTML);
			//add destination states to list to process
			transitions.forEach(function (d){statesToProcess.push(d.state2);});
			//add current state to processed list
			statesProcessed.push(nextState);
		}
	}
	return outputHTML;
}

function print_transitions(transitions, outputHTML){
	transitions.forEach(function(transit) {
		//get name of state1
		startname = FPdata.filter(function(d) {return d.UID == transit.state1});
		startname = startname[0].state;
		//get name of state2
		endname = FPdata.filter(function(d) {return d.UID == transit.state2});
		endname = endname[0].state;
		outputHTML = outputHTML + startname + " &rarr; " + endname;
		outputHTML = outputHTML + " (" + transit.lambda_sw + " nm)\n";
		return outputHTML;
	})
	return outputHTML;
}


function doalittledance(int) {
	var s = ["QY","E","lambda_em","lambda_ex","brightness"];
	setInterval(function() {
	  var x = s[Math.floor(Math.random() * s.length)];
	  do{
	    var y = s[Math.floor(Math.random() * s.length)];
	  }	while (x == y);	
	  plot(x,y);
	}, int);

}


//this bit is just a jQuery plugin to make the radio checkboxes on the right side vertical
(function( $ ){
//plugin buttonset vertical
$.fn.buttonsetv = function() {
  $(':radio, :checkbox', this).wrap('<div style="margin: 1px"/>');
  $(this).buttonset();
  $('label:first', this).removeClass('ui-corner-left').addClass('ui-corner-top');
  $('label:last', this).removeClass('ui-corner-right').addClass('ui-corner-bottom');
  mw = 0; // max witdh
  $('label', this).each(function(index){
     w = $(this).width();
     if (w > mw) mw = w; 
  })
  $('label', this).each(function(index){
    $(this).width(mw);
  })
};
})( jQuery );