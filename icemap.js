var icemap = icemap || {};

icemap.config = {
  map_src: 'map.png',
  map_x: 400,
  map_y: 300,
  map_w: 800,
  map_h: 600,
  hashcmd: '!',
  mapimage: null
}

icemap.places = {
  atherton: {x: 639, y: 416, text: "City-state of Atherton"},
  cenedoiss: {x: 960, y: 693, text: "City-state of Cenedoiss"},
  graemor: {x: 1085, y: 490, text: "City of Graemor"},
  vaerlon: {x: 505, y: 631, text: "City of Vaerlon"}
}

// reversed places map for lookup
icemap.build_revplaces = function (places) {
  var p, key, revplaces = {};
  for (p in places) if (places.hasOwnProperty(p)) {
    key = places[p]['x']+'x'+places[p]['y'];
    revplaces[key] = places[p];
    revplaces[key]['place'] = p;
  }
  return revplaces;
}
icemap.revplaces = icemap.build_revplaces(icemap.places);

icemap.colormap = {
  "#ffffff": { ch: "g", cl: "g"},
  "#718292": { ch: "^", cl: "mo"},
  "#ff0000": { ch: "?", cl: "sp"},
  "#ffb6aa": { ch: ".", cl: "pa"},
  "#aa9255": { ch: "h", cl: "h"},
  "#c7d7e3": { ch: "z", cl: "z"},
  "#61c3a2": { ch: "t", cl: "t"},
  "#aa6d00": { ch: "H", cl: "hh"},
  "#007000": { ch: "e", cl: "e"},
  "#55ff00": { ch: "p", cl: "p"},
  "#74d3ff": { ch: "i", cl: "i"},
  "#ffd300": { ch: "#", cl: "cy"},
  "#808080": { ch: "C", cl: "ga"},
  "#000000": { ch: "*", cl: "ro"},
  "#77dd00": { ch: "m", cl: "m"},
  "#aab600": { ch: "s", cl: "s"},
  "#00b655": { ch: "d", cl: "d"},
  "#005c00": { ch: "E", cl: "ed"},
  "#9da80a": { ch: "S", cl: "sd"},
  "#0024ff": { ch: "r", cl: "r"},
  "#00ffcc": { ch: "$", cl: "po"},
  "#ff6b00": { ch: "v", cl: "v"},
  "#0049aa": { ch: "~", cl: "l"},
  "#00b600": { ch: "f", cl: "f"},
  "#139636": { ch: "D", cl: "dd"},
  "#57cc14": { ch: "M", cl: "md"},
  "#009b00": { ch: "F", cl: "fd"},
  "#00ffff": { ch: "_", cl: "a"},
  "#72b20a": { ch: "w", cl: "w"},
  "#002455": { ch: "R", cl: "rd"}
}

// reversed colormap
icemap.charmap = (function (colormap) {
  var c, 
      charmap = {};
  for (c in colormap) if (colormap.hasOwnProperty(c)) {
    charmap[colormap[c]['ch']] = c;
  }
  // road
  charmap['|'] = charmap['/'] = charmap['-'] = charmap['\\'] = charmap['+'] = charmap['*'];
  // pond
  charmap['P'] = charmap['r'];
  return charmap;
}(icemap.colormap));

icemap.init = function () {
  icemap.load_map({cb: icemap.parse_hash});
  
  $(window).bind('hashchange', icemap.parse_hash);

  icemap.build_places_list(icemap.places);
  $("#places h1").bind("click", icemap.toggle_places);
}

icemap.Color = (function(){
  var Color = function(red, green, blue, alpha) {
    this.red = +red;
    this.green = +green;
    this.blue = +blue;
    this.alpha = +alpha || 0;
  }

  Color.prototype.equals = function(c) {
    if (!c || typeof(c.red) === 'undefined' || 
        typeof(c.green) === 'undefined' ||
        typeof(c.blue) === 'undefined' ||
        typeof(c.alpha) === 'undefined') { 
      return false;
    }
    return c.red === this.red && 
           c.green === this.green &&
           c.blue === this.blue && 
           c.alpha === this.alpha;
  }

  Color.prototype.toString = function() {
    var rs, gs, bs;
    if (this.alpha) {
      return "rgba("+this.red+", "+this.green+", "+this.blue+", "+this.alpha+")";
    } else {
      rs = this.red.toString(16);
      gs = this.green.toString(16);
      bs = this.blue.toString(16);
      return "#"+(this.red > 15 ? rs : "0"+rs)+(this.green > 15 ? gs : "0"+gs)+(this.blue > 15 ? bs : "0"+bs);
    }
  }

  return Color;
}())

