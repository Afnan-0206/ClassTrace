'use client';

import React, { useState, useRef, useEffect } from 'react';
import { TranscriptSegment } from '@/types';
import { formatTime } from '@/lib/api';
import { FileText, Play, Search, Clock, User, Bookmark, Check } from 'lucide-react';

interface TranscriptViewerProps {
  segments: TranscriptSegment[];
  currentTime: number;
  onJumpToTimestamp: (timestamp: number, endTime?: number) => void;
  bookmarkedIds?: Set<string>;
  onToggleBookmark?: (segment: TranscriptSegment) => void;
}

export const TranscriptViewer: React.FC<TranscriptViewerProps> = ({
  segments,
  currentTime,
  onJumpToTimestamp,
  bookmarkedIds = new Set(),
  onToggleBookmark,
}) => {
  const [filterQuery, setFilterQuery] = useState('');
  const activeSegmentRef = useRef<HTMLDivElement | null>(null);

  const filteredSegments = segments.filter((seg) =>
    seg.transcript.toLowerCase().includes(filterQuery.toLowerCase())
  );

  return (
    <div className="surface-panel bg-white/[0.035] backdrop-blur-2xl border border-white/[0.08] shadow-[inset_0_1px_0_rgba(255,255,255,0.2)] rounded-2xl p-4 flex flex-col h-full max-h-[560px]">
      {/* Header & Filter Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/[0.08]">
        <div>
          <h3 className="text-xs font-semibold text-white uppercase tracking-wider flex items-center gap-1.5 font-display">
            <FileText className="size-3.5 text-white" />
            Original Lecture Transcript
          </h3>
          <p className="text-[11px] text-white/50 mt-0.5 font-mono">
            {segments.length} verified timestamped passages
          </p>
        </div>

        <div className="relative">
          <Search className="size-3.5 text-white/40 absolute left-2.5 top-2.5" />
          <input
            type="text"
            value={filterQuery}
            onChange={(e) => setFilterQuery(e.target.value)}
            placeholder="Search transcript..."
            className="w-full sm:w-48 h-8 pl-8 pr-3 text-xs bg-white/[0.04] border border-white/[0.08] focus:border-white/30 focus:outline-none rounded-lg text-white placeholder:text-white/40 font-normal transition-colors"
          />
        </div>
      </div>

      {/* Segments List with Word Karaoke */}
      <div className="flex-1 overflow-y-auto space-y-2 pt-3 pr-1 custom-scrollbar">
        {filteredSegments.length === 0 ? (
          <div className="p-6 text-center text-xs text-white/50">
            No transcript passages matching &ldquo;{filterQuery}&rdquo;
          </div>
        ) : (
          filteredSegments.map((seg) => {
            const isCurrentlyPlaying =
              currentTime >= seg.start_time && currentTime <= seg.end_time;
            const isBookmarked = bookmarkedIds.has(seg.id);

            const words = seg.words || seg.transcript.split(' ').map((w, i, arr) => ({
              word: w,
              start: seg.start_time + (i / arr.length) * (seg.end_time - seg.start_time),
              end: seg.start_time + ((i + 1) / arr.length) * (seg.end_time - seg.start_time),
            }));

            return (
              <div
                key={seg.id}
                ref={isCurrentlyPlaying ? activeSegmentRef : null}
                onClick={() => onJumpToTimestamp(seg.start_time, seg.end_time)}
                className={`group p-3 rounded-xl border cursor-pointer transition-all ${
                  isCurrentlyPlaying
                    ? 'bg-white/[0.12] border-white/40 shadow-[inset_0_1px_0_rgba(255,255,255,0.35),0_4px_20px_rgba(0,0,0,0.5)]'
                    : 'bg-white/[0.025] border-white/[0.06] hover:border-white/[0.15] hover:bg-white/[0.06]'
                }`}
              >
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <div className="flex items-center gap-2">
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-medium tabular-nums ${
                        isCurrentlyPlaying
                          ? 'bg-white text-black font-bold'
                          : 'bg-white/[0.06] text-white/70 border border-white/[0.08] group-hover:bg-white/[0.1]'
                      }`}
                    >
                      <Clock className="size-2.5" />
                      {formatTime(seg.start_time)} – {formatTime(seg.end_time)}
                    </span>

                    {seg.speaker && (
                      <span className="text-[11px] text-white/50 flex items-center gap-1">
                        <User className="size-2.5 text-white/40" />
                        {seg.speaker}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1">
                    {onToggleBookmark && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onToggleBookmark(seg);
                        }}
                        title={isBookmarked ? 'Remove bookmark' : 'Bookmark passage'}
                        className={`p-1 rounded text-white/40 hover:text-white transition-colors ${
                          isBookmarked ? 'text-white' : 'opacity-0 group-hover:opacity-100'
                        }`}
                      >
                        <Bookmark className={`size-3 ${isBookmarked ? 'fill-current text-white' : ''}`} />
                      </button>
                    )}

                    <span className="size-6 rounded-lg bg-white/[0.06] border border-white/[0.08] flex items-center justify-center text-white/60 group-hover:text-black group-hover:bg-white transition-colors">
                      <Play className="size-2.5 fill-current ml-0.5" />
                    </span>
                  </div>
                </div>

                {/* Word Highlight */}
                <p className="text-xs sm:text-[13px] text-white/80 leading-relaxed font-normal">
                  {words.map((w, wIdx) => {
                    const isWordActive =
                      isCurrentlyPlaying &&
                      currentTime >= w.start &&
                      currentTime <= w.end;

                    return (
                      <span
                        key={wIdx}
                        className={`transition-colors rounded px-0.5 ${
                          isWordActive
                            ? 'bg-white text-black font-semibold'
                            : 'hover:text-white'
                        }`}
                      >
                        {w.word}{' '}
                      </span>
                    );
                  })}
                </p>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default TranscriptViewer;
