function createCircularLight(data) {
  var lightDrag = d3.drag()
      .on('drag', circleDragged);

  var lights = svg.selectAll('light')
    .data(data)
    .enter().append('circle')
      .attr('class', 'light')
      .attr('r', function(d) { return Math.sqrt(d.strength) * 50; })
      .attr('cx', function(d) { return d.x; })
      .attr('cy', function(d) { return d.y; })
      .call(lightDrag);
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