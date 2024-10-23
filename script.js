/********************************************
SURF 2022
Copyright (c) 2022 Elaine Demetrion
Licensed under the MIT license: http://www.opensource.org/licenses/mit-license.php 
********************************************/

/** Notes
* Errors with angles >= 180
* */

let cone;

p5.disableFriendlyErrors = true; // disables FES

//Setting up the chart, utilizes Chart.js library
var parastichyGraphElement = document.getElementById("parastichyGraph");
var parastichyGraph = new Chart(parastichyGraphElement, {
  type: 'line',

  data: {
    labels: [],
    datasets: [{
      label: "Up parastichies",
      data: [],
      pointRadius: 0,
      borderColor: "red",
      fill: false
    }, {
      label: "Down parastichies",
      data: [],
      pointRadius: 0,
      borderColor: "green",
      fill: false
    }],
  },
  options: {
  maintainAspectRatio: false,
  responsive: true,
    scales: {
      x: {
        title: {
          display: true,
          text: 'Iteration Number'
        }
      }
    }
  }
})

// Scale for each canvas relative to the height/width of the screen.
let scaleX = 0.447
let scaleY = 0.5

//what to do when the user clicks the mouse, for either canvas
let mouseClicked = function(p) {
  if(p.mouseX > 0 && p.mouseX < p.width && p.mouseY > 0 && p.mouseY < p.height) {
        try {
          cone.nextDiskStackingIteration();
          //also updates the graph!
          updateGraph();
        } catch (error) {
          document.getElementById("errorMessages").innerHTML = "Program encountered an error attempting the next iteration of the disk stacking. Error message: '" + error + "' Please change your settings. This happens most often when no candidates are found."
          document.getElementById("errorMessagesDiv").style.display = "block"
        }
        
    }
}

// find the width of the scroll bar, to adjust the width of each canvas, so we don't have a horizontal scroll bar
const getScrollbarWidth = () =>
  window.innerWidth - document.documentElement.clientWidth;

  //resize the canvas when the user resizes the window! Same as first drawing canvas, except that it's the new windowWidth and windowHeight being used, and we're making sure that the cone has the appropriate new scaler value.
let resizeWindow = function(p) {
  cone.heightProportion = scaleY
  p.resizeCanvas(scaleX*p.windowWidth-getScrollbarWidth(), cone.heightProportion*p.windowHeight);
  cone.scaler = p.width
}


/*A closure function for p5 instance mode. (if confused watch https://www.youtube.com/watch?v=Su792jEauZg)
@param p: how we'll refer to the environment containing the cone, its canvas, etc within the closure function. */ 
var conep5Function = function( p ) {
  //sets up the canvas, initializes the cone and other variables. Also the graph!
  p.setup = function () {
    // p.print(getScrollbarWidth())
    let canvas = p.createCanvas(scaleX*p.windowWidth-getScrollbarWidth(), scaleY*p.windowHeight);
    canvas.parent('diskStackingCanvas');
    p.background(255);
        
    cone = new StackingCone(p, 0, -0.9, 50, 0.084, 1, 0.4,{});
    cone.heightProportion = scaleY      
    document.getElementById("parastichyNumbersText").innerHTML = reportParastichyNumbers();
    
    //update the graph
    resetGraph();
  }

  //runs every frame to display the cone and disks
  p.draw = function() {cone.drawFull(p,"cone")}

  //what to do when the user clicks the mouse
  p.mouseClicked = function() {mouseClicked(p)}

  //handle when window is resized
  p.windowResized = function() {resizeWindow(p)}
}

// Another closure function, for the second canvas with the cylindrical model. Only used for drawing. 
var conep5FunctionCylinder = function( p ) {

  //sets up the second canvas! This canvas will use the same cone as the left canvas, so no need to initialize anything else.
  p.setup = function () {
    let canvas = p.createCanvas(scaleX*p.windowWidth-getScrollbarWidth(), scaleY*p.windowHeight);
    canvas.parent('diskStackingCanvas2');
    p.background(255);
  }

  //runs every frame to display the cone and disks in cylinder mode
  p.draw = function() {cone.drawFull(p,"cylinder")}

  //what to do when the user clicks the mouse
  p.mouseClicked = function() {mouseClicked(p)}
  // handle window resizing.
  p.windowResized = function() {resizeWindow(p)}
  
}

//do everything needed to have the cone drawn on the screen
var conep5 = new p5(conep5Function);
var conep5Cyl = new p5(conep5FunctionCylinder)

//duplicate the above with a separate cone for the cylinder version

/*resets the cone. Called form the "Restart with settings" button.*/
function resetCone(angle = 130, height = 0.6, rMeridian = 0.8, upPara, downPara) {
  cone.reset(angle,height, rMeridian, upPara, downPara);
  document.getElementById("circleNumSlider1").max = cone.p.max(cone.disks.length-1, 10)
  document.getElementById("circleNumSlider2").max = cone.p.max(cone.disks.length-1, 10)
  //update the graph
  resetGraph();
}

/*Returns a string that reports the current parastichy numbers. Used to write the parastichy numbers below the disk stacking app.*/
function reportParastichyNumbers() {
  let iteration = cone.upFrontData.length;
  if (cone.upFrontData[iteration-1] == 0 && cone.downFrontData[iteration-1] == 0) {
    return "Start clicking on below diagrams for parastichy numbers"
  }
  let clientWidth  = document.getElementById('parastichyNumbers').clientWidth;
  let returnStr = ("Current up parastichies: " + cone.upFrontData[iteration - 1] + "; Current down parastichies: " + cone.downFrontData[iteration - 1])
  if (clientWidth > window.innerWidth * 0.45) {
    returnStr = ("Current up parastichies: " + cone.upFrontData[iteration - 1] + ";<br> Current down parastichies: " + cone.downFrontData[iteration - 1])
  }
  return returnStr;
}

/*Adds the most recent parastichy numbers to the graph.*/
function updateGraph() {
  document.getElementById("parastichyNumbersText").innerHTML = reportParastichyNumbers();
  document.getElementById("circleNumSlider1").max = cone.p.max(cone.disks.length-1, 10)
document.getElementById("circleNumSlider2").max = cone.p.max(cone.disks.length-1, 10)

  parastichyGraph.data.labels.push(cone.upFrontData.length - 1);
  //don't need to update other data points; they have references to the array
  parastichyGraph.update();
}

/*Resets all the values in the graph to whatever cone...frontData are.*/
function resetGraph() {
  document.getElementById("parastichyNumbersText").innerHTML = reportParastichyNumbers();
  
  //update the graph
  parastichyGraph.data.datasets[0].data = cone.upFrontData;
  parastichyGraph.data.datasets[1].data = cone.downFrontData;
  
  parastichyGraph.data.labels = Array.from(new Array(cone.upFrontData.length), (x, i) => i);
  parastichyGraph.update();
}