'use client';

import React, { useRef, useState, useEffect, useCallback } from 'react';
import { formatTime, getAudioStreamUrl } from '@/lib/api';
import { LectureChapter } from '@/types';
import {
  Play,
  Pause,
  RotateCcw,
  RotateCw,
  Volume2,
  VolumeX,
  Repeat,
  Bookmark,
  Share2,
  Check,
  SkipBack,
  SkipForward,
} from 'lucide-react';

export interface RelevanceMarker {
  start: number;
  end: number;
  rank: number;
  label?: string;
}

interface AudioPlayerProps {
  audioUrl: string;
  lectureId?: string;
  lectureTitle: string;
  jumpTimestamp: number | null;
  snippetEndTimestamp?: number | null;
  relevanceMarkers?: RelevanceMarker[];
  peaks?: number[];
  chapters?: LectureChapter[];
  onTimeUpdate?: (currentTime: number) => void;
  onJumpToTimestamp?: (startTime: number, endTime?: number) => void;
  onBookmarkCurrentTime?: (time: number) => void;
}

// Procedural waveform fallback bars
const WAVEFORM_BARS = Array.from({ length: 80 }, (_, i) => {
  const seed = (Math.sin(i * 12.9898) * 43758.5453) % 1;
  return 0.2 + Math.abs(seed) * 0.8;
});

