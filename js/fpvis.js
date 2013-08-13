//global variables to hold the current variables plotted on each axis
var currentX = "lambda_ex" 
var currentY = "lambda_em"
//global variables to set the range over which the data is filtered
var exRange = [350,620];
var emRange = [410,680];
var ecRange = [10000,140000];
var qyRange = [0,1];
var brightRange = [0,100]; 
//string variables for updating the axis labels
var strings = {
	"E"			: "Extinction Coefficient",
	"QY"		: "Quantum Yield",
	"brightness": "Brightness",
	"lambda_em" : "Emission Wavelength (nm)",
	"lambda_ex" : "Excitation Wavelength (nm)",
	"pka" 		: "pKa",
	"bleach" 	: "Bleaching Half-life (s)",
	"mature" 	: "Maturation Half-time (min)",
	"lifetime" 	: "Lifetime (ns)",
}

//on page load, listen to slider events and respond by updating the filter ranges (and updating the ui)
//this uses jQuery and jQuery UI which have been added to the head of the document.
$(function() {
	
	$( "#exSlider-range" ).slider({
      range: true,
      min: 350,
      max: 620,
      step: 1,
      values: [ 350, 620 ],
      slide: function( event, ui ) {
        $( "#exRange" ).val( ui.values[ 0 ] + " - " + ui.values[ 1 ] );
        exRange = ui.values;
        plot();
      }
    });

    $( "#exRange" ).val( $( "#exSlider-range" ).slider( "values", 0 ) + " - " +
       $( "#exSlider-range" ).slider( "values", 1 ) + " nm");
    

    $( "#emSlider-range" ).slider({
      range: true,
      min: 410,
      max: 680,
      step: 1,
      values: [ 410, 680 ],
      slide: function( event, ui ) {
        $( "#emRange" ).val( ui.values[ 0 ] + " - " + ui.values[ 1 ] );
        emRange = ui.values;
        plot();
      }
    });

    $( "#emRange" ).val( $( "#emSlider-range" ).slider( "values", 0 ) + " - " +
       $( "#emSlider-range" ).slider( "values", 1 ) + " nm");


    $( "#ECslider-range" ).slider({
      range: true,
      min: 10000,
      max: 140000,
      step: 1000,
      values: [ 10000, 140000 ],
      slide: function( event, ui ) {
        $( "#ECamount" ).val( ui.values[ 0 ] + " - " + ui.values[ 1 ] );
        ecRange = ui.values;
        plot();
      }
    });

    $( "#ECamount" ).val( $( "#ECslider-range" ).slider( "values", 0 ) + " - " +
       $( "#ECslider-range" ).slider( "values", 1 ) );


    $( "#QYslider-range" ).slider({
      range: true,
      min: 0,
      max: 1,
      step: 0.01,
      values: [ 0, 1 ],
      slide: function( event, ui ) {
        $( "#QYamount" ).val( ui.values[ 0 ] + " - " + ui.values[ 1 ] );
        qyRange = ui.values;
        plot();
      }
    });

    $( "#QYamount" ).val( $( "#QYslider-range" ).slider( "values", 0 ) + " - " +
       $( "#QYslider-range" ).slider( "values", 1 ) );


    $( "#Brightslider-range" ).slider({
      range: true,
      min: 0,
      max: 100,
      step: 1,
      values: [ 0, 100 ],
      slide: function( event, ui ) {
        $( "#BrightAmount" ).val( ui.values[ 0 ] + " - " + ui.values[ 1 ] );
        brightRange = ui.values;
        plot();
      }
    });

    $( "#BrightAmount" ).val( $( "#Brightslider-range" ).slider( "values", 0 ) + " - " +
       $( "#Brightslider-range" ).slider( "values", 1 ) );

    $("#Xradio").buttonsetv();
    $("#Yradio").buttonsetv();

    $( "#Xradio input" ).click(function() {
	  currentX = $(this).val();
	  plot(currentX, currentY);
	});
	$( "#Yradio input" ).click(function() {
	  currentY = $(this).val();
	  plot(currentX, currentY);
	});

	//easter egg
	$("#doalittledance").click(function(){doalittledance(1600);});
	});


