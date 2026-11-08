"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

/* ── the corridor ────────────────────────────────────────────────
 * Two rails of cards ride from far behind the screen toward the
 * viewer. Perspective alone does the work that looks like two
 * animations: as a card's z grows it gets bigger *and* its screen x
 * sweeps outward from the vanishing point, because the projection
 * scales position and size by the same factor.
 * ─────────────────────────────────────────────────────────────── */

export type CorridorPath = {
  /** Strength of the projection. Lower is a wider-angle, more dramatic rush. @default 30 */
  perspective?: number;
  /** Card width in world units. @default 18 */
  cardWidth?: number;
  /** Card height in world units. @default 25 */
  cardHeight?: number;
  /** Corner radius applied to each card. @default 0.6 */
  cardRadius?: number;
  /** On-screen card height at the waist, where a card is born. @default 2.6 */
  birthHeight?: number;
  /** On-screen card height as a card leaves the frame. @default 46 */
  exitHeight?: number;
  /**
   * Lateral offset at birth. Negative starts the card across the axis so the
   * centre never opens up. @default -11
   */
  railBirth?: number;
  /** Lateral offset once the rails have finished opening. @default 44 */
  railExit?: number;
  /** How front-loaded the opening is. >1 opens early then holds. @default 3.3 */
  fan?: number;
  /** Y-rotation at birth, degrees. @default 6 */
  turnBirth?: number;
  /** Y-rotation at exit, degrees. @default 28 */
  turnExit?: number;
  /** Keyframe stops used to trace the curve. @default 28 */
  stops?: number;
};

const PATH: Required<CorridorPath> = {
  perspective: 32,
  cardWidth: 19,
  cardHeight: 26,
  cardRadius: 0.6,
  birthHeight: 2.8,
  exitHeight: 46,
  railBirth: -11,
  railExit: 44,
  fan: 3.3,
  turnBirth: 6,
  turnExit: 28,
  stops: 28,
};

/** Sample the path once so the CSS keyframes trace the real curve smoothly. */
function keyframes(dir: 1 | -1, name: string, p: Required<CorridorPath>) {
  const steps: string[] = [];
  for (let s = 0; s <= p.stops; s++) {
    const u = s / p.stops;
    const scale =
      (p.birthHeight / p.cardHeight) *
      Math.pow(p.exitHeight / p.birthHeight, u);
    const z = p.perspective * (1 - 1 / scale);
    const rail =
      p.railExit - (p.railExit - p.railBirth) * Math.pow(1 - u, p.fan);
    const turn = p.turnBirth + (p.turnExit - p.turnBirth) * u;
    steps.push(
      `${(u * 100).toFixed(2)}%{transform:translate3d(${(dir * rail).toFixed(
        2,
      )}cqw,0,${z.toFixed(2)}cqw) rotateY(${(-dir * turn).toFixed(2)}deg)}`,
    );
  }
  return `@keyframes ${name}{${steps.join("")}}`;
}

export type StreamImage = {
  src: string;
  alt?: string;
  title?: string;
};

export type ImageStreamHeroProps = {
  images: StreamImage[];
  cards?: number;
  /**
   * Seconds for one card to travel the whole corridor.
   * Defaulted to 44s for a smooth, majestic, serene glide instead of a fast rush.
   * @default 44
   */
  speed?: number;
  /**
   * Vertical placement of the corridor's axis, as a percentage of height.
   * @default 52
   */
  axis?: number;
  path?: CorridorPath;
  children?: React.ReactNode;
  className?: string;
  pauseOnHover?: boolean;
};

export function ImageStreamHero({
  images,
  cards = 10,
  speed = 44,
  axis = 52,
  path,
  children,
  className,
  pauseOnHover = true,
  ...props
}: React.ComponentProps<"div"> & ImageStreamHeroProps) {
  const id = React.useId().replace(/[^a-zA-Z0-9]/g, "");
  const right = `ish-r-${id}`;
  const left = `ish-l-${id}`;
  const card = `ish-c-${id}`;

  const p = React.useMemo(() => ({ ...PATH, ...path }), [path]);

  const css = React.useMemo(
    () =>
      `${keyframes(1, right, p)}${keyframes(-1, left, p)}` +
      (pauseOnHover
        ? `.${card}:hover, .image-stream-container:hover .${card} { animation-play-state: paused; }`
        : "") +
      `@media(prefers-reduced-motion:reduce){.${card}{animation-play-state:paused}}`,
    [right, left, card, p, pauseOnHover],
  );

  return (
    <div
      className={cn("image-stream-container relative overflow-hidden group", className)}
      {...props}
      style={{ containerType: "inline-size", ...props.style }}
    >
      <style dangerouslySetInnerHTML={{ __html: css }} />

      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-0"
        style={{
          perspective: `${p.perspective}cqw`,
          perspectiveOrigin: `50% ${axis}%`,
        }}
      >
        <div
          className="absolute inset-0"
          style={{ transformStyle: "preserve-3d" }}
        >
          {[right, left].map((name) =>
            Array.from({ length: cards }, (_, i) => {
              const img = images[i % Math.max(images.length, 1)];
              return (
                <div
                  key={`${name}-${i}`}
                  className={cn(
                    card,
                    "absolute overflow-hidden rounded-xl border border-white/20 shadow-[0_16px_40px_rgba(0,0,0,0.8)] transition-all duration-300"
                  )}
                  style={{
                    left: "50%",
                    top: `${axis}%`,
                    width: `${p.cardWidth}cqw`,
                    height: `${p.cardHeight}cqw`,
                    marginLeft: `${-p.cardWidth / 2}cqw`,
                    marginTop: `${-p.cardHeight / 2}cqw`,
                    borderRadius: `${p.cardRadius}cqw`,
                    animation: `${name} ${speed}s linear infinite`,
                    animationDelay: `${-(i * speed) / cards}s`,
                    backfaceVisibility: "hidden",
                    willChange: "transform",
                  }}
                >
                  {img ? (
                    <div className="relative w-full h-full">
                      <img
                        src={img.src}
                        alt={img.alt ?? ""}
                        decoding="async"
                        className="h-full w-full object-cover select-none pointer-events-none"
                        draggable={false}
                      />
                      {/* Premium subtle glass highlight and bottom vignette */}
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-white/15 pointer-events-none" />
                      {img.title && (
                        <div className="absolute bottom-2 left-2 right-2 px-1.5 py-0.5 rounded bg-black/60 backdrop-blur-sm border border-white/10 text-[9px] font-mono text-white/90 truncate pointer-events-none">
                          {img.title}
                        </div>
                      )}
                    </div>
                  ) : null}
                </div>
              );
            }),
          )}
        </div>
      </div>

      {children}
    </div>
  );
}

export default ImageStreamHero;
