/********************************************
SURF 2022
Copyright (c) 2022 Elaine Demetrion
Licensed under the MIT license: http://www.opensource.org/licenses/mit-license.php 
******************************************* */
function transformConeToCylinder(x, y, alpha, rMeridian,p) {
  p.angleMode(p.RADIANS)
  if (alpha > p.PI) {
    alpha = alpha * p.PI / 180 
  }
  let argZ = p.atan2(y,x)
  let k = 2*alpha*rMeridian;
  var newX = (k/(2*alpha))*(0.5*p.PI+alpha - argZ);
  var newY = (x**2 + y**2)**0.5;
  var pt = [newX - k/2, newY]
  //p.print(rMeridian)
  return pt;
}

function logarithmicCylinderFromCone(x,y,alpha,p) {
  p.angleMode(p.RADIANS)
  if (p.abs(alpha) > p.PI) {
    alpha = alpha * p.PI / 180 
  }
  let argZ = p.atan2(y,x)
  if (x == 0 && y == 0) {
    p.print("oh no")
  }
  //p.print(argZ)
  // x = r*cos
  // x/cos = r
  // y = r*sin
  let newY = p.log((x**2+y**2)**0.5)/(2*alpha)
  let newX = (-argZ + 0.5*p.PI + alpha)/(2*alpha)
  
  return [newX - 1/2, newY]
  
}

function transformCircle(x,y,r, alpha, rMeridian, num_pts,p) {
  points = [];
  p.angleMode(p.DEGREES)
  for (let i = 0; i < num_pts; i ++) {
    p.angleMode(p.DEGREES)
    let theta = i/num_pts * 360;
    let currX = x + r*p.cos(theta);
    let currY = y + r*p.sin(theta);
    point = transformConeToCylinder(currX, currY, alpha, rMeridian,p)
    if (currY > 0){
        points.push(point);
    }
    
    //p.print(rMeridian)
  }
  return points;
}

function transformCircleLogarithmic(x,y,r, alpha, num_pts,p) {
  points = [];
  p.angleMode(p.DEGREES)
  for (let i = 0; i < num_pts; i ++) {
    p.angleMode(p.DEGREES)
    let theta = i/num_pts * 360;
    let currX = x + r*p.cos(theta);
    let currY = y + r*p.sin(theta);
    point = logarithmicCylinderFromCone(currX, currY, alpha,p)
    if (currY > 0){
        points.push(point);
    }
  }
  return points;
}

function drawPolygon(ptsArr, p, fillColor, strokeColor, strokeWeight) {
  if (ptsArr.length == 0) {
    return
  }
  p.fill(fillColor);
  p.stroke(strokeColor);
  p.strokeWeight(strokeWeight);
  p.beginShape()
  for (let i = 0; i < ptsArr.length; i++) {
    if (i == 0) {
      p.curveVertex(ptsArr[i][0], ptsArr[i][1]) // repeat first vertex
    }
    p.curveVertex(ptsArr[i][0], ptsArr[i][1])
    // if (i == ptsArr.length - 1) {
    //   p.curveVertex(ptsArr[i][0], ptsArr[i][1]) // repeat last vertex
    // }
  }
  p.curveVertex(ptsArr[0][0], ptsArr[0][1])
  p.curveVertex(ptsArr[0][0], ptsArr[0][1])
  p.endShape()
}

