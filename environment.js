function createCircularLight(data) {
  var light = new Feature();
  light.scale = lightFactor;
  light.sources = data.map(function(d) {
    return new CircularSource(d);
  })

  var lightDrag = d3.drag()
      .on('drag', circleDragged);

  var lights = svg.selectAll('light')
    .data(light.sources)
    .enter().append(function(d) { return d.dom(); })
      .attr('class', 'light')
      .call(lightDrag);

  light.heatmap();

  // var lightCanvas = d3.select('environment')
  //   .data([light])
  //   .enter().append(function(d) { return d.heatmap(); })
  //     .attr('class', 'lightCanvas')

  return [light, lights];
}

function circleDragged(d) {
    d3.select(this)
        .attr("cx", d.x = d3.event.x)
        .attr("cy", d.y = d3.event.y)
}

function lightAtPosition(x, y) {
  var light = 0;
  lights_data.forEach(function(d) {
    var dx = d.x - x;
    var dy = d.y - y;
    var dist = Math.sqrt(dx*dx + dy*dy) + lightDistance;
    light += (d.strength / (dist*dist));
  })
  return light;
}

class Feature {
  constructor(opts) {
    this.sources = []
    this.scale = 1.
  }

  atPosition(x, y) {
    var value = 0.;
    for (var source of this.sources) {
      value += source.valueAtPosition(x, y);
    }
    return value * this.scale;
  }

  heatmap() {
    //var canvas = d3.select(document.createElementNS(d3.namespaces.html, 'canvas'))
    var canvas = d3.select("canvas")
        .attr("width", width)
        .attr("height", height)
    var stride = 5;

    var canvasNode = canvas.node();
    var context = canvas.node().getContext("2d");
    var image = context.createImageData(width / stride, height / stride);

    var hueInterp = d3.interpolateHsvLong(d3.hsv(120, 1, 0.65), d3.hsv(60, 1, 0.90)),
        color = d3.scaleSequential(hueInterp).domain([0., 1.]);

    for (var i = 0, l = 0; i < width/stride; ++i) {
      for (var j = 0; j < height/stride; ++j, l+=4 ) {
        //var c = d3.rgb(color(this.atPosition(i*stride, j*stride)));
        var c = d3.rgb(color(i*j * 0.001))
        //console.log('position ', i*stride, j*stride, l);
        image.data[l + 0] = c.r;
        image.data[l + 1] = c.g;
        image.data[l + 2] = c.b;
        image.data[l + 3] = 255;
      }
    }

    context.putImageData(image, 0, 0);
    return canvas.node();
  }
}

class CircularSource {
  constructor(opts) {
    this.x = opts.x;
    this.y = opts.y;
    this.strength = opts.strength;
    this.distance = opts.distance;
  }

  valueAtPosition(x, y) {
    var dx = this.x - x;
    var dy = this.y - y;
    var dist = Math.sqrt(dx*dx + dy*dy) + this.distance;
    return this.strength / (dist*dist);
  }

  dom() {
    var domSource = d3.select(document.createElementNS(d3.namespaces.svg, 'circle'))
        .attr('r', Math.sqrt(this.strength) * 50)
        .attr('cx', this.x)
        .attr('cy', this.y)

    return domSource.node();
  }
}
