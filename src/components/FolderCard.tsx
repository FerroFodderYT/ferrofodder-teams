import { useState } from 'react';
import { ChevronDown, FolderOpen, Trash2, Star, Pencil, X, Check, Loader2 } from 'lucide-react';
import type { Folder, Team } from '../lib/types';
import { TeamCard } from './TeamCard';
import { spriteUrl } from '../lib/pokepaste';
import { adminCall } from '../lib/auth';

interface FolderCardProps {
  folder: Folder;
  teams: Team[];
  isAdmin: boolean;
  onTeamsChanged: () => void;
  onFolderChanged: () => void;
  onEditTeam: (team: Team) => void;
}

export function FolderCard({ folder, teams, isAdmin, onTeamsChanged, onFolderChanged, onEditTeam }: FolderCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState(folder.name);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [settingPreviewId, setSettingPreviewId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const previewTeam = folder.preview_team_id
    ? teams.find((t) => t.id === folder.preview_team_id) ?? teams[0]
    : teams[0];

  const saveName = async () => {
    if (!nameDraft.trim() || nameDraft.trim() === folder.name) {
      setEditingName(false);
      setNameDraft(folder.name);
      return;
    }
    setBusy(true);
    const res = await adminCall({ action: 'updateFolder', id: folder.id, name: nameDraft.trim() });
    setBusy(false);
    if (!res.ok) { alert('Failed to rename folder: ' + res.error); return; }
    setEditingName(false);
    onFolderChanged();
  };

  const deleteFolder = async () => {
    if (!confirm(`Delete folder "${folder.name}"? Teams inside will be kept as standalone.`)) return;
    setBusy(true);
    const res = await adminCall({ action: 'deleteFolder', id: folder.id });
    setBusy(false);
    if (!res.ok) { alert('Failed to delete folder: ' + res.error); return; }
    onFolderChanged();
    onTeamsChanged();
  };

  const setPreview = async (teamId: string) => {
    setSettingPreviewId(teamId);
    const res = await adminCall({ action: 'updateFolder', id: folder.id, preview_team_id: teamId });
    setSettingPreviewId(null);
    if (!res.ok) { alert('Failed to set preview: ' + res.error); return; }
    onFolderChanged();
  };

  const handleDeleteTeam = async (team: Team) => {
    if (!confirm('Delete this team? This cannot be undone.')) return;
    setDeletingId(team.id);
    const res = await adminCall({ action: 'delete', id: team.id });
    setDeletingId(null);
    if (!res.ok) { alert('Delete failed: ' + res.error); return; }
    onTeamsChanged();
  };

  return (
    <div className="rounded-2xl border border-ink-800 bg-ink-850/80 shadow-glow transition-all duration-300 hover:border-ball-500/40 overflow-hidden">
      <div className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <FolderOpen size={18} className="text-ball-400 shrink-0" />
            {editingName ? (
              <div className="flex items-center gap-1.5 min-w-0">
                <input
                  autoFocus
                  value={nameDraft}
                  onChange={(e) => setNameDraft(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') saveName(); if (e.key === 'Escape') { setEditingName(false); setNameDraft(folder.name); } }}
                  className="bg-ink-800 border border-ink-700 rounded-lg px-2 py-1 text-sm text-ink-100 focus:outline-none focus:border-ball-500 min-w-0"
                />
                <button onClick={saveName} className="text-ink-300 hover:text-ball-400 shrink-0" aria-label="Save name">
                  {busy ? <Loader2 size={15} className="animate-spin" /> : <Check size={15} />}
                </button>
                <button onClick={() => { setEditingName(false); setNameDraft(folder.name); }} className="text-ink-400 hover:text-ink-100 shrink-0" aria-label="Cancel">
                  <X size={15} />
                </button>
              </div>
            ) : (
              <h3 className="text-base font-semibold text-ink-100 leading-tight truncate">{folder.name}</h3>
            )}
            <span className="text-xs text-ink-500 shrink-0">{teams.length} {teams.length === 1 ? 'team' : 'teams'}</span>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            {isAdmin && (
              <>
                <button onClick={() => setEditingName(true)} className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-ink-400 hover:text-ball-400 hover:bg-ball-500/10" aria-label="Rename folder" title="Rename folder">
                  <Pencil size={15} />
                </button>
                <button onClick={deleteFolder} className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-ink-400 hover:text-ball-400 hover:bg-ball-500/10" aria-label="Delete folder" title="Delete folder">
                  {busy ? <Loader2 size={15} className="animate-spin" /> : <Trash2 size={15} />}
                </button>
              </>
            )}
            <button
              onClick={() => setExpanded((v) => !v)}
              className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-ink-400 hover:text-ink-100 hover:bg-ink-800 transition-colors"
              aria-label={expanded ? 'Collapse' : 'Expand'}
              title={expanded ? 'Collapse' : 'Expand'}
            >
              <ChevronDown size={18} className={`transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`} />
            </button>
          </div>
        </div>

        {folder.description && (
          <p className="mt-1.5 text-sm text-ink-400 leading-relaxed">{folder.description}</p>
        )}

        {previewTeam && (
          <div className="mt-3 flex items-center gap-2">
            <span className="text-[11px] font-medium uppercase tracking-wider text-ink-500 shrink-0">Preview</span>
            <div className="flex items-center gap-1 flex-wrap">
              {previewTeam.pokemon.map((p, i) => (
                <img
                  key={i}
                  src={spriteUrl(p.species)}
                  alt={p.species}
                  loading="lazy"
                  className="w-9 h-9 object-contain drop-shadow-[0_1px_4px_rgba(0,0,0,0.5)]"
                  onError={(e) => { (e.currentTarget as HTMLImageElement).style.opacity = '0.2'; }}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {expanded && (
        <div className="border-t border-ink-800 p-4 bg-ink-900/40">
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            {teams.map((team) => (
              <div key={team.id} className={`relative ${deletingId === team.id ? 'opacity-40' : ''}`}>
                <TeamCard team={team} isAdmin={isAdmin} onDelete={handleDeleteTeam} onEdit={onEditTeam} />
                {isAdmin && (
                  <div className="absolute top-3 right-12 flex items-center gap-1">
                    <button
                      onClick={() => setPreview(team.id)}
                      disabled={settingPreviewId === team.id}
                      className={`inline-flex items-center justify-center w-8 h-8 rounded-lg transition-colors ${
                        folder.preview_team_id === team.id
                          ? 'text-ball-400 bg-ball-500/10'
                          : 'text-ink-500 hover:text-ball-400 hover:bg-ball-500/10'
                      }`}
                      title={folder.preview_team_id === team.id ? 'Preview team' : 'Set as folder preview'}
                      aria-label="Set as folder preview"
                    >
                      {settingPreviewId === team.id ? <Loader2 size={15} className="animate-spin" /> : <Star size={15} fill={folder.preview_team_id === team.id ? 'currentColor' : 'none'} />}
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
          {teams.length === 0 && (
            <p className="text-center text-ink-500 py-6 text-sm">This folder is empty.</p>
          )}
        </div>
      )}
    </div>
  );
}
