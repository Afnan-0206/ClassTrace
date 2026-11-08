'use client';

import React from 'react';
import { LectureChapter } from '@/types';
import { formatTime } from '@/lib/api';
import { Sparkles, Layers, Clock, ArrowRight } from 'lucide-react';

interface LectureChaptersProps {
  chapters?: LectureChapter[];
  currentTime: number;
  onJumpToChapter: (startTime: number, endTime?: number) => void;
}

export const LectureChapters: React.FC<LectureChaptersProps> = ({
  chapters = [],
  currentTime,
  onJumpToChapter,
}) => {
  if (!chapters || chapters.length === 0) return null;

  return (
    <div className="surface-panel p-3.5 sm:p-4 my-3 bg-white/[0.035] backdrop-blur-2xl border border-white/[0.08] shadow-[inset_0_1px_0_rgba(255,255,255,0.2)] rounded-2xl">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="size-6 rounded-lg bg-white/[0.08] border border-white/[0.12] flex items-center justify-center text-white">
            <Layers className="size-3.5" />
          </div>
          <div>
            <h3 className="text-xs font-semibold text-white uppercase tracking-wider font-display">
              Lecture Chapters & Concept Map
            </h3>
            <p className="text-[10px] text-white/50">
              {chapters.length} thematic modules with concept checkpoints
            </p>
          </div>
        </div>
        <span className="text-[11px] font-mono text-white/50 tabular-nums">
          Seek to exact part
        </span>
      </div>

      {/* Chapters Horizontal Scrollable on Mobile, Grid on Desktop */}
      <div className="flex overflow-x-auto no-scrollbar pb-1 sm:pb-0 sm:grid sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
        {chapters.map((ch) => {
          const isActive = currentTime >= ch.start_time && currentTime <= ch.end_time;
          const chapterDuration = ch.end_time - ch.start_time;
          const progressInChapter = isActive
            ? Math.min(1, Math.max(0, (currentTime - ch.start_time) / (chapterDuration || 1)))
            : currentTime > ch.end_time
            ? 1
            : 0;

          return (
            <button
              key={ch.chapter_number}
              type="button"
              onClick={() => onJumpToChapter(ch.start_time, ch.end_time)}
              className={`btn-press group relative text-left p-3 rounded-xl border transition-all overflow-hidden w-64 sm:w-auto shrink-0 sm:shrink ${
                isActive
                  ? 'bg-white/[0.12] border-white/40 shadow-[inset_0_1px_0_rgba(255,255,255,0.35),0_8px_24px_rgba(0,0,0,0.5)]'
                  : 'bg-white/[0.025] border-white/[0.06] hover:bg-white/[0.06] hover:border-white/[0.14]'
              }`}
            >
              {/* Top Progress bar line inside active or past chapter */}
              <div className="absolute top-0 left-0 right-0 h-0.5 bg-white/10">
                <div
                  className={`h-full transition-all duration-300 ${
                    isActive ? 'bg-white shadow-[0_0_8px_rgba(255,255,255,0.8)]' : progressInChapter === 1 ? 'bg-white/30' : 'bg-transparent'
                  }`}
                  style={{ width: `${progressInChapter * 100}%` }}
                />
              </div>

              {/* Header: Part badge and timestamps */}
              <div className="flex items-center justify-between gap-1 mb-1.5 pt-1">
                <span
                  className={`text-[9px] font-mono font-bold px-1.5 py-0.2 rounded uppercase ${
                    isActive
                      ? 'bg-white text-black font-semibold shadow-sm'
                      : 'bg-white/[0.06] text-white/60 border border-white/[0.08]'
                  }`}
                >
                  Part {ch.chapter_number}
                </span>

                <span className="text-[10px] font-mono text-white/50 tabular-nums flex items-center gap-1">
                  <Clock className="size-2.5" />
                  {formatTime(ch.start_time)} - {formatTime(ch.end_time)}
                </span>
              </div>

              {/* Chapter Title */}
              <h4
                className={`text-xs font-semibold leading-snug line-clamp-1 ${
                  isActive ? 'text-white' : 'text-white/80'
                }`}
              >
                {ch.title}
              </h4>

              {/* Concept Tags */}
              <div className="mt-2 flex flex-wrap gap-1">
                {ch.key_topics.slice(0, 2).map((top, idx) => (
                  <span
                    key={idx}
                    className="text-[9px] font-mono text-white/60 bg-white/[0.04] px-1.5 py-0.5 rounded border border-white/[0.06]"
                  >
                    #{top}
                  </span>
                ))}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
