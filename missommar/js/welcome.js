// welcome.js – morphande bakgrundsbilder med Ken Burns-effekt
//
// Bilderna laddas automatiskt från /images/
// Filnamnen matchar dina uppladdade bilder
//
const BG_IMAGES = [
  'images/IMG_1443.JPG',
  'images/IMG_1450.JPG',
  'images/IMG_1451.JPG',
  'images/IMG_1454.JPG',
  'images/IMG_1501.JPG',
  'images/IMG_1506.JPG',
  'images/IMG_1517.JPG',
  'images/IMG_1521.JPG'
];

const INTERVAL  = 6000; // ms mellan bildbyten
const container = document.getElementById('heroSlideshow');
const layers    = [];
let currentIndex = 0;

function init() {
  if (!container || BG_IMAGES.length === 0) return;

  BG_IMAGES.forEach(function (src) {
    const div = document.createElement('div');
    div.className = 'hero-layer';
    div.style.backgroundImage = "url('" + src + "')";
    container.appendChild(div);
    layers.push(div);
  });

  layers[0].classList.add('active');

  if (layers.length > 1) {
    setInterval(nextImage, INTERVAL);
  }
}

function nextImage() {
  const prev = layers[currentIndex];
  currentIndex = (currentIndex + 1) % layers.length;
  const next = layers[currentIndex];

  prev.classList.remove('active');
  // Starta om animation
  void next.offsetWidth;
  next.classList.add('active');
}

init();
initHeroFX();

function initHeroFX() {
  const canvas = document.getElementById('heroGrain');
  if (!canvas) return;

  function resize() {
    canvas.width  = canvas.offsetWidth  || canvas.parentElement.offsetWidth;
    canvas.height = canvas.offsetHeight || canvas.parentElement.offsetHeight;
  }
  resize();
  window.addEventListener('resize', resize);

  const ctx = canvas.getContext('2d');

  let leakActive  = false;
  let leakStart   = 0;
  const LEAK_DUR  = 700; // ms

  function maybeStartLeak() {
    if (!leakActive && Math.random() < 0.004) {
      leakActive = true;
      leakStart  = performance.now();
    }
  }

  let lastFrame = 0;
  const FPS = 22;
  const FRAME_MS = 1000 / FPS;

  function draw(ts) {
    requestAnimationFrame(draw);
    if (ts - lastFrame < FRAME_MS) return;
    lastFrame = ts;

    const w = canvas.width, h = canvas.height;
    if (w === 0 || h === 0) return;

    // Per-pixel film grain
    const img  = ctx.createImageData(w, h);
    const data = img.data;
    for (let i = 0; i < data.length; i += 4) {
      const n = (Math.random() * 255) | 0;
      data[i]     = n;
      data[i + 1] = n * 0.92 | 0; // slight warm tint
      data[i + 2] = n * 0.78 | 0;
      data[i + 3] = 38;
    }
    ctx.putImageData(img, 0, 0);

    // Warm golden light leak
    maybeStartLeak();
    if (leakActive) {
      const elapsed  = ts - leakStart;
      const progress = elapsed / LEAK_DUR;
      if (progress >= 1) {
        leakActive = false;
      } else {
        // bell-curve opacity: peaks at 50%
        const t = progress < 0.5 ? progress * 2 : (1 - progress) * 2;
        const alpha = t * 0.38;
        const rx = 0.15 + Math.random() * 0.55;
        const ry = 0.1  + Math.random() * 0.55;
        const grad = ctx.createRadialGradient(
          rx * w, ry * h, 0,
          rx * w, ry * h, Math.min(w, h) * 0.6
        );
        grad.addColorStop(0,   `rgba(255,215,90,${alpha})`);
        grad.addColorStop(0.5, `rgba(255,140,30,${alpha * 0.35})`);
        grad.addColorStop(1,    'rgba(255,100,10,0)');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, w, h);
      }
    }
  }

  requestAnimationFrame(draw);
}
