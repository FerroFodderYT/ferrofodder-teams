import { useState } from 'react';
import { ExternalLink, Trash2, Pencil, Code2, X, Copy, Check } from 'lucide-react';
import type { Team } from '../lib/types';
import { spriteUrl } from '../lib/pokepaste';

interface TeamCardProps {
  team: Team;
  isAdmin: boolean;
  onDelete: (team: Team) => void;
  onEdit: (team: Team) => void;
}

function formatDate(iso: string): string {
  // iso is a date string (YYYY-MM-DD) or timestamp; render as "June 27, 2026"
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
}

export function TeamCard({ team, isAdmin, onDelete, onEdit }: TeamCardProps) {
  const [showPaste, setShowPaste] = useState(false);
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(team.pokepaste_text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // ignore
    }
  };

  return (
    <>
      <div className="group relative rounded-2xl border border-ink-800 bg-ink-850/80 p-5 shadow-glow transition-all duration-300 hover:border-ball-500/40 hover:shadow-glow-strong">
        <div className="flex items-center justify-between mb-1">
          <h3 className="text-base font-semibold text-ink-100 leading-tight">
            {team.team_name}
          </h3>
          {isAdmin && (
            <div className="flex items-center gap-1">
              <button
                onClick={() => onEdit(team)}
                className="opacity-0 group-hover:opacity-100 transition-opacity inline-flex items-center justify-center w-8 h-8 rounded-lg text-ink-400 hover:text-ball-400 hover:bg-ball-500/10"
                aria-label="Edit team"
                title="Edit team"
              >
                <Pencil size={16} />
              </button>
              <button
                onClick={() => onDelete(team)}
                className="opacity-0 group-hover:opacity-100 transition-opacity inline-flex items-center justify-center w-8 h-8 rounded-lg text-ink-400 hover:text-ball-400 hover:bg-ball-500/10"
                aria-label="Delete team"
                title="Delete team"
              >
                <Trash2 size={16} />
              </button>
            </div>
          )}
        </div>
        <time className="block text-xs font-medium uppercase tracking-wider text-ink-400 mb-4">
          {formatDate(team.date_created)}
        </time>

        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 sm:gap-3 mb-5">
          {team.pokemon.map((p, i) => (
            <div key={i} className="flex flex-col items-center gap-1">
              <div className="w-20 h-20 flex items-center justify-center">
                <img
                  src={spriteUrl(p.species)}
                  alt={p.species}
                  loading="lazy"
                  className="w-20 h-20 object-contain drop-shadow-[0_2px_8px_rgba(0,0,0,0.5)]"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).style.opacity = '0.2';
                  }}
                />
              </div>
              <span className="text-[11px] text-ink-300 text-center leading-tight line-clamp-2 min-h-[1.5em]">
                {p.species}
              </span>
            </div>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setShowPaste(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-ink-200 bg-ink-800 hover:bg-ink-750 hover:text-ink-100 transition-colors"
          >
            <Code2 size={14} />
            Show Paste
          </button>
          {team.pokepaste_url && (
            <a
              href={team.pokepaste_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-ink-100 bg-ball-500 hover:bg-ball-600 transition-colors"
            >
              <ExternalLink size={14} />
              View Poképaste
            </a>
          )}
        </div>
      </div>

      {showPaste && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in"
          onClick={() => setShowPaste(false)}
        >
          <div
            className="w-full max-w-2xl max-h-[85vh] flex flex-col rounded-2xl border border-ink-700 bg-ink-900 shadow-2xl animate-scale-in"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 py-3 border-b border-ink-800">
              <div className="flex items-center gap-2">
                <Code2 size={16} className="text-ball-400" />
                <span className="text-sm font-semibold text-ink-100">Poképaste</span>
                <span className="text-xs text-ink-500">{formatDate(team.date_created)}</span>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={copy}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-ink-200 hover:text-ink-100 hover:bg-ink-800 transition-colors"
                >
                  {copied ? <Check size={14} className="text-green-400" /> : <Copy size={14} />}
                  {copied ? 'Copied' : 'Copy'}
                </button>
                <button
                  onClick={() => setShowPaste(false)}
                  className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-ink-400 hover:text-ink-100 hover:bg-ink-800 transition-colors"
                  aria-label="Close"
                >
                  <X size={18} />
                </button>
              </div>
            </div>
            <div className="overflow-auto scrollbar-thin p-5">
              <pre className="font-mono text-[13px] leading-relaxed text-ink-200 whitespace-pre-wrap break-words">
                {team.pokepaste_text}
              </pre>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