icemap.message = function (message, id) {
  var ts = new Date().getTime();

  id = id || "ts"+ts;

  console.log("[icemap:"+ts+"] message: " + message);
  $('<li class="hidden" id="'+id+'" />').text(message).appendTo("#messages").show("fast");
}

icemap.clear_messages = function () {
  $("#messages").html("");
}

icemap.build_places_list = function (places) {
  var p;
  for (p in places) if (places.hasOwnProperty(p)) {
    $('<li><a href="#!/goto/'+p+'" title="'+places[p]['text']+'">'+p+'</a></li>').appendTo("#places ul");
  }
}

icemap.toggle_places = function () {
  $("#places li").toggle("fast");
}

icemap.parse_hash = function () {
  var hash = document.location.hash,
      cchar = icemap.config.hashcmd,
      cpos = hash.search(cchar),
      cmds, i;

  if (cpos >= 0) {
    cmds = hash.substring(cpos+1).split(';');
    for (i = 0; i < cmds.length; i++) {
      icemap.call_cmd(cmds[i]);
    }
  }
}

icemap.call_cmd = function (cmdstr) {
  var cmdArr = cmdstr.split('/'),
      cmd = cmdArr.shift();

  if (!cmd[0]) {
    cmd = cmdArr.shift();
  }

  if (typeof(icemap.cmdmap[cmd]) !== 'undefined') {
    console.log("[icemap] calling: " + cmd + " parameters: " + cmdArr.join(', '));
    icemap.cmdmap[cmd].apply(this, cmdArr);
  }
}

icemap.load_map = function (opts) {
  opts = opts || {};
  map_src = opts.map_src || icemap.config.map_src;
  icemap.config.mapimage = new Image();
  icemap.config.mapimage.src = map_src;
  icemap.config.mapimage.onload = function() { icemap.map_loaded(opts.cb); };
}

icemap.map_loaded = function (cb) {
  var m = icemap.config.mapimage,
      ctx;

  $("#hidden_map_canvas").remove();
  $('<canvas id="hidden_map_canvas" class="hidden" width="'+m.width+'" height="'+m.height+'" />').appendTo("#map");

  ctx = document.getElementById("hidden_map_canvas").getContext('2d');
  ctx.drawImage(m, 0, 0);

  icemap.draw_charmap();

  if (cb) {
    cb.call(this);
  }
}

icemap.draw_charmap = function (x, y, w, h) {
  var ctx,
      imgd,
      lineArr,
      i,j,
      ch,colchar,color,offset,
      lastcolor,
      place;

  x = x || icemap.config.map_x;
  y = y || icemap.config.map_y;
  w = w || icemap.config.map_w;
  h = h || icemap.config.map_h;

  var startTime = new Date();

  $("#charmap").html("");

  ctx = document.getElementById("hidden_map_canvas").getContext('2d');
  imgd = ctx.getImageData(x, y, w, h).data;

  for (j = 0; j < h; j++) {
    lineArr = ["<p>"];
    lastcolor = null;
    for (i = 0; i < w; i++) {
      offset = j*w*4 + i*4;
      color = new icemap.Color(imgd[offset], imgd[offset+1], imgd[offset+2]);

      if (!color.equals(lastcolor)) {
        colchar = icemap.get_char_for_color(color);
        if (i > 0) {
          lineArr.push('</b>');
        }
        lineArr.push('<b class="'+colchar["cl"]+'">');
      }

      ch = colchar["ch"];
      if (ch == '*') {
        ch = icemap.get_road_char(imgd, i, j, w, h);
      }

      // tagged places
      place = icemap.revplaces[(icemap.config.map_x+i)+'x'+(icemap.config.map_y+j)];
      if (place) {
        ch = '<a href="#!/goto/'+place['place']+'" title="'+place['text']+'">'+ch+'</a>';
      }

      lineArr.push(ch);
      lastcolor = color;
    }
    lineArr.push("</b></p>");
    $("#charmap").append(lineArr.join(""));
  }

  icemap.message("map draw time (js): "+(new Date() - startTime)+" ms");
}

