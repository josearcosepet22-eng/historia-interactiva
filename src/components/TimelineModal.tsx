import React from 'react';
import { StoryTurn } from '../types';
import { GitBranch, X, Compass, CheckCircle, RotateCcw, AlertOctagon } from 'lucide-react';
import { sound } from '../soundEngine';

interface TimelineModalProps {
  isOpen: boolean;
  onClose: () => void;
  turns: StoryTurn[];
  onRewindToChapter: (chapterIndex: number) => void;
}

export const TimelineModal: React.FC<TimelineModalProps> = ({
  isOpen,
  onClose,
  turns,
  onRewindToChapter,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl max-h-[85vh] bg-slate-900 border border-indigo-500/40 rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/80">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
              <GitBranch className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-white font-['Rajdhani']">
                Cartografía del Multiverso & Línea Temporal
              </h3>
              <p className="text-xs text-slate-400">
                Historial de realidades visitadas y decisiones que remodelaron el continuo.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Timeline Path Content */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-6">
          <div className="relative pl-6 sm:pl-8 space-y-6 before:absolute before:left-3 sm:before:left-4 before:top-3 before:bottom-3 before:w-0.5 before:bg-gradient-to-b before:from-indigo-500 before:via-purple-500 before:to-cyan-500">
            {turns.map((turn, index) => {
              const isCurrent = index === turns.length - 1;
              return (
                <div key={turn.id} className="relative group">
                  {/* Timeline dot */}
                  <div
                    className={`absolute -left-6 sm:-left-8 top-1 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                      isCurrent
                        ? 'border-cyan-400 bg-cyan-950 text-cyan-300 ring-4 ring-cyan-500/20'
                        : 'border-indigo-500 bg-slate-950 text-indigo-400'
                    }`}
                  >
                    {turn.isGameOver ? (
                      <AlertOctagon className="w-3.5 h-3.5 text-rose-400" />
                    ) : (
                      <span className="text-[10px] font-mono font-bold">{turn.chapter}</span>
                    )}
                  </div>

                  {/* Card for turn */}
                  <div
                    className={`p-4 rounded-xl border transition-all ${
                      isCurrent
                        ? 'bg-slate-950/90 border-cyan-500/40 shadow-lg shadow-cyan-950/30'
                        : 'bg-slate-950/40 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-semibold text-indigo-400">
                          Capítulo {turn.chapter}
                        </span>
                        <span className="text-xs text-slate-500">•</span>
                        <span className="text-xs font-semibold text-slate-200">{turn.dimension}</span>
                      </div>

                      {!isCurrent && (
                        <button
                          onClick={() => {
                            sound.playRewind();
                            onRewindToChapter(index);
                            onClose();
                          }}
                          className="text-[11px] font-mono px-2.5 py-1 rounded bg-indigo-950/80 hover:bg-indigo-900 border border-indigo-700/60 text-indigo-300 flex items-center gap-1.5 transition-colors"
                        >
                          <RotateCcw className="w-3 h-3" />
                          Rebobinar aquí
                        </button>
                      )}
                    </div>

                    <p className="text-xs text-slate-300 line-clamp-2 italic mb-2">
                      "{turn.narrative}"
                    </p>

                    {turn.choiceMade ? (
                      <div className="flex items-center gap-1.5 text-[11px] font-mono text-emerald-400 bg-emerald-950/40 px-2 py-1 rounded border border-emerald-800/40">
                        <CheckCircle className="w-3 h-3 shrink-0" />
                        <span className="truncate">Decisión: {turn.choiceMade}</span>
                      </div>
                    ) : (
                      <div className="text-[11px] font-mono text-cyan-300">
                        Punto de bifurcación actual activo...
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-mono text-slate-200 transition-colors"
          >
            Cerrar Cartografía
          </button>
        </div>
      </div>
    </div>
  );
};
