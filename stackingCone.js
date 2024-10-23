/********************************************
SURF 2022
Copyright (c) 2022 Elaine Demetrion, Lisa Cao
Licensed under the MIT license: http://www.opensource.org/licenses/mit-license.php 
********************************************/

/********************************************
SURF 2023
Copyright (c) 2023 Emi Neuwalder
Licensed under the MIT license: http://www.opensource.org/licenses/mit-license.php 
********************************************/

/**
Note:
* rotateOntoCone makes some assumptions that could be problematic with larger angles
*/

/**This class represents the Cone, which controls the disk stacking. It contains methods related to disk stacking calculations and tasks.*/

class StackingCone {
  /* Constructor for the cone
  @param p: the namespace in which the cone exists. Used for p5 instance mode.
  @param vertexX, vertexY: the x and y values for the vertex; the vertex angle in degrees
  @param angle: the angle of the vertex
  @param diskRadius: the radius of all the disks on the cone
  @param height: a float in range [0,1]. How high the first disk should be (relative)
  @param rMeridian: a float in range (0,2] representing the radius to remain constant in the transformation to a cylinder
  @param options: an object that can be used to pass additional parameters in, mainly upPara and downPara for the initial fron up and down parastichy numbers, and drawingMode--a string corresponding to the mode in which the transformed cylinder is being drawn. drawingMode can be "log", "circle", "ellipse", or "fixedCircle" -- anything else results in the default. 
  */
  constructor(p, vertexX, vertexY, angle, diskRadius, height = 0.9, rMeridian, options) {
    this.p = p;
    this.vertexX = vertexX;
    this.vertexY = vertexY;
    this.diskRadius = diskRadius;
    this.drawingMode = options.drawingMode;
    this.reset(angle, height, rMeridian, options.upPara, options.downPara);   
    //ID range to replace disks with circles
    this.minCircles = options.minCircles
    this.maxCircles = options.maxCircles
    this.displayRadius = diskRadius
    this.scaler = this.p.width
    this.scale = 1
  }

  /*Resets the cone with the given parameters. Assumes same disk radius and location.
  @param angle
  @param height*/
  reset(angle = 50, height = 0.9, rMeridian = 0.8, upPara, downPara) {
    this.normal = false;
    this.angle = angle;
    this.rMeridian = rMeridian;
    this.maxHeight = 1
    this.upPara = upPara;
    this.downPara = downPara;
    this.diskNumber = 0; //used as a tag to identify unique disks between different lists of disks.
    
    this.disks = []; //contains actual disk instances
    this.front = []; //the disks in the front

    this.upFrontData = [];
    this.downFrontData = [];
    
    //these will be used in several functions, and will contain extended versions of the front and disks. (ie, versions where disks have been rotated to make the front seem longer)
    this.customFrontWindow = [];

    //rotated "duplicates" of disks in this.disks, drawn to help visualize the cone more
    this.extraDisks = [];

    //this will become a list of possible child disks for the next iteration. It will be updated each iteration in ignoreOverlappingCandidates() and deleteOverlappingCandidates().
    this.candidates = [];

    //contains the index in this.front[] of the most recent disk added
    this.mostRecentFrontDiskIndex;
    
    this.height = height
    this.frontDisks = [];
    if (this.upPara && this.downPara) {
      let min_r = this.minRadius()
      this.p.print("minRadius complete?")
      let max_r;
      try {
        max_r = this.maxRadius()
        if (max_r < min_r) {
          throw "Maximum viable radius less than minimum viable radius."
        }
      } catch (error) {
        document.getElementById("errorMessages").innerHTML = "Program encountered an error calculating the maximum radius for the given parameters. Error message: '" + error + "' Now displaying default parastichy numbers (1,1). Please change the parameters."
        document.getElementById("errorMessagesDiv").style.display = "block"
        this.upPara = false;
        this.downPara = false;
        this.placeFirstDisk(height);
        //add extra disks for the visual
        this.updateExtraDisks();
        return
      }
      
      this.p.print("maxRadius complete?")
      this.diskRadiusFront = min_r + this.height * (max_r - min_r)
      let conelattice;
      try {
        conelattice = new ConeLattice(this.upPara,this.downPara,this.angle, this.diskRadiusFront,0,this.p, this.diskRadius);
      } catch (error) {
        document.getElementById("errorMessages").innerHTML = "Program encountered an error calculating the cone lattice front for the given parameters. Error message: " + error + "Now displaying default parastichy numbers (1,1). Please change the parameters."
        document.getElementById("errorMessagesDiv").style.display = "block"
        this.placeFirstDisk(height);
        //add extra disks for the visual
        this.updateExtraDisks();
        return
      }
      
      let front = conelattice.pts
      this.firstFrontID = conelattice.frt
      this.firstCandidates = conelattice.cand
      this.min_para_ids = conelattice.parastichy_ids
      this.conelattice = conelattice
      this.p.angleMode(this.p.DEGREES)
      let h = (1/this.p.tan(this.angle/2))/2*this.diskRadius/this.diskRadiusFront
      h = conelattice.h
      this.firstCandidates = this.firstCandidates.map(function(a){
        return [a[0], a[1]+h, a[2], a[3]]
      })
      for (let i = 0; i < front.length; i ++) {
        this.frontDisks.push(new Disk(this.p,front[i][0], (front[i][1]+h), this.diskRadius, i, this.angle/2, this.rMeridian))
        this.diskNumber ++;
      }
      
      this.placeFirstDisks();
    } 
    else {
      this.placeFirstDisk(height);

      //add extra disks for the visual
      this.updateExtraDisks();
    }
  }

  maxRadius() {
    this.p.print("starting max radius calculations")
    let testConeLattice;
    try {
      testConeLattice = new ConeLattice(this.upPara,this.downPara,this.angle, this.minRadius()+0.001,0,this.p, this.diskRadius);//generate a cone lattice with a radius just greater than the minimum radius and thus almost certainly an allowed radius. This will let us figure out the up and down parastichy ordering. Except for n = m this actually isn't guaranteed to be the same ordering as it will be for increased radii but that's a problem for the future 
    } catch (error) {
      this.p.print(error)
      this.p.print("testconelattice issue")
    }
    
    
    let lowest_angle = testConeLattice.parastichy_ids;
    this.p.angleMode(this.p.RADIANS)
    let m = this.p.min(this.upPara, this.downPara)
    let n = this.p.max(this.upPara, this.downPara)
    let p = this.p
    let c = this.angle * p.PI/180
    var u = lowest_angle[0];// up vector
    var v = lowest_angle[1]; // down vector
    if (this.upPara < this.downPara) {
      // if there are more down vectors than up vectors, then n corresponds to down vectors, so u corresponds to n corresponds to down vectors, so switch u,v
      u = lowest_angle[1];
      v = lowest_angle[0];
    }
    
    let angle_u = c*(u-1)/(n)
    let angle_v = c*(v-1)/(m)

    // if u or v negative, they correspond to a rotated disk
    if (u < 0) {
      if (u == lowest_angle[0]) {
        angle_u = c*(-u-1)/n - c
        this.p.print("case 1")
      } else { 
        angle_u = c*(-u-1)/n + c
        this.p.print("case 2")
      }
    }
    if (v < 0) {
      if (v == lowest_angle[0]) {
        angle_v = c*(-v-1)/m - c
        this.p.print("case 3")
      } else { 
        angle_v = c*(-v-1)/m + c
        this.p.print("case 4")
      }
    }
    this.p.print("case 0")
    // arbitrary variables used in simplifying. 
    let j = p.sin(c/2)/p.sin(c/(2*n))
    let k = p.sin(c/2)/p.sin(c/(2*m))
    let K = p.PI-(1*p.PI/3) + angle_u + angle_v - c*(n-1)/(2*n) - c*(m-1)/(2*m)
    let max_r = 0.5*p.sqrt(1/(j**2+k**2+2*k*j*p.cos(K)))

    this.p.print("ended max radius calculations")
    let rotated_angle = c/2
    rotated_angle = 0
    let sine_quantity = p.cos(p.PI/2 - rotated_angle -((c*(m-1))/(2*m)))*k
    let max_r_2 = (sine_quantity - ((sine_quantity)**2-(k**2-j**2))**0.5)/(2*(k**2-j**2))
    this.p.print(max_r_2)
    if (!max_r_2 || true) {
      return max_r
    }
    this.p.print("ended max radius 2 calculations")
    return p.min(max_r,max_r_2)
  }
  
