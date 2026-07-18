import { useEffect, useState, useCallback } from 'react';

export function useRoute(): string {
  const [path, setPath] = useState(() => window.location.pathname || '/');

  useEffect(() => {
    const onPop = () => setPath(window.location.pathname || '/');
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  return path;
}

export function navigate(to: string) {
  if (to === (window.location.pathname || '/')) return;
  window.history.pushState({}, '', to);
  window.dispatchEvent(new PopStateEvent('popstate'));
}

export function useNavigate() {
  return useCallback((to: string) => navigate(to), []);
}

export interface ParsedRoute {
  name: 'home' | 'team-list' | 'search' | 'admin-login';
  gen?: string;
  format?: string;
  archetype?: string;
}

export function parseRoute(path: string): ParsedRoute {
  const clean = path.replace(/\/+$/, '') || '/';
  if (clean === '/') return { name: 'home' };

  const parts = clean.split('/').filter(Boolean);
  if (parts.length === 2 && parts[0] === 'admin' && parts[1] === 'login') {
    return { name: 'admin-login' };
  }
  if (parts.length === 1 && parts[0] === 'search') {
    return { name: 'search' };
  }
  if (parts.length === 3) {
    return {
      name: 'team-list',
      gen: parts[0],
      format: parts[1],
      archetype: parts[2],
    };
  }
  return { name: 'home' };
}
