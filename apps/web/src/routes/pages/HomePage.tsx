import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ContentAreaTemplate } from '../../components/layout/ContentAreaTemplate';
import { ListCard, StatusBadge, ToastProvider, type PageHeaderAction } from '../../components/ui';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { fetchHomeDashboard } from '../../store/slices/dashboardSlice';
import { IntakeWizard } from '../../features/intake/IntakeWizard';
import { NewCaseModal } from '../../features/cases/newCase/NewCaseModal';
import { formatTaskDueDate, formatWelcomeDate } from '../../features/dashboard/homeDashboardHelpers';

export function HomePage() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const currentUser = useAppSelector((state) => state.auth.currentUser);
  const { home, status } = useAppSelector((state) => state.dashboard);

  const [showWizard, setShowWizard] = useState(false);
  const [showNewCaseModal, setShowNewCaseModal] = useState(false);

  useEffect(() => {
    dispatch(fetchHomeDashboard());
  }, [dispatch]);

  function refetchDashboard() {
    dispatch(fetchHomeDashboard());
  }

  function handleWizardClose() {
    setShowWizard(false);
    refetchDashboard();
  }

  const isLoading = status === 'loading' || status === 'idle';

  const actions: PageHeaderAction[] = [
    { key: 'new-intake', label: 'New Intake', variant: 'secondary', onClick: () => setShowWizard(true) },
    {
      key: 'new-referral',
      label: 'New Referral',
      variant: 'secondary',
      onClick: () => navigate('/coordinated-entry'),
    },
    { key: 'new-case', label: 'New Case', variant: 'secondary', onClick: () => setShowNewCaseModal(true) },
  ];

  const kpiTiles = home
    ? [
        { value: home.kpis.activeCaseload.value, label: 'Active Caseload', subLine: home.kpis.activeCaseload.subLine, tone: 'teal' as const },
        { value: home.kpis.openReferrals.value, label: 'Open Referrals', subLine: home.kpis.openReferrals.subLine, tone: 'gold' as const },
        { value: home.kpis.tasksDueToday.value, label: 'Tasks Due Today', subLine: home.kpis.tasksDueToday.subLine, tone: 'blue' as const },
        { value: home.kpis.assessmentsDue.value, label: 'Assessments Due', subLine: home.kpis.assessmentsDue.subLine, tone: 'coral' as const },
      ]
    : [];

  return (
    <ToastProvider>
      <ContentAreaTemplate
        title={`Welcome, ${currentUser?.firstName ?? ''}`}
        subtitle={formatWelcomeDate(new Date())}
        actions={actions}
        kpiTiles={kpiTiles}
      >
        <div className="grid grid-cols-2 gap-7">
          <ListCard
            title="Today's Tasks"
            items={home?.todaysTasks ?? []}
            isLoading={isLoading}
            emptyMessage="No tasks due today."
            renderItem={(task) => (
              <div className="flex items-center justify-between gap-3 rounded-lg border border-borderRow px-5 py-4">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-ink">{task.title}</p>
                  <p className="text-xs text-textMuted">
                    {task.contextLine} · {formatTaskDueDate(task.dueDate)}
                  </p>
                </div>
                {task.overdue ? <StatusBadge label="Overdue" /> : null}
              </div>
            )}
          />

          <ListCard
            title="Data Quality Alerts"
            items={home?.dataQualityAlerts ?? []}
            isLoading={isLoading}
            emptyMessage="No data quality issues to review."
            renderItem={(alert) => (
              <div className="flex items-center justify-between gap-3 rounded-lg border border-borderRow px-5 py-4">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-ink">{alert.title}</p>
                  <p className="text-xs text-textMuted">{alert.clientName}</p>
                </div>
                <span className="text-xs text-textMuted">{alert.daysOpen}d open</span>
              </div>
            )}
          />
        </div>

        <div className="mt-7 grid grid-cols-2 gap-7">
          <ListCard<{ id: string }>
            title="Today's Appointments"
            items={[]}
            emptyMessage="Appointments aren't tracked yet — this panel is reserved for a future change."
            renderItem={() => null}
          />

          <ListCard<{ id: string }>
            title="Recently Assessed"
            items={[]}
            emptyMessage="Recently assessed clients aren't tracked yet — this panel is reserved for a future change."
            renderItem={() => null}
          />
        </div>
      </ContentAreaTemplate>

      {showWizard ? (
        <IntakeWizard onClose={handleWizardClose} onViewClient={handleWizardClose} />
      ) : null}
      <NewCaseModal isOpen={showNewCaseModal} onClose={() => setShowNewCaseModal(false)} />
    </ToastProvider>
  );
}
