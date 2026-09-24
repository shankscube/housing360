import { useEffect, useState } from 'react';
import type { BedAssignment, BenefitAssignmentDetail, ProgramEnrollment } from '@housing360/types';
import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import { fetchClientEnrollmentsForServices } from '../../../store/slices/servicesSlice';
import { EnrollmentsList } from '../services/EnrollmentsList';
import { AssignServiceModal } from '../services/AssignServiceModal';
import { DisbursementForm } from '../services/DisbursementForm';
import { AssignBedModal } from '../services/AssignBedModal';
import { DailyLogView } from '../services/DailyLogView';

export interface ServicesPanelProps {
  clientId: string;
}

export function ServicesPanel({ clientId }: ServicesPanelProps) {
  const dispatch = useAppDispatch();
  const { enrollments, enrollmentsStatus } = useAppSelector((state) => state.services);

  const [assignServiceFor, setAssignServiceFor] = useState<ProgramEnrollment | null>(null);
  const [assignBedFor, setAssignBedFor] = useState<ProgramEnrollment | null>(null);
  const [disbursementTarget, setDisbursementTarget] = useState<{
    enrollment: ProgramEnrollment;
    service: BenefitAssignmentDetail;
  } | null>(null);
  const [dailyLogAssignment, setDailyLogAssignment] = useState<BedAssignment | null>(null);

  useEffect(() => {
    dispatch(fetchClientEnrollmentsForServices(clientId));
  }, [dispatch, clientId]);

  return (
    <div className="flex flex-col gap-7 px-9 py-8">
      <h2 className="font-display text-lg font-semibold text-ink">Program Enrollments</h2>

      {enrollmentsStatus === 'loading' ? <p className="text-sm text-textMuted">Loading…</p> : null}

      <EnrollmentsList
        enrollments={enrollments}
        onAssignService={setAssignServiceFor}
        onAssignBed={setAssignBedFor}
        onNewDisbursement={(enrollment, service) => setDisbursementTarget({ enrollment, service })}
      />

      {assignServiceFor ? (
        <AssignServiceModal isOpen onClose={() => setAssignServiceFor(null)} enrollment={assignServiceFor} />
      ) : null}

      {assignBedFor ? (
        <AssignBedModal
          isOpen
          onClose={() => setAssignBedFor(null)}
          enrollment={assignBedFor}
          onAssigned={(assignment) => setDailyLogAssignment(assignment)}
        />
      ) : null}

      {disbursementTarget ? (
        <DisbursementForm
          isOpen
          onClose={() => setDisbursementTarget(null)}
          clientId={clientId}
          enrollmentId={disbursementTarget.enrollment.id}
          service={disbursementTarget.service}
        />
      ) : null}

      {dailyLogAssignment ? (
        <DailyLogView isOpen onClose={() => setDailyLogAssignment(null)} bedAssignment={dailyLogAssignment} />
      ) : null}
    </div>
  );
}
