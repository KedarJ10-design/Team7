'use client';

/**
 * Lightweight, high-performance HTML5 Canvas Confetti Engine
 * Zero dependencies, auto-cleaning, 60fps particle physics
 */

interface Particle {
  x: number;
  y: number;
  w: number;
  h: number;
  color: string;
  vx: number;
  vy: number;
  angle: number;
  angularVelocity: number;
  opacity: number;
}

export function fireConfetti(options?: {
  theme?: 'safe' | 'gold' | 'watermelon' | 'team';
  particleCount?: number;
}) {
  if (typeof window === 'undefined' || typeof document === 'undefined') return;

  const count = options?.particleCount || 65;
  const theme = options?.theme || 'safe';

  const paletteMap = {
    safe: ['#10b981', '#34d399', '#6ee7b7', '#059669', '#a7f3d0'],
    gold: ['#f59e0b', '#fbbf24', '#fde68a', '#d97706', '#fef3c7'],
    watermelon: ['#f43f5e', '#fb7185', '#fda4af', '#e11d48', '#10b981'],
    team: ['#f43f5e', '#10b981', '#f59e0b', '#818cf8', '#38bdf8', '#fbbf24'],
  };

  const colors = paletteMap[theme] || paletteMap.safe;

  // Create canvas overlay
  const canvas = document.createElement('canvas');
  canvas.style.position = 'fixed';
  canvas.style.top = '0';
  canvas.style.left = '0';
  canvas.style.width = '100vw';
  canvas.style.height = '100vh';
  canvas.style.pointerEvents = 'none';
  canvas.style.zIndex = '9999';

  document.body.appendChild(canvas);

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    document.body.removeChild(canvas);
    return;
  }

  const resize = () => {
    canvas.width = window.innerWidth * window.devicePixelRatio;
    canvas.height = window.innerHeight * window.devicePixelRatio;
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
  };
  resize();

  const particles: Particle[] = [];
  const originX = window.innerWidth / 2;
  const originY = window.innerHeight * 0.45;

  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 4 + Math.random() * 8;
    particles.push({
      x: originX + (Math.random() - 0.5) * 120,
      y: originY + (Math.random() - 0.5) * 60,
      w: 6 + Math.random() * 6,
      h: 8 + Math.random() * 8,
      color: colors[Math.floor(Math.random() * colors.length)],
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 2,
      angle: Math.random() * 360,
      angularVelocity: (Math.random() - 0.5) * 12,
      opacity: 1,
    });
  }

  let startTime: number | null = null;
  const duration = 2200; // 2.2 seconds

  const render = (now: number) => {
    if (!startTime) startTime = now;
    const elapsed = now - startTime;

    ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);

    particles.forEach((p) => {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.22; // gravity
      p.vx *= 0.98; // air resistance
      p.angle += p.angularVelocity;
      p.opacity = Math.max(0, 1 - elapsed / duration);

      ctx.save();
      ctx.globalAlpha = p.opacity;
      ctx.translate(p.x, p.y);
      ctx.rotate((p.angle * Math.PI) / 180);
      ctx.fillStyle = p.color;
      ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
      ctx.restore();
    });

    if (elapsed < duration) {
      requestAnimationFrame(render);
    } else {
      if (document.body.contains(canvas)) {
        document.body.removeChild(canvas);
      }
    }
  };

  requestAnimationFrame(render);
}
