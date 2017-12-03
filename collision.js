function boundsForce() {
  var nodes,
      bbox,
      strength=1.;

  function force() {
    nodes.forEach(function(d) {
      var points = d.points();
      for (var i = 0; i < points.length; i++) {
        var dist = 0
        if ((dist = bbox.x - points[i][0]) > 0) {
          d.vx += dist * strength;
        }
        if ((dist = points[i][0] - bbox.x - bbox.width) > 0) {
          d.vx -= dist * strength;
        }
        if ((dist = bbox.y - points[i][1]) > 0) {
          d.vy += dist * strength;
        }
        if ((dist = points[i][1] - bbox.y - bbox.height) > 0) {
          d.vy -= dist * strength;
        }
      }
    });
  }

  force.bounds = function(_) {
    if (arguments.length == 1) {
      bbox = _
      return force;
    } else {
      return bbox;
    }
  };

  force.initialize = function(_) {
    nodes = _;
  };

  return force;
}

function polygonCollide() {
  // calculate simple collisions between convex polygons
  var iterations = 4,
      strength = 0.2,
      nodes;

  function force() {
    var i, n = nodes.length,
        tree,
        node,
        nodePoints,
        xi,
        yi,
        wi,
        hi;

    for (var k = 0; k < iterations; ++k) {
      // create quadtree
      tree = d3.quadtree()
          .x(function(d) { return d.x; })
          .y(function(d) { return d.y; })
          .addAll(nodes)
          .visitAfter(prepare);

      // calculate collision for each node
      for (i = 0; i < n; ++i) {
        node = nodes[i];
        nodePoints = node.points();
        xi = node.x + node.vx;
        yi = node.y + node.vy;
        tree.visit(apply);
      }
    }

    function apply(quad, x0, y0, x1, y1) {
      var data = quad.data,
          xSize = (quad.bbox.width * node.bbox.width) / 2,
          ySize = (quad.bbox.height * node.bbox.height) / 2;

      // if there is only one single data element in this quadrant
      if (data) {
        // skip collision with self
        if (data.index <= node.index) {return}

        dataPoints = data.points();
        for(var i = 0; i < nodePoints.length; ++i) {
          var overlap = Math.max(pointInPolygon(nodePoints[i], dataPoints),
                                 pointInPolygon(dataPoints[i], nodePoints));
          if (overlap > 0) {
            var diffX = data.x - node.x;
            var diffY = data.y - node.y;
            var distance = Math.sqrt(diffX*diffX + diffY*diffY);
            // normalized difference vector
            var nx = diffX / distance;
            var ny = diffY / distance;

            // velocity orthogonal to the connecting line
            var ovNode = node.vx * nx + node.vy * ny;
            var ovData = data.vx * nx + data.vy * ny;

            // velocity parallel to the connecting line
            var pvNode = node.vx * ny - node.vy * nx;
            var pvData = data.vx * ny - data.vy * nx;
            //var vColl = Math.abs(pvNode + pvData); // collision velocity
            var vColl = 1.;
            var s = strength * overlap;
            //console.log("collision with overlap", overlap);
            //console.log("collision with speed", vColl);
            node.vx = (ovNode * ny) - (vColl * nx) * s;
            node.vy = (ovNode * -nx) - (vColl * ny) * s;
            data.vx = (ovData * ny) + (vColl * nx) * s;
            data.vy = (ovData * -nx) + (vColl * ny) * s;
            break;
          }
        }
        return;
      }

      // else there is not one single element in this quadrant
      // visit only subquadrants where any part of the current node lies in this quad
      // (no subquadrants are visited if this callback returns true)
      return x0 > xi + xSize || y0 > yi + ySize ||
             x1 < xi - xSize || y1 < yi - ySize;
    }

    function prepare(quad) {
      // set the bounding box containing all data for this quadrant
      if (quad.data) { // if there is one single data element in this quadrant
        // set the bounding box of this quad as the same
        var points = quad.data.points();
        quad.bbox = quad.data.bbox = bboxOfPoints(points);
      } else {
        // set the bounding box to contain all elements of the subquadrants
        quad.bbox = {x: width, y: height, width: 0, height: 0};
        for (var i = quad.r = 0; i < 4; ++i) {
          if (quad[i] && quad[i].bbox) {
            quad.bbox = combineBBoxes(quad.bbox, quad[i].bbox);
          }
        }
      }
    }
  }

  force.initialize = function(_) {
    nodes = _;
    //initialize();
  };

  return force;
}

function pointInPolygon(point, vertices) {
  // if the point lies outside, returns 0
  // if the point lies in the polygon, returns the minimal distance to an edge
  // only works for convex polygons
  var distance = 10000;
  // check if the point lies left of every edge (vertices have to be in counter-clockwise order)
  for (i=0; i < vertices.length; i++) {
    var p1 = vertices[i];
    var p2 = vertices[(i+1) % vertices.length];
    var a = -(p2[1] - p1[1]);
    var b = p2[0] - p1[0];
    var c = -(a * p1[0] + b * p1[1]);
    var d = a * point[0] + b * point[1] + c;
    if (d < 0) {
      // point not left of edge, so the point lies outside the polygon
      return 0;
    } else {
      d /= Math.sqrt(a*a + b*b);
      if(d < distance) {
        distance = d;
      }
    }
  }
  return distance;
}

function bboxOfPoints(points) {
  // returns the bounding box of an array of points
  minX = width;
  minY = height;
  maxX = 0;
  maxY = 0;
  points.forEach(function(p) {
    minX = Math.min(minX, p[0]);
    minY = Math.min(minY, p[1]);
    maxX = Math.max(maxX, p[0]);
    maxY = Math.max(maxY, p[1]);
  })
  return {x: minX, y: minY, width: maxX-minX, height: maxY-minY};
}

function combineBBoxes(box1, box2) {
  // returns the bounding box containing both boxes
  var x = Math.min(box1.x, box2.x),
      y = Math.min(box1.y, box2.y),
      width = x + Math.max(box1.x + box1.width, box2.x + box2.width),
      height = y + Math.max(box1.y + box1.height, box2.y + box2.height);
  return {x: x, y: y, width: width, height: height}
}
