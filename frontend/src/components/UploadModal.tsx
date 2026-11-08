'use client';

import React, { useState, useRef } from 'react';
import { uploadLecture } from '@/lib/api';
import { Lecture, SUPPORTED_LANGUAGES } from '@/types';
import { UploadCloud, X, FileAudio, AlertCircle, Loader2, Globe } from 'lucide-react';

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUploadSuccess: (lecture: Lecture) => void;
}

export const UploadModal: React.FC<UploadModalProps> = ({
  isOpen,
  onClose,
  onUploadSuccess,
}) => {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [languageCode, setLanguageCode] = useState('indic-auto');
  const [isUploading, setIsUploading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  if (!isOpen) return null;

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      validateAndSetFile(e.target.files[0]);
    }
  };

  const validateAndSetFile = (file: File) => {
    setErrorMsg(null);
    const validExtensions = ['.wav', '.mp3', '.ogg', '.flac', '.m4a', '.aac', '.webm'];
    const hasValidExt = validExtensions.some((ext) => file.name.toLowerCase().endsWith(ext));

    if (!hasValidExt) {
      setErrorMsg(`Unsupported audio format. Supported formats: ${validExtensions.join(', ')}`);
      return;
    }

    if (file.size > 150 * 1024 * 1024) {
      setErrorMsg('File size exceeds the 150 MB upload limit.');
      return;
    }

    setSelectedFile(file);
    if (!title) {
      const cleanName = file.name.replace(/\.[^/.]+$/, '').replace(/[_-]/g, ' ');
      setTitle(cleanName);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) return;

    setErrorMsg(null);
    setIsUploading(true);

    try {
      const finalTitle = title.trim() || selectedFile.name;
      const response = await uploadLecture(selectedFile, finalTitle, languageCode);
      onUploadSuccess(response.lecture);
      onClose();
    } catch (err: unknown) {
      const error = err as Error;
      setErrorMsg(error.message || 'Upload failed. Please check backend connection.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
      <div className="relative w-full max-w-lg rounded-xl border border-slate-800 bg-slate-900 p-6 shadow-2xl">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 text-slate-400 hover:text-slate-200 transition-colors"
        >
          <X className="size-4" />
        </button>

        <div className="mb-5">
          <h2 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
            <UploadCloud className="size-4 text-sky-400" />
            Upload Classroom Lecture Audio
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Audio will be converted with FFmpeg and transcribed using Gnani AI Prisma Batch STT.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Drag & Drop Area */}
          <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors ${
              dragActive
                ? 'border-sky-400 bg-sky-950/20'
                : 'border-slate-800 bg-slate-950/60 hover:border-slate-700'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="audio/*,.wav,.mp3,.ogg,.flac,.m4a,.aac,.webm"
              onChange={handleFileChange}
              className="hidden"
            />

            <div className="size-10 rounded-full bg-slate-800 flex items-center justify-center mx-auto mb-2.5 text-sky-400">
              <FileAudio className="size-5" />
            </div>

            {selectedFile ? (
              <div>
                <p className="text-xs font-medium text-sky-300 truncate max-w-xs mx-auto">
                  {selectedFile.name}
                </p>
                <p className="text-[11px] font-mono text-slate-400 mt-0.5">
                  {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
                </p>
              </div>
            ) : (
              <div>
                <p className="text-xs font-medium text-slate-200">
                  Click to browse or drag & drop lecture recording
                </p>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Supports WAV, MP3, M4A, FLAC, WebM (up to 150 MB)
                </p>
              </div>
            )}
          </div>

          {/* Lecture Title Input */}
          <div>
            <label className="text-xs font-medium text-slate-300 block mb-1">
              Lecture Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. DSA: Binary Trees and Inorder Traversal"
              className="w-full h-9 px-3 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-sky-500 font-normal"
            />
          </div>

          {/* Lecture Language / Indic Code-Mix Selector */}
          <div>
            <label className="text-xs font-medium text-slate-300 flex items-center justify-between mb-1">
              <span className="flex items-center gap-1.5">
                <Globe className="size-3 text-sky-400" />
                Teaching Language / Code-Mix
              </span>
              <span className="text-[10px] text-slate-500 font-mono">12+ Indian Languages</span>
            </label>
            <select
              value={languageCode}
              onChange={(e) => setLanguageCode(e.target.value)}
              className="w-full h-9 px-3 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-100 focus:outline-none focus:border-sky-500 font-normal"
            >
              {SUPPORTED_LANGUAGES.map((lang) => (
                <option key={lang.code} value={lang.code}>
                  {lang.name} ({lang.native_name}) — {lang.indic_code_mixed}
                </option>
              ))}
            </select>
            <p className="text-[10px] text-slate-500 mt-1">
              Gnani AI Prisma batch transcription adapts to regional Indian code-mixed speech (e.g. Hinglish, Tanglish, Tenglish).
            </p>
          </div>

          {errorMsg && (
            <div className="p-3 rounded-lg bg-rose-950/40 border border-rose-900/50 text-xs text-rose-300 flex items-start gap-2">
              <AlertCircle className="size-4 text-rose-400 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isUploading}
              className="px-3.5 py-1.5 rounded-lg text-xs font-medium text-slate-400 hover:text-slate-200 bg-slate-800 hover:bg-slate-750 transition-colors"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={!selectedFile || isUploading}
              className="px-4 py-1.5 rounded-lg text-xs font-semibold text-slate-950 bg-sky-400 hover:bg-sky-300 disabled:opacity-40 transition-colors flex items-center gap-1.5"
            >
              {isUploading ? (
                <>
                  <Loader2 className="size-3.5 animate-spin" />
                  <span>Processing Audio...</span>
                </>
              ) : (
                <span>Upload & Transcribe</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
