"use client"

// Halftone Wordmark Footer — a site footer whose wordmark is set enormous and
// cropped by the bottom edge, printed as a field of halftone dots. Each dot is
// sized by how much of the letter covers its cell, so the type keeps its edges
// at any scale. Move across it and the dots part around the pointer on springs,
// warming in colour as they are pushed off their place; click and a shock ring
// runs through the word. Above it sit the studio line, tracked link columns and
// a back-to-top, separated by a hairline, all over a fine print grain.
//
// One file, React only. A 2D canvas for the dots and the grain, real anchors
// for the links. Every rule in the scoped <style> is .hwf- prefixed and nothing
// is fetched: the faces come from the host page or the fallback stacks.

import * as React from "react"

export interface HalftonePalette {
  /** The footer background. */
  background: string
  /** The dots at rest, and the text. */
  ink: string
  /** The colour a dot warms toward as it is pushed off its place. */
  warm: string
}

export type HalftonePreset = "night" | "paper" | "ember" | "cobalt"

export interface FooterLink {
  label: string
  href?: string
}

export interface FooterColumn {
  title: string
  links: FooterLink[]
}

export interface HalftoneWordmarkFooterProps {
  /** The giant word printed in dots. Lowercase reads best. */
  wordmark?: string
  /** Top-left studio line. */
  label?: string
  /** The muted line under it. */
  meta?: string
  /** Link columns along the top. */
  columns?: FooterColumn[]
  /** Show the back-to-top link. It scrolls the window to 0. Defaults to true. */
  backToTop?: boolean
  /** Starting colours. Defaults to "night". */
  preset?: HalftonePreset
  /** Colour overrides, merged over the preset. */
  palette?: { background?: string; ink?: string; warm?: string }
  /** Distance between dot centres, in CSS px. Defaults to 6. */
  dotGap?: number
  /** How far the pointer pushes, in CSS px. Defaults to 80. */
  radius?: number
  /** How much of the word's cap height hangs below the bottom edge, 0–0.6. Defaults to 0.2. */
  crop?: number
  /** Print grain over everything, 0–1. Defaults to 0.5. */
  grain?: number
  /** Pointer and click response. Defaults to true. */
  interactive?: boolean
  /** Face for the wordmark. Heavy grotesks print best. */
  fontFamily?: string
  /** Weight of the wordmark. Defaults to 800. */
  fontWeight?: number
  /** Face for the small type. */
  monoFamily?: string
  /** Root height. A definite length, never a percentage. */
  height?: string
  /** Extra root class names. */
  className?: string
}

const PRESETS: { [K in HalftonePreset]: HalftonePalette } = {
  night: { background: "#0c0c0b", ink: "#e9e4da", warm: "#e9762b" },
  paper: { background: "#efebe3", ink: "#17150f", warm: "#c2361c" },
  ember: { background: "#160a06", ink: "#f2c48c", warm: "#ff5a1f" },
  cobalt: { background: "#0d1b4d", ink: "#dfe7ff", warm: "#ffcd3c" },
}

const DEFAULT_COLUMNS: FooterColumn[] = [
  { title: "Work", links: [{ label: "Index" }, { label: "Archive" }, { label: "Journal" }] },
  { title: "Studio", links: [{ label: "About" }, { label: "Process" }, { label: "Careers" }] },
  { title: "Contact", links: [{ label: "hello@halden.co" }, { label: "+47 22 00 41 00" }] },
]

const SANS_STACK = '"Inter Tight", "Inter Variable", "Inter", "Helvetica Neue", Arial, system-ui, sans-serif'
const MONO_STACK = '"JetBrains Mono", "SF Mono", ui-monospace, Menlo, Consolas, monospace'

// #region halftone
// Pure helpers, lifted out and executed by tests/halftone-wordmark-footer.test.mjs.

