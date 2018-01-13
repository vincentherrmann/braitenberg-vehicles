class Vehicle {

    constructor(opts) {
        this.x = opts.x;
        this.y = opts.y;
        this.vx = 0;
        this.vy = 0;
        this.vl = opts.vl;
        this.vr = opts.vr;
        this.ang = opts.ang;
        var vehicleSize = 0.5;
        this.w = 150 * vehicleSize;
        this.h = 100 * vehicleSize;
        this.bbox = bboxOfPoints(this.points());
    }

    tick() {
        var points = this.points();
        var leftPos = points[0];
        var rightPos = points[3];
        var lightAtLeft = light.atPosition(leftPos[0], leftPos[1]);
        var lightAtRight = light.atPosition(rightPos[0], rightPos[1])
        // var lightAtLeft = lightAtPosition(leftPos[0], leftPos[1]) * lightFactor;
        // var lightAtRight = lightAtPosition(rightPos[0], rightPos[1]) * lightFactor;

        // motor wiring
        this.vl = lightAtRight;
        this.vr = lightAtLeft;

        // noisy motion
        this.vr += (Math.random()*noisyMotion - 0.5 * noisyMotion);
        this.vl += (Math.random()*noisyMotion - 0.5 * noisyMotion);

        // enforce max and min velocities
        this.vr = Math.min(Math.max(this.vr, minVelocity), maxVelocity);
        this.vl = Math.min(Math.max(this.vl, minVelocity), maxVelocity);
    }

    dom() {

        var domVehicle = d3.select(document.createElementNS(d3.namespaces.svg, 'g'));
        var vselect =6;

          switch(vselect) {
          case 1:
            domVehicle.append('svg:image')
            .attr("xlink:href", "1_dark.svg")
            .attr('width', this.w)
            .attr('height', this.h)
            .attr('x', -this.w/2)
            .attr('y', -this.h/2);
          break;
          
          case 2:
            domVehicle.append('svg:image')
            .attr("xlink:href", "2a_dark.svg")
            .attr('width', this.w)
            .attr('height', this.h)
            .attr('x', -this.w/2)
            .attr('y', -this.h/2);
          break;

          case 3:
            domVehicle.append('svg:image')
            .attr("xlink:href", "2b_dark.svg")
            .attr('width', this.w)
            .attr('height', this.h)
            .attr('x', -this.w/2)
            .attr('y', -this.h/2);
          break;

          case 4:
            domVehicle.append('svg:image')
            .attr("xlink:href", "3a_dark.svg")
            .attr('width', this.w)
            .attr('height', this.h)
            .attr('x', -this.w/2)
            .attr('y', -this.h/2);
          break;

          case 5:
            domVehicle.append('svg:image')
            .attr("xlink:href", "3b_dark.svg")
            .attr('width', this.w)
            .attr('height', this.h)
            .attr('x', -this.w/2)
            .attr('y', -this.h/2);
          break;

          case 6:
            domVehicle.append('svg:image')
            .attr("xlink:href", "3c_dark.svg")
            .attr('width', this.w)
            .attr('height', this.h)
            .attr('x', -this.w/2)
            .attr('y', -this.h/2);
          break;
          }

        return domVehicle.node();
    }

    points() {
        // returns an array containing the four vertices of the vehicle
        var wh = this.w * 0.5 ;
        var hh = this.h * 0.5 ;
        var sinAng = Math.sin(this.ang);
        var cosAng = Math.cos(this.ang);
        // 1    0
        // 2    3
        var points = [[wh, hh], [-wh, hh], [-wh, -hh], [wh, -hh]];
        var self = this;
        points = points.map(function(p) {
          return [p[0] * cosAng - p[1] * sinAng + self.x, p[0] * sinAng + p[1] * cosAng + self.y];
        })
        return points;
    }
}

function createVehicles(data) {
    var drag = d3.drag()
        .on('start', vDragStarted)
        .on('drag',vDragged)
        .on('end', vDragEnded);

    var vehicle_objects = data.map(function(d) {
        return new Vehicle(d);
    })

    var vehicles = svg.selectAll('vehicle')
      .data(vehicle_objects)
      .enter().append(function(d) { return d.dom(); })
        .attr('class', 'vehicle')
        .attr('transform', function(d) { return "translate(" + d.x + "," + d.y + ") rotate(" + d.ang + ")"; })
        .call(drag);

    var simulation = d3.forceSimulation()
        .velocityDecay(0)
        .alphaTarget(1)
        .on('tick', ticked)
        .force('motor', motorForce())
        .force('collision', polygonCollide())
        .force('bounds', boundsForce().bounds({
            x: margin,
            y: margin,
            width: width - 2*margin,
            height: height - 2*margin}))
        .nodes(vehicle_objects)

    return [vehicles, simulation];
}

function ticked() {
  // will get called after each tick

  vehicles.each(function(d) {
    d.tick();
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

