/* case3d.js — the jewel case in the first viewport.
   A Three.js scene: black jewel-case plastic, a red cover slick, a chrome
   hinge, and one iridescent disc. Drag to turn it; open it and the disc lifts.
   If WebGL or Three.js is unavailable the CSS case in index.html stands in. */

(function () {
  "use strict";

  var canvas = document.getElementById("gl");
  var openBtn = document.getElementById("openCase");
  var hint = document.getElementById("coverHint");
  if (!canvas) return;

  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function fail() { document.documentElement.classList.remove("gl"); }

  if (typeof window.THREE === "undefined") { fail(); return; }

  var W = 2.0, H = 2.28, D = 0.055, R = 0.88;

  var renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas: canvas, alpha: true, antialias: true, powerPreference: "high-performance" });
  } catch (e) { fail(); return; }
  if (!renderer || !renderer.getContext()) { fail(); return; }

  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.outputEncoding = THREE.sRGBEncoding;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  document.documentElement.classList.add("gl");

  var scene = new THREE.Scene();
  var camera = new THREE.PerspectiveCamera(36, 1, 0.1, 100);
  camera.position.set(0, 0.62, 4.5);
  camera.lookAt(0, 0.02, 0);

  /* ── textures drawn in 2D canvas ─────────────────────────────── */
  function tex(c, srgb) {
    var t = new THREE.CanvasTexture(c);
    if (srgb !== false) t.encoding = THREE.sRGBEncoding;
    t.anisotropy = renderer.capabilities.getMaxAnisotropy();
    return t;
  }
  function cv(w, h) { var c = document.createElement("canvas"); c.width = w; c.height = h; return c; }

  /* studio environment: soft boxes over a dark room, for the plastic and chrome */
  function envTexture() {
    var c = cv(1024, 512), g = c.getContext("2d");
    var sky = g.createLinearGradient(0, 0, 0, 512);
    sky.addColorStop(0.00, "#1b1a22");
    sky.addColorStop(0.42, "#4a4757");
    sky.addColorStop(0.52, "#9a92a4");
    sky.addColorStop(0.62, "#3a3642");
    sky.addColorStop(1.00, "#0a090c");
    g.fillStyle = sky; g.fillRect(0, 0, 1024, 512);
    function box(x, y, w, h, col, a) {
      var r = g.createRadialGradient(x, y, 0, x, y, Math.max(w, h));
      r.addColorStop(0, col); r.addColorStop(1, "rgba(0,0,0,0)");
      g.globalAlpha = a; g.fillStyle = r;
      g.save(); g.translate(x, y); g.scale(w / Math.max(w, h), h / Math.max(w, h)); g.translate(-x, -y);
      g.beginPath(); g.arc(x, y, Math.max(w, h), 0, Math.PI * 2); g.fill(); g.restore();
      g.globalAlpha = 1;
    }
    box(200, 120, 190, 150, "#fff6e8", 0.95);
    box(560, 90, 240, 170, "#e8f0ff", 0.8);
    box(880, 150, 150, 120, "#ffd9d6", 0.55);
    box(700, 330, 300, 120, "#3a3642", 0.5);
    return tex(c);
  }

  /* the cover slick: red, the wordmark, one hype sticker */
  function coverTexture() {
    var c = cv(640, 730), g = c.getContext("2d");
    var bg = g.createLinearGradient(0, 0, 640, 730);
    bg.addColorStop(0, "#f04a51"); bg.addColorStop(0.45, "#e12229"); bg.addColorStop(1, "#a9101a");
    g.fillStyle = bg; g.fillRect(0, 0, 640, 730);

    /* print registration marks, like a real slick */
    g.strokeStyle = "rgba(255,255,255,.5)"; g.lineWidth = 2;
    [[22, 22], [618, 22], [22, 708], [618, 708]].forEach(function (p) {
      g.beginPath(); g.arc(p[0], p[1], 9, 0, Math.PI * 2); g.stroke();
      g.beginPath(); g.moveTo(p[0] - 14, p[1]); g.lineTo(p[0] + 14, p[1]);
      g.moveTo(p[0], p[1] - 14); g.lineTo(p[0], p[1] + 14); g.stroke();
    });

    g.fillStyle = "#fff";
    g.textAlign = "left"; g.textBaseline = "top";
    g.font = '400 92px "Black Han Sans", "Arial Black", sans-serif';
    g.fillText("BABY", 44, 210);
    g.fillText("MONSTER", 44, 296);
    g.font = '400 26px "Spline Sans Mono", monospace';
    g.fillStyle = "rgba(255,255,255,.88)";
    g.fillText("MONSTIEZ EDITION", 48, 404);

    g.strokeStyle = "rgba(255,255,255,.55)"; g.lineWidth = 3;
    g.beginPath(); g.moveTo(44, 470); g.lineTo(596, 470); g.stroke();

    g.font = '400 19px "Spline Sans Mono", monospace';
    g.fillStyle = "rgba(255,255,255,.72)";
    g.fillText("YG ENTERTAINMENT", 48, 500);
    g.fillText("DEBUT 2024.04.01", 48, 528);
    g.fillText("SEVEN MEMBERS", 48, 556);

    /* the hype sticker, straight from the shrink wrap */
    g.save();
    g.translate(430, 120); g.rotate(-0.09);
    g.fillStyle = "#f2ede3"; g.fillRect(-150, -34, 300, 68);
    g.fillStyle = "#16120f";
    g.font = '400 22px "Spline Sans Mono", monospace';
    g.textAlign = "center"; g.textBaseline = "middle";
    g.fillText("7 MONSTERS INSIDE", 0, -8);
    g.font = '400 15px "Spline Sans Mono", monospace';
    g.fillStyle = "#b3141b";
    g.fillText("OPEN CAREFULLY", 0, 18);
    g.restore();

    g.textAlign = "left"; g.textBaseline = "top";
    g.font = '400 15px "Spline Sans Mono", monospace';
    g.fillStyle = "rgba(255,255,255,.6)";
    g.fillText("BABYMONS7ER", 48, 646);
    g.fillText("PLAY LOUD", 48, 672);
    return tex(c);
  }

  /* the disc face: chrome, a pressed label, and a track band you can read */
  var discCanvas = cv(1024, 1024);
  var discCtx = discCanvas.getContext("2d");
  var label = { colour: "#E8456B", title: "SUGAR HONEY ICE TEA", meta: "DIGITAL SINGLE" };

  function paintDisc() {
    var g = discCtx, s = 1024, cx = 512, cy = 512;
    g.clearRect(0, 0, s, s);

    /* aluminium ground */
    var alu = g.createRadialGradient(cx, cy, 30, cx, cy, 512);
    alu.addColorStop(0.00, "#eef1f6");
    alu.addColorStop(0.45, "#c9cedb");
    alu.addColorStop(0.80, "#aeb4c4");
    alu.addColorStop(1.00, "#8e93a2");
    g.fillStyle = alu; g.beginPath(); g.arc(cx, cy, 512, 0, Math.PI * 2); g.fill();

    /* iridescence: an angular sweep, low alpha, so it reads as a reflection */
    var sweep = null;
    if (g.createConicGradient) {
      sweep = g.createConicGradient(-0.6, cx, cy);
      ["#ff9ad5", "#9ad8ff", "#b7ffd8", "#fff3a0", "#ffb0a0", "#c9a8ff", "#ff9ad5"].forEach(function (col, i, a) {
        sweep.addColorStop(i / (a.length - 1), col);
      });
    }
    if (sweep) { g.globalAlpha = 0.30; g.fillStyle = sweep; g.beginPath(); g.arc(cx, cy, 512, 0, Math.PI * 2); g.fill(); g.globalAlpha = 1; }

    /* the readable track band: fine concentric rings, denser outward */
    g.globalAlpha = 0.22; g.strokeStyle = "#ffffff"; g.lineWidth = 1.1;
    for (var r = 250; r < 505; r += 2.6) {
      g.beginPath(); g.arc(cx, cy, r, 0, Math.PI * 2); g.stroke();
    }
    g.globalAlpha = 0.16; g.strokeStyle = "#0b0b12";
    for (var r2 = 251.4; r2 < 505; r2 += 2.6) {
      g.beginPath(); g.arc(cx, cy, r2, 0, Math.PI * 2); g.stroke();
    }
    g.globalAlpha = 1;

    /* pressed label */
    g.fillStyle = label.colour;
    g.beginPath(); g.arc(cx, cy, 236, 0, Math.PI * 2); g.fill();
    g.strokeStyle = "rgba(0,0,0,.28)"; g.lineWidth = 3;
    g.beginPath(); g.arc(cx, cy, 236, 0, Math.PI * 2); g.stroke();

    g.fillStyle = "#fff"; g.textAlign = "center";
    g.font = '400 46px "Spline Sans Mono", monospace';
    var title = label.title.length > 17 ? label.title.slice(0, 16) + "…" : label.title;
    g.fillText(title, cx, cy - 34);
    g.font = '400 19px "Spline Sans Mono", monospace';
    g.globalAlpha = 0.85;
    g.fillText(label.meta.toUpperCase(), cx, cy + 8);
    g.font = '400 16px "Spline Sans Mono", monospace';
    g.globalAlpha = 0.6;
    g.fillText("BABYMONSTER", cx, cy + 46);
    g.globalAlpha = 1;

    /* spindle hole */
    g.globalCompositeOperation = "destination-out";
    g.beginPath(); g.arc(cx, cy, 62, 0, Math.PI * 2); g.fill();
    g.globalCompositeOperation = "source-over";
  }
  paintDisc();
  var discTex = tex(discCanvas);

  /* ── materials ───────────────────────────────────────────────── */
  var env = envTexture();
  var pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromEquirectangular(env).texture;

  var plastic = new THREE.MeshStandardMaterial({ color: 0x15131a, roughness: 0.30, metalness: 0.06, envMapIntensity: 0.9 });
  var plasticSoft = new THREE.MeshStandardMaterial({ color: 0x1d1a22, roughness: 0.62, metalness: 0.0, envMapIntensity: 0.5 });
  var chrome = new THREE.MeshStandardMaterial({ color: 0xd6dbe6, roughness: 0.16, metalness: 1.0, envMapIntensity: 1.5 });
  var coverMat = new THREE.MeshStandardMaterial({ map: coverTexture(), roughness: 0.42, metalness: 0.03, envMapIntensity: 0.85 });
  var discMat = new THREE.MeshStandardMaterial({ map: discTex, transparent: true, metalness: 0.96, roughness: 0.14, envMapIntensity: 1.7 });
  var discEdge = new THREE.MeshStandardMaterial({ color: 0xdfe4ee, roughness: 0.12, metalness: 1.0, envMapIntensity: 1.4 });

  /* ── build the case ──────────────────────────────────────────── */
  var caseGroup = new THREE.Group();
  caseGroup.rotation.set(-0.14, -0.38, 0);
  caseGroup.position.set(0, 0.06, 0);
  scene.add(caseGroup);

  var tray = new THREE.Group();
  caseGroup.add(tray);

  var trayBack = new THREE.Mesh(new THREE.BoxGeometry(W, H, D), plasticSoft);
  trayBack.position.z = -D / 2;
  tray.add(trayBack);

  /* the tray's inner lip, so the disc sits in something */
  var lip = new THREE.Mesh(new THREE.BoxGeometry(W - 0.06, H - 0.06, 0.02), plastic);
  lip.position.z = 0.004;
  tray.add(lip);

  var disc = new THREE.Group();
  var discMesh = new THREE.Mesh(new THREE.CylinderGeometry(R, R, 0.016, 96, 1, false), [discEdge, discMat, discMat]);
  discMesh.rotation.x = Math.PI / 2;
  disc.add(discMesh);
  var discRim = new THREE.Mesh(new THREE.TorusGeometry(R, 0.006, 10, 96), chrome);
  discRim.position.z = 0.009;
  disc.add(discRim);
  disc.position.set(0, 0, 0.03);
  tray.add(disc);

  /* the lid, hinged on the spine at the left edge */
  var lidPivot = new THREE.Group();
  lidPivot.position.set(-W / 2, 0, D + 0.002);
  caseGroup.add(lidPivot);

  var lid = new THREE.Group();
  lid.position.set(W / 2, 0, 0);
  lidPivot.add(lid);

  var lidShell = new THREE.Mesh(new THREE.BoxGeometry(W, H, D), plastic);
  lid.add(lidShell);

  var front = new THREE.Mesh(new THREE.PlaneGeometry(W - 0.02, H - 0.02), coverMat);
  front.position.z = D / 2 + 0.001;
  lid.add(front);

  /* spine + hinge hardware, chrome */
  var spine = new THREE.Mesh(new THREE.BoxGeometry(0.05, H, D + 0.02), chrome);
  spine.position.set(-W / 2 + 0.025, 0, 0.012);
  caseGroup.add(spine);
  var hinge = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.022, H * 0.86, 16), chrome);
  hinge.position.set(-W / 2, 0, D + 0.01);
  caseGroup.add(hinge);

  /* the table: a dark plane and a soft pool of shadow under the case */
  var table = new THREE.Mesh(
    new THREE.PlaneGeometry(14, 14),
    /* unlit and tone-mapping-free so the plane lands on exactly --table (#08070a)
       instead of being lifted to mid-grey by the studio env map and the four
       lights; the shadow pool below still grounds the case on it */
    new THREE.MeshBasicMaterial({ color: new THREE.Color(0x08070a).convertSRGBToLinear(), toneMapped: false })
  );
  table.rotation.x = -Math.PI / 2;
  table.position.y = -H / 2 - 0.28;
  scene.add(table);

  (function shadowPool() {
    var c = cv(512, 512), g = c.getContext("2d");
    var r = g.createRadialGradient(256, 256, 10, 256, 256, 250);
    r.addColorStop(0, "rgba(0,0,0,.72)");
    r.addColorStop(0.55, "rgba(0,0,0,.32)");
    r.addColorStop(1, "rgba(0,0,0,0)");
    g.fillStyle = r; g.fillRect(0, 0, 512, 512);
    var m = new THREE.Mesh(
      new THREE.PlaneGeometry(4.4, 4.4),
      new THREE.MeshBasicMaterial({ map: tex(c), transparent: true, depthWrite: false })
    );
    m.rotation.x = -Math.PI / 2;
    m.position.y = -H / 2 - 0.27;
    scene.add(m);
  })();

  /* ── lights ──────────────────────────────────────────────────── */
  scene.add(new THREE.AmbientLight(0xffffff, 0.32));
  var key = new THREE.DirectionalLight(0xfff3e6, 1.5); key.position.set(3.2, 4.4, 3.4); scene.add(key);
  var fill = new THREE.DirectionalLight(0xbfd4ff, 0.85); fill.position.set(-3.6, 1.6, 2.2); scene.add(fill);
  var rim = new THREE.DirectionalLight(0xff8fa0, 0.7); rim.position.set(-1.4, -1.2, -3.4); scene.add(rim);
  var top = new THREE.PointLight(0xffffff, 0.5, 12); top.position.set(0, 3.2, 1.2); scene.add(top);

  /* ── open / close ────────────────────────────────────────────── */
  var OPEN = -2.15;
  var state = { lid: 0, lift: 0, target: 0 };
  var spin = 0;
  var isOpen = false;
  var spinning = false;

  function easeInOut(t) { return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }

  function setOpen(v) {
    isOpen = v;
    state.target = v ? 1 : 0;
    if (openBtn) {
      openBtn.setAttribute("aria-expanded", String(v));
      var lbl = openBtn.querySelector(".btn__label");
      if (lbl) lbl.textContent = v ? "Close the case" : "Open the case";
    }
    if (hint) {
      hint.textContent = v
        ? "The disc is out. Pick a release below and it takes the label."
        : "Drag the case to turn it. Press open to let the disc out.";
    }
  }

  /* ── pointer drag ────────────────────────────────────────────── */
  var drag = { on: false, x: 0, y: 0, vx: 0, vy: 0, moved: 0 };
  var base = { x: caseGroup.rotation.x, y: caseGroup.rotation.y };

  function down(e) {
    drag.on = true; drag.moved = 0;
    drag.x = e.clientX; drag.y = e.clientY;
    drag.vx = 0; drag.vy = 0;
    if (canvas.setPointerCapture && e.pointerId != null) { try { canvas.setPointerCapture(e.pointerId); } catch (err) {} }
  }
  function move(e) {
    if (!drag.on) return;
    var dx = e.clientX - drag.x, dy = e.clientY - drag.y;
    drag.x = e.clientX; drag.y = e.clientY;
    drag.moved += Math.abs(dx) + Math.abs(dy);
    drag.vy = dx * 0.006; drag.vx = dy * 0.004;
    caseGroup.rotation.y += drag.vy;
    caseGroup.rotation.x = Math.max(-0.7, Math.min(0.7, caseGroup.rotation.x + drag.vx));
  }
  function up(e) {
    drag.on = false;
    if (canvas.releasePointerCapture && e.pointerId != null) { try { canvas.releasePointerCapture(e.pointerId); } catch (err) {} }
  }
  canvas.addEventListener("pointerdown", down);
  window.addEventListener("pointermove", move, { passive: true });
  window.addEventListener("pointerup", up);
  window.addEventListener("pointercancel", up);
  canvas.addEventListener("dragstart", function (e) { e.preventDefault(); });

  if (openBtn) openBtn.addEventListener("click", function () { setOpen(!isOpen); });

  /* ── sizing ──────────────────────────────────────────────────── */
  var dpr = Math.min(window.devicePixelRatio || 1, 2);
  function resize() {
    var r = canvas.parentElement.getBoundingClientRect();
    var w = Math.max(1, Math.round(r.width)), h = Math.max(1, Math.round(r.height));
    renderer.setPixelRatio(dpr);
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    /* frame the case at a fixed share of the viewport on BOTH axes and take the
       binding constraint: height governs in landscape (unchanged desktop
       framing), width pulls the camera back in portrait so the case never
       crops, matching the no-WebGL fallback's framing intent */
    var half = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
    var zW = (W / 2) / (0.80 * half * camera.aspect);
    var zH = (H / 2) / (0.78 * half);
    camera.position.z = Math.max(zW, zH);
    camera.updateProjectionMatrix();
  }
  window.addEventListener("resize", resize);
  resize();

  /* ── the loop ────────────────────────────────────────────────── */
  var last = performance.now(), t0 = last;
  var running = true;
  document.addEventListener("visibilitychange", function () {
    running = !document.hidden;
    if (running) { last = performance.now(); requestAnimationFrame(loop); }
  });

  function loop(now) {
    if (!running) return;
    requestAnimationFrame(loop);
    var dt = Math.min((now - last) / 1000, 0.05); last = now;

    /* ease lid + disc lift toward the target */
    state.lid += (state.target - state.lid) * Math.min(1, dt * 4.2);
    state.lift += (state.target - state.lift) * Math.min(1, dt * 3.2);
    var e = easeInOut(Math.min(1, Math.max(0, state.lid)));
    lidPivot.rotation.y = OPEN * e;
    lidPivot.rotation.z = -0.06 * e;
    disc.position.z = 0.03 + 0.36 * easeInOut(Math.min(1, Math.max(0, state.lift)));
    disc.position.y = 0.02 * Math.sin(state.lift * Math.PI);

    /* drag inertia, and a slow idle sway when nobody is holding it */
    if (!drag.on) {
      caseGroup.rotation.y += drag.vy;
      drag.vy *= 0.94;
      if (!reduce && Math.abs(drag.vy) < 0.0015) {
        caseGroup.rotation.y += Math.sin((now - t0) / 3400) * 0.0016;
        caseGroup.rotation.x += Math.sin((now - t0) / 5100) * 0.0006;
      }
      caseGroup.rotation.x += (base.x - caseGroup.rotation.x) * 0.02;
      if (Math.abs(caseGroup.rotation.x - base.x) < 0.002) caseGroup.rotation.x = base.x + (caseGroup.rotation.x - base.x) * 0.9;
    }

    if (spinning) { spin += dt * 1.35; discMesh.rotation.z = spin; }

    renderer.render(scene, camera);
  }
  requestAnimationFrame(loop);

  /* ── public surface for the disc section ─────────────────────── */
  window.BMCase = {
    setLabel: function (colour, title, meta) {
      label.colour = colour || "#e12229";
      label.title = title || "SUGAR HONEY ICE TEA";
      label.meta = meta || "";
      paintDisc();
      discTex.needsUpdate = true;
    },
    spin: function (on) {
      spinning = !!on;
      if (on && state.target < 0.5) setOpen(true);
      if (!on) discMesh.rotation.z = 0;
    },
    open: function () { setOpen(true); },
    isOpen: function () { return isOpen; }
  };
})();
