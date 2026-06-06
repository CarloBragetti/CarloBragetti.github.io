/* Officina dark — theme toggle + animated gears background */
(function () {
  "use strict";

  // ---- Theme toggle ----
  var root = document.documentElement;
  var btn = document.getElementById("theme-toggle");
  function current() {
    return root.getAttribute("data-theme") || "dark";
  }
  if (btn) {
    btn.addEventListener("click", function () {
      var next = current() === "dark" ? "light" : "dark";
      root.setAttribute("data-theme", next);
      try { localStorage.setItem("theme", next); } catch (e) {}
    });
  }

  // ---- Animated gears (respect reduced motion) ----
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var canvas = document.getElementById("bg-gears");
  if (!canvas || reduce) return;
  var ctx = canvas.getContext("2d");
  var W, H, dpr;

  function accent() {
    var c = getComputedStyle(root).getPropertyValue("--accent").trim();
    return c || "#ff8c1a";
  }

  // Gear definitions: position (ratio of W/H), radius, teeth, speed, direction
  var gears = [
    { x: 0.12, y: 0.22, r: 120, teeth: 14, spd: 0.10, dir: 1 },
    { x: 0.88, y: 0.68, r: 170, teeth: 18, spd: 0.07, dir: -1 },
    { x: 0.70, y: 0.12, r: 80,  teeth: 10, spd: 0.14, dir: 1 }
  ];

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = canvas.clientWidth; H = canvas.clientHeight;
    canvas.width = W * dpr; canvas.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function drawGear(cx, cy, r, teeth, angle, color) {
    var toothDepth = r * 0.16;
    var rOuter = r, rInner = r - toothDepth, rHole = r * 0.32;
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(angle);
    ctx.beginPath();
    var steps = teeth * 2;
    for (var i = 0; i <= steps; i++) {
      var a = (i / steps) * Math.PI * 2;
      var rad = i % 2 === 0 ? rOuter : rInner;
      var px = Math.cos(a) * rad, py = Math.sin(a) * rad;
      if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.lineWidth = 2;
    ctx.strokeStyle = color;
    ctx.stroke();
    // hub
    ctx.beginPath();
    ctx.arc(0, 0, rHole, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  var start = null;
  function frame(ts) {
    if (start === null) start = ts;
    var t = (ts - start) / 1000;
    ctx.clearRect(0, 0, W, H);
    ctx.globalAlpha = 0.22;
    var col = accent();
    for (var i = 0; i < gears.length; i++) {
      var g = gears[i];
      drawGear(g.x * W, g.y * H, g.r, g.teeth, t * g.spd * g.dir, col);
    }
    requestAnimationFrame(frame);
  }

  window.addEventListener("resize", resize);
  resize();
  requestAnimationFrame(frame);
})();
