import { useState } from 'react';
import { ChevronDown, FolderOpen } from 'lucide-react';
import type { Team } from '../lib/types';
import { TeamCard } from './TeamCard';
import { Sprite } from './Sprite';

interface FolderGroupProps {
  folderName: string;
  teams: Team[];
  isAdmin: boolean;
  onDelete: (team: Team) => void;
  onEdit: (team: Team) => void;
}

export function FolderGroup({ folderName, teams, isAdmin, onDelete, onEdit }: FolderGroupProps) {
  const [expanded, setExpanded] = useState(false);

  const previewTeams = teams.slice(0, 6);

  return (
    <div className="rounded-2xl border border-ink-800 bg-ink-850/80 shadow-glow transition-all duration-300 hover:border-ball-500/40 overflow-hidden">
      <button
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center justify-between gap-3 p-5 text-left"
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <FolderOpen size={18} className="text-ball-400 shrink-0" />
          <h3 className="text-base font-bold text-ink-100 leading-tight truncate">
            {folderName}
          </h3>
          <span className="text-xs text-ink-500 shrink-0">
            {teams.length} {teams.length === 1 ? 'team' : 'teams'}
          </span>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <div className="flex items-center gap-1">
            {previewTeams.map((t, i) => (
              <Sprite
                key={i}
                species={t.pokemon[0]?.species ?? ''}
                className="w-7 h-7 object-contain drop-shadow-[0_1px_4px_rgba(0,0,0,0.5)]"
              />
            ))}
          </div>
          <ChevronDown
            size={18}
            className={`text-ink-400 transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`}
          />
        </div>
      </button>

      {expanded && (
        <div className="border-t border-ink-800 p-4 bg-ink-900/40">
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            {teams.map((team) => (
              <TeamCard
                key={team.id}
                team={team}
                isAdmin={isAdmin}
                onDelete={onDelete}
                onEdit={onEdit}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
