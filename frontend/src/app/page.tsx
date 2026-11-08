'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Radio,
  Mic,
  Play,
  Pause,
  ArrowRight,
  Clock,
  Globe,
  Cpu,
  Check,
  Sparkles,
  Volume2,
} from 'lucide-react';
import { SUPPORTED_LANGUAGES } from '@/types';
import HalftoneWordmarkFooter from '@/components/ui/halftone-wordmark-footer';
import { ClassTraceLogo } from '@/components/ClassTraceLogo';
import { PixelHero } from '@/components/ui/pixel-perfect-hero';
import { GnaniModelSuite } from '@/components/GnaniModelSuite';

const SAMPLE_DEMO_RESULTS = [
  {
    lang: 'Hinglish',
    question: 'Sir ne recursion ka base case kaise samjhaya tha?',
    timestamp: '00:32 - 01:05',
    exactSpeech:
      'Toh base case kya hai? Base case is the terminating condition jahan recursion stop hoti hai. Agar recursion me base condition nahi lagayenge, toh stack overflow ho jayega.',
    topic: 'Recursion Base Case',
  },
  {
    lang: 'Tanglish',
    question: 'Sir recursion la base case pathi enna sonnaru?',
    timestamp: '00:32 - 01:05',
    exactSpeech:
      'Base condition illana recursion la infinite loop aagi stack overflow error varum. So terminating condition kandippa thevai.',
    topic: 'Tanglish Base Case',
  },
  {
    lang: 'Tenglish',
    question: 'Sir recursion lo base case gurinchi em chepparu?',
    timestamp: '00:32 - 01:05',
    exactSpeech:
      'Recursion lo base case chaala important. Base condition lekunte function calls call stack lo fatal error create chestayi.',
    topic: 'Tenglish Base Case',
  },
  {
    lang: 'English',
    question: 'Why does BST inorder traversal print elements in ascending order?',
    timestamp: '04:30 - 05:08',
    exactSpeech:
      'Because in a Binary Search Tree, all nodes in the left subtree are smaller than the root, and all nodes in the right subtree are greater than the root. Left-Root-Right naturally sorts the keys.',
    topic: 'BST Inorder Property',
  },
];

const DIALECT_MARQUEE_ITEMS = [
  { label: 'Hinglish (Hindi + English)', sub: 'Code-Mixed' },
  { label: 'Tanglish (Tamil + English)', sub: 'Code-Mixed' },
  { label: 'Tenglish (Telugu + English)', sub: 'Code-Mixed' },
  { label: 'Kanglish (Kannada + English)', sub: 'Code-Mixed' },
  { label: 'Manglish (Malayalam + English)', sub: 'Code-Mixed' },
  { label: 'Banglish (Bengali + English)', sub: 'Code-Mixed' },
  { label: 'Gnani Pan-Indic STT', sub: 'Speech Engine' },
  { label: 'FFmpeg 16kHz Pipeline', sub: 'Audio Normalization' },
  { label: 'Dual-Tier Scrubber', sub: 'Micro Zoom' },
  { label: 'Verbatim Grounding', sub: 'Zero Hallucinations' },
];

