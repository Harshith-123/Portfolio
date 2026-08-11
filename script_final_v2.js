/* ============================================================
   NAVBAR TRANSPARENCY OVER VIDEO HERO
   ============================================================ */
const navbar     = document.getElementById('navbar');
const topStrip   = document.querySelector('.top-strip');
const videoHero  = document.getElementById('home');

function syncNavStyle() {
  if (!videoHero || !navbar) return;
  const below = videoHero.getBoundingClientRect().bottom < 60;
  navbar.classList.toggle('nav-over-video', !below);
  if (topStrip) topStrip.classList.toggle('ts-over-video', !below);
}
window.addEventListener('scroll', syncNavStyle, { passive: true });

/* ============================================================
   VIDEO CONTROLS
   ============================================================ */
const heroVideo     = document.getElementById('heroVideo');
const playPauseBtn  = document.getElementById('playPauseBtn');
const muteBtn       = document.getElementById('muteBtn');
const soundHint     = document.getElementById('soundHint');
const scrollIndicator = document.getElementById('scrollIndicator');

if (heroVideo) {
  const isMobile = window.matchMedia('(max-width: 900px)').matches;

  let loopCount = 0;
  let userInteracted = false;

  // Track any user gesture so we know unmute is safe
  const markInteracted = () => { userInteracted = true; };
  document.addEventListener('touchstart', markInteracted, { once: true, passive: true });
  document.addEventListener('click', markInteracted, { once: true });

  const startPlay = (shouldUnmute) => {
    heroVideo.currentTime = 0;
    heroVideo.muted = true;
    heroVideo.play().then(() => {
      if (shouldUnmute) {
        heroVideo.muted = false;
        if (muteBtn) muteBtn.querySelector('i').className = 'bx bx-volume-full';
      } else {
        heroVideo.muted = true;
        if (muteBtn) muteBtn.querySelector('i').className = 'bx bx-volume-mute';
      }
      if (playPauseBtn) playPauseBtn.querySelector('i').className = 'bx bx-pause';
    }).catch(() => {});
  };

  const replayWithGap = () => {
    if (playPauseBtn) playPauseBtn.querySelector('i').className = 'bx bx-play';
    setTimeout(() => startPlay(loopCount < 2), 2000);
  };

  heroVideo.addEventListener('ended', () => {
    loopCount++;
    replayWithGap();
  });

  if (isMobile) {
    // Mobile: autoplay muted, then unmute via the mute button tap (first user gesture).
    // On ended cycle 1 & 2 replay with sound; after cycle 2 mute permanently.
    heroVideo.playbackRate = 0.9;
    heroVideo.muted = true;
    heroVideo.play().then(() => {
      if (playPauseBtn) playPauseBtn.querySelector('i').className = 'bx bx-pause';
    }).catch(() => {});
    // Show sound hint so user knows to tap for audio
    if (muteBtn) muteBtn.querySelector('i').className = 'bx bx-volume-mute';
  } else {
    // Desktop: pause then start after 2 s with audio
    heroVideo.pause();
    setTimeout(() => {
      heroVideo.playbackRate = 0.9;
      startPlay(true);
      if (soundHint && typeof gsap !== 'undefined') {
        gsap.to(soundHint, { opacity: 0, pointerEvents: 'none', duration: 0.8, ease: 'power2.in' });
      }
    }, 2000);
  }

  playPauseBtn.addEventListener('click', () => {
    if (heroVideo.paused) {
      heroVideo.play();
      playPauseBtn.querySelector('i').className = 'bx bx-pause';
    } else {
      heroVideo.pause();
      playPauseBtn.querySelector('i').className = 'bx bx-play';
    }
  });

  muteBtn.addEventListener('click', () => {
    heroVideo.muted = !heroVideo.muted;
    muteBtn.querySelector('i').className = heroVideo.muted ? 'bx bx-volume-mute' : 'bx bx-volume-full';
    if (!heroVideo.muted) {
      userInteracted = true;
      if (soundHint && typeof gsap !== 'undefined') {
        gsap.to(soundHint, { opacity: 0, pointerEvents: 'none', duration: 0.5, ease: 'power2.in' });
      }
    }
  });
}

