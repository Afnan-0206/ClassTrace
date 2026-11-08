'use client';

import React from 'react';
import { X, Keyboard, Command } from 'lucide-react';

interface ShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SHORTCUTS = [
  { key: 'Space', desc: 'Play / Pause lecture audio' },
  { key: 'J', desc: 'Seek backward 10 seconds' },
  { key: 'L', desc: 'Seek forward 10 seconds' },
  { key: 'M', desc: 'Toggle audio mute' },
  { key: '/', desc: 'Focus voice & text search input' },
  { key: 'B', desc: 'Bookmark current moment into Study Kit' },
  { key: 'Esc', desc: 'Close open dialogs / modal' },
];

export const ShortcutsModal: React.FC<ShortcutsModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-150">
      <div className="w-full max-w-md rounded-2xl bg-black/90 backdrop-blur-3xl border border-white/[0.14] shadow-2xl p-5 text-white space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
          <div className="flex items-center gap-2">
            <div className="size-7 rounded-lg bg-white/[0.08] border border-white/[0.12] flex items-center justify-center text-white">
              <Keyboard className="size-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white font-display">Keyboard Shortcuts</h3>
              <p className="text-[11px] text-white/50">Navigate ClassTrace at the speed of thought</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-white/50 hover:text-white hover:bg-white/[0.08] transition-colors"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Shortcuts List */}
        <div className="space-y-2">
          {SHORTCUTS.map((item, i) => (
            <div
              key={i}
              className="flex items-center justify-between p-2 rounded-xl bg-white/[0.04] border border-white/[0.07]"
            >
              <span className="text-xs text-white/80">{item.desc}</span>
              <kbd className="px-2 py-0.5 rounded-md bg-white/[0.1] border border-white/20 text-[11px] font-mono text-white font-bold shadow-sm">
                {item.key}
              </kbd>
            </div>
          ))}
        </div>

        <div className="text-[11px] text-center text-white/40 pt-1 font-mono">
          Press <kbd className="px-1.5 py-0.5 rounded bg-white/[0.06] border border-white/[0.1] text-white/70">Esc</kbd> anytime to dismiss
        </div>
      </div>
    </div>
  );
};

export default ShortcutsModal;

