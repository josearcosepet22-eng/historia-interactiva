import React, { useState } from 'react';
import { GenreKey, GameSettings } from '../types';
import { Terminal, Sparkles, Radio, Compass, ShieldAlert, Cpu, Flame, Orbit, ArrowRight, Dna } from 'lucide-react';
import { sound } from '../soundEngine';

interface GenreSelectorProps {
  onStartAdventure: (settings: GameSettings) => void;
  isLoading: boolean;
}

export const GENRE_PRESETS = [
  {
    id: 'cyberpunk' as GenreKey,
    number: 1,
    name: 'Misterio Noir Cyberpunk',
    dimensionTag: 'Dimensión Delta-9: Neo-Kowloon 2099',
    tagline: 'Lluvia ácida, implantes cuánticos y corporaciones omnipotentes',
    description: 'Investiga la misteriosa desaparición de tu socio en un submundo lluvioso donde la memoria humana es hackeada y los recuerdos pueden pertenecer a una línea de tiempo borrada.',
    icon: Cpu,
    color: 'from-cyan-500/20 via-blue-900/30 to-purple-950/40',
    borderColor: 'border-cyan-500/40 hover:border-cyan-400',
    accentColor: 'text-cyan-400',
    badgeBg: 'bg-cyan-950/80 text-cyan-300 border-cyan-700/60',
    initialInventory: 'Deck cibernético, Cuchilla térmica, Chip neuronal sellado',
  },
  {
    id: 'fantasy' as GenreKey,
    number: 2,
    name: 'Fantasía Oscura y Multiversal',
    dimensionTag: 'Dimensión Umbracaelum-III: El Reino Roto',
    tagline: 'Ruinas astrales, dioses fracturados y sangre de éter',
    description: 'Recorre un reino desmoronado suspendido en el vacío estelar. Como Guardián del Umbral, debes sellar las fisuras eldritch antes de que devoren los últimos fragmentos de la realidad.',
    icon: Flame,
    color: 'from-amber-500/20 via-purple-950/40 to-black',
    borderColor: 'border-purple-500/40 hover:border-purple-400',
    accentColor: 'text-purple-300',
    badgeBg: 'bg-purple-950/80 text-purple-200 border-purple-700/60',
    initialInventory: 'Anillo de resonancia astral, Daga de plata estelar, Lágrimas de éter',
  },
  {
    id: 'scifi' as GenreKey,
    number: 3,
    name: 'Ciencia Ficción / Anomalía Espacio-Temporal',
    dimensionTag: 'Dimensión Crono-0: Estación Event Horizon VII',
    tagline: 'Agujeros negros, superposición de realidades y bucles temporales',
    description: 'Despiertas en una estación orbital atrapada en el horizonte de sucesos de una singularidad taquiónica. Pasado, presente y futuro colapsan simultáneamente mientras la IA de a bordo pierde la cordura.',
    icon: Orbit,
    color: 'from-emerald-500/20 via-indigo-950/40 to-slate-950',
    borderColor: 'border-emerald-500/40 hover:border-emerald-400',
    accentColor: 'text-emerald-400',
    badgeBg: 'bg-emerald-950/80 text-emerald-300 border-emerald-700/60',
    initialInventory: 'Traje presurizado EVA, Multillave gravitatoria, Unidad de estasis',
  },
];

