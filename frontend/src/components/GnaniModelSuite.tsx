'use client';

import React, { useState } from 'react';
import { Activity, Volume2, Layers, ExternalLink, Play, Pause, Sparkles, Check, ArrowRight } from 'lucide-react';
import { synthesizeSpeechTimbre } from '@/lib/api';

export function GnaniModelSuite() {
  const [isPlayingTimbre, setIsPlayingTimbre] = useState(false);
  const [audioInstance, setAudioInstance] = useState<HTMLAudioElement | null>(null);
  const [isLoadingAudio, setIsLoadingAudio] = useState(false);

  const handlePlayTimbreDemo = async () => {
    if (isPlayingTimbre && audioInstance) {
      audioInstance.pause();
      setIsPlayingTimbre(false);
      return;
    }

    try {
      setIsLoadingAudio(true);
      const audioUrl = await synthesizeSpeechTimbre(
        "Namaste! This is Gnani AI's Timbre v2.5 speaking with context-aware Indic prosody and lakh and crore cadence.",
        "hi"
      );
      const audio = new Audio(audioUrl);
      setAudioInstance(audio);
      audio.onended = () => setIsPlayingTimbre(false);
      await audio.play();
      setIsPlayingTimbre(true);
    } catch (e) {
      console.warn('Timbre preview note:', e);
      // Fallback browser speech if audio context blocked
      if ('speechSynthesis' in window) {
        const u = new SpeechSynthesisUtterance("Namaste! This is Gnani AI's Timbre v2.5 speaking with authentic Indian prosody.");
        window.speechSynthesis.speak(u);
      }
    } finally {
      setIsLoadingAudio(false);
    }
  };

  return (
    <section id="models" className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full relative z-10">
      {/* Section Header */}
      <div className="text-center max-w-3xl mx-auto mb-14">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/[0.06] border border-white/[0.12] text-[11px] font-mono tracking-widest uppercase text-white/80 mb-3 shadow-sm">
          <Sparkles className="size-3 text-cyan-400" />
          <span>Proprietary Multilingual AI Infrastructure</span>
        </div>
        <h2 className="font-display text-3xl sm:text-5xl font-extrabold tracking-tight text-white leading-tight">
          Powered by Gnani AI&apos;s Frontier Trio
        </h2>
        <p className="mt-4 text-sm sm:text-base text-white/70 leading-relaxed font-sans max-w-2xl mx-auto">
          Three specialized Indic foundation models working in synchronization to stream, transcribe, synthesize, and reason across 10+ languages with verbatim grounding.
        </p>
      </div>

      {/* The 3 Model Cards matching reference specification */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
        {/* CARD 1: PRISMA v2.5 (STT) */}
        <div className="group relative rounded-3xl p-7 sm:p-8 bg-white/[0.04] border border-white/[0.10] hover:border-white/[0.25] backdrop-blur-2xl shadow-[inset_0_1px_0_rgba(255,255,255,0.2),0_20px_50px_rgba(0,0,0,0.6)] flex flex-col justify-between transition-all duration-300 hover:-translate-y-1">
          <div>
            {/* Top Icon Badge */}
            <div className="size-12 rounded-2xl bg-white/[0.08] border border-white/[0.15] flex items-center justify-center text-white mb-6 shadow-sm group-hover:scale-105 transition-transform">
              <Activity className="size-6 text-cyan-400" />
            </div>

            {/* Category Subtitle */}
            <div className="text-[11px] font-mono font-semibold tracking-widest uppercase text-white/50 mb-2">
              SPEECH TO TEXT
            </div>

            {/* Model Name */}
            <h3 className="font-display text-2xl font-bold text-white mb-3">
              Prisma v2.5
            </h3>

            {/* Description */}
            <p className="text-xs sm:text-sm text-white/75 leading-relaxed font-sans mb-6">
              Trained on 14M+ hours of telephonic audio. Streams in under 200ms across 10+ Indian languages plus Hinglish, Tanglish and Benglish, according to Gnani AI&apos;s published benchmarks.
            </p>

            {/* Spec Highlights */}
            <div className="space-y-2 mb-6 pt-4 border-t border-white/[0.08] text-[11px] font-mono text-white/60">
              <div className="flex items-center justify-between">
                <span>Latency:</span>
                <strong className="text-emerald-400">&lt; 200ms Real-Time</strong>
              </div>
              <div className="flex items-center justify-between">
                <span>Audio Dataset:</span>
                <strong className="text-white">14M+ Telephonic Hrs</strong>
              </div>
              <div className="flex items-center justify-between">
                <span>Dialects:</span>
                <strong className="text-white">10+ Indic + Mixed</strong>
              </div>
            </div>
          </div>

          {/* Action Link */}
          <a
            href="https://www.gnani.ai/speech-to-text-api/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-white/90 hover:text-white underline underline-offset-4 decoration-white/40 hover:decoration-white transition-all pt-2"
          >
            <span>Speech to text API</span>
            <ExternalLink className="size-3.5 opacity-70 group-hover:opacity-100" />
          </a>
        </div>

        {/* CARD 2: TIMBRE v2.5 (TTS) */}
        <div className="group relative rounded-3xl p-7 sm:p-8 bg-white/[0.04] border border-white/[0.10] hover:border-white/[0.25] backdrop-blur-2xl shadow-[inset_0_1px_0_rgba(255,255,255,0.2),0_20px_50px_rgba(0,0,0,0.6)] flex flex-col justify-between transition-all duration-300 hover:-translate-y-1">
          <div>
            {/* Top Icon Badge */}
            <div className="size-12 rounded-2xl bg-white/[0.08] border border-white/[0.15] flex items-center justify-center text-white mb-6 shadow-sm group-hover:scale-105 transition-transform">
              <Volume2 className="size-6 text-sky-400" />
            </div>

            {/* Category Subtitle */}
            <div className="text-[11px] font-mono font-semibold tracking-widest uppercase text-white/50 mb-2">
              TEXT TO SPEECH, BETA
            </div>

            {/* Model Name */}
            <h3 className="font-display text-2xl font-bold text-white mb-3 flex items-center justify-between">
              <span>Timbre v2.5</span>
              <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-300 border border-sky-500/30">
                Beta
              </span>
            </h3>

            {/* Description */}
            <p className="text-xs sm:text-sm text-white/75 leading-relaxed font-sans mb-6">
              Speaks 10+ Indic languages with context-aware prosody, Indian names, numerals and lakh and crore cadence. Streams over WebSocket and SSE.
            </p>

            {/* Spec Highlights */}
            <div className="space-y-2 mb-6 pt-4 border-t border-white/[0.08] text-[11px] font-mono text-white/60">
              <div className="flex items-center justify-between">
                <span>Prosody:</span>
                <strong className="text-white">Context-Aware Indic</strong>
              </div>
              <div className="flex items-center justify-between">
                <span>Numerals:</span>
                <strong className="text-sky-300">Lakh &amp; Crore Cadence</strong>
              </div>
              <div className="flex items-center justify-between">
                <span>Protocols:</span>
                <strong className="text-white">WebSocket &amp; SSE</strong>
              </div>
            </div>

            {/* Live Interactive Sample Audio Button */}
            <button
              type="button"
              onClick={handlePlayTimbreDemo}
              disabled={isLoadingAudio}
              className="w-full mb-4 flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-white/[0.08] hover:bg-white/[0.15] text-xs font-semibold text-white border border-white/[0.15] transition-all shadow-sm"
            >
              {isPlayingTimbre ? (
                <>
                  <Pause className="size-3.5 fill-current" />
                  <span>Pause Timbre Voice</span>
                </>
              ) : (
                <>
                  <Play className="size-3.5 fill-current text-sky-400" />
                  <span>{isLoadingAudio ? 'Synthesizing...' : 'Hear Timbre Indic Voice'}</span>
                </>
              )}
            </button>
          </div>

          {/* Action Link */}
          <a
            href="https://www.gnani.ai/text-to-speech-api/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-white/90 hover:text-white underline underline-offset-4 decoration-white/40 hover:decoration-white transition-all pt-2"
          >
            <span>Text to speech API</span>
            <ExternalLink className="size-3.5 opacity-70 group-hover:opacity-100" />
          </a>
        </div>

        {/* CARD 3: EVON v3.3 (REASONING) */}
        <div className="group relative rounded-3xl p-7 sm:p-8 bg-white/[0.04] border border-white/[0.10] hover:border-white/[0.25] backdrop-blur-2xl shadow-[inset_0_1px_0_rgba(255,255,255,0.2),0_20px_50px_rgba(0,0,0,0.6)] flex flex-col justify-between transition-all duration-300 hover:-translate-y-1">
          <div>
            {/* Top Icon Badge */}
            <div className="size-12 rounded-2xl bg-white/[0.08] border border-white/[0.15] flex items-center justify-center text-white mb-6 shadow-sm group-hover:scale-105 transition-transform">
              <Layers className="size-6 text-purple-400" />
            </div>

            {/* Category Subtitle */}
            <div className="text-[11px] font-mono font-semibold tracking-widest uppercase text-white/50 mb-2">
              REASONING, OPEN WEIGHT
            </div>

            {/* Model Name */}
            <h3 className="font-display text-2xl font-bold text-white mb-3 flex items-center justify-between">
              <span>Evon v3.3</span>
              <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
                30B MoE
              </span>
            </h3>

            {/* Description */}
            <p className="text-xs sm:text-sm text-white/75 leading-relaxed font-sans mb-6">
              A 30B-parameter mixture-of-experts model with 128K context and 11 Indian languages natively. Apache 2.0 weights are available by request on Hugging Face.
            </p>

            {/* Spec Highlights */}
            <div className="space-y-2 mb-6 pt-4 border-t border-white/[0.08] text-[11px] font-mono text-white/60">
              <div className="flex items-center justify-between">
                <span>Architecture:</span>
                <strong className="text-purple-300">30B Mixture-of-Experts</strong>
              </div>
              <div className="flex items-center justify-between">
                <span>Context Window:</span>
                <strong className="text-white">128K Tokens</strong>
              </div>
              <div className="flex items-center justify-between">
                <span>Native Languages:</span>
                <strong className="text-white">11 Indian Languages</strong>
              </div>
              <div className="flex items-center justify-between">
                <span>License:</span>
                <strong className="text-emerald-400">Apache 2.0</strong>
              </div>
            </div>
          </div>

          {/* Action Link */}
          <a
            href="https://huggingface.co/gnani-ai"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-white/90 hover:text-white underline underline-offset-4 decoration-white/40 hover:decoration-white transition-all pt-2"
          >
            <span>Evon v3.3 release notes</span>
            <ExternalLink className="size-3.5 opacity-70 group-hover:opacity-100" />
          </a>
        </div>
      </div>
    </section>
  );
}

export default GnaniModelSuite;

