import { useEffect, useState } from 'react';
import { Plus, Loader2, Inbox } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAdmin, adminCall } from '../lib/auth';
import {
  archetypeLabel,
  formatLabel,
  genLabel,
  genNumberFromSlug,
  isArchetype,
  isFormat,
  isGen,
  type Archetype,
  type Format,
  type Gen,
  type Team,
} from '../lib/types';
import { TeamCard } from '../components/TeamCard';
import { AddTeamForm } from '../components/AddTeamForm';
import { useNavigate } from '../lib/router';

interface TeamListPageProps {
  gen: string;
  format: string;
  archetype: string;
}

export function TeamListPage({ gen, format, archetype }: TeamListPageProps) {
  const { isAdmin } = useAdmin();
  const navigate = useNavigate();
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [editingTeam, setEditingTeam] = useState<Team | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const valid = isGen(gen) && isFormat(format) && isArchetype(archetype);
  const g = valid ? (gen as Gen) : 'gen9';
  const genNum = genNumberFromSlug(g);
  const fmt = valid ? (format as Format) : 'ou';
  const arch = valid ? (archetype as Archetype) : 'hyper-offense';

  const loadTeams = async () => {
    if (!valid) { setError('Invalid category.'); setLoading(false); return; }
    setLoading(true);
    setError(null);
    const { data, error: err } = await supabase
      .from('teams')
      .select('*')
      .eq('gen', genNum)
      .eq('format', fmt)
      .eq('archetype', arch)
      .order('date_created', { ascending: false });
    setLoading(false);
    if (err) { setError(err.message); return; }
    setTeams((data as Team[]) ?? []);
  };

  useEffect(() => {
    loadTeams();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [genNum, fmt, arch]);

  const handleDelete = async (team: Team) => {
    if (!confirm('Delete this team? This cannot be undone.')) return;
    setDeletingId(team.id);
    const result = await adminCall({ action: 'delete', id: team.id });
    setDeletingId(null);
    if (!result.ok) { alert('Delete failed: ' + (result.error ?? 'Unknown error')); return; }
    loadTeams();
  };

  if (!valid) {
    return (
      <div className="max-w-2xl mx-auto py-20 text-center animate-fade-in">
        <p className="text-ink-300">That category doesn't exist.</p>
        <button onClick={() => navigate('/')} className="mt-4 px-4 py-2 rounded-lg text-sm font-medium text-ink-100 bg-ink-800 hover:bg-ink-750">
          Back home
        </button>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-ink-500 mb-1">
            <span>{genLabel(g)}</span>
            <span>/</span>
            <span>{formatLabel(fmt)}</span>
            <span>/</span>
            <span>{archetypeLabel(arch)}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-ink-100">{archetypeLabel(arch)}</h1>
        </div>
        {isAdmin && (
          <button
            onClick={() => setShowAdd(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-semibold text-ink-100 bg-ball-500 hover:bg-ball-600 transition-colors"
          >
            <Plus size={16} />
            Add Team
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-24 text-ink-400">
          <Loader2 size={22} className="animate-spin" />
        </div>
      ) : error ? (
        <div className="py-16 text-center text-ball-300">{error}</div>
      ) : teams.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <Inbox size={36} className="text-ink-600 mb-3" />
          <p className="text-ink-400">No teams here yet.</p>
          {isAdmin && (
            <button
              onClick={() => setShowAdd(true)}
              className="mt-4 inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-semibold text-ink-100 bg-ball-500 hover:bg-ball-600 transition-colors"
            >
              <Plus size={16} />
              Add the first team
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          {teams.map((team) => (
            <div key={team.id} className={deletingId === team.id ? 'opacity-40' : ''}>
              <TeamCard team={team} isAdmin={isAdmin} onDelete={handleDelete} onEdit={setEditingTeam} />
            </div>
          ))}
        </div>
      )}

      {showAdd && (
        <AddTeamForm
          initialGen={g}
          initialFormat={fmt}
          initialArchetype={arch}
          onClose={() => setShowAdd(false)}
          onSaved={() => { setShowAdd(false); loadTeams(); }}
        />
      )}
      {editingTeam && (
        <AddTeamForm
          initialGen={g}
          initialFormat={fmt}
          initialArchetype={arch}
          team={editingTeam}
          onClose={() => setEditingTeam(null)}
          onSaved={() => { setEditingTeam(null); loadTeams(); }}
        />
      )}
    </div>
  );
}
