/* main.js — the page logic.
   Everything fails soft: a missing node or missing data leaves the rest
   of the page working and says nothing to the visitor. */

(function () {
  "use strict";

  var $  = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var audio = window.BMAudio;

  function sound(fn, a, b, c) {
    if (audio && typeof audio[fn] === "function") { try { audio[fn](a, b, c); } catch (e) {} }
  }

  /* ══ 1. the cover ══════════════════════════════════════════════ */
  (function cover() {
    var btn = $("#openCase");
    var hint = $("#coverHint");
    var flat = $(".flatcase");
    if (!btn) return;

    /* case3d.js owns the button when the WebGL path came up. */
    if (window.BMCase) return;

    var open = false;
    btn.addEventListener("click", function () {
      open = !open;
      if (flat) flat.classList.toggle("is-open", open);
      btn.setAttribute("aria-expanded", String(open));
      var lbl = $(".btn__label", btn);
      if (lbl) lbl.textContent = open ? "Close the case" : "Open the case";
      if (hint) {
        hint.textContent = open
          ? "The disc is out. Pick a release below and it takes the label."
          : "Drag the case to turn it. Press open to let the disc out.";
      }
      sound("sweep");
    });
  })();

  /* ══ 2. the booklet ════════════════════════════════════════════ */
  var booklet = (function () {
    var pages = $$(".page");
    var rail = $("#bookletRail");
    var dots = $("#bookletDots");
    var count = $("#pageCount");
    var prev = $("#prevPage");
    var next = $("#nextPage");
    var section = $("#booklet");
    if (!pages.length || !rail) return null;

    var i = 0;
    var railBtns = [];
    var dotEls = [];

    pages.forEach(function (p, n) {
      var id = "booklet-page-" + (p.getAttribute("data-member") || n);
      p.id = id;
      p.setAttribute("role", "tabpanel");
      p.setAttribute("aria-label", (n + 1) + " of " + pages.length);
      p.setAttribute("tabindex", n === 0 ? "0" : "-1");

      var name = $(".page__name", p);
      var label = name ? name.textContent.trim() : "Page " + (n + 1);

      var b = document.createElement("button");
      b.type = "button";
      b.setAttribute("role", "tab");
      b.setAttribute("aria-controls", id);
      b.setAttribute("aria-selected", "false");
      b.setAttribute("tabindex", "-1");
      b.textContent = label;
      b.addEventListener("click", function () { go(n, true); });
      rail.appendChild(b);
      railBtns.push(b);

      if (dots) {
        var d = document.createElement("i");
        dots.appendChild(d);
        dotEls.push(d);
      }
    });

    var ready = false;
    function go(n, focusPanel) {
      n = Math.max(0, Math.min(pages.length - 1, n));
      /* the shipped markup already carries .is-current on page 0, so the first
         call must still run the init body (prev state, rail selection, dots);
         only skip a genuine repeat after the booklet is initialized */
      if (ready && n === i && pages[i].classList.contains("is-current")) return;
      ready = true;
      i = n;
      pages.forEach(function (p, k) {
        p.classList.toggle("is-current", k === i);
        p.classList.toggle("is-before", k < i);
        p.setAttribute("tabindex", k === i ? "0" : "-1");
        if (k === i) p.setAttribute("aria-hidden", "false");
        else p.removeAttribute("aria-hidden");
      });
      railBtns.forEach(function (b, k) {
        b.setAttribute("aria-selected", String(k === i));
        b.setAttribute("tabindex", k === i ? "0" : "-1");
      });
      dotEls.forEach(function (d, k) { d.classList.toggle("on", k === i); });
      if (count) count.textContent = "Page " + (i + 1) + " of " + pages.length;
      if (prev) prev.disabled = i === 0;
      if (next) next.disabled = i === pages.length - 1;
      if (focusPanel) pages[i].focus({ preventScroll: true });
      sound("tick", 660 + i * 40, 0.07, 60);
    }

    if (prev) prev.addEventListener("click", function () { go(i - 1); });
    if (next) next.addEventListener("click", function () { go(i + 1); });

    railBtns.forEach(function (b, k) {
      b.addEventListener("keydown", function (e) {
        if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
        e.preventDefault();
        var t = Math.max(0, Math.min(pages.length - 1, k + (e.key === "ArrowRight" ? 1 : -1)));
        railBtns[t].focus(); go(t);
      });
    });

    document.addEventListener("keydown", function (e) {
      if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      var t = e.target;
      if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable)) return;
      var pulled = $("#pull");
      if (pulled && !pulled.hidden) return;
      if (!section) return;
      var r = section.getBoundingClientRect();
      var inView = r.top < window.innerHeight * 0.55 && r.bottom > window.innerHeight * 0.45;
      var inSection = t && section.contains(t);
      if (!inView && !inSection) return;
      e.preventDefault();
      go(i + (e.key === "ArrowRight" ? 1 : -1));
    });

    go(0);
    return { go: go, index: function () { return i; }, pages: pages };
  })();

  /* ══ 3. the photocard pull ═════════════════════════════════════ */
  (function pull() {
    var btn = $("#pullBtn");
    var box = $("#pull");
    var card = $("#pullCard");
    var line = $("#pullLine");
    if (!btn || !box || !card) return;

    var members = window.BMMembers || [];
    if (!members.length) { btn.hidden = true; return; }

    var lines = [
      "You got the rare one. Everyone says that.",
      "Torn corner, still counts. Mint condition is a myth.",
      "Two of these and you can trade for a whole album.",
      "This is the pull the album was designed around.",
      "Duplicate. You will say it was on purpose.",
      "Straight to the binder, no questions asked.",
      "The photocard knows what you did at the concert.",
      "Sleeve it before anyone sees the fingerprints."
    ];
    var last = -1, pulled = {}, n = 0;

    function render(k) {
      var m = members[k];
      var inner = "";
      if (m.photo) {
        inner = '<figure><img src="' + m.photo + '" alt="' + (m.alt || m.name) + '" width="1280" height="1792" decoding="async"></figure>';
      } else {
        inner = '<figure><div class="void"><svg class="i i--lg" aria-hidden="true"><use href="#i-sticker"/></svg></div></figure>';
      }
      card.innerHTML = inner +
        '<figcaption><b>' + m.name + '</b>' +
        '<span class="pull__role">' + (m.role || "") + '</span></figcaption>' +
        '<p class="pull__c">PC ' + String(k + 1).padStart(2, "0") + ' · ' +
        (m.real || "") + (m.photo ? "" : " · EMPTY SLEEVE") + '</p>';
      if (line) {
        line.innerHTML = "<b>" + m.name + "</b> — " +
          (m.photo ? lines[Math.floor(Math.random() * lines.length)]
                   : "Her sleeve ships empty, on purpose. Rest first.");
      }
      card.style.setProperty("--ground", m.colour || "#e12229");
    }

    function open(k) {
      last = k;
      pulled[k] = true;
      n = Object.keys(pulled).length;
      render(k);
      box.hidden = false;
      var lbl = $(".btn__label", btn);
      if (lbl) lbl.textContent = "Pull a photocard · " + n + " of 7";
      var close = $(".pull__close", box);
      if (close) close.focus();
      sound("tick", 1040, 0.08, 80);
    }

    function close() {
      box.hidden = true;
      btn.focus();
    }

    btn.addEventListener("click", function () {
      var k;
      if (members.length < 2) { k = 0; }
      else { do { k = Math.floor(Math.random() * members.length); } while (k === last); }
      open(k);
    });

    var closeBtn = $("#pullClose");
    if (closeBtn) closeBtn.addEventListener("click", close);
    box.addEventListener("click", function (e) { if (e.target === box) close(); });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && !box.hidden) close();
    });
  })();

  /* ══ 4. the disc ═══════════════════════════════════════════════ */
  (function disc() {
    var list = $("#releases");
    var detail = $("#releaseDetail");
    var label = $(".platter__label");
    var titleEl = $("#discTitle");
    var metaEl = $("#discMeta");
    var platter = $("#platter");
    var spinBtn = $("#spinBtn");
    if (!list) return;

    var rows = $$(".release", list);
    var spinning = false;

    function select(li, quiet) {
      if (!li) return;
      var b = $("button", li);
      if (!b) return;
      rows.forEach(function (r) {
        r.classList.toggle("is-on", r === li);
        var rb = $("button", r);
        if (rb) rb.setAttribute("aria-pressed", String(r === li));
      });

      var title = b.getAttribute("data-title") || "";
      var type = b.getAttribute("data-type") || "";
      var date = b.getAttribute("data-date") || "";
      var colour = b.getAttribute("data-colour") || "#e12229";
      var note = b.getAttribute("data-note") || "";
      var tracks = [];
      try { tracks = JSON.parse(b.getAttribute("data-tracks") || "[]"); } catch (e) { tracks = []; }

      if (titleEl) titleEl.textContent = title;
      if (metaEl) metaEl.textContent = type.toUpperCase();
      if (label) label.style.setProperty("--ground", colour);
      if (window.BMCase && window.BMCase.setLabel) {
        try { window.BMCase.setLabel(colour, title, type.toUpperCase()); } catch (e) {}
      }

      if (detail) {
        var html = "<h3>" + title + "</h3>" +
          '<p class="rd-meta">' + type + " · " + date + "</p>";
        if (tracks.length) {
          html += '<p class="rd-tracks">' + tracks.map(function (t) {
            return "<span>" + t + "</span>";
          }).join("") + "</p>";
        }
        if (note) html += '<p class="rd-note">' + note + "</p>";
        detail.innerHTML = html;
      }
      if (!quiet) sound("tick", 520, 0.06, 55);
    }

    rows.forEach(function (li) {
      var b = $("button", li);
      if (!b) return;
      b.addEventListener("click", function () { select(li); });
    });

    var current = $(".release.is-on", list) || rows[0];
    select(current, true);

    if (spinBtn && platter) {
      spinBtn.addEventListener("click", function () {
        spinning = !spinning;
        platter.classList.toggle("is-spinning", spinning);
        spinBtn.setAttribute("aria-pressed", String(spinning));
        var lbl = $(".btn__label", spinBtn);
        var use = $("use", spinBtn);
        if (lbl) lbl.textContent = spinning ? "Stop the disc" : "Spin the disc";
        if (use) use.setAttribute("href", spinning ? "#i-pause" : "#i-play");
        if (window.BMCase && window.BMCase.spin) { try { window.BMCase.spin(spinning); } catch (e) {} }
        if (spinning) sound("loopStart"); else sound("loopStop");
      });
    }
  })();

  /* ══ 5. the sticker sheet ══════════════════════════════════════ */
  (function stickers() {
    var sheet = $("#sheet");
    var stuck = $("#minicaseStuck");
    var count = $("#stickerCount");
    var clear = $("#clearStickers");
    if (!sheet || !stuck) return;

    var stks = $$(".stk", sheet);
    var total = stks.length;
    /* deterministic scatter: index drives the spot, so it survives reloads */
    var spots = [
      { x: 16, y: 34, r: -8 },  { x: 62, y: 20, r: 6 },
      { x: 30, y: 62, r: -4 },  { x: 68, y: 56, r: 9 },
      { x: 12, y: 78, r: 5 },   { x: 52, y: 84, r: -7 },
      { x: 78, y: 40, r: -10 }, { x: 40, y: 44, r: 3 }
    ];

    function sync() {
      var n = $$("b", stuck).length;
      if (count) count.textContent = n + " of " + total + " stuck";
      if (clear) clear.disabled = n === 0;
    }

    stks.forEach(function (b, k) {
      b.addEventListener("click", function () {
        var on = b.getAttribute("aria-pressed") === "true";
        if (on) {
          var ex = stuck.querySelector('b[data-k="' + k + '"]');
          if (ex) ex.remove();
          b.setAttribute("aria-pressed", "false");
          sound("tick", 300, 0.05, 45);
        } else {
          var s = spots[k % spots.length];
          var el = document.createElement("b");
          el.setAttribute("data-k", String(k));
          el.setAttribute("data-shape", b.getAttribute("data-shape") || "rect");
          el.textContent = b.getAttribute("data-text") || "";
          el.style.left = s.x + "%";
          el.style.top = s.y + "%";
          el.style.setProperty("--sc", b.style.getPropertyValue("--sc") || "#e12229");
          el.style.transform = "rotate(" + s.r + "deg)";
          stuck.appendChild(el);
          b.setAttribute("aria-pressed", "true");
          sound("tick", 740 + k * 55, 0.07, 55);
        }
        sync();
      });
    });

    if (clear) {
      clear.addEventListener("click", function () {
        stuck.innerHTML = "";
        stks.forEach(function (b) { b.setAttribute("aria-pressed", "false"); });
        sync();
        sound("tick", 240, 0.05, 60);
      });
    }
    sync();
  })();

  /* ══ 6. one authored entrance ══════════════════════════════════ */
  (function reveal() {
    var targets = $$(
      ".sec-head, .booklet__bar, .booklet__stage, .disc__player, .disc__list, " +
      ".liner .notes, .liner__foot, .back__main, .back__cover, " +
      ".stickers__grid > .sec-head, .sheet, .stickers__side, .colophon__cols"
    );
    if (!targets.length) return;
    targets.forEach(function (t) { t.classList.add("reveal"); });

    if (reduce || !("IntersectionObserver" in window)) {
      targets.forEach(function (t) { t.classList.add("in"); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); }
      });
    }, { rootMargin: "0px 0px -12% 0px", threshold: 0.08 });
    targets.forEach(function (t) { io.observe(t); });

    /* A jump — a nav link, a deep link, a restored scroll position — can put
       an element above the viewport before the observer ever sees it. Settle
       anything already at or above the fold, so nothing stays invisible. */
    function settle() {
      targets.forEach(function (t) {
        if (t.classList.contains("in")) return;
        if (t.getBoundingClientRect().top < window.innerHeight * 0.92) {
          t.classList.add("in"); io.unobserve(t);
        }
      });
    }
    window.addEventListener("load", function () { setTimeout(settle, 60); });
    window.addEventListener("hashchange", function () { setTimeout(settle, 260); });
    window.addEventListener("scroll", settle, { passive: true });
    setTimeout(settle, 120);
  })();

  /* ══ 7. the cursor trail ═══════════════════════════════════════ */
  (function trail() {
    if (reduce) return;
    if (!window.matchMedia("(pointer: fine)").matches) return;
    if (window.innerWidth < 900) return;

    var N = 14;
    var palette = ["#e12229", "#E8456B", "#F2681C", "#E8C21C", "#3FA9E0", "#7A4FBF", "#D6198C"];
    var wrap = document.createElement("div");
    wrap.className = "trail";
    wrap.setAttribute("aria-hidden", "true");
    var pts = [];
    for (var k = 0; k < N; k++) {
      var d = document.createElement("i");
      d.style.background = palette[k % palette.length];
      d.style.opacity = String(0.10 + 0.5 * (1 - k / N));
      wrap.appendChild(d);
      pts.push({ x: -100, y: -100, el: d });
    }
    document.body.appendChild(wrap);

    var mx = -100, my = -100, active = false;
    window.addEventListener("pointermove", function (e) {
      if (e.pointerType && e.pointerType !== "mouse") return;
      mx = e.clientX; my = e.clientY; active = true;
    }, { passive: true });
    window.addEventListener("pointerleave", function () { active = false; });

    var raf = 0, head = { x: -100, y: -100 };
    function frame() {
      raf = requestAnimationFrame(frame);
      if (!active) return;
      head.x += (mx - head.x) * 0.35;
      head.y += (my - head.y) * 0.35;
      var px = head.x, py = head.y;
      for (var k = 0; k < pts.length; k++) {
        var p = pts[k];
        p.x += (px - p.x) * 0.34;
        p.y += (py - p.y) * 0.34;
        p.el.style.transform = "translate3d(" + p.x.toFixed(1) + "px," + p.y.toFixed(1) + "px,0)";
        px = p.x; py = p.y;
      }
    }
    frame();
    document.addEventListener("visibilitychange", function () {
      if (document.hidden) { cancelAnimationFrame(raf); raf = 0; }
      else if (!raf) frame();
    });
  })();

})();