//load the bibliography
$("#bibliography").load('bibliography.html');

// Chart dimensions.
var margin = {top: 20, right: 30, bottom: 20, left: 50},
width = 700 - margin.right,
height = 700 - margin.top - margin.bottom;

//Scales and axes
var xScale = d3.scale.linear()
			.range ([0, width])
			.domain([300, 800])
			.nice();
var yScale = d3.scale.linear()
			.range ([height, 0])
			.domain([300, 800])
			.nice();

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

	
var FPdata = []; //Where the fluorescent protein data table will end up.

// load the csv file and plot it
d3.csv("processedFPs.csv", function (data) {
	data.forEach(function(d){
		d.lambda_em = +d.lambda_em;		// typing these variables here for simplicity of code later on
		d.lambda_ex = +d.lambda_ex;
		d.E = +d.E;
		d.QY = +d.QY;
		d.brightness = +d.brightness;
	})

	FPdata = data;
	
	//Only update max of saturation scale, so that gray corresponds to 0 brightness
	//Use 90th percentile as max saturation so that not everything is muddy gray
	saturationScale.domain([0, 
		d3.quantile(FPdata.map(function(a) {return (+a.brightness)}).sort(),0.9)
	]);
	
	plot();
			
});

function draw_graph(){
	//redraw axes with new domains
	svg.select(".x.axis.bottom").call(xAxis_bottom);
	svg.select(".y.axis.left").call(yAxis_left);
	svg.select(".x.axis.top").call(xAxis_top);
	svg.select(".y.axis.right").call(yAxis_right);
	
	svg.selectAll("circle.FP")
		.attr("cx", function (d) { return xScale (d[currentX]); })
		.attr("cy", function (d) { return yScale (d[currentY]); })
}


//i added this more flexible plotting function to be able to plot different variables on each axis.  It takes three optional parameters: the data array, and two axes variables.  
function plot(xvar,yvar,data){
	//set default values... if plot() is called without arguments, these default values will be used.
	xvar = xvar || currentX;
	yvar = yvar || currentY;
	data = data || FPdata;

	//filter the data according to the user settings for EC, QY, and brightness range
	data = data.filter(function(d) {
	    return d.QY > qyRange[0] && d.QY < qyRange[1] 
	    	&& d.E > ecRange[0] && d.E < ecRange[1] 
	    	&& d.brightness > brightRange[0] && d.brightness < brightRange[1] 
	    	&& d.lambda_ex > exRange[0] && d.lambda_ex < exRange[1]
	    	&& d.lambda_em > emRange[0] && d.lambda_em < emRange[1];
	});

	//filter out data with empty values
	data = data.filter(function(d) {return d[xvar] > 0 && d[yvar] > 0;});

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

	// Join new data with old elements, if any.
	var circle = svg.selectAll("circle.FP").data(data, function (d){ return d.Name;});

	// Create new elements as needed.
	circle.enter().append("circle")
		.attr("clip-path", "url(#chart-area)") 
		.attr("class", "FP")
		.attr("r", 8)
		.attr("stroke", "#000")
		.attr("opacity", 0.7)
		.style("fill", function (d) { return d3.hsl(hueScale (d.lambda_em), saturationScale (d.brightness), 0.5)})
		.on('click', function(e){
    		if(e.DOI){window.location = "http://dx.doi.org/" + e.DOI;}
		})
		.on("mouseover", function(d) {
			d3.select(this).transition().duration(100).attr("r",11)
			d3.select(this).text("<a href='#'>hi</a>")
			//Get this bar's x/y values, then augment for the tooltip
			var xPosition = parseFloat(d3.select(this).attr("cx"))
			var yPosition = parseFloat(d3.select(this).attr("cy"))
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

		})
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

	// these two lines cause the transition animation on the axes... they are also cause chopiness in the user interface when the user slides the range sliders on the right side...  uncomment to see their effect.
	svg.select(".x.axis.bottom").call(xAxis_bottom);
	svg.select(".y.axis.left").call(yAxis_left);
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