  /** minim viable disk radius based on angle, up parastichies and down parastichies */
  minRadius() {
    this.p.angleMode(this.p.RADIANS);
    let c = this.angle * this.p.PI / 180;
    let mn = this.upPara + this.downPara;
    let r_min = this.p.sin(c/(2*mn))/(2*this.p.sin(c/2));
    return r_min;
  }
  
  /*Set up the first default disk and the first index, then 
   add them to the disk array and front array.
  @param height: number in range [0,1]. How high should the first disk be placed, 0 being as low as it can be and 1 being as high as it can be.*/
  placeFirstDisk(height = 0) { 
    this.p.angleMode(this.p.DEGREES);

    //place the first disk on the left side of the cone, at the appropriate height
    let initialHeight = (1+height)*this.diskRadius/this.p.sin(this.angle/2);
    let theta = (180 - this.angle)/2;
    let firstdisk = new Disk(this.p, initialHeight * -this.p.cos(theta), initialHeight * this.p.sin(theta),this.diskRadius, -1, this.angle/2, this.rMeridian);

    //set all the variables that are dependent on the first disk
    this.assignNextDiskID(firstdisk);
    this.disks.push(firstdisk);
    this.front.push(firstdisk);
    this.mostRecentFrontDiskIndex = 0;

    this.updateFrontData();
   
  }

  placeFirstDisks() {
    //let orderedDisks = this.frontDisks.sort(function(diska,diskb) {return diska.x-diskb.x})
    //let frontDisksOrdered = this.frontDisks.sort(function(a,b){return a[0] - b[0];}).map(function(a,id){return [a[0],a[1],id]}).frontDisks.sort(function(a,b){return a[1] - b[1];})
    for (let i = 0; i < this.frontDisks.length; i++){
      let firstdisk = this.frontDisks[i];
     ///this.assignNextDiskID(firstdisk);
    this.disks.push(firstdisk);
    let ind = this.firstFrontID[i]-1
    this.front.push(this.frontDisks[ind]);
    this.mostRecentFrontDiskIndex = ind;
      this.updateFrontData();
      
    }
    this.updateExtraDisks();
  }

  /**************************************************/
  /*            FUNCTIONS LEVEL 1                   */
  /* Used directly for nextDiskStackingIteration()  */
  /*************************************************/
  
  /*Using the current front, this method finds and adds the next child disk in the proper (lowest) location, and updates the front[].*/
  nextDiskStackingIteration() {
    
    //determine child disk candidates
    this.determineChildCandidates();
    
    //find lowest candidate. lowestCandidate = [disk, parent1 ID, parent2 ID]
    let lowestCandidate = this.findLowestCandidate();
    
    //give it an id
    this.assignNextDiskID(lowestCandidate);
    
    //add lowest candidate to disks[]
    this.disks.push(lowestCandidate);

    //Determine the child's "actual" parents. (The disks touching the child that are farthest apart.)
    if (!lowestCandidate.parents[0]){
      lowestCandidate.parents = this.findParents(lowestCandidate);
    
    }
    let parent1ID = lowestCandidate.parents[0].id;
    let parent2ID = lowestCandidate.parents[1].id;
    //print("\nChild " + lowestCandidate.id + " at " + lowestCandidate.x + ", " + lowestCandidate.y);
    //print("  left parent: " + parent1ID);
    //print("  right parent: " + parent2ID);
    //print("******************************");
    //In front[], delete disks between parents of the lowest disk.
    this.deleteDisksBetweenParents(parent1ID, parent2ID);
    //In front[], insert the child disk in the proper location (probably between the parents but there could be exceptions)
    this.mostRecentFrontDiskIndex = this.insertChildIntoFront(parent1ID, parent2ID, lowestCandidate);

    //add extra disks for the visual
    this.updateExtraDisks();

    //update front data
    this.updateFrontData();
    let mostRecentDisk = this.disks[this.disks.length-1]
    let mostRecentHeight = (mostRecentDisk.x**2 + mostRecentDisk.y**2)**0.5
    this.maxHeight = this.p.max(1,0.9*(mostRecentHeight-this.vertexY))
  }

  /*Using the current front, this method determines all the locations where a child disk could be placed. Updates the array of candidates. Should account for rotation. */
  determineChildCandidates() {
    if (this.disks.length != 1 && this.disks.length == this.upPara + this.downPara) {
      // for (let i = 0; i<this.firstCandidates.length; i++) {
      //   let currCand = this.firstCandidates[i]
      //   let currDisk = new Disk(this.p, currCand[0], currCand[1], this.diskRadius, -1,this.angle/2, this.rMeridian);
      //   currDisk.parents[0] = this.disks[currCand[2] -1]
      //   currDisk.parents[1] = this.disks[currCand[3]-1]
      //   this.candidates.push(currDisk)
      // }
      // return
      for (let i = 0; i < this.disks.length; i++) {
        this.candidatesIgnoreOverlap(i)
      }
    } else {
      //update the array of child candidates, but they might overlap
      this.candidatesIgnoreOverlap();
    }
    

    //for each candidate, make sure it's not overlapping with other disks in the front
    this.deleteOverlappingCandidates();

    
    //rotate all candidates back onto the cone
    this.rotateOntoCone();
    
  }

  /*Updates the list of candidates, but does not check for overlap.*/
  /* For the general front, we will check candidates for each disk in the front, providing a diskId for each disk. If diskId is not provided, it will check the most recent disk in the front. */
  candidatesIgnoreOverlap(diskId) {
    
    //this.candidates = []; //an empty array to be filled with possible child candidates
    
    //generate extended front, where we rotate disks from the left until they reach more than 4r x units away from the rightmost disk
    this.generateCustomFrontWindow(diskId);

    //generate two versions of the most recent disk: it in its current place, and it rotated right
    let mostRecentDisk = this.disks[this.disks.length - 1];
    if (diskId) {
      mostRecentDisk = this.disks[diskId]
    }
    //check for children with each disk in customFrontWindow
    for(let customFrontWindowIndex = 0; customFrontWindowIndex < this.customFrontWindow.length; customFrontWindowIndex ++) {
      
      let diskToCheck = this.customFrontWindow[customFrontWindowIndex]; //the disk we're checking
      // this.p.print("Checking for children of disks " + mostRecentDisk.id + " and " + diskToCheck.id + ", which is at " + diskToCheck.x + "," + diskToCheck.y);
      
      //check for potential child with a disk in the customFrontWindow
      let potentialChild = this.childDisk(mostRecentDisk, diskToCheck);

      if(potentialChild != null) {
        this.candidates.push(potentialChild);
      }
    }
  }
 