export const GenreSelector: React.FC<GenreSelectorProps> = ({ onStartAdventure, isLoading }) => {
  const [selectedGenre, setSelectedGenre] = useState<GenreKey>('cyberpunk');
  const [customIdea, setCustomIdea] = useState('');
  const [protagonistName, setProtagonistName] = useState('Caminante del Vórtice');
  const [tension, setTension] = useState<'normal' | 'hard' | 'nightmare'>('normal');
  const [showAdvanced, setShowAdvanced] = useState(false);

  const handleSelectGenre = (genreKey: GenreKey) => {
    sound.playClick('wit');
    setSelectedGenre(genreKey);
  };

  const handleStart = (e: React.FormEvent) => {
    e.preventDefault();
    sound.playRift();

    let genreTitle = '';
    if (selectedGenre === 'custom') {
      genreTitle = customIdea.trim() || 'Aventura Multiversal Libre';
    } else {
      const found = GENRE_PRESETS.find((p) => p.id === selectedGenre);
      genreTitle = found ? `${found.number}. ${found.name}` : selectedGenre;
    }

    onStartAdventure({
      genre: selectedGenre,
      genreTitle,
      customIdea: customIdea.trim(),
      protagonistName: protagonistName.trim() || 'Caminante del Vórtice',
      tension,
    });
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Game Master Intro Header */}
      <div className="relative p-6 sm:p-8 rounded-2xl bg-slate-900/80 border border-indigo-500/30 backdrop-blur-md shadow-2xl mb-8 overflow-hidden">
        <div className="absolute -top-12 -right-12 w-48 h-48 bg-indigo-600/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-10 -left-10 w-44 h-44 bg-purple-600/15 rounded-full blur-3xl pointer-events-none" />

        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-400/40 flex items-center justify-center text-indigo-400">
            <Radio className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs uppercase font-mono tracking-widest text-indigo-400 font-semibold">
                Transmisión Cuántica del Game Master
              </span>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white font-['Cinzel']">
              Chronoverse Engine
            </h1>
          </div>
        </div>

        <div className="space-y-3 text-slate-300 text-sm sm:text-base leading-relaxed border-l-2 border-indigo-500/50 pl-4 py-1">
          <p>
            <strong className="text-indigo-200">«Saludos, viajero del continuo.</strong> Soy el{' '}
            <span className="text-white font-semibold">Motor de Historias Interactivas y Game Master</span> de este
            multiverso. En esta simulación de <em className="text-indigo-300">"Elige tu propia aventura"</em>, ninguna
            elección es neutra: cada paso que des alterará las leyes de la física, la magia o la causalidad temporal.»
          </p>
          <p className="text-slate-400 text-xs sm:text-sm">
            Para iniciar tu travesía, elige el género de tu aventura entre los 3 planos fundamentales o define tu propio
            universo experimental:
          </p>
        </div>
      </div>

      {/* Preset Cards */}
      <form onSubmit={handleStart} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {GENRE_PRESETS.map((preset) => {
            const Icon = preset.icon;
            const isSelected = selectedGenre === preset.id;
            return (
              <div
                key={preset.id}
                onClick={() => handleSelectGenre(preset.id)}
                className={`relative group cursor-pointer rounded-xl p-5 border transition-all duration-300 flex flex-col justify-between ${
                  isSelected
                    ? `bg-slate-900/90 ${preset.borderColor} ring-2 ring-indigo-500/50 shadow-lg shadow-indigo-950/50 scale-[1.02]`
                    : 'bg-slate-900/40 border-slate-800 hover:border-slate-700 hover:bg-slate-900/70'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span
                      className={`text-xs font-mono font-bold px-2 py-0.5 rounded border ${
                        isSelected ? preset.badgeBg : 'bg-slate-800 text-slate-400 border-slate-700'
                      }`}
                    >
                      Opción [{preset.number}]
                    </span>
                    <Icon className={`w-5 h-5 ${isSelected ? preset.accentColor : 'text-slate-500'}`} />
                  </div>

                  <h3 className="font-semibold text-lg text-white mb-1 group-hover:text-indigo-200 transition-colors">
                    {preset.name}
                  </h3>
                  <div className="text-xs text-indigo-400/90 font-mono mb-2">{preset.dimensionTag}</div>
                  <p className="text-xs text-slate-400 leading-relaxed mb-4">{preset.description}</p>
                </div>

                <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between">
                  <span className="text-[11px] text-slate-500 font-mono italic truncate max-w-[80%]">
                    {preset.tagline}
                  </span>
                  <div
                    className={`w-4 h-4 rounded-full border flex items-center justify-center transition-all ${
                      isSelected ? 'border-indigo-400 bg-indigo-500' : 'border-slate-600'
                    }`}
                  >
                    {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Custom Idea / 4th Alternative */}
        <div
          onClick={() => handleSelectGenre('custom')}
          className={`cursor-pointer rounded-xl p-5 border transition-all duration-300 ${
            selectedGenre === 'custom'
              ? 'bg-slate-900/90 border-purple-500 ring-2 ring-purple-500/50'
              : 'bg-slate-900/40 border-slate-800 hover:border-slate-700'
          }`}
        >
          <div className="flex items-center gap-3 mb-2">
            <Sparkles className="w-5 h-5 text-purple-400" />
            <h4 className="font-semibold text-white text-base">
              ¿Deseas proponer tu propia idea multiversal o híbrida?
            </h4>
          </div>
          <p className="text-xs text-slate-400 mb-3">
            Escribe cualquier premisa o fusión que desees (ej: <em>"Un western lovecraftiano con pistolas cuánticas en Marte"</em> o <em>"Una corte barroca flotante atrapada en un bucle temporal"</em>).
          </p>
          <input
            type="text"
            value={customIdea}
            onChange={(e) => {
              setCustomIdea(e.target.value);
              setSelectedGenre('custom');
            }}
            placeholder="Escribe tu idea de aventura personalizada..."
            className="w-full bg-slate-950/80 border border-slate-700 rounded-lg px-4 py-2.5 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-purple-500 transition-colors"
          />
        </div>

        {/* Optional character name & tension toggle */}
        <div className="bg-slate-900/40 border border-slate-800/80 rounded-xl p-4">
          <button
            type="button"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="text-xs font-mono text-indigo-400 hover:text-indigo-300 flex items-center gap-2"
          >
            <Compass className="w-3.5 h-3.5" />
            {showAdvanced ? 'Ocultar parámetros del protagonista' : 'Personalizar protagonista y nivel de paradoja (Opcional)'}
          </button>

          {showAdvanced && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4 pt-3 border-t border-slate-800">
              <div>
                <label className="block text-xs font-mono text-slate-400 mb-1">
                  Nombre o Título del Protagonista:
                </label>
                <input
                  type="text"
                  value={protagonistName}
                  onChange={(e) => setProtagonistName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-slate-400 mb-1">
                  Tensión y Letalidad Multiversal:
                </label>
                <select
                  value={tension}
                  onChange={(e) => setTension(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
                >
                  <option value="normal">Equilibrada (Historia rica y decisiones tácticas)</option>
                  <option value="hard">Implacable (Riesgo alto de paradoja y heridas graves)</option>
                  <option value="nightmare">Pesadilla Cuántica (Cualquier error colapsa la realidad)</option>
                </select>
              </div>
            </div>
          )}
        </div>

        {/* Launch Button */}
        <div className="flex justify-center pt-2">
          <button
            type="submit"
            disabled={isLoading}
            className="group relative inline-flex items-center gap-3 px-8 py-3.5 rounded-xl bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 text-white font-medium shadow-xl shadow-indigo-600/30 hover:shadow-indigo-500/50 hover:brightness-110 active:scale-98 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Sintonizando coordenadas dimensionales...</span>
              </>
            ) : (
              <>
                <span className="font-semibold tracking-wide">Comenzar Aventura en el Multiverso</span>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
