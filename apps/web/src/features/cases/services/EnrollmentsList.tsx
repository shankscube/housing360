import { useState } from 'react';
import type { BenefitAssignmentDetail, ProgramEnrollment } from '@housing360/types';
import { Button, ExpandableRow, StatusBadge } from '../../../components/ui';
import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import { fetchServicesByEnrollment } from '../../../store/slices/servicesSlice';
import { caseOptionLabel } from '../shared/caseLabels';

export interface EnrollmentsListProps {
  enrollments: ProgramEnrollment[];
  onAssignService: (enrollment: ProgramEnrollment) => void;
  onAssignBed: (enrollment: ProgramEnrollment) => void;
  onNewDisbursement: (enrollment: ProgramEnrollment, service: BenefitAssignmentDetail) => void;
}

function formatDate(value: string | null): string {
  if (!value) return '—';
  return new Date(value).toLocaleDateString();
}

function ServiceRow({
  service,
  onNewDisbursement,
}: {
  service: BenefitAssignmentDetail;
  onNewDisbursement: () => void;
}) {
  return (
    <ExpandableRow
      summary={
        <div className="flex items-center justify-between gap-3">
          <span className="text-sm text-ink">{service.benefitName}</span>
          <StatusBadge label={caseOptionLabel(service.status)} />
        </div>
      }
    >
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wide text-textMuted">Disbursements</span>
          <button type="button" onClick={onNewDisbursement} className="text-xs font-semibold text-tealDeep hover:underline">
            New Disbursement
          </button>
        </div>
        {service.disbursements.length === 0 ? (
          <p className="text-sm text-textMuted">No disbursements yet.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {service.disbursements.map((disbursement) => (
              <li key={disbursement.id} className="rounded-lg border border-borderRow bg-surface px-4 py-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-ink">{disbursement.disbursementType}</span>
                  <StatusBadge label={caseOptionLabel(disbursement.status)} />
                </div>
                <p className="mt-1 text-xs text-textMuted">{formatDate(disbursement.disbursementDate)}</p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </ExpandableRow>
  );
}

export function EnrollmentsList({ enrollments, onAssignService, onAssignBed, onNewDisbursement }: EnrollmentsListProps) {
  const dispatch = useAppDispatch();
  const { servicesByEnrollment } = useAppSelector((state) => state.services);
  const [search, setSearch] = useState('');

  const filtered = enrollments.filter((enrollment) =>
    enrollment.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex flex-col gap-4">
      <input
        type="search"
        value={search}
        onChange={(event) => setSearch(event.target.value)}
        placeholder="Search enrollments"
        className="w-full rounded-md border border-borderStrong bg-surface px-5 py-3 text-sm text-ink outline-none focus:border-ink"
      />

      {filtered.length === 0 ? (
        <p className="text-sm text-textMuted">No program enrollments for this client.</p>
      ) : (
        filtered.map((enrollment) => (
          <EnrollmentRow
            key={enrollment.id}
            enrollment={enrollment}
            services={servicesByEnrollment[enrollment.id]}
            onExpand={() => dispatch(fetchServicesByEnrollment(enrollment.id))}
            onAssignService={() => onAssignService(enrollment)}
            onAssignBed={() => onAssignBed(enrollment)}
            onNewDisbursement={(service) => onNewDisbursement(enrollment, service)}
          />
        ))
      )}
    </div>
  );
}

function EnrollmentRow({
  enrollment,
  services,
  onExpand,
  onAssignService,
  onAssignBed,
  onNewDisbursement,
}: {
  enrollment: ProgramEnrollment;
  services: BenefitAssignmentDetail[] | undefined;
  onExpand: () => void;
  onAssignService: () => void;
  onAssignBed: () => void;
  onNewDisbursement: (service: BenefitAssignmentDetail) => void;
}) {
  const [hasExpanded, setHasExpanded] = useState(false);

  return (
    <div
      onClick={() => {
        if (!hasExpanded) {
          setHasExpanded(true);
          onExpand();
        }
      }}
    >
      <ExpandableRow
        summary={
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="text-sm font-semibold text-ink">{enrollment.programName}</span>
              {enrollment.isPrimary ? <StatusBadge label="Primary" tone="teal" /> : null}
            </div>
            <div className="flex items-center gap-4 text-xs text-textMuted">
              <StatusBadge label={caseOptionLabel(enrollment.status)} />
              <span>Start {formatDate(enrollment.startDate)}</span>
            </div>
          </div>
        }
      >
        <div className="flex flex-col gap-3">
          <div className="flex justify-end gap-4">
            <Button
              variant="tertiary"
              size="sm"
              onClick={(event) => {
                event.stopPropagation();
                onAssignBed();
              }}
            >
              Assign Bed
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={(event) => {
                event.stopPropagation();
                onAssignService();
              }}
            >
              Assign Service
            </Button>
          </div>
          {!services || services.length === 0 ? (
            <p className="text-sm text-textMuted">No services assigned yet.</p>
          ) : (
            services.map((service) => (
              <ServiceRow key={service.id} service={service} onNewDisbursement={() => onNewDisbursement(service)} />
            ))
          )}
        </div>
      </ExpandableRow>
    </div>
  );
}
