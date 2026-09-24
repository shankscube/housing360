import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import type { SearchResultItem, SearchResponse } from '@housing360/types';
import { clearResults, runSearch, setQuery } from '../../store/slices/searchSlice';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { Icon } from '../../components/ui';
import type { IconName } from '../../components/ui';

const GROUP_ORDER: { key: keyof SearchResponse['groups']; label: string }[] = [
  { key: 'clients', label: 'Clients' },
  { key: 'cases', label: 'Cases' },
  { key: 'referrals', label: 'Referrals' },
  { key: 'tasks', label: 'Tasks' },
  { key: 'assessments', label: 'Assessments' },
];

/** White card + soft lift — matches TopBar's existing search-card treatment. */
const controlCardClass = 'flex items-center rounded-lg bg-surface shadow-control';

/**
 * Result types with nowhere record-specific to land yet: no client detail
 * route exists (My Clients' own row click just clears filters — same
 * documented gap), and a referral result has no `caseId` to route through, so
 * both land on their owning list screen. A task result lands on the Tasks
 * page (no per-task route exists — `TasksPage` opens a detail modal from its
 * own table instead), same reasoning.
 */
function resolveRoute(item: SearchResultItem): string | null {
  switch (item.type) {
    case 'client':
      return '/clients';
    case 'case':
      return `/cases/${item.id}`;
    case 'referral':
      return '/referrals';
    case 'task':
      return '/tasks';
    case 'assessment':
      return `/assessments/${item.id}`;
    default:
      return null;
  }
}

function flattenGroups(results: SearchResponse | null): SearchResultItem[] {
  if (!results) return [];
  const flat: SearchResultItem[] = [];
  for (const { key } of GROUP_ORDER) {
    flat.push(...results.groups[key]);
  }
  return flat;
}

function isEveryGroupEmpty(results: SearchResponse | null): boolean {
  if (!results) return true;
  return GROUP_ORDER.every(({ key }) => results.groups[key].length === 0);
}

export function GlobalSearchDropdown() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const query = useAppSelector((state) => state.search.query);
  const status = useAppSelector((state) => state.search.status);
  const results = useAppSelector((state) => state.search.results);

  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const blurTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Debounce keystrokes 300ms before dispatching runSearch — same
  // setTimeout/clearTimeout-in-a-useEffect pattern CasesPage.tsx uses for its
  // own search input.
  useEffect(() => {
    if (query.trim().length === 0) {
      dispatch(clearResults());
      return;
    }
    const handle = setTimeout(() => {
      dispatch(runSearch(query));
    }, 300);
    return () => clearTimeout(handle);
  }, [query, dispatch]);

  const flatResults = useMemo(() => flattenGroups(results), [results]);

  useEffect(() => {
    setHighlightedIndex(-1);
  }, [results]);

  useEffect(() => {
    return () => {
      if (blurTimeoutRef.current) clearTimeout(blurTimeoutRef.current);
    };
  }, []);

  const showDropdown = isOpen && query.trim().length > 0 && status !== 'idle';

  function handleSelect(item: SearchResultItem) {
    const route = resolveRoute(item);
    if (!route) {
      // Non-navigable result (task) — leave the dropdown open, do nothing.
      return;
    }
    navigate(route);
    dispatch(clearResults());
    setIsOpen(false);
  }

  function handleFocus() {
    if (blurTimeoutRef.current) {
      clearTimeout(blurTimeoutRef.current);
      blurTimeoutRef.current = null;
    }
    setIsOpen(true);
  }

  function handleBlur() {
    // Short delay so a click on a dropdown row registers before the panel
    // unmounts — the standard "blur then click" race every dropdown needs.
    blurTimeoutRef.current = setTimeout(() => {
      setIsOpen(false);
    }, 150);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      if (flatResults.length === 0) return;
      setHighlightedIndex((current) => (current + 1) % flatResults.length);
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      if (flatResults.length === 0) return;
      setHighlightedIndex((current) => (current - 1 + flatResults.length) % flatResults.length);
    } else if (event.key === 'Enter') {
      const highlighted = flatResults[highlightedIndex];
      if (highlighted) {
        event.preventDefault();
        handleSelect(highlighted);
      }
    } else if (event.key === 'Escape') {
      event.preventDefault();
      // Closes without navigating — query/results are intentionally left
      // alone here (only a navigated selection clears them, see handleSelect).
      setIsOpen(false);
      event.currentTarget.blur();
    }
  }

  let globalIndex = -1;

  return (
    <div className="relative min-w-kpiMinWidth max-w-formCardWidth flex-1">
      <div className={`${controlCardClass} gap-4 px-6 py-4.5`}>
        <span className="shrink-0 text-textMuted">
          <Icon name="search" size={15} strokeWidth={2} />
        </span>
        <input
          type="search"
          value={query}
          placeholder="Search clients, cases, referrals..."
          onChange={(event) => dispatch(setQuery(event.target.value))}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          className="w-full border-0 bg-transparent text-base text-ink outline-none placeholder:text-textMuted"
        />
      </div>

      {showDropdown ? (
        <div className="absolute left-0 right-0 top-full z-50 mt-2 overflow-y-auto rounded-lg bg-surface shadow-card">
          {status === 'loading' ? (
            <p className="px-6 py-5 text-sm text-textMuted">Searching…</p>
          ) : isEveryGroupEmpty(results) ? (
            <p className="px-6 py-5 text-sm text-textMuted">No matches found.</p>
          ) : (
            <div className="py-2">
              {GROUP_ORDER.map(({ key, label }) => {
                const items = results?.groups[key] ?? [];
                if (items.length === 0) return null;
                return (
                  <div key={key}>
                    <p className="px-6 pb-1 pt-3 text-2xs font-semibold uppercase tracking-wide text-textFaint">
                      {label}
                    </p>
                    {items.map((item) => {
                      globalIndex += 1;
                      const isHighlighted = globalIndex === highlightedIndex;
                      const navigable = resolveRoute(item) !== null;
                      return (
                        <div
                          key={`${item.type}-${item.id}`}
                          onMouseEnter={() => setHighlightedIndex(globalIndex)}
                          onClick={navigable ? () => handleSelect(item) : undefined}
                          className={`flex items-center gap-4 px-6 py-3 ${
                            navigable ? 'cursor-pointer' : 'cursor-default'
                          } ${isHighlighted ? 'bg-surfaceMuted' : 'hover:bg-surfaceHover'}`}
                        >
                          <span className="shrink-0 text-textMuted">
                            <Icon name={item.icon as IconName} size={15} />
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-sm font-semibold text-ink">{item.title}</span>
                            <span className="block truncate text-xs text-textMuted">{item.subtitle}</span>
                          </span>
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}
