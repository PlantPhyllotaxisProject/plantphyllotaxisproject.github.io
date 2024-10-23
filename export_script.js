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


/*A closure function for p5 instance mode. (if confused watch https://www.youtube.com/watch?v=Su792jEauZg)
@param p: how we'll refer to the environment containing the cone, its canvas, etc within the closure function. */
var conep5Function = function( p ) {
  //sets up the canvas, initializes the cone and other variables. Also the graph!
  p.setup = function () {
    // p.print(getScrollbarWidth())
    // // let canvas = p.createCanvas(scaleX*p.windowWidth-getScrollbarWidth(), scaleY*p.windowHeight);
    // // canvas.parent('diskStackingCanvas');
    // p.background(255);
        
    cone = new StackingCone(p, 0, -0.9, 50, 0.084, 1, 0.4,{});
    // cone.heightProportion = scaleY
    /*let iterations = 300;
    for(let i = 0; i < iterations; i ++) {
      cone.nextDiskStackingIteration();
    }*/
      
    // document.getElementById("parastichyNumbersText").innerHTML = reportParastichyNumbers();
    
    //update the graph
    // resetGraph();
  }

  //runs every frame to display the cone and disks
  p.draw = function() {
    //cone.drawFull(p,"cylinder")
    // cone.drawFull(p,"cone")
  }

  //what to do when the user clicks the mouse
  p.mouseClicked = function() {
    // if(p.mouseX > 0 && p.mouseX < p.width && p.mouseY > 0 && p.mouseY < p.height) {
    //     cone.nextDiskStackingIteration();
    //     //also updates the graph!
    //     updateGraph();
    // }
  }
  
  // p.windowResized = function() {
  //   // cone.heightProportion = scaleY
  //   // p.resizeCanvas(scaleX*p.windowWidth-getScrollbarWidth(), cone.heightProportion*p.windowHeight);
  //   // cone.scaler = p.width
  //   // cone.drawFull(p,"cone")
  //     // document.getElementById("parastichyNumbersText").innerHTML = reportParastichyNumbers();
  // }
}

var conep5FunctionCylinder = function( p ) {

  //sets up the canvas, initializes the cone and other variables. Also the graph!
  p.setup = function () {
    
    // let canvas = p.createCanvas(scaleX*p.windowWidth-getScrollbarWidth(), scaleY*p.windowHeight);
    // canvas.parent('diskStackingCanvas2');
    // p.background(255);
  }

  //runs every frame to display the cone and disks
  p.draw = function() {
    // cone.drawFull(p,"cylinder")
  }

  //what to do when the user clicks the mouse
  // p.mouseClicked = function() {
  //   // if(p.mouseX > 0 && p.mouseX < p.width && p.mouseY > 0 && p.mouseY < p.height) {
  //   //     cone.nextDiskStackingIteration();
  //   //     //also updates the graph!
  //   //     updateGraph();
  //   // }
  // }
  // p.windowResized = function() {
  //   // p.resizeCanvas(scaleX*p.windowWidth-getScrollbarWidth(), cone.heightProportion*p.windowHeight);
  // }
  
}

//do everything needed to have the cone drawn on the screen
var conep5 = new p5(conep5Function);
var conep5Cyl = new p5(conep5FunctionCylinder)

//duplicate the above with a separate cone for the cylinder version

/*resets the cone. Called form the "Restart with settings" button.*/
function resetCone(angle = 130, height = 0.6, rMeridian = 0.8, upPara, downPara) {
  cone.reset(angle,height, rMeridian, upPara, downPara);
  
  //update the graph
  resetGraph();
}

/*Returns a string that reports the current parastichy numbers. Used to write the parastichy numbers below the disk stacking app.*/
// function reportParastichyNumbers() {
//   let iteration = cone.upFrontData.length;
//   if (cone.upFrontData[iteration-1] == 0 && cone.downFrontData[iteration-1] == 0) {
//     return "Start clicking on below diagrams for parastichy numbers"
//   }
//   let clientWidth  = document.getElementById('parastichyNumbers').clientWidth;
//   cone.p.print("clientWidth, iteration " + iteration + ": " + clientWidth)
//   let returnStr = ("Current up parastichies: " + cone.upFrontData[iteration - 1] + "; Current down parastichies: " + cone.downFrontData[iteration - 1])
//   if (clientWidth > window.innerWidth * 0.45) {
//     returnStr = ("Current up parastichies: " + cone.upFrontData[iteration - 1] + ";<br> Current down parastichies: " + cone.downFrontData[iteration - 1])
//   }
//   return returnStr;
// }

/*Adds the most recent parastichy numbers to the graph.*/
// function updateGraph() {
//   document.getElementById("parastichyNumbersText").innerHTML = reportParastichyNumbers();
//   parastichyGraph.data.labels.push(cone.upFrontData.length - 1);
//   //don't need to update other data points; they have references to the array
//   parastichyGraph.update();
// }

/*Resets all the values in the graph to whatever cone...frontData are.*/
// function resetGraph() {
//   document.getElementById("parastichyNumbersText").innerHTML = reportParastichyNumbers();
  
