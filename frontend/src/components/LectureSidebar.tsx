'use client';

import React, { useState, useMemo } from 'react';
import { Lecture } from '@/types';
import { formatTime } from '@/lib/api';
import {
  BookOpen,
  Clock,
  FileAudio,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Radio,
  Search,
  MoreVertical,
  Share2,
  Copy,
  ChevronLeft,
  ChevronRight,
  Calendar,
  Check,
} from 'lucide-react';

interface LectureSidebarProps {
  lectures: Lecture[];
  selectedLectureId: string | null;
  onSelectLecture: (id: string) => void;
  onOpenLiveRecord?: () => void;
  onOpenUpload: () => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  onShareLecture?: (lectureId: string) => void;
}

export const LectureSidebar: React.FC<LectureSidebarProps> = ({
  lectures,
  selectedLectureId,
  onSelectLecture,
  onOpenLiveRecord,
  onOpenUpload,
  isCollapsed = false,
  onToggleCollapse,
  onShareLecture,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const filteredLectures = useMemo(() => {
    if (!searchQuery.trim()) return lectures;
    const q = searchQuery.toLowerCase();
    return lectures.filter(
      (l) =>
        l.title.toLowerCase().includes(q) ||
        (l.language_detected && l.language_detected.toLowerCase().includes(q))
    );
  }, [lectures, searchQuery]);

  const handleCopyId = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    navigator.clipboard.writeText(id);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1800);
    setActiveMenuId(null);
  };

  const handleShare = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (onShareLecture) onShareLecture(id);
    setActiveMenuId(null);
  };

  // If collapsed on desktop
  if (isCollapsed) {
    return (
      <aside className="hidden lg:flex w-14 shrink-0 flex-col items-center py-3 border-r border-white/[0.08] bg-black/35 backdrop-blur-2xl h-full transition-all">
        <button
          type="button"
          onClick={onToggleCollapse}
          title="Expand sidebar"
          className="p-2 rounded-lg text-white/60 hover:text-white hover:bg-white/[0.08] transition-colors mb-4"
        >
          <ChevronRight className="size-4" />
        </button>

        <div className="flex flex-col items-center gap-2 overflow-y-auto flex-1 w-full px-2 custom-scrollbar">
          {lectures.map((lec) => {
            const isSelected = lec.id === selectedLectureId;
            return (
              <button
                key={lec.id}
                type="button"
                onClick={() => onSelectLecture(lec.id)}
                title={`${lec.title} (${formatTime(lec.duration_seconds)})`}
                className={`size-10 rounded-xl flex items-center justify-center transition-all ${
                  isSelected
                    ? 'bg-white/[0.12] text-white border border-white/30 shadow-[inset_0_1px_0_rgba(255,255,255,0.3)]'
                    : 'text-white/60 hover:text-white hover:bg-white/[0.06] border border-transparent'
                }`}
              >
                <BookOpen className="size-4" />
              </button>
            );
          })}
        </div>
      </aside>
    );
  }

  return (
    <aside className="lecture-rail w-full lg:w-72 shrink-0 lg:border-r border-white/[0.08] bg-black/35 backdrop-blur-2xl flex flex-col h-auto lg:h-[calc(100vh-3.5rem)] transition-all">
      {/* Top Header: Title, Count, Collapse Toggle & Quick Search */}
      <div className="p-3 border-b border-white/[0.08] flex flex-col gap-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BookOpen className="size-4 text-white" />
            <span className="text-xs font-semibold uppercase tracking-wider text-white font-display">
              Lecture Library
            </span>
            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-white/[0.07] text-white/80 border border-white/[0.08]">
              {lectures.length}
            </span>
          </div>

          {onToggleCollapse && (
            <button
              type="button"
              onClick={onToggleCollapse}
              title="Collapse sidebar"
              className="hidden lg:flex p-1 rounded-md text-white/60 hover:text-white hover:bg-white/[0.08] transition-colors"
            >
              <ChevronLeft className="size-3.5" />
            </button>
          )}
        </div>

        {/* Live Search Filter */}
        <div className="relative">
          <Search className="size-3.5 text-white/40 absolute left-2.5 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search lectures..."
            className="w-full h-8 pl-8 pr-2.5 text-xs bg-white/[0.04] border border-white/[0.08] focus:border-white/30 focus:outline-none rounded-lg text-white placeholder:text-white/40 transition-colors"
          />
        </div>
      </div>

      {/* Lectures List */}
      <div className="lecture-list flex-1 overflow-y-auto p-2.5 space-y-1.5 custom-scrollbar">
        {filteredLectures.length === 0 ? (
          <div className="p-4 text-center text-xs text-white/50">
            No lectures matching &ldquo;{searchQuery}&rdquo;
          </div>
        ) : (
          filteredLectures.map((lec) => {
            const isSelected = lec.id === selectedLectureId;
            const isCompleted = lec.status === 'COMPLETED';
            const isFailed = lec.status === 'FAILED';
            const isProcessing = lec.status === 'PROCESSING' || lec.status === 'PENDING';
            const isDemo = lec.id === '00000000-0000-4000-a000-000000000001';
            const isMenuOpen = activeMenuId === lec.id;

            return (
              <div
                key={lec.id}
                onClick={() => onSelectLecture(lec.id)}
                className={`group relative p-2.5 rounded-xl border cursor-pointer transition-all ${
                  isSelected
                    ? 'bg-white/[0.1] border-white/30 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.35)]'
                    : 'bg-white/[0.03] border-white/[0.07] text-white/80 hover:bg-white/[0.06] hover:border-white/[0.15]'
                }`}
              >
                {/* Active Pill Indicator Bar */}
                {isSelected && (
                  <span className="absolute left-0 top-3 bottom-3 w-1 bg-white rounded-r shadow-[0_0_8px_rgba(255,255,255,0.8)]" />
                )}

                <div className="flex items-start justify-between gap-1.5 pl-1.5">
                  <h3
                    className={`text-xs font-medium leading-snug line-clamp-2 ${
                      isSelected ? 'text-white font-semibold' : 'text-white/90'
                    }`}
                  >
                    {lec.title}
                  </h3>

                  {/* Status icon & Context Menu Trigger */}
                  <div className="flex items-center gap-1 shrink-0 mt-0.5">
                    {isCompleted && <CheckCircle2 className="size-3 text-emerald-400" />}
                    {isProcessing && <Loader2 className="size-3 text-sky-400 animate-spin" />}
                    {isFailed && <AlertCircle className="size-3 text-rose-400" />}

                    <div className="relative">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveMenuId(isMenuOpen ? null : lec.id);
                        }}
                        className="p-1 rounded text-white/40 hover:text-white opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <MoreVertical className="size-3" />
                      </button>

                      {/* Dropdown Menu */}
                      {isMenuOpen && (
                        <div
                          className="absolute right-0 top-full mt-1 z-30 w-36 rounded-xl bg-black/90 backdrop-blur-3xl border border-white/[0.14] shadow-2xl p-1 text-[11px]"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            type="button"
                            onClick={(e) => handleShare(e, lec.id)}
                            className="w-full flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-left text-white/80 hover:bg-white/[0.08] hover:text-white transition-colors"
                          >
                            <Share2 className="size-3 text-white" />
                            <span>Share Link</span>
                          </button>
                          <button
                            type="button"
                            onClick={(e) => handleCopyId(e, lec.id)}
                            className="w-full flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-left text-white/80 hover:bg-white/[0.08] hover:text-white transition-colors"
                          >
                            {copiedId === lec.id ? (
                              <Check className="size-3 text-emerald-400" />
                            ) : (
                              <Copy className="size-3 text-white/40" />
                            )}
                            <span>{copiedId === lec.id ? 'Copied ID' : 'Copy ID'}</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Sub-meta */}
                <div className="mt-2 flex items-center justify-between text-[10px] text-white/50 font-mono pl-1.5">
                  <span className="flex items-center gap-1">
                    <Clock className="size-2.5 text-white/40" />
                    {formatTime(lec.duration_seconds)}
                  </span>

                  <span className="flex items-center gap-1">
                    <FileAudio className="size-2.5 text-white/40" />
                    {lec.segment_count || 0} passages
                  </span>
                </div>

                {isDemo && (
                  <div className="mt-1.5 ml-1.5 inline-flex items-center gap-1 px-1.5 py-0.2 rounded text-[9px] font-mono text-white/90 bg-white/[0.06] border border-white/[0.12]">
                    <span>Hinglish DSA • Demo</span>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Bottom Actions: Quick Record / Upload */}
      <div className="p-2.5 border-t border-white/[0.08] bg-transparent flex flex-col gap-2">
        {onOpenLiveRecord && (
          <button
            type="button"
            onClick={onOpenLiveRecord}
            className="w-full flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs font-semibold transition-colors shadow-sm"
          >
            <Radio className="size-3 text-rose-400 animate-pulse" />
            <span>Record Live Class</span>
          </button>
        )}
      </div>
    </aside>
  );
};
