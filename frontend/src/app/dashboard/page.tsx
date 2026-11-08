'use client';

import React, { useState, useEffect, useRef, useId } from 'react';
import { gsap } from 'gsap';
import { useGSAP } from '@gsap/react';
import { Header } from '@/components/Header';
import { LectureSidebar } from '@/components/LectureSidebar';
import { VoiceSearch, ContextMomentAnchor } from '@/components/VoiceSearch';
import { SearchResults } from '@/components/SearchResults';
import { AudioPlayer, RelevanceMarker } from '@/components/AudioPlayer';
import { TranscriptViewer } from '@/components/TranscriptViewer';
import { LectureChapters } from '@/components/LectureChapters';
import { UploadModal } from '@/components/UploadModal';
import { LiveClassRecorderModal } from '@/components/LiveClassRecorderModal';
import { BenchmarkModal } from '@/components/BenchmarkModal';
import { StudyKitModal } from '@/components/StudyKitModal';
import { ShortcutsModal } from '@/components/ShortcutsModal';
import { ToastProvider, useToast } from '@/components/ui/toast';
import { fetchConfigStatus, fetchLectures, fetchLectureDetail, formatTime, searchByText } from '@/lib/api';
import { Lecture, ConfigStatus, SearchResponse, BookmarkItem, SearchResultSegment, TranscriptSegment } from '@/types';
import {
  Clock,
  FileAudio,
  Play,
  Share2,
  Check,
  Globe,
  Settings2,
  X,
  Layers,
  Sparkles,
} from 'lucide-react';

gsap.registerPlugin(useGSAP);

const LOCAL_STORAGE_KEY = 'classtrace_study_kit_v1';
const SIDEBAR_COLLAPSE_KEY = 'classtrace_sidebar_collapsed';
const GLASS_SETTINGS_KEY = 'classtrace_glass_settings_crystal_v2';

export type GlassSettings = {
  blur: number;
  opacity: number;
  saturation: number;
  tint: string;
  edge: number;
};

// Pure Crystal Clear Glass Default
const DEFAULT_GLASS: GlassSettings = {
  blur: 24,
  opacity: 0.18,
  saturation: 1.1,
  tint: '#ffffff',
  edge: 0.85,
};

const GLASS_PRESETS = [
  { name: 'Crystal Clear', value: { blur: 24, opacity: 0.18, saturation: 1.1, edge: 0.85, tint: '#ffffff' } },
  { name: 'Ultra Pure Glass', value: { blur: 12, opacity: 0.12, saturation: 1.05, edge: 0.95, tint: '#f8fafc' } },
  { name: 'Liquid Silver', value: { blur: 28, opacity: 0.24, saturation: 1.15, edge: 0.75, tint: '#e2e8f0' } },
  { name: 'Smoked Quartz', value: { blur: 32, opacity: 0.42, saturation: 1.0, edge: 0.6, tint: '#1e1e1e' } },
];