if (scrollIndicator) {
  scrollIndicator.addEventListener('click', () => {
    const next = document.getElementById('about');
    if (next) next.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
}

/* ============================================================
   GSAP ENTRANCE ANIMATIONS
   ============================================================ */
if (typeof gsap !== 'undefined') {
  gsap.timeline({ defaults: { ease: 'power3.out' } })
    .from('.vh-section-label', { opacity: 0, y: 10, duration: 0.7 }, 0.2)
    .from('.vh-tagline',       { opacity: 0, y: 14, duration: 0.8 }, 0.35)
    .from('.vh-heading',       { opacity: 0, y: 28, duration: 1.0, ease: 'expo.out' }, 0.5)
    .from('.vh-subtitle',      { opacity: 0, y: 18, duration: 0.85 }, 0.8)
    .from('.vh-actions',       { opacity: 0, y: 14, duration: 0.8 }, 0.98)
    .from('.vh-meta',          { opacity: 0, duration: 0.8 }, 1.1)
    .from('.vh-controls',      { opacity: 0, duration: 0.8 }, 1.15)
    .from('.vh-sound-badge',   { opacity: 0, duration: 0.8 }, 1.2)
    .from('.vh-scroll-btn',    { opacity: 0, duration: 0.8 }, 1.25);
}

/* ============================================================
   THREE.JS DNA FIELD — FIXED FULL-PAGE NIGHT-SKY BACKGROUND
   A starfield behind ten short, independently-spinning DNA strands.
   Scrolling glides the camera down through them; any strand that
   scrolls off the top is recycled to reappear further down.
   ============================================================ */
(function () {
  if (typeof THREE === 'undefined') return;
  const canvas = document.getElementById('dnaBgCanvas');
  if (!canvas) return;

  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, preserveDrawingBuffer: true });
  } catch (e) {
    return; // no WebGL — page-bg CSS background stands in as the fallback
  }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
  renderer.setClearColor(0x000000, 0);

  const scene  = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 200);
  camera.position.z = 13;

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  let halfVisible = 6;
  // zoom out on narrow screens so the strands don't overwhelm the content column
  function updateCameraDistance() {
    camera.position.z = window.innerWidth < 700 ? 19 : 13;
    halfVisible = camera.position.z * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
  }
  updateCameraDistance();

  /* --- night-sky starfield -------------------------------------------
     Follows the camera vertically so the sky always feels infinite. */
  const starGroup = new THREE.Group();
  scene.add(starGroup);
  (function buildStars() {
    const STAR_COUNT = 1700;
    const pos = new Float32Array(STAR_COUNT * 3);
    const sz  = new Float32Array(STAR_COUNT);
    const ph  = new Float32Array(STAR_COUNT);
    const col = new Float32Array(STAR_COUNT * 3);
    const tint = [
      [1.00, 1.00, 1.00],
      [0.80, 0.88, 1.00],
      [1.00, 0.93, 0.82],
      [0.75, 0.95, 1.00],
    ];
    for (let i = 0; i < STAR_COUNT; i++) {
      pos[i*3]     = (Math.random() - 0.5) * 80;
      pos[i*3 + 1] = (Math.random() - 0.5) * 90;
      pos[i*3 + 2] = -12 - Math.random() * 55;
      sz[i] = Math.random() * 0.55 + 0.1;
      ph[i] = Math.random() * Math.PI * 2;
      const c = tint[(Math.random() * tint.length) | 0];
      col[i*3] = c[0]; col[i*3+1] = c[1]; col[i*3+2] = c[2];
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    geo.setAttribute('aSize',    new THREE.BufferAttribute(sz, 1));
    geo.setAttribute('aPhase',   new THREE.BufferAttribute(ph, 1));
    geo.setAttribute('aColor',   new THREE.BufferAttribute(col, 3));
    const mat = new THREE.ShaderMaterial({
      uniforms: { uTime: { value: 0 } },
      vertexShader: `
        attribute float aSize;
        attribute float aPhase;
        attribute vec3  aColor;
        uniform   float uTime;
        varying   float vAlpha;
        varying   vec3  vColor;
        void main() {
          vColor = aColor;
          vAlpha = 0.4 + 0.6 * sin(uTime * 0.6 + aPhase);
          vec4 mv = modelViewMatrix * vec4(position, 1.0);
          gl_Position  = projectionMatrix * mv;
          gl_PointSize = aSize * 110.0 / (-mv.z);
        }
      `,
      fragmentShader: `
        varying float vAlpha;
        varying vec3  vColor;
        void main() {
          vec2  uv = gl_PointCoord - 0.5;
          float d  = length(uv);
          if (d > 0.5) discard;
          float a = pow(smoothstep(0.5, 0.0, d), 1.6) * vAlpha;
          gl_FragColor = vec4(vColor, a);
        }
      `,
      transparent: true,
      depthWrite: false,
    });
    starGroup.add(new THREE.Points(geo, mat));
    starGroup.userData.mat = mat;
  })();

  /* --- DNA strands -----------------------------------------------
     Ten short glowing double-helix segments. Each spins on its own
     axis; when one scrolls off the top it's recycled below the
     lowest segment, so new strands keep arriving as you scroll down. */
  const SEGMENT_COUNT  = 10;
  const SEGMENT_HEIGHT = 9;        // world units — kept short on purpose
  const SPACING        = 10;       // vertical gap between segment starts (tight — avoids empty dead zones between strands)
  const RADIUS         = 2.4;
  const TURN_PERIOD    = 4.6;      // world units per full 360° turn
  const CTRL_PER_UNIT  = 6;        // curve control-point density
  const PX_PER_UNIT    = 90;       // scroll px -> 1 world unit
  const BEAD_STRIDE    = 4;        // a nucleotide bead + rung every N control points
  const TUBE_RADIUS    = 0.16;
  const GLOW_RADIUS    = 0.4;      // soft outer halo around each strand
  const RECYCLE_BUFFER = 3;

  const warm   = [1.0, 0.26, 0.52];   // strand A — vivid rose/magenta (was yellow-amber)
  const silver = [0.55, 0.82, 1.0];   // strand B — icy shining blue-silver
  const glow   = [0.82, 0.8, 1.0];    // base-pair rungs — soft lavender-white

  const tubularSegments = Math.round(SEGMENT_HEIGHT * 14);
  const count = Math.round(SEGMENT_HEIGHT * CTRL_PER_UNIT);

  function mkTube(pts, color, radius, opacity) {
    const curve = new THREE.CatmullRomCurve3(pts);
    const geo = new THREE.TubeGeometry(curve, tubularSegments, radius, 6, false);
    const mat = new THREE.MeshBasicMaterial({
      color, transparent: true, opacity,
      blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide,
    });
    return new THREE.Mesh(geo, mat);
  }

  function buildSegment() {
    const ptsA = [], ptsB = [];
    const beadPos = [], beadColor = [];
    const rungPositions = [], rungColors = [];

    for (let i = 0; i < count; i++) {
      const t = i / (count - 1);
      const y = -t * SEGMENT_HEIGHT;
      const theta = (y / TURN_PERIOD) * Math.PI * 2;

      const ax = Math.cos(theta) * RADIUS, az = Math.sin(theta) * RADIUS;
      const bx = Math.cos(theta + Math.PI) * RADIUS, bz = Math.sin(theta + Math.PI) * RADIUS;

      ptsA.push(new THREE.Vector3(ax, y, az));
      ptsB.push(new THREE.Vector3(bx, y, bz));

      if (i % BEAD_STRIDE === 0) {
        beadPos.push(ax, y, az, bx, y, bz);
        beadColor.push(warm[0], warm[1], warm[2], silver[0], silver[1], silver[2]);
        rungPositions.push(ax, y, az, bx, y, bz);
        rungColors.push(glow[0], glow[1], glow[2], glow[0], glow[1], glow[2]);
      }
    }

    const colorA = new THREE.Color(warm[0], warm[1], warm[2]);
    const colorB = new THREE.Color(silver[0], silver[1], silver[2]);

    const group = new THREE.Group();
    // soft outer halo + bright core so each strand reads as a clean glowing line
    group.add(
      mkTube(ptsA, colorA, GLOW_RADIUS, 0.16),
      mkTube(ptsB, colorB, GLOW_RADIUS, 0.2),
      mkTube(ptsA, colorA, TUBE_RADIUS, 0.9),
      mkTube(ptsB, colorB, TUBE_RADIUS, 1.0),
    );

    const beadGeo = new THREE.BufferGeometry();
    beadGeo.setAttribute('position', new THREE.Float32BufferAttribute(beadPos, 3));
    beadGeo.setAttribute('color', new THREE.Float32BufferAttribute(beadColor, 3));
    group.add(new THREE.Points(beadGeo, new THREE.PointsMaterial({
      size: 0.55, vertexColors: true, transparent: true, opacity: 1,
      blending: THREE.AdditiveBlending, depthWrite: false, sizeAttenuation: true,
    })));

    const rungGeo = new THREE.BufferGeometry();
    rungGeo.setAttribute('position', new THREE.Float32BufferAttribute(rungPositions, 3));
    rungGeo.setAttribute('color', new THREE.Float32BufferAttribute(rungColors, 3));
    group.add(new THREE.LineSegments(rungGeo, new THREE.LineBasicMaterial({
      vertexColors: true, transparent: true, opacity: 0.65,
      blending: THREE.AdditiveBlending, depthWrite: false,
    })));

    return group;
  }

  // each strand leans at its own fixed angle (straight, 45°, and everything
  // between) so the field doesn't read as one repeated shape
  const TILT_PRESETS_DEG = [0, 45, -45, 20, -20, 60, -60, 30, -30, 50];

  const segments = [];
  for (let i = 0; i < SEGMENT_COUNT; i++) {
    const group = buildSegment();
    const baseY = -i * SPACING;
    group.position.y = baseY;
    group.rotation.z = THREE.MathUtils.degToRad(TILT_PRESETS_DEG[i % TILT_PRESETS_DEG.length]);
    group.rotation.x = THREE.MathUtils.degToRad((Math.random() - 0.5) * 30);
    const dir = Math.random() < 0.5 ? -1 : 1;
    const speed = dir * (0.004 + Math.random() * 0.004); // each strand spins independently
    scene.add(group);
    segments.push({ group, baseY, speed });
  }

  function resize() {
    renderer.setSize(window.innerWidth, window.innerHeight);
    camera.aspect = window.innerWidth / window.innerHeight;
    updateCameraDistance();
    camera.updateProjectionMatrix();
  }
  resize();
  window.addEventListener('resize', resize, { passive: true });

  let mx = 0, my = 0, tx = 0, ty = 0;
  window.addEventListener('mousemove', e => {
    mx = (e.clientX / window.innerWidth  - 0.5) * 2;
    my = (e.clientY / window.innerHeight - 0.5) * 2;
  }, { passive: true });

  let scrollWorldY = 0;
  window.addEventListener('scroll', () => {
    scrollWorldY = window.scrollY / PX_PER_UNIT;
  }, { passive: true });

  let active = document.visibilityState === 'visible', rafId;
  document.addEventListener('visibilitychange', () => {
    active = document.visibilityState === 'visible';
    if (active && !rafId) tick();
  });

  function tick() {
    if (!active) { rafId = null; return; }
    rafId = requestAnimationFrame(tick);

    const now = performance.now() * 0.001;
    starGroup.userData.mat.uniforms.uTime.value = now;

    // scrolling glides the camera down through the field, revealing new
    // strands that were off-screen a moment ago
    const targetY = -scrollWorldY;
    camera.position.y += (targetY - camera.position.y) * 0.06;

    tx += (mx * 0.6 - tx) * 0.03;
    ty += (-my * 0.35 - ty) * 0.03;
    camera.position.x += (tx - camera.position.x) * 0.05;
    camera.lookAt(0, camera.position.y - ty, 0);

    starGroup.position.y = camera.position.y;
    starGroup.position.x = camera.position.x * 0.4;

    const visibleTop = camera.position.y + halfVisible + RECYCLE_BUFFER;
    for (const seg of segments) {
      if (!reduceMotion) seg.group.rotation.y += seg.speed;

      const bottom = seg.baseY - SEGMENT_HEIGHT;
      if (bottom > visibleTop) {
        // this strand has scrolled fully past the top — recycle it to
        // reappear below the current lowest strand
        let minBase = segments[0].baseY;
        for (const other of segments) if (other.baseY < minBase) minBase = other.baseY;
        seg.baseY = minBase - SPACING;
        seg.group.position.y = seg.baseY;
      }
    }

    renderer.render(scene, camera);
  }
  tick();
})();