  /*Given a list of candidates, this method deletes candidates that overlap with other disks. No return value; the original array that was passed in is altered.
  @param candidates: the array of candidates*/
  deleteOverlappingCandidates() {
    let disksStartIndex = this.disks.length - this.front.length*2;
    if(disksStartIndex < 0) {disksStartIndex = 0;}

    //only need to check a subset of all of the disks -- the most recent few rows
    let disksToCheck = this.disks.slice(disksStartIndex);
    
    for (let candidateIndex = this.candidates.length - 1; candidateIndex >= 0; candidateIndex --) {
      let candidateToCheck = this.candidates[candidateIndex];
      let hasOverlap = false;

      for (let diskToCheck of disksToCheck) {
        if(this.isOverlap(diskToCheck, candidateToCheck)) {
          hasOverlap = true;
          break;
        }
      }
      if(hasOverlap) {
        this.candidates.splice(candidateIndex, 1);
      }
      
    }
  }
  
  /*Given an array of disks, this method returns an array of disks such that all of them are properly located within the cone (fundamental domain).
  @param candidates: an array of candidates to get rotated. Remember, candidates come in an array like this: [[disk, parent1 id, parent2 id], ...]
  @return rotatedDisks: an array with copies of the disks which has now been rotated 
NOTE: assumes that disks left of cone were rotated one period LEFT and disks on right were rotated on period RIGHT. Could cause problems with larger cone angles.*/
  rotateOntoCone() {
    let rotatedDisks = [];

    for (let disk of this.candidates) {
      let rotatedDisk = disk;
      while(this.isOffCone(rotatedDisk)) {
        rotatedDisk = this.rotatedDisk(rotatedDisk);
      }
      rotatedDisks.push(rotatedDisk);
    }

    this.candidates = rotatedDisks;
  }
    
  
  /*Given a list of child candidates, this method determines the lowest candidate and returns its index.
  @param candidates: the array of arrays containing candidate children. [[candidate, parent1 id, parent2 id], ...]
  @return the index of the lowest child disk.*/
  findLowestCandidate() {
    if (this.candidates.length == 0) {
      throw "no candidates"
    }
    let lowestDisk = this.candidates[0];
    let smallestDist = this.distanceToVertex(lowestDisk);

    for (let disk of this.candidates) {
      let newDist = this.distanceToVertex(disk);
      if(newDist < smallestDist){
        smallestDist = newDist;
        lowestDisk = disk;
      }
    }

    return lowestDisk;
  }

  /*Given the child disk, determine which disks in the front *should* be the parent disks.
  @param child: the child Disk
  @return [parent1, parent2]: the parent Disks*/
  findParents(child) {
    
    let disksTouchingLeft = [];
    let disksTouchingRight = [];

    //make list of disks touching child on left and on right
    for (let disk of this.front) {
      
      let diskThatTouchesLeft = this.touchesLeft(child, disk);
      if(diskThatTouchesLeft != null) {
        disksTouchingLeft.push(diskThatTouchesLeft);
      }
      
      let diskThatTouchesRight = this.touchesRight(child, disk);
      if(diskThatTouchesRight != null) { 
        disksTouchingRight.push(diskThatTouchesRight);
      }
    }

    //grab the leftmost disk from the left list, and rightmost disk from the right list
    let maxAngularDistLeft = -1;
    let farthestLeftDisk = disksTouchingLeft[0];
    for(let disk of disksTouchingLeft) {
      if(this.diskDistanceMetric1(child, disk) > maxAngularDistLeft) {
        
        maxAngularDistLeft = this.diskDistanceMetric1(child, disk);
        farthestLeftDisk = disk;
      }
    }

    let maxAngularDistRight = -1;
    let farthestRightDisk = disksTouchingRight[0];
    for(let disk of disksTouchingRight) {
      if(this.diskDistanceMetric1(child, disk) > maxAngularDistRight) {
        
        maxAngularDistRight = this.diskDistanceMetric1(child, disk);
        farthestRightDisk = disk;
      }
    }

    return [farthestLeftDisk, farthestRightDisk];
  }

  /*Given the IDs of the parents, this method deletes the disks in the front between the two parents.
  @param parent1ID, parent2ID: the indices of the parents' ids. Parents must be entered in order (parent1 = left, parent2 = right) */
  deleteDisksBetweenParents(parent1ID, parent2ID) {
    let parent1Index = this.findIndexWithID(this.front, parent1ID);
    let parent2Index = this.findIndexWithID(this.front, parent2ID);
    //edge case: parent1ID = parent2ID. Delete everything other than the parent
    if(parent1ID == parent2ID) {
      this.front = [this.front[parent1Index]];
    }

    //normal case: parent1Index < parent2Index. Remove elements between those two indices.
    else if(parent1Index < parent2Index) {
      this.front.splice(parent1Index + 1, parent2Index - parent1Index - 1);
    }
    //parent1Index is at the end of the array, and parent2Index is at the beginning. Remove elements after parent1 and before parent2. In other words, only keep the values between the parents, including the parents.
    else {
      this.front = this.front.splice(parent2Index, parent1Index - parent2Index + 1);
    }
  }

  /*Given the ids of the parents and the new child Disk, this method finds the correct spot in front[] and inserts the child Disk there.
  @param parent1ID, parent2ID: the ids of the parent disks. parent1 is left, parent2 is right.
  @param child: the child Disk
  @return the index the child was added at*/
  insertChildIntoFront(parent1ID, parent2ID, child) {
    let parent1Index = this.findIndexWithID(this.front, parent1ID);
    let parent2Index = this.findIndexWithID(this.front, parent2ID);
    
    //Case 1 (could happen with first few fronts): parent1 and parent2 are the same. Determine which side of parent the child is on; add on that side.
    if(parent1ID == parent2ID) {
      let vertexToChild = this.vertexToDisk(child);
      let vertexToParent = this.vertexToDisk(this.front[parent1Index]);

      //if the child is right of the parent
      if(vertexToParent.angleBetween(vertexToChild) < 0) {
        this.front.splice(parent1Index + 1, 0, child);
        return parent1Index + 1;
      } 
      //if the child is left of the parent
      else {
        this.front.splice(parent1Index, 0, child);
        return parent1Index;
      }

    }
    
    //Case 2 (most common): parent1 and parent2 are in the middle of the front, right next to each other. Insert child in between.
    if(parent2Index == parent1Index + 1) {
      this.front.splice(parent2Index, 0, child);
      return parent2Index;
    }
    
    //Case 3: parent 1 is the last element, and parent2 is the first. Determine which one the child is closer to. Insert child there.
    let distChildToParent1 = this.distanceBtwnDisks(child, this.front[parent1Index]);
    let distChildToParent2 = this.distanceBtwnDisks(child, this.front[parent2Index]);
    if(distChildToParent1 < distChildToParent2) {
      //insert child after parent 1
      this.front.splice(parent1Index + 1, 0, child);
      return parent1Index + 1;
    } else {
      //insert child before parent 2.
      this.front.splice(parent2Index, 0, child);
      return parent2Index;
    }
  }

