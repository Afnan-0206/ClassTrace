'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  Mic,
  Search,
  CornerDownLeft,
  Loader2,
  AlertCircle,
  Sparkles,
  X,
  Globe,
  ChevronDown,
  Check,
  RotateCcw,
  Volume2,
} from 'lucide-react';
import { AudioRecorder } from '@/lib/audioRecorder';
import { searchByVoice, searchByText, formatTime } from '@/lib/api';
import { SearchResponse, SUPPORTED_LANGUAGES } from '@/types';
import { VoiceDictator } from '@/components/ui/voice-dictator';

export interface ContextMomentAnchor {
  id: string;
  startTime: number;
  endTime: number;
  label: string;
}

interface VoiceSearchProps {
  selectedLectureId?: string;
  onSearchComplete: (response: SearchResponse, recognizedVoiceText?: string) => void;
  isLoading: boolean;
  setIsLoading: (val: boolean) => void;
  contextMoment?: ContextMomentAnchor | null;
  onClearContextMoment?: () => void;
}

export const VoiceSearch: React.FC<VoiceSearchProps> = ({
  selectedLectureId,
  onSearchComplete,
  isLoading,
  setIsLoading,
  contextMoment,
  onClearContextMoment,
}) => {
  const [isVoiceModalOpen, setIsVoiceModalOpen] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordSeconds, setRecordSeconds] = useState(0);
  const [audioLevel, setAudioLevel] = useState(0);
  const [textQuery, setTextQuery] = useState('');
  const [recognizedText, setRecognizedText] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [selectedLanguage, setSelectedLanguage] = useState<string>('indic-auto');
  const [isLangMenuOpen, setIsLangMenuOpen] = useState(false);

  const recorderRef = useRef<AudioRecorder | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const langMenuRef = useRef<HTMLDivElement | null>(null);
  const speechRecognitionRef = useRef<unknown>(null);
  const liveTranscriptRef = useRef<string>('');

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (langMenuRef.current && !langMenuRef.current.contains(e.target as Node)) {
        setIsLangMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
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
      // Ignore cleanup
    }
  };

  const startRecording = async () => {
    setErrorMsg(null);
    setRecognizedText(null);
    liveTranscriptRef.current = '';

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = selectedLanguage === 'indic-auto' ? 'hi-IN' : selectedLanguage;

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        recognition.onresult = (event: any) => {
          let interim = '';
          for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcript = event.results[i][0].transcript;
            if (event.results[i].isFinal) {
              liveTranscriptRef.current += transcript + ' ';
            } else {
              interim += transcript;
            }
          }
          const currentSpoken = (liveTranscriptRef.current + interim).trim();
          if (currentSpoken) {
            setRecognizedText(currentSpoken);
            setTextQuery(currentSpoken);
          }
        };

        recognition.onerror = () => {};
        recognition.start();
        speechRecognitionRef.current = recognition;
      }
    } catch {
      // Non-blocking
    }

    try {
      const recorder = new AudioRecorder();
      recorderRef.current = recorder;

      await recorder.start((level) => {
        setAudioLevel(level);
      });

      setIsRecording(true);
      setRecordSeconds(0);

      timerRef.current = setInterval(() => {
        setRecordSeconds((prev) => {
          if (prev >= 30) {
            stopRecording();
            return 30;
          }
          return prev + 1;
        });
      }, 1000);
    } catch (err: unknown) {
      const error = err as Error;
      setErrorMsg(error.message || 'Microphone access denied. Please allow microphone permissions.');
      setIsRecording(false);
      stopSpeechRecognition();
    }
  };

  const stopRecording = async () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    stopSpeechRecognition();

    if (!recorderRef.current || !isRecording) {
      setIsRecording(false);
      return;
    }

    setIsRecording(false);
    setIsLoading(true);

    try {
      const audioBlob = await recorderRef.current.stop();
      const fallbackSpokenText = liveTranscriptRef.current.trim() || recognizedText || '';

      const response = await searchByVoice(
        audioBlob,
        selectedLectureId,
        selectedLanguage,
        contextMoment?.startTime,
        Boolean(contextMoment),
        fallbackSpokenText
      );

      const finalQuery = response.recognized_text || fallbackSpokenText;
      if (finalQuery) {
        setRecognizedText(finalQuery);
        setTextQuery(finalQuery);
      }
      onSearchComplete(response.search_response, finalQuery);

      setTimeout(() => {
        setIsVoiceModalOpen(false);
      }, 900);
    } catch (err: unknown) {
      const error = err as Error;
      setErrorMsg(error.message || 'Voice search failed. Please try speaking again or use text search.');
    } finally {
      setIsLoading(false);
      setAudioLevel(0);
    }
  };

  const handleToggleRecording = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  const handleOpenVoiceModal = () => {
    setIsVoiceModalOpen(true);
    startRecording();
  };

  const handleCloseVoiceModal = () => {
    if (isRecording) {
      if (timerRef.current) clearInterval(timerRef.current);
      if (recorderRef.current) recorderRef.current.stop().catch(() => {});
      stopSpeechRecognition();
      setIsRecording(false);
    }
    setIsVoiceModalOpen(false);
  };

  const handleConfirmRecognizedQuery = (query: string) => {
    setIsVoiceModalOpen(false);
    setTextQuery(query);
    setErrorMsg(null);
    setIsLoading(true);
    searchByText(
      query,
      selectedLectureId,
      contextMoment?.startTime,
      Boolean(contextMoment),
      selectedLanguage
    )
      .then((res) => onSearchComplete(res, query))
      .catch((err) => setErrorMsg(err.message || 'Search failed'))
      .finally(() => setIsLoading(false));
  };

  const handleTextSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!textQuery.trim() || isLoading) return;

    setErrorMsg(null);
    setIsLoading(true);
    try {
      const response = await searchByText(
        textQuery.trim(),
        selectedLectureId,
        contextMoment?.startTime,
        Boolean(contextMoment),
        selectedLanguage
      );
      onSearchComplete(response);
    } catch (err: unknown) {
      const error = err as Error;
      setErrorMsg(error.message || 'Search failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectSampleQuery = (query: string) => {
    setTextQuery(query);
    setErrorMsg(null);
    setIsLoading(true);
    searchByText(
      query,
      selectedLectureId,
      contextMoment?.startTime,
      Boolean(contextMoment),
      selectedLanguage
    )
      .then((response) => onSearchComplete(response))
      .catch((err) => setErrorMsg(err.message || 'Search failed'))
      .finally(() => setIsLoading(false));
  };

  const handleClearQuery = () => {
    setTextQuery('');
    setErrorMsg(null);
    if (inputRef.current) inputRef.current.focus();
  };

  const activeLangObj = SUPPORTED_LANGUAGES.find((l) => l.code === selectedLanguage);

  return (
    <section className="search-command w-full space-y-2.5" aria-label="Search this lecture">
      {/* Active Multi-Turn Follow-Up Anchor Banner */}
      {contextMoment && (
        <div className="flex items-center justify-between gap-2 p-2.5 px-3.5 rounded-xl bg-sky-950/40 border border-sky-800/70 text-xs text-[#38BDF8] animate-in fade-in duration-200">
          <div className="flex items-center gap-2 truncate">
            <Sparkles className="size-3.5 text-[#38BDF8] shrink-0" />
            <span className="font-mono text-[#38BDF8] text-[11px] font-semibold shrink-0">
              Follow-Up Anchor [{formatTime(contextMoment.startTime)}]:
            </span>
            <span className="truncate italic text-slate-200 text-[11px]">
              &ldquo;{contextMoment.label}&rdquo;
            </span>
          </div>
          {onClearContextMoment && (
            <button
              type="button"
              onClick={onClearContextMoment}
              className="text-slate-400 hover:text-white p-1 rounded-md shrink-0 transition-colors"
              title="Clear follow-up anchor"
            >
              <X className="size-3.5" />
            </button>
          )}
        </div>
      )}

      {/* Main Conversational Input Bar */}
      <div className="relative">
        <form onSubmit={handleTextSubmit}>
          <div className="flex items-center bg-white/[0.04] backdrop-blur-2xl border border-white/[0.09] hover:border-white/20 focus-within:border-white/40 focus-within:ring-2 focus-within:ring-white/10 transition-all rounded-2xl h-12 sm:h-13 px-2 shadow-xl">
            {/* Voice Dictator Trigger Button */}
            <button
              type="button"
              onClick={handleOpenVoiceModal}
              disabled={isLoading}
              title="Ask question by voice (opens Voice Dictator)"
              className="btn-press flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-white hover:text-white bg-white/10 hover:bg-white/20 border border-white/20 transition-colors shrink-0"
            >
              <Mic className="size-3.5 text-white animate-pulse" />
              <span className="text-xs font-semibold">Voice</span>
            </button>

            {/* Language Selector Popover */}
            <div className="relative ml-1.5" ref={langMenuRef}>
              <button
                type="button"
                onClick={() => setIsLangMenuOpen((prev) => !prev)}
                className="btn-press flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] text-white/80 hover:text-white border border-white/[0.08] transition-colors text-xs font-medium shrink-0"
                title="Indic Language Selection (Auto-Detect by default)"
              >
                <Globe className="size-3 text-white shrink-0" />
                <span className="max-w-[85px] sm:max-w-[125px] truncate">
                  {selectedLanguage === 'indic-auto' ? 'Auto-Detect' : activeLangObj?.name || 'Auto-Detect'}
                </span>
                <ChevronDown className="size-3 text-white/40 shrink-0" />
              </button>

              {isLangMenuOpen && (
                <div className="absolute left-0 top-full mt-2 z-50 w-64 rounded-xl bg-black/90 backdrop-blur-3xl border border-white/[0.14] p-1.5 shadow-2xl animate-in fade-in duration-150">
                  <div className="px-2.5 py-1 text-[10px] uppercase font-mono text-white/60 font-semibold border-b border-white/[0.08] mb-1 flex items-center justify-between">
                    <span>Indic Dialect Detection</span>
                    <span className="text-[9px] text-white/80">12+ Languages</span>
                  </div>
                  <div className="max-h-56 overflow-y-auto space-y-0.5 custom-scrollbar">
                    {SUPPORTED_LANGUAGES.map((lang) => {
                      const isSelected = selectedLanguage === lang.code;
                      return (
                        <button
                          key={lang.code}
                          type="button"
                          onClick={() => {
                            setSelectedLanguage(lang.code);
                            setIsLangMenuOpen(false);
                          }}
                          className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition-colors text-left ${
                            isSelected
                              ? 'bg-white/20 text-white font-medium'
                              : 'text-white/70 hover:bg-white/[0.08] hover:text-white'
                          }`}
                        >
                          <div className="flex flex-col truncate pr-2">
                            <span className="truncate">{lang.name}</span>
                            <span className="text-[10px] text-white/40 truncate">
                              {lang.native_name} • {lang.indic_code_mixed}
                            </span>
                          </div>
                          {isSelected && <Check className="size-3.5 text-white shrink-0" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Search Input Field */}
            <input
              ref={inputRef}
              type="text"
              value={textQuery}
              onChange={(e) => setTextQuery(e.target.value)}
              disabled={isLoading}
              placeholder={
                contextMoment
                  ? `Ask follow-up after ${formatTime(contextMoment.startTime)} (e.g. 'Iske baad kya explain kiya?')...`
                  : "Ask in any Indian language: Hinglish, Tanglish, Tenglish, Kanglish, English..."
              }
              className="flex-1 min-w-0 bg-transparent border-0 px-3 text-xs sm:text-sm text-white placeholder:text-white/40 focus:outline-none"
            />

            {/* Clear Query Button */}
            {textQuery.trim() && !isLoading && (
              <button
                type="button"
                onClick={handleClearQuery}
                title="Clear query"
                className="p-1 rounded-md text-white/40 hover:text-white transition-colors mr-1 shrink-0"
              >
                <X className="size-3.5" />
              </button>
            )}

            {/* Search Submit Button */}
            <button
              type="submit"
              disabled={!textQuery.trim() || isLoading}
              className="btn-press h-8 px-3 rounded-xl bg-white hover:bg-slate-200 text-black font-semibold text-xs transition-colors flex items-center gap-1.5 disabled:opacity-30 disabled:cursor-not-allowed shrink-0"
            >
              {isLoading ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <>
                  <span className="hidden sm:inline">Search</span>
                  <CornerDownLeft className="size-3.5" />
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Error Message Alert */}
      {errorMsg && (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-rose-950/40 border border-rose-800/80 text-rose-300 text-xs animate-in fade-in">
          <AlertCircle className="size-4 shrink-0 text-rose-400" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Suggested Questions & Auto-Detect Badge */}
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-white/50 pt-0.5">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-[11px] text-white/50 font-medium">Try asking:</span>
          <button
            type="button"
            onClick={() => handleSelectSampleQuery("Sir ne recursion ka base case kaise explain kiya tha?")}
            className="text-[11px] px-2.5 py-0.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-white border border-white/[0.07] transition-colors"
          >
            &ldquo;Base case kaise explain kiya?&rdquo;
          </button>
          <button
            type="button"
            onClick={() => handleSelectSampleQuery("What happens if there is no base condition in recursion?")}
            className="text-[11px] px-2.5 py-0.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-white/70 hover:text-white border border-white/[0.07] transition-colors"
          >
            &ldquo;Missing base condition error&rdquo;
          </button>
          <button
            type="button"
            onClick={() => handleSelectSampleQuery("Inorder traversal ka order kya hota hai?")}
            className="text-[11px] px-2.5 py-0.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-white/70 hover:text-white border border-white/[0.07] transition-colors"
          >
            &ldquo;Inorder traversal rule&rdquo;
          </button>
        </div>

        <div className="flex items-center gap-1.5 text-[11px] text-white/50 font-mono">
          <Sparkles className="size-3 text-white" />
          <span>Auto-detects Hindi, Tamil, Telugu & any Indic speech</span>
        </div>
      </div>

      {/* Immersive VoiceDictator Modal */}
      {isVoiceModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 sm:p-8 animate-in fade-in">
          <div className="relative h-[80vh] max-h-[640px] w-full max-w-4xl rounded-2xl border border-white/[0.14] shadow-2xl overflow-hidden bg-black/90">
            <VoiceDictator
              isRealRecording={isRecording}
              audioLevel={audioLevel}
              recordSeconds={recordSeconds}
              recognizedText={recognizedText}
              errorMsg={errorMsg}
              isProcessing={isLoading}
              onToggleRecording={handleToggleRecording}
              onClose={handleCloseVoiceModal}
              onConfirmQuery={handleConfirmRecognizedQuery}
              onSelectSample={(sampleQ) => {
                setRecognizedText(sampleQ);
                handleConfirmRecognizedQuery(sampleQ);
              }}
            />
          </div>
        </div>
      )}
    </section>
  );
};

export default VoiceSearch;