icemap.get_char_for_color = function (color) {
  var key = ""+color;

  /** collecting color codes
   * if (typeof(icemap.colormap[key]) === 'undefined') {
   *  icemap.colormap[key] = {ch: '#', cl: "unknown"};
   *}
   */

  return icemap.colormap[key] || { ch: "#", cl: "unknown" };
}

icemap.get_road_char = function (imgd, x, y, width, height) {
  var offset = y*width*4 + x*4,
      roadchar = '+',
      o,nw,n,ne,w,e,sw,s,se;
  
  if (x > 1 && y > 1 && x < width && y < height) {
    o = offset - (width+1)*4;
    nw = icemap.colormap[""+ (new icemap.Color(imgd[o], imgd[o+1], imgd[o+2]))];
    o = o+4;
    n = icemap.colormap[""+(new icemap.Color(imgd[o], imgd[o+1], imgd[o+2]))];
    o = o+4;
    ne = icemap.colormap[""+(new icemap.Color(imgd[o], imgd[o+1], imgd[o+2]))];
    o = o+(width-2)*4;
    w = icemap.colormap[""+(new icemap.Color(imgd[o], imgd[o+1], imgd[o+2]))];
    o = o+4+4;
    e = icemap.colormap[""+(new icemap.Color(imgd[o], imgd[o+1], imgd[o+2]))];
    o = o+(width-2)*4;
    sw = icemap.colormap[""+(new icemap.Color(imgd[o], imgd[o+1], imgd[o+2]))];
    o = o+4;
    s = icemap.colormap[""+(new icemap.Color(imgd[o], imgd[o+1], imgd[o+2]))];
    o = o+4;
    se = icemap.colormap[""+(new icemap.Color(imgd[o], imgd[o+1], imgd[o+2]))];

    if (nw.ch == '.' || n.ch == '.' || ne.ch == '.' || w.ch == '.' ||
        e.ch == '.' || sw.ch == '.' || s.ch == '.' || se.ch == '.') {
      roadchar = '+';
    } else if (nw.ch == '*' && se.ch == '*') {
      roadchar = '\\';
    } else if (n.ch == '*' && s.ch == '*') {
      roadchar = '|';
    } else if (ne.ch == '*' && sw.ch == '*') {
      roadchar = '/';
    } else if (w.ch == '*' && e.ch == '*') {
      roadchar = '-';
    } 
  }

  return roadchar;
}

icemap.go_to = function (tag) {
  var place = icemap.places[tag];
  if (place) {
    icemap.go_pos(place['x'], place['y']);
  }
}

icemap.go_pos = function (x, y, center, $container) {
  icemap.go_rpos(x-icemap.config.map_x, y-icemap.config.map_y, center, $container);
}

icemap.go_rpos = function (rx, ry, center, $container) {
  var xr, yr;

  center = center || true;
  $container = $container || $('html,body'); // ff: html, chrome: body

  xr = $container.attr("scrollWidth") * rx / icemap.config.map_w;
  yr = $container.attr("scrollHeight") * ry / icemap.config.map_h;


  if (center && center !== 'false') {
    xr = xr - window.innerWidth/2;
    yr = yr - window.innerHeight/2;
  }

  xr = parseInt(xr);
  yr = parseInt(yr);

  $container.animate({ scrollLeft: xr, scrollTop: yr }, 500);
}

// needs to be below callable functions
icemap.cmdmap = {
  'goto': icemap.go_to,
  'rpos': icemap.go_rpos,
  'pos': icemap.go_pos
}

