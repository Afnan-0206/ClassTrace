'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Radio, X, Mic, Square, Pause, Play, Download, Loader2, AlertCircle, Sparkles, Globe, Check } from 'lucide-react';
import { AudioRecorder } from '@/lib/audioRecorder';
import { recordLiveLecture, formatTime } from '@/lib/api';
import { Lecture, SUPPORTED_LANGUAGES } from '@/types';

interface LiveSegment {
  start_time: number;
  end_time: number;
  transcript: string;
  speaker: string;
}

interface LiveClassRecorderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRecordSuccess: (lecture: Lecture) => void;
}

export const LiveClassRecorderModal: React.FC<LiveClassRecorderModalProps> = ({
  isOpen,
  onClose,
  onRecordSuccess,
}) => {
  const [title, setTitle] = useState('');
  const [languageCode, setLanguageCode] = useState('indic-auto');
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [audioLevel, setAudioLevel] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [liveSegments, setLiveSegments] = useState<LiveSegment[]>([]);
  const [interimText, setInterimText] = useState('');
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);

  const recorderRef = useRef<AudioRecorder | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const speechRecognitionRef = useRef<unknown>(null);
  const segmentStartTimeRef = useRef<number>(0);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameRef = useRef<number | null>(null);

  // Initialize default lecture title with current date & time
  useEffect(() => {
    if (isOpen && !title) {
      const now = new Date();
      const formatted = now.toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
      });
      setTitle(`Live Lecture - ${formatted}`);
    }
  }, [isOpen, title]);

  // Clean up on unmount or close
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      stopSpeechRecognition();
    };
  }, []);

  const stopSpeechRecognition = () => {
    try {
      if (speechRecognitionRef.current) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (speechRecognitionRef.current as any).stop();
        speechRecognitionRef.current = null;
      }
    } catch {
      // Ignore
    }
  };

  const startSpeechRecognition = useCallback(() => {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (!SpeechRecognition) return;

      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = languageCode === 'indic-auto' ? 'hi-IN' : languageCode;

      segmentStartTimeRef.current = elapsedSeconds;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      recognition.onresult = (event: any) => {
        let interim = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const trans = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            const finalClean = trans.trim();
            if (finalClean) {
              const segStart = segmentStartTimeRef.current;
              const segEnd = Math.max(segStart + 1.0, elapsedSeconds);
              setLiveSegments((prev) => [
                ...prev,
                {
                  start_time: Math.round(segStart * 10) / 10,
                  end_time: Math.round(segEnd * 10) / 10,
                  transcript: finalClean,
                  speaker: 'Teacher',
                },
              ]);
              segmentStartTimeRef.current = elapsedSeconds;
            }
          } else {
            interim += trans;
          }
        }
        setInterimText(interim);
      };

      recognition.onerror = () => {
        // Non-fatal
      };

      recognition.start();
      speechRecognitionRef.current = recognition;
    } catch {
      // Non-fatal
    }
  }, [languageCode, elapsedSeconds]);

  // Audio level visualizer canvas animation
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let phase = 0;
    const render = () => {
      phase += 0.08;
      const width = canvas.width;
      const height = canvas.height;
      ctx.clearRect(0, 0, width, height);

      const bars = 36;
      const barWidth = width / bars;

      for (let i = 0; i < bars; i++) {
        const x = i * barWidth;
        const normalizedIndex = i / bars;
        const wave = Math.sin(phase + normalizedIndex * Math.PI * 2) * 0.3 + 0.7;
        const heightMultiplier = isRecording && !isPaused ? Math.max(0.12, audioLevel * 1.5 * wave) : 0.06;
        const barHeight = Math.min(height * 0.9, height * heightMultiplier);
        const y = (height - barHeight) / 2;

        ctx.fillStyle = isRecording && !isPaused
          ? (audioLevel > 0.4 ? '#38bdf8' : '#0284c7')
          : '#334155';
        ctx.fillRect(x + 1, y, barWidth - 2, barHeight);
      }

      animFrameRef.current = requestAnimationFrame(render);
    };

    render();
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [isRecording, isPaused, audioLevel]);

  const handleStartLiveRecording = async () => {
    setErrorMsg(null);
    setLiveSegments([]);
    setInterimText('');
    setRecordedBlob(null);

    try {
      const recorder = new AudioRecorder();
      recorderRef.current = recorder;

      await recorder.start((level) => {
        setAudioLevel(level);
      });

      setIsRecording(true);
      setIsPaused(false);
      setElapsedSeconds(0);

      timerRef.current = setInterval(() => {
        setElapsedSeconds((prev) => prev + 1);
      }, 1000);

      startSpeechRecognition();
    } catch (err: unknown) {
      const error = err as Error;
      setErrorMsg(error.message || 'Microphone access denied. Please allow microphone permissions.');
      setIsRecording(false);
    }
  };

  const handlePauseRecording = () => {
    if (!isRecording) return;
    setIsPaused(true);
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    stopSpeechRecognition();
  };

  const handleResumeRecording = () => {
    if (!isRecording) return;
    setIsPaused(false);
    timerRef.current = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);
    startSpeechRecognition();
  };

  const handleFinishAndSave = async () => {
    if (!recorderRef.current || !isRecording) return;

    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    stopSpeechRecognition();

    setIsRecording(false);
    setIsSaving(true);
    setErrorMsg(null);

    try {
      const blob = await recorderRef.current.stop();
      setRecordedBlob(blob);

      const finalTitle = title.trim() || `Live Lecture - ${new Date().toLocaleDateString('en-IN')}`;
      const response = await recordLiveLecture(blob, finalTitle, languageCode, liveSegments);

      onRecordSuccess(response.lecture);
      onClose();
    } catch (err: unknown) {
      const error = err as Error;
      setErrorMsg(error.message || 'Failed to save live classroom recording.');
    } finally {
      setIsSaving(false);
      setAudioLevel(0);
    }
  };

  const handleDownloadBackup = () => {
    if (!recordedBlob) return;
    const url = URL.createObjectURL(recordedBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${(title || 'live_class').replace(/\s+/g, '_')}.webm`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleDiscard = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (recorderRef.current && isRecording) {
      recorderRef.current.stop().catch(() => {});
    }
    stopSpeechRecognition();
    setIsRecording(false);
    setIsPaused(false);
    setElapsedSeconds(0);
    onClose();
  };

  if (!isOpen) return null;

  const hours = Math.floor(elapsedSeconds / 3600);
  const minutes = Math.floor((elapsedSeconds % 3600) / 60);
  const seconds = elapsedSeconds % 60;
  const timerFormatted = hours > 0
    ? `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
    : `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-fade-in">
      <div className="relative w-full max-w-xl rounded-2xl border border-slate-800 bg-slate-950 p-5 sm:p-6 shadow-2xl overflow-hidden flex flex-col">
        {/* Close Button */}
        <button
          type="button"
          onClick={handleDiscard}
          disabled={isSaving}
          className="absolute right-4 top-4 text-slate-400 hover:text-white p-1 rounded-lg transition-colors"
          title="Close / Discard"
        >
          <X className="size-4" />
        </button>

        {/* Modal Header */}
        <div className="mb-4">
          <div className="flex items-center gap-2">
            <span className="relative flex h-3 w-3">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${isRecording && !isPaused ? 'bg-rose-400 opacity-75' : 'bg-slate-500 opacity-20'}`} />
              <span className={`relative inline-flex rounded-full h-3 w-3 ${isRecording && !isPaused ? 'bg-rose-500' : 'bg-slate-600'}`} />
            </span>
            <h2 className="text-base font-semibold text-slate-100 flex items-center gap-2">
              Live Classroom Recorder
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Record your professor&apos;s live lecture in the classroom. Audio will be stored, indexed, and made voice-searchable immediately.
          </p>
        </div>

        {/* Setup Configuration */}
        <div className="space-y-3 mb-4">
          <div>
            <label className="text-xs font-medium text-slate-300 block mb-1">
              Lecture Title / Topic
            </label>
            <input
              type="text"
              value={title}
              disabled={isRecording || isSaving}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Data Structures: Graphs & BFS/DFS Traversal"
              className="w-full h-9 px-3 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-sky-500 font-normal"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-slate-300 flex items-center justify-between mb-1">
              <span className="flex items-center gap-1.5">
                <Globe className="size-3 text-sky-400" />
                Teaching Language / Code-Mix
              </span>
              <span className="text-[10px] text-slate-500 font-mono">Auto-detects regional mixing</span>
            </label>
            <select
              value={languageCode}
              disabled={isRecording || isSaving}
              onChange={(e) => setLanguageCode(e.target.value)}
              className="w-full h-9 px-3 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-100 focus:outline-none focus:border-sky-500 font-normal"
            >
              {SUPPORTED_LANGUAGES.map((lang) => (
                <option key={lang.code} value={lang.code}>
                  {lang.name} ({lang.native_name}) — {lang.indic_code_mixed}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Live Audio Visualizer & Timer Screen */}
        <div className="rounded-xl border border-slate-800/90 bg-slate-900/60 p-4 text-center relative overflow-hidden mb-4">
          {/* Status Badge */}
          <div className="flex items-center justify-center gap-2 mb-2">
            {isRecording && !isPaused ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-rose-950/80 border border-rose-800/80 text-rose-300 text-[11px] font-mono font-medium">
                <span className="size-1.5 rounded-full bg-rose-500 animate-pulse" />
                RECORDING LIVE
              </span>
            ) : isPaused ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-950/80 border border-amber-800/80 text-amber-300 text-[11px] font-mono font-medium">
                ❚❚ PAUSED
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-slate-800/80 text-slate-400 text-[11px] font-mono">
                READY TO RECORD
              </span>
            )}
          </div>

          {/* Large Elapsed Timer */}
          <div className="font-mono text-3xl sm:text-4xl font-bold tracking-tight text-slate-100 tabular-nums my-1">
            {timerFormatted}
          </div>

          {/* Real-time Dynamic Waveform Canvas */}
          <div className="h-12 w-full my-2 flex items-center justify-center">
            <canvas ref={canvasRef} width={380} height={48} className="w-full h-full" />
          </div>

          {/* Real-Time Live Captions / Speech Snippets Preview */}
          <div className="mt-2 min-h-12 max-h-24 overflow-y-auto px-3 py-1.5 rounded-lg bg-slate-950/80 border border-slate-800 text-left text-xs text-slate-300">
            {liveSegments.length === 0 && !interimText ? (
              <p className="text-[11px] text-slate-500 italic text-center pt-2">
                {isRecording
                  ? 'Listening for teacher speech... Sentences will be indexed live.'
                  : 'Start recording when your teacher begins speaking in class.'}
              </p>
            ) : (
              <div className="space-y-1">
                {liveSegments.slice(-2).map((seg, idx) => (
                  <div key={idx} className="flex items-start gap-1.5 text-[11px]">
                    <span className="font-mono text-sky-400 text-[10px] shrink-0">
                      [{formatTime(seg.start_time)}]
                    </span>
                    <span className="text-slate-300 line-clamp-1">{seg.transcript}</span>
                  </div>
                ))}
                {interimText && (
                  <div className="flex items-start gap-1.5 text-[11px] text-sky-400 italic">
                    <span className="font-mono text-sky-500 text-[10px] shrink-0">Live:</span>
                    <span className="line-clamp-1">{interimText}...</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Error Alert */}
        {errorMsg && (
          <div className="mb-4 p-3 rounded-lg bg-rose-950/40 border border-rose-900/50 text-xs text-rose-300 flex items-start gap-2">
            <AlertCircle className="size-4 text-rose-400 shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Modal Action Controls */}
        <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-800/80">
          <div>
            {recordedBlob && (
              <button
                type="button"
                onClick={handleDownloadBackup}
                className="btn-press flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-slate-400 hover:text-white bg-slate-900 hover:bg-slate-850 border border-slate-800 transition-colors"
                title="Download backup audio"
              >
                <Download className="size-3.5" />
                <span className="hidden sm:inline">Backup Audio</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            {!isRecording ? (
              <>
                <button
                  type="button"
                  onClick={handleDiscard}
                  className="px-3.5 py-2 rounded-lg text-xs font-medium text-slate-400 hover:text-white bg-slate-900 hover:bg-slate-850 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleStartLiveRecording}
                  disabled={isSaving}
                  className="btn-press flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-rose-600 hover:bg-rose-500 shadow-lg shadow-rose-950 transition-colors"
                >
                  <Radio className="size-3.5 animate-pulse" />
                  <span>Start Live Recording</span>
                </button>
              </>
            ) : (
              <>
                {isPaused ? (
                  <button
                    type="button"
                    onClick={handleResumeRecording}
                    className="btn-press flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium text-slate-200 bg-slate-800 hover:bg-slate-750 transition-colors"
                  >
                    <Play className="size-3.5 fill-current" />
                    <span>Resume</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handlePauseRecording}
                    className="btn-press flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium text-slate-200 bg-slate-800 hover:bg-slate-750 transition-colors"
                  >
                    <Pause className="size-3.5 fill-current" />
                    <span>Pause</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={handleFinishAndSave}
                  disabled={isSaving || elapsedSeconds < 2}
                  className="btn-press flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold text-slate-950 bg-sky-400 hover:bg-sky-300 disabled:opacity-50 shadow-lg transition-colors"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="size-3.5 animate-spin" />
                      <span>Storing Lecture...</span>
                    </>
                  ) : (
                    <>
                      <Square className="size-3.5 fill-current" />
                      <span>Finish & Store Class</span>
                    </>
                  )}
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LiveClassRecorderModal;