/* ============================================================
   THREE.JS CINEMATIC PARTICLE LAYER
   ============================================================ */
(function () {
  if (typeof THREE === 'undefined') return;
  const canvas = document.getElementById('cinematicCanvas');
  if (!canvas) return;

  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: false });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setClearColor(0x000000, 0);

  const scene  = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.1, 100);
  camera.position.z = 5;

  const COUNT = 220;
  const pos = new Float32Array(COUNT * 3);
  const col = new Float32Array(COUNT * 3);
  const sz  = new Float32Array(COUNT);
  const spd = new Float32Array(COUNT);
  const ph  = new Float32Array(COUNT);

  const palette = [
    [1.0, 0.55, 0.22],
    [1.0, 0.96, 0.88],
    [1.0, 0.82, 0.38],
    [1.0, 0.68, 0.38],
    [0.96, 0.88, 0.72],
  ];

  for (let i = 0; i < COUNT; i++) {
    pos[i*3]     = (Math.random() - 0.5) * 16;
    pos[i*3 + 1] = (Math.random() - 0.5) * 10;
    pos[i*3 + 2] = (Math.random() - 0.5) * 7;
    sz[i]  = Math.random() * 0.65 + 0.15;
    spd[i] = Math.random() * 0.5 + 0.1;
    ph[i]  = Math.random() * Math.PI * 2;
    const c = palette[Math.floor(Math.random() * palette.length)];
    col[i*3]     = c[0];
    col[i*3 + 1] = c[1];
    col[i*3 + 2] = c[2];
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setAttribute('aColor',   new THREE.BufferAttribute(col, 3));
  geo.setAttribute('aSize',    new THREE.BufferAttribute(sz,  1));
  geo.setAttribute('aSpeed',   new THREE.BufferAttribute(spd, 1));
  geo.setAttribute('aPhase',   new THREE.BufferAttribute(ph,  1));

  const mat = new THREE.ShaderMaterial({
    uniforms: { uTime: { value: 0 } },
    vertexShader: `
      attribute vec3  aColor;
      attribute float aSize;
      attribute float aSpeed;
      attribute float aPhase;
      uniform   float uTime;
      varying   vec3  vColor;
      varying   float vAlpha;
      void main() {
        vColor = aColor;
        vAlpha = 0.38 + 0.28 * sin(uTime * aSpeed * 0.8 + aPhase);
        vec3 p = position;
        p.y += sin(uTime * aSpeed * 0.38 + aPhase) * 0.22;
        p.x += cos(uTime * aSpeed * 0.26 + aPhase * 1.3) * 0.14;
        vec4 mv = modelViewMatrix * vec4(p, 1.0);
        gl_Position   = projectionMatrix * mv;
        gl_PointSize  = aSize * 130.0 / (-mv.z);
      }
    `,
    fragmentShader: `
      varying vec3  vColor;
      varying float vAlpha;
      void main() {
        vec2  uv = gl_PointCoord - 0.5;
        float d  = length(uv);
        if (d > 0.5) discard;
        float a = pow(smoothstep(0.5, 0.0, d), 1.8) * vAlpha * 0.62;
        gl_FragColor = vec4(vColor, a);
      }
    `,
    transparent: true,
    blending:    THREE.AdditiveBlending,
    depthWrite:  false,
  });

  scene.add(new THREE.Points(geo, mat));

  let mx = 0, my = 0, tx = 0, ty = 0;
  window.addEventListener('mousemove', e => {
    mx = (e.clientX / window.innerWidth  - 0.5) * 2;
    my = (e.clientY / window.innerHeight - 0.5) * 2;
  }, { passive: true });

  let active = true, rafId;
  function tick() {
    if (!active) return;
    rafId = requestAnimationFrame(tick);
    mat.uniforms.uTime.value = performance.now() * 0.001;
    tx += (mx * 0.35 - tx) * 0.035;
    ty += (-my * 0.22 - ty) * 0.035;
    camera.position.x = tx;
    camera.position.y = ty;
    camera.lookAt(0, 0, 0);
    renderer.render(scene, camera);
  }
  tick();

  if (videoHero) {
    new IntersectionObserver(entries => {
      active = entries[0].isIntersecting;
      if (active && !rafId) tick();
    }, { threshold: 0 }).observe(videoHero);
  }

  window.addEventListener('resize', () => {
    renderer.setSize(window.innerWidth, window.innerHeight);
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
  }, { passive: true });
})();

