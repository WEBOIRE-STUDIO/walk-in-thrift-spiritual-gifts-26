// WEBOIRE STUDIO demo — motion system. GSAP + ScrollTrigger drive the real
// choreography (split-word hero entrance, staggered/directional section
// reveals, a pinned storytelling moment, scroll-linked parallax). A plain
// IntersectionObserver is kept ONLY as a safety-net fallback — if the CDN
// script fails to load, or a ScrollTrigger somehow never fires for an
// element, the observer force-reveals it so content is never permanently
// invisible. Everything here respects prefers-reduced-motion.
(function () {
  var reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var isMobile = window.matchMedia('(max-width: 780px)').matches;
  var hasGsap = !reducedMotion && typeof window.gsap !== 'undefined';
  var hasScrollTrigger = hasGsap && typeof window.ScrollTrigger !== 'undefined';

  if (hasScrollTrigger) window.gsap.registerPlugin(window.ScrollTrigger);

  // ---- Per-preset hero word-reveal timing ----
  // Motion presets are more than a CSS flavor — each gets its own rhythm for
  // the hero headline's word-by-word entrance, so "editorial" reads crisp,
  // "cinematic" reads slower/wider-spaced, "bold geometric" reads punchy,
  // and "minimal luxury" reads unhurried, instead of every preset sharing
  // one timing regardless of its visual language.
  var HERO_WORD_TIMING = {
    'editorial-split-mask': { stagger: .05, duration: .75, ease: 'power3.out' },
    'cinematic-parallax-reveal': { stagger: .1, duration: .95, ease: 'power2.out' },
    'bento-stagger-depth': { stagger: .05, duration: .7, ease: 'power3.out' },
    'sticky-storytelling': { stagger: .06, duration: .8, ease: 'power3.out' },
    'minimal-slow-reveal': { stagger: .04, duration: 1.05, ease: 'power1.out' },
    'bold-geometric-motion': { stagger: .045, duration: .6, ease: 'back.out(1.6)' },
  };
  var motionKey = (document.body.className.match(/motion-([a-z-]+)/) || [])[1];
  var wordTiming = HERO_WORD_TIMING[motionKey] || HERO_WORD_TIMING['editorial-split-mask'];
  var experimentalKey = (document.body.className.match(/experimental-([a-z0-9-]+)/) || [])[1];

  // ---- Mobile-safe nav ----
  var toggle = document.getElementById('navToggle');
  var links = document.querySelector('.nav-links');
  if (toggle && links) {
    toggle.addEventListener('click', function () {
      var open = links.classList.toggle('open');
      toggle.classList.toggle('open', open);
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    links.querySelectorAll('a').forEach(function (a) {
      a.addEventListener('click', function () {
        links.classList.remove('open');
        toggle.classList.remove('open');
      });
    });
  }

  // ---- Sticky nav: shrink/blur after a small scroll ----
  var nav = document.querySelector('.site-nav');
  if (nav) {
    var setNavState = function () { nav.classList.toggle('nav-scrolled', window.scrollY > 24); };
    setNavState();
    window.addEventListener('scroll', setNavState, { passive: true });
  }

  // ---- FAQ accordion (button + grid-rows panel, animates either way) ----
  document.querySelectorAll('.faq-item').forEach(function (item) {
    var q = item.querySelector('.faq-q');
    if (!q) return;
    q.addEventListener('click', function () {
      var open = item.getAttribute('data-open') === 'true';
      item.setAttribute('data-open', open ? 'false' : 'true');
      q.setAttribute('aria-expanded', open ? 'false' : 'true');
    });
  });

  document.querySelectorAll('.section, .hero').forEach(function (el) { el.classList.add('reveal'); });

  // ---- Collect everything that needs a "reveal on visible" treatment ----
  var revealEls = Array.prototype.slice.call(document.querySelectorAll(
    '.reveal, .reveal-mask, .img-clip-reveal, [class*="reveal-dir-"]'
  ));
  var splitWords = Array.prototype.slice.call(document.querySelectorAll('.split-word'));
  var staggerGroups = Array.prototype.slice.call(
    document.querySelectorAll('.bento-grid, .stats-band, .value-grid, .service-grid, .contact-rows')
  ).filter(function (el) { return el.querySelector('.stagger-child'); });
  var counters = Array.prototype.slice.call(document.querySelectorAll('[data-counter-to]'));

  function markRevealed(el) { el.classList.add('in-view'); }

  if (reducedMotion) {
    revealEls.concat(splitWords).forEach(markRevealed);
    staggerGroups.forEach(function (g) { g.querySelectorAll('.stagger-child').forEach(markRevealed); });
    counters.forEach(function (el) {
      var target = parseFloat(el.getAttribute('data-counter-to'));
      var suffix = (el.textContent.match(/[^\d]+$/) || [''])[0];
      if (isFinite(target)) el.textContent = target + suffix;
    });
  } else {
    // ---- Hero: entrance runs on load, not scroll — it's already on screen ----
    // The whole-section `.hero.reveal` fade is left to its own CSS transition
    // (just needs `.in-view` added); GSAP is only for the parts that need
    // real choreography — staggered words, the eyebrow mask, the image clip.
    var heroSection = document.querySelector('.hero');
    var heroWords = Array.prototype.slice.call(document.querySelectorAll('.hero .split-word'));
    var heroMasks = Array.prototype.slice.call(document.querySelectorAll('.hero .reveal-mask'));
    var heroClipImgs = Array.prototype.slice.call(document.querySelectorAll('.hero .img-clip-reveal'));
    var heroMediaMask = document.querySelector('.hero-media-mask');
    var heroRevealEls = (heroSection ? [heroSection] : []).concat(heroMasks, heroClipImgs);

    if (heroSection) markRevealed(heroSection);
    if (hasGsap) {
      var heroWordSpans = heroWords.map(function (w) { return w.querySelector('span'); });
      var heroTl = window.gsap.timeline({ defaults: { ease: 'power3.out' } });
      if (heroMediaMask) heroTl.to(heroMediaMask, { clipPath: 'inset(0 0 0 0%)', duration: 1.15, ease: 'expo.inOut' }, 0);
      heroTl.to(heroWordSpans, { y: 0, rotate: 0, duration: wordTiming.duration, stagger: wordTiming.stagger, ease: wordTiming.ease }, 0.25)
        .to(heroMasks.map(function (e) { return e.querySelector('span'); }), { y: 0, duration: .7 }, 0.35)
        .to(heroClipImgs, { opacity: 1, scale: 1, duration: 1 }, 0.3);
      if (heroMediaMask) markRevealed(heroMediaMask);
      heroWords.forEach(markRevealed);
      heroMasks.forEach(markRevealed);
      heroClipImgs.forEach(markRevealed);
    } else {
      if (heroMediaMask) markRevealed(heroMediaMask);
      heroWords.concat(heroMasks, heroClipImgs).forEach(markRevealed);
    }

    // Everything below the hero uses the same "reveal" set minus what the hero already handled.
    var belowFoldReveals = revealEls.filter(function (el) { return !heroRevealEls.includes(el); });
    var belowFoldWords = splitWords.filter(function (el) { return !heroWords.includes(el); });

    if (hasScrollTrigger) {
      document.body.classList.add('gsap-ready');

      belowFoldReveals.forEach(function (el) {
        window.ScrollTrigger.create({
          trigger: el, start: 'top 88%', once: true,
          onEnter: function () {
            markRevealed(el);
            if (el.classList.contains('reveal-mask')) {
              window.gsap.to(el.querySelector('span'), { y: 0, duration: .8, ease: 'power3.out' });
            }
          },
        });
      });

      belowFoldWords.forEach(function (el) {
        window.ScrollTrigger.create({
          trigger: el, start: 'top 92%', once: true,
          onEnter: function () {
            markRevealed(el);
            window.gsap.to(el.querySelector('span'), { y: 0, rotate: 0, duration: wordTiming.duration, ease: wordTiming.ease });
          },
        });
      });

      staggerGroups.forEach(function (group) {
        window.ScrollTrigger.create({
          trigger: group, start: 'top 85%', once: true,
          onEnter: function () {
            var children = group.querySelectorAll('.stagger-child');
            window.gsap.to(children, { opacity: 1, y: 0, x: 0, duration: .7, ease: 'power2.out', stagger: .08 });
          },
        });
      });

      counters.forEach(function (el) {
        var target = parseFloat(el.getAttribute('data-counter-to'));
        var suffix = (el.textContent.match(/[^\d]+$/) || [''])[0];
        if (!isFinite(target)) return;
        window.ScrollTrigger.create({
          trigger: el, start: 'top 90%', once: true,
          onEnter: function () {
            var obj = { val: 0 };
            el.textContent = '0' + suffix;
            window.gsap.to(obj, { val: target, duration: 1.4, ease: 'power1.out', onUpdate: function () { el.textContent = Math.round(obj.val) + suffix; } });
          },
        });
      });

      // ---- Scroll-linked parallax on hero media ----
      if (!isMobile) {
        var parallaxEl = document.querySelector('.hero-bg-img, .hero-visual-img');
        if (parallaxEl) {
          window.gsap.to(parallaxEl, {
            yPercent: 16, scale: 1.08, ease: 'none',
            scrollTrigger: { trigger: parallaxEl.closest('.hero'), start: 'top top', end: 'bottom top', scrub: .5 },
          });
        }

        // ---- About (cinematic): image drifts + slowly enlarges as the
        // section scrolls — tied to the same scroll range the copy lives in,
        // starting at scale 1 (exactly filling its frame, no baseline zoom)
        // so it only ever grows, never exposing an edge gap.
        var aboutImg = document.querySelector('.about-parallax-img');
        if (aboutImg) {
          window.gsap.to(aboutImg, {
            yPercent: -10, scale: 1.12, ease: 'none',
            scrollTrigger: { trigger: aboutImg.closest('section'), start: 'top bottom', end: 'bottom top', scrub: .6 },
          });
        }
      }

      // ---- Hero exit: a pure opacity dissolve, no scale ----
      // An earlier version also scaled the section down as it exited; scale
      // shrinks the element's PAINTED size without changing its layout
      // box, so the vacated space (still full-height in the document flow)
      // exposed the bare page background as a dead black/empty frame before
      // the next section's content reached that scroll position. A plain
      // opacity fade never changes box size, so the next section is always
      // exactly where it needs to be underneath — no gap is possible.
      // Geometric Playground pins the hero for its own scan-progress scene
      // below (a second, independent ScrollTrigger on the same element with
      // pin:true) — fading it out here at the same time would fight that
      // pinned scene, so it opts out of the generic exit dissolve.
      if (heroSection && experimentalKey !== 'geometric-playground') {
        window.gsap.to(heroSection, {
          opacity: 0.15, ease: 'none',
          scrollTrigger: { trigger: heroSection, start: 'top top', end: 'bottom top', scrub: true },
        });
      }

      // ---- Value props: a thin progress rail fills as the row list scrolls
      // by — the "one subtle scroll-driven behavior" for an otherwise static
      // section, without turning it into another pinned/sticky moment. ----
      var valueRail = document.querySelector('.value-editorial-rail-fill');
      if (valueRail) {
        window.gsap.to(valueRail, {
          scaleY: 1, ease: 'none',
          scrollTrigger: {
            trigger: valueRail.closest('.value-editorial-list'),
            start: 'top 75%', end: 'bottom 75%', scrub: true,
          },
        });
      }

      // ---- Sticky storytelling: Services panel swaps as each item activates ----
      // The media panel itself is CSS position:sticky (not JS-pinned) — this
      // just toggles which image/item is "active" as the visitor scrolls,
      // real scrollytelling rather than a JS-driven pin.
      var storyItems = Array.prototype.slice.call(document.querySelectorAll('.story-item'));
      if (storyItems.length) {
        var storyImages = document.querySelectorAll('.story-img');
        storyItems.forEach(function (item) {
          window.ScrollTrigger.create({
            trigger: item, start: 'top center', end: 'bottom center',
            onEnter: function () { setActiveStoryIndex(item.getAttribute('data-story-index')); },
            onEnterBack: function () { setActiveStoryIndex(item.getAttribute('data-story-index')); },
          });
        });
        function setActiveStoryIndex(index) {
          storyItems.forEach(function (el) { el.classList.toggle('active', el.getAttribute('data-story-index') === index); });
          storyImages.forEach(function (el) { el.classList.toggle('active', el.getAttribute('data-story-index') === index); });
        }
      }

      // Re-measure once web fonts / lazy images have actually settled — the
      // one thing that can make a ScrollTrigger's cached start/end position
      // go stale (see buildSite.js note on why IntersectionObserver stays as
      // a fallback specifically for this).
      var refresh = function () { window.ScrollTrigger.refresh(); };
      if (document.fonts && document.fonts.ready) document.fonts.ready.then(refresh);
      window.addEventListener('load', refresh);
      setTimeout(refresh, 500);
      setTimeout(refresh, 1500);

      // ---- Safety net: force-reveal anything still hidden well after load,
      // in case a ScrollTrigger position went stale and never fired. ----
      setTimeout(function () {
        var stillHidden = document.querySelectorAll('.reveal:not(.in-view), .reveal-mask:not(.in-view), .img-clip-reveal:not(.in-view), [class*="reveal-dir-"]:not(.in-view), .split-word:not(.in-view)');
        if (!stillHidden.length) return;
        var io = new IntersectionObserver(function (entries) {
          entries.forEach(function (entry) {
            if (entry.isIntersecting) { markRevealed(entry.target); io.unobserve(entry.target); }
          });
        }, { threshold: 0.05 });
        stillHidden.forEach(function (el) { io.observe(el); });
      }, 3000);
    } else {
      // ---- No ScrollTrigger available (CDN blocked) — IntersectionObserver runs the whole show ----
      var observer = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          markRevealed(entry.target);
          if (entry.target.classList.contains('reveal-mask') || entry.target.classList.contains('split-word')) {
            var span = entry.target.querySelector('span');
            if (span) span.style.transform = 'none';
          }
          observer.unobserve(entry.target);
        });
      }, { threshold: 0.12 });
      belowFoldReveals.concat(belowFoldWords).forEach(function (el) { observer.observe(el); });
      staggerGroups.forEach(function (group) {
        var groupObserver = new IntersectionObserver(function (entries) {
          entries.forEach(function (entry) {
            if (!entry.isIntersecting) return;
            entry.target.querySelectorAll('.stagger-child').forEach(markRevealed);
            groupObserver.unobserve(entry.target);
          });
        }, { threshold: 0.15 });
        groupObserver.observe(group);
      });
      counters.forEach(function (el) {
        var target = parseFloat(el.getAttribute('data-counter-to'));
        var suffix = (el.textContent.match(/[^\d]+$/) || [''])[0];
        if (isFinite(target)) el.textContent = target + suffix;
      });
      // No ScrollTrigger to drive the story-section's active-item swap — show everything at once.
      document.querySelectorAll('.story-item, .story-img').forEach(function (el) { el.classList.add('active'); });
      // Plain rAF parallax fallback — environment-agnostic, no cached positions.
      if (!isMobile) {
        var fallbackParallax = document.querySelector('.hero-bg-img, .hero-visual-img');
        if (fallbackParallax) {
          var ticking = false;
          window.addEventListener('scroll', function () {
            if (ticking) return;
            ticking = true;
            requestAnimationFrame(function () {
              var offset = Math.min(window.scrollY * 0.15, 80);
              fallbackParallax.style.transform = 'translateY(' + offset + 'px) scale(1.08)';
              ticking = false;
            });
          }, { passive: true });
        }
      }
    }
  }

  // ---- Magnetic CTA buttons (desktop only, pointer-driven, capped travel) ----
  if (!reducedMotion && !isMobile && window.matchMedia('(pointer: fine)').matches) {
    document.querySelectorAll('.btn-magnetic').forEach(function (btn) {
      var strength = 14;
      btn.addEventListener('mousemove', function (e) {
        var rect = btn.getBoundingClientRect();
        var x = (e.clientX - rect.left - rect.width / 2) / (rect.width / 2);
        var y = (e.clientY - rect.top - rect.height / 2) / (rect.height / 2);
        btn.style.transform = 'translate(' + (x * strength) + 'px,' + (y * strength) + 'px)';
      });
      btn.addEventListener('mouseleave', function () { btn.style.transform = ''; });
    });
  }

  // ---- Card tilt (pointer-driven, only when the motion preset OR the
  // experimental layer's 'tilt-3d' technique asks for it — the experimental
  // layer gets a stronger tilt angle for a more real-perspective feel). ----
  var EXPERIMENTAL_TILT_PRESETS = { 'glass-3d-space': 1, 'layered-depth': 1, 'geometric-playground': 1, 'webgl-abstract': 1 };
  var wantsTilt = document.body.classList.contains('cardhover-tilt-depth') || (experimentalKey && EXPERIMENTAL_TILT_PRESETS[experimentalKey]);
  var tiltDegrees = experimentalKey && EXPERIMENTAL_TILT_PRESETS[experimentalKey] ? 14 : 8;
  if (!reducedMotion && !isMobile && wantsTilt && window.matchMedia('(pointer: fine)').matches) {
    document.querySelectorAll('.service-card, .bento-cell.card-bordered, .value-card.card-bordered').forEach(function (card) {
      card.addEventListener('mousemove', function (e) {
        var rect = card.getBoundingClientRect();
        var px = (e.clientX - rect.left) / rect.width - 0.5;
        var py = (e.clientY - rect.top) / rect.height - 0.5;
        card.style.setProperty('--tilt-x', (-py * tiltDegrees) + 'deg');
        card.style.setProperty('--tilt-y', (px * tiltDegrees) + 'deg');
      });
      card.addEventListener('mouseleave', function () {
        card.style.setProperty('--tilt-x', '0deg');
        card.style.setProperty('--tilt-y', '0deg');
      });
    });
  }

  // =====================================================================
  // EXPERIMENTAL MOTION LAYER — optional, rare (see experimentalMotion.js).
  // Everything below only runs when the corresponding markup/body class is
  // present, so a normal demo without this layer pays zero JS cost for it.
  // A real Three.js/WebGL scene for the particle-field technique (lazy-
  // loaded — see loadThreeJs — only when this technique is actually used),
  // falling back to a lightweight 2D canvas network field if WebGL is
  // unavailable or on mobile; CSS 3D transforms for everything else.
  // Skipped entirely under reduced motion; simplified/static on mobile.
  // =====================================================================
  if (!reducedMotion) {
    var experimentalLayer = document.querySelector('.experimental-layer');
    if (experimentalLayer) {
      var heroForExperimental = experimentalLayer.closest('.hero');

      // ---- Shared: is the hero currently on screen? Every continuous
      // render loop below (WebGL scene, canvas particle animation) checks
      // this before scheduling its next frame — "no continuous rendering
      // when the scene is off-screen." ----
      var heroIsVisible = true;
      if (heroForExperimental && 'IntersectionObserver' in window) {
        new IntersectionObserver(function (entries) {
          heroIsVisible = entries[entries.length - 1].isIntersecting;
        }, { threshold: 0.01 }).observe(heroForExperimental);
      }

      function hexColorFromCssVar(varName, fallback) {
        var raw = getComputedStyle(document.documentElement).getPropertyValue(varName).trim();
        if (/^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(raw)) return raw;
        return fallback;
      }

      // ---- 2D canvas particle field — the fallback used when WebGL is
      // unavailable, fails to load, or on mobile (mobile never attempts
      // WebGL at all: "mobile should use a simplified static/CSS version"). ----
      function start2dParticles(canvas) {
        var pctx = canvas.getContext('2d');
        if (!pctx) return;
        var particleCount = isMobile ? 22 : 60; // strict particle-count ceiling
        var particles = [];
        var resizeCanvas = function () {
          canvas.width = heroForExperimental.clientWidth;
          canvas.height = heroForExperimental.clientHeight;
        };
        resizeCanvas();
        window.addEventListener('resize', resizeCanvas, { passive: true });
        for (var pi = 0; pi < particleCount; pi++) {
          particles.push({
            x: Math.random() * canvas.width, y: Math.random() * canvas.height,
            vx: (Math.random() - 0.5) * 0.25, vy: (Math.random() - 0.5) * 0.25,
            r: Math.random() * 1.8 + 0.6,
          });
        }
        var accentColor = hexColorFromCssVar('--accent', '#7dd3fc');
        var drawParticles = function () {
          var w = canvas.width, h = canvas.height;
          pctx.clearRect(0, 0, w, h);
          for (var i = 0; i < particles.length; i++) {
            var p = particles[i];
            p.x += p.vx; p.y += p.vy;
            if (p.x < 0 || p.x > w) p.vx *= -1;
            if (p.y < 0 || p.y > h) p.vy *= -1;
            pctx.beginPath();
            pctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
            pctx.fillStyle = accentColor;
            pctx.globalAlpha = 0.75;
            pctx.fill();
            for (var j = i + 1; j < particles.length; j++) {
              var q = particles[j];
              var dx = p.x - q.x, dy = p.y - q.y;
              var dist = Math.sqrt(dx * dx + dy * dy);
              if (dist < 130) {
                pctx.globalAlpha = (1 - dist / 130) * 0.35;
                pctx.strokeStyle = accentColor;
                pctx.lineWidth = 1;
                pctx.beginPath();
                pctx.moveTo(p.x, p.y);
                pctx.lineTo(q.x, q.y);
                pctx.stroke();
              }
            }
          }
          pctx.globalAlpha = 1;
        };
        if (isMobile) {
          drawParticles(); // one static frame — no animation loop cost on mobile
        } else {
          (function animateParticles() {
            if (heroIsVisible) drawParticles();
            requestAnimationFrame(animateParticles);
          })();
        }
      }

      // ---- Real Three.js/WebGL scene: floating glass planes + depth-
      // separated network nodes with connecting lines, a real perspective
      // camera, pointer-driven camera movement, and a scroll-linked camera
      // dolly. Lazy-loaded — the library is only fetched when a preset with
      // the particle-field technique is actually present on the page. ----
      function webglSupported() {
        try {
          var c = document.createElement('canvas');
          return !!(window.WebGLRenderingContext && (c.getContext('webgl') || c.getContext('experimental-webgl')));
        } catch (e) { return false; }
      }

      function loadThreeJs(onDone) {
        if (window.THREE) { onDone(true); return; }
        var s = document.createElement('script');
        s.src = 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js';
        s.onload = function () { onDone(!!window.THREE); };
        s.onerror = function () { onDone(false); };
        document.head.appendChild(s);
      }

      function start3dScene(canvas) {
        try {
          var THREE = window.THREE;
          var renderer = new THREE.WebGLRenderer({ canvas: canvas, alpha: true, antialias: true });
          renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75)); // capped for high-DPI perf
          var w = heroForExperimental.clientWidth, h = heroForExperimental.clientHeight;
          renderer.setSize(w, h, false);

          var accentColor = new THREE.Color(hexColorFromCssVar('--accent', '#7dd3fc'));

          var scene = new THREE.Scene();
          scene.fog = new THREE.FogExp2(0x000000, 0.05);

          var camera = new THREE.PerspectiveCamera(52, w / h, 0.1, 100);
          var baseCameraZ = 16;
          camera.position.set(0, 0, baseCameraZ);

          scene.add(new THREE.AmbientLight(0xffffff, 0.7));
          var pointLight = new THREE.PointLight(accentColor, 1.4, 60);
          pointLight.position.set(6, 6, 10);
          scene.add(pointLight);

          // Depth-separated network nodes — a strict count ceiling for perf.
          var NODE_COUNT = isMobile ? 0 : 42;
          var nodeGeo = new THREE.SphereGeometry(0.055, 8, 8);
          var nodeMat = new THREE.MeshBasicMaterial({ color: accentColor });
          var nodes = [];
          for (var ni = 0; ni < NODE_COUNT; ni++) {
            var mesh = new THREE.Mesh(nodeGeo, nodeMat);
            mesh.position.set((Math.random() - 0.5) * 15, (Math.random() - 0.5) * 9, (Math.random() - 0.5) * 13);
            scene.add(mesh);
            nodes.push({ mesh: mesh, v: new THREE.Vector3((Math.random() - 0.5) * 0.012, (Math.random() - 0.5) * 0.012, (Math.random() - 0.5) * 0.012) });
          }

          // Connecting lines that appear/disappear as nodes drift within
          // range of each other — the "network lines appearing/disappearing
          // with depth" requirement.
          var maxSegments = NODE_COUNT * 3;
          var lineGeo = new THREE.BufferGeometry();
          var linePositions = new Float32Array(maxSegments * 2 * 3);
          lineGeo.setAttribute('position', new THREE.BufferAttribute(linePositions, 3));
          var lineMat = new THREE.LineBasicMaterial({ color: accentColor, transparent: true, opacity: 0.28 });
          var lineSegments = new THREE.LineSegments(lineGeo, lineMat);
          scene.add(lineSegments);

          // Floating translucent glass planes at distinct Z depths.
          var planeGeo = new THREE.PlaneGeometry(4.2, 3);
          var planes = [-6, -1.5, 3.5].map(function (z, idx) {
            var mat = new THREE.MeshPhysicalMaterial({
              color: 0xffffff, transparent: true, opacity: 0.07, roughness: 0.25, metalness: 0.05, side: THREE.DoubleSide,
            });
            var plane = new THREE.Mesh(planeGeo, mat);
            plane.position.set((idx - 1) * 3.2, idx % 2 ? 1.1 : -1.1, z);
            plane.rotation.set(0.12, (idx - 1) * 0.35, 0);
            scene.add(plane);
            return plane;
          });

          var pointerX = 0, pointerY = 0, scrollProgress = 0;
          if (!isMobile && window.matchMedia('(pointer: fine)').matches) {
            heroForExperimental.addEventListener('mousemove', function (e) {
              var rect = heroForExperimental.getBoundingClientRect();
              pointerX = (e.clientX - rect.left) / rect.width - 0.5;
              pointerY = (e.clientY - rect.top) / rect.height - 0.5;
            });
          }
          if (hasScrollTrigger) {
            window.ScrollTrigger.create({
              trigger: heroForExperimental, start: 'top top', end: 'bottom top', scrub: true,
              onUpdate: function (self) { scrollProgress = self.progress; },
            });
          }

          function renderFrame() {
            if (!heroIsVisible) { requestAnimationFrame(renderFrame); return; } // paused, not stopped — resumes on scroll back
            camera.position.x += (pointerX * 3 - camera.position.x) * 0.04;
            camera.position.y += (-pointerY * 1.8 - camera.position.y) * 0.04;
            camera.position.z = baseCameraZ - scrollProgress * 5; // scroll-linked camera dolly
            camera.lookAt(0, 0, 0);

            var segCount = 0;
            var posAttr = lineGeo.attributes.position;
            for (var a = 0; a < nodes.length; a++) {
              var na = nodes[a];
              na.mesh.position.add(na.v);
              if (Math.abs(na.mesh.position.x) > 7.5) na.v.x *= -1;
              if (Math.abs(na.mesh.position.y) > 4.5) na.v.y *= -1;
              if (Math.abs(na.mesh.position.z) > 6.5) na.v.z *= -1;
            }
            for (var x = 0; x < nodes.length && segCount < maxSegments; x++) {
              for (var y = x + 1; y < nodes.length && segCount < maxSegments; y++) {
                var pa = nodes[x].mesh.position, pb = nodes[y].mesh.position;
                if (pa.distanceTo(pb) < 3.1) {
                  posAttr.setXYZ(segCount * 2, pa.x, pa.y, pa.z);
                  posAttr.setXYZ(segCount * 2 + 1, pb.x, pb.y, pb.z);
                  segCount++;
                }
              }
            }
            lineGeo.setDrawRange(0, segCount * 2);
            posAttr.needsUpdate = true;

            planes.forEach(function (plane, idx) { plane.rotation.y += 0.0012 * (idx % 2 ? 1 : -1); });

            renderer.render(scene, camera);
            requestAnimationFrame(renderFrame);
          }
          renderFrame();

          window.addEventListener('resize', function () {
            var w2 = heroForExperimental.clientWidth, h2 = heroForExperimental.clientHeight;
            renderer.setSize(w2, h2, false);
            camera.aspect = w2 / h2;
            camera.updateProjectionMatrix();
          }, { passive: true });
        } catch (err) {
          start2dParticles(canvas); // WebGL context/scene setup failed at runtime — degrade gracefully
        }
      }

      var particleCanvas = experimentalLayer.querySelector('.experimental-particles');
      if (particleCanvas && heroForExperimental) {
        if (!isMobile && webglSupported()) {
          loadThreeJs(function (loaded) {
            if (loaded) start3dScene(particleCanvas);
            else start2dParticles(particleCanvas); // CDN failed to load — fall back gracefully
          });
        } else {
          start2dParticles(particleCanvas); // no WebGL, or mobile's simplified path
        }
      }

      // ---- Depth layers: mouse parallax (desktop) + scroll-linked depth ----
      var depthLayers = Array.prototype.slice.call(experimentalLayer.querySelectorAll('.depth-layer'));
      if (depthLayers.length && !isMobile && window.matchMedia('(pointer: fine)').matches && heroForExperimental) {
        heroForExperimental.addEventListener('mousemove', function (e) {
          var rect = heroForExperimental.getBoundingClientRect();
          var mx = (e.clientX - rect.left) / rect.width - 0.5;
          var my = (e.clientY - rect.top) / rect.height - 0.5;
          depthLayers.forEach(function (layer) {
            var depth = parseFloat(layer.getAttribute('data-depth')) || 0.3;
            layer.style.transform = layer.style.transform.replace(/translate3d\([^)]*\)\s*/, '')
              + ' translate3d(' + (mx * depth * 60) + 'px,' + (my * depth * 60) + 'px, 0)';
          });
        });
      }
      if (hasScrollTrigger && heroForExperimental) {
        depthLayers.forEach(function (layer, idx) {
          var depth = parseFloat(layer.getAttribute('data-depth')) || 0.3;
          window.gsap.to(layer, {
            yPercent: 30 * depth * (idx % 2 === 0 ? 1 : -1), ease: 'none',
            scrollTrigger: { trigger: heroForExperimental, start: 'top top', end: 'bottom top', scrub: true },
          });
        });
      }

      // ---- "Camera" tilt: rotating the whole experimental layer (its
      // children keep their own real translateZ depths, so this genuinely
      // separates them, not just a flat parallax offset) toward the cursor —
      // Layered Depth's "subtle mouse-driven camera/parallax" and Geometric
      // Playground's "subtle cursor response". ----
      if ((experimentalKey === 'layered-depth' || experimentalKey === 'geometric-playground')
        && !isMobile && window.matchMedia('(pointer: fine)').matches && heroForExperimental) {
        heroForExperimental.addEventListener('mousemove', function (e) {
          var rect = heroForExperimental.getBoundingClientRect();
          var mx = (e.clientX - rect.left) / rect.width - 0.5;
          var my = (e.clientY - rect.top) / rect.height - 0.5;
          experimentalLayer.style.transform = 'rotateX(' + (my * -6) + 'deg) rotateY(' + (mx * 8) + 'deg)';
        });
        heroForExperimental.addEventListener('mouseleave', function () {
          experimentalLayer.style.transform = 'rotateX(0deg) rotateY(0deg)';
        });
      }

      // ---- Rotating shapes: rotation/scale tied to scroll progress
      // (Geometric Playground's own pinned scene below drives them instead,
      // via scan-progress, so this generic scroll tween is skipped there to
      // avoid two different scroll mechanisms fighting the same elements). ----
      var rotatingShapes = Array.prototype.slice.call(experimentalLayer.querySelectorAll('.rotating-shape'));
      if (rotatingShapes.length && hasScrollTrigger && heroForExperimental && experimentalKey !== 'geometric-playground') {
        rotatingShapes.forEach(function (shape, idx) {
          window.gsap.to(shape, {
            rotation: idx % 2 === 0 ? 140 : -110, scale: 1.15, ease: 'none',
            scrollTrigger: { trigger: heroForExperimental, start: 'top top', end: 'bottom top', scrub: true },
          });
        });
      }

      // ---- Geometric Playground: a real pinned scanner scene — the hero
      // holds in place for a short extra scroll distance while the scan
      // beam sweeps top-to-bottom exactly once, tied to scroll progress
      // (not an infinite CSS loop), lighting up whichever geometric shape
      // it currently crosses. Skipped on mobile (its simplified/static path
      // keeps the original lightweight CSS loop instead — see base.css). ----
      if (experimentalKey === 'geometric-playground' && hasScrollTrigger && heroForExperimental && !isMobile) {
        var scanBeam = experimentalLayer.querySelector('.scan-line');
        if (scanBeam) scanBeam.style.animation = 'none'; // JS now drives its position
        window.ScrollTrigger.create({
          trigger: heroForExperimental, start: 'top top', end: '+=700', pin: true, scrub: true,
          onUpdate: function (self) {
            if (scanBeam) { scanBeam.style.top = (self.progress * 100) + '%'; scanBeam.style.opacity = 1; }
            var heroRect = heroForExperimental.getBoundingClientRect();
            rotatingShapes.forEach(function (shape) {
              var r = shape.getBoundingClientRect();
              var relY = (r.top + r.height / 2 - heroRect.top) / heroRect.height;
              shape.classList.toggle('scan-lit', Math.abs(relY - self.progress) < 0.09);
            });
          },
        });
      }

      // ---- Cursor-reactive spotlight ----
      var spotlight = experimentalLayer.querySelector('.cursor-spotlight');
      if (spotlight && !isMobile && window.matchMedia('(pointer: fine)').matches && heroForExperimental) {
        heroForExperimental.addEventListener('mousemove', function (e) {
          var rect = heroForExperimental.getBoundingClientRect();
          spotlight.style.setProperty('--sx', ((e.clientX - rect.left) / rect.width * 100) + '%');
          spotlight.style.setProperty('--sy', ((e.clientY - rect.top) / rect.height * 100) + '%');
        });
      }

      // ---- Kinetic typography: hero heading tilts toward the cursor ----
      if (document.body.classList.contains('experimental-kinetic-typography') && !isMobile
        && window.matchMedia('(pointer: fine)').matches && heroForExperimental) {
        var kineticHeading = heroForExperimental.querySelector('.hero-inner h1');
        if (kineticHeading) {
          heroForExperimental.addEventListener('mousemove', function (e) {
            var rect = heroForExperimental.getBoundingClientRect();
            var kx = (e.clientX - rect.left) / rect.width - 0.5;
            var ky = (e.clientY - rect.top) / rect.height - 0.5;
            kineticHeading.style.transform = 'perspective(900px) rotateX(' + (ky * -6) + 'deg) rotateY(' + (kx * 8) + 'deg)';
          });
          heroForExperimental.addEventListener('mouseleave', function () {
            kineticHeading.style.transform = 'perspective(900px) rotateX(0deg) rotateY(0deg)';
          });
        }
      }
    }
  }
})();