/** Hex → [r, g, b] in 0–255, or null for anything that isn't #rgb / #rrggbb. */
export function hwfHex(hex: string) {
  const m = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.exec((hex || "").trim())
  if (!m) return null
  const h = m[1].length === 3 ? m[1].split("").map((c) => c + c).join("") : m[1]
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)]
}

/** Dot radius for a cell coverage in [0, 1]: area-true, so tone stays even. */
export function hwfRadius(coverage: number, gap: number) {
  const c = coverage < 0 ? 0 : coverage > 1 ? 1 : coverage
  return Math.sqrt(c) * gap * 0.56
}

/**
 * One step of a dot's spring back to home, plus the push from a pointer at
 * (px, py) within radius r. Returns [x, y, vx, vy]. Away from the pointer a
 * displaced dot always heads home and comes to rest.
 */
export function hwfStep(
  x: number, y: number, vx: number, vy: number,
  hx: number, hy: number, px: number, py: number, r: number,
  mouseVx = 0, mouseVy = 0,
) {
  const dx = x - px
  const dy = y - py
  const d2 = dx * dx + dy * dy
  if (r > 0 && d2 < r * r && px > -1e4) {
    const d = Math.sqrt(d2) + 0.001
    const norm = 1 - d / r
    // Quadratic smooth fluid repulsion: dramatic, fluid parting
    const repulse = norm * norm * 20.0
    vx += (dx / d) * repulse
    vy += (dy / d) * repulse
    vx += mouseVx * norm * 0.45
    vy += mouseVy * norm * 0.45
  }
  // Elastic spring back to home (stiffness 0.08, damping 0.83)
  vx = (vx + (hx - x) * 0.08) * 0.83
  vy = (vy + (hy - y) * 0.08) * 0.83
  return [x + vx, y + vy, vx, vy]
}

/** How warm a dot is drawn: 0 at home, 1 once it is `span` px or more away. */
export function hwfWarmth(x: number, y: number, hx: number, hy: number, span: number) {
  const d = Math.hypot(x - hx, y - hy)
  return span > 0 ? Math.min(1, d / span) : 0
}

/** Font size that sets `measured` (width at 100px) to fill `width` exactly. */
export function hwfFitSize(measured: number, width: number) {
  return measured > 0 ? (width / measured) * 100 : 0
}
// #endregion

const HWF_CSS = `
.hwf-root {
  position: relative; width: 100%; overflow: hidden; isolation: isolate;
  background: var(--hwf-bg); color: var(--hwf-ink); -webkit-font-smoothing: antialiased;
  cursor: crosshair;
}
.hwf-root canvas { position: absolute; inset: 0; width: 100%; height: 100%; display: block; max-width: none; pointer-events: none; }
.hwf-top {
  position: relative; z-index: 1; display: grid; grid-template-columns: minmax(0, 1.25fr) repeat(3, minmax(0, 1fr));
  gap: 24px; padding: clamp(22px, 3.4vw, 40px) clamp(20px, 3.4vw, 44px) 0;
  font-family: var(--hwf-mono); font-size: 10.5px; letter-spacing: .18em; text-transform: uppercase; line-height: 1.75;
  pointer-events: none;
}
.hwf-top a { pointer-events: auto; }
.hwf-brand strong { display: block; font-weight: 500; }
.hwf-brand span { opacity: .45; }
.hwf-col h3 { margin: 0; font: inherit; opacity: .4; font-weight: 500; }
.hwf-col ul { list-style: none; margin: 0; padding: 0; }
.hwf-col a, .hwf-up {
  color: inherit; text-decoration: none; opacity: .78; background: none; border: 0; padding: 0;
  font: inherit; letter-spacing: inherit; text-transform: inherit; cursor: pointer;
  background-image: linear-gradient(currentColor, currentColor); background-size: 0% 1px;
  background-repeat: no-repeat; background-position: 0 100%; transition: opacity .25s ease, background-size .35s cubic-bezier(.2,.7,.1,1);
}
.hwf-col a:hover, .hwf-up:hover { opacity: 1; background-size: 100% 1px; }
.hwf-col a:focus-visible, .hwf-up:focus-visible { outline: 1px solid currentColor; outline-offset: 3px; opacity: 1; }
.hwf-rule {
  position: relative; z-index: 1; display: flex; justify-content: flex-end; align-items: center; gap: 16px;
  margin: clamp(18px, 2.6vw, 30px) clamp(20px, 3.4vw, 44px) 0; padding-top: 12px;
  border-top: 0.5px solid color-mix(in srgb, var(--hwf-ink) 16%, transparent);
  font-family: var(--hwf-mono); font-size: 10.5px; letter-spacing: .18em; text-transform: uppercase;
  pointer-events: none;
}
.hwf-rule button { pointer-events: auto; }
.hwf-sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap; }
@media (max-width: 720px) {
  .hwf-top { grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); row-gap: 18px; }
  .hwf-brand { grid-column: 1 / -1; }
}
@media (prefers-reduced-motion: reduce) {
  .hwf-col a, .hwf-up { transition: none; }
}
`

