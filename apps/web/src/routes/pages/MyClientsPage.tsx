import { useEffect, useState } from 'react';
import type { ClientFilter, ClientListItem } from '@housing360/types';
import { ContentAreaTemplate } from '../../components/layout/ContentAreaTemplate';
import { Button, DataTable, FilterChipRow, StatusBadge, type DataTableColumn } from '../../components/ui';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import {
  fetchClients,
  setListFilter,
  setListPage,
  setSearchTerm,
} from '../../store/slices/clientsSlice';
import { IntakeWizard } from '../../features/intake/IntakeWizard';

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
  programStatus: 'Program Status',
} as const;

/**
 * `active`/`pending` map to the bundle's own "Enrolled"/"Awaiting referral"
 * program-status words (already registered in `statusToneByLabel.ts`, teal/
 * gold respectively). Any other non-null status (e.g. `exited`) falls back to
 * its capitalized raw value, which resolves to the map's deemphasized default
 * tone rather than the bundle's third word, "Intake started" — that word
 * specifically means "has a case but no active/pending enrollment yet", a
 * distinction `ClientListItem.primaryEnrollmentStatus` can't make on its own
 * (it only reflects enrollment status, not case existence). A real fix needs
 * that signal added to the list payload — flagged, not fixed, here.
 */
function programStatusLabel(status: string | null): string | null {
  if (!status) return null;
  if (status === 'active') return 'Enrolled';
  if (status === 'pending') return 'Awaiting referral';
  return status.charAt(0).toUpperCase() + status.slice(1);
}

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
  const [showWizard, setShowWizard] = useState(false);

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

  function refetchList() {
    dispatch(fetchClients({ page, pageSize, filter, search }));
  }

  function handleWizardClose() {
    setShowWizard(false);
    refetchList();
  }

  function handleViewClient() {
    // No client-detail screen exists yet (see design.md's Open Questions) —
    // the newest client sorts to the top of an unfiltered, first-page list
    // (`findClients` orders by `createdAt desc`), so surfacing it just means
    // clearing any active filter/search and jumping to page 1, then closing.
    setShowWizard(false);
    setSearchInput('');
    dispatch(setSearchTerm(''));
    dispatch(setListFilter('all'));
    dispatch(setListPage(1));
  }

  const columns: DataTableColumn<ClientTableRow>[] = [
    {
      key: 'name',
      header: COLUMN_LABELS.name,
      cell: (row) => `${row.firstName} ${row.lastName}`,
    },
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
    {
      key: 'raceEthnicity',
      header: COLUMN_LABELS.raceEthnicity,
      // Raw HUD codes, joined — resolving to labels needs the HUD option
      // lists this screen doesn't otherwise load (see intake's `hudOptions`
      // thunk); a reasonable simplification, not a data gap.
      cell: (row) => row.raceEthnicity.join(', ') || '—',
    },
    {
      key: 'programStatus',
      header: COLUMN_LABELS.programStatus,
      cell: (row) => {
        const label = programStatusLabel(row.primaryEnrollmentStatus);
        return label ? <StatusBadge label={label} /> : '—';
      },
    },
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
            <Button variant="secondary" size="sm" onClick={() => setShowWizard(true)}>
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

        <div className="bg-surfaceMuted px-9 py-4">
          <p className="text-xs text-textMuted">
            Columns follow HUD Universal Data Elements. Duplicate check on name + DOB + SSN runs
            before any new record is created.
          </p>
        </div>

        <DataTable<ClientTableRow>
          columns={columns}
          // `ClientListItem` structurally lacks an index signature, so it
          // doesn't satisfy `ClientTableRow`'s `Record<string, unknown>` half
          // without a cast, even though `ClientTableRow extends ClientListItem`.
          rows={items as ClientTableRow[]}
          rowKey={(row) => row.id}
          isLoading={status === 'loading'}
          emptyMessage={emptyMessage}
          pagination={{ page, pageSize, total, onPageChange: (nextPage) => dispatch(setListPage(nextPage)) }}
        />
      </div>

      {showWizard ? (
        <IntakeWizard onClose={handleWizardClose} onViewClient={handleViewClient} />
      ) : null}
    </ContentAreaTemplate>
  );
}
