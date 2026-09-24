import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import type { CaseTabKey } from '@housing360/types';
import { ContentAreaTemplate } from '../../components/layout/ContentAreaTemplate';
import { Tabs, ToastProvider } from '../../components/ui';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { clearSelectedCase, fetchCaseDetail } from '../../store/slices/casesSlice';
import { OverviewPanel } from '../../features/cases/panels/OverviewPanel';
import { AssessmentsPanel } from '../../features/cases/panels/AssessmentsPanel';
import { HudDataPanel } from '../../features/cases/panels/HudDataPanel';
import { CaseDetailHeader } from '../../features/cases/header/CaseDetailHeader';
import { EditCaseModal } from '../../features/cases/header/EditCaseModal';
import { PlanPanel } from '../../features/cases/panels/PlanPanel';
import { ServicesPanel } from '../../features/cases/panels/ServicesPanel';
import { ReferralsPanel } from '../../features/cases/panels/ReferralsPanel';
import { HealthWellnessPanel } from '../../features/cases/panels/HealthWellnessPanel';

const TABS: { key: CaseTabKey; label: string }[] = [
  { key: 'overview', label: 'Overview' },
  { key: 'plan', label: 'Plan' },
  { key: 'services', label: 'Services' },
  { key: 'assessments', label: 'Assessments' },
  { key: 'referrals', label: 'Referrals' },
  { key: 'hudData', label: 'HUD Data' },
  { key: 'healthWellness', label: 'Health and Wellness' },
];

export function CaseDetailPage() {
  const { id } = useParams<{ id: string }>();
  const dispatch = useAppDispatch();
  const { case: caseDetail, status, error } = useAppSelector((state) => state.cases.detail);
  const [activeTab, setActiveTab] = useState<CaseTabKey>('overview');
  const [showEditModal, setShowEditModal] = useState(false);

  useEffect(() => {
    if (id) {
      dispatch(fetchCaseDetail(id));
    }
    return () => {
      dispatch(clearSelectedCase());
    };
  }, [dispatch, id]);

  if (status === 'loading' || status === 'idle') {
    return (
      <ContentAreaTemplate title="Case">
        <p className="text-sm text-textMuted">Loading case…</p>
      </ContentAreaTemplate>
    );
  }

  if (status === 'failed' || !caseDetail) {
    return (
      <ContentAreaTemplate title="Case">
        <p className="text-sm text-textMuted">{error ?? 'Case not found.'}</p>
      </ContentAreaTemplate>
    );
  }

  return (
    <ToastProvider>
      <div className="flex flex-col gap-10 px-14 pb-24 pt-2">
        <CaseDetailHeader caseDetail={caseDetail} onEdit={() => setShowEditModal(true)} />

        <div className="overflow-hidden rounded-2xl bg-surface shadow-card">
          <Tabs tabs={TABS} activeKey={activeTab} onChange={(key) => setActiveTab(key as CaseTabKey)} />

          {activeTab === 'overview' ? <OverviewPanel caseDetail={caseDetail} /> : null}
          {activeTab === 'plan' ? <PlanPanel caseId={caseDetail.id} clientId={caseDetail.clientId} /> : null}
          {activeTab === 'services' ? <ServicesPanel clientId={caseDetail.clientId} /> : null}
          {activeTab === 'assessments' ? (
            <AssessmentsPanel
              clientId={caseDetail.clientId}
              caseId={caseDetail.id}
              hasContent={caseDetail.tabsWithContent.assessments}
            />
          ) : null}
          {activeTab === 'referrals' ? <ReferralsPanel caseId={caseDetail.id} /> : null}
          {activeTab === 'hudData' ? <HudDataPanel caseId={caseDetail.id} /> : null}
          {activeTab === 'healthWellness' ? <HealthWellnessPanel clientId={caseDetail.clientId} /> : null}
        </div>
      </div>

      <EditCaseModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        caseDetail={caseDetail}
      />
    </ToastProvider>
  );
}