const menuBtn = document.getElementById('menuBtn');
const mobilePanel = document.getElementById('mobilePanel');

menuBtn.addEventListener('click', () => {
  mobilePanel.classList.toggle('open');
});

document.querySelectorAll('.mobile-panel a').forEach(link => {
  link.addEventListener('click', () => mobilePanel.classList.remove('open'));
});

window.addEventListener('click', (event) => {
  if (!mobilePanel.contains(event.target) && !menuBtn.contains(event.target)) {
    mobilePanel.classList.remove('open');
  }
});

/* Reveal-on-scroll using getBoundingClientRect.
   NOTE: an IntersectionObserver with a percentage threshold fails for very
   tall sections — e.g. the single-column Projects grid on mobile is ~6000px,
   so its visible ratio never reaches 12% on a ~700px phone viewport and the
   whole section stays at opacity:0 ("can't see the projects"). A rect check
   on the element's top edge is immune to element height. */
const revealItems = Array.from(document.querySelectorAll('.reveal-up'));
let revealTicking = false;
function revealOnScroll() {
  revealTicking = false;
  const trigger = window.innerHeight * 0.92;
  for (let i = revealItems.length - 1; i >= 0; i--) {
    const item = revealItems[i];
    const rect = item.getBoundingClientRect();
    if (rect.top < trigger && rect.bottom > 0) {
      item.classList.add('is-visible');
      revealItems.splice(i, 1);     // reveal once, then stop tracking
    }
  }
}
function queueReveal() {
  if (revealTicking) return;
  revealTicking = true;
  requestAnimationFrame(revealOnScroll);
}
window.addEventListener('scroll', queueReveal, { passive: true });
window.addEventListener('resize', queueReveal, { passive: true });
window.addEventListener('load', revealOnScroll);
revealOnScroll();