function DashboardContent() {
  const { success, info } = useToast();
  const rootRef = useRef<HTMLDivElement>(null);
  const mainRef = useRef<HTMLElement>(null);
  const materialId = useId().replace(/:/g, '');

  const [config, setConfig] = useState<ConfigStatus | null>(null);
  const [lectures, setLectures] = useState<Lecture[]>([]);
  const [selectedLecture, setSelectedLecture] = useState<Lecture | null>(null);
  const [searchResponse, setSearchResponse] = useState<SearchResponse | null>(null);
  const [isSearchLoading, setIsSearchLoading] = useState(false);
  const [isLectureLoading, setIsLectureLoading] = useState(true);

  // Audio Playback state
  const [jumpTimestamp, setJumpTimestamp] = useState<number | null>(null);
  const [snippetEndTimestamp, setSnippetEndTimestamp] = useState<number | null>(null);
  const [currentPlaybackTime, setCurrentPlaybackTime] = useState<number>(0);
  const [activeSegmentId, setActiveSegmentId] = useState<string | null>(null);

  // Study Kit Bookmarks
  const [bookmarks, setBookmarks] = useState<BookmarkItem[]>([]);
  const [isStudyKitOpen, setIsStudyKitOpen] = useState(false);

  // Multi-turn conversational follow-up context
  const [contextMoment, setContextMoment] = useState<ContextMomentAnchor | null>(null);

  // Sidebar collapse state
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  // Crystal Clear Glass settings
  const [glass, setGlass] = useState<GlassSettings>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem(GLASS_SETTINGS_KEY);
        if (saved) return JSON.parse(saved);
      } catch {}
    }
    return DEFAULT_GLASS;
  });
  const [isAdjustGlassOpen, setIsAdjustGlassOpen] = useState(false);

  // Modals
  const [isLiveRecordOpen, setIsLiveRecordOpen] = useState(false);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isBenchmarkOpen, setIsBenchmarkOpen] = useState(false);
  const [isShortcutsOpen, setIsShortcutsOpen] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // Update Glass Settings
  const updateGlass = (patch: Partial<GlassSettings>) => {
    setGlass((prev) => {
      const next = { ...prev, ...patch };
      try {
        localStorage.setItem(GLASS_SETTINGS_KEY, JSON.stringify(next));
      } catch {}
      return next;
    });
  };

  // GSAP Smooth Fluid Entrance Animation
  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add('(prefers-reduced-motion: no-preference)', () => {
        const panels = mainRef.current?.querySelectorAll('.gw-reveal');
        if (!panels?.length) return;
        gsap.fromTo(
          panels,
          { y: 12, opacity: 0.35, filter: 'blur(4px)' },
          {
            y: 0,
            opacity: 1,
            filter: 'blur(0px)',
            duration: 0.45,
            stagger: 0.04,
            ease: 'power3.out',
            clearProps: 'transform,opacity,filter',
          }
        );
      });
      return () => mm.revert();
    },
    { scope: mainRef, dependencies: [selectedLecture?.id] }
  );

  // Load Bookmarks and Sidebar preference from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (saved) setBookmarks(JSON.parse(saved));
      const savedCollapse = localStorage.getItem(SIDEBAR_COLLAPSE_KEY);
      if (savedCollapse) setIsSidebarCollapsed(savedCollapse === 'true');
    } catch (e) {
      console.error('Failed to load storage prefs:', e);
    }
  }, []);

  const toggleSidebar = () => {
    setIsSidebarCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(SIDEBAR_COLLAPSE_KEY, String(next));
      } catch {}
      return next;
    });
  };

  const saveBookmarks = (items: BookmarkItem[]) => {
    setBookmarks(items);
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(items));
    } catch (e) {
      console.error('Failed to save bookmarks:', e);
    }
  };

  const handleToggleBookmark = (item: SearchResultSegment | TranscriptSegment) => {
    const exists = bookmarks.some((b) => b.id === item.id);
    if (exists) {
      saveBookmarks(bookmarks.filter((b) => b.id !== item.id));
      info('Removed from Study Kit');
    } else {
      const newBookmark: BookmarkItem = {
        id: item.id,
        lecture_id: item.lecture_id,
        lecture_title: selectedLecture?.title || 'Classroom Lecture',
        start_time: item.start_time,
        end_time: item.end_time,
        transcript: item.transcript,
        speaker: item.speaker,
        created_at: new Date().toISOString(),
      };
      saveBookmarks([newBookmark, ...bookmarks]);
      success('Saved to Study Kit', `${formatTime(item.start_time)} - ${formatTime(item.end_time)}`);
    }
  };

  const handleRemoveBookmark = (id: string) => {
    saveBookmarks(bookmarks.filter((b) => b.id !== id));
    info('Removed from Study Kit');
  };

  const handleBookmarkCurrentAudio = (time: number) => {
    if (!selectedLecture) return;
    const currentSegment = selectedLecture.segments?.find(
      (s) => time >= s.start_time && time <= s.end_time
    );

    if (currentSegment) {
      handleToggleBookmark(currentSegment);
    } else {
      const customId = `custom-${Date.now()}`;
      const newBookmark: BookmarkItem = {
        id: customId,
        lecture_id: selectedLecture.id,
        lecture_title: selectedLecture.title,
        start_time: time,
        end_time: Math.min(time + 20, selectedLecture.duration_seconds),
        transcript: `Timestamp Moment at ${formatTime(time)}`,
        created_at: new Date().toISOString(),
      };
      saveBookmarks([newBookmark, ...bookmarks]);
      success('Moment Bookmarked', `Saved timestamp ${formatTime(time)} into Study Kit`);
    }
  };

  const bookmarkedIds = new Set(bookmarks.map((b) => b.id));

  // Load initial data and parse URL search params
  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    setIsLectureLoading(true);
    try {
      const cfg = await fetchConfigStatus();
      setConfig(cfg);
    } catch (e) {
      console.error('Config fetch failed:', e);
    }

    try {
      const lecs = await fetchLectures();
      setLectures(lecs || []);
      if (Array.isArray(lecs) && lecs.length > 0) {
        const params = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
        const urlLectureId = params?.get('lecture');
        const urlTime = params?.get('t') ? parseFloat(params.get('t')!) : null;
        const urlEnd = params?.get('end') ? parseFloat(params.get('end')!) : null;
        const urlQuery = params?.get('q');
        const action = params?.get('action');

        if (action === 'record') {
          setIsLiveRecordOpen(true);
        } else if (action === 'benchmark') {
          setIsBenchmarkOpen(true);
        }

        const targetLec =
          (urlLectureId && lecs.find((l) => l.id === urlLectureId)) ||
          lecs.find((l) => l.id === '00000000-0000-4000-a000-000000000001') ||
          lecs[0];

        if (targetLec) {
          await handleSelectLecture(targetLec.id);
        }

        if (urlTime !== null) {
          handlePlayTimestamp(urlTime, urlEnd || undefined);
        }

        if (urlQuery) {
          setIsSearchLoading(true);
          searchByText(urlQuery, targetLec.id)
            .then((res) => handleSearchComplete(res))
            .catch(() => {})
            .finally(() => setIsSearchLoading(false));
        }
      }
    } catch (e) {
      console.error('Lectures fetch failed:', e);
    } finally {
      setIsLectureLoading(false);
    }
  };

  const handleSelectLecture = async (lectureId: string) => {
    try {
      const detail = await fetchLectureDetail(lectureId);
      if (detail) {
        setSelectedLecture(detail);
        setSearchResponse(null);
      }

      if (typeof window !== 'undefined') {
        const url = new URL(window.location.href);
        url.searchParams.set('lecture', lectureId);
        window.history.replaceState({}, '', url.toString());
      }
    } catch (e) {
      console.error('Failed to load lecture detail:', e);
    }
  };

  const handleSearchComplete = (response: SearchResponse) => {
    setSearchResponse(response);
    if (response.results && response.results.length > 0) {
      const top = response.results[0];
      handlePlayTimestamp(top.start_time, top.end_time);
      success('Retrieved Grounded Moment', `Found #${1} match with ${Math.round(top.score * 100)}% accuracy`);
    } else {
      info('No Exact Explanation Found', 'Playing teacher evidence only — zero hallucinations');
    }
  };

  const handlePlayTimestamp = (startTime: number, endTime?: number) => {
    setJumpTimestamp(startTime);
    setSnippetEndTimestamp(endTime || null);

    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      url.searchParams.set('t', startTime.toFixed(1));
      if (endTime) url.searchParams.set('end', endTime.toFixed(1));
      window.history.replaceState({}, '', url.toString());
    }

    if (selectedLecture?.segments) {
      const found = selectedLecture.segments.find(
        (s) => Math.abs(s.start_time - startTime) < 1.0
      );
      if (found) setActiveSegmentId(found.id);
    }
  };

  const handleUploadSuccess = (newLecture: Lecture) => {
    setLectures((prev) => [newLecture, ...prev]);
    handleSelectLecture(newLecture.id);
    success('Lecture Indexed Successfully', `${newLecture.title} is now searchable`);
  };

  const handleShareCurrentLecture = () => {
    if (typeof window === 'undefined') return;
    const url = new URL(window.location.href);
    if (selectedLecture) url.searchParams.set('lecture', selectedLecture.id);
    url.searchParams.set('t', currentPlaybackTime.toFixed(1));

    navigator.clipboard.writeText(url.toString());
    setCopiedLink(true);
    success('Copied Deep Link', 'Timestamp URL copied to clipboard');
    setTimeout(() => setCopiedLink(false), 2000);
  };

  // Convert search results into scrubber relevance markers
  const relevanceMarkers: RelevanceMarker[] =
    searchResponse?.results?.map((res, i) => ({
      start: res.start_time,
      end: res.end_time,
      rank: i + 1,
      label: res.transcript.slice(0, 30) + '...',
    })) || [];

  return (
    <div
      ref={rootRef}
      className="gw-root app-shell h-screen max-h-screen text-[#F8FAFC] flex flex-col w-full max-w-full overflow-hidden relative select-none font-sans"
      style={
        {
          '--gw-blur': `${glass.blur}px`,
          '--gw-opacity': glass.opacity,
          '--gw-saturation': glass.saturation,
          '--gw-tint': glass.tint,
          '--gw-edge': glass.edge,
        } as React.CSSProperties
      }
    >
      <style>{CRYSTAL_GLASS_STYLES}</style>

      {/* Crystal Glass Ambient Depth Overlay */}
      <div className="gw-room-shade fixed inset-0 z-0 bg-[#030407]/40 backdrop-blur-[1px] pointer-events-none" aria-hidden="true" />

      {/* Main Workspace Frame */}
      <div className="relative z-10 flex flex-col h-full w-full overflow-hidden">
        {/* Top Liquid Glass Navigation Header */}
        <div className="gw-glass shrink-0 border-b border-white/[0.08]">
          <Header
            config={config}
            bookmarkCount={bookmarks.length}
            onOpenLiveRecord={() => setIsLiveRecordOpen(true)}
            onOpenUpload={() => setIsUploadOpen(true)}
            onOpenBenchmark={() => setIsBenchmarkOpen(true)}
            onOpenStudyKit={() => setIsStudyKitOpen(true)}
            onOpenShortcuts={() => setIsShortcutsOpen(true)}
            onOpenAdjustGlass={() => setIsAdjustGlassOpen((prev) => !prev)}
            isGlassOpen={isAdjustGlassOpen}
            sidebarOpen={!isSidebarCollapsed}
            onToggleSidebar={toggleSidebar}
          />
        </div>

        {/* Workspace Body */}
        <div className="workspace-shell flex-1 flex flex-col lg:flex-row max-w-7xl w-full mx-auto overflow-hidden min-h-0 relative border-x border-white/[0.06]">
          {/* Left Sidebar: Lecture Navigation */}
          <div className="gw-sidebar-wrap shrink-0 border-r border-white/[0.08]">
            <LectureSidebar
              lectures={lectures}
              selectedLectureId={selectedLecture?.id || null}
              onSelectLecture={handleSelectLecture}
              onOpenLiveRecord={() => setIsLiveRecordOpen(true)}
              onOpenUpload={() => setIsUploadOpen(true)}
              isCollapsed={isSidebarCollapsed}
              onToggleCollapse={toggleSidebar}
              onShareLecture={handleShareCurrentLecture}
            />
          </div>

          {/* Right Main Content Workspace */}
          <main
            ref={mainRef}
            className="flex-1 min-w-0 p-3 sm:p-4 lg:p-5 overflow-y-auto space-y-3.5 custom-scrollbar relative"
          >
            {/* Lecture Hero Section */}
            {isLectureLoading ? (
              <div className="ct-skeleton h-24 rounded-2xl w-full" />
            ) : selectedLecture ? (
              <div className="gw-panel gw-reveal p-4 sm:p-5 rounded-2xl shadow-sm">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="space-y-1.5 min-w-0 max-w-2xl">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-semibold text-white bg-white/[0.08] border border-white/[0.15] flex items-center gap-1.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.2)]">
                        <span className="size-1.5 rounded-full bg-white animate-pulse" />
                        Active Session
                      </span>
                      <span className="text-xs text-[#94A3B8] flex items-center gap-1">
                        <Globe className="size-3 text-slate-400" />
                        {selectedLecture.language_detected || 'Hinglish (Hindi + English)'}
                      </span>
                    </div>

                    <h1 className="text-base sm:text-xl font-bold tracking-tight text-white truncate font-sans">
                      {selectedLecture.title}
                    </h1>

                    <p className="text-xs text-[#94A3B8] font-mono flex items-center gap-3">
                      <span className="flex items-center gap-1">
                        <Clock className="size-3 text-white/80" />
                        Duration: <strong className="text-white">{formatTime(selectedLecture.duration_seconds)}</strong>
                      </span>
                      <span className="flex items-center gap-1">
                        <FileAudio className="size-3 text-white/80" />
                        Passages: <strong className="text-white">{selectedLecture.segment_count || 0}</strong>
                      </span>
                    </p>
                  </div>

                  {/* Quick Action Header Buttons */}
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => handlePlayTimestamp(0)}
                      className="btn-press flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/[0.08] hover:bg-white/[0.15] text-white border border-white/[0.15] text-xs font-semibold transition-colors shadow-sm"
                    >
                      <Play className="size-3 fill-current text-white" />
                      <span>Play Start</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleShareCurrentLecture}
                      className="btn-press flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/[0.05] hover:bg-white/[0.12] text-[#94A3B8] hover:text-white border border-white/[0.1] text-xs font-medium transition-colors shadow-sm"
                    >
                      {copiedLink ? <Check className="size-3 text-[#34D399]" /> : <Share2 className="size-3" />}
                      <span>{copiedLink ? 'Copied' : 'Share'}</span>
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="gw-panel p-6 text-center text-[#94A3B8] text-sm rounded-2xl">
                Select a lecture from the sidebar to begin searching.
              </div>
            )}

            {/* Interactive Chapter & Concept Map */}
            {selectedLecture?.chapters && (
              <div className="gw-panel gw-reveal p-1 rounded-2xl">
                <LectureChapters
                  chapters={selectedLecture.chapters}
                  currentTime={currentPlaybackTime}
                  onJumpToChapter={handlePlayTimestamp}
                />
              </div>
            )}

            {/* AI-Powered Multilingual Voice & Text Search Interface */}
            <div className="gw-reveal">
              <VoiceSearch
                selectedLectureId={selectedLecture?.id}
                onSearchComplete={handleSearchComplete}
                isLoading={isSearchLoading}
                setIsLoading={setIsSearchLoading}
                contextMoment={contextMoment}
                onClearContextMoment={() => setContextMoment(null)}
              />
            </div>

            {/* Evidence-Grounded Answer Area with Karaoke Highlighting */}
            <div className="gw-reveal">
              <SearchResults
                searchResponse={searchResponse}
                onPlayTimestamp={handlePlayTimestamp}
                activeSegmentId={activeSegmentId}
                currentPlaybackTime={currentPlaybackTime}
                bookmarkedIds={bookmarkedIds}
                onToggleBookmark={handleToggleBookmark}
                onAskFollowUp={(seg) => {
                  setContextMoment({
                    id: seg.id,
                    startTime: seg.start_time,
                    endTime: seg.end_time,
                    label: seg.transcript.length > 50 ? seg.transcript.slice(0, 48) + '...' : seg.transcript,
                  });
                  window.scrollTo({ top: 120, behavior: 'smooth' });
                }}
              />
            </div>

            {/* Full Interactive Transcript Viewer */}
            {selectedLecture?.segments && (
              <div className="gw-reveal">
                <TranscriptViewer
                  segments={selectedLecture.segments}
                  currentTime={currentPlaybackTime}
                  onJumpToTimestamp={handlePlayTimestamp}
                  bookmarkedIds={bookmarkedIds}
                  onToggleBookmark={handleToggleBookmark}
                />
              </div>
            )}

            {/* Benchmark Trigger Bar */}
            <div className="gw-panel gw-reveal rounded-xl border border-white/[0.08] px-4 py-2.5 text-xs text-[#94A3B8] flex items-center justify-between gap-2.5 shadow-sm">
              <span className="text-slate-300 font-medium">Pan-Indic Classroom Intelligence</span>
              <button
                type="button"
                onClick={() => setIsBenchmarkOpen(true)}
                className="text-white hover:text-slate-300 font-semibold text-xs underline underline-offset-4 shrink-0 transition-colors"
              >
                Benchmark Evaluation &rarr;
              </button>
            </div>
          </main>
        </div>

        {/* Sticky Bottom Crystal Glass Audio Player */}
        {selectedLecture && (
          <div className="gw-glass shrink-0 border-t border-white/[0.08]">
            <AudioPlayer
              audioUrl={selectedLecture.audio_url}
              lectureId={selectedLecture.id}
              lectureTitle={selectedLecture.title}
              jumpTimestamp={jumpTimestamp}
              snippetEndTimestamp={snippetEndTimestamp}
              relevanceMarkers={relevanceMarkers}
              peaks={selectedLecture.peaks}
              chapters={selectedLecture.chapters}
              onTimeUpdate={(time) => setCurrentPlaybackTime(time)}
              onJumpToTimestamp={handlePlayTimestamp}
              onBookmarkCurrentTime={handleBookmarkCurrentAudio}
            />
          </div>
        )}
      </div>

      {/* Floating Adjust Glass Material Flyout */}
      {isAdjustGlassOpen && (
        <aside
          className="gw-material gw-glass"
          id={`${materialId}-material`}
          aria-label="Crystal Glass Appearance"
        >
          <div className="gw-material-title">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-white/10 text-white">
                <Settings2 size={16} aria-hidden="true" />
              </span>
              <h2 className="text-sm font-semibold text-white tracking-tight">Crystal Clear Theme</h2>
            </div>
            <button
              type="button"
              className="p-1 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
              aria-label="Close glass settings"
              onClick={() => setIsAdjustGlassOpen(false)}
            >
              <X size={16} aria-hidden="true" />
            </button>
          </div>
          <p className="text-[11px] text-slate-400 mt-1 mb-3">
            Pure crystal refraction, specular light caustics, and neutral translucency.
          </p>

          {/* Live Material Sample Preview */}
          <div className="gw-material-sample" aria-hidden="true">
            <Layers size={22} className="text-white" strokeWidth={1.5} />
            <span className="text-xs font-semibold text-white">Crystal Specular Preview</span>
          </div>

          {/* Preset Buttons */}
          <div className="gw-presets" aria-label="Glass presets">
            {GLASS_PRESETS.map((p) => (
              <button
                key={p.name}
                type="button"
                onClick={() => updateGlass(p.value)}
                className="text-[10px] font-medium transition-colors hover:border-white/50"
              >
                {p.name}
              </button>
            ))}
          </div>

          {/* Dynamic Sliders */}
          <label className="gw-range">
            <span>
              Blur
              <output>{Math.round(glass.blur)} px</output>
            </span>
            <input
              type="range"
              aria-label="Blur"
              min={0}
              max={40}
              step={1}
              value={glass.blur}
              onChange={(e) => updateGlass({ blur: Number(e.target.value) })}
            />
          </label>

          <label className="gw-range">
            <span>
              Opacity
              <output>{Math.round(glass.opacity * 100)}%</output>
            </span>
            <input
              type="range"
              aria-label="Opacity"
              min={0.08}
              max={0.9}
              step={0.01}
              value={glass.opacity}
              onChange={(e) => updateGlass({ opacity: Number(e.target.value) })}
            />
          </label>

          <label className="gw-range">
            <span>
              Saturation
              <output>{Math.round(glass.saturation * 100)}%</output>
            </span>
            <input
              type="range"
              aria-label="Saturation"
              min={0.5}
              max={2}
              step={0.05}
              value={glass.saturation}
              onChange={(e) => updateGlass({ saturation: Number(e.target.value) })}
            />
          </label>

          <label className="gw-range">
            <span>
              Edge Light
              <output>{Math.round(glass.edge * 100)}%</output>
            </span>
            <input
              type="range"
              aria-label="Edge Light"
              min={0}
              max={1}
              step={0.05}
              value={glass.edge}
              onChange={(e) => updateGlass({ edge: Number(e.target.value) })}
            />
          </label>

          <label className="gw-tint">
            <span>Glass Tint</span>
            <input
              type="color"
              value={glass.tint}
              onChange={(e) => updateGlass({ tint: e.target.value })}
            />
          </label>

          <button
            className="gw-reset btn-press"
            type="button"
            onClick={() => updateGlass(DEFAULT_GLASS)}
          >
            Reset Crystal Defaults
          </button>
        </aside>
      )}

      {/* Live Class Recorder Studio Modal */}
      <LiveClassRecorderModal
        isOpen={isLiveRecordOpen}
        onClose={() => setIsLiveRecordOpen(false)}
        onRecordSuccess={handleUploadSuccess}
      />

      {/* Study Kit Modal */}
      <StudyKitModal
        isOpen={isStudyKitOpen}
        onClose={() => setIsStudyKitOpen(false)}
        bookmarks={bookmarks}
        onRemoveBookmark={handleRemoveBookmark}
        onPlayTimestamp={handlePlayTimestamp}
      />

      {/* Upload Modal */}
      <UploadModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        onUploadSuccess={handleUploadSuccess}
      />

      {/* 17-Q Benchmark Modal */}
      <BenchmarkModal
        isOpen={isBenchmarkOpen}
        onClose={() => setIsBenchmarkOpen(false)}
        onSelectQuery={(q) => {
          setIsBenchmarkOpen(false);
          setIsSearchLoading(true);
          if (selectedLecture) {
            searchByText(q, selectedLecture.id)
              .then((res) => handleSearchComplete(res))
              .catch(() => {})
              .finally(() => setIsSearchLoading(false));
          }
        }}
      />

      {/* Keyboard Shortcuts Guide Modal */}
      <ShortcutsModal
        isOpen={isShortcutsOpen}
        onClose={() => setIsShortcutsOpen(false)}
      />
    </div>
  );
}

