import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { supabase } from './supabase';
import { adminCall } from './auth';
import type { GenVisibility, Format } from './types';

interface FormatVisibilityRow {
  gen: number;
  format: Format;
  visible: boolean;
  updated_at: string;
}

interface VisibilityContextValue {
  genVisibility: Map<number, boolean>;
  formatVisibility: Map<string, boolean>;
  loading: boolean;
  toggleGenVisibility: (gen: number, visible: boolean) => Promise<void>;
  toggleFormatVisibility: (gen: number, format: string, visible: boolean) => Promise<void>;
  isFormatVisible: (gen: number, format: string) => boolean;
  refresh: () => Promise<void>;
}

const VisibilityContext = createContext<VisibilityContextValue | undefined>(undefined);

function formatKey(gen: number, format: string): string {
  return `${gen}-${format}`;
}

export function VisibilityProvider({ children }: { children: ReactNode }) {
  const [genVisibility, setGenVisibility] = useState<Map<number, boolean>>(new Map());
  const [formatVisibility, setFormatVisibility] = useState<Map<string, boolean>>(new Map());
  const [loading, setLoading] = useState(true);

  const fetchVisibility = useCallback(async () => {
    try {
      const [genResult, formatResult] = await Promise.all([
        supabase
          .from('gen_visibility')
          .select('gen, visible, updated_at')
          .order('gen', { ascending: true }),
        supabase
          .from('format_visibility')
          .select('gen, format, visible, updated_at')
          .order('gen', { ascending: true }),
      ]);

      if (genResult.error) throw genResult.error;
      if (formatResult.error) throw formatResult.error;

      const genMap = new Map<number, boolean>();
      (genResult.data as GenVisibility[]).forEach((row) => {
        genMap.set(row.gen, row.visible);
      });
      setGenVisibility(genMap);

      const formatMap = new Map<string, boolean>();
      (formatResult.data as FormatVisibilityRow[]).forEach((row) => {
        formatMap.set(formatKey(row.gen, row.format), row.visible);
      });
      setFormatVisibility(formatMap);
    } catch {
      // On error, default gens 1-9 visible, 10-12 hidden; all formats visible
      const defaultGenMap = new Map<number, boolean>();
      for (let i = 1; i <= 12; i++) {
        defaultGenMap.set(i, i <= 9);
      }
      setGenVisibility(defaultGenMap);
      setFormatVisibility(new Map());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchVisibility();
  }, [fetchVisibility]);

  const toggleGenVisibility = useCallback(async (gen: number, visible: boolean) => {
    const result = await adminCall({ action: 'toggleGenVisibility', gen, visible });
    if (!result.ok) {
      throw new Error(result.error ?? 'Failed to update gen visibility');
    }
    setGenVisibility((prev) => {
      const next = new Map(prev);
      next.set(gen, visible);
      return next;
    });
  }, []);

  const toggleFormatVisibility = useCallback(async (gen: number, format: string, visible: boolean) => {
    const result = await adminCall({ action: 'toggleFormatVisibility', gen, format, visible });
    if (!result.ok) {
      throw new Error(result.error ?? 'Failed to update format visibility');
    }
    const key = formatKey(gen, format);
    setFormatVisibility((prev) => {
      const next = new Map(prev);
      next.set(key, visible);
      return next;
    });
  }, []);

  const isFormatVisible = useCallback((gen: number, format: string): boolean => {
    const key = formatKey(gen, format);
    return formatVisibility.get(key) ?? true; // Default to visible if not found
  }, [formatVisibility]);

  return (
    <VisibilityContext.Provider
      value={{
        genVisibility,
        formatVisibility,
        loading,
        toggleGenVisibility,
        toggleFormatVisibility,
        isFormatVisible,
        refresh: fetchVisibility,
      }}
    >
      {children}
    </VisibilityContext.Provider>
  );
}

export function useVisibility() {
  const ctx = useContext(VisibilityContext);
  if (!ctx) throw new Error('useVisibility must be used within VisibilityProvider');
  return ctx;
}
