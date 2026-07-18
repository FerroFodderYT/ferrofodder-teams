import { useEffect, useMemo, useState } from 'react';
import { X, Loader2, AlertCircle, FolderPlus } from 'lucide-react';
import { supabase } from '../lib/supabase';
import {
  ARCHETYPES,
  GENS,
  FORMAT_LABELS,
  formatsForGen,
  genNumberFromSlug,
  genSlugFromNumber,
  type Archetype,
  type Folder,
  type Format,
  type Gen,
  type Team,
} from '../lib/types';
import { parsePokepaste, spriteUrl } from '../lib/pokepaste';

interface AddTeamFormProps {
  initialGen: Gen;
  initialFormat: Format;
  initialArchetype: Archetype;
  team?: Team;
  onClose: () => void;
  onSaved: () => void;
}

function todayISO(): string {
  const d = new Date();
  const tz = d.getTimezoneOffset() * 60000;
  return new Date(d.getTime() - tz).toISOString().slice(0, 10);
}

export function AddTeamForm({
  initialGen,
  initialFormat,
  initialArchetype,
  team,
  onClose,
  onSaved,
}: AddTeamFormProps) {
  const isEditing = !!team;
  const [gen, setGen] = useState<Gen>(
    team ? genSlugFromNumber(team.gen) : initialGen
  );
  const [format, setFormat] = useState<Format>(team ? team.format : initialFormat);
  const [archetype, setArchetype] = useState<Archetype>(
    team ? team.archetype : initialArchetype
  );
  const [teamName, setTeamName] = useState(team ? team.team_name : '');
  const [date, setDate] = useState<string>(
    team ? team.date_created.slice(0, 10) : todayISO()
  );
  const [pokepasteText, setPokepasteText] = useState(team ? team.pokepaste_text : '');
  const [pokepasteUrl, setPokepasteUrl] = useState(team ? (team.pokepaste_url ?? '') : '');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [folders, setFolders] = useState<Folder[]>([]);
  const [folderId, setFolderId] = useState<string | null>(team?.folder_id ?? null);
  const [newFolderName, setNewFolderName] = useState('');
  const [creatingFolder, setCreatingFolder] = useState(false);

  const parsed = useMemo(() => parsePokepaste(pokepasteText), [pokepasteText]);

  const availableFormats = formatsForGen(gen);
  const genNum = genNumberFromSlug(gen);

  useEffect(() => {
    let active = true;
    (async () => {
      const { data } = await supabase
        .from('folders')
        .select('*')
        .eq('gen', genNum)
        .eq('format', format)
        .eq('archetype', archetype)
        .order('name', { ascending: true });
      if (active) setFolders((data as Folder[]) ?? []);
    })();
    return () => { active = false; };
  }, [genNum, format, archetype]);

  const validCount = parsed.length >= 1 && parsed.length <= 6;
  const canSubmit = validCount && teamName.trim().length > 0 && !submitting;

  const handleGenChange = (g: Gen) => {
    setGen(g);
    const formats = formatsForGen(g);
    if (!formats.includes(format)) {
      setFormat(formats[0]);
    }
  };

  const submit = async () => {
    setError(null);
    if (!teamName.trim()) {
      setError('Please enter a team name.');
      return;
    }
    if (parsed.length < 1 || parsed.length > 6) {
      setError('Pokepaste must contain 1 to 6 Pokémon. Currently parsed: ' + parsed.length);
      return;
    }
    setSubmitting(true);

    let finalFolderId = folderId;

    if (newFolderName.trim()) {
      const { data: folderData, error: folderError } = await supabase
        .from('folders')
        .insert({
          gen: genNum,
          format,
          archetype,
          name: newFolderName.trim(),
        })
        .select('id')
        .single();
      if (folderError) {
        setSubmitting(false);
        setError(folderError.message);
        return;
      }
      finalFolderId = folderData.id;
    }

    const payload = {
      gen: genNum,
      format,
      archetype,
      team_name: teamName.trim(),
      date_created: date,
      pokepaste_text: pokepasteText,
      pokepaste_url: pokepasteUrl.trim() || null,
      pokemon: parsed,
      folder_id: finalFolderId || null,
    };

    let result;
    if (isEditing) {
      result = await supabase.from('teams').update(payload).eq('id', team!.id).select('id').single();
    } else {
      result = await supabase.from('teams').insert(payload).select('id').single();
    }
    setSubmitting(false);
    if (result.error) {
      setError(result.error.message);
      return;
    }
    onSaved();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div
        className="w-full max-w-3xl max-h-[90vh] flex flex-col rounded-2xl border border-ink-700 bg-ink-900 shadow-2xl animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-ink-800">
          <h2 className="text-base font-semibold text-ink-100">
            {isEditing ? 'Edit Team' : 'Add Team'}
          </h2>
          <button
            onClick={onClose}
            className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-ink-400 hover:text-ink-100 hover:bg-ink-800 transition-colors"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        <div className="overflow-y-auto scrollbar-thin p-5 flex flex-col gap-5">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-medium uppercase tracking-wider text-ink-400">Gen</span>
              <select
                value={gen}
                onChange={(e) => handleGenChange(e.target.value as Gen)}
                className="bg-ink-800 border border-ink-700 rounded-lg px-3 py-2 text-sm text-ink-100 focus:outline-none focus:border-ball-500"
              >
                {GENS.map((g) => (
                  <option key={g.slug} value={g.slug}>
                    {g.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-medium uppercase tracking-wider text-ink-400">Format</span>
              <select
                value={format}
                onChange={(e) => setFormat(e.target.value as Format)}
                className="bg-ink-800 border border-ink-700 rounded-lg px-3 py-2 text-sm text-ink-100 focus:outline-none focus:border-ball-500"
              >
                {availableFormats.map((f) => (
                  <option key={f} value={f}>
                    {FORMAT_LABELS[f]}
                  </option>
                ))}
              </select>
            </label>

            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-medium uppercase tracking-wider text-ink-400">Archetype</span>
              <select
                value={archetype}
                onChange={(e) => setArchetype(e.target.value as Archetype)}
                className="bg-ink-800 border border-ink-700 rounded-lg px-3 py-2 text-sm text-ink-100 focus:outline-none focus:border-ball-500"
              >
                {ARCHETYPES.map((a) => (
                  <option key={a.slug} value={a.slug}>
                    {a.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-medium uppercase tracking-wider text-ink-400">Date</span>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="bg-ink-800 border border-ink-700 rounded-lg px-3 py-2 text-sm text-ink-100 focus:outline-none focus:border-ball-500"
              />
            </label>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-medium uppercase tracking-wider text-ink-400">Folder</span>
              <select
                value={folderId ?? ''}
                onChange={(e) => { setFolderId(e.target.value || null); setNewFolderName(''); }}
                className="bg-ink-800 border border-ink-700 rounded-lg px-3 py-2 text-sm text-ink-100 focus:outline-none focus:border-ball-500"
              >
                <option value="">No folder (standalone)</option>
                {folders.map((f) => (
                  <option key={f.id} value={f.id}>{f.name}</option>
                ))}
              </select>
            </label>

            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-medium uppercase tracking-wider text-ink-400">
                New Folder <span className="text-ink-500 normal-case">(optional)</span>
              </span>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newFolderName}
                  onChange={(e) => { setNewFolderName(e.target.value); if (e.target.value) setFolderId(null); }}
                  placeholder="Create a new folder"
                  className="flex-1 bg-ink-800 border border-ink-700 rounded-lg px-3 py-2 text-sm text-ink-100 placeholder-ink-500 focus:outline-none focus:border-ball-500"
                />
                {creatingFolder ? (
                  <Loader2 size={16} className="animate-spin text-ink-400 self-center" />
                ) : (
                  <FolderPlus size={16} className="text-ink-500 self-center shrink-0" />
                )}
              </div>
            </label>
          </div>

          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-medium uppercase tracking-wider text-ink-400">
              Team Name
            </span>
            <input
              type="text"
              value={teamName}
              onChange={(e) => setTeamName(e.target.value)}
              placeholder="e.g. Hyper Offense Sun Team"
              className="bg-ink-800 border border-ink-700 rounded-lg px-3 py-2 text-sm text-ink-100 placeholder-ink-500 focus:outline-none focus:border-ball-500"
            />
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-medium uppercase tracking-wider text-ink-400">
              Poképaste URL <span className="text-ink-500 normal-case">(optional)</span>
            </span>
            <input
              type="url"
              value={pokepasteUrl}
              onChange={(e) => setPokepasteUrl(e.target.value)}
              placeholder="https://pokepast.es/d260994e7b37832c"
              className="bg-ink-800 border border-ink-700 rounded-lg px-3 py-2 text-sm text-ink-100 placeholder-ink-500 focus:outline-none focus:border-ball-500"
            />
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-medium uppercase tracking-wider text-ink-400">Poképaste Text</span>
            <textarea
              value={pokepasteText}
              onChange={(e) => setPokepasteText(e.target.value)}
              rows={10}
              placeholder={'Paste the full importable here...\n\nNickname (Species) (M) @ Item\nAbility: ...\nTera Type: ...\n- Move 1\n- Move 2\n...'}
              className="font-mono text-[13px] leading-relaxed bg-ink-850 border border-ink-700 rounded-lg px-3 py-2.5 text-ink-200 placeholder-ink-500 focus:outline-none focus:border-ball-500 scrollbar-thin"
            />
          </label>

          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium uppercase tracking-wider text-ink-400">Live Preview</span>
              <span className={`text-xs font-medium ${validCount ? 'text-green-400' : 'text-ink-500'}`}>
                {parsed.length} parsed (1-6)
              </span>
            </div>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 p-4 rounded-xl border border-ink-800 bg-ink-850/60">
              {parsed.length === 0 && (
                <div className="col-span-full text-center text-sm text-ink-500 py-6">
                  Start pasting to see sprites appear.
                </div>
              )}
              {parsed.map((p, i) => (
                <div key={i} className="flex flex-col items-center gap-1">
                  <img
                    src={spriteUrl(p.species)}
                    alt={p.species}
                    className="w-16 h-16 object-contain"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).style.opacity = '0.2';
                    }}
                  />
                  <span className="text-[10px] text-ink-400 text-center leading-tight line-clamp-2">
                    {p.species}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {error && (
            <div className="flex items-start gap-2 p-3 rounded-lg bg-ball-500/10 border border-ball-500/30 text-sm text-ball-200">
              <AlertCircle size={16} className="shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-2 px-5 py-3.5 border-t border-ink-800">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-sm font-medium text-ink-300 hover:text-ink-100 hover:bg-ink-800 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={submit}
            disabled={!canSubmit}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-ink-100 bg-ball-500 hover:bg-ball-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            {submitting && <Loader2 size={14} className="animate-spin" />}
            {submitting ? 'Saving…' : isEditing ? 'Save Changes' : 'Save Team'}
          </button>
        </div>
      </div>
    </div>
  );
}
