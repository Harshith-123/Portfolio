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
