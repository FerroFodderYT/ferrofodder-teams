import { useState } from 'react';
import { LogOut } from 'lucide-react';
import { AdminProvider, useAdmin } from './lib/auth';
import { VisibilityProvider } from './lib/genVisibility';
import { useRoute, parseRoute, useNavigate } from './lib/router';
import { Sidebar, MobileMenuButton, YouTubeLink } from './components/Sidebar';
import { HomePage } from './pages/HomePage';
import { TeamListPage } from './pages/TeamListPage';
import { SearchPage } from './pages/SearchPage';
import { AdminLoginPage } from './pages/AdminLoginPage';

function AdminBadge() {
  const { isAdmin, signOut } = useAdmin();
  if (!isAdmin) return null;
  return (
    <button
      onClick={signOut}
      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-ink-300 hover:text-ball-300 hover:bg-ink-800 transition-colors"
      title="Sign out of admin"
    >
      <LogOut size={15} />
      <span className="hidden sm:inline">Sign out</span>
    </button>
  );
}

function Header({ onOpenMobile }: { onOpenMobile: () => void }) {
  const navigate = useNavigate();
  return (
    <header className="sticky top-0 z-30 flex items-center justify-between gap-3 px-4 sm:px-6 h-14 border-b border-ink-800 bg-ink-950/80 backdrop-blur">
      <div className="flex items-center gap-2">
        <MobileMenuButton onClick={onOpenMobile} />
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 text-left"
        >
          <span className="text-base font-bold tracking-tight text-ink-100">
            FerroFodder's Teams
          </span>
        </button>
      </div>
      <div className="flex items-center gap-2">
        <YouTubeLink />
        <AdminBadge />
      </div>
    </header>
  );
}

function Shell() {
  const path = useRoute();
  const route = parseRoute(path);
  const [mobileOpen, setMobileOpen] = useState(false);

  if (route.name === 'admin-login') {
    return <AdminLoginPage />;
  }

  return (
    <div className="min-h-screen flex bg-ink-950">
      <Sidebar
        currentGen={route.gen}
        currentFormat={route.format}
        currentArchetype={route.archetype}
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
      />

      <div className="flex-1 min-w-0 flex flex-col">
        <Header onOpenMobile={() => setMobileOpen(true)} />
        <main className="flex-1 px-4 sm:px-6 lg:px-10 py-6 sm:py-8">
          {route.name === 'home' && <HomePage />}
          {route.name === 'search' && <SearchPage />}
          {route.name === 'team-list' && (
            <TeamListPage
              gen={route.gen!}
              format={route.format!}
              archetype={route.archetype!}
            />
          )}
        </main>
        <footer className="px-4 sm:px-6 lg:px-10 py-6 border-t border-ink-900 text-xs text-ink-500">
          FerroFodder's Teams · No gatekeeping. Have fun.
        </footer>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AdminProvider>
      <VisibilityProvider>
        <Shell />
      </VisibilityProvider>
    </AdminProvider>
  );
}