/* ============================================================
   3D INTERACTIVE TILT — PROJECT CARDS
   ============================================================ */
(function () {
  const cards = document.querySelectorAll('.project-card');
  if (!cards.length) return;

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const coarse = window.matchMedia('(hover: none), (pointer: coarse)').matches;
  if (reduceMotion || coarse) return;

  const MAX_TILT = 8;   // degrees

  cards.forEach(card => {
    const shine = card.querySelector('.project-shine');
    let raf = null;

    const onMove = (e) => {
      const r = card.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width;   // 0 → 1
      const py = (e.clientY - r.top) / r.height;   // 0 → 1
      const rotY = (px - 0.5) * 2 * MAX_TILT;
      const rotX = (0.5 - py) * 2 * MAX_TILT;

      if (raf) cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        card.style.transform =
          `translateY(-8px) rotateX(${rotX.toFixed(2)}deg) rotateY(${rotY.toFixed(2)}deg)`;
        if (shine) {
          shine.style.setProperty('--mx', (px * 100).toFixed(1) + '%');
          shine.style.setProperty('--my', (py * 100).toFixed(1) + '%');
        }
      });
    };

    const onLeave = () => {
      if (raf) cancelAnimationFrame(raf);
      card.style.transform = '';
    };

    card.addEventListener('pointermove', onMove);
    card.addEventListener('pointerleave', onLeave);
  });
})();

document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', (e) => {
    const target = document.querySelector(anchor.getAttribute('href'));
    if (!target) return;
    e.preventDefault();
    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
});

emailjs.init('PX3FWtX8cihpOy8oG');

const contactForm = document.getElementById('contactForm');
const formNote = document.getElementById('formNote');

contactForm.addEventListener('submit', (e) => {
  e.preventDefault();
  formNote.textContent = 'Sending...';

  const [name, email, subject, message] = contactForm.querySelectorAll('input, textarea');

  emailjs.send('service_a7qtvtk', 'template_t9t1r5o', {
    from_name: name.value,
    from_email: email.value,
    subject: subject.value,
    message: message.value
  }).then(() => {
    formNote.textContent = 'Message sent successfully!';
    contactForm.reset();
  }).catch(() => {
    formNote.textContent = 'Something went wrong. Please try again.';
  });
});
