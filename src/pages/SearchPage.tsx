import { useEffect, useMemo, useState } from 'react';
import { Search, Loader2, X, Filter, Calendar, Layers, Trophy, Tag } from 'lucide-react';
import { supabase } from '../lib/supabase';
import {
  ARCHETYPES,
  GENS,
  FORMAT_LABELS,
  formatsForGen,
  genLabel,
  genSlugFromNumber,
  isFormat,
  archetypeLabel,
  type Archetype,
  type Format,
  type Team,
} from '../lib/types';
import { TeamCard } from '../components/TeamCard';
import { useAdmin, adminCall } from '../lib/auth';
import { useVisibility } from '../lib/genVisibility';
import { useNavigate } from '../lib/router';

const DATE_PRESETS = [
  { label: 'All time', value: 'all' as const },
  { label: 'This year', value: 'year' as const },
  { label: 'Last 30 days', value: '30d' as const },
  { label: 'Last 7 days', value: '7d' as const },
];

export function SearchPage() {
  const { isAdmin } = useAdmin();
  const { genVisibility, isFormatVisible } = useVisibility();
  const navigate = useNavigate();

  const [query, setQuery] = useState('');
  const [selectedGens, setSelectedGens] = useState<number[]>([]);
  const [selectedFormats, setSelectedFormats] = useState<Format[]>([]);
  const [selectedArchetypes, setSelectedArchetypes] = useState<Archetype[]>([]);
  const [datePreset, setDatePreset] = useState<'all' | 'year' | '30d' | '7d'>('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [results, setResults] = useState<Team[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const visibleGenNumbers = useMemo(() => {
    return GENS.filter((g) => isAdmin || (genVisibility.get(g.genNumber) ?? false)).map((g) => g.genNumber);
  }, [isAdmin, genVisibility]);

  const availableFormats = useMemo(() => {
    const formats = new Set<Format>();
    GENS.forEach((g) => {
      if (!isAdmin && !(genVisibility.get(g.genNumber) ?? false)) return;
      formatsForGen(g.slug).forEach((f) => {
        if (isAdmin || isFormatVisible(g.genNumber, f)) formats.add(f);
      });
    });
    return Array.from(formats);
  }, [isAdmin, genVisibility, isFormatVisible]);

  const toggleGen = (gen: number) => {
    setSelectedGens((prev) => prev.includes(gen) ? prev.filter((g) => g !== gen) : [...prev, gen]);
  };

  const toggleFormat = (f: Format) => {
    setSelectedFormats((prev) => prev.includes(f) ? prev.filter((x) => x !== f) : [...prev, f]);
  };

  const toggleArchetype = (a: Archetype) => {
    setSelectedArchetypes((prev) => prev.includes(a) ? prev.filter((x) => x !== a) : [...prev, a]);
  };

  const applyPreset = (preset: typeof DATE_PRESETS[number]['value']) => {
    setDatePreset(preset);
    const now = new Date();
    if (preset === 'all') { setDateFrom(''); setDateTo(''); return; }
    if (preset === 'year') {
      setDateFrom(`${now.getFullYear()}-01-01`);
      setDateTo('');
      return;
    }
    const days = preset === '30d' ? 30 : 7;
    const from = new Date(now.getTime() - days * 86400000);
    setDateFrom(from.toISOString().slice(0, 10));
    setDateTo('');
  };

  const runSearch = async () => {
    setLoading(true);
    setSearched(true);
    let q = supabase.from('teams').select('*');

    const gens = selectedGens.length > 0 ? selectedGens : visibleGenNumbers;
    if (gens.length > 0) q = q.in('gen', gens);

    if (selectedFormats.length > 0) q = q.in('format', selectedFormats);
    if (selectedArchetypes.length > 0) q = q.in('archetype', selectedArchetypes);

    if (dateFrom) q = q.gte('date_created', dateFrom);
    if (dateTo) q = q.lte('date_created', dateTo);

    q = q.order('date_created', { ascending: false }).limit(200);

    const { data, error } = await q;
    setLoading(false);
    if (error) { setResults([]); return; }

    let teams = (data as Team[]) ?? [];
    const kw = query.trim().toLowerCase();
    if (kw) {
      teams = teams.filter((t) => {
        if (t.team_name?.toLowerCase().includes(kw)) return true;
        return t.pokemon?.some((p) => p.species.toLowerCase().includes(kw) || p.nickname?.toLowerCase().includes(kw));
      });
    }
    setResults(teams);
  };

  useEffect(() => { runSearch(); /* eslint-disable-next-line */ }, []);

  const handleDelete = async (team: Team) => {
    if (!confirm('Delete this team? This cannot be undone.')) return;
    setDeletingId(team.id);
    const res = await adminCall({ action: 'delete', id: team.id });
    setDeletingId(null);
    if (!res.ok) { alert('Delete failed: ' + res.error); return; }
    setResults((prev) => prev.filter((t) => t.id !== team.id));
  };

  const grouped = useMemo(() => {
    const map = new Map<string, Team[]>();
    results.forEach((t) => {
      const key = `${genSlugFromNumber(t.gen)}-${t.format}`;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(t);
    });
    return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [results]);

  const clearFilters = () => {
    setQuery(''); setSelectedGens([]); setSelectedFormats([]); setSelectedArchetypes([]);
    setDatePreset('all'); setDateFrom(''); setDateTo('');
  };

  const hasFilters = query || selectedGens.length || selectedFormats.length || selectedArchetypes.length || dateFrom || dateTo;

  const renderGroup = (teams: Team[], genSlug: string, fmt: string) => {
    return (
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {teams.map((team) => (
          <div key={team.id} className={deletingId === team.id ? 'opacity-40' : ''}>
            <TeamCard team={team} isAdmin={isAdmin} onDelete={handleDelete} onEdit={(t) => navigate(`/${genSlug}/${t.format}/${t.archetype}`)} />
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="max-w-5xl mx-auto animate-fade-in">
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-ink-100 tracking-tight">Search Teams</h1>
        <p className="mt-1.5 text-sm text-ink-400">Find teams by Pokémon, name, generation, ladder, archetype, or date.</p>
      </div>

      <div className="rounded-2xl border border-ink-800 bg-ink-850/80 p-4 sm:p-5 mb-6">
        <div className="relative">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-500" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') runSearch(); }}
            placeholder="Search by Pokémon name or team name…"
            className="w-full bg-ink-800 border border-ink-700 rounded-xl pl-10 pr-4 py-3 text-sm text-ink-100 placeholder-ink-500 focus:outline-none focus:border-ball-500"
            autoFocus
          />
        </div>

        <div className="mt-4 flex flex-col gap-4">
          <div>
            <div className="flex items-center gap-1.5 mb-2">
              <Layers size={13} className="text-ink-500" />
              <span className="text-[11px] font-semibold uppercase tracking-wider text-ink-500">Generation</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {GENS.map((g) => {
                const visible = isAdmin || (genVisibility.get(g.genNumber) ?? false);
                if (!visible) return null;
                const active = selectedGens.includes(g.genNumber);
                return (
                  <button
                    key={g.genNumber}
                    onClick={() => toggleGen(g.genNumber)}
                    className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors border ${
                      active
                        ? 'bg-ball-500 text-ink-950 border-ball-500'
                        : 'bg-ink-800 text-ink-300 border-ink-700 hover:border-ink-600 hover:text-ink-100'
                    }`}
                  >
                    {g.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <div className="flex items-center gap-1.5 mb-2">
              <Trophy size={13} className="text-ink-500" />
              <span className="text-[11px] font-semibold uppercase tracking-wider text-ink-500">Ladder / Format</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {availableFormats.map((f) => {
                const active = selectedFormats.includes(f);
                return (
                  <button
                    key={f}
                    onClick={() => toggleFormat(f)}
                    className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors border ${
                      active
                        ? 'bg-ball-500 text-ink-950 border-ball-500'
                        : 'bg-ink-800 text-ink-300 border-ink-700 hover:border-ink-600 hover:text-ink-100'
                    }`}
                  >
                    {FORMAT_LABELS[f]}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <div className="flex items-center gap-1.5 mb-2">
              <Tag size={13} className="text-ink-500" />
              <span className="text-[11px] font-semibold uppercase tracking-wider text-ink-500">Archetype</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {ARCHETYPES.map((a) => {
                const active = selectedArchetypes.includes(a.slug);
                return (
                  <button
                    key={a.slug}
                    onClick={() => toggleArchetype(a.slug)}
                    className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors border ${
                      active
                        ? 'bg-ball-500 text-ink-950 border-ball-500'
                        : 'bg-ink-800 text-ink-300 border-ink-700 hover:border-ink-600 hover:text-ink-100'
                    }`}
                  >
                    {archetypeLabel(a.slug)}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <div className="flex items-center gap-1.5 mb-2">
              <Calendar size={13} className="text-ink-500" />
              <span className="text-[11px] font-semibold uppercase tracking-wider text-ink-500">Date</span>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {DATE_PRESETS.map((p) => (
                <button
                  key={p.value}
                  onClick={() => applyPreset(p.value)}
                  className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors border ${
                    datePreset === p.value
                      ? 'bg-ball-500 text-ink-950 border-ball-500'
                      : 'bg-ink-800 text-ink-300 border-ink-700 hover:border-ink-600 hover:text-ink-100'
                  }`}
                >
                  {p.label}
                </button>
              ))}
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => { setDateFrom(e.target.value); setDatePreset('all'); }}
                className="bg-ink-800 border border-ink-700 rounded-lg px-2 py-1 text-xs text-ink-200 focus:outline-none focus:border-ball-500"
              />
              <span className="text-ink-500 text-xs">to</span>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => { setDateTo(e.target.value); setDatePreset('all'); }}
                className="bg-ink-800 border border-ink-700 rounded-lg px-2 py-1 text-xs text-ink-200 focus:outline-none focus:border-ball-500"
              />
            </div>
          </div>
        </div>

        <div className="mt-4 flex items-center gap-2">
          <button
            onClick={runSearch}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold text-ink-100 bg-ball-500 hover:bg-ball-600 disabled:opacity-50 transition-colors"
          >
            {loading ? <Loader2 size={15} className="animate-spin" /> : <Search size={15} />}
            {loading ? 'Searching…' : 'Search'}
          </button>
          {hasFilters && (
            <button
              onClick={clearFilters}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-ink-300 hover:text-ink-100 hover:bg-ink-800 transition-colors"
            >
              <X size={15} />
              Clear
            </button>
          )}
        </div>
      </div>

      <div>
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 size={24} className="text-ink-500 animate-spin" />
          </div>
        ) : results.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Filter size={32} className="text-ink-600 mb-3" />
            <p className="text-ink-400">
              {searched ? 'No teams match your filters.' : 'Start by searching for a Pokémon or team.'}
            </p>
          </div>
        ) : (
          <div className="space-y-8">
            <p className="text-sm text-ink-400">
              {results.length} {results.length === 1 ? 'team' : 'teams'} found
            </p>
            {grouped.map(([key, teams]) => {
              const [genSlug, fmt] = key.split('-');
              return (
                <div key={key}>
                  <div className="flex items-center gap-2 mb-3">
                    <h2 className="text-sm font-semibold text-ink-200">{genLabel(genSlug)}</h2>
                    <span className="text-ink-600">·</span>
                    <span className="text-sm text-ink-400">{isFormat(fmt) ? FORMAT_LABELS[fmt as Format] : fmt}</span>
                  </div>
                  {renderGroup(teams, genSlug, fmt)}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
