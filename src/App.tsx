import React, { useState, useEffect, useRef } from 'react';
import { StoryTurn, StoryOption, GameSettings } from './types';
import { GenreSelector } from './components/GenreSelector';
import { TurnCard } from './components/TurnCard';
import { TimelineModal } from './components/TimelineModal';
import { ExportModal } from './components/ExportModal';
import { sound } from './soundEngine';
import {
  Volume2,
  VolumeX,
  GitBranch,
  Download,
  RotateCcw,
  Sparkles,
  Compass,
  AlertCircle,
  Shield,
  Activity,
  Layers,
} from 'lucide-react';

export default function App() {
  const [gameStarted, setGameStarted] = useState(false);
  const [settings, setSettings] = useState<GameSettings | null>(null);
  const [turns, setTurns] = useState<StoryTurn[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorNotice, setErrorNotice] = useState<string | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [showTimelineModal, setShowTimelineModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);

  const turnsEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to latest turn when updated
  useEffect(() => {
    if (turns.length > 0) {
      turnsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [turns, isLoading]);

  // Handle Mute
  const handleToggleSound = () => {
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    sound.setMuted(nextMuted);
    if (!nextMuted && settings) {
      sound.startAmbient(settings.genre);
    } else {
      sound.stopAmbient();
    }
  };

  // Start new adventure from GenreSelector
  const handleStartAdventure = async (newSettings: GameSettings) => {
    setIsLoading(true);
    setErrorNotice(null);
    setSettings(newSettings);

    try {
      sound.startAmbient(newSettings.genre);

      const res = await fetch('/api/story/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          genre: newSettings.genreTitle,
          customGenre: newSettings.customIdea,
          protagonistName: newSettings.protagonistName,
        }),
      });

      const json = await res.json();
      if (!json.success && !json.data) {
        throw new Error(json.error || 'No se pudo iniciar la historia.');
      }

      const initialTurn: StoryTurn = {
        id: `turn-1-${Date.now()}`,
        timestamp: Date.now(),
        chapter: 1,
        dimension: json.data.dimension,
        narrative: json.data.narrative,
        status: json.data.status,
        options: json.data.options,
        rawMarkdown: json.data.rawMarkdown,
        isGameOver: json.data.isGameOver,
      };

      setTurns([initialTurn]);
      setGameStarted(true);

      if (json.errorNotice) {
        setErrorNotice(json.errorNotice);
      }
    } catch (err: any) {
      console.error(err);
      setErrorNotice(err.message || 'Error al iniciar aventura.');
    } finally {
      setIsLoading(false);
    }
  };

  // Execute a choice from the 3 options
  const handleSelectOption = async (option: StoryOption) => {
    if (isLoading || turns.length === 0) return;

    const currentTurn = turns[turns.length - 1];

    // Mark current turn with the selected choice
    const updatedTurns = [...turns];
    updatedTurns[updatedTurns.length - 1] = {
      ...currentTurn,
      choiceMade: option.text,
      choiceApproach: option.approach,
    };
    setTurns(updatedTurns);

    setIsLoading(true);
    setErrorNotice(null);

    // Format history for GM context
    const historyPayload = updatedTurns.map((t) => ({
      role: 'assistant' as const,
      content: t.rawMarkdown,
    }));

    try {
      const res = await fetch('/api/story/turn', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          history: historyPayload,
          choiceText: option.text,
          choiceApproach: option.approach,
          currentStats: currentTurn.status,
          currentDimension: currentTurn.dimension,
        }),
      });

      const json = await res.json();
      if (!json.success && !json.data) {
        throw new Error(json.error || 'Error al avanzar turno.');
      }

      const nextChapter = currentTurn.chapter + 1;
      const nextTurn: StoryTurn = {
        id: `turn-${nextChapter}-${Date.now()}`,
        timestamp: Date.now(),
        chapter: nextChapter,
        dimension: json.data.dimension,
        narrative: json.data.narrative,
        status: json.data.status,
        options: json.data.options,
        rawMarkdown: json.data.rawMarkdown,
        isGameOver: json.data.isGameOver,
      };

      if (nextTurn.isGameOver) {
        sound.playCollapse();
      } else {
        sound.playRift();
      }

      setTurns((prev) => [...prev, nextTurn]);
    } catch (err: any) {
      console.error(err);
      setErrorNotice(err.message || 'Error al procesar la elección.');
    } finally {
      setIsLoading(false);
    }
  };

  // Execute a custom action written by the player
  const handleSubmitCustomAction = async (customActionText: string) => {
    if (isLoading || turns.length === 0) return;

    const currentTurn = turns[turns.length - 1];

    const updatedTurns = [...turns];
    updatedTurns[updatedTurns.length - 1] = {
      ...currentTurn,
      choiceMade: customActionText,
      choiceApproach: 'wit',
    };
    setTurns(updatedTurns);

    setIsLoading(true);
    setErrorNotice(null);

    const historyPayload = updatedTurns.map((t) => ({
      role: 'assistant' as const,
      content: t.rawMarkdown,
    }));

    try {
      const res = await fetch('/api/story/turn', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          history: historyPayload,
          customAction: customActionText,
          currentStats: currentTurn.status,
          currentDimension: currentTurn.dimension,
        }),
      });

      const json = await res.json();
      if (!json.success && !json.data) {
        throw new Error(json.error || 'Error al procesar acción personalizada.');
      }

      const nextChapter = currentTurn.chapter + 1;
      const nextTurn: StoryTurn = {
        id: `turn-${nextChapter}-${Date.now()}`,
        timestamp: Date.now(),
        chapter: nextChapter,
        dimension: json.data.dimension,
        narrative: json.data.narrative,
        status: json.data.status,
        options: json.data.options,
        rawMarkdown: json.data.rawMarkdown,
        isGameOver: json.data.isGameOver,
      };

      if (nextTurn.isGameOver) {
        sound.playCollapse();
      } else {
        sound.playRift();
      }

      setTurns((prev) => [...prev, nextTurn]);
    } catch (err: any) {
      console.error(err);
      setErrorNotice(err.message || 'Error al procesar acción.');
    } finally {
      setIsLoading(false);
    }
  };

  // Rewind timeline to a specific chapter
  const handleRewindToChapter = (chapterIndex: number) => {
    if (chapterIndex < 0 || chapterIndex >= turns.length) return;
    const rewoundTurns = turns.slice(0, chapterIndex + 1);
    // clear the choiceMade on the rewound active turn so options re-enable
    rewoundTurns[rewoundTurns.length - 1] = {
      ...rewoundTurns[rewoundTurns.length - 1],
      choiceMade: undefined,
      choiceApproach: undefined,
    };
    setTurns(rewoundTurns);
  };

  // Reset entire adventure back to genre selection
  const handleResetToLobby = () => {
    sound.stopAmbient();
    sound.playRewind();
    setGameStarted(false);
    setTurns([]);
    setSettings(null);
    setErrorNotice(null);
  };

  // Current latest turn
  const latestTurn = turns.length > 0 ? turns[turns.length - 1] : null;

  return (
    <div className="min-h-screen multiverse-bg text-slate-100 flex flex-col relative selection:bg-indigo-600 selection:text-white">
      {/* Subtle CRT scanline overlay */}
      <div className="fixed inset-0 scanline-overlay z-10 pointer-events-none" />

      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-30 bg-slate-950/80 backdrop-blur-md border-b border-indigo-500/20 px-4 py-3">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={handleResetToLobby}
              className="flex items-center gap-2 group text-left"
              title="Volver al inicio"
            >
              <div className="w-8 h-8 rounded-lg bg-indigo-600/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400 group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-sm">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <span className="font-bold text-sm sm:text-base tracking-tight font-['Cinzel'] text-white">
                  Chronoverse
                </span>
                <span className="hidden sm:inline-block ml-2 text-[10px] font-mono px-1.5 py-0.5 rounded bg-indigo-950/80 text-indigo-300 border border-indigo-800">
                  Game Master Engine
                </span>
              </div>
            </button>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {gameStarted && (
              <>
                <button
                  onClick={() => setShowTimelineModal(true)}
                  className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 hover:border-indigo-400 text-xs font-mono text-slate-300 hover:text-white flex items-center gap-1.5 transition-colors shadow-sm"
                  title="Ver mapa de líneas temporales"
                >
                  <GitBranch className="w-3.5 h-3.5 text-indigo-400" />
                  <span className="hidden md:inline">Cartografía</span>
                  <span className="px-1.5 py-0.2 rounded bg-indigo-950 text-indigo-300 text-[10px]">
                    Cap. {turns.length}
                  </span>
                </button>

                <button
                  onClick={() => setShowExportModal(true)}
                  className="p-1.5 sm:px-3 sm:py-1.5 rounded-lg bg-slate-900 border border-slate-700 hover:border-slate-500 text-xs font-mono text-slate-300 hover:text-white flex items-center gap-1.5 transition-colors shadow-sm"
                  title="Exportar crónica de la aventura"
                >
                  <Download className="w-3.5 h-3.5 text-slate-400" />
                  <span className="hidden md:inline">Exportar</span>
                </button>

                <button
                  onClick={handleResetToLobby}
                  className="p-1.5 sm:px-3 sm:py-1.5 rounded-lg bg-slate-900 border border-slate-700 hover:border-rose-500/50 text-xs font-mono text-slate-300 hover:text-rose-300 flex items-center gap-1.5 transition-colors shadow-sm"
                  title="Reiniciar y elegir otro género"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-rose-400" />
                  <span className="hidden lg:inline">Reiniciar</span>
                </button>
              </>
            )}

            <button
              onClick={handleToggleSound}
              className={`p-2 rounded-lg border transition-colors ${
                isMuted
                  ? 'bg-slate-900 text-slate-500 border-slate-800 hover:text-slate-300'
                  : 'bg-indigo-950/80 text-indigo-300 border-indigo-700/60 shadow-sm'
              }`}
              title={isMuted ? 'Activar sonido ambiental' : 'Silenciar sonido'}
            >
              {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4 animate-pulse" />}
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-4xl w-full mx-auto p-4 sm:p-6 relative z-20">
        {/* Error notification banner if needed */}
        {errorNotice && (
          <div className="mb-6 p-4 rounded-xl bg-amber-950/40 border border-amber-600/40 text-amber-200 text-xs flex items-center justify-between gap-3 shadow-lg">
            <div className="flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
              <span>{errorNotice}</span>
            </div>
            <button
              onClick={() => setErrorNotice(null)}
              className="text-amber-400 hover:text-white font-mono uppercase text-[10px]"
            >
              Descartar
            </button>
          </div>
        )}

        {!gameStarted ? (
          /* STEP 1: INITIAL EXPERIENCE - Genre Selection & GM Introduction */
          <GenreSelector onStartAdventure={handleStartAdventure} isLoading={isLoading} />
        ) : (
          /* STEP 2: ACTIVE STORY TURNS & CHOICES */
          <div className="space-y-6">
            {/* Quick Status Bar */}
            {latestTurn && (
              <div className="sticky top-16 z-20 p-3 rounded-xl bg-slate-950/90 border border-indigo-500/30 backdrop-blur-md shadow-lg flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                  <span className="text-xs font-mono text-cyan-400 font-semibold uppercase tracking-wider">
                    {latestTurn.dimension}
                  </span>
                </div>
                <div className="text-xs font-mono text-slate-400 truncate max-w-md">
                  {latestTurn.status}
                </div>
              </div>
            )}

            {/* List of Story Turns */}
            <div className="space-y-6">
              {turns.map((turn, index) => {
                const isLatest = index === turns.length - 1;
                return (
                  <TurnCard
                    key={turn.id}
                    turn={turn}
                    isLatest={isLatest}
                    onSelectOption={handleSelectOption}
                    onSubmitCustomAction={handleSubmitCustomAction}
                    isLoading={isLoading}
                    onRestartTimeline={handleResetToLobby}
                  />
                );
              })}
            </div>

            {/* Loading Indicator while Gemini generates response */}
            {isLoading && (
              <div className="p-8 rounded-2xl bg-slate-900/80 border border-indigo-500/40 text-center space-y-4 shadow-xl">
                <div className="relative inline-flex items-center justify-center">
                  <div className="w-12 h-12 rounded-full border-2 border-indigo-500/20 border-t-indigo-400 animate-spin" />
                  <Sparkles className="w-5 h-5 text-indigo-400 absolute animate-pulse" />
                </div>
                <div>
                  <h4 className="text-base font-semibold text-white font-['Rajdhani']">
                    El Game Master está remodelando la realidad...
                  </h4>
                  <p className="text-xs text-slate-400 font-mono mt-1">
                    Calculando ramificación temporal y consecuencias multiversales
                  </p>
                </div>
              </div>
            )}

            <div ref={turnsEndRef} />
          </div>
        )}
      </main>

      {/* Modals */}
      <TimelineModal
        isOpen={showTimelineModal}
        onClose={() => setShowTimelineModal(false)}
        turns={turns}
        onRewindToChapter={handleRewindToChapter}
      />

      <ExportModal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        turns={turns}
        genreTitle={settings?.genreTitle || 'Aventura Multiversal'}
      />
    </div>
  );
}
