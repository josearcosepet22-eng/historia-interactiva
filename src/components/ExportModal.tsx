import React, { useState } from 'react';
import { StoryTurn } from '../types';
import { Download, Copy, Check, X, BookOpen } from 'lucide-react';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  turns: StoryTurn[];
  genreTitle: string;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  turns,
  genreTitle,
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const markdownContent = `# Crónica del Multiverso: ${genreTitle}
*Generado por Chronoverse Engine*
Fecha: ${new Date().toLocaleDateString()}

---

${turns
  .map(
    (turn) => `## Capítulo ${turn.chapter} | ${turn.dimension}

${turn.narrative}

**Estado en este punto:**
${turn.status}

${turn.choiceMade ? `> **Elección tomada:** ${turn.choiceMade}\n` : ''}
`
  )
  .join('\n---\n\n')}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(markdownContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([markdownContent], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `cronica-multiverso-${Date.now()}.md`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-indigo-500/40 rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/80">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-white font-['Rajdhani']">
                Exportar Crónica Multiversal
              </h3>
              <p className="text-xs text-slate-400">
                Descarga o copia tu odisea en formato Markdown estructurado.
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

        <div className="p-4 sm:p-6">
          <textarea
            readOnly
            value={markdownContent}
            rows={12}
            className="w-full bg-slate-950 font-mono text-xs text-slate-300 p-3.5 rounded-xl border border-slate-800 focus:outline-none resize-none leading-relaxed"
          />
        </div>

        <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between">
          <button
            onClick={handleCopy}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-mono text-slate-200 flex items-center gap-2 transition-colors"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            {copied ? '¡Copiado!' : 'Copiar Portapapeles'}
          </button>

          <button
            onClick={handleDownload}
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-mono text-white flex items-center gap-2 transition-colors shadow-md"
          >
            <Download className="w-4 h-4" />
            Descargar archivo .md
          </button>
        </div>
      </div>
    </div>
  );
};
