"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { ArrowRight, Github, Radio, Mic, Play, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

/* -----------------------------------------------------------------------------
 * VECTOR BRAND LOGO COMPONENTS
 * Inline vectors designed to match theme styling flawlessly
 * -------------------------------------------------------------------------- */

export const BRAND_LOGOS = [
  // Tailwind CSS
  () => (
    <svg
      className="h-[22px] sm:h-[28px] w-auto select-none opacity-60 hover:opacity-100 transition-opacity duration-300"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 262 33"
    >
      <path
        className="fill-cyan-500"
        fillRule="evenodd"
        clipRule="evenodd"
        d="M27 0C19.8 0 15.3 3.6 13.5 10.8C16.2 7.2 19.35 5.85 22.95 6.75C25.004 7.263 26.472 8.754 28.097 10.403C30.744 13.09 33.808 16.2 40.5 16.2C47.7 16.2 52.2 12.6 54 5.4C51.3 9 48.15 10.35 44.55 9.45C42.496 8.937 41.028 7.446 39.403 5.797C36.756 3.11 33.692 0 27 0ZM13.5 16.2C6.3 16.2 1.8 19.8 0 27C2.7 23.4 5.85 22.05 9.45 22.95C11.504 23.464 12.972 24.954 14.597 26.603C17.244 29.29 20.308 32.4 27 32.4C34.2 32.4 38.7 28.8 40.5 21.6C37.8 25.2 34.65 26.55 31.05 25.65C28.996 25.137 27.528 23.646 25.903 21.997C23.256 19.31 20.192 16.2 13.5 16.2Z"
      />
      <path
        className="fill-foreground/75 dark:fill-foreground/80"
        fillRule="evenodd"
        clipRule="evenodd"
        d="M80.996 13.652H76.284V22.772C76.284 25.204 77.88 25.166 80.996 25.014V28.7C74.688 29.46 72.18 27.712 72.18 22.772V13.652H68.684V9.69996H72.18V4.59596L76.284 3.37996V9.69996H80.996V13.652ZM98.958 9.69996H103.062V28.7H98.958V25.964C97.514 27.978 95.272 29.194 92.308 29.194C87.14 29.194 82.846 24.824 82.846 19.2C82.846 13.538 87.14 9.20596 92.308 9.20596C95.272 9.20596 97.514 10.422 98.958 12.398V9.69996ZM92.954 25.28C96.374 25.28 98.958 22.734 98.958 19.2C98.958 15.666 96.374 13.12 92.954 13.12C89.534 13.12 86.95 15.666 86.95 19.2C86.95 22.734 89.534 25.28 92.954 25.28ZM109.902 6.84996C108.458 6.84996 107.28 5.63396 107.28 4.22796C107.281 3.53297 107.558 2.86682 108.049 2.37539C108.541 1.88395 109.207 1.60728 109.902 1.60596C110.597 1.60728 111.263 1.88395 111.755 2.37539C112.246 2.86682 112.523 3.53297 112.524 4.22796C112.524 5.63396 111.346 6.84996 109.902 6.84996ZM107.85 28.7V9.69996H111.954V28.7H107.85ZM116.704 28.7V0.959961H120.808V28.7H116.704ZM147.446 9.69996H151.778L145.812 28.7H141.784L137.832 15.894L133.842 28.7H129.814L123.848 9.69996H128.18L131.866 22.81L135.856 9.69996H139.77L143.722 22.81L147.446 9.69996ZM156.87 6.84996C155.426 6.84996 154.248 5.63396 154.248 4.22796C154.249 3.53297 154.526 2.86682 155.017 2.37539C155.509 1.88395 156.175 1.60728 156.87 1.60596C157.565 1.60728 158.231 1.88395 158.723 2.37539C159.214 2.86682 159.491 3.53297 159.492 4.22796C159.492 5.63396 158.314 6.84996 156.87 6.84996ZM154.818 28.7V9.69996H158.922V28.7H154.818ZM173.666 9.20596C177.922 9.20596 180.962 12.094 180.962 17.034V28.7H176.858V17.452C176.858 14.564 175.186 13.044 172.602 13.044C169.904 13.044 167.776 14.64 167.776 18.516V28.7H163.672V9.69996H167.776V12.132C169.03 10.156 171.082 9.20596 173.666 9.20596ZM200.418 2.09996H204.522V28.7H200.418V25.964C198.974 27.978 196.732 29.194 193.768 29.194C188.6 29.194 184.306 24.824 184.306 19.2C184.306 13.538 188.6 9.20596 193.768 9.20596C196.732 9.20596 198.974 10.422 200.418 12.398V2.09996ZM194.414 25.28C197.834 25.28 200.418 22.734 200.418 19.2C200.418 15.666 197.834 13.12 194.414 13.12C190.994 13.12 188.41 15.666 188.41 19.2C188.41 22.734 190.994 25.28 194.414 25.28ZM218.278 29.194C212.54 29.194 208.246 24.824 208.246 19.2C208.246 13.538 212.54 9.20596 218.278 9.20596C222.002 9.20596 225.232 11.144 226.752 14.108L223.218 16.16C222.382 14.374 220.52 13.234 218.24 13.234C214.896 13.234 212.35 15.78 212.35 19.2C212.35 22.62 214.896 25.166 218.24 25.166C220.52 25.166 222.382 23.988 223.294 22.24L226.828 24.254C225.232 27.256 222.002 29.194 218.278 29.194ZM233.592 14.944C233.592 18.402 243.814 16.312 243.814 23.342C243.814 27.142 240.508 29.194 236.404 29.194C232.604 29.194 229.868 27.484 228.652 24.748L232.186 22.696C232.794 24.406 234.314 25.432 236.404 25.432C238.228 25.432 239.634 24.824 239.634 23.304C239.634 19.922 229.412 21.822 229.412 15.02C229.412 11.448 232.49 9.20596 236.366 9.20596C239.482 9.20596 242.066 10.65 243.396 13.158L239.938 15.096C239.254 13.614 237.924 12.93 236.366 12.93C234.884 12.93 233.592 13.576 233.592 14.944ZM251.11 14.944C251.11 18.402 261.332 16.312 261.332 23.342C261.332 27.142 258.026 29.194 253.922 29.194C250.122 29.194 247.386 27.484 246.17 24.748L249.704 22.696C250.312 24.406 251.832 25.432 253.922 25.432C255.746 25.432 257.152 24.824 257.152 23.304C257.152 19.922 246.93 21.822 246.93 15.02C246.93 11.448 250.008 9.20596 253.884 9.20596C257 9.20596 259.584 10.65 260.914 13.158L257.456 15.096C256.772 13.614 255.442 12.93 253.884 12.93C252.402 12.93 251.11 13.576 251.11 14.944Z"
      />
    </svg>
  ),
  // Framer Motion
  () => (
    <div className="flex items-center justify-start font-bold text-sm md:text-base gap-2 text-foreground/75 dark:text-foreground/80 opacity-60 hover:opacity-100 transition-opacity duration-300">
      <svg
        viewBox="0 0 14 21"
        role="presentation"
        className="h-[22px] md:h-[26px] fill-current"
      >
        <path d="M0 0h14v7H7zm0 7h7l7 7H7v7l-7-7z" fill="currentColor"></path>
      </svg>
      Motion
    </div>
  ),
  // Next.js
  () => (
    <svg
      className="h-[14px] sm:h-[18px] fill-foreground/75 dark:fill-foreground/80 select-none opacity-60 hover:opacity-100 transition-opacity duration-300"
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 394 79"
    >
      <path d="M261.919 0.0330722H330.547V12.7H303.323V79.339H289.71V12.7H261.919V0.0330722Z"></path>
      <path d="M149.052 0.0330722V12.7H94.0421V33.0772H138.281V45.7441H94.0421V66.6721H149.052V79.339H80.43V12.7H80.4243V0.0330722H149.052Z"></path>
      <path d="M183.32 0.0661486H165.506L229.312 79.3721H247.178L215.271 39.7464L247.127 0.126654L229.312 0.154184L206.352 28.6697L183.32 0.0661486Z"></path>
      <path d="M201.6 56.7148L192.679 45.6229L165.455 79.4326H183.32L201.6 56.7148Z"></path>
      <path
        clipRule="evenodd"
        d="M80.907 79.339L17.0151 0H0V79.3059H13.6121V16.9516L63.8067 79.339H80.907Z"
        fillRule="evenodd"
      ></path>
    </svg>
  ),
  // AWS
  () => (
    <svg
      className="h-[24px] sm:h-[32px] select-none opacity-60 hover:opacity-100 transition-opacity duration-300"
      version="1.1"
      viewBox="-45.101 -44.95 390.872 269.7"
    >
      <g transform="translate(-1.668 -1.1)">
        <path
          d="M86.4 66.4c0 3.7.4 6.7 1.1 8.9.8 2.2 1.8 4.6 3.2 7.2.5.8.7 1.6.7 2.3 0 1-.6 2-1.9 3L83.2 92c-.9.6-1.8.9-2.6.9-1 0-2-.5-3-1.4-1.4-1.5-2.6-3.1-3.6-4.7-1-1.7-2-3.6-3.1-5.9Q59.2 94.7 41.5 94.7c-8.4 0-15.1-2.4-20-7.2s-7.4-11.2-7.4-19.2c0-8.5 3-15.4 9.1-20.6s14.2-7.8 24.5-7.8c3.4 0 6.9.3 10.6.8s7.5 1.3 11.5 2.2v-7.3c0-7.6-1.6-12.9-4.7-16-3.2-3.1-8.6-4.6-16.3-4.6-3.5 0-7.1.4-10.8 1.3s-7.3 2-10.8 3.4c-1.6.7-2.8 1.1-3.5 1.3s-1.2.3-1.6.3c-1.4 0-2.1-1-2.1-3.1v-4.9c0-1.6.2-2.8.7-3.5s1.4-1.4 2.8-2.1Q28.75 5 36.1 3.2C41 1.9 46.2 1.3 51.7 1.3c11.9 0 20.6 2.7 26.2 8.1 5.5 5.4 8.3 13.6 8.3 24.6v32.4zM45.8 81.6c3.3 0 6.7-.6 10.3-1.8s6.8-3.4 9.5-6.4c1.6-1.9 2.8-4 3.4-6.4s1-5.3 1-8.7v-4.2c-2.9-.7-6-1.3-9.2-1.7s-6.3-.6-9.4-.6c-6.7 0-11.6 1.3-14.9 4s-4.9 6.5-4.9 11.5c0 4.7 1.2 8.2 3.7 10.6 2.4 2.5 5.9 3.7 10.5 3.7"
          className="dark:fill-white fill-gray-900"
        />
      </g>
    </svg>
  ),
];

