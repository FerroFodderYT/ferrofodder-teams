import { useState } from 'react';
import { ChevronRight, Eye, EyeOff, Loader2, Menu, Search, X, Youtube } from 'lucide-react';
import {
  ARCHETYPES,
  GENS,
  formatsForGen,
  isGen,
  isFormat,
  type Format,
  type Gen,
} from '../lib/types';
import { useNavigate, useRoute, parseRoute } from '../lib/router';
import { useAdmin } from '../lib/auth';
import { useVisibility } from '../lib/genVisibility';

interface SidebarProps {
  currentGen?: string;
  currentFormat?: string;
  currentArchetype?: string;
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

const FORMAT_LABELS_SHORT: Record<Format, string> = {
  ou: 'OU',
  uu: 'UU',
  ru: 'RU',
  nu: 'NU',
  pu: 'PU',
  zu: 'ZU',
  lc: 'LC',
  ndou: 'Nat Dex OU',
  doubles: 'Doubles',
  vgc: 'VGC',
  bss: 'BSS',
  random: 'Random',
};

export function Sidebar({
  currentGen,
  currentFormat,
  currentArchetype,
  mobileOpen,
  onCloseMobile,
}: SidebarProps) {
  const navigate = useNavigate();
  const route = parseRoute(useRoute());
  const { isAdmin } = useAdmin();
  const { genVisibility, isFormatVisible, loading, toggleGenVisibility, toggleFormatVisibility } = useVisibility();

  const activeGen: Gen | undefined =
    currentGen && isGen(currentGen) ? currentGen : undefined;
  const activeFormat: Format | undefined =
    currentFormat && isFormat(currentFormat) ? currentFormat : undefined;

  const [openGen, setOpenGen] = useState<Gen | null>(activeGen ?? 'gen9');
  const [openFormat, setOpenFormat] = useState<Format | null>(
    activeFormat ?? null,
  );
  const [togglingGen, setTogglingGen] = useState<number | null>(null);
  const [togglingFormat, setTogglingFormat] = useState<{ gen: number; format: string } | null>(null);

  // Filter generations based on visibility (admins see all)
  const visibleGens = GENS.filter((g) => {
    if (isAdmin) return true;
    return genVisibility.get(g.genNumber) ?? false;
  });

  const go = (path: string) => {
    navigate(path);
    onCloseMobile();
  };

  const selectGen = (g: Gen) => {
    setOpenGen((cur) => (cur === g ? null : g));
    setOpenFormat(null);
  };

  const selectFormat = (f: Format) => {
    setOpenFormat((cur) => (cur === f ? null : f));
  };

  const handleToggleGenVisibility = async (genNumber: number, e: React.MouseEvent) => {
    e.stopPropagation();
    const currentVisible = genVisibility.get(genNumber) ?? false;
    setTogglingGen(genNumber);
    try {
      await toggleGenVisibility(genNumber, !currentVisible);
    } finally {
      setTogglingGen(null);
    }
  };

  const handleToggleFormatVisibility = async (gen: number, format: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const currentVisible = isFormatVisible(gen, format);
    setTogglingFormat({ gen, format });
    try {
      await toggleFormatVisibility(gen, format, !currentVisible);
    } finally {
      setTogglingFormat(null);
    }
  };

  const content = (
    <nav className="flex flex-col gap-0.5 px-2 py-3">
      <button
        onClick={() => go('/search')}
        className={`text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${
          route.name === 'search'
            ? 'text-ink-100 bg-ink-800'
            : 'text-ink-300 hover:text-ink-100 hover:bg-ink-800/60'
        }`}
      >
        <Search size={15} className="text-ink-400" />
        Search Teams
      </button>

      <button
        onClick={() => go('/')}
        className={`text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
          route.name === 'home'
            ? 'text-ink-100 bg-ink-800'
            : 'text-ink-300 hover:text-ink-100 hover:bg-ink-800/60'
        }`}
      >
        Home
      </button>

      <div className="mt-3 mb-1 px-3 flex items-center justify-between">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-ink-500">
          Generations
        </span>
        {loading && <Loader2 size={12} className="text-ink-500 animate-spin" />}
      </div>

      {visibleGens.map((g) => {
        const isOpen = openGen === g.slug;
        const isActiveGen = activeGen === g.slug;
        const allFormats = formatsForGen(g.slug);
        const genVisible = genVisibility.get(g.genNumber) ?? true;
        const isTogglingGen = togglingGen === g.genNumber;

        // Filter formats based on visibility (admins see all)
        const visibleFormats = allFormats.filter((f) => {
          if (isAdmin) return true;
          return isFormatVisible(g.genNumber, f);
        });

        return (
          <div key={g.slug}>
            <div className="flex items-center gap-1">
              <button
                onClick={() => selectGen(g.slug)}
                className={`flex-1 flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold transition-colors ${
                  isActiveGen
                    ? 'text-ink-100 bg-ink-800'
                    : 'text-ink-200 hover:text-ink-100 hover:bg-ink-800/60'
                }`}
              >
                <ChevronRight
                  size={14}
                  className={`shrink-0 text-ink-500 transition-transform duration-200 ${
                    isOpen ? 'rotate-90' : ''
                  }`}
                />
                <span>{g.label}</span>
              </button>

              {isAdmin && (
                <button
                  onClick={(e) => handleToggleGenVisibility(g.genNumber, e)}
                  disabled={isTogglingGen}
                  className={`shrink-0 inline-flex items-center justify-center w-8 h-8 rounded-lg transition-colors ${
                    genVisible
                      ? 'text-ball-500 hover:bg-ball-500/10'
                      : 'text-ink-500 hover:bg-ink-800'
                  } ${isTogglingGen ? 'opacity-50' : ''}`}
                  title={genVisible ? 'Visible to public' : 'Hidden from public'}
                >
                  {isTogglingGen ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : genVisible ? (
                    <Eye size={14} />
                  ) : (
                    <EyeOff size={14} />
                  )}
                </button>
              )}
            </div>

            <div
              className={`overflow-hidden transition-all duration-200 ${
                isOpen ? 'max-h-[80vh] opacity-100' : 'max-h-0 opacity-0'
              }`}
            >
              <div className="flex flex-col gap-0.5 pl-3 pt-0.5">
                {visibleFormats.map((f) => {
                  const fOpen = openFormat === f;
                  const isActiveFormat = isActiveGen && activeFormat === f;
                  const path = `/${g.slug}/${f}`;
                  const label = FORMAT_LABELS_SHORT[f];
                  const formatVisible = isFormatVisible(g.genNumber, f);
                  const isTogglingThisFormat =
                    togglingFormat?.gen === g.genNumber && togglingFormat?.format === f;

                  return (
                    <div key={f}>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => selectFormat(f)}
                          className={`flex-1 text-left flex items-center gap-1.5 pl-3 pr-2 py-1.5 rounded-md text-[13px] transition-colors border-l-2 ${
                            isActiveFormat
                              ? 'border-ball-500 text-ink-100 bg-ball-500/5'
                              : 'border-ink-700 text-ink-300 hover:text-ink-100 hover:border-ink-500'
                          }`}
                        >
                          <ChevronRight
                            size={12}
                            className={`shrink-0 text-ink-500 transition-transform duration-200 ${
                              fOpen ? 'rotate-90' : ''
                            }`}
                          />
                          <span>{label}</span>
                        </button>

                        {isAdmin && (
                          <button
                            onClick={(e) => handleToggleFormatVisibility(g.genNumber, f, e)}
                            disabled={isTogglingThisFormat}
                            className={`shrink-0 inline-flex items-center justify-center w-7 h-7 rounded-md transition-colors ${
                              formatVisible
                                ? 'text-ball-400 hover:bg-ball-500/10'
                                : 'text-ink-500 hover:bg-ink-800'
                            } ${isTogglingThisFormat ? 'opacity-50' : ''}`}
                            title={formatVisible ? 'Visible to public' : 'Hidden from public'}
                          >
                            {isTogglingThisFormat ? (
                              <Loader2 size={12} className="animate-spin" />
                            ) : formatVisible ? (
                              <Eye size={12} />
                            ) : (
                              <EyeOff size={12} />
                            )}
                          </button>
                        )}
                      </div>

                      <div
                        className={`overflow-hidden transition-all duration-200 ${
                          fOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
                        }`}
                      >
                        <div className="flex flex-col gap-0.5 pl-5 pt-0.5">
                          {ARCHETYPES.map((a) => {
                            const archPath = `${path}/${a.slug}`;
                            const active =
                              isActiveFormat && currentArchetype === a.slug;
                            return (
                              <button
                                key={a.slug}
                                onClick={() => go(archPath)}
                                className={`text-left pl-3 pr-2 py-1.5 rounded-md text-[12px] transition-colors border-l-2 ${
                                  active
                                    ? 'border-ball-500 text-ink-100 bg-ball-500/10'
                                    : 'border-ink-800 text-ink-400 hover:text-ink-200 hover:border-ink-600'
                                }`}
                              >
                                {a.label}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        );
      })}
    </nav>
  );

  return (
    <>
      <aside className="hidden lg:block w-72 shrink-0 border-r border-ink-800 bg-ink-900/60 backdrop-blur sticky top-0 h-screen overflow-y-auto scrollbar-thin">
        {content}
      </aside>

      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-40">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={onCloseMobile}
          />
          <aside className="absolute left-0 top-0 h-full w-80 max-w-[85vw] border-r border-ink-800 bg-ink-900 overflow-y-auto scrollbar-thin animate-fade-in">
            <div className="flex items-center justify-between px-4 py-3 border-b border-ink-800">
              <span className="text-sm font-semibold text-ink-200">Menu</span>
              <button
                onClick={onCloseMobile}
                className="text-ink-400 hover:text-ink-100"
              >
                <X size={18} />
              </button>
            </div>
            {content}
          </aside>
        </div>
      )}
    </>
  );
}

export function MobileMenuButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="lg:hidden inline-flex items-center justify-center w-10 h-10 rounded-lg text-ink-300 hover:text-ink-100 hover:bg-ink-800 transition-colors"
      aria-label="Open menu"
    >
      <Menu size={20} />
    </button>
  );
}

export function YouTubeLink() {
  return (
    <a
      href="https://www.youtube.com/@FerroFodder"
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium text-ink-200 bg-ink-800 hover:bg-ink-750 hover:text-ink-100 transition-colors"
    >
      <Youtube size={16} className="text-ball-500" />
      <span className="hidden sm:inline">YouTube</span>
    </a>
  );
}
