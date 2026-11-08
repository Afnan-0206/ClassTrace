'use client';

import React, { useState } from 'react';
import { runBenchmarkEvaluation, formatTime } from '@/lib/api';
import { BenchmarkReport, BenchmarkItem } from '@/types';
import { Activity, X, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';

interface BenchmarkModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectQuery?: (query: string) => void;
}

export const BenchmarkModal: React.FC<BenchmarkModalProps> = ({
  isOpen,
  onClose,
  onSelectQuery,
}) => {
  const [report, setReport] = useState<BenchmarkReport | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleRun = async () => {
    setIsRunning(true);
    setErrorMsg(null);
    try {
      const data = await runBenchmarkEvaluation();
      setReport(data);
    } catch (err: unknown) {
      const error = err as Error;
      setErrorMsg(error.message || 'Benchmark evaluation failed');
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-xl w-full max-w-4xl p-6 shadow-2xl relative max-h-[90vh] flex flex-col">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 text-slate-400 hover:text-slate-100 p-1 rounded-lg"
        >
          <X className="size-4" />
        </button>

        {/* Modal Header */}
        <div className="pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="size-8 rounded-lg bg-sky-950/60 border border-sky-800/60 flex items-center justify-center text-sky-400">
              <Activity className="size-4" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-slate-100">
                ClassTrace Evaluation Benchmark
              </h2>
              <p className="text-xs text-slate-400">
                17 Ground-Truth Hinglish/English DSA Questions with Manually Verified Timestamp Tolerances.
              </p>
            </div>
          </div>
        </div>

        {/* Summary Metric Cards */}
        {report && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-4">
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
              <span className="text-[11px] text-slate-400 block font-medium">Total Queries</span>
              <span className="text-lg font-bold font-mono text-slate-100 tabular-nums">{report.total_questions}</span>
              <span className="text-[10px] text-slate-500 block font-mono">Ground truth tests</span>
            </div>

            <div className="p-3 rounded-xl bg-slate-950 border border-sky-900/60">
              <span className="text-[11px] text-sky-400 block font-medium">Hit@1 Accuracy</span>
              <span className="text-lg font-bold font-mono text-sky-300 tabular-nums">
                {(report.hit_at_1_rate * 100).toFixed(1)}%
              </span>
              <span className="text-[10px] text-slate-500 block font-mono">
                {report.hit_at_1_count} / {report.total_questions} correct
              </span>
            </div>

            <div className="p-3 rounded-xl bg-slate-950 border border-emerald-900/60">
              <span className="text-[11px] text-emerald-400 block font-medium">Hit@3 Accuracy</span>
              <span className="text-lg font-bold font-mono text-emerald-300 tabular-nums">
                {(report.hit_at_3_rate * 100).toFixed(1)}%
              </span>
              <span className="text-[10px] text-slate-500 block font-mono">
                {report.hit_at_3_count} / {report.total_questions} in top-3
              </span>
            </div>

            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
              <span className="text-[11px] text-slate-400 block font-medium">Mean Timestamp IoU</span>
              <span className="text-lg font-bold font-mono text-slate-200 tabular-nums">
                {report.average_timestamp_iou.toFixed(3)}
              </span>
              <span className="text-[10px] text-slate-500 block font-mono">Timestamp overlap</span>
            </div>
          </div>
        )}

        {/* Trigger Button if not run yet */}
        {!report && !isRunning && (
          <div className="my-8 text-center">
            <p className="text-xs text-slate-400 mb-4 max-w-md mx-auto leading-relaxed">
              Run automated queries across all 17 benchmark questions to test semantic embedding accuracy, BM25 keyword matching, and negative out-of-domain evidence gate rejection.
            </p>
            <button
              type="button"
              onClick={handleRun}
              className="px-5 py-2 rounded-lg bg-sky-400 hover:bg-sky-300 text-slate-950 text-xs font-semibold transition-colors"
            >
              Start Full Benchmark Run
            </button>
          </div>
        )}

        {/* Loading Spinner */}
        {isRunning && (
          <div className="my-12 text-center space-y-3">
            <Loader2 className="size-6 text-sky-400 animate-spin mx-auto" />
            <p className="text-xs text-slate-300 font-medium">
              Evaluating 17 test questions against ONNX embeddings & BM25...
            </p>
          </div>
        )}

        {/* Detailed Question Table */}
        {report && (
          <div className="flex-1 overflow-y-auto space-y-2 pr-1 border border-slate-800 rounded-xl p-3 bg-slate-950/40">
            {report.results.map((item: BenchmarkItem, idx: number) => {
              const isHit1 = item.hit_at_1;
              const isHit3 = item.hit_at_3;

              return (
                <div
                  key={idx}
                  className="p-2.5 rounded-lg border border-slate-800/80 bg-slate-900/50 hover:bg-slate-900 transition-colors text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                >
                  <div className="space-y-0.5 max-w-xl">
                    <div className="flex items-center gap-2">
                      <span className="px-1.5 py-0.2 rounded font-mono text-[10px] font-semibold bg-slate-800 text-slate-300">
                        Q{idx + 1}
                      </span>
                      <span className="font-medium text-slate-200">
                        {item.question}
                      </span>
                    </div>

                    <div className="text-[11px] font-mono text-slate-400 flex items-center gap-3">
                      <span>Expected: [{formatTime(item.expected_start)} - {formatTime(item.expected_end)}]</span>
                      {item.retrieved_start !== undefined && (
                        <span>Retrieved: [{formatTime(item.retrieved_start)} - {formatTime(item.retrieved_end || 0)}]</span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0 font-mono text-xs">
                    <span className="text-[11px] text-slate-400 tabular-nums">
                      IoU: {item.timestamp_iou.toFixed(2)}
                    </span>

                    {isHit1 ? (
                      <span className="inline-flex items-center gap-1 text-[11px] text-emerald-400 font-semibold bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/60">
                        <CheckCircle2 className="size-3" />
                        Hit@1
                      </span>
                    ) : isHit3 ? (
                      <span className="inline-flex items-center gap-1 text-[11px] text-amber-400 font-semibold bg-amber-950/60 px-2 py-0.5 rounded border border-amber-800/60">
                        Hit@3
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[11px] text-rose-400 font-semibold bg-rose-950/60 px-2 py-0.5 rounded border border-rose-800/60">
                        Miss
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {errorMsg && (
          <div className="mt-4 p-3 rounded-lg bg-rose-950/40 border border-rose-900/50 text-xs text-rose-300 flex items-center gap-2">
            <AlertCircle className="size-4 text-rose-400" />
            <span>{errorMsg}</span>
          </div>
        )}
      </div>
    </div>
  );
};