  /*Ensures that there is a rotated version of the first, second, and second last, and last disk in the current front are drawn on the screen.*/
  updateExtraDisks() {
    let frontIndicesToCheck = [0, 1, this.front.length-2, this.front.length-1];
    
    for(let index of frontIndicesToCheck) {
      
      //make sure that front[] has that index
      if(index > this.front.length-1 || index < 0) {continue;}
      
      //check if the disk at that index is in extraDisks. If not, add it.
      let indexInExtraDisks = this.findIndexWithID(this.extraDisks, this.front[index].id);
      if(indexInExtraDisks == null) {
        this.extraDisks.push(this.rotatedDisk(this.front[index]));
      }
    }

  }

  /*Updates the array containing front data.*/
  updateFrontData() {

    let numUpSegments = 0;
    let numDownSegments = 0;

    //check most of the fronts
    for(let index = 0; index < this.front.length - 1; index ++) {
      let disk1 = this.front[index];
      let disk2 = this.front[index + 1];

      //determine if the connection is up or down
      if(this.isUpSegment(disk1, disk2)) {
        numUpSegments ++;
      }
      else {
        numDownSegments ++;
      }
    }

    //check the last one
    let rotatedFirstDisk = this.rotateRight(this.front[0]);
    let lastDisk = this.front[this.front.length-1];
    if(this.areTouching(rotatedFirstDisk, lastDisk)) {
      //different color for up/down segments
      if(this.isUpSegment(lastDisk, rotatedFirstDisk)) {
        numUpSegments ++;
      }
      else {
        numDownSegments ++;
      }
    }

    this.upFrontData.push(numUpSegments);
    this.downFrontData.push(numDownSegments);
  }
  /**************************************************/
  /*            FUNCTIONS LEVEL 2                   */
  /**************************************************/
  
  /*Creates an "extended" front where some disks from the left are copied and rotated rightward. It updates this.customFrontWindow(). Assumes that we only care about whether a disk is 1 away from the most recently added front disk.*/
  generateCustomFrontWindow(diskId) {
    let mostRecentFrontDisk = this.front[this.mostRecentFrontDiskIndex]; //most recent disk added to front
    if(diskId) {
      mostRecentFrontDisk = this.disks[diskId]
    }
    this.customFrontWindow = [];
    
    let diskDistance; //represents the number of disks that could fit between rightmostFrontDisk and another disk in the front.

    //generate extended front backward
    let leftIndex = this.mostRecentFrontDiskIndex;
    if (diskId) {
      leftIndex = this.findIndexWithID(this.front,diskId)
    }
    let nextLeftDisk;
    while(true) {
      //figure out what the next left disk should be (either the next index down, or a rotated version of some disk)
      if(leftIndex >= 0) {
        nextLeftDisk = this.front[leftIndex];
      } 
      else if(leftIndex < 0 && this.front.length + leftIndex >= 0) 
      {
        nextLeftDisk = this.rotateLeft(this.front[this.front.length + leftIndex]);
      } else {
        break;
      }

      diskDistance = this.minDiskDistance(mostRecentFrontDisk, nextLeftDisk);
      //if the disks are too far apart, end the while loop
      if(diskDistance > 1) {
        break;
      }
      else {
        this.customFrontWindow.push(nextLeftDisk);
        leftIndex --;
      }
    }
    
    //reverse elements in customFrontWindow
    this.customFrontWindow.reverse();

    //generate extended front forward
    let rightIndex = this.mostRecentFrontDiskIndex + 1;
    if (diskId) {
      leftIndex = this.findIndexWithID(this.front,diskId) +1;
    }
    let nextRightDisk;
    while(true) {
      if(rightIndex < this.front.length) {
        nextRightDisk = this.front[rightIndex];
      }
      else if(rightIndex >= this.front.length && rightIndex - this.front.length < this.front.length) {
        nextRightDisk = this.rotateRight(this.front[rightIndex - this.front.length]);
      }
      else {
        break;
      }

      diskDistance = this.minDiskDistance(mostRecentFrontDisk, nextRightDisk);
      //if the disks are too far apart, end the while loop
      if(diskDistance > 1) {
        break;
      }
      else {
        this.customFrontWindow.push(nextRightDisk);
        rightIndex ++;
      }
    }
  }

  
  /*Finds the location of a child Disk given two parents. Does not check for overlap. Assumes all disks have same radius. Does not account for rotation.
  @param parent1, parent2: two disks that could be parents
  @return: the child disk OR null if no such child exists.*/
  childDisk(parent1, parent2) {
    //this.p.print("\nLooking for child of " + parent1.id + "," + parent2.id);
    //determine the distance between the disks
    let distBtwnParents = this.distanceBtwnDisks(parent1, parent2);

    //check if parent disks are too far apart. If so, return null
    if(distBtwnParents > this.diskRadius*4){
      //print("--too far, returning null");
      return null;
    }

    //determine the child's position, using simplifying assumptions about radii and angles
    let vectorP1ToP2 = this.p.createVector(parent2.x-parent1.x, parent2.y-parent1.y); //vector pointing in direction of parent2, if placed at parent1
    let normalVector = this.p.createVector(-vectorP1ToP2.y, vectorP1ToP2.x).normalize(); //vector that is normal to vectorP1ToP2
    let scaledNormalVector = normalVector.mult(0.5 * this.p.sqrt((16*this.diskRadius*this.diskRadius) - (distBtwnParents*distBtwnParents))); //scale normalVector so when added to point halfway between parent1 and parent2, final vector is position of a child disk
    let halfwayPoint = this.p.createVector( (parent1.x+parent2.x)/2, (parent1.y+parent2.y)/2);

    //two possibilities for children
    let childLocation1 = p5.Vector.add(scaledNormalVector, halfwayPoint);
    let childLocation2 = p5.Vector.add(scaledNormalVector.mult(-1), halfwayPoint);
    //this.p.print("  child at " + childLocation1.x + ","+childLocation1.y + " and " + childLocation2.x + ","+childLocation2.y);
    let child;
    //return the highest child
    if(this.distanceToVertex(childLocation1) > this.distanceToVertex(childLocation2)) {
      child = new Disk(this.p, childLocation1.x, childLocation1.y, this.diskRadius, -1,this.angle/2, this.rMeridian);
    } else {
      child = new Disk(this.p, childLocation2.x, childLocation2.y, this.diskRadius, -1, this.angle/2, this.rMeridian);
    }

    //run opposedness test (ie, is the child actually "between" the two parents)
    if(!this.isBetweenParents(child, parent1, parent2)) {
      //print("child is not between parents, returning null");
      return null;
    }
    //this.p.print("  Highest child at " + child.x + ", " + child.y);
    //finally, return the child disk
    return child;
  }

