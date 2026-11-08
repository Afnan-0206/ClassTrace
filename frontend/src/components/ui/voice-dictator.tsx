"use client";

import { useCallback, useEffect, useRef, useState, type FC } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Mic, Square, Loader2, ArrowRight } from "lucide-react";

const TRANSCRIPT_LIBRARY = [
  "Sir ne recursion ka base case kaise explain kiya tha?",
  "What happens if there is no base condition in recursion?",
  "Call stack pe activation records kaise push aur pop hote hain?",
  "Sir recursion la base case pathi enna sonnaru?",
  "Binary tree structure lo root node aur leaves ante enti?",
  "Inorder traversal ka correct order kya hota hai? Left root right?",
] as const;

type WebGLResources = {
  gl: WebGLRenderingContext;
  program: WebGLProgram;
  uniforms: {
    time: WebGLUniformLocation | null;
    amplitude: WebGLUniformLocation | null;
    resolution: WebGLUniformLocation | null;
  };
};

type TimeoutHandle = ReturnType<typeof setTimeout> | null;

const pickRandom = <T,>(items: readonly T[], exclude?: T) => {
  if (items.length === 0) {
    throw new Error("Cannot pick from an empty collection");
  }

  if (items.length === 1) {
    return items[0]!;
  }

  let candidate = items[Math.floor(Math.random() * items.length)]!;
  if (exclude !== undefined) {
    let safety = 0;
    while (candidate === exclude && safety < 10) {
      candidate = items[Math.floor(Math.random() * items.length)]!;
      safety += 1;
    }
  }

  return candidate;
};

export interface VoiceDictatorProps {
  isRealRecording?: boolean;
  audioLevel?: number;
  recordSeconds?: number;
  recognizedText?: string | null;
  statusMessage?: string | null;
  errorMsg?: string | null;
  isProcessing?: boolean;
  onToggleRecording?: () => void;
  onClose?: () => void;
  onConfirmQuery?: (query: string) => void;
  onSelectSample?: (query: string) => void;
  standalone?: boolean;
}

