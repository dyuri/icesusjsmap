var icemap = icemap || {};

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

icemap.Place = (function(){
  var Place = function (name, x, y, caption) {
    this.name = name;
    this.x = x;
    this.y = y;
    this.caption = caption;
  }

  return Place;
}())

icemap.CharMap = (function(){

  // reversed places map for lookup
  build_revplaces = function (places) {
    var i, p, key, revplaces = {};
    for (i = 0; i < places.length; i++) {
      p = places[i];
      key = p.x+'x'+p.y;
      revplaces[key] = p;
      revplaces[key]['place'] = p.name;
    }
    return revplaces;
  }

  // reversed colormap - for search
  build_revcolmap = function (colormap) {
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
  }

  var CharMap = function (places, colormap, container, config) {
    this.places = places || icemap.places;
    this.revplaces = build_revplaces(this.places);
    this.colormap = colormap || icemap.colormap;
    this.revcolmap = build_revcolmap(this.colormap);
    this.container = container || "html,body"; // ff vs. chrome
    this.$container = $(this.container);
    this.config = config || icemap.config;
  }


  CharMap.prototype.load_map = function (cb) {
    map_src = this.config.map_src;
    this.mapimage = new Image();
    this.mapimage.src = map_src;
    this.mapimage.onload = (function (map) { return function() { map.map_loaded.call(map, cb);} })(this);
  }

  CharMap.prototype.map_loaded = function (cb) {
    var m = this.mapimage,
        ctx;

    $(".hidden_map_canvas", this.$container).remove();
    this.$canvas = $('<canvas class="hidden_map_canvas hidden" width="'+m.width+'" height="'+m.height+'" />').appendTo(this.$container);

    this.ctx = this.$canvas[0].getContext('2d');
    this.ctx.drawImage(m, 0, 0);

    this.draw_charmap();

    if (cb) {
      cb.call(this);
    }
  }

  CharMap.prototype.draw_charmap = function (x, y, w, h) {
    var imgd,
        $charmap,
        lineArr,
        i,j,
        ch,colchar,color,offset,
        lastcolor,
        place;

    x = x || this.config.map_x;
    y = y || this.config.map_y;
    w = w || this.config.map_w;
    h = h || this.config.map_h;

    var startTime = new Date();

    $charmap = $(".charmap", this.$container).html("");

    imgd = this.ctx.getImageData(x, y, w, h).data;

    for (j = 0; j < h; j++) {
      lineArr = ["<p>"];
      lastcolor = null;
      for (i = 0; i < w; i++) {
        offset = j*w*4 + i*4;
        color = new icemap.Color(imgd[offset], imgd[offset+1], imgd[offset+2]);

        if (!color.equals(lastcolor)) {
          colchar = this.get_char_for_color(color);
          if (i > 0) {
            lineArr.push('</b>');
          }
          lineArr.push('<b class="'+colchar["cl"]+'">');
        }

        ch = colchar["ch"];
        if (ch == '*') {
          ch = this.get_road_char(imgd, i, j, w, h);
        }

        // tagged places
        place = this.revplaces[(this.config.map_x+i)+'x'+(this.config.map_y+j)];
        if (place) {
          ch = '<a href="#!/goto/'+place.name+'" title="'+place.caption+'">'+ch+'</a>';
        } else if (this.config.selector) {
          ch = '<a href="#!/pos/'+(x+i)+'/'+(y+j)+'">'+ch+'</a>';
        }

        lineArr.push(ch);
        lastcolor = color;
      }
      lineArr.push("</b></p>");
      $charmap.append(lineArr.join(""));
    }

    icemap.message("map draw time (js): "+(new Date() - startTime)+" ms");
  }

  CharMap.prototype.get_char_for_color = function (color) {
    var key = ""+color;

    return this.colormap[key] || { ch: "#", cl: "unknown" };
  }

  CharMap.prototype.get_road_char = function (imgd, x, y, width, height) {
    var offset = y*width*4 + x*4,
        roadchar = '+',
        o,nw,n,ne,w,e,sw,s,se;
    
    if (x > 1 && y > 1 && x < width && y < height) {
      o = offset - (width+1)*4;
      nw = this.colormap[""+ (new icemap.Color(imgd[o], imgd[o+1], imgd[o+2]))];
      o = o+4;
      n = this.colormap[""+(new icemap.Color(imgd[o], imgd[o+1], imgd[o+2]))];
      o = o+4;
      ne = this.colormap[""+(new icemap.Color(imgd[o], imgd[o+1], imgd[o+2]))];
      o = o+(width-2)*4;
      w = this.colormap[""+(new icemap.Color(imgd[o], imgd[o+1], imgd[o+2]))];
      o = o+4+4;
      e = this.colormap[""+(new icemap.Color(imgd[o], imgd[o+1], imgd[o+2]))];
      o = o+(width-2)*4;
      sw = this.colormap[""+(new icemap.Color(imgd[o], imgd[o+1], imgd[o+2]))];
      o = o+4;
      s = this.colormap[""+(new icemap.Color(imgd[o], imgd[o+1], imgd[o+2]))];
      o = o+4;
      se = this.colormap[""+(new icemap.Color(imgd[o], imgd[o+1], imgd[o+2]))];

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

  CharMap.prototype.go_to = function (tag) {
    var place, i;

    for (i = 0; i < this.places.length; i++) {
      if (this.places[i].name === tag) {
        place = this.places[i];
      }
    }

    if (place) {
      this.go_pos(place.x, place.y);
    }
  }

  CharMap.prototype.go_pos = function (x, y, center) {
    this.go_rpos(x-this.config.map_x, y-this.config.map_y, center);
  }

  CharMap.prototype.go_rpos = function (rx, ry, center) {
    var xr, yr;

    center = center || true;

    xr = this.$container.attr("scrollWidth") * rx / this.config.map_w;
    yr = this.$container.attr("scrollHeight") * ry / this.config.map_h;


    if (center && center !== 'false') {
      xr = xr - window.innerWidth/2;
      yr = yr - window.innerHeight/2;
    }

    xr = parseInt(xr);
    yr = parseInt(yr);

    this.$container.animate({ scrollLeft: xr, scrollTop: yr }, 500);
  }

  CharMap.prototype.toggle_selector = function () {
    this.config.selector = !this.config.selector;
  }

  return CharMap;

}())

icemap.config = {
  map_src: 'map.png',
  map_x: 400,
  map_y: 300,
  map_w: 800,
  map_h: 600,
  hashcmd: '!',
  selector: document.location.hash.search('selector') > -1 ? true : false,
  mapimage: null
}

icemap.places = [
  new icemap.Place('vaerlon', 505, 631, "City of Vaerlon"),
  new icemap.Place('atherton', 639, 416, "City-State of Atherton"),
  new icemap.Place('cenedoiss', 960, 693, "City-State of Cenedoiss"),
  new icemap.Place('graemor', 1085, 490, "City of Graemor")
]

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

icemap.init = function () {
  icemap.map = new icemap.CharMap();
  icemap.map.load_map(icemap.parse_hash);
  
  $(window).bind('hashchange', icemap.parse_hash);

  icemap.build_places_list(icemap.map.places);
  $("#places h1").bind("click", icemap.toggle_places);
}

icemap.log = function (message) {
  var ts = new Date().getTime(),
      $console = $("#console");

  if (window.console && console.log) {
    console.log("[icemap:"+ts+"] " + message);
  }
  if ($console) {
    $('<li id="log'+ts+'">'+message+'</li>').appendTo($console);
  }
}

icemap.message = function (message, id) {
  var ts = new Date().getTime();

  id = id || "msg"+ts;

  icemap.log("message: " + message);
  $('<li class="hidden" id="'+id+'" />').text(message).appendTo("#messages").show("fast");
}

icemap.clear_messages = function () {
  $("#messages").html("");
}

icemap.build_places_list = function (places) {
  var i, p;
  for (i = 0; i < places.length; i++) {
    p = places[i];
    $('<li><a href="#!/goto/'+p.name+'" title="'+p.caption+'">'+p.name+'</a></li>').appendTo("#places ul");
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
    icemap.log("calling: " + cmd + " parameters: " + cmdArr.join(', '));
    icemap.cmdmap[cmd].call(this, cmdArr);
  }
}

// needs to be below callable functions
icemap.cmdmap = {
  'redraw': function (params) { icemap.map.draw_charmap.apply(icemap.map, params); },
  'selector': function (params) { icemap.map.toggle_selector.apply(icemap.map, params); },
  'goto': function (params) { icemap.map.go_to.apply(icemap.map, params); },
  'rpos': function (params) { icemap.map.go_rpos.apply(icemap.map, params); },
  'pos': function (params) { icemap.map.go_pos.apply(icemap.map, params); }
}