export default function HalftoneWordmarkFooter({
  wordmark = "classtrace",
  label = "ClassTrace",
  meta = "Pan-Indic Lecture Intelligence",
  columns = DEFAULT_COLUMNS,
  backToTop = true,
  preset = "night",
  palette,
  dotGap = 6,
  radius = 120,
  crop = 0,
  grain = 0.4,
  interactive = true,
  fontFamily = SANS_STACK,
  fontWeight = 800,
  monoFamily = MONO_STACK,
  height = "480px",
  className = "",
}: HalftoneWordmarkFooterProps) {
  const colors = { ...(PRESETS[preset] || PRESETS.night), ...(palette || {}) }
  const rootRef = React.useRef(null as HTMLElement | null)
  const canvasRef = React.useRef(null as HTMLCanvasElement | null)
  const opts = React.useRef({ colors, dotGap, radius, crop, grain, interactive, fontFamily, fontWeight, wordmark })
  opts.current = { colors, dotGap, radius, crop, grain, interactive, fontFamily, fontWeight, wordmark }
  const key = [wordmark, dotGap, crop, grain, fontFamily, fontWeight, colors.background, colors.ink, colors.warm].join("|")

  React.useEffect(() => {
    const root = rootRef.current
    const canvas = canvasRef.current
    if (!root || !canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    let w = 0
    let h = 0
    let dpr = 1
    let px = -1e5
    let py = -1e5
    let prevMouseX = -1e5
    let prevMouseY = -1e5
    let mouseVx = 0
    let mouseVy = 0
    let raf = 0
    let visible = true
    let ring = { x: 0, y: 0, t: -1 }
    // Flat arrays: x, y, vx, vy, hx, hy, r per dot.
    let dots = new Float32Array(0)
    let count = 0
    let grainTile = null as HTMLCanvasElement | null
    const ink = hwfHex(opts.current.colors.ink) || [241, 245, 249]
    const warm = hwfHex(opts.current.colors.warm) || [56, 189, 248]

    const layout = () => {
      const o = opts.current
      const rect = root.getBoundingClientRect()
      w = Math.max(1, Math.round(rect.width))
      h = Math.max(1, Math.round(rect.height))
      dpr = Math.min(window.devicePixelRatio || 1, 2)
      canvas.width = Math.round(w * dpr)
      canvas.height = Math.round(h * dpr)

      // Set the word once, at a size that fills the width comfortably on a 1x mask.
      const mask = document.createElement("canvas")
      mask.width = w
      mask.height = h
      const m = mask.getContext("2d", { willReadFrequently: true })
      if (!m) return
      const face = o.fontWeight + " 100px " + o.fontFamily
      m.font = face
      const word = o.wordmark || "classtrace"
      const measured = m.measureText(word).width || 1
      
      // Calculate font size that fits nicely with horizontal padding
      const targetWidth = Math.min(w * 0.90, 1400)
      let fit = hwfFitSize(measured, targetWidth)

      // Ensure the giant wordmark fits nicely between navigation and bottom edge
      const topArea = 110
      const availableH = Math.max(120, h - topArea - 50)
      if (fit > availableH * 1.05) {
        fit = availableH * 1.05
      }

      m.font = o.fontWeight + " " + Math.round(fit) + "px " + o.fontFamily
      const box = m.measureText(word)
      const cap = box.actualBoundingBoxAscent || fit * 0.72
      const desc = box.actualBoundingBoxDescent || fit * 0.22

      // Center the wordmark gracefully in the open lower area with generous breathing room
      const lowerCenterY = topArea + (h - topArea) * 0.52
      const baseline = Math.min(
        lowerCenterY + cap * 0.38,
        h - Math.max(48, Math.round(h * 0.10)) - desc
      )

      m.fillStyle = "#000"
      m.textBaseline = "alphabetic"
      m.fillText(word, (w - box.width) / 2, baseline)
      const img = m.getImageData(0, 0, w, h).data

      const gap = Math.max(3, o.dotGap)
      const cols = Math.ceil(w / gap)
      const rows = Math.ceil(h / gap)
      const tmp = []
      for (let gy = 0; gy < rows; gy++) {
        for (let gx = 0; gx < cols; gx++) {
          // Coverage: average alpha over a 3×3 sample of the cell.
          let sum = 0
          for (let sy = 0; sy < 3; sy++) {
            for (let sx = 0; sx < 3; sx++) {
              const x = Math.min(w - 1, Math.floor(gx * gap + ((sx + 0.5) * gap) / 3))
              const y = Math.min(h - 1, Math.floor(gy * gap + ((sy + 0.5) * gap) / 3))
              sum += img[(y * w + x) * 4 + 3]
            }
          }
          const cov = sum / (9 * 255)
          if (cov < 0.06) continue
          const hx = gx * gap + gap / 2
          const hy = gy * gap + gap / 2
          tmp.push(hx, hy, 0, 0, hx, hy, hwfRadius(cov, gap))
        }
      }
      dots = new Float32Array(tmp)
      count = tmp.length / 7

      // A fixed tile of print grain, drawn once and laid over every frame.
      grainTile = document.createElement("canvas")
      grainTile.width = 256
      grainTile.height = 256
      const g = grainTile.getContext("2d")
      if (g) {
        const id = g.createImageData(256, 256)
        for (let i = 0; i < id.data.length; i += 4) {
          const v = Math.random() * 255
          id.data[i] = id.data[i + 1] = id.data[i + 2] = v
          id.data[i + 3] = Math.random() < 0.5 ? 0 : 255
        }
        g.putImageData(id, 0, 0)
      }
    }

    const draw = (now: number) => {
      const o = opts.current
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      ctx.fillStyle = o.colors.background
      ctx.fillRect(0, 0, w, h)

      const r = o.interactive ? Math.max(80, o.radius || 120) : 0
      const ringAge = ring.t < 0 ? 1e9 : now - ring.t
      const ringR = ringAge * 0.95
      const t = now * 0.002

      // Decay mouse cursor momentum
      mouseVx *= 0.85
      mouseVy *= 0.85

      for (let i = 0; i < count; i++) {
        const j = i * 7
        let x = dots[j]
        let y = dots[j + 1]
        let vx = dots[j + 2]
        let vy = dots[j + 3]
        const hx = dots[j + 4]
        const hy = dots[j + 5]

        // 1. Subtle organic ambient breathing wave
        const waveX = Math.sin(t + hy * 0.016 + hx * 0.008) * 2.2
        const waveY = Math.cos(t * 1.1 + hx * 0.014) * 2.4
        const targetX = hx + waveX
        const targetY = hy + waveY

        // 2. Shockwave ripple ring from clicks or entrance
        if (ringAge < 1200) {
          const rx = hx - ring.x
          const ry = hy - ring.y
          const rd = Math.sqrt(rx * rx + ry * ry) + 0.001
          const band = 1 - Math.min(1, Math.abs(rd - ringR) / 36)
          if (band > 0) {
            const f = band * 5.0 * (1 - ringAge / 1200)
            vx += (rx / rd) * f
            vy += (ry / rd) * f
          }
        }

        // 3. Fluid particle physics with quadratic repulsion & mouse drag
        const s = hwfStep(x, y, vx, vy, targetX, targetY, px, py, r, mouseVx, mouseVy)
        x = s[0]
        y = s[1]
        vx = s[2]
        vy = s[3]

        dots[j] = x
        dots[j + 1] = y
        dots[j + 2] = vx
        dots[j + 3] = vy

        // 4. Luminescent warmth color (vibrant sky-blue glow on motion & hover displacement)
        const dist = Math.hypot(x - hx, y - hy)
        const speed = Math.hypot(vx, vy)
        const k = Math.min(1, dist / 20 + speed * 0.14)

        ctx.fillStyle =
          k > 0.025
            ? "rgb(" +
              Math.round(ink[0] + (warm[0] - ink[0]) * k) + "," +
              Math.round(ink[1] + (warm[1] - ink[1]) * k) + "," +
              Math.round(ink[2] + (warm[2] - ink[2]) * k) + ")"
            : o.colors.ink

        // Tactile particle swell on excitation
        const baseR = dots[j + 6]
        const renderR = baseR * (1 + k * 0.35)

        ctx.beginPath()
        ctx.arc(x, y, renderR, 0, 6.2832)
        ctx.fill()
      }

      if (grainTile && o.grain > 0) {
        ctx.globalAlpha = Math.min(1, o.grain) * 0.06
        ctx.globalCompositeOperation = "overlay"
        const pattern = ctx.createPattern(grainTile, "repeat")
        if (pattern) {
          ctx.fillStyle = pattern
          ctx.fillRect(0, 0, w, h)
        }
        ctx.globalAlpha = 1
        ctx.globalCompositeOperation = "source-over"
      }
    }

    const loop = (now: number) => {
      raf = 0
      if (!visible) return
      draw(now)
      raf = requestAnimationFrame(loop)
    }

    const wake = () => {
      if (!raf && visible) raf = requestAnimationFrame(loop)
    }

    const updatePointer = (clientX: number, clientY: number) => {
      const b = canvas.getBoundingClientRect()
      const curX = clientX - b.left
      const curY = clientY - b.top

      if (prevMouseX > -1e4) {
        mouseVx = (curX - prevMouseX) * 0.7
        mouseVy = (curY - prevMouseY) * 0.7
        const maxV = 25
        mouseVx = Math.max(-maxV, Math.min(maxV, mouseVx))
        mouseVy = Math.max(-maxV, Math.min(maxV, mouseVy))
      } else {
        mouseVx = 0
        mouseVy = 0
      }
      prevMouseX = curX
      prevMouseY = curY
      px = curX
      py = curY
    }

    const onPointerMove = (e: PointerEvent) => {
      if (!opts.current.interactive) return
      updatePointer(e.clientX, e.clientY)
      wake()
    }

    const onPointerLeave = () => {
      px = -1e5
      py = -1e5
      prevMouseX = -1e5
      prevMouseY = -1e5
      mouseVx = 0
      mouseVy = 0
      wake()
    }

    const onPointerDown = (e: PointerEvent) => {
      if (!opts.current.interactive) return
      if ((e.target as HTMLElement).closest("a,button")) return
      const b = canvas.getBoundingClientRect()
      ring = { x: e.clientX - b.left, y: e.clientY - b.top, t: performance.now() }
      wake()
    }

    layout()
    // Initial entrance ripple
    ring = { x: w / 2, y: h - 140, t: performance.now() }
    draw(performance.now())
    wake()

    const onPointerMoveWrapped = (e: MouseEvent | PointerEvent) => {
      if (!opts.current.interactive) return
      visible = true
      updatePointer(e.clientX, e.clientY)
      wake()
    }

    const onPointerDownWrapped = (e: MouseEvent | PointerEvent) => {
      if (!opts.current.interactive) return
      if ((e.target as HTMLElement).closest("a,button")) return
      const b = canvas.getBoundingClientRect()
      ring = { x: e.clientX - b.left, y: e.clientY - b.top, t: performance.now() }
      visible = true
      wake()
    }

    root.addEventListener("pointerenter", onPointerMoveWrapped)
    root.addEventListener("pointermove", onPointerMoveWrapped)
    root.addEventListener("mousemove", onPointerMoveWrapped)
    root.addEventListener("pointerleave", onPointerLeave)
    root.addEventListener("pointerdown", onPointerDownWrapped)
    root.addEventListener("mousedown", onPointerDownWrapped)

    const onWindowMove = (e: MouseEvent | PointerEvent) => {
      if (!root || !canvas) return
      const b = canvas.getBoundingClientRect()
      if (
        e.clientX >= b.left - 40 &&
        e.clientX <= b.right + 40 &&
        e.clientY >= b.top - 40 &&
        e.clientY <= b.bottom + 40
      ) {
        visible = true
        updatePointer(e.clientX, e.clientY)
        wake()
      } else if (px > -1e4) {
        onPointerLeave()
      }
    }
    window.addEventListener("pointermove", onWindowMove, { passive: true })
    window.addEventListener("mousemove", onWindowMove, { passive: true })

    const ro = new ResizeObserver(() => {
      layout()
      wake()
    })
    ro.observe(root)
    const io = new IntersectionObserver((entries) => {
      const isVisible = entries[0] ? entries[0].isIntersecting : true
      if (isVisible) {
        if (!visible) {
          ring = { x: w / 2, y: h - 140, t: performance.now() }
        }
        visible = true
        wake()
      } else {
        visible = false
        if (raf) {
          cancelAnimationFrame(raf)
          raf = 0
        }
      }
    }, { threshold: 0.05 })
    io.observe(root)
    let alive = true
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(() => {
        if (!alive) return
        layout()
        wake()
      })
    }

    return () => {
      alive = false
      if (raf) cancelAnimationFrame(raf)
      ro.disconnect()
      io.disconnect()
      root.removeEventListener("pointerenter", onPointerMoveWrapped)
      root.removeEventListener("pointermove", onPointerMoveWrapped)
      root.removeEventListener("mousemove", onPointerMoveWrapped)
      root.removeEventListener("pointerleave", onPointerLeave)
      root.removeEventListener("pointerdown", onPointerDownWrapped)
      root.removeEventListener("mousedown", onPointerDownWrapped)
      window.removeEventListener("pointermove", onWindowMove)
      window.removeEventListener("mousemove", onWindowMove)
    }
  }, [key])

  const toTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  return (
    <footer
      ref={rootRef}
      className={"hwf-root " + className}
      style={
        {
          height,
          "--hwf-bg": colors.background,
          "--hwf-ink": colors.ink,
          "--hwf-mono": monoFamily,
        } as React.CSSProperties
      }
    >
      <style dangerouslySetInnerHTML={{ __html: HWF_CSS }} />
      <canvas ref={canvasRef} aria-hidden="true" />
      <span className="hwf-sr">{wordmark}</span>
      <div className="hwf-top">
        <div className="hwf-brand">
          <strong>{label}</strong>
          <span>{meta}</span>
        </div>
        {columns.map((col) => (
          <nav className="hwf-col" key={col.title} aria-label={col.title}>
            <h3>{col.title}</h3>
            <ul>
              {col.links.map((l) => (
                <li key={l.label}>
                  <a href={l.href || "#"}>{l.label}</a>
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </div>
      <div className="hwf-rule">
        {backToTop ? (
          <button type="button" className="hwf-up" onClick={toTop}>
            Back to top ↑
          </button>
        ) : null}
      </div>
    </footer>
  )
}

type PointerEv = PointerEvent

