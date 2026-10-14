import React, { useState } from 'react';
import { StoryTurn, StoryOption } from '../types';
import {
  Compass,
  Swords,
  Eye,
  Sparkles,
  Volume2,
  VolumeX,
  Send,
  RotateCcw,
  Shield,
  Activity,
  Layers,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import { sound } from '../soundEngine';

interface TurnCardProps {
  turn: StoryTurn;
  isLatest: boolean;
  onSelectOption: (option: StoryOption) => void;
  onSubmitCustomAction: (actionText: string) => void;
  isLoading: boolean;
  onRestartTimeline?: () => void;
}

export const TurnCard: React.FC<TurnCardProps> = ({
  turn,
  isLatest,
  onSelectOption,
  onSubmitCustomAction,
  isLoading,
  onRestartTimeline,
}) => {
  const [customText, setCustomText] = useState('');
  const [isSpeaking, setIsSpeaking] = useState(false);

  // Helper to read narrative with Web Speech API
  const handleToggleSpeech = () => {
    if (!('speechSynthesis' in window)) return;

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(turn.narrative);
    utterance.lang = 'es-ES';
    utterance.rate = 1.0;
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    setIsSpeaking(true);
    window.speechSynthesis.speak(utterance);
  };

  const handleOptionClick = (opt: StoryOption) => {
    if (isLoading) return;
    if (opt.approach === 'restart' && onRestartTimeline) {
      sound.playRewind();
      onRestartTimeline();
      return;
    }
    sound.playClick(opt.approach);
    onSelectOption(opt);
  };

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customText.trim() || isLoading) return;
    sound.playClick('wit');
    onSubmitCustomAction(customText.trim());
    setCustomText('');
  };

  // Icon and badge styling for the 3 distinct approaches
  const getApproachDetails = (approach: StoryOption['approach'], id: number) => {
    switch (approach) {
      case 'action':
        return {
          icon: Swords,
          label: 'Enfoque: Acción / Confrontación Directa',
          badgeClass: 'bg-rose-950/70 border-rose-600/50 text-rose-300',
          hoverClass: 'hover:border-rose-500 hover:bg-rose-950/40',
          accentColor: 'text-rose-400',
        };
      case 'stealth':
        return {
          icon: Eye,
          label: 'Enfoque: Sigilo / Investigación / Análisis',
          badgeClass: 'bg-sky-950/70 border-sky-600/50 text-sky-300',
          hoverClass: 'hover:border-sky-500 hover:bg-sky-950/40',
          accentColor: 'text-sky-400',
        };
      case 'wit':
        return {
          icon: Sparkles,
          label: 'Enfoque: Ingenio / Giro Inesperado Multiversal',
          badgeClass: 'bg-purple-950/70 border-purple-600/50 text-purple-300',
          hoverClass: 'hover:border-purple-500 hover:bg-purple-950/40',
          accentColor: 'text-purple-400',
        };
      case 'restart':
      default:
        return {
          icon: RotateCcw,
          label: 'Reinicio Cuántico de Línea Temporal',
          badgeClass: 'bg-amber-950/70 border-amber-600/50 text-amber-300',
          hoverClass: 'hover:border-amber-500 hover:bg-amber-950/40',
          accentColor: 'text-amber-400',
        };
    }
  };

  const wordCount = turn.narrative.split(/\s+/).filter(Boolean).length;

  return (
    <div
      className={`relative rounded-2xl border transition-all duration-300 overflow-hidden ${
        isLatest
          ? 'bg-slate-900/90 border-indigo-500/40 shadow-2xl shadow-indigo-950/40 ring-1 ring-indigo-500/20'
          : 'bg-slate-900/40 border-slate-800/80 opacity-85 hover:opacity-100'
      }`}
    >
      {/* Decorative top accent line */}
      <div
        className={`h-1 w-full ${
          turn.isGameOver
            ? 'bg-gradient-to-r from-red-600 via-amber-500 to-red-600'
            : 'bg-gradient-to-r from-indigo-500 via-purple-500 to-cyan-500'
        }`}
      />

      <div className="p-5 sm:p-7 space-y-6">
        {/* SECTION 1: [Nivel / Dimensión] */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <span className="p-1.5 rounded-lg bg-indigo-500/10 border border-indigo-500/30 text-indigo-400">
              <Compass className="w-4 h-4" />
            </span>
            <div>
              <div className="text-[10px] font-mono tracking-widest text-indigo-400/90 uppercase font-semibold">
                [Nivel / Dimensión]
              </div>
              <div className="text-sm sm:text-base font-semibold text-slate-100 font-['Rajdhani'] tracking-wide">
                {turn.dimension}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono text-slate-500 bg-slate-950 px-2.5 py-1 rounded-md border border-slate-800">
              Capítulo {turn.chapter} • {wordCount} palabras
            </span>
            <button
              onClick={handleToggleSpeech}
              title={isSpeaking ? 'Detener lectura' : 'Escuchar narración del Game Master'}
              className={`p-1.5 rounded-lg border transition-colors ${
                isSpeaking
                  ? 'bg-indigo-600 text-white border-indigo-500 animate-pulse'
                  : 'bg-slate-800/80 text-slate-400 border-slate-700 hover:text-slate-200'
              }`}
            >
              {isSpeaking ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* SECTION 2: [Narrativa] */}
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-purple-400 uppercase tracking-wider mb-2 font-semibold">
            <Layers className="w-3.5 h-3.5" />
            [Narrativa]
          </div>
          <div className="text-slate-200 text-sm sm:text-base leading-relaxed space-y-3 font-normal selection:bg-indigo-600 selection:text-white">
            {turn.narrative.split('\n\n').map((paragraph, idx) => (
              <p key={idx} className="first-letter:text-lg first-letter:font-bold first-letter:text-indigo-300">
                {paragraph}
              </p>
            ))}
          </div>
        </div>

        {/* SECTION 3: [Estado Actual] */}
        <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          <div className="flex items-start sm:items-center gap-2.5 text-xs text-slate-300 font-mono">
            <Activity className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5 sm:mt-0" />
            <div>
              <span className="text-slate-400 font-semibold mr-1.5">[Estado Actual]:</span>
              <span className="text-slate-200">{turn.status}</span>
            </div>
          </div>
        </div>

        {/* Previous Turn Choice Made (if not latest) */}
        {!isLatest && turn.choiceMade && (
          <div className="p-3 rounded-xl bg-indigo-950/30 border border-indigo-800/40 text-xs text-indigo-300 flex items-center gap-2 font-mono">
            <CheckCircle2 className="w-4 h-4 text-indigo-400 shrink-0" />
            <span>
              <strong>Tu elección fue:</strong> {turn.choiceMade}
            </span>
          </div>
        )}

        {/* SECTION 4: [Tus Opciones] (Only interactive on latest turn) */}
        {isLatest && (
          <div className="pt-2 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-mono text-cyan-400 uppercase tracking-wider font-semibold">
                <Sparkles className="w-3.5 h-3.5" />
                [Tus Opciones]
              </div>
              <span className="text-[11px] font-mono text-slate-500">
                {turn.isGameOver ? 'Línea temporal colapsada' : 'Selecciona una alternativa o escribe tu acción'}
              </span>
            </div>

            {turn.isGameOver && (
              <div className="p-4 rounded-xl bg-rose-950/50 border border-rose-500/50 text-rose-200 text-xs sm:text-sm flex items-center gap-3">
                <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />
                <div>
                  <strong className="block text-rose-300 font-semibold mb-0.5">
                    COLAPSO CUÁNTICO DE LA LÍNEA TEMPORAL
                  </strong>
                  Tu avatar ha sufrido un desenlace irreversible en este plano. Puedes reiniciar la simulación o
                  retroceder a un momento previo en el árbol multiversal.
                </div>
              </div>
            )}

            {/* Render exactly 3 choices / buttons */}
            <div className="grid grid-cols-1 gap-2.5">
              {turn.options.map((opt) => {
                const details = getApproachDetails(opt.approach, opt.id);
                const Icon = details.icon;

                return (
                  <button
                    key={opt.id}
                    onClick={() => handleOptionClick(opt)}
                    disabled={isLoading}
                    className={`group w-full text-left p-3.5 sm:p-4 rounded-xl border bg-slate-950/70 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-start gap-3.5 ${
                      details.hoverClass
                    } hover:shadow-md hover:translate-y-[-1px] active:translate-y-[0px]`}
                  >
                    <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-slate-900 border border-slate-700/80 font-mono font-bold text-sm text-indigo-300 shrink-0 group-hover:border-indigo-400 group-hover:bg-indigo-950/50 transition-colors">
                      [{opt.id}]
                    </div>

                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span
                          className={`text-[10px] font-mono px-2 py-0.5 rounded border ${details.badgeClass} flex items-center gap-1`}
                        >
                          <Icon className="w-3 h-3" />
                          {details.label}
                        </span>
                      </div>
                      <div className="text-sm font-medium text-slate-100 group-hover:text-white leading-snug">
                        {opt.text}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Custom Freeform Action Input */}
            {!turn.isGameOver && (
              <form onSubmit={handleCustomSubmit} className="mt-4 pt-4 border-t border-slate-800/80">
                <div className="text-xs font-mono text-slate-400 mb-1.5 flex items-center gap-1.5">
                  <span>¿Prefieres forjar tu propia acción no listada?</span>
                  <span className="text-indigo-400 font-semibold">(El Game Master la adaptará)</span>
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={customText}
                    onChange={(e) => setCustomText(e.target.value)}
                    disabled={isLoading}
                    placeholder="Ej: Utilizar el espejo roto para reflejar el láser hacia el generador..."
                    className="flex-1 bg-slate-950 border border-slate-700/80 rounded-xl px-4 py-2.5 text-xs sm:text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
                  />
                  <button
                    type="submit"
                    disabled={!customText.trim() || isLoading}
                    className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs sm:text-sm font-medium flex items-center gap-1.5 transition-all shadow-md shrink-0"
                  >
                    <Send className="w-4 h-4" />
                    <span className="hidden sm:inline">Ejecutar</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
