function createCircularLight(data) {
  var light = new Feature();
  light.scale = lightFactor;
  light.sources = data.map(function(d) {
    return new CircularSource(d);
  })

  var lights = svg.selectAll('light')
    .data(light.sources)
    .enter().append(function(d) { return d.dom(); })
      .attr('class', 'light')
      //.call(lightDrag);

  return [light, lights];
}

function circleDragged(d) {
	d.x = d3.event.x;
	d.y = d3.event.y;
	d3.select(this)
			.attr("transform", "translate(" + d.x + ", " + d.y + ")");
    // d3.select(this)
    //     .attr("cx", d.x = d3.event.x)
    //     .attr("cy", d.y = d3.event.y)
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
		this.r = 10;
    this.createGradient();
  }

  createGradient() {
    var gradient = defs.append("radialGradient")
        .attr("id", "gradient_" + this.id)
        .attr("r", "100%");

    var self = this
    var valueAt0 = Math.min(1, this.strength / this.distance);
		var minOpacity = 0.01
		if (valueAt0 < minOpacity) {
			return
		}
		var maxStopDiff = 0.1;
		var stopCount = Math.ceil(valueAt0 / maxStopDiff);
		this.r = this.distanceOfValue(minOpacity);
    var stops = [];
		for (var i = stopCount; i > 0; i--) {
			stops.push(valueAt0*(i/stopCount));
		}
    var stopPositions = stops.map(function(s) {
      return self.distanceOfValue(s);
    })
		stops.push(0);
		stopPositions.push(self.distanceOfValue(minOpacity));

    for (var i = 0; i < stops.length; i++) {
      gradient.append("stop")
        .attr("offset", "" + (50*stopPositions[i] / this.r) + "%")
        .attr("stop-color", "#c0c")
        .attr("stop-opacity", stops[i])
    }
  }

	distanceOfValue(v) {
		return Math.sqrt(this.strength / v - this.distance);
	}

  valueAtPosition(x, y) {
    var dx = this.x - x;
    var dy = this.y - y;
    var dist = Math.sqrt(dx*dx + dy*dy) + this.distance;
    return this.strength / (dist*dist);
  }

	drag(d) {
		this.x = d3.event.x;
		this.y = d3.event.y;

		d3.select(this)
				.attr("transform", "translate(" + this.x + ", " + this.y + ")");
	}

  dom() {
    var domSource = d3.select(document.createElementNS(d3.namespaces.svg, 'g'));
		var self = this;

    domSource.append('circle')
        .attr('r', this.r)
        .attr('fill', 'url(#gradient_' + this.id + ')')
				.attr('class', 'field');

    domSource.append('circle')
        .attr('r', Math.sqrt(this.strength))

		domSource.attr("transform", "translate(" + this.x + ", " + this.y + ")")
				.call(d3.drag()
					.on('drag', this.drag));

    return domSource.node();
  }
}