/* -----------------------------------------------------------------------------
 * CANVAS STAGGERED PHYSICS ENGINE
 * Calibrated outward expansion ripple, continuous organic twinkling & pointer physics.
 * -------------------------------------------------------------------------- */

const DEFAULT_PIXEL_COLORS = ["#FFFFFF", "#E2E8F0", "#CBD5E1", "#94A3B8"];

type PixelData = {
  baseX: number;
  baseY: number;
  currX: number;
  currY: number;
  vx: number;
  vy: number;
  size: number;
  targetSize: number;
  alpha: number;
  targetAlpha: number;
  phase: number;
  speed: number;
  color: string;
};

export type PixelCanvasProps = {
  colors?: string[];
  gap?: number;
};

export function PixelCanvas({
  colors = DEFAULT_PIXEL_COLORS,
  gap = 18,
}: PixelCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const pixelsRef = useRef<PixelData[]>([]);
  const animRef = useRef<number>(0);
  const mouseRef = useRef<{ x: number | null; y: number | null }>({ x: null, y: null });

  // Native mouse tracking without React state re-renders (prevents canvas clearing)
  useEffect(() => {
    const handlePointerMove = (e: MouseEvent) => {
      if (!wrapRef.current) return;
      const rect = wrapRef.current.getBoundingClientRect();
      if (
        e.clientX >= rect.left &&
        e.clientX <= rect.right &&
        e.clientY >= rect.top &&
        e.clientY <= rect.bottom
      ) {
        mouseRef.current.x = e.clientX - rect.left;
        mouseRef.current.y = e.clientY - rect.top;
      } else {
        mouseRef.current.x = null;
        mouseRef.current.y = null;
      }
    };

    const handlePointerLeave = () => {
      mouseRef.current.x = null;
      mouseRef.current.y = null;
    };

    window.addEventListener("mousemove", handlePointerMove, { passive: true });
    document.addEventListener("mouseleave", handlePointerLeave);

    return () => {
      window.removeEventListener("mousemove", handlePointerMove);
      document.removeEventListener("mouseleave", handlePointerLeave);
    };
  }, []);

  const init = useCallback(() => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const { width, height } = wrap.getBoundingClientRect();
    if (width === 0 || height === 0) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    ctx.scale(dpr, dpr);

    const cols = Math.ceil(width / gap);
    const rows = Math.ceil(height / gap);
    const pixels: PixelData[] = [];

    for (let i = 0; i < cols; i++) {
      for (let j = 0; j < rows; j++) {
        const x = i * gap + (gap / 2);
        const y = j * gap + (gap / 2);
        const phase = Math.random() * Math.PI * 2;
        const speed = 0.8 + Math.random() * 1.6;
        const color = colors[Math.floor(Math.random() * colors.length)];

        pixels.push({
          baseX: x,
          baseY: y,
          currX: x,
          currY: y,
          vx: 0,
          vy: 0,
          size: 1.2 + Math.random() * 1.2,
          targetSize: 1.5,
          alpha: 0.15 + Math.random() * 0.45,
          targetAlpha: 0.3,
          phase,
          speed,
          color,
        });
      }
    }

    pixelsRef.current = pixels;
  }, [gap, colors]);

  useEffect(() => {
    init();

    const resizeObserver = new ResizeObserver(() => {
      init();
    });

    if (wrapRef.current) {
      resizeObserver.observe(wrapRef.current);
    }

    let lastTime = performance.now();

    const loop = (now: number) => {
      animRef.current = requestAnimationFrame(loop);

      const dt = Math.min((now - lastTime) / 1000, 0.1);
      lastTime = now;

      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      ctx.clearRect(0, 0, canvas.width / dpr, canvas.height / dpr);

      const pixels = pixelsRef.current;
      const mouse = mouseRef.current;
      const t = now * 0.0015;

      for (let i = 0; i < pixels.length; i++) {
        const p = pixels[i];

        // 1. Organic ambient breathing & twinkling
        const sinVal = Math.sin(t * p.speed + p.phase);
        let desiredAlpha = 0.22 + (sinVal + 1) * 0.26; // range ~0.22 to ~0.74
        let desiredSize = 1.4 + (sinVal + 1) * 0.6; // range ~1.4 to ~2.6px

        // 2. Interactive mouse repulsion & highlight
        if (mouse.x !== null && mouse.y !== null) {
          const dx = p.currX - mouse.x;
          const dy = p.currY - mouse.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          const maxDist = 140;

          if (dist < maxDist) {
            const force = (1 - dist / maxDist);
            const angle = Math.atan2(dy, dx);
            const repelDistance = force * 24;

            // Push outward smoothly
            p.currX = p.baseX + Math.cos(angle) * repelDistance;
            p.currY = p.baseY + Math.sin(angle) * repelDistance;

            // Highlight & enlarge — stays luminous and never disappears
            desiredAlpha = Math.min(1.0, desiredAlpha + force * 0.7);
            desiredSize = Math.min(4.2, desiredSize + force * 2.5);
          } else {
            // Spring back smoothly
            p.currX += (p.baseX - p.currX) * 0.1;
            p.currY += (p.baseY - p.currY) * 0.1;
          }
        } else {
          p.currX += (p.baseX - p.currX) * 0.1;
          p.currY += (p.baseY - p.currY) * 0.1;
        }

        // Smooth size & alpha interpolation
        p.alpha += (desiredAlpha - p.alpha) * 0.15;
        p.size += (desiredSize - p.size) * 0.15;

        // Draw crisp pixel
        ctx.fillStyle = `rgba(255, 255, 255, ${p.alpha})`;
        const half = p.size / 2;
        ctx.fillRect(p.currX - half, p.currY - half, p.size, p.size);
      }
    };

    animRef.current = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(animRef.current);
      resizeObserver.disconnect();
    };
  }, [init]);

  return (
    <div ref={wrapRef} className="absolute inset-0 overflow-hidden pointer-events-none">
      <canvas ref={canvasRef} className="block w-full h-full pointer-events-none" />
    </div>
  );
}

