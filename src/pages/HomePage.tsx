import { Youtube, ArrowRight, Sparkles } from 'lucide-react';
import {
  ARCHETYPES,
  GENS,
  formatsForGen,
  archetypeLabel,
  formatLabel,
  genLabel,
} from '../lib/types';
import { useNavigate } from '../lib/router';
import { useAdmin } from '../lib/auth';
import { useVisibility } from '../lib/genVisibility';

export function HomePage() {
  const navigate = useNavigate();
  const { isAdmin } = useAdmin();
  const { genVisibility, isFormatVisible } = useVisibility();

  // Filter generations based on visibility (admins see all)
  const visibleGens = GENS.filter((g) => {
    if (isAdmin) return true;
    return genVisibility.get(g.genNumber) ?? false;
  });

  // Default "Browse Teams" button goes to first visible gen's first visible format's hyper-offense
  const defaultPath = (() => {
    for (const g of visibleGens) {
      const formats = formatsForGen(g.slug);
      for (const f of formats) {
        if (isAdmin || isFormatVisible(g.genNumber, f)) {
          return `/${g.slug}/${f}/hyper-offense`;
        }
      }
    }
    return '/gen9/ou/hyper-offense';
  })();

  return (
    <div className="max-w-4xl mx-auto px-1 animate-fade-in">
      <section className="py-10 sm:py-16">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-ball-500/10 border border-ball-500/30 text-xs font-medium text-ball-300 mb-6">
          <Sparkles size={12} />
          Pokémon Showdown Team Showcase
        </div>
        <h1 className="text-4xl sm:text-6xl font-bold tracking-tight text-ink-100 leading-[1.05]">
          FerroFodder's Teams
        </h1>
        <p className="mt-5 text-lg sm:text-xl text-ink-300 leading-relaxed max-w-2xl">
          Here you can find my teams. <span className="text-ink-100 font-medium">We don't gatekeep here.</span>{' '}
          Have fun!
        </p>

        <div className="mt-7 flex flex-wrap items-center gap-3">
          <a
            href="https://www.youtube.com/@FerroFodder"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-ink-100 bg-ball-500 hover:bg-ball-600 transition-colors"
          >
            <Youtube size={18} />
            Visit the Channel
          </a>
          <button
            onClick={() => navigate(defaultPath)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-ink-200 bg-ink-800 hover:bg-ink-750 hover:text-ink-100 transition-colors"
          >
            Browse Teams
            <ArrowRight size={16} />
          </button>
        </div>
      </section>

      <section className="py-6 border-t border-ink-800">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-ink-400 mb-5">
          Browse by generation
        </h2>
        <div className="space-y-8">
          {visibleGens.map((g) => {
            const allFormats = formatsForGen(g.slug);
            // Filter formats based on visibility (admins see all)
            const visibleFormats = allFormats.filter((f) => {
              if (isAdmin) return true;
              return isFormatVisible(g.genNumber, f);
            });

            if (visibleFormats.length === 0) return null;

            return (
              <div key={g.slug}>
                <h3 className="text-lg font-semibold text-ink-100 mb-3">
                  {genLabel(g.slug)}
                </h3>
                <div className="space-y-3">
                  {visibleFormats.map((f) => (
                    <div key={f}>
                      <div className="text-xs font-medium uppercase tracking-wider text-ink-500 mb-2">
                        {formatLabel(f)}
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                        {ARCHETYPES.map((a) => (
                          <button
                            key={a.slug}
                            onClick={() => navigate(`/${g.slug}/${f}/${a.slug}`)}
                            className="group flex items-center justify-between px-3.5 py-3 rounded-xl border border-ink-800 bg-ink-850/60 hover:border-ball-500/40 hover:bg-ink-800 transition-all"
                          >
                            <span className="text-sm font-medium text-ink-200 group-hover:text-ink-100">
                              {archetypeLabel(a.slug)}
                            </span>
                            <ArrowRight
                              size={14}
                              className="text-ink-500 group-hover:text-ball-400 group-hover:translate-x-0.5 transition-all"
                            />
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
