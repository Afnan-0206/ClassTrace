'use client';

import React from 'react';
import { KeyRound, CheckCircle2 } from 'lucide-react';
import { ConfigStatus } from '@/types';

interface ConfigBannerProps {
  config: ConfigStatus | null;
}

export const ConfigBanner: React.FC<ConfigBannerProps> = ({ config }) => {
  if (!config) return null;

  if (config.gnani_configured && config.supabase_configured) {
    return (
      <div className="bg-emerald-950/40 border-b border-emerald-800/40 px-4 py-2 text-xs text-emerald-300">
        <div className="flex items-center gap-2 max-w-7xl mx-auto w-full font-mono">
          <CheckCircle2 className="size-3.5 text-emerald-400 shrink-0" />
          <span>Production Ready: Gnani AI ({config.gnani_model}) & Supabase PostgreSQL active.</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-900/80 border-b border-slate-800 px-4 py-2 text-xs text-slate-300">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <KeyRound className="size-3.5 text-sky-400 shrink-0" />
          <div>
            <span className="text-slate-200 font-medium">Integration Status:</span>{' '}
            <span className="text-slate-400">
              {config.gnani_configured
                ? `Gnani AI active (${config.gnani_model}). Persistence: ${config.active_database}.`
                : 'Local hybrid search active. Add GNANI_API_KEY in backend/.env for live cloud STT.'}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0 text-[11px] font-mono text-sky-400 bg-sky-950/50 px-2 py-0.5 rounded border border-sky-800/40">
          <span>Storage: {config.active_database}</span>
        </div>
      </div>
    </div>
  );
};
