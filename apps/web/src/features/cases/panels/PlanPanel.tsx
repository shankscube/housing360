import { useEffect, useState } from 'react';
import type { CarePlanDetail, GoalAssignmentDetail } from '@housing360/types';
import { Button } from '../../../components/ui';
import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import { fetchCarePlansByCase } from '../../../store/slices/carePlansSlice';
import { CarePlanList } from '../plan/CarePlanList';
import { CarePlanWizard, type CarePlanWizardMode } from '../plan/CarePlanWizard';
import { ServiceGapBanner } from '../plan/ServiceGapBanner';
import { NewTaskModal } from '../shared/NewTaskModal';

export interface PlanPanelProps {
  caseId: string;
  clientId: string;
}

interface WizardState {
  mode: CarePlanWizardMode;
  plan?: CarePlanDetail | null;
  goal?: GoalAssignmentDetail | null;
}

export function PlanPanel({ caseId, clientId }: PlanPanelProps) {
  const dispatch = useAppDispatch();
  const { plans, plansStatus } = useAppSelector((state) => state.carePlans);
  const [wizard, setWizard] = useState<WizardState | null>(null);
  const [taskGoal, setTaskGoal] = useState<GoalAssignmentDetail | null>(null);

  useEffect(() => {
    dispatch(fetchCarePlansByCase(caseId));
  }, [dispatch, caseId]);

  return (
    <div className="flex flex-col gap-7 px-9 py-8">
      <ServiceGapBanner caseId={caseId} clientId={clientId} />

      <div className="flex items-center justify-between">
        <h2 className="font-display text-lg font-semibold text-ink">Care Plans</h2>
        <div className="flex gap-4">
          <Button variant="secondary" size="sm" onClick={() => setWizard({ mode: 'create' })}>
            New from Template
          </Button>
          <Button variant="primary" size="sm" onClick={() => setWizard({ mode: 'create' })}>
            New Care Plan
          </Button>
        </div>
      </div>

      {plansStatus === 'loading' ? <p className="text-sm text-textMuted">Loading…</p> : null}

      <CarePlanList
        plans={plans}
        onNewTaskForGoal={setTaskGoal}
        onEditPlan={(plan) => setWizard({ mode: 'editPlan', plan })}
        onAddGoal={(plan) => setWizard({ mode: 'addGoal', plan })}
        onEditGoal={(goal) => setWizard({ mode: 'editGoal', goal })}
      />

      {wizard ? (
        <CarePlanWizard
          isOpen
          onClose={() => setWizard(null)}
          caseId={caseId}
          clientId={clientId}
          mode={wizard.mode}
          existingPlan={wizard.plan}
          existingGoal={wizard.goal}
        />
      ) : null}

      {taskGoal ? (
        <NewTaskModal
          isOpen
          onClose={() => setTaskGoal(null)}
          clientId={clientId}
          caseId={caseId}
          goalAssignmentId={taskGoal.id}
        />
      ) : null}
    </div>
  );
}
