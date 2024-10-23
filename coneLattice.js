/********************************************
SURF 2023
Copyright (c) 2023 Emi Neuwalder
Licensed under the MIT license: http://www.opensource.org/licenses/mit-license.php 
******************************************* */
/** This code was translated by Emi Neuwalder as directly as possible, with permission, from Matlab code written by Christophe Golé in 2007. All comments were preserved. It was then extended. The point of transition from translated code to extended code is marked by a comment. */
class ConeLattice {
  constructor(n,m,ang,r,perturb, p,rfin) {
    if (ang > p.PI) {
      // If the angle measure is greater than Pi, assume that it has been provided in degrees. Convert to radians.
      ang = ang/180 * p.PI
    }
    p.angleMode(p.RADIANS)
    
    function abs(pt) {
        return (pt[0]**2 + pt[1]**2)**0.5
    }
    function div(pt1,pt2) {
        // Weisstein, Eric W. "Complex Division." From MathWorld--A Wolfram Web Resource. https://mathworld.wolfram.com/ComplexDivision.html
        // ac+bd/(c^2 + d^2)
        let x = (pt1[0]*pt2[0] + pt1[1]*pt2[1])/(pt2[0]**2+pt2[1]**2)
        let y = (pt1[1]*pt2[0] - pt1[0]*pt2[1])/(pt2[0]**2+pt2[1]**2)
        return [x,y]
    }
    function mul(pt1, pt2) {
        let x = (pt1[0]*pt2[0] - pt1[1]*pt2[1])
        let y = (pt1[1]*pt2[0] + pt1[0]*pt2[1])
        return [x,y]
    }
    //// Cone lattices (and pertubations)
    // n,m fronts built out of sequences of n left vectors and m right vectors with the
    // properties:
    // - the angle between successive left vector is c/n  where c is the cone
    //   angle. It is c/m for the right vectors. This holds cyclically.
    // - The end result is a pattern which repeats under snow, as long as
    //   there are no (triangle) transitions. Its parastichies lay on circles
    //
    // This program also produces perturbations of fronts of cone lattices -
    // giving rise, in particular to cone rhombic tilings.
    //
    // We hope to show that, in a neighborhood of such a (Fibonacci say) cone
    // lattice, no pentagons ever appear. We'd also like to understand the
    // occurence of triple tangencies in this context
    // funny parameters to avoid "resonnance"?

    // Note that this program can be used to study cylindrical lattices, by
    // using a very small cone angle and iterating for not too

    let c = ang;
    let D = 2*r;
    let vc_y = -1/(2*p.tan(c/2)); // note that there is no vc_x because vc_x = 0
    let prct_pert_l = perturb; // max percentage rand pertubation of left front vectors
    let prct_pert_r = perturb;

    //// build regular polygonal parastichies  
    // (with possible perturbation)
    // start them horizontal - will rotate them so that they meet at one point
    // left parastichy

    //perturbation vectors (let prct_pert_l and _r be 0 if want a cone lattice)

    let Perturbl = [];
    let Perturbr = [];
    for (let i = 0; i < n; i++) {
        Perturbl.push(prct_pert_l*0.02*(p.random()-0.5));
    }
    for (let i = 0; i < m; i++) {
        Perturbr.push(prct_pert_r*0.02*(p.random()-0.5));
    }
    
    // left parastichy
    let Al = []; // vectors in the polygonal line
    for (let i = 0; i < n; i++) {
        let cur_r = D;
        let cur_theta = -(c/n)*(i+Perturbl[i])
        let x = cur_r*p.cos(cur_theta)
        let y = cur_r*p.sin(cur_theta)
        Al.push([x,y])
    }
    let sumL = Al.reduce(function(a,b){return [a[0]+b[0],a[1]+b[1]]}, [0,0])
    let Rl = abs(sumL) // polar coordinates of the tip of the polygonal line
    let Tl = p.atan2(sumL[1],sumL[0])
    // right parastichy
    let Ar = []; // vectors in the polygonal line
    for (let i = m-1; i >= 0; i--) {
        let cur_r = D;
        let cur_theta = (c/m)*(i+Perturbr[i])
        let x = cur_r*p.cos(cur_theta)
        let y = cur_r*p.sin(cur_theta)
        Ar.push([x,y])
    }
    let sumR = Ar.reduce(function(a,b){return [a[0]+b[0],a[1]+b[1]]}, [0,0])
    let Rr = abs(sumR) // polar coordinates of the tip of the polygonal line
    let Tr = p.atan2(sumR[1],sumR[0])

    //// Finding the intersection of the two circles
    // where the tips of the parastichies meet
    // Formula obtained in Mathematica with the command:
    // {a, b} = {x, y} /. Simplify[Solve[(x + 1/2)^2 + (y)^2 == Rl^2/4 && (x - 1/2)^2 + (y)^2 == Rr^2/4, {x, y}]][[2]]
    let crosspt = [0.5*(Rl**2-Rr**2), 0.5*(p.sqrt(-(Rl**4) - (Rr**2-1)**2 + 2*Rl**2*(Rr**2+1)))];
    let crosspt_x = 0.5*(Rl**2-Rr**2)
    let crosspt_y = 0.5*(p.sqrt(-(Rl**4) - (Rr**2-1)^2 + 2*Rl**2*(Rr**2+1)))
    //// Building the front and candidate list

    let al = p.atan2(crosspt[1], crosspt[0]+1/2) -Tl // angle of first left vector
    let ar = p.atan2(crosspt[1], crosspt[0]-1/2) -Tr // angle of last right vector
    let L = [] // sequence of left vectors (northeast orientation)
    let R = [] // sequence of right vectors (southeast orientation)
    for (let i = 0; i < Al.length; i++) {
      L.push(mul(Al[i],[p.cos(al),p.sin(al)]))
    } 
    for (let i = 0; i < Ar.length; i++) {
      let temp_pt = mul(Ar[i],[p.cos(ar),p.sin(ar)])
      R.push([-temp_pt[0],-temp_pt[1]])
    }
    let fr = [[-1/2,0], [-1/2+R[0][0],R[0][1]]];                    // initialize the front
    let vfr = [R[0]];                               // initialize the front vectors  (WARNING: needed?)
    let leftright = [1];                            // 0 if left vector, 1 if right
    let Rad = (0.5**2 + vc_y**2)**0.5 // height of highest point
    let candz = [];                                 // initialize the (complex) candidates
    let u = 0;                                      // number of left vectors in front
    let v = 1;                                      // number of right vectors in front

    for (let k = 1; k<(m+n)-1; k++) { // loop to build the front, from left to right
        let temp_x = fr[fr.length-1][0]+L[u][0]
        let temp_y = fr[fr.length-1][1]+L[u][1]- vc_y
        if (u < n && abs([temp_x,temp_y]) < Rad+10**(-14)) {
            fr.push([fr[fr.length-1][0]+L[u][0],fr[fr.length-1][1]+L[u][1]])
            vfr.push(L[u])
            if (leftright[leftright.length-1] == 1) { // this is a local min - put a candidate here
                let temp_pt = div(R[v-1],L[u])
                if (p.atan2(-temp_pt[1], -temp_pt[0]) > 2*p.PI/3-10**(-10)) {// means a triangle
                    let temp_pt2 = [fr[fr.length-2][0],fr[fr.length-2]-vc_y]
                    temp_pt = div(R[v-1],temp_pt2)
                    let temp_pt3 = div(temp_pt2, L[u])
                    if (p.atan2(-temp_pt[0], -temp_pt[1]) > p.atan2(temp_pt3)) { // checks which vector is more horizontal
                        temp_pt = [p.cos(p.PI/3),p.sin(p.PI/3)];
                        temp_x = fr[fr.length-3][0] + mul(R[v-1],temp_pt)[0];
                        temp_y = fr[fr.length-3][1] + mul(R[v-1], temp_pt)[1];
                        candz.push([[temp_x, temp_y], fr.length-2, fr.length-1]);
                    }
                    else {
                        temp_x = fr[fr.length-2][0] + mul(L[u], temp_pt)[0]
                        temp_y = fr[fr.length-2][1] + mul(L[u], temp_pt)[1]
                        candz.push([[temp_x, temp_y], fr.length-1, fr.length]);
                    }
                }
                else {            // means a rhombus
                    candz.push([[fr[fr.length-3][0]+L[u][0], fr[fr.length-3][1]+L[u][1]],fr.length-2, fr.length])
                }
            }
            leftright.push(0)         // add 0 for the left vector
            u ++;
        }
        else {
            if (k == m+n-2) {
                candz.push([[fr[fr.length-1][0]+L[u][0],fr[fr.length-1][1]+L[u][1]], fr.length, 1]);
            }
          temp_x = fr[fr.length-1][0]+R[v][0];
          
          temp_y = fr[fr.length-1][1]+R[v][1];
            fr.push([temp_x,temp_y]);
            vfr.push(R[v]);
            leftright.push(1);          // add 1 for the right vector
            v++;
        }
    }
    let angfr = []
    for (let i = 0; i < vfr.length; i++) {
        angfr.push(p.atan2(vfr[i][1], vfr[i][0]))
    }
    let angfrper = angfr.slice(0,-1)
    angfrper.unshift(angfr[angfr.length-1]+c)
    let relangfr = [];
    for (let i = 0; i < angfr.length; i++) {
        relangfr.push(p.abs(angfrper[i]) - p.abs(angfr[i]));
    }
    //// Ordering points ontogenetically and giving the front ontogenetic indices
    // the ouput is pts (ontogenetically ordered points in the front) and frt
    // (the ontogenetic indices of the successive points in the front, ordered
    // from left to right), as well as a list of candidates. All in real
    // coordinates, suitable as input for snowcone.

    let sabsfr = []
    for (let i = 0; i<fr.length; i++)  {
        sabsfr.push([abs([fr[i][0], fr[i][1]-vc_y]),i+1])
    }
    // p.print(fr)
    sabsfr.sort(function(a,b){
        return a[0] - b[0]
    })
    // p.print("sabsfr:")
    // p.print(sabsfr)
    let sfrind = sabsfr.map(function(a) {return a[1]})

    let pts = sfrind.map(function(a) {return fr[a-1]})
    let ptscheck = pts.map(function(a) {return abs([a[0], a[1]-vc_y])})
    // p.print("points dist:")
    // p.print(ptscheck)
    let id = sfrind.map(function(a,i) {return [a, i+1];});
    id.sort(function(a,b){return a[0]-b[0];});
    let frt = id.map(function(a) {return a[1]})
    let rcandpar = candz.map(function(a) {return frt[a[2]-1]})
    if (candz[candz.length-1] == 1) {
        rcandpar[rcandpar.length-1] = -frt[0]
    }
    let cand = candz.map(function(a,ind){
        return [a[0][0],a[0][1],frt[a[1]-1],rcandpar[ind]];
    })
    if (rfin) {
      function scale(a){
        return [a[0]*rfin/r, a[1]*rfin/r]
      }
      pts = pts.map(scale)
      cand = cand.map(function(a) {
        return [a[0]*rfin/r, a[1]*rfin/r, a[2],a[3]]
      })
    }
    ptscheck = pts.map(function(a) {return abs([a[0], a[1]-vc_y*rfin/r])})
    // p.print("points dist scaled:")
    // p.print(ptscheck)
    leftright.push(0)
    
    this.pts = pts
    this.frt = frt
    this.cand = cand
    // p.print("candidates")
    // p.print(cand)
    this.h = -vc_y*rfin/r
    this.leftright = leftright
    
    // p.print(leftright)
    //leftright; 1=down; 0=up


    /*end original code. the following is written exclusively by Emi */
    let num_up = 0;
    let num_down = m;
    let updownInd = [];
    for (let i = 0; i < leftright.length; i++) {
      if (leftright[i] == 1 && leftright[(i+n+m-1)%(m+n)] == 0) {
        // then i is a lower disk
        let real_num_up = num_up 
        let real_num_down = num_down 
        if (real_num_up == 0) {
          updownInd.push([-(n), real_num_down])
        } else if (real_num_down == 0) {
          updownInd.push([real_num_up, -(m)])
        } else {
          updownInd.push([real_num_up,real_num_down])
        }
      } else {
        updownInd.push(false)
      }
      if (leftright[i] == 1) {
        num_down--;
      } else {
        num_up++;
      }
    }
    let parastichy_ids;
    let lowest_disk_id = frt.indexOf(1)
    if (m>n) {
      //lowest + 1
      parastichy_ids = updownInd[(lowest_disk_id+1)%updownInd.length]
    } else if(m<n) {
      //lowest - 1
      parastichy_ids = updownInd[lowest_disk_id-1]
    } else {
      parastichy_ids = updownInd[0]
    }
    p.print(lowest_disk_id)
    this.updownInd = updownInd
    p.print(updownInd)
    p.print("skinniest angle parastichy pair")
    p.print(parastichy_ids)
    this.parastichy_ids = parastichy_ids//ids of the parastichies that make up the most acute angle in the front; 1-indexed. A negative id corresponds to a rotated parastichy. The first is the id in the list of up parastichies, the second is the id in the list of down parastichies.
    //return [pts, frt, cand, sumL]
  }
}