  /*Test whether a child is situated between its two parents. Does not account for rotation.
  @param child: the child Disk
  @param parent1, parent2: the two parent Disks
  @return true/false: whether the child is actually between both parents.*/
  isBetweenParents(child, parent1, parent2) {
    let unitXVector = this.p.createVector(1, 0);

    //create vectors pointing from cone vertex to child/parents
    let childVector = this.vertexToDisk(child);
    let parent1Vector = this.vertexToDisk(parent1);
    let parent2Vector = this.vertexToDisk(parent2);

    //calculate child and parent angles compared to the x axis
    let childAngle = childVector.angleBetween(unitXVector);
    let parent1Angle = parent1Vector.angleBetween(unitXVector);
    let parent2Angle = parent2Vector.angleBetween(unitXVector);

    //check if the child angle is between the two parent angles
    if(childAngle > this.p.min(parent1Angle, parent2Angle) && childAngle < this.p.max(parent1Angle, parent2Angle)) {
      return true;
    }
    //edge case where, say, parent1Angle = -3pi/4, parent2Angle = 3pi/4, childAngle = pi.
    else if( (this.p.min(parent1Angle,parent2Angle) < 0 && this.p.max(parent1Angle,parent2Angle) > 0) && (childAngle > this.p.max(parent1Angle, parent2Angle) || childAngle < this.p.min(parent1Angle, parent2Angle))) {
      return true;
    }
    else{
      return false;
    }
  }
  

  /****** OVERLAP/OFF CONE FUNCTIONS **************/
  
  /*test if there is an overlap between disks. Accounts for rotation.
  @param disk1 disk2: two disks
  @return true if there is an overlap, false if no 
  overlap*/
  isOverlap(disk1,disk2){ 
    let tolerance = 10**(-3); //account for rounding and such
    
    if (this.minDistanceBtwnDisks(disk1, disk2) < 2*this.diskRadius - tolerance) {
      
      return true;
    }
    else {
      return false;
    } 
    }

  /*Determines whether a disk's center will be drawn off the cone.
  @param disk: the disk to check
  @return T/F: whether the disk is off the cone or not*/
  isOffCone(disk) {
    let tolerance = 10**(-3);
    //first, check if it's below the cone somehow
    if(disk.y < 0) {
      return true;
    }
    
    //create a vector pointing to disk if positioned at cone vertex
    let vertexToDisk = this.vertexToDisk(disk);
    
    let angleBtwnSideAndDisk;
    this.p.angleMode(this.p.DEGREES);
    
    //if on left side, check if over left
    if(disk.x < 0) {
      let leftConeSide = this.p.createVector(-this.p.cos(90-this.angle/2), this.p.sin(90-this.angle/2));
      angleBtwnSideAndDisk = vertexToDisk.angleBetween(leftConeSide);
    }
    //if on right side, check if over right
    else {
      let rightConeSide = this.p.createVector(this.p.cos(90-this.angle/2), this.p.sin(90-this.angle/2));
      angleBtwnSideAndDisk = rightConeSide.angleBetween(vertexToDisk);
    }

    //the disk is "off" the cone if angleBtwnSideAndDisk > 0 (just because of how angleBtwnSideAndDisk was calculated)
    if(angleBtwnSideAndDisk < 0 - tolerance) {
      return true;
    }
    return false;
  }

  
  /*Tests whether two disks are touching at all. Does not account for rotation.
  @param disk1, disk2: this disks to check
  @return T/F: whether the two disks are touching*/
  areTouching(disk1, disk2) {
    let tolerance = 10**(-3);
    return this.distanceBtwnDisks(disk1, disk2) < 2*this.diskRadius + tolerance;
  }
  
  /*Tests whether the diskToCheck touches the disk on the left side. Accounts for rotation. Returns the version of diskToCheck which touches the left side.
  @param disk: the disk
  @param diskToCheck: we want to check if this disk touches "disk" on "disk's" left side.
  @return: the rotated version of the disk that touches the left side, or null if it doesn't touch the left side*/
  touchesLeft(disk, diskToCheck) {
    let tolerance = 10**(-3);
    //check nonrotated disk
    if(this.isLeftOf(disk, diskToCheck) && this.distanceBtwnDisks(disk, diskToCheck) < 2*this.diskRadius + tolerance) {
      return diskToCheck;
    }
    
    //check rotated disk
    let rotatedDiskToCheck = this.rotateLeft(diskToCheck);
    if(this.isLeftOf(disk, rotatedDiskToCheck) && this.distanceBtwnDisks(disk, rotatedDiskToCheck) < 2*this.diskRadius + tolerance) {
      return rotatedDiskToCheck;
    }
    return null;
  }

  /*Tests whether the diskToCheck touches the disk on the right side. Accounts for rotation. Returns the version of diskToCheck which touches the right side.
  @param disk: the disk
  @param diskToCheck: we want to check if this disk touches "disk" on "disk's" right side.
  @return: the rotated version of the disk that touches the right side, or null if it doesn't touch the right side*/
  touchesRight(disk, diskToCheck) {
    let tolerance = 10**(-3);
    //check nonrotated disk
    if(this.isRightOf(disk, diskToCheck) && this.distanceBtwnDisks(disk, diskToCheck) < 2*this.diskRadius + tolerance) {
      return diskToCheck;
    }
    
    //check rotated disk
    let rotatedDiskToCheck = this.rotateRight(diskToCheck);
    if(this.isRightOf(disk, rotatedDiskToCheck) && this.distanceBtwnDisks(disk, rotatedDiskToCheck) < 2*this.diskRadius + tolerance) {
      return rotatedDiskToCheck;
    }

    return null;
  }
  
  /******** DISTANCE FUNCTIONS ********************/
  
  /*Used in generateCustomFront(). Determines the approximate number of disks that could fit between two given disks, using two different metrics, and returns the smallest result. It does not account for rotation because that could cause problems with small fronts.

* Metric 1: determines how many disks can fit between two given disks the SAME DISTANCE FROM THE CONE VERTEX as disk1. This metric is useful for determining when the *angle* between two disks in the custom front is too large to allow ANY disks at that angle to touch.
* Metric 2: determines how many disks can fit between the two given disks, positioned as they already are. This metric is useful for determining if you could actually create a disk between disk1 and disk2 that'd be tangent to both.

Returns whichever is smallest. Note that returning negative numbers implies overlap; -1 would mean complete overlap, -0.5 would be half overlap, etc. Also note that this method is really only intended to be used in generateCustomFront and related methods as a way to determine whether more disks should be added to the front.

  @param disk1: the disk we want the "angular" distance from.
  @param disk2: the other disk to compare
  @return the "angular" distance between the given disks*/
  minDiskDistance(disk1, disk2) {
    
    let numDisks1 = this.diskDistanceMetric1(disk1, disk2);
    let numDisks2 = this.diskDistanceMetric2(disk1, disk2);
    
    return this.p.min(numDisks1, numDisks2);
  }
  /*METRIC 1. See comments for minDiskDistance*/
  diskDistanceMetric1(disk1, disk2) {
    
    //angular distance
    let vertexToDisk1 = this.vertexToDisk(disk1);
    let vertexToDisk2 = this.vertexToDisk(disk2);
    let distToVertex = this.distanceToVertex(disk1); //Assumes we're using the first disk as the comparison

    //print("going to calculate angles");
    
    this.p.angleMode(this.p.RADIANS);
    let angleBetweenDisks = this.p.abs(vertexToDisk1.angleBetween(vertexToDisk2)); //angle between disk1 and disk2
    //print("angleBetweenDisks: " + angleBetweenDisks);

    let angleBtwnAdjacentDisks = this.p.abs(2*this.p.asin(this.diskRadius/distToVertex)); //the angle between two disks that are touching (both disks at same dist from vertex as disk1)
    let numDisks = angleBetweenDisks/angleBtwnAdjacentDisks - 1;

    return numDisks;
  }

