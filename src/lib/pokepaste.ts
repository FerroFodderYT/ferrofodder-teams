import type { PokemonEntry } from './types';

export function parsePokepaste(text: string): PokemonEntry[] {
  const entries: PokemonEntry[] = [];
  const lines = text.split(/\r?\n/);

  for (const line of lines) {
    if (/^\s+/.test(line)) continue;
    const trimmed = line.trim();
    if (!trimmed) continue;
    if (/^(Ability|Level|Shiny|Gigantamax|Happiness|EVs|IVs|Nature|Tera Type):/i.test(trimmed)) continue;
    if (/^\w+ Nature$/i.test(trimmed)) continue;
    if (/^-\s/.test(trimmed)) continue;

    const parsed = parseHeader(trimmed);
    if (parsed) {
      entries.push(parsed);
      if (entries.length === 6) break;
    }
  }

  return entries;
}

function parseHeader(header: string): PokemonEntry | null {
  let core = header;
  const atIndex = core.lastIndexOf(' @ ');
  if (atIndex !== -1) core = core.slice(0, atIndex).trim();

  const parenMatches = [...core.matchAll(/\(([^()]*)\)/g)];
  const speciesParen = parenMatches.find((m) => {
    const inner = m[1].trim();
    return inner !== 'M' && inner !== 'F';
  });

  if (speciesParen && speciesParen.index !== undefined) {
    const species = speciesParen[1].trim();
    const nickname = core.slice(0, speciesParen.index).trim();
    return { nickname: nickname || species, species };
  }

  core = core.replace(/\s*\([MF]\)\s*$/, '').trim();
  const species = core;
  if (!species) return null;
  return { nickname: species, species };
}

export function spriteUrl(species: string): string {
  const name = species
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
  return `https://play.pokemonshowdown.com/sprites/gen5/${name}.png`;
}

export function teamDisplayName(entries: PokemonEntry[], dateISO: string): string {
  const first = entries[0];
  if (first && first.nickname && first.nickname !== first.species) {
    return first.nickname;
  }
  return formatDate(dateISO);
}

export function formatDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
}
