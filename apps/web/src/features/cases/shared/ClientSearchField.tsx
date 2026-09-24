import { useEffect, useState } from 'react';
import type { ClientSearchResultItem } from '@housing360/types';
import { searchClientsByName } from '../../../api/client';

export interface ClientSearchFieldProps {
  label?: string;
  selectedClient: ClientSearchResultItem | null;
  onSelect: (client: ClientSearchResultItem | null) => void;
  required?: boolean;
}

/**
 * A type-to-search client picker, shared by every form in `case-workspace`
 * that needs a "Client" field (New Case, New Referral, …) — built once here
 * rather than duplicated per modal.
 */
export function ClientSearchField({
  label = 'Client',
  selectedClient,
  onSelect,
  required,
}: ClientSearchFieldProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<ClientSearchResultItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length < 2) {
      setResults([]);
      return undefined;
    }
    const handle = setTimeout(() => {
      searchClientsByName(trimmed).then((response) => {
        if (response.success) {
          setResults(response.data);
        }
      });
    }, 300);
    return () => clearTimeout(handle);
  }, [query]);

  if (selectedClient) {
    return (
      <div>
        <label className="mb-2 block text-sm font-semibold text-ink">
          {label}
          {required ? ' *' : ''}
        </label>
        <div className="flex items-center justify-between rounded-md border border-borderStrong bg-surfaceMuted px-5 py-3.5">
          <span className="text-sm text-ink">
            {selectedClient.firstName} {selectedClient.lastName}
          </span>
          <button
            type="button"
            onClick={() => {
              onSelect(null);
              setQuery('');
            }}
            className="text-xs font-semibold text-textMuted hover:text-ink"
          >
            Change
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      <label className="mb-2 block text-sm font-semibold text-ink">
        {label}
        {required ? ' *' : ''}
      </label>
      <input
        type="search"
        value={query}
        onChange={(event) => {
          setQuery(event.target.value);
          setIsOpen(true);
        }}
        onFocus={() => setIsOpen(true)}
        placeholder="Search clients by name"
        className="w-full rounded-md border border-borderStrong bg-surface px-5 py-3.5 text-sm text-ink outline-none transition-colors focus:border-ink"
      />
      {isOpen && results.length > 0 ? (
        <ul className="absolute z-10 mt-1 max-h-56 w-full overflow-y-auto rounded-md border border-borderRow bg-surface shadow-lifted">
          {results.map((client) => (
            <li key={client.id}>
              <button
                type="button"
                onClick={() => {
                  onSelect(client);
                  setIsOpen(false);
                }}
                className="w-full px-5 py-3 text-left text-sm text-ink hover:bg-surfaceHover"
              >
                {client.firstName} {client.lastName}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