export const VoiceDictator: FC<VoiceDictatorProps> = ({
  isRealRecording = false,
  audioLevel = 0,
  recordSeconds = 0,
  recognizedText = null,
  statusMessage = null,
  errorMsg = null,
  isProcessing = false,
  onToggleRecording,
  onClose,
  onConfirmQuery,
  onSelectSample,
  standalone = false,
}) => {
  const isControlled = !standalone && onToggleRecording !== undefined;

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const webglRef = useRef<WebGLResources | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  const amplitudeRef = useRef(0.08);
  const targetAmplitudeRef = useRef(0.08);

  // Standalone / demo states
  const [demoListening, setDemoListening] = useState(false);
  const [demoTranscript, setDemoTranscript] = useState(
    "Generate expressive prompts by speaking naturally. We will render a faux transcript here."
  );

  const isListening = isControlled ? isRealRecording : demoListening;

  const listeningRef = useRef(false);
  const scriptRef = useRef<string[]>([]);
  const wordIndexRef = useRef(0);
  const wordTimeoutRef = useRef<TimeoutHandle>(null);
  const pulseTimeoutRef = useRef<TimeoutHandle>(null);

  // Update target amplitude from real audio level when controlled
  useEffect(() => {
    if (isControlled) {
      if (isRealRecording) {
        // Map 0-1 audio level smoothly to shader amplitude
        const boosted = 0.08 + Math.min(1.2, audioLevel * 2.8);
        targetAmplitudeRef.current = boosted;
      } else if (isProcessing) {
        targetAmplitudeRef.current = 0.22;
      } else {
        targetAmplitudeRef.current = 0.06;
      }
    }
  }, [isControlled, isRealRecording, audioLevel, isProcessing]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && onClose) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  const initialiseWebGL = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl = canvas.getContext("webgl", {
      antialias: false,
      premultipliedAlpha: false,
      preserveDrawingBuffer: false,
    });

    if (!gl) return;

    const vertexShaderSource = `
      attribute vec2 aPosition;

      void main() {
        gl_Position = vec4(aPosition, 0.0, 1.0);
      }
    `;

    const fragmentShaderSource = `
      precision highp float;

      uniform float uTime;
      uniform float uAmplitude;
      uniform vec2 uResolution;

      float bayerDither(vec2 coord) {
        vec2 p = floor(mod(coord, 8.0));
        float x = p.x;
        float y = p.y;

        float index =
          1.0 * mod(x, 2.0) +
          2.0 * mod(y, 2.0) +
          4.0 * mod(floor(x / 2.0), 2.0) +
          8.0 * mod(floor(y / 2.0), 2.0) +
          16.0 * mod(floor(x / 4.0), 2.0) +
          32.0 * mod(floor(y / 4.0), 2.0);

        return (index + 0.5) / 64.0;
      }

      void main() {
        vec2 normalized = gl_FragCoord.xy / uResolution;
        vec2 uv = normalized * 2.0 - 1.0;
        uv.x *= uResolution.x / uResolution.y;

        float time = uTime * 0.5;
        float amplitude = clamp(uAmplitude, 0.0, 1.2);

        float radius = 0.21 + amplitude * 0.11 + sin(time * 0.9) * 0.012;
        float thickness = 0.07 + amplitude * 0.05 + sin(time * 0.63) * 0.009;

        float dist = length(uv);
        float ring = smoothstep(radius + thickness, radius, dist) - smoothstep(radius, radius - thickness, dist);
        float glow = exp(-14.0 * abs(dist - radius));
        float halo = exp(-6.5 * dist * (1.0 + amplitude * 0.35));

        float intensity = clamp(ring * 0.75 + glow * 0.5 + halo * 0.08, 0.0, 1.0);

        float threshold = bayerDither(gl_FragCoord.xy);
        float shade = step(threshold, intensity);

        gl_FragColor = vec4(vec3(shade), 1.0);
      }
    `;

    const createShader = (type: GLenum, source: string) => {
      const shader = gl.createShader(type);
      if (!shader) throw new Error("Unable to create shader");
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      const compiled = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
      if (!compiled) {
        const info = gl.getShaderInfoLog(shader);
        gl.deleteShader(shader);
        throw new Error(info ?? "Unknown shader compilation error");
      }
      return shader;
    };

    const vertexShader = createShader(gl.VERTEX_SHADER, vertexShaderSource);
    const fragmentShader = createShader(
      gl.FRAGMENT_SHADER,
      fragmentShaderSource
    );

    const program = gl.createProgram();
    if (!program) throw new Error("Unable to create WebGL program");

    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);

    const linked = gl.getProgramParameter(program, gl.LINK_STATUS);
    if (!linked) {
      const info = gl.getProgramInfoLog(program);
      gl.deleteProgram(program);
      gl.deleteShader(vertexShader);
      gl.deleteShader(fragmentShader);
      throw new Error(info ?? "Unknown WebGL linking error");
    }

    gl.deleteShader(vertexShader);
    gl.deleteShader(fragmentShader);

    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    const vertices = new Float32Array([
      -1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1,
    ]);
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

    const positionLocation = gl.getAttribLocation(program, "aPosition");
    gl.enableVertexAttribArray(positionLocation);
    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

    gl.useProgram(program);
    gl.disable(gl.DEPTH_TEST);
    gl.disable(gl.CULL_FACE);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

    const uniforms = {
      time: gl.getUniformLocation(program, "uTime"),
      amplitude: gl.getUniformLocation(program, "uAmplitude"),
      resolution: gl.getUniformLocation(program, "uResolution"),
    };

    webglRef.current = { gl, program, uniforms };

    const resize = () => {
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const pixelRatio = window.devicePixelRatio || 1;
      const width = Math.round(rect.width * pixelRatio);
      const height = Math.round(rect.height * pixelRatio);
      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
      }
      gl.viewport(0, 0, width, height);
    };

    resize();

    const render = (time: number) => {
      animationFrameRef.current = requestAnimationFrame(render);
      const resources = webglRef.current;
      if (!resources) return;
      const {
        gl: context,
        program: shaderProgram,
        uniforms: shaderUniforms,
      } = resources;

      resize();
      context.useProgram(shaderProgram);
      context.clearColor(0, 0, 0, 1);
      context.clear(context.COLOR_BUFFER_BIT);

      const smoothing = 0.94;
      const amplitude =
        amplitudeRef.current +
        (targetAmplitudeRef.current - amplitudeRef.current) * (1 - smoothing);
      amplitudeRef.current = amplitude;

      if (shaderUniforms.time) {
        context.uniform1f(shaderUniforms.time, time * 0.001);
      }
      if (shaderUniforms.amplitude) {
        context.uniform1f(shaderUniforms.amplitude, amplitude);
      }
      if (shaderUniforms.resolution) {
        context.uniform2f(
          shaderUniforms.resolution,
          context.drawingBufferWidth,
          context.drawingBufferHeight
        );
      }

      const button = buttonRef.current;
      if (button) {
        const scale = 1 + amplitude * 0.12;
        const glow = 12 + amplitude * 70;
        const opacity = 0.08 + amplitude * 0.25;
        button.style.transform = `scale(${scale})`;
        button.style.boxShadow = `0 0 ${glow.toFixed(1)}px rgba(255, 255, 255, ${opacity.toFixed(3)})`;
      }

      context.drawArrays(context.TRIANGLES, 0, 6);
    };

    render(0);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      animationFrameRef.current = null;
    };
  }, []);

  useEffect(() => {
    try {
      const cleanup = initialiseWebGL();
      return () => {
        if (cleanup) cleanup();
        webglRef.current = null;
      };
    } catch (error) {
      console.error(error);
    }
  }, [initialiseWebGL]);

  // Standalone simulated pulse & word delivery
  useEffect(() => {
    if (isControlled) return;
    listeningRef.current = demoListening;
  }, [isControlled, demoListening]);

  const stopDemoDictation = useCallback((completed = false) => {
    listeningRef.current = false;
    setDemoListening(false);
    targetAmplitudeRef.current = completed ? 0.12 : 0.06;
  }, []);

  useEffect(() => {
    if (isControlled) return;

    if (!demoListening) {
      if (pulseTimeoutRef.current) {
        clearTimeout(pulseTimeoutRef.current);
        pulseTimeoutRef.current = null;
      }
      targetAmplitudeRef.current = 0.06;
      return;
    }

    const pump = () => {
      if (!listeningRef.current) return;
      targetAmplitudeRef.current = 0.25 + Math.random() * 0.7;
      const delay = 120 + Math.random() * 80;
      pulseTimeoutRef.current = setTimeout(pump, delay);
    };

    pump();

    return () => {
      if (pulseTimeoutRef.current) {
        clearTimeout(pulseTimeoutRef.current);
        pulseTimeoutRef.current = null;
      }
    };
  }, [isControlled, demoListening]);

  useEffect(() => {
    if (isControlled) return;

    if (!demoListening) {
      if (wordTimeoutRef.current) {
        clearTimeout(wordTimeoutRef.current);
        wordTimeoutRef.current = null;
      }
      return;
    }

    const transcriptScript = pickRandom(TRANSCRIPT_LIBRARY);
    scriptRef.current = transcriptScript.split(" ");
    wordIndexRef.current = 0;
    setDemoTranscript("");

    const deliver = () => {
      if (!listeningRef.current) return;
      if (wordIndexRef.current >= scriptRef.current.length) {
        stopDemoDictation(true);
        return;
      }

      const nextWord = scriptRef.current[wordIndexRef.current];
      if (nextWord) {
        wordIndexRef.current += 1;
        setDemoTranscript((previous) =>
          previous.length > 0 ? `${previous} ${nextWord}` : nextWord
        );
        targetAmplitudeRef.current = 0.32 + Math.random() * 0.6;
      }

      const delay = 160 + Math.random() * 200;
      wordTimeoutRef.current = setTimeout(deliver, delay);
    };

    const initialDelay = 220 + Math.random() * 220;
    wordTimeoutRef.current = setTimeout(deliver, initialDelay);

    return () => {
      if (wordTimeoutRef.current) {
        clearTimeout(wordTimeoutRef.current);
        wordTimeoutRef.current = null;
      }
    };
  }, [isControlled, demoListening, stopDemoDictation]);

  useEffect(() => {
    return () => {
      if (wordTimeoutRef.current) clearTimeout(wordTimeoutRef.current);
      if (pulseTimeoutRef.current) clearTimeout(pulseTimeoutRef.current);
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, []);

  const handleToggle = useCallback(() => {
    if (isControlled) {
      if (onToggleRecording) onToggleRecording();
      return;
    }

    if (listeningRef.current) {
      stopDemoDictation(false);
      return;
    }

    listeningRef.current = true;
    setDemoListening(true);
  }, [isControlled, onToggleRecording, stopDemoDictation]);

  // Active displayed transcript text
  const currentTranscript = isControlled
    ? recognizedText ||
      (isProcessing
        ? "Transcribing your question with Gnani AI Prisma v2.5..."
        : isRealRecording
        ? `Listening to your voice (${recordSeconds}s / 30s max)... Speak naturally in English, Hindi, or Hinglish.`
        : "Click the circle to record your question.")
    : demoTranscript;

  return (
    <div className="relative flex h-full min-h-[500px] w-full flex-col items-center justify-center overflow-hidden bg-black text-white rounded-2xl select-none">
      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />

      {/* Top Header Controls (if in modal/controlled mode) */}
      {onClose && (
        <div className="absolute top-6 inset-x-6 z-20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-rose-500 animate-pulse" />
            <span className="text-xs font-mono uppercase tracking-wider text-white/70">
              Voice Dictator Mode
            </span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-white/80 hover:bg-white/20 transition-colors"
            title="Close voice dictator (Esc)"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Center Tactile Toggle Button */}
      <motion.button
        ref={buttonRef}
        type="button"
        onClick={handleToggle}
        disabled={isProcessing}
        className={`absolute top-1/2 left-1/2 flex h-10 w-10 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full transition-colors ${
          isProcessing
            ? "bg-sky-400/90 text-black cursor-wait"
            : isListening
            ? "bg-rose-500 text-white shadow-rose-900"
            : "bg-white/90 text-black hover:bg-white"
        }`}
        animate={{
          scale: isListening ? [1, 1.08, 1] : 1,
          opacity: isListening ? 1 : 0.8,
        }}
        transition={{
          scale: {
            duration: 0.6,
            repeat: isListening ? Infinity : 0,
            ease: "easeInOut",
          },
          opacity: {
            duration: 0.3,
            ease: "easeInOut",
          },
        }}
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.94 }}
        title={isListening ? "Stop Recording" : "Start Voice Recording"}
      >
        {isProcessing ? (
          <Loader2 className="h-4 w-4 animate-spin text-black" />
        ) : isListening ? (
          <Square className="h-4 w-4 fill-current text-white" />
        ) : (
          <Mic className="h-4 w-4 text-black" />
        )}
      </motion.button>

      {/* Elapsed Recording Duration Badge */}
      {isControlled && isRealRecording && (
        <div className="absolute top-[58%] left-1/2 -translate-x-1/2 z-10">
          <span className="rounded-full bg-black/60 border border-white/20 px-3 py-1 font-mono text-xs text-rose-400 tabular-nums">
            00:{recordSeconds < 10 ? `0${recordSeconds}` : recordSeconds} / 00:30
          </span>
        </div>
      )}

      {/* Transcript / Instructions Text */}
      <div className="absolute bottom-12 z-20 max-w-2xl px-6 text-center">
        {errorMsg ? (
          <div className="mb-3 p-3 rounded-xl bg-rose-950/70 border border-rose-800 text-rose-300 text-xs">
            <p className="font-semibold">{errorMsg}</p>
            <p className="text-[11px] text-rose-400 mt-1">
              Click the center button to retry speaking, or select a question below.
            </p>
          </div>
        ) : null}

        <motion.p
          className="text-base leading-relaxed text-pretty text-white/90 sm:text-lg font-light"
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          key={currentTranscript}
        >
          {currentTranscript}
        </motion.p>

        {/* Action button when recognized text is ready */}
        <AnimatePresence>
          {recognizedText && onConfirmQuery && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mt-4 flex justify-center"
            >
              <button
                type="button"
                onClick={() => onConfirmQuery(recognizedText)}
                className="btn-press flex items-center gap-2 rounded-xl bg-sky-400 px-5 py-2.5 text-xs font-semibold text-slate-950 hover:bg-sky-300 transition-colors shadow-xl"
              >
                <span>Find Moment in Lecture</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Quick Voice Test Prompts (1-Click Test) */}
        {!isRealRecording && !isProcessing && onSelectSample && (
          <div className="mt-4 flex flex-wrap items-center justify-center gap-1.5">
            <span className="text-[11px] text-white/40 font-mono">Try Voice Query:</span>
            <button
              type="button"
              onClick={() => onSelectSample("Sir ne recursion ka base case kaise explain kiya tha?")}
              className="text-[11px] px-2 py-0.5 rounded-md bg-white/10 hover:bg-white/20 text-white/80 hover:text-white transition-colors"
            >
              &ldquo;Base case kaise explain kiya?&rdquo;
            </button>
            <button
              type="button"
              onClick={() => onSelectSample("What happens if there is no base condition in recursion?")}
              className="text-[11px] px-2 py-0.5 rounded-md bg-white/10 hover:bg-white/20 text-white/80 hover:text-white transition-colors"
            >
              &ldquo;Missing base condition error&rdquo;
            </button>
            <button
              type="button"
              onClick={() => onSelectSample("Sir recursion la base case pathi enna sonnaru?")}
              className="text-[11px] px-2 py-0.5 rounded-md bg-white/10 hover:bg-white/20 text-white/80 hover:text-white transition-colors"
            >
              &ldquo;Tanglish: Base case pathi enna sonnaru?&rdquo;
            </button>
          </div>
        )}
      </div>

      {/* Bottom Gradient Fade */}
      <motion.div
        className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-36 bg-gradient-to-t from-black via-black/40 to-transparent"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4 }}
      />
    </div>
  );
};

export default VoiceDictator;