/* -----------------------------------------------------------------------------
 * HERO COMPONENT
 * -------------------------------------------------------------------------- */

export interface PixelHeroProps {
  word1?: string;
  word2?: string;
  description?: string;
  voiceLine?: string;
  badgeText?: string;
  primaryCta?: string;
  primaryCtaMobile?: string;
  secondaryCta?: string;
  secondaryCtaMobile?: string;
  onPrimaryClick?: () => void;
  onSecondaryClick?: () => void;
  primaryHref?: string;
  secondaryHref?: string;
  githubUrl?: string;
  brandLogosTitle?: string;
  customLogos?: React.ReactNode[];
  children?: React.ReactNode;
  className?: string;
}

export function PixelHero({
  word1 = "Class",
  word2 = "Trace.",
  description = "Minimalist interfaces driven by refined motion. Every calculated detail delivers an elevated digital experience.",
  voiceLine = "Ask in your college language. Hear the teacher's exact words.",
  badgeText,
  primaryCta = "Explore Design",
  primaryCtaMobile = "Explore",
  secondaryCta = "View GitHub",
  secondaryCtaMobile = "GitHub",
  onPrimaryClick,
  onSecondaryClick,
  primaryHref,
  secondaryHref,
  githubUrl,
  brandLogosTitle = "Trusted by engineering colleges & universities",
  customLogos,
  children,
  className,
}: PixelHeroProps) {
  const logosToRender = customLogos || BRAND_LOGOS.map((Logo, i) => <Logo key={i} />);

  return (
    <div
      className={cn(
        "relative w-full min-h-[90vh] bg-transparent flex flex-col justify-between md:justify-center md:gap-8 py-12 md:py-16 px-3 sm:px-6 overflow-hidden select-none isolate text-[#F8FAFC]",
        className
      )}
    >
      {/* Soft radial vignette so text is ultra-readable while global particles sparkle around */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_25%,rgba(3,4,7,0.7)_90%)] pointer-events-none -z-10" />

      {/* Top Container: Tahoe Glass Header & Voice Recording Line */}
      <div className="flex flex-col items-center justify-center text-center order-1 md:order-1 mt-6 sm:mt-0 pointer-events-none w-full relative z-10">
        {badgeText && (
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/[0.06] border border-white/[0.14] backdrop-blur-md mb-5 text-xs font-mono text-white/90 shadow-[inset_0_1px_0_rgba(255,255,255,0.25)]">
            <span className="size-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>{badgeText}</span>
          </div>
        )}

        {/* Shimmering Tahoe Glass Headline */}
        <h1 className="tahoe-glass-text flex flex-row items-center justify-center gap-3 sm:gap-5 lg:gap-6 px-1 w-full flex-wrap text-[3rem] xs:text-[3.6rem] sm:text-6xl md:text-8xl lg:text-9xl leading-[1.05] tracking-tight">
          <span className="font-display font-light italic">{word1}</span>
          <span className="font-display font-extrabold tracking-tight">{word2}</span>
        </h1>

        {voiceLine && (
          <div className="mt-5 flex items-center justify-center gap-2 text-sm sm:text-base md:text-xl font-medium text-white/90 font-sans tracking-wide">
            <span className="size-2 rounded-full bg-rose-500 animate-pulse" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-200 to-slate-400 font-display">
              {voiceLine}
            </span>
          </div>
        )}
      </div>

      {/* Center Container: Description & Interactive Slot */}
      <div className="flex flex-col items-center justify-center text-center my-auto md:my-0 order-2 md:order-2 px-2 w-full pointer-events-none relative z-10">
        <p className="text-sm sm:text-base md:text-lg font-normal text-white/75 max-w-[95%] sm:max-w-md md:max-w-2xl px-1 leading-relaxed font-sans">
          {description}
        </p>

        {/* Children slot (trust badges, etc.) */}
        {children && <div className="pointer-events-auto w-full mt-6">{children}</div>}

        {/* Mobile Marquee */}
        <div className="block md:hidden w-full mt-10 pointer-events-auto">
          <div className="text-[10px] uppercase font-mono tracking-widest text-white/50 font-medium mb-4">
            {brandLogosTitle}
          </div>
          <div className="relative w-full overflow-hidden [mask-image:linear-gradient(to_right,transparent,white_15%,white_85%,transparent)]">
            <div className="flex w-max gap-8 py-1 animate-marquee">
              <div className="flex gap-8 items-center">{logosToRender}</div>
              <div className="flex gap-8 items-center" aria-hidden="true">{logosToRender}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Container: CTA Row */}
      <div
        className="pointer-events-auto flex flex-wrap items-center justify-center gap-3.5 mt-4 md:mt-8 mb-4 md:mb-0 order-4 md:order-3 px-2 relative z-20"
      >
        {primaryHref ? (
          <a
            href={primaryHref}
            onClick={onPrimaryClick}
            className="relative inline-flex h-11 md:h-12 items-center justify-center gap-2 rounded-xl bg-white hover:bg-slate-200 px-5 md:px-8 text-xs md:text-sm font-semibold text-black shadow-[inset_0_1px_1px_rgba(255,255,255,0.4),0_8px_24px_rgba(0,0,0,0.5)] transition-all duration-200 hover:scale-[1.03] active:scale-[0.98] cursor-pointer font-display"
          >
            <span className="inline md:hidden">{primaryCtaMobile}</span>
            <span className="hidden md:inline">{primaryCta}</span>
            <ArrowRight className="w-3.5 h-3.5 md:w-4 md:h-4 text-black" />
          </a>
        ) : (
          <button
            onClick={onPrimaryClick}
            className="relative inline-flex h-11 md:h-12 items-center justify-center gap-2 rounded-xl bg-white hover:bg-slate-200 px-5 md:px-8 text-xs md:text-sm font-semibold text-black shadow-[inset_0_1px_1px_rgba(255,255,255,0.4),0_8px_24px_rgba(0,0,0,0.5)] transition-all duration-200 hover:scale-[1.03] active:scale-[0.98] cursor-pointer font-display"
          >
            <span className="inline md:hidden">{primaryCtaMobile}</span>
            <span className="hidden md:inline">{primaryCta}</span>
            <ArrowRight className="w-3.5 h-3.5 md:w-4 md:h-4 text-black" />
          </button>
        )}

        {secondaryHref ? (
          <a
            href={secondaryHref}
            onClick={onSecondaryClick}
            className="relative inline-flex h-11 md:h-12 items-center justify-center gap-2 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] border border-white/[0.14] px-5 md:px-7 text-xs md:text-sm font-medium text-white shadow-[inset_0_1px_1px_rgba(255,255,255,0.15)] backdrop-blur-xl transition-all duration-200 hover:scale-[1.03] active:scale-[0.98] cursor-pointer"
          >
            <Radio className="w-3.5 h-3.5 md:w-4 md:h-4 text-rose-400 animate-pulse" />
            <span className="inline md:hidden">{secondaryCtaMobile}</span>
            <span className="hidden md:inline">{secondaryCta}</span>
          </a>
        ) : (
          <button
            onClick={onSecondaryClick}
            className="relative inline-flex h-11 md:h-12 items-center justify-center gap-2 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] border border-white/[0.14] px-5 md:px-7 text-xs md:text-sm font-medium text-white shadow-[inset_0_1px_1px_rgba(255,255,255,0.15)] backdrop-blur-xl transition-all duration-200 hover:scale-[1.03] active:scale-[0.98] cursor-pointer"
          >
            <Radio className="w-3.5 h-3.5 md:w-4 md:h-4 text-rose-400 animate-pulse" />
            <span className="inline md:hidden">{secondaryCtaMobile}</span>
            <span className="hidden md:inline">{secondaryCta}</span>
          </button>
        )}
      </div>

      {/* Desktop-only Marquee Block */}
      <div
        className="hidden md:flex absolute bottom-8 left-0 right-0 w-full z-10 pointer-events-auto flex-col items-center justify-center gap-3 order-3 md:order-4"
      >
        <span className="text-[11px] uppercase font-mono tracking-widest text-white/40 font-medium select-none">
          {brandLogosTitle}
        </span>
        <div className="relative w-full max-w-5xl overflow-hidden [mask-image:linear-gradient(to_right,transparent,white_15%,white_85%,transparent)]">
          <div className="flex w-max gap-14 py-2 animate-marquee">
            <div className="flex gap-14 items-center">{logosToRender}</div>
            <div className="flex gap-14 items-center" aria-hidden="true">{logosToRender}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PixelHero;
