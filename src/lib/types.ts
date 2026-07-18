export type Gen =
  | 'gen12'
  | 'gen11'
  | 'gen10'
  | 'gen9'
  | 'gen8'
  | 'gen7'
  | 'gen6'
  | 'gen5'
  | 'gen4'
  | 'gen3'
  | 'gen2'
  | 'gen1';

export type Format =
  | 'ou'
  | 'uu'
  | 'ru'
  | 'nu'
  | 'pu'
  | 'zu'
  | 'lc'
  | 'ndou'
  | 'doubles'
  | 'vgc'
  | 'bss'
  | 'random';

export type Archetype =
  | 'hyper-offense'
  | 'offense'
  | 'bulky-offense'
  | 'balance'
  | 'bulky-balance'
  | 'semi-stall'
  | 'stall'
  | 'heat';

export interface PokemonEntry {
  nickname: string;
  species: string;
}

export interface Team {
  id: string;
  gen: number;
  format: Format;
  archetype: Archetype;
  team_name: string;
  date_created: string;
  pokepaste_text: string;
  pokepaste_url: string | null;
  pokemon: PokemonEntry[];
  created_at: string;
  folder_id: string | null;
  folder: string | null;
  sort_order: number;
}

export interface Folder {
  id: string;
  gen: number;
  format: Format;
  archetype: Archetype;
  name: string;
  description: string | null;
  preview_team_id: string | null;
  sort_order: number;
  created_at: string;
}

export interface GenVisibility {
  gen: number;
  visible: boolean;
  updated_at: string;
}

export const ARCHETYPES: { slug: Archetype; label: string }[] = [
  { slug: 'hyper-offense', label: 'Hyper Offense' },
  { slug: 'offense', label: 'Offense' },
  { slug: 'bulky-offense', label: 'Bulky Offense' },
  { slug: 'balance', label: 'Balance' },
  { slug: 'bulky-balance', label: 'Bulky Balance' },
  { slug: 'semi-stall', label: 'Semi-Stall' },
  { slug: 'stall', label: 'Stall' },
  { slug: 'heat', label: 'Heat' },
];

export const GENS: { slug: Gen; label: string; genNumber: number; formats: Format[] }[] = [
  {
    slug: 'gen12',
    label: 'Gen 12',
    genNumber: 12,
    formats: ['ou', 'uu', 'ru', 'nu', 'pu', 'zu', 'ndou', 'doubles', 'vgc', 'random'],
  },
  {
    slug: 'gen11',
    label: 'Gen 11',
    genNumber: 11,
    formats: ['ou', 'uu', 'ru', 'nu', 'pu', 'zu', 'ndou', 'doubles', 'vgc', 'random'],
  },
  {
    slug: 'gen10',
    label: 'Gen 10',
    genNumber: 10,
    formats: ['ou', 'uu', 'ru', 'nu', 'pu', 'zu', 'ndou', 'doubles', 'vgc', 'random'],
  },
  {
    slug: 'gen9',
    label: 'Gen 9',
    genNumber: 9,
    formats: ['ou', 'uu', 'ru', 'nu', 'pu', 'zu', 'ndou', 'doubles', 'vgc', 'random'],
  },
  {
    slug: 'gen8',
    label: 'Gen 8',
    genNumber: 8,
    formats: ['ou', 'uu', 'ru', 'nu', 'pu', 'zu', 'ndou', 'doubles', 'bss', 'vgc'],
  },
  {
    slug: 'gen7',
    label: 'Gen 7',
    genNumber: 7,
    formats: ['ou', 'uu', 'ru', 'nu', 'pu', 'lc', 'doubles', 'bss', 'vgc', 'random'],
  },
  {
    slug: 'gen6',
    label: 'Gen 6',
    genNumber: 6,
    formats: ['ou', 'uu', 'ru', 'nu', 'pu', 'lc', 'doubles', 'bss'],
  },
  {
    slug: 'gen5',
    label: 'Gen 5',
    genNumber: 5,
    formats: ['ou', 'uu', 'ru', 'nu', 'pu', 'lc', 'doubles'],
  },
  {
    slug: 'gen4',
    label: 'Gen 4',
    genNumber: 4,
    formats: ['ou', 'uu', 'ru', 'nu', 'lc', 'doubles'],
  },
  {
    slug: 'gen3',
    label: 'Gen 3',
    genNumber: 3,
    formats: ['ou', 'uu', 'ru', 'nu', 'doubles'],
  },
  {
    slug: 'gen2',
    label: 'Gen 2',
    genNumber: 2,
    formats: ['ou', 'uu', 'nu', 'doubles'],
  },
  {
    slug: 'gen1',
    label: 'Gen 1',
    genNumber: 1,
    formats: ['ou', 'uu', 'nu', 'random'],
  },
];

export const FORMAT_LABELS: Record<Format, string> = {
  ou: 'OU',
  uu: 'UU',
  ru: 'RU',
  nu: 'NU',
  pu: 'PU',
  zu: 'ZU',
  lc: 'LC',
  ndou: 'National Dex OU',
  doubles: 'Doubles',
  vgc: 'VGC',
  bss: 'BSS',
  random: 'Random',
};

export function genLabel(slug: Gen): string {
  return GENS.find((g) => g.slug === slug)?.label ?? slug;
}

export function genNumberFromSlug(slug: Gen): number {
  return GENS.find((g) => g.slug === slug)?.genNumber ?? 9;
}

export function genSlugFromNumber(num: number): Gen {
  return (GENS.find((g) => g.genNumber === num)?.slug ?? 'gen9') as Gen;
}

export function formatsForGen(slug: Gen): Format[] {
  return GENS.find((g) => g.slug === slug)?.formats ?? [];
}

export function formatLabel(slug: Format): string {
  return FORMAT_LABELS[slug] ?? slug;
}

export function archetypeLabel(slug: Archetype): string {
  return ARCHETYPES.find((a) => a.slug === slug)?.label ?? slug;
}

export function isGen(slug: string): slug is Gen {
  return GENS.some((g) => g.slug === slug);
}

export function isFormat(slug: string): slug is Format {
  return slug in FORMAT_LABELS;
}

export function isArchetype(slug: string): slug is Archetype {
  return ARCHETYPES.some((a) => a.slug === slug);
}
