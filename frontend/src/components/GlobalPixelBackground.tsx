'use client';

import React, { useEffect, useRef } from 'react';

type PixelData = {
  baseX: number;
  baseY: number;
  currX: number;
  currY: number;
  size: number;
  alpha: number;
  phase: number;
  speed: number;
  isAccent: boolean;
};

export function GlobalPixelBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pixelsRef = useRef<PixelData[]>([]);
  const animRef = useRef<number>(0);
  const mouseRef = useRef<{ x: number | null; y: number | null }>({ x: null, y: null });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = window.innerWidth;
    let height = window.innerHeight;
    const gap = 20;

    const setupCanvas = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const cols = Math.ceil(width / gap);
      const rows = Math.ceil(height / gap);
      const pixels: PixelData[] = [];

      for (let i = 0; i < cols; i++) {
        for (let j = 0; j < rows; j++) {
          const x = i * gap + gap / 2;
          const y = j * gap + gap / 2;
          const phase = Math.random() * Math.PI * 2;
          const speed = 0.7 + Math.random() * 1.5;
          const isAccent = Math.random() < 0.18; // 18% crisp crystal cyan stars

          pixels.push({
            baseX: x,
            baseY: y,
            currX: x,
            currY: y,
            size: 1.5 + Math.random() * 1.2,
            alpha: 0.35 + Math.random() * 0.45,
            phase,
            speed,
            isAccent,
          });
        }
      }

      pixelsRef.current = pixels;
    };

    setupCanvas();

    const handleResize = () => {
      setupCanvas();
    };

    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current.x = e.clientX;
      mouseRef.current.y = e.clientY;
    };

    const handleMouseLeave = () => {
      mouseRef.current.x = null;
      mouseRef.current.y = null;
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    document.addEventListener('mouseleave', handleMouseLeave);

    const loop = (now: number) => {
      animRef.current = requestAnimationFrame(loop);

      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      ctx.clearRect(0, 0, width, height);

      const pixels = pixelsRef.current;
      const mouse = mouseRef.current;
      const t = now * 0.0016;

      for (let i = 0; i < pixels.length; i++) {
        const p = pixels[i];

        // Organic ambient twinkling & breathing with rich, clear visibility edge-to-edge
        const sinVal = Math.sin(t * p.speed + p.phase);
        let desiredAlpha = 0.38 + (sinVal + 1) * 0.28; // rich range ~0.38 to ~0.94
        let desiredSize = 1.6 + (sinVal + 1) * 0.65; // solid crisp range ~1.6px to ~2.9px

        // Interactive mouse hover physics & luminous flaring
        if (mouse.x !== null && mouse.y !== null) {
          const dx = p.currX - mouse.x;
          const dy = p.currY - mouse.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          const maxDist = 150;

          if (dist < maxDist) {
            const force = 1 - dist / maxDist;
            const angle = Math.atan2(dy, dx);
            const repelDistance = force * 26;

            p.currX = p.baseX + Math.cos(angle) * repelDistance;
            p.currY = p.baseY + Math.sin(angle) * repelDistance;

            desiredAlpha = Math.min(1.0, desiredAlpha + force * 0.85);
            desiredSize = Math.min(4.5, desiredSize + force * 2.2);
          } else {
            p.currX += (p.baseX - p.currX) * 0.1;
            p.currY += (p.baseY - p.currY) * 0.1;
          }
        } else {
          p.currX += (p.baseX - p.currX) * 0.1;
          p.currY += (p.baseY - p.currY) * 0.1;
        }

        p.alpha += (desiredAlpha - p.alpha) * 0.15;
        p.size += (desiredSize - p.size) * 0.15;

        // Render pixel
        if (p.isAccent) {
          ctx.fillStyle = `rgba(56, 189, 248, ${Math.min(1.0, p.alpha * 1.15)})`; // Vivid crystal cyan
        } else {
          ctx.fillStyle = `rgba(255, 255, 255, ${p.alpha})`; // Brilliant white
        }

        const half = p.size / 2;
        ctx.fillRect(p.currX - half, p.currY - half, p.size, p.size);
      }
    };

    animRef.current = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(animRef.current);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden select-none bg-[#030407]">
      {/* Interactive Crystal Pixel Canvas */}
      <canvas ref={canvasRef} className="block w-full h-full pointer-events-none" />

      {/* Atmospheric Top Glow (Corners remain completely unshaded and clearly visible) */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse 85% 45% at 50% -5%, rgba(56, 189, 248, 0.10) 0%, transparent 75%)',
        }}
      />
    </div>
  );
}

export default GlobalPixelBackground;