export const AudioPlayer: React.FC<AudioPlayerProps> = ({
  audioUrl,
  lectureId,
  lectureTitle,
  jumpTimestamp,
  snippetEndTimestamp,
  relevanceMarkers = [],
  peaks,
  chapters = [],
  onTimeUpdate,
  onJumpToTimestamp,
  onBookmarkCurrentTime,
}) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [snippetLoop, setSnippetLoop] = useState(false);
  const [activeSnippetRange, setActiveSnippetRange] = useState<{ start: number; end: number } | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);

  const fullAudioSrc = getAudioStreamUrl(audioUrl);

  // Jump to timestamp when prop changes
  useEffect(() => {
    if (jumpTimestamp !== null && audioRef.current) {
      audioRef.current.currentTime = jumpTimestamp;
      if (snippetEndTimestamp && snippetEndTimestamp > jumpTimestamp) {
        setActiveSnippetRange({ start: jumpTimestamp, end: snippetEndTimestamp });
      }
      audioRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
    }
  }, [jumpTimestamp, snippetEndTimestamp]);

  const handleTimeUpdate = () => {
    if (!audioRef.current) return;
    const curr = audioRef.current.currentTime;
    setCurrentTime(curr);
    if (onTimeUpdate) onTimeUpdate(curr);

    // Snippet loop mode
    if (snippetLoop && activeSnippetRange && curr >= activeSnippetRange.end) {
      audioRef.current.currentTime = activeSnippetRange.start;
      audioRef.current.play();
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration || 0);
    }
  };

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
    }
  };

  const seekRelative = (seconds: number) => {
    if (!audioRef.current) return;
    const target = Math.max(0, Math.min(duration, audioRef.current.currentTime + seconds));
    audioRef.current.currentTime = target;
    setCurrentTime(target);
  };

  const handleSeekChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    if (audioRef.current) {
      audioRef.current.currentTime = val;
      setCurrentTime(val);
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    setIsMuted(val === 0);
    if (audioRef.current) {
      audioRef.current.volume = val;
    }
  };

  const toggleMute = () => {
    if (!audioRef.current) return;
    if (isMuted) {
      audioRef.current.volume = volume || 0.5;
      setIsMuted(false);
    } else {
      audioRef.current.volume = 0;
      setIsMuted(true);
    }
  };

  const cycleSpeed = () => {
    const speeds = [0.75, 1, 1.25, 1.5, 2];
    const nextIdx = (speeds.indexOf(playbackRate) + 1) % speeds.length;
    const nextSpeed = speeds[nextIdx];
    setPlaybackRate(nextSpeed);
    if (audioRef.current) {
      audioRef.current.playbackRate = nextSpeed;
    }
  };

  // Chapter navigation
  const jumpToPreviousChapter = () => {
    if (!chapters || chapters.length === 0) return;
    const currentIdx = chapters.findIndex((c) => currentTime >= c.start_time && currentTime <= c.end_time);
    if (currentIdx > 0) {
      const prevCh = chapters[currentIdx - 1];
      if (onJumpToTimestamp) onJumpToTimestamp(prevCh.start_time, prevCh.end_time);
    } else {
      seekRelative(-10);
    }
  };

  const jumpToNextChapter = () => {
    if (!chapters || chapters.length === 0) return;
    const currentIdx = chapters.findIndex((c) => currentTime >= c.start_time && currentTime <= c.end_time);
    if (currentIdx >= 0 && currentIdx < chapters.length - 1) {
      const nextCh = chapters[currentIdx + 1];
      if (onJumpToTimestamp) onJumpToTimestamp(nextCh.start_time, nextCh.end_time);
    } else {
      seekRelative(10);
    }
  };

  const handleShareMoment = () => {
    if (typeof window === 'undefined') return;
    const url = new URL(window.location.href);
    if (lectureId) url.searchParams.set('lecture', lectureId);
    url.searchParams.set('t', currentTime.toFixed(1));
    if (activeSnippetRange) url.searchParams.set('end', activeSnippetRange.end.toFixed(1));

    navigator.clipboard.writeText(url.toString());
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const currentProgress = duration > 0 ? currentTime / duration : 0;
  const waveformData = peaks && peaks.length >= 40 ? peaks : WAVEFORM_BARS;

  return (
    <div className="w-full shrink-0 z-40 bg-black/50 border-t border-white/[0.08] backdrop-blur-2xl px-3 sm:px-5 py-2 shadow-2xl">
      <audio
        ref={audioRef}
        src={fullAudioSrc}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={() => setIsPlaying(false)}
        preload="metadata"
      />

      <div className="max-w-7xl mx-auto flex flex-col gap-1.5 w-full">
        {/* Tier 2: Micro Zoom Scrubber (When a specific evidence passage is active) */}
        {activeSnippetRange && (
          <div className="flex items-center justify-between gap-2 px-3 py-1 rounded-xl bg-white/[0.08] border border-white/20 text-[11px] animate-in fade-in duration-150">
            <div className="flex items-center gap-2 font-mono text-white">
              <span className="size-1.5 rounded-full bg-white animate-pulse" />
              <span className="text-white/50">Micro Zoom:</span>
              <span className="font-semibold text-white tabular-nums">
                {formatTime(activeSnippetRange.start)} – {formatTime(activeSnippetRange.end)}
              </span>
            </div>

            <div className="flex items-center gap-1.5 font-mono text-[10px]">
              <button
                type="button"
                onClick={() => {
                  if (audioRef.current) {
                    audioRef.current.currentTime = activeSnippetRange.start;
                    audioRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
                  }
                }}
                className="btn-press px-2 py-0.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
              >
                Replay Moment
              </button>
              <button
                type="button"
                onClick={() => setSnippetLoop(!snippetLoop)}
                className={`btn-press flex items-center gap-1 px-2 py-0.5 rounded-lg transition-colors ${
                  snippetLoop ? 'bg-white text-black font-bold' : 'bg-white/[0.06] text-white/60 hover:text-white'
                }`}
              >
                <Repeat className="size-2.5" />
                <span>{snippetLoop ? 'Loop Active' : 'Loop'}</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveSnippetRange(null)}
                className="text-white/40 hover:text-white px-1"
                title="Close micro zoom"
              >
                &times;
              </button>
            </div>
          </div>
        )}

        {/* Tier 1: Waveform Scrubber with Peaks & Relevance Heatmap */}
        <div className="relative w-full flex items-center gap-2 sm:gap-3">
          <span className="text-[11px] font-mono text-white w-10 sm:w-12 text-right tabular-nums shrink-0 font-semibold">
            {formatTime(currentTime)}
          </span>

          <div className="relative flex-1 group py-1.5 min-w-0">
            {/* Waveform Bars Background */}
            <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-4 flex items-center justify-between gap-[1px] sm:gap-[2px] pointer-events-none opacity-40 overflow-hidden">
              {waveformData.map((h, i) => {
                const barRatio = i / waveformData.length;
                const isPlayed = barRatio <= currentProgress;
                return (
                  <div
                    key={i}
                    className={`flex-1 rounded-full transition-colors ${
                      isPlayed ? 'bg-white' : 'bg-white/20'
                    }`}
                    style={{ height: `${Math.round(h * 16)}px` }}
                  />
                );
              })}
            </div>

            {/* Relevance Heatmap Markers from Search */}
            {duration > 0 &&
              relevanceMarkers.map((marker, i) => {
                const markerLeft = (marker.start / duration) * 100;
                const markerWidth = Math.max(1, ((marker.end - marker.start) / duration) * 100);
                const isRank1 = marker.rank === 1;

                return (
                  <button
                    key={i}
                    type="button"
                    onClick={() => {
                      if (onJumpToTimestamp) onJumpToTimestamp(marker.start, marker.end);
                    }}
                    title={`#${marker.rank} Verified Moment: ${formatTime(marker.start)} - ${formatTime(marker.end)}`}
                    className={`absolute top-0 bottom-0 z-20 rounded cursor-pointer transition-transform hover:scale-110 ${
                      isRank1
                        ? 'bg-white/80 border border-white'
                        : 'bg-emerald-400/60 border border-emerald-300'
                    }`}
                    style={{
                      left: `${markerLeft}%`,
                      width: `${markerWidth}%`,
                    }}
                  />
                );
              })}

            {/* Range Scrubber Input */}
            <input
              type="range"
              min={0}
              max={duration || 100}
              step={0.1}
              value={currentTime}
              onChange={handleSeekChange}
              className="relative z-30 w-full h-4 appearance-none bg-transparent cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity focus:outline-none"
            />
          </div>

          <span className="text-[11px] font-mono text-white/50 w-10 sm:w-12 tabular-nums shrink-0">
            {formatTime(duration)}
          </span>
        </div>

        {/* Controls Row */}
        <div className="flex items-center justify-between gap-2 sm:gap-4 max-w-full overflow-hidden">
          {/* Left: Lecture Info & Share Deep-Link */}
          <div className="hidden sm:flex items-center gap-2.5 min-w-0 max-w-sm flex-1">
            <div className="size-7 rounded-lg bg-white/[0.08] border border-white/[0.12] flex items-center justify-center text-white shrink-0">
              <Bookmark className="size-3.5" />
            </div>
            <div className="truncate">
              <h4 className="text-xs font-semibold text-white truncate font-display">{lectureTitle}</h4>
              <p className="text-[10px] font-mono text-white/50">
                {activeSnippetRange
                  ? `Moment: [${formatTime(activeSnippetRange.start)} - ${formatTime(activeSnippetRange.end)}]`
                  : 'College Lecture Audio'}
              </p>
            </div>

            <button
              type="button"
              onClick={handleShareMoment}
              title="Copy shareable moment deep link"
              className="flex items-center gap-1 ml-2 px-2 py-0.5 rounded-lg text-[10px] font-mono text-white/70 hover:text-white bg-white/[0.04] border border-white/[0.08] transition-colors shrink-0"
            >
              {copiedLink ? <Check className="size-3 text-emerald-400" /> : <Share2 className="size-3" />}
              <span>{copiedLink ? 'Copied' : 'Share'}</span>
            </button>
          </div>

          {/* Center: Core Transport Controls */}
          <div className="flex items-center gap-1.5 sm:gap-2 justify-center flex-1 sm:flex-initial">
            {/* Previous Chapter */}
            <button
              type="button"
              onClick={jumpToPreviousChapter}
              title="Previous chapter"
              className="p-1.5 rounded-lg text-white/50 hover:text-white hover:bg-white/[0.08] transition-colors"
            >
              <SkipBack className="size-3.5" />
            </button>

            {/* 10s Backward */}
            <button
              type="button"
              onClick={() => seekRelative(-10)}
              title="Seek backward 10s (Press J)"
              className="p-1.5 rounded-lg text-white/50 hover:text-white hover:bg-white/[0.08] transition-colors"
            >
              <RotateCcw className="size-3.5" />
            </button>

            {/* Play/Pause Button */}
            <button
              type="button"
              onClick={togglePlay}
              title="Play / Pause (Space)"
              className="size-9 rounded-full bg-white text-black flex items-center justify-center hover:bg-slate-200 transition-colors shadow-lg shrink-0"
            >
              {isPlaying ? <Pause className="size-4 fill-current" /> : <Play className="size-4 fill-current ml-0.5" />}
            </button>

            {/* 10s Forward */}
            <button
              type="button"
              onClick={() => seekRelative(10)}
              title="Seek forward 10s (Press L)"
              className="p-1.5 rounded-lg text-white/50 hover:text-white hover:bg-white/[0.08] transition-colors"
            >
              <RotateCw className="size-3.5" />
            </button>

            {/* Next Chapter */}
            <button
              type="button"
              onClick={jumpToNextChapter}
              title="Next chapter"
              className="p-1.5 rounded-lg text-white/50 hover:text-white hover:bg-white/[0.08] transition-colors"
            >
              <SkipForward className="size-3.5" />
            </button>
          </div>

          {/* Right: Loop, Speed, Volume, Bookmark */}
          <div className="flex items-center gap-2 shrink-0 justify-end flex-initial">
            {onBookmarkCurrentTime && (
              <button
                type="button"
                onClick={() => onBookmarkCurrentTime(currentTime)}
                title="Bookmark current timestamp"
                className="hidden lg:flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-mono text-white/70 hover:text-white bg-white/[0.04] border border-white/[0.08] transition-colors"
              >
                <Bookmark className="size-3 text-white" />
                <span>Bookmark</span>
              </button>
            )}

            {/* Loop Toggle */}
            <button
              type="button"
              onClick={() => setSnippetLoop(!snippetLoop)}
              title="Loop active explanation"
              className={`hidden md:flex items-center gap-1 px-2 py-0.5 rounded text-xs transition-colors ${
                snippetLoop
                  ? 'bg-white text-black font-semibold'
                  : 'text-white/50 hover:text-white'
              }`}
            >
              <Repeat className="size-3" />
              <span className="text-[10px] font-mono">Loop</span>
            </button>

            {/* Speed Multiplier */}
            <button
              type="button"
              onClick={cycleSpeed}
              title="Playback speed"
              className="px-2 py-0.5 rounded-lg text-[10px] font-mono font-medium text-white bg-white/[0.06] border border-white/[0.1] hover:border-white/30"
            >
              {playbackRate}x
            </button>

            {/* Volume */}
            <div className="hidden sm:flex items-center gap-1.5">
              <button type="button" onClick={toggleMute} title="Toggle mute (Press M)" className="text-white/50 hover:text-white">
                {isMuted || volume === 0 ? <VolumeX className="size-3.5" /> : <Volume2 className="size-3.5" />}
              </button>
              <input
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={isMuted ? 0 : volume}
                onChange={handleVolumeChange}
                className="w-14 h-1 bg-white/20 rounded appearance-none cursor-pointer accent-white"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AudioPlayer;
