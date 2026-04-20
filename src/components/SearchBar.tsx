import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import Fuse from 'fuse.js';
import { Search, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Campaign, CAMPAIGN_STATUS, ROUTE_PATHS } from '@/lib/index';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

const STATUS_STYLES: Record<string, string> = {
  active:    'bg-emerald-500/15 text-emerald-400 border-emerald-500/25',
  funded:    'bg-blue-500/15 text-blue-400 border-blue-500/25',
  pending:   'bg-amber-500/15 text-amber-400 border-amber-500/25',
  cancelled: 'bg-red-500/15 text-red-400 border-red-500/25',
  rejected:  'bg-red-700/15 text-red-500 border-red-700/25',
  flagged:   'bg-orange-500/15 text-orange-400 border-orange-500/25',
  expired:   'bg-zinc-500/15 text-zinc-400 border-zinc-500/25',
};

type SortMode = 'relevance' | 'raised' | 'newest';

interface SearchBarProps {
  campaigns: Campaign[];
  className?: string;
}

export function SearchBar({ campaigns, className = '' }: SearchBarProps) {
  const [query,  setQuery]  = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [sortBy, setSortBy] = useState<SortMode>('relevance');
  const inputRef     = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Build Fuse index. Weights emphasise title/tag/category matches over
  // description matches so "ai" matches "AI" campaigns before "artificial"
  // appearing deep in a description.
  const fuse = useMemo(() => new Fuse(campaigns, {
    keys: [
      { name: 'title',            weight: 0.4 },
      { name: 'shortDescription', weight: 0.2 },
      { name: 'description',      weight: 0.1 },
      { name: 'category',         weight: 0.15 },
      { name: 'tags',             weight: 0.1 },
      { name: 'creatorId',        weight: 0.05 },
    ],
    threshold: 0.35,
    includeScore: true,
    minMatchCharLength: 2,
  }), [campaigns]);

  const results = useMemo(() => {
    if (!query.trim()) return [];
    const raw = fuse.search(query);
    const sorted = [...raw];
    if (sortBy === 'raised') {
      sorted.sort((a, b) =>
        (b.item.goalAmount > 0 ? b.item.raisedAmount / b.item.goalAmount : 0) -
        (a.item.goalAmount > 0 ? a.item.raisedAmount / a.item.goalAmount : 0)
      );
    } else if (sortBy === 'newest') {
      sorted.sort((a, b) => {
        const na = Number(a.item.id);
        const nb = Number(b.item.id);
        if (Number.isNaN(na) || Number.isNaN(nb)) {
          return (b.item.createdAt ?? '').localeCompare(a.item.createdAt ?? '');
        }
        return nb - na;
      });
    }
    return sorted.slice(0, 8).map(r => r.item);
  }, [query, fuse, sortBy]);

  const clear = useCallback(() => {
    setQuery('');
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const pct = (c: Campaign) =>
    c.goalAmount > 0 ? Math.round((c.raisedAmount / c.goalAmount) * 100) : 0;

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <div className={`flex items-center gap-3 px-4 py-2.5 rounded-xl border transition-all duration-200 ${
        isOpen
          ? 'border-primary/50 bg-card shadow-xl shadow-primary/5 ring-1 ring-primary/15'
          : 'border-border bg-secondary/50 hover:border-border/70'
      }`}>
        <Search className="w-4 h-4 text-muted-foreground shrink-0" />
        <input
          ref={inputRef}
          value={query}
          onChange={e => { setQuery(e.target.value); setIsOpen(true); }}
          onFocus={() => setIsOpen(true)}
          placeholder="Search by name, tag, category, or wallet…"
          className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground/50 min-w-0"
        />
        <AnimatePresence>
          {query && (
            <motion.button
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              onClick={clear}
              className="shrink-0 text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Clear search"
            >
              <X className="w-4 h-4" />
            </motion.button>
          )}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {isOpen && query.trim() && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.99 }}
            animate={{ opacity: 1, y: 0,  scale: 1 }}
            exit={{   opacity: 0, y: -6, scale: 0.99 }}
            transition={{ duration: 0.12 }}
            className="absolute top-full mt-2 left-0 right-0 z-50 rounded-xl border border-border bg-card/95 backdrop-blur-xl shadow-2xl shadow-black/30 overflow-hidden"
          >
            <div className="flex items-center gap-1 px-3 py-2 border-b border-border/50 bg-secondary/20">
              <span className="text-[11px] text-muted-foreground mr-1.5">Sort:</span>
              {(['relevance', 'raised', 'newest'] as SortMode[]).map(s => (
                <button
                  key={s}
                  onClick={() => setSortBy(s)}
                  className={`text-[11px] px-2 py-0.5 rounded-md capitalize transition-colors ${
                    sortBy === s
                      ? 'bg-primary/20 text-primary font-medium'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>

            {results.length === 0 ? (
              <div className="px-4 py-8 text-center text-sm text-muted-foreground">
                No campaigns match &ldquo;{query}&rdquo;
              </div>
            ) : (
              <div className="max-h-[360px] overflow-y-auto">
                {results.map(c => (
                  <Link
                    key={c.id}
                    to={ROUTE_PATHS.CAMPAIGN_DETAIL.replace(':id', c.id)}
                    onClick={() => { setIsOpen(false); setQuery(''); }}
                    className="flex items-center gap-3 px-4 py-3 hover:bg-primary/5 transition-colors group border-b border-border/30 last:border-0"
                  >
                    <div className="w-10 h-10 rounded-lg overflow-hidden shrink-0 bg-secondary">
                      {c.imageUrl && (
                        <img
                          src={c.imageUrl}
                          alt=""
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-sm font-medium truncate group-hover:text-primary transition-colors">
                          {c.title}
                        </span>
                        <Badge
                          variant="outline"
                          className={`text-[10px] px-1.5 py-0 h-4 shrink-0 ${STATUS_STYLES[c.status] ?? ''}`}
                        >
                          {c.status}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] text-muted-foreground">{c.category}</span>
                        {c.tags?.slice(0, 2).map(tag => (
                          <span
                            key={tag}
                            className="text-[10px] px-1.5 py-px rounded bg-secondary/80 text-muted-foreground border border-border/50"
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>
                      {c.status !== CAMPAIGN_STATUS.PENDING && c.status !== CAMPAIGN_STATUS.REJECTED && (
                        <Progress value={pct(c)} className="h-0.5 mt-1.5 bg-secondary" />
                      )}
                    </div>

                    <div className="text-right shrink-0 pl-2">
                      <div className="text-xs font-semibold text-primary tabular-nums">
                        {c.status === CAMPAIGN_STATUS.PENDING ? 'Voting' : `${pct(c)}%`}
                      </div>
                      <div className="text-[10px] text-muted-foreground tabular-nums">
                        {c.raisedAmount.toFixed(2)} ETH
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
