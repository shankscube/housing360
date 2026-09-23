import { useEffect, useState } from 'react';
import type { ClientFilter, ClientListItem } from '@housing360/types';
import { ContentAreaTemplate } from '../../components/layout/ContentAreaTemplate';
import { Button, DataTable, FilterChipRow, type DataTableColumn } from '../../components/ui';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import {
  fetchClients,
  setListFilter,
  setListPage,
  setSearchTerm,
} from '../../store/slices/clientsSlice';
import { NewIntakeForm } from './clients/NewIntakeForm';

const FILTER_OPTIONS: { value: ClientFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
  { value: 'withProgram', label: 'With Program' },
  { value: 'withoutProgram', label: 'Without Program' },
  { value: 'withCases', label: 'With Cases' },
  { value: 'withoutCases', label: 'Without Cases' },
];

const SEX_LABELS: Record<string, string> = { male: 'Male', female: 'Female', other: 'Other' };

const COLUMN_LABELS = {
  name: 'Name',
  ssn: 'SSN',
  dob: 'Date of Birth',
  sex: 'Sex',
  raceEthnicity: 'Race and Ethnicity',
} as const;

/**
 * `DataTable`'s row type must satisfy `Record<string, unknown>`. `ClientListItem`
 * (from `@housing360/types`, not editable here) is a plain interface, so this
 * local row type carries the same shape while satisfying that constraint —
 * mirrors the pattern already used in `ui-preview/stories/DataTable.stories.tsx`.
 */
interface ClientTableRow extends ClientListItem, Record<string, unknown> {}

export function MyClientsPage() {
  const dispatch = useAppDispatch();
  const { items, status, filter, search, page, pageSize, total } = useAppSelector(
    (state) => state.clients.list
  );

  const [searchInput, setSearchInput] = useState(search);
  const [showIntakeForm, setShowIntakeForm] = useState(false);

  // Debounce the search box into the store's search term rather than
  // dispatching (and re-fetching) on every keystroke.
  useEffect(() => {
    const handle = setTimeout(() => {
      dispatch(setSearchTerm(searchInput));
    }, 300);
    return () => clearTimeout(handle);
  }, [searchInput, dispatch]);

  useEffect(() => {
    dispatch(fetchClients({ page, pageSize, filter, search }));
  }, [dispatch, page, pageSize, filter, search]);

  function handleFilterChange(value: string) {
    dispatch(setListFilter(value as ClientFilter));
  }

  function handleClientCreated() {
    setShowIntakeForm(false);
    dispatch(fetchClients({ page, pageSize, filter, search }));
  }

  const columns: DataTableColumn<ClientTableRow>[] = [
    { key: 'name', header: COLUMN_LABELS.name, cell: (row) => row.name },
    {
      key: 'ssn',
      header: COLUMN_LABELS.ssn,
      numeric: true,
      // ClientListItem omits ssn entirely (list responses never carry it, by
      // design — see spec's "Sensitive Fields Excluded From List Responses").
      // There is therefore no real value to mask here; this renders a fixed
      // placeholder rather than fetching the detail endpoint per row just to
      // mask a value, which would defeat the point of excluding it from the
      // list payload. Follow-up worth considering: a per-row "reveal" action
      // that hits GET /api/clients/:id on demand.
      cell: () => '••••••••',
    },
    {
      key: 'dob',
      header: COLUMN_LABELS.dob,
      numeric: true,
      // Same reasoning as SSN above — DOB is also omitted from ClientListItem.
      cell: () => '••••••••',
    },
    { key: 'sex', header: COLUMN_LABELS.sex, cell: (row) => SEX_LABELS[row.sex] ?? row.sex },
    { key: 'raceEthnicity', header: COLUMN_LABELS.raceEthnicity, cell: (row) => row.raceEthnicity },
  ];

  const hasActiveFilterOrSearch = filter !== 'all' || search.trim() !== '';
  const emptyMessage = hasActiveFilterOrSearch
    ? 'No clients match these filters.'
    : 'No clients yet.';

  return (
    <ContentAreaTemplate
      title="My Clients"
      subtitle="Manage client records, households, and intake."
    >
      <div className="overflow-hidden rounded-2xl bg-surface shadow-card">
        <div className="flex flex-col gap-5 px-9 py-7">
          <div className="flex flex-wrap items-center justify-between gap-6">
            <FilterChipRow options={FILTER_OPTIONS} activeValue={filter} onChange={handleFilterChange} />
            <Button variant="secondary" size="sm" onClick={() => setShowIntakeForm((open) => !open)}>
              New Intake
            </Button>
          </div>
          <input
            type="search"
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            placeholder="Search clients by name"
            aria-label="Search clients by name"
            className="w-full rounded-md border border-borderStrong bg-surface px-7 py-4 text-base text-ink outline-none transition-colors focus:border-ink"
          />
        </div>

        {showIntakeForm ? (
          <NewIntakeForm onCreated={handleClientCreated} onCancel={() => setShowIntakeForm(false)} />
        ) : null}

        <div className="bg-surfaceMuted px-9 py-4">
          <p className="text-xs text-textMuted">
            Columns follow HUD Universal Data Elements. Duplicate check on name + DOB + SSN runs
            before any new record is created.
          </p>
        </div>

        <DataTable<ClientTableRow>
          columns={columns}
          rows={items}
          rowKey={(row) => row.id}
          isLoading={status === 'loading'}
          emptyMessage={emptyMessage}
          pagination={{ page, pageSize, total, onPageChange: (nextPage) => dispatch(setListPage(nextPage)) }}
        />
      </div>
    </ContentAreaTemplate>
  );
}
