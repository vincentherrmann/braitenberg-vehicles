function createVehicles(data) {
    var drag = d3.drag()
        .on('start', vDragStarted)
        .on('drag',vDragged)
        .on('end', vDragEnded);

    var vehicles = svg.selectAll('vehicle')
      .data(vehicles_data)
      .enter().append('g')
        .attr('class', 'vehicle')
        .attr('transform', function(d) { return "translate(" + d.x + "," + d.y + ") rotate(" + d.ang + ")"; })
        .call(drag);

    vehicles.append('rect')
        .attr('width', function(d) { return d.w; })
        .attr('height', function(d) { return d.h; })
        .attr('x', function(d) {return -d.w/2; })
        .attr('y', function(d) {return -d.h/2; });

    vehicles.append('line')
        .attr('x1', 0)
        .attr('x2', function(d) { return d.w/2;})

    var simulation = d3.forceSimulation()
        .velocityDecay(0)
        .alphaTarget(1)
        .on('tick', ticked)
        .force('motor', motorForce())
        .force('collision', polygonCollide())
        .force('bounds', boundsForce().bounds({x: 0, y: 0, width: width, height: height}))
        .nodes(vehicles_data)

    return [vehicles, simulation];
}

function ticked() {
  // will get called after each tick

  vehicles.each(function(d) {
    var points = vehiclePoints(d);
    var leftPos = points[0];
    var rightPos = points[3];
    var lightAtLeft = lightAtPosition(leftPos[0], leftPos[1]) * lightFactor;
    var lightAtRight = lightAtPosition(rightPos[0], rightPos[1]) * lightFactor;
    d.vl = maxVelocity - lightAtRight;
    d.vr = maxVelocity - lightAtLeft;

    d.vr += (Math.random()*noisyMotion - 0.5 * noisyMotion); //* d.vr;
    d.vl += (Math.random()*noisyMotion - 0.5 * noisyMotion); //* d.vl;

    d.vr = Math.min(Math.max(d.vr, minVelocity), maxVelocity);
    d.vl = Math.min(Math.max(d.vl, minVelocity), maxVelocity);
  })

  vehicles.attr("transform", function(d) {
    return "translate(" + d.x + "," + d.y + ") rotate(" + (d.ang * 180 / Math.PI) + ")";
  })
}

// DRAGGING
var px, py, vx, vy, offsetX, offsetY
function vDragStarted(d) {
    vx = d.vx = 0.
    vy = d.vy = 0.
    offsetX = (px = d3.event.x) - (d.fx = d.x)
    offsetY = (py = d3.event.y) - (d.fy = d.y)
}
function vDragged(d) {
    vx = (d3.event.x - px)
    vy = (d3.event.y - py)
    d.fx = Math.max(Math.min((px = d3.event.x) - offsetX, width - d.bbox.width/2), 0)
    d.fy = Math.max(Math.min((py = d3.event.y) - offsetY, height - d.bbox.height/2), 0)
}
function vDragEnded(d) {
    var vScalingFactor = maxVelocity / Math.max(Math.sqrt(vx * vx + vy * vy), maxVelocity)
    d.fx = null
    d.fy = null
    d.vx = vx * vScalingFactor
    d.vy = vy * vScalingFactor
}

function motorForce() {
  // convert the velocities of the motors (vl and vr) into axis aligned velocities (vx and vy)
  // adjust the angle of the vehicle
  var nodes;

  function force() {
    nodes.forEach(function(d) {
      vDiff = d.vr - d.vl;
      angDiff = Math.atan(vDiff / d.w);
      vAbs = Math.abs(d.vl + d.vr);
      d.ang = (d.ang + angDiff) % 360.;
      d.vx = vAbs * Math.cos(d.ang);
      d.vy = vAbs * Math.sin(d.ang);
    });
  }

  force.initialize = function(_) {
    nodes = _;
  };

  return force;
}

function vehiclePoints(d) {
  // returns an array containing the four vertices of the vehicle
  wh = d.w * 0.5;
  hh = d.h * 0.5;
  sinAng = Math.sin(d.ang);
  cosAng = Math.cos(d.ang);
  // 1    0
  // 2    3
  points = [[wh, hh], [-wh, hh], [-wh, -hh], [wh, -hh]];
  points = points.map(function(p) {
    return [p[0] * cosAng - p[1] * sinAng + d.x, p[0] * sinAng + p[1] * cosAng + d.y];
  })
  return points;
}
