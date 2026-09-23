import { useState, type KeyboardEvent } from 'react';
import type { ClientSearchResultItem } from '@housing360/types';
import { Button, DataTable, type DataTableColumn } from '../../../components/ui';
import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import { store } from '../../../store';
import {
  ensureCase,
  loadIntakeSnapshot,
  markStepComplete,
  searchClients,
  setActiveEnrollment,
  setCurrentStep,
  setPhase,
} from '../../../store/slices/intakeSlice';

const inputClass =
  'mt-2 w-full rounded-md border border-borderStrong bg-surface px-6 py-4 text-base text-ink outline-none transition-colors focus:border-ink';
const labelClass = 'block text-xs font-semibold uppercase tracking-wide text-textMuted';

function capitalize(value: string | null | undefined): string {
  if (!value) return '—';
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function optionLabel(options: { value: string; label: string }[] | undefined, value: string | null): string {
  if (!value) return '—';
  return options?.find((option) => option.value === value)?.label ?? value;
}

/** `DataTable`'s generic constraint needs an index signature — same pattern as `MyClientsPage`'s `ClientTableRow`. */
interface SearchResultRow extends ClientSearchResultItem, Record<string, unknown> {}

/**
 * Phase A of the intake wizard — "Find Existing Client". Fully self-contained:
 * runs the name search, renders results, and hands off to the form phase
 * itself (dispatching `setPhase('form')`/`setCurrentStep(1)`), whether the
 * case manager picks an existing client or continues as new.
 */
export default function SearchPhase() {
  const dispatch = useAppDispatch();
  const [name, setName] = useState('');
  const { searchResults, searchStatus, searchError } = useAppSelector((state) => state.intake.search);
  const hudOptions = useAppSelector((state) => state.intake.hudOptions.data);

  const hasSearched = searchStatus === 'succeeded' || searchStatus === 'failed';
  const isSearching = searchStatus === 'loading';

  function runSearch() {
    const trimmed = name.trim();
    if (!trimmed) return;
    dispatch(searchClients(trimmed));
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Enter') {
      event.preventDefault();
      runSearch();
    }
  }

  function handleContinueAsNew() {
    dispatch(setPhase('form'));
    dispatch(setCurrentStep(1));
  }

  async function handleSelectClient(client: ClientSearchResultItem) {
    const result = await dispatch(loadIntakeSnapshot(client.id));
    if (!loadIntakeSnapshot.fulfilled.match(result)) {
      return;
    }

    // Family Members is always marked complete on load — the snapshot's
    // `householdMembers` render read-only in step 2 regardless.
    dispatch(markStepComplete(2));

    const snapshot = result.payload;
    const primary =
      snapshot.enrollments.find((enrollment) => enrollment.id === snapshot.primaryEnrollmentId) ??
      snapshot.enrollments[0];

    if (primary) {
      dispatch(setActiveEnrollment(primary.id));
      dispatch(markStepComplete(3));
      dispatch(ensureCase({ clientId: snapshot.clientId, enrollmentId: primary.id }));

      // `setActiveEnrollment` (dispatched just above) synchronously pre-fills
      // `assessment.entryStatus`/`disabilities.items` from the snapshot it
      // already has loaded — read the fresh store state rather than the
      // snapshot payload directly, per the reducer's own contract.
      const freshState = store.getState().intake;
      const sections = freshState.assessment.entryStatus?.sectionsWithValues;
      if (sections?.livingSituation) dispatch(markStepComplete(4));
      if (sections?.incomeBenefitsInsurance) dispatch(markStepComplete(5));
      if (sections?.healthDv) dispatch(markStepComplete(6));
      if (freshState.disabilities.items.length > 0) dispatch(markStepComplete(7));
    }

    dispatch(setPhase('form'));
    dispatch(setCurrentStep(1));
  }

  const columns: DataTableColumn<SearchResultRow>[] = [
    {
      key: 'name',
      header: 'Name',
      cell: (row) => (
        <div>
          <p className="font-semibold text-ink">
            {row.firstName} {row.lastName}
          </p>
          <p className="text-xs text-textMuted">{row.email ?? '—'}</p>
        </div>
      ),
    },
    { key: 'dob', header: 'Date of Birth', cell: (row) => row.dob ?? '—' },
    {
      key: 'ssn',
      header: 'SSN',
      cell: (row) => (row.ssnLast4 ? `••••${row.ssnLast4}` : '—'),
    },
    {
      key: 'relationshipToHoh',
      header: 'Relationship to HoH',
      cell: (row) => optionLabel(hudOptions?.relationshipToHoh, row.relationshipToHoh),
    },
    { key: 'sex', header: 'Sex', cell: (row) => capitalize(row.sex) },
    {
      key: 'veteranStatus',
      header: 'Veteran',
      cell: (row) => optionLabel(hudOptions?.veteranStatus, row.veteranStatus),
    },
  ];

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-7">
      <div className="rounded-lg border border-borderStrong bg-surface p-9">
        <h2 className="font-display text-xl text-ink">Find Existing Client</h2>
        <p className="mt-1 text-sm text-textMuted">
          Search by name to check for an existing record before starting a new intake.
        </p>
        <div className="mt-6 flex items-end gap-4">
          <label className="flex-1">
            <span className={labelClass}>Client Name</span>
            <input
              type="text"
              value={name}
              onChange={(event) => setName(event.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="First or last name"
              className={inputClass}
            />
          </label>
          <Button variant="primary" size="md" disabled={!name.trim() || isSearching} onClick={runSearch}>
            {isSearching ? 'Searching…' : 'Search'}
          </Button>
        </div>
        {searchError ? <p className="mt-4 text-sm font-medium text-coralDeep">{searchError}</p> : null}
      </div>

      {hasSearched ? (
        <div className="rounded-lg border border-borderStrong bg-surface">
          <div className="flex items-center justify-between border-b border-borderRow px-9 py-5.5">
            <h3 className="text-sm font-semibold text-ink">Search Results</h3>
            <Button variant="secondary" size="sm" onClick={handleContinueAsNew}>
              Continue as New Client
            </Button>
          </div>
          {searchResults.length === 0 ? (
            <p className="px-9 py-9 text-sm text-textMuted">
              No matching clients found. You can continue to create a new client.
            </p>
          ) : (
            <DataTable<SearchResultRow>
              columns={columns}
              rows={searchResults as SearchResultRow[]}
              rowKey={(row) => row.id}
              rowActions={[
                {
                  key: 'select',
                  label: 'Select client',
                  icon: <span className="text-xs font-semibold text-tealDeep">Select</span>,
                  onClick: handleSelectClient,
                },
              ]}
            />
          )}
        </div>
      ) : null}
    </div>
  );
}
