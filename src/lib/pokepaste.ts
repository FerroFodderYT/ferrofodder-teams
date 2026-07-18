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

const SPECIES_OVERRIDES: Record<string, string> = {
  'kommo-o': 'kommoo',
  'jangmo-o': 'jangmoo',
  'hakamo-o': 'hakamoo',
  'iron valiant': 'iron-valiant',
  'iron treads': 'iron-treads',
  'iron moth': 'iron-moth',
  'iron hands': 'iron-hands',
  'iron bundle': 'iron-bundle',
  'iron jugulis': 'iron-jugulis',
  'iron thorns': 'iron-thorns',
  'tapu lele': 'tapu-lele',
  'tapu koko': 'tapu-koko',
  'tapu fini': 'tapu-fini',
  'tapu bulu': 'tapu-bulu',
  'great tusk': 'great-tusk',
  'roaring moon': 'roaring-moon',
  'walking wake': 'walking-wake',
  'gouging fire': 'gouging-fire',
  'raging bolt': 'raging-bolt',
  'sandy shocks': 'sandy-shocks',
  'scream tail': 'scream-tail',
  'flutter mane': 'flutter-mane',
  'brute bonnet': 'brute-bonnet',
  'slither wing': 'slither-wing',
  'porygon-z': 'porygon-z',
  'porygon2': 'porygon2',
  'mr. mime': 'mr-mime',
  'mr. rime': 'mr-rime',
  'mime jr.': 'mime-jr',
  'type: null': 'typenull',
  'landorus-therian': 'landorus-therian',
  'tornadus-therian': 'tornadus-therian',
  'thundurus-therian': 'thundurus-therian',
  'slowking-galar': 'slowking-galar',
  'weezing-galar': 'weezing-galar',
  'samurott-hisui': 'samurott-hisui',
  'arcanine-hisui': 'arcanine-hisui',
  'electrode-hisui': 'electrode-hisui',
  'typhlosion-hisui': 'typhlosion-hisui',
  'charizard-mega-x': 'charizard-mega-x',
  'charizard-mega-y': 'charizard-mega-y',
  'mewtwo-mega-x': 'mewtwo-mega-x',
  'mewtwo-mega-y': 'mewtwo-mega-y',
  'alakazam-mega': 'alakazam-mega',
  'gengar-mega': 'gengar-mega',
  'kangaskhan-mega': 'kangaskhan-mega',
  'pinsir-mega': 'pinsir-mega',
  'gyarados-mega': 'gyarados-mega',
  'aerodactyl-mega': 'aerodactyl-mega',
  'ampharos-mega': 'ampharos-mega',
  'scizor-mega': 'scizor-mega',
  'heracross-mega': 'heracross-mega',
  'houndoom-mega': 'houndoom-mega',
  'tyranitar-mega': 'tyranitar-mega',
  'blaziken-mega': 'blaziken-mega',
  'gardevoir-mega': 'gardevoir-mega',
  'mawile-mega': 'mawile-mega',
  'aggron-mega': 'aggron-mega',
  'medicham-mega': 'medicham-mega',
  'manectric-mega': 'manectric-mega',
  'banette-mega': 'banette-mega',
  'absol-mega': 'absol-mega',
  'garchomp-mega': 'garchomp-mega',
  'lucario-mega': 'lucario-mega',
  'abomasnow-mega': 'abomasnow-mega',
  'beedrill-mega': 'beedrill-mega',
  'pidgeot-mega': 'pidgeot-mega',
  'slowbro-mega': 'slowbro-mega',
  'steelix-mega': 'steelix-mega',
  'sceptile-mega': 'sceptile-mega',
  'swampert-mega': 'swampert-mega',
  'sableye-mega': 'sableye-mega',
  'sharpedo-mega': 'sharpedo-mega',
  'camerupt-mega': 'camerupt-mega',
  'altaria-mega': 'altaria-mega',
  'glalie-mega': 'glalie-mega',
  'salamence-mega': 'salamence-mega',
  'metagross-mega': 'metagross-mega',
  'latias-mega': 'latias-mega',
  'latios-mega': 'latios-mega',
  'rayquaza-mega': 'rayquaza-mega',
  'lopunny-mega': 'lopunny-mega',
  'gallade-mega': 'gallade-mega',
  'audino-mega': 'audino-mega',
  'diancie-mega': 'diancie-mega',
};

function slug(species: string): string {
  const key = species.toLowerCase().trim();
  if (SPECIES_OVERRIDES[key]) return SPECIES_OVERRIDES[key];
  return key
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]+/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

export function spriteAniUrl(species: string): string {
  return `https://play.pokemonshowdown.com/sprites/ani/${slug(species)}.gif`;
}

export function spriteGen5Url(species: string): string {
  return `https://play.pokemonshowdown.com/sprites/gen5/${slug(species)}.png`;
}

export const POKEBALL_PLACEHOLDER =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 80 80"><circle cx="40" cy="40" r="36" fill="#9ca3af" stroke="#4b5563" stroke-width="3"/><rect x="4" y="34" width="72" height="12" fill="#4b5563"/><circle cx="40" cy="40" r="9" fill="#e5e7eb" stroke="#4b5563" stroke-width="3"/></svg>',
  );

export function teamDisplayName(entries: PokemonEntry[], dateISO: string): string {
  const first = entries[0];
  if (first && first.nickname && first.nickname !== first.species) {
    return first.nickname;
  }
  return formatDate(dateISO);
}

export function hasCustomNickname(entries: PokemonEntry[]): boolean {
  const first = entries[0];
  return !!(first && first.nickname && first.nickname !== first.species);
}

export function formatDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
}
