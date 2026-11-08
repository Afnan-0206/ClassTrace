'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Radio,
  Activity,
  UploadCloud,
  Bookmark,
  Menu,
  X,
  Keyboard,
  Settings2,
} from 'lucide-react';
import { ConfigStatus } from '@/types';
import { ClassTraceLogo } from '@/components/ClassTraceLogo';

interface HeaderProps {
  config: ConfigStatus | null;
  bookmarkCount?: number;
  onOpenLiveRecord?: () => void;
  onOpenUpload: () => void;
  onOpenBenchmark: () => void;
  onOpenStudyKit: () => void;
  onOpenShortcuts?: () => void;
  onOpenAdjustGlass?: () => void;
  isGlassOpen?: boolean;
  sidebarOpen?: boolean;
  onToggleSidebar?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  config,
  bookmarkCount = 0,
  onOpenLiveRecord,
  onOpenUpload,
  onOpenBenchmark,
  onOpenStudyKit,
  onOpenShortcuts,
  onOpenAdjustGlass,
  isGlassOpen,
  sidebarOpen,
  onToggleSidebar,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="border-b border-white/[0.08] bg-black/40 backdrop-blur-2xl sticky top-0 z-40 shrink-0 font-sans">
      <div className="max-w-7xl mx-auto px-3 sm:px-5 lg:px-6 h-14 flex items-center justify-between gap-3">
        {/* Left: Sidebar Toggle + Clean Brand Identity */}
        <div className="flex items-center gap-2.5 sm:gap-3">
          {onToggleSidebar && (
            <button
              type="button"
              onClick={onToggleSidebar}
              title={sidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
              className="lg:hidden p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/[0.08] transition-colors"
            >
              <Menu className="size-4" />
            </button>
          )}

          <Link href="/" className="flex items-center">
            <ClassTraceLogo size="sm" variant="compact" />
          </Link>

          {/* Primary Model Integration: Prisma v2.5 STT */}
          <div className="hidden xl:flex items-center gap-2 px-2.5 py-1 rounded-full bg-white/[0.04] border border-white/[0.1] text-[10px] font-mono text-white/70 shadow-sm">
            <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-white font-medium">Prisma v2.5 STT Active</span>
            <span className="text-white/30">•</span>
            <span className="text-white/50">Experimental: Timbre & Evon</span>
          </div>
        </div>

        {/* Right Actions Toolbar */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Study Kit Button */}
          <button
            type="button"
            onClick={onOpenStudyKit}
            title="Open Study Kit"
            className="btn-press h-8 flex items-center gap-1.5 px-2.5 sm:px-3 rounded-lg text-xs font-medium text-slate-300 hover:text-white bg-white/[0.04] hover:bg-white/[0.09] border border-white/[0.1] hover:border-white/[0.2] transition-colors shadow-sm"
          >
            <Bookmark className={`size-3.5 ${bookmarkCount > 0 ? 'text-white fill-current' : 'text-slate-400'}`} />
            <span className="hidden sm:inline">Study Kit</span>
            {bookmarkCount > 0 && (
              <span className="font-mono text-[10px] bg-white/20 text-white px-1.5 py-0.2 rounded-full border border-white/30 tabular-nums font-semibold">
                {bookmarkCount}
              </span>
            )}
          </button>

          {/* Benchmark Button */}
          <button
            type="button"
            onClick={onOpenBenchmark}
            title="Run Benchmark"
            className="btn-press h-8 hidden sm:flex items-center gap-1.5 px-2.5 sm:px-3 rounded-lg text-xs font-medium text-slate-300 hover:text-white bg-white/[0.04] hover:bg-white/[0.09] border border-white/[0.1] hover:border-white/[0.2] transition-colors shadow-sm"
          >
            <Activity className="size-3.5 text-white" />
            <span>Benchmark</span>
          </button>

          {/* Adjust Glass Material */}
          {onOpenAdjustGlass && (
            <button
              type="button"
              onClick={onOpenAdjustGlass}
              title="Adjust crystal glass appearance"
              aria-expanded={isGlassOpen}
              className={`btn-press h-8 flex items-center gap-1.5 px-2.5 sm:px-3 rounded-lg text-xs font-medium border transition-colors shadow-sm ${
                isGlassOpen
                  ? 'bg-white/20 text-white border-white/50 shadow-white/10'
                  : 'text-slate-300 hover:text-white bg-white/[0.04] hover:bg-white/[0.09] border-white/[0.1] hover:border-white/[0.2]'
              }`}
            >
              <Settings2 className="size-3.5 text-white" />
              <span className="hidden md:inline">Adjust Glass</span>
            </button>
          )}

          {/* Keyboard Shortcuts Helper */}
          {onOpenShortcuts && (
            <button
              type="button"
              onClick={onOpenShortcuts}
              title="Keyboard shortcuts"
              className="btn-press h-8 hidden lg:flex items-center justify-center p-2 rounded-lg text-slate-300 hover:text-white bg-white/[0.04] hover:bg-white/[0.09] border border-white/[0.1] transition-colors"
            >
              <Keyboard className="size-3.5" />
            </button>
          )}

          {/* Upload Action */}
          <button
            type="button"
            onClick={onOpenUpload}
            title="Upload audio recording (.wav, .mp3, .m4a)"
            className="btn-press h-8 flex items-center gap-1.5 px-2.5 sm:px-3 rounded-lg text-xs font-medium text-slate-300 hover:text-white bg-white/[0.04] hover:bg-white/[0.09] border border-white/[0.1] hover:border-white/[0.2] transition-colors shadow-sm"
          >
            <UploadCloud className="size-3.5 text-slate-400" />
            <span className="hidden md:inline">Upload</span>
          </button>

          {/* Record Class Primary Action */}
          {onOpenLiveRecord && (
            <button
              type="button"
              onClick={onOpenLiveRecord}
              title="Record live class"
              className="btn-press h-8 flex items-center gap-1.5 px-3 rounded-lg text-xs font-semibold text-rose-200 bg-rose-950/70 hover:bg-rose-900 border border-rose-800/80 transition-colors shadow-sm"
            >
              <Radio className="size-3 text-rose-400 animate-pulse" />
              <span>Record Class</span>
            </button>
          )}

          {/* Mobile Menu Toggle */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="sm:hidden p-1.5 rounded-lg text-white/60 hover:text-white hover:bg-white/[0.08] transition-colors"
          >
            {mobileMenuOpen ? <X className="size-4" /> : <Menu className="size-4" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="sm:hidden p-3 border-t border-white/[0.08] bg-black/90 backdrop-blur-3xl grid grid-cols-2 gap-2 animate-in fade-in duration-150">
          <button
            type="button"
            onClick={() => {
              setMobileMenuOpen(false);
              onOpenBenchmark();
            }}
            className="flex items-center justify-center gap-1.5 p-2 rounded-xl bg-white/[0.04] border border-white/[0.08] text-xs text-white"
          >
            <Activity className="size-3.5 text-white" />
            <span>Benchmark</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setMobileMenuOpen(false);
              onOpenStudyKit();
            }}
            className="flex items-center justify-center gap-1.5 p-2 rounded-xl bg-white/[0.04] border border-white/[0.08] text-xs text-white"
          >
            <Bookmark className="size-3.5 text-white" />
            <span>Study Kit ({bookmarkCount})</span>
          </button>
        </div>
      )}
    </header>
  );
};
