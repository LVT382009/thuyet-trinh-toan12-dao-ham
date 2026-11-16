/* ============================================================
   ZEN — deck engine
   nav · reveal · count-up · SVG charts · secant→tangent · overview
   ============================================================ */
(function () {
  "use strict";

  /* ---------- constants ---------- */
  var SLIDES = Array.prototype.slice.call(document.querySelectorAll(".slide"));
  var N = SLIDES.length;
  /* prefers-reduced-motion bypassed by request — animations always run.
     To restore: var REDUCED = window.matchMedia("(prefers-reduced-motion: reduce)").matches; */
  var REDUCED = false;

  /* ---------- stage scaling ---------- */
  var stage = document.getElementById("stage");
  function fit() {
    var s = Math.min(window.innerWidth / 1920, window.innerHeight / 1080);
    stage.style.transform = "scale(" + s + ")";
  }
  window.addEventListener("resize", fit);

  /* ---------- KaTeX ---------- */
  if (window.renderMathInElement) {
    renderMathInElement(document.body, {
      delimiters: [
        { left: "\\[", right: "\\]", display: true },
        { left: "\\(", right: "\\)", display: false },
        { left: "$$", right: "$$", display: true }
      ],
      throwOnError: false
    });
  }

  /* ---------- helpers ---------- */
  function $(s, r) { return (r || document).querySelector(s); }
  function $all(s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); }
  function SVG(tag, attrs, parent) {
    var e = document.createElementNS("http://www.w3.org/2000/svg", tag);
    if (attrs) for (var k in attrs) e.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(e);
    return e;
  }
  function fmt(n, dec) {
    if (dec === undefined) dec = 0;
    var s = Number(n).toFixed(dec), p = s.split(".");
    p[0] = p[0].replace(/\B(?=(\d{3})+(?!\d))/g, " ");
    return p[1] ? p[0] + "," + p[1] : p[0];
  }
  function easeOut(t) { return 1 - Math.pow(1 - t, 3); }
  function easeInOut(t) { return t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }

  /* ============================================================
     CHART LIBRARY
     ============================================================ */
  function plot(el, cfg) {
    var w = el.clientWidth || 600, h = el.clientHeight || 360;
    var pad = Object.assign({ l: 58, r: 24, t: 30, b: 48 }, cfg.pad || {});
    var iw = w - pad.l - pad.r, ih = h - pad.t - pad.b;
    var svg = SVG("svg", { viewBox: "0 0 " + w + " " + h, width: w, height: h, role: "img" },
      el);
    svg.style.width = w + "px"; svg.style.height = h + "px";
    var X = function (v) { return pad.l + (v - cfg.x[0]) / (cfg.x[1] - cfg.x[0]) * iw; };
    var Y = function (v) { return pad.t + ih - (v - cfg.y[0]) / (cfg.y[1] - cfg.y[0]) * ih; };
    var MONO = "IBM Plex Mono, monospace", BODY = "Be Vietnam Pro, sans-serif";

    /* regions */
    (cfg.regions || []).forEach(function (r) {
      SVG("rect", { x: X(r.x0), y: pad.t, width: X(r.x1) - X(r.x0), height: ih,
        fill: r.color || "rgba(30,127,148,.10)" }, svg);
      if (r.label) {
        var t = SVG("text", { x: (X(r.x0) + X(r.x1)) / 2, y: pad.t + 16, "text-anchor": "middle",
          fill: r.labelColor || "#6B6656", "font-size": 12, "font-family": MONO }, svg);
        t.textContent = r.label;
      }
    });

    /* grid + ticks */
    var yticks = cfg.yticks || [];
    yticks.forEach(function (v) {
      SVG("line", { x1: pad.l, y1: Y(v), x2: pad.l + iw, y2: Y(v),
        stroke: "rgba(26,22,14,.10)", "stroke-width": 1 }, svg);
      var t = SVG("text", { x: pad.l - 10, y: Y(v) + 4, "text-anchor": "end",
        fill: "#8A8471", "font-size": 12, "font-family": MONO }, svg);
      t.textContent = cfg.yfmt ? cfg.yfmt(v) : fmt(v);
    });
    var xticks = cfg.xticks || [];
    xticks.forEach(function (v) {
      SVG("line", { x1: X(v), y1: pad.t + ih, x2: X(v), y2: pad.t + ih + 6,
        stroke: "rgba(26,22,14,.22)", "stroke-width": 1 }, svg);
      var t = SVG("text", { x: X(v), y: pad.t + ih + 22, "text-anchor": "middle",
        fill: "#8A8471", "font-size": 12, "font-family": MONO }, svg);
      t.textContent = cfg.xfmt ? cfg.xfmt(v) : fmt(v);
    });

    /* axes */
    SVG("line", { x1: pad.l, y1: pad.t, x2: pad.l, y2: pad.t + ih,
      stroke: "rgba(26,22,14,.22)", "stroke-width": 1.2 }, svg);
    SVG("line", { x1: pad.l, y1: pad.t + ih, x2: pad.l + iw, y2: pad.t + ih,
      stroke: "rgba(26,22,14,.22)", "stroke-width": 1.2 }, svg);

    /* axis unit labels */
    if (cfg.ylabel) {
      var yl = SVG("text", { x: pad.l, y: pad.t - 12, fill: "#6B6656", "font-size": 12.5,
        "font-family": MONO, "letter-spacing": ".08em" }, svg);
      yl.textContent = cfg.ylabel;
    }
    if (cfg.xlabel) {
      var xl = SVG("text", { x: pad.l + iw, y: pad.t - 12, "text-anchor": "end", fill: "#6B6656",
        "font-size": 12.5, "font-family": MONO, "letter-spacing": ".08em" }, svg);
      xl.textContent = cfg.xlabel;
    }

    /* reference lines */
    (cfg.hlines || []).forEach(function (l) {
      SVG("line", { x1: pad.l, y1: Y(l.y), x2: pad.l + iw, y2: Y(l.y),
        stroke: l.color, "stroke-width": l.width || 1.4,
        "stroke-dasharray": l.dash || "6 7", opacity: .85 }, svg);
      if (l.label) {
        var t = SVG("text", { x: l.side === "left" ? pad.l + 8 : pad.l + iw - 8,
          y: Y(l.y) - 8, "text-anchor": l.side === "left" ? "start" : "end",
          fill: l.color, "font-size": 13, "font-family": MONO, "font-weight": 600 }, svg);
        t.textContent = l.label;
      }
    });
    (cfg.vlines || []).forEach(function (l) {
      SVG("line", { x1: X(l.x), y1: pad.t, x2: X(l.x), y2: pad.t + ih,
        stroke: l.color, "stroke-width": l.width || 1.4,
        "stroke-dasharray": l.dash || "6 7", opacity: .85 }, svg);
      if (l.label) {
        var t = SVG("text", { x: X(l.x) + (l.side === "left" ? -8 : 8), y: pad.t + 16,
          "text-anchor": l.side === "left" ? "end" : "start",
          fill: l.color, "font-size": 13, "font-family": MONO, "font-weight": 600 }, svg);
        t.textContent = l.label;
      }
    });

    /* series */
    var animated = [];
    (cfg.series || []).forEach(function (s) {
      var d = "", i, x, y;
      var steps = s.steps || 140;
      for (i = 0; i <= steps; i++) {
        x = cfg.x[0] + (cfg.x[1] - cfg.x[0]) * i / steps;
        y = s.f(x);
        if (!isFinite(y)) continue;
        d += (i === 0 ? "M" : "L") + X(x).toFixed(2) + " " + Y(y).toFixed(2) + " ";
      }
      if (s.area) {
        var ad = d + "L" + X(cfg.x[1]).toFixed(2) + " " + Y(cfg.y[0]).toFixed(2) +
          " L" + X(cfg.x[0]).toFixed(2) + " " + Y(cfg.y[0]).toFixed(2) + " Z";
        SVG("path", { d: ad, fill: s.color, opacity: .10 }, svg);
      }
      var p = SVG("path", { d: d, fill: "none", stroke: s.color,
        "stroke-width": s.width || 2.6, "stroke-linecap": "round",
        "stroke-linejoin": "round" }, svg);
      if (s.dash) p.setAttribute("stroke-dasharray", s.dash);
      if (s.animate !== false && !REDUCED) animated.push(p);
    });

    /* tangents */
    (cfg.tangents || []).forEach(function (t) {
      var y0 = t.y - t.slope * (t.x - cfg.x[0]);
      var y1 = t.y - t.slope * (t.x - cfg.x[1]);
      SVG("line", { x1: X(cfg.x[0]), y1: Y(y0), x2: X(cfg.x[1]), y2: Y(y1),
        stroke: t.color, "stroke-width": 2.4, "stroke-dasharray": t.dash || "none",
        opacity: .95 }, svg);
    });

    /* points + callouts */
    (cfg.points || []).forEach(function (p) {
      var cx = X(p.x), cy = Y(p.y);
      if (p.ring !== false)
        SVG("circle", { cx: cx, cy: cy, r: p.r || 8, fill: "none",
          stroke: p.color, "stroke-width": 1.6, opacity: .5 }, svg);
      SVG("circle", { cx: cx, cy: cy, r: (p.r || 8) * .55, fill: p.color,
        stroke: "rgba(26,22,14,.22)", "stroke-width": 2 }, svg);
      if (p.label) {
        var anchor = p.pos === "left" ? "end" : (p.pos === "right" ? "start" : "middle");
        var tx = cx + (p.dx || 0), ty = cy + (p.dy || -16);
        var t = SVG("text", { x: tx, y: ty, "text-anchor": anchor, fill: p.color,
          "font-size": p.fs || 14, "font-family": MONO, "font-weight": 600 }, svg);
        t.textContent = p.label;
        if (p.sub) {
          var st = SVG("text", { x: tx, y: ty + 16, "text-anchor": anchor, fill: "#6B6656",
            "font-size": 12, "font-family": MONO }, svg);
          st.textContent = p.sub;
        }
      }
    });

    /* free notes */
    (cfg.notes || []).forEach(function (n) {
      var t = SVG("text", { x: X(n.x), y: Y(n.y), "text-anchor": n.anchor || "middle",
        fill: n.color || "#6B6656", "font-size": n.fs || 13,
        "font-family": n.mono === false ? BODY : MONO }, svg);
      t.textContent = n.text;
    });

    /* draw-in animation */
    function play() {
      animated.forEach(function (p, i) {
        var len = p.getTotalLength();
        p.style.transition = "none";
        p.style.strokeDasharray = len;
        p.style.strokeDashoffset = len;
        p.getBoundingClientRect();
        p.style.transition = "stroke-dashoffset 1.15s cubic-bezier(.32,.72,0,1) " + (i * .12) + "s";
        p.style.strokeDashoffset = "0";
      });
    }
    return { play: play, svg: svg };
  }

  /* ============================================================
     CHARTS
     ============================================================ */
  var charts = {};

  function buildCharts() {
    /* --- slide 2 : R(p) = -300p^2 + 57000p --- */
    var el = $("#ch-rp");
    if (el) {
      charts.rp = plot(el, {
        x: [0, 190], y: [0, 2900],
        xticks: [0, 50, 100, 150, 190], yticks: [0, 900, 1800, 2700],
        xfmt: function (v) { return v; }, yfmt: function (v) { return fmt(v); },
        xlabel: "p (nghìn đồng)", ylabel: "R (triệu đồng)",
        series: [{ f: function (p) { return (-300 * p * p + 57000 * p) / 1000; }, color: "#A87A20", width: 3 }],
        vlines: [{ x: 95, color: "#1E7F94", label: "p = 95", side: "right" }],
        hlines: [{ y: 2707.5, color: "#1E7F94", label: "2 707 500", side: "right", width: 1.2 }],
        points: [{ x: 95, y: 2707.5, color: "#1E7F94", label: "ĐỈNH", sub: "p = 95 · x = 28 500", pos: "left", dx: -14, dy: -18 }]
      });
    }

    /* --- slide 5 : P(t) = 25 + 100/(t^2+1) --- */
    el = $("#ch-bp");
    if (el) {
      charts.bp = plot(el, {
        x: [0, 10], y: [0, 140],
        xticks: [0, 2, 4, 6, 8, 10], yticks: [0, 25, 50, 75, 100, 125],
        xlabel: "t (giây)", ylabel: "mmHg",
        series: [{ f: function (t) { return 25 + 100 / (t * t + 1); }, color: "#1E7F94", width: 3 }],
        tangents: [{ x: 5, y: 25 + 100 / 26, slope: -200 * 5 / Math.pow(26, 2), color: "#A87A20" }],
        vlines: [{ x: 5, color: "#A87A20", label: "t = 5", side: "right" }],
        points: [
          { x: 0, y: 125, color: "#1A160E", label: "125", pos: "right", dx: 12, dy: -8 },
          { x: 5, y: 25 + 100 / 26, color: "#A87A20", label: "−1,48 mmHg/s", pos: "right", dx: 12, dy: 26 }
        ],
        notes: [{ x: 5, y: 12, text: "tiếp tuyến tại t = 5 — hệ số góc âm ⇒ đang giảm", color: "#6B6656" }]
      });
    }

    /* --- slide 6 : S(r) = 2πr² + 2000/r --- */
    el = $("#ch-cyl");
    if (el) {
      charts.cyl = plot(el, {
        x: [1, 11], y: [0, 1100],
        xticks: [2, 4, 6, 8, 10], yticks: [250, 500, 750, 1000],
        xlabel: "r (cm)", ylabel: "S (cm²)",
        pad: { l: 46, r: 16, t: 24, b: 34 },
        series: [{ f: function (r) { return 2 * Math.PI * r * r + 2000 / r; }, color: "#1E7F94", width: 2.6 }],
        vlines: [{ x: 5.4193, color: "#A87A20", label: "r = 5,4193", side: "left", width: 1.2 }],
        hlines: [{ y: 553.8, color: "#A87A20", label: "S min = 553,8", side: "right", width: 1.2 }],
        points: [{ x: 5.4193, y: 553.8, color: "#A87A20", ring: true }]
      });
    }

    /* --- slide 6 : river diagram --- */
    el = $("#ch-river");
    if (el) buildRiver(el);

    /* --- slide 6 : time bar chart --- */
    el = $("#ch-timebar");
    if (el) buildTimebar(el);

    /* --- slide 7 : R(x) vs P(x) — cùng biến x --- */
    el = $("#ch-tv");
    if (el) {
      charts.tv = plot(el, {
        x: [700, 3700], y: [0, 20000],
        xticks: [1000, 1500, 2000, 2500, 3000, 3500],
        yticks: [0, 5000, 10000, 15000, 20000],
        xfmt: function (v) { return fmt(v); }, yfmt: function (v) { return fmt(v); },
        xlabel: "x (chiếc / tuần)", ylabel: "triệu đồng",
        pad: { l: 56, r: 18, t: 26, b: 42 },
        series: [
          { f: function (x) { return -x * x / 200 + 19 * x; }, color: "#A87A20", width: 2.8 },
          { f: function (x) { return -x * x / 200 + 22 * x - 12000; }, color: "#6A55C0", width: 2.8 }
        ],
        points: [
          { x: 1900, y: 18050, color: "#A87A20", label: "R max · x = 1 900 · p = 9,5", pos: "left", dx: -14, dy: -14, fs: 13 },
          { x: 2200, y: 12200, color: "#6A55C0", label: "P max · x = 2 200 · giá 8", pos: "right", dx: 14, dy: 24, fs: 13 }
        ],
        notes: [{ x: 3300, y:  17500, text: "hai đỉnh lệch nhau 300 đơn vị", color: "#6B6656", anchor: "middle" }]
      });
    }

    /* --- slide 3 : secant -> tangent --- */
    el = $("#ch-secant");
    if (el) buildSecant(el);
  }

  /* ---------- river diagram (Anh An) ---------- */
  function buildRiver(el) {
    var w = el.clientWidth || 720, h = el.clientHeight || 300;
    var svg = SVG("svg", { viewBox: "0 0 720 300", width: w, height: h, role: "img",
      "aria-label": "Sơ đồ sông: A bờ trái, C đối diện, B cách C 8 km, D giữa C và B" }, el);
    svg.style.width = w + "px"; svg.style.height = h + "px";
    var MONO = "IBM Plex Mono, monospace", BODY = "Be Vietnam Pro, sans-serif";
    function sx(x) { return x / 720 * w; }
    function sy(y) { return y / 300 * h; }

    /* water */
    SVG("rect", { x: sx(280), y: sy(14), width: sx(160), height: sy(272), rx: 10,
      fill: "rgba(30,127,148,.12)" }, svg);
    for (var i = 0; i < 7; i++) {
      var wx = 294 + i * 18;
      var d = "M" + sx(wx) + " " + sy(26);
      for (var yy = 26; yy <= 280; yy += 22) {
        d += " q " + sx(7) + " " + sy(8) + " 0 " + sy(15);
      }
      SVG("path", { d: d, fill: "none", stroke: "rgba(30,127,148,.34)", "stroke-width": 1.4 }, svg);
    }
    /* banks */
    SVG("line", { x1: sx(280), y1: sy(14), x2: sx(280), y2: sy(286), stroke: "rgba(26,22,14,.28)", "stroke-width": 1.6 }, svg);
    SVG("line", { x1: sx(440), y1: sy(14), x2: sx(440), y2: sy(286), stroke: "rgba(26,22,14,.28)", "stroke-width": 1.6 }, svg);

    var A = { x: 80, y: 44 }, C = { x: 460, y: 44 }, B = { x: 460, y: 264 };
    var D = { x: 460, y: 44 + (3.4017 / 8) * 220 };

    /* routes */
    SVG("line", { x1: sx(A.x), y1: sy(A.y), x2: sx(C.x), y2: sy(C.y), stroke: "#A87A20", "stroke-width": 3 }, svg);
    SVG("line", { x1: sx(A.x), y1: sy(A.y), x2: sx(B.x), y2: sy(B.y), stroke: "#2E7D4F", "stroke-width": 2.2, "stroke-dasharray": "6 7", opacity: .8 }, svg);
    var route = SVG("line", { x1: sx(A.x), y1: sy(A.y), x2: sx(D.x), y2: sy(D.y), stroke: "#6A55C0", "stroke-width": 3 }, svg);
    SVG("line", { x1: sx(D.x), y1: sy(D.y), x2: sx(B.x), y2: sy(B.y), stroke: "#6A55C0", "stroke-width": 3, "stroke-dasharray": "2 8", "stroke-linecap": "round" }, svg);

    /* distance braces */
    SVG("line", { x1: sx(345), y1: sy(50), x2: sx(345), y2: sy(D.y), stroke: "#1A160E", "stroke-width": 1.2, "stroke-dasharray": "3 5" }, svg);

    /* points */
    function pt(p, c, r) { SVG("circle", { cx: sx(p.x), cy: sy(p.y), r: r || 6, fill: c, stroke: "rgba(26,22,14,.22)", "stroke-width": 2 }, svg); }
    pt(A, "#1A160E"); pt(C, "#A87A20"); pt(D, "#6A55C0"); pt(B, "#2E7D4F");

    function lab(x, y, text, color, anchor, size) {
      var t = SVG("text", { x: sx(x), y: sy(y), "text-anchor": anchor || "middle", fill: color,
        "font-size": size || 14, "font-family": MONO, "font-weight": 600 }, svg);
      t.textContent = text;
      return t;
    }
    lab(80, 28, "A", "#1A160E"); lab(478, 40, "C", "#A87A20");
    lab(478, 134, "D", "#6A55C0"); lab(478, 268, "B", "#2E7D4F");
    lab(270, 32, "3 km", "#A87A20");
    lab(472, 96, "x", "#1A160E", "start");
    lab(472, 206, "8 km", "#1A160E", "start");
    lab(270, 62, "chèo 6 km/h", "#6A55C0", "middle", 13);
    lab(460, 290, "chạy 8 km/h", "#2E7D4F", "middle", 13);

    /* boat + runner */
    var boat = SVG("g", {}, svg);
    SVG("path", { d: "M-11 6 L11 6 L6 13 L-6 13 Z", fill: "#6A55C0" }, boat);
    SVG("line", { x1: 0, y1: 6, x2: 0, y2: -9, stroke: "#6A55C0", "stroke-width": 1.6 }, boat);
    var runner = SVG("circle", { r: 6, fill: "#2E7D4F", stroke: "rgba(26,22,14,.22)", "stroke-width": 2 }, svg);

    function lerp(a, b, t) { return a + (b - a) * t; }
    function render(t) {
      var e = easeInOut(t);
      var bt = clamp(e / .62, 0, 1);
      var rt = clamp((e - .34) / .66, 0, 1);
      var bx = lerp(A.x, D.x, bt), by = lerp(A.y, D.y, bt);
      boat.setAttribute("transform", "translate(" + sx(bx) + " " + sy(by) + ") rotate(" + (bt * 12) + ")");
      boat.setAttribute("opacity", bt >= 1 ? "0" : "1");
      var rx = lerp(D.x, B.x, rt), ry = lerp(D.y, B.y, rt);
      runner.setAttribute("cx", sx(rx)); runner.setAttribute("cy", sy(ry));
      runner.setAttribute("opacity", rt <= 0 ? "0" : "1");
    }
    var raf = null;
    function play() {
      if (raf) cancelAnimationFrame(raf);
      if (REDUCED) { render(1); boat.setAttribute("opacity", "0"); runner.setAttribute("opacity", "1"); return; }
      var t0 = null, dur = 2400;
      function step(ts) {
        if (!t0) t0 = ts;
        var t = clamp((ts - t0) / dur, 0, 1);
        render(t);
        if (t < 1) raf = requestAnimationFrame(step); else raf = null;
      }
      render(0);
      raf = requestAnimationFrame(step);
    }
    function stop() { if (raf) { cancelAnimationFrame(raf); raf = null; } }
    render(1); boat.setAttribute("opacity", "0"); runner.setAttribute("opacity", "1");
    charts.river = { play: play, stop: stop };
  }

  /* ---------- time bar chart ---------- */
  function buildTimebar(el) {
    var w = el.clientWidth || 600, h = el.clientHeight || 300;
    var svg = SVG("svg", { viewBox: "0 0 " + w + " " + h, width: w, height: h, role: "img" }, el);
    svg.style.width = w + "px"; svg.style.height = h + "px";
    var data = [
      { lab: "Chèo thẳng C, chạy C→B", v: 1.5, c: "#6B6656" },
      { lab: "Chèo thẳng B", v: 1.4240, c: "#6B6656" },
      { lab: "Chèo đến D, chạy D→B", v: 1.3307, c: "#2E7D4F" }
    ];
    var max = 1.6, padL = 12, padR = 12, padT = 26, padB = 54;
    var bw = (w - padL - padR) / data.length;
    var Y = function (v) { return padT + (h - padT - padB) * (1 - v / max); };
    data.forEach(function (d, i) {
      var x = padL + bw * i + bw * .18, bwid = bw * .64;
      var y = Y(d.v), bh = h - padB - y;
      var r = SVG("rect", { x: x, y: y, width: bwid, height: bh, rx: 8, fill: d.c, opacity: d.c === "#2E7D4F" ? .9 : .32 }, svg);
      r.style.transformOrigin = x + "px " + (h - padB) + "px";
      if (!REDUCED) { r.style.transition = "transform .9s cubic-bezier(.32,.72,0,1) " + (i * .12) + "s"; }
      var vt = SVG("text", { x: x + bwid / 2, y: y - 10, "text-anchor": "middle", fill: d.c,
        "font-size": 19, "font-family": "IBM Plex Mono", "font-weight": 600 }, svg);
      vt.textContent = fmt(d.v, d.v === 1.5 ? 1 : 4);
      var lt = SVG("text", { x: x + bwid / 2, y: h - padB + 22, "text-anchor": "middle",
        fill: "#6B6656", "font-size": 12.5, "font-family": "Be Vietnam Pro" }, svg);
      lt.textContent = d.lab;
      if (i === 2) {
        var tag = SVG("text", { x: x + bwid / 2, y: h - padB + 42, "text-anchor": "middle",
          fill: "#2E7D4F", "font-size": 12, "font-family": "IBM Plex Mono" }, svg);
        tag.textContent = "TỐI ƯU";
      }
    });
    SVG("line", { x1: padL, y1: h - padB, x2: w - padR, y2: h - padB,
      stroke: "rgba(26,22,14,.22)", "stroke-width": 1.2 }, svg);
    charts.timebar = { play: function () {
      if (REDUCED) return;
      $all("rect", svg).forEach(function (r) {
        r.style.transform = "scaleY(0)";
        r.getBoundingClientRect();
        r.style.transform = "scaleY(1)";
      });
    } };
  }

  /* ---------- secant -> tangent ---------- */
  function buildSecant(el) {
    var w = el.clientWidth || 640, h = el.clientHeight || 380;
    var pad = { l: 46, r: 20, t: 26, b: 40 };
    var iw = w - pad.l - pad.r, ih = h - pad.t - pad.b;
    var X = function (v) { return pad.l + v / 10 * iw; };
    var Y = function (v) { return pad.t + ih - v / 70 * ih; };
    var f = function (x) { return 10 + 3 * x + 0.25 * x * x; };
    var fp = function (x) { return 3 + 0.5 * x; };
    var svg = SVG("svg", { viewBox: "0 0 " + w + " " + h, width: w, height: h, role: "img" }, el);
    svg.style.width = w + "px"; svg.style.height = h + "px";

    /* axes */
    SVG("line", { x1: pad.l, y1: pad.t, x2: pad.l, y2: pad.t + ih, stroke: "rgba(26,22,14,.22)", "stroke-width": 1.2 }, svg);
    SVG("line", { x1: pad.l, y1: pad.t + ih, x2: pad.l + iw, y2: pad.t + ih, stroke: "rgba(26,22,14,.22)", "stroke-width": 1.2 }, svg);
    [0, 2, 4, 6, 8, 10].forEach(function (v) {
      var t = SVG("text", { x: X(v), y: pad.t + ih + 20, "text-anchor": "middle", fill: "#8A8471", "font-size": 11.5, "font-family": "IBM Plex Mono" }, svg);
      t.textContent = v;
    });
    var xl = SVG("text", { x: pad.l + iw, y: pad.t - 10, "text-anchor": "end", fill: "#6B6656", "font-size": 12, "font-family": "IBM Plex Mono" }, svg);
    xl.textContent = "x";
    var yl = SVG("text", { x: pad.l - 34, y: pad.t - 10, fill: "#6B6656", "font-size": 12, "font-family": "IBM Plex Mono" }, svg);
    yl.textContent = "y";

    /* curve */
    var d = "";
    for (var i = 0; i <= 120; i++) {
      var x = i / 12, y = f(x);
      d += (i ? "L" : "M") + X(x).toFixed(2) + " " + Y(y).toFixed(2) + " ";
    }
    SVG("path", { d: d, fill: "none", stroke: "#1A160E", "stroke-width": 2.4, opacity: .9 }, svg);

    /* tangent (hidden initially) */
    var tang = SVG("line", { x1: X(0), y1: Y(f(2) - fp(2) * 2), x2: X(10), y2: Y(f(2) + fp(2) * 8),
      stroke: "#1E7F94", "stroke-width": 3, opacity: 0 }, svg);
    var tangLab = SVG("text", { x: X(9.4), y: Y(f(2) + fp(2) * 7.4) + 34, "text-anchor": "end",
      fill: "#1E7F94", "font-size": 14, "font-family": "IBM Plex Mono", "font-weight": 600, opacity: 0 }, svg);
    tangLab.textContent = "tiếp tuyến: f'(x₁)";

    /* secants */
    var sec1 = SVG("line", { stroke: "#A87A20", "stroke-width": 2.4, "stroke-dasharray": "7 6" }, svg);
    var sec2 = SVG("line", { stroke: "#6A55C0", "stroke-width": 2.4, "stroke-dasharray": "7 6" }, svg);
    var dotA = SVG("circle", { r: 6, fill: "#1A160E", stroke: "rgba(26,22,14,.22)", "stroke-width": 2 }, svg);
    var dotB = SVG("circle", { r: 6, fill: "#A87A20", stroke: "rgba(26,22,14,.22)", "stroke-width": 2 }, svg);
    var dotB2 = SVG("circle", { r: 6, fill: "#6A55C0", stroke: "rgba(26,22,14,.22)", "stroke-width": 2 }, svg);
    var labA = SVG("text", { fill: "#1A160E", "font-size": 13.5, "font-family": "IBM Plex Mono", "font-weight": 600 }, svg);
    labA.textContent = "A(x₁; f(x₁))";
    var labB = SVG("text", { fill: "#A87A20", "font-size": 13.5, "font-family": "IBM Plex Mono", "font-weight": 600 }, svg);
    labB.textContent = "B(x₂; f(x₂))";
    var labB2 = SVG("text", { fill: "#6A55C0", "font-size": 13.5, "font-family": "IBM Plex Mono", "font-weight": 600 }, svg);
    labB2.textContent = "B'(x₂'; f(x₂'))";

    /* delta triangle */
    var tri = SVG("path", { fill: "rgba(30,127,148,.16)", stroke: "#1E7F94", "stroke-width": 1.6 }, svg);
    var dxLab = SVG("text", { fill: "#1E7F94", "font-size": 13, "font-family": "IBM Plex Mono", "font-weight": 600 }, svg);
    dxLab.textContent = "Δx";
    var dyLab = SVG("text", { fill: "#1E7F94", "font-size": 13, "font-family": "IBM Plex Mono", "font-weight": 600 }, svg);
    dyLab.textContent = "Δy";

    var A = { x: 2, y: f(2) };
    var B0 = { x: 8, y: f(8) };
    var B20 = { x: 5, y: f(5) };
    var B1 = { x: 2.55, y: f(2.55) };
    var B21 = { x: 2.2, y: f(2.2) };

    function render(t) {
      /* t in [0,1] */
      var e = easeInOut(t);
      var bx = B0.x + (B1.x - B0.x) * e, by = B0.y + (B1.y - B0.y) * e;
      var b2x = B20.x + (B21.x - B20.x) * e, b2y = B20.y + (B21.y - B20.y) * e;

      sec1.setAttribute("x1", X(A.x)); sec1.setAttribute("y1", Y(A.y));
      sec1.setAttribute("x2", X(bx)); sec1.setAttribute("y2", Y(by));
      sec2.setAttribute("x1", X(A.x)); sec2.setAttribute("y1", Y(A.y));
      sec2.setAttribute("x2", X(b2x)); sec2.setAttribute("y2", Y(b2y));
      dotA.setAttribute("cx", X(A.x)); dotA.setAttribute("cy", Y(A.y));
      dotB.setAttribute("cx", X(bx)); dotB.setAttribute("cy", Y(by));
      dotB2.setAttribute("cx", X(b2x)); dotB2.setAttribute("cy", Y(b2y));

      labA.setAttribute("x", X(A.x) - 12); labA.setAttribute("y", Y(A.y) + 24);
      labB.setAttribute("x", X(bx) + 12); labB.setAttribute("y", Y(by) - 12);
      labB2.setAttribute("x", X(b2x) + 12); labB2.setAttribute("y", Y(b2y) - 12);
      labB.setAttribute("opacity", String(clamp(1.4 - e * 1.6, 0, 1)));
      labB2.setAttribute("opacity", String(clamp(1.4 - e * 1.6, 0, 1)));

      /* triangle A -> (bx,A.y) -> B */
      var cx = X(bx), cy = Y(A.y);
      tri.setAttribute("d", "M" + X(A.x) + " " + Y(A.y) + " L" + cx + " " + cy + " L" + cx + " " + Y(by) + " Z");
      tri.setAttribute("opacity", String(clamp(1 - e * 1.25, 0, 1)));
      dxLab.setAttribute("x", (X(A.x) + cx) / 2); dxLab.setAttribute("y", Y(A.y) + 18);
      dxLab.setAttribute("opacity", String(clamp(1 - e * 1.25, 0, 1)));
      dyLab.setAttribute("x", cx + 8); dyLab.setAttribute("y", (Y(A.y) + Y(by)) / 2);
      dyLab.setAttribute("opacity", String(clamp(1 - e * 1.25, 0, 1)));

      var to = clamp((e - .62) / .38, 0, 1);
      tang.setAttribute("opacity", String(to));
      tangLab.setAttribute("opacity", String(to));
      sec1.setAttribute("opacity", String(1 - .7 * to));
      sec2.setAttribute("opacity", String(1 - .7 * to));
    }

    var raf = null;
    function play() {
      if (raf) cancelAnimationFrame(raf);
      if (REDUCED) { render(1); return; }
      var t0 = null, dur = 2600;
      function step(ts) {
        if (!t0) t0 = ts;
        var t = clamp((ts - t0) / dur, 0, 1);
        render(t);
        if (t < 1) raf = requestAnimationFrame(step); else raf = null;
      }
      render(0);
      raf = requestAnimationFrame(step);
    }
    function stop() { if (raf) { cancelAnimationFrame(raf); raf = null; } }
    render(1);
    charts.secant = { play: play, stop: stop };
  }

  /* ============================================================
     COVER CROWD
     ============================================================ */
  function buildCrowd() {
    var g = $("#crowd");
    if (!g) return;
    var cols = ["#A87A20", "#1E7F94", "#1A160E", "#6A55C0", "#2E7D4F"];
    for (var i = 0; i < 190; i++) {
      var a = Math.random() * Math.PI * 2;
      var rx = 232 + Math.random() * 62, ry = 192 + Math.random() * 54;
      var x = 380 + Math.cos(a) * rx, y = 360 + Math.sin(a) * ry;
      var c = SVG("circle", { cx: x.toFixed(1), cy: y.toFixed(1),
        r: (1.2 + Math.random() * 2.2).toFixed(2),
        fill: cols[i % cols.length], opacity: (0.18 + Math.random() * 0.5).toFixed(2) }, g);
      if (!REDUCED) {
        c.style.animation = "floaty " + (4 + Math.random() * 5).toFixed(2) + "s ease-in-out " +
          (-Math.random() * 5).toFixed(2) + "s infinite";
      }
    }
  }

  /* ============================================================
     NAVIGATION
     ============================================================ */
  var cur = 0;
  var prog = $("#prog"), dotsEl = $("#dots"), curEl = $("#cur");
  for (var i = 0; i < N; i++) {
    var d = document.createElement("span");
    d.className = "dot" + (i === 0 ? " on" : "");
    dotsEl.appendChild(d);
  }
  var dots = $all(".dot", dotsEl);

  function updateChrome() {
    prog.style.inset = "0 " + (100 - (cur + 1) / N * 100) + "% 0 0";
    curEl.textContent = String(cur + 1);
    dots.forEach(function (d, i) { d.classList.toggle("on", i === cur); });
    if (location.hash !== "#" + (cur + 1)) history.replaceState(null, "", "#" + (cur + 1));
  }

  function playSlide(i) {
    var s = SLIDES[i];
    /* charts */
    if (i === 1 && charts.rp) charts.rp.play();
    if (i === 2 && charts.secant) charts.secant.play();
    if (i === 4 && charts.bp) charts.bp.play();
    if (i === 5) { if (charts.cyl) charts.cyl.play(); if (charts.timebar) charts.timebar.play(); if (charts.river) charts.river.play(); }
    if (i === 6 && charts.tv) charts.tv.play();
    /* count-up */
    $all("[data-count]", s).forEach(function (el) {
      var target = parseFloat(el.getAttribute("data-count"));
      var dec = parseInt(el.getAttribute("data-dec") || "0", 10);
      if (REDUCED) { el.textContent = fmt(target, dec); return; }
      var t0 = null, dur = 950;
      function step(ts) {
        if (!t0) t0 = ts;
        var t = clamp((ts - t0) / dur, 0, 1);
        el.textContent = fmt(target * easeOut(t), dec);
        if (t < 1 && el.closest(".slide").classList.contains("active")) requestAnimationFrame(step);
      }
      requestAnimationFrame(step);
    });
    /* math render entrance */
    if (!REDUCED) {
      var maths = $all(".katex", s);
      maths.forEach(function (m, j) {
        m.classList.remove("katex-ent", "in");
        void m.offsetWidth;
        m.classList.add("katex-ent");
        m.style.setProperty("--md", (j * 0.05) + "s");
        requestAnimationFrame(function () { m.classList.add("in"); });
      });
    }
  }

  function go(i, dir) {
    i = clamp(i, 0, N - 1);
    if (i === cur && SLIDES[i].classList.contains("active")) return;
    var old = SLIDES[cur];
    var next = SLIDES[i];
    if (charts.secant && cur === 2) charts.secant.stop();
    old.classList.remove("active", "before");
    next.classList.toggle("before", (dir || 1) < 0);
    /* force reflow so the incoming transition runs */
    void next.offsetWidth;
    next.classList.add("active");
    cur = i;
    updateChrome();
    playSlide(i);
  }

  function next() { go(cur + 1, 1); }
  function prev() { go(cur - 1, -1); }

  $("#next").addEventListener("click", next);
  $("#prev").addEventListener("click", prev);

  /* ============================================================
     OVERVIEW
     ============================================================ */
  var ov = $("#overview"), ovGrid = $("#ov-grid"), ovBuilt = false;
  function buildOverview() {
    if (ovBuilt) return;
    ovBuilt = true;
    SLIDES.forEach(function (s, i) {
      var cell = document.createElement("div");
      cell.className = "ov-cell";
      var frame = document.createElement("div");
      frame.className = "frame";
      var ifr = document.createElement("iframe");
      ifr.src = "index.html?only=" + (i + 1);
      ifr.loading = "lazy";
      frame.appendChild(ifr);
      var num = document.createElement("span");
      num.className = "ov-num"; num.textContent = (i + 1);
      var cap = document.createElement("div");
      cap.className = "ov-cap";
      cap.innerHTML = "<b>" + (i + 1) + "</b> " + (s.getAttribute("data-title") || "");
      cell.appendChild(frame); cell.appendChild(num); cell.appendChild(cap);
      cell.addEventListener("click", function () { closeOverview(); go(i, 1); });
      ovGrid.appendChild(cell);
    });
    requestAnimationFrame(function () {
      $all(".ov-cell", ovGrid).forEach(function (cell) {
        var f = $(".frame", cell);
        var sc = cell.clientWidth / 1920;
        f.style.transform = "scale(" + sc + ")";
        f.style.height = "1080px";
        cell.style.height = (cell.clientWidth * 9 / 16) + "px";
      });
    });
  }
  function openOverview() { buildOverview(); ov.classList.add("open"); }
  function closeOverview() { ov.classList.remove("open"); }
  $("#ov-close").addEventListener("click", closeOverview);

  /* ============================================================
     HELP / TOAST / FULLSCREEN
     ============================================================ */
  var help = $("#help"), toast = $("#toast"), toastT = null;
  function showToast(html) {
    toast.innerHTML = html;
    toast.classList.add("show");
    clearTimeout(toastT);
    toastT = setTimeout(function () { toast.classList.remove("show"); }, 1900);
  }
  $("#help-close").addEventListener("click", function () { help.classList.remove("open"); });

  function toggleFullscreen() {
    if (document.fullscreenElement) document.exitFullscreen();
    else if (document.documentElement.requestFullscreen) document.documentElement.requestFullscreen();
  }

  /* ---------- keyboard ---------- */
  document.addEventListener("keydown", function (e) {
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    var k = e.key;
    if (k === "ArrowRight" || k === " " || k === "PageDown") { e.preventDefault(); next(); }
    else if (k === "ArrowLeft" || k === "PageUp") { e.preventDefault(); prev(); }
    else if (k === "Home") { e.preventDefault(); go(0, -1); }
    else if (k === "End") { e.preventDefault(); go(N - 1, 1); }
    else if (k >= "1" && k <= String(N)) { go(parseInt(k, 10) - 1, 1); }
    else if (k === "o" || k === "O") { ov.classList.contains("open") ? closeOverview() : openOverview(); }
    else if (k === "r" || k === "R") {
      if (cur === 2 && charts.secant) { charts.secant.play(); showToast("<b>R</b> — chạy lại dây cung → tiếp tuyến"); }
      else { go(cur, 1); showToast("<b>R</b> — chạy lại hiệu ứng trang"); }
    }
    else if (k === "f" || k === "F") { toggleFullscreen(); }
    else if (k === "Escape") { help.classList.remove("open"); closeOverview(); }
    else if (k === "?" || k === "/") { help.classList.toggle("open"); }
  });

  /* ---------- touch swipe ---------- */
  var tx = null;
  stage.addEventListener("touchstart", function (e) { tx = e.touches[0].clientX; }, { passive: true });
  stage.addEventListener("touchend", function (e) {
    if (tx === null) return;
    var dx = e.changedTouches[0].clientX - tx;
    if (Math.abs(dx) > 60) (dx < 0 ? next() : prev());
    tx = null;
  }, { passive: true });

  /* ---------- replay button (slide 3) ---------- */
  var btnT = $("#btn-tangent");
  if (btnT) btnT.addEventListener("click", function () {
    if (charts.secant) { charts.secant.play(); showToast("<b>↻</b> — dây cung trượt về tiếp tuyến"); }
  });

  /* ---------- deep link ?only=n / #n ---------- */
  var params = new URLSearchParams(location.search);
  var only = params.get("only");
  if (only) {
    document.body.classList.add("only");
    var idx = clamp(parseInt(only, 10) - 1, 0, N - 1);
    SLIDES.forEach(function (s, i) { s.classList.toggle("active", i === idx); });
    cur = idx;
    fit();
    buildCharts();
    buildCrowd();
    playSlide(idx);
    return;
  }

  /* ---------- init ---------- */
  fit();
  buildCharts();
  buildCrowd();
  var h = parseInt((location.hash || "").replace("#", ""), 10);
  var start = isNaN(h) ? 0 : clamp(h - 1, 0, N - 1);
  SLIDES.forEach(function (s, i) { s.classList.toggle("active", i === start); });
  cur = start;
  updateChrome();
  playSlide(start);
})();
