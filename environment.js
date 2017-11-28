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
}

class CircularSource {
  constructor(opts) {
    this.x = opts.x;
    this.y = opts.y;
    this.strength = opts.strength;
    this.distance = opts.distance;
    this.id = opts.id;
    this.createGradient();
  }

  createGradient() {
    var gradient = defs.append("radialGradient")
        .attr("id", "gradient_" + this.id)
        .attr("r", "100%");

    var self = this
    var valueAt0 = this.strength / this.distance;
    var stops = [1, 0.8, 0.6, 0.4, 0.2];
    var stopPositions = stops.map(function(s) {
      // inverse function of value in respect to distance
      var pos = Math.sqrt(self.strength / (s * valueAt0) - self.distance);
      return pos;
    })

    for (var i = 0; i < stops.length; i++) {
      gradient.append("stop")
        .attr("offset", "" + stopPositions[i]*5 + "%")
        .attr("stop-color", "#c0c")
        .attr("stop-opacity", stops[i]*valueAt0)
    }
  }

  valueAtPosition(x, y) {
    var dx = this.x - x;
    var dy = this.y - y;
    var dist = Math.sqrt(dx*dx + dy*dy) + this.distance;
    return this.strength / (dist*dist);
  }

  dom() {
    var domSource = d3.select(document.createElementNS(d3.namespaces.svg, 'g'));

    domSource.append('circle')
        .attr('r', 100)
        .attr('cx', this.x)
        .attr('cy', this.y)
        .attr('fill', 'url(#gradient_' + this.id + ')');

    domSource.append('circle')
        .attr('r', Math.sqrt(this.strength)*5)
        .attr('cx', this.x)
        .attr('cy', this.y);


    return domSource.node();
  }
}
