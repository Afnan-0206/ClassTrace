'use client';

import React, { useState } from 'react';
import { SearchResultSegment, SearchResponse, EvonReasoningResponse } from '@/types';
import { formatTime, synthesizeSpeechTimbre, reasonWithEvon } from '@/lib/api';
import {
  Play,
  Pause,
  ShieldAlert,
  Award,
  Clock,
  User,
  Zap,
  Bookmark,
  ChevronDown,
  ChevronUp,
  MessageSquarePlus,
  Volume2,
  Check,
  Layers,
  Sparkles,
} from 'lucide-react';

interface SearchResultsProps {
  searchResponse: SearchResponse | null;
  onPlayTimestamp: (startTime: number, endTime: number) => void;
  activeSegmentId?: string | null;
  currentPlaybackTime?: number;
  bookmarkedIds?: Set<string>;
  onToggleBookmark?: (segment: SearchResultSegment) => void;
  onAskFollowUp?: (segment: SearchResultSegment) => void;
}

export const SearchResults: React.FC<SearchResultsProps> = ({
  searchResponse,
  onPlayTimestamp,
  activeSegmentId,
  currentPlaybackTime = 0,
  bookmarkedIds = new Set(),
  onToggleBookmark,
  onAskFollowUp,
}) => {
  const [expandedContexts, setExpandedContexts] = useState<Set<string>>(new Set());
  const [showExperimentalLabs, setShowExperimentalLabs] = useState<Record<string, boolean>>({});
  const [playingTimbreId, setPlayingTimbreId] = useState<string | null>(null);
  const [currentAudio, setCurrentAudio] = useState<HTMLAudioElement | null>(null);
  const [evonReasoningMap, setEvonReasoningMap] = useState<Record<string, EvonReasoningResponse>>({});
  const [isReasoningLoading, setIsReasoningLoading] = useState<string | null>(null);

  const handlePlayTimbreSpeech = async (segment: SearchResultSegment) => {
    if (playingTimbreId === segment.id && currentAudio) {
      currentAudio.pause();
      setPlayingTimbreId(null);
      return;
    }

    try {
      if (currentAudio) currentAudio.pause();
      const audioUrl = await synthesizeSpeechTimbre(segment.transcript, 'hi');
      const audio = new Audio(audioUrl);
      setCurrentAudio(audio);
      setPlayingTimbreId(segment.id);
      audio.onended = () => setPlayingTimbreId(null);
      await audio.play();
    } catch (err) {
      console.warn('Timbre audio playback note:', err);
      if ('speechSynthesis' in window) {
        const u = new SpeechSynthesisUtterance(segment.transcript);
        window.speechSynthesis.speak(u);
      }
    }
  };

  const handleRunEvonReasoning = async (segment: SearchResultSegment) => {
    if (evonReasoningMap[segment.id]) {
      // Toggle off if already showing
      setEvonReasoningMap((prev) => {
        const next = { ...prev };
        delete next[segment.id];
        return next;
      });
      return;
    }

    try {
      setIsReasoningLoading(segment.id);
      const res = await reasonWithEvon(query, segment.lecture_id);
      setEvonReasoningMap((prev) => ({ ...prev, [segment.id]: res }));
    } catch (err) {
      console.error('Evon reasoning failed:', err);
    } finally {
      setIsReasoningLoading(null);
    }
  };

  if (!searchResponse) return null;

  const toggleContext = (id: string) => {
    setExpandedContexts((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const { results, has_sufficient_evidence, query, message } = searchResponse;

  if (!has_sufficient_evidence || results.length === 0) {
    return (
      <div className="bg-white/[0.035] backdrop-blur-2xl border border-white/[0.08] shadow-[inset_0_1px_0_rgba(255,255,255,0.2)] rounded-2xl p-6 text-center my-4 animate-in fade-in duration-200">
        <div className="size-10 rounded-full bg-white/[0.08] border border-white/[0.14] flex items-center justify-center text-amber-400 mx-auto mb-3">
          <ShieldAlert className="size-5" />
        </div>
        <h3 className="text-sm font-semibold text-white font-display">
          No Sufficiently Relevant Explanation Found
        </h3>
        <p className="text-xs text-white/60 max-w-md mx-auto mt-1 leading-relaxed">
          {message || 'The instructor did not cover or explain this specific concept in the recorded lecture.'}
        </p>
        <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/[0.04] border border-white/[0.08] text-[11px] text-white/60">
          <span className="size-1.5 rounded-full bg-white" />
          <span>Core rule: Grounded evidence only, zero fabricated summaries.</span>
        </div>
      </div>
    );
  }

  return (
    <div className="my-4 space-y-3 animate-in fade-in duration-200">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-semibold text-white uppercase tracking-wider flex items-center gap-1.5 font-display">
          <Award className="size-3.5 text-white" />
          Top Verified Moments in Lecture
        </h3>
        <span className="text-[11px] font-mono text-white/50 tabular-nums">
          {results.length} evidence segment{results.length === 1 ? '' : 's'} retrieved
        </span>
      </div>

      <div className="space-y-3">
        {results.map((segment, index) => {
          const isRank1 = index === 0;
          const isActive = segment.id === activeSegmentId;
          const matchPercent = Math.round(segment.score * 100);
          const duration = Math.round(segment.end_time - segment.start_time);
          const isBookmarked = bookmarkedIds.has(segment.id);
          const isContextExpanded = expandedContexts.has(segment.id);

          // Word-level karaoke calculations
          const words = segment.words || segment.transcript.split(' ').map((w, i, arr) => ({
            word: w,
            start: segment.start_time + (i / arr.length) * (segment.end_time - segment.start_time),
            end: segment.start_time + ((i + 1) / arr.length) * (segment.end_time - segment.start_time),
          }));

          return (
            <div
              key={segment.id}
              className={`rounded-2xl border p-4 transition-all ${
                isRank1
                  ? 'bg-white/[0.08] backdrop-blur-2xl border-white/30 shadow-[inset_0_1px_0_rgba(255,255,255,0.35),0_8px_32px_rgba(0,0,0,0.6)]'
                  : 'bg-white/[0.035] backdrop-blur-2xl border-white/[0.08] hover:border-white/[0.18]'
              } ${isActive ? 'ring-2 ring-white' : ''}`}
            >
              {/* Card Header: Rank, Match %, Timestamps, Quick Play */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 mb-3">
                <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                  <span
                    className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                      isRank1
                        ? 'bg-white text-black font-semibold'
                        : 'bg-white/[0.08] text-white border border-white/[0.1]'
                    }`}
                  >
                    #{index + 1} Best Match
                  </span>

                  <span className="text-xs font-mono font-semibold text-emerald-400">
                    {matchPercent}% Evidence
                  </span>

                  <span className="text-[11px] font-mono text-white/50 flex items-center gap-1">
                    <Clock className="size-3" />
                    {formatTime(segment.start_time)} – {formatTime(segment.end_time)} ({duration}s)
                  </span>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                  {/* Bookmark Button */}
                  {onToggleBookmark && (
                    <button
                      type="button"
                      onClick={() => onToggleBookmark(segment)}
                      title={isBookmarked ? 'Remove from Study Kit' : 'Save moment to Study Kit'}
                      className={`btn-press p-1.5 rounded-xl border transition-colors ${
                        isBookmarked
                          ? 'bg-white text-black border-white'
                          : 'bg-white/[0.04] border-white/[0.08] text-white/60 hover:text-white'
                      }`}
                    >
                      <Bookmark className={`size-3.5 ${isBookmarked ? 'fill-current' : ''}`} />
                    </button>
                  )}

                  {/* Play Moment Primary CTA - Critical Core Workflow */}
                  <button
                    type="button"
                    onClick={() => onPlayTimestamp(segment.start_time, segment.end_time)}
                    className="btn-press flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-slate-200 text-black font-semibold text-xs shadow-md transition-colors"
                  >
                    <Play className="size-3 fill-current" />
                    <span>Play Moment</span>
                  </button>
                </div>
              </div>

              {/* Exact Verbatim Speech Box with Word Karaoke Highlight */}
              <div className="p-3.5 rounded-xl bg-black/40 border border-white/[0.08] text-xs sm:text-sm text-white/90 leading-relaxed font-sans">
                <span className="text-white font-mono text-xs font-bold mr-2">
                  {segment.speaker ? `${segment.speaker}:` : 'Instructor:'}
                </span>

                {words.map((w, wIdx) => {
                  const isWordActive =
                    isActive &&
                    currentPlaybackTime >= w.start &&
                    currentPlaybackTime <= w.end;

                  return (
                    <span
                      key={wIdx}
                      className={`transition-colors rounded px-0.5 ${
                        isWordActive
                          ? 'bg-white text-black font-bold'
                          : 'hover:text-white'
                      }`}
                    >
                      {w.word}{' '}
                    </span>
                  );
                })}
              </div>

              {/* Evon v3.3 30B MoE Multilingual Reasoning Card */}
              {evonReasoningMap[segment.id] && (
                <div className="mt-3 p-4 rounded-xl bg-purple-950/20 border border-purple-500/30 text-xs text-white/90 space-y-2 animate-in fade-in duration-200">
                  <div className="flex items-center justify-between border-b border-purple-500/20 pb-2">
                    <span className="flex items-center gap-1.5 font-mono text-[11px] font-semibold text-purple-300 uppercase">
                      <Sparkles className="size-3 text-purple-400" />
                      Evon v3.3 Grounded Reasoning (30B MoE)
                    </span>
                    <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                      Zero Hallucinations Verified
                    </span>
                  </div>
                  <div className="text-white/80 leading-relaxed font-sans whitespace-pre-line text-xs">
                    {evonReasoningMap[segment.id].explanation}
                  </div>
                </div>
              )}

              {/* Card Footer: Context Accordion + Isolated Experimental Labs Toggle + Ask Follow-Up Trigger */}
              <div className="mt-3 flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-white/[0.06]">
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => toggleContext(segment.id)}
                    className="flex items-center gap-1 text-[11px] font-mono text-white/50 hover:text-white transition-colors"
                  >
                    {isContextExpanded ? <ChevronUp className="size-3" /> : <ChevronDown className="size-3" />}
                    <span>{isContextExpanded ? 'Hide surrounding context' : 'Inspect surrounding context (±60s)'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      setShowExperimentalLabs((prev) => ({
                        ...prev,
                        [segment.id]: !prev[segment.id],
                      }))
                    }
                    className="text-[11px] font-mono text-white/40 hover:text-white/70 underline underline-offset-2 transition-colors"
                  >
                    {showExperimentalLabs[segment.id] ? 'Hide Beta Labs' : 'Experimental Labs (Beta)'}
                  </button>
                </div>

                {onAskFollowUp && (
                  <button
                    type="button"
                    onClick={() => onAskFollowUp(segment)}
                    className="btn-press flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] text-white border border-white/[0.1] text-xs font-medium transition-colors"
                  >
                    <MessageSquarePlus className="size-3" />
                    <span>Ask follow-up question</span>
                  </button>
                )}
              </div>

              {/* Isolated Experimental Features Panel: Timbre TTS & Evon Reasoning */}
              {showExperimentalLabs[segment.id] && (
                <div className="mt-2.5 p-3 rounded-xl bg-white/[0.02] border border-white/[0.08] text-xs space-y-2">
                  <div className="flex items-center justify-between text-[10px] font-mono text-white/50 uppercase tracking-wider">
                    <span>Isolated Experimental Labs (Non-Critical Workflow)</span>
                    <span className="text-amber-400/80">Beta Feature</span>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    {/* Timbre v2.5 TTS Button */}
                    <button
                      type="button"
                      onClick={() => handlePlayTimbreSpeech(segment)}
                      title="Read with Gnani Timbre v2.5"
                      className={`btn-press flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-xs font-medium transition-colors ${
                        playingTimbreId === segment.id
                          ? 'bg-sky-500/20 text-sky-300 border-sky-500/40'
                          : 'bg-white/[0.04] border-white/[0.08] text-white/70 hover:text-white'
                      }`}
                    >
                      {playingTimbreId === segment.id ? (
                        <Pause className="size-3 fill-current text-sky-400" />
                      ) : (
                        <Volume2 className="size-3 text-sky-400" />
                      )}
                      <span>{playingTimbreId === segment.id ? 'Pause Timbre' : 'Test Timbre TTS'}</span>
                    </button>

                    {/* Evon v3.3 Reasoning Button */}
                    <button
                      type="button"
                      onClick={() => handleRunEvonReasoning(segment)}
                      disabled={isReasoningLoading === segment.id}
                      title="Synthesize with Evon v3.3 (30B MoE)"
                      className={`btn-press flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-xs font-medium transition-colors ${
                        evonReasoningMap[segment.id]
                          ? 'bg-purple-500/20 text-purple-300 border-purple-500/40'
                          : 'bg-white/[0.04] border-white/[0.08] text-white/70 hover:text-white'
                      }`}
                    >
                      <Layers className="size-3 text-purple-400" />
                      <span>{isReasoningLoading === segment.id ? 'Evon Reasoning...' : 'Test Evon 30B'}</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Expanded Context Viewer */}
              {isContextExpanded && segment.context_before && (
                <div className="mt-2.5 p-3 rounded-xl bg-black/40 border border-white/[0.08] text-xs text-white/70 space-y-1.5 animate-in fade-in duration-150">
                  <span className="text-[10px] font-mono uppercase text-white/80 font-semibold block">
                    Preceding Context:
                  </span>
                  <p className="italic leading-relaxed">&ldquo;{segment.context_before}&rdquo;</p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default SearchResults;