  /*METRIC 2. See comments for minDiskDistance*/
  diskDistanceMetric2(disk1, disk2) {
    
    let distBtwnDisks = this.distanceBtwnDisks(disk1, disk2);
    let numDisks = distBtwnDisks / (2*this.diskRadius) - 1;

    return numDisks;
  }

   /*Finds the actual distance between two disks, accounting for rotation.
  @param disk1, disk2: the two Disks to find the distance between
  @return the distance between the disks*/
  minDistanceBtwnDisks(disk1, disk2) {
    let nonRotatedDistance = this.distanceBtwnDisks(disk1, disk2);
    let rotatedDisk2Pos = this.rotatedDisk(disk2);
    let rotatedDistance = this.distanceBtwnDisks(disk1, rotatedDisk2Pos);

    return this.p.min(nonRotatedDistance, rotatedDistance);
  }

  /*Finds the distance between two disks, NOT accounting for rotation.
  @param disk1, disk2: the two Disks to find the distance between
  @return the distance between the disks*/
  distanceBtwnDisks(disk1, disk2) {
    return this.p.dist(disk1.x, disk1.y, disk2.x, disk2.y);
  }

  /*Returns the distance of a disk to the cone's vertex
  @param disk: the Disk (or vector coordinates, both of which should have x and y attributes)
  @return the distance of the disk to the cone's vertex*/
  distanceToVertex(disk) {
    return this.p.dist(disk.x, disk.y, 0, 0);
  }

  /*Creates a vector from the cone's vertex to the given disk.
  @param disk: the Disk
  @return p5 Vector: a vector from the vertex to the disk */
  vertexToDisk(disk) {
    //create a vector pointing to disk if positioned at cone vertex
    return this.p.createVector(disk.x, disk.y);
  }

  /*Creates a vector from one disk to another.
  @param disk1: the start point.
  @param disk2: the end point.
  @return p5 Vector: a vector from disk1 to disk2*/
  diskToDisk(disk1, disk2) {
    return this.p.createVector(disk2.x - disk1.x, disk2.y - disk1.y);
  }
  
  

  /*Check if diskToCheck is left of disk. Does not account for rotation. 
  @param disk: the disk
  @param diskToCheck: the disk to check for rotation
  @return T/F: whether the disk is left of the diskToCheck*/
  isLeftOf(disk, diskToCheck) {
    let vertexToDisk = this.vertexToDisk(disk);
    let vertexToDiskToCheck = this.vertexToDisk(diskToCheck);
    if(vertexToDisk.angleBetween(vertexToDiskToCheck) > 0) {
      return true;
    }
    return false;
  }

  /*Check if diskToCheck is right of disk. Does not account for rotation.
  @param disk: the disk
  @param diskToCheck: the disk to check for rotation
  @return T/F: whether the disk is right of the diskToCheck*/
  isRightOf(disk, diskToCheck) {
    let vertexToDisk = this.vertexToDisk(disk);
    let vertexToDiskToCheck = this.vertexToDisk(diskToCheck);
    if(vertexToDisk.angleBetween(vertexToDiskToCheck) < 0) {
      return true;
    }
    return false;
  }
  
  /*********** ROTATION FUNCTIONS ******************/
  /*Returns the disk's equivalent location on the other side of the cone (due to rotation)
  @param disk: the Disk to rotate
  @return (Disk) a Disk in the equivalent position*/
  rotatedDisk(disk) {
    this.p.angleMode(this.p.DEGREES);
    //if on the right side of cone, rotate to left
    //TODO: fix this so it deals with angular stuff. Actually maybe this is always right?
    if(disk.x > 0) {
      return this.rotateLeft(disk);
    }
    //if on left side of cone, rotate all the way around, ending up on the right
    else {
      return this.rotateRight(disk);
    }
  }

  /*Generates a disk rotate to the right.
  @param disk: the disk to rotate
  @return a new rotated Disk*/
  rotateRight(disk) {
    let vertexToDisk = this.vertexToDisk(disk);
    this.p.angleMode(this.p.DEGREES);
    vertexToDisk.rotate(360-this.angle);
    return new Disk(this.p, vertexToDisk.x, vertexToDisk.y, this.diskRadius, disk.id,this.angle/2, this.rMeridian);
  }

  /*Generates a disk rotated to the left
  @param disk: the disk to rotate
  @return a new rotated Disk */
  rotateLeft(disk){
    let vertexToDisk = this.vertexToDisk(disk);
    this.p.angleMode(this.p.DEGREES);
    vertexToDisk.rotate(this.angle);
    return new Disk(this.p, vertexToDisk.x, vertexToDisk.y, this.diskRadius, disk.id,this.angle/2, this.rMeridian);
  }

  /************PARASTICHY FUNCTION *****************/
  /*Given two disks, this method determines if the line segment between them would be considered an "up" segment.
  @param leftDisk: the disk whose center is the left end of the segment.
  @param rightDisk: the disk whose center is the right end of the segment. */
  isUpSegment(leftDisk, rightDisk) {    
    //if dot product is positive, ...
    if(rightDisk.dist2 > leftDisk.dist2) {
      return true;
    }
    return false;
  }

  
  /************** ID FUNCTIONS *********************/
  /*This method searches an array of disks for a disk with a given id. It returns the index of the first disk in the array with that id, or null if the element doesn't exist.
  @param array: an array of disks to search
  @param id: the id to look for
  @return: the index of the first disk with the same id in the given array, OR null if no such disk was found.*/
  findIndexWithID(array, id) {    
    let found = false;
    let index = 0;
    
    while(!found && index < array.length) {
      //if we found the element with the right id, return index
      if(array[index].id == id) {
        return index;
      } 
      
      index ++;
    }

    //if we searched the whole array and didn't find anything, return null
    return null;
  }

  /*assigns the next disknumber to this disk
  @param disk: the disk to assign the next diskNumber id to.*/
  assignNextDiskID(disk) {
    disk.id = this.diskNumber;
    this.diskNumber ++;
  }

  getHeight() {
    let tallestDisk = this.disks[this.disks.length-1];
    return (tallestDisk.x **2 + tallestDisk.y **2)**0.5
  }

  /*************** DISPLAY FUNCTIONS ***************/
  /*Draws the cone*/
  display() {
    
    this.p.fill(0);
    this.p.angleMode(this.p.DEGREES);
    this.p.push();
    let length = 3*1/this.scale;
    this.createTransform(this.p);
    
    this.p.stroke(0)
    this.p.strokeWeight((5/(600**2))*this.scaler);
    this.p.line(0, 0, length*this.p.cos(90-this.angle/2), length*this.p.sin(90-this.angle/2));
    this.p.line(0, 0, -length*this.p.cos(90-this.angle/2), length*this.p.sin(90-this.angle/2));

    this.p.strokeWeight((4/(600**2))*this.scaler)
    this.p.stroke(0,0,255)
    this.p.noFill();
    if ( this.drawingMode != "log") {
      this.p.arc(0, 0, 2*this.rMeridian, 2*this.rMeridian, 0, 180);
    }
    let rotatedDisks = [];
    
    //draw disks
    for(let disk of this.extraDisks) {
      disk.displayDisk([240, 240, 240, 230], [200,200,200,230], this.p);
    }
    
    for (let disk of this.disks) {
      disk.displayDisk(180, [0,0,0,0],this.p); 
    }

    

    this.p.pop();

  }