const CRYSTAL_GLASS_STYLES = `
.gw-root {
  background: #030407;
  color: #F8FAFC;
  isolation: isolate;
}

.gw-glass {
  background: rgba(14, 16, 22, calc(var(--gw-opacity, 0.18) * 100%));
  backdrop-filter: blur(var(--gw-blur, 24px)) saturate(var(--gw-saturation, 1.1));
  -webkit-backdrop-filter: blur(var(--gw-blur, 24px)) saturate(var(--gw-saturation, 1.1));
  box-shadow:
    inset 0 1px 0
      color-mix(
        in srgb,
        #ffffff calc(var(--gw-edge, 0.85) * 50%),
        transparent
      ),
    inset 0 0 0 1px
      color-mix(
        in srgb,
        #ffffff calc(var(--gw-edge, 0.85) * 12%),
        transparent
      ),
    0 24px 60px -25px rgba(0, 0, 0, 0.85);
  position: relative;
}

.gw-glass:before {
  content: "";
  position: absolute;
  inset: 0;
  background: var(--gw-tint, #ffffff);
  opacity: 0.05;
  pointer-events: none;
  border-radius: inherit;
}

.gw-panel {
  background: rgba(255, 255, 255, calc((0.025 + var(--gw-opacity, 0.18) * 0.25) * 100%));
  backdrop-filter: blur(calc(var(--gw-blur, 24px) * 0.9));
  -webkit-backdrop-filter: blur(calc(var(--gw-blur, 24px) * 0.9));
  border-radius: 18px;
  box-shadow:
    inset 0 1px 0
      color-mix(
        in srgb,
        #ffffff calc(var(--gw-edge, 0.85) * 40%),
        transparent
      ),
    0 12px 32px -16px rgba(0, 0, 0, 0.7);
  border: 1px solid rgba(255, 255, 255, 0.09);
  position: relative;
}

.gw-sidebar-wrap aside {
  background: rgba(10, 12, 16, calc(var(--gw-opacity, 0.18) * 100% + 0.1)) !important;
  backdrop-filter: blur(var(--gw-blur, 24px)) saturate(var(--gw-saturation, 1.1));
  -webkit-backdrop-filter: blur(var(--gw-blur, 24px)) saturate(var(--gw-saturation, 1.1));
}

.gw-material {
  position: fixed;
  z-index: 50;
  right: 18px;
  top: 68px;
  width: 310px;
  max-height: calc(100svh - 85px);
  overflow-y: auto;
  scrollbar-width: thin;
  scrollbar-color: rgba(255,255,255,0.2) transparent;
  border-radius: 20px;
  padding: 20px;
  border: 1px solid rgba(255, 255, 255, 0.15);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.4),
    0 24px 70px -15px rgba(0, 0, 0, 0.9);
  animation: gw-material-in 0.22s ease-out;
}

@keyframes gw-material-in {
  from { opacity: 0; transform: translateY(-8px) scale(0.97); }
  to { opacity: 1; transform: translateY(0) scale(1); }
}

.gw-material-title {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.gw-material-sample {
  height: 64px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  border-radius: 12px;
  margin-bottom: 15px;
  background: color-mix(
    in srgb,
    var(--gw-tint, #ffffff) calc(var(--gw-opacity, 0.18) * 100%),
    transparent
  );
  backdrop-filter: blur(var(--gw-blur, 24px));
  box-shadow:
    inset 0 1px 0 color-mix(in srgb, #ffffff calc(var(--gw-edge, 0.85) * 100%), transparent),
    0 10px 20px -15px rgba(0, 0, 0, 0.6);
  border: 1px solid rgba(255, 255, 255, 0.15);
}

.gw-presets {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 6px;
  margin-bottom: 16px;
}

.gw-presets button {
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 8px;
  padding: 6px 8px;
  background: rgba(255, 255, 255, 0.05);
  color: #F8FAFC;
}

.gw-presets button:hover {
  background: rgba(255, 255, 255, 0.12);
}

.gw-range {
  display: block;
  margin: 13px 0;
}

.gw-range > span {
  display: flex;
  justify-content: space-between;
  font-size: 11px;
  color: #94A3B8;
  margin-bottom: 5px;
}

.gw-range output {
  font-family: monospace;
  font-size: 10px;
  color: #FFFFFF;
}

.gw-range input {
  width: 100%;
  accent-color: #FFFFFF;
  height: 14px;
  cursor: pointer;
}

.gw-tint {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 11px;
  color: #94A3B8;
  margin-top: 15px;
}

.gw-tint input {
  height: 26px;
  width: 38px;
  padding: 2px;
  background: none;
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 6px;
  cursor: pointer;
}

.gw-reset {
  width: 100%;
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 8px;
  padding: 7px;
  margin-top: 18px;
  font-size: 11px;
  font-weight: 600;
  color: #CBD5E1;
  background: rgba(255, 255, 255, 0.05);
  transition: all 0.2s;
}

.gw-reset:hover {
  background: rgba(255, 255, 255, 0.14);
  color: #FFFFFF;
}
`;

export default function DashboardPage() {
  return (
    <ToastProvider>
      <DashboardContent />
    </ToastProvider>
  );
}