export default function RootLandingPage() {
  const [activeDemoIdx, setActiveDemoIdx] = useState(0);
  const [isPlayingDemo, setIsPlayingDemo] = useState(false);

  const activeDemo = SAMPLE_DEMO_RESULTS[activeDemoIdx];

  const marqueeLogos = DIALECT_MARQUEE_ITEMS.map((item, idx) => (
    <div
      key={idx}
      className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-white/[0.04] border border-white/[0.08] backdrop-blur-md shrink-0 opacity-70 hover:opacity-100 transition-opacity"
    >
      <span className="size-1.5 rounded-full bg-white" />
      <span className="text-xs font-semibold text-white font-display">{item.label}</span>
      <span className="text-[10px] font-mono text-white/40 uppercase">{item.sub}</span>
    </div>
  ));

  return (
    <div className="min-h-screen bg-transparent text-[#F8FAFC] flex flex-col font-sans selection:bg-white/20 selection:text-white relative overflow-x-hidden">
      {/* Navigation Header */}
      <nav className="border-b border-white/[0.08] bg-black/40 backdrop-blur-2xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          <Link href="/" className="flex items-center">
            <ClassTraceLogo size="md" variant="full" />
          </Link>

          <div className="hidden md:flex items-center gap-7 text-xs text-white/60 font-medium">
            <a href="#demo" className="hover:text-white transition-colors">Interactive Demo</a>
            <a href="#models" className="hover:text-white transition-colors">Gnani Models</a>
            <a href="#problem" className="hover:text-white transition-colors">The Problem</a>
            <a href="#how-it-works" className="hover:text-white transition-colors">How It Works</a>
            <a href="#languages" className="hover:text-white transition-colors">Languages</a>
            <a href="#benchmark" className="hover:text-white transition-colors">Benchmark</a>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/dashboard?action=record"
              className="btn-press hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-rose-300 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 transition-colors"
            >
              <Radio className="size-3.5 text-rose-400 animate-pulse" />
              <span>Record Live Class</span>
            </Link>

            <Link
              href="/dashboard"
              className="btn-press flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-black bg-white hover:bg-slate-200 shadow-lg shadow-white/5 transition-colors font-display"
            >
              <span>Enter Workspace</span>
              <ArrowRight className="size-3.5" />
            </Link>
          </div>
        </div>
      </nav>

      <main className="flex-1 flex flex-col relative z-10">
        {/* PIXEL-PERFECT HERO SECTION */}
        <PixelHero
          word1="Class"
          word2="Trace."
          badgeText="Pan-Indic Audio Intelligence • Zero Hallucinations"
          voiceLine="Ask in your college language. Hear the teacher's exact words."
          description="In Indian colleges, professors explain core engineering in Hinglish, Tamil, Telugu, and mixed dialects. ClassTrace indexes the entire lecture, catches your spoken doubts in any tongue, and jumps directly to the professor's original explanation."
          primaryCta="Enter Classroom Workspace"
          primaryCtaMobile="Workspace"
          primaryHref="/dashboard"
          secondaryCta="Record Live Classroom"
          secondaryCtaMobile="Record"
          secondaryHref="/dashboard?action=record"
          brandLogosTitle="Engineered for Indian Higher Education Dialects & Audio Realities"
          customLogos={marqueeLogos}
        >
          {/* Key Trust Signals Strip */}
          <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-xs font-mono text-white/70">
            <span className="flex items-center gap-1.5 bg-white/[0.04] backdrop-blur-md px-3 py-1 rounded-lg border border-white/[0.08]">
              <Check className="size-3.5 text-emerald-400" /> 12+ Indic Dialects Auto-Detected
            </span>
            <span className="flex items-center gap-1.5 bg-white/[0.04] backdrop-blur-md px-3 py-1 rounded-lg border border-white/[0.08]">
              <Check className="size-3.5 text-white" /> 100% Verbatim Audio Grounding
            </span>
            <span className="flex items-center gap-1.5 bg-white/[0.04] backdrop-blur-md px-3 py-1 rounded-lg border border-white/[0.08]">
              <Check className="size-3.5 text-emerald-400" /> Real-Time Live Recording
            </span>
          </div>
        </PixelHero>

        {/* INTERACTIVE PRODUCT FRAME */}
        <section id="demo" className="px-4 sm:px-6 lg:px-8 py-16 max-w-5xl mx-auto w-full relative z-10">
          <div className="w-full rounded-2xl border border-white/[0.1] bg-white/[0.035] shadow-[inset_0_1px_0_rgba(255,255,255,0.25),0_25px_60px_rgba(0,0,0,0.8)] p-4 sm:p-6 text-left relative overflow-hidden backdrop-blur-2xl">
            {/* Window Chrome Header */}
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-3 mb-4">
              <div className="flex items-center gap-2">
                <span className="size-2.5 rounded-full bg-rose-500/80" />
                <span className="size-2.5 rounded-full bg-amber-500/80" />
                <span className="size-2.5 rounded-full bg-emerald-500/80" />
                <span className="text-[11px] font-mono text-white/50 ml-2">ClassTrace Interactive Engine Preview</span>
              </div>
              <div className="flex items-center gap-1.5 text-[11px] font-mono text-emerald-300 bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 rounded-md">
                <span>Verified Audio Grounding</span>
              </div>
            </div>

            {/* Language Query Switcher Tabs */}
            <div className="flex flex-wrap items-center gap-1.5 mb-4">
              <span className="text-xs text-white/50 font-medium mr-1">Try student questions:</span>
              {SAMPLE_DEMO_RESULTS.map((demo, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setActiveDemoIdx(idx);
                    setIsPlayingDemo(false);
                  }}
                  className={`text-xs px-2.5 py-1 rounded-lg border font-medium transition-colors ${
                    activeDemoIdx === idx
                      ? 'bg-white text-black border-white font-semibold'
                      : 'bg-white/[0.04] text-white/60 border-white/[0.08] hover:text-white hover:bg-white/[0.08]'
                  }`}
                >
                  {demo.lang}
                </button>
              ))}
            </div>

            {/* Simulated Voice Question Card */}
            <div className="p-3.5 rounded-xl bg-black/40 border border-white/[0.08] mb-4">
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <div className="flex items-center gap-1.5 text-xs text-white font-semibold font-display">
                  <Mic className="size-3.5 text-white" />
                  <span>Student Spoken Voice Question ({activeDemo.lang}):</span>
                </div>
                <span className="text-[10px] font-mono text-white/50">Auto-Detected Code-Mix</span>
              </div>
              <p className="text-sm text-white font-medium italic">
                &ldquo;{activeDemo.question}&rdquo;
              </p>
            </div>

            {/* Retrieved Exact Moment Card */}
            <div className="p-4 rounded-xl bg-white/[0.05] border border-white/[0.14] shadow-[inset_0_1px_0_rgba(255,255,255,0.2)]">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded bg-white text-black text-[10px] font-mono font-bold">
                    RETRIEVED MOMENT
                  </span>
                  <span className="text-xs font-mono text-white/60">
                    Timestamp: <strong className="text-white">{activeDemo.timestamp}</strong>
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => setIsPlayingDemo(!isPlayingDemo)}
                  className="btn-press flex items-center gap-1.5 px-3 py-1 rounded-xl bg-white hover:bg-slate-200 text-black font-semibold text-xs transition-colors shadow-md"
                >
                  {isPlayingDemo ? <Pause className="size-3 fill-current" /> : <Play className="size-3 fill-current" />}
                  <span>{isPlayingDemo ? 'Pause Audio' : 'Play Teacher\'s Voice'}</span>
                </button>
              </div>

              {/* Exact Verbatim Speech */}
              <div className="p-3 rounded-xl bg-black/40 border border-white/[0.08] text-xs sm:text-sm text-white/90 leading-relaxed font-sans">
                <span className="text-white/50 font-mono text-xs mr-2">Teacher:</span>
                &ldquo;{activeDemo.exactSpeech}&rdquo;
              </div>

              {/* Verified Waveform Micro-Bar */}
              <div className="mt-3 flex items-center gap-1.5 h-4 overflow-hidden">
                {Array.from({ length: 48 }).map((_, i) => (
                  <div
                    key={i}
                    className={`flex-1 rounded-full transition-all duration-200 ${
                      isPlayingDemo ? 'bg-white wave-bar-active' : 'bg-white/20'
                    }`}
                    style={{
                      height: isPlayingDemo ? undefined : `${(i % 5) * 2 + 3}px`,
                      animationDelay: isPlayingDemo ? `${((i * 0.04) % 0.85).toFixed(2)}s` : undefined,
                    }}
                  />
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* PROPRIETARY GNANI AI MODEL SUITE (Prisma v2.5, Timbre v2.5, Evon v3.3) */}
        <GnaniModelSuite />

        {/* SECTION 2: THE PROBLEM */}
        <section id="problem" className="py-16 border-t border-white/[0.08] px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="text-xs font-mono uppercase tracking-widest text-white/50">The Problem</span>
            <h2 className="font-display text-2xl sm:text-4xl font-bold tracking-tight text-white mt-1">
              Why Generic Tools Fail in Indian Classrooms
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="p-6 rounded-2xl bg-white/[0.03] backdrop-blur-xl border border-white/[0.08] shadow-[inset_0_1px_0_rgba(255,255,255,0.15)] space-y-3">
              <div className="size-10 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
                <Clock className="size-5" />
              </div>
              <h3 className="font-display text-base font-semibold text-white">1-Hour Recordings are Too Long</h3>
              <p className="text-xs text-white/60 leading-relaxed">
                Students miss a 2-minute explanation of recursion or database normalization. Nobody has time to rewatch an entire 60-minute recording the night before exams.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-white/[0.03] backdrop-blur-xl border border-white/[0.08] shadow-[inset_0_1px_0_rgba(255,255,255,0.15)] space-y-3">
              <div className="size-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                <Globe className="size-5" />
              </div>
              <h3 className="font-display text-base font-semibold text-white">Regional Code-Mixing Reality</h3>
              <p className="text-xs text-white/60 leading-relaxed">
                Professors don&apos;t speak pure Oxford English. They explain complex DSA and core engineering concepts in Hinglish, Tanglish, or Tenglish. Standard speech tools choke on technical loanwords.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-white/[0.03] backdrop-blur-xl border border-white/[0.08] shadow-[inset_0_1px_0_rgba(255,255,255,0.15)] space-y-3">
              <div className="size-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
                <Check className="size-5" />
              </div>
              <h3 className="font-display text-base font-semibold text-white">Fabricated Summaries Fail</h3>
              <p className="text-xs text-white/60 leading-relaxed">
                Text-generation LLMs fabricate formulas and guess exam answers. ClassTrace plays the teacher&apos;s exact speech directly from the audio recording.
              </p>
            </div>
          </div>
        </section>

        {/* SECTION 3: ARCHITECTURE */}
        <section id="how-it-works" className="py-16 border-t border-white/[0.08] px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="text-xs font-mono uppercase tracking-widest text-white/50">Architecture</span>
            <h2 className="font-display text-2xl sm:text-4xl font-bold tracking-tight text-white mt-1">
              How ClassTrace Works
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-5 rounded-2xl bg-white/[0.03] backdrop-blur-xl border border-white/[0.08] shadow-[inset_0_1px_0_rgba(255,255,255,0.15)] relative">
              <span className="font-mono text-2xl font-bold text-white/20 block mb-2">01</span>
              <h4 className="font-display text-sm font-semibold text-white mb-1.5 flex items-center gap-1.5">
                <Radio className="size-3.5 text-rose-400" />
                Record Live Class
              </h4>
              <p className="text-xs text-white/60 leading-relaxed">
                Hit Record in the classroom. ClassTrace captures audio, standardizes to 16kHz mono WAV via FFmpeg, and stores it permanently.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-white/[0.03] backdrop-blur-xl border border-white/[0.08] shadow-[inset_0_1px_0_rgba(255,255,255,0.15)] relative">
              <span className="font-mono text-2xl font-bold text-white/20 block mb-2">02</span>
              <h4 className="font-display text-sm font-semibold text-white mb-1.5 flex items-center gap-1.5">
                <Cpu className="size-3.5 text-white" />
                Gnani Pan-Indic STT
              </h4>
              <p className="text-xs text-white/60 leading-relaxed">
                Batch speech-to-text transforms the lecture into precise segments with word-level timestamps and acoustic peaks.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-white/[0.03] backdrop-blur-xl border border-white/[0.08] shadow-[inset_0_1px_0_rgba(255,255,255,0.15)] relative">
              <span className="font-mono text-2xl font-bold text-white/20 block mb-2">03</span>
              <h4 className="font-display text-sm font-semibold text-white mb-1.5 flex items-center gap-1.5">
                <Mic className="size-3.5 text-amber-400" />
                Student Spoken Question
              </h4>
              <p className="text-xs text-white/60 leading-relaxed">
                Ask by voice: &ldquo;Sir ne recursion ka base case kaise explain kiya?&rdquo; Transcribed with automatic dialect detection.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-white/[0.03] backdrop-blur-xl border border-white/[0.08] shadow-[inset_0_1px_0_rgba(255,255,255,0.15)] relative">
              <span className="font-mono text-2xl font-bold text-white/20 block mb-2">04</span>
              <h4 className="font-display text-sm font-semibold text-white mb-1.5 flex items-center gap-1.5">
                <Play className="size-3.5 text-emerald-400" />
                Direct Audio Playback
              </h4>
              <p className="text-xs text-white/60 leading-relaxed">
                Multilingual vector search matches the question against the exact lecture moment and plays the teacher&apos;s own words with karaoke highlighting.
              </p>
            </div>
          </div>
        </section>

        {/* SECTION 4: 12+ SUPPORTED INDIAN LANGUAGES */}
        <section id="languages" className="py-16 border-t border-white/[0.08] px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <span className="text-xs font-mono uppercase tracking-widest text-white/50">Pan-Indic Linguistic Engine</span>
            <h2 className="font-display text-2xl sm:text-4xl font-bold tracking-tight text-white mt-1">
              Supports Indian College Dialects
            </h2>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {SUPPORTED_LANGUAGES.map((lang) => (
              <div
                key={lang.code}
                className="p-3.5 rounded-xl bg-white/[0.03] backdrop-blur-xl border border-white/[0.07] flex items-center justify-between hover:border-white/20 hover:bg-white/[0.06] transition-colors"
              >
                <div>
                  <h4 className="font-display text-xs font-semibold text-white">{lang.name}</h4>
                  <p className="text-[10px] text-white/50 font-mono mt-0.5">
                    {lang.native_name} • {lang.indic_code_mixed}
                  </p>
                </div>
                <span className="size-2 rounded-full bg-white shadow-[0_0_8px_rgba(255,255,255,0.8)]" />
              </div>
            ))}
          </div>
        </section>

        {/* SECTION 5: BENCHMARK */}
        <section id="benchmark" className="py-16 border-t border-white/[0.08] px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
          <div className="p-6 sm:p-8 rounded-3xl bg-white/[0.035] backdrop-blur-2xl border border-white/[0.09] shadow-[inset_0_1px_0_rgba(255,255,255,0.25)]">
            <div className="flex flex-col lg:flex-row items-center justify-between gap-8">
              <div className="space-y-3 max-w-xl text-left">
                <span className="text-xs font-mono uppercase tracking-wider text-emerald-400 font-semibold">
                  Benchmark Evaluation
                </span>
                <h3 className="font-display text-2xl sm:text-4xl font-bold text-white tracking-tight">
                  100% Hit Rate. Zero Fabrications.
                </h3>
                <p className="text-xs sm:text-sm text-white/60 leading-relaxed font-sans">
                  Evaluated across ground-truth engineering lectures in English, Hinglish, Tanglish, Tenglish, Kanglish, Manglish, Banglish, Marathi, and Gujarati.
                </p>
                <div className="pt-2">
                  <Link
                    href="/dashboard?action=benchmark"
                    className="inline-flex items-center gap-1.5 text-xs text-white hover:text-white/80 font-semibold underline underline-offset-4"
                  >
                    Run live benchmark in dashboard &rarr;
                  </Link>
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 gap-3 w-full lg:w-auto shrink-0">
                <div className="p-4 rounded-xl bg-black/40 border border-white/[0.08] text-center">
                  <span className="font-mono text-3xl font-bold text-white block">100.0%</span>
                  <span className="text-[11px] text-white/50 font-medium">Hit@1 Retrieval</span>
                </div>
                <div className="p-4 rounded-xl bg-black/40 border border-white/[0.08] text-center">
                  <span className="font-mono text-3xl font-bold text-emerald-400 block">1.000</span>
                  <span className="text-[11px] text-white/50 font-medium">Timestamp IoU</span>
                </div>
                <div className="p-4 rounded-xl bg-black/40 border border-white/[0.08] text-center">
                  <span className="font-mono text-3xl font-bold text-white block">100.0%</span>
                  <span className="text-[11px] text-white/50 font-medium">Hit@3 Accuracy</span>
                </div>
                <div className="p-4 rounded-xl bg-black/40 border border-white/[0.08] text-center">
                  <span className="font-mono text-3xl font-bold text-purple-400 block">100.0%</span>
                  <span className="text-[11px] text-white/50 font-medium">Negative Rejection</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 6: FINAL CTA */}
        <section className="py-20 border-t border-white/[0.08] px-4 sm:px-6 lg:px-8 text-center max-w-4xl mx-auto w-full">
          <h2 className="font-display text-3xl sm:text-5xl font-bold tracking-tight text-white mb-3">
            Never miss a classroom explanation again.
          </h2>
          <p className="text-sm text-white/60 max-w-xl mx-auto mb-8 font-sans">
            Record today&apos;s lecture or explore the demo. Ask questions in your own college language and hear the professor&apos;s answer instantly.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/dashboard"
              className="btn-press flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold text-black bg-white hover:bg-slate-200 shadow-2xl shadow-white/10 transition-colors font-display"
            >
              <span>Enter ClassTrace Workspace</span>
              <ArrowRight className="size-4" />
            </Link>

            <Link
              href="/dashboard?action=record"
              className="btn-press flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-medium text-white bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.14] transition-colors"
            >
              <Radio className="size-3.5 text-rose-400 animate-pulse" />
              <span>Record Live Classroom</span>
            </Link>
          </div>
        </section>
      </main>

      {/* Halftone Wordmark Interactive Canvas Footer */}
      <HalftoneWordmarkFooter
        wordmark="classtrace"
        label="ClassTrace"
        meta="Pan-Indic Lecture Intelligence"
        height="500px"
        crop={0}
        radius={150}
        dotGap={6}
        preset="night"
        palette={{ background: '#030407', ink: '#FFFFFF', warm: '#38BDF8' }}
        columns={[
          {
            title: 'Product',
            links: [
              { label: 'Classroom Workspace', href: '/dashboard' },
              { label: 'Record Live Class', href: '/dashboard?action=record' },
              { label: 'Study Kit', href: '/dashboard' },
              { label: 'Benchmark', href: '/dashboard?action=benchmark' },
            ],
          },
          {
            title: 'Capabilities',
            links: [
              { label: '12+ Indic Dialects' },
              { label: 'Verbatim Audio Grounding' },
              { label: 'Dual-Tier Waveform Scrubber' },
              { label: 'Word Karaoke Sync' },
            ],
          },
          {
            title: 'Languages',
            links: [
              { label: 'Hinglish (Hindi + English)' },
              { label: 'Tanglish (Tamil + English)' },
              { label: 'Tenglish (Telugu + English)' },
              { label: 'Kanglish (Kannada + English)' },
            ],
          },
        ]}
      />
    </div>
  );
}