  displayText() {
    this.p.push();
    this.createTransform(this.p);
    //add the text to the disks
    for(let disk of this.disks) {
      this.p.push();
      this.p.translate(disk.x, disk.y);
      this.p.scale(1,-1);
      disk.displayDiskText([0],this.p);
      this.p.pop();
    }

    for(let disk of this.extraDisks) {
      this.p.push();
      this.p.translate(disk.x, disk.y);
      this.p.scale(1,-1);
      disk.displayDiskText([200],this.p);
      this.p.pop();
    }
    this.p.pop();
  }

  displayCylinder() {
    let logarithmic = false;
    this.p.fill(0);
    this.p.angleMode(this.p.DEGREES);
    this.p.push();
    let length = 3;
    this.createTransformCylinder(this.p);
    
    this.p.strokeWeight((5/(600**2))*this.scaler);

    this.p.stroke(0)
    let alpha = this.angle /2;
    let relHeight = this.p.height/this.scaler


    if (this.drawingMode == "log"){
      this.p.line(0.5, this.vertexY, 0.5, relHeight*(1-this.vertexY)/this.scale);
      this.p.line(-0.5, this.vertexY, -0.5, relHeight*(1-this.vertexY)/this.scale);
    }
    else {
      this.p.line(-this.rMeridian*(alpha*this.p.PI/180), this.vertexY, -this.rMeridian*(alpha*this.p.PI/180), relHeight*(1-this.vertexY)/this.scale);
      this.p.line(this.rMeridian*(alpha*this.p.PI/180),this.vertexY, this.rMeridian*(alpha*this.p.PI/180), relHeight*(1-this.vertexY)/this.scale);
    }
  
    this.p.strokeWeight((4/(600**2))*this.scaler);
    this.p.stroke(0,0,255);
    if (this.drawingMode != "log") {
      this.p.line(-1/this.scale, this.rMeridian, 1/this.scale, this.rMeridian);
    }
    let rotatedDisks = [];

    this.p.push();
    if (this.drawingMode == "log"){
      this.createTransformLog()
    }
    //draw disks
    for(let disk of this.extraDisks) {
      let currDraw = this.drawingMode
      if ((this.drawingMode == "circle" || this.drawingMode == "fixedCircle") && (disk.id < this.minCircles || disk.id > this.maxCircles)) {
        currDraw = "";
      }
      if (true || this.drawingMode == "fixedCircle"){
        disk.radius = this.displayRadius
      }
      disk.displayDiskCylinder([240, 240, 240, 230], [200,200,200,230], this.angle, this.rMeridian,currDraw, this.p);
      disk.radius = this.diskRadius
      
    }
    
    for (let disk of this.disks) {
      let currDraw = this.drawingMode
      if ((this.drawingMode == "circle" || this.drawingMode == "fixedCircle") && (disk.id < this.minCircles || disk.id > this.maxCircles)) {
        currDraw = "";
      }
      if (this.drawingMode == "fixedCircle"){
        disk.radius = this.displayRadius
      }
      disk.displayDiskCylinder(180, [0,0,0,0], this.angle, this.rMeridian, currDraw, this.p);
      disk.radius = this.diskRadius
    }
    this.p.pop();
    this.p.pop();
  }

  displayTextCylinder() {
    this.p.push()
    this.createTransformCylinder(this.p);
    if (this.drawingMode == "log"){
      this.createTransformLog()
    }
    //add the text to the disks
    for(let disk of this.disks) {
      this.p.push();
      if (this.drawingMode == "log"){
        this.p.translate(disk.logCylX, disk.logCylY);
      } else {
        this.p.translate(disk.cylinderX, disk.cylinderY);
      }
      this.p.scale(1,-1);
      disk.displayDiskText([0],this.p);
      this.p.pop();
    }

    for(let disk of this.extraDisks) {
      this.p.push();
      if (this.drawingMode == "log"){
        this.p.translate(disk.logCylX, disk.logCylY);
      } else {
        this.p.translate(disk.cylinderX, disk.cylinderY);
      }
      this.p.scale(1,-1);
      disk.displayDiskText([200],this.p);
      this.p.pop();
    }
    this.p.pop()
  }
  //draw the front
  drawFront() {
    this.p.push();
    this.createTransform(this.p);
    //stroke(200, 0, 0);
    this.p.strokeWeight((5/(600**2))*this.scaler);
    
    //draw most fronts
    for(let index = 0; index < this.front.length - 1; index ++) {
      let disk1 = this.front[index];
      let disk2 = this.front[index + 1];

      //different color for up/down segments
      if(this.isUpSegment(disk1, disk2)) {
        this.p.stroke(200, 0, 0);
      }
      else {
        this.p.stroke(200, 255, 0);
      }
      
      this.p.line(disk1.x, disk1.y, disk2.x, disk2.y);
    }

    //draw the last front
    let rotatedFirstDisk = this.rotateRight(this.front[0]);
    let lastDisk = this.front[this.front.length-1];
    if(this.areTouching(rotatedFirstDisk, lastDisk)) {
      //different color for up/down segments
      if(this.isUpSegment(lastDisk, rotatedFirstDisk)) {
        this.p.stroke(200, 0, 0);
      }
      else {
        this.p.stroke(200, 255, 0);
      }
      this.p.line(rotatedFirstDisk.x, rotatedFirstDisk.y, lastDisk.x, lastDisk.y);
    }
    this.p.pop();
  }

  drawFrontCylinder() {
    this.p.push();
    this.createTransformCylinder(this.p);
    //stroke(200, 0, 0);
    this.p.strokeWeight((5/(600**2))*this.scaler);
    
    //draw most fronts
    for(let index = 0; index < this.front.length - 1; index ++) {
      let disk1 = this.front[index];
      let disk2 = this.front[index + 1];

      //different color for up/down segments
      if(this.isUpSegment(disk1, disk2)) {
        this.p.stroke(200, 0, 0);
      }
      else {
        this.p.stroke(200, 255, 0);
      }
      if (this.drawingMode == "log") {
        this.p.push();
        this.createTransformLog()
        this.p.line(disk1.logCylX, disk1.logCylY, disk2.logCylX, disk2.logCylY);
        this.p.pop();
      } else {
        this.p.line(disk1.cylinderX, disk1.cylinderY, disk2.cylinderX, disk2.cylinderY);
      }
      
    }

    //draw the last front
    let rotatedFirstDisk = this.rotateRight(this.front[0]);
    let lastDisk = this.front[this.front.length-1];
    if(this.areTouching(rotatedFirstDisk, lastDisk)) {
      //different color for up/down segments
      if(this.isUpSegment(lastDisk, rotatedFirstDisk)) {
        this.p.stroke(200, 0, 0);
      }
      else {
        this.p.stroke(200, 255, 0);
      }
      if (this.drawingMode == "log") {
        this.p.push();
        this.createTransformLog();
        this.p.line(rotatedFirstDisk.logCylx, rotatedFirstDisk.logCylY, lastDisk.logCylX, lastDisk.logCylY);
        this.p.pop();
      } else {
        this.p.line(rotatedFirstDisk.cylinderX, rotatedFirstDisk.cylinderY, lastDisk.cylinderX, lastDisk.cylinderY);
      }
    }
    this.p.pop();
  }

