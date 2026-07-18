import type { PokemonEntry } from './types';

/**
 * Parse a pokepaste import block into the 6 Pokémon entries.
 *
 * A Pokémon block starts with a header line like:
 *   Nickname (Species) (M) @ Item
 *   Nickname (Species) @ Item
 *   Species (M) @ Item
 *   Species @ Item
 * The header may include a gender `(M)`/`(F)` and an item after `@`.
 * If a parenthesized species is present, the text before it is the nickname;
 * otherwise the species itself is the "nickname" (no custom nickname given).
 */
export function parsePokepaste(text: string): PokemonEntry[] {
  const entries: PokemonEntry[] = [];
  const lines = text.split(/\r?\n/);

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    // A header line is one that is NOT indented (no leading whitespace) and
    // isn't a move/ability/nature line. Move/ability lines start with lowercase
    // keywords or are indented. We detect headers by: starts at column 0 and
    // does not start with a known keyword.
    if (/^\s+/.test(line)) continue; // indented = detail line
    if (/^(Ability|Level|Shiny|Gigantamax|Happiness|EVs|IVs|Nature|Tera Type):/i.test(trimmed)) continue;
    if (/^\w+ Nature$/i.test(trimmed)) continue; // e.g. "Adamant Nature"
    if (/^-\s/.test(trimmed)) continue; // move line (e.g. "- Knock Off")

    const parsed = parseHeader(trimmed);
    if (parsed) {
      entries.push(parsed);
      if (entries.length === 6) break;
    }
  }

  return entries;
}

function parseHeader(header: string): PokemonEntry | null {
  // Strip trailing item: "Name @ Item"
  let core = header;
  const atIndex = core.lastIndexOf(' @ ');
  if (atIndex !== -1) {
    core = core.slice(0, atIndex).trim();
  }

  // Strip trailing gender: "(M)" / "(F)"
  core = core.replace(/\s*\([MF]\)\s*$/, '').trim();

  // Look for "Nickname (Species)" pattern.
  const nickMatch = core.match(/^(.+?)\s*\(([^()]+)\)\s*$/);
  if (nickMatch) {
    const nickname = nickMatch[1].trim();
    const species = nickMatch[2].trim();
    return { nickname, species };
  }

  // No parenthesized species — the whole thing is the species, used as nickname too.
  const species = core.trim();
  if (!species) return null;
  return { nickname: species, species };
}

// Pokémon Showdown's sprite CDN. Slugs are lowercase with hyphens stripped
// (e.g. "Iron Hands" -> "ironhands", "Tapu Koko" -> "tapukoko"). A few names
// need explicit overrides because Showdown's slug convention diverges from a
// naive strip.
const SPECIES_OVERRIDES: Record<string, string> = {
  'mr. mime': 'mrmime',
  'mr. rime': 'mrrime',
  'mime jr.': 'mimejr',
  'type: null': 'typenull',
  'tapu koko': 'tapukoko',
  'tapu lele': 'tapulele',
  'tapu bulu': 'tapubulu',
  'tapu fini': 'tapufini',
  'porygon-z': 'porygonz',
  'ho-oh': 'hooh',
  'jangmo-o': 'jangmoo',
  'hakamo-o': 'hakamoo',
  'kommo-o': 'kommoo',
  'great tusk': 'greattusk',
  'iron hands': 'ironhands',
  'iron bundle': 'ironbundle',
  'iron valiant': 'ironvaliant',
  'roaring moon': 'roaringmoon',
  'walking wake': 'walkingwake',
  'gouging fire': 'gougingfire',
  'raging bolt': 'ragingbolt',
  'iron leaves': 'ironleaves',
  'iron boulder': 'ironboulder',
  'iron crown': 'ironcrown',
  'iron moth': 'ironmoth',
  'iron jugulis': 'ironjugulis',
  'iron thorns': 'ironthorns',
  'chien-pao': 'chienpao',
  'ting-lu': 'tinglu',
  'chi-yu': 'chiyu',
  'wo-chien': 'wochien',
};

export function spriteUrl(species: string): string {
  const key = species.toLowerCase().trim();
  const slug =
    SPECIES_OVERRIDES[key] ??
    key
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]+/g, '')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
  return `https://play.pokemonshowdown.com/sprites/gen5/${slug}.png`;
}
