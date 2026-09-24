import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { AppointmentItem, RecentActivityItem } from '@housing360/types';
import { ContentAreaTemplate } from '../../components/layout/ContentAreaTemplate';
import { Icon, ListCard, StatusBadge, ToastProvider, type IconName, type PageHeaderAction } from '../../components/ui';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { fetchHomeDashboard } from '../../store/slices/dashboardSlice';
import { IntakeWizard } from '../../features/intake/IntakeWizard';
import { NewCaseModal } from '../../features/cases/newCase/NewCaseModal';
import { NewReferralModal } from '../../features/cases/referrals/NewReferralModal';
import { TaskDetailModal } from '../../features/tasks/TaskDetailModal';
import { formatTaskDueDate, formatWelcomeDate } from '../../features/dashboard/homeDashboardHelpers';

interface AppointmentRow extends AppointmentItem {
  id: string;
}

interface ActivityRow extends RecentActivityItem {
  id: string;
}

export function HomePage() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const currentUser = useAppSelector((state) => state.auth.currentUser);
  const { home, status } = useAppSelector((state) => state.dashboard);

  const [showWizard, setShowWizard] = useState(false);
  const [showNewCaseModal, setShowNewCaseModal] = useState(false);
  const [showNewReferralModal, setShowNewReferralModal] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);

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

  function handleNewCaseClose() {
    setShowNewCaseModal(false);
    refetchDashboard();
  }

  function handleNewReferralClose() {
    setShowNewReferralModal(false);
    refetchDashboard();
  }

  function handleTaskModalClose() {
    setSelectedTaskId(null);
  }

  function handleTaskSaved() {
    setSelectedTaskId(null);
    refetchDashboard();
  }

  function openRecentActivityRecord(item: RecentActivityItem) {
    if (item.recordType === 'case') {
      navigate(`/cases/${item.recordId}`);
    } else if (item.recordType === 'assessment') {
      navigate(`/assessments/${item.recordId}`);
    }
    // client/referral rows have no dedicated detail route yet — non-navigating,
    // same documented gap as the Recently Modified page.
  }

  const isLoading = status === 'loading' || status === 'idle';

  const actions: PageHeaderAction[] = [
    { key: 'new-intake', label: 'New Intake', variant: 'secondary', onClick: () => setShowWizard(true) },
    {
      key: 'new-referral',
      label: 'New Referral',
      variant: 'secondary',
      onClick: () => setShowNewReferralModal(true),
    },
    { key: 'new-case', label: 'New Case', variant: 'secondary', onClick: () => setShowNewCaseModal(true) },
  ];

  const kpiTiles = home
    ? [
        {
          value: home.kpis.activeCaseload.value,
          label: 'Active Caseload',
          subLine: home.kpis.activeCaseload.subLine,
          tone: 'teal' as const,
          onClick: () => navigate('/cases?filter=myCaseload'),
        },
        {
          value: home.kpis.openReferrals.value,
          label: 'Open Referrals',
          subLine: home.kpis.openReferrals.subLine,
          tone: 'gold' as const,
          onClick: () => navigate('/referrals'),
        },
        {
          value: home.kpis.tasksDueToday.value,
          label: 'Tasks Due Today',
          subLine: home.kpis.tasksDueToday.subLine,
          tone: 'blue' as const,
          onClick: () => navigate('/tasks?filter=due_today'),
        },
        {
          value: home.kpis.assessmentsDue.value,
          label: 'Assessments Due',
          subLine: home.kpis.assessmentsDue.subLine,
          tone: 'coral' as const,
          onClick: () => navigate('/assessments?filter=dueToday'),
        },
      ]
    : [];

  const appointmentRows: AppointmentRow[] = (home?.todaysAppointments ?? []).map((item) => ({
    ...item,
    id: item.caseId,
  }));

  const activityRows: ActivityRow[] = (home?.recentlyAccessed ?? []).map((item) => ({
    ...item,
    id: `${item.recordType}-${item.recordId}`,
  }));

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
            emptyMessage="No open tasks assigned to you."
            renderItem={(task) => (
              <button
                type="button"
                onClick={() => setSelectedTaskId(task.id)}
                className="flex w-full items-center justify-between gap-3 rounded-lg border border-borderRow px-5 py-4 text-left transition-colors hover:bg-surfaceMuted"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-ink">{task.title}</p>
                  <p className="text-xs text-textMuted">
                    {task.contextLine} · {formatTaskDueDate(task.dueDate)}
                  </p>
                </div>
                {task.overdue ? <StatusBadge label="Overdue" /> : null}
              </button>
            )}
          />

          <ListCard
            title="Data Quality Alerts"
            items={home?.dataQualityAlerts ?? []}
            isLoading={isLoading}
            emptyMessage="No open data quality issues."
            renderItem={(alert) => (
              <button
                type="button"
                onClick={() => navigate('/clients')}
                className="flex w-full items-center gap-3 rounded-lg border border-borderRow px-5 py-4 text-left transition-colors hover:bg-surfaceMuted"
              >
                <span aria-hidden className="h-2.5 w-2.5 shrink-0 rounded-full bg-coral" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-ink">{alert.title}</p>
                  <p className="text-xs text-textMuted">{alert.clientName}</p>
                </div>
                <span className="shrink-0 text-xs text-textMuted">{alert.daysOpen}d open</span>
              </button>
            )}
          />
        </div>

        <div className="mt-7 grid grid-cols-2 gap-7">
          <ListCard<AppointmentRow>
            title="Today's Appointments"
            headerAction={{ label: 'Calendar', onClick: () => navigate('/calendar') }}
            items={appointmentRows}
            isLoading={isLoading}
            emptyMessage="No follow-ups scheduled for today."
            renderItem={(appointment) => (
              <button
                type="button"
                onClick={() => navigate(`/cases/${appointment.caseId}`)}
                className="flex w-full items-center justify-between gap-3 rounded-lg border border-borderRow px-5 py-4 text-left transition-colors hover:bg-surfaceMuted"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-ink">{appointment.caseNumber}</p>
                  <p className="text-xs text-textMuted">{appointment.clientName}</p>
                </div>
                <span className="shrink-0 text-xs text-textMuted">{appointment.milestone}</span>
              </button>
            )}
          />

          <ListCard<ActivityRow>
            title="Recently Accessed"
            headerAction={{ label: 'View All', onClick: () => navigate('/recent') }}
            items={activityRows}
            isLoading={isLoading}
            emptyMessage="Nothing updated in your caseload yet."
            renderItem={(item) => {
              const clickable = item.recordType === 'case' || item.recordType === 'assessment';
              return (
                <div
                  onClick={clickable ? () => openRecentActivityRecord(item) : undefined}
                  className={`flex items-center gap-4 rounded-lg border border-borderRow px-5 py-4 ${
                    clickable ? 'cursor-pointer transition-colors hover:bg-surfaceMuted' : ''
                  }`}
                >
                  <span className="flex h-9 w-9 flex-none items-center justify-center rounded-full bg-surfaceSubtle text-ink">
                    <Icon name={item.icon as IconName} size={16} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-ink">{item.title}</p>
                    <p className="truncate text-xs text-textMuted">{item.subtitle}</p>
                  </div>
                </div>
              );
            }}
          />
        </div>
      </ContentAreaTemplate>

      {showWizard ? (
        <IntakeWizard onClose={handleWizardClose} onViewClient={handleWizardClose} />
      ) : null}
      <NewCaseModal isOpen={showNewCaseModal} onClose={handleNewCaseClose} />
      <NewReferralModal isOpen={showNewReferralModal} onClose={handleNewReferralClose} />
      <TaskDetailModal taskId={selectedTaskId} onClose={handleTaskModalClose} onSaved={handleTaskSaved} />
    </ToastProvider>
  );
}
