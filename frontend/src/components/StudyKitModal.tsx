'use client';

import React, { useState } from 'react';
import { BookmarkItem } from '@/types';
import { formatTime } from '@/lib/api';
import { Bookmark, X, Play, Trash2, Download, Copy, Check, FileText } from 'lucide-react';

interface StudyKitModalProps {
  isOpen: boolean;
  onClose: () => void;
  bookmarks: BookmarkItem[];
  onRemoveBookmark: (id: string) => void;
  onPlayTimestamp: (startTime: number, endTime?: number) => void;
}

export const StudyKitModal: React.FC<StudyKitModalProps> = ({
  isOpen,
  onClose,
  bookmarks,
  onRemoveBookmark,
  onPlayTimestamp,
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleExportMarkdown = () => {
    if (bookmarks.length === 0) return;
    const lines = [
      `# ClassTrace Study Kit Notes`,
      `Generated on ${new Date().toLocaleDateString()}`,
      `Total Saved Moments: ${bookmarks.length}\n`,
      `---`,
    ];

    bookmarks.forEach((b, idx) => {
      lines.push(
        `### ${idx + 1}. ${b.lecture_title} [${formatTime(b.start_time)} - ${formatTime(b.end_time)}]`,
        `> "${b.transcript}"\n`,
        b.note ? `*Note: ${b.note}*\n` : '',
        `---`
      );
    });

    const blob = new Blob([lines.join('\n')], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ClassTrace_Notes_${new Date().toISOString().slice(0, 10)}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleCopyClipboard = () => {
    if (bookmarks.length === 0) return;
    const summary = bookmarks
      .map(
        (b, i) =>
          `${i + 1}. [${formatTime(b.start_time)} - ${formatTime(b.end_time)}] ${b.lecture_title}\n"${b.transcript}"`
      )
      .join('\n\n');

    navigator.clipboard.writeText(summary);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-xl w-full max-w-2xl p-6 shadow-2xl relative max-h-[85vh] flex flex-col">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 text-slate-400 hover:text-slate-100 p-1 rounded-lg transition-colors"
        >
          <X className="size-4" />
        </button>

        {/* Header */}
        <div className="pb-4 border-b border-slate-800 flex items-center justify-between pr-8">
          <div className="flex items-center gap-2.5">
            <div className="size-8 rounded-lg bg-sky-950/60 border border-sky-800/60 flex items-center justify-center text-sky-400">
              <Bookmark className="size-4" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-slate-100">
                Personal Study Kit & Moments
              </h2>
              <p className="text-xs text-slate-400">
                {bookmarks.length} saved explanation{bookmarks.length === 1 ? '' : 's'} across recorded lectures.
              </p>
            </div>
          </div>

          {bookmarks.length > 0 && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleCopyClipboard}
                title="Copy all notes to clipboard"
                className="flex items-center gap-1 px-2.5 py-1 rounded text-xs bg-slate-800 hover:bg-slate-750 text-slate-300 transition-colors"
              >
                {copied ? <Check className="size-3 text-emerald-400" /> : <Copy className="size-3" />}
                <span className="hidden sm:inline">{copied ? 'Copied' : 'Copy'}</span>
              </button>

              <button
                type="button"
                onClick={handleExportMarkdown}
                title="Download Markdown revision guide"
                className="flex items-center gap-1 px-2.5 py-1 rounded text-xs bg-sky-500 hover:bg-sky-400 text-slate-950 font-semibold transition-colors"
              >
                <Download className="size-3" />
                <span className="hidden sm:inline">Export Notes</span>
              </button>
            </div>
          )}
        </div>

        {/* Bookmarks List */}
        <div className="flex-1 overflow-y-auto space-y-2.5 py-4 pr-1">
          {bookmarks.length === 0 ? (
            <div className="py-12 text-center space-y-2">
              <div className="size-10 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center mx-auto text-slate-400">
                <Bookmark className="size-5" />
              </div>
              <p className="text-xs font-medium text-slate-300">No bookmarked moments yet</p>
              <p className="text-[11px] text-slate-500 max-w-sm mx-auto">
                Click the bookmark icon on any search result or transcript passage to save key explanations for exam revision.
              </p>
            </div>
          ) : (
            bookmarks.map((item, idx) => (
              <div
                key={item.id}
                className="p-3.5 rounded-xl border border-slate-800/80 bg-slate-950/60 hover:border-slate-700 transition-colors space-y-2"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="px-1.5 py-0.5 rounded font-mono text-[10px] bg-slate-800 text-slate-300 font-semibold">
                      #{idx + 1}
                    </span>
                    <span className="text-xs font-mono text-sky-400 tabular-nums">
                      [{formatTime(item.start_time)} – {formatTime(item.end_time)}]
                    </span>
                    <span className="text-xs text-slate-400 font-medium truncate max-w-xs">
                      {item.lecture_title}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        onPlayTimestamp(item.start_time, item.end_time);
                        onClose();
                      }}
                      className="flex items-center gap-1 px-2 py-1 rounded bg-sky-950 text-sky-300 hover:bg-sky-900 border border-sky-800/60 text-xs font-mono"
                    >
                      <Play className="size-3 fill-current" />
                      <span>Play</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => onRemoveBookmark(item.id)}
                      className="p-1 rounded text-slate-500 hover:text-rose-400 hover:bg-slate-800 transition-colors"
                      title="Remove from Study Kit"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  </div>
                </div>

                <p className="text-xs text-slate-200 leading-relaxed font-normal bg-slate-900/50 p-2.5 rounded-lg border border-slate-800/50">
                  &ldquo;{item.transcript}&rdquo;
                </p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