  //draw axes
  drawAxes() {
    this.p.push();
    this.createTransform(this.p);

    //light red lines.
    this.p.stroke(255,175,175);
    this.p.fill(255,175,175);
    this.p.strokeWeight((3/(600**2))*this.scaler);

    //draw lines at 30° intervals from cone vertex

    let axesLength = this.p.sqrt((this.p.width/this.p.height + this.p.abs(this.vertexX))**2+(1+this.p.abs(this.vertexY))**2);
    let relHeight = this.p.height/this.scaler
    let relAxesLength = this.p.sqrt((this.p.width/this.p.height + this.p.abs(this.vertexX))**2+((relHeight/this.scale)*(1/this.scale+this.p.abs(this.vertexY)))**2);
    this.p.angleMode(this.p.DEGREES);
    for(let angle = 0; angle <= 180; angle += 15) {
      let dx = relAxesLength*this.p.cos(angle);
      let dy = relAxesLength*this.p.sin(angle);
      this.p.line(0, 0, dx, dy);
    }

    //draw circles
    let circleInterval = axesLength/12;
    this.p.noFill();
    for(let r = 0; r < relAxesLength; r += circleInterval) {
      this.p.ellipse(0, 0, 2*r, 2*r);
    }

    this.p.pop();
  }

  drawAxesCylinder() {
    this.p.push();
    this.createTransformCylinder(this.p);

    //light red lines.
    this.p.stroke(255,175,175);
    this.p.fill(255,175,175);
    this.p.strokeWeight((3/(600**2))*this.scaler);

    //draw verticals
    let axesLength = (this.p.height/this.scaler/this.scale)*(1-this.vertexY);


    this.p.angleMode(this.p.DEGREES);
    let relHeight = this.p.height/this.scaler
    for(let angle = 0; angle <= 180; angle += 15) {
      if (this.drawingMode == "log") {
        this.p.line(-(angle-90)/this.angle,this.vertexY,-(angle-90)/this.angle,  axesLength)
      }
      else {
        this.p.line(-this.rMeridian*((angle-90)*this.p.PI/180),this.vertexY,-this.rMeridian*((angle-90)*this.p.PI/180), axesLength)
      }
    }

    //draw horizontals
    let conicAxesLength = this.p.sqrt((this.p.width/this.p.height + this.p.abs(this.vertexX))**2+((1+this.p.abs(this.vertexY)))**2); // axis length based on original width and height, based on axis length for conic model. Used exclusively to determine the circleInterval. This makes sure that the two sets of axes are teh same.
    let circleInterval = conicAxesLength/12;
    this.p.noFill();
    for(let r = 0; r < axesLength; r += circleInterval) {
      if (this.drawingMode != "log") {
        this.p.line(-1/this.scale, r, 1/this.scale, r)
      }
    }
    for(let r = 0; this.p.log((r**2)**0.5)/(2*this.angle /2 * this.p.PI/180)+this.logHeightTransform() < axesLength; r += circleInterval) {
      if (this.drawingMode == "log") {
        this.p.push();
        this.createTransformLog()
        let h = this.p.log((r**2)**0.5)/(2*this.angle /2 * this.p.PI/180)
        this.p.line(-1/this.scale, h, 1/this.scale, h)
        this.p.pop();
      }
    }
    
    this.p.pop();
  }

  /*Draws the ontological graph (connects child disks to parents)*/
  drawOntologicalGraph() {
    let regular = false;
    this.p.push();
    this.createTransform();
    this.p.stroke(0,0,200);
    this.p.strokeWeight((3/(600**2))*this.scaler);
    
    for (let disk of this.disks) {
      if(disk.parents.length >= 1) {
        this.p.line(disk.parents[0].x, disk.parents[0].y, disk.x, disk.y);
      }
      if(disk.parents.length >= 2) {
          this.p.line(disk.parents[1].x, disk.parents[1].y, disk.x, disk.y); 
      }
    }
    this.p.pop();
  }

  drawOntologicalGraphCylinder() {
    this.p.push();
    this.createTransformCylinder();
    this.p.stroke(0,0,200);
    this.p.strokeWeight((3/(600**2))*this.scaler);
    for (let disk of this.disks) {
      if (this.drawingMode == "log") {
        this.p.push();
        this.createTransformLog();
        if(disk.parents.length >= 1) {
          this.p.line(disk.parents[0].logCylX, disk.parents[0].logCylY, disk.logCylX, disk.logCylY);
        }
        if(disk.parents.length >= 2) {
          this.p.line(disk.parents[1].logCylX, disk.parents[1].logCylY, disk.logCylX, disk.logCylY);
        }
        this.p.pop()
      }
      else {
        if(disk.parents.length >= 1) {
          this.p.line(disk.parents[0].cylinderX, disk.parents[0].cylinderY, disk.cylinderX, disk.cylinderY);
        }
        if(disk.parents.length >= 2) {
          this.p.line(disk.parents[1].cylinderX, disk.parents[1].cylinderY, disk.cylinderX, disk.cylinderY);
        }
      }
    }
    this.p.pop();
  }

  /*Puts the canvas into the mode used to draw everything.*/
  createTransform() {
    this.p.translate(this.p.width/2, this.p.height/2);
    
    //before, we're assuming 1 = 100%
    this.p.scale(this.scaler/2);
    this.p.scale(1,-1);
    let yPosn = this.vertexY;
    if (this.scaler != this.p.height) {
      yPosn = this.vertexY * this.p.height/this.p.width
    }
    this.p.translate(this.vertexX, yPosn);
    this.p.scale(this.scale)
  }
  
  createTransformCylinder() {
    //this.p.translate(3*this.p.width/2, this.p.height/2);
    this.p.translate(this.p.width/2, this.p.height/2);
    //before, we're assuming 1 = 100%
    this.p.scale(this.scaler/2);
    this.p.scale(1,-1);
    let yPosn = this.vertexY;
    if (this.scaler != this.p.height) {
      yPosn = this.vertexY * this.p.height/this.p.width
    }
    this.p.translate(this.vertexX, yPosn);
    this.p.scale(this.scale)
    
    //this.p.translate(0,1/2*this.p.height)
  }
  getTransform() {
    let transform = this.p.drawingContext.getTransform()
    let transformArr = [[transform.a, transform.b, transform.c], [transform.d, transform.e, transform.f],[0,0,1]]
    return transformArr
  }
  logHeightTransform() {
    return this.disks[0].y- this.p.log((this.disks[0].x**2 + this.disks[0].y**2)**0.5)/(this.angle*this.p.PI/180)
  }
  createTransformLog() {
    this.p.translate(0,this.logHeightTransform())
  }

  drawFull(p5, type) {
    let oldP5 = this.p;
    if (p5) {
      this.p = p5;
    }
    if (type && type == "cylinder") {
      this.p.background(255);
      this.drawAxesCylinder()
    
      //draw the cones
      this.displayCylinder();
      
      this.drawOntologicalGraphCylinder()
      
      this.drawFrontCylinder();
      this.displayTextCylinder();
      
    } else {
      this.p.background(255);
      this.drawAxes();
      
      //draw the cones
      this.display();
      
      this.drawOntologicalGraph();
      this.drawFront();
      this.displayText()
    }
    this.p = oldP5;
  }
}