//   //update the graph
//   parastichyGraph.data.datasets[0].data = cone.upFrontData;
//   parastichyGraph.data.datasets[1].data = cone.downFrontData;
  
//   parastichyGraph.data.labels = Array.from(new Array(cone.upFrontData.length), (x, i) => i);
//   parastichyGraph.update();
// }

// angle,height,iterations = [start,(end,(skip))] or [value1,value2,value3,value4,...]
// upPara,downPara = number
function extractData(angle,height,upPara,downPara,iterations) {
  let arr = [];
  let angleArr = [];
  if (angle.length <= 3) {
    if (!angle[1]) {
      angle[1] = angle[0];
      angle[0] = 0
      angle[2] = 1
    }
    else if (!angle[2]) {
      angle[2] = 1;
    }
    for (let i = angle[0]; i <= angle[1]; i+= angle[2]) {
      angleArr.push(i)
    }
  } else {angleArr = angle;}

  let heightArr = [];
  if (height.length <= 3) {
    if (!height[1]) {
      height[1] = height[0];
      height[0] = 0
      height[2] = 0.01
    }
    else if (!height[2]) {
      height[2] = 0.01;
    }
    for (let i = height[0]*100; i <= height[1]*100; i+= height[2]*100) {
      heightArr.push(i/100)
    }
  } else {heightArr = height;}

  let iterArr = [];
  if (iterations.length <= 3) {
    if (!iterations[1]) {
      iterations[1] = iterations[0];
      iterations[0] = 0
      iterations[2] = 1
    }
    else if (!iterations[2]) {
      iterations[2] = 1;
    }
    for (let i = cone.p.round(iterations[0]); i <= cone.p.round(iterations[1]); i+= cone.p.round(iterations[2])) {
      iterArr.push(i)
    }
  } else {iterArr = iterations;}
  if (upPara == 0 || downPara == 0 || (upPara == 1 && downPara == 1)) {
    upPara = false;
    downPara = false;
  }
  else if ((upPara == 1 && downPara != 2) || (downPara == 1 && upPara != 2)) {
    upPara = false; 
    downPara = false;
  }
  let coneIter = new StackingCone(cone.p, 0, -0.9, 50, 0.084, 1, 0.4,{});
  cone.p.print(angleArr)
  cone.p.print(heightArr)
  cone.p.print(iterArr)
  coneIter.height = heightArr[0]
  coneIter.angle = angleArr[0]
  for (let i = 0; i < angleArr.length; i++) {
    for (let j = 0; j < heightArr.length; j++) {
      coneIter.reset(angleArr[i],heightArr[j], 0.5, upPara, downPara);
      
      for (let k = 0; k < iterArr.length; k++) {
        let start;
        let end;
        if (k == 0) {
          start = 0;
          end = iterArr[k];
        } else {
          start = iterArr[k-1]
          end = iterArr[k]
        }
        for (let ii = 1+start; ii<=end; ii++) {
          coneIter.nextDiskStackingIteration()
        }
        if (upPara == undefined || downPara == undefined || iterArr[k] == undefined || heightArr[j] == undefined || angleArr[i] == undefined || coneIter.upFrontData[k] == undefined ||coneIter.downFrontData[k] == undefined ) {
          cone.p.print("found undefined at i = " + i + ", j = "+ j+", k = " + k)
          cone.p.print([iterArr[k],heightArr[j],angleArr[i],upPara,downPara,coneIter.upFrontData[k],coneIter.downFrontData[k]])
        }
        arr.push([upPara,downPara,heightArr[j],angleArr[i],iterArr[k],coneIter.upFrontData[k],coneIter.downFrontData[k]])
      }
    }
  }
  return arr;
  cone.p.print(arr);
}

// https://jsfiddle.net/jossef/m3rrLzk0/
function exportToCsv(filename, rows) {
    var processRow = function (row) {
        var finalVal = '';
        for (var j = 0; j < row.length; j++) {
            var innerValue = row[j] === null ? '' : row[j].toString();
            if (row[j] instanceof Date) {
                innerValue = row[j].toLocaleString();
            };
            var result = innerValue.replace(/"/g, '""');
            if (result.search(/("|,|\n)/g) >= 0)
                result = '"' + result + '"';
            if (j > 0)
                finalVal += ',';
            finalVal += result;
        }
        return finalVal + '\n';
    };

    var csvFile = '';
    for (var i = 0; i < rows.length; i++) {
        csvFile += processRow(rows[i]);
    }

    var blob = new Blob([csvFile], { type: 'text/csv;charset=utf-8;' });
    if (navigator.msSaveBlob) { // IE 10+
        navigator.msSaveBlob(blob, filename);
    } else {
        var link = document.createElement("a");
        if (link.download !== undefined) { // feature detection
            // Browsers that support HTML5 download attribute
            var url = URL.createObjectURL(blob);
            link.setAttribute("href", url);
            link.setAttribute("download", filename);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    }
}
