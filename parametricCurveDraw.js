function circleSVG(x,y, r) {
  return '<circle r="'+r+'" cx="'+x+'" cy="'+y +'"/>\n'
}

function getColorStr(pColor, p) {
  let r = p.red(pColor);
  let g = p.green(pColor);
  let b = p.blue(pColor);
  let a = p.alpha(pColor);

  return 'rgb(' + r + ' ' + g + ' ' + b + ' / ' + a + ')'
}

function genDisksSVG(disks, strokeColor, fillColor) {
  let strokeWidth = disks[0].radius * 0.1
  let fillColorStr = getColorStr(fillColor);
  let strokeColorStr = getColorStr(strokeColor);
  let disksStr = '<g ' + ' " fill="'+fillColorStr+' " stroke="'+strokeColorStr+' " stroke-width="'+strokeWidth + '>\n';
  for (let i = 0; i < disks.length; i ++) {
    disksStr += circleSVG(disks[i].x, disks[i].y, disks[i].radius)
  }
  disksStr += '</g>'
  return disksStr;
}

function lineSVG(x1, y1, x2,y2) {
  // must place in parent <g stroke="something"></g> tag 
  '<line x1="'+x1+'" y1="'+y1+'" x2="'+x2+'" y2="'+y2+'"/>\n'
}
// display cylinder barriers