function polygonSVG(ptsArr) {
  //T is curveVertex
  let curveStr = 'd="'
  curveStr += 'M'+ptsArr[0][0]+','+ptsArr[0][1] + ' '
  for (let i = 0; i < ptsArr.length; i++) {
    if (i == 0) {
      //p.curveVertex(ptsArr[i][0], ptsArr[i][1]) // repeat first vertex
    }
    curveStr += 'L' + ptsArr[i][0] +',' + ptsArr[i][1] + ' '
    if (i == ptsArr.length - 1) {
      curveStr += 'L' + ptsArr[i][0] +',' + ptsArr[i][1] + '"' // repeat last vertex
    }
  }
  return '<path ' + curveStr + '/>'
}
/**Represents one Disk*/
class Disk {
  /*Constructor for the Disk
  @param p: the namespace the Disk will exist within
  @param x, y: the coordinates of the Disk
  @param radius: the radius of the Disk
  @param id *optional*: the disk's id number.*/
  constructor(p, x, y, radius, id=-1, alpha=25, rMeridian=0.8) {
    this.p = p;
    this.x = x;
    this.y = y;
    this.radius = radius;
    this.id = id; //keeps track of which disk this is. Kept the same across rotated disks.
    this.parents = []; //array of two Disks that are the parents. Should be the Disks rotated to the right physical location. Used to generate the ontological graph.
    this.alpha = alpha
    this.rMeridian = rMeridian
    // let cylinderPt = transformConeToCylinder(x, y, alpha, rMeridian,p);
    
    // let cylinderPtLogarithmic = logarithmicCylinderFromCone(x,y, alpha, p);
    // this.cylinderX = cylinderPt[0];
    // this.cylinderY = cylinderPt[1];
    // this.cylWidth = transformConeToCylinder(x+radius, y, alpha, rMeridian,p)[0]-this.cylinderX;
    // this.cylHeight = transformConeToCylinder(x, y+radius, alpha, rMeridian,p)[1]-this.cylinderY;
    // this.logCylX = cylinderPtLogarithmic[0];
    // this.logCylY = cylinderPtLogarithmic[1];
    // this.cylinderPoints = transformCircle(x,y,radius, alpha, rMeridian, 10,p);
    // this.cylPtsLog = transformCircleLogarithmic(x,y,radius, alpha, 10, p)
    //this.pathSVG = polygonSVG(this.cylinderPoints)
  }

  /*Draws the Disk.
  @param fillColor: the color of the disk [r,g,b,a]
  @param strokeColor: the color of the disk outline [r,g,b,a]*/
  displayDisk(fillColor = [200], strokeColor = [0], p) {
    if (!p) {
      p = this.p
    }
    p.fill(fillColor);
    p.stroke(strokeColor);
    p.strokeWeight(this.radius*0.1);
    p.ellipse(this.x, this.y, this.radius*2, this.radius*2);
    }
  
  displayDiskCylinder(fillColor = [200], strokeColor = [0], alpha, rMeridian, mode, p) {
    if (!p) {
      p = this.p
    }
    if (mode=="log") {
      drawPolygon(this.cylPtsLog, p, fillColor, strokeColor, 0.1* this.radius) 
    } else if(mode == "circle" || mode == "ellipse") {
      
      let width = this.cylWidth * 2
      let height = this.cylHeight * 2
      if (mode == "circle") {
        width = p.min(width, height)
        height = width
      }
      p.fill(fillColor);
      p.stroke(strokeColor);
      p.strokeWeight(this.radius*0.1);
      p.ellipse(this.cylinderX, this.cylinderY, width, height);
    } else {
      drawPolygon(this.cylinderPoints, p, fillColor, strokeColor, 0.1* this.radius)
    }
    
  }

  displayDiskCylinderLogarithmic(fillColor = [200], strokeColor = [0]) {
    drawPolygon(this.cylPtsLog, p, fillColor, strokeColor, 0.1* this.radius) 
  }

  

  /*Draws the Disk text. Is a separate method because of how we use transforms in stackingCone.
  @param color: the color of the text [r,g,b,a]*/
  displayDiskText(color = [0],p) {
    if (!p) {
      p = this.p
    }
    p.fill(color);
    //this.p.fill(0);
    p.textSize(this.radius*0.8);
    p.textAlign(this.p.CENTER,this.p.CENTER);
    p.noStroke();
    p.text(this.id, 0, 0);
  }

  /*Compares whether two disks are the same.
  @param disk1, disk2: the two disks to compare
  @return T/F: whether the disks are "equivalent". Considered equivalent if id is the same or if they share all other info.*/
  static isEqual(disk1, disk2) {
    return (disk1.x == disk2.x && disk2.y == disk.y && disk1.radius == disk2.radius) || disk1.id == disk2.id;
  }

  /*Compares whether this instance of a disk is equivalent to another.
  @param disk: the disk to compare this instance to
  @return T/F: whether the disks are "equivalent". Considered equivalent if id is the same or if they share all other info.*/
  equals(disk) {
    return (this.x == disk.x && this.y == disk.y && this.radius == disk.radius) || this.id == disk.id;
  }
